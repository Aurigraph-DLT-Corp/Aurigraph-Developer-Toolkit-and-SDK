"""
Aurex Sylvagraph - Remote Sensing and Monitoring Models
Satellite, drone, and field data monitoring with AI/ML analysis
"""

from enum import Enum
from decimal import Decimal
from datetime import datetime
from typing import Optional, List, Dict, Any
from sqlalchemy import String, Integer, Float, Boolean, Text, JSON, ForeignKey, DECIMAL, DateTime, LargeBinary
from sqlalchemy.orm import Mapped, mapped_column, relationship
from geoalchemy2 import Geometry, Raster
from .base import Base, UUIDMixin, TimestampMixin, SoftDeleteMixin, AuditMixin, GeospatialMixin, IPFSMixin


class DataSource(str, Enum):
    """Sources of monitoring data"""
    SATELLITE_SENTINEL2 = "satellite_sentinel2"
    SATELLITE_PLANET = "satellite_planet"
    SATELLITE_LANDSAT = "satellite_landsat"
    DRONE_RGB = "drone_rgb"
    DRONE_MULTISPECTRAL = "drone_multispectral"
    DRONE_LIDAR = "drone_lidar"
    FIELD_SURVEY = "field_survey"
    GROUND_TRUTH = "ground_truth"
    AI_ANALYSIS = "ai_analysis"


class MonitoringType(str, Enum):
    """Types of monitoring activities"""
    BASELINE_ASSESSMENT = "baseline_assessment"
    PERIODIC_MONITORING = "periodic_monitoring"
    VERIFICATION_MONITORING = "verification_monitoring"
    CHANGE_DETECTION = "change_detection"
    DEFORESTATION_ALERT = "deforestation_alert"
    GROWTH_ASSESSMENT = "growth_assessment"
    BIODIVERSITY_SURVEY = "biodiversity_survey"
    FIELD_VALIDATION = "field_validation"


class ProcessingStatus(str, Enum):
    """Data processing status"""
    RAW = "raw"
    PROCESSING = "processing"
    PROCESSED = "processed"
    AI_ANALYZED = "ai_analyzed"
    VALIDATED = "validated"
    QUALITY_CHECKED = "quality_checked"
    APPROVED = "approved"
    REJECTED = "rejected"


class MonitoringSession(Base, UUIDMixin, TimestampMixin, SoftDeleteMixin, AuditMixin, GeospatialMixin, IPFSMixin):
    """Monitoring session tracking for projects"""
    
    __tablename__ = "monitoring_sessions"
    
    project_id: Mapped[str] = mapped_column(String(36), ForeignKey("agroforestry_projects.id"), nullable=False)
    
    # Session identification
    session_code: Mapped[str] = mapped_column(String(50), unique=True, nullable=False)
    monitoring_type: Mapped[MonitoringType] = mapped_column(String(50), nullable=False)
    
    # Timing
    monitoring_date: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    data_collection_start: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    data_collection_end: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    
    # Weather and conditions
    weather_conditions: Mapped[Optional[Dict[str, Any]]] = mapped_column(JSON, nullable=True)
    cloud_coverage_percent: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    
    # Data sources and quality
    primary_data_source: Mapped[DataSource] = mapped_column(String(50), nullable=False)
    data_quality_score: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    processing_status: Mapped[ProcessingStatus] = mapped_column(String(50), default=ProcessingStatus.RAW)
    
    # Team and equipment
    field_team_leader: Mapped[Optional[str]] = mapped_column(String(36), ForeignKey("users.id"), nullable=True)
    drone_operator: Mapped[Optional[str]] = mapped_column(String(36), ForeignKey("users.id"), nullable=True)
    equipment_used: Mapped[Optional[List[str]]] = mapped_column(JSON, nullable=True)
    
    # Coverage and scope
    area_covered_hectares: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    parcels_monitored: Mapped[Optional[List[str]]] = mapped_column(JSON, nullable=True)
    
    # Results summary
    total_images_captured: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    total_data_points: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    key_findings: Mapped[Optional[Dict[str, Any]]] = mapped_column(JSON, nullable=True)
    
    # Compliance and validation
    validation_status: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    validated_by: Mapped[Optional[str]] = mapped_column(String(36), ForeignKey("users.id"), nullable=True)
    validation_date: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    
    # Relationships
    project: Mapped["AgroforestryProject"] = relationship("AgroforestryProject", back_populates="monitoring_sessions")
    
    satellite_data: Mapped[List["SatelliteImagery"]] = relationship(
        "SatelliteImagery",
        back_populates="monitoring_session",
        cascade="all, delete-orphan"
    )
    
    drone_data: Mapped[List["DroneImagery"]] = relationship(
        "DroneImagery", 
        back_populates="monitoring_session",
        cascade="all, delete-orphan"
    )
    
    field_data: Mapped[List["FieldSurveyData"]] = relationship(
        "FieldSurveyData",
        back_populates="monitoring_session", 
        cascade="all, delete-orphan"
    )
    
    ai_analyses: Mapped[List["AIAnalysisResult"]] = relationship(
        "AIAnalysisResult",
        back_populates="monitoring_session",
        cascade="all, delete-orphan"
    )
    
    def __repr__(self):
        return f"<MonitoringSession(code='{self.session_code}', type='{self.monitoring_type}')>"


class SatelliteImagery(Base, UUIDMixin, TimestampMixin, SoftDeleteMixin, GeospatialMixin, IPFSMixin):
    """Satellite imagery data storage and metadata"""
    
    __tablename__ = "satellite_imagery"
    
    monitoring_session_id: Mapped[str] = mapped_column(String(36), ForeignKey("monitoring_sessions.id"), nullable=False)
    
    # Image identification
    image_id: Mapped[str] = mapped_column(String(100), nullable=False)
    satellite: Mapped[str] = mapped_column(String(50), nullable=False)  # Sentinel-2, Landsat-8, etc.
    sensor: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    
    # Acquisition details
    acquisition_date: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    cloud_coverage: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    sun_azimuth: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    sun_elevation: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    
    # Image properties
    resolution_meters: Mapped[float] = mapped_column(Float, nullable=False)
    bands: Mapped[List[str]] = mapped_column(JSON, nullable=False)  # ["B02", "B03", "B04", "B08"]
    image_format: Mapped[str] = mapped_column(String(20), default="GeoTIFF")
    
    # Storage and access
    file_path: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    file_size_mb: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    download_url: Mapped[Optional[str]] = mapped_column(String(1000), nullable=True)
    
    # Processing status
    processing_level: Mapped[str] = mapped_column(String(20), default="L1C")  # L1C, L2A, etc.
    atmospheric_correction: Mapped[bool] = mapped_column(Boolean, default=False)
    
    # Quality metrics
    data_quality_flags: Mapped[Optional[Dict[str, Any]]] = mapped_column(JSON, nullable=True)
    usability_score: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    
    # Relationships
    monitoring_session: Mapped[MonitoringSession] = relationship("MonitoringSession", back_populates="satellite_data")
    
    def __repr__(self):
        return f"<SatelliteImagery(id='{self.image_id}', satellite='{self.satellite}')>"


class DroneImagery(Base, UUIDMixin, TimestampMixin, SoftDeleteMixin, GeospatialMixin, IPFSMixin):
    """Drone imagery data storage and flight metadata"""
    
    __tablename__ = "drone_imagery"
    
    monitoring_session_id: Mapped[str] = mapped_column(String(36), ForeignKey("monitoring_sessions.id"), nullable=False)
    
    # Flight identification
    flight_id: Mapped[str] = mapped_column(String(100), nullable=False)
    drone_model: Mapped[str] = mapped_column(String(100), nullable=False)
    camera_model: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    
    # Flight parameters
    flight_date: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    flight_altitude: Mapped[float] = mapped_column(Float, nullable=False)  # meters AGL
    flight_speed: Mapped[Optional[float]] = mapped_column(Float, nullable=True)  # m/s
    overlap_forward: Mapped[Optional[float]] = mapped_column(Float, nullable=True)  # percentage
    overlap_side: Mapped[Optional[float]] = mapped_column(Float, nullable=True)  # percentage
    
    # Image properties
    total_images: Mapped[int] = mapped_column(Integer, nullable=False)
    ground_sampling_distance: Mapped[float] = mapped_column(Float, nullable=False)  # cm/pixel
    
    # Processing and outputs
    orthomosaic_path: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    dsm_path: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)  # Digital Surface Model
    dtm_path: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)  # Digital Terrain Model
    point_cloud_path: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    
    # Quality metrics
    processing_report: Mapped[Optional[Dict[str, Any]]] = mapped_column(JSON, nullable=True)
    accuracy_assessment: Mapped[Optional[Dict[str, Any]]] = mapped_column(JSON, nullable=True)
    
    # Flight conditions
    weather_conditions: Mapped[Optional[Dict[str, Any]]] = mapped_column(JSON, nullable=True)
    wind_speed_ms: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    
    # Relationships
    monitoring_session: Mapped[MonitoringSession] = relationship("MonitoringSession", back_populates="drone_data")
    
    def __repr__(self):
        return f"<DroneImagery(flight_id='{self.flight_id}', drone='{self.drone_model}')>"


class FieldSurveyData(Base, UUIDMixin, TimestampMixin, SoftDeleteMixin, GeospatialMixin, IPFSMixin):
    """Field survey and ground truth data collection"""
    
    __tablename__ = "field_survey_data"
    
    monitoring_session_id: Mapped[str] = mapped_column(String(36), ForeignKey("monitoring_sessions.id"), nullable=False)
    parcel_id: Mapped[Optional[str]] = mapped_column(String(36), ForeignKey("project_parcels.id"), nullable=True)
    
    # Survey identification
    survey_point_id: Mapped[str] = mapped_column(String(50), nullable=False)
    surveyor_id: Mapped[str] = mapped_column(String(36), ForeignKey("users.id"), nullable=False)
    
    # Location and setup
    gps_accuracy: Mapped[Optional[float]] = mapped_column(Float, nullable=True)  # meters
    plot_size_m2: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    
    # Tree measurements
    tree_count: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    species_identified: Mapped[Optional[List[str]]] = mapped_column(JSON, nullable=True)
    average_height_m: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    average_dbh_cm: Mapped[Optional[float]] = mapped_column(Float, nullable=True)  # Diameter at Breast Height
    survival_rate: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    
    # Biodiversity observations
    bird_species_count: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    wildlife_observations: Mapped[Optional[List[str]]] = mapped_column(JSON, nullable=True)
    plant_diversity_index: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    
    # Soil and environmental data
    soil_ph: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    soil_moisture: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    soil_organic_matter: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    canopy_cover_percent: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    
    # Photos and documentation
    photos_taken: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    photo_urls: Mapped[Optional[List[str]]] = mapped_column(JSON, nullable=True)
    notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    
    # Data validation
    data_quality_flags: Mapped[Optional[Dict[str, Any]]] = mapped_column(JSON, nullable=True)
    verified_by: Mapped[Optional[str]] = mapped_column(String(36), ForeignKey("users.id"), nullable=True)
    
    # Relationships
    monitoring_session: Mapped[MonitoringSession] = relationship("MonitoringSession", back_populates="field_data")
    surveyor: Mapped["User"] = relationship("User", foreign_keys=[surveyor_id])
    
    def __repr__(self):
        return f"<FieldSurveyData(point_id='{self.survey_point_id}', trees='{self.tree_count}')>"


class AIAnalysisResult(Base, UUIDMixin, TimestampMixin, SoftDeleteMixin, AuditMixin, IPFSMixin):
    """AI/ML analysis results for monitoring data"""
    
    __tablename__ = "ai_analysis_results"
    
    monitoring_session_id: Mapped[str] = mapped_column(String(36), ForeignKey("monitoring_sessions.id"), nullable=False)
    
    # Analysis identification
    analysis_type: Mapped[str] = mapped_column(String(50), nullable=False)  # biomass, canopy, change_detection
    model_name: Mapped[str] = mapped_column(String(100), nullable=False)
    model_version: Mapped[str] = mapped_column(String(20), nullable=False)
    
    # Input data
    input_data_sources: Mapped[List[str]] = mapped_column(JSON, nullable=False)
    processing_date: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    
    # Biomass estimation results
    estimated_biomass_tons_ha: Mapped[Optional[Decimal]] = mapped_column(DECIMAL(10, 4), nullable=True)
    carbon_stock_tons_ha: Mapped[Optional[Decimal]] = mapped_column(DECIMAL(10, 4), nullable=True)
    biomass_confidence_interval: Mapped[Optional[Dict[str, float]]] = mapped_column(JSON, nullable=True)
    
    # Canopy analysis
    canopy_cover_percent: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    canopy_height_m: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    leaf_area_index: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    
    # Change detection
    area_change_hectares: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    deforestation_detected: Mapped[Optional[bool]] = mapped_column(Boolean, nullable=True)
    change_confidence: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    
    # Biodiversity metrics
    biodiversity_index: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    habitat_quality_score: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    species_richness_estimate: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    
    # Quality and validation
    model_accuracy: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    uncertainty_metrics: Mapped[Optional[Dict[str, Any]]] = mapped_column(JSON, nullable=True)
    validation_status: Mapped[str] = mapped_column(String(50), default="pending")
    
    # Output data and visualization
    result_files: Mapped[Optional[List[str]]] = mapped_column(JSON, nullable=True)
    visualization_urls: Mapped[Optional[List[str]]] = mapped_column(JSON, nullable=True)
    
    # Processing metadata
    processing_time_seconds: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    compute_resources_used: Mapped[Optional[Dict[str, Any]]] = mapped_column(JSON, nullable=True)
    
    # Relationships
    monitoring_session: Mapped[MonitoringSession] = relationship("MonitoringSession", back_populates="ai_analyses")
    
    def __repr__(self):
        return f"<AIAnalysisResult(type='{self.analysis_type}', model='{self.model_name}')>"


class DeforestationAlert(Base, UUIDMixin, TimestampMixin, SoftDeleteMixin, GeospatialMixin, IPFSMixin):
    """Real-time deforestation and change alerts"""
    
    __tablename__ = "deforestation_alerts"
    
    project_id: Mapped[str] = mapped_column(String(36), ForeignKey("agroforestry_projects.id"), nullable=False)
    monitoring_session_id: Mapped[Optional[str]] = mapped_column(String(36), ForeignKey("monitoring_sessions.id"), nullable=True)
    
    # Alert details
    alert_type: Mapped[str] = mapped_column(String(50), nullable=False)  # deforestation, degradation, fire
    severity: Mapped[str] = mapped_column(String(20), nullable=False)  # low, medium, high, critical
    confidence: Mapped[float] = mapped_column(Float, nullable=False)
    
    # Detection details
    detected_date: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    detection_source: Mapped[DataSource] = mapped_column(String(50), nullable=False)
    affected_area_hectares: Mapped[float] = mapped_column(Float, nullable=False)
    
    # Response and resolution
    alert_status: Mapped[str] = mapped_column(String(50), default="active")  # active, investigating, resolved, false_positive
    response_team_assigned: Mapped[Optional[str]] = mapped_column(String(36), ForeignKey("users.id"), nullable=True)
    investigation_notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    resolved_date: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    
    # Evidence and documentation
    evidence_images: Mapped[Optional[List[str]]] = mapped_column(JSON, nullable=True)
    comparison_data: Mapped[Optional[Dict[str, Any]]] = mapped_column(JSON, nullable=True)
    
    def __repr__(self):
        return f"<DeforestationAlert(type='{self.alert_type}', severity='{self.severity}')>"