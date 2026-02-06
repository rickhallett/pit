/**
 * Preset type definitions for The Pit
 * Source of truth: ~/code/pit/config/presets.json
 */

export type TurnPattern = 'round_robin' | 'alternating' | 'broadcast';

export type PresetCategory = 
  | 'philosophy'
  | 'comedy'
  | 'business'
  | 'debate'
  | 'creative'
  | 'science'
  | 'drama'
  | 'politics';

export interface Agent {
  agent_id: string;
  name: string;
  color: string;        // Hex color, e.g., "#5B8FB9"
  avatar: string;       // Emoji, e.g., "🏛️"
  system_prompt: string;
}

export interface TurnLimits {
  standard: number;     // Default: 12 turns
  juiced: number;       // Default: 24 turns
  unleashed: number;    // Default: 48 turns
}

export interface Preset {
  preset_id: string;
  name: string;
  description: string;
  category: PresetCategory;
  agent_count: number;
  featured: boolean;
  
  // Optional fields
  launch_day_hero?: boolean;
  requires_input?: boolean;
  input_label?: string;
  
  // Orchestration (to be added to JSON)
  turn_pattern?: TurnPattern;
  max_turns?: TurnLimits;
  
  // Agents
  agents: Agent[];
}

export interface PresetConfig {
  version: string;
  presets: Preset[];
}

// Default turn limits by agent count
export const DEFAULT_TURN_LIMITS: Record<number, TurnLimits> = {
  2: { standard: 12, juiced: 24, unleashed: 48 },
  3: { standard: 12, juiced: 24, unleashed: 48 },
  4: { standard: 12, juiced: 24, unleashed: 48 },
  5: { standard: 15, juiced: 30, unleashed: 60 },
  6: { standard: 18, juiced: 36, unleashed: 72 },
};

// Helper to get turn limits for a preset
export function getTurnLimits(preset: Preset): TurnLimits {
  return preset.max_turns ?? DEFAULT_TURN_LIMITS[preset.agent_count] ?? DEFAULT_TURN_LIMITS[4];
}
