/**
 * Poker Engines
 * 
 * Unified interface for poker equity calculation engines.
 */

export * from './types';
export * from './parsers';
export { MonteCarloEngine, monteCarloEngine } from './monte-carlo';

import { PokerEngine } from './types';
import { monteCarloEngine } from './monte-carlo';

// ============================================================================
// Engine Registry
// ============================================================================

const engines: Map<string, PokerEngine> = new Map([
  ['monte-carlo', monteCarloEngine],
]);

let defaultEngine: PokerEngine = monteCarloEngine;

export function registerEngine(engine: PokerEngine): void {
  engines.set(engine.id, engine);
}

export function getEngine(id: string): PokerEngine | undefined {
  return engines.get(id);
}

export function listEngines(): PokerEngine[] {
  return [...engines.values()];
}

export function getDefaultEngine(): PokerEngine {
  return defaultEngine;
}

export function setDefaultEngine(engine: PokerEngine): void {
  defaultEngine = engine;
}
