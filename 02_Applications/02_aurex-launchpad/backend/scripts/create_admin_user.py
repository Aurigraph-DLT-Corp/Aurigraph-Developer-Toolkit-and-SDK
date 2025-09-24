#!/usr/bin/env python3
# ================================================================================
# AUREX LAUNCHPAD™ ADMIN USER CREATION SCRIPT
# Creates a super admin user with full platform access
# Agent: Security Intelligence Agent
# ================================================================================

import sys
import os
from datetime import datetime
from pathlib import Path

# Add the parent directory to sys.path so we can import our modules
sys.path.append(str(Path(__file__).parent.parent))

# Set environment variables for configuration
os.environ["SECRET_KEY"] = "aurex-launchpad-secret-key-for-admin-creation-2025-secure"
os.environ["JWT_SECRET_KEY"] = "aurex-jwt-secret-key-for-admin-creation-2025-secure"
os.environ["DATABASE_URL"] = "postgresql://aurex_user:AurexProd2024!SecureDB#2025@localhost:5432/aurex_launchpad"

try:
    from sqlalchemy import create_engine
    from sqlalchemy.orm import sessionmaker
    from models.auth_models import User, Organization, OrganizationMember, UserRole
    from models.base_models import Base
    from passlib.context import CryptContext
    import uuid
    
    print("✅ All imports successful")
except ImportError as e:
    print(f"❌ Import error: {e}")
    print("Please ensure you're running from the backend directory")
    sys.exit(1)

# Password hashing context
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def create_admin_user():
    """Create a super admin user for the Aurex Launchpad platform"""
    
    # Database connection
    try:
        DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://aurex_user:AurexProd2024!SecureDB#2025@localhost:5432/aurex_launchpad")
        engine = create_engine(DATABASE_URL)
        SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
        db = SessionLocal()
        
        print(f"✅ Connected to database: {DATABASE_URL}")
    except Exception as e:
        print(f"❌ Database connection failed: {e}")
        return False
    
    try:
        # Admin user details
        admin_email = "admin@aurigraph.io"
        admin_password = "AurexAdmin2025!SecurePlatform"
        admin_first_name = "Aurex"
        admin_last_name = "Administrator"
        
        # Check if admin user already exists
        existing_admin = db.query(User).filter(User.email == admin_email).first()
        if existing_admin:
            print(f"⚠️  Admin user with email {admin_email} already exists")
            print(f"User ID: {existing_admin.id}")
            print(f"Created: {existing_admin.created_at}")
            print(f"Active: {existing_admin.is_active}")
            print(f"Superuser: {existing_admin.is_superuser}")
            
            # Update password if needed
            existing_admin.password_hash = pwd_context.hash(admin_password)
            existing_admin.is_active = True
            existing_admin.is_superuser = True
            existing_admin.is_verified = True
            existing_admin.email_verified_at = datetime.utcnow()
            existing_admin.password_changed_at = datetime.utcnow()
            
            db.commit()
            print("✅ Updated existing admin user credentials")
            return True
        
        # Create Aurigraph organization if it doesn't exist
        org_name = "Aurigraph Technologies"
        org_slug = "aurigraph"
        
        existing_org = db.query(Organization).filter(Organization.slug == org_slug).first()
        if not existing_org:
            admin_org = Organization(
                name=org_name,
                slug=org_slug,
                description="Aurigraph Technologies - ESG Platform Provider",
                industry="Technology",
                employee_count_range="1-50",
                headquarters_country="United States",
                headquarters_city="San Francisco",
                subscription_tier="enterprise",
                max_users=1000,
                max_assessments=10000,
                features_enabled={
                    "ai_insights": True,
                    "advanced_analytics": True,
                    "api_access": True,
                    "white_labeling": True,
                    "sso_integration": True
                }
            )
            db.add(admin_org)
            db.flush()
            print(f"✅ Created organization: {org_name}")
        else:
            admin_org = existing_org
            print(f"✅ Using existing organization: {org_name}")
        
        # Create admin user
        admin_user = User(
            email=admin_email,
            password_hash=pwd_context.hash(admin_password),
            first_name=admin_first_name,
            last_name=admin_last_name,
            is_active=True,
            is_verified=True,
            is_superuser=True,
            email_verified_at=datetime.utcnow(),
            password_changed_at=datetime.utcnow(),
            timezone="UTC",
            language="en",
            job_title="Platform Administrator",
            department="System Administration",
            notification_preferences={
                "email_notifications": True,
                "assessment_reminders": True,
                "project_updates": True,
                "security_alerts": True
            }
        )
        
        db.add(admin_user)
        db.flush()
        
        print(f"✅ Created admin user: {admin_email}")
        print(f"User ID: {admin_user.id}")
        
        # Add admin user to organization as owner
        admin_membership = OrganizationMember(
            organization_id=admin_org.id,
            user_id=admin_user.id,
            role=UserRole.SUPER_ADMIN.value,
            is_active=True,
            is_owner=True,
            joined_at=datetime.utcnow()
        )
        
        db.add(admin_membership)
        db.commit()
        
        print(f"✅ Added admin user to organization as {UserRole.SUPER_ADMIN.value}")
        
        # Print admin user details
        print("\n" + "="*60)
        print("🎉 ADMIN USER CREATED SUCCESSFULLY!")
        print("="*60)
        print(f"📧 Email: {admin_email}")
        print(f"🔑 Password: {admin_password}")
        print(f"👤 Name: {admin_first_name} {admin_last_name}")
        print(f"🏢 Organization: {org_name}")
        print(f"👑 Role: {UserRole.SUPER_ADMIN.value}")
        print(f"🔒 Superuser: {admin_user.is_superuser}")
        print(f"✅ Verified: {admin_user.is_verified}")
        print(f"📅 Created: {admin_user.created_at}")
        print("="*60)
        print("⚠️  IMPORTANT: Store these credentials securely!")
        print("⚠️  Change the password after first login!")
        print("="*60)
        
        return True
        
    except Exception as e:
        print(f"❌ Error creating admin user: {e}")
        db.rollback()
        return False
    
    finally:
        db.close()

def create_test_users():
    """Create additional test users for different roles"""
    
    # Database connection
    try:
        DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://aurex_user:AurexProd2024!SecureDB#2025@localhost:5432/aurex_launchpad")
        engine = create_engine(DATABASE_URL)
        SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
        db = SessionLocal()
        
        print(f"✅ Connected to database for test users")
    except Exception as e:
        print(f"❌ Database connection failed: {e}")
        return False
    
    try:
        # Get the Aurigraph organization
        org = db.query(Organization).filter(Organization.slug == "aurigraph").first()
        if not org:
            print("❌ Aurigraph organization not found")
            return False
        
        # Test users to create
        test_users = [
            {
                "email": "manager@aurigraph.io",
                "password": "ESGManager2025!",
                "first_name": "ESG",
                "last_name": "Manager",
                "role": UserRole.ESG_MANAGER.value,
                "job_title": "ESG Manager"
            },
            {
                "email": "analyst@aurigraph.io", 
                "password": "ESGAnalyst2025!",
                "first_name": "ESG",
                "last_name": "Analyst",
                "role": UserRole.ESG_ANALYST.value,
                "job_title": "ESG Analyst"
            },
            {
                "email": "viewer@aurigraph.io",
                "password": "ESGViewer2025!",
                "first_name": "ESG",
                "last_name": "Viewer",
                "role": UserRole.VIEWER.value,
                "job_title": "ESG Viewer"
            }
        ]
        
        for user_data in test_users:
            # Check if user exists
            existing_user = db.query(User).filter(User.email == user_data["email"]).first()
            if existing_user:
                print(f"⚠️  Test user {user_data['email']} already exists")
                continue
            
            # Create test user
            test_user = User(
                email=user_data["email"],
                password_hash=pwd_context.hash(user_data["password"]),
                first_name=user_data["first_name"],
                last_name=user_data["last_name"],
                is_active=True,
                is_verified=True,
                is_superuser=False,
                email_verified_at=datetime.utcnow(),
                password_changed_at=datetime.utcnow(),
                job_title=user_data["job_title"],
                department="ESG Operations"
            )
            
            db.add(test_user)
            db.flush()
            
            # Add user to organization
            membership = OrganizationMember(
                organization_id=org.id,
                user_id=test_user.id,
                role=user_data["role"],
                is_active=True,
                is_owner=False,
                joined_at=datetime.utcnow()
            )
            
            db.add(membership)
            print(f"✅ Created test user: {user_data['email']} ({user_data['role']})")
        
        db.commit()
        print("✅ All test users created successfully")
        
        return True
        
    except Exception as e:
        print(f"❌ Error creating test users: {e}")
        db.rollback()
        return False
    
    finally:
        db.close()

if __name__ == "__main__":
    print("🚀 Starting Aurex Launchpad Admin User Creation")
    print("="*60)
    
    # Create admin user
    if create_admin_user():
        print("\n🎯 Creating additional test users...")
        create_test_users()
        
        print("\n✅ Admin user creation process completed successfully!")
        print("\n📝 Next steps:")
        print("1. Use admin credentials to login to the platform")
        print("2. Change the admin password after first login") 
        print("3. Configure additional organization settings")
        print("4. Create additional users as needed")
        
    else:
        print("❌ Admin user creation failed")
        sys.exit(1)