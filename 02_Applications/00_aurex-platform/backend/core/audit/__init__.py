"""
Comprehensive Audit Trail System
Immutable logging for compliance and security
"""
from datetime import datetime
from typing import Optional, Dict, Any
from uuid import UUID, uuid4
import json
from sqlalchemy import Column, String, DateTime, JSON, Text
from sqlalchemy.dialects.postgresql import UUID as PGUUID

from ..database import db_manager

class AuditEvent(db_manager.Base):
    """Audit event model for immutable audit trail"""
    __tablename__ = "audit_events"
    
    id = Column(PGUUID(as_uuid=True), primary_key=True, default=uuid4)
    timestamp = Column(DateTime, default=datetime.utcnow, nullable=False)
    user_id = Column(PGUUID(as_uuid=True), nullable=True)
    organization_id = Column(PGUUID(as_uuid=True), nullable=True)
    session_id = Column(String(255), nullable=True)
    action = Column(String(100), nullable=False)  # e.g., "user.login", "assessment.created"
    resource_type = Column(String(50), nullable=True)  # e.g., "assessment", "user"
    resource_id = Column(String(255), nullable=True)
    old_values = Column(JSON, nullable=True)
    new_values = Column(JSON, nullable=True)
    ip_address = Column(String(45), nullable=True)
    user_agent = Column(Text, nullable=True)
    correlation_id = Column(PGUUID(as_uuid=True), default=uuid4)
    event_metadata = Column(JSON, nullable=True)

class AuditLogger:
    """Service for logging audit events"""
    
    def __init__(self):
        self.initialized = False
    
    async def initialize(self):
        """Initialize audit logging system"""
        # Create audit tables if not exist
        async with db_manager.engine.begin() as conn:
            await conn.run_sync(db_manager.Base.metadata.create_all)
        self.initialized = True
    
    async def log_event(
        self,
        action: str,
        resource_type: Optional[str] = None,
        resource_id: Optional[str] = None,
        user_id: Optional[str] = None,
        organization_id: Optional[str] = None,
        session_id: Optional[str] = None,
        old_values: Optional[Dict[str, Any]] = None,
        new_values: Optional[Dict[str, Any]] = None,
        ip_address: Optional[str] = None,
        user_agent: Optional[str] = None,
        metadata: Optional[Dict[str, Any]] = None
    ) -> UUID:
        """
        Log an audit event
        
        Args:
            action: Action performed (e.g., "user.login", "data.updated")
            resource_type: Type of resource affected
            resource_id: ID of resource affected
            user_id: User who performed action
            organization_id: Organization context
            session_id: Session identifier
            old_values: Previous state (for updates)
            new_values: New state (for updates)
            ip_address: Client IP address
            user_agent: Client user agent
            metadata: Additional metadata
        
        Returns:
            UUID of created audit event
        """
        if not self.initialized:
            await self.initialize()
        
        event = AuditEvent(
            action=action,
            resource_type=resource_type,
            resource_id=resource_id,
            user_id=UUID(user_id) if user_id else None,
            organization_id=UUID(organization_id) if organization_id else None,
            session_id=session_id,
            old_values=old_values,
            new_values=new_values,
            ip_address=ip_address,
            user_agent=user_agent,
            metadata=metadata
        )
        
        async with db_manager.get_session() as session:
            session.add(event)
            await session.commit()
            return event.id
    
    async def query_events(
        self,
        user_id: Optional[str] = None,
        organization_id: Optional[str] = None,
        action: Optional[str] = None,
        resource_type: Optional[str] = None,
        resource_id: Optional[str] = None,
        start_date: Optional[datetime] = None,
        end_date: Optional[datetime] = None,
        limit: int = 100,
        offset: int = 0
    ) -> list:
        """Query audit events with filters"""
        async with db_manager.get_session() as session:
            query = session.query(AuditEvent)
            
            if user_id:
                query = query.filter(AuditEvent.user_id == UUID(user_id))
            if organization_id:
                query = query.filter(AuditEvent.organization_id == UUID(organization_id))
            if action:
                query = query.filter(AuditEvent.action.like(f"{action}%"))
            if resource_type:
                query = query.filter(AuditEvent.resource_type == resource_type)
            if resource_id:
                query = query.filter(AuditEvent.resource_id == resource_id)
            if start_date:
                query = query.filter(AuditEvent.timestamp >= start_date)
            if end_date:
                query = query.filter(AuditEvent.timestamp <= end_date)
            
            query = query.order_by(AuditEvent.timestamp.desc())
            query = query.limit(limit).offset(offset)
            
            events = await session.execute(query)
            return events.scalars().all()
    
    async def export_audit_trail(
        self,
        organization_id: str,
        start_date: datetime,
        end_date: datetime,
        format: str = "json"
    ) -> str:
        """Export audit trail for compliance reporting"""
        events = await self.query_events(
            organization_id=organization_id,
            start_date=start_date,
            end_date=end_date,
            limit=10000
        )
        
        if format == "json":
            return json.dumps([
                {
                    "id": str(e.id),
                    "timestamp": e.timestamp.isoformat(),
                    "action": e.action,
                    "user_id": str(e.user_id) if e.user_id else None,
                    "resource_type": e.resource_type,
                    "resource_id": e.resource_id,
                    "old_values": e.old_values,
                    "new_values": e.new_values,
                    "ip_address": e.ip_address
                }
                for e in events
            ], indent=2)
        
        # Add CSV format support if needed
        return ""

# Global instance
audit_logger = AuditLogger()

class AuditService:
    """Static service class for backward compatibility"""
    
    @staticmethod
    async def initialize():
        await audit_logger.initialize()
    
    @staticmethod
    async def log_event(**kwargs):
        return await audit_logger.log_event(**kwargs)

__all__ = ["AuditLogger", "audit_logger", "AuditService", "AuditEvent"]