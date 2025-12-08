"""
Pytest configuration and fixtures for Aurigraph FastAPI tests

Note: These tests are designed to run independently without
requiring the full application stack to be installed.
"""

import pytest
import asyncio
from typing import AsyncGenerator, Generator
from unittest.mock import Mock, AsyncMock, MagicMock


@pytest.fixture(scope="session")
def event_loop():
    """Create an instance of the default event loop for each test session."""
    loop = asyncio.get_event_loop_policy().new_event_loop()
    yield loop
    loop.close()


@pytest.fixture
def mock_settings():
    """Create mock settings for testing."""
    settings = Mock()
    settings.VERSION = "11.0.0"
    settings.ENVIRONMENT = "test"
    settings.DEBUG = True
    settings.HOST = "0.0.0.0"
    settings.PORT = 9003
    settings.GRPC_PORT = 9004
    settings.NODE_ID = "test-node"
    settings.TARGET_TPS = 1000
    settings.VALIDATORS = ["test-node", "validator-2"]
    settings.CONSENSUS_ALGORITHM = "HyperRAFT++"
    settings.QUANTUM_ENABLED = False
    settings.QUANTUM_LEVEL = 5
    settings.QUANTUM_ALGORITHM = "CRYSTALS-Dilithium"
    settings.AI_OPTIMIZATION_ENABLED = False
    settings.SECRET_KEY = "test-secret"
    settings.JWT_ALGORITHM = "HS256"
    settings.JWT_EXPIRATION_HOURS = 24
    settings.CORS_ORIGINS = ["http://localhost:3000"]
    settings.PROMETHEUS_ENABLED = True
    settings.METRICS_PORT = 9090
    settings.DATABASE_URL = "sqlite:///./test.db"
    settings.REDIS_URL = "redis://localhost:6379/1"
    settings.P2P_PORT = 30303
    settings.MAX_PEERS = 100
    settings.BOOTSTRAP_NODES = []
    settings.DATA_DIR = "./data"
    settings.BLOCKCHAIN_DB_PATH = "./data/blockchain.db"
    settings.STATE_DB_PATH = "./data/state.db"
    settings.ZK_PROOFS_ENABLED = True
    settings.CROSS_CHAIN_ENABLED = True
    settings.FINALITY_MS = 100
    settings.BATCH_SIZE = 10000
    settings.PARALLEL_THREADS = 256
    settings.ELECTION_TIMEOUT_MS = 1000
    settings.HEARTBEAT_INTERVAL_MS = 1000
    settings.AI_LEARNING_RATE = 0.001
    return settings


@pytest.fixture
def mock_quantum_crypto():
    """Create a mock quantum crypto manager."""
    mock = AsyncMock()
    mock.initialize = AsyncMock()
    mock.get_stats = Mock(return_value={
        "initialized": True,
        "algorithm": "CRYSTALS-Dilithium",
        "security_level": 5
    })
    mock.sign = AsyncMock(return_value=b"mock_signature")
    mock.verify = AsyncMock(return_value=True)
    return mock


@pytest.fixture
def mock_transaction_processor():
    """Create a mock transaction processor."""
    mock = AsyncMock()
    mock.initialize = AsyncMock()
    mock.initialized = True
    mock.stop = AsyncMock()
    mock.get_stats = Mock(return_value={
        "running": True,
        "processed_count": 1000,
        "current_tps": 500.0
    })
    mock.process_transaction = AsyncMock(return_value={
        "tx_id": "test-tx-123",
        "status": "confirmed"
    })
    return mock


@pytest.fixture
def mock_consensus_engine():
    """Create a mock consensus engine."""
    mock = AsyncMock()
    mock.initialize = AsyncMock()
    mock.initialized = True
    mock.stop = AsyncMock()
    mock.get_stats = Mock(return_value={
        "running": True,
        "state": "leader",
        "leader": "test-node",
        "term": 1,
        "commit_index": 100
    })
    mock.propose = AsyncMock(return_value=True)
    return mock


@pytest.fixture
def mock_monitoring():
    """Create a mock monitoring service."""
    mock = AsyncMock()
    mock.start = AsyncMock()
    mock.stop = AsyncMock()
    mock.get_stats = Mock(return_value={
        "running": True,
        "metrics_collected": 500
    })
    return mock


@pytest.fixture
def mock_grpc_server():
    """Create a mock gRPC server."""
    mock = AsyncMock()
    mock.start = AsyncMock()
    mock.stop = AsyncMock()
    mock.is_running = Mock(return_value=True)
    mock.get_port = Mock(return_value=9004)
    return mock


@pytest.fixture
def sample_transaction():
    """Sample transaction data for testing."""
    return {
        "from_address": "0x1234567890abcdef1234567890abcdef12345678",
        "to_address": "0xabcdef1234567890abcdef1234567890abcdef12",
        "amount": "1000000000000000000",
        "nonce": 1,
        "gas_price": "20000000000",
        "gas_limit": 21000,
        "data": "0x",
        "chain_id": 1
    }


@pytest.fixture
def sample_block():
    """Sample block data for testing."""
    return {
        "number": 1000,
        "hash": "0x" + "a" * 64,
        "parent_hash": "0x" + "b" * 64,
        "timestamp": 1700000000,
        "transactions": [
            {"tx_id": "tx1", "status": "confirmed"},
            {"tx_id": "tx2", "status": "confirmed"}
        ],
        "validator": "test-node",
        "merkle_root": "0x" + "c" * 64
    }


@pytest.fixture
def sample_node():
    """Sample node data for testing."""
    return {
        "node_id": "test-node-1",
        "address": "192.168.1.100",
        "port": 30303,
        "type": "validator",
        "status": "active",
        "last_seen": 1700000000,
        "version": "11.0.0"
    }
