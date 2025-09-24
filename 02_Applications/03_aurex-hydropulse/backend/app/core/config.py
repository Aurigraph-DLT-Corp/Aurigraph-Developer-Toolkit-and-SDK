"""
Application Configuration Settings
Environment variables and app configuration
"""

from pydantic import BaseSettings
from typing import List, Optional
import os


class Settings(BaseSettings):
    """Application settings from environment variables"""
    
    # App Information
    APP_NAME: str = "Aurex HydroPulse AWD Platform"
    APP_VERSION: str = "1.0.0"
    DEBUG: bool = False
    
    # Security
    SECRET_KEY: str = "your-super-secret-key-change-in-production"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7
    
    # Database
    DATABASE_URL: str = "postgresql://hydropulse_user:hydropulse_pass@localhost:5432/aurex_hydropulse"
    DATABASE_ECHO: bool = False
    
    # Redis (for caching and sessions)
    REDIS_URL: str = "redis://localhost:6379/2"
    
    # CORS Settings
    ALLOWED_ORIGINS: List[str] = [
        "http://localhost:3002",
        "http://127.0.0.1:3002",
        "https://dev.aurigraph.io:3002"
    ]
    
    # External Services
    # IoT Platform
    IOT_PLATFORM_URL: Optional[str] = None
    IOT_PLATFORM_API_KEY: Optional[str] = None
    
    # SMS Service
    SMS_SERVICE_URL: Optional[str] = None
    SMS_SERVICE_API_KEY: Optional[str] = None
    
    # Email Service
    SMTP_HOST: Optional[str] = None
    SMTP_PORT: int = 587
    SMTP_USERNAME: Optional[str] = None
    SMTP_PASSWORD: Optional[str] = None
    SMTP_USE_TLS: bool = True
    
    # File Storage
    UPLOAD_FOLDER: str = "/tmp/uploads"
    MAX_FILE_SIZE: int = 10 * 1024 * 1024  # 10MB
    
    # AWD Platform Specific
    MINIMUM_ACREAGE: float = 100.0
    MINIMUM_FARMERS: int = 50
    SUPPORTED_STATES: List[str] = ["Maharashtra", "Chhattisgarh", "Andhra Pradesh"]
    
    # Monitoring
    ENABLE_METRICS: bool = True
    METRICS_PORT: int = 8080
    
    class Config:
        env_file = ".env"
        case_sensitive = True


# Create global settings instance
settings = Settings()


# Permission definitions for RBAC
PERMISSIONS = {
    # Project permissions
    "project:create": "Create new AWD projects",
    "project:read": "View project details",
    "project:update": "Update project information", 
    "project:delete": "Delete projects",
    "project:approve": "Approve projects",
    "project:validate": "Run project validations",
    
    # Farmer permissions
    "farmer:create": "Register new farmers",
    "farmer:read": "View farmer profiles",
    "farmer:update": "Update farmer information",
    "farmer:delete": "Remove farmers",
    
    # Survey permissions
    "survey:create": "Create baseline surveys",
    "survey:read": "View survey data",
    "survey:update": "Update survey responses",
    "survey:analyze": "Analyze survey data",
    
    # Training permissions
    "training:create": "Create training programs",
    "training:read": "View training materials",
    "training:update": "Update training content",
    "training:conduct": "Conduct training sessions",
    
    # Monitoring permissions
    "monitoring:read": "View sensor data",
    "monitoring:analyze": "Analyze monitoring data",
    "monitoring:alerts": "Manage alerts and notifications",
    
    # Verification permissions
    "verification:read": "View verification data",
    "verification:validate": "Validate measurements",
    "verification:report": "Generate verification reports",
    
    # Payment permissions
    "payment:read": "View payment records",
    "payment:process": "Process payments",
    "payment:approve": "Approve payments",
    
    # Dashboard permissions
    "dashboard:read": "Access dashboard",
    "dashboard:analytics": "View analytics",
    
    # Admin permissions
    "admin:users": "Manage users",
    "admin:roles": "Manage roles and permissions",
    "admin:system": "System administration"
}


# Role definitions
ROLES = {
    "super_admin": {
        "name": "Super Administrator",
        "level": 100,
        "permissions": list(PERMISSIONS.keys())  # All permissions
    },
    "business_owner": {
        "name": "Business Owner", 
        "level": 90,
        "permissions": [
            "project:create", "project:read", "project:update", "project:delete", "project:approve",
            "farmer:read", "farmer:update",
            "survey:read", "survey:analyze",
            "training:read", "training:update",
            "monitoring:read", "monitoring:analyze",
            "verification:read", "verification:report",
            "payment:read", "payment:approve",
            "dashboard:read", "dashboard:analytics"
        ]
    },
    "project_manager": {
        "name": "Project Manager",
        "level": 80,
        "permissions": [
            "project:create", "project:read", "project:update", "project:approve",
            "farmer:create", "farmer:read", "farmer:update",
            "survey:create", "survey:read", "survey:update", "survey:analyze",
            "training:create", "training:read", "training:update", "training:conduct",
            "monitoring:read", "monitoring:analyze", "monitoring:alerts",
            "verification:read", "verification:validate",
            "payment:read",
            "dashboard:read", "dashboard:analytics"
        ]
    },
    "field_coordinator": {
        "name": "Field Coordinator",
        "level": 60,
        "permissions": [
            "project:read",
            "farmer:create", "farmer:read", "farmer:update", 
            "survey:create", "survey:read", "survey:update",
            "training:read", "training:conduct",
            "monitoring:read",
            "dashboard:read"
        ]
    },
    "data_analyst": {
        "name": "Data Analyst",
        "level": 50,
        "permissions": [
            "project:read",
            "survey:read", "survey:analyze",
            "monitoring:read", "monitoring:analyze",
            "verification:read", "verification:validate", "verification:report",
            "dashboard:read", "dashboard:analytics"
        ]
    },
    "viewer": {
        "name": "Viewer",
        "level": 10,
        "permissions": [
            "project:read",
            "farmer:read",
            "survey:read",
            "dashboard:read"
        ]
    }
}