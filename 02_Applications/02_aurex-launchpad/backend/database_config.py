# ================================================================================
# Aurex Launchpad - Database Configuration Module
# ================================================================================
# Description: Centralized database configuration with environment-based settings
# Features: Connection pooling, health checks, async support, error handling
# Compatible: SQLAlchemy 2.0, PostgreSQL, Redis
# ================================================================================

import os
import logging
from typing import AsyncGenerator, Optional
from contextlib import asynccontextmanager
from sqlalchemy import create_engine, MetaData, text, event
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, Session
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy.pool import QueuePool
import redis
from redis import asyncio as aioredis
import asyncio
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class DatabaseConfig:
    """Centralized database configuration management"""
    
    def __init__(self, service_name: str = "launchpad"):
        self.service_name = service_name
        self.environment = os.getenv("ENVIRONMENT", "development")
        
        # Database configuration
        self._setup_database_config()
        
        # Redis configuration
        self._setup_redis_config()
        
        # Connection pools
        self._setup_connection_pools()

    def _setup_database_config(self):
        """Setup PostgreSQL database configuration"""
        
        # Get database URL based on service and environment
        if self.environment == "production":
            self.database_url = self._get_production_db_url()
        else:
            self.database_url = self._get_development_db_url()
        
        # Convert to async URL for SQLAlchemy async operations
        if self.database_url.startswith("postgresql://"):
            self.async_database_url = self.database_url.replace("postgresql://", "postgresql+asyncpg://")
        else:
            self.async_database_url = self.database_url

        logger.info(f"Database URL configured for {self.service_name} ({self.environment})")

    def _get_production_db_url(self) -> str:
        """Get production database URL from environment variables"""
        
        # Try service-specific URL first
        service_url_key = f"DATABASE_URL_{self.service_name.upper()}"
        service_url = os.getenv(service_url_key)
        
        if service_url:
            return service_url
            
        # Fallback to generic DATABASE_URL
        generic_url = os.getenv("DATABASE_URL")
        if generic_url:
            return generic_url
            
        # Build URL from individual components
        postgres_password = os.getenv("POSTGRES_PASSWORD")
        postgres_user = os.getenv("POSTGRES_USER", "postgres")
        postgres_host = os.getenv("POSTGRES_HOST", "postgres")
        postgres_port = os.getenv("POSTGRES_PORT", "5432")
        postgres_db = f"aurex_{self.service_name}"
        
        if not postgres_password:
            raise ValueError("POSTGRES_PASSWORD environment variable is required for production")
            
        return f"postgresql://{postgres_user}:{postgres_password}@{postgres_host}:{postgres_port}/{postgres_db}"

    def _get_development_db_url(self) -> str:
        """Get development database URL"""
        
        # Try service-specific URL first
        service_url_key = f"DEV_DATABASE_URL_{self.service_name.upper()}"
        service_url = os.getenv(service_url_key)
        
        if service_url:
            return service_url
            
        # Fallback to generic development URL
        dev_url = os.getenv("DEV_DATABASE_URL")
        if dev_url:
            return dev_url
            
        # Default development configuration
        return f"postgresql://postgres:postgres@localhost:5432/aurex_{self.service_name}_dev"

    def _setup_redis_config(self):
        """Setup Redis configuration"""
        
        # Redis database mapping for each service
        redis_db_mapping = {
            "platform": 0,
            "launchpad": 1,
            "hydropulse": 2,
            "sylvagraph": 3,
            "carbontrace": 4,
            "admin": 5
        }
        
        self.redis_db = redis_db_mapping.get(self.service_name, 0)
        
        if self.environment == "production":
            self.redis_url = self._get_production_redis_url()
        else:
            self.redis_url = self._get_development_redis_url()

    def _get_production_redis_url(self) -> str:
        """Get production Redis URL"""
        
        # Try service-specific URL first
        service_url_key = f"REDIS_URL_{self.service_name.upper()}"
        service_url = os.getenv(service_url_key)
        
        if service_url:
            return service_url
            
        # Build URL from components
        redis_password = os.getenv("REDIS_PASSWORD")
        redis_host = os.getenv("REDIS_HOST", "redis")
        redis_port = os.getenv("REDIS_PORT", "6379")
        
        if redis_password:
            return f"redis://:{redis_password}@{redis_host}:{redis_port}/{self.redis_db}"
        else:
            return f"redis://{redis_host}:{redis_port}/{self.redis_db}"

    def _get_development_redis_url(self) -> str:
        """Get development Redis URL"""
        
        dev_redis_url = os.getenv("DEV_REDIS_URL")
        if dev_redis_url:
            return dev_redis_url
            
        return f"redis://localhost:6379/{self.redis_db}"

    def _setup_connection_pools(self):
        """Setup connection pool configurations"""
        
        # Database pool settings
        self.db_pool_size = int(os.getenv("DB_POOL_SIZE", "20"))
        self.db_max_overflow = int(os.getenv("DB_MAX_OVERFLOW", "30"))
        self.db_pool_timeout = int(os.getenv("DB_POOL_TIMEOUT", "30"))
        self.db_pool_recycle = int(os.getenv("DB_POOL_RECYCLE", "3600"))
        
        # Redis pool settings
        self.redis_pool_size = int(os.getenv("REDIS_POOL_SIZE", "10"))
        self.redis_max_connections = int(os.getenv("REDIS_MAX_CONNECTIONS", "50"))

# Global configuration instance
config = DatabaseConfig()

# ================================================================================
# DATABASE SETUP
# ================================================================================

# Create database engines with optimized settings
engine = create_engine(
    config.database_url,
    poolclass=QueuePool,
    pool_size=config.db_pool_size,
    max_overflow=config.db_max_overflow,
    pool_timeout=config.db_pool_timeout,
    pool_recycle=config.db_pool_recycle,
    pool_pre_ping=True,
    echo=config.environment == "development"
)

async_engine = create_async_engine(
    config.async_database_url,
    poolclass=QueuePool,
    pool_size=config.db_pool_size,
    max_overflow=config.db_max_overflow,
    pool_timeout=config.db_pool_timeout,
    pool_recycle=config.db_pool_recycle,
    pool_pre_ping=True,
    echo=config.environment == "development"
)

# Create session makers
SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine,
    expire_on_commit=False
)

AsyncSessionLocal = async_sessionmaker(
    async_engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autoflush=False,
    autocommit=False
)

# Base class for ORM models
Base = declarative_base()

# Metadata for table creation
metadata = MetaData()

# ================================================================================
# REDIS SETUP
# ================================================================================

# Redis connection pool
redis_pool = redis.ConnectionPool.from_url(
    config.redis_url,
    max_connections=config.redis_max_connections,
    retry_on_timeout=True,
    socket_keepalive=True,
    socket_keepalive_options={}
)

# Redis client
redis_client = redis.Redis(connection_pool=redis_pool)

# Async Redis client
async_redis_client = None

async def get_async_redis_client():
    """Get async Redis client with lazy initialization"""
    global async_redis_client
    if async_redis_client is None:
        async_redis_client = aioredis.from_url(
            config.redis_url,
            max_connections=config.redis_max_connections,
            retry_on_timeout=True
        )
    return async_redis_client

# ================================================================================
# DATABASE SESSION MANAGEMENT
# ================================================================================

def get_db() -> Session:
    """Get synchronous database session"""
    db = SessionLocal()
    try:
        yield db
    except Exception as e:
        logger.error(f"Database session error: {e}")
        db.rollback()
        raise
    finally:
        db.close()

@asynccontextmanager
async def get_async_db() -> AsyncGenerator[AsyncSession, None]:
    """Get asynchronous database session"""
    async with AsyncSessionLocal() as db:
        try:
            yield db
            await db.commit()
        except Exception as e:
            logger.error(f"Async database session error: {e}")
            await db.rollback()
            raise
        finally:
            await db.close()

async def get_async_db_session() -> AsyncSession:
    """Get async database session (for dependency injection)"""
    async with AsyncSessionLocal() as db:
        try:
            yield db
        except Exception as e:
            logger.error(f"Async database dependency error: {e}")
            await db.rollback()
            raise
        finally:
            await db.close()

# ================================================================================
# HEALTH CHECK FUNCTIONS
# ================================================================================

async def check_database_health() -> bool:
    """Check database connectivity and health"""
    try:
        async with async_engine.begin() as conn:
            result = await conn.execute(text("SELECT 1"))
            row = result.fetchone()
            return row is not None and row[0] == 1
    except Exception as e:
        logger.error(f"Database health check failed: {e}")
        return False

async def check_redis_health() -> bool:
    """Check Redis connectivity and health"""
    try:
        redis = await get_async_redis_client()
        await redis.ping()
        return True
    except Exception as e:
        logger.error(f"Redis health check failed: {e}")
        return False

def check_sync_database_health() -> bool:
    """Check synchronous database connectivity"""
    try:
        with engine.begin() as conn:
            result = conn.execute(text("SELECT 1"))
            row = result.fetchone()
            return row is not None and row[0] == 1
    except Exception as e:
        logger.error(f"Sync database health check failed: {e}")
        return False

def check_sync_redis_health() -> bool:
    """Check synchronous Redis connectivity"""
    try:
        redis_client.ping()
        return True
    except Exception as e:
        logger.error(f"Sync Redis health check failed: {e}")
        return False

# ================================================================================
# DATABASE INITIALIZATION
# ================================================================================

async def initialize_database():
    """Initialize database and create tables"""
    try:
        logger.info("Initializing database...")
        
        # Create all tables
        async with async_engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)
        
        logger.info("Database initialization completed successfully")
        return True
        
    except Exception as e:
        logger.error(f"Database initialization failed: {e}")
        return False

def initialize_sync_database():
    """Initialize database synchronously"""
    try:
        logger.info("Initializing database (sync)...")
        
        # Create all tables
        Base.metadata.create_all(bind=engine)
        
        logger.info("Sync database initialization completed successfully")
        return True
        
    except Exception as e:
        logger.error(f"Sync database initialization failed: {e}")
        return False

# ================================================================================
# CONNECTION EVENT HANDLERS
# ================================================================================

@event.listens_for(engine, "connect")
def set_sqlite_pragma(dbapi_connection, connection_record):
    """Set database connection parameters"""
    # This can be used to set PostgreSQL-specific parameters
    pass

@event.listens_for(engine, "checkout")
def receive_checkout(dbapi_connection, connection_record, connection_proxy):
    """Log connection checkout for monitoring"""
    if config.environment == "development":
        logger.debug("Database connection checked out")

# ================================================================================
# UTILITY FUNCTIONS
# ================================================================================

def get_database_info():
    """Get database connection information (for debugging)"""
    return {
        "service_name": config.service_name,
        "environment": config.environment,
        "database_url": config.database_url.replace(os.getenv("POSTGRES_PASSWORD", ""), "***") if os.getenv("POSTGRES_PASSWORD") else config.database_url,
        "redis_url": config.redis_url.replace(os.getenv("REDIS_PASSWORD", ""), "***") if os.getenv("REDIS_PASSWORD") else config.redis_url,
        "pool_size": config.db_pool_size,
        "redis_db": config.redis_db
    }

async def close_database_connections():
    """Close all database connections (for graceful shutdown)"""
    try:
        await async_engine.dispose()
        engine.dispose()
        if async_redis_client:
            await async_redis_client.close()
        redis_client.close()
        logger.info("Database connections closed successfully")
    except Exception as e:
        logger.error(f"Error closing database connections: {e}")

# ================================================================================
# EXPORT COMMONLY USED OBJECTS
# ================================================================================

__all__ = [
    "engine",
    "async_engine", 
    "SessionLocal",
    "AsyncSessionLocal",
    "Base",
    "metadata",
    "redis_client",
    "get_db",
    "get_async_db",
    "get_async_db_session",
    "get_async_redis_client",
    "check_database_health",
    "check_redis_health",
    "check_sync_database_health", 
    "check_sync_redis_health",
    "initialize_database",
    "initialize_sync_database",
    "get_database_info",
    "close_database_connections",
    "config"
]