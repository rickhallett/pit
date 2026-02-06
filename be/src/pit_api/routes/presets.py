"""Presets API — list available bout presets."""

from fastapi import APIRouter, HTTPException

from pit_api.store import preset_loader

presets_router = APIRouter(prefix="/api", tags=["presets"])


@presets_router.get("/presets")
async def list_presets():
    """List all available presets."""
    presets = preset_loader.load_all()
    return {
        "presets": [
            {
                "id": p.id,
                "name": p.name,
                "description": p.description,
                "category": p.category,
                "agent_count": p.agent_count,
                "featured": p.featured,
                "sort_order": p.sort_order,
                "requires_input": p.requires_input,
                "input_label": p.input_label,
                "agents": [{"name": a.name, "avatar": a.avatar} for a in p.agents],
                # Legacy fields for compatibility
                "premise": p.premise,
                "tone": p.tone,
                "user_input": p.user_input,
            }
            for p in presets
        ],
        "categories": preset_loader.get_categories(),
    }


@presets_router.get("/presets/{preset_id}")
async def get_preset(preset_id: str):
    """Get a specific preset by ID."""
    preset = preset_loader.load_one(preset_id)
    if not preset:
        raise HTTPException(status_code=404, detail="Preset not found")

    return {
        "id": preset.id,
        "name": preset.name,
        "description": preset.description,
        "category": preset.category,
        "agent_count": preset.agent_count,
        "featured": preset.featured,
        "sort_order": preset.sort_order,
        "turn_pattern": preset.turn_pattern,
        "max_turns": preset.max_turns,
        "requires_input": preset.requires_input,
        "input_label": preset.input_label,
        "launch_day_hero": preset.launch_day_hero,
        "agents": [
            {
                "id": a.id,
                "name": a.name,
                "role": a.role,
                "avatar": a.avatar,
                "color": a.color,
            }
            for a in preset.agents
        ],
        # Legacy fields for compatibility
        "premise": preset.premise,
        "tone": preset.tone,
        "user_input": preset.user_input,
    }
