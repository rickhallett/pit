"""Message model — individual turns in a bout."""

from datetime import datetime, timezone

from nanoid import generate
from sqlalchemy import Column, DateTime, ForeignKey, Integer, String, Text

from .base import Base


def generate_message_id() -> str:
    """Generate a short message ID."""
    return generate(size=12)


class Message(Base):
    """A message is a single turn from one agent in a bout."""

    __tablename__ = "messages"

    id = Column(String(12), primary_key=True, default=generate_message_id)
    bout_id = Column(String(10), ForeignKey("bouts.id"), nullable=False, index=True)
    agent_name = Column(String(100), nullable=False)
    agent_role = Column(String(200), nullable=True)
    turn_number = Column(Integer, nullable=False)
    content = Column(Text, nullable=False)
    tokens_in = Column(Integer, nullable=False, default=0)
    tokens_out = Column(Integer, nullable=False, default=0)
    model_used = Column(String(50), nullable=True)
    created_at = Column(
        DateTime(timezone=True), nullable=False, default=lambda: datetime.now(timezone.utc)
    )
    latency_ms = Column(Integer, nullable=True)  # time-to-first-token

    def to_dict(self) -> dict:
        """Convert to dictionary for API responses."""
        return {
            "id": self.id,
            "bout_id": self.bout_id,
            "agent_name": self.agent_name,
            "agent_role": self.agent_role,
            "turn_number": self.turn_number,
            "content": self.content,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }
