"""Waitlist model — email signups."""

from datetime import datetime

from nanoid import generate
from sqlalchemy import Column, DateTime, String

from .base import Base


def generate_waitlist_id() -> str:
    """Generate a waitlist entry ID."""
    return generate(size=8)


class Waitlist(Base):
    """A waitlist entry for email capture."""

    __tablename__ = "waitlist"

    id = Column(String(8), primary_key=True, default=generate_waitlist_id)
    email = Column(String(320), nullable=False, unique=True)  # RFC 5321 max length
    source = Column(String(50), nullable=True)  # landing, post-bout, share-link
    created_at = Column(DateTime, nullable=False, default=datetime.utcnow)
    ip_hash = Column(String(64), nullable=True)

    def to_dict(self) -> dict:
        """Convert to dictionary."""
        return {
            "id": self.id,
            "email": self.email,
            "source": self.source,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }
