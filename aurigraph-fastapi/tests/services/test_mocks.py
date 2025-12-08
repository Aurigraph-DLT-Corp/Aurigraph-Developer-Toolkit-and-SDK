"""
Tests for mock services and fixtures
"""

import pytest


class TestMockServices:
    """Tests to verify mock services work correctly"""

    def test_mock_quantum_crypto(self, mock_quantum_crypto):
        """Test quantum crypto mock is properly configured"""
        stats = mock_quantum_crypto.get_stats()

        assert stats["initialized"] == True
        assert stats["algorithm"] == "CRYSTALS-Dilithium"
        assert stats["security_level"] == 5

    @pytest.mark.asyncio
    async def test_mock_quantum_crypto_sign(self, mock_quantum_crypto):
        """Test quantum crypto mock signing"""
        signature = await mock_quantum_crypto.sign(b"test data")
        assert signature == b"mock_signature"

    @pytest.mark.asyncio
    async def test_mock_quantum_crypto_verify(self, mock_quantum_crypto):
        """Test quantum crypto mock verification"""
        result = await mock_quantum_crypto.verify(b"signature", b"data")
        assert result == True

    def test_mock_transaction_processor(self, mock_transaction_processor):
        """Test transaction processor mock is properly configured"""
        stats = mock_transaction_processor.get_stats()

        assert stats["running"] == True
        assert stats["processed_count"] == 1000
        assert stats["current_tps"] == 500.0

    @pytest.mark.asyncio
    async def test_mock_transaction_processor_process(self, mock_transaction_processor):
        """Test transaction processor mock processing"""
        result = await mock_transaction_processor.process_transaction({})

        assert result["tx_id"] == "test-tx-123"
        assert result["status"] == "confirmed"

    def test_mock_consensus_engine(self, mock_consensus_engine):
        """Test consensus engine mock is properly configured"""
        stats = mock_consensus_engine.get_stats()

        assert stats["running"] == True
        assert stats["state"] == "leader"
        assert stats["leader"] == "test-node"
        assert stats["term"] == 1
        assert stats["commit_index"] == 100

    @pytest.mark.asyncio
    async def test_mock_consensus_propose(self, mock_consensus_engine):
        """Test consensus engine mock propose"""
        result = await mock_consensus_engine.propose({})
        assert result == True

    def test_mock_monitoring(self, mock_monitoring):
        """Test monitoring mock is properly configured"""
        stats = mock_monitoring.get_stats()

        assert stats["running"] == True
        assert stats["metrics_collected"] == 500

    def test_mock_grpc_server(self, mock_grpc_server):
        """Test gRPC server mock is properly configured"""
        assert mock_grpc_server.is_running() == True
        assert mock_grpc_server.get_port() == 9004


class TestSampleFixtures:
    """Tests for sample data fixtures"""

    def test_sample_transaction(self, sample_transaction):
        """Test sample transaction fixture"""
        assert "from_address" in sample_transaction
        assert "to_address" in sample_transaction
        assert "amount" in sample_transaction
        assert sample_transaction["from_address"].startswith("0x")
        assert sample_transaction["to_address"].startswith("0x")

    def test_sample_block(self, sample_block):
        """Test sample block fixture"""
        assert "number" in sample_block
        assert "hash" in sample_block
        assert "transactions" in sample_block
        assert sample_block["number"] == 1000
        assert len(sample_block["transactions"]) == 2

    def test_sample_node(self, sample_node):
        """Test sample node fixture"""
        assert "node_id" in sample_node
        assert "address" in sample_node
        assert "port" in sample_node
        assert sample_node["type"] == "validator"
        assert sample_node["status"] == "active"


class TestMockSettings:
    """Tests for mock settings fixture"""

    def test_mock_settings_environment(self, mock_settings):
        """Test that mock settings use test environment"""
        assert mock_settings.ENVIRONMENT == "test"

    def test_mock_settings_debug(self, mock_settings):
        """Test that mock settings have debug enabled"""
        assert mock_settings.DEBUG == True

    def test_mock_settings_node_id(self, mock_settings):
        """Test that mock settings have test node ID"""
        assert mock_settings.NODE_ID == "test-node"

    def test_mock_settings_reduced_tps(self, mock_settings):
        """Test that mock settings have reduced TPS target"""
        assert mock_settings.TARGET_TPS == 1000

    def test_mock_settings_quantum_disabled(self, mock_settings):
        """Test that quantum is disabled in mock settings"""
        assert mock_settings.QUANTUM_ENABLED == False

    def test_mock_settings_ai_disabled(self, mock_settings):
        """Test that AI is disabled in mock settings"""
        assert mock_settings.AI_OPTIMIZATION_ENABLED == False
