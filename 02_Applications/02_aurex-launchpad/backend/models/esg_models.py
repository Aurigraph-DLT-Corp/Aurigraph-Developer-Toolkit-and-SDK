# ================================================================================
# AUREX LAUNCHPAD™ ESG ASSESSMENT MODELS
# Comprehensive ESG assessment and scoring system
# Agent: AI/ML Orchestration Agent + Business Intelligence Agent
# ================================================================================

from sqlalchemy import Column, String, DateTime, Boolean, JSON, Text, Integer, Float, Enum as SQLEnum
from sqlalchemy.dialects.postgresql import UUID, ARRAY
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from datetime import datetime, date
import uuid
from typing import Optional, Dict, Any, List
from enum import Enum

from .base_models import BaseModelWithSoftDelete, TimestampMixin

# ================================================================================
# ESG ENUMS AND CONSTANTS
# ================================================================================

class ESGFramework(Enum):
    """Supported ESG assessment frameworks"""
    GRI = "GRI"  # Global Reporting Initiative
    SASB = "SASB"  # Sustainability Accounting Standards Board
    TCFD = "TCFD"  # Task Force on Climate-related Financial Disclosures
    CDP = "CDP"  # Carbon Disclosure Project
    ISO14064 = "ISO14064"  # Greenhouse Gas Accounting and Verification
    EU_TAXONOMY = "EU_TAXONOMY"  # EU Taxonomy Regulation
    SEC_CLIMATE = "SEC_CLIMATE"  # SEC Climate Disclosure Rules
    CUSTOM = "CUSTOM"  # Custom organization framework

class AssessmentStatus(Enum):
    """Assessment completion status"""
    DRAFT = "draft"
    IN_PROGRESS = "in_progress"
    UNDER_REVIEW = "under_review"
    COMPLETED = "completed"
    APPROVED = "approved"
    PUBLISHED = "published"
    ARCHIVED = "archived"

class ESGCategory(Enum):
    """ESG pillar categories"""
    ENVIRONMENTAL = "environmental"
    SOCIAL = "social"
    GOVERNANCE = "governance"

class QuestionType(Enum):
    """Types of assessment questions"""
    MULTIPLE_CHOICE = "multiple_choice"
    SINGLE_CHOICE = "single_choice"
    TEXT = "text"
    NUMERIC = "numeric"
    BOOLEAN = "boolean"
    SCALE = "scale"
    DATE = "date"
    FILE_UPLOAD = "file_upload"
    MATRIX = "matrix"

class ScoringMethod(Enum):
    """Scoring methodology types"""
    WEIGHTED_AVERAGE = "weighted_average"
    BINARY_SCORING = "binary_scoring"
    MATURITY_LEVELS = "maturity_levels"
    AI_SCORING = "ai_scoring"
    CUSTOM_ALGORITHM = "custom_algorithm"

# ================================================================================
# FRAMEWORK AND TEMPLATE MODELS
# ================================================================================

class ESGFrameworkTemplate(BaseModelWithSoftDelete, TimestampMixin):
    """ESG assessment framework templates"""
    __tablename__ = "esg_framework_templates"
    
    # Framework identification
    name = Column(String(255), nullable=False)
    code = Column(String(50), nullable=False, unique=True, index=True)
    framework_type = Column(SQLEnum(ESGFramework), nullable=False)
    version = Column(String(50), nullable=False)
    
    # Framework details
    description = Column(Text, nullable=True)
    official_url = Column(String(500), nullable=True)
    published_date = Column(DateTime, nullable=True)
    effective_date = Column(DateTime, nullable=True)
    
    # Framework configuration
    total_possible_score = Column(Float, default=100.0)
    scoring_method = Column(SQLEnum(ScoringMethod), default=ScoringMethod.WEIGHTED_AVERAGE)
    passing_score = Column(Float, default=70.0)
    
    # Framework metadata
    industry_specific = Column(Boolean, default=False)
    target_industries = Column(ARRAY(String), nullable=True)
    organization_size_min = Column(Integer, nullable=True)
    organization_size_max = Column(Integer, nullable=True)
    
    # Template configuration
    template_config = Column(JSON, default=lambda: {
        "auto_save_interval": 300,  # seconds
        "allow_partial_submission": True,
        "require_evidence": False,
        "enable_collaboration": True,
        "notification_settings": {
            "progress_milestones": [25, 50, 75, 100],
            "reminder_frequency": "weekly"
        }
    })
    
    # Framework weighting
    category_weights = Column(JSON, default=lambda: {
        "environmental": 0.4,
        "social": 0.3,
        "governance": 0.3
    })
    
    # Usage statistics
    usage_count = Column(Integer, default=0)
    average_completion_time = Column(Integer, nullable=True)  # minutes
    average_score = Column(Float, nullable=True)
    
    # Status and maintenance
    is_active = Column(Boolean, default=True)
    is_official = Column(Boolean, default=False)
    maintenance_notes = Column(Text, nullable=True)
    
    # Relationships
    sections = relationship("ESGAssessmentSection", back_populates="framework_template")
    assessments = relationship("ESGAssessment", back_populates="framework_template")
    
    def get_total_questions(self) -> int:
        """Get total number of questions in framework"""
        return sum(len(section.questions) for section in self.sections)
    
    def get_estimated_time(self) -> int:
        """Get estimated completion time in minutes"""
        if self.average_completion_time:
            return self.average_completion_time
        
        # Estimate based on question count and types
        question_count = self.get_total_questions()
        return max(30, question_count * 3)  # 3 minutes per question minimum

class ESGAssessmentSection(BaseModelWithSoftDelete, TimestampMixin):
    """Sections within ESG assessment frameworks"""
    __tablename__ = "esg_assessment_sections"
    
    framework_template_id = Column(UUID(as_uuid=True), nullable=False, index=True)
    
    # Section identification
    code = Column(String(100), nullable=False)
    name = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    
    # Section organization
    category = Column(SQLEnum(ESGCategory), nullable=False)
    order_index = Column(Integer, nullable=False, default=0)
    parent_section_id = Column(UUID(as_uuid=True), nullable=True)
    
    # Section scoring
    weight = Column(Float, default=1.0)
    max_score = Column(Float, default=100.0)
    is_mandatory = Column(Boolean, default=True)
    
    # Section configuration
    section_config = Column(JSON, default=lambda: {
        "allow_skip": False,
        "randomize_questions": False,
        "show_progress": True,
        "require_all_questions": True,
        "custom_instructions": None
    })
    
    # Conditional logic
    display_conditions = Column(JSON, nullable=True)
    dependency_rules = Column(JSON, nullable=True)
    
    # Relationships
    framework_template = relationship("ESGFrameworkTemplate", back_populates="sections")
    questions = relationship("ESGAssessmentQuestion", back_populates="section")
    parent_section = relationship("ESGAssessmentSection", remote_side="ESGAssessmentSection.id")
    
    def get_question_count(self) -> int:
        """Get number of questions in this section"""
        return len(self.questions)
    
    def get_mandatory_question_count(self) -> int:
        """Get number of mandatory questions in this section"""
        return len([q for q in self.questions if q.is_required])

class ESGAssessmentQuestion(BaseModelWithSoftDelete, TimestampMixin):
    """Individual questions within ESG assessment sections"""
    __tablename__ = "esg_assessment_questions"
    
    section_id = Column(UUID(as_uuid=True), nullable=False, index=True)
    
    # Question identification
    code = Column(String(100), nullable=False)
    question_text = Column(Text, nullable=False)
    question_type = Column(SQLEnum(QuestionType), nullable=False)
    
    # Question organization
    order_index = Column(Integer, nullable=False, default=0)
    sub_question_of = Column(UUID(as_uuid=True), nullable=True)
    
    # Question configuration
    is_required = Column(Boolean, default=True)
    weight = Column(Float, default=1.0)
    max_score = Column(Float, default=100.0)
    
    # Question options and validation
    answer_options = Column(JSON, nullable=True)  # For multiple choice questions
    validation_rules = Column(JSON, nullable=True)
    help_text = Column(Text, nullable=True)
    guidance_url = Column(String(500), nullable=True)
    
    # Scoring configuration
    scoring_rubric = Column(JSON, nullable=True)
    auto_scoring = Column(Boolean, default=False)
    requires_evidence = Column(Boolean, default=False)
    
    # Display and behavior
    display_conditions = Column(JSON, nullable=True)
    placeholder_text = Column(String(500), nullable=True)
    character_limit = Column(Integer, nullable=True)
    
    # Question metadata
    tags = Column(ARRAY(String), nullable=True)
    difficulty_level = Column(String(20), default="medium")  # easy, medium, hard
    estimated_time_minutes = Column(Integer, default=3)
    
    # Relationships
    section = relationship("ESGAssessmentSection", back_populates="questions")
    responses = relationship("ESGAssessmentResponse", back_populates="question")
    
    # AI enhancement fields
    ai_suggested_improvements = Column(JSON, nullable=True)
    ai_confidence_score = Column(Float, nullable=True)
    ai_generated = Column(Boolean, default=False)
    
    def get_response_options(self) -> Optional[List[Dict[str, Any]]]:
        """Get formatted response options for frontend"""
        if self.answer_options:
            return self.answer_options.get("options", [])
        return None
    
    def validate_response(self, response_value: Any) -> Dict[str, Any]:
        """Validate response against question rules"""
        validation_result = {
            "is_valid": True,
            "errors": [],
            "warnings": []
        }
        
        # Required field validation
        if self.is_required and (response_value is None or response_value == ""):
            validation_result["is_valid"] = False
            validation_result["errors"].append("This field is required")
            return validation_result
        
        # Type-specific validation
        if self.question_type == QuestionType.NUMERIC:
            try:
                float(response_value)
            except (ValueError, TypeError):
                validation_result["is_valid"] = False
                validation_result["errors"].append("Must be a valid number")
        
        elif self.question_type == QuestionType.SCALE:
            scale_config = self.validation_rules.get("scale", {}) if self.validation_rules else {}
            min_val = scale_config.get("min", 1)
            max_val = scale_config.get("max", 10)
            
            try:
                val = int(response_value)
                if val < min_val or val > max_val:
                    validation_result["is_valid"] = False
                    validation_result["errors"].append(f"Value must be between {min_val} and {max_val}")
            except (ValueError, TypeError):
                validation_result["is_valid"] = False
                validation_result["errors"].append("Must be a valid integer")
        
        # Character limit validation
        if self.character_limit and isinstance(response_value, str):
            if len(response_value) > self.character_limit:
                validation_result["is_valid"] = False
                validation_result["errors"].append(f"Response exceeds {self.character_limit} character limit")
        
        return validation_result

# ================================================================================
# ASSESSMENT INSTANCE MODELS
# ================================================================================

class ESGAssessment(BaseModelWithSoftDelete, TimestampMixin):
    """Individual ESG assessment instances"""
    __tablename__ = "esg_assessments"
    
    organization_id = Column(UUID(as_uuid=True), nullable=False, index=True)
    framework_template_id = Column(UUID(as_uuid=True), nullable=False, index=True)
    
    # Assessment identification
    name = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    assessment_year = Column(Integer, nullable=False)
    reporting_period_start = Column(DateTime, nullable=True)
    reporting_period_end = Column(DateTime, nullable=True)
    
    # Assessment status and workflow
    status = Column(SQLEnum(AssessmentStatus), default=AssessmentStatus.DRAFT)
    current_section_id = Column(UUID(as_uuid=True), nullable=True)
    completion_percentage = Column(Float, default=0.0)
    
    # Assessment participants
    created_by_id = Column(UUID(as_uuid=True), nullable=False)
    assigned_to_id = Column(UUID(as_uuid=True), nullable=True)
    approved_by_id = Column(UUID(as_uuid=True), nullable=True)
    published_by_id = Column(UUID(as_uuid=True), nullable=True)
    
    # Important dates
    target_completion_date = Column(DateTime, nullable=True)
    completed_at = Column(DateTime, nullable=True)
    approved_at = Column(DateTime, nullable=True)
    published_at = Column(DateTime, nullable=True)
    
    # Scoring and results
    total_score = Column(Float, nullable=True)
    environmental_score = Column(Float, nullable=True)
    social_score = Column(Float, nullable=True)
    governance_score = Column(Float, nullable=True)
    
    # AI-enhanced scoring
    ai_confidence_score = Column(Float, nullable=True)
    ai_generated_insights = Column(JSON, nullable=True)
    ai_recommendations = Column(JSON, nullable=True)
    
    # Assessment metadata
    version = Column(Integer, default=1)
    is_baseline = Column(Boolean, default=False)
    external_reference = Column(String(255), nullable=True)
    
    # Assessment configuration
    assessment_config = Column(JSON, default=lambda: {
        "auto_save_enabled": True,
        "collaboration_enabled": True,
        "external_review_required": False,
        "evidence_required": False,
        "notification_settings": {
            "progress_updates": True,
            "deadline_reminders": True,
            "completion_notifications": True
        }
    })
    
    # Progress tracking
    time_spent_minutes = Column(Integer, default=0)
    questions_answered = Column(Integer, default=0)
    total_questions = Column(Integer, nullable=True)
    last_activity_at = Column(DateTime, default=datetime.utcnow)
    
    # Review and approval
    review_notes = Column(Text, nullable=True)
    approval_notes = Column(Text, nullable=True)
    rejection_reason = Column(Text, nullable=True)
    
    # External validation
    third_party_verified = Column(Boolean, default=False)
    verification_date = Column(DateTime, nullable=True)
    verifier_organization = Column(String(255), nullable=True)
    verification_certificate_url = Column(String(500), nullable=True)
    
    # Relationships
    framework_template = relationship("ESGFrameworkTemplate", back_populates="assessments")
    responses = relationship("ESGAssessmentResponse", back_populates="assessment")
    collaborators = relationship("AssessmentCollaborator", back_populates="assessment")
    documents = relationship("AssessmentDocument", back_populates="assessment")
    reports = relationship("AssessmentReport", back_populates="assessment")
    
    def calculate_completion_percentage(self) -> float:
        """Calculate assessment completion percentage"""
        if not self.total_questions or self.total_questions == 0:
            return 0.0
        
        completed_responses = len([r for r in self.responses if r.response_value is not None])
        return (completed_responses / self.total_questions) * 100.0
    
    def get_score_breakdown(self) -> Dict[str, Any]:
        """Get detailed score breakdown by category"""
        return {
            "total_score": self.total_score,
            "environmental": {
                "score": self.environmental_score,
                "weight": 0.4,
                "weighted_contribution": (self.environmental_score or 0) * 0.4
            },
            "social": {
                "score": self.social_score,
                "weight": 0.3,
                "weighted_contribution": (self.social_score or 0) * 0.3
            },
            "governance": {
                "score": self.governance_score,
                "weight": 0.3,
                "weighted_contribution": (self.governance_score or 0) * 0.3
            },
            "ai_confidence": self.ai_confidence_score,
            "calculation_method": "weighted_average"
        }
    
    def is_overdue(self) -> bool:
        """Check if assessment is overdue"""
        if not self.target_completion_date:
            return False
        return datetime.utcnow() > self.target_completion_date and self.status != AssessmentStatus.COMPLETED
    
    def can_be_submitted(self) -> bool:
        """Check if assessment can be submitted for review"""
        return (self.completion_percentage >= 100.0 and 
                self.status in [AssessmentStatus.DRAFT, AssessmentStatus.IN_PROGRESS])

class ESGAssessmentResponse(BaseModelWithSoftDelete, TimestampMixin):
    """Individual responses to assessment questions"""
    __tablename__ = "esg_assessment_responses"
    
    assessment_id = Column(UUID(as_uuid=True), nullable=False, index=True)
    question_id = Column(UUID(as_uuid=True), nullable=False, index=True)
    
    # Response data
    response_value = Column(JSON, nullable=True)  # Flexible storage for any response type
    response_text = Column(Text, nullable=True)  # Human-readable response
    response_numeric = Column(Float, nullable=True)  # Numeric responses
    response_boolean = Column(Boolean, nullable=True)  # Boolean responses
    response_date = Column(DateTime, nullable=True)  # Date responses
    
    # Response metadata
    responded_by_id = Column(UUID(as_uuid=True), nullable=False)
    responded_at = Column(DateTime, default=datetime.utcnow)
    time_spent_seconds = Column(Integer, default=0)
    
    # Response quality and validation
    is_complete = Column(Boolean, default=True)
    confidence_level = Column(Integer, nullable=True)  # 1-5 scale
    data_quality_score = Column(Float, nullable=True)
    
    # Evidence and supporting information
    evidence_urls = Column(ARRAY(String), nullable=True)
    supporting_notes = Column(Text, nullable=True)
    external_references = Column(JSON, nullable=True)
    
    # Scoring and evaluation
    assigned_score = Column(Float, nullable=True)
    auto_score = Column(Float, nullable=True)
    manual_score = Column(Float, nullable=True)
    score_explanation = Column(Text, nullable=True)
    
    # AI enhancements
    ai_generated = Column(Boolean, default=False)
    ai_confidence = Column(Float, nullable=True)
    ai_suggestions = Column(JSON, nullable=True)
    ai_validation_flags = Column(JSON, nullable=True)
    
    # Review and approval
    reviewed_by_id = Column(UUID(as_uuid=True), nullable=True)
    reviewed_at = Column(DateTime, nullable=True)
    review_status = Column(String(50), default="pending")  # pending, approved, needs_revision
    review_comments = Column(Text, nullable=True)
    
    # Version control
    version = Column(Integer, default=1)
    previous_response_id = Column(UUID(as_uuid=True), nullable=True)
    change_reason = Column(String(255), nullable=True)
    
    # Relationships
    assessment = relationship("ESGAssessment", back_populates="responses")
    question = relationship("ESGAssessmentQuestion", back_populates="responses")
    
    def get_formatted_response(self) -> Any:
        """Get formatted response based on question type"""
        if self.response_value is not None:
            return self.response_value
        elif self.response_numeric is not None:
            return self.response_numeric
        elif self.response_boolean is not None:
            return self.response_boolean
        elif self.response_date is not None:
            return self.response_date.isoformat()
        elif self.response_text is not None:
            return self.response_text
        return None
    
    def calculate_score(self, scoring_rubric: Dict[str, Any] = None) -> float:
        """Calculate score for this response"""
        if self.manual_score is not None:
            return self.manual_score
        
        if self.auto_score is not None:
            return self.auto_score
        
        # Simple scoring logic - would be enhanced with AI
        if self.question.question_type == QuestionType.BOOLEAN:
            return 100.0 if self.response_boolean else 0.0
        elif self.question.question_type == QuestionType.SCALE:
            scale_max = 10  # Default scale
            if scoring_rubric and "scale_max" in scoring_rubric:
                scale_max = scoring_rubric["scale_max"]
            return (self.response_numeric / scale_max) * 100.0 if self.response_numeric else 0.0
        
        # Default scoring for other types
        return 80.0 if self.response_value is not None else 0.0

# ================================================================================
# COLLABORATION AND WORKFLOW MODELS
# ================================================================================

class AssessmentCollaborator(BaseModelWithSoftDelete, TimestampMixin):
    """Assessment collaboration and permissions"""
    __tablename__ = "assessment_collaborators"
    
    assessment_id = Column(UUID(as_uuid=True), nullable=False, index=True)
    user_id = Column(UUID(as_uuid=True), nullable=False, index=True)
    
    # Collaboration role and permissions
    role = Column(String(50), nullable=False, default="contributor")  # owner, reviewer, contributor, viewer
    permissions = Column(JSON, default=lambda: {
        "can_edit": True,
        "can_review": False,
        "can_approve": False,
        "can_delete": False,
        "can_invite_others": False
    })
    
    # Collaboration metadata
    invited_by_id = Column(UUID(as_uuid=True), nullable=True)
    invited_at = Column(DateTime, default=datetime.utcnow)
    accepted_at = Column(DateTime, nullable=True)
    last_contribution_at = Column(DateTime, nullable=True)
    
    # Activity tracking
    contributions_count = Column(Integer, default=0)
    time_spent_minutes = Column(Integer, default=0)
    sections_assigned = Column(ARRAY(String), nullable=True)
    
    # Status
    is_active = Column(Boolean, default=True)
    notification_preferences = Column(JSON, default=lambda: {
        "email_notifications": True,
        "progress_updates": True,
        "deadline_reminders": True
    })
    
    # Relationships
    assessment = relationship("ESGAssessment", back_populates="collaborators")
    
    def has_permission(self, permission: str) -> bool:
        """Check if collaborator has specific permission"""
        return self.permissions.get(permission, False)

class AssessmentDocument(BaseModelWithSoftDelete, TimestampMixin):
    """Documents attached to assessments for evidence"""
    __tablename__ = "assessment_documents"
    
    assessment_id = Column(UUID(as_uuid=True), nullable=False, index=True)
    
    # Document identification
    filename = Column(String(255), nullable=False)
    original_filename = Column(String(255), nullable=False)
    file_path = Column(String(500), nullable=False)
    file_size = Column(Integer, nullable=False)
    file_type = Column(String(100), nullable=False)
    mime_type = Column(String(100), nullable=False)
    
    # Document metadata
    title = Column(String(255), nullable=True)
    description = Column(Text, nullable=True)
    document_category = Column(String(100), nullable=True)
    tags = Column(ARRAY(String), nullable=True)
    
    # Upload information
    uploaded_by_id = Column(UUID(as_uuid=True), nullable=False)
    upload_source = Column(String(100), default="manual")  # manual, api, integration
    
    # Document processing
    processing_status = Column(String(50), default="pending")  # pending, processing, completed, failed
    extracted_text = Column(Text, nullable=True)
    extracted_data = Column(JSON, nullable=True)
    ai_analysis = Column(JSON, nullable=True)
    
    # Security and access
    is_confidential = Column(Boolean, default=False)
    access_level = Column(String(50), default="assessment")  # public, organization, assessment, restricted
    encryption_key_id = Column(String(255), nullable=True)
    
    # Document validity
    document_date = Column(DateTime, nullable=True)
    expiry_date = Column(DateTime, nullable=True)
    version = Column(String(50), nullable=True)
    superseded_by_id = Column(UUID(as_uuid=True), nullable=True)
    
    # Verification
    verified = Column(Boolean, default=False)
    verified_by_id = Column(UUID(as_uuid=True), nullable=True)
    verified_at = Column(DateTime, nullable=True)
    verification_notes = Column(Text, nullable=True)
    
    # Relationships
    assessment = relationship("ESGAssessment", back_populates="documents")
    
    def is_image(self) -> bool:
        """Check if document is an image"""
        image_types = ['image/jpeg', 'image/png', 'image/gif', 'image/bmp', 'image/tiff']
        return self.mime_type in image_types
    
    def is_pdf(self) -> bool:
        """Check if document is a PDF"""
        return self.mime_type == 'application/pdf'
    
    def needs_processing(self) -> bool:
        """Check if document needs AI processing"""
        return self.processing_status in ['pending', 'failed']

print("✅ ESG Assessment Models Loaded Successfully!")
print("Features:")
print("  📊 Comprehensive ESG Framework Support")
print("  🎯 Multi-Framework Assessment Engine")
print("  📝 Flexible Question Types & Validation")
print("  🤝 Collaboration & Workflow Management")
print("  🧠 AI-Enhanced Scoring & Insights")
print("  📁 Document Management & Processing")
print("  ⚡ Real-time Progress Tracking")
print("  🔒 Security & Access Control")