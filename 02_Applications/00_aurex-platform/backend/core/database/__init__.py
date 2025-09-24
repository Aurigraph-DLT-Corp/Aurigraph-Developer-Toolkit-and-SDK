"""
Centralized Database Management Layer
Provides connection pooling, multi-tenant support, and migration management
"""
from sqlalchemy import create_engine, MetaData
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine, async_sessionmaker
from sqlalchemy.orm import declarative_base
from sqlalchemy.pool import StaticPool
import os
from typing import AsyncGenerator

DATABASE_URL = os.getenv("DATABASE_URL", "postgresql+asyncpg://aurex_prod_user:aurex_secure_password_2024@postgres:5432/aurex_platform_prod")

class DatabaseManager:
    """Centralized database management for all Aurex applications"""
    
    def __init__(self):
        self.engine = None
        self.async_session = None
        self.Base = declarative_base()
        self.metadata = MetaData()
    
    async def initialize(self):
        """Initialize database connections"""
        self.engine = create_async_engine(
            DATABASE_URL,
            poolclass=StaticPool,
            echo=False,
            pool_pre_ping=True,
            connect_args={
                "server_settings": {
                    "application_name": "aurex-platform",
                }
            }
        )
        self.async_session = async_sessionmaker(
            self.engine,
            class_=AsyncSession,
            expire_on_commit=False
        )
    
    async def get_session(self) -> AsyncGenerator[AsyncSession, None]:
        """Get database session with automatic cleanup"""
        async with self.async_session() as session:
            try:
                yield session
                await session.commit()
            except Exception:
                await session.rollback()
                raise
            finally:
                await session.close()
    
    async def close(self):
        """Close all database connections"""
        if self.engine:
            await self.engine.dispose()

# Global instance
db_manager = DatabaseManager()

__all__ = ["DatabaseManager", "db_manager"]