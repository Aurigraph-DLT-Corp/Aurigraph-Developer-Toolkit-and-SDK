# ================================================================================
# AUREX LAUNCHPAD™ EU TAXONOMY & ESRS COMPLIANCE MODELS
# Sub-Application #3: European Sustainability Reporting Standards Data Models
# Module ID: LAU-EU-003-MODELS - EU Taxonomy & ESRS Compliance Models
# Created: August 8, 2025
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
# EU TAXONOMY ENUMS AND CONSTANTS
# ================================================================================

class EnvironmentalObjective(Enum):
    """Six EU Taxonomy Environmental Objectives"""
    CLIMATE_MITIGATION = "climate_mitigation"
    CLIMATE_ADAPTATION = "climate_adaptation"
    WATER_PROTECTION = "water_protection"
    CIRCULAR_ECONOMY = "circular_economy"
    POLLUTION_PREVENTION = "pollution_prevention"
    BIODIVERSITY_PROTECTION = "biodiversity_protection"

class TaxonomyAlignment(Enum):
    """EU Taxonomy alignment status"""
    ALIGNED = "aligned"
    ELIGIBLE_NOT_ALIGNED = "eligible_not_aligned"
    NOT_ELIGIBLE = "not_eligible"
    UNDER_ASSESSMENT = "under_assessment"

class ComplianceStatus(Enum):
    """Compliance status for various assessments"""
    COMPLIANT = "compliant"
    NON_COMPLIANT = "non_compliant"
    PARTIALLY_COMPLIANT = "partially_compliant"
    NOT_ASSESSED = "not_assessed"
    IN_PROGRESS = "in_progress"

class MaterialityType(Enum):
    """Double materiality types"""
    IMPACT_MATERIALITY = "impact_materiality"
    FINANCIAL_MATERIALITY = "financial_materiality"
    BOTH = "both"
    NEITHER = "neither"

class ESRSStandard(Enum):
    """European Sustainability Reporting Standards"""
    ESRS_1 = "esrs_1_general_requirements"
    ESRS_2 = "esrs_2_general_disclosures"
    ESRS_E1 = "esrs_e1_climate_change"
    ESRS_E2 = "esrs_e2_pollution"
    ESRS_E3 = "esrs_e3_water_marine"
    ESRS_E4 = "esrs_e4_biodiversity"
    ESRS_E5 = "esrs_e5_circular_economy"
    ESRS_S1 = "esrs_s1_own_workforce"
    ESRS_S2 = "esrs_s2_workers_value_chain"
    ESRS_S3 = "esrs_s3_affected_communities"
    ESRS_S4 = "esrs_s4_consumers_end_users"
    ESRS_G1 = "esrs_g1_business_conduct"

class SafeguardPrinciple(Enum):
    """EU Taxonomy Minimum Safeguards Principles"""
    OECD_GUIDELINES = "oecd_guidelines_multinational_enterprises"
    UN_GUIDING_PRINCIPLES = "un_guiding_principles_business_human_rights"
    ILO_DECLARATION = "ilo_declaration_fundamental_principles"
    INTERNATIONAL_BILL_RIGHTS = "international_bill_human_rights"

# ================================================================================
# CORE EU TAXONOMY MODELS
# ================================================================================

class EUTaxonomyAssessment(BaseModelWithSoftDelete, TimestampMixin):
    """Main EU Taxonomy alignment assessment entity"""
    __tablename__ = "eu_taxonomy_assessments"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String, nullable=False, index=True)
    organization_id = Column(String, nullable=False, index=True)
    
    # Assessment metadata
    title = Column(String(200), nullable=False)
    description = Column(Text)
    reporting_period = Column(String(4), nullable=False)  # Year format: "2024"
    assessment_scope = Column(JSON, default=dict)
    
    # Taxonomy configuration
    selected_objectives = Column(ARRAY(SQLEnum(EnvironmentalObjective)), default=list)
    economic_activities = Column(ARRAY(String), default=list)  # NACE codes
    materiality_threshold = Column(Float, default=5.0)
    
    # Assessment status and results
    status = Column(SQLEnum(ComplianceStatus), default=ComplianceStatus.NOT_ASSESSED)
    overall_alignment = Column(SQLEnum(TaxonomyAlignment), nullable=True)
    alignment_percentage = Column(Float, default=0.0)
    
    # Financial metrics
    taxonomy_eligible_turnover = Column(Float, default=0.0)
    taxonomy_aligned_turnover = Column(Float, default=0.0)
    taxonomy_eligible_capex = Column(Float, default=0.0)
    taxonomy_aligned_capex = Column(Float, default=0.0)
    taxonomy_eligible_opex = Column(Float, default=0.0)
    taxonomy_aligned_opex = Column(Float, default=0.0)
    
    # Completion tracking
    completed_at = Column(DateTime, nullable=True)
    submitted_at = Column(DateTime, nullable=True)
    
    # Relationships
    double_materiality_assessments = relationship("DoubleMaturityAssessment", back_populates="assessment", cascade="all, delete-orphan")
    technical_screening_criteria = relationship("TechnicalScreeningCriteria", back_populates="assessment", cascade="all, delete-orphan")
    esrs_compliance_records = relationship("ESRSCompliance", back_populates="assessment", cascade="all, delete-orphan")
    safeguard_compliance_records = relationship("SafeguardCompliance", back_populates="assessment", cascade="all, delete-orphan")

class DoubleMaturityAssessment(BaseModelWithSoftDelete, TimestampMixin):
    """Double materiality assessment for sustainability topics"""
    __tablename__ = "double_materiality_assessments"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    assessment_id = Column(String, ForeignKey("eu_taxonomy_assessments.id"), nullable=False)
    
    # Topic information
    topic = Column(String(200), nullable=False)
    topic_category = Column(String(100))  # e.g., "Environmental", "Social", "Governance"
    esrs_standard = Column(SQLEnum(ESRSStandard), nullable=True)
    
    # Materiality scoring (1-5 scale)
    impact_materiality_score = Column(Float, nullable=False)  # Impact on people & environment
    financial_materiality_score = Column(Float, nullable=False)  # Financial impact on organization
    combined_materiality_score = Column(Float, nullable=True)
    
    # Materiality determination
    is_material = Column(Boolean, default=False)
    materiality_type = Column(SQLEnum(MaterialityType), nullable=True)
    
    # Assessment details
    time_horizon = Column(String(50))  # "short_term", "medium_term", "long_term"
    stakeholder_input = Column(JSON, default=dict)
    evidence_provided = Column(ARRAY(String), default=list)
    assessment_rationale = Column(Text)
    
    # External validation
    stakeholder_validated = Column(Boolean, default=False)
    expert_reviewed = Column(Boolean, default=False)
    
    # Relationship
    assessment = relationship("EUTaxonomyAssessment", back_populates="double_materiality_assessments")

class TechnicalScreeningCriteria(BaseModelWithSoftDelete, TimestampMixin):
    """Technical screening criteria for EU Taxonomy alignment"""
    __tablename__ = "technical_screening_criteria"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    assessment_id = Column(String, ForeignKey("eu_taxonomy_assessments.id"), nullable=False)
    
    # Criteria identification
    environmental_objective = Column(SQLEnum(EnvironmentalObjective), nullable=False)
    activity_code = Column(String(20), nullable=False)  # NACE code
    activity_description = Column(String(500), nullable=False)
    criteria_sequence = Column(Integer, nullable=False)  # Order within activity
    
    # Criteria details
    criteria_description = Column(Text, nullable=False)
    metric_requirements = Column(JSON, default=dict)
    threshold_values = Column(JSON, default=dict)
    
    # Compliance assessment
    compliance_status = Column(SQLEnum(ComplianceStatus), nullable=True)
    evidence_provided = Column(Text)
    quantitative_data = Column(JSON, default=dict)
    supporting_documents = Column(ARRAY(String), default=list)
    confidence_level = Column(Integer)  # 1-5 scale
    
    # DNSH and safeguards flags
    dnsh_assessment_required = Column(Boolean, default=True)
    minimum_safeguards_applicable = Column(Boolean, default=True)
    
    # Assessment metadata
    assessed_by = Column(String(100))
    assessed_at = Column(DateTime, nullable=True)
    reviewed_by = Column(String(100))
    reviewed_at = Column(DateTime, nullable=True)
    
    # Relationship
    assessment = relationship("EUTaxonomyAssessment", back_populates="technical_screening_criteria")

class ESRSCompliance(BaseModelWithSoftDelete, TimestampMixin):
    """ESRS compliance and disclosure tracking"""
    __tablename__ = "esrs_compliance"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    assessment_id = Column(String, ForeignKey("eu_taxonomy_assessments.id"), nullable=False)
    
    # ESRS details
    standard = Column(SQLEnum(ESRSStandard), nullable=False)
    disclosure_requirement = Column(String(100), nullable=False)
    datapoint_reference = Column(String(100))
    
    # Compliance status
    compliance_status = Column(SQLEnum(ComplianceStatus), nullable=False)
    disclosure_status = Column(String(50))  # "mandatory", "voluntary", "not_applicable"
    
    # Reported data
    reported_data = Column(JSON, default=dict)
    data_quality_assessment = Column(String(50))  # "high", "medium", "low"
    data_sources = Column(ARRAY(String), default=list)
    
    # Assurance and verification
    external_assurance = Column(Boolean, default=False)
    assurance_provider = Column(String(200))
    assurance_level = Column(String(50))  # "limited", "reasonable"
    
    # Disclosure timeline
    disclosure_deadline = Column(DateTime)
    disclosed_at = Column(DateTime, nullable=True)
    
    # Relationship
    assessment = relationship("EUTaxonomyAssessment", back_populates="esrs_compliance_records")

class SafeguardCompliance(BaseModelWithSoftDelete, TimestampMixin):
    """EU Taxonomy minimum safeguards compliance tracking"""
    __tablename__ = "safeguard_compliance"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    assessment_id = Column(String, ForeignKey("eu_taxonomy_assessments.id"), nullable=False)
    
    # Safeguard details
    safeguard_principle = Column(SQLEnum(SafeguardPrinciple), nullable=False)
    specific_requirement = Column(String(200), nullable=False)
    
    # Compliance assessment
    compliance_status = Column(SQLEnum(ComplianceStatus), nullable=False)
    compliance_evidence = Column(Text)
    policies_procedures = Column(ARRAY(String), default=list)
    
    # Risk assessment
    identified_risks = Column(JSON, default=dict)
    mitigation_measures = Column(JSON, default=dict)
    monitoring_mechanisms = Column(JSON, default=dict)
    
    # Due diligence
    due_diligence_conducted = Column(Boolean, default=False)
    due_diligence_frequency = Column(String(50))  # "annual", "biannual", "continuous"
    last_due_diligence_date = Column(DateTime)
    
    # Stakeholder engagement
    stakeholder_consultation = Column(Boolean, default=False)
    grievance_mechanism = Column(Boolean, default=False)
    
    # Relationship
    assessment = relationship("EUTaxonomyAssessment", back_populates="safeguard_compliance_records")

class CSRDReport(BaseModelWithSoftDelete, TimestampMixin):
    """Corporate Sustainability Reporting Directive (CSRD) report"""
    __tablename__ = "csrd_reports"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    assessment_id = Column(String, ForeignKey("eu_taxonomy_assessments.id"), nullable=False)
    organization_id = Column(String, nullable=False)
    
    # Report metadata
    report_title = Column(String(200), nullable=False)
    reporting_period = Column(String(4), nullable=False)  # Year format
    report_type = Column(String(50))  # "annual", "interim", "consolidated"
    
    # Report structure
    sustainability_statement = Column(JSON, default=dict)
    general_disclosures = Column(JSON, default=dict)  # ESRS 1 & 2
    environmental_disclosures = Column(JSON, default=dict)  # ESRS E1-E5
    social_disclosures = Column(JSON, default=dict)  # ESRS S1-S4
    governance_disclosures = Column(JSON, default=dict)  # ESRS G1
    
    # EU Taxonomy disclosures
    taxonomy_eligible_activities = Column(JSON, default=dict)
    taxonomy_aligned_activities = Column(JSON, default=dict)
    taxonomy_kpi_disclosures = Column(JSON, default=dict)
    
    # Report status
    draft_status = Column(String(50), default="draft")  # "draft", "review", "approved", "published"
    digital_format_compliant = Column(Boolean, default=False)
    xbrl_tagged = Column(Boolean, default=False)
    
    # Assurance information
    external_assurance_required = Column(Boolean, default=True)
    assurance_provider = Column(String(200))
    assurance_opinion = Column(String(50))
    assurance_completed_at = Column(DateTime, nullable=True)
    
    # Publication details
    published_at = Column(DateTime, nullable=True)
    publication_deadline = Column(DateTime, nullable=False)
    accessible_format = Column(Boolean, default=False)

class TaxonomyActivity(BaseModelWithSoftDelete, TimestampMixin):
    """Reference data for EU Taxonomy economic activities"""
    __tablename__ = "taxonomy_activities"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    
    # Activity identification
    nace_code = Column(String(20), nullable=False, unique=True)
    activity_name = Column(String(300), nullable=False)
    activity_description = Column(Text)
    
    # Taxonomy classification
    environmental_objectives = Column(ARRAY(SQLEnum(EnvironmentalObjective)), default=list)
    sector_classification = Column(String(100))
    transition_activity = Column(Boolean, default=False)
    enabling_activity = Column(Boolean, default=False)
    
    # Activity metrics
    common_metrics = Column(JSON, default=dict)
    sector_specific_metrics = Column(JSON, default=dict)
    
    # Reference information
    regulation_reference = Column(String(200))
    effective_date = Column(DateTime, nullable=False)
    last_updated_regulation = Column(DateTime)
    
    # Status
    is_active = Column(Boolean, default=True)

# ================================================================================
# UTILITY MODELS FOR EU TAXONOMY ENGINE
# ================================================================================

class DueDiligenceRecord(BaseModelWithSoftDelete, TimestampMixin):
    """Due diligence records for minimum safeguards"""
    __tablename__ = "due_diligence_records"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    assessment_id = Column(String, ForeignKey("eu_taxonomy_assessments.id"), nullable=False)
    
    # Due diligence scope
    scope_description = Column(Text, nullable=False)
    geographic_scope = Column(ARRAY(String), default=list)
    business_units_covered = Column(ARRAY(String), default=list)
    
    # Process details
    methodology_used = Column(String(200))
    assessment_period_start = Column(DateTime, nullable=False)
    assessment_period_end = Column(DateTime, nullable=False)
    
    # Findings
    identified_issues = Column(JSON, default=dict)
    severity_assessment = Column(JSON, default=dict)
    corrective_actions = Column(JSON, default=dict)
    
    # Follow-up
    monitoring_plan = Column(JSON, default=dict)
    next_review_date = Column(DateTime)
    
    # Responsible parties
    conducted_by = Column(String(200))
    approved_by = Column(String(200))
    external_verification = Column(Boolean, default=False)

class AlignmentCriteria(BaseModelWithSoftDelete, TimestampMixin):
    """Detailed alignment criteria lookup table"""
    __tablename__ = "alignment_criteria"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    
    # Criteria identification
    objective = Column(SQLEnum(EnvironmentalObjective), nullable=False)
    activity_code = Column(String(20), nullable=False)
    criteria_number = Column(String(10), nullable=False)
    
    # Criteria content
    criteria_text = Column(Text, nullable=False)
    metric_type = Column(String(50))  # "quantitative", "qualitative", "binary"
    threshold_value = Column(Float, nullable=True)
    threshold_unit = Column(String(50), nullable=True)
    
    # Guidance
    interpretation_guidance = Column(Text)
    evidence_requirements = Column(JSON, default=dict)
    calculation_methodology = Column(Text)
    
    # Regulatory reference
    regulation_annex = Column(String(50))
    regulation_section = Column(String(100))
    
    # Status and versioning
    version = Column(String(20), default="1.0")
    effective_date = Column(DateTime, nullable=False)
    superseded_date = Column(DateTime, nullable=True)
    is_current = Column(Boolean, default=True)

# ================================================================================
# INDEXES AND CONSTRAINTS
# ================================================================================

# Add database indexes for performance
from sqlalchemy import Index

# Create indexes for common query patterns
Index('idx_eu_taxonomy_user_period', EUTaxonomyAssessment.user_id, EUTaxonomyAssessment.reporting_period)
Index('idx_technical_criteria_assessment', TechnicalScreeningCriteria.assessment_id, TechnicalScreeningCriteria.environmental_objective)
Index('idx_esrs_compliance_standard', ESRSCompliance.assessment_id, ESRSCompliance.standard)
Index('idx_double_materiality_topic', DoubleMaturityAssessment.assessment_id, DoubleMaturityAssessment.topic)
Index('idx_safeguard_principle', SafeguardCompliance.assessment_id, SafeguardCompliance.safeguard_principle)