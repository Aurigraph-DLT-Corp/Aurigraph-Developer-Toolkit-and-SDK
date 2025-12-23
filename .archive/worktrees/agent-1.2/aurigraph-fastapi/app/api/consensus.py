"""
Consensus API endpoints
"""

import logging
from typing import Dict, Any, List, Optional
from fastapi import APIRouter, HTTPException, Request
from pydantic import BaseModel, Field
from datetime import datetime

logger = logging.getLogger(__name__)

router = APIRouter()


class BlockProposal(BaseModel):
    """Block proposal model"""
    height: int = Field(..., gt=0, description="Block height")
    previous_hash: str = Field(..., description="Previous block hash")
    transactions: List[str] = Field(default=[], description="Transaction IDs to include")
    validator: Optional[str] = Field(default=None, description="Validator node ID")


class VoteRequest(BaseModel):
    """Vote request model"""
    block_hash: str = Field(..., description="Block hash to vote on")
    approve: bool = Field(..., description="Approve or reject the block")
    voter_id: str = Field(..., description="Validator ID")
    signature: Optional[str] = Field(default=None, description="Vote signature")


@router.get("/status", summary="Consensus Status")
async def consensus_status(request: Request) -> Dict[str, Any]:
    """
    Get current consensus status
    """
    try:
        if hasattr(request.app.state, 'consensus_engine'):
            status = await request.app.state.consensus_engine.get_status()
            
            return {
                "status": "operational",
                "current_round": status.get('round'),
                "state": status.get('state', 'unknown'),
                "leader": status.get('leader'),
                "active_validators": status.get('active_validators'),
                "consensus_health": status.get('health'),
                "blocks_processed": status.get('blocks_processed'),
                "average_finality_ms": status.get('average_finality_ms'),
                "last_block_height": status.get('last_block_height'),
                "algorithm": "HyperRAFT++",
                "timestamp": datetime.utcnow().isoformat() + "Z"
            }
        else:
            # Mock consensus status
            return {
                "status": "operational",
                "current_round": "15",
                "state": "leader",
                "leader": "aurigraph-primary",
                "active_validators": 3,
                "consensus_health": 0.95,
                "blocks_processed": 1250,
                "average_finality_ms": 95.2,
                "last_block_height": 1250,
                "algorithm": "HyperRAFT++",
                "timestamp": datetime.utcnow().isoformat() + "Z",
                "mock": True
            }
        
    except Exception as e:
        logger.error(f"Error getting consensus status: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to get consensus status: {str(e)}")


@router.post("/propose", summary="Propose Block")
async def propose_block(proposal: BlockProposal, request: Request) -> Dict[str, Any]:
    """
    Propose a new block for consensus
    """
    try:
        if hasattr(request.app.state, 'consensus_engine'):
            # Create protobuf block
            from generated.aurigraph_pb2 import Block, ConsensusData
            
            # Generate block hash
            import hashlib
            block_data = f"{proposal.height}_{proposal.previous_hash}_{len(proposal.transactions)}"
            block_hash = hashlib.sha256(block_data.encode()).hexdigest()
            
            consensus_data = ConsensusData(
                algorithm="HyperRAFT++",
                round=1,
                validators=["aurigraph-primary", "validator-2", "validator-3"],
                votes={},
                confidence_score=0.0
            )
            
            pb_block = Block(
                height=proposal.height,
                hash=block_hash,
                previous_hash=proposal.previous_hash,
                timestamp=int(datetime.utcnow().timestamp() * 1000),
                validator=proposal.validator or "aurigraph-primary",
                signature=b"mock_signature",
                consensus_data=consensus_data,
                transactions=[]  # Simplified for API
            )
            
            # Propose block
            result = await request.app.state.consensus_engine.propose_block(pb_block)
            
            return {
                "success": result.get('accepted', False),
                "block_hash": block_hash,
                "message": result.get('message'),
                "round": result.get('round'),
                "height": proposal.height,
                "timestamp": datetime.utcnow().isoformat() + "Z"
            }
        else:
            # Mock response
            import hashlib
            block_data = f"{proposal.height}_{proposal.previous_hash}_{len(proposal.transactions)}"
            block_hash = hashlib.sha256(block_data.encode()).hexdigest()
            
            return {
                "success": True,
                "block_hash": block_hash,
                "message": "Block proposal accepted (mock mode)",
                "round": 15,
                "height": proposal.height,
                "timestamp": datetime.utcnow().isoformat() + "Z",
                "mock": True
            }
        
    except Exception as e:
        logger.error(f"Error proposing block: {e}")
        raise HTTPException(status_code=500, detail=f"Block proposal failed: {str(e)}")


@router.post("/vote", summary="Vote on Block")
async def vote_on_block(vote: VoteRequest, request: Request) -> Dict[str, Any]:
    """
    Vote on a proposed block
    """
    try:
        if hasattr(request.app.state, 'consensus_engine'):
            # Create protobuf vote
            from generated.aurigraph_pb2 import VoteRequest as PBVoteRequest
            
            pb_vote = PBVoteRequest(
                block_hash=vote.block_hash,
                approve=vote.approve,
                voter_id=vote.voter_id,
                signature=vote.signature.encode() if vote.signature else b""
            )
            
            # Process vote
            result = await request.app.state.consensus_engine.process_vote(pb_vote)
            
            return {
                "success": result.get('accepted', False),
                "message": result.get('message'),
                "block_hash": vote.block_hash,
                "voter": vote.voter_id,
                "approved": vote.approve,
                "timestamp": datetime.utcnow().isoformat() + "Z"
            }
        else:
            # Mock response
            return {
                "success": True,
                "message": "Vote recorded (mock mode)",
                "block_hash": vote.block_hash,
                "voter": vote.voter_id,
                "approved": vote.approve,
                "timestamp": datetime.utcnow().isoformat() + "Z",
                "mock": True
            }
        
    except Exception as e:
        logger.error(f"Error processing vote: {e}")
        raise HTTPException(status_code=500, detail=f"Vote processing failed: {str(e)}")


@router.get("/validators", summary="List Validators")
async def list_validators(request: Request) -> Dict[str, Any]:
    """
    List active validators
    """
    try:
        if hasattr(request.app.state, 'consensus_engine'):
            stats = request.app.state.consensus_engine.get_stats()
            active_validators = stats.get('active_validators', 0)
            
            # Mock validator list based on stats
            validators = [
                {
                    "node_id": "aurigraph-primary",
                    "status": "active",
                    "stake": 1000000,
                    "performance_score": 0.95,
                    "is_leader": stats.get('leader') == "aurigraph-primary"
                },
                {
                    "node_id": "validator-2",
                    "status": "active",
                    "stake": 800000,
                    "performance_score": 0.92,
                    "is_leader": stats.get('leader') == "validator-2"
                },
                {
                    "node_id": "validator-3",
                    "status": "active",
                    "stake": 750000,
                    "performance_score": 0.89,
                    "is_leader": stats.get('leader') == "validator-3"
                }
            ]
            
            return {
                "validators": validators[:active_validators] if active_validators else validators,
                "total_validators": active_validators or len(validators),
                "current_leader": stats.get('leader'),
                "algorithm": "HyperRAFT++",
                "timestamp": datetime.utcnow().isoformat() + "Z"
            }
        else:
            # Mock validator list
            validators = [
                {
                    "node_id": "aurigraph-primary",
                    "status": "active",
                    "stake": 1000000,
                    "performance_score": 0.95,
                    "is_leader": True
                },
                {
                    "node_id": "validator-2",
                    "status": "active",
                    "stake": 800000,
                    "performance_score": 0.92,
                    "is_leader": False
                },
                {
                    "node_id": "validator-3",
                    "status": "active",
                    "stake": 750000,
                    "performance_score": 0.89,
                    "is_leader": False
                }
            ]
            
            return {
                "validators": validators,
                "total_validators": len(validators),
                "current_leader": "aurigraph-primary",
                "algorithm": "HyperRAFT++",
                "timestamp": datetime.utcnow().isoformat() + "Z",
                "mock": True
            }
        
    except Exception as e:
        logger.error(f"Error listing validators: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to list validators: {str(e)}")


@router.get("/rounds", summary="Recent Consensus Rounds")
async def recent_rounds(request: Request, limit: int = 10) -> Dict[str, Any]:
    """
    Get recent consensus rounds information
    """
    try:
        if limit > 100:
            limit = 100
        
        if hasattr(request.app.state, 'consensus_engine'):
            stats = request.app.state.consensus_engine.get_stats()
            current_round = stats.get('current_term', 1)
            
            # Generate mock rounds based on current round
            rounds = []
            for i in range(min(limit, current_round)):
                round_num = current_round - i
                rounds.append({
                    "round": round_num,
                    "leader": "aurigraph-primary" if round_num % 3 == 1 else f"validator-{(round_num % 3) + 1}",
                    "status": "completed",
                    "block_height": round_num * 10,  # Mock: 10 blocks per round
                    "duration_ms": 95.0 + (i * 2),  # Mock varying durations
                    "votes_received": 3,
                    "consensus_achieved": True,
                    "timestamp": int(datetime.utcnow().timestamp() * 1000) - (i * 1000)
                })
            
            return {
                "rounds": rounds,
                "current_round": current_round,
                "total_rounds": stats.get('rounds_completed', current_round),
                "limit": limit,
                "timestamp": datetime.utcnow().isoformat() + "Z"
            }
        else:
            # Mock rounds
            rounds = []
            for i in range(limit):
                round_num = 15 - i
                rounds.append({
                    "round": round_num,
                    "leader": "aurigraph-primary" if round_num % 3 == 1 else f"validator-{(round_num % 3) + 1}",
                    "status": "completed",
                    "block_height": round_num * 10,
                    "duration_ms": 95.0 + (i * 2),
                    "votes_received": 3,
                    "consensus_achieved": True,
                    "timestamp": int(datetime.utcnow().timestamp() * 1000) - (i * 1000)
                })
            
            return {
                "rounds": rounds,
                "current_round": 15,
                "total_rounds": 15,
                "limit": limit,
                "timestamp": datetime.utcnow().isoformat() + "Z",
                "mock": True
            }
        
    except Exception as e:
        logger.error(f"Error getting recent rounds: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to get recent rounds: {str(e)}")


@router.get("/stats", summary="Consensus Statistics")
async def consensus_statistics(request: Request) -> Dict[str, Any]:
    """
    Get detailed consensus statistics
    """
    try:
        if hasattr(request.app.state, 'consensus_engine'):
            stats = request.app.state.consensus_engine.get_stats()
            
            return {
                "algorithm": "HyperRAFT++",
                "current_term": stats.get('current_term', 0),
                "state": stats.get('state', 'unknown'),
                "leader": stats.get('leader'),
                "active_validators": stats.get('active_validators', 0),
                "blocks_processed": stats.get('blocks_processed', 0),
                "rounds_completed": stats.get('rounds_completed', 0),
                "average_finality_ms": stats.get('average_finality_ms', 0.0),
                "consensus_health": stats.get('consensus_health', 0.0),
                "pending_blocks": stats.get('pending_blocks', 0),
                "confirmed_blocks": stats.get('confirmed_blocks', 0),
                "last_block_height": stats.get('last_block_height', 0),
                "uptime_info": {
                    "initialized": stats.get('initialized', False),
                    "running": stats.get('running', False)
                },
                "timestamp": datetime.utcnow().isoformat() + "Z"
            }
        else:
            # Mock statistics
            return {
                "algorithm": "HyperRAFT++",
                "current_term": 15,
                "state": "leader",
                "leader": "aurigraph-primary",
                "active_validators": 3,
                "blocks_processed": 1250,
                "rounds_completed": 15,
                "average_finality_ms": 95.2,
                "consensus_health": 0.95,
                "pending_blocks": 2,
                "confirmed_blocks": 1248,
                "last_block_height": 1250,
                "uptime_info": {
                    "initialized": True,
                    "running": True
                },
                "timestamp": datetime.utcnow().isoformat() + "Z",
                "mock": True
            }
        
    except Exception as e:
        logger.error(f"Error getting consensus statistics: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to get consensus statistics: {str(e)}")