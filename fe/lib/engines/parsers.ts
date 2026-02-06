/**
 * Card and Range Parsers
 * 
 * Parse standard poker notation into typed structures.
 */

import { Card, ParsedRange, PokerEngineError } from './types';

// ============================================================================
// Constants
// ============================================================================

const VALID_RANKS = ['2', '3', '4', '5', '6', '7', '8', '9', 'T', 'J', 'Q', 'K', 'A'] as const;
const VALID_SUITS = ['h', 'd', 'c', 's'] as const;

const RANK_ORDER: Record<string, number> = {
  'A': 14, 'K': 13, 'Q': 12, 'J': 11, 'T': 10,
  '9': 9, '8': 8, '7': 7, '6': 6, '5': 5, '4': 4, '3': 3, '2': 2
};

type Rank = typeof VALID_RANKS[number];
type Suit = typeof VALID_SUITS[number];

// ============================================================================
// Card Parsing
// ============================================================================

export function parseCard(input: string): Card {
  const normalized = input.trim().toUpperCase();
  
  if (normalized.length !== 2) {
    throw new PokerEngineError('INVALID_HAND', `Invalid card: ${input}`);
  }
  
  let rank = normalized[0] as string;
  let suit = normalized[1].toLowerCase() as string;
  
  // Handle '10' -> 'T'
  if (rank === '1' && normalized.length === 3) {
    rank = 'T';
    suit = normalized[2].toLowerCase();
  }
  
  if (!VALID_RANKS.includes(rank as Rank)) {
    throw new PokerEngineError('INVALID_HAND', `Invalid rank: ${rank}`);
  }
  
  if (!VALID_SUITS.includes(suit as Suit)) {
    throw new PokerEngineError('INVALID_HAND', `Invalid suit: ${suit}`);
  }
  
  return { rank: rank as Rank, suit: suit as Suit };
}

export function parseHand(input: string): [Card, Card] {
  const normalized = input.trim().replace(/\s+/g, '');
  
  if (normalized.length === 4) {
    return [
      parseCard(normalized.slice(0, 2)),
      parseCard(normalized.slice(2, 4))
    ];
  }
  
  throw new PokerEngineError('INVALID_HAND', `Invalid hand: ${input}`);
}

export function parseBoard(input: string): Card[] {
  const normalized = input.trim().replace(/\s+/g, '');
  
  if (normalized.length === 0) return [];
  if (normalized.length % 2 !== 0) {
    throw new PokerEngineError('INVALID_BOARD', `Invalid board: ${input}`);
  }
  
  const cards: Card[] = [];
  for (let i = 0; i < normalized.length; i += 2) {
    cards.push(parseCard(normalized.slice(i, i + 2)));
  }
  
  if (cards.length > 5) {
    throw new PokerEngineError('INVALID_BOARD', 'Board cannot have more than 5 cards');
  }
  
  return cards;
}

// ============================================================================
// Range Parsing
// ============================================================================

function expandPair(rank: Rank): [Card, Card][] {
  const combos: [Card, Card][] = [];
  const suits: Suit[] = ['h', 'd', 'c', 's'];
  
  for (let i = 0; i < suits.length; i++) {
    for (let j = i + 1; j < suits.length; j++) {
      combos.push([
        { rank, suit: suits[i] },
        { rank, suit: suits[j] }
      ]);
    }
  }
  
  return combos;
}

function expandSuited(rank1: Rank, rank2: Rank): [Card, Card][] {
  const combos: [Card, Card][] = [];
  const suits: Suit[] = ['h', 'd', 'c', 's'];
  
  for (const suit of suits) {
    combos.push([
      { rank: rank1, suit },
      { rank: rank2, suit }
    ]);
  }
  
  return combos;
}

function expandOffsuit(rank1: Rank, rank2: Rank): [Card, Card][] {
  const combos: [Card, Card][] = [];
  const suits: Suit[] = ['h', 'd', 'c', 's'];
  
  for (const s1 of suits) {
    for (const s2 of suits) {
      if (s1 !== s2) {
        combos.push([
          { rank: rank1, suit: s1 },
          { rank: rank2, suit: s2 }
        ]);
      }
    }
  }
  
  return combos;
}

function expandBothSuitedAndOffsuit(rank1: Rank, rank2: Rank): [Card, Card][] {
  return [...expandSuited(rank1, rank2), ...expandOffsuit(rank1, rank2)];
}

function parseRangeToken(token: string): [Card, Card][] {
  const t = token.trim().toUpperCase();
  
  if (t === 'RANDOM') {
    // Return all possible hands
    const combos: [Card, Card][] = [];
    for (const r1 of VALID_RANKS) {
      for (const r2 of VALID_RANKS) {
        if (r1 === r2) {
          combos.push(...expandPair(r1));
        } else if (RANK_ORDER[r1] > RANK_ORDER[r2]) {
          combos.push(...expandBothSuitedAndOffsuit(r1, r2));
        }
      }
    }
    return combos;
  }
  
  // Pair with + (e.g., TT+)
  if (t.length === 3 && t[0] === t[1] && t[2] === '+') {
    const startRank = t[0] as Rank;
    const startIdx = VALID_RANKS.indexOf(startRank);
    const combos: [Card, Card][] = [];
    
    for (let i = startIdx; i < VALID_RANKS.length; i++) {
      combos.push(...expandPair(VALID_RANKS[i]));
    }
    return combos;
  }
  
  // Pair (e.g., AA, KK)
  if (t.length === 2 && t[0] === t[1] && VALID_RANKS.includes(t[0] as Rank)) {
    return expandPair(t[0] as Rank);
  }
  
  // Suited with + (e.g., ATs+)
  if (t.length === 4 && t[2].toLowerCase() === 's' && t[3] === '+') {
    const r1 = t[0] as Rank;
    const r2 = t[1] as Rank;
    const startIdx = VALID_RANKS.indexOf(r2);
    const endIdx = VALID_RANKS.indexOf(r1);
    const combos: [Card, Card][] = [];
    
    for (let i = startIdx; i < endIdx; i++) {
      combos.push(...expandSuited(r1, VALID_RANKS[i]));
    }
    return combos;
  }
  
  // Suited (e.g., AKs)
  if (t.length === 3 && t[2].toLowerCase() === 's') {
    return expandSuited(t[0] as Rank, t[1] as Rank);
  }
  
  // Offsuit (e.g., AKo)
  if (t.length === 3 && t[2].toLowerCase() === 'o') {
    return expandOffsuit(t[0] as Rank, t[1] as Rank);
  }
  
  // Both suited and offsuit (e.g., AK)
  if (t.length === 2 && VALID_RANKS.includes(t[0] as Rank) && VALID_RANKS.includes(t[1] as Rank)) {
    return expandBothSuitedAndOffsuit(t[0] as Rank, t[1] as Rank);
  }
  
  // Pair range (e.g., 22-99)
  if (t.length === 5 && t[0] === t[1] && t[3] === t[4] && t[2] === '-') {
    const startRank = t[0] as Rank;
    const endRank = t[3] as Rank;
    const startIdx = VALID_RANKS.indexOf(startRank);
    const endIdx = VALID_RANKS.indexOf(endRank);
    const combos: [Card, Card][] = [];
    
    for (let i = Math.min(startIdx, endIdx); i <= Math.max(startIdx, endIdx); i++) {
      combos.push(...expandPair(VALID_RANKS[i]));
    }
    return combos;
  }
  
  throw new PokerEngineError('INVALID_RANGE', `Unknown range token: ${token}`);
}

export function parseRange(input: string): ParsedRange {
  const raw = input.trim();
  
  if (!raw) {
    throw new PokerEngineError('INVALID_RANGE', 'Range cannot be empty');
  }
  
  const tokens = raw.split(',').map(t => t.trim()).filter(t => t);
  const combos: [Card, Card][] = [];
  
  for (const token of tokens) {
    combos.push(...parseRangeToken(token));
  }
  
  // Dedupe
  const seen = new Set<string>();
  const unique: [Card, Card][] = [];
  
  for (const combo of combos) {
    const [c1, c2] = combo;
    const key1 = `${c1.rank}${c1.suit}-${c2.rank}${c2.suit}`;
    const key2 = `${c2.rank}${c2.suit}-${c1.rank}${c1.suit}`;
    
    if (!seen.has(key1) && !seen.has(key2)) {
      seen.add(key1);
      unique.push(combo);
    }
  }
  
  return { raw, combos: unique };
}
