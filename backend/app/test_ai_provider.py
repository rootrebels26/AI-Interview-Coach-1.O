import os
from dotenv import load_dotenv

load_dotenv("ai-interview-coach/backend/.env")

from app.services.ai_provider import call_ai, extract_json_from_text

def test_text_generation():
    print("Testing call_ai text response...")
    messages = [
        {"role": "system", "content": "You are a professional AI interviewer. Speak concisely in 1 sentence."},
        {"role": "user", "content": "Introduce yourself to the candidate."}
    ]
    reply = call_ai(messages, max_tokens=60, temperature=0.3)
    print(f"Generated text reply: {reply}\n")
    assert len(reply) > 10
    print("Text Generation Test PASSED!")

def test_json_generation():
    print("Testing call_ai structured JSON response...")
    messages = [
        {"role": "system", "content": "You are an AI assistant. You MUST return ONLY valid JSON."},
        {"role": "user", "content": 'Return a JSON object with keys "status" ("ready") and "question_number" (1).'}
    ]
    reply = call_ai(
        messages,
        max_tokens=60,
        temperature=0.2,
        response_format={"type": "json_object"}
    )
    print(f"Generated JSON string: {reply}")
    parsed = extract_json_from_text(reply)
    print(f"Parsed JSON dict: {parsed}\n")
    assert parsed.get("status") == "ready"
    assert parsed.get("question_number") == 1
    print("JSON Generation Test PASSED!")

if __name__ == "__main__":
    test_text_generation()
    test_json_generation()
