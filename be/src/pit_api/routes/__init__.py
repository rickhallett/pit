"""API Routes."""

from .bout import bout_router
from .health import health_router
from .presets import presets_router
from .waitlist import waitlist_router

__all__ = ["bout_router", "waitlist_router", "presets_router", "health_router"]
