"""Waitlist API — email capture."""

import re

from flask import Blueprint, jsonify, request
from sqlalchemy.exc import IntegrityError

from pit_api.models import Waitlist
from pit_api.models.base import SessionLocal
from pit_api.utils import hash_ip

waitlist_bp = Blueprint("waitlist", __name__, url_prefix="/api")

EMAIL_REGEX = re.compile(r"^[^@]+@[^@]+\.[^@]+$")


@waitlist_bp.route("/waitlist", methods=["POST"])
def add_to_waitlist():
    """Add an email to the waitlist."""
    data = request.get_json() or {}
    email = data.get("email", "").strip().lower()
    source = data.get("source", "landing")

    # Validate email
    if not email or not EMAIL_REGEX.match(email):
        return jsonify({"error": "Invalid email format"}), 400

    # Get IP hash
    ip_hash = hash_ip(request.remote_addr)

    # Insert
    db = SessionLocal()
    try:
        entry = Waitlist(email=email, source=source, ip_hash=ip_hash)
        db.add(entry)
        db.commit()
        return jsonify({"status": "success", "message": "You're in!"}), 201

    except IntegrityError:
        db.rollback()
        return jsonify({"status": "exists", "message": "You're already on the list!"}), 409

    finally:
        db.close()
