/**
 * Preset loader for The Pit
 * 
 * In production, this would fetch from the API.
 * For now, we import the config directly.
 */

import type { Preset, PresetConfig, TurnLimits } from './types/preset';

// Import the canonical config
// Note: Next.js can import JSON directly
import presetsConfig from '../../config/presets.json';

const config = presetsConfig as PresetConfig;

/**
 * Get all presets
 */
export function getAllPresets(): Preset[] {
  return config.presets;
}

/**
 * Get featured presets (for homepage)
 */
export function getFeaturedPresets(): Preset[] {
  return config.presets.filter(p => p.featured);
}

/**
 * Get the launch day hero preset (Darwin Special)
 */
export function getLaunchHeroPreset(): Preset | undefined {
  return config.presets.find(p => p.launch_day_hero);
}

/**
 * Get a preset by ID
 */
export function getPresetById(presetId: string): Preset | undefined {
  return config.presets.find(p => p.preset_id === presetId);
}

/**
 * Get presets by category
 */
export function getPresetsByCategory(category: string): Preset[] {
  return config.presets.filter(p => p.category === category);
}

/**
 * Get turn limits for a preset tier
 */
export function getTurnLimit(preset: Preset, tier: keyof TurnLimits = 'standard'): number {
  return preset.max_turns?.[tier] ?? 12;
}

/**
 * Get all unique categories
 */
export function getCategories(): string[] {
  const categories = new Set(config.presets.map(p => p.category));
  return Array.from(categories);
}

/**
 * Check if a preset requires user input (e.g., debate topic)
 */
export function requiresInput(preset: Preset): boolean {
  return preset.requires_input ?? false;
}
