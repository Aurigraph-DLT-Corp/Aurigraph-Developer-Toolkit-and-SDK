"""
Aurex Launchpad - FastAPI Backend
Simple working version for deployment testing
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import uvicorn

# FastAPI app
app = FastAPI(
    title="Aurex Launchpad API",
    description="ESG Assessment & Sustainability Management",
    version="1.0.0"
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "message": "Aurex Launchpad™ - ESG Assessment & Sustainability Management",
        "version": "1.0.0",
        "status": "operational",
        "features": ["ESG Assessment", "GHG Analytics", "Reporting"]
    }

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "healthy", "service": "aurex-launchpad", "version": "1.0.0"}

@app.get("/api/v1/assessments/")
async def list_assessments():
    """List ESG assessments"""
    return {
        "assessments": [
            {"id": 1, "type": "ESG Audit", "status": "completed", "score": 85.3},
            {"id": 2, "type": "Carbon Footprint", "status": "in_progress", "score": None}
        ]
    }

@app.get("/api/v1/emissions/")
async def list_emissions():
    """List GHG emissions"""
    return {
        "emissions": [
            {"id": 1, "year": 2023, "total": 5561.5, "status": "verified"},
            {"id": 2, "year": 2023, "total": 10330.7, "status": "pending"}
        ]
    }

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8001)
