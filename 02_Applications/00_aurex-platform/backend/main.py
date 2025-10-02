"""
Aurex Platform - Core Shared Services
Main FastAPI application entry point
"""
from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer
import uvicorn
import os
from contextlib import asynccontextmanager

from core.auth import get_current_user
from core.logging import setup_logging, get_logger
from core.database import db_manager
from api import auth_router, health_router, users_router

logger = get_logger(__name__)
security = HTTPBearer()

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan events"""
    # Startup
    logger.info("Starting Aurex Platform Core Services")
    await db_manager.initialize()
    yield
    # Shutdown
    logger.info("Shutting down Aurex Platform Core Services")
    await db_manager.close()

app = FastAPI(
    title="Aurex Platform - Core Services",
    description="Centralized shared services for Aurex ecosystem",
    version="1.0.0",
    lifespan=lifespan
)

# CORS middleware - Security hardened
ENVIRONMENT = os.getenv("ENVIRONMENT", "development")
ALLOWED_ORIGINS = os.getenv("ALLOWED_ORIGINS", "https://dev.aurigraph.io,http://localhost:3000").split(",")

if ENVIRONMENT == "production":
    cors_origins = [origin.strip() for origin in ALLOWED_ORIGINS if not origin.strip().startswith("http://localhost")]
else:
    cors_origins = [origin.strip() for origin in ALLOWED_ORIGINS]

app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS", "HEAD"],
    allow_headers=["Authorization", "Content-Type", "X-Requested-With", "Accept", "Origin"],
)

# Include routers
app.include_router(health_router, prefix="/health", tags=["health"])
app.include_router(auth_router, prefix="/api/v1/auth", tags=["authentication"])
app.include_router(users_router, prefix="/api/v1/users", tags=["users"])

@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "service": "Aurex Platform Core Services",
        "version": "1.0.0",
        "status": "running"
    }

if __name__ == "__main__":
    setup_logging()
    port = int(os.getenv("PORT", 8000))
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=port,
        reload=os.getenv("ENVIRONMENT") != "production",
        log_level="info"
    )