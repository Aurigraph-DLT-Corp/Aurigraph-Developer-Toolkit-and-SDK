#!/usr/bin/env python3

"""
Aurigraph DLT V11 Demo Server - FastAPI + Vizro Real-time Dashboard
High-performance blockchain simulation with configurable validators and business nodes
"""

import asyncio
import json
import time
import random
import hashlib
from datetime import datetime
from typing import Dict, List, Optional
from dataclasses import dataclass, asdict
from enum import Enum

import uvicorn
from fastapi import FastAPI, WebSocket, WebSocketDisconnect, HTTPException
from fastapi.staticfiles import StaticFiles
from fastapi.responses import HTMLResponse, FileResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import pandas as pd
import plotly.graph_objects as go
from collections import deque

# FastAPI app
app = FastAPI(title="Aurigraph DLT V11 Demo Platform")

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all origins for demo
    allow_credentials=True,
    allow_methods=["*"],  # Allow all methods
    allow_headers=["*"],  # Allow all headers
)

# --- Data Models ---
class ConsensusType(str, Enum):
    HYPERRAFT = "hyperraft"
    PBFT = "pbft"
    RAFT = "raft"

class NodeType(str, Enum):
    VALIDATOR = "validator"
    BUSINESS = "business"

class SimulationConfig(BaseModel):
    channel: str = "main-channel"
    validators: int = 4
    businessNodes: int = 10
    targetTps: int = 100000
    batchSize: int = 1000
    consensusType: ConsensusType = ConsensusType.HYPERRAFT

@dataclass
class Node:
    id: str
    type: NodeType
    status: str = "idle"
    transactions_processed: int = 0
    last_activity: float = 0.0
    latency: float = 0.0
    
    def __post_init__(self):
        self.latency = random.uniform(5, 15)  # 5-15ms base latency
        self.last_activity = time.time()
    
    def process_transaction(self) -> float:
        self.transactions_processed += 1
        self.last_activity = time.time()
        self.status = "processing"
        return self.latency

@dataclass
class Transaction:
    id: str
    timestamp: float
    data: str
    signature: str
    
    @classmethod
    def generate(cls, index: int):
        tx_id = hashlib.sha256(f"{index}{time.time()}".encode()).hexdigest()[:32]
        signature = hashlib.sha256(f"sig_{tx_id}".encode()).hexdigest()
        return cls(
            id=tx_id,
            timestamp=time.time(),
            data=f"Transaction {index}",
            signature=signature
        )

@dataclass
class Metrics:
    tps: float = 0.0
    total_transactions: int = 0
    latency: float = 0.0
    success_rate: float = 100.0
    active_nodes: int = 0
    block_height: int = 0
    consensus_rounds: int = 0
    timestamp: float = 0.0

# --- Simulation State ---
class SimulationState:
    def __init__(self):
        self.is_running: bool = False
        self.config: SimulationConfig = SimulationConfig()
        self.metrics: Metrics = Metrics()
        self.validators: List[Node] = []
        self.business_nodes: List[Node] = []
        self.start_time: float = 0.0
        self.transaction_count: int = 0
        self.consensus_rounds: int = 0
        
        # Metrics history for visualization
        self.tps_history = deque(maxlen=100)
        self.latency_history = deque(maxlen=100)
        self.time_history = deque(maxlen=100)
        
    def reset(self):
        self.metrics = Metrics()
        self.validators = []
        self.business_nodes = []
        self.transaction_count = 0
        self.consensus_rounds = 0
        self.tps_history.clear()
        self.latency_history.clear()
        self.time_history.clear()

# Global simulation state
sim_state = SimulationState()
websocket_clients: List[WebSocket] = []

# --- Consensus Simulator ---
class ConsensusSimulator:
    def __init__(self, consensus_type: ConsensusType):
        self.type = consensus_type
        self.rounds = 0
        
        # Consensus delays in milliseconds
        self.delays = {
            ConsensusType.HYPERRAFT: 10,  # HyperRAFT++ - fastest
            ConsensusType.PBFT: 50,       # PBFT - moderate
            ConsensusType.RAFT: 30        # Standard RAFT
        }
    
    async def run_consensus(self, validators: List[Node], transactions: List[Transaction]) -> Dict:
        self.rounds += 1
        
        base_delay = self.delays[self.type]
        consensus_delay = base_delay + (len(validators) * 2)
        
        # Simulate consensus delay
        await asyncio.sleep(consensus_delay / 1000)
        
        # Simulate validator voting
        votes = 0
        for validator in validators:
            if random.random() > 0.01:  # 99% success rate
                votes += 1
                validator.process_transaction()
        
        required_votes = int(len(validators) * 0.67)
        consensus_reached = votes >= required_votes
        
        return {
            "success": consensus_reached,
            "delay": consensus_delay,
            "votes": votes,
            "required": required_votes
        }

# --- Transaction Generator ---
class TransactionGenerator:
    def __init__(self):
        self.running = False
        self.task = None
        self.transaction_index = 0
    
    async def start(self, target_tps: int, batch_size: int):
        self.running = True
        interval = (1.0 / target_tps) * batch_size
        
        while self.running:
            if sim_state.is_running:
                await self.generate_batch(batch_size)
            await asyncio.sleep(interval)
    
    async def generate_batch(self, batch_size: int):
        transactions = []
        for _ in range(batch_size):
            transactions.append(Transaction.generate(self.transaction_index))
            self.transaction_index += 1
        
        await process_transaction_batch(transactions)
    
    def stop(self):
        self.running = False

# Global instances
tx_generator = TransactionGenerator()
consensus_simulator: Optional[ConsensusSimulator] = None

# --- Transaction Processing ---
async def process_transaction_batch(transactions: List[Transaction]):
    global consensus_simulator
    
    if not consensus_simulator or not sim_state.is_running:
        return
    
    start_time = time.time()
    
    # Run consensus
    consensus_result = await consensus_simulator.run_consensus(
        sim_state.validators,
        transactions
    )
    
    if consensus_result["success"]:
        # Process in business nodes
        tasks = []
        for node in sim_state.business_nodes:
            latency = node.process_transaction()
            tasks.append(asyncio.sleep(latency / 1000))
        
        await asyncio.gather(*tasks)
        
        # Update metrics
        end_time = time.time()
        total_latency = (end_time - start_time) * 1000  # Convert to ms
        
        sim_state.metrics.total_transactions += len(transactions)
        sim_state.metrics.latency = (sim_state.metrics.latency * 0.9) + (total_latency * 0.1)
        sim_state.metrics.block_height += 1
        sim_state.metrics.consensus_rounds = consensus_simulator.rounds
        
        # Calculate actual TPS
        if sim_state.start_time > 0:
            elapsed = time.time() - sim_state.start_time
            if elapsed > 0:
                sim_state.metrics.tps = sim_state.metrics.total_transactions / elapsed
        
        # Update active nodes
        active_validators = sum(1 for n in sim_state.validators if n.status == "processing")
        active_business = sum(1 for n in sim_state.business_nodes if n.status == "processing")
        sim_state.metrics.active_nodes = active_validators + active_business
        
        # Reset node status
        for node in sim_state.validators + sim_state.business_nodes:
            if time.time() - node.last_activity > 0.1:
                node.status = "idle"
        
        # Update history
        sim_state.metrics.timestamp = time.time()
        sim_state.tps_history.append(sim_state.metrics.tps)
        sim_state.latency_history.append(sim_state.metrics.latency)
        sim_state.time_history.append(datetime.now().strftime("%H:%M:%S"))
        
    else:
        # Consensus failed
        sim_state.metrics.success_rate = (sim_state.metrics.success_rate * 0.99)

# --- Simulation Control ---
async def start_simulation(config: SimulationConfig):
    global consensus_simulator, tx_generator
    
    print(f"Starting simulation with config: {config}")
    
    sim_state.reset()
    sim_state.is_running = True
    sim_state.config = config
    sim_state.start_time = time.time()
    
    # Initialize nodes
    for i in range(config.validators):
        sim_state.validators.append(Node(f"V{i+1}", NodeType.VALIDATOR))
    
    for i in range(config.businessNodes):
        sim_state.business_nodes.append(Node(f"B{i+1}", NodeType.BUSINESS))
    
    # Initialize consensus
    consensus_simulator = ConsensusSimulator(config.consensusType)
    
    # Start transaction generation
    asyncio.create_task(tx_generator.start(config.targetTps, config.batchSize))
    
    # Start metrics broadcasting
    asyncio.create_task(broadcast_metrics())

def stop_simulation():
    print("Stopping simulation")
    sim_state.is_running = False
    tx_generator.stop()

# --- WebSocket Broadcasting ---
async def broadcast_metrics():
    while sim_state.is_running:
        message = {
            "type": "metrics",
            "tps": sim_state.metrics.tps,
            "totalTransactions": sim_state.metrics.total_transactions,
            "latency": sim_state.metrics.latency,
            "successRate": sim_state.metrics.success_rate,
            "activeNodes": sim_state.metrics.active_nodes,
            "blockHeight": sim_state.metrics.block_height,
            "consensusRounds": sim_state.metrics.consensus_rounds,
            "timestamp": sim_state.metrics.timestamp
        }
        
        # Send to all connected clients
        for client in websocket_clients[:]:
            try:
                await client.send_json(message)
            except:
                websocket_clients.remove(client)
        
        await asyncio.sleep(0.1)  # Broadcast every 100ms

# --- API Endpoints ---
@app.get("/")
async def root():
    return FileResponse("aurigraph-demo-app.html")

@app.get("/api/status")
async def get_status():
    return {
        "is_running": sim_state.is_running,
        "config": sim_state.config.dict() if sim_state.config else {},
        "metrics": asdict(sim_state.metrics)
    }

@app.post("/api/start")
async def start_api(config: SimulationConfig):
    if sim_state.is_running:
        raise HTTPException(status_code=400, detail="Simulation already running")
    
    await start_simulation(config)
    return {"success": True, "message": "Simulation started"}

@app.post("/api/stop")
async def stop_api():
    if not sim_state.is_running:
        raise HTTPException(status_code=400, detail="Simulation not running")
    
    stop_simulation()
    return {"success": True, "message": "Simulation stopped"}

@app.get("/api/metrics")
async def get_metrics():
    return asdict(sim_state.metrics)

@app.get("/api/metrics/history")
async def get_metrics_history():
    return {
        "tps": list(sim_state.tps_history),
        "latency": list(sim_state.latency_history),
        "time": list(sim_state.time_history)
    }

# --- WebSocket Endpoint ---
@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    websocket_clients.append(websocket)
    
    # Send initial state
    await websocket.send_json({
        "type": "connected",
        "metrics": asdict(sim_state.metrics),
        "config": sim_state.config.dict() if sim_state.config else {}
    })
    
    try:
        while True:
            data = await websocket.receive_json()
            
            if data["type"] == "start" and not sim_state.is_running:
                config = SimulationConfig(**data["config"])
                await start_simulation(config)
            
            elif data["type"] == "stop" and sim_state.is_running:
                stop_simulation()
            
            elif data["type"] == "getStatus":
                await websocket.send_json({
                    "type": "status",
                    "is_running": sim_state.is_running,
                    "metrics": asdict(sim_state.metrics)
                })
    
    except WebSocketDisconnect:
        websocket_clients.remove(websocket)
    except Exception as e:
        print(f"WebSocket error: {e}")
        if websocket in websocket_clients:
            websocket_clients.remove(websocket)

# --- Main ---
if __name__ == "__main__":
    print("""
    ========================================
    🚀 Aurigraph DLT V11 Demo Server
    ========================================
    
    Server running on:
    - HTTP: http://localhost:3088
    - WebSocket: ws://localhost:3088/ws
    
    Open http://localhost:3088 in your browser
    ========================================
    """)
    
    uvicorn.run(app, host="0.0.0.0", port=3088)