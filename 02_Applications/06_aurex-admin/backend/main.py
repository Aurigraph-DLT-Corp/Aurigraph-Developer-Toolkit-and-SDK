"""
Aurex Admin Backend API
Comprehensive administrative interface for platform management
"""
from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from datetime import datetime
import uvicorn
import os

app = FastAPI(
    title="Aurex Admin API", 
    description="Administrative API for Aurex Platform",
    version="1.0.0"
)

# Secure CORS configuration - Environment specific
ENVIRONMENT = os.getenv("ENVIRONMENT", "development")
ALLOWED_ORIGINS_RAW = os.getenv("ALLOWED_ORIGINS", "https://dev.aurigraph.io,https://aurigraph.io,http://localhost:3005,http://localhost:5173")
allowed_origins = [origin.strip() for origin in ALLOWED_ORIGINS_RAW.split(",")]

if ENVIRONMENT == "production":
    # Filter out localhost origins in production
    allowed_origins = [origin for origin in allowed_origins if not origin.startswith("http://localhost")]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS", "HEAD"],
    allow_headers=["Authorization", "Content-Type", "X-Requested-With", "Accept", "Origin"],
)

@app.get("/")
async def root():
    return {
        "service": "Aurex Admin API",
        "version": "1.0.0", 
        "status": "operational",
        "timestamp": datetime.utcnow().isoformat()
    }

@app.get("/health")
async def health_check():
    return {
        "status": "healthy", 
        "service": "aurex-admin-api", 
        "version": "1.0.0",
        "timestamp": datetime.utcnow().isoformat()
    }

# Admin Dashboard Data
@app.get("/api/admin/dashboard")
async def get_admin_dashboard():
    """Get admin dashboard overview"""
    return {
        "platform_status": {
            "total_users": 1245,
            "active_sessions": 127,
            "total_organizations": 45,
            "system_health": "excellent"
        },
        "application_status": {
            "aurex_platform": {"status": "healthy", "uptime": "99.9%"},
            "aurex_launchpad": {"status": "healthy", "uptime": "99.8%"}, 
            "aurex_hydropulse": {"status": "healthy", "uptime": "99.7%"},
            "aurex_sylvagraph": {"status": "healthy", "uptime": "99.9%"},
            "aurex_carbontrace": {"status": "healthy", "uptime": "99.6%"}
        },
        "recent_activities": [
            {"action": "user_login", "user": "john.doe@example.com", "timestamp": "2025-08-07T10:30:00Z"},
            {"action": "config_update", "user": "admin@aurex.com", "timestamp": "2025-08-07T09:15:00Z"},
            {"action": "backup_completed", "status": "success", "timestamp": "2025-08-07T06:00:00Z"}
        ]
    }

# User Management
@app.get("/api/admin/users")
async def list_users(page: int = 1, limit: int = 50):
    """List all users with pagination"""
    return {
        "users": [
            {
                "id": "user-001",
                "email": "john.doe@example.com", 
                "name": "John Doe",
                "organization": "Acme Corp",
                "status": "active",
                "last_login": "2025-08-07T08:30:00Z"
            },
            {
                "id": "user-002", 
                "email": "jane.smith@example.com",
                "name": "Jane Smith", 
                "organization": "Green Energy Inc",
                "status": "active",
                "last_login": "2025-08-07T07:15:00Z"
            }
        ],
        "total": 1245,
        "page": page,
        "limit": limit
    }

# System Configuration
@app.get("/api/admin/config")
async def get_system_config():
    """Get system configuration"""
    return {
        "environment": "production",
        "version": "3.3.0",
        "features": {
            "dark_mode": True,
            "advanced_analytics": True,
            "multi_tenant": True,
            "audit_logging": True
        },
        "security": {
            "mfa_enabled": True,
            "password_policy": "strong",
            "session_timeout": 1800
        }
    }

# Analytics and Reporting
@app.get("/api/admin/analytics")
async def get_analytics():
    """Get platform analytics"""
    return {
        "usage_metrics": {
            "daily_active_users": 856,
            "monthly_active_users": 12340,
            "api_requests_today": 45670,
            "data_processed_gb": 2.8
        },
        "performance_metrics": {
            "avg_response_time": 120,
            "error_rate": 0.01,
            "uptime": 99.95
        }
    }

# Security Management  
@app.get("/api/admin/security")
async def get_security_status():
    """Get security status and threats"""
    return {
        "threat_level": "low",
        "failed_login_attempts": 12,
        "blocked_ips": 5,
        "security_events": [
            {
                "type": "failed_login",
                "ip": "192.168.1.100", 
                "timestamp": "2025-08-07T09:45:00Z",
                "severity": "medium"
            }
        ],
        "compliance_status": {
            "gdpr": "compliant",
            "soc2": "compliant", 
            "iso27001": "in_progress"
        }
    }

if __name__ == "__main__":
    port = int(os.getenv("PORT", "8005"))  # Standardized: aurex-admin-api
    uvicorn.run(app, host="0.0.0.0", port=port)