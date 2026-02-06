"""Model table — Available LLMs."""

from sqlalchemy import Boolean, Column, DateTime, String, Text
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.sql import func

from .base import Base


class Model(Base):
    """An LLM model available for use in bouts."""

    __tablename__ = "models"

    id = Column(UUID(as_uuid=True), primary_key=True, server_default=func.gen_random_uuid())
    provider = Column(Text, nullable=False)  # 'anthropic', 'openai', 'google'
    model_id = Column(Text, nullable=False)  # 'claude-sonnet-4-20250514'
    name = Column(Text, nullable=False)  # Display name
    params_json = Column(JSONB, server_default="{}")  # Provider defaults (temp, max_tokens)
    active = Column(Boolean, server_default="true")
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    __table_args__ = (
        # UNIQUE(provider, model_id)
        {"sqlite_autoincrement": True},
    )

    def to_dict(self) -> dict:
        """Convert to dictionary for API responses."""
        return {
            "id": str(self.id),
            "provider": self.provider,
            "model_id": self.model_id,
            "name": self.name,
            "params": self.params_json or {},
            "active": self.active,
        }
