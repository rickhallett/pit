"""Vote model — user judgments on bout outcomes."""

import enum
from datetime import datetime
from uuid import uuid4

from sqlalchemy import DateTime, Enum, ForeignKey, Index, String, Text, func
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column

from .base import Base


class VoteType(enum.Enum):
    """Vote type for multi-agent outcomes."""

    WINNER = "winner"      # Single agent selection
    RANKING = "ranking"    # Ordered preference
    SURVIVAL = "survival"  # Who stays (elimination)


class Vote(Base):
    """User vote on a bout outcome."""

    __tablename__ = "votes"

    id: Mapped[UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid4
    )
    bout_id: Mapped[UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("bouts.id", ondelete="CASCADE"),
        nullable=False,
    )

    vote_type: Mapped[VoteType] = mapped_column(
        Enum(VoteType), nullable=False
    )

    # For 'winner' type — which agent won
    winner_agent_id: Mapped[UUID | None] = mapped_column(UUID(as_uuid=True))

    # For 'ranking' type — ordered array of agent IDs
    ranking: Mapped[list | None] = mapped_column(JSONB)

    # For 'survival' type — array of surviving agent IDs
    survivors: Mapped[list | None] = mapped_column(JSONB)

    # Voter tracking
    user_id: Mapped[UUID | None] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="SET NULL"),
    )
    ip_hash: Mapped[str | None] = mapped_column(String(64))

    # Optional rationale
    rationale: Mapped[str | None] = mapped_column(Text)

    # Timestamps
    created_at: Mapped[datetime] = mapped_column(
        DateTime, server_default=func.now(), nullable=False
    )

    __table_args__ = (
        Index("votes_bout_id_idx", "bout_id"),
        Index("votes_bout_created_idx", "bout_id", "created_at"),
    )

    def to_dict(self) -> dict:
        """Convert to dictionary."""
        return {
            "id": str(self.id),
            "bout_id": str(self.bout_id),
            "vote_type": self.vote_type.value,
            "winner_agent_id": str(self.winner_agent_id) if self.winner_agent_id else None,
            "ranking": self.ranking,
            "survivors": self.survivors,
            "user_id": str(self.user_id) if self.user_id else None,
            "rationale": self.rationale,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }
