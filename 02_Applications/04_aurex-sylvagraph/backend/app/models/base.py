"""
Aurex Sylvagraph - Database Base Models
PostGIS-enabled geospatial database models for agroforestry and carbon credits
"""

from datetime import datetime
from typing import Optional
from sqlalchemy import DateTime, String, Integer, Boolean, func, event
from sqlalchemy.ext.declarative import declared_attr
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column
from geoalchemy2 import Geometry
import uuid


class Base(DeclarativeBase):
    """Base class for all database models with common fields"""
    pass


class TimestampMixin:
    """Mixin for created_at and updated_at timestamps"""
    
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False
    )
    
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False
    )


class UUIDMixin:
    """Mixin for UUID primary key"""
    
    id: Mapped[str] = mapped_column(
        String(36),
        primary_key=True,
        default=lambda: str(uuid.uuid4()),
        nullable=False
    )


class SoftDeleteMixin:
    """Mixin for soft delete functionality"""
    
    deleted_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
        default=None
    )
    
    is_deleted: Mapped[bool] = mapped_column(
        Boolean,
        default=False,
        nullable=False
    )


class GeospatialMixin:
    """Mixin for geospatial functionality using PostGIS"""
    
    # Point geometry for locations (SRID 4326 = WGS84)
    location: Mapped[Optional[str]] = mapped_column(
        Geometry('POINT', srid=4326),
        nullable=True
    )
    
    # Polygon geometry for boundaries/areas
    boundary: Mapped[Optional[str]] = mapped_column(
        Geometry('POLYGON', srid=4326),
        nullable=True
    )
    
    # MultiPolygon for complex areas
    area: Mapped[Optional[str]] = mapped_column(
        Geometry('MULTIPOLYGON', srid=4326),
        nullable=True
    )


class AuditMixin:
    """Mixin for audit trail functionality"""
    
    created_by: Mapped[Optional[str]] = mapped_column(String(36), nullable=True)
    updated_by: Mapped[Optional[str]] = mapped_column(String(36), nullable=True)
    version: Mapped[int] = mapped_column(Integer, default=1, nullable=False)


class IPFSMixin:
    """Mixin for IPFS hash storage for immutable data"""
    
    ipfs_hash: Mapped[Optional[str]] = mapped_column(String(64), nullable=True)
    ipfs_metadata: Mapped[Optional[str]] = mapped_column(String(64), nullable=True)


# Event listeners for automatic audit updates
@event.listens_for(TimestampMixin, 'before_update', propagate=True)
def receive_before_update(mapper, connection, target):
    """Update the updated_at timestamp before any update"""
    target.updated_at = datetime.utcnow()


@event.listens_for(AuditMixin, 'before_update', propagate=True) 
def receive_before_audit_update(mapper, connection, target):
    """Increment version on any update"""
    target.version += 1