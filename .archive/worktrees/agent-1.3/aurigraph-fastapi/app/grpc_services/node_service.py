"""
Node Service gRPC implementation
Handles node management and registration with Protocol Buffers
"""

import logging
from typing import Dict, List
import grpc
from datetime import datetime

from generated.aurigraph_pb2 import (
    NodeInfo, NodeRequest, NodeList, NodeStatusUpdate,
    RegistrationResponse, UpdateResponse, Empty
)
from generated.aurigraph_pb2_grpc import NodeServiceServicer

logger = logging.getLogger(__name__)


class NodeServiceImpl(NodeServiceServicer):
    """
    Node management service implementation
    Handles node registration, status updates, and network topology
    """
    
    def __init__(self):
        self.registered_nodes: Dict[str, NodeInfo] = {}
        self.node_stats: Dict[str, dict] = {}
        self.network_topology: Dict[str, List[str]] = {}
        
        # Initialize with default nodes
        self._initialize_default_nodes()
    
    def _initialize_default_nodes(self):
        """
        Initialize with default validator nodes
        """
        default_nodes = [
            {
                "node_id": "aurigraph-primary",
                "address": "127.0.0.1",
                "port": 30303,
                "type": "validator",
                "stake": 1000000,
                "performance_score": 0.95,
                "is_active": True
            },
            {
                "node_id": "validator-2", 
                "address": "127.0.0.1",
                "port": 30304,
                "type": "validator",
                "stake": 800000,
                "performance_score": 0.92,
                "is_active": True
            },
            {
                "node_id": "validator-3",
                "address": "127.0.0.1", 
                "port": 30305,
                "type": "validator",
                "stake": 750000,
                "performance_score": 0.89,
                "is_active": True
            }
        ]
        
        for node_data in default_nodes:
            node = NodeInfo(**node_data)
            self.registered_nodes[node.node_id] = node
            self.node_stats[node.node_id] = {
                "registration_time": datetime.now().timestamp(),
                "last_heartbeat": datetime.now().timestamp(),
                "uptime_seconds": 0
            }
    
    async def RegisterNode(
        self,
        request: NodeInfo,
        context: grpc.aio.ServicerContext
    ) -> RegistrationResponse:
        """
        Register a new node in the network
        """
        try:
            logger.info(f"Node registration request: {request.node_id} ({request.type})")
            
            # Validate node information
            if not self._validate_node_info(request):
                return RegistrationResponse(
                    success=False,
                    node_id=request.node_id,
                    message="Invalid node information"
                )
            
            # Check if node already exists
            if request.node_id in self.registered_nodes:
                # Update existing node
                self.registered_nodes[request.node_id] = request
                message = f"Node {request.node_id} information updated"
            else:
                # Register new node
                self.registered_nodes[request.node_id] = request
                self.node_stats[request.node_id] = {
                    "registration_time": datetime.now().timestamp(),
                    "last_heartbeat": datetime.now().timestamp(),
                    "uptime_seconds": 0
                }
                message = f"Node {request.node_id} registered successfully"
            
            logger.info(f"Node registration successful: {request.node_id}")
            
            return RegistrationResponse(
                success=True,
                node_id=request.node_id,
                message=message
            )
            
        except Exception as e:
            logger.error(f"Error registering node {request.node_id}: {e}")
            return RegistrationResponse(
                success=False,
                node_id=request.node_id,
                message=f"Registration error: {str(e)}"
            )
    
    async def GetNodeInfo(
        self,
        request: NodeRequest,
        context: grpc.aio.ServicerContext
    ) -> NodeInfo:
        """
        Get information about a specific node
        """
        try:
            if request.node_id not in self.registered_nodes:
                await context.abort(grpc.StatusCode.NOT_FOUND, f"Node {request.node_id} not found")
            
            node = self.registered_nodes[request.node_id]
            
            # Update node stats if available
            if request.node_id in self.node_stats:
                stats = self.node_stats[request.node_id]
                current_time = datetime.now().timestamp()
                stats["uptime_seconds"] = int(current_time - stats["registration_time"])
                stats["last_heartbeat"] = current_time
            
            logger.debug(f"Node info requested: {request.node_id}")
            return node
            
        except Exception as e:
            logger.error(f"Error getting node info for {request.node_id}: {e}")
            await context.abort(grpc.StatusCode.INTERNAL, f"Error retrieving node info: {str(e)}")
    
    async def ListNodes(
        self,
        request: Empty,
        context: grpc.aio.ServicerContext
    ) -> NodeList:
        """
        List all registered nodes
        """
        try:
            nodes = list(self.registered_nodes.values())
            
            # Sort nodes by type and performance score
            nodes.sort(key=lambda n: (n.type != "validator", -n.performance_score))
            
            logger.debug(f"Node list requested: {len(nodes)} nodes")
            
            return NodeList(
                nodes=nodes,
                total_count=len(nodes)
            )
            
        except Exception as e:
            logger.error(f"Error listing nodes: {e}")
            return NodeList(nodes=[], total_count=0)
    
    async def UpdateNodeStatus(
        self,
        request: NodeStatusUpdate,
        context: grpc.aio.ServicerContext
    ) -> UpdateResponse:
        """
        Update node status and performance metrics
        """
        try:
            logger.debug(f"Node status update: {request.node_id}")
            
            if request.node_id not in self.registered_nodes:
                return UpdateResponse(
                    success=False,
                    message=f"Node {request.node_id} not found"
                )
            
            # Update node information
            node = self.registered_nodes[request.node_id]
            node.is_active = request.is_active
            node.performance_score = request.performance_score
            
            # Update stats
            if request.node_id in self.node_stats:
                self.node_stats[request.node_id]["last_heartbeat"] = datetime.now().timestamp()
            
            # Log significant status changes
            if not request.is_active:
                logger.warning(f"Node {request.node_id} went offline")
            elif request.performance_score < 0.5:
                logger.warning(f"Node {request.node_id} performance degraded: {request.performance_score}")
            
            return UpdateResponse(
                success=True,
                message=f"Node {request.node_id} status updated"
            )
            
        except Exception as e:
            logger.error(f"Error updating node status for {request.node_id}: {e}")
            return UpdateResponse(
                success=False,
                message=f"Status update error: {str(e)}"
            )
    
    def _validate_node_info(self, node: NodeInfo) -> bool:
        """
        Validate node information
        """
        try:
            if not node.node_id:
                return False
            if not node.address:
                return False
            if node.port <= 0 or node.port > 65535:
                return False
            if node.type not in ["validator", "full_node", "light_node"]:
                return False
            if node.performance_score < 0.0 or node.performance_score > 1.0:
                return False
            if node.stake < 0:
                return False
            
            return True
            
        except Exception as e:
            logger.error(f"Node validation error: {e}")
            return False
    
    def get_network_stats(self) -> dict:
        """
        Get network statistics
        """
        try:
            active_nodes = sum(1 for node in self.registered_nodes.values() if node.is_active)
            validators = sum(1 for node in self.registered_nodes.values() if node.type == "validator")
            total_stake = sum(node.stake for node in self.registered_nodes.values())
            avg_performance = (
                sum(node.performance_score for node in self.registered_nodes.values()) / 
                len(self.registered_nodes) if self.registered_nodes else 0.0
            )
            
            return {
                "total_nodes": len(self.registered_nodes),
                "active_nodes": active_nodes,
                "validators": validators,
                "total_stake": total_stake,
                "average_performance": avg_performance,
                "network_health": min(1.0, active_nodes / max(1, len(self.registered_nodes)))
            }
            
        except Exception as e:
            logger.error(f"Error calculating network stats: {e}")
            return {}
    
    def get_node_stats(self, node_id: str) -> dict:
        """
        Get detailed statistics for a specific node
        """
        try:
            if node_id not in self.node_stats:
                return {}
            
            stats = self.node_stats[node_id].copy()
            node = self.registered_nodes.get(node_id)
            
            if node:
                stats.update({
                    "node_type": node.type,
                    "is_active": node.is_active,
                    "performance_score": node.performance_score,
                    "stake": node.stake,
                    "address": f"{node.address}:{node.port}"
                })
            
            return stats
            
        except Exception as e:
            logger.error(f"Error getting node stats for {node_id}: {e}")
            return {}