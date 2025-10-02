from pydantic import BaseModel, EmailStr, validator
from typing import Optional
from datetime import datetime
from app.models.user import UserTier

class UserRegistration(BaseModel):
    email: EmailStr
    username: str
    full_name: str
    password: str
    country: Optional[str] = None
    phone_number: Optional[str] = None
    company_name: Optional[str] = None
    user_tier: Optional[UserTier] = UserTier.INDIVIDUAL
    
    @validator('username')
    def username_alphanumeric(cls, v):
        assert v.isalnum(), 'Username must be alphanumeric'
        assert len(v) >= 3, 'Username must be at least 3 characters'
        return v
    
    @validator('password')
    def password_strength(cls, v):
        assert len(v) >= 8, 'Password must be at least 8 characters'
        return v

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserResponse(BaseModel):
    id: str
    email: str
    username: str
    full_name: str
    user_tier: str
    verification_status: str
    kyc_completed: bool
    is_active: bool
    created_at: datetime
    
    class Config:
        from_attributes = True

class CredentialUpgrade(BaseModel):
    target_tier: UserTier
    company_name: Optional[str] = None
    business_registration: Optional[str] = None