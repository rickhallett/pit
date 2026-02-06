-- Migration 002: Turns
-- Conversation transcript for each bout
--
-- agent_id nullable: NULL = system/user message, NOT NULL = agent turn
-- Role derived from agent_id → bout_agents.position → preset.roles[position]
-- No redundant 'role' column to avoid desync (per Analyst)

CREATE TABLE turns (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    bout_id     UUID NOT NULL REFERENCES bouts(id) ON DELETE CASCADE,
    agent_id    UUID REFERENCES bout_agents(id),  -- NULL for system/user messages
    turn_number INT NOT NULL,                     -- Sequential within bout
    content     TEXT NOT NULL,
    tokens_in   INT,                              -- Input tokens
    tokens_out  INT,                              -- Output tokens  
    latency_ms  INT,                              -- Response time
    metadata    JSONB DEFAULT '{}',               -- Source indicator for NULL agent_id: {"source": "system"|"user"}
    created_at  TIMESTAMPTZ DEFAULT now(),
    UNIQUE(bout_id, turn_number)
);

CREATE INDEX idx_turns_bout ON turns(bout_id, turn_number);
CREATE INDEX idx_turns_agent ON turns(agent_id) WHERE agent_id IS NOT NULL;
