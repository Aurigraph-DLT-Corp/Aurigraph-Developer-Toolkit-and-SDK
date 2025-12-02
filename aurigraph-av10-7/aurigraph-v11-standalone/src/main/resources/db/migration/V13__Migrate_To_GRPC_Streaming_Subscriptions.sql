-- V13: Create gRPC Streaming Subscriptions Tables
-- Sprint 17 - V12 Release: Replace WebSocket with gRPC/Protobuf/HTTP2
-- Author: Claude Code Agent
-- Date: 2025-12-01
-- Note: Creates tables fresh since websocket_subscriptions may not exist

-- ============================================================================
-- 1. CREATE STREAM SUBSCRIPTIONS TABLE (replaces websocket_subscriptions)
-- ============================================================================

CREATE TABLE IF NOT EXISTS stream_subscriptions (
    subscription_id VARCHAR(36) PRIMARY KEY DEFAULT gen_random_uuid()::text,
    user_id VARCHAR(100) NOT NULL,
    channel VARCHAR(100) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    priority INTEGER NOT NULL DEFAULT 0,
    rate_limit INTEGER NOT NULL DEFAULT 100,
    message_count BIGINT NOT NULL DEFAULT 0,
    last_message_at TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP,
    metadata TEXT,

    -- gRPC-specific columns
    protocol VARCHAR(20) NOT NULL DEFAULT 'GRPC',
    stream_type VARCHAR(50),
    client_id VARCHAR(100),
    session_token VARCHAR(500),
    buffer_size INTEGER NOT NULL DEFAULT 50,
    update_interval_ms INTEGER NOT NULL DEFAULT 1000,
    filters JSONB,
    last_event_id VARCHAR(100),
    bytes_transferred BIGINT NOT NULL DEFAULT 0,

    -- Constraints
    CONSTRAINT check_status CHECK (status IN ('ACTIVE', 'PAUSED', 'SUSPENDED', 'EXPIRED')),
    CONSTRAINT check_priority CHECK (priority >= 0 AND priority <= 10),
    CONSTRAINT check_rate_limit CHECK (rate_limit > 0 AND rate_limit <= 10000),
    CONSTRAINT check_protocol CHECK (protocol IN ('GRPC', 'GRPC_WEB', 'HTTP2', 'SSE', 'WEBSOCKET_LEGACY')),
    CONSTRAINT check_buffer_size CHECK (buffer_size > 0 AND buffer_size <= 1000),

    -- Unique constraint: One subscription per user-channel pair
    CONSTRAINT unique_user_channel UNIQUE (user_id, channel)
);

-- ============================================================================
-- 2. CREATE INDEXES FOR STREAM SUBSCRIPTIONS
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_stream_user_id ON stream_subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_stream_channel ON stream_subscriptions(channel);
CREATE INDEX IF NOT EXISTS idx_stream_status ON stream_subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_stream_expires_at ON stream_subscriptions(expires_at);
CREATE INDEX IF NOT EXISTS idx_stream_user_status ON stream_subscriptions(user_id, status);
CREATE INDEX IF NOT EXISTS idx_stream_protocol ON stream_subscriptions(protocol);
CREATE INDEX IF NOT EXISTS idx_stream_client_id ON stream_subscriptions(client_id);
CREATE INDEX IF NOT EXISTS idx_stream_type ON stream_subscriptions(stream_type);

-- Composite index for active gRPC streams
CREATE INDEX IF NOT EXISTS idx_stream_active_grpc
ON stream_subscriptions(user_id, protocol, status)
WHERE status = 'ACTIVE';

-- ============================================================================
-- 3. CREATE TRIGGER FOR UPDATED_AT
-- ============================================================================

CREATE OR REPLACE FUNCTION update_stream_subscriptions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_stream_subscriptions_updated_at ON stream_subscriptions;

CREATE TRIGGER trigger_stream_subscriptions_updated_at
    BEFORE UPDATE ON stream_subscriptions
    FOR EACH ROW
    EXECUTE FUNCTION update_stream_subscriptions_updated_at();

-- ============================================================================
-- 4. CREATE gRPC STREAM EVENTS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS grpc_stream_events (
    event_id VARCHAR(36) PRIMARY KEY DEFAULT gen_random_uuid()::text,
    subscription_id VARCHAR(36) NOT NULL REFERENCES stream_subscriptions(subscription_id) ON DELETE CASCADE,
    event_type VARCHAR(50) NOT NULL,
    event_data JSONB,
    sequence_number BIGINT NOT NULL DEFAULT 0,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    delivered_at TIMESTAMP,
    acknowledged_at TIMESTAMP,

    -- Status tracking
    delivery_status VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    retry_count INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT check_delivery_status CHECK (delivery_status IN ('PENDING', 'DELIVERED', 'ACKNOWLEDGED', 'FAILED', 'EXPIRED'))
);

-- Indexes for event queries
CREATE INDEX IF NOT EXISTS idx_grpc_events_subscription ON grpc_stream_events(subscription_id);
CREATE INDEX IF NOT EXISTS idx_grpc_events_status ON grpc_stream_events(delivery_status);
CREATE INDEX IF NOT EXISTS idx_grpc_events_created ON grpc_stream_events(created_at);
CREATE INDEX IF NOT EXISTS idx_grpc_events_pending ON grpc_stream_events(subscription_id, delivery_status)
WHERE delivery_status = 'PENDING';

-- ============================================================================
-- 5. CREATE gRPC STREAM METRICS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS grpc_stream_metrics (
    metric_id VARCHAR(36) PRIMARY KEY DEFAULT gen_random_uuid()::text,
    subscription_id VARCHAR(36) NOT NULL REFERENCES stream_subscriptions(subscription_id) ON DELETE CASCADE,

    -- Performance metrics
    messages_sent BIGINT NOT NULL DEFAULT 0,
    messages_received BIGINT NOT NULL DEFAULT 0,
    bytes_sent BIGINT NOT NULL DEFAULT 0,
    bytes_received BIGINT NOT NULL DEFAULT 0,

    -- Latency metrics (in milliseconds)
    avg_latency_ms DOUBLE PRECISION NOT NULL DEFAULT 0,
    p50_latency_ms DOUBLE PRECISION NOT NULL DEFAULT 0,
    p95_latency_ms DOUBLE PRECISION NOT NULL DEFAULT 0,
    p99_latency_ms DOUBLE PRECISION NOT NULL DEFAULT 0,

    -- Error tracking
    error_count INTEGER NOT NULL DEFAULT 0,
    last_error_message TEXT,
    last_error_at TIMESTAMP,

    -- Connection tracking
    connection_count INTEGER NOT NULL DEFAULT 0,
    reconnection_count INTEGER NOT NULL DEFAULT 0,
    last_connected_at TIMESTAMP,
    last_disconnected_at TIMESTAMP,

    -- Time tracking
    period_start TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    period_end TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for metrics queries
CREATE INDEX IF NOT EXISTS idx_grpc_metrics_subscription ON grpc_stream_metrics(subscription_id);
CREATE INDEX IF NOT EXISTS idx_grpc_metrics_period ON grpc_stream_metrics(period_start, period_end);

-- Trigger to auto-update updated_at
CREATE OR REPLACE FUNCTION update_grpc_stream_metrics_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_grpc_stream_metrics_updated_at ON grpc_stream_metrics;

CREATE TRIGGER trigger_grpc_stream_metrics_updated_at
    BEFORE UPDATE ON grpc_stream_metrics
    FOR EACH ROW
    EXECUTE FUNCTION update_grpc_stream_metrics_updated_at();

-- ============================================================================
-- 6. CREATE VIEW FOR ACTIVE gRPC STREAMS
-- ============================================================================

CREATE OR REPLACE VIEW active_grpc_streams AS
SELECT
    s.subscription_id,
    s.user_id,
    s.client_id,
    s.channel,
    s.stream_type,
    s.protocol,
    s.status,
    s.priority,
    s.rate_limit,
    s.buffer_size,
    s.update_interval_ms,
    s.message_count,
    s.bytes_transferred,
    s.last_message_at,
    s.created_at,
    m.messages_sent,
    m.avg_latency_ms,
    m.error_count,
    m.last_connected_at
FROM stream_subscriptions s
LEFT JOIN grpc_stream_metrics m ON s.subscription_id = m.subscription_id
WHERE s.status = 'ACTIVE' AND s.protocol IN ('GRPC', 'GRPC_WEB', 'HTTP2');

-- ============================================================================
-- 7. INSERT DEFAULT gRPC SYSTEM SUBSCRIPTIONS
-- ============================================================================

INSERT INTO stream_subscriptions (
    subscription_id, user_id, channel, status, priority, rate_limit,
    protocol, stream_type, buffer_size, update_interval_ms
)
VALUES
    (gen_random_uuid(), 'system', 'system', 'ACTIVE', 10, 1000, 'GRPC', 'GENERAL_STREAM', 100, 1000),
    (gen_random_uuid(), 'system', 'transactions', 'ACTIVE', 8, 1000, 'GRPC', 'TRANSACTION_STREAM', 100, 500),
    (gen_random_uuid(), 'system', 'consensus', 'ACTIVE', 9, 500, 'GRPC', 'CONSENSUS_STREAM', 50, 2000),
    (gen_random_uuid(), 'system', 'analytics', 'ACTIVE', 10, 1000, 'GRPC', 'ANALYTICS_STREAM', 100, 1000),
    (gen_random_uuid(), 'system', 'metrics', 'ACTIVE', 9, 1000, 'GRPC', 'METRICS_STREAM', 50, 1000),
    (gen_random_uuid(), 'system', 'network', 'ACTIVE', 8, 500, 'GRPC', 'NETWORK_STREAM', 50, 3000),
    (gen_random_uuid(), 'system', 'validators', 'ACTIVE', 8, 500, 'GRPC', 'VALIDATOR_STREAM', 50, 2000),
    (gen_random_uuid(), 'system', 'channels', 'ACTIVE', 7, 500, 'GRPC', 'CHANNEL_STREAM', 50, 2000)
ON CONFLICT (user_id, channel) DO UPDATE SET
    protocol = EXCLUDED.protocol,
    stream_type = EXCLUDED.stream_type,
    buffer_size = EXCLUDED.buffer_size,
    update_interval_ms = EXCLUDED.update_interval_ms;

-- ============================================================================
-- 8. ADD COMMENTS FOR DOCUMENTATION
-- ============================================================================

COMMENT ON TABLE stream_subscriptions IS 'Stores gRPC/HTTP2 stream subscriptions for real-time data delivery';
COMMENT ON COLUMN stream_subscriptions.protocol IS 'Connection protocol: GRPC, GRPC_WEB, HTTP2, SSE, WEBSOCKET_LEGACY';
COMMENT ON COLUMN stream_subscriptions.stream_type IS 'Type of stream: TRANSACTION_STREAM, CONSENSUS_STREAM, METRICS_STREAM, etc.';
COMMENT ON COLUMN stream_subscriptions.buffer_size IS 'Client-side buffer size for backpressure handling';
COMMENT ON COLUMN stream_subscriptions.update_interval_ms IS 'Minimum interval between stream updates in milliseconds';
COMMENT ON COLUMN stream_subscriptions.filters IS 'JSON filters for stream data (e.g., channel filters, node filters)';
COMMENT ON COLUMN stream_subscriptions.last_event_id IS 'Last event ID for resumable streams';

COMMENT ON TABLE grpc_stream_events IS 'Event delivery tracking for gRPC streams with at-least-once delivery guarantee';
COMMENT ON TABLE grpc_stream_metrics IS 'Performance metrics and monitoring data for gRPC streaming connections';
COMMENT ON VIEW active_grpc_streams IS 'Real-time view of active gRPC streaming subscriptions with performance metrics';

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================
-- Summary:
-- 1. Created stream_subscriptions table with gRPC-specific columns
-- 2. Created grpc_stream_events table for event delivery tracking
-- 3. Created grpc_stream_metrics table for performance monitoring
-- 4. Created active_grpc_streams view for monitoring
-- 5. Inserted default system subscriptions for all stream types
-- ============================================================================
