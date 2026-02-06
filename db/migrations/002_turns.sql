-- Migration 002: Turns
-- Stores the actual conversation transcript for each bout
--
-- Turn order is the atomic unit in a debate format.
-- Each turn belongs to one agent (or NULL for system/user messages).

CREATE TABLE turns (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    bout_id     UUID NOT NULL REFERENCES bouts(id) ON DELETE CASCADE,
    agent_id    UUID REFERENCES bout_agents(id),  -- NULL for system/user messages
    turn_number INT NOT NULL,                     -- Sequential within bout
    role        TEXT NOT NULL,                    -- Agent role or 'system'/'user'
    content     TEXT NOT NULL,                    -- Message content
    tokens_in   INT,                              -- Input tokens (usage tracking)
    tokens_out  INT,                              -- Output tokens
    latency_ms  INT,                              -- Response time
    metadata    JSONB DEFAULT '{}',               -- Additional data (model response metadata, etc.)
    created_at  TIMESTAMPTZ DEFAULT now(),
    UNIQUE(bout_id, turn_number)
);

CREATE INDEX idx_turns_bout ON turns(bout_id, turn_number);
CREATE INDEX idx_turns_agent ON turns(agent_id);
