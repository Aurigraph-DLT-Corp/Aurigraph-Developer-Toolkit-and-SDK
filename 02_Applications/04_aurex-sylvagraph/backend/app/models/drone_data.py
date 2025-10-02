"""
Aurex Sylvagraph - Drone Data Models
Models for drone operations, imagery, and flight data management
"""

from enum import Enum
from decimal import Decimal
from datetime import datetime
from typing import Optional, List, Dict, Any
from sqlalchemy import String, Integer, Float, Boolean, Text, JSON, ForeignKey, DECIMAL, DateTime
from sqlalchemy.orm import Mapped, mapped_column, relationship
from geoalchemy2 import Geometry
from .base import Base, UUIDMixin, TimestampMixin, SoftDeleteMixin, AuditMixin, GeospatialMixin, IPFSMixin


class DroneType(str, Enum):
    """Types of drones"""
    DJI_PHANTOM = "dji_phantom"
    DJI_MAVIC = "dji_mavic"
    DJI_INSPIRE = "dji_inspire"
    DJI_MATRICE = "dji_matrice"
    AUTEL_EVO = "autel_evo"
    PARROT_ANAFI = "parrot_anafi"
    SENSFLY = "sensfly"
    FIXED_WING = "fixed_wing"
    CUSTOM = "custom"


class FlightStatus(str, Enum):
    """Flight execution status"""
    PLANNED = "planned"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    ABORTED = "aborted"
    FAILED = "failed"
    REVIEWING = "reviewing"
    ARCHIVED = "archived"


class MissionType(str, Enum):
    """Types of drone missions"""
    MAPPING = "mapping"
    MONITORING = "monitoring"
    INSPECTION = "inspection"
    SURVEYING = "surveying"
    MULTISPECTRAL = "multispectral"
    THERMAL = "thermal"
    LIDAR = "lidar"
    COMPLIANCE = "compliance"


class WeatherCondition(str, Enum):
    """Weather conditions for flights"""
    EXCELLENT = "excellent"
    GOOD = "good"
    FAIR = "fair"
    POOR = "poor"
    HAZARDOUS = "hazardous"


class DroneFleet(Base, UUIDMixin, TimestampMixin, SoftDeleteMixin, AuditMixin):
    """Drone fleet management"""
    
    __tablename__ = "drone_fleet"
    
    # Drone identification
    drone_id: Mapped[str] = mapped_column(String(100), unique=True, nullable=False)
    name: Mapped[str] = mapped_column(String(200), nullable=False)
    drone_type: Mapped[DroneType] = mapped_column(String(50), nullable=False)
    
    # Technical specifications
    manufacturer: Mapped[str] = mapped_column(String(100), nullable=False)
    model: Mapped[str] = mapped_column(String(100), nullable=False)
    serial_number: Mapped[str] = mapped_column(String(100), nullable=False)
    
    # Capabilities
    max_flight_time_minutes: Mapped[int] = mapped_column(Integer, nullable=False)
    max_range_meters: Mapped[int] = mapped_column(Integer, nullable=False)
    max_altitude_meters: Mapped[int] = mapped_column(Integer, nullable=False)
    payload_capacity_grams: Mapped[int] = mapped_column(Integer, nullable=False)
    
    # Camera specifications
    camera_specs: Mapped[Dict[str, Any]] = mapped_column(JSON, nullable=True)
    sensor_types: Mapped[List[str]] = mapped_column(JSON, nullable=True)
    
    # Status and maintenance
    operational_status: Mapped[str] = mapped_column(String(50), default="available")
    last_maintenance_date: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    next_maintenance_date: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    flight_hours_total: Mapped[float] = mapped_column(Float, default=0.0)
    
    # Certification and compliance
    registration_number: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    certification_expiry: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    insurance_expiry: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    
    # Relationships
    flights: Mapped[List["DroneFlightPlan"]] = relationship(
        "DroneFlightPlan",
        back_populates="drone",
        cascade="all, delete-orphan"
    )
    
    def __repr__(self):
        return f"<DroneFleet(id='{self.drone_id}', name='{self.name}')>"


class DroneOperator(Base, UUIDMixin, TimestampMixin, SoftDeleteMixin, AuditMixin):
    """Certified drone operators"""
    
    __tablename__ = "drone_operators"
    
    # Personal information
    operator_id: Mapped[str] = mapped_column(String(100), unique=True, nullable=False)
    user_id: Mapped[Optional[str]] = mapped_column(String(36), ForeignKey("users.id"), nullable=True)
    
    first_name: Mapped[str] = mapped_column(String(100), nullable=False)
    last_name: Mapped[str] = mapped_column(String(100), nullable=False)
    phone_number: Mapped[str] = mapped_column(String(20), nullable=False)
    email: Mapped[str] = mapped_column(String(255), nullable=False)
    
    # Certification
    license_number: Mapped[str] = mapped_column(String(100), nullable=False)
    certification_level: Mapped[str] = mapped_column(String(50), nullable=False)
    certification_expiry: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    
    # Experience
    flight_experience_hours: Mapped[float] = mapped_column(Float, default=0.0)
    commercial_flights: Mapped[int] = mapped_column(Integer, default=0)
    
    # Status
    active_status: Mapped[bool] = mapped_column(Boolean, default=True)
    last_training_date: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    
    # Relationships
    flights: Mapped[List["DroneFlightPlan"]] = relationship(
        "DroneFlightPlan",
        back_populates="operator"
    )
    
    def __repr__(self):
        return f"<DroneOperator(id='{self.operator_id}', name='{self.first_name} {self.last_name}')>"


class DroneFlightPlan(Base, UUIDMixin, TimestampMixin, SoftDeleteMixin, AuditMixin, GeospatialMixin, IPFSMixin):
    """Drone flight plans and missions"""
    
    __tablename__ = "drone_flight_plans"
    
    # Flight identification
    flight_id: Mapped[str] = mapped_column(String(100), unique=True, nullable=False)
    flight_name: Mapped[str] = mapped_column(String(200), nullable=False)
    
    # Associations
    project_id: Mapped[str] = mapped_column(String(36), ForeignKey("agroforestry_projects.id"), nullable=False)
    drone_id: Mapped[str] = mapped_column(String(36), ForeignKey("drone_fleet.id"), nullable=False)
    operator_id: Mapped[str] = mapped_column(String(36), ForeignKey("drone_operators.id"), nullable=False)
    
    # Mission details
    mission_type: Mapped[MissionType] = mapped_column(String(50), nullable=False)
    mission_objective: Mapped[str] = mapped_column(Text, nullable=False)
    priority: Mapped[int] = mapped_column(Integer, default=0)
    
    # Flight schedule
    scheduled_date: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    estimated_duration_minutes: Mapped[int] = mapped_column(Integer, nullable=False)
    
    # Flight parameters
    flight_altitude_meters: Mapped[float] = mapped_column(Float, nullable=False)
    ground_speed_ms: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    overlap_percentage: Mapped[int] = mapped_column(Integer, default=80)
    sidelap_percentage: Mapped[int] = mapped_column(Integer, default=70)
    
    # Area of interest (stored as polygon in GeospatialMixin)
    area_hectares: Mapped[float] = mapped_column(Float, nullable=False)
    
    # Flight path (stored as LineString)
    flight_path: Mapped[Optional[str]] = mapped_column(Geometry('LINESTRING', srid=4326), nullable=True)
    waypoints: Mapped[Optional[List[Dict]]] = mapped_column(JSON, nullable=True)
    
    # Status and execution
    status: Mapped[FlightStatus] = mapped_column(String(50), default=FlightStatus.PLANNED)
    approval_status: Mapped[str] = mapped_column(String(50), default="pending")
    
    # Weather and conditions
    weather_condition: Mapped[Optional[WeatherCondition]] = mapped_column(String(50), nullable=True)
    wind_speed_ms: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    visibility_km: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    
    # Compliance and safety
    notam_checked: Mapped[bool] = mapped_column(Boolean, default=False)
    airspace_authorization: Mapped[Optional[str]] = mapped_column(String(200), nullable=True)
    safety_checklist_completed: Mapped[bool] = mapped_column(Boolean, default=False)
    
    # Planning metadata
    planning_software: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    flight_plan_file: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    
    # Relationships
    project: Mapped["AgroforestryProject"] = relationship("AgroforestryProject")
    drone: Mapped[DroneFleet] = relationship("DroneFleet", back_populates="flights")
    operator: Mapped[DroneOperator] = relationship("DroneOperator", back_populates="flights")
    
    flight_logs: Mapped[List["DroneFlightLog"]] = relationship(
        "DroneFlightLog",
        back_populates="flight_plan",
        cascade="all, delete-orphan"
    )
    
    imagery: Mapped[List["DroneImagery"]] = relationship(
        "DroneImagery",
        back_populates="flight_plan",
        cascade="all, delete-orphan"
    )
    
    def __repr__(self):
        return f"<DroneFlightPlan(id='{self.flight_id}', mission='{self.mission_type}')>"


class DroneFlightLog(Base, UUIDMixin, TimestampMixin, AuditMixin, GeospatialMixin):
    """Actual flight execution logs"""
    
    __tablename__ = "drone_flight_logs"
    
    # Flight association
    flight_plan_id: Mapped[str] = mapped_column(String(36), ForeignKey("drone_flight_plans.id"), nullable=False)
    
    # Execution timing
    takeoff_time: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    landing_time: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    actual_duration_minutes: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    
    # Flight statistics
    distance_flown_km: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    max_altitude_reached: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    average_speed_ms: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    
    # Battery and performance
    battery_start_percentage: Mapped[int] = mapped_column(Integer, nullable=False)
    battery_end_percentage: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    
    # Weather during flight
    weather_conditions: Mapped[Dict[str, Any]] = mapped_column(JSON, nullable=True)
    wind_conditions: Mapped[Optional[Dict[str, Any]]] = mapped_column(JSON, nullable=True)
    
    # Execution results
    mission_completed: Mapped[bool] = mapped_column(Boolean, default=False)
    images_captured: Mapped[int] = mapped_column(Integer, default=0)
    videos_captured: Mapped[int] = mapped_column(Integer, default=0)
    
    # Issues and notes
    issues_encountered: Mapped[Optional[List[str]]] = mapped_column(JSON, nullable=True)
    operator_notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    
    # GPS tracking log
    gps_track: Mapped[Optional[str]] = mapped_column(Geometry('LINESTRING', srid=4326), nullable=True)
    
    # Relationships
    flight_plan: Mapped[DroneFlightPlan] = relationship("DroneFlightPlan", back_populates="flight_logs")
    
    def __repr__(self):
        return f"<DroneFlightLog(flight='{self.flight_plan_id}', takeoff='{self.takeoff_time}')>"


class DroneImagery(Base, UUIDMixin, TimestampMixin, SoftDeleteMixin, AuditMixin, GeospatialMixin, IPFSMixin):
    """Drone-captured imagery and metadata"""
    
    __tablename__ = "drone_imagery"
    
    # Associations
    flight_plan_id: Mapped[str] = mapped_column(String(36), ForeignKey("drone_flight_plans.id"), nullable=False)
    project_id: Mapped[str] = mapped_column(String(36), ForeignKey("agroforestry_projects.id"), nullable=False)
    
    # Image identification
    filename: Mapped[str] = mapped_column(String(300), nullable=False)
    image_id: Mapped[str] = mapped_column(String(100), nullable=False)
    sequence_number: Mapped[int] = mapped_column(Integer, nullable=False)
    
    # Image properties
    image_type: Mapped[str] = mapped_column(String(50), nullable=False)  # RGB, multispectral, thermal
    file_format: Mapped[str] = mapped_column(String(20), nullable=False)
    file_size_mb: Mapped[float] = mapped_column(Float, nullable=False)
    
    # Camera settings
    camera_model: Mapped[str] = mapped_column(String(100), nullable=False)
    focal_length_mm: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    iso_value: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    shutter_speed: Mapped[Optional[str]] = mapped_column(String(20), nullable=True)
    aperture: Mapped[Optional[str]] = mapped_column(String(20), nullable=True)
    
    # Spatial information
    capture_timestamp: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    altitude_meters: Mapped[float] = mapped_column(Float, nullable=False)
    heading_degrees: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    pitch_degrees: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    roll_degrees: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    
    # GPS accuracy
    gps_accuracy_meters: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    
    # Image quality
    quality_score: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    blur_score: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    exposure_quality: Mapped[Optional[str]] = mapped_column(String(20), nullable=True)
    
    # Processing status
    processing_status: Mapped[str] = mapped_column(String(50), default="raw")
    processed_versions: Mapped[Optional[List[str]]] = mapped_column(JSON, nullable=True)
    
    # Ground coverage
    ground_sample_distance_cm: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    coverage_area_m2: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    
    # Relationships
    flight_plan: Mapped[DroneFlightPlan] = relationship("DroneFlightPlan", back_populates="imagery")
    project: Mapped["AgroforestryProject"] = relationship("AgroforestryProject")
    
    def __repr__(self):
        return f"<DroneImagery(filename='{self.filename}', sequence={self.sequence_number})>"


class DroneProcessingJob(Base, UUIDMixin, TimestampMixin, AuditMixin):
    """Processing jobs for drone data"""
    
    __tablename__ = "drone_processing_jobs"
    
    # Job information
    job_type: Mapped[str] = mapped_column(String(100), nullable=False)
    job_name: Mapped[str] = mapped_column(String(200), nullable=False)
    
    # Associations
    project_id: Mapped[str] = mapped_column(String(36), ForeignKey("agroforestry_projects.id"), nullable=False)
    flight_plan_id: Mapped[Optional[str]] = mapped_column(String(36), ForeignKey("drone_flight_plans.id"), nullable=True)
    
    # Processing parameters
    input_images: Mapped[List[str]] = mapped_column(JSON, nullable=False)
    processing_software: Mapped[str] = mapped_column(String(100), nullable=False)
    processing_parameters: Mapped[Dict[str, Any]] = mapped_column(JSON, nullable=True)
    
    # Job status
    status: Mapped[str] = mapped_column(String(50), default="pending")
    priority: Mapped[int] = mapped_column(Integer, default=0)
    
    # Progress tracking
    progress_percentage: Mapped[float] = mapped_column(Float, default=0.0)
    current_step: Mapped[Optional[str]] = mapped_column(String(200), nullable=True)
    estimated_completion: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    
    # Timing
    started_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    completed_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    
    # Results
    output_products: Mapped[Optional[List[str]]] = mapped_column(JSON, nullable=True)
    quality_metrics: Mapped[Optional[Dict[str, Any]]] = mapped_column(JSON, nullable=True)
    
    # Error handling
    error_message: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    retry_count: Mapped[int] = mapped_column(Integer, default=0)
    
    # Relationships
    project: Mapped["AgroforestryProject"] = relationship("AgroforestryProject")
    flight_plan: Mapped[Optional[DroneFlightPlan]] = relationship("DroneFlightPlan")
    
    def __repr__(self):
        return f"<DroneProcessingJob(name='{self.job_name}', status='{self.status}')>"