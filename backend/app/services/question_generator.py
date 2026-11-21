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
    if any(kw in cand_name.lower() for kw in ["candidate", "unknown", "n/a", "none", "null", "online", "developer", "engineer", "portal", "system", "viva", "exam", "field"]):
        cand_name = ""

    cand_first_name = cand_name.split()[0].capitalize() if cand_name else ""
    if any(kw in cand_first_name.lower() for kw in ["online", "candidate", "unknown", "developer", "engineer", "portal", "system", "viva", "exam", "field"]):
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
    "microsoft fabric data engineer": {
        "core_pillars": "Microsoft Fabric OneLake, Medallion Architecture (Bronze/Silver/Gold), Direct Lake mode, PySpark V-Order compaction, and Lakehouse vs Warehouse design",
        "internals_focus": "Delta Parquet transaction logs, OneLake indexing, and memory allocation between Analysis Services and Spark pools",
        "crisis_focus": "a silent data corruption incident or pipeline timeout where a Gold layer report displayed erroneous metrics under an executive deadline",
        "scale_focus": "a 20x surge in streaming transaction ingestion into OneLake with multiple concurrent Power BI Direct Lake consumers",
        "philosophy_focus": "governing a single source of truth across diverse analytical engines (Spark vs T-SQL vs KQL) without data duplication",
        "coding_challenge_1": "a PySpark script to ingest streaming JSON events into OneLake Bronze Delta tables and optimize with V-Order compaction",
        "coding_challenge_2": "implements Medallion Silver-to-Gold aggregation calculating rolling revenue per customer partition in PySpark",
        "coding_challenge_3": "handling CDC updates, deletes, and schema evolution in a Delta Lake MERGE INTO script without duplicate keys",
        "coding_challenge_4": "a PySpark pipeline salting skewed customer IDs before a high-volume broadcast hash join",
        "coding_challenge_5": "a data quality validation decorator in Python checking null thresholds and schema drift before committing to Lakehouse",
    },
    "fabric engineer": {
        "core_pillars": "Microsoft Fabric OneLake, Medallion Architecture (Bronze/Silver/Gold), Direct Lake mode, PySpark V-Order compaction, and Lakehouse vs Warehouse design",
        "internals_focus": "Delta Parquet transaction logs, OneLake indexing, and memory allocation between Analysis Services and Spark pools",
        "crisis_focus": "a silent data corruption incident or pipeline timeout where a Gold layer report displayed erroneous metrics under an executive deadline",
        "scale_focus": "a 20x surge in streaming transaction ingestion into OneLake with multiple concurrent Power BI Direct Lake consumers",
        "philosophy_focus": "governing a single source of truth across diverse analytical engines (Spark vs T-SQL vs KQL) without data duplication",
        "coding_challenge_1": "a PySpark script to ingest streaming JSON events into OneLake Bronze Delta tables and optimize with V-Order compaction",
        "coding_challenge_2": "implements Medallion Silver-to-Gold aggregation calculating rolling revenue per customer partition in PySpark",
        "coding_challenge_3": "handling CDC updates, deletes, and schema evolution in a Delta Lake MERGE INTO script without duplicate keys",
        "coding_challenge_4": "a PySpark pipeline salting skewed customer IDs before a high-volume broadcast hash join",
        "coding_challenge_5": "a data quality validation decorator in Python checking null thresholds and schema drift before committing to Lakehouse",
    },
    "data engineer": {
        "core_pillars": "distributed PySpark pipelines, partition skew optimization, Delta/Iceberg/Hudi ACID guarantees, Kafka CDC ingestion, and dimensional modeling",
        "internals_focus": "Spark DAG stage execution, shuffle hash joins vs broadcast joins, executor memory spill, and checkpoint state management",
        "crisis_focus": "an out-of-memory executor crash or late-arriving CDC event duplicate that polluted downstream data marts",
        "scale_focus": "a 20x surge in hourly ingested parquet data causing extreme partition skew on uneven customer ID distribution",
        "philosophy_focus": "balancing strict ACID write guarantees against low-latency analytical query response times in modern lakehouses",
        "coding_challenge_1": "a PySpark transformation function to compute a 7-day rolling average metric per user partition over an out-of-order event stream",
        "coding_challenge_2": "handles late-arriving CDC records by deduplicating transactions in a Delta Lake MERGE statement in PySpark/SQL",
        "coding_challenge_3": "streaming and parsing a 50GB uncompressed log file in 10MB memory-bounded chunks using a Python generator",
        "coding_challenge_4": "a distributed Spark join script implementing salting to eliminate severe partition skew across 100 executor nodes",
        "coding_challenge_5": "an idempotent ingestion worker in Python that validates incoming data against Pydantic models and writes atomic partitions",
    },
    "software engineer": {
        "core_pillars": "distributed system architecture, database indexing & transaction isolation, REST/gRPC API idempotency, and concurrent thread-safety",
        "internals_focus": "concurrency race conditions, memory leaks, connection pool exhaustion, and distributed locking via Redis or ZooKeeper",
        "crisis_focus": "a cascading microservice failure under peak load that saturated database connection pools and degraded latency",
        "scale_focus": "a 20x increase in concurrent client API requests saturating read replicas and distributed cache memory",
        "philosophy_focus": "balancing clean modular architecture and unit test coverage against rapid delivery of production features",
        "coding_challenge_1": "an in-memory LRU Cache with O(1) get and put time complexity using a doubly linked list and hash map",
        "coding_challenge_2": "merges overlapping intervals representing scheduled tasks and returns minimal non-overlapping blocks",
        "coding_challenge_3": "finding the longest substring without repeating characters using a sliding window and hash map with O(N) runtime",
        "coding_challenge_4": "a thread-safe rate limiter (token bucket or sliding window log) supporting concurrent requests without race conditions",
        "coding_challenge_5": "an idempotent API controller method with database transaction commit, rollback on failure, and exponential backoff retry",
    },
    "frontend developer": {
        "core_pillars": "virtual DOM reconciliation, Core Web Vitals (LCP, INP, CLS), global state management, code-splitting, and client-side caching",
        "internals_focus": "rendering loops, unnecessary component re-renders, JS heap memory leaks, and browser main-thread blocking",
        "crisis_focus": "a critical frontend memory leak that crashed user browser tabs during heavy data table interactions",
        "scale_focus": "rendering complex realtime dashboards with thousands of dynamic streaming DOM updates without frame drops",
        "philosophy_focus": "balancing rich client-side interactivity and complex state against minimal bundle size and fast initial paint",
        "coding_challenge_1": "a custom debounce and throttle utility in TypeScript supporting immediate execution, cancellation, and maxWait options",
        "coding_challenge_2": "calculates visible item start/end indices and translateY offset for a virtual list in a custom hook",
        "coding_challenge_3": "deep-cloning nested objects, arrays, and Dates while detecting circular references",
        "coding_challenge_4": "an asynchronous task queue in TypeScript that runs up to K parallel fetch requests with automatic retry on 5xx errors",
        "coding_challenge_5": "an infinite scroll feed hook with IntersectionObserver, page cursor tracking, loading states, and unmount cleanup",
    },
    "backend developer": {
        "core_pillars": "high-throughput API design, asynchronous message queues, database query execution plans, and resilient failover architecture",
        "internals_focus": "B-Tree vs LSM-Tree database storage, thread pool saturation, deadlock detection, and backpressure mechanisms",
        "crisis_focus": "a database deadlock or unindexed slow query that blocked database worker connections during a critical peak period",
        "scale_focus": "a 20x surge in write-heavy requests causing database replica lag and message queue consumer backlog",
        "philosophy_focus": "designing self-healing distributed backends with circuit breakers, graceful degradation, and strict idempotency",
        "coding_challenge_1": "an in-memory key-value cache with TTL expiration and background sweeping in your primary backend language",
        "coding_challenge_2": "implements a distributed token-bucket rate limiter with atomic Redis or memory increments",
        "coding_challenge_3": "executing multi-record updates within an atomic transaction with optimistic lock retries",
        "coding_challenge_4": "an asynchronous message queue consumer handling dead-letter queue routing, poison pill detection, and graceful shutdown",
        "coding_challenge_5": "a connection pool manager tracking active vs idle connections with lease timeouts and health check pings",
    },
    "full stack developer": {
        "core_pillars": "end-to-end full stack architecture, API contracts, database schema migrations, and client-server state synchronization",
        "internals_focus": "optimistic UI updates vs server consistency, JWT/session authentication flows, and relational database indexing",
        "crisis_focus": "a breaking API contract change or schema migration that caused frontend runtime exceptions across production clients",
        "scale_focus": "handling simultaneous traffic spikes on both client static assets and stateful backend database queries",
        "philosophy_focus": "maintaining a cohesive type-safe domain model and robust automated testing across both client and server tiers",
        "coding_challenge_1": "a full stack REST API endpoint with JWT auth verification, Pydantic/Zod request validation, and database transaction commit",
        "coding_challenge_2": "implements optimistic UI list mutations with immediate local rendering and rollback on API error",
        "coding_challenge_3": "queueing concurrent outgoing requests while asynchronously refreshing an expired JWT in an HTTP interceptor",
        "coding_challenge_4": "a recursive tree transformer in your backend that maps flat relational comment rows into a nested response structure",
        "coding_challenge_5": "a WebSocket client-server connection manager handling reconnection backoff, heartbeat pings, and message deduplication",
    },
    "devops engineer": {
        "core_pillars": "Kubernetes orchestration, Infrastructure as Code with Terraform, CI/CD automated deployments, and zero-downtime rollouts",
        "internals_focus": "Pod disruption budgets, container OOMKilled events, VPC peering latency, and immutable infrastructure state drift",
        "crisis_focus": "a botched production deployment that passed staging but triggered a crash-loop backoff across all Kubernetes nodes",
        "scale_focus": "autoscaling Kubernetes clusters and ingress controllers under sudden 20x traffic spikes without cold-start latency",
        "philosophy_focus": "establishing GitOps workflows, automated rollback triggers, and comprehensive distributed telemetry",
        "coding_challenge_1": "a Python automation script using the Kubernetes API to autoscale deployment replicas based on custom message queue depth",
        "coding_challenge_2": "provisions multi-region DNS failover with health-check endpoints in Terraform or Python",
        "coding_challenge_3": "querying canary metrics and triggering automatic rollback on errors in a blue-green deployment script",
        "coding_challenge_4": "a custom Prometheus exporter in Python that scrapes service health endpoints and exposes latency percentiles",
        "coding_challenge_5": "a CI/CD pipeline script that parses container scan vulnerability reports and enforces strict vulnerability gate blocking",
    },
    "cloud solutions architect": {
        "core_pillars": "multi-region cloud resilience, disaster recovery (RPO/RTO), cloud cost optimization, and secure network segmentation",
        "internals_focus": "cross-region data replication latency, service mesh routing, identity federation, and private endpoint routing",
        "crisis_focus": "a major cloud provider zone outage that threatened data availability and required automated cross-region failover",
        "scale_focus": "architecting an enterprise system to scale elastically from 10k to 500k concurrent users while controlling cloud spend",
        "philosophy_focus": "navigating the tradeoffs between managed cloud-native serverless services and portable containerized architectures",
        "coding_challenge_1": "an infrastructure script in Python/Terraform defining an event-driven serverless pipeline with dead-letter queue routing",
        "coding_challenge_2": "provisions multi-region disaster recovery endpoints in Python and verifies database replica readiness",
        "coding_challenge_3": "updating DNS records and verifying database replica readiness in a cross-region disaster recovery failover function",
        "coding_challenge_4": "a secure token exchange and IAM policy validator in Python ensuring least-privilege role boundaries across microservices",
        "coding_challenge_5": "an automated snapshot lifecycle manager in Python enforcing retention schedules and geo-redundant archive tiering",
    },
    "ai engineer": {
        "core_pillars": "LLM fine-tuning, retrieval-augmented generation (RAG), vector database indexing, model quantization, and latency budgets",
        "internals_focus": "embedding drift, token context window limits, vector similarity search algorithms (HNSW vs IVF), and GPU inference throughput",
        "crisis_focus": "a high-rate hallucination spike or LLM provider rate-limit incident that degraded customer search accuracy in production",
        "scale_focus": "scaling RAG document retrieval across 10 million documents while maintaining sub-200ms vector search latency",
        "philosophy_focus": "evaluating model accuracy, factual grounding, and cost-per-inference when deploying generative AI to production",
        "coding_challenge_1": "a vectorized NumPy function to compute cosine similarity between a query embedding vector and a matrix of 100,000 embeddings",
        "coding_challenge_2": "chunks long text documents using a sliding window with configurable token overlap for RAG ingestion",
        "coding_challenge_3": "a custom PyTorch training loop supporting gradient accumulation, mixed precision, and gradient clipping",
        "coding_challenge_4": "a streaming FastAPI endpoint using Python async generators to stream LLM tokens via Server-Sent Events (SSE)",
        "coding_challenge_5": "an in-memory semantic vector cache in Python using an LRU eviction policy with cosine threshold deduplication",
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

# Structured interview roadmap: Question 1 is ALWAYS the welcome introduction icebreaker;
# Question 2 onwards are hands-on CODING QUESTIONS ONLY tailored directly to the candidate's chosen role and tech stack.
INTERVIEW_PARTS = [
    {
        "part_id": 1,
        "title": "Welcome & Coding Kickoff",
        "category": "Introduction & Coding Kickoff",
        "sub_questions": [
            {
                "sub_index": 1,
                "focus": "Warm authentic welcome message and candidate background overview.",
                "make_template": lambda c, r, d, it, res, sh, h, p: (
                    f"Welcome to {c}, {h['first_name']}! I'm excited to connect with you today for this {r} interview. "
                    f"To kick off our discussion, could you please introduce yourself, walk me through your technical background, "
                    f"and highlight what projects or technologies you've been working on recently?"
                    if h.get("first_name")
                    else
                    f"Welcome to {c}! I'm excited to connect with you today for this {r} interview. "
                    f"To kick off our discussion, could you please introduce yourself, walk me through your technical background, "
                    f"and highlight what projects or technologies you've been working on recently?"
                ),
            },
            {
                "sub_index": 2,
                "focus": "Hands-on live coding challenge: core data structure or algorithm implementation in candidate's primary language.",
                "make_template": lambda c, r, d, it, res, sh, h, p: (
                    f"Let's jump straight into hands-on coding. In {h['primary_lang']}, write a function to implement {p.get('coding_challenge_1', 'an in-memory LRU Cache with O(1) get and put operations')}. "
                    f"Walk me through your code step-by-step, explaining your choice of data structures, pointer updates, and edge case handling."
                ),
            },
        ],
    },
    {
        "part_id": 2,
        "title": "Data Structures & Algorithm Coding",
        "category": "Algorithmic Coding Challenge",
        "sub_questions": [
            {
                "sub_index": 1,
                "focus": "Algorithmic coding problem: array, interval, or graph problem.",
                "make_template": lambda c, r, d, it, res, sh, h, p: (
                    f"Here is your next coding challenge: in {h['primary_lang']}, write a function that {p.get('coding_challenge_2', 'takes an array of intervals and merges all overlapping intervals')}. "
                    f"Walk me through your code implementation, time and space complexity, and how your code handles null or empty inputs."
                ),
            },
            {
                "sub_index": 2,
                "focus": "Sliding window, string parsing, or hash map optimization coding problem.",
                "make_template": lambda c, r, d, it, res, sh, h, p: (
                    f"Continuing with coding: write an optimal algorithm in {h['primary_lang']} for {p.get('coding_challenge_3', 'finding the longest substring without repeating characters using a sliding window and hash map')}. "
                    f"Walk through your pointer movements and explain how your code achieves linear O(N) runtime."
                ),
            },
            {
                "sub_index": 3,
                "focus": "Recursion, tree traversal, or dynamic programming coding challenge.",
                "make_template": lambda c, r, d, it, res, sh, h, p: (
                    f"For our third coding problem: write a function in {h['primary_lang']} to find all valid combinations that sum to a target value. "
                    f"Show your recursive backtracking logic, pruning conditions, and discuss the recursion stack memory footprint."
                ),
            },
        ],
    },
    {
        "part_id": 3,
        "title": "Role-Specific Implementation Coding",
        "category": "Hands-on Implementation Challenge",
        "sub_questions": [
            {
                "sub_index": 1,
                "focus": "Writing practical component or pipeline code specifically tailored to the target role.",
                "make_template": lambda c, r, d, it, res, sh, h, p: (
                    f"Now let's write code specifically for a {r} at {c}: write a complete code implementation for {p.get('coding_challenge_4', 'an idempotent API handler with transactional database commit and rollback')}. "
                    f"How do you structure error boundaries and exceptions in your code?"
                ),
            },
            {
                "sub_index": 2,
                "focus": "Deep internals, memory management, and data transformation coding.",
                "make_template": lambda c, r, d, it, res, sh, h, p: (
                    f"Diving deeper into {r} code: write the code logic for {p.get('coding_challenge_5', 'a custom connection pool or worker queue with bounded capacity and timeout cleanup')}. "
                    f"Walk me through how your code prevents deadlocks and memory leaks."
                ),
            },
        ],
    },
    {
        "part_id": 4,
        "title": "Concurrency & Optimization Coding",
        "category": "Performance & Concurrency Code",
        "sub_questions": [
            {
                "sub_index": 1,
                "focus": "Writing thread-safe or asynchronous concurrency code.",
                "make_template": lambda c, r, d, it, res, sh, h, p: (
                    f"Concurrency coding challenge: write a thread-safe rate limiter (token bucket or sliding window) in {h['primary_lang']}. "
                    f"Show the exact synchronization primitives, mutex locks, or atomic variables you use in your code."
                ),
            },
            {
                "sub_index": 2,
                "focus": "Refactoring code from O(N^2) to O(N) and optimizing memory allocations.",
                "make_template": lambda c, r, d, it, res, sh, h, p: (
                    f"Code optimization challenge: suppose an existing function in {r} has O(N^2) time complexity due to repeated nested lookups. "
                    f"Write the refactored code to achieve linear O(N) runtime and explain your trade-offs."
                ),
            },
        ],
    },
    {
        "part_id": 5,
        "title": "Production Code Architecture & Scenarios",
        "category": "Advanced Coding Scenarios",
        "sub_questions": [
            {
                "sub_index": 1,
                "focus": "Writing resilient code with exponential backoff, jitter, and retry logic.",
                "make_template": lambda c, r, d, it, res, sh, h, p: (
                    f"Production resilience challenge: write a wrapper function or decorator in {h['primary_lang']} that wraps network calls with exponential backoff, jitter, and max retry limits. "
                    f"Show how your code distinguishes between transient and non-retryable exceptions."
                ),
            },
            {
                "sub_index": 2,
                "focus": "Writing unit tests, edge cases, and code reflection.",
                "make_template": lambda c, r, d, it, res, sh, h, p: (
                    f"To bring our technical session together: write 3 critical unit test cases in your testing framework of choice for the code you just implemented, "
                    f"specifically covering race conditions and null/boundary inputs. What coding principles do you strictly enforce across all your code at {c}?"
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

    jd_clean = (job_description or "").strip()
    jd_block = f"""
TARGET JOB DESCRIPTION & SPECIFIC ROLE REQUIREMENTS:
{jd_clean[:1800]}
""" if jd_clean else ""

    return f"""
INTERVIEW PARAMETERS:
- Target Company: {company}
- Target Job Role: {role}
- Interview Type: {interview_type}
- Difficulty Level: {difficulty}
{jd_block}
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

    # If job description is provided, dynamically enrich core pillars with key terms from JD
    jd_clean = (job_description or "").strip()
    if jd_clean:
        # Extract potential technical keywords / responsibilities
        key_lines = [line.strip("-•* \t") for line in jd_clean.splitlines() if len(line.strip()) > 8]
        if key_lines:
            prof = dict(prof)
            prof["core_pillars"] = f"{key_lines[0][:100]} | {prof['core_pillars']}"

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
        f"You are an expert technical interviewer at {company} conducting an authentic hands-on coding interview for the {role} position. "
        "CRITICAL RULES:\n"
        "1. STRICT SEQUENCE: Question 1 MUST be the professional welcome message icebreaker welcoming the candidate to {company}.\n"
        "2. FROM QUESTION 2 ONWARDS, ASK CODING QUESTIONS ONLY: Every subsequent question must present a concrete coding problem, algorithm, data structure task, or code implementation in the candidate's primary language ({h['primary_lang']}) or target role tech stack.\n"
        "3. PROMPT TO CODE: Explicitly frame questions around writing code (e.g., 'In Python, write a function to...', 'Implement a class that...', 'Write an optimal algorithm to...').\n"
        "4. ZERO GENERIC HR OR BEHAVIORAL QUESTIONS: Do NOT ask behavioral or generic situational questions (no 'tell me about a time you had a deadline'). Focus 100% on hands-on coding and algorithmic problem solving.\n"
        "5. If a TARGET JOB DESCRIPTION is provided, prioritize coding questions based on its exact tech stack, frameworks, and requirements.\n"
        "Return ONLY a valid JSON object with a 'questions' array. Keep each question crisp, clear, and under 30 words."
    )

    user_prompt = (
        f"{context}\n\n"
        f"Generate Question 1 as the authentic welcome introduction for {role} at {company}. "
        f"Generate Questions 2 through 11 as hands-on CODING QUESTIONS ONLY specifically tailored to {role} "
        f"(algorithms, data structures, implementation, concurrency, and production code logic in {highlights['primary_lang']}). "
        f"Return as valid JSON."
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

            # STRICT RULE 1: Question 1 is ALWAYS the authentic professional introduction icebreaker
            if global_q_num == 1:
                first_name = highlights.get("first_name", "")
                welcome_prefix = f"Welcome to {company}, {first_name}!" if first_name else f"Welcome to {company}!"
                q_text = (
                    f"{welcome_prefix} I'm excited to connect with you today for this {role} interview. "
                    f"To kick off our discussion, could you please introduce yourself, walk me through your technical background, "
                    f"and highlight what projects or technologies you've been working on recently?"
                )
                spoken = q_text
                concepts = [role, "Professional Introduction", "Technical Background", "Engineering Projects"]

            # STRICT RULE 2: For Question 2 onwards, NEVER repeat candidate name ("sagnik sagnik sagnik")
            elif highlights.get("first_name"):
                fn = highlights.get("first_name")
                q_text = re.sub(rf"^(?:hi|hello|hey|welcome|thanks|thank you)?\s*,?\s*{re.escape(fn)}\s*[,!:\-]\s*", "", q_text, flags=re.IGNORECASE)
                q_text = re.sub(rf"\b{re.escape(fn)}\b", "", q_text, flags=re.IGNORECASE).strip()
                q_text = re.sub(r"^[,\.\s!-]+", "", q_text)
                if q_text:
                    q_text = q_text[0].upper() + q_text[1:]
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
        f"You are the senior technical interviewer at {company} conducting a hands-on coding interview for a {role} position. "
        f"Based directly on the candidate's previous response, formulate a concrete follow-up CODING problem or optimization challenge. "
        f"CRITICAL RULES:\n"
        f"1. ASK A CODING QUESTION ONLY: Challenge the candidate to write, refactor, or optimize code in {highlights['primary_lang']} or {role} tech stack.\n"
        f"2. ZERO HR OR BEHAVIORAL QUESTIONS: Do NOT ask behavioral or generic situational questions. Probe data structures, algorithms, concurrency, and time/space complexity.\n"
        f"3. CONNECTIVITY: Connect logically from the candidate's last answer (e.g., 'To optimize that implementation...').\n"
        f"Return ONLY a valid JSON object with:\n"
        f"- 'question_number': int ({question_number})\n"
        f"- 'category': string (e.g., 'Algorithmic Coding Challenge', 'Data Structure Implementation', 'Concurrency Coding')\n"
        f"- 'question_text': string (crisp coding problem under 30 words)\n"
        f"- 'spoken_prompt': string (concise audio prompt for Text-to-Speech)\n"
        f"- 'expected_concepts': list of 2-3 strings."
    )

    user_prompt = (
        f"TARGET COMPANY: {company}\n"
        f"ROLE: {role} ({difficulty})\n"
        f"PRIMARY LANGUAGE: {highlights['primary_lang']}\n"
        f"ROLE CODING FOCUS: {prof['core_pillars']}\n"
        f"RECENT QUESTIONS:\n{prev_q_str}\n"
        f"RECENT CANDIDATE ANSWERS:\n{prev_ans_str}\n"
        f"LATEST ANSWER: {last_answer[:150]}\n\n"
        f"Generate Question {question_number} as an authentic CODING PROBLEM tailored to {role} as valid JSON."
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
