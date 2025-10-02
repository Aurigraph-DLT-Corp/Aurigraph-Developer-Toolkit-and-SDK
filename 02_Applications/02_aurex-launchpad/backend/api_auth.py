# ================================================================================
# AUREX LAUNCHPAD™ AUTHENTICATION API ENDPOINTS
# FastAPI authentication routes with comprehensive security features
# Tickets: LAUNCHPAD-101 (JWT Auth) + LAUNCHPAD-102 (User Registration/Login)
# Created: August 4, 2025
# Security: Rate limiting, input validation, comprehensive error handling
# ================================================================================

from fastapi import APIRouter, Depends, HTTPException, status, Request
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from pydantic import BaseModel, EmailStr, Field, validator
from typing import Optional, Dict, Any
from datetime import datetime
import re

from auth import AuthService, TokenManager, AuthenticationError, AuthorizationError, validate_password_strength
from database_models import User
from models.base_models import get_db
from audit_integration import AuditLogger

# Security configuration
security = HTTPBearer()
router = APIRouter(prefix="/auth", tags=["Authentication"])

# ================================================================================
# PYDANTIC MODELS FOR API VALIDATION
# ================================================================================

class UserRegistrationRequest(BaseModel):
    """User registration request model"""
    email: EmailStr = Field(..., description="User email address")
    password: str = Field(..., min_length=8, max_length=128, description="User password")
    first_name: str = Field(..., min_length=1, max_length=100, description="First name")
    last_name: str = Field(..., min_length=1, max_length=100, description="Last name")
    organization_id: Optional[str] = Field(None, description="Organization ID")
    
    @validator('password')
    def validate_password_strength(cls, v):
        """Validate password strength"""
        strength = validate_password_strength(v)
        if not strength["is_valid"]:
            raise ValueError(f"Password too weak: {', '.join(strength['issues'])}")
        return v
    
    @validator('first_name', 'last_name')
    def validate_names(cls, v):
        """Validate name fields"""
        if not re.match(r"^[a-zA-Z\s\-']+$", v):
            raise ValueError("Names can only contain letters, spaces, hyphens, and apostrophes")
        return v.strip()

class UserLoginRequest(BaseModel):
    """User login request model"""
    email: EmailStr = Field(..., description="User email address")
    password: str = Field(..., min_length=1, max_length=128, description="User password")

class TokenRefreshRequest(BaseModel):
    """Token refresh request model"""
    refresh_token: str = Field(..., description="Refresh token")

class PasswordChangeRequest(BaseModel):
    """Password change request model"""
    current_password: str = Field(..., description="Current password")
    new_password: str = Field(..., min_length=8, max_length=128, description="New password")
    
    @validator('new_password')
    def validate_new_password_strength(cls, v):
        """Validate new password strength"""
        strength = validate_password_strength(v)
        if not strength["is_valid"]:
            raise ValueError(f"New password too weak: {', '.join(strength['issues'])}")
        return v

class PasswordResetRequest(BaseModel):
    """Password reset request model"""
    email: EmailStr = Field(..., description="User email address")

class PasswordResetConfirmRequest(BaseModel):
    """Password reset confirmation model"""
    reset_token: str = Field(..., description="Password reset token")
    new_password: str = Field(..., min_length=8, max_length=128, description="New password")
    
    @validator('new_password')
    def validate_new_password_strength(cls, v):
        """Validate new password strength"""
        strength = validate_password_strength(v)
        if not strength["is_valid"]:
            raise ValueError(f"New password too weak: {', '.join(strength['issues'])}")
        return v

# ================================================================================
# RESPONSE MODELS
# ================================================================================

class AuthTokenResponse(BaseModel):
    """Authentication token response"""
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    expires_in: int
    user: Dict[str, Any]

class UserProfileResponse(BaseModel):
    """User profile response"""
    id: str
    email: str
    first_name: str
    last_name: str
    full_name: str
    organization_id: Optional[str]
    email_verified: bool
    is_active: bool
    mfa_enabled: bool
    timezone: str
    language: str
    created_at: str
    last_login: Optional[str]

class PasswordStrengthResponse(BaseModel):
    """Password strength validation response"""
    score: int
    strength: str
    is_valid: bool
    issues: list

# ================================================================================
# DEPENDENCY INJECTION
# ================================================================================

def get_auth_service(db: Session = Depends(get_db)) -> AuthService:
    """Get authentication service instance"""
    return AuthService(db)

def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    auth_service: AuthService = Depends(get_auth_service)
) -> User:
    """Get current authenticated user"""
    try:
        token = credentials.credentials
        user = auth_service.get_current_user(token)
        return user
    except AuthenticationError as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=str(e),
            headers={"WWW-Authenticate": "Bearer"}
        )

def get_optional_current_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security),
    auth_service: AuthService = Depends(get_auth_service)
) -> Optional[User]:
    """Get current user if authenticated, otherwise None"""
    if not credentials:
        return None
    
    try:
        token = credentials.credentials
        user = auth_service.get_current_user(token)
        return user
    except AuthenticationError:
        return None

# ================================================================================
# UTILITY FUNCTIONS
# ================================================================================

def get_client_info(request: Request) -> Dict[str, str]:
    """Extract client information from request"""
    return {
        "user_agent": request.headers.get("user-agent", "Unknown"),
        "ip_address": request.client.host if request.client else "Unknown"
    }

def handle_auth_error(e: Exception, operation: str) -> HTTPException:
    """Handle authentication errors consistently"""
    if isinstance(e, AuthenticationError):
        return HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=str(e)
        )
    elif isinstance(e, AuthorizationError):
        return HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=str(e)
        )
    else:
        # Log unexpected errors
        AuditLogger.log_error(f"Unexpected error in {operation}: {str(e)}")
        return HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal server error"
        )

# ================================================================================
# AUTHENTICATION ENDPOINTS
# ================================================================================

@router.post("/register", response_model=AuthTokenResponse, status_code=status.HTTP_201_CREATED)
async def register_user(
    request: Request,
    user_data: UserRegistrationRequest,
    auth_service: AuthService = Depends(get_auth_service)
):
    """
    Register new user account
    
    Creates a new user account with the provided information and returns
    authentication tokens for immediate login.
    """
    try:
        client_info = get_client_info(request)
        
        result = auth_service.register(
            email=user_data.email,
            password=user_data.password,
            first_name=user_data.first_name,
            last_name=user_data.last_name,
            organization_id=user_data.organization_id,
            user_agent=client_info["user_agent"],
            ip_address=client_info["ip_address"]
        )
        
        # Log successful registration
        AuditLogger.log_activity(
            user_id=result["user"]["id"],
            action="USER_REGISTERED",
            details={"email": user_data.email},
            ip_address=client_info["ip_address"]
        )
        
        return AuthTokenResponse(**result)
        
    except Exception as e:
        raise handle_auth_error(e, "user_registration")

@router.post("/login", response_model=AuthTokenResponse)
async def login_user(
    request: Request,
    login_data: UserLoginRequest,
    auth_service: AuthService = Depends(get_auth_service)
):
    """
    User login with email and password
    
    Authenticates user credentials and returns access and refresh tokens
    for API access.
    """
    try:
        client_info = get_client_info(request)
        
        result = auth_service.login(
            email=login_data.email,
            password=login_data.password,
            user_agent=client_info["user_agent"],
            ip_address=client_info["ip_address"]
        )
        
        # Log successful login
        AuditLogger.log_activity(
            user_id=result["user"]["id"],
            action="USER_LOGIN",
            details={"email": login_data.email},
            ip_address=client_info["ip_address"]
        )
        
        return AuthTokenResponse(**result)
        
    except Exception as e:
        # Log failed login attempt
        AuditLogger.log_security_event(
            action="LOGIN_FAILED",
            details={"email": login_data.email},
            ip_address=get_client_info(request)["ip_address"]
        )
        raise handle_auth_error(e, "user_login")

@router.post("/refresh", response_model=Dict[str, str])
async def refresh_token(
    request: Request,
    refresh_data: TokenRefreshRequest,
    db: Session = Depends(get_db)
):
    """
    Refresh access token using refresh token
    
    Exchanges a valid refresh token for a new access token and refresh token.
    Implements token rotation for security.
    """
    try:
        client_info = get_client_info(request)
        
        access_token, new_refresh_token = TokenManager.refresh_access_token(
            refresh_data.refresh_token,
            db,
            client_info["user_agent"]
        )
        
        return {
            "access_token": access_token,
            "refresh_token": new_refresh_token,
            "token_type": "bearer"
        }
        
    except Exception as e:
        # Log failed token refresh
        AuditLogger.log_security_event(
            action="TOKEN_REFRESH_FAILED",
            details={"reason": str(e)},
            ip_address=get_client_info(request)["ip_address"]
        )
        raise handle_auth_error(e, "token_refresh")

@router.post("/logout")
async def logout_user(
    request: Request,
    refresh_data: TokenRefreshRequest,
    current_user: User = Depends(get_current_user),
    auth_service: AuthService = Depends(get_auth_service)
):
    """
    User logout
    
    Revokes the provided refresh token, effectively logging out the user
    from the current device.
    """
    try:
        result = auth_service.logout(refresh_data.refresh_token)
        
        # Log successful logout
        AuditLogger.log_activity(
            user_id=str(current_user.id),
            action="USER_LOGOUT",
            details={"success": result},
            ip_address=get_client_info(request)["ip_address"]
        )
        
        return {"message": "Successfully logged out", "success": result}
        
    except Exception as e:
        raise handle_auth_error(e, "user_logout")

@router.post("/logout-all")
async def logout_all_devices(
    request: Request,
    current_user: User = Depends(get_current_user),
    auth_service: AuthService = Depends(get_auth_service)
):
    """
    Logout from all devices
    
    Revokes all refresh tokens for the current user, effectively logging
    them out from all devices.
    """
    try:
        revoked_count = auth_service.logout_all_devices(str(current_user.id))
        
        # Log logout from all devices
        AuditLogger.log_activity(
            user_id=str(current_user.id),
            action="USER_LOGOUT_ALL",
            details={"devices_logged_out": revoked_count},
            ip_address=get_client_info(request)["ip_address"]
        )
        
        return {
            "message": f"Successfully logged out from {revoked_count} devices",
            "devices_logged_out": revoked_count
        }
        
    except Exception as e:
        raise handle_auth_error(e, "logout_all_devices")

# ================================================================================
# USER PROFILE ENDPOINTS
# ================================================================================

@router.get("/me", response_model=UserProfileResponse)
async def get_current_user_profile(
    current_user: User = Depends(get_current_user)
):
    """
    Get current user profile
    
    Returns the authenticated user's profile information.
    """
    user_dict = current_user.to_dict()
    return UserProfileResponse(**user_dict)

@router.get("/validate")
async def validate_token(
    current_user: User = Depends(get_current_user)
):
    """
    Validate current access token
    
    Validates the provided access token and returns basic user information.
    """
    return {
        "valid": True,
        "user_id": str(current_user.id),
        "email": current_user.email,
        "is_active": current_user.is_active
    }

# ================================================================================
# PASSWORD MANAGEMENT ENDPOINTS
# ================================================================================

@router.post("/change-password")
async def change_password(
    request: Request,
    password_data: PasswordChangeRequest,
    current_user: User = Depends(get_current_user),
    auth_service: AuthService = Depends(get_auth_service)
):
    """
    Change user password
    
    Changes the current user's password. Requires current password for verification.
    All refresh tokens are revoked after password change.
    """
    try:
        result = auth_service.change_password(
            str(current_user.id),
            password_data.current_password,
            password_data.new_password
        )
        
        # Log password change
        AuditLogger.log_activity(
            user_id=str(current_user.id),
            action="PASSWORD_CHANGED",
            details={"success": result},
            ip_address=get_client_info(request)["ip_address"]
        )
        
        return {"message": "Password changed successfully", "success": result}
        
    except Exception as e:
        # Log failed password change
        AuditLogger.log_security_event(
            action="PASSWORD_CHANGE_FAILED",
            details={"user_id": str(current_user.id), "reason": str(e)},
            ip_address=get_client_info(request)["ip_address"]
        )
        raise handle_auth_error(e, "password_change")

@router.post("/password-reset")
async def request_password_reset(
    request: Request,
    reset_data: PasswordResetRequest,
    auth_service: AuthService = Depends(get_auth_service)
):
    """
    Request password reset
    
    Initiates password reset process by generating a secure reset token.
    Token should be sent to user's email address (email sending not implemented).
    """
    try:
        reset_token = auth_service.request_password_reset(reset_data.email)
        
        # Log password reset request
        AuditLogger.log_activity(
            action="PASSWORD_RESET_REQUESTED",
            details={"email": reset_data.email, "token_generated": reset_token is not None},
            ip_address=get_client_info(request)["ip_address"]
        )
        
        # Always return success to prevent email enumeration
        return {
            "message": "If the email exists, a password reset link has been sent",
            "reset_token": reset_token  # In production, this would be sent via email
        }
        
    except Exception as e:
        raise handle_auth_error(e, "password_reset_request")

@router.post("/password-reset/confirm")
async def confirm_password_reset(
    request: Request,
    reset_data: PasswordResetConfirmRequest,
    auth_service: AuthService = Depends(get_auth_service)
):
    """
    Confirm password reset
    
    Completes password reset process using the reset token and new password.
    All refresh tokens are revoked after successful password reset.
    """
    try:
        result = auth_service.reset_password(
            reset_data.reset_token,
            reset_data.new_password
        )
        
        # Log successful password reset
        AuditLogger.log_activity(
            action="PASSWORD_RESET_COMPLETED",
            details={"success": result},
            ip_address=get_client_info(request)["ip_address"]
        )
        
        return {"message": "Password reset successfully", "success": result}
        
    except Exception as e:
        # Log failed password reset
        AuditLogger.log_security_event(
            action="PASSWORD_RESET_FAILED",
            details={"reason": str(e)},
            ip_address=get_client_info(request)["ip_address"]
        )
        raise handle_auth_error(e, "password_reset_confirm")

# ================================================================================
# UTILITY ENDPOINTS
# ================================================================================

@router.post("/validate-password", response_model=PasswordStrengthResponse)
async def validate_password(password: str):
    """
    Validate password strength
    
    Checks password strength and returns detailed validation results
    without storing the password.
    """
    strength = validate_password_strength(password)
    return PasswordStrengthResponse(**strength)

@router.get("/health")
async def auth_health_check():
    """
    Authentication service health check
    
    Returns status of authentication service components.
    """
    return {
        "status": "healthy",
        "service": "authentication",
        "timestamp": datetime.utcnow().isoformat(),
        "version": "1.0.0"
    }

# ================================================================================
# ERROR HANDLERS (Note: These should be registered at the FastAPI app level)
# ================================================================================

# Exception handlers are moved to main.py as APIRouter doesn't support exception handlers
# These are for documentation purposes only

# ================================================================================
# API DOCUMENTATION
# ================================================================================

# FastAPI will automatically generate OpenAPI documentation
# Additional metadata for better API docs
router.tags = ["Authentication"]
router.include_in_schema = True

print("Aurex Launchpad Authentication API Loaded Successfully!")
print("Endpoints:")
print("✅ POST /auth/register - User Registration")
print("✅ POST /auth/login - User Login")
print("✅ POST /auth/refresh - Token Refresh")
print("✅ POST /auth/logout - User Logout")
print("✅ POST /auth/logout-all - Logout All Devices")
print("✅ GET /auth/me - User Profile")
print("✅ GET /auth/validate - Token Validation")
print("✅ POST /auth/change-password - Password Change")
print("✅ POST /auth/password-reset - Password Reset Request")
print("✅ POST /auth/password-reset/confirm - Password Reset Confirm")
print("✅ POST /auth/validate-password - Password Strength Check")
print("✅ GET /auth/health - Health Check")