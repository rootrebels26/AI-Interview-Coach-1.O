# Project Structure

This project follows a full-stack layout inspired by clear hackathon/review repositories:

```text
backend/      Flask backend and intelligence modules
frontend/     React dashboard and user workflow
docs/         Architecture and implementation notes
```

## Backend

`backend/` owns API behavior, persistence, AI calls, resume analysis, and reusable backend helpers.

- `app.py`: creates and configures the Flask app.
- `models.py`: database models and SQLAlchemy instance.
- `api/routes/`: HTTP blueprints grouped by product area.
- `services/`: AI prompt/profile logic and other service integrations.
- `utils/`: deterministic helpers such as resume parsing and ATS scoring.

## Frontend

`frontend/` owns the browser app.

- `src/pages/`: route-level screens.
- `src/components/`: reusable UI components.
- `src/services/`: API client code.
- `src/styles/`: global styling.

## Docs

`docs/` explains how the system is built and how future contributors should extend it.
