-- V16: Create Registered Assets Table
-- JIRA: AV12-AR-002
-- Description: Asset Registry for tokenization platform with 12 categories
-- Author: J4C Development Agent
-- Date: 2025-12-11

-- Create registered_assets table
CREATE TABLE IF NOT EXISTS registered_assets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    category VARCHAR(50) NOT NULL,
    status VARCHAR(30) NOT NULL DEFAULT 'DRAFT',
    owner_id VARCHAR(100) NOT NULL,
    owner_name VARCHAR(255),
    estimated_value DECIMAL(20,2),
    currency VARCHAR(10) DEFAULT 'USD',
    location VARCHAR(255),
    country_code VARCHAR(2),
    metadata JSONB,
    token_id VARCHAR(66),
    contract_id VARCHAR(66),
    transaction_id VARCHAR(66),
    verifier_id VARCHAR(100),
    verified_at TIMESTAMP WITH TIME ZONE,
    listed_at TIMESTAMP WITH TIME ZONE,
    listing_price DECIMAL(20,2),
    sold_at TIMESTAMP WITH TIME ZONE,
    buyer_id VARCHAR(100),
    sale_price DECIMAL(20,2),
    document_count INTEGER DEFAULT 0,
    image_count INTEGER DEFAULT 0,
    external_ref VARCHAR(255),
    deleted BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    created_by VARCHAR(100),

    -- Category validation
    CONSTRAINT chk_category CHECK (category IN (
        'REAL_ESTATE', 'CARBON_CREDITS', 'INTELLECTUAL_PROPERTY',
        'FINANCIAL_SECURITIES', 'ART_COLLECTIBLES', 'COMMODITIES',
        'SUPPLY_CHAIN', 'INFRASTRUCTURE', 'ENERGY_ASSETS',
        'AGRICULTURAL', 'INSURANCE_PRODUCTS', 'RECEIVABLES'
    )),

    -- Status validation
    CONSTRAINT chk_status CHECK (status IN (
        'DRAFT', 'SUBMITTED', 'VERIFIED', 'REJECTED', 'LISTED', 'SOLD', 'ARCHIVED'
    )),

    -- Value constraints
    CONSTRAINT chk_estimated_value_positive CHECK (estimated_value IS NULL OR estimated_value >= 0),
    CONSTRAINT chk_listing_price_positive CHECK (listing_price IS NULL OR listing_price >= 0),
    CONSTRAINT chk_sale_price_positive CHECK (sale_price IS NULL OR sale_price >= 0)
);

-- Indexes for efficient queries
CREATE INDEX IF NOT EXISTS idx_registered_assets_category
    ON registered_assets(category)
    WHERE deleted = FALSE;

CREATE INDEX IF NOT EXISTS idx_registered_assets_status
    ON registered_assets(status)
    WHERE deleted = FALSE;

CREATE INDEX IF NOT EXISTS idx_registered_assets_owner
    ON registered_assets(owner_id)
    WHERE deleted = FALSE;

CREATE INDEX IF NOT EXISTS idx_registered_assets_created
    ON registered_assets(created_at DESC)
    WHERE deleted = FALSE;

CREATE INDEX IF NOT EXISTS idx_registered_assets_token
    ON registered_assets(token_id)
    WHERE token_id IS NOT NULL AND deleted = FALSE;

CREATE INDEX IF NOT EXISTS idx_registered_assets_contract
    ON registered_assets(contract_id)
    WHERE contract_id IS NOT NULL AND deleted = FALSE;

CREATE INDEX IF NOT EXISTS idx_registered_assets_verifier
    ON registered_assets(verifier_id)
    WHERE verifier_id IS NOT NULL AND deleted = FALSE;

-- Composite indexes for common query patterns
CREATE INDEX IF NOT EXISTS idx_registered_assets_owner_status
    ON registered_assets(owner_id, status)
    WHERE deleted = FALSE;

CREATE INDEX IF NOT EXISTS idx_registered_assets_category_status
    ON registered_assets(category, status)
    WHERE deleted = FALSE;

-- GIN index for JSONB metadata queries
CREATE INDEX IF NOT EXISTS idx_registered_assets_metadata
    ON registered_assets USING GIN (metadata);

-- Full-text search on name and description
CREATE INDEX IF NOT EXISTS idx_registered_assets_text_search
    ON registered_assets USING GIN (to_tsvector('english', COALESCE(name, '') || ' ' || COALESCE(description, '')));

-- Comments for documentation
COMMENT ON TABLE registered_assets IS 'Asset Registry for tokenization platform - supports 12 asset categories';
COMMENT ON COLUMN registered_assets.id IS 'Unique asset identifier (UUID)';
COMMENT ON COLUMN registered_assets.category IS 'Asset category: REAL_ESTATE, CARBON_CREDITS, INTELLECTUAL_PROPERTY, etc.';
COMMENT ON COLUMN registered_assets.status IS 'Lifecycle status: DRAFT -> SUBMITTED -> VERIFIED -> LISTED -> SOLD';
COMMENT ON COLUMN registered_assets.metadata IS 'Flexible JSONB field for category-specific attributes';
COMMENT ON COLUMN registered_assets.token_id IS 'Token ID if asset has been tokenized';
COMMENT ON COLUMN registered_assets.contract_id IS 'Smart contract ID linked to this asset';
COMMENT ON COLUMN registered_assets.verifier_id IS 'Third-party verifier who verified this asset';
