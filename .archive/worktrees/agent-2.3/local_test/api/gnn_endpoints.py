
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
import torch
from gnn_architecture import AurexSupplyChainGNN

app = FastAPI(title="Aurex GNN API")

# Load models
supply_chain_model = AurexSupplyChainGNN()
supply_chain_model.load_state_dict(torch.load('models/supply_chain_gnn.pth'))

@app.post("/api/gnn/supply-chain/predict")
async def predict_supply_chain(data: dict):
    try:
        result = supply_chain_model.predict(data)
        return {"prediction": result}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/gnn/health")
async def health_check():
    return {"status": "healthy", "models_loaded": 4}
        