"""
Answer Evaluation Engine.
Evaluates individual interview responses against a strict 6-factor weighted rubric:
- Technical correctness: 25%
- Relevance: 20%
- Communication clarity: 15%
- Problem-solving: 15%
- Practical examples: 15%
- Answer structure: 10%
Total: 100%
"""

import re
from typing import Dict, Any, List
from app.services.ai_provider import call_ai, extract_json_from_text
from app.schemas.evaluation import ScoreBreakdown, AnswerEvaluationResponse

def is_non_substantive_response(text: str) -> bool:
    """Detects whether candidate input is empty, gibberish, greetings, audio tests, or non-technical chatter."""
    cleaned = text.strip().lower()
    if not cleaned:
        return True
    
    words = re.findall(r"\b[a-zA-Z0-9']+\b", cleaned)
    if len(words) < 5:
        # Less than 5 words is never an acceptable technical answer in a senior developer interview
        return True

    # Repeated simple words like "hi hi hi", "test test test", "no no no"
    greeting_chatter = {"hi", "hello", "hey", "test", "testing", "ok", "okay", "yes", "yeah", "yep", "no", "nope", "audible", "mic", "check", "ha", "haha", "hahaha", "am", "i", "you", "can", "hear", "me"}
    if all(w in greeting_chatter for w in words):
        return True
    
    unique_words = set(words)
    if len(unique_words) <= 2 and len(words) >= 3:
        return True

    # Low lexical diversity (e.g. repeated gibberish)
    if len(words) >= 5 and (len(unique_words) / len(words)) < 0.35:
        return True

    patterns = [
        r"^(hi|hello|hey|test(ing)?|ok|okay|yes|yeah|yep|no|nope|audible|can you hear me)(\s+(hi|hello|hey|test(ing)?|ok|okay|yes|yeah|yep|no|nope|audible|can you hear me))*\.?$",
        r"^(i am|am i)\s+(audible|here|listening|testing)\.?$",
        r"^(check|mic check|sound check|1\s*2\s*3)\.?$",
        r"^(i\s+(don'?t|do\s+not)\s+know|no\s+idea|skip|pass|dunno|nothing)\.?$",
        r"^(good\s+(morning|afternoon|evening)|how\s+are\s+you(\s+doing)?)\.?$",
    ]
    return any(re.search(p, cleaned) for p in patterns)

def evaluate_candidate_answer(
    question_number: int,
    question_text: str,
    candidate_answer: str,
    expected_concepts: List[str],
    company: str = "Google",
    role: str = "Software Engineer",
    difficulty: str = "Intermediate",
) -> AnswerEvaluationResponse:
    """
    Evaluates candidate response using LLM with grounded rubric and clamped scoring.
    Strictly assigns 0.0 for non-substantive, gibberish, or greeting inputs (like 'hi hi hi').
    """
    trimmed_answer = (candidate_answer or "").strip()
    if is_non_substantive_response(trimmed_answer):
        # Candidate provided no substantive technical response (e.g. 'hi hi hi', mic check, silence)
        scores = ScoreBreakdown(
            technical_correctness=0.0,
            relevance=0.0,
            communication_clarity=0.0,
            problem_solving=0.0,
            practical_examples=0.0,
            answer_structure=0.0,
            overall_score=0.0,
        )
        return AnswerEvaluationResponse(
            question_number=question_number,
            question_text=question_text,
            candidate_answer=trimmed_answer or "[No answer provided]",
            scores=scores,
            strengths=[],
            weaknesses=["Response did not contain substantive technical explanation or relevance to the question."],
            missing_concepts=expected_concepts or ["Technical architecture", "Production engineering trade-offs"],
            correct_technical_explanation="A valid technical response must address the engineering problem directly with relevant design or implementation details.",
            improved_sample_answer="Start with your high-level architectural approach, explain the core technologies, and discuss how you address scalability and edge-case failures.",
            specific_feedback="No technical answer was provided (received non-technical text, greeting, or mic check). Provide an engineering explanation to receive a score."
        )

    system_prompt = (
        "You are an experienced, fair Senior Engineering Leader and Technical Hiring Lead evaluating a candidate's live interview answer.\n\n"
        "EVALUATION CRITERIA (Total: 100 points):\n"
        "1. technical_correctness (max 25.0 points): Sound engineering knowledge, valid concepts, technologies mentioned, or core principles.\n"
        "2. relevance (max 20.0 points): How directly the response addresses the question asked.\n"
        "3. communication_clarity (max 15.0 points): Articulation, structured explanation, and professional clarity. Do NOT penalize simple or casual English.\n"
        "4. problem_solving (max 15.0 points): Methodological thinking, rationale behind decisions, or awareness of trade-offs.\n"
        "5. practical_examples (max 15.0 points): Citing real projects, tools, frameworks, languages (e.g. Python, Flask, React, SQL), or past implementation experience.\n"
        "6. answer_structure (max 10.0 points): Organization and flow of thoughts.\n\n"
        "CRITICAL SCORING GUIDANCE:\n"
        "- Award FAIR, ACCURATE credit for what the candidate actually demonstrated. If the candidate mentions their tech stack (e.g. Python, Flask, PostgreSQL), their experience, or their project architecture, award substantial credit across relevance, communication, practical examples, and technical correctness (typical score: 65-85+ points).\n"
        "- For introductory or background questions (Question 1 or 2), evaluate how effectively the candidate introduced themselves, their skills, and their project experience. Do NOT expect complex algorithmic proofs for an introduction question!\n"
        "- ONLY assign 0.0 if the answer is completely blank, pure spam/gibberish, a pure microphone check ('can you hear me'), or a total refusal to answer ('pass', 'skip', 'idk'). If the candidate attempted an answer with real words or background, ALWAYS score based on merit.\n"
        "- Return ONLY valid JSON matching the schema."
    )

    user_prompt = f"""
TARGET POSITION: {role} at {company} ({difficulty} Level)
QUESTION #{question_number}: {question_text}
EXPECTED KEY CONCEPTS: {', '.join(expected_concepts) if expected_concepts else 'Core role fundamentals'}

CANDIDATE'S ACTUAL ANSWER:
\"\"\"{trimmed_answer}\"\"\"

Evaluate the answer and return ONLY a JSON object with this exact structure:
{{
    "scores": {{
        "technical_correctness": float (0.0 to 25.0),
        "relevance": float (0.0 to 20.0),
        "communication_clarity": float (0.0 to 15.0),
        "problem_solving": float (0.0 to 15.0),
        "practical_examples": float (0.0 to 15.0),
        "answer_structure": float (0.0 to 10.0)
    }},
    "strengths": ["1 concise strength"],
    "weaknesses": ["1 concise gap"],
    "missing_concepts": ["1-2 key concepts"],
    "correct_technical_explanation": "1-2 sentence core technical explanation",
    "improved_sample_answer": "2-3 sentence high-quality model response",
    "specific_feedback": "1 actionable advice sentence"
}}
Keep all explanations crisp and under 2 sentences to minimize token consumption.
"""

    messages = [
        {"role": "system", "content": system_prompt},
        {"role": "user", "content": user_prompt},
    ]

    try:
        reply = call_ai(
            messages=messages,
            max_tokens=350,
            temperature=0.3,
            response_format={"type": "json_object"}
        )
        parsed = extract_json_from_text(reply)
        raw_scores = parsed.get("scores", {})

        # Clamp all scores strictly to their specified maximum limits
        t_corr = max(0.0, min(25.0, float(raw_scores.get("technical_correctness", 15.0))))
        rel = max(0.0, min(20.0, float(raw_scores.get("relevance", 12.0))))
        comm = max(0.0, min(15.0, float(raw_scores.get("communication_clarity", 10.0))))
        ps = max(0.0, min(15.0, float(raw_scores.get("problem_solving", 9.0))))
        pe = max(0.0, min(15.0, float(raw_scores.get("practical_examples", 9.0))))
        struct = max(0.0, min(10.0, float(raw_scores.get("answer_structure", 7.0))))

        # If technical correctness and relevance are both negligible, or the answer was an evasion,
        # clamp all scores to 0.0 so no pity or participation points are awarded.
        # Otherwise, award accurate proportional credit for valid engineering explanations.
        if (t_corr <= 2.0 and rel <= 2.0) or (t_corr + rel <= 5.0):
            t_corr = 0.0
            rel = 0.0
            comm = 0.0
            ps = 0.0
            pe = 0.0
            struct = 0.0
            overall = 0.0
        else:
            overall = round(t_corr + rel + comm + ps + pe + struct, 1)

        scores = ScoreBreakdown(
            technical_correctness=round(t_corr, 1),
            relevance=round(rel, 1),
            communication_clarity=round(comm, 1),
            problem_solving=round(ps, 1),
            practical_examples=round(pe, 1),
            answer_structure=round(struct, 1),
            overall_score=overall,
        )

        return AnswerEvaluationResponse(
            question_number=question_number,
            question_text=question_text,
            candidate_answer=trimmed_answer,
            scores=scores,
            strengths=(parsed.get("strengths") or []) if overall > 0 else [],
            weaknesses=parsed.get("weaknesses") or ["Response lacked direct engineering relevance to the question."],
            missing_concepts=parsed.get("missing_concepts") or (expected_concepts[:3] if expected_concepts else []),
            correct_technical_explanation=parsed.get("correct_technical_explanation", "A complete answer addresses algorithmic complexity, architectural patterns, and production edge cases."),
            improved_sample_answer=parsed.get("improved_sample_answer", "State the core approach, evaluate edge cases, and discuss scalability considerations."),
            specific_feedback=parsed.get("specific_feedback", "Structure your answer with context, approach, and tradeoffs.")
        )

    except Exception as err:
        print(f"[Answer Evaluator fallback activated]: {err}")
        # Deterministic heuristic fallback
        if is_non_substantive_response(trimmed_answer) or len(trimmed_answer.split()) < 6:
            scores = ScoreBreakdown(
                technical_correctness=0.0,
                relevance=0.0,
                communication_clarity=0.0,
                problem_solving=0.0,
                practical_examples=0.0,
                answer_structure=0.0,
                overall_score=0.0,
            )
            return AnswerEvaluationResponse(
                question_number=question_number,
                question_text=question_text,
                candidate_answer=trimmed_answer or "[No response provided]",
                scores=scores,
                strengths=[],
                weaknesses=["No substantive technical answer provided."],
                missing_concepts=expected_concepts[:3] if expected_concepts else ["Technical architecture"],
                correct_technical_explanation="Please provide a technical answer directly addressing the problem.",
                improved_sample_answer="Begin by clarifying assumptions, outline your solution with time/space complexity, and discuss how it handles scale.",
                specific_feedback="Explain your technical solution directly to receive an interview evaluation."
            )

        base_score = 60.0 if len(trimmed_answer.split()) > 20 else 35.0
        scores = ScoreBreakdown(
            technical_correctness=round(base_score * 0.25, 1),
            relevance=round(base_score * 0.20, 1),
            communication_clarity=round(base_score * 0.15, 1),
            problem_solving=round(base_score * 0.15, 1),
            practical_examples=round(base_score * 0.15, 1),
            answer_structure=round(base_score * 0.10, 1),
            overall_score=round(base_score, 1),
        )
        return AnswerEvaluationResponse(
            question_number=question_number,
            question_text=question_text,
            candidate_answer=trimmed_answer,
            scores=scores,
            strengths=["Attempted to address the question."],
            weaknesses=["Needs more concrete technical detail and edge case handling."],
            missing_concepts=expected_concepts[:3] if expected_concepts else ["Technical precision", "Trade-offs"],
            correct_technical_explanation="In an interview, clearly explain your reasoning, runtime complexity, and potential bottlenecks.",
            improved_sample_answer="Begin by clarifying assumptions, outline your solution with time/space complexity, and discuss how it handles scale.",
            specific_feedback="Elaborate further with specific technologies and practical production scenarios."
        )
