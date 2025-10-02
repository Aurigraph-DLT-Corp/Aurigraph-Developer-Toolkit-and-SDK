#!/usr/bin/env python3
"""
Test Users Management Script
Quick utility to test different user roles and permissions
"""

import json
import requests
from typing import Dict, List
import sys
import os

# Add app directory to Python path
sys.path.append(os.path.join(os.path.dirname(__file__), 'app'))

API_BASE_URL = "http://localhost:8002/api/v1"

class TestUserManager:
    """Manage test users and authentication for testing"""
    
    def __init__(self, base_url: str = API_BASE_URL):
        self.base_url = base_url
        self.tokens = {}  # Store tokens for each user
        
    def login(self, username: str, password: str = "password123") -> Dict:
        """Login a user and store the token"""
        
        login_data = {
            "username": username,
            "password": password
        }
        
        try:
            response = requests.post(
                f"{self.base_url}/auth/login-simple",
                json=login_data,
                headers={"Content-Type": "application/json"}
            )
            
            if response.status_code == 200:
                token_data = response.json()
                self.tokens[username] = token_data["access_token"]
                
                print(f"✅ Logged in as: {token_data['user']['full_name']}")
                print(f"   Role: {', '.join(token_data['user']['roles'])}")
                print(f"   Territories: {', '.join(token_data['user']['assigned_territories'] or [])}")
                print(f"   Permissions: {len(token_data['user']['permissions'])} permissions")
                
                return token_data
            else:
                print(f"❌ Login failed: {response.json()}")
                return None
                
        except requests.exceptions.ConnectionError:
            print("❌ Cannot connect to API. Make sure the backend is running on port 8002")
            return None
    
    def get_headers(self, username: str) -> Dict[str, str]:
        """Get authorization headers for a user"""
        token = self.tokens.get(username)
        if not token:
            print(f"❌ No token found for {username}. Please login first.")
            return {}
        
        return {
            "Authorization": f"Bearer {token}",
            "Content-Type": "application/json"
        }
    
    def test_permissions(self, username: str):
        """Test user permissions endpoint"""
        headers = self.get_headers(username)
        if not headers:
            return
            
        try:
            response = requests.get(
                f"{self.base_url}/auth/test-permissions",
                headers=headers
            )
            
            if response.status_code == 200:
                data = response.json()
                print(f"\n🔍 Permissions for {data['user']}:")
                print(f"   Roles: {', '.join(data['roles'])}")
                print(f"   Territories: {', '.join(data['territories'] or [])}")
                print(f"   Super Admin: {data['is_super_admin']}")
                print(f"   Permissions ({len(data['permissions'])}):")
                
                # Group permissions by resource
                by_resource = {}
                for perm in data['permissions']:
                    resource = perm['resource']
                    if resource not in by_resource:
                        by_resource[resource] = []
                    by_resource[resource].append(perm['action'])
                
                for resource, actions in by_resource.items():
                    print(f"     {resource}: {', '.join(actions)}")
                    
            else:
                print(f"❌ Permission test failed: {response.json()}")
                
        except Exception as e:
            print(f"❌ Error testing permissions: {e}")
    
    def test_project_creation(self, username: str):
        """Test project creation with different users"""
        headers = self.get_headers(username)
        if not headers:
            return
            
        project_data = {
            "name": f"Test AWD Project by {username}",
            "description": "Test project for role-based access testing",
            "state": "Maharashtra",
            "districts": ["Pune", "Mumbai"],
            "acreage_target": 150.0,
            "farmer_target": 75,
            "methodology_type": "verra_vm0042",
            "methodology_version": "v2.0",
            "start_date": "2025-03-01T00:00:00",
            "end_date": "2027-03-01T00:00:00",
            "season": "Kharif",
            "regions": [],
            "methodologies": []
        }
        
        try:
            response = requests.post(
                f"{self.base_url}/projects/",
                json=project_data,
                headers=headers
            )
            
            if response.status_code == 201:
                project = response.json()
                print(f"✅ Project created successfully:")
                print(f"   Project ID: {project['project_id']}")
                print(f"   Status: {project['status']}")
                print(f"   Created by: {username}")
                return project
            else:
                error_data = response.json()
                print(f"❌ Project creation failed: {error_data.get('detail', 'Unknown error')}")
                return None
                
        except Exception as e:
            print(f"❌ Error creating project: {e}")
            return None
    
    def test_project_list(self, username: str):
        """Test project listing with territory restrictions"""
        headers = self.get_headers(username)
        if not headers:
            return
            
        try:
            response = requests.get(
                f"{self.base_url}/projects/",
                headers=headers
            )
            
            if response.status_code == 200:
                data = response.json()
                print(f"✅ Projects visible to {username}: {data['total_count']}")
                
                for project in data['projects']:
                    print(f"   • {project['project_id']} - {project['name']} ({project['state']})")
                    
            else:
                print(f"❌ Failed to list projects: {response.json()}")
                
        except Exception as e:
            print(f"❌ Error listing projects: {e}")


# Predefined test users
TEST_USERS = {
    "Super Admin": "admin@aurigraph.io",
    "CEO": "ceo@aurigraph.io", 
    "COO": "coo@aurigraph.io",
    "PM Maharashtra": "pm.maharashtra@aurigraph.io",
    "PM Chhattisgarh": "pm.chhattisgarh@aurigraph.io",
    "PM Andhra": "pm.andhra@aurigraph.io",
    "Field Pune": "field.pune@aurigraph.io",
    "Field Raipur": "field.raipur@aurigraph.io",
    "Analyst Carbon": "analyst.carbon@aurigraph.io",
    "Viewer Investor": "viewer.investor@aurigraph.io",
    "VVB Verra": "vvb.verra@aurigraph.io"
}


def main():
    """Interactive test script"""
    print("🧪 HydroPulse Test User Manager")
    print("="*50)
    
    manager = TestUserManager()
    
    while True:
        print("\n📋 Available Test Users:")
        for i, (name, email) in enumerate(TEST_USERS.items(), 1):
            print(f"   {i:2}. {name:<20} ({email})")
        
        print("\n🛠️  Actions:")
        print("   88. Test all users permissions")
        print("   99. Exit")
        
        try:
            choice = input("\nEnter choice (1-99): ").strip()
            
            if choice == "99":
                print("👋 Goodbye!")
                break
                
            elif choice == "88":
                # Test all users
                print("\n🔄 Testing all users...")
                for name, email in TEST_USERS.items():
                    print(f"\n{'='*20} {name} {'='*20}")
                    token_data = manager.login(email)
                    if token_data:
                        manager.test_permissions(email)
                        manager.test_project_list(email)
                
            elif choice.isdigit() and 1 <= int(choice) <= len(TEST_USERS):
                # Test specific user
                user_list = list(TEST_USERS.items())
                name, email = user_list[int(choice) - 1]
                
                print(f"\n{'='*20} Testing {name} {'='*20}")
                
                # Login
                token_data = manager.login(email)
                if not token_data:
                    continue
                
                # Test permissions
                manager.test_permissions(email)
                
                # Test project operations
                print(f"\n📋 Testing project operations for {name}:")
                manager.test_project_list(email)
                
                # Ask if they want to create a project
                create = input(f"\nCreate a test project as {name}? (y/n): ").lower().strip()
                if create == 'y':
                    project = manager.test_project_creation(email)
                    if project:
                        print(f"   Created project: {project['project_id']}")
                        
                        # Test approval if they have permission
                        if 'project:approve' in token_data['user']['permissions']:
                            approve = input(f"Approve the project? (y/n): ").lower().strip()
                            if approve == 'y':
                                # This would require additional approval endpoint testing
                                print("   Approval testing not implemented yet")
                
            else:
                print("❌ Invalid choice")
                
        except KeyboardInterrupt:
            print("\n\n👋 Goodbye!")
            break
        except Exception as e:
            print(f"❌ Error: {e}")


if __name__ == "__main__":
    main()