"""
Main FastAPI application with gRPC integration
"""

import asyncio
import logging
from contextlib import asynccontextmanager
from typing import Dict, Any

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import uvicorn
import grpc
from concurrent import futures

from app.api import health, transactions, consensus, monitoring, nodes, quantum_security
from app.core.config import settings
from app.core.logging import setup_logging
from app.grpc_services.server import GRPCServer
from app.services.consensus import ConsensusEngine
from app.services.transaction_processor import TransactionProcessor
from app.services.monitoring import MonitoringService
from app.services.quantum_crypto import QuantumCryptoManager

# Setup logging
logger = setup_logging(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Application lifespan manager for startup and shutdown events
    """
    # Startup
    logger.info("🚀 Starting Aurigraph DLT FastAPI Platform...")
    logger.info(f"Version: {settings.VERSION} | Mode: {settings.ENVIRONMENT}")
    
    # Initialize core services
    app.state.quantum_crypto = QuantumCryptoManager()
    await app.state.quantum_crypto.initialize()
    logger.info("🔐 Quantum cryptography initialized")
    
    app.state.transaction_processor = TransactionProcessor()
    await app.state.transaction_processor.initialize()
    logger.info("💱 Transaction processor initialized")
    
    app.state.consensus_engine = ConsensusEngine(
        node_id=settings.NODE_ID,
        validators=settings.VALIDATORS,
        quantum_crypto=app.state.quantum_crypto
    )
    await app.state.consensus_engine.initialize()
    logger.info("🏗️ Consensus engine initialized")
    
    app.state.monitoring = MonitoringService()
    await app.state.monitoring.start()
    logger.info("📊 Monitoring service started")
    
    # Start gRPC server
    app.state.grpc_server = GRPCServer(
        port=settings.GRPC_PORT,
        transaction_processor=app.state.transaction_processor,
        consensus_engine=app.state.consensus_engine,
        monitoring=app.state.monitoring
    )
    asyncio.create_task(app.state.grpc_server.start())
    logger.info(f"📡 gRPC server started on port {settings.GRPC_PORT}")
    
    logger.info("✅ Aurigraph DLT Platform started successfully")
    logger.info(f"📈 Target TPS: {settings.TARGET_TPS:,} | Finality: <{settings.FINALITY_MS}ms")
    logger.info(f"🔒 Security: Post-Quantum Level {settings.QUANTUM_LEVEL}")
    logger.info("🌍 Protocol: gRPC/HTTP2 with Protocol Buffers")
    
    yield
    
    # Shutdown
    logger.info("🔻 Shutting down Aurigraph DLT Platform...")
    await app.state.grpc_server.stop()
    await app.state.monitoring.stop()
    await app.state.consensus_engine.stop()
    await app.state.transaction_processor.stop()
    logger.info("👋 Shutdown complete")


# Create FastAPI app
app = FastAPI(
    title="Aurigraph DLT Platform",
    description="High-performance blockchain platform with gRPC/HTTP2 and Protocol Buffers",
    version=settings.VERSION,
    lifespan=lifespan,
    docs_url="/api/docs" if settings.ENVIRONMENT != "production" else None,
    redoc_url="/api/redoc" if settings.ENVIRONMENT != "production" else None,
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(health.router, prefix="/api/v11", tags=["health"])
app.include_router(transactions.router, prefix="/api/v11/transactions", tags=["transactions"])
app.include_router(consensus.router, prefix="/api/v11/consensus", tags=["consensus"])
app.include_router(monitoring.router, prefix="/api/v11/monitoring", tags=["monitoring"])
app.include_router(nodes.router, prefix="/api/v11/nodes", tags=["nodes"])

# V12 Quantum Security API
app.include_router(quantum_security.router, prefix="/api/v12", tags=["quantum-security-v12"])


@app.exception_handler(Exception)
async def global_exception_handler(request, exc):
    """
    Global exception handler
    """
    logger.error(f"Unhandled exception: {exc}", exc_info=True)
    return JSONResponse(
        status_code=500,
        content={
            "error": "Internal server error",
            "message": str(exc) if settings.ENVIRONMENT != "production" else "An error occurred"
        }
    )


@app.get("/")
async def root():
    """
    Root endpoint
    """
    return {
        "name": "Aurigraph DLT Platform",
        "version": settings.VERSION,
        "status": "operational",
        "protocol": "gRPC/HTTP2",
        "api_docs": "/api/docs" if settings.ENVIRONMENT != "production" else None
    }


if __name__ == "__main__":
    uvicorn.run(
        "app.main:app",
        host=settings.HOST,
        port=settings.PORT,
        reload=settings.ENVIRONMENT == "development",
        log_level="info",
        access_log=True,
        server_header=False,
        date_header=False
    )