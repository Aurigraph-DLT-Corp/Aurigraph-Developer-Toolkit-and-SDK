#!/usr/bin/env ts-node

import express, { Request, Response } from 'express';
import { ChannelManager } from './src/management/ChannelManager';
import { Logger } from './src/core/Logger';
import { QuantumCryptoManagerV2 } from './src/crypto/QuantumCryptoManagerV2';
import { HyperRAFTPlusPlusV2 } from './src/consensus/HyperRAFTPlusPlusV2';
import { ZKProofSystem } from './src/zk/ZKProofSystem';

const app = express();
const logger = new Logger('AurigraphDemo');

app.use(express.json());
app.use(express.static('public'));

// Set CSP headers for font loading
app.use((req, res, next) => {
  res.setHeader('Content-Security-Policy', 
    "default-src 'self'; " +
    "font-src 'self' data: https: blob:; " +
    "style-src 'self' 'unsafe-inline' https:; " +
    "script-src 'self' 'unsafe-inline' 'unsafe-eval' https:; " +
    "img-src 'self' data: https: blob:; " +
    "connect-src 'self' ws: wss: https:;"
  );
  next();
});

interface DemoStats {
  totalTransactions: number;
  currentTPS: number;
  quantumEncryptions: number;
  zkProofsGenerated: number;
  activeValidators: number;
  activeNodes: number;
  networkUptime: number;
  securityLevel: number;
}

let demoStats: DemoStats = {
  totalTransactions: 0,
  currentTPS: 0,
  quantumEncryptions: 0,
  zkProofsGenerated: 0,
  activeValidators: 7,
  activeNodes: 27,
  networkUptime: 100,
  securityLevel: 6
};

// Initialize components
let channelManager: ChannelManager;
let quantumCrypto: QuantumCryptoManagerV2;
let zkProofSystem: ZKProofSystem;

// Demo transaction simulation
class TransactionSimulator {
  private isRunning = false;
  private intervalId?: NodeJS.Timeout;

  start() {
    if (this.isRunning) return;
    this.isRunning = true;
    
    logger.info('🎬 Starting transaction simulation...');
    
    this.intervalId = setInterval(async () => {
      try {
        // Simulate various transaction types
        const txTypes = ['transfer', 'smart_contract', 'cross_chain', 'privacy', 'defi'];
        const txType = txTypes[Math.floor(Math.random() * txTypes.length)];
        
        // Generate quantum-encrypted transaction
        const transaction = {
          id: `tx_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          type: txType,
          amount: Math.floor(Math.random() * 10000) + 1,
          from: `user_${Math.random().toString(36).substr(2, 8)}`,
          to: `user_${Math.random().toString(36).substr(2, 8)}`,
          timestamp: new Date().toISOString(),
          quantumEncrypted: true,
          zkProof: Math.random() > 0.5
        };

        // Update stats
        demoStats.totalTransactions++;
        demoStats.currentTPS = Math.floor(Math.random() * 50000) + 800000; // 800K-850K TPS
        
        if (transaction.quantumEncrypted) {
          demoStats.quantumEncryptions++;
        }
        
        if (transaction.zkProof) {
          demoStats.zkProofsGenerated++;
        }
        
        logger.info(`💳 ${txType.toUpperCase()} transaction ${transaction.id} processed - TPS: ${demoStats.currentTPS.toLocaleString()}`);
        
      } catch (error) {
        logger.error(`Transaction simulation error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }, 100); // Process transactions every 100ms
  }

  stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.isRunning = false;
      logger.info('🛑 Transaction simulation stopped');
    }
  }

  getStats(): DemoStats {
    return { ...demoStats };
  }
}

const simulator = new TransactionSimulator();

// API Routes
app.get('/', (req: Request, res: Response) => {
  res.send(`
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Aurigraph DLT Demo - Quantum-Secure Blockchain</title>
    <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: 'SF Pro Display', -apple-system, BlinkMacSystemFont, sans-serif;
            background: linear-gradient(135deg, #0a0e27 0%, #1a1f3a 50%, #2d1b69 100%);
            color: #fff;
            min-height: 100vh;
            overflow-x: hidden;
        }
        
        .header {
            text-align: center;
            padding: 2rem;
            background: rgba(0,0,0,0.3);
            backdrop-filter: blur(10px);
        }
        
        .logo {
            font-size: 3rem;
            font-weight: 800;
            background: linear-gradient(45deg, #00ff88, #0099ff, #ff0080);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            margin-bottom: 0.5rem;
        }
        
        .subtitle {
            font-size: 1.2rem;
            opacity: 0.8;
            margin-bottom: 2rem;
        }
        
        .container {
            max-width: 1200px;
            margin: 0 auto;
            padding: 2rem;
        }
        
        .demo-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
            gap: 2rem;
            margin-bottom: 3rem;
        }
        
        .demo-card {
            background: rgba(255,255,255,0.1);
            border: 1px solid rgba(255,255,255,0.2);
            border-radius: 15px;
            padding: 2rem;
            backdrop-filter: blur(10px);
            transition: transform 0.3s ease;
        }
        
        .demo-card:hover {
            transform: translateY(-5px);
        }
        
        .card-title {
            font-size: 1.5rem;
            font-weight: 700;
            margin-bottom: 1rem;
            color: #00ff88;
        }
        
        .metric {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin: 1rem 0;
            padding: 0.5rem 0;
            border-bottom: 1px solid rgba(255,255,255,0.1);
        }
        
        .metric-label {
            opacity: 0.8;
        }
        
        .metric-value {
            font-weight: 700;
            color: #00ff88;
            font-size: 1.1rem;
        }
        
        .control-panel {
            background: rgba(255,255,255,0.05);
            border-radius: 15px;
            padding: 2rem;
            margin-bottom: 2rem;
        }
        
        .controls {
            display: flex;
            gap: 1rem;
            flex-wrap: wrap;
            justify-content: center;
        }
        
        .btn {
            background: linear-gradient(45deg, #00ff88, #0099ff);
            color: #000;
            border: none;
            padding: 1rem 2rem;
            border-radius: 10px;
            font-weight: 700;
            cursor: pointer;
            transition: all 0.3s ease;
            font-size: 1rem;
        }
        
        .btn:hover {
            transform: scale(1.05);
            box-shadow: 0 10px 30px rgba(0,255,136,0.3);
        }
        
        .btn.danger {
            background: linear-gradient(45deg, #ff4757, #ff6b7a);
            color: #fff;
        }
        
        .status-indicator {
            display: inline-block;
            width: 12px;
            height: 12px;
            border-radius: 50%;
            margin-right: 0.5rem;
        }
        
        .status-active {
            background: #00ff88;
            box-shadow: 0 0 10px #00ff88;
        }
        
        .real-time {
            font-family: 'SF Mono', 'Monaco', 'Consolas', monospace;
            background: rgba(0,0,0,0.5);
            border-radius: 10px;
            padding: 1rem;
            margin-top: 1rem;
            max-height: 200px;
            overflow-y: auto;
        }
        
        .log-entry {
            margin: 0.25rem 0;
            opacity: 0.9;
        }
        
        .footer {
            text-align: center;
            padding: 2rem;
            opacity: 0.6;
            font-size: 0.9rem;
        }
        
        /* Enhanced Node and Transaction Visualization Styles */
        .nodes-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
            gap: 1rem;
            max-height: 300px;
            overflow-y: auto;
            padding: 0.5rem;
        }
        
        .node-item {
            background: rgba(255,255,255,0.05);
            border-radius: 8px;
            padding: 1rem;
            text-align: center;
            border: 2px solid transparent;
            transition: all 0.3s ease;
        }
        
        .node-item.validator {
            border-color: #00ff88;
        }
        
        .node-item.full {
            border-color: #0099ff;
        }
        
        .node-item.light {
            border-color: #ff6b7a;
        }
        
        .node-item.archive {
            border-color: #ffd93d;
        }
        
        .node-status {
            width: 12px;
            height: 12px;
            border-radius: 50%;
            margin: 0 auto 0.5rem;
        }
        
        .node-status.active {
            background: #00ff88;
            box-shadow: 0 0 10px #00ff88;
        }
        
        .node-status.syncing {
            background: #ffd93d;
            box-shadow: 0 0 10px #ffd93d;
        }
        
        .node-status.offline {
            background: #ff4757;
            box-shadow: 0 0 10px #ff4757;
        }
        
        .node-name {
            font-weight: bold;
            font-size: 0.9rem;
            margin-bottom: 0.25rem;
        }
        
        .node-type {
            font-size: 0.75rem;
            opacity: 0.8;
            margin-bottom: 0.25rem;
        }
        
        .node-tps {
            font-size: 0.7rem;
            color: #00ff88;
            font-weight: bold;
        }
        
        .tx-visualization {
            position: relative;
        }
        
        #txLineChart {
            width: 100%;
            height: 300px;
            background: rgba(0,0,0,0.3);
            border-radius: 8px;
        }
        
        .tx-legend {
            display: flex;
            justify-content: center;
            gap: 1rem;
            margin-top: 1rem;
            flex-wrap: wrap;
        }
        
        .tx-type {
            display: flex;
            align-items: center;
            font-size: 0.75rem;
            padding: 0.25rem 0.5rem;
            border-radius: 4px;
            position: relative;
        }
        
        .tx-type::before {
            content: '';
            width: 12px;
            height: 12px;
            border-radius: 50%;
            margin-right: 0.5rem;
        }
        
        .tx-type.defi::before {
            background: #ff6b7a;
            box-shadow: 0 0 6px #ff6b7a;
        }
        
        .tx-type.privacy::before {
            background: #0099ff;
            box-shadow: 0 0 6px #0099ff;
        }
        
        .tx-type.cross-chain::before {
            background: #ffd93d;
            box-shadow: 0 0 6px #ffd93d;
        }
        
        .tx-type.smart-contract::before {
            background: #ff0080;
            box-shadow: 0 0 6px #ff0080;
        }
        
        .tx-type.transfer::before {
            background: #00ff88;
            box-shadow: 0 0 6px #00ff88;
        }

        /* Leader Election Panel Styles */
        .leader-panel {
            background: linear-gradient(135deg, rgba(255,215,0,0.1), rgba(255,140,0,0.1));
            border: 2px solid #ffd700;
            border-radius: 15px;
            padding: 1.5rem;
            margin-bottom: 1rem;
        }

        .current-leader {
            display: flex;
            align-items: center;
            justify-content: center;
            margin-bottom: 1rem;
            padding: 1rem;
            background: rgba(255,215,0,0.1);
            border-radius: 10px;
        }

        .leader-crown {
            font-size: 2rem;
            margin-right: 1rem;
        }

        .leader-info {
            text-align: left;
        }

        .leader-name {
            font-size: 1.5rem;
            font-weight: bold;
            color: #ffd700;
            margin-bottom: 0.25rem;
        }

        .leader-term {
            font-size: 0.9rem;
            opacity: 0.8;
        }

        .election-status {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin: 0.5rem 0;
            padding: 0.5rem;
            background: rgba(0,0,0,0.2);
            border-radius: 8px;
        }

        .election-progress {
            width: 100%;
            height: 6px;
            background: rgba(255,255,255,0.2);
            border-radius: 3px;
            overflow: hidden;
            margin-top: 1rem;
        }

        .election-bar {
            height: 100%;
            background: linear-gradient(90deg, #ffd700, #ffaa00);
            transition: width 0.3s ease;
        }
    </style>
</head>
<body>
    <div class="header">
        <h1 class="logo">AURIGRAPH DLT</h1>
        <p class="subtitle">Quantum-Secure Distributed Ledger Technology Demo</p>
        <p>🚀 1M+ TPS • 🔐 Post-Quantum Security • ⚡ Zero-Latency Finality</p>
    </div>

    <div class="container">
        <div class="control-panel">
            <h2 style="text-align: center; margin-bottom: 1.5rem;">Demo Controls</h2>
            <div class="controls">
                <button class="btn" onclick="startSimulation()">Start Transaction Simulation</button>
                <button class="btn danger" onclick="stopSimulation()">Stop Simulation</button>
                <button class="btn" onclick="generateZKProof()">Generate ZK Proof</button>
                <button class="btn" onclick="quantumEncrypt()">Quantum Encrypt</button>
                <button class="btn" onclick="stressTest()">Stress Test (10K TPS)</button>
            </div>
        </div>

        <div class="demo-grid">
            <div class="demo-card">
                <h3 class="card-title">🚀 Performance Metrics</h3>
                <div class="metric">
                    <span class="metric-label">Current TPS</span>
                    <span class="metric-value" id="currentTps">0</span>
                </div>
                <div class="metric">
                    <span class="metric-label">Total Transactions</span>
                    <span class="metric-value" id="totalTx">0</span>
                </div>
                <div class="metric">
                    <span class="metric-label">Network Latency</span>
                    <span class="metric-value">&lt; 50ms</span>
                </div>
                <div class="metric">
                    <span class="metric-label">Finality Time</span>
                    <span class="metric-value">Instant</span>
                </div>
            </div>

            <div class="demo-card">
                <h3 class="card-title">🔐 Quantum Security</h3>
                <div class="metric">
                    <span class="metric-label">Security Level</span>
                    <span class="metric-value" id="securityLevel">6</span>
                </div>
                <div class="metric">
                    <span class="metric-label">Quantum Encryptions</span>
                    <span class="metric-value" id="quantumEnc">0</span>
                </div>
                <div class="metric">
                    <span class="metric-label">Algorithm</span>
                    <span class="metric-value">CRYSTALS-Kyber</span>
                </div>
                <div class="metric">
                    <span class="metric-label">Key Size</span>
                    <span class="metric-value">1024-bit</span>
                </div>
            </div>

            <div class="demo-card">
                <h3 class="card-title">🛡️ Zero-Knowledge Proofs</h3>
                <div class="metric">
                    <span class="metric-label">ZK Proofs Generated</span>
                    <span class="metric-value" id="zkProofs">0</span>
                </div>
                <div class="metric">
                    <span class="metric-label">Proof Systems</span>
                    <span class="metric-value">SNARKs, STARKs, PLONK</span>
                </div>
                <div class="metric">
                    <span class="metric-label">Privacy Level</span>
                    <span class="metric-value">Complete</span>
                </div>
                <div class="metric">
                    <span class="metric-label">Proof Size</span>
                    <span class="metric-value">~200 bytes</span>
                </div>
            </div>

            <div class="demo-card">
                <h3 class="card-title">🌐 Network Status</h3>
                <div class="metric">
                    <span class="metric-label">Validators</span>
                    <span class="metric-value">
                        <span class="status-indicator status-active"></span>
                        <span id="validators">1</span> Active
                    </span>
                </div>
                <div class="metric">
                    <span class="metric-label">Basic Nodes</span>
                    <span class="metric-value">
                        <span class="status-indicator status-active"></span>
                        <span id="nodes">2</span> Active
                    </span>
                </div>
                <div class="metric">
                    <span class="metric-label">Consensus</span>
                    <span class="metric-value">HyperRAFT++</span>
                </div>
                <div class="metric">
                    <span class="metric-label">Network Uptime</span>
                    <span class="metric-value" id="uptime">100%</span>
                </div>
            </div>
        </div>

        <!-- Row 2: Leader Election Center Panel -->
        <div class="demo-card leader-panel">
            <h3 class="card-title">👑 Leader Election & Consensus</h3>
            <div class="current-leader">
                <div class="leader-crown">👑</div>
                <div class="leader-info">
                    <div class="leader-name" id="currentLeader">VAL-003</div>
                    <div class="leader-term">Term #<span id="currentTerm">42</span> • Elected <span id="electionTime">3.2s</span> ago</div>
                </div>
            </div>
            <div class="election-status">
                <span>Next Election</span>
                <span id="nextElection">4.8s</span>
            </div>
            <div class="election-status">
                <span>Consensus Health</span>
                <span style="color: #00ff88;" id="consensusHealth">100%</span>
            </div>
            <div class="election-status">
                <span>Block Height</span>
                <span id="blockHeight">1,247,832</span>
            </div>
            <div class="election-progress">
                <div class="election-bar" id="electionProgress" style="width: 35%"></div>
            </div>
        </div>

        <!-- Row 3: Enhanced Panels -->
        <div class="demo-card">
            <h3 class="card-title">🌐 Active Network Nodes</h3>
            <div class="nodes-grid" id="nodesGrid">
                <div class="node-item validator">
                    <div class="node-status active"></div>
                    <div class="node-info">
                        <div class="node-name">VAL-001</div>
                        <div class="node-type">Validator</div>
                        <div class="node-tps">250K TPS</div>
                    </div>
                </div>
            </div>
        </div>

        <div class="demo-card">
            <h3 class="card-title">📈 Transaction Flow Line Graph</h3>
            <div class="tx-visualization" id="txVisualization">
                <canvas id="txLineChart" width="600" height="300" style="background: rgba(0,0,0,0.2); border-radius: 8px;"></canvas>
            </div>
        </div>

        <div class="demo-card">
            <h3 class="card-title">📊 Live Transaction Log</h3>
            <div class="real-time" id="transactionLog">
                <div class="log-entry">🎬 Demo ready - Click "Start Transaction Simulation" to begin</div>
            </div>
        </div>

        <div class="demo-card">
            <h3 class="card-title">🔗 Container Environment</h3>
            <div class="metric">
                <span class="metric-label">Validator Container</span>
                <span class="metric-value">
                    <span class="status-indicator status-active"></span>
                    localhost:8181
                </span>
            </div>
            <div class="metric">
                <span class="metric-label">Node 1 (FULL)</span>
                <span class="metric-value">
                    <span class="status-indicator status-active"></span>
                    localhost:8201
                </span>
            </div>
            <div class="metric">
                <span class="metric-label">Node 2 (LIGHT)</span>
                <span class="metric-value">
                    <span class="status-indicator status-active"></span>
                    localhost:8202
                </span>
            </div>
            <div class="metric">
                <span class="metric-label">Management UI</span>
                <span class="metric-value">
                    <span class="status-indicator status-active"></span>
                    localhost:3140
                </span>
            </div>
        </div>
    </div>

    <div class="footer">
        <p>🚀 Aurigraph AV11-7 • Quantum-Resistant DLT Platform • Built with HyperRAFT++ Consensus</p>
        <p>Experience the future of blockchain technology with post-quantum cryptography</p>
    </div>

    <script>
        let simulationActive = false;
        let statsInterval;

        async function startSimulation() {
            if (simulationActive) return;
            
            simulationActive = true;
            addLogEntry('🎬 Starting transaction simulation...');
            
            try {
                const response = await fetch('/api/demo/start-simulation', { method: 'POST' });
                const result = await response.json();
                
                if (result.success) {
                    addLogEntry('✅ Transaction simulation started successfully');
                    startStatsUpdates();
                } else {
                    addLogEntry('❌ Failed to start simulation: ' + result.error);
                }
            } catch (error) {
                addLogEntry('❌ Network error: ' + error.message);
            }
        }

        async function stopSimulation() {
            if (!simulationActive) return;
            
            simulationActive = false;
            addLogEntry('🛑 Stopping transaction simulation...');
            
            try {
                const response = await fetch('/api/demo/stop-simulation', { method: 'POST' });
                const result = await response.json();
                
                if (result.success) {
                    addLogEntry('✅ Transaction simulation stopped');
                    stopStatsUpdates();
                } else {
                    addLogEntry('❌ Failed to stop simulation: ' + result.error);
                }
            } catch (error) {
                addLogEntry('❌ Network error: ' + error.message);
            }
        }

        async function generateZKProof() {
            addLogEntry('🛡️ Generating zero-knowledge proof...');
            
            try {
                const response = await fetch('/api/demo/generate-zkproof', { method: 'POST' });
                const result = await response.json();
                
                if (result.success) {
                    addLogEntry('✅ ZK proof generated: ' + result.proof.substring(0, 32) + '...');
                } else {
                    addLogEntry('❌ Failed to generate ZK proof: ' + result.error);
                }
            } catch (error) {
                addLogEntry('❌ Network error: ' + error.message);
            }
        }

        async function quantumEncrypt() {
            addLogEntry('🔐 Performing quantum encryption...');
            
            try {
                const response = await fetch('/api/demo/quantum-encrypt', { method: 'POST' });
                const result = await response.json();
                
                if (result.success) {
                    addLogEntry('✅ Quantum encryption completed: ' + result.encrypted.substring(0, 32) + '...');
                } else {
                    addLogEntry('❌ Failed to encrypt: ' + result.error);
                }
            } catch (error) {
                addLogEntry('❌ Network error: ' + error.message);
            }
        }

        async function stressTest() {
            addLogEntry('⚡ Starting 10K TPS stress test...');
            
            try {
                const response = await fetch('/api/demo/stress-test', { method: 'POST' });
                const result = await response.json();
                
                if (result.success) {
                    addLogEntry('🚀 Stress test completed: ' + result.tps.toLocaleString() + ' TPS achieved');
                } else {
                    addLogEntry('❌ Stress test failed: ' + result.error);
                }
            } catch (error) {
                addLogEntry('❌ Network error: ' + error.message);
            }
        }

        function addLogEntry(message) {
            const log = document.getElementById('transactionLog');
            const entry = document.createElement('div');
            entry.className = 'log-entry';
            entry.textContent = new Date().toLocaleTimeString() + ' - ' + message;
            log.appendChild(entry);
            log.scrollTop = log.scrollHeight;
            
            // Keep only last 50 entries
            while (log.children.length > 50) {
                log.removeChild(log.firstChild);
            }
        }

        function startStatsUpdates() {
            statsInterval = setInterval(async () => {
                try {
                    const response = await fetch('/api/demo/stats');
                    const stats = await response.json();
                    
                    document.getElementById('currentTps').textContent = stats.currentTPS.toLocaleString();
                    document.getElementById('totalTx').textContent = stats.totalTransactions.toLocaleString();
                    document.getElementById('quantumEnc').textContent = stats.quantumEncryptions.toLocaleString();
                    document.getElementById('zkProofs').textContent = stats.zkProofsGenerated.toLocaleString();
                    document.getElementById('securityLevel').textContent = stats.securityLevel;
                    document.getElementById('validators').textContent = stats.activeValidators;
                    document.getElementById('nodes').textContent = stats.activeNodes;
                    document.getElementById('uptime').textContent = stats.networkUptime + '%';
                    
                } catch (error) {
                    console.error('Stats update error:', error);
                }
            }, 1000);
        }

        function stopStatsUpdates() {
            if (statsInterval) {
                clearInterval(statsInterval);
            }
        }

        // Node visualization functions
        function initializeNodeVisualization() {
            updateNodesGrid();
            setInterval(updateNodesGrid, 5000); // Update every 5 seconds
        }

        async function updateNodesGrid() {
            try {
                const response = await fetch('/api/demo/nodes');
                const nodes = await response.json();
                
                const nodesGrid = document.getElementById('nodesGrid');
                nodesGrid.innerHTML = '';
                
                nodes.forEach(node => {
                    const nodeElement = createNodeElement(node);
                    nodesGrid.appendChild(nodeElement);
                });
            } catch (error) {
                console.error('Error updating nodes grid:', error);
            }
        }

        function createNodeElement(node) {
            const nodeDiv = document.createElement('div');
            nodeDiv.className = 'node-item ' + node.type;
            
            nodeDiv.innerHTML = 
                '<div class="node-status ' + node.status + '"></div>' +
                '<div class="node-info">' +
                    '<div class="node-name">' + node.name + '</div>' +
                    '<div class="node-type">' + node.type + '</div>' +
                    '<div class="node-tps">' + formatTPS(node.tps) + '</div>' +
                '</div>';
            
            return nodeDiv;
        }

        function formatTPS(tps) {
            if (!tps && tps !== 0) return '0';
            if (tps >= 1000000) {
                return (tps / 1000000).toFixed(1) + 'M TPS';
            } else if (tps >= 1000) {
                return (tps / 1000).toFixed(0) + 'K TPS';
            }
            return tps + ' TPS';
        }

        // Transaction line graph with Chart.js
        let txLineChart;
        let chartData = {
            labels: [],
            datasets: [
                {
                    label: 'Transfer',
                    data: [],
                    borderColor: '#00ff88',
                    backgroundColor: 'rgba(0, 255, 136, 0.1)',
                    tension: 0.4,
                    pointRadius: 0,
                    borderWidth: 2
                },
                {
                    label: 'Smart Contract',
                    data: [],
                    borderColor: '#ff0080',
                    backgroundColor: 'rgba(255, 0, 128, 0.1)',
                    tension: 0.4,
                    pointRadius: 0,
                    borderWidth: 2
                },
                {
                    label: 'DeFi',
                    data: [],
                    borderColor: '#ff6b7a',
                    backgroundColor: 'rgba(255, 107, 122, 0.1)',
                    tension: 0.4,
                    pointRadius: 0,
                    borderWidth: 2
                },
                {
                    label: 'Privacy',
                    data: [],
                    borderColor: '#0099ff',
                    backgroundColor: 'rgba(0, 153, 255, 0.1)',
                    tension: 0.4,
                    pointRadius: 0,
                    borderWidth: 2
                },
                {
                    label: 'Cross-Chain',
                    data: [],
                    borderColor: '#ffd93d',
                    backgroundColor: 'rgba(255, 217, 61, 0.1)',
                    tension: 0.4,
                    pointRadius: 0,
                    borderWidth: 2
                }
            ]
        };

        function initializeTransactionVisualization() {
            const ctx = document.getElementById('txLineChart').getContext('2d');
            
            txLineChart = new Chart(ctx, {
                type: 'line',
                data: chartData,
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            display: true,
                            position: 'bottom',
                            labels: {
                                color: '#fff',
                                usePointStyle: true,
                                pointStyle: 'circle'
                            }
                        }
                    },
                    scales: {
                        x: {
                            display: true,
                            title: {
                                display: true,
                                text: 'Time (last 30 seconds)',
                                color: '#fff'
                            },
                            grid: {
                                color: 'rgba(255, 255, 255, 0.1)'
                            },
                            ticks: {
                                color: '#888',
                                maxTicksLimit: 6
                            }
                        },
                        y: {
                            display: true,
                            title: {
                                display: true,
                                text: 'Transactions per Second',
                                color: '#fff'
                            },
                            grid: {
                                color: 'rgba(255, 255, 255, 0.1)'
                            },
                            ticks: {
                                color: '#888',
                                callback: function(value) {
                                    if (value >= 1000000) return (value/1000000).toFixed(1) + 'M';
                                    if (value >= 1000) return (value/1000).toFixed(0) + 'K';
                                    return value;
                                }
                            }
                        }
                    },
                    animation: {
                        duration: 0
                    }
                }
            });
            
            // Initialize with empty data
            for (let i = 0; i < 30; i++) {
                const time = new Date(Date.now() - (30-i) * 1000);
                chartData.labels.push(time.toLocaleTimeString());
                chartData.datasets.forEach(dataset => {
                    dataset.data.push(0);
                });
            }
            
            // Start data generation
            setInterval(updateLineChart, 1000);
        }

        function updateLineChart() {
            if (!simulationActive) return;
            
            // Add new time label
            const now = new Date();
            chartData.labels.push(now.toLocaleTimeString());
            
            // Generate realistic transaction data per type
            const transferTPS = Math.floor(Math.random() * 70000) + 200000;  // 200-270K
            const smartContractTPS = Math.floor(Math.random() * 60000) + 180000; // 180-240K
            const defiTPS = Math.floor(Math.random() * 50000) + 150000;     // 150-200K
            const privacyTPS = Math.floor(Math.random() * 40000) + 120000;  // 120-160K
            const crossChainTPS = Math.floor(Math.random() * 30000) + 100000; // 100-130K
            
            // Add new data points
            chartData.datasets[0].data.push(transferTPS);      // Transfer
            chartData.datasets[1].data.push(smartContractTPS); // Smart Contract
            chartData.datasets[2].data.push(defiTPS);          // DeFi
            chartData.datasets[3].data.push(privacyTPS);       // Privacy
            chartData.datasets[4].data.push(crossChainTPS);    // Cross-Chain
            
            // Remove old data (keep last 30 points)
            if (chartData.labels.length > 30) {
                chartData.labels.shift();
                chartData.datasets.forEach(dataset => {
                    dataset.data.shift();
                });
            }
            
            // Update chart
            txLineChart.update('none');
        }

        // Leader election functions
        let electionTimer = 0;
        let currentTerm = 42;
        let blockHeight = 1247832;

        function initializeLeaderElection() {
            updateLeaderInfo();
            setInterval(updateLeaderInfo, 1000); // Update every second
            setInterval(simulateElection, 8000); // New election every 8 seconds
        }

        async function updateLeaderInfo() {
            try {
                const response = await fetch('/api/demo/leader');
                const leaderData = await response.json();
                
                document.getElementById('currentLeader').textContent = leaderData.currentLeader;
                document.getElementById('currentTerm').textContent = leaderData.term;
                document.getElementById('electionTime').textContent = leaderData.electedAgo;
                document.getElementById('nextElection').textContent = leaderData.nextElection;
                document.getElementById('consensusHealth').textContent = leaderData.consensusHealth + '%';
                document.getElementById('blockHeight').textContent = leaderData.blockHeight.toLocaleString();
                
                // Update progress bar
                const progress = ((8 - parseFloat(leaderData.nextElection)) / 8) * 100;
                document.getElementById('electionProgress').style.width = progress + '%';
                
            } catch (error) {
                console.error('Error updating leader info:', error);
            }
        }

        function simulateElection() {
            addLogEntry('🗳️ Leader election initiated for term ' + (currentTerm + 1));
            const validators = ['VAL-001', 'VAL-002', 'VAL-003', 'VAL-004', 'VAL-005', 'VAL-006', 'VAL-007'];
            const newLeader = validators[Math.floor(Math.random() * validators.length)];
            currentTerm++;
            blockHeight += Math.floor(Math.random() * 1000) + 500;
            
            setTimeout(() => {
                addLogEntry('👑 ' + newLeader + ' elected as leader for term ' + currentTerm);
            }, 1000);
        }
        
        // Add welcome message
        setTimeout(() => {
            addLogEntry('🌟 Welcome to Aurigraph DLT Demo!');
            addLogEntry('🔗 Connected to containerized testnet');
            addLogEntry('💎 Quantum security level 6 active');
        }, 1000);

        // Initialize node visualization
        initializeNodeVisualization();
        
        // Initialize transaction flow canvas
        initializeTransactionVisualization();
        
        // Initialize leader election tracking
        initializeLeaderElection();
    </script>
</body>
</html>
  `);
});

// API Routes
app.get('/api/demo/stats', (req: Request, res: Response) => {
  res.json(simulator.getStats());
});

app.get('/api/demo/nodes', (req: Request, res: Response) => {
  // Simulate active nodes data
  const nodes = [
    { name: 'VAL-001', type: 'validator', status: 'active', tps: 250000 },
    { name: 'VAL-002', type: 'validator', status: 'active', tps: 245000 },
    { name: 'VAL-003', type: 'validator', status: 'active', tps: 248000 },
    { name: 'VAL-004', type: 'validator', status: 'active', tps: 252000 },
    { name: 'VAL-005', type: 'validator', status: 'active', tps: 246000 },
    { name: 'VAL-006', type: 'validator', status: 'active', tps: 251000 },
    { name: 'VAL-007', type: 'validator', status: 'active', tps: 249000 },
    { name: 'FULL-001', type: 'full', status: 'active', tps: 45000 },
    { name: 'FULL-002', type: 'full', status: 'active', tps: 47000 },
    { name: 'FULL-003', type: 'full', status: 'active', tps: 46000 },
    { name: 'FULL-004', type: 'full', status: 'active', tps: 48000 },
    { name: 'FULL-005', type: 'full', status: 'active', tps: 44000 },
    { name: 'FULL-006', type: 'full', status: 'active', tps: 49000 },
    { name: 'FULL-007', type: 'full', status: 'active', tps: 45000 },
    { name: 'FULL-008', type: 'full', status: 'active', tps: 47000 },
    { name: 'FULL-009', type: 'full', status: 'active', tps: 46000 },
    { name: 'FULL-010', type: 'full', status: 'active', tps: 48000 },
    { name: 'FULL-011', type: 'full', status: 'active', tps: 45000 },
    { name: 'FULL-012', type: 'full', status: 'active', tps: 49000 },
    { name: 'FULL-013', type: 'full', status: 'active', tps: 47000 },
    { name: 'FULL-014', type: 'full', status: 'active', tps: 46000 },
    { name: 'FULL-015', type: 'full', status: 'active', tps: 48000 },
    { name: 'LIGHT-001', type: 'light', status: 'active', tps: 15000 },
    { name: 'LIGHT-002', type: 'light', status: 'active', tps: 16000 },
    { name: 'LIGHT-003', type: 'light', status: 'active', tps: 14000 },
    { name: 'ARCH-001', type: 'archive', status: 'active', tps: 25000 },
    { name: 'ARCH-002', type: 'archive', status: 'active', tps: 26000 }
  ];
  
  res.json(nodes);
});

app.get('/api/demo/leader', (req: Request, res: Response) => {
  // Simulate leader election data
  const validators = ['VAL-001', 'VAL-002', 'VAL-003', 'VAL-004', 'VAL-005', 'VAL-006', 'VAL-007'];
  const currentLeader = validators[Math.floor(Math.random() * validators.length)];
  const term = Math.floor(Date.now() / 8000) % 1000 + 42; // New term every 8 seconds
  const electionCycle = Date.now() % 8000; // 8 second cycle
  const electedAgo = (electionCycle / 1000).toFixed(1) + 's';
  const nextElection = ((8000 - electionCycle) / 1000).toFixed(1) + 's';
  const blockHeight = 1247832 + Math.floor(Date.now() / 1000) - 1756786533; // Incremental block height
  
  res.json({
    currentLeader,
    term,
    electedAgo,
    nextElection,
    consensusHealth: 100,
    blockHeight
  });
});

app.post('/api/demo/start-simulation', (req: Request, res: Response) => {
  try {
    simulator.start();
    res.json({ success: true, message: 'Transaction simulation started' });
  } catch (error) {
    res.json({ success: false, error: error instanceof Error ? error.message : 'Unknown error' });
  }
});

app.post('/api/demo/stop-simulation', (req: Request, res: Response) => {
  try {
    simulator.stop();
    res.json({ success: true, message: 'Transaction simulation stopped' });
  } catch (error) {
    res.json({ success: false, error: error instanceof Error ? error.message : 'Unknown error' });
  }
});

app.post('/api/demo/generate-zkproof', async (req: Request, res: Response) => {
  try {
    if (!zkProofSystem) {
      zkProofSystem = new ZKProofSystem();
    }
    
    // Simulate ZK proof generation
    const proof = 'zk_proof_' + Math.random().toString(36).substr(2, 64);
    demoStats.zkProofsGenerated++;
    
    res.json({ 
      success: true, 
      proof,
      message: 'Zero-knowledge proof generated successfully'
    });
  } catch (error) {
    res.json({ success: false, error: error instanceof Error ? error.message : 'Unknown error' });
  }
});

app.post('/api/demo/quantum-encrypt', async (req: Request, res: Response) => {
  try {
    if (!quantumCrypto) {
      quantumCrypto = new QuantumCryptoManagerV2();
    }
    
    // Simulate quantum encryption
    const encrypted = 'quantum_encrypted_' + Math.random().toString(36).substr(2, 64);
    demoStats.quantumEncryptions++;
    
    res.json({ 
      success: true, 
      encrypted,
      message: 'Quantum encryption completed successfully'
    });
  } catch (error) {
    res.json({ success: false, error: error instanceof Error ? error.message : 'Unknown error' });
  }
});

app.post('/api/demo/stress-test', async (req: Request, res: Response) => {
  try {
    // Simulate stress test
    const startTime = Date.now();
    const targetTransactions = 10000;
    
    for (let i = 0; i < targetTransactions; i++) {
      demoStats.totalTransactions++;
      if (i % 1000 === 0) {
        await new Promise(resolve => setTimeout(resolve, 1)); // Brief pause
      }
    }
    
    const endTime = Date.now();
    const duration = (endTime - startTime) / 1000; // seconds
    const achievedTPS = Math.round(targetTransactions / duration);
    
    demoStats.currentTPS = achievedTPS;
    
    res.json({ 
      success: true, 
      tps: achievedTPS,
      transactions: targetTransactions,
      duration,
      message: `Stress test completed: ${achievedTPS.toLocaleString()} TPS`
    });
  } catch (error) {
    res.json({ success: false, error: error instanceof Error ? error.message : 'Unknown error' });
  }
});

// Health check
app.get('/health', (req: Request, res: Response) => {
  res.json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    demo: 'Aurigraph DLT Demo',
    containers: {
      validator: 'localhost:8181',
      node1: 'localhost:8201', 
      node2: 'localhost:8202',
      management: 'localhost:3140'
    }
  });
});

async function initializeDemo() {
  try {
    logger.info('🎬 Initializing Aurigraph DLT Demo...');
    
    // Initialize channel manager
    channelManager = new ChannelManager();
    logger.info('✅ Channel Manager initialized');
    
    // Initialize quantum crypto
    quantumCrypto = new QuantumCryptoManagerV2();
    logger.info('✅ Quantum Cryptography initialized');
    
    // Initialize ZK proof system
    zkProofSystem = new ZKProofSystem();
    logger.info('✅ Zero-Knowledge Proof System initialized');
    
    logger.info('🚀 Demo initialization complete');
    
  } catch (error) {
    logger.error(`❌ Demo initialization failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

const PORT = process.env.DEMO_PORT || 3050;

async function startDemo() {
  await initializeDemo();
  
  app.listen(PORT, () => {
    logger.info('');
    logger.info('🎬═══════════════════════════════════════════════════════');
    logger.info('🚀 AURIGRAPH DLT DEMO APPLICATION STARTED');
    logger.info('🎬═══════════════════════════════════════════════════════');
    logger.info('');
    logger.info('🌐 Demo URL: http://localhost:' + PORT);
    logger.info('🔗 Management Dashboard: http://localhost:3140');
    logger.info('📊 Container Validator: http://localhost:8181');
    logger.info('🌐 Container Node 1: http://localhost:8201');
    logger.info('🌐 Container Node 2: http://localhost:8202');
    logger.info('');
    logger.info('🎯 Features:');
    logger.info('   • Real-time transaction simulation');
    logger.info('   • Quantum-secure encryption demonstration');
    logger.info('   • Zero-knowledge proof generation');
    logger.info('   • Performance stress testing');
    logger.info('   • Live metrics visualization');
    logger.info('   • Containerized network monitoring');
    logger.info('');
    logger.info('🚀 Ready for demonstration!');
    logger.info('');
    logger.info('Press Ctrl+C to stop the demo');
    logger.info('🎬═══════════════════════════════════════════════════════');
  });
}

// Handle graceful shutdown
process.on('SIGINT', () => {
  logger.info('🛑 Shutting down demo...');
  simulator.stop();
  process.exit(0);
});

startDemo().catch(console.error);