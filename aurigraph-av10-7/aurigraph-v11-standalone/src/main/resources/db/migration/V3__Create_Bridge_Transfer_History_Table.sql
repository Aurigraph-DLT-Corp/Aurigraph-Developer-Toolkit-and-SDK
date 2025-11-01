-- =========================================================================
-- V3__Create_Bridge_Transfer_History_Table.sql
-- =========================================================================
-- Liquibase database migration for Aurigraph V11 Bridge Audit Trail
--
-- Creates the bridge_transfer_history table for immutable audit trail of
-- all bridge transaction state transitions. This table is critical for
-- regulatory compliance, forensic analysis, and troubleshooting.
--
-- Key Features:
-- - Immutable audit trail (INSERT-ONLY, no UPDATEs)
-- - Complete transaction lifecycle tracking
-- - Error details and validation signatures
-- - Time-series data for analysis
-- - Foreign key relationship to bridge_transactions
--
-- Changelog:
-- 2025-10-29: Initial creation for Sprint 14 audit trail
-- =========================================================================

-- Create the bridge_transfer_history table (audit trail)
CREATE TABLE IF NOT EXISTS bridge_transfer_history (
    id BIGSERIAL PRIMARY KEY,

    -- Foreign Key Reference
    transaction_id VARCHAR(64) NOT NULL,

    -- State Transition
    from_status VARCHAR(32),
    to_status VARCHAR(32) NOT NULL,

    -- Reason and Details
    reason VARCHAR(512),
    error_details TEXT,

    -- Multi-Signature Validation Data
    -- Stored as JSON array: ["validator-1:sig1", "validator-2:sig2", ...]
    validator_signatures TEXT,

    -- Event Information
    timestamp TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    agent VARCHAR(64),

    -- Additional Metadata (JSON-formatted)
    -- Can store block numbers, gas costs, network conditions, etc.
    metadata TEXT

);

-- =========================================================================
-- Indexes for Query Performance
-- =========================================================================

-- Foreign key lookup index
CREATE INDEX idx_history_tx_id
    ON bridge_transfer_history (transaction_id);


-- Time-based queries
CREATE INDEX idx_history_timestamp
    ON bridge_transfer_history (timestamp);


-- Status transition lookups
CREATE INDEX idx_history_from_status
    ON bridge_transfer_history (from_status);


CREATE INDEX idx_history_to_status
    ON bridge_transfer_history (to_status);


-- Combined index for common patterns (tx_id + timestamp)
CREATE INDEX idx_history_tx_timestamp
    ON bridge_transfer_history (transaction_id, timestamp DESC);


-- Agent-based lookups
CREATE INDEX idx_history_agent
    ON bridge_transfer_history (agent);


-- Error tracking
CREATE INDEX idx_history_errors
    ON bridge_transfer_history (to_status)
    WHERE error_details IS NOT NULL;


-- Validator signatures tracking
CREATE INDEX idx_history_validator_sigs
    ON bridge_transfer_history (timestamp)
    WHERE validator_signatures IS NOT NULL;


-- =========================================================================
-- Table Comments and Documentation
-- =========================================================================

COMMENT ON TABLE bridge_transfer_history IS
'Immutable audit trail for bridge transaction state transitions.
Every status change creates a new record that cannot be modified.
Critical for compliance, forensic analysis, and regulatory requirements.';

COMMENT ON COLUMN bridge_transfer_history.transaction_id IS
'Foreign key reference to bridge_transactions.transaction_id';

COMMENT ON COLUMN bridge_transfer_history.from_status IS
'Previous status (null for initial creation event)';

COMMENT ON COLUMN bridge_transfer_history.to_status IS
'New status after transition (PENDING, CONFIRMING, COMPLETED, FAILED, REFUNDED)';

COMMENT ON COLUMN bridge_transfer_history.reason IS
'Human-readable reason for the state transition
Examples:
  - "Validator quorum reached (4/7)"
  - "Confirmations received: 12/12"
  - "HTLC timeout expired"
  - "Manual retry initiated"
  - "Chain confirmation received"';

COMMENT ON COLUMN bridge_transfer_history.error_details IS
'Detailed error information if transition was due to failure.
May include stack traces, network error details, or validation failures.
Stored as TEXT for extensive context.';

COMMENT ON COLUMN bridge_transfer_history.validator_signatures IS
'JSON array of validator signatures at time of transition.
Format: ["validator-1:signature1", "validator-2:signature2", ...]
Provides cryptographic proof of validator consensus.';

COMMENT ON COLUMN bridge_transfer_history.agent IS
'Service or agent that initiated the state change.
Examples:
  - "CrossChainBridgeService"
  - "ScheduledRecoveryService"
  - "ManualIntervention"
  - "ValidatorNode-3"
  - "SystemAdmin"';

COMMENT ON COLUMN bridge_transfer_history.metadata IS
'Additional context in JSON format. Can store:
  - Block numbers (onSourceBlock, onTargetBlock)
  - Gas costs (gasUsed, gasPaid)
  - Network conditions (latency, confirmation_time)
  - Chain-specific details (nonce, sequence_number)
  - Custom application data';

-- =========================================================================
-- Foreign Key Constraint
-- =========================================================================

ALTER TABLE bridge_transfer_history
ADD CONSTRAINT fk_history_transaction_id
FOREIGN KEY (transaction_id)
REFERENCES bridge_transactions(transaction_id)
ON DELETE RESTRICT
ON UPDATE CASCADE;

-- =========================================================================
-- Constraint: Ensure Valid Status Values
-- =========================================================================

ALTER TABLE bridge_transfer_history
ADD CONSTRAINT check_valid_to_status
CHECK (to_status IN (
    'PENDING',
    'CONFIRMING',
    'COMPLETED',
    'FAILED',
    'REFUNDED'
));

ALTER TABLE bridge_transfer_history
ADD CONSTRAINT check_valid_from_status
CHECK (from_status IS NULL OR from_status IN (
    'PENDING',
    'CONFIRMING',
    'COMPLETED',
    'FAILED',
    'REFUNDED'
));

-- =========================================================================
-- Constraint: Ensure Status Transition Logic
-- =========================================================================

-- No transitions from final states (except retry path)
ALTER TABLE bridge_transfer_history
ADD CONSTRAINT check_status_transitions
CHECK (
    -- Allow COMPLETED or FAILED to only transition if it's a retry scenario
    (from_status NOT IN ('COMPLETED', 'REFUNDED')) OR
    (to_status = 'PENDING' AND reason ILIKE '%retry%')
);

-- =========================================================================
-- Partitioning for Large-Scale Performance (Optional - for future use)
-- =========================================================================

-- Note: This is a placeholder for future partitioning implementation
-- When table grows to millions of rows, consider partitioning by:
-- PARTITION BY RANGE (YEAR(timestamp))
-- This would create monthly or quarterly partitions for better performance

-- =========================================================================
-- Grant Permissions
-- =========================================================================

-- Application user append-only access (no updates/deletes)
GRANT INSERT, SELECT ON bridge_transfer_history TO aurigraph_app;
GRANT SELECT ON bridge_transfer_history TO aurigraph_readonly;

-- Sequence access for ID generation
GRANT USAGE, SELECT ON SEQUENCE bridge_transfer_history_id_seq TO aurigraph_app;

-- =========================================================================
-- End of Migration
-- =========================================================================
