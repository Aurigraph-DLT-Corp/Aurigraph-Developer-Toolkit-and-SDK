-- V28: Create Secondary Tokens Table
-- JIRA: AV11-601
-- Sprint: Sprint 1, Task 1.1 (prerequisite)
-- Description: Creates the secondary_tokens table referenced by SecondaryToken entity
-- Author: AV11-601 Secondary Token Versioning Initiative
-- Date: 2025-12-23

-- ============================================================================
-- SECONDARY TOKENS TABLE
-- ============================================================================
-- This table stores secondary tokens that are derived from primary tokens.
-- Secondary tokens represent specific rights: income streams, collateral, royalties.
-- Each secondary token maintains a link to its parent primary token.
-- ============================================================================

CREATE TABLE IF NOT EXISTS secondary_tokens (
    -- ========== PRIMARY KEY & IDENTITY ==========
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- ========== TOKEN IDENTITY ==========
    token_id VARCHAR(64) NOT NULL UNIQUE,

    -- ========== PARENT REFERENCE ==========
    parent_token_id VARCHAR(64) NOT NULL,

    -- ========== TOKEN CLASSIFICATION ==========
    token_type VARCHAR(50) NOT NULL,

    -- ========== FINANCIAL ==========
    face_value DECIMAL(20, 8) NOT NULL,
    revenue_share_percent DECIMAL(5, 2),

    -- ========== OWNERSHIP ==========
    owner VARCHAR(256) NOT NULL,

    -- ========== LIFECYCLE STATUS ==========
    status VARCHAR(50) NOT NULL DEFAULT 'CREATED',

    -- ========== DISTRIBUTION ==========
    distribution_frequency VARCHAR(50),

    -- ========== TIMESTAMPS ==========
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE,
    activated_at TIMESTAMP WITH TIME ZONE,
    expires_at TIMESTAMP WITH TIME ZONE,
    redeemed_at TIMESTAMP WITH TIME ZONE,

    -- ========== METADATA ==========
    metadata TEXT,

    -- ========== OPTIMISTIC LOCKING ==========
    version BIGINT NOT NULL DEFAULT 0,

    -- ========== CONSTRAINTS ==========

    -- Check: Status must be valid
    CONSTRAINT chk_st_status CHECK (status IN (
        'CREATED',
        'ACTIVE',
        'REDEEMED',
        'EXPIRED'
    )),

    -- Check: Token type must be valid
    CONSTRAINT chk_st_token_type CHECK (token_type IN (
        'INCOME_STREAM',
        'COLLATERAL',
        'ROYALTY'
    )),

    -- Check: Distribution frequency must be valid (if set)
    CONSTRAINT chk_st_distribution_frequency CHECK (
        distribution_frequency IS NULL OR
        distribution_frequency IN (
            'DAILY',
            'WEEKLY',
            'BIWEEKLY',
            'MONTHLY',
            'QUARTERLY',
            'SEMI_ANNUAL',
            'ANNUAL',
            'ON_DEMAND'
        )
    ),

    -- Check: Face value must be positive
    CONSTRAINT chk_st_face_value_positive CHECK (face_value > 0),

    -- Check: Revenue share must be between 0 and 100
    CONSTRAINT chk_st_revenue_share_range CHECK (
        revenue_share_percent IS NULL OR
        (revenue_share_percent >= 0 AND revenue_share_percent <= 100)
    )
);

-- ============================================================================
-- INDEXES FOR EFFICIENT QUERYING
-- ============================================================================

-- Index: Find token by token_id (unique, already covered by UNIQUE constraint)
CREATE UNIQUE INDEX idx_st_token_id
    ON secondary_tokens(token_id);

-- Index: Find secondary tokens by parent
CREATE INDEX idx_st_parent_token_id
    ON secondary_tokens(parent_token_id);

-- Index: Filter by token type
CREATE INDEX idx_st_token_type
    ON secondary_tokens(token_type);

-- Index: Filter by status
CREATE INDEX idx_st_status
    ON secondary_tokens(status);

-- Index: Find tokens by owner
CREATE INDEX idx_st_owner
    ON secondary_tokens(owner);

-- Composite Index: Owner + Status queries
CREATE INDEX idx_st_owner_status
    ON secondary_tokens(owner, status);

-- Composite Index: Parent + Status queries
CREATE INDEX idx_st_parent_status
    ON secondary_tokens(parent_token_id, status);

-- Index: Temporal queries (find by creation time)
CREATE INDEX idx_st_created_at
    ON secondary_tokens(created_at DESC);

-- ============================================================================
-- COMMENTS FOR DOCUMENTATION
-- ============================================================================

COMMENT ON TABLE secondary_tokens IS
    'Secondary tokens derived from primary tokens, representing specific rights: ' ||
    'income streams, collateral positions, and royalty streams.';

COMMENT ON COLUMN secondary_tokens.id IS
    'Unique identifier (UUID primary key)';

COMMENT ON COLUMN secondary_tokens.token_id IS
    'Unique token identifier format: ST-{type}-{uuid}';

COMMENT ON COLUMN secondary_tokens.parent_token_id IS
    'Reference to parent primary token ID';

COMMENT ON COLUMN secondary_tokens.token_type IS
    'Type: INCOME_STREAM, COLLATERAL, or ROYALTY';

COMMENT ON COLUMN secondary_tokens.face_value IS
    'Face value of the secondary token (must be positive)';

COMMENT ON COLUMN secondary_tokens.owner IS
    'Current owner wallet address or user identifier';

COMMENT ON COLUMN secondary_tokens.status IS
    'Lifecycle status: CREATED, ACTIVE, REDEEMED, EXPIRED';

COMMENT ON COLUMN secondary_tokens.revenue_share_percent IS
    'Revenue share percentage (0-100) for income tokens';

COMMENT ON COLUMN secondary_tokens.distribution_frequency IS
    'Distribution frequency for income tokens';

COMMENT ON COLUMN secondary_tokens.metadata IS
    'Extended metadata as JSON text';

COMMENT ON COLUMN secondary_tokens.version IS
    'Optimistic locking version';

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================

-- Verify table creation
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.tables
        WHERE table_name = 'secondary_tokens'
    ) THEN
        RAISE NOTICE 'V28 Migration completed successfully: secondary_tokens table created';
    ELSE
        RAISE EXCEPTION 'V28 Migration failed: secondary_tokens table not found';
    END IF;
END $$;
