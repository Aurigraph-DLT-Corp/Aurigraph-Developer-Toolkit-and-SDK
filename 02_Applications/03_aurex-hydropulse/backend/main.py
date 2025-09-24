"""
Aurex HydroPulse Water Management API
Comprehensive water management system with AWD education, IoT integration, and analytics
Port: 8002
"""
from fastapi import FastAPI, Depends, HTTPException, WebSocket, WebSocketDisconnect, BackgroundTasks, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.gzip import GZipMiddleware
from fastapi.middleware.trustedhost import TrustedHostMiddleware
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, and_, or_
from sqlalchemy.exc import SQLAlchemyError, IntegrityError
from datetime import datetime, timedelta
from typing import List, Optional, Dict, Any
import json
import asyncio
from uuid import uuid4, UUID
import uvicorn
import os
import logging
import traceback
from contextlib import asynccontextmanager
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
from prometheus_fastapi_instrumentator import Instrumentator
import structlog

# Local database and services
from database import get_db
from audit_integration import log_user_action, get_current_user, require_permission

# Local imports
from models import (
    WaterFacility, IoTSensor, WaterUsageReading, WaterQualityReading,
    ConservationProject, AWDEducationModule, VibeScore, AlertRule,
    UserProgress, CommunityPost, OptimizationRecommendation
)
from schemas import (
    FacilityCreate, FacilityResponse, SensorCreate, SensorResponse,
    UsageReadingCreate, QualityReadingCreate, ProjectCreate, ProjectResponse,
    AWDModuleResponse, VibeScoreResponse, AlertResponse,
    OptimizationResponse, DashboardStats, WebSocketMessage
)
from services import (
    WaterManagementService, IoTDataProcessor, AWDEducationService,
    VibeCalculator, OptimizationEngine, AlertManager, WebSocketManager
)

# Initialize services
water_service = WaterManagementService()
iot_processor = IoTDataProcessor()
awd_service = AWDEducationService()
vibe_calculator = VibeCalculator()
optimization_engine = OptimizationEngine()
alert_manager = AlertManager()
websocket_manager = WebSocketManager()

# Configure structured logging
logging.basicConfig(level=logging.INFO)
logger = structlog.get_logger(__name__)

# Rate limiting configuration
limiter = Limiter(key_func=get_remote_address)

# Security configuration
ALLOWED_HOSTS = os.getenv("ALLOWED_HOSTS", "localhost,127.0.0.1,*.aurigraph.io").split(",")
MAX_REQUEST_SIZE = int(os.getenv("MAX_REQUEST_SIZE", "10485760"))  # 10MB

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifecycle management"""
    # Startup
    await db_manager.initialize()
    await audit_logger.initialize()
    
    # Create database tables
    async with db_manager.engine.begin() as conn:
        await conn.run_sync(db_manager.Base.metadata.create_all)
    
    # Initialize services
    await water_service.initialize()
    await iot_processor.initialize()
    await alert_manager.initialize()
    
    yield
    
    # Shutdown
    await websocket_manager.disconnect_all()
    await db_manager.close()

app = FastAPI(
    title="Aurex HydroPulse Water Management API",
    description="Comprehensive water management system with AWD education, IoT integration, and real-time analytics",
    version="3.3.0",
    docs_url="/docs" if os.getenv("ENVIRONMENT") != "production" else None,
    redoc_url="/redoc" if os.getenv("ENVIRONMENT") != "production" else None,
    lifespan=lifespan
)

# Security
security = HTTPBearer()

# Rate limiting middleware
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# Security Middleware Configuration
ENVIRONMENT = os.getenv("ENVIRONMENT", "development")

# Trusted Host Middleware
app.add_middleware(
    TrustedHostMiddleware, 
    allowed_hosts=ALLOWED_HOSTS
)

# GZip Middleware for compression
app.add_middleware(GZipMiddleware, minimum_size=1000)

# CORS Configuration
ALLOWED_ORIGINS_RAW = os.getenv("ALLOWED_ORIGINS", "https://dev.aurigraph.io,https://aurigraph.io,http://localhost:3002,http://localhost:5173")
allowed_origins = [origin.strip() for origin in ALLOWED_ORIGINS_RAW.split(",")]

if ENVIRONMENT == "production":
    allowed_origins = [origin for origin in allowed_origins if not origin.startswith("http://localhost")]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS", "HEAD"],
    allow_headers=["Authorization", "Content-Type", "X-Requested-With", "Accept", "Origin", "X-Request-ID"],
    max_age=3600,
)

# Prometheus metrics
if ENVIRONMENT == "production":
    Instrumentator().instrument(app).expose(app)

# Custom middleware for request logging and security headers
@app.middleware("http")
async def security_and_logging_middleware(request: Request, call_next):
    """Custom middleware for security headers, logging, and request validation"""
    request_id = str(uuid4())
    request.state.request_id = request_id
    
    start_time = datetime.utcnow()
    
    # Security headers
    security_headers = {
        "X-Content-Type-Options": "nosniff",
        "X-Frame-Options": "DENY",
        "X-XSS-Protection": "1; mode=block",
        "Strict-Transport-Security": "max-age=31536000; includeSubDomains",
        "Referrer-Policy": "strict-origin-when-cross-origin",
        "X-Request-ID": request_id,
        "Cache-Control": "no-cache, no-store, must-revalidate",
        "Pragma": "no-cache",
        "Expires": "0"
    }
    
    # Request size validation
    if request.method in ["POST", "PUT", "PATCH"]:
        content_length = request.headers.get("content-length")
        if content_length and int(content_length) > MAX_REQUEST_SIZE:
            return JSONResponse(
                status_code=413,
                content={"error": "Request entity too large", "max_size": MAX_REQUEST_SIZE},
                headers=security_headers
            )
    
    try:
        # Log incoming request
        await logger.ainfo(
            "Incoming request",
            method=request.method,
            url=str(request.url),
            headers=dict(request.headers),
            request_id=request_id,
            client_ip=get_remote_address(request)
        )
        
        response = await call_next(request)
        
        # Add security headers
        for header, value in security_headers.items():
            response.headers[header] = value
        
        # Log response
        process_time = (datetime.utcnow() - start_time).total_seconds()
        await logger.ainfo(
            "Request completed",
            method=request.method,
            url=str(request.url),
            status_code=response.status_code,
            process_time=process_time,
            request_id=request_id
        )
        
        return response
        
    except Exception as e:
        # Log error
        await logger.aerror(
            "Request failed",
            method=request.method,
            url=str(request.url),
            error=str(e),
            traceback=traceback.format_exc(),
            request_id=request_id
        )
        
        return JSONResponse(
            status_code=500,
            content={
                "error": "Internal server error",
                "message": "An unexpected error occurred",
                "request_id": request_id,
                "timestamp": datetime.utcnow().isoformat()
            },
            headers=security_headers
        )

# Comprehensive Error Handlers
@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    """Handle validation errors"""
    request_id = getattr(request.state, 'request_id', str(uuid4()))
    
    await logger.awarning(
        "Validation error",
        errors=exc.errors(),
        request_id=request_id,
        url=str(request.url)
    )
    
    return JSONResponse(
        status_code=422,
        content={
            "error": "validation_error",
            "message": "Request validation failed",
            "details": exc.errors(),
            "request_id": request_id,
            "timestamp": datetime.utcnow().isoformat()
        }
    )

@app.exception_handler(HTTPException)
async def http_exception_handler(request: Request, exc: HTTPException):
    """Handle HTTP exceptions"""
    request_id = getattr(request.state, 'request_id', str(uuid4()))
    
    await logger.awarning(
        "HTTP exception",
        status_code=exc.status_code,
        detail=exc.detail,
        request_id=request_id,
        url=str(request.url)
    )
    
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "error": "http_error",
            "message": exc.detail,
            "status_code": exc.status_code,
            "request_id": request_id,
            "timestamp": datetime.utcnow().isoformat()
        }
    )

@app.exception_handler(SQLAlchemyError)
async def sqlalchemy_exception_handler(request: Request, exc: SQLAlchemyError):
    """Handle database errors"""
    request_id = getattr(request.state, 'request_id', str(uuid4()))
    
    await logger.aerror(
        "Database error",
        error=str(exc),
        request_id=request_id,
        url=str(request.url)
    )
    
    if isinstance(exc, IntegrityError):
        return JSONResponse(
            status_code=409,
            content={
                "error": "data_conflict",
                "message": "Data integrity constraint violation",
                "request_id": request_id,
                "timestamp": datetime.utcnow().isoformat()
            }
        )
    
    return JSONResponse(
        status_code=503,
        content={
            "error": "database_error",
            "message": "Database operation failed",
            "request_id": request_id,
            "timestamp": datetime.utcnow().isoformat()
        }
    )

@app.exception_handler(Exception)
async def general_exception_handler(request: Request, exc: Exception):
    """Handle all other exceptions"""
    request_id = getattr(request.state, 'request_id', str(uuid4()))
    
    await logger.aerror(
        "Unexpected error",
        error=str(exc),
        traceback=traceback.format_exc(),
        request_id=request_id,
        url=str(request.url)
    )
    
    return JSONResponse(
        status_code=500,
        content={
            "error": "internal_server_error",
            "message": "An unexpected error occurred",
            "request_id": request_id,
            "timestamp": datetime.utcnow().isoformat()
        }
    )

# Enhanced Database dependency with error handling
async def get_db() -> AsyncSession:
    """Database session with comprehensive error handling"""
    async for session in db_manager.get_session():
        try:
            yield session
        except SQLAlchemyError as e:
            await logger.aerror("Database session error", error=str(e))
            await session.rollback()
            raise
        finally:
            await session.close()

# Security dependency for protected endpoints
async def verify_api_key(credentials: HTTPAuthorizationCredentials = Depends(security)):
    """Verify API key for additional security on sensitive endpoints"""
    api_key = os.getenv("HYDROPULSE_API_KEY")
    if api_key and credentials.credentials == api_key:
        return True
    return False

# Health and Status Endpoints
@app.get("/")
async def root():
    return {
        "message": "Aurex HydroPulse Water Management API",
        "version": "3.3.0",
        "status": "operational",
        "services": {
            "water_management": "active",
            "iot_sensors": "active",
            "awd_education": "active",
            "real_time_monitoring": "active"
        }
    }

@app.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "service": "aurex-hydropulse-api",
        "version": "3.3.0",
        "timestamp": datetime.utcnow().isoformat(),
        "database": "connected",
        "websockets": f"{len(websocket_manager.connections)} active connections"
    }

# Water Facility Management APIs
@app.post("/api/facilities", response_model=FacilityResponse)
@limiter.limit("10/minute")
async def create_facility(
    request: Request,
    facility: FacilityCreate,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Create a new water facility"""
    try:
        await logger.ainfo(
            "Creating new water facility",
            facility_name=facility.name,
            facility_type=facility.facility_type,
            user_id=current_user["id"],
            organization_id=current_user["organization_id"],
            request_id=getattr(request.state, 'request_id', None)
        )
        
        new_facility = await water_service.create_facility(db, facility, current_user["organization_id"])
        
        # Log audit event
        await audit_logger.log_event(
            action="water_facility.created",
            resource_type="water_facility",
            resource_id=str(new_facility.id),
            user_id=current_user["id"],
            organization_id=current_user["organization_id"],
            new_values=facility.dict()
        )
        
        await logger.ainfo(
            "Water facility created successfully",
            facility_id=str(new_facility.id),
            facility_name=new_facility.name,
            user_id=current_user["id"],
            request_id=getattr(request.state, 'request_id', None)
        )
        
        return new_facility
        
    except SQLAlchemyError as e:
        await logger.aerror(
            "Database error creating facility",
            error=str(e),
            facility_data=facility.dict(),
            user_id=current_user["id"],
            request_id=getattr(request.state, 'request_id', None)
        )
        raise HTTPException(
            status_code=503,
            detail="Database error occurred while creating facility"
        )
    except Exception as e:
        await logger.aerror(
            "Unexpected error creating facility",
            error=str(e),
            traceback=traceback.format_exc(),
            facility_data=facility.dict(),
            user_id=current_user["id"],
            request_id=getattr(request.state, 'request_id', None)
        )
        raise HTTPException(
            status_code=500,
            detail="An unexpected error occurred while creating facility"
        )

@app.get("/api/facilities", response_model=List[FacilityResponse])
async def get_facilities(
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Get all facilities for the organization"""
    facilities = await water_service.get_facilities(db, current_user["organization_id"])
    return facilities

@app.get("/api/facilities/{facility_id}", response_model=FacilityResponse)
async def get_facility(
    facility_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Get specific facility details"""
    facility = await water_service.get_facility(db, facility_id, current_user["organization_id"])
    if not facility:
        raise HTTPException(status_code=404, detail="Facility not found")
    return facility

@app.put("/api/facilities/{facility_id}", response_model=FacilityResponse)
async def update_facility(
    facility_id: UUID,
    facility_update: FacilityCreate,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Update facility information"""
    updated_facility = await water_service.update_facility(
        db, facility_id, facility_update, current_user["organization_id"]
    )
    if not updated_facility:
        raise HTTPException(status_code=404, detail="Facility not found")
    
    await audit_logger.log_event(
        action="water_facility.updated",
        resource_type="water_facility",
        resource_id=str(facility_id),
        user_id=current_user["id"],
        organization_id=current_user["organization_id"],
        new_values=facility_update.dict()
    )
    
    return updated_facility

# IoT Sensor Management APIs
@app.post("/api/sensors", response_model=SensorResponse)
async def create_sensor(
    sensor: SensorCreate,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Register a new IoT sensor"""
    new_sensor = await iot_processor.create_sensor(db, sensor, current_user["organization_id"])
    
    await audit_logger.log_event(
        action="iot_sensor.created",
        resource_type="iot_sensor",
        resource_id=str(new_sensor.id),
        user_id=current_user["id"],
        organization_id=current_user["organization_id"],
        new_values=sensor.dict()
    )
    
    return new_sensor

@app.get("/api/sensors", response_model=List[SensorResponse])
async def get_sensors(
    facility_id: Optional[UUID] = None,
    sensor_type: Optional[str] = None,
    status: Optional[str] = None,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Get sensors with optional filters"""
    sensors = await iot_processor.get_sensors(
        db, current_user["organization_id"], facility_id, sensor_type, status
    )
    return sensors

@app.post("/api/sensors/{sensor_id}/readings")
@limiter.limit("1000/hour")  # High limit for IoT data ingestion
async def ingest_sensor_data(
    request: Request,
    sensor_id: UUID,
    reading_data: Dict[str, Any],
    background_tasks: BackgroundTasks,
    db: AsyncSession = Depends(get_db)
):
    """Ingest real-time sensor data"""
    request_id = getattr(request.state, 'request_id', None)
    
    try:
        # Validate sensor data structure
        if not reading_data or not isinstance(reading_data, dict):
            raise HTTPException(
                status_code=400,
                detail="Invalid sensor data format"
            )
        
        await logger.ainfo(
            "Processing sensor data",
            sensor_id=str(sensor_id),
            data_keys=list(reading_data.keys()),
            timestamp=reading_data.get("timestamp"),
            request_id=request_id
        )
        
        # Process sensor reading
        reading = await iot_processor.process_reading(db, sensor_id, reading_data)
        
        # Background tasks for real-time processing
        background_tasks.add_task(
            iot_processor.analyze_anomalies, sensor_id, reading_data
        )
        background_tasks.add_task(
            websocket_manager.broadcast_sensor_data, sensor_id, reading_data
        )
        
        await logger.ainfo(
            "Sensor data processed successfully",
            sensor_id=str(sensor_id),
            reading_id=str(reading.id),
            volume_liters=reading_data.get("volume_liters"),
            request_id=request_id
        )
        
        return {
            "status": "success", 
            "reading_id": str(reading.id),
            "timestamp": reading.reading_timestamp.isoformat(),
            "request_id": request_id
        }
        
    except ValueError as e:
        await logger.awarning(
            "Invalid sensor data",
            sensor_id=str(sensor_id),
            error=str(e),
            reading_data=reading_data,
            request_id=request_id
        )
        raise HTTPException(
            status_code=400,
            detail=f"Invalid sensor data: {str(e)}"
        )
    except SQLAlchemyError as e:
        await logger.aerror(
            "Database error processing sensor data",
            sensor_id=str(sensor_id),
            error=str(e),
            reading_data=reading_data,
            request_id=request_id
        )
        raise HTTPException(
            status_code=503,
            detail="Database error occurred while processing sensor data"
        )
    except Exception as e:
        await logger.aerror(
            "Unexpected error processing sensor data",
            sensor_id=str(sensor_id),
            error=str(e),
            traceback=traceback.format_exc(),
            reading_data=reading_data,
            request_id=request_id
        )
        raise HTTPException(
            status_code=500,
            detail="An unexpected error occurred while processing sensor data"
        )

@app.get("/api/sensors/{sensor_id}/readings")
async def get_sensor_readings(
    sensor_id: UUID,
    start_date: Optional[datetime] = None,
    end_date: Optional[datetime] = None,
    limit: int = 100,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Get historical sensor readings"""
    readings = await iot_processor.get_readings(
        db, sensor_id, start_date, end_date, limit, current_user["organization_id"]
    )
    return readings

# Water Usage Analytics APIs
@app.get("/api/usage/analytics")
async def get_usage_analytics(
    facility_id: Optional[UUID] = None,
    period: str = "month",
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Get comprehensive water usage analytics"""
    analytics = await water_service.get_usage_analytics(
        db, current_user["organization_id"], facility_id, period
    )
    return analytics

@app.get("/api/usage/forecast")
async def get_usage_forecast(
    facility_id: UUID,
    days_ahead: int = 30,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Get AI-powered usage forecasting"""
    forecast = await optimization_engine.predict_usage(
        db, facility_id, days_ahead, current_user["organization_id"]
    )
    return forecast

# Water Quality Management APIs
@app.get("/api/quality/monitoring")
async def get_quality_monitoring(
    facility_id: Optional[UUID] = None,
    parameter: Optional[str] = None,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Get real-time water quality monitoring data"""
    quality_data = await water_service.get_quality_monitoring(
        db, current_user["organization_id"], facility_id, parameter
    )
    return quality_data

@app.get("/api/quality/compliance")
async def check_compliance(
    facility_id: UUID,
    standard: str = "WHO",
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Check water quality compliance against standards"""
    compliance = await water_service.check_quality_compliance(
        db, facility_id, standard, current_user["organization_id"]
    )
    return compliance

# Conservation Project Management APIs
@app.post("/api/conservation", response_model=ProjectResponse)
async def create_conservation_project(
    project: ProjectCreate,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Create a new conservation project"""
    new_project = await water_service.create_conservation_project(
        db, project, current_user["organization_id"]
    )
    
    await audit_logger.log_event(
        action="conservation_project.created",
        resource_type="conservation_project",
        resource_id=str(new_project.id),
        user_id=current_user["id"],
        organization_id=current_user["organization_id"],
        new_values=project.dict()
    )
    
    return new_project

@app.get("/api/conservation", response_model=List[ProjectResponse])
async def get_conservation_projects(
    status: Optional[str] = None,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Get conservation projects with ROI tracking"""
    projects = await water_service.get_conservation_projects(
        db, current_user["organization_id"], status
    )
    return projects

@app.get("/api/conservation/{project_id}/roi")
async def calculate_project_roi(
    project_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Calculate conservation project ROI and impact"""
    roi_data = await water_service.calculate_project_roi(
        db, project_id, current_user["organization_id"]
    )
    return roi_data

# AWD (Alternate Wetting & Drying) Education APIs
@app.get("/api/awd/modules", response_model=List[AWDModuleResponse])
async def get_awd_modules(
    category: Optional[str] = None,
    difficulty: Optional[str] = None,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Get AWD educational modules"""
    modules = await awd_service.get_modules(db, category, difficulty)
    return modules

@app.get("/api/awd/modules/{module_id}")
async def get_awd_module_content(
    module_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Get detailed module content and interactive elements"""
    content = await awd_service.get_module_content(db, module_id)
    if not content:
        raise HTTPException(status_code=404, detail="Module not found")
    return content

@app.post("/api/awd/progress")
async def track_learning_progress(
    module_id: UUID,
    progress_data: Dict[str, Any],
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Track user learning progress and completion"""
    progress = await awd_service.update_progress(
        db, current_user["id"], module_id, progress_data
    )
    
    await audit_logger.log_event(
        action="awd_progress.updated",
        resource_type="learning_progress",
        resource_id=str(module_id),
        user_id=current_user["id"],
        organization_id=current_user["organization_id"],
        new_values=progress_data
    )
    
    return progress

@app.get("/api/awd/calculator")
async def awd_methodology_calculator(
    crop_type: str,
    field_area: float,
    soil_type: str,
    climate_zone: str,
    db: AsyncSession = Depends(get_db)
):
    """AWD methodology calculations for specific conditions"""
    calculations = await awd_service.calculate_awd_parameters(
        crop_type, field_area, soil_type, climate_zone
    )
    return calculations

# VIBE Framework Scoring APIs
@app.get("/api/vibe/scores", response_model=List[VibeScoreResponse])
async def get_vibe_scores(
    facility_id: Optional[UUID] = None,
    metric_type: Optional[str] = None,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Get VIBE framework scores for water management"""
    scores = await vibe_calculator.get_scores(
        db, current_user["organization_id"], facility_id, metric_type
    )
    return scores

@app.post("/api/vibe/calculate")
async def calculate_vibe_scores(
    facility_id: UUID,
    background_tasks: BackgroundTasks,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Trigger VIBE score calculation for a facility"""
    background_tasks.add_task(
        vibe_calculator.calculate_facility_scores, db, facility_id
    )
    return {"status": "calculation_started", "facility_id": str(facility_id)}

# Optimization and Recommendations APIs
@app.get("/api/optimization/recommendations", response_model=List[OptimizationResponse])
async def get_optimization_recommendations(
    facility_id: Optional[UUID] = None,
    category: Optional[str] = None,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Get AI-powered water optimization recommendations"""
    recommendations = await optimization_engine.get_recommendations(
        db, current_user["organization_id"], facility_id, category
    )
    return recommendations

@app.post("/api/optimization/analyze")
async def analyze_optimization_potential(
    facility_id: UUID,
    background_tasks: BackgroundTasks,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Analyze water optimization potential for a facility"""
    background_tasks.add_task(
        optimization_engine.analyze_facility, db, facility_id, current_user["organization_id"]
    )
    return {"status": "analysis_started", "facility_id": str(facility_id)}

# Alert and Notification Management
@app.get("/api/alerts", response_model=List[AlertResponse])
async def get_alerts(
    facility_id: Optional[UUID] = None,
    severity: Optional[str] = None,
    status: Optional[str] = None,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Get water management alerts"""
    alerts = await alert_manager.get_alerts(
        db, current_user["organization_id"], facility_id, severity, status
    )
    return alerts

@app.post("/api/alerts/{alert_id}/acknowledge")
async def acknowledge_alert(
    alert_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Acknowledge an alert"""
    result = await alert_manager.acknowledge_alert(
        db, alert_id, current_user["id"], current_user["organization_id"]
    )
    
    await audit_logger.log_event(
        action="alert.acknowledged",
        resource_type="alert",
        resource_id=str(alert_id),
        user_id=current_user["id"],
        organization_id=current_user["organization_id"]
    )
    
    return result

# Dashboard and Analytics
@app.get("/api/dashboard", response_model=DashboardStats)
async def get_dashboard_stats(
    facility_id: Optional[UUID] = None,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Get comprehensive dashboard statistics"""
    stats = await water_service.get_dashboard_stats(
        db, current_user["organization_id"], facility_id
    )
    return stats

# Real-time WebSocket Endpoints
@app.websocket("/ws/monitoring/{facility_id}")
async def websocket_monitoring(websocket: WebSocket, facility_id: UUID):
    """Real-time monitoring WebSocket connection"""
    await websocket_manager.connect(websocket, f"facility_{facility_id}")
    try:
        while True:
            # Keep connection alive and handle client messages
            data = await websocket.receive_text()
            message = json.loads(data)
            
            if message.get("type") == "ping":
                await websocket.send_json({"type": "pong", "timestamp": datetime.utcnow().isoformat()})
                
    except WebSocketDisconnect:
        websocket_manager.disconnect(websocket, f"facility_{facility_id}")

@app.websocket("/ws/alerts")
async def websocket_alerts(websocket: WebSocket):
    """Real-time alerts WebSocket connection"""
    await websocket_manager.connect(websocket, "alerts")
    try:
        while True:
            await asyncio.sleep(1)  # Keep connection alive
    except WebSocketDisconnect:
        websocket_manager.disconnect(websocket, "alerts")

# Data Export and Integration APIs
@app.get("/api/export/usage")
async def export_usage_data(
    facility_id: UUID,
    start_date: datetime,
    end_date: datetime,
    format: str = "csv",
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Export water usage data for external analysis"""
    export_data = await water_service.export_usage_data(
        db, facility_id, start_date, end_date, format, current_user["organization_id"]
    )
    
    await audit_logger.log_event(
        action="data.exported",
        resource_type="usage_data",
        resource_id=str(facility_id),
        user_id=current_user["id"],
        organization_id=current_user["organization_id"],
        metadata={"export_format": format, "date_range": f"{start_date} to {end_date}"}
    )
    
    return export_data

# Community and Knowledge Sharing
@app.get("/api/community/posts")
async def get_community_posts(
    topic: Optional[str] = None,
    limit: int = 50,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Get community knowledge sharing posts"""
    posts = await awd_service.get_community_posts(db, topic, limit)
    return posts

@app.post("/api/community/posts")
async def create_community_post(
    post_data: Dict[str, Any],
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Create a new community knowledge sharing post"""
    post = await awd_service.create_community_post(
        db, current_user["id"], post_data
    )
    
    await audit_logger.log_event(
        action="community_post.created",
        resource_type="community_post",
        resource_id=str(post.id),
        user_id=current_user["id"],
        organization_id=current_user["organization_id"],
        new_values=post_data
    )
    
    return post

if __name__ == "__main__":
    port = int(os.getenv("PORT", "8002"))  # Standardized: aurex-hydropulse-api
    uvicorn.run(app, host="0.0.0.0", port=port)