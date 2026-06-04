"""Blueprint exports for all API route modules."""

from .auth_routes import auth_bp
from .chat_routes import chat_bp
from .feedback_routes import feedback_bp
from .resume_routes import resume_bp

__all__ = ["auth_bp", "chat_bp", "feedback_bp", "resume_bp"]
