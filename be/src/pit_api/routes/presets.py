"""Presets API — list available bout presets."""

from flask import Blueprint, jsonify

from pit_api.store import preset_loader

presets_bp = Blueprint("presets", __name__, url_prefix="/api")


@presets_bp.route("/presets", methods=["GET"])
def list_presets():
    """List all available presets."""
    presets = preset_loader.load_all()
    return jsonify(
        {
            "presets": [
                {
                    "id": p.id,
                    "name": p.name,
                    "premise": p.premise,
                    "tone": p.tone,
                    "agent_count": len(p.agents),
                    "featured": p.featured,
                    "user_input": p.user_input,
                }
                for p in presets
            ]
        }
    )


@presets_bp.route("/presets/<preset_id>", methods=["GET"])
def get_preset(preset_id: str):
    """Get a specific preset by ID."""
    preset = preset_loader.load_one(preset_id)
    if not preset:
        return jsonify({"error": "Preset not found"}), 404

    return jsonify(
        {
            "id": preset.id,
            "name": preset.name,
            "premise": preset.premise,
            "tone": preset.tone,
            "agents": [{"name": a.name, "role": a.role} for a in preset.agents],
            "featured": preset.featured,
            "user_input": preset.user_input,
        }
    )
