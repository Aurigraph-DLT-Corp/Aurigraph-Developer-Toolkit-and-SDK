#!/usr/bin/env python3
# ================================================================================
# AUREX LAUNCHPAD™ PASSWORD UTILITIES
# Secure password hashing and validation utilities
# Agent: Security Intelligence Agent
# ================================================================================

import bcrypt
import re
from typing import Optional, List, Dict
from datetime import datetime, timedelta

from config import get_settings

settings = get_settings()

def hash_password(password: str) -> str:
    """Hash a password using bcrypt"""
    
    # Generate salt and hash password
    salt = bcrypt.gensalt()
    hashed = bcrypt.hashpw(password.encode('utf-8'), salt)
    return hashed.decode('utf-8')

def verify_password(password: str, hashed_password: str) -> bool:
    """Verify a password against its hash"""
    
    try:
        return bcrypt.checkpw(password.encode('utf-8'), hashed_password.encode('utf-8'))
    except (ValueError, TypeError):
        return False

def validate_password_strength(password: str) -> Dict[str, any]:
    """Validate password against security requirements"""
    
    validation_result = {
        "is_valid": True,
        "errors": [],
        "score": 0,
        "strength": "weak"
    }
    
    # Length check
    if len(password) < settings.PASSWORD_MIN_LENGTH:
        validation_result["errors"].append(f"Password must be at least {settings.PASSWORD_MIN_LENGTH} characters long")
        validation_result["is_valid"] = False
    else:
        validation_result["score"] += 1
    
    # Uppercase check
    if settings.PASSWORD_REQUIRE_UPPERCASE and not re.search(r'[A-Z]', password):
        validation_result["errors"].append("Password must contain at least one uppercase letter")
        validation_result["is_valid"] = False
    else:
        validation_result["score"] += 1
    
    # Lowercase check
    if settings.PASSWORD_REQUIRE_LOWERCASE and not re.search(r'[a-z]', password):
        validation_result["errors"].append("Password must contain at least one lowercase letter")
        validation_result["is_valid"] = False
    else:
        validation_result["score"] += 1
    
    # Digit check
    if settings.PASSWORD_REQUIRE_DIGITS and not re.search(r'\d', password):
        validation_result["errors"].append("Password must contain at least one digit")
        validation_result["is_valid"] = False
    else:
        validation_result["score"] += 1
    
    # Special character check
    if settings.PASSWORD_REQUIRE_SPECIAL and not re.search(r'[!@#$%^&*(),.?":{}|<>]', password):
        validation_result["errors"].append("Password must contain at least one special character")
        validation_result["is_valid"] = False
    else:
        validation_result["score"] += 1
    
    # Common password check
    if is_common_password(password):
        validation_result["errors"].append("Password is too common, please choose a more unique password")
        validation_result["is_valid"] = False
        validation_result["score"] -= 1
    
    # Sequential characters check
    if has_sequential_characters(password):
        validation_result["errors"].append("Password should not contain sequential characters")
        validation_result["score"] -= 1
    
    # Determine strength
    if validation_result["score"] >= 5:
        validation_result["strength"] = "very_strong"
    elif validation_result["score"] >= 4:
        validation_result["strength"] = "strong"
    elif validation_result["score"] >= 3:
        validation_result["strength"] = "medium"
    elif validation_result["score"] >= 2:
        validation_result["strength"] = "weak"
    else:
        validation_result["strength"] = "very_weak"
    
    return validation_result

def is_common_password(password: str) -> bool:
    """Check if password is in list of common passwords"""
    
    # Common passwords list (in production, use a comprehensive list)
    common_passwords = {
        'password', '123456', '123456789', '12345678', '12345', '1234567',
        'password123', 'admin', 'qwerty', 'abc123', 'Password1', 'password1',
        'welcome', 'login', 'master', 'hello', 'guest', 'root', 'test',
        '111111', '000000', 'sunshine', 'iloveyou', 'princess', 'admin123'
    }
    
    return password.lower() in common_passwords

def has_sequential_characters(password: str) -> bool:
    """Check for sequential characters in password"""
    
    # Check for sequential numbers
    for i in range(len(password) - 2):
        if password[i:i+3].isdigit():
            nums = [int(x) for x in password[i:i+3]]
            if nums[1] == nums[0] + 1 and nums[2] == nums[1] + 1:
                return True
    
    # Check for sequential letters
    for i in range(len(password) - 2):
        if password[i:i+3].isalpha():
            chars = password[i:i+3].lower()
            if ord(chars[1]) == ord(chars[0]) + 1 and ord(chars[2]) == ord(chars[1]) + 1:
                return True
    
    return False