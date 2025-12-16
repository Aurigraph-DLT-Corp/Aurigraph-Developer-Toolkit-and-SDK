-- ==================================================================================
-- Aurigraph V12 Database Schema: Transactions Table
-- ==================================================================================
-- Description: Core transaction data for blockchain operations
-- Version: V20
-- Created: 2025-12-16
-- Author: J4C Database Agent
-- ==================================================================================

-- Create transactions table
CREATE TABLE IF NOT EXISTS transactions (
    -- Primary identification
    id BIGSERIAL PRIMARY KEY,
    transaction_id VARCHAR(66) NOT NULL UNIQUE,  -- Format: 0x[64 hex chars]
    hash VARCHAR(66) NOT NULL UNIQUE,            -- Transaction hash (0x-prefixed)

    -- Transaction participants
    from_address VARCHAR(66) NOT NULL,           -- Sender address (0x-prefixed)
    to_address VARCHAR(66),                      -- Receiver address (can be null for contract creation)

    -- Transaction value and gas
    amount NUMERIC(78, 0) NOT NULL DEFAULT 0,    -- Amount in wei (supports up to 2^256)
    gas_used BIGINT,                             -- Actual gas consumed
    gas_price NUMERIC(78, 0),                    -- Gas price in wei

    -- Transaction status and state
    status VARCHAR(20) NOT NULL DEFAULT 'PENDING',  -- PENDING, CONFIRMED, FAILED, REVERTED
    signature TEXT,                               -- Cryptographic signature (quantum-resistant)

    -- Block association
    block_hash VARCHAR(66),                      -- Associated block hash
    block_number BIGINT,                         -- Block number (height)

    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    confirmed_at TIMESTAMP WITH TIME ZONE,       -- When transaction was confirmed

    -- Additional metadata (JSON for flexibility)
    metadata JSONB DEFAULT '{}'::JSONB,          -- Contract calls, logs, events, etc.

    -- Constraints
    CONSTRAINT chk_status CHECK (status IN ('PENDING', 'CONFIRMED', 'FAILED', 'REVERTED')),
    CONSTRAINT chk_amount_positive CHECK (amount >= 0),
    CONSTRAINT chk_gas_used_positive CHECK (gas_used >= 0 OR gas_used IS NULL),
    CONSTRAINT chk_gas_price_positive CHECK (gas_price >= 0 OR gas_price IS NULL),
    CONSTRAINT chk_confirmed_at_after_created CHECK (confirmed_at IS NULL OR confirmed_at >= created_at)
);

-- Create indexes for performance optimization
CREATE INDEX idx_transactions_from_address ON transactions(from_address);
CREATE INDEX idx_transactions_to_address ON transactions(to_address) WHERE to_address IS NOT NULL;
CREATE INDEX idx_transactions_status ON transactions(status);
CREATE INDEX idx_transactions_block_hash ON transactions(block_hash) WHERE block_hash IS NOT NULL;
CREATE INDEX idx_transactions_block_number ON transactions(block_number) WHERE block_number IS NOT NULL;
CREATE INDEX idx_transactions_created_at ON transactions(created_at DESC);
CREATE INDEX idx_transactions_confirmed_at ON transactions(confirmed_at DESC) WHERE confirmed_at IS NOT NULL;

-- GIN index for JSONB metadata queries
CREATE INDEX idx_transactions_metadata ON transactions USING GIN (metadata);

-- Composite index for address + status queries (common pattern)
CREATE INDEX idx_transactions_from_status ON transactions(from_address, status);
CREATE INDEX idx_transactions_to_status ON transactions(to_address, status) WHERE to_address IS NOT NULL;

-- Composite index for block queries
CREATE INDEX idx_transactions_block_status ON transactions(block_number, status) WHERE block_number IS NOT NULL;

-- Comments for documentation
COMMENT ON TABLE transactions IS 'Core blockchain transactions with quantum-resistant signatures';
COMMENT ON COLUMN transactions.id IS 'Auto-incrementing primary key';
COMMENT ON COLUMN transactions.transaction_id IS 'Unique transaction identifier (0x-prefixed)';
COMMENT ON COLUMN transactions.hash IS 'Transaction hash for verification';
COMMENT ON COLUMN transactions.from_address IS 'Sender wallet address';
COMMENT ON COLUMN transactions.to_address IS 'Receiver wallet address (null for contract creation)';
COMMENT ON COLUMN transactions.amount IS 'Transaction amount in wei (supports up to 2^256)';
COMMENT ON COLUMN transactions.gas_used IS 'Actual gas consumed by transaction';
COMMENT ON COLUMN transactions.gas_price IS 'Gas price in wei';
COMMENT ON COLUMN transactions.status IS 'Transaction status: PENDING, CONFIRMED, FAILED, REVERTED';
COMMENT ON COLUMN transactions.signature IS 'Quantum-resistant cryptographic signature (CRYSTALS-Dilithium)';
COMMENT ON COLUMN transactions.block_hash IS 'Hash of block containing this transaction';
COMMENT ON COLUMN transactions.block_number IS 'Block height containing this transaction';
COMMENT ON COLUMN transactions.created_at IS 'Transaction creation timestamp';
COMMENT ON COLUMN transactions.confirmed_at IS 'Transaction confirmation timestamp';
COMMENT ON COLUMN transactions.metadata IS 'Additional transaction metadata (contract calls, logs, events)';

-- Grant permissions (adjust as needed for your deployment)
-- GRANT SELECT, INSERT, UPDATE ON transactions TO aurigraph_app;
-- GRANT USAGE, SELECT ON SEQUENCE transactions_id_seq TO aurigraph_app;
