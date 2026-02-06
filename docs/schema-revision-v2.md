# Schema Revision v2 — Multi-Agent Arena

**Author:** Analyst  
**Date:** 2026-02-06  
**Status:** Draft for Review  
**Addresses:** Architect's multi-agent vs 1v1 concern

---

## Context

The existing schema (in `be/src/pit_api/models/`) was reviewed and found to be **already oriented toward multi-agent**, not 1v1 comparison:

| Existing | Status | Notes |
|----------|--------|-------|
| `bouts.preset_id` | ✅ Present | Links to preset formats |
| `bouts.agent_count` | ✅ Present | Variable, default 4 |
| `bouts.model_a/model_b` | ❌ Not present | Correct — this would be 1v1 |
| `messages.agent_name` | ✅ Present | Named characters, not slot A/B |
| `messages.turn_number` | ✅ Present | Sequential turns |
| `waitlist` | ✅ Present | Email capture |
| `metrics` | ✅ Present | Analytics events |

**What's missing:**
1. `bout_agents` junction table (explicit agent roster per bout)
2. Voting/outcome tracking
3. Optional: `users` table for auth (v0.2)

---

## Proposed Additions

### 1. `bout_agents` — Junction Table

Why: Currently, agent identity is embedded in each `message` (agent_name, agent_role). This works but has limitations:
- No upfront roster definition before bout starts
- No explicit turn order guarantee
- Per-bout persona customization buried in message metadata

```python
class BoutAgent(Base):
    """Links agents to bouts with configuration."""
    
    __tablename__ = "bout_agents"
    
    id = Column(String(12), primary_key=True, default=generate_id)
    bout_id = Column(String(10), ForeignKey("bouts.id"), nullable=False, index=True)
    agent_name = Column(String(100), nullable=False)
    agent_role = Column(String(200), nullable=True)
    persona_config = Column(JSONB, nullable=True)  # per-bout overrides
    turn_order = Column(Integer, nullable=False)   # 0-indexed position
    model_override = Column(String(50), nullable=True)  # agent-specific model
    created_at = Column(DateTime(timezone=True), default=now_utc)
    
    __table_args__ = (
        Index("ix_bout_agents_bout_turn", "bout_id", "turn_order"),
        UniqueConstraint("bout_id", "turn_order", name="uq_bout_turn"),
    )
```

**Benefits:**
- Engine can validate agent roster before first API call
- Turn order is explicit and queryable
- Persona config lives with the agent assignment, not per-message
- Messages can FK to `bout_agents.id` instead of duplicating name/role

### 2. `votes` — Outcome Tracking

Why: Multi-agent arena needs ranking/survival voting, not binary A/B.

```python
class Vote(Base):
    """User vote on a bout outcome."""
    
    __tablename__ = "votes"
    
    id = Column(String(12), primary_key=True, default=generate_id)
    bout_id = Column(String(10), ForeignKey("bouts.id"), nullable=False, index=True)
    vote_type = Column(String(20), nullable=False)  # "winner", "ranking", "survival"
    
    # For "winner" type — single agent selection
    winner_agent = Column(String(100), nullable=True)
    
    # For "ranking" type — ordered list
    ranking = Column(JSONB, nullable=True)  # ["agent_1", "agent_2", ...]
    
    # For "survival" type — who should stay
    survivors = Column(JSONB, nullable=True)  # ["agent_1", "agent_3"]
    
    ip_hash = Column(String(64), nullable=True)  # anon voter tracking
    user_id = Column(String(12), nullable=True)  # future: authenticated users
    created_at = Column(DateTime(timezone=True), default=now_utc)
    
    __table_args__ = (
        Index("ix_votes_bout_created", "bout_id", "created_at"),
    )
```

**Vote aggregation query:**
```sql
-- Winner votes per agent
SELECT winner_agent, COUNT(*) as votes
FROM votes
WHERE bout_id = ? AND vote_type = 'winner'
GROUP BY winner_agent
ORDER BY votes DESC;
```

### 3. `bout_outcomes` — Aggregated Results (Optional)

For performance, cache aggregated vote results:

```python
class BoutOutcome(Base):
    """Cached aggregated voting results."""
    
    __tablename__ = "bout_outcomes"
    
    bout_id = Column(String(10), ForeignKey("bouts.id"), primary_key=True)
    total_votes = Column(Integer, nullable=False, default=0)
    results = Column(JSONB, nullable=False)  # {"agent_1": 45, "agent_2": 32, ...}
    winner = Column(String(100), nullable=True)  # null if tie or incomplete
    updated_at = Column(DateTime(timezone=True), default=now_utc)
```

---

## Migration Path

### Phase 1: Add without breaking (MVP)

1. Create `bout_agents` table
2. Create `votes` table
3. Engine populates `bout_agents` when bout starts
4. `messages` continues to work as-is (backward compatible)

### Phase 2: Normalize (post-MVP)

1. Add `bout_agent_id` FK to `messages`
2. Deprecate `agent_name`/`agent_role` columns on messages
3. Migrate existing data

### Phase 3: Auth integration (v0.2)

1. Add `users` table
2. Link `votes.user_id` for authenticated voting
3. Unlock features for logged-in users

---

## Questions for Architect

1. **Agent identity:** Should `bout_agents` reference a shared `agents` table (reusable personas), or is name+role sufficient for MVP?
   
   *Analyst recommendation:* Name+role sufficient for MVP. Shared agents table adds complexity without clear v0 benefit.

2. **Voting UX:** Is voting per-bout-completion, or can users vote mid-bout?
   
   *Affects:* Whether `votes` needs a `message_id` FK for "vote after message N"

3. **Message FK:** Should `messages.agent_name` become `messages.bout_agent_id` FK immediately, or keep denormalized for MVP speed?
   
   *Analyst recommendation:* Keep denormalized for MVP. Normalization is a v0.1 concern.

---

## Summary

| Table | Action | Priority |
|-------|--------|----------|
| `bouts` | No change needed | — |
| `messages` | No change needed (MVP) | — |
| `waitlist` | No change needed | — |
| `metrics` | No change needed | — |
| `bout_agents` | **Add** | HIGH |
| `votes` | **Add** | HIGH |
| `bout_outcomes` | Add (optional) | LOW |

The existing schema is 80% correct for multi-agent. We're adding the missing 20%.
