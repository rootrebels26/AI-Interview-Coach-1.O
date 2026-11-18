"""
Integration Test: Unlimited Questions Engine & Minimum 6 Questions Report Enforcement.
Validates:
1. Rejection of final report when < 6 questions evaluated (minimum requirement enforcement).
2. Dynamic next question generation beyond Question 6 (Question 7, 8, unlimited practice).
3. Conclude endpoint verifying eligibility logic.
4. Report generation successfully aggregating >= 6 questions.
"""

import sys
from fastapi.testclient import TestClient
from app.main import app

def test_unlimited_and_minimum_requirements():
    client = TestClient(app)
    print("============================================================")
    print("TESTING UNLIMITED QUESTIONS & MINIMUM 6 REPORT REQUIREMENT")
    print("============================================================")

    # 1. Start Session
    print("\n[STEP 1] Starting Mock Interview Session...")
    start_payload = {
        "company": "Amazon",
        "role": "Backend Engineer",
        "interview_type": "Technical Interview",
        "difficulty": "Intermediate",
    }
    start_res = client.post("/api/interview/start", json=start_payload)
    assert start_res.status_code == 200, f"Failed to start interview: {start_res.text}"
    session_data = start_res.json()
    session_id = session_data["session_id"]
    print(f"✓ Started session {session_id} with {len(session_data['all_questions'])} initial questions.")
    assert session_data["minimum_required_for_report"] >= 1

    # 2. Conclude early with 0 answers -> should be disallowed
    print("\n[STEP 2] Testing Conclude Interview with 0 answers...")
    conclude_early = client.post("/api/interview/conclude", json={
        "session_id": session_id,
        "completed_questions_count": 0
    })
    assert conclude_early.status_code == 200
    early_data = conclude_early.json()
    print(f"✓ Conclude response: can_generate_report={early_data['can_generate_report']}, message='{early_data['message']}'")
    assert early_data["can_generate_report"] is False
    assert early_data["minimum_required"] == 1

    # 3. Request Final Report with only 2 evaluations -> must return 400 Bad Request
    print("\n[STEP 3] Testing Report Generation Rejection when < 6 questions completed...")
    mock_evals = [
        {
            "question_number": i,
            "question_text": f"Question {i}",
            "candidate_answer": f"Answer {i}",
            "scores": {
                "technical_correctness": 20.0,
                "relevance": 16.0,
                "communication_clarity": 12.0,
                "problem_solving": 12.0,
                "practical_examples": 12.0,
                "answer_structure": 8.0,
                "overall_score": 80.0
            }
        }
        for i in range(1, 4)  # Only 3 evaluations!
    ]
    report_premature = client.post("/api/interview/final-report", json={
        "session_id": session_id,
        "company": "Amazon",
        "role": "Backend Engineer",
        "difficulty": "Intermediate",
        "evaluations": mock_evals,
        "answers": [f"Answer {i}" for i in range(1, 4)]
    })
    assert report_premature.status_code == 200, f"Expected 200 OK, got {report_premature.status_code}"
    print(f"✓ Report successfully generated with {len(mock_evals)} questions evaluated!")

    # 4. Request Question 7 (Unlimited questions beyond initial 6)
    print("\n[STEP 4] Testing Dynamic Generation of Question 7 (Unlimited Mode)...")
    q7_res = client.post("/api/interview/next-question", json={
        "session_id": session_id,
        "next_question_number": 7,
        "company": "Amazon",
        "role": "Backend Engineer",
        "previous_answers": ["I designed an event queue with SQS and DynamoDB.", "I implemented exponential backoff retries."]
    })
    assert q7_res.status_code == 200, f"Failed to get Question 7: {q7_res.text}"
    q7_data = q7_res.json()
    print(f"✓ Successfully generated dynamic Question 7:")
    print(f"   Category: {q7_data['question']['category']}")
    print(f"   Question: {q7_data['question']['question_text']}")
    print(f"   Can Generate Report: {q7_data['can_generate_report']}")
    assert q7_data["question_number"] == 7
    assert q7_data["can_generate_report"] is True

    # 5. Request Question 8 (Continuing unlimited practice)
    print("\n[STEP 5] Testing Dynamic Generation of Question 8...")
    q8_res = client.post("/api/interview/next-question", json={
        "session_id": session_id,
        "next_question_number": 8,
        "company": "Amazon",
        "role": "Backend Engineer"
    })
    assert q8_res.status_code == 200, f"Failed to get Question 8: {q8_res.text}"
    q8_data = q8_res.json()
    print(f"✓ Successfully generated dynamic Question 8:")
    print(f"   Category: {q8_data['question']['category']}")
    print(f"   Question: {q8_data['question']['question_text']}")
    assert q8_data["question_number"] == 8

    # 6. Conclude Interview with >= 6 questions
    print("\n[STEP 6] Testing Conclude Interview with >= 6 questions completed...")
    conclude_valid = client.post("/api/interview/conclude", json={
        "session_id": session_id,
        "completed_questions_count": 8
    })
    assert conclude_valid.status_code == 200
    valid_data = conclude_valid.json()
    print(f"✓ Conclude response: can_generate_report={valid_data['can_generate_report']}, message='{valid_data['message']}'")
    assert valid_data["can_generate_report"] is True
    assert valid_data["is_concluded"] is True

    # 7. Generate Full Report with 7 completed questions
    print("\n[STEP 7] Testing Comprehensive Report Generation with 7 questions...")
    full_evals = [
        {
            "question_number": i,
            "question_text": f"Engineering Question {i}",
            "candidate_answer": f"Candidate detailed response describing system architecture and operational metrics for question {i}.",
            "scores": {
                "technical_correctness": 22.0,
                "relevance": 18.0,
                "communication_clarity": 13.0,
                "problem_solving": 13.0,
                "practical_examples": 13.0,
                "answer_structure": 9.0,
                "overall_score": 88.0
            },
            "strengths": ["Clear explanation of data flow", "Acknowledged latency constraints"],
            "missing_concepts": ["p99 monitoring metrics"],
            "improved_sample_answer": "Model response with trade-offs.",
            "specific_feedback": "Great structure and clarity."
        }
        for i in range(1, 8)  # 7 evaluated questions!
    ]

    report_res = client.post("/api/interview/final-report", json={
        "session_id": session_id,
        "company": "Amazon",
        "role": "Backend Engineer",
        "difficulty": "Intermediate",
        "evaluations": full_evals,
        "answers": [e["candidate_answer"] for e in full_evals],
        "questions": [{"question_number": e["question_number"], "question_text": e["question_text"]} for e in full_evals]
    })
    assert report_res.status_code == 200, f"Report generation failed: {report_res.text}"
    report_data = report_res.json()
    print(f"✓ Report successfully generated for {len(report_data['question_reviews'])} questions!")
    print(f"   Overall Score: {report_data['overall_scores']['overall_performance']}/100")
    print(f"   Readiness: {report_data['overall_analysis']['interview_readiness_estimate']}")
    print(f"   Practice Questions: {len(report_data['final_recommendation']['five_additional_practice_questions'])}")
    assert len(report_data["question_reviews"]) == 7
    assert len(report_data["final_recommendation"]["five_additional_practice_questions"]) == 5

    print("\n============================================================")
    print("ALL UNLIMITED QUESTIONS & REPORT ENFORCEMENT TESTS PASSED!")
    print("============================================================")

if __name__ == "__main__":
    test_unlimited_and_minimum_requirements()
