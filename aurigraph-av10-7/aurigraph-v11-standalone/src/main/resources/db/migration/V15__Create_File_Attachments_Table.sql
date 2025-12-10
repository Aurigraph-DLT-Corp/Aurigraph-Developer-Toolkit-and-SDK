-- V15: Create File Attachments Table
-- JIRA: AV11-581
-- Description: File attachments with transaction ID and SHA256 hashing
-- Author: J4C Deployment Agent
-- Date: 2025-12-11

-- Create file_attachments table
CREATE TABLE IF NOT EXISTS file_attachments (
    id BIGSERIAL PRIMARY KEY,
    file_id VARCHAR(64) NOT NULL UNIQUE,
    original_name VARCHAR(255) NOT NULL,
    stored_name VARCHAR(255) NOT NULL,
    transaction_id VARCHAR(66),
    token_id VARCHAR(66),
    category VARCHAR(50) NOT NULL DEFAULT 'documents',
    file_size BIGINT NOT NULL,
    sha256_hash VARCHAR(64) NOT NULL,
    mime_type VARCHAR(100),
    storage_path VARCHAR(500) NOT NULL,
    uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    uploaded_by VARCHAR(100),
    description TEXT,
    verified BOOLEAN DEFAULT FALSE NOT NULL,
    deleted BOOLEAN DEFAULT FALSE NOT NULL,
    deleted_at TIMESTAMP WITH TIME ZONE,

    -- Constraints
    CONSTRAINT chk_file_size_positive CHECK (file_size > 0),
    CONSTRAINT chk_hash_format CHECK (sha256_hash ~ '^[a-fA-F0-9]{64}$'),
    CONSTRAINT chk_category CHECK (category IN ('documents', 'images', 'data', 'assets', 'contracts'))
);

-- Create indexes for efficient queries
CREATE INDEX IF NOT EXISTS idx_file_attachments_file_id
    ON file_attachments(file_id);

CREATE INDEX IF NOT EXISTS idx_file_attachments_transaction_id
    ON file_attachments(transaction_id)
    WHERE transaction_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_file_attachments_token_id
    ON file_attachments(token_id)
    WHERE token_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_file_attachments_sha256_hash
    ON file_attachments(sha256_hash);

CREATE INDEX IF NOT EXISTS idx_file_attachments_uploaded_at
    ON file_attachments(uploaded_at DESC);

CREATE INDEX IF NOT EXISTS idx_file_attachments_category
    ON file_attachments(category);

CREATE INDEX IF NOT EXISTS idx_file_attachments_not_deleted
    ON file_attachments(deleted)
    WHERE deleted = FALSE;

-- Composite index for common query patterns
CREATE INDEX IF NOT EXISTS idx_file_attachments_tx_category
    ON file_attachments(transaction_id, category)
    WHERE deleted = FALSE;

-- Add comments for documentation
COMMENT ON TABLE file_attachments IS 'Stores file attachment metadata with blockchain transaction linking and hash verification';
COMMENT ON COLUMN file_attachments.file_id IS 'Unique identifier for the file (UUID format)';
COMMENT ON COLUMN file_attachments.transaction_id IS 'Blockchain transaction ID this file is linked to';
COMMENT ON COLUMN file_attachments.token_id IS 'Token ID if file is linked to a specific token';
COMMENT ON COLUMN file_attachments.sha256_hash IS 'SHA256 hash of file content for integrity verification';
COMMENT ON COLUMN file_attachments.storage_path IS 'Full filesystem path where file is stored';
COMMENT ON COLUMN file_attachments.verified IS 'Whether the hash has been verified post-upload';
COMMENT ON COLUMN file_attachments.deleted IS 'Soft delete flag';
