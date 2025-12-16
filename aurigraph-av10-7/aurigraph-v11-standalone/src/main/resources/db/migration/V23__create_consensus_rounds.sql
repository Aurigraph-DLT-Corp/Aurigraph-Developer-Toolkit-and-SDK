-- ==================================================================================
-- Aurigraph V12 Database Schema: Consensus Rounds Table
-- ==================================================================================
-- Description: HyperRAFT++ consensus round history and voting records
-- Version: V23
-- Created: 2025-12-16
-- Author: J4C Database Agent
-- ==================================================================================

-- Create consensus_rounds table
CREATE TABLE IF NOT EXISTS consensus_rounds (
    -- Primary identification
    id BIGSERIAL PRIMARY KEY,
    round_number BIGINT NOT NULL,                -- Consensus round number (sequential)
    proposer_id VARCHAR(66) NOT NULL,            -- Validator who proposed this round

    -- Consensus phase tracking
    phase VARCHAR(20) NOT NULL DEFAULT 'PROPOSAL', -- PROPOSAL, VOTING, COMMIT, FINALIZED, FAILED

    -- Voting results
    votes_received INTEGER NOT NULL DEFAULT 0,    -- Number of votes received
    votes_required INTEGER NOT NULL,              -- Minimum votes needed for quorum
    voters JSONB DEFAULT '[]'::JSONB,            -- Array of validator addresses who voted

    -- Timing information
    started_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP WITH TIME ZONE,        -- When round was finalized or failed

    -- Result information
    result VARCHAR(20),                           -- SUCCESS, FAILED, TIMEOUT
    block_hash VARCHAR(66),                       -- Hash of block produced (if successful)

    -- Additional metadata (JSON for flexibility)
    metadata JSONB DEFAULT '{}'::JSONB,          -- Vote details, signatures, reasons for failure, etc.

    -- Constraints
    CONSTRAINT chk_round_number_positive CHECK (round_number >= 0),
    CONSTRAINT chk_phase CHECK (phase IN ('PROPOSAL', 'VOTING', 'COMMIT', 'FINALIZED', 'FAILED')),
    CONSTRAINT chk_result CHECK (result IS NULL OR result IN ('SUCCESS', 'FAILED', 'TIMEOUT')),
    CONSTRAINT chk_votes_received_positive CHECK (votes_received >= 0),
    CONSTRAINT chk_votes_required_positive CHECK (votes_required > 0),
    CONSTRAINT chk_votes_valid CHECK (votes_received <= votes_required * 2), -- Sanity check
    CONSTRAINT chk_completed_after_started CHECK (completed_at IS NULL OR completed_at >= started_at),
    CONSTRAINT chk_finalized_has_result CHECK (
        (phase = 'FINALIZED' AND result IS NOT NULL) OR phase != 'FINALIZED'
    ),
    CONSTRAINT chk_success_has_block CHECK (
        (result = 'SUCCESS' AND block_hash IS NOT NULL) OR result != 'SUCCESS' OR result IS NULL
    )
);

-- Create unique index on round_number + proposer_id (handles potential re-elections)
CREATE UNIQUE INDEX idx_consensus_rounds_unique ON consensus_rounds(round_number, proposer_id);

-- Create indexes for performance optimization
CREATE INDEX idx_consensus_rounds_round_number ON consensus_rounds(round_number DESC);
CREATE INDEX idx_consensus_rounds_proposer_id ON consensus_rounds(proposer_id);
CREATE INDEX idx_consensus_rounds_phase ON consensus_rounds(phase);
CREATE INDEX idx_consensus_rounds_result ON consensus_rounds(result) WHERE result IS NOT NULL;
CREATE INDEX idx_consensus_rounds_block_hash ON consensus_rounds(block_hash) WHERE block_hash IS NOT NULL;
CREATE INDEX idx_consensus_rounds_started_at ON consensus_rounds(started_at DESC);
CREATE INDEX idx_consensus_rounds_completed_at ON consensus_rounds(completed_at DESC) WHERE completed_at IS NOT NULL;

-- GIN indexes for JSONB queries
CREATE INDEX idx_consensus_rounds_voters ON consensus_rounds USING GIN (voters);
CREATE INDEX idx_consensus_rounds_metadata ON consensus_rounds USING GIN (metadata);

-- Composite index for active rounds (common query pattern)
CREATE INDEX idx_consensus_rounds_active ON consensus_rounds(phase, started_at DESC)
    WHERE phase IN ('PROPOSAL', 'VOTING', 'COMMIT');

-- Composite index for proposer performance queries
CREATE INDEX idx_consensus_rounds_proposer_result ON consensus_rounds(proposer_id, result, completed_at DESC)
    WHERE result IS NOT NULL;

-- Partial index for failed rounds (debugging)
CREATE INDEX idx_consensus_rounds_failures ON consensus_rounds(result, started_at DESC)
    WHERE result IN ('FAILED', 'TIMEOUT');

-- Comments for documentation
COMMENT ON TABLE consensus_rounds IS 'HyperRAFT++ consensus round history and voting records';
COMMENT ON COLUMN consensus_rounds.id IS 'Auto-incrementing primary key';
COMMENT ON COLUMN consensus_rounds.round_number IS 'Sequential consensus round number';
COMMENT ON COLUMN consensus_rounds.proposer_id IS 'Validator address who proposed this round (leader)';
COMMENT ON COLUMN consensus_rounds.phase IS 'Current phase: PROPOSAL, VOTING, COMMIT, FINALIZED, FAILED';
COMMENT ON COLUMN consensus_rounds.votes_received IS 'Number of votes received from validators';
COMMENT ON COLUMN consensus_rounds.votes_required IS 'Minimum votes needed for quorum (typically 2/3 + 1)';
COMMENT ON COLUMN consensus_rounds.voters IS 'JSON array of validator addresses who voted';
COMMENT ON COLUMN consensus_rounds.started_at IS 'When consensus round started';
COMMENT ON COLUMN consensus_rounds.completed_at IS 'When round was finalized or failed';
COMMENT ON COLUMN consensus_rounds.result IS 'Round outcome: SUCCESS, FAILED, TIMEOUT';
COMMENT ON COLUMN consensus_rounds.block_hash IS 'Hash of block produced (if successful)';
COMMENT ON COLUMN consensus_rounds.metadata IS 'Additional round metadata (vote signatures, failure reasons, timing details)';

-- Add foreign key to blocks table for referential integrity
-- ALTER TABLE consensus_rounds ADD CONSTRAINT fk_consensus_rounds_block
--     FOREIGN KEY (block_hash) REFERENCES blocks(hash) ON DELETE SET NULL;

-- Add foreign key to validators table
-- ALTER TABLE consensus_rounds ADD CONSTRAINT fk_consensus_rounds_proposer
--     FOREIGN KEY (proposer_id) REFERENCES validators(address) ON DELETE RESTRICT;

-- Create function to calculate round duration
CREATE OR REPLACE FUNCTION consensus_round_duration(round_id BIGINT)
RETURNS INTERVAL AS $$
DECLARE
    duration INTERVAL;
BEGIN
    SELECT (COALESCE(completed_at, CURRENT_TIMESTAMP) - started_at)
    INTO duration
    FROM consensus_rounds
    WHERE id = round_id;

    RETURN duration;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION consensus_round_duration IS 'Calculate duration of a consensus round (completed or in-progress)';

-- Create view for active consensus rounds
CREATE OR REPLACE VIEW active_consensus_rounds AS
SELECT
    id,
    round_number,
    proposer_id,
    phase,
    votes_received,
    votes_required,
    ROUND((votes_received::NUMERIC / votes_required::NUMERIC) * 100, 2) AS vote_percentage,
    started_at,
    EXTRACT(EPOCH FROM (CURRENT_TIMESTAMP - started_at)) AS duration_seconds,
    metadata
FROM consensus_rounds
WHERE phase IN ('PROPOSAL', 'VOTING', 'COMMIT')
ORDER BY round_number DESC;

COMMENT ON VIEW active_consensus_rounds IS 'View of currently active consensus rounds with calculated metrics';

-- Grant permissions (adjust as needed for your deployment)
-- GRANT SELECT, INSERT, UPDATE ON consensus_rounds TO aurigraph_app;
-- GRANT USAGE, SELECT ON SEQUENCE consensus_rounds_id_seq TO aurigraph_app;
-- GRANT SELECT ON active_consensus_rounds TO aurigraph_app;
