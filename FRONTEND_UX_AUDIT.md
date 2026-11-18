# FRONTEND_UX_AUDIT.md — Frontend Architecture & User Experience Audit

**Audit Date:** November 2026  
**Component:** React 19 Frontend (`AI-Interview-feature/frontend/src/`)  
**Status:** AUDITED — UI/UX DISCOVERY & GAP ANALYSIS

---

## 1. Frontend Architecture Overview

- **Framework:** React 19 (`react: ^19.0.0`, `react-dom: ^19.0.0`)
- **Router:** React Router v7 (`react-router-dom: ^7.1.5`)
- **Build System:** Vite 6 (`vite: ^6.1.0`, `@vitejs/plugin-react: ^4.3.4`)
- **Styling:** Tailwind CSS 3.4 (`tailwindcss: ^3.4.17`)
- **State Management:** Context API (`InterviewContext.jsx`)
- **Production Build:** `npm run build` succeeds cleanly in **18.81s** without syntax errors.

---

## 2. Component-by-Component UX Assessment

### 2.1 `InterviewSetup.jsx`
- **Strengths:** Clean card layout, intuitive role pills, clear difficulty sliders, custom duration buttons (1, 5, 10, 20, 30 min).
- **Findings:**
  - If a user uploads a resume and then changes the target role, the resume summary does not notify the user whether the resume aligns with the newly selected role until the interview starts.

### 2.2 `AIInterviewer.jsx`
- **Strengths:** 
  - Dynamic Discussion Radar replacing rigid static topic counter.
  - Seamless speech replay buttons on each message bubble.
  - Clean separation of the Hint button into a dedicated popup modal.
  - Responsive text input and microphone toggle.
- **Findings:**
  - **Issue FE-01:** Rapid clicking on "Submit" can trigger duplicate turn submissions before the first AI reply is rendered.
  - **Issue FE-02:** When Chrome suspends audio playback on long idle intervals, speech synthesis occasionally requires a user click to resume audio context.

### 2.3 `InterviewReport.jsx`
- **Strengths:**
  - Comprehensive 6-dimension scoring breakdown.
  - Expandable/collapsible question cards.
  - Clear color-coded score indicators (`emerald` >= 80, `cyan` >= 65, `amber` >= 50, `rose` < 50).
- **Findings:**
  - **Issue FE-03 (Branding):** Line 65 contains hardcoded legacy branding `"Interview Performance Analysis • Nitya UI"`.
  - **Issue FE-04 (PDF Download):** Both "Print Report" and "Download PDF" call `window.print()`. While native Print to PDF is standard, users on certain browsers or mobile devices expect a direct file download.

### 2.4 Tab Switching & Blur Detection (`useTabDetection.js`)
- **Issue FE-05 (Double Counting):**
  ```javascript
  document.addEventListener('visibilitychange', handleVisibilityChange);
  window.addEventListener('blur', handleWindowBlur);
  ```
  Both events fire when an OS window loses focus, incrementing the tab switch count twice for a single user action. This can cause false perception of aggressive proctoring.
- **Correction:** Remove `window.blur` or debounce the switch counter with a 1-second cooldown.
