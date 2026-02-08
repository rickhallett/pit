"""
Preset Configuration

Defines the 11 approved bout formats with their turn orchestration rules.

Turn Types:
- alternating: A ↔ B (2-bot ping-pong)
- round_robin: A → B → C → A... (rotating sequence)
- broadcast: Presenter → [Responders] → Presenter... (asymmetric)
"""

from dataclasses import dataclass
from enum import Enum
from typing import Optional, TypedDict


class TurnType(str, Enum):
    ALTERNATING = "alternating"
    ROUND_ROBIN = "round_robin"
    BROADCAST = "broadcast"


class PresetAgent(TypedDict):
    role: str
    description: str
    is_presenter: Optional[bool]


@dataclass
class PresetConfig:
    id: str
    name: str
    description: str
    agent_count: int
    turn_type: TurnType
    agents: list[PresetAgent]
    default_rounds: int
    free_tier: bool


# ============================================
# PRESET DEFINITIONS
# ============================================

PRESETS: dict[str, PresetConfig] = {
    # ALTERNATING (2-bot)
    "roast_battle": PresetConfig(
        id="roast_battle",
        name="Roast Battle",
        description="Two comedians trade insults in escalating rounds.",
        agent_count=2,
        turn_type=TurnType.ALTERNATING,
        agents=[
            {"role": "roaster_a", "description": "First comedian", "is_presenter": None},
            {"role": "roaster_b", "description": "Second comedian", "is_presenter": None},
        ],
        default_rounds=4,
        free_tier=True,
    ),

    "on_the_couch": PresetConfig(
        id="on_the_couch",
        name="On The Couch",
        description="Therapy session between analyst and patient.",
        agent_count=2,
        turn_type=TurnType.ALTERNATING,
        agents=[
            {"role": "therapist", "description": "The analyst", "is_presenter": None},
            {"role": "patient", "description": "The analysand", "is_presenter": None},
        ],
        default_rounds=6,
        free_tier=True,
    ),

    "gloves_off": PresetConfig(
        id="gloves_off",
        name="Gloves Off",
        description="No-holds-barred debate between opposing viewpoints.",
        agent_count=2,
        turn_type=TurnType.ALTERNATING,
        agents=[
            {"role": "debater_a", "description": "First debater", "is_presenter": None},
            {"role": "debater_b", "description": "Second debater", "is_presenter": None},
        ],
        default_rounds=4,
        free_tier=True,
    ),

    # ROUND ROBIN (3-4 bot, equal participants)
    "darwin_special": PresetConfig(
        id="darwin_special",
        name="Darwin Special",
        description="Darwin observes and discusses specimens with fellow naturalists.",
        agent_count=3,
        turn_type=TurnType.ROUND_ROBIN,
        agents=[
            {"role": "darwin", "description": "Charles Darwin", "is_presenter": None},
            {"role": "naturalist_1", "description": "First naturalist", "is_presenter": None},
            {"role": "naturalist_2", "description": "Second naturalist", "is_presenter": None},
        ],
        default_rounds=4,
        free_tier=False,
    ),

    "first_contact": PresetConfig(
        id="first_contact",
        name="First Contact",
        description="Humanity meets alien intelligence for the first time.",
        agent_count=3,
        turn_type=TurnType.ROUND_ROBIN,
        agents=[
            {"role": "human", "description": "Human representative", "is_presenter": None},
            {"role": "alien_1", "description": "First alien entity", "is_presenter": None},
            {"role": "alien_2", "description": "Second alien entity", "is_presenter": None},
        ],
        default_rounds=4,
        free_tier=False,
    ),

    "writers_room": PresetConfig(
        id="writers_room",
        name="Writers Room",
        description="TV writers brainstorm and pitch ideas.",
        agent_count=3,
        turn_type=TurnType.ROUND_ROBIN,
        agents=[
            {"role": "writer_a", "description": "First writer", "is_presenter": None},
            {"role": "writer_b", "description": "Second writer", "is_presenter": None},
            {"role": "writer_c", "description": "Third writer", "is_presenter": None},
        ],
        default_rounds=4,
        free_tier=False,
    ),

    "the_flatshare": PresetConfig(
        id="the_flatshare",
        name="The Flatshare",
        description="Roommates navigate domestic drama and shared living.",
        agent_count=3,
        turn_type=TurnType.ROUND_ROBIN,
        agents=[
            {"role": "flatmate_a", "description": "First flatmate", "is_presenter": None},
            {"role": "flatmate_b", "description": "Second flatmate", "is_presenter": None},
            {"role": "flatmate_c", "description": "Third flatmate", "is_presenter": None},
        ],
        default_rounds=4,
        free_tier=False,
    ),

    "last_supper": PresetConfig(
        id="last_supper",
        name="Last Supper",
        description="Historical figures share a final meal and conversation.",
        agent_count=4,
        turn_type=TurnType.ROUND_ROBIN,
        agents=[
            {"role": "host", "description": "The host figure", "is_presenter": None},
            {"role": "guest_1", "description": "First guest", "is_presenter": None},
            {"role": "guest_2", "description": "Second guest", "is_presenter": None},
            {"role": "guest_3", "description": "Third guest", "is_presenter": None},
        ],
        default_rounds=4,
        free_tier=False,
    ),

    "the_mansion": PresetConfig(
        id="the_mansion",
        name="The Mansion",
        description="Murder mystery dinner party with secrets and accusations.",
        agent_count=4,
        turn_type=TurnType.ROUND_ROBIN,
        agents=[
            {"role": "host", "description": "The mansion host", "is_presenter": None},
            {"role": "guest_1", "description": "First guest", "is_presenter": None},
            {"role": "guest_2", "description": "Second guest", "is_presenter": None},
            {"role": "guest_3", "description": "Third guest", "is_presenter": None},
        ],
        default_rounds=4,
        free_tier=False,
    ),

    # BROADCAST (4-bot, asymmetric presenter)
    "shark_pit": PresetConfig(
        id="shark_pit",
        name="Shark Pit",
        description="Entrepreneur pitches to a panel of ruthless investors.",
        agent_count=4,
        turn_type=TurnType.BROADCAST,
        agents=[
            {"role": "pitcher", "description": "The entrepreneur", "is_presenter": True},
            {"role": "shark_1", "description": "First investor", "is_presenter": False},
            {"role": "shark_2", "description": "Second investor", "is_presenter": False},
            {"role": "shark_3", "description": "Third investor", "is_presenter": False},
        ],
        default_rounds=3,
        free_tier=False,
    ),

    "the_summit": PresetConfig(
        id="the_summit",
        name="The Summit",
        description="World leaders debate global policy with high stakes.",
        agent_count=4,
        turn_type=TurnType.BROADCAST,
        agents=[
            {"role": "proposer", "description": "The proposal author", "is_presenter": True},
            {"role": "delegate_1", "description": "First delegate", "is_presenter": False},
            {"role": "delegate_2", "description": "Second delegate", "is_presenter": False},
            {"role": "delegate_3", "description": "Third delegate", "is_presenter": False},
        ],
        default_rounds=4,
        free_tier=False,
    ),
}


# ============================================
# UTILITY FUNCTIONS
# ============================================

def get_preset(preset_id: str) -> PresetConfig | None:
    """Get preset config by ID."""
    return PRESETS.get(preset_id)


def get_free_tier_presets() -> list[PresetConfig]:
    """Get all presets available on free tier."""
    return [p for p in PRESETS.values() if p.free_tier]


def get_premium_presets() -> list[PresetConfig]:
    """Get all premium presets."""
    return [p for p in PRESETS.values() if not p.free_tier]


def get_presets_by_turn_type(turn_type: TurnType) -> list[PresetConfig]:
    """Get all presets with a specific turn type."""
    return [p for p in PRESETS.values() if p.turn_type == turn_type]
