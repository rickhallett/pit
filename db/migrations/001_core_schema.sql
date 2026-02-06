-- Migration 001: Core Schema
-- The Pit - Multi-agent debate arena
--
-- DECISIONS (locked):
--   Merge: Deep merge, null = ERROR (cannot delete preset values)
--   Validation: Presets table + trigger at status transition
--   Position: Role slot, NOT turn order. Preset config owns turn sequence.
--
-- Override precedence: bout_agents.config_json > presets.config_json > models.params_json
--
-- Merge strategy (enforced by orchestrator):
--   - Deep merge, left-to-right
--   - Missing key in override → inherit from preset
--   - Explicit null in override → ERROR (cannot null required fields)
--   - Nested objects → recursive merge, same rules
--   - Arrays → full replacement (no element-level merge)
--   Limitation: To use provider defaults, create a preset without the field.
--
-- Position mapping: bout_agents.position maps to preset.roles[position]
-- 1-indexed for human readability. Position 1 = first role in preset definition.
-- Turn order is separate — defined in presets.config_json.turn_order
--
-- IMPORTANT: All bout creation MUST be transactional.
-- BEGIN → create bout → create bout_agents (all N) → COMMIT

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
-- PRESETS: Debate format definitions
-- Table provides FK integrity + agent_count for trigger validation
--------------------------------------------------------------------------------
CREATE TABLE presets (
    id          TEXT PRIMARY KEY,                 -- 'darwin_special', 'shark_pit'
    name        TEXT NOT NULL,                    -- 'Darwin Special'
    description TEXT,
    agent_count INT NOT NULL,                     -- Required agents (trigger enforces)
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
    config_json JSONB DEFAULT '{}',               -- Runtime overrides (deep merge, bout wins)
    created_at  TIMESTAMPTZ DEFAULT now(),
    UNIQUE(bout_id, position)
);

CREATE INDEX idx_bout_agents_bout ON bout_agents(bout_id);
CREATE INDEX idx_bout_agents_model ON bout_agents(model_id);

--------------------------------------------------------------------------------
-- VALIDATION TRIGGER: Ensures agent count matches preset requirement
-- Fires when bout transitions to 'active' status
--------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION validate_bout_agents()
RETURNS TRIGGER AS $$
DECLARE
    actual_count INT;
    expected_count INT;
BEGIN
    -- Only validate on transition to active
    IF NEW.status = 'active' AND (OLD.status IS NULL OR OLD.status != 'active') THEN
        SELECT COUNT(*) INTO actual_count 
        FROM bout_agents 
        WHERE bout_id = NEW.id;
        
        SELECT agent_count INTO expected_count 
        FROM presets 
        WHERE id = NEW.preset_id;
        
        IF actual_count != expected_count THEN
            RAISE EXCEPTION 'Agent count mismatch: bout % has % agents, preset % requires %',
                NEW.id, actual_count, NEW.preset_id, expected_count;
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger on UPDATE (status change)
CREATE TRIGGER trg_validate_bout_agents
    BEFORE UPDATE ON bouts
    FOR EACH ROW
    EXECUTE FUNCTION validate_bout_agents();

-- Trigger on INSERT if status is already 'active' (edge case protection)
CREATE TRIGGER trg_validate_bout_agents_insert
    BEFORE INSERT ON bouts
    FOR EACH ROW
    WHEN (NEW.status = 'active')
    EXECUTE FUNCTION validate_bout_agents();
