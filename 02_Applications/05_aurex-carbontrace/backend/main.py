from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime, date
from pydantic import BaseModel
import os

from database import get_db, engine, Base

# Create database tables
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Aurex CarbonTrace API",
    description="Comprehensive API for tracking and managing carbon emissions across Scope 1, 2, and 3.",
    version="2.0.0",
    docs_url="/api/docs",
    redoc_url="/api/redoc",
)

# CORS middleware for production deployment
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Configure appropriately for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Pydantic models for carbon tracking
class EmissionFactorBase(BaseModel):
    source: str
    category: str
    factor_type: str
    value: float
    unit: str
    region: Optional[str] = None
    year: Optional[int] = None

class CarbonActivityBase(BaseModel):
    activity_type: str
    scope: int  # 1, 2, or 3
    category: str
    amount: float
    unit: str
    emission_factor_id: Optional[int] = None
    calculated_emissions: Optional[float] = None
    date_recorded: date
    facility_id: Optional[str] = None
    description: Optional[str] = None

class CarbonOffsetBase(BaseModel):
    project_name: str
    project_type: str
    credits_purchased: float
    credits_retired: float
    vintage_year: int
    verification_standard: str
    purchase_date: date
    retirement_date: Optional[date] = None
    cost_per_credit: Optional[float] = None

class CarbonReductionTargetBase(BaseModel):
    target_name: str
    baseline_year: int
    target_year: int
    baseline_emissions: float
    target_emissions: float
    target_percentage: float
    scope: str  # "scope1", "scope2", "scope3", "total"
    status: str = "active"

# Health and root endpoints
@app.get("/health", tags=["Health"])
def read_health():
    """Health check endpoint."""
    return {"status": "healthy", "service": "carbontrace", "port": 8004}

@app.get("/", tags=["Health"])
def read_root():
    """Root endpoint."""
    return {"message": "Welcome to the Aurex CarbonTrace API - Comprehensive Carbon Footprint Tracking"}

# Carbon calculation endpoints
@app.get("/api/carbon/dashboard", tags=["Carbon Dashboard"])
def get_carbon_dashboard(db: Session = Depends(get_db)):
    """Get comprehensive carbon dashboard data."""
    return {
        "total_emissions": {
            "scope1": 1250.5,
            "scope2": 890.2,
            "scope3": 3420.8,
            "total": 5561.5,
            "unit": "tCO2e"
        },
        "monthly_trends": [
            {"month": "2024-01", "scope1": 105.2, "scope2": 78.5, "scope3": 285.1},
            {"month": "2024-02", "scope1": 98.7, "scope2": 82.1, "scope3": 290.3},
            {"month": "2024-03", "scope1": 110.5, "scope2": 75.8, "scope3": 305.7}
        ],
        "reduction_progress": {
            "target_reduction": 25.0,
            "achieved_reduction": 12.5,
            "remaining": 12.5
        },
        "offset_status": {
            "total_offsets": 500.0,
            "retired_offsets": 350.0,
            "pending_retirement": 150.0
        }
    }

@app.get("/api/carbon/emissions/scope/{scope_number}", tags=["Emissions"])
def get_scope_emissions(scope_number: int, db: Session = Depends(get_db)):
    """Get emissions data for specific scope (1, 2, or 3)."""
    if scope_number not in [1, 2, 3]:
        raise HTTPException(status_code=400, detail="Scope must be 1, 2, or 3")
    
    scope_data = {
        1: {
            "scope": 1,
            "name": "Direct Emissions",
            "categories": [
                {"category": "Stationary Combustion", "emissions": 450.2, "percentage": 36.0},
                {"category": "Mobile Combustion", "emissions": 380.5, "percentage": 30.4},
                {"category": "Process Emissions", "emissions": 280.8, "percentage": 22.5},
                {"category": "Fugitive Emissions", "emissions": 139.0, "percentage": 11.1}
            ],
            "total": 1250.5,
            "unit": "tCO2e"
        },
        2: {
            "scope": 2,
            "name": "Indirect Energy Emissions",
            "categories": [
                {"category": "Purchased Electricity", "emissions": 620.8, "percentage": 69.7},
                {"category": "Purchased Steam", "emissions": 180.2, "percentage": 20.2},
                {"category": "Purchased Heating", "emissions": 89.2, "percentage": 10.1}
            ],
            "total": 890.2,
            "unit": "tCO2e"
        },
        3: {
            "scope": 3,
            "name": "Other Indirect Emissions",
            "categories": [
                {"category": "Purchased Goods & Services", "emissions": 1205.5, "percentage": 35.2},
                {"category": "Business Travel", "emissions": 485.2, "percentage": 14.2},
                {"category": "Employee Commuting", "emissions": 350.8, "percentage": 10.3},
                {"category": "Upstream Transportation", "emissions": 420.5, "percentage": 12.3},
                {"category": "Waste Generated", "emissions": 280.3, "percentage": 8.2},
                {"category": "Use of Sold Products", "emissions": 678.5, "percentage": 19.8}
            ],
            "total": 3420.8,
            "unit": "tCO2e"
        }
    }
    
    return scope_data[scope_number]

@app.get("/api/carbon/factors", tags=["Emission Factors"])
def get_emission_factors(source: Optional[str] = None, db: Session = Depends(get_db)):
    """Get emission factors from EPA and DEFRA databases."""
    factors = [
        {"id": 1, "source": "EPA", "category": "Natural Gas", "factor": 0.18391, "unit": "kg CO2e/kWh"},
        {"id": 2, "source": "EPA", "category": "Electricity - US Grid", "factor": 0.709, "unit": "kg CO2e/kWh"},
        {"id": 3, "source": "DEFRA", "category": "Gasoline", "factor": 2.31, "unit": "kg CO2e/liter"},
        {"id": 4, "source": "DEFRA", "category": "Diesel", "factor": 2.68, "unit": "kg CO2e/liter"},
        {"id": 5, "source": "EPA", "category": "Air Travel - Domestic", "factor": 0.24, "unit": "kg CO2e/km"},
        {"id": 6, "source": "EPA", "category": "Freight Transport", "factor": 0.089, "unit": "kg CO2e/tonne-km"}
    ]
    
    if source:
        factors = [f for f in factors if f["source"].lower() == source.lower()]
    
    return {"emission_factors": factors, "total_count": len(factors)}

@app.post("/api/carbon/calculate", tags=["Carbon Calculation"])
def calculate_carbon_emissions(activity: CarbonActivityBase, db: Session = Depends(get_db)):
    """Calculate carbon emissions for an activity."""
    # Mock calculation - in production, this would use actual emission factors
    emission_factors = {
        "electricity": 0.709,  # kg CO2e/kWh
        "natural_gas": 0.18391,  # kg CO2e/kWh
        "gasoline": 2.31,  # kg CO2e/liter
        "diesel": 2.68,  # kg CO2e/liter
        "air_travel": 0.24,  # kg CO2e/km
        "freight": 0.089  # kg CO2e/tonne-km
    }
    
    factor = emission_factors.get(activity.activity_type.lower(), 1.0)
    calculated_emissions = activity.amount * factor
    
    return {
        "activity": activity.dict(),
        "emission_factor": factor,
        "calculated_emissions": calculated_emissions,
        "unit": "kg CO2e",
        "calculation_date": datetime.now().isoformat()
    }

@app.get("/api/carbon/offsets", tags=["Carbon Offsets"])
def get_carbon_offsets(db: Session = Depends(get_db)):
    """Get carbon offset portfolio."""
    return {
        "portfolio_summary": {
            "total_credits_purchased": 1000.0,
            "total_credits_retired": 650.0,
            "available_credits": 350.0,
            "total_investment": 25000.0,
            "average_price_per_credit": 25.0
        },
        "offset_projects": [
            {
                "id": 1,
                "name": "Amazon Rainforest Conservation",
                "type": "REDD+",
                "credits": 300,
                "vintage": 2023,
                "standard": "VCS",
                "status": "retired"
            },
            {
                "id": 2,
                "name": "Wind Farm Development - Texas",
                "type": "Renewable Energy",
                "credits": 250,
                "vintage": 2024,
                "standard": "Gold Standard",
                "status": "active"
            },
            {
                "id": 3,
                "name": "Methane Capture - Landfill",
                "type": "Waste Management",
                "credits": 450,
                "vintage": 2023,
                "standard": "ACR",
                "status": "retired"
            }
        ]
    }

@app.get("/api/carbon/reporting/climate", tags=["Climate Reporting"])
def get_climate_reporting_data(framework: Optional[str] = None, db: Session = Depends(get_db)):
    """Get climate reporting data for various frameworks (CDP, TCFD, GRI)."""
    base_data = {
        "reporting_period": "2024",
        "organization": "Sample Organization",
        "total_emissions": 5561.5,
        "emission_intensity": 0.285,  # tCO2e per unit revenue
        "reduction_targets": [
            {
                "target": "Net Zero by 2050",
                "baseline_year": 2019,
                "target_reduction": 100,
                "progress": 12.5
            },
            {
                "target": "50% reduction by 2030",
                "baseline_year": 2019,
                "target_reduction": 50,
                "progress": 25.0
            }
        ]
    }
    
    if framework == "CDP":
        return {
            **base_data,
            "cdp_specific": {
                "disclosure_level": "Management",
                "score": "B",
                "submission_date": "2024-07-31"
            }
        }
    elif framework == "TCFD":
        return {
            **base_data,
            "tcfd_pillars": {
                "governance": "Climate oversight by Board",
                "strategy": "1.5°C scenario planning",
                "risk_management": "Climate risks integrated",
                "metrics_targets": "Science-based targets set"
            }
        }
    elif framework == "GRI":
        return {
            **base_data,
            "gri_standards": {
                "gri_305_1": base_data["total_emissions"],
                "gri_305_4": base_data["emission_intensity"],
                "gri_305_5": "12.5% reduction achieved"
            }
        }
    
    return base_data

@app.get("/api/carbon/supply-chain", tags=["Supply Chain"])
def get_supply_chain_emissions(db: Session = Depends(get_db)):
    """Get supply chain carbon analysis."""
    return {
        "supply_chain_summary": {
            "total_suppliers": 45,
            "suppliers_with_data": 32,
            "data_coverage": 71.1,
            "total_scope3_emissions": 3420.8
        },
        "top_emitting_suppliers": [
            {"name": "Supplier A", "emissions": 850.5, "category": "Raw Materials"},
            {"name": "Supplier B", "emissions": 620.3, "category": "Manufacturing"},
            {"name": "Supplier C", "emissions": 480.2, "category": "Transportation"}
        ],
        "supplier_engagement": {
            "targets_set": 28,
            "reporting_suppliers": 32,
            "improvement_programs": 15
        }
    }

@app.get("/api/carbon/net-zero", tags=["Net Zero Planning"])
def get_net_zero_pathway(db: Session = Depends(get_db)):
    """Get net-zero pathway planning data."""
    return {
        "net_zero_target": {
            "target_year": 2050,
            "baseline_year": 2019,
            "baseline_emissions": 6500.0,
            "current_emissions": 5561.5,
            "required_reduction": 100.0
        },
        "pathway_milestones": [
            {"year": 2025, "target_emissions": 5200.0, "progress": "on_track"},
            {"year": 2030, "target_emissions": 3900.0, "progress": "requires_acceleration"},
            {"year": 2040, "target_emissions": 1300.0, "progress": "planning"},
            {"year": 2050, "target_emissions": 0.0, "progress": "target"}
        ],
        "reduction_strategies": [
            {"strategy": "Energy Efficiency", "potential_reduction": 800.0, "investment": 500000},
            {"strategy": "Renewable Energy", "potential_reduction": 1200.0, "investment": 2000000},
            {"strategy": "Process Optimization", "potential_reduction": 600.0, "investment": 800000},
            {"strategy": "Carbon Offsets", "potential_reduction": 2000.0, "investment": 1000000}
        ]
    }

# To run this application locally:
# uvicorn main:app --reload --port 8004 --host 0.0.0.0
