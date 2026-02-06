"""API Routes."""

from .bout import bout_bp
from .health import health_bp
from .presets import presets_bp
from .waitlist import waitlist_bp

__all__ = ["bout_bp", "waitlist_bp", "presets_bp", "health_bp"]
