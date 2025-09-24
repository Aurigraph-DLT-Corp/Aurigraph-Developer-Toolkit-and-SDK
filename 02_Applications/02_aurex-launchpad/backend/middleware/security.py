#!/usr/bin/env python3
# ================================================================================
# AUREX LAUNCHPAD™ SECURITY MIDDLEWARE
# Enhanced security middleware for request validation and protection
# Agent: Security Intelligence Agent
# ================================================================================

from fastapi import Request, Response, HTTPException, status
from fastapi.responses import JSONResponse
from starlette.middleware.base import BaseHTTPMiddleware
from sqlalchemy.orm import Session
import time
import hashlib
import json
from typing import Dict, Set, Optional
from datetime import datetime, timedelta
import ipaddress
import re

from models.base_models import get_db
from models.auth_models import SecurityEvent, AuditLog
from config import get_settings

settings = get_settings()

class SecurityMiddleware(BaseHTTPMiddleware):
    """Enhanced security middleware with rate limiting, IP filtering, and threat detection"""
    
    def __init__(self, app):
        super().__init__(app)
        self.rate_limit_store: Dict[str, Dict] = {}
        self.blocked_ips: Set[str] = set()
        self.suspicious_patterns = [
            r'(\b(union|select|insert|delete|update|drop|create|alter)\b)',  # SQL injection
            r'(<script|javascript:)',  # XSS
            r'(\.\./|\.\.\\\)',  # Path traversal
            r'(eval\(|exec\()',  # Code injection
        ]
        self.cleanup_interval = 300  # 5 minutes
        self.last_cleanup = time.time()
    
    async def dispatch(self, request: Request, call_next):
        start_time = time.time()
        
        # Skip security checks for health endpoints
        if request.url.path in ["/health", "/api/v1/health"]:
            return await call_next(request)
        
        try:
            # IP filtering
            client_ip = self.get_client_ip(request)
            if await self.is_ip_blocked(client_ip):
                return self.create_error_response(
                    status.HTTP_403_FORBIDDEN,
                    "Access denied: IP address blocked"
                )
            
            # Rate limiting
            if await self.is_rate_limited(request, client_ip):
                await self.log_security_event(
                    "rate_limit_exceeded",
                    "medium",
                    f"Rate limit exceeded for IP: {client_ip}",
                    request
                )
                return self.create_error_response(
                    status.HTTP_429_TOO_MANY_REQUESTS,
                    "Rate limit exceeded"
                )
            
            # Request validation
            if await self.has_malicious_content(request):
                await self.log_security_event(
                    "malicious_request",
                    "high",
                    f"Malicious content detected from IP: {client_ip}",
                    request
                )
                return self.create_error_response(
                    status.HTTP_400_BAD_REQUEST,
                    "Invalid request"
                )
            
            # Process request
            response = await call_next(request)
            
            # Add security headers
            response = await self.add_security_headers(response)
            
            # Log request
            await self.log_request(request, response, time.time() - start_time)
            
            return response
            
        except Exception as e:
            await self.log_security_event(
                "middleware_error",
                "medium",
                f"Security middleware error: {str(e)}",
                request
            )
            return self.create_error_response(
                status.HTTP_500_INTERNAL_SERVER_ERROR,
                "Internal server error"
            )
    
    def get_client_ip(self, request: Request) -> str:
        """Get client IP address from request"""
        
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
    
    async def is_ip_blocked(self, ip: str) -> bool:
        """Check if IP address is blocked"""
        
        if ip in self.blocked_ips or ip == "unknown":
            return True
        
        # Check for private/local IPs in production
        if settings.ENVIRONMENT == "production":
            try:
                ip_obj = ipaddress.ip_address(ip)
                if ip_obj.is_private or ip_obj.is_loopback:
                    return False  # Allow private IPs in production for internal services
            except ValueError:
                return True  # Block invalid IPs
        
        return False
    
    async def is_rate_limited(self, request: Request, client_ip: str) -> bool:
        """Check if request should be rate limited"""
        
        current_time = time.time()
        
        # Cleanup old entries periodically
        if current_time - self.last_cleanup > self.cleanup_interval:
            await self.cleanup_rate_limit_store()
            self.last_cleanup = current_time
        
        # Get rate limit key (IP + endpoint pattern)
        key = f"{client_ip}:{self.get_endpoint_pattern(request.url.path)}"
        
        if key not in self.rate_limit_store:
            self.rate_limit_store[key] = {
                "requests": [],
                "blocked_until": None
            }
        
        rate_data = self.rate_limit_store[key]
        
        # Check if currently blocked
        if rate_data["blocked_until"] and current_time < rate_data["blocked_until"]:
            return True
        
        # Clean old requests (last minute)
        rate_data["requests"] = [
            req_time for req_time in rate_data["requests"]
            if current_time - req_time < 60
        ]
        
        # Add current request
        rate_data["requests"].append(current_time)
        
        # Check rate limits
        requests_per_minute = len(rate_data["requests"])
        
        if requests_per_minute > settings.RATE_LIMIT_REQUESTS_PER_MINUTE:
            # Block for 5 minutes
            rate_data["blocked_until"] = current_time + 300
            return True
        
        return False
    
    def get_endpoint_pattern(self, path: str) -> str:
        """Get endpoint pattern for rate limiting"""
        
        # Group similar endpoints
        if path.startswith("/api/v1/auth"):
            return "auth"
        elif path.startswith("/api/v1/assessments"):
            return "assessments"
        elif path.startswith("/api/v1/documents"):
            return "documents"
        elif path.startswith("/api/v1/analytics"):
            return "analytics"
        elif path.startswith("/api/v1/admin"):
            return "admin"
        else:
            return "general"
    
    async def has_malicious_content(self, request: Request) -> bool:
        """Check request for malicious content"""
        
        # Check URL path
        if await self.check_patterns(request.url.path):
            return True
        
        # Check query parameters
        for param, value in request.query_params.items():
            if await self.check_patterns(f"{param}={value}"):
                return True
        
        # Check headers for suspicious content
        for header, value in request.headers.items():
            if await self.check_patterns(f"{header}: {value}"):
                return True
        
        # Check request body for POST/PUT requests
        if request.method in ["POST", "PUT", "PATCH"]:
            try:
                body = await request.body()
                if body:
                    body_str = body.decode("utf-8", errors="ignore")
                    if await self.check_patterns(body_str):
                        return True
            except:
                pass  # Skip body check if can't decode
        
        return False
    
    async def check_patterns(self, content: str) -> bool:
        """Check content against suspicious patterns"""
        
        content_lower = content.lower()
        
        for pattern in self.suspicious_patterns:
            if re.search(pattern, content_lower, re.IGNORECASE):
                return True
        
        return False
    
    async def add_security_headers(self, response: Response) -> Response:
        """Add security headers to response"""
        
        security_headers = {
            "X-Content-Type-Options": "nosniff",
            "X-Frame-Options": "DENY",
            "X-XSS-Protection": "1; mode=block",
            "Strict-Transport-Security": "max-age=31536000; includeSubDomains",
            "Referrer-Policy": "strict-origin-when-cross-origin",
            "Permissions-Policy": "geolocation=(), microphone=(), camera=()",
            "Content-Security-Policy": "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline';"
        }
        
        for header, value in security_headers.items():
            response.headers[header] = value
        
        return response
    
    async def cleanup_rate_limit_store(self):
        """Clean up old rate limit entries"""
        
        current_time = time.time()
        keys_to_remove = []
        
        for key, data in self.rate_limit_store.items():
            # Remove entries with no recent requests
            recent_requests = [
                req_time for req_time in data["requests"]
                if current_time - req_time < 3600  # 1 hour
            ]
            
            if not recent_requests and (not data["blocked_until"] or current_time > data["blocked_until"]):
                keys_to_remove.append(key)
            else:
                data["requests"] = recent_requests
        
        for key in keys_to_remove:
            del self.rate_limit_store[key]
    
    async def log_security_event(self, event_type: str, severity: str, description: str, request: Request):
        """Log security event to database"""
        
        try:
            # In production, you would get a database session here
            # For now, we'll just log to console in development
            if settings.DEBUG:
                print(f"SECURITY EVENT: {event_type} - {severity} - {description}")
            
            # TODO: Save to database when models are available
            
        except Exception as e:
            # Don't let logging errors break the middleware
            if settings.DEBUG:
                print(f"Failed to log security event: {e}")
    
    async def log_request(self, request: Request, response: Response, duration: float):
        """Log request for monitoring"""
        
        try:
            if settings.DEBUG:
                print(f"REQUEST: {request.method} {request.url.path} - {response.status_code} - {duration:.3f}s")
        except Exception:
            pass  # Ignore logging errors
    
    def create_error_response(self, status_code: int, message: str) -> JSONResponse:
        """Create standardized error response"""
        
        return JSONResponse(
            status_code=status_code,
            content={
                "error": "Security Error",
                "message": message,
                "timestamp": datetime.utcnow().isoformat()
            }
        )