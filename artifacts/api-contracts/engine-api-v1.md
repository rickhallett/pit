# Engine API Contract v1.0

**Status:** DRAFT  
**Author:** Architect  
**Date:** 2026-02-06  
**Sprint:** poker-tools-mvp

---

## Overview

REST API contract for the multi-engine poker equity calculator. Abstracts calculation engines behind a unified interface.

---

## Base URL

```
/api/poker
```

---

## Endpoints

### POST /api/poker/calculate

Main calculation endpoint. Computes hand equity against opponent range(s).

#### Request

```typescript
interface CalculateRequest {
  // Player's hole cards (required)
  hand: [Card, Card];
  
  // Community cards (0-5, empty for preflop)
  board?: Card[];
  
  // Opponent modeling
  opponents: OpponentConfig[];
  
  // Engine selection
  engine?: 'monte-carlo' | 'pokerstove' | 'auto';
  
  // Engine-specific options
  options?: EngineOptions;
}

interface Card {
  rank: '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | 'T' | 'J' | 'Q' | 'K' | 'A';
  suit: 'h' | 'd' | 'c' | 's';
}

interface OpponentConfig {
  // Hand range in standard notation (e.g., "AA,KK,QQ,AKs")
  // Or "random" for unknown
  range: string;
}

interface EngineOptions {
  // Monte Carlo iterations (default: 10000)
  iterations?: number;
  
  // Timeout in ms (default: 5000)
  timeoutMs?: number;
}
```

#### Response

```typescript
interface CalculateResponse {
  success: true;
  data: {
    // Win probability (0-1)
    equity: number;
    
    // Tie probability (0-1)
    tieEquity: number;
    
    // Combined equity (win + tie/2)
    combinedEquity: number;
    
    // Which engine performed the calculation
    engine: 'monte-carlo' | 'pokerstove';
    
    // Calculation metadata
    meta: {
      calculationTimeMs: number;
      iterationsRun?: number;        // Monte Carlo only
      confidenceInterval?: number;   // Monte Carlo only (±%)
      exact?: boolean;               // True if exhaustive enumeration
    };
    
    // Per-opponent breakdown (optional, future)
    breakdown?: EquityBreakdown[];
  };
}

interface EquityBreakdown {
  opponentIndex: number;
  winVs: number;
  tieVs: number;
}
```

#### Error Response

```typescript
interface ErrorResponse {
  success: false;
  error: {
    code: ErrorCode;
    message: string;
    details?: Record<string, unknown>;
  };
}

type ErrorCode = 
  | 'INVALID_HAND'        // Malformed card notation
  | 'INVALID_BOARD'       // Board card conflicts or malformed
  | 'INVALID_RANGE'       // Unparseable opponent range
  | 'CARD_CONFLICT'       // Same card appears multiple times
  | 'ENGINE_UNAVAILABLE'  // Requested engine not available
  | 'TIMEOUT'             // Calculation exceeded time limit
  | 'INTERNAL_ERROR';     // Unexpected failure
```

---

### GET /api/poker/engines

Returns available engines and their capabilities.

#### Response

```typescript
interface EnginesResponse {
  engines: EngineInfo[];
  default: string;
}

interface EngineInfo {
  id: string;
  name: string;
  available: boolean;
  capabilities: {
    maxOpponents: number;
    supportsRanges: boolean;
    exactCalculation: boolean;
    averageSpeedMs: number;  // For typical calculation
  };
}
```

---

### GET /api/poker/health

Health check for the calculation service.

#### Response

```typescript
interface HealthResponse {
  status: 'healthy' | 'degraded' | 'unhealthy';
  engines: {
    [engineId: string]: {
      status: 'up' | 'down';
      lastCheck: string;  // ISO timestamp
    };
  };
  timestamp: string;
}
```

---

## Engine Abstraction

Internal interface that all engines must implement:

```typescript
interface PokerEngine {
  readonly id: string;
  readonly name: string;
  
  // Check if engine is available/configured
  isAvailable(): Promise<boolean>;
  
  // Perform equity calculation
  calculate(params: EngineCalculateParams): Promise<EngineResult>;
  
  // Engine capabilities
  getCapabilities(): EngineCapabilities;
}

interface EngineCalculateParams {
  hand: [Card, Card];
  board: Card[];
  opponentRanges: ParsedRange[];
  options: EngineOptions;
  signal?: AbortSignal;  // For cancellation
}

interface EngineResult {
  equity: number;
  tieEquity: number;
  iterationsRun?: number;
  confidenceInterval?: number;
  exact: boolean;
}
```

---

## Range Notation

Standard poker range notation:

| Pattern | Meaning |
|---------|---------|
| `AA` | Pocket aces |
| `AKs` | Ace-king suited |
| `AKo` | Ace-king offsuit |
| `AK` | Ace-king (both suited and offsuit) |
| `TT+` | Tens or better |
| `ATs+` | AT suited or better |
| `22-99` | Pairs 22 through 99 |
| `random` | Any two cards |

Ranges can be combined with commas: `AA,KK,QQ,AKs`

---

## HTTP Status Codes

| Code | Meaning |
|------|---------|
| 200 | Success |
| 400 | Invalid request (bad cards, range, etc.) |
| 408 | Calculation timeout |
| 500 | Internal server error |
| 503 | Engine unavailable |

---

## Example Usage

### Preflop: AA vs random opponent

```bash
curl -X POST /api/poker/calculate \
  -H "Content-Type: application/json" \
  -d '{
    "hand": [{"rank": "A", "suit": "h"}, {"rank": "A", "suit": "s"}],
    "opponents": [{"range": "random"}]
  }'
```

Response:
```json
{
  "success": true,
  "data": {
    "equity": 0.852,
    "tieEquity": 0.006,
    "combinedEquity": 0.855,
    "engine": "monte-carlo",
    "meta": {
      "calculationTimeMs": 124,
      "iterationsRun": 10000,
      "confidenceInterval": 0.7
    }
  }
}
```

### Postflop: AKs on K-7-2 rainbow vs tight range

```bash
curl -X POST /api/poker/calculate \
  -H "Content-Type: application/json" \
  -d '{
    "hand": [{"rank": "A", "suit": "s"}, {"rank": "K", "suit": "s"}],
    "board": [
      {"rank": "K", "suit": "h"},
      {"rank": "7", "suit": "d"},
      {"rank": "2", "suit": "c"}
    ],
    "opponents": [{"range": "KK,77,22,AK,KQ"}]
  }'
```

---

## Implementation Notes

1. **Engine Priority:** Monte Carlo is the default. PokerStove integration is future work.

2. **Caching:** Consider caching exact calculations (full enumeration) as they're deterministic.

3. **Rate Limiting:** Not in MVP scope, but structure allows adding later.

4. **WebSocket:** Future consideration for streaming Monte Carlo progress.

---

## Open Questions

1. **Shorthand notation for cards?** — e.g., `"Ah"` instead of `{"rank":"A","suit":"h"}`
   - *Leaning yes for DX, parse server-side*

2. **Multi-way pots in MVP?** — Contract supports it, but do we implement >1 opponent?
   - *Defer to product decision*

---

*Contract version 1.0 — subject to refinement during implementation*
