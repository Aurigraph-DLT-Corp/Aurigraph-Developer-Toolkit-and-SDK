#!/usr/bin/env python3
# ================================================================================
# AUREX LAUNCHPAD™ HEALTH CHECK ROUTER
# Comprehensive health check and status endpoints
# Agent: DevOps Orchestration Agent
# ================================================================================

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import text
import time
import psutil
import sys
from datetime import datetime
from typing import Dict, Any

from models.base_models import get_db
from config import get_settings

router = APIRouter()
settings = get_settings()

@router.get("/health")
async def basic_health_check():
    """Basic health check endpoint"""
    return {
        "status": "healthy",
        "service": "aurex-launchpad",
        "version": "1.0.0",
        "timestamp": datetime.utcnow().isoformat(),
        "environment": settings.ENVIRONMENT
    }

@router.get("/health/detailed")
async def detailed_health_check(db: Session = Depends(get_db)):
    """Detailed health check with component status"""
    health_status = {
        "status": "healthy",
        "service": "aurex-launchpad",
        "version": "1.0.0",
        "timestamp": datetime.utcnow().isoformat(),
        "environment": settings.ENVIRONMENT,
        "uptime": time.time(),
        "components": {}
    }
    
    # Database health check
    try:
        db.execute(text("SELECT 1"))
        health_status["components"]["database"] = {
            "status": "healthy",
            "message": "Database connection successful"
        }
    except Exception as e:
        health_status["status"] = "unhealthy"
        health_status["components"]["database"] = {
            "status": "unhealthy",
            "message": f"Database connection failed: {str(e)}"
        }
    
    # OpenAI API health check (if configured)
    if settings.OPENAI_API_KEY:
        health_status["components"]["openai"] = {
            "status": "configured",
            "message": "OpenAI API key is configured"
        }
    else:
        health_status["components"]["openai"] = {
            "status": "not_configured",
            "message": "OpenAI API key not configured"
        }
    
    # Email service health check (if configured)
    if settings.SMTP_USER and settings.SMTP_PASSWORD:
        health_status["components"]["email"] = {
            "status": "configured",
            "message": "Email service is configured"
        }
    else:
        health_status["components"]["email"] = {
            "status": "not_configured",
            "message": "Email service not configured"
        }
    
    return health_status

@router.get("/health/system")
async def system_health_check():
    """System resource health check"""
    try:
        # Get system information
        cpu_percent = psutil.cpu_percent(interval=1)
        memory = psutil.virtual_memory()
        disk = psutil.disk_usage('/')
        
        return {
            "status": "healthy",
            "timestamp": datetime.utcnow().isoformat(),
            "system": {
                "python_version": sys.version,
                "cpu_count": psutil.cpu_count(),
                "cpu_usage_percent": cpu_percent,
                "memory": {
                    "total_gb": round(memory.total / (1024**3), 2),
                    "available_gb": round(memory.available / (1024**3), 2),
                    "used_percent": memory.percent
                },
                "disk": {
                    "total_gb": round(disk.total / (1024**3), 2),
                    "free_gb": round(disk.free / (1024**3), 2),
                    "used_percent": round((disk.used / disk.total) * 100, 2)
                }
            },
            "warnings": []
        }
    except Exception as e:
        return {
            "status": "error",
            "timestamp": datetime.utcnow().isoformat(),
            "error": f"Failed to get system information: {str(e)}"
        }

@router.get("/status")
async def service_status():
    """Service status information"""
    return {
        "service": "Aurex Launchpad™",
        "version": "1.0.0",
        "status": "operational",
        "environment": settings.ENVIRONMENT,
        "debug_mode": settings.DEBUG,
        "timestamp": datetime.utcnow().isoformat(),
        "features": [
            "Enterprise Authentication with RBAC",
            "Multi-framework ESG Assessment (GRI, SASB, TCFD, CDP, ISO14064)",
            "AI-powered Document Intelligence",
            "Real-time Analytics and Reporting",
            "Multi-tenant Architecture",
            "Comprehensive Security and Audit Logging"
        ],
        "endpoints": {
            "authentication": "/api/v1/auth",
            "organizations": "/api/v1/organizations",
            "assessments": "/api/v1/assessments",
            "documents": "/api/v1/documents",
            "analytics": "/api/v1/analytics",
            "admin": "/api/v1/admin"
        }
    }