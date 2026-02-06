/**
 * Preset Configuration
 * 
 * Defines the 11 approved bout formats with their turn orchestration rules.
 * 
 * Turn Types:
 * - alternating: A ↔ B (2-bot ping-pong)
 * - round_robin: A → B → C → A... (rotating sequence)
 * - broadcast: Presenter → [Responders] → Presenter... (asymmetric)
 */

export type TurnType = 'alternating' | 'round_robin' | 'broadcast';

export interface PresetAgent {
  role: string;
  description: string;
  isPresenter?: boolean; // For broadcast: marks the lead role
}

export interface PresetConfig {
  id: string;
  name: string;
  description: string;
  agentCount: number;
  turnType: TurnType;
  agents: PresetAgent[];
  defaultRounds: number;
  freeTier: boolean; // Available on free tier (2-bot presets)
}

export const PRESETS: Record<string, PresetConfig> = {
  // ============================================
  // ALTERNATING (2-bot)
  // ============================================
  
  roast_battle: {
    id: 'roast_battle',
    name: 'Roast Battle',
    description: 'Two comedians trade insults in escalating rounds.',
    agentCount: 2,
    turnType: 'alternating',
    agents: [
      { role: 'roaster_a', description: 'First comedian' },
      { role: 'roaster_b', description: 'Second comedian' },
    ],
    defaultRounds: 4,
    freeTier: true,
  },

  on_the_couch: {
    id: 'on_the_couch',
    name: 'On The Couch',
    description: 'Therapy session between analyst and patient.',
    agentCount: 2,
    turnType: 'alternating',
    agents: [
      { role: 'therapist', description: 'The analyst' },
      { role: 'patient', description: 'The analysand' },
    ],
    defaultRounds: 6,
    freeTier: true,
  },

  gloves_off: {
    id: 'gloves_off',
    name: 'Gloves Off',
    description: 'No-holds-barred debate between opposing viewpoints.',
    agentCount: 2,
    turnType: 'alternating',
    agents: [
      { role: 'debater_a', description: 'First debater' },
      { role: 'debater_b', description: 'Second debater' },
    ],
    defaultRounds: 4,
    freeTier: true,
  },

  // ============================================
  // ROUND ROBIN (3-4 bot, equal participants)
  // ============================================

  darwin_special: {
    id: 'darwin_special',
    name: 'Darwin Special',
    description: 'Darwin observes and discusses specimens with fellow naturalists.',
    agentCount: 3,
    turnType: 'round_robin',
    agents: [
      { role: 'darwin', description: 'Charles Darwin' },
      { role: 'naturalist_1', description: 'First naturalist' },
      { role: 'naturalist_2', description: 'Second naturalist' },
    ],
    defaultRounds: 4,
    freeTier: false,
  },

  first_contact: {
    id: 'first_contact',
    name: 'First Contact',
    description: 'Humanity meets alien intelligence for the first time.',
    agentCount: 3,
    turnType: 'round_robin',
    agents: [
      { role: 'human', description: 'Human representative' },
      { role: 'alien_1', description: 'First alien entity' },
      { role: 'alien_2', description: 'Second alien entity' },
    ],
    defaultRounds: 4,
    freeTier: false,
  },

  writers_room: {
    id: 'writers_room',
    name: 'Writers Room',
    description: 'TV writers brainstorm and pitch ideas.',
    agentCount: 3,
    turnType: 'round_robin',
    agents: [
      { role: 'writer_a', description: 'First writer' },
      { role: 'writer_b', description: 'Second writer' },
      { role: 'writer_c', description: 'Third writer' },
    ],
    defaultRounds: 4,
    freeTier: false,
  },

  the_flatshare: {
    id: 'the_flatshare',
    name: 'The Flatshare',
    description: 'Roommates navigate domestic drama and shared living.',
    agentCount: 3,
    turnType: 'round_robin',
    agents: [
      { role: 'flatmate_a', description: 'First flatmate' },
      { role: 'flatmate_b', description: 'Second flatmate' },
      { role: 'flatmate_c', description: 'Third flatmate' },
    ],
    defaultRounds: 4,
    freeTier: false,
  },

  last_supper: {
    id: 'last_supper',
    name: 'Last Supper',
    description: 'Historical figures share a final meal and conversation.',
    agentCount: 4,
    turnType: 'round_robin',
    agents: [
      { role: 'host', description: 'The host figure' },
      { role: 'guest_1', description: 'First guest' },
      { role: 'guest_2', description: 'Second guest' },
      { role: 'guest_3', description: 'Third guest' },
    ],
    defaultRounds: 4,
    freeTier: false,
  },

  the_mansion: {
    id: 'the_mansion',
    name: 'The Mansion',
    description: 'Murder mystery dinner party with secrets and accusations.',
    agentCount: 4,
    turnType: 'round_robin',
    agents: [
      { role: 'host', description: 'The mansion host' },
      { role: 'guest_1', description: 'First guest' },
      { role: 'guest_2', description: 'Second guest' },
      { role: 'guest_3', description: 'Third guest' },
    ],
    defaultRounds: 4,
    freeTier: false,
  },

  // ============================================
  // BROADCAST (4-bot, asymmetric presenter)
  // ============================================

  shark_pit: {
    id: 'shark_pit',
    name: 'Shark Pit',
    description: 'Entrepreneur pitches to a panel of ruthless investors.',
    agentCount: 4,
    turnType: 'broadcast',
    agents: [
      { role: 'pitcher', description: 'The entrepreneur', isPresenter: true },
      { role: 'shark_1', description: 'First investor' },
      { role: 'shark_2', description: 'Second investor' },
      { role: 'shark_3', description: 'Third investor' },
    ],
    defaultRounds: 3,
    freeTier: false,
  },

  the_summit: {
    id: 'the_summit',
    name: 'The Summit',
    description: 'World leaders debate global policy with high stakes.',
    agentCount: 4,
    turnType: 'broadcast',
    agents: [
      { role: 'proposer', description: 'The proposal author', isPresenter: true },
      { role: 'delegate_1', description: 'First delegate' },
      { role: 'delegate_2', description: 'Second delegate' },
      { role: 'delegate_3', description: 'Third delegate' },
    ],
    defaultRounds: 4,
    freeTier: false,
  },
};

// Utility functions

export function getPreset(id: string): PresetConfig | undefined {
  return PRESETS[id];
}

export function getFreeTierPresets(): PresetConfig[] {
  return Object.values(PRESETS).filter(p => p.freeTier);
}

export function getPremiumPresets(): PresetConfig[] {
  return Object.values(PRESETS).filter(p => !p.freeTier);
}

export function getPresetsByTurnType(turnType: TurnType): PresetConfig[] {
  return Object.values(PRESETS).filter(p => p.turnType === turnType);
}
