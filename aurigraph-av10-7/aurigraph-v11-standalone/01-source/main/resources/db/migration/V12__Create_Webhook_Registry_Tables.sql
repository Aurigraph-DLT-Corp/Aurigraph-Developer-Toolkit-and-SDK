-- Story 8, Phase 2: Webhook Registry Schema for gRPC Services
-- ============================================================================
-- Purpose: Database-backed webhook registry supporting:
--   - High-performance webhook management
--   - Real-time event delivery tracking
--   - Delivery history and retry logic
--   - 100% data integrity (no lost webhooks)
--
-- Migration Strategy:
--   1. Create webhook_registry table (core webhook definitions)
--   2. Create webhook_delivery_records table (delivery history)
--   3. Add indexes for performance optimization
--   4. Add foreign keys for referential integrity
-- ============================================================================

-- ============================================================================
-- Table: webhook_registry
-- Purpose: Store webhook definitions and current state
-- Performance: Indexed by owner_id, status, and created_at for fast queries
-- ============================================================================
CREATE TABLE IF NOT EXISTS webhook_registry (
    -- Primary Key and Identifiers
    webhook_id UUID PRIMARY KEY,
    owner_id UUID NOT NULL,

    -- Webhook Configuration
    endpoint_url VARCHAR(2048) NOT NULL,
    http_method VARCHAR(10) NOT NULL DEFAULT 'POST',
    status VARCHAR(50) NOT NULL DEFAULT 'ACTIVE',
    description TEXT,

    -- Event Configuration
    events_subscribed JSONB NOT NULL DEFAULT '[]',
    custom_events_enabled BOOLEAN DEFAULT false,

    -- Security
    webhook_secret UUID NOT NULL,
    require_signature BOOLEAN DEFAULT true,

    -- Retry Policy
    retry_policy VARCHAR(50) DEFAULT 'exponential',
    max_retries INT DEFAULT 5,
    timeout_seconds INT DEFAULT 30,

    -- Headers and Metadata
    custom_headers JSONB DEFAULT '{}',
    metadata JSONB DEFAULT '{}',

    -- Statistics
    total_deliveries BIGINT DEFAULT 0,
    successful_deliveries BIGINT DEFAULT 0,
    failed_deliveries BIGINT DEFAULT 0,
    success_rate DECIMAL(5, 2) DEFAULT 0.00,

    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    last_triggered_at TIMESTAMP WITH TIME ZONE,
    deleted_at TIMESTAMP WITH TIME ZONE,

    -- Constraints
    CONSTRAINT webhook_endpoint_url_not_empty CHECK (length(endpoint_url) > 0),
    CONSTRAINT webhook_max_retries_valid CHECK (max_retries >= 0 AND max_retries <= 100),
    CONSTRAINT webhook_timeout_valid CHECK (timeout_seconds > 0 AND timeout_seconds <= 300),
    CONSTRAINT webhook_success_rate_valid CHECK (success_rate >= 0 AND success_rate <= 100)
);

-- Create indexes for webhook_registry
CREATE INDEX idx_webhook_owner_id ON webhook_registry(owner_id);
CREATE INDEX idx_webhook_status ON webhook_registry(status);
CREATE INDEX idx_webhook_created_at ON webhook_registry(created_at DESC);
CREATE INDEX idx_webhook_last_triggered_at ON webhook_registry(last_triggered_at DESC);
CREATE INDEX idx_webhook_owner_status ON webhook_registry(owner_id, status);

-- ============================================================================
-- Table: webhook_delivery_records
-- Purpose: Track delivery attempts for audit, retry, and monitoring
-- Performance: Indexed by webhook_id and status for fast retrieval
-- Note: This table can grow large - consider partitioning by date in production
-- ============================================================================
CREATE TABLE IF NOT EXISTS webhook_delivery_records (
    -- Primary Key and Identifiers
    delivery_id UUID PRIMARY KEY,
    webhook_id UUID NOT NULL,
    event_id VARCHAR(255) NOT NULL,

    -- Request Information
    endpoint_url VARCHAR(2048) NOT NULL,
    http_method VARCHAR(10) NOT NULL,
    request_headers JSONB DEFAULT '{}',
    request_body BYTEA,
    request_body_size INT,

    -- Response Information
    http_status_code INT,
    response_body BYTEA,
    response_body_size INT,
    response_time_ms INT,

    -- Delivery Status
    status VARCHAR(50) NOT NULL DEFAULT 'PENDING',
    error_message TEXT,
    error_code VARCHAR(50),

    -- Retry Information
    attempt_number INT NOT NULL DEFAULT 1,
    max_attempts INT DEFAULT 5,
    next_retry_at TIMESTAMP WITH TIME ZONE,

    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    delivered_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,

    -- Constraints
    CONSTRAINT delivery_webhook_id_not_null CHECK (webhook_id IS NOT NULL),
    CONSTRAINT delivery_status_valid CHECK (status IN ('PENDING', 'RETRYING', 'DELIVERED', 'FAILED', 'EXPIRED')),
    CONSTRAINT delivery_attempt_valid CHECK (attempt_number >= 1),
    CONSTRAINT delivery_response_time_valid CHECK (response_time_ms IS NULL OR response_time_ms >= 0),

    -- Foreign Key
    CONSTRAINT fk_delivery_webhook FOREIGN KEY (webhook_id) REFERENCES webhook_registry(webhook_id)
        ON DELETE CASCADE
);

-- Create indexes for webhook_delivery_records
CREATE INDEX idx_delivery_webhook_id ON webhook_delivery_records(webhook_id);
CREATE INDEX idx_delivery_status ON webhook_delivery_records(status);
CREATE INDEX idx_delivery_created_at ON webhook_delivery_records(created_at DESC);
CREATE INDEX idx_delivery_event_id ON webhook_delivery_records(event_id);
CREATE INDEX idx_delivery_webhook_status ON webhook_delivery_records(webhook_id, status);
CREATE INDEX idx_delivery_next_retry_at ON webhook_delivery_records(next_retry_at) WHERE next_retry_at IS NOT NULL;

-- ============================================================================
-- Table: approval_requests (for VVB Approval System)
-- Purpose: Store approval requests for gRPC service
-- ============================================================================
CREATE TABLE IF NOT EXISTS approval_requests (
    -- Primary Key
    approval_id UUID PRIMARY KEY,

    -- Approval Details
    approval_type VARCHAR(50) NOT NULL,
    priority VARCHAR(20) NOT NULL DEFAULT 'NORMAL',
    status VARCHAR(50) NOT NULL DEFAULT 'PENDING',

    -- Content
    requester_id UUID NOT NULL,
    content BYTEA NOT NULL,
    content_hash VARCHAR(64) NOT NULL,

    -- Consensus Requirements
    required_approvals INT NOT NULL DEFAULT 3,
    total_validators INT NOT NULL,

    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP WITH TIME ZONE,

    -- Metadata
    metadata JSONB DEFAULT '{}',

    -- Constraints
    CONSTRAINT approval_required_approvals_valid CHECK (required_approvals > 0),
    CONSTRAINT approval_total_validators_valid CHECK (total_validators > 0)
);

-- Create indexes for approval_requests
CREATE INDEX idx_approval_status ON approval_requests(status);
CREATE INDEX idx_approval_requester_id ON approval_requests(requester_id);
CREATE INDEX idx_approval_created_at ON approval_requests(created_at DESC);
CREATE INDEX idx_approval_expires_at ON approval_requests(expires_at) WHERE status = 'PENDING';

-- ============================================================================
-- Table: approval_responses
-- Purpose: Store validator responses for approvals
-- ============================================================================
CREATE TABLE IF NOT EXISTS approval_responses (
    -- Primary Key
    response_id UUID PRIMARY KEY,
    approval_id UUID NOT NULL,

    -- Validator Info
    validator_id UUID NOT NULL,
    decision VARCHAR(20) NOT NULL,

    -- Response Details
    reason TEXT,
    signature BYTEA,
    signature_algorithm VARCHAR(50) DEFAULT 'CRYSTALS-Dilithium',

    -- Timestamps
    responded_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    response_time_ms BIGINT,

    -- Metadata
    data JSONB DEFAULT '{}',

    -- Constraints
    CONSTRAINT approval_response_decision_valid CHECK (decision IN ('APPROVE', 'REJECT', 'ABSTAIN')),

    -- Foreign Key
    CONSTRAINT fk_response_approval FOREIGN KEY (approval_id) REFERENCES approval_requests(approval_id)
        ON DELETE CASCADE
);

-- Create indexes for approval_responses
CREATE INDEX idx_response_approval_id ON approval_responses(approval_id);
CREATE INDEX idx_response_validator_id ON approval_responses(validator_id);
CREATE INDEX idx_response_decision ON approval_responses(decision);
CREATE INDEX idx_response_responded_at ON approval_responses(responded_at DESC);

-- ============================================================================
-- Table: webhook_event_subscriptions
-- Purpose: Track which webhooks are subscribed to which events
-- Optimizes event broadcasting (denormalization of events_subscribed JSONB)
-- ============================================================================
CREATE TABLE IF NOT EXISTS webhook_event_subscriptions (
    webhook_id UUID NOT NULL,
    event_type VARCHAR(100) NOT NULL,
    subscribed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

    PRIMARY KEY (webhook_id, event_type),
    FOREIGN KEY (webhook_id) REFERENCES webhook_registry(webhook_id) ON DELETE CASCADE
);

-- Create index for fast event-to-webhook lookups
CREATE INDEX idx_event_subscriptions_event ON webhook_event_subscriptions(event_type);

-- ============================================================================
-- Function: update_webhook_updated_at()
-- Purpose: Automatically update 'updated_at' timestamp on row modification
-- ============================================================================
CREATE OR REPLACE FUNCTION update_webhook_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for webhook_registry
CREATE TRIGGER webhook_registry_updated_at_trigger
BEFORE UPDATE ON webhook_registry
FOR EACH ROW
EXECUTE FUNCTION update_webhook_updated_at();

-- Create trigger for approval_requests
CREATE TRIGGER approval_requests_updated_at_trigger
BEFORE UPDATE ON approval_requests
FOR EACH ROW
EXECUTE FUNCTION update_webhook_updated_at();

-- ============================================================================
-- Function: calculate_webhook_success_rate()
-- Purpose: Recalculate success rate when deliveries change
-- ============================================================================
CREATE OR REPLACE FUNCTION calculate_webhook_success_rate(webhook_uuid UUID)
RETURNS DECIMAL AS $$
DECLARE
    total_deliveries BIGINT;
    successful_count BIGINT;
    success_percentage DECIMAL;
BEGIN
    SELECT COUNT(*) INTO total_deliveries
    FROM webhook_delivery_records
    WHERE webhook_id = webhook_uuid;

    IF total_deliveries = 0 THEN
        RETURN 0.00;
    END IF;

    SELECT COUNT(*) INTO successful_count
    FROM webhook_delivery_records
    WHERE webhook_id = webhook_uuid AND status = 'DELIVERED';

    success_percentage := (successful_count::DECIMAL / total_deliveries::DECIMAL) * 100;
    RETURN ROUND(success_percentage, 2);
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- View: pending_webhook_deliveries
-- Purpose: Quick query for pending deliveries that need processing
-- ============================================================================
CREATE OR REPLACE VIEW pending_webhook_deliveries AS
SELECT
    wr.webhook_id,
    wr.owner_id,
    wr.endpoint_url,
    wr.webhook_secret,
    wdr.delivery_id,
    wdr.event_id,
    wdr.request_body,
    wdr.attempt_number,
    wr.max_retries,
    wr.timeout_seconds,
    wr.custom_headers
FROM webhook_registry wr
JOIN webhook_delivery_records wdr ON wr.webhook_id = wdr.webhook_id
WHERE wdr.status IN ('PENDING', 'RETRYING')
    AND wr.status = 'ACTIVE'
ORDER BY wr.priority DESC, wdr.created_at ASC;

-- ============================================================================
-- View: webhook_statistics
-- Purpose: Summary statistics for webhooks
-- ============================================================================
CREATE OR REPLACE VIEW webhook_statistics AS
SELECT
    wr.webhook_id,
    wr.owner_id,
    wr.endpoint_url,
    wr.status,
    wr.total_deliveries,
    wr.successful_deliveries,
    wr.failed_deliveries,
    wr.success_rate,
    COUNT(CASE WHEN wdr.status = 'PENDING' THEN 1 END) as pending_deliveries,
    COUNT(CASE WHEN wdr.status = 'FAILED' THEN 1 END) as failed_pending_retry,
    AVG(CASE WHEN wdr.status = 'DELIVERED' THEN wdr.response_time_ms END) as avg_response_time_ms,
    wr.created_at,
    wr.last_triggered_at
FROM webhook_registry wr
LEFT JOIN webhook_delivery_records wdr ON wr.webhook_id = wdr.webhook_id
WHERE wr.deleted_at IS NULL
GROUP BY wr.webhook_id, wr.owner_id, wr.endpoint_url, wr.status;

-- ============================================================================
-- Comments for documentation
-- ============================================================================
COMMENT ON TABLE webhook_registry IS
    'Stores webhook definitions and current state. Supports event subscriptions, ' ||
    'retry policies, and delivery statistics for high-performance webhook management.';

COMMENT ON TABLE webhook_delivery_records IS
    'Audit log and retry queue for webhook deliveries. Tracks all delivery ' ||
    'attempts, responses, and retry scheduling for complete transparency.';

COMMENT ON TABLE approval_requests IS
    'VVB approval requests. Stores approval submissions with consensus requirements ' ||
    'and expiration tracking.';

COMMENT ON TABLE approval_responses IS
    'Validator responses to approval requests. Tracks decisions, signatures, and response times.';

COMMENT ON COLUMN webhook_registry.webhook_secret IS
    'UUID secret for HMAC signature generation/verification of webhook payloads. ' ||
    'Prevents unauthorized webhook submissions.';

COMMENT ON COLUMN webhook_registry.success_rate IS
    'Percentage of successful deliveries (0-100). Updated after each delivery attempt.';

COMMENT ON COLUMN webhook_delivery_records.status IS
    'Delivery status: PENDING (waiting), RETRYING (scheduled), DELIVERED (success), ' ||
    'FAILED (exhausted retries), EXPIRED (timeout exceeded).';

-- ============================================================================
-- Grants (adjust for your database user)
-- ============================================================================
GRANT SELECT, INSERT, UPDATE, DELETE ON webhook_registry TO "aurigraph_user";
GRANT SELECT, INSERT, UPDATE, DELETE ON webhook_delivery_records TO "aurigraph_user";
GRANT SELECT, INSERT, UPDATE, DELETE ON approval_requests TO "aurigraph_user";
GRANT SELECT, INSERT, UPDATE, DELETE ON approval_responses TO "aurigraph_user";
GRANT SELECT, INSERT, DELETE ON webhook_event_subscriptions TO "aurigraph_user";
GRANT SELECT ON pending_webhook_deliveries TO "aurigraph_user";
GRANT SELECT ON webhook_statistics TO "aurigraph_user";
GRANT EXECUTE ON FUNCTION update_webhook_updated_at() TO "aurigraph_user";
GRANT EXECUTE ON FUNCTION calculate_webhook_success_rate(UUID) TO "aurigraph_user";
