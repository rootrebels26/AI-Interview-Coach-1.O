"""Company and role-specific interview prompt profiles."""

ROLE_PROMPTS = {
    "technical": "You are interviewing for a Software Engineer role. Prioritize data structures, algorithms, clean code, complexity analysis, debugging, and clear spoken reasoning.",
    "software_developer": "You are interviewing for a Software Engineer role. Prioritize data structures, algorithms, clean code, complexity analysis, debugging, and clear spoken reasoning.",
    "frontend": "You are interviewing for a Frontend Developer role. Prioritize JavaScript, React, browser behavior, accessibility, performance, state management, and product-minded UI tradeoffs.",
    "backend": "You are interviewing for a Backend Developer role. Prioritize APIs, databases, distributed systems, caching, queues, concurrency, reliability, and operational tradeoffs.",
    "behavioral": "You are running a behavioral interview. Prioritize leadership, collaboration, ambiguity, conflict, learning mindset, ownership, and impact.",
    "data_science": "You are interviewing for a Data Scientist role. Prioritize statistics, ML fundamentals, experiment design, SQL, model evaluation, and communicating uncertainty.",
    "fullstack": "You are interviewing for a Full Stack Engineer role. Prioritize frontend, backend, API design, data modeling, performance, reliability, and end-to-end product thinking.",
    "general": "You are a professional AI Interview Coach. Your goal is to conduct a realistic job interview.",
}

COMPANY_PROFILES = {
    "google": {
        "label": "Google",
        "source_note": (
            "Use Google-style interview patterns informed by public preparation material: "
            "Google Careers interview guidance, public candidate reports, and common free prep guides. "
            "Do not claim a question is currently or officially asked by Google."
        ),
        "style": (
            "Make the interview feel like a Google Software Engineering or Googleyness round: "
            "ambiguous prompt first, candidate clarifies requirements, then asks for an efficient solution. "
            "Probe correctness, edge cases, complexity, communication, and collaboration. "
            "For senior/backend/fullstack roles, include scalable system design follow-ups."
        ),
        "question_bank": {
            "technical": [
                "Given a stream of search queries, design an algorithm to return the top K trending queries in the last 10 minutes. What data structures would you use and why?",
                "You are given a grid with blocked cells. Find the shortest path from a start cell to a target cell, then discuss how your solution changes if some blocked cells can be removed.",
                "Design a data structure that supports insert, delete, search, and getRandom in expected O(1) time. Walk me through edge cases.",
                "Given meeting time intervals from many calendars, return the earliest time slot where all required people are available for a fixed duration.",
                "You receive a very large log of user events. How would you detect duplicate events efficiently when memory is limited?",
            ],
            "frontend": [
                "Build a typeahead search box for millions of possible results. How would you handle latency, caching, accessibility, and stale responses?",
                "A React page becomes slow after adding a large results table. How would you diagnose and improve rendering performance?",
                "Design a reusable component system for an internal Google-scale dashboard. How would you manage consistency without blocking product teams?",
                "How would you make a complex form reliable when network requests can fail, be retried, or return out of order?",
            ],
            "backend": [
                "Design a URL shortener that supports billions of redirects per day. Cover storage, caching, collision handling, analytics, and failure modes.",
                "Design a notification delivery service for email, push, and SMS. How do you handle retries, ordering, rate limits, and observability?",
                "You own an API whose p99 latency doubled after a launch. How would you investigate and mitigate it?",
                "Design a distributed rate limiter for multiple regions. What consistency tradeoffs would you choose?",
            ],
            "fullstack": [
                "Design an interview scheduling product from UI to backend. Cover availability search, conflict handling, notifications, and scale.",
                "Create a collaborative document review feature. How would you design real-time updates, permissions, and offline recovery?",
                "Build a feature flag platform for web and backend services. How do you make rollout safe and observable?",
            ],
            "data_science": [
                "How would you design an experiment to measure whether a search ranking change improved user satisfaction?",
                "A model has strong offline metrics but weak production impact. How would you debug the gap?",
                "Write a SQL approach to find users whose engagement dropped sharply week over week, then explain how you would validate the result.",
                "How would you detect abuse or spam in a large user-generated content system while minimizing false positives?",
            ],
            "behavioral": [
                "Tell me about a time you worked through ambiguity and still delivered a meaningful result.",
                "Describe a disagreement with a teammate or manager. How did you handle it and what changed afterward?",
                "Tell me about a time you received tough feedback. What did you do with it?",
                "Describe a situation where you had to balance speed, quality, and user impact.",
                "Tell me about a project where you helped others succeed, not just yourself.",
            ],
            "general": [
                "Walk me through a technically difficult project and the tradeoffs you made.",
                "Tell me about a time you solved a problem with incomplete information.",
                "Describe a product or system you use often. How would you improve it for reliability and scale?",
            ],
        },
    }
}


def normalize_company(company):
    return (company or "general").strip().lower()


def build_interview_prompt(subject="general", company="general"):
    role_prompt = ROLE_PROMPTS.get(subject, ROLE_PROMPTS["general"])
    company_key = normalize_company(company)
    profile = COMPANY_PROFILES.get(company_key)
    subject_label = (subject or "general").replace("_", " ").title()

    base_rules = (
        f"{role_prompt} The selected interview subject is: {subject_label}. "
        "Stay strictly inside this selected subject and normal interview process. "
        "Ask only questions that fit the selected subject; do not switch to other domains, trivia, casual chat, or unrelated topics. "
        "If the candidate asks something unrelated to this interview subject, do not answer it. Say: "
        "\"I can only continue with your selected interview subject. Let's stay focused on the interview.\" "
        "Then ask the next relevant interview question. "
        "Ask one question at a time. Keep responses concise enough for text-to-speech. "
        "After the candidate answers, give one short observation, then ask either one targeted follow-up "
        "or the next question. Do not provide full solutions unless the candidate asks for help. "
        "Prefer realistic interview wording over generic quiz wording. Sound like a patient human interviewer, "
        "not a formal AI assistant. Use plain, direct language. If the candidate asks for a coding answer, "
        "briefly explain the idea, then put the solution inside a fenced code block with the correct language "
        "tag, for example ```javascript. Keep any code neatly indented."
    )

    if not profile:
        return base_rules

    questions = profile["question_bank"].get(subject) or profile["question_bank"].get("general", [])
    question_list = "\n".join(f"- {question}" for question in questions)

    return (
        f"{base_rules}\n\n"
        f"Target company: {profile['label']}.\n"
        f"{profile['source_note']}\n"
        f"{profile['style']}\n\n"
        "Use these public-prep-inspired question patterns for this session. Rotate through them naturally; "
        "adapt wording to the candidate's answers and seniority. Do not dump the list.\n"
        f"{question_list}\n\n"
        "When asking coding questions, require the candidate to clarify constraints, explain brute force, "
        "improve to an efficient approach, state time/space complexity, and mention tests. "
        "When asking behavioral questions, request STAR-style structure and concrete impact."
    )
