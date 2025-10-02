"""
Aurex Sylvagraph - Remote Sensing API Router
RESTful API endpoints for satellite imagery retrieval and analysis
"""

from typing import Dict, List, Optional, Any
from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, Query, Body
from pydantic import BaseModel, Field
import structlog

from ..services.remote_sensing_service import remote_sensing_service
from ..services.ipfs_service import ipfs_service

logger = structlog.get_logger(__name__)

router = APIRouter()


class ProjectBoundary(BaseModel):
    """Model for project boundary geometry"""
    type: str = Field(..., example="Polygon")
    coordinates: List[List[List[float]]] = Field(..., example=[[[0.0, 0.0], [1.0, 0.0], [1.0, 1.0], [0.0, 1.0], [0.0, 0.0]]])


class SatelliteImageryRequest(BaseModel):
    """Request model for satellite imagery retrieval"""
    project_boundary: ProjectBoundary
    start_date: str = Field(..., example="2024-01-01")
    end_date: str = Field(..., example="2024-12-31")
    cloud_cover_max: int = Field(default=30, ge=0, le=100)
    store_in_ipfs: bool = Field(default=True)


class VegetationIndexRequest(BaseModel):
    """Request model for vegetation index calculation"""
    project_boundary: ProjectBoundary
    start_date: str = Field(..., example="2024-01-01")
    end_date: str = Field(..., example="2024-12-31")
    satellite_type: str = Field(default="sentinel_2", example="sentinel_2")


class ChangeDetectionRequest(BaseModel):
    """Request model for forest change detection"""
    project_boundary: ProjectBoundary
    before_date: str = Field(..., example="2023-01-01")
    after_date: str = Field(..., example="2024-01-01")
    satellite_type: str = Field(default="sentinel_2", example="sentinel_2")
    store_results: bool = Field(default=True)


class SatelliteImageryResponse(BaseModel):
    """Response model for satellite imagery"""
    status: str
    collection_size: Optional[int]
    best_image: Optional[Dict[str, Any]]
    ipfs_storage: Optional[Dict[str, str]]


class VegetationIndexResponse(BaseModel):
    """Response model for vegetation indices"""
    status: str
    satellite_type: str
    analysis_period: str
    ndvi: Dict[str, Optional[float]]
    evi: Dict[str, Optional[float]]


class ChangeDetectionResponse(BaseModel):
    """Response model for change detection"""
    status: str
    analysis_type: str
    satellite_type: str
    before_date: str
    after_date: str
    results: Dict[str, float]
    ipfs_storage: Optional[Dict[str, str]]


@router.post("/initialize")
async def initialize_earth_engine(
    service_account_file: Optional[str] = Query(None)
):
    """
    Initialize Google Earth Engine authentication
    
    Args:
        service_account_file: Optional path to service account JSON file
        
    Returns:
        Initialization status
    """
    try:
        await remote_sensing_service.initialize_earth_engine(service_account_file)
        
        result = {
            "status": "success",
            "message": "Google Earth Engine initialized successfully",
            "timestamp": datetime.utcnow().isoformat()
        }
        
        logger.info("Earth Engine initialized via API")
        return result
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Earth Engine initialization failed: {e}")
        raise HTTPException(
            status_code=500,
            detail="Failed to initialize Earth Engine"
        )


@router.post("/landsat/imagery", response_model=SatelliteImageryResponse)
async def get_landsat_imagery(
    request: SatelliteImageryRequest,
    project_id: str = Query(...)
):
    """
    Retrieve Landsat imagery for project area
    
    Args:
        request: Imagery request parameters
        project_id: Associated project ID
        
    Returns:
        Landsat imagery information and download URLs
    """
    try:
        # Get Landsat imagery
        result = await remote_sensing_service.get_landsat_imagery(
            project_boundary=request.project_boundary.dict(),
            start_date=request.start_date,
            end_date=request.end_date,
            cloud_cover_max=request.cloud_cover_max
        )
        
        ipfs_storage = None
        
        # Store in IPFS if requested and imagery available
        if (request.store_in_ipfs and 
            result.get("status") == "success" and 
            result.get("best_image", {}).get("download_url")):
            
            try:
                ipfs_result = await remote_sensing_service.download_and_store_satellite_image(
                    download_url=result["best_image"]["download_url"],
                    project_id=project_id,
                    satellite_metadata=result["best_image"]
                )
                ipfs_storage = ipfs_result
                
            except Exception as e:
                logger.warning(f"Failed to store Landsat image in IPFS: {e}")
        
        response = SatelliteImageryResponse(
            status=result["status"],
            collection_size=result.get("collection_size"),
            best_image=result.get("best_image"),
            ipfs_storage=ipfs_storage
        )
        
        logger.info(f"Landsat imagery retrieved for project: {project_id}")
        return response
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to retrieve Landsat imagery: {e}")
        raise HTTPException(
            status_code=500,
            detail="Failed to retrieve Landsat imagery"
        )


@router.post("/sentinel2/imagery", response_model=SatelliteImageryResponse)
async def get_sentinel2_imagery(
    request: SatelliteImageryRequest,
    project_id: str = Query(...)
):
    """
    Retrieve Sentinel-2 imagery for project area
    
    Args:
        request: Imagery request parameters
        project_id: Associated project ID
        
    Returns:
        Sentinel-2 imagery information and download URLs
    """
    try:
        # Get Sentinel-2 imagery
        result = await remote_sensing_service.get_sentinel2_imagery(
            project_boundary=request.project_boundary.dict(),
            start_date=request.start_date,
            end_date=request.end_date,
            cloud_cover_max=request.cloud_cover_max
        )
        
        ipfs_storage = None
        
        # Store in IPFS if requested and imagery available
        if (request.store_in_ipfs and 
            result.get("status") == "success" and 
            result.get("best_image", {}).get("rgb_download_url")):
            
            try:
                ipfs_result = await remote_sensing_service.download_and_store_satellite_image(
                    download_url=result["best_image"]["rgb_download_url"],
                    project_id=project_id,
                    satellite_metadata=result["best_image"]
                )
                ipfs_storage = ipfs_result
                
            except Exception as e:
                logger.warning(f"Failed to store Sentinel-2 image in IPFS: {e}")
        
        response = SatelliteImageryResponse(
            status=result["status"],
            collection_size=result.get("collection_size"),
            best_image=result.get("best_image"),
            ipfs_storage=ipfs_storage
        )
        
        logger.info(f"Sentinel-2 imagery retrieved for project: {project_id}")
        return response
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to retrieve Sentinel-2 imagery: {e}")
        raise HTTPException(
            status_code=500,
            detail="Failed to retrieve Sentinel-2 imagery"
        )


@router.post("/vegetation-indices", response_model=VegetationIndexResponse)
async def calculate_vegetation_indices(
    request: VegetationIndexRequest
):
    """
    Calculate vegetation indices for project area
    
    Args:
        request: Vegetation index calculation parameters
        
    Returns:
        Vegetation index values and statistics
    """
    try:
        result = await remote_sensing_service.calculate_vegetation_indices(
            project_boundary=request.project_boundary.dict(),
            start_date=request.start_date,
            end_date=request.end_date,
            satellite_type=request.satellite_type
        )
        
        response = VegetationIndexResponse(
            status=result["status"],
            satellite_type=result["satellite_type"],
            analysis_period=result["analysis_period"],
            ndvi=result["ndvi"],
            evi=result["evi"]
        )
        
        logger.info(f"Vegetation indices calculated: {request.satellite_type}")
        return response
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to calculate vegetation indices: {e}")
        raise HTTPException(
            status_code=500,
            detail="Failed to calculate vegetation indices"
        )


@router.post("/change-detection", response_model=ChangeDetectionResponse)
async def detect_forest_changes(
    request: ChangeDetectionRequest,
    project_id: str = Query(...)
):
    """
    Detect forest changes between two time periods
    
    Args:
        request: Change detection parameters
        project_id: Associated project ID
        
    Returns:
        Change detection results
    """
    try:
        result = await remote_sensing_service.detect_forest_changes(
            project_boundary=request.project_boundary.dict(),
            before_date=request.before_date,
            after_date=request.after_date,
            satellite_type=request.satellite_type
        )
        
        ipfs_storage = None
        
        # Store results in IPFS if requested
        if request.store_results and result.get("status") == "success":
            try:
                import json
                results_json = json.dumps(result, indent=2)
                
                # Create a fake file object for IPFS upload
                from io import BytesIO
                from fastapi import UploadFile
                
                file_content = BytesIO(results_json.encode('utf-8'))
                fake_file = UploadFile(
                    filename=f"change_detection_{project_id}_{datetime.utcnow().strftime('%Y%m%d_%H%M%S')}.json",
                    file=file_content
                )
                
                ipfs_result = await ipfs_service.upload_file(
                    file=fake_file,
                    project_id=project_id,
                    document_type="change_detection_analysis",
                    metadata={
                        "analysis_type": "forest_change_detection",
                        "satellite_type": request.satellite_type,
                        "before_date": request.before_date,
                        "after_date": request.after_date
                    }
                )
                ipfs_storage = ipfs_result
                
            except Exception as e:
                logger.warning(f"Failed to store change detection results in IPFS: {e}")
        
        response = ChangeDetectionResponse(
            status=result["status"],
            analysis_type=result["analysis_type"],
            satellite_type=result["satellite_type"],
            before_date=result["before_date"],
            after_date=result["after_date"],
            results=result["results"],
            ipfs_storage=ipfs_storage
        )
        
        logger.info(f"Forest change detection completed for project: {project_id}")
        return response
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to detect forest changes: {e}")
        raise HTTPException(
            status_code=500,
            detail="Failed to detect forest changes"
        )


@router.post("/elevation")
async def get_elevation_data(
    project_boundary: ProjectBoundary
):
    """
    Get elevation data for project area
    
    Args:
        project_boundary: Project boundary geometry
        
    Returns:
        Elevation statistics
    """
    try:
        result = await remote_sensing_service.get_elevation_data(
            project_boundary=project_boundary.dict()
        )
        
        logger.info("Elevation data retrieved")
        return result
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to get elevation data: {e}")
        raise HTTPException(
            status_code=500,
            detail="Failed to get elevation data"
        )


@router.get("/collections")
async def list_available_collections():
    """
    List available satellite collections
    
    Returns:
        Available satellite data collections
    """
    try:
        collections = {
            "landsat_8": {
                "name": "Landsat 8 Collection 2 Level 2",
                "description": "Landsat 8 surface reflectance products",
                "temporal_coverage": "2013-present",
                "spatial_resolution": "30m",
                "revisit_time": "16 days"
            },
            "landsat_9": {
                "name": "Landsat 9 Collection 2 Level 2", 
                "description": "Landsat 9 surface reflectance products",
                "temporal_coverage": "2021-present",
                "spatial_resolution": "30m",
                "revisit_time": "16 days"
            },
            "sentinel_2": {
                "name": "Sentinel-2 MSI Surface Reflectance",
                "description": "Sentinel-2 multispectral surface reflectance",
                "temporal_coverage": "2015-present",
                "spatial_resolution": "10-60m",
                "revisit_time": "5 days"
            },
            "sentinel_1": {
                "name": "Sentinel-1 SAR Ground Range Detected",
                "description": "Sentinel-1 synthetic aperture radar data",
                "temporal_coverage": "2014-present",
                "spatial_resolution": "10m",
                "revisit_time": "6-12 days"
            },
            "modis": {
                "name": "MODIS Vegetation Indices",
                "description": "MODIS 16-day vegetation indices",
                "temporal_coverage": "2000-present",
                "spatial_resolution": "250m",
                "revisit_time": "16 days"
            }
        }
        
        return {
            "status": "success",
            "total_collections": len(collections),
            "collections": collections
        }
        
    except Exception as e:
        logger.error(f"Failed to list collections: {e}")
        raise HTTPException(
            status_code=500,
            detail="Failed to list available collections"
        )


@router.get("/status")
async def get_remote_sensing_status():
    """
    Get remote sensing service status
    
    Returns:
        Service status information
    """
    try:
        status = await remote_sensing_service.get_service_status()
        logger.info("Remote sensing status retrieved")
        return status
        
    except Exception as e:
        logger.error(f"Failed to get remote sensing status: {e}")
        raise HTTPException(
            status_code=500,
            detail="Failed to get service status"
        )


@router.get("/health")
async def health_check():
    """
    Remote sensing service health check
    
    Returns:
        Service health status
    """
    try:
        status = await remote_sensing_service.get_service_status()
        
        is_healthy = (
            status.get("status") == "operational" and 
            status.get("earth_engine", {}).get("initialized", False)
        )
        
        return {
            "service": "remote_sensing",
            "status": "healthy" if is_healthy else "unhealthy",
            "details": status,
            "timestamp": datetime.utcnow().isoformat()
        }
        
    except Exception as e:
        logger.error(f"Remote sensing health check failed: {e}")
        return {
            "service": "remote_sensing",
            "status": "unhealthy",
            "error": str(e),
            "timestamp": datetime.utcnow().isoformat()
        }


@router.post("/process/batch")
async def submit_batch_processing_job(
    project_id: str = Query(...),
    job_type: str = Query(...),
    parameters: Dict[str, Any] = Body(...)
):
    """
    Submit a batch processing job for satellite data analysis
    
    Args:
        project_id: Associated project ID
        job_type: Type of processing job
        parameters: Processing parameters
        
    Returns:
        Job submission confirmation
    """
    try:
        # This would integrate with a job queue system like Celery
        job_id = f"rs_{project_id}_{datetime.utcnow().strftime('%Y%m%d_%H%M%S')}"
        
        # Store job in database (this would be implemented with actual database models)
        job_info = {
            "job_id": job_id,
            "project_id": project_id,
            "job_type": job_type,
            "parameters": parameters,
            "status": "submitted",
            "created_at": datetime.utcnow().isoformat(),
            "estimated_completion": None
        }
        
        logger.info(f"Batch processing job submitted: {job_id}")
        return job_info
        
    except Exception as e:
        logger.error(f"Failed to submit batch processing job: {e}")
        raise HTTPException(
            status_code=500,
            detail="Failed to submit processing job"
        )