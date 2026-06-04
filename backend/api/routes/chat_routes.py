"""Interview chat API routes for AI interaction and session saving."""

from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from models import db, Interview
import os
from groq import Groq
from dotenv import load_dotenv
from services.company_question_profiles import build_interview_prompt
from services.speech_service import prepare_spoken_reply

load_dotenv()

chat_bp = Blueprint('chat', __name__)
client = Groq(api_key=os.getenv("GROQ_API_KEY"))

UNRELATED_TERMS = {
    "weather", "movie", "movies", "song", "songs", "music", "recipe", "recipes",
    "cook", "cooking", "sports", "cricket", "football", "politics", "election",
    "news", "celebrity", "dating", "relationship", "game", "games", "joke",
    "travel", "hotel", "shopping", "price", "stock", "crypto"
}

INTERVIEW_TERMS = {
    "interview", "question", "answer", "explain", "clarify", "example", "approach",
    "solution", "complexity", "project", "experience", "role", "company"
}

SUBJECT_TERMS = {
    "technical": {"algorithm", "data", "structure", "code", "coding", "debug", "complexity", "software"},
    "software_developer": {"algorithm", "data", "structure", "code", "coding", "debug", "complexity", "software"},
    "frontend": {"frontend", "react", "javascript", "css", "html", "browser", "ui", "accessibility", "state"},
    "backend": {"backend", "api", "database", "cache", "queue", "server", "system", "latency", "scale"},
    "behavioral": {"leadership", "team", "conflict", "ownership", "impact", "feedback", "challenge", "collaboration"},
    "data_science": {"data", "model", "statistics", "sql", "experiment", "metric", "machine", "learning", "analysis"},
    "fullstack": {"frontend", "backend", "api", "database", "react", "system", "ui", "server", "fullstack"},
    "general": {"interview", "project", "experience", "strength", "weakness", "career", "role", "team"},
}


def is_unrelated_candidate_question(message, subject):
    text = (message or "").strip().lower()
    if not text:
        return False

    asks_question = "?" in text or text.startswith((
        "what ", "why ", "how ", "who ", "when ", "where ", "can you ", "tell me ",
        "give me ", "write ", "make ", "suggest "
    ))
    if not asks_question:
        return False

    words = set(text.replace("?", " ").replace(",", " ").replace(".", " ").split())
    subject_words = SUBJECT_TERMS.get(subject, SUBJECT_TERMS["general"])

    has_unrelated_term = bool(words & UNRELATED_TERMS)
    has_interview_context = bool(words & INTERVIEW_TERMS) or bool(words & subject_words)

    return has_unrelated_term and not has_interview_context

@chat_bp.route('/interact', methods=['POST'])
@jwt_required()
def interact():
    data = request.get_json()
    messages = data.get('messages', [])
    subject = data.get('subject', 'general')
    company = data.get('company', 'General')
    behavior = data.get('behavior')
    last_user_message = next((m.get("content", "") for m in reversed(messages) if m.get("role") == "user"), "")

    if is_unrelated_candidate_question(last_user_message, subject):
        response_text = (
            "I can only continue with your selected interview subject. "
            "Let's stay focused on the interview. Now, tell me about a relevant experience or approach for this role."
        )
        return jsonify({
            "reply": response_text,
            "speech_text": prepare_spoken_reply(response_text),
        }), 200
    
    system_prompt = {
        "role": "system",
        "content": build_interview_prompt(subject, company)
    }

    if behavior:
        behavior_prompt = {
            "role": "system",
            "content": (
                "Use this live non-verbal interview signal as light coaching context. "
                "Mention it only when useful, keep it supportive, and do not claim medical, "
                f"emotion, or identity analysis: {behavior}"
            )
        }
        groq_messages = [system_prompt, behavior_prompt] + messages
    else:
        groq_messages = [system_prompt] + messages

    try:
        completion = client.chat.completions.create(
            model="llama-3.1-8b-instant",
            messages=groq_messages,
            temperature=0.45,
            max_tokens=220
        )
        
        response_text = completion.choices[0].message.content
        return jsonify({
            "reply": response_text,
            "speech_text": prepare_spoken_reply(response_text),
        }), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@chat_bp.route('/save', methods=['POST'])
@jwt_required()
def save_interview():
    user_id = get_jwt_identity()
    data = request.get_json()
    conversation = data.get('conversation')
    subject = data.get('subject', 'general')
    
    new_interview = Interview(user_id=user_id, conversation=conversation, subject=subject)
    db.session.add(new_interview)
    db.session.commit()
    
    return jsonify({"msg": "Interview saved", "id": new_interview.id}), 201
