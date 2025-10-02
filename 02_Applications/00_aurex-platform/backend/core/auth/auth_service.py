"""
Centralized Authentication Service
JWT-based authentication with multi-tenant support
"""
from datetime import datetime, timedelta
from typing import Optional, Dict, Any
from fastapi import HTTPException, status
from passlib.context import CryptContext
import jwt
from uuid import UUID, uuid4
import os

from ..database import db_manager
from ..audit import audit_logger
from .models import User, Organization, Session

JWT_SECRET = os.getenv("JWT_SECRET", "your-secret-key-change-in-production")
JWT_ALGORITHM = "HS256"
JWT_EXPIRATION_DELTA = timedelta(hours=24)

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

class AuthService:
    """Centralized authentication service for all Aurex applications"""
    
    @staticmethod
    def hash_password(password: str) -> str:
        """Hash password using bcrypt"""
        return pwd_context.hash(password)
    
    @staticmethod
    def verify_password(plain_password: str, hashed_password: str) -> bool:
        """Verify password against hash"""
        return pwd_context.verify(plain_password, hashed_password)
    
    @staticmethod
    def create_access_token(user_id: str, organization_id: str, roles: list) -> str:
        """Create JWT access token"""
        expires_at = datetime.utcnow() + JWT_EXPIRATION_DELTA
        payload = {
            "sub": user_id,
            "org": organization_id,
            "roles": roles,
            "exp": expires_at,
            "iat": datetime.utcnow(),
            "jti": str(uuid4())
        }
        return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)
    
    @staticmethod
    def decode_token(token: str) -> Dict[str, Any]:
        """Decode and validate JWT token"""
        try:
            payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
            return payload
        except jwt.ExpiredSignatureError:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Token has expired"
            )
        except jwt.InvalidTokenError:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid token"
            )
    
    @classmethod
    async def authenticate_user(cls, email: str, password: str) -> Optional[User]:
        """Authenticate user with email and password"""
        async with db_manager.get_session() as session:
            # Get user from database
            user = await session.query(User).filter(User.email == email).first()
            
            if not user or not cls.verify_password(password, user.password_hash):
                # Log failed attempt
                await audit_logger.log_event(
                    action="auth.login_failed",
                    resource_type="user",
                    resource_id=email,
                    details={"reason": "invalid_credentials"}
                )
                return None
            
            # Update last login
            user.last_login = datetime.utcnow()
            await session.commit()
            
            # Log successful login
            await audit_logger.log_event(
                user_id=str(user.id),
                action="auth.login_success",
                resource_type="user",
                resource_id=str(user.id)
            )
            
            return user
    
    @classmethod
    async def create_user(cls, email: str, password: str, organization_id: UUID, 
                         first_name: str, last_name: str, roles: list = None) -> User:
        """Create new user"""
        async with db_manager.get_session() as session:
            # Check if user exists
            existing = await session.query(User).filter(User.email == email).first()
            if existing:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="User with this email already exists"
                )
            
            # Create user
            user = User(
                id=uuid4(),
                email=email,
                password_hash=cls.hash_password(password),
                organization_id=organization_id,
                first_name=first_name,
                last_name=last_name,
                roles=roles or ["user"],
                is_active=True,
                created_at=datetime.utcnow()
            )
            
            session.add(user)
            await session.commit()
            
            # Log user creation
            await audit_logger.log_event(
                user_id=str(user.id),
                action="user.created",
                resource_type="user",
                resource_id=str(user.id),
                new_values={"email": email, "roles": roles}
            )
            
            return user
    
    @classmethod
    async def validate_session(cls, token: str) -> Optional[User]:
        """Validate session token and return user"""
        try:
            payload = cls.decode_token(token)
            user_id = payload.get("sub")
            
            async with db_manager.get_session() as session:
                user = await session.query(User).filter(User.id == user_id).first()
                
                if not user or not user.is_active:
                    return None
                
                return user
        except:
            return None

__all__ = ["AuthService"]