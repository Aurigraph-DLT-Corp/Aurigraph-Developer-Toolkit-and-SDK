# ================================================================================
# AUREX LAUNCHPAD™ AUTHENTICATION MODELS
# Enhanced user authentication and authorization system
# Agent: Security Intelligence Agent
# ================================================================================

from sqlalchemy import Column, String, DateTime, Boolean, JSON, Text, Integer, Float
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from datetime import datetime, timedelta
import uuid
import hashlib
import secrets
from typing import Optional, Dict, Any, List
from enum import Enum

from .base_models import BaseModelWithSoftDelete, TimestampMixin
try:
    from security.password_utils import pwd_context
except ImportError:
    # Fallback for migration environment
    from passlib.context import CryptContext
    pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# ================================================================================
# USER ROLES AND PERMISSIONS
# ================================================================================

class UserRole(Enum):
    """User role definitions for RBAC"""
    SUPER_ADMIN = "super_admin"
    ORG_ADMIN = "org_admin"
    ESG_MANAGER = "esg_manager"
    ESG_ANALYST = "esg_analyst"
    CONSULTANT = "consultant"
    VIEWER = "viewer"
    GUEST = "guest"

class Permission(Enum):
    """System permissions for granular access control"""
    # Assessment permissions
    CREATE_ASSESSMENT = "create_assessment"
    VIEW_ASSESSMENT = "view_assessment"
    EDIT_ASSESSMENT = "edit_assessment"
    DELETE_ASSESSMENT = "delete_assessment"
    APPROVE_ASSESSMENT = "approve_assessment"
    
    # Organization permissions
    MANAGE_ORGANIZATION = "manage_organization"
    VIEW_ORGANIZATION = "view_organization"
    INVITE_USERS = "invite_users"
    MANAGE_USERS = "manage_users"
    
    # Document permissions
    UPLOAD_DOCUMENTS = "upload_documents"
    VIEW_DOCUMENTS = "view_documents"
    DELETE_DOCUMENTS = "delete_documents"
    
    # Report permissions
    GENERATE_REPORTS = "generate_reports"
    VIEW_REPORTS = "view_reports"
    EXPORT_DATA = "export_data"
    
    # System permissions
    SYSTEM_ADMIN = "system_admin"
    VIEW_ANALYTICS = "view_analytics"
    MANAGE_INTEGRATIONS = "manage_integrations"

# ================================================================================
# CORE AUTHENTICATION MODELS
# ================================================================================

class User(BaseModelWithSoftDelete, TimestampMixin):
    """Enhanced user model with comprehensive authentication features"""
    __tablename__ = "users"
    
    # Basic user information
    email = Column(String(255), unique=True, nullable=False, index=True)
    password_hash = Column(String(255), nullable=True)  # Nullable for SSO users
    first_name = Column(String(100), nullable=False)
    last_name = Column(String(100), nullable=False)
    
    # User status and verification
    is_active = Column(Boolean, default=True)
    is_verified = Column(Boolean, default=False)
    is_superuser = Column(Boolean, default=False)
    email_verified_at = Column(DateTime, nullable=True)
    
    # Account security
    failed_login_attempts = Column(Integer, default=0)
    locked_until = Column(DateTime, nullable=True)
    password_changed_at = Column(DateTime, default=datetime.utcnow)
    must_change_password = Column(Boolean, default=False)
    
    # User preferences and profile
    timezone = Column(String(50), default="UTC")
    language = Column(String(10), default="en")
    phone_number = Column(String(20), nullable=True)
    job_title = Column(String(100), nullable=True)
    department = Column(String(100), nullable=True)
    avatar_url = Column(String(500), nullable=True)
    
    # Security settings
    mfa_enabled = Column(Boolean, default=False)
    mfa_secret = Column(String(255), nullable=True)
    backup_codes = Column(JSON, nullable=True)
    
    # Login tracking
    last_login_at = Column(DateTime, nullable=True)
    last_login_ip = Column(String(45), nullable=True)
    last_login_device = Column(String(255), nullable=True)
    
    # User preferences
    notification_preferences = Column(JSON, default=lambda: {
        "email_notifications": True,
        "assessment_reminders": True,
        "project_updates": True,
        "security_alerts": True
    })
    
    # Relationships
    organization_memberships = relationship("OrganizationMember", back_populates="user")
    refresh_tokens = relationship("RefreshToken", back_populates="user")
    audit_logs = relationship("AuditLog", back_populates="user")
    
    def set_password(self, password: str) -> None:
        """Set user password with secure hashing"""
        self.password_hash = pwd_context.hash(password)
        self.password_changed_at = datetime.utcnow()
        self.must_change_password = False
    
    def verify_password(self, password: str) -> bool:
        """Verify user password"""
        if not self.password_hash:
            return False
        return pwd_context.verify(password, self.password_hash)
    
    def is_locked(self) -> bool:
        """Check if user account is locked"""
        if self.locked_until and self.locked_until > datetime.utcnow():
            return True
        return False
    
    def increment_failed_login(self) -> None:
        """Increment failed login attempts and lock if necessary"""
        self.failed_login_attempts += 1
        if self.failed_login_attempts >= 5:
            self.locked_until = datetime.utcnow() + timedelta(minutes=30)
    
    def reset_failed_login(self) -> None:
        """Reset failed login attempts"""
        self.failed_login_attempts = 0
        self.locked_until = None
    
    def generate_mfa_secret(self) -> str:
        """Generate MFA secret for TOTP"""
        secret = secrets.token_urlsafe(32)
        self.mfa_secret = secret
        return secret
    
    def generate_backup_codes(self) -> List[str]:
        """Generate backup codes for MFA"""
        codes = [secrets.token_urlsafe(8) for _ in range(10)]
        hashed_codes = [hashlib.sha256(code.encode()).hexdigest() for code in codes]
        self.backup_codes = hashed_codes
        return codes
    
    def has_permission(self, permission: Permission, organization_id: Optional[UUID] = None) -> bool:
        """Check if user has specific permission"""
        if self.is_superuser:
            return True
        
        # Check organization-specific permissions
        if organization_id:
            membership = next(
                (m for m in self.organization_memberships 
                 if m.organization_id == organization_id and m.is_active),
                None
            )
            if membership:
                return permission in membership.get_permissions()
        
        return False
    
    @property
    def full_name(self) -> str:
        """Get user's full name"""
        return f"{self.first_name} {self.last_name}"
    
    @property
    def display_name(self) -> str:
        """Get user's display name"""
        return self.full_name or self.email

class Organization(BaseModelWithSoftDelete, TimestampMixin):
    """Organization model for multi-tenant support"""
    __tablename__ = "organizations"
    
    # Basic organization information
    name = Column(String(255), nullable=False)
    slug = Column(String(100), unique=True, nullable=False, index=True)
    description = Column(Text, nullable=True)
    website = Column(String(255), nullable=True)
    
    # Organization details
    industry = Column(String(100), nullable=True)
    employee_count_range = Column(String(50), nullable=True)  # "1-50", "51-200", etc.
    annual_revenue_range = Column(String(50), nullable=True)
    headquarters_country = Column(String(100), nullable=True)
    headquarters_city = Column(String(100), nullable=True)
    
    # Organization settings
    settings = Column(JSON, default=lambda: {
        "assessment_approval_required": True,
        "allow_external_consultants": True,
        "data_retention_months": 84,  # 7 years
        "require_mfa": False
    })
    
    # Subscription and billing
    subscription_tier = Column(String(50), default="starter")  # starter, professional, enterprise
    max_users = Column(Integer, default=15)
    max_assessments = Column(Integer, default=50)
    features_enabled = Column(JSON, default=lambda: {
        "ai_insights": True,
        "advanced_analytics": False,
        "api_access": False,
        "white_labeling": False,
        "sso_integration": False
    })
    
    # Organization branding
    logo_url = Column(String(500), nullable=True)
    primary_color = Column(String(7), default="#1976d2")  # Hex color
    secondary_color = Column(String(7), default="#424242")
    
    # Relationships
    members = relationship("OrganizationMember", back_populates="organization")
    assessments = relationship("ESGAssessment", back_populates="organization")
    
    def get_active_members(self) -> List['OrganizationMember']:
        """Get all active organization members"""
        return [m for m in self.members if m.is_active and not m.user.deleted_at]
    
    def get_member_count(self) -> int:
        """Get count of active members"""
        return len(self.get_active_members())
    
    def can_add_member(self) -> bool:
        """Check if organization can add more members"""
        return self.get_member_count() < self.max_users

class OrganizationMember(BaseModelWithSoftDelete, TimestampMixin):
    """Organization membership with role-based access control"""
    __tablename__ = "organization_members"
    
    organization_id = Column(UUID(as_uuid=True), nullable=False, index=True)
    user_id = Column(UUID(as_uuid=True), nullable=False, index=True)
    
    # Member role and status
    role = Column(String(50), nullable=False, default=UserRole.VIEWER.value)
    is_active = Column(Boolean, default=True)
    is_owner = Column(Boolean, default=False)
    
    # Invitation details
    invited_by_id = Column(UUID(as_uuid=True), nullable=True)
    invited_at = Column(DateTime, default=datetime.utcnow)
    joined_at = Column(DateTime, nullable=True)
    invitation_token = Column(String(255), nullable=True, unique=True)
    invitation_expires_at = Column(DateTime, nullable=True)
    
    # Custom permissions
    custom_permissions = Column(JSON, default=list)
    permission_restrictions = Column(JSON, default=list)
    
    # Access tracking
    last_accessed_at = Column(DateTime, nullable=True)
    access_count = Column(Integer, default=0)
    
    # Relationships
    organization = relationship("Organization", back_populates="members")
    user = relationship("User", back_populates="organization_memberships")
    
    def get_permissions(self) -> List[Permission]:
        """Get effective permissions for this organization member"""
        # Base permissions by role
        role_permissions = {
            UserRole.SUPER_ADMIN: list(Permission),
            UserRole.ORG_ADMIN: [
                Permission.CREATE_ASSESSMENT, Permission.VIEW_ASSESSMENT, 
                Permission.EDIT_ASSESSMENT, Permission.DELETE_ASSESSMENT, 
                Permission.APPROVE_ASSESSMENT, Permission.MANAGE_ORGANIZATION,
                Permission.VIEW_ORGANIZATION, Permission.INVITE_USERS, 
                Permission.MANAGE_USERS, Permission.UPLOAD_DOCUMENTS,
                Permission.VIEW_DOCUMENTS, Permission.DELETE_DOCUMENTS,
                Permission.GENERATE_REPORTS, Permission.VIEW_REPORTS, 
                Permission.EXPORT_DATA, Permission.VIEW_ANALYTICS
            ],
            UserRole.ESG_MANAGER: [
                Permission.CREATE_ASSESSMENT, Permission.VIEW_ASSESSMENT,
                Permission.EDIT_ASSESSMENT, Permission.APPROVE_ASSESSMENT,
                Permission.VIEW_ORGANIZATION, Permission.UPLOAD_DOCUMENTS,
                Permission.VIEW_DOCUMENTS, Permission.GENERATE_REPORTS,
                Permission.VIEW_REPORTS, Permission.EXPORT_DATA, Permission.VIEW_ANALYTICS
            ],
            UserRole.ESG_ANALYST: [
                Permission.CREATE_ASSESSMENT, Permission.VIEW_ASSESSMENT,
                Permission.EDIT_ASSESSMENT, Permission.VIEW_ORGANIZATION,
                Permission.UPLOAD_DOCUMENTS, Permission.VIEW_DOCUMENTS,
                Permission.GENERATE_REPORTS, Permission.VIEW_REPORTS, Permission.VIEW_ANALYTICS
            ],
            UserRole.CONSULTANT: [
                Permission.VIEW_ASSESSMENT, Permission.VIEW_ORGANIZATION,
                Permission.VIEW_DOCUMENTS, Permission.VIEW_REPORTS, Permission.VIEW_ANALYTICS
            ],
            UserRole.VIEWER: [
                Permission.VIEW_ASSESSMENT, Permission.VIEW_ORGANIZATION,
                Permission.VIEW_DOCUMENTS, Permission.VIEW_REPORTS
            ],
            UserRole.GUEST: [Permission.VIEW_ASSESSMENT]
        }
        
        try:
            role_enum = UserRole(self.role)
            base_permissions = role_permissions.get(role_enum, [])
        except ValueError:
            base_permissions = []
        
        # Add custom permissions
        custom_perms = [Permission(p) for p in self.custom_permissions 
                       if p in [p.value for p in Permission]]
        
        # Remove restricted permissions
        restricted_perms = [Permission(p) for p in self.permission_restrictions 
                           if p in [p.value for p in Permission]]
        
        effective_permissions = set(base_permissions + custom_perms) - set(restricted_perms)
        return list(effective_permissions)
    
    def has_permission(self, permission: Permission) -> bool:
        """Check if member has specific permission"""
        return permission in self.get_permissions()

# ================================================================================
# SESSION AND TOKEN MANAGEMENT
# ================================================================================

class RefreshToken(BaseModelWithSoftDelete, TimestampMixin):
    """Refresh token for JWT authentication"""
    __tablename__ = "refresh_tokens"
    
    user_id = Column(UUID(as_uuid=True), nullable=False, index=True)
    token = Column(String(255), unique=True, nullable=False, index=True)
    expires_at = Column(DateTime, nullable=False)
    
    # Token metadata
    device_info = Column(JSON, nullable=True)
    ip_address = Column(String(45), nullable=True)
    user_agent = Column(String(500), nullable=True)
    
    # Token status
    is_active = Column(Boolean, default=True)
    revoked_at = Column(DateTime, nullable=True)
    revoked_reason = Column(String(100), nullable=True)
    
    # Relationships
    user = relationship("User", back_populates="refresh_tokens")
    
    def is_expired(self) -> bool:
        """Check if token is expired"""
        return datetime.utcnow() > self.expires_at
    
    def is_valid(self) -> bool:
        """Check if token is valid"""
        return self.is_active and not self.is_expired() and not self.revoked_at
    
    def revoke(self, reason: str = "manual_revocation") -> None:
        """Revoke the refresh token"""
        self.is_active = False
        self.revoked_at = datetime.utcnow()
        self.revoked_reason = reason

class UserSession(BaseModelWithSoftDelete, TimestampMixin):
    """User session tracking for security and analytics"""
    __tablename__ = "user_sessions"
    
    user_id = Column(UUID(as_uuid=True), nullable=False, index=True)
    session_id = Column(String(255), unique=True, nullable=False, index=True)
    
    # Session details
    ip_address = Column(String(45), nullable=True)
    user_agent = Column(String(500), nullable=True)
    device_type = Column(String(50), nullable=True)  # desktop, mobile, tablet
    browser = Column(String(100), nullable=True)
    os = Column(String(100), nullable=True)
    location = Column(JSON, nullable=True)  # city, country, etc.
    
    # Session timing
    started_at = Column(DateTime, default=datetime.utcnow)
    last_activity_at = Column(DateTime, default=datetime.utcnow)
    ended_at = Column(DateTime, nullable=True)
    duration_seconds = Column(Integer, nullable=True)
    
    # Session activity
    page_views = Column(Integer, default=0)
    actions_performed = Column(Integer, default=0)
    assessments_viewed = Column(Integer, default=0)
    reports_generated = Column(Integer, default=0)
    
    # Session status
    is_active = Column(Boolean, default=True)
    ended_reason = Column(String(100), nullable=True)  # logout, timeout, security
    
    def update_activity(self) -> None:
        """Update last activity timestamp"""
        self.last_activity_at = datetime.utcnow()
    
    def end_session(self, reason: str = "logout") -> None:
        """End the session"""
        self.is_active = False
        self.ended_at = datetime.utcnow()
        self.ended_reason = reason
        if self.started_at:
            self.duration_seconds = int((self.ended_at - self.started_at).total_seconds())

# ================================================================================
# AUDIT AND SECURITY LOGGING
# ================================================================================

class AuditLog(BaseModelWithSoftDelete, TimestampMixin):
    """Comprehensive audit logging for security and compliance"""
    __tablename__ = "audit_logs"
    
    # Event identification
    event_type = Column(String(100), nullable=False, index=True)
    event_category = Column(String(50), nullable=False, index=True)
    event_description = Column(Text, nullable=True)
    
    # Actor information
    user_id = Column(UUID(as_uuid=True), nullable=True, index=True)
    organization_id = Column(UUID(as_uuid=True), nullable=True, index=True)
    ip_address = Column(String(45), nullable=True)
    user_agent = Column(String(500), nullable=True)
    
    # Resource information
    resource_type = Column(String(100), nullable=True)
    resource_id = Column(UUID(as_uuid=True), nullable=True)
    resource_data = Column(JSON, nullable=True)
    
    # Change tracking
    old_values = Column(JSON, nullable=True)
    new_values = Column(JSON, nullable=True)
    changes = Column(JSON, nullable=True)
    
    # Event metadata
    severity = Column(String(20), default="info")  # info, warning, error, critical
    status = Column(String(20), default="success")  # success, failure, partial
    error_message = Column(Text, nullable=True)
    
    # Additional context
    session_id = Column(String(255), nullable=True)
    request_id = Column(String(255), nullable=True)
    correlation_id = Column(String(255), nullable=True)
    
    # Relationships
    user = relationship("User", back_populates="audit_logs")
    
    @classmethod
    def log_event(cls, event_type: str, event_category: str, **kwargs) -> 'AuditLog':
        """Create a new audit log entry"""
        log_entry = cls(
            event_type=event_type,
            event_category=event_category,
            **kwargs
        )
        return log_entry

class SecurityEvent(BaseModelWithSoftDelete, TimestampMixin):
    """Security-specific event logging"""
    __tablename__ = "security_events"
    
    # Event identification
    event_type = Column(String(100), nullable=False, index=True)
    severity = Column(String(20), nullable=False, index=True)  # low, medium, high, critical
    status = Column(String(20), default="active")  # active, investigating, resolved, false_positive
    
    # Event details
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    
    # Actor information
    user_id = Column(UUID(as_uuid=True), nullable=True, index=True)
    ip_address = Column(String(45), nullable=True, index=True)
    user_agent = Column(String(500), nullable=True)
    
    # Location and device
    location = Column(JSON, nullable=True)
    device_fingerprint = Column(String(255), nullable=True)
    
    # Detection and response
    detected_at = Column(DateTime, default=datetime.utcnow)
    detection_method = Column(String(100), nullable=True)
    risk_score = Column(Float, nullable=True)
    
    # Investigation and resolution
    investigated_by_id = Column(UUID(as_uuid=True), nullable=True)
    investigated_at = Column(DateTime, nullable=True)
    resolution_notes = Column(Text, nullable=True)
    resolved_at = Column(DateTime, nullable=True)
    
    # Additional metadata
    user_metadata = Column(JSON, nullable=True)
    tags = Column(JSON, nullable=True)
    
    def is_resolved(self) -> bool:
        """Check if security event is resolved"""
        return self.status in ["resolved", "false_positive"]
    
    def escalate(self) -> None:
        """Escalate security event severity"""
        severity_levels = ["low", "medium", "high", "critical"]
        current_index = severity_levels.index(self.severity)
        if current_index < len(severity_levels) - 1:
            self.severity = severity_levels[current_index + 1]

print("✅ Authentication Models Loaded Successfully!")
print("Features:")
print("  🔐 Comprehensive User Authentication")
print("  👥 Multi-tenant Organization Support")
print("  🛡️ Role-based Access Control (RBAC)")
print("  🔒 Multi-factor Authentication")
print("  📊 Session Tracking & Analytics")
print("  🔍 Comprehensive Audit Logging")
print("  🚨 Security Event Management")
print("  🎯 Granular Permission System")