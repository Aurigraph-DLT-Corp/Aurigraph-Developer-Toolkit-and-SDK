#!/usr/bin/env python3
# ================================================================================
# AUREX LAUNCHPAD™ CONFIGURATION VALIDATOR
# Validate environment configuration and security settings
# Agent: Security Intelligence Agent
# ================================================================================

import os
import sys
import re
from pathlib import Path
from urllib.parse import urlparse
import secrets
import subprocess

# Add the backend directory to the Python path
current_path = Path(__file__).parent.parent
sys.path.insert(0, str(current_path))

try:
    from config import get_settings
    settings = get_settings()
except Exception as e:
    print(f"❌ Failed to load configuration: {e}")
    sys.exit(1)

# Colors for output
RED = '\033[0;31m'
GREEN = '\033[0;32m'
YELLOW = '\033[1;33m'
BLUE = '\033[0;34m'
NC = '\033[0m'  # No Color

def log_info(message):
    print(f"{BLUE}[INFO]{NC} {message}")

def log_success(message):
    print(f"{GREEN}[SUCCESS]{NC} {message}")

def log_warning(message):
    print(f"{YELLOW}[WARNING]{NC} {message}")

def log_error(message):
    print(f"{RED}[ERROR]{NC} {message}")

def validate_required_settings():
    """Validate required configuration settings"""
    
    log_info("Validating required configuration settings...")
    errors = []
    warnings = []
    
    # Required settings
    required_settings = [
        ('SECRET_KEY', 'Application secret key'),
        ('JWT_SECRET_KEY', 'JWT secret key'),
        ('DATABASE_URL', 'Database connection URL'),
    ]
    
    for setting_name, description in required_settings:
        value = getattr(settings, setting_name, None)
        if not value:
            errors.append(f"Missing required setting: {setting_name} ({description})")
        elif setting_name.endswith('_KEY') and len(value) < 32:
            errors.append(f"{setting_name} must be at least 32 characters long")
        elif setting_name.endswith('_KEY') and value in ['your-secret-key-change-in-production', 'your-jwt-secret-key']:
            errors.append(f"{setting_name} is using default/example value - must be changed for production")
    
    # Validate database URL format
    if settings.DATABASE_URL:
        try:
            parsed = urlparse(settings.DATABASE_URL)
            if parsed.scheme not in ['postgresql', 'postgres']:
                errors.append("DATABASE_URL must use postgresql:// scheme")
            if not parsed.hostname:
                errors.append("DATABASE_URL must include hostname")
        except Exception as e:
            errors.append(f"Invalid DATABASE_URL format: {e}")
    
    # Environment-specific validations
    if settings.ENVIRONMENT == 'production':
        if settings.DEBUG:
            warnings.append("DEBUG is enabled in production environment")
        
        if not settings.SECRET_KEY or 'change-in-production' in settings.SECRET_KEY:
            errors.append("Production environment requires secure SECRET_KEY")
        
        if not settings.JWT_SECRET_KEY or 'change-in-production' in settings.JWT_SECRET_KEY:
            errors.append("Production environment requires secure JWT_SECRET_KEY")
        
        if 'localhost' in settings.DATABASE_URL and 'postgres:postgres' in settings.DATABASE_URL:
            warnings.append("Using default database credentials in production")
    
    return errors, warnings

def validate_security_settings():
    """Validate security-related settings"""
    
    log_info("Validating security settings...")
    errors = []
    warnings = []
    
    # Password policy validation
    if settings.PASSWORD_MIN_LENGTH < 8:
        warnings.append("PASSWORD_MIN_LENGTH should be at least 8 characters")
    
    # Rate limiting validation
    if settings.RATE_LIMIT_REQUESTS_PER_MINUTE > 1000:
        warnings.append("High rate limit may allow abuse")
    
    # JWT expiration validation
    if settings.JWT_ACCESS_TOKEN_EXPIRE_MINUTES > 120:
        warnings.append("JWT access token expiration is very long (security risk)")
    
    if settings.JWT_REFRESH_TOKEN_EXPIRE_DAYS > 30:
        warnings.append("JWT refresh token expiration is very long (security risk)")
    
    # CORS validation
    cors_origins = settings.CORS_ORIGINS
    if '*' in cors_origins:
        errors.append("CORS origins should not use wildcard (*) in production")
    
    for origin in cors_origins:
        if origin.startswith('http://') and settings.ENVIRONMENT == 'production':
            warnings.append(f"HTTP origin in production: {origin} (should use HTTPS)")
    
    return errors, warnings

def validate_external_dependencies():
    """Validate external service configurations"""
    
    log_info("Validating external dependencies...")
    errors = []
    warnings = []
    
    # Redis validation
    if settings.REDIS_URL:
        try:
            parsed = urlparse(settings.REDIS_URL)
            if parsed.scheme != 'redis':
                warnings.append("REDIS_URL should use redis:// scheme")
        except Exception as e:
            errors.append(f"Invalid REDIS_URL format: {e}")
    
    # Email configuration validation
    if settings.SMTP_USER and settings.SMTP_PASSWORD:
        if '@' not in settings.SMTP_USER:
            warnings.append("SMTP_USER should be a valid email address")
    elif settings.ENVIRONMENT == 'production':
        warnings.append("Email configuration incomplete for production")
    
    # OpenAI API validation
    if settings.OPENAI_API_KEY:
        if not settings.OPENAI_API_KEY.startswith('sk-'):
            warnings.append("OPENAI_API_KEY format appears invalid")
    else:
        log_info("OpenAI API key not configured - AI features will be disabled")
    
    return errors, warnings

def validate_file_system():
    """Validate file system permissions and directories"""
    
    log_info("Validating file system configuration...")
    errors = []
    warnings = []
    
    # Upload directory
    upload_dir = Path(settings.UPLOAD_DIR)
    try:
        upload_dir.mkdir(parents=True, exist_ok=True)
        
        # Test write permissions
        test_file = upload_dir / '.test_write'
        test_file.write_text('test')
        test_file.unlink()
        
        log_success(f"Upload directory is writable: {upload_dir}")
    except PermissionError:
        errors.append(f"No write permission to upload directory: {upload_dir}")
    except Exception as e:
        errors.append(f"Upload directory validation failed: {e}")
    
    # Check upload size limits
    if settings.MAX_UPLOAD_SIZE > 100 * 1024 * 1024:  # 100MB
        warnings.append(f"Large upload size limit: {settings.MAX_UPLOAD_SIZE / 1024 / 1024:.1f}MB")
    
    return errors, warnings

def validate_database_connection():
    """Test database connectivity"""
    
    log_info("Testing database connection...")
    
    try:
        from sqlalchemy import create_engine, text
        
        engine = create_engine(settings.DATABASE_URL, connect_args={'connect_timeout': 10})
        with engine.connect() as conn:
            result = conn.execute(text("SELECT version()"))
            version = result.scalar()
            log_success(f"Database connection successful: {version}")
            
        engine.dispose()
        return [], []
        
    except Exception as e:
        return [f"Database connection failed: {e}"], []

def generate_secure_keys():
    """Generate secure keys for configuration"""
    
    log_info("Generating secure keys...")
    
    secret_key = secrets.token_urlsafe(32)
    jwt_secret_key = secrets.token_urlsafe(32)
    
    print("\n" + "="*60)
    print("SECURE KEYS GENERATED")  
    print("="*60)
    print(f"SECRET_KEY={secret_key}")
    print(f"JWT_SECRET_KEY={jwt_secret_key}")
    print("="*60)
    print("⚠️  Save these keys securely and add them to your .env file")
    print("⚠️  Do not share these keys or commit them to version control")
    print("="*60)

def check_environment_file():
    """Check if .env file exists and has correct format"""
    
    log_info("Checking environment file...")
    
    env_file = current_path / '.env'
    env_example = current_path / '.env.example'
    
    if not env_file.exists():
        if env_example.exists():
            log_warning(f".env file not found. Copy {env_example} to {env_file} and update values")
        else:
            log_error(".env file and .env.example not found")
        return [".env file not found"], []
    
    # Check for default values that should be changed
    warnings = []
    with open(env_file, 'r') as f:
        content = f.read()
        
        if 'your-secret-key-change-in-production' in content:
            warnings.append(".env contains default SECRET_KEY value")
        
        if 'your-jwt-secret-key' in content:
            warnings.append(".env contains default JWT_SECRET_KEY value")
        
        if 'your-openai-api-key-here' in content:
            warnings.append(".env contains placeholder OpenAI API key")
    
    return [], warnings

def main():
    """Main validation function"""
    
    print(f"{BLUE}🔍 AUREX LAUNCHPAD™ CONFIGURATION VALIDATOR{NC}")
    print("=" * 50)
    print(f"Environment: {settings.ENVIRONMENT}")
    print(f"Debug Mode: {settings.DEBUG}")
    print(f"App Version: {settings.APP_VERSION}")
    print()
    
    all_errors = []
    all_warnings = []
    
    # Run all validations
    validations = [
        check_environment_file,
        validate_required_settings,
        validate_security_settings,
        validate_external_dependencies,
        validate_file_system,
        validate_database_connection,
    ]
    
    for validation in validations:
        try:
            errors, warnings = validation()
            all_errors.extend(errors)
            all_warnings.extend(warnings)
        except Exception as e:
            all_errors.append(f"Validation failed: {e}")
        print()
    
    # Summary
    print("="*50)
    print("VALIDATION SUMMARY")
    print("="*50)
    
    if all_errors:
        log_error(f"Found {len(all_errors)} error(s):")
        for error in all_errors:
            print(f"  ❌ {error}")
        print()
    
    if all_warnings:
        log_warning(f"Found {len(all_warnings)} warning(s):")
        for warning in all_warnings:
            print(f"  ⚠️  {warning}")
        print()
    
    if not all_errors and not all_warnings:
        log_success("✅ All validations passed!")
        print("🎉 Configuration is ready for deployment")
    elif not all_errors:
        log_warning("⚠️  Configuration is valid but has warnings")
        print("✅ Safe to proceed with deployment")
    else:
        log_error("❌ Configuration has errors that must be fixed")
        print("🚫 Do not deploy until all errors are resolved")
        return 1
    
    return 0

if __name__ == "__main__":
    if len(sys.argv) > 1 and sys.argv[1] == "generate-keys":
        generate_secure_keys()
    else:
        sys.exit(main())