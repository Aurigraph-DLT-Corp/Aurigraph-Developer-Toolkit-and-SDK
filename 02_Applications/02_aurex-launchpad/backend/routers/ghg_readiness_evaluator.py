# ================================================================================
# AUREX LAUNCHPAD™ GHG READINESS EVALUATOR API ROUTES
# Sub-Application #12: Comprehensive GHG Readiness Assessment System
# Module ID: LAU-GHG-012-API - GHG Readiness Evaluator API
# Created: August 8, 2025
# ================================================================================

from fastapi import APIRouter, Depends, HTTPException, Query, BackgroundTasks
from fastapi.security import HTTPBearer
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import and_, or_, desc, func
from typing import List, Dict, Optional, Any
from datetime import datetime, timedelta
from decimal import Decimal
import json
import uuid
import logging

# Import models and dependencies
from models.base_models import get_db
from models.ghg_readiness_models import (
    GHGReadinessAssessment, GHGAssessmentQuestion, GHGAssessmentResponse,
    GHGReadinessReport, GHGBenchmarkData, GHGImprovementPlan,
    GHGReadinessLevel, GHGReadinessSection, IndustryType,
    AssessmentStatus, ComplianceFramework
)

# Import services
from services.ghg_readiness_scoring import GHGReadinessScoringEngine

# Import schemas
from pydantic import BaseModel, Field, validator
from enum import Enum

# Configure logging
logger = logging.getLogger(__name__)

# Security
security = HTTPBearer()

# Create router
router = APIRouter(
    prefix="/api/ghg-readiness-evaluator",
    tags=["GHG Readiness Evaluator"],
    responses={404: {"description": "Not found"}}
)

# ================================================================================
# REQUEST/RESPONSE SCHEMAS
# ================================================================================

class GHGReadinessAssessmentCreate(BaseModel):
    """Schema for creating a new GHG readiness assessment"""
    title: str = Path(..., min_length=1, max_length=200)
    description: Optional[str] = Field(None, max_length=1000)
    industry_type: IndustryType
    organization_size: str = Field(..., description="small, medium, large, enterprise")
    compliance_frameworks: List[ComplianceFramework] = Field(default_factory=list)
    assessment_scope: Dict[str, Any] = Field(default_factory=dict)
    target_completion_date: Optional[datetime] = None

class GHGAssessmentResponseSubmit(BaseModel):
    """Schema for submitting assessment responses"""
    question_id: str
    answer_value: Any = Field(..., description="Answer value - can be boolean, string, number, or dict")
    confidence_level: Optional[int] = Field(None, ge=1, le=5)
    supporting_evidence: Optional[str] = None
    notes: Optional[str] = None

class GHGReadinessScoreResponse(BaseModel):
    """Schema for GHG readiness scoring response"""
    overall_score: float = Field(..., ge=0, le=100)
    readiness_level: GHGReadinessLevel
    section_scores: Dict[GHGReadinessSection, float]
    benchmark_comparison: Dict[str, Any]
    improvement_priorities: List[str]
    compliance_gaps: List[str]
    recommendations: List[str]

class GHGAssessmentListResponse(BaseModel):
    """Schema for assessment list response"""
    assessments: List[Dict[str, Any]]
    total_count: int
    page: int
    limit: int
    has_next: bool

# ================================================================================
# CORE GHG READINESS EVALUATOR ENDPOINTS
# ================================================================================

@router.post("/assessments", response_model=Dict[str, Any])
async def create_ghg_readiness_assessment(
    assessment_data: GHGReadinessAssessmentCreate,
    db: Session = Depends(get_db),
    current_user = Depends(security)
):
    """
    Create a new GHG Readiness Assessment
    
    This endpoint initiates a comprehensive GHG readiness evaluation based on:
    - GHG Protocol standards
    - ISO 14064-1 guidelines  
    - TCFD framework requirements
    - Sector-specific best practices
    """
    try:
        # Create new assessment
        assessment = GHGReadinessAssessment(
            id=str(uuid.uuid4()),
            user_id=current_user.get("sub"),  # From JWT token
            title=assessment_data.title,
            description=assessment_data.description,
            industry_type=assessment_data.industry_type,
            organization_size=assessment_data.organization_size,
            compliance_frameworks=assessment_data.compliance_frameworks,
            assessment_scope=assessment_data.assessment_scope,
            target_completion_date=assessment_data.target_completion_date,
            status=AssessmentStatus.NOT_STARTED,
            created_at=datetime.utcnow()
        )
        
        db.add(assessment)
        db.commit()
        db.refresh(assessment)
        
        logger.info(f"Created GHG readiness assessment {assessment.id} for user {current_user.get('sub')}")
        
        return {
            "assessment_id": assessment.id,
            "title": assessment.title,
            "status": assessment.status.value,
            "industry_type": assessment.industry_type.value,
            "created_at": assessment.created_at.isoformat(),
            "total_questions": 0,  # Will be populated when questions are loaded
            "estimated_duration": "45-60 minutes"
        }
        
    except Exception as e:
        logger.error(f"Error creating GHG readiness assessment: {str(e)}")
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to create assessment: {str(e)}")

@router.get("/assessments/{assessment_id}", response_model=Dict[str, Any])
async def get_ghg_readiness_assessment(
    assessment_id: str,
    db: Session = Depends(get_db),
    current_user = Depends(security)
):
    """Get detailed information about a specific GHG readiness assessment"""
    try:
        assessment = db.query(GHGReadinessAssessment).filter(
            GHGReadinessAssessment.id == assessment_id,
            GHGReadinessAssessment.user_id == current_user.get("sub"),
            GHGReadinessAssessment.deleted_at.is_(None)
        ).first()
        
        if not assessment:
            raise HTTPException(status_code=404, detail="Assessment not found")
        
        # Get responses count
        responses_count = db.query(GHGAssessmentResponse).filter(
            GHGAssessmentResponse.assessment_id == assessment_id,
            GHGAssessmentResponse.deleted_at.is_(None)
        ).count()
        
        # Calculate progress
        total_questions = 65  # Standard GHG readiness assessment has 65 questions
        progress_percentage = (responses_count / total_questions) * 100 if total_questions > 0 else 0
        
        return {
            "id": assessment.id,
            "title": assessment.title,
            "description": assessment.description,
            "status": assessment.status.value,
            "industry_type": assessment.industry_type.value,
            "organization_size": assessment.organization_size,
            "compliance_frameworks": [cf.value for cf in assessment.compliance_frameworks],
            "progress_percentage": round(progress_percentage, 1),
            "responses_count": responses_count,
            "total_questions": total_questions,
            "created_at": assessment.created_at.isoformat(),
            "updated_at": assessment.updated_at.isoformat() if assessment.updated_at else None,
            "target_completion_date": assessment.target_completion_date.isoformat() if assessment.target_completion_date else None
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error retrieving assessment {assessment_id}: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to retrieve assessment: {str(e)}")

@router.get("/assessments/{assessment_id}/questions", response_model=Dict[str, Any])
async def get_assessment_questions(
    assessment_id: str,
    section: Optional[GHGReadinessSection] = None,
    db: Session = Depends(get_db),
    current_user = Depends(security)
):
    """Get questions for a specific assessment, optionally filtered by section"""
    try:
        # Verify assessment ownership
        assessment = db.query(GHGReadinessAssessment).filter(
            GHGReadinessAssessment.id == assessment_id,
            GHGReadinessAssessment.user_id == current_user.get("sub"),
            GHGReadinessAssessment.deleted_at.is_(None)
        ).first()
        
        if not assessment:
            raise HTTPException(status_code=404, detail="Assessment not found")
        
        # Build query for questions
        query = db.query(GHGAssessmentQuestion).filter(
            GHGAssessmentQuestion.is_active == True
        )
        
        # Apply section filter if provided
        if section:
            query = query.filter(GHGAssessmentQuestion.section == section)
            
        # Apply industry-specific filtering
        query = query.filter(
            or_(
                GHGAssessmentQuestion.applicable_industries.is_(None),
                GHGAssessmentQuestion.applicable_industries.contains([assessment.industry_type.value])
            )
        )
        
        questions = query.order_by(
            GHGAssessmentQuestion.section,
            GHGAssessmentQuestion.display_order
        ).all()
        
        # Get existing responses
        existing_responses = {}
        if questions:
            responses = db.query(GHGAssessmentResponse).filter(
                GHGAssessmentResponse.assessment_id == assessment_id,
                GHGAssessmentResponse.deleted_at.is_(None)
            ).all()
            
            existing_responses = {resp.question_id: resp for resp in responses}
        
        # Format questions with responses
        formatted_questions = []
        for question in questions:
            response = existing_responses.get(question.id)
            
            formatted_question = {
                "id": question.id,
                "section": question.section.value,
                "question_text": question.question_text,
                "question_type": question.question_type.value,
                "display_order": question.display_order,
                "required": question.required,
                "weight": question.weight,
                "help_text": question.help_text,
                "options": question.options,
                "validation_rules": question.validation_rules,
                "conditional_logic": question.conditional_logic,
                "response": {
                    "answer_value": response.answer_value if response else None,
                    "confidence_level": response.confidence_level if response else None,
                    "supporting_evidence": response.supporting_evidence if response else None,
                    "notes": response.notes if response else None,
                    "answered_at": response.created_at.isoformat() if response else None
                }
            }
            formatted_questions.append(formatted_question)
        
        return {
            "assessment_id": assessment_id,
            "section": section.value if section else "all",
            "questions": formatted_questions,
            "total_questions": len(formatted_questions)
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error retrieving questions for assessment {assessment_id}: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to retrieve questions: {str(e)}")

@router.post("/assessments/{assessment_id}/responses", response_model=Dict[str, Any])
async def submit_assessment_response(
    assessment_id: str,
    response_data: GHGAssessmentResponseSubmit,
    db: Session = Depends(get_db),
    current_user = Depends(security)
):
    """Submit or update a response to an assessment question"""
    try:
        # Verify assessment ownership
        assessment = db.query(GHGReadinessAssessment).filter(
            GHGReadinessAssessment.id == assessment_id,
            GHGReadinessAssessment.user_id == current_user.get("sub"),
            GHGReadinessAssessment.deleted_at.is_(None)
        ).first()
        
        if not assessment:
            raise HTTPException(status_code=404, detail="Assessment not found")
        
        # Verify question exists and is applicable
        question = db.query(GHGAssessmentQuestion).filter(
            GHGAssessmentQuestion.id == response_data.question_id,
            GHGAssessmentQuestion.is_active == True
        ).first()
        
        if not question:
            raise HTTPException(status_code=404, detail="Question not found")
        
        # Check for existing response
        existing_response = db.query(GHGAssessmentResponse).filter(
            GHGAssessmentResponse.assessment_id == assessment_id,
            GHGAssessmentResponse.question_id == response_data.question_id,
            GHGAssessmentResponse.deleted_at.is_(None)
        ).first()
        
        if existing_response:
            # Update existing response
            existing_response.answer_value = response_data.answer_value
            existing_response.confidence_level = response_data.confidence_level
            existing_response.supporting_evidence = response_data.supporting_evidence
            existing_response.notes = response_data.notes
            existing_response.updated_at = datetime.utcnow()
            response_obj = existing_response
        else:
            # Create new response
            response_obj = GHGAssessmentResponse(
                id=str(uuid.uuid4()),
                assessment_id=assessment_id,
                question_id=response_data.question_id,
                answer_value=response_data.answer_value,
                confidence_level=response_data.confidence_level,
                supporting_evidence=response_data.supporting_evidence,
                notes=response_data.notes,
                created_at=datetime.utcnow()
            )
            db.add(response_obj)
        
        # Update assessment status if it's the first response
        if assessment.status == AssessmentStatus.NOT_STARTED:
            assessment.status = AssessmentStatus.IN_PROGRESS
            assessment.updated_at = datetime.utcnow()
        
        db.commit()
        db.refresh(response_obj)
        
        # Calculate updated progress
        total_responses = db.query(GHGAssessmentResponse).filter(
            GHGAssessmentResponse.assessment_id == assessment_id,
            GHGAssessmentResponse.deleted_at.is_(None)
        ).count()
        
        progress_percentage = (total_responses / 65) * 100  # 65 total questions
        
        return {
            "response_id": response_obj.id,
            "assessment_id": assessment_id,
            "question_id": response_data.question_id,
            "answer_recorded": True,
            "progress_percentage": round(progress_percentage, 1),
            "total_responses": total_responses,
            "updated_at": response_obj.updated_at.isoformat() if response_obj.updated_at else response_obj.created_at.isoformat()
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error submitting response for assessment {assessment_id}: {str(e)}")
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to submit response: {str(e)}")

@router.post("/assessments/{assessment_id}/calculate-score", response_model=GHGReadinessScoreResponse)
async def calculate_ghg_readiness_score(
    assessment_id: str,
    db: Session = Depends(get_db),
    current_user = Depends(security)
):
    """Calculate comprehensive GHG readiness score and generate recommendations"""
    try:
        # Verify assessment ownership
        assessment = db.query(GHGReadinessAssessment).filter(
            GHGReadinessAssessment.id == assessment_id,
            GHGReadinessAssessment.user_id == current_user.get("sub"),
            GHGReadinessAssessment.deleted_at.is_(None)
        ).first()
        
        if not assessment:
            raise HTTPException(status_code=404, detail="Assessment not found")
        
        # Get all responses
        responses = db.query(GHGAssessmentResponse).filter(
            GHGAssessmentResponse.assessment_id == assessment_id,
            GHGAssessmentResponse.deleted_at.is_(None)
        ).all()
        
        if len(responses) < 30:  # Minimum responses required for scoring
            raise HTTPException(
                status_code=400, 
                detail="Insufficient responses for scoring. Please complete at least 30 questions."
            )
        
        # Initialize scoring engine
        scoring_engine = GHGReadinessScoringEngine()
        
        # Calculate scores
        scoring_result = await scoring_engine.calculate_readiness_score(
            assessment_id=assessment_id,
            responses=responses,
            industry_type=assessment.industry_type,
            organization_size=assessment.organization_size
        )
        
        # Update assessment with final score
        assessment.final_score = scoring_result["overall_score"]
        assessment.readiness_level = scoring_result["readiness_level"]
        assessment.status = AssessmentStatus.COMPLETED
        assessment.completed_at = datetime.utcnow()
        assessment.updated_at = datetime.utcnow()
        
        db.commit()
        
        logger.info(f"Calculated GHG readiness score for assessment {assessment_id}: {scoring_result['overall_score']}")
        
        return GHGReadinessScoreResponse(**scoring_result)
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error calculating score for assessment {assessment_id}: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to calculate score: {str(e)}")

@router.get("/assessments", response_model=GHGAssessmentListResponse)
async def list_ghg_readiness_assessments(
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    status: Optional[AssessmentStatus] = None,
    industry: Optional[IndustryType] = None,
    db: Session = Depends(get_db),
    current_user = Depends(security)
):
    """List all GHG readiness assessments for the current user"""
    try:
        # Build base query
        query = db.query(GHGReadinessAssessment).filter(
            GHGReadinessAssessment.user_id == current_user.get("sub"),
            GHGReadinessAssessment.deleted_at.is_(None)
        )
        
        # Apply filters
        if status:
            query = query.filter(GHGReadinessAssessment.status == status)
        if industry:
            query = query.filter(GHGReadinessAssessment.industry_type == industry)
        
        # Get total count
        total_count = query.count()
        
        # Apply pagination
        offset = (page - 1) * limit
        assessments = query.order_by(desc(GHGReadinessAssessment.created_at)).offset(offset).limit(limit).all()
        
        # Format response
        formatted_assessments = []
        for assessment in assessments:
            responses_count = db.query(GHGAssessmentResponse).filter(
                GHGAssessmentResponse.assessment_id == assessment.id,
                GHGAssessmentResponse.deleted_at.is_(None)
            ).count()
            
            progress_percentage = (responses_count / 65) * 100  # 65 total questions
            
            formatted_assessment = {
                "id": assessment.id,
                "title": assessment.title,
                "status": assessment.status.value,
                "industry_type": assessment.industry_type.value,
                "organization_size": assessment.organization_size,
                "progress_percentage": round(progress_percentage, 1),
                "final_score": assessment.final_score,
                "readiness_level": assessment.readiness_level.value if assessment.readiness_level else None,
                "created_at": assessment.created_at.isoformat(),
                "updated_at": assessment.updated_at.isoformat() if assessment.updated_at else None,
                "completed_at": assessment.completed_at.isoformat() if assessment.completed_at else None
            }
            formatted_assessments.append(formatted_assessment)
        
        has_next = offset + limit < total_count
        
        return GHGAssessmentListResponse(
            assessments=formatted_assessments,
            total_count=total_count,
            page=page,
            limit=limit,
            has_next=has_next
        )
        
    except Exception as e:
        logger.error(f"Error listing assessments for user {current_user.get('sub')}: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to list assessments: {str(e)}")

@router.get("/statistics", response_model=Dict[str, Any])
async def get_ghg_readiness_statistics(
    db: Session = Depends(get_db),
    current_user = Depends(security)
):
    """Get comprehensive GHG readiness statistics for the current user"""
    try:
        # Get basic statistics
        total_assessments = db.query(GHGReadinessAssessment).filter(
            GHGReadinessAssessment.user_id == current_user.get("sub"),
            GHGReadinessAssessment.deleted_at.is_(None)
        ).count()
        
        completed_assessments = db.query(GHGReadinessAssessment).filter(
            GHGReadinessAssessment.user_id == current_user.get("sub"),
            GHGReadinessAssessment.status == AssessmentStatus.COMPLETED,
            GHGReadinessAssessment.deleted_at.is_(None)
        ).count()
        
        # Get average score
        avg_score_result = db.query(func.avg(GHGReadinessAssessment.final_score)).filter(
            GHGReadinessAssessment.user_id == current_user.get("sub"),
            GHGReadinessAssessment.status == AssessmentStatus.COMPLETED,
            GHGReadinessAssessment.deleted_at.is_(None)
        ).first()
        
        average_score = float(avg_score_result[0]) if avg_score_result[0] else 0.0
        
        # Get industry distribution
        industry_stats = db.query(
            GHGReadinessAssessment.industry_type,
            func.count(GHGReadinessAssessment.id)
        ).filter(
            GHGReadinessAssessment.user_id == current_user.get("sub"),
            GHGReadinessAssessment.deleted_at.is_(None)
        ).group_by(GHGReadinessAssessment.industry_type).all()
        
        industry_distribution = {industry.value: count for industry, count in industry_stats}
        
        # Get readiness level distribution
        level_stats = db.query(
            GHGReadinessAssessment.readiness_level,
            func.count(GHGReadinessAssessment.id)
        ).filter(
            GHGReadinessAssessment.user_id == current_user.get("sub"),
            GHGReadinessAssessment.status == AssessmentStatus.COMPLETED,
            GHGReadinessAssessment.deleted_at.is_(None)
        ).group_by(GHGReadinessAssessment.readiness_level).all()
        
        level_distribution = {
            level.value: count for level, count in level_stats if level is not None
        }
        
        return {
            "total_assessments": total_assessments,
            "completed_assessments": completed_assessments,
            "in_progress_assessments": total_assessments - completed_assessments,
            "average_score": round(average_score, 1),
            "completion_rate": round((completed_assessments / total_assessments * 100), 1) if total_assessments > 0 else 0,
            "industry_distribution": industry_distribution,
            "readiness_level_distribution": level_distribution,
            "assessment_trend": {
                "this_month": 0,  # TODO: Implement time-based statistics
                "last_month": 0,
                "growth_rate": 0
            }
        }
        
    except Exception as e:
        logger.error(f"Error retrieving statistics for user {current_user.get('sub')}: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to retrieve statistics: {str(e)}")

# ================================================================================
# HEALTH CHECK ENDPOINT
# ================================================================================

@router.get("/health")
async def health_check():
    """Health check endpoint for GHG Readiness Evaluator service"""
    return {
        "service": "GHG Readiness Evaluator",
        "status": "healthy",
        "version": "1.0.0",
        "timestamp": datetime.utcnow().isoformat(),
        "features": [
            "GHG Protocol compliance assessment",
            "ISO 14064-1 readiness evaluation",
            "TCFD framework alignment",
            "Industry-specific benchmarking",
            "Real-time scoring and recommendations"
        ]
    }