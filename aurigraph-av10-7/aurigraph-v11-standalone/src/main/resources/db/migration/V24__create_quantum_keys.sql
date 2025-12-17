-- ==================================================================================
-- Aurigraph V12 Database Schema: Quantum Keys Table
-- ==================================================================================
-- Description: Quantum-resistant cryptographic key storage and lifecycle management
-- Version: V24
-- Created: 2025-12-16
-- Author: J4C Database Agent
-- ==================================================================================

-- Create quantum_keys table
CREATE TABLE IF NOT EXISTS quantum_keys (
    -- Primary identification
    id BIGSERIAL PRIMARY KEY,
    key_id VARCHAR(66) NOT NULL UNIQUE,          -- Unique key identifier (0x-prefixed)

    -- Cryptographic algorithm
    algorithm VARCHAR(50) NOT NULL,               -- CRYSTALS-Kyber, CRYSTALS-Dilithium, SPHINCS+

    -- Key data (stored as hash for security)
    public_key_hash VARCHAR(66) NOT NULL,         -- SHA3-256 hash of public key
    key_type VARCHAR(20) NOT NULL,                -- SIGNING, ENCRYPTION, HYBRID

    -- Owner information
    owner_address VARCHAR(66),                    -- Address of key owner (validator/user)

    -- Key lifecycle
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP WITH TIME ZONE,          -- Key expiration (for rotation)
    revoked_at TIMESTAMP WITH TIME ZONE,          -- If key was revoked early

    -- Key status
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE', -- ACTIVE, EXPIRED, REVOKED, ROTATED

    -- Security parameters
    security_level INTEGER NOT NULL DEFAULT 5,    -- NIST security level (3 or 5)
    key_size INTEGER NOT NULL,                    -- Key size in bytes

    -- Usage tracking
    usage_count BIGINT NOT NULL DEFAULT 0,        -- Number of times key was used
    last_used_at TIMESTAMP WITH TIME ZONE,        -- Last usage timestamp

    -- Rotation information
    rotated_to VARCHAR(66),                       -- key_id of replacement key (if rotated)
    rotation_reason TEXT,                         -- Reason for rotation

    -- Additional metadata (JSON for flexibility)
    metadata JSONB DEFAULT '{}'::JSONB,          -- Algorithm parameters, derivation info, etc.

    -- Constraints
    CONSTRAINT chk_algorithm CHECK (algorithm IN (
        'CRYSTALS-Kyber-512', 'CRYSTALS-Kyber-768', 'CRYSTALS-Kyber-1024',
        'CRYSTALS-Dilithium2', 'CRYSTALS-Dilithium3', 'CRYSTALS-Dilithium5',
        'SPHINCS+-SHA2-128s', 'SPHINCS+-SHA2-192s', 'SPHINCS+-SHA2-256s',
        'SPHINCS+-SHAKE-128s', 'SPHINCS+-SHAKE-192s', 'SPHINCS+-SHAKE-256s'
    )),
    CONSTRAINT chk_key_type CHECK (key_type IN ('SIGNING', 'ENCRYPTION', 'HYBRID')),
    CONSTRAINT chk_status CHECK (status IN ('ACTIVE', 'EXPIRED', 'REVOKED', 'ROTATED')),
    CONSTRAINT chk_security_level CHECK (security_level IN (1, 2, 3, 4, 5)),
    CONSTRAINT chk_key_size_positive CHECK (key_size > 0),
    CONSTRAINT chk_usage_count_positive CHECK (usage_count >= 0),
    CONSTRAINT chk_expires_after_created CHECK (expires_at IS NULL OR expires_at > created_at),
    CONSTRAINT chk_revoked_after_created CHECK (revoked_at IS NULL OR revoked_at >= created_at),
    CONSTRAINT chk_last_used_after_created CHECK (last_used_at IS NULL OR last_used_at >= created_at),
    CONSTRAINT chk_rotated_has_reason CHECK (
        (status = 'ROTATED' AND rotated_to IS NOT NULL AND rotation_reason IS NOT NULL)
        OR status != 'ROTATED'
    )
);

-- Create indexes for performance optimization
CREATE INDEX idx_quantum_keys_key_id ON quantum_keys(key_id);
CREATE INDEX idx_quantum_keys_algorithm ON quantum_keys(algorithm);
CREATE INDEX idx_quantum_keys_key_type ON quantum_keys(key_type);
CREATE INDEX idx_quantum_keys_owner_address ON quantum_keys(owner_address) WHERE owner_address IS NOT NULL;
CREATE INDEX idx_quantum_keys_status ON quantum_keys(status);
CREATE INDEX idx_quantum_keys_created_at ON quantum_keys(created_at DESC);
CREATE INDEX idx_quantum_keys_expires_at ON quantum_keys(expires_at ASC) WHERE expires_at IS NOT NULL;
CREATE INDEX idx_quantum_keys_last_used_at ON quantum_keys(last_used_at DESC) WHERE last_used_at IS NOT NULL;
CREATE INDEX idx_quantum_keys_security_level ON quantum_keys(security_level);

-- GIN index for JSONB metadata queries
CREATE INDEX idx_quantum_keys_metadata ON quantum_keys USING GIN (metadata);

-- Composite index for active keys by owner (common query pattern)
CREATE INDEX idx_quantum_keys_owner_status ON quantum_keys(owner_address, status)
    WHERE owner_address IS NOT NULL AND status = 'ACTIVE';

-- Composite index for key rotation chains
CREATE INDEX idx_quantum_keys_rotation_chain ON quantum_keys(key_id, rotated_to)
    WHERE rotated_to IS NOT NULL;

-- Index for expiring keys (use in queries for rotation alerts)
-- Note: Can't use CURRENT_TIMESTAMP in partial index, so filtering done at query time
CREATE INDEX idx_quantum_keys_expiring_candidates ON quantum_keys(status, expires_at ASC)
    WHERE expires_at IS NOT NULL;

-- Index for expired keys cleanup (filtering by status and expiry at query time)
CREATE INDEX idx_quantum_keys_status_expiry ON quantum_keys(status, expires_at DESC)
    WHERE status = 'ACTIVE' AND expires_at IS NOT NULL;

-- Comments for documentation
COMMENT ON TABLE quantum_keys IS 'Quantum-resistant cryptographic key storage and lifecycle management';
COMMENT ON COLUMN quantum_keys.id IS 'Auto-incrementing primary key';
COMMENT ON COLUMN quantum_keys.key_id IS 'Unique key identifier (0x-prefixed)';
COMMENT ON COLUMN quantum_keys.algorithm IS 'Quantum-resistant algorithm: CRYSTALS-Kyber, CRYSTALS-Dilithium, SPHINCS+';
COMMENT ON COLUMN quantum_keys.public_key_hash IS 'SHA3-256 hash of public key (for verification without exposing key)';
COMMENT ON COLUMN quantum_keys.key_type IS 'Key purpose: SIGNING (Dilithium), ENCRYPTION (Kyber), HYBRID (both)';
COMMENT ON COLUMN quantum_keys.owner_address IS 'Address of key owner (validator, user, or contract)';
COMMENT ON COLUMN quantum_keys.created_at IS 'Key generation timestamp';
COMMENT ON COLUMN quantum_keys.expires_at IS 'Key expiration timestamp (for automatic rotation)';
COMMENT ON COLUMN quantum_keys.revoked_at IS 'Timestamp when key was manually revoked';
COMMENT ON COLUMN quantum_keys.status IS 'Key status: ACTIVE, EXPIRED, REVOKED, ROTATED';
COMMENT ON COLUMN quantum_keys.security_level IS 'NIST post-quantum security level (1-5, typically 3 or 5)';
COMMENT ON COLUMN quantum_keys.key_size IS 'Key size in bytes';
COMMENT ON COLUMN quantum_keys.usage_count IS 'Number of times key has been used for signing/encryption';
COMMENT ON COLUMN quantum_keys.last_used_at IS 'Most recent usage timestamp';
COMMENT ON COLUMN quantum_keys.rotated_to IS 'key_id of replacement key (if this key was rotated)';
COMMENT ON COLUMN quantum_keys.rotation_reason IS 'Reason for key rotation (expiration, compromise, upgrade)';
COMMENT ON COLUMN quantum_keys.metadata IS 'Additional metadata (algorithm parameters, HSM info, derivation path)';

-- Create function to automatically mark expired keys
CREATE OR REPLACE FUNCTION update_expired_quantum_keys()
RETURNS INTEGER AS $$
DECLARE
    updated_count INTEGER;
BEGIN
    UPDATE quantum_keys
    SET status = 'EXPIRED'
    WHERE status = 'ACTIVE'
      AND expires_at IS NOT NULL
      AND expires_at < CURRENT_TIMESTAMP;

    GET DIAGNOSTICS updated_count = ROW_COUNT;
    RETURN updated_count;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION update_expired_quantum_keys IS 'Automatically mark expired keys (run via scheduled job)';

-- Create view for active keys requiring rotation
CREATE OR REPLACE VIEW quantum_keys_rotation_required AS
SELECT
    id,
    key_id,
    algorithm,
    owner_address,
    created_at,
    expires_at,
    EXTRACT(EPOCH FROM (expires_at - CURRENT_TIMESTAMP)) / 86400 AS days_until_expiry,
    usage_count,
    last_used_at,
    security_level
FROM quantum_keys
WHERE status = 'ACTIVE'
  AND expires_at IS NOT NULL
  AND expires_at <= CURRENT_TIMESTAMP + INTERVAL '30 days'
ORDER BY expires_at ASC;

COMMENT ON VIEW quantum_keys_rotation_required IS 'Active keys expiring within 30 days requiring rotation';

-- Create view for key rotation chains
CREATE OR REPLACE VIEW quantum_keys_rotation_chains AS
WITH RECURSIVE key_chain AS (
    -- Base case: keys that have been rotated
    SELECT
        key_id,
        owner_address,
        algorithm,
        created_at,
        expires_at,
        rotated_to,
        status,
        1 AS rotation_depth,
        ARRAY[key_id]::VARCHAR[] AS chain
    FROM quantum_keys
    WHERE rotated_to IS NOT NULL

    UNION ALL

    -- Recursive case: follow the rotation chain
    SELECT
        qk.key_id,
        qk.owner_address,
        qk.algorithm,
        qk.created_at,
        qk.expires_at,
        qk.rotated_to,
        qk.status,
        kc.rotation_depth + 1,
        kc.chain || qk.key_id::VARCHAR
    FROM quantum_keys qk
    INNER JOIN key_chain kc ON qk.key_id = kc.rotated_to
)
SELECT * FROM key_chain
ORDER BY owner_address, rotation_depth;

COMMENT ON VIEW quantum_keys_rotation_chains IS 'Complete key rotation chains showing key evolution';

-- Add foreign key to validators table (optional, for validator keys)
-- ALTER TABLE quantum_keys ADD CONSTRAINT fk_quantum_keys_owner
--     FOREIGN KEY (owner_address) REFERENCES validators(address) ON DELETE SET NULL;

-- Grant permissions (adjust as needed for your deployment)
-- GRANT SELECT, INSERT, UPDATE ON quantum_keys TO aurigraph_app;
-- GRANT USAGE, SELECT ON SEQUENCE quantum_keys_id_seq TO aurigraph_app;
-- GRANT SELECT ON quantum_keys_rotation_required TO aurigraph_app;
-- GRANT SELECT ON quantum_keys_rotation_chains TO aurigraph_app;
