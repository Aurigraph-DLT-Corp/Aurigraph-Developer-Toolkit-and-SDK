-- Create Enterprise Settings table for persistent configuration
-- Allows overriding application.properties via Admin UI
CREATE TABLE enterprise_settings (
    category VARCHAR(64) PRIMARY KEY,
    settings_json TEXT NOT NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Seed initial settings if needed, or leave to be populated by the application
-- Initially, we'll let EnterpriseSettingsResource.java handle the default population
