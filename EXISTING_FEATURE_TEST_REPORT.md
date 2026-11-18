# EXISTING_FEATURE_TEST_REPORT.md — End-to-End Feature Verification Report

**Audit Date:** November 2026  
**Auditor:** Senior Engineering Team  
**Scope:** Phase 0 Live Feature Testing (End-to-End Candidate Journey)  
**Status:** DISCOVERY & BASELINE VERIFIED

---

## 1. Feature Test Results Summary

| Feature Component | Test Target | Observed Behavior | Status | Finding Ref |
| :--- | :--- | :--- | :---: | :---: |
| **Home Page** | Initial load, navigation, hero UI | Clean render, no console errors, responsive | **PASS** | - |
| **Interview Setup** | Company, Role, Difficulty, Focus | Form state updates correctly | **PASS** | - |
| **Duration Selection** | 1m, 5m, 10m, 20m, 30m options | Transmits `duration_minutes` to backend session | **PASS** | - |
| **Resume Parsing (PDF)** | Upload `.pdf`, extract in memory | PyPDF2 handles extraction, zero disk persistence | **PASS** | - |
| **Resume Parsing (DOCX)**| Upload `.docx`, extract in memory | `python-docx` parses paragraphs and tables | **PASS** | - |
| **Interview Lifecycle** | Initial question -> dialogue turns | Multi-turn back-and-forth operational | **PASS** | - |
| **Interviewer Speech** | Web Speech API audio output | Speaks questions with Chrome resume fix | **PASS** | - |
| **Mic Audio Capture** | Web Speech API streaming STT | Captures transcript in input box | **PASS** | - |
| **Whisper Fallback** | MediaRecorder `.webm` upload | Groq Whisper `/api/interview/transcribe` | **PASS** | - |
| **Hint Modal** | Non-advancing popup modal | Displays technical clue, zero advance | **PASS** | - |
| **Anti-Therapy Filter** | `sanitize_interviewer_speech` | Strips "No problem", "take a deep breath" | **PASS** | - |
| **Anti-Pity Scoring** | "hi hi hi", "ok", "am I audible" | Strictly awards 0.0/100 points | **PASS** | - |
| **Camera Posture UI** | Optional MediaPipe vision | Runs WebGL client-side; no backend streaming | **PASS** | - |
| **Tab Detection** | Document visibility & blur | Tracks switch count; triggers modal alert | **PASS (Edge case)** | AUD-07 |
| **Time Concluded Modal**| 0 completed vs >= 1 completed | Offers "Keep Discussing" vs "View Report" | **PASS** | - |
| **Report Generation** | 6-factor aggregate & breakdown | Computes weighted math and qualitative review | **PASS** | - |

---

## 2. Detailed Feature Audit Logs

### 2.1 Setup & Configuration
- **Observed Behavior:** Selection of custom company, custom job title, role pills, and duration buttons (**1 min, 5 min, 10 min, 20 min, 30 min**) stores clean state in `InterviewContext.jsx`.
- **Backend Transmission:** Sent as JSON body to `POST /api/interview/start`:
  ```json
  {
    "company": "Google",
    "role": "Software Engineer",
    "interview_type": "Technical Interview",
    "difficulty": "Intermediate",
    "duration_minutes": 10
  }
  ```
- **Backend Response:** Returns `session_id`, `first_question`, `minimum_required_for_report: 1`, `duration_minutes: 10`.

---

### 2.2 Live Conversational Turn Testing
- **Test Case 1 (Mic Test):** Input: `"Hello, I am audible."`
  - *Result:* Interviewer replies: `"Loud and clear! Take your time, and tell me how you would approach: [Question]"`
  - *State:* `should_advance: false`, `is_satisfied: false`, `evaluation: null`.
- **Test Case 2 (Acknowledgment):** Input: `"ok"`
  - *Result:* Interviewer replies: `"Great! Whenever you're ready, tell me: [Question]"`
  - *State:* `should_advance: false`, `is_satisfied: false`, `evaluation: null`.
- **Test Case 3 (Gibberish / Evasion):** Input: `"hi hi hi"`
  - *Result:* Strict 0.0 points awarded, question remains active, zero advance.
- **Test Case 4 (Solid Technical Response):** Input: Architectural explanation of Redis cache-aside with pub/sub invalidation.
  - *Result:* Evaluated with 93/100 across 6 rubric dimensions; interviewer acknowledges specifics and bridges forward.

---

### 2.3 Hint Modal & Non-Advancing Validation
- **Button:** Clicked **"Interviewer Clue"** lightbulb button.
- **Observed Behavior:**
  - `isHintModalOpen` state becomes `true`.
  - Background blurs with modal overlay.
  - Payload sent: `POST /api/interview/hint` with `question_text` and `expected_concepts`.
  - Response renders `hint_title`, `mental_model`, and `guiding_questions`.
  - Clicking **"Got It, Continue Answering"** dismisses modal.
  - **Verification:** Current question index did NOT change, turn count did NOT reset, no answer was submitted.

---

### 2.4 Time Management & Report Generation
- **Test Run with 1-Minute Duration:**
  - Timer counts down from `01:00` to `00:00`.
  - Audio speech triggers: *"Your scheduled interview time has concluded."*
  - Modal pops up:
    - If 0 questions evaluated: Buttons show **[Keep Discussing]** and **[Leave Interview]**.
    - If $\ge 1$ question evaluated: Buttons show **[Keep Discussing]** and **[View Report ->]**.
  - Clicking **[View Report]** navigates to `/report`.
  - Report displays overall score, 6-factor radar scores, transcript with quote evidence, technical gaps, and 5 personalized practice questions.
