-- V19: Create Use Case Feedback Table for likes and comments
-- Supports community engagement features on use cases
-- Author: Backend Development Agent (BDA)
-- Since: V12.0.0

-- Use Case Feedback Table
CREATE TABLE IF NOT EXISTS use_case_feedback (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

    -- Use Case Reference
    use_case_id VARCHAR(100) NOT NULL,
    category VARCHAR(50) NOT NULL,

    -- Feedback Details
    feedback_type VARCHAR(20) NOT NULL,
    comment_text VARCHAR(2000),
    rating INTEGER CHECK (rating IS NULL OR (rating >= 1 AND rating <= 5)),

    -- Nested Comments (self-referential)
    parent_id UUID REFERENCES use_case_feedback(id) ON DELETE CASCADE,

    -- Moderation
    is_visible BOOLEAN NOT NULL DEFAULT TRUE,
    is_edited BOOLEAN NOT NULL DEFAULT FALSE,

    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Create indexes for common queries
CREATE INDEX IF NOT EXISTS idx_ucf_user_id ON use_case_feedback(user_id);
CREATE INDEX IF NOT EXISTS idx_ucf_use_case ON use_case_feedback(use_case_id);
CREATE INDEX IF NOT EXISTS idx_ucf_type ON use_case_feedback(feedback_type);
CREATE INDEX IF NOT EXISTS idx_ucf_created_at ON use_case_feedback(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ucf_parent ON use_case_feedback(parent_id);

-- Unique constraint: One like per user per use case
CREATE UNIQUE INDEX IF NOT EXISTS uk_ucf_user_usecase_like
    ON use_case_feedback(user_id, use_case_id, feedback_type)
    WHERE feedback_type = 'LIKE';

-- Comments
COMMENT ON TABLE use_case_feedback IS 'Stores user likes, comments, and ratings on use cases';
COMMENT ON COLUMN use_case_feedback.feedback_type IS 'Type of feedback (LIKE, COMMENT, RATING)';
COMMENT ON COLUMN use_case_feedback.parent_id IS 'Parent comment ID for nested replies';
COMMENT ON COLUMN use_case_feedback.is_visible IS 'Whether feedback is visible (for moderation)';
