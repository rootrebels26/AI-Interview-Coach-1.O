# SECURITY_AUDIT.md — Security & Privacy Risk Assessment

**Audit Date:** November 2026  
**Auditor:** Senior Product Security Team  
**Status:** AUDITED — COMPREHENSIVE PRIVACY & SECURITY AUDIT

---

## 1. Zero-Database & Privacy Guarantees Verification

### 1.1 Resume Data Privacy
- **Processing Flow:** Uploaded files (`POST /api/interview/analyse-resume`) are read as bytes directly into memory via `await file.read()`.
- **Validation:** Enforces 10MB maximum limit and `.pdf` / `.docx` extension verification in `validators.py`.
- **Storage:** `del contents` and `await file.close()` are called immediately. Resume bytes are **never written to disk, SQLite, or S3**.
- **Assessment:** **PASS (Privacy compliant)**.

### 1.2 Session Privacy
- **Identifiers:** Sessions use cryptographically random `uuid.uuid4()`.
- **Isolation:** Stored in memory map (`ACTIVE_SESSIONS[session_id]`). Users cannot access or enumerate another candidate's session without the random 128-bit UUID.
- **Transcripts:** Destroyed when the server process restarts or session is concluded.
- **Assessment:** **PASS (Privacy compliant)**.

### 1.3 Camera & Video Processing Privacy
- **Implementation:** MediaPipe FaceDetector runs entirely inside the candidate's browser via WebAssembly (`tasks-vision@0.10.17/wasm`) and WebGL.
- **Network Verification:** Zero frames, snapshots, or biometric vectors are transmitted across the network to FastAPI or external servers.
- **Tracks Cleanup:** All media tracks are stopped upon `stopCamera()` or unmount (`track.stop()`).
- **Assessment:** **PASS (Zero remote biometric exposure)**.

---

## 2. External AI Provider Privacy Audit

When candidates participate in mock interviews, dialogue turns and question generation prompts are transmitted to external AI APIs:
1. **Groq Cloud (Primary):**
   - Transmits candidate answers and question context to Groq's inference endpoint (`api.groq.com`).
   - Groq operates under standard API terms of service (no training on enterprise API inputs).
2. **Google Gemini (Fallback):**
   - If enabled, prompts are transmitted to `generativelanguage.googleapis.com`.
3. **OpenRouter (Fallback):**
   - If enabled, prompts are transmitted to OpenRouter endpoints.

**Documentation Commitment:** Transparently inform candidates in the UI that technical dialogue is evaluated via secure cloud AI endpoints without permanent transcript retention.

---

## 3. Discovered Security Vulnerabilities & Advisories

### Finding SEC-01: 18 Frontend npm Package Vulnerabilities
- **Severity:** P2 (High Dependency Advisory)
- **Affected File:** `frontend/package-lock.json`
- **Details:** `npm audit` reported:
  - `axios (<= 1.19.0)`: Prototype pollution in formToJSON and auth subfields (GHSA-xj6q-8x83-jv6g, GHSA-pmv8-rq9r-6j72).
  - `react-router (6.0.0 - 7.18.1)`: Potential CSRF and open redirect via backslash (GHSA-84g9-w2xq-vcv6, GHSA-wrjc-x8rr-h8h6).
  - `follow-redirects (<= 1.16.1)`: Header injection & cross-origin credential stripping (GHSA-q3jh-wrc6-jgq8).
- **Recommended Correction:** Execute `npm update axios follow-redirects` to bump dependencies to patched minor releases without introducing breaking React 19 incompatibilities.

### Finding SEC-02: Permissive CORS Configuration
- **Severity:** P3 (Configuration Hardening)
- **Affected File:** `backend/app/main.py` (Line 21)
- **Code:**
  ```python
  app.add_middleware(
      CORSMiddleware,
      allow_origins=["*"],
      allow_credentials=True,
      allow_methods=["*"],
      allow_headers=["*"],
  )
  ```
- **Risk:** `allow_origins=["*"]` allows any web origin to query `/api/` endpoints. While acceptable in local development, production deployments (e.g. on Render/Vercel) should restrict origins to the official frontend domain or configured environment variable.
- **Recommended Correction:** Read `ALLOWED_ORIGINS` from environment with `["*"]` default only when `DEBUG=True`.
