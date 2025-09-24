from sqlalchemy import Column, Integer, String, DateTime, Enum, Boolean, Text, DECIMAL
from sqlalchemy.dialects.postgresql import UUID
from database import Base
import uuid
from datetime import datetime
import enum

class UserTier(enum.Enum):
    INDIVIDUAL = "individual"
    CORPORATE = "corporate"
    INSTITUTIONAL = "institutional"
    PROFESSIONAL = "professional"

class VerificationStatus(enum.Enum):
    PENDING = "pending"
    VERIFIED = "verified"
    REJECTED = "rejected"
    SUSPENDED = "suspended"

class User(Base):
    __tablename__ = "users"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    email = Column(String(255), unique=True, nullable=False, index=True)
    username = Column(String(100), unique=True, nullable=False, index=True)
    full_name = Column(String(255), nullable=False)
    
    # Authentication
    password_hash = Column(String(255), nullable=False)
    is_active = Column(Boolean, default=True)
    email_verified = Column(Boolean, default=False)
    
    # User tier and verification
    user_tier = Column(Enum(UserTier), default=UserTier.INDIVIDUAL)
    verification_status = Column(Enum(VerificationStatus), default=VerificationStatus.PENDING)
    kyc_completed = Column(Boolean, default=False)
    aml_cleared = Column(Boolean, default=False)
    
    # Trading limits
    daily_trading_limit = Column(DECIMAL(15, 2), default=10000.00)
    monthly_trading_limit = Column(DECIMAL(15, 2), default=100000.00)
    total_trading_volume = Column(DECIMAL(15, 2), default=0.00)
    
    # Profile information
    country = Column(String(3))  # ISO country code
    phone_number = Column(String(20))
    company_name = Column(String(255))
    business_registration = Column(String(100))
    
    # KYC documents
    kyc_document_type = Column(String(50))
    kyc_document_number = Column(String(100))
    kyc_document_expiry = Column(DateTime)
    
    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    last_login = Column(DateTime)
    
    # Two-factor authentication
    two_fa_enabled = Column(Boolean, default=False)
    two_fa_secret = Column(String(32))
    
    # API access
    api_key = Column(String(64), unique=True)
    api_secret = Column(String(128))
    api_access_enabled = Column(Boolean, default=False)
    
    def __repr__(self):
        return f"<User(id={self.id}, email={self.email}, tier={self.user_tier})>"