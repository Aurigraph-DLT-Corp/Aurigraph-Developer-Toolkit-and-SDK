"""
Database Models for Aurex HydroPulse Water Management System
Comprehensive models supporting water facilities, IoT sensors, usage tracking, and AWD education
"""
from sqlalchemy import Column, String, Float, Integer, DateTime, Boolean, JSON, Text, ForeignKey, Enum
from sqlalchemy.dialects.postgresql import UUID as PGUUID
from sqlalchemy.orm import relationship
from datetime import datetime
from uuid import uuid4
from enum import Enum as PyEnum
from database import Base

# Enums for status and types
class FacilityType(PyEnum):
    AGRICULTURAL = "agricultural"
    INDUSTRIAL = "industrial"
    MUNICIPAL = "municipal"
    RESIDENTIAL = "residential"
    TREATMENT_PLANT = "treatment_plant"

class SensorType(PyEnum):
    WATER_LEVEL = "water_level"
    FLOW_RATE = "flow_rate"
    PRESSURE = "pressure"
    TEMPERATURE = "temperature"
    pH = "ph"
    TURBIDITY = "turbidity"
    CONDUCTIVITY = "conductivity"
    DISSOLVED_OXYGEN = "dissolved_oxygen"
    NITRATES = "nitrates"
    PHOSPHATES = "phosphates"
    SOIL_MOISTURE = "soil_moisture"
    RAINFALL = "rainfall"

class SensorStatus(PyEnum):
    ACTIVE = "active"
    INACTIVE = "inactive"
    MAINTENANCE = "maintenance"
    ERROR = "error"
    CALIBRATING = "calibrating"

class ProjectStatus(PyEnum):
    PLANNING = "planning"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    CANCELLED = "cancelled"
    ON_HOLD = "on_hold"

class AlertSeverity(PyEnum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"

class AlertStatus(PyEnum):
    ACTIVE = "active"
    ACKNOWLEDGED = "acknowledged"
    RESOLVED = "resolved"
    DISMISSED = "dismissed"

class WaterFacility(Base):
    """Water facility model for managing water infrastructure"""
    __tablename__ = "hydropulse_water_facilities"
    
    id = Column(PGUUID(as_uuid=True), primary_key=True, default=uuid4)
    organization_id = Column(PGUUID(as_uuid=True), nullable=False, index=True)
    name = Column(String(255), nullable=False)
    facility_type = Column(Enum(FacilityType), nullable=False)
    description = Column(Text)
    location = Column(JSON)  # {"latitude": float, "longitude": float, "address": str}
    capacity_liters = Column(Float)  # Maximum capacity in liters
    current_level = Column(Float, default=0.0)  # Current water level (0-100%)
    is_active = Column(Boolean, default=True)
    installation_date = Column(DateTime)
    last_maintenance = Column(DateTime)
    next_maintenance = Column(DateTime)
    operating_hours = Column(JSON)  # {"start": "06:00", "end": "18:00", "days": ["mon", "tue", ...]}
    contact_person = Column(String(255))
    contact_phone = Column(String(50))
    contact_email = Column(String(255))
    meta_data = Column(JSON)  # Additional facility-specific data
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    sensors = relationship("IoTSensor", back_populates="facility", cascade="all, delete-orphan")
    usage_readings = relationship("WaterUsageReading", back_populates="facility", cascade="all, delete-orphan")
    quality_readings = relationship("WaterQualityReading", back_populates="facility", cascade="all, delete-orphan")
    conservation_projects = relationship("ConservationProject", back_populates="facility", cascade="all, delete-orphan")
    vibe_scores = relationship("VibeScore", back_populates="facility", cascade="all, delete-orphan")
    alerts = relationship("Alert", back_populates="facility", cascade="all, delete-orphan")

class IoTSensor(Base):
    """IoT sensor model for real-time water monitoring"""
    __tablename__ = "hydropulse_iot_sensors"
    
    id = Column(PGUUID(as_uuid=True), primary_key=True, default=uuid4)
    organization_id = Column(PGUUID(as_uuid=True), nullable=False, index=True)
    facility_id = Column(PGUUID(as_uuid=True), ForeignKey("hydropulse_water_facilities.id"), nullable=False)
    sensor_type = Column(Enum(SensorType), nullable=False)
    name = Column(String(255), nullable=False)
    description = Column(Text)
    device_id = Column(String(255), unique=True, nullable=False)  # Unique device identifier
    manufacturer = Column(String(255))
    model = Column(String(255))
    firmware_version = Column(String(50))
    status = Column(Enum(SensorStatus), default=SensorStatus.ACTIVE)
    location = Column(JSON)  # Specific location within facility
    measurement_unit = Column(String(50))  # e.g., "liters", "ppm", "°C"
    measurement_range = Column(JSON)  # {"min": float, "max": float}
    accuracy = Column(Float)  # Sensor accuracy percentage
    calibration_date = Column(DateTime)
    next_calibration = Column(DateTime)
    sampling_frequency = Column(Integer, default=300)  # Seconds between readings
    threshold_config = Column(JSON)  # Alert thresholds
    communication_protocol = Column(String(50))  # e.g., "LoRaWAN", "WiFi", "Cellular"
    battery_level = Column(Float)  # Battery percentage (0-100)
    signal_strength = Column(Float)  # Signal strength
    last_reading_at = Column(DateTime)
    is_active = Column(Boolean, default=True)
    meta_data = Column(JSON)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    facility = relationship("WaterFacility", back_populates="sensors")
    usage_readings = relationship("WaterUsageReading", back_populates="sensor", cascade="all, delete-orphan")
    quality_readings = relationship("WaterQualityReading", back_populates="sensor", cascade="all, delete-orphan")

class WaterUsageReading(Base):
    """Water usage readings from sensors and manual inputs"""
    __tablename__ = "hydropulse_usage_readings"
    
    id = Column(PGUUID(as_uuid=True), primary_key=True, default=uuid4)
    organization_id = Column(PGUUID(as_uuid=True), nullable=False, index=True)
    facility_id = Column(PGUUID(as_uuid=True), ForeignKey("hydropulse_water_facilities.id"), nullable=False)
    sensor_id = Column(PGUUID(as_uuid=True), ForeignKey("hydropulse_iot_sensors.id"), nullable=True)
    reading_timestamp = Column(DateTime, nullable=False, index=True)
    volume_liters = Column(Float, nullable=False)
    flow_rate = Column(Float)  # Liters per minute
    pressure_bar = Column(Float)
    temperature_celsius = Column(Float)
    is_estimated = Column(Boolean, default=False)  # True if reading is estimated/interpolated
    quality_score = Column(Float)  # Reading quality score (0-100)
    anomaly_detected = Column(Boolean, default=False)
    anomaly_type = Column(String(50))
    raw_data = Column(JSON)  # Original sensor data
    meta_data = Column(JSON)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    facility = relationship("WaterFacility", back_populates="usage_readings")
    sensor = relationship("IoTSensor", back_populates="usage_readings")

class WaterQualityReading(Base):
    """Water quality measurements and monitoring data"""
    __tablename__ = "hydropulse_quality_readings"
    
    id = Column(PGUUID(as_uuid=True), primary_key=True, default=uuid4)
    organization_id = Column(PGUUID(as_uuid=True), nullable=False, index=True)
    facility_id = Column(PGUUID(as_uuid=True), ForeignKey("hydropulse_water_facilities.id"), nullable=False)
    sensor_id = Column(PGUUID(as_uuid=True), ForeignKey("hydropulse_iot_sensors.id"), nullable=True)
    reading_timestamp = Column(DateTime, nullable=False, index=True)
    
    # Water quality parameters
    ph_level = Column(Float)
    turbidity_ntu = Column(Float)
    conductivity_ms = Column(Float)
    dissolved_oxygen_mg = Column(Float)
    temperature_celsius = Column(Float)
    nitrates_mg = Column(Float)
    phosphates_mg = Column(Float)
    chlorine_mg = Column(Float)
    hardness_mg = Column(Float)
    alkalinity_mg = Column(Float)
    
    # Compliance and safety
    is_safe = Column(Boolean)
    compliance_score = Column(Float)  # Overall compliance score (0-100)
    violations = Column(JSON)  # Array of parameter violations
    
    # Data quality
    is_lab_tested = Column(Boolean, default=False)
    lab_report_id = Column(String(255))
    quality_assurance = Column(JSON)
    
    raw_data = Column(JSON)
    meta_data = Column(JSON)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    facility = relationship("WaterFacility", back_populates="quality_readings")
    sensor = relationship("IoTSensor", back_populates="quality_readings")

class ConservationProject(Base):
    """Water conservation projects and initiatives"""
    __tablename__ = "hydropulse_conservation_projects"
    
    id = Column(PGUUID(as_uuid=True), primary_key=True, default=uuid4)
    organization_id = Column(PGUUID(as_uuid=True), nullable=False, index=True)
    facility_id = Column(PGUUID(as_uuid=True), ForeignKey("hydropulse_water_facilities.id"), nullable=True)
    name = Column(String(255), nullable=False)
    description = Column(Text)
    project_type = Column(String(100))  # e.g., "leak_repair", "efficiency_upgrade", "rainwater_harvesting"
    status = Column(Enum(ProjectStatus), default=ProjectStatus.PLANNING)
    
    # Timeline
    start_date = Column(DateTime)
    expected_completion = Column(DateTime)
    actual_completion = Column(DateTime)
    
    # Financial data
    budget_amount = Column(Float)
    actual_cost = Column(Float)
    currency = Column(String(10), default="USD")
    funding_source = Column(String(255))
    
    # Impact metrics
    expected_water_savings_liters = Column(Float)
    actual_water_savings_liters = Column(Float)
    expected_cost_savings = Column(Float)
    actual_cost_savings = Column(Float)
    carbon_reduction_kg = Column(Float)
    
    # ROI calculations
    payback_period_months = Column(Float)
    roi_percentage = Column(Float)
    npv_amount = Column(Float)
    
    # Project management
    project_manager = Column(String(255))
    team_members = Column(JSON)  # Array of team member information
    milestones = Column(JSON)  # Project milestones and progress
    risks = Column(JSON)  # Risk assessment and mitigation
    
    # Reporting and compliance
    progress_percentage = Column(Float, default=0.0)
    last_update = Column(DateTime)
    documentation = Column(JSON)  # Links to project documents
    
    is_active = Column(Boolean, default=True)
    meta_data = Column(JSON)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    facility = relationship("WaterFacility", back_populates="conservation_projects")

class AWDEducationModule(Base):
    """AWD (Alternate Wetting & Drying) educational content modules"""
    __tablename__ = "hydropulse_awd_modules"
    
    id = Column(PGUUID(as_uuid=True), primary_key=True, default=uuid4)
    title = Column(String(255), nullable=False)
    description = Column(Text)
    category = Column(String(100))  # e.g., "basics", "advanced", "field_implementation"
    difficulty_level = Column(String(50))  # "beginner", "intermediate", "advanced"
    estimated_duration_minutes = Column(Integer)
    
    # Content structure
    content_type = Column(String(50))  # "text", "video", "interactive", "assessment"
    content_data = Column(JSON)  # Structured content data
    learning_objectives = Column(JSON)  # Array of learning objectives
    prerequisites = Column(JSON)  # Array of prerequisite module IDs
    
    # Media and resources
    video_url = Column(String(500))
    video_duration = Column(Integer)  # seconds
    documents = Column(JSON)  # Array of document URLs
    interactive_elements = Column(JSON)  # Interactive components data
    
    # Assessment and certification
    has_assessment = Column(Boolean, default=False)
    assessment_questions = Column(JSON)  # Assessment questions and answers
    passing_score = Column(Float, default=80.0)
    certification_points = Column(Integer, default=10)
    
    # AWD methodology specific
    awd_principles = Column(JSON)  # AWD principles covered
    crop_applications = Column(JSON)  # Applicable crops
    climate_zones = Column(JSON)  # Applicable climate zones
    calculation_examples = Column(JSON)  # AWD calculation examples
    
    # Metadata
    language = Column(String(10), default="en")
    tags = Column(JSON)  # Searchable tags
    is_published = Column(Boolean, default=False)
    version = Column(String(20), default="1.0")
    author = Column(String(255))
    reviewed_by = Column(String(255))
    review_date = Column(DateTime)
    
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    user_progress = relationship("UserProgress", back_populates="module", cascade="all, delete-orphan")

class UserProgress(Base):
    """User progress tracking for AWD education modules"""
    __tablename__ = "hydropulse_user_progress"
    
    id = Column(PGUUID(as_uuid=True), primary_key=True, default=uuid4)
    user_id = Column(PGUUID(as_uuid=True), nullable=False, index=True)
    organization_id = Column(PGUUID(as_uuid=True), nullable=False, index=True)
    module_id = Column(PGUUID(as_uuid=True), ForeignKey("hydropulse_awd_modules.id"), nullable=False)
    
    # Progress tracking
    status = Column(String(50), default="not_started")  # "not_started", "in_progress", "completed", "failed"
    progress_percentage = Column(Float, default=0.0)
    time_spent_minutes = Column(Integer, default=0)
    
    # Assessment results
    assessment_attempts = Column(Integer, default=0)
    best_score = Column(Float)
    latest_score = Column(Float)
    passed_assessment = Column(Boolean, default=False)
    
    # Engagement metrics
    started_at = Column(DateTime)
    last_accessed = Column(DateTime)
    completed_at = Column(DateTime)
    video_watch_percentage = Column(Float)
    interactions_count = Column(Integer, default=0)
    
    # Learning data
    quiz_responses = Column(JSON)  # User responses to quizzes
    notes = Column(Text)  # User notes
    bookmarks = Column(JSON)  # Bookmarked sections
    feedback = Column(JSON)  # User feedback on module
    
    # Certification
    certificate_issued = Column(Boolean, default=False)
    certificate_id = Column(String(255))
    certificate_date = Column(DateTime)
    points_earned = Column(Integer, default=0)
    
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    module = relationship("AWDEducationModule", back_populates="user_progress")

class VibeScore(Base):
    """VIBE framework scoring for water management metrics"""
    __tablename__ = "hydropulse_vibe_scores"
    
    id = Column(PGUUID(as_uuid=True), primary_key=True, default=uuid4)
    organization_id = Column(PGUUID(as_uuid=True), nullable=False, index=True)
    facility_id = Column(PGUUID(as_uuid=True), ForeignKey("hydropulse_water_facilities.id"), nullable=False)
    calculation_date = Column(DateTime, nullable=False, index=True)
    
    # VIBE Framework Scores (0-100)
    velocity_score = Column(Float)  # Speed of water management processes
    intelligence_score = Column(Float)  # Smart analytics and predictions
    balance_score = Column(Float)  # Sustainability and efficiency balance
    excellence_score = Column(Float)  # Overall quality and performance
    
    # Overall VIBE Score
    overall_score = Column(Float)
    performance_grade = Column(String(2))  # A+, A, B+, B, C+, C, D, F
    
    # Detailed metrics
    efficiency_rating = Column(Float)
    conservation_impact = Column(Float)
    quality_consistency = Column(Float)
    predictive_accuracy = Column(Float)
    cost_effectiveness = Column(Float)
    environmental_impact = Column(Float)
    
    # Calculation meta data
    data_points_used = Column(Integer)
    calculation_period_days = Column(Integer)
    confidence_level = Column(Float)
    methodology_version = Column(String(20), default="1.0")
    
    # Benchmarking
    industry_percentile = Column(Float)  # Performance vs industry average
    historical_trend = Column(String(20))  # "improving", "stable", "declining"
    peer_comparison = Column(JSON)  # Comparison with similar facilities
    
    # Improvement recommendations
    recommendations = Column(JSON)  # Array of improvement suggestions
    action_items = Column(JSON)  # Specific action items
    target_scores = Column(JSON)  # Target scores for next period
    
    raw_calculations = Column(JSON)  # Raw calculation data
    meta_data = Column(JSON)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    facility = relationship("WaterFacility", back_populates="vibe_scores")

class Alert(Base):
    """Water management alerts and notifications"""
    __tablename__ = "hydropulse_alerts"
    
    id = Column(PGUUID(as_uuid=True), primary_key=True, default=uuid4)
    organization_id = Column(PGUUID(as_uuid=True), nullable=False, index=True)
    facility_id = Column(PGUUID(as_uuid=True), ForeignKey("hydropulse_water_facilities.id"), nullable=True)
    sensor_id = Column(PGUUID(as_uuid=True), ForeignKey("hydropulse_iot_sensors.id"), nullable=True)
    
    # Alert details
    alert_type = Column(String(100), nullable=False)  # e.g., "low_water_level", "quality_violation"
    severity = Column(Enum(AlertSeverity), nullable=False)
    status = Column(Enum(AlertStatus), default=AlertStatus.ACTIVE)
    title = Column(String(255), nullable=False)
    message = Column(Text, nullable=False)
    
    # Trigger information
    trigger_value = Column(Float)
    threshold_value = Column(Float)
    threshold_type = Column(String(50))  # "above", "below", "equal"
    trigger_timestamp = Column(DateTime, nullable=False)
    
    # Response and resolution
    acknowledged_at = Column(DateTime)
    acknowledged_by = Column(PGUUID(as_uuid=True))
    resolved_at = Column(DateTime)
    resolved_by = Column(PGUUID(as_uuid=True))
    resolution_notes = Column(Text)
    
    # Escalation
    escalation_level = Column(Integer, default=1)
    escalated_at = Column(DateTime)
    escalated_to = Column(JSON)  # Array of user IDs
    
    # Notification tracking
    notifications_sent = Column(JSON)  # Array of notification details
    notification_channels = Column(JSON)  # email, sms, webhook, etc.
    
    # Impact assessment
    estimated_impact = Column(String(100))
    actual_impact = Column(String(100))
    cost_impact = Column(Float)
    
    # Auto-resolution
    auto_resolve = Column(Boolean, default=False)
    auto_resolve_condition = Column(JSON)
    
    # Related data
    related_readings = Column(JSON)  # Related sensor readings
    context_data = Column(JSON)  # Additional context
    attachments = Column(JSON)  # File attachments
    
    is_active = Column(Boolean, default=True)
    meta_data = Column(JSON)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    facility = relationship("WaterFacility", back_populates="alerts")

class OptimizationRecommendation(Base):
    """AI-powered optimization recommendations for water management"""
    __tablename__ = "hydropulse_optimization_recommendations"
    
    id = Column(PGUUID(as_uuid=True), primary_key=True, default=uuid4)
    organization_id = Column(PGUUID(as_uuid=True), nullable=False, index=True)
    facility_id = Column(PGUUID(as_uuid=True), ForeignKey("hydropulse_water_facilities.id"), nullable=False)
    
    # Recommendation details
    category = Column(String(100), nullable=False)  # e.g., "efficiency", "cost_reduction", "quality_improvement"
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=False)
    priority = Column(String(50))  # "low", "medium", "high", "critical"
    confidence_score = Column(Float)  # AI confidence in recommendation (0-100)
    
    # Impact projections
    projected_water_savings = Column(Float)  # Liters per month
    projected_cost_savings = Column(Float)  # Currency per month
    implementation_cost = Column(Float)
    payback_period_months = Column(Float)
    environmental_benefit = Column(JSON)  # CO2 reduction, etc.
    
    # Implementation details
    implementation_steps = Column(JSON)  # Step-by-step implementation
    required_resources = Column(JSON)  # Required resources and skills
    estimated_implementation_time = Column(Integer)  # Days
    risk_assessment = Column(JSON)  # Implementation risks
    
    # Data basis
    analysis_period_start = Column(DateTime)
    analysis_period_end = Column(DateTime)
    data_sources = Column(JSON)  # Data sources used for analysis
    model_version = Column(String(50))
    calculation_method = Column(String(100))
    
    # Status tracking
    status = Column(String(50), default="pending")  # "pending", "accepted", "rejected", "implemented"
    reviewed_at = Column(DateTime)
    reviewed_by = Column(PGUUID(as_uuid=True))
    reviewer_notes = Column(Text)
    
    # Implementation tracking
    implementation_started = Column(DateTime)
    implementation_completed = Column(DateTime)
    actual_results = Column(JSON)  # Actual vs projected results
    
    # Machine learning feedback
    user_feedback = Column(JSON)  # User feedback for ML improvement
    effectiveness_rating = Column(Float)  # User rating of recommendation
    
    expires_at = Column(DateTime)  # When recommendation expires
    is_active = Column(Boolean, default=True)
    meta_data = Column(JSON)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

class CommunityPost(Base):
    """Community knowledge sharing posts for AWD and water management"""
    __tablename__ = "hydropulse_community_posts"
    
    id = Column(PGUUID(as_uuid=True), primary_key=True, default=uuid4)
    author_id = Column(PGUUID(as_uuid=True), nullable=False)
    author_organization_id = Column(PGUUID(as_uuid=True), nullable=False)
    
    # Post content
    title = Column(String(255), nullable=False)
    content = Column(Text, nullable=False)
    post_type = Column(String(50))  # "question", "experience", "tip", "case_study"
    topic = Column(String(100))  # "awd_implementation", "water_conservation", etc.
    
    # Classification and filtering
    tags = Column(JSON)  # Array of tags
    crop_types = Column(JSON)  # Relevant crop types
    climate_zones = Column(JSON)  # Applicable climate zones
    geographic_region = Column(String(100))
    difficulty_level = Column(String(50))
    
    # Engagement metrics
    views_count = Column(Integer, default=0)
    likes_count = Column(Integer, default=0)
    replies_count = Column(Integer, default=0)
    shares_count = Column(Integer, default=0)
    helpful_votes = Column(Integer, default=0)
    
    # Content quality
    is_verified = Column(Boolean, default=False)  # Verified by experts
    verified_by = Column(PGUUID(as_uuid=True))
    verification_date = Column(DateTime)
    quality_score = Column(Float)  # Community quality rating
    
    # Media attachments
    images = Column(JSON)  # Array of image URLs
    documents = Column(JSON)  # Array of document URLs
    videos = Column(JSON)  # Array of video URLs
    
    # Moderation
    is_published = Column(Boolean, default=True)
    is_featured = Column(Boolean, default=False)
    moderated_by = Column(PGUUID(as_uuid=True))
    moderation_notes = Column(Text)
    flagged_count = Column(Integer, default=0)
    
    # Discussion threading
    parent_post_id = Column(PGUUID(as_uuid=True), ForeignKey("hydropulse_community_posts.id"))
    thread_depth = Column(Integer, default=0)
    is_answer = Column(Boolean, default=False)
    accepted_answer = Column(Boolean, default=False)
    
    # SEO and discovery
    slug = Column(String(255), unique=True)
    meta_description = Column(Text)
    keywords = Column(JSON)
    
    # Analytics
    last_activity = Column(DateTime, default=datetime.utcnow)
    trending_score = Column(Float)
    search_ranking = Column(Float)
    
    is_active = Column(Boolean, default=True)
    meta_data = Column(JSON)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Self-referential relationship for replies
    replies = relationship("CommunityPost", cascade="all, delete-orphan")

class AlertRule(Base):
    """Configurable alert rules for automated monitoring"""
    __tablename__ = "hydropulse_alert_rules"
    
    id = Column(PGUUID(as_uuid=True), primary_key=True, default=uuid4)
    organization_id = Column(PGUUID(as_uuid=True), nullable=False, index=True)
    facility_id = Column(PGUUID(as_uuid=True), ForeignKey("hydropulse_water_facilities.id"), nullable=True)
    sensor_id = Column(PGUUID(as_uuid=True), ForeignKey("hydropulse_iot_sensors.id"), nullable=True)
    
    # Rule definition
    name = Column(String(255), nullable=False)
    description = Column(Text)
    rule_type = Column(String(100), nullable=False)  # "threshold", "anomaly", "pattern", "composite"
    
    # Condition logic
    condition_expression = Column(Text, nullable=False)  # e.g., "water_level < 20 AND trend == 'decreasing'"
    threshold_value = Column(Float)
    threshold_operator = Column(String(20))  # "<", ">", "==", "!=", "between"
    time_window_minutes = Column(Integer, default=60)
    consecutive_violations = Column(Integer, default=1)
    
    # Alert configuration
    severity = Column(Enum(AlertSeverity), default=AlertSeverity.MEDIUM)
    alert_template = Column(JSON)  # Alert message template
    notification_channels = Column(JSON)  # Array of notification methods
    escalation_rules = Column(JSON)  # Escalation configuration
    
    # Frequency control
    cooldown_period_minutes = Column(Integer, default=60)  # Minimum time between alerts
    max_alerts_per_hour = Column(Integer, default=10)
    
    # Schedule and conditions
    active_schedule = Column(JSON)  # When rule is active
    seasonal_adjustments = Column(JSON)  # Seasonal threshold adjustments
    weather_dependent = Column(Boolean, default=False)
    
    # Machine learning integration
    use_ml_prediction = Column(Boolean, default=False)
    ml_model_config = Column(JSON)
    prediction_horizon_minutes = Column(Integer)
    
    # Rule management
    is_active = Column(Boolean, default=True)
    test_mode = Column(Boolean, default=False)  # For testing without sending alerts
    last_triggered = Column(DateTime)
    trigger_count = Column(Integer, default=0)
    
    # Performance metrics
    false_positive_count = Column(Integer, default=0)
    true_positive_count = Column(Integer, default=0)
    effectiveness_score = Column(Float)
    
    created_by = Column(PGUUID(as_uuid=True), nullable=False)
    meta_data = Column(JSON)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

# Create all tables
__all__ = [
    "WaterFacility", "IoTSensor", "WaterUsageReading", "WaterQualityReading",
    "ConservationProject", "AWDEducationModule", "UserProgress", "VibeScore",
    "Alert", "OptimizationRecommendation", "CommunityPost", "AlertRule",
    "FacilityType", "SensorType", "SensorStatus", "ProjectStatus",
    "AlertSeverity", "AlertStatus"
]