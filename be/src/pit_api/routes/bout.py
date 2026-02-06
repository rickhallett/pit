"""Bout API — create, run, and stream bouts."""

import json

from flask import Blueprint, Response, jsonify, request

from pit_api.engine import AgentConfig, BoutConfig, Orchestrator, OrchestratorEvents, ShareGenerator
from pit_api.models import Bout, Message, Metric
from pit_api.models.base import SessionLocal
from pit_api.store import preset_loader
from pit_api.utils import check_rate_limit, hash_ip

bout_bp = Blueprint("bout", __name__, url_prefix="/api")


@bout_bp.route("/bout", methods=["POST"])
def create_bout():
    """Create and start a new bout."""
    data = request.get_json() or {}
    preset_id = data.get("preset_id")
    topic = data.get("topic")
    model_tier = data.get("model_tier", "standard")

    if not preset_id:
        return jsonify({"error": "preset_id is required"}), 400

    # Load preset
    preset = preset_loader.load_one(preset_id)
    if not preset:
        return jsonify({"error": f"Unknown preset: {preset_id}"}), 400

    # Rate limiting
    ip_hash = hash_ip(request.remote_addr)
    db = SessionLocal()

    try:
        if not check_rate_limit(db, ip_hash):
            Metric.log(db, "rate_limit_hit", ip_hash=ip_hash)
            return jsonify(
                {
                    "error": "Rate limit exceeded",
                    "message": "You've had your share for now. Come back later.",
                }
            ), 429

        # Create agents from preset
        agents = [
            AgentConfig(id=a.id, name=a.name, role=a.role, system_prompt=a.system_prompt)
            for a in preset.agents
        ]

        # If topic provided, inject into system prompts
        if topic and preset.user_input:
            for agent in agents:
                agent.system_prompt = agent.system_prompt.replace("{topic}", topic)

        # Create and run bout
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

        return jsonify(
            {
                "bout_id": bout.id,
                "status": bout.status,
                "stream_url": f"/api/bout/{bout.id}/stream",
                "agents": [{"name": a.name, "role": a.role} for a in preset.agents],
            }
        ), 201

    finally:
        db.close()


@bout_bp.route("/bout/<bout_id>", methods=["GET"])
def get_bout(bout_id: str):
    """Get bout status and transcript."""
    db = SessionLocal()
    try:
        bout = db.query(Bout).filter(Bout.id == bout_id).first()
        if not bout:
            return jsonify({"error": "Bout not found"}), 404

        messages = (
            db.query(Message).filter(Message.bout_id == bout_id).order_by(Message.turn_number).all()
        )

        result = bout.to_dict()
        result["messages"] = [m.to_dict() for m in messages]
        return jsonify(result)

    finally:
        db.close()


@bout_bp.route("/bout/<bout_id>/stream", methods=["GET"])
def stream_bout(bout_id: str):
    """
    Stream bout events via Server-Sent Events.

    Event types:
    - turn_start: {agent_name, turn_number}
    - token: {token}
    - turn_end: {agent_name, turn_number, message_id}
    - bout_complete: {bout_id, total_cost}
    - error: {code, message}
    """
    # Pre-validation with a separate session (closed before generator)
    db_check = SessionLocal()
    try:
        bout = db_check.query(Bout).filter(Bout.id == bout_id).first()
        if not bout:
            return jsonify({"error": "Bout not found"}), 404

        if bout.status != "pending":
            return jsonify(
                {"error": "Bout already started or completed", "status": bout.status}
            ), 400

        bout_id_validated = bout.id
        preset_id = bout.preset_id
        topic = bout.topic
    finally:
        db_check.close()

    # Load preset (no DB needed)
    preset = preset_loader.load_one(preset_id)
    if not preset:
        return jsonify({"error": "Preset not found"}), 500

    agents = [
        AgentConfig(name=a.name, role=a.role, system_prompt=a.system_prompt) for a in preset.agents
    ]

    # Inject topic if present
    if topic:
        for agent in agents:
            agent.system_prompt = agent.system_prompt.replace("{topic}", topic)

    def generate():
        """SSE generator for streaming bout events.

        DB session is created and managed inside the generator to ensure
        it stays open for the duration of the streaming response.
        """
        db = SessionLocal()
        try:
            # Re-fetch bout in generator's session
            bout = db.query(Bout).filter(Bout.id == bout_id_validated).first()
            if not bout:
                yield f"event: error\ndata: {json.dumps({'code': 'NOT_FOUND', 'message': 'Bout not found'})}\n\n"
                return

            events_queue = []

            def on_turn_start(bid, name, turn):
                events_queue.append(("turn_start", {"agent_name": name, "turn_number": turn}))

            def on_turn_end(bid, name, turn, msg_id):
                events_queue.append(
                    (
                        "turn_end",
                        {"agent_name": name, "turn_number": turn, "message_id": msg_id},
                    )
                )

            def on_complete(bid, cost):
                events_queue.append(("bout_complete", {"bout_id": bid, "total_cost": cost}))

            def on_error(bid, msg):
                events_queue.append(("error", {"code": "BOUT_ERROR", "message": msg}))

            events = OrchestratorEvents(
                on_turn_start=on_turn_start,
                on_turn_end=on_turn_end,
                on_bout_complete=on_complete,
                on_error=on_error,
            )

            # Run the bout (blocking)
            orchestrator = Orchestrator(db, events)
            try:
                orchestrator.run(bout, agents)
            except Exception as e:
                events_queue.append(("error", {"code": "FATAL", "message": str(e)}))

            # Yield all events
            for event_type, data in events_queue:
                yield f"event: {event_type}\ndata: {json.dumps(data)}\n\n"
        finally:
            db.close()

    return Response(
        generate(),
        mimetype="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
        },
    )


@bout_bp.route("/bout/<bout_id>/share", methods=["GET"])
def get_share_text(bout_id: str):
    """Generate share text for a completed bout."""
    db = SessionLocal()
    try:
        bout = db.query(Bout).filter(Bout.id == bout_id).first()
        if not bout:
            return jsonify({"error": "Bout not found"}), 404

        if bout.status != "complete":
            return jsonify({"error": "Bout not complete"}), 400

        messages = (
            db.query(Message).filter(Message.bout_id == bout_id).order_by(Message.turn_number).all()
        )

        generator = ShareGenerator()
        share = generator.generate(bout, messages)

        Metric.log(db, "share_generated", bout_id=bout_id)

        return jsonify(
            {
                "text": share.text,
                "permalink": share.permalink,
            }
        )

    finally:
        db.close()
