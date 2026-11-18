# CONVERSATIONAL_AI_AUDIT.md — Conversational AI & Dialogue Engine Audit

**Audit Date:** November 2026  
**Component:** `conversation_manager.py`, `ai_provider.py`, `question_generator.py`  
**Status:** AUDITED — ARCHITECTURAL STRENGTHS & DISCOVERED GAPS

---

## 1. Conversational Architecture Review

The conversational engine manages live multi-turn technical discussions between the candidate and an AI hiring lead.

### 1.1 Decision Engine & Intent State Machine
Every turn processes candidate input and determines:
- `interviewer_reply`: Concise spoken dialogue (1-3 sentences).
- `intent`:
  - `probe_deeper`: Candidate provided incomplete or partial explanation; interviewer drills into internal mechanisms or failure modes.
  - `hint_and_nudge`: Candidate requested assistance or hesitated; interviewer provides technical scaffolding.
  - `satisfied_transition`: Candidate demonstrated technical depth; interviewer validates strong points and bridges to next topic.
- `should_advance`: Boolean controlling whether the interview advances to the next primary question.
- `is_satisfied`: Boolean reflecting technical satisfaction.

---

## 2. Identified Strengths

1. **Active Listening & Contextual Probing:** The system prompt instructs the AI to actively react to specific tools and patterns (e.g., Redis, Kafka, B-Trees, Docker, ACID transactions) rather than reciting scripted templates.
2. **Dedicated Fast-Path Acknowledgment Handlers:** Added `is_acknowledgment_or_ready` and `detect_mic_check_or_greeting` which bypass heavy LLM inference for quick ready signals (`"ok"`, `"yes"`, `"ready"`), delivering sub-50ms natural peer responses.
3. **Automated Speech Sanitizer:** The `sanitize_interviewer_speech` function guarantees that patronizing clichés (*"No problem at all"*, *"Take a deep breath"*, *"Let's think through this together"*) are permanently removed.

---

## 3. Discovered Weaknesses & Gaps

### Finding AI-01: Word Count Heuristic Can Penalize Valid Concise Answers
- **Severity:** P2 (Quality & Fairness Issue)
- **Affected File:** `backend/app/services/conversation_manager.py` (Line 315)
- **Observed Behavior:**
  ```python
  if len(cumulative_answer.split()) < 12 or is_non_substantive_response(candidate_text):
      should_advance = False
      is_satisfied = False
      intent = "probe_deeper"
  ```
- **Problem:** If an interviewer asks a direct factual question (e.g., *"What is an idempotent API method?"*), an exact and correct answer such as *"An operation that produces the same result no matter how many times it is executed"* contains 15 words, but an answer like *"A method where multiple identical requests have the same effect as a single request"* has 14 words. If an answer contains 10 or 11 words, it is automatically blocked from advancing, even if conceptually complete.
- **Recommended Correction:** Replace the hardcoded word-count threshold with semantic completeness verification using expected concepts matching and LLM satisfaction flag.

---

### Finding AI-02: Bounded Dialogue History Memory Truncation
- **Severity:** P2 (Context Retention Risk)
- **Affected File:** `backend/app/services/conversation_manager.py` (Line 253)
- **Observed Behavior:**
  ```python
  history_summary = "\n".join([
      f"{t.get('role', 'speaker').upper()}: {t.get('text', '')}"
      for t in dialogue_history[-4:]
  ])
  ```
- **Problem:** Only the last 4 turns (`[-4:]`) are supplied to the prompt. In an extended 30-minute interview with 6 or 7 back-and-forth exchanges on a complex architecture question, earlier architectural decisions (such as choosing PostgreSQL over MongoDB or defining specific partition keys) are dropped from the LLM context.
- **Recommended Correction:** Implement an active architectural memory summary that retains key candidate claims and technologies mentioned across all turns of the current question.

---

### Finding AI-03: Groq Token Exhaustion on Qwen 27B Structured Generation
- **Severity:** P2 (Reliability)
- **Affected File:** `backend/app/services/ai_provider.py` & `report_generator.py`
- **Observed Behavior:** When generating comprehensive reports with large schemas, `qwen/qwen3.8-27b` exceeds max completion tokens before generating a closed JSON document (`json_validate_failed`).
- **Recommended Correction:** Enforce dynamic schema compression and set explicit `max_tokens` boundaries according to model capabilities in `ai_provider.py`.
