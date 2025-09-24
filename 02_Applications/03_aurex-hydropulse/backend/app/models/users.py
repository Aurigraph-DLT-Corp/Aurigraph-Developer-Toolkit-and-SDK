"""
User Management Database Models
Authentication and RBAC models
"""

from sqlalchemy import Column, Integer, String, Boolean, DateTime, Text, ForeignKey, Table
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import relationship
from sqlalchemy.dialects.postgresql import UUID, JSONB
from datetime import datetime
import uuid

Base = declarative_base()

# Association tables for many-to-many relationships
user_roles = Table(
    'user_roles',
    Base.metadata,
    Column('user_id', UUID(as_uuid=True), ForeignKey('users.id'), primary_key=True),
    Column('role_id', UUID(as_uuid=True), ForeignKey('roles.id'), primary_key=True)
)

role_permissions = Table(
    'role_permissions',
    Base.metadata,
    Column('role_id', UUID(as_uuid=True), ForeignKey('roles.id'), primary_key=True),
    Column('permission_id', UUID(as_uuid=True), ForeignKey('permissions.id'), primary_key=True)
)


class User(Base):
    """User accounts and profile information"""
    __tablename__ = "users"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    
    # Basic Information
    email = Column(String(255), unique=True, nullable=False, index=True)
    username = Column(String(100), unique=True, nullable=False, index=True)
    full_name = Column(String(255), nullable=False)
    
    # Authentication
    hashed_password = Column(String(255), nullable=False)
    is_active = Column(Boolean, default=True)
    is_verified = Column(Boolean, default=False)
    
    # Profile
    phone = Column(String(20))
    organization = Column(String(255))
    designation = Column(String(100))
    
    # Territory Assignment (for geographic access control)
    assigned_territories = Column(JSONB)  # Array of states/regions user can access
    
    # Administrative flags
    is_super_admin = Column(Boolean, default=False)
    is_staff = Column(Boolean, default=False)
    
    # Audit
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    last_login = Column(DateTime)
    
    # Relationships
    roles = relationship("Role", secondary=user_roles, back_populates="users")
    created_projects = relationship("Project", foreign_keys="Project.created_by")
    
    def has_role(self, role_codes: list) -> bool:
        """Check if user has any of the specified roles"""
        user_role_codes = [role.code for role in self.roles]
        return any(code in user_role_codes for code in role_codes)
    
    def has_permission(self, permission_code: str) -> bool:
        """Check if user has a specific permission"""
        if self.is_super_admin:
            return True
        
        for role in self.roles:
            for permission in role.permissions:
                if permission.code == permission_code:
                    return True
        return False
    
    def can_access_territory(self, territory: str) -> bool:
        """Check if user can access a specific territory"""
        if self.is_super_admin:
            return True
        
        if not self.assigned_territories:
            return False
        
        return territory in self.assigned_territories


class Role(Base):
    """User roles for RBAC"""
    __tablename__ = "roles"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    
    # Role Information
    name = Column(String(100), nullable=False)
    code = Column(String(50), unique=True, nullable=False, index=True)
    description = Column(Text)
    
    # Hierarchy
    level = Column(Integer, default=0)  # 0=lowest, higher numbers = more authority
    
    # Status
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    users = relationship("User", secondary=user_roles, back_populates="roles")
    permissions = relationship("Permission", secondary=role_permissions, back_populates="roles")


class Permission(Base):
    """System permissions for fine-grained access control"""
    __tablename__ = "permissions"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    
    # Permission Information
    name = Column(String(100), nullable=False)
    code = Column(String(100), unique=True, nullable=False, index=True)
    description = Column(Text)
    resource = Column(String(50))  # project, farmer, sensor, etc.
    action = Column(String(50))    # create, read, update, delete, approve
    
    # Status
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    roles = relationship("Role", secondary=role_permissions, back_populates="permissions")


# Indexes for performance
from sqlalchemy import Index

Index('idx_users_email_active', User.email, User.is_active)
Index('idx_users_territory', User.assigned_territories)
Index('idx_roles_code_active', Role.code, Role.is_active)
Index('idx_permissions_resource_action', Permission.resource, Permission.action)