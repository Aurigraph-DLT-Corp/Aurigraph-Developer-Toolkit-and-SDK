#!/usr/bin/env python3
"""
AUREX LAUNCHPAD™ PROJECT MANAGEMENT API ENDPOINTS
VIBE Framework Implementation - Velocity & Excellence
Complete project lifecycle management with ESG integration
"""

from fastapi import APIRouter, Depends, HTTPException, status, Query, Body
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session
from sqlalchemy import desc, asc, func
from typing import List, Optional, Dict, Any
from datetime import datetime, timedelta
from pydantic import BaseModel, Field
import uuid

from ..database import get_db
from ..models.project_models import (
    Project, Milestone, Sprint, Task, Risk, Stakeholder, 
    ProjectDocument, TaskComment, TimeLog, DailyStandup,
    ProjectStatus, ProjectPriority, TaskStatus, TaskType, SprintStatus
)
from ..models.auth_models import User
from ..auth import get_current_user, get_current_active_user

router = APIRouter(prefix="/projects", tags=["projects"])

# ================================================================================
# PYDANTIC SCHEMAS
# ================================================================================

class ProjectCreate(BaseModel):
    name: str = Field(..., max_length=200)
    code: str = Field(..., max_length=50)
    description: Optional[str] = None
    priority: ProjectPriority = ProjectPriority.MEDIUM
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None
    budget_allocated: Optional[float] = 0.0
    sustainability_goals: Optional[Dict[str, Any]] = None
    manager_id: Optional[uuid.UUID] = None

class ProjectUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    status: Optional[ProjectStatus] = None
    priority: Optional[ProjectPriority] = None
    end_date: Optional[datetime] = None
    budget_consumed: Optional[float] = None
    completion_percentage: Optional[float] = None
    sustainability_goals: Optional[Dict[str, Any]] = None

class TaskCreate(BaseModel):
    title: str = Field(..., max_length=200)
    description: Optional[str] = None
    task_type: TaskType = TaskType.FEATURE
    priority: ProjectPriority = ProjectPriority.MEDIUM
    assignee_id: Optional[uuid.UUID] = None
    milestone_id: Optional[uuid.UUID] = None
    story_points: Optional[float] = None
    estimated_hours: Optional[float] = None
    due_date: Optional[datetime] = None
    esg_category: Optional[str] = None

class TaskUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    status: Optional[TaskStatus] = None
    priority: Optional[ProjectPriority] = None
    assignee_id: Optional[uuid.UUID] = None
    story_points: Optional[float] = None
    actual_hours: Optional[float] = None
    remaining_hours: Optional[float] = None

class MilestoneCreate(BaseModel):
    name: str = Field(..., max_length=200)
    description: Optional[str] = None
    due_date: datetime
    deliverables: Optional[Dict[str, Any]] = None
    acceptance_criteria: Optional[Dict[str, Any]] = None
    esg_requirements: Optional[Dict[str, Any]] = None

class SprintCreate(BaseModel):
    name: str = Field(..., max_length=100)
    goal: Optional[str] = None
    start_date: datetime
    end_date: datetime
    planned_story_points: Optional[float] = 0.0
    team_capacity: Optional[float] = None

# ================================================================================
# PROJECT ENDPOINTS
# ================================================================================

@router.get("/", response_model=List[Dict[str, Any]])
async def list_projects(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, le=1000),
    status: Optional[ProjectStatus] = None,
    priority: Optional[ProjectPriority] = None,
    search: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """List projects with filtering and pagination - VIBE Intelligence"""
    
    query = db.query(Project).filter(Project.organization_id == current_user.organization_id)
    
    # Apply filters
    if status:
        query = query.filter(Project.status == status)
    if priority:
        query = query.filter(Project.priority == priority)
    if search:
        query = query.filter(Project.name.ilike(f"%{search}%"))
    
    # Get total count for pagination
    total = query.count()
    
    # Apply pagination and ordering
    projects = query.offset(skip).limit(limit).order_by(desc(Project.updated_at)).all()
    
    # Calculate VIBE metrics
    project_data = []
    for project in projects:
        project_dict = {
            "id": str(project.id),
            "name": project.name,
            "code": project.code,
            "description": project.description,
            "status": project.status.value,
            "priority": project.priority.value,
            "completion_percentage": project.completion_percentage or 0.0,
            "budget_allocated": project.budget_allocated or 0.0,
            "budget_consumed": project.budget_consumed or 0.0,
            "start_date": project.start_date,
            "end_date": project.end_date,
            "esg_impact_score": project.esg_impact_score,
            "vibe_velocity_score": project.vibe_velocity_score,
            "vibe_intelligence_score": project.vibe_intelligence_score,
            "vibe_balance_score": project.vibe_balance_score,
            "vibe_excellence_score": project.vibe_excellence_score,
            "created_at": project.created_at,
            "updated_at": project.updated_at,
        }
        project_data.append(project_dict)
    
    return JSONResponse(content={
        "projects": project_data,
        "total": total,
        "page": skip // limit + 1,
        "pages": (total + limit - 1) // limit
    })

@router.post("/", response_model=Dict[str, Any])
async def create_project(
    project_data: ProjectCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Create new project - VIBE Velocity implementation"""
    
    # Check if project code already exists
    existing = db.query(Project).filter(
        Project.code == project_data.code,
        Project.organization_id == current_user.organization_id
    ).first()
    
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Project code already exists"
        )
    
    # Create project
    project = Project(
        organization_id=current_user.organization_id,
        owner_id=current_user.id,
        **project_data.dict()
    )
    
    # Initialize VIBE scores
    project.vibe_velocity_score = 75.0  # Starting score
    project.vibe_intelligence_score = 70.0
    project.vibe_balance_score = 80.0
    project.vibe_excellence_score = 75.0
    
    db.add(project)
    db.commit()
    db.refresh(project)
    
    return {"message": "Project created successfully", "project_id": str(project.id)}

@router.get("/{project_id}", response_model=Dict[str, Any])
async def get_project(
    project_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Get project details with comprehensive analytics"""
    
    project = db.query(Project).filter(
        Project.id == project_id,
        Project.organization_id == current_user.organization_id
    ).first()
    
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    # Get project statistics
    total_tasks = db.query(Task).filter(Task.project_id == project_id).count()
    completed_tasks = db.query(Task).filter(
        Task.project_id == project_id,
        Task.status == TaskStatus.DONE
    ).count()
    
    active_sprints = db.query(Sprint).filter(
        Sprint.project_id == project_id,
        Sprint.status == SprintStatus.ACTIVE
    ).count()
    
    return {
        "id": str(project.id),
        "name": project.name,
        "code": project.code,
        "description": project.description,
        "status": project.status.value,
        "priority": project.priority.value,
        "completion_percentage": project.completion_percentage or 0.0,
        "budget_allocated": project.budget_allocated or 0.0,
        "budget_consumed": project.budget_consumed or 0.0,
        "start_date": project.start_date,
        "end_date": project.end_date,
        "sustainability_goals": project.sustainability_goals,
        "vibe_scores": {
            "velocity": project.vibe_velocity_score,
            "intelligence": project.vibe_intelligence_score,
            "balance": project.vibe_balance_score,
            "excellence": project.vibe_excellence_score
        },
        "statistics": {
            "total_tasks": total_tasks,
            "completed_tasks": completed_tasks,
            "task_completion_rate": (completed_tasks / total_tasks * 100) if total_tasks > 0 else 0,
            "active_sprints": active_sprints
        },
        "created_at": project.created_at,
        "updated_at": project.updated_at
    }

@router.put("/{project_id}")
async def update_project(
    project_id: uuid.UUID,
    project_data: ProjectUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Update project with VIBE optimization"""
    
    project = db.query(Project).filter(
        Project.id == project_id,
        Project.organization_id == current_user.organization_id
    ).first()
    
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    # Update project fields
    for field, value in project_data.dict(exclude_unset=True).items():
        setattr(project, field, value)
    
    # Recalculate VIBE scores based on updates
    if project_data.completion_percentage is not None:
        project.vibe_velocity_score = min(100, 50 + project_data.completion_percentage * 0.5)
    
    db.commit()
    db.refresh(project)
    
    return {"message": "Project updated successfully"}

# ================================================================================
# TASK ENDPOINTS
# ================================================================================

@router.get("/{project_id}/tasks")
async def list_project_tasks(
    project_id: uuid.UUID,
    status: Optional[TaskStatus] = None,
    assignee_id: Optional[uuid.UUID] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """List project tasks with filtering"""
    
    query = db.query(Task).filter(Task.project_id == project_id)
    
    if status:
        query = query.filter(Task.status == status)
    if assignee_id:
        query = query.filter(Task.assignee_id == assignee_id)
    
    tasks = query.order_by(desc(Task.created_at)).all()
    
    task_data = []
    for task in tasks:
        task_data.append({
            "id": str(task.id),
            "title": task.title,
            "description": task.description,
            "status": task.status.value,
            "priority": task.priority.value,
            "task_type": task.task_type.value,
            "story_points": task.story_points,
            "estimated_hours": task.estimated_hours,
            "actual_hours": task.actual_hours,
            "assignee_id": str(task.assignee_id) if task.assignee_id else None,
            "due_date": task.due_date,
            "esg_category": task.esg_category,
            "created_at": task.created_at,
            "updated_at": task.updated_at
        })
    
    return {"tasks": task_data}

@router.post("/{project_id}/tasks")
async def create_task(
    project_id: uuid.UUID,
    task_data: TaskCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Create new task with VIBE tracking"""
    
    # Verify project exists and user has access
    project = db.query(Project).filter(
        Project.id == project_id,
        Project.organization_id == current_user.organization_id
    ).first()
    
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    task = Task(
        project_id=project_id,
        reporter_id=current_user.id,
        **task_data.dict()
    )
    
    db.add(task)
    db.commit()
    db.refresh(task)
    
    return {"message": "Task created successfully", "task_id": str(task.id)}

@router.put("/{project_id}/tasks/{task_id}")
async def update_task(
    project_id: uuid.UUID,
    task_id: uuid.UUID,
    task_data: TaskUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Update task with automatic VIBE metrics calculation"""
    
    task = db.query(Task).filter(
        Task.id == task_id,
        Task.project_id == project_id
    ).first()
    
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    
    # Update task fields
    for field, value in task_data.dict(exclude_unset=True).items():
        setattr(task, field, value)
    
    # Auto-set completion timestamp
    if task_data.status == TaskStatus.DONE:
        task.completed_at = datetime.utcnow()
    
    db.commit()
    db.refresh(task)
    
    return {"message": "Task updated successfully"}

# ================================================================================
# SPRINT ENDPOINTS
# ================================================================================

@router.get("/{project_id}/sprints")
async def list_sprints(
    project_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """List project sprints with velocity metrics"""
    
    sprints = db.query(Sprint).filter(Sprint.project_id == project_id).order_by(desc(Sprint.start_date)).all()
    
    sprint_data = []
    for sprint in sprints:
        sprint_data.append({
            "id": str(sprint.id),
            "name": sprint.name,
            "goal": sprint.goal,
            "status": sprint.status.value,
            "start_date": sprint.start_date,
            "end_date": sprint.end_date,
            "planned_story_points": sprint.planned_story_points,
            "completed_story_points": sprint.completed_story_points,
            "velocity": sprint.velocity,
            "vibe_velocity_achieved": sprint.vibe_velocity_achieved,
            "vibe_quality_score": sprint.vibe_quality_score
        })
    
    return {"sprints": sprint_data}

@router.post("/{project_id}/sprints")
async def create_sprint(
    project_id: uuid.UUID,
    sprint_data: SprintCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Create new sprint with VIBE velocity planning"""
    
    sprint = Sprint(
        project_id=project_id,
        sprint_number=db.query(Sprint).filter(Sprint.project_id == project_id).count() + 1,
        **sprint_data.dict()
    )
    
    db.add(sprint)
    db.commit()
    db.refresh(sprint)
    
    return {"message": "Sprint created successfully", "sprint_id": str(sprint.id)}

# ================================================================================
# MILESTONE ENDPOINTS
# ================================================================================

@router.get("/{project_id}/milestones")
async def list_milestones(
    project_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """List project milestones with ESG compliance tracking"""
    
    milestones = db.query(Milestone).filter(Milestone.project_id == project_id).order_by(asc(Milestone.due_date)).all()
    
    milestone_data = []
    for milestone in milestones:
        milestone_data.append({
            "id": str(milestone.id),
            "name": milestone.name,
            "description": milestone.description,
            "due_date": milestone.due_date,
            "completed_date": milestone.completed_date,
            "status": milestone.status.value,
            "completion_percentage": milestone.completion_percentage,
            "is_critical_path": milestone.is_critical_path,
            "esg_requirements": milestone.esg_requirements,
            "deliverables": milestone.deliverables
        })
    
    return {"milestones": milestone_data}

@router.post("/{project_id}/milestones")
async def create_milestone(
    project_id: uuid.UUID,
    milestone_data: MilestoneCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Create project milestone with ESG integration"""
    
    milestone = Milestone(
        project_id=project_id,
        **milestone_data.dict()
    )
    
    db.add(milestone)
    db.commit()
    db.refresh(milestone)
    
    return {"message": "Milestone created successfully", "milestone_id": str(milestone.id)}

# ================================================================================
# ANALYTICS ENDPOINTS
# ================================================================================

@router.get("/{project_id}/analytics/dashboard")
async def get_project_dashboard(
    project_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Comprehensive project analytics dashboard with VIBE metrics"""
    
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    # Task Analytics
    task_stats = db.query(
        Task.status,
        func.count(Task.id).label('count')
    ).filter(Task.project_id == project_id).group_by(Task.status).all()
    
    # Sprint Velocity
    sprint_velocity = db.query(Sprint.velocity).filter(
        Sprint.project_id == project_id,
        Sprint.velocity.isnot(None)
    ).all()
    
    avg_velocity = sum([s.velocity for s in sprint_velocity]) / len(sprint_velocity) if sprint_velocity else 0
    
    # Budget Analysis
    budget_utilization = (project.budget_consumed / project.budget_allocated * 100) if project.budget_allocated else 0
    
    # ESG Impact Score Trend (mock data - would be calculated from actual metrics)
    esg_trend = [
        {"date": "2024-01", "score": 65},
        {"date": "2024-02", "score": 72},
        {"date": "2024-03", "score": 78},
        {"date": "2024-04", "score": project.esg_impact_score or 80}
    ]
    
    return {
        "project_overview": {
            "name": project.name,
            "completion_percentage": project.completion_percentage,
            "budget_utilization": budget_utilization,
            "days_remaining": (project.end_date - datetime.now()).days if project.end_date else None
        },
        "vibe_scores": {
            "velocity": project.vibe_velocity_score,
            "intelligence": project.vibe_intelligence_score,
            "balance": project.vibe_balance_score,
            "excellence": project.vibe_excellence_score
        },
        "task_distribution": {stat.status.value: stat.count for stat in task_stats},
        "velocity_metrics": {
            "average_velocity": avg_velocity,
            "current_sprint_velocity": sprint_velocity[-1].velocity if sprint_velocity else 0
        },
        "esg_impact_trend": esg_trend
    }

@router.get("/{project_id}/analytics/velocity")
async def get_velocity_analytics(
    project_id: uuid.UUID,
    period_days: int = Query(30, ge=7, le=365),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """VIBE Velocity analytics and forecasting"""
    
    cutoff_date = datetime.utcnow() - timedelta(days=period_days)
    
    # Get completed tasks in period
    completed_tasks = db.query(Task).filter(
        Task.project_id == project_id,
        Task.status == TaskStatus.DONE,
        Task.completed_at >= cutoff_date
    ).all()
    
    # Calculate velocity metrics
    total_story_points = sum([task.story_points for task in completed_tasks if task.story_points])
    total_tasks = len(completed_tasks)
    avg_completion_time = sum([
        (task.completed_at - task.created_at).total_seconds() / 3600 
        for task in completed_tasks if task.completed_at
    ]) / total_tasks if total_tasks > 0 else 0
    
    return {
        "period_days": period_days,
        "velocity_metrics": {
            "total_story_points": total_story_points,
            "total_tasks_completed": total_tasks,
            "average_completion_time_hours": avg_completion_time,
            "daily_velocity": total_story_points / period_days if period_days > 0 else 0
        },
        "forecasting": {
            "estimated_sprint_capacity": total_story_points * 2,  # Simple 2-week projection
            "projected_completion_date": datetime.utcnow() + timedelta(
                days=int((100 - (project.completion_percentage or 0)) / 2)
            ) if project else None
        }
    }