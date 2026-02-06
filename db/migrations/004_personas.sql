-- Migration 004: Personas
-- Versioned personality/prompt definitions (append-only)
--
-- Personas sit between models and presets:
--   model = which LLM (claude-sonnet-4, gpt-4o)
--   persona = character/personality (devil's advocate, socratic questioner)
--   preset = debate format (1v1, darwin special)
--
-- Design: Append-only versioning
--   - New version = new row with same name, incremented version
--   - superseded_at = NULL means current version
--   - Partial index for O(1) current version lookups
--   - parent_id tracks lineage for diff/history

CREATE TABLE personas (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name          TEXT NOT NULL,                  -- 'devils_advocate', 'socratic'
    version       INT NOT NULL DEFAULT 1,
    display_name  TEXT NOT NULL,                  -- 'Devil's Advocate'
    description   TEXT,
    system_prompt TEXT NOT NULL,                  -- the actual prompt
    config        JSONB DEFAULT '{}',             -- temperature, style params, etc.
    created_at    TIMESTAMPTZ DEFAULT now(),
    created_by    TEXT,                           -- agent or user who created it
    superseded_at TIMESTAMPTZ,                    -- NULL = current, set when new version created
    parent_id     UUID REFERENCES personas(id),   -- previous version for lineage
    
    UNIQUE(name, version)
);

-- Fast lookup for current personas
CREATE INDEX idx_personas_current ON personas(name) WHERE superseded_at IS NULL;
CREATE INDEX idx_personas_name ON personas(name);

-- Trigger: Auto-supersede previous version on insert
CREATE OR REPLACE FUNCTION supersede_previous_persona()
RETURNS TRIGGER AS $$
BEGIN
    -- Mark previous versions as superseded
    UPDATE personas
    SET superseded_at = now()
    WHERE name = NEW.name 
      AND id != NEW.id
      AND superseded_at IS NULL;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_supersede_persona
    AFTER INSERT ON personas
    FOR EACH ROW
    EXECUTE FUNCTION supersede_previous_persona();

-- Link personas to bout_agents (optional — agent can have a persona or not)
ALTER TABLE bout_agents ADD COLUMN persona_id UUID REFERENCES personas(id);

-- View: Current personas only
CREATE VIEW v_current_personas AS
SELECT * FROM personas WHERE superseded_at IS NULL;

-- View: Persona history for a given name
CREATE VIEW v_persona_history AS
SELECT 
    name,
    version,
    display_name,
    created_at,
    superseded_at,
    CASE WHEN superseded_at IS NULL THEN 'current' ELSE 'archived' END AS status
FROM personas
ORDER BY name, version DESC;
