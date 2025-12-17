-- ==================================================================================
-- Aurigraph V12 Database Schema: Sample Data for Testing
-- ==================================================================================
-- Description: Insert sample data for development and testing
-- Version: V26 (Optional - for development only)
-- Created: 2025-12-16
-- Author: J4C Database Agent
-- ==================================================================================

-- IMPORTANT: This migration is optional and should only be used in DEV/TEST environments
-- Do NOT run in production!

-- ==================================================================================
-- SAMPLE VALIDATORS
-- ==================================================================================

INSERT INTO validators (address, public_key, stake_amount, status, uptime, blocks_produced, rewards_earned, metadata)
VALUES
    (
        '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb1',
        'dilithium5_public_key_validator_1_abcdef123456',
        1000000000000000000000, -- 1000 ETH
        'ACTIVE',
        99.95,
        15234,
        50000000000000000000, -- 50 ETH
        '{"commission_rate": 0.05, "region": "US-EAST", "contact": "validator1@aurigraph.io"}'::JSONB
    ),
    (
        '0x5aAeb6053F3E94C9b9A09f33669435E7Ef1BeAed',
        'dilithium5_public_key_validator_2_ghijkl789012',
        2000000000000000000000, -- 2000 ETH
        'ACTIVE',
        99.89,
        14892,
        75000000000000000000, -- 75 ETH
        '{"commission_rate": 0.03, "region": "EU-WEST", "contact": "validator2@aurigraph.io"}'::JSONB
    ),
    (
        '0xfB6916095ca1df60bB79Ce92cE3Ea74c37c5d359',
        'dilithium5_public_key_validator_3_mnopqr345678',
        1500000000000000000000, -- 1500 ETH
        'ACTIVE',
        99.92,
        13456,
        60000000000000000000, -- 60 ETH
        '{"commission_rate": 0.04, "region": "ASIA-PACIFIC", "contact": "validator3@aurigraph.io"}'::JSONB
    ),
    (
        '0xdbF03B407c01E7cD3CBea99509d93f8DDDC8C6FB',
        'dilithium5_public_key_validator_4_stuvwx901234',
        500000000000000000000, -- 500 ETH
        'INACTIVE',
        95.50,
        8234,
        25000000000000000000, -- 25 ETH
        '{"commission_rate": 0.06, "region": "US-WEST", "contact": "validator4@aurigraph.io"}'::JSONB
    ),
    (
        '0xD1220A0cf47c7B9Be7A2E6BA89F429762e7b9aDb',
        'dilithium5_public_key_validator_5_yzabcd567890',
        800000000000000000000, -- 800 ETH
        'JAILED',
        88.30,
        5123,
        15000000000000000000, -- 15 ETH
        '{"commission_rate": 0.08, "region": "EU-EAST", "contact": "validator5@aurigraph.io", "jail_reason": "High downtime"}'::JSONB
    );

-- ==================================================================================
-- SAMPLE BLOCKS
-- ==================================================================================

INSERT INTO blocks (block_number, hash, previous_hash, merkle_root, validator_id, timestamp, transaction_count, size, metadata)
VALUES
    (
        0,
        '0xgenesis0000000000000000000000000000000000000000000000000000001',
        '0x0000000000000000000000000000000000000000000000000000000000000000',
        '0x56e81f171bcc55a6ff8345e692c0f86e5b48e01b996cadc001622fb5e363b421',
        '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb1',
        '2025-01-01 00:00:00+00',
        0,
        512,
        '{"type": "genesis", "network": "aurigraph-mainnet"}'::JSONB
    ),
    (
        1,
        '0x1111111111111111111111111111111111111111111111111111111111111111',
        '0xgenesis0000000000000000000000000000000000000000000000000000001',
        '0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890',
        '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb1',
        '2025-01-01 00:00:10+00',
        125,
        65536,
        '{"consensus_round": 1, "signatures": ["0xsig1", "0xsig2", "0xsig3"]}'::JSONB
    ),
    (
        2,
        '0x2222222222222222222222222222222222222222222222222222222222222222',
        '0x1111111111111111111111111111111111111111111111111111111111111111',
        '0xfedcba0987654321fedcba0987654321fedcba0987654321fedcba0987654321',
        '0x5aAeb6053F3E94C9b9A09f33669435E7Ef1BeAed',
        '2025-01-01 00:00:20+00',
        230,
        98304,
        '{"consensus_round": 2, "signatures": ["0xsig4", "0xsig5", "0xsig6"]}'::JSONB
    ),
    (
        3,
        '0x3333333333333333333333333333333333333333333333333333333333333333',
        '0x2222222222222222222222222222222222222222222222222222222222222222',
        '0x1a2b3c4d5e6f7890a1b2c3d4e5f60789a1b2c3d4e5f60789a1b2c3d4e5f60789',
        '0xfB6916095ca1df60bB79Ce92cE3Ea74c37c5d359',
        '2025-01-01 00:00:30+00',
        189,
        81920,
        '{"consensus_round": 3, "signatures": ["0xsig7", "0xsig8", "0xsig9"]}'::JSONB
    );

-- ==================================================================================
-- SAMPLE TRANSACTIONS
-- ==================================================================================

INSERT INTO transactions (transaction_id, hash, from_address, to_address, amount, status, signature, block_hash, block_number, gas_used, gas_price, created_at, confirmed_at, metadata)
VALUES
    (
        '0xaaaa000000000000000000000000000000000000000000000000000000aa',
        '0xab11111111111111111111111111111111111111111111111111111111111111',
        '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb1',
        '0x5aAeb6053F3E94C9b9A09f33669435E7Ef1BeAed',
        1000000000000000000, -- 1 ETH
        'CONFIRMED',
        'dilithium5_signature_abcdef123456',
        '0x1111111111111111111111111111111111111111111111111111111111111111',
        1,
        21000,
        50000000000, -- 50 Gwei
        '2025-01-01 00:00:05+00',
        '2025-01-01 00:00:10+00',
        '{"type": "transfer", "memo": "Test payment"}'::JSONB
    ),
    (
        '0xbbbb000000000000000000000000000000000000000000000000000000bb',
        '0xcd22222222222222222222222222222222222222222222222222222222222222',
        '0x5aAeb6053F3E94C9b9A09f33669435E7Ef1BeAed',
        '0xfB6916095ca1df60bB79Ce92cE3Ea74c37c5d359',
        2500000000000000000, -- 2.5 ETH
        'CONFIRMED',
        'dilithium5_signature_ghijkl789012',
        '0x2222222222222222222222222222222222222222222222222222222222222222',
        2,
        35000,
        75000000000, -- 75 Gwei
        '2025-01-01 00:00:15+00',
        '2025-01-01 00:00:20+00',
        '{"type": "contract_call", "contract": "0xTokenContract", "method": "transfer"}'::JSONB
    ),
    (
        '0xcccc000000000000000000000000000000000000000000000000000000cc',
        '0xef33333333333333333333333333333333333333333333333333333333333333',
        '0xfB6916095ca1df60bB79Ce92cE3Ea74c37c5d359',
        '0xdbF03B407c01E7cD3CBea99509d93f8DDDC8C6FB',
        500000000000000000, -- 0.5 ETH
        'PENDING',
        'dilithium5_signature_mnopqr345678',
        NULL,
        NULL,
        NULL,
        60000000000, -- 60 Gwei
        '2025-01-01 00:00:35+00',
        NULL,
        '{"type": "transfer", "priority": "high"}'::JSONB
    ),
    (
        '0xdddd000000000000000000000000000000000000000000000000000000dd',
        '0x1244444444444444444444444444444444444444444444444444444444444444',
        '0xdbF03B407c01E7cD3CBea99509d93f8DDDC8C6FB',
        '0xD1220A0cf47c7B9Be7A2E6BA89F429762e7b9aDb',
        100000000000000000, -- 0.1 ETH
        'FAILED',
        'dilithium5_signature_stuvwx901234',
        '0x3333333333333333333333333333333333333333333333333333333333333333',
        3,
        18000,
        45000000000, -- 45 Gwei
        '2025-01-01 00:00:25+00',
        '2025-01-01 00:00:30+00',
        '{"type": "transfer", "error": "Insufficient balance"}'::JSONB
    );

-- ==================================================================================
-- SAMPLE CONSENSUS ROUNDS
-- ==================================================================================

INSERT INTO consensus_rounds (round_number, proposer_id, phase, votes_received, votes_required, voters, started_at, completed_at, result, block_hash, metadata)
VALUES
    (
        1,
        '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb1',
        'FINALIZED',
        3,
        3,
        '["0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb1", "0x5aAeb6053F3E94C9b9A09f33669435E7Ef1BeAed", "0xfB6916095ca1df60bB79Ce92cE3Ea74c37c5d359"]'::JSONB,
        '2025-01-01 00:00:05+00',
        '2025-01-01 00:00:10+00',
        'SUCCESS',
        '0x1111111111111111111111111111111111111111111111111111111111111111',
        '{"quorum_reached": true, "vote_signatures": ["0xvote1", "0xvote2", "0xvote3"]}'::JSONB
    ),
    (
        2,
        '0x5aAeb6053F3E94C9b9A09f33669435E7Ef1BeAed',
        'FINALIZED',
        3,
        3,
        '["0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb1", "0x5aAeb6053F3E94C9b9A09f33669435E7Ef1BeAed", "0xfB6916095ca1df60bB79Ce92cE3Ea74c37c5d359"]'::JSONB,
        '2025-01-01 00:00:15+00',
        '2025-01-01 00:00:20+00',
        'SUCCESS',
        '0x2222222222222222222222222222222222222222222222222222222222222222',
        '{"quorum_reached": true, "vote_signatures": ["0xvote4", "0xvote5", "0xvote6"]}'::JSONB
    ),
    (
        3,
        '0xfB6916095ca1df60bB79Ce92cE3Ea74c37c5d359',
        'VOTING',
        2,
        3,
        '["0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb1", "0x5aAeb6053F3E94C9b9A09f33669435E7Ef1BeAed"]'::JSONB,
        '2025-01-01 00:00:25+00',
        NULL,
        NULL,
        NULL,
        '{"quorum_reached": false, "awaiting_votes": 1}'::JSONB
    ),
    (
        4,
        '0xdbF03B407c01E7cD3CBea99509d93f8DDDC8C6FB',
        'FAILED',
        1,
        3,
        '["0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb1"]'::JSONB,
        '2025-01-01 00:00:35+00',
        '2025-01-01 00:00:45+00',
        'TIMEOUT',
        NULL,
        '{"reason": "Timeout - quorum not reached", "votes_missing": 2}'::JSONB
    );

-- ==================================================================================
-- SAMPLE QUANTUM KEYS
-- ==================================================================================

INSERT INTO quantum_keys (key_id, algorithm, public_key_hash, key_type, owner_address, created_at, expires_at, status, security_level, key_size, usage_count, last_used_at, metadata)
VALUES
    (
        '0xqk11111111111111111111111111111111111111111111111111111111111111',
        'CRYSTALS-Dilithium5',
        '0xpkh1111111111111111111111111111111111111111111111111111111111aa',
        'SIGNING',
        '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb1',
        '2024-12-01 00:00:00+00',
        '2026-01-01 00:00:00+00',
        'ACTIVE',
        5,
        2528,
        15234,
        '2025-01-01 00:00:30+00',
        '{"algorithm_variant": "Dilithium5", "nist_category": 5, "quantum_security_bits": 256}'::JSONB
    ),
    (
        '0xqk22222222222222222222222222222222222222222222222222222222222222',
        'CRYSTALS-Kyber-1024',
        '0xpkh2222222222222222222222222222222222222222222222222222222222bb',
        'ENCRYPTION',
        '0x5aAeb6053F3E94C9b9A09f33669435E7Ef1BeAed',
        '2024-12-01 00:00:00+00',
        '2026-01-01 00:00:00+00',
        'ACTIVE',
        5,
        1568,
        8923,
        '2025-01-01 00:00:25+00',
        '{"algorithm_variant": "Kyber-1024", "nist_category": 5, "quantum_security_bits": 256}'::JSONB
    ),
    (
        '0xqk33333333333333333333333333333333333333333333333333333333333333',
        'SPHINCS+-SHA2-256s',
        '0xpkh3333333333333333333333333333333333333333333333333333333333cc',
        'SIGNING',
        '0xfB6916095ca1df60bB79Ce92cE3Ea74c37c5d359',
        '2024-12-01 00:00:00+00',
        '2025-12-31 00:00:00+00',
        'ACTIVE',
        5,
        64,
        13456,
        '2025-01-01 00:00:20+00',
        '{"algorithm_variant": "SPHINCS+-SHA2-256s", "nist_category": 5, "quantum_security_bits": 256}'::JSONB
    ),
    (
        '0xqk44444444444444444444444444444444444444444444444444444444444444',
        'CRYSTALS-Dilithium3',
        '0xpkh4444444444444444444444444444444444444444444444444444444444dd',
        'SIGNING',
        '0xdbF03B407c01E7cD3CBea99509d93f8DDDC8C6FB',
        '2024-12-01 00:00:00+00',
        '2025-02-01 00:00:00+00',
        'EXPIRED',
        3,
        1952,
        8234,
        '2025-01-15 00:00:00+00',
        '{"algorithm_variant": "Dilithium3", "nist_category": 3, "quantum_security_bits": 192, "expired_reason": "Scheduled rotation"}'::JSONB
    ),
    (
        '0xqk55555555555555555555555555555555555555555555555555555555555555',
        'CRYSTALS-Dilithium5',
        '0xpkh5555555555555555555555555555555555555555555555555555555555ee',
        'SIGNING',
        '0xD1220A0cf47c7B9Be7A2E6BA89F429762e7b9aDb',
        '2024-12-01 00:00:00+00',
        '2025-03-01 00:00:00+00',
        'REVOKED',
        5,
        2528,
        5123,
        '2025-01-10 00:00:00+00',
        '{"algorithm_variant": "Dilithium5", "nist_category": 5, "quantum_security_bits": 256, "revocation_reason": "Validator jailed"}'::JSONB
    );

-- ==================================================================================
-- VERIFICATION QUERIES
-- ==================================================================================

-- Uncomment to verify sample data insertion:

-- SELECT COUNT(*) AS validator_count FROM validators;
-- SELECT COUNT(*) AS block_count FROM blocks;
-- SELECT COUNT(*) AS transaction_count FROM transactions;
-- SELECT COUNT(*) AS consensus_round_count FROM consensus_rounds;
-- SELECT COUNT(*) AS quantum_key_count FROM quantum_keys;

-- SELECT * FROM validators ORDER BY blocks_produced DESC;
-- SELECT * FROM blocks ORDER BY block_number;
-- SELECT * FROM transactions ORDER BY created_at;
-- SELECT * FROM consensus_rounds ORDER BY round_number;
-- SELECT * FROM quantum_keys ORDER BY created_at;

-- ==================================================================================
-- COMPLETION
-- ==================================================================================

DO $$
BEGIN
    RAISE NOTICE 'V26 Sample data migration completed at %', CURRENT_TIMESTAMP;
    RAISE NOTICE 'Inserted: 5 validators, 4 blocks, 4 transactions, 4 consensus rounds, 5 quantum keys';
    RAISE NOTICE 'WARNING: This is sample data for DEV/TEST only. Do NOT use in production!';
END $$;
