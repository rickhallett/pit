"""Bout API — create, run, and stream bouts."""

import asyncio
import json
import re
from typing import AsyncGenerator, Optional

from fastapi import APIRouter, HTTPException, Request
from fastapi.responses import StreamingResponse
from pydantic import BaseModel, Field, field_validator

from pit_api.engine import AgentConfig, BoutConfig, Orchestrator, OrchestratorEvents, ShareGenerator
from pit_api.models import Bout, Message, Metric
from pit_api.models.base import SessionLocal
from pit_api.store import preset_loader
from pit_api.utils import check_rate_limit, hash_ip

bout_router = APIRouter(prefix="/api", tags=["bout"])

# Validation constants (mirror frontend)
MAX_TOPIC_CODEPOINTS = 280
MAX_TOPIC_BYTES = 1024


def sanitize_topic(topic: str) -> str:
    """
    Sanitize topic input (mirrors frontend sanitization).
    - Strip script/style tags WITH their contents
    - Strip remaining HTML tags
    - Strip control characters
    - Collapse whitespace
    """
    if not topic:
        return topic
    # Strip script tags with contents
    result = re.sub(r"<script\b[^<]*(?:(?!</script>)<[^<]*)*</script>", "", topic, flags=re.IGNORECASE)
    # Strip style tags with contents
    result = re.sub(r"<style\b[^<]*(?:(?!</style>)<[^<]*)*</style>", "", result, flags=re.IGNORECASE)
    # Strip remaining HTML tags
    result = re.sub(r"<[^>]*>", "", result)
    # Strip control characters (ASCII 0-31)
    result = re.sub(r"[\x00-\x1f]", "", result)
    # Collapse whitespace and trim
    result = re.sub(r"\s+", " ", result).strip()
    return result


class CreateBoutRequest(BaseModel):
    preset_id: str
    topic: Optional[str] = Field(None, max_length=MAX_TOPIC_BYTES)  # Byte backstop
    model_tier: Optional[str] = "standard"

    @field_validator("topic")
    @classmethod
    def validate_topic(cls, v: Optional[str]) -> Optional[str]:
        if v is None:
            return v
        # Sanitize first
        sanitized = sanitize_topic(v)
        # Check codepoint limit
        if len(sanitized) > MAX_TOPIC_CODEPOINTS:
            raise ValueError(f"Topic must be {MAX_TOPIC_CODEPOINTS} characters or less")
        # Check byte limit (defense in depth)
        if len(sanitized.encode("utf-8")) > MAX_TOPIC_BYTES:
            raise ValueError("Topic is too long")
        return sanitized


@bout_router.post("/bout", status_code=201)
async def create_bout(request: Request, body: CreateBoutRequest):
    """Create and start a new bout."""
    preset_id = body.preset_id
    topic = body.topic
    model_tier = body.model_tier

    # Load preset
    preset = preset_loader.load_one(preset_id)
    if not preset:
        raise HTTPException(status_code=400, detail=f"Unknown preset: {preset_id}")

    # Rate limiting (bypass for localhost/dev)
    client_ip = request.client.host if request.client else "unknown"
    is_localhost = client_ip in ("127.0.0.1", "::1", "localhost")
    ip_hash = hash_ip(client_ip)
    db = SessionLocal()

    try:
        if not is_localhost and not check_rate_limit(db, ip_hash):
            Metric.log(db, "rate_limit_hit", ip_hash=ip_hash)
            raise HTTPException(
                status_code=429,
                detail={
                    "error": "Rate limit exceeded",
                    "message": "You've had your share for now. Come back later.",
                },
            )

        # Create agents from preset
        agents = [
            AgentConfig(id=a.id, name=a.name, role=a.role, system_prompt=a.system_prompt)
            for a in preset.agents
        ]

        # If topic provided, inject into system prompts
        if topic and preset.user_input:
            for agent in agents:
                agent.system_prompt = agent.system_prompt.replace("{topic}", topic)

        # Create bout
        orchestrator = Orchestrator(db)

        config = BoutConfig(
            preset_id=preset_id,
            agents=agents,
            model_tier=model_tier,
            topic=topic,
            ip_hash=ip_hash,
        )

        bout = orchestrator.create(config)
        Metric.log(db, "bout_start", bout_id=bout.id, ip_hash=ip_hash)

        return {
            "bout_id": bout.id,
            "status": bout.status,
            "stream_url": f"/api/bout/{bout.id}/stream",
            "agents": [{"name": a.name, "role": a.role} for a in preset.agents],
        }

    finally:
        db.close()


@bout_router.get("/bout/{bout_id}")
async def get_bout(bout_id: str):
    """Get bout status and transcript."""
    db = SessionLocal()
    try:
        bout = db.query(Bout).filter(Bout.id == bout_id).first()
        if not bout:
            raise HTTPException(status_code=404, detail="Bout not found")

        messages = (
            db.query(Message).filter(Message.bout_id == bout_id).order_by(Message.turn_number).all()
        )

        result = bout.to_dict()
        result["messages"] = [m.to_dict() for m in messages]
        return result

    finally:
        db.close()


@bout_router.get("/bout/{bout_id}/stream")
async def stream_bout(bout_id: str):
    """
    Stream bout events via Server-Sent Events.

    Event types:
    - turn_start: {agent_name, turn_number}
    - token: {token}
    - turn_end: {agent_name, turn_number, message_id}
    - bout_complete: {bout_id, total_cost}
    - error: {code, message}
    """
    # Pre-validation with a separate session
    db_check = SessionLocal()
    try:
        bout = db_check.query(Bout).filter(Bout.id == bout_id).first()
        if not bout:
            raise HTTPException(status_code=404, detail="Bout not found")

        if bout.status != "pending":
            raise HTTPException(
                status_code=400,
                detail={"error": "Bout already started or completed", "status": bout.status},
            )

        bout_id_validated = bout.id
        preset_id = bout.preset_id
        topic = bout.topic
    finally:
        db_check.close()

    # Load preset
    preset = preset_loader.load_one(preset_id)
    if not preset:
        raise HTTPException(status_code=500, detail="Preset not found")

    agents = [
        AgentConfig(name=a.name, role=a.role, system_prompt=a.system_prompt) for a in preset.agents
    ]

    # Inject topic if present
    if topic:
        for agent in agents:
            agent.system_prompt = agent.system_prompt.replace("{topic}", topic)

    async def event_generator() -> AsyncGenerator[str, None]:
        """Async SSE generator for streaming bout events.

        Note: Currently runs the bout synchronously and yields all events at the end.
        TODO: For true real-time streaming, convert Orchestrator to async.
        CRITIC:DEBT — Sync orchestrator blocks event loop. Priority: post-MVP.
        """
        db = SessionLocal()
        try:
            # Re-fetch bout in generator's session
            bout = db.query(Bout).filter(Bout.id == bout_id_validated).first()
            if not bout:
                yield f"event: error\ndata: {json.dumps({'code': 'NOT_FOUND', 'message': 'Bout not found'})}\n\n"
                return

            # Collect events synchronously
            events_list: list[tuple[str, dict]] = []

            def on_turn_start(bid, name, turn):
                events_list.append(("turn_start", {"agent_name": name, "turn_number": turn}))

            def on_turn_end(bid, name, turn, msg_id):
                events_list.append(
                    ("turn_end", {"agent_name": name, "turn_number": turn, "message_id": msg_id})
                )

            def on_complete(bid, cost):
                Metric.log(db, "bout_complete", bout_id=bid, payload={"total_cost": cost})
                events_list.append(("bout_complete", {"bout_id": bid, "total_cost": cost}))

            def on_error(bid, msg):
                events_list.append(("error", {"code": "BOUT_ERROR", "message": msg}))

            events = OrchestratorEvents(
                on_turn_start=on_turn_start,
                on_turn_end=on_turn_end,
                on_bout_complete=on_complete,
                on_error=on_error,
            )

            # Run the bout in a thread to avoid blocking the event loop
            # (Orchestrator is sync; this allows event loop to stay responsive)
            orchestrator = Orchestrator(db, events)
            try:
                await asyncio.to_thread(orchestrator.run, bout, agents)
            except Exception as e:
                events_list.append(("error", {"code": "FATAL", "message": str(e)}))

            # Yield all events
            for event_type, data in events_list:
                yield f"event: {event_type}\ndata: {json.dumps(data)}\n\n"
                # Small delay to allow client to process
                await asyncio.sleep(0.01)

        finally:
            db.close()

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",  # Disable nginx buffering
        },
    )


@bout_router.get("/bout/{bout_id}/share")
async def get_bout_share(bout_id: str):
    """Generate share text for a completed bout."""
    db = SessionLocal()
    try:
        bout = db.query(Bout).filter(Bout.id == bout_id).first()
        if not bout:
            raise HTTPException(status_code=404, detail="Bout not found")

        if bout.status != "complete":
            raise HTTPException(status_code=400, detail="Bout not complete")

        messages = (
            db.query(Message).filter(Message.bout_id == bout_id).order_by(Message.turn_number).all()
        )

        generator = ShareGenerator()
        share = generator.generate(bout, messages)

        Metric.log(db, "share_generated", bout_id=bout_id)

        return {
            "text": share.text,
            "permalink": share.permalink,
        }

    finally:
        db.close()
