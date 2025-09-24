#!/usr/bin/env python3
# ================================================================================
# AUREX LAUNCHPAD™ ESG ASSESSMENTS ROUTER
# Multi-framework ESG assessment endpoints with AI-powered analytics
# Agent: ESG Assessment Intelligence Agent
# ================================================================================

from fastapi import APIRouter, Depends, HTTPException, status, Query, UploadFile, File
from sqlalchemy.orm import Session
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from datetime import datetime
from uuid import UUID

from models.base_models import get_db
from models.auth_models import User
from models.esg_models import (
    ESGAssessment, ESGFrameworkTemplate, AssessmentQuestion, 
    AssessmentResponse, AssessmentCollaboration, ESGFramework, 
    AssessmentStatus, ScoringMethod
)
from routers.auth import get_current_user
from services.document_intelligence import DocumentIntelligenceService
from config import get_settings

router = APIRouter(prefix="/api/v1/assessments", tags=["ESG Assessments"])
settings = get_settings()

# ================================================================================
# PYDANTIC MODELS
# ================================================================================

class AssessmentCreateRequest(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)
    description: Optional[str] = Field(None, max_length=1000)
    framework_type: ESGFramework
    template_id: Optional[UUID] = None
    target_completion_date: Optional[datetime] = None

class AssessmentUpdateRequest(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=255)
    description: Optional[str] = Field(None, max_length=1000)
    status: Optional[AssessmentStatus] = None
    target_completion_date: Optional[datetime] = None

class QuestionResponseRequest(BaseModel):
    question_id: UUID
    response_value: str
    evidence_text: Optional[str] = None
    confidence_score: Optional[float] = Field(None, ge=0.0, le=1.0)
    notes: Optional[str] = None

class AssessmentResponse(BaseModel):
    id: UUID
    name: str
    description: Optional[str]
    framework_type: ESGFramework
    status: AssessmentStatus
    overall_score: Optional[float]
    completion_percentage: float
    created_at: datetime
    updated_at: datetime
    created_by_name: str
    
    class Config:
        from_attributes = True

class DetailedAssessmentResponse(AssessmentResponse):
    questions_total: int
    questions_answered: int
    collaborators_count: int
    last_activity: Optional[datetime]
    target_completion_date: Optional[datetime]

class FrameworkTemplateResponse(BaseModel):
    id: UUID
    framework_type: ESGFramework
    name: str
    description: Optional[str]
    version: str
    scoring_method: ScoringMethod
    questions_count: int
    created_at: datetime
    
    class Config:
        from_attributes = True

# ================================================================================
# ASSESSMENT MANAGEMENT ENDPOINTS
# ================================================================================

@router.get("/", response_model=List[AssessmentResponse])
async def list_assessments(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    framework: Optional[ESGFramework] = Query(None),
    status: Optional[AssessmentStatus] = Query(None),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """List ESG assessments for the current user's organization"""
    
    query = db.query(ESGAssessment).filter(
        ESGAssessment.organization_id == current_user.current_organization_id
    )
    
    if framework:
        query = query.filter(ESGAssessment.framework_type == framework)
    
    if status:
        query = query.filter(ESGAssessment.status == status)
    
    assessments = query.offset(skip).limit(limit).all()
    
    return [
        AssessmentResponse(
            **assessment.__dict__,
            created_by_name=f"{assessment.created_by.first_name} {assessment.created_by.last_name}"
        )
        for assessment in assessments
    ]

@router.post("/", response_model=DetailedAssessmentResponse)
async def create_assessment(
    assessment_data: AssessmentCreateRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Create a new ESG assessment"""
    
    # Get or create framework template
    template = None
    if assessment_data.template_id:
        template = db.query(ESGFrameworkTemplate).filter(
            ESGFrameworkTemplate.id == assessment_data.template_id,
            ESGFrameworkTemplate.framework_type == assessment_data.framework_type
        ).first()
        
        if not template:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Framework template not found"
            )
    else:
        # Get default template for framework
        template = db.query(ESGFrameworkTemplate).filter(
            ESGFrameworkTemplate.framework_type == assessment_data.framework_type,
            ESGFrameworkTemplate.is_default == True
        ).first()
    
    if not template:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"No template available for {assessment_data.framework_type.value} framework"
        )
    
    # Create assessment
    assessment = ESGAssessment(
        name=assessment_data.name,
        description=assessment_data.description,
        framework_type=assessment_data.framework_type,
        template_id=template.id,
        organization_id=current_user.current_organization_id,
        created_by_id=current_user.id,
        target_completion_date=assessment_data.target_completion_date,
        status=AssessmentStatus.DRAFT
    )
    
    db.add(assessment)
    db.flush()
    
    # Create assessment questions from template
    template_questions = db.query(AssessmentQuestion).filter(
        AssessmentQuestion.template_id == template.id
    ).all()
    
    for template_question in template_questions:
        assessment_question = AssessmentQuestion(
            assessment_id=assessment.id,
            template_id=template.id,
            category=template_question.category,
            subcategory=template_question.subcategory,
            question_text=template_question.question_text,
            question_type=template_question.question_type,
            required=template_question.required,
            weight=template_question.weight,
            display_order=template_question.display_order,
            guidance_text=template_question.guidance_text
        )
        db.add(assessment_question)
    
    db.commit()
    db.refresh(assessment)
    
    # Calculate metrics
    questions_total = len(template_questions)
    
    return DetailedAssessmentResponse(
        **assessment.__dict__,
        created_by_name=f"{current_user.first_name} {current_user.last_name}",
        questions_total=questions_total,
        questions_answered=0,
        collaborators_count=1,
        last_activity=assessment.created_at
    )

@router.get("/{assessment_id}", response_model=DetailedAssessmentResponse)
async def get_assessment(
    assessment_id: UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get detailed assessment information"""
    
    assessment = db.query(ESGAssessment).filter(
        ESGAssessment.id == assessment_id,
        ESGAssessment.organization_id == current_user.current_organization_id
    ).first()
    
    if not assessment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Assessment not found"
        )
    
    # Calculate metrics
    questions_total = db.query(AssessmentQuestion).filter(
        AssessmentQuestion.assessment_id == assessment_id
    ).count()
    
    questions_answered = db.query(AssessmentResponse).filter(
        AssessmentResponse.assessment_id == assessment_id
    ).count()
    
    collaborators_count = db.query(AssessmentCollaboration).filter(
        AssessmentCollaboration.assessment_id == assessment_id
    ).count()
    
    return DetailedAssessmentResponse(
        **assessment.__dict__,
        created_by_name=f"{assessment.created_by.first_name} {assessment.created_by.last_name}",
        questions_total=questions_total,
        questions_answered=questions_answered,
        collaborators_count=collaborators_count,
        last_activity=assessment.updated_at
    )

@router.put("/{assessment_id}", response_model=DetailedAssessmentResponse)
async def update_assessment(
    assessment_id: UUID,
    update_data: AssessmentUpdateRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update assessment details"""
    
    assessment = db.query(ESGAssessment).filter(
        ESGAssessment.id == assessment_id,
        ESGAssessment.organization_id == current_user.current_organization_id
    ).first()
    
    if not assessment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Assessment not found"
        )
    
    # Update fields
    update_dict = update_data.dict(exclude_unset=True)
    for field, value in update_dict.items():
        setattr(assessment, field, value)
    
    assessment.updated_at = datetime.utcnow()
    
    db.commit()
    db.refresh(assessment)
    
    # Calculate metrics
    questions_total = db.query(AssessmentQuestion).filter(
        AssessmentQuestion.assessment_id == assessment_id
    ).count()
    
    questions_answered = db.query(AssessmentResponse).filter(
        AssessmentResponse.assessment_id == assessment_id
    ).count()
    
    collaborators_count = db.query(AssessmentCollaboration).filter(
        AssessmentCollaboration.assessment_id == assessment_id
    ).count()
    
    return DetailedAssessmentResponse(
        **assessment.__dict__,
        created_by_name=f"{assessment.created_by.first_name} {assessment.created_by.last_name}",
        questions_total=questions_total,
        questions_answered=questions_answered,
        collaborators_count=collaborators_count,
        last_activity=assessment.updated_at
    )

@router.delete("/{assessment_id}")
async def delete_assessment(
    assessment_id: UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Delete assessment (soft delete)"""
    
    assessment = db.query(ESGAssessment).filter(
        ESGAssessment.id == assessment_id,
        ESGAssessment.organization_id == current_user.current_organization_id
    ).first()
    
    if not assessment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Assessment not found"
        )
    
    assessment.soft_delete()
    db.commit()
    
    return {"message": "Assessment deleted successfully"}

# ================================================================================
# ASSESSMENT QUESTIONS & RESPONSES
# ================================================================================

@router.get("/{assessment_id}/questions")
async def get_assessment_questions(
    assessment_id: UUID,
    category: Optional[str] = Query(None),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get assessment questions with responses"""
    
    # Verify assessment access
    assessment = db.query(ESGAssessment).filter(
        ESGAssessment.id == assessment_id,
        ESGAssessment.organization_id == current_user.current_organization_id
    ).first()
    
    if not assessment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Assessment not found"
        )
    
    query = db.query(AssessmentQuestion).filter(
        AssessmentQuestion.assessment_id == assessment_id
    )
    
    if category:
        query = query.filter(AssessmentQuestion.category == category)
    
    questions = query.order_by(AssessmentQuestion.display_order).all()
    
    # Get existing responses
    responses = {
        resp.question_id: resp 
        for resp in db.query(AssessmentResponse).filter(
            AssessmentResponse.assessment_id == assessment_id
        ).all()
    }
    
    return [
        {
            **question.__dict__,
            "response": responses.get(question.id).__dict__ if question.id in responses else None
        }
        for question in questions
    ]

@router.post("/{assessment_id}/responses")
async def submit_question_response(
    assessment_id: UUID,
    response_data: QuestionResponseRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Submit or update response to assessment question"""
    
    # Verify assessment access
    assessment = db.query(ESGAssessment).filter(
        ESGAssessment.id == assessment_id,
        ESGAssessment.organization_id == current_user.current_organization_id
    ).first()
    
    if not assessment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Assessment not found"
        )
    
    # Verify question exists
    question = db.query(AssessmentQuestion).filter(
        AssessmentQuestion.id == response_data.question_id,
        AssessmentQuestion.assessment_id == assessment_id
    ).first()
    
    if not question:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Question not found"
        )
    
    # Check if response already exists
    existing_response = db.query(AssessmentResponse).filter(
        AssessmentResponse.assessment_id == assessment_id,
        AssessmentResponse.question_id == response_data.question_id
    ).first()
    
    if existing_response:
        # Update existing response
        existing_response.response_value = response_data.response_value
        existing_response.evidence_text = response_data.evidence_text
        existing_response.confidence_score = response_data.confidence_score
        existing_response.notes = response_data.notes
        existing_response.updated_at = datetime.utcnow()
        existing_response.updated_by_id = current_user.id
        
        response = existing_response
    else:
        # Create new response
        response = AssessmentResponse(
            assessment_id=assessment_id,
            question_id=response_data.question_id,
            response_value=response_data.response_value,
            evidence_text=response_data.evidence_text,
            confidence_score=response_data.confidence_score,
            notes=response_data.notes,
            created_by_id=current_user.id
        )
        db.add(response)
    
    # Update assessment status and completion
    assessment.updated_at = datetime.utcnow()
    if assessment.status == AssessmentStatus.DRAFT:
        assessment.status = AssessmentStatus.IN_PROGRESS
    
    db.commit()
    db.refresh(response)
    
    return {"message": "Response submitted successfully", "response": response}

# ================================================================================
# FRAMEWORK TEMPLATES
# ================================================================================

@router.get("/frameworks/templates", response_model=List[FrameworkTemplateResponse])
async def list_framework_templates(
    framework: Optional[ESGFramework] = Query(None),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """List available ESG framework templates"""
    
    query = db.query(ESGFrameworkTemplate)
    
    if framework:
        query = query.filter(ESGFrameworkTemplate.framework_type == framework)
    
    templates = query.all()
    
    result = []
    for template in templates:
        questions_count = db.query(AssessmentQuestion).filter(
            AssessmentQuestion.template_id == template.id
        ).count()
        
        result.append(FrameworkTemplateResponse(
            **template.__dict__,
            questions_count=questions_count
        ))
    
    return result

# ================================================================================
# ASSESSMENT ANALYTICS
# ================================================================================

@router.get("/{assessment_id}/analytics")
async def get_assessment_analytics(
    assessment_id: UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get assessment analytics and insights"""
    
    assessment = db.query(ESGAssessment).filter(
        ESGAssessment.id == assessment_id,
        ESGAssessment.organization_id == current_user.current_organization_id
    ).first()
    
    if not assessment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Assessment not found"
        )
    
    # Calculate completion metrics
    total_questions = db.query(AssessmentQuestion).filter(
        AssessmentQuestion.assessment_id == assessment_id
    ).count()
    
    answered_questions = db.query(AssessmentResponse).filter(
        AssessmentResponse.assessment_id == assessment_id
    ).count()
    
    # Get category breakdown
    category_stats = db.query(
        AssessmentQuestion.category,
        db.func.count(AssessmentQuestion.id).label('total'),
        db.func.count(AssessmentResponse.id).label('answered')
    ).outerjoin(
        AssessmentResponse,
        AssessmentQuestion.id == AssessmentResponse.question_id
    ).filter(
        AssessmentQuestion.assessment_id == assessment_id
    ).group_by(AssessmentQuestion.category).all()
    
    return {
        "assessment_id": assessment_id,
        "completion_metrics": {
            "total_questions": total_questions,
            "answered_questions": answered_questions,
            "completion_percentage": (answered_questions / total_questions * 100) if total_questions > 0 else 0,
            "remaining_questions": total_questions - answered_questions
        },
        "category_breakdown": [
            {
                "category": stat.category,
                "total_questions": stat.total,
                "answered_questions": stat.answered or 0,
                "completion_percentage": ((stat.answered or 0) / stat.total * 100) if stat.total > 0 else 0
            }
            for stat in category_stats
        ],
        "overall_score": assessment.overall_score,
        "framework_type": assessment.framework_type.value,
        "status": assessment.status.value
    }

# ================================================================================
# DOCUMENT UPLOAD & AI ANALYSIS
# ================================================================================

@router.post("/{assessment_id}/documents/upload")
async def upload_assessment_document(
    assessment_id: UUID,
    file: UploadFile = File(...),
    question_id: Optional[UUID] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Upload and analyze document for assessment evidence"""
    
    # Verify assessment access
    assessment = db.query(ESGAssessment).filter(
        ESGAssessment.id == assessment_id,
        ESGAssessment.organization_id == current_user.current_organization_id
    ).first()
    
    if not assessment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Assessment not found"
        )
    
    try:
        # Initialize document intelligence service
        doc_service = DocumentIntelligenceService()
        
        # Process document
        result = await doc_service.process_document(file, str(assessment_id))
        
        return {
            "message": "Document processed successfully",
            "document_id": result.document_id,
            "insights": result.insights,
            "extracted_data": result.extracted_data,
            "confidence_score": result.confidence_score
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Document processing failed: {str(e)}"
        )