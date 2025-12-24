-- Sprint 16: PostgreSQL Integration Test Database Schema
-- Initialization script for Docker Compose integration testing

-- ========== Transaction Table ==========
CREATE TABLE IF NOT EXISTS transaction (
    id SERIAL PRIMARY KEY,
    transaction_id VARCHAR(255) UNIQUE NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'TRANSACTION_STATUS_PENDING',
    priority VARCHAR(50) NOT NULL DEFAULT 'TRANSACTION_PRIORITY_NORMAL',
    payload BYTEA NOT NULL,
    gas_price INTEGER NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    finalized_at TIMESTAMP,
    error_message TEXT
);

-- Create indexes for fast lookups
CREATE INDEX idx_transaction_id ON transaction(transaction_id);
CREATE INDEX idx_transaction_status ON transaction(status);
CREATE INDEX idx_transaction_created_at ON transaction(created_at DESC);

-- ========== Approval Table ==========
CREATE TABLE IF NOT EXISTS approval (
    id SERIAL PRIMARY KEY,
    approval_id VARCHAR(255) UNIQUE NOT NULL,
    type VARCHAR(50) NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'APPROVAL_STATUS_PENDING',
    priority VARCHAR(50) NOT NULL DEFAULT 'APPROVAL_PRIORITY_NORMAL',
    requester_id VARCHAR(255) NOT NULL,
    content BYTEA,
    content_hash VARCHAR(255),
    required_approvals INTEGER NOT NULL,
    total_validators INTEGER NOT NULL,
    approvals_received INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    finalized_at TIMESTAMP
);

-- Create indexes for approval lookups
CREATE INDEX idx_approval_id ON approval(approval_id);
CREATE INDEX idx_approval_status ON approval(status);
CREATE INDEX idx_approval_requester ON approval(requester_id);

-- ========== Approval Votes Table ==========
CREATE TABLE IF NOT EXISTS approval_vote (
    id SERIAL PRIMARY KEY,
    approval_id VARCHAR(255) NOT NULL REFERENCES approval(approval_id),
    approver_id VARCHAR(255) NOT NULL,
    approved BOOLEAN NOT NULL,
    reason TEXT,
    signature VARCHAR(255),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(approval_id, approver_id)
);

-- Create indexes for vote lookups
CREATE INDEX idx_approval_vote_approval_id ON approval_vote(approval_id);
CREATE INDEX idx_approval_vote_approver ON approval_vote(approver_id);

-- ========== Webhook Table ==========
CREATE TABLE IF NOT EXISTS webhook (
    id SERIAL PRIMARY KEY,
    webhook_id VARCHAR(255) UNIQUE NOT NULL,
    url VARCHAR(2048) NOT NULL,
    secret VARCHAR(255) NOT NULL,
    active BOOLEAN NOT NULL DEFAULT TRUE,
    successful_deliveries INTEGER NOT NULL DEFAULT 0,
    failed_deliveries INTEGER NOT NULL DEFAULT 0,
    last_delivery_at TIMESTAMP,
    last_error TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for webhook lookups
CREATE INDEX idx_webhook_id ON webhook(webhook_id);
CREATE INDEX idx_webhook_active ON webhook(active);
CREATE INDEX idx_webhook_created_at ON webhook(created_at DESC);

-- ========== Webhook Events Table ==========
CREATE TABLE IF NOT EXISTS webhook_event (
    id SERIAL PRIMARY KEY,
    event_id VARCHAR(255) UNIQUE NOT NULL,
    webhook_id VARCHAR(255) NOT NULL REFERENCES webhook(webhook_id),
    event_type VARCHAR(100) NOT NULL,
    payload BYTEA NOT NULL,
    signature VARCHAR(255) NOT NULL,
    delivered BOOLEAN NOT NULL DEFAULT FALSE,
    attempts INTEGER NOT NULL DEFAULT 0,
    last_error TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    delivered_at TIMESTAMP
);

-- Create indexes for event lookups
CREATE INDEX idx_webhook_event_id ON webhook_event(event_id);
CREATE INDEX idx_webhook_event_webhook_id ON webhook_event(webhook_id);
CREATE INDEX idx_webhook_event_type ON webhook_event(event_type);
CREATE INDEX idx_webhook_event_delivered ON webhook_event(delivered);

-- ========== Bridge Transfer Table ==========
CREATE TABLE IF NOT EXISTS bridge_transfer (
    id SERIAL PRIMARY KEY,
    transfer_id VARCHAR(255) UNIQUE NOT NULL,
    source_chain VARCHAR(50) NOT NULL,
    target_chain VARCHAR(50) NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'PENDING',
    amount NUMERIC(38, 18) NOT NULL,
    source_address VARCHAR(255) NOT NULL,
    target_address VARCHAR(255) NOT NULL,
    transaction_hash VARCHAR(255),
    oracle_confirmations INTEGER NOT NULL DEFAULT 0,
    required_confirmations INTEGER NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    finalized_at TIMESTAMP
);

-- Create indexes for bridge transfer lookups
CREATE INDEX idx_bridge_transfer_id ON bridge_transfer(transfer_id);
CREATE INDEX idx_bridge_transfer_status ON bridge_transfer(status);
CREATE INDEX idx_bridge_transfer_chains ON bridge_transfer(source_chain, target_chain);

-- ========== Consensus Vote Table ==========
CREATE TABLE IF NOT EXISTS consensus_vote (
    id SERIAL PRIMARY KEY,
    voting_round_id VARCHAR(255) NOT NULL,
    validator_id VARCHAR(255) NOT NULL,
    vote_type VARCHAR(50) NOT NULL,
    vote_hash VARCHAR(255) NOT NULL,
    signature VARCHAR(255) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(voting_round_id, validator_id)
);

-- Create indexes for consensus lookups
CREATE INDEX idx_consensus_vote_round ON consensus_vote(voting_round_id);
CREATE INDEX idx_consensus_vote_validator ON consensus_vote(validator_id);

-- ========== Performance Metrics Table ==========
CREATE TABLE IF NOT EXISTS performance_metric (
    id SERIAL PRIMARY KEY,
    metric_name VARCHAR(100) NOT NULL,
    metric_value NUMERIC NOT NULL,
    unit VARCHAR(50),
    timestamp TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for metrics lookups
CREATE INDEX idx_metric_name_timestamp ON performance_metric(metric_name, timestamp DESC);

-- ========== Functions for Data Management ==========

-- Function to update 'updated_at' timestamp
CREATE OR REPLACE FUNCTION update_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for transaction table
CREATE TRIGGER transaction_update_timestamp
BEFORE UPDATE ON transaction
FOR EACH ROW
EXECUTE FUNCTION update_timestamp();

-- Trigger for approval table
CREATE TRIGGER approval_update_timestamp
BEFORE UPDATE ON approval
FOR EACH ROW
EXECUTE FUNCTION update_timestamp();

-- Trigger for webhook table
CREATE TRIGGER webhook_update_timestamp
BEFORE UPDATE ON webhook
FOR EACH ROW
EXECUTE FUNCTION update_timestamp();

-- Trigger for bridge_transfer table
CREATE TRIGGER bridge_transfer_update_timestamp
BEFORE UPDATE ON bridge_transfer
FOR EACH ROW
EXECUTE FUNCTION update_timestamp();

-- ========== Test Data Cleanup Functions ==========

-- Clean up old test data (for integration test cleanup)
CREATE OR REPLACE FUNCTION cleanup_test_data()
RETURNS void AS $$
BEGIN
    DELETE FROM approval_vote;
    DELETE FROM approval;
    DELETE FROM webhook_event;
    DELETE FROM webhook;
    DELETE FROM transaction;
    DELETE FROM bridge_transfer;
    DELETE FROM consensus_vote;
    DELETE FROM performance_metric;
END;
$$ LANGUAGE plpgsql;

-- Grant permissions
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO aurigraph_test;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO aurigraph_test;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO aurigraph_test;

-- Display initialization complete
SELECT 'PostgreSQL integration test database initialized successfully!' as status;
