#!/usr/bin/env python3
"""
Aurex Platform™ - Comprehensive Authentication Backend
Implements SSO authentication across all 4 sub-applications
"""

from fastapi import FastAPI, HTTPException, Depends, status, Request, Response
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel, EmailStr
from typing import Optional, List, Dict, Any
from sqlalchemy import create_engine, Column, Integer, String, DateTime, Boolean, Text, ForeignKey
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, Session, relationship
import bcrypt
import jwt
import os
from datetime import datetime, timedelta
import logging
import json
import secrets
import uuid

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Database configuration
DATABASE_URL = os.getenv('DATABASE_URL', 'sqlite:///./aurex_platform.db')
engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False} if "sqlite" in DATABASE_URL else {})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

# Security configuration
SECRET_KEY = os.getenv('SECRET_KEY', 'aurex_platform_secret_key_2025_secure')
ALGORITHM = 'HS256'
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24  # 24 hours
REFRESH_TOKEN_EXPIRE_DAYS = 30

# Database Models
class User(Base):
    __tablename__ = 'users'

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    username = Column(String, unique=True, index=True, nullable=False)
    full_name = Column(String, nullable=False)
    hashed_password = Column(String, nullable=False)
    is_active = Column(Boolean, default=True)
    is_verified = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    last_login = Column(DateTime, nullable=True)
    profile_picture = Column(String, nullable=True)
    organization = Column(String, nullable=True)
    role = Column(String, default='user')  # user, admin, super_admin

    # SSO session tracking
    sessions = relationship('UserSession', back_populates='user', cascade='all, delete-orphan')
    app_permissions = relationship('UserAppPermission', back_populates='user', cascade='all, delete-orphan')

class UserSession(Base):
    __tablename__ = 'user_sessions'

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey('users.id'), nullable=False)
    session_token = Column(String, unique=True, nullable=False)
    refresh_token = Column(String, unique=True, nullable=False)
    expires_at = Column(DateTime, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    last_accessed = Column(DateTime, default=datetime.utcnow)
    ip_address = Column(String, nullable=True)
    user_agent = Column(String, nullable=True)
    is_active = Column(Boolean, default=True)

    user = relationship('User', back_populates='sessions')

class UserAppPermission(Base):
    __tablename__ = 'user_app_permissions'

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey('users.id'), nullable=False)
    app_name = Column(String, nullable=False)  # launchpad, hydropulse, sylvagraph, carbontrace
    permission_level = Column(String, default='read')  # read, write, admin
    granted_at = Column(DateTime, default=datetime.utcnow)
    is_active = Column(Boolean, default=True)

    user = relationship('User', back_populates='app_permissions')

# Create tables
Base.metadata.create_all(bind=engine)

# FastAPI app
app = FastAPI(
    title='Aurex Platform™ - Authentication Service',
    description='SSO Authentication service for all Aurex applications',
    version='2.0.0'
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:3001", "http://localhost:3002", "http://localhost:3003", "http://localhost:3004"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Security
security = HTTPBearer(auto_error=False)

# Pydantic models
class UserCreate(BaseModel):
    email: EmailStr
    username: str
    full_name: str
    password: str
    organization: Optional[str] = None

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class Token(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str
    expires_in: int
    user: Dict[str, Any]

class UserProfile(BaseModel):
    id: int
    email: str
    username: str
    full_name: str
    organization: Optional[str]
    role: str
    is_verified: bool
    created_at: datetime
    last_login: Optional[datetime]

class AppAccess(BaseModel):
    app_name: str
    redirect_url: str

# Database dependency
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# Utility functions
def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return bcrypt.checkpw(plain_password.encode('utf-8'), hashed_password.encode('utf-8'))

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({'exp': expire, 'type': 'access'})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

def create_refresh_token(data: dict):
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(days=REFRESH_TOKEN_EXPIRE_DAYS)
    to_encode.update({'exp': expire, 'type': 'refresh'})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db)
):
    if not credentials:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail='Authentication required',
            headers={'WWW-Authenticate': 'Bearer'},
        )

    try:
        payload = jwt.decode(credentials.credentials, SECRET_KEY, algorithms=[ALGORITHM])
        email: str = payload.get('sub')
        token_type: str = payload.get('type')

        if email is None or token_type != 'access':
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail='Invalid token',
                headers={'WWW-Authenticate': 'Bearer'},
            )
    except jwt.PyJWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail='Invalid token',
            headers={'WWW-Authenticate': 'Bearer'},
        )

    user = db.query(User).filter(User.email == email).first()
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail='User not found',
            headers={'WWW-Authenticate': 'Bearer'},
        )

    # Update last accessed time for session
    session = db.query(UserSession).filter(
        UserSession.user_id == user.id,
        UserSession.session_token == credentials.credentials,
        UserSession.is_active == True
    ).first()

    if session:
        session.last_accessed = datetime.utcnow()
        db.commit()

    return user

# API Endpoints
@app.get('/api/health')
async def health_check():
    return {
        'status': 'healthy',
        'timestamp': datetime.utcnow().isoformat(),
        'service': 'aurex-auth-service',
        'version': '2.0.0'
    }

@app.post('/api/auth/register', response_model=Token)
async def register(user: UserCreate, request: Request, db: Session = Depends(get_db)):
    try:
        # Check if user already exists
        db_user = db.query(User).filter(
            (User.email == user.email) | (User.username == user.username)
        ).first()

        if db_user:
            raise HTTPException(
                status_code=400,
                detail='Email or username already registered'
            )

        # Create new user
        hashed_password = hash_password(user.password)
        db_user = User(
            email=user.email,
            username=user.username,
            full_name=user.full_name,
            hashed_password=hashed_password,
            organization=user.organization,
            is_verified=True  # Auto-verify for demo
        )
        db.add(db_user)
        db.commit()
        db.refresh(db_user)

        # Create session tokens
        access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
        access_token = create_access_token(
            data={'sub': user.email}, expires_delta=access_token_expires
        )
        refresh_token = create_refresh_token(data={'sub': user.email})

        # Create session record
        session = UserSession(
            user_id=db_user.id,
            session_token=access_token,
            refresh_token=refresh_token,
            expires_at=datetime.utcnow() + access_token_expires,
            ip_address=request.client.host,
            user_agent=request.headers.get('user-agent', '')
        )
        db.add(session)

        # Grant default app permissions
        default_apps = ['launchpad', 'hydropulse', 'sylvagraph', 'carbontrace']
        for app_name in default_apps:
            permission = UserAppPermission(
                user_id=db_user.id,
                app_name=app_name,
                permission_level='read'
            )
            db.add(permission)

        db.commit()

        logger.info(f'👤 User registered: {user.email}')

        return Token(
            access_token=access_token,
            refresh_token=refresh_token,
            token_type='bearer',
            expires_in=ACCESS_TOKEN_EXPIRE_MINUTES * 60,
            user={
                'id': db_user.id,
                'email': db_user.email,
                'username': db_user.username,
                'full_name': db_user.full_name,
                'organization': db_user.organization,
                'role': db_user.role,
                'is_verified': db_user.is_verified
            }
        )

    except Exception as e:
        logger.error(f'❌ Registration failed: {e}')
        db.rollback()
        raise HTTPException(status_code=500, detail='Registration failed')

@app.post('/api/auth/login', response_model=Token)
async def login(user: UserLogin, request: Request, db: Session = Depends(get_db)):
    try:
        db_user = db.query(User).filter(User.email == user.email).first()
        if not db_user or not verify_password(user.password, db_user.hashed_password):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail='Incorrect email or password',
                headers={'WWW-Authenticate': 'Bearer'},
            )

        if not db_user.is_active:
            raise HTTPException(status_code=400, detail='Account is deactivated')

        # Update last login
        db_user.last_login = datetime.utcnow()

        # Create session tokens
        access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
        access_token = create_access_token(
            data={'sub': user.email}, expires_delta=access_token_expires
        )
        refresh_token = create_refresh_token(data={'sub': user.email})

        # Create session record
        session = UserSession(
            user_id=db_user.id,
            session_token=access_token,
            refresh_token=refresh_token,
            expires_at=datetime.utcnow() + access_token_expires,
            ip_address=request.client.host,
            user_agent=request.headers.get('user-agent', '')
        )
        db.add(session)
        db.commit()

        logger.info(f'🔐 User logged in: {user.email}')

        return Token(
            access_token=access_token,
            refresh_token=refresh_token,
            token_type='bearer',
            expires_in=ACCESS_TOKEN_EXPIRE_MINUTES * 60,
            user={
                'id': db_user.id,
                'email': db_user.email,
                'username': db_user.username,
                'full_name': db_user.full_name,
                'organization': db_user.organization,
                'role': db_user.role,
                'is_verified': db_user.is_verified
            }
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f'❌ Login failed: {e}')
        raise HTTPException(status_code=500, detail='Login failed')

@app.post('/api/auth/logout')
async def logout(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    try:
        # Deactivate all user sessions
        db.query(UserSession).filter(
            UserSession.user_id == current_user.id,
            UserSession.is_active == True
        ).update({'is_active': False})
        db.commit()

        logger.info(f'🚪 User logged out: {current_user.email}')
        return {'message': 'Successfully logged out'}

    except Exception as e:
        logger.error(f'❌ Logout failed: {e}')
        raise HTTPException(status_code=500, detail='Logout failed')

@app.get('/api/auth/me', response_model=UserProfile)
async def get_current_user_profile(current_user: User = Depends(get_current_user)):
    return UserProfile(
        id=current_user.id,
        email=current_user.email,
        username=current_user.username,
        full_name=current_user.full_name,
        organization=current_user.organization,
        role=current_user.role,
        is_verified=current_user.is_verified,
        created_at=current_user.created_at,
        last_login=current_user.last_login
    )

@app.post('/api/auth/app-access')
async def request_app_access(
    app_access: AppAccess,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    try:
        # Check if user has permission for the app
        permission = db.query(UserAppPermission).filter(
            UserAppPermission.user_id == current_user.id,
            UserAppPermission.app_name == app_access.app_name,
            UserAppPermission.is_active == True
        ).first()

        if not permission:
            raise HTTPException(
                status_code=403,
                detail=f'Access denied to {app_access.app_name}'
            )

        # Generate app-specific token
        app_token = create_access_token(
            data={
                'sub': current_user.email,
                'app': app_access.app_name,
                'permission': permission.permission_level
            }
        )

        logger.info(f'🔑 App access granted: {current_user.email} -> {app_access.app_name}')

        return {
            'access_granted': True,
            'app_token': app_token,
            'redirect_url': app_access.redirect_url,
            'permission_level': permission.permission_level
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f'❌ App access failed: {e}')
        raise HTTPException(status_code=500, detail='App access request failed')

@app.get('/api/auth/apps')
async def get_user_apps(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    try:
        permissions = db.query(UserAppPermission).filter(
            UserAppPermission.user_id == current_user.id,
            UserAppPermission.is_active == True
        ).all()

        apps = []
        app_info = {
            'launchpad': {
                'name': 'Aurex Launchpad™',
                'description': 'ESG Assessment & Analytics',
                'url': '/launchpad',
                'icon': '🚀'
            },
            'hydropulse': {
                'name': 'Aurex HydroPulse™',
                'description': 'Smart Water Management',
                'url': '/hydropulse',
                'icon': '💧'
            },
            'sylvagraph': {
                'name': 'Aurex Sylvagraph™',
                'description': 'Agroforestry Monitoring',
                'url': '/sylvagraph',
                'icon': '🌳'
            },
            'carbontrace': {
                'name': 'Aurex CarbonTrace™',
                'description': 'Carbon Credit Trading',
                'url': '/carbontrace',
                'icon': '🌍'
            }
        }

        for permission in permissions:
            if permission.app_name in app_info:
                app_data = app_info[permission.app_name].copy()
                app_data['permission_level'] = permission.permission_level
                app_data['granted_at'] = permission.granted_at.isoformat()
                apps.append(app_data)

        return {'apps': apps}

    except Exception as e:
        logger.error(f'❌ Failed to get user apps: {e}')
        raise HTTPException(status_code=500, detail='Failed to retrieve user applications')

if __name__ == '__main__':
    import uvicorn
    print("🚀 Starting Aurex Platform™ Authentication Service on http://localhost:8000")
    print("📚 API Documentation: http://localhost:8000/docs")
    uvicorn.run(app, host="0.0.0.0", port=8000, log_level="info")
