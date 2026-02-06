"""Preset loader for The Pit.

Loads preset configurations from config/presets.json.
"""

import json
from dataclasses import dataclass
from pathlib import Path
from typing import TypedDict


class AgentDict(TypedDict):
    """Agent configuration from preset."""
    agent_id: str
    name: str
    color: str
    avatar: str
    system_prompt: str


class MaxTurnsDict(TypedDict):
    """Turn limits by tier."""
    standard: int
    juiced: int
    unleashed: int


class PresetDict(TypedDict, total=False):
    """Preset configuration."""
    preset_id: str
    name: str
    description: str
    category: str
    agent_count: int
    featured: bool
    launch_day_hero: bool
    requires_input: bool
    input_label: str
    turnPattern: str
    max_turns: MaxTurnsDict
    agents: list[AgentDict]


@dataclass
class PresetLoader:
    """Loads and caches preset configurations."""

    _presets: dict[str, PresetDict] | None = None
    _config_path: Path | None = None

    def __init__(self, config_path: Path | None = None):
        """Initialize loader with optional config path."""
        if config_path is None:
            # Default: relative to repo root
            config_path = Path(__file__).parent.parent.parent.parent / "config" / "presets.json"
        self._config_path = config_path
        self._presets = None

    def _load(self) -> dict[str, PresetDict]:
        """Load presets from JSON file."""
        if self._presets is None:
            with open(self._config_path) as f:
                data = json.load(f)
            self._presets = {p["preset_id"]: p for p in data["presets"]}
        return self._presets

    def get(self, preset_id: str) -> PresetDict | None:
        """Get a preset by ID."""
        return self._load().get(preset_id)

    def get_all(self) -> list[PresetDict]:
        """Get all presets."""
        return list(self._load().values())

    def get_featured(self) -> list[PresetDict]:
        """Get featured presets."""
        return [p for p in self._load().values() if p.get("featured")]

    def get_launch_hero(self) -> PresetDict | None:
        """Get the launch day hero preset."""
        for p in self._load().values():
            if p.get("launch_day_hero"):
                return p
        return None

    def get_max_turns(self, preset_id: str, tier: str = "standard") -> int:
        """Get max turns for a preset and tier."""
        preset = self.get(preset_id)
        if preset is None:
            return 12  # Default fallback
        max_turns = preset.get("max_turns", {})
        return max_turns.get(tier, 12)

    def get_turn_pattern(self, preset_id: str) -> str:
        """Get turn pattern for a preset."""
        preset = self.get(preset_id)
        if preset is None:
            return "round_robin"
        return preset.get("turnPattern", "round_robin")


# Global singleton
preset_loader = PresetLoader()
