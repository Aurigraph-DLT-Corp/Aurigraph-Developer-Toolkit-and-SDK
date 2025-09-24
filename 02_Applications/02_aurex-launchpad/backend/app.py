#!/usr/bin/env python3
# ================================================================================
# AUREX LAUNCHPAD™ COMPLETE FASTAPI APPLICATION
# Production-ready FastAPI application with all modules integrated
# Agent: Application Architecture Agent
# ================================================================================

from fastapi import FastAPI, Depends, HTTPException, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.trustedhost import TrustedHostMiddleware
from fastapi.middleware.gzip import GZipMiddleware
from fastapi.responses import JSONResponse
from contextlib import asynccontextmanager
import uvicorn
import logging
from datetime import datetime

# Import database and models
from models.base_models import Base, engine, SessionLocal, get_db, create_all_tables

# Import routers
from routers.health import router as health_router
from routers.auth import router as auth_router
from routers.assessments import router as assessments_router
from routers.documents import router as documents_router
from routers.analytics import router as analytics_router
from routers.organizations import router as organizations_router
from routers.admin import router as admin_router

# Import middleware
from middleware.security import SecurityMiddleware
from middleware.logging import LoggingMiddleware, PerformanceMiddleware

# Import configuration
from config import get_settings

settings = get_settings()

# Configure logging
logging.basicConfig(
    level=getattr(logging, settings.LOG_LEVEL.upper()),
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('aurex_launchpad.log'),
        logging.StreamHandler()
    ]
)

logger = logging.getLogger(__name__)

# ================================================================================
# APPLICATION LIFESPAN MANAGEMENT
# ================================================================================

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan management"""
    
    # Startup
    logger.info("🚀 Starting Aurex Launchpad™...")
    
    try:
        # Initialize database
        logger.info("📊 Initializing database...")
        create_all_tables()
        logger.info("✅ Database initialized successfully")
        
        # Run startup tasks
        await startup_tasks()
        
        logger.info("🎉 Aurex Launchpad™ started successfully!")
        
        yield  # Application is running
        
    except Exception as e:
        logger.error(f"❌ Startup failed: {e}")
        raise
    
    # Shutdown
    logger.info("🛑 Shutting down Aurex Launchpad™...")
    await shutdown_tasks()
    logger.info("✅ Aurex Launchpad™ shut down successfully!")

async def startup_tasks():
    """Run startup tasks"""
    try:
        logger.info("⚙️ Setting up background services...")
        logger.info("📈 Initializing metrics collection...")
        logger.info("🔒 Validating security configuration...")
        
        # Validate required environment variables
        required_vars = ["SECRET_KEY", "JWT_SECRET_KEY"]
        missing_vars = [var for var in required_vars if not getattr(settings, var, None)]
        
        if missing_vars:
            raise ValueError(f"Missing required environment variables: {', '.join(missing_vars)}")
        
        logger.info("✅ All startup tasks completed successfully")
        
    except Exception as e:
        logger.error(f"❌ Startup tasks failed: {e}")
        raise

async def shutdown_tasks():
    """Run shutdown tasks"""
    try:
        logger.info("🧹 Running cleanup tasks...")
        logger.info("📊 Closing database connections...")
        
        # Close database connections
        engine.dispose()
        
        logger.info("✅ All shutdown tasks completed")
        
    except Exception as e:
        logger.error(f"❌ Shutdown tasks failed: {e}")

# ================================================================================
# FASTAPI APPLICATION SETUP
# ================================================================================

app = FastAPI(
    title="Aurex Launchpad™",
    description="""
    **ESG Assessment and Sustainability Management Platform**
    
    A comprehensive platform for managing ESG (Environmental, Social, Governance) assessments,
    sustainability reporting, and regulatory compliance.
    
    ## Features
    
    * **🔐 Enterprise Authentication** - JWT-based authentication with RBAC
    * **📊 Multi-framework ESG Assessment** - Support for GRI, SASB, TCFD, CDP, ISO14064
    * **🤖 AI-powered Document Intelligence** - Automated data extraction and analysis
    * **📈 Real-time Analytics** - Comprehensive dashboards and reporting
    * **🏢 Multi-tenant Architecture** - Organization-based access control
    * **🔒 Advanced Security** - Rate limiting, request validation, audit logging
    
    ## API Endpoints
    
    * **Authentication**: `/api/v1/auth/*` - User registration, login, JWT management
    * **Organizations**: `/api/v1/organizations/*` - Multi-tenant organization management
    * **Assessments**: `/api/v1/assessments/*` - ESG assessment creation and management
    * **Documents**: `/api/v1/documents/*` - Document upload and AI processing
    * **Analytics**: `/api/v1/analytics/*` - Dashboards, reports, and benchmarking
    * **Administration**: `/api/v1/admin/*` - System administration and monitoring
    
    ## Security
    
    All endpoints (except public ones) require JWT authentication. Include the token in the
    Authorization header: `Bearer <your-jwt-token>`
    """,
    version=settings.APP_VERSION,
    docs_url="/docs" if settings.ENABLE_SWAGGER_UI else None,
    redoc_url="/redoc" if settings.ENABLE_REDOC else None,
    openapi_url="/openapi.json" if (settings.ENABLE_SWAGGER_UI or settings.ENABLE_REDOC) else None,
    lifespan=lifespan,
    contact={
        "name": "Aurigraph Support",
        "url": "https://aurigraph.io/support",
        "email": "support@aurigraph.io"
    },
    license_info={
        "name": "Proprietary",
        "url": "https://aurigraph.io/license"
    },
    servers=[
        {
            "url": "https://dev.aurigraph.io",
            "description": "Development server"
        },
        {
            "url": "http://localhost:8001",
            "description": "Local development server"
        }
    ]
)

# ================================================================================
# MIDDLEWARE CONFIGURATION
# ================================================================================

# Security middleware (applied first)
app.add_middleware(SecurityMiddleware)

# Logging and performance middleware
app.add_middleware(LoggingMiddleware)
app.add_middleware(PerformanceMiddleware)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
    allow_headers=["*"],
    expose_headers=["X-Request-ID", "X-Total-Count"]
)

# Trusted host middleware for production
if settings.ENVIRONMENT == "production":
    app.add_middleware(
        TrustedHostMiddleware,
        allowed_hosts=["dev.aurigraph.io", "*.aurigraph.io", "localhost", "127.0.0.1"]
    )

# Compression middleware
app.add_middleware(GZipMiddleware, minimum_size=1000)

# ================================================================================
# ERROR HANDLERS
# ================================================================================

@app.exception_handler(404)
async def not_found_handler(request: Request, exc: HTTPException):
    """Handle 404 errors with helpful information"""
    return JSONResponse(
        status_code=404,
        content={
            "error": "Not Found",
            "message": "The requested resource was not found",
            "path": request.url.path,
            "method": request.method,
            "available_endpoints": {
                "health": "/health",
                "docs": "/docs" if settings.ENABLE_SWAGGER_UI else "disabled",
                "api": "/api/v1/"
            },
            "timestamp": datetime.utcnow().isoformat()
        }
    )

@app.exception_handler(500)
async def internal_error_handler(request: Request, exc: Exception):
    """Handle 500 errors"""
    logger.error(f"Internal server error on {request.method} {request.url.path}: {str(exc)}")
    
    return JSONResponse(
        status_code=500,
        content={
            "error": "Internal Server Error",
            "message": "An internal error occurred. Please try again later.",
            "request_id": getattr(request.state, "request_id", "unknown"),
            "timestamp": datetime.utcnow().isoformat()
        }
    )

@app.exception_handler(422)
async def validation_error_handler(request: Request, exc: HTTPException):
    """Handle validation errors"""
    return JSONResponse(
        status_code=422,
        content={
            "error": "Validation Error",
            "message": "Request validation failed",
            "details": exc.detail if hasattr(exc, 'detail') else "Invalid request data",
            "timestamp": datetime.utcnow().isoformat()
        }
    )

# ================================================================================
# API ROUTES
# ================================================================================

# Health and status endpoints (no auth required)
app.include_router(health_router, prefix="/api/v1", tags=["Health"])

# Authentication routes (public registration/login)
app.include_router(auth_router, prefix="/api/v1/auth", tags=["Authentication"])

# Protected API routes (require authentication)
app.include_router(organizations_router, tags=["Organizations"])
app.include_router(assessments_router, tags=["ESG Assessments"])
app.include_router(documents_router, tags=["Documents"])
app.include_router(analytics_router, tags=["Analytics"])
app.include_router(admin_router, tags=["Administration"])

# ================================================================================
# ROOT ENDPOINTS
# ================================================================================

@app.get("/", tags=["Root"])
async def root():
    """Root endpoint with platform information"""
    return {
        "platform": "Aurex Launchpad™",
        "description": "ESG Assessment and Sustainability Management Platform",
        "version": settings.APP_VERSION,
        "environment": settings.ENVIRONMENT,
        "status": "operational",
        "features": [
            "🔐 Enterprise Authentication with RBAC",
            "📊 Multi-framework ESG Assessment (GRI, SASB, TCFD, CDP, ISO14064)",
            "🤖 AI-powered Document Intelligence",
            "📈 Real-time Analytics and Reporting",
            "🏢 Multi-tenant Architecture",
            "🔒 Advanced Security and Audit Logging"
        ],
        "api_documentation": {
            "swagger_ui": "/docs" if settings.ENABLE_SWAGGER_UI else "disabled",
            "redoc": "/redoc" if settings.ENABLE_REDOC else "disabled"
        },
        "endpoints": {
            "health": "/api/v1/health",
            "authentication": "/api/v1/auth",
            "organizations": "/api/v1/organizations",
            "assessments": "/api/v1/assessments",
            "documents": "/api/v1/documents",
            "analytics": "/api/v1/analytics",
            "admin": "/api/v1/admin"
        },
        "timestamp": datetime.utcnow().isoformat()
    }

@app.get("/version", tags=["Root"])
async def version():
    """Get application version information"""
    return {
        "version": settings.APP_VERSION,
        "app_name": settings.APP_NAME,
        "environment": settings.ENVIRONMENT,
        "debug": settings.DEBUG,
        "timestamp": datetime.utcnow().isoformat()
    }

# ================================================================================
# DEVELOPMENT ENDPOINTS (DEBUG ONLY)
# ================================================================================

if settings.DEBUG:
    @app.get("/debug/config", tags=["Debug"])
    async def debug_config():
        """Get application configuration (debug only)"""
        return {
            "app_name": settings.APP_NAME,
            "version": settings.APP_VERSION,
            "environment": settings.ENVIRONMENT,
            "debug": settings.DEBUG,
            "cors_origins": settings.CORS_ORIGINS,
            "database_url": settings.DATABASE_URL.replace(
                settings.DATABASE_URL.split('@')[0].split('//')[1], '***:***'
            ) if '@' in settings.DATABASE_URL else "Not configured",
            "redis_url": settings.REDIS_URL,
            "features": {
                "swagger_ui": settings.ENABLE_SWAGGER_UI,
                "redoc": settings.ENABLE_REDOC,
                "flower": settings.ENABLE_FLOWER
            }
        }
    
    @app.get("/debug/routes", tags=["Debug"])
    async def debug_routes():
        """List all available routes (debug only)"""
        routes = []
        for route in app.routes:
            if hasattr(route, 'methods') and hasattr(route, 'path'):
                routes.append({
                    "path": route.path,
                    "methods": list(route.methods),
                    "name": getattr(route, 'name', 'unknown')
                })
        
        return {"routes": routes, "total": len(routes)}

# ================================================================================
# APPLICATION STARTUP
# ================================================================================

if __name__ == "__main__":
    print(f"""
🚀 AUREX LAUNCHPAD™ STARTING
============================
🌐 Host: {settings.DATABASE_URL.split('@')[1].split('/')[0] if '@' in settings.DATABASE_URL else 'localhost'}
🔌 Port: 8001
🔒 SSL: Disabled (Development)
🐛 Debug: {'Enabled' if settings.DEBUG else 'Disabled'}
📊 Database: {'Configured' if settings.DATABASE_URL else 'Not configured'}
🚀 Environment: {settings.ENVIRONMENT}
📚 Docs: {'http://localhost:8001/docs' if settings.ENABLE_SWAGGER_UI else 'Disabled'}
""")
    
    # Run the application
    uvicorn.run(
        "app:app",
        host="0.0.0.0",
        port=8001,
        reload=settings.DEBUG,
        log_level=settings.LOG_LEVEL.lower(),
        access_log=True,
        workers=1 if settings.DEBUG else 4
    )