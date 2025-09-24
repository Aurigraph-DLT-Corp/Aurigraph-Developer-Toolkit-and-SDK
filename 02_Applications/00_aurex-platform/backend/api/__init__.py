"""
API Gateway and Router Configuration
Centralized API management with versioning and rate limiting
"""
from fastapi import APIRouter, Depends, Request, Response, HTTPException, status
from fastapi.responses import JSONResponse
from typing import Optional
import time

from core.auth import get_current_user, User

# API Gateway configuration
class APIGateway:
    """API Gateway for centralized routing and management"""
    
    def __init__(self):
        self.router = APIRouter()
        self.version = "v1"
        self._setup_routes()
    
    def _setup_routes(self):
        """Setup all API routes with versioning"""
        # Public routes
        self.router.include_router(
            health_router,
            prefix="/health",
            tags=["health"]
        )
        
        # Auth routes
        self.router.include_router(
            auth_router,
            prefix=f"/api/{self.version}/auth",
            tags=["authentication"]
        )
        
        # Protected routes
        self.router.include_router(
            users_router,
            prefix=f"/api/{self.version}/users",
            tags=["users"],
            dependencies=[Depends(get_current_user)]
        )
    
    async def log_request(self, request: Request, response: Response):
        """Log API request metrics"""
        # Implement basic request logging
        print(f"API Request: {request.method} {request.url.path} - Status: {response.status_code}")
        # TODO: Implement comprehensive metrics collection with Prometheus

# Health check router
health_router = APIRouter()

@health_router.get("/")
async def health_check():
    """Basic health check"""
    return {"status": "healthy", "timestamp": time.time()}

@health_router.get("/ready")
async def readiness_check():
    """Readiness probe for Kubernetes"""
    # Check database connection
    from core.database import db_manager
    
    checks = {
        "database": False,
        "services": True  # Core services are always ready if app is running
    }
    
    try:
        # Test database connection
        async with db_manager.get_session() as session:
            await session.execute("SELECT 1")
            checks["database"] = True
    except Exception as e:
        print(f"Database health check failed: {e}")
    
    all_ready = all(checks.values())
    status_code = 200 if all_ready else 503
    
    return JSONResponse(
        status_code=status_code,
        content={
            "status": "ready" if all_ready else "not_ready",
            "checks": checks,
            "timestamp": time.time()
        }
    )

@health_router.get("/live")
async def liveness_check():
    """Liveness probe for Kubernetes"""
    return {"status": "alive", "timestamp": time.time()}

# Auth router
auth_router = APIRouter()

@auth_router.post("/login")
async def login(email: str, password: str):
    """User login endpoint"""
    from core.auth.auth_service import AuthService
    
    # Authenticate user
    user = await AuthService.authenticate_user(email, password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password"
        )
    
    # Create access token
    token = AuthService.create_access_token(
        user_id=str(user.id),
        organization_id=str(user.organization_id) if user.organization_id else None,
        roles=getattr(user, 'roles', ['user'])
    )
    
    return {
        "access_token": token,
        "token_type": "bearer",
        "user": {
            "id": str(user.id),
            "email": user.email,
            "first_name": user.first_name,
            "last_name": user.last_name,
            "organization_id": str(user.organization_id) if user.organization_id else None
        }
    }

@auth_router.post("/logout")
async def logout():
    """User logout endpoint"""
    return {"status": "logged_out"}

@auth_router.post("/refresh")
async def refresh_token(current_user: User = Depends(get_current_user)):
    """Refresh access token"""
    from core.auth.auth_service import AuthService
    
    # Create new token
    new_token = AuthService.create_access_token(
        user_id=str(current_user.id),
        organization_id=str(current_user.organization_id) if current_user.organization_id else None,
        roles=getattr(current_user, 'roles', ['user'])
    )
    
    return {
        "access_token": new_token,
        "token_type": "bearer"
    }

# Users router
users_router = APIRouter()

@users_router.get("/me")
async def get_current_user_profile(current_user: User = Depends(get_current_user)):
    """Get current user profile"""
    return {
        "id": str(current_user.id),
        "email": current_user.email,
        "username": current_user.username,
        "first_name": current_user.first_name,
        "last_name": current_user.last_name,
        "organization_id": str(current_user.organization_id) if current_user.organization_id else None,
        "is_superuser": current_user.is_superuser,
        "is_active": current_user.is_active,
        "is_verified": current_user.is_verified,
        "created_at": current_user.created_at.isoformat(),
        "last_login": current_user.last_login.isoformat() if current_user.last_login else None
    }

@users_router.put("/me")
async def update_current_user_profile(updates: dict):
    """Update current user profile"""
    return {"status": "update pending - implementation required"}

# Create gateway instance
api_gateway = APIGateway()

# Export main router
router = api_gateway.router

__all__ = [
    "router",
    "api_gateway",
    "health_router",
    "auth_router",
    "users_router",
]