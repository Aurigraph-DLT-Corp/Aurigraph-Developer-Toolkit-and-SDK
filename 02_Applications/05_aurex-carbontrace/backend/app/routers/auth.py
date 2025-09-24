from fastapi import APIRouter, HTTPException, Depends, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from datetime import datetime, timedelta
from passlib.context import CryptContext
import jwt
import os
from typing import Optional

from database import get_db
from app.models.user import User, UserTier, VerificationStatus
from app.schemas.auth import UserRegistration, UserLogin, UserResponse, CredentialUpgrade

router = APIRouter()
security = HTTPBearer()
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

SECRET_KEY = os.getenv("SECRET_KEY", "carbontrace-secret-key-change-in-production")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30

def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password):
    return pwd_context.hash(password)

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=15)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

@router.post("/register", response_model=UserResponse)
async def register_user(user_data: UserRegistration, db: Session = Depends(get_db)):
    """Register a new user with KYC/AML verification"""
    
    # Check if user already exists
    existing_user = db.query(User).filter(
        (User.email == user_data.email) | (User.username == user_data.username)
    ).first()
    
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User with this email or username already exists"
        )
    
    # Hash password
    hashed_password = get_password_hash(user_data.password)
    
    # Create new user
    new_user = User(
        email=user_data.email,
        username=user_data.username,
        full_name=user_data.full_name,
        password_hash=hashed_password,
        country=user_data.country,
        phone_number=user_data.phone_number,
        company_name=user_data.company_name,
        user_tier=user_data.user_tier or UserTier.INDIVIDUAL,
        verification_status=VerificationStatus.PENDING
    )
    
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    
    return UserResponse(
        id=str(new_user.id),
        email=new_user.email,
        username=new_user.username,
        full_name=new_user.full_name,
        user_tier=new_user.user_tier.value,
        verification_status=new_user.verification_status.value,
        kyc_completed=new_user.kyc_completed,
        is_active=new_user.is_active,
        created_at=new_user.created_at
    )

@router.post("/login")
async def login_user(user_credentials: UserLogin, db: Session = Depends(get_db)):
    """Authenticate user and return access token"""
    
    user = db.query(User).filter(User.email == user_credentials.email).first()
    
    if not user or not verify_password(user_credentials.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Account is deactivated"
        )
    
    # Update last login
    user.last_login = datetime.utcnow()
    db.commit()
    
    # Create access token
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.email, "user_id": str(user.id)}, 
        expires_delta=access_token_expires
    )
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "expires_in": ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        "user": UserResponse(
            id=str(user.id),
            email=user.email,
            username=user.username,
            full_name=user.full_name,
            user_tier=user.user_tier.value,
            verification_status=user.verification_status.value,
            kyc_completed=user.kyc_completed,
            is_active=user.is_active,
            created_at=user.created_at
        )
    }

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security), db: Session = Depends(get_db)):
    """Get current authenticated user"""
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    try:
        payload = jwt.decode(credentials.credentials, SECRET_KEY, algorithms=[ALGORITHM])
        email: str = payload.get("sub")
        if email is None:
            raise credentials_exception
    except jwt.PyJWTError:
        raise credentials_exception
    
    user = db.query(User).filter(User.email == email).first()
    if user is None:
        raise credentials_exception
    
    return user

@router.get("/me", response_model=UserResponse)
async def get_user_profile(current_user: User = Depends(get_current_user)):
    """Get current user profile"""
    return UserResponse(
        id=str(current_user.id),
        email=current_user.email,
        username=current_user.username,
        full_name=current_user.full_name,
        user_tier=current_user.user_tier.value,
        verification_status=current_user.verification_status.value,
        kyc_completed=current_user.kyc_completed,
        is_active=current_user.is_active,
        created_at=current_user.created_at
    )

@router.post("/upgrade-credentials")
async def upgrade_user_credentials(
    upgrade_data: CredentialUpgrade,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Upgrade user credentials to higher tier"""
    
    # Validate upgrade path
    valid_upgrades = {
        UserTier.INDIVIDUAL: [UserTier.CORPORATE, UserTier.PROFESSIONAL],
        UserTier.CORPORATE: [UserTier.INSTITUTIONAL],
        UserTier.PROFESSIONAL: [UserTier.INSTITUTIONAL]
    }
    
    if upgrade_data.target_tier not in valid_upgrades.get(current_user.user_tier, []):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid upgrade path"
        )
    
    # Update user tier and reset verification
    current_user.user_tier = upgrade_data.target_tier
    current_user.verification_status = VerificationStatus.PENDING
    current_user.kyc_completed = False
    current_user.business_registration = upgrade_data.business_registration
    current_user.company_name = upgrade_data.company_name
    
    # Update trading limits based on tier
    if upgrade_data.target_tier == UserTier.CORPORATE:
        current_user.daily_trading_limit = 100000.00
        current_user.monthly_trading_limit = 1000000.00
    elif upgrade_data.target_tier == UserTier.INSTITUTIONAL:
        current_user.daily_trading_limit = 1000000.00
        current_user.monthly_trading_limit = 10000000.00
    elif upgrade_data.target_tier == UserTier.PROFESSIONAL:
        current_user.daily_trading_limit = 500000.00
        current_user.monthly_trading_limit = 5000000.00
    
    db.commit()
    
    return {
        "message": "Credential upgrade initiated",
        "new_tier": current_user.user_tier.value,
        "verification_required": True,
        "new_limits": {
            "daily": float(current_user.daily_trading_limit),
            "monthly": float(current_user.monthly_trading_limit)
        }
    }