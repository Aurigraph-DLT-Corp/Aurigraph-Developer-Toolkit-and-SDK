# ================================================================================
# AUREX LAUNCHPAD™ DATABASE MODELS
# SQLAlchemy ORM models for ESG assessment and sustainability management
# Ticket: LAUNCHPAD-201 - Database Schema Design (13 story points)
# Created: August 4, 2025
# Version: 1.0
# Security: Password hashing, encrypted fields, audit logging
# ================================================================================

from sqlalchemy import Column, String, Integer, Boolean, DateTime, Text, Numeric, Date, ARRAY, JSON, ForeignKey, UniqueConstraint, CheckConstraint
from sqlalchemy.dialects.postgresql import UUID, INET
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from sqlalchemy_utils import EncryptedType
from sqlalchemy_utils.types.encrypted.encrypted_type import AesEngine
from passlib.context import CryptContext
import uuid
from datetime import datetime
from typing import Optional, List, Dict, Any

# Security configuration
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
SECRET_KEY = "your-secret-key-here"  # Will be loaded from environment

Base = declarative_base()

# ================================================================================
# AUTHENTICATION & USER MANAGEMENT MODELS
# ================================================================================

class Organization(Base):
    """Organization model for multi-tenant support"""
    __tablename__ = "organizations"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String(200), nullable=False)
    slug = Column(String(100), unique=True, nullable=False)
    description = Column(Text)
    industry = Column(String(100))
    size_category = Column(String(50))  # startup, small, medium, large, enterprise
    country = Column(String(3))  # ISO 3166-1 alpha-3
    website = Column(String(500))
    logo_url = Column(String(500))
    settings = Column(JSON, default={})
    subscription_plan = Column(String(50), default='free')
    subscription_expires = Column(DateTime)
    created_at = Column(DateTime, default=func.now())
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now())
    is_active = Column(Boolean, default=True)
    
    # Relationships
    users = relationship("User", back_populates="organization")
    assessments = relationship("Assessment", back_populates="organization")
    emission_sources = relationship("EmissionSource", back_populates="organization")
    emissions_data = relationship("EmissionData", back_populates="organization")
    projects = relationship("Project", back_populates="organization")
    reports = relationship("Report", back_populates="organization")

class User(Base):
    """User model with comprehensive authentication support"""
    __tablename__ = "users"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    email = Column(String(255), unique=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    first_name = Column(String(100), nullable=False)
    last_name = Column(String(100), nullable=False)
    organization_id = Column(UUID(as_uuid=True), ForeignKey('organizations.id'))
    email_verified = Column(Boolean, default=False)
    email_verification_token = Column(String(255))
    email_verification_expires = Column(DateTime)
    password_reset_token = Column(String(255))
    password_reset_expires = Column(DateTime)
    created_at = Column(DateTime, default=func.now())
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now())
    last_login = Column(DateTime)
    is_active = Column(Boolean, default=True)
    mfa_enabled = Column(Boolean, default=False)
    mfa_secret = Column(EncryptedType(String, SECRET_KEY, AesEngine, 'pkcs5'))
    profile_picture_url = Column(String(500))
    timezone = Column(String(50), default='UTC')
    language = Column(String(10), default='en')
    
    # Relationships
    organization = relationship("Organization", back_populates="users")
    user_roles = relationship("UserRole", back_populates="user")
    refresh_tokens = relationship("RefreshToken", back_populates="user")
    assessments = relationship("Assessment", back_populates="user")
    emissions_data = relationship("EmissionData", back_populates="user")
    projects_owned = relationship("Project", back_populates="owner")
    project_memberships = relationship("ProjectMember", back_populates="user")
    reports_generated = relationship("Report", back_populates="generated_by_user")
    audit_logs = relationship("AuditLog", back_populates="user")
    
    # Constraints
    __table_args__ = (
        CheckConstraint("email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,}$'", name='valid_email'),
    )
    
    def set_password(self, password: str) -> None:
        """Hash and set password"""
        self.password_hash = pwd_context.hash(password)
    
    def verify_password(self, password: str) -> bool:
        """Verify password against hash"""
        return pwd_context.verify(password, self.password_hash)
    
    @property
    def full_name(self) -> str:
        """Get user's full name"""
        return f"{self.first_name} {self.last_name}"
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert user to dictionary (excluding sensitive fields)"""
        return {
            'id': str(self.id),
            'email': self.email,
            'first_name': self.first_name,
            'last_name': self.last_name,
            'full_name': self.full_name,
            'organization_id': str(self.organization_id) if self.organization_id else None,
            'email_verified': self.email_verified,
            'is_active': self.is_active,
            'mfa_enabled': self.mfa_enabled,
            'timezone': self.timezone,
            'language': self.language,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'last_login': self.last_login.isoformat() if self.last_login else None
        }

class Role(Base):
    """Role model for RBAC"""
    __tablename__ = "roles"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String(100), unique=True, nullable=False)
    description = Column(Text)
    is_system_role = Column(Boolean, default=False)
    permissions = Column(JSON, default=[])  # Array of permission strings
    created_at = Column(DateTime, default=func.now())
    
    # Relationships
    user_roles = relationship("UserRole", back_populates="role")

class UserRole(Base):
    """User role association with organization context"""
    __tablename__ = "user_roles"
    
    user_id = Column(UUID(as_uuid=True), ForeignKey('users.id'), primary_key=True)
    role_id = Column(UUID(as_uuid=True), ForeignKey('roles.id'), primary_key=True)
    organization_id = Column(UUID(as_uuid=True), ForeignKey('organizations.id'), primary_key=True)
    assigned_at = Column(DateTime, default=func.now())
    assigned_by = Column(UUID(as_uuid=True), ForeignKey('users.id'))
    
    # Relationships
    user = relationship("User", back_populates="user_roles")
    role = relationship("Role", back_populates="user_roles")
    assigned_by_user = relationship("User", foreign_keys=[assigned_by])

class RefreshToken(Base):
    """Refresh token model for JWT authentication"""
    __tablename__ = "refresh_tokens"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey('users.id'), nullable=False)
    token_hash = Column(String(255), unique=True, nullable=False)
    expires_at = Column(DateTime, nullable=False)
    created_at = Column(DateTime, default=func.now())
    revoked_at = Column(DateTime)
    user_agent = Column(Text)
    ip_address = Column(INET)
    
    # Relationships
    user = relationship("User", back_populates="refresh_tokens")

# ================================================================================
# ESG ASSESSMENT FRAMEWORK MODELS
# ================================================================================

class AssessmentFramework(Base):
    """ESG assessment frameworks (GRI, SASB, TCFD, CDP, ISO 14064)"""
    __tablename__ = "assessment_frameworks"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String(100), nullable=False)  # GRI, SASB, TCFD, CDP, ISO14064
    version = Column(String(20), nullable=False)  # e.g., "2021", "v2.1"
    description = Column(Text)
    category = Column(String(50))  # environmental, social, governance, integrated
    is_active = Column(Boolean, default=True)
    extra_data = Column(JSON, default={})
    created_at = Column(DateTime, default=func.now())
    
    # Relationships
    templates = relationship("AssessmentTemplate", back_populates="framework")

class AssessmentTemplate(Base):
    """Assessment templates for each framework"""
    __tablename__ = "assessment_templates"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    framework_id = Column(UUID(as_uuid=True), ForeignKey('assessment_frameworks.id'), nullable=False)
    name = Column(String(200), nullable=False)
    description = Column(Text)
    template_structure = Column(JSON, nullable=False)  # Questions, sections, scoring logic
    scoring_methodology = Column(JSON)
    industry_specific = Column(Boolean, default=False)
    target_industries = Column(ARRAY(String))  # Array for multi-industry templates
    estimated_completion_time = Column(Integer)  # minutes
    created_at = Column(DateTime, default=func.now())
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now())
    version = Column(Integer, default=1)
    
    # Relationships
    framework = relationship("AssessmentFramework", back_populates="templates")
    assessments = relationship("Assessment", back_populates="template")

class Assessment(Base):
    """User assessments"""
    __tablename__ = "assessments"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey('users.id'), nullable=False)
    organization_id = Column(UUID(as_uuid=True), ForeignKey('organizations.id'), nullable=False)
    template_id = Column(UUID(as_uuid=True), ForeignKey('assessment_templates.id'), nullable=False)
    name = Column(String(200), nullable=False)
    description = Column(Text)
    status = Column(String(50), default='draft')  # draft, in_progress, completed, published, archived
    progress_percentage = Column(Numeric(5, 2), default=0.00)
    overall_score = Column(Numeric(5, 2))
    responses = Column(JSON, default={})  # User responses to questions
    calculations = Column(JSON, default={})  # Calculated scores and metrics
    started_at = Column(DateTime)
    completed_at = Column(DateTime)
    published_at = Column(DateTime)
    due_date = Column(DateTime)
    created_at = Column(DateTime, default=func.now())
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now())
    assessment_year = Column(Integer)
    reporting_period_start = Column(Date)
    reporting_period_end = Column(Date)
    
    # Relationships
    user = relationship("User", back_populates="assessments")
    organization = relationship("Organization", back_populates="assessments")
    template = relationship("AssessmentTemplate", back_populates="assessments")
    sections = relationship("AssessmentSection", back_populates="assessment")

class AssessmentSection(Base):
    """Assessment sections for detailed tracking"""
    __tablename__ = "assessment_sections"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    assessment_id = Column(UUID(as_uuid=True), ForeignKey('assessments.id'), nullable=False)
    section_name = Column(String(200), nullable=False)
    section_order = Column(Integer, nullable=False)
    section_score = Column(Numeric(5, 2))
    responses = Column(JSON, default={})
    is_completed = Column(Boolean, default=False)
    completed_at = Column(DateTime)
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now())
    
    # Relationships
    assessment = relationship("Assessment", back_populates="sections")

# ================================================================================
# GHG EMISSIONS TRACKING MODELS
# ================================================================================

class EmissionFactor(Base):
    """Emission factors database"""
    __tablename__ = "emission_factors"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    source = Column(String(100), nullable=False)  # EPA, DEFRA, IEA, etc.
    category = Column(String(100), nullable=False)  # electricity, transport, fuel, etc.
    subcategory = Column(String(100))
    description = Column(Text)
    factor_value = Column(Numeric(15, 6), nullable=False)  # CO2e per unit
    unit = Column(String(50), nullable=False)  # kWh, liters, km, etc.
    co2_factor = Column(Numeric(15, 6))
    ch4_factor = Column(Numeric(15, 6))
    n2o_factor = Column(Numeric(15, 6))
    region = Column(String(100))  # Global, US, UK, etc.
    year = Column(Integer, nullable=False)
    is_active = Column(Boolean, default=True)
    extra_data = Column(JSON, default={})
    created_at = Column(DateTime, default=func.now())

class EmissionSource(Base):
    """Emission sources (facilities, vehicles, etc.)"""
    __tablename__ = "emission_sources"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    organization_id = Column(UUID(as_uuid=True), ForeignKey('organizations.id'), nullable=False)
    name = Column(String(200), nullable=False)
    source_type = Column(String(50), nullable=False)  # facility, vehicle, equipment, supplier
    category = Column(String(50), nullable=False)  # scope1, scope2, scope3
    subcategory = Column(String(100))  # electricity, heating, transport, etc.
    description = Column(Text)
    location_address = Column(Text)
    location_coordinates = Column(Text)  # Store as latitude,longitude string
    is_active = Column(Boolean, default=True)
    extra_data = Column(JSON, default={})
    created_at = Column(DateTime, default=func.now())
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now())
    
    # Relationships
    organization = relationship("Organization", back_populates="emission_sources")
    emissions_data = relationship("EmissionData", back_populates="source")

class EmissionData(Base):
    """Emission data entries"""
    __tablename__ = "emissions_data"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    organization_id = Column(UUID(as_uuid=True), ForeignKey('organizations.id'), nullable=False)
    source_id = Column(UUID(as_uuid=True), ForeignKey('emission_sources.id'), nullable=False)
    user_id = Column(UUID(as_uuid=True), ForeignKey('users.id'), nullable=False)
    activity_type = Column(String(100), nullable=False)  # electricity_consumption, fuel_use, etc.
    activity_amount = Column(Numeric(15, 6), nullable=False)
    activity_unit = Column(String(50), nullable=False)
    emission_factor_id = Column(UUID(as_uuid=True), ForeignKey('emission_factors.id'))
    co2_emissions = Column(Numeric(15, 6))  # tons CO2e
    ch4_emissions = Column(Numeric(15, 6))
    n2o_emissions = Column(Numeric(15, 6))
    total_emissions = Column(Numeric(15, 6), nullable=False)  # tons CO2e
    reporting_period_start = Column(Date, nullable=False)
    reporting_period_end = Column(Date, nullable=False)
    data_quality_score = Column(Integer)
    verification_status = Column(String(50), default='unverified')
    verified_by = Column(UUID(as_uuid=True), ForeignKey('users.id'))
    verified_at = Column(DateTime)
    evidence_urls = Column(ARRAY(String))
    notes = Column(Text)
    created_at = Column(DateTime, default=func.now())
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now())
    
    # Relationships
    organization = relationship("Organization", back_populates="emissions_data")
    source = relationship("EmissionSource", back_populates="emissions_data")
    user = relationship("User", back_populates="emissions_data")
    emission_factor = relationship("EmissionFactor")
    verified_by_user = relationship("User", foreign_keys=[verified_by])
    
    # Constraints
    __table_args__ = (
        CheckConstraint("data_quality_score BETWEEN 1 AND 5", name='valid_quality_score'),
    )

# ================================================================================
# PROJECT MANAGEMENT MODELS
# ================================================================================

class Project(Base):
    """Sustainability projects"""
    __tablename__ = "projects"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    organization_id = Column(UUID(as_uuid=True), ForeignKey('organizations.id'), nullable=False)
    owner_id = Column(UUID(as_uuid=True), ForeignKey('users.id'), nullable=False)
    name = Column(String(200), nullable=False)
    description = Column(Text)
    project_type = Column(String(100))  # carbon_reduction, renewable_energy, waste_reduction, etc.
    status = Column(String(50), default='planning')  # planning, active, on_hold, completed, cancelled
    priority = Column(String(20), default='medium')  # low, medium, high, critical
    start_date = Column(Date)
    end_date = Column(Date)
    actual_end_date = Column(Date)
    budget_allocated = Column(Numeric(15, 2))
    budget_spent = Column(Numeric(15, 2))
    progress_percentage = Column(Numeric(5, 2), default=0.00)
    expected_emission_reduction = Column(Numeric(15, 6))  # tons CO2e
    actual_emission_reduction = Column(Numeric(15, 6))
    roi_calculation = Column(JSON)
    tags = Column(ARRAY(String))
    created_at = Column(DateTime, default=func.now())
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now())
    
    # Relationships
    organization = relationship("Organization", back_populates="projects")
    owner = relationship("User", back_populates="projects_owned")
    members = relationship("ProjectMember", back_populates="project")
    milestones = relationship("ProjectMilestone", back_populates="project")

class ProjectMember(Base):
    """Project team members"""
    __tablename__ = "project_members"
    
    project_id = Column(UUID(as_uuid=True), ForeignKey('projects.id'), primary_key=True)
    user_id = Column(UUID(as_uuid=True), ForeignKey('users.id'), primary_key=True)
    role = Column(String(100), nullable=False)  # manager, contributor, reviewer
    assigned_at = Column(DateTime, default=func.now())
    assigned_by = Column(UUID(as_uuid=True), ForeignKey('users.id'))
    
    # Relationships
    project = relationship("Project", back_populates="members")
    user = relationship("User", back_populates="project_memberships")
    assigned_by_user = relationship("User", foreign_keys=[assigned_by])

class ProjectMilestone(Base):
    """Project milestones"""
    __tablename__ = "project_milestones"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    project_id = Column(UUID(as_uuid=True), ForeignKey('projects.id'), nullable=False)
    name = Column(String(200), nullable=False)
    description = Column(Text)
    due_date = Column(Date)
    completed_at = Column(DateTime)
    is_completed = Column(Boolean, default=False)
    completion_percentage = Column(Numeric(5, 2), default=0.00)
    deliverables = Column(ARRAY(String))
    created_at = Column(DateTime, default=func.now())
    
    # Relationships
    project = relationship("Project", back_populates="milestones")

# ================================================================================
# REPORTING & COMPLIANCE MODELS
# ================================================================================

class ReportTemplate(Base):
    """Report templates"""
    __tablename__ = "report_templates"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String(200), nullable=False)
    description = Column(Text)
    report_type = Column(String(100))  # annual_report, sustainability_report, carbon_footprint, etc.
    framework = Column(String(100))  # GRI, SASB, TCFD, CDP
    template_structure = Column(JSON, nullable=False)
    output_format = Column(String(20), default='pdf')  # pdf, excel, html
    is_public = Column(Boolean, default=False)
    created_by = Column(UUID(as_uuid=True), ForeignKey('users.id'))
    created_at = Column(DateTime, default=func.now())
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now())
    
    # Relationships
    created_by_user = relationship("User")
    reports = relationship("Report", back_populates="template")

class Report(Base):
    """Generated reports"""
    __tablename__ = "reports"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    organization_id = Column(UUID(as_uuid=True), ForeignKey('organizations.id'), nullable=False)
    template_id = Column(UUID(as_uuid=True), ForeignKey('report_templates.id'), nullable=False)
    generated_by = Column(UUID(as_uuid=True), ForeignKey('users.id'), nullable=False)
    name = Column(String(200), nullable=False)
    description = Column(Text)
    report_data = Column(JSON, nullable=False)
    file_url = Column(String(500))
    file_size = Column(Integer)
    generation_status = Column(String(50), default='pending')  # pending, generating, completed, failed
    reporting_period_start = Column(Date)
    reporting_period_end = Column(Date)
    generated_at = Column(DateTime, default=func.now())
    shared_publicly = Column(Boolean, default=False)
    download_count = Column(Integer, default=0)
    
    # Relationships
    organization = relationship("Organization", back_populates="reports")
    template = relationship("ReportTemplate", back_populates="reports")
    generated_by_user = relationship("User", back_populates="reports_generated")

# ================================================================================
# AUDIT & SYSTEM MODELS
# ================================================================================

class AuditLog(Base):
    """Comprehensive audit log"""
    __tablename__ = "audit_log"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey('users.id'))
    organization_id = Column(UUID(as_uuid=True), ForeignKey('organizations.id'))
    table_name = Column(String(100), nullable=False)
    record_id = Column(UUID(as_uuid=True))
    action = Column(String(50), nullable=False)  # CREATE, UPDATE, DELETE, LOGIN, LOGOUT, etc.
    old_values = Column(JSON)
    new_values = Column(JSON)
    ip_address = Column(INET)
    user_agent = Column(Text)
    session_id = Column(String(255))
    severity = Column(String(20), default='info')  # debug, info, warning, error, critical
    description = Column(Text)
    extra_data = Column(JSON, default={})
    created_at = Column(DateTime, default=func.now())
    
    # Relationships
    user = relationship("User", back_populates="audit_logs")

class SystemSetting(Base):
    """System settings"""
    __tablename__ = "system_settings"
    
    key = Column(String(100), primary_key=True)
    value = Column(JSON, nullable=False)
    description = Column(Text)
    is_public = Column(Boolean, default=False)
    updated_by = Column(UUID(as_uuid=True), ForeignKey('users.id'))
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now())
    
    # Relationships
    updated_by_user = relationship("User")

# ================================================================================
# DATABASE UTILITIES
# ================================================================================

def create_all_tables(engine):
    """Create all tables in the database"""
    Base.metadata.create_all(bind=engine)

def get_table_names():
    """Get list of all table names"""
    return [table.name for table in Base.metadata.tables.values()]

def get_model_by_tablename(tablename: str):
    """Get model class by table name"""
    for cls in Base.__subclasses__():
        if hasattr(cls, '__tablename__') and cls.__tablename__ == tablename:
            return cls
    return None

# ================================================================================
# MODEL VALIDATION
# ================================================================================

# Verify all models are properly defined
print("Aurex Launchpad Database Models Loaded Successfully!")
print(f"Total Models: {len(Base.__subclasses__())}")
print(f"Total Tables: {len(Base.metadata.tables)}")
print("Models:", [cls.__name__ for cls in Base.__subclasses__()])