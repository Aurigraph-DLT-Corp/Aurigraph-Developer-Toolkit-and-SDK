# ================================================================================
# Aurex Launchpad - Centralized API Router
# ================================================================================
# Description: Standardized API routing with authentication, validation, and monitoring
# Features: Route registration, middleware, error handling, rate limiting
# Compatible: FastAPI 0.104+, Pydantic V2
# ================================================================================

from fastapi import APIRouter, Depends, HTTPException, Request, status, Security
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.trustedhost import TrustedHostMiddleware
from typing import Optional, Dict, Any, List, Callable
import time
import logging
from datetime import datetime, timedelta
import asyncio
from collections import defaultdict
import os

# Configure logging
logger = logging.getLogger(__name__)

# Security scheme
security = HTTPBearer(auto_error=False)

# Rate limiting storage (in production, use Redis)
rate_limit_storage = defaultdict(list)

# ================================================================================
# AUTHENTICATION AND AUTHORIZATION
# ================================================================================

class AuthenticationService:
    """Centralized authentication service"""
    
    def __init__(self):
        self.jwt_secret = os.getenv("JWT_SECRET_KEY", "your-secret-key")
        self.jwt_algorithm = os.getenv("JWT_ALGORITHM", "HS256")
    
    async def verify_token(self, credentials: Optional[HTTPAuthorizationCredentials]) -> Optional[Dict[str, Any]]:
        """Verify JWT token and return user data"""
        if not credentials:
            return None
            
        try:
            # In production, use proper JWT verification
            # This is a simplified version
            token = credentials.credentials
            
            # TODO: Implement proper JWT verification
            # For now, return mock user data
            return {
                "user_id": "user_123",
                "email": "user@example.com",
                "role": "user",
                "organization_id": "org_123"
            }
            
        except Exception as e:
            logger.error(f"Token verification failed: {e}")
            return None

    async def require_auth(self, credentials: HTTPAuthorizationCredentials = Security(security)) -> Dict[str, Any]:
        """Require authentication for protected routes"""
        user_data = await self.verify_token(credentials)
        if not user_data:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid or missing authentication credentials",
                headers={"WWW-Authenticate": "Bearer"},
            )
        return user_data

    async def optional_auth(self, credentials: Optional[HTTPAuthorizationCredentials] = Security(security)) -> Optional[Dict[str, Any]]:
        """Optional authentication for public routes"""
        return await self.verify_token(credentials)

# Global authentication service
auth_service = AuthenticationService()

# ================================================================================
# RATE LIMITING
# ================================================================================

class RateLimiter:
    """Rate limiting implementation"""
    
    def __init__(self, requests_per_minute: int = 60):
        self.requests_per_minute = requests_per_minute
        self.window_size = 60  # 60 seconds

    def is_allowed(self, client_ip: str) -> bool:
        """Check if request is within rate limit"""
        now = time.time()
        
        # Clean old entries
        rate_limit_storage[client_ip] = [
            timestamp for timestamp in rate_limit_storage[client_ip]
            if now - timestamp < self.window_size
        ]
        
        # Check if under limit
        if len(rate_limit_storage[client_ip]) >= self.requests_per_minute:
            return False
            
        # Add current request
        rate_limit_storage[client_ip].append(now)
        return True

# Global rate limiter
rate_limiter = RateLimiter(
    requests_per_minute=int(os.getenv("RATE_LIMIT_REQUESTS_PER_MINUTE", "100"))
)

def rate_limit_dependency(request: Request):
    """Rate limiting dependency"""
    if os.getenv("RATE_LIMIT_ENABLED", "true").lower() == "true":
        client_ip = request.client.host
        if not rate_limiter.is_allowed(client_ip):
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail="Rate limit exceeded. Please try again later."
            )

# ================================================================================
# STANDARDIZED RESPONSE MODELS
# ================================================================================

class APIResponse:
    """Standardized API response format"""
    
    @staticmethod
    def success(data: Any = None, message: str = "Success", meta: Optional[Dict] = None) -> Dict[str, Any]:
        """Standard success response"""
        response = {
            "success": True,
            "message": message,
            "timestamp": datetime.utcnow().isoformat(),
            "data": data
        }
        
        if meta:
            response["meta"] = meta
            
        return response
    
    @staticmethod
    def error(message: str = "Error", error_code: Optional[str] = None, details: Optional[Dict] = None) -> Dict[str, Any]:
        """Standard error response"""
        response = {
            "success": False,
            "message": message,
            "timestamp": datetime.utcnow().isoformat(),
            "error": {
                "code": error_code,
                "details": details
            }
        }
        
        return response
    
    @staticmethod
    def paginated(data: List[Any], page: int, per_page: int, total: int, message: str = "Success") -> Dict[str, Any]:
        """Paginated response format"""
        return APIResponse.success(
            data=data,
            message=message,
            meta={
                "pagination": {
                    "page": page,
                    "per_page": per_page,
                    "total": total,
                    "total_pages": (total + per_page - 1) // per_page,
                    "has_next": page * per_page < total,
                    "has_prev": page > 1
                }
            }
        )

# ================================================================================
# CUSTOM EXCEPTION HANDLERS
# ================================================================================

async def validation_exception_handler(request: Request, exc: Exception):
    """Handle validation errors"""
    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content=APIResponse.error(
            message="Validation error",
            error_code="VALIDATION_ERROR",
            details={"errors": str(exc)}
        )
    )

async def http_exception_handler(request: Request, exc: HTTPException):
    """Handle HTTP exceptions"""
    return JSONResponse(
        status_code=exc.status_code,
        content=APIResponse.error(
            message=exc.detail,
            error_code="HTTP_ERROR",
            details={"status_code": exc.status_code}
        )
    )

async def general_exception_handler(request: Request, exc: Exception):
    """Handle general exceptions"""
    logger.error(f"Unhandled exception: {exc}", exc_info=True)
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content=APIResponse.error(
            message="Internal server error",
            error_code="INTERNAL_ERROR",
            details={"type": type(exc).__name__}
        )
    )

# ================================================================================
# ROUTER FACTORY
# ================================================================================

class RouterFactory:
    """Factory for creating standardized API routers"""
    
    @staticmethod
    def create_router(
        prefix: str,
        tags: List[str],
        dependencies: Optional[List[Depends]] = None,
        include_auth: bool = True,
        include_rate_limit: bool = True
    ) -> APIRouter:
        """Create a standardized API router"""
        
        router_dependencies = []
        
        # Add rate limiting
        if include_rate_limit:
            router_dependencies.append(Depends(rate_limit_dependency))
        
        # Add custom dependencies
        if dependencies:
            router_dependencies.extend(dependencies)
        
        router = APIRouter(
            prefix=prefix,
            tags=tags,
            dependencies=router_dependencies
        )
        
        return router

# ================================================================================
# HEALTH CHECK ENDPOINTS
# ================================================================================

def create_health_router() -> APIRouter:
    """Create health check router"""
    router = RouterFactory.create_router(
        prefix="/health",
        tags=["Health"],
        include_auth=False,
        include_rate_limit=False
    )
    
    @router.get("")
    async def health_check():
        """Basic health check endpoint"""
        from database_config import check_database_health, check_redis_health
        
        # Check database connectivity
        db_healthy = await check_database_health()
        redis_healthy = await check_redis_health()
        
        health_status = {
            "status": "healthy" if (db_healthy and redis_healthy) else "unhealthy",
            "timestamp": datetime.utcnow().isoformat(),
            "version": os.getenv("VERSION_TAG", "1.0.0"),
            "service": "aurex-launchpad",
            "checks": {
                "database": "healthy" if db_healthy else "unhealthy",
                "redis": "healthy" if redis_healthy else "unhealthy"
            }
        }
        
        status_code = status.HTTP_200_OK if (db_healthy and redis_healthy) else status.HTTP_503_SERVICE_UNAVAILABLE
        
        return JSONResponse(
            status_code=status_code,
            content=health_status
        )
    
    @router.get("/readiness")
    async def readiness_check():
        """Readiness check for Kubernetes"""
        return {"status": "ready", "timestamp": datetime.utcnow().isoformat()}
    
    @router.get("/liveness")
    async def liveness_check():
        """Liveness check for Kubernetes"""
        return {"status": "alive", "timestamp": datetime.utcnow().isoformat()}
    
    return router

# ================================================================================
# AUTHENTICATION ENDPOINTS
# ================================================================================

def create_auth_router() -> APIRouter:
    """Create authentication router"""
    router = RouterFactory.create_router(
        prefix="/auth",
        tags=["Authentication"],
        include_auth=False
    )
    
    @router.post("/login")
    async def login(request: Request):
        """User login endpoint"""
        # TODO: Implement proper login logic
        return APIResponse.success(
            data={
                "access_token": "mock_token",
                "token_type": "bearer",
                "expires_in": 86400
            },
            message="Login successful"
        )
    
    @router.post("/refresh")
    async def refresh_token(user_data: Dict = Depends(auth_service.require_auth)):
        """Refresh authentication token"""
        # TODO: Implement proper token refresh
        return APIResponse.success(
            data={
                "access_token": "refreshed_token",
                "token_type": "bearer",
                "expires_in": 86400
            },
            message="Token refreshed successfully"
        )
    
    @router.get("/me")
    async def get_current_user(user_data: Dict = Depends(auth_service.require_auth)):
        """Get current user information"""
        return APIResponse.success(
            data=user_data,
            message="User information retrieved successfully"
        )
    
    @router.post("/logout")
    async def logout(user_data: Dict = Depends(auth_service.require_auth)):
        """User logout endpoint"""
        # TODO: Implement proper logout logic (token blacklisting)
        return APIResponse.success(message="Logout successful")
    
    return router

# ================================================================================
# MAIN ROUTER REGISTRY
# ================================================================================

class RouterRegistry:
    """Central registry for all API routers"""
    
    def __init__(self):
        self.routers = []
        self.middleware = []
    
    def register_router(self, router: APIRouter, description: str = ""):
        """Register a router with the main application"""
        self.routers.append({
            "router": router,
            "description": description
        })
        logger.info(f"Registered router: {router.prefix} - {description}")
    
    def register_middleware(self, middleware_class, **kwargs):
        """Register middleware with the application"""
        self.middleware.append({
            "middleware": middleware_class,
            "kwargs": kwargs
        })
    
    def get_all_routers(self) -> List[APIRouter]:
        """Get all registered routers"""
        return [item["router"] for item in self.routers]
    
    def get_all_middleware(self) -> List[Dict]:
        """Get all registered middleware"""
        return self.middleware

from routers import ghg_readiness

# Global router registry
registry = RouterRegistry()

# Register core routers
registry.register_router(create_health_router(), "Health and monitoring endpoints")
registry.register_router(create_auth_router(), "Authentication and authorization")
registry.register_router(ghg_readiness.router, "GHG Readiness Assessment")

# ================================================================================
# APPLICATION FACTORY
# ================================================================================

def setup_api_routing(app):
    """Setup API routing for the FastAPI application"""
    
    # Add exception handlers
    app.add_exception_handler(HTTPException, http_exception_handler)
    app.add_exception_handler(Exception, general_exception_handler)
    
    # Register all routers
    for router_info in registry.routers:
        app.include_router(router_info["router"])
        logger.info(f"Included router: {router_info['router'].prefix}")
    
    # Add CORS middleware
    allowed_origins = os.getenv("ALLOWED_ORIGINS", "http://localhost:3001").split(",")
    app.add_middleware(
        CORSMiddleware,
        allow_origins=allowed_origins,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )
    
    # Add trusted host middleware for security
    if os.getenv("ENVIRONMENT") == "production":
        trusted_hosts = os.getenv("ALLOWED_ORIGINS", "dev.aurigraph.io").split(",")
        app.add_middleware(
            TrustedHostMiddleware,
            allowed_hosts=trusted_hosts
        )
    
    logger.info("API routing setup completed")

# ================================================================================
# EXPORT UTILITIES
# ================================================================================

__all__ = [
    "RouterFactory",
    "APIResponse", 
    "auth_service",
    "rate_limiter",
    "registry",
    "setup_api_routing"
]