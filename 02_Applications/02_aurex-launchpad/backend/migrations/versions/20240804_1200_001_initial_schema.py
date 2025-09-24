"""Initial schema - Create all tables for Aurex Launchpad

Revision ID: 001_initial_schema
Revises: 
Create Date: 2024-08-04 12:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql
import uuid

# revision identifiers, used by Alembic.
revision = '001_initial_schema'
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Enable UUID extension
    op.execute('CREATE EXTENSION IF NOT EXISTS "uuid-ossp"')
    
    # Create custom ENUM types
    sa.Enum('GRI', 'SASB', 'TCFD', 'CDP', 'ISO14064', name='esgframework').create(op.get_bind())
    sa.Enum('DRAFT', 'IN_PROGRESS', 'UNDER_REVIEW', 'COMPLETED', 'ARCHIVED', name='assessmentstatus').create(op.get_bind())
    sa.Enum('WEIGHTED_AVERAGE', 'SIMPLE_AVERAGE', 'MAXIMUM', 'CUSTOM', name='scoringmethod').create(op.get_bind())
    sa.Enum('MULTIPLE_CHOICE', 'TEXT', 'NUMERIC', 'DATE', 'BOOLEAN', 'FILE_UPLOAD', 'SCALE', name='questiontype').create(op.get_bind())
    
    # Organizations table
    op.create_table('organizations',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True, default=uuid.uuid4),
        sa.Column('name', sa.String(255), nullable=False),
        sa.Column('slug', sa.String(255), nullable=False, unique=True),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('industry', sa.String(100), nullable=True),
        sa.Column('website', sa.String(255), nullable=True),
        sa.Column('headquarters_location', sa.String(255), nullable=True),
        sa.Column('employee_count', sa.Integer(), nullable=True),
        sa.Column('settings', postgresql.JSONB(), nullable=True),
        sa.Column('is_active', sa.Boolean(), nullable=False, default=True),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.Column('deleted_at', sa.DateTime(timezone=True), nullable=True)
    )
    
    # Users table
    op.create_table('users',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True, default=uuid.uuid4),
        sa.Column('email', sa.String(255), nullable=False, unique=True),
        sa.Column('password_hash', sa.String(255), nullable=True),
        sa.Column('first_name', sa.String(100), nullable=False),
        sa.Column('last_name', sa.String(100), nullable=False),
        sa.Column('phone_number', sa.String(20), nullable=True),
        sa.Column('profile_image_url', sa.String(500), nullable=True),
        sa.Column('current_organization_id', postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column('is_active', sa.Boolean(), nullable=False, default=True),
        sa.Column('is_verified', sa.Boolean(), nullable=False, default=False),
        sa.Column('is_superuser', sa.Boolean(), nullable=False, default=False),
        sa.Column('mfa_enabled', sa.Boolean(), nullable=False, default=False),
        sa.Column('mfa_secret', sa.String(32), nullable=True),
        sa.Column('last_login_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('last_login_ip', sa.String(45), nullable=True),
        sa.Column('last_login_device', sa.String(255), nullable=True),
        sa.Column('failed_login_attempts', sa.Integer(), nullable=False, default=0),
        sa.Column('locked_until', sa.DateTime(timezone=True), nullable=True),
        sa.Column('password_changed_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('email_verified_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('preferences', postgresql.JSONB(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.Column('deleted_at', sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(['current_organization_id'], ['organizations.id'])
    )
    
    # Organization members table
    op.create_table('organization_members',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True, default=uuid.uuid4),
        sa.Column('organization_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('user_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('role', sa.String(50), nullable=False),
        sa.Column('is_owner', sa.Boolean(), nullable=False, default=False),
        sa.Column('is_active', sa.Boolean(), nullable=False, default=True),
        sa.Column('joined_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.Column('left_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.ForeignKeyConstraint(['organization_id'], ['organizations.id']),
        sa.ForeignKeyConstraint(['user_id'], ['users.id']),
        sa.UniqueConstraint('organization_id', 'user_id', name='unique_org_user')
    )
    
    # Roles table
    op.create_table('roles',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True, default=uuid.uuid4),
        sa.Column('name', sa.String(100), nullable=False, unique=True),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('is_system_role', sa.Boolean(), nullable=False, default=False),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now())
    )
    
    # Permissions table
    op.create_table('permissions',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True, default=uuid.uuid4),
        sa.Column('name', sa.String(100), nullable=False, unique=True),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('resource', sa.String(100), nullable=False),
        sa.Column('action', sa.String(50), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now())
    )
    
    # Role permissions table
    op.create_table('role_permissions',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True, default=uuid.uuid4),
        sa.Column('role_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('permission_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.ForeignKeyConstraint(['role_id'], ['roles.id']),
        sa.ForeignKeyConstraint(['permission_id'], ['permissions.id']),
        sa.UniqueConstraint('role_id', 'permission_id', name='unique_role_permission')
    )
    
    # User roles table
    op.create_table('user_roles',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True, default=uuid.uuid4),
        sa.Column('user_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('role_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('organization_id', postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column('assigned_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.Column('assigned_by_id', postgresql.UUID(as_uuid=True), nullable=True),
        sa.ForeignKeyConstraint(['user_id'], ['users.id']),
        sa.ForeignKeyConstraint(['role_id'], ['roles.id']),
        sa.ForeignKeyConstraint(['organization_id'], ['organizations.id']),
        sa.ForeignKeyConstraint(['assigned_by_id'], ['users.id'])
    )
    
    # Refresh tokens table
    op.create_table('refresh_tokens',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True, default=uuid.uuid4),
        sa.Column('user_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('token', sa.Text(), nullable=False),
        sa.Column('expires_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('is_active', sa.Boolean(), nullable=False, default=True),
        sa.Column('revoked_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('revoked_reason', sa.String(100), nullable=True),
        sa.Column('ip_address', sa.String(45), nullable=True),
        sa.Column('user_agent', sa.String(500), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'])
    )
    
    # Audit logs table
    op.create_table('audit_logs',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True, default=uuid.uuid4),
        sa.Column('event_type', sa.String(100), nullable=False),
        sa.Column('event_category', sa.String(50), nullable=False),
        sa.Column('event_description', sa.Text(), nullable=False),
        sa.Column('user_id', postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column('organization_id', postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column('target_user_id', postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column('target_resource_id', postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column('target_resource_type', sa.String(100), nullable=True),
        sa.Column('ip_address', sa.String(45), nullable=True),
        sa.Column('user_agent', sa.String(500), nullable=True),
        sa.Column('status', sa.String(20), nullable=False),
        sa.Column('metadata', postgresql.JSONB(), nullable=True),
        sa.Column('timestamp', sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.ForeignKeyConstraint(['user_id'], ['users.id']),
        sa.ForeignKeyConstraint(['organization_id'], ['organizations.id']),
        sa.ForeignKeyConstraint(['target_user_id'], ['users.id'])
    )
    
    # Security events table
    op.create_table('security_events',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True, default=uuid.uuid4),
        sa.Column('event_type', sa.String(100), nullable=False),
        sa.Column('severity', sa.String(20), nullable=False),
        sa.Column('description', sa.Text(), nullable=False),
        sa.Column('user_id', postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column('ip_address', sa.String(45), nullable=True),
        sa.Column('user_agent', sa.String(500), nullable=True),
        sa.Column('resolved', sa.Boolean(), nullable=False, default=False),
        sa.Column('resolved_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('resolved_by_id', postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column('resolution_notes', sa.Text(), nullable=True),
        sa.Column('metadata', postgresql.JSONB(), nullable=True),
        sa.Column('timestamp', sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.ForeignKeyConstraint(['user_id'], ['users.id']),
        sa.ForeignKeyConstraint(['resolved_by_id'], ['users.id'])
    )
    
    # ESG Framework Templates table
    op.create_table('esg_framework_templates',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True, default=uuid.uuid4),
        sa.Column('framework_type', sa.Enum('GRI', 'SASB', 'TCFD', 'CDP', 'ISO14064', name='esgframework'), nullable=False),
        sa.Column('name', sa.String(255), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('version', sa.String(50), nullable=False),
        sa.Column('is_default', sa.Boolean(), nullable=False, default=False),
        sa.Column('scoring_method', sa.Enum('WEIGHTED_AVERAGE', 'SIMPLE_AVERAGE', 'MAXIMUM', 'CUSTOM', name='scoringmethod'), nullable=False, default='WEIGHTED_AVERAGE'),
        sa.Column('configuration', postgresql.JSONB(), nullable=True),
        sa.Column('is_active', sa.Boolean(), nullable=False, default=True),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.Column('deleted_at', sa.DateTime(timezone=True), nullable=True)
    )
    
    # ESG Assessments table
    op.create_table('esg_assessments',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True, default=uuid.uuid4),
        sa.Column('name', sa.String(255), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('framework_type', sa.Enum('GRI', 'SASB', 'TCFD', 'CDP', 'ISO14064', name='esgframework'), nullable=False),
        sa.Column('template_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('organization_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('created_by_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('status', sa.Enum('DRAFT', 'IN_PROGRESS', 'UNDER_REVIEW', 'COMPLETED', 'ARCHIVED', name='assessmentstatus'), nullable=False, default='DRAFT'),
        sa.Column('overall_score', sa.Numeric(5, 2), nullable=True),
        sa.Column('completion_percentage', sa.Numeric(5, 2), nullable=False, default=0),
        sa.Column('start_date', sa.DateTime(timezone=True), nullable=True),
        sa.Column('target_completion_date', sa.DateTime(timezone=True), nullable=True),
        sa.Column('completed_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('metadata', postgresql.JSONB(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.Column('deleted_at', sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(['template_id'], ['esg_framework_templates.id']),
        sa.ForeignKeyConstraint(['organization_id'], ['organizations.id']),
        sa.ForeignKeyConstraint(['created_by_id'], ['users.id'])
    )
    
    # Assessment Questions table
    op.create_table('assessment_questions',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True, default=uuid.uuid4),
        sa.Column('assessment_id', postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column('template_id', postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column('category', sa.String(100), nullable=False),
        sa.Column('subcategory', sa.String(100), nullable=True),
        sa.Column('question_text', sa.Text(), nullable=False),
        sa.Column('question_type', sa.Enum('MULTIPLE_CHOICE', 'TEXT', 'NUMERIC', 'DATE', 'BOOLEAN', 'FILE_UPLOAD', 'SCALE', name='questiontype'), nullable=False),
        sa.Column('required', sa.Boolean(), nullable=False, default=False),
        sa.Column('weight', sa.Numeric(5, 2), nullable=False, default=1.0),
        sa.Column('display_order', sa.Integer(), nullable=False, default=0),
        sa.Column('guidance_text', sa.Text(), nullable=True),
        sa.Column('validation_rules', postgresql.JSONB(), nullable=True),
        sa.Column('options', postgresql.JSONB(), nullable=True),
        sa.Column('is_active', sa.Boolean(), nullable=False, default=True),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.ForeignKeyConstraint(['assessment_id'], ['esg_assessments.id']),
        sa.ForeignKeyConstraint(['template_id'], ['esg_framework_templates.id'])
    )
    
    # Assessment Responses table
    op.create_table('assessment_responses',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True, default=uuid.uuid4),
        sa.Column('assessment_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('question_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('response_value', sa.Text(), nullable=False),
        sa.Column('numeric_value', sa.Numeric(15, 4), nullable=True),
        sa.Column('evidence_text', sa.Text(), nullable=True),
        sa.Column('confidence_score', sa.Numeric(3, 2), nullable=True),
        sa.Column('notes', sa.Text(), nullable=True),
        sa.Column('attachments', postgresql.JSONB(), nullable=True),
        sa.Column('created_by_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('updated_by_id', postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.ForeignKeyConstraint(['assessment_id'], ['esg_assessments.id']),
        sa.ForeignKeyConstraint(['question_id'], ['assessment_questions.id']),
        sa.ForeignKeyConstraint(['created_by_id'], ['users.id']),
        sa.ForeignKeyConstraint(['updated_by_id'], ['users.id']),
        sa.UniqueConstraint('assessment_id', 'question_id', name='unique_assessment_question_response')
    )
    
    # Assessment Collaboration table
    op.create_table('assessment_collaborations',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True, default=uuid.uuid4),
        sa.Column('assessment_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('user_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('role', sa.String(50), nullable=False),
        sa.Column('permissions', postgresql.JSONB(), nullable=True),
        sa.Column('invited_by_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('joined_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('left_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('is_active', sa.Boolean(), nullable=False, default=True),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.ForeignKeyConstraint(['assessment_id'], ['esg_assessments.id']),
        sa.ForeignKeyConstraint(['user_id'], ['users.id']),
        sa.ForeignKeyConstraint(['invited_by_id'], ['users.id']),
        sa.UniqueConstraint('assessment_id', 'user_id', name='unique_assessment_collaboration')
    )
    
    # Create indexes for better performance
    op.create_index('idx_users_email', 'users', ['email'])
    op.create_index('idx_users_organization', 'users', ['current_organization_id'])
    op.create_index('idx_org_members_org', 'organization_members', ['organization_id'])
    op.create_index('idx_org_members_user', 'organization_members', ['user_id'])
    op.create_index('idx_assessments_org', 'esg_assessments', ['organization_id'])
    op.create_index('idx_assessments_status', 'esg_assessments', ['status'])
    op.create_index('idx_assessments_framework', 'esg_assessments', ['framework_type'])
    op.create_index('idx_questions_assessment', 'assessment_questions', ['assessment_id'])
    op.create_index('idx_responses_assessment', 'assessment_responses', ['assessment_id'])
    op.create_index('idx_responses_question', 'assessment_responses', ['question_id'])
    op.create_index('idx_audit_logs_user', 'audit_logs', ['user_id'])
    op.create_index('idx_audit_logs_timestamp', 'audit_logs', ['timestamp'])
    op.create_index('idx_security_events_timestamp', 'security_events', ['timestamp'])
    op.create_index('idx_refresh_tokens_user', 'refresh_tokens', ['user_id'])
    op.create_index('idx_refresh_tokens_expires', 'refresh_tokens', ['expires_at'])


def downgrade() -> None:
    # Drop indexes
    op.drop_index('idx_refresh_tokens_expires')
    op.drop_index('idx_refresh_tokens_user')
    op.drop_index('idx_security_events_timestamp')
    op.drop_index('idx_audit_logs_timestamp')
    op.drop_index('idx_audit_logs_user')
    op.drop_index('idx_responses_question')
    op.drop_index('idx_responses_assessment')
    op.drop_index('idx_questions_assessment')
    op.drop_index('idx_assessments_framework')
    op.drop_index('idx_assessments_status')
    op.drop_index('idx_assessments_org')
    op.drop_index('idx_org_members_user')
    op.drop_index('idx_org_members_org')
    op.drop_index('idx_users_organization')
    op.drop_index('idx_users_email')
    
    # Drop tables in reverse order
    op.drop_table('assessment_collaborations')
    op.drop_table('assessment_responses')
    op.drop_table('assessment_questions')
    op.drop_table('esg_assessments')
    op.drop_table('esg_framework_templates')
    op.drop_table('security_events')
    op.drop_table('audit_logs')
    op.drop_table('refresh_tokens')
    op.drop_table('user_roles')
    op.drop_table('role_permissions')
    op.drop_table('permissions')
    op.drop_table('roles')
    op.drop_table('organization_members')
    op.drop_table('users')
    op.drop_table('organizations')
    
    # Drop ENUM types
    sa.Enum(name='questiontype').drop(op.get_bind())
    sa.Enum(name='scoringmethod').drop(op.get_bind())
    sa.Enum(name='assessmentstatus').drop(op.get_bind())
    sa.Enum(name='esgframework').drop(op.get_bind())