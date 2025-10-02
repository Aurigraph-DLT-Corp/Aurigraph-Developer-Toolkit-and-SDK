#!/usr/bin/env python3
"""
Simple script to create admin user via API call
"""

import requests
import json
import sys

def create_admin_user():
    """Create admin user via registration API"""
    
    # Admin user data
    admin_data = {
        "email": "admin@aurigraph.io",
        "password": "AurexAdmin2025!SecurePlatform", 
        "first_name": "Aurex",
        "last_name": "Administrator",
        "organization_name": "Aurigraph Technologies"
    }
    
    print("🚀 Creating Aurex Launchpad Admin User")
    print("="*50)
    print(f"📧 Email: {admin_data['email']}")
    print(f"👤 Name: {admin_data['first_name']} {admin_data['last_name']}")
    print(f"🏢 Organization: {admin_data['organization_name']}")
    
    # Try to register admin user via API
    try:
        # Get container IP or use localhost
        backend_url = "http://aurex-launchpad-backend-container:8001"  # Container name
        
        response = requests.post(
            f"{backend_url}/api/auth/register",
            json=admin_data,
            headers={"Content-Type": "application/json"},
            timeout=10
        )
        
        if response.status_code == 200:
            result = response.json()
            print("✅ Admin user created successfully!")
            print(f"🔑 Access Token: {result.get('access_token', 'N/A')[:20]}...")
            print(f"🔄 Refresh Token: {result.get('refresh_token', 'N/A')[:20]}...")
            return True
        else:
            print(f"❌ Registration failed: {response.status_code}")
            print(f"Response: {response.text}")
            return False
            
    except requests.exceptions.RequestException as e:
        print(f"❌ Connection error: {e}")
        return False

def test_admin_login():
    """Test admin login"""
    
    login_data = {
        "email": "admin@aurigraph.io",
        "password": "AurexAdmin2025!SecurePlatform"
    }
    
    try:
        backend_url = "http://aurex-launchpad-backend-container:8001"
        
        response = requests.post(
            f"{backend_url}/api/auth/login",
            json=login_data,
            headers={"Content-Type": "application/json"},
            timeout=10
        )
        
        if response.status_code == 200:
            result = response.json()
            print("✅ Admin login test successful!")
            return True
        else:
            print(f"❌ Login test failed: {response.status_code}")
            return False
            
    except requests.exceptions.RequestException as e:
        print(f"❌ Login test error: {e}")
        return False

if __name__ == "__main__":
    if create_admin_user():
        print("\n🎯 Testing admin login...")
        if test_admin_login():
            print("\n🎉 Admin user setup completed successfully!")
            print("\n📝 Admin Credentials:")
            print("Email: admin@aurigraph.io")
            print("Password: AurexAdmin2025!SecurePlatform")
            print("\n⚠️  IMPORTANT: Change password after first login!")
        else:
            print("⚠️  Admin created but login test failed")
    else:
        print("❌ Admin user creation failed")
        sys.exit(1)