# ================================================================================
# AUREX LAUNCHPAD™ CARBON MATURITY NAVIGATOR MODELS
# Sub-Application #13: Patent-pending Carbon Maturity Assessment Framework
# Module ID: LAU-MAT-013 - Carbon Maturity Navigator Models
# Created: August 7, 2025
# ================================================================================

from sqlalchemy import (
    Column, String, Text, Integer, Float, Boolean, DateTime, 
    ForeignKey, JSON, Enum, Numeric, Index
)
from sqlalchemy.dialects.postgresql import UUID, ARRAY
from sqlalchemy.orm import relationship
from sqlalchemy.ext.hybrid import hybrid_property
from decimal import Decimal
from datetime import datetime
from enum import Enum as PyEnum
import uuid
from typing import Dict, List, Optional, Any
import json

from .base_models import BaseModel, TimestampMixin, BaseModelWithSoftDelete

# ================================================================================
# ENUMS AND CONSTANTS
# ================================================================================

class MaturityLevel(PyEnum):
    """CMM 5-Level Maturity Framework"""
    INITIAL = "initial"           # Level 1: Ad-hoc, reactive processes
    MANAGED = "managed"           # Level 2: Basic measurement and reporting
    DEFINED = "defined"           # Level 3: Standardized processes and targets
    QUANTITATIVELY_MANAGED = "quantitatively_managed"  # Level 4: Data-driven optimization
    OPTIMIZING = "optimizing"     # Level 5: Continuous improvement culture

class AssessmentStatus(PyEnum):
    """Assessment completion status"""
    NOT_STARTED = "not_started"
    IN_PROGRESS = "in_progress"
    SUBMITTED = "submitted"
    UNDER_REVIEW = "under_review"
    APPROVED = "approved"
    REJECTED = "rejected"
    EXPIRED = "expired"

class IndustryCategory(PyEnum):
    """Industry categories with specific carbon maturity requirements"""
    MANUFACTURING = "manufacturing"
    ENERGY_UTILITIES = "energy_utilities"
    TRANSPORTATION = "transportation"
    TECHNOLOGY = "technology"
    FINANCIAL_SERVICES = "financial_services"
    RETAIL_CONSUMER = "retail_consumer"
    HEALTHCARE = "healthcare"
    REAL_ESTATE = "real_estate"
    AGRICULTURE = "agriculture"
    MINING_MATERIALS = "mining_materials"
    OTHER = "other"

class EvidenceType(PyEnum):
    """Types of evidence for assessment validation"""
    DOCUMENT = "document"
    CERTIFICATE = "certificate"
    REPORT = "report"
    POLICY = "policy"
    PROCEDURE = "procedure"
    DATA_EXPORT = "data_export"
    AUDIT_RESULT = "audit_result"
    TRAINING_RECORD = "training_record"
    SYSTEM_SCREENSHOT = "system_screenshot"
    OTHER = "other"

class AccessLevel(PyEnum):
    """Role-based access levels"""
    VIEW_ONLY = "view_only"
    ASSESSOR = "assessor"
    REVIEWER = "reviewer"
    ADMIN = "admin"
    PARTNER_ADVISOR = "partner_advisor"

# ================================================================================
# MATURITY ASSESSMENT CORE MODELS
# ================================================================================

class MaturityFramework(BaseModel, TimestampMixin):
    """
    Master framework definition for Carbon Maturity Model
    Defines the 5-level CMM structure with industry customizations
    """
    __tablename__ = "maturity_frameworks"
    
    # Framework identification
    name = Column(String(200), nullable=False, unique=True)
    version = Column(String(50), nullable=False, default="1.0")
    description = Column(Text)
    
    # Framework configuration
    industry_category = Column(Enum(IndustryCategory), nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)
    
    # Scoring configuration
    total_possible_score = Column(Integer, default=500, nullable=False)  # 100 per level
    passing_score = Column(Integer, default=350, nullable=False)         # 70% threshold
    
    # Framework metadata
    created_by = Column(UUID(as_uuid=True), ForeignKey("users.id"))
    approved_by = Column(UUID(as_uuid=True), ForeignKey("users.id"))
    approval_date = Column(DateTime)
    
    # Relationships
    levels = relationship("MaturityLevel", back_populates="framework", cascade="all, delete-orphan")
    assessments = relationship("MaturityAssessment", back_populates="framework")
    
    # Indexes for performance
    __table_args__ = (
        Index('idx_framework_industry', 'industry_category'),
        Index('idx_framework_active', 'is_active'),
    )

class MaturityLevelDefinition(BaseModel, TimestampMixin):
    """
    Individual maturity level definitions within the framework
    Maps to CMM Levels 1-5 with specific criteria and KPIs
    """
    __tablename__ = "maturity_levels"
    
    # Level identification
    framework_id = Column(UUID(as_uuid=True), ForeignKey("maturity_frameworks.id"), nullable=False)
    level_number = Column(Integer, nullable=False)  # 1-5
    level_name = Column(Enum(MaturityLevel), nullable=False)
    
    # Level definition
    title = Column(String(200), nullable=False)
    description = Column(Text, nullable=False)
    
    # Scoring and requirements
    max_score = Column(Integer, default=100, nullable=False)
    min_score_to_pass = Column(Integer, default=70, nullable=False)
    
    # Level characteristics
    key_characteristics = Column(JSON)  # List of key characteristics
    typical_practices = Column(JSON)    # List of typical practices
    evidence_requirements = Column(JSON)  # Required evidence types
    
    # Performance indicators
    kpi_definitions = Column(JSON)  # KPI definitions for this level
    
    # Relationships
    framework = relationship("MaturityFramework", back_populates="levels")
    questions = relationship("AssessmentQuestion", back_populates="maturity_level")
    
    # Unique constraint and indexes
    __table_args__ = (
        Index('idx_level_framework_number', 'framework_id', 'level_number'),
    )

# ================================================================================
# ASSESSMENT MODELS
# ================================================================================

class MaturityAssessment(BaseModelWithSoftDelete, TimestampMixin):
    """
    Primary assessment instance for an organization's carbon maturity evaluation
    Tracks complete assessment lifecycle from start to final report
    """
    __tablename__ = "maturity_assessments"
    
    # Assessment identification
    assessment_number = Column(String(50), unique=True, nullable=False)  # Auto-generated
    title = Column(String(300), nullable=False)
    
    # Assessment scope
    organization_id = Column(UUID(as_uuid=True), ForeignKey("organizations.id"), nullable=False)
    framework_id = Column(UUID(as_uuid=True), ForeignKey("maturity_frameworks.id"), nullable=False)
    
    # Assessment participants
    primary_assessor_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    reviewer_id = Column(UUID(as_uuid=True), ForeignKey("users.id"))
    
    # Assessment status and progress
    status = Column(Enum(AssessmentStatus), default=AssessmentStatus.NOT_STARTED, nullable=False)
    progress_percentage = Column(Float, default=0.0, nullable=False)
    
    # Assessment timeline
    planned_start_date = Column(DateTime)
    actual_start_date = Column(DateTime)
    planned_completion_date = Column(DateTime)
    actual_completion_date = Column(DateTime)
    submission_date = Column(DateTime)
    review_completion_date = Column(DateTime)
    
    # Scoring and results
    current_maturity_level = Column(Integer)  # Calculated level 1-5
    total_score = Column(Float, default=0.0)
    max_possible_score = Column(Float, default=500.0)
    score_percentage = Column(Float, default=0.0)
    
    # Assessment configuration
    assessment_scope = Column(JSON)  # Scope definition
    industry_customizations = Column(JSON)  # Industry-specific adjustments
    
    # Review and approval
    reviewer_comments = Column(Text)
    review_date = Column(DateTime)
    approval_notes = Column(Text)
    
    # Relationships
    organization = relationship("Organization")
    framework = relationship("MaturityFramework", back_populates="assessments")
    primary_assessor = relationship("User", foreign_keys=[primary_assessor_id])
    reviewer = relationship("User", foreign_keys=[reviewer_id])
    responses = relationship("AssessmentResponse", back_populates="assessment", cascade="all, delete-orphan")
    evidence_items = relationship("AssessmentEvidence", back_populates="assessment", cascade="all, delete-orphan")
    roadmaps = relationship("ImprovementRoadmap", back_populates="assessment", cascade="all, delete-orphan")
    benchmarks = relationship("AssessmentBenchmark", back_populates="assessment", cascade="all, delete-orphan")
    
    @hybrid_property
    def is_complete(self) -> bool:
        """Check if assessment is complete"""
        return self.status in [AssessmentStatus.SUBMITTED, AssessmentStatus.APPROVED]
    
    @hybrid_property
    def days_since_start(self) -> Optional[int]:
        """Calculate days since assessment started"""
        if self.actual_start_date:
            return (datetime.utcnow() - self.actual_start_date).days
        return None
    
    def calculate_maturity_level(self) -> int:
        """Calculate current maturity level based on scoring"""
        if self.score_percentage >= 90:
            return 5  # Optimizing
        elif self.score_percentage >= 80:
            return 4  # Quantitatively Managed
        elif self.score_percentage >= 70:
            return 3  # Defined
        elif self.score_percentage >= 60:
            return 2  # Managed
        else:
            return 1  # Initial
    
    # Indexes for performance
    __table_args__ = (
        Index('idx_assessment_org_status', 'organization_id', 'status'),
        Index('idx_assessment_assessor', 'primary_assessor_id'),
        Index('idx_assessment_number', 'assessment_number'),
    )

class AssessmentQuestion(BaseModel, TimestampMixin):
    """
    Assessment questions with conditional logic and scoring weights
    Dynamic questions based on industry and previous responses
    """
    __tablename__ = "assessment_questions"
    
    # Question identification
    question_number = Column(String(20), nullable=False)  # e.g., "L1-001"
    framework_id = Column(UUID(as_uuid=True), ForeignKey("maturity_frameworks.id"), nullable=False)
    maturity_level_id = Column(UUID(as_uuid=True), ForeignKey("maturity_levels.id"), nullable=False)
    
    # Question content
    question_text = Column(Text, nullable=False)
    description = Column(Text)
    help_text = Column(Text)
    
    # Question configuration
    question_type = Column(String(50), nullable=False, default="multiple_choice")  # multiple_choice, yes_no, numeric, text
    is_required = Column(Boolean, default=True, nullable=False)
    weight = Column(Float, default=1.0, nullable=False)  # Question weight in scoring
    
    # Answer options (for multiple choice)
    answer_options = Column(JSON)  # List of possible answers with scores
    
    # Conditional logic
    display_conditions = Column(JSON)  # Conditions for showing this question
    skip_logic = Column(JSON)  # Logic for skipping subsequent questions
    
    # Evidence requirements
    requires_evidence = Column(Boolean, default=False, nullable=False)
    evidence_types = Column(ARRAY(String))  # Accepted evidence types
    evidence_description = Column(Text)
    
    # Industry customization
    industry_variations = Column(JSON)  # Industry-specific question variations
    
    # Question metadata
    order_index = Column(Integer, nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)
    
    # Relationships
    framework = relationship("MaturityFramework")
    maturity_level = relationship("MaturityLevelDefinition", back_populates="questions")
    responses = relationship("AssessmentResponse", back_populates="question")
    
    # Indexes for performance
    __table_args__ = (
        Index('idx_question_framework_level', 'framework_id', 'maturity_level_id'),
        Index('idx_question_number', 'question_number'),
        Index('idx_question_order', 'order_index'),
    )

class AssessmentResponse(BaseModel, TimestampMixin):
    """
    Individual question responses within an assessment
    Stores answers, scores, and evidence references
    """
    __tablename__ = "assessment_responses"
    
    # Response identification
    assessment_id = Column(UUID(as_uuid=True), ForeignKey("maturity_assessments.id"), nullable=False)
    question_id = Column(UUID(as_uuid=True), ForeignKey("assessment_questions.id"), nullable=False)
    
    # Response content
    answer_value = Column(Text)  # The actual answer
    answer_score = Column(Float, default=0.0, nullable=False)  # Score for this answer
    max_possible_score = Column(Float, default=1.0, nullable=False)
    
    # Response metadata
    response_date = Column(DateTime, default=datetime.utcnow)
    responded_by = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    
    # Comments and notes
    assessor_comments = Column(Text)
    reviewer_comments = Column(Text)
    
    # Evidence tracking
    has_evidence = Column(Boolean, default=False, nullable=False)
    evidence_complete = Column(Boolean, default=False, nullable=False)
    
    # Response validation
    is_validated = Column(Boolean, default=False, nullable=False)
    validation_date = Column(DateTime)
    validated_by = Column(UUID(as_uuid=True), ForeignKey("users.id"))
    
    # Relationships
    assessment = relationship("MaturityAssessment", back_populates="responses")
    question = relationship("AssessmentQuestion", back_populates="responses")
    responder = relationship("User", foreign_keys=[responded_by])
    validator = relationship("User", foreign_keys=[validated_by])
    evidence_items = relationship("AssessmentEvidence", back_populates="response")
    
    # Unique constraint and indexes
    __table_args__ = (
        Index('idx_response_assessment_question', 'assessment_id', 'question_id'),
    )

# ================================================================================
# EVIDENCE AND DOCUMENTATION MODELS  
# ================================================================================

class AssessmentEvidence(BaseModel, TimestampMixin):
    """
    Evidence files and documentation supporting assessment responses
    Handles file uploads, validation, and compliance tracking
    """
    __tablename__ = "assessment_evidence"
    
    # Evidence identification
    assessment_id = Column(UUID(as_uuid=True), ForeignKey("maturity_assessments.id"), nullable=False)
    response_id = Column(UUID(as_uuid=True), ForeignKey("assessment_responses.id"))
    
    # File information
    file_name = Column(String(500), nullable=False)
    original_filename = Column(String(500), nullable=False)
    file_path = Column(String(1000), nullable=False)
    file_size = Column(Integer)  # Size in bytes
    file_type = Column(String(100))  # MIME type
    file_hash = Column(String(128))  # SHA-256 hash for integrity
    
    # Evidence classification
    evidence_type = Column(Enum(EvidenceType), nullable=False)
    evidence_category = Column(String(100))  # Custom categorization
    
    # Evidence content
    title = Column(String(300), nullable=False)
    description = Column(Text)
    
    # Validation and compliance
    is_validated = Column(Boolean, default=False, nullable=False)
    validation_date = Column(DateTime)
    validated_by = Column(UUID(as_uuid=True), ForeignKey("users.id"))
    validation_comments = Column(Text)
    
    # Document processing
    is_processed = Column(Boolean, default=False, nullable=False)
    processing_status = Column(String(50), default="pending")  # pending, processing, completed, failed
    extracted_text = Column(Text)  # OCR/text extraction results
    document_summary = Column(Text)  # AI-generated summary
    
    # Evidence metadata
    document_date = Column(DateTime)  # Date of the document content
    version = Column(String(50))
    tags = Column(ARRAY(String))  # Searchable tags
    
    # Upload tracking
    uploaded_by = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    
    # Relationships
    assessment = relationship("MaturityAssessment", back_populates="evidence_items")
    response = relationship("AssessmentResponse", back_populates="evidence_items")
    uploader = relationship("User", foreign_keys=[uploaded_by])
    validator = relationship("User", foreign_keys=[validated_by])
    
    @hybrid_property
    def file_size_mb(self) -> Optional[float]:
        """Get file size in MB"""
        if self.file_size:
            return round(self.file_size / (1024 * 1024), 2)
        return None
    
    # Indexes for performance
    __table_args__ = (
        Index('idx_evidence_assessment', 'assessment_id'),
        Index('idx_evidence_response', 'response_id'),
        Index('idx_evidence_type', 'evidence_type'),
        Index('idx_evidence_validation', 'is_validated'),
    )

# ================================================================================
# SCORING AND BENCHMARKING MODELS
# ================================================================================

class AssessmentScoring(BaseModel, TimestampMixin):
    """
    Detailed scoring breakdown for assessment analytics
    Tracks scoring by level, category, and KPI
    """
    __tablename__ = "assessment_scoring"
    
    # Scoring identification
    assessment_id = Column(UUID(as_uuid=True), ForeignKey("maturity_assessments.id"), nullable=False)
    scoring_date = Column(DateTime, default=datetime.utcnow, nullable=False)
    
    # Level-based scoring
    level_1_score = Column(Float, default=0.0)
    level_1_max_score = Column(Float, default=100.0)
    level_2_score = Column(Float, default=0.0)
    level_2_max_score = Column(Float, default=100.0)
    level_3_score = Column(Float, default=0.0)
    level_3_max_score = Column(Float, default=100.0)
    level_4_score = Column(Float, default=0.0)
    level_4_max_score = Column(Float, default=100.0)
    level_5_score = Column(Float, default=0.0)
    level_5_max_score = Column(Float, default=100.0)
    
    # Overall scoring
    total_score = Column(Float, default=0.0, nullable=False)
    total_max_score = Column(Float, default=500.0, nullable=False)
    score_percentage = Column(Float, default=0.0, nullable=False)
    
    # Calculated maturity
    calculated_level = Column(Integer, nullable=False)
    level_confidence = Column(Float)  # Confidence in level calculation (0-1)
    
    # KPI scoring details
    kpi_scores = Column(JSON)  # Detailed KPI scores
    category_scores = Column(JSON)  # Scores by category
    
    # Quality metrics
    data_completeness = Column(Float)  # Percentage of questions answered
    evidence_completeness = Column(Float)  # Percentage of required evidence provided
    quality_score = Column(Float)  # Overall data quality score
    
    # Scoring metadata
    scoring_algorithm_version = Column(String(50), default="1.0")
    calculated_by = Column(UUID(as_uuid=True), ForeignKey("users.id"))
    
    # Relationships
    assessment = relationship("MaturityAssessment")
    calculator = relationship("User")
    
    # Indexes for performance
    __table_args__ = (
        Index('idx_scoring_assessment', 'assessment_id'),
        Index('idx_scoring_date', 'scoring_date'),
    )

class AssessmentBenchmark(BaseModel, TimestampMixin):
    """
    Industry benchmarking and peer comparison data
    Provides context for assessment results against industry standards
    """
    __tablename__ = "assessment_benchmarks"
    
    # Benchmark identification
    assessment_id = Column(UUID(as_uuid=True), ForeignKey("maturity_assessments.id"), nullable=False)
    industry_category = Column(Enum(IndustryCategory), nullable=False)
    benchmark_date = Column(DateTime, default=datetime.utcnow, nullable=False)
    
    # Benchmark statistics
    industry_avg_score = Column(Float)
    industry_median_score = Column(Float)
    industry_top_quartile = Column(Float)
    industry_bottom_quartile = Column(Float)
    
    # Percentile ranking
    percentile_rank = Column(Float)  # Organization's percentile in industry
    peer_group_size = Column(Integer)  # Number of peers in comparison
    
    # Level distribution
    level_distribution = Column(JSON)  # Distribution of maturity levels in industry
    
    # Benchmark details
    regional_comparison = Column(JSON)  # Regional benchmarking if available
    size_comparison = Column(JSON)  # Comparison by company size
    
    # Data quality
    benchmark_confidence = Column(Float)  # Confidence in benchmark data (0-1)
    sample_size = Column(Integer)  # Number of assessments in benchmark
    data_freshness_days = Column(Integer)  # Age of benchmark data in days
    
    # Relationships
    assessment = relationship("MaturityAssessment", back_populates="benchmarks")
    
    # Indexes for performance
    __table_args__ = (
        Index('idx_benchmark_assessment', 'assessment_id'),
        Index('idx_benchmark_industry', 'industry_category'),
        Index('idx_benchmark_date', 'benchmark_date'),
    )

# ================================================================================
# IMPROVEMENT ROADMAP MODELS
# ================================================================================

class ImprovementRoadmap(BaseModel, TimestampMixin):
    """
    AI-generated improvement roadmap with recommendations and action plans
    Provides strategic guidance for maturity advancement
    """
    __tablename__ = "improvement_roadmaps"
    
    # Roadmap identification
    assessment_id = Column(UUID(as_uuid=True), ForeignKey("maturity_assessments.id"), nullable=False)
    roadmap_version = Column(String(50), default="1.0", nullable=False)
    
    # Roadmap overview
    title = Column(String(300), nullable=False)
    description = Column(Text)
    
    # Maturity progression plan
    current_level = Column(Integer, nullable=False)
    target_level = Column(Integer, nullable=False)
    estimated_duration_months = Column(Integer)
    estimated_investment = Column(Numeric(12, 2))
    
    # Gap analysis
    gap_analysis = Column(JSON)  # Detailed gap analysis by area
    priority_areas = Column(JSON)  # Priority improvement areas
    
    # ROI projections
    projected_benefits = Column(JSON)  # Projected benefits by category
    roi_calculation = Column(JSON)  # ROI calculation details
    payback_period_months = Column(Integer)
    
    # Implementation phases
    implementation_phases = Column(JSON)  # Phased implementation plan
    milestones = Column(JSON)  # Key milestones and timeline
    
    # Risk assessment
    implementation_risks = Column(JSON)  # Identified risks and mitigation
    success_factors = Column(JSON)  # Critical success factors
    
    # Roadmap status
    status = Column(String(50), default="draft")  # draft, approved, active, completed
    approved_date = Column(DateTime)
    approved_by = Column(UUID(as_uuid=True), ForeignKey("users.id"))
    
    # Generation metadata
    generated_by_ai = Column(Boolean, default=True, nullable=False)
    ai_model_version = Column(String(100))
    generation_confidence = Column(Float)  # AI confidence in recommendations (0-1)
    
    # Relationships
    assessment = relationship("MaturityAssessment", back_populates="roadmaps")
    approver = relationship("User")
    recommendations = relationship("ImprovementRecommendation", back_populates="roadmap", cascade="all, delete-orphan")
    
    # Indexes for performance
    __table_args__ = (
        Index('idx_roadmap_assessment', 'assessment_id'),
        Index('idx_roadmap_status', 'status'),
    )

class ImprovementRecommendation(BaseModel, TimestampMixin):
    """
    Individual improvement recommendations within a roadmap
    Specific, actionable recommendations with prioritization
    """
    __tablename__ = "improvement_recommendations"
    
    # Recommendation identification
    roadmap_id = Column(UUID(as_uuid=True), ForeignKey("improvement_roadmaps.id"), nullable=False)
    recommendation_number = Column(String(20), nullable=False)
    
    # Recommendation content
    title = Column(String(300), nullable=False)
    description = Column(Text, nullable=False)
    detailed_steps = Column(JSON)  # Step-by-step implementation guide
    
    # Prioritization
    priority_level = Column(String(20), default="medium")  # high, medium, low
    priority_score = Column(Float)  # Calculated priority score
    
    # Impact assessment
    maturity_level_impact = Column(Integer)  # Which level this primarily impacts
    business_impact = Column(String(20))  # high, medium, low
    implementation_effort = Column(String(20))  # high, medium, low
    
    # Resources and timeline
    estimated_duration_weeks = Column(Integer)
    estimated_cost = Column(Numeric(10, 2))
    required_resources = Column(JSON)  # Required resources and skills
    
    # Dependencies
    prerequisites = Column(JSON)  # Prerequisites for implementation
    dependencies = Column(ARRAY(String))  # Dependencies on other recommendations
    
    # Success metrics
    success_metrics = Column(JSON)  # How to measure success
    target_completion_date = Column(DateTime)
    
    # Implementation tracking
    implementation_status = Column(String(50), default="not_started")
    actual_start_date = Column(DateTime)
    actual_completion_date = Column(DateTime)
    implementation_notes = Column(Text)
    
    # Relationships
    roadmap = relationship("ImprovementRoadmap", back_populates="recommendations")
    
    # Indexes for performance
    __table_args__ = (
        Index('idx_recommendation_roadmap', 'roadmap_id'),
        Index('idx_recommendation_priority', 'priority_level'),
        Index('idx_recommendation_status', 'implementation_status'),
    )

# ================================================================================
# ACCESS CONTROL AND AUDIT MODELS
# ================================================================================

class AssessmentAccessControl(BaseModel, TimestampMixin):
    """
    Role-based access control for assessment participants
    Manages permissions for different roles in the assessment process
    """
    __tablename__ = "assessment_access_control"
    
    # Access control identification
    assessment_id = Column(UUID(as_uuid=True), ForeignKey("maturity_assessments.id"), nullable=False)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    
    # Access permissions
    access_level = Column(Enum(AccessLevel), nullable=False)
    can_view = Column(Boolean, default=True, nullable=False)
    can_edit = Column(Boolean, default=False, nullable=False)
    can_submit = Column(Boolean, default=False, nullable=False)
    can_review = Column(Boolean, default=False, nullable=False)
    can_approve = Column(Boolean, default=False, nullable=False)
    
    # Access scope
    accessible_sections = Column(ARRAY(String))  # Specific sections user can access
    restricted_questions = Column(ARRAY(String))  # Questions user cannot see/edit
    
    # Access timeline
    access_granted_date = Column(DateTime, default=datetime.utcnow, nullable=False)
    access_expires_date = Column(DateTime)
    granted_by = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    
    # Access status
    is_active = Column(Boolean, default=True, nullable=False)
    revocation_date = Column(DateTime)
    revocation_reason = Column(Text)
    revoked_by = Column(UUID(as_uuid=True), ForeignKey("users.id"))
    
    # Relationships
    assessment = relationship("MaturityAssessment")
    user = relationship("User", foreign_keys=[user_id])
    grantor = relationship("User", foreign_keys=[granted_by])
    revoker = relationship("User", foreign_keys=[revoked_by])
    
    # Unique constraint and indexes
    __table_args__ = (
        Index('idx_access_assessment_user', 'assessment_id', 'user_id'),
        Index('idx_access_level', 'access_level'),
        Index('idx_access_active', 'is_active'),
    )

class AssessmentAuditLog(BaseModel, TimestampMixin):
    """
    Comprehensive audit trail for all assessment activities
    Tracks every action, change, and access for compliance and security
    """
    __tablename__ = "assessment_audit_log"
    
    # Audit identification
    assessment_id = Column(UUID(as_uuid=True), ForeignKey("maturity_assessments.id"))
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    session_id = Column(String(100))  # User session identifier
    
    # Action details
    action_type = Column(String(100), nullable=False)  # CREATE, UPDATE, DELETE, VIEW, SUBMIT, etc.
    action_description = Column(Text, nullable=False)
    affected_entity = Column(String(100))  # Table/entity that was affected
    entity_id = Column(String(100))  # ID of the affected entity
    
    # Change tracking
    old_values = Column(JSON)  # Previous values (for updates)
    new_values = Column(JSON)  # New values (for updates/creates)
    
    # Context information
    ip_address = Column(String(45))  # Support IPv6
    user_agent = Column(Text)
    browser_info = Column(JSON)
    
    # Request details
    http_method = Column(String(10))
    endpoint = Column(String(500))
    request_payload = Column(JSON)
    response_status = Column(Integer)
    
    # Business context
    business_justification = Column(Text)
    approval_reference = Column(String(100))
    
    # Compliance flags
    is_sensitive_data = Column(Boolean, default=False, nullable=False)
    requires_notification = Column(Boolean, default=False, nullable=False)
    compliance_flags = Column(ARRAY(String))  # GDPR, SOX, ISO27001, etc.
    
    # Relationships
    assessment = relationship("MaturityAssessment")
    user = relationship("User")
    
    # Indexes for performance and compliance
    __table_args__ = (
        Index('idx_audit_assessment_date', 'assessment_id', 'created_at'),
        Index('idx_audit_user_date', 'user_id', 'created_at'),
        Index('idx_audit_action', 'action_type'),
        Index('idx_audit_entity', 'affected_entity', 'entity_id'),
        Index('idx_audit_compliance', 'is_sensitive_data'),
    )

# ================================================================================
# REPORTING AND ANALYTICS MODELS
# ================================================================================

class AssessmentReport(BaseModel, TimestampMixin):
    """
    Generated reports and analytics for assessments
    Supports multiple report formats and customizations
    """
    __tablename__ = "assessment_reports"
    
    # Report identification
    assessment_id = Column(UUID(as_uuid=True), ForeignKey("maturity_assessments.id"), nullable=False)
    report_type = Column(String(100), nullable=False)  # executive_summary, detailed_analysis, benchmark_report
    report_name = Column(String(300), nullable=False)
    
    # Report content
    report_data = Column(JSON)  # Structured report data
    report_config = Column(JSON)  # Report generation configuration
    
    # File information
    file_path = Column(String(1000))  # Path to generated PDF/document
    file_size = Column(Integer)  # File size in bytes
    file_hash = Column(String(128))  # File integrity hash
    
    # Generation details
    generated_date = Column(DateTime, default=datetime.utcnow, nullable=False)
    generated_by = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    generation_time_seconds = Column(Float)
    
    # Report status
    status = Column(String(50), default="generated")  # generated, distributed, archived
    distribution_list = Column(JSON)  # Who received the report
    
    # Version control
    version = Column(String(50), default="1.0")
    template_version = Column(String(50))
    is_latest = Column(Boolean, default=True, nullable=False)
    
    # Relationships
    assessment = relationship("MaturityAssessment")
    generator = relationship("User")
    
    # Indexes for performance
    __table_args__ = (
        Index('idx_report_assessment_type', 'assessment_id', 'report_type'),
        Index('idx_report_generated_date', 'generated_date'),
        Index('idx_report_latest', 'is_latest'),
    )

# ================================================================================
# DATABASE INDEXES AND CONSTRAINTS
# ================================================================================

# Additional performance indexes will be created via migration scripts
# These models provide the foundation for the Carbon Maturity Navigator
# with comprehensive assessment, scoring, benchmarking, and reporting capabilities

print("✅ Carbon Maturity Navigator Models Loaded Successfully!")
print("Features:")
print("  📊 CMM 5-Level Maturity Framework")
print("  📝 Dynamic Assessment Wizard")
print("  📄 Evidence Management System")
print("  🎯 Industry Benchmarking")
print("  🛣️ AI-Powered Improvement Roadmaps")
print("  🔐 Role-Based Access Control")
print("  📈 Comprehensive Scoring Engine")
print("  🔍 Full Audit Trail")
print("  📊 Advanced Reporting & Analytics")