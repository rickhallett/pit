"""JWT token management for session auth."""

from datetime import datetime, timedelta, timezone
from typing import Any
from uuid import UUID

import jwt

from pit_api.config import config

# Token settings
TOKEN_EXPIRY_HOURS = 24
ALGORITHM = "HS256"


def create_session_token(user_id: UUID, email: str) -> str:
    """Create a JWT session token.

    Args:
        user_id: User UUID
        email: User email

    Returns:
        Encoded JWT string
    """
    now = datetime.now(timezone.utc)
    payload = {
        "sub": str(user_id),
        "email": email,
        "iat": now,
        "exp": now + timedelta(hours=TOKEN_EXPIRY_HOURS),
        "iss": "thepit.cloud",
    }
    return jwt.encode(payload, config.JWT_SECRET, algorithm=ALGORITHM)


def verify_session_token(token: str) -> dict[str, Any] | None:
    """Verify and decode a JWT session token.

    Args:
        token: Encoded JWT string

    Returns:
        Decoded payload dict, or None if invalid/expired
    """
    try:
        payload = jwt.decode(
            token,
            config.JWT_SECRET,
            algorithms=[ALGORITHM],
            issuer="thepit.cloud",
        )
        return payload
    except jwt.ExpiredSignatureError:
        return None
    except jwt.InvalidTokenError:
        return None


def get_user_id_from_token(token: str) -> UUID | None:
    """Extract user ID from token.

    Args:
        token: Encoded JWT string

    Returns:
        User UUID, or None if invalid
    """
    payload = verify_session_token(token)
    if not payload:
        return None

    try:
        return UUID(payload["sub"])
    except (KeyError, ValueError):
        return None
