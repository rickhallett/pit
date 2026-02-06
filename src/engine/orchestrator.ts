/**
 * Turn Orchestration Engine
 * 
 * Handles turn sequencing for bouts based on preset turn_type.
 * 
 * Turn Types:
 * - alternating: A ↔ B (2-bot, ping-pong)
 * - round_robin: A → B → C → A... (N-bot, rotating)
 * - broadcast: Presenter → [Responders sequential] → Presenter... (asymmetric)
 */

import { PresetConfig, TurnType, PRESETS, getPreset } from '../config/presets';

// ============================================
// Types
// ============================================

export interface BoutAgent {
  id: string;
  role: string;
  turnOrder: number;
  isPresenter?: boolean;
  personaConfig?: Record<string, unknown>;
}

export interface BoutState {
  boutId: string;
  presetId: string;
  agents: BoutAgent[];
  turnType: TurnType;
  currentRound: number;
  currentTurnIndex: number;  // Index within the current round
  totalRounds: number;
  messageCount: number;
  isComplete: boolean;
}

export interface TurnResult {
  nextAgent: BoutAgent;
  isNewRound: boolean;
  isComplete: boolean;
}

// ============================================
// Orchestrator
// ============================================

export class TurnOrchestrator {
  private state: BoutState;

  constructor(boutId: string, presetId: string, agents: BoutAgent[], totalRounds?: number) {
    const preset = getPreset(presetId);
    if (!preset) {
      throw new Error(`Unknown preset: ${presetId}`);
    }

    if (agents.length !== preset.agentCount) {
      throw new Error(
        `Preset ${presetId} requires ${preset.agentCount} agents, got ${agents.length}`
      );
    }

    // Sort agents by turnOrder
    const sortedAgents = [...agents].sort((a, b) => a.turnOrder - b.turnOrder);

    this.state = {
      boutId,
      presetId,
      agents: sortedAgents,
      turnType: preset.turnType,
      currentRound: 1,
      currentTurnIndex: 0,
      totalRounds: totalRounds ?? preset.defaultRounds,
      messageCount: 0,
      isComplete: false,
    };
  }

  /**
   * Get the agent who should speak next.
   */
  getNextAgent(): BoutAgent {
    if (this.state.isComplete) {
      throw new Error('Bout is complete');
    }

    switch (this.state.turnType) {
      case 'alternating':
        return this.getNextAlternating();
      case 'round_robin':
        return this.getNextRoundRobin();
      case 'broadcast':
        return this.getNextBroadcast();
      default:
        throw new Error(`Unknown turn type: ${this.state.turnType}`);
    }
  }

  /**
   * Record that a message was sent and advance the turn.
   */
  advanceTurn(): TurnResult {
    if (this.state.isComplete) {
      throw new Error('Bout is complete');
    }

    this.state.messageCount++;

    switch (this.state.turnType) {
      case 'alternating':
        return this.advanceAlternating();
      case 'round_robin':
        return this.advanceRoundRobin();
      case 'broadcast':
        return this.advanceBroadcast();
      default:
        throw new Error(`Unknown turn type: ${this.state.turnType}`);
    }
  }

  /**
   * Get current bout state (for persistence/debugging).
   */
  getState(): Readonly<BoutState> {
    return { ...this.state };
  }

  /**
   * Restore state (e.g., from database).
   */
  static fromState(state: BoutState): TurnOrchestrator {
    const orchestrator = Object.create(TurnOrchestrator.prototype);
    orchestrator.state = { ...state };
    return orchestrator;
  }

  // ============================================
  // Alternating: A → B → A → B
  // ============================================

  private getNextAlternating(): BoutAgent {
    const idx = this.state.currentTurnIndex % 2;
    return this.state.agents[idx];
  }

  private advanceAlternating(): TurnResult {
    this.state.currentTurnIndex++;
    
    // Every 2 turns = 1 round (each agent spoke once)
    const isNewRound = this.state.currentTurnIndex % 2 === 0;
    if (isNewRound) {
      this.state.currentRound++;
    }

    const isComplete = this.state.currentRound > this.state.totalRounds;
    this.state.isComplete = isComplete;

    return {
      nextAgent: isComplete ? this.state.agents[0] : this.getNextAlternating(),
      isNewRound,
      isComplete,
    };
  }

  // ============================================
  // Round Robin: A → B → C → A → B → C
  // ============================================

  private getNextRoundRobin(): BoutAgent {
    const idx = this.state.currentTurnIndex % this.state.agents.length;
    return this.state.agents[idx];
  }

  private advanceRoundRobin(): TurnResult {
    this.state.currentTurnIndex++;
    
    // Every N turns = 1 round (each agent spoke once)
    const isNewRound = this.state.currentTurnIndex % this.state.agents.length === 0;
    if (isNewRound) {
      this.state.currentRound++;
    }

    const isComplete = this.state.currentRound > this.state.totalRounds;
    this.state.isComplete = isComplete;

    return {
      nextAgent: isComplete ? this.state.agents[0] : this.getNextRoundRobin(),
      isNewRound,
      isComplete,
    };
  }

  // ============================================
  // Broadcast: Presenter → R1 → R2 → R3 → Presenter
  // ============================================

  private getPresenter(): BoutAgent {
    const presenter = this.state.agents.find(a => a.isPresenter);
    if (!presenter) {
      // Fallback: first agent is presenter
      return this.state.agents[0];
    }
    return presenter;
  }

  private getResponders(): BoutAgent[] {
    const presenter = this.getPresenter();
    return this.state.agents.filter(a => a.id !== presenter.id);
  }

  private getNextBroadcast(): BoutAgent {
    const responders = this.getResponders();
    const turnsPerRound = 1 + responders.length; // presenter + all responders
    const positionInRound = this.state.currentTurnIndex % turnsPerRound;

    if (positionInRound === 0) {
      // Presenter's turn
      return this.getPresenter();
    } else {
      // Responder's turn (sequential)
      return responders[positionInRound - 1];
    }
  }

  private advanceBroadcast(): TurnResult {
    this.state.currentTurnIndex++;
    
    const responders = this.getResponders();
    const turnsPerRound = 1 + responders.length;
    
    // New round when we've completed presenter + all responders
    const isNewRound = this.state.currentTurnIndex % turnsPerRound === 0;
    if (isNewRound) {
      this.state.currentRound++;
    }

    const isComplete = this.state.currentRound > this.state.totalRounds;
    this.state.isComplete = isComplete;

    return {
      nextAgent: isComplete ? this.getPresenter() : this.getNextBroadcast(),
      isNewRound,
      isComplete,
    };
  }
}

// ============================================
// Factory
// ============================================

/**
 * Create a new orchestrator for a bout.
 */
export function createOrchestrator(
  boutId: string,
  presetId: string,
  agentAssignments: Array<{ id: string; role: string; personaConfig?: Record<string, unknown> }>
): TurnOrchestrator {
  const preset = getPreset(presetId);
  if (!preset) {
    throw new Error(`Unknown preset: ${presetId}`);
  }

  // Map assignments to BoutAgents with turn order
  const agents: BoutAgent[] = agentAssignments.map((assignment, index) => {
    const presetAgent = preset.agents.find(pa => pa.role === assignment.role);
    return {
      id: assignment.id,
      role: assignment.role,
      turnOrder: index,
      isPresenter: presetAgent?.isPresenter ?? false,
      personaConfig: assignment.personaConfig,
    };
  });

  return new TurnOrchestrator(boutId, presetId, agents);
}
