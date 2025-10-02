"""
Simple Aurex Main Platform Backend for Testing
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from datetime import datetime

# Create FastAPI app
app = FastAPI(
    title="Aurex Platform™ - Main Gateway",
    description="Main homepage and gateway for the complete Aurex sustainability platform",
    version="2.1.0"
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
    """Root endpoint - Platform information"""
    return {
        "message": "Aurex Platform™ - Complete Sustainability Platform",
        "version": "2.1.0",
        "description": "Comprehensive DMRV-compliant platform for carbon accounting, ESG assessment, and sustainability management",
        "status": "operational",
        "timestamp": datetime.utcnow().isoformat(),
        "applications": {
            "aurex-main": {
                "name": "Aurex Main Platform",
                "description": "Main homepage and gateway",
                "url": "/",
                "port": 3000,
                "status": "operational"
            },
            "aurex-launchpad": {
                "name": "Aurex Launchpad™",
                "description": "ESG Assessment & Sustainability Management",
                "url": "http://localhost:3001",
                "port": 3001,
                "status": "operational"
            },
            "aurex-hydropulse": {
                "name": "Aurex HydroPulse™",
                "description": "Smart Water Management & AWD Platform",
                "url": "http://localhost:3002",
                "port": 3002,
                "status": "operational"
            },
            "aurex-sylvagraph": {
                "name": "Aurex Sylvagraph™",
                "description": "Drone-based Agroforestry Monitoring",
                "url": "http://localhost:3003",
                "port": 3003,
                "status": "operational"
            },
            "aurex-carbontrace": {
                "name": "Aurex CarbonTrace™",
                "description": "Carbon Credit Issuance & Trading",
                "url": "http://localhost:3004",
                "port": 3004,
                "status": "operational"
            }
        }
    }

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "timestamp": datetime.utcnow().isoformat(),
        "service": "aurex-main",
        "version": "2.1.0"
    }

@app.get("/api/v1/platform/info")
async def platform_info():
    """Platform information API"""
    return {
        "platform": "Aurex Platform™",
        "company": "Aurigraph",
        "version": "2.1.0",
        "description": "Complete sustainability platform with DMRV compliance",
        "applications": 5,
        "features": [
            "ESG Assessment",
            "Carbon Management",
            "Water Management",
            "Agroforestry Monitoring",
            "Carbon Trading",
            "DMRV Compliance",
            "Real-time Monitoring",
            "Blockchain Integration"
        ]
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
