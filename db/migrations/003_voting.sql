-- Migration 003: Voting
-- Adds user voting for bouts with full audit trail
--
-- Design: Hybrid (normalized + denormalized)
--   - bout_votes: audit trail, one vote per user per bout
--   - bout_agents.vote_count: denormalized for fast reads, trigger-maintained
--   - bouts.winner_agent_id: set on completion
--
-- Assumptions:
--   - Voting happens after bout completes (or during, for live bouts)
--   - One vote per voter per bout
--   - Weighted voting supported but defaults to 1.0

-- Add vote tracking columns to existing tables
ALTER TABLE bout_agents ADD COLUMN vote_count NUMERIC(10,2) NOT NULL DEFAULT 0;

ALTER TABLE bouts ADD COLUMN winner_agent_id UUID REFERENCES bout_agents(id) ON DELETE SET NULL;

-- Votes: Full audit trail
CREATE TABLE bout_votes (
    id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    bout_id            UUID NOT NULL REFERENCES bouts(id) ON DELETE CASCADE,
    voted_for_agent_id UUID NOT NULL REFERENCES bout_agents(id) ON DELETE CASCADE,
    voter_id           TEXT NOT NULL,              -- user identifier
    voter_type         TEXT NOT NULL DEFAULT 'user',  -- user, agent, anonymous
    weight             NUMERIC(3,2) NOT NULL DEFAULT 1.0,
    reason             TEXT,                       -- optional rationale
    created_at         TIMESTAMPTZ DEFAULT now(),
    
    UNIQUE(bout_id, voter_id),
    CONSTRAINT valid_voter_type CHECK (voter_type IN ('user', 'agent', 'anonymous')),
    CONSTRAINT valid_weight CHECK (weight > 0 AND weight <= 10)
);

CREATE INDEX idx_bout_votes_bout ON bout_votes(bout_id);
CREATE INDEX idx_bout_votes_agent ON bout_votes(voted_for_agent_id);
CREATE INDEX idx_bout_votes_voter ON bout_votes(voter_id);

-- Trigger: Maintain denormalized vote counts
CREATE OR REPLACE FUNCTION update_vote_counts()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE bout_agents 
        SET vote_count = vote_count + NEW.weight
        WHERE id = NEW.voted_for_agent_id;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE bout_agents 
        SET vote_count = vote_count - OLD.weight
        WHERE id = OLD.voted_for_agent_id;
    ELSIF TG_OP = 'UPDATE' AND NEW.voted_for_agent_id != OLD.voted_for_agent_id THEN
        UPDATE bout_agents SET vote_count = vote_count - OLD.weight WHERE id = OLD.voted_for_agent_id;
        UPDATE bout_agents SET vote_count = vote_count + NEW.weight WHERE id = NEW.voted_for_agent_id;
    END IF;
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_maintain_vote_counts
    AFTER INSERT OR UPDATE OR DELETE ON bout_votes
    FOR EACH ROW
    EXECUTE FUNCTION update_vote_counts();

-- View: Vote standings per bout
CREATE VIEW v_bout_standings AS
SELECT 
    b.id AS bout_id,
    b.topic,
    b.status,
    ba.id AS agent_id,
    m.name AS model_name,
    ba.position,
    ba.vote_count,
    RANK() OVER (PARTITION BY b.id ORDER BY ba.vote_count DESC) AS rank
FROM bouts b
JOIN bout_agents ba ON ba.bout_id = b.id
JOIN models m ON m.id = ba.model_id
ORDER BY b.id, ba.vote_count DESC;
