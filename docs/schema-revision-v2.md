# Schema Revision v2 — Multi-Agent Arena

**Author:** Analyst  
**Date:** 2026-02-06  
**Status:** APPROVED — Ready for Implementation  
**Addresses:** Multi-agent architecture for variable participant counts (2-4 agents)

---

## Summary

Complete refactor from 1v1 comparison model to multi-agent arena. Variable agent counts (2-4) are load-bearing per the preset design.

**Free tier:** 2-bot presets only (Roast Battle, On The Couch, Gloves Off)  
**Premium tier:** Unlocks 3-4 bot formats

---

## Final Schema

### Enums

```typescript
boutStatusEnum = ['pending', 'running', 'voting', 'complete']
turnTypeEnum   = ['alternating', 'broadcast', 'round_robin']
voteTypeEnum   = ['winner', 'ranking', 'survival']
userTierEnum   = ['free', 'premium']
```

### Tables

#### `presets` — Format Definitions

| Column | Type | Notes |
|--------|------|-------|
| id | varchar(50) PK | 'roast_battle', 'shark_pit', etc. |
| name | varchar(100) | Display name |
| description | text | |
| agent_count | integer | 2, 3, or 4 |
| turn_type | turn_type | alternating, broadcast, round_robin |
| agent_roles | jsonb | Default slot configs |
| free_tier_access | boolean | True for 2-bot presets |
| display_order | integer | UI ordering |

#### `bouts` — Core Bout Record

| Column | Type | Notes |
|--------|------|-------|
| id | uuid PK | |
| user_id | uuid FK | Nullable |
| preset_id | varchar FK | Required |
| share_id | varchar(12) | Unique, for public links |
| status | bout_status | Lifecycle |
| topic | text | The prompt/topic |
| max_messages | integer | Default 20 |
| current_round | integer | |
| metadata | jsonb | |
| created_at, updated_at, completed_at | timestamp | |

#### `bout_agents` — Agent-Bout Junction

| Column | Type | Notes |
|--------|------|-------|
| id | uuid PK | |
| bout_id | uuid FK | |
| agent_name | varchar(100) | "Comedian A", "Shark 1" |
| agent_role | text | System prompt |
| turn_order | integer | 0-indexed position |
| is_initiator | boolean | Who speaks first |
| model_provider | varchar(50) | Hidden until reveal |
| model_id | varchar(100) | |
| persona_config | jsonb | Per-bout overrides |

Unique constraint: (bout_id, turn_order)

#### `messages` — Agent Responses

| Column | Type | Notes |
|--------|------|-------|
| id | uuid PK | |
| bout_id | uuid FK | |
| bout_agent_id | uuid FK | Which agent authored |
| content | text | |
| turn_number | integer | Global sequence |
| round_number | integer | For round_robin tracking |
| input_tokens, output_tokens | integer | Cost tracking |
| duration_ms | integer | |
| is_error | boolean | |
| error_message | text | |

#### `votes` — Multi-Agent Outcomes

| Column | Type | Notes |
|--------|------|-------|
| id | uuid PK | |
| bout_id | uuid FK | |
| vote_type | vote_type | winner, ranking, survival |
| winner_agent_id | uuid FK | For 'winner' type |
| ranking | jsonb | Array of agent IDs |
| survivors | jsonb | Array of agent IDs |
| user_id | uuid FK | Authenticated voter |
| ip_hash | varchar(64) | Anonymous tracking |
| rationale | text | Optional |

#### `users` — Updated

Added: `tier` (user_tier, default 'free')

---

## Turn Type Mapping

| Preset | Agents | Turn Type |
|--------|--------|-----------|
| Roast Battle | 2 | alternating |
| On The Couch | 2 | alternating |
| Gloves Off | 2 | alternating |
| Darwin Special | 3 | round_robin |
| First Contact | 3 | round_robin |
| Writers Room | 3 | round_robin |
| The Flatshare | 3 | round_robin |
| Shark Pit | 4 | broadcast |
| Last Supper | 4 | round_robin |
| The Mansion | 4 | round_robin |
| The Summit | 4 | round_robin |

---

## Migration Path

### Phase 1: MVP

1. Create new tables: presets, bout_agents, messages, votes
2. Add tier to users
3. Seed presets with 11 formats
4. Engine populates bout_agents at bout creation
5. Old bout_responses table deprecated (no data to migrate)

### Phase 2: Post-MVP

1. Add rolling summarization for context compression
2. Add bout_outcomes table for cached vote aggregation
3. Add shared agents table if persona reuse becomes a feature

---

## Implementation Files

Schema TypeScript: `~/clawd-analyst/schema/*.ts`

- `enums.ts` — All enum definitions
- `users.ts` — User table with tier
- `bouts.ts` — All bout-related tables (presets, bouts, bout_agents, messages, votes)
- `index.ts` — Exports

Ready for Architect to wire into pit repo.

---

## Cost Model Reference

| Preset Type | Agents | Responses/Bout (4 rounds) | Est. Cost |
|-------------|--------|---------------------------|-----------|
| 2-bot | 2 | 8 | ~$0.01 |
| 3-bot | 3 | 12 | ~$0.015 |
| 4-bot | 4 | 16 | ~$0.02 |

Context accumulation adds 30-50%. Free tier caps mitigate runaway costs.
