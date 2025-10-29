-- =========================================================================
-- V5__Create_Atomic_Swap_State_Table.sql
-- =========================================================================
-- Liquibase database migration for Aurigraph V11 Atomic Swap Persistence
--
-- Creates the atomic_swap_state table for persistent storage of Hash Time-Locked
-- Contract (HTLC) state. This enables atomic swaps to survive service restarts
-- while maintaining cryptographic security guarantees.
--
-- Key Features:
-- - HTLC lifecycle tracking (INITIATED -> LOCKED -> REVEALED -> COMPLETED/REFUNDED)
-- - Timeout management for expiration and refund scenarios
-- - Secret management for trusted revelation
-- - Cross-chain contract tracking
-- - Transaction hash storage for both chains
--
-- Changelog:
-- 2025-10-29: Initial creation for Sprint 14 atomic swap support
-- =========================================================================

-- Create the atomic_swap_state table
CREATE TABLE IF NOT EXISTS atomic_swap_state (
    id BIGSERIAL PRIMARY KEY,

    -- Transaction Link
    transaction_id VARCHAR(64) NOT NULL UNIQUE,

    -- HTLC Cryptographic Elements
    htlc_hash VARCHAR(64) NOT NULL,
    htlc_secret VARCHAR(64),
    lock_time BIGINT NOT NULL,
    timeout_at TIMESTAMP NOT NULL,

    -- Swap Status and Amount
    swap_status VARCHAR(32) NOT NULL,
    amount NUMERIC(36, 18) NOT NULL CHECK (amount > 0),

    -- Initiator and Participant
    initiator_address VARCHAR(128) NOT NULL,
    participant_address VARCHAR(128) NOT NULL,

    -- Blockchain Information
    source_chain VARCHAR(32),
    target_chain VARCHAR(32),

    -- Smart Contract Addresses
    source_contract_address VARCHAR(128),
    target_contract_address VARCHAR(128),

    -- Lock Transaction Hashes (Funding Phase)
    source_lock_tx_hash VARCHAR(128),
    target_lock_tx_hash VARCHAR(128),

    -- Redeem Transaction Hashes (Claiming Phase)
    source_redeem_tx_hash VARCHAR(128),
    target_redeem_tx_hash VARCHAR(128),

    -- Timestamps
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP,

    -- Optimistic Locking
    version BIGINT DEFAULT 0

) TABLESPACE pg_default;

-- =========================================================================
-- Indexes for Query Performance
-- =========================================================================

-- Primary lookup by transaction ID
CREATE UNIQUE INDEX idx_swap_tx_id
    ON atomic_swap_state (transaction_id)
    TABLESPACE pg_default;

-- HTLC hash lookup (for secret revelation scenarios)
CREATE INDEX idx_swap_htlc_hash
    ON atomic_swap_state (htlc_hash)
    TABLESPACE pg_default;

-- Status-based lookups
CREATE INDEX idx_swap_status
    ON atomic_swap_state (swap_status)
    TABLESPACE pg_default;

-- Timeout queries (for expiration and refund detection)
CREATE INDEX idx_swap_timeout
    ON atomic_swap_state (timeout_at)
    TABLESPACE pg_default;

-- Active swaps query (INITIATED or LOCKED status)
CREATE INDEX idx_swap_active
    ON atomic_swap_state (swap_status)
    WHERE swap_status IN ('INITIATED', 'LOCKED')
    TABLESPACE pg_default;

-- Expiring swaps query (approaching timeout)
CREATE INDEX idx_swap_expiring
    ON atomic_swap_state (timeout_at, swap_status)
    WHERE swap_status = 'LOCKED'
    TABLESPACE pg_default;

-- Initiator lookups
CREATE INDEX idx_swap_initiator
    ON atomic_swap_state (initiator_address)
    TABLESPACE pg_default;

-- Participant lookups
CREATE INDEX idx_swap_participant
    ON atomic_swap_state (participant_address)
    TABLESPACE pg_default;

-- Chain-based lookups
CREATE INDEX idx_swap_source_chain
    ON atomic_swap_state (source_chain)
    TABLESPACE pg_default;

CREATE INDEX idx_swap_target_chain
    ON atomic_swap_state (target_chain)
    TABLESPACE pg_default;

-- Chain pair lookups (specific corridor)
CREATE INDEX idx_swap_chain_pair
    ON atomic_swap_state (source_chain, target_chain)
    TABLESPACE pg_default;

-- Revealed secrets (for claiming scenarios)
CREATE INDEX idx_swap_revealed_secrets
    ON atomic_swap_state (swap_status)
    WHERE htlc_secret IS NOT NULL
    TABLESPACE pg_default;

-- =========================================================================
-- Table Comments and Documentation
-- =========================================================================

COMMENT ON TABLE atomic_swap_state IS
'Persistent storage for atomic swap (HTLC) state.
Ensures atomic swaps survive service restarts while maintaining
cryptographic security guarantees of Hash Time-Locked Contracts.

Lifecycle: INITIATED -> LOCKED -> REVEALED -> COMPLETED
Or: INITIATED -> LOCKED -> (timeout) -> REFUNDED -> (claim) -> EXPIRED';

COMMENT ON COLUMN atomic_swap_state.transaction_id IS
'Foreign key reference to bridge_transactions.transaction_id
Unique identifier for the swap transaction';

COMMENT ON COLUMN atomic_swap_state.htlc_hash IS
'SHA-256 hash of the HTLC secret (cryptographic commitment).
This hash is disclosed to both parties before funding.
Both parties must prove they know the secret by revealing it.';

COMMENT ON COLUMN atomic_swap_state.htlc_secret IS
'The secret value that unlocks the HTLC.
Initially null. Revealed by initiator to claim funds on target chain.
Once revealed, participant can claim funds on source chain.
The requirement to reveal the secret ensures atomic execution.';

COMMENT ON COLUMN atomic_swap_state.lock_time IS
'Unix epoch milliseconds when funds were locked.
Used to track age and enforce timeout constraints.';

COMMENT ON COLUMN atomic_swap_state.timeout_at IS
'Timestamp when HTLC timeout expires.
After this time, both parties can refund their locked funds.
Typically 24-48 hours from swap initiation.
Critical for preventing indefinite fund lockups.';

COMMENT ON COLUMN atomic_swap_state.swap_status IS
'Current status of the atomic swap:
  INITIATED: Swap created, awaiting fund lock
  LOCKED: Funds locked on both chains, awaiting secret revelation
  REVEALED: Secret revealed, funds can be claimed
  COMPLETED: Both parties successfully claimed their funds
  REFUNDED: Timeout expired, funds returned to original owners
  EXPIRED: Swap expired without completion or refund';

COMMENT ON COLUMN atomic_swap_state.initiator_address IS
'Address of the party who initiates the atomic swap.
Initiator creates the HTLC on source chain and reveals the secret.';

COMMENT ON COLUMN atomic_swap_state.participant_address IS
'Address of the counterparty in the atomic swap.
Participant creates HTLC on target chain and claims based on revealed secret.';

COMMENT ON COLUMN atomic_swap_state.source_contract_address IS
'Smart contract address on source chain implementing the HTLC.
Different chains have different HTLC implementations (Ethereum, Solana, etc.)';

COMMENT ON COLUMN atomic_swap_state.target_contract_address IS
'Smart contract address on target chain implementing the HTLC.
Mirrors the source contract structure for atomic guarantees.';

COMMENT ON COLUMN atomic_swap_state.source_lock_tx_hash IS
'Transaction hash on source chain that locks the funds.
Proof that funds are committed for the swap.';

COMMENT ON COLUMN atomic_swap_state.target_lock_tx_hash IS
'Transaction hash on target chain that locks the funds.
Ensures both parties have committed their funds.';

COMMENT ON COLUMN atomic_swap_state.source_redeem_tx_hash IS
'Transaction hash on source chain that claims/redeems locked funds.
Set when participant claims funds after secret revelation.';

COMMENT ON COLUMN atomic_swap_state.target_redeem_tx_hash IS
'Transaction hash on target chain that claims/redeems locked funds.
Set when initiator claims funds using revealed secret.';

COMMENT ON COLUMN atomic_swap_state.version IS
'Optimistic locking version - incremented on each update
Detects concurrent modification conflicts';

-- =========================================================================
-- Constraint: Ensure Valid Swap Status
-- =========================================================================

ALTER TABLE atomic_swap_state
ADD CONSTRAINT check_valid_swap_status
CHECK (swap_status IN (
    'INITIATED',
    'LOCKED',
    'REVEALED',
    'COMPLETED',
    'REFUNDED',
    'EXPIRED'
));

-- =========================================================================
-- Constraint: Timeout Must Be In Future
-- =========================================================================

ALTER TABLE atomic_swap_state
ADD CONSTRAINT check_timeout_future
CHECK (timeout_at > created_at);

-- =========================================================================
-- Trigger for Updated At Timestamp
-- =========================================================================

CREATE OR REPLACE FUNCTION update_atomic_swap_state_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS atomic_swap_state_updated_at_trigger ON atomic_swap_state;

CREATE TRIGGER atomic_swap_state_updated_at_trigger
BEFORE UPDATE ON atomic_swap_state
FOR EACH ROW
EXECUTE FUNCTION update_atomic_swap_state_updated_at();

-- =========================================================================
-- Constraint: Ensure Completed Swaps Have Secret Revealed
-- =========================================================================

ALTER TABLE atomic_swap_state
ADD CONSTRAINT check_completed_must_have_secret
CHECK (
    (swap_status != 'COMPLETED') OR
    (htlc_secret IS NOT NULL AND htlc_secret != '')
);

-- =========================================================================
-- Foreign Key Constraint
-- =========================================================================

ALTER TABLE atomic_swap_state
ADD CONSTRAINT fk_atomic_swap_transaction_id
FOREIGN KEY (transaction_id)
REFERENCES bridge_transactions(transaction_id)
ON DELETE RESTRICT
ON UPDATE CASCADE;

-- =========================================================================
-- Grant Permissions
-- =========================================================================

-- Application user read/write access
GRANT SELECT, INSERT, UPDATE ON atomic_swap_state TO aurigraph_app;
GRANT SELECT ON atomic_swap_state TO aurigraph_readonly;

-- Sequence access for ID generation
GRANT USAGE, SELECT ON SEQUENCE atomic_swap_state_id_seq TO aurigraph_app;

-- =========================================================================
-- Documentation: Atomic Swap Lifecycle
-- =========================================================================

/*
ATOMIC SWAP LIFECYCLE:

1. INITIATED
   - Initiator creates HTLC with hash (doesn't reveal secret yet)
   - Participant receives HTLC hash and deposit terms
   - Funds are NOT locked yet
   Transitions to: LOCKED

2. LOCKED
   - Funds locked on both chains via HTLC smart contracts
   - Transaction hashes recorded (source_lock_tx_hash, target_lock_tx_hash)
   - Both parties can see each other's deposits
   Transitions to: REVEALED (when secret revealed) or REFUNDED (if timeout)

3. REVEALED
   - Initiator reveals the HTLC secret
   - Both parties now know the secret
   - Can proceed to claim funds
   Transitions to: COMPLETED

4. COMPLETED
   - Both parties have claimed their funds using the revealed secret
   - Transaction hashes recorded (source_redeem_tx_hash, target_redeem_tx_hash)
   - Swap successfully finished
   - Final state

5. REFUNDED (Timeout Path)
   - Timeout expired without secret revelation
   - Both parties can now refund their original funds
   - Transaction hashes recorded for refund operations
   Transitions to: EXPIRED

REFUND GUARANTEE:
- If initiator never reveals secret, funds are locked until timeout
- At timeout, both parties can reclaim their original funds
- This ensures neither party loses funds due to abandonment
*/

-- =========================================================================
-- End of Migration
-- =========================================================================
