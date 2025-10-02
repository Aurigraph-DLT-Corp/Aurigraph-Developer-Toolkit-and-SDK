#!/usr/bin/env python3
# ================================================================================
# AUREX LAUNCHPAD™ LOGGING MIDDLEWARE
# Comprehensive request/response logging and monitoring
# Agent: DevOps Orchestration Agent
# ================================================================================

from fastapi import Request, Response
from starlette.middleware.base import BaseHTTPMiddleware
import time
import json
import uuid
from datetime import datetime
from typing import Dict, Any, Optional
import logging

from config import get_settings

settings = get_settings()

# Configure structured logging
logging.basicConfig(
    level=getattr(logging, settings.LOG_LEVEL.upper()),
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)

logger = logging.getLogger("aurex.middleware.logging")

class LoggingMiddleware(BaseHTTPMiddleware):
    """Enhanced logging middleware for request/response monitoring"""
    
    def __init__(self, app):
        super().__init__(app)
        self.skip_paths = {"/health", "/docs", "/redoc", "/openapi.json", "/favicon.ico"}
    
    async def dispatch(self, request: Request, call_next):
        # Generate request ID for tracking
        request_id = str(uuid.uuid4())
        request.state.request_id = request_id
        
        # Skip logging for certain paths
        if request.url.path in self.skip_paths:
            return await call_next(request)
        
        start_time = time.time()
        
        # Log incoming request
        await self.log_request(request, request_id)
        
        # Process request
        try:
            response = await call_next(request)
            
            # Calculate processing time
            process_time = time.time() - start_time
            
            # Log response
            await self.log_response(request, response, process_time, request_id)
            
            # Add request ID to response headers
            response.headers["X-Request-ID"] = request_id
            
            return response
            
        except Exception as e:
            # Log error
            process_time = time.time() - start_time
            await self.log_error(request, e, process_time, request_id)
            raise
    
    async def log_request(self, request: Request, request_id: str):
        """Log incoming request details"""
        
        try:
            # Get client information
            client_ip = self.get_client_ip(request)
            user_agent = request.headers.get("user-agent", "unknown")
            
            # Get user information if available
            user_info = await self.get_user_info(request)
            
            # Prepare request data
            request_data = {
                "request_id": request_id,
                "timestamp": datetime.utcnow().isoformat(),
                "event_type": "request_start",
                "method": request.method,
                "url": str(request.url),
                "path": request.url.path,
                "query_params": dict(request.query_params),
                "headers": dict(request.headers),
                "client_ip": client_ip,
                "user_agent": user_agent,
                "user_info": user_info
            }
            
            # Log request body for POST/PUT requests (excluding sensitive data)
            if request.method in ["POST", "PUT", "PATCH"]:
                body = await self.get_request_body(request)
                if body:
                    request_data["body_size"] = len(body)
                    request_data["content_type"] = request.headers.get("content-type")
                    
                    # Only log body for non-sensitive endpoints
                    if not self.is_sensitive_endpoint(request.url.path):
                        request_data["body_preview"] = body[:500] if len(body) > 500 else body
            
            # Log to structured logger
            logger.info("Incoming request", extra={"request_data": request_data})
            
        except Exception as e:
            logger.error(f"Failed to log request: {e}")
    
    async def log_response(self, request: Request, response: Response, process_time: float, request_id: str):
        """Log response details"""
        
        try:
            # Get user information if available
            user_info = await self.get_user_info(request)
            
            # Prepare response data
            response_data = {
                "request_id": request_id,
                "timestamp": datetime.utcnow().isoformat(),
                "event_type": "request_complete",
                "method": request.method,
                "path": request.url.path,
                "status_code": response.status_code,
                "process_time_ms": round(process_time * 1000, 2),
                "response_headers": dict(response.headers),
                "user_info": user_info
            }
            
            # Log level based on status code
            if response.status_code >= 500:
                logger.error("Request completed with server error", extra={"response_data": response_data})
            elif response.status_code >= 400:
                logger.warning("Request completed with client error", extra={"response_data": response_data})
            else:
                logger.info("Request completed successfully", extra={"response_data": response_data})
            
            # Performance monitoring
            if process_time > 5.0:  # Slow request threshold
                logger.warning(
                    f"Slow request detected: {request.method} {request.url.path} took {process_time:.2f}s",
                    extra={"performance_alert": True, "request_id": request_id}
                )
            
        except Exception as e:
            logger.error(f"Failed to log response: {e}")
    
    async def log_error(self, request: Request, error: Exception, process_time: float, request_id: str):
        """Log request errors"""
        
        try:
            # Get user information if available
            user_info = await self.get_user_info(request)
            
            # Prepare error data
            error_data = {
                "request_id": request_id,
                "timestamp": datetime.utcnow().isoformat(),
                "event_type": "request_error",
                "method": request.method,
                "path": request.url.path,
                "error_type": type(error).__name__,
                "error_message": str(error),
                "process_time_ms": round(process_time * 1000, 2),
                "user_info": user_info
            }
            
            logger.error("Request failed with exception", extra={"error_data": error_data})
            
        except Exception as e:
            logger.error(f"Failed to log error: {e}")
    
    def get_client_ip(self, request: Request) -> str:
        """Get client IP address"""
        
        # Check X-Forwarded-For header (load balancer/proxy)
        forwarded_for = request.headers.get("X-Forwarded-For")
        if forwarded_for:
            return forwarded_for.split(',')[0].strip()
        
        # Check X-Real-IP header (nginx)
        real_ip = request.headers.get("X-Real-IP")
        if real_ip:
            return real_ip
        
        # Fall back to client host
        return request.client.host if request.client else "unknown"
    
    async def get_user_info(self, request: Request) -> Optional[Dict[str, Any]]:
        """Extract user information from request if available"""
        
        try:
            # Check if user is attached to request state (from auth middleware)
            if hasattr(request.state, "user"):
                user = request.state.user
                return {
                    "user_id": str(user.id),
                    "email": user.email,
                    "organization_id": str(user.current_organization_id) if user.current_organization_id else None
                }
            
            # Try to extract from Authorization header
            auth_header = request.headers.get("authorization")
            if auth_header and auth_header.startswith("Bearer "):
                return {"auth_method": "bearer_token"}
            
            return None
            
        except Exception:
            return None
    
    async def get_request_body(self, request: Request) -> Optional[str]:
        """Get request body as string"""
        
        try:
            body = await request.body()
            if body:
                return body.decode("utf-8", errors="ignore")
            return None
        except Exception:
            return None
    
    def is_sensitive_endpoint(self, path: str) -> bool:
        """Check if endpoint handles sensitive data"""
        
        sensitive_patterns = [
            "/auth/login",
            "/auth/register",
            "/auth/reset-password",
            "/admin/",
            "/users/password"
        ]
        
        return any(pattern in path for pattern in sensitive_patterns)


class PerformanceMiddleware(BaseHTTPMiddleware):
    """Performance monitoring middleware"""
    
    def __init__(self, app):
        super().__init__(app)
        self.request_counts: Dict[str, int] = {}
        self.response_times: Dict[str, list] = {}
        self.error_counts: Dict[str, int] = {}
    
    async def dispatch(self, request: Request, call_next):
        start_time = time.time()
        endpoint = f"{request.method} {request.url.path}"
        
        try:
            response = await call_next(request)
            
            # Record metrics
            process_time = time.time() - start_time
            await self.record_metrics(endpoint, process_time, response.status_code)
            
            return response
            
        except Exception as e:
            process_time = time.time() - start_time
            await self.record_error(endpoint, process_time, e)
            raise
    
    async def record_metrics(self, endpoint: str, process_time: float, status_code: int):
        """Record performance metrics"""
        
        # Request count
        self.request_counts[endpoint] = self.request_counts.get(endpoint, 0) + 1
        
        # Response times
        if endpoint not in self.response_times:
            self.response_times[endpoint] = []
        
        self.response_times[endpoint].append(process_time)
        
        # Keep only last 100 measurements per endpoint
        if len(self.response_times[endpoint]) > 100:
            self.response_times[endpoint] = self.response_times[endpoint][-100:]
        
        # Error tracking
        if status_code >= 400:
            self.error_counts[endpoint] = self.error_counts.get(endpoint, 0) + 1
    
    async def record_error(self, endpoint: str, process_time: float, error: Exception):
        """Record error metrics"""
        
        self.error_counts[endpoint] = self.error_counts.get(endpoint, 0) + 1
        
        # Log performance data for failed requests
        logger.error(
            f"Request failed: {endpoint} in {process_time:.3f}s - {type(error).__name__}: {error}",
            extra={
                "performance_data": {
                    "endpoint": endpoint,
                    "process_time": process_time,
                    "error_type": type(error).__name__
                }
            }
        )
    
    def get_metrics(self) -> Dict[str, Any]:
        """Get current performance metrics"""
        
        metrics = {
            "request_counts": self.request_counts.copy(),
            "error_counts": self.error_counts.copy(),
            "average_response_times": {}
        }
        
        # Calculate average response times
        for endpoint, times in self.response_times.items():
            if times:
                metrics["average_response_times"][endpoint] = {
                    "avg_ms": round(sum(times) / len(times) * 1000, 2),
                    "min_ms": round(min(times) * 1000, 2),
                    "max_ms": round(max(times) * 1000, 2),
                    "sample_count": len(times)
                }
        
        return metrics