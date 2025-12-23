-- V31__create_vvb_audit_trail.sql
-- VVB Audit Trail Tables
-- Creates audit and timeline tables for comprehensive approval tracking

CREATE TABLE IF NOT EXISTS vvb_approvals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    version_id UUID NOT NULL,
    approver_id VARCHAR(255) NOT NULL,
    decision VARCHAR(50) NOT NULL,
    reason TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(version_id, approver_id),
    INDEX idx_vvb_approvals_version_id (version_id),
    INDEX idx_vvb_approvals_approver_id (approver_id),
    INDEX idx_vvb_approvals_decision (decision),
    INDEX idx_vvb_approvals_created_at (created_at)
);

CREATE TABLE IF NOT EXISTS vvb_timeline (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    version_id UUID NOT NULL,
    event_type VARCHAR(100) NOT NULL,
    event_timestamp TIMESTAMP NOT NULL,
    details TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_vvb_timeline_version_id (version_id),
    INDEX idx_vvb_timeline_event_type (event_type),
    INDEX idx_vvb_timeline_event_timestamp (event_timestamp)
);

CREATE TABLE IF NOT EXISTS vvb_approval_metrics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    approval_date DATE NOT NULL,
    total_submissions INTEGER DEFAULT 0,
    total_approvals INTEGER DEFAULT 0,
    total_rejections INTEGER DEFAULT 0,
    pending_count INTEGER DEFAULT 0,
    average_approval_time_minutes DECIMAL(10, 2) DEFAULT 0,
    approval_rate_percent DECIMAL(5, 2) DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(approval_date),
    INDEX idx_vvb_approval_metrics_date (approval_date)
);

-- Grant appropriate privileges
ALTER TABLE vvb_approvals OWNER TO postgres;
ALTER TABLE vvb_timeline OWNER TO postgres;
ALTER TABLE vvb_approval_metrics OWNER TO postgres;
