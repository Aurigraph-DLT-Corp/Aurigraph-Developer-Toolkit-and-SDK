"""
Aurex Sylvagraph - Remote Sensing and Monitoring Router
"""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import List, Dict, Any

from database import get_db
from app.models.monitoring import MonitoringSession, SatelliteImagery, DroneImagery, AIAnalysisResult
from app.models.users import User
from app.routers.auth import get_current_user

router = APIRouter()

@router.post("/sessions", response_model=dict)
async def create_monitoring_session(
    session_data: dict,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Create new monitoring session"""
    session = MonitoringSession(**session_data, created_by=current_user.id)
    db.add(session)
    await db.commit()
    await db.refresh(session)
    
    return {
        "message": "Monitoring session created",
        "session_id": session.id
    }

@router.get("/sessions", response_model=List[dict])
async def list_monitoring_sessions(
    project_id: str = None,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """List monitoring sessions"""
    query = select(MonitoringSession)
    if project_id:
        query = query.where(MonitoringSession.project_id == project_id)
    
    result = await db.execute(query)
    sessions = result.scalars().all()
    
    return [
        {
            "id": s.id,
            "session_code": s.session_code,
            "monitoring_type": s.monitoring_type,
            "monitoring_date": s.monitoring_date,
            "processing_status": s.processing_status,
            "created_at": s.created_at
        }
        for s in sessions
    ]

@router.post("/ai-analysis", response_model=dict)
async def create_ai_analysis(
    analysis_data: dict,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Submit data for AI analysis"""
    analysis = AIAnalysisResult(**analysis_data, created_by=current_user.id)
    db.add(analysis)
    await db.commit()
    
    # Trigger AI processing (placeholder)
    # This would integrate with TensorFlow/PyTorch models
    
    return {
        "message": "AI analysis queued",
        "analysis_id": analysis.id
    }