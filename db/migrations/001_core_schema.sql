-- Migration 001: Core Schema
-- The Pit - Multi-agent debate arena
--
-- DECISIONS (locked):
--   Merge: Shallow spread {...preset, ...bout_override}, null = deletion
--   Validation: App-level + transaction requirement (NO TRIGGER)
--   Position: Role slot, NOT turn order. Preset config owns turn sequence.
--
-- Override precedence: bout_agents.config_json > presets.config_json > models.params_json
--
-- Position mapping: bout_agents.position maps to preset.roles[position]
-- 1-indexed for human readability. Position 1 = first role in preset definition.
-- Turn order is separate — defined in presets.config_json.turn_order
--
-- IMPORTANT: All bout creation MUST be transactional.
-- BEGIN → create bout → create bout_agents (all N) → COMMIT
-- Partial writes = corruption. App enforces agent_count, not DB.

--------------------------------------------------------------------------------
-- MODELS: Available LLMs
--------------------------------------------------------------------------------
CREATE TABLE models (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    provider    TEXT NOT NULL,                    -- 'anthropic', 'openai', 'google'
    model_id    TEXT NOT NULL,                    -- 'claude-sonnet-4-20250514'
    name        TEXT NOT NULL,                    -- Display name
    params_json JSONB DEFAULT '{}',               -- Provider defaults (temp, max_tokens)
    active      BOOLEAN DEFAULT true,
    created_at  TIMESTAMPTZ DEFAULT now(),
    UNIQUE(provider, model_id)
);

--------------------------------------------------------------------------------
-- PRESETS: Debate format definitions (FK reference only)
-- Full config lives in presets.config_json or external files
-- Table exists for referential integrity on bouts.preset_id
--------------------------------------------------------------------------------
CREATE TABLE presets (
    id          TEXT PRIMARY KEY,                 -- 'darwin_special', 'shark_pit'
    name        TEXT NOT NULL,                    -- 'Darwin Special'
    description TEXT,
    agent_count INT NOT NULL,                     -- Required agents (app enforces)
    config_json JSONB NOT NULL,                   -- roles[], turn_order, rules
    active      BOOLEAN DEFAULT true,
    created_at  TIMESTAMPTZ DEFAULT now()
);

--------------------------------------------------------------------------------
-- BOUTS: Individual debate instances
--------------------------------------------------------------------------------
CREATE TABLE bouts (
    id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    preset_id    TEXT NOT NULL REFERENCES presets(id),
    topic        TEXT,                            -- Debate topic/question
    status       TEXT DEFAULT 'pending',          -- pending, active, complete, cancelled
    created_at   TIMESTAMPTZ DEFAULT now(),
    started_at   TIMESTAMPTZ,
    completed_at TIMESTAMPTZ
);
-- NOTE: display_config removed pending product decision (blind comparison vs visible personas)

CREATE INDEX idx_bouts_status ON bouts(status);
CREATE INDEX idx_bouts_preset ON bouts(preset_id);

--------------------------------------------------------------------------------
-- BOUT_AGENTS: Junction table (models ↔ bouts)
--------------------------------------------------------------------------------
CREATE TABLE bout_agents (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    bout_id     UUID NOT NULL REFERENCES bouts(id) ON DELETE CASCADE,
    model_id    UUID NOT NULL REFERENCES models(id),
    position    INT NOT NULL,                     -- Role slot: maps to preset.roles[position]
    persona     TEXT,                             -- Runtime display name override
    config_json JSONB DEFAULT '{}',               -- Runtime overrides (shallow merge, bout wins)
    created_at  TIMESTAMPTZ DEFAULT now(),
    UNIQUE(bout_id, position)
);

CREATE INDEX idx_bout_agents_bout ON bout_agents(bout_id);
CREATE INDEX idx_bout_agents_model ON bout_agents(model_id);

-- NO TRIGGER. Validation is app-level per Strategist ruling (11:43).
