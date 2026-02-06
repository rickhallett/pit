"""Preset table — Debate format definitions."""

from sqlalchemy import Boolean, Column, DateTime, Integer, String, Text
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.sql import func

from .base import Base


class Preset(Base):
    """A preset defines a debate format with roles and rules."""

    __tablename__ = "presets"

    id = Column(Text, primary_key=True)  # 'darwin_special', 'shark_pit'
    name = Column(Text, nullable=False)  # 'Darwin Special'
    description = Column(Text, nullable=True)
    agent_count = Column(Integer, nullable=False)  # Required agents (trigger enforces)
    config_json = Column(JSONB, nullable=False)  # roles[], turn_order, rules
    active = Column(Boolean, server_default="true")
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    def to_dict(self) -> dict:
        """Convert to dictionary for API responses."""
        return {
            "id": self.id,
            "name": self.name,
            "description": self.description,
            "agent_count": self.agent_count,
            "config": self.config_json or {},
            "active": self.active,
        }
