"""
Node database model
"""

import enum
from datetime import datetime
from typing import Optional, Dict, Any
from sqlalchemy import (
    Column, String, Float, Integer, BigInteger, Text,
    DateTime, Enum, JSON, Index, Boolean
)

from .base import Base


class NodeType(enum.Enum):
    """Node type enumeration"""
    VALIDATOR = "validator"
    FULL_NODE = "full_node"
    LIGHT_NODE = "light_node"
    ARCHIVE_NODE = "archive_node"


class NodeStatus(enum.Enum):
    """Node status enumeration"""
    ACTIVE = "active"
    INACTIVE = "inactive"
    SYNCING = "syncing"
    OFFLINE = "offline"
    MAINTENANCE = "maintenance"


class NodeModel(Base):
    """
    Node model for database storage
    Tracks network participants and their status
    """
    __tablename__ = "nodes"

    # Primary identification
    node_id = Column(String(128), primary_key=True, index=True)
    address = Column(String(128), nullable=False)
    port = Column(Integer, nullable=False)
    
    # Node classification
    type = Column(
        Enum(NodeType),
        nullable=False,
        default=NodeType.FULL_NODE,
        index=True
    )
    status = Column(
        Enum(NodeStatus),
        nullable=False,
        default=NodeStatus.INACTIVE,
        index=True
    )
    
    # Timestamps
    registered_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    last_seen_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    last_heartbeat_at = Column(DateTime, nullable=True)
    
    # Validator-specific data
    stake = Column(BigInteger, nullable=False, default=0)
    is_active = Column(Boolean, nullable=False, default=False, index=True)
    
    # Performance metrics
    performance_score = Column(Float, nullable=False, default=0.0, index=True)
    uptime_percentage = Column(Float, nullable=False, default=0.0)
    average_response_time_ms = Column(Float, nullable=True)
    
    # Network statistics
    block_count = Column(BigInteger, nullable=False, default=0)
    transaction_count = Column(BigInteger, nullable=False, default=0)
    successful_votes = Column(BigInteger, nullable=False, default=0)
    failed_votes = Column(BigInteger, nullable=False, default=0)
    
    # Connection information
    peer_count = Column(Integer, nullable=False, default=0)
    max_peers = Column(Integer, nullable=False, default=100)
    bandwidth_usage_mbps = Column(Float, nullable=True)
    
    # System information
    version = Column(String(50), nullable=True)
    os_info = Column(String(100), nullable=True)
    cpu_cores = Column(Integer, nullable=True)
    memory_gb = Column(Float, nullable=True)
    disk_space_gb = Column(Float, nullable=True)
    
    # Blockchain state
    current_block_height = Column(BigInteger, nullable=False, default=0)
    sync_progress = Column(Float, nullable=False, default=0.0)  # 0.0 to 1.0
    
    # Security and cryptography
    public_key = Column(Text, nullable=True)
    quantum_signature_support = Column(Boolean, nullable=False, default=False)
    security_level = Column(Integer, nullable=True)  # NIST Level 1-5
    
    # Geographic and network data
    country = Column(String(5), nullable=True)  # ISO country code
    region = Column(String(100), nullable=True)
    latitude = Column(Float, nullable=True)
    longitude = Column(Float, nullable=True)
    
    # Additional metadata
    metadata = Column(JSON, nullable=True)
    features = Column(JSON, nullable=True)  # Supported features list
    
    # Reputation system
    reputation_score = Column(Float, nullable=False, default=1.0)
    slash_count = Column(Integer, nullable=False, default=0)
    reward_count = Column(BigInteger, nullable=False, default=0)
    
    # Indexing for high-performance queries
    __table_args__ = (
        # Composite indexes for common query patterns
        Index('idx_type_status', 'type', 'status'),
        Index('idx_active_performance', 'is_active', 'performance_score'),
        Index('idx_stake_performance', 'stake', 'performance_score'),
        Index('idx_last_seen_status', 'last_seen_at', 'status'),
        Index('idx_block_height', 'current_block_height'),
        Index('idx_reputation', 'reputation_score', 'slash_count'),
    )

    def __repr__(self) -> str:
        return f"<Node(id={self.node_id}, type={self.type.value}, status={self.status.value})>"

    def to_dict(self) -> Dict[str, Any]:
        """
        Convert model to dictionary
        """
        return {
            'node_id': self.node_id,
            'address': self.address,
            'port': self.port,
            'type': self.type.value if self.type else None,
            'status': self.status.value if self.status else None,
            'registered_at': self.registered_at.isoformat() if self.registered_at else None,
            'last_seen_at': self.last_seen_at.isoformat() if self.last_seen_at else None,
            'last_heartbeat_at': self.last_heartbeat_at.isoformat() if self.last_heartbeat_at else None,
            'stake': self.stake,
            'is_active': self.is_active,
            'performance_score': self.performance_score,
            'uptime_percentage': self.uptime_percentage,
            'average_response_time_ms': self.average_response_time_ms,
            'block_count': self.block_count,
            'transaction_count': self.transaction_count,
            'successful_votes': self.successful_votes,
            'failed_votes': self.failed_votes,
            'peer_count': self.peer_count,
            'max_peers': self.max_peers,
            'bandwidth_usage_mbps': self.bandwidth_usage_mbps,
            'version': self.version,
            'os_info': self.os_info,
            'cpu_cores': self.cpu_cores,
            'memory_gb': self.memory_gb,
            'disk_space_gb': self.disk_space_gb,
            'current_block_height': self.current_block_height,
            'sync_progress': self.sync_progress,
            'public_key': self.public_key,
            'quantum_signature_support': self.quantum_signature_support,
            'security_level': self.security_level,
            'country': self.country,
            'region': self.region,
            'latitude': self.latitude,
            'longitude': self.longitude,
            'metadata': self.metadata,
            'features': self.features,
            'reputation_score': self.reputation_score,
            'slash_count': self.slash_count,
            'reward_count': self.reward_count,
        }

    @classmethod
    def from_protobuf(cls, pb_node) -> 'NodeModel':
        """
        Create model instance from protobuf NodeInfo message
        """
        return cls(
            node_id=pb_node.node_id,
            address=pb_node.address,
            port=pb_node.port,
            type=NodeType(pb_node.type) if pb_node.type in [t.value for t in NodeType] else NodeType.FULL_NODE,
            stake=pb_node.stake,
            performance_score=pb_node.performance_score,
            is_active=pb_node.is_active,
        )

    def to_protobuf(self):
        """
        Convert model to protobuf NodeInfo message
        """
        from generated.aurigraph_pb2 import NodeInfo
        
        return NodeInfo(
            node_id=self.node_id,
            address=self.address,
            port=self.port,
            type=self.type.value if self.type else "full_node",
            stake=self.stake,
            performance_score=self.performance_score,
            is_active=self.is_active
        )

    def update_heartbeat(self):
        """
        Update last heartbeat timestamp
        """
        self.last_heartbeat_at = datetime.utcnow()
        self.last_seen_at = datetime.utcnow()

    def update_performance(self, new_score: float):
        """
        Update performance score with smoothing
        """
        # Apply exponential moving average for smoothing
        alpha = 0.1  # Smoothing factor
        self.performance_score = (alpha * new_score) + ((1 - alpha) * self.performance_score)

    def calculate_uptime(self) -> float:
        """
        Calculate uptime percentage
        """
        try:
            if not self.registered_at:
                return 0.0
            
            total_time = (datetime.utcnow() - self.registered_at).total_seconds()
            if total_time <= 0:
                return 0.0
            
            # This is a simplified calculation
            # In real implementation, track actual downtime events
            if self.is_active and self.status == NodeStatus.ACTIVE:
                # Assume 99% uptime for active nodes
                self.uptime_percentage = min(99.0, self.uptime_percentage + 0.1)
            else:
                # Reduce uptime for inactive nodes
                self.uptime_percentage = max(0.0, self.uptime_percentage - 1.0)
            
            return self.uptime_percentage
            
        except:
            return 0.0

    def add_successful_vote(self):
        """
        Record a successful vote
        """
        self.successful_votes += 1
        self.update_performance(min(1.0, self.performance_score + 0.01))

    def add_failed_vote(self):
        """
        Record a failed vote
        """
        self.failed_votes += 1
        self.update_performance(max(0.0, self.performance_score - 0.05))

    def add_slash(self, reason: str = None):
        """
        Apply slashing penalty
        """
        self.slash_count += 1
        self.reputation_score = max(0.0, self.reputation_score - 0.1)
        self.update_performance(max(0.0, self.performance_score - 0.2))
        
        if self.metadata is None:
            self.metadata = {}
        
        if 'slash_history' not in self.metadata:
            self.metadata['slash_history'] = []
        
        self.metadata['slash_history'].append({
            'timestamp': datetime.utcnow().isoformat(),
            'reason': reason or 'Unknown'
        })

    def add_reward(self, amount: int = 1):
        """
        Add reward and improve reputation
        """
        self.reward_count += amount
        self.reputation_score = min(2.0, self.reputation_score + 0.01)
        self.update_performance(min(1.0, self.performance_score + 0.005))

    def is_validator(self) -> bool:
        """
        Check if node is a validator
        """
        return self.type == NodeType.VALIDATOR

    def is_eligible_for_consensus(self) -> bool:
        """
        Check if node is eligible to participate in consensus
        """
        return (
            self.type == NodeType.VALIDATOR and
            self.is_active and
            self.status == NodeStatus.ACTIVE and
            self.stake >= 100000 and  # Minimum stake requirement
            self.performance_score >= 0.7 and  # Minimum performance
            self.slash_count < 5  # Not heavily slashed
        )

    def get_voting_power(self) -> float:
        """
        Calculate voting power based on stake and performance
        """
        try:
            if not self.is_eligible_for_consensus():
                return 0.0
            
            # Base power from stake
            base_power = min(1.0, self.stake / 1000000)  # Normalize to 1M stake
            
            # Performance multiplier
            performance_multiplier = max(0.5, self.performance_score)
            
            # Reputation multiplier
            reputation_multiplier = max(0.5, self.reputation_score)
            
            return base_power * performance_multiplier * reputation_multiplier
            
        except:
            return 0.0

    def is_healthy(self) -> bool:
        """
        Check if node is healthy
        """
        return (
            self.is_active and
            self.status in [NodeStatus.ACTIVE, NodeStatus.SYNCING] and
            self.performance_score >= 0.5 and
            self.last_seen_at and
            (datetime.utcnow() - self.last_seen_at).total_seconds() < 300  # Seen within 5 minutes
        )