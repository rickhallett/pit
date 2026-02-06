"""Application configuration."""

import os
from dataclasses import dataclass


class ConfigurationError(Exception):
    """Raised when required configuration is missing or invalid."""


@dataclass
class Config:
    """Application configuration."""

    # Database
    DATABASE_URL: str = os.getenv("DATABASE_URL", "postgresql://pit:pit@localhost:5432/pit")

    # Anthropic
    # CRITIC:SEC — Empty default could cause confusing errors. Consider startup validation.
    ANTHROPIC_API_KEY: str = os.getenv("ANTHROPIC_API_KEY", "")

    def __post_init__(self) -> None:
        """Validate required configuration on startup."""
        if not self.ANTHROPIC_API_KEY:
            raise ConfigurationError(
                "ANTHROPIC_API_KEY environment variable is required. "
                "Set it before starting the application."
            )

    # Models (4.5+ only, no fallback to 3.5 series)
    # See: https://docs.anthropic.com/en/docs/about-claude/models
    MODEL_STANDARD: str = "claude-haiku-4-5-20251001"  # Haiku 4.5
    MODEL_JUICED: str = "claude-sonnet-4-5-20250929"  # Sonnet 4.5
    MODEL_UNLEASHED: str = "claude-opus-4-5-20251101"  # Opus 4.5

    # Bout settings (inverted: cheaper models get more turns for cost parity)
    TURNS_STANDARD: int = 48  # Haiku 4.5 — most turns, lowest cost/turn
    TURNS_JUICED: int = 24  # Sonnet 4.5 — balanced
    TURNS_UNLEASHED: int = 12  # Opus 4.5 — fewest turns, highest quality

    MAX_TOKENS_PER_TURN: int = 500

    # Cost ceiling per bout (in dollars) — prevents runaway costs
    # Set to None for unlimited (not recommended in production)
    COST_CEILING_STANDARD: float = 0.50  # Haiku — generous buffer
    COST_CEILING_JUICED: float = 0.75  # Sonnet — moderate buffer
    COST_CEILING_UNLEASHED: float = 1.00  # Opus — premium tier

    # Rate limiting
    RATE_LIMIT_BOUTS_PER_HOUR: int = 3
    RATE_LIMIT_WINDOW_SECONDS: int = 3600

    # Server
    HOST: str = os.getenv("HOST", "0.0.0.0")
    PORT: int = int(os.getenv("PORT", "5000"))
    DEBUG: bool = os.getenv("DEBUG", "false").lower() == "true"


config = Config()
