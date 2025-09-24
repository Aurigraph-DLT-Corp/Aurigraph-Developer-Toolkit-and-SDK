"""
Pydantic Schemas for Aurex HydroPulse Water Management API
Data validation and serialization schemas for all API endpoints
"""
from pydantic import BaseModel, Field, validator, root_validator
from typing import Optional, List, Dict, Any, Union
from datetime import datetime
from uuid import UUID
from enum import Enum

# Enums matching database models
class FacilityTypeEnum(str, Enum):
    AGRICULTURAL = "agricultural"
    INDUSTRIAL = "industrial"
    MUNICIPAL = "municipal"
    RESIDENTIAL = "residential"
    TREATMENT_PLANT = "treatment_plant"

class SensorTypeEnum(str, Enum):
    WATER_LEVEL = "water_level"
    FLOW_RATE = "flow_rate"
    PRESSURE = "pressure"
    TEMPERATURE = "temperature"
    PH = "ph"
    TURBIDITY = "turbidity"
    CONDUCTIVITY = "conductivity"
    DISSOLVED_OXYGEN = "dissolved_oxygen"
    NITRATES = "nitrates"
    PHOSPHATES = "phosphates"
    SOIL_MOISTURE = "soil_moisture"
    RAINFALL = "rainfall"

class SensorStatusEnum(str, Enum):
    ACTIVE = "active"
    INACTIVE = "inactive"
    MAINTENANCE = "maintenance"
    ERROR = "error"
    CALIBRATING = "calibrating"

class ProjectStatusEnum(str, Enum):
    PLANNING = "planning"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    CANCELLED = "cancelled"
    ON_HOLD = "on_hold"

class AlertSeverityEnum(str, Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"

class AlertStatusEnum(str, Enum):
    ACTIVE = "active"
    ACKNOWLEDGED = "acknowledged"
    RESOLVED = "resolved"
    DISMISSED = "dismissed"

# Base schemas
class BaseSchema(BaseModel):
    class Config:
        from_attributes = True
        use_enum_values = True
        json_encoders = {datetime: lambda v: v.isoformat()}

# Water Facility Schemas
class LocationSchema(BaseModel):
    latitude: float = Field(..., ge=-90, le=90)
    longitude: float = Field(..., ge=-180, le=180)
    address: Optional[str] = None
    city: Optional[str] = None
    country: Optional[str] = None

class OperatingHoursSchema(BaseModel):
    start: str = Field(..., pattern=r'^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$')
    end: str = Field(..., pattern=r'^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$')
    days: List[str] = Field(..., min_items=1)

class FacilityCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)
    facility_type: FacilityTypeEnum
    description: Optional[str] = None
    location: Optional[LocationSchema] = None
    capacity_liters: Optional[float] = Field(None, gt=0)
    installation_date: Optional[datetime] = None
    operating_hours: Optional[OperatingHoursSchema] = None
    contact_person: Optional[str] = Field(None, max_length=255)
    contact_phone: Optional[str] = Field(None, max_length=50)
    contact_email: Optional[str] = Field(None, max_length=255)
    metadata: Optional[Dict[str, Any]] = None

class FacilityUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=255)
    description: Optional[str] = None
    location: Optional[LocationSchema] = None
    capacity_liters: Optional[float] = Field(None, gt=0)
    current_level: Optional[float] = Field(None, ge=0, le=100)
    is_active: Optional[bool] = None
    last_maintenance: Optional[datetime] = None
    next_maintenance: Optional[datetime] = None
    operating_hours: Optional[OperatingHoursSchema] = None
    contact_person: Optional[str] = Field(None, max_length=255)
    contact_phone: Optional[str] = Field(None, max_length=50)
    contact_email: Optional[str] = Field(None, max_length=255)
    metadata: Optional[Dict[str, Any]] = None

class FacilityResponse(BaseSchema):
    id: UUID
    organization_id: UUID
    name: str
    facility_type: FacilityTypeEnum
    description: Optional[str]
    location: Optional[LocationSchema]
    capacity_liters: Optional[float]
    current_level: float
    is_active: bool
    installation_date: Optional[datetime]
    last_maintenance: Optional[datetime]
    next_maintenance: Optional[datetime]
    operating_hours: Optional[OperatingHoursSchema]
    contact_person: Optional[str]
    contact_phone: Optional[str]
    contact_email: Optional[str]
    metadata: Optional[Dict[str, Any]]
    created_at: datetime
    updated_at: datetime
    
    # Computed fields
    sensor_count: Optional[int] = 0
    latest_reading: Optional[datetime] = None
    health_status: Optional[str] = "unknown"
    efficiency_score: Optional[float] = None

# IoT Sensor Schemas
class MeasurementRangeSchema(BaseModel):
    min: float
    max: float
    unit: str

class ThresholdConfigSchema(BaseModel):
    low_warning: Optional[float] = None
    low_critical: Optional[float] = None
    high_warning: Optional[float] = None
    high_critical: Optional[float] = None

class SensorCreate(BaseModel):
    facility_id: UUID
    sensor_type: SensorTypeEnum
    name: str = Field(..., min_length=1, max_length=255)
    description: Optional[str] = None
    device_id: str = Field(..., min_length=1, max_length=255)
    manufacturer: Optional[str] = Field(None, max_length=255)
    model: Optional[str] = Field(None, max_length=255)
    measurement_unit: str = Field(..., max_length=50)
    measurement_range: Optional[MeasurementRangeSchema] = None
    accuracy: Optional[float] = Field(None, ge=0, le=100)
    sampling_frequency: Optional[int] = Field(300, gt=0)
    threshold_config: Optional[ThresholdConfigSchema] = None
    communication_protocol: Optional[str] = Field(None, max_length=50)
    metadata: Optional[Dict[str, Any]] = None

class SensorResponse(BaseSchema):
    id: UUID
    organization_id: UUID
    facility_id: UUID
    sensor_type: SensorTypeEnum
    name: str
    description: Optional[str]
    device_id: str
    manufacturer: Optional[str]
    model: Optional[str]
    firmware_version: Optional[str]
    status: SensorStatusEnum
    location: Optional[Dict[str, Any]]
    measurement_unit: str
    measurement_range: Optional[MeasurementRangeSchema]
    accuracy: Optional[float]
    calibration_date: Optional[datetime]
    next_calibration: Optional[datetime]
    sampling_frequency: int
    threshold_config: Optional[ThresholdConfigSchema]
    communication_protocol: Optional[str]
    battery_level: Optional[float]
    signal_strength: Optional[float]
    last_reading_at: Optional[datetime]
    is_active: bool
    created_at: datetime
    updated_at: datetime
    
    # Computed fields
    readings_count_24h: Optional[int] = 0
    latest_value: Optional[float] = None
    health_status: Optional[str] = "unknown"

# Usage Reading Schemas
class UsageReadingCreate(BaseModel):
    facility_id: UUID
    sensor_id: Optional[UUID] = None
    reading_timestamp: datetime
    volume_liters: float = Field(..., ge=0)
    flow_rate: Optional[float] = Field(None, ge=0)
    pressure_bar: Optional[float] = Field(None, ge=0)
    temperature_celsius: Optional[float] = None
    is_estimated: bool = False
    raw_data: Optional[Dict[str, Any]] = None
    metadata: Optional[Dict[str, Any]] = None

class UsageReadingResponse(BaseSchema):
    id: UUID
    organization_id: UUID
    facility_id: UUID
    sensor_id: Optional[UUID]
    reading_timestamp: datetime
    volume_liters: float
    flow_rate: Optional[float]
    pressure_bar: Optional[float]
    temperature_celsius: Optional[float]
    is_estimated: bool
    quality_score: Optional[float]
    anomaly_detected: bool
    anomaly_type: Optional[str]
    created_at: datetime

# Quality Reading Schemas
class QualityReadingCreate(BaseModel):
    facility_id: UUID
    sensor_id: Optional[UUID] = None
    reading_timestamp: datetime
    ph_level: Optional[float] = Field(None, ge=0, le=14)
    turbidity_ntu: Optional[float] = Field(None, ge=0)
    conductivity_ms: Optional[float] = Field(None, ge=0)
    dissolved_oxygen_mg: Optional[float] = Field(None, ge=0)
    temperature_celsius: Optional[float] = None
    nitrates_mg: Optional[float] = Field(None, ge=0)
    phosphates_mg: Optional[float] = Field(None, ge=0)
    chlorine_mg: Optional[float] = Field(None, ge=0)
    hardness_mg: Optional[float] = Field(None, ge=0)
    alkalinity_mg: Optional[float] = Field(None, ge=0)
    is_lab_tested: bool = False
    lab_report_id: Optional[str] = None
    raw_data: Optional[Dict[str, Any]] = None
    metadata: Optional[Dict[str, Any]] = None

class QualityReadingResponse(BaseSchema):
    id: UUID
    organization_id: UUID
    facility_id: UUID
    sensor_id: Optional[UUID]
    reading_timestamp: datetime
    ph_level: Optional[float]
    turbidity_ntu: Optional[float]
    conductivity_ms: Optional[float]
    dissolved_oxygen_mg: Optional[float]
    temperature_celsius: Optional[float]
    nitrates_mg: Optional[float]
    phosphates_mg: Optional[float]
    chlorine_mg: Optional[float]
    hardness_mg: Optional[float]
    alkalinity_mg: Optional[float]
    is_safe: Optional[bool]
    compliance_score: Optional[float]
    violations: Optional[List[Dict[str, Any]]]
    is_lab_tested: bool
    lab_report_id: Optional[str]
    created_at: datetime

# Conservation Project Schemas
class ProjectCreate(BaseModel):
    facility_id: Optional[UUID] = None
    name: str = Field(..., min_length=1, max_length=255)
    description: Optional[str] = None
    project_type: str = Field(..., max_length=100)
    start_date: Optional[datetime] = None
    expected_completion: Optional[datetime] = None
    budget_amount: Optional[float] = Field(None, gt=0)
    currency: str = Field("USD", max_length=10)
    funding_source: Optional[str] = Field(None, max_length=255)
    expected_water_savings_liters: Optional[float] = Field(None, gt=0)
    expected_cost_savings: Optional[float] = Field(None, gt=0)
    project_manager: Optional[str] = Field(None, max_length=255)
    team_members: Optional[List[Dict[str, Any]]] = None
    milestones: Optional[List[Dict[str, Any]]] = None
    metadata: Optional[Dict[str, Any]] = None

class ProjectResponse(BaseSchema):
    id: UUID
    organization_id: UUID
    facility_id: Optional[UUID]
    name: str
    description: Optional[str]
    project_type: str
    status: ProjectStatusEnum
    start_date: Optional[datetime]
    expected_completion: Optional[datetime]
    actual_completion: Optional[datetime]
    budget_amount: Optional[float]
    actual_cost: Optional[float]
    currency: str
    funding_source: Optional[str]
    expected_water_savings_liters: Optional[float]
    actual_water_savings_liters: Optional[float]
    expected_cost_savings: Optional[float]
    actual_cost_savings: Optional[float]
    carbon_reduction_kg: Optional[float]
    payback_period_months: Optional[float]
    roi_percentage: Optional[float]
    npv_amount: Optional[float]
    project_manager: Optional[str]
    team_members: Optional[List[Dict[str, Any]]]
    milestones: Optional[List[Dict[str, Any]]]
    progress_percentage: float
    last_update: Optional[datetime]
    is_active: bool
    created_at: datetime
    updated_at: datetime

# AWD Education Schemas
class AWDModuleResponse(BaseSchema):
    id: UUID
    title: str
    description: Optional[str]
    category: Optional[str]
    difficulty_level: Optional[str]
    estimated_duration_minutes: Optional[int]
    content_type: Optional[str]
    learning_objectives: Optional[List[str]]
    prerequisites: Optional[List[UUID]]
    video_url: Optional[str]
    video_duration: Optional[int]
    has_assessment: bool
    passing_score: float
    certification_points: int
    awd_principles: Optional[List[str]]
    crop_applications: Optional[List[str]]
    climate_zones: Optional[List[str]]
    language: str
    tags: Optional[List[str]]
    is_published: bool
    version: str
    author: Optional[str]
    created_at: datetime
    updated_at: datetime

class UserProgressResponse(BaseSchema):
    id: UUID
    user_id: UUID
    module_id: UUID
    status: str
    progress_percentage: float
    time_spent_minutes: int
    assessment_attempts: int
    best_score: Optional[float]
    latest_score: Optional[float]
    passed_assessment: bool
    started_at: Optional[datetime]
    last_accessed: Optional[datetime]
    completed_at: Optional[datetime]
    video_watch_percentage: Optional[float]
    certificate_issued: bool
    certificate_id: Optional[str]
    points_earned: int
    created_at: datetime
    updated_at: datetime

# VIBE Score Schemas
class VibeScoreResponse(BaseSchema):
    id: UUID
    organization_id: UUID
    facility_id: UUID
    calculation_date: datetime
    velocity_score: Optional[float]
    intelligence_score: Optional[float]
    balance_score: Optional[float]
    excellence_score: Optional[float]
    overall_score: Optional[float]
    performance_grade: Optional[str]
    efficiency_rating: Optional[float]
    conservation_impact: Optional[float]
    quality_consistency: Optional[float]
    predictive_accuracy: Optional[float]
    cost_effectiveness: Optional[float]
    environmental_impact: Optional[float]
    data_points_used: Optional[int]
    calculation_period_days: Optional[int]
    confidence_level: Optional[float]
    industry_percentile: Optional[float]
    historical_trend: Optional[str]
    recommendations: Optional[List[Dict[str, Any]]]
    target_scores: Optional[Dict[str, float]]
    created_at: datetime

# Alert Schemas
class AlertResponse(BaseSchema):
    id: UUID
    organization_id: UUID
    facility_id: Optional[UUID]
    sensor_id: Optional[UUID]
    alert_type: str
    severity: AlertSeverityEnum
    status: AlertStatusEnum
    title: str
    message: str
    trigger_value: Optional[float]
    threshold_value: Optional[float]
    trigger_timestamp: datetime
    acknowledged_at: Optional[datetime]
    resolved_at: Optional[datetime]
    escalation_level: int
    estimated_impact: Optional[str]
    actual_impact: Optional[str]
    cost_impact: Optional[float]
    is_active: bool
    created_at: datetime
    updated_at: datetime

# Optimization Schemas
class OptimizationResponse(BaseSchema):
    id: UUID
    organization_id: UUID
    facility_id: UUID
    category: str
    title: str
    description: str
    priority: Optional[str]
    confidence_score: Optional[float]
    projected_water_savings: Optional[float]
    projected_cost_savings: Optional[float]
    implementation_cost: Optional[float]
    payback_period_months: Optional[float]
    implementation_steps: Optional[List[Dict[str, Any]]]
    required_resources: Optional[List[str]]
    estimated_implementation_time: Optional[int]
    risk_assessment: Optional[Dict[str, Any]]
    status: str
    reviewed_at: Optional[datetime]
    expires_at: Optional[datetime]
    is_active: bool
    created_at: datetime
    updated_at: datetime

# Dashboard and Analytics Schemas
class UsageAnalyticsSchema(BaseModel):
    period: str
    total_usage_liters: float
    average_daily_usage: float
    peak_usage_day: Optional[datetime]
    peak_usage_amount: Optional[float]
    efficiency_trend: Optional[str]
    cost_estimate: Optional[float]
    conservation_savings: Optional[float]
    comparison_data: Optional[Dict[str, Any]]

class QualityAnalyticsSchema(BaseModel):
    compliance_percentage: float
    average_quality_score: float
    parameter_trends: Dict[str, List[float]]
    violations_count: int
    improvement_areas: List[str]

class DashboardStats(BaseModel):
    facilities_count: int
    active_sensors_count: int
    total_usage_last_30_days: float
    average_quality_score: float
    active_alerts_count: int
    conservation_projects_count: int
    water_savings_percentage: float
    cost_savings_amount: float
    vibe_overall_score: Optional[float]
    efficiency_trend: str
    recent_alerts: List[AlertResponse]
    usage_analytics: UsageAnalyticsSchema
    quality_analytics: QualityAnalyticsSchema
    upcoming_maintenance: List[Dict[str, Any]]
    recommendations_count: int

# WebSocket Schemas
class WebSocketMessage(BaseModel):
    type: str
    channel: str
    data: Dict[str, Any]
    timestamp: datetime
    facility_id: Optional[UUID] = None
    sensor_id: Optional[UUID] = None

class SensorDataMessage(WebSocketMessage):
    type: str = "sensor_data"
    sensor_reading: Dict[str, Any]

class AlertMessage(WebSocketMessage):
    type: str = "alert"
    alert: AlertResponse

# Export and Integration Schemas
class ExportRequest(BaseModel):
    facility_id: UUID
    start_date: datetime
    end_date: datetime
    data_type: str = Field(..., pattern=r'^(usage|quality|all)$')
    format: str = Field('csv', pattern=r'^(csv|json|xlsx)$')
    include_metadata: bool = False

class ExportResponse(BaseModel):
    export_id: UUID
    status: str
    download_url: Optional[str] = None
    file_size: Optional[int] = None
    records_count: int
    created_at: datetime
    expires_at: datetime

# Community Schemas
class CommunityPostCreate(BaseModel):
    title: str = Field(..., min_length=1, max_length=255)
    content: str = Field(..., min_length=1)
    post_type: str = Field(..., pattern=r'^(question|experience|tip|case_study)$')
    topic: str = Field(..., max_length=100)
    tags: Optional[List[str]] = None
    crop_types: Optional[List[str]] = None
    climate_zones: Optional[List[str]] = None
    geographic_region: Optional[str] = None
    difficulty_level: Optional[str] = None
    parent_post_id: Optional[UUID] = None

class CommunityPostResponse(BaseSchema):
    id: UUID
    author_id: UUID
    title: str
    content: str
    post_type: str
    topic: str
    tags: Optional[List[str]]
    crop_types: Optional[List[str]]
    climate_zones: Optional[List[str]]
    geographic_region: Optional[str]
    difficulty_level: Optional[str]
    views_count: int
    likes_count: int
    replies_count: int
    helpful_votes: int
    is_verified: bool
    quality_score: Optional[float]
    is_featured: bool
    parent_post_id: Optional[UUID]
    thread_depth: int
    is_answer: bool
    accepted_answer: bool
    created_at: datetime
    updated_at: datetime

# Validation helpers
class PaginationParams(BaseModel):
    page: int = Field(1, ge=1)
    size: int = Field(20, ge=1, le=100)
    sort_by: Optional[str] = "created_at"
    sort_order: str = Field("desc", pattern=r'^(asc|desc)$')

class DateRangeParams(BaseModel):
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None
    
    @root_validator
    def validate_date_range(cls, values):
        start_date = values.get('start_date')
        end_date = values.get('end_date')
        
        if start_date and end_date and start_date >= end_date:
            raise ValueError('start_date must be before end_date')
        
        return values

# Error Response Schemas
class ErrorResponse(BaseModel):
    error: str
    message: str
    details: Optional[Dict[str, Any]] = None
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    request_id: Optional[str] = None

class ValidationErrorResponse(BaseModel):
    error: str = "validation_error"
    message: str
    validation_errors: List[Dict[str, Any]]
    timestamp: datetime = Field(default_factory=datetime.utcnow)

# Success Response Schemas
class SuccessResponse(BaseModel):
    success: bool = True
    message: str
    data: Optional[Dict[str, Any]] = None
    timestamp: datetime = Field(default_factory=datetime.utcnow)

class BulkOperationResponse(BaseModel):
    success_count: int
    error_count: int
    total_count: int
    errors: Optional[List[Dict[str, Any]]] = None
    success_ids: Optional[List[UUID]] = None

# API Health Schemas
class HealthCheckResponse(BaseModel):
    status: str
    version: str
    timestamp: datetime
    services: Dict[str, str]
    database: str
    websockets: str
    uptime_seconds: Optional[float] = None

class ServiceStatusResponse(BaseModel):
    service_name: str
    status: str
    last_check: datetime
    response_time_ms: Optional[float] = None
    details: Optional[Dict[str, Any]] = None

# All schemas for export
__all__ = [
    # Enums
    "FacilityTypeEnum", "SensorTypeEnum", "SensorStatusEnum", "ProjectStatusEnum",
    "AlertSeverityEnum", "AlertStatusEnum",
    
    # Base schemas
    "BaseSchema", "LocationSchema", "OperatingHoursSchema",
    
    # Facility schemas
    "FacilityCreate", "FacilityUpdate", "FacilityResponse",
    
    # Sensor schemas
    "MeasurementRangeSchema", "ThresholdConfigSchema", "SensorCreate", "SensorResponse",
    
    # Reading schemas
    "UsageReadingCreate", "UsageReadingResponse", "QualityReadingCreate", "QualityReadingResponse",
    
    # Project schemas
    "ProjectCreate", "ProjectResponse",
    
    # Education schemas
    "AWDModuleResponse", "UserProgressResponse",
    
    # VIBE and analytics
    "VibeScoreResponse", "DashboardStats", "UsageAnalyticsSchema", "QualityAnalyticsSchema",
    
    # Alerts and optimization
    "AlertResponse", "OptimizationResponse",
    
    # WebSocket schemas
    "WebSocketMessage", "SensorDataMessage", "AlertMessage",
    
    # Export schemas
    "ExportRequest", "ExportResponse",
    
    # Community schemas
    "CommunityPostCreate", "CommunityPostResponse",
    
    # Utility schemas
    "PaginationParams", "DateRangeParams", "ErrorResponse", "ValidationErrorResponse",
    "SuccessResponse", "BulkOperationResponse", "HealthCheckResponse", "ServiceStatusResponse"
]