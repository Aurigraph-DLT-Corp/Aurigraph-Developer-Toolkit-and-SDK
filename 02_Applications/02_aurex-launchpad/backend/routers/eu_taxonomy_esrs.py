# ================================================================================
# AUREX LAUNCHPAD™ EU TAXONOMY & ESRS COMPLIANCE API ROUTES
# Sub-Application #3: European Sustainability Reporting Standards Compliance
# Module ID: LAU-EU-003-API - EU Taxonomy & ESRS Compliance API  
# Created: August 8, 2025
# ================================================================================

from fastapi import APIRouter, Depends, HTTPException, Query, BackgroundTasks
from fastapi.security import HTTPBearer
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import and_, or_, desc, func
from typing import List, Dict, Optional, Any, Union
from datetime import datetime, timedelta
from decimal import Decimal
import json
import uuid
import logging

# Import models and dependencies
from models.base_models import get_db
from models.eu_taxonomy_models import (
    EUTaxonomyAssessment, TaxonomyActivity, TaxonomyObjective, 
    AlignmentCriteria, MaterialityAssessment, ESRSCompliance,
    CSRDReport, DoubleMaturityAssessment, DueDiligenceRecord,
    SafeguardCompliance, TechnicalScreeningCriteria,
    TaxonomyAlignment, MaterialityType, ComplianceStatus,
    EnvironmentalObjective, ESRSStandard, SafeguardPrinciple
)

# Import services
from services.eu_taxonomy_engine import EUTaxonomyEngine, ESRSComplianceEngine

# Import schemas
from pydantic import BaseModel, Field, validator
from enum import Enum

# Configure logging
logger = logging.getLogger(__name__)

# Security
security = HTTPBearer()

# Create router
router = APIRouter(
    prefix="/api/eu-taxonomy-esrs",
    tags=["EU Taxonomy & ESRS Compliance"],
    responses={404: {"description": "Not found"}}
)

# ================================================================================
# REQUEST/RESPONSE SCHEMAS
# ================================================================================

class EUTaxonomyAssessmentCreate(BaseModel):
    """Schema for creating a new EU Taxonomy assessment"""
    title: str = Path(..., min_length=1, max_length=200)
    description: Optional[str] = Field(None, max_length=1000)
    organization_id: str
    reporting_period: str = Field(..., description="YYYY format, e.g., '2024'")
    assessment_scope: Dict[str, Any] = Field(default_factory=dict)
    selected_objectives: List[EnvironmentalObjective] = Field(default_factory=list)
    economic_activities: List[str] = Field(default_factory=list, description="NACE codes")
    materiality_threshold: float = Field(default=5.0, ge=0, le=100)

class DoubleMaturityAssessmentCreate(BaseModel):
    """Schema for double materiality assessment creation"""
    assessment_id: str
    topic: str = Path(..., min_length=1, max_length=200)
    impact_materiality_score: float = Field(..., ge=0, le=5)
    financial_materiality_score: float = Field(..., ge=0, le=5)
    stakeholder_input: Optional[Dict[str, Any]] = Field(default_factory=dict)
    evidence_provided: Optional[List[str]] = Field(default_factory=list)
    time_horizon: str = Field(..., description="short_term, medium_term, long_term")

class TechnicalScreeningResponse(BaseModel):
    """Schema for technical screening criteria response"""
    criteria_id: str
    compliance_status: ComplianceStatus
    evidence_description: str
    quantitative_data: Optional[Dict[str, Any]] = Field(default_factory=dict)
    supporting_documents: Optional[List[str]] = Field(default_factory=list)
    confidence_level: int = Path(..., ge=1, le=5)

class ESRSComplianceResponse(BaseModel):
    """Schema for ESRS compliance reporting response"""
    standard: ESRSStandard
    disclosure_requirement: str
    compliance_status: ComplianceStatus
    reported_data: Dict[str, Any] = Field(default_factory=dict)
    data_quality_assessment: Optional[str] = None
    external_assurance: bool = False

# ================================================================================
# CORE EU TAXONOMY ENDPOINTS
# ================================================================================

@router.post("/assessments", response_model=Dict[str, Any])
async def create_eu_taxonomy_assessment(
    assessment_data: EUTaxonomyAssessmentCreate,
    db: Session = Depends(get_db),
    current_user = Depends(security)
):
    """
    Create a new EU Taxonomy alignment assessment
    
    This endpoint initiates a comprehensive EU Taxonomy assessment covering:
    - 6 Environmental objectives alignment evaluation
    - Technical screening criteria compliance
    - Do No Significant Harm (DNSH) assessment
    - Minimum safeguards compliance verification
    """
    try:
        # Create new assessment
        assessment = EUTaxonomyAssessment(
            id=str(uuid.uuid4()),
            user_id=current_user.get("sub"),
            organization_id=assessment_data.organization_id,
            title=assessment_data.title,
            description=assessment_data.description,
            reporting_period=assessment_data.reporting_period,
            assessment_scope=assessment_data.assessment_scope,
            selected_objectives=assessment_data.selected_objectives,
            economic_activities=assessment_data.economic_activities,
            materiality_threshold=assessment_data.materiality_threshold,
            status=ComplianceStatus.IN_PROGRESS,
            created_at=datetime.utcnow()
        )
        
        db.add(assessment)
        db.commit()
        db.refresh(assessment)
        
        # Initialize EU Taxonomy engine
        taxonomy_engine = EUTaxonomyEngine()
        
        # Generate initial technical screening criteria
        await taxonomy_engine.initialize_screening_criteria(
            assessment_id=assessment.id,
            selected_objectives=assessment_data.selected_objectives,
            economic_activities=assessment_data.economic_activities
        )
        
        logger.info(f"Created EU Taxonomy assessment {assessment.id} for organization {assessment_data.organization_id}")
        
        return {
            "assessment_id": assessment.id,
            "title": assessment.title,
            "status": assessment.status.value,
            "reporting_period": assessment.reporting_period,
            "selected_objectives": [obj.value for obj in assessment.selected_objectives],
            "economic_activities_count": len(assessment.economic_activities),
            "created_at": assessment.created_at.isoformat(),
            "estimated_duration": "8-12 hours across multiple sessions",
            "next_steps": [
                "Complete double materiality assessment",
                "Evaluate technical screening criteria",
                "Assess DNSH compliance",
                "Verify minimum safeguards"
            ]
        }
        
    except Exception as e:
        logger.error(f"Error creating EU Taxonomy assessment: {str(e)}")
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to create assessment: {str(e)}")

@router.get("/assessments/{assessment_id}", response_model=Dict[str, Any])
async def get_eu_taxonomy_assessment(
    assessment_id: str,
    db: Session = Depends(get_db),
    current_user = Depends(security)
):
    """Get detailed information about a specific EU Taxonomy assessment"""
    try:
        assessment = db.query(EUTaxonomyAssessment).filter(
            EUTaxonomyAssessment.id == assessment_id,
            EUTaxonomyAssessment.user_id == current_user.get("sub"),
            EUTaxonomyAssessment.deleted_at.is_(None)
        ).first()
        
        if not assessment:
            raise HTTPException(status_code=404, detail="Assessment not found")
        
        # Get progress statistics
        materiality_assessments = db.query(DoubleMaturityAssessment).filter(
            DoubleMaturityAssessment.assessment_id == assessment_id,
            DoubleMaturityAssessment.deleted_at.is_(None)
        ).count()
        
        technical_criteria = db.query(TechnicalScreeningCriteria).filter(
            TechnicalScreeningCriteria.assessment_id == assessment_id,
            TechnicalScreeningCriteria.deleted_at.is_(None)
        ).count()
        
        completed_criteria = db.query(TechnicalScreeningCriteria).filter(
            TechnicalScreeningCriteria.assessment_id == assessment_id,
            TechnicalScreeningCriteria.compliance_status == ComplianceStatus.COMPLIANT,
            TechnicalScreeningCriteria.deleted_at.is_(None)
        ).count()
        
        # Calculate overall progress
        total_requirements = materiality_assessments + technical_criteria
        completed_requirements = completed_criteria
        progress_percentage = (completed_requirements / total_requirements) * 100 if total_requirements > 0 else 0
        
        return {
            "id": assessment.id,
            "title": assessment.title,
            "description": assessment.description,
            "status": assessment.status.value,
            "reporting_period": assessment.reporting_period,
            "selected_objectives": [obj.value for obj in assessment.selected_objectives],
            "economic_activities": assessment.economic_activities,
            "materiality_threshold": assessment.materiality_threshold,
            "progress_percentage": round(progress_percentage, 1),
            "materiality_assessments_count": materiality_assessments,
            "technical_criteria_count": technical_criteria,
            "completed_criteria_count": completed_criteria,
            "created_at": assessment.created_at.isoformat(),
            "updated_at": assessment.updated_at.isoformat() if assessment.updated_at else None,
            "taxonomy_alignment_summary": {
                "eligible_activities": len([act for act in assessment.economic_activities if act]),
                "aligned_activities": 0,  # To be calculated based on completed assessments
                "alignment_percentage": 0.0
            }
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error retrieving EU Taxonomy assessment {assessment_id}: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to retrieve assessment: {str(e)}")

@router.post("/assessments/{assessment_id}/double-materiality", response_model=Dict[str, Any])
async def conduct_double_materiality_assessment(
    assessment_id: str,
    materiality_data: DoubleMaturityAssessmentCreate,
    db: Session = Depends(get_db),
    current_user = Depends(security)
):
    """
    Conduct double materiality assessment for specific sustainability topics
    
    Double materiality assessment evaluates:
    1. Impact materiality: Organization's impact on people and environment
    2. Financial materiality: Sustainability matters' financial impact on organization
    """
    try:
        # Verify assessment ownership
        assessment = db.query(EUTaxonomyAssessment).filter(
            EUTaxonomyAssessment.id == assessment_id,
            EUTaxonomyAssessment.user_id == current_user.get("sub"),
            EUTaxonomyAssessment.deleted_at.is_(None)
        ).first()
        
        if not assessment:
            raise HTTPException(status_code=404, detail="Assessment not found")
        
        # Check for existing materiality assessment
        existing_assessment = db.query(DoubleMaturityAssessment).filter(
            DoubleMaturityAssessment.assessment_id == assessment_id,
            DoubleMaturityAssessment.topic == materiality_data.topic,
            DoubleMaturityAssessment.deleted_at.is_(None)
        ).first()
        
        if existing_assessment:
            # Update existing assessment
            existing_assessment.impact_materiality_score = materiality_data.impact_materiality_score
            existing_assessment.financial_materiality_score = materiality_data.financial_materiality_score
            existing_assessment.stakeholder_input = materiality_data.stakeholder_input
            existing_assessment.evidence_provided = materiality_data.evidence_provided
            existing_assessment.time_horizon = materiality_data.time_horizon
            existing_assessment.updated_at = datetime.utcnow()
            materiality_assessment = existing_assessment
        else:
            # Create new assessment
            materiality_assessment = DoubleMaturityAssessment(
                id=str(uuid.uuid4()),
                assessment_id=assessment_id,
                topic=materiality_data.topic,
                impact_materiality_score=materiality_data.impact_materiality_score,
                financial_materiality_score=materiality_data.financial_materiality_score,
                stakeholder_input=materiality_data.stakeholder_input,
                evidence_provided=materiality_data.evidence_provided,
                time_horizon=materiality_data.time_horizon,
                created_at=datetime.utcnow()
            )
            db.add(materiality_assessment)
        
        # Determine materiality significance
        is_material = (
            materiality_data.impact_materiality_score >= assessment.materiality_threshold/100 * 5 or
            materiality_data.financial_materiality_score >= assessment.materiality_threshold/100 * 5
        )
        
        materiality_assessment.is_material = is_material
        
        # Calculate combined materiality score
        combined_score = (
            materiality_data.impact_materiality_score + materiality_data.financial_materiality_score
        ) / 2
        
        materiality_assessment.combined_materiality_score = combined_score
        
        db.commit()
        db.refresh(materiality_assessment)
        
        return {
            "materiality_assessment_id": materiality_assessment.id,
            "topic": materiality_assessment.topic,
            "impact_materiality_score": materiality_assessment.impact_materiality_score,
            "financial_materiality_score": materiality_assessment.financial_materiality_score,
            "combined_score": materiality_assessment.combined_materiality_score,
            "is_material": materiality_assessment.is_material,
            "materiality_threshold": assessment.materiality_threshold,
            "time_horizon": materiality_assessment.time_horizon,
            "requires_disclosure": is_material,
            "next_actions": [
                "Complete technical screening criteria" if is_material else "Document non-material determination",
                "Gather supporting evidence" if is_material else None,
                "Stakeholder validation review" if is_material else None
            ],
            "updated_at": materiality_assessment.updated_at.isoformat() if materiality_assessment.updated_at else materiality_assessment.created_at.isoformat()
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error conducting double materiality assessment: {str(e)}")
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to conduct materiality assessment: {str(e)}")

@router.get("/assessments/{assessment_id}/technical-criteria", response_model=Dict[str, Any])
async def get_technical_screening_criteria(
    assessment_id: str,
    objective: Optional[EnvironmentalObjective] = None,
    activity_code: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user = Depends(security)
):
    """Get technical screening criteria for EU Taxonomy assessment"""
    try:
        # Verify assessment ownership
        assessment = db.query(EUTaxonomyAssessment).filter(
            EUTaxonomyAssessment.id == assessment_id,
            EUTaxonomyAssessment.user_id == current_user.get("sub"),
            EUTaxonomyAssessment.deleted_at.is_(None)
        ).first()
        
        if not assessment:
            raise HTTPException(status_code=404, detail="Assessment not found")
        
        # Build query for technical criteria
        query = db.query(TechnicalScreeningCriteria).filter(
            TechnicalScreeningCriteria.assessment_id == assessment_id,
            TechnicalScreeningCriteria.deleted_at.is_(None)
        )
        
        # Apply filters
        if objective:
            query = query.filter(TechnicalScreeningCriteria.environmental_objective == objective)
        if activity_code:
            query = query.filter(TechnicalScreeningCriteria.activity_code == activity_code)
        
        criteria = query.order_by(
            TechnicalScreeningCriteria.environmental_objective,
            TechnicalScreeningCriteria.activity_code,
            TechnicalScreeningCriteria.criteria_sequence
        ).all()
        
        # Format response
        formatted_criteria = []
        for criterion in criteria:
            formatted_criterion = {
                "id": criterion.id,
                "environmental_objective": criterion.environmental_objective.value,
                "activity_code": criterion.activity_code,
                "activity_description": criterion.activity_description,
                "criteria_description": criterion.criteria_description,
                "metric_requirements": criterion.metric_requirements,
                "compliance_status": criterion.compliance_status.value if criterion.compliance_status else None,
                "evidence_provided": criterion.evidence_provided,
                "quantitative_data": criterion.quantitative_data,
                "dnsh_assessment_required": criterion.dnsh_assessment_required,
                "minimum_safeguards_applicable": criterion.minimum_safeguards_applicable,
                "created_at": criterion.created_at.isoformat(),
                "last_updated": criterion.updated_at.isoformat() if criterion.updated_at else None
            }
            formatted_criteria.append(formatted_criterion)
        
        # Calculate summary statistics
        total_criteria = len(criteria)
        compliant_criteria = len([c for c in criteria if c.compliance_status == ComplianceStatus.COMPLIANT])
        non_compliant_criteria = len([c for c in criteria if c.compliance_status == ComplianceStatus.NON_COMPLIANT])
        pending_criteria = total_criteria - compliant_criteria - non_compliant_criteria
        
        return {
            "assessment_id": assessment_id,
            "filtered_by": {
                "objective": objective.value if objective else "all",
                "activity_code": activity_code if activity_code else "all"
            },
            "criteria": formatted_criteria,
            "summary": {
                "total_criteria": total_criteria,
                "compliant": compliant_criteria,
                "non_compliant": non_compliant_criteria,
                "pending_review": pending_criteria,
                "compliance_rate": round((compliant_criteria / total_criteria) * 100, 1) if total_criteria > 0 else 0
            }
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error retrieving technical screening criteria: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to retrieve criteria: {str(e)}")

@router.post("/assessments/{assessment_id}/technical-criteria/{criteria_id}/response", response_model=Dict[str, Any])
async def submit_technical_screening_response(
    assessment_id: str,
    criteria_id: str,
    response_data: TechnicalScreeningResponse,
    db: Session = Depends(get_db),
    current_user = Depends(security)
):
    """Submit response to technical screening criteria"""
    try:
        # Verify assessment and criteria
        criteria = db.query(TechnicalScreeningCriteria).filter(
            TechnicalScreeningCriteria.id == criteria_id,
            TechnicalScreeningCriteria.assessment_id == assessment_id,
            TechnicalScreeningCriteria.deleted_at.is_(None)
        ).first()
        
        if not criteria:
            raise HTTPException(status_code=404, detail="Technical screening criteria not found")
        
        # Update criteria with response
        criteria.compliance_status = response_data.compliance_status
        criteria.evidence_provided = response_data.evidence_description
        criteria.quantitative_data = response_data.quantitative_data
        criteria.supporting_documents = response_data.supporting_documents
        criteria.confidence_level = response_data.confidence_level
        criteria.updated_at = datetime.utcnow()
        
        db.commit()
        
        # Calculate updated assessment progress
        total_criteria = db.query(TechnicalScreeningCriteria).filter(
            TechnicalScreeningCriteria.assessment_id == assessment_id,
            TechnicalScreeningCriteria.deleted_at.is_(None)
        ).count()
        
        completed_criteria = db.query(TechnicalScreeningCriteria).filter(
            TechnicalScreeningCriteria.assessment_id == assessment_id,
            TechnicalScreeningCriteria.compliance_status.isnot(None),
            TechnicalScreeningCriteria.deleted_at.is_(None)
        ).count()
        
        progress_percentage = (completed_criteria / total_criteria) * 100 if total_criteria > 0 else 0
        
        return {
            "criteria_id": criteria.id,
            "assessment_id": assessment_id,
            "compliance_status": criteria.compliance_status.value,
            "confidence_level": criteria.confidence_level,
            "response_recorded": True,
            "progress_update": {
                "completed_criteria": completed_criteria,
                "total_criteria": total_criteria,
                "progress_percentage": round(progress_percentage, 1)
            },
            "next_steps": [
                "Complete remaining criteria assessments",
                "Review DNSH compliance if applicable",
                "Verify minimum safeguards compliance"
            ],
            "updated_at": criteria.updated_at.isoformat()
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error submitting technical screening response: {str(e)}")
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to submit response: {str(e)}")

# ================================================================================
# ESRS COMPLIANCE ENDPOINTS
# ================================================================================

@router.post("/assessments/{assessment_id}/esrs-compliance", response_model=Dict[str, Any])
async def submit_esrs_compliance_data(
    assessment_id: str,
    compliance_data: ESRSComplianceResponse,
    db: Session = Depends(get_db),
    current_user = Depends(security)
):
    """Submit ESRS compliance data for disclosure requirements"""
    try:
        # Verify assessment
        assessment = db.query(EUTaxonomyAssessment).filter(
            EUTaxonomyAssessment.id == assessment_id,
            EUTaxonomyAssessment.user_id == current_user.get("sub"),
            EUTaxonomyAssessment.deleted_at.is_(None)
        ).first()
        
        if not assessment:
            raise HTTPException(status_code=404, detail="Assessment not found")
        
        # Create or update ESRS compliance record
        existing_compliance = db.query(ESRSCompliance).filter(
            ESRSCompliance.assessment_id == assessment_id,
            ESRSCompliance.standard == compliance_data.standard,
            ESRSCompliance.disclosure_requirement == compliance_data.disclosure_requirement,
            ESRSCompliance.deleted_at.is_(None)
        ).first()
        
        if existing_compliance:
            existing_compliance.compliance_status = compliance_data.compliance_status
            existing_compliance.reported_data = compliance_data.reported_data
            existing_compliance.data_quality_assessment = compliance_data.data_quality_assessment
            existing_compliance.external_assurance = compliance_data.external_assurance
            existing_compliance.updated_at = datetime.utcnow()
            compliance_record = existing_compliance
        else:
            compliance_record = ESRSCompliance(
                id=str(uuid.uuid4()),
                assessment_id=assessment_id,
                standard=compliance_data.standard,
                disclosure_requirement=compliance_data.disclosure_requirement,
                compliance_status=compliance_data.compliance_status,
                reported_data=compliance_data.reported_data,
                data_quality_assessment=compliance_data.data_quality_assessment,
                external_assurance=compliance_data.external_assurance,
                created_at=datetime.utcnow()
            )
            db.add(compliance_record)
        
        db.commit()
        db.refresh(compliance_record)
        
        return {
            "compliance_record_id": compliance_record.id,
            "standard": compliance_record.standard.value,
            "disclosure_requirement": compliance_record.disclosure_requirement,
            "compliance_status": compliance_record.compliance_status.value,
            "data_quality_rating": compliance_record.data_quality_assessment,
            "external_assurance": compliance_record.external_assurance,
            "submission_recorded": True,
            "updated_at": compliance_record.updated_at.isoformat() if compliance_record.updated_at else compliance_record.created_at.isoformat()
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error submitting ESRS compliance data: {str(e)}")
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to submit ESRS compliance: {str(e)}")

@router.get("/environmental-objectives", response_model=List[Dict[str, Any]])
async def get_environmental_objectives():
    """Get all EU Taxonomy environmental objectives"""
    objectives = [
        {
            "code": "climate_mitigation",
            "title": "Climate Change Mitigation",
            "description": "Activities that contribute substantially to stabilizing GHG emissions by avoiding or reducing them or by enhancing GHG removals",
            "examples": ["Renewable energy", "Energy efficiency", "Clean transport"]
        },
        {
            "code": "climate_adaptation", 
            "title": "Climate Change Adaptation",
            "description": "Activities that include adaptation solutions that either substantially reduce the risk of adverse impact or substantially reduce that adverse impact",
            "examples": ["Flood defenses", "Drought-resistant crops", "Climate-resilient infrastructure"]
        },
        {
            "code": "water_protection",
            "title": "Sustainable Use and Protection of Water and Marine Resources", 
            "description": "Activities that contribute substantially to achieving the good status of bodies of water or preventing the deterioration of water bodies",
            "examples": ["Water treatment", "Marine conservation", "Sustainable water management"]
        },
        {
            "code": "circular_economy",
            "title": "Transition to a Circular Economy",
            "description": "Activities that contribute substantially to the transition to a circular economy, including waste prevention and recycling",
            "examples": ["Waste recycling", "Product life extension", "Sharing economy platforms"]
        },
        {
            "code": "pollution_prevention",
            "title": "Pollution Prevention and Control",
            "description": "Activities that contribute substantially to environmental protection from pollution through prevention, reduction or elimination of pollutant sources",
            "examples": ["Air pollution control", "Soil remediation", "Hazardous waste management"]
        },
        {
            "code": "biodiversity_protection",
            "title": "Protection and Restoration of Biodiversity and Ecosystems", 
            "description": "Activities that contribute substantially to protecting, conserving or restoring biodiversity or achieving the good condition of ecosystems",
            "examples": ["Nature conservation", "Sustainable forestry", "Ecosystem restoration"]
        }
    ]
    
    return objectives

# ================================================================================
# HEALTH CHECK ENDPOINT
# ================================================================================

@router.get("/health")
async def health_check():
    """Health check endpoint for EU Taxonomy & ESRS service"""
    return {
        "service": "EU Taxonomy & ESRS Compliance",
        "status": "healthy",
        "version": "1.0.0",
        "timestamp": datetime.utcnow().isoformat(),
        "compliance_frameworks": [
            "EU Taxonomy Regulation (2020/852)",
            "Corporate Sustainability Reporting Directive (CSRD)",
            "European Sustainability Reporting Standards (ESRS)",
            "Double Materiality Assessment Framework",
            "Do No Significant Harm (DNSH) Principle",
            "Minimum Safeguards Compliance"
        ],
        "environmental_objectives": 6,
        "supported_languages": ["English", "German", "French", "Spanish", "Dutch"]
    }