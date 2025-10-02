# ================================================================================
# AUREX LAUNCHPAD™ BASE MODELS
# Foundation models for all database entities
# Agent: Data Processing Agent
# ================================================================================

from sqlalchemy import Column, DateTime, Boolean, String, Text, Integer, create_engine
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.ext.declarative import declarative_base, declared_attr
from sqlalchemy.orm import sessionmaker, Session
from datetime import datetime
import uuid
import os
from typing import Optional, Dict, Any
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# ================================================================================
# BASE CONFIGURATION
# ================================================================================

Base = declarative_base()

class TimestampMixin:
    """Mixin for automatic timestamp management"""
    
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

class BaseModel(Base):
    """Base model with UUID primary key"""
    __abstract__ = True
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, unique=True, nullable=False)
    
    @declared_attr
    def __tablename__(cls):
        return cls.__name__.lower()
    
    def to_dict(self, exclude_fields: Optional[list] = None) -> Dict[str, Any]:
        """Convert model instance to dictionary"""
        exclude_fields = exclude_fields or []
        result = {}
        
        for column in self.__table__.columns:
            if column.name not in exclude_fields:
                value = getattr(self, column.name)
                if isinstance(value, datetime):
                    result[column.name] = value.isoformat()
                elif isinstance(value, uuid.UUID):
                    result[column.name] = str(value)
                else:
                    result[column.name] = value
        
        return result
    
    def update_from_dict(self, data: Dict[str, Any], exclude_fields: Optional[list] = None) -> None:
        """Update model instance from dictionary"""
        exclude_fields = exclude_fields or ['id', 'created_at', 'updated_at']
        
        for key, value in data.items():
            if key not in exclude_fields and hasattr(self, key):
                setattr(self, key, value)

class BaseModelWithSoftDelete(BaseModel):
    """Base model with soft delete functionality"""
    __abstract__ = True
    
    deleted_at = Column(DateTime, nullable=True)
    is_deleted = Column(Boolean, default=False, nullable=False)
    
    def soft_delete(self) -> None:
        """Perform soft delete"""
        self.is_deleted = True
        self.deleted_at = datetime.utcnow()
    
    def restore(self) -> None:
        """Restore soft deleted record"""
        self.is_deleted = False
        self.deleted_at = None
    
    @property
    def is_active(self) -> bool:
        """Check if record is active (not soft deleted)"""
        return not self.is_deleted

# ================================================================================
# DATABASE CONFIGURATION AND UTILITIES
# ================================================================================

class DatabaseConfig:
    """Database configuration and connection management"""
    
    def __init__(self, database_url: str = None):
        self.database_url = database_url or os.getenv('DATABASE_URL', "postgresql://aurex_user:AurexProd2024!SecureDB#2025@localhost:5432/aurex_launchpad")
        self.engine = None
        self.SessionLocal = None
    
    def create_engine(self, **kwargs):
        """Create database engine with optimized settings"""
        engine_kwargs = {
            'pool_size': 20,
            'max_overflow': 30,
            'pool_pre_ping': True,
            'pool_recycle': 3600,
            'echo': False,  # Set to True for SQL debugging
            **kwargs
        }
        
        self.engine = create_engine(self.database_url, **engine_kwargs)
        self.SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=self.engine)
        return self.engine
    
    def create_all_tables(self):
        """Create all database tables"""
        if not self.engine:
            self.create_engine()
        
        Base.metadata.create_all(bind=self.engine)
        print("✅ All database tables created successfully!")
    
    def get_session(self) -> Session:
        """Get database session"""
        if not self.SessionLocal:
            self.create_engine()
        
        return self.SessionLocal()
    
    def close_session(self, session: Session):
        """Close database session"""
        session.close()

# Global database configuration
db_config = DatabaseConfig()

# Initialize database connection on-demand (not at import time)
# db_config.create_engine()

# Export commonly used database objects (will be None until engine is created)
engine = None
SessionLocal = None

def get_db() -> Session:
    """Dependency function for FastAPI to get database session"""
    global engine, SessionLocal
    if engine is None:
        engine = db_config.create_engine()
        SessionLocal = db_config.SessionLocal
    
    session = db_config.get_session()
    try:
        yield session
    finally:
        db_config.close_session(session)

def init_database():
    """Initialize database connection and return engine"""
    global engine, SessionLocal
    if engine is None:
        engine = db_config.create_engine()
        SessionLocal = db_config.SessionLocal
    return engine

def create_all_tables(engine=None):
    """Helper function to create all tables"""
    if engine:
        Base.metadata.create_all(bind=engine)
    else:
        # Initialize connection if needed
        if db_config.engine is None:
            db_config.create_engine()
        db_config.create_all_tables()

print("✅ Base Models Loaded Successfully!")
print("Features:")
print("  🗄️ UUID Primary Keys")
print("  ⏰ Automatic Timestamps")
print("  🗑️ Soft Delete Support")
print("  🔄 Dictionary Conversion")
print("  📊 Optimized Database Configuration")
print("  🏗️ Table Creation Utilities")