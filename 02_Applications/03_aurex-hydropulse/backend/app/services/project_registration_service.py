"""
Project Registration Business Logic Service
Core business logic for AWD project registration and management
"""

from sqlalchemy.orm import Session, joinedload
from sqlalchemy import and_, or_, func, desc
from typing import List, Optional, Dict, Any
from datetime import datetime, timedelta
import uuid
import re

from app.models.project_registration import (
    Project, ProjectRegion, ProjectMethodology, ProjectApproval,
    VerificationBody, ProjectValidation, ProjectStatus, MethodologyType
)
from app.schemas.project_registration import (
    ProjectCreate, ProjectUpdate, ProjectResponse, ProjectListResponse,
    ProjectFilters, ProjectValidationResponse, ProjectValidationResult,
    ProjectStats, VVBResponse
)


class ProjectRegistrationService:
    """Service class for project registration operations"""

    def __init__(self, db: Session):
        self.db = db

    async def create_project(self, project_data: ProjectCreate, user_id: uuid.UUID) -> ProjectResponse:
        """Create a new AWD project with validation"""
        
        # Generate unique project ID
        project_id = await self._generate_project_id(project_data.state)
        
        # Create main project record
        project = Project(
            project_id=project_id,
            name=project_data.name,
            description=project_data.description,
            state=project_data.state,
            districts=project_data.districts,
            acreage_target=project_data.acreage_target,
            farmer_target=project_data.farmer_target,
            methodology_type=MethodologyType(project_data.methodology_type),
            methodology_version=project_data.methodology_version,
            vvb_id=project_data.vvb_id,
            start_date=project_data.start_date,
            end_date=project_data.end_date,
            season=project_data.season,
            status=ProjectStatus.DRAFT,
            created_by=user_id
        )
        
        self.db.add(project)
        self.db.flush()  # Get project.id without committing

        # Add project regions
        for region_data in project_data.regions:
            region = ProjectRegion(
                project_id=project.id,
                state=region_data.state,
                district=region_data.district,
                tehsil=region_data.tehsil,
                village=region_data.village,
                boundary_coordinates=region_data.boundary_coordinates,
                estimated_area=region_data.estimated_area
            )
            self.db.add(region)

        # Add methodology configurations
        for method_data in project_data.methodologies:
            methodology = ProjectMethodology(
                project_id=project.id,
                methodology_type=MethodologyType(method_data.methodology_type),
                version=method_data.version,
                parameters=method_data.parameters,
                ch4_emission_factor=method_data.ch4_emission_factor,
                n2o_emission_factor=method_data.n2o_emission_factor,
                baseline_emission_factor=method_data.baseline_emission_factor
            )
            self.db.add(methodology)

        # Run initial validation
        validation_results = await self._validate_project_data(project)
        
        # Store validation results
        for result in validation_results.validations:
            validation = ProjectValidation(
                project_id=project.id,
                validation_type=result.validation_type,
                validation_rule=result.validation_rule,
                validation_status=result.validation_status,
                validation_message=result.validation_message
            )
            self.db.add(validation)

        self.db.commit()
        
        # Return full project with relationships
        return await self.get_project(project.id, user_id)

    async def get_project(self, project_id: uuid.UUID, user_id: uuid.UUID) -> Optional[ProjectResponse]:
        """Get project by ID with all relationships"""
        project = self.db.query(Project).options(
            joinedload(Project.regions),
            joinedload(Project.methodologies),
            joinedload(Project.vvb),
            joinedload(Project.approvals)
        ).filter(Project.id == project_id).first()
        
        if not project:
            return None
        
        return ProjectResponse.from_orm(project)

    async def list_projects(
        self, 
        page: int = 1, 
        page_size: int = 20,
        filters: Optional[ProjectFilters] = None,
        territory_filter: Optional[List[str]] = None,
        user_id: Optional[uuid.UUID] = None
    ) -> ProjectListResponse:
        """List projects with filtering and pagination"""
        
        query = self.db.query(Project).options(
            joinedload(Project.vvb),
            joinedload(Project.regions)
        )

        # Apply filters
        if filters:
            if filters.state:
                query = query.filter(Project.state == filters.state)
            if filters.status:
                query = query.filter(Project.status == filters.status)
            if filters.methodology_type:
                query = query.filter(Project.methodology_type == filters.methodology_type)
            if filters.created_by:
                query = query.filter(Project.created_by == filters.created_by)
            if filters.vvb_id:
                query = query.filter(Project.vvb_id == filters.vvb_id)
            if filters.start_date_from:
                query = query.filter(Project.start_date >= filters.start_date_from)
            if filters.start_date_to:
                query = query.filter(Project.start_date <= filters.start_date_to)

        # Apply territory restrictions
        if territory_filter:
            query = query.filter(Project.state.in_(territory_filter))

        # Get total count
        total_count = query.count()
        
        # Apply pagination
        offset = (page - 1) * page_size
        projects = query.order_by(desc(Project.created_at)).offset(offset).limit(page_size).all()
        
        # Convert to response models
        project_responses = [ProjectResponse.from_orm(p) for p in projects]
        
        return ProjectListResponse(
            projects=project_responses,
            total_count=total_count,
            page=page,
            page_size=page_size,
            total_pages=(total_count + page_size - 1) // page_size
        )

    async def update_project(
        self, 
        project_id: uuid.UUID, 
        project_data: ProjectUpdate, 
        user_id: uuid.UUID
    ) -> ProjectResponse:
        """Update project with validation"""
        
        project = self.db.query(Project).filter(Project.id == project_id).first()
        if not project:
            raise ValueError("Project not found")

        # Update fields
        for field, value in project_data.dict(exclude_unset=True).items():
            setattr(project, field, value)
        
        project.updated_by = user_id
        project.updated_at = datetime.utcnow()
        
        # Re-run validation if critical fields changed
        critical_fields = ['acreage_target', 'farmer_target', 'methodology_type']
        if any(getattr(project_data, field, None) is not None for field in critical_fields):
            validation_results = await self._validate_project_data(project)
            
            # Update validation records
            self.db.query(ProjectValidation).filter(
                ProjectValidation.project_id == project_id
            ).delete()
            
            for result in validation_results.validations:
                validation = ProjectValidation(
                    project_id=project.id,
                    validation_type=result.validation_type,
                    validation_rule=result.validation_rule,
                    validation_status=result.validation_status,
                    validation_message=result.validation_message
                )
                self.db.add(validation)

        self.db.commit()
        
        return await self.get_project(project_id, user_id)

    async def delete_project(self, project_id: uuid.UUID, user_id: uuid.UUID):
        """Soft delete project"""
        project = self.db.query(Project).filter(Project.id == project_id).first()
        if not project:
            raise ValueError("Project not found")
        
        project.status = ProjectStatus.CANCELLED
        project.updated_by = user_id
        project.updated_at = datetime.utcnow()
        
        self.db.commit()

    async def approve_project(
        self,
        project_id: uuid.UUID,
        status: str,
        comments: Optional[str],
        approved_by: uuid.UUID,
        approval_data: Optional[Dict[str, Any]] = None
    ) -> ProjectResponse:
        """Approve or reject project at current level"""
        
        project = self.db.query(Project).filter(Project.id == project_id).first()
        if not project:
            raise ValueError("Project not found")

        current_level = project.approval_level
        
        # Create approval record
        approval = ProjectApproval(
            project_id=project_id,
            approval_level=current_level + 1,
            approved_by=approved_by,
            status=status,
            comments=comments,
            approval_data=approval_data or {}
        )
        self.db.add(approval)
        
        if status == "approved":
            # Move to next approval level
            project.approval_level += 1
            project.approved_by = approved_by
            project.approved_at = datetime.utcnow()
            
            # Update project status based on approval level
            if project.approval_level >= 3:  # Final approval
                project.status = ProjectStatus.APPROVED
            else:
                project.status = ProjectStatus.PENDING_APPROVAL
                
        elif status == "rejected":
            project.status = ProjectStatus.DRAFT
            project.approval_level = 0
        
        self.db.commit()
        
        return await self.get_project(project_id, approved_by)

    async def validate_project(self, project_id: uuid.UUID) -> ProjectValidationResponse:
        """Run comprehensive project validation"""
        
        project = self.db.query(Project).filter(Project.id == project_id).first()
        if not project:
            raise ValueError("Project not found")
        
        validation_results = await self._validate_project_data(project)
        return validation_results

    async def get_project_stats(self, project_id: uuid.UUID) -> ProjectStats:
        """Get project statistics"""
        
        # This would be expanded to include actual project metrics
        # For now, returning basic structure
        stats = ProjectStats(
            total_projects=1,
            active_projects=1 if self.db.query(Project).filter(
                Project.id == project_id,
                Project.status == ProjectStatus.ACTIVE
            ).first() else 0,
            pending_approval=1 if self.db.query(Project).filter(
                Project.id == project_id,
                Project.status == ProjectStatus.PENDING_APPROVAL
            ).first() else 0,
            total_acreage=0.0,
            total_farmers=0,
            by_state={},
            by_status={},
            by_methodology={}
        )
        
        return stats

    async def list_vvbs(
        self, 
        methodology_type: Optional[str] = None,
        region: Optional[str] = None
    ) -> List[VVBResponse]:
        """List available Verification Bodies"""
        
        query = self.db.query(VerificationBody).filter(
            VerificationBody.is_active == True
        )
        
        if methodology_type:
            query = query.filter(
                VerificationBody.methodologies_supported.contains([methodology_type])
            )
        
        if region:
            query = query.filter(
                VerificationBody.regions_covered.contains([region])
            )
        
        vvbs = query.all()
        return [VVBResponse.from_orm(vvb) for vvb in vvbs]

    async def duplicate_project(self, project_id: uuid.UUID, user_id: uuid.UUID) -> ProjectResponse:
        """Create a copy of existing project"""
        
        original = self.db.query(Project).options(
            joinedload(Project.regions),
            joinedload(Project.methodologies)
        ).filter(Project.id == project_id).first()
        
        if not original:
            raise ValueError("Project not found")
        
        # Generate new project ID
        new_project_id = await self._generate_project_id(original.state)
        
        # Create duplicate project
        duplicate = Project(
            project_id=new_project_id,
            name=f"{original.name} (Copy)",
            description=original.description,
            state=original.state,
            districts=original.districts,
            acreage_target=original.acreage_target,
            farmer_target=original.farmer_target,
            methodology_type=original.methodology_type,
            methodology_version=original.methodology_version,
            start_date=original.start_date,
            end_date=original.end_date,
            season=original.season,
            status=ProjectStatus.DRAFT,
            created_by=user_id
        )
        
        self.db.add(duplicate)
        self.db.flush()
        
        # Duplicate regions
        for region in original.regions:
            new_region = ProjectRegion(
                project_id=duplicate.id,
                state=region.state,
                district=region.district,
                tehsil=region.tehsil,
                village=region.village,
                boundary_coordinates=region.boundary_coordinates,
                estimated_area=region.estimated_area
            )
            self.db.add(new_region)
        
        # Duplicate methodologies
        for methodology in original.methodologies:
            new_methodology = ProjectMethodology(
                project_id=duplicate.id,
                methodology_type=methodology.methodology_type,
                version=methodology.version,
                parameters=methodology.parameters,
                ch4_emission_factor=methodology.ch4_emission_factor,
                n2o_emission_factor=methodology.n2o_emission_factor,
                baseline_emission_factor=methodology.baseline_emission_factor
            )
            self.db.add(new_methodology)
        
        self.db.commit()
        
        return await self.get_project(duplicate.id, user_id)

    async def get_dashboard_overview(
        self,
        user_id: uuid.UUID,
        territory_filter: Optional[List[str]] = None
    ) -> Dict[str, Any]:
        """Get dashboard overview statistics"""
        
        query = self.db.query(Project)
        
        if territory_filter:
            query = query.filter(Project.state.in_(territory_filter))
        
        total_projects = query.count()
        active_projects = query.filter(Project.status == ProjectStatus.ACTIVE).count()
        pending_approval = query.filter(Project.status == ProjectStatus.PENDING_APPROVAL).count()
        
        # Aggregate targets
        targets = query.with_entities(
            func.sum(Project.acreage_target).label('total_acreage'),
            func.sum(Project.farmer_target).label('total_farmers')
        ).first()
        
        return {
            "total_projects": total_projects,
            "active_projects": active_projects,
            "pending_approval": pending_approval,
            "total_acreage_target": float(targets.total_acreage or 0),
            "total_farmer_target": int(targets.total_farmers or 0),
            "last_updated": datetime.utcnow()
        }

    async def _generate_project_id(self, state: str) -> str:
        """Generate unique human-readable project ID"""
        
        # State abbreviations
        state_codes = {
            'Maharashtra': 'MH',
            'Chhattisgarh': 'CG', 
            'Andhra Pradesh': 'AP'
        }
        
        state_code = state_codes.get(state, 'XX')
        year = datetime.now().year
        
        # Find next sequence number for this state and year
        pattern = f"AWD-{state_code}-{year}-%"
        last_project = self.db.query(Project).filter(
            Project.project_id.like(pattern)
        ).order_by(desc(Project.project_id)).first()
        
        if last_project:
            # Extract sequence number and increment
            match = re.search(r'-(\d+)$', last_project.project_id)
            sequence = int(match.group(1)) + 1 if match else 1
        else:
            sequence = 1
        
        return f"AWD-{state_code}-{year}-{sequence:03d}"

    async def _validate_project_data(self, project: Project) -> ProjectValidationResponse:
        """Run comprehensive validation on project data"""
        
        validations = []
        overall_valid = True
        
        # Region validation
        allowed_states = ['Maharashtra', 'Chhattisgarh', 'Andhra Pradesh']
        if project.state not in allowed_states:
            validations.append(ProjectValidationResult(
                validation_type="region",
                validation_rule="state_allowed",
                validation_status="failed",
                validation_message=f"State must be one of: {', '.join(allowed_states)}"
            ))
            overall_valid = False
        else:
            validations.append(ProjectValidationResult(
                validation_type="region",
                validation_rule="state_allowed",
                validation_status="passed",
                validation_message="State is in approved regions"
            ))
        
        # Acreage validation
        if project.acreage_target < 100:
            validations.append(ProjectValidationResult(
                validation_type="acreage",
                validation_rule="minimum_area",
                validation_status="failed",
                validation_message="Minimum acreage target is 100 hectares"
            ))
            overall_valid = False
        else:
            validations.append(ProjectValidationResult(
                validation_type="acreage",
                validation_rule="minimum_area",
                validation_status="passed",
                validation_message="Acreage target meets minimum requirements"
            ))
        
        # Farmer validation
        if project.farmer_target < 50:
            validations.append(ProjectValidationResult(
                validation_type="farmers",
                validation_rule="minimum_farmers",
                validation_status="failed",
                validation_message="Minimum farmer target is 50 farmers"
            ))
            overall_valid = False
        else:
            validations.append(ProjectValidationResult(
                validation_type="farmers",
                validation_rule="minimum_farmers",
                validation_status="passed",
                validation_message="Farmer target meets minimum requirements"
            ))
        
        # Timeline validation
        if project.end_date <= project.start_date:
            validations.append(ProjectValidationResult(
                validation_type="timeline",
                validation_rule="end_after_start",
                validation_status="failed",
                validation_message="End date must be after start date"
            ))
            overall_valid = False
        else:
            validations.append(ProjectValidationResult(
                validation_type="timeline",
                validation_rule="end_after_start",
                validation_status="passed",
                validation_message="Timeline is valid"
            ))
        
        return ProjectValidationResponse(
            project_id=project.id,
            overall_status="valid" if overall_valid else "invalid",
            validations=validations,
            validated_at=datetime.utcnow(),
            can_proceed=overall_valid
        )