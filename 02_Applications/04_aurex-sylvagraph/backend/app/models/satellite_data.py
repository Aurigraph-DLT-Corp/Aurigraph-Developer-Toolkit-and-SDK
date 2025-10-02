"""
Aurex Sylvagraph - Satellite Data Models
Models for satellite imagery, remote sensing data, and analysis results
"""

from enum import Enum
from decimal import Decimal
from datetime import datetime
from typing import Optional, List, Dict, Any
from sqlalchemy import String, Integer, Float, Boolean, Text, JSON, ForeignKey, DECIMAL, DateTime
from sqlalchemy.orm import Mapped, mapped_column, relationship
from geoalchemy2 import Geometry
from .base import Base, UUIDMixin, TimestampMixin, SoftDeleteMixin, AuditMixin, GeospatialMixin, IPFSMixin


class SatelliteType(str, Enum):
    """Types of satellite imagery sources"""
    LANDSAT_8 = "landsat_8"
    LANDSAT_9 = "landsat_9"
    SENTINEL_1 = "sentinel_1"
    SENTINEL_2 = "sentinel_2"
    MODIS = "modis"
    SPOT = "spot"
    WORLDVIEW = "worldview"
    PLEIADES = "pleiades"
    CUSTOM = "custom"


class ProcessingStatus(str, Enum):
    """Processing status for satellite data"""
    PENDING = "pending"
    PROCESSING = "processing"
    COMPLETED = "completed"
    FAILED = "failed"
    ARCHIVED = "archived"


class AnalysisType(str, Enum):
    """Types of satellite data analysis"""
    NDVI = "ndvi"  # Normalized Difference Vegetation Index
    EVI = "evi"    # Enhanced Vegetation Index
    NDMI = "ndmi"  # Normalized Difference Moisture Index
    NBR = "nbr"    # Normalized Burn Ratio
    CHANGE_DETECTION = "change_detection"
    BIOMASS_ESTIMATION = "biomass_estimation"
    DEFORESTATION = "deforestation"
    FOREST_HEALTH = "forest_health"
    CARBON_MONITORING = "carbon_monitoring"


class SatelliteImagery(Base, UUIDMixin, TimestampMixin, SoftDeleteMixin, AuditMixin, GeospatialMixin, IPFSMixin):
    """Satellite imagery metadata and storage"""
    
    __tablename__ = "satellite_imagery"
    
    # Project association
    project_id: Mapped[str] = mapped_column(String(36), ForeignKey("agroforestry_projects.id"), nullable=False)
    
    # Satellite information
    satellite_type: Mapped[SatelliteType] = mapped_column(String(50), nullable=False)
    sensor: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    platform: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    
    # Image identification
    scene_id: Mapped[str] = mapped_column(String(200), nullable=False)
    product_id: Mapped[Optional[str]] = mapped_column(String(200), nullable=True)
    
    # Temporal information
    acquisition_date: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    processing_date: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    
    # Spatial information
    cloud_cover: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    sun_azimuth: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    sun_elevation: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    
    # Image properties
    resolution_meters: Mapped[float] = mapped_column(Float, nullable=False)
    bands_available: Mapped[List[str]] = mapped_column(JSON, nullable=True)
    projection: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    
    # File information
    file_format: Mapped[str] = mapped_column(String(20), default="tiff")
    file_size_mb: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    
    # Processing status
    processing_status: Mapped[ProcessingStatus] = mapped_column(String(50), default=ProcessingStatus.PENDING)
    
    # Quality metrics
    quality_score: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    usability: Mapped[Optional[str]] = mapped_column(String(20), nullable=True)
    
    # External references
    provider_url: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    download_url: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    
    # Metadata storage
    raw_metadata: Mapped[Optional[Dict[str, Any]]] = mapped_column(JSON, nullable=True)
    
    # Relationships
    project: Mapped["AgroforestryProject"] = relationship("AgroforestryProject")
    analyses: Mapped[List["SatelliteAnalysis"]] = relationship(
        "SatelliteAnalysis",
        back_populates="imagery",
        cascade="all, delete-orphan"
    )
    
    def __repr__(self):
        return f"<SatelliteImagery(scene_id='{self.scene_id}', satellite='{self.satellite_type}')>"


class SatelliteAnalysis(Base, UUIDMixin, TimestampMixin, SoftDeleteMixin, AuditMixin, IPFSMixin):
    """Satellite imagery analysis results"""
    
    __tablename__ = "satellite_analysis"
    
    # Image association
    imagery_id: Mapped[str] = mapped_column(String(36), ForeignKey("satellite_imagery.id"), nullable=False)
    project_id: Mapped[str] = mapped_column(String(36), ForeignKey("agroforestry_projects.id"), nullable=False)
    
    # Analysis information
    analysis_type: Mapped[AnalysisType] = mapped_column(String(50), nullable=False)
    algorithm_version: Mapped[str] = mapped_column(String(50), nullable=False)
    
    # Processing information
    processing_status: Mapped[ProcessingStatus] = mapped_column(String(50), default=ProcessingStatus.PENDING)
    processing_start: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    processing_end: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    processing_duration_seconds: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    
    # Results
    result_values: Mapped[Dict[str, Any]] = mapped_column(JSON, nullable=True)
    statistics: Mapped[Optional[Dict[str, Any]]] = mapped_column(JSON, nullable=True)
    
    # Quality metrics
    confidence_score: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    error_metrics: Mapped[Optional[Dict[str, Any]]] = mapped_column(JSON, nullable=True)
    
    # Output information
    output_format: Mapped[str] = mapped_column(String(20), default="geotiff")
    output_size_mb: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    
    # Processing parameters
    parameters_used: Mapped[Optional[Dict[str, Any]]] = mapped_column(JSON, nullable=True)
    
    # Relationships
    imagery: Mapped[SatelliteImagery] = relationship("SatelliteImagery", back_populates="analyses")
    project: Mapped["AgroforestryProject"] = relationship("AgroforestryProject")
    
    def __repr__(self):
        return f"<SatelliteAnalysis(type='{self.analysis_type}', status='{self.processing_status}')>"


class ChangeDetection(Base, UUIDMixin, TimestampMixin, SoftDeleteMixin, AuditMixin, GeospatialMixin, IPFSMixin):
    """Change detection analysis between satellite images"""
    
    __tablename__ = "change_detection"
    
    # Project association
    project_id: Mapped[str] = mapped_column(String(36), ForeignKey("agroforestry_projects.id"), nullable=False)
    
    # Image associations
    before_image_id: Mapped[str] = mapped_column(String(36), ForeignKey("satellite_imagery.id"), nullable=False)
    after_image_id: Mapped[str] = mapped_column(String(36), ForeignKey("satellite_imagery.id"), nullable=False)
    
    # Analysis period
    analysis_start_date: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    analysis_end_date: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    time_span_days: Mapped[int] = mapped_column(Integer, nullable=False)
    
    # Detection algorithm
    algorithm_used: Mapped[str] = mapped_column(String(100), nullable=False)
    threshold_values: Mapped[Dict[str, float]] = mapped_column(JSON, nullable=True)
    
    # Results
    processing_status: Mapped[ProcessingStatus] = mapped_column(String(50), default=ProcessingStatus.PENDING)
    
    # Change statistics
    total_area_analyzed_ha: Mapped[float] = mapped_column(Float, nullable=False)
    forest_gain_ha: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    forest_loss_ha: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    net_change_ha: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    
    # Change percentages
    forest_gain_percent: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    forest_loss_percent: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    
    # Quality metrics
    accuracy_score: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    confidence_level: Mapped[Optional[str]] = mapped_column(String(20), nullable=True)
    
    # Change detection results
    change_polygons: Mapped[Optional[str]] = mapped_column(Geometry('MULTIPOLYGON', srid=4326), nullable=True)
    change_summary: Mapped[Optional[Dict[str, Any]]] = mapped_column(JSON, nullable=True)
    
    # Relationships
    project: Mapped["AgroforestryProject"] = relationship("AgroforestryProject")
    before_image: Mapped[SatelliteImagery] = relationship("SatelliteImagery", foreign_keys=[before_image_id])
    after_image: Mapped[SatelliteImagery] = relationship("SatelliteImagery", foreign_keys=[after_image_id])
    
    def __repr__(self):
        return f"<ChangeDetection(project='{self.project_id}', span='{self.time_span_days} days')>"


class VegetationIndex(Base, UUIDMixin, TimestampMixin, SoftDeleteMixin, AuditMixin, GeospatialMixin, IPFSMixin):
    """Vegetation indices calculated from satellite imagery"""
    
    __tablename__ = "vegetation_indices"
    
    # Associations
    imagery_id: Mapped[str] = mapped_column(String(36), ForeignKey("satellite_imagery.id"), nullable=False)
    project_id: Mapped[str] = mapped_column(String(36), ForeignKey("agroforestry_projects.id"), nullable=False)
    
    # Index information
    index_type: Mapped[AnalysisType] = mapped_column(String(50), nullable=False)
    calculation_date: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    
    # Statistical values
    mean_value: Mapped[float] = mapped_column(Float, nullable=False)
    median_value: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    std_deviation: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    min_value: Mapped[float] = mapped_column(Float, nullable=False)
    max_value: Mapped[float] = mapped_column(Float, nullable=False)
    
    # Distribution percentiles
    percentile_25: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    percentile_75: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    percentile_95: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    
    # Area coverage
    total_pixels: Mapped[int] = mapped_column(Integer, nullable=False)
    valid_pixels: Mapped[int] = mapped_column(Integer, nullable=False)
    coverage_percentage: Mapped[float] = mapped_column(Float, nullable=False)
    
    # Thresholds and classifications
    vegetation_health_score: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    health_category: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    
    # Processing information
    algorithm_parameters: Mapped[Optional[Dict[str, Any]]] = mapped_column(JSON, nullable=True)
    quality_flags: Mapped[Optional[List[str]]] = mapped_column(JSON, nullable=True)
    
    # Relationships
    imagery: Mapped[SatelliteImagery] = relationship("SatelliteImagery")
    project: Mapped["AgroforestryProject"] = relationship("AgroforestryProject")
    
    def __repr__(self):
        return f"<VegetationIndex(type='{self.index_type}', mean='{self.mean_value:.3f}')>"


class SatelliteProcessingJob(Base, UUIDMixin, TimestampMixin, AuditMixin):
    """Background processing jobs for satellite data"""
    
    __tablename__ = "satellite_processing_jobs"
    
    # Job information
    job_type: Mapped[str] = mapped_column(String(100), nullable=False)
    job_name: Mapped[str] = mapped_column(String(200), nullable=False)
    
    # Associations
    project_id: Mapped[str] = mapped_column(String(36), ForeignKey("agroforestry_projects.id"), nullable=False)
    imagery_id: Mapped[Optional[str]] = mapped_column(String(36), ForeignKey("satellite_imagery.id"), nullable=True)
    
    # Job status
    status: Mapped[ProcessingStatus] = mapped_column(String(50), default=ProcessingStatus.PENDING)
    priority: Mapped[int] = mapped_column(Integer, default=0)
    
    # Timing
    scheduled_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    started_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    completed_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    
    # Progress tracking
    progress_percentage: Mapped[float] = mapped_column(Float, default=0.0)
    current_step: Mapped[Optional[str]] = mapped_column(String(200), nullable=True)
    
    # Job parameters and results
    input_parameters: Mapped[Dict[str, Any]] = mapped_column(JSON, nullable=False)
    output_results: Mapped[Optional[Dict[str, Any]]] = mapped_column(JSON, nullable=True)
    
    # Error handling
    error_message: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    retry_count: Mapped[int] = mapped_column(Integer, default=0)
    max_retries: Mapped[int] = mapped_column(Integer, default=3)
    
    # Resources
    estimated_duration_minutes: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    actual_duration_minutes: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    
    # Relationships
    project: Mapped["AgroforestryProject"] = relationship("AgroforestryProject")
    imagery: Mapped[Optional[SatelliteImagery]] = relationship("SatelliteImagery")
    
    def __repr__(self):
        return f"<SatelliteProcessingJob(name='{self.job_name}', status='{self.status}')>"