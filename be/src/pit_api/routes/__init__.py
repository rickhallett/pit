"""API Routes."""

from .auth import auth_bp
from .bout import bout_bp
from .health import health_bp
from .presets import presets_bp
from .waitlist import waitlist_bp

__all__ = ["auth_bp", "bout_bp", "waitlist_bp", "presets_bp", "health_bp"]
