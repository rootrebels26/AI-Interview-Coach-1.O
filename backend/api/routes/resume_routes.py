"""Resume upload, ATS analysis, and admin resume API routes."""

from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from models import db, Resume, User
import os
from groq import Groq
import PyPDF2
import docx
from utils.ats_score import calculate_ats_score, get_ats_feedback

resume_bp = Blueprint('resume', __name__)
client = Groq(api_key=os.getenv("GROQ_API_KEY"))

def extract_text(file):
    filename = file.filename
    if filename.endswith('.pdf'):
        pdf_reader = PyPDF2.PdfReader(file)
        text = ""
        for page in pdf_reader.pages:
            text += page.extract_text()
        return text
    elif filename.endswith('.docx'):
        doc = docx.Document(file)
        text = ""
        for para in doc.paragraphs:
            text += para.text + "\n"
        return text
    return ""

@resume_bp.route('/analyze', methods=['POST'])
@jwt_required()
def analyze_resume():
    if 'file' not in request.files:
        return jsonify({"error": "No file uploaded"}), 400
    
    file = request.files['file']
    text = extract_text(file)
    
    if not text:
        return jsonify({"error": "Could not extract text from file"}), 400

    user_id = get_jwt_identity()

    try:
        # Calculate ATS score based on resume content
        ats_score = calculate_ats_score(text)
        
        # Get detailed feedback
        feedback_list = get_ats_feedback(text)
        
        # Get AI analysis for additional insights
        prompt = f"""
        Analyze this resume briefly and provide:
        1. Key Strengths
        2. Areas for Improvement
        3. Suggested Keywords to add
        
        Resume Content:
        {text[:3000]}
        """

        try:
            completion = client.chat.completions.create(
                model="llama-3.1-8b-instant",
                messages=[{"role": "user", "content": prompt}],
                temperature=0.5,
                max_tokens=800
            )
            ai_analysis = completion.choices[0].message.content
        except Exception as e:
            ai_analysis = "AI analysis unavailable. Please review the feedback below."
        
        # Combine feedback
        feedback_text = "\n".join(feedback_list)
        full_analysis = f"""
ATS Score: {ats_score}/100

FEEDBACK:
{feedback_text}

DETAILED ANALYSIS:
{ai_analysis}
        """

        new_resume = Resume(
            user_id=user_id,
            filename=file.filename,
            ats_score=ats_score,
            analysis=full_analysis
        )
        db.session.add(new_resume)
        db.session.commit()

        return jsonify({
            "analysis": full_analysis,
            "score": ats_score,
            "feedback": feedback_list
        }), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@resume_bp.route('/admin/all', methods=['GET'])
@jwt_required()
def get_all_resumes_admin():
    current_user_id = get_jwt_identity()
    admin = User.query.get(current_user_id)
    
    if admin.role != 'admin':
        return jsonify({"error": "Admin access required"}), 403
    
    resumes = Resume.query.order_by(Resume.created_at.desc()).all()
    resume_list = []
    for r in resumes:
        user = User.query.get(r.user_id)
        resume_list.append({
            "id": r.id,
            "username": user.username if user else "Unknown",
            "filename": r.filename,
            "ats_score": r.ats_score,
            "created_at": r.created_at.isoformat()
        })
    
    return jsonify(resume_list), 200

@resume_bp.route('/admin/<int:resume_id>', methods=['DELETE'])
@jwt_required()
def delete_resume_admin(resume_id):
    current_user_id = get_jwt_identity()
    admin = User.query.get(current_user_id)
    
    if admin.role != 'admin':
        return jsonify({"error": "Admin access required"}), 403
    
    resume = Resume.query.get_or_404(resume_id)
    db.session.delete(resume)
    db.session.commit()
    
    return jsonify({"msg": "Resume deleted successfully"}), 200
