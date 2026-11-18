import time
from datetime import datetime, timezone
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routes.resume import resume_router
from app.routes.interview import interview_router
from app.routes.evaluation import evaluation_router
from app.config import settings

SERVER_START_TIME = time.time()

app = FastAPI(
    title=settings.APP_NAME,
    version=settings.VERSION,
    description="Standalone AI Interview Coach Backend - Free-first, zero-database mock interview preparation."
)

# CORS configuration allowing frontend connection
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routes
app.include_router(resume_router, prefix="/api")
app.include_router(interview_router, prefix="/api")
app.include_router(evaluation_router, prefix="/api")

def get_health_payload():
    now_utc = datetime.now(timezone.utc).isoformat()
    uptime_sec = round(time.time() - SERVER_START_TIME, 1)
    return {
        "status": "healthy",
        "service": settings.APP_NAME,
        "version": settings.VERSION,
        "render_keep_alive": True,
        "uptime_seconds": uptime_sec,
        "timestamp": now_utc,
        "storage": "in-memory only (zero-database)",
        "ai_configured": bool(settings.GROQ_API_KEY or settings.GEMINI_API_KEY or settings.OPENROUTER_API_KEY)
    }

# 1. Primary /health endpoint (supports both GET and HEAD for uptime monitors)
@app.get("/health", tags=["Health"])
@app.head("/health", tags=["Health"])
async def health_check():
    """Lightweight health check endpoint for UptimeRobot, Render, and Cron-job keep-alive pingers."""
    return get_health_payload()

# 2. /api/health endpoint
@app.get("/api/health", tags=["Health"])
@app.head("/api/health", tags=["Health"])
async def api_health_check():
    """API-prefixed health check endpoint."""
    return get_health_payload()

# 3. Root / endpoint (handles pingers that ping base URL https://service.onrender.com/)
@app.get("/", tags=["Health"])
@app.head("/", tags=["Health"])
async def root_check():
    """Root endpoint to keep Render backend awake when pinging base domain."""
    return get_health_payload()

if __name__ == "__main__":
    import uvicorn
    import os
    port = int(os.environ.get("PORT", settings.PORT or 8000))
    uvicorn.run("app.main:app", host="0.0.0.0", port=port, reload=False)
