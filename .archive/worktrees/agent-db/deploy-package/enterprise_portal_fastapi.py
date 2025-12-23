"""
Aurigraph Enterprise Portal - Full Interactive Dashboard
Real-time blockchain analytics, live transaction monitoring, and comprehensive management tools
"""

from fastapi import FastAPI, HTTPException, WebSocket, WebSocketDisconnect, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.gzip import GZipMiddleware
from fastapi.responses import JSONResponse, HTMLResponse
from fastapi.staticfiles import StaticFiles
from contextlib import asynccontextmanager
from typing import List, Dict, Any, Optional
from pydantic import BaseModel
from datetime import datetime, timedelta
import httpx
import asyncio
import logging
import os
import json
import random
from pathlib import Path

# Configure logging FIRST before any usage
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Import validator portal integration
try:
    from validator_portal_integration import validator_router
    VALIDATOR_PORTAL_ENABLED = True
    logger.info("✅ Validator Portal integration loaded")
except ImportError as e:
    VALIDATOR_PORTAL_ENABLED = False
    logger.warning(f"⚠️ Validator Portal not available: {e}")

# Configuration
AURIGRAPH_API_BASE = os.getenv("AURIGRAPH_API_URL", "http://localhost:9003")
API_VERSION = "v11"
API_TIMEOUT = 30.0
PORT = int(os.getenv("PORT", 3000))

# Data models
class DashboardStats(BaseModel):
    total_transactions: int
    active_contracts: int
    total_tokens: int
    network_tps: float
    network_status: str
    last_block_time: str

class TransactionData(BaseModel):
    tx_id: str
    timestamp: str
    from_address: str
    to_address: str
    amount: float
    status: str
    gas_used: int

class NetworkStats(BaseModel):
    current_tps: float
    avg_block_time: float
    total_blocks: int
    active_validators: int
    network_hash_rate: str

# In-memory data store for real-time updates
dashboard_data = {
    "stats": {
        "total_transactions": 1847392,
        "active_contracts": 8534,
        "total_tokens": 12847,
        "network_tps": 776.8,
        "network_status": "healthy",
        "last_block_time": datetime.utcnow().isoformat()
    },
    "recent_transactions": [],
    "network_history": [],
    "contract_activity": [],
    "token_activity": []
}

# WebSocket connection manager
class ConnectionManager:
    def __init__(self):
        self.active_connections: List[WebSocket] = []
        self.rooms: Dict[str, List[WebSocket]] = {}

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)
        logger.info(f"[WebSocket] Dashboard client connected")

    def disconnect(self, websocket: WebSocket):
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)
        for room in self.rooms.values():
            if websocket in room:
                room.remove(websocket)
        logger.info(f"[WebSocket] Dashboard client disconnected")

    async def broadcast_to_all(self, message: dict):
        for connection in self.active_connections:
            try:
                await connection.send_json(message)
            except Exception as e:
                logger.error(f"Failed to send message to client: {e}")

    async def subscribe(self, websocket: WebSocket, channels: List[str]):
        for channel in channels:
            if channel not in self.rooms:
                self.rooms[channel] = []
            if websocket not in self.rooms[channel]:
                self.rooms[channel].append(websocket)
                logger.info(f"[WebSocket] Client subscribed to {channel}")

    async def broadcast_to_room(self, room: str, message: dict):
        if room in self.rooms:
            for connection in self.rooms[room]:
                try:
                    await connection.send_json(message)
                except:
                    pass

manager = ConnectionManager()

# Real-time data generator
async def generate_real_time_data():
    """Generate realistic blockchain data for the dashboard"""
    while True:
        try:
            # Update network stats
            dashboard_data["stats"]["network_tps"] = round(random.uniform(650, 850), 1)
            dashboard_data["stats"]["total_transactions"] += random.randint(50, 150)
            dashboard_data["stats"]["last_block_time"] = datetime.utcnow().isoformat()

            # Generate new transaction
            new_tx = {
                "tx_id": f"0x{random.randint(100000000, 999999999):x}",
                "timestamp": datetime.utcnow().isoformat(),
                "from_address": f"0x{random.randint(1000000, 9999999):x}",
                "to_address": f"0x{random.randint(1000000, 9999999):x}",
                "amount": round(random.uniform(0.001, 100.0), 4),
                "status": random.choice(["confirmed", "pending"]),
                "gas_used": random.randint(21000, 150000),
                "type": random.choice(["transfer", "contract", "token", "nft"])
            }

            # Add to recent transactions (keep last 50)
            dashboard_data["recent_transactions"].insert(0, new_tx)
            if len(dashboard_data["recent_transactions"]) > 50:
                dashboard_data["recent_transactions"] = dashboard_data["recent_transactions"][:50]

            # Add network history point
            network_point = {
                "timestamp": datetime.utcnow().isoformat(),
                "tps": dashboard_data["stats"]["network_tps"],
                "block_time": round(random.uniform(2.8, 3.2), 2),
                "active_validators": random.randint(95, 105)
            }
            dashboard_data["network_history"].insert(0, network_point)
            if len(dashboard_data["network_history"]) > 100:
                dashboard_data["network_history"] = dashboard_data["network_history"][:100]

            # Broadcast updates to all connected clients
            await manager.broadcast_to_all({
                "type": "dashboard_update",
                "data": {
                    "stats": dashboard_data["stats"],
                    "new_transaction": new_tx,
                    "network_point": network_point
                }
            })

            await asyncio.sleep(random.uniform(1, 3))  # Random interval between updates

        except Exception as e:
            logger.error(f"Error generating real-time data: {e}")
            await asyncio.sleep(5)

# Lifespan context manager
@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    logger.info("🚀 Aurigraph Enterprise Portal Interactive Dashboard Started")
    logger.info(f"📍 Port: {PORT}")
    logger.info(f"🌐 Dashboard: http://localhost:{PORT}")
    logger.info("=========================================")

    # Start real-time data generator
    asyncio.create_task(generate_real_time_data())

    yield

# Create FastAPI app
app = FastAPI(
    title="Aurigraph Enterprise Portal",
    description="Interactive blockchain dashboard with real-time analytics",
    version="3.1.0",
    lifespan=lifespan
)

# Add middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.add_middleware(GZipMiddleware, minimum_size=1000)

# Include Validator Portal router
if VALIDATOR_PORTAL_ENABLED:
    app.include_router(validator_router)
    logger.info("✅ Validator Portal routes registered")

# HTTP client for backend API calls
http_client = httpx.AsyncClient(
    base_url=AURIGRAPH_API_BASE,
    timeout=httpx.Timeout(API_TIMEOUT)
)

# ============================================
# INTERACTIVE DASHBOARD ENDPOINTS
# ============================================

@app.get("/", response_class=HTMLResponse)
async def dashboard_root():
    """Main dashboard interface"""
    return HTMLResponse(content="""
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Aurigraph Enterprise Portal - Live Dashboard</title>
    <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
    <script src="https://cdn.tailwindcss.com"></script>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css">
    <style>
        .gradient-bg { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); }
        .card-shadow { box-shadow: 0 10px 25px rgba(0,0,0,0.1); }
        .pulse-green { animation: pulse-green 2s infinite; }
        @keyframes pulse-green { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }
        .live-indicator {
            width: 8px; height: 8px; background: #10B981;
            border-radius: 50%; display: inline-block;
            animation: pulse 2s infinite;
        }
        @keyframes pulse { 0%, 100% { transform: scale(1); } 50% { transform: scale(1.2); } }
    </style>
</head>
<body class="bg-gray-50">
    <!-- Header -->
    <header class="gradient-bg text-white shadow-lg">
        <div class="container mx-auto px-6 py-4">
            <div class="flex items-center justify-between">
                <div class="flex items-center">
                    <i class="fas fa-cube text-2xl mr-3"></i>
                    <h1 class="text-2xl font-bold">Aurigraph Enterprise Portal</h1>
                    <span class="ml-4 px-2 py-1 bg-green-500 rounded-full text-xs">
                        <span class="live-indicator"></span> LIVE
                    </span>
                </div>
                <div class="flex items-center space-x-4">
                    <span class="text-sm">Network: <span id="network-status" class="font-bold">HEALTHY</span></span>
                    <span class="text-sm">TPS: <span id="current-tps" class="font-bold text-green-300">Loading...</span></span>
                </div>
            </div>
        </div>
    </header>

    <!-- Main Dashboard -->
    <main class="container mx-auto px-6 py-8">
        <!-- Statistics Cards -->
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <!-- Total Transactions -->
            <div class="bg-white rounded-lg p-6 card-shadow">
                <div class="flex items-center justify-between">
                    <div>
                        <p class="text-gray-600 text-sm">Total Transactions</p>
                        <p id="total-transactions" class="text-3xl font-bold text-blue-600">Loading...</p>
                        <p class="text-green-500 text-sm">↗ +847 today</p>
                    </div>
                    <i class="fas fa-exchange-alt text-blue-500 text-2xl"></i>
                </div>
            </div>

            <!-- Active Contracts -->
            <div class="bg-white rounded-lg p-6 card-shadow">
                <div class="flex items-center justify-between">
                    <div>
                        <p class="text-gray-600 text-sm">Active Contracts</p>
                        <p id="active-contracts" class="text-3xl font-bold text-purple-600">Loading...</p>
                        <p class="text-green-500 text-sm">↗ +23 today</p>
                    </div>
                    <i class="fas fa-file-contract text-purple-500 text-2xl"></i>
                </div>
            </div>

            <!-- Total Tokens -->
            <div class="bg-white rounded-lg p-6 card-shadow">
                <div class="flex items-center justify-between">
                    <div>
                        <p class="text-gray-600 text-sm">Total Tokens</p>
                        <p id="total-tokens" class="text-3xl font-bold text-green-600">Loading...</p>
                        <p class="text-green-500 text-sm">↗ +156 today</p>
                    </div>
                    <i class="fas fa-coins text-green-500 text-2xl"></i>
                </div>
            </div>

            <!-- Network TPS -->
            <div class="bg-white rounded-lg p-6 card-shadow">
                <div class="flex items-center justify-between">
                    <div>
                        <p class="text-gray-600 text-sm">Network TPS</p>
                        <p id="network-tps" class="text-3xl font-bold text-orange-600">Loading...</p>
                        <p class="text-green-500 text-sm">↗ Target: 2M TPS</p>
                    </div>
                    <i class="fas fa-tachometer-alt text-orange-500 text-2xl pulse-green"></i>
                </div>
            </div>
        </div>

        <!-- Charts Section -->
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            <!-- Network Performance Chart -->
            <div class="bg-white rounded-lg p-6 card-shadow">
                <div class="flex items-center justify-between mb-4">
                    <h3 class="text-lg font-semibold text-gray-800">Network Performance</h3>
                    <span class="live-indicator"></span>
                </div>
                <canvas id="performance-chart" width="400" height="200"></canvas>
            </div>

            <!-- Transaction Volume Chart -->
            <div class="bg-white rounded-lg p-6 card-shadow">
                <div class="flex items-center justify-between mb-4">
                    <h3 class="text-lg font-semibold text-gray-800">Transaction Volume</h3>
                    <span class="text-sm text-gray-500">Last 24h</span>
                </div>
                <canvas id="volume-chart" width="400" height="200"></canvas>
            </div>
        </div>

        <!-- Live Transactions & Activities -->
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <!-- Recent Transactions -->
            <div class="bg-white rounded-lg p-6 card-shadow">
                <div class="flex items-center justify-between mb-4">
                    <h3 class="text-lg font-semibold text-gray-800">Live Transactions</h3>
                    <span class="live-indicator"></span>
                </div>
                <div id="transactions-feed" class="space-y-3 max-h-96 overflow-y-auto">
                    <!-- Transactions will be populated here -->
                </div>
            </div>

            <!-- Network Activity -->
            <div class="bg-white rounded-lg p-6 card-shadow">
                <h3 class="text-lg font-semibold text-gray-800 mb-4">Network Activity</h3>
                <div class="space-y-4">
                    <div class="flex justify-between items-center p-3 bg-blue-50 rounded-lg">
                        <div class="flex items-center">
                            <i class="fas fa-cube text-blue-500 mr-3"></i>
                            <span>Latest Block</span>
                        </div>
                        <span id="latest-block" class="font-bold text-blue-600">#Loading...</span>
                    </div>
                    <div class="flex justify-between items-center p-3 bg-green-50 rounded-lg">
                        <div class="flex items-center">
                            <i class="fas fa-users text-green-500 mr-3"></i>
                            <span>Active Validators</span>
                        </div>
                        <span id="active-validators" class="font-bold text-green-600">Loading...</span>
                    </div>
                    <div class="flex justify-between items-center p-3 bg-purple-50 rounded-lg">
                        <div class="flex items-center">
                            <i class="fas fa-clock text-purple-500 mr-3"></i>
                            <span>Avg Block Time</span>
                        </div>
                        <span id="avg-block-time" class="font-bold text-purple-600">Loading...</span>
                    </div>
                    <div class="flex justify-between items-center p-3 bg-orange-50 rounded-lg">
                        <div class="flex items-center">
                            <i class="fas fa-shield-alt text-orange-500 mr-3"></i>
                            <span>Security Level</span>
                        </div>
                        <span class="font-bold text-orange-600">QUANTUM-SAFE</span>
                    </div>
                </div>
            </div>
        </div>

        <!-- Quick Actions -->
        <div class="mt-8">
            <div class="bg-white rounded-lg p-6 card-shadow">
                <h3 class="text-lg font-semibold text-gray-800 mb-4">Quick Actions</h3>
                <div class="flex flex-wrap gap-4">
                    <button onclick="window.open('/docs', '_blank')" class="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition">
                        <i class="fas fa-book mr-2"></i>API Documentation
                    </button>
                    <button onclick="window.open('/portal/info', '_blank')" class="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition">
                        <i class="fas fa-info-circle mr-2"></i>Portal Info
                    </button>
                    <button onclick="showCreateContract()" class="px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition">
                        <i class="fas fa-plus mr-2"></i>Create Contract
                    </button>
                    <button onclick="showTokenRegistry()" class="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition">
                        <i class="fas fa-coins mr-2"></i>Token Registry
                    </button>
                </div>
            </div>
        </div>
    </main>

    <!-- WebSocket Connection & Real-time Updates -->
    <script>
        // Initialize WebSocket connection
        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const wsUrl = `${protocol}//${window.location.host}/ws`;
        let socket = new WebSocket(wsUrl);

        // Chart configurations
        let performanceChart, volumeChart;
        let performanceData = [];
        let volumeData = [];

        // Initialize charts
        function initCharts() {
            // Performance Chart
            const performanceCtx = document.getElementById('performance-chart').getContext('2d');
            performanceChart = new Chart(performanceCtx, {
                type: 'line',
                data: {
                    labels: [],
                    datasets: [{
                        label: 'TPS',
                        data: [],
                        borderColor: 'rgb(59, 130, 246)',
                        backgroundColor: 'rgba(59, 130, 246, 0.1)',
                        tension: 0.4,
                        fill: true
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: {
                        y: { beginAtZero: true }
                    },
                    plugins: {
                        legend: { display: false }
                    }
                }
            });

            // Volume Chart
            const volumeCtx = document.getElementById('volume-chart').getContext('2d');
            volumeChart = new Chart(volumeCtx, {
                type: 'bar',
                data: {
                    labels: ['6h ago', '5h ago', '4h ago', '3h ago', '2h ago', '1h ago', 'Now'],
                    datasets: [{
                        label: 'Transactions',
                        data: [1240, 1890, 2340, 1980, 2100, 2450, 2680],
                        backgroundColor: 'rgba(34, 197, 94, 0.8)',
                        borderColor: 'rgb(34, 197, 94)',
                        borderWidth: 1
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: { display: false }
                    }
                }
            });
        }

        // Update dashboard stats
        function updateStats(stats) {
            document.getElementById('total-transactions').textContent = stats.total_transactions.toLocaleString();
            document.getElementById('active-contracts').textContent = stats.active_contracts.toLocaleString();
            document.getElementById('total-tokens').textContent = stats.total_tokens.toLocaleString();
            document.getElementById('network-tps').textContent = stats.network_tps.toLocaleString() + ' TPS';
            document.getElementById('current-tps').textContent = stats.network_tps.toLocaleString() + ' TPS';
            document.getElementById('network-status').textContent = stats.network_status.toUpperCase();
        }

        // Add new transaction to feed
        function addTransaction(tx) {
            const feed = document.getElementById('transactions-feed');
            const txElement = document.createElement('div');
            txElement.className = 'flex items-center justify-between p-3 bg-gray-50 rounded-lg border-l-4 border-blue-500';

            const typeIcon = {
                'transfer': 'fa-exchange-alt',
                'contract': 'fa-file-contract',
                'token': 'fa-coins',
                'nft': 'fa-gem'
            };

            const statusColor = tx.status === 'confirmed' ? 'text-green-600' : 'text-yellow-600';

            txElement.innerHTML = `
                <div class="flex items-center">
                    <i class="fas ${typeIcon[tx.type] || 'fa-exchange-alt'} text-blue-500 mr-3"></i>
                    <div>
                        <p class="font-semibold text-sm">${tx.amount} AUR</p>
                        <p class="text-xs text-gray-500">${tx.tx_id.substring(0, 12)}...</p>
                    </div>
                </div>
                <div class="text-right">
                    <span class="text-xs ${statusColor} font-semibold">${tx.status.toUpperCase()}</span>
                    <p class="text-xs text-gray-500">${new Date(tx.timestamp).toLocaleTimeString()}</p>
                </div>
            `;

            feed.insertBefore(txElement, feed.firstChild);

            // Keep only last 10 transactions visible
            if (feed.children.length > 10) {
                feed.removeChild(feed.lastChild);
            }
        }

        // Update performance chart
        function updatePerformanceChart(networkPoint) {
            const time = new Date(networkPoint.timestamp).toLocaleTimeString();

            performanceChart.data.labels.push(time);
            performanceChart.data.datasets[0].data.push(networkPoint.tps);

            // Keep only last 20 points
            if (performanceChart.data.labels.length > 20) {
                performanceChart.data.labels.shift();
                performanceChart.data.datasets[0].data.shift();
            }

            performanceChart.update('none');

            // Update network activity
            document.getElementById('active-validators').textContent = networkPoint.active_validators;
            document.getElementById('avg-block-time').textContent = networkPoint.block_time + 's';
            document.getElementById('latest-block').textContent = '#' + (Math.floor(Math.random() * 1000000) + 2000000);
        }

        // WebSocket event handlers
        socket.onopen = function(event) {
            console.log('🔌 Connected to live dashboard');
            // Subscribe to dashboard updates
            socket.send(JSON.stringify({
                type: 'subscribe',
                channels: ['dashboard', 'transactions', 'network']
            }));
        };

        socket.onmessage = function(event) {
            const message = JSON.parse(event.data);

            if (message.type === 'dashboard_update') {
                updateStats(message.data.stats);

                if (message.data.new_transaction) {
                    addTransaction(message.data.new_transaction);
                }

                if (message.data.network_point) {
                    updatePerformanceChart(message.data.network_point);
                }
            }
        };

        socket.onclose = function(event) {
            console.log('❌ Dashboard connection closed');
            setTimeout(() => {
                console.log('🔄 Reconnecting...');
                socket = new WebSocket(wsUrl);
            }, 3000);
        };

        // Quick action functions
        function showCreateContract() {
            alert('Contract creation interface coming soon!');
        }

        function showTokenRegistry() {
            alert('Token registry interface coming soon!');
        }

        // Initialize dashboard
        document.addEventListener('DOMContentLoaded', function() {
            initCharts();

            // Load initial data
            fetch('/portal/stats')
                .then(response => response.json())
                .then(data => updateStats(data))
                .catch(console.error);
        });
    </script>
</body>
</html>
    """)

@app.get("/validators", response_class=HTMLResponse)
async def validator_portal():
    """Serve the Validator Portal UI"""
    try:
        with open("public/validator-portal.html", "r") as f:
            return f.read()
    except FileNotFoundError:
        return HTMLResponse(content="<h1>Validator Portal Coming Soon</h1><p>Please ensure validator-portal.html exists in the public/ directory.</p>", status_code=404)

@app.get("/portal/stats")
async def get_dashboard_stats():
    """Get current dashboard statistics"""
    return dashboard_data["stats"]

@app.get("/portal/info")
async def portal_info():
    """Portal information endpoint"""
    return {
        "name": "Aurigraph Enterprise Portal",
        "version": "3.1.0",
        "framework": "FastAPI",
        "features": [
            "Real-time Dashboard",
            "Live Transaction Monitoring",
            "Network Analytics",
            "Smart Contract Registry",
            "Token Registry",
            "NFT Marketplace",
            "Active Contracts©",
            "HMS Integration",
            "Quantum Cryptography",
            "Interactive Charts"
        ],
        "api_version": "v11",
        "blockchain": "Aurigraph DLT",
        "status": "active",
        "real_time": True
    }

@app.get("/portal/transactions/recent")
async def get_recent_transactions():
    """Get recent transactions"""
    return {
        "transactions": dashboard_data["recent_transactions"][:20],
        "total": len(dashboard_data["recent_transactions"])
    }

@app.get("/portal/network/history")
async def get_network_history():
    """Get network performance history"""
    return {
        "history": dashboard_data["network_history"][:50],
        "current_tps": dashboard_data["stats"]["network_tps"]
    }

# WebSocket endpoint for real-time updates
@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await manager.connect(websocket)
    try:
        while True:
            data = await websocket.receive_json()

            if data.get("type") == "subscribe":
                channels = data.get("channels", [])
                await manager.subscribe(websocket, channels)
                await websocket.send_json({
                    "type": "subscribed",
                    "channels": channels,
                    "message": "Successfully subscribed to dashboard updates"
                })

            elif data.get("type") == "ping":
                await websocket.send_json({"type": "pong"})

    except WebSocketDisconnect:
        manager.disconnect(websocket)

# Run the application
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "enterprise_portal_interactive:app",
        host="0.0.0.0",
        port=PORT,
        reload=True,
        log_level="info"
    )