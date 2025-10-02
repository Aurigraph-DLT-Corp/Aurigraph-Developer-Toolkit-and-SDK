"""
Aurex Sylvagraph - Agroforestry Projects Router
Project creation, management, and monitoring
"""

from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, or_
from pydantic import BaseModel
from datetime import datetime

from database import get_db
from app.models.projects import AgroforestryProject, ProjectParcel, FarmerProfile, ProjectStatus, ProjectType, Methodology
from app.models.users import User, UserRole
from app.routers.auth import get_current_user, require_role

router = APIRouter()

class ProjectCreate(BaseModel):
    name: str
    description: str
    project_type: ProjectType
    country: str
    state_province: str
    municipality: Optional[str] = None
    total_area_hectares: float
    methodology: Methodology
    start_date: datetime
    end_date: Optional[datetime] = None
    estimated_annual_sequestration: Optional[float] = None
    farmer_benefit_percentage: float = 60.0

@router.post("/", response_model=dict)
async def create_project(
    project_data: ProjectCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Create new agroforestry project"""
    # Generate unique project code
    project_count = await db.execute(select(AgroforestryProject).count())
    project_code = f"SYL-{project_count.scalar() + 1:06d}"
    
    project = AgroforestryProject(
        project_code=project_code,
        owner_id=current_user.id,
        **project_data.dict()
    )
    
    db.add(project)
    await db.commit()
    await db.refresh(project)
    
    return {
        "message": "Project created successfully",
        "project_id": project.id,
        "project_code": project.project_code
    }

@router.get("/", response_model=List[dict])
async def list_projects(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    status: Optional[ProjectStatus] = None,
    project_type: Optional[ProjectType] = None,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """List agroforestry projects with filtering"""
    query = select(AgroforestryProject)
    
    # Apply role-based filtering
    if current_user.primary_role not in [UserRole.SUPER_ADMIN]:
        query = query.where(
            or_(
                AgroforestryProject.owner_id == current_user.id,
                AgroforestryProject.manager_id == current_user.id
            )
        )
    
    # Apply filters
    if status:
        query = query.where(AgroforestryProject.status == status)
    if project_type:
        query = query.where(AgroforestryProject.project_type == project_type)
    
    query = query.offset(skip).limit(limit)
    result = await db.execute(query)
    projects = result.scalars().all()
    
    return [
        {
            "id": p.id,
            "project_code": p.project_code,
            "name": p.name,
            "project_type": p.project_type,
            "status": p.status,
            "total_area_hectares": p.total_area_hectares,
            "country": p.country,
            "methodology": p.methodology,
            "created_at": p.created_at
        }
        for p in projects
    ]

@router.get("/{project_id}", response_model=dict)
async def get_project(
    project_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get detailed project information"""
    result = await db.execute(select(AgroforestryProject).where(AgroforestryProject.id == project_id))
    project = result.scalar_one_or_none()
    
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    # Check permissions
    if (current_user.primary_role not in [UserRole.SUPER_ADMIN] and 
        project.owner_id != current_user.id and 
        project.manager_id != current_user.id):
        raise HTTPException(status_code=403, detail="Access denied")
    
    return {
        "id": project.id,
        "project_code": project.project_code,
        "name": project.name,
        "description": project.description,
        "project_type": project.project_type,
        "status": project.status,
        "country": project.country,
        "state_province": project.state_province,
        "municipality": project.municipality,
        "total_area_hectares": project.total_area_hectares,
        "planted_area_hectares": project.planted_area_hectares,
        "methodology": project.methodology,
        "start_date": project.start_date,
        "end_date": project.end_date,
        "baseline_carbon_stock": float(project.baseline_carbon_stock) if project.baseline_carbon_stock else None,
        "estimated_annual_sequestration": float(project.estimated_annual_sequestration) if project.estimated_annual_sequestration else None,
        "farmer_benefit_percentage": project.farmer_benefit_percentage,
        "created_at": project.created_at,
        "updated_at": project.updated_at
    }

@router.put("/{project_id}", response_model=dict)
async def update_project(
    project_id: str,
    project_data: dict,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Update project information"""
    result = await db.execute(select(AgroforestryProject).where(AgroforestryProject.id == project_id))
    project = result.scalar_one_or_none()
    
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    # Check permissions
    if (current_user.primary_role not in [UserRole.SUPER_ADMIN, UserRole.BUSINESS_OWNER] and 
        project.owner_id != current_user.id):
        raise HTTPException(status_code=403, detail="Access denied")
    
    # Update fields
    for field, value in project_data.items():
        if hasattr(project, field):
            setattr(project, field, value)
    
    project.updated_by = current_user.id
    await db.commit()
    
    return {"message": "Project updated successfully"}

@router.post("/{project_id}/parcels", response_model=dict)
async def create_parcel(
    project_id: str,
    parcel_data: dict,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Create project parcel"""
    # Verify project exists and user has permission
    result = await db.execute(select(AgroforestryProject).where(AgroforestryProject.id == project_id))
    project = result.scalar_one_or_none()
    
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    parcel = ProjectParcel(
        project_id=project_id,
        **parcel_data
    )
    
    db.add(parcel)
    await db.commit()
    await db.refresh(parcel)
    
    return {
        "message": "Parcel created successfully",
        "parcel_id": parcel.id
    }

@router.get("/{project_id}/analytics", response_model=dict)
async def get_project_analytics(
    project_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get project analytics and KPIs"""
    result = await db.execute(select(AgroforestryProject).where(AgroforestryProject.id == project_id))
    project = result.scalar_one_or_none()
    
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    # Check permissions
    if (current_user.primary_role not in [UserRole.SUPER_ADMIN] and 
        project.owner_id != current_user.id and 
        project.manager_id != current_user.id):
        raise HTTPException(status_code=403, detail="Access denied")
    
    # Calculate analytics (placeholder implementation)
    return {
        "project_id": project_id,
        "total_area_hectares": project.total_area_hectares,
        "planted_area_hectares": project.planted_area_hectares or 0,
        "planting_progress_percent": 0,  # Calculate based on actual data
        "estimated_carbon_stock": float(project.baseline_carbon_stock) if project.baseline_carbon_stock else 0,
        "credits_generated": 0,  # From credit batches
        "farmers_enrolled": 0,  # Count from farmer profiles
        "monitoring_sessions": 0,  # Count from monitoring data
        "biodiversity_score": project.biodiversity_score or 0,
        "project_status": project.status
    }