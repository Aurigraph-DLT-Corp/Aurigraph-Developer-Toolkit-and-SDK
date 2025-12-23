"""
Health check API endpoints
"""

import logging
from typing import Dict, Any
from fastapi import APIRouter, Request
from datetime import datetime
import time

from app.core.config import settings

logger = logging.getLogger(__name__)

router = APIRouter()


@router.get("/health", summary="Health Check", description="Basic health check endpoint")
async def health_check(request: Request) -> Dict[str, Any]:
    """
    Basic health check endpoint
    Returns system status and basic information
    """
    try:
        return {
            "status": "healthy",
            "timestamp": datetime.utcnow().isoformat() + "Z",
            "version": settings.VERSION,
            "environment": settings.ENVIRONMENT,
            "node_id": settings.NODE_ID,
            "uptime_seconds": int(time.time() - getattr(request.app.state, 'start_time', time.time())),
            "services": {
                "api": "operational",
                "grpc": "operational" if hasattr(request.app.state, 'grpc_server') else "starting"
            }
        }
    except Exception as e:
        logger.error(f"Health check failed: {e}")
        return {
            "status": "unhealthy",
            "error": str(e),
            "timestamp": datetime.utcnow().isoformat() + "Z"
        }


@router.get("/health/detailed", summary="Detailed Health Check")
async def detailed_health_check(request: Request) -> Dict[str, Any]:
    """
    Detailed health check with service status
    """
    try:
        # Get service statuses
        services_status = {}
        
        # Check gRPC server
        if hasattr(request.app.state, 'grpc_server'):
            services_status["grpc_server"] = {
                "status": "running" if request.app.state.grpc_server.is_running() else "stopped",
                "port": request.app.state.grpc_server.get_port()
            }
        
        # Check consensus engine
        if hasattr(request.app.state, 'consensus_engine'):
            consensus_stats = request.app.state.consensus_engine.get_stats()
            services_status["consensus"] = {
                "status": "running" if consensus_stats.get('running') else "stopped",
                "state": consensus_stats.get('state', 'unknown'),
                "leader": consensus_stats.get('leader', 'unknown')
            }
        
        # Check transaction processor
        if hasattr(request.app.state, 'transaction_processor'):
            tx_stats = request.app.state.transaction_processor.get_stats()
            services_status["transaction_processor"] = {
                "status": "running" if tx_stats.get('running') else "stopped",
                "processed_count": tx_stats.get('processed_count', 0),
                "current_tps": tx_stats.get('current_tps', 0.0)
            }
        
        # Check monitoring service
        if hasattr(request.app.state, 'monitoring'):
            monitoring_stats = request.app.state.monitoring.get_stats()
            services_status["monitoring"] = {
                "status": "running" if monitoring_stats.get('running') else "stopped",
                "metrics_collected": monitoring_stats.get('metrics_collected', 0)
            }
        
        # Check quantum crypto
        if hasattr(request.app.state, 'quantum_crypto'):
            crypto_stats = request.app.state.quantum_crypto.get_stats()
            services_status["quantum_crypto"] = {
                "status": "initialized" if crypto_stats.get('initialized') else "not_initialized",
                "algorithm": crypto_stats.get('algorithm', 'unknown'),
                "security_level": crypto_stats.get('security_level', 0)
            }
        
        # Overall health
        all_services_healthy = all(
            service.get('status') in ['running', 'initialized'] 
            for service in services_status.values()
        )
        
        return {
            "status": "healthy" if all_services_healthy else "degraded",
            "timestamp": datetime.utcnow().isoformat() + "Z",
            "version": settings.VERSION,
            "environment": settings.ENVIRONMENT,
            "node_id": settings.NODE_ID,
            "target_tps": settings.TARGET_TPS,
            "services": services_status,
            "configuration": {
                "consensus_algorithm": settings.CONSENSUS_ALGORITHM,
                "quantum_enabled": settings.QUANTUM_ENABLED,
                "ai_optimization": settings.AI_OPTIMIZATION_ENABLED
            }
        }
        
    except Exception as e:
        logger.error(f"Detailed health check failed: {e}")
        return {
            "status": "error",
            "error": str(e),
            "timestamp": datetime.utcnow().isoformat() + "Z"
        }


@router.get("/ready", summary="Readiness Check")
async def readiness_check(request: Request) -> Dict[str, Any]:
    """
    Readiness check for Kubernetes/container orchestration
    """
    try:
        # Check if all critical services are initialized
        ready = True
        services = {}
        
        # Check gRPC server
        if hasattr(request.app.state, 'grpc_server'):
            grpc_ready = request.app.state.grpc_server.is_running()
            services["grpc_server"] = grpc_ready
            ready = ready and grpc_ready
        
        # Check consensus engine
        if hasattr(request.app.state, 'consensus_engine'):
            consensus_ready = request.app.state.consensus_engine.initialized
            services["consensus"] = consensus_ready
            ready = ready and consensus_ready
        
        # Check transaction processor
        if hasattr(request.app.state, 'transaction_processor'):
            tx_ready = request.app.state.transaction_processor.initialized
            services["transaction_processor"] = tx_ready
            ready = ready and tx_ready
        
        return {
            "ready": ready,
            "timestamp": datetime.utcnow().isoformat() + "Z",
            "services": services
        }
        
    except Exception as e:
        logger.error(f"Readiness check failed: {e}")
        return {
            "ready": False,
            "error": str(e),
            "timestamp": datetime.utcnow().isoformat() + "Z"
        }


@router.get("/live", summary="Liveness Check")
async def liveness_check() -> Dict[str, Any]:
    """
    Liveness check for Kubernetes/container orchestration
    Simple check to verify the application is alive
    """
    return {
        "alive": True,
        "timestamp": datetime.utcnow().isoformat() + "Z",
        "version": settings.VERSION
    }