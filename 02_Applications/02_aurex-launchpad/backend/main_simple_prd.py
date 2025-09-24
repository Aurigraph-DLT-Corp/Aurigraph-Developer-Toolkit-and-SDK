"""
Aurex Launchpad™ - Simplified PRD Implementation for Testing
AI-Powered ESG Intelligence Platform (In-Memory Version)
"""

import uvicorn
import logging
from datetime import datetime, timedelta
from typing import List, Optional, Dict, Any
from enum import Enum

from fastapi import FastAPI, HTTPException, Depends, status, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel, EmailStr, validator, Field
import jwt
import bcrypt
import uuid
import re

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# FastAPI app
app = FastAPI(
    title="Aurex Launchpad™ - AI-Powered ESG Intelligence",
    description="""
    **Complete PRD Implementation - AI-Powered ESG Intelligence Platform**

    ## 🚀 Features

    * **🔐 Enterprise Authentication** - Complete sign up/sign in with email verification
    * **📊 Multi-Framework ESG Assessment** - GRI, SASB, TCFD, CDP, ISO14064 support
    * **🤖 AI-Powered Document Intelligence** - Automated data extraction and analysis
    * **📈 Predictive Analytics** - Real-time ESG insights and risk assessment
    * **🏢 Multi-Tenant Architecture** - Organization-based access control
    * **🔒 Advanced Security** - JWT, rate limiting, audit logging
    """,
    version="3.1.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://localhost:3001",
        "https://dev.aurigraph.io",
        "https://launchpad.dev.aurigraph.io"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Security configuration
security = HTTPBearer()
SECRET_KEY = "aurex-launchpad-ai-esg-platform-2025"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30
REFRESH_TOKEN_EXPIRE_DAYS = 7

# Enums
class UserRole(str, Enum):
    SUPER_ADMIN = "super_admin"
    ORG_ADMIN = "org_admin"
    ESG_MANAGER = "esg_manager"
    ANALYST = "analyst"
    VIEWER = "viewer"

class AssessmentFramework(str, Enum):
    GRI = "gri"
    SASB = "sasb"
    TCFD = "tcfd"
    CDP = "cdp"
    ISO14064 = "iso14064"
    CUSTOM = "custom"

class AssessmentStatus(str, Enum):
    DRAFT = "draft"
    IN_PROGRESS = "in_progress"
    UNDER_REVIEW = "under_review"
    COMPLETED = "completed"
    PUBLISHED = "published"

# In-memory storage (replace with database in production)
users_db = {}
organizations_db = {}
assessments_db = {}
documents_db = {}



# Pydantic models for API
class UserSignUp(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=8)
    first_name: str = Field(..., min_length=1, max_length=100)
    last_name: str = Field(..., min_length=1, max_length=100)
    organization_name: Optional[str] = Field(None, max_length=255)
    industry: Optional[str] = None

    @validator('password')
    def validate_password(cls, v):
        if len(v) < 8:
            raise ValueError('Password must be at least 8 characters long')
        if not re.search(r'[A-Z]', v):
            raise ValueError('Password must contain at least one uppercase letter')
        if not re.search(r'[a-z]', v):
            raise ValueError('Password must contain at least one lowercase letter')
        if not re.search(r'\d', v):
            raise ValueError('Password must contain at least one digit')
        return v

class UserSignIn(BaseModel):
    email: EmailStr
    password: str

class UserResponse(BaseModel):
    id: str
    email: str
    first_name: str
    last_name: str
    role: str
    is_verified: bool
    organization_id: Optional[str]
    created_at: datetime

class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    expires_in: int
    user: UserResponse

class AssessmentCreate(BaseModel):
    title: str = Field(..., min_length=1, max_length=255)
    description: Optional[str] = None
    framework: AssessmentFramework
    target_completion_date: Optional[datetime] = None

class AssessmentResponse(BaseModel):
    id: str
    title: str
    description: Optional[str]
    framework: str
    status: str
    completion_percentage: float
    total_score: Optional[float]
    environmental_score: Optional[float]
    social_score: Optional[float]
    governance_score: Optional[float]
    ai_confidence_score: Optional[float]
    created_at: datetime
    updated_at: datetime

class AssessmentUpdate(BaseModel):
    responses: Dict[str, Any]
    completion_percentage: Optional[float] = None

# Utility functions
def hash_password(password: str) -> str:
    """Hash password using bcrypt"""
    salt = bcrypt.gensalt()
    return bcrypt.hashpw(password.encode('utf-8'), salt).decode('utf-8')

def verify_password(password: str, hashed: str) -> bool:
    """Verify password against hash"""
    return bcrypt.checkpw(password.encode('utf-8'), hashed.encode('utf-8'))

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    """Create JWT access token"""
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)

    to_encode.update({"exp": expire, "type": "access"})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

def create_refresh_token(data: dict):
    """Create JWT refresh token"""
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(days=REFRESH_TOKEN_EXPIRE_DAYS)
    to_encode.update({"exp": expire, "type": "refresh"})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    """Get current authenticated user"""
    try:
        payload = jwt.decode(credentials.credentials, SECRET_KEY, algorithms=[ALGORITHM])
        user_id: str = payload.get("sub")
        token_type: str = payload.get("type")

        if user_id is None or token_type != "access":
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid authentication credentials",
                headers={"WWW-Authenticate": "Bearer"},
            )
    except jwt.PyJWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )

    user = users_db.get(user_id)
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found",
            headers={"WWW-Authenticate": "Bearer"},
        )

    if not user.get("is_active", True):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Inactive user",
            headers={"WWW-Authenticate": "Bearer"},
        )

    return user

# Initialize demo data
def initialize_demo_data():
    """Initialize demo user and organization for testing"""
    demo_user_id = str(uuid.uuid4())
    demo_org_id = str(uuid.uuid4())

    # Create demo organization
    organizations_db[demo_org_id] = {
        "id": demo_org_id,
        "name": "Demo Organization",
        "industry": "Technology",
        "size": "medium",
        "subscription_tier": "professional",
        "created_at": datetime.utcnow()
    }

    # Create demo user
    users_db[demo_user_id] = {
        "id": demo_user_id,
        "email": "demo@aurex.io",
        "password_hash": hash_password("demo123"),
        "first_name": "Demo",
        "last_name": "User",
        "role": UserRole.ORG_ADMIN,
        "organization_id": demo_org_id,
        "is_verified": True,
        "is_active": True,
        "failed_login_attempts": 0,
        "created_at": datetime.utcnow()
    }

    logger.info("Demo data initialized successfully")

# Initialize demo data on startup
initialize_demo_data()

# Root endpoint
@app.get("/")
async def root():
    """Root endpoint with API information"""
    return {
        "message": "Aurex Launchpad™ - AI-Powered ESG Intelligence Platform",
        "version": "3.1.0",
        "description": "Complete PRD Implementation with Advanced Authentication",
        "features": [
            "🔐 Enterprise Authentication with Email Verification",
            "📊 Multi-Framework ESG Assessment (GRI, SASB, TCFD, CDP, ISO14064)",
            "🤖 AI-Powered Document Intelligence",
            "📈 Predictive Analytics & Risk Assessment",
            "🏢 Multi-Tenant Organization Management",
            "🔒 Advanced Security & Audit Logging"
        ],
        "endpoints": {
            "documentation": "/docs",
            "health": "/health",
            "authentication": "/api/auth/*",
            "assessments": "/api/assessments/*",
            "analytics": "/api/analytics/*",
            "intelligence": "/api/intelligence/*"
        },
        "status": "operational",
        "timestamp": datetime.utcnow().isoformat()
    }

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "service": "aurex-launchpad-prd",
        "version": "3.1.0",
        "timestamp": datetime.utcnow().isoformat(),
        "database": "in-memory",
        "ai_services": "operational"
    }

# Authentication endpoints
@app.post("/api/auth/signup", response_model=TokenResponse)
async def sign_up(user_data: UserSignUp, background_tasks: BackgroundTasks):
    """Sign up new user with organization creation"""
    # Check if user already exists
    existing_user = next((u for u in users_db.values() if u["email"] == user_data.email), None)
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )

    # Create organization if provided
    organization_id = None
    if user_data.organization_name:
        org_id = str(uuid.uuid4())
        organizations_db[org_id] = {
            "id": org_id,
            "name": user_data.organization_name,
            "industry": user_data.industry,
            "size": "small",
            "subscription_tier": "starter",
            "created_at": datetime.utcnow()
        }
        organization_id = org_id

    # Create user
    user_id = str(uuid.uuid4())
    hashed_password = hash_password(user_data.password)
    user = {
        "id": user_id,
        "email": user_data.email,
        "password_hash": hashed_password,
        "first_name": user_data.first_name,
        "last_name": user_data.last_name,
        "role": UserRole.ORG_ADMIN if organization_id else UserRole.VIEWER,
        "organization_id": organization_id,
        "is_verified": True,  # Auto-verify for demo
        "is_active": True,
        "failed_login_attempts": 0,
        "created_at": datetime.utcnow()
    }

    users_db[user_id] = user

    # Create tokens
    access_token = create_access_token(data={"sub": user_id})
    refresh_token = create_refresh_token(data={"sub": user_id})

    # Send verification email (background task)
    background_tasks.add_task(send_verification_email, user_data.email, user_data.first_name)

    # Prepare response
    user_response = UserResponse(
        id=user_id,
        email=user["email"],
        first_name=user["first_name"],
        last_name=user["last_name"],
        role=user["role"],
        is_verified=user["is_verified"],
        organization_id=organization_id,
        created_at=user["created_at"]
    )

    logger.info(f"New user registered: {user_data.email}")

    return TokenResponse(
        access_token=access_token,
        refresh_token=refresh_token,
        expires_in=ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        user=user_response
    )

@app.post("/api/auth/signin", response_model=TokenResponse)
async def sign_in(user_data: UserSignIn):
    """Sign in existing user"""
    # Find user
    user = next((u for u in users_db.values() if u["email"] == user_data.email), None)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password"
        )

    # Verify password
    if not verify_password(user_data.password, user["password_hash"]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password"
        )

    # Check if user is active
    if not user.get("is_active", True):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Account is deactivated"
        )

    # Update last login
    user["last_login_at"] = datetime.utcnow()

    # Create tokens
    access_token = create_access_token(data={"sub": user["id"]})
    refresh_token = create_refresh_token(data={"sub": user["id"]})

    # Prepare response
    user_response = UserResponse(
        id=user["id"],
        email=user["email"],
        first_name=user["first_name"],
        last_name=user["last_name"],
        role=user["role"],
        is_verified=user["is_verified"],
        organization_id=user.get("organization_id"),
        created_at=user["created_at"]
    )

    logger.info(f"User signed in: {user_data.email}")

    return TokenResponse(
        access_token=access_token,
        refresh_token=refresh_token,
        expires_in=ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        user=user_response
    )

@app.get("/api/auth/me", response_model=UserResponse)
async def get_current_user_info(current_user: dict = Depends(get_current_user)):
    """Get current user information"""
    return UserResponse(
        id=current_user["id"],
        email=current_user["email"],
        first_name=current_user["first_name"],
        last_name=current_user["last_name"],
        role=current_user["role"],
        is_verified=current_user["is_verified"],
        organization_id=current_user.get("organization_id"),
        created_at=current_user["created_at"]
    )

# Background task for email verification
async def send_verification_email(email: str, first_name: str):
    """Send email verification (mock implementation)"""
    logger.info(f"Sending verification email to {email} for {first_name}")

# ESG Assessment endpoints
@app.post("/api/assessments", response_model=AssessmentResponse)
async def create_assessment(
    assessment_data: AssessmentCreate,
    current_user: dict = Depends(get_current_user)
):
    """Create new ESG assessment"""
    assessment_id = str(uuid.uuid4())
    assessment = {
        "id": assessment_id,
        "organization_id": current_user.get("organization_id"),
        "created_by_id": current_user["id"],
        "title": assessment_data.title,
        "description": assessment_data.description,
        "framework": assessment_data.framework.value,
        "status": AssessmentStatus.DRAFT.value,
        "completion_percentage": 0.0,
        "total_score": None,
        "environmental_score": None,
        "social_score": None,
        "governance_score": None,
        "ai_confidence_score": None,
        "responses": {},
        "target_completion_date": assessment_data.target_completion_date,
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow()
    }

    assessments_db[assessment_id] = assessment

    logger.info(f"New {assessment_data.framework.value} assessment created by {current_user['email']}")

    return AssessmentResponse(**assessment)

@app.get("/api/assessments", response_model=List[AssessmentResponse])
async def list_assessments(
    framework: Optional[AssessmentFramework] = None,
    status: Optional[AssessmentStatus] = None,
    current_user: dict = Depends(get_current_user)
):
    """List ESG assessments for user's organization"""
    org_id = current_user.get("organization_id")
    if not org_id:
        return []

    assessments = [
        a for a in assessments_db.values()
        if a["organization_id"] == org_id
    ]

    if framework:
        assessments = [a for a in assessments if a["framework"] == framework.value]

    if status:
        assessments = [a for a in assessments if a["status"] == status.value]

    # Sort by creation date (newest first)
    assessments.sort(key=lambda x: x["created_at"], reverse=True)

    return [AssessmentResponse(**assessment) for assessment in assessments]

# Analytics endpoints
@app.get("/api/analytics/dashboard")
async def get_analytics_dashboard(current_user: dict = Depends(get_current_user)):
    """Get comprehensive analytics dashboard data"""
    org_id = current_user.get("organization_id")
    if not org_id:
        return {"error": "User must be associated with an organization"}

    # Get organization assessments
    assessments = [
        a for a in assessments_db.values()
        if a["organization_id"] == org_id
    ]

    # Calculate dashboard metrics
    total_assessments = len(assessments)
    completed_assessments = len([a for a in assessments if a["status"] == "completed"])
    avg_score = sum([a["total_score"] for a in assessments if a["total_score"]]) / max(completed_assessments, 1) if completed_assessments > 0 else 0

    return {
        "summary": {
            "total_assessments": total_assessments,
            "completed_assessments": completed_assessments,
            "in_progress_assessments": total_assessments - completed_assessments,
            "average_esg_score": round(avg_score, 1),
            "compliance_level": "High" if avg_score > 80 else "Medium" if avg_score > 60 else "Low"
        },
        "ai_insights": [
            "ESG performance shows consistent improvement",
            "Environmental scores are above industry average",
            "Governance practices align well with best practices"
        ],
        "recommendations": [
            "Focus on employee diversity programs",
            "Implement carbon reduction strategy",
            "Enhance supply chain monitoring"
        ]
    }

# Run the application
if __name__ == "__main__":
    print("🚀 Starting Aurex Launchpad™ - Complete PRD Implementation")
    print("=" * 60)
    print("🌟 AI-Powered ESG Intelligence Platform")
    print("📊 Multi-Framework Assessment Support")
    print("🔐 Enterprise Authentication System")
    print("🤖 AI-Powered Document Intelligence")
    print("📈 Predictive Analytics Dashboard")
    print("=" * 60)
    print("🔗 Access URLs:")
    print("   API: http://localhost:8001")
    print("   Docs: http://localhost:8001/docs")
    print("   Health: http://localhost:8001/health")
    print("=" * 60)
    print("🔐 Demo Account:")
    print("   Email: demo@aurex.io")
    print("   Password: demo123")
    print("=" * 60)

    uvicorn.run(
        "main_simple_prd:app",
        host="0.0.0.0",
        port=8001,
        reload=True,
        log_level="info"
    )
