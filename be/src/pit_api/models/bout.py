"""Bout model — represents a single AI battle."""

from datetime import datetime, timezone

from nanoid import generate
from sqlalchemy import Column, DateTime, Float, Index, Integer, String, Text
from sqlalchemy.dialects.postgresql import JSONB

from .base import Base


def generate_bout_id() -> str:
    """Generate a short, URL-safe bout ID."""
    return generate(size=10)


class Bout(Base):
    """A bout is a single AI battle between agents."""

    __tablename__ = "bouts"
    __table_args__ = (Index("ix_bouts_ip_hash_created_at", "ip_hash", "created_at"),)

    id = Column(String(10), primary_key=True, default=generate_bout_id)
    preset_id = Column(String(50), nullable=True)  # null for custom bouts
    status = Column(
        String(20), nullable=False, default="pending"
    )  # pending, running, complete, error, timeout
    model_tier = Column(
        String(20), nullable=False, default="standard"
    )  # standard, juiced, unleashed
    topic = Column(Text, nullable=True)  # custom topic for Gloves Off
    agent_count = Column(Integer, nullable=False, default=4)
    total_turns = Column(Integer, nullable=False, default=0)
    token_cost = Column(Float, nullable=False, default=0.0)
    created_at = Column(
        DateTime(timezone=True), nullable=False, default=lambda: datetime.now(timezone.utc)
    )
    completed_at = Column(DateTime(timezone=True), nullable=True)
    ip_hash = Column(String(64), nullable=True)  # SHA-256 of IP for rate limiting
    extra = Column(JSONB, nullable=True)  # flexible JSON blob

    def to_dict(self) -> dict:
        """Convert to dictionary for API responses."""
        return {
            "bout_id": self.id,
            "preset_id": self.preset_id,
            "status": self.status,
            "model_tier": self.model_tier,
            "topic": self.topic,
            "agent_count": self.agent_count,
            "total_turns": self.total_turns,
            "token_cost": self.token_cost,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "completed_at": (self.completed_at.isoformat() if self.completed_at else None),
        }
