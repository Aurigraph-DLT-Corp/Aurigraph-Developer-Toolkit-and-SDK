
#!/usr/bin/env python3
# ================================================================================
# AUREX LAUNCHPAD™ DATABASE CONNECTION
# Dedicated database management for Launchpad backend
# Agent: Aurex Launchpad Backend Engineer
# ================================================================================

from sqlalchemy import create_engine, MetaData
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, Session
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from contextlib import asynccontextmanager
import os
from typing import AsyncGenerator
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Database configuration
DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://aurex_user:AurexProd2024!SecureDB#2025@localhost:5432/aurex_launchpad")
ASYNC_DATABASE_URL = DATABASE_URL.replace("postgresql://", "postgresql+asyncpg://")

# Create database engines
engine = create_engine(DATABASE_URL, pool_pre_ping=True, pool_recycle=300)
async_engine = create_async_engine(
    ASYNC_DATABASE_URL,
    pool_pre_ping=True,
    pool_recycle=300,
    echo=False
)

# Create session makers
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
AsyncSessionLocal = async_sessionmaker(
    async_engine,
    class_=AsyncSession,
    expire_on_commit=False
)

# Base class for models
Base = declarative_base()

# Metadata
metadata = MetaData()

def get_db() -> Session:
    """Get synchronous database session"""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@asynccontextmanager
async def get_async_db() -> AsyncGenerator[AsyncSession, None]:
    """Get asynchronous database session"""
    async with AsyncSessionLocal() as session:
        try:
            yield session
        finally:
            await session.close()

def init_database():
    """Initialize database connection (synchronous)"""
    try:
        logger.info(f"Connecting to database: {DATABASE_URL.split('@')[1]}")  # Hide credentials
        engine.connect()
        logger.info("Database connection established successfully")
        return engine
    except Exception as e:
        logger.error(f"Failed to connect to database: {e}")
        raise

async def init_async_database():
    """Initialize database connection (asynchronous)"""
    try:
        logger.info(f"Connecting to async database: {ASYNC_DATABASE_URL.split('@')[1]}")  # Hide credentials
        async with async_engine.begin() as conn:
            logger.info("Async database connection established successfully")
        return async_engine
    except Exception as e:
        logger.error(f"Failed to connect to async database: {e}")
        raise

def create_tables():
    """Create all database tables"""
    try:
        Base.metadata.create_all(bind=engine)
        logger.info("Database tables created successfully")
    except Exception as e:
        logger.error(f"Failed to create database tables: {e}")
        raise

async def create_async_tables():
    """Create all database tables asynchronously"""
    try:
        async with async_engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)
        logger.info("Async database tables created successfully")
    except Exception as e:
        logger.error(f"Failed to create async database tables: {e}")
        raise
