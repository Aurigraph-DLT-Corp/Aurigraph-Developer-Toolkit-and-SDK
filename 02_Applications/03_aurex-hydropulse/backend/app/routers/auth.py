"""
Authentication API Routes
Login, logout, token refresh, and user profile endpoints
"""

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from typing import List
from datetime import datetime, timedelta
import jwt

from app.database import get_db
from app.models.users import User
from app.services.auth_service import get_current_user
from app.core.config import settings
from passlib.context import CryptContext

router = APIRouter(prefix="/api/v1/auth", tags=["Authentication"])

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


class AuthSchemas:
    """Authentication request/response schemas"""
    
    from pydantic import BaseModel, EmailStr
    from typing import Optional
    import uuid
    
    class Token(BaseModel):
        access_token: str
        token_type: str
        expires_in: int
        user: "UserProfile"
    
    class UserProfile(BaseModel):
        id: uuid.UUID
        email: str
        username: str
        full_name: str
        organization: Optional[str]
        designation: Optional[str]
        assigned_territories: Optional[List[str]]
        is_super_admin: bool
        roles: List[str]
        permissions: List[str]
        
        class Config:
            from_attributes = True
    
    class LoginRequest(BaseModel):
        username: str  # Can be email or username
        password: str
    
    class PasswordChangeRequest(BaseModel):
        current_password: str
        new_password: str


def create_access_token(data: dict) -> str:
    """Create JWT access token"""
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    
    encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
    return encoded_jwt


def authenticate_user(db: Session, username: str, password: str) -> User | None:
    """Authenticate user with username/email and password"""
    # Try to find user by email or username
    user = db.query(User).filter(
        (User.email == username) | (User.username == username)
    ).first()
    
    if not user or not user.is_active:
        return None
    
    if not pwd_context.verify(password, user.hashed_password):
        return None
    
    return user


@router.post("/login", response_model=AuthSchemas.Token)
async def login(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db)
):
    """
    Login with username/email and password
    Returns JWT access token
    """
    user = authenticate_user(db, form_data.username, form_data.password)
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"}
        )
    
    # Update last login
    user.last_login = datetime.utcnow()
    db.commit()
    
    # Create access token
    access_token = create_access_token(data={"sub": str(user.id)})
    
    # Get user roles and permissions
    roles = [role.code for role in user.roles]
    permissions = []
    for role in user.roles:
        for permission in role.permissions:
            if permission.code not in permissions:
                permissions.append(permission.code)
    
    user_profile = AuthSchemas.UserProfile(
        id=user.id,
        email=user.email,
        username=user.username,
        full_name=user.full_name,
        organization=user.organization,
        designation=user.designation,
        assigned_territories=user.assigned_territories,
        is_super_admin=user.is_super_admin,
        roles=roles,
        permissions=permissions
    )
    
    return AuthSchemas.Token(
        access_token=access_token,
        token_type="bearer",
        expires_in=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,  # Convert to seconds
        user=user_profile
    )


@router.post("/login-simple", response_model=AuthSchemas.Token)
async def login_simple(
    login_data: AuthSchemas.LoginRequest,
    db: Session = Depends(get_db)
):
    """
    Simple login with JSON payload (alternative to form data)
    """
    user = authenticate_user(db, login_data.username, login_data.password)
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password"
        )
    
    # Update last login
    user.last_login = datetime.utcnow()
    db.commit()
    
    # Create access token
    access_token = create_access_token(data={"sub": str(user.id)})
    
    # Get user roles and permissions
    roles = [role.code for role in user.roles]
    permissions = []
    for role in user.roles:
        for permission in role.permissions:
            if permission.code not in permissions:
                permissions.append(permission.code)
    
    user_profile = AuthSchemas.UserProfile(
        id=user.id,
        email=user.email,
        username=user.username,
        full_name=user.full_name,
        organization=user.organization,
        designation=user.designation,
        assigned_territories=user.assigned_territories,
        is_super_admin=user.is_super_admin,
        roles=roles,
        permissions=permissions
    )
    
    return AuthSchemas.Token(
        access_token=access_token,
        token_type="bearer",
        expires_in=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        user=user_profile
    )


@router.get("/me", response_model=AuthSchemas.UserProfile)
async def get_current_user_profile(current_user: User = Depends(get_current_user)):
    """Get current user profile information"""
    
    # Get user roles and permissions
    roles = [role.code for role in current_user.roles]
    permissions = []
    for role in current_user.roles:
        for permission in role.permissions:
            if permission.code not in permissions:
                permissions.append(permission.code)
    
    return AuthSchemas.UserProfile(
        id=current_user.id,
        email=current_user.email,
        username=current_user.username,
        full_name=current_user.full_name,
        organization=current_user.organization,
        designation=current_user.designation,
        assigned_territories=current_user.assigned_territories,
        is_super_admin=current_user.is_super_admin,
        roles=roles,
        permissions=permissions
    )


@router.post("/logout")
async def logout():
    """
    Logout endpoint (client should discard token)
    In a production system, you might maintain a token blacklist
    """
    return {"message": "Successfully logged out"}


@router.post("/change-password")
async def change_password(
    password_data: AuthSchemas.PasswordChangeRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Change user password"""
    
    # Verify current password
    if not pwd_context.verify(password_data.current_password, current_user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Current password is incorrect"
        )
    
    # Update password
    current_user.hashed_password = pwd_context.hash(password_data.new_password)
    db.commit()
    
    return {"message": "Password changed successfully"}


@router.get("/test-permissions")
async def test_permissions(current_user: User = Depends(get_current_user)):
    """Test endpoint to check user permissions"""
    
    permissions = []
    for role in current_user.roles:
        for permission in role.permissions:
            permissions.append({
                "code": permission.code,
                "name": permission.name,
                "resource": permission.resource,
                "action": permission.action
            })
    
    return {
        "user": current_user.full_name,
        "roles": [role.code for role in current_user.roles],
        "territories": current_user.assigned_territories,
        "is_super_admin": current_user.is_super_admin,
        "permissions": permissions
    }