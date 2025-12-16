-- ==================================================================================
-- Aurigraph V12 Database Schema: Validators Table
-- ==================================================================================
-- Description: Validator node information and performance tracking
-- Version: V22
-- Created: 2025-12-16
-- Author: J4C Database Agent
-- ==================================================================================

-- Create validators table
CREATE TABLE IF NOT EXISTS validators (
    -- Primary identification
    id BIGSERIAL PRIMARY KEY,
    address VARCHAR(66) NOT NULL UNIQUE,         -- Validator wallet address (0x-prefixed)
    public_key TEXT NOT NULL,                    -- Quantum-resistant public key (CRYSTALS-Dilithium)

    -- Staking information
    stake_amount NUMERIC(78, 0) NOT NULL DEFAULT 0, -- Staked amount in wei (supports up to 2^256)

    -- Validator status
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE', -- ACTIVE, INACTIVE, SLASHED, JAILED

    -- Performance metrics
    uptime NUMERIC(5, 2) NOT NULL DEFAULT 100.00, -- Uptime percentage (0.00-100.00)
    blocks_produced BIGINT NOT NULL DEFAULT 0,    -- Total blocks produced
    rewards_earned NUMERIC(78, 0) NOT NULL DEFAULT 0, -- Total rewards earned in wei

    -- Timestamps
    joined_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    last_active_at TIMESTAMP WITH TIME ZONE,      -- Last time validator was active
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

    -- Additional metadata (JSON for flexibility)
    metadata JSONB DEFAULT '{}'::JSONB,          -- Commission rate, contact info, etc.

    -- Constraints
    CONSTRAINT chk_status CHECK (status IN ('ACTIVE', 'INACTIVE', 'SLASHED', 'JAILED')),
    CONSTRAINT chk_stake_positive CHECK (stake_amount >= 0),
    CONSTRAINT chk_uptime_range CHECK (uptime >= 0.00 AND uptime <= 100.00),
    CONSTRAINT chk_blocks_produced_positive CHECK (blocks_produced >= 0),
    CONSTRAINT chk_rewards_positive CHECK (rewards_earned >= 0),
    CONSTRAINT chk_last_active_after_joined CHECK (last_active_at IS NULL OR last_active_at >= joined_at)
);

-- Create indexes for performance optimization
CREATE INDEX idx_validators_address ON validators(address);
CREATE INDEX idx_validators_status ON validators(status);
CREATE INDEX idx_validators_stake_amount ON validators(stake_amount DESC);
CREATE INDEX idx_validators_uptime ON validators(uptime DESC);
CREATE INDEX idx_validators_blocks_produced ON validators(blocks_produced DESC);
CREATE INDEX idx_validators_rewards_earned ON validators(rewards_earned DESC);
CREATE INDEX idx_validators_joined_at ON validators(joined_at DESC);
CREATE INDEX idx_validators_last_active_at ON validators(last_active_at DESC) WHERE last_active_at IS NOT NULL;

-- GIN index for JSONB metadata queries
CREATE INDEX idx_validators_metadata ON validators USING GIN (metadata);

-- Composite index for active validators by stake (common query pattern)
CREATE INDEX idx_validators_active_by_stake ON validators(status, stake_amount DESC)
    WHERE status = 'ACTIVE';

-- Partial index for high-performance validators
CREATE INDEX idx_validators_high_performance ON validators(uptime DESC, blocks_produced DESC)
    WHERE status = 'ACTIVE' AND uptime >= 99.00;

-- Comments for documentation
COMMENT ON TABLE validators IS 'Validator nodes participating in HyperRAFT++ consensus';
COMMENT ON COLUMN validators.id IS 'Auto-incrementing primary key';
COMMENT ON COLUMN validators.address IS 'Unique validator wallet address (0x-prefixed)';
COMMENT ON COLUMN validators.public_key IS 'Quantum-resistant public key for block signing (CRYSTALS-Dilithium5)';
COMMENT ON COLUMN validators.stake_amount IS 'Amount staked by validator in wei (minimum required for participation)';
COMMENT ON COLUMN validators.status IS 'Validator status: ACTIVE, INACTIVE, SLASHED (penalized), JAILED (temporarily suspended)';
COMMENT ON COLUMN validators.uptime IS 'Validator uptime percentage (0.00-100.00)';
COMMENT ON COLUMN validators.blocks_produced IS 'Total number of blocks produced by this validator';
COMMENT ON COLUMN validators.rewards_earned IS 'Total rewards earned in wei';
COMMENT ON COLUMN validators.joined_at IS 'When validator joined the network';
COMMENT ON COLUMN validators.last_active_at IS 'Most recent activity timestamp';
COMMENT ON COLUMN validators.updated_at IS 'Last update to validator record';
COMMENT ON COLUMN validators.metadata IS 'Additional validator metadata (commission rate, contact info, region, etc.)';

-- Create function to update updated_at timestamp automatically
CREATE OR REPLACE FUNCTION update_validators_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update updated_at
CREATE TRIGGER trg_validators_updated_at
    BEFORE UPDATE ON validators
    FOR EACH ROW
    EXECUTE FUNCTION update_validators_updated_at();

-- Add foreign key to blocks table for referential integrity
-- Note: This enforces that only registered validators can produce blocks
-- ALTER TABLE blocks ADD CONSTRAINT fk_blocks_validator
--     FOREIGN KEY (validator_id) REFERENCES validators(address) ON DELETE RESTRICT;

-- Grant permissions (adjust as needed for your deployment)
-- GRANT SELECT, INSERT, UPDATE ON validators TO aurigraph_app;
-- GRANT USAGE, SELECT ON SEQUENCE validators_id_seq TO aurigraph_app;
