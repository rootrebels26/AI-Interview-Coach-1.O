# PRODUCTION_GAP_ANALYSIS.md — Production Readiness & Gap Analysis

**Audit Date:** November 2026  
**Auditor:** Principal Release Architect  
**Status:** AUDITED — PRODUCTION DEPLOYMENT PREREQUISITES

---

## 1. Deployment Target Readiness

| Component | Target Platform | Existing Config File | Readiness Status | Action Needed |
| :--- | :--- | :--- | :---: | :--- |
| **Backend API** | Render / Railway | `backend/render.yaml`, `Procfile`, `runtime.txt` | **90% Ready** | Configure `PORT` binding and session cleanup |
| **Frontend UI** | Vercel / Netlify | `frontend/vercel.json`, `package.json` | **95% Ready** | Set `VITE_BACKEND_URL` environment variable |

---

## 2. Identified Production Gaps

### Gap PROD-01: Session Memory Pruning on Long-Running Deployments
- **Impact:** On Render Free Tier instances (512MB RAM), in-memory `ACTIVE_SESSIONS` will eventually exhaust available memory after several hundred interview sessions without restarting.
- **Prerequisite:** Add background periodic cache eviction that purges sessions inactive for $> 2$ hours.

### Gap PROD-02: Missing Request Rate Limiting on Free AI Endpoints
- **Impact:** Malicious automated bots or scrapers can spam `/api/interview/converse` or `/api/interview/start`, exhausting the team's Groq free tier quota in minutes.
- **Prerequisite:** Integrate a lightweight in-memory rate limiter (e.g. `slowapi` or standard IP sliding-window counter) capping turns to 30 requests/minute per IP.

### Gap PROD-03: PDF/DOCX Parsing Test Compatibility
- **Impact:** `test_resume_parser.py` and `test_end_to_end_workflow.py` fail in CI/CD environments because `fitz` is not installed, even though the production code gracefully falls back to `PyPDF2`.
- **Prerequisite:** Refactor test fixtures to use `PyPDF2` or conditionally test `fitz` only when present.

### Gap PROD-04: Hardcoded Branding & Path Artifacts
- **Impact:** Hardcoded branding `"Nitya UI"` in `InterviewReport.jsx` and hardcoded `.env` paths in test files reduce professional polish.
- **Prerequisite:** Clean all legacy branding strings and standardize environment path loading.
