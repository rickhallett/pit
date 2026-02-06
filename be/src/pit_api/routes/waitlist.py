"""Waitlist API — email capture."""

import re
from typing import Optional

from fastapi import APIRouter, HTTPException, Request
from pydantic import BaseModel
from sqlalchemy.exc import IntegrityError

from pit_api.models import Metric, Waitlist
from pit_api.models.base import SessionLocal
from pit_api.utils import hash_ip

waitlist_router = APIRouter(prefix="/api", tags=["waitlist"])

EMAIL_REGEX = re.compile(r"^[^@]+@[^@]+\.[^@]+$")


class WaitlistRequest(BaseModel):
    email: str
    source: Optional[str] = "landing"


@waitlist_router.post("/waitlist", status_code=201)
async def add_to_waitlist(request: Request, body: WaitlistRequest):
    """Add an email to the waitlist."""
    email = body.email.strip().lower()
    source = body.source

    # Validate email
    if not email or not EMAIL_REGEX.match(email):
        raise HTTPException(status_code=400, detail="Invalid email format")

    # Get IP hash
    client_ip = request.client.host if request.client else "unknown"
    ip_hash = hash_ip(client_ip)

    # Insert
    db = SessionLocal()
    try:
        entry = Waitlist(email=email, source=source, ip_hash=ip_hash)
        db.add(entry)
        db.commit()

        # Log metric
        Metric.log(db, "waitlist_signup", payload={"source": source}, ip_hash=ip_hash)

        return {"status": "success", "message": "You're in!"}

    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=409, detail="You're already on the list!")

    finally:
        db.close()
