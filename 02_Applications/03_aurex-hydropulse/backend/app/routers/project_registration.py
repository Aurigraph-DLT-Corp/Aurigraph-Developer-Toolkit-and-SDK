"""
Project Registration API Routes
FastAPI endpoints for AWD project registration and management
"""

from fastapi import APIRouter, Depends, HTTPException, Query, Path, status
from sqlalchemy.orm import Session
from typing import List, Optional
import uuid

from app.database import get_db
from app.schemas.project_registration import (
    ProjectCreate, ProjectUpdate, ProjectResponse, ProjectListResponse,
    ProjectFilters, ProjectApprovalRequest, ProjectValidationResponse,
    ProjectStats, VVBResponse
)
from app.services.project_registration_service import ProjectRegistrationService
from app.services.auth_service import get_current_user, require_permissions
from app.models.users import User

router = APIRouter(prefix="/api/v1/projects", tags=["Project Registration"])


@router.post("/", response_model=ProjectResponse, status_code=status.HTTP_201_CREATED)
async def create_project(
    project_data: ProjectCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Create a new AWD project
    
    Required Permissions: project:create
    Allowed Roles: Business Owner, Project Manager
    """
    # Check permissions
    require_permissions(current_user, ["project:create"])
    
    # Initialize service
    service = ProjectRegistrationService(db)
    
    try:
        # Create project
        project = await service.create_project(project_data, current_user.id)
        return project
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail="Failed to create project")


@router.get("/", response_model=ProjectListResponse)
async def list_projects(
    page: int = Query(1, ge=1, description="Page number"),
    page_size: int = Query(20, ge=1, le=100, description="Items per page"),
    state: Optional[str] = Query(None, description="Filter by state"),
    status: Optional[str] = Query(None, description="Filter by status"),
    methodology_type: Optional[str] = Query(None, description="Filter by methodology"),
    created_by: Optional[uuid.UUID] = Query(None, description="Filter by creator"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    List projects with filtering and pagination
    
    Required Permissions: project:read
    Territory Restrictions: Users can only see projects in their assigned regions
    """
    # Check permissions
    require_permissions(current_user, ["project:read"])
    
    # Build filters
    filters = ProjectFilters(
        state=state,
        status=status,
        methodology_type=methodology_type,
        created_by=created_by
    )
    
    # Apply territory restrictions
    territory_filter = None
    if not current_user.is_super_admin:
        territory_filter = current_user.assigned_territories
    
    service = ProjectRegistrationService(db)
    return await service.list_projects(
        page=page,
        page_size=page_size,
        filters=filters,
        territory_filter=territory_filter,
        user_id=current_user.id
    )


@router.get("/{project_id}", response_model=ProjectResponse)
async def get_project(
    project_id: uuid.UUID = Path(..., description="Project ID"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get project details by ID
    
    Required Permissions: project:read
    Territory Restrictions: Must be in user's assigned region
    """
    require_permissions(current_user, ["project:read"])
    
    service = ProjectRegistrationService(db)
    project = await service.get_project(project_id, current_user.id)
    
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    # Check territory access
    if not current_user.is_super_admin and project.state not in current_user.assigned_territories:
        raise HTTPException(status_code=403, detail="Access denied to this region")
    
    return project


@router.put("/{project_id}", response_model=ProjectResponse)
async def update_project(
    project_id: uuid.UUID = Path(..., description="Project ID"),
    project_data: ProjectUpdate = ...,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Update project details
    
    Required Permissions: project:update
    Allowed Roles: Business Owner, Project Manager (own projects)
    """
    require_permissions(current_user, ["project:update"])
    
    service = ProjectRegistrationService(db)
    
    # Check if user can edit this project
    project = await service.get_project(project_id, current_user.id)
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    # Only allow updates by creator or higher roles
    if (project.created_by != current_user.id and 
        not current_user.has_role(["business_owner", "super_admin"])):
        raise HTTPException(status_code=403, detail="Cannot edit this project")
    
    try:
        updated_project = await service.update_project(project_id, project_data, current_user.id)
        return updated_project
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.delete("/{project_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_project(
    project_id: uuid.UUID = Path(..., description="Project ID"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Delete project (soft delete)
    
    Required Permissions: project:delete
    Allowed Roles: Business Owner only
    """
    require_permissions(current_user, ["project:delete"])
    
    # Only Business Owner can delete projects
    if not current_user.has_role(["business_owner"]):
        raise HTTPException(status_code=403, detail="Only Business Owner can delete projects")
    
    service = ProjectRegistrationService(db)
    
    project = await service.get_project(project_id, current_user.id)
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    await service.delete_project(project_id, current_user.id)


@router.post("/{project_id}/approve", response_model=ProjectResponse)
async def approve_project(
    project_id: uuid.UUID = Path(..., description="Project ID"),
    approval_request: ProjectApprovalRequest = ...,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Approve or reject project at current approval level
    
    Approval Workflow:
    - Level 1: Project Manager
    - Level 2: Business Owner  
    - Level 3: Super Admin (final approval)
    """
    service = ProjectRegistrationService(db)
    
    project = await service.get_project(project_id, current_user.id)
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    # Determine required role for current approval level
    required_roles = {
        0: ["project_manager"],  # Initial approval
        1: ["business_owner"],   # Business approval
        2: ["super_admin"]       # Final approval
    }
    
    current_level = project.approval_level
    if current_level not in required_roles:
        raise HTTPException(status_code=400, detail="Invalid approval level")
    
    if not current_user.has_role(required_roles[current_level]):
        raise HTTPException(
            status_code=403, 
            detail=f"Insufficient permissions for approval level {current_level + 1}"
        )
    
    try:
        approved_project = await service.approve_project(
            project_id, 
            approval_request.status,
            approval_request.comments,
            current_user.id,
            approval_request.approval_data
        )
        return approved_project
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/{project_id}/validate", response_model=ProjectValidationResponse)
async def validate_project(
    project_id: uuid.UUID = Path(..., description="Project ID"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Run validation checks on project
    
    Required Permissions: project:validate
    """
    require_permissions(current_user, ["project:validate"])
    
    service = ProjectRegistrationService(db)
    
    project = await service.get_project(project_id, current_user.id)
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    validation_result = await service.validate_project(project_id)
    return validation_result


@router.get("/{project_id}/stats", response_model=ProjectStats)
async def get_project_stats(
    project_id: uuid.UUID = Path(..., description="Project ID"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get project statistics and metrics
    
    Required Permissions: project:read
    """
    require_permissions(current_user, ["project:read"])
    
    service = ProjectRegistrationService(db)
    
    project = await service.get_project(project_id, current_user.id)
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    stats = await service.get_project_stats(project_id)
    return stats


@router.get("/vvb/", response_model=List[VVBResponse])
async def list_verification_bodies(
    methodology_type: Optional[str] = Query(None, description="Filter by methodology"),
    region: Optional[str] = Query(None, description="Filter by region coverage"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    List available Verification Bodies (VVB) for project assignment
    
    Required Permissions: project:read
    """
    require_permissions(current_user, ["project:read"])
    
    service = ProjectRegistrationService(db)
    vvbs = await service.list_vvbs(methodology_type, region)
    return vvbs


@router.post("/{project_id}/duplicate", response_model=ProjectResponse)
async def duplicate_project(
    project_id: uuid.UUID = Path(..., description="Project ID to duplicate"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Create a copy of existing project
    
    Required Permissions: project:create
    """
    require_permissions(current_user, ["project:create"])
    
    service = ProjectRegistrationService(db)
    
    original_project = await service.get_project(project_id, current_user.id)
    if not original_project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    try:
        duplicated_project = await service.duplicate_project(project_id, current_user.id)
        return duplicated_project
    except Exception as e:
        raise HTTPException(status_code=500, detail="Failed to duplicate project")


@router.get("/dashboard/overview")
async def get_dashboard_overview(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get dashboard overview statistics
    
    Required Permissions: dashboard:read
    """
    require_permissions(current_user, ["dashboard:read"])
    
    service = ProjectRegistrationService(db)
    
    # Apply territory restrictions
    territory_filter = None
    if not current_user.is_super_admin:
        territory_filter = current_user.assigned_territories
    
    overview = await service.get_dashboard_overview(
        user_id=current_user.id,
        territory_filter=territory_filter
    )
    return overview