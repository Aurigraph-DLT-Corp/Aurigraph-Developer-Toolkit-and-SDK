-- V14: Add tokenization and data feed fields to demos table
-- Adds support for demo configuration with data feeds and tokenization modes

ALTER TABLE demos ADD COLUMN IF NOT EXISTS tokenization_mode VARCHAR(20) DEFAULT 'live-feed';
ALTER TABLE demos ADD COLUMN IF NOT EXISTS selected_data_feeds_json TEXT;
ALTER TABLE demos ADD COLUMN IF NOT EXISTS tokenization_config_json TEXT;

-- Add comment to document the fields
COMMENT ON COLUMN demos.tokenization_mode IS 'Tokenization mode: live-feed, trades, or hybrid';
COMMENT ON COLUMN demos.selected_data_feeds_json IS 'JSON array of selected data feed IDs (e.g., quantconnect, chainlink, pyth)';
COMMENT ON COLUMN demos.tokenization_config_json IS 'JSON object with tokenization config: autoStart, batchSize, merkleTreeEnabled';
