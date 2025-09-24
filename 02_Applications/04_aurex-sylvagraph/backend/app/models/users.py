"""
Aurex Sylvagraph - User Management Models
Multi-stakeholder role-based user system for agroforestry platform
"""

from enum import Enum
from typing import Optional, List
from sqlalchemy import String, Boolean, Text, JSON, ForeignKey, Table, Column
from sqlalchemy.orm import Mapped, mapped_column, relationship
from .base import Base, UUIDMixin, TimestampMixin, SoftDeleteMixin, AuditMixin


class UserRole(str, Enum):
    """User roles in the Sylvagraph ecosystem"""
    SUPER_ADMIN = "super_admin"
    BUSINESS_OWNER = "business_owner"
    AGROFORESTRY_PARTNER = "agroforestry_partner"
    FIELD_AGENT = "field_agent"
    DRONE_OPERATOR = "drone_operator"
    REMOTE_SENSING_ANALYST = "remote_sensing_analyst"
    VVB_ADMIN = "vvb_admin"
    VVB_REVIEWER = "vvb_reviewer"
    FARMER = "farmer"
    EXCHANGE_ADMIN = "exchange_admin"


class UserStatus(str, Enum):
    """User account status"""
    ACTIVE = "active"
    INACTIVE = "inactive"
    PENDING_VERIFICATION = "pending_verification"
    SUSPENDED = "suspended"
    BLOCKED = "blocked"


# Association table for user-organization many-to-many relationship
user_organizations = Table(
    'user_organizations',
    Base.metadata,
    Column('user_id', String(36), ForeignKey('users.id'), primary_key=True),
    Column('organization_id', String(36), ForeignKey('organizations.id'), primary_key=True),
    Column('role', String(50), nullable=False)
)


class User(Base, UUIDMixin, TimestampMixin, SoftDeleteMixin, AuditMixin):
    """User model with comprehensive authentication and profile management"""
    
    __tablename__ = "users"
    
    # Basic authentication fields
    email: Mapped[str] = mapped_column(String(255), unique=True, nullable=False, index=True)
    username: Mapped[Optional[str]] = mapped_column(String(100), unique=True, nullable=True, index=True)
    hashed_password: Mapped[str] = mapped_column(String(255), nullable=False)
    
    # Profile information
    first_name: Mapped[str] = mapped_column(String(100), nullable=False)
    last_name: Mapped[str] = mapped_column(String(100), nullable=False)
    phone_number: Mapped[Optional[str]] = mapped_column(String(20), nullable=True)
    
    # Role and status
    primary_role: Mapped[UserRole] = mapped_column(String(50), nullable=False)
    status: Mapped[UserStatus] = mapped_column(String(50), default=UserStatus.PENDING_VERIFICATION)
    
    # Account verification
    is_email_verified: Mapped[bool] = mapped_column(Boolean, default=False)
    is_phone_verified: Mapped[bool] = mapped_column(Boolean, default=False)
    email_verification_token: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    
    # Profile and preferences
    profile_picture_url: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    bio: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    languages: Mapped[Optional[dict]] = mapped_column(JSON, nullable=True)  # ["en", "es", "pt"]
    timezone: Mapped[Optional[str]] = mapped_column(String(50), default="UTC")
    
    # Compliance and KYC
    kyc_status: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)  # pending, approved, rejected
    kyc_documents: Mapped[Optional[dict]] = mapped_column(JSON, nullable=True)
    
    # Blockchain and payment integration
    crypto_wallet_address: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    bank_account_details: Mapped[Optional[dict]] = mapped_column(JSON, nullable=True)
    payment_preferences: Mapped[Optional[dict]] = mapped_column(JSON, nullable=True)
    
    # Farmer-specific fields
    farmer_id: Mapped[Optional[str]] = mapped_column(String(100), nullable=True, unique=True)
    farm_size_hectares: Mapped[Optional[float]] = mapped_column(nullable=True)
    farming_experience_years: Mapped[Optional[int]] = mapped_column(nullable=True)
    
    # API access and permissions
    api_key: Mapped[Optional[str]] = mapped_column(String(255), nullable=True, unique=True)
    permissions: Mapped[Optional[dict]] = mapped_column(JSON, nullable=True)
    
    # Relationships
    organizations: Mapped[List["Organization"]] = relationship(
        "Organization",
        secondary=user_organizations,
        back_populates="users"
    )
    
    # Projects where user is involved
    owned_projects: Mapped[List["AgroforestryProject"]] = relationship(
        "AgroforestryProject",
        foreign_keys="AgroforestryProject.owner_id",
        back_populates="owner"
    )
    
    managed_projects: Mapped[List["AgroforestryProject"]] = relationship(
        "AgroforestryProject",
        foreign_keys="AgroforestryProject.manager_id",
        back_populates="manager"
    )
    
    def __repr__(self):
        return f"<User(email='{self.email}', role='{self.primary_role}')>"
    
    @property
    def full_name(self) -> str:
        """Get user's full name"""
        return f"{self.first_name} {self.last_name}"
    
    def has_role(self, role: UserRole) -> bool:
        """Check if user has specific role"""
        return self.primary_role == role
    
    def can_access_project(self, project_id: str) -> bool:
        """Check if user can access specific project"""
        # Implementation would check project permissions
        return True  # Placeholder


class Organization(Base, UUIDMixin, TimestampMixin, SoftDeleteMixin, AuditMixin):
    """Organizations in the Sylvagraph ecosystem"""
    
    __tablename__ = "organizations"
    
    name: Mapped[str] = mapped_column(String(200), nullable=False)
    legal_name: Mapped[Optional[str]] = mapped_column(String(300), nullable=True)
    org_type: Mapped[str] = mapped_column(String(50), nullable=False)  # partner, vvb, exchange, ngo
    
    # Contact information
    email: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    phone: Mapped[Optional[str]] = mapped_column(String(20), nullable=True)
    website: Mapped[Optional[str]] = mapped_column(String(300), nullable=True)
    
    # Address and location
    address: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    city: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    state: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    country: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    postal_code: Mapped[Optional[str]] = mapped_column(String(20), nullable=True)
    
    # Legal and compliance
    registration_number: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    tax_id: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    certifications: Mapped[Optional[dict]] = mapped_column(JSON, nullable=True)
    
    # Status and verification
    is_verified: Mapped[bool] = mapped_column(Boolean, default=False)
    verification_documents: Mapped[Optional[dict]] = mapped_column(JSON, nullable=True)
    
    # Relationships
    users: Mapped[List[User]] = relationship(
        User,
        secondary=user_organizations,
        back_populates="organizations"
    )
    
    projects: Mapped[List["AgroforestryProject"]] = relationship(
        "AgroforestryProject",
        back_populates="organization"
    )
    
    def __repr__(self):
        return f"<Organization(name='{self.name}', type='{self.org_type}')>"


class UserSession(Base, UUIDMixin, TimestampMixin):
    """User session management for security tracking"""
    
    __tablename__ = "user_sessions"
    
    user_id: Mapped[str] = mapped_column(String(36), ForeignKey("users.id"), nullable=False)
    session_token: Mapped[str] = mapped_column(String(255), nullable=False, unique=True)
    ip_address: Mapped[Optional[str]] = mapped_column(String(45), nullable=True)
    user_agent: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    expires_at: Mapped[datetime] = mapped_column(nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    
    # Relationships
    user: Mapped[User] = relationship(User)
    
    def __repr__(self):
        return f"<UserSession(user_id='{self.user_id}', active='{self.is_active}')>"