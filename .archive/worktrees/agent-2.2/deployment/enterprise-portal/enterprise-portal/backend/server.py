from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from datetime import datetime
import random
import uvicorn

app = FastAPI(title="Enterprise Portal API", version="3.0.0")

# Enable CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Data models
class Notification(BaseModel):
    id: int
    message: str
    type: str
    timestamp: datetime

class Metric(BaseModel):
    title: str
    value: str
    trend: str
    color: str

@app.get("/")
async def root():
    return {"message": "Enterprise Portal API", "status": "operational"}

@app.get("/api/notifications")
async def get_notifications():
    return [
        {"id": 1, "message": "GNN Platform deployed successfully", "type": "success", "timestamp": datetime.now()},
        {"id": 2, "message": "15 AI agents active", "type": "info", "timestamp": datetime.now()},
        {"id": 3, "message": "New sustainability report available", "type": "warning", "timestamp": datetime.now()},
        {"id": 4, "message": "Carbon footprint reduced by 12%", "type": "success", "timestamp": datetime.now()},
        {"id": 5, "message": "Water usage optimization complete", "type": "info", "timestamp": datetime.now()}
    ]

@app.get("/api/metrics/{module}")
async def get_metrics(module: str):
    metrics_data = {
        "dashboard": {
            "title": "Executive Dashboard",
            "cards": [
                {"title": "Revenue", "value": f"${random.randint(1, 9)}M", "trend": f"+{random.randint(5, 20)}%", "color": "green"},
                {"title": "Projects", "value": str(random.randint(20, 30)), "trend": "Active", "color": "blue"},
                {"title": "Efficiency", "value": f"{random.randint(85, 99)}%", "trend": "↑", "color": "yellow"},
                {"title": "Compliance", "value": "100%", "trend": "✓", "color": "green"}
            ],
            "charts": {
                "performance": [random.randint(60, 100) for _ in range(7)],
                "resources": {"cpu": 45, "memory": 62, "storage": 78, "network": 35}
            }
        },
        "gnn": {
            "title": "GNN Analytics Platform",
            "cards": [
                {"title": "Supply Chain", "value": "96%", "trend": "Accuracy", "color": "blue"},
                {"title": "Water Mgmt", "value": "4.2%", "trend": "MAPE", "color": "cyan"},
                {"title": "Carbon Credits", "value": "98%", "trend": "Verified", "color": "green"},
                {"title": "Forest Health", "value": "0.87", "trend": "Index", "color": "emerald"}
            ]
        },
        "sustainability": {
            "title": "Environmental Impact",
            "cards": [
                {"title": "CO2 Reduced", "value": f"{random.randint(100, 500)} tons", "trend": f"-{random.randint(10, 30)}%", "color": "green"},
                {"title": "Water Saved", "value": f"{random.randint(1, 5)}M liters", "trend": f"+{random.randint(15, 35)}%", "color": "blue"},
                {"title": "Energy Efficiency", "value": f"{random.randint(30, 50)}%", "trend": "Improved", "color": "yellow"},
                {"title": "Waste Reduced", "value": f"{random.randint(60, 90)}%", "trend": "↓", "color": "red"}
            ]
        },
        "agents": {
            "title": "AI Agent Mission Control",
            "cards": [
                {"title": "Active Agents", "value": "15", "trend": "Operational", "color": "green"},
                {"title": "Missions", "value": "24", "trend": "Completed", "color": "blue"},
                {"title": "Success Rate", "value": "96%", "trend": "High", "color": "green"},
                {"title": "Response Time", "value": "95ms", "trend": "Optimal", "color": "yellow"}
            ]
        }
    }

    return metrics_data.get(module, metrics_data["dashboard"])

@app.get("/api/agents/status")
async def get_agents_status():
    agents = [
        {"id": "SAA-001", "name": "Senior Architect", "status": "active", "cpu": 23, "memory": 512, "tasks": 156},
        {"id": "SOA-001", "name": "Security Ops", "status": "active", "cpu": 18, "memory": 256, "tasks": 234},
        {"id": "NNA-001", "name": "Neural Network", "status": "busy", "cpu": 67, "memory": 2048, "tasks": 45},
        {"id": "DOA-001", "name": "DevOps", "status": "active", "cpu": 34, "memory": 768, "tasks": 267},
        {"id": "DEA-001", "name": "Data Engineering", "status": "idle", "cpu": 5, "memory": 128, "tasks": 189}
    ]
    return agents

@app.post("/api/lca/calculate")
async def calculate_lca(product_data: dict):
    # Simulate LCA calculation
    carbon_footprint = random.uniform(100, 1000)
    water_footprint = random.uniform(1000, 10000)

    return {
        "product_id": f"PROD-{random.randint(1000, 9999)}",
        "carbon_footprint_kg": round(carbon_footprint, 2),
        "water_footprint_liters": round(water_footprint, 2),
        "energy_consumption_kwh": round(random.uniform(50, 500), 2),
        "recommendations": [
            "Switch to renewable energy",
            "Optimize transportation routes",
            "Use recycled materials"
        ]
    }

@app.get("/api/system/health")
async def system_health():
    return {
        "status": "healthy",
        "timestamp": datetime.now(),
        "services": {
            "api": "operational",
            "database": "connected",
            "gnn": "active",
            "monitoring": "running"
        },
        "uptime": f"{random.randint(100, 720)} hours"
    }

if __name__ == "__main__":
    print("🚀 Starting Enterprise Portal Backend on http://localhost:8001")
    uvicorn.run(app, host="0.0.0.0", port=8001)
