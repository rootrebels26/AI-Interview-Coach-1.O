from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field

class AnswerEvaluationRequest(BaseModel):
    session_id: Optional[str] = None
    question_number: int
    question_text: str
    expected_concepts: List[str] = Field(default_factory=list)
    candidate_answer: str
    company: str = "Google"
    role: str = "Software Engineer"
    difficulty: str = "Intermediate"

class ScoreBreakdown(BaseModel):
    technical_correctness: float = Field(..., description="Out of 25%")
    relevance: float = Field(..., description="Out of 20%")
    communication_clarity: float = Field(..., description="Out of 15%")
    problem_solving: float = Field(..., description="Out of 15%")
    practical_examples: float = Field(..., description="Out of 15%")
    answer_structure: float = Field(..., description="Out of 10%")
    overall_score: float = Field(..., description="Out of 100%")

class AnswerEvaluationResponse(BaseModel):
    question_number: int
    question_text: str
    candidate_answer: str
    scores: ScoreBreakdown
    strengths: List[str] = Field(default_factory=list)
    weaknesses: List[str] = Field(default_factory=list)
    missing_concepts: List[str] = Field(default_factory=list)
    correct_technical_explanation: str
    improved_sample_answer: str
    specific_feedback: str

class TranscriptionResponse(BaseModel):
    success: bool
    transcript: str
    confidence: Optional[float] = 1.0

# ----------------- Final Report Schemas -----------------

class OverallScores(BaseModel):
    overall_performance: float
    technical_knowledge: float
    communication: float
    problem_solving: float
    practical_experience: float
    answer_structure: float

class QuestionReviewItem(BaseModel):
    question_number: int
    question_text: str
    candidate_answer: str
    individual_score: float
    what_was_correct: List[str] = Field(default_factory=list)
    what_was_missing: List[str] = Field(default_factory=list)
    suggested_improved_answer: str
    improvement_advice: str

class OverallAnalysis(BaseModel):
    strongest_answers: List[str] = Field(default_factory=list)
    weakest_answers: List[str] = Field(default_factory=list)
    technical_gaps: List[str] = Field(default_factory=list)
    repeated_mistakes: List[str] = Field(default_factory=list)
    communication_weaknesses: List[str] = Field(default_factory=list)
    resume_relevance: str = ""
    interview_readiness_estimate: str = "Ready for Practice"
    areas_to_improve: List[str] = Field(default_factory=list)
    personalized_learning_recommendations: List[str] = Field(default_factory=list)

class FinalRecommendation(BaseModel):
    what_they_did_well: List[str] = Field(default_factory=list)
    what_they_should_improve: List[str] = Field(default_factory=list)
    topics_to_revise: List[str] = Field(default_factory=list)
    how_to_prepare: str = ""
    five_additional_practice_questions: List[str] = Field(default_factory=list)

class FinalReportRequest(BaseModel):
    session_id: Optional[str] = None
    company: str = "Google"
    role: str = "Software Engineer"
    difficulty: str = "Intermediate"
    interview_type: str = "Technical Interview"
    questions: List[Dict[str, Any]] = Field(default_factory=list)
    answers: List[str] = Field(default_factory=list)
    evaluations: List[Dict[str, Any]] = Field(default_factory=list)

class FinalReportResponse(BaseModel):
    company: str
    role: str
    difficulty: str
    interview_type: str
    generated_at: str
    overall_scores: OverallScores
    question_reviews: List[QuestionReviewItem]
    overall_analysis: OverallAnalysis
    final_recommendation: FinalRecommendation
