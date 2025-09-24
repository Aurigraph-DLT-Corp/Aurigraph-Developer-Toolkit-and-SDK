"""
Aurex Sylvagraph - Drone Operations API Router
RESTful API endpoints for drone fleet management, flight planning, and imagery processing
"""

from typing import Dict, List, Optional, Any
from datetime import datetime, timedelta

from fastapi import APIRouter, Depends, HTTPException, Query, Body, UploadFile, File, Form
from pydantic import BaseModel, Field
import structlog

from ..services.ipfs_service import ipfs_service

logger = structlog.get_logger(__name__)

router = APIRouter()


class DroneRegistrationRequest(BaseModel):
    """Request model for drone registration"""
    drone_id: str = Field(..., example="DJI_001")
    name: str = Field(..., example="Phantom 4 RTK")
    drone_type: str = Field(..., example="dji_phantom")
    manufacturer: str = Field(..., example="DJI")
    model: str = Field(..., example="Phantom 4 RTK")
    serial_number: str = Field(..., example="123456789")
    max_flight_time_minutes: int = Field(..., ge=1, example=30)
    max_range_meters: int = Field(..., ge=1, example=7000)
    max_altitude_meters: int = Field(..., ge=1, example=500)
    payload_capacity_grams: int = Field(..., ge=0, example=1388)
    camera_specs: Optional[Dict[str, Any]] = Field(default=None)
    sensor_types: Optional[List[str]] = Field(default=None)


class OperatorRegistrationRequest(BaseModel):
    """Request model for operator registration"""
    operator_id: str = Field(..., example="PILOT_001")
    first_name: str = Field(..., example="John")
    last_name: str = Field(..., example="Smith")
    phone_number: str = Field(..., example="+1234567890")
    email: str = Field(..., example="pilot@example.com")
    license_number: str = Field(..., example="107.123456")
    certification_level: str = Field(..., example="Part 107")
    certification_expiry: str = Field(..., example="2025-12-31")
    flight_experience_hours: float = Field(default=0.0, ge=0)


class FlightPlanRequest(BaseModel):
    """Request model for flight plan creation"""
    flight_id: str = Field(..., example="FLIGHT_001")
    flight_name: str = Field(..., example="Monthly Monitoring Survey")
    project_id: str = Field(..., example="proj-123")
    drone_id: str = Field(..., example="DJI_001")
    operator_id: str = Field(..., example="PILOT_001")
    mission_type: str = Field(..., example="monitoring")
    mission_objective: str = Field(..., example="Collect high-resolution imagery for forest monitoring")
    scheduled_date: str = Field(..., example="2024-12-01T10:00:00Z")
    estimated_duration_minutes: int = Field(..., ge=1, example=45)
    flight_altitude_meters: float = Field(..., ge=1, example=120)
    ground_speed_ms: Optional[float] = Field(default=None, example=10.0)
    overlap_percentage: int = Field(default=80, ge=50, le=95)
    sidelap_percentage: int = Field(default=70, ge=50, le=95)
    area_hectares: float = Field(..., ge=0.1, example=25.5)
    boundary_coordinates: List[List[float]] = Field(..., example=[[0.0, 0.0], [1.0, 0.0], [1.0, 1.0], [0.0, 1.0], [0.0, 0.0]])
    waypoints: Optional[List[Dict[str, Any]]] = Field(default=None)


class FlightLogRequest(BaseModel):
    """Request model for flight log creation"""
    flight_plan_id: str
    takeoff_time: str = Field(..., example="2024-12-01T10:00:00Z")
    landing_time: Optional[str] = Field(default=None, example="2024-12-01T10:45:00Z")
    battery_start_percentage: int = Field(..., ge=0, le=100, example=100)
    battery_end_percentage: Optional[int] = Field(default=None, ge=0, le=100, example=35)
    weather_conditions: Optional[Dict[str, Any]] = Field(default=None)
    mission_completed: bool = Field(default=False)
    images_captured: int = Field(default=0, ge=0)
    videos_captured: int = Field(default=0, ge=0)
    issues_encountered: Optional[List[str]] = Field(default=None)
    operator_notes: Optional[str] = Field(default=None)


class ProcessingJobRequest(BaseModel):
    """Request model for drone data processing job"""
    job_name: str = Field(..., example="Orthomosaic Generation")
    project_id: str = Field(..., example="proj-123")
    flight_plan_id: str = Field(..., example="flight-456")
    job_type: str = Field(..., example="orthomosaic")
    input_images: List[str] = Field(..., example=["img_001.jpg", "img_002.jpg"])
    processing_software: str = Field(..., example="Pix4D")
    processing_parameters: Optional[Dict[str, Any]] = Field(default=None)


@router.post("/drones/register")
async def register_drone(request: DroneRegistrationRequest):
    """
    Register a new drone in the fleet
    
    Args:
        request: Drone registration details
        
    Returns:
        Registration confirmation with drone ID
    """
    try:
        # In a real implementation, this would save to database
        drone_data = {
            **request.dict(),
            "registration_date": datetime.utcnow().isoformat(),
            "operational_status": "available",
            "flight_hours_total": 0.0,
            "last_maintenance_date": None,
            "next_maintenance_date": None
        }
        
        logger.info(f"Drone registered: {request.drone_id}")
        return {
            "status": "success",
            "message": "Drone registered successfully",
            "drone_id": request.drone_id,
            "registration_data": drone_data
        }
        
    except Exception as e:
        logger.error(f"Failed to register drone: {e}")
        raise HTTPException(
            status_code=500,
            detail="Failed to register drone"
        )


@router.post("/operators/register")
async def register_operator(request: OperatorRegistrationRequest):
    """
    Register a new drone operator
    
    Args:
        request: Operator registration details
        
    Returns:
        Registration confirmation with operator ID
    """
    try:
        # In a real implementation, this would save to database
        operator_data = {
            **request.dict(),
            "registration_date": datetime.utcnow().isoformat(),
            "active_status": True,
            "commercial_flights": 0,
            "last_training_date": None
        }
        
        logger.info(f"Operator registered: {request.operator_id}")
        return {
            "status": "success",
            "message": "Operator registered successfully",
            "operator_id": request.operator_id,
            "registration_data": operator_data
        }
        
    except Exception as e:
        logger.error(f"Failed to register operator: {e}")
        raise HTTPException(
            status_code=500,
            detail="Failed to register operator"
        )


@router.post("/flights/plan")
async def create_flight_plan(request: FlightPlanRequest):
    """
    Create a new flight plan
    
    Args:
        request: Flight plan details
        
    Returns:
        Flight plan creation confirmation
    """
    try:
        # Validate scheduled date
        scheduled_datetime = datetime.fromisoformat(request.scheduled_date.replace('Z', '+00:00'))
        
        # Calculate estimated area coverage
        estimated_images = int((request.area_hectares * 10000) / (
            (request.flight_altitude_meters * 0.1) ** 2 * 
            (request.overlap_percentage / 100) * 
            (request.sidelap_percentage / 100)
        ))
        
        # In a real implementation, this would save to database
        flight_plan_data = {
            **request.dict(),
            "created_date": datetime.utcnow().isoformat(),
            "status": "planned",
            "approval_status": "pending",
            "estimated_images": estimated_images,
            "notam_checked": False,
            "safety_checklist_completed": False
        }
        
        logger.info(f"Flight plan created: {request.flight_id}")
        return {
            "status": "success",
            "message": "Flight plan created successfully",
            "flight_id": request.flight_id,
            "flight_plan_data": flight_plan_data,
            "estimated_images": estimated_images
        }
        
    except ValueError as e:
        raise HTTPException(status_code=400, detail=f"Invalid date format: {e}")
    except Exception as e:
        logger.error(f"Failed to create flight plan: {e}")
        raise HTTPException(
            status_code=500,
            detail="Failed to create flight plan"
        )


@router.post("/flights/{flight_id}/approve")
async def approve_flight_plan(
    flight_id: str,
    airspace_authorization: Optional[str] = Body(default=None),
    notes: Optional[str] = Body(default=None)
):
    """
    Approve a flight plan for execution
    
    Args:
        flight_id: Flight plan ID
        airspace_authorization: Airspace authorization reference
        notes: Approval notes
        
    Returns:
        Approval confirmation
    """
    try:
        # In a real implementation, this would update database
        approval_data = {
            "flight_id": flight_id,
            "approval_status": "approved",
            "approved_by": "system",  # Would be actual user ID
            "approved_at": datetime.utcnow().isoformat(),
            "airspace_authorization": airspace_authorization,
            "approval_notes": notes
        }
        
        logger.info(f"Flight plan approved: {flight_id}")
        return {
            "status": "success",
            "message": "Flight plan approved",
            "approval_data": approval_data
        }
        
    except Exception as e:
        logger.error(f"Failed to approve flight plan: {e}")
        raise HTTPException(
            status_code=500,
            detail="Failed to approve flight plan"
        )


@router.post("/flights/logs")
async def create_flight_log(request: FlightLogRequest):
    """
    Create a flight execution log
    
    Args:
        request: Flight log details
        
    Returns:
        Flight log creation confirmation
    """
    try:
        # Parse timestamps
        takeoff_datetime = datetime.fromisoformat(request.takeoff_time.replace('Z', '+00:00'))
        landing_datetime = None
        actual_duration_minutes = None
        
        if request.landing_time:
            landing_datetime = datetime.fromisoformat(request.landing_time.replace('Z', '+00:00'))
            duration_delta = landing_datetime - takeoff_datetime
            actual_duration_minutes = int(duration_delta.total_seconds() / 60)
        
        # In a real implementation, this would save to database
        flight_log_data = {
            **request.dict(),
            "log_created_at": datetime.utcnow().isoformat(),
            "actual_duration_minutes": actual_duration_minutes,
            "flight_completed": request.mission_completed and request.landing_time is not None
        }
        
        logger.info(f"Flight log created for flight: {request.flight_plan_id}")
        return {
            "status": "success",
            "message": "Flight log created successfully",
            "flight_log_data": flight_log_data
        }
        
    except ValueError as e:
        raise HTTPException(status_code=400, detail=f"Invalid timestamp format: {e}")
    except Exception as e:
        logger.error(f"Failed to create flight log: {e}")
        raise HTTPException(
            status_code=500,
            detail="Failed to create flight log"
        )


@router.post("/imagery/upload")
async def upload_drone_imagery(
    file: UploadFile = File(...),
    project_id: str = Form(...),
    flight_plan_id: str = Form(...),
    image_id: str = Form(...),
    sequence_number: int = Form(...),
    image_type: str = Form(...),
    camera_model: str = Form(...),
    capture_timestamp: str = Form(...),
    altitude_meters: float = Form(...),
    latitude: float = Form(...),
    longitude: float = Form(...),
    metadata: str = Form(default="{}")
):
    """
    Upload drone-captured imagery with metadata
    
    Args:
        file: Drone image file
        project_id: Associated project ID
        flight_plan_id: Flight plan ID
        image_id: Unique image identifier
        sequence_number: Image sequence number
        image_type: Type of image (RGB, multispectral, thermal)
        camera_model: Camera model used
        capture_timestamp: When image was captured
        altitude_meters: Altitude when image was captured
        latitude: GPS latitude
        longitude: GPS longitude
        metadata: Additional metadata as JSON string
        
    Returns:
        Upload confirmation with IPFS storage info
    """
    try:
        # Parse metadata
        import json
        parsed_metadata = json.loads(metadata)
        
        # Add standard drone imagery metadata
        drone_metadata = {
            "image_id": image_id,
            "sequence_number": sequence_number,
            "image_type": image_type,
            "camera_model": camera_model,
            "capture_timestamp": capture_timestamp,
            "altitude_meters": altitude_meters,
            "latitude": latitude,
            "longitude": longitude,
            "gps_coordinates": [longitude, latitude],
            **parsed_metadata
        }
        
        # Upload to IPFS using drone data method
        ipfs_result = await ipfs_service.upload_drone_data(
            file=file,
            project_id=project_id,
            flight_id=flight_plan_id,
            drone_metadata=drone_metadata
        )
        
        # In a real implementation, this would also save to database
        imagery_record = {
            "filename": file.filename,
            "project_id": project_id,
            "flight_plan_id": flight_plan_id,
            "image_id": image_id,
            "sequence_number": sequence_number,
            "image_type": image_type,
            "camera_model": camera_model,
            "capture_timestamp": capture_timestamp,
            "altitude_meters": altitude_meters,
            "latitude": latitude,
            "longitude": longitude,
            "file_size_mb": ipfs_result["file_size"] / (1024 * 1024),
            "processing_status": "raw",
            "ipfs_hash": ipfs_result["ipfs_hash"],
            "metadata_hash": ipfs_result["metadata_hash"],
            "upload_timestamp": datetime.utcnow().isoformat()
        }
        
        logger.info(f"Drone imagery uploaded: {file.filename} -> {ipfs_result['ipfs_hash']}")
        return {
            "status": "success",
            "message": "Drone imagery uploaded successfully",
            "ipfs_storage": ipfs_result,
            "imagery_record": imagery_record
        }
        
    except json.JSONDecodeError:
        raise HTTPException(status_code=400, detail="Invalid metadata JSON format")
    except Exception as e:
        logger.error(f"Failed to upload drone imagery: {e}")
        raise HTTPException(
            status_code=500,
            detail="Failed to upload drone imagery"
        )


@router.post("/processing/jobs")
async def submit_processing_job(request: ProcessingJobRequest):
    """
    Submit a drone data processing job
    
    Args:
        request: Processing job details
        
    Returns:
        Job submission confirmation
    """
    try:
        # Generate job ID
        job_id = f"drone_proc_{request.project_id}_{datetime.utcnow().strftime('%Y%m%d_%H%M%S')}"
        
        # Estimate processing time based on job type and number of images
        estimated_hours = {
            "orthomosaic": len(request.input_images) * 0.1,
            "3d_model": len(request.input_images) * 0.2,
            "point_cloud": len(request.input_images) * 0.15,
            "volume_calculation": len(request.input_images) * 0.05
        }.get(request.job_type, len(request.input_images) * 0.1)
        
        estimated_completion = datetime.utcnow() + timedelta(hours=estimated_hours)
        
        # In a real implementation, this would be queued in Celery or similar
        job_data = {
            "job_id": job_id,
            **request.dict(),
            "status": "pending",
            "priority": 0,
            "progress_percentage": 0.0,
            "current_step": "queued",
            "created_at": datetime.utcnow().isoformat(),
            "estimated_completion": estimated_completion.isoformat(),
            "estimated_duration_hours": estimated_hours
        }
        
        logger.info(f"Drone processing job submitted: {job_id}")
        return {
            "status": "success",
            "message": "Processing job submitted successfully",
            "job_id": job_id,
            "job_data": job_data
        }
        
    except Exception as e:
        logger.error(f"Failed to submit processing job: {e}")
        raise HTTPException(
            status_code=500,
            detail="Failed to submit processing job"
        )


@router.get("/drones")
async def list_drones(
    status: Optional[str] = Query(default=None),
    limit: int = Query(default=50, ge=1, le=100)
):
    """
    List registered drones
    
    Args:
        status: Filter by operational status
        limit: Maximum number of drones to return
        
    Returns:
        List of registered drones
    """
    try:
        # In a real implementation, this would query the database
        mock_drones = [
            {
                "drone_id": "DJI_001",
                "name": "Phantom 4 RTK",
                "drone_type": "dji_phantom",
                "operational_status": "available",
                "flight_hours_total": 25.5,
                "last_flight_date": "2024-11-15T14:30:00Z"
            },
            {
                "drone_id": "DJI_002",
                "name": "Mavic 3 Enterprise",
                "drone_type": "dji_mavic",
                "operational_status": "maintenance",
                "flight_hours_total": 42.8,
                "last_flight_date": "2024-11-10T09:15:00Z"
            }
        ]
        
        # Apply status filter if provided
        if status:
            mock_drones = [d for d in mock_drones if d.get("operational_status") == status]
        
        # Apply limit
        mock_drones = mock_drones[:limit]
        
        return {
            "status": "success",
            "total_drones": len(mock_drones),
            "drones": mock_drones
        }
        
    except Exception as e:
        logger.error(f"Failed to list drones: {e}")
        raise HTTPException(
            status_code=500,
            detail="Failed to list drones"
        )


@router.get("/flights")
async def list_flights(
    project_id: Optional[str] = Query(default=None),
    status: Optional[str] = Query(default=None),
    limit: int = Query(default=50, ge=1, le=100)
):
    """
    List flight plans
    
    Args:
        project_id: Filter by project ID
        status: Filter by flight status
        limit: Maximum number of flights to return
        
    Returns:
        List of flight plans
    """
    try:
        # In a real implementation, this would query the database
        mock_flights = [
            {
                "flight_id": "FLIGHT_001",
                "flight_name": "Monthly Monitoring Survey",
                "project_id": "proj-123",
                "status": "completed",
                "scheduled_date": "2024-11-15T10:00:00Z",
                "drone_id": "DJI_001",
                "operator_id": "PILOT_001",
                "mission_type": "monitoring"
            },
            {
                "flight_id": "FLIGHT_002", 
                "flight_name": "Baseline Assessment",
                "project_id": "proj-456",
                "status": "planned",
                "scheduled_date": "2024-12-01T09:00:00Z",
                "drone_id": "DJI_002",
                "operator_id": "PILOT_002",
                "mission_type": "mapping"
            }
        ]
        
        # Apply filters
        if project_id:
            mock_flights = [f for f in mock_flights if f.get("project_id") == project_id]
        if status:
            mock_flights = [f for f in mock_flights if f.get("status") == status]
        
        # Apply limit
        mock_flights = mock_flights[:limit]
        
        return {
            "status": "success",
            "total_flights": len(mock_flights),
            "flights": mock_flights
        }
        
    except Exception as e:
        logger.error(f"Failed to list flights: {e}")
        raise HTTPException(
            status_code=500,
            detail="Failed to list flights"
        )


@router.get("/processing/jobs/{job_id}")
async def get_processing_job_status(job_id: str):
    """
    Get processing job status
    
    Args:
        job_id: Processing job ID
        
    Returns:
        Job status and progress information
    """
    try:
        # In a real implementation, this would query the database/job queue
        mock_job_status = {
            "job_id": job_id,
            "job_name": "Orthomosaic Generation",
            "status": "processing",
            "progress_percentage": 65.0,
            "current_step": "Creating orthomosaic tiles",
            "started_at": "2024-11-20T14:30:00Z",
            "estimated_completion": "2024-11-20T16:30:00Z",
            "output_products": [],
            "quality_metrics": None,
            "error_message": None
        }
        
        return {
            "status": "success",
            "job_status": mock_job_status
        }
        
    except Exception as e:
        logger.error(f"Failed to get job status: {e}")
        raise HTTPException(
            status_code=500,
            detail="Failed to get processing job status"
        )


@router.get("/health")
async def health_check():
    """
    Drone operations service health check
    
    Returns:
        Service health status
    """
    try:
        return {
            "service": "drone_operations",
            "status": "healthy",
            "details": {
                "fleet_management": "operational",
                "flight_planning": "operational", 
                "imagery_processing": "operational",
                "ipfs_integration": "operational"
            },
            "timestamp": datetime.utcnow().isoformat()
        }
        
    except Exception as e:
        logger.error(f"Drone operations health check failed: {e}")
        return {
            "service": "drone_operations",
            "status": "unhealthy",
            "error": str(e),
            "timestamp": datetime.utcnow().isoformat()
        }