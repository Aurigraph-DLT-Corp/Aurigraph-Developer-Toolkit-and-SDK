#!/usr/bin/env python3
"""
Simple FastAPI app to test authentication integration
"""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, EmailStr
import os

# Simple configuration
os.environ["SECRET_KEY"] = "aurex-launchpad-secret-key-for-testing-2025-very-secure-key-here"
os.environ["JWT_SECRET_KEY"] = "aurex-jwt-secret-key-for-testing-2025-very-secure-key-here"

app = FastAPI(
    title="Aurex Launchpad Authentication Test",
    version="1.0.0"
)

# Add CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost", "http://localhost:3001", "http://127.0.0.1:3001"],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["*"],
)

# Pydantic models
class UserRegister(BaseModel):
    email: EmailStr
    password: str
    first_name: str
    last_name: str
    organization_name: str = None

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    expires_in: int

@app.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "service": "aurex-launchpad-auth-test",
        "version": "1.0.0"
    }

@app.post("/api/auth/register", response_model=TokenResponse)
async def register_user(user_data: UserRegister):
    """Mock registration endpoint for testing"""
    # In a real implementation, this would create a user in the database
    # For testing, we'll log the admin user creation and return mock tokens
    
    print(f"✅ User Registration Request:")
    print(f"📧 Email: {user_data.email}")
    print(f"👤 Name: {user_data.first_name} {user_data.last_name}")
    print(f"🏢 Organization: {user_data.organization_name}")
    
    # Special handling for admin user
    if user_data.email == "admin@aurigraph.io":
        print("👑 ADMIN USER REGISTERED!")
        print("🔒 Role: Super Administrator") 
        print("🎯 Full platform access granted")
    
    return TokenResponse(
        access_token="mock_access_token_for_testing_authentication_flow",
        refresh_token="mock_refresh_token_for_testing_authentication_flow",
        expires_in=1800  # 30 minutes
    )

@app.post("/api/auth/login", response_model=TokenResponse)
async def login_user(user_data: UserLogin):
    """Mock login endpoint for testing"""
    # In a real implementation, this would verify credentials
    # For testing, we'll just return mock tokens
    
    return TokenResponse(
        access_token="mock_access_token_for_testing_authentication_flow",
        refresh_token="mock_refresh_token_for_testing_authentication_flow",
        expires_in=1800  # 30 minutes
    )

@app.get("/api/auth/profile")
async def get_user_profile():
    """Mock profile endpoint for testing"""
    return {
        "id": "mock_user_id",
        "email": "test@example.com", 
        "first_name": "Test",
        "last_name": "User",
        "is_active": True,
        "is_verified": True,
        "created_at": "2025-01-01T00:00:00Z"
    }

@app.post("/api/auth/logout")
async def logout_user():
    """Mock logout endpoint for testing"""
    return {"message": "Successfully logged out"}

@app.post("/api/admin/create-admin")
async def create_admin_user():
    """Create the default admin user for the platform"""
    
    admin_data = {
        "email": "admin@aurigraph.io",
        "password": "AurexAdmin2025!SecurePlatform",
        "first_name": "Aurex",
        "last_name": "Administrator",
        "organization_name": "Aurigraph Technologies",
        "role": "super_admin",
        "is_superuser": True,
        "permissions": [
            "system_admin", "manage_users", "manage_organization",
            "create_assessment", "view_assessment", "edit_assessment", 
            "delete_assessment", "approve_assessment", "generate_reports",
            "view_analytics", "manage_integrations", "export_data"
        ]
    }
    
    print("🚀 CREATING AUREX LAUNCHPAD ADMIN USER")
    print("="*60)
    print(f"📧 Email: {admin_data['email']}")
    print(f"🔑 Password: {admin_data['password']}")
    print(f"👤 Name: {admin_data['first_name']} {admin_data['last_name']}")
    print(f"🏢 Organization: {admin_data['organization_name']}")
    print(f"👑 Role: {admin_data['role']}")
    print(f"🔒 Superuser: {admin_data['is_superuser']}")
    print(f"🎯 Permissions: {len(admin_data['permissions'])} total")
    print("="*60)
    print("✅ ADMIN USER CREATED SUCCESSFULLY!")
    print("⚠️  IMPORTANT: Store these credentials securely!")
    print("⚠️  Change the password after first login!")
    print("="*60)
    
    return {
        "message": "Admin user created successfully",
        "admin": {
            "email": admin_data["email"],
            "name": f"{admin_data['first_name']} {admin_data['last_name']}",
            "organization": admin_data["organization_name"],
            "role": admin_data["role"],
            "is_superuser": admin_data["is_superuser"],
            "permissions_count": len(admin_data["permissions"]),
            "created_at": "2025-08-11T00:00:00Z"
        },
        "credentials": {
            "email": admin_data["email"],
            "password": admin_data["password"],
            "warning": "Change password after first login!"
        }
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)