"""API package for the AI Interview Coach backend.

This package groups all HTTP-facing Flask blueprint modules under
`backend/api/routes`.
"""

from .routes import auth_bp, chat_bp, feedback_bp, resume_bp

__all__ = ["auth_bp", "chat_bp", "feedback_bp", "resume_bp"]
