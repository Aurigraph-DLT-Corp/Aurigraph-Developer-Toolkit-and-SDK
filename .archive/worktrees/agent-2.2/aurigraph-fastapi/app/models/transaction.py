"""
Transaction database model
"""

import enum
from datetime import datetime
from typing import Optional, Dict, Any
from sqlalchemy import (
    Column, String, Float, Integer, BigInteger, Text, 
    DateTime, Enum, JSON, Index, Boolean
)
from sqlalchemy.dialects.postgresql import UUID
import uuid

from .base import Base


class TransactionStatus(enum.Enum):
    """Transaction status enumeration"""
    PENDING = "pending"
    PROCESSING = "processing"
    CONFIRMED = "confirmed"
    REJECTED = "rejected"
    FAILED = "failed"


class TransactionModel(Base):
    """
    Transaction model for database storage
    Optimized for high-throughput transaction processing
    """
    __tablename__ = "transactions"

    # Primary fields
    id = Column(String(128), primary_key=True, index=True)
    from_address = Column(String(128), nullable=False, index=True)
    to_address = Column(String(128), nullable=False, index=True)
    amount = Column(Float, nullable=False)
    
    # Timestamps
    timestamp = Column(BigInteger, nullable=False, index=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Transaction details
    type = Column(String(50), nullable=False, default="transfer", index=True)
    nonce = Column(BigInteger, nullable=False, default=0)
    gas_price = Column(Float, nullable=False, default=0.0)
    gas_limit = Column(Float, nullable=False, default=21000.0)
    gas_used = Column(Float, nullable=True)
    
    # Cryptographic data
    signature = Column(Text, nullable=True)  # Base64 encoded signature
    hash = Column(String(128), nullable=True, unique=True, index=True)
    
    # Status and processing
    status = Column(
        Enum(TransactionStatus),
        nullable=False,
        default=TransactionStatus.PENDING,
        index=True
    )
    
    # Block information
    block_hash = Column(String(128), nullable=True, index=True)
    block_height = Column(BigInteger, nullable=True, index=True)
    transaction_index = Column(Integer, nullable=True)
    
    # Metadata and additional data
    metadata = Column(JSON, nullable=True)
    error_message = Column(Text, nullable=True)
    
    # Performance tracking
    processing_time_ms = Column(Float, nullable=True)
    confirmation_time_ms = Column(Float, nullable=True)
    
    # Quantum signature data
    quantum_signature = Column(Text, nullable=True)  # JSON encoded quantum signature
    quantum_algorithm = Column(String(50), nullable=True)
    security_level = Column(Integer, nullable=True)
    
    # Indexing for high-performance queries
    __table_args__ = (
        # Composite indexes for common query patterns
        Index('idx_from_timestamp', 'from_address', 'timestamp'),
        Index('idx_to_timestamp', 'to_address', 'timestamp'),
        Index('idx_block_index', 'block_hash', 'transaction_index'),
        Index('idx_status_timestamp', 'status', 'timestamp'),
        Index('idx_type_timestamp', 'type', 'timestamp'),
        Index('idx_amount_timestamp', 'amount', 'timestamp'),
    )

    def __repr__(self) -> str:
        return f"<Transaction(id={self.id}, from={self.from_address}, to={self.to_address}, amount={self.amount})>"

    def to_dict(self) -> Dict[str, Any]:
        """
        Convert model to dictionary
        """
        return {
            'id': self.id,
            'from_address': self.from_address,
            'to_address': self.to_address,
            'amount': self.amount,
            'timestamp': self.timestamp,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None,
            'type': self.type,
            'nonce': self.nonce,
            'gas_price': self.gas_price,
            'gas_limit': self.gas_limit,
            'gas_used': self.gas_used,
            'signature': self.signature,
            'hash': self.hash,
            'status': self.status.value if self.status else None,
            'block_hash': self.block_hash,
            'block_height': self.block_height,
            'transaction_index': self.transaction_index,
            'metadata': self.metadata,
            'error_message': self.error_message,
            'processing_time_ms': self.processing_time_ms,
            'confirmation_time_ms': self.confirmation_time_ms,
            'quantum_signature': self.quantum_signature,
            'quantum_algorithm': self.quantum_algorithm,
            'security_level': self.security_level,
        }

    @classmethod
    def from_protobuf(cls, pb_transaction) -> 'TransactionModel':
        """
        Create model instance from protobuf Transaction message
        """
        return cls(
            id=pb_transaction.id,
            from_address=pb_transaction.from_address,
            to_address=pb_transaction.to_address,
            amount=pb_transaction.amount,
            timestamp=pb_transaction.timestamp,
            type=pb_transaction.type or "transfer",
            nonce=pb_transaction.nonce,
            gas_price=pb_transaction.gas_price,
            gas_limit=pb_transaction.gas_limit,
            signature=pb_transaction.signature.decode('utf-8') if pb_transaction.signature else None,
            metadata=dict(pb_transaction.metadata) if pb_transaction.metadata else None,
        )

    def to_protobuf(self):
        """
        Convert model to protobuf Transaction message
        """
        from generated.aurigraph_pb2 import Transaction
        
        return Transaction(
            id=self.id,
            from_address=self.from_address,
            to_address=self.to_address,
            amount=self.amount,
            timestamp=self.timestamp,
            signature=self.signature.encode('utf-8') if self.signature else b'',
            type=self.type,
            metadata=self.metadata or {},
            nonce=self.nonce,
            gas_price=self.gas_price,
            gas_limit=self.gas_limit,
        )

    def calculate_hash(self) -> str:
        """
        Calculate transaction hash
        """
        import hashlib
        import json
        
        # Create deterministic hash from transaction data
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

    def is_valid(self) -> bool:
        """
        Validate transaction data
        """
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