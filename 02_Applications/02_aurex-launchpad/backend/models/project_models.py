#!/usr/bin/env python3
"""
AUREX LAUNCHPAD™ PROJECT MANAGEMENT MODELS
VIBE Framework Implementation - Velocity, Intelligence, Balance, Excellence
Complete project lifecycle management with ESG integration
"""

from sqlalchemy import Column, String, Text, DateTime, ForeignKey, Enum, Float, Integer, JSON, Boolean, Table
from sqlalchemy.orm import relationship
from sqlalchemy.dialects.postgresql import UUID
from datetime import datetime
import enum
import uuid
from .base_models import BaseModel, TimestampMixin

# Association tables for many-to-many relationships
project_team_members = Table(
    'project_team_members',
    BaseModel.metadata,
    Column('project_id', UUID(as_uuid=True), ForeignKey('projects.id'), primary_key=True),
    Column('user_id', UUID(as_uuid=True), ForeignKey('users.id'), primary_key=True),
    Column('role', String(50)),
    Column('assigned_at', DateTime, default=datetime.utcnow)
)

project_stakeholders = Table(
    'project_stakeholders',
    BaseModel.metadata,
    Column('project_id', UUID(as_uuid=True), ForeignKey('projects.id'), primary_key=True),
    Column('stakeholder_id', UUID(as_uuid=True), ForeignKey('stakeholders.id'), primary_key=True),
    Column('influence_level', String(20)),
    Column('engagement_frequency', String(20))
)

sprint_tasks = Table(
    'sprint_tasks',
    BaseModel.metadata,
    Column('sprint_id', UUID(as_uuid=True), ForeignKey('sprints.id'), primary_key=True),
    Column('task_id', UUID(as_uuid=True), ForeignKey('tasks.id'), primary_key=True),
    Column('added_at', DateTime, default=datetime.utcnow)
)

class ProjectStatus(enum.Enum):
    PLANNING = "planning"
    IN_PROGRESS = "in_progress"
    ON_HOLD = "on_hold"
    COMPLETED = "completed"
    CANCELLED = "cancelled"
    ARCHIVED = "archived"

class ProjectPriority(enum.Enum):
    CRITICAL = "critical"
    HIGH = "high"
    MEDIUM = "medium"
    LOW = "low"

class TaskStatus(enum.Enum):
    BACKLOG = "backlog"
    TODO = "todo"
    IN_PROGRESS = "in_progress"
    IN_REVIEW = "in_review"
    TESTING = "testing"
    DONE = "done"
    BLOCKED = "blocked"

class TaskType(enum.Enum):
    FEATURE = "feature"
    BUG = "bug"
    ENHANCEMENT = "enhancement"
    DOCUMENTATION = "documentation"
    RESEARCH = "research"
    INFRASTRUCTURE = "infrastructure"
    ESG_ASSESSMENT = "esg_assessment"
    COMPLIANCE = "compliance"

class SprintStatus(enum.Enum):
    PLANNING = "planning"
    ACTIVE = "active"
    COMPLETED = "completed"
    CANCELLED = "cancelled"

class RiskLevel(enum.Enum):
    CRITICAL = "critical"
    HIGH = "high"
    MEDIUM = "medium"
    LOW = "low"
    MINIMAL = "minimal"

class Project(BaseModel, TimestampMixin):
    """VIBE-aligned project management with ESG integration"""
    __tablename__ = 'projects'
    
    # Basic Information
    name = Column(String(200), nullable=False)
    code = Column(String(50), unique=True, nullable=False)
    description = Column(Text)
    status = Column(Enum(ProjectStatus), default=ProjectStatus.PLANNING)
    priority = Column(Enum(ProjectPriority), default=ProjectPriority.MEDIUM)
    
    # Organization & Ownership
    organization_id = Column(UUID(as_uuid=True), ForeignKey('organizations.id'), nullable=False)
    owner_id = Column(UUID(as_uuid=True), ForeignKey('users.id'), nullable=False)
    manager_id = Column(UUID(as_uuid=True), ForeignKey('users.id'))
    
    # Timeline
    start_date = Column(DateTime)
    end_date = Column(DateTime)
    actual_start = Column(DateTime)
    actual_end = Column(DateTime)
    
    # Budget & Resources
    budget_allocated = Column(Float, default=0.0)
    budget_consumed = Column(Float, default=0.0)
    resource_allocation = Column(JSON)  # Team size, hours, equipment
    
    # Progress Tracking
    completion_percentage = Column(Float, default=0.0)
    health_score = Column(Float)  # 0-100 project health
    velocity = Column(Float)  # Story points per sprint
    
    # ESG Integration
    esg_impact_score = Column(Float)
    carbon_footprint = Column(Float)  # Project's carbon impact
    sustainability_goals = Column(JSON)
    compliance_requirements = Column(JSON)
    
    # VIBE Metrics
    vibe_velocity_score = Column(Float)  # Speed of delivery
    vibe_intelligence_score = Column(Float)  # Data-driven decisions
    vibe_balance_score = Column(Float)  # Resource optimization
    vibe_excellence_score = Column(Float)  # Quality metrics
    
    # Documentation
    charter_document = Column(Text)
    objectives = Column(JSON)
    success_criteria = Column(JSON)
    lessons_learned = Column(Text)
    
    # Metadata
    tags = Column(JSON)
    custom_fields = Column(JSON)
    jira_project_key = Column(String(50))
    external_references = Column(JSON)
    
    # Relationships
    organization = relationship("Organization", back_populates="projects")
    owner = relationship("User", foreign_keys=[owner_id], back_populates="owned_projects")
    manager = relationship("User", foreign_keys=[manager_id], back_populates="managed_projects")
    team_members = relationship("User", secondary=project_team_members, back_populates="projects")
    milestones = relationship("Milestone", back_populates="project", cascade="all, delete-orphan")
    sprints = relationship("Sprint", back_populates="project", cascade="all, delete-orphan")
    tasks = relationship("Task", back_populates="project", cascade="all, delete-orphan")
    risks = relationship("Risk", back_populates="project", cascade="all, delete-orphan")
    stakeholders = relationship("Stakeholder", secondary=project_stakeholders, back_populates="projects")
    documents = relationship("ProjectDocument", back_populates="project", cascade="all, delete-orphan")
    metrics = relationship("ProjectMetric", back_populates="project", cascade="all, delete-orphan")

class Milestone(BaseModel, TimestampMixin):
    """Project milestones with deliverables tracking"""
    __tablename__ = 'milestones'
    
    project_id = Column(UUID(as_uuid=True), ForeignKey('projects.id'), nullable=False)
    name = Column(String(200), nullable=False)
    description = Column(Text)
    due_date = Column(DateTime, nullable=False)
    completed_date = Column(DateTime)
    
    # Status & Progress
    status = Column(Enum(ProjectStatus), default=ProjectStatus.PLANNING)
    completion_percentage = Column(Float, default=0.0)
    is_critical_path = Column(Boolean, default=False)
    
    # Deliverables
    deliverables = Column(JSON)
    acceptance_criteria = Column(JSON)
    dependencies = Column(JSON)
    
    # ESG Impact
    esg_requirements = Column(JSON)
    compliance_checkpoints = Column(JSON)
    
    # Relationships
    project = relationship("Project", back_populates="milestones")
    tasks = relationship("Task", back_populates="milestone")

class Sprint(BaseModel, TimestampMixin):
    """Agile sprint management with VIBE velocity tracking"""
    __tablename__ = 'sprints'
    
    project_id = Column(UUID(as_uuid=True), ForeignKey('projects.id'), nullable=False)
    name = Column(String(100), nullable=False)
    goal = Column(Text)
    sprint_number = Column(Integer)
    
    # Timeline
    start_date = Column(DateTime, nullable=False)
    end_date = Column(DateTime, nullable=False)
    status = Column(Enum(SprintStatus), default=SprintStatus.PLANNING)
    
    # Capacity & Velocity
    planned_story_points = Column(Float, default=0.0)
    completed_story_points = Column(Float, default=0.0)
    team_capacity = Column(Float)  # Total available hours
    velocity = Column(Float)  # Actual velocity achieved
    
    # Sprint Metrics
    burndown_data = Column(JSON)  # Daily burndown chart data
    impediments = Column(JSON)
    retrospective_notes = Column(Text)
    
    # VIBE Metrics
    vibe_velocity_achieved = Column(Float)
    vibe_quality_score = Column(Float)
    
    # Relationships
    project = relationship("Project", back_populates="sprints")
    tasks = relationship("Task", secondary=sprint_tasks, back_populates="sprints")
    daily_standups = relationship("DailyStandup", back_populates="sprint", cascade="all, delete-orphan")

class Task(BaseModel, TimestampMixin):
    """Granular task management with ESG tracking"""
    __tablename__ = 'tasks'
    
    # Basic Information
    project_id = Column(UUID(as_uuid=True), ForeignKey('projects.id'), nullable=False)
    milestone_id = Column(UUID(as_uuid=True), ForeignKey('milestones.id'))
    parent_task_id = Column(UUID(as_uuid=True), ForeignKey('tasks.id'))
    
    title = Column(String(200), nullable=False)
    description = Column(Text)
    task_type = Column(Enum(TaskType), default=TaskType.FEATURE)
    status = Column(Enum(TaskStatus), default=TaskStatus.TODO)
    priority = Column(Enum(ProjectPriority), default=ProjectPriority.MEDIUM)
    
    # Assignment & Ownership
    assignee_id = Column(UUID(as_uuid=True), ForeignKey('users.id'))
    reporter_id = Column(UUID(as_uuid=True), ForeignKey('users.id'))
    
    # Estimation & Tracking
    story_points = Column(Float)
    estimated_hours = Column(Float)
    actual_hours = Column(Float)
    remaining_hours = Column(Float)
    
    # Timeline
    due_date = Column(DateTime)
    started_at = Column(DateTime)
    completed_at = Column(DateTime)
    
    # Dependencies
    blocked_by = Column(JSON)  # Task IDs blocking this task
    blocks = Column(JSON)  # Task IDs this task blocks
    
    # ESG & Compliance
    esg_category = Column(String(50))
    compliance_requirement = Column(Boolean, default=False)
    carbon_impact = Column(Float)
    
    # Quality & Testing
    acceptance_criteria = Column(JSON)
    test_cases = Column(JSON)
    code_review_status = Column(String(50))
    
    # Integration
    jira_issue_key = Column(String(50))
    github_issue_number = Column(Integer)
    external_id = Column(String(100))
    
    # Metadata
    tags = Column(JSON)
    attachments = Column(JSON)
    comments_count = Column(Integer, default=0)
    
    # Relationships
    project = relationship("Project", back_populates="tasks")
    milestone = relationship("Milestone", back_populates="tasks")
    assignee = relationship("User", foreign_keys=[assignee_id])
    reporter = relationship("User", foreign_keys=[reporter_id])
    sprints = relationship("Sprint", secondary=sprint_tasks, back_populates="tasks")
    subtasks = relationship("Task", backref="parent_task", remote_side="Task.id")
    comments = relationship("TaskComment", back_populates="task", cascade="all, delete-orphan")
    time_logs = relationship("TimeLog", back_populates="task", cascade="all, delete-orphan")

class Risk(BaseModel, TimestampMixin):
    """Risk management with mitigation tracking"""
    __tablename__ = 'risks'
    
    project_id = Column(UUID(as_uuid=True), ForeignKey('projects.id'), nullable=False)
    title = Column(String(200), nullable=False)
    description = Column(Text)
    
    # Risk Assessment
    probability = Column(Float)  # 0-1 probability
    impact = Column(Float)  # 1-10 impact scale
    risk_score = Column(Float)  # probability * impact
    risk_level = Column(Enum(RiskLevel))
    
    # Categories
    category = Column(String(50))  # Technical, Financial, ESG, Legal, etc.
    esg_related = Column(Boolean, default=False)
    
    # Mitigation
    mitigation_plan = Column(Text)
    contingency_plan = Column(Text)
    owner_id = Column(UUID(as_uuid=True), ForeignKey('users.id'))
    
    # Status
    status = Column(String(50))  # Identified, Analyzing, Mitigating, Resolved, Accepted
    identified_date = Column(DateTime, default=datetime.utcnow)
    resolved_date = Column(DateTime)
    
    # Impact Analysis
    affected_areas = Column(JSON)
    financial_impact = Column(Float)
    schedule_impact = Column(Integer)  # Days of delay
    
    # Relationships
    project = relationship("Project", back_populates="risks")
    owner = relationship("User")

class Stakeholder(BaseModel, TimestampMixin):
    """Stakeholder management with engagement tracking"""
    __tablename__ = 'stakeholders'
    
    organization_id = Column(UUID(as_uuid=True), ForeignKey('organizations.id'), nullable=False)
    name = Column(String(200), nullable=False)
    email = Column(String(255))
    role = Column(String(100))
    department = Column(String(100))
    
    # Stakeholder Analysis
    influence_level = Column(String(20))  # High, Medium, Low
    interest_level = Column(String(20))  # High, Medium, Low
    engagement_strategy = Column(Text)
    
    # Communication
    preferred_communication = Column(String(50))  # Email, Phone, Meeting
    communication_frequency = Column(String(50))  # Daily, Weekly, Monthly
    last_contacted = Column(DateTime)
    
    # ESG Focus
    esg_interests = Column(JSON)
    sustainability_champion = Column(Boolean, default=False)
    
    # Relationships
    organization = relationship("Organization")
    projects = relationship("Project", secondary=project_stakeholders, back_populates="stakeholders")

class ProjectDocument(BaseModel, TimestampMixin):
    """Project documentation with version control"""
    __tablename__ = 'project_documents'
    
    project_id = Column(UUID(as_uuid=True), ForeignKey('projects.id'), nullable=False)
    name = Column(String(200), nullable=False)
    document_type = Column(String(50))  # Charter, Plan, Report, etc.
    
    # Content
    file_path = Column(String(500))
    file_size = Column(Integer)
    mime_type = Column(String(100))
    content = Column(Text)  # For inline documents
    
    # Version Control
    version = Column(String(20))
    is_latest = Column(Boolean, default=True)
    previous_version_id = Column(UUID(as_uuid=True), ForeignKey('project_documents.id'))
    
    # Metadata
    author_id = Column(UUID(as_uuid=True), ForeignKey('users.id'))
    tags = Column(JSON)
    esg_related = Column(Boolean, default=False)
    
    # Approval
    requires_approval = Column(Boolean, default=False)
    approved_by_id = Column(UUID(as_uuid=True), ForeignKey('users.id'))
    approved_at = Column(DateTime)
    
    # Relationships
    project = relationship("Project", back_populates="documents")
    author = relationship("User", foreign_keys=[author_id])
    approved_by = relationship("User", foreign_keys=[approved_by_id])

class TaskComment(BaseModel, TimestampMixin):
    """Task comments with mentions and reactions"""
    __tablename__ = 'task_comments'
    
    task_id = Column(UUID(as_uuid=True), ForeignKey('tasks.id'), nullable=False)
    author_id = Column(UUID(as_uuid=True), ForeignKey('users.id'), nullable=False)
    content = Column(Text, nullable=False)
    
    # Mentions & References
    mentioned_users = Column(JSON)  # User IDs mentioned
    referenced_tasks = Column(JSON)  # Task IDs referenced
    
    # Metadata
    is_edited = Column(Boolean, default=False)
    edited_at = Column(DateTime)
    reactions = Column(JSON)  # Emoji reactions
    
    # Relationships
    task = relationship("Task", back_populates="comments")
    author = relationship("User")

class TimeLog(BaseModel, TimestampMixin):
    """Time tracking for tasks and projects"""
    __tablename__ = 'time_logs'
    
    task_id = Column(UUID(as_uuid=True), ForeignKey('tasks.id'), nullable=False)
    user_id = Column(UUID(as_uuid=True), ForeignKey('users.id'), nullable=False)
    
    # Time Entry
    start_time = Column(DateTime, nullable=False)
    end_time = Column(DateTime)
    duration_hours = Column(Float)
    
    # Description
    description = Column(Text)
    activity_type = Column(String(50))  # Development, Testing, Meeting, etc.
    
    # Billing
    is_billable = Column(Boolean, default=True)
    hourly_rate = Column(Float)
    total_cost = Column(Float)
    
    # Relationships
    task = relationship("Task", back_populates="time_logs")
    user = relationship("User")

class DailyStandup(BaseModel, TimestampMixin):
    """Daily standup tracking for sprints"""
    __tablename__ = 'daily_standups'
    
    sprint_id = Column(UUID(as_uuid=True), ForeignKey('sprints.id'), nullable=False)
    user_id = Column(UUID(as_uuid=True), ForeignKey('users.id'), nullable=False)
    date = Column(DateTime, nullable=False)
    
    # Standup Updates
    yesterday_completed = Column(Text)
    today_planned = Column(Text)
    blockers = Column(Text)
    
    # Mood & Productivity
    mood_score = Column(Integer)  # 1-5 scale
    productivity_score = Column(Integer)  # 1-10 scale
    
    # Relationships
    sprint = relationship("Sprint", back_populates="daily_standups")
    user = relationship("User")

class ProjectMetric(BaseModel, TimestampMixin):
    """Custom project metrics tracking"""
    __tablename__ = 'project_metrics'
    
    project_id = Column(UUID(as_uuid=True), ForeignKey('projects.id'), nullable=False)
    metric_name = Column(String(100), nullable=False)
    metric_type = Column(String(50))  # Performance, Quality, ESG, Financial
    
    # Values
    target_value = Column(Float)
    current_value = Column(Float)
    unit = Column(String(50))
    
    # Tracking
    measurement_date = Column(DateTime, default=datetime.utcnow)
    trend = Column(String(20))  # Improving, Stable, Declining
    
    # ESG Alignment
    esg_category = Column(String(50))
    sustainability_indicator = Column(Boolean, default=False)
    
    # Relationships
    project = relationship("Project", back_populates="metrics")