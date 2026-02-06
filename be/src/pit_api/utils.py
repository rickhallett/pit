"""Utility functions."""

import hashlib
from datetime import datetime, timedelta

from sqlalchemy.orm import Session

from pit_api.config import config


def hash_ip(ip: str | None) -> str | None:
    """Hash an IP address for privacy-preserving rate limiting."""
    if not ip:
        return None
    return hashlib.sha256(ip.encode()).hexdigest()


def check_rate_limit(db: Session, ip_hash: str | None) -> bool:
    """
    Check if an IP is within rate limits.

    Returns True if allowed, False if rate limited.
    """
    if not ip_hash:
        return True  # Can't rate limit without IP

    from pit_api.models import Bout

    window_start = datetime.utcnow() - timedelta(seconds=config.RATE_LIMIT_WINDOW_SECONDS)

    recent_bouts = (
        db.query(Bout)
        .filter(Bout.ip_hash == ip_hash)
        .filter(Bout.created_at >= window_start)
        .count()
    )

    return recent_bouts < config.RATE_LIMIT_BOUTS_PER_HOUR
