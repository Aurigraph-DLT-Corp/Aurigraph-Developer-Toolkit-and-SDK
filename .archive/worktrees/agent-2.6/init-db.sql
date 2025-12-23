-- Create main schema
CREATE SCHEMA IF NOT EXISTS aurigraph;

-- Create blocks table
CREATE TABLE IF NOT EXISTS aurigraph.blocks (
    id BIGSERIAL PRIMARY KEY,
    height BIGINT UNIQUE NOT NULL,
    hash VARCHAR(66) UNIQUE NOT NULL,
    parent_hash VARCHAR(66),
    timestamp TIMESTAMP NOT NULL,
    miner_address VARCHAR(42),
    transactions_count INT,
    gas_used BIGINT,
    gas_limit BIGINT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create transactions table
CREATE TABLE IF NOT EXISTS aurigraph.transactions (
    id BIGSERIAL PRIMARY KEY,
    tx_hash VARCHAR(66) UNIQUE NOT NULL,
    block_height BIGINT REFERENCES aurigraph.blocks(height),
    from_address VARCHAR(42),
    to_address VARCHAR(42),
    value NUMERIC(38,0),
    gas_price BIGINT,
    gas_used BIGINT,
    status INT DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create validators table
CREATE TABLE IF NOT EXISTS aurigraph.validators (
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

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_blocks_height ON aurigraph.blocks(height);
CREATE INDEX IF NOT EXISTS idx_blocks_timestamp ON aurigraph.blocks(timestamp);
CREATE INDEX IF NOT EXISTS idx_transactions_block ON aurigraph.transactions(block_height);
CREATE INDEX IF NOT EXISTS idx_transactions_from ON aurigraph.transactions(from_address);
CREATE INDEX IF NOT EXISTS idx_transactions_to ON aurigraph.transactions(to_address);

-- Insert initial data
INSERT INTO aurigraph.validators (node_id, address, status, stake, commission) VALUES
    ('validator-1', '0x1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d', 'active', 5000000, 5),
    ('validator-2', '0x2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e', 'active', 4500000, 5),
    ('validator-3', '0x3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f', 'active', 4000000, 5),
    ('validator-4', '0x4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9g', 'active', 3500000, 5),
    ('validator-5', '0x5e6f7a8b9c0d1e2f3a4b5c6d7e8f9g0h', 'active', 3000000, 5),
    ('validator-6', '0x6f7a8b9c0d1e2f3a4b5c6d7e8f9g0h1i', 'active', 2500000, 5),
    ('validator-7', '0x7a8b9c0d1e2f3a4b5c6d7e8f9g0h1i2j', 'active', 2000000, 5)
ON CONFLICT (node_id) DO NOTHING;

