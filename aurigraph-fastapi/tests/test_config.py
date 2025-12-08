"""
Tests for application configuration using mock settings
"""

import pytest


class TestMockSettings:
    """Tests for mock settings configuration"""

    def test_version(self, mock_settings):
        """Test version is set correctly"""
        assert mock_settings.VERSION == "11.0.0"

    def test_environment(self, mock_settings):
        """Test environment is set to test"""
        assert mock_settings.ENVIRONMENT == "test"

    def test_debug_enabled(self, mock_settings):
        """Test debug is enabled in test mode"""
        assert mock_settings.DEBUG == True

    def test_node_configuration(self, mock_settings):
        """Test node configuration"""
        assert mock_settings.NODE_ID == "test-node"
        assert len(mock_settings.VALIDATORS) >= 1
        assert mock_settings.NODE_ID in mock_settings.VALIDATORS

    def test_performance_settings(self, mock_settings):
        """Test performance configuration"""
        assert mock_settings.TARGET_TPS > 0
        assert mock_settings.BATCH_SIZE > 0
        assert mock_settings.PARALLEL_THREADS > 0
        assert mock_settings.FINALITY_MS > 0

    def test_consensus_settings(self, mock_settings):
        """Test consensus configuration"""
        assert mock_settings.CONSENSUS_ALGORITHM == "HyperRAFT++"
        assert mock_settings.ELECTION_TIMEOUT_MS > 0
        assert mock_settings.HEARTBEAT_INTERVAL_MS > 0

    def test_quantum_crypto_settings(self, mock_settings):
        """Test quantum cryptography configuration"""
        assert isinstance(mock_settings.QUANTUM_ENABLED, bool)
        assert 1 <= mock_settings.QUANTUM_LEVEL <= 5
        assert mock_settings.QUANTUM_ALGORITHM in [
            "CRYSTALS-Dilithium",
            "CRYSTALS-Kyber",
            "SPHINCS+"
        ]

    def test_ai_optimization_disabled_in_test(self, mock_settings):
        """Test AI optimization is disabled in test mode"""
        assert mock_settings.AI_OPTIMIZATION_ENABLED == False

    def test_quantum_disabled_in_test(self, mock_settings):
        """Test quantum is disabled in test mode"""
        assert mock_settings.QUANTUM_ENABLED == False

    def test_security_settings(self, mock_settings):
        """Test security configuration"""
        assert len(mock_settings.SECRET_KEY) > 0
        assert mock_settings.JWT_ALGORITHM in ["HS256", "RS256", "ES256"]
        assert mock_settings.JWT_EXPIRATION_HOURS > 0

    def test_cors_settings(self, mock_settings):
        """Test CORS configuration"""
        assert isinstance(mock_settings.CORS_ORIGINS, list)
        assert len(mock_settings.CORS_ORIGINS) > 0

    def test_monitoring_settings(self, mock_settings):
        """Test monitoring configuration"""
        assert isinstance(mock_settings.PROMETHEUS_ENABLED, bool)
        assert mock_settings.METRICS_PORT > 0

    def test_network_settings(self, mock_settings):
        """Test network configuration"""
        assert mock_settings.P2P_PORT > 0
        assert mock_settings.MAX_PEERS > 0
        assert isinstance(mock_settings.BOOTSTRAP_NODES, list)

    def test_storage_settings(self, mock_settings):
        """Test storage configuration"""
        assert len(mock_settings.DATA_DIR) > 0
        assert len(mock_settings.BLOCKCHAIN_DB_PATH) > 0
        assert len(mock_settings.STATE_DB_PATH) > 0

    def test_feature_flags(self, mock_settings):
        """Test feature flag configuration"""
        assert isinstance(mock_settings.ZK_PROOFS_ENABLED, bool)
        assert isinstance(mock_settings.CROSS_CHAIN_ENABLED, bool)

    def test_server_settings(self, mock_settings):
        """Test server configuration"""
        assert mock_settings.HOST == "0.0.0.0"
        assert mock_settings.PORT == 9003
        assert mock_settings.GRPC_PORT == 9004

    def test_database_url(self, mock_settings):
        """Test database URL is set"""
        assert "sqlite" in mock_settings.DATABASE_URL or "postgresql" in mock_settings.DATABASE_URL

    def test_redis_url(self, mock_settings):
        """Test Redis URL is set"""
        assert mock_settings.REDIS_URL.startswith("redis://")
