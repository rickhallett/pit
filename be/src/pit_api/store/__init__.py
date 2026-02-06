"""Store — presets, configurations, and static data."""

from .preset_loader import PresetLoader

# Global preset loader instance
preset_loader = PresetLoader()

__all__ = ["preset_loader", "PresetLoader"]
