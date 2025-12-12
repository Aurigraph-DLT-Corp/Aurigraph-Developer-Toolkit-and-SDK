-- V18: Create User Interests Table for tracking user engagement
-- Supports user interest capture for follow-up marketing and analytics
-- Author: Backend Development Agent (BDA)
-- Since: V12.0.0

-- User Interests Table
CREATE TABLE IF NOT EXISTS user_interests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

    -- Interest Details
    category VARCHAR(50) NOT NULL,
    use_case VARCHAR(100) NOT NULL,
    action_type VARCHAR(30) NOT NULL DEFAULT 'VIEW',
    source VARCHAR(100),

    -- Session/Tracking Info
    session_id VARCHAR(100),
    ip_hash VARCHAR(64),
    user_agent VARCHAR(255),
    metadata TEXT,

    -- Lead Management
    priority VARCHAR(20) NOT NULL DEFAULT 'LOW',
    follow_up_completed BOOLEAN NOT NULL DEFAULT FALSE,
    follow_up_notes TEXT,

    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Create indexes for common queries
CREATE INDEX IF NOT EXISTS idx_ui_user_id ON user_interests(user_id);
CREATE INDEX IF NOT EXISTS idx_ui_category ON user_interests(category);
CREATE INDEX IF NOT EXISTS idx_ui_use_case ON user_interests(use_case);
CREATE INDEX IF NOT EXISTS idx_ui_action_type ON user_interests(action_type);
CREATE INDEX IF NOT EXISTS idx_ui_priority ON user_interests(priority);
CREATE INDEX IF NOT EXISTS idx_ui_follow_up ON user_interests(follow_up_completed);
CREATE INDEX IF NOT EXISTS idx_ui_created_at ON user_interests(created_at DESC);

-- Composite index for user + category queries
CREATE INDEX IF NOT EXISTS idx_ui_user_category ON user_interests(user_id, category);

-- Comments
COMMENT ON TABLE user_interests IS 'Tracks user interactions with use cases for follow-up and analytics';
COMMENT ON COLUMN user_interests.category IS 'Interest category (TOKENIZATION, RWA, CARBON_CREDITS, etc.)';
COMMENT ON COLUMN user_interests.action_type IS 'Type of action (VIEW, CLICK, DEMO_START, DEMO_COMPLETE, INQUIRY, etc.)';
COMMENT ON COLUMN user_interests.priority IS 'Lead priority (LOW, NORMAL, HIGH, URGENT)';
COMMENT ON COLUMN user_interests.ip_hash IS 'SHA-256 hash of IP address for privacy';
