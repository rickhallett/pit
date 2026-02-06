"""Authentication middleware for protected routes."""

from functools import wraps
from typing import Callable

from flask import g, jsonify, request

from pit_api.models.base import SessionLocal
from pit_api.models.user import User
from pit_api.services.jwt import get_user_id_from_token


def require_auth(f: Callable) -> Callable:
    """Decorator to require valid JWT auth for a route.

    Sets g.current_user to the authenticated User object.

    Usage:
        @app.route("/protected")
        @require_auth
        def protected_route():
            user = g.current_user
            ...
    """

    @wraps(f)
    def decorated(*args, **kwargs):
        # Extract token from Authorization header
        auth_header = request.headers.get("Authorization", "")

        if not auth_header.startswith("Bearer "):
            return jsonify({"error": "Missing or invalid Authorization header"}), 401

        token = auth_header[7:]  # Strip "Bearer "

        # Validate token and get user ID
        user_id = get_user_id_from_token(token)
        if not user_id:
            return jsonify({"error": "Invalid or expired token"}), 401

        # Fetch user from database
        db = SessionLocal()
        try:
            user = db.query(User).filter(User.id == user_id).first()
            if not user:
                return jsonify({"error": "User not found"}), 401

            # Attach user to request context
            g.current_user = user
            g.db = db

            return f(*args, **kwargs)
        finally:
            db.close()

    return decorated


def optional_auth(f: Callable) -> Callable:
    """Decorator for routes that work with or without auth.

    Sets g.current_user to User if authenticated, None otherwise.

    Usage:
        @app.route("/public-or-private")
        @optional_auth
        def route():
            if g.current_user:
                # Authenticated user
            else:
                # Anonymous access
    """

    @wraps(f)
    def decorated(*args, **kwargs):
        g.current_user = None
        g.db = None

        auth_header = request.headers.get("Authorization", "")

        if auth_header.startswith("Bearer "):
            token = auth_header[7:]
            user_id = get_user_id_from_token(token)

            if user_id:
                db = SessionLocal()
                try:
                    user = db.query(User).filter(User.id == user_id).first()
                    if user:
                        g.current_user = user
                        g.db = db
                except Exception:
                    db.close()

        return f(*args, **kwargs)

    return decorated
