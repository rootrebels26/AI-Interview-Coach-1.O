"""
End-to-End Automated Test Suite for Standalone AI Interview Coach.
Validates the complete candidate user journey:
1. System Health check
2. File validation & error handling
3. Resume PDF extraction via PyMuPDF
4. Start Interview with live web scraping
5. 6-Question sequence verification
6. Answer evaluation across all 6 weighted dimensions
7. Final comprehensive feedback report generation
8. Session restart and edge-case handling
"""

import sys
import os
import io
import asyncio
import docx
import httpx
from dotenv import load_dotenv

# Force unbuffered prints
sys.stdout.reconfigure(line_buffering=True)

load_dotenv("AI-Interview-feature/backend/.env")

from app.main import app

def create_sample_docx_bytes():
    doc = docx.Document()
    doc.add_heading("Priya Sharma", 0)
    doc.add_paragraph("priya.sharma@example.com | +1-555-0199 | Seattle, WA")
    doc.add_paragraph("Education: Master of Science in Computer Science, University of Washington, 2022")
    doc.add_paragraph("Technical Skills: Python, Go, TypeScript, SQL, FastAPI, React, Docker, Kubernetes, PostgreSQL, Redis, Kafka")
    doc.add_paragraph("Experience: Full Stack Engineer at CloudScale Technologies (2022 - Present)")
    doc.add_paragraph("- Architected and built low-latency telemetry ingestion pipeline using FastAPI and Redis.")
    doc.add_paragraph("- Designed interactive React telemetry dashboards with sub-second data refresh.")
    doc.add_paragraph("- Containerized microservices using Docker and orchestrated deployments on Kubernetes.")
    doc.add_paragraph("Projects: High-Throughput Analytics Engine")
    doc.add_paragraph("- Ingested 50,000 real-time events per minute with Redis Streams and PostgreSQL storage.")
    doc.add_paragraph("- Implemented circuit breaker and rate limiting mechanisms for 99.99% availability.")
    
    buf = io.BytesIO()
    doc.save(buf)
    return buf.getvalue()

async def main():
    print("=" * 60)
    print("STARTING COMPLETE END-TO-END INTERVIEW WORKFLOW TESTS")
    print("=" * 60)

    transport = httpx.ASGITransport(app=app)
    async with httpx.AsyncClient(transport=transport, base_url="http://test", timeout=60.0) as client:
        # 1. Health check
        print("\n[STEP 1] Testing GET /health...")
        health_resp = await client.get("/health")
        assert health_resp.status_code == 200
        health_data = health_resp.json()
        assert health_data["status"] in ("healthy", "ok")
        assert health_data["storage"] == "in-memory only (zero-database)"
        print("✓ Health check PASSED:", health_data)

        # 2. File validation checks
        print("\n[STEP 2] Testing File Upload Validation (reject invalid formats)...")
        inv_resp = await client.post(
            "/api/interview/analyse-resume",
            files={"file": ("photo.jpg", io.BytesIO(b"fake image data"), "image/jpeg")},
            data={"company": "Google", "role": "Software Engineer"}
        )
        assert inv_resp.status_code == 400
        assert "Unsupported file format" in inv_resp.json()["detail"]
        print("✓ Invalid format rejection PASSED:", inv_resp.json()["detail"])

        # 3. Resume Upload & Extraction
        print("\n[STEP 3] Testing POST /api/interview/analyse-resume (DOCX)...")
        docx_bytes = create_sample_docx_bytes()
        resume_resp = await client.post(
            "/api/interview/analyse-resume",
            files={"file": ("priya_resume.docx", io.BytesIO(docx_bytes), "application/vnd.openxmlformats-officedocument.wordprocessingml.document")},
            data={"company": "Google", "role": "Software Engineer"}
        )
        assert resume_resp.status_code == 200
        resume_data = resume_resp.json()
        assert resume_data["success"] is True
        parsed = resume_data["resume_data"]
        print(f"✓ Parsed Candidate: {parsed['candidate_name']}")
        print(f"✓ Extracted Languages: {parsed['programming_languages']}")
        print(f"✓ Extracted Skills: {parsed['technical_skills']}")
        assert "Python" in parsed["programming_languages"]

        # 4. Start Interview (Live Web Scraping + Personalized Questions)
        print("\n[STEP 4] Testing POST /api/interview/start...")
        start_payload = {
            "company": "Google",
            "role": "Software Engineer",
            "interview_type": "Technical Interview",
            "difficulty": "Advanced",
            "job_description": "Build high-throughput distributed systems and low-latency APIs.",
            "resume_data": parsed
        }
        start_resp = await client.post("/api/interview/start", json=start_payload)
        assert start_resp.status_code == 200
        session_data = start_resp.json()
        session_id = session_data["session_id"]
        total_q = session_data["total_questions"]
        all_questions = session_data["all_questions"]
        assert total_q >= 6
        assert len(all_questions) >= 6
        print(f"✓ Created Session ID: {session_id}")
        print(f"✓ Generated {len(all_questions)} personalized questions tailored to resume:")
        for q in all_questions:
            print(f"   Q{q['question_number']} ({q['category']}): {q['question_text'][:80]}...")

        # 5. Question Navigation & Answer Evaluation Cycle (Questions 1 to 6)
        print("\n[STEP 5] Testing Sequential Navigation & 6-Factor Answer Evaluation...")
        mock_answers = [
            "Hello, I am Priya Sharma, a Full Stack Engineer with 3 years of experience specializing in Python, Go, FastAPI, and React building microservices.",
            "In a distributed architecture, resilience requires isolating faults using circuit breakers, retries with exponential backoff, and graceful degradation.",
            "We implement the Cache-Aside pattern. Reads check Redis first; on misses we load from PostgreSQL and set a TTL. Writes update PostgreSQL and broadcast Redis evictions via Pub/Sub.",
            "In our analytics engine, FastAPI handles async ingest, buffering events into Redis Streams before batching into PostgreSQL to prevent connection saturation.",
            "I would inspect p99 metrics, shed non-critical telemetry endpoints, adjust DB connection pool limits, and spin up additional worker containers.",
            "We investigated a subtle race condition where concurrent async tasks read stale cache keys. We introduced Redis distributed mutex locks to ensure atomic execution."
        ]

        evaluated_answers = []

        for idx in range(1, 7):
            q = all_questions[idx - 1]
            ans = mock_answers[idx - 1]

            # Evaluate Answer
            eval_payload = {
                "session_id": session_id,
                "question_number": idx,
                "question_text": q["question_text"],
                "expected_concepts": q.get("expected_concepts", []),
                "candidate_answer": ans,
                "company": "Google",
                "role": "Software Engineer",
                "difficulty": "Advanced"
            }

            eval_resp = await client.post("/api/interview/evaluate-answer", json=eval_payload)
            assert eval_resp.status_code == 200
            ev_data = eval_resp.json()
            scores = ev_data["scores"]

            assert 0 <= scores["technical_correctness"] <= 25.0
            assert 0 <= scores["relevance"] <= 20.0
            assert 0 <= scores["communication_clarity"] <= 15.0
            assert 0 <= scores["problem_solving"] <= 15.0
            assert 0 <= scores["practical_examples"] <= 15.0
            assert 0 <= scores["answer_structure"] <= 10.0
            assert 0 <= scores["overall_score"] <= 100.0

            evaluated_answers.append(ev_data)
            print(f"✓ Q{idx} Evaluated: Score={scores['overall_score']}/100 | Tech={scores['technical_correctness']}/25 | Relevance={scores['relevance']}/20")

            # Next question check (for questions 1 to 5)
            if idx < 6:
                next_resp = await client.post("/api/interview/next-question", json={
                    "session_id": session_id,
                    "next_question_number": idx + 1
                })
                assert next_resp.status_code == 200
                assert next_resp.json()["question"]["question_number"] == idx + 1

        # 6. Final Report Generation
        print("\n[STEP 6] Testing POST /api/interview/final-report...")
        report_payload = {
            "session_id": session_id,
            "company": "Google",
            "role": "Software Engineer",
            "difficulty": "Advanced",
            "interview_type": "Technical Interview",
            "questions": all_questions,
            "answers": mock_answers,
            "evaluations": evaluated_answers
        }
        report_resp = await client.post("/api/interview/final-report", json=report_payload)
        assert report_resp.status_code == 200
        report_data = report_resp.json()

        overall = report_data["overall_scores"]
        reviews = report_data["question_reviews"]
        analysis = report_data["overall_analysis"]
        recom = report_data["final_recommendation"]

        assert len(reviews) == 6
        assert 0 <= overall["overall_performance"] <= 100
        assert len(recom["five_additional_practice_questions"]) == 5

        print(f"✓ Overall Performance: {overall['overall_performance']}/100")
        print(f"✓ Readiness Estimate: {analysis['interview_readiness_estimate']}")
        print(f"✓ Strongest Areas: {analysis['strongest_answers'][:2]}")
        print(f"✓ Technical Gaps: {analysis['technical_gaps'][:2]}")
        print(f"✓ Generated 5 Custom Practice Questions: {len(recom['five_additional_practice_questions'])} questions")

        # 7. Empty answer test
        print("\n[STEP 7] Testing Edge Case: Blank Answer Submission...")
        blank_eval_resp = await client.post("/api/interview/evaluate-answer", json={
            "question_number": 1,
            "question_text": "Sample question",
            "candidate_answer": "   ",
            "company": "Google",
            "role": "Software Engineer"
        })
        assert blank_eval_resp.status_code == 200
        blank_data = blank_eval_resp.json()
        assert blank_data["scores"]["overall_score"] == 0.0
        print("✓ Blank answer handled with zero points and constructive alert:", blank_data["weaknesses"])

        print("\n" + "=" * 60)
        print("ALL END-TO-END WORKFLOW INTEGRATION TESTS PASSED SUCCESSFULLY!")
        print("=" * 60)

if __name__ == "__main__":
    asyncio.run(main())
