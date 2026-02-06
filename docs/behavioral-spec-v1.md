# The Pit — Behavioral Specification v1

**Owner:** Architect
**Date:** 2026-02-06
**Status:** DRAFT — awaiting review
**Purpose:** Blueprint for automated tests and QA process

---

## 1. User Stories

### US-001: First-Time Visitor Views Landing Page

**As a** first-time visitor  
**I want to** see what The Pit is about immediately  
**So that** I can decide whether to try it

**Acceptance Criteria:**
- [ ] Landing page loads in < 2s on 3G
- [ ] Hero headline is visible above the fold
- [ ] At least one CTA ("Start a Bout" / "Watch a Fight") is visible without scrolling
- [ ] Mobile viewport (375px) renders correctly
- [ ] Countdown to Darwin Day (Feb 12) is visible

---

### US-002: User Selects a Preset and Starts a Bout

**As a** user  
**I want to** pick a preset battle theme  
**So that** I can watch AI personas fight without any setup

**Preconditions:**
- User is on the landing page or preset selector
- At least one preset is available

**Flow:**
1. User sees grid/carousel of preset cards
2. Each card shows: name, premise, agent count, tone indicator
3. User taps a preset card
4. System creates a bout and begins streaming

**Acceptance Criteria:**
- [ ] All 11 presets are visible and selectable
- [ ] Tap/click on preset initiates bout within 500ms
- [ ] User sees loading state while bout initializes
- [ ] If API fails, user sees friendly error message
- [ ] Preset selection is logged to metrics table

---

### US-003: User Watches a Bout in Real-Time

**As a** user who started a bout  
**I want to** watch the AI personas exchange messages live  
**So that** I feel engaged and entertained

**Preconditions:**
- Bout has been created and is in 'running' state

**Flow:**
1. Conversation UI appears with agent avatars/names
2. Messages stream in token-by-token
3. Each agent takes turns (round-robin)
4. Turn indicator shows who is "speaking"
5. Auto-scroll keeps latest message visible
6. Bout completes after configured number of turns

**Acceptance Criteria:**
- [ ] First token appears within 2s of bout start
- [ ] Token streaming is smooth (no jarring jumps)
- [ ] Agent names/avatars distinguish speakers clearly
- [ ] Turn number is visible (e.g., "Round 3 of 12")
- [ ] Model tier indicator is visible (Standard / Juiced / Unleashed)
- [ ] Bout completion triggers end-state UI (not abrupt stop)
- [ ] Network interruption triggers reconnection attempt
- [ ] If reconnection fails, user sees "Connection lost" with retry option

---

### US-004: User Shares a Completed Bout

**As a** user who just watched a bout  
**I want to** share the highlights with friends  
**So that** they can see what happened and try it themselves

**Preconditions:**
- Bout is in 'complete' state

**Flow:**
1. Share button becomes active after bout completes
2. User taps "Share"
3. System generates share text with best exchange + link
4. Copy-to-clipboard modal appears with preview
5. User copies and pastes to their platform of choice

**Acceptance Criteria:**
- [ ] Share button only active after bout complete
- [ ] Share text follows format:
  ```
  🏟 THE PIT — Round X
  🤖 [Agent1]: "[quote]"
  🤖 [Agent2]: "[response]"
  ⚔️ Watch the full bout: thepit.cloud/b/[id]
  ```
- [ ] Copy button works on mobile Safari, Chrome, Firefox
- [ ] Link in share text is a valid permalink to the bout
- [ ] Share action is logged to metrics table

---

### US-005: User Views a Shared Bout Replay

**As a** visitor who clicked a share link  
**I want to** see the bout that was shared  
**So that** I understand the context and want to try it myself

**Preconditions:**
- Bout exists and is in 'complete' state

**Flow:**
1. User opens link: `thepit.cloud/b/[id]`
2. Page loads completed bout
3. Replay starts automatically with original pacing
4. After replay, user sees CTA to start their own bout

**Acceptance Criteria:**
- [ ] Permalink loads bout from database
- [ ] Replay renders with same UI as live bout
- [ ] Messages appear with timing based on original `created_at` timestamps
- [ ] Invalid bout ID shows 404 with CTA to start fresh
- [ ] Replay completion shows "Start Your Own Bout" CTA
- [ ] Replay view is logged to metrics table

---

### US-006: User Joins Waitlist

**As a** engaged visitor  
**I want to** sign up for updates  
**So that** I know when new features launch

**Preconditions:**
- Email capture form is visible

**Flow:**
1. User enters email address
2. User submits form
3. System validates email format
4. System stores email in waitlist table
5. User sees confirmation message

**Acceptance Criteria:**
- [ ] Email input validates format before submission
- [ ] Invalid email shows inline error
- [ ] Duplicate email shows "You're already on the list!"
- [ ] Success shows "You're in! We'll let you know."
- [ ] Email + source + timestamp stored in waitlist table
- [ ] Form works on mobile keyboards (input type="email")

---

### US-007: Rate Limiting Prevents Abuse

**As the** system  
**I want to** limit bouts per IP  
**So that** one user can't drain the API budget

**Preconditions:**
- User has already used their free bout allocation

**Flow:**
1. User attempts to start another bout
2. System checks IP hash against rate limit
3. If over limit, bout creation is blocked
4. User sees "You've had your share for now. Come back later."

**Acceptance Criteria:**
- [ ] First N bouts per IP are allowed (N = configurable, default 3)
- [ ] Bout N+1 is blocked with friendly message
- [ ] Rate limit resets after configurable window (default 1 hour)
- [ ] Rate limit is per IP hash (never store raw IP)
- [ ] Blocked attempts are logged to metrics table

---

### US-008: "Rawdog" Mode — Custom Topic

**As a** power user  
**I want to** set my own debate topic  
**So that** I can see AI personas argue about something specific

**Preconditions:**
- User is on preset selector
- "Gloves Off" preset supports user input

**Flow:**
1. User selects "Gloves Off" preset
2. Topic input field appears
3. User enters a topic (e.g., "Is a hot dog a sandwich?")
4. User confirms and starts bout
5. Agents debate the user's topic

**Acceptance Criteria:**
- [ ] Only "Gloves Off" preset shows topic input
- [ ] Topic input is optional (default topics exist)
- [ ] Topic is injected into system prompt for all agents
- [ ] Topic is stored in bout metadata
- [ ] Topic appears in share text if present

---

## 2. API Contract

### Base URL
- Development: `http://localhost:5000/api`
- Production: `https://api.thepit.cloud/api` (or same-origin `/api`)

### Endpoints

#### POST /api/bout
Create and start a new bout.

**Request:**
```json
{
  "preset_id": "darwin-special",
  "topic": "optional custom topic for gloves-off",
  "model_tier": "standard"
}
```

**Response (201 Created):**
```json
{
  "bout_id": "abc123xyz",
  "status": "running",
  "stream_url": "/api/bout/abc123xyz/stream",
  "agents": [
    {"name": "Darwin", "role": "The Naturalist"},
    {"name": "Tech Bro", "role": "The Disruptor"},
    {"name": "Conspiracy Theorist", "role": "The Skeptic"},
    {"name": "House Cat", "role": "The Indifferent"}
  ]
}
```

**Error Responses:**
- `400 Bad Request` — invalid preset_id or malformed request
- `429 Too Many Requests` — rate limit exceeded
- `500 Internal Server Error` — unexpected failure

---

#### GET /api/bout/:id
Get bout status and transcript.

**Response (200 OK):**
```json
{
  "bout_id": "abc123xyz",
  "preset_id": "darwin-special",
  "status": "complete",
  "model_tier": "standard",
  "agent_count": 4,
  "total_turns": 12,
  "token_cost": 0.015,
  "created_at": "2026-02-06T10:30:00Z",
  "completed_at": "2026-02-06T10:32:15Z",
  "messages": [
    {
      "id": "msg001",
      "agent_name": "Darwin",
      "agent_role": "The Naturalist",
      "turn_number": 1,
      "content": "Natural selection isn't just a theory...",
      "created_at": "2026-02-06T10:30:05Z"
    }
  ]
}
```

**Error Responses:**
- `404 Not Found` — bout doesn't exist

---

#### GET /api/bout/:id/stream
Server-Sent Events stream for live bout.

**Event Types:**
```
event: turn_start
data: {"agent_name": "Darwin", "turn_number": 1}

event: token
data: {"token": "Natural"}

event: token
data: {"token": " selection"}

event: turn_end
data: {"agent_name": "Darwin", "turn_number": 1, "message_id": "msg001"}

event: bout_complete
data: {"bout_id": "abc123xyz", "total_cost": 0.015}

event: error
data: {"code": "API_TIMEOUT", "message": "Bot got knocked out. Try again."}
```

**Headers:**
```
Content-Type: text/event-stream
Cache-Control: no-cache
Connection: keep-alive
```

---

#### GET /api/bout/:id/share
Generate share text for completed bout.

**Response (200 OK):**
```json
{
  "text": "🏟 THE PIT — Round 3\n🤖 Darwin: \"Natural selection isn't just a theory—\"\n🤖 Tech Bro: \"Bro, have you tried disrupting evolution?\"\n⚔️ Watch the full bout: thepit.cloud/b/abc123xyz",
  "permalink": "https://thepit.cloud/b/abc123xyz"
}
```

**Error Responses:**
- `400 Bad Request` — bout not complete
- `404 Not Found` — bout doesn't exist

---

#### POST /api/waitlist
Add email to waitlist.

**Request:**
```json
{
  "email": "user@example.com",
  "source": "post-bout"
}
```

**Response (201 Created):**
```json
{
  "status": "success",
  "message": "You're in!"
}
```

**Error Responses:**
- `400 Bad Request` — invalid email format
- `409 Conflict` — email already registered

---

#### GET /api/presets
List available presets.

**Response (200 OK):**
```json
{
  "presets": [
    {
      "id": "darwin-special",
      "name": "The Darwin Special",
      "premise": "Evolution meets disruption",
      "tone": "Intellectual chaos",
      "agent_count": 4,
      "featured": true,
      "user_input": false
    }
  ]
}
```

---

## 3. System Behaviors

### Bout State Machine

```
┌─────────┐    create()    ┌─────────┐
│ (none)  │ ──────────────▶│ pending │
└─────────┘                └────┬────┘
                                │
                           start()
                                │
                                ▼
                          ┌─────────┐
                    ┌─────│ running │─────┐
                    │     └────┬────┘     │
                    │          │          │
               error()    complete()   timeout()
                    │          │          │
                    ▼          ▼          ▼
              ┌─────────┐ ┌─────────┐ ┌─────────┐
              │  error  │ │complete │ │ timeout │
              └─────────┘ └─────────┘ └─────────┘
```

### Turn Management Rules

1. Agents speak in round-robin order (agent 0 → 1 → 2 → 3 → 0 → ...)
2. Each agent sees full conversation history + their system prompt
3. Turn count is configurable per model tier:
   - Standard: 12 turns
   - Juiced: 24 turns
   - Unleashed: 48 turns
4. If an agent API call fails, skip that turn and continue
5. If 3 consecutive API failures, abort bout with 'error' status

### Token Budget Enforcement

1. Each bout has a max token budget based on tier
2. TokenMeter tracks cumulative usage per bout
3. If budget exceeded mid-turn, complete current turn then end bout
4. Final cost is stored in bout record

### Rate Limiting Logic

1. Hash IP address (never store raw)
2. Check count of bouts from IP hash in last N minutes
3. If count >= limit, reject with 429
4. On successful bout creation, log to metrics with IP hash

---

## 4. Edge Cases

| Scenario | Expected Behavior |
|----------|-------------------|
| API timeout mid-turn | Retry once, then skip turn and continue |
| 3+ consecutive API failures | Abort bout, set status='error', show user-friendly message |
| User closes tab during bout | Bout continues server-side, viewable via replay |
| SSE connection drops | Client auto-reconnects, resumes from last received message |
| Malformed preset JSON | Return 500 at startup, don't serve broken presets |
| Empty system prompt | Use fallback "You are a participant in a debate" |
| Duplicate waitlist email | Return 409 with friendly message, don't insert |
| Invalid bout ID in URL | Return 404 with CTA to start fresh |
| Extremely long agent response | Truncate at max_tokens, continue normally |

---

## 5. Database Schema

### bouts
| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| id | TEXT | PRIMARY KEY | nanoid |
| preset_id | TEXT | | nullable for custom |
| status | TEXT | NOT NULL | pending, running, complete, error, timeout |
| model_tier | TEXT | NOT NULL | standard, juiced, unleashed |
| topic | TEXT | | custom topic for Gloves Off |
| agent_count | INTEGER | NOT NULL | |
| total_turns | INTEGER | DEFAULT 0 | |
| token_cost | REAL | DEFAULT 0 | |
| created_at | TIMESTAMP | NOT NULL | |
| completed_at | TIMESTAMP | | |
| ip_hash | TEXT | | rate limiting |
| metadata | JSONB | | future flexibility |

### messages
| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| id | TEXT | PRIMARY KEY | nanoid |
| bout_id | TEXT | FK → bouts | |
| agent_name | TEXT | NOT NULL | |
| agent_role | TEXT | | |
| turn_number | INTEGER | NOT NULL | |
| content | TEXT | NOT NULL | |
| tokens_in | INTEGER | DEFAULT 0 | |
| tokens_out | INTEGER | DEFAULT 0 | |
| model_used | TEXT | | actual model string |
| created_at | TIMESTAMP | NOT NULL | |
| latency_ms | INTEGER | | time-to-first-token |

### waitlist
| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| id | TEXT | PRIMARY KEY | |
| email | TEXT | UNIQUE, NOT NULL | |
| source | TEXT | | landing, post-bout, share-link |
| created_at | TIMESTAMP | NOT NULL | |
| ip_hash | TEXT | | |

### metrics
| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| id | TEXT | PRIMARY KEY | |
| event | TEXT | NOT NULL | bout_start, bout_complete, share_click, etc |
| bout_id | TEXT | | optional |
| payload | JSONB | | |
| created_at | TIMESTAMP | NOT NULL | |
| ip_hash | TEXT | | |

---

## 6. Test Categories

### Unit Tests
- [ ] AgentRunner: correct model selection, prompt construction
- [ ] TurnManager: round-robin ordering, state tracking
- [ ] TokenMeter: accurate accumulation, budget enforcement
- [ ] ShareGenerator: correct format, best-exchange selection
- [ ] Rate limiter: count tracking, window reset

### Integration Tests
- [ ] Full bout lifecycle: create → run → complete
- [ ] SSE stream delivers all events in order
- [ ] Database records match API responses
- [ ] Preset loading validates all 11 presets

### E2E Tests
- [ ] Mobile: select preset → watch bout → share → waitlist
- [ ] Replay: open permalink → watch replay → start new bout
- [ ] Rate limit: exceed limit → see friendly block message
- [ ] Error recovery: simulate API failure → graceful degradation

---

## 7. Open Questions for Kai

1. **Monorepo or separate repos?** (Affects project structure)
2. **Postgres hosting?** (Supabase / Railway / self-hosted?)
3. **Haiku version?** (3.5 assumed — no 4.5 exists)
4. **Max turns per tier?** (Spec says 12/24/48 — confirm?)
5. **Rate limit defaults?** (3 bouts per hour per IP?)

---

*This spec is the contract. Implementation follows this. Tests verify this.*
