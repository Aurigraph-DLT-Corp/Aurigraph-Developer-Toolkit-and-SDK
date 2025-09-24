#!/usr/bin/env python3
# ================================================================================
# AUREX LAUNCHPAD™ CONFIGURATION
# Centralized configuration management with environment-based settings
# Agent: DevOps Orchestration Agent
# ================================================================================

from pydantic_settings import BaseSettings
from pydantic import Field, validator
from typing import List, Optional
import os
from pathlib import Path

class Settings(BaseSettings):
    """Application settings with environment variable support"""
    
    # Application
    APP_NAME: str = "Aurex Launchpad™"
    APP_VERSION: str = "1.0.0"
    ENVIRONMENT: str = Field(default="development", env="ENVIRONMENT")
    DEBUG: bool = Field(default=True, env="DEBUG")
    LOG_LEVEL: str = Field(default="info", env="LOG_LEVEL")
    
    # API Configuration
    API_V1_STR: str = Field(default="/api/v1", env="API_V1_STR")
    
    # Database
    DATABASE_URL: str = Field(
        default="postgresql://aurex_user:AurexProd2024!SecureDB#2025@localhost:5432/aurex_launchpad",
        env="DATABASE_URL"
    )
    DATABASE_POOL_SIZE: int = Field(default=20, env="DATABASE_POOL_SIZE")
    DATABASE_MAX_OVERFLOW: int = Field(default=30, env="DATABASE_MAX_OVERFLOW")
    
    # Redis
    REDIS_URL: str = Field(default="redis://localhost:6379/0", env="REDIS_URL")
    
    # Security
    SECRET_KEY: str = Field(env="SECRET_KEY")
    JWT_SECRET_KEY: str = Field(env="JWT_SECRET_KEY")
    JWT_ALGORITHM: str = Field(default="HS256", env="JWT_ALGORITHM")
    JWT_ACCESS_TOKEN_EXPIRE_MINUTES: int = Field(default=30, env="JWT_ACCESS_TOKEN_EXPIRE_MINUTES")
    JWT_REFRESH_TOKEN_EXPIRE_DAYS: int = Field(default=7, env="JWT_REFRESH_TOKEN_EXPIRE_DAYS")
    
    # CORS
    CORS_ORIGINS: List[str] = Field(
        default=["http://localhost:3001", "http://127.0.0.1:3001", "http://localhost", "http://localhost:80"],
        env="CORS_ORIGINS"
    )
    
    # File Upload
    MAX_UPLOAD_SIZE: int = Field(default=52428800, env="MAX_UPLOAD_SIZE")  # 50MB
    UPLOAD_DIR: str = Field(default="./temp/uploads", env="UPLOAD_DIR")
    ALLOWED_EXTENSIONS: List[str] = Field(
        default=["pdf", "xlsx", "xls", "docx", "doc", "csv", "txt", "png", "jpg", "jpeg", "tiff"],
        env="ALLOWED_EXTENSIONS"
    )
    
    # OpenAI
    OPENAI_API_KEY: Optional[str] = Field(default=None, env="OPENAI_API_KEY")
    OPENAI_MODEL: str = Field(default="gpt-3.5-turbo", env="OPENAI_MODEL")
    OPENAI_MAX_TOKENS: int = Field(default=1000, env="OPENAI_MAX_TOKENS")
    
    # Email (SMTP)
    SMTP_TLS: bool = Field(default=True, env="SMTP_TLS")
    SMTP_PORT: int = Field(default=587, env="SMTP_PORT")
    SMTP_HOST: str = Field(default="smtp.gmail.com", env="SMTP_HOST")
    SMTP_USER: Optional[str] = Field(default=None, env="SMTP_USER")
    SMTP_PASSWORD: Optional[str] = Field(default=None, env="SMTP_PASSWORD")
    EMAILS_FROM_EMAIL: str = Field(default="noreply@aurigraph.io", env="EMAILS_FROM_EMAIL")
    EMAILS_FROM_NAME: str = Field(default="Aurex Launchpad", env="EMAILS_FROM_NAME")
    
    # Celery (Background Tasks)
    CELERY_BROKER_URL: str = Field(default="redis://localhost:6379/0", env="CELERY_BROKER_URL")
    CELERY_RESULT_BACKEND: str = Field(default="redis://localhost:6379/0", env="CELERY_RESULT_BACKEND")
    
    # Rate Limiting
    RATE_LIMIT_REQUESTS_PER_MINUTE: int = Field(default=100, env="RATE_LIMIT_REQUESTS_PER_MINUTE")
    RATE_LIMIT_REQUESTS_PER_HOUR: int = Field(default=1000, env="RATE_LIMIT_REQUESTS_PER_HOUR")
    
    # Security Settings
    PASSWORD_MIN_LENGTH: int = Field(default=8, env="PASSWORD_MIN_LENGTH")
    PASSWORD_REQUIRE_UPPERCASE: bool = Field(default=True, env="PASSWORD_REQUIRE_UPPERCASE")
    PASSWORD_REQUIRE_LOWERCASE: bool = Field(default=True, env="PASSWORD_REQUIRE_LOWERCASE")
    PASSWORD_REQUIRE_DIGITS: bool = Field(default=True, env="PASSWORD_REQUIRE_DIGITS")
    PASSWORD_REQUIRE_SPECIAL: bool = Field(default=True, env="PASSWORD_REQUIRE_SPECIAL")
    FAILED_LOGIN_ATTEMPTS_LIMIT: int = Field(default=5, env="FAILED_LOGIN_ATTEMPTS_LIMIT")
    ACCOUNT_LOCKOUT_DURATION_MINUTES: int = Field(default=30, env="ACCOUNT_LOCKOUT_DURATION_MINUTES")
    
    # Monitoring
    SENTRY_DSN: Optional[str] = Field(default=None, env="SENTRY_DSN")
    
    # Development Tools
    ENABLE_SWAGGER_UI: bool = Field(default=True, env="ENABLE_SWAGGER_UI")
    ENABLE_REDOC: bool = Field(default=True, env="ENABLE_REDOC")
    ENABLE_FLOWER: bool = Field(default=True, env="ENABLE_FLOWER")
    
    @validator("CORS_ORIGINS", pre=True)
    def assemble_cors_origins(cls, v):
        if isinstance(v, str):
            return [i.strip() for i in v.split(",")]
        return v
    
    @validator("ALLOWED_EXTENSIONS", pre=True)
    def assemble_allowed_extensions(cls, v):
        if isinstance(v, str):
            return [i.strip().lower() for i in v.split(",")]
        return v
    
    @validator("SECRET_KEY")
    def validate_secret_key(cls, v):
        if not v or len(v) < 32:
            raise ValueError("SECRET_KEY must be at least 32 characters long")
        return v
    
    @validator("JWT_SECRET_KEY")
    def validate_jwt_secret_key(cls, v):
        if not v or len(v) < 32:
            raise ValueError("JWT_SECRET_KEY must be at least 32 characters long")
        return v
    
    class Config:
        env_file = ".env"
        case_sensitive = True

# Singleton pattern for settings
_settings = None

def get_settings() -> Settings:
    """Get application settings (singleton)"""
    global _settings
    if _settings is None:
        _settings = Settings()
    return _settings