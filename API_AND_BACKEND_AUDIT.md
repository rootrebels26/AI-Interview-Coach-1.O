# API_AND_BACKEND_AUDIT.md — FastAPI Endpoints & Backend Architecture Audit

**Audit Date:** November 2026  
**Component:** `backend/app/routes/`, `backend/app/schemas/`, `backend/app/main.py`  
**Status:** AUDITED — ENDPOINT BY ENDPOINT VERIFICATION

---

## 1. Verified Endpoints Inventory

| Route | Method | Purpose | Auth / Protection | Status |
| :--- | :---: | :--- | :--- | :---: |
| `/health` | `GET`, `HEAD` | Root health check for uptime monitors & Render keep-alive | Public | **PASS** |
| `/api/health` | `GET`, `HEAD` | API-prefixed health check | Public | **PASS** |
| `/` | `GET`, `HEAD` | Base domain keep-alive | Public | **PASS** |
| `/api/interview/start` | `POST` | Initialize interview session, generate questions | Public (Body validated) | **PASS** |
| `/api/interview/next-question`| `POST` | Fetch or dynamically generate subsequent question | Session ID validated | **PASS** |
| `/api/interview/conclude` | `POST` | Conclude interview session | Session ID optional | **PASS** |
| `/api/interview/hint` | `POST` | Generate non-advancing question clue | Context validated | **PASS** |
| `/api/interview/converse` | `POST` | Process candidate turn, probe deeper, or advance | Context validated | **PASS** |
| `/api/interview/evaluate-answer`| `POST`| Standalone 6-factor evaluation for completed answer | Strict scoring rubric | **PASS** |
| `/api/interview/final-report` | `POST`| Generate comprehensive feedback report | >= 1 question required | **PASS** |
| `/api/interview/analyse-resume`| `POST`| In-memory parse of uploaded PDF/DOCX | 10MB limit, zero disk write | **PASS** |
| `/api/interview/transcribe` | `POST`| Whisper audio transcription fallback | Temporary buffer only | **PASS** |

---

## 2. Discovered Backend Findings & Weaknesses

### Finding BE-01: In-Memory `ACTIVE_SESSIONS` Lacks Expiration TTL (Memory Leak Risk)
- **Severity:** P2 (Reliability / DoS Vulnerability)
- **Affected File:** `backend/app/routes/interview.py` (Line 17)
- **Code:**
  ```python
  ACTIVE_SESSIONS: Dict[str, Dict[str, Any]] = {}
  ```
- **Observed Behavior:** Each session started by a user creates an entry in `ACTIVE_SESSIONS` with full question dictionaries, evaluation dictionaries, and transcripts. No TTL (time-to-live) eviction or periodic cleanup routine exists. If 1,000 candidates practice over a few days on a free Render/cloud instance with 512MB RAM, the Python process will suffer from memory exhaustion (`OOMKill`).
- **Recommended Correction:** Implement a lightweight in-memory cache eviction (e.g. prune sessions older than 2 hours) on every `/start` or `/health` invocation without requiring an external database.

---

### Finding BE-02: Missing Idempotency Key on `/converse` Retries
- **Severity:** P2 (Conversational Synchronization)
- **Affected File:** `backend/app/routes/interview.py` (Line 373)
- **Observed Behavior:** If network latency causes the frontend Axios client to timeout or the candidate clicks submit twice in rapid succession, two concurrent requests execute `process_conversational_turn`. Both can append duplicate candidate messages and increment `turn_count_for_question`.
- **Recommended Correction:** Add a `turn_id` or client sequence number in `ConverseRequest` to deduplicate in-flight turns.

---

### Finding BE-03: `load_dotenv` Path Inconsistency Across Test Files
- **Severity:** P3 (Developer Ergonomics)
- **Affected Files:** `backend/app/test_ai_provider.py`, `backend/app/test_answer_evaluator.py`, `backend/app/test_role_depth.py`
- **Observed Behavior:**
  ```python
  load_dotenv("ai-interview-coach/backend/.env")
  ```
  Hardcoded lowercase path `"ai-interview-coach/backend/.env"` causes tests to fail to find environment variables when run from different directories.
- **Recommended Correction:** Use `find_dotenv()` or relative path resolution `Path(__file__).parents[1] / ".env"`.
