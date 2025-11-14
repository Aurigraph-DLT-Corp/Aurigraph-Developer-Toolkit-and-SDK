-- Aurigraph V4.4.4 PostgreSQL Initialization Script
-- Database: aurigraph_production
-- Date: 2025-11-14

-- =========================================================================
-- Connection & Session Configuration
-- =========================================================================
-- Set application name
SET application_name TO 'aurigraph-v11-standalone';

-- Set timezone
SET timezone TO 'UTC';

-- =========================================================================
-- Create Schema for Bridge Infrastructure
-- =========================================================================

-- Transfers schema (AV11-635: Bridge Transfer)
CREATE SCHEMA IF NOT EXISTS bridge_transfers;
COMMENT ON SCHEMA bridge_transfers IS 'Multi-signature bridge transfer operations (AV11-635)';

CREATE TABLE IF NOT EXISTS bridge_transfers.transfers (
    transfer_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    source_chain VARCHAR(50) NOT NULL,
    target_chain VARCHAR(50) NOT NULL,
    sender_address VARCHAR(255) NOT NULL,
    recipient_address VARCHAR(255) NOT NULL,
    amount NUMERIC(38, 18) NOT NULL,
    token_symbol VARCHAR(20) NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'PENDING', -- PENDING, SIGNED, APPROVED, EXECUTING, COMPLETED, FAILED, CANCELLED
    signatures_required INTEGER NOT NULL,
    signatures_received INTEGER NOT NULL DEFAULT 0,
    total_signers INTEGER NOT NULL,
    bridge_fee NUMERIC(38, 18) DEFAULT 0,
    gas_fee NUMERIC(38, 18) DEFAULT 0,
    source_tx_hash VARCHAR(255),
    target_tx_hash VARCHAR(255),
    error_code VARCHAR(100),
    error_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    CONSTRAINT status_valid CHECK (status IN ('PENDING', 'SIGNED', 'APPROVED', 'EXECUTING', 'COMPLETED', 'FAILED', 'CANCELLED'))
);

CREATE INDEX idx_transfers_status ON bridge_transfers.transfers(status);
CREATE INDEX idx_transfers_sender ON bridge_transfers.transfers(sender_address);
CREATE INDEX idx_transfers_created ON bridge_transfers.transfers(created_at DESC);
CREATE INDEX idx_transfers_chains ON bridge_transfers.transfers(source_chain, target_chain);

-- Signatures table
CREATE TABLE IF NOT EXISTS bridge_transfers.transfer_signatures (
    signature_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    transfer_id UUID NOT NULL REFERENCES bridge_transfers.transfers(transfer_id) ON DELETE CASCADE,
    signer_address VARCHAR(255) NOT NULL,
    signature_data TEXT NOT NULL,
    signature_type VARCHAR(50) NOT NULL, -- ECDSA, EdDSA, BLS
    weight INTEGER DEFAULT 1,
    verified BOOLEAN DEFAULT FALSE,
    verified_at TIMESTAMP WITH TIME ZONE,
    signed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_transfer_signatures_transfer ON bridge_transfers.transfer_signatures(transfer_id);
CREATE INDEX idx_transfer_signatures_signer ON bridge_transfers.transfer_signatures(signer_address);

-- Transfer events audit trail
CREATE TABLE IF NOT EXISTS bridge_transfers.transfer_events (
    event_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    transfer_id UUID NOT NULL REFERENCES bridge_transfers.transfers(transfer_id) ON DELETE CASCADE,
    event_type VARCHAR(50) NOT NULL,
    message TEXT,
    details JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_transfer_events_transfer ON bridge_transfers.transfer_events(transfer_id);
CREATE INDEX idx_transfer_events_type ON bridge_transfers.transfer_events(event_type);

-- =========================================================================
-- Atomic Swap Schema (AV11-636: Hash-Time-Locked Contract)
-- =========================================================================

CREATE SCHEMA IF NOT EXISTS atomic_swaps;
COMMENT ON SCHEMA atomic_swaps IS 'Hash-Time-Locked Contract (HTLC) operations (AV11-636)';

CREATE TABLE IF NOT EXISTS atomic_swaps.swaps (
    swap_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    initiator_address VARCHAR(255) NOT NULL,
    counterparty_address VARCHAR(255) NOT NULL,
    source_chain VARCHAR(50) NOT NULL,
    target_chain VARCHAR(50) NOT NULL,
    token_in VARCHAR(20) NOT NULL,
    token_out VARCHAR(20) NOT NULL,
    amount_in NUMERIC(38, 18) NOT NULL,
    amount_out NUMERIC(38, 18) NOT NULL,
    hash_algorithm VARCHAR(20) NOT NULL, -- SHA256, SHA3, BLAKE2B
    hash_lock VARCHAR(255) NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'INITIATED', -- INITIATED, LOCKED, REVEALED, COMPLETED, EXPIRED, REFUNDED, FAILED
    timelock_ms BIGINT NOT NULL DEFAULT 300000,
    refund_address VARCHAR(255),
    secret VARCHAR(255), -- Stored only after reveal (encrypted in production)
    lock_tx_hash VARCHAR(255),
    lock_time TIMESTAMP WITH TIME ZONE,
    reveal_time TIMESTAMP WITH TIME ZONE,
    target_tx_hash VARCHAR(255),
    completion_time TIMESTAMP WITH TIME ZONE,
    refund_tx_hash VARCHAR(255),
    refund_time TIMESTAMP WITH TIME ZONE,
    expiry_time TIMESTAMP WITH TIME ZONE,
    error_code VARCHAR(100),
    error_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT status_valid CHECK (status IN ('INITIATED', 'LOCKED', 'REVEALED', 'COMPLETED', 'EXPIRED', 'REFUNDED', 'FAILED'))
);

CREATE INDEX idx_swaps_status ON atomic_swaps.swaps(status);
CREATE INDEX idx_swaps_initiator ON atomic_swaps.swaps(initiator_address);
CREATE INDEX idx_swaps_counterparty ON atomic_swaps.swaps(counterparty_address);
CREATE INDEX idx_swaps_expiry ON atomic_swaps.swaps(expiry_time);
CREATE INDEX idx_swaps_created ON atomic_swaps.swaps(created_at DESC);
CREATE INDEX idx_swaps_chains ON atomic_swaps.swaps(source_chain, target_chain);

-- Swap events audit trail
CREATE TABLE IF NOT EXISTS atomic_swaps.swap_events (
    event_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    swap_id UUID NOT NULL REFERENCES atomic_swaps.swaps(swap_id) ON DELETE CASCADE,
    event_type VARCHAR(50) NOT NULL,
    message TEXT,
    details JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_swap_events_swap ON atomic_swaps.swap_events(swap_id);
CREATE INDEX idx_swap_events_type ON atomic_swaps.swap_events(event_type);

-- =========================================================================
-- Query & Statistics Schema (AV11-637)
-- =========================================================================

CREATE SCHEMA IF NOT EXISTS query_stats;
COMMENT ON SCHEMA query_stats IS 'Transaction statistics and query optimization (AV11-637)';

CREATE TABLE IF NOT EXISTS query_stats.transaction_summary (
    summary_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    address VARCHAR(255),
    summary_date DATE NOT NULL,
    total_transactions INTEGER DEFAULT 0,
    total_volume NUMERIC(38, 18) DEFAULT 0,
    success_count INTEGER DEFAULT 0,
    failure_count INTEGER DEFAULT 0,
    pending_count INTEGER DEFAULT 0,
    average_processing_time_ms INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(address, summary_date)
);

CREATE INDEX idx_summary_address ON query_stats.transaction_summary(address);
CREATE INDEX idx_summary_date ON query_stats.transaction_summary(summary_date DESC);

-- =========================================================================
-- Performance & Monitoring
-- =========================================================================

CREATE SCHEMA IF NOT EXISTS monitoring;
COMMENT ON SCHEMA monitoring IS 'Performance metrics and monitoring data';

CREATE TABLE IF NOT EXISTS monitoring.health_checks (
    check_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    service_name VARCHAR(100) NOT NULL,
    status VARCHAR(20) NOT NULL, -- UP, DOWN, DEGRADED
    response_time_ms INTEGER,
    last_check TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    error_message TEXT,
    UNIQUE(service_name, last_check)
);

CREATE INDEX idx_health_service ON monitoring.health_checks(service_name);
CREATE INDEX idx_health_time ON monitoring.health_checks(last_check DESC);

-- =========================================================================
-- Create Functions for Auto-Update Timestamps
-- =========================================================================

CREATE OR REPLACE FUNCTION update_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply to transfers table
CREATE TRIGGER update_transfers_timestamp
BEFORE UPDATE ON bridge_transfers.transfers
FOR EACH ROW
EXECUTE FUNCTION update_timestamp();

-- Apply to swaps table
CREATE TRIGGER update_swaps_timestamp
BEFORE UPDATE ON atomic_swaps.swaps
FOR EACH ROW
EXECUTE FUNCTION update_timestamp();

-- =========================================================================
-- Create Views for Common Queries
-- =========================================================================

-- Active transfers view
CREATE OR REPLACE VIEW bridge_transfers.active_transfers AS
SELECT *
FROM bridge_transfers.transfers
WHERE status NOT IN ('COMPLETED', 'FAILED', 'CANCELLED')
AND expires_at > CURRENT_TIMESTAMP;

-- Active swaps view
CREATE OR REPLACE VIEW atomic_swaps.active_swaps AS
SELECT *
FROM atomic_swaps.swaps
WHERE status NOT IN ('COMPLETED', 'EXPIRED', 'REFUNDED', 'FAILED')
AND expiry_time > CURRENT_TIMESTAMP;

-- Daily transfer statistics
CREATE OR REPLACE VIEW query_stats.daily_transfer_stats AS
SELECT
    DATE(created_at) as transfer_date,
    COUNT(*) as total_transfers,
    SUM(amount) as total_volume,
    AVG(EXTRACT(EPOCH FROM (updated_at - created_at))) as avg_duration_seconds,
    COUNT(CASE WHEN status = 'COMPLETED' THEN 1 END) as successful,
    COUNT(CASE WHEN status = 'FAILED' THEN 1 END) as failed
FROM bridge_transfers.transfers
GROUP BY DATE(created_at);

-- Daily swap statistics
CREATE OR REPLACE VIEW query_stats.daily_swap_stats AS
SELECT
    DATE(created_at) as swap_date,
    COUNT(*) as total_swaps,
    SUM(amount_in) as total_volume_in,
    COUNT(CASE WHEN status = 'COMPLETED' THEN 1 END) as successful,
    COUNT(CASE WHEN status = 'REFUNDED' THEN 1 END) as refunded
FROM atomic_swaps.swaps
GROUP BY DATE(created_at);

-- =========================================================================
-- Create Roles for Security
-- =========================================================================

-- Read-only role for analytics
CREATE ROLE aurigraph_readonly LOGIN PASSWORD 'readonly-secure-2025';
GRANT USAGE ON SCHEMA bridge_transfers TO aurigraph_readonly;
GRANT USAGE ON SCHEMA atomic_swaps TO aurigraph_readonly;
GRANT USAGE ON SCHEMA query_stats TO aurigraph_readonly;
GRANT USAGE ON SCHEMA monitoring TO aurigraph_readonly;
GRANT SELECT ON ALL TABLES IN SCHEMA bridge_transfers TO aurigraph_readonly;
GRANT SELECT ON ALL TABLES IN SCHEMA atomic_swaps TO aurigraph_readonly;
GRANT SELECT ON ALL TABLES IN SCHEMA query_stats TO aurigraph_readonly;
GRANT SELECT ON ALL TABLES IN SCHEMA monitoring TO aurigraph_readonly;

-- =========================================================================
-- Enable Extensions
-- =========================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- =========================================================================
-- Initial Data
-- =========================================================================

-- Insert initial health check entry
INSERT INTO monitoring.health_checks (service_name, status)
VALUES ('aurigraph-v11', 'UP')
ON CONFLICT DO NOTHING;

-- =========================================================================
-- Database Optimization
-- =========================================================================

-- Analyze tables
ANALYZE bridge_transfers.transfers;
ANALYZE atomic_swaps.swaps;

-- Refresh materialized statistics
REINDEX DATABASE aurigraph_production;

COMMIT;
