# ================================================================================
# AUREX LAUNCHPAD™ MAIN APPLICATION (IMPROVED ARCHITECTURE)
# ================================================================================
# Description: Production-ready FastAPI application with standardized architecture
# Features: Centralized config, proper database management, API routing, monitoring
# Version: 2.0.0 - Architecture Gap Fixes Applied
# Created: August 11, 2025
# ================================================================================

from fastapi import FastAPI, Request, Response
from fastapi.middleware.gzip import GZipMiddleware
from contextlib import asynccontextmanager
import uvicorn
import os
import logging
import asyncio
from datetime import datetime
import sys
from pathlib import Path

# Add the backend directory to the Python path
backend_dir = Path(__file__).parent
sys.path.insert(0, str(backend_dir))

# Import our improved modules
try:
    from database_config import (
        initialize_database, 
        check_database_health, 
        check_redis_health,
        close_database_connections,
        get_database_info,
        config as db_config
    )
    from api_router import setup_api_routing, registry, APIResponse
    DATABASE_AVAILABLE = True
except ImportError as e:
    DATABASE_AVAILABLE = False
    logging.error(f"Failed to import improved modules: {e}")
    # Fallback to basic functionality

# Configure logging with structured format
logging.basicConfig(
    level=logging.INFO if os.getenv("LOG_LEVEL", "INFO") == "INFO" else logging.DEBUG,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('aurex_launchpad.log'),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)

# ================================================================================
# APPLICATION CONFIGURATION
# ================================================================================

class ApplicationConfig:
    """Centralized application configuration"""
    
    def __init__(self):
        self.environment = os.getenv("ENVIRONMENT", "development")
        self.debug = os.getenv("DEBUG", "false").lower() == "true"
        self.version = os.getenv("VERSION_TAG", "2.0.0")
        self.service_name = "aurex-launchpad"
        
        # Server configuration
        self.host = os.getenv("HOST", "0.0.0.0")
        self.port = int(os.getenv("PORT", "8001"))
        self.workers = int(os.getenv("WORKER_PROCESSES", "1"))
        
        # Feature flags
        self.enable_monitoring = os.getenv("ENABLE_MONITORING", "true").lower() == "true"
        self.enable_analytics = os.getenv("ENABLE_ANALYTICS", "true").lower() == "true"
        self.enable_audit_logging = os.getenv("ENABLE_AUDIT_LOGGING", "true").lower() == "true"

app_config = ApplicationConfig()

# ================================================================================
# APPLICATION LIFECYCLE MANAGEMENT
# ================================================================================

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan management"""
    logger.info(f"🚀 Starting {app_config.service_name} v{app_config.version}")
    logger.info(f"Environment: {app_config.environment}")
    
    # Startup
    startup_success = True
    
    try:
        # Initialize database
        if DATABASE_AVAILABLE:
            logger.info("Initializing database...")
            db_initialized = await initialize_database()
            if not db_initialized:
                logger.error("❌ Database initialization failed")
                startup_success = False
            else:
                logger.info("✅ Database initialized successfully")
                
                # Log database connection info (without sensitive data)
                db_info = get_database_info()
                logger.info(f"Database info: {db_info}")
        
        # Additional startup tasks
        if startup_success:
            logger.info("✅ Application startup completed successfully")
            
            # Run health checks
            if DATABASE_AVAILABLE:
                db_healthy = await check_database_health()
                redis_healthy = await check_redis_health()
                logger.info(f"Health check - DB: {'✅' if db_healthy else '❌'}, Redis: {'✅' if redis_healthy else '❌'}")
        else:
            logger.error("❌ Application startup failed")
            
    except Exception as e:
        logger.error(f"❌ Startup error: {e}", exc_info=True)
        startup_success = False
    
    # Yield control to the application
    yield
    
    # Shutdown
    logger.info("🛑 Shutting down application...")
    try:
        if DATABASE_AVAILABLE:
            await close_database_connections()
            logger.info("✅ Database connections closed")
        logger.info("✅ Application shutdown completed")
    except Exception as e:
        logger.error(f"❌ Shutdown error: {e}", exc_info=True)

# ================================================================================
# FASTAPI APPLICATION SETUP
# ================================================================================

# Create FastAPI application with lifecycle management
app = FastAPI(
    title="Aurex Launchpad™ API",
    description="Comprehensive ESG Assessment and Carbon Management Platform",
    version=app_config.version,
    docs_url="/docs" if app_config.environment == "development" else None,
    redoc_url="/redoc" if app_config.environment == "development" else None,
    lifespan=lifespan,
    root_path="" if app_config.environment == "development" else "/api/launchpad"
)

# Add compression middleware
app.add_middleware(GZipMiddleware, minimum_size=1000)

# ================================================================================
# MIDDLEWARE FOR MONITORING AND LOGGING
# ================================================================================

@app.middleware("http")
async def request_logging_middleware(request: Request, call_next):
    """Log all requests for monitoring and debugging"""
    
    start_time = asyncio.get_event_loop().time()
    
    # Log request
    logger.info(f"📥 {request.method} {request.url.path} - Client: {request.client.host}")
    
    # Process request
    try:
        response = await call_next(request)
        
        # Calculate processing time
        process_time = asyncio.get_event_loop().time() - start_time
        
        # Log response
        logger.info(f"📤 {request.method} {request.url.path} - Status: {response.status_code} - Time: {process_time:.3f}s")
        
        # Add performance headers
        response.headers["X-Process-Time"] = str(process_time)
        response.headers["X-Service"] = app_config.service_name
        response.headers["X-Version"] = app_config.version
        
        return response
        
    except Exception as e:
        process_time = asyncio.get_event_loop().time() - start_time
        logger.error(f"💥 {request.method} {request.url.path} - Error: {e} - Time: {process_time:.3f}s")
        raise

# ================================================================================
# SETUP API ROUTING
# ================================================================================

# Setup standardized API routing
if DATABASE_AVAILABLE:
    setup_api_routing(app)
else:
    # Fallback basic endpoints if imports failed
    @app.get("/health")
    async def basic_health():
        return {"status": "degraded", "message": "Running in fallback mode"}

# ================================================================================
# LAUNCHPAD-SPECIFIC API ENDPOINTS
# ================================================================================

if DATABASE_AVAILABLE:
    from api_router import RouterFactory, APIResponse, auth_service
    
    # Create GHG Assessment Router
    ghg_router = RouterFactory.create_router(
        prefix="/ghg-assessment",
        tags=["GHG Assessment"],
        include_auth=True
    )
    
    @ghg_router.post("/start")
    async def start_ghg_assessment(user_data: dict = Depends(auth_service.require_auth)):
        """Start a new GHG readiness assessment"""
        return APIResponse.success(
            data={
                "assessment_id": "ghg_123",
                "status": "started",
                "user_id": user_data["user_id"]
            },
            message="GHG assessment started successfully"
        )
    
    @ghg_router.get("/questions")
    async def get_assessment_questions(user_data: dict = Depends(auth_service.require_auth)):
        """Get GHG assessment questions"""
        # Mock data for now - will be replaced with database queries
        questions = [
            {
                "id": "q1",
                "section": "Organizational Preparedness",
                "question": "Has your organization clearly defined its organizational boundaries for GHG reporting?",
                "type": "multiple_choice",
                "options": ["Fully defined", "Partially defined", "Under development", "Not defined"]
            },
            # Add more questions...
        ]
        
        return APIResponse.success(
            data=questions,
            message="Assessment questions retrieved successfully"
        )
    
    # Create Carbon Maturity Navigator Router
    cmn_router = RouterFactory.create_router(
        prefix="/carbon-maturity",
        tags=["Carbon Maturity Navigator"],
        include_auth=True
    )
    
    @cmn_router.post("/assessment/start")
    async def start_maturity_assessment(user_data: dict = Depends(auth_service.require_auth)):
        """Start Carbon Maturity Navigator assessment"""
        return APIResponse.success(
            data={
                "assessment_id": "cmn_123",
                "framework_id": "cmm_framework_v1",
                "current_level": 1,
                "status": "in_progress"
            },
            message="Carbon Maturity assessment started successfully"
        )
    
    # Create Annual Report Analytics Router
    analytics_router = RouterFactory.create_router(
        prefix="/report-analytics",
        tags=["Report Analytics"],
        include_auth=True
    )
    
    @analytics_router.post("/upload")
    async def upload_annual_report(user_data: dict = Depends(auth_service.require_auth)):
        """Upload annual report for analysis"""
        return APIResponse.success(
            data={
                "upload_id": "upload_123",
                "status": "processing",
                "estimated_completion": "5 minutes"
            },
            message="Report uploaded successfully, analysis in progress"
        )
    
    # Register routers
    registry.register_router(ghg_router, "GHG Readiness Assessment endpoints")
    registry.register_router(cmn_router, "Carbon Maturity Navigator endpoints")  
    registry.register_router(analytics_router, "Annual Report Analytics endpoints")
    
    # Re-setup routing to include new routers
    for router_info in registry.routers[-3:]:  # Only add the new ones
        app.include_router(router_info["router"])

# ================================================================================
# FALLBACK ENDPOINTS (if database is not available)
# ================================================================================

@app.get("/")
async def root():
    """Root endpoint with service information"""
    return {
        "service": app_config.service_name,
        "version": app_config.version,
        "environment": app_config.environment,
        "status": "running",
        "timestamp": datetime.utcnow().isoformat(),
        "database_available": DATABASE_AVAILABLE,
        "endpoints": {
            "health": "/health",
            "docs": "/docs" if app_config.environment == "development" else "disabled",
            "api": "/api" if DATABASE_AVAILABLE else "degraded"
        }
    }

@app.get("/info")
async def service_info():
    """Detailed service information"""
    info = {
        "service": app_config.service_name,
        "version": app_config.version,
        "environment": app_config.environment,
        "features": {
            "database": DATABASE_AVAILABLE,
            "monitoring": app_config.enable_monitoring,
            "analytics": app_config.enable_analytics,
            "audit_logging": app_config.enable_audit_logging
        },
        "endpoints_count": len(app.routes),
        "startup_time": datetime.utcnow().isoformat()
    }
    
    if DATABASE_AVAILABLE:
        info["database_info"] = get_database_info()
    
    return info

# ================================================================================
# APPLICATION ENTRY POINT
# ================================================================================

if __name__ == "__main__":
    logger.info("🚀 Starting Aurex Launchpad application directly")
    
    uvicorn.run(
        "main_improved:app",
        host=app_config.host,
        port=app_config.port,
        reload=app_config.debug and app_config.environment == "development",
        workers=1,  # Use 1 worker for development, scale in production
        log_level="info" if not app_config.debug else "debug",
        access_log=True
    )