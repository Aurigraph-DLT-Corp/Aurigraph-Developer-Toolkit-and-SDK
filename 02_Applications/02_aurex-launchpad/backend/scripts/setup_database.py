#!/usr/bin/env python3
# ================================================================================
# AUREX LAUNCHPAD™ DATABASE SETUP SCRIPT
# Initialize database with tables, sample data, and default configurations
# Agent: Database Management Agent
# ================================================================================

import os
import sys
import asyncio
from pathlib import Path
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker
import logging

# Add the backend directory to the Python path
current_path = Path(__file__).parent.parent
sys.path.insert(0, str(current_path))

from models.base_models import Base, create_all_tables
from models.auth_models import User, Organization, OrganizationMember, Role, Permission, RolePermission
from models.esg_models import ESGFrameworkTemplate, AssessmentQuestion, ESGFramework, ScoringMethod, QuestionType
from security.password_utils import hash_password
from config import get_settings

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

settings = get_settings()

def create_database_if_not_exists():
    """Create the database if it doesn't exist"""
    
    try:
        # Extract database name from URL
        db_url_parts = settings.DATABASE_URL.split('/')
        db_name = db_url_parts[-1]
        base_url = '/'.join(db_url_parts[:-1])
        
        # Connect to PostgreSQL server (not specific database)
        server_url = base_url + '/postgres'
        engine = create_engine(server_url)
        
        with engine.connect() as conn:
            # Check if database exists
            result = conn.execute(text(
                "SELECT 1 FROM pg_database WHERE datname = :db_name"
            ), {"db_name": db_name})
            
            if not result.fetchone():
                # Create database
                conn.execute(text("COMMIT"))  # End any existing transaction
                conn.execute(text(f'CREATE DATABASE "{db_name}"'))
                logger.info(f"✅ Created database: {db_name}")
            else:
                logger.info(f"📊 Database already exists: {db_name}")
        
        engine.dispose()
        
    except Exception as e:
        logger.error(f"❌ Failed to create database: {e}")
        raise

def setup_database():
    """Set up database tables and initial data"""
    
    try:
        logger.info("🚀 Starting database setup...")
        
        # Create database if needed
        create_database_if_not_exists()
        
        # Create all tables
        logger.info("📊 Creating database tables...")
        create_all_tables()
        logger.info("✅ Database tables created successfully")
        
        # Create database session
        engine = create_engine(settings.DATABASE_URL)
        SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
        db = SessionLocal()
        
        try:
            # Create default roles and permissions
            logger.info("🔐 Setting up default roles and permissions...")
            setup_default_roles_and_permissions(db)
            
            # Create default ESG framework templates
            logger.info("📋 Setting up ESG framework templates...")
            setup_default_esg_templates(db)
            
            # Create default admin user and organization
            logger.info("👤 Setting up default admin user...")
            setup_default_admin(db)
            
            db.commit()
            logger.info("✅ Database setup completed successfully!")
            
        except Exception as e:
            db.rollback()
            logger.error(f"❌ Database setup failed: {e}")
            raise
        finally:
            db.close()
            engine.dispose()
            
    except Exception as e:
        logger.error(f"❌ Database setup failed: {e}")
        sys.exit(1)

def setup_default_roles_and_permissions(db):
    """Create default roles and permissions"""
    
    # Define permissions
    permissions_data = [
        # Organization permissions
        {"name": "org:read", "description": "Read organization information", "resource": "organization", "action": "read"},
        {"name": "org:write", "description": "Update organization information", "resource": "organization", "action": "write"},
        {"name": "org:delete", "description": "Delete organization", "resource": "organization", "action": "delete"},
        {"name": "org:manage_members", "description": "Manage organization members", "resource": "organization", "action": "manage_members"},
        
        # Assessment permissions
        {"name": "assessment:read", "description": "Read assessments", "resource": "assessment", "action": "read"},
        {"name": "assessment:write", "description": "Create and edit assessments", "resource": "assessment", "action": "write"},
        {"name": "assessment:delete", "description": "Delete assessments", "resource": "assessment", "action": "delete"},
        {"name": "assessment:collaborate", "description": "Collaborate on assessments", "resource": "assessment", "action": "collaborate"},
        
        # Document permissions
        {"name": "document:read", "description": "Read documents", "resource": "document", "action": "read"},
        {"name": "document:write", "description": "Upload and edit documents", "resource": "document", "action": "write"},
        {"name": "document:delete", "description": "Delete documents", "resource": "document", "action": "delete"},
        
        # Analytics permissions
        {"name": "analytics:read", "description": "Read analytics and reports", "resource": "analytics", "action": "read"},
        {"name": "analytics:export", "description": "Export analytics data", "resource": "analytics", "action": "export"},
        
        # Admin permissions
        {"name": "admin:read", "description": "Read admin information", "resource": "admin", "action": "read"},
        {"name": "admin:write", "description": "Perform admin actions", "resource": "admin", "action": "write"},
        {"name": "admin:users", "description": "Manage all users", "resource": "admin", "action": "manage_users"},
        {"name": "admin:system", "description": "Manage system settings", "resource": "admin", "action": "manage_system"},
    ]
    
    # Create permissions
    created_permissions = {}
    for perm_data in permissions_data:
        existing = db.query(Permission).filter(Permission.name == perm_data["name"]).first()
        if not existing:
            permission = Permission(**perm_data)
            db.add(permission)
            db.flush()
            created_permissions[perm_data["name"]] = permission
        else:
            created_permissions[perm_data["name"]] = existing
    
    # Define roles with their permissions
    roles_data = [
        {
            "name": "org_admin",
            "description": "Organization administrator with full organization access",
            "is_system_role": True,
            "permissions": [
                "org:read", "org:write", "org:manage_members",
                "assessment:read", "assessment:write", "assessment:delete", "assessment:collaborate",
                "document:read", "document:write", "document:delete",
                "analytics:read", "analytics:export"
            ]
        },
        {
            "name": "esg_manager",
            "description": "ESG manager with assessment and reporting capabilities",
            "is_system_role": True,
            "permissions": [
                "org:read",
                "assessment:read", "assessment:write", "assessment:collaborate",
                "document:read", "document:write",
                "analytics:read", "analytics:export"
            ]
        },
        {
            "name": "analyst",
            "description": "Analyst with read/write access to assessments and documents",
            "is_system_role": True,
            "permissions": [
                "org:read",
                "assessment:read", "assessment:write", "assessment:collaborate",
                "document:read", "document:write",
                "analytics:read"
            ]
        },
        {
            "name": "viewer",
            "description": "Read-only access to assessments and analytics",
            "is_system_role": True,
            "permissions": [
                "org:read",
                "assessment:read",
                "document:read",
                "analytics:read"
            ]
        },
        {
            "name": "system_admin",
            "description": "System administrator with full platform access",
            "is_system_role": True,
            "permissions": list(created_permissions.keys())  # All permissions
        }
    ]
    
    # Create roles and assign permissions
    for role_data in roles_data:
        existing_role = db.query(Role).filter(Role.name == role_data["name"]).first()
        if not existing_role:
            role = Role(
                name=role_data["name"],
                description=role_data["description"],
                is_system_role=role_data["is_system_role"]
            )
            db.add(role)
            db.flush()
            
            # Assign permissions to role
            for perm_name in role_data["permissions"]:
                if perm_name in created_permissions:
                    role_perm = RolePermission(
                        role_id=role.id,
                        permission_id=created_permissions[perm_name].id
                    )
                    db.add(role_perm)
            
            logger.info(f"Created role: {role_data['name']}")

def setup_default_esg_templates(db):
    """Create default ESG framework templates"""
    
    templates_data = [
        {
            "framework_type": ESGFramework.GRI,
            "name": "GRI Standards 2021",
            "description": "Global Reporting Initiative Standards for sustainability reporting",
            "version": "2021",
            "is_default": True,
            "scoring_method": ScoringMethod.WEIGHTED_AVERAGE,
            "configuration": {
                "categories": ["Economic", "Environmental", "Social"],
                "disclosure_types": ["Management Approach", "Topic-specific Standards"]
            }
        },
        {
            "framework_type": ESGFramework.SASB,
            "name": "SASB Standards",
            "description": "Sustainability Accounting Standards Board industry-specific standards",
            "version": "2023",
            "is_default": True,
            "scoring_method": ScoringMethod.WEIGHTED_AVERAGE,
            "configuration": {
                "industries": ["Technology", "Healthcare", "Financial Services", "Energy", "Materials"]
            }
        },
        {
            "framework_type": ESGFramework.TCFD,
            "name": "TCFD Recommendations",
            "description": "Task Force on Climate-related Financial Disclosures",
            "version": "2023",
            "is_default": True,
            "scoring_method": ScoringMethod.WEIGHTED_AVERAGE,
            "configuration": {
                "pillars": ["Governance", "Strategy", "Risk Management", "Metrics and Targets"]
            }
        }
    ]
    
    for template_data in templates_data:
        existing = db.query(ESGFrameworkTemplate).filter(
            ESGFrameworkTemplate.framework_type == template_data["framework_type"],
            ESGFrameworkTemplate.version == template_data["version"]
        ).first()
        
        if not existing:
            template = ESGFrameworkTemplate(**template_data)
            db.add(template)
            db.flush()
            
            # Add sample questions for each template
            create_sample_questions(db, template)
            
            logger.info(f"Created ESG template: {template_data['name']}")

def create_sample_questions(db, template):
    """Create sample questions for an ESG template"""
    
    if template.framework_type == ESGFramework.GRI:
        questions_data = [
            {
                "category": "Economic",
                "subcategory": "Economic Performance",
                "question_text": "What is your organization's direct economic value generated and distributed?",
                "question_type": QuestionType.NUMERIC,
                "required": True,
                "weight": 2.0,
                "display_order": 1,
                "guidance_text": "Include revenues, operating costs, employee wages and benefits, payments to providers of capital, payments to government, and community investments."
            },
            {
                "category": "Environmental",
                "subcategory": "Energy",
                "question_text": "What is your total energy consumption within the organization?",
                "question_type": QuestionType.NUMERIC,
                "required": True,
                "weight": 3.0,
                "display_order": 2,
                "guidance_text": "Report total fuel consumption from renewable and non-renewable sources in joules or multiples."
            },
            {
                "category": "Social",
                "subcategory": "Employment",
                "question_text": "What is the total number and rates of new employee hires and employee turnover?",
                "question_type": QuestionType.NUMERIC,
                "required": True,
                "weight": 2.0,
                "display_order": 3,
                "guidance_text": "Break down by age group, gender, and region where significant operations are located."
            }
        ]
    elif template.framework_type == ESGFramework.TCFD:
        questions_data = [
            {
                "category": "Governance",
                "subcategory": "Board Oversight",
                "question_text": "Describe the board's oversight of climate-related risks and opportunities.",
                "question_type": QuestionType.TEXT,
                "required": True,
                "weight": 3.0,
                "display_order": 1,
                "guidance_text": "Explain processes and frequency for board briefings on climate issues."
            },
            {
                "category": "Strategy",
                "subcategory": "Climate Scenarios",
                "question_text": "Describe the climate-related scenarios used by your organization.",
                "question_type": QuestionType.TEXT,
                "required": True,
                "weight": 3.0,
                "display_order": 2,
                "guidance_text": "Include details on scenarios considered and time horizons used."
            }
        ]
    else:
        questions_data = [
            {
                "category": "General",
                "subcategory": "Overview",
                "question_text": "Provide an overview of your organization's sustainability approach.",
                "question_type": QuestionType.TEXT,
                "required": True,
                "weight": 1.0,
                "display_order": 1,
                "guidance_text": "Describe your key sustainability priorities and initiatives."
            }
        ]
    
    for q_data in questions_data:
        question = AssessmentQuestion(
            template_id=template.id,
            **q_data
        )
        db.add(question)

def setup_default_admin(db):
    """Create default admin user and organization"""
    
    # Create default organization
    org_name = "Aurigraph Platform"
    existing_org = db.query(Organization).filter(Organization.name == org_name).first()
    
    if not existing_org:
        organization = Organization(
            name=org_name,
            slug="aurigraph-platform",
            description="Default platform organization for system administration",
            industry="Technology",
            website="https://aurigraph.io"
        )
        db.add(organization)
        db.flush()
        logger.info(f"Created default organization: {org_name}")
    else:
        organization = existing_org
    
    # Create default admin user
    admin_email = "admin@aurigraph.io"
    existing_user = db.query(User).filter(User.email == admin_email).first()
    
    if not existing_user:
        admin_user = User(
            email=admin_email,
            password_hash=hash_password("Admin123!"),  # Default password - should be changed
            first_name="System",
            last_name="Administrator",
            is_active=True,
            is_verified=True,
            is_superuser=True,
            current_organization_id=organization.id
        )
        db.add(admin_user)
        db.flush()
        
        # Add user to organization as owner
        membership = OrganizationMember(
            organization_id=organization.id,
            user_id=admin_user.id,
            role="org_admin",
            is_owner=True,
            is_active=True
        )
        db.add(membership)
        
        logger.info(f"Created admin user: {admin_email}")
        logger.warning("⚠️  Default admin password is 'Admin123!' - Please change immediately!")

if __name__ == "__main__":
    setup_database()