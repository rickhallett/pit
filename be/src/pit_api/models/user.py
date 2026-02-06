"""User model with attribution tracking."""

import enum
from datetime import datetime
from uuid import uuid4

from sqlalchemy import Boolean, DateTime, Enum, Index, String, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column

from .base import Base


class UserTier(enum.Enum):
    """User access tier."""

    FREE = "free"
    PREMIUM = "premium"


class AcquisitionSource(enum.Enum):
    """Attribution source buckets."""

    ORGANIC = "organic"
    HN = "hn"
    REDDIT = "reddit"
    TWITTER = "twitter"
    PRODUCTHUNT = "producthunt"
    EMAIL = "email"
    PODCAST = "podcast"
    REFERRAL = "referral"
    DIRECT = "direct"
    OTHER = "other"


class User(Base):
    """User account with attribution tracking."""

    __tablename__ = "users"

    id: Mapped[UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid4
    )

    # Auth provider fields (nullable for anonymous users)
    auth_provider_id: Mapped[str | None] = mapped_column(String(255))
    auth_provider: Mapped[str | None] = mapped_column(String(50))  # 'magic_link', 'google', etc.

    # Profile
    display_name: Mapped[str | None] = mapped_column(String(100))
    email: Mapped[str | None] = mapped_column(String(255))
    avatar_url: Mapped[str | None] = mapped_column(String(500))

    # Anonymous user tracking
    is_anonymous: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    anon_session_id: Mapped[str | None] = mapped_column(String(64))

    # Access control
    tier: Mapped[UserTier] = mapped_column(
        Enum(UserTier), default=UserTier.FREE, nullable=False
    )

    # Attribution tracking
    acquisition_source: Mapped[AcquisitionSource] = mapped_column(
        Enum(AcquisitionSource), default=AcquisitionSource.ORGANIC, nullable=False
    )
    acquisition_detail: Mapped[str | None] = mapped_column(String(100))
    referrer_bout_id: Mapped[UUID | None] = mapped_column(UUID(as_uuid=True))
    utm_source: Mapped[str | None] = mapped_column(String(100))
    utm_medium: Mapped[str | None] = mapped_column(String(100))
    utm_campaign: Mapped[str | None] = mapped_column(String(100))

    # Timestamps
    created_at: Mapped[datetime] = mapped_column(
        DateTime, server_default=func.now(), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, server_default=func.now(), onupdate=func.now(), nullable=False
    )
    last_seen_at: Mapped[datetime | None] = mapped_column(DateTime)

    __table_args__ = (
        Index("users_auth_provider_idx", "auth_provider", "auth_provider_id"),
        Index("users_email_idx", "email"),
        Index("users_anon_session_idx", "anon_session_id"),
        Index("users_acquisition_source_idx", "acquisition_source"),
    )
