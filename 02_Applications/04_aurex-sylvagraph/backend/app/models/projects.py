"""
Aurex Sylvagraph - Agroforestry Project Models
PostGIS-enabled geospatial models for agroforestry project management
"""

from enum import Enum
from decimal import Decimal
from datetime import datetime
from typing import Optional, List, Dict, Any
from sqlalchemy import String, Integer, Float, Boolean, Text, JSON, ForeignKey, DECIMAL, DateTime
from sqlalchemy.orm import Mapped, mapped_column, relationship
from geoalchemy2 import Geometry
from .base import Base, UUIDMixin, TimestampMixin, SoftDeleteMixin, AuditMixin, GeospatialMixin, IPFSMixin


class ProjectStatus(str, Enum):
    """Agroforestry project lifecycle status"""
    DRAFT = "draft"
    UNDER_REVIEW = "under_review"
    APPROVED = "approved"
    ACTIVE = "active"
    MONITORING = "monitoring"
    COMPLETED = "completed"
    SUSPENDED = "suspended"
    CANCELLED = "cancelled"


class Methodology(str, Enum):
    """Carbon credit methodologies"""
    VERRA_VCS = "verra_vcs"
    GOLD_STANDARD = "gold_standard"
    ART_TREES = "art_trees"
    ISO_14064_2 = "iso_14064_2"
    PLAN_VIVO = "plan_vivo"


class ProjectType(str, Enum):
    """Types of agroforestry projects"""
    REFORESTATION = "reforestation"
    AFFORESTATION = "afforestation"
    AGROFORESTRY = "agroforestry"
    FOREST_RESTORATION = "forest_restoration"
    AVOIDED_DEFORESTATION = "avoided_deforestation"
    SILVOPASTURE = "silvopasture"
    URBAN_FORESTRY = "urban_forestry"


class AgroforestryProject(Base, UUIDMixin, TimestampMixin, SoftDeleteMixin, AuditMixin, GeospatialMixin, IPFSMixin):
    """Main agroforestry project model with comprehensive tracking"""
    
    __tablename__ = "agroforestry_projects"
    
    # Basic project information
    name: Mapped[str] = mapped_column(String(300), nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=False)
    project_type: Mapped[ProjectType] = mapped_column(String(50), nullable=False)
    status: Mapped[ProjectStatus] = mapped_column(String(50), default=ProjectStatus.DRAFT)
    
    # Project identification
    project_code: Mapped[str] = mapped_column(String(50), unique=True, nullable=False)
    external_id: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    
    # Location and geographical data
    country: Mapped[str] = mapped_column(String(100), nullable=False)
    state_province: Mapped[str] = mapped_column(String(100), nullable=False)
    municipality: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    address: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    
    # Project area and boundaries (using PostGIS)
    total_area_hectares: Mapped[float] = mapped_column(Float, nullable=False)
    planted_area_hectares: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    
    # Boundary stored as PostGIS MultiPolygon (inherits from GeospatialMixin)
    elevation_min: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    elevation_max: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    
    # Project timeline
    start_date: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    end_date: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    planting_start_date: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    first_monitoring_date: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    
    # Carbon methodology and compliance
    methodology: Mapped[Methodology] = mapped_column(String(50), nullable=False)
    methodology_version: Mapped[Optional[str]] = mapped_column(String(20), nullable=True)
    crediting_period_years: Mapped[int] = mapped_column(Integer, default=20)
    
    # Carbon estimates and targets
    baseline_carbon_stock: Mapped[Optional[Decimal]] = mapped_column(DECIMAL(15, 4), nullable=True)
    estimated_annual_sequestration: Mapped[Optional[Decimal]] = mapped_column(DECIMAL(15, 4), nullable=True)
    total_estimated_credits: Mapped[Optional[Decimal]] = mapped_column(DECIMAL(15, 4), nullable=True)
    
    # Biodiversity and co-benefits
    biodiversity_score: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    ecosystem_services: Mapped[Optional[Dict[str, Any]]] = mapped_column(JSON, nullable=True)
    sdg_contributions: Mapped[Optional[List[int]]] = mapped_column(JSON, nullable=True)  # UN SDG numbers
    
    # Project participants and ownership
    owner_id: Mapped[str] = mapped_column(String(36), ForeignKey("users.id"), nullable=False)
    manager_id: Mapped[Optional[str]] = mapped_column(String(36), ForeignKey("users.id"), nullable=True)
    organization_id: Mapped[Optional[str]] = mapped_column(String(36), ForeignKey("organizations.id"), nullable=True)
    
    # Financial structure
    total_budget: Mapped[Optional[Decimal]] = mapped_column(DECIMAL(15, 2), nullable=True)
    currency: Mapped[Optional[str]] = mapped_column(String(3), default="USD")  # ISO currency codes
    farmer_benefit_percentage: Mapped[float] = mapped_column(Float, default=60.0)  # % of credit sales to farmers
    partner_benefit_percentage: Mapped[float] = mapped_column(Float, default=40.0)
    
    # Compliance and verification
    pdd_status: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)  # draft, submitted, approved
    validation_status: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    verification_status: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    vvb_id: Mapped[Optional[str]] = mapped_column(String(36), ForeignKey("organizations.id"), nullable=True)
    
    # Registry integration
    registry_project_id: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    registry_url: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    
    # Additional metadata
    monitoring_frequency: Mapped[Optional[str]] = mapped_column(String(50), default="quarterly")
    risk_assessment: Mapped[Optional[Dict[str, Any]]] = mapped_column(JSON, nullable=True)
    stakeholder_engagement: Mapped[Optional[Dict[str, Any]]] = mapped_column(JSON, nullable=True)
    
    # Relationships
    owner: Mapped["User"] = relationship(
        "User",
        foreign_keys=[owner_id],
        back_populates="owned_projects"
    )
    
    manager: Mapped[Optional["User"]] = relationship(
        "User", 
        foreign_keys=[manager_id],
        back_populates="managed_projects"
    )
    
    organization: Mapped[Optional["Organization"]] = relationship(
        "Organization",
        back_populates="projects"
    )
    
    # Project components
    parcels: Mapped[List["ProjectParcel"]] = relationship(
        "ProjectParcel",
        back_populates="project",
        cascade="all, delete-orphan"
    )
    
    farmers: Mapped[List["FarmerProfile"]] = relationship(
        "FarmerProfile",
        back_populates="project",
        cascade="all, delete-orphan"
    )
    
    monitoring_sessions: Mapped[List["MonitoringSession"]] = relationship(
        "MonitoringSession",
        back_populates="project",
        cascade="all, delete-orphan"
    )
    
    credit_batches: Mapped[List["CarbonCreditBatch"]] = relationship(
        "CarbonCreditBatch",
        back_populates="project",
        cascade="all, delete-orphan"
    )
    
    def __repr__(self):
        return f"<AgroforestryProject(code='{self.project_code}', name='{self.name}')>"
    
    @property
    def progress_percentage(self) -> float:
        """Calculate project progress based on monitoring data"""
        # Implementation would calculate based on actual vs planned progress
        return 0.0  # Placeholder
    
    @property
    def current_carbon_stock(self) -> Optional[Decimal]:
        """Get latest carbon stock measurement"""
        # Implementation would query latest monitoring data
        return self.baseline_carbon_stock  # Placeholder


class ProjectParcel(Base, UUIDMixin, TimestampMixin, SoftDeleteMixin, GeospatialMixin, IPFSMixin):
    """Individual parcels within an agroforestry project"""
    
    __tablename__ = "project_parcels"
    
    project_id: Mapped[str] = mapped_column(String(36), ForeignKey("agroforestry_projects.id"), nullable=False)
    parcel_number: Mapped[str] = mapped_column(String(50), nullable=False)
    name: Mapped[Optional[str]] = mapped_column(String(200), nullable=True)
    
    # Area and location
    area_hectares: Mapped[float] = mapped_column(Float, nullable=False)
    
    # Land use and characteristics
    land_use_type: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    soil_type: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    slope_percentage: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    water_access: Mapped[Optional[bool]] = mapped_column(Boolean, nullable=True)
    
    # Planting and species information
    species_planted: Mapped[Optional[List[str]]] = mapped_column(JSON, nullable=True)
    trees_planted: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    planting_density: Mapped[Optional[float]] = mapped_column(Float, nullable=True)  # trees per hectare
    planting_date: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    
    # Farmer assignment
    farmer_id: Mapped[Optional[str]] = mapped_column(String(36), ForeignKey("farmer_profiles.id"), nullable=True)
    
    # Status and monitoring
    status: Mapped[str] = mapped_column(String(50), default="planned")
    survival_rate: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    
    # Relationships
    project: Mapped[AgroforestryProject] = relationship("AgroforestryProject", back_populates="parcels")
    farmer: Mapped[Optional["FarmerProfile"]] = relationship("FarmerProfile", back_populates="assigned_parcels")
    
    def __repr__(self):
        return f"<ProjectParcel(number='{self.parcel_number}', area='{self.area_hectares}ha')>"


class FarmerProfile(Base, UUIDMixin, TimestampMixin, SoftDeleteMixin, AuditMixin):
    """Farmer profiles for project participants"""
    
    __tablename__ = "farmer_profiles"
    
    project_id: Mapped[str] = mapped_column(String(36), ForeignKey("agroforestry_projects.id"), nullable=False)
    user_id: Mapped[Optional[str]] = mapped_column(String(36), ForeignKey("users.id"), nullable=True)
    
    # Farmer identification
    farmer_code: Mapped[str] = mapped_column(String(50), nullable=False)
    national_id: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    
    # Contact information
    first_name: Mapped[str] = mapped_column(String(100), nullable=False)
    last_name: Mapped[str] = mapped_column(String(100), nullable=False)
    phone_number: Mapped[Optional[str]] = mapped_column(String(20), nullable=True)
    email: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    
    # Address
    address: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    village: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    
    # Farming details
    total_farm_area: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    assigned_area: Mapped[float] = mapped_column(Float, nullable=False)
    farming_experience: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    
    # Financial information
    bank_account_number: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    bank_name: Mapped[Optional[str]] = mapped_column(String(200), nullable=True)
    mobile_money_account: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    crypto_wallet_address: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    
    # Benefit distribution
    benefit_share_percentage: Mapped[float] = mapped_column(Float, nullable=False)
    total_payments_received: Mapped[Decimal] = mapped_column(DECIMAL(15, 2), default=0.0)
    
    # Status and verification
    verification_status: Mapped[str] = mapped_column(String(50), default="pending")
    kyc_completed: Mapped[bool] = mapped_column(Boolean, default=False)
    training_completed: Mapped[bool] = mapped_column(Boolean, default=False)
    
    # Relationships
    project: Mapped[AgroforestryProject] = relationship("AgroforestryProject", back_populates="farmers")
    user: Mapped[Optional["User"]] = relationship("User")
    assigned_parcels: Mapped[List[ProjectParcel]] = relationship("ProjectParcel", back_populates="farmer")
    payments: Mapped[List["FarmerPayment"]] = relationship("FarmerPayment", back_populates="farmer")
    
    def __repr__(self):
        return f"<FarmerProfile(code='{self.farmer_code}', name='{self.first_name} {self.last_name}')>"
    
    @property
    def full_name(self) -> str:
        return f"{self.first_name} {self.last_name}"


class FarmerPayment(Base, UUIDMixin, TimestampMixin, AuditMixin):
    """Farmer benefit payment tracking"""
    
    __tablename__ = "farmer_payments"
    
    farmer_id: Mapped[str] = mapped_column(String(36), ForeignKey("farmer_profiles.id"), nullable=False)
    credit_batch_id: Mapped[Optional[str]] = mapped_column(String(36), ForeignKey("carbon_credit_batches.id"), nullable=True)
    
    # Payment details
    amount: Mapped[Decimal] = mapped_column(DECIMAL(15, 2), nullable=False)
    currency: Mapped[str] = mapped_column(String(3), default="USD")
    exchange_rate: Mapped[Optional[Decimal]] = mapped_column(DECIMAL(10, 6), nullable=True)
    
    # Payment method and status
    payment_method: Mapped[str] = mapped_column(String(50), nullable=False)  # crypto, bank, mobile_money
    payment_status: Mapped[str] = mapped_column(String(50), default="pending")
    transaction_hash: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    transaction_reference: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    
    # Payment processing
    processed_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    confirmation_received: Mapped[bool] = mapped_column(Boolean, default=False)
    
    # Relationships
    farmer: Mapped[FarmerProfile] = relationship("FarmerProfile", back_populates="payments")
    credit_batch: Mapped[Optional["CarbonCreditBatch"]] = relationship("CarbonCreditBatch")
    
    def __repr__(self):
        return f"<FarmerPayment(farmer='{self.farmer_id}', amount='{self.amount}')>"