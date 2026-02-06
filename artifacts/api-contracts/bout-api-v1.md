# Bout API Contract v1.0

**Status:** DRAFT  
**Author:** Architect  
**Date:** 2026-02-06  
**Sprint:** the-pit-mvp  
**Validates:** Analyst gaps (audienceSize, domainHint, topic length, intensity)

---

## Overview

REST API contract for The Pit bout system. Creates, streams, and manages multi-agent debate sessions.

---

## Base URL

```
/api
```

---

## Enums

### BoutStatus

```typescript
type BoutStatus = 'pending' | 'running' | 'voting' | 'complete' | 'error' | 'timeout';
```

### TurnType

```typescript
type TurnType = 'alternating' | 'broadcast' | 'round_robin';
```

| Value | Description |
|-------|-------------|
| `alternating` | 2-agent back-and-forth (Roast Battle, Gloves Off) |
| `broadcast` | All agents respond to same prompt simultaneously |
| `round_robin` | Agents take turns in order (3-4 agent presets) |

### ModelTier

```typescript
type ModelTier = 'standard' | 'juiced' | 'unleashed';
```

| Tier | Model | Max Turns | Cost/Bout |
|------|-------|-----------|-----------|
| `standard` | Haiku | 48 | ~$0.02 |
| `juiced` | Sonnet | 24 | ~$0.15 |
| `unleashed` | Opus | 12 | ~$0.60 |

### DomainHint

```typescript
type DomainHint = 
  | 'philosophy'
  | 'tech'
  | 'politics'
  | 'comedy'
  | 'science'
  | 'culture'
  | 'business'
  | 'creative'
  | 'general';
```

Used for:
- Metrics/analytics categorization
- Future: content recommendations
- Future: model prompt tuning per domain

### Intensity

```typescript
type Intensity = 'civil' | 'spirited' | 'heated' | 'unhinged';
```

| Level | Description | System Prompt Modifier |
|-------|-------------|------------------------|
| `civil` | Polite disagreement, academic tone | "Maintain respectful discourse" |
| `spirited` | Energetic debate, some jabs | "Be direct and assertive" |
| `heated` | Gloves off, personal attacks allowed | "No holds barred" |
| `unhinged` | Maximum chaos, pure entertainment | "Go absolutely feral" |

Default: `spirited` (the sweet spot for entertainment)

---

## Endpoints

### POST /api/bout

Create and start a new bout.

#### Request

```typescript
interface CreateBoutRequest {
  // Required
  preset_id: string;  // e.g., 'darwin-special', 'roast-battle'
  
  // Optional
  topic?: string;           // Custom topic (Gloves Off only)
  model_tier?: ModelTier;   // Default: 'standard'
  intensity?: Intensity;    // Default: 'spirited'
  domain_hint?: DomainHint; // Default: 'general'
  audience_size?: AudienceSize;  // Default: 'solo'
}

// Topic constraints
const TOPIC_CONSTRAINTS = {
  minLength: 3,
  maxLength: 280,  // Tweet-length for shareability
  pattern: /^[^<>{}]*$/,  // No injection attempts
};

// Audience size affects voting UX (future feature)
type AudienceSize = 'solo' | 'small' | 'medium' | 'large' | 'viral';
```

| AudienceSize | Expected Viewers | UX Implications |
|--------------|------------------|-----------------|
| `solo` | 1 (just creator) | No voting UI, instant replay |
| `small` | 2-10 | Simple winner vote |
| `medium` | 11-100 | Voting with rationale |
| `large` | 101-1000 | Live vote counter |
| `viral` | 1000+ | Aggregated stats, sampling |

#### Response (201 Created)

```typescript
interface CreateBoutResponse {
  bout_id: string;        // nanoid, e.g., 'abc123xyz'
  share_id: string;       // Short ID for URLs
  status: BoutStatus;
  stream_url: string;     // SSE endpoint
  agents: BoutAgent[];
  config: {
    max_turns: number;
    turn_type: TurnType;
    intensity: Intensity;
    model_tier: ModelTier;
    domain_hint: DomainHint;
  };
  created_at: string;     // ISO timestamp
}

interface BoutAgent {
  id: string;
  name: string;
  role: string;           // Brief description
  turn_order: number;
  is_initiator: boolean;
}
```

#### Error Responses

| Status | Code | When |
|--------|------|------|
| 400 | `INVALID_PRESET` | preset_id not found |
| 400 | `INVALID_TOPIC` | Topic too long, too short, or contains forbidden chars |
| 400 | `TOPIC_NOT_ALLOWED` | Topic provided for non-Gloves-Off preset |
| 400 | `INVALID_INTENSITY` | Unknown intensity level |
| 400 | `INVALID_DOMAIN` | Unknown domain_hint |
| 429 | `RATE_LIMITED` | Too many bouts from this IP |
| 500 | `INTERNAL_ERROR` | Unexpected failure |

```typescript
interface ErrorResponse {
  error: {
    code: string;
    message: string;
    details?: Record<string, unknown>;
  };
}
```

---

### GET /api/bout/:id

Get bout status and transcript.

#### Response (200 OK)

```typescript
interface GetBoutResponse {
  bout_id: string;
  share_id: string;
  preset_id: string;
  status: BoutStatus;
  config: {
    model_tier: ModelTier;
    intensity: Intensity;
    domain_hint: DomainHint;
    audience_size: AudienceSize;
    max_turns: number;
    turn_type: TurnType;
  };
  topic?: string;
  agents: BoutAgent[];
  current_round: number;
  total_turns: number;
  token_cost: number;
  created_at: string;
  completed_at?: string;
  messages: BoutMessage[];
}

interface BoutMessage {
  id: string;
  agent_id: string;
  agent_name: string;
  turn_number: number;
  round_number: number;
  content: string;
  created_at: string;
}
```

#### Error Responses

| Status | Code | When |
|--------|------|------|
| 404 | `BOUT_NOT_FOUND` | Invalid bout_id |

---

### GET /api/bout/:id/stream

Server-Sent Events stream for live bout.

#### Event Types

```typescript
// Turn starting
interface TurnStartEvent {
  event: 'turn_start';
  data: {
    agent_id: string;
    agent_name: string;
    turn_number: number;
    round_number: number;
  };
}

// Token streaming
interface TokenEvent {
  event: 'token';
  data: {
    token: string;
    agent_id: string;
  };
}

// Turn complete
interface TurnEndEvent {
  event: 'turn_end';
  data: {
    agent_id: string;
    agent_name: string;
    turn_number: number;
    message_id: string;
    tokens_used: number;
  };
}

// Bout complete
interface BoutCompleteEvent {
  event: 'bout_complete';
  data: {
    bout_id: string;
    total_turns: number;
    total_cost: number;
    duration_ms: number;
  };
}

// Error during bout
interface BoutErrorEvent {
  event: 'error';
  data: {
    code: string;
    message: string;
    recoverable: boolean;
    agent_id?: string;  // Which agent failed, if applicable
  };
}
```

#### Headers

```http
Content-Type: text/event-stream
Cache-Control: no-cache
Connection: keep-alive
X-Accel-Buffering: no
```

---

### GET /api/bout/:id/share

Generate share text for completed bout.

#### Response (200 OK)

```typescript
interface ShareResponse {
  text: string;           // Copy-paste ready text
  permalink: string;      // Full URL
  best_exchange: {        // The highlight
    agent_a: string;
    quote_a: string;
    agent_b: string;
    quote_b: string;
    round: number;
  };
  og_meta: {              // For link previews
    title: string;
    description: string;
    image_url?: string;
  };
}
```

Example `text`:
```
🏟 THE PIT — Round 3
🤖 Darwin: "Natural selection isn't just a theory—"
🤖 Tech Bro: "Bro, have you tried disrupting evolution?"
⚔️ Watch the full bout: thepit.cloud/b/abc123
```

#### Error Responses

| Status | Code | When |
|--------|------|------|
| 400 | `BOUT_NOT_COMPLETE` | Can't share while running |
| 404 | `BOUT_NOT_FOUND` | Invalid bout_id |

---

### GET /api/presets

List available presets.

#### Response (200 OK)

```typescript
interface PresetsResponse {
  presets: PresetInfo[];
}

interface PresetInfo {
  id: string;
  name: string;
  description: string;
  premise: string;        // One-liner hook
  agent_count: number;
  turn_type: TurnType;
  default_intensity: Intensity;
  tone: string;           // "Intellectual chaos", "Dark comedy", etc.
  featured: boolean;
  user_input: boolean;    // True for Gloves Off
  free_tier_access: boolean;
  agents: {
    name: string;
    role: string;
  }[];
}
```

---

### POST /api/waitlist

Add email to waitlist.

#### Request

```typescript
interface WaitlistRequest {
  email: string;
  source?: 'landing' | 'post-bout' | 'share-link';
}
```

#### Response (201 Created)

```typescript
interface WaitlistResponse {
  status: 'success';
  message: string;
}
```

#### Error Responses

| Status | Code | When |
|--------|------|------|
| 400 | `INVALID_EMAIL` | Malformed email |
| 409 | `ALREADY_REGISTERED` | Email exists |

---

### GET /api/health

Service health check.

#### Response (200 OK)

```typescript
interface HealthResponse {
  status: 'healthy' | 'degraded' | 'unhealthy';
  services: {
    database: 'up' | 'down';
    anthropic: 'up' | 'down' | 'rate_limited';
    streaming: 'up' | 'down';
  };
  version: string;
  timestamp: string;
}
```

---

## Validation Rules

### Topic

| Rule | Value |
|------|-------|
| Min length | 3 characters |
| Max length | 280 characters |
| Forbidden | `<`, `>`, `{`, `}` (XSS prevention) |
| Required for | Gloves Off preset only |
| Optional default | Preset-specific topic rotation |

### Rate Limiting

| Rule | Value |
|------|-------|
| Window | 1 hour |
| Max bouts per IP | 3 (free tier) |
| Storage | IP hash only (never raw IP) |
| Response | 429 with Retry-After header |

---

## Schema Alignment

Maps to Drizzle schema in `pit/docs/schema-revision-v2.md`:

| API Field | DB Column | Table |
|-----------|-----------|-------|
| `preset_id` | `preset_id` | bouts |
| `topic` | `topic` | bouts |
| `model_tier` | Derived from model selection | bout_agents |
| `intensity` | `metadata.intensity` | bouts |
| `domain_hint` | `metadata.domain_hint` | bouts |
| `audience_size` | `metadata.audience_size` | bouts |
| `status` | `status` | bouts |
| `share_id` | `share_id` | bouts |

---

## Open Items

1. **Voting endpoints** — deferred to post-MVP
2. **Custom persona creation** — deferred to v0.2
3. **BYOK integration** — deferred to v0.2
4. **Image generation for share cards** — deferred (text share is MVP)

---

*Contract version 1.0 — aligns with schema-revision-v2 and addresses Analyst's validation gaps*
