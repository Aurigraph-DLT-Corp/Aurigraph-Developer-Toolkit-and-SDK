"""
FastAPI Application Entry Point
Aurex HydroPulse AWD Platform Backend
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.trustedhost import TrustedHostMiddleware
import uvicorn

from app.core.config import settings
from app.routers import project_registration, auth
from app.database import create_tables

# Create FastAPI application
app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    description="AWD (Alternate Wetting and Drying) Carbon Credit Platform",
    docs_url="/api/docs",
    redoc_url="/api/redoc",
    openapi_url="/api/openapi.json"
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Add trusted host middleware for production
if not settings.DEBUG:
    app.add_middleware(
        TrustedHostMiddleware,
        allowed_hosts=["dev.aurigraph.io", "localhost", "127.0.0.1"]
    )


@app.on_event("startup")
async def startup_event():
    """Initialize application on startup"""
    print(f"Starting {settings.APP_NAME} v{settings.APP_VERSION}")
    
    # Create database tables
    create_tables()
    
    print("✅ Database tables created/verified")
    print("🚀 Application startup complete")


@app.on_event("shutdown")
async def shutdown_event():
    """Clean up on application shutdown"""
    print("👋 Shutting down application")


@app.get("/")
async def root():
    """Root endpoint with API information"""
    return {
        "app": settings.APP_NAME,
        "version": settings.APP_VERSION,
        "status": "running",
        "docs": "/api/docs"
    }


@app.get("/health")
async def health_check():
    """Health check endpoint for monitoring"""
    return {
        "status": "healthy",
        "app": settings.APP_NAME,
        "version": settings.APP_VERSION
    }


# Include routers
app.include_router(auth.router)
app.include_router(project_registration.router)


if __name__ == "__main__":
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8002,
        reload=settings.DEBUG,
        log_level="info" if not settings.DEBUG else "debug"
    )