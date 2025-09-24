# ================================================================================
# AUREX LAUNCHPAD™ JWT AUTHENTICATION SYSTEM
# Database-based JWT authentication with comprehensive security features
# Ticket: LAUNCHPAD-101 - JWT Authentication System (8 story points)
# Created: August 4, 2025
# Security: bcrypt password hashing, JWT tokens, refresh token rotation
# ================================================================================

import os
import jwt
import hashlib
from datetime import datetime, timedelta
from typing import Optional, Dict, Any, Tuple
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
from passlib.context import CryptContext
from fastapi import HTTPException, status
from database_models import User, RefreshToken, Organization
import uuid
import secrets

# Security configuration
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# JWT Configuration (load from environment)
JWT_SECRET_KEY = os.getenv("JWT_SECRET_KEY", "your-jwt-secret-key-change-in-production")
JWT_ALGORITHM = "HS256"
JWT_ACCESS_TOKEN_EXPIRE_MINUTES = 30
JWT_REFRESH_TOKEN_EXPIRE_DAYS = 30

class AuthenticationError(Exception):
    """Custom authentication exception"""
    pass

class AuthorizationError(Exception):
    """Custom authorization exception"""
    pass

class TokenManager:
    """JWT Token management with refresh token rotation"""
    
    @staticmethod
    def create_access_token(data: Dict[str, Any], expires_delta: Optional[timedelta] = None) -> str:
        """Create JWT access token"""
        to_encode = data.copy()
        
        if expires_delta:
            expire = datetime.utcnow() + expires_delta
        else:
            expire = datetime.utcnow() + timedelta(minutes=JWT_ACCESS_TOKEN_EXPIRE_MINUTES)
        
        to_encode.update({
            "exp": expire,
            "iat": datetime.utcnow(),
            "type": "access"
        })
        
        encoded_jwt = jwt.encode(to_encode, JWT_SECRET_KEY, algorithm=JWT_ALGORITHM)
        return encoded_jwt
    
    @staticmethod
    def create_refresh_token(user_id: str, db: Session, user_agent: str = None, ip_address: str = None) -> str:
        """Create and store refresh token"""
        # Generate cryptographically secure token
        token = secrets.token_urlsafe(32)
        token_hash = hashlib.sha256(token.encode()).hexdigest()
        
        # Store in database
        refresh_token = RefreshToken(
            user_id=uuid.UUID(user_id),
            token_hash=token_hash,
            expires_at=datetime.utcnow() + timedelta(days=JWT_REFRESH_TOKEN_EXPIRE_DAYS),
            user_agent=user_agent,
            ip_address=ip_address
        )
        
        # Clean up old tokens for user (keep only 5 most recent)
        old_tokens = db.query(RefreshToken).filter(
            RefreshToken.user_id == user_id
        ).order_by(RefreshToken.created_at.desc()).offset(5).all()
        
        for old_token in old_tokens:
            db.delete(old_token)
        
        db.add(refresh_token)
        db.commit()
        
        return token
    
    @staticmethod
    def verify_token(token: str, token_type: str = "access") -> Dict[str, Any]:
        """Verify and decode JWT token"""
        try:
            payload = jwt.decode(token, JWT_SECRET_KEY, algorithms=[JWT_ALGORITHM])
            
            # Verify token type
            if payload.get("type") != token_type:
                raise AuthenticationError("Invalid token type")
            
            # Check expiration
            exp = payload.get("exp")
            if exp and datetime.utcnow() > datetime.fromtimestamp(exp):
                raise AuthenticationError("Token has expired")
            
            return payload
            
        except jwt.ExpiredSignatureError:
            raise AuthenticationError("Token has expired")
        except jwt.JWTError:
            raise AuthenticationError("Invalid token")
    
    @staticmethod
    def refresh_access_token(refresh_token: str, db: Session, user_agent: str = None) -> Tuple[str, str]:
        """Refresh access token using refresh token"""
        # Hash the provided token
        token_hash = hashlib.sha256(refresh_token.encode()).hexdigest()
        
        # Find the refresh token in database
        db_token = db.query(RefreshToken).filter(
            RefreshToken.token_hash == token_hash,
            RefreshToken.expires_at > datetime.utcnow(),
            RefreshToken.revoked_at.is_(None)
        ).first()
        
        if not db_token:
            raise AuthenticationError("Invalid or expired refresh token")
        
        # Get user
        user = db.query(User).filter(User.id == db_token.user_id).first()
        if not user or not user.is_active:
            raise AuthenticationError("User not found or inactive")
        
        # Revoke the used refresh token (rotation)
        db_token.revoked_at = datetime.utcnow()
        db.commit()
        
        # Create new tokens
        access_token = TokenManager.create_access_token(
            data={
                "sub": str(user.id),
                "email": user.email,
                "organization_id": str(user.organization_id) if user.organization_id else None
            }
        )
        
        new_refresh_token = TokenManager.create_refresh_token(
            str(user.id), db, user_agent, db_token.ip_address
        )
        
        return access_token, new_refresh_token
    
    @staticmethod
    def revoke_refresh_token(refresh_token: str, db: Session) -> bool:
        """Revoke a refresh token"""
        token_hash = hashlib.sha256(refresh_token.encode()).hexdigest()
        
        db_token = db.query(RefreshToken).filter(
            RefreshToken.token_hash == token_hash,
            RefreshToken.revoked_at.is_(None)
        ).first()
        
        if db_token:
            db_token.revoked_at = datetime.utcnow()
            db.commit()
            return True
        
        return False

class AuthService:
    """Authentication service with comprehensive user management"""
    
    def __init__(self, db: Session):
        self.db = db
    
    def authenticate_user(self, email: str, password: str) -> Optional[User]:
        """Authenticate user with email and password"""
        user = self.db.query(User).filter(User.email == email).first()
        
        if not user:
            return None
        
        if not user.is_active:
            raise AuthenticationError("Account is deactivated")
        
        if not user.verify_password(password):
            return None
        
        # Update last login
        user.last_login = datetime.utcnow()
        self.db.commit()
        
        return user
    
    def create_user(self, email: str, password: str, first_name: str, last_name: str, 
                   organization_id: Optional[str] = None) -> User:
        """Create new user account"""
        # Check if user already exists
        existing_user = self.db.query(User).filter(User.email == email).first()
        if existing_user:
            raise AuthenticationError("User with this email already exists")
        
        # Validate organization if provided
        if organization_id:
            org = self.db.query(Organization).filter(Organization.id == organization_id).first()
            if not org or not org.is_active:
                raise AuthenticationError("Invalid organization")
        
        # Create user
        user = User(
            email=email.lower().strip(),
            first_name=first_name.strip(),
            last_name=last_name.strip(),
            organization_id=uuid.UUID(organization_id) if organization_id else None
        )
        user.set_password(password)
        
        try:
            self.db.add(user)
            self.db.commit()
            self.db.refresh(user)
            return user
        except IntegrityError:
            self.db.rollback()
            raise AuthenticationError("User with this email already exists")
    
    def login(self, email: str, password: str, user_agent: str = None, 
             ip_address: str = None) -> Dict[str, Any]:
        """User login with JWT token generation"""
        user = self.authenticate_user(email, password)
        
        if not user:
            raise AuthenticationError("Invalid email or password")
        
        # Create JWT tokens
        access_token = TokenManager.create_access_token(
            data={
                "sub": str(user.id),
                "email": user.email,
                "organization_id": str(user.organization_id) if user.organization_id else None
            }
        )
        
        refresh_token = TokenManager.create_refresh_token(
            str(user.id), self.db, user_agent, ip_address
        )
        
        return {
            "access_token": access_token,
            "refresh_token": refresh_token,
            "token_type": "bearer",
            "expires_in": JWT_ACCESS_TOKEN_EXPIRE_MINUTES * 60,
            "user": user.to_dict()
        }
    
    def register(self, email: str, password: str, first_name: str, last_name: str,
                organization_id: Optional[str] = None, user_agent: str = None,
                ip_address: str = None) -> Dict[str, Any]:
        """User registration with automatic login"""
        # Password validation
        if len(password) < 8:
            raise AuthenticationError("Password must be at least 8 characters long")
        
        # Create user
        user = self.create_user(email, password, first_name, last_name, organization_id)
        
        # Auto-login after registration
        return self.login(email, password, user_agent, ip_address)
    
    def logout(self, refresh_token: str) -> bool:
        """User logout - revoke refresh token"""
        return TokenManager.revoke_refresh_token(refresh_token, self.db)
    
    def logout_all_devices(self, user_id: str) -> int:
        """Logout user from all devices"""
        revoked_count = self.db.query(RefreshToken).filter(
            RefreshToken.user_id == user_id,
            RefreshToken.revoked_at.is_(None)
        ).update({"revoked_at": datetime.utcnow()})
        
        self.db.commit()
        return revoked_count
    
    def change_password(self, user_id: str, current_password: str, new_password: str) -> bool:
        """Change user password"""
        user = self.db.query(User).filter(User.id == user_id).first()
        
        if not user:
            raise AuthenticationError("User not found")
        
        if not user.verify_password(current_password):
            raise AuthenticationError("Current password is incorrect")
        
        if len(new_password) < 8:
            raise AuthenticationError("New password must be at least 8 characters long")
        
        user.set_password(new_password)
        self.db.commit()
        
        # Revoke all refresh tokens to force re-login
        self.logout_all_devices(str(user_id))
        
        return True
    
    def request_password_reset(self, email: str) -> Optional[str]:
        """Request password reset token"""
        user = self.db.query(User).filter(User.email == email).first()
        
        if not user:
            # Don't reveal if email exists
            return None
        
        # Generate secure reset token
        reset_token = secrets.token_urlsafe(32)
        user.password_reset_token = hashlib.sha256(reset_token.encode()).hexdigest()
        user.password_reset_expires = datetime.utcnow() + timedelta(hours=1)  # 1 hour expiry
        
        self.db.commit()
        
        return reset_token
    
    def reset_password(self, reset_token: str, new_password: str) -> bool:
        """Reset password using reset token"""
        token_hash = hashlib.sha256(reset_token.encode()).hexdigest()
        
        user = self.db.query(User).filter(
            User.password_reset_token == token_hash,
            User.password_reset_expires > datetime.utcnow()
        ).first()
        
        if not user:
            raise AuthenticationError("Invalid or expired reset token")
        
        if len(new_password) < 8:
            raise AuthenticationError("Password must be at least 8 characters long")
        
        # Update password and clear reset token
        user.set_password(new_password)
        user.password_reset_token = None
        user.password_reset_expires = None
        
        self.db.commit()
        
        # Revoke all refresh tokens
        self.logout_all_devices(str(user.id))
        
        return True
    
    def get_current_user(self, token: str) -> User:
        """Get current user from JWT token"""
        try:
            payload = TokenManager.verify_token(token)
            user_id = payload.get("sub")
            
            if not user_id:
                raise AuthenticationError("Invalid token payload")
            
            user = self.db.query(User).filter(User.id == user_id).first()
            
            if not user or not user.is_active:
                raise AuthenticationError("User not found or inactive")
            
            return user
            
        except AuthenticationError:
            raise
        except Exception as e:
            raise AuthenticationError(f"Token validation failed: {str(e)}")

class PermissionManager:
    """Role-based permission management"""
    
    @staticmethod
    def check_permission(user: User, permission: str, organization_id: Optional[str] = None) -> bool:
        """Check if user has specific permission"""
        # Super admin has all permissions
        if any(role.role.name == "Super Admin" for role in user.user_roles):
            return True
        
        # Check organization-specific permissions
        for user_role in user.user_roles:
            if organization_id and str(user_role.organization_id) != organization_id:
                continue
            
            role_permissions = user_role.role.permissions or []
            
            # Check wildcard permissions
            if "*" in role_permissions:
                return True
            
            # Check specific permission
            if permission in role_permissions:
                return True
            
            # Check namespace permissions (e.g., "org:*" for "org:read")
            permission_parts = permission.split(":")
            if len(permission_parts) == 2:
                namespace_wildcard = f"{permission_parts[0]}:*"
                if namespace_wildcard in role_permissions:
                    return True
        
        return False
    
    @staticmethod
    def require_permission(user: User, permission: str, organization_id: Optional[str] = None):
        """Require specific permission or raise authorization error"""
        if not PermissionManager.check_permission(user, permission, organization_id):
            raise AuthorizationError(f"Permission denied: {permission}")

# ================================================================================
# SECURITY UTILITIES
# ================================================================================

def generate_secure_token(length: int = 32) -> str:
    """Generate cryptographically secure token"""
    return secrets.token_urlsafe(length)

def hash_token(token: str) -> str:
    """Hash token using SHA-256"""
    return hashlib.sha256(token.encode()).hexdigest()

def validate_password_strength(password: str) -> Dict[str, Any]:
    """Validate password strength"""
    issues = []
    score = 0
    
    if len(password) >= 8:
        score += 1
    else:
        issues.append("Password must be at least 8 characters long")
    
    if any(c.isupper() for c in password):
        score += 1
    else:
        issues.append("Password should contain uppercase letters")
    
    if any(c.islower() for c in password):
        score += 1
    else:
        issues.append("Password should contain lowercase letters")
    
    if any(c.isdigit() for c in password):
        score += 1
    else:
        issues.append("Password should contain numbers")
    
    if any(c in "!@#$%^&*()_+-=[]{}|;:,.<>?" for c in password):
        score += 1
    else:
        issues.append("Password should contain special characters")
    
    strength_levels = ["Very Weak", "Weak", "Fair", "Good", "Strong"]
    strength = strength_levels[min(score, 4)]
    
    return {
        "score": score,
        "strength": strength,
        "is_valid": score >= 3,
        "issues": issues
    }

# ================================================================================
# TOKEN CLEANUP UTILITIES
# ================================================================================

def cleanup_expired_tokens(db: Session) -> int:
    """Clean up expired refresh tokens"""
    expired_count = db.query(RefreshToken).filter(
        RefreshToken.expires_at < datetime.utcnow()
    ).delete()
    
    db.commit()
    return expired_count

def cleanup_revoked_tokens(db: Session, days_old: int = 7) -> int:
    """Clean up old revoked tokens"""
    cutoff_date = datetime.utcnow() - timedelta(days=days_old)
    
    revoked_count = db.query(RefreshToken).filter(
        RefreshToken.revoked_at < cutoff_date
    ).delete()
    
    db.commit()
    return revoked_count

# ================================================================================
# AUTHENTICATION MODULE VALIDATION
# ================================================================================

print("Aurex Launchpad JWT Authentication System Loaded Successfully!")
print("Features:")
print("✅ JWT Access & Refresh Tokens")
print("✅ Bcrypt Password Hashing")
print("✅ Token Rotation Security")
print("✅ Role-Based Permissions")
print("✅ Password Reset Flow")
print("✅ Multi-Device Logout")
print("✅ Security Token Cleanup")
print("✅ Password Strength Validation")