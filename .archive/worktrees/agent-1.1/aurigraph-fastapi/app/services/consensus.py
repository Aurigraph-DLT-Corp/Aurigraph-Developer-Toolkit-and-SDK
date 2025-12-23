"""
HyperRAFT++ Consensus Engine
Advanced consensus mechanism for high-throughput blockchain
"""

import asyncio
import logging
import time
import random
from typing import Dict, List, Any, Optional, Set
from enum import Enum
from dataclasses import dataclass
from collections import defaultdict

from app.models.block import BlockModel, BlockStatus
from app.models.node import NodeModel, NodeType, NodeStatus
from app.models.base import AsyncSessionLocal
from generated.aurigraph_pb2 import Block, VoteRequest
from app.core.config import settings

logger = logging.getLogger(__name__)


class ConsensusState(Enum):
    """Consensus state enumeration"""
    FOLLOWER = "follower"
    CANDIDATE = "candidate" 
    LEADER = "leader"
    OBSERVER = "observer"


@dataclass
class ConsensusRound:
    """Consensus round information"""
    round_number: int
    leader: str
    proposed_block: Optional[BlockModel]
    votes: Dict[str, bool]
    start_time: float
    timeout: float


class ConsensusEngine:
    """
    HyperRAFT++ Consensus Engine
    Implements advanced Byzantine fault-tolerant consensus
    """
    
    def __init__(self, node_id: str, validators: List[str], quantum_crypto=None):
        self.node_id = node_id
        self.validators = set(validators)
        self.quantum_crypto = quantum_crypto
        self.initialized = False
        self.running = False
        
        # Consensus state
        self.state = ConsensusState.FOLLOWER
        self.current_term = 1
        self.voted_for: Optional[str] = None
        self.leader: Optional[str] = None
        self.current_round: Optional[ConsensusRound] = None
        
        # Performance parameters
        self.election_timeout_ms = settings.ELECTION_TIMEOUT_MS
        self.heartbeat_interval_ms = settings.HEARTBEAT_INTERVAL_MS
        self.finality_ms = settings.FINALITY_MS
        
        # Block and transaction management
        self.pending_blocks: Dict[str, BlockModel] = {}
        self.confirmed_blocks: Dict[int, BlockModel] = {}
        self.last_block_height = 0
        self.block_proposal_queue = asyncio.Queue()
        
        # Validator management
        self.active_validators: Set[str] = set()
        self.validator_performance: Dict[str, float] = {}
        self.validator_stakes: Dict[str, int] = {}
        
        # Performance metrics
        self.rounds_completed = 0
        self.blocks_processed = 0
        self.average_finality_time = 0.0
        self.consensus_health = 1.0
        
        # Timing and timeouts
        self.last_heartbeat = time.time()
        self.election_deadline: Optional[float] = None
        
        logger.info(f"ConsensusEngine initialized for node {node_id}")
        
    async def initialize(self) -> None:
        """
        Initialize the consensus engine
        """
        try:
            if self.initialized:
                return
                
            logger.info("Initializing consensus engine...")
            
            # Load validator information
            await self._load_validators()
            
            # Initialize consensus state
            await self._initialize_consensus_state()
            
            # Start background tasks
            asyncio.create_task(self._consensus_loop())
            asyncio.create_task(self._heartbeat_loop())
            asyncio.create_task(self._block_proposal_loop())
            asyncio.create_task(self._health_monitor())
            
            self.initialized = True
            self.running = True
            
            logger.info(f"Consensus engine initialized successfully")
            logger.info(f"Node state: {self.state.value}, Term: {self.current_term}")
            logger.info(f"Active validators: {len(self.active_validators)}")
            
        except Exception as e:
            logger.error(f"Failed to initialize consensus engine: {e}")
            raise
    
    async def stop(self) -> None:
        """
        Stop the consensus engine
        """
        self.running = False
        logger.info("Consensus engine stopped")
    
    async def propose_block(self, block: Block) -> Dict[str, Any]:
        """
        Propose a new block for consensus
        """
        try:
            if self.state != ConsensusState.LEADER:
                return {
                    'accepted': False,
                    'message': f'Only leader can propose blocks. Current leader: {self.leader}'
                }
            
            # Convert to model
            block_model = BlockModel.from_protobuf(block)
            block_model.status = BlockStatus.PROPOSED
            
            # Validate block
            if not await self._validate_block(block_model):
                return {
                    'accepted': False,
                    'message': 'Block validation failed'
                }
            
            # Start consensus round
            round_info = ConsensusRound(
                round_number=self.current_term,
                leader=self.node_id,
                proposed_block=block_model,
                votes={},
                start_time=time.time(),
                timeout=time.time() + (self.election_timeout_ms / 1000.0)
            )
            
            self.current_round = round_info
            self.pending_blocks[block_model.hash] = block_model
            
            # Add to processing queue
            await self.block_proposal_queue.put(block_model)
            
            logger.info(f"Block proposed: {block_model.hash} (height {block_model.height})")
            
            return {
                'accepted': True,
                'message': 'Block proposal accepted',
                'block_hash': block_model.hash,
                'round': self.current_term
            }
            
        except Exception as e:
            logger.error(f"Error proposing block: {e}")
            return {
                'accepted': False,
                'message': f'Block proposal error: {str(e)}'
            }
    
    async def process_vote(self, vote: VoteRequest) -> Dict[str, Any]:
        """
        Process a vote from a validator
        """
        try:
            # Validate voter
            if vote.voter_id not in self.active_validators:
                return {
                    'accepted': False,
                    'message': f'Invalid voter: {vote.voter_id}'
                }
            
            # Check if block exists
            if vote.block_hash not in self.pending_blocks:
                return {
                    'accepted': False,
                    'message': f'Block not found: {vote.block_hash}'
                }
            
            # Verify signature (mock)
            if not await self._verify_vote_signature(vote):
                return {
                    'accepted': False,
                    'message': 'Invalid vote signature'
                }
            
            # Record vote
            if self.current_round and self.current_round.proposed_block:
                if self.current_round.proposed_block.hash == vote.block_hash:
                    self.current_round.votes[vote.voter_id] = vote.approve
                    
                    # Update block votes
                    block = self.pending_blocks[vote.block_hash]
                    block.add_vote(vote.voter_id, vote.approve)
                    
                    logger.debug(f"Vote recorded: {vote.voter_id} -> {vote.approve} for {vote.block_hash}")
                    
                    # Check if consensus achieved
                    if await self._check_consensus(block):
                        await self._finalize_block(block)
            
            return {
                'accepted': True,
                'message': 'Vote accepted'
            }
            
        except Exception as e:
            logger.error(f"Error processing vote: {e}")
            return {
                'accepted': False,
                'message': f'Vote processing error: {str(e)}'
            }
    
    async def get_status(self) -> Dict[str, Any]:
        """
        Get current consensus status
        """
        try:
            return {
                'round': str(self.current_term),
                'state': self.state.value,
                'leader': self.leader or 'No leader',
                'active_validators': len(self.active_validators),
                'health': self.consensus_health,
                'blocks_processed': self.blocks_processed,
                'average_finality_ms': self.average_finality_time,
                'last_block_height': self.last_block_height
            }
        except Exception as e:
            logger.error(f"Error getting consensus status: {e}")
            return {
                'round': '0',
                'state': 'error',
                'leader': 'Unknown',
                'active_validators': 0,
                'health': 0.0
            }
    
    async def _load_validators(self):
        """
        Load validator information from database
        """
        try:
            async with AsyncSessionLocal() as session:
                from sqlalchemy import select
                
                stmt = select(NodeModel).where(
                    NodeModel.type == NodeType.VALIDATOR,
                    NodeModel.is_active == True
                )
                
                result = await session.execute(stmt)
                validators = result.scalars().all()
                
                for validator in validators:
                    self.active_validators.add(validator.node_id)
                    self.validator_performance[validator.node_id] = validator.performance_score
                    self.validator_stakes[validator.node_id] = validator.stake
                
                logger.info(f"Loaded {len(validators)} active validators")
                
        except Exception as e:
            logger.error(f"Error loading validators: {e}")
            # Fallback to configured validators
            self.active_validators = self.validators.copy()
            for validator in self.active_validators:
                self.validator_performance[validator] = 1.0
                self.validator_stakes[validator] = 1000000
    
    async def _initialize_consensus_state(self):
        """
        Initialize consensus state
        """
        try:
            # Determine initial state
            if self.node_id in self.active_validators:
                if len(self.active_validators) == 1:
                    # Single validator - become leader immediately
                    self.state = ConsensusState.LEADER
                    self.leader = self.node_id
                else:
                    # Multi-validator - start as follower
                    self.state = ConsensusState.FOLLOWER
                    
                    # Simple leader election - node with highest stake becomes leader
                    leader_candidate = max(
                        self.active_validators,
                        key=lambda v: self.validator_stakes.get(v, 0)
                    )
                    
                    if leader_candidate == self.node_id:
                        await self._become_leader()
                    else:
                        self.leader = leader_candidate
            else:
                # Not a validator - become observer
                self.state = ConsensusState.OBSERVER
                
            logger.info(f"Initial consensus state: {self.state.value}, Leader: {self.leader}")
            
        except Exception as e:
            logger.error(f"Error initializing consensus state: {e}")
            self.state = ConsensusState.FOLLOWER
    
    async def _consensus_loop(self):
        """
        Main consensus loop
        """
        while self.running:
            try:
                if self.state == ConsensusState.LEADER:
                    await self._leader_loop()
                elif self.state == ConsensusState.FOLLOWER:
                    await self._follower_loop()
                elif self.state == ConsensusState.CANDIDATE:
                    await self._candidate_loop()
                
                await asyncio.sleep(0.01)  # Small delay to prevent busy waiting
                
            except Exception as e:
                logger.error(f"Error in consensus loop: {e}")
                await asyncio.sleep(1.0)
    
    async def _leader_loop(self):
        """
        Leader-specific consensus logic
        """
        try:
            current_time = time.time()
            
            # Check if we should propose a new block
            if not self.current_round or (current_time - self.current_round.start_time) > 1.0:
                await self._propose_next_block()
            
            # Monitor consensus progress
            if self.current_round:
                # Check for timeout
                if current_time > self.current_round.timeout:
                    logger.warning("Consensus round timed out, starting new round")
                    await self._start_new_round()
                
                # Process any pending votes
                await self._process_pending_votes()
            
        except Exception as e:
            logger.error(f"Error in leader loop: {e}")
    
    async def _follower_loop(self):
        """
        Follower-specific consensus logic
        """
        try:
            current_time = time.time()
            
            # Check for leader timeout
            if (current_time - self.last_heartbeat) > (self.election_timeout_ms / 1000.0):
                logger.warning("Leader timeout, starting election")
                await self._start_election()
            
        except Exception as e:
            logger.error(f"Error in follower loop: {e}")
    
    async def _candidate_loop(self):
        """
        Candidate-specific consensus logic (election)
        """
        try:
            # Simple election - become leader if no other candidates
            await asyncio.sleep(0.1)
            await self._become_leader()
            
        except Exception as e:
            logger.error(f"Error in candidate loop: {e}")
    
    async def _heartbeat_loop(self):
        """
        Send heartbeats if leader
        """
        while self.running:
            try:
                if self.state == ConsensusState.LEADER:
                    # Send heartbeat to followers
                    self.last_heartbeat = time.time()
                    logger.debug("Heartbeat sent")
                
                await asyncio.sleep(self.heartbeat_interval_ms / 1000.0)
                
            except Exception as e:
                logger.error(f"Error in heartbeat loop: {e}")
                await asyncio.sleep(1.0)
    
    async def _block_proposal_loop(self):
        """
        Process block proposals
        """
        while self.running:
            try:
                # Wait for block proposal
                block = await asyncio.wait_for(
                    self.block_proposal_queue.get(),
                    timeout=1.0
                )
                
                if self.state == ConsensusState.LEADER:
                    await self._broadcast_block_proposal(block)
                
            except asyncio.TimeoutError:
                continue
            except Exception as e:
                logger.error(f"Error in block proposal loop: {e}")
                await asyncio.sleep(1.0)
    
    async def _health_monitor(self):
        """
        Monitor consensus health
        """
        while self.running:
            try:
                # Calculate consensus health
                active_ratio = len(self.active_validators) / max(1, len(self.validators))
                performance_avg = sum(self.validator_performance.values()) / max(1, len(self.validator_performance))
                
                self.consensus_health = min(1.0, (active_ratio + performance_avg) / 2)
                
                # Log health status
                if self.consensus_health < 0.7:
                    logger.warning(f"Consensus health degraded: {self.consensus_health:.2f}")
                
                await asyncio.sleep(30.0)  # Check every 30 seconds
                
            except Exception as e:
                logger.error(f"Error in health monitor: {e}")
                await asyncio.sleep(60.0)
    
    async def _validate_block(self, block: BlockModel) -> bool:
        """
        Validate a proposed block
        """
        try:
            if not block.is_valid():
                return False
            
            # Check block height
            if block.height != self.last_block_height + 1:
                logger.warning(f"Invalid block height: {block.height}, expected: {self.last_block_height + 1}")
                return False
            
            # Check previous hash
            if self.last_block_height > 0:
                last_block = self.confirmed_blocks.get(self.last_block_height)
                if last_block and block.previous_hash != last_block.hash:
                    logger.warning(f"Invalid previous hash")
                    return False
            
            # Additional validation checks can be added here
            # - Transaction validation
            # - Signature verification
            # - Stake verification
            
            return True
            
        except Exception as e:
            logger.error(f"Error validating block: {e}")
            return False
    
    async def _verify_vote_signature(self, vote: VoteRequest) -> bool:
        """
        Verify vote signature (mock implementation)
        """
        # Mock signature verification
        await asyncio.sleep(0.001)
        return True
    
    async def _check_consensus(self, block: BlockModel) -> bool:
        """
        Check if block has achieved consensus
        """
        try:
            required_votes = (len(self.active_validators) * 2) // 3 + 1
            return block.has_consensus(len(self.active_validators))
            
        except Exception as e:
            logger.error(f"Error checking consensus: {e}")
            return False
    
    async def _finalize_block(self, block: BlockModel):
        """
        Finalize a block that achieved consensus
        """
        try:
            start_time = time.time()
            
            # Update block status
            block.status = BlockStatus.FINALIZED
            block.finalized_at = time.time()
            
            # Calculate finality time
            if self.current_round:
                finality_time = (time.time() - self.current_round.start_time) * 1000
                block.finality_time_ms = finality_time
                
                # Update average finality time
                self.average_finality_time = (
                    (self.average_finality_time * self.blocks_processed + finality_time) /
                    (self.blocks_processed + 1)
                )
            
            # Store in confirmed blocks
            self.confirmed_blocks[block.height] = block
            self.last_block_height = block.height
            
            # Remove from pending
            if block.hash in self.pending_blocks:
                del self.pending_blocks[block.hash]
            
            # Update metrics
            self.blocks_processed += 1
            self.rounds_completed += 1
            
            logger.info(f"Block finalized: {block.hash} (height {block.height}, {block.finality_time_ms:.1f}ms)")
            
            # Start new round
            await self._start_new_round()
            
        except Exception as e:
            logger.error(f"Error finalizing block: {e}")
    
    async def _propose_next_block(self):
        """
        Propose the next block in sequence
        """
        try:
            # Create mock block for demonstration
            from generated.aurigraph_pb2 import Block, ConsensusData
            
            next_height = self.last_block_height + 1
            previous_hash = (
                self.confirmed_blocks[self.last_block_height].hash
                if self.last_block_height > 0
                else "genesis"
            )
            
            consensus_data = ConsensusData(
                algorithm="HyperRAFT++",
                round=self.current_term,
                validators=list(self.active_validators),
                votes={},
                confidence_score=0.0
            )
            
            block = Block(
                height=next_height,
                hash=f"block_{next_height}_{int(time.time())}",
                previous_hash=previous_hash,
                timestamp=int(time.time() * 1000),
                validator=self.node_id,
                signature=b"mock_signature",
                consensus_data=consensus_data,
                transactions=[]  # Empty for mock
            )
            
            await self.propose_block(block)
            
        except Exception as e:
            logger.error(f"Error proposing next block: {e}")
    
    async def _broadcast_block_proposal(self, block: BlockModel):
        """
        Broadcast block proposal to validators
        """
        try:
            # Mock broadcast - in real implementation, send to other nodes
            logger.debug(f"Broadcasting block proposal: {block.hash}")
            
            # Simulate receiving votes from other validators
            await self._simulate_validator_votes(block)
            
        except Exception as e:
            logger.error(f"Error broadcasting block proposal: {e}")
    
    async def _simulate_validator_votes(self, block: BlockModel):
        """
        Simulate votes from other validators (for demo)
        """
        try:
            if len(self.active_validators) == 1:
                # Single validator - auto-approve
                block.add_vote(self.node_id, True)
                await self._finalize_block(block)
                return
            
            # Simulate votes from other validators
            for validator in self.active_validators:
                if validator != self.node_id:
                    # Mock vote (90% approval rate)
                    approve = random.random() < 0.9
                    block.add_vote(validator, approve)
                    
                    if await self._check_consensus(block):
                        await self._finalize_block(block)
                        break
            
        except Exception as e:
            logger.error(f"Error simulating validator votes: {e}")
    
    async def _become_leader(self):
        """
        Transition to leader state
        """
        self.state = ConsensusState.LEADER
        self.leader = self.node_id
        self.current_term += 1
        logger.info(f"Became leader for term {self.current_term}")
    
    async def _start_election(self):
        """
        Start leader election
        """
        self.state = ConsensusState.CANDIDATE
        self.current_term += 1
        self.voted_for = self.node_id
        logger.info(f"Starting election for term {self.current_term}")
    
    async def _start_new_round(self):
        """
        Start a new consensus round
        """
        self.current_round = None
        logger.debug("Started new consensus round")
    
    async def _process_pending_votes(self):
        """
        Process any pending votes
        """
        # This would process votes received from the network
        # For now, it's handled in simulate_validator_votes
        pass
    
    def get_stats(self) -> Dict[str, Any]:
        """
        Get consensus statistics
        """
        uptime = time.time() - (time.time() - 3600)  # Mock uptime
        
        return {
            'initialized': self.initialized,
            'running': self.running,
            'state': self.state.value,
            'current_term': self.current_term,
            'leader': self.leader,
            'active_validators': len(self.active_validators),
            'blocks_processed': self.blocks_processed,
            'rounds_completed': self.rounds_completed,
            'average_finality_ms': self.average_finality_time,
            'consensus_health': self.consensus_health,
            'pending_blocks': len(self.pending_blocks),
            'confirmed_blocks': len(self.confirmed_blocks),
            'last_block_height': self.last_block_height,
        }