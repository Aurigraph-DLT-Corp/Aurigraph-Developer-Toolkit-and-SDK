"""
Aurex Sylvagraph - Authentication & Authorization Router
Multi-stakeholder authentication with JWT tokens
"""

from datetime import datetime, timedelta
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from jose import JWTError, jwt
from passlib.context import CryptContext
import os

from database import get_db
from app.models.users import User, UserRole, UserStatus, UserSession

router = APIRouter()
security = HTTPBearer()

# Authentication configuration
SECRET_KEY = os.getenv("JWT_SECRET_KEY", "aurex-sylvagraph-secret-key-change-in-production")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "480"))  # 8 hours

# Password hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify password against hash"""
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password: str) -> str:
    """Hash password"""
    return pwd_context.hash(password)

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    """Create JWT access token"""
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: AsyncSession = Depends(get_db)
) -> User:
    """Get current authenticated user from JWT token"""
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    try:
        payload = jwt.decode(credentials.credentials, SECRET_KEY, algorithms=[ALGORITHM])
        user_id: str = payload.get("sub")
        if user_id is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception
    
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    
    if user is None:
        raise credentials_exception
    
    if user.status != UserStatus.ACTIVE:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User account is not active"
        )
    
    return user

async def require_role(required_roles: list[UserRole]):
    """Dependency to require specific user roles"""
    def role_dependency(current_user: User = Depends(get_current_user)):
        if current_user.primary_role not in required_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Insufficient permissions"
            )
        return current_user
    return role_dependency

# Authentication endpoints
@router.post("/login", response_model=dict)
async def login(
    email: str,
    password: str,
    db: AsyncSession = Depends(get_db)
):
    """User login with email and password"""
    # Find user by email
    result = await db.execute(select(User).where(User.email == email))
    user = result.scalar_one_or_none()
    
    if not user or not verify_password(password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password"
        )
    
    if user.status != UserStatus.ACTIVE:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User account is not active"
        )
    
    # Create access token
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.id, "email": user.email, "role": user.primary_role},
        expires_delta=access_token_expires
    )
    
    # Create user session record
    session = UserSession(
        user_id=user.id,
        session_token=access_token,
        expires_at=datetime.utcnow() + access_token_expires,
        is_active=True
    )
    db.add(session)
    await db.commit()
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "expires_in": ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        "user": {
            "id": user.id,
            "email": user.email,
            "full_name": user.full_name,
            "role": user.primary_role,
            "status": user.status
        }
    }

@router.post("/logout")
async def logout(
    current_user: User = Depends(get_current_user),
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: AsyncSession = Depends(get_db)
):
    """User logout - invalidate session"""
    # Deactivate session
    result = await db.execute(
        select(UserSession).where(
            UserSession.session_token == credentials.credentials,
            UserSession.is_active == True
        )
    )
    session = result.scalar_one_or_none()
    
    if session:
        session.is_active = False
        await db.commit()
    
    return {"message": "Successfully logged out"}

@router.get("/me", response_model=dict)
async def get_current_user_profile(current_user: User = Depends(get_current_user)):
    """Get current user profile information"""
    return {
        "id": current_user.id,
        "email": current_user.email,
        "username": current_user.username,
        "first_name": current_user.first_name,
        "last_name": current_user.last_name,
        "full_name": current_user.full_name,
        "phone_number": current_user.phone_number,
        "primary_role": current_user.primary_role,
        "status": current_user.status,
        "is_email_verified": current_user.is_email_verified,
        "is_phone_verified": current_user.is_phone_verified,
        "profile_picture_url": current_user.profile_picture_url,
        "bio": current_user.bio,
        "languages": current_user.languages,
        "timezone": current_user.timezone,
        "kyc_status": current_user.kyc_status,
        "created_at": current_user.created_at,
        "updated_at": current_user.updated_at
    }

@router.post("/register", response_model=dict)
async def register(
    email: str,
    password: str,
    first_name: str,
    last_name: str,
    role: UserRole,
    phone_number: Optional[str] = None,
    username: Optional[str] = None,
    db: AsyncSession = Depends(get_db)
):
    """User registration"""
    # Check if user already exists
    result = await db.execute(select(User).where(User.email == email))
    existing_user = result.scalar_one_or_none()
    
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )
    
    # Create new user
    hashed_password = get_password_hash(password)
    user = User(
        email=email,
        username=username,
        hashed_password=hashed_password,
        first_name=first_name,
        last_name=last_name,
        phone_number=phone_number,
        primary_role=role,
        status=UserStatus.PENDING_VERIFICATION
    )
    
    db.add(user)
    await db.commit()
    await db.refresh(user)
    
    return {
        "message": "User registered successfully",
        "user_id": user.id,
        "email": user.email,
        "status": user.status
    }

@router.post("/verify-email")
async def verify_email(
    email: str,
    verification_token: str,
    db: AsyncSession = Depends(get_db)
):
    """Verify user email address"""
    result = await db.execute(
        select(User).where(
            User.email == email,
            User.email_verification_token == verification_token
        )
    )
    user = result.scalar_one_or_none()
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid verification token"
        )
    
    user.is_email_verified = True
    user.email_verification_token = None
    user.status = UserStatus.ACTIVE
    
    await db.commit()
    
    return {"message": "Email verified successfully"}

@router.get("/permissions")
async def get_user_permissions(current_user: User = Depends(get_current_user)):
    """Get user permissions based on role"""
    role_permissions = {
        UserRole.SUPER_ADMIN: [
            "manage_system", "manage_users", "manage_projects", "manage_credits",
            "manage_exchanges", "manage_compliance", "view_analytics"
        ],
        UserRole.BUSINESS_OWNER: [
            "create_projects", "manage_projects", "view_credits", "view_analytics"
        ],
        UserRole.AGROFORESTRY_PARTNER: [
            "manage_local_projects", "onboard_farmers", "approve_field_data"
        ],
        UserRole.FIELD_AGENT: [
            "collect_ground_truth", "upload_field_data", "view_assigned_projects"
        ],
        UserRole.DRONE_OPERATOR: [
            "execute_flights", "upload_imagery", "view_flight_plans"
        ],
        UserRole.REMOTE_SENSING_ANALYST: [
            "validate_ai_outputs", "analyze_satellite_data", "generate_reports"
        ],
        UserRole.VVB_ADMIN: [
            "manage_verification", "approve_credit_issuance", "generate_certificates"
        ],
        UserRole.VVB_REVIEWER: [
            "review_mrv_reports", "validate_methodologies", "approve_credits"
        ],
        UserRole.FARMER: [
            "view_payments", "view_credits", "view_impact_data"
        ],
        UserRole.EXCHANGE_ADMIN: [
            "configure_token_sales", "execute_bridging", "manage_listings"
        ]
    }
    
    return {
        "user_role": current_user.primary_role,
        "permissions": role_permissions.get(current_user.primary_role, []),
        "custom_permissions": current_user.permissions or []
    }