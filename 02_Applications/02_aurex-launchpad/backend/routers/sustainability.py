#!/usr/bin/env python3
"""
AUREX LAUNCHPAD™ SUSTAINABILITY & ESG ADVANCED API ENDPOINTS
VIBE Framework Implementation - Balance & Excellence
Comprehensive sustainability management beyond basic ESG
"""

from fastapi import APIRouter, Depends, HTTPException, status, Query
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session
from sqlalchemy import desc, func, and_
from typing import List, Optional, Dict, Any
from datetime import datetime, timedelta
from pydantic import BaseModel, Field
import uuid

from ..database import get_db
from ..models.sustainability_models import (
    WaterManagement, WasteManagement, BiodiversityAssessment,
    SupplyChainSustainability, Material, SocialImpact, HumanRights,
    HealthSafety, SustainabilityCertification,
    WaterRiskLevel, WasteType, CircularityStrategy, BiodiversityImpact
)
from ..models.auth_models import User
from ..auth import get_current_active_user

router = APIRouter(prefix="/sustainability", tags=["sustainability"])

# ================================================================================
# PYDANTIC SCHEMAS
# ================================================================================

class WaterManagementCreate(BaseModel):
    facility_id: Optional[uuid.UUID] = None
    period_start: datetime
    period_end: datetime
    total_withdrawal: Optional[float] = None
    surface_water: Optional[float] = 0
    groundwater: Optional[float] = 0
    municipal_water: Optional[float] = 0
    recycled_water: Optional[float] = 0
    total_discharge: Optional[float] = None
    water_risk_level: Optional[WaterRiskLevel] = None
    recycling_rate: Optional[float] = None

class WasteManagementCreate(BaseModel):
    facility_id: Optional[uuid.UUID] = None
    period_start: datetime
    period_end: datetime
    waste_type: WasteType
    quantity_generated: float = Field(..., gt=0)
    landfilled: Optional[float] = 0
    recycled: Optional[float] = 0
    composted: Optional[float] = 0
    reused: Optional[float] = 0
    circularity_strategy: Optional[CircularityStrategy] = None

class BiodiversityCreate(BaseModel):
    site_name: str = Field(..., max_length=200)
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    area_hectares: Optional[float] = None
    ecosystem_type: Optional[str] = None
    in_protected_area: bool = False
    impact_level: BiodiversityImpact
    total_species_identified: Optional[int] = None
    threatened_species: Optional[int] = None

class SupplierCreate(BaseModel):
    supplier_name: str = Field(..., max_length=200)
    supplier_code: str = Field(..., max_length=100)
    country: str
    industry: str
    tier_level: int = Path(..., ge=1, le=5)
    sustainability_score: Optional[float] = Field(None, ge=0, le=100)

class SocialImpactCreate(BaseModel):
    program_name: str = Field(..., max_length=200)
    program_type: str
    start_date: datetime
    target_beneficiaries: int = Field(..., gt=0)
    budget_allocated: float = Field(..., ge=0)
    primary_sdg: int = Path(..., ge=1, le=17)
    location: str

# ================================================================================
# WATER STEWARDSHIP ENDPOINTS
# ================================================================================

@router.get("/water", response_model=List[Dict[str, Any]])
async def list_water_management(
    year: Optional[int] = None,
    facility_id: Optional[uuid.UUID] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """List water management records with VIBE efficiency tracking"""
    
    query = db.query(WaterManagement).filter(WaterManagement.organization_id == current_user.organization_id)
    
    if facility_id:
        query = query.filter(WaterManagement.facility_id == facility_id)
    if year:
        query = query.filter(func.extract('year', WaterManagement.period_start) == year)
    
    records = query.order_by(desc(WaterManagement.period_start)).all()
    
    water_data = []
    for record in records:
        water_data.append({
            "id": str(record.id),
            "facility_id": str(record.facility_id) if record.facility_id else None,
            "period_start": record.period_start,
            "period_end": record.period_end,
            "total_withdrawal": record.total_withdrawal,
            "total_discharge": record.total_discharge,
            "recycling_rate": record.recycling_rate,
            "water_risk_level": record.water_risk_level.value if record.water_risk_level else None,
            "water_intensity": record.water_intensity,
            "consumption_reduction": record.consumption_reduction,
            "vibe_efficiency_score": record.vibe_efficiency_score,
            "vibe_quality_score": record.vibe_quality_score,
            "vibe_risk_management_score": record.vibe_risk_management_score
        })
    
    return water_data

@router.post("/water")
async def create_water_record(
    water_data: WaterManagementCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Create water management record with VIBE efficiency calculation"""
    
    water_record = WaterManagement(
        organization_id=current_user.organization_id,
        **water_data.dict()
    )
    
    # Calculate VIBE scores
    if water_record.recycling_rate:
        water_record.vibe_efficiency_score = min(100, 50 + water_record.recycling_rate)
    else:
        water_record.vibe_efficiency_score = 60.0
    
    water_record.vibe_quality_score = 85.0  # Based on discharge quality
    water_record.vibe_risk_management_score = 90.0 if water_record.water_risk_level == WaterRiskLevel.LOW else 70.0
    
    db.add(water_record)
    db.commit()
    db.refresh(water_record)
    
    return {"message": "Water management record created", "id": str(water_record.id)}

@router.get("/water/analytics")
async def get_water_analytics(
    year: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Water stewardship analytics dashboard with VIBE metrics"""
    
    query = db.query(WaterManagement).filter(WaterManagement.organization_id == current_user.organization_id)
    
    if year:
        query = query.filter(func.extract('year', WaterManagement.period_start) == year)
    
    records = query.all()
    
    if not records:
        return {"message": "No water management data found"}
    
    # Calculate key metrics
    total_withdrawal = sum([r.total_withdrawal or 0 for r in records])
    total_discharge = sum([r.total_discharge or 0 for r in records])
    avg_recycling_rate = sum([r.recycling_rate or 0 for r in records]) / len(records)
    
    # Risk assessment
    high_risk_sites = len([r for r in records if r.water_risk_level in [WaterRiskLevel.HIGH, WaterRiskLevel.EXTREMELY_HIGH]])
    
    # VIBE scores
    avg_efficiency = sum([r.vibe_efficiency_score or 0 for r in records]) / len(records)
    avg_quality = sum([r.vibe_quality_score or 0 for r in records]) / len(records)
    avg_risk_mgmt = sum([r.vibe_risk_management_score or 0 for r in records]) / len(records)
    
    return {
        "summary": {
            "total_withdrawal_m3": total_withdrawal,
            "total_discharge_m3": total_discharge,
            "water_consumed_m3": total_withdrawal - total_discharge,
            "average_recycling_rate": avg_recycling_rate,
            "high_risk_sites": high_risk_sites
        },
        "vibe_scores": {
            "efficiency": avg_efficiency,
            "quality": avg_quality,
            "risk_management": avg_risk_mgmt,
            "overall": (avg_efficiency + avg_quality + avg_risk_mgmt) / 3
        },
        "monthly_trend": self._calculate_monthly_water_trend(records)
    }

def _calculate_monthly_water_trend(records):
    """Helper to calculate monthly water consumption trends"""
    monthly_data = {}
    for record in records:
        month_key = record.period_start.strftime("%Y-%m")
        if month_key not in monthly_data:
            monthly_data[month_key] = {"withdrawal": 0, "discharge": 0}
        
        monthly_data[month_key]["withdrawal"] += record.total_withdrawal or 0
        monthly_data[month_key]["discharge"] += record.total_discharge or 0
    
    return [
        {
            "month": month,
            "withdrawal": data["withdrawal"],
            "consumption": data["withdrawal"] - data["discharge"]
        }
        for month, data in sorted(monthly_data.items())
    ]

# ================================================================================
# WASTE MANAGEMENT & CIRCULAR ECONOMY ENDPOINTS
# ================================================================================

@router.get("/waste")
async def list_waste_management(
    waste_type: Optional[WasteType] = None,
    year: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """List waste management records with circular economy metrics"""
    
    query = db.query(WasteManagement).filter(WasteManagement.organization_id == current_user.organization_id)
    
    if waste_type:
        query = query.filter(WasteManagement.waste_type == waste_type)
    if year:
        query = query.filter(func.extract('year', WasteManagement.period_start) == year)
    
    records = query.order_by(desc(WasteManagement.period_start)).all()
    
    waste_data = []
    for record in records:
        # Calculate diversion rate
        total_diverted = (record.recycled + record.composted + record.reused + record.recovered)
        diversion_rate = (total_diverted / record.quantity_generated * 100) if record.quantity_generated > 0 else 0
        
        waste_data.append({
            "id": str(record.id),
            "facility_id": str(record.facility_id) if record.facility_id else None,
            "period_start": record.period_start,
            "period_end": record.period_end,
            "waste_type": record.waste_type.value,
            "quantity_generated": record.quantity_generated,
            "landfilled": record.landfilled,
            "recycled": record.recycled,
            "composted": record.composted,
            "reused": record.reused,
            "diversion_rate": diversion_rate,
            "circularity_strategy": record.circularity_strategy.value if record.circularity_strategy else None,
            "vibe_circularity_score": record.vibe_circularity_score,
            "disposal_cost": record.disposal_cost,
            "recycling_revenue": record.recycling_revenue
        })
    
    return waste_data

@router.post("/waste")
async def create_waste_record(
    waste_data: WasteManagementCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Create waste management record with circular economy scoring"""
    
    waste_record = WasteManagement(
        organization_id=current_user.organization_id,
        **waste_data.dict()
    )
    
    # Calculate circular economy metrics
    total_diverted = (waste_record.recycled + waste_record.composted + 
                     waste_record.reused + waste_record.recovered)
    waste_record.material_recovery_rate = total_diverted / waste_record.quantity_generated if waste_record.quantity_generated > 0 else 0
    waste_record.waste_to_landfill_rate = waste_record.landfilled / waste_record.quantity_generated if waste_record.quantity_generated > 0 else 0
    
    # Calculate VIBE circularity score
    waste_record.vibe_circularity_score = min(100, waste_record.material_recovery_rate * 100 + 10)
    waste_record.vibe_compliance_score = 95.0  # Assumes proper documentation
    
    db.add(waste_record)
    db.commit()
    db.refresh(waste_record)
    
    return {"message": "Waste management record created", "id": str(waste_record.id)}

# ================================================================================
# BIODIVERSITY CONSERVATION ENDPOINTS
# ================================================================================

@router.get("/biodiversity")
async def list_biodiversity_assessments(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """List biodiversity assessments with conservation metrics"""
    
    assessments = db.query(BiodiversityAssessment).filter(
        BiodiversityAssessment.organization_id == current_user.organization_id
    ).order_by(desc(BiodiversityAssessment.baseline_assessment_date)).all()
    
    assessment_data = []
    for assessment in assessments:
        assessment_data.append({
            "id": str(assessment.id),
            "site_name": assessment.site_name,
            "area_hectares": assessment.area_hectares,
            "ecosystem_type": assessment.ecosystem_type,
            "impact_level": assessment.impact_level.value,
            "total_species_identified": assessment.total_species_identified,
            "endemic_species": assessment.endemic_species,
            "threatened_species": assessment.threatened_species,
            "in_protected_area": assessment.in_protected_area,
            "habitat_loss_hectares": assessment.habitat_loss_hectares,
            "restoration_hectares": assessment.restoration_hectares,
            "conservation_investment": assessment.conservation_investment,
            "vibe_conservation_score": assessment.vibe_conservation_score,
            "vibe_restoration_score": assessment.vibe_restoration_score,
            "baseline_assessment_date": assessment.baseline_assessment_date
        })
    
    return assessment_data

@router.post("/biodiversity")
async def create_biodiversity_assessment(
    bio_data: BiodiversityCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Create biodiversity assessment with conservation scoring"""
    
    assessment = BiodiversityAssessment(
        organization_id=current_user.organization_id,
        baseline_assessment_date=datetime.utcnow(),
        **bio_data.dict()
    )
    
    # Calculate VIBE conservation scores
    base_score = 70.0
    if bio_data.impact_level in [BiodiversityImpact.POSITIVE, BiodiversityImpact.RESTORATIVE]:
        base_score += 20.0
    elif bio_data.impact_level == BiodiversityImpact.CRITICAL:
        base_score -= 30.0
    
    if bio_data.in_protected_area:
        base_score += 10.0
    
    assessment.vibe_conservation_score = min(100, base_score)
    assessment.vibe_restoration_score = 75.0  # Default, updated based on actions taken
    
    db.add(assessment)
    db.commit()
    db.refresh(assessment)
    
    return {"message": "Biodiversity assessment created", "id": str(assessment.id)}

# ================================================================================
# SUPPLY CHAIN SUSTAINABILITY ENDPOINTS
# ================================================================================

@router.get("/suppliers")
async def list_suppliers(
    tier_level: Optional[int] = None,
    min_sustainability_score: Optional[float] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """List suppliers with sustainability performance metrics"""
    
    query = db.query(SupplyChainSustainability).filter(
        SupplyChainSustainability.organization_id == current_user.organization_id
    )
    
    if tier_level:
        query = query.filter(SupplyChainSustainability.tier_level == tier_level)
    if min_sustainability_score:
        query = query.filter(SupplyChainSustainability.sustainability_score >= min_sustainability_score)
    
    suppliers = query.order_by(desc(SupplyChainSustainability.sustainability_score)).all()
    
    supplier_data = []
    for supplier in suppliers:
        supplier_data.append({
            "id": str(supplier.id),
            "supplier_name": supplier.supplier_name,
            "supplier_code": supplier.supplier_code,
            "country": supplier.country,
            "industry": supplier.industry,
            "tier_level": supplier.tier_level,
            "sustainability_score": supplier.sustainability_score,
            "carbon_footprint": supplier.carbon_footprint,
            "renewable_energy_percentage": supplier.renewable_energy_percentage,
            "labor_practices_score": supplier.labor_practices_score,
            "health_safety_score": supplier.health_safety_score,
            "code_of_conduct_signed": supplier.code_of_conduct_signed,
            "last_audit_date": supplier.last_audit_date,
            "annual_spend": supplier.annual_spend,
            "overall_risk_level": supplier.overall_risk_level,
            "vibe_transparency_score": supplier.vibe_transparency_score,
            "vibe_collaboration_score": supplier.vibe_collaboration_score
        })
    
    return supplier_data

@router.post("/suppliers")
async def create_supplier(
    supplier_data: SupplierCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Add supplier to sustainability assessment program"""
    
    # Check if supplier code already exists
    existing = db.query(SupplyChainSustainability).filter(
        SupplyChainSustainability.supplier_code == supplier_data.supplier_code,
        SupplyChainSustainability.organization_id == current_user.organization_id
    ).first()
    
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Supplier with this code already exists"
        )
    
    supplier = SupplyChainSustainability(
        organization_id=current_user.organization_id,
        last_assessment_date=datetime.utcnow(),
        **supplier_data.dict()
    )
    
    # Initialize VIBE scores
    supplier.vibe_transparency_score = 60.0  # Initial baseline
    supplier.vibe_collaboration_score = 65.0  # Will improve with engagement
    
    db.add(supplier)
    db.commit()
    db.refresh(supplier)
    
    return {"message": "Supplier added successfully", "supplier_id": str(supplier.id)}

@router.get("/suppliers/analytics")
async def get_supplier_analytics(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Supply chain sustainability analytics with VIBE insights"""
    
    suppliers = db.query(SupplyChainSustainability).filter(
        SupplyChainSustainability.organization_id == current_user.organization_id
    ).all()
    
    if not suppliers:
        return {"message": "No supplier data found"}
    
    # Calculate key metrics
    avg_sustainability_score = sum([s.sustainability_score or 0 for s in suppliers]) / len(suppliers)
    high_risk_suppliers = len([s for s in suppliers if s.overall_risk_level == "high"])
    code_compliance_rate = len([s for s in suppliers if s.code_of_conduct_signed]) / len(suppliers) * 100
    
    # Tier analysis
    tier_breakdown = {}
    for tier in range(1, 6):
        tier_suppliers = [s for s in suppliers if s.tier_level == tier]
        if tier_suppliers:
            tier_breakdown[f"tier_{tier}"] = {
                "count": len(tier_suppliers),
                "avg_score": sum([s.sustainability_score or 0 for s in tier_suppliers]) / len(tier_suppliers)
            }
    
    # VIBE supply chain scores
    avg_transparency = sum([s.vibe_transparency_score or 0 for s in suppliers]) / len(suppliers)
    avg_collaboration = sum([s.vibe_collaboration_score or 0 for s in suppliers]) / len(suppliers)
    
    return {
        "summary": {
            "total_suppliers": len(suppliers),
            "average_sustainability_score": avg_sustainability_score,
            "high_risk_suppliers": high_risk_suppliers,
            "code_compliance_rate": code_compliance_rate,
            "suppliers_with_audits": len([s for s in suppliers if s.last_audit_date])
        },
        "tier_breakdown": tier_breakdown,
        "vibe_scores": {
            "transparency": avg_transparency,
            "collaboration": avg_collaboration,
            "overall_supply_chain": (avg_transparency + avg_collaboration) / 2
        },
        "risk_distribution": {
            "low": len([s for s in suppliers if s.overall_risk_level == "low"]),
            "medium": len([s for s in suppliers if s.overall_risk_level == "medium"]),
            "high": high_risk_suppliers
        }
    }

# ================================================================================
# SOCIAL IMPACT ENDPOINTS
# ================================================================================

@router.get("/social-impact")
async def list_social_programs(
    program_type: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """List social impact programs with community value metrics"""
    
    query = db.query(SocialImpact).filter(SocialImpact.organization_id == current_user.organization_id)
    
    if program_type:
        query = query.filter(SocialImpact.program_type == program_type)
    
    programs = query.order_by(desc(SocialImpact.start_date)).all()
    
    program_data = []
    for program in programs:
        program_data.append({
            "id": str(program.id),
            "program_name": program.program_name,
            "program_type": program.program_type,
            "location": program.location,
            "start_date": program.start_date,
            "end_date": program.end_date,
            "status": program.status,
            "target_beneficiaries": program.target_beneficiaries,
            "actual_beneficiaries": program.actual_beneficiaries,
            "budget_allocated": program.budget_allocated,
            "actual_spend": program.actual_spend,
            "direct_jobs_created": program.direct_jobs_created,
            "primary_sdg": program.primary_sdg,
            "vibe_community_value": program.vibe_community_value,
            "vibe_sustainability_score": program.vibe_sustainability_score
        })
    
    return program_data

@router.post("/social-impact")
async def create_social_program(
    program_data: SocialImpactCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Create social impact program with community value assessment"""
    
    program = SocialImpact(
        organization_id=current_user.organization_id,
        status="Active",
        **program_data.dict()
    )
    
    # Calculate VIBE community value scores
    base_value = 70.0
    if program_data.target_beneficiaries > 1000:
        base_value += 15.0
    elif program_data.target_beneficiaries > 100:
        base_value += 10.0
    
    # SDG alignment bonus
    if program_data.primary_sdg in [1, 2, 3, 4, 5]:  # High impact SDGs
        base_value += 10.0
    
    program.vibe_community_value = min(100, base_value)
    program.vibe_sustainability_score = 75.0  # Updated based on outcomes
    
    db.add(program)
    db.commit()
    db.refresh(program)
    
    return {"message": "Social impact program created", "program_id": str(program.id)}

# ================================================================================
# COMPREHENSIVE DASHBOARD ENDPOINT
# ================================================================================

@router.get("/dashboard")
async def get_sustainability_dashboard(
    year: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Comprehensive sustainability dashboard with VIBE excellence metrics"""
    
    current_year = year or datetime.now().year
    
    # Water metrics
    water_records = db.query(WaterManagement).filter(
        WaterManagement.organization_id == current_user.organization_id,
        func.extract('year', WaterManagement.period_start) == current_year
    ).all()
    
    # Waste metrics
    waste_records = db.query(WasteManagement).filter(
        WasteManagement.organization_id == current_user.organization_id,
        func.extract('year', WasteManagement.period_start) == current_year
    ).all()
    
    # Supplier metrics
    suppliers = db.query(SupplyChainSustainability).filter(
        SupplyChainSustainability.organization_id == current_user.organization_id
    ).all()
    
    # Social impact metrics
    social_programs = db.query(SocialImpact).filter(
        SocialImpact.organization_id == current_user.organization_id,
        func.extract('year', SocialImpact.start_date) == current_year
    ).all()
    
    # Calculate comprehensive VIBE scores
    water_score = sum([r.vibe_efficiency_score or 0 for r in water_records]) / len(water_records) if water_records else 0
    waste_score = sum([r.vibe_circularity_score or 0 for r in waste_records]) / len(waste_records) if waste_records else 0
    supply_chain_score = sum([s.vibe_transparency_score or 0 for s in suppliers]) / len(suppliers) if suppliers else 0
    social_score = sum([p.vibe_community_value or 0 for p in social_programs]) / len(social_programs) if social_programs else 0
    
    overall_balance_score = (water_score + waste_score + supply_chain_score + social_score) / 4
    
    return {
        "sustainability_overview": {
            "reporting_year": current_year,
            "last_updated": datetime.utcnow().isoformat()
        },
        "water_stewardship": {
            "total_consumption": sum([r.total_withdrawal or 0 for r in water_records]),
            "average_recycling_rate": sum([r.recycling_rate or 0 for r in water_records]) / len(water_records) if water_records else 0,
            "vibe_efficiency_score": water_score
        },
        "circular_economy": {
            "waste_streams_tracked": len(waste_records),
            "average_diversion_rate": sum([r.material_recovery_rate or 0 for r in waste_records]) / len(waste_records) * 100 if waste_records else 0,
            "vibe_circularity_score": waste_score
        },
        "supply_chain": {
            "suppliers_assessed": len(suppliers),
            "average_sustainability_score": sum([s.sustainability_score or 0 for s in suppliers]) / len(suppliers) if suppliers else 0,
            "vibe_transparency_score": supply_chain_score
        },
        "social_impact": {
            "active_programs": len([p for p in social_programs if p.status == "Active"]),
            "total_beneficiaries": sum([p.actual_beneficiaries or p.target_beneficiaries for p in social_programs]),
            "vibe_community_value": social_score
        },
        "vibe_excellence": {
            "balance_score": overall_balance_score,
            "maturity_level": "Advanced" if overall_balance_score > 80 else "Developing" if overall_balance_score > 60 else "Beginning",
            "key_strengths": self._identify_strengths(water_score, waste_score, supply_chain_score, social_score),
            "improvement_areas": self._identify_improvements(water_score, waste_score, supply_chain_score, social_score)
        }
    }

def _identify_strengths(water, waste, supply, social):
    """Helper to identify sustainability strengths"""
    scores = {
        "Water Stewardship": water,
        "Circular Economy": waste,
        "Supply Chain": supply,
        "Social Impact": social
    }
    return [area for area, score in scores.items() if score > 80]

def _identify_improvements(water, waste, supply, social):
    """Helper to identify improvement areas"""
    scores = {
        "Water Stewardship": water,
        "Circular Economy": waste,
        "Supply Chain": supply,
        "Social Impact": social
    }
    return [area for area, score in scores.items() if score < 70]