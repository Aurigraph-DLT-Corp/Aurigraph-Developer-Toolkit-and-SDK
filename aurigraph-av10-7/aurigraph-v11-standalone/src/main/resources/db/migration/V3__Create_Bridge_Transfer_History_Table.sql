CREATE TABLE bridge_transfer_history (
    id BIGSERIAL PRIMARY KEY,
    transfer_id VARCHAR(255) UNIQUE NOT NULL,
    source_chain VARCHAR(100) NOT NULL,
    target_chain VARCHAR(100) NOT NULL,
    source_address VARCHAR(255) NOT NULL,
    target_address VARCHAR(255) NOT NULL,
    amount NUMERIC(38, 18) NOT NULL,
    fee NUMERIC(38, 18),
    status VARCHAR(50) NOT NULL DEFAULT 'PENDING',
    source_tx_hash VARCHAR(255),
    target_tx_hash VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    metadata JSONB,
    CONSTRAINT check_status CHECK (status IN ('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED', 'CANCELLED'))
);

