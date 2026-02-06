"""PresetLoader — loads bout presets from individual JSON files.

Preset files live in config/presets/{preset_id}.json.
Each file contains all metadata including embedded system prompts.
"""

import json
import logging
from dataclasses import dataclass
from pathlib import Path
from typing import Optional

logger = logging.getLogger(__name__)


@dataclass
class PresetAgent:
    """An agent in a preset."""

    id: str
    name: str
    role: str
    system_prompt: str
    color: str = "#888888"
    avatar: str = "🤖"


@dataclass
class Preset:
    """A bout preset configuration."""

    id: str
    name: str
    description: str
    category: str
    agents: list[PresetAgent]
    agent_count: int
    featured: bool = False
    sort_order: int = 999
    requires_input: bool = False
    input_label: Optional[str] = None
    turn_pattern: str = "round_robin"
    max_turns: Optional[dict] = None
    launch_day_hero: bool = False

    # Compatibility aliases
    @property
    def premise(self) -> str:
        return self.description

    @property
    def tone(self) -> str:
        return self.category

    @property
    def user_input(self) -> bool:
        return self.requires_input


class PresetLoader:
    """Loads presets from individual JSON files."""

    def __init__(self, presets_dir: Path | None = None):
        """Initialize with optional presets directory override."""
        if presets_dir:
            self.presets_dir = presets_dir
        else:
            # Default to config/presets relative to repo root
            repo_root = Path(__file__).parents[4]  # be/src/pit_api/store → repo root
            self.presets_dir = repo_root / "config" / "presets"

    def load_all(self) -> list[Preset]:
        """Load all available presets."""
        presets = []
        if not self.presets_dir.exists():
            logger.warning("Presets directory not found: %s", self.presets_dir)
            return presets

        for preset_file in self.presets_dir.glob("*.json"):
            preset = self._load_preset_file(preset_file)
            if preset:
                presets.append(preset)

        # Sort by: featured first, then sort_order, then name
        return sorted(presets, key=lambda p: (not p.featured, p.sort_order, p.name))

    def load_one(self, preset_id: str) -> Preset | None:
        """Load a specific preset by ID."""
        preset_file = self.presets_dir / f"{preset_id}.json"
        if not preset_file.exists():
            return None
        return self._load_preset_file(preset_file)

    def _load_preset_file(self, preset_file: Path) -> Preset | None:
        """Load a preset from a JSON file."""
        try:
            with open(preset_file, encoding="utf-8") as f:
                data = json.load(f)

            agents = []
            for agent_data in data.get("agents", []):
                agents.append(
                    PresetAgent(
                        id=agent_data["agent_id"],
                        name=agent_data["name"],
                        role=agent_data.get("role", agent_data["name"]),
                        system_prompt=agent_data.get("system_prompt", ""),
                        color=agent_data.get("color", "#888888"),
                        avatar=agent_data.get("avatar", "🤖"),
                    )
                )

            max_turns = data.get("max_turns")

            return Preset(
                id=data["preset_id"],
                name=data["name"],
                description=data.get("description", ""),
                category=data.get("category", "general"),
                agents=agents,
                agent_count=data.get("agent_count", len(agents)),
                featured=data.get("featured", False),
                sort_order=data.get("sortOrder", 999),
                requires_input=data.get("requires_input", False),
                input_label=data.get("input_label"),
                turn_pattern=data.get("turnPattern", "round_robin"),
                max_turns=max_turns,
                launch_day_hero=data.get("launch_day_hero", False),
            )

        except (json.JSONDecodeError, KeyError) as e:
            logger.warning("Error loading preset %s: %s", preset_file, e)
            return None

    def get_by_category(self, category: str) -> list[Preset]:
        """Get all presets in a category."""
        return [p for p in self.load_all() if p.category == category]

    def get_featured(self) -> list[Preset]:
        """Get all featured presets."""
        return [p for p in self.load_all() if p.featured]

    def get_categories(self) -> list[str]:
        """Get all unique categories."""
        return sorted(set(p.category for p in self.load_all()))
