from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
import json
from datetime import datetime, date
import os

# Initialize FastAPI app
app = FastAPI(
    title="Aurex Sylvagraph API",
    description="Comprehensive API for forest management, carbon sequestration, and satellite imagery analysis.",
    version="2.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# CORS middleware for frontend integration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Configure appropriately for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Pydantic models for forest management
class ForestProject(BaseModel):
    id: Optional[str] = None
    name: str
    location: Dict[str, float]  # lat, lng
    area_hectares: float
    project_type: str  # reforestation, conservation, agroforestry
    start_date: date
    status: str
    carbon_stock: Optional[float] = None

class SatelliteImage(BaseModel):
    id: Optional[str] = None
    project_id: str
    image_url: str
    capture_date: datetime
    satellite_type: str  # landsat, sentinel-2
    analysis_status: str
    deforestation_detected: bool = False

class CarbonCalculation(BaseModel):
    project_id: str
    calculation_date: datetime
    biomass_tons: float
    carbon_tons: float
    co2_equivalent: float
    verification_status: str

class BiodiversityMetric(BaseModel):
    project_id: str
    species_count: int
    endemic_species: int
    habitat_quality_score: float
    measurement_date: datetime

# In-memory storage for demo purposes
forest_projects: List[ForestProject] = [
    ForestProject(
        id="proj_001",
        name="Amazon Reforestation Initiative",
        location={"lat": -3.4653, "lng": -62.2159},
        area_hectares=1500.0,
        project_type="reforestation",
        start_date=date(2023, 1, 15),
        status="active",
        carbon_stock=4500.0
    ),
    ForestProject(
        id="proj_002", 
        name="Congo Basin Conservation",
        location={"lat": -0.2280, "lng": 18.1128},
        area_hectares=2800.0,
        project_type="conservation",
        start_date=date(2022, 8, 20),
        status="monitoring",
        carbon_stock=8200.0
    )
]

satellite_images: List[SatelliteImage] = []
carbon_calculations: List[CarbonCalculation] = []
biodiversity_metrics: List[BiodiversityMetric] = []

# Health and root endpoints
@app.get("/health", tags=["Health"])
def read_health():
    """Health check endpoint."""
    return {"status": "healthy", "timestamp": datetime.now().isoformat()}

@app.get("/", tags=["Health"])
def read_root():
    """Root endpoint with API information."""
    return {
        "message": "Welcome to the Aurex Sylvagraph API",
        "version": "2.0.0",
        "features": [
            "Forest project management",
            "Satellite imagery analysis", 
            "Carbon sequestration tracking",
            "Biodiversity monitoring",
            "Real-time deforestation alerts"
        ]
    }

# Forest project management endpoints
@app.get("/api/projects", tags=["Forest Projects"], response_model=List[ForestProject])
def get_forest_projects():
    """Retrieve all forest projects."""
    return forest_projects

@app.get("/api/projects/{project_id}", tags=["Forest Projects"], response_model=ForestProject)
def get_forest_project(project_id: str):
    """Retrieve a specific forest project."""
    project = next((p for p in forest_projects if p.id == project_id), None)
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    return project

@app.post("/api/projects", tags=["Forest Projects"], response_model=ForestProject)
def create_forest_project(project: ForestProject):
    """Create a new forest project."""
    project.id = f"proj_{len(forest_projects) + 1:03d}"
    forest_projects.append(project)
    return project

# Satellite imagery endpoints
@app.get("/api/satellite-images", tags=["Satellite Imagery"])
def get_satellite_images(project_id: Optional[str] = None):
    """Retrieve satellite images, optionally filtered by project."""
    if project_id:
        return [img for img in satellite_images if img.project_id == project_id]
    return satellite_images

@app.post("/api/satellite-images/analyze", tags=["Satellite Imagery"])
def analyze_satellite_image(image_data: Dict[str, Any]):
    """Process satellite image for deforestation detection."""
    # Simulated analysis
    analysis_result = {
        "image_id": image_data.get("image_id"),
        "deforestation_detected": False,
        "forest_cover_percentage": 87.3,
        "change_detection": {
            "area_lost_hectares": 0.0,
            "area_gained_hectares": 2.1
        },
        "analysis_timestamp": datetime.now().isoformat()
    }
    return analysis_result

# Carbon sequestration endpoints
@app.get("/api/carbon-calculations", tags=["Carbon Sequestration"])
def get_carbon_calculations(project_id: Optional[str] = None):
    """Retrieve carbon calculations, optionally filtered by project."""
    if project_id:
        return [calc for calc in carbon_calculations if calc.project_id == project_id]
    return carbon_calculations

@app.post("/api/carbon-calculations/calculate", tags=["Carbon Sequestration"])
def calculate_carbon_sequestration(calculation_request: Dict[str, Any]):
    """Calculate carbon sequestration for a forest project."""
    project_id = calculation_request.get("project_id")
    biomass = calculation_request.get("biomass_tons", 0)
    
    # Simplified carbon calculation (biomass * 0.47 * 3.67)
    carbon_tons = biomass * 0.47
    co2_equivalent = carbon_tons * 3.67
    
    calculation = CarbonCalculation(
        project_id=project_id,
        calculation_date=datetime.now(),
        biomass_tons=biomass,
        carbon_tons=carbon_tons,
        co2_equivalent=co2_equivalent,
        verification_status="pending"
    )
    
    carbon_calculations.append(calculation)
    return calculation

# Biodiversity monitoring endpoints
@app.get("/api/biodiversity", tags=["Biodiversity"])
def get_biodiversity_metrics(project_id: Optional[str] = None):
    """Retrieve biodiversity metrics, optionally filtered by project."""
    if project_id:
        return [metric for metric in biodiversity_metrics if metric.project_id == project_id]
    return biodiversity_metrics

@app.post("/api/biodiversity/assess", tags=["Biodiversity"])
def assess_biodiversity(assessment_data: Dict[str, Any]):
    """Assess biodiversity metrics for a forest area."""
    project_id = assessment_data.get("project_id")
    
    # Simulated biodiversity assessment
    metric = BiodiversityMetric(
        project_id=project_id,
        species_count=assessment_data.get("species_count", 45),
        endemic_species=assessment_data.get("endemic_species", 8),
        habitat_quality_score=assessment_data.get("habitat_quality_score", 7.8),
        measurement_date=datetime.now()
    )
    
    biodiversity_metrics.append(metric)
    return metric

# Real-time monitoring endpoints
@app.get("/api/alerts/deforestation", tags=["Monitoring"])
def get_deforestation_alerts():
    """Retrieve recent deforestation alerts."""
    return {
        "alerts": [
            {
                "id": "alert_001",
                "project_id": "proj_001",
                "severity": "medium",
                "area_affected_hectares": 0.8,
                "detection_date": "2024-01-15T10:30:00Z",
                "coordinates": {"lat": -3.4653, "lng": -62.2159},
                "status": "investigating"
            }
        ],
        "total_alerts": 1,
        "last_updated": datetime.now().isoformat()
    }

@app.get("/api/dashboard/summary", tags=["Dashboard"])
def get_dashboard_summary():
    """Retrieve dashboard summary data."""
    total_projects = len(forest_projects)
    total_area = sum(p.area_hectares for p in forest_projects)
    total_carbon = sum(p.carbon_stock or 0 for p in forest_projects)
    
    return {
        "total_projects": total_projects,
        "total_area_hectares": total_area,
        "total_carbon_stock_tons": total_carbon,
        "active_projects": len([p for p in forest_projects if p.status == "active"]),
        "recent_alerts": 1,
        "last_updated": datetime.now().isoformat()
    }

# Development and testing endpoints
@app.get("/api/test/connection", tags=["Testing"])
def test_connection():
    """Test API connection and response."""
    return {
        "status": "connected",
        "environment": os.getenv("ENVIRONMENT", "development"),
        "timestamp": datetime.now().isoformat(),
        "features_available": [
            "forest_project_management",
            "satellite_imagery_analysis",
            "carbon_sequestration_tracking",
            "biodiversity_monitoring",
            "real_time_alerts"
        ]
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8003)

# To run this application:
# uvicorn main:app --reload --port 8003 --host 0.0.0.0