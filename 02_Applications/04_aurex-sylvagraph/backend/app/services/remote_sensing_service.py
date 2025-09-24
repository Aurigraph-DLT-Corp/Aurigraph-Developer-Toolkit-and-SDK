"""
Aurex Sylvagraph - Remote Sensing Service
Google Earth Engine integration for satellite imagery and analysis
"""

import os
import json
import asyncio
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Tuple, Any
from concurrent.futures import ThreadPoolExecutor
import base64
from io import BytesIO

import ee
import structlog
import numpy as np
from PIL import Image
from fastapi import HTTPException
import aiohttp
import asyncio
from shapely.geometry import Polygon, Point
import geopandas as gpd

from .ipfs_service import ipfs_service

logger = structlog.get_logger(__name__)


class RemoteSensingService:
    """Service for satellite imagery retrieval and analysis using Google Earth Engine"""
    
    def __init__(self):
        """Initialize Earth Engine service"""
        self.ee_initialized = False
        self.thread_pool = ThreadPoolExecutor(max_workers=4)
        
        # Satellite collections
        self.collections = {
            "landsat_8": "LANDSAT/LC08/C02/T1_L2",
            "landsat_9": "LANDSAT/LC09/C02/T1_L2", 
            "sentinel_2": "COPERNICUS/S2_SR_HARMONIZED",
            "sentinel_1": "COPERNICUS/S1_GRD",
            "modis": "MODIS/061/MOD13Q1",
            "elevation": "USGS/SRTMGL1_003"
        }
        
        # Cloud cover thresholds
        self.cloud_thresholds = {
            "excellent": 5,
            "good": 15,
            "acceptable": 30,
            "poor": 50
        }
    
    async def initialize_earth_engine(self, service_account_file: Optional[str] = None):
        """
        Initialize Google Earth Engine authentication
        
        Args:
            service_account_file: Path to service account JSON file
        """
        try:
            def _initialize():
                if service_account_file and os.path.exists(service_account_file):
                    # Use service account authentication
                    credentials = ee.ServiceAccountCredentials(
                        email=None, 
                        key_file=service_account_file
                    )
                    ee.Initialize(credentials)
                else:
                    # Use default authentication
                    ee.Initialize()
                    
                return True
            
            # Run initialization in thread pool to avoid blocking
            await asyncio.get_event_loop().run_in_executor(
                self.thread_pool, _initialize
            )
            
            self.ee_initialized = True
            logger.info("Google Earth Engine initialized successfully")
            
        except Exception as e:
            logger.error(f"Failed to initialize Earth Engine: {e}")
            raise HTTPException(
                status_code=503,
                detail="Earth Engine service unavailable"
            )
    
    def _ensure_ee_initialized(self):
        """Ensure Earth Engine is initialized"""
        if not self.ee_initialized:
            raise HTTPException(
                status_code=503,
                detail="Earth Engine not initialized"
            )
    
    async def get_landsat_imagery(
        self,
        project_boundary: Dict[str, Any],
        start_date: str,
        end_date: str,
        cloud_cover_max: int = 30
    ) -> Dict[str, Any]:
        """
        Retrieve Landsat imagery for project area
        
        Args:
            project_boundary: GeoJSON polygon of project boundary
            start_date: Start date (YYYY-MM-DD)
            end_date: End date (YYYY-MM-DD)
            cloud_cover_max: Maximum cloud cover percentage
            
        Returns:
            Dictionary with imagery metadata and download URLs
        """
        self._ensure_ee_initialized()
        
        try:
            def _get_landsat():
                # Create geometry from project boundary
                coords = project_boundary['coordinates'][0]
                geometry = ee.Geometry.Polygon(coords)
                
                # Load Landsat 8/9 collections
                l8_collection = (ee.ImageCollection(self.collections["landsat_8"])
                               .filterBounds(geometry)
                               .filterDate(start_date, end_date)
                               .filter(ee.Filter.lt('CLOUD_COVER', cloud_cover_max))
                               .select(['SR_B1', 'SR_B2', 'SR_B3', 'SR_B4', 'SR_B5', 'SR_B6', 'SR_B7']))
                
                l9_collection = (ee.ImageCollection(self.collections["landsat_9"])
                               .filterBounds(geometry)
                               .filterDate(start_date, end_date)
                               .filter(ee.Filter.lt('CLOUD_COVER', cloud_cover_max))
                               .select(['SR_B1', 'SR_B2', 'SR_B3', 'SR_B4', 'SR_B5', 'SR_B6', 'SR_B7']))
                
                # Merge collections
                merged = l8_collection.merge(l9_collection).sort('system:time_start')
                
                # Get collection info
                collection_size = merged.size().getInfo()
                
                if collection_size == 0:
                    return {
                        "status": "no_data",
                        "message": "No Landsat imagery found for specified criteria"
                    }
                
                # Get the best image (least cloudy)
                best_image = merged.first()
                image_info = best_image.getInfo()
                
                # Generate download URL for true color composite
                rgb_params = {
                    'bands': ['SR_B4', 'SR_B3', 'SR_B2'],
                    'min': 0.0,
                    'max': 0.3,
                    'gamma': 1.4,
                    'region': geometry,
                    'scale': 30,
                    'format': 'GeoTIFF'
                }
                
                download_url = best_image.getDownloadURL(rgb_params)
                
                return {
                    "status": "success",
                    "collection_size": collection_size,
                    "best_image": {
                        "scene_id": image_info['properties'].get('LANDSAT_SCENE_ID', 'unknown'),
                        "acquisition_date": image_info['properties'].get('DATE_ACQUIRED'),
                        "cloud_cover": image_info['properties'].get('CLOUD_COVER'),
                        "download_url": download_url,
                        "satellite": image_info['properties'].get('SPACECRAFT_ID', 'Landsat'),
                        "sensor": image_info['properties'].get('SENSOR_ID', 'OLI_TIRS'),
                        "wrs_path": image_info['properties'].get('WRS_PATH'),
                        "wrs_row": image_info['properties'].get('WRS_ROW')
                    }
                }
            
            result = await asyncio.get_event_loop().run_in_executor(
                self.thread_pool, _get_landsat
            )
            
            logger.info(f"Retrieved Landsat imagery: {result['status']}")
            return result
            
        except Exception as e:
            logger.error(f"Failed to retrieve Landsat imagery: {e}")
            raise HTTPException(
                status_code=500,
                detail="Failed to retrieve satellite imagery"
            )
    
    async def get_sentinel2_imagery(
        self,
        project_boundary: Dict[str, Any],
        start_date: str,
        end_date: str,
        cloud_cover_max: int = 30
    ) -> Dict[str, Any]:
        """
        Retrieve Sentinel-2 imagery for project area
        
        Args:
            project_boundary: GeoJSON polygon of project boundary
            start_date: Start date (YYYY-MM-DD)
            end_date: End date (YYYY-MM-DD)
            cloud_cover_max: Maximum cloud cover percentage
            
        Returns:
            Dictionary with imagery metadata and download URLs
        """
        self._ensure_ee_initialized()
        
        try:
            def _get_sentinel2():
                # Create geometry
                coords = project_boundary['coordinates'][0]
                geometry = ee.Geometry.Polygon(coords)
                
                # Load Sentinel-2 collection
                collection = (ee.ImageCollection(self.collections["sentinel_2"])
                            .filterBounds(geometry)
                            .filterDate(start_date, end_date)
                            .filter(ee.Filter.lt('CLOUDY_PIXEL_PERCENTAGE', cloud_cover_max))
                            .select(['B2', 'B3', 'B4', 'B5', 'B6', 'B7', 'B8', 'B8A', 'B11', 'B12']))
                
                collection_size = collection.size().getInfo()
                
                if collection_size == 0:
                    return {
                        "status": "no_data",
                        "message": "No Sentinel-2 imagery found for specified criteria"
                    }
                
                # Get best image
                best_image = collection.first()
                image_info = best_image.getInfo()
                
                # Generate download URLs for different band combinations
                rgb_params = {
                    'bands': ['B4', 'B3', 'B2'],
                    'min': 0,
                    'max': 3000,
                    'gamma': 1.4,
                    'region': geometry,
                    'scale': 10,
                    'format': 'GeoTIFF'
                }
                
                nir_rgb_params = {
                    'bands': ['B8', 'B4', 'B3'],
                    'min': 0,
                    'max': 3000,
                    'gamma': 1.4,
                    'region': geometry,
                    'scale': 10,
                    'format': 'GeoTIFF'
                }
                
                return {
                    "status": "success",
                    "collection_size": collection_size,
                    "best_image": {
                        "product_id": image_info['properties'].get('PRODUCT_ID', 'unknown'),
                        "acquisition_date": image_info['properties'].get('PRODUCT_ID', '').split('_')[2][:8] if 'PRODUCT_ID' in image_info['properties'] else 'unknown',
                        "cloud_cover": image_info['properties'].get('CLOUDY_PIXEL_PERCENTAGE'),
                        "rgb_download_url": best_image.getDownloadURL(rgb_params),
                        "nir_rgb_download_url": best_image.getDownloadURL(nir_rgb_params),
                        "satellite": "Sentinel-2",
                        "sensor": "MSI",
                        "mgrs_tile": image_info['properties'].get('MGRS_TILE', 'unknown')
                    }
                }
            
            result = await asyncio.get_event_loop().run_in_executor(
                self.thread_pool, _get_sentinel2
            )
            
            logger.info(f"Retrieved Sentinel-2 imagery: {result['status']}")
            return result
            
        except Exception as e:
            logger.error(f"Failed to retrieve Sentinel-2 imagery: {e}")
            raise HTTPException(
                status_code=500,
                detail="Failed to retrieve Sentinel-2 imagery"
            )
    
    async def calculate_vegetation_indices(
        self,
        project_boundary: Dict[str, Any],
        start_date: str,
        end_date: str,
        satellite_type: str = "sentinel_2"
    ) -> Dict[str, Any]:
        """
        Calculate vegetation indices for project area
        
        Args:
            project_boundary: GeoJSON polygon of project boundary
            start_date: Start date (YYYY-MM-DD)
            end_date: End date (YYYY-MM-DD)
            satellite_type: Type of satellite imagery to use
            
        Returns:
            Dictionary with vegetation index values and statistics
        """
        self._ensure_ee_initialized()
        
        try:
            def _calculate_indices():
                coords = project_boundary['coordinates'][0]
                geometry = ee.Geometry.Polygon(coords)
                
                if satellite_type == "sentinel_2":
                    collection = (ee.ImageCollection(self.collections["sentinel_2"])
                                .filterBounds(geometry)
                                .filterDate(start_date, end_date)
                                .filter(ee.Filter.lt('CLOUDY_PIXEL_PERCENTAGE', 30)))
                    
                    # Calculate NDVI for Sentinel-2
                    def add_ndvi(image):
                        ndvi = image.normalizedDifference(['B8', 'B4']).rename('NDVI')
                        return image.addBands(ndvi)
                    
                    # Calculate EVI for Sentinel-2
                    def add_evi(image):
                        evi = image.expression(
                            '2.5 * ((NIR - RED) / (NIR + 6 * RED - 7.5 * BLUE + 1))',
                            {
                                'NIR': image.select('B8'),
                                'RED': image.select('B4'),
                                'BLUE': image.select('B2')
                            }
                        ).rename('EVI')
                        return image.addBands(evi)
                    
                elif satellite_type == "landsat_8":
                    collection = (ee.ImageCollection(self.collections["landsat_8"])
                                .filterBounds(geometry)
                                .filterDate(start_date, end_date)
                                .filter(ee.Filter.lt('CLOUD_COVER', 30)))
                    
                    # Calculate NDVI for Landsat 8
                    def add_ndvi(image):
                        ndvi = image.normalizedDifference(['SR_B5', 'SR_B4']).rename('NDVI')
                        return image.addBands(ndvi)
                    
                    def add_evi(image):
                        evi = image.expression(
                            '2.5 * ((NIR - RED) / (NIR + 6 * RED - 7.5 * BLUE + 1))',
                            {
                                'NIR': image.select('SR_B5'),
                                'RED': image.select('SR_B4'),
                                'BLUE': image.select('SR_B2')
                            }
                        ).rename('EVI')
                        return image.addBands(evi)
                
                else:
                    raise ValueError(f"Unsupported satellite type: {satellite_type}")
                
                # Apply calculations
                with_ndvi = collection.map(add_ndvi)
                with_evi = with_ndvi.map(add_evi)
                
                # Get median values
                median_composite = with_evi.median()
                
                # Calculate statistics
                ndvi_stats = median_composite.select('NDVI').reduceRegion(
                    reducer=ee.Reducer.mean().combine(
                        ee.Reducer.minMax(), '', True
                    ).combine(
                        ee.Reducer.stdDev(), '', True
                    ),
                    geometry=geometry,
                    scale=30,
                    maxPixels=1e9
                ).getInfo()
                
                evi_stats = median_composite.select('EVI').reduceRegion(
                    reducer=ee.Reducer.mean().combine(
                        ee.Reducer.minMax(), '', True
                    ).combine(
                        ee.Reducer.stdDev(), '', True
                    ),
                    geometry=geometry,
                    scale=30,
                    maxPixels=1e9
                ).getInfo()
                
                return {
                    "status": "success",
                    "satellite_type": satellite_type,
                    "analysis_period": f"{start_date} to {end_date}",
                    "ndvi": {
                        "mean": ndvi_stats.get('NDVI_mean'),
                        "min": ndvi_stats.get('NDVI_min'),
                        "max": ndvi_stats.get('NDVI_max'),
                        "std": ndvi_stats.get('NDVI_stdDev')
                    },
                    "evi": {
                        "mean": evi_stats.get('EVI_mean'),
                        "min": evi_stats.get('EVI_min'),
                        "max": evi_stats.get('EVI_max'),
                        "std": evi_stats.get('EVI_stdDev')
                    }
                }
            
            result = await asyncio.get_event_loop().run_in_executor(
                self.thread_pool, _calculate_indices
            )
            
            logger.info(f"Calculated vegetation indices: {result['status']}")
            return result
            
        except Exception as e:
            logger.error(f"Failed to calculate vegetation indices: {e}")
            raise HTTPException(
                status_code=500,
                detail="Failed to calculate vegetation indices"
            )
    
    async def detect_forest_changes(
        self,
        project_boundary: Dict[str, Any],
        before_date: str,
        after_date: str,
        satellite_type: str = "sentinel_2"
    ) -> Dict[str, Any]:
        """
        Detect forest changes between two time periods
        
        Args:
            project_boundary: GeoJSON polygon of project boundary
            before_date: Before date (YYYY-MM-DD)
            after_date: After date (YYYY-MM-DD)
            satellite_type: Type of satellite imagery to use
            
        Returns:
            Dictionary with change detection results
        """
        self._ensure_ee_initialized()
        
        try:
            def _detect_changes():
                coords = project_boundary['coordinates'][0]
                geometry = ee.Geometry.Polygon(coords)
                
                # Get before and after image collections
                if satellite_type == "sentinel_2":
                    before_collection = (ee.ImageCollection(self.collections["sentinel_2"])
                                       .filterBounds(geometry)
                                       .filterDate(before_date, (datetime.strptime(before_date, '%Y-%m-%d') + timedelta(days=30)).strftime('%Y-%m-%d'))
                                       .filter(ee.Filter.lt('CLOUDY_PIXEL_PERCENTAGE', 30))
                                       .median())
                    
                    after_collection = (ee.ImageCollection(self.collections["sentinel_2"])
                                      .filterBounds(geometry)
                                      .filterDate(after_date, (datetime.strptime(after_date, '%Y-%m-%d') + timedelta(days=30)).strftime('%Y-%m-%d'))
                                      .filter(ee.Filter.lt('CLOUDY_PIXEL_PERCENTAGE', 30))
                                      .median())
                    
                    # Calculate NDVI for both periods
                    ndvi_before = before_collection.normalizedDifference(['B8', 'B4']).rename('NDVI_before')
                    ndvi_after = after_collection.normalizedDifference(['B8', 'B4']).rename('NDVI_after')
                
                else:
                    # Landsat implementation would go here
                    raise ValueError(f"Change detection not implemented for {satellite_type}")
                
                # Calculate NDVI difference
                ndvi_diff = ndvi_after.subtract(ndvi_before).rename('NDVI_diff')
                
                # Define thresholds for change detection
                forest_loss = ndvi_diff.lt(-0.2)  # Significant NDVI decrease
                forest_gain = ndvi_diff.gt(0.2)   # Significant NDVI increase
                
                # Calculate area statistics
                pixel_area = ee.Image.pixelArea()
                
                # Forest loss area (in hectares)
                loss_area = forest_loss.multiply(pixel_area).reduceRegion(
                    reducer=ee.Reducer.sum(),
                    geometry=geometry,
                    scale=30,
                    maxPixels=1e9
                ).get('NDVI_diff')
                
                # Forest gain area (in hectares)  
                gain_area = forest_gain.multiply(pixel_area).reduceRegion(
                    reducer=ee.Reducer.sum(),
                    geometry=geometry,
                    scale=30,
                    maxPixels=1e9
                ).get('NDVI_diff')
                
                # Total project area
                total_area = pixel_area.reduceRegion(
                    reducer=ee.Reducer.sum(),
                    geometry=geometry,
                    scale=30,
                    maxPixels=1e9
                ).get('area')
                
                # Get computed values
                loss_area_value = ee.Number(loss_area).divide(10000).getInfo() if loss_area else 0  # Convert to hectares
                gain_area_value = ee.Number(gain_area).divide(10000).getInfo() if gain_area else 0  # Convert to hectares
                total_area_value = ee.Number(total_area).divide(10000).getInfo()  # Convert to hectares
                
                return {
                    "status": "success",
                    "analysis_type": "forest_change_detection",
                    "satellite_type": satellite_type,
                    "before_date": before_date,
                    "after_date": after_date,
                    "results": {
                        "total_area_ha": total_area_value,
                        "forest_loss_ha": loss_area_value,
                        "forest_gain_ha": gain_area_value,
                        "net_change_ha": gain_area_value - loss_area_value,
                        "forest_loss_percent": (loss_area_value / total_area_value) * 100 if total_area_value > 0 else 0,
                        "forest_gain_percent": (gain_area_value / total_area_value) * 100 if total_area_value > 0 else 0
                    }
                }
            
            result = await asyncio.get_event_loop().run_in_executor(
                self.thread_pool, _detect_changes
            )
            
            logger.info(f"Forest change detection completed: {result['status']}")
            return result
            
        except Exception as e:
            logger.error(f"Failed to detect forest changes: {e}")
            raise HTTPException(
                status_code=500,
                detail="Failed to detect forest changes"
            )
    
    async def download_and_store_satellite_image(
        self,
        download_url: str,
        project_id: str,
        satellite_metadata: Dict[str, Any]
    ) -> Dict[str, str]:
        """
        Download satellite image from Earth Engine and store in IPFS
        
        Args:
            download_url: Earth Engine download URL
            project_id: Associated project ID
            satellite_metadata: Satellite image metadata
            
        Returns:
            Dictionary with IPFS storage information
        """
        try:
            # Download image data
            async with aiohttp.ClientSession() as session:
                async with session.get(download_url) as response:
                    if response.status != 200:
                        raise HTTPException(
                            status_code=response.status,
                            detail="Failed to download satellite image"
                        )
                    
                    image_data = await response.read()
            
            # Upload to IPFS using the satellite imagery method
            capture_date = datetime.strptime(
                satellite_metadata.get('acquisition_date', '20240101'), 
                '%Y%m%d'
            ) if 'acquisition_date' in satellite_metadata else datetime.utcnow()
            
            ipfs_result = await ipfs_service.upload_satellite_imagery(
                image_data=image_data,
                project_id=project_id,
                satellite_type=satellite_metadata.get('satellite', 'unknown'),
                capture_date=capture_date,
                metadata=satellite_metadata
            )
            
            logger.info(f"Satellite image stored in IPFS: {ipfs_result['ipfs_hash']}")
            return ipfs_result
            
        except Exception as e:
            logger.error(f"Failed to download and store satellite image: {e}")
            raise HTTPException(
                status_code=500,
                detail="Failed to download and store satellite image"
            )
    
    async def get_elevation_data(
        self,
        project_boundary: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Get elevation data for project area
        
        Args:
            project_boundary: GeoJSON polygon of project boundary
            
        Returns:
            Dictionary with elevation statistics
        """
        self._ensure_ee_initialized()
        
        try:
            def _get_elevation():
                coords = project_boundary['coordinates'][0]
                geometry = ee.Geometry.Polygon(coords)
                
                # Load SRTM elevation data
                elevation = ee.Image(self.collections["elevation"])
                
                # Calculate elevation statistics
                stats = elevation.reduceRegion(
                    reducer=ee.Reducer.mean().combine(
                        ee.Reducer.minMax(), '', True
                    ).combine(
                        ee.Reducer.stdDev(), '', True
                    ),
                    geometry=geometry,
                    scale=30,
                    maxPixels=1e9
                ).getInfo()
                
                return {
                    "status": "success",
                    "elevation_stats": {
                        "mean_elevation_m": stats.get('elevation_mean'),
                        "min_elevation_m": stats.get('elevation_min'),
                        "max_elevation_m": stats.get('elevation_max'),
                        "elevation_range_m": (stats.get('elevation_max', 0) - stats.get('elevation_min', 0)),
                        "std_elevation_m": stats.get('elevation_stdDev')
                    }
                }
            
            result = await asyncio.get_event_loop().run_in_executor(
                self.thread_pool, _get_elevation
            )
            
            logger.info(f"Retrieved elevation data: {result['status']}")
            return result
            
        except Exception as e:
            logger.error(f"Failed to get elevation data: {e}")
            raise HTTPException(
                status_code=500,
                detail="Failed to get elevation data"
            )
    
    async def get_service_status(self) -> Dict[str, Any]:
        """
        Get remote sensing service status
        
        Returns:
            Dictionary with service status information
        """
        try:
            status = {
                "status": "operational" if self.ee_initialized else "disconnected",
                "earth_engine": {
                    "initialized": self.ee_initialized,
                    "available_collections": len(self.collections),
                    "collections": list(self.collections.keys())
                },
                "thread_pool": {
                    "max_workers": self.thread_pool._max_workers,
                    "active_workers": len(self.thread_pool._threads)
                }
            }
            
            if self.ee_initialized:
                # Test EE connection
                def _test_connection():
                    try:
                        ee.Number(1).getInfo()
                        return True
                    except:
                        return False
                
                connection_ok = await asyncio.get_event_loop().run_in_executor(
                    self.thread_pool, _test_connection
                )
                status["earth_engine"]["connection"] = "connected" if connection_ok else "error"
            
            return status
            
        except Exception as e:
            logger.error(f"Failed to get service status: {e}")
            return {
                "status": "error",
                "error": str(e)
            }


# Global remote sensing service instance
remote_sensing_service = RemoteSensingService()