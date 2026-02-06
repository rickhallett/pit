# Development Roadmap — The Pit MVP

> ⚠️ **HISTORICAL DOCUMENT** — Written 2026-02-05 for TypeScript/Turso/Drizzle stack.  
> The project has since migrated to **Python/FastAPI + PostgreSQL/SQLAlchemy**.  
> See `be/` for current backend, `fe/` for frontend. MANIFEST.md is the source of truth.

**Owner:** Architect
**Date:** 2026-02-05
**Sprint:** Feb 5–12 (Darwin Day launch)
**Status:** SUPERSEDED — retained for historical reference

---

## Philosophy

Ship in coherent layers. Each chunk produces a testable, demonstrable artifact. No chunk depends on work that hasn't been gated yet. The audit trail is as much a deliverable as the product.

---

## Chunk Overview

```text
                        ┌──────────────────────┐
                        │   CHUNK 1: SKELETON   │  Day 1
                        │  scaffold + schema +  │
                        │    CI + gate script   │
                        └──────────┬───────────┘
                                   │
                        ┌──────────▼───────────┐
                        │  CHUNK 2: ENGINE CORE │  Day 2–3
                        │  orchestrator + agent │
                        │  runner + turn mgmt + │
                        │  presets + headless    │
                        │  bout (CLI-testable)   │
                        └──────────┬───────────┘
                                   │
                   ┌───────────────┼───────────────┐
                   │               │               │
          ┌────────▼──────┐ ┌─────▼──────┐ ┌──────▼───────┐
          │ CHUNK 3: LIVE │ │ CHUNK 4:   │ │ CHUNK 4:     │  Day 4–5
          │  STREAMING +  │ │  SHARE     │ │  WAITLIST +  │
          │  MOBILE UI    │ │  MECHANIC  │ │  LANDING     │
          └────────┬──────┘ └─────┬──────┘ └──────┬───────┘
                   │               │               │
                   └───────────────┼───────────────┘
                                   │
                        ┌──────────▼───────────┐
                        │  CHUNK 5: HARDEN +   │  Day 6–7
                        │  RATE LIMIT + DEPLOY  │
                        │  + LAUNCH PREP        │
                        └──────────────────────┘
```

---

## CHUNK 1: Skeleton (Day 1)

**Goal:** Repo structure, database, CI pipeline, quality gate. Everything that follows hangs on this.

| # | Task | Detail |
|---|------|--------|
| 1.1 | Next.js 15 scaffold | `create-next-app` + TS + Tailwind + App Router |
| 1.2 | Repo structure | `src/engine/`, `src/store/`, `src/app/` (web). Engine is a library, not a route. |
| 1.3 | Turso + Drizzle setup | Connection config, `drizzle.config.ts`, local dev SQLite fallback |
| 1.4 | DB schema v1 | Tables: `bouts`, `messages`, `waitlist`, `metrics` (see below) |
| 1.5 | `bin/gate` script | lint + typecheck + test + build. Exit 0 = ship. |
| 1.6 | GitHub Actions CI | Run `bin/gate` on every PR. Blacksmith runners. |
| 1.7 | CodeRabbit config | `.coderabbit.yaml` — auto-review on PRs |
| 1.8 | Package deps | anthropic SDK, drizzle-orm, @libsql/client, ws/socket.io |
| 1.9 | Env template | `.env.example` with all required vars |

### DB Schema v1

```sql
-- bouts
id          TEXT PRIMARY KEY    -- nanoid
preset_id   TEXT                -- e.g. "last-supper", NULL for custom
status      TEXT NOT NULL       -- 'pending' | 'running' | 'complete' | 'error'
model_tier  TEXT NOT NULL       -- 'standard' | 'juiced' | 'unleashed'
agent_count INTEGER NOT NULL
total_turns INTEGER NOT NULL DEFAULT 0
token_cost  REAL DEFAULT 0
created_at  TEXT NOT NULL       -- ISO8601
completed_at TEXT
ip_hash     TEXT                -- rate limiting, never store raw IP
metadata    TEXT                -- JSON blob for future flexibility

-- messages
id          TEXT PRIMARY KEY
bout_id     TEXT NOT NULL REFERENCES bouts(id)
agent_name  TEXT NOT NULL       -- display name
agent_role  TEXT                -- from preset config
turn_number INTEGER NOT NULL
content     TEXT NOT NULL
tokens_in   INTEGER DEFAULT 0
tokens_out  INTEGER DEFAULT 0
model_used  TEXT                -- actual model string
created_at  TEXT NOT NULL
latency_ms  INTEGER             -- time-to-first-token

-- waitlist
id          TEXT PRIMARY KEY
email       TEXT NOT NULL UNIQUE
source      TEXT                -- 'landing' | 'post-bout' | 'share-link'
created_at  TEXT NOT NULL
ip_hash     TEXT

-- metrics
id          TEXT PRIMARY KEY
event       TEXT NOT NULL       -- 'bout_start' | 'bout_complete' | 'share_click' | etc
bout_id     TEXT
payload     TEXT                -- JSON
created_at  TEXT NOT NULL
ip_hash     TEXT
```

**Analyst note:** `metrics` is intentionally loose. Structured enough to query, flexible enough to evolve. We're not building a data warehouse on day 1 — we're building a log we can mine later.

### Dependencies
None. This is the root.

### 🚪 GATE 1: Rick reviews scaffold + schema
- Can `bin/gate` run clean?
- Is the DB schema sane?
- Does the repo structure make sense for multi-storefront?
- **This is the most important gate.** Wrong foundation = wrong everything.

---

## CHUNK 2: Engine Core (Day 2–3)

**Goal:** Run a full bout headless. Pick preset, create bout, agents exchange messages, transcript lands in DB. No UI needed — CLI/test runner proves it works.

| # | Task | Depends on | Detail |
|---|------|-----------|--------|
| 2.1 | `AgentRunner` | 1.8 | Anthropic SDK wrapper. Takes system prompt + conversation history, returns response. Model-agnostic (pass model string). Streams response. |
| 2.2 | `TurnManager` | — | Round-robin across N agents. Maintains conversation state. Handles turn ordering. |
| 2.3 | `Orchestrator` | 2.1, 2.2, 1.4 | Bout lifecycle: `create(preset) → start() → runTurns(maxTurns) → complete()`. Writes messages to DB as they arrive. |
| 2.4 | `TokenMeter` | 2.1 | Reads usage from Anthropic response. Accumulates per-bout. Enforces budget cap. |
| 2.5 | Preset loader | — | Read preset JSON from `src/store/presets/`. Validate shape. Return typed config. |
| 2.6 | Load all 11 presets | 2.5 | Port all presets from Strategist's delivery into `src/store/presets/`. Each preset = dir with `meta.json` + character `.md` files. |
| 2.7 | Integration test | 2.3, 2.6 | `pnpm test:bout` — creates a bout with "The Darwin Special", runs 4 turns on Haiku, asserts messages in DB. |
| 2.8 | CLI runner | 2.3 | `pnpm bout:run --preset darwin-special --turns 12` — watch a bout in terminal. Dev tool + smoke test. |

### Key Design Decisions

**AgentRunner interface:**
```typescript
interface AgentRunner {
  run(config: {
    model: string;
    systemPrompt: string;
    messages: ConversationMessage[];
    maxTokens: number;
  }): AsyncIterable<string>;  // streams tokens
}
```

**Orchestrator is dumb.** It doesn't know about UI, WebSockets, or sharing. It knows: create bout, run turns, write to DB. Everything else subscribes to its events.

**Event emitter pattern:**
```typescript
orchestrator.on('turn:start', ({ boutId, agentName, turnNumber }) => ...)
orchestrator.on('turn:token', ({ boutId, token }) => ...)
orchestrator.on('turn:end', ({ boutId, agentName, message }) => ...)
orchestrator.on('bout:complete', ({ boutId, totalCost }) => ...)
```

WebSocket layer (Chunk 3) just subscribes to these events and forwards to clients. Clean separation.

### Dependencies
All of Chunk 1.

### 🚪 GATE 2: Rick reviews engine
- Run `pnpm bout:run --preset darwin-special --turns 4` and watch output
- Check DB: are messages stored correctly?
- Is the Orchestrator → AgentRunner → TurnManager separation clean?
- **If this doesn't work, nothing after it matters.**

---

## CHUNK 3: Streaming + Mobile UI (Day 4–5)

**Goal:** User picks a preset on their phone, bout streams live with token-by-token rendering.

| # | Task | Depends on | Detail |
|---|------|-----------|--------|
| 3.1 | WebSocket server | 2.3 | Next.js custom server or API route with upgrade. Subscribes to Orchestrator events, pushes to connected clients. |
| 3.2 | Bout API routes | 2.3, 1.4 | `POST /api/bout` (create + start), `GET /api/bout/:id` (status + transcript). REST for creation, WS for streaming. |
| 3.3 | Preset selector UI | 2.6 | Mobile-first grid/carousel. Each preset = card with name, premise, tone, agent count. Tap to start. |
| 3.4 | "Rawdog" option | 3.3 | Advanced toggle below presets. Topic input field for Gloves Off. |
| 3.5 | Conversation UI | 3.1 | Chat-style message bubbles. Agent names + avatars. Token-by-token streaming animation. Auto-scroll. Mobile-first. |
| 3.6 | Bout status bar | 3.5 | Shows: round number, agents speaking, model tier, cost (if juiced/unleashed). |
| 3.7 | Mobile polish | 3.5 | Touch targets, viewport handling, no janky scroll, fast paint. Test on actual phone. |

### Architecture Note: WebSocket vs SSE

**Recommendation: SSE (Server-Sent Events) for v0.**

Rationale:
- Bouts are server→client only (user doesn't type during a bout)
- SSE works through Cloudflare without config
- SSE auto-reconnects natively
- WebSocket is overkill for unidirectional streaming
- If we need bidirectional later (live voting, chat), upgrade to WS in v0.2

Implementation: `GET /api/bout/:id/stream` returns `text/event-stream`. Client uses `EventSource`.

### Dependencies
Chunk 2 (engine must produce events to stream).

### 🚪 GATE 3: Rick reviews UX
- Open on phone. Pick preset. Watch bout stream.
- Is it fluid? Does it feel like watching a fight?
- Does it work on slow connections? (Simulated throttle)
- **This is the "would I show someone this?" gate.**

---

## CHUNK 4: Viral Mechanics + Landing (Day 5–6)

**Goal:** Shareable bouts + email capture. The growth engine.

Runs partly parallel with Chunk 3 (landing page has no engine dependency).

| # | Task | Depends on | Detail |
|---|------|-----------|--------|
| 4.1 | `ShareGenerator` | 2.3 | Takes completed bout, picks best 2-3 exchanges, formats as share text. Copy button. |
| 4.2 | Share text format | 4.1 | Per spec: `🏟 THE PIT — Round N` + agent quotes + link. |
| 4.3 | Bout permalink | 1.4 | `/b/:id` — loads completed bout as replay OR redirects to landing if bout doesn't exist. |
| 4.4 | OG meta tags | 4.3 | Dynamic `og:title`, `og:description` per bout. Makes share links look good on Twitter/Discord/WhatsApp. |
| 4.5 | Replay viewer | 3.5, 4.3 | Re-renders completed bout with original pacing (timestamps from DB). Reuses conversation UI. |
| 4.6 | Waitlist capture | 1.4 | Email input below bout viewer (peak engagement moment). Also on landing page. Writes to `waitlist` table. |
| 4.7 | Landing page | — | Hero + hook + CTA. Can be built in parallel from Day 1 if needed. Countdown to Feb 12. |
| 4.8 | Copy deck integration | 4.7 | Strategist provides landing copy. Plug in. |

### Share Text — "Best Exchange" Selection

Simple heuristic for v0:
- Score each message by length (>100 chars) + presence of direct address to another agent
- Pick the exchange (pair of consecutive messages) with highest combined score
- Fallback: last two messages of the bout

No ML, no fancy NLP. Good enough to be interesting. Iterate with data.

### Dependencies
- 4.1–4.5: Need Chunk 2 (completed bouts in DB)
- 4.6–4.8: No engine dependency (parallel)

### No separate gate — rolls into Gate 4 (final).

---

## CHUNK 5: Harden + Deploy (Day 6–7)

**Goal:** Production-ready. Rate-limited, deployed, monitored.

| # | Task | Depends on | Detail |
|---|------|-----------|--------|
| 5.1 | Rate limiter | 1.4 | Token bucket per IP hash. Config: X bouts per hour. Uses `metrics` table or in-memory with fallback. |
| 5.2 | Free first bout flow | 5.1 | IP hash check: first bout = free (Haiku). Subsequent = throttled or prompted for tier. |
| 5.3 | Error handling | All | Graceful failures: API timeout → "bot got knocked out" message. Network drop → SSE reconnect. DB error → log + user-friendly error. |
| 5.4 | Cloudflare setup | — | DNS, SSL, caching rules, DDoS protection. |
| 5.5 | Deploy pipeline | 1.6 | `main` merge → auto-deploy. Environment variables in production. |
| 5.6 | Turso production DB | 1.3 | Create production database. Run migrations. Verify schema. |
| 5.7 | Monitoring | — | Basic: health endpoint, error logging, bout completion rate. Lightweight — `metrics` table is our telemetry. |
| 5.8 | Load test | 5.1 | Simulate 50 concurrent bouts. Verify rate limiter holds. Check memory/connection limits. |
| 5.9 | Mobile QA | All | Full walkthrough on 3+ devices. iPhone Safari, Android Chrome, desktop Firefox minimum. |
| 5.10 | Pre-launch dry run | All | Run all 11 presets. Verify transcripts. Check share text. Screenshot results. |

### Dependencies
Everything. This is the capstone.

### 🚪 GATE 4: Final pre-launch review
- Full mobile walkthrough: select preset → watch bout → share → replay link → waitlist signup
- All 11 presets produce coherent bouts
- Rate limiter blocks abuse
- `bin/gate` passes
- **Ship or fix. No new features past this gate.**

---

## Review Strategy: Gated Chunks

**Recommendation: 4 human gates. Not Ralph Wiggum.**

Rationale:
- 7-day sprint with layered dependencies = one bad foundation decision cascades everywhere
- Ralph Wiggum (review at end) risks discovering on Day 6 that the DB schema was wrong on Day 1
- But 15 individual PR reviews is too slow for a solo-dev sprint
- **4 gates at chunk boundaries is the sweet spot**

### The Protocol

```text
EVERY PR:
  → CodeRabbit auto-review (catches style, bugs, patterns)
  → bin/gate must pass (lint, types, tests, build)
  → Architect merges to develop branch

CHUNK BOUNDARY (4 times):
  → Architect opens PR: develop → main
  → Rick reviews: architecture, UX, "does this ship?"
  → Merge = greenlight for next chunk
  → Rick can course-correct before more code is built on top
```

### Gate Summary

| Gate | After | Rick Reviews | Kill Question |
|------|-------|-------------|---------------|
| **Gate 1** | Chunk 1 (Day 1) | Scaffold + DB schema + CI | "Is the foundation right?" |
| **Gate 2** | Chunk 2 (Day 3) | Engine running headless bout | "Does it work?" |
| **Gate 3** | Chunk 3 (Day 5) | Live streaming mobile UI | "Would I show someone this?" |
| **Gate 4** | Chunk 5 (Day 7) | Full flow, all presets, deployed | "Do we ship?" |

### Why Not Ralph Wiggum

The audit IS the product here. Rick's exact words: "the audit is as important as the product." Each gate produces:
- A clear commit history showing what was built and why
- A PR with CodeRabbit review + human review
- A testable artifact (not just code — a running thing)
- A decision point (continue / course-correct / pivot)

If we Ralph Wiggum it and the engine architecture is wrong, we discover that when trying to bolt on the UI. By then we've burned 3 days. With gates, we discover it on Day 1 and fix it before anything depends on it.

### Analyst Integration Points

Analyst deliverables feed into specific chunks:
- **Business model one-pager** → informs Gate 1 (do we have the economics right?)
- **Per-bout cost estimates** → feeds `TokenMeter` config in Chunk 2
- **Data schema recommendation** → validates Chunk 1 schema before Gate 1
- **Break-even scenarios** → informs rate limiter config in Chunk 5

---

## Day-by-Day Schedule

| Day | Date | Chunk | Deliverable | Gate |
|-----|------|-------|-------------|------|
| 1 | Feb 6 | 1: Skeleton | Scaffold + DB + CI + gate script | ✅ Gate 1 |
| 2 | Feb 7 | 2: Engine | AgentRunner + TurnManager + presets | |
| 3 | Feb 8 | 2: Engine | Orchestrator + integration test + CLI runner | ✅ Gate 2 |
| 4 | Feb 9 | 3: Streaming | SSE + bout API + preset selector | |
| 5 | Feb 10 | 3: Stream + 4: Viral | Conversation UI + share mechanic + landing | ✅ Gate 3 |
| 6 | Feb 11 | 5: Harden | Rate limiter + deploy + error handling | |
| 7 | Feb 12 | 5: Launch | QA + dry run + launch | ✅ Gate 4 |

**Buffer:** None. This is tight. If we slip on Chunk 2, we compress Chunks 4+5. The priority order is: engine → streaming UI → share mechanic → everything else.

### Critical Path
```text
Scaffold → Engine → Streaming UI → Deploy
    ↑ blocks everything   ↑ blocks UX   ↑ blocks launch
```

Landing page + waitlist + share mechanic are important but not on critical path. They can be compressed or simplified if time is short.

---

## Risk Register (Development-Specific)

| Risk | Impact | Mitigation |
|------|--------|-----------|
| Next.js custom server needed for WS | Medium | Use SSE instead — native, no custom server |
| Anthropic rate limits during load test | Low | Use Haiku, stagger requests, test off-peak |
| Turso cold start latency | Low | Keep-alive connection, connection pooling |
| Preset system prompts produce incoherent bouts | Medium | Dry runs in Chunk 2 (CLI runner). Iterate prompts before UI exists. |
| Mobile Safari viewport bugs | Medium | Test early (Day 4), use `dvh` units, avoid `100vh` |
| SSE through Cloudflare timeout | Low | Set `Cache-Control: no-cache`, test with CF proxy early |
| Scope creep | High | Spec is locked. If it's not in this doc, it's v0.2. |
