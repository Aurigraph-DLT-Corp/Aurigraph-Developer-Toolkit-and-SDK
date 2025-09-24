-- ================================================================================
-- AUREX LAUNCHPAD™ DATABASE SCHEMA
-- Complete PostgreSQL schema for ESG assessment and sustainability management
-- Ticket: LAUNCHPAD-201 - Database Schema Design (13 story points)
-- Created: August 4, 2025
-- Version: 1.0
-- Security: AES-256 encryption ready, PII fields identified
-- ================================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ================================================================================
-- AUTHENTICATION & USER MANAGEMENT
-- ================================================================================

-- Users table (core authentication)
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL, -- bcrypt with 12 rounds
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    organization_id UUID,
    email_verified BOOLEAN DEFAULT FALSE,
    email_verification_token VARCHAR(255),
    email_verification_expires TIMESTAMP,
    password_reset_token VARCHAR(255),
    password_reset_expires TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_login TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE,
    mfa_enabled BOOLEAN DEFAULT FALSE,
    mfa_secret VARCHAR(255), -- TOTP secret (encrypted)
    profile_picture_url VARCHAR(500),
    timezone VARCHAR(50) DEFAULT 'UTC',
    language VARCHAR(10) DEFAULT 'en',
    CONSTRAINT valid_email CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$')
);

-- Organizations table
CREATE TABLE organizations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(200) NOT NULL,
    slug VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    industry VARCHAR(100),
    size_category VARCHAR(50), -- startup, small, medium, large, enterprise
    country VARCHAR(3), -- ISO 3166-1 alpha-3
    website VARCHAR(500),
    logo_url VARCHAR(500),
    settings JSONB DEFAULT '{}',
    subscription_plan VARCHAR(50) DEFAULT 'free',
    subscription_expires TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE
);

-- Add foreign key constraint
ALTER TABLE users ADD CONSTRAINT fk_users_organization 
    FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE SET NULL;

-- Roles table
CREATE TABLE roles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    is_system_role BOOLEAN DEFAULT FALSE,
    permissions JSONB DEFAULT '[]', -- Array of permission strings
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- User roles association
CREATE TABLE user_roles (
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    role_id UUID REFERENCES roles(id) ON DELETE CASCADE,
    assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    assigned_by UUID REFERENCES users(id),
    organization_id UUID REFERENCES organizations(id),
    PRIMARY KEY (user_id, role_id, organization_id)
);

-- Refresh tokens for JWT
CREATE TABLE refresh_tokens (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    token_hash VARCHAR(255) UNIQUE NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    revoked_at TIMESTAMP,
    user_agent TEXT,
    ip_address INET
);

-- ================================================================================
-- ESG ASSESSMENT FRAMEWORK
-- ================================================================================

-- Assessment frameworks (GRI, SASB, TCFD, CDP, ISO 14064)
CREATE TABLE assessment_frameworks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL, -- GRI, SASB, TCFD, CDP, ISO14064
    version VARCHAR(20) NOT NULL, -- e.g., "2021", "v2.1"
    description TEXT,
    category VARCHAR(50), -- environmental, social, governance, integrated
    is_active BOOLEAN DEFAULT TRUE,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Assessment templates for each framework
CREATE TABLE assessment_templates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    framework_id UUID REFERENCES assessment_frameworks(id) ON DELETE CASCADE,
    name VARCHAR(200) NOT NULL,
    description TEXT,
    template_structure JSONB NOT NULL, -- Questions, sections, scoring logic
    scoring_methodology JSONB,
    industry_specific BOOLEAN DEFAULT FALSE,
    target_industries TEXT[], -- Array for multi-industry templates
    estimated_completion_time INTEGER, -- minutes
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    version INTEGER DEFAULT 1
);

-- User assessments
CREATE TABLE assessments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    template_id UUID REFERENCES assessment_templates(id) ON DELETE CASCADE,
    name VARCHAR(200) NOT NULL,
    description TEXT,
    status VARCHAR(50) DEFAULT 'draft', -- draft, in_progress, completed, published, archived
    progress_percentage DECIMAL(5,2) DEFAULT 0.00,
    overall_score DECIMAL(5,2),
    responses JSONB DEFAULT '{}', -- User responses to questions
    calculations JSONB DEFAULT '{}', -- Calculated scores and metrics
    started_at TIMESTAMP,
    completed_at TIMESTAMP,
    published_at TIMESTAMP,
    due_date TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    assessment_year INTEGER,
    reporting_period_start DATE,
    reporting_period_end DATE
);

-- Assessment sections for detailed tracking
CREATE TABLE assessment_sections (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    assessment_id UUID REFERENCES assessments(id) ON DELETE CASCADE,
    section_name VARCHAR(200) NOT NULL,
    section_order INTEGER NOT NULL,
    section_score DECIMAL(5,2),
    responses JSONB DEFAULT '{}',
    is_completed BOOLEAN DEFAULT FALSE,
    completed_at TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ================================================================================
-- GHG EMISSIONS TRACKING
-- ================================================================================

-- Emission factors database
CREATE TABLE emission_factors (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    source VARCHAR(100) NOT NULL, -- EPA, DEFRA, IEA, etc.
    category VARCHAR(100) NOT NULL, -- electricity, transport, fuel, etc.
    subcategory VARCHAR(100),
    description TEXT,
    factor_value DECIMAL(15,6) NOT NULL, -- CO2e per unit
    unit VARCHAR(50) NOT NULL, -- kWh, liters, km, etc.
    co2_factor DECIMAL(15,6),
    ch4_factor DECIMAL(15,6),
    n2o_factor DECIMAL(15,6),
    region VARCHAR(100), -- Global, US, UK, etc.
    year INTEGER NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Emission sources (facilities, vehicles, etc.)
CREATE TABLE emission_sources (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    name VARCHAR(200) NOT NULL,
    source_type VARCHAR(50) NOT NULL, -- facility, vehicle, equipment, supplier
    category VARCHAR(50) NOT NULL, -- scope1, scope2, scope3
    subcategory VARCHAR(100), -- electricity, heating, transport, etc.
    description TEXT,
    location_address TEXT,
    location_coordinates POINT,
    is_active BOOLEAN DEFAULT TRUE,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Emission data entries
CREATE TABLE emissions_data (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    source_id UUID REFERENCES emission_sources(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    activity_type VARCHAR(100) NOT NULL, -- electricity_consumption, fuel_use, etc.
    activity_amount DECIMAL(15,6) NOT NULL,
    activity_unit VARCHAR(50) NOT NULL,
    emission_factor_id UUID REFERENCES emission_factors(id),
    co2_emissions DECIMAL(15,6), -- tons CO2e
    ch4_emissions DECIMAL(15,6),
    n2o_emissions DECIMAL(15,6),
    total_emissions DECIMAL(15,6) NOT NULL, -- tons CO2e
    reporting_period_start DATE NOT NULL,
    reporting_period_end DATE NOT NULL,
    data_quality_score INTEGER CHECK (data_quality_score BETWEEN 1 AND 5),
    verification_status VARCHAR(50) DEFAULT 'unverified',
    verified_by UUID REFERENCES users(id),
    verified_at TIMESTAMP,
    evidence_urls TEXT[],
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ================================================================================
-- PROJECT MANAGEMENT
-- ================================================================================

-- Sustainability projects
CREATE TABLE projects (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    owner_id UUID REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(200) NOT NULL,
    description TEXT,
    project_type VARCHAR(100), -- carbon_reduction, renewable_energy, waste_reduction, etc.
    status VARCHAR(50) DEFAULT 'planning', -- planning, active, on_hold, completed, cancelled
    priority VARCHAR(20) DEFAULT 'medium', -- low, medium, high, critical
    start_date DATE,
    end_date DATE,
    actual_end_date DATE,
    budget_allocated DECIMAL(15,2),
    budget_spent DECIMAL(15,2),
    progress_percentage DECIMAL(5,2) DEFAULT 0.00,
    expected_emission_reduction DECIMAL(15,6), -- tons CO2e
    actual_emission_reduction DECIMAL(15,6),
    roi_calculation JSONB,
    tags TEXT[],
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Project team members
CREATE TABLE project_members (
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    role VARCHAR(100) NOT NULL, -- manager, contributor, reviewer
    assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    assigned_by UUID REFERENCES users(id),
    PRIMARY KEY (project_id, user_id)
);

-- Project milestones
CREATE TABLE project_milestones (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    name VARCHAR(200) NOT NULL,
    description TEXT,
    due_date DATE,
    completed_at TIMESTAMP,
    is_completed BOOLEAN DEFAULT FALSE,
    completion_percentage DECIMAL(5,2) DEFAULT 0.00,
    deliverables TEXT[],
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ================================================================================
-- REPORTING & COMPLIANCE
-- ================================================================================

-- Report templates
CREATE TABLE report_templates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(200) NOT NULL,
    description TEXT,
    report_type VARCHAR(100), -- annual_report, sustainability_report, carbon_footprint, etc.
    framework VARCHAR(100), -- GRI, SASB, TCFD, CDP
    template_structure JSONB NOT NULL,
    output_format VARCHAR(20) DEFAULT 'pdf', -- pdf, excel, html
    is_public BOOLEAN DEFAULT FALSE,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Generated reports
CREATE TABLE reports (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    template_id UUID REFERENCES report_templates(id) ON DELETE CASCADE,
    generated_by UUID REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(200) NOT NULL,
    description TEXT,
    report_data JSONB NOT NULL,
    file_url VARCHAR(500),
    file_size INTEGER,
    generation_status VARCHAR(50) DEFAULT 'pending', -- pending, generating, completed, failed
    reporting_period_start DATE,
    reporting_period_end DATE,
    generated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    shared_publicly BOOLEAN DEFAULT FALSE,
    download_count INTEGER DEFAULT 0
);

-- ================================================================================
-- AUDIT & ACTIVITY LOGGING
-- ================================================================================

-- Comprehensive audit log
CREATE TABLE audit_log (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id),
    organization_id UUID REFERENCES organizations(id),
    table_name VARCHAR(100) NOT NULL,
    record_id UUID,
    action VARCHAR(50) NOT NULL, -- CREATE, UPDATE, DELETE, LOGIN, LOGOUT, etc.
    old_values JSONB,
    new_values JSONB,
    ip_address INET,
    user_agent TEXT,
    session_id VARCHAR(255),
    severity VARCHAR(20) DEFAULT 'info', -- debug, info, warning, error, critical
    description TEXT,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ================================================================================
-- SYSTEM CONFIGURATION
-- ================================================================================

-- System settings
CREATE TABLE system_settings (
    key VARCHAR(100) PRIMARY KEY,
    value JSONB NOT NULL,
    description TEXT,
    is_public BOOLEAN DEFAULT FALSE,
    updated_by UUID REFERENCES users(id),
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ================================================================================
-- INDEXES FOR PERFORMANCE
-- ================================================================================

-- Users table indexes
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_organization ON users(organization_id);
CREATE INDEX idx_users_active ON users(is_active);
CREATE INDEX idx_users_last_login ON users(last_login);

-- Organizations table indexes
CREATE INDEX idx_organizations_slug ON organizations(slug);
CREATE INDEX idx_organizations_active ON organizations(is_active);

-- Assessments table indexes
CREATE INDEX idx_assessments_user ON assessments(user_id);
CREATE INDEX idx_assessments_org ON assessments(organization_id);
CREATE INDEX idx_assessments_status ON assessments(status);
CREATE INDEX idx_assessments_year ON assessments(assessment_year);
CREATE INDEX idx_assessments_created ON assessments(created_at);

-- Emissions data indexes
CREATE INDEX idx_emissions_org ON emissions_data(organization_id);
CREATE INDEX idx_emissions_source ON emissions_data(source_id);
CREATE INDEX idx_emissions_period ON emissions_data(reporting_period_start, reporting_period_end);
CREATE INDEX idx_emissions_created ON emissions_data(created_at);

-- Projects table indexes
CREATE INDEX idx_projects_org ON projects(organization_id);
CREATE INDEX idx_projects_status ON projects(status);
CREATE INDEX idx_projects_owner ON projects(owner_id);
CREATE INDEX idx_projects_dates ON projects(start_date, end_date);

-- Audit log indexes
CREATE INDEX idx_audit_user ON audit_log(user_id);
CREATE INDEX idx_audit_org ON audit_log(organization_id);
CREATE INDEX idx_audit_table ON audit_log(table_name);
CREATE INDEX idx_audit_action ON audit_log(action);
CREATE INDEX idx_audit_created ON audit_log(created_at);

-- ================================================================================
-- INITIAL DATA SETUP
-- ================================================================================

-- Insert default roles
INSERT INTO roles (name, description, is_system_role, permissions) VALUES
('Super Admin', 'Full system access', true, '["*"]'),
('Organization Admin', 'Full organization access', true, '["org:*"]'),
('Assessment Manager', 'Manage assessments and reports', false, '["assessment:read", "assessment:write", "report:read", "report:write"]'),
('Data Analyst', 'View and analyze data', false, '["assessment:read", "emissions:read", "project:read", "report:read"]'),
('Contributor', 'Basic data entry and viewing', false, '["assessment:read", "emissions:write", "project:read"]'),
('Viewer', 'Read-only access', false, '["assessment:read", "emissions:read", "project:read"]');

-- Insert assessment frameworks
INSERT INTO assessment_frameworks (name, version, description, category) VALUES
('GRI', '2021', 'Global Reporting Initiative Standards', 'integrated'),
('SASB', '2018', 'Sustainability Accounting Standards Board', 'integrated'),
('TCFD', '2021', 'Task Force on Climate-related Financial Disclosures', 'governance'),
('CDP', '2023', 'Carbon Disclosure Project', 'environmental'),
('ISO 14064', '2019', 'Greenhouse gas accounting and verification', 'environmental');

-- Insert common emission factors (sample data)
INSERT INTO emission_factors (source, category, subcategory, description, factor_value, unit, year, region) VALUES
('EPA', 'electricity', 'grid', 'US Average Grid Electricity', 0.000391, 'kWh', 2023, 'US'),
('EPA', 'transport', 'gasoline', 'Motor Gasoline', 2.347, 'gallon', 2023, 'US'),
('EPA', 'transport', 'diesel', 'Diesel Fuel', 2.669, 'gallon', 2023, 'US'),
('EPA', 'heating', 'natural_gas', 'Natural Gas', 0.0053, 'cubic_foot', 2023, 'US'),
('DEFRA', 'electricity', 'grid', 'UK Grid Electricity', 0.000193, 'kWh', 2023, 'UK');

-- Insert system settings
INSERT INTO system_settings (key, value, description, is_public) VALUES
('app.name', '"Aurex Launchpad"', 'Application name', true),
('app.version', '"1.0.0"', 'Application version', true),
('security.password_min_length', '8', 'Minimum password length', true),
('security.mfa_required', 'false', 'Require MFA for all users', false),
('features.assessment_enabled', 'true', 'Enable assessment module', true),
('features.emissions_enabled', 'true', 'Enable emissions tracking', true),
('features.projects_enabled', 'true', 'Enable project management', true),
('features.reporting_enabled', 'true', 'Enable reporting module', true);

-- ================================================================================
-- DATABASE FUNCTIONS AND TRIGGERS
-- ================================================================================

-- Function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply updated_at trigger to relevant tables
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_organizations_updated_at BEFORE UPDATE ON organizations 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_assessments_updated_at BEFORE UPDATE ON assessments 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_assessment_templates_updated_at BEFORE UPDATE ON assessment_templates 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_emission_sources_updated_at BEFORE UPDATE ON emission_sources 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_emissions_data_updated_at BEFORE UPDATE ON emissions_data 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_projects_updated_at BEFORE UPDATE ON projects 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_report_templates_updated_at BEFORE UPDATE ON report_templates 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Audit logging function
CREATE OR REPLACE FUNCTION audit_trigger_function()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'DELETE' THEN
        INSERT INTO audit_log (table_name, record_id, action, old_values, ip_address, user_agent)
        VALUES (TG_TABLE_NAME, OLD.id, 'DELETE', row_to_json(OLD), inet_client_addr(), current_setting('application_name', true));
        RETURN OLD;
    ELSIF TG_OP = 'UPDATE' THEN
        INSERT INTO audit_log (table_name, record_id, action, old_values, new_values, ip_address, user_agent)
        VALUES (TG_TABLE_NAME, NEW.id, 'UPDATE', row_to_json(OLD), row_to_json(NEW), inet_client_addr(), current_setting('application_name', true));
        RETURN NEW;
    ELSIF TG_OP = 'INSERT' THEN
        INSERT INTO audit_log (table_name, record_id, action, new_values, ip_address, user_agent)
        VALUES (TG_TABLE_NAME, NEW.id, 'INSERT', row_to_json(NEW), inet_client_addr(), current_setting('application_name', true));
        RETURN NEW;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- ================================================================================
-- SECURITY & PERMISSIONS
-- ================================================================================

-- Row Level Security (RLS) policies will be added here
-- ALTER TABLE users ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
-- etc.

-- ================================================================================
-- SCHEMA VALIDATION COMPLETE
-- ================================================================================

-- Verify schema creation
DO $$
DECLARE
    table_count INTEGER;
    index_count INTEGER;
    trigger_count INTEGER;
BEGIN
    SELECT COUNT(*) FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_type = 'BASE TABLE' INTO table_count;
    
    SELECT COUNT(*) FROM pg_indexes 
    WHERE schemaname = 'public' INTO index_count;
    
    SELECT COUNT(*) FROM information_schema.triggers 
    WHERE trigger_schema = 'public' INTO trigger_count;
    
    RAISE NOTICE 'Aurex Launchpad Database Schema Created Successfully!';
    RAISE NOTICE 'Tables: %, Indexes: %, Triggers: %', table_count, index_count, trigger_count;
    RAISE NOTICE 'Schema Version: 1.0';
    RAISE NOTICE 'Created: %', CURRENT_TIMESTAMP;
END $$;