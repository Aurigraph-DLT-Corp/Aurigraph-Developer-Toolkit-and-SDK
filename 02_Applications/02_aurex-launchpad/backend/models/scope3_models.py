# ================================================================================
# AUREX LAUNCHPAD™ SCOPE 3 EMISSIONS MODELS
# Sub-Application #2: Comprehensive Scope 3 Emissions Data Models
# Module ID: LAU-GHG-002-SCOPE3-MODELS - Scope 3 Emissions Models
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
# SCOPE 3 ENUMS AND CONSTANTS
# ================================================================================

class Scope3CategoryType(Enum):
    """15 Scope 3 categories as defined by GHG Protocol"""
    # Upstream categories (1-8)
    PURCHASED_GOODS_SERVICES = "purchased_goods_services"           # Category 1
    CAPITAL_GOODS = "capital_goods"                                  # Category 2
    FUEL_ENERGY_ACTIVITIES = "fuel_energy_activities"              # Category 3
    UPSTREAM_TRANSPORT_DISTRIBUTION = "upstream_transport_distribution"  # Category 4
    WASTE_GENERATED = "waste_generated"                             # Category 5
    BUSINESS_TRAVEL = "business_travel"                             # Category 6
    EMPLOYEE_COMMUTING = "employee_commuting"                       # Category 7
    UPSTREAM_LEASED_ASSETS = "upstream_leased_assets"               # Category 8
    
    # Downstream categories (9-15)
    DOWNSTREAM_TRANSPORT_DISTRIBUTION = "downstream_transport_distribution"  # Category 9
    PROCESSING_SOLD_PRODUCTS = "processing_sold_products"           # Category 10
    USE_SOLD_PRODUCTS = "use_sold_products"                        # Category 11
    END_OF_LIFE_SOLD_PRODUCTS = "end_of_life_sold_products"        # Category 12
    DOWNSTREAM_LEASED_ASSETS = "downstream_leased_assets"           # Category 13
    FRANCHISES = "franchises"                                       # Category 14
    INVESTMENTS = "investments"                                     # Category 15

class DataQualityLevel(Enum):
    """Data quality levels for activity data"""
    PRIMARY = "primary"           # Direct measurement or supplier-specific data
    SECONDARY = "secondary"       # Industry average or proxy data
    TERTIARY = "tertiary"        # Estimated or spend-based data
    UNCERTAIN = "uncertain"       # Low confidence data

class CalculationMethodology(Enum):
    """Calculation methodologies for Scope 3"""
    SUPPLIER_SPECIFIC = "supplier_specific"    # Direct supplier data
    SPEND_BASED = "spend_based"               # Economic input-output models
    AVERAGE_DATA = "average_data"             # Industry averages
    HYBRID = "hybrid"                         # Combination of methods
    PHYSICAL_ACTIVITY = "physical_activity"   # Physical activity data

class SupplierDataStatus(Enum):
    """Supplier engagement and data collection status"""
    NOT_CONTACTED = "not_contacted"
    CONTACTED = "contacted"
    DATA_REQUESTED = "data_requested"
    DATA_RECEIVED = "data_received"
    DATA_VALIDATED = "data_validated"
    NON_RESPONSIVE = "non_responsive"
    DECLINED = "declined"

class AssessmentStatus(Enum):
    """Overall Scope 3 assessment status"""
    INITIATED = "initiated"
    DATA_COLLECTION = "data_collection"
    SUPPLIER_ENGAGEMENT = "supplier_engagement"
    CALCULATION = "calculation"
    CALCULATED = "calculated"
    VALIDATED = "validated"
    COMPLETED = "completed"
    REPORTED = "reported"

# ================================================================================
# CORE SCOPE 3 ASSESSMENT MODELS
# ================================================================================

class Scope3Assessment(BaseModelWithSoftDelete, TimestampMixin):
    """Main Scope 3 assessment entity"""
    __tablename__ = "scope3_assessments"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String, nullable=False, index=True)
    organization_id = Column(String, nullable=False, index=True)
    
    # Assessment metadata
    title = Column(String(200), nullable=False)
    description = Column(Text)
    reporting_year = Column(Integer, nullable=False)
    base_currency = Column(String(3), default="USD")
    
    # Assessment configuration
    assessment_boundary = Column(JSON, default=dict)
    selected_categories = Column(ARRAY(SQLEnum(Scope3CategoryType)), default=list)
    data_collection_approach = Column(String(50), default="hybrid")  # supplier_specific, spend_based, hybrid
    
    # Status tracking
    status = Column(SQLEnum(AssessmentStatus), default=AssessmentStatus.INITIATED)
    
    # Results summary
    total_scope3_emissions = Column(Float, default=0.0)
    data_quality_score = Column(Float, nullable=True)  # Overall data quality (0-100)
    calculation_confidence = Column(Float, nullable=True)  # Confidence level (0-100)
    
    # Timeline tracking
    target_completion_date = Column(DateTime, nullable=True)
    data_collection_deadline = Column(DateTime, nullable=True)
    completed_at = Column(DateTime, nullable=True)
    
    # Relationships
    activity_data = relationship("Scope3ActivityData", back_populates="assessment", cascade="all, delete-orphan")
    calculations = relationship("Scope3Calculation", back_populates="assessment", cascade="all, delete-orphan")
    supplier_engagements = relationship("SupplierEngagement", back_populates="assessment", cascade="all, delete-orphan")
    value_chain_assessments = relationship("ValueChainAssessment", back_populates="assessment", cascade="all, delete-orphan")

class Scope3ActivityData(BaseModelWithSoftDelete, TimestampMixin):
    """Activity data for Scope 3 calculations"""
    __tablename__ = "scope3_activity_data"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    assessment_id = Column(String, ForeignKey("scope3_assessments.id"), nullable=False)
    
    # Category and data identification
    category = Column(SQLEnum(Scope3CategoryType), nullable=False)
    subcategory = Column(String(100), nullable=True)  # More specific classification
    activity_description = Column(String(500), nullable=False)
    
    # Activity data
    activity_amount = Column(Float, nullable=False)
    activity_unit = Column(String(50), nullable=False)
    data_source = Column(String(200), nullable=False)
    data_quality_level = Column(SQLEnum(DataQualityLevel), nullable=False)
    
    # Calculation methodology
    calculation_methodology = Column(SQLEnum(CalculationMethodology), nullable=False)
    emission_factor_source = Column(String(100), nullable=True)
    emission_factor_value = Column(Float, nullable=True)
    emission_factor_unit = Column(String(100), nullable=True)
    
    # Supplier information (if applicable)
    supplier_specific_data = Column(Boolean, default=False)
    supplier_id = Column(String, nullable=True)
    supplier_name = Column(String(200), nullable=True)
    
    # Spend data (for spend-based calculations)
    spend_amount = Column(Float, nullable=True)
    spend_currency = Column(String(3), nullable=True)
    spend_category = Column(String(100), nullable=True)  # Procurement category
    
    # Temporal and geographical scope
    collection_period_start = Column(DateTime, nullable=False)
    collection_period_end = Column(DateTime, nullable=False)
    geographical_scope = Column(String(100), nullable=True)
    
    # Data validation
    validated = Column(Boolean, default=False)
    validation_notes = Column(Text, nullable=True)
    confidence_level = Column(Integer, nullable=True)  # 1-5 scale
    
    # Calculated emissions (result)
    calculated_emissions = Column(Float, nullable=True)  # tCO2e
    calculation_date = Column(DateTime, nullable=True)
    
    # Relationship
    assessment = relationship("Scope3Assessment", back_populates="activity_data")

class Scope3Calculation(BaseModelWithSoftDelete, TimestampMixin):
    """Scope 3 calculation results and metadata"""
    __tablename__ = "scope3_calculations"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    assessment_id = Column(String, ForeignKey("scope3_assessments.id"), nullable=False)
    
    # Calculation results
    total_scope3_emissions = Column(Float, nullable=False)  # Total tCO2e
    emissions_by_category = Column(JSON, default=dict)      # Category breakdown
    emissions_by_methodology = Column(JSON, default=dict)    # Methodology breakdown
    
    # Calculation methodology and parameters
    calculation_methodology = Column(String(100), nullable=False)
    emission_factors_source = Column(String(100), nullable=False)
    calculation_date = Column(DateTime, default=datetime.utcnow)
    
    # Data quality assessment
    data_quality_score = Column(Float, nullable=True)       # Overall score (0-100)
    data_completeness = Column(Float, nullable=True)        # Completeness (0-100%)
    data_coverage_spend = Column(Float, nullable=True)      # Spend coverage (0-100%)
    data_coverage_suppliers = Column(Float, nullable=True)   # Supplier coverage (0-100%)
    
    # Uncertainty analysis
    uncertainty_range = Column(JSON, default=dict)          # Min/max/std dev
    monte_carlo_results = Column(JSON, default=dict)        # MC simulation results
    sensitivity_analysis = Column(JSON, default=dict)       # Parameter sensitivity
    
    # Calculation metadata
    calculation_metadata = Column(JSON, default=dict)
    calculation_version = Column(String(20), default="1.0")
    
    # Biogenic emissions
    biogenic_emissions = Column(Float, default=0.0)         # Separate biogenic tCO2e
    biogenic_methodology = Column(String(100), nullable=True)
    
    # Verification status
    verified = Column(Boolean, default=False)
    verification_standard = Column(String(100), nullable=True)
    verification_date = Column(DateTime, nullable=True)
    
    # Relationship
    assessment = relationship("Scope3Assessment", back_populates="calculations")

class SupplierEngagement(BaseModelWithSoftDelete, TimestampMixin):
    """Supplier engagement tracking for Scope 3 data collection"""
    __tablename__ = "supplier_engagements"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    assessment_id = Column(String, ForeignKey("scope3_assessments.id"), nullable=False)
    
    # Supplier information
    supplier_name = Column(String(200), nullable=False)
    supplier_contact_email = Column(String(200), nullable=True)
    supplier_contact_person = Column(String(200), nullable=True)
    supplier_id_external = Column(String(100), nullable=True)  # External supplier ID
    
    # Engagement scope
    supplier_categories = Column(ARRAY(SQLEnum(Scope3CategoryType)), default=list)
    procurement_categories = Column(ARRAY(String), default=list)
    
    # Engagement status and timeline
    engagement_status = Column(SQLEnum(SupplierDataStatus), nullable=False)
    initial_contact_date = Column(DateTime, nullable=True)
    data_requested_date = Column(DateTime, nullable=False)
    data_due_date = Column(DateTime, nullable=True)
    data_received_date = Column(DateTime, nullable=True)
    
    # Spend and priority information
    annual_spend_amount = Column(Float, nullable=True)
    spend_currency = Column(String(3), default="USD")
    spend_percentage = Column(Float, nullable=True)  # % of total spend
    priority_level = Column(String(20), default="medium")  # high, medium, low
    
    # Data collection results
    data_collection_successful = Column(Boolean, default=False)
    data_quality_rating = Column(String(20), nullable=True)  # excellent, good, fair, poor
    data_coverage_percentage = Column(Float, nullable=True)  # % of requested data received
    
    # Communication tracking
    communication_log = Column(JSON, default=list)          # Communication history
    follow_up_count = Column(Integer, default=0)
    last_follow_up_date = Column(DateTime, nullable=True)
    
    # Alternative data approaches
    fallback_methodology = Column(SQLEnum(CalculationMethodology), nullable=True)
    fallback_applied = Column(Boolean, default=False)
    
    # Relationship
    assessment = relationship("Scope3Assessment", back_populates="supplier_engagements")

class ValueChainAssessment(BaseModelWithSoftDelete, TimestampMixin):
    """Value chain hotspot analysis and prioritization"""
    __tablename__ = "value_chain_assessments"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    assessment_id = Column(String, ForeignKey("scope3_assessments.id"), nullable=False)
    
    # Value chain segment
    value_chain_stage = Column(String(100), nullable=False)  # upstream, operations, downstream
    business_process = Column(String(200), nullable=False)
    
    # Hotspot analysis
    emission_contribution = Column(Float, nullable=True)     # tCO2e contribution
    emission_percentage = Column(Float, nullable=True)       # % of total Scope 3
    data_quality_score = Column(Float, nullable=True)        # Quality for this segment
    
    # Risk assessment
    climate_risk_level = Column(String(20), nullable=True)   # high, medium, low
    transition_risk = Column(Float, nullable=True)           # Financial impact score
    physical_risk = Column(Float, nullable=True)             # Physical climate risk
    
    # Reduction potential
    reduction_potential = Column(Float, nullable=True)        # Potential tCO2e reduction
    reduction_cost_curve = Column(JSON, default=dict)        # Cost vs reduction potential
    intervention_priority = Column(Integer, nullable=True)    # 1-5 priority ranking
    
    # Stakeholder influence
    influence_level = Column(String(20), nullable=True)      # high, medium, low
    control_level = Column(String(20), nullable=True)        # direct, indirect, none
    collaboration_opportunity = Column(Boolean, default=False)
    
    # Action planning
    recommended_actions = Column(JSON, default=list)
    target_reduction = Column(Float, nullable=True)          # Target reduction tCO2e
    implementation_timeline = Column(String(50), nullable=True)
    
    # Relationship
    assessment = relationship("Scope3Assessment", back_populates="value_chain_assessments")

class Scope3EmissionFactor(BaseModelWithSoftDelete, TimestampMixin):
    """Emission factors for Scope 3 calculations"""
    __tablename__ = "scope3_emission_factors"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    
    # Factor identification
    category = Column(SQLEnum(Scope3CategoryType), nullable=False)
    factor_name = Column(String(200), nullable=False)
    factor_description = Column(Text, nullable=True)
    
    # Factor values
    emission_factor = Column(Float, nullable=False)          # kgCO2e per unit
    factor_unit = Column(String(100), nullable=False)        # per USD, per kg, etc.
    uncertainty_percentage = Column(Float, nullable=True)    # ± uncertainty %
    
    # Geographical and temporal scope
    geographical_scope = Column(String(100), default="global")
    temporal_scope = Column(String(50), nullable=True)       # e.g., "2023", "2020-2023"
    reference_year = Column(Integer, nullable=True)
    
    # Source information
    data_source = Column(String(200), nullable=False)        # DEFRA, EPA, ecoinvent, etc.
    source_version = Column(String(50), nullable=True)
    publication_date = Column(DateTime, nullable=True)
    methodology_reference = Column(String(500), nullable=True)
    
    # Factor classification
    factor_type = Column(String(50), nullable=False)         # spend_based, activity_based
    industry_sector = Column(String(100), nullable=True)     # Applicable sector
    product_category = Column(String(100), nullable=True)    # Product classification
    
    # Quality and validation
    data_quality_rating = Column(String(20), nullable=True)  # high, medium, low
    peer_reviewed = Column(Boolean, default=False)
    validation_status = Column(String(50), default="draft")
    
    # Usage tracking
    usage_count = Column(Integer, default=0)
    last_used_date = Column(DateTime, nullable=True)
    
    # Status
    is_active = Column(Boolean, default=True)
    superseded_by = Column(String, nullable=True)            # ID of replacement factor

class Scope3Methodology(BaseModelWithSoftDelete, TimestampMixin):
    """Methodologies and guidance for Scope 3 calculations"""
    __tablename__ = "scope3_methodologies"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    
    # Methodology identification
    category = Column(SQLEnum(Scope3CategoryType), nullable=False)
    methodology_name = Column(String(200), nullable=False)
    methodology_type = Column(SQLEnum(CalculationMethodology), nullable=False)
    
    # Methodology details
    description = Column(Text, nullable=False)
    calculation_steps = Column(JSON, default=list)
    data_requirements = Column(JSON, default=list)
    
    # Applicability
    industry_sectors = Column(ARRAY(String), default=list)
    organization_types = Column(ARRAY(String), default=list)
    geographical_regions = Column(ARRAY(String), default=list)
    
    # Quality and accuracy
    data_quality_requirements = Column(JSON, default=dict)
    accuracy_level = Column(String(20), nullable=True)       # high, medium, low
    uncertainty_factors = Column(JSON, default=dict)
    
    # Implementation guidance
    implementation_guidance = Column(Text, nullable=True)
    common_pitfalls = Column(JSON, default=list)
    best_practices = Column(JSON, default=list)
    
    # Standards alignment
    ghg_protocol_alignment = Column(Boolean, default=True)
    iso_14064_alignment = Column(Boolean, default=False)
    other_standards = Column(ARRAY(String), default=list)
    
    # Version control
    version = Column(String(20), default="1.0")
    publication_date = Column(DateTime, default=datetime.utcnow)
    review_date = Column(DateTime, nullable=True)
    
    # Usage and validation
    validation_case_studies = Column(JSON, default=list)
    user_feedback = Column(JSON, default=dict)
    is_recommended = Column(Boolean, default=True)

# ================================================================================
# INDEXES AND CONSTRAINTS
# ================================================================================

# Add database indexes for performance
from sqlalchemy import Index

# Create indexes for common query patterns
Index('idx_scope3_assessment_user_year', Scope3Assessment.user_id, Scope3Assessment.reporting_year)
Index('idx_scope3_activity_assessment_category', Scope3ActivityData.assessment_id, Scope3ActivityData.category)
Index('idx_supplier_engagement_status', SupplierEngagement.assessment_id, SupplierEngagement.engagement_status)
Index('idx_scope3_calculation_assessment', Scope3Calculation.assessment_id, Scope3Calculation.calculation_date)
Index('idx_emission_factor_category_type', Scope3EmissionFactor.category, Scope3EmissionFactor.factor_type)