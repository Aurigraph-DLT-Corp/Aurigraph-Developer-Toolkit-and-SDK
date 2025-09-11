"""
Block database model
"""

import enum
from datetime import datetime
from typing import Optional, Dict, Any, List
from sqlalchemy import (
    Column, String, Float, Integer, BigInteger, Text,
    DateTime, Enum, JSON, Index, Boolean
)
from sqlalchemy.orm import relationship
import json

from .base import Base


class BlockStatus(enum.Enum):
    """Block status enumeration"""
    PROPOSED = "proposed"
    VOTING = "voting"
    CONFIRMED = "confirmed"
    FINALIZED = "finalized"
    REJECTED = "rejected"


class BlockModel(Base):
    """
    Block model for database storage
    Optimized for blockchain operations and consensus
    """
    __tablename__ = "blocks"

    # Primary fields
    height = Column(BigInteger, primary_key=True, index=True)
    hash = Column(String(128), nullable=False, unique=True, index=True)
    previous_hash = Column(String(128), nullable=False, index=True)
    
    # Timestamps
    timestamp = Column(BigInteger, nullable=False, index=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    finalized_at = Column(DateTime, nullable=True)
    
    # Block producer/validator
    validator = Column(String(128), nullable=False, index=True)
    
    # Cryptographic data
    signature = Column(Text, nullable=True)  # Base64 encoded block signature
    merkle_root = Column(String(128), nullable=True)
    state_root = Column(String(128), nullable=True)
    
    # Block content
    transaction_count = Column(Integer, nullable=False, default=0)
    transaction_hashes = Column(JSON, nullable=True)  # List of transaction hashes
    
    # Block status and consensus
    status = Column(
        Enum(BlockStatus),
        nullable=False,
        default=BlockStatus.PROPOSED,
        index=True
    )
    
    # Consensus data
    consensus_algorithm = Column(String(50), nullable=False, default="HyperRAFT++")
    consensus_round = Column(Integer, nullable=False, default=1)
    validators_list = Column(JSON, nullable=True)  # List of validator IDs
    votes = Column(JSON, nullable=True)  # Vote mapping
    confidence_score = Column(Float, nullable=True, default=0.0)
    
    # Performance metrics
    block_size_bytes = Column(BigInteger, nullable=True)
    processing_time_ms = Column(Float, nullable=True)
    finality_time_ms = Column(Float, nullable=True)
    
    # Network and propagation
    propagation_time_ms = Column(Float, nullable=True)
    peer_confirmations = Column(Integer, nullable=True, default=0)
    
    # Additional metadata
    metadata = Column(JSON, nullable=True)
    gas_used = Column(BigInteger, nullable=True, default=0)
    gas_limit = Column(BigInteger, nullable=True, default=0)
    
    # Quantum resistance
    quantum_proof = Column(Text, nullable=True)  # Quantum-resistant proof
    quantum_algorithm = Column(String(50), nullable=True)
    
    # Indexing for high-performance queries
    __table_args__ = (
        # Composite indexes for common query patterns
        Index('idx_validator_timestamp', 'validator', 'timestamp'),
        Index('idx_status_height', 'status', 'height'),
        Index('idx_consensus_round', 'consensus_round', 'height'),
        Index('idx_timestamp_height', 'timestamp', 'height'),
        Index('idx_finalized_timestamp', 'finalized_at', 'height'),
    )

    def __repr__(self) -> str:
        return f"<Block(height={self.height}, hash={self.hash}, validator={self.validator})>"

    def to_dict(self) -> Dict[str, Any]:
        """
        Convert model to dictionary
        """
        return {
            'height': self.height,
            'hash': self.hash,
            'previous_hash': self.previous_hash,
            'timestamp': self.timestamp,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'finalized_at': self.finalized_at.isoformat() if self.finalized_at else None,
            'validator': self.validator,
            'signature': self.signature,
            'merkle_root': self.merkle_root,
            'state_root': self.state_root,
            'transaction_count': self.transaction_count,
            'transaction_hashes': self.transaction_hashes,
            'status': self.status.value if self.status else None,
            'consensus_algorithm': self.consensus_algorithm,
            'consensus_round': self.consensus_round,
            'validators_list': self.validators_list,
            'votes': self.votes,
            'confidence_score': self.confidence_score,
            'block_size_bytes': self.block_size_bytes,
            'processing_time_ms': self.processing_time_ms,
            'finality_time_ms': self.finality_time_ms,
            'propagation_time_ms': self.propagation_time_ms,
            'peer_confirmations': self.peer_confirmations,
            'metadata': self.metadata,
            'gas_used': self.gas_used,
            'gas_limit': self.gas_limit,
            'quantum_proof': self.quantum_proof,
            'quantum_algorithm': self.quantum_algorithm,
        }

    @classmethod
    def from_protobuf(cls, pb_block) -> 'BlockModel':
        """
        Create model instance from protobuf Block message
        """
        # Extract transaction hashes
        tx_hashes = [tx.id for tx in pb_block.transactions] if pb_block.transactions else []
        
        # Extract consensus data
        consensus_data = pb_block.consensus_data
        votes = dict(consensus_data.votes) if consensus_data and consensus_data.votes else {}
        validators = list(consensus_data.validators) if consensus_data and consensus_data.validators else []
        
        return cls(
            height=pb_block.height,
            hash=pb_block.hash,
            previous_hash=pb_block.previous_hash,
            timestamp=pb_block.timestamp,
            validator=pb_block.validator,
            signature=pb_block.signature.decode('utf-8') if pb_block.signature else None,
            transaction_count=len(pb_block.transactions) if pb_block.transactions else 0,
            transaction_hashes=tx_hashes,
            consensus_algorithm=consensus_data.algorithm if consensus_data else "HyperRAFT++",
            consensus_round=consensus_data.round if consensus_data else 1,
            validators_list=validators,
            votes=votes,
            confidence_score=consensus_data.confidence_score if consensus_data else 0.0,
        )

    def to_protobuf(self):
        """
        Convert model to protobuf Block message
        """
        from generated.aurigraph_pb2 import Block, ConsensusData
        
        # Create consensus data
        consensus_data = ConsensusData(
            algorithm=self.consensus_algorithm or "HyperRAFT++",
            round=self.consensus_round or 1,
            validators=self.validators_list or [],
            votes=self.votes or {},
            confidence_score=self.confidence_score or 0.0
        )
        
        return Block(
            height=self.height,
            hash=self.hash,
            previous_hash=self.previous_hash,
            timestamp=self.timestamp,
            validator=self.validator,
            signature=self.signature.encode('utf-8') if self.signature else b'',
            consensus_data=consensus_data,
            transactions=[]  # Transactions loaded separately for performance
        )

    def calculate_merkle_root(self, transaction_hashes: List[str]) -> str:
        """
        Calculate Merkle root from transaction hashes
        """
        import hashlib
        
        if not transaction_hashes:
            return hashlib.sha256(b'').hexdigest()
        
        # Simple Merkle tree implementation
        def merkle_hash(hashes):
            if len(hashes) == 1:
                return hashes[0]
            
            next_level = []
            for i in range(0, len(hashes), 2):
                left = hashes[i]
                right = hashes[i + 1] if i + 1 < len(hashes) else left
                combined = left + right
                next_level.append(hashlib.sha256(combined.encode()).hexdigest())
            
            return merkle_hash(next_level)
        
        return merkle_hash(transaction_hashes)

    def calculate_block_hash(self) -> str:
        """
        Calculate block hash
        """
        import hashlib
        import json
        
        # Create deterministic hash from block data
        data = {
            'height': self.height,
            'previous_hash': self.previous_hash,
            'timestamp': self.timestamp,
            'validator': self.validator,
            'merkle_root': self.merkle_root,
            'transaction_count': self.transaction_count,
        }
        
        json_str = json.dumps(data, sort_keys=True, separators=(',', ':'))
        return hashlib.sha256(json_str.encode()).hexdigest()

    def add_vote(self, voter_id: str, approve: bool) -> bool:
        """
        Add a vote to the block
        """
        try:
            if not self.votes:
                self.votes = {}
            
            self.votes[voter_id] = approve
            
            # Update confidence score
            total_votes = len(self.votes)
            approve_votes = sum(1 for v in self.votes.values() if v)
            self.confidence_score = approve_votes / total_votes if total_votes > 0 else 0.0
            
            return True
        except Exception:
            return False

    def has_consensus(self, required_validators: int = 3) -> bool:
        """
        Check if block has achieved consensus (2/3+ majority)
        """
        try:
            if not self.votes:
                return False
            
            total_votes = len(self.votes)
            approve_votes = sum(1 for v in self.votes.values() if v)
            required_majority = (required_validators * 2) // 3 + 1
            
            return approve_votes >= required_majority and total_votes >= required_majority
        except:
            return False

    def is_valid(self) -> bool:
        """
        Validate block data
        """
        try:
            if self.height <= 0:
                return False
            if not self.hash:
                return False
            if not self.previous_hash and self.height > 1:
                return False
            if not self.validator:
                return False
            if self.timestamp <= 0:
                return False
            return True
        except:
            return False