"""Application configuration."""

import os
from dataclasses import dataclass


@dataclass
class Config:
    """Application configuration."""

    # Database
    DATABASE_URL: str = os.getenv("DATABASE_URL", "postgresql://pit:pit@localhost:5432/pit")

    # Email (Resend)
    RESEND_API_KEY: str = os.getenv("RESEND_API_KEY", "")
    FROM_EMAIL: str = os.getenv("FROM_EMAIL", "The Pit <noreply@thepit.cloud>")
    FRONTEND_URL: str = os.getenv("FRONTEND_URL", "https://thepit.cloud")

    # Anthropic
    ANTHROPIC_API_KEY: str = os.getenv("ANTHROPIC_API_KEY", "")

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

    # Rate limiting
    RATE_LIMIT_BOUTS_PER_HOUR: int = 3
    RATE_LIMIT_WINDOW_SECONDS: int = 3600

    # Server
    HOST: str = os.getenv("HOST", "0.0.0.0")
    PORT: int = int(os.getenv("PORT", "5000"))
    DEBUG: bool = os.getenv("DEBUG", "false").lower() == "true"


config = Config()
