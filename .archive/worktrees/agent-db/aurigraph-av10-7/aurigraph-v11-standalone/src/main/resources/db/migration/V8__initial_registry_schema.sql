-- ==================== AURIGRAPH V11 DATABASE LAYER - INITIAL REGISTRY SCHEMA ====================
-- Migration: V8__initial_registry_schema.sql
-- Author: agent-db
-- Date: 2025-11-14
-- Description: Complete database schema for Asset Traceability and Registry APIs
--
-- Tables Created:
-- 1. asset_trace (Asset lifecycle tracking)
-- 2. ownership_record (Ownership transfer history)
-- 3. audit_trail_entry (Complete audit log)
-- 4. registry_entry (Generic registry)
-- 5. smart_contract (Contract lifecycle)
-- 6. compliance_certification (Multi-level compliance)
--
-- Performance Features:
-- - 30+ indexes for optimized queries
-- - Foreign key constraints for data integrity
-- - JSONB columns for flexible metadata
-- - UUID primary keys for global uniqueness
-- - Automatic timestamp management via triggers
--
-- Compliance Features:
-- - Multi-tenant isolation
-- - Audit trail for all operations
-- - Soft delete with archive support
-- - Chain of custody verification
-- ================================================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ==================== TABLE 1: ASSET_TRACE ====================
CREATE TABLE IF NOT EXISTS asset_trace (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    asset_id VARCHAR(255) NOT NULL UNIQUE,
    asset_type VARCHAR(100) NOT NULL,
    asset_name VARCHAR(500) NOT NULL,
    description TEXT,
    serial_number VARCHAR(255),
    batch_id VARCHAR(255),
    manufacturer VARCHAR(255),
    manufacture_date TIMESTAMP,
    expiry_date TIMESTAMP,
    status VARCHAR(50) NOT NULL,
    current_owner_id VARCHAR(255),
    current_location VARCHAR(500),
    latitude DECIMAL(10, 7),
    longitude DECIMAL(10, 7),
    quantity DECIMAL(19, 4),
    unit_of_measure VARCHAR(50),
    value_usd DECIMAL(19, 2),
    currency_code VARCHAR(10),
    chain_of_custody_verified BOOLEAN NOT NULL DEFAULT FALSE,
    compliance_status VARCHAR(50),
    regulatory_framework VARCHAR(100),
    custom_attributes JSONB,
    sensors_data JSONB,
    certifications JSONB,
    blockchain_tx_hash VARCHAR(255),
    smart_contract_address VARCHAR(255),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(255),
    updated_by VARCHAR(255),
    tenant_id VARCHAR(255),
    archived BOOLEAN NOT NULL DEFAULT FALSE,
    archived_at TIMESTAMP
);

-- Indexes for asset_trace
CREATE INDEX idx_asset_trace_asset_id ON asset_trace(asset_id);
CREATE INDEX idx_asset_trace_asset_type ON asset_trace(asset_type);
CREATE INDEX idx_asset_trace_status ON asset_trace(status);
CREATE INDEX idx_asset_trace_owner ON asset_trace(current_owner_id);
CREATE INDEX idx_asset_trace_created ON asset_trace(created_at);
CREATE INDEX idx_asset_trace_location ON asset_trace(current_location);
CREATE INDEX idx_asset_trace_batch ON asset_trace(batch_id);
CREATE INDEX idx_asset_trace_serial ON asset_trace(serial_number);
CREATE INDEX idx_asset_trace_tenant ON asset_trace(tenant_id);
CREATE INDEX idx_asset_trace_archived ON asset_trace(archived);

-- ==================== TABLE 2: OWNERSHIP_RECORD ====================
CREATE TABLE IF NOT EXISTS ownership_record (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    asset_id UUID NOT NULL,
    from_owner_id VARCHAR(255),
    from_owner_name VARCHAR(500),
    to_owner_id VARCHAR(255) NOT NULL,
    to_owner_name VARCHAR(500),
    transfer_date TIMESTAMP NOT NULL,
    transfer_type VARCHAR(50) NOT NULL,
    transfer_reason TEXT,
    transfer_price DECIMAL(19, 2),
    currency_code VARCHAR(10),
    status VARCHAR(50) NOT NULL,
    verification_status VARCHAR(50),
    verified_at TIMESTAMP,
    verified_by VARCHAR(255),
    from_owner_signature TEXT,
    to_owner_signature TEXT,
    witness_signature TEXT,
    escrow_agent_id VARCHAR(255),
    escrow_release_date TIMESTAMP,
    blockchain_tx_hash VARCHAR(255),
    smart_contract_address VARCHAR(255),
    transfer_metadata JSONB,
    compliance_documents JSONB,
    notes TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(255),
    tenant_id VARCHAR(255),
    CONSTRAINT fk_ownership_asset FOREIGN KEY (asset_id) REFERENCES asset_trace(id) ON DELETE CASCADE
);

-- Indexes for ownership_record
CREATE INDEX idx_ownership_asset_id ON ownership_record(asset_id);
CREATE INDEX idx_ownership_from_owner ON ownership_record(from_owner_id);
CREATE INDEX idx_ownership_to_owner ON ownership_record(to_owner_id);
CREATE INDEX idx_ownership_transfer_date ON ownership_record(transfer_date);
CREATE INDEX idx_ownership_status ON ownership_record(status);
CREATE INDEX idx_ownership_tx_hash ON ownership_record(blockchain_tx_hash);
CREATE INDEX idx_ownership_tenant ON ownership_record(tenant_id);

-- ==================== TABLE 3: AUDIT_TRAIL_ENTRY ====================
CREATE TABLE IF NOT EXISTS audit_trail_entry (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    asset_id UUID,
    entity_type VARCHAR(100) NOT NULL,
    entity_id VARCHAR(255) NOT NULL,
    action_type VARCHAR(100) NOT NULL,
    action_description TEXT,
    timestamp TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    user_id VARCHAR(255),
    user_name VARCHAR(500),
    user_role VARCHAR(100),
    ip_address VARCHAR(50),
    user_agent VARCHAR(500),
    session_id VARCHAR(255),
    before_state JSONB,
    after_state JSONB,
    changes JSONB,
    metadata JSONB,
    severity VARCHAR(50),
    success BOOLEAN NOT NULL,
    error_message TEXT,
    error_code VARCHAR(50),
    blockchain_tx_hash VARCHAR(255),
    previous_entry_hash VARCHAR(255),
    entry_hash VARCHAR(255),
    verified BOOLEAN NOT NULL DEFAULT FALSE,
    verified_at TIMESTAMP,
    compliance_tags VARCHAR(500),
    tenant_id VARCHAR(255),
    CONSTRAINT fk_audit_asset FOREIGN KEY (asset_id) REFERENCES asset_trace(id) ON DELETE SET NULL
);

-- Indexes for audit_trail_entry
CREATE INDEX idx_audit_asset_id ON audit_trail_entry(asset_id);
CREATE INDEX idx_audit_action_type ON audit_trail_entry(action_type);
CREATE INDEX idx_audit_timestamp ON audit_trail_entry(timestamp);
CREATE INDEX idx_audit_user ON audit_trail_entry(user_id);
CREATE INDEX idx_audit_entity_type ON audit_trail_entry(entity_type);
CREATE INDEX idx_audit_entity_id ON audit_trail_entry(entity_id);
CREATE INDEX idx_audit_severity ON audit_trail_entry(severity);
CREATE INDEX idx_audit_success ON audit_trail_entry(success);
CREATE INDEX idx_audit_tenant ON audit_trail_entry(tenant_id);

-- ==================== TABLE 4: REGISTRY_ENTRY ====================
CREATE TABLE IF NOT EXISTS registry_entry (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    registry_key VARCHAR(500) NOT NULL UNIQUE,
    entry_type VARCHAR(100) NOT NULL,
    category VARCHAR(100),
    name VARCHAR(500) NOT NULL,
    description TEXT,
    value JSONB,
    metadata JSONB,
    version INTEGER NOT NULL DEFAULT 1,
    status VARCHAR(50) NOT NULL,
    parent_id UUID,
    priority INTEGER NOT NULL DEFAULT 0,
    tags VARCHAR(1000),
    blockchain_address VARCHAR(255),
    smart_contract_abi TEXT,
    deployed_at TIMESTAMP,
    deprecated_at TIMESTAMP,
    deprecation_reason TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(255),
    updated_by VARCHAR(255),
    tenant_id VARCHAR(255),
    archived BOOLEAN NOT NULL DEFAULT FALSE,
    archived_at TIMESTAMP
);

-- Indexes for registry_entry
CREATE UNIQUE INDEX idx_registry_key ON registry_entry(registry_key);
CREATE INDEX idx_registry_type ON registry_entry(entry_type);
CREATE INDEX idx_registry_category ON registry_entry(category);
CREATE INDEX idx_registry_status ON registry_entry(status);
CREATE INDEX idx_registry_parent ON registry_entry(parent_id);
CREATE INDEX idx_registry_created ON registry_entry(created_at);
CREATE INDEX idx_registry_tenant ON registry_entry(tenant_id);
CREATE INDEX idx_registry_archived ON registry_entry(archived);

-- ==================== TABLE 5: SMART_CONTRACT ====================
CREATE TABLE IF NOT EXISTS smart_contract (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    contract_address VARCHAR(255) NOT NULL UNIQUE,
    contract_type VARCHAR(100) NOT NULL,
    contract_name VARCHAR(500) NOT NULL,
    description TEXT,
    version VARCHAR(50) NOT NULL,
    blockchain_network VARCHAR(100) NOT NULL,
    compiler_version VARCHAR(100),
    bytecode TEXT,
    source_code TEXT,
    abi JSONB,
    deployment_tx_hash VARCHAR(255),
    deployed_at TIMESTAMP,
    deployed_by VARCHAR(255),
    owner_id VARCHAR(255),
    status VARCHAR(50) NOT NULL,
    verified BOOLEAN NOT NULL DEFAULT FALSE,
    verified_at TIMESTAMP,
    verified_by VARCHAR(255),
    constructor_args JSONB,
    deployment_config JSONB,
    gas_used BIGINT,
    deployment_cost_eth DECIMAL(30, 18),
    is_upgradeable BOOLEAN NOT NULL DEFAULT FALSE,
    proxy_address VARCHAR(255),
    implementation_address VARCHAR(255),
    previous_version_id UUID,
    upgraded_to_id UUID,
    linked_assets JSONB,
    events_emitted JSONB,
    security_audit JSONB,
    audit_status VARCHAR(50),
    audited_at TIMESTAMP,
    audited_by VARCHAR(255),
    metadata JSONB,
    paused BOOLEAN NOT NULL DEFAULT FALSE,
    paused_at TIMESTAMP,
    paused_by VARCHAR(255),
    deactivated BOOLEAN NOT NULL DEFAULT FALSE,
    deactivated_at TIMESTAMP,
    deactivation_reason TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    tenant_id VARCHAR(255)
);

-- Indexes for smart_contract
CREATE UNIQUE INDEX idx_contract_address ON smart_contract(contract_address);
CREATE INDEX idx_contract_type ON smart_contract(contract_type);
CREATE INDEX idx_contract_status ON smart_contract(status);
CREATE INDEX idx_contract_owner ON smart_contract(owner_id);
CREATE INDEX idx_contract_deployed ON smart_contract(deployed_at);
CREATE INDEX idx_contract_version ON smart_contract(version);
CREATE INDEX idx_contract_chain ON smart_contract(blockchain_network);
CREATE INDEX idx_contract_tenant ON smart_contract(tenant_id);
CREATE INDEX idx_contract_paused ON smart_contract(paused);

-- ==================== TABLE 6: COMPLIANCE_CERTIFICATION ====================
CREATE TABLE IF NOT EXISTS compliance_certification (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    certificate_id VARCHAR(255) NOT NULL UNIQUE,
    compliance_level INTEGER NOT NULL CHECK (compliance_level >= 1 AND compliance_level <= 5),
    certification_type VARCHAR(100) NOT NULL,
    entity_id VARCHAR(255) NOT NULL,
    entity_type VARCHAR(100) NOT NULL,
    entity_name VARCHAR(500),
    status VARCHAR(50) NOT NULL,
    regulatory_framework VARCHAR(100) NOT NULL,
    issuer_id VARCHAR(255) NOT NULL,
    issuer_name VARCHAR(500),
    issued_at TIMESTAMP NOT NULL,
    expires_at TIMESTAMP,
    renewable BOOLEAN NOT NULL DEFAULT TRUE,
    auto_renew BOOLEAN NOT NULL DEFAULT FALSE,
    renewed_from_id UUID,
    renewed_to_id UUID,
    certification_criteria JSONB,
    assessment_results JSONB,
    risk_score DECIMAL(5, 2),
    risk_level VARCHAR(50),
    risk_factors JSONB,
    verification_documents JSONB,
    document_hash VARCHAR(255),
    verified BOOLEAN NOT NULL DEFAULT FALSE,
    verified_at TIMESTAMP,
    verified_by VARCHAR(255),
    verifier_signatures JSONB,
    blockchain_tx_hash VARCHAR(255),
    smart_contract_address VARCHAR(255),
    compliance_checks JSONB,
    kyc_verified BOOLEAN NOT NULL DEFAULT FALSE,
    aml_verified BOOLEAN NOT NULL DEFAULT FALSE,
    sanctions_checked BOOLEAN NOT NULL DEFAULT FALSE,
    pep_checked BOOLEAN NOT NULL DEFAULT FALSE,
    last_check_date TIMESTAMP,
    next_check_date TIMESTAMP,
    audit_trail JSONB,
    metadata JSONB,
    revoked BOOLEAN NOT NULL DEFAULT FALSE,
    revoked_at TIMESTAMP,
    revoked_by VARCHAR(255),
    revocation_reason TEXT,
    suspended BOOLEAN NOT NULL DEFAULT FALSE,
    suspended_at TIMESTAMP,
    suspension_reason TEXT,
    notes TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(255),
    updated_by VARCHAR(255),
    tenant_id VARCHAR(255)
);

-- Indexes for compliance_certification
CREATE UNIQUE INDEX idx_compliance_cert_id ON compliance_certification(certificate_id);
CREATE INDEX idx_compliance_level ON compliance_certification(compliance_level);
CREATE INDEX idx_compliance_type ON compliance_certification(certification_type);
CREATE INDEX idx_compliance_entity ON compliance_certification(entity_id);
CREATE INDEX idx_compliance_status ON compliance_certification(status);
CREATE INDEX idx_compliance_issued ON compliance_certification(issued_at);
CREATE INDEX idx_compliance_expiry ON compliance_certification(expires_at);
CREATE INDEX idx_compliance_framework ON compliance_certification(regulatory_framework);
CREATE INDEX idx_compliance_tenant ON compliance_certification(tenant_id);
CREATE INDEX idx_compliance_revoked ON compliance_certification(revoked);

-- ==================== TRIGGERS FOR UPDATED_AT ====================

-- Trigger function for updating updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger to tables with updated_at
CREATE TRIGGER update_asset_trace_updated_at BEFORE UPDATE ON asset_trace
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_registry_entry_updated_at BEFORE UPDATE ON registry_entry
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_smart_contract_updated_at BEFORE UPDATE ON smart_contract
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_compliance_certification_updated_at BEFORE UPDATE ON compliance_certification
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ==================== COMMENTS FOR DOCUMENTATION ====================

COMMENT ON TABLE asset_trace IS 'Asset lifecycle tracking with complete traceability';
COMMENT ON TABLE ownership_record IS 'Immutable ownership transfer history';
COMMENT ON TABLE audit_trail_entry IS 'Complete audit log for all operations';
COMMENT ON TABLE registry_entry IS 'Generic registry for blockchain artifacts';
COMMENT ON TABLE smart_contract IS 'Smart contract lifecycle management';
COMMENT ON TABLE compliance_certification IS 'Multi-level compliance certifications (Levels 1-5)';

-- ==================== GRANT PERMISSIONS ====================
-- Grant appropriate permissions to the application user
GRANT SELECT, INSERT, UPDATE ON asset_trace TO aurigraph;
GRANT SELECT, INSERT, UPDATE ON ownership_record TO aurigraph;
GRANT SELECT, INSERT ON audit_trail_entry TO aurigraph;
GRANT SELECT, INSERT, UPDATE ON registry_entry TO aurigraph;
GRANT SELECT, INSERT, UPDATE ON smart_contract TO aurigraph;
GRANT SELECT, INSERT, UPDATE ON compliance_certification TO aurigraph;

-- ==================== END OF MIGRATION ====================
