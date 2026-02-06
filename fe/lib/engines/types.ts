/**
 * Poker Engine Types
 * 
 * Shared type definitions for all poker calculation engines.
 */

// ============================================================================
// Core Types
// ============================================================================

export interface Card {
  rank: '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | 'T' | 'J' | 'Q' | 'K' | 'A';
  suit: 'h' | 'd' | 'c' | 's';
}

export interface ParsedRange {
  /** Raw input string */
  raw: string;
  /** Expanded card combinations */
  combos: [Card, Card][];
}

export interface EngineOptions {
  iterations?: number;
  timeoutMs?: number;
}

export interface EngineCalculateParams {
  hand: [Card, Card];
  board: Card[];
  opponentRanges: ParsedRange[];
  options?: EngineOptions;
  signal?: AbortSignal;
}

export interface EngineResult {
  equity: number;
  tieEquity: number;
  iterationsRun?: number;
  confidenceInterval?: number;
  exact: boolean;
}

export interface EngineCapabilities {
  maxOpponents: number;
  supportsRanges: boolean;
  exactCalculation: boolean;
  averageSpeedMs: number;
}

// ============================================================================
// Engine Interface
// ============================================================================

export interface PokerEngine {
  readonly id: string;
  readonly name: string;
  
  isAvailable(): Promise<boolean>;
  calculate(params: EngineCalculateParams): Promise<EngineResult>;
  getCapabilities(): EngineCapabilities;
}

// ============================================================================
// Error Types
// ============================================================================

export type EngineErrorCode = 
  | 'INVALID_HAND'
  | 'INVALID_BOARD'
  | 'INVALID_RANGE'
  | 'CARD_CONFLICT'
  | 'ENGINE_UNAVAILABLE'
  | 'TIMEOUT'
  | 'INTERNAL_ERROR';

export class PokerEngineError extends Error {
  constructor(
    public readonly code: EngineErrorCode,
    message: string,
    public readonly details?: Record<string, unknown>
  ) {
    super(message);
    this.name = 'PokerEngineError';
  }
}
