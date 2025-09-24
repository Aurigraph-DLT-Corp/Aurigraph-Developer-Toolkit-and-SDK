"""
Comprehensive Security Layer
Rate limiting, encryption, input validation, and security middleware
"""
from fastapi import Request, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from typing import Optional, Dict, Any
import hashlib
import hmac
import time
from datetime import datetime, timedelta
from cryptography.fernet import Fernet
import os
import re
from collections import defaultdict

# Security configuration
ENCRYPTION_KEY = os.getenv("ENCRYPTION_KEY", Fernet.generate_key())
RATE_LIMIT_REQUESTS = int(os.getenv("RATE_LIMIT_REQUESTS", "100"))
RATE_LIMIT_WINDOW = int(os.getenv("RATE_LIMIT_WINDOW", "60"))  # seconds

class SecurityManager:
    """Comprehensive security management"""
    
    def __init__(self):
        self.cipher = Fernet(ENCRYPTION_KEY)
        self.rate_limiter = RateLimiter()
        self.input_validator = InputValidator()
    
    def encrypt_data(self, data: str) -> str:
        """Encrypt sensitive data"""
        return self.cipher.encrypt(data.encode()).decode()
    
    def decrypt_data(self, encrypted_data: str) -> str:
        """Decrypt sensitive data"""
        return self.cipher.decrypt(encrypted_data.encode()).decode()
    
    def hash_data(self, data: str, salt: Optional[str] = None) -> str:
        """Create secure hash of data"""
        if salt:
            data = f"{data}{salt}"
        return hashlib.sha256(data.encode()).hexdigest()
    
    def verify_signature(self, data: str, signature: str, secret: str) -> bool:
        """Verify HMAC signature"""
        expected = hmac.new(
            secret.encode(),
            data.encode(),
            hashlib.sha256
        ).hexdigest()
        return hmac.compare_digest(expected, signature)

class RateLimiter:
    """Rate limiting implementation"""
    
    def __init__(self):
        self.requests = defaultdict(list)
    
    def check_rate_limit(self, identifier: str) -> bool:
        """Check if request is within rate limit"""
        now = time.time()
        
        # Clean old requests
        self.requests[identifier] = [
            req_time for req_time in self.requests[identifier]
            if now - req_time < RATE_LIMIT_WINDOW
        ]
        
        # Check limit
        if len(self.requests[identifier]) >= RATE_LIMIT_REQUESTS:
            return False
        
        # Add current request
        self.requests[identifier].append(now)
        return True
    
    async def rate_limit_middleware(self, request: Request, call_next):
        """Middleware for rate limiting"""
        identifier = request.client.host or "unknown"
        
        if not self.check_rate_limit(identifier):
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail="Rate limit exceeded"
            )
        
        response = await call_next(request)
        return response

class InputValidator:
    """Input validation and sanitization"""
    
    # Validation patterns
    EMAIL_PATTERN = re.compile(r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$')
    UUID_PATTERN = re.compile(r'^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$')
    SAFE_STRING_PATTERN = re.compile(r'^[a-zA-Z0-9\s\-_.]+$')
    
    def validate_email(self, email: str) -> bool:
        """Validate email format"""
        return bool(self.EMAIL_PATTERN.match(email))
    
    def validate_uuid(self, uuid_str: str) -> bool:
        """Validate UUID format"""
        return bool(self.UUID_PATTERN.match(uuid_str.lower()))
    
    def sanitize_string(self, input_str: str, max_length: int = 255) -> str:
        """Sanitize string input"""
        # Remove potential XSS/injection characters
        sanitized = re.sub(r'[<>"\'/\\]', '', input_str)
        # Truncate to max length
        return sanitized[:max_length]
    
    def validate_password_strength(self, password: str) -> Dict[str, Any]:
        """Check password strength"""
        issues = []
        
        if len(password) < 8:
            issues.append("Password must be at least 8 characters")
        if not re.search(r'[A-Z]', password):
            issues.append("Password must contain uppercase letter")
        if not re.search(r'[a-z]', password):
            issues.append("Password must contain lowercase letter")
        if not re.search(r'\d', password):
            issues.append("Password must contain number")
        if not re.search(r'[!@#$%^&*(),.?":{}|<>]', password):
            issues.append("Password must contain special character")
        
        return {
            "valid": len(issues) == 0,
            "issues": issues,
            "strength": self._calculate_password_strength(password)
        }
    
    def _calculate_password_strength(self, password: str) -> str:
        """Calculate password strength score"""
        score = 0
        
        if len(password) >= 8:
            score += 1
        if len(password) >= 12:
            score += 1
        if re.search(r'[A-Z]', password) and re.search(r'[a-z]', password):
            score += 1
        if re.search(r'\d', password):
            score += 1
        if re.search(r'[!@#$%^&*(),.?":{}|<>]', password):
            score += 1
        
        if score <= 2:
            return "weak"
        elif score <= 3:
            return "medium"
        else:
            return "strong"

class SecurityHeaders:
    """Security headers middleware"""
    
    @staticmethod
    async def add_security_headers(request: Request, call_next):
        """Add security headers to response"""
        response = await call_next(request)
        
        # Security headers
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-Frame-Options"] = "DENY"
        response.headers["X-XSS-Protection"] = "1; mode=block"
        response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
        response.headers["Content-Security-Policy"] = "default-src 'self'"
        response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
        
        return response

# Global instances
security_manager = SecurityManager()
rate_limiter = RateLimiter()
input_validator = InputValidator()

__all__ = [
    "SecurityManager",
    "RateLimiter", 
    "InputValidator",
    "SecurityHeaders",
    "security_manager",
    "rate_limiter",
    "input_validator"
]