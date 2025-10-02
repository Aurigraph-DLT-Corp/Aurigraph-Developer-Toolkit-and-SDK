"""JWT Token Handler for Authentication"""
import os
from datetime import datetime, timedelta
from typing import Optional, Dict, Any
import jwt
from uuid import UUID

JWT_SECRET = os.getenv("JWT_SECRET", "your-secret-key-change-in-production")
JWT_ALGORITHM = "HS256"
JWT_EXPIRATION_DELTA = timedelta(hours=24)

class JWTHandler:
    """JWT token generation and validation"""
    
    @staticmethod
    def create_access_token(data: Dict[str, Any], expires_delta: Optional[timedelta] = None) -> str:
        """Create JWT access token"""
        to_encode = data.copy()
        
        if expires_delta:
            expire = datetime.utcnow() + expires_delta
        else:
            expire = datetime.utcnow() + JWT_EXPIRATION_DELTA
        
        to_encode.update({"exp": expire})
        
        # Convert UUID to string for JSON serialization
        for key, value in to_encode.items():
            if isinstance(value, UUID):
                to_encode[key] = str(value)
        
        encoded_jwt = jwt.encode(to_encode, JWT_SECRET, algorithm=JWT_ALGORITHM)
        return encoded_jwt
    
    @staticmethod
    def decode_token(token: str) -> Optional[Dict[str, Any]]:
        """Decode and validate JWT token"""
        try:
            payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
            return payload
        except jwt.ExpiredSignatureError:
            return None
        except jwt.JWTError:
            return None