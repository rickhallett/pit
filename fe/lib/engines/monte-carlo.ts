/**
 * ARCHIVE: poker-tools
 * Created: 2026-02-06
 * Author: Unknown (discovered during The Poker Incident)
 * Status: Orphaned — no MANIFEST.md entry, no project ownership
 * Quality: Technically sound per Analyst review
 * Disposition: Archived for posterity per Kai's decision
 * 
 * This file was removed from pit main branch.
 * If reactivating, create proper project ownership first.
 */

/**
 * Monte Carlo Poker Equity Engine
 * 
 * Estimates hand equity through random sampling.
 * Default engine for poker-tools-mvp.
 * 
 * @module engines/monte-carlo
 */

import type { 
  PokerEngine, 
  EngineCalculateParams, 
  EngineResult, 
  EngineCapabilities,
  Card,
  ParsedRange 
} from './types';

// ============================================================================
// Types
// ============================================================================

interface MonteCarloOptions {
  iterations: number;
  timeoutMs: number;
}

interface SimulationResult {
  wins: number;
  ties: number;
  total: number;
}

// ============================================================================
// Constants
// ============================================================================

const RANKS = ['2', '3', '4', '5', '6', '7', '8', '9', 'T', 'J', 'Q', 'K', 'A'] as const;
const SUITS = ['h', 'd', 'c', 's'] as const;

const RANK_VALUES: Record<string, number> = {
  '2': 2, '3': 3, '4': 4, '5': 5, '6': 6, '7': 7, '8': 8,
  '9': 9, 'T': 10, 'J': 11, 'Q': 12, 'K': 13, 'A': 14
};

// Hand ranking categories (higher = better)
const enum HandRank {
  HighCard = 1,
  Pair = 2,
  TwoPair = 3,
  ThreeOfAKind = 4,
  Straight = 5,
  Flush = 6,
  FullHouse = 7,
  FourOfAKind = 8,
  StraightFlush = 9,
}

const DEFAULT_OPTIONS: MonteCarloOptions = {
  iterations: 10000,
  timeoutMs: 5000,
};

// ============================================================================
// Deck Operations
// ============================================================================

function createDeck(): Card[] {
  const deck: Card[] = [];
  for (const rank of RANKS) {
    for (const suit of SUITS) {
      deck.push({ rank, suit });
    }
  }
  return deck;
}

function cardKey(card: Card): string {
  return `${card.rank}${card.suit}`;
}

function removeCards(deck: Card[], cards: Card[]): Card[] {
  const removed = new Set(cards.map(cardKey));
  return deck.filter(c => !removed.has(cardKey(c)));
}

function shuffleInPlace<T>(array: T[]): T[] {
  // Fisher-Yates shuffle
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

// ============================================================================
// Hand Evaluation
// ============================================================================

interface EvaluatedHand {
  rank: HandRank;
  tiebreakers: number[]; // Descending priority
}

function evaluateHand(cards: Card[]): EvaluatedHand {
  if (cards.length !== 7 && cards.length !== 5) {
    throw new Error(`Expected 5 or 7 cards, got ${cards.length}`);
  }

  // For 7 cards, find best 5-card hand
  if (cards.length === 7) {
    return findBestFiveCardHand(cards);
  }

  return evaluateFiveCards(cards);
}

function findBestFiveCardHand(cards: Card[]): EvaluatedHand {
  let best: EvaluatedHand | null = null;

  // Generate all 21 combinations of 5 from 7
  for (let i = 0; i < 7; i++) {
    for (let j = i + 1; j < 7; j++) {
      const fiveCards = cards.filter((_, idx) => idx !== i && idx !== j);
      const evaluated = evaluateFiveCards(fiveCards);
      
      if (!best || compareHands(evaluated, best) > 0) {
        best = evaluated;
      }
    }
  }

  return best!;
}

function evaluateFiveCards(cards: Card[]): EvaluatedHand {
  const ranks = cards.map(c => RANK_VALUES[c.rank]).sort((a, b) => b - a);
  const suits = cards.map(c => c.suit);
  
  const isFlush = suits.every(s => s === suits[0]);
  const isStraight = checkStraight(ranks);
  
  // Count rank occurrences
  const rankCounts = new Map<number, number>();
  for (const r of ranks) {
    rankCounts.set(r, (rankCounts.get(r) || 0) + 1);
  }
  
  const counts = [...rankCounts.entries()]
    .sort((a, b) => b[1] - a[1] || b[0] - a[0]);

  // Straight flush
  if (isFlush && isStraight) {
    return { 
      rank: HandRank.StraightFlush, 
      tiebreakers: [getStraightHigh(ranks)] 
    };
  }

  // Four of a kind
  if (counts[0][1] === 4) {
    return { 
      rank: HandRank.FourOfAKind, 
      tiebreakers: [counts[0][0], counts[1][0]] 
    };
  }

  // Full house
  if (counts[0][1] === 3 && counts[1][1] === 2) {
    return { 
      rank: HandRank.FullHouse, 
      tiebreakers: [counts[0][0], counts[1][0]] 
    };
  }

  // Flush
  if (isFlush) {
    return { rank: HandRank.Flush, tiebreakers: ranks };
  }

  // Straight
  if (isStraight) {
    return { 
      rank: HandRank.Straight, 
      tiebreakers: [getStraightHigh(ranks)] 
    };
  }

  // Three of a kind
  if (counts[0][1] === 3) {
    const kickers = counts.slice(1).map(c => c[0]);
    return { 
      rank: HandRank.ThreeOfAKind, 
      tiebreakers: [counts[0][0], ...kickers] 
    };
  }

  // Two pair
  if (counts[0][1] === 2 && counts[1][1] === 2) {
    const pairs = [counts[0][0], counts[1][0]].sort((a, b) => b - a);
    return { 
      rank: HandRank.TwoPair, 
      tiebreakers: [...pairs, counts[2][0]] 
    };
  }

  // Pair
  if (counts[0][1] === 2) {
    const kickers = counts.slice(1).map(c => c[0]);
    return { 
      rank: HandRank.Pair, 
      tiebreakers: [counts[0][0], ...kickers] 
    };
  }

  // High card
  return { rank: HandRank.HighCard, tiebreakers: ranks };
}

function checkStraight(sortedRanks: number[]): boolean {
  // Check for wheel (A-2-3-4-5)
  if (sortedRanks[0] === 14 && 
      sortedRanks[1] === 5 && 
      sortedRanks[2] === 4 && 
      sortedRanks[3] === 3 && 
      sortedRanks[4] === 2) {
    return true;
  }
  
  // Check consecutive
  for (let i = 0; i < 4; i++) {
    if (sortedRanks[i] - sortedRanks[i + 1] !== 1) {
      return false;
    }
  }
  return true;
}

function getStraightHigh(sortedRanks: number[]): number {
  // Wheel special case: A-2-3-4-5 has 5 as high
  if (sortedRanks[0] === 14 && sortedRanks[1] === 5) {
    return 5;
  }
  return sortedRanks[0];
}

function compareHands(a: EvaluatedHand, b: EvaluatedHand): number {
  if (a.rank !== b.rank) {
    return a.rank - b.rank;
  }
  
  for (let i = 0; i < a.tiebreakers.length; i++) {
    if (a.tiebreakers[i] !== b.tiebreakers[i]) {
      return a.tiebreakers[i] - b.tiebreakers[i];
    }
  }
  
  return 0; // Tie
}

// ============================================================================
// Range Sampling
// ============================================================================

function sampleFromRange(range: ParsedRange, deck: Card[]): [Card, Card] | null {
  if (range.combos.length === 0) {
    return null;
  }
  
  // Filter to combos that are still in the deck
  const availableCombos = range.combos.filter(([c1, c2]) => {
    const deckKeys = new Set(deck.map(cardKey));
    return deckKeys.has(cardKey(c1)) && deckKeys.has(cardKey(c2));
  });
  
  if (availableCombos.length === 0) {
    return null;
  }
  
  const idx = Math.floor(Math.random() * availableCombos.length);
  return availableCombos[idx];
}

// ============================================================================
// Monte Carlo Simulation
// ============================================================================

function runSimulation(
  params: EngineCalculateParams,
  options: MonteCarloOptions
): SimulationResult {
  const { hand, board, opponentRanges, signal } = params;
  const startTime = Date.now();
  
  let wins = 0;
  let ties = 0;
  let total = 0;
  
  const baseDeck = removeCards(createDeck(), [...hand, ...board]);
  const cardsNeeded = 5 - board.length;
  
  for (let i = 0; i < options.iterations; i++) {
    // Check for cancellation
    if (signal?.aborted) {
      break;
    }
    
    // Check timeout
    if (Date.now() - startTime > options.timeoutMs) {
      break;
    }
    
    // Clone and shuffle remaining deck
    const deck = shuffleInPlace([...baseDeck]);
    
    // Sample opponent hands from their ranges
    let validSample = true;
    const opponentHands: [Card, Card][] = [];
    let currentDeck = deck;
    
    for (const range of opponentRanges) {
      const oppHand = sampleFromRange(range, currentDeck);
      if (!oppHand) {
        validSample = false;
        break;
      }
      opponentHands.push(oppHand);
      currentDeck = removeCards(currentDeck, oppHand);
    }
    
    if (!validSample) {
      continue; // Skip invalid samples
    }
    
    // Deal remaining community cards
    const remainingDeck = currentDeck;
    const runout = remainingDeck.slice(0, cardsNeeded);
    const fullBoard = [...board, ...runout];
    
    // Evaluate all hands
    const heroHand = evaluateHand([...hand, ...fullBoard]);
    const oppResults = opponentHands.map(opp => 
      evaluateHand([...opp, ...fullBoard])
    );
    
    // Determine outcome
    let heroBeatAll = true;
    let heroTiedAll = true;
    
    for (const oppResult of oppResults) {
      const cmp = compareHands(heroHand, oppResult);
      if (cmp < 0) {
        heroBeatAll = false;
        heroTiedAll = false;
        break;
      } else if (cmp > 0) {
        heroTiedAll = false;
      }
    }
    
    if (heroBeatAll && !heroTiedAll) {
      wins++;
    } else if (heroTiedAll) {
      ties++;
    }
    
    total++;
  }
  
  return { wins, ties, total };
}

// ============================================================================
// Engine Implementation
// ============================================================================

export class MonteCarloEngine implements PokerEngine {
  readonly id = 'monte-carlo';
  readonly name = 'Monte Carlo Simulator';
  
  async isAvailable(): Promise<boolean> {
    return true; // Always available - pure JS implementation
  }
  
  getCapabilities(): EngineCapabilities {
    return {
      maxOpponents: 9,
      supportsRanges: true,
      exactCalculation: false,
      averageSpeedMs: 150,
    };
  }
  
  async calculate(params: EngineCalculateParams): Promise<EngineResult> {
    const options: MonteCarloOptions = {
      iterations: params.options?.iterations ?? DEFAULT_OPTIONS.iterations,
      timeoutMs: params.options?.timeoutMs ?? DEFAULT_OPTIONS.timeoutMs,
    };
    
    const result = runSimulation(params, options);
    
    if (result.total === 0) {
      throw new Error('No valid samples could be generated');
    }
    
    const equity = result.wins / result.total;
    const tieEquity = result.ties / result.total;
    
    // Calculate confidence interval (95%)
    // Using normal approximation to binomial
    const p = equity;
    const n = result.total;
    const stdErr = Math.sqrt((p * (1 - p)) / n);
    const confidenceInterval = 1.96 * stdErr * 100; // As percentage
    
    return {
      equity,
      tieEquity,
      iterationsRun: result.total,
      confidenceInterval: Math.round(confidenceInterval * 100) / 100,
      exact: false,
    };
  }
}

// ============================================================================
// Export
// ============================================================================

export const monteCarloEngine = new MonteCarloEngine();
export default monteCarloEngine;
