"""Application configuration."""

import os
from dataclasses import dataclass


@dataclass
class Config:
    """Application configuration."""

    # Database
    DATABASE_URL: str = os.getenv("DATABASE_URL", "postgresql://pit:pit@localhost:5432/pit")

    # Anthropic
    ANTHROPIC_API_KEY: str = os.getenv("ANTHROPIC_API_KEY", "")

    # Models
    MODEL_STANDARD: str = "claude-3-5-haiku-20241022"  # Haiku 4.5
    MODEL_JUICED: str = "claude-sonnet-4-20250514"  # Sonnet 4.5
    MODEL_UNLEASHED: str = "claude-opus-4-20250514"  # Opus 4.5

    # Bout settings
    TURNS_STANDARD: int = 12
    TURNS_JUICED: int = 24
    TURNS_UNLEASHED: int = 48

    MAX_TOKENS_PER_TURN: int = 500

    # Rate limiting
    RATE_LIMIT_BOUTS_PER_HOUR: int = 1
    RATE_LIMIT_WINDOW_SECONDS: int = 3600

    # Server
    HOST: str = os.getenv("HOST", "0.0.0.0")
    PORT: int = int(os.getenv("PORT", "5000"))
    DEBUG: bool = os.getenv("DEBUG", "false").lower() == "true"


config = Config()
