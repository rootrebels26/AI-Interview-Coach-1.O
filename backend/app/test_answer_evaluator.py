import os
from dotenv import load_dotenv

load_dotenv("ai-interview-coach/backend/.env")

from app.services.answer_evaluator import evaluate_candidate_answer

def test_answer_evaluation():
    print("Testing 6-factor weighted answer evaluation...")

    question_text = "How do you handle consistency trade-offs between PostgreSQL and Redis cache in a high-traffic system?"
    expected_concepts = ["Cache-aside pattern", "Eventual consistency", "TTL expiration", "Cache invalidation"]
    candidate_answer = (
        "In our analytics microservice, we implemented the cache-aside pattern. "
        "When reading, the service checks Redis first. If a cache miss occurs, we query PostgreSQL and populate Redis with a 5-minute TTL. "
        "On writes, we write to PostgreSQL and explicitly invalidate the Redis key. "
        "For high write concurrency, we accept eventual consistency and use Redis Pub/Sub to broadcast cache evictions across replica containers."
    )

    evaluation = evaluate_candidate_answer(
        question_number=3,
        question_text=question_text,
        candidate_answer=candidate_answer,
        expected_concepts=expected_concepts,
        company="Google",
        role="Software Engineer",
        difficulty="Advanced"
    )

    print("\n--- Evaluation Results ---")
    print(f"Overall Score: {evaluation.scores.overall_score}/100")
    print(f"  - Technical Correctness: {evaluation.scores.technical_correctness}/25")
    print(f"  - Relevance: {evaluation.scores.relevance}/20")
    print(f"  - Communication Clarity: {evaluation.scores.communication_clarity}/15")
    print(f"  - Problem Solving: {evaluation.scores.problem_solving}/15")
    print(f"  - Practical Examples: {evaluation.scores.practical_examples}/15")
    print(f"  - Answer Structure: {evaluation.scores.answer_structure}/10")

    print("\nStrengths:", evaluation.strengths)
    print("Weaknesses:", evaluation.weaknesses)
    print("Missing Concepts:", evaluation.missing_concepts)
    print("Improved Sample Answer:", evaluation.improved_sample_answer[:120] + "...")
    print("Specific Feedback:", evaluation.specific_feedback)

    # Assertions
    assert 0 <= evaluation.scores.technical_correctness <= 25.0
    assert 0 <= evaluation.scores.relevance <= 20.0
    assert 0 <= evaluation.scores.communication_clarity <= 15.0
    assert 0 <= evaluation.scores.problem_solving <= 15.0
    assert 0 <= evaluation.scores.practical_examples <= 15.0
    assert 0 <= evaluation.scores.answer_structure <= 10.0
    assert 0 <= evaluation.scores.overall_score <= 100.0
    assert len(evaluation.strengths) > 0
    assert len(evaluation.improved_sample_answer) > 20

    print("\nAnswer Evaluation Test PASSED!")

if __name__ == "__main__":
    test_answer_evaluation()
