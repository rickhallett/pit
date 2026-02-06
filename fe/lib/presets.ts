/**
 * Preset Loader — Fetch, parse, and validate preset configurations
 */

import {
  PresetConfig,
  PresetIndex,
  PresetId,
  parsePresetIndex,
  isValidPreset,
} from '@/types';

// ============================================================================
// Loader
// ============================================================================

let cachedPresets: PresetConfig[] | null = null;

/**
 * Load all presets from the API or static JSON
 * Caches result for subsequent calls
 */
export async function loadPresets(): Promise<PresetConfig[]> {
  if (cachedPresets) {
    return cachedPresets;
  }

  // In development, load from static JSON
  // In production, this would hit the API
  const response = await fetch('/api/presets');
  
  if (!response.ok) {
    throw new Error(`Failed to load presets: ${response.status}`);
  }

  const raw: PresetIndex = await response.json();
  const presets = parsePresetIndex(raw);

  // Validate all presets
  const invalid = presets.filter(p => !isValidPreset(p));
  if (invalid.length > 0) {
    console.warn(
      `Invalid presets found: ${invalid.map(p => p.id).join(', ')}`
    );
  }

  cachedPresets = presets.filter(isValidPreset);
  return cachedPresets;
}

/**
 * Clear the preset cache (for development/testing)
 */
export function clearPresetCache(): void {
  cachedPresets = null;
}

// ============================================================================
// Filters
// ============================================================================

/**
 * Get featured presets only
 */
export function getFeaturedPresets(presets: PresetConfig[]): PresetConfig[] {
  return presets.filter(p => p.featured);
}

/**
 * Get launch day hero preset
 */
export function getLaunchDayHero(presets: PresetConfig[]): PresetConfig | undefined {
  return presets.find(p => p.launchDayHero);
}

/**
 * Get presets by category
 */
export function getPresetsByCategory(
  presets: PresetConfig[],
  category: string
): PresetConfig[] {
  return presets.filter(p => p.category === category);
}

/**
 * Get preset by ID
 */
export function getPresetById(
  presets: PresetConfig[],
  id: PresetId
): PresetConfig | undefined {
  return presets.find(p => p.id === id);
}

// ============================================================================
// Input Validation
// ============================================================================

export interface InputValidation {
  isValid: boolean;
  error?: string;
}

/**
 * Validate user input for a preset
 */
export function validateUserInput(
  preset: PresetConfig,
  input: string
): InputValidation {
  // If input is not required, anything is valid
  if (!preset.inputRequired) {
    return { isValid: true };
  }

  // Input required but empty
  const trimmed = input.trim();
  if (trimmed.length === 0) {
    return {
      isValid: false,
      error: preset.inputHint || 'Please enter a topic',
    };
  }

  // Minimum length check
  if (trimmed.length < 3) {
    return {
      isValid: false,
      error: 'Topic must be at least 3 characters',
    };
  }

  // Maximum length check
  if (trimmed.length > 500) {
    return {
      isValid: false,
      error: 'Topic must be under 500 characters',
    };
  }

  return { isValid: true };
}

// ============================================================================
// Serialization
// ============================================================================

/**
 * Serialize a preset selection for sharing/URL
 */
export function serializeSelection(presetId: PresetId, userInput?: string): string {
  const params = new URLSearchParams();
  params.set('preset', presetId);
  if (userInput) {
    params.set('topic', userInput);
  }
  return params.toString();
}

/**
 * Deserialize a preset selection from URL
 */
export function deserializeSelection(queryString: string): {
  presetId?: PresetId;
  userInput?: string;
} {
  const params = new URLSearchParams(queryString);
  const preset = params.get('preset');
  const topic = params.get('topic');

  return {
    presetId: preset ? PresetId(preset) : undefined,
    userInput: topic || undefined,
  };
}
