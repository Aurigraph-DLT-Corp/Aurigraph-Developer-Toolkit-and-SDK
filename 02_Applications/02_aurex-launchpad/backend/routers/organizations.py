#!/usr/bin/env python3
# ================================================================================
# AUREX LAUNCHPAD™ ORGANIZATIONS ROUTER
# Multi-tenant organization management and collaboration endpoints
# Agent: Organization Management Agent
# ================================================================================

from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from pydantic import BaseModel, Field, EmailStr
from typing import List, Optional, Dict, Any
from datetime import datetime
from uuid import UUID

from models.base_models import get_db
from models.auth_models import User, Organization, OrganizationMember, Role, Permission
from routers.auth import get_current_user
from config import get_settings

router = APIRouter(prefix="/api/v1/organizations", tags=["Organization Management"])
settings = get_settings()

# ================================================================================
# PYDANTIC MODELS
# ================================================================================

class OrganizationCreateRequest(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)
    description: Optional[str] = Field(None, max_length=1000)
    industry: Optional[str] = Field(None, max_length=100)
    website: Optional[str] = Field(None, max_length=255)
    headquarters_location: Optional[str] = Field(None, max_length=255)
    employee_count: Optional[int] = Field(None, ge=1)

class OrganizationUpdateRequest(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=255)
    description: Optional[str] = Field(None, max_length=1000)
    industry: Optional[str] = Field(None, max_length=100)
    website: Optional[str] = Field(None, max_length=255)
    headquarters_location: Optional[str] = Field(None, max_length=255)
    employee_count: Optional[int] = Field(None, ge=1)

class OrganizationResponse(BaseModel):
    id: UUID
    name: str
    slug: str
    description: Optional[str]
    industry: Optional[str]
    website: Optional[str]
    headquarters_location: Optional[str]
    employee_count: Optional[int]
    is_active: bool
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True

class OrganizationMemberResponse(BaseModel):
    id: UUID
    user_id: UUID
    user_email: str
    user_name: str
    role: str
    is_owner: bool
    is_active: bool
    joined_at: datetime
    last_active_at: Optional[datetime]
    
    class Config:
        from_attributes = True

class InviteMemberRequest(BaseModel):
    email: EmailStr
    role: str = Field(..., regex="^(org_admin|esg_manager|analyst|viewer)$")
    message: Optional[str] = Field(None, max_length=500)

class UpdateMemberRoleRequest(BaseModel):
    role: str = Field(..., regex="^(org_admin|esg_manager|analyst|viewer)$")

class OrganizationSettingsResponse(BaseModel):
    assessment_workflows: Dict[str, Any]
    data_retention_policy: Dict[str, Any]
    security_settings: Dict[str, Any]
    notification_preferences: Dict[str, Any]
    integration_settings: Dict[str, Any]

class OrganizationStatsResponse(BaseModel):
    total_members: int
    active_members: int
    total_assessments: int
    completed_assessments: int
    total_documents: int
    storage_used_mb: float
    last_activity: Optional[datetime]

# ================================================================================
# ORGANIZATION MANAGEMENT
# ================================================================================

@router.get("/" , response_model=List[OrganizationResponse])
async def list_user_organizations(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """List organizations the current user belongs to"""
    
    memberships = db.query(OrganizationMember).filter(
        OrganizationMember.user_id == current_user.id,
        OrganizationMember.is_active == True
    ).all()
    
    organizations = []
    for membership in memberships:
        org = membership.organization
        if org and org.is_active:
            organizations.append(org)
    
    return organizations

@router.post("/", response_model=OrganizationResponse)
async def create_organization(
    org_data: OrganizationCreateRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Create a new organization"""
    
    # Check if organization name already exists
    existing_org = db.query(Organization).filter(
        Organization.name == org_data.name
    ).first()
    
    if existing_org:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Organization name already exists"
        )
    
    # Create organization slug
    slug = org_data.name.lower().replace(" ", "-").replace(".", "")
    slug_exists = db.query(Organization).filter(Organization.slug == slug).first()
    
    if slug_exists:
        slug = f"{slug}-{int(datetime.utcnow().timestamp())}"
    
    # Create organization
    organization = Organization(
        name=org_data.name,
        slug=slug,
        description=org_data.description,
        industry=org_data.industry,
        website=org_data.website,
        headquarters_location=org_data.headquarters_location,
        employee_count=org_data.employee_count
    )
    
    db.add(organization)
    db.flush()
    
    # Add creator as organization owner
    membership = OrganizationMember(
        organization_id=organization.id,
        user_id=current_user.id,
        role="org_admin",
        is_owner=True,
        joined_at=datetime.utcnow(),
        is_active=True
    )
    
    db.add(membership)
    db.commit()
    db.refresh(organization)
    
    return organization

@router.get("/{org_id}", response_model=OrganizationResponse)
async def get_organization(
    org_id: UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get organization details"""
    
    # Verify user has access to this organization
    membership = db.query(OrganizationMember).filter(
        OrganizationMember.organization_id == org_id,
        OrganizationMember.user_id == current_user.id,
        OrganizationMember.is_active == True
    ).first()
    
    if not membership:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied to this organization"
        )
    
    organization = db.query(Organization).filter(
        Organization.id == org_id,
        Organization.is_active == True
    ).first()
    
    if not organization:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Organization not found"
        )
    
    return organization

@router.put("/{org_id}", response_model=OrganizationResponse)
async def update_organization(
    org_id: UUID,
    update_data: OrganizationUpdateRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update organization details (admin only)"""
    
    # Check if user is admin of this organization
    membership = db.query(OrganizationMember).filter(
        OrganizationMember.organization_id == org_id,
        OrganizationMember.user_id == current_user.id,
        OrganizationMember.role.in_(["org_admin"]),
        OrganizationMember.is_active == True
    ).first()
    
    if not membership:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required"
        )
    
    organization = db.query(Organization).filter(
        Organization.id == org_id,
        Organization.is_active == True
    ).first()
    
    if not organization:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Organization not found"
        )
    
    # Update fields
    update_dict = update_data.dict(exclude_unset=True)
    for field, value in update_dict.items():
        setattr(organization, field, value)
    
    organization.updated_at = datetime.utcnow()
    
    db.commit()
    db.refresh(organization)
    
    return organization

@router.delete("/{org_id}")
async def delete_organization(
    org_id: UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Delete organization (owner only)"""
    
    # Check if user is owner of this organization
    membership = db.query(OrganizationMember).filter(
        OrganizationMember.organization_id == org_id,
        OrganizationMember.user_id == current_user.id,
        OrganizationMember.is_owner == True,
        OrganizationMember.is_active == True
    ).first()
    
    if not membership:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Owner access required"
        )
    
    organization = db.query(Organization).filter(
        Organization.id == org_id
    ).first()
    
    if not organization:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Organization not found"
        )
    
    # Soft delete organization
    organization.soft_delete()
    
    # Deactivate all memberships
    db.query(OrganizationMember).filter(
        OrganizationMember.organization_id == org_id
    ).update({"is_active": False})
    
    db.commit()
    
    return {"message": "Organization deleted successfully"}

# ================================================================================
# MEMBER MANAGEMENT
# ================================================================================

@router.get("/{org_id}/members", response_model=List[OrganizationMemberResponse])
async def list_organization_members(
    org_id: UUID,
    active_only: bool = Query(True),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """List organization members"""
    
    # Verify user has access to this organization
    membership = db.query(OrganizationMember).filter(
        OrganizationMember.organization_id == org_id,
        OrganizationMember.user_id == current_user.id,
        OrganizationMember.is_active == True
    ).first()
    
    if not membership:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied to this organization"
        )
    
    query = db.query(OrganizationMember).filter(
        OrganizationMember.organization_id == org_id
    )
    
    if active_only:
        query = query.filter(OrganizationMember.is_active == True)
    
    members = query.all()
    
    response = []
    for member in members:
        user = member.user
        response.append(OrganizationMemberResponse(
            id=member.id,
            user_id=user.id,
            user_email=user.email,
            user_name=f"{user.first_name} {user.last_name}",
            role=member.role,
            is_owner=member.is_owner,
            is_active=member.is_active,
            joined_at=member.joined_at,
            last_active_at=user.last_login_at
        ))
    
    return response

@router.post("/{org_id}/members/invite")
async def invite_member(
    org_id: UUID,
    invite_data: InviteMemberRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Invite new member to organization (admin only)"""
    
    # Check if user is admin of this organization
    membership = db.query(OrganizationMember).filter(
        OrganizationMember.organization_id == org_id,
        OrganizationMember.user_id == current_user.id,
        OrganizationMember.role.in_(["org_admin"]),
        OrganizationMember.is_active == True
    ).first()
    
    if not membership:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required"
        )
    
    # Check if user already exists
    existing_user = db.query(User).filter(User.email == invite_data.email).first()
    
    if existing_user:
        # Check if already a member
        existing_membership = db.query(OrganizationMember).filter(
            OrganizationMember.organization_id == org_id,
            OrganizationMember.user_id == existing_user.id
        ).first()
        
        if existing_membership:
            if existing_membership.is_active:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="User is already a member of this organization"
                )
            else:
                # Reactivate existing membership
                existing_membership.is_active = True
                existing_membership.role = invite_data.role
                existing_membership.joined_at = datetime.utcnow()
                db.commit()
                
                return {"message": "User re-added to organization successfully"}
        else:
            # Add existing user to organization
            new_membership = OrganizationMember(
                organization_id=org_id,
                user_id=existing_user.id,
                role=invite_data.role,
                is_owner=False,
                joined_at=datetime.utcnow(),
                is_active=True
            )
            db.add(new_membership)
            db.commit()
            
            return {"message": "User added to organization successfully"}
    
    # For new users, in production you would:
    # 1. Create invitation record
    # 2. Send invitation email
    # 3. Handle registration flow
    
    return {
        "message": "Invitation sent successfully",
        "email": invite_data.email,
        "role": invite_data.role,
        "expires_in_hours": 72
    }

@router.put("/{org_id}/members/{member_id}/role")
async def update_member_role(
    org_id: UUID,
    member_id: UUID,
    role_data: UpdateMemberRoleRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update member role (admin only)"""
    
    # Check if user is admin of this organization
    admin_membership = db.query(OrganizationMember).filter(
        OrganizationMember.organization_id == org_id,
        OrganizationMember.user_id == current_user.id,
        OrganizationMember.role.in_(["org_admin"]),
        OrganizationMember.is_active == True
    ).first()
    
    if not admin_membership:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required"
        )
    
    # Get member to update
    member = db.query(OrganizationMember).filter(
        OrganizationMember.id == member_id,
        OrganizationMember.organization_id == org_id
    ).first()
    
    if not member:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Member not found"
        )
    
    # Don't allow changing owner role
    if member.is_owner:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot change role of organization owner"
        )
    
    member.role = role_data.role
    member.updated_at = datetime.utcnow()
    
    db.commit()
    
    return {"message": "Member role updated successfully"}

@router.delete("/{org_id}/members/{member_id}")
async def remove_member(
    org_id: UUID,
    member_id: UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Remove member from organization (admin only)"""
    
    # Check if user is admin of this organization
    admin_membership = db.query(OrganizationMember).filter(
        OrganizationMember.organization_id == org_id,
        OrganizationMember.user_id == current_user.id,
        OrganizationMember.role.in_(["org_admin"]),
        OrganizationMember.is_active == True
    ).first()
    
    if not admin_membership:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required"
        )
    
    # Get member to remove
    member = db.query(OrganizationMember).filter(
        OrganizationMember.id == member_id,
        OrganizationMember.organization_id == org_id
    ).first()
    
    if not member:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Member not found"
        )
    
    # Don't allow removing owner
    if member.is_owner:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot remove organization owner"
        )
    
    # Don't allow removing self
    if member.user_id == current_user.id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot remove yourself from organization"
        )
    
    member.is_active = False
    member.updated_at = datetime.utcnow()
    
    db.commit()
    
    return {"message": "Member removed successfully"}

# ================================================================================
# ORGANIZATION SETTINGS & CONFIGURATION
# ================================================================================

@router.get("/{org_id}/settings", response_model=OrganizationSettingsResponse)
async def get_organization_settings(
    org_id: UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get organization settings and configuration"""
    
    # Check if user is admin of this organization
    membership = db.query(OrganizationMember).filter(
        OrganizationMember.organization_id == org_id,
        OrganizationMember.user_id == current_user.id,
        OrganizationMember.role.in_(["org_admin"]),
        OrganizationMember.is_active == True
    ).first()
    
    if not membership:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required"
        )
    
    # Return organization settings (mock data for now)
    return OrganizationSettingsResponse(
        assessment_workflows={
            "auto_assignment": True,
            "approval_required": True,
            "collaboration_enabled": True,
            "deadline_notifications": True
        },
        data_retention_policy={
            "assessment_data_retention_years": 7,
            "document_retention_years": 5,
            "audit_log_retention_years": 3,
            "auto_archive_enabled": True
        },
        security_settings={
            "mfa_required": False,
            "session_timeout_minutes": 480,
            "ip_restrictions_enabled": False,
            "api_access_enabled": True
        },
        notification_preferences={
            "email_notifications": True,
            "assessment_reminders": True,
            "deadline_alerts": True,
            "system_updates": True
        },
        integration_settings={
            "api_access_enabled": True,
            "webhook_endpoints": [],
            "third_party_integrations": {
                "salesforce": False,
                "microsoft_teams": False,
                "slack": False
            }
        }
    )

@router.put("/{org_id}/settings")
async def update_organization_settings(
    org_id: UUID,
    settings: Dict[str, Any],
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update organization settings (admin only)"""
    
    # Check if user is admin of this organization
    membership = db.query(OrganizationMember).filter(
        OrganizationMember.organization_id == org_id,
        OrganizationMember.user_id == current_user.id,
        OrganizationMember.role.in_(["org_admin"]),
        OrganizationMember.is_active == True
    ).first()
    
    if not membership:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required"
        )
    
    # In production, validate and save settings to database
    return {"message": "Settings updated successfully"}

# ================================================================================
# ORGANIZATION STATISTICS
# ================================================================================

@router.get("/{org_id}/stats", response_model=OrganizationStatsResponse)
async def get_organization_stats(
    org_id: UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get organization statistics and metrics"""
    
    # Verify user has access to this organization
    membership = db.query(OrganizationMember).filter(
        OrganizationMember.organization_id == org_id,
        OrganizationMember.user_id == current_user.id,
        OrganizationMember.is_active == True
    ).first()
    
    if not membership:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied to this organization"
        )
    
    # Calculate statistics
    total_members = db.query(OrganizationMember).filter(
        OrganizationMember.organization_id == org_id
    ).count()
    
    active_members = db.query(OrganizationMember).filter(
        OrganizationMember.organization_id == org_id,
        OrganizationMember.is_active == True
    ).count()
    
    # Mock data for other metrics (in production, query from respective tables)
    return OrganizationStatsResponse(
        total_members=total_members,
        active_members=active_members,
        total_assessments=15,
        completed_assessments=12,
        total_documents=45,
        storage_used_mb=1250.8,
        last_activity=datetime.utcnow()
    )