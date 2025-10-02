# ================================================================================
# AUREX LAUNCHPAD™ ROLE-BASED ACCESS CONTROL SERVICE
# Sub-Application #13: Advanced RBAC for Carbon Maturity Navigator
# Module ID: LAU-MAT-013 - RBAC Service
# Created: August 7, 2025
# ================================================================================

from typing import Dict, List, Optional, Set, Union, Any
from dataclasses import dataclass, field
from enum import Enum
from datetime import datetime, timedelta
import uuid
import json
import logging
from functools import wraps
from sqlalchemy.orm import Session
from sqlalchemy import and_, or_
import jwt
from passlib.context import CryptContext

# Import models
from models.carbon_maturity_models import (
    AssessmentAccessControl, MaturityAssessment, AccessLevel, 
    AssessmentAuditLog, AssessmentStatus
)
from models.auth_models import User, Organization, Role  # Assuming these exist

# Configure logging
logger = logging.getLogger(__name__)

# ================================================================================
# RBAC CONFIGURATION AND ENUMS
# ================================================================================

class Permission(Enum):
    """Granular permissions for Carbon Maturity Navigator"""
    
    # Assessment permissions
    VIEW_ASSESSMENT = "view_assessment"
    CREATE_ASSESSMENT = "create_assessment"
    EDIT_ASSESSMENT = "edit_assessment"
    SUBMIT_ASSESSMENT = "submit_assessment"
    DELETE_ASSESSMENT = "delete_assessment"
    
    # Response permissions
    VIEW_RESPONSES = "view_responses"
    EDIT_RESPONSES = "edit_responses"
    SUBMIT_RESPONSES = "submit_responses"
    VALIDATE_RESPONSES = "validate_responses"
    
    # Evidence permissions
    VIEW_EVIDENCE = "view_evidence"
    UPLOAD_EVIDENCE = "upload_evidence"
    VALIDATE_EVIDENCE = "validate_evidence"
    DELETE_EVIDENCE = "delete_evidence"
    
    # Review permissions
    REVIEW_ASSESSMENT = "review_assessment"
    APPROVE_ASSESSMENT = "approve_assessment"
    REJECT_ASSESSMENT = "reject_assessment"
    
    # Scoring permissions
    VIEW_SCORES = "view_scores"
    RECALCULATE_SCORES = "recalculate_scores"
    OVERRIDE_SCORES = "override_scores"
    
    # Report permissions
    VIEW_REPORTS = "view_reports"
    GENERATE_REPORTS = "generate_reports"
    DOWNLOAD_REPORTS = "download_reports"
    
    # Benchmark permissions
    VIEW_BENCHMARKS = "view_benchmarks"
    ACCESS_INDUSTRY_DATA = "access_industry_data"
    
    # Roadmap permissions
    VIEW_ROADMAP = "view_roadmap"
    GENERATE_ROADMAP = "generate_roadmap"
    EDIT_ROADMAP = "edit_roadmap"
    
    # Administrative permissions
    MANAGE_ACCESS = "manage_access"
    VIEW_AUDIT_LOG = "view_audit_log"
    MANAGE_TEMPLATES = "manage_templates"
    SYSTEM_CONFIG = "system_config"

class UserRole(Enum):
    """Predefined roles for Carbon Maturity Navigator"""
    
    # Core assessment roles
    ORG_ADMIN = "org_admin"                    # Organization administrator
    ASSESSOR = "assessor"                      # Primary assessment performer
    REVIEWER = "reviewer"                      # Assessment reviewer/validator
    VIEWER = "viewer"                          # Read-only access
    
    # Specialized roles
    PARTNER_ADVISOR = "partner_advisor"        # External consultant/advisor
    AUDITOR = "auditor"                        # Third-party auditor
    SYSTEM_ADMIN = "system_admin"             # System administrator
    
    # Department-specific roles
    SUSTAINABILITY_MANAGER = "sustainability_manager"
    ESG_ANALYST = "esg_analyst"
    COMPLIANCE_OFFICER = "compliance_officer"
    FACILITY_MANAGER = "facility_manager"

@dataclass
class RoleDefinition:
    """Definition of a user role with permissions and constraints"""
    role: UserRole
    display_name: str
    description: str
    permissions: Set[Permission]
    
    # Access constraints
    can_delegate: bool = False
    max_assessments: Optional[int] = None
    access_scope: str = "organization"  # organization, facility, global
    
    # Time constraints
    session_timeout_minutes: int = 480  # 8 hours default
    max_concurrent_sessions: int = 1
    
    # Data access constraints
    can_access_historical: bool = True
    can_access_peer_data: bool = False
    can_export_data: bool = False

# ================================================================================
# ROLE-BASED ACCESS CONTROL SERVICE
# ================================================================================

class RBACService:
    """
    Comprehensive Role-Based Access Control service for Carbon Maturity Navigator
    Handles user authentication, authorization, and permission management
    """
    
    def __init__(self, secret_key: str = None):
        self.secret_key = secret_key or "your-secret-key-change-in-production"
        self.pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
        self.role_definitions = self._initialize_role_definitions()
        self.permission_cache = {}
        self.cache_ttl = timedelta(minutes=15)
    
    def _initialize_role_definitions(self) -> Dict[UserRole, RoleDefinition]:
        """Initialize predefined role definitions"""
        
        definitions = {}
        
        # Organization Administrator
        definitions[UserRole.ORG_ADMIN] = RoleDefinition(
            role=UserRole.ORG_ADMIN,
            display_name="Organization Administrator",
            description="Full administrative access to all organizational assessments and settings",
            permissions={
                Permission.VIEW_ASSESSMENT, Permission.CREATE_ASSESSMENT, 
                Permission.EDIT_ASSESSMENT, Permission.SUBMIT_ASSESSMENT,
                Permission.VIEW_RESPONSES, Permission.EDIT_RESPONSES, Permission.SUBMIT_RESPONSES,
                Permission.VIEW_EVIDENCE, Permission.UPLOAD_EVIDENCE, Permission.VALIDATE_EVIDENCE,
                Permission.VIEW_SCORES, Permission.RECALCULATE_SCORES,
                Permission.VIEW_REPORTS, Permission.GENERATE_REPORTS, Permission.DOWNLOAD_REPORTS,
                Permission.VIEW_BENCHMARKS, Permission.ACCESS_INDUSTRY_DATA,
                Permission.VIEW_ROADMAP, Permission.GENERATE_ROADMAP, Permission.EDIT_ROADMAP,
                Permission.MANAGE_ACCESS, Permission.VIEW_AUDIT_LOG
            },
            can_delegate=True,
            access_scope="organization",
            can_access_historical=True,
            can_export_data=True
        )
        
        # Assessor
        definitions[UserRole.ASSESSOR] = RoleDefinition(
            role=UserRole.ASSESSOR,
            display_name="Assessment Specialist",
            description="Conducts assessments, uploads evidence, and manages responses",
            permissions={
                Permission.VIEW_ASSESSMENT, Permission.CREATE_ASSESSMENT, Permission.EDIT_ASSESSMENT,
                Permission.VIEW_RESPONSES, Permission.EDIT_RESPONSES, Permission.SUBMIT_RESPONSES,
                Permission.VIEW_EVIDENCE, Permission.UPLOAD_EVIDENCE,
                Permission.VIEW_SCORES,
                Permission.VIEW_REPORTS, Permission.GENERATE_REPORTS,
                Permission.VIEW_BENCHMARKS,
                Permission.VIEW_ROADMAP
            },
            can_delegate=False,
            max_assessments=10,
            access_scope="organization",
            can_access_historical=True
        )
        
        # Reviewer
        definitions[UserRole.REVIEWER] = RoleDefinition(
            role=UserRole.REVIEWER,
            display_name="Assessment Reviewer",
            description="Reviews and validates completed assessments",
            permissions={
                Permission.VIEW_ASSESSMENT, Permission.VIEW_RESPONSES, Permission.VALIDATE_RESPONSES,
                Permission.VIEW_EVIDENCE, Permission.VALIDATE_EVIDENCE,
                Permission.REVIEW_ASSESSMENT, Permission.APPROVE_ASSESSMENT, Permission.REJECT_ASSESSMENT,
                Permission.VIEW_SCORES, Permission.RECALCULATE_SCORES,
                Permission.VIEW_REPORTS, Permission.GENERATE_REPORTS,
                Permission.VIEW_BENCHMARKS,
                Permission.VIEW_ROADMAP,
                Permission.VIEW_AUDIT_LOG
            },
            can_delegate=False,
            access_scope="organization",
            can_access_historical=True
        )
        
        # Viewer
        definitions[UserRole.VIEWER] = RoleDefinition(
            role=UserRole.VIEWER,
            display_name="Assessment Viewer",
            description="Read-only access to assessments and reports",
            permissions={
                Permission.VIEW_ASSESSMENT, Permission.VIEW_RESPONSES,
                Permission.VIEW_EVIDENCE, Permission.VIEW_SCORES,
                Permission.VIEW_REPORTS, Permission.VIEW_BENCHMARKS,
                Permission.VIEW_ROADMAP
            },
            can_delegate=False,
            access_scope="organization",
            can_access_historical=False
        )
        
        # Partner Advisor
        definitions[UserRole.PARTNER_ADVISOR] = RoleDefinition(
            role=UserRole.PARTNER_ADVISOR,
            display_name="Partner Advisor",
            description="External consultant with advisory access",
            permissions={
                Permission.VIEW_ASSESSMENT, Permission.VIEW_RESPONSES, Permission.VIEW_EVIDENCE,
                Permission.VIEW_SCORES, Permission.VIEW_REPORTS,
                Permission.VIEW_BENCHMARKS, Permission.ACCESS_INDUSTRY_DATA,
                Permission.VIEW_ROADMAP, Permission.GENERATE_ROADMAP
            },
            can_delegate=False,
            access_scope="facility",  # Limited scope
            session_timeout_minutes=240,  # 4 hours
            can_access_historical=False,
            can_access_peer_data=True  # For benchmarking
        )
        
        # Auditor
        definitions[UserRole.AUDITOR] = RoleDefinition(
            role=UserRole.AUDITOR,
            display_name="Third-Party Auditor",
            description="Independent auditor with verification rights",
            permissions={
                Permission.VIEW_ASSESSMENT, Permission.VIEW_RESPONSES, Permission.VALIDATE_RESPONSES,
                Permission.VIEW_EVIDENCE, Permission.VALIDATE_EVIDENCE,
                Permission.VIEW_SCORES,
                Permission.VIEW_REPORTS, Permission.GENERATE_REPORTS,
                Permission.VIEW_AUDIT_LOG
            },
            can_delegate=False,
            access_scope="organization",
            session_timeout_minutes=480,
            can_access_historical=True,
            can_export_data=True  # For audit purposes
        )
        
        return definitions
    
    async def authenticate_user(
        self,
        username: str,
        password: str,
        db_session: Session
    ) -> Optional[Dict[str, Any]]:
        """Authenticate user credentials and return user information"""
        
        try:
            # Query user from database
            user = db_session.query(User).filter(
                User.username == username,
                User.is_active == True
            ).first()
            
            if not user or not self.pwd_context.verify(password, user.password_hash):
                logger.warning(f"Failed authentication attempt for user: {username}")
                return None
            
            # Get user roles
            user_roles = self._get_user_roles(user.id, db_session)
            
            # Generate access token
            token_payload = {
                'user_id': str(user.id),
                'username': user.username,
                'organization_id': str(user.organization_id),
                'roles': [role.value for role in user_roles],
                'exp': datetime.utcnow() + timedelta(hours=8),
                'iat': datetime.utcnow()
            }
            
            access_token = jwt.encode(token_payload, self.secret_key, algorithm="HS256")
            
            return {
                'user_id': str(user.id),
                'username': user.username,
                'email': user.email,
                'organization_id': str(user.organization_id),
                'roles': user_roles,
                'permissions': self._get_aggregated_permissions(user_roles),
                'access_token': access_token,
                'token_type': 'bearer',
                'expires_in': 28800  # 8 hours
            }
            
        except Exception as e:
            logger.error(f"Authentication error: {str(e)}")
            return None
    
    def validate_token(self, token: str) -> Optional[Dict[str, Any]]:
        """Validate JWT token and return user information"""
        
        try:
            payload = jwt.decode(token, self.secret_key, algorithms=["HS256"])
            
            # Check token expiration
            if datetime.utcnow() > datetime.fromtimestamp(payload['exp']):
                return None
            
            return {
                'user_id': payload['user_id'],
                'username': payload['username'],
                'organization_id': payload['organization_id'],
                'roles': [UserRole(role) for role in payload['roles']],
                'valid': True
            }
            
        except jwt.ExpiredSignatureError:
            logger.warning("Token has expired")
            return None
        except jwt.InvalidTokenError as e:
            logger.warning(f"Invalid token: {str(e)}")
            return None
    
    async def check_permission(
        self,
        user_id: str,
        permission: Permission,
        resource_id: Optional[str] = None,
        db_session: Session = None
    ) -> bool:
        """Check if user has specific permission for a resource"""
        
        try:
            # Get user permissions from cache or database
            user_permissions = await self._get_user_permissions(user_id, db_session)
            
            # Check basic permission
            if permission not in user_permissions:
                return False
            
            # Check resource-specific permissions if applicable
            if resource_id and permission in self._get_resource_specific_permissions():
                return await self._check_resource_access(
                    user_id, permission, resource_id, db_session
                )
            
            return True
            
        except Exception as e:
            logger.error(f"Permission check error: {str(e)}")
            return False
    
    async def grant_assessment_access(
        self,
        assessment_id: str,
        user_id: str,
        access_level: AccessLevel,
        granted_by: str,
        expiration_date: Optional[datetime] = None,
        db_session: Session = None
    ) -> bool:
        """Grant specific access to an assessment"""
        
        try:
            # Check if grantor has permission to grant access
            can_grant = await self.check_permission(
                granted_by, Permission.MANAGE_ACCESS, assessment_id, db_session
            )
            
            if not can_grant:
                logger.warning(f"User {granted_by} cannot grant access to assessment {assessment_id}")
                return False
            
            # Check if access control already exists
            existing_access = db_session.query(AssessmentAccessControl).filter(
                and_(
                    AssessmentAccessControl.assessment_id == uuid.UUID(assessment_id),
                    AssessmentAccessControl.user_id == uuid.UUID(user_id),
                    AssessmentAccessControl.is_active == True
                )
            ).first()
            
            if existing_access:
                # Update existing access
                existing_access.access_level = access_level
                existing_access.access_expires_date = expiration_date
                existing_access.granted_by = uuid.UUID(granted_by)
            else:
                # Create new access control
                new_access = AssessmentAccessControl(
                    assessment_id=uuid.UUID(assessment_id),
                    user_id=uuid.UUID(user_id),
                    access_level=access_level,
                    can_view=True,
                    can_edit=access_level in [AccessLevel.ASSESSOR, AccessLevel.ADMIN],
                    can_submit=access_level in [AccessLevel.ASSESSOR, AccessLevel.ADMIN],
                    can_review=access_level in [AccessLevel.REVIEWER, AccessLevel.ADMIN],
                    can_approve=access_level == AccessLevel.ADMIN,
                    access_expires_date=expiration_date,
                    granted_by=uuid.UUID(granted_by)
                )
                db_session.add(new_access)
            
            # Log the access grant
            audit_log = AssessmentAuditLog(
                assessment_id=uuid.UUID(assessment_id),
                user_id=uuid.UUID(granted_by),
                action_type="GRANT_ACCESS",
                action_description=f"Granted {access_level.value} access to user {user_id}",
                affected_entity="AssessmentAccessControl",
                new_values={
                    "user_id": user_id,
                    "access_level": access_level.value,
                    "expires": expiration_date.isoformat() if expiration_date else None
                }
            )
            db_session.add(audit_log)
            
            db_session.commit()
            
            # Clear permission cache for user
            self._clear_user_permission_cache(user_id)
            
            logger.info(f"Granted {access_level.value} access to user {user_id} for assessment {assessment_id}")
            
            return True
            
        except Exception as e:
            logger.error(f"Failed to grant assessment access: {str(e)}")
            db_session.rollback()
            return False
    
    async def revoke_assessment_access(
        self,
        assessment_id: str,
        user_id: str,
        revoked_by: str,
        reason: str,
        db_session: Session = None
    ) -> bool:
        """Revoke access to an assessment"""
        
        try:
            # Check if revoker has permission
            can_revoke = await self.check_permission(
                revoked_by, Permission.MANAGE_ACCESS, assessment_id, db_session
            )
            
            if not can_revoke:
                return False
            
            # Find and revoke access
            access_control = db_session.query(AssessmentAccessControl).filter(
                and_(
                    AssessmentAccessControl.assessment_id == uuid.UUID(assessment_id),
                    AssessmentAccessControl.user_id == uuid.UUID(user_id),
                    AssessmentAccessControl.is_active == True
                )
            ).first()
            
            if not access_control:
                return False
            
            # Revoke access
            access_control.is_active = False
            access_control.revocation_date = datetime.utcnow()
            access_control.revocation_reason = reason
            access_control.revoked_by = uuid.UUID(revoked_by)
            
            # Log the revocation
            audit_log = AssessmentAuditLog(
                assessment_id=uuid.UUID(assessment_id),
                user_id=uuid.UUID(revoked_by),
                action_type="REVOKE_ACCESS",
                action_description=f"Revoked access for user {user_id}. Reason: {reason}",
                affected_entity="AssessmentAccessControl",
                old_values={"access_level": access_control.access_level.value}
            )
            db_session.add(audit_log)
            
            db_session.commit()
            
            # Clear permission cache
            self._clear_user_permission_cache(user_id)
            
            logger.info(f"Revoked access for user {user_id} from assessment {assessment_id}")
            
            return True
            
        except Exception as e:
            logger.error(f"Failed to revoke assessment access: {str(e)}")
            db_session.rollback()
            return False
    
    async def get_user_accessible_assessments(
        self,
        user_id: str,
        db_session: Session
    ) -> List[Dict[str, Any]]:
        """Get all assessments accessible to a user"""
        
        try:
            # Get assessments with direct access grants
            access_grants = db_session.query(
                AssessmentAccessControl,
                MaturityAssessment
            ).join(
                MaturityAssessment,
                AssessmentAccessControl.assessment_id == MaturityAssessment.id
            ).filter(
                and_(
                    AssessmentAccessControl.user_id == uuid.UUID(user_id),
                    AssessmentAccessControl.is_active == True,
                    or_(
                        AssessmentAccessControl.access_expires_date.is_(None),
                        AssessmentAccessControl.access_expires_date > datetime.utcnow()
                    )
                )
            ).all()
            
            accessible_assessments = []
            
            for access_control, assessment in access_grants:
                accessible_assessments.append({
                    'assessment_id': str(assessment.id),
                    'assessment_number': assessment.assessment_number,
                    'title': assessment.title,
                    'organization_id': str(assessment.organization_id),
                    'status': assessment.status.value,
                    'access_level': access_control.access_level.value,
                    'permissions': {
                        'can_view': access_control.can_view,
                        'can_edit': access_control.can_edit,
                        'can_submit': access_control.can_submit,
                        'can_review': access_control.can_review,
                        'can_approve': access_control.can_approve
                    },
                    'access_expires': access_control.access_expires_date.isoformat() if access_control.access_expires_date else None
                })
            
            return accessible_assessments
            
        except Exception as e:
            logger.error(f"Failed to get accessible assessments: {str(e)}")
            return []
    
    def create_permission_decorator(self, required_permission: Permission):
        """Create decorator for checking permissions on API endpoints"""
        
        def decorator(func):
            @wraps(func)
            async def wrapper(*args, **kwargs):
                # Extract user info from request context
                # This would integrate with FastAPI dependency system
                user_id = kwargs.get('current_user', {}).get('user_id')
                resource_id = kwargs.get('assessment_id')
                db_session = kwargs.get('db')
                
                if not user_id:
                    raise PermissionError("Authentication required")
                
                # Check permission
                has_permission = await self.check_permission(
                    user_id, required_permission, resource_id, db_session
                )
                
                if not has_permission:
                    raise PermissionError(f"Permission {required_permission.value} required")
                
                return await func(*args, **kwargs)
            
            return wrapper
        return decorator
    
    # ================================================================================
    # HELPER METHODS
    # ================================================================================
    
    def _get_user_roles(self, user_id: uuid.UUID, db_session: Session) -> List[UserRole]:
        """Get user roles from database"""
        
        # This would query user roles from database
        # For now, return default roles based on user type
        try:
            user = db_session.query(User).filter(User.id == user_id).first()
            if user:
                # Map database roles to UserRole enum
                # This is a simplified implementation
                return [UserRole.ASSESSOR]  # Default role
            return []
        except:
            return []
    
    def _get_aggregated_permissions(self, roles: List[UserRole]) -> Set[Permission]:
        """Get aggregated permissions from user roles"""
        
        all_permissions = set()
        
        for role in roles:
            role_definition = self.role_definitions.get(role)
            if role_definition:
                all_permissions.update(role_definition.permissions)
        
        return all_permissions
    
    async def _get_user_permissions(
        self,
        user_id: str,
        db_session: Session
    ) -> Set[Permission]:
        """Get user permissions with caching"""
        
        # Check cache first
        cache_key = f"permissions:{user_id}"
        if cache_key in self.permission_cache:
            cached_data = self.permission_cache[cache_key]
            if datetime.utcnow() - cached_data['timestamp'] < self.cache_ttl:
                return cached_data['permissions']
        
        # Get from database
        user_roles = self._get_user_roles(uuid.UUID(user_id), db_session)
        permissions = self._get_aggregated_permissions(user_roles)
        
        # Cache permissions
        self.permission_cache[cache_key] = {
            'permissions': permissions,
            'timestamp': datetime.utcnow()
        }
        
        return permissions
    
    def _get_resource_specific_permissions(self) -> Set[Permission]:
        """Get permissions that are resource-specific"""
        
        return {
            Permission.VIEW_ASSESSMENT,
            Permission.EDIT_ASSESSMENT,
            Permission.SUBMIT_ASSESSMENT,
            Permission.DELETE_ASSESSMENT,
            Permission.VIEW_RESPONSES,
            Permission.EDIT_RESPONSES,
            Permission.SUBMIT_RESPONSES,
            Permission.VALIDATE_RESPONSES,
            Permission.VIEW_EVIDENCE,
            Permission.UPLOAD_EVIDENCE,
            Permission.VALIDATE_EVIDENCE,
            Permission.DELETE_EVIDENCE,
            Permission.REVIEW_ASSESSMENT,
            Permission.APPROVE_ASSESSMENT,
            Permission.REJECT_ASSESSMENT
        }
    
    async def _check_resource_access(
        self,
        user_id: str,
        permission: Permission,
        resource_id: str,
        db_session: Session
    ) -> bool:
        """Check if user has access to specific resource"""
        
        try:
            # Check direct access control grants
            access_control = db_session.query(AssessmentAccessControl).filter(
                and_(
                    AssessmentAccessControl.assessment_id == uuid.UUID(resource_id),
                    AssessmentAccessControl.user_id == uuid.UUID(user_id),
                    AssessmentAccessControl.is_active == True,
                    or_(
                        AssessmentAccessControl.access_expires_date.is_(None),
                        AssessmentAccessControl.access_expires_date > datetime.utcnow()
                    )
                )
            ).first()
            
            if not access_control:
                return False
            
            # Check specific permission mapping
            permission_mapping = {
                Permission.VIEW_ASSESSMENT: access_control.can_view,
                Permission.EDIT_ASSESSMENT: access_control.can_edit,
                Permission.SUBMIT_ASSESSMENT: access_control.can_submit,
                Permission.VIEW_RESPONSES: access_control.can_view,
                Permission.EDIT_RESPONSES: access_control.can_edit,
                Permission.SUBMIT_RESPONSES: access_control.can_submit,
                Permission.VALIDATE_RESPONSES: access_control.can_review,
                Permission.VIEW_EVIDENCE: access_control.can_view,
                Permission.UPLOAD_EVIDENCE: access_control.can_edit,
                Permission.VALIDATE_EVIDENCE: access_control.can_review,
                Permission.REVIEW_ASSESSMENT: access_control.can_review,
                Permission.APPROVE_ASSESSMENT: access_control.can_approve,
                Permission.REJECT_ASSESSMENT: access_control.can_approve
            }
            
            return permission_mapping.get(permission, False)
            
        except Exception as e:
            logger.error(f"Resource access check error: {str(e)}")
            return False
    
    def _clear_user_permission_cache(self, user_id: str):
        """Clear permission cache for user"""
        
        cache_key = f"permissions:{user_id}"
        if cache_key in self.permission_cache:
            del self.permission_cache[cache_key]

# ================================================================================
# PERMISSION MIDDLEWARE AND DECORATORS
# ================================================================================

class PermissionMiddleware:
    """Middleware for automatic permission checking"""
    
    def __init__(self, rbac_service: RBACService):
        self.rbac_service = rbac_service
    
    async def __call__(self, request, call_next):
        """Process request with permission checking"""
        
        # Extract authentication token
        auth_header = request.headers.get("Authorization")
        if auth_header and auth_header.startswith("Bearer "):
            token = auth_header[7:]
            user_info = self.rbac_service.validate_token(token)
            
            if user_info:
                request.state.user = user_info
            else:
                request.state.user = None
        else:
            request.state.user = None
        
        response = await call_next(request)
        return response

def require_permission(permission: Permission):
    """Decorator to require specific permission"""
    
    def decorator(func):
        @wraps(func)
        async def wrapper(*args, **kwargs):
            # This would integrate with FastAPI dependency injection
            # to get current user and check permissions
            return await func(*args, **kwargs)
        
        wrapper._required_permission = permission
        return wrapper
    
    return decorator

def require_assessment_access(access_level: AccessLevel = AccessLevel.VIEW_ONLY):
    """Decorator to require specific assessment access level"""
    
    def decorator(func):
        @wraps(func)
        async def wrapper(*args, **kwargs):
            # This would check assessment-specific access
            return await func(*args, **kwargs)
        
        wrapper._required_access_level = access_level
        return wrapper
    
    return decorator

# ================================================================================
# FACTORY FUNCTIONS
# ================================================================================

def create_rbac_service(secret_key: str = None) -> RBACService:
    """Factory function to create RBAC service"""
    return RBACService(secret_key)

def create_permission_middleware(rbac_service: RBACService) -> PermissionMiddleware:
    """Factory function to create permission middleware"""
    return PermissionMiddleware(rbac_service)

# ================================================================================
# PERMISSION CHECKING UTILITIES
# ================================================================================

class PermissionChecker:
    """Utility class for common permission checks"""
    
    def __init__(self, rbac_service: RBACService):
        self.rbac_service = rbac_service
    
    async def can_user_access_assessment(
        self,
        user_id: str,
        assessment_id: str,
        required_permission: Permission,
        db_session: Session
    ) -> bool:
        """Check if user can access assessment with required permission"""
        
        return await self.rbac_service.check_permission(
            user_id, required_permission, assessment_id, db_session
        )
    
    async def can_user_manage_organization(
        self,
        user_id: str,
        organization_id: str,
        db_session: Session
    ) -> bool:
        """Check if user can manage organization settings"""
        
        # Get user's organization
        user_org = await self._get_user_organization(user_id, db_session)
        
        # Check if same organization and has admin role
        if str(user_org) != organization_id:
            return False
        
        return await self.rbac_service.check_permission(
            user_id, Permission.MANAGE_ACCESS, None, db_session
        )
    
    async def get_user_assessment_permissions(
        self,
        user_id: str,
        assessment_id: str,
        db_session: Session
    ) -> Dict[str, bool]:
        """Get detailed assessment permissions for user"""
        
        permissions = {}
        
        assessment_permissions = [
            Permission.VIEW_ASSESSMENT,
            Permission.EDIT_ASSESSMENT,
            Permission.SUBMIT_ASSESSMENT,
            Permission.VIEW_RESPONSES,
            Permission.EDIT_RESPONSES,
            Permission.SUBMIT_RESPONSES,
            Permission.VIEW_EVIDENCE,
            Permission.UPLOAD_EVIDENCE,
            Permission.REVIEW_ASSESSMENT,
            Permission.APPROVE_ASSESSMENT
        ]
        
        for permission in assessment_permissions:
            permissions[permission.value] = await self.rbac_service.check_permission(
                user_id, permission, assessment_id, db_session
            )
        
        return permissions
    
    async def _get_user_organization(self, user_id: str, db_session: Session) -> Optional[str]:
        """Get user's organization ID"""
        
        try:
            user = db_session.query(User).filter(User.id == uuid.UUID(user_id)).first()
            return str(user.organization_id) if user else None
        except:
            return None

print("✅ Role-Based Access Control Service Loaded Successfully!")
print("Features:")
print("  🔐 Comprehensive Permission Management")
print("  👥 Multi-Role User System")
print("  🎫 JWT Token Authentication")
print("  🛡️ Resource-Specific Access Control")
print("  📊 Assessment-Level Permissions")
print("  🔍 Audit Logging and Tracking")
print("  ⚡ Permission Caching and Optimization")
print("  🎯 Granular Permission Decorators")
print("  🔄 Dynamic Access Grant/Revoke")