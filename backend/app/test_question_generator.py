import os
from dotenv import load_dotenv

load_dotenv("ai-interview-coach/backend/.env")

from app.schemas.interview import ResumeData, ProjectItem
from app.services.web_scraper import scrape_interview_questions
from app.services.question_generator import generate_interview_questions

def test_web_scraper_and_question_generation():
    print("1. Testing Web Scraper for real-world interview questions...")
    company = "Google"
    role = "Software Engineer"
    scraped = scrape_interview_questions(company, role, "Technical Interview")
    print(f"Scraped {len(scraped)} real-world question benchmarks from live web sources.")
    for i, q in enumerate(scraped[:3], 1):
        print(f"  [{i}] {q}")

    assert len(scraped) > 0, "Web scraper should return real questions"
    print("Web Scraper Test PASSED!\n")

    print("2. Testing Personalized 6-Question Generation with AI grounded in web scraping...")
    sample_resume = ResumeData(
        candidate_name="Priya Sharma",
        candidate_background="Full Stack Engineer with 3 years building cloud microservices and React frontends.",
        technical_skills=["React", "FastAPI", "Docker", "PostgreSQL", "Redis"],
        programming_languages=["Python", "TypeScript", "SQL"],
        projects=[
            ProjectItem(
                title="Real-Time Analytics Engine",
                technologies=["FastAPI", "Redis", "React"],
                description="Engine processing 50,000 telemetry events per minute with sub-second dashboard rendering."
            )
        ],
        summary="Full Stack Engineer with expertise in Python, React, and scalable backend design."
    )

    questions = generate_interview_questions(
        company=company,
        role=role,
        interview_type="Technical Interview",
        difficulty="Advanced",
        resume=sample_resume,
        job_description="Looking for an engineer to build highly resilient distributed systems and APIs."
    )

    print(f"Generated {len(questions)} personalized questions:")
    for q in questions:
        print(f"\n[Q{q['question_number']}] ({q['category']})")
        print(f"Question: {q['question_text']}")
        print(f"Spoken Prompt: {q.get('spoken_prompt', '')}")
        print(f"Expected Concepts: {q.get('expected_concepts', [])}")

    assert len(questions) >= 6, f"Expected at least 6 questions, got {len(questions)}"
    for idx, q in enumerate(questions, 1):
        assert q["question_number"] == idx
        assert len(q["question_text"]) > 20

    # Ensure questions specifically reference the candidate's resume/project
    all_q_text = " ".join([q["question_text"].lower() for q in questions])
    assert any(w in all_q_text for w in ["real-time", "analytics", "redis", "fastapi", "project", "resume"]), "Questions must probe resume/project"

    print("\nPersonalized 6-Question Generation Test PASSED!")

if __name__ == "__main__":
    test_web_scraper_and_question_generation()
