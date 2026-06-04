# System Overview

AI Interview Coach has three main workflows:

```text
Authentication -> Protected app access
Interview -> AI response -> Save session -> Generate feedback
Resume upload -> Text extraction -> ATS score -> AI analysis
```

## Backend Responsibilities

- Authenticate users with JWT.
- Store users, interviews, feedback, and resume records in SQLite through SQLAlchemy.
- Call Groq for interview responses and structured feedback.
- Parse resumes and calculate ATS-style scoring signals.
- Expose admin endpoints for history and analytics.

## Frontend Responsibilities

- Route users through login, signup, interview practice, resume analysis, feedback, history, and admin views.
- Store the JWT in browser local storage.
- Send authenticated API requests through `src/services/api.js`.
- Present AI responses, resume feedback, analytics, and history.
