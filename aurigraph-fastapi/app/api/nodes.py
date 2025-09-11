"""
Node management API endpoints
"""

import logging
from typing import Dict, Any, List, Optional
from fastapi import APIRouter, HTTPException, Request, Query
from pydantic import BaseModel, Field
from datetime import datetime
import uuid

logger = logging.getLogger(__name__)

router = APIRouter()


class NodeRegistration(BaseModel):
    """Node registration model"""
    node_id: str = Field(..., description="Unique node identifier")
    address: str = Field(..., description="Node IP address")
    port: int = Field(..., ge=1, le=65535, description="Node port")
    type: str = Field(default="full_node", description="Node type: validator, full_node, light_node")
    stake: Optional[int] = Field(default=0, ge=0, description="Validator stake amount")
    public_key: Optional[str] = Field(default=None, description="Node public key")
    version: Optional[str] = Field(default="11.0.0", description="Node software version")


class NodeStatusUpdate(BaseModel):
    """Node status update model"""
    is_active: bool = Field(..., description="Node active status")
    performance_score: float = Field(..., ge=0.0, le=1.0, description="Performance score 0-1")
    current_block_height: Optional[int] = Field(default=None, description="Current block height")
    peer_count: Optional[int] = Field(default=None, description="Number of connected peers")


@router.post("/register", summary="Register Node")
async def register_node(registration: NodeRegistration, request: Request) -> Dict[str, Any]:
    """
    Register a new node in the network
    """
    try:
        # Validate node type
        valid_types = ["validator", "full_node", "light_node", "archive_node"]
        if registration.type not in valid_types:
            raise HTTPException(status_code=400, detail=f"Invalid node type. Must be one of: {valid_types}")
        
        # Check if it's a validator registration
        if registration.type == "validator" and registration.stake < 100000:
            raise HTTPException(status_code=400, detail="Validators must have minimum stake of 100,000")
        
        # Create node info (this would typically involve database storage)
        node_info = {
            "node_id": registration.node_id,
            "address": registration.address,
            "port": registration.port,
            "type": registration.type,
            "stake": registration.stake,
            "public_key": registration.public_key,
            "version": registration.version,
            "registered_at": datetime.utcnow().isoformat() + "Z",
            "status": "inactive",  # New nodes start as inactive
            "performance_score": 0.0
        }
        
        logger.info(f"Node registered: {registration.node_id} ({registration.type})")
        
        return {
            "success": True,
            "node_id": registration.node_id,
            "message": f"Node {registration.node_id} registered successfully",
            "node_info": node_info,
            "timestamp": datetime.utcnow().isoformat() + "Z"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error registering node {registration.node_id}: {e}")
        raise HTTPException(status_code=500, detail=f"Node registration failed: {str(e)}")


@router.get("/{node_id}", summary="Get Node Info")
async def get_node_info(node_id: str, request: Request) -> Dict[str, Any]:
    """
    Get information about a specific node
    """
    try:
        # Mock node info (in real implementation, query from database)
        if node_id in ["aurigraph-primary", "validator-2", "validator-3"]:
            node_info = {
                "node_id": node_id,
                "address": "127.0.0.1",
                "port": 30303 if node_id == "aurigraph-primary" else (30304 if node_id == "validator-2" else 30305),
                "type": "validator",
                "stake": 1000000 if node_id == "aurigraph-primary" else (800000 if node_id == "validator-2" else 750000),
                "is_active": True,
                "performance_score": 0.95 if node_id == "aurigraph-primary" else (0.92 if node_id == "validator-2" else 0.89),
                "registered_at": "2024-01-01T00:00:00Z",
                "last_seen_at": datetime.utcnow().isoformat() + "Z",
                "version": "11.0.0",
                "current_block_height": 1250,
                "peer_count": 25,
                "uptime_percentage": 99.5,
                "status": "active"
            }
            
            return node_info
        else:
            raise HTTPException(status_code=404, detail=f"Node {node_id} not found")
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting node info for {node_id}: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to get node info: {str(e)}")


@router.get("/", summary="List Nodes")
async def list_nodes(
    request: Request,
    node_type: Optional[str] = Query(default=None, description="Filter by node type"),
    active_only: bool = Query(default=False, description="Show only active nodes"),
    limit: int = Query(default=100, ge=1, le=1000, description="Number of nodes to return")
) -> Dict[str, Any]:
    """
    List network nodes with filtering
    """
    try:
        # Mock node list (in real implementation, query from database)
        all_nodes = [
            {
                "node_id": "aurigraph-primary",
                "address": "127.0.0.1",
                "port": 30303,
                "type": "validator",
                "stake": 1000000,
                "is_active": True,
                "performance_score": 0.95,
                "status": "active",
                "last_seen_at": datetime.utcnow().isoformat() + "Z"
            },
            {
                "node_id": "validator-2",
                "address": "127.0.0.1",
                "port": 30304,
                "type": "validator",
                "stake": 800000,
                "is_active": True,
                "performance_score": 0.92,
                "status": "active",
                "last_seen_at": datetime.utcnow().isoformat() + "Z"
            },
            {
                "node_id": "validator-3",
                "address": "127.0.0.1",
                "port": 30305,
                "type": "validator",
                "stake": 750000,
                "is_active": True,
                "performance_score": 0.89,
                "status": "active",
                "last_seen_at": datetime.utcnow().isoformat() + "Z"
            },
            {
                "node_id": "full-node-1",
                "address": "192.168.1.100",
                "port": 30303,
                "type": "full_node",
                "stake": 0,
                "is_active": True,
                "performance_score": 0.85,
                "status": "syncing",
                "last_seen_at": datetime.utcnow().isoformat() + "Z"
            },
            {
                "node_id": "light-node-1",
                "address": "192.168.1.200",
                "port": 30303,
                "type": "light_node",
                "stake": 0,
                "is_active": False,
                "performance_score": 0.70,
                "status": "offline",
                "last_seen_at": "2024-01-10T10:00:00Z"
            }
        ]
        
        # Apply filters
        filtered_nodes = all_nodes
        
        if node_type:
            filtered_nodes = [n for n in filtered_nodes if n["type"] == node_type]
        
        if active_only:
            filtered_nodes = [n for n in filtered_nodes if n["is_active"]]
        
        # Apply limit
        filtered_nodes = filtered_nodes[:limit]
        
        # Calculate summary statistics
        total_nodes = len(all_nodes)
        active_nodes = len([n for n in all_nodes if n["is_active"]])
        validators = len([n for n in all_nodes if n["type"] == "validator"])
        
        return {
            "nodes": filtered_nodes,
            "total_nodes": len(filtered_nodes),
            "summary": {
                "total_in_network": total_nodes,
                "active_nodes": active_nodes,
                "validators": validators,
                "full_nodes": len([n for n in all_nodes if n["type"] == "full_node"]),
                "light_nodes": len([n for n in all_nodes if n["type"] == "light_node"])
            },
            "filters": {
                "node_type": node_type,
                "active_only": active_only,
                "limit": limit
            },
            "timestamp": datetime.utcnow().isoformat() + "Z"
        }
        
    except Exception as e:
        logger.error(f"Error listing nodes: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to list nodes: {str(e)}")


@router.put("/{node_id}/status", summary="Update Node Status")
async def update_node_status(
    node_id: str, 
    status_update: NodeStatusUpdate, 
    request: Request
) -> Dict[str, Any]:
    """
    Update node status and performance metrics
    """
    try:
        # Validate node exists (mock validation)
        if node_id not in ["aurigraph-primary", "validator-2", "validator-3", "full-node-1", "light-node-1"]:
            raise HTTPException(status_code=404, detail=f"Node {node_id} not found")
        
        # Update node status (in real implementation, update database)
        updated_info = {
            "node_id": node_id,
            "is_active": status_update.is_active,
            "performance_score": status_update.performance_score,
            "current_block_height": status_update.current_block_height,
            "peer_count": status_update.peer_count,
            "last_updated": datetime.utcnow().isoformat() + "Z",
            "status": "active" if status_update.is_active else "inactive"
        }
        
        logger.info(f"Node status updated: {node_id} - active: {status_update.is_active}, score: {status_update.performance_score}")
        
        return {
            "success": True,
            "node_id": node_id,
            "message": f"Node {node_id} status updated successfully",
            "updated_info": updated_info,
            "timestamp": datetime.utcnow().isoformat() + "Z"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating node status for {node_id}: {e}")
        raise HTTPException(status_code=500, detail=f"Status update failed: {str(e)}")


@router.delete("/{node_id}", summary="Deregister Node")
async def deregister_node(node_id: str, request: Request) -> Dict[str, Any]:
    """
    Deregister a node from the network
    """
    try:
        # Check if node exists (mock check)
        if node_id in ["aurigraph-primary", "validator-2", "validator-3"]:
            raise HTTPException(status_code=400, detail="Cannot deregister core validator nodes")
        
        # Mock deregistration
        logger.info(f"Node deregistered: {node_id}")
        
        return {
            "success": True,
            "node_id": node_id,
            "message": f"Node {node_id} deregistered successfully",
            "timestamp": datetime.utcnow().isoformat() + "Z"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deregistering node {node_id}: {e}")
        raise HTTPException(status_code=500, detail=f"Node deregistration failed: {str(e)}")


@router.get("/{node_id}/peers", summary="Get Node Peers")
async def get_node_peers(node_id: str, request: Request) -> Dict[str, Any]:
    """
    Get list of peers connected to a specific node
    """
    try:
        # Mock peer list
        if node_id not in ["aurigraph-primary", "validator-2", "validator-3", "full-node-1"]:
            raise HTTPException(status_code=404, detail=f"Node {node_id} not found")
        
        # Generate mock peer list
        import random
        peer_count = random.randint(15, 35)
        
        peers = []
        for i in range(peer_count):
            peer = {
                "peer_id": f"peer_{i}_{uuid.uuid4().hex[:8]}",
                "address": f"192.168.1.{random.randint(1, 255)}",
                "port": random.randint(30303, 30400),
                "connected_at": (datetime.utcnow() - datetime.timedelta(seconds=random.randint(60, 3600))).isoformat() + "Z",
                "bytes_sent": random.randint(1000000, 10000000),
                "bytes_received": random.randint(1000000, 10000000),
                "latency_ms": random.uniform(10, 100),
                "protocol_version": "11.0.0"
            }
            peers.append(peer)
        
        return {
            "node_id": node_id,
            "peer_count": len(peers),
            "peers": peers,
            "max_peers": 50,
            "incoming_connections": random.randint(5, 15),
            "outgoing_connections": len(peers) - random.randint(5, 15),
            "timestamp": datetime.utcnow().isoformat() + "Z"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting peers for node {node_id}: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to get peers: {str(e)}")


@router.get("/network/topology", summary="Network Topology")
async def network_topology(request: Request) -> Dict[str, Any]:
    """
    Get network topology information
    """
    try:
        # Mock network topology
        topology = {
            "total_nodes": 5,
            "active_nodes": 4,
            "network_segments": [
                {
                    "segment_id": "validators",
                    "nodes": ["aurigraph-primary", "validator-2", "validator-3"],
                    "connections": [
                        {"from": "aurigraph-primary", "to": "validator-2", "latency_ms": 15.5},
                        {"from": "aurigraph-primary", "to": "validator-3", "latency_ms": 18.2},
                        {"from": "validator-2", "to": "validator-3", "latency_ms": 12.8}
                    ]
                },
                {
                    "segment_id": "full_nodes",
                    "nodes": ["full-node-1"],
                    "connections": [
                        {"from": "full-node-1", "to": "aurigraph-primary", "latency_ms": 25.3},
                        {"from": "full-node-1", "to": "validator-2", "latency_ms": 28.7}
                    ]
                }
            ],
            "statistics": {
                "average_latency_ms": 20.1,
                "total_connections": 5,
                "network_health": 0.95,
                "partition_tolerance": "high",
                "consensus_participants": 3
            },
            "timestamp": datetime.utcnow().isoformat() + "Z"
        }
        
        return topology
        
    except Exception as e:
        logger.error(f"Error getting network topology: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to get network topology: {str(e)}")


@router.get("/stats/summary", summary="Node Statistics")
async def node_stats(request: Request) -> Dict[str, Any]:
    """
    Get network-wide node statistics
    """
    try:
        # Mock node statistics
        stats = {
            "total_nodes": 5,
            "active_nodes": 4,
            "inactive_nodes": 1,
            "node_types": {
                "validators": 3,
                "full_nodes": 1,
                "light_nodes": 1,
                "archive_nodes": 0
            },
            "geographic_distribution": {
                "US": 3,
                "EU": 1,
                "ASIA": 1
            },
            "performance_metrics": {
                "average_performance_score": 0.886,
                "average_uptime_percentage": 98.5,
                "total_stake": 2550000,
                "average_peer_count": 22.5
            },
            "network_health": {
                "consensus_health": 0.95,
                "connectivity_score": 0.92,
                "fault_tolerance": "high"
            },
            "timestamp": datetime.utcnow().isoformat() + "Z"
        }
        
        return stats
        
    except Exception as e:
        logger.error(f"Error getting node statistics: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to get node statistics: {str(e)}")