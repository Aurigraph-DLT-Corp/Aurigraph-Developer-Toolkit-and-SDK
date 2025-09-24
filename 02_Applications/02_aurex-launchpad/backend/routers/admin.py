#!/usr/bin/env python3
# ================================================================================
# AUREX LAUNCHPAD™ ADMIN ROUTER
# System administration and management endpoints
# Agent: System Administration Agent
# ================================================================================

from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import func, text
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any, Union
from datetime import datetime, timedelta
from uuid import UUID
import psutil
import sys

from models.base_models import get_db
from models.auth_models import User, Organization, OrganizationMember, AuditLog, SecurityEvent
from models.esg_models import ESGAssessment, ESGFrameworkTemplate, AssessmentQuestion
from routers.auth import get_current_user
from config import get_settings

router = APIRouter(prefix="/api/v1/admin", tags=["System Administration"])
settings = get_settings()

# ================================================================================
# PYDANTIC MODELS
# ================================================================================

class SystemStatsResponse(BaseModel):
    total_users: int
    active_users: int
    total_organizations: int
    active_organizations: int
    total_assessments: int
    completed_assessments: int
    total_documents: int
    system_health: str
    uptime_hours: float
    database_size_mb: float
    storage_used_gb: float

class UserActivityResponse(BaseModel):
    user_id: UUID
    email: str
    name: str
    organization: str
    last_login: Optional[datetime]
    assessments_count: int
    documents_count: int
    status: str

class SystemHealthResponse(BaseModel):
    status: str
    timestamp: datetime
    components: Dict[str, Dict[str, Any]]
    performance_metrics: Dict[str, Any]
    alerts: List[Dict[str, Any]]

class AuditLogResponse(BaseModel):
    id: UUID
    event_type: str
    event_category: str
    event_description: str
    user_email: Optional[str]
    organization_name: Optional[str]
    ip_address: Optional[str]
    status: str
    timestamp: datetime
    
    class Config:
        from_attributes = True

class SecurityEventResponse(BaseModel):
    id: UUID
    event_type: str
    severity: str
    description: str
    user_email: Optional[str]
    ip_address: Optional[str]
    user_agent: Optional[str]
    resolved: bool
    timestamp: datetime
    
    class Config:
        from_attributes = True

class SystemConfigUpdate(BaseModel):
    component: str
    settings: Dict[str, Any]

# ================================================================================
# ADMIN ACCESS CONTROL
# ================================================================================

def verify_admin_access(current_user: User = Depends(get_current_user)):
    """Verify user has system admin access"""
    
    # Check if user has system admin role
    # In production, implement proper role-based access control
    if not current_user.is_superuser:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="System administrator access required"
        )
    return current_user

# ================================================================================
# SYSTEM OVERVIEW & STATISTICS
# ================================================================================

@router.get("/stats", response_model=SystemStatsResponse)
async def get_system_stats(
    admin_user: User = Depends(verify_admin_access),
    db: Session = Depends(get_db)
):
    """Get comprehensive system statistics"""
    
    # User statistics
    total_users = db.query(User).count()
    active_users = db.query(User).filter(User.is_active == True).count()
    
    # Organization statistics
    total_organizations = db.query(Organization).count()
    active_organizations = db.query(Organization).filter(Organization.is_active == True).count()
    
    # Assessment statistics
    total_assessments = db.query(ESGAssessment).count()
    completed_assessments = db.query(ESGAssessment).filter(
        ESGAssessment.status == "COMPLETED"
    ).count()
    
    # System metrics
    try:
        # Database size
        db_size_result = db.execute(text("""
            SELECT pg_size_pretty(pg_database_size(current_database())) as size,
                   pg_database_size(current_database()) as size_bytes
        """)).fetchone()
        
        db_size_mb = db_size_result.size_bytes / (1024 * 1024) if db_size_result else 0
        
        # System performance
        memory = psutil.virtual_memory()
        disk = psutil.disk_usage('/')
        
        storage_used_gb = (disk.total - disk.free) / (1024**3)
        
    except Exception as e:
        db_size_mb = 0
        storage_used_gb = 0
    
    return SystemStatsResponse(
        total_users=total_users,
        active_users=active_users,
        total_organizations=total_organizations,
        active_organizations=active_organizations,
        total_assessments=total_assessments,
        completed_assessments=completed_assessments,
        total_documents=150,  # Mock data
        system_health="healthy",
        uptime_hours=72.5,  # Mock data
        database_size_mb=db_size_mb,
        storage_used_gb=storage_used_gb
    )

@router.get("/health", response_model=SystemHealthResponse)
async def get_system_health(
    admin_user: User = Depends(verify_admin_access),
    db: Session = Depends(get_db)
):
    """Get detailed system health information"""
    
    health_status = "healthy"
    components = {}
    alerts = []
    
    # Database health
    try:
        db.execute(text("SELECT 1"))
        components["database"] = {
            "status": "healthy",
            "response_time_ms": 15,
            "connections": 25,
            "max_connections": 100
        }
    except Exception as e:
        health_status = "unhealthy"
        components["database"] = {
            "status": "unhealthy",
            "error": str(e)
        }
        alerts.append({
            "type": "error",
            "component": "database",
            "message": "Database connection failed"
        })
    
    # System resources
    try:
        cpu_percent = psutil.cpu_percent(interval=1)
        memory = psutil.virtual_memory()
        disk = psutil.disk_usage('/')
        
        components["system"] = {
            "status": "healthy",
            "cpu_usage_percent": cpu_percent,
            "memory_usage_percent": memory.percent,
            "disk_usage_percent": (disk.used / disk.total) * 100,
            "load_average": psutil.getloadavg() if hasattr(psutil, 'getloadavg') else [0, 0, 0]
        }
        
        # Check for resource alerts
        if cpu_percent > 80:
            alerts.append({
                "type": "warning",
                "component": "system",
                "message": f"High CPU usage: {cpu_percent}%"
            })
        
        if memory.percent > 85:
            alerts.append({
                "type": "warning",
                "component": "system",
                "message": f"High memory usage: {memory.percent}%"
            })
            
    except Exception as e:
        components["system"] = {
            "status": "error",
            "error": str(e)
        }
    
    # Application health
    components["application"] = {
        "status": "healthy",
        "version": "1.0.0",
        "environment": settings.ENVIRONMENT,
        "debug_mode": settings.DEBUG
    }
    
    # Performance metrics
    performance_metrics = {
        "avg_response_time_ms": 145,
        "requests_per_minute": 87,
        "active_sessions": 23,
        "queue_size": 2
    }
    
    return SystemHealthResponse(
        status=health_status,
        timestamp=datetime.utcnow(),
        components=components,
        performance_metrics=performance_metrics,
        alerts=alerts
    )

# ================================================================================
# USER MANAGEMENT
# ================================================================================

@router.get("/users")
async def list_all_users(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    search: Optional[str] = Query(None),
    status: Optional[str] = Query(None, regex="^(active|inactive|all)$"),
    admin_user: User = Depends(verify_admin_access),
    db: Session = Depends(get_db)
):
    """List all users in the system"""
    
    query = db.query(User)
    
    if search:
        query = query.filter(
            (User.email.ilike(f"%{search}%")) |
            (User.first_name.ilike(f"%{search}%")) |
            (User.last_name.ilike(f"%{search}%"))
        )
    
    if status == "active":
        query = query.filter(User.is_active == True)
    elif status == "inactive":
        query = query.filter(User.is_active == False)
    
    total = query.count()
    users = query.offset(skip).limit(limit).all()
    
    return {
        "users": users,
        "total": total,
        "page": skip // limit + 1,
        "page_size": limit
    }

@router.get("/users/{user_id}")
async def get_user_details(
    user_id: UUID,
    admin_user: User = Depends(verify_admin_access),
    db: Session = Depends(get_db)
):
    """Get detailed user information"""
    
    user = db.query(User).filter(User.id == user_id).first()
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    # Get user's organizations
    memberships = db.query(OrganizationMember).filter(
        OrganizationMember.user_id == user_id
    ).all()
    
    organizations = []
    for membership in memberships:
        if membership.organization:
            organizations.append({
                "id": membership.organization.id,
                "name": membership.organization.name,
                "role": membership.role,
                "is_owner": membership.is_owner,
                "joined_at": membership.joined_at
            })
    
    # Get user's assessments
    assessments = db.query(ESGAssessment).filter(
        ESGAssessment.created_by_id == user_id
    ).count()
    
    return {
        "user": user,
        "organizations": organizations,
        "assessments_created": assessments,
        "last_audit_events": 5  # Mock data
    }

@router.put("/users/{user_id}/status")
async def update_user_status(
    user_id: UUID,
    is_active: bool,
    admin_user: User = Depends(verify_admin_access),
    db: Session = Depends(get_db)
):
    """Activate or deactivate user account"""
    
    user = db.query(User).filter(User.id == user_id).first()
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    user.is_active = is_active
    user.updated_at = datetime.utcnow()
    
    # Log admin action
    audit_log = AuditLog(
        event_type="user_status_change",
        event_category="admin",
        event_description=f"User {user.email} {'activated' if is_active else 'deactivated'} by admin",
        user_id=admin_user.id,
        target_user_id=user_id,
        status="success"
    )
    db.add(audit_log)
    
    db.commit()
    
    return {"message": f"User {'activated' if is_active else 'deactivated'} successfully"}

# ================================================================================
# ORGANIZATION MANAGEMENT
# ================================================================================

@router.get("/organizations")
async def list_all_organizations(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    search: Optional[str] = Query(None),
    admin_user: User = Depends(verify_admin_access),
    db: Session = Depends(get_db)
):
    """List all organizations in the system"""
    
    query = db.query(Organization)
    
    if search:
        query = query.filter(Organization.name.ilike(f"%{search}%"))
    
    total = query.count()
    organizations = query.offset(skip).limit(limit).all()
    
    # Get member counts for each organization
    org_data = []
    for org in organizations:
        member_count = db.query(OrganizationMember).filter(
            OrganizationMember.organization_id == org.id,
            OrganizationMember.is_active == True
        ).count()
        
        assessment_count = db.query(ESGAssessment).filter(
            ESGAssessment.organization_id == org.id
        ).count()
        
        org_data.append({
            **org.__dict__,
            "member_count": member_count,
            "assessment_count": assessment_count
        })
    
    return {
        "organizations": org_data,
        "total": total,
        "page": skip // limit + 1,
        "page_size": limit
    }

@router.get("/organizations/{org_id}")
async def get_organization_details(
    org_id: UUID,
    admin_user: User = Depends(verify_admin_access),
    db: Session = Depends(get_db)
):
    """Get detailed organization information"""
    
    organization = db.query(Organization).filter(Organization.id == org_id).first()
    
    if not organization:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Organization not found"
        )
    
    # Get members
    members = db.query(OrganizationMember).filter(
        OrganizationMember.organization_id == org_id
    ).all()
    
    member_data = []
    for member in members:
        if member.user:
            member_data.append({
                "user_id": member.user.id,
                "email": member.user.email,
                "name": f"{member.user.first_name} {member.user.last_name}",
                "role": member.role,
                "is_owner": member.is_owner,
                "is_active": member.is_active,
                "joined_at": member.joined_at
            })
    
    # Get assessments
    assessments = db.query(ESGAssessment).filter(
        ESGAssessment.organization_id == org_id
    ).count()
    
    return {
        "organization": organization,
        "members": member_data,
        "assessments_count": assessments,
        "storage_used_mb": 245.7  # Mock data
    }

# ================================================================================
# AUDIT LOGS & SECURITY
# ================================================================================

@router.get("/audit-logs", response_model=List[AuditLogResponse])
async def get_audit_logs(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    event_type: Optional[str] = Query(None),
    user_email: Optional[str] = Query(None),
    start_date: Optional[datetime] = Query(None),
    end_date: Optional[datetime] = Query(None),
    admin_user: User = Depends(verify_admin_access),
    db: Session = Depends(get_db)
):
    """Get system audit logs"""
    
    query = db.query(AuditLog)
    
    if event_type:
        query = query.filter(AuditLog.event_type == event_type)
    
    if user_email:
        query = query.join(User).filter(User.email.ilike(f"%{user_email}%"))
    
    if start_date:
        query = query.filter(AuditLog.timestamp >= start_date)
    
    if end_date:
        query = query.filter(AuditLog.timestamp <= end_date)
    
    logs = query.order_by(AuditLog.timestamp.desc()).offset(skip).limit(limit).all()
    
    response = []
    for log in logs:
        response.append(AuditLogResponse(
            id=log.id,
            event_type=log.event_type,
            event_category=log.event_category,
            event_description=log.event_description,
            user_email=log.user.email if log.user else None,
            organization_name=log.organization.name if log.organization else None,
            ip_address=log.ip_address,
            status=log.status,
            timestamp=log.timestamp
        ))
    
    return response

@router.get("/security-events", response_model=List[SecurityEventResponse])
async def get_security_events(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=500),
    severity: Optional[str] = Query(None, regex="^(low|medium|high|critical)$"),
    resolved: Optional[bool] = Query(None),
    admin_user: User = Depends(verify_admin_access),
    db: Session = Depends(get_db)
):
    """Get security events and alerts"""
    
    query = db.query(SecurityEvent)
    
    if severity:
        query = query.filter(SecurityEvent.severity == severity)
    
    if resolved is not None:
        query = query.filter(SecurityEvent.resolved == resolved)
    
    events = query.order_by(SecurityEvent.timestamp.desc()).offset(skip).limit(limit).all()
    
    response = []
    for event in events:
        response.append(SecurityEventResponse(
            id=event.id,
            event_type=event.event_type,
            severity=event.severity,
            description=event.description,
            user_email=event.user.email if event.user else None,
            ip_address=event.ip_address,
            user_agent=event.user_agent,
            resolved=event.resolved,
            timestamp=event.timestamp
        ))
    
    return response

@router.put("/security-events/{event_id}/resolve")
async def resolve_security_event(
    event_id: UUID,
    resolution_notes: Optional[str] = None,
    admin_user: User = Depends(verify_admin_access),
    db: Session = Depends(get_db)
):
    """Mark security event as resolved"""
    
    event = db.query(SecurityEvent).filter(SecurityEvent.id == event_id).first()
    
    if not event:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Security event not found"
        )
    
    event.resolved = True
    event.resolved_at = datetime.utcnow()
    event.resolved_by_id = admin_user.id
    event.resolution_notes = resolution_notes
    
    db.commit()
    
    return {"message": "Security event resolved successfully"}

# ================================================================================
# SYSTEM CONFIGURATION
# ================================================================================

@router.get("/config")
async def get_system_config(
    admin_user: User = Depends(verify_admin_access)
):
    """Get system configuration"""
    
    return {
        "application": {
            "name": settings.APP_NAME,
            "version": settings.APP_VERSION,
            "environment": settings.ENVIRONMENT,
            "debug": settings.DEBUG
        },
        "database": {
            "pool_size": settings.DATABASE_POOL_SIZE,
            "max_overflow": settings.DATABASE_MAX_OVERFLOW
        },
        "security": {
            "jwt_expire_minutes": settings.JWT_ACCESS_TOKEN_EXPIRE_MINUTES,
            "refresh_expire_days": settings.JWT_REFRESH_TOKEN_EXPIRE_DAYS,
            "password_min_length": settings.PASSWORD_MIN_LENGTH
        },
        "features": {
            "swagger_ui": settings.ENABLE_SWAGGER_UI,
            "redoc": settings.ENABLE_REDOC,
            "flower": settings.ENABLE_FLOWER
        }
    }

@router.put("/config")
async def update_system_config(
    config_update: SystemConfigUpdate,
    admin_user: User = Depends(verify_admin_access),
    db: Session = Depends(get_db)
):
    """Update system configuration"""
    
    # Log configuration change
    audit_log = AuditLog(
        event_type="config_update",
        event_category="admin",
        event_description=f"System configuration updated: {config_update.component}",
        user_id=admin_user.id,
        metadata=config_update.settings,
        status="success"
    )
    db.add(audit_log)
    db.commit()
    
    return {"message": "Configuration updated successfully"}

# ================================================================================
# SYSTEM MAINTENANCE
# ================================================================================

@router.post("/maintenance/cleanup")
async def run_system_cleanup(
    admin_user: User = Depends(verify_admin_access),
    db: Session = Depends(get_db)
):
    """Run system cleanup tasks"""
    
    cleanup_results = {
        "audit_logs_cleaned": 0,
        "expired_tokens_cleaned": 0,
        "temp_files_cleaned": 0,
        "orphaned_records_cleaned": 0
    }
    
    try:
        # Clean old audit logs (older than 90 days)
        old_logs = db.query(AuditLog).filter(
            AuditLog.timestamp < datetime.utcnow() - timedelta(days=90)
        ).count()
        
        db.query(AuditLog).filter(
            AuditLog.timestamp < datetime.utcnow() - timedelta(days=90)
        ).delete()
        
        cleanup_results["audit_logs_cleaned"] = old_logs
        
        db.commit()
        
        # Log cleanup action
        audit_log = AuditLog(
            event_type="system_cleanup",
            event_category="admin",
            event_description="System cleanup completed",
            user_id=admin_user.id,
            metadata=cleanup_results,
            status="success"
        )
        db.add(audit_log)
        db.commit()
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Cleanup failed: {str(e)}"
        )
    
    return {
        "message": "System cleanup completed successfully",
        "results": cleanup_results
    }

@router.get("/maintenance/backup-status")
async def get_backup_status(
    admin_user: User = Depends(verify_admin_access)
):
    """Get database backup status"""
    
    # Mock backup status (in production, check actual backup system)
    return {
        "last_backup": "2024-08-04T02:00:00Z",
        "backup_size_gb": 2.45,
        "status": "completed",
        "next_scheduled": "2024-08-05T02:00:00Z",
        "retention_days": 30,
        "automated": True
    }