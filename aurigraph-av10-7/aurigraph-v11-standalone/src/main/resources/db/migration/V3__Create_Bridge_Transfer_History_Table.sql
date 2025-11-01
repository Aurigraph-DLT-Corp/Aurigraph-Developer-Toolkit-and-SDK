-- =========================================================================
-- V3__Create_Bridge_Transfer_History_Table.sql
-- =========================================================================
-- Liquibase database migration for Aurigraph V11 Bridge Audit Trail
--
-- Creates the bridge_transfer_history table for immutable audit trail of
-- all bridge transaction state transitions.
-- =========================================================================

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

-- Foreign Key Constraint
ALTER TABLE bridge_transfer_history
ADD CONSTRAINT fk_history_transaction_id
FOREIGN KEY (transaction_id)
REFERENCES bridge_transactions(transaction_id)
ON DELETE RESTRICT
ON UPDATE CASCADE;

-- Constraint: Ensure Valid Status Values
ALTER TABLE bridge_transfer_history
ADD CONSTRAINT check_valid_to_status
CHECK (to_status IN ('PENDING', 'CONFIRMING', 'COMPLETED', 'FAILED', 'REFUNDED'));

ALTER TABLE bridge_transfer_history
ADD CONSTRAINT check_valid_from_status
CHECK (from_status IS NULL OR from_status IN ('PENDING', 'CONFIRMING', 'COMPLETED', 'FAILED', 'REFUNDED'));

-- =========================================================================
-- End of Migration
-- =========================================================================
