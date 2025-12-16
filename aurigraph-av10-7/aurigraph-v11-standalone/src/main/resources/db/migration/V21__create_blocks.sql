-- ==================================================================================
-- Aurigraph V12 Database Schema: Blocks Table
-- ==================================================================================
-- Description: Blockchain blocks with HyperRAFT++ consensus metadata
-- Version: V21
-- Created: 2025-12-16
-- Author: J4C Database Agent
-- ==================================================================================

-- Create blocks table
CREATE TABLE IF NOT EXISTS blocks (
    -- Primary identification
    id BIGSERIAL PRIMARY KEY,
    block_number BIGINT NOT NULL UNIQUE,         -- Block height (sequential)
    hash VARCHAR(66) NOT NULL UNIQUE,            -- Block hash (0x-prefixed)
    previous_hash VARCHAR(66) NOT NULL,          -- Previous block hash (blockchain link)
    merkle_root VARCHAR(66) NOT NULL,            -- Merkle tree root of transactions

    -- Consensus information
    validator_id VARCHAR(66) NOT NULL,           -- Validator who produced this block
    timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,

    -- Block metadata
    transaction_count INTEGER NOT NULL DEFAULT 0, -- Number of transactions in block
    size BIGINT NOT NULL DEFAULT 0,               -- Block size in bytes

    -- Additional metadata (JSON for flexibility)
    metadata JSONB DEFAULT '{}'::JSONB,          -- Consensus round info, signatures, etc.

    -- Constraints
    CONSTRAINT chk_block_number_positive CHECK (block_number >= 0),
    CONSTRAINT chk_transaction_count_positive CHECK (transaction_count >= 0),
    CONSTRAINT chk_size_positive CHECK (size >= 0),
    CONSTRAINT chk_genesis_or_has_previous CHECK (
        block_number = 0 OR previous_hash != '0x0000000000000000000000000000000000000000000000000000000000000000'
    )
);

-- Create indexes for performance optimization
CREATE INDEX idx_blocks_block_number ON blocks(block_number DESC);
CREATE INDEX idx_blocks_hash ON blocks(hash);
CREATE INDEX idx_blocks_previous_hash ON blocks(previous_hash);
CREATE INDEX idx_blocks_validator_id ON blocks(validator_id);
CREATE INDEX idx_blocks_timestamp ON blocks(timestamp DESC);
CREATE INDEX idx_blocks_transaction_count ON blocks(transaction_count) WHERE transaction_count > 0;

-- GIN index for JSONB metadata queries
CREATE INDEX idx_blocks_metadata ON blocks USING GIN (metadata);

-- Composite index for validator performance queries
CREATE INDEX idx_blocks_validator_timestamp ON blocks(validator_id, timestamp DESC);

-- Comments for documentation
COMMENT ON TABLE blocks IS 'Blockchain blocks produced via HyperRAFT++ consensus';
COMMENT ON COLUMN blocks.id IS 'Auto-incrementing primary key';
COMMENT ON COLUMN blocks.block_number IS 'Block height (sequential, starting from 0 for genesis)';
COMMENT ON COLUMN blocks.hash IS 'Block hash (0x-prefixed SHA-256 or quantum-resistant)';
COMMENT ON COLUMN blocks.previous_hash IS 'Hash of previous block (creates blockchain link)';
COMMENT ON COLUMN blocks.merkle_root IS 'Merkle tree root of all transactions in block';
COMMENT ON COLUMN blocks.validator_id IS 'Validator address who produced this block';
COMMENT ON COLUMN blocks.timestamp IS 'Block production timestamp';
COMMENT ON COLUMN blocks.transaction_count IS 'Number of transactions included in block';
COMMENT ON COLUMN blocks.size IS 'Block size in bytes';
COMMENT ON COLUMN blocks.metadata IS 'Additional consensus metadata (round info, validator signatures, etc.)';

-- Add foreign key to transactions table for referential integrity
-- Note: This creates a bidirectional relationship. Consider performance implications.
-- ALTER TABLE transactions ADD CONSTRAINT fk_transactions_block
--     FOREIGN KEY (block_hash) REFERENCES blocks(hash) ON DELETE SET NULL;

-- Grant permissions (adjust as needed for your deployment)
-- GRANT SELECT, INSERT ON blocks TO aurigraph_app;
-- GRANT USAGE, SELECT ON SEQUENCE blocks_id_seq TO aurigraph_app;
