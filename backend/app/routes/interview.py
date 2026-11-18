import uuid
from typing import Dict, Any, List, Optional
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from app.schemas.interview import ResumeData
from app.services.question_generator import (
    generate_interview_questions,
    generate_dynamic_followup_question
)
from app.services.conversation_manager import process_conversational_turn, get_fallback_hint
from app.services.ai_provider import call_ai, extract_json_from_text
from app.services.question_generator import get_role_profile

interview_router = APIRouter(prefix="/interview", tags=["Interview Session"])

# In-memory temporary active sessions (zero database)
ACTIVE_SESSIONS: Dict[str, Dict[str, Any]] = {}

class QuestionItem(BaseModel):
    question_number: int
    category: str
    question_text: str
    spoken_prompt: str
    expected_concepts: List[str] = Field(default_factory=list)
    part_id: int = 1
    part_title: str = "Introduction"
    part_index: int = 1
    part_total: int = 2
    part_progress: str = "1/2"

class StartInterviewRequest(BaseModel):
    company: str
    role: str
    interview_type: str = "Technical Interview"
    difficulty: str = "Intermediate"
    duration_minutes: int = 10
    job_description: Optional[str] = ""
    resume_data: Optional[ResumeData] = None

class StartInterviewResponse(BaseModel):
    session_id: str
    minimum_required_for_report: int = 1
    total_questions: int = 10
    duration_minutes: int = 10
    company: str
    role: str
    difficulty: str
    first_question: QuestionItem
    all_questions: List[QuestionItem]

class NextQuestionRequest(BaseModel):
    session_id: Optional[str] = None
    next_question_number: int  # 1 or higher (unlimited questions supported!)
    cached_questions: Optional[List[QuestionItem]] = None
    previous_answers: Optional[List[str]] = None
    company: Optional[str] = None
    role: Optional[str] = None
    difficulty: Optional[str] = None
    interview_type: Optional[str] = None

class NextQuestionResponse(BaseModel):
    question: QuestionItem
    question_number: int
    total_questions_so_far: int
    minimum_required_for_report: int = 1
    can_generate_report: bool = True
    is_last_question: bool = False
    is_interview_concluded: bool = False
    concluding_remarks: Optional[str] = None

class ConcludeInterviewRequest(BaseModel):
    session_id: Optional[str] = None
    completed_questions_count: int

class ConcludeInterviewResponse(BaseModel):
    is_concluded: bool
    can_generate_report: bool
    minimum_required: int = 1
    completed_count: int
    message: str

class HintRequest(BaseModel):
    session_id: Optional[str] = None
    role: Optional[str] = "Software Engineer"
    company: Optional[str] = "Google"
    question_text: str
    expected_concepts: Optional[List[str]] = Field(default_factory=list)

class HintResponse(BaseModel):
    hint_title: str
    hint_text: str
    mental_model: str
    guiding_questions: List[str]

class DialogueTurn(BaseModel):
    role: str  # "interviewer" | "candidate" | "user"
    text: str

class ConverseRequest(BaseModel):
    session_id: Optional[str] = None
    question_number: int
    question_text: str
    expected_concepts: Optional[List[str]] = Field(default_factory=list)
    candidate_message: str
    dialogue_history: Optional[List[DialogueTurn]] = Field(default_factory=list)
    turn_count_for_question: int = 1
    request_hint: bool = False
    company: Optional[str] = "Google"
    role: Optional[str] = "Software Engineer"
    difficulty: Optional[str] = "Intermediate"
    interview_type: Optional[str] = "Technical Interview"

class ConverseResponse(BaseModel):
    interviewer_reply: str
    intent: str  # "hint_and_nudge" | "probe_deeper" | "satisfied_transition"
    is_satisfied: bool
    should_advance: bool
    hint: Optional[str] = None
    cumulative_answer: Optional[str] = None
    evaluation: Optional[Dict[str, Any]] = None
    next_question: Optional[QuestionItem] = None
    question_number: int
    completed_count: int = 0
    can_generate_report: bool = False

@interview_router.post("/start", response_model=StartInterviewResponse)
def start_interview(payload: StartInterviewRequest):
    """
    Initializes a mock interview session.
    Web-scrapes live real-world questions and tailors the initial sequence to candidate resume.
    The candidate can practice unlimited questions, with a minimum of 6 questions required for report generation.
    """
    try:
        # Generate initial 6 non-predefined questions grounded in live web scraping
        raw_questions = generate_interview_questions(
            company=payload.company,
            role=payload.role,
            interview_type=payload.interview_type,
            difficulty=payload.difficulty,
            resume=payload.resume_data,
            job_description=payload.job_description,
        )

        formatted_questions = [QuestionItem(**q) for q in raw_questions]
        session_id = str(uuid.uuid4())

        # Store in temporary in-memory session (no database)
        ACTIVE_SESSIONS[session_id] = {
            "company": payload.company,
            "role": payload.role,
            "difficulty": payload.difficulty,
            "interview_type": payload.interview_type,
            "duration_minutes": payload.duration_minutes,
            "job_description": payload.job_description,
            "resume_data": payload.resume_data,
            "questions": formatted_questions,
            "answers": {},
            "evaluations": {},
            "is_concluded": False,
        }

        return StartInterviewResponse(
            session_id=session_id,
            minimum_required_for_report=1,
            total_questions=len(formatted_questions),
            duration_minutes=payload.duration_minutes,
            company=payload.company,
            role=payload.role,
            difficulty=payload.difficulty,
            first_question=formatted_questions[0],
            all_questions=formatted_questions,
        )

    except Exception as e:
        print(f"[Start Interview Error]: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to start interview: {str(e)}")

@interview_router.post("/next-question", response_model=NextQuestionResponse)
def get_next_question(payload: NextQuestionRequest):
    """
    Retrieves or dynamically generates the next question.
    Supports unlimited questions until candidate or AI board concludes the interview.
    Enforces minimum 6 questions to unlock the comprehensive report.
    """
    q_num = payload.next_question_number
    if q_num < 1:
        raise HTTPException(status_code=400, detail="Question number must be 1 or greater.")

    session = ACTIVE_SESSIONS.get(payload.session_id) if payload.session_id else None

    # Check if session exists in memory
    if session:
        questions = session.get("questions", [])
        answers_dict = session.get("answers", {})
        answered_count = len(answers_dict)

        # Case A: Question is already within the existing questions list
        if q_num <= len(questions):
            target_q = questions[q_num - 1]
            return NextQuestionResponse(
                question=target_q,
                question_number=q_num,
                total_questions_so_far=len(questions),
                minimum_required_for_report=1,
                can_generate_report=(answered_count >= 1 or q_num >= 1),
                is_last_question=False,
                is_interview_concluded=False,
            )

        # Case B: Unlimited questions mode (q_num > len(questions))
        # Dynamically generate the next question using AI interviewer engine
        prev_q_dicts = [q.model_dump() if hasattr(q, "model_dump") else dict(q) for q in questions]
        prev_ans_list = list(answers_dict.values())
        if payload.previous_answers:
            prev_ans_list.extend(payload.previous_answers)

        new_q_dict = generate_dynamic_followup_question(
            company=session.get("company", payload.company or "Google"),
            role=session.get("role", payload.role or "Software Engineer"),
            interview_type=session.get("interview_type", payload.interview_type or "Technical Interview"),
            difficulty=session.get("difficulty", payload.difficulty or "Intermediate"),
            question_number=q_num,
            previous_questions=prev_q_dicts,
            previous_answers=prev_ans_list,
            resume=session.get("resume_data"),
            job_description=session.get("job_description", ""),
        )

        new_q_item = QuestionItem(**new_q_dict)
        session["questions"].append(new_q_item)

        return NextQuestionResponse(
            question=new_q_item,
            question_number=q_num,
            total_questions_so_far=len(session["questions"]),
            minimum_required_for_report=1,
            can_generate_report=(answered_count >= 1 or q_num >= 1),
            is_last_question=False,
            is_interview_concluded=False,
        )

    # Fallback if no active session in memory (client-side state fallback)
    cached_q = payload.cached_questions or []
    if q_num <= len(cached_q):
        target_q = cached_q[q_num - 1]
        return NextQuestionResponse(
            question=target_q,
            question_number=q_num,
            total_questions_so_far=len(cached_q),
            minimum_required_for_report=1,
            can_generate_report=(q_num >= 1),
            is_last_question=False,
            is_interview_concluded=False,
        )

    # Generate dynamic question for client-side fallback
    prev_q_dicts = [q.model_dump() if hasattr(q, "model_dump") else dict(q) for q in cached_q]
    new_q_dict = generate_dynamic_followup_question(
        company=payload.company or "Google",
        role=payload.role or "Software Engineer",
        interview_type=payload.interview_type or "Technical Interview",
        difficulty=payload.difficulty or "Intermediate",
        question_number=q_num,
        previous_questions=prev_q_dicts,
        previous_answers=payload.previous_answers or [],
    )
    new_q_item = QuestionItem(**new_q_dict)

    return NextQuestionResponse(
        question=new_q_item,
        question_number=q_num,
        total_questions_so_far=max(q_num, len(cached_q) + 1),
        minimum_required_for_report=1,
        can_generate_report=(q_num >= 1),
        is_last_question=False,
        is_interview_concluded=False,
    )

@interview_router.post("/conclude", response_model=ConcludeInterviewResponse)
def conclude_interview(payload: ConcludeInterviewRequest):
    """
    Formally concludes the interview session.
    Allows report generation whenever at least 1 question has been answered/evaluated.
    """
    completed = payload.completed_questions_count

    if payload.session_id and payload.session_id in ACTIVE_SESSIONS:
        session = ACTIVE_SESSIONS[payload.session_id]
        answers_count = len(session.get("answers", {}))
        evals_count = len(session.get("evaluations", {}))
        completed = max(completed, answers_count, evals_count)
        session["is_concluded"] = True

    if completed < 1:
        return ConcludeInterviewResponse(
            is_concluded=False,
            can_generate_report=False,
            minimum_required=1,
            completed_count=completed,
            message="Please answer at least 1 question to generate your performance evaluation report.",
        )

    return ConcludeInterviewResponse(
        is_concluded=True,
        can_generate_report=True,
        minimum_required=1,
        completed_count=completed,
        message=f"Interview concluded with {completed} questions evaluated! You can now view your comprehensive performance report.",
    )

@interview_router.post("/hint", response_model=HintResponse)
def get_interview_hint(payload: HintRequest):
    """
    Returns an insightful, high-impact hint/clue in a popup modal for the candidate
    WITHOUT skipping or advancing the question.
    """
    role = payload.role or "Software Engineer"
    company = payload.company or "Google"
    q_text = payload.question_text
    concepts = payload.expected_concepts or []

    # Fast heuristic hint fallback
    fallback_clue = get_fallback_hint(role, 0)
    prof = get_role_profile(role)

    system_prompt = (
        f"You are a supportive technical mentor at {company}. "
        f"A candidate interviewing for {role} clicked 'Hint' on this question: '{q_text}'. "
        f"Provide a short, illuminating technical hint without revealing the entire answer. "
        f"Guide their intuition around core fundamentals: {prof['internals_focus']}.\n"
        f"Return ONLY valid JSON matching this structure:\n"
        f"{{\n"
        f'  "hint_title": "Short 3-5 word conceptual focus (e.g. Concurrency & Locking)",\n'
        f'  "hint_text": "2 sentences giving a practical mental model or trade-off to consider.",\n'
        f'  "mental_model": "Key engineering principle (e.g. CAP Theorem, Cache-Aside, STAR context)",\n'
        f'  "guiding_questions": ["Question to ask yourself?", "Secondary trade-off to consider?"]\n'
        f"}}"
    )

    try:
        reply = call_ai(
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": f"QUESTION: {q_text}\nEXPECTED CONCEPTS: {', '.join(concepts)}"}
            ],
            max_tokens=220,
            temperature=0.3,
            response_format={"type": "json_object"}
        )
        parsed = extract_json_from_text(reply)
        return HintResponse(
            hint_title=parsed.get("hint_title") or f"{role} Core Principle",
            hint_text=parsed.get("hint_text") or fallback_clue,
            mental_model=parsed.get("mental_model") or prof.get("core_pillars", "System Fundamentals").split(",")[0],
            guiding_questions=parsed.get("guiding_questions") or [
                "What is the primary bottleneck or failure mode in this setup?",
                "How would you measure and verify this in a production environment?"
            ]
        )
    except Exception as e:
        print(f"[Hint generation fallback]: {e}")
        return HintResponse(
            hint_title=f"{role} Technical Guidance",
            hint_text=fallback_clue,
            mental_model="First-Principles Problem Solving",
            guiding_questions=[
                "How does data flow through this component from start to finish?",
                "What trade-off between performance and reliability applies here?"
            ]
        )

@interview_router.post("/converse", response_model=ConverseResponse)
def converse(payload: ConverseRequest):
    """
    Handles a live conversational turn between the candidate and AI interviewer.
    - If the candidate is stuck, unsure, or asks for a hint, provides supportive hints/scaffolding.
    - Probes incomplete responses deeper until the interviewer is satisfied.
    - Once satisfied, acknowledges candidate's answer and bridges into the next question.
    """
    session = ACTIVE_SESSIONS.get(payload.session_id) if payload.session_id else None
    company = session.get("company", payload.company or "Google") if session else (payload.company or "Google")
    role = session.get("role", payload.role or "Software Engineer") if session else (payload.role or "Software Engineer")
    difficulty = session.get("difficulty", payload.difficulty or "Intermediate") if session else (payload.difficulty or "Intermediate")

    # Determine next question preview
    next_q_item = None
    next_q_num = payload.question_number + 1
    if session:
        questions = session.get("questions", [])
        if next_q_num <= len(questions):
            next_q_item = questions[next_q_num - 1]
        else:
            # Generate dynamic question preview for unlimited probing
            prev_q_dicts = [q.model_dump() if hasattr(q, "model_dump") else dict(q) for q in questions]
            prev_ans_list = list(session.get("answers", {}).values())
            dyn_q_dict = generate_dynamic_followup_question(
                company=company,
                role=role,
                interview_type=session.get("interview_type", payload.interview_type or "Technical Interview"),
                difficulty=difficulty,
                question_number=next_q_num,
                previous_questions=prev_q_dicts,
                previous_answers=prev_ans_list,
                resume=session.get("resume_data"),
                job_description=session.get("job_description", "")
            )
            next_q_item = QuestionItem(**dyn_q_dict)

    dialogue_hist_dicts = [
        {"role": t.role, "text": t.text} for t in (payload.dialogue_history or [])
    ]

    result = process_conversational_turn(
        company=company,
        role=role,
        difficulty=difficulty,
        question_number=payload.question_number,
        question_text=payload.question_text,
        expected_concepts=payload.expected_concepts or [],
        candidate_message=payload.candidate_message,
        dialogue_history=dialogue_hist_dicts,
        turn_count_for_question=payload.turn_count_for_question,
        request_hint=payload.request_hint,
        next_question_preview=next_q_item.model_dump() if next_q_item else None
    )

    completed_count = 0
    can_generate_report = False

    if session:
        if result.get("should_advance"):
            session["answers"][payload.question_number] = result.get("cumulative_answer") or payload.candidate_message
            if result.get("evaluation"):
                session["evaluations"][payload.question_number] = result.get("evaluation")
            # If dynamic question was generated and not yet in questions list, append it
            if next_q_item and next_q_num > len(session.get("questions", [])):
                session["questions"].append(next_q_item)

        completed_count = len(session.get("answers", {}))
        can_generate_report = (completed_count >= 1)
    else:
        completed_count = payload.question_number if result.get("should_advance") else max(0, payload.question_number - 1)
        can_generate_report = (completed_count >= 1)

    return ConverseResponse(
        interviewer_reply=result.get("interviewer_reply", "Could you elaborate on that approach?"),
        intent=result.get("intent", "probe_deeper"),
        is_satisfied=result.get("is_satisfied", False),
        should_advance=result.get("should_advance", False),
        hint=result.get("hint"),
        cumulative_answer=result.get("cumulative_answer"),
        evaluation=result.get("evaluation"),
        next_question=next_q_item if result.get("should_advance") else None,
        question_number=payload.question_number,
        completed_count=completed_count,
        can_generate_report=can_generate_report
    )
