#!/usr/bin/env python3
"""
AUREX LAUNCHPAD™ GHG EMISSIONS & CARBON CREDITS MODELS
VIBE Framework Implementation - Intelligence & Balance
Comprehensive greenhouse gas tracking and carbon credit management
"""

from sqlalchemy import Column, String, Text, DateTime, ForeignKey, Enum, Float, Integer, JSON, Boolean, Table, CheckConstraint
from sqlalchemy.orm import relationship
from sqlalchemy.dialects.postgresql import UUID
from datetime import datetime
import enum
import uuid
from .base_models import BaseModel, TimestampMixin

# Association tables
emission_verification_documents = Table(
    'emission_verification_documents',
    BaseModel.metadata,
    Column('emission_id', UUID(as_uuid=True), ForeignKey('ghg_emissions.id'), primary_key=True),
    Column('document_id', UUID(as_uuid=True), ForeignKey('verification_documents.id'), primary_key=True)
)

carbon_project_sdgs = Table(
    'carbon_project_sdgs',
    BaseModel.metadata,
    Column('project_id', UUID(as_uuid=True), ForeignKey('carbon_projects.id'), primary_key=True),
    Column('sdg_id', UUID(as_uuid=True), ForeignKey('sdg_goals.id'), primary_key=True),
    Column('contribution_level', String(20))  # Primary, Secondary, Tertiary
)

class EmissionScope(enum.Enum):
    SCOPE_1 = "scope_1"  # Direct emissions
    SCOPE_2 = "scope_2"  # Indirect emissions from energy
    SCOPE_3 = "scope_3"  # Other indirect emissions

class EmissionSource(enum.Enum):
    # Scope 1 Sources
    STATIONARY_COMBUSTION = "stationary_combustion"
    MOBILE_COMBUSTION = "mobile_combustion"
    PROCESS_EMISSIONS = "process_emissions"
    FUGITIVE_EMISSIONS = "fugitive_emissions"
    
    # Scope 2 Sources
    PURCHASED_ELECTRICITY = "purchased_electricity"
    PURCHASED_STEAM = "purchased_steam"
    PURCHASED_HEATING = "purchased_heating"
    PURCHASED_COOLING = "purchased_cooling"
    
    # Scope 3 Sources
    PURCHASED_GOODS = "purchased_goods"
    CAPITAL_GOODS = "capital_goods"
    FUEL_ENERGY = "fuel_energy"
    UPSTREAM_TRANSPORTATION = "upstream_transportation"
    WASTE_GENERATED = "waste_generated"
    BUSINESS_TRAVEL = "business_travel"
    EMPLOYEE_COMMUTING = "employee_commuting"
    UPSTREAM_LEASED = "upstream_leased"
    DOWNSTREAM_TRANSPORTATION = "downstream_transportation"
    PRODUCT_PROCESSING = "product_processing"
    PRODUCT_USE = "product_use"
    END_OF_LIFE = "end_of_life"
    DOWNSTREAM_LEASED = "downstream_leased"
    FRANCHISES = "franchises"
    INVESTMENTS = "investments"

class GHGProtocol(enum.Enum):
    GHG_PROTOCOL = "ghg_protocol"
    ISO_14064 = "iso_14064"
    EPA_GHG = "epa_ghg"
    CDP = "cdp"
    TCFD = "tcfd"

class CarbonCreditType(enum.Enum):
    VCU = "vcu"  # Verified Carbon Unit (Verra)
    CER = "cer"  # Certified Emission Reduction (CDM)
    ERU = "eru"  # Emission Reduction Unit (JI)
    REC = "rec"  # Renewable Energy Certificate
    IREC = "irec"  # International REC
    GO = "go"  # Guarantee of Origin
    CARBON_OFFSET = "carbon_offset"
    NATURE_BASED = "nature_based"

class CreditStatus(enum.Enum):
    PENDING = "pending"
    VERIFIED = "verified"
    ISSUED = "issued"
    RETIRED = "retired"
    CANCELLED = "cancelled"
    TRANSFERRED = "transferred"

class VerificationStatus(enum.Enum):
    NOT_STARTED = "not_started"
    IN_PROGRESS = "in_progress"
    SUBMITTED = "submitted"
    UNDER_REVIEW = "under_review"
    VERIFIED = "verified"
    REJECTED = "rejected"

class GHGEmission(BaseModel, TimestampMixin):
    """Comprehensive GHG emissions tracking with VIBE intelligence"""
    __tablename__ = 'ghg_emissions'
    
    # Organization & Period
    organization_id = Column(UUID(as_uuid=True), ForeignKey('organizations.id'), nullable=False)
    reporting_period_start = Column(DateTime, nullable=False)
    reporting_period_end = Column(DateTime, nullable=False)
    
    # Emission Details
    scope = Column(Enum(EmissionScope), nullable=False)
    source = Column(Enum(EmissionSource), nullable=False)
    activity_description = Column(Text)
    
    # Location
    facility_id = Column(UUID(as_uuid=True), ForeignKey('facilities.id'))
    location = Column(String(200))
    country = Column(String(100))
    region = Column(String(100))
    
    # Activity Data
    activity_data = Column(Float, nullable=False)
    activity_unit = Column(String(50), nullable=False)  # kWh, liters, kg, miles, etc.
    data_quality_score = Column(Float)  # 0-100 quality score
    
    # Emission Factors
    emission_factor = Column(Float, nullable=False)
    emission_factor_unit = Column(String(100))  # kg CO2e/unit
    emission_factor_source = Column(String(200))  # EPA, DEFRA, etc.
    
    # Calculated Emissions
    co2_emissions = Column(Float)  # in metric tons
    ch4_emissions = Column(Float)  # in metric tons CO2e
    n2o_emissions = Column(Float)  # in metric tons CO2e
    hfc_emissions = Column(Float)  # in metric tons CO2e
    pfc_emissions = Column(Float)  # in metric tons CO2e
    sf6_emissions = Column(Float)  # in metric tons CO2e
    nf3_emissions = Column(Float)  # in metric tons CO2e
    total_co2e = Column(Float, nullable=False)  # Total in metric tons CO2e
    
    # Methodology
    calculation_methodology = Column(Enum(GHGProtocol), default=GHGProtocol.GHG_PROTOCOL)
    gwp_version = Column(String(50))  # AR4, AR5, AR6
    
    # Verification
    verification_status = Column(Enum(VerificationStatus), default=VerificationStatus.NOT_STARTED)
    verified_by = Column(String(200))
    verification_date = Column(DateTime)
    verification_certificate = Column(String(500))
    
    # Uncertainty & Notes
    uncertainty_percentage = Column(Float)
    data_gaps = Column(JSON)
    assumptions = Column(Text)
    notes = Column(Text)
    
    # VIBE Metrics
    vibe_data_completeness = Column(Float)  # 0-100
    vibe_accuracy_score = Column(Float)  # 0-100
    vibe_timeliness_score = Column(Float)  # 0-100
    
    # Reduction Targets
    baseline_emissions = Column(Float)
    target_emissions = Column(Float)
    reduction_percentage = Column(Float)
    
    # Relationships
    organization = relationship("Organization")
    facility = relationship("Facility")
    supporting_documents = relationship("VerificationDocument", secondary=emission_verification_documents)
    reduction_initiatives = relationship("EmissionReduction", back_populates="emission")

class Facility(BaseModel, TimestampMixin):
    """Facility management for emissions tracking"""
    __tablename__ = 'facilities'
    
    organization_id = Column(UUID(as_uuid=True), ForeignKey('organizations.id'), nullable=False)
    name = Column(String(200), nullable=False)
    facility_type = Column(String(100))  # Office, Manufacturing, Warehouse, etc.
    
    # Location
    address = Column(String(500))
    city = Column(String(100))
    state_province = Column(String(100))
    country = Column(String(100))
    postal_code = Column(String(20))
    latitude = Column(Float)
    longitude = Column(Float)
    
    # Characteristics
    size_sqft = Column(Float)
    employee_count = Column(Integer)
    operating_hours = Column(JSON)
    
    # Energy Profile
    primary_energy_source = Column(String(100))
    renewable_percentage = Column(Float)
    energy_intensity = Column(Float)  # kWh/sqft
    
    # Certifications
    leed_certification = Column(String(50))
    energy_star_score = Column(Integer)
    iso_14001_certified = Column(Boolean, default=False)
    
    # Emissions Profile
    annual_emissions = Column(Float)  # metric tons CO2e
    emissions_intensity = Column(Float)  # kg CO2e/sqft
    
    # Relationships
    organization = relationship("Organization")
    emissions = relationship("GHGEmission", back_populates="facility")
    energy_consumption = relationship("EnergyConsumption", back_populates="facility")

class EnergyConsumption(BaseModel, TimestampMixin):
    """Detailed energy consumption tracking"""
    __tablename__ = 'energy_consumption'
    
    facility_id = Column(UUID(as_uuid=True), ForeignKey('facilities.id'), nullable=False)
    period_start = Column(DateTime, nullable=False)
    period_end = Column(DateTime, nullable=False)
    
    # Energy Types
    electricity_kwh = Column(Float, default=0)
    natural_gas_mmbtu = Column(Float, default=0)
    fuel_oil_gallons = Column(Float, default=0)
    propane_gallons = Column(Float, default=0)
    steam_mmbtu = Column(Float, default=0)
    chilled_water_ton_hours = Column(Float, default=0)
    
    # Renewable Energy
    solar_generation_kwh = Column(Float, default=0)
    wind_generation_kwh = Column(Float, default=0)
    renewable_purchased_kwh = Column(Float, default=0)
    rec_purchased = Column(Integer, default=0)
    
    # Costs
    total_energy_cost = Column(Float)
    electricity_cost = Column(Float)
    gas_cost = Column(Float)
    
    # Metrics
    total_energy_mmbtu = Column(Float)
    energy_intensity = Column(Float)
    renewable_percentage = Column(Float)
    
    # Peak Demand
    peak_demand_kw = Column(Float)
    peak_demand_date = Column(DateTime)
    
    # Data Quality
    meter_reading = Column(Boolean, default=True)
    estimated_percentage = Column(Float, default=0)
    
    # Relationships
    facility = relationship("Facility", back_populates="energy_consumption")

class CarbonCredit(BaseModel, TimestampMixin):
    """Carbon credit inventory and retirement tracking"""
    __tablename__ = 'carbon_credits'
    
    organization_id = Column(UUID(as_uuid=True), ForeignKey('organizations.id'), nullable=False)
    project_id = Column(UUID(as_uuid=True), ForeignKey('carbon_projects.id'))
    
    # Credit Details
    credit_type = Column(Enum(CarbonCreditType), nullable=False)
    serial_number = Column(String(200), unique=True, nullable=False)
    vintage_year = Column(Integer, nullable=False)
    
    # Quantities
    quantity_issued = Column(Float, nullable=False)
    quantity_available = Column(Float, nullable=False)
    quantity_retired = Column(Float, default=0)
    quantity_cancelled = Column(Float, default=0)
    
    # Registry Information
    registry_name = Column(String(100))  # Verra, Gold Standard, etc.
    registry_id = Column(String(200))
    registry_url = Column(String(500))
    
    # Issuance
    issuance_date = Column(DateTime)
    expiry_date = Column(DateTime)
    
    # Pricing
    purchase_price = Column(Float)
    current_market_price = Column(Float)
    currency = Column(String(10), default='USD')
    
    # Status
    status = Column(Enum(CreditStatus), default=CreditStatus.PENDING)
    retirement_date = Column(DateTime)
    retirement_reason = Column(Text)
    retirement_certificate = Column(String(500))
    
    # Verification
    verification_standard = Column(String(100))
    verification_body = Column(String(200))
    verification_report = Column(String(500))
    
    # Co-benefits
    sdg_contributions = Column(JSON)  # SDG goals supported
    additional_certifications = Column(JSON)  # CCB, Social Carbon, etc.
    
    # Metadata
    tags = Column(JSON)
    notes = Column(Text)
    
    # Relationships
    organization = relationship("Organization")
    project = relationship("CarbonProject", back_populates="credits")
    transactions = relationship("CarbonTransaction", back_populates="credit")

class CarbonProject(BaseModel, TimestampMixin):
    """Carbon offset project management"""
    __tablename__ = 'carbon_projects'
    
    name = Column(String(200), nullable=False)
    project_id = Column(String(100), unique=True)  # Registry project ID
    project_type = Column(String(100))  # Reforestation, Renewable Energy, etc.
    
    # Location
    country = Column(String(100))
    region = Column(String(100))
    coordinates = Column(JSON)  # GeoJSON
    area_hectares = Column(Float)
    
    # Project Details
    description = Column(Text)
    methodology = Column(String(200))
    start_date = Column(DateTime)
    end_date = Column(DateTime)
    crediting_period_start = Column(DateTime)
    crediting_period_end = Column(DateTime)
    
    # Carbon Impact
    estimated_annual_reduction = Column(Float)  # tCO2e/year
    total_credits_issued = Column(Float)
    total_credits_retired = Column(Float)
    
    # Verification
    validation_body = Column(String(200))
    validation_date = Column(DateTime)
    verification_frequency = Column(String(50))  # Annual, Biennial, etc.
    last_verification_date = Column(DateTime)
    next_verification_date = Column(DateTime)
    
    # Standards & Certifications
    primary_standard = Column(String(100))  # VCS, Gold Standard, etc.
    additional_certifications = Column(JSON)
    
    # Co-benefits
    biodiversity_impact = Column(Text)
    community_benefits = Column(Text)
    employment_created = Column(Integer)
    
    # Risk Assessment
    permanence_risk = Column(String(50))  # Low, Medium, High
    additionality_assessment = Column(Text)
    leakage_assessment = Column(Text)
    
    # Documentation
    project_document_url = Column(String(500))
    monitoring_reports = Column(JSON)
    
    # Relationships
    credits = relationship("CarbonCredit", back_populates="project")
    sdg_goals = relationship("SDGGoal", secondary=carbon_project_sdgs)

class CarbonTransaction(BaseModel, TimestampMixin):
    """Carbon credit transaction tracking"""
    __tablename__ = 'carbon_transactions'
    
    credit_id = Column(UUID(as_uuid=True), ForeignKey('carbon_credits.id'), nullable=False)
    organization_id = Column(UUID(as_uuid=True), ForeignKey('organizations.id'), nullable=False)
    
    # Transaction Details
    transaction_type = Column(String(50))  # Purchase, Sale, Retirement, Transfer
    transaction_date = Column(DateTime, nullable=False)
    quantity = Column(Float, nullable=False)
    
    # Parties
    seller_name = Column(String(200))
    buyer_name = Column(String(200))
    broker_name = Column(String(200))
    
    # Financial
    unit_price = Column(Float)
    total_price = Column(Float)
    currency = Column(String(10))
    payment_method = Column(String(50))
    invoice_number = Column(String(100))
    
    # Purpose
    retirement_reason = Column(String(200))
    compliance_period = Column(String(50))
    offset_claim = Column(Text)
    
    # Documentation
    contract_number = Column(String(100))
    certificate_url = Column(String(500))
    
    # Relationships
    credit = relationship("CarbonCredit", back_populates="transactions")
    organization = relationship("Organization")

class EmissionReduction(BaseModel, TimestampMixin):
    """Emission reduction initiatives and tracking"""
    __tablename__ = 'emission_reductions'
    
    emission_id = Column(UUID(as_uuid=True), ForeignKey('ghg_emissions.id'))
    organization_id = Column(UUID(as_uuid=True), ForeignKey('organizations.id'), nullable=False)
    
    # Initiative Details
    initiative_name = Column(String(200), nullable=False)
    initiative_type = Column(String(100))  # Energy Efficiency, Renewable Energy, etc.
    description = Column(Text)
    
    # Timeline
    start_date = Column(DateTime)
    end_date = Column(DateTime)
    implementation_status = Column(String(50))
    
    # Reduction Estimates
    estimated_annual_reduction = Column(Float)  # tCO2e
    actual_reduction = Column(Float)
    reduction_percentage = Column(Float)
    
    # Investment
    capital_investment = Column(Float)
    operational_cost = Column(Float)
    payback_period_years = Column(Float)
    roi_percentage = Column(Float)
    
    # Verification
    measurement_methodology = Column(Text)
    verification_status = Column(String(50))
    
    # Co-benefits
    cost_savings = Column(Float)
    jobs_created = Column(Integer)
    health_benefits = Column(Text)
    
    # Relationships
    emission = relationship("GHGEmission", back_populates="reduction_initiatives")
    organization = relationship("Organization")

class VerificationDocument(BaseModel, TimestampMixin):
    """Supporting documents for emissions verification"""
    __tablename__ = 'verification_documents'
    
    name = Column(String(200), nullable=False)
    document_type = Column(String(100))  # Invoice, Meter Reading, Certificate, etc.
    
    # File Information
    file_path = Column(String(500))
    file_size = Column(Integer)
    mime_type = Column(String(100))
    
    # Document Details
    document_date = Column(DateTime)
    issuer = Column(String(200))
    reference_number = Column(String(100))
    
    # Verification
    is_verified = Column(Boolean, default=False)
    verified_by = Column(String(200))
    verification_date = Column(DateTime)
    
    # Metadata
    tags = Column(JSON)
    notes = Column(Text)

class SDGGoal(BaseModel, TimestampMixin):
    """UN Sustainable Development Goals reference"""
    __tablename__ = 'sdg_goals'
    
    goal_number = Column(Integer, unique=True, nullable=False)
    name = Column(String(200), nullable=False)
    description = Column(Text)
    icon_url = Column(String(500))
    
    # Targets
    targets = Column(JSON)  # List of targets under this goal
    indicators = Column(JSON)  # List of indicators
    
    # Relationships
    carbon_projects = relationship("CarbonProject", secondary=carbon_project_sdgs)

class EmissionFactor(BaseModel, TimestampMixin):
    """Emission factors database for calculations"""
    __tablename__ = 'emission_factors'
    
    # Identification
    name = Column(String(200), nullable=False)
    category = Column(String(100))
    subcategory = Column(String(100))
    
    # Factor Details
    activity_type = Column(String(200))
    unit = Column(String(50))
    
    # Emission Values
    co2_factor = Column(Float)
    ch4_factor = Column(Float)
    n2o_factor = Column(Float)
    co2e_factor = Column(Float, nullable=False)
    
    # Source & Validity
    source = Column(String(200))  # EPA, DEFRA, IPCC, etc.
    year = Column(Integer)
    region = Column(String(100))
    
    # Quality
    uncertainty_range = Column(String(50))
    quality_rating = Column(Integer)  # 1-5 stars
    
    # Metadata
    notes = Column(Text)
    last_updated = Column(DateTime)
    
    # Constraints
    __table_args__ = (
        CheckConstraint('co2e_factor > 0', name='positive_co2e_factor'),
    )