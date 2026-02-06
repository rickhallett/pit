"""Authentication routes — magic link flow."""

import secrets
from datetime import datetime, timezone

from flask import Blueprint, jsonify, request

from pit_api.config import config
from pit_api.middleware.auth import require_auth
from pit_api.models.base import SessionLocal
from pit_api.models.magic_link import MagicLink
from pit_api.models.user import AcquisitionSource, User
from pit_api.services.email import email_service
from pit_api.services.jwt import create_session_token

auth_bp = Blueprint("auth", __name__, url_prefix="/auth")


@auth_bp.route("/request", methods=["POST"])
def request_magic_link():
    """Request a magic link for the given email.

    Body:
        email: str — recipient email address

    Returns:
        200 with success message (always, to prevent email enumeration)
    """
    data = request.get_json() or {}
    email = data.get("email", "").strip().lower()

    if not email or "@" not in email:
        return jsonify({"error": "Valid email required"}), 400

    db = SessionLocal()
    try:
        # Generate secure token
        token = secrets.token_urlsafe(32)

        # Check if user exists
        existing_user = db.query(User).filter(User.email == email).first()

        # Create magic link
        magic_link = MagicLink(
            token=token,
            email=email,
            user_id=existing_user.id if existing_user else None,
            expires_at=MagicLink.generate_expiry(),
        )
        db.add(magic_link)
        db.commit()

        # Send email
        email_service.send_magic_link(email, token, config.FRONTEND_URL)

        # Always return success to prevent email enumeration
        return jsonify({"message": "If this email exists, a sign-in link has been sent."}), 200

    finally:
        db.close()


@auth_bp.route("/verify", methods=["POST"])
def verify_magic_link():
    """Verify a magic link token and create/authenticate user.

    Body:
        token: str — magic link token
        acquisition_source: str (optional) — attribution bucket
        acquisition_detail: str (optional) — granular attribution
        referrer_bout_id: str (optional) — viral loop attribution
        utm_source: str (optional)
        utm_medium: str (optional)
        utm_campaign: str (optional)

    Returns:
        200 with user data and session token on success
        400 on invalid/expired token
    """
    data = request.get_json() or {}
    token = data.get("token", "").strip()

    if not token:
        return jsonify({"error": "Token required"}), 400

    db = SessionLocal()
    try:
        # Find and validate token
        magic_link = db.query(MagicLink).filter(MagicLink.token == token).first()

        if not magic_link:
            return jsonify({"error": "Invalid token"}), 400

        if not magic_link.is_valid:
            return jsonify({"error": "Token expired or already used"}), 400

        # Mark token as used
        magic_link.is_used = True
        magic_link.used_at = datetime.now(timezone.utc)

        # Get or create user
        user = db.query(User).filter(User.email == magic_link.email).first()

        if user:
            # Existing user — update last seen
            user.last_seen_at = datetime.now(timezone.utc)
        else:
            # New user — create with attribution
            acquisition_source = _parse_acquisition_source(data.get("acquisition_source"))

            user = User(
                email=magic_link.email,
                auth_provider="magic_link",
                is_anonymous=False,
                acquisition_source=acquisition_source,
                acquisition_detail=data.get("acquisition_detail"),
                referrer_bout_id=_parse_uuid(data.get("referrer_bout_id")),
                utm_source=data.get("utm_source"),
                utm_medium=data.get("utm_medium"),
                utm_campaign=data.get("utm_campaign"),
                last_seen_at=datetime.now(timezone.utc),
            )
            db.add(user)

        db.commit()

        # Generate JWT session token (24h expiry, stateless)
        session_token = create_session_token(user.id, user.email)

        return jsonify({
            "user": {
                "id": str(user.id),
                "email": user.email,
                "display_name": user.display_name,
                "tier": user.tier.value,
            },
            "token": session_token,
            "expires_in": 86400,  # 24 hours in seconds
        }), 200

    finally:
        db.close()


def _parse_acquisition_source(value: str | None) -> AcquisitionSource:
    """Parse acquisition source string to enum, with fallback."""
    if not value:
        return AcquisitionSource.ORGANIC

    try:
        return AcquisitionSource(value.lower())
    except ValueError:
        return AcquisitionSource.OTHER


def _parse_uuid(value: str | None):
    """Parse UUID string, returning None on invalid."""
    if not value:
        return None

    try:
        from uuid import UUID
        return UUID(value)
    except ValueError:
        return None


@auth_bp.route("/me", methods=["GET"])
@require_auth
def get_current_user():
    """Get the current authenticated user.

    Headers:
        Authorization: Bearer <token>

    Returns:
        200 with user data
        401 if not authenticated
    """
    from flask import g

    user = g.current_user
    return jsonify({
        "user": {
            "id": str(user.id),
            "email": user.email,
            "display_name": user.display_name,
            "tier": user.tier.value,
            "created_at": user.created_at.isoformat() if user.created_at else None,
        }
    }), 200
