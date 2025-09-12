"""
Main gRPC Server implementation for Aurigraph DLT Platform
"""

import asyncio
import logging
from typing import Optional
from concurrent import futures
import grpc
from grpc_reflection.v1alpha import reflection

from generated.aurigraph_pb2_grpc import (
    add_TransactionServiceServicer_to_server,
    add_ConsensusServiceServicer_to_server,
    add_NodeServiceServicer_to_server,
    add_MonitoringServiceServicer_to_server,
)
from .transaction_service import TransactionServiceImpl
from .consensus_service import ConsensusServiceImpl
from .node_service import NodeServiceImpl
from .monitoring_service import MonitoringServiceImpl

logger = logging.getLogger(__name__)


class GRPCServer:
    """
    High-performance gRPC server for Aurigraph DLT Platform
    Handles all internal service communication using Protocol Buffers
    """
    
    def __init__(
        self, 
        port: int = 9004,
        transaction_processor=None,
        consensus_engine=None,
        monitoring=None,
        max_workers: int = 256,
        max_message_length: int = 100 * 1024 * 1024,  # 100MB
    ):
        self.port = port
        self.max_workers = max_workers
        self.max_message_length = max_message_length
        self.server: Optional[grpc.Server] = None
        
        # Service dependencies
        self.transaction_processor = transaction_processor
        self.consensus_engine = consensus_engine 
        self.monitoring = monitoring
        
        # Service implementations
        self.transaction_service = TransactionServiceImpl(transaction_processor)
        self.consensus_service = ConsensusServiceImpl(consensus_engine)
        self.node_service = NodeServiceImpl()
        self.monitoring_service = MonitoringServiceImpl(monitoring)
        
    async def start(self) -> None:
        """
        Start the gRPC server with all services
        """
        try:
            # Create server with optimized settings
            self.server = grpc.aio.server(
                futures.ThreadPoolExecutor(max_workers=self.max_workers),
                options=[
                    ('grpc.keepalive_time_ms', 30000),
                    ('grpc.keepalive_timeout_ms', 5000),
                    ('grpc.keepalive_permit_without_calls', True),
                    ('grpc.http2.max_pings_without_data', 0),
                    ('grpc.http2.min_time_between_pings_ms', 10000),
                    ('grpc.http2.min_ping_interval_without_data_ms', 300000),
                    ('grpc.max_receive_message_length', self.max_message_length),
                    ('grpc.max_send_message_length', self.max_message_length),
                    ('grpc.so_reuseport', 1),
                    ('grpc.use_local_subchannel_pool', 1),
                ]
            )
            
            # Add service implementations
            add_TransactionServiceServicer_to_server(self.transaction_service, self.server)
            add_ConsensusServiceServicer_to_server(self.consensus_service, self.server)
            add_NodeServiceServicer_to_server(self.node_service, self.server)
            add_MonitoringServiceServicer_to_server(self.monitoring_service, self.server)
            
            # Enable reflection for development
            SERVICE_NAMES = (
                'aurigraph.v11.TransactionService',
                'aurigraph.v11.ConsensusService',
                'aurigraph.v11.NodeService',
                'aurigraph.v11.MonitoringService',
                reflection.SERVICE_NAME,
            )
            reflection.enable_server_reflection(SERVICE_NAMES, self.server)
            
            # Configure listen address
            listen_addr = f'[::]:{self.port}'
            self.server.add_insecure_port(listen_addr)
            
            # Start server
            await self.server.start()
            logger.info(f"gRPC server started on {listen_addr}")
            logger.info(f"Services: Transaction, Consensus, Node, Monitoring")
            logger.info(f"Max workers: {self.max_workers}")
            logger.info(f"Max message size: {self.max_message_length // (1024*1024)}MB")
            
        except Exception as e:
            logger.error(f"Failed to start gRPC server: {e}")
            raise
    
    async def stop(self, grace_period: float = 5.0) -> None:
        """
        Gracefully stop the gRPC server
        """
        if self.server:
            logger.info("Shutting down gRPC server...")
            await self.server.stop(grace_period)
            logger.info("gRPC server stopped")
    
    async def wait_for_termination(self) -> None:
        """
        Wait for server termination
        """
        if self.server:
            await self.server.wait_for_termination()
    
    def get_port(self) -> int:
        """
        Get the server port
        """
        return self.port
    
    def is_running(self) -> bool:
        """
        Check if server is running
        """
        return self.server is not None


async def run_grpc_server(port: int = 9004) -> None:
    """
    Standalone gRPC server runner for testing
    """
    server = GRPCServer(port=port)
    await server.start()
    
    try:
        await server.wait_for_termination()
    except KeyboardInterrupt:
        logger.info("Received interrupt signal")
    finally:
        await server.stop()


if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO)
    asyncio.run(run_grpc_server())