"""
Database Initialization Script
Set up initial roles, permissions, and sample data
"""

from sqlalchemy.orm import Session
from app.database import engine, SessionLocal
from app.models.users import User, Role, Permission
from app.models.project_registration import VerificationBody
from app.core.config import PERMISSIONS, ROLES
import uuid
from passlib.context import CryptContext

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def create_permissions(db: Session):
    """Create all permissions from config"""
    print("📋 Creating permissions...")
    
    for code, description in PERMISSIONS.items():
        existing = db.query(Permission).filter(Permission.code == code).first()
        if not existing:
            resource, action = code.split(":", 1)
            permission = Permission(
                name=description,
                code=code,
                description=description,
                resource=resource,
                action=action
            )
            db.add(permission)
    
    db.commit()
    print(f"✅ Created {len(PERMISSIONS)} permissions")


def create_roles(db: Session):
    """Create all roles with their permissions"""
    print("👥 Creating roles...")
    
    for code, role_data in ROLES.items():
        existing_role = db.query(Role).filter(Role.code == code).first()
        if not existing_role:
            role = Role(
                name=role_data["name"],
                code=code,
                description=f"Role for {role_data['name']}",
                level=role_data["level"]
            )
            db.add(role)
            db.flush()
            
            # Add permissions to role
            for perm_code in role_data["permissions"]:
                permission = db.query(Permission).filter(Permission.code == perm_code).first()
                if permission:
                    role.permissions.append(permission)
            
            db.commit()
    
    print(f"✅ Created {len(ROLES)} roles")


def create_sample_users(db: Session):
    """Create comprehensive sample users for testing"""
    print("👤 Creating comprehensive sample users for testing...")
    
    users_data = [
        # Super Admin - Full system access
        {
            "email": "admin@aurigraph.io",
            "username": "admin",
            "full_name": "System Administrator",
            "organization": "Aurigraph",
            "designation": "System Administrator",
            "role": "super_admin",
            "territories": ["Maharashtra", "Chhattisgarh", "Andhra Pradesh"]
        },
        
        # Business Owner - Multi-state access
        {
            "email": "ceo@aurigraph.io", 
            "username": "ceo_rajesh",
            "full_name": "Rajesh Kumar",
            "organization": "Aurigraph",
            "designation": "CEO & Business Owner",
            "role": "business_owner",
            "territories": ["Maharashtra", "Chhattisgarh", "Andhra Pradesh"]
        },
        {
            "email": "coo@aurigraph.io", 
            "username": "coo_priya",
            "full_name": "Priya Sharma",
            "organization": "Aurigraph",
            "designation": "Chief Operating Officer",
            "role": "business_owner",
            "territories": ["Maharashtra", "Chhattisgarh"]
        },
        
        # Project Managers - State-specific
        {
            "email": "pm.maharashtra@aurigraph.io",
            "username": "pm_mumbai",
            "full_name": "Anil Patil",
            "organization": "Aurigraph",
            "designation": "Project Manager - Maharashtra",
            "role": "project_manager",
            "territories": ["Maharashtra"]
        },
        {
            "email": "pm.chhattisgarh@aurigraph.io",
            "username": "pm_raipur",
            "full_name": "Deepak Verma",
            "organization": "Aurigraph",
            "designation": "Project Manager - Chhattisgarh",
            "role": "project_manager",
            "territories": ["Chhattisgarh"]
        },
        {
            "email": "pm.andhra@aurigraph.io",
            "username": "pm_hyderabad",
            "full_name": "Srinivas Reddy",
            "organization": "Aurigraph",
            "designation": "Project Manager - Andhra Pradesh",
            "role": "project_manager",
            "territories": ["Andhra Pradesh"]
        },
        
        # Field Coordinators - District-specific
        {
            "email": "field.pune@aurigraph.io",
            "username": "field_pune",
            "full_name": "Suresh Jadhav",
            "organization": "Aurigraph Field Team",
            "designation": "Field Coordinator - Pune",
            "role": "field_coordinator", 
            "territories": ["Maharashtra"]
        },
        {
            "email": "field.nagpur@aurigraph.io",
            "username": "field_nagpur",
            "full_name": "Rahul Deshmukh",
            "organization": "Aurigraph Field Team",
            "designation": "Field Coordinator - Nagpur",
            "role": "field_coordinator", 
            "territories": ["Maharashtra"]
        },
        {
            "email": "field.raipur@aurigraph.io",
            "username": "field_raipur",
            "full_name": "Vikash Singh",
            "organization": "Aurigraph Field Team",
            "designation": "Field Coordinator - Raipur",
            "role": "field_coordinator", 
            "territories": ["Chhattisgarh"]
        },
        {
            "email": "field.guntur@aurigraph.io",
            "username": "field_guntur",
            "full_name": "Krishna Murthy",
            "organization": "Aurigraph Field Team",
            "designation": "Field Coordinator - Guntur",
            "role": "field_coordinator", 
            "territories": ["Andhra Pradesh"]
        },
        
        # Data Analysts - Specialized roles
        {
            "email": "analyst.carbon@aurigraph.io",
            "username": "analyst_carbon",
            "full_name": "Dr. Meera Gupta",
            "organization": "Aurigraph Analytics",
            "designation": "Senior Carbon Data Analyst",
            "role": "data_analyst",
            "territories": ["Maharashtra", "Chhattisgarh", "Andhra Pradesh"]
        },
        {
            "email": "analyst.water@aurigraph.io",
            "username": "analyst_water",
            "full_name": "Arjun Menon",
            "organization": "Aurigraph Analytics",
            "designation": "Water Management Analyst",
            "role": "data_analyst",
            "territories": ["Maharashtra", "Chhattisgarh"]
        },
        
        # Viewers - Read-only access
        {
            "email": "viewer.investor@aurigraph.io",
            "username": "viewer_investor",
            "full_name": "James Wilson",
            "organization": "Green Climate Fund",
            "designation": "Investment Analyst",
            "role": "viewer",
            "territories": ["Maharashtra", "Chhattisgarh", "Andhra Pradesh"]
        },
        {
            "email": "viewer.audit@aurigraph.io",
            "username": "viewer_audit",
            "full_name": "Kavita Nair",
            "organization": "Carbon Audit Partners",
            "designation": "External Auditor",
            "role": "viewer",
            "territories": ["Maharashtra"]
        },
        
        # External VVB Users (for testing VVB workflows)
        {
            "email": "vvb.verra@aurigraph.io",
            "username": "vvb_verra",
            "full_name": "Ashok Rao",
            "organization": "Verra India Verification Services",
            "designation": "Senior Verification Officer",
            "role": "data_analyst",  # Has verification permissions
            "territories": ["Maharashtra", "Chhattisgarh"]
        },
        {
            "email": "vvb.goldstandard@aurigraph.io",
            "username": "vvb_gs",
            "full_name": "Nandini Iyer",
            "organization": "Gold Standard Verification India",
            "designation": "Verification Manager",
            "role": "data_analyst",  # Has verification permissions
            "territories": ["Andhra Pradesh", "Maharashtra"]
        }
    ]
    
    for user_data in users_data:
        existing = db.query(User).filter(User.email == user_data["email"]).first()
        if not existing:
            # Create user
            user = User(
                email=user_data["email"],
                username=user_data["username"],
                full_name=user_data["full_name"],
                organization=user_data["organization"],
                designation=user_data.get("designation"),
                hashed_password=pwd_context.hash("password123"),  # Default password
                is_active=True,
                is_verified=True,
                assigned_territories=user_data["territories"],
                is_super_admin=(user_data["role"] == "super_admin")
            )
            db.add(user)
            db.flush()
            
            # Assign role
            role = db.query(Role).filter(Role.code == user_data["role"]).first()
            if role:
                user.roles.append(role)
            
            db.commit()
    
    print(f"✅ Created {len(users_data)} sample users")


def create_sample_vvbs(db: Session):
    """Create sample VVBs for testing"""
    print("🏢 Creating sample VVBs...")
    
    vvbs_data = [
        {
            "name": "Verra India Verification Services",
            "organization": "Verra India Pvt Ltd",
            "email": "verify@verra.in",
            "accreditation_body": "Verra",
            "accreditation_number": "VVB001",
            "methodologies": ["verra_vm0042", "vmd0051"],
            "regions": ["Maharashtra", "Chhattisgarh"]
        },
        {
            "name": "Gold Standard Verification India",
            "organization": "Gold Standard India",
            "email": "verify@goldstandard.in",
            "accreditation_body": "Gold Standard",
            "accreditation_number": "GS001",
            "methodologies": ["gold_standard"],
            "regions": ["Andhra Pradesh", "Maharashtra"]
        },
        {
            "name": "India Carbon Verification Bureau",
            "organization": "ICVB Ltd",
            "email": "verify@icvb.co.in",
            "accreditation_body": "Verra",
            "accreditation_number": "VVB002",
            "methodologies": ["verra_vm0042", "custom"],
            "regions": ["Maharashtra", "Chhattisgarh", "Andhra Pradesh"]
        }
    ]
    
    for vvb_data in vvbs_data:
        existing = db.query(VerificationBody).filter(
            VerificationBody.name == vvb_data["name"]
        ).first()
        
        if not existing:
            vvb = VerificationBody(
                name=vvb_data["name"],
                organization=vvb_data["organization"],
                email=vvb_data["email"],
                accreditation_body=vvb_data["accreditation_body"],
                accreditation_number=vvb_data["accreditation_number"],
                methodologies_supported=vvb_data["methodologies"],
                regions_covered=vvb_data["regions"]
            )
            db.add(vvb)
    
    db.commit()
    print(f"✅ Created {len(vvbs_data)} sample VVBs")


def init_database():
    """Initialize the database with all required data"""
    print("🚀 Initializing HydroPulse database...")
    
    # Create database session
    db = SessionLocal()
    
    try:
        # Create all data in order
        create_permissions(db)
        create_roles(db)
        create_sample_users(db) 
        create_sample_vvbs(db)
        
        print("🎉 Database initialization complete!")
        print("\n📝 Comprehensive Test User Credentials (All passwords: password123)")
        print("\n🔑 SUPER ADMIN:")
        print("   • admin@aurigraph.io - System Administrator (All states)")
        
        print("\n👔 BUSINESS OWNERS:")
        print("   • ceo@aurigraph.io - Rajesh Kumar, CEO (All states)")
        print("   • coo@aurigraph.io - Priya Sharma, COO (MH, CG)")
        
        print("\n📊 PROJECT MANAGERS:")
        print("   • pm.maharashtra@aurigraph.io - Anil Patil (Maharashtra)")
        print("   • pm.chhattisgarh@aurigraph.io - Deepak Verma (Chhattisgarh)")
        print("   • pm.andhra@aurigraph.io - Srinivas Reddy (Andhra Pradesh)")
        
        print("\n🌾 FIELD COORDINATORS:")
        print("   • field.pune@aurigraph.io - Suresh Jadhav (Maharashtra)")
        print("   • field.nagpur@aurigraph.io - Rahul Deshmukh (Maharashtra)")
        print("   • field.raipur@aurigraph.io - Vikash Singh (Chhattisgarh)")
        print("   • field.guntur@aurigraph.io - Krishna Murthy (Andhra Pradesh)")
        
        print("\n📈 DATA ANALYSTS:")
        print("   • analyst.carbon@aurigraph.io - Dr. Meera Gupta (All states)")
        print("   • analyst.water@aurigraph.io - Arjun Menon (MH, CG)")
        
        print("\n👁️ VIEWERS:")
        print("   • viewer.investor@aurigraph.io - James Wilson (All states)")
        print("   • viewer.audit@aurigraph.io - Kavita Nair (Maharashtra)")
        
        print("\n✅ VVB USERS:")
        print("   • vvb.verra@aurigraph.io - Ashok Rao, Verra (MH, CG)")
        print("   • vvb.goldstandard@aurigraph.io - Nandini Iyer, Gold Standard (AP, MH)")
        
        print("\n🧪 TESTING SCENARIOS:")
        print("   • Territory Restrictions: Try PM users accessing other states")
        print("   • Role Permissions: Test create/approve/delete with different roles") 
        print("   • Multi-level Approval: PM → Business Owner → Super Admin workflow")
        print("   • VVB Assignment: Test VVB user workflows and validations")
        
    except Exception as e:
        print(f"❌ Error during initialization: {e}")
        db.rollback()
        raise
    finally:
        db.close()


if __name__ == "__main__":
    init_database()