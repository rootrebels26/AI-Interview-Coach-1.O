"""
Interactive Conversational Interview Manager (Gemini-style Dialogue).
Enables multi-turn back-and-forth conversational interviews with real-time interviewer scaffolding:
- Listens to candidate responses, clarifications, and questions.
- If the candidate is stuck, unsure, or asks for help, provides real interviewer hints and tricks ("ticks and tricks").
- Probes incomplete answers deeper until satisfied.
- Once satisfied, acknowledges candidate's strong points and bridges smoothly to the next question.
"""

from typing import Dict, Any, List, Optional
import re
from app.services.ai_provider import call_ai, extract_json_from_text
from app.services.answer_evaluator import evaluate_candidate_answer, is_non_substantive_response
from app.schemas.evaluation import AnswerEvaluationResponse
from app.services.question_generator import get_role_profile

# Clues, tips, and scaffolding heuristics for specialized roles when candidates hesitate or need hints
ROLE_HINTS_DATABASE = {
    "fabric engineer": [
        "Think about OneLake's Delta Parquet format and how Direct Lake mode accesses parquet files directly without import refreshes.",
        "Consider how the Medallion architecture separates raw landing (Bronze) from cleansed data (Silver) and aggregated business marts (Gold).",
        "Consider Lakehouse versus Warehouse: Lakehouse uses Spark/Delta Lake for data science, while Warehouse uses the T-SQL engine for relational analytics.",
        "Think about V-Order compaction in Fabric: it optimizes sorting and dictionary encoding for blazing fast Power BI reads.",
    ],
    "data engineer": [
        "Think about how Apache Spark shuffles data across worker nodes: if a single key has uneven distribution, it creates partition skew and executor spill.",
        "Consider the transaction log in Delta Lake / Iceberg: how ACID transactions and optimistic concurrency control manage concurrent writes.",
        "Think about streaming ingestion: how Apache Kafka or Event Hubs buffers high-velocity spikes with consumer offsets.",
        "Consider CDC (Change Data Capture) via Debezium: reading the database WAL/binlog rather than running expensive polling queries.",
    ],
    "software engineer": [
        "Consider concurrency and thread safety: how mutexes, connection pooling, and atomic variables prevent race conditions under load.",
        "Think about idempotency in distributed APIs: using idempotency keys or unique transaction IDs to prevent duplicate side-effects.",
        "Think about database query optimization: how composite B-Tree indexes, query execution plans, and connection pool sizing resolve bottlenecks.",
        "Reflect on fault-tolerant patterns: circuit breakers, exponential backoff with jitter, and dead-letter queues.",
    ],
    "frontend developer": [
        "Think about Core Web Vitals: Largest Contentful Paint (LCP), Cumulative Layout Shift (CLS), and Interaction to Next Paint (INP).",
        "Consider how React's virtual DOM reconciliation works and how memoization (useMemo/useCallback) or virtualization prevents layout thrashing.",
        "Think about state management boundaries: keeping state as local as possible to avoid unnecessary tree re-renders.",
        "Consider network efficiency: code-splitting with dynamic imports, asset prefetching, and stale-while-revalidate client caching.",
    ],
    "backend developer": [
        "Think about database isolation levels (Read Committed vs Repeatable Read vs Serializable) and how locks affect throughput.",
        "Consider message queue semantics: at-least-once vs exactly-once delivery and handling out-of-order events.",
        "Think about asynchronous non-blocking I/O and how connection pooling prevents thread exhaustion.",
        "Consider distributed caching: cache-aside patterns, cache stampede prevention via mutexes, and TTL eviction strategies.",
    ],
    "full stack developer": [
        "Think about end-to-end data flow: from client validation, through API contract serialization, down to database transactions.",
        "Consider optimistic UI updates: updating UI state immediately while rolling back gracefully if the server mutation fails.",
        "Think about authentication & authorization: stateless JWTs vs HTTP-only session cookies and CSRF/CORS protections.",
        "Consider schema evolution: backward-compatible database migrations and API versioning without frontend downtime.",
    ],
    "devops engineer": [
        "Think about Kubernetes pod scheduling: resource requests/limits, readiness vs liveness probes, and pod disruption budgets.",
        "Consider CI/CD pipeline safety: blue/green deployments, canary rollouts with automated metric rollbacks, and ephemeral test environments.",
        "Think about Infrastructure as Code state: Terraform remote backends, state locking, and handling resource drift.",
        "Consider observability: structured JSON logging, Prometheus metrics scraping, and OpenTelemetry distributed tracing.",
    ],
    "cloud solutions architect": [
        "Think about multi-region resilience: active-passive vs active-active failover, RPO (Recovery Point Objective), and RTO (Recovery Time Objective).",
        "Consider network topology: hub-and-spoke VPC architecture, private endpoints, transit gateways, and NAT gateway egress costs.",
        "Think about data tier replication: synchronous vs asynchronous replication across cloud zones and cross-region latency.",
        "Consider cost vs performance trade-offs: serverless scaling vs reserved instances and tiered cloud storage classes.",
    ],
    "ai engineer": [
        "Think about RAG pipeline retrieval: chunking strategies, embedding dimensionality, HNSW vector indexing, and hybrid lexical/vector search.",
        "Consider LLM latency and throughput: streaming tokens, prompt caching, batching requests, and model quantization (int8/int4).",
        "Think about hallucination guardrails: factual consistency checking, structured output schemas, and chain-of-thought verification.",
        "Consider fine-tuning vs prompt engineering: LoRA/QLoRA parameter-efficient tuning vs in-context learning with dynamic examples.",
    ],
    "default": [
        "Let's break this down from first principles: what is the core bottleneck or failure point in this system?",
        "Consider how data flows from input to processing to storage: where could latency or errors be introduced?",
        "Think about trade-offs: between consistency versus availability, or memory usage versus compute speed.",
        "Reflect on a real production scenario you encountered: how did you isolate and measure the problem?",
    ]
}

def extract_candidate_name_from_intro(text: str) -> Optional[str]:
    """Extracts candidate name if they introduce their actual name (e.g. 'I am Sagneeksen', 'My name is Alex')."""
    cleaned = text.strip()
    if any(phrase in cleaned.lower() for phrase in [
        "next question", "move on", "move to", "skip", "finished", "done with", "satisfied with",
        "answering", "building", "working on", "developing", "implementing"
    ]):
        return None

    match = re.search(r"\b(?:i\s+am|i'm|my\s+name\s+is|this\s+is)\s+([a-zA-Z]+(?:\s+[a-zA-Z]+)?)\b", cleaned, re.IGNORECASE)
    if match:
        name = match.group(1).strip()
        first_word = name.split()[0].lower()
        non_name_words = {
            "a", "an", "the", "good", "ready", "fine", "here", "audible", "audiable",
            "testing", "trying", "sure", "ok", "okay", "listening", "online", "clear",
            "software", "backend", "frontend", "fullstack", "developer", "engineer",
            "architect", "designer", "intern", "student", "working", "building", "using",
            "satisfied", "done", "finished", "happy", "confident", "prepared", "interested",
            "looking", "hoping", "excited", "glad", "wondering", "asking", "saying", "telling",
            "not", "just", "now", "still", "also", "currently", "already", "able", "unable",
            "viva", "examination", "portal", "system", "project", "resume", "user", "candidate"
        }
        if first_word not in non_name_words and name.lower() not in non_name_words and len(name) >= 2:
            return name.title()
    return None

def is_meta_or_rapport_inquiry(text: str) -> bool:
    """Detects when candidate asks about how the interviewer knows them, who the interviewer is, etc."""
    cleaned = text.strip().lower()
    patterns = [
        r"\bhow\s+do\s+you\s+know\s+(me|my\s+name|who\s+i\s+am)\b",
        r"\bhow\s+did\s+you\s+know\b",
        r"\bwho\s+are\s+you\b",
        r"\bwhat\s+is\s+your\s+name\b",
        r"\bhow\s+do\s+you\s+have\s+my\s+(resume|details|info|information)\b",
        r"\bwhere\s+did\s+you\s+get\s+my\s+(resume|name|info)\b",
        r"\bdo\s+you\s+know\s+me\b",
        r"\bwho\s+am\s+i\b",
    ]
    return any(re.search(p, cleaned) for p in patterns)

def is_audio_check_only(text: str) -> bool:
    """Specifically detects pure microphone/audio checks (e.g. 'am I audible?', 'can you hear me?')."""
    cleaned = text.strip().lower()
    patterns = [
        r"\b(am\s+i|i\s+am|are\s+you)\s+(audiable|audible|clear|heard)\b",
        r"\bcan\s+you\s+hear\s+me\b",
        r"\bmic(rophone)?\s+check\b",
        r"\baudio\s+check\b",
        r"\b(test|testing)\s+(1\s*2\s*3|mic|audio)\b",
    ]
    return any(re.search(p, cleaned) for p in patterns)

def is_pure_greeting_only(text: str) -> bool:
    """Detects simple greetings with no technical content (e.g. 'hi', 'hello', 'hey there')."""
    cleaned = text.strip().lower()
    words = re.findall(r"\b[a-zA-Z0-9']+\b", cleaned)
    if not words:
        return False
    greeting_words = {"hi", "hello", "hey", "greetings", "good", "morning", "afternoon", "evening", "there"}
    return len(words) <= 4 and all(w in greeting_words for w in words)

def is_candidate_stuck_or_error(text: str) -> bool:
    """Detects when candidate expresses difficulty, inability to answer, confusion, or says 'no' / 'i dont know'."""
    cleaned = text.strip().lower()
    # Direct short negative replies
    if cleaned in {"no", "no.", "nope", "nope.", "nah", "nah.", "idk", "pass", "skip", "dont know", "don't know", "no idea", "i dont know", "i don't know", "dont", "nothing", "not sure", "cant say", "cannot say"}:
        return True
    stuck_patterns = [
        r"^no[\s\.\?!]*$",
        r"^nope[\s\.\?!]*$",
        r"^nah[\s\.\?!]*$",
        r"^idk[\s\.\?!]*$",
        r"\bdon'?t\s+work\b",
        r"\bdoesn'?t\s+work\b",
        r"\bnot\s+working\b",
        r"\b(i\s+)?(don'?t|dont|do\s+not)\s+know\b",
        r"\bi('?m| am)\s+(not\s+sure|stuck|confused|lost)\b",
        r"\bi\s+(can'?t|cannot|cant)\s+(recall|remember|solve|think|answer)\b",
        r"\bno\s+idea\b",
        r"\b(pass|skip)(\s+this)?\b",
        r"\bgive\s+me\s+a\s+hint\b",
        r"\bhelp\s+me\b"
    ]
    return any(re.search(p, cleaned) for p in stuck_patterns)

def is_acknowledgment_or_ready(text: str) -> bool:
    """Detects candidate ready signals or brief conversational acknowledgments (e.g. 'ok', 'yes', 'sure', 'ready', 'yeah')."""
    cleaned = text.strip().lower()
    words = re.findall(r"\b[a-zA-Z0-9']+\b", cleaned)
    if not words:
        return True
    acknowledgments = {"ok", "okay", "yes", "yeah", "yep", "sure", "fine", "ready", "start", "k", "cool", "got it", "understood", "right", "alright"}
    return len(words) <= 3 and all(w in acknowledgments for w in words)

def sanitize_interviewer_speech(text: str, question_text: str = "", candidate_name: str = "") -> str:
    """Permanently cleans out canned therapy clichés, patronizing repetitive phrases, and repetitive name vocatives."""
    if not text:
        return "Could you elaborate on the architecture and core trade-offs you considered?"
    
    banned_patterns = [
        r"\bno problem( at all)?\b[!,\.\s-]*",
        r"\b(and\s+)?(let'?s|let\s+us)?\s*take\s+a\s+(deep\s+)?breath\b[!,\.\s-]*",
        r"\b(and\s+)?(let'?s|let\s+us)?\s*think\s+through\s+this\s+together\b[!,\.\s-]*",
        r"\b(it'?s|that'?s)\s+(completely\s+)?(okay|fine)\b[!,\.\s-]*",
        r"\bdon'?t(\s+you)?\s+worry(\s+at\s+all)?\b[!,\.\s-]*",
        r"\bno\s+worries\b[!,\.\s-]*",
        r"\bjust\s+take\s+your\s+time\b[!,\.\s-]*",
        r"\b(let'?s\s+)?skip\s+the\s+pleasantries\b[!,\.\s-]*",
        r"\bnow,?\s*building\s+upon\s+that:?.*$",
    ]
    cleaned = text
    for pat in banned_patterns:
        cleaned = re.sub(pat, "", cleaned, flags=re.IGNORECASE)
    
    # Strip repetitive candidate name callouts (e.g. "Thanks Sagnik! Sagnik, how...", "Sagnik, could you...")
    if candidate_name:
        fn = candidate_name.strip().split()[0]
        if len(fn) >= 2 and fn.lower() not in {"candidate", "online", "developer", "engineer", "user"}:
            # Remove duplicated names like "Sagnik, Sagnik"
            cleaned = re.sub(rf"\b{re.escape(fn)}\s*,\s*{re.escape(fn)}\b", fn, cleaned, flags=re.IGNORECASE)
            # Remove leading vocatives like "Thanks Sagnik,", "Sagnik,", "Great Sagnik,"
            cleaned = re.sub(rf"^(?:thanks|thank you|great|good|right|hello|hi|hey|ok|okay)?\s*,?\s*{re.escape(fn)}\s*[,!:\-]\s*", "", cleaned, flags=re.IGNORECASE)
            # Remove dangling vocatives like ", Sagnik." or ", Sagnik,"
            cleaned = re.sub(rf"\b,\s*{re.escape(fn)}\b", "", cleaned, flags=re.IGNORECASE)

    # Strip any dangling punctuation or whitespace from the start
    cleaned = re.sub(r"^[,\.\s!-]+", "", cleaned).strip()
    cleaned = re.sub(r"^(and|so|well)\s+", "", cleaned, flags=re.IGNORECASE).strip()
    
    if len(cleaned.split()) < 4:
        return "Could you walk me through the specific architecture and trade-offs you considered?"
    
    return cleaned[0].upper() + cleaned[1:]

def detect_candidate_hesitation(text: str) -> bool:
    """Detects if the candidate is explicitly stuck, unsure, or requesting a hint."""
    return is_candidate_stuck_or_error(text)

def detect_mic_check_or_greeting(text: str) -> bool:
    """Detects pure audio checks or pure greetings (excluding self-introductions)."""
    return is_audio_check_only(text) or is_pure_greeting_only(text)

def get_fallback_hint(role: str, turn_index: int = 0) -> str:
    """Retrieves an authentic hint tailored to the candidate's target role."""
    role_lower = (role or "").lower()
    if any(k in role_lower for k in ["fabric", "microsoft fabric", "onelake"]):
        hints = ROLE_HINTS_DATABASE["fabric engineer"]
    elif any(k in role_lower for k in ["data", "etl", "warehouse", "spark", "lakehouse"]):
        hints = ROLE_HINTS_DATABASE["data engineer"]
    elif any(k in role_lower for k in ["front", "react", "ui", "web"]):
        hints = ROLE_HINTS_DATABASE["frontend developer"]
    elif any(k in role_lower for k in ["full stack", "fullstack"]):
        hints = ROLE_HINTS_DATABASE["full stack developer"]
    elif any(k in role_lower for k in ["backend"]):
        hints = ROLE_HINTS_DATABASE["backend developer"]
    elif any(k in role_lower for k in ["devops", "sre", "infra", "kubernetes"]):
        hints = ROLE_HINTS_DATABASE["devops engineer"]
    elif any(k in role_lower for k in ["cloud", "architect"]):
        hints = ROLE_HINTS_DATABASE["cloud solutions architect"]
    elif any(k in role_lower for k in ["ai", "ml", "learning", "vision", "nlp", "rag"]):
        hints = ROLE_HINTS_DATABASE["ai engineer"]
    elif any(k in role_lower for k in ["software", "developer", "engineer"]):
        hints = ROLE_HINTS_DATABASE["software engineer"]
    else:
        hints = ROLE_HINTS_DATABASE["default"]
    return hints[turn_index % len(hints)]

def process_conversational_turn(
    company: str,
    role: str,
    difficulty: str,
    question_number: int,
    question_text: str,
    expected_concepts: List[str],
    candidate_message: str,
    dialogue_history: List[Dict[str, str]],
    turn_count_for_question: int = 1,
    request_hint: bool = False,
    is_last_in_part: bool = False,
    next_question_preview: Optional[Dict[str, Any]] = None,
) -> Dict[str, Any]:
    """
    Processes a candidate's message in a live conversational interview turn.
    Returns:
    - interviewer_reply: Spoken and displayed text from AI hiring manager.
    - intent: 'hint_and_nudge' | 'probe_deeper' | 'satisfied_transition'
    - is_satisfied: True if interviewer is satisfied with candidate's understanding.
    - should_advance: True if moving to next question.
    - hint: Clue or trick provided to candidate.
    - evaluation: Score breakdown if question is concluded.
    """
    candidate_text = candidate_message.strip()

    # Combine all previous candidate answers for this question to assess total depth
    prior_answers = [
        turn["text"] for turn in (dialogue_history or [])
        if turn.get("role") in ["candidate", "user"] and turn.get("text")
    ]
    cumulative_answer = " ".join(prior_answers + ([candidate_text] if candidate_text else "")).strip()

    # Case 0a: Candidate introduces their name (e.g. "Hi. Hi. I am Sagneeksen.")
    candidate_name = extract_candidate_name_from_intro(candidate_text)
    if candidate_name:
        return {
            "interviewer_reply": f"Great to meet you, {candidate_name}! Welcome to {company}. To kick things off, could you share a bit about your technical background and what programming languages or tech stacks you've been working with recently?",
            "intent": "probe_deeper",
            "is_satisfied": False,
            "should_advance": False,
            "hint": None,
            "cumulative_answer": candidate_text,
            "evaluation": None
        }

    # Case 0b: Candidate asks meta-question or rapport question (e.g. "How do you know me?", "Who are you?")
    if is_meta_or_rapport_inquiry(candidate_text):
        return {
            "interviewer_reply": f"I have the resume and application you submitted for this {role} role at {company} right in front of me! It's great to connect with you in person today. To kick off our discussion, could you share a brief overview of your technical background and what projects you've been working on recently?",
            "intent": "probe_deeper",
            "is_satisfied": False,
            "should_advance": False,
            "hint": None,
            "cumulative_answer": "",
            "evaluation": None
        }

    # Case 0c: Pure audio/mic check (e.g. "am I audible?", "can you hear me?")
    if is_audio_check_only(candidate_text):
        return {
            "interviewer_reply": f"I can hear you loud and clear! Whenever you're ready, let's dive into our discussion. What kind of engineering projects or technologies have you been working on recently?",
            "intent": "probe_deeper",
            "is_satisfied": False,
            "should_advance": False,
            "hint": None,
            "cumulative_answer": "",
            "evaluation": None
        }

    # Case 0d: Pure casual greeting (e.g. "hi", "hello", "hey")
    if is_pure_greeting_only(candidate_text):
        return {
            "interviewer_reply": f"Hello! Great to connect with you today for this {role} interview at {company}. Could you introduce yourself and tell me what you've been building recently?",
            "intent": "probe_deeper",
            "is_satisfied": False,
            "should_advance": False,
            "hint": None,
            "cumulative_answer": candidate_text,
            "evaluation": None
        }

    # Case 0e: Candidate is stuck, confused, or says "no" / "dont work" / "I don't know"
    if is_candidate_stuck_or_error(candidate_text):
        has_prior_hesitation = any(is_candidate_stuck_or_error(t.get("text", "")) for t in (dialogue_history or []))
        if turn_count_for_question >= 2 or has_prior_hesitation or any(w in candidate_text.lower() for w in ["skip", "next question", "move on", "pass", "next"]):
            # Candidate explicitly asks to move on or is stuck after a prompt
            evaluation = evaluate_candidate_answer(
                question_number=question_number,
                question_text=question_text,
                candidate_answer=cumulative_answer or candidate_text or "[Candidate passed to next question]",
                expected_concepts=expected_concepts,
                company=company,
                role=role,
                difficulty=difficulty
            )
            return {
                "interviewer_reply": "No problem at all, let's keep moving forward! We'll transition to our next topic.",
                "intent": "satisfied_transition",
                "is_satisfied": False,
                "should_advance": True,
                "hint": None,
                "cumulative_answer": cumulative_answer or candidate_text,
                "evaluation": evaluation.model_dump() if evaluation else None
            }

        # First time getting stuck: provide supportive technical clue
        hint_text = get_fallback_hint(role, turn_count_for_question)
        return {
            "interviewer_reply": f"No worries at all, that's completely fair! Let's think through a simpler angle: {hint_text} How would you approach that?",
            "intent": "hint_and_nudge",
            "is_satisfied": False,
            "should_advance": False,
            "hint": hint_text,
            "cumulative_answer": candidate_text,
            "evaluation": None
        }

    # Case 0f: Candidate gives brief acknowledgment / readiness ("ok", "yes", "sure", "ready", "start")
    if is_acknowledgment_or_ready(candidate_text):
        return {
            "interviewer_reply": "Great! Walk me through your design or architecture for this: what technologies would you choose, and what's your high-level approach?",
            "intent": "probe_deeper",
            "is_satisfied": False,
            "should_advance": False,
            "hint": None,
            "cumulative_answer": "",
            "evaluation": None
        }

    is_hesitant = request_hint or detect_candidate_hesitation(candidate_text)
    prof = get_role_profile(role)

    # Detect candidate name if present in opening question to enforce zero name-repetition in follow-ups
    detected_candidate_name = ""
    welcome_match = re.search(r"Welcome to [^,!?]+,\s*([A-Za-z]+)[!.]?", question_text)
    if welcome_match:
        cand_candidate = welcome_match.group(1).strip()
        if cand_candidate.lower() not in {"candidate", "online", "developer", "engineer", "user"}:
            detected_candidate_name = cand_candidate

    system_prompt = (
        f"You are a real human Senior Principal Engineer at {company}. You are sitting across the table from a {role} candidate in a live technical interview.\n\n"
        f"HOW YOU SPEAK:\n"
        f"- You sound like a real person, not an AI. Use natural fillers sparingly: 'Interesting...', 'Right, so...', 'That's a solid choice.', 'I see—'\n"
        f"- You react to what the candidate ACTUALLY said. If they mentioned Flask, talk about Flask. If they mentioned PostgreSQL indexes, ask about those indexes.\n"
        f"- You NEVER repeat or restate the original question. You NEVER say 'skip the pleasantries', 'take a deep breath', 'think through this together', or 'No problem!'.\n"
        f"- STRICT NAME ETIQUETTE (ZERO NAME REPETITION): Do NOT address the candidate by name in intermediate turns or follow-up questions. In real interviews, engineers do NOT repeat 'Sagnik', 'Sagnik' every turn. Speak directly ('That makes sense. When scaling that...', 'Interesting approach. How do you handle concurrency?'). NEVER prefix with 'Thanks [Name]' or '[Name], could you...'.\n"
        f"- Keep your reply to 1-2 SHORT spoken sentences + ONE focused follow-up question. Total under 40 words.\n\n"
        f"HOW YOU INTERVIEW:\n"
        f"- You explore the candidate's answer layer by layer, like peeling an onion. First acknowledge what they said, then drill into ONE specific technical detail.\n"
        f"- You care about production realities: how things break, how they scale, what happens under load, what trade-offs they made and why.\n"
        f"- You do NOT rush. should_advance must be false unless the candidate has given thorough, multi-turn technical depth (at least 3 substantive exchanges) or explicitly asked to move on.\n"
        f"- When the candidate gives a good answer, briefly praise the specific technical insight before probing the next layer.\n"
        f"- When the candidate gives a vague answer, gently redirect with a concrete scenario: 'Say you have 10,000 concurrent users hitting that endpoint—what breaks first?'\n\n"
        f"ROLE CONTEXT: {role} at {company} ({difficulty} level). Focus areas: {prof['internals_focus']}."
    )

    history_summary = "\n".join([
        f"{t.get('role', 'speaker').upper()}: {t.get('text', '')}"
        for t in dialogue_history[-4:]
    ])

    user_prompt = f"""INTERVIEW CONTEXT:
{company} | {role} ({difficulty}) | Question #{question_number}

THE QUESTION BEING DISCUSSED:
"{question_text}"

TURN #{turn_count_for_question} — CANDIDATE JUST SAID:
"{candidate_text}"

FULL CONVERSATION SO FAR:
{history_summary}

INSTRUCTIONS:
- React naturally to what the candidate said. Acknowledge their specific technical choices.
- Ask ONE sharp follow-up that digs deeper into their answer (production edge cases, failure modes, scaling).
- Do NOT restate the original question. Do NOT mention or preview the next question.
- STRICT NAME RULE: Do NOT say the candidate's name. Speak directly without repetitive name callouts.
- Keep should_advance=false unless the candidate has thoroughly explored this topic across multiple turns.
{f'- The candidate seems hesitant. Give a concrete scenario or example to help them think.' if is_hesitant else ''}

Return ONLY valid JSON:
{{
  "interviewer_reply": "Your natural 1-2 sentence reaction + 1 focused follow-up question (under 40 words total)",
  "intent": "hint_and_nudge" | "probe_deeper" | "satisfied_transition",
  "is_satisfied": false,
  "should_advance": false,
  "hint": null,
  "specific_concept_praised": null
}}
"""

    messages = [
        {"role": "system", "content": system_prompt},
        {"role": "user", "content": user_prompt},
    ]

    try:
        reply = call_ai(
            messages=messages,
            max_tokens=280,
            temperature=0.35,
            response_format={"type": "json_object"}
        )
        parsed = extract_json_from_text(reply)
        intent = parsed.get("intent", "probe_deeper")
        is_satisfied = bool(parsed.get("is_satisfied", False))
        should_advance = bool(parsed.get("should_advance", False))
        interviewer_reply = sanitize_interviewer_speech(parsed.get("interviewer_reply", "").strip(), question_text, candidate_name=detected_candidate_name)
        hint = parsed.get("hint")
        if hint:
            hint = sanitize_interviewer_speech(hint, question_text, candidate_name=detected_candidate_name)
            if hint.strip().lower() == interviewer_reply.strip().lower():
                hint = None

        # Turn budget & advancement logic:
        # A real interview stays on the topic and explores candidate's thoughts.
        # DO NOT advance on turn 1 or turn 2 unless candidate explicitly asks to move on.
        is_explicit_move_on = any(phrase in candidate_text.lower() for phrase in [
            "next question", "move on", "next topic", "skip this", "can we go to the next", "let's move to next"
        ])

        if is_explicit_move_on:
            should_advance = True
            intent = "satisfied_transition"
        elif turn_count_for_question < 2:
            # Strictly do not auto-advance on early turns - probe deeper like a senior interviewer!
            should_advance = False
            if intent == "satisfied_transition":
                intent = "probe_deeper"
        elif turn_count_for_question >= 4:
            # Cap at 4 turns on a single question so interview doesn't drag on forever
            should_advance = True
            is_satisfied = len(cumulative_answer.split()) >= 15 and not is_non_substantive_response(candidate_text)
            intent = "satisfied_transition"
        else:
            # On turn 2 or 3, only advance if candidate has provided a truly thorough, substantive technical answer (>= 35 words)
            total_words = len(cumulative_answer.split())
            if should_advance and total_words < 35:
                should_advance = False
                intent = "probe_deeper"

        # If the candidate asked for a hint, never advance or skip the question
        if request_hint:
            should_advance = False
            is_satisfied = False
            intent = "hint_and_nudge"

        # If advancing, NEVER append next_question_preview to interviewer_reply!
        # The frontend will display and speak the next question card separately.
        if should_advance:
            if not any(interviewer_reply.endswith(p) for p in [".", "!"]):
                interviewer_reply += "."
            # Remove any accidental question leakage
            if next_question_preview:
                nq_text = next_question_preview.get("question_text", "")
                if nq_text and nq_text in interviewer_reply:
                    interviewer_reply = interviewer_reply.replace(nq_text, "").strip()
            # Clean up transitions
            interviewer_reply = re.sub(r"\bnow,?\s*building\s+upon\s+that:?.*$", "", interviewer_reply, flags=re.IGNORECASE).strip()
            # Strictly prevent asking questions when advancing, since next question is rendered separately
            if "?" in interviewer_reply:
                first_sentence = interviewer_reply.split("?")[0].strip()
                if len(first_sentence.split()) >= 4 and not any(first_sentence.lower().startswith(w) for w in ["how", "what", "why", "could", "can", "would"]):
                    interviewer_reply = first_sentence + ". Let's proceed to our next topic."
                else:
                    interviewer_reply = "That makes sense and gives good context on your engineering thinking. Let's move to our next topic."
            elif not interviewer_reply or len(interviewer_reply.split()) < 4:
                interviewer_reply = "That makes sense and gives a clear picture of your approach. Let's move forward to our next topic."

        # If advancing, generate standard evaluation for report
        evaluation = None
        if should_advance:
            evaluation = evaluate_candidate_answer(
                question_number=question_number,
                question_text=question_text,
                candidate_answer=cumulative_answer or candidate_text or "Candidate addressed the topic with conversational guidance.",
                expected_concepts=expected_concepts,
                company=company,
                role=role,
                difficulty=difficulty
            )

        return {
            "interviewer_reply": interviewer_reply or "Could you share the technical design details you would choose here?",
            "intent": intent,
            "is_satisfied": is_satisfied,
            "should_advance": should_advance,
            "hint": hint,
            "cumulative_answer": cumulative_answer,
            "evaluation": evaluation.model_dump() if evaluation else None
        }

    except Exception as e:
        print(f"[Conversation Manager AI note - fallback]: {e}")
        is_explicit_move_on = any(phrase in candidate_text.lower() for phrase in [
            "next question", "move on", "next topic", "skip this", "can we go to the next", "let's move to next"
        ])

        # Turn budget or explicit move on: advance and evaluate
        if turn_count_for_question >= 3 or is_explicit_move_on:
            transition_text = "That gives me good context on your approach here. Let's proceed to our next topic."
            eval_res = evaluate_candidate_answer(
                question_number=question_number,
                question_text=question_text,
                candidate_answer=cumulative_answer or candidate_text or "[Candidate completed discussion turns]",
                expected_concepts=expected_concepts,
                company=company,
                role=role,
                difficulty=difficulty
            )
            return {
                "interviewer_reply": transition_text,
                "intent": "satisfied_transition",
                "is_satisfied": True,
                "should_advance": True,
                "hint": None,
                "cumulative_answer": cumulative_answer,
                "evaluation": eval_res.model_dump()
            }

        # Heuristic fallback if AI model is unreachable
        hint_text = get_fallback_hint(role, turn_count_for_question)
        if is_hesitant:
            reply_text = (
                f"Consider this technical angle: {hint_text} "
                f"How would you approach the problem from that perspective?"
            )
            return {
                "interviewer_reply": reply_text,
                "intent": "hint_and_nudge",
                "is_satisfied": False,
                "should_advance": False,
                "hint": hint_text,
                "cumulative_answer": cumulative_answer,
                "evaluation": None
            }
        elif is_non_substantive_response(candidate_text) or len(cumulative_answer.split()) < 12:
            reply_text = (
                f"Take a moment to think about the core design. As a {role}, what framework, database, "
                f"or architecture pattern would you choose to solve this?"
            )
            return {
                "interviewer_reply": reply_text,
                "intent": "probe_deeper",
                "is_satisfied": False,
                "should_advance": False,
                "hint": None,
                "cumulative_answer": cumulative_answer,
                "evaluation": None
            }
        else:
            reply_text = (
                f"That's a helpful perspective. In production as a {role}, how would you handle {prof['internals_focus']} "
                f"and potential scale bottlenecks or edge cases?"
            )
            return {
                "interviewer_reply": reply_text,
                "intent": "probe_deeper",
                "is_satisfied": False,
                "should_advance": False,
                "hint": None,
                "cumulative_answer": cumulative_answer,
                "evaluation": None
            }
