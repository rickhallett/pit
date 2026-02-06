"""Voting API — cast and retrieve votes on bouts."""

from flask import Blueprint, g, jsonify, request

from pit_api.middleware import optional_auth, require_auth
from pit_api.models import Bout, Vote, VoteType
from pit_api.models.base import SessionLocal
from pit_api.utils import hash_ip

vote_bp = Blueprint("vote", __name__, url_prefix="/api")


@vote_bp.route("/bout/<bout_id>/vote", methods=["POST"])
@require_auth
def cast_vote(bout_id: str):
    """Cast a vote on a bout.

    Requires authentication.

    Body:
        vote_type: str — "winner" | "ranking" | "survival"
        winner_agent_id: str (optional) — for winner votes
        ranking: list[str] (optional) — for ranking votes
        survivors: list[str] (optional) — for survival votes
        rationale: str (optional) — why this vote

    Returns:
        201 with vote data on success
        400 on invalid vote
        403 if user already voted on this bout
        404 if bout not found
    """
    user = g.current_user
    data = request.get_json() or {}

    vote_type_str = data.get("vote_type", "winner")
    winner_agent_id = data.get("winner_agent_id")
    ranking = data.get("ranking")
    survivors = data.get("survivors")
    rationale = data.get("rationale")

    # Validate vote type
    try:
        vote_type = VoteType(vote_type_str)
    except ValueError:
        return jsonify({"error": f"Invalid vote_type: {vote_type_str}"}), 400

    # Validate required fields for each vote type
    if vote_type == VoteType.WINNER and not winner_agent_id:
        return jsonify({"error": "winner_agent_id required for winner votes"}), 400
    if vote_type == VoteType.RANKING and not ranking:
        return jsonify({"error": "ranking required for ranking votes"}), 400
    if vote_type == VoteType.SURVIVAL and not survivors:
        return jsonify({"error": "survivors required for survival votes"}), 400

    db = SessionLocal()
    try:
        # Check bout exists and is in voting state
        bout = db.query(Bout).filter(Bout.id == bout_id).first()
        if not bout:
            return jsonify({"error": "Bout not found"}), 404

        if bout.status != "voting" and bout.status != "complete":
            return jsonify({
                "error": "Cannot vote on this bout",
                "status": bout.status,
            }), 400

        # Check if user already voted
        existing_vote = (
            db.query(Vote)
            .filter(Vote.bout_id == bout_id, Vote.user_id == user.id)
            .first()
        )
        if existing_vote:
            return jsonify({"error": "You have already voted on this bout"}), 403

        # Create vote
        vote = Vote(
            bout_id=bout_id,
            vote_type=vote_type,
            winner_agent_id=winner_agent_id if vote_type == VoteType.WINNER else None,
            ranking=ranking if vote_type == VoteType.RANKING else None,
            survivors=survivors if vote_type == VoteType.SURVIVAL else None,
            user_id=user.id,
            ip_hash=hash_ip(request.remote_addr),
            rationale=rationale,
        )
        db.add(vote)
        db.commit()

        return jsonify(vote.to_dict()), 201

    finally:
        db.close()


@vote_bp.route("/bout/<bout_id>/votes", methods=["GET"])
@optional_auth
def get_votes(bout_id: str):
    """Get votes for a bout.

    Public endpoint, but returns more detail for authenticated users.

    Returns:
        200 with vote summary and list
        404 if bout not found
    """
    db = SessionLocal()
    try:
        bout = db.query(Bout).filter(Bout.id == bout_id).first()
        if not bout:
            return jsonify({"error": "Bout not found"}), 404

        votes = db.query(Vote).filter(Vote.bout_id == bout_id).all()

        # Build vote summary
        total_votes = len(votes)
        winner_counts: dict[str, int] = {}
        for vote in votes:
            if vote.vote_type == VoteType.WINNER and vote.winner_agent_id:
                agent_id = str(vote.winner_agent_id)
                winner_counts[agent_id] = winner_counts.get(agent_id, 0) + 1

        # Check if current user has voted
        user_vote = None
        if g.current_user:
            for vote in votes:
                if vote.user_id == g.current_user.id:
                    user_vote = vote.to_dict()
                    break

        return jsonify({
            "total_votes": total_votes,
            "winner_counts": winner_counts,
            "user_vote": user_vote,
            "votes": [v.to_dict() for v in votes] if total_votes < 100 else None,
        }), 200

    finally:
        db.close()
