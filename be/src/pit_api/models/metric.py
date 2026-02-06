"""Metric model — event logging for analytics."""

from datetime import datetime, timezone

from nanoid import generate
from sqlalchemy import Column, DateTime, String
from sqlalchemy.dialects.postgresql import JSONB

from .base import Base


def generate_metric_id() -> str:
    """Generate a metric entry ID."""
    return generate(size=12)


class Metric(Base):
    """A metric event for analytics and debugging."""

    __tablename__ = "metrics"

    id = Column(String(12), primary_key=True, default=generate_metric_id)
    event = Column(String(50), nullable=False, index=True)  # bout_start, share_click, etc
    bout_id = Column(String(10), nullable=True, index=True)
    payload = Column(JSONB, nullable=True)
    created_at = Column(
        DateTime(timezone=True),
        nullable=False,
        default=lambda: datetime.now(timezone.utc),
        index=True,
    )
    ip_hash = Column(String(64), nullable=True)

    @classmethod
    def log(
        cls,
        db,
        event: str,
        bout_id: str = None,
        payload: dict = None,
        ip_hash: str = None,
    ):
        """Convenience method to log a metric."""
        metric = cls(
            event=event,
            bout_id=bout_id,
            payload=payload,
            ip_hash=ip_hash,
        )
        db.add(metric)
        db.commit()
        return metric
