"""
Aurex Sylvagraph - IPFS API Router
RESTful API endpoints for IPFS document storage and retrieval
"""

from typing import Dict, List, Optional
from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, Query
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
import structlog

from ..services.ipfs_service import ipfs_service

logger = structlog.get_logger(__name__)

router = APIRouter()


class IPFSUploadResponse(BaseModel):
    """Response model for IPFS file uploads"""
    ipfs_hash: str
    metadata_hash: str
    filename: str
    file_size: int
    content_type: str
    document_type: str
    file_hash: str
    upload_timestamp: datetime


class IPFSFileInfo(BaseModel):
    """Response model for IPFS file information"""
    ipfs_hash: str
    filename: Optional[str]
    file_size: int
    content_type: Optional[str]
    document_type: str
    project_id: str
    upload_timestamp: datetime
    verification_status: bool


class IPFSStatusResponse(BaseModel):
    """Response model for IPFS service status"""
    status: str
    version: Optional[str]
    protocol_version: Optional[str]
    api_version: Optional[str]
    bandwidth_stats: Optional[Dict]


@router.post("/upload", response_model=IPFSUploadResponse)
async def upload_file_to_ipfs(
    file: UploadFile = File(...),
    project_id: str = Form(...),
    document_type: str = Form(default="general"),
    metadata: Optional[str] = Form(default=None)
):
    """
    Upload a file to IPFS with metadata
    
    Args:
        file: File to upload
        project_id: Associated project ID
        document_type: Type of document (monitoring_report, compliance, etc.)
        metadata: Additional metadata as JSON string
        
    Returns:
        Upload result with IPFS hashes and file information
    """
    try:
        # Parse metadata if provided
        parsed_metadata = None
        if metadata:
            import json
            try:
                parsed_metadata = json.loads(metadata)
            except json.JSONDecodeError:
                raise HTTPException(
                    status_code=400,
                    detail="Invalid metadata JSON format"
                )
        
        # Upload file to IPFS
        result = await ipfs_service.upload_file(
            file=file,
            project_id=project_id,
            document_type=document_type,
            metadata=parsed_metadata
        )
        
        # Convert to response model
        response = IPFSUploadResponse(
            ipfs_hash=result["ipfs_hash"],
            metadata_hash=result["metadata_hash"],
            filename=result["filename"],
            file_size=result["file_size"],
            content_type=result["content_type"],
            document_type=document_type,
            file_hash=result["file_hash"],
            upload_timestamp=datetime.utcnow()
        )
        
        logger.info(f"File uploaded to IPFS via API: {result['filename']} -> {result['ipfs_hash']}")
        return response
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"File upload failed: {e}")
        raise HTTPException(
            status_code=500,
            detail="Failed to upload file to IPFS"
        )


@router.get("/download/{ipfs_hash}")
async def download_file_from_ipfs(ipfs_hash: str):
    """
    Download a file from IPFS
    
    Args:
        ipfs_hash: IPFS hash of the file to download
        
    Returns:
        Streaming response with file content
    """
    try:
        # Retrieve file from IPFS
        content, metadata = await ipfs_service.retrieve_file(ipfs_hash)
        
        # Determine content type and filename from metadata
        content_type = metadata.get("content_type", "application/octet-stream")
        filename = metadata.get("filename", f"ipfs_file_{ipfs_hash[:8]}")
        
        # Create streaming response
        def generate_content():
            yield content
        
        response = StreamingResponse(
            generate_content(),
            media_type=content_type,
            headers={
                "Content-Disposition": f"attachment; filename={filename}",
                "Content-Length": str(len(content))
            }
        )
        
        logger.info(f"File downloaded from IPFS: {ipfs_hash}")
        return response
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"File download failed: {e}")
        raise HTTPException(
            status_code=500,
            detail="Failed to download file from IPFS"
        )


@router.get("/info/{ipfs_hash}")
async def get_file_info(ipfs_hash: str):
    """
    Get file information from IPFS
    
    Args:
        ipfs_hash: IPFS hash of the file
        
    Returns:
        File information dictionary
    """
    try:
        file_info = await ipfs_service.get_file_info(ipfs_hash)
        logger.info(f"Retrieved file info from IPFS: {ipfs_hash}")
        return file_info
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to get file info: {e}")
        raise HTTPException(
            status_code=500,
            detail="Failed to retrieve file information"
        )


@router.post("/verify/{ipfs_hash}")
async def verify_file_integrity(
    ipfs_hash: str,
    expected_hash: str = Form(...)
):
    """
    Verify file integrity by comparing hashes
    
    Args:
        ipfs_hash: IPFS hash of the file
        expected_hash: Expected SHA-256 hash
        
    Returns:
        Verification result
    """
    try:
        is_verified = await ipfs_service.verify_file_integrity(ipfs_hash, expected_hash)
        
        result = {
            "ipfs_hash": ipfs_hash,
            "expected_hash": expected_hash,
            "verified": is_verified,
            "verification_timestamp": datetime.utcnow().isoformat()
        }
        
        logger.info(f"File integrity verification: {ipfs_hash} -> {'PASS' if is_verified else 'FAIL'}")
        return result
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"File verification failed: {e}")
        raise HTTPException(
            status_code=500,
            detail="Failed to verify file integrity"
        )


@router.post("/satellite/upload")
async def upload_satellite_imagery(
    file: UploadFile = File(...),
    project_id: str = Form(...),
    satellite_type: str = Form(...),
    capture_date: str = Form(...),
    metadata: str = Form(...)
):
    """
    Upload satellite imagery with specialized metadata
    
    Args:
        file: Satellite image file
        project_id: Associated project ID
        satellite_type: Type of satellite (Landsat, Sentinel-2, etc.)
        capture_date: Image capture date (YYYY-MM-DD)
        metadata: Satellite metadata as JSON string
        
    Returns:
        Upload result with IPFS hashes
    """
    try:
        # Parse capture date
        capture_datetime = datetime.strptime(capture_date, "%Y-%m-%d")
        
        # Parse metadata
        import json
        satellite_metadata = json.loads(metadata)
        
        # Read file content
        image_data = await file.read()
        
        # Upload to IPFS
        result = await ipfs_service.upload_satellite_imagery(
            image_data=image_data,
            project_id=project_id,
            satellite_type=satellite_type,
            capture_date=capture_datetime,
            metadata=satellite_metadata
        )
        
        logger.info(f"Satellite imagery uploaded: {satellite_type} -> {result['ipfs_hash']}")
        return result
        
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except json.JSONDecodeError:
        raise HTTPException(status_code=400, detail="Invalid metadata JSON format")
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Satellite imagery upload failed: {e}")
        raise HTTPException(
            status_code=500,
            detail="Failed to upload satellite imagery"
        )


@router.post("/drone/upload")
async def upload_drone_data(
    file: UploadFile = File(...),
    project_id: str = Form(...),
    flight_id: str = Form(...),
    drone_metadata: str = Form(...)
):
    """
    Upload drone imagery/data with flight metadata
    
    Args:
        file: Drone image/video file
        project_id: Associated project ID
        flight_id: Drone flight ID
        drone_metadata: Drone flight metadata as JSON string
        
    Returns:
        Upload result with IPFS hashes
    """
    try:
        # Parse drone metadata
        import json
        parsed_metadata = json.loads(drone_metadata)
        
        # Upload to IPFS
        result = await ipfs_service.upload_drone_data(
            file=file,
            project_id=project_id,
            flight_id=flight_id,
            drone_metadata=parsed_metadata
        )
        
        logger.info(f"Drone data uploaded: {file.filename} -> {result['ipfs_hash']}")
        return result
        
    except json.JSONDecodeError:
        raise HTTPException(status_code=400, detail="Invalid drone metadata JSON format")
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Drone data upload failed: {e}")
        raise HTTPException(
            status_code=500,
            detail="Failed to upload drone data"
        )


@router.get("/project/{project_id}/files")
async def list_project_files(
    project_id: str,
    document_type: Optional[str] = Query(None),
    limit: int = Query(default=50, ge=1, le=100)
):
    """
    List all IPFS files for a project
    
    Args:
        project_id: Project ID to search for
        document_type: Filter by document type
        limit: Maximum number of files to return
        
    Returns:
        List of file information
    """
    try:
        files = await ipfs_service.list_project_files(project_id)
        
        # Apply filters
        if document_type:
            files = [f for f in files if f.get('document_type') == document_type]
        
        # Apply limit
        files = files[:limit]
        
        logger.info(f"Listed IPFS files for project: {project_id} ({len(files)} files)")
        return {
            "project_id": project_id,
            "total_files": len(files),
            "files": files
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to list project files: {e}")
        raise HTTPException(
            status_code=500,
            detail="Failed to list project files"
        )


@router.delete("/unpin/{ipfs_hash}")
async def unpin_file(ipfs_hash: str):
    """
    Remove pin from IPFS file (doesn't delete from network)
    
    Args:
        ipfs_hash: IPFS hash of file to unpin
        
    Returns:
        Operation result
    """
    try:
        success = await ipfs_service.delete_file(ipfs_hash)
        
        result = {
            "ipfs_hash": ipfs_hash,
            "unpinned": success,
            "timestamp": datetime.utcnow().isoformat()
        }
        
        if success:
            logger.info(f"File unpinned from IPFS: {ipfs_hash}")
        else:
            logger.warning(f"Failed to unpin file from IPFS: {ipfs_hash}")
        
        return result
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to unpin file: {e}")
        raise HTTPException(
            status_code=500,
            detail="Failed to unpin file"
        )


@router.get("/status", response_model=IPFSStatusResponse)
async def get_ipfs_status():
    """
    Get IPFS service status and health
    
    Returns:
        IPFS node status information
    """
    try:
        status = await ipfs_service.get_ipfs_status()
        logger.info("IPFS status retrieved")
        return IPFSStatusResponse(**status)
        
    except Exception as e:
        logger.error(f"Failed to get IPFS status: {e}")
        raise HTTPException(
            status_code=500,
            detail="Failed to get IPFS status"
        )


@router.get("/health")
async def health_check():
    """
    IPFS service health check endpoint
    
    Returns:
        Service health status
    """
    try:
        status = await ipfs_service.get_ipfs_status()
        
        is_healthy = status.get("status") == "connected"
        
        return {
            "service": "ipfs",
            "status": "healthy" if is_healthy else "unhealthy",
            "details": status,
            "timestamp": datetime.utcnow().isoformat()
        }
        
    except Exception as e:
        logger.error(f"IPFS health check failed: {e}")
        return {
            "service": "ipfs",
            "status": "unhealthy",
            "error": str(e),
            "timestamp": datetime.utcnow().isoformat()
        }