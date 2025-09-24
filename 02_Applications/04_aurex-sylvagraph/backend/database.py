
"""
Aurex Sylvagraph - Database Configuration with PostGIS Support
Comprehensive database setup for agroforestry monitoring platform
"""

import os
from typing import AsyncGenerator
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine, async_sessionmaker
from sqlalchemy.pool import StaticPool
from sqlalchemy import text, event
from app.models.base import Base
import structlog

logger = structlog.get_logger(__name__)

# Database configuration
DATABASE_URL = os.getenv(
    "DATABASE_URL", 
    "postgresql+asyncpg://postgres:password@localhost:5432/aurex_sylvagraph"
)

# Enable PostGIS extension on database connection
ENABLE_POSTGIS = True

# Create async engine with PostGIS support
engine = create_async_engine(
    DATABASE_URL,
    echo=os.getenv("DATABASE_DEBUG", "false").lower() == "true",
    pool_size=20,
    max_overflow=30,
    pool_pre_ping=True,
    pool_recycle=300,
    connect_args={
        "server_settings": {
            "application_name": "aurex_sylvagraph",
        }
    }
)

# Create async session factory
AsyncSessionLocal = async_sessionmaker(
    engine, 
    class_=AsyncSession, 
    expire_on_commit=False
)


async def init_database():
    """Initialize database with PostGIS extensions and create tables"""
    try:
        async with engine.begin() as conn:
            # Enable PostGIS extension
            if ENABLE_POSTGIS:
                await conn.execute(text("CREATE EXTENSION IF NOT EXISTS postgis"))
                await conn.execute(text("CREATE EXTENSION IF NOT EXISTS postgis_topology"))
                await conn.execute(text("CREATE EXTENSION IF NOT EXISTS fuzzystrmatch"))
                await conn.execute(text("CREATE EXTENSION IF NOT EXISTS postgis_tiger_geocoder"))
                logger.info("PostGIS extensions enabled")
            
            # Create all tables
            await conn.run_sync(Base.metadata.create_all)
            logger.info("Database tables created successfully")
            
    except Exception as e:
        logger.error(f"Error initializing database: {e}")
        raise


async def get_db() -> AsyncGenerator[AsyncSession, None]:
    """
    Database dependency for FastAPI endpoints
    Provides async database session with proper cleanup
    """
    async with AsyncSessionLocal() as session:
        try:
            yield session
        except Exception as e:
            await session.rollback()
            logger.error(f"Database session error: {e}")
            raise
        finally:
            await session.close()


async def check_database_health() -> dict:
    """Check database connectivity and PostGIS status"""
    try:
        async with AsyncSessionLocal() as session:
            # Check basic connectivity
            result = await session.execute(text("SELECT 1"))
            basic_check = result.scalar() == 1
            
            # Check PostGIS version if enabled
            postgis_version = None
            if ENABLE_POSTGIS:
                try:
                    result = await session.execute(text("SELECT PostGIS_Version()"))
                    postgis_version = result.scalar()
                except Exception:
                    postgis_version = "Not available"
            
            # Get database size
            result = await session.execute(text("""
                SELECT pg_size_pretty(pg_database_size(current_database()))
            """))
            db_size = result.scalar()
            
            # Get connection count
            result = await session.execute(text("""
                SELECT count(*) FROM pg_stat_activity 
                WHERE datname = current_database()
            """))
            connections = result.scalar()
            
            return {
                "status": "healthy" if basic_check else "unhealthy",
                "postgis_version": postgis_version,
                "database_size": db_size,
                "active_connections": connections,
                "engine_pool_size": engine.pool.size(),
                "engine_checked_out": engine.pool.checkedout(),
            }
            
    except Exception as e:
        logger.error(f"Database health check failed: {e}")
        return {
            "status": "unhealthy",
            "error": str(e)
        }


# Event listeners for database monitoring
@event.listens_for(engine.sync_engine, "connect")
def set_sqlite_pragma(dbapi_connection, connection_record):
    """Set database-specific configurations on connection"""
    # This would be for additional database-specific settings
    pass


# Database management class
class SylvagraphDatabase:
    """Database management utilities for Sylvagraph"""
    
    def __init__(self):
        self.engine = engine
        self.session_factory = AsyncSessionLocal
    
    async def create_all_tables(self):
        """Create all database tables"""
        async with self.engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)
    
    async def drop_all_tables(self):
        """Drop all database tables (use with caution)"""
        async with self.engine.begin() as conn:
            await conn.run_sync(Base.metadata.drop_all)
    
    async def reset_database(self):
        """Reset database by dropping and recreating all tables"""
        await self.drop_all_tables()
        await init_database()
    
    async def backup_database(self, backup_path: str = None):
        """Create database backup (implementation depends on deployment)"""
        # This would implement database backup functionality
        logger.info(f"Database backup requested to: {backup_path}")
    
    async def get_session(self) -> AsyncGenerator[AsyncSession, None]:
        """Get database session"""
        async for session in get_db():
            yield session


# Global database instance
db_manager = SylvagraphDatabase()
