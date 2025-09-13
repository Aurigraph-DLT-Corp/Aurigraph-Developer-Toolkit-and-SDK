#!/usr/bin/env node

/**
 * Aurigraph DLT V11 Demo Server
 * High-performance blockchain simulation with configurable validators and business nodes
 */

const express = require('express');
const WebSocket = require('ws');
const http = require('http');
const path = require('path');
const crypto = require('crypto');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

// Configuration
const PORT = process.env.PORT || 3088;

// Simulation state
let simulationState = {
    isRunning: false,
    config: {
        channel: 'main-channel',
        validators: 4,
        businessNodes: 10,
        targetTps: 100000,
        batchSize: 1000,
        consensusType: 'hyperraft'
    },
    metrics: {
        tps: 0,
        totalTransactions: 0,
        latency: 0,
        successRate: 100,
        activeNodes: 0,
        blockHeight: 0,
        consensusRounds: 0
    },
    nodes: {
        validators: [],
        businessNodes: []
    }
};

// Node class
class Node {
    constructor(id, type) {
        this.id = id;
        this.type = type;
        this.status = 'idle';
        this.transactionsProcessed = 0;
        this.lastActivity = Date.now();
        this.latency = Math.random() * 10 + 5; // 5-15ms base latency
    }

    processTransaction() {
        this.transactionsProcessed++;
        this.lastActivity = Date.now();
        this.status = 'processing';
        
        // Simulate processing time
        setTimeout(() => {
            this.status = 'idle';
        }, this.latency);
        
        return this.latency;
    }
}

// Transaction generator
class TransactionGenerator {
    constructor() {
        this.interval = null;
        this.transactionCount = 0;
    }

    start(targetTps, batchSize) {
        const intervalMs = (1000 / targetTps) * batchSize;
        
        this.interval = setInterval(() => {
            if (simulationState.isRunning) {
                this.generateBatch(batchSize);
            }
        }, intervalMs);
    }

    stop() {
        if (this.interval) {
            clearInterval(this.interval);
            this.interval = null;
        }
    }

    generateBatch(batchSize) {
        const transactions = [];
        
        for (let i = 0; i < batchSize; i++) {
            transactions.push({
                id: crypto.randomBytes(16).toString('hex'),
                timestamp: Date.now(),
                data: `Transaction ${this.transactionCount++}`,
                signature: crypto.randomBytes(32).toString('hex')
            });
        }

        processTransactionBatch(transactions);
    }
}

// Consensus simulator
class ConsensusSimulator {
    constructor(type) {
        this.type = type;
        this.rounds = 0;
    }

    async runConsensus(validators, transactions) {
        this.rounds++;
        
        // Simulate consensus delay based on algorithm
        const delays = {
            'hyperraft': 10,  // HyperRAFT++ - fastest
            'pbft': 50,       // PBFT - moderate
            'raft': 30        // Standard RAFT
        };
        
        const baseDelay = delays[this.type] || 30;
        const consensusDelay = baseDelay + (validators.length * 2);
        
        await new Promise(resolve => setTimeout(resolve, consensusDelay));
        
        // Simulate validator voting
        let votes = 0;
        for (const validator of validators) {
            if (Math.random() > 0.01) { // 99% success rate
                votes++;
                validator.processTransaction();
            }
        }
        
        const consensusReached = votes >= Math.ceil(validators.length * 0.67);
        return {
            success: consensusReached,
            delay: consensusDelay,
            votes,
            required: Math.ceil(validators.length * 0.67)
        };
    }
}

// Initialize simulation components
const txGenerator = new TransactionGenerator();
let consensusSimulator = null;

// Process transaction batch
async function processTransactionBatch(transactions) {
    const startTime = Date.now();
    
    // Run consensus
    const consensusResult = await consensusSimulator.runConsensus(
        simulationState.nodes.validators,
        transactions
    );
    
    if (consensusResult.success) {
        // Process in business nodes
        const promises = simulationState.nodes.businessNodes.map(node => {
            return new Promise(resolve => {
                const latency = node.processTransaction();
                setTimeout(resolve, latency);
            });
        });
        
        await Promise.all(promises);
        
        // Update metrics
        const endTime = Date.now();
        const totalLatency = endTime - startTime;
        
        simulationState.metrics.totalTransactions += transactions.length;
        simulationState.metrics.latency = (simulationState.metrics.latency * 0.9) + (totalLatency * 0.1);
        simulationState.metrics.blockHeight++;
        simulationState.metrics.consensusRounds = consensusSimulator.rounds;
        
        // Calculate actual TPS
        const elapsed = (Date.now() - simulationStartTime) / 1000;
        simulationState.metrics.tps = Math.floor(simulationState.metrics.totalTransactions / elapsed);
        
        // Update active nodes
        simulationState.metrics.activeNodes = 
            simulationState.nodes.validators.filter(n => n.status === 'processing').length +
            simulationState.nodes.businessNodes.filter(n => n.status === 'processing').length;
    } else {
        // Consensus failed
        simulationState.metrics.successRate = 
            (simulationState.metrics.successRate * 0.99) + (0 * 0.01);
    }
}

let simulationStartTime = 0;
let metricsInterval = null;

// Start simulation
function startSimulation(config) {
    console.log('Starting simulation with config:', config);
    
    simulationState.isRunning = true;
    simulationState.config = config;
    simulationState.metrics = {
        tps: 0,
        totalTransactions: 0,
        latency: 0,
        successRate: 100,
        activeNodes: 0,
        blockHeight: 0,
        consensusRounds: 0
    };
    
    // Initialize nodes
    simulationState.nodes.validators = [];
    simulationState.nodes.businessNodes = [];
    
    for (let i = 0; i < config.validators; i++) {
        simulationState.nodes.validators.push(new Node(`V${i + 1}`, 'validator'));
    }
    
    for (let i = 0; i < config.businessNodes; i++) {
        simulationState.nodes.businessNodes.push(new Node(`B${i + 1}`, 'business'));
    }
    
    // Initialize consensus
    consensusSimulator = new ConsensusSimulator(config.consensusType);
    
    // Start transaction generation
    simulationStartTime = Date.now();
    txGenerator.start(config.targetTps, config.batchSize);
    
    // Start metrics broadcasting
    metricsInterval = setInterval(broadcastMetrics, 100);
}

// Stop simulation
function stopSimulation() {
    console.log('Stopping simulation');
    
    simulationState.isRunning = false;
    txGenerator.stop();
    
    if (metricsInterval) {
        clearInterval(metricsInterval);
        metricsInterval = null;
    }
}

// Broadcast metrics to all connected clients
function broadcastMetrics() {
    const message = JSON.stringify({
        type: 'metrics',
        ...simulationState.metrics,
        isRunning: simulationState.isRunning,
        config: simulationState.config
    });
    
    wss.clients.forEach(client => {
        if (client.readyState === WebSocket.OPEN) {
            client.send(message);
        }
    });
}

// WebSocket connection handler
wss.on('connection', (ws) => {
    console.log('New WebSocket connection');
    
    // Send initial state
    ws.send(JSON.stringify({
        type: 'connected',
        ...simulationState.metrics,
        config: simulationState.config
    }));
    
    ws.on('message', (message) => {
        try {
            const data = JSON.parse(message);
            
            switch (data.type) {
                case 'start':
                    if (!simulationState.isRunning) {
                        startSimulation(data.config);
                    }
                    break;
                    
                case 'stop':
                    if (simulationState.isRunning) {
                        stopSimulation();
                    }
                    break;
                    
                case 'getStatus':
                    ws.send(JSON.stringify({
                        type: 'status',
                        ...simulationState
                    }));
                    break;
            }
        } catch (error) {
            console.error('Error processing message:', error);
        }
    });
    
    ws.on('close', () => {
        console.log('WebSocket connection closed');
    });
});

// Express middleware
app.use(express.static(path.join(__dirname)));
app.use(express.json());

// Serve the demo HTML
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'aurigraph-demo-app.html'));
});

// API endpoints
app.get('/api/status', (req, res) => {
    res.json(simulationState);
});

app.post('/api/start', (req, res) => {
    if (!simulationState.isRunning) {
        startSimulation(req.body);
        res.json({ success: true, message: 'Simulation started' });
    } else {
        res.status(400).json({ success: false, message: 'Simulation already running' });
    }
});

app.post('/api/stop', (req, res) => {
    if (simulationState.isRunning) {
        stopSimulation();
        res.json({ success: true, message: 'Simulation stopped' });
    } else {
        res.status(400).json({ success: false, message: 'Simulation not running' });
    }
});

app.get('/api/metrics', (req, res) => {
    res.json(simulationState.metrics);
});

// Start server
server.listen(PORT, () => {
    console.log(`
    ========================================
    🚀 Aurigraph DLT V11 Demo Server
    ========================================
    
    Server running on:
    - HTTP: http://localhost:${PORT}
    - WebSocket: ws://localhost:${PORT}
    
    Open http://localhost:${PORT} in your browser
    ========================================
    `);
});