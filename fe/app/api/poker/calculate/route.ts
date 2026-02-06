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
 * POST /api/poker/calculate
 * 
 * Main equity calculation endpoint.
 * Accepts hole cards, board, and opponent ranges.
 * Returns equity percentages with confidence metrics.
 */

import { NextRequest, NextResponse } from 'next/server';
import { 
  getEngine, 
  getDefaultEngine,
  parseRange, 
  parseCard,
  parseHand,
  parseBoard,
  PokerEngineError,
  type Card,
  type ParsedRange,
} from '@/lib/engines';

// ============================================================================
// Types
// ============================================================================

interface CardInput {
  rank: string;
  suit: string;
}

interface OpponentInput {
  range: string;
}

interface CalculateRequestBody {
  hand: [CardInput, CardInput] | string;
  board?: CardInput[] | string;
  opponents: OpponentInput[];
  engine?: 'monte-carlo' | 'pokerstove' | 'auto';
  options?: {
    iterations?: number;
    timeoutMs?: number;
  };
}

interface CalculateResponse {
  success: true;
  data: {
    equity: number;
    tieEquity: number;
    combinedEquity: number;
    engine: string;
    meta: {
      calculationTimeMs: number;
      iterationsRun?: number;
      confidenceInterval?: number;
      exact?: boolean;
    };
  };
}

interface ErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: Record<string, unknown>;
  };
}

// ============================================================================
// Validation
// ============================================================================

function parseCardInput(input: CardInput | string): Card {
  if (typeof input === 'string') {
    return parseCard(input);
  }
  
  const { rank, suit } = input;
  if (!rank || !suit) {
    throw new PokerEngineError('INVALID_HAND', 'Card must have rank and suit');
  }
  
  return parseCard(`${rank}${suit}`);
}

function parseHandInput(input: [CardInput, CardInput] | string): [Card, Card] {
  if (typeof input === 'string') {
    return parseHand(input);
  }
  
  const [c1, c2] = input;
  return [parseCardInput(c1), parseCardInput(c2)];
}

function parseBoardInput(input?: CardInput[] | string): Card[] {
  if (!input) return [];
  
  if (typeof input === 'string') {
    if (!input.trim()) return [];
    return parseBoard(input);
  }
  
  return input.map(parseCardInput);
}

function validateNoConflicts(hand: [Card, Card], board: Card[], ranges: ParsedRange[]): void {
  const seen = new Map<string, string>();
  
  const checkCard = (card: Card, source: string) => {
    const key = `${card.rank}${card.suit}`;
    if (seen.has(key)) {
      throw new PokerEngineError('CARD_CONFLICT', 
        `Card ${key} appears in both ${seen.get(key)} and ${source}`);
    }
    seen.set(key, source);
  };
  
  hand.forEach((c, i) => checkCard(c, `hand[${i}]`));
  board.forEach((c, i) => checkCard(c, `board[${i}]`));
  
  // Note: We don't check ranges for conflicts here because ranges
  // represent *possible* hands, and the Monte Carlo engine handles
  // filtering to available cards during simulation
}

// ============================================================================
// Handler
// ============================================================================

export async function POST(request: NextRequest): Promise<NextResponse<CalculateResponse | ErrorResponse>> {
  const startTime = performance.now();
  
  try {
    const body = await request.json() as CalculateRequestBody;
    
    // Validate required fields
    if (!body.hand) {
      return NextResponse.json({
        success: false,
        error: { code: 'INVALID_HAND', message: 'hand is required' }
      }, { status: 400 });
    }
    
    if (!body.opponents || !Array.isArray(body.opponents) || body.opponents.length === 0) {
      return NextResponse.json({
        success: false,
        error: { code: 'INVALID_RANGE', message: 'At least one opponent is required' }
      }, { status: 400 });
    }
    
    // Parse inputs
    const hand = parseHandInput(body.hand);
    const board = parseBoardInput(body.board);
    const opponentRanges = body.opponents.map(o => parseRange(o.range));
    
    // Validate no card conflicts
    validateNoConflicts(hand, board, opponentRanges);
    
    // Select engine
    let engine = getDefaultEngine();
    if (body.engine && body.engine !== 'auto') {
      const requested = getEngine(body.engine);
      if (!requested) {
        return NextResponse.json({
          success: false,
          error: { code: 'ENGINE_UNAVAILABLE', message: `Unknown engine: ${body.engine}` }
        }, { status: 400 });
      }
      if (!(await requested.isAvailable())) {
        return NextResponse.json({
          success: false,
          error: { code: 'ENGINE_UNAVAILABLE', message: `Engine not available: ${body.engine}` }
        }, { status: 503 });
      }
      engine = requested;
    }
    
    // Create abort controller for timeout
    const controller = new AbortController();
    const timeoutMs = body.options?.timeoutMs ?? 5000;
    const timeout = setTimeout(() => controller.abort(), timeoutMs);
    
    try {
      // Run calculation
      const result = await engine.calculate({
        hand,
        board,
        opponentRanges,
        options: {
          iterations: body.options?.iterations,
          timeoutMs,
        },
        signal: controller.signal,
      });
      
      const calculationTimeMs = Math.round(performance.now() - startTime);
      
      return NextResponse.json({
        success: true,
        data: {
          equity: Math.round(result.equity * 10000) / 10000,
          tieEquity: Math.round(result.tieEquity * 10000) / 10000,
          combinedEquity: Math.round((result.equity + result.tieEquity / 2) * 10000) / 10000,
          engine: engine.id,
          meta: {
            calculationTimeMs,
            iterationsRun: result.iterationsRun,
            confidenceInterval: result.confidenceInterval,
            exact: result.exact,
          },
        },
      });
      
    } finally {
      clearTimeout(timeout);
    }
    
  } catch (error) {
    if (error instanceof PokerEngineError) {
      const status = error.code === 'TIMEOUT' ? 408 : 400;
      return NextResponse.json({
        success: false,
        error: {
          code: error.code,
          message: error.message,
          details: error.details,
        }
      }, { status });
    }
    
    // Unexpected error
    console.error('Calculation error:', error);
    return NextResponse.json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'An unexpected error occurred',
      }
    }, { status: 500 });
  }
}
