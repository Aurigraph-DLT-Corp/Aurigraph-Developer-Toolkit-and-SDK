"""
Aurex Main Platform - FastAPI Backend
Simple working version for deployment testing
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import uvicorn

# FastAPI app
app = FastAPI(
    title="Aurex Main Platform API",
    description="Main platform API for Aurex applications",
    version="1.0.0"
)

# Secure CORS configuration - replace with actual production domains
allowed_origins = [
    "https://dev.aurigraph.io",
    "https://aurigraph.io",
    "http://localhost:3000",  # Development only
    "http://localhost:5173",  # Vite dev server
]

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["Authorization", "Content-Type", "X-Requested-With"],
)

# Simple health endpoints
@app.get("/")
async def root():
    """Root endpoint - Platform information"""
    return {
        "message": "Aurex Platform™ - Complete Sustainability Platform",
        "version": "2.1.0",
        "status": "operational",
        "applications": {
            "aurex-main": {"name": "Aurex Main Platform", "port": 3000},
            "aurex-launchpad": {"name": "Aurex Launchpad™", "port": 3001},
            "aurex-hydropulse": {"name": "Aurex HydroPulse™", "port": 3002},
            "aurex-sylvagraph": {"name": "Aurex Sylvagraph™", "port": 3003},
            "aurex-carbontrace": {"name": "Aurex CarbonTrace™", "port": 3004}
        }
    }

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "healthy", "service": "aurex-main", "version": "2.1.0"}

@app.get("/api/v1/applications")
async def list_applications():
    """List all available applications"""
    return {
        "applications": [
            {"id": "aurex-main", "name": "Aurex Main Platform", "url": "http://localhost:3000"},
            {"id": "aurex-launchpad", "name": "Aurex Launchpad™", "url": "http://localhost:3001"},
            {"id": "aurex-hydropulse", "name": "Aurex HydroPulse™", "url": "http://localhost:3002"},
            {"id": "aurex-sylvagraph", "name": "Aurex Sylvagraph™", "url": "http://localhost:3003"},
            {"id": "aurex-carbontrace", "name": "Aurex CarbonTrace™", "url": "http://localhost:3004"}
        ]
    }

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
