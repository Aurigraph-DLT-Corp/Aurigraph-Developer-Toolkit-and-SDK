"""
Authentication and Authorization Service
RBAC implementation for HydroPulse AWD platform
"""

from fastapi import HTTPException, Depends, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime, timedelta
import jwt
import uuid

from app.database import get_db
from app.models.users import User, Role, Permission
from app.core.config import settings


security = HTTPBearer()


class AuthService:
    """Authentication and authorization service"""
    
    @staticmethod
    def verify_token(token: str) -> dict:
        """Verify JWT token and return payload"""
        try:
            payload = jwt.decode(
                token, 
                settings.SECRET_KEY, 
                algorithms=[settings.ALGORITHM]
            )
            return payload
        except jwt.ExpiredSignatureError:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Token has expired",
                headers={"WWW-Authenticate": "Bearer"}
            )
        except jwt.InvalidTokenError:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid authentication credentials",
                headers={"WWW-Authenticate": "Bearer"}
            )

    @staticmethod
    def get_user_by_id(db: Session, user_id: uuid.UUID) -> Optional[User]:
        """Get user by ID with roles and permissions"""
        return db.query(User).filter(User.id == user_id, User.is_active == True).first()


def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db)
) -> User:
    """Get current authenticated user"""
    
    # Extract token
    token = credentials.credentials
    
    # Verify token and get payload
    payload = AuthService.verify_token(token)
    
    # Get user ID from payload
    user_id = payload.get("sub")
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token payload"
        )
    
    # Get user from database
    user = AuthService.get_user_by_id(db, uuid.UUID(user_id))
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found or inactive"
        )
    
    return user


def require_permissions(user: User, required_permissions: List[str]) -> bool:
    """Check if user has required permissions"""
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User account is inactive"
        )
    
    # Super admin has all permissions
    if user.is_super_admin:
        return True
    
    # Get user's permissions through roles
    user_permissions = set()
    for role in user.roles:
        for permission in role.permissions:
            user_permissions.add(permission.code)
    
    # Check if user has all required permissions
    missing_permissions = set(required_permissions) - user_permissions
    if missing_permissions:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"Missing required permissions: {', '.join(missing_permissions)}"
        )
    
    return True


def check_territory_access(user: User, territory: str) -> bool:
    """Check if user has access to specific territory/state"""
    if user.is_super_admin:
        return True
    
    if not user.assigned_territories:
        return False
    
    return territory in user.assigned_territories


def has_role(user: User, role_codes: List[str]) -> bool:
    """Check if user has any of the specified roles"""
    user_roles = [role.code for role in user.roles]
    return any(role in user_roles for role in role_codes)


class RoleBasedAccessControl:
    """RBAC helper class"""
    
    @staticmethod
    def can_create_project(user: User) -> bool:
        """Check if user can create projects"""
        return has_role(user, ["project_manager", "business_owner", "super_admin"])
    
    @staticmethod
    def can_approve_project(user: User, approval_level: int) -> bool:
        """Check if user can approve at specific level"""
        approval_roles = {
            1: ["project_manager"],
            2: ["business_owner"], 
            3: ["super_admin"]
        }
        
        required_roles = approval_roles.get(approval_level, [])
        return has_role(user, required_roles)
    
    @staticmethod
    def can_delete_project(user: User) -> bool:
        """Check if user can delete projects"""
        return has_role(user, ["business_owner", "super_admin"])
    
    @staticmethod
    def can_access_dashboard(user: User) -> bool:
        """Check if user can access dashboard"""
        return has_role(user, ["project_manager", "business_owner", "super_admin"])