-- V29: Create Secondary Token Versions Table
-- JIRA: AV11-601
-- Sprint: Sprint 1, Task 1.2
-- Description: Implements versioned history tracking for secondary tokens with VVB approval workflow
-- Depends on: V28 (secondary_tokens table must exist)
-- Author: AV11-601 Secondary Token Versioning Initiative
-- Date: 2025-12-23

-- ============================================================================
-- SECONDARY TOKEN VERSIONS TABLE
-- ============================================================================
-- This table maintains a complete audit trail of all changes to secondary tokens.
-- Each row represents an immutable version of a token's state at a point in time.
-- Versions form a chain via previous_version_id, enabling full history reconstruction.
--
-- Key Features:
-- - Immutable version records (no updates after creation)
-- - JSONB content storage for flexible metadata
-- - Merkle hash chaining for integrity verification
-- - VVB (Verified Valuator Board) approval workflow
-- - Soft archival via archived_at timestamp
-- - Version chain via previous_version_id reference
-- ============================================================================

CREATE TABLE IF NOT EXISTS secondary_token_versions (
    -- ========== PRIMARY KEY & IDENTITY ==========
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- ========== TOKEN REFERENCE & VERSIONING ==========
    secondary_token_id UUID NOT NULL,
    version_number INTEGER NOT NULL,

    -- ========== CONTENT & STATE ==========
    content JSONB NOT NULL,
    status VARCHAR(50) NOT NULL,
    change_type VARCHAR(50) NOT NULL,

    -- ========== AUDIT TRAIL ==========
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    created_by VARCHAR(256) NOT NULL,

    -- ========== VERSION CHAIN ==========
    previous_version_id UUID,
    merkle_hash VARCHAR(64) NOT NULL,

    -- ========== VVB APPROVAL WORKFLOW ==========
    vvb_required BOOLEAN NOT NULL DEFAULT FALSE,
    vvb_status VARCHAR(50) NOT NULL DEFAULT 'NOT_REQUIRED',
    vvb_approved_at TIMESTAMP WITH TIME ZONE,
    vvb_approved_by VARCHAR(256),

    -- ========== ACTIVATION & REPLACEMENT ==========
    activated_at TIMESTAMP WITH TIME ZONE,
    replaced_by UUID,
    replaced_at TIMESTAMP WITH TIME ZONE,

    -- ========== ARCHIVAL ==========
    archived_at TIMESTAMP WITH TIME ZONE,

    -- ========== ADDITIONAL METADATA ==========
    metadata JSONB,

    -- ========== OPTIMISTIC LOCKING ==========
    version BIGINT NOT NULL DEFAULT 0,

    -- ========== CONSTRAINTS ==========

    -- Unique constraint: One version number per token
    CONSTRAINT uk_secondary_token_version UNIQUE (secondary_token_id, version_number),

    -- Foreign key to secondary_tokens table
    CONSTRAINT fk_stv_secondary_token
        FOREIGN KEY (secondary_token_id)
        REFERENCES secondary_tokens(id)
        ON DELETE CASCADE,

    -- Self-referential FK for version chain
    CONSTRAINT fk_stv_previous_version
        FOREIGN KEY (previous_version_id)
        REFERENCES secondary_token_versions(id)
        ON DELETE SET NULL,

    -- Self-referential FK for replacement tracking
    CONSTRAINT fk_stv_replaced_by
        FOREIGN KEY (replaced_by)
        REFERENCES secondary_token_versions(id)
        ON DELETE SET NULL,

    -- Check: Version number must be positive
    CONSTRAINT chk_stv_version_number_positive
        CHECK (version_number > 0),

    -- Check: Status must be valid
    CONSTRAINT chk_stv_status CHECK (status IN (
        'CREATED',
        'ACTIVE',
        'REDEEMED',
        'EXPIRED'
    )),

    -- Check: Change type must be valid
    CONSTRAINT chk_stv_change_type CHECK (change_type IN (
        'OWNERSHIP_CHANGE',
        'METADATA_UPDATE',
        'DOCUMENT_ADDITION',
        'DAMAGE_REPORT',
        'VALUATION_UPDATE',
        'COMPLIANCE_UPDATE',
        'STATUS_CHANGE',
        'REVENUE_DISTRIBUTION',
        'COLLATERAL_UPDATE',
        'MAINTENANCE_RECORD'
    )),

    -- Check: Merkle hash must be 64 characters (SHA-256 hex)
    CONSTRAINT chk_stv_merkle_hash_length
        CHECK (length(merkle_hash) = 64),

    -- Check: VVB status must be valid
    CONSTRAINT chk_stv_vvb_status CHECK (vvb_status IN (
        'NOT_REQUIRED',
        'PENDING',
        'APPROVED',
        'REJECTED',
        'TIMEOUT'
    )),

    -- Check: If VVB approved, approver must be set
    CONSTRAINT chk_stv_vvb_approval_consistency
        CHECK (
            (vvb_approved_at IS NULL AND vvb_approved_by IS NULL) OR
            (vvb_approved_at IS NOT NULL AND vvb_approved_by IS NOT NULL)
        ),

    -- Check: Replacement consistency (if replaced_by set, replaced_at must be set)
    CONSTRAINT chk_stv_replacement_consistency
        CHECK (
            (replaced_by IS NULL AND replaced_at IS NULL) OR
            (replaced_by IS NOT NULL AND replaced_at IS NOT NULL)
        ),

    -- Check: Version 1 should not have previous version
    CONSTRAINT chk_stv_version_1_no_previous
        CHECK (
            (version_number = 1 AND previous_version_id IS NULL) OR
            (version_number > 1)
        )
);

-- ============================================================================
-- INDEXES FOR EFFICIENT QUERYING
-- ============================================================================

-- Index: Find all versions for a secondary token (most common query)
CREATE INDEX idx_stv_secondary_token_id
    ON secondary_token_versions(secondary_token_id);

-- Index: Filter by status (e.g., find all active versions)
CREATE INDEX idx_stv_status
    ON secondary_token_versions(status)
    WHERE archived_at IS NULL;

-- Index: Temporal queries (find versions by creation time)
CREATE INDEX idx_stv_created_at
    ON secondary_token_versions(created_at DESC);

-- Index: Filter by change type (e.g., all ownership changes)
CREATE INDEX idx_stv_change_type
    ON secondary_token_versions(change_type);

-- Index: Find versions by creator
CREATE INDEX idx_stv_created_by
    ON secondary_token_versions(created_by);

-- Index: Find versions pending VVB approval
CREATE INDEX idx_stv_vvb_pending
    ON secondary_token_versions(vvb_required, vvb_approved_at)
    WHERE vvb_required = TRUE AND vvb_approved_at IS NULL;

-- Index: Filter by VVB status
CREATE INDEX idx_stv_vvb_status
    ON secondary_token_versions(vvb_status);

-- Index: Find active (non-archived) versions
CREATE INDEX idx_stv_active
    ON secondary_token_versions(secondary_token_id, archived_at)
    WHERE archived_at IS NULL;

-- Index: Find replaced versions
CREATE INDEX idx_stv_replaced
    ON secondary_token_versions(replaced_by, replaced_at)
    WHERE replaced_by IS NOT NULL;

-- Composite Index: Find latest version by token and version number
CREATE INDEX idx_stv_token_version
    ON secondary_token_versions(secondary_token_id, version_number DESC);

-- GIN Index: JSONB content queries
CREATE INDEX idx_stv_content
    ON secondary_token_versions USING GIN (content);

-- GIN Index: JSONB metadata queries
CREATE INDEX idx_stv_metadata
    ON secondary_token_versions USING GIN (metadata);

-- ============================================================================
-- COMMENTS FOR DOCUMENTATION
-- ============================================================================

COMMENT ON TABLE secondary_token_versions IS
    'Versioned history tracking for secondary tokens with VVB approval workflow. ' ||
    'Each row is an immutable version record forming a Merkle-chained audit trail.';

COMMENT ON COLUMN secondary_token_versions.id IS
    'Unique version identifier (UUID primary key)';

COMMENT ON COLUMN secondary_token_versions.secondary_token_id IS
    'Reference to parent secondary token (FK to secondary_tokens.id)';

COMMENT ON COLUMN secondary_token_versions.version_number IS
    'Sequential version number, unique per token (starts at 1)';

COMMENT ON COLUMN secondary_token_versions.content IS
    'Token state and metadata as JSONB (flexible schema)';

COMMENT ON COLUMN secondary_token_versions.status IS
    'Version status: CREATED, ACTIVE, REDEEMED, EXPIRED';

COMMENT ON COLUMN secondary_token_versions.change_type IS
    'Type of change: OWNERSHIP_CHANGE, METADATA_UPDATE, DOCUMENT_ADDITION, ' ||
    'DAMAGE_REPORT, VALUATION_UPDATE, COMPLIANCE_UPDATE, STATUS_CHANGE, ' ||
    'REVENUE_DISTRIBUTION, COLLATERAL_UPDATE, MAINTENANCE_RECORD';

COMMENT ON COLUMN secondary_token_versions.created_at IS
    'Immutable creation timestamp (indexed for temporal queries)';

COMMENT ON COLUMN secondary_token_versions.created_by IS
    'User or system identifier that created this version';

COMMENT ON COLUMN secondary_token_versions.previous_version_id IS
    'Reference to previous version (forms version chain, NULL for version 1)';

COMMENT ON COLUMN secondary_token_versions.merkle_hash IS
    'SHA-256 hash of content + previous hash (integrity verification)';

COMMENT ON COLUMN secondary_token_versions.vvb_required IS
    'Flag indicating if VVB (Verified Valuator Board) approval required';

COMMENT ON COLUMN secondary_token_versions.vvb_status IS
    'VVB approval status: NOT_REQUIRED, PENDING, APPROVED, REJECTED, TIMEOUT';

COMMENT ON COLUMN secondary_token_versions.vvb_approved_at IS
    'Timestamp when VVB approval granted (NULL if not yet approved)';

COMMENT ON COLUMN secondary_token_versions.vvb_approved_by IS
    'User or system that granted VVB approval';

COMMENT ON COLUMN secondary_token_versions.activated_at IS
    'Timestamp when this version was activated';

COMMENT ON COLUMN secondary_token_versions.replaced_by IS
    'UUID of version that replaced this one (NULL if current version)';

COMMENT ON COLUMN secondary_token_versions.replaced_at IS
    'Timestamp when this version was replaced';

COMMENT ON COLUMN secondary_token_versions.archived_at IS
    'Soft deletion timestamp (NULL if active, set when superseded)';

COMMENT ON COLUMN secondary_token_versions.metadata IS
    'Additional metadata as JSONB (supplementary information)';

COMMENT ON COLUMN secondary_token_versions.version IS
    'Optimistic locking version (prevents concurrent modification conflicts)';

-- ============================================================================
-- SEED DATA (OPTIONAL - FOR TESTING)
-- ============================================================================

-- No seed data required - versions will be created dynamically as tokens change

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================

-- Verify table creation
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.tables
        WHERE table_name = 'secondary_token_versions'
    ) THEN
        RAISE NOTICE 'V29 Migration completed successfully: secondary_token_versions table created';
    ELSE
        RAISE EXCEPTION 'V29 Migration failed: secondary_token_versions table not found';
    END IF;
END $$;
