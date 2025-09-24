# ================================================================================
# AUREX LAUNCHPAD™ SCOPE 3 EMISSIONS CALCULATOR API ROUTES
# Sub-Application #2: Advanced Scope 3 Emissions Calculator with 15 Category Framework
# Module ID: LAU-GHG-002-SCOPE3 - Scope 3 Emissions Calculator API
# Created: August 8, 2025
# ================================================================================

from fastapi import APIRouter, Depends, HTTPException, Query, BackgroundTasks, UploadFile, File
from fastapi.security import HTTPBearer
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import and_, or_, desc, func
from typing import List, Dict, Optional, Any, Union
from datetime import datetime, timedelta
from decimal import Decimal
import json
import uuid
import logging
import csv
import io
from enum import Enum

# Import models and dependencies
from models.base_models import get_db
from models.ghg_emissions_models import (
    GHGEmission, EmissionScope, EmissionSource, EmissionFactor,
    GHGCalculation, EmissionReduction
)
from models.scope3_models import (
    Scope3Assessment, Scope3Category, Scope3ActivityData,
    Scope3EmissionFactor, Scope3Calculation, Scope3Methodology,
    SupplierEngagement, ValueChainAssessment, Scope3CategoryType,
    DataQualityLevel, CalculationMethodology, SupplierDataStatus
)

# Import services
from services.scope3_calculation_engine import Scope3CalculationEngine

# Import schemas
from pydantic import BaseModel, Field, validator
from enum import Enum

# Configure logging
logger = logging.getLogger(__name__)

# Security
security = HTTPBearer()

# Create router
router = APIRouter(
    prefix="/api/scope3-calculator",
    tags=["Scope 3 Emissions Calculator"],
    responses={404: {"description": "Not found"}}
)

# ================================================================================
# REQUEST/RESPONSE SCHEMAS
# ================================================================================

class Scope3AssessmentCreate(BaseModel):
    """Schema for creating a new Scope 3 assessment"""
    title: str = Path(..., min_length=1, max_length=200)
    description: Optional[str] = Field(None, max_length=1000)
    organization_id: str
    reporting_year: int = Path(..., ge=2020, le=2030)
    base_currency: str = Field(default="USD", description="ISO currency code")
    assessment_boundary: Dict[str, Any] = Field(default_factory=dict)
    selected_categories: List[Scope3CategoryType] = Field(default_factory=list)
    data_collection_approach: str = Field(default="hybrid", description="supplier_specific, spend_based, hybrid")

class Scope3ActivityDataSubmit(BaseModel):
    """Schema for submitting Scope 3 activity data"""
    category: Scope3CategoryType
    activity_description: str = Path(..., min_length=1, max_length=500)
    activity_amount: float = Field(..., gt=0)
    activity_unit: str = Path(..., min_length=1, max_length=50)
    data_source: str = Field(..., description="Source of the activity data")
    data_quality_level: DataQualityLevel
    calculation_methodology: CalculationMethodology
    supplier_specific_data: bool = Field(default=False)
    supplier_id: Optional[str] = None
    spend_amount: Optional[float] = None
    spend_currency: Optional[str] = "USD"
    collection_period_start: datetime
    collection_period_end: datetime
    geographical_scope: Optional[str] = None

class Scope3CalculationRequest(BaseModel):
    """Schema for requesting Scope 3 calculations"""
    assessment_id: str
    categories_to_calculate: Optional[List[Scope3CategoryType]] = None
    emission_factors_source: str = Field(default="defra", description="defra, epa, ecoinvent, custom")
    uncertainty_analysis: bool = Field(default=True)
    monte_carlo_iterations: int = Field(default=1000, ge=100, le=10000)
    include_biogenic: bool = Field(default=True)

class Scope3ResultsResponse(BaseModel):
    """Schema for Scope 3 calculation results"""
    assessment_id: str
    total_scope3_emissions: float
    emissions_by_category: Dict[str, float]
    emissions_by_methodology: Dict[str, float]
    data_quality_score: float
    uncertainty_range: Dict[str, float]
    calculation_metadata: Dict[str, Any]
    recommendations: List[str]
    data_gaps: List[str]

class SupplierEngagementCreate(BaseModel):
    """Schema for supplier engagement tracking"""
    assessment_id: str
    supplier_name: str = Path(..., min_length=1, max_length=200)
    supplier_contact_email: Optional[str] = None
    supplier_categories: List[Scope3CategoryType] = Field(default_factory=list)
    engagement_status: SupplierDataStatus
    data_requested_date: datetime
    data_due_date: Optional[datetime] = None
    spend_amount: Optional[float] = None
    spend_percentage: Optional[float] = None
    priority_level: str = Field(default="medium", description="high, medium, low")

# ================================================================================
# CORE SCOPE 3 CALCULATOR ENDPOINTS
# ================================================================================

@router.post("/assessments", response_model=Dict[str, Any])
async def create_scope3_assessment(
    assessment_data: Scope3AssessmentCreate,
    db: Session = Depends(get_db),
    current_user = Depends(security)
):
    """
    Create a new comprehensive Scope 3 emissions assessment
    
    This endpoint initiates a Scope 3 assessment covering all 15 GHG Protocol categories:
    
    UPSTREAM (Categories 1-8):
    1. Purchased goods and services
    2. Capital goods  
    3. Fuel- and energy-related activities
    4. Upstream transportation and distribution
    5. Waste generated in operations
    6. Business travel
    7. Employee commuting
    8. Upstream leased assets
    
    DOWNSTREAM (Categories 9-15):
    9. Downstream transportation and distribution
    10. Processing of sold products
    11. Use of sold products
    12. End-of-life treatment of sold products
    13. Downstream leased assets
    14. Franchises
    15. Investments
    """
    try:
        # Create new Scope 3 assessment
        assessment = Scope3Assessment(
            id=str(uuid.uuid4()),
            user_id=current_user.get("sub"),
            organization_id=assessment_data.organization_id,
            title=assessment_data.title,
            description=assessment_data.description,
            reporting_year=assessment_data.reporting_year,
            base_currency=assessment_data.base_currency,
            assessment_boundary=assessment_data.assessment_boundary,
            selected_categories=assessment_data.selected_categories,
            data_collection_approach=assessment_data.data_collection_approach,
            status="initiated",
            created_at=datetime.utcnow()
        )
        
        db.add(assessment)
        db.commit()
        db.refresh(assessment)
        
        # Initialize Scope 3 calculation engine
        calculation_engine = Scope3CalculationEngine()
        
        # Set up category frameworks
        await calculation_engine.initialize_category_frameworks(
            assessment_id=assessment.id,
            selected_categories=assessment_data.selected_categories,
            organization_type="corporate"  # Could be parameterized
        )
        
        logger.info(f"Created Scope 3 assessment {assessment.id} for organization {assessment_data.organization_id}")
        
        return {
            "assessment_id": assessment.id,
            "title": assessment.title,
            "reporting_year": assessment.reporting_year,
            "status": assessment.status,
            "selected_categories": [cat.value for cat in assessment.selected_categories],
            "category_count": len(assessment.selected_categories),
            "data_collection_approach": assessment.data_collection_approach,
            "created_at": assessment.created_at.isoformat(),
            "estimated_duration": "3-6 months for comprehensive assessment",
            "next_steps": [
                "Set up supplier engagement program",
                "Collect activity data for prioritized categories", 
                "Configure emission factors and calculation methodologies",
                "Begin data quality assessment and validation"
            ]
        }
        
    except Exception as e:
        logger.error(f"Error creating Scope 3 assessment: {str(e)}")
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to create assessment: {str(e)}")

@router.get("/assessments/{assessment_id}", response_model=Dict[str, Any])
async def get_scope3_assessment(
    assessment_id: str,
    db: Session = Depends(get_db),
    current_user = Depends(security)
):
    """Get detailed information about a specific Scope 3 assessment"""
    try:
        assessment = db.query(Scope3Assessment).filter(
            Scope3Assessment.id == assessment_id,
            Scope3Assessment.user_id == current_user.get("sub"),
            Scope3Assessment.deleted_at.is_(None)
        ).first()
        
        if not assessment:
            raise HTTPException(status_code=404, detail="Scope 3 assessment not found")
        
        # Get activity data counts by category
        activity_data_summary = {}
        for category in assessment.selected_categories:
            count = db.query(Scope3ActivityData).filter(
                Scope3ActivityData.assessment_id == assessment_id,
                Scope3ActivityData.category == category,
                Scope3ActivityData.deleted_at.is_(None)
            ).count()
            activity_data_summary[category.value] = count
        
        # Get supplier engagement statistics
        supplier_stats = db.query(
            func.count(SupplierEngagement.id).label('total'),
            func.sum(func.case((SupplierEngagement.engagement_status == SupplierDataStatus.DATA_RECEIVED, 1), else_=0)).label('responded'),
            func.sum(SupplierEngagement.spend_amount).label('total_spend')
        ).filter(
            SupplierEngagement.assessment_id == assessment_id,
            SupplierEngagement.deleted_at.is_(None)
        ).first()
        
        # Calculate overall progress
        total_expected_data_points = len(assessment.selected_categories) * 5  # Estimated
        total_collected_data_points = sum(activity_data_summary.values())
        progress_percentage = (total_collected_data_points / total_expected_data_points) * 100 if total_expected_data_points > 0 else 0
        
        return {
            "id": assessment.id,
            "title": assessment.title,
            "description": assessment.description,
            "status": assessment.status,
            "reporting_year": assessment.reporting_year,
            "base_currency": assessment.base_currency,
            "data_collection_approach": assessment.data_collection_approach,
            "selected_categories": [cat.value for cat in assessment.selected_categories],
            "progress_percentage": round(progress_percentage, 1),
            "activity_data_summary": activity_data_summary,
            "supplier_engagement": {
                "total_suppliers": supplier_stats.total if supplier_stats else 0,
                "responded_suppliers": supplier_stats.responded if supplier_stats else 0,
                "total_spend_covered": float(supplier_stats.total_spend) if supplier_stats.total_spend else 0.0,
                "response_rate": round((supplier_stats.responded / supplier_stats.total * 100), 1) if supplier_stats and supplier_stats.total > 0 else 0
            },
            "created_at": assessment.created_at.isoformat(),
            "updated_at": assessment.updated_at.isoformat() if assessment.updated_at else None,
            "completion_target": f"{assessment.reporting_year + 1}-03-31"  # Typical sustainability reporting deadline
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error retrieving Scope 3 assessment {assessment_id}: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to retrieve assessment: {str(e)}")

@router.post("/assessments/{assessment_id}/activity-data", response_model=Dict[str, Any])
async def submit_scope3_activity_data(
    assessment_id: str,
    activity_data: Scope3ActivityDataSubmit,
    db: Session = Depends(get_db),
    current_user = Depends(security)
):
    """Submit activity data for a specific Scope 3 category"""
    try:
        # Verify assessment ownership
        assessment = db.query(Scope3Assessment).filter(
            Scope3Assessment.id == assessment_id,
            Scope3Assessment.user_id == current_user.get("sub"),
            Scope3Assessment.deleted_at.is_(None)
        ).first()
        
        if not assessment:
            raise HTTPException(status_code=404, detail="Assessment not found")
        
        # Verify category is selected for this assessment
        if activity_data.category not in assessment.selected_categories:
            raise HTTPException(
                status_code=400, 
                detail=f"Category {activity_data.category.value} not selected for this assessment"
            )
        
        # Create activity data record
        activity_record = Scope3ActivityData(
            id=str(uuid.uuid4()),
            assessment_id=assessment_id,
            category=activity_data.category,
            activity_description=activity_data.activity_description,
            activity_amount=activity_data.activity_amount,
            activity_unit=activity_data.activity_unit,
            data_source=activity_data.data_source,
            data_quality_level=activity_data.data_quality_level,
            calculation_methodology=activity_data.calculation_methodology,
            supplier_specific_data=activity_data.supplier_specific_data,
            supplier_id=activity_data.supplier_id,
            spend_amount=activity_data.spend_amount,
            spend_currency=activity_data.spend_currency,
            collection_period_start=activity_data.collection_period_start,
            collection_period_end=activity_data.collection_period_end,
            geographical_scope=activity_data.geographical_scope,
            created_at=datetime.utcnow()
        )
        
        db.add(activity_record)
        
        # Update assessment status if it's the first data submission
        if assessment.status == "initiated":
            assessment.status = "data_collection"
            assessment.updated_at = datetime.utcnow()
        
        db.commit()
        db.refresh(activity_record)
        
        # Calculate data completeness for this category
        category_data_count = db.query(Scope3ActivityData).filter(
            Scope3ActivityData.assessment_id == assessment_id,
            Scope3ActivityData.category == activity_data.category,
            Scope3ActivityData.deleted_at.is_(None)
        ).count()
        
        return {
            "activity_data_id": activity_record.id,
            "assessment_id": assessment_id,
            "category": activity_data.category.value,
            "data_recorded": True,
            "category_data_points": category_data_count,
            "data_quality_level": activity_data.data_quality_level.value,
            "calculation_methodology": activity_data.calculation_methodology.value,
            "next_steps": [
                "Continue data collection for other activities in this category",
                "Review data quality and validation requirements",
                "Consider supplier-specific data collection if using spend-based approach"
            ],
            "created_at": activity_record.created_at.isoformat()
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error submitting activity data: {str(e)}")
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to submit activity data: {str(e)}")

@router.post("/assessments/{assessment_id}/calculate", response_model=Scope3ResultsResponse)
async def calculate_scope3_emissions(
    assessment_id: str,
    calculation_request: Scope3CalculationRequest,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    current_user = Depends(security)
):
    """
    Calculate Scope 3 emissions using advanced methodologies
    
    This endpoint performs comprehensive Scope 3 calculations including:
    - Spend-based calculations using EEIO models
    - Supplier-specific data integration  
    - Hybrid approach combining both methods
    - Uncertainty analysis with Monte Carlo simulation
    - Data quality assessment and gap analysis
    """
    try:
        # Verify assessment ownership and data sufficiency
        assessment = db.query(Scope3Assessment).filter(
            Scope3Assessment.id == assessment_id,
            Scope3Assessment.user_id == current_user.get("sub"),
            Scope3Assessment.deleted_at.is_(None)
        ).first()
        
        if not assessment:
            raise HTTPException(status_code=404, detail="Assessment not found")
        
        # Check minimum data requirements
        total_activity_data = db.query(Scope3ActivityData).filter(
            Scope3ActivityData.assessment_id == assessment_id,
            Scope3ActivityData.deleted_at.is_(None)
        ).count()
        
        if total_activity_data < 5:
            raise HTTPException(
                status_code=400,
                detail="Insufficient activity data for calculation. Minimum 5 data points required."
            )
        
        # Initialize calculation engine
        calculation_engine = Scope3CalculationEngine()
        
        # Get all activity data for the assessment
        activity_data = db.query(Scope3ActivityData).filter(
            Scope3ActivityData.assessment_id == assessment_id,
            Scope3ActivityData.deleted_at.is_(None)
        ).all()
        
        # Perform calculations
        calculation_results = await calculation_engine.calculate_scope3_emissions(
            assessment_id=assessment_id,
            activity_data=activity_data,
            calculation_parameters={
                "emission_factors_source": calculation_request.emission_factors_source,
                "uncertainty_analysis": calculation_request.uncertainty_analysis,
                "monte_carlo_iterations": calculation_request.monte_carlo_iterations,
                "include_biogenic": calculation_request.include_biogenic,
                "base_currency": assessment.base_currency,
                "reporting_year": assessment.reporting_year
            }
        )
        
        # Store calculation results
        calculation_record = Scope3Calculation(
            id=str(uuid.uuid4()),
            assessment_id=assessment_id,
            total_scope3_emissions=calculation_results["total_scope3_emissions"],
            emissions_by_category=calculation_results["emissions_by_category"],
            calculation_methodology=calculation_request.emission_factors_source,
            data_quality_score=calculation_results["data_quality_score"],
            uncertainty_range=calculation_results["uncertainty_range"],
            calculation_metadata=calculation_results["calculation_metadata"],
            calculated_at=datetime.utcnow()
        )
        
        db.add(calculation_record)
        
        # Update assessment status
        assessment.status = "calculated"
        assessment.updated_at = datetime.utcnow()
        
        db.commit()
        db.refresh(calculation_record)
        
        # Schedule background task for detailed reporting
        background_tasks.add_task(
            generate_detailed_scope3_report,
            assessment_id,
            calculation_record.id
        )
        
        logger.info(f"Completed Scope 3 calculation for assessment {assessment_id}")
        
        return Scope3ResultsResponse(
            assessment_id=assessment_id,
            total_scope3_emissions=calculation_results["total_scope3_emissions"],
            emissions_by_category=calculation_results["emissions_by_category"],
            emissions_by_methodology=calculation_results["emissions_by_methodology"],
            data_quality_score=calculation_results["data_quality_score"],
            uncertainty_range=calculation_results["uncertainty_range"],
            calculation_metadata=calculation_results["calculation_metadata"],
            recommendations=calculation_results["recommendations"],
            data_gaps=calculation_results["data_gaps"]
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error calculating Scope 3 emissions: {str(e)}")
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Calculation failed: {str(e)}")

@router.post("/assessments/{assessment_id}/supplier-engagement", response_model=Dict[str, Any])
async def create_supplier_engagement(
    assessment_id: str,
    engagement_data: SupplierEngagementCreate,
    db: Session = Depends(get_db),
    current_user = Depends(security)
):
    """Create supplier engagement record for data collection"""
    try:
        # Verify assessment ownership
        assessment = db.query(Scope3Assessment).filter(
            Scope3Assessment.id == assessment_id,
            Scope3Assessment.user_id == current_user.get("sub"),
            Scope3Assessment.deleted_at.is_(None)
        ).first()
        
        if not assessment:
            raise HTTPException(status_code=404, detail="Assessment not found")
        
        # Create supplier engagement record
        engagement = SupplierEngagement(
            id=str(uuid.uuid4()),
            assessment_id=assessment_id,
            supplier_name=engagement_data.supplier_name,
            supplier_contact_email=engagement_data.supplier_contact_email,
            supplier_categories=engagement_data.supplier_categories,
            engagement_status=engagement_data.engagement_status,
            data_requested_date=engagement_data.data_requested_date,
            data_due_date=engagement_data.data_due_date,
            spend_amount=engagement_data.spend_amount,
            spend_percentage=engagement_data.spend_percentage,
            priority_level=engagement_data.priority_level,
            created_at=datetime.utcnow()
        )
        
        db.add(engagement)
        db.commit()
        db.refresh(engagement)
        
        # Calculate supplier coverage metrics
        total_suppliers = db.query(SupplierEngagement).filter(
            SupplierEngagement.assessment_id == assessment_id,
            SupplierEngagement.deleted_at.is_(None)
        ).count()
        
        total_spend = db.query(
            func.sum(SupplierEngagement.spend_amount)
        ).filter(
            SupplierEngagement.assessment_id == assessment_id,
            SupplierEngagement.deleted_at.is_(None)
        ).scalar() or 0
        
        return {
            "engagement_id": engagement.id,
            "supplier_name": engagement.supplier_name,
            "categories_covered": [cat.value for cat in engagement.supplier_categories],
            "engagement_status": engagement.engagement_status.value,
            "priority_level": engagement.priority_level,
            "spend_coverage": {
                "supplier_spend": engagement.spend_amount,
                "total_tracked_spend": float(total_spend),
                "spend_percentage": engagement.spend_percentage
            },
            "supplier_portfolio": {
                "total_suppliers": total_suppliers,
                "engagement_coverage": f"{total_suppliers} suppliers engaged"
            },
            "next_actions": [
                "Send data collection templates to supplier",
                "Schedule follow-up communications",
                "Track data submission deadlines"
            ],
            "created_at": engagement.created_at.isoformat()
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error creating supplier engagement: {str(e)}")
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to create engagement: {str(e)}")

@router.get("/categories", response_model=List[Dict[str, Any]])
async def get_scope3_categories():
    """Get all Scope 3 categories with detailed descriptions"""
    categories = [
        {
            "category_number": 1,
            "category_type": "purchased_goods_services",
            "name": "Purchased Goods and Services",
            "scope": "upstream",
            "description": "Extraction, production, and transportation of goods and services purchased or acquired by the organization",
            "typical_data_sources": ["Procurement records", "Supplier invoices", "Product specifications"],
            "calculation_methods": ["Spend-based", "Supplier-specific", "Average-data"],
            "data_requirements": ["Spend data by commodity", "Physical quantities", "Supplier emission factors"],
            "industry_relevance": "All industries - typically largest category"
        },
        {
            "category_number": 2,
            "category_type": "capital_goods",
            "name": "Capital Goods", 
            "scope": "upstream",
            "description": "Extraction, production, and transportation of capital goods purchased or acquired by the organization",
            "typical_data_sources": ["Capital expenditure records", "Asset registers", "Equipment specifications"],
            "calculation_methods": ["Spend-based", "Asset-specific", "Depreciation-based"],
            "data_requirements": ["Capital expenditure by asset type", "Equipment specifications", "Depreciation schedules"],
            "industry_relevance": "Manufacturing, infrastructure, technology sectors"
        },
        {
            "category_number": 3,
            "category_type": "fuel_energy_activities",
            "name": "Fuel- and Energy-Related Activities",
            "scope": "upstream", 
            "description": "Upstream emissions of purchased fuels and energy not included in Scope 1 or 2",
            "typical_data_sources": ["Energy bills", "Fuel consumption records", "Grid emission factors"],
            "calculation_methods": ["Activity-based", "Well-to-tank factors", "Transmission losses"],
            "data_requirements": ["Energy consumption by source", "Fuel purchase quantities", "Grid loss factors"],
            "industry_relevance": "Energy-intensive industries, manufacturing"
        },
        {
            "category_number": 4,
            "category_type": "upstream_transport_distribution",
            "name": "Upstream Transportation and Distribution",
            "scope": "upstream",
            "description": "Transportation and distribution of purchased products between vendor and organization",
            "typical_data_sources": ["Logistics invoices", "Freight bills", "Transportation records"],
            "calculation_methods": ["Distance-based", "Spend-based", "Fuel-based"],
            "data_requirements": ["Transport distances", "Mode of transport", "Freight weights"],
            "industry_relevance": "Retail, manufacturing, distribution companies"
        },
        {
            "category_number": 5,
            "category_type": "waste_generated",
            "name": "Waste Generated in Operations", 
            "scope": "upstream",
            "description": "Disposal and treatment of waste generated in organization's operations",
            "typical_data_sources": ["Waste management records", "Waste disposal invoices", "Material flow data"],
            "calculation_methods": ["Waste-type specific", "Treatment-method specific"],
            "data_requirements": ["Waste quantities by type", "Treatment methods", "Disposal locations"],
            "industry_relevance": "All industries with significant waste streams"
        },
        {
            "category_number": 6,
            "category_type": "business_travel",
            "name": "Business Travel",
            "scope": "upstream",
            "description": "Transportation of employees for business-related activities",
            "typical_data_sources": ["Travel expense reports", "Travel booking systems", "Mileage logs"],
            "calculation_methods": ["Distance-based", "Spend-based", "Fuel consumption"],
            "data_requirements": ["Travel distances by mode", "Accommodation nights", "Vehicle types"],
            "industry_relevance": "Service industries, consulting, professional services"
        },
        {
            "category_number": 7,
            "category_type": "employee_commuting",
            "name": "Employee Commuting",
            "scope": "upstream",
            "description": "Transportation of employees between homes and worksites",
            "typical_data_sources": ["Employee surveys", "Commute benefit programs", "Parking records"],
            "calculation_methods": ["Survey-based", "Distance-based", "Mode-specific"],
            "data_requirements": ["Commute distances", "Transport modes", "Work-from-home frequency"],
            "industry_relevance": "All industries with significant workforce"
        },
        {
            "category_number": 8,
            "category_type": "upstream_leased_assets",
            "name": "Upstream Leased Assets",
            "scope": "upstream",
            "description": "Operation of assets leased by the organization (lessee) not included in Scope 1 and 2",
            "typical_data_sources": ["Lease agreements", "Energy bills", "Asset utilization data"],
            "calculation_methods": ["Asset-specific", "Floor area", "Equipment-based"],
            "data_requirements": ["Leased asset inventory", "Energy consumption", "Utilization rates"],
            "industry_relevance": "Organizations with significant leased assets"
        },
        {
            "category_number": 9,
            "category_type": "downstream_transport_distribution",
            "name": "Downstream Transportation and Distribution",
            "scope": "downstream",
            "description": "Transportation and distribution of sold products between organization and end consumer",
            "typical_data_sources": ["Shipping records", "Distribution contracts", "Customer delivery data"],
            "calculation_methods": ["Distance-based", "Fuel-based", "Third-party data"],
            "data_requirements": ["Shipment distances", "Transport modes", "Product weights"],
            "industry_relevance": "Manufacturing, retail, e-commerce"
        },
        {
            "category_number": 10,
            "category_type": "processing_sold_products",
            "name": "Processing of Sold Products",
            "scope": "downstream",
            "description": "Processing of intermediate products sold by the organization",
            "typical_data_sources": ["Product specifications", "Customer processing data", "Industry studies"],
            "calculation_methods": ["Product-specific", "Processing intensity", "Industry averages"],
            "data_requirements": ["Product compositions", "Processing requirements", "Customer data"],
            "industry_relevance": "Chemical, materials, intermediate goods producers"
        },
        {
            "category_number": 11,
            "category_type": "use_sold_products",
            "name": "Use of Sold Products",
            "scope": "downstream",
            "description": "End use of goods and services sold by the organization",
            "typical_data_sources": ["Product energy ratings", "Usage studies", "Customer data"],
            "calculation_methods": ["Product lifetime", "Usage intensity", "Energy consumption"],
            "data_requirements": ["Product lifetimes", "Usage patterns", "Energy efficiency"],
            "industry_relevance": "Consumer goods, equipment manufacturers"
        },
        {
            "category_number": 12,
            "category_type": "end_of_life_sold_products",
            "name": "End-of-Life Treatment of Sold Products",
            "scope": "downstream",
            "description": "Waste disposal and treatment of products sold by the organization",
            "typical_data_sources": ["Product material compositions", "Recycling data", "Waste studies"],
            "calculation_methods": ["Material-specific", "Treatment method", "Regional factors"],
            "data_requirements": ["Material compositions", "Treatment pathways", "Regional practices"],
            "industry_relevance": "All product manufacturers"
        },
        {
            "category_number": 13,
            "category_type": "downstream_leased_assets",
            "name": "Downstream Leased Assets",
            "scope": "downstream",
            "description": "Operation of assets owned by the organization and leased to other entities",
            "typical_data_sources": ["Lease agreements", "Asset monitoring", "Tenant energy data"],
            "calculation_methods": ["Asset-specific", "Floor area", "Tenant data"],
            "data_requirements": ["Leased asset portfolio", "Energy consumption", "Tenant information"],
            "industry_relevance": "Real estate, equipment leasing companies"
        },
        {
            "category_number": 14,
            "category_type": "franchises",
            "name": "Franchises",
            "scope": "downstream",
            "description": "Operation of franchises not included in Scope 1 and 2",
            "typical_data_sources": ["Franchise agreements", "Franchisee data", "Operational standards"],
            "calculation_methods": ["Franchise-specific", "Revenue-based", "Standardized operations"],
            "data_requirements": ["Franchise locations", "Operational data", "Revenue information"],
            "industry_relevance": "Franchise business models"
        },
        {
            "category_number": 15,
            "category_type": "investments",
            "name": "Investments",
            "scope": "downstream",
            "description": "Operation of investments including equity and debt investments and managed assets",
            "typical_data_sources": ["Investment portfolios", "Portfolio company data", "Financial reports"],
            "calculation_methods": ["Equity share", "Investment value", "Portfolio approach"],
            "data_requirements": ["Investment details", "Portfolio emissions", "Financial metrics"],
            "industry_relevance": "Financial services, investment companies"
        }
    ]
    
    return categories

# ================================================================================
# BACKGROUND TASKS
# ================================================================================

async def generate_detailed_scope3_report(assessment_id: str, calculation_id: str):
    """Background task to generate detailed Scope 3 report"""
    try:
        logger.info(f"Generating detailed Scope 3 report for assessment {assessment_id}")
        
        # Implementation would include:
        # - Detailed emission breakdown by category
        # - Data quality assessment
        # - Uncertainty analysis results
        # - Benchmarking against industry peers
        # - Reduction opportunity analysis
        # - Supplier engagement summary
        # - Recommendations for improvement
        
        # This would be a comprehensive implementation in production
        await asyncio.sleep(2)  # Simulate report generation
        
        logger.info(f"Completed detailed Scope 3 report generation for assessment {assessment_id}")
        
    except Exception as e:
        logger.error(f"Error generating detailed report: {str(e)}")

# ================================================================================
# HEALTH CHECK ENDPOINT
# ================================================================================

@router.get("/health")
async def health_check():
    """Health check endpoint for Scope 3 Calculator service"""
    return {
        "service": "Scope 3 Emissions Calculator",
        "status": "healthy",
        "version": "1.0.0",
        "timestamp": datetime.utcnow().isoformat(),
        "features": [
            "15-Category GHG Protocol Framework",
            "Spend-based calculation methodology",
            "Supplier-specific data integration",
            "Hybrid calculation approach",
            "Monte Carlo uncertainty analysis",
            "Data quality assessment",
            "Supplier engagement tracking",
            "Value chain hotspot analysis"
        ],
        "supported_methodologies": [
            "GHG Protocol Corporate Value Chain Standard",
            "DEFRA emissions factors",
            "EPA EEIO models",
            "Ecoinvent database",
            "Custom emission factors"
        ],
        "calculation_capabilities": {
            "categories_supported": 15,
            "uncertainty_analysis": True,
            "supplier_integration": True,
            "data_quality_scoring": True
        }
    }