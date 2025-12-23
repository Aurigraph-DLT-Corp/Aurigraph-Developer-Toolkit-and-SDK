"""
Consensus Service gRPC implementation
Handles HyperRAFT++ consensus operations with Protocol Buffers
"""

import asyncio
import logging
from typing import AsyncIterator, Dict, Any
import grpc
from datetime import datetime

from generated.aurigraph_pb2 import (
    Block, VoteRequest, VoteResponse, ConsensusResponse,
    ConsensusStatus, ConsensusEvent, Empty
)
from generated.aurigraph_pb2_grpc import ConsensusServiceServicer

logger = logging.getLogger(__name__)


class ConsensusServiceImpl(ConsensusServiceServicer):
    """
    HyperRAFT++ consensus service implementation
    Handles block proposals, voting, and consensus events
    """
    
    def __init__(self, consensus_engine=None):
        self.consensus_engine = consensus_engine
        self.current_round = 1
        self.current_leader = "aurigraph-primary"
        self.active_validators = ["aurigraph-primary", "validator-2", "validator-3"]
        self.consensus_events = []
        self.proposed_blocks = {}
        self.votes = {}
        
    async def ProposeBlock(
        self,
        request: Block,
        context: grpc.aio.ServicerContext
    ) -> ConsensusResponse:
        """
        Propose a new block for consensus
        """
        try:
            logger.info(f"Block proposal received: height {request.height}, hash {request.hash}")
            
            # Validate block structure
            if not self._validate_block(request):
                return ConsensusResponse(
                    accepted=False,
                    block_hash=request.hash,
                    message="Block validation failed"
                )
            
            # Check if this node is the current leader
            if request.validator != self.current_leader:
                return ConsensusResponse(
                    accepted=False,
                    block_hash=request.hash,
                    message=f"Only leader {self.current_leader} can propose blocks"
                )
            
            # Process block proposal
            if self.consensus_engine:
                result = await self.consensus_engine.propose_block(request)
                accepted = result.get('accepted', False)
                message = result.get('message', 'Processed by consensus engine')
            else:
                # Mock consensus logic
                accepted = True
                message = "Block proposal accepted"
                self.proposed_blocks[request.hash] = request
                
                # Generate consensus event
                event = ConsensusEvent(
                    type="block_proposed",
                    timestamp=int(datetime.now().timestamp() * 1000),
                    data={
                        "block_hash": request.hash,
                        "height": str(request.height),
                        "validator": request.validator,
                        "tx_count": str(len(request.transactions))
                    }
                )
                self.consensus_events.append(event)
            
            logger.info(f"Block proposal result: {accepted}, {message}")
            
            return ConsensusResponse(
                accepted=accepted,
                block_hash=request.hash,
                message=message
            )
            
        except Exception as e:
            logger.error(f"Error processing block proposal: {e}")
            return ConsensusResponse(
                accepted=False,
                block_hash=request.hash if request.hash else "",
                message=f"Proposal error: {str(e)}"
            )
    
    async def VoteOnBlock(
        self,
        request: VoteRequest,
        context: grpc.aio.ServicerContext
    ) -> VoteResponse:
        """
        Vote on a proposed block
        """
        try:
            logger.debug(f"Vote received: {request.voter_id} -> {request.approve} for {request.block_hash}")
            
            # Validate voter
            if request.voter_id not in self.active_validators:
                return VoteResponse(
                    accepted=False,
                    message=f"Invalid voter: {request.voter_id}"
                )
            
            # Validate block exists
            if request.block_hash not in self.proposed_blocks:
                return VoteResponse(
                    accepted=False,
                    message=f"Block not found: {request.block_hash}"
                )
            
            # Process vote
            if self.consensus_engine:
                result = await self.consensus_engine.process_vote(request)
                accepted = result.get('accepted', False)
                message = result.get('message', 'Vote processed')
            else:
                # Mock voting logic
                if request.block_hash not in self.votes:
                    self.votes[request.block_hash] = {}
                
                self.votes[request.block_hash][request.voter_id] = request.approve
                accepted = True
                message = "Vote recorded"
                
                # Check if we have consensus (2/3 majority)
                votes = self.votes[request.block_hash]
                if len(votes) >= len(self.active_validators) * 2 // 3 + 1:
                    approve_count = sum(1 for v in votes.values() if v)
                    if approve_count >= len(self.active_validators) * 2 // 3 + 1:
                        # Block accepted
                        event = ConsensusEvent(
                            type="block_accepted",
                            timestamp=int(datetime.now().timestamp() * 1000),
                            data={
                                "block_hash": request.block_hash,
                                "votes": str(len(votes)),
                                "approved": str(approve_count)
                            }
                        )
                        self.consensus_events.append(event)
            
            return VoteResponse(
                accepted=accepted,
                message=message
            )
            
        except Exception as e:
            logger.error(f"Error processing vote: {e}")
            return VoteResponse(
                accepted=False,
                message=f"Vote error: {str(e)}"
            )
    
    async def GetConsensusStatus(
        self,
        request: Empty,
        context: grpc.aio.ServicerContext
    ) -> ConsensusStatus:
        """
        Get current consensus status
        """
        try:
            if self.consensus_engine:
                status = await self.consensus_engine.get_status()
                return ConsensusStatus(
                    current_round=status.get('round', str(self.current_round)),
                    leader=status.get('leader', self.current_leader),
                    active_validators=status.get('active_validators', len(self.active_validators)),
                    consensus_health=status.get('health', 1.0)
                )
            else:
                # Mock status
                health = self._calculate_consensus_health()
                return ConsensusStatus(
                    current_round=str(self.current_round),
                    leader=self.current_leader,
                    active_validators=len(self.active_validators),
                    consensus_health=health
                )
                
        except Exception as e:
            logger.error(f"Error getting consensus status: {e}")
            return ConsensusStatus(
                current_round=str(self.current_round),
                leader=self.current_leader,
                active_validators=0,
                consensus_health=0.0
            )
    
    async def StreamConsensusEvents(
        self,
        request: Empty,
        context: grpc.aio.ServicerContext
    ) -> AsyncIterator[ConsensusEvent]:
        """
        Stream consensus events in real-time
        """
        try:
            logger.info("Starting consensus event stream")
            
            # Send existing events first
            for event in self.consensus_events:
                yield event
                await asyncio.sleep(0.001)
            
            # Stream new events as they happen
            last_event_count = len(self.consensus_events)
            
            while not context.cancelled():
                # Check for new events
                if len(self.consensus_events) > last_event_count:
                    for event in self.consensus_events[last_event_count:]:
                        yield event
                    last_event_count = len(self.consensus_events)
                
                # Generate periodic status events for demo
                if self.consensus_engine is None:
                    event = ConsensusEvent(
                        type="heartbeat",
                        timestamp=int(datetime.now().timestamp() * 1000),
                        data={
                            "round": str(self.current_round),
                            "leader": self.current_leader,
                            "validators": str(len(self.active_validators))
                        }
                    )
                    yield event
                    self.current_round += 1
                
                await asyncio.sleep(5.0)  # Send updates every 5 seconds
                
        except Exception as e:
            logger.error(f"Error in consensus event stream: {e}")
            await context.abort(grpc.StatusCode.INTERNAL, "Stream error")
    
    def _validate_block(self, block: Block) -> bool:
        """
        Validate block structure and content
        """
        try:
            if not block.hash:
                return False
            if block.height <= 0:
                return False
            if not block.previous_hash and block.height > 1:
                return False
            if not block.validator:
                return False
            if block.timestamp <= 0:
                return False
            
            # Validate transactions
            for tx in block.transactions:
                if not tx.id or not tx.from_address or not tx.to_address:
                    return False
            
            return True
            
        except Exception as e:
            logger.error(f"Block validation error: {e}")
            return False
    
    def _calculate_consensus_health(self) -> float:
        """
        Calculate consensus health score (0.0 - 1.0)
        """
        try:
            # Simple health calculation based on active validators
            if len(self.active_validators) >= 3:
                return 1.0
            elif len(self.active_validators) >= 2:
                return 0.7
            elif len(self.active_validators) >= 1:
                return 0.3
            else:
                return 0.0
        except:
            return 0.0
    
    def get_stats(self) -> dict:
        """
        Get consensus statistics
        """
        return {
            "current_round": self.current_round,
            "leader": self.current_leader,
            "active_validators": len(self.active_validators),
            "proposed_blocks": len(self.proposed_blocks),
            "consensus_events": len(self.consensus_events),
            "total_votes": sum(len(votes) for votes in self.votes.values())
        }