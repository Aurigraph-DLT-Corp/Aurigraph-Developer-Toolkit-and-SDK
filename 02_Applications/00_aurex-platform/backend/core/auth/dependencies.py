"""Authentication dependencies for FastAPI"""
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from typing import Optional

from .auth_service import AuthService
from .models import User

# Security scheme
security = HTTPBearer()

async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security)
) -> User:
    """Get current authenticated user from JWT token"""
    auth_service = AuthService()
    
    token = credentials.credentials
    user = await auth_service.verify_token(token)
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    return user

async def require_permission(permission: str):
    """Dependency to check if user has specific permission"""
    async def permission_checker(current_user: User = Depends(get_current_user)):
        # TODO: Implement permission checking logic
        # For now, allow all authenticated users
        return current_user
    
    return permission_checker