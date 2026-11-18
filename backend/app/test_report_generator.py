import os
from dotenv import load_dotenv

load_dotenv("ai-interview-coach/backend/.env")

from app.services.report_generator import generate_comprehensive_report

def test_final_report_generation():
    print("Testing 6-question comprehensive feedback report generation...")

    company = "Google"
    role = "Software Engineer"
    difficulty = "Advanced"
    interview_type = "Technical Interview"

    mock_questions = [
        {"question_number": 1, "question_text": "Please introduce yourself and your background with distributed systems."},
        {"question_number": 2, "question_text": "How do you define resilience in a high-throughput backend?"},
        {"question_number": 3, "question_text": "How do you handle consistency trade-offs between PostgreSQL and Redis?"},
        {"question_number": 4, "question_text": "Walk me through the data flow of your Real-Time Analytics Engine."},
        {"question_number": 5, "question_text": "Your service experiences a 10x traffic spike saturating DB pool. How do you mitigate?"},
        {"question_number": 6, "question_text": "Describe a subtle concurrency bug you investigated and how you resolved it."}
    ]

    mock_answers = [
        "I am a Full Stack Engineer with 3 years building Python and React applications at scale.",
        "Resilience means graceful degradation and ensuring one failing microservice doesn't cause cascading failures.",
        "We used the Cache-Aside pattern with Redis and PostgreSQL, invalidating on writes and using Pub/Sub for evictions.",
        "We ingested events via FastAPI async endpoints, buffered writes, and rendered dashboards with React memoization.",
        "I would enable circuit breakers, tune DB pool limits, shed non-critical traffic, and scale worker replicas.",
        "We had a race condition in asynchronous task workers accessing shared cache state, which we resolved using atomic locks."
    ]

    mock_evaluations = [
        {
            "scores": {"overall_score": 82.0, "technical_correctness": 20.0, "relevance": 18.0, "communication_clarity": 13.0, "problem_solving": 11.0, "practical_examples": 12.0, "answer_structure": 8.0},
            "strengths": ["Clear introduction", "Good summary of stack"],
            "missing_concepts": ["Company alignment"],
            "improved_sample_answer": "Model intro highlighting metrics.",
            "specific_feedback": "Tie your journey closer to Google values."
        },
        {
            "scores": {"overall_score": 85.0, "technical_correctness": 21.0, "relevance": 18.0, "communication_clarity": 13.0, "problem_solving": 13.0, "practical_examples": 12.0, "answer_structure": 8.0},
            "strengths": ["Mentioned circuit breakers and graceful degradation"],
            "missing_concepts": ["Bulkheads", "Health checks"],
            "improved_sample_answer": "Model resilience breakdown.",
            "specific_feedback": "Explain bulkheads and timeouts."
        },
        {
            "scores": {"overall_score": 88.0, "technical_correctness": 23.0, "relevance": 18.0, "communication_clarity": 13.0, "problem_solving": 13.0, "practical_examples": 13.0, "answer_structure": 8.0},
            "strengths": ["Solid cache-aside implementation"],
            "missing_concepts": ["Cache stampede mitigation"],
            "improved_sample_answer": "Model cache invalidation.",
            "specific_feedback": "Cover thundering herd scenarios."
        },
        {
            "scores": {"overall_score": 84.0, "technical_correctness": 21.0, "relevance": 17.0, "communication_clarity": 13.0, "problem_solving": 12.0, "practical_examples": 13.0, "answer_structure": 8.0},
            "strengths": ["Detailed FastAPI and React explanation"],
            "missing_concepts": ["Queue backpressure"],
            "improved_sample_answer": "Model data pipeline.",
            "specific_feedback": "Describe message queue backpressure."
        },
        {
            "scores": {"overall_score": 80.0, "technical_correctness": 19.0, "relevance": 17.0, "communication_clarity": 12.0, "problem_solving": 12.0, "practical_examples": 12.0, "answer_structure": 8.0},
            "strengths": ["Decisive load shedding actions"],
            "missing_concepts": ["Connection pooling math"],
            "improved_sample_answer": "Model incident response.",
            "specific_feedback": "Specify connection pool timeout tuning."
        },
        {
            "scores": {"overall_score": 87.0, "technical_correctness": 22.0, "relevance": 18.0, "communication_clarity": 13.0, "problem_solving": 13.0, "practical_examples": 13.0, "answer_structure": 8.0},
            "strengths": ["Good concurrency debugging example"],
            "missing_concepts": ["Automated test reproduction"],
            "improved_sample_answer": "Model concurrency postmortem.",
            "specific_feedback": "Discuss stress-testing concurrency fixes."
        }
    ]

    report = generate_comprehensive_report(
        company=company,
        role=role,
        difficulty=difficulty,
        interview_type=interview_type,
        questions=mock_questions,
        answers=mock_answers,
        evaluations=mock_evaluations
    )

    print("\n--- Final Report Summary ---")
    print(f"Company & Role: {report.company} - {report.role} ({report.difficulty})")
    print(f"Overall Score: {report.overall_scores.overall_performance}/100")
    print(f"Readiness: {report.overall_analysis.interview_readiness_estimate}")
    print(f"Technical Knowledge: {report.overall_scores.technical_knowledge}%")
    print(f"Communication: {report.overall_scores.communication}%")
    print(f"Problem Solving: {report.overall_scores.problem_solving}%")
    print(f"Practical Experience: {report.overall_scores.practical_experience}%")
    print(f"Answer Structure: {report.overall_scores.answer_structure}%")

    print("\nStrongest Areas:", report.overall_analysis.strongest_answers)
    print("Technical Gaps:", report.overall_analysis.technical_gaps)
    print("Personalized Learning:", report.overall_analysis.personalized_learning_recommendations)
    print("5 Practice Questions:", report.final_recommendation.five_additional_practice_questions)

    assert len(report.question_reviews) == 6
    assert 0 <= report.overall_scores.overall_performance <= 100
    assert len(report.final_recommendation.five_additional_practice_questions) == 5
    print("\nFinal Report Generation Test PASSED!")

if __name__ == "__main__":
    test_final_report_generation()
