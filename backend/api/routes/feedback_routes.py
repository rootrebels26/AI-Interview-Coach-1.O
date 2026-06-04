"""Feedback, history, public stats, and admin analytics API routes."""

from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from models import db, Interview, User, Resume
import os
import json
from groq import Groq
from sqlalchemy import func
from datetime import datetime, timedelta

feedback_bp = Blueprint('feedback', __name__)
client = Groq(api_key=os.getenv("GROQ_API_KEY"))


def _extract_feedback_scores(interview):
    """Return normalized feedback scores from an interview record."""

    if not interview.feedback:
        return None

    try:
        feedback = json.loads(interview.feedback)
    except (TypeError, json.JSONDecodeError):
        return None

    scores = feedback.get("scores") if isinstance(feedback, dict) else None
    if not isinstance(scores, dict):
        return None

    communication = float(scores.get("communication", 0) or 0)
    technical = float(scores.get("technical", 0) or 0)
    confidence = float(scores.get("confidence", 0) or 0)
    values = [communication, technical, confidence]
    overall = round((sum(values) / len(values)) * 10, 1)

    return {
        "communication": round(communication * 10, 1),
        "technical": round(technical * 10, 1),
        "confidence": round(confidence * 10, 1),
        "overall": overall,
        "suggestions": feedback.get("suggestions", []),
    }


def _build_progress_suggestions(category_averages, total_interviews, latest_resume_score):
    """Create practical learning suggestions from student progress signals."""

    suggestions = []

    if total_interviews == 0:
        return [
            "Complete your first mock interview so your progress dashboard has real data.",
            "Start with one technical and one behavioral session to create a balanced baseline.",
        ]

    weakest_category = min(category_averages, key=category_averages.get)
    weakest_score = category_averages[weakest_category]

    if weakest_category == "technical":
        suggestions.append(
            "Your technical score needs the most attention. Practice explaining brute force first, then improve to an optimized approach with time and space complexity."
        )
    elif weakest_category == "communication":
        suggestions.append(
            "Your communication score is the lowest. Use a clearer answer structure: context, approach, tradeoff, result."
        )
    else:
        suggestions.append(
            "Your confidence score is the lowest. Practice speaking answers out loud and pause before responding instead of rushing."
        )

    if weakest_score < 60:
        suggestions.append(
            "Focus on one weak area for the next three sessions instead of switching topics too quickly."
        )

    if latest_resume_score is not None and latest_resume_score < 70:
        suggestions.append(
            "Your latest resume ATS score can improve. Add role-specific keywords, measurable impact, and cleaner project bullet points."
        )

    if total_interviews < 5:
        suggestions.append(
            "Do at least five short interviews to make your trend graph more reliable."
        )

    return suggestions[:4]


@feedback_bp.route('/admin/analytics', methods=['GET'])
@jwt_required()
def get_analytics():
    current_user_id = get_jwt_identity()
    admin = User.query.get(current_user_id)
    
    if admin.role != 'admin':
        return jsonify({"error": "Admin access required"}), 403

    # 1. Users Registration per day (last 14 days)
    fourteen_days_ago = datetime.utcnow() - timedelta(days=14)
    user_counts = db.session.query(
        func.date(User.created_at).label('date'),
        func.count(User.id).label('count')
    ).filter(User.created_at >= fourteen_days_ago).group_by(func.date(User.created_at)).all()
    
    daily_users = [{"date": str(u.date), "count": u.count} for u in user_counts]

    # 2. Interviews per Subject
    subject_counts = db.session.query(
        Interview.subject,
        func.count(Interview.id).label('count')
    ).group_by(Interview.subject).all()
    
    subject_stats = [{"subject": s.subject, "count": s.count} for s in subject_counts]

    # 3. User Role Distribution
    role_counts = db.session.query(
        User.role,
        func.count(User.id).label('count')
    ).group_by(User.role).all()
    role_stats = [{"name": r.role, "value": r.count} for r in role_counts]

    # 4. Daily Resumes (last 14 days)
    resume_counts = db.session.query(
        func.date(Resume.created_at).label('date'),
        func.count(Resume.id).label('count')
    ).filter(Resume.created_at >= fourteen_days_ago).group_by(func.date(Resume.created_at)).all()
    daily_resumes = [{"date": str(r.date), "count": r.count} for r in resume_counts]

    # 5. Top Scores and Category Performance
    # We'll get the latest 50 interviews that have feedback and extract scores
    recent_interviews = Interview.query.filter(Interview.feedback != None).order_by(Interview.created_at.desc()).limit(50).all()
    
    category_avg = {
        "communication": [],
        "technical": [],
        "confidence": []
    }
    
    leaderboard = []
    
    for i in recent_interviews:
        try:
            fb_json = json.loads(i.feedback)
            if isinstance(fb_json, dict) and "scores" in fb_json:
                scores = fb_json["scores"]
                user = User.query.get(i.user_id)
                
                category_avg["communication"].append(scores.get("communication", 0))
                category_avg["technical"].append(scores.get("technical", 0))
                category_avg["confidence"].append(scores.get("confidence", 0))
                
                total_score = sum(scores.values()) / len(scores) if scores else 0
                leaderboard.append({
                    "username": user.username,
                    "subject": i.subject,
                    "score": round(total_score, 1),
                    "date": i.created_at.strftime("%Y-%m-%d")
                })
        except:
            continue

    # Sort leaderboard and take top 5
    leaderboard.sort(key=lambda x: x["score"], reverse=True)
    top_performers = leaderboard[:5]

    # Calculate average category scores
    performance_overview = [
        {"category": "Communication", "value": round(sum(category_avg["communication"])/len(category_avg["communication"]), 1) if category_avg["communication"] else 0},
        {"category": "Technical", "value": round(sum(category_avg["technical"])/len(category_avg["technical"]), 1) if category_avg["technical"] else 0},
        {"category": "Confidence", "value": round(sum(category_avg["confidence"])/len(category_avg["confidence"]), 1) if category_avg["confidence"] else 0}
    ]

    return jsonify({
        "daily_users": daily_users,
        "daily_resumes": daily_resumes,
        "subject_stats": subject_stats,
        "role_stats": role_stats,
        "top_performers": top_performers,
        "performance_overview": performance_overview,
        "total_users": User.query.count(),
        "total_interviews": Interview.query.count(),
        "total_resumes": Resume.query.count()
    }), 200

@feedback_bp.route('/public/stats', methods=['GET'])
def get_public_stats():
    # Get top 3 performers for home page
    recent_interviews = Interview.query.filter(Interview.feedback != None).order_by(Interview.created_at.desc()).limit(100).all()
    leaderboard = []
    for i in recent_interviews:
        try:
            fb_json = json.loads(i.feedback)
            if isinstance(fb_json, dict) and "scores" in fb_json:
                scores = fb_json["scores"]
                user = User.query.get(i.user_id)
                total_score = sum(scores.values()) / len(scores) if scores else 0
                leaderboard.append({
                    "username": user.username[0] + "***" + user.username[-1] if len(user.username) > 2 else user.username,
                    "subject": i.subject,
                    "score": round(total_score, 1)
                })
        except:
            continue
    
    leaderboard.sort(key=lambda x: x["score"], reverse=True)
    return jsonify({
        "top_performers": leaderboard[:3],
        "total_interviews": Interview.query.count()
    }), 200

@feedback_bp.route('/progress', methods=['GET'])
@jwt_required()
def get_progress():
    user_id = get_jwt_identity()
    interviews = Interview.query.filter_by(user_id=user_id).order_by(Interview.created_at.asc()).all()
    resumes = Resume.query.filter_by(user_id=user_id).order_by(Resume.created_at.asc()).all()

    scored_sessions = []
    category_totals = {
        "communication": [],
        "technical": [],
        "confidence": [],
    }
    subject_counts = {}

    for index, interview in enumerate(interviews, start=1):
        subject = interview.subject or "general"
        subject_counts[subject] = subject_counts.get(subject, 0) + 1
        scores = _extract_feedback_scores(interview)

        if not scores:
            continue

        for category in category_totals:
            category_totals[category].append(scores[category])

        scored_sessions.append({
            "session": index,
            "id": interview.id,
            "date": interview.created_at.strftime("%b %d"),
            "subject": subject.replace("_", " ").title(),
            "overall": scores["overall"],
            "communication": scores["communication"],
            "technical": scores["technical"],
            "confidence": scores["confidence"],
        })

    category_averages = {
        category: round(sum(values) / len(values), 1) if values else 0
        for category, values in category_totals.items()
    }
    average_score = round(
        sum(session["overall"] for session in scored_sessions) / len(scored_sessions),
        1
    ) if scored_sessions else 0
    latest_score = scored_sessions[-1]["overall"] if scored_sessions else 0
    first_score = scored_sessions[0]["overall"] if scored_sessions else 0
    improvement = round(latest_score - first_score, 1) if len(scored_sessions) > 1 else 0
    latest_resume_score = resumes[-1].ats_score if resumes else None

    resume_trend = [
        {
            "date": resume.created_at.strftime("%b %d"),
            "score": round(float(resume.ats_score or 0), 1),
            "filename": resume.filename,
        }
        for resume in resumes
    ]

    return jsonify({
        "summary": {
            "total_interviews": len(interviews),
            "scored_interviews": len(scored_sessions),
            "average_score": average_score,
            "latest_score": latest_score,
            "improvement": improvement,
            "latest_resume_score": latest_resume_score,
        },
        "score_trend": scored_sessions,
        "category_scores": [
            {"category": "Communication", "score": category_averages["communication"]},
            {"category": "Technical", "score": category_averages["technical"]},
            {"category": "Confidence", "score": category_averages["confidence"]},
        ],
        "subject_breakdown": [
            {"subject": subject.replace("_", " ").title(), "count": count}
            for subject, count in subject_counts.items()
        ],
        "resume_trend": resume_trend,
        "suggestions": _build_progress_suggestions(
            category_averages,
            len(interviews),
            latest_resume_score,
        ),
    }), 200

@feedback_bp.route('/generate/<int:interview_id>', methods=['POST'])
@jwt_required()
def generate_feedback(interview_id):
    user_id = get_jwt_identity()
    current_user = User.query.get(user_id)
    interview = Interview.query.get_or_404(interview_id)
    
    # Allow if it's the user's own interview OR if the user is an admin
    if str(interview.user_id) != user_id and current_user.role != 'admin':
        return jsonify({"error": "Unauthorized"}), 403

    # Parse conversation to check user response count
    try:
        conv_list = json.loads(interview.conversation)
        user_responses = [m for m in conv_list if m.get('role') == 'user']
        # If user only said "Hello" (first message) or nothing, return empty feedback
        if len(user_responses) <= 1:
            empty_feedback = {
                "scores": {"communication": 0, "technical": 0, "confidence": 0},
                "categories": {
                    "communication": "No significant interaction detected.",
                    "technical": "No significant interaction detected.",
                    "confidence": "No significant interaction detected."
                },
                "overall": "The user did not provide enough responses to generate a feedback report.",
                "suggestions": ["Please engage more with the AI coach in your next session."]
            }
            interview.feedback = json.dumps(empty_feedback)
            db.session.commit()
            return jsonify({
                "feedback": interview.feedback,
                "conversation": interview.conversation,
                "subject": interview.subject
            }), 200
    except Exception as e:
        print(f"Error parsing conversation: {e}")

    prompt = f"""
    Evaluate the following interview conversation.
    Return the evaluation in JSON format with the following structure:
    {{
        "scores": {{
            "communication": number (1-10),
            "technical": number (1-10),
            "confidence": number (1-10)
        }},
        "categories": {{
            "communication": "detailed feedback for communication",
            "technical": "detailed feedback for technical skills",
            "confidence": "detailed feedback for confidence"
        }},
        "overall": "overall performance summary",
        "suggestions": ["suggestion 1", "suggestion 2", ...]
    }}
    
    Conversation:
    {interview.conversation}
    """

    try:
        completion = client.chat.completions.create(
            model="llama-3.1-8b-instant",
            messages=[
                {"role": "system", "content": "You are an expert technical interviewer. Always return feedback in valid JSON format."},
                {"role": "user", "content": prompt}
            ],
            response_format={ "type": "json_object" },
            temperature=0.5,
            max_tokens=1000
        )
        
        feedback_text = completion.choices[0].message.content
        interview.feedback = feedback_text
        db.session.commit()

        return jsonify({
            "feedback": feedback_text,
            "conversation": interview.conversation,
            "subject": interview.subject
        }), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@feedback_bp.route('/interview/<int:interview_id>', methods=['DELETE'])
@jwt_required()
def delete_interview(interview_id):
    current_user_id = get_jwt_identity()
    admin = User.query.get(current_user_id)
    
    if admin.role != 'admin':
        return jsonify({"error": "Admin access required"}), 403
    
    interview = Interview.query.get_or_404(interview_id)
    db.session.delete(interview)
    db.session.commit()
    
    return jsonify({"msg": "Interview deleted successfully"}), 200

@feedback_bp.route('/history', methods=['GET'])
@jwt_required()
def get_history():
    user_id = get_jwt_identity()
    interviews = Interview.query.filter_by(user_id=user_id).order_by(Interview.created_at.desc()).all()
    
    history = []
    for i in interviews:
        history.append({
            "id": i.id,
            "created_at": i.created_at.isoformat(),
            "score": i.score,
            "subject": i.subject,
            "has_feedback": i.feedback is not None
        })
    
    return jsonify(history), 200

@feedback_bp.route('/admin/users', methods=['GET'])
@jwt_required()
def get_all_users():
    current_user_id = get_jwt_identity()
    admin = User.query.get(current_user_id)
    
    if admin.role != 'admin':
        return jsonify({"error": "Admin access required"}), 403
    
    users = User.query.filter(User.id != int(current_user_id)).all()
    user_list = []
    for u in users:
        interview_count = Interview.query.filter_by(user_id=u.id).count()
        user_list.append({
            "id": u.id,
            "username": u.username,
            "email": u.email,
            "role": u.role,
            "interview_count": interview_count
        })
    
    return jsonify(user_list), 200

@feedback_bp.route('/admin/user/<int:user_id>/history', methods=['GET'])
@jwt_required()
def get_user_history_admin(user_id):
    current_user_id = get_jwt_identity()
    admin = User.query.get(current_user_id)
    
    if admin.role != 'admin':
        return jsonify({"error": "Admin access required"}), 403
    
    interviews = Interview.query.filter_by(user_id=user_id).order_by(Interview.created_at.desc()).all()
    history = []
    for i in interviews:
        history.append({
            "id": i.id,
            "created_at": i.created_at.isoformat(),
            "score": i.score,
            "subject": i.subject,
            "has_feedback": i.feedback is not None
        })
    
    return jsonify(history), 200

@feedback_bp.route('/admin/all', methods=['GET'])
@jwt_required()
def get_all_history():
    current_user_id = get_jwt_identity()
    admin = User.query.get(current_user_id)
    
    if admin.role != 'admin':
        return jsonify({"error": "Admin access required"}), 403
    
    interviews = Interview.query.order_by(Interview.created_at.desc()).all()
    history = []
    for i in interviews:
        user = User.query.get(i.user_id)
        history.append({
            "id": i.id,
            "username": user.username,
            "created_at": i.created_at.isoformat(),
            "subject": i.subject,
            "has_feedback": i.feedback is not None
        })
    
    return jsonify(history), 200
