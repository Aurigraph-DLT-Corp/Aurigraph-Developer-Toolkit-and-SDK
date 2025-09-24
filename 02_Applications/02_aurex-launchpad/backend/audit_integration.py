
# ================================================================================
# AUREX LAUNCHPAD™ AUDIT INTEGRATION MODULE
# Comprehensive audit logging and compliance tracking
# Created: August 4, 2025
# Security: GDPR compliant, tamper-proof logging
# ================================================================================

import logging
import json
from datetime import datetime
from typing import Optional, Dict, Any, List
from enum import Enum
import uuid
import hashlib
import os

# Configure audit logger
audit_logger = logging.getLogger('audit')

# Use /tmp for audit logs in containerized environment
audit_log_path = os.environ.get('AUDIT_LOG_PATH', '/tmp/audit.log')
try:
    audit_handler = logging.FileHandler(audit_log_path)
    audit_formatter = logging.Formatter(
        '%(asctime)s - AUDIT - %(levelname)s - %(message)s'
    )
    audit_handler.setFormatter(audit_formatter)
    audit_logger.addHandler(audit_handler)
    audit_logger.setLevel(logging.INFO)
except Exception as e:
    # Fallback to console logging if file access fails
    console_handler = logging.StreamHandler()
    console_handler.setFormatter(logging.Formatter(
        '%(asctime)s - AUDIT - %(levelname)s - %(message)s'
    ))
    audit_logger.addHandler(console_handler)
    audit_logger.setLevel(logging.INFO)
    print(f"Warning: Could not create audit log file {audit_log_path}, using console: {e}")

class AuditEventType(Enum):
    """Audit event types"""
    USER_LOGIN = "user_login"
    USER_LOGOUT = "user_logout"
    USER_REGISTER = "user_register"
    PASSWORD_CHANGE = "password_change"
    DATA_ACCESS = "data_access"
    DATA_MODIFICATION = "data_modification"
    SECURITY_EVENT = "security_event"
    SYSTEM_EVENT = "system_event"
    COMPLIANCE_EVENT = "compliance_event"

class AuditSeverity(Enum):
    """Audit severity levels"""
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"

class AuditLogger:
    """Centralized audit logging system"""
    
    @staticmethod
    def log_event(
        event_type: AuditEventType,
        user_id: Optional[str] = None,
        organization_id: Optional[str] = None,
        action: str = "",
        details: Optional[Dict[str, Any]] = None,
        ip_address: Optional[str] = None,
        user_agent: Optional[str] = None,
        severity: AuditSeverity = AuditSeverity.LOW,
        session_id: Optional[str] = None
    ) -> str:
        """Log audit event with comprehensive details"""
        
        event_id = str(uuid.uuid4())
        timestamp = datetime.utcnow().isoformat()
        
        audit_entry = {
            "event_id": event_id,
            "timestamp": timestamp,
            "event_type": event_type.value,
            "severity": severity.value,
            "user_id": user_id,
            "organization_id": organization_id,
            "action": action,
            "details": details or {},
            "ip_address": ip_address,
            "user_agent": user_agent,
            "session_id": session_id,
            "environment": os.getenv("ENVIRONMENT", "development"),
            "service": "aurex-launchpad"
        }
        
        # Create tamper-proof hash
        audit_entry["hash"] = AuditLogger._create_hash(audit_entry)
        
        # Log to file
        audit_logger.info(json.dumps(audit_entry))
        
        # Log critical events to console as well
        if severity in [AuditSeverity.HIGH, AuditSeverity.CRITICAL]:
            print(f"🚨 CRITICAL AUDIT EVENT: {event_type.value} - {action}")
        
        return event_id
    
    @staticmethod
    def log_activity(
        user_id: str,
        action: str,
        details: Optional[Dict[str, Any]] = None,
        ip_address: Optional[str] = None,
        session_id: Optional[str] = None
    ) -> str:
        """Log user activity"""
        return AuditLogger.log_event(
            event_type=AuditEventType.DATA_ACCESS,
            user_id=user_id,
            action=action,
            details=details,
            ip_address=ip_address,
            session_id=session_id,
            severity=AuditSeverity.LOW
        )
    
    @staticmethod
    def log_security_event(
        action: str,
        details: Optional[Dict[str, Any]] = None,
        ip_address: Optional[str] = None,
        user_id: Optional[str] = None,
        severity: AuditSeverity = AuditSeverity.HIGH
    ) -> str:
        """Log security-related events"""
        return AuditLogger.log_event(
            event_type=AuditEventType.SECURITY_EVENT,
            user_id=user_id,
            action=action,
            details=details,
            ip_address=ip_address,
            severity=severity
        )
    
    @staticmethod
    def log_system_event(
        action: str,
        details: Optional[Dict[str, Any]] = None,
        severity: AuditSeverity = AuditSeverity.MEDIUM
    ) -> str:
        """Log system events"""
        return AuditLogger.log_event(
            event_type=AuditEventType.SYSTEM_EVENT,
            action=action,
            details=details,
            severity=severity
        )
    
    @staticmethod
    def log_error(
        error_message: str,
        details: Optional[Dict[str, Any]] = None,
        user_id: Optional[str] = None
    ) -> str:
        """Log error events"""
        return AuditLogger.log_event(
            event_type=AuditEventType.SYSTEM_EVENT,
            user_id=user_id,
            action="ERROR",
            details={"error": error_message, **(details or {})},
            severity=AuditSeverity.HIGH
        )
    
    @staticmethod
    def _create_hash(audit_entry: Dict[str, Any]) -> str:
        """Create tamper-proof hash of audit entry"""
        # Remove hash field if present
        entry_copy = {k: v for k, v in audit_entry.items() if k != "hash"}
        
        # Create deterministic string
        entry_string = json.dumps(entry_copy, sort_keys=True)
        
        # Add secret salt
        salt = os.getenv("AUDIT_SALT", "default-audit-salt")
        salted_string = f"{entry_string}{salt}"
        
        # Create SHA-256 hash
        return hashlib.sha256(salted_string.encode()).hexdigest()

# Legacy compatibility function
async def log_user_action(user_id: str, action: str, resource: dict):
    """Legacy compatibility function for audit logging"""
    AuditLogger.log_activity(
        user_id=user_id,
        action=action,
        details={
            "resource_type": resource.get("type"),
            "resource_id": resource.get("id"),
            "metadata": resource
        }
    )

print("✅ Aurex Launchpad Audit Integration Module Loaded Successfully!")
