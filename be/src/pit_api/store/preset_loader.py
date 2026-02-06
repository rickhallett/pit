"""PresetLoader — loads bout presets from JSON/Markdown files."""

import json
import logging
from dataclasses import dataclass
from pathlib import Path

logger = logging.getLogger(__name__)


@dataclass
class PresetAgent:
    """An agent in a preset."""

    name: str
    role: str
    system_prompt: str


@dataclass
class Preset:
    """A bout preset configuration."""

    id: str
    name: str
    premise: str
    tone: str
    agents: list[PresetAgent]
    featured: bool = False
    user_input: bool = False


class PresetLoader:
    """Loads presets from the store directory."""

    def __init__(self, presets_dir: Path | None = None):
        """Initialize with optional presets directory override."""
        if presets_dir:
            self.presets_dir = presets_dir
        else:
            # Default to src/pit_api/store/presets
            self.presets_dir = Path(__file__).parent / "presets"

    def load_all(self) -> list[Preset]:
        """Load all available presets."""
        presets = []
        if not self.presets_dir.exists():
            return presets

        for preset_dir in self.presets_dir.iterdir():
            if preset_dir.is_dir():
                preset = self._load_preset(preset_dir)
                if preset:
                    presets.append(preset)

        return sorted(presets, key=lambda p: (not p.featured, p.name))

    def load_one(self, preset_id: str) -> Preset | None:
        """Load a specific preset by ID."""
        preset_dir = self.presets_dir / preset_id
        if not preset_dir.exists():
            return None
        return self._load_preset(preset_dir)

    def _load_preset(self, preset_dir: Path) -> Preset | None:
        """Load a preset from its directory."""
        meta_file = preset_dir / "meta.json"
        if not meta_file.exists():
            return None

        try:
            with open(meta_file, encoding="utf-8") as f:
                meta = json.load(f)

            agents = []
            for agent_meta in meta.get("agents", []):
                # Load system prompt from .md file
                prompt_file = preset_dir / f"{agent_meta['id']}.md"
                if prompt_file.exists():
                    system_prompt = prompt_file.read_text(encoding="utf-8")
                else:
                    system_prompt = agent_meta.get(
                        "fallback_prompt", "You are a participant in a debate."
                    )

                agents.append(
                    PresetAgent(
                        name=agent_meta["name"],
                        role=agent_meta.get("role", ""),
                        system_prompt=system_prompt,
                    )
                )

            return Preset(
                id=preset_dir.name,
                name=meta["name"],
                premise=meta.get("premise", ""),
                tone=meta.get("tone", ""),
                agents=agents,
                featured=meta.get("featured", False),
                user_input=meta.get("user_input", False),
            )

        except (json.JSONDecodeError, KeyError) as e:
            logger.warning("Error loading preset %s: %s", preset_dir, e)
            return None
