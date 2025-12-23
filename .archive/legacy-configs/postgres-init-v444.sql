CREATE SCHEMA IF NOT EXISTS aurigraph_v444;

CREATE TABLE IF NOT EXISTS aurigraph_v444.blocks (
    id BIGSERIAL PRIMARY KEY,
    height BIGINT UNIQUE NOT NULL,
    hash VARCHAR(66) UNIQUE NOT NULL,
    parent_hash VARCHAR(66),
    timestamp TIMESTAMP NOT NULL,
    validator_address VARCHAR(42),
    transactions_count INT,
    gas_used BIGINT,
    gas_limit BIGINT,
    rewards NUMERIC(38,0),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS aurigraph_v444.transactions (
    id BIGSERIAL PRIMARY KEY,
    tx_hash VARCHAR(66) UNIQUE NOT NULL,
    block_height BIGINT REFERENCES aurigraph_v444.blocks(height),
    from_address VARCHAR(42),
    to_address VARCHAR(42),
    value NUMERIC(38,0),
    gas_price BIGINT,
    gas_used BIGINT,
    status INT DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS aurigraph_v444.validators (
    id BIGSERIAL PRIMARY KEY,
    node_id VARCHAR(50) UNIQUE NOT NULL,
    address VARCHAR(42) UNIQUE NOT NULL,
    status VARCHAR(20) DEFAULT 'active',
    stake NUMERIC(38,0),
    commission NUMERIC(5,2),
    uptime_percentage NUMERIC(5,2),
    last_block_proposed BIGINT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_blocks_height ON aurigraph_v444.blocks(height);
CREATE INDEX IF NOT EXISTS idx_blocks_timestamp ON aurigraph_v444.blocks(timestamp);
CREATE INDEX IF NOT EXISTS idx_transactions_block ON aurigraph_v444.transactions(block_height);

INSERT INTO aurigraph_v444.validators (node_id, address, status, stake, commission) VALUES
    ('validator-1', '0x1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d', 'active', 10000000, 5),
    ('validator-2', '0x2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e', 'active', 9500000, 5),
    ('validator-3', '0x3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f', 'active', 9000000, 5)
ON CONFLICT DO NOTHING;
