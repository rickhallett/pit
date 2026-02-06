-- Migration 002: Turns
-- Conversation transcript for each bout
--
-- agent_id: NULL for system/user messages, FK to bout_agents for agent turns
-- role: Required for NULL agent_id to distinguish system vs user
--       For agent turns, derivable from agent_id → position → preset, but stored for query convenience
-- tokens: Split in/out for accurate cost modeling (different pricing)

CREATE TABLE turns (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    bout_id     UUID NOT NULL REFERENCES bouts(id) ON DELETE CASCADE,
    agent_id    UUID REFERENCES bout_agents(id),  -- NULL for system/user messages
    turn_number INT NOT NULL,                     -- Sequential within bout
    role        TEXT NOT NULL,                    -- 'incumbent', 'mutant', 'selector', 'system', 'user'
    content     TEXT NOT NULL,
    tokens_in   INT,                              -- Input tokens (for cost modeling)
    tokens_out  INT,                              -- Output tokens (priced differently)
    latency_ms  INT,                              -- Response time
    metadata    JSONB DEFAULT '{}',               -- Provider response metadata
    created_at  TIMESTAMPTZ DEFAULT now(),
    UNIQUE(bout_id, turn_number),
    -- Constraint: system/user messages must have NULL agent_id
    CONSTRAINT chk_system_user_null CHECK (
        (role IN ('system', 'user') AND agent_id IS NULL) OR
        (role NOT IN ('system', 'user') AND agent_id IS NOT NULL)
    )
);

CREATE INDEX idx_turns_bout ON turns(bout_id, turn_number);
CREATE INDEX idx_turns_agent ON turns(agent_id) WHERE agent_id IS NOT NULL;
