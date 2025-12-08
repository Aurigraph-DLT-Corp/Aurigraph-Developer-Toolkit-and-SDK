"""
Tests for Transaction model structures and validation
"""

import pytest
import hashlib
import json
import time
from enum import Enum


class TransactionStatus(Enum):
    """Transaction status enumeration for testing"""
    PENDING = "pending"
    PROCESSING = "processing"
    CONFIRMED = "confirmed"
    REJECTED = "rejected"
    FAILED = "failed"


class MockTransaction:
    """Mock transaction model for testing"""

    def __init__(self, **kwargs):
        self.id = kwargs.get('id', '')
        self.from_address = kwargs.get('from_address', '')
        self.to_address = kwargs.get('to_address', '')
        self.amount = kwargs.get('amount', 0.0)
        self.timestamp = kwargs.get('timestamp', 0)
        self.type = kwargs.get('type', 'transfer')
        self.nonce = kwargs.get('nonce', 0)
        self.gas_price = kwargs.get('gas_price', 0.0)
        self.gas_limit = kwargs.get('gas_limit', 21000.0)
        self.gas_used = kwargs.get('gas_used')
        self.signature = kwargs.get('signature')
        self.hash = kwargs.get('hash')
        self.status = kwargs.get('status', TransactionStatus.PENDING)
        self.block_hash = kwargs.get('block_hash')
        self.block_height = kwargs.get('block_height')
        self.transaction_index = kwargs.get('transaction_index')
        self.metadata = kwargs.get('metadata')
        self.error_message = kwargs.get('error_message')
        self.processing_time_ms = kwargs.get('processing_time_ms')
        self.confirmation_time_ms = kwargs.get('confirmation_time_ms')
        self.quantum_signature = kwargs.get('quantum_signature')
        self.quantum_algorithm = kwargs.get('quantum_algorithm')
        self.security_level = kwargs.get('security_level')

    def __repr__(self):
        return f"<Transaction(id={self.id}, from={self.from_address}, to={self.to_address}, amount={self.amount})>"

    def to_dict(self):
        return {
            'id': self.id,
            'from_address': self.from_address,
            'to_address': self.to_address,
            'amount': self.amount,
            'timestamp': self.timestamp,
            'type': self.type,
            'nonce': self.nonce,
            'gas_price': self.gas_price,
            'gas_limit': self.gas_limit,
            'status': self.status.value if self.status else None,
        }

    def calculate_hash(self):
        data = {
            'id': self.id,
            'from_address': self.from_address,
            'to_address': self.to_address,
            'amount': self.amount,
            'timestamp': self.timestamp,
            'type': self.type,
            'nonce': self.nonce,
        }
        json_str = json.dumps(data, sort_keys=True, separators=(',', ':'))
        return hashlib.sha256(json_str.encode()).hexdigest()

    def is_valid(self):
        try:
            if not self.id:
                return False
            if not self.from_address or not self.to_address:
                return False
            if self.amount <= 0:
                return False
            if self.timestamp <= 0:
                return False
            if not self.type:
                return False
            return True
        except:
            return False


class TestTransactionStatus:
    """Tests for TransactionStatus enum"""

    def test_pending_status(self):
        assert TransactionStatus.PENDING.value == "pending"

    def test_processing_status(self):
        assert TransactionStatus.PROCESSING.value == "processing"

    def test_confirmed_status(self):
        assert TransactionStatus.CONFIRMED.value == "confirmed"

    def test_rejected_status(self):
        assert TransactionStatus.REJECTED.value == "rejected"

    def test_failed_status(self):
        assert TransactionStatus.FAILED.value == "failed"


class TestMockTransaction:
    """Tests for MockTransaction model"""

    def test_create_transaction(self):
        """Test creating a basic transaction"""
        tx = MockTransaction(
            id="test-tx-001",
            from_address="0x1234567890abcdef1234567890abcdef12345678",
            to_address="0xabcdef1234567890abcdef1234567890abcdef12",
            amount=100.0,
            timestamp=int(time.time() * 1000),
            type="transfer",
            nonce=1,
            status=TransactionStatus.PENDING
        )

        assert tx.id == "test-tx-001"
        assert tx.from_address.startswith("0x")
        assert tx.to_address.startswith("0x")
        assert tx.amount == 100.0
        assert tx.type == "transfer"
        assert tx.status == TransactionStatus.PENDING

    def test_transaction_to_dict(self):
        """Test converting transaction to dictionary"""
        tx = MockTransaction(
            id="test-tx-002",
            from_address="0x1111111111111111111111111111111111111111",
            to_address="0x2222222222222222222222222222222222222222",
            amount=50.0,
            timestamp=1700000000000,
            type="transfer",
            nonce=5,
            status=TransactionStatus.CONFIRMED
        )

        result = tx.to_dict()

        assert result["id"] == "test-tx-002"
        assert result["from_address"] == "0x1111111111111111111111111111111111111111"
        assert result["to_address"] == "0x2222222222222222222222222222222222222222"
        assert result["amount"] == 50.0
        assert result["timestamp"] == 1700000000000
        assert result["type"] == "transfer"
        assert result["nonce"] == 5
        assert result["status"] == "confirmed"

    def test_transaction_repr(self):
        """Test transaction string representation"""
        tx = MockTransaction(
            id="tx-repr-test",
            from_address="0xfrom",
            to_address="0xto",
            amount=25.0,
            timestamp=1700000000000
        )

        repr_str = repr(tx)

        assert "tx-repr-test" in repr_str
        assert "0xfrom" in repr_str
        assert "0xto" in repr_str
        assert "25.0" in repr_str

    def test_transaction_calculate_hash(self):
        """Test transaction hash calculation"""
        tx = MockTransaction(
            id="tx-hash-test",
            from_address="0x1234",
            to_address="0x5678",
            amount=100.0,
            timestamp=1700000000000,
            type="transfer",
            nonce=1
        )

        hash1 = tx.calculate_hash()
        hash2 = tx.calculate_hash()

        # Hash should be deterministic
        assert hash1 == hash2
        # Hash should be 64 characters (SHA-256 hex)
        assert len(hash1) == 64
        # Hash should be hexadecimal
        assert all(c in "0123456789abcdef" for c in hash1)

    def test_transaction_hash_changes_with_data(self):
        """Test that hash changes when transaction data changes"""
        tx1 = MockTransaction(
            id="tx-1",
            from_address="0x1234",
            to_address="0x5678",
            amount=100.0,
            timestamp=1700000000000,
            type="transfer",
            nonce=1
        )

        tx2 = MockTransaction(
            id="tx-2",
            from_address="0x1234",
            to_address="0x5678",
            amount=100.0,
            timestamp=1700000000000,
            type="transfer",
            nonce=1
        )

        # Different IDs should produce different hashes
        assert tx1.calculate_hash() != tx2.calculate_hash()

    def test_transaction_is_valid(self):
        """Test transaction validation"""
        valid_tx = MockTransaction(
            id="tx-valid",
            from_address="0x1234",
            to_address="0x5678",
            amount=100.0,
            timestamp=1700000000000,
            type="transfer"
        )
        assert valid_tx.is_valid() == True

    def test_transaction_invalid_missing_id(self):
        """Test that transaction without ID is invalid"""
        tx = MockTransaction(
            id="",
            from_address="0x1234",
            to_address="0x5678",
            amount=100.0,
            timestamp=1700000000000,
            type="transfer"
        )
        assert tx.is_valid() == False

    def test_transaction_invalid_missing_addresses(self):
        """Test that transaction without addresses is invalid"""
        tx = MockTransaction(
            id="tx-no-addr",
            from_address="",
            to_address="0x5678",
            amount=100.0,
            timestamp=1700000000000,
            type="transfer"
        )
        assert tx.is_valid() == False

    def test_transaction_invalid_zero_amount(self):
        """Test that transaction with zero amount is invalid"""
        tx = MockTransaction(
            id="tx-zero",
            from_address="0x1234",
            to_address="0x5678",
            amount=0,
            timestamp=1700000000000,
            type="transfer"
        )
        assert tx.is_valid() == False

    def test_transaction_invalid_negative_amount(self):
        """Test that transaction with negative amount is invalid"""
        tx = MockTransaction(
            id="tx-negative",
            from_address="0x1234",
            to_address="0x5678",
            amount=-100.0,
            timestamp=1700000000000,
            type="transfer"
        )
        assert tx.is_valid() == False

    def test_transaction_gas_defaults(self):
        """Test transaction gas default values"""
        tx = MockTransaction(
            id="tx-gas",
            from_address="0x1234",
            to_address="0x5678",
            amount=100.0,
            timestamp=1700000000000
        )

        assert tx.gas_price == 0.0
        assert tx.gas_limit == 21000.0

    def test_transaction_type_default(self):
        """Test transaction type default value"""
        tx = MockTransaction(
            id="tx-type",
            from_address="0x1234",
            to_address="0x5678",
            amount=100.0,
            timestamp=1700000000000
        )

        assert tx.type == "transfer"

    def test_transaction_quantum_fields(self):
        """Test quantum cryptography fields"""
        tx = MockTransaction(
            id="tx-quantum",
            from_address="0x1234",
            to_address="0x5678",
            amount=100.0,
            timestamp=1700000000000,
            quantum_signature="quantum_sig_data",
            quantum_algorithm="CRYSTALS-Dilithium",
            security_level=5
        )

        assert tx.quantum_signature == "quantum_sig_data"
        assert tx.quantum_algorithm == "CRYSTALS-Dilithium"
        assert tx.security_level == 5

    def test_transaction_block_info(self):
        """Test transaction block information fields"""
        tx = MockTransaction(
            id="tx-block",
            from_address="0x1234",
            to_address="0x5678",
            amount=100.0,
            timestamp=1700000000000,
            block_hash="0x" + "a" * 64,
            block_height=1000,
            transaction_index=5
        )

        assert tx.block_hash == "0x" + "a" * 64
        assert tx.block_height == 1000
        assert tx.transaction_index == 5

    def test_transaction_performance_fields(self):
        """Test transaction performance tracking fields"""
        tx = MockTransaction(
            id="tx-perf",
            from_address="0x1234",
            to_address="0x5678",
            amount=100.0,
            timestamp=1700000000000,
            processing_time_ms=15.5,
            confirmation_time_ms=100.0
        )

        assert tx.processing_time_ms == 15.5
        assert tx.confirmation_time_ms == 100.0


class TestSampleFixtures:
    """Tests using sample fixtures"""

    def test_sample_transaction_fixture(self, sample_transaction):
        """Test sample transaction has required fields"""
        assert "from_address" in sample_transaction
        assert "to_address" in sample_transaction
        assert "amount" in sample_transaction
        assert sample_transaction["from_address"].startswith("0x")

    def test_sample_block_fixture(self, sample_block):
        """Test sample block has required fields"""
        assert "number" in sample_block
        assert "hash" in sample_block
        assert "transactions" in sample_block
        assert len(sample_block["transactions"]) > 0

    def test_sample_node_fixture(self, sample_node):
        """Test sample node has required fields"""
        assert "node_id" in sample_node
        assert "address" in sample_node
        assert "port" in sample_node
        assert sample_node["type"] == "validator"
