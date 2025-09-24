# ================================================================================
# AUREX LAUNCHPAD™ GHG EMISSIONS READINESS ASSESSMENT MODELS
# Sub-Application #12: Comprehensive GHG readiness evaluation and benchmarking
# Module ID: LAU-GHG-012
# Priority: High (Core ESG functionality)
# Integration: Links with GHG Calculator (LAU-GHG-002)
# ================================================================================

from sqlalchemy import Column, String, DateTime, Boolean, JSON, Text, Integer, Float, Enum as SQLEnum, ForeignKey
from sqlalchemy.dialects.postgresql import UUID, ARRAY
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from datetime import datetime, date
import uuid
from typing import Optional, Dict, Any, List
from enum import Enum

from .base_models import BaseModelWithSoftDelete, TimestampMixin

# ================================================================================
# GHG READINESS ENUMS AND CONSTANTS
# ================================================================================

class GHGReadinessLevel(Enum):
    """GHG readiness maturity levels"""
    LEVEL_0_NO_AWARENESS = "level_0_no_awareness"  # 0-20 points
    LEVEL_1_BASIC_AWARENESS = "level_1_basic_awareness"  # 21-40 points  
    LEVEL_2_DEVELOPING = "level_2_developing"  # 41-60 points
    LEVEL_3_OPERATIONAL = "level_3_operational"  # 61-80 points
    LEVEL_4_ADVANCED = "level_4_advanced"  # 81-90 points
    LEVEL_5_LEADING = "level_5_leading"  # 91-100 points

class GHGReadinessSection(Enum):
    """Seven core sections of GHG readiness assessment"""
    STRATEGIC_COMMITMENT = "strategic_commitment"  # Section 1
    GOVERNANCE_STRUCTURE = "governance_structure"  # Section 2
    DATA_MANAGEMENT = "data_management"  # Section 3
    MEASUREMENT_REPORTING = "measurement_reporting"  # Section 4
    TARGET_SETTING = "target_setting"  # Section 5
    VERIFICATION_ASSURANCE = "verification_assurance"  # Section 6
    STAKEHOLDER_ENGAGEMENT = "stakeholder_engagement"  # Section 7

class IndustryType(Enum):
    """Industry classification for sector-specific assessments"""
    MANUFACTURING = "manufacturing"
    ENERGY_UTILITIES = "energy_utilities"
    TRANSPORTATION = "transportation"
    CONSTRUCTION = "construction"
    AGRICULTURE = "agriculture"
    TECHNOLOGY = "technology"
    FINANCIAL_SERVICES = "financial_services"
    RETAIL = "retail"
    HEALTHCARE = "healthcare"
    REAL_ESTATE = "real_estate"
    MINING_EXTRACTIVES = "mining_extractives"
    FOOD_BEVERAGE = "food_beverage"
    CHEMICALS = "chemicals"
    TEXTILES = "textiles"
    AUTOMOTIVE = "automotive"
    OTHER = "other"

class GHGStandard(Enum):
    """Supported GHG accounting standards"""
    GHG_PROTOCOL_CORPORATE = "ghg_protocol_corporate"
    ISO_14064_1 = "iso_14064_1"
    TCFD = "tcfd"
    CDP = "cdp"
    SASB = "sasb"
    SEC_CLIMATE_RULES = "sec_climate_rules"
    EU_TAXONOMY = "eu_taxonomy"
    SBTI = "sbti"  # Science Based Targets Initiative

class AssessmentStatus(Enum):
    """Assessment completion status"""
    NOT_STARTED = "not_started"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    UNDER_REVIEW = "under_review"
    APPROVED = "approved"
    ARCHIVED = "archived"

class QuestionDifficulty(Enum):
    """Question difficulty levels"""
    BASIC = "basic"
    INTERMEDIATE = "intermediate"
    ADVANCED = "advanced"
    EXPERT = "expert"

class ResponseType(Enum):
    """Types of assessment responses"""
    YES_NO = "yes_no"
    SCALE_1_5 = "scale_1_5"
    MULTIPLE_CHOICE = "multiple_choice"
    TEXT_INPUT = "text_input"
    NUMERIC_INPUT = "numeric_input"
    DOCUMENT_UPLOAD = "document_upload"
    PERCENTAGE = "percentage"
    DATE_INPUT = "date_input"

# ================================================================================
# GHG READINESS FRAMEWORK MODELS
# ================================================================================

class GHGReadinessFramework(BaseModelWithSoftDelete, TimestampMixin):
    """Core GHG readiness assessment framework configuration"""
    __tablename__ = "ghg_readiness_frameworks"
    
    # Framework identification
    name = Column(String(255), nullable=False)
    code = Column(String(100), nullable=False, unique=True, index=True)
    version = Column(String(50), nullable=False, default="1.0")
    
    # Framework details
    description = Column(Text, nullable=True)
    methodology_url = Column(String(500), nullable=True)
    published_date = Column(DateTime, nullable=True)
    effective_date = Column(DateTime, default=datetime.utcnow)
    
    # Framework configuration
    total_sections = Column(Integer, default=7)
    total_questions = Column(Integer, nullable=False)
    estimated_completion_time = Column(Integer, default=30)  # minutes
    max_score = Column(Float, default=100.0)
    
    # Industry and organizational scope
    applicable_industries = Column(ARRAY(String), nullable=True)
    minimum_employee_count = Column(Integer, nullable=True)
    maximum_employee_count = Column(Integer, nullable=True)
    
    # Standards alignment
    aligned_standards = Column(JSON, default=lambda: {
        "ghg_protocol": True,
        "iso_14064_1": True,
        "tcfd": True,
        "cdp": True,
        "sasb": True,
        "sec_climate": True
    })
    
    # Framework metadata
    is_active = Column(Boolean, default=True)
    is_default = Column(Boolean, default=False)
    usage_count = Column(Integer, default=0)
    
    # Scoring configuration
    section_weights = Column(JSON, default=lambda: {
        "strategic_commitment": 0.15,      # 15%
        "governance_structure": 0.15,      # 15%
        "data_management": 0.20,           # 20%
        "measurement_reporting": 0.20,     # 20%
        "target_setting": 0.15,            # 15%
        "verification_assurance": 0.10,    # 10%
        "stakeholder_engagement": 0.05     # 5%
    })
    
    # Maturity level thresholds
    maturity_thresholds = Column(JSON, default=lambda: {
        "level_0_no_awareness": {"min": 0, "max": 20},
        "level_1_basic_awareness": {"min": 21, "max": 40},
        "level_2_developing": {"min": 41, "max": 60},
        "level_3_operational": {"min": 61, "max": 80},
        "level_4_advanced": {"min": 81, "max": 90},
        "level_5_leading": {"min": 91, "max": 100}
    })
    
    # Relationships
    assessments = relationship("GHGReadinessAssessment", back_populates="framework")
    sections = relationship("GHGReadinessSectionTemplate", back_populates="framework")
    
    def get_maturity_level(self, score: float) -> str:
        """Determine maturity level based on score"""
        for level, threshold in self.maturity_thresholds.items():
            if threshold["min"] <= score <= threshold["max"]:
                return level
        return "level_0_no_awareness"

class GHGReadinessSectionTemplate(BaseModelWithSoftDelete, TimestampMixin):
    """Template for GHG readiness assessment sections"""
    __tablename__ = "ghg_readiness_section_templates"
    
    framework_id = Column(UUID(as_uuid=True), ForeignKey("ghg_readiness_frameworks.id"), nullable=False)
    
    # Section identification
    section_type = Column(SQLEnum(GHGReadinessSection), nullable=False)
    name = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    order_index = Column(Integer, nullable=False)
    
    # Section configuration
    weight = Column(Float, nullable=False)
    max_score = Column(Float, default=100.0)
    is_mandatory = Column(Boolean, default=True)
    
    # Section guidance
    guidance_text = Column(Text, nullable=True)
    key_concepts = Column(JSON, nullable=True)  # Key concepts and definitions
    best_practices = Column(JSON, nullable=True)  # Industry best practices
    
    # Conditional logic
    prerequisites = Column(JSON, nullable=True)  # Required previous sections
    skip_conditions = Column(JSON, nullable=True)  # When to skip this section
    
    # Relationships
    framework = relationship("GHGReadinessFramework", back_populates="sections")
    questions = relationship("GHGReadinessQuestionTemplate", back_populates="section")

class GHGReadinessQuestionTemplate(BaseModelWithSoftDelete, TimestampMixin):
    """Template for individual GHG readiness questions"""
    __tablename__ = "ghg_readiness_question_templates"
    
    section_id = Column(UUID(as_uuid=True), ForeignKey("ghg_readiness_section_templates.id"), nullable=False)
    
    # Question identification
    code = Column(String(100), nullable=False, unique=True, index=True)
    question_text = Column(Text, nullable=False)
    question_category = Column(String(100), nullable=True)
    order_index = Column(Integer, nullable=False)
    
    # Question configuration
    response_type = Column(SQLEnum(ResponseType), nullable=False)
    is_required = Column(Boolean, default=True)
    weight = Column(Float, default=1.0)
    max_score = Column(Float, default=100.0)
    difficulty = Column(SQLEnum(QuestionDifficulty), default=QuestionDifficulty.INTERMEDIATE)
    
    # Response options and validation
    response_options = Column(JSON, nullable=True)  # Options for multiple choice
    validation_rules = Column(JSON, nullable=True)  # Validation constraints
    scoring_rubric = Column(JSON, nullable=True)   # How to score responses
    
    # Question guidance
    help_text = Column(Text, nullable=True)
    guidance_url = Column(String(500), nullable=True)
    example_answer = Column(Text, nullable=True)
    
    # Industry customization
    industry_variants = Column(JSON, nullable=True)  # Industry-specific versions
    applicable_industries = Column(ARRAY(String), nullable=True)
    
    # Standards alignment
    related_standards = Column(JSON, nullable=True)  # Which standards this addresses
    disclosure_requirements = Column(JSON, nullable=True)  # Related disclosure requirements
    
    # Question metadata
    tags = Column(ARRAY(String), nullable=True)
    estimated_time_seconds = Column(Integer, default=180)  # 3 minutes default
    evidence_required = Column(Boolean, default=False)
    
    # Relationships
    section = relationship("GHGReadinessSectionTemplate", back_populates="questions")
    responses = relationship("GHGReadinessResponse", back_populates="question_template")
    
    def get_industry_specific_question(self, industry: str) -> Optional[Dict[str, Any]]:
        """Get industry-specific version of question if available"""
        if not self.industry_variants:
            return None
        return self.industry_variants.get(industry)

# ================================================================================
# ASSESSMENT INSTANCE MODELS
# ================================================================================

class GHGReadinessAssessment(BaseModelWithSoftDelete, TimestampMixin):
    """Individual GHG readiness assessment instance"""
    __tablename__ = "ghg_readiness_assessments"
    
    organization_id = Column(UUID(as_uuid=True), nullable=False, index=True)
    framework_id = Column(UUID(as_uuid=True), ForeignKey("ghg_readiness_frameworks.id"), nullable=False)
    
    # Assessment identification
    name = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    assessment_year = Column(Integer, nullable=False)
    
    # Organizational context
    industry_type = Column(SQLEnum(IndustryType), nullable=False)
    employee_count = Column(Integer, nullable=True)
    annual_revenue = Column(Float, nullable=True)  # USD
    geographic_scope = Column(ARRAY(String), nullable=True)  # Countries/regions
    
    # Assessment workflow
    status = Column(SQLEnum(AssessmentStatus), default=AssessmentStatus.NOT_STARTED)
    current_section = Column(SQLEnum(GHGReadinessSection), nullable=True)
    completion_percentage = Column(Float, default=0.0)
    
    # Participants
    created_by_id = Column(UUID(as_uuid=True), nullable=False)
    assigned_to_id = Column(UUID(as_uuid=True), nullable=True)
    reviewed_by_id = Column(UUID(as_uuid=True), nullable=True)
    
    # Important dates
    start_date = Column(DateTime, default=datetime.utcnow)
    target_completion_date = Column(DateTime, nullable=True)
    completed_at = Column(DateTime, nullable=True)
    reviewed_at = Column(DateTime, nullable=True)
    
    # Scoring results
    total_score = Column(Float, nullable=True)
    maturity_level = Column(SQLEnum(GHGReadinessLevel), nullable=True)
    
    # Section scores
    section_scores = Column(JSON, nullable=True)  # Detailed section breakdown
    
    # Time tracking
    time_spent_minutes = Column(Integer, default=0)
    estimated_remaining_time = Column(Integer, nullable=True)
    
    # Assessment metadata
    assessment_config = Column(JSON, default=lambda: {
        "auto_save_interval": 300,  # 5 minutes
        "show_progress": True,
        "allow_section_skip": False,
        "require_all_questions": True,
        "enable_draft_save": True
    })
    
    # External references
    external_assessment_id = Column(String(255), nullable=True)
    predecessor_assessment_id = Column(UUID(as_uuid=True), nullable=True)  # For tracking progress over time
    
    # Relationships
    framework = relationship("GHGReadinessFramework", back_populates="assessments")
    responses = relationship("GHGReadinessResponse", back_populates="assessment")
    recommendations = relationship("GHGReadinessRecommendation", back_populates="assessment")
    benchmark_results = relationship("GHGReadinessBenchmark", back_populates="assessment")
    
    def calculate_completion_percentage(self) -> float:
        """Calculate assessment completion percentage"""
        total_questions = len(self.responses)
        if total_questions == 0:
            return 0.0
        
        completed_responses = len([r for r in self.responses if r.response_value is not None])
        return (completed_responses / total_questions) * 100.0
    
    def get_section_progress(self) -> Dict[str, Dict[str, Any]]:
        """Get progress for each section"""
        section_progress = {}
        
        for section_type in GHGReadinessSection:
            section_responses = [r for r in self.responses if r.question_template.section.section_type == section_type]
            total_questions = len(section_responses)
            completed_questions = len([r for r in section_responses if r.response_value is not None])
            
            section_progress[section_type.value] = {
                "total_questions": total_questions,
                "completed_questions": completed_questions,
                "completion_percentage": (completed_questions / total_questions * 100.0) if total_questions > 0 else 0.0,
                "section_score": self.section_scores.get(section_type.value) if self.section_scores else None
            }
        
        return section_progress
    
    def is_eligible_for_review(self) -> bool:
        """Check if assessment is ready for review"""
        return (self.completion_percentage >= 100.0 and 
                self.status == AssessmentStatus.COMPLETED and
                self.total_score is not None)

class GHGReadinessResponse(BaseModelWithSoftDelete, TimestampMixin):
    """Individual responses to GHG readiness questions"""
    __tablename__ = "ghg_readiness_responses"
    
    assessment_id = Column(UUID(as_uuid=True), ForeignKey("ghg_readiness_assessments.id"), nullable=False)
    question_template_id = Column(UUID(as_uuid=True), ForeignKey("ghg_readiness_question_templates.id"), nullable=False)
    
    # Response data
    response_value = Column(JSON, nullable=True)  # Flexible storage for any response type
    response_text = Column(Text, nullable=True)   # Text responses
    response_numeric = Column(Float, nullable=True)  # Numeric responses
    response_boolean = Column(Boolean, nullable=True)  # Yes/No responses
    response_date = Column(DateTime, nullable=True)  # Date responses
    
    # Response metadata
    responded_by_id = Column(UUID(as_uuid=True), nullable=False)
    responded_at = Column(DateTime, default=datetime.utcnow)
    time_spent_seconds = Column(Integer, default=0)
    
    # Response quality
    confidence_level = Column(Integer, nullable=True)  # 1-5 scale
    is_estimate = Column(Boolean, default=False)
    data_source = Column(String(255), nullable=True)
    
    # Evidence and supporting information
    evidence_documents = Column(JSON, nullable=True)  # Document references
    supporting_notes = Column(Text, nullable=True)
    external_references = Column(JSON, nullable=True)
    
    # Scoring
    assigned_score = Column(Float, nullable=True)
    auto_calculated_score = Column(Float, nullable=True)
    manual_override_score = Column(Float, nullable=True)
    score_explanation = Column(Text, nullable=True)
    
    # Review and validation
    reviewed_by_id = Column(UUID(as_uuid=True), nullable=True)
    reviewed_at = Column(DateTime, nullable=True)
    review_status = Column(String(50), default="pending")  # pending, approved, needs_revision
    review_comments = Column(Text, nullable=True)
    
    # Version control
    version = Column(Integer, default=1)
    previous_response_id = Column(UUID(as_uuid=True), nullable=True)
    change_reason = Column(String(500), nullable=True)
    
    # Relationships
    assessment = relationship("GHGReadinessAssessment", back_populates="responses")
    question_template = relationship("GHGReadinessQuestionTemplate", back_populates="responses")
    
    def get_final_score(self) -> Optional[float]:
        """Get final score for this response"""
        if self.manual_override_score is not None:
            return self.manual_override_score
        elif self.auto_calculated_score is not None:
            return self.auto_calculated_score
        elif self.assigned_score is not None:
            return self.assigned_score
        return None
    
    def calculate_auto_score(self) -> float:
        """Calculate automatic score based on response and scoring rubric"""
        if not self.question_template.scoring_rubric:
            return 0.0
        
        rubric = self.question_template.scoring_rubric
        response_type = self.question_template.response_type
        
        if response_type == ResponseType.YES_NO:
            if self.response_boolean is True:
                return rubric.get("yes_score", 100.0)
            else:
                return rubric.get("no_score", 0.0)
        
        elif response_type == ResponseType.SCALE_1_5:
            if self.response_numeric is not None:
                scale_scores = rubric.get("scale_scores", {1: 20, 2: 40, 3: 60, 4: 80, 5: 100})
                return scale_scores.get(int(self.response_numeric), 0.0)
        
        elif response_type == ResponseType.MULTIPLE_CHOICE:
            if self.response_value is not None:
                choice_scores = rubric.get("choice_scores", {})
                return choice_scores.get(str(self.response_value), 0.0)
        
        elif response_type == ResponseType.PERCENTAGE:
            if self.response_numeric is not None:
                # Linear scoring based on percentage
                return min(100.0, max(0.0, self.response_numeric))
        
        # Default score for text and other types
        return rubric.get("default_score", 50.0) if self.response_value is not None else 0.0

# ================================================================================
# RECOMMENDATION AND BENCHMARKING MODELS
# ================================================================================

class GHGReadinessRecommendation(BaseModelWithSoftDelete, TimestampMixin):
    """AI-generated recommendations for GHG readiness improvement"""
    __tablename__ = "ghg_readiness_recommendations"
    
    assessment_id = Column(UUID(as_uuid=True), ForeignKey("ghg_readiness_assessments.id"), nullable=False)
    
    # Recommendation identification
    recommendation_type = Column(String(100), nullable=False)  # strategic, operational, technical, training
    priority = Column(String(20), nullable=False, default="medium")  # high, medium, low
    category = Column(SQLEnum(GHGReadinessSection), nullable=False)
    
    # Recommendation content
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=False)
    rationale = Column(Text, nullable=True)
    expected_impact = Column(Text, nullable=True)
    
    # Implementation details
    implementation_steps = Column(JSON, nullable=True)  # Step-by-step guide
    estimated_effort = Column(String(50), nullable=True)  # low, medium, high
    estimated_cost = Column(String(50), nullable=True)   # low, medium, high
    estimated_timeline = Column(String(100), nullable=True)  # timeframe for implementation
    
    # Resources and references
    resources_needed = Column(JSON, nullable=True)  # Skills, tools, budget
    reference_materials = Column(JSON, nullable=True)  # Links to guides, standards
    best_practice_examples = Column(JSON, nullable=True)  # Industry examples
    
    # Recommendation metadata
    confidence_score = Column(Float, nullable=True)  # AI confidence in recommendation
    potential_score_improvement = Column(Float, nullable=True)  # Expected score boost
    applicable_standards = Column(ARRAY(String), nullable=True)
    
    # Status tracking
    status = Column(String(50), default="pending")  # pending, accepted, rejected, implemented
    accepted_at = Column(DateTime, nullable=True)
    implemented_at = Column(DateTime, nullable=True)
    implementation_notes = Column(Text, nullable=True)
    
    # Relationships
    assessment = relationship("GHGReadinessAssessment", back_populates="recommendations")
    
    def get_priority_weight(self) -> float:
        """Get numeric weight for priority sorting"""
        weights = {"high": 3.0, "medium": 2.0, "low": 1.0}
        return weights.get(self.priority, 2.0)

class GHGReadinessBenchmark(BaseModelWithSoftDelete, TimestampMixin):
    """Industry benchmarking data for GHG readiness assessments"""
    __tablename__ = "ghg_readiness_benchmarks"
    
    assessment_id = Column(UUID(as_uuid=True), ForeignKey("ghg_readiness_assessments.id"), nullable=False)
    
    # Benchmarking context
    industry_type = Column(SQLEnum(IndustryType), nullable=False)
    employee_size_range = Column(String(50), nullable=False)  # e.g., "1000-5000"
    revenue_size_range = Column(String(50), nullable=True)    # e.g., "100M-500M"
    geographic_region = Column(String(100), nullable=True)
    
    # Benchmark statistics
    peer_count = Column(Integer, nullable=False)  # Number of peer organizations
    assessment_score = Column(Float, nullable=False)
    industry_average = Column(Float, nullable=False)
    industry_median = Column(Float, nullable=False)
    industry_percentile = Column(Float, nullable=False)  # Where assessment ranks
    
    # Section benchmarks
    section_benchmarks = Column(JSON, nullable=True)  # Detailed section comparisons
    
    # Top performer analysis
    top_performer_score = Column(Float, nullable=True)
    top_performer_practices = Column(JSON, nullable=True)  # What leaders do differently
    gap_analysis = Column(JSON, nullable=True)  # Gaps compared to top performers
    
    # Benchmark metadata
    benchmark_date = Column(DateTime, default=datetime.utcnow)
    data_freshness = Column(Integer, nullable=True)  # Days since data collection
    confidence_level = Column(Float, nullable=True)  # Statistical confidence
    
    # Trending analysis
    industry_trend = Column(String(20), nullable=True)  # improving, stable, declining
    year_over_year_change = Column(Float, nullable=True)  # Industry average change
    
    # Relationships
    assessment = relationship("GHGReadinessAssessment", back_populates="benchmark_results")
    
    def get_performance_category(self) -> str:
        """Categorize performance relative to industry"""
        if self.industry_percentile >= 90:
            return "top_performer"
        elif self.industry_percentile >= 75:
            return "above_average"
        elif self.industry_percentile >= 50:
            return "average"
        elif self.industry_percentile >= 25:
            return "below_average"
        else:
            return "needs_improvement"

class GHGReadinessIndustryStandard(BaseModelWithSoftDelete, TimestampMixin):
    """Industry-specific standards and best practices"""
    __tablename__ = "ghg_readiness_industry_standards"
    
    # Industry identification
    industry_type = Column(SQLEnum(IndustryType), nullable=False)
    sub_sector = Column(String(100), nullable=True)
    
    # Standard definition
    standard_name = Column(String(255), nullable=False)
    standard_version = Column(String(50), nullable=False)
    effective_date = Column(DateTime, nullable=False)
    
    # Standard details
    description = Column(Text, nullable=False)
    requirements = Column(JSON, nullable=False)  # Specific requirements by section
    compliance_criteria = Column(JSON, nullable=True)  # What constitutes compliance
    
    # Scoring adjustments
    section_weightings = Column(JSON, nullable=True)  # Industry-specific weightings
    scoring_modifications = Column(JSON, nullable=True)  # Score adjustments
    
    # Geographic applicability
    applicable_regions = Column(ARRAY(String), nullable=True)
    regulatory_context = Column(JSON, nullable=True)  # Related regulations
    
    # Standard metadata
    is_mandatory = Column(Boolean, default=False)
    authority = Column(String(255), nullable=True)  # Issuing authority
    reference_url = Column(String(500), nullable=True)
    
    # Usage statistics
    assessments_using = Column(Integer, default=0)
    average_compliance_rate = Column(Float, nullable=True)

print("✅ GHG Readiness Assessment Models Loaded Successfully!")
print("Sub-Application #12 Features:")
print("  🎯 Module ID: LAU-GHG-012")
print("  📊 7-Section Readiness Framework")
print("  🏭 Industry-Specific Customization")
print("  📈 6-Level Maturity Assessment")
print("  🎚️ Sophisticated Scoring Engine")
print("  🤖 AI-Powered Recommendations")
print("  📊 Peer Benchmarking System")
print("  🔗 GHG Calculator Integration")
print("  📋 52+ Question Assessment")
print("  ⚡ Real-time Progress Tracking")