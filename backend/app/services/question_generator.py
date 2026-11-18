"""
Personalized AI Interview Question Generator.
Enforces connected, resume-grounded questions across EVERY part of the interview,
including multiple behavioral questions (probing situation, conflict, failure/tradeoffs)
and multi-turn technical and case study inquiries, without static hardcoded question banks.
Specially tuned for Software Engineers, Data Engineers, and Fabric Engineers.
"""

import re
from typing import List, Dict, Any, Optional
from app.services.ai_provider import call_ai, extract_json_from_text
from app.services.web_scraper import scrape_interview_questions
from app.schemas.interview import ResumeData

def extract_candidate_highlights(resume: Optional[Any]) -> Dict[str, Any]:
    """Extracts structured, clean profile highlights from candidate resume data."""
    if not resume:
        return {
            "name": "",
            "first_name": "",
            "has_real_name": False,
            "summary": "Experienced software and data engineer",
            "skills": "distributed systems, cloud architecture, clean code, data modeling",
            "primary_lang": "Python/SQL",
            "proj_1_title": "production system architecture",
            "proj_1_tech": "modern cloud tools",
            "proj_2_title": "distributed data pipeline",
            "proj_2_tech": "streaming and caching infrastructure",
            "company_experience": "recent engineering work",
        }

    # Extract projects safely
    projects = (
        getattr(resume, "projects", None) or
        (resume.get("projects") if isinstance(resume, dict) else []) or
        []
    )
    p1 = projects[0] if len(projects) > 0 else None
    p2 = projects[1] if len(projects) > 1 else None

    p1_title = getattr(p1, "title", None) or (p1.get("title") if isinstance(p1, dict) else None) or "your featured technical project"
    p1_techs = getattr(p1, "technologies", None) or (p1.get("technologies") if isinstance(p1, dict) else []) or []
    p1_tech = ", ".join(p1_techs[:4]) if p1_techs else "your core technology stack"

    p2_title = getattr(p2, "title", None) or (p2.get("title") if isinstance(p2, dict) else None) or "your secondary technical deliverable"
    p2_techs = getattr(p2, "technologies", None) or (p2.get("technologies") if isinstance(p2, dict) else []) or []
    p2_tech = ", ".join(p2_techs[:4]) if p2_techs else "supporting infrastructure tools"

    # Extract skills & languages safely
    tech_skills = getattr(resume, "technical_skills", None) or (resume.get("technical_skills") if isinstance(resume, dict) else []) or []
    prog_langs = getattr(resume, "programming_languages", None) or (resume.get("programming_languages") if isinstance(resume, dict) else []) or []
    skills = ", ".join(tech_skills[:6]) if tech_skills else "distributed systems, data architecture"
    langs = prog_langs[0] if prog_langs else "Python"

    # Extract past companies safely
    work = (
        getattr(resume, "work_experience", None) or
        (resume.get("work_experience") if isinstance(resume, dict) else None) or
        getattr(resume, "internships", None) or
        (resume.get("internships") if isinstance(resume, dict) else None) or
        []
    )
    first_work = work[0] if work else None
    comp_exp = (
        getattr(first_work, "company", None) or
        (first_work.get("company") if isinstance(first_work, dict) else None) or
        "your past engineering projects"
    )

    cand_name = (
        getattr(resume, "candidate_name", None) or
        (resume.get("candidate_name") if isinstance(resume, dict) else None) or
        ""
    ).strip()
    if any(kw in cand_name.lower() for kw in ["candidate", "unknown", "n/a", "none", "null", "online", "developer", "engineer", "portal", "system", "viva", "exam"]):
        cand_name = ""

    cand_first_name = cand_name.split()[0].capitalize() if cand_name else ""
    if any(kw in cand_first_name.lower() for kw in ["online", "candidate", "unknown", "developer", "engineer", "portal", "system", "viva", "exam"]):
        cand_first_name = ""
    summary_val = getattr(resume, "summary", "") or (resume.get("summary") if isinstance(resume, dict) else "")

    return {
        "name": cand_name,
        "first_name": cand_first_name,
        "has_real_name": bool(cand_first_name),
        "summary": summary_val[:180] if summary_val else "Engineering candidate",
        "skills": skills,
        "primary_lang": langs,
        "proj_1_title": p1_title,
        "proj_1_tech": p1_tech,
        "proj_2_title": p2_title,
        "proj_2_tech": p2_tech,
        "company_experience": comp_exp,
    }

ROLE_PROFILES = {
    "fabric engineer": {
        "core_pillars": "Microsoft Fabric OneLake, Medallion Architecture (Bronze/Silver/Gold), Direct Lake mode, PySpark V-Order compaction, and Lakehouse vs Warehouse design",
        "internals_focus": "Delta Parquet transaction logs, OneLake indexing, and memory allocation between Analysis Services and Spark pools",
        "crisis_focus": "a silent data corruption incident or pipeline timeout where a Gold layer report displayed erroneous metrics under an executive deadline",
        "scale_focus": "a 20x surge in streaming transaction ingestion into OneLake with multiple concurrent Power BI Direct Lake consumers",
        "philosophy_focus": "governing a single source of truth across diverse analytical engines (Spark vs T-SQL vs KQL) without data duplication",
    },
    "data engineer": {
        "core_pillars": "distributed PySpark pipelines, partition skew optimization, Delta/Iceberg/Hudi ACID guarantees, Kafka CDC ingestion, and dimensional modeling",
        "internals_focus": "Spark DAG stage execution, shuffle hash joins vs broadcast joins, executor memory spill, and checkpoint state management",
        "crisis_focus": "an out-of-memory executor crash or late-arriving CDC event duplicate that polluted downstream data marts",
        "scale_focus": "a 20x surge in hourly ingested parquet data causing extreme partition skew on uneven customer ID distribution",
        "philosophy_focus": "balancing strict ACID write guarantees against low-latency analytical query response times in modern lakehouses",
    },
    "software engineer": {
        "core_pillars": "distributed system architecture, database indexing & transaction isolation, REST/gRPC API idempotency, and concurrent thread-safety",
        "internals_focus": "concurrency race conditions, memory leaks, connection pool exhaustion, and distributed locking via Redis or ZooKeeper",
        "crisis_focus": "a cascading microservice failure under peak load that saturated database connection pools and degraded latency",
        "scale_focus": "a 20x increase in concurrent client API requests saturating read replicas and distributed cache memory",
        "philosophy_focus": "balancing clean modular architecture and unit test coverage against rapid delivery of production features",
    },
    "frontend developer": {
        "core_pillars": "virtual DOM reconciliation, Core Web Vitals (LCP, INP, CLS), global state management, code-splitting, and client-side caching",
        "internals_focus": "rendering loops, unnecessary component re-renders, JS heap memory leaks, and browser main-thread blocking",
        "crisis_focus": "a critical frontend memory leak that crashed user browser tabs during heavy data table interactions",
        "scale_focus": "rendering complex realtime dashboards with thousands of dynamic streaming DOM updates without frame drops",
        "philosophy_focus": "balancing rich client-side interactivity and complex state against minimal bundle size and fast initial paint",
    },
    "backend developer": {
        "core_pillars": "high-throughput API design, asynchronous message queues, database query execution plans, and resilient failover architecture",
        "internals_focus": "B-Tree vs LSM-Tree database storage, thread pool saturation, deadlock detection, and backpressure mechanisms",
        "crisis_focus": "a database deadlock or unindexed slow query that blocked database worker connections during a critical peak period",
        "scale_focus": "a 20x surge in write-heavy requests causing database replica lag and message queue consumer backlog",
        "philosophy_focus": "designing self-healing distributed backends with circuit breakers, graceful degradation, and strict idempotency",
    },
    "full stack developer": {
        "core_pillars": "end-to-end full stack architecture, API contracts, database schema migrations, and client-server state synchronization",
        "internals_focus": "optimistic UI updates vs server consistency, JWT/session authentication flows, and relational database indexing",
        "crisis_focus": "a breaking API contract change or schema migration that caused frontend runtime exceptions across production clients",
        "scale_focus": "handling simultaneous traffic spikes on both client static assets and stateful backend database queries",
        "philosophy_focus": "maintaining a cohesive type-safe domain model and robust automated testing across both client and server tiers",
    },
    "devops engineer": {
        "core_pillars": "Kubernetes orchestration, Infrastructure as Code with Terraform, CI/CD automated deployments, and zero-downtime rollouts",
        "internals_focus": "Pod disruption budgets, container OOMKilled events, VPC peering latency, and immutable infrastructure state drift",
        "crisis_focus": "a botched production deployment that passed staging but triggered a crash-loop backoff across all Kubernetes nodes",
        "scale_focus": "autoscaling Kubernetes clusters and ingress controllers under sudden 20x traffic spikes without cold-start latency",
        "philosophy_focus": "establishing GitOps workflows, automated rollback triggers, and comprehensive distributed telemetry",
    },
    "cloud solutions architect": {
        "core_pillars": "multi-region cloud resilience, disaster recovery (RPO/RTO), cloud cost optimization, and secure network segmentation",
        "internals_focus": "cross-region data replication latency, service mesh routing, identity federation, and private endpoint routing",
        "crisis_focus": "a major cloud provider zone outage that threatened data availability and required automated cross-region failover",
        "scale_focus": "architecting an enterprise system to scale elastically from 10k to 500k concurrent users while controlling cloud spend",
        "philosophy_focus": "navigating the tradeoffs between managed cloud-native serverless services and portable containerized architectures",
    },
    "ai engineer": {
        "core_pillars": "LLM fine-tuning, retrieval-augmented generation (RAG), vector database indexing, model quantization, and latency budgets",
        "internals_focus": "embedding drift, token context window limits, vector similarity search algorithms (HNSW vs IVF), and GPU inference throughput",
        "crisis_focus": "a high-rate hallucination spike or LLM provider rate-limit incident that degraded customer search accuracy in production",
        "scale_focus": "scaling RAG document retrieval across 10 million documents while maintaining sub-200ms vector search latency",
        "philosophy_focus": "evaluating model accuracy, factual grounding, and cost-per-inference when deploying generative AI to production",
    },
}

def get_role_profile(role: str) -> Dict[str, str]:
    """Retrieves deep technical pillars and focus areas tailored to the target role."""
    role_lower = (role or "").lower()
    for k, prof in ROLE_PROFILES.items():
        if k in role_lower:
            return prof
    if any(w in role_lower for w in ["fabric", "microsoft fabric", "onelake"]):
        return ROLE_PROFILES["fabric engineer"]
    if any(w in role_lower for w in ["data", "etl", "warehouse", "analytics", "spark"]):
        return ROLE_PROFILES["data engineer"]
    if any(w in role_lower for w in ["front", "react", "ui", "web"]):
        return ROLE_PROFILES["frontend developer"]
    if any(w in role_lower for w in ["devops", "sre", "cloud", "infra"]):
        return ROLE_PROFILES["devops engineer"]
    if any(w in role_lower for w in ["ai", "ml", "learning", "vision", "nlp"]):
        return ROLE_PROFILES["ai engineer"]
    if any(w in role_lower for w in ["full stack", "fullstack"]):
        return ROLE_PROFILES["full stack developer"]
    return ROLE_PROFILES["software engineer"]

# Structured interview roadmap: EVERY part contains multiple connected questions
INTERVIEW_PARTS = [
    {
        "part_id": 1,
        "title": "Introduction",
        "category": "Introduction & Background",
        "sub_questions": [
            {
                "sub_index": 1,
                "focus": "Natural introduction, career background, and recent technical projects overview.",
                "make_template": lambda c, r, d, it, res, sh, h, p: (
                    f"Welcome to {c}, {h['first_name']}! I'm excited to connect with you today for this {r} interview. "
                    f"To kick things off, could you briefly introduce yourself and share a bit about your technical background and what projects you've been working on recently?"
                    if h.get("first_name")
                    else
                    f"Welcome to {c}! I'm excited to connect with you today for this {r} interview. "
                    f"To kick things off, could you briefly introduce yourself and share a bit about your technical background and what projects you've been working on recently?"
                ),
            },
            {
                "sub_index": 2,
                "focus": "Role motivation, company alignment, and engineering interests connected to Q1.",
                "make_template": lambda c, r, d, it, res, sh, h, p: (
                    f"Thanks for sharing that! Looking at your hands-on experience with {h['primary_lang']} and {h['skills']}: "
                    f"what specifically drew you to this {r} opportunity at {c}, and what engineering challenges are you most eager to tackle here?"
                ),
            },
        ],
    },
    {
        "part_id": 2,
        "title": "Behavioral Questions",
        "category": "Behavioral & Situational Questions",
        "sub_questions": [
            {
                "sub_index": 1,
                "focus": "High-pressure deadlines and engineering tradeoffs (STAR method) in candidate's project.",
                "make_template": lambda c, r, d, it, res, sh, h, p: (
                    f"In high-stakes {r} projects like '{h['proj_1_title']}', aggressive deadlines are common. "
                    f"Can you share a specific situation where you had to deliver a critical milestone under tight constraints? "
                    f"What architectural tradeoffs or technical shortcuts did you make, and how did you manage technical debt?"
                ),
            },
            {
                "sub_index": 2,
                "focus": "Navigating technical conflict or architecture disagreements connected to Q3.",
                "make_template": lambda c, r, d, it, res, sh, h, p: (
                    f"Following up on those project tradeoffs: differing architectural opinions frequently arise among senior engineers. "
                    f"Can you describe a specific time when you strongly disagreed with a teammate or lead regarding an architecture choice for {r}? "
                    f"How did you resolve the conflict?"
                ),
            },
            {
                "sub_index": 3,
                "focus": "Handling unexpected production crisis, failure, and retrospective learning connected to Q4.",
                "make_template": lambda c, r, d, it, res, sh, h, p: (
                    f"Building upon how you handle team challenges: every experienced {r} encounters unforeseen incidents. "
                    f"Tell me about a time when you dealt with {p['crisis_focus']}. "
                    f"Step-by-step, how did you isolate the root cause, mitigate the blast radius, and ensure it could never happen again?"
                ),
            },
        ],
    },
    {
        "part_id": 3,
        "title": "Case Study & Fundamentals",
        "category": "Core Engineering Fundamentals",
        "sub_questions": [
            {
                "sub_index": 1,
                "focus": "Core domain fundamentals grounded in live scraped industry benchmarks.",
                "make_template": lambda c, r, d, it, res, sh, h, p: (
                    f"Connecting your background to foundational principles: for a {d} {r} at {c}: {sh} "
                    f"How would you approach and explain this fundamental concept from first principles?"
                ),
            },
            {
                "sub_index": 2,
                "focus": "Deep technical trade-offs, concurrency, memory models, and internals connected to Q6.",
                "make_template": lambda c, r, d, it, res, sh, h, p: (
                    f"Diving deeper into {r} internals: when optimizing {p['internals_focus']} "
                    f"in high-throughput production, what exact metrics, concurrency limits, and bottlenecks do you monitor?"
                ),
            },
        ],
    },
    {
        "part_id": 4,
        "title": "Skills Assessment & Project Dive",
        "category": "Resume & Practical Project Probing",
        "sub_questions": [
            {
                "sub_index": 1,
                "focus": "Probing specific resume project architecture and candidate contributions.",
                "make_template": lambda c, r, d, it, res, sh, h, p: (
                    f"On your resume you highlighted '{h['proj_1_title']}' built with {h['proj_1_tech']}. "
                    f"As a {r}, walk me through the end-to-end architecture: what were your individual contributions, and what was the hardest technical decision you made?"
                ),
            },
            {
                "sub_index": 2,
                "focus": "Handling 20x scale growth, architectural bottlenecks, and redesign connected to Q8.",
                "make_template": lambda c, r, d, it, res, sh, h, p: (
                    f"Stress-testing that same architecture in '{h['proj_1_title']}': if {p['scale_focus']}, "
                    f"what exact component or layer would fail first, and how would you redesign it to guarantee fault-tolerant high availability?"
                ),
            },
        ],
    },
    {
        "part_id": 5,
        "title": "Candidate Q&A & Problem Solving",
        "category": "System Architecture & Scenario Reflection",
        "sub_questions": [
            {
                "sub_index": 1,
                "focus": "Realistic high-scale system scenario or debugging challenge at company scale.",
                "make_template": lambda c, r, d, it, res, sh, h, p: (
                    f"Here is an operational scenario at {c}: your {r} production service experiences an unexpected spike "
                    f"in latency and data anomalies under peak traffic. Step-by-step, how do you triage, isolate the bottleneck, and restore normal operations?"
                ),
            },
            {
                "sub_index": 2,
                "focus": "Final candidate reflection, engineering philosophy, and Q&A connected to Q10.",
                "make_template": lambda c, r, d, it, res, sh, h, p: (
                    f"Bringing our technical discussion together: regarding {p['philosophy_focus']}, what is the single most important architectural or coding principle "
                    f"you insist on across all your projects, and what technical questions do you have for our engineering team at {c}?"
                ),
            },
        ],
    },
]

def build_interview_prompt_context(
    company: str,
    role: str,
    interview_type: str,
    difficulty: str,
    resume: Optional[ResumeData] = None,
    job_description: Optional[str] = "",
    scraped_questions: Optional[List[str]] = None,
) -> str:
    """Constructs prompt context for AI interviewer question generation."""
    h = extract_candidate_highlights(resume)
    prof = get_role_profile(role)
    scraped_context = "\n".join([f"- {q}" for q in (scraped_questions or [])[:6]]) or "General industry interview standards"

    return f"""
INTERVIEW PARAMETERS:
- Target Company: {company}
- Target Job Role: {role}
- Interview Type: {interview_type}
- Difficulty Level: {difficulty}

ROLE TECHNICAL PILLARS & ARCHITECTURAL FOCUS:
- Core Pillars: {prof['core_pillars']}
- Internals Focus: {prof['internals_focus']}
- Crisis & Failure Scenario: {prof['crisis_focus']}
- Scale Benchmark: {prof['scale_focus']}
- Engineering Philosophy: {prof['philosophy_focus']}

CANDIDATE RESUME CONTEXT (Directly weave these items into questions):
- Candidate Name: {h['name']}
- Background: {h['summary']}
- Primary Programming Language: {h['primary_lang']}
- Core Technical Skills: {h['skills']}
- Featured Project 1: {h['proj_1_title']} ({h['proj_1_tech']})
- Featured Project 2: {h['proj_2_title']} ({h['proj_2_tech']})
- Past Experience / Company: {h['company_experience']}

LIVE WEB-SCRAPED BENCHMARK QUESTIONS:
{scraped_context}
"""

def generate_interview_questions(
    company: str,
    role: str,
    interview_type: str,
    difficulty: str,
    resume: Optional[ResumeData] = None,
    job_description: Optional[str] = "",
) -> List[Dict[str, Any]]:
    """
    Generates a realistic multi-part interview sequence where EVERY part of the interview
    contains multiple questions (including multiple behavioral questions, multiple technical probes, etc.).
    Every question is deeply grounded in candidate resume items and logically connects to the next.
    Total initial roadmap: 11 connected questions across 5 core topics.
    """
    # 1. Scrape live questions from web repositories
    scraped_questions = scrape_interview_questions(company, role, interview_type)

    # 2. Extract resume highlights & target role profile
    highlights = extract_candidate_highlights(resume)
    prof = get_role_profile(role)

    # 3. Build AI context
    context = build_interview_prompt_context(
        company=company,
        role=role,
        interview_type=interview_type,
        difficulty=difficulty,
        resume=resume,
        job_description=job_description,
        scraped_questions=scraped_questions,
    )

    system_prompt = (
        "You are an expert technical interviewer conducting a realistic mock interview. "
        "CRITICAL RULES:\n"
        "1. Every question must directly probe the candidate's target role depth and cite the candidate's actual resume items (named projects, stated technologies, and work background).\n"
        "2. In a real interview, you ask MORE THAN ONE QUESTION per topic (e.g. multiple behavioral questions probing STAR methodology, "
        "multiple deep technical probes into role internals, and multiple case study questions).\n"
        "3. Each question MUST connect conversationally from the previous topic (connected question chain).\n"
        "4. Drill deep into the target role's internals, edge-case failure modes, and architectural tradeoffs.\n"
        "Return ONLY a valid JSON object with a 'questions' array. Keep each question crisp and under 25 words."
    )

    user_prompt = (
        f"{context}\n\n"
        f"Generate tailored, connected interview questions across the 5 structured parts "
        f"(2 Introduction, 3 Behavioral, 2 Case Study & Fundamentals, 2 Project Dive, 2 Problem Solving) as valid JSON."
    )

    messages = [
        {"role": "system", "content": system_prompt},
        {"role": "user", "content": user_prompt},
    ]

    ai_generated_map = {}
    try:
        reply = call_ai(
            messages=messages,
            max_tokens=650,
            temperature=0.35,
            response_format={"type": "json_object"}
        )
        parsed = extract_json_from_text(reply)
        ai_list = parsed.get("questions", []) if isinstance(parsed, dict) else (parsed if isinstance(parsed, list) else [])
        for idx, item in enumerate(ai_list):
            if isinstance(item, dict):
                q_num = item.get("question_number", idx + 1)
                ai_generated_map[q_num] = item
            elif isinstance(item, str) and item.strip():
                ai_generated_map[idx + 1] = {
                    "question_text": item.strip(),
                    "spoken_prompt": item.strip(),
                    "expected_concepts": [role, difficulty]
                }
    except Exception as e:
        print(f"[Question Generator AI Note - using grounded multi-part templates]: {e}")

    # Build the full multi-part sequence (11 structured, connected questions)
    roadmap_questions: List[Dict[str, Any]] = []
    global_q_num = 1

    for part in INTERVIEW_PARTS:
        sub_list = part["sub_questions"]
        part_total = len(sub_list)

        for sub in sub_list:
            sub_idx = sub["sub_index"]
            scraped_hint = scraped_questions[global_q_num % len(scraped_questions)] if scraped_questions else f"core {role} architecture"
            default_q_text = sub["make_template"](company, role, difficulty, interview_type, resume, scraped_hint, highlights, prof)

            # Check if AI synthesized a custom question for this slot
            ai_q = ai_generated_map.get(global_q_num, {})
            q_text = ai_q.get("question_text") or default_q_text
            spoken = ai_q.get("spoken_prompt") or q_text
            concepts = ai_q.get("expected_concepts") or [role, difficulty, part["title"], highlights["primary_lang"]]

            # ALWAYS ensure Question 1 has the personalized welcome greeting with candidate name if available
            if global_q_num == 1:
                first_name = highlights.get("first_name", "")
                welcome_prefix = f"Welcome to {company}, {first_name}!" if first_name else f"Welcome to {company}!"

                if not q_text.lower().startswith(welcome_prefix.lower()):
                    if re.match(rf"^welcome to {re.escape(company)}[!.,]?", q_text, re.IGNORECASE):
                        q_text = re.sub(rf"^welcome to {re.escape(company)}[!.,]?", welcome_prefix, q_text, flags=re.IGNORECASE)
                    elif re.match(r"^welcome[!.,]?", q_text, re.IGNORECASE):
                        q_text = re.sub(r"^welcome[!.,]?", welcome_prefix, q_text, flags=re.IGNORECASE)
                    else:
                        q_text = f"{welcome_prefix} {q_text}"
                spoken = q_text

            roadmap_questions.append({
                "question_number": global_q_num,
                "category": part["category"],
                "part_id": part["part_id"],
                "part_title": part["title"],
                "part_index": sub_idx,
                "part_total": part_total,
                "part_progress": f"{sub_idx}/{part_total}",
                "question_text": q_text,
                "spoken_prompt": spoken,
                "expected_concepts": concepts[:4],
            })
            global_q_num += 1

    return roadmap_questions

def generate_dynamic_followup_question(
    question_number: int,
    company: str,
    role: str,
    difficulty: str,
    interview_type: str,
    previous_questions: List[Dict[str, Any]],
    previous_answers: List[str],
    resume: Optional[ResumeData] = None,
    job_description: Optional[str] = "",
) -> Dict[str, Any]:
    """
    Synthesizes contextual dynamic follow-up questions for Question 12+ (unlimited practice mode)
    probing the candidate's specific prior responses and resume like a real hiring manager.
    Deeply tests target role core pillars, internals, and production edge cases.
    """
    highlights = extract_candidate_highlights(resume)
    prof = get_role_profile(role)

    # Summarize previous 2 questions and answers to keep tokens low
    recent_qs = previous_questions[-2:] if len(previous_questions) >= 2 else previous_questions
    recent_ans = previous_answers[-2:] if len(previous_answers) >= 2 else previous_answers

    prev_q_str = "\n".join([f"- Q: {q.get('question_text', '')}" for q in recent_qs]) if recent_qs else "Earlier interview questions"
    prev_ans_str = "\n".join([f"- A: {a[:120]}" for a in recent_ans]) if recent_ans else "Earlier candidate answers"
    last_answer = previous_answers[-1] if previous_answers else ""

    system_prompt = (
        f"You are the senior technical interviewer at {company} conducting a live interview for a {role} position. "
        f"Based directly on the candidate's previous response and their stated resume experience, formulate an in-depth follow-up question. "
        f"CRITICAL RULES:\n"
        f"1. CONNECTIVITY: Explicitly acknowledge what the candidate just answered (e.g., 'Earlier you mentioned...').\n"
        f"2. ROLE DEPTH: Probe deeply into {role} mechanics: {prof['internals_focus']}.\n"
        f"3. ZERO SCRIPTED FILLER: Test production edge cases, crisis mitigation, or scale limits ({prof['scale_focus']}).\n"
        f"Return ONLY a valid JSON object with:\n"
        f"- 'question_number': int ({question_number})\n"
        f"- 'category': string (e.g., 'Advanced Role Probing', 'System Scalability', 'Production Debugging')\n"
        f"- 'question_text': string (crisp question under 25 words)\n"
        f"- 'spoken_prompt': string (concise audio prompt for Text-to-Speech)\n"
        f"- 'expected_concepts': list of 2-3 strings."
    )

    user_prompt = (
        f"TARGET COMPANY: {company}\n"
        f"ROLE: {role} ({difficulty})\n"
        f"ROLE PILLARS: {prof['core_pillars']}\n"
        f"CANDIDATE BACKGROUND: {highlights['skills']} | {highlights['proj_1_title']} ({highlights['proj_1_tech']})\n"
        f"RECENT QUESTIONS:\n{prev_q_str}\n"
        f"RECENT CANDIDATE ANSWERS:\n{prev_ans_str}\n"
        f"LATEST ANSWER: {last_answer[:150]}\n\n"
        f"Generate connected Question {question_number} probing {role} depth as valid JSON."
    )

    messages = [
        {"role": "system", "content": system_prompt},
        {"role": "user", "content": user_prompt},
    ]

    try:
        reply = call_ai(
            messages=messages,
            max_tokens=220,
            temperature=0.4,
            response_format={"type": "json_object"}
        )
        parsed = extract_json_from_text(reply)
        if "question_text" in parsed:
            parsed["question_number"] = question_number
            parsed["part_id"] = 5
            parsed["part_title"] = "Dynamic Follow-up"
            parsed["part_index"] = question_number - 11
            parsed["part_total"] = question_number - 11
            parsed["part_progress"] = f"Q{question_number}"
            if not parsed.get("spoken_prompt"):
                parsed["spoken_prompt"] = parsed["question_text"]
            if not parsed.get("expected_concepts"):
                parsed["expected_concepts"] = [role, difficulty, "best practices"]
            if not parsed.get("category"):
                parsed["category"] = "Advanced Engineering Follow-up"
            return parsed
    except Exception as e:
        print(f"[Dynamic Followup AI error]: {e}")

    # Fallback dynamic follow-up connected to candidate profile and role internals
    return {
        "question_number": question_number,
        "part_id": 5,
        "part_title": "Dynamic Follow-up",
        "part_index": question_number - 11,
        "part_total": question_number - 11,
        "part_progress": f"Q{question_number}",
        "category": "Advanced Engineering Follow-up",
        "question_text": f"Connecting to your work with {highlights['proj_1_tech']}: as a {role} at {company}, how would you resolve {prof['crisis_focus']} under production constraints?",
        "spoken_prompt": f"Connecting to your work with {highlights['proj_1_tech']}: how would you resolve {prof['crisis_focus']}?",
        "expected_concepts": ["root-cause analysis", "monitoring telemetry", "mitigation strategy", "failover architecture"],
    }
