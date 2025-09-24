"""
Project Registration Database Models
Module 1: AWD Project Setup and Configuration
"""

from sqlalchemy import Column, Integer, String, Float, DateTime, Text, Enum, ForeignKey, Boolean
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import relationship
from sqlalchemy.dialects.postgresql import UUID, JSONB
from datetime import datetime
import uuid
import enum

Base = declarative_base()


class ProjectStatus(enum.Enum):
    DRAFT = "draft"
    PENDING_APPROVAL = "pending_approval"
    APPROVED = "approved"
    ACTIVE = "active"
    COMPLETED = "completed"
    CANCELLED = "cancelled"


class MethodologyType(enum.Enum):
    VERRA_VM0042 = "verra_vm0042"
    GOLD_STANDARD = "gold_standard"
    VMD0051 = "vmd0051"
    CUSTOM = "custom"


class Project(Base):
    """Main projects table for AWD project registration"""
    __tablename__ = "projects"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    project_id = Column(String(50), unique=True, nullable=False, index=True)  # Human-readable ID like AWD-MH-2025-001
    name = Column(String(255), nullable=False)
    description = Column(Text)
    
    # Geographic Information
    state = Column(String(100), nullable=False)
    districts = Column(JSONB)  # Array of district names
    
    # Project Targets
    acreage_target = Column(Float, nullable=False)  # Target hectares under AWD
    farmer_target = Column(Integer, nullable=False)  # Target number of farmers
    
    # Methodology and Standards
    methodology_type = Column(Enum(MethodologyType), nullable=False)
    methodology_version = Column(String(20), nullable=False)
    
    # VVB Assignment
    vvb_id = Column(UUID(as_uuid=True), ForeignKey('verification_bodies.id'))
    
    # Project Timeline
    start_date = Column(DateTime, nullable=False)
    end_date = Column(DateTime, nullable=False)
    season = Column(String(50))  # Kharif, Rabi, etc.
    
    # Status and Approval
    status = Column(Enum(ProjectStatus), default=ProjectStatus.DRAFT)
    approval_level = Column(Integer, default=0)  # 0=Draft, 1=PM, 2=Business Owner, 3=Super Admin
    
    # Audit Trail
    created_by = Column(UUID(as_uuid=True), ForeignKey('users.id'), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_by = Column(UUID(as_uuid=True), ForeignKey('users.id'))
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    approved_by = Column(UUID(as_uuid=True), ForeignKey('users.id'))
    approved_at = Column(DateTime)
    
    # Relationships
    regions = relationship("ProjectRegion", back_populates="project", cascade="all, delete-orphan")
    methodologies = relationship("ProjectMethodology", back_populates="project", cascade="all, delete-orphan")
    approvals = relationship("ProjectApproval", back_populates="project", cascade="all, delete-orphan")
    vvb = relationship("VerificationBody", back_populates="projects")
    created_by_user = relationship("User", foreign_keys=[created_by])


class ProjectRegion(Base):
    """Detailed regional breakdown for projects"""
    __tablename__ = "project_regions"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    project_id = Column(UUID(as_uuid=True), ForeignKey('projects.id'), nullable=False)
    
    state = Column(String(100), nullable=False)
    district = Column(String(100), nullable=False)
    tehsil = Column(String(100))
    village = Column(String(100))
    
    # Geographic coordinates for region boundary
    boundary_coordinates = Column(JSONB)  # GeoJSON polygon
    estimated_area = Column(Float)  # Estimated hectares in this region
    
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    project = relationship("Project", back_populates="regions")


class ProjectMethodology(Base):
    """Methodology-specific parameters and configurations"""
    __tablename__ = "project_methodologies"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    project_id = Column(UUID(as_uuid=True), ForeignKey('projects.id'), nullable=False)
    
    methodology_type = Column(Enum(MethodologyType), nullable=False)
    version = Column(String(20), nullable=False)
    
    # Methodology-specific parameters (stored as JSON)
    parameters = Column(JSONB)
    
    # Emission factors and calculation parameters
    ch4_emission_factor = Column(Float)
    n2o_emission_factor = Column(Float)
    baseline_emission_factor = Column(Float)
    
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    project = relationship("Project", back_populates="methodologies")


class ProjectApproval(Base):
    """Multi-level approval workflow tracking"""
    __tablename__ = "project_approvals"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    project_id = Column(UUID(as_uuid=True), ForeignKey('projects.id'), nullable=False)
    
    approval_level = Column(Integer, nullable=False)  # 1=PM, 2=Business Owner, 3=Super Admin
    approved_by = Column(UUID(as_uuid=True), ForeignKey('users.id'), nullable=False)
    approved_at = Column(DateTime, default=datetime.utcnow)
    
    status = Column(String(20), nullable=False)  # approved, rejected, pending
    comments = Column(Text)
    
    # Approval metadata
    approval_data = Column(JSONB)  # Any additional approval-specific data
    
    # Relationships
    project = relationship("Project", back_populates="approvals")
    approved_by_user = relationship("User")


class VerificationBody(Base):
    """VVB (Validation and Verification Body) registry"""
    __tablename__ = "verification_bodies"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String(255), nullable=False)
    organization = Column(String(255), nullable=False)
    
    # Contact Information
    email = Column(String(255))
    phone = Column(String(50))
    address = Column(Text)
    
    # Accreditation
    accreditation_body = Column(String(255))  # e.g., "Verra", "Gold Standard"
    accreditation_number = Column(String(100))
    accreditation_valid_until = Column(DateTime)
    
    # Specialization
    methodologies_supported = Column(JSONB)  # Array of methodology types
    regions_covered = Column(JSONB)  # Array of states/regions
    
    # Status
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    projects = relationship("Project", back_populates="vvb")


class ProjectValidation(Base):
    """Project validation rules and checks"""
    __tablename__ = "project_validations"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    project_id = Column(UUID(as_uuid=True), ForeignKey('projects.id'), nullable=False)
    
    validation_type = Column(String(100), nullable=False)  # region, acreage, farmers, methodology
    validation_rule = Column(String(255), nullable=False)
    validation_status = Column(String(20), default="pending")  # passed, failed, pending
    validation_message = Column(Text)
    
    validated_by = Column(UUID(as_uuid=True), ForeignKey('users.id'))
    validated_at = Column(DateTime)
    
    created_at = Column(DateTime, default=datetime.utcnow)


# Indexes for performance optimization
from sqlalchemy import Index

# Create indexes for frequently queried columns
Index('idx_projects_status_created', Project.status, Project.created_at)
Index('idx_projects_state_status', Project.state, Project.status)
Index('idx_projects_created_by', Project.created_by)
Index('idx_project_regions_location', ProjectRegion.state, ProjectRegion.district)
Index('idx_project_approvals_level', ProjectApproval.project_id, ProjectApproval.approval_level)