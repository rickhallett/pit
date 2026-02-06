-- Migration 001: Core Schema
-- The Pit - Multi-agent debate arena
--
-- Override precedence: bout_agents.config_json > presets.config_json > models.params_json
--
-- Position mapping: bout_agents.position maps to preset.roles[position]
-- Position is 1-indexed to match human-readable role numbering.
--
-- Merge strategy (enforced by orchestrator):
--   Shallow spread: {...preset_defaults, ...bout_overrides}
--   - Missing key in override → inherit from preset
--   - Explicit null in override → intentional deletion
--   No deep merge — complexity not justified for MVP.
--
-- IMPORTANT: All bout creation MUST be transactional.
-- BEGIN → create bout → create bout_agents → COMMIT
-- App-level enforcement. No DB trigger. Revisit if direct SQL tooling added.

-- Models: Available LLMs
CREATE TABLE models (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    provider    TEXT NOT NULL,                    -- 'anthropic', 'openai', 'google', etc.
    model_id    TEXT NOT NULL,                    -- 'claude-sonnet-4-20250514', 'gpt-4o'
    name        TEXT NOT NULL,                    -- Display name
    params_json JSONB DEFAULT '{}',               -- Provider defaults (temperature, max_tokens, etc.)
    active      BOOLEAN DEFAULT true,
    created_at  TIMESTAMPTZ DEFAULT now(),
    UNIQUE(provider, model_id)
);

-- Presets: Debate formats and configurations
CREATE TABLE presets (
    id          TEXT PRIMARY KEY,                 -- 'darwin_special', 'shark_pit', 'classic_1v1'
    name        TEXT NOT NULL,                    -- 'Darwin Special'
    description TEXT,
    agent_count INT NOT NULL,                     -- Number of agents required (app enforces)
    config_json JSONB NOT NULL,                   -- Full preset config including:
                                                  --   agents[]: role definitions, system prompts
                                                  --   turn_order: sequence, frequencies
                                                  --   timeout_behavior, disconnect_behavior
                                                  --   rules: debate format specifics
    active      BOOLEAN DEFAULT true,
    created_at  TIMESTAMPTZ DEFAULT now()
);

-- Bouts: Individual debate instances
CREATE TABLE bouts (
    id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    preset_id      TEXT NOT NULL REFERENCES presets(id),
    topic          TEXT,                          -- Debate topic/question
    status         TEXT DEFAULT 'pending',        -- pending, active, complete, cancelled
    display_config JSONB DEFAULT '{}',            -- UI hints for rendering:
                                                  --   agent_order: [2,1,3] for display shuffle
                                                  --   Used for blind comparison analysis
    created_at     TIMESTAMPTZ DEFAULT now(),
    started_at     TIMESTAMPTZ,
    completed_at   TIMESTAMPTZ
);

CREATE INDEX idx_bouts_status ON bouts(status);
CREATE INDEX idx_bouts_preset ON bouts(preset_id);

-- Bout Agents: Junction table linking agents to bouts
CREATE TABLE bout_agents (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    bout_id     UUID NOT NULL REFERENCES bouts(id) ON DELETE CASCADE,
    model_id    UUID NOT NULL REFERENCES models(id),
    position    INT NOT NULL,                     -- Maps to preset.roles[position]; 1=first role in preset
    persona     TEXT,                             -- Runtime override for display name
    config_json JSONB DEFAULT '{}',               -- Runtime overrides (shallow merged, bout wins)
    created_at  TIMESTAMPTZ DEFAULT now(),
    UNIQUE(bout_id, position)
);

CREATE INDEX idx_bout_agents_bout ON bout_agents(bout_id);
CREATE INDEX idx_bout_agents_model ON bout_agents(model_id);
