"""
Aurex Sylvagraph - IPFS Service
Immutable document storage and retrieval using IPFS
"""

import os
import hashlib
import json
import mimetypes
from datetime import datetime
from typing import Dict, List, Optional, Tuple, BinaryIO
from io import BytesIO
import asyncio
from pathlib import Path

import ipfshttpclient
import structlog
from fastapi import HTTPException, UploadFile
from PIL import Image
import aiofiles

logger = structlog.get_logger(__name__)


class IPFSService:
    """Service for managing IPFS document storage and retrieval"""
    
    def __init__(self, ipfs_api_url: str = "/ip4/127.0.0.1/tcp/5001"):
        """
        Initialize IPFS service
        
        Args:
            ipfs_api_url: IPFS API endpoint URL
        """
        self.ipfs_api_url = ipfs_api_url
        self._client = None
        self.supported_formats = {
            # Documents
            '.pdf', '.doc', '.docx', '.txt', '.csv', '.xlsx', '.xls',
            # Images
            '.jpg', '.jpeg', '.png', '.tiff', '.tif', '.gif', '.bmp',
            # Geospatial
            '.shp', '.kml', '.geojson', '.gpx',
            # Data
            '.json', '.xml', '.yaml', '.yml'
        }
        
    async def _get_client(self) -> ipfshttpclient.Client:
        """Get or create IPFS client connection"""
        if self._client is None:
            try:
                self._client = ipfshttpclient.connect(self.ipfs_api_url)
                # Test connection
                self._client.version()
                logger.info("IPFS client connected successfully")
            except Exception as e:
                logger.error(f"Failed to connect to IPFS: {e}")
                raise HTTPException(
                    status_code=503, 
                    detail="IPFS service unavailable"
                )
        return self._client
    
    def _validate_file_type(self, filename: str) -> bool:
        """Validate if file type is supported"""
        file_ext = Path(filename).suffix.lower()
        return file_ext in self.supported_formats
    
    def _generate_file_hash(self, content: bytes) -> str:
        """Generate SHA-256 hash of file content"""
        return hashlib.sha256(content).hexdigest()
    
    async def upload_file(
        self, 
        file: UploadFile, 
        project_id: str,
        document_type: str = "general",
        metadata: Optional[Dict] = None
    ) -> Dict[str, str]:
        """
        Upload file to IPFS with metadata
        
        Args:
            file: File to upload
            project_id: Associated project ID
            document_type: Type of document (monitoring_report, compliance, etc.)
            metadata: Additional metadata
            
        Returns:
            Dictionary with IPFS hash, metadata hash, and file info
        """
        try:
            # Validate file type
            if not self._validate_file_type(file.filename):
                raise HTTPException(
                    status_code=400,
                    detail=f"File type not supported. Supported formats: {', '.join(self.supported_formats)}"
                )
            
            # Read file content
            content = await file.read()
            file_size = len(content)
            
            # Check file size (max 100MB for individual files)
            if file_size > 100 * 1024 * 1024:
                raise HTTPException(
                    status_code=413,
                    detail="File size exceeds 100MB limit"
                )
            
            # Generate file hash
            file_hash = self._generate_file_hash(content)
            
            # Get IPFS client
            client = await self._get_client()
            
            # Upload file to IPFS
            result = client.add_bytes(content)
            ipfs_hash = result['Hash']
            
            # Create metadata
            file_metadata = {
                "filename": file.filename,
                "content_type": file.content_type or mimetypes.guess_type(file.filename)[0],
                "file_size": file_size,
                "file_hash": file_hash,
                "project_id": project_id,
                "document_type": document_type,
                "upload_timestamp": datetime.utcnow().isoformat(),
                "ipfs_hash": ipfs_hash,
                **(metadata or {})
            }
            
            # Upload metadata to IPFS
            metadata_json = json.dumps(file_metadata, indent=2)
            metadata_result = client.add_json(file_metadata)
            metadata_hash = metadata_result
            
            # Pin both file and metadata to ensure persistence
            client.pin.add(ipfs_hash)
            client.pin.add(metadata_hash)
            
            logger.info(f"File uploaded to IPFS: {file.filename} -> {ipfs_hash}")
            
            return {
                "ipfs_hash": ipfs_hash,
                "metadata_hash": metadata_hash,
                "filename": file.filename,
                "file_size": file_size,
                "content_type": file_metadata["content_type"],
                "document_type": document_type,
                "file_hash": file_hash
            }
            
        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"Failed to upload file to IPFS: {e}")
            raise HTTPException(
                status_code=500,
                detail="Failed to upload file to IPFS"
            )
    
    async def retrieve_file(self, ipfs_hash: str) -> Tuple[bytes, Dict]:
        """
        Retrieve file from IPFS
        
        Args:
            ipfs_hash: IPFS hash of the file
            
        Returns:
            Tuple of (file_content, metadata)
        """
        try:
            client = await self._get_client()
            
            # Download file content
            content = client.cat(ipfs_hash)
            
            # Try to get metadata (if available)
            metadata = {}
            try:
                # Attempt to retrieve associated metadata
                # This assumes metadata hash is stored separately in database
                pass
            except:
                # Metadata not available
                pass
            
            logger.info(f"File retrieved from IPFS: {ipfs_hash}")
            return content, metadata
            
        except Exception as e:
            logger.error(f"Failed to retrieve file from IPFS: {e}")
            raise HTTPException(
                status_code=404,
                detail="File not found in IPFS"
            )
    
    async def verify_file_integrity(self, ipfs_hash: str, expected_hash: str) -> bool:
        """
        Verify file integrity by comparing hashes
        
        Args:
            ipfs_hash: IPFS hash of the file
            expected_hash: Expected SHA-256 hash
            
        Returns:
            True if file integrity is verified
        """
        try:
            content, _ = await self.retrieve_file(ipfs_hash)
            actual_hash = self._generate_file_hash(content)
            
            verified = actual_hash == expected_hash
            logger.info(f"File integrity verification: {ipfs_hash} -> {'PASS' if verified else 'FAIL'}")
            
            return verified
            
        except Exception as e:
            logger.error(f"Failed to verify file integrity: {e}")
            return False
    
    async def upload_satellite_imagery(
        self, 
        image_data: bytes, 
        project_id: str,
        satellite_type: str,
        capture_date: datetime,
        metadata: Dict
    ) -> Dict[str, str]:
        """
        Upload satellite imagery with specialized metadata
        
        Args:
            image_data: Satellite image binary data
            project_id: Associated project ID
            satellite_type: Type of satellite (Landsat, Sentinel-2, etc.)
            capture_date: When the image was captured
            metadata: Satellite-specific metadata
            
        Returns:
            Upload result with IPFS hashes
        """
        try:
            client = await self._get_client()
            
            # Generate image hash
            image_hash = self._generate_file_hash(image_data)
            
            # Upload image
            result = client.add_bytes(image_data)
            ipfs_hash = result['Hash']
            
            # Create satellite metadata
            satellite_metadata = {
                "project_id": project_id,
                "satellite_type": satellite_type,
                "capture_date": capture_date.isoformat(),
                "upload_timestamp": datetime.utcnow().isoformat(),
                "file_size": len(image_data),
                "image_hash": image_hash,
                "ipfs_hash": ipfs_hash,
                "document_type": "satellite_imagery",
                **metadata
            }
            
            # Upload metadata
            metadata_result = client.add_json(satellite_metadata)
            metadata_hash = metadata_result
            
            # Pin both files
            client.pin.add(ipfs_hash)
            client.pin.add(metadata_hash)
            
            logger.info(f"Satellite imagery uploaded: {satellite_type} -> {ipfs_hash}")
            
            return {
                "ipfs_hash": ipfs_hash,
                "metadata_hash": metadata_hash,
                "satellite_type": satellite_type,
                "capture_date": capture_date.isoformat(),
                "file_size": len(image_data),
                "image_hash": image_hash
            }
            
        except Exception as e:
            logger.error(f"Failed to upload satellite imagery: {e}")
            raise HTTPException(
                status_code=500,
                detail="Failed to upload satellite imagery"
            )
    
    async def upload_drone_data(
        self,
        file: UploadFile,
        project_id: str,
        flight_id: str,
        drone_metadata: Dict
    ) -> Dict[str, str]:
        """
        Upload drone imagery/data with flight metadata
        
        Args:
            file: Drone image/video file
            project_id: Associated project ID
            flight_id: Drone flight ID
            drone_metadata: Drone flight specific metadata
            
        Returns:
            Upload result with IPFS hashes
        """
        content = await file.read()
        
        try:
            client = await self._get_client()
            
            # Upload file
            result = client.add_bytes(content)
            ipfs_hash = result['Hash']
            
            # Create drone metadata
            flight_metadata = {
                "filename": file.filename,
                "project_id": project_id,
                "flight_id": flight_id,
                "content_type": file.content_type,
                "file_size": len(content),
                "upload_timestamp": datetime.utcnow().isoformat(),
                "ipfs_hash": ipfs_hash,
                "document_type": "drone_data",
                **drone_metadata
            }
            
            # Upload metadata
            metadata_result = client.add_json(flight_metadata)
            metadata_hash = metadata_result
            
            # Pin files
            client.pin.add(ipfs_hash)
            client.pin.add(metadata_hash)
            
            logger.info(f"Drone data uploaded: {file.filename} -> {ipfs_hash}")
            
            return {
                "ipfs_hash": ipfs_hash,
                "metadata_hash": metadata_hash,
                "filename": file.filename,
                "flight_id": flight_id,
                "file_size": len(content)
            }
            
        except Exception as e:
            logger.error(f"Failed to upload drone data: {e}")
            raise HTTPException(
                status_code=500,
                detail="Failed to upload drone data"
            )
    
    async def get_file_info(self, ipfs_hash: str) -> Dict:
        """
        Get file information from IPFS
        
        Args:
            ipfs_hash: IPFS hash of the file
            
        Returns:
            File information dictionary
        """
        try:
            client = await self._get_client()
            
            # Get object stats
            stats = client.object.stat(ipfs_hash)
            
            return {
                "ipfs_hash": ipfs_hash,
                "file_size": stats['CumulativeSize'],
                "num_links": stats['NumLinks'],
                "block_size": stats['BlockSize'],
                "data_size": stats['DataSize']
            }
            
        except Exception as e:
            logger.error(f"Failed to get file info: {e}")
            raise HTTPException(
                status_code=404,
                detail="File not found in IPFS"
            )
    
    async def list_project_files(self, project_id: str) -> List[Dict]:
        """
        List all IPFS files for a project (requires database lookup)
        This method would typically query the database for files associated with project_id
        
        Args:
            project_id: Project ID to search for
            
        Returns:
            List of file information dictionaries
        """
        # This would typically involve database queries to find files by project_id
        # For now, returning placeholder structure
        return []
    
    async def delete_file(self, ipfs_hash: str) -> bool:
        """
        Remove pin from IPFS file (doesn't delete from network)
        
        Args:
            ipfs_hash: IPFS hash of file to unpin
            
        Returns:
            True if successfully unpinned
        """
        try:
            client = await self._get_client()
            client.pin.rm(ipfs_hash)
            
            logger.info(f"File unpinned from IPFS: {ipfs_hash}")
            return True
            
        except Exception as e:
            logger.error(f"Failed to unpin file: {e}")
            return False
    
    async def get_ipfs_status(self) -> Dict:
        """
        Get IPFS node status and health
        
        Returns:
            IPFS node status information
        """
        try:
            client = await self._get_client()
            
            version_info = client.version()
            stats = client.stats.bw()
            
            return {
                "status": "connected",
                "version": version_info['Version'],
                "protocol_version": version_info['Commit'],
                "api_version": version_info['System'],
                "bandwidth_stats": {
                    "total_in": stats['TotalIn'],
                    "total_out": stats['TotalOut'],
                    "rate_in": stats['RateIn'],
                    "rate_out": stats['RateOut']
                }
            }
            
        except Exception as e:
            logger.error(f"Failed to get IPFS status: {e}")
            return {
                "status": "disconnected",
                "error": str(e)
            }


# Global IPFS service instance
ipfs_service = IPFSService()