"""
Free-first AI Provider Service for Standalone AI Interview Coach.
Supports Groq free tier with intelligent auto-switching and rate-limit cooldowns,
Gemini free tier (fallback), and OpenRouter free routes (fallback).
"""

import os
import json
import re
import time
from typing import List, Dict, Any, Optional
import httpx
from app.config import settings

# Verified active Groq models ordered by direct JSON compliance & token speed
DEFAULT_GROQ_MODELS = [
    "qwen/qwen3.8-27b",
    "allam-2-7b",
    "openai/gpt-oss-20b",
    "openai/gpt-oss-120b",
]

# In-memory cooldown tracker for models that hit 429 rate limits
_model_cooldowns: Dict[str, float] = {}

def get_groq_client():
    """Initializes Groq client if key is present."""
    api_key = settings.GROQ_API_KEY or os.getenv("GROQ_API_KEY", "")
    if api_key and not api_key.startswith("gsk_your_") and not api_key.startswith("your_"):
        try:
            from groq import Groq
            return Groq(api_key=api_key.strip())
        except Exception as e:
            print(f"[Groq Init Error]: {e}")
    return None

def get_gemini_client():
    """Initializes Google GenAI client if key is present."""
    api_key = settings.GEMINI_API_KEY or os.getenv("GEMINI_API_KEY", "")
    if api_key and not api_key.startswith("your_"):
        try:
            from google import genai
            return genai.Client(api_key=api_key.strip())
        except Exception as e:
            print(f"[Gemini Init Error]: {e}")
    return None

def extract_json_from_text(text: str) -> Dict[str, Any]:
    """Robustly extracts and parses JSON from LLM text output."""
    text = text.strip()
    
    # 1. Direct parse attempt
    try:
        return json.loads(text)
    except Exception:
        pass

    # 2. Extract from markdown fenced code block
    fenced_match = re.search(r'```(?:json)?\s*([\s\S]*?)\s*```', text, re.IGNORECASE)
    if fenced_match:
        try:
            return json.loads(fenced_match.group(1).strip())
        except Exception:
            pass

    # 3. Search for outermost curly braces
    first_brace = text.find("{")
    last_brace = text.rfind("}")
    if first_brace != -1 and last_brace != -1 and last_brace > first_brace:
        try:
            return json.loads(text[first_brace:last_brace + 1].strip())
        except Exception:
            pass

    raise ValueError(f"Could not extract valid JSON from LLM output: {text[:200]}...")

def get_healthy_groq_models(model_override: Optional[str] = None) -> List[str]:
    """Returns Groq models prioritized by health and rate-limit cooldown status."""
    now = time.time()
    
    # Clean up expired cooldowns
    expired = [m for m, cd in _model_cooldowns.items() if now >= cd]
    for m in expired:
        del _model_cooldowns[m]

    candidate_models = []
    if model_override:
        candidate_models.append(model_override)
    if settings.GROQ_MODEL and settings.GROQ_MODEL not in candidate_models:
        candidate_models.append(settings.GROQ_MODEL)
    for m in DEFAULT_GROQ_MODELS:
        if m not in candidate_models:
            candidate_models.append(m)

    # Put cooled-down models at the end of the line
    active_models = [m for m in candidate_models if m not in _model_cooldowns]
    cooldown_models = [m for m in candidate_models if m in _model_cooldowns]
    return active_models + cooldown_models

def call_groq(
    messages: List[Dict[str, str]],
    model_override: Optional[str] = None,
    max_tokens: int = 500,
    temperature: float = 0.4,
    response_format: Optional[Dict[str, str]] = None
) -> str:
    """
    Calls Groq API across verified free models with intelligent auto-switching
    and automatic max_tokens reduction upon 429 OTPM warnings.
    """
    client = get_groq_client()
    if not client:
        raise RuntimeError("No valid GROQ_API_KEY configured in environment.")

    models_to_try = get_healthy_groq_models(model_override)
    last_error = None

    for model_name in models_to_try:
        # Check if model has a known small OTPM limit like qwen3.8-27b
        effective_max_tokens = max_tokens
        if "qwen3.8-27b" in model_name and effective_max_tokens > 450:
            effective_max_tokens = 450

        # Try model with potential token reduction retry
        attempts = [effective_max_tokens, max(150, int(effective_max_tokens * 0.55))]
        model_succeeded = False

        for token_limit in attempts:
            try:
                kwargs = {
                    "model": model_name,
                    "messages": messages,
                    "temperature": temperature,
                    "max_tokens": token_limit,
                }
                if response_format:
                    kwargs["response_format"] = response_format

                completion = client.chat.completions.create(**kwargs)
                content = completion.choices[0].message.content
                if content and content.strip():
                    return content.strip()
            except Exception as err:
                err_str = str(err)
                last_error = err

                # If token limit was exceeded on output tokens per minute (OTPM), retry with reduced tokens
                if ("OTPM" in err_str or "reduce max_tokens" in err_str or "exceeds limit" in err_str) and token_limit == attempts[0]:
                    print(f"[Groq Token Optimization]: Model '{model_name}' OTPM tight. Retrying with reduced max_tokens={attempts[1]}...")
                    continue

                # If 429 rate limit or quota exceeded, mark cooldown and switch to next model immediately
                if "429" in err_str or "rate_limit_exceeded" in err_str:
                    _model_cooldowns[model_name] = time.time() + 60.0
                    print(f"[Auto-Switching Model]: Groq model '{model_name}' rate limited (429). Switching to next available model in pool...")
                    break  # break out of attempt loop to try next model

                # For 400 json validation error (common when models run out of token buffer before closing JSON)
                if "json_validate_failed" in err_str:
                    print(f"[Groq JSON Validation]: '{model_name}' hit token limit before closing JSON. Switching model...")
                    break

                print(f"[Groq model '{model_name}' failed]: {err}")
                break

    raise last_error or RuntimeError("All Groq models failed to respond.")

def call_gemini(
    messages: List[Dict[str, str]],
    model: Optional[str] = None,
    max_tokens: int = 500,
    temperature: float = 0.4,
    response_format: Optional[Dict[str, str]] = None
) -> str:
    """
    Direct, zero-dependency REST API implementation of Google Gemini free tier.
    Automatically handles system instructions, multi-turn dialogue, and structured JSON output.
    """
    api_key = settings.GEMINI_API_KEY or os.getenv("GEMINI_API_KEY", "")
    if not api_key or api_key.startswith("your_") or api_key.startswith("AIza_your_"):
        raise RuntimeError("No valid GEMINI_API_KEY configured in environment.")

    # Prioritized healthy Gemini models on v1beta endpoint (use modern 2.5-flash / flash-latest)
    pref_model = model or settings.GEMINI_MODEL or "gemini-2.5-flash"
    if pref_model in ("gemini-1.5-flash", "gemini-1.5-pro"):
        pref_model = "gemini-2.5-flash"

    gemini_models = [
        pref_model,
        "gemini-2.5-flash",
        "gemini-flash-latest",
        "gemini-2.5-pro",
        "gemini-pro-latest"
    ]
    seen = set()
    models_to_try = []
    for m in gemini_models:
        if m and m not in seen:
            seen.add(m)
            models_to_try.append(m)

    system_parts = []
    contents = []

    for m in messages:
        role = m.get("role", "user").lower()
        text = m.get("content", "").strip()
        if not text:
            continue
        if role == "system":
            system_parts.append(text)
        elif role in ("assistant", "interviewer", "model"):
            contents.append({
                "role": "model",
                "parts": [{"text": text}]
            })
        else:
            contents.append({
                "role": "user",
                "parts": [{"text": text}]
            })

    if not contents:
        contents = [{"role": "user", "parts": [{"text": "\n\n".join(system_parts) or "Hello"}]}]

    gen_config: Dict[str, Any] = {
        "temperature": temperature,
        "maxOutputTokens": max_tokens,
    }

    if response_format and response_format.get("type") == "json_object":
        gen_config["responseMimeType"] = "application/json"

    payload: Dict[str, Any] = {
        "contents": contents,
        "generationConfig": gen_config
    }

    if system_parts:
        payload["systemInstruction"] = {
            "parts": [{"text": "\n\n".join(system_parts)}]
        }

    last_err = None
    with httpx.Client(timeout=30.0) as client:
        for model_id in models_to_try:
            url = f"https://generativelanguage.googleapis.com/v1beta/models/{model_id}:generateContent?key={api_key.strip()}"
            try:
                resp = client.post(url, json=payload)
                if resp.status_code == 200:
                    data = resp.json()
                    candidates = data.get("candidates", [])
                    if candidates and "content" in candidates[0] and "parts" in candidates[0]["content"]:
                        text = candidates[0]["content"]["parts"][0].get("text", "").strip()
                        if text:
                            print(f"[Gemini Switch Success]: Automatically handled request using Gemini model '{model_id}'")
                            return text
                else:
                    err_msg = resp.text[:150]
                    print(f"[Gemini model '{model_id}' failed HTTP {resp.status_code}]: {err_msg}")
                    last_err = RuntimeError(f"Gemini HTTP {resp.status_code}: {err_msg}")
            except Exception as e:
                print(f"[Gemini model '{model_id}' error]: {e}")
                last_err = e

    raise last_err or RuntimeError("All Gemini models failed to generate content.")

def call_openrouter(
    messages: List[Dict[str, str]],
    model: Optional[str] = None,
    max_tokens: int = 500,
    temperature: float = 0.4
) -> str:
    """Calls OpenRouter free routes as secondary fallback."""
    api_key = settings.OPENROUTER_API_KEY or os.getenv("OPENROUTER_API_KEY", "")
    if not api_key or api_key.startswith("your_"):
        raise RuntimeError("No valid OPENROUTER_API_KEY configured in environment.")

    model_name = model or settings.OPENROUTER_MODEL or "meta-llama/llama-3.3-70b-instruct:free"

    headers = {
        "Authorization": f"Bearer {api_key.strip()}",
        "Content-Type": "application/json",
        "HTTP-Referer": "http://localhost:5173",
        "X-Title": "AI Interview Coach",
    }
    payload = {
        "model": model_name,
        "messages": messages,
        "temperature": temperature,
        "max_tokens": max_tokens,
    }

    with httpx.Client(timeout=25.0) as client:
        response = client.post(
            "https://openrouter.ai/api/v1/chat/completions",
            headers=headers,
            json=payload,
        )
        response.raise_for_status()
        data = response.json()
        content = data["choices"][0]["message"]["content"]
        if content and content.strip():
            return content.strip()

    raise RuntimeError("OpenRouter failed to return content.")

def call_ai(
    messages: List[Dict[str, str]],
    max_tokens: int = 500,
    temperature: float = 0.4,
    response_format: Optional[Dict[str, str]] = None
) -> str:
    """
    Main dispatch entry point:
    1. Tries Groq free tier with automatic model rotation across healthy models.
    2. Fallback: If Groq has errors, rate-limits, or fails, automatically switches to Gemini.
    3. Fallback: OpenRouter free routes.
    4. If all fail, raises clean exception.
    """
    errors = []

    # 1. Groq Free Tier (Auto-rotates models)
    try:
        return call_groq(
            messages=messages,
            max_tokens=max_tokens,
            temperature=temperature,
            response_format=response_format
        )
    except Exception as e:
        print(f"[Groq Failover Notice]: Groq unavailable or rate limited ({e}). Automatically switching to Gemini...")
        errors.append(f"Groq: {str(e)}")

    # 2. Gemini Free Tier Fallback (Automatic instant switch!)
    try:
        return call_gemini(
            messages=messages,
            max_tokens=max_tokens,
            temperature=temperature,
            response_format=response_format
        )
    except Exception as e:
        print(f"[Gemini Failover Notice]: Gemini failed ({e}). Trying secondary fallbacks...")
        errors.append(f"Gemini: {str(e)}")

    # 3. OpenRouter Free Tier Fallback
    try:
        return call_openrouter(
            messages=messages,
            max_tokens=max_tokens,
            temperature=temperature
        )
    except Exception as e:
        errors.append(f"OpenRouter: {str(e)}")

    # If all free routes failed
    error_summary = " | ".join(errors)
    raise RuntimeError(
        f"Free AI inference error: Free tier models are currently unavailable or quotas are exhausted. ({error_summary}). Please verify your GROQ_API_KEY and GEMINI_API_KEY in backend/.env."
    )
