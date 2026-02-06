/**
 * Debate House — Core Type Definitions
 * 
 * Single source of truth for presets, agents, bouts, and turns.
 * All types are runtime-validated on load. No implicit any.
 */

// ============================================================================
// IDs — Branded types for type safety
// ============================================================================

export type PresetId = string & { readonly __brand: 'PresetId' };
export type AgentId = string & { readonly __brand: 'AgentId' };
export type BoutId = string & { readonly __brand: 'BoutId' };
export type TurnId = string & { readonly __brand: 'TurnId' };

// Factory functions for creating branded IDs
export const PresetId = (id: string): PresetId => id as PresetId;
export const AgentId = (id: string): AgentId => id as AgentId;
export const BoutId = (id: string): BoutId => id as BoutId;
export const TurnId = (id: string): TurnId => id as TurnId;

// ============================================================================
// Categories
// ============================================================================

export type PresetCategory = 
  | 'debate' 
  | 'comedy' 
  | 'drama' 
  | 'business' 
  | 'creative'
  | 'philosophy'
  | 'science'
  | 'politics';

// ============================================================================
// Agents
// ============================================================================

/**
 * Agent configuration — the debaters themselves
 */
export interface AgentConfig {
  /** Unique identifier within the preset */
  id: AgentId;
  /** Display name */
  name: string;
  /** System prompt defining personality and debate style */
  systemPrompt: string;
  /** Hex color for UI elements */
  color: string;
  /** Emoji or image URL for avatar */
  avatar: string;
}

/**
 * Raw agent config from JSON (snake_case)
 */
export interface AgentConfigRaw {
  agent_id: string;
  name: string;
  system_prompt: string;
  color: string;
  avatar: string;
}

// ============================================================================
// Presets
// ============================================================================

/**
 * Full preset configuration — defines a complete debate format
 */
export interface PresetConfig {
  /** Unique identifier */
  id: PresetId;
  /** Display name (e.g., "The Last Supper") */
  name: string;
  /** Short description for cards */
  description: string;
  /** Longer narrative setup for bout intro (optional) */
  premise?: string;
  /** Content category */
  category: PresetCategory;
  /** Show on homepage / featured section */
  featured: boolean;
  /** Launch day special treatment */
  launchDayHero?: boolean;
  /** The cast of agents */
  agents: AgentConfig[];
  /** Recommended number of turns */
  recommendedTurns: number;
  /** Tone hint for system prompt flavor */
  tone?: string;
  
  // === User Input ===
  /** Whether user must provide a topic/prompt */
  inputRequired: boolean;
  /** Placeholder text for input field */
  inputHint?: string;
  /** Example inputs to show */
  inputExamples?: string[];
  /** Pre-filled default input */
  defaultInput?: string;
  
  // === Turn Limits (tiered) ===
  maxTurns?: {
    standard: number;
    juiced: number;
    unleashed: number;
  };
}

/**
 * Raw preset config from JSON (snake_case)
 */
export interface PresetConfigRaw {
  preset_id: string;
  name: string;
  description: string;
  premise?: string;
  category: string;
  agent_count?: number;
  featured?: boolean;
  launch_day_hero?: boolean;
  requires_input?: boolean;
  input_label?: string;
  input_examples?: string[];
  default_input?: string;
  agents: AgentConfigRaw[];
  turn_order?: 'sequential' | 'random';
  max_turns?: {
    standard: number;
    juiced: number;
    unleashed: number;
  };
}

/**
 * Preset index file structure
 */
export interface PresetIndex {
  version: string;
  presets: PresetConfigRaw[];
}

// ============================================================================
// Bout (Active Debate Session)
// ============================================================================

export type BoutStatus = 
  | 'setup'       // User configuring
  | 'starting'    // Countdown / intro
  | 'active'      // Debate in progress
  | 'paused'      // User paused
  | 'completed'   // All turns done
  | 'abandoned';  // User left early

export type TurnOrderStrategy = 'sequential' | 'random' | 'adaptive';

/**
 * Active bout configuration — what the user selected
 */
export interface BoutConfig {
  /** Selected preset */
  presetId: PresetId;
  /** User-provided topic/prompt (if inputRequired) */
  userInput?: string;
  /** Turn limit for this bout */
  maxTurns: number;
  /** Turn order strategy */
  turnOrder: TurnOrderStrategy;
  /** Custom agents (if user modified the cast) */
  agents?: AgentConfig[];
}

/**
 * Single turn in a bout
 */
export interface Turn {
  id: TurnId;
  /** Which agent spoke */
  agentId: AgentId;
  /** The agent's response */
  content: string;
  /** Turn number (1-indexed) */
  turnNumber: number;
  /** ISO timestamp */
  timestamp: string;
  /** Token count for this turn */
  tokens?: number;
}

/**
 * Full bout state
 */
export interface Bout {
  id: BoutId;
  config: BoutConfig;
  status: BoutStatus;
  turns: Turn[];
  /** Current turn number */
  currentTurn: number;
  /** Which agent's turn is next */
  nextAgentId: AgentId | null;
  /** When the bout started */
  startedAt: string;
  /** When the bout ended */
  endedAt?: string;
  /** Total tokens used */
  totalTokens?: number;
}

// ============================================================================
// UI State
// ============================================================================

/**
 * Preset card display state
 */
export interface PresetCardState {
  preset: PresetConfig;
  isSelected: boolean;
  isHovered: boolean;
  animationState: 'idle' | 'entering' | 'selected' | 'exiting';
}

/**
 * Fighter selection state (for vs-style selection)
 */
export interface FighterSelection {
  fighter1: AgentId | null;
  fighter2: AgentId | null;
}

/**
 * Preset selection state (for preset picker)
 */
export interface PresetSelection {
  selectedPreset: PresetId | null;
  userInput: string;
  isValid: boolean;
  validationError?: string;
}

// ============================================================================
// Transformers
// ============================================================================

/**
 * Transform raw agent JSON to AgentConfig
 */
export function parseAgent(raw: AgentConfigRaw): AgentConfig {
  return {
    id: AgentId(raw.agent_id),
    name: raw.name,
    systemPrompt: raw.system_prompt,
    color: raw.color,
    avatar: raw.avatar,
  };
}

/**
 * Transform raw preset JSON to PresetConfig
 */
export function parsePreset(raw: PresetConfigRaw): PresetConfig {
  return {
    id: PresetId(raw.preset_id),
    name: raw.name,
    description: raw.description,
    premise: raw.premise,
    category: raw.category as PresetCategory,
    featured: raw.featured ?? false,
    launchDayHero: raw.launch_day_hero,
    agents: raw.agents.map(parseAgent),
    recommendedTurns: raw.max_turns?.standard ?? 12,
    inputRequired: raw.requires_input ?? false,
    inputHint: raw.input_label,
    inputExamples: raw.input_examples,
    defaultInput: raw.default_input,
    maxTurns: raw.max_turns,
  };
}

/**
 * Parse preset index file
 */
export function parsePresetIndex(raw: PresetIndex): PresetConfig[] {
  return raw.presets.map(parsePreset);
}

// ============================================================================
// Validation
// ============================================================================

export function isValidCategory(category: string): category is PresetCategory {
  return [
    'debate', 'comedy', 'drama', 'business', 
    'creative', 'philosophy', 'science', 'politics'
  ].includes(category);
}

export function isValidPreset(preset: PresetConfig): boolean {
  return (
    preset.id.length > 0 &&
    preset.name.length > 0 &&
    preset.agents.length >= 2 &&
    isValidCategory(preset.category)
  );
}

// ============================================================================
// Constants
// ============================================================================

export const DEFAULT_TURN_LIMITS = {
  standard: 12,
  juiced: 24,
  unleashed: 48,
} as const;

export const CATEGORY_LABELS: Record<PresetCategory, string> = {
  debate: 'Debate',
  comedy: 'Comedy',
  drama: 'Drama',
  business: 'Business',
  creative: 'Creative',
  philosophy: 'Philosophy',
  science: 'Science',
  politics: 'Politics',
};

export const CATEGORY_COLORS: Record<PresetCategory, string> = {
  debate: '#B22222',    // Firebrick
  comedy: '#FF6347',    // Tomato
  drama: '#9370DB',     // Medium Purple
  business: '#2E8B57',  // Sea Green
  creative: '#DAA520',  // Goldenrod
  philosophy: '#4682B4', // Steel Blue
  science: '#228B22',   // Forest Green
  politics: '#DC143C',  // Crimson
};
