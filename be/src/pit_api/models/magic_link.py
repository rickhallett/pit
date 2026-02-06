"""Magic link tokens for passwordless auth."""

from datetime import datetime, timedelta, timezone
from uuid import uuid4

from sqlalchemy import Boolean, DateTime, ForeignKey, String, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column

from .base import Base

# Token validity period
TOKEN_EXPIRY_HOURS = 1


class MagicLink(Base):
    """Magic link token for email authentication."""

    __tablename__ = "magic_links"

    id: Mapped[UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid4
    )

    # Token (URL-safe, unique)
    token: Mapped[str] = mapped_column(String(64), unique=True, nullable=False, index=True)

    # Target email
    email: Mapped[str] = mapped_column(String(255), nullable=False, index=True)

    # Link to user (nullable — user may not exist yet)
    user_id: Mapped[UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE")
    )

    # State
    is_used: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)

    # Timestamps
    created_at: Mapped[datetime] = mapped_column(
        DateTime, server_default=func.now(), nullable=False
    )
    expires_at: Mapped[datetime] = mapped_column(DateTime, nullable=False)
    used_at: Mapped[datetime | None] = mapped_column(DateTime)

    @property
    def is_expired(self) -> bool:
        """Check if the token has expired."""
        return datetime.now(timezone.utc) > self.expires_at.replace(tzinfo=timezone.utc)

    @property
    def is_valid(self) -> bool:
        """Check if the token is valid (not used and not expired)."""
        return not self.is_used and not self.is_expired

    @classmethod
    def generate_expiry(cls) -> datetime:
        """Generate expiry timestamp."""
        return datetime.now(timezone.utc) + timedelta(hours=TOKEN_EXPIRY_HOURS)
