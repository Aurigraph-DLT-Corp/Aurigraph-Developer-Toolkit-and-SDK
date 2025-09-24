"""
Minimal HydroPulse Backend for Domain Deployment
This is a temporary minimal version to allow nginx to start while we fix the main application.
"""
from fastapi import FastAPI
import uvicorn
import os

app = FastAPI(title="Aurex HydroPulse - Minimal", version="1.0.0")

@app.get("/")
async def root():
    return {"message": "Aurex HydroPulse API - Minimal Version", "status": "healthy"}

@app.get("/health")
async def health():
    return {"status": "healthy", "version": "minimal"}

@app.get("/api/health")
async def api_health():
    return {"status": "healthy", "service": "hydropulse-minimal"}

if __name__ == "__main__":
    port = int(os.getenv("PORT", 8002))
    uvicorn.run(app, host="0.0.0.0", port=port)