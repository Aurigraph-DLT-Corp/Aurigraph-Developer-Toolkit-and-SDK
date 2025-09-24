"""
Database Models for ML Operations
Models for storing ML predictions, training data, model metadata, and compliance workflows
"""

from datetime import datetime
from typing import Optional, Dict, Any, List
from sqlalchemy import Column, String, Integer, Float, DateTime, Boolean, Text, JSON, ForeignKey, Enum
from sqlalchemy.orm import relationship, Mapped, mapped_column
from sqlalchemy.dialects.postgresql import UUID, ARRAY
import uuid
import enum

from .base import Base, TimestampMixin, UUIDMixin, SoftDeleteMixin, IPFSMixin, AuditMixin


class ModelType(enum.Enum):
    """ML Model types"""
    BIOMASS_ESTIMATION = "biomass_estimation"
    CHANGE_DETECTION = "change_detection"
    BIODIVERSITY_ASSESSMENT = "biodiversity_assessment"
    CARBON_SEQUESTRATION = "carbon_sequestration"


class ModelStatus(enum.Enum):
    """Model lifecycle status"""
    TRAINING = "training"
    TRAINED = "trained"
    DEPLOYED = "deployed"
    RETIRED = "retired"
    FAILED = "failed"


class PredictionStatus(enum.Enum):
    """Prediction processing status"""
    PENDING = "pending"
    PROCESSING = "processing"
    COMPLETED = "completed"
    FAILED = "failed"


class ComplianceStandard(enum.Enum):
    """Carbon credit compliance standards"""
    ISO_14064_2 = "iso_14064_2"
    VERRA_VCS = "verra_vcs"
    GOLD_STANDARD = "gold_standard"
    ART_TREES = "art_trees"


class WorkflowStage(enum.Enum):
    """VVB workflow stages"""
    VALIDATION = "validation"
    VERIFICATION = "verification"
    ISSUANCE = "issuance"


# ML Models Registry
class MLModel(Base, TimestampMixin, UUIDMixin, SoftDeleteMixin, IPFSMixin, AuditMixin):
    """Registry of ML models and their metadata"""
    
    __tablename__ = "ml_models"
    
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    model_type: Mapped[ModelType] = mapped_column(Enum(ModelType), nullable=False)
    version: Mapped[str] = mapped_column(String(50), nullable=False)
    status: Mapped[ModelStatus] = mapped_column(Enum(ModelStatus), default=ModelStatus.TRAINING)
    
    # Model configuration and metadata
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    configuration: Mapped[Dict[str, Any]] = mapped_column(JSON, nullable=True)
    hyperparameters: Mapped[Dict[str, Any]] = mapped_column(JSON, nullable=True)
    
    # Training information
    training_data_source: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    training_samples: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    validation_samples: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    training_duration_seconds: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    
    # Performance metrics
    accuracy: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    precision: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    recall: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    f1_score: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    rmse: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    mae: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    r2_score: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    
    # Model artifacts
    model_file_path: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    model_size_mb: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    
    # Deployment information
    deployment_endpoint: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    deployed_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    retired_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    
    # Feature information
    input_features: Mapped[List[str]] = mapped_column(ARRAY(String), nullable=True)
    output_features: Mapped[List[str]] = mapped_column(ARRAY(String), nullable=True)
    
    # Relationships
    predictions = relationship("MLPrediction", back_populates="model")
    training_runs = relationship("ModelTrainingRun", back_populates="model")


class ModelTrainingRun(Base, TimestampMixin, UUIDMixin, AuditMixin):
    """Individual training runs for ML models"""
    
    __tablename__ = "model_training_runs"
    
    model_id: Mapped[str] = mapped_column(String(36), ForeignKey("ml_models.id"), nullable=False)
    run_number: Mapped[int] = mapped_column(Integer, nullable=False)
    status: Mapped[str] = mapped_column(String(50), nullable=False)
    
    # Training parameters
    hyperparameters: Mapped[Dict[str, Any]] = mapped_column(JSON, nullable=True)
    training_config: Mapped[Dict[str, Any]] = mapped_column(JSON, nullable=True)
    
    # Training progress
    start_time: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    end_time: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    duration_seconds: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    
    # Training metrics
    training_loss: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    validation_loss: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    final_metrics: Mapped[Dict[str, Any]] = mapped_column(JSON, nullable=True)
    
    # Training logs and artifacts
    logs: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    checkpoint_path: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    
    # Relationships
    model = relationship("MLModel", back_populates="training_runs")


class MLPrediction(Base, TimestampMixin, UUIDMixin, IPFSMixin):
    """ML model predictions and results"""
    
    __tablename__ = "ml_predictions"
    
    model_id: Mapped[str] = mapped_column(String(36), ForeignKey("ml_models.id"), nullable=False)
    project_id: Mapped[Optional[str]] = mapped_column(String(36), ForeignKey("projects.id"), nullable=True)
    
    # Prediction metadata
    prediction_type: Mapped[ModelType] = mapped_column(Enum(ModelType), nullable=False)
    status: Mapped[PredictionStatus] = mapped_column(Enum(PredictionStatus), default=PredictionStatus.PENDING)
    
    # Input data
    input_data: Mapped[Dict[str, Any]] = mapped_column(JSON, nullable=True)
    input_data_hash: Mapped[Optional[str]] = mapped_column(String(64), nullable=True)
    
    # Prediction results
    prediction_result: Mapped[Dict[str, Any]] = mapped_column(JSON, nullable=True)
    confidence_score: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    uncertainty_lower: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    uncertainty_upper: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    
    # Processing metadata
    processing_time_ms: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    processing_node: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    
    # Geospatial information
    location_lat: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    location_lon: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    area_hectares: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    
    # Quality metrics
    data_quality_score: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    prediction_quality_flags: Mapped[List[str]] = mapped_column(ARRAY(String), nullable=True)
    
    # Relationships
    model = relationship("MLModel", back_populates="predictions")
    project = relationship("Project", backref="ml_predictions")


class BiomassEstimate(Base, TimestampMixin, UUIDMixin, IPFSMixin):
    """Biomass estimation results"""
    
    __tablename__ = "biomass_estimates"
    
    prediction_id: Mapped[str] = mapped_column(String(36), ForeignKey("ml_predictions.id"), nullable=False)
    project_id: Mapped[str] = mapped_column(String(36), ForeignKey("projects.id"), nullable=False)
    
    # Biomass estimates
    aboveground_biomass_kg_ha: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    belowground_biomass_kg_ha: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    total_biomass_kg_ha: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    
    # Carbon estimates
    carbon_content_kg_ha: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    co2_equivalent_t_ha: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    
    # Uncertainty ranges
    biomass_uncertainty_pct: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    carbon_uncertainty_pct: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    
    # Methodology information
    estimation_method: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    allometric_equations_used: Mapped[List[str]] = mapped_column(ARRAY(String), nullable=True)
    
    # Quality indicators
    data_completeness: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    estimation_confidence: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    
    # Relationships
    prediction = relationship("MLPrediction", backref="biomass_estimate")
    project = relationship("Project", backref="biomass_estimates")


class ChangeDetectionResult(Base, TimestampMixin, UUIDMixin, IPFSMixin):
    """Forest change detection results"""
    
    __tablename__ = "change_detection_results"
    
    prediction_id: Mapped[str] = mapped_column(String(36), ForeignKey("ml_predictions.id"), nullable=False)
    project_id: Mapped[str] = mapped_column(String(36), ForeignKey("projects.id"), nullable=False)
    
    # Change detection results
    change_detected: Mapped[bool] = mapped_column(Boolean, default=False)
    change_probability: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    change_type: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    change_severity: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    
    # Affected area
    total_area_ha: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    changed_area_ha: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    change_percentage: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    
    # Temporal information
    reference_date: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    comparison_date: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    time_period_days: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    
    # Alert information
    is_alert: Mapped[bool] = mapped_column(Boolean, default=False)
    alert_priority: Mapped[Optional[str]] = mapped_column(String(20), nullable=True)
    requires_investigation: Mapped[bool] = mapped_column(Boolean, default=False)
    
    # Additional metadata
    detection_method: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    data_sources: Mapped[List[str]] = mapped_column(ARRAY(String), nullable=True)
    
    # Relationships
    prediction = relationship("MLPrediction", backref="change_detection_result")
    project = relationship("Project", backref="change_detection_results")


class CarbonCalculation(Base, TimestampMixin, UUIDMixin, IPFSMixin):
    """Carbon sequestration calculations"""
    
    __tablename__ = "carbon_calculations"
    
    project_id: Mapped[str] = mapped_column(String(36), ForeignKey("projects.id"), nullable=False)
    prediction_id: Mapped[Optional[str]] = mapped_column(String(36), ForeignKey("ml_predictions.id"), nullable=True)
    
    # Carbon pools
    aboveground_carbon_tco2: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    belowground_carbon_tco2: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    deadwood_carbon_tco2: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    litter_carbon_tco2: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    soil_carbon_tco2: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    total_carbon_tco2: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    
    # Baseline and project scenarios
    baseline_carbon_tco2: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    project_carbon_tco2: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    net_sequestration_tco2: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    
    # Uncertainty and confidence
    uncertainty_range_lower: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    uncertainty_range_upper: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    confidence_level: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    
    # Methodology information
    calculation_method: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    carbon_fraction: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    
    # Quality assurance
    calculation_quality_score: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    qa_flags: Mapped[List[str]] = mapped_column(ARRAY(String), nullable=True)
    
    # Relationships
    project = relationship("Project", backref="carbon_calculations")
    prediction = relationship("MLPrediction", backref="carbon_calculation")


# DMRV Compliance Models
class ComplianceWorkflow(Base, TimestampMixin, UUIDMixin, SoftDeleteMixin, IPFSMixin, AuditMixin):
    """DMRV compliance workflow tracking"""
    
    __tablename__ = "compliance_workflows"
    
    project_id: Mapped[str] = mapped_column(String(36), ForeignKey("projects.id"), nullable=False)
    standard: Mapped[ComplianceStandard] = mapped_column(Enum(ComplianceStandard), nullable=False)
    workflow_stage: Mapped[WorkflowStage] = mapped_column(Enum(WorkflowStage), nullable=False)
    
    # Workflow status
    status: Mapped[str] = mapped_column(String(50), nullable=False, default="pending")
    progress_percentage: Mapped[Optional[int]] = mapped_column(Integer, nullable=True, default=0)
    
    # Timeline
    start_date: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    expected_completion: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    actual_completion: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    
    # Requirements and documents
    requirements: Mapped[Dict[str, Any]] = mapped_column(JSON, nullable=True)
    required_documents: Mapped[List[str]] = mapped_column(ARRAY(String), nullable=True)
    submitted_documents: Mapped[List[str]] = mapped_column(ARRAY(String), nullable=True)
    
    # VVB information
    assigned_vvb: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    vvb_contact: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    
    # Results and feedback
    validation_results: Mapped[Dict[str, Any]] = mapped_column(JSON, nullable=True)
    feedback: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    corrective_actions: Mapped[List[str]] = mapped_column(ARRAY(String), nullable=True)
    
    # Relationships
    project = relationship("Project", backref="compliance_workflows")
    pdd_documents = relationship("PDDDocument", back_populates="workflow")
    monitoring_reports = relationship("MonitoringReport", back_populates="workflow")


class PDDDocument(Base, TimestampMixin, UUIDMixin, SoftDeleteMixin, IPFSMixin, AuditMixin):
    """Project Design Documents"""
    
    __tablename__ = "pdd_documents"
    
    workflow_id: Mapped[str] = mapped_column(String(36), ForeignKey("compliance_workflows.id"), nullable=False)
    project_id: Mapped[str] = mapped_column(String(36), ForeignKey("projects.id"), nullable=False)
    
    # Document information
    document_title: Mapped[str] = mapped_column(String(255), nullable=False)
    document_version: Mapped[str] = mapped_column(String(20), nullable=False, default="1.0")
    standard: Mapped[ComplianceStandard] = mapped_column(Enum(ComplianceStandard), nullable=False)
    
    # Document content
    sections: Mapped[Dict[str, Any]] = mapped_column(JSON, nullable=True)
    document_text: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    
    # Validation status
    validation_status: Mapped[str] = mapped_column(String(50), default="draft")
    validation_comments: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    compliance_score: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    
    # Document files
    pdf_file_path: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    word_file_path: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    
    # Generation metadata
    auto_generated: Mapped[bool] = mapped_column(Boolean, default=True)
    generation_method: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    data_sources: Mapped[List[str]] = mapped_column(ARRAY(String), nullable=True)
    
    # Relationships
    workflow = relationship("ComplianceWorkflow", back_populates="pdd_documents")
    project = relationship("Project", backref="pdd_documents")


class MonitoringReport(Base, TimestampMixin, UUIDMixin, SoftDeleteMixin, IPFSMixin, AuditMixin):
    """Monitoring reports for compliance"""
    
    __tablename__ = "monitoring_reports"
    
    workflow_id: Mapped[str] = mapped_column(String(36), ForeignKey("compliance_workflows.id"), nullable=False)
    project_id: Mapped[str] = mapped_column(String(36), ForeignKey("projects.id"), nullable=False)
    
    # Report information
    report_title: Mapped[str] = mapped_column(String(255), nullable=False)
    report_period_start: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    report_period_end: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    
    # Monitoring data
    carbon_sequestration_data: Mapped[Dict[str, Any]] = mapped_column(JSON, nullable=True)
    forest_metrics: Mapped[Dict[str, Any]] = mapped_column(JSON, nullable=True)
    biodiversity_metrics: Mapped[Dict[str, Any]] = mapped_column(JSON, nullable=True)
    social_impact_metrics: Mapped[Dict[str, Any]] = mapped_column(JSON, nullable=True)
    
    # Compliance assessment
    compliance_status: Mapped[str] = mapped_column(String(50), nullable=False)
    compliance_score: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    non_compliance_issues: Mapped[List[str]] = mapped_column(ARRAY(String), nullable=True)
    
    # Verification data
    verification_required: Mapped[bool] = mapped_column(Boolean, default=True)
    verification_status: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    verification_date: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    verifier_name: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    
    # Report files
    report_file_path: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    supporting_data_path: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    
    # Generation metadata
    auto_generated: Mapped[bool] = mapped_column(Boolean, default=True)
    data_collection_methods: Mapped[List[str]] = mapped_column(ARRAY(String), nullable=True)
    
    # Relationships
    workflow = relationship("ComplianceWorkflow", back_populates="monitoring_reports")
    project = relationship("Project", backref="monitoring_reports")


class ModelPerformanceMetrics(Base, TimestampMixin, UUIDMixin):
    """Model performance monitoring over time"""
    
    __tablename__ = "model_performance_metrics"
    
    model_id: Mapped[str] = mapped_column(String(36), ForeignKey("ml_models.id"), nullable=False)
    
    # Metric information
    metric_date: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    evaluation_dataset: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    sample_size: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    
    # Performance metrics
    accuracy: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    precision: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    recall: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    f1_score: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    rmse: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    mae: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    r2_score: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    
    # Additional metrics
    custom_metrics: Mapped[Dict[str, Any]] = mapped_column(JSON, nullable=True)
    
    # Drift detection
    data_drift_score: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    concept_drift_score: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    drift_detected: Mapped[bool] = mapped_column(Boolean, default=False)
    
    # Alert flags
    performance_degradation: Mapped[bool] = mapped_column(Boolean, default=False)
    retraining_recommended: Mapped[bool] = mapped_column(Boolean, default=False)
    
    # Relationships
    model = relationship("MLModel", backref="performance_metrics")