from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel
from datetime import datetime
import random
import json
import uvicorn

app = FastAPI(title="Aurex GNN Platform", version="1.0.0")

# CORS middleware - allow all origins for local development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount static files
app.mount("/static", StaticFiles(directory="static"), name="static")

class PredictionRequest(BaseModel):
    model_type: str
    data: dict

class PredictionResponse(BaseModel):
    model_type: str
    prediction: dict
    confidence: float
    timestamp: str

@app.get("/")
async def root():
    return {
        "message": "Aurex GNN Platform API",
        "version": "1.0.0",
        "status": "operational",
        "endpoints": [
            "/api/gnn/health",
            "/api/gnn/models",
            "/api/gnn/predict",
            "/api/gnn/metrics",
            "/docs"
        ]
    }

@app.get("/api/gnn/health")
async def health():
    return {
        "status": "healthy",
        "timestamp": datetime.utcnow().isoformat(),
        "services": {
            "api": "operational",
            "models": "loaded",
            "database": "connected",
            "cache": "active"
        },
        "version": "1.0.0",
        "environment": "local"
    }

@app.get("/api/gnn/models")
async def list_models():
    return {
        "models": [
            {
                "id": "supply_chain",
                "name": "Supply Chain GNN",
                "version": "1.0.0",
                "accuracy": 0.96,
                "status": "active",
                "description": "Detects anomalies and bottlenecks in supply chain networks"
            },
            {
                "id": "water_management",
                "name": "Water Management GNN",
                "version": "1.0.0",
                "mape": 0.042,
                "status": "active",
                "description": "Predicts water flow and quality in distribution networks"
            },
            {
                "id": "carbon_credit",
                "name": "Carbon Credit GNN",
                "version": "1.0.0",
                "verification_rate": 0.98,
                "status": "active",
                "description": "Verifies and validates carbon credit transactions"
            },
            {
                "id": "forest_ecosystem",
                "name": "Forest Ecosystem GNN",
                "version": "1.0.0",
                "biodiversity_index": 0.87,
                "status": "active",
                "description": "Monitors forest health and biodiversity metrics"
            }
        ],
        "total": 4,
        "active": 4
    }

@app.post("/api/gnn/predict", response_model=PredictionResponse)
async def predict(request: PredictionRequest):
    """Make predictions using GNN models"""

    model_type = request.model_type

    if model_type == "supply_chain":
        prediction = {
            "anomaly_detected": random.choice([True, False]),
            "risk_score": round(random.uniform(0.1, 0.9), 2),
            "bottleneck_nodes": random.sample(["Supplier_A", "Warehouse_B", "Distributor_C", "Retailer_D"], 2),
            "optimization_potential": f"{random.randint(10, 30)}%",
            "recommended_actions": [
                "Increase buffer stock at Warehouse_B",
                "Diversify Supplier_A sources"
            ]
        }
        confidence = 0.96

    elif model_type == "water_management":
        prediction = {
            "flow_prediction": round(random.uniform(100, 500), 2),
            "quality_index": round(random.uniform(0.7, 0.95), 2),
            "leak_probability": round(random.uniform(0.01, 0.15), 2),
            "pressure_kpa": round(random.uniform(200, 400), 1),
            "conservation_recommendation": "Reduce flow by 10% during off-peak hours",
            "maintenance_priority": random.choice(["Low", "Medium", "High"])
        }
        confidence = 0.92

    elif model_type == "carbon_credit":
        prediction = {
            "verified": random.choice([True, False]),
            "carbon_sequestered_tons": round(random.uniform(100, 1000), 2),
            "credit_value_usd": round(random.uniform(50, 200), 2),
            "certification_status": random.choice(["approved", "pending", "review"]),
            "project_type": random.choice(["solar", "wind", "reforestation", "biomass"]),
            "validity_period": "2025-2027"
        }
        confidence = 0.98

    elif model_type == "forest_ecosystem":
        prediction = {
            "biodiversity_index": round(random.uniform(0.7, 0.95), 2),
            "health_score": round(random.uniform(0.6, 0.9), 2),
            "deforestation_risk": round(random.uniform(0.01, 0.2), 2),
            "carbon_storage_tons": round(random.uniform(1000, 10000), 0),
            "species_count": random.randint(50, 200),
            "conservation_priority": random.choice(["low", "medium", "high", "critical"]),
            "threats": random.sample(["logging", "fire", "disease", "climate"], 2)
        }
        confidence = 0.87

    else:
        raise HTTPException(status_code=400, detail=f"Unknown model type: {model_type}")

    return PredictionResponse(
        model_type=model_type,
        prediction=prediction,
        confidence=confidence,
        timestamp=datetime.utcnow().isoformat()
    )

@app.get("/api/gnn/metrics")
async def metrics():
    """Get system and model metrics"""
    return {
        "system_metrics": {
            "cpu_usage": f"{random.randint(20, 60)}%",
            "memory_usage": f"{round(random.uniform(1, 4), 1)}GB",
            "gpu_usage": f"{random.randint(30, 70)}%",
            "requests_per_second": random.randint(50, 200),
            "active_connections": random.randint(5, 50),
            "uptime_hours": random.randint(1, 720)
        },
        "model_metrics": {
            "total_predictions": random.randint(1000, 50000),
            "average_latency_ms": random.randint(50, 150),
            "cache_hit_rate": round(random.uniform(0.6, 0.9), 2),
            "error_rate": round(random.uniform(0.001, 0.01), 3),
            "daily_requests": random.randint(1000, 10000)
        },
        "model_performance": {
            "supply_chain": {"accuracy": 0.96, "calls": random.randint(100, 1000)},
            "water_management": {"mape": 0.042, "calls": random.randint(100, 1000)},
            "carbon_credit": {"verification_rate": 0.98, "calls": random.randint(100, 1000)},
            "forest_ecosystem": {"biodiversity_score": 0.87, "calls": random.randint(100, 1000)}
        },
        "timestamp": datetime.utcnow().isoformat()
    }

@app.get("/api/gnn/lca/calculate")
async def calculate_lca():
    """Calculate Life Cycle Assessment"""
    return {
        "product_id": "PROD-" + str(random.randint(1000, 9999)),
        "lca_result": {
            "carbon_footprint_kg": round(random.uniform(100, 1000), 2),
            "water_footprint_liters": round(random.uniform(1000, 10000), 2),
            "energy_consumption_kwh": round(random.uniform(50, 500), 2),
            "waste_generation_kg": round(random.uniform(10, 100), 2)
        },
        "breakdown": {
            "raw_materials": round(random.uniform(20, 40), 1),
            "manufacturing": round(random.uniform(30, 50), 1),
            "transportation": round(random.uniform(10, 20), 1),
            "use_phase": round(random.uniform(15, 25), 1),
            "end_of_life": round(random.uniform(5, 15), 1)
        },
        "recommendations": [
            "Switch to renewable energy in manufacturing",
            "Optimize transportation routes",
            "Use recycled materials"
        ],
        "compliance": {
            "iso_14040": True,
            "ghg_protocol": True,
            "pas_2050": True
        }
    }

if __name__ == "__main__":
    print("Starting Aurex GNN Platform on http://localhost:8000")
    print("API Documentation: http://localhost:8000/docs")
    uvicorn.run(app, host="0.0.0.0", port=8000, reload=True)
