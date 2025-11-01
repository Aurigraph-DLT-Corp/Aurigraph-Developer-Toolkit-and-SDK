-- V3__Create_Bridge_Transfer_History_Table.sql
-- Creates the bridge_transfer_history table for immutable audit trail

CREATE TABLE IF NOT EXISTS bridge_transfer_history (
    id BIGSERIAL PRIMARY KEY,
    transaction_id VARCHAR(64) NOT NULL,
    from_status VARCHAR(32),
    to_status VARCHAR(32) NOT NULL,
    reason VARCHAR(512),
    error_details TEXT,
    validator_signatures TEXT,
    timestamp TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    agent VARCHAR(64),
    metadata TEXT
);
