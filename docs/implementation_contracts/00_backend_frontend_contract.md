# Backend And Frontend Contract

The frontend talks to the backend using the base URL from:

```text
VITE_API_URL
```

If unset, the frontend defaults to:

```text
http://localhost:5000/api
```

## Route Groups

```text
/api/auth       Authentication and user account operations
/api/chat       AI interview chat and interview save operations
/api/resume     Resume upload, ATS score, and resume admin operations
/api/feedback   Feedback generation, history, public stats, and admin analytics
/api/health     Backend health check
```

## Auth

Most app routes require a JWT bearer token:

```text
Authorization: Bearer <token>
```

The token is returned by `/api/auth/login` and stored by the frontend in local storage.
