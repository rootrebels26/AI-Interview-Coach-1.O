# Development Guide

## Backend

Run backend commands from `backend/`.

```powershell
python app.py
```

The Flask entrypoint is `backend/app.py`. API modules live in `backend/api/routes/`.

When adding a new backend feature:

1. Add or update the route in `backend/api/routes/`.
2. Put reusable integration/business logic in `backend/services/`.
3. Put deterministic helper logic in `backend/utils/`.
4. Add database fields or tables in `backend/models.py`.

## Frontend

Run frontend commands from `frontend/`.

```powershell
npm run dev
npm run build
```

When adding a new frontend feature:

1. Add screen-level UI in `frontend/src/pages/`.
2. Add reusable UI in `frontend/src/components/`.
3. Add API calls in `frontend/src/services/api.js`.
4. Add shared frontend structure only when a feature actually needs it.
