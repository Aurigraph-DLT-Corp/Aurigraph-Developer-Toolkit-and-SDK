"""
Project Registration Pydantic Schemas
API request/response models for project registration
"""

from pydantic import BaseModel, Field, validator
from typing import Optional, List, Dict, Any
from datetime import datetime
from enum import Enum
import uuid


class ProjectStatusEnum(str, Enum):
    DRAFT = "draft"
    PENDING_APPROVAL = "pending_approval"
    APPROVED = "approved"
    ACTIVE = "active"
    COMPLETED = "completed"
    CANCELLED = "cancelled"


class MethodologyTypeEnum(str, Enum):
    VERRA_VM0042 = "verra_vm0042"
    GOLD_STANDARD = "gold_standard"
    VMD0051 = "vmd0051"
    CUSTOM = "custom"


class ProjectRegionCreate(BaseModel):
    """Schema for creating project region"""
    state: str = Field(..., min_length=2, max_length=100)
    district: str = Field(..., min_length=2, max_length=100)
    tehsil: Optional[str] = Field(None, max_length=100)
    village: Optional[str] = Field(None, max_length=100)
    boundary_coordinates: Optional[Dict[str, Any]] = None  # GeoJSON
    estimated_area: Optional[float] = Field(None, ge=0)

    @validator('state')
    def validate_state(cls, v):
        allowed_states = ['Maharashtra', 'Chhattisgarh', 'Andhra Pradesh']
        if v not in allowed_states:
            raise ValueError(f'State must be one of: {", ".join(allowed_states)}')
        return v


class ProjectMethodologyCreate(BaseModel):
    """Schema for methodology configuration"""
    methodology_type: MethodologyTypeEnum
    version: str = Field(..., min_length=1, max_length=20)
    parameters: Optional[Dict[str, Any]] = {}
    ch4_emission_factor: Optional[float] = Field(None, ge=0)
    n2o_emission_factor: Optional[float] = Field(None, ge=0)
    baseline_emission_factor: Optional[float] = Field(None, ge=0)


class ProjectCreate(BaseModel):
    """Schema for creating a new project"""
    name: str = Field(..., min_length=3, max_length=255)
    description: Optional[str] = Field(None, max_length=2000)
    
    # Geographic Information
    state: str = Field(..., min_length=2, max_length=100)
    districts: List[str] = Field(..., min_items=1, max_items=10)
    
    # Project Targets
    acreage_target: float = Field(..., ge=100.0, description="Must be at least 100 hectares")
    farmer_target: int = Field(..., ge=50, description="Must be at least 50 farmers")
    
    # Methodology
    methodology_type: MethodologyTypeEnum
    methodology_version: str = Field(..., min_length=1, max_length=20)
    
    # VVB Assignment
    vvb_id: Optional[uuid.UUID] = None
    
    # Timeline
    start_date: datetime
    end_date: datetime
    season: Optional[str] = Field(None, max_length=50)
    
    # Regional breakdown
    regions: List[ProjectRegionCreate] = Field(default_factory=list)
    methodologies: List[ProjectMethodologyCreate] = Field(default_factory=list)

    @validator('end_date')
    def validate_end_date(cls, v, values):
        if 'start_date' in values and v <= values['start_date']:
            raise ValueError('End date must be after start date')
        return v

    @validator('state')
    def validate_state(cls, v):
        allowed_states = ['Maharashtra', 'Chhattisgarh', 'Andhra Pradesh']
        if v not in allowed_states:
            raise ValueError(f'State must be one of: {", ".join(allowed_states)}')
        return v

    @validator('districts')
    def validate_districts(cls, v, values):
        if 'state' in values:
            # State-specific district validation could be added here
            pass
        return v


class ProjectUpdate(BaseModel):
    """Schema for updating an existing project"""
    name: Optional[str] = Field(None, min_length=3, max_length=255)
    description: Optional[str] = Field(None, max_length=2000)
    acreage_target: Optional[float] = Field(None, ge=100.0)
    farmer_target: Optional[int] = Field(None, ge=50)
    vvb_id: Optional[uuid.UUID] = None
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None
    season: Optional[str] = Field(None, max_length=50)


class ProjectRegionResponse(BaseModel):
    """Schema for project region response"""
    id: uuid.UUID
    state: str
    district: str
    tehsil: Optional[str]
    village: Optional[str]
    boundary_coordinates: Optional[Dict[str, Any]]
    estimated_area: Optional[float]
    created_at: datetime

    class Config:
        from_attributes = True


class ProjectMethodologyResponse(BaseModel):
    """Schema for methodology response"""
    id: uuid.UUID
    methodology_type: MethodologyTypeEnum
    version: str
    parameters: Optional[Dict[str, Any]]
    ch4_emission_factor: Optional[float]
    n2o_emission_factor: Optional[float]
    baseline_emission_factor: Optional[float]
    created_at: datetime

    class Config:
        from_attributes = True


class VVBResponse(BaseModel):
    """Schema for VVB response"""
    id: uuid.UUID
    name: str
    organization: str
    email: Optional[str]
    accreditation_body: Optional[str]
    methodologies_supported: Optional[List[str]]
    regions_covered: Optional[List[str]]

    class Config:
        from_attributes = True


class ProjectResponse(BaseModel):
    """Schema for project response"""
    id: uuid.UUID
    project_id: str
    name: str
    description: Optional[str]
    
    # Geographic
    state: str
    districts: Optional[List[str]]
    
    # Targets
    acreage_target: float
    farmer_target: int
    
    # Methodology
    methodology_type: MethodologyTypeEnum
    methodology_version: str
    
    # VVB
    vvb_id: Optional[uuid.UUID]
    vvb: Optional[VVBResponse]
    
    # Timeline
    start_date: datetime
    end_date: datetime
    season: Optional[str]
    
    # Status
    status: ProjectStatusEnum
    approval_level: int
    
    # Audit
    created_by: uuid.UUID
    created_at: datetime
    updated_at: Optional[datetime]
    approved_by: Optional[uuid.UUID]
    approved_at: Optional[datetime]
    
    # Related data
    regions: List[ProjectRegionResponse] = []
    methodologies: List[ProjectMethodologyResponse] = []

    class Config:
        from_attributes = True


class ProjectListResponse(BaseModel):
    """Schema for project list with pagination"""
    projects: List[ProjectResponse]
    total_count: int
    page: int
    page_size: int
    total_pages: int


class ProjectFilters(BaseModel):
    """Schema for project filtering"""
    state: Optional[str] = None
    status: Optional[ProjectStatusEnum] = None
    methodology_type: Optional[MethodologyTypeEnum] = None
    created_by: Optional[uuid.UUID] = None
    vvb_id: Optional[uuid.UUID] = None
    start_date_from: Optional[datetime] = None
    start_date_to: Optional[datetime] = None


class ProjectApprovalRequest(BaseModel):
    """Schema for project approval"""
    status: str = Field(..., pattern="^(approved|rejected)$")
    comments: Optional[str] = Field(None, max_length=1000)
    approval_data: Optional[Dict[str, Any]] = {}


class ProjectValidationResult(BaseModel):
    """Schema for validation results"""
    validation_type: str
    validation_rule: str
    validation_status: str  # passed, failed, warning
    validation_message: str
    details: Optional[Dict[str, Any]] = {}


class ProjectValidationResponse(BaseModel):
    """Schema for complete project validation"""
    project_id: uuid.UUID
    overall_status: str  # valid, invalid, warnings
    validations: List[ProjectValidationResult]
    validated_at: datetime
    can_proceed: bool


class ProjectStats(BaseModel):
    """Schema for project statistics"""
    total_projects: int
    active_projects: int
    pending_approval: int
    total_acreage: float
    total_farmers: int
    by_state: Dict[str, int]
    by_status: Dict[str, int]
    by_methodology: Dict[str, int]