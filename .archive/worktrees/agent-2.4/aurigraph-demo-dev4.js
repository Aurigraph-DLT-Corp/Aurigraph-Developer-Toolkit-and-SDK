#!/usr/bin/env node

/**
 * Aurigraph High-Volume Demo for Dev4 Deployment
 * Production-ready configuration for dlt.aurigraph.io
 */

const express = require('express');
const { WebSocketServer } = require('ws');
const crypto = require('crypto');
const path = require('path');
const fs = require('fs');

class AurigraphDev4Demo {
  constructor() {
    this.app = express();
    this.nodes = new Map();
    this.transactionPool = new Map();
    this.isRunning = false;
    this.startTime = Date.now();
    this.currentLeader = 'validator-1';
    this.consensusTerm = 1;
    
    // Production configuration for dev4
    this.config = {
      port: process.env.PORT || 4004,
      wsPort: process.env.WS_PORT || 4005,
      environment: process.env.NODE_ENV || 'production',
      domain: process.env.DOMAIN || 'dlt.aurigraph.io',
      corsOrigin: process.env.CORS_ORIGIN || '*'
    };
    
    this.metrics = {
      totalNodes: 57,
      activeNodes: 57,
      validators: 7,
      basicNodes: 50,
      totalTPS: 0,
      avgLatency: 0,
      totalTransactions: 0,
      confirmedTransactions: 0,
      failedTransactions: 0,
      networkLoad: 100,
      consensusRounds: 0,
      blockHeight: 0,
      peakTPS: 0,
      avgTPS: 0
    };
    
    // Performance tracking
    this.tpsHistory = [];
    this.latencyHistory = [];
    
    this.initializeNodes();
    this.setupMiddleware();
    this.setupRoutes();
    this.setupWebSocket();
  }
  
  initializeNodes() {
    console.log('🏗️ Initializing Aurigraph Network for Dev4...');
    
    // Initialize 7 validator nodes
    for (let i = 1; i <= 7; i++) {
      this.nodes.set(`validator-${i}`, {
        id: `validator-${i}`,
        type: 'validator',
        isLeader: i === 1,
        consensusTerm: 1,
        blockHeight: 0,
        transactionCount: 0,
        tps: 0,
        latency: 0,
        lastHeartbeat: Date.now(),
        status: 'active',
        region: this.getNodeRegion(i)
      });
    }
    
    // Initialize 50 basic nodes
    for (let i = 1; i <= 50; i++) {
      this.nodes.set(`basic-node-${i}`, {
        id: `basic-node-${i}`,
        type: 'basic',
        isLeader: false,
        consensusTerm: 1,
        blockHeight: 0,
        transactionCount: 0,
        tps: 0,
        latency: 0,
        lastHeartbeat: Date.now(),
        status: 'active',
        region: this.getNodeRegion(i)
      });
    }
    
    console.log(`✅ Network initialized with ${this.nodes.size} nodes`);
  }
  
  getNodeRegion(index) {
    const regions = ['us-east', 'us-west', 'eu-west', 'asia-pacific', 'global'];
    return regions[index % regions.length];
  }
  
  setupMiddleware() {
    // Security headers
    this.app.use((req, res, next) => {
      res.setHeader('X-Content-Type-Options', 'nosniff');
      res.setHeader('X-Frame-Options', 'DENY');
      res.setHeader('X-XSS-Protection', '1; mode=block');
      next();
    });
    
    // CORS configuration
    this.app.use((req, res, next) => {
      res.setHeader('Access-Control-Allow-Origin', this.config.corsOrigin);
      res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
      if (req.method === 'OPTIONS') {
        return res.sendStatus(200);
      }
      next();
    });
    
    this.app.use(express.json());
    this.app.use(express.static(path.join(__dirname)));
  }
  
  setupRoutes() {
    // Health check endpoint
    this.app.get('/health', (req, res) => {
      res.json({
        status: 'healthy',
        environment: this.config.environment,
        uptime: Math.floor((Date.now() - this.startTime) / 1000),
        version: '1.0.0-dev4'
      });
    });
    
    // Root endpoint - serve dashboard
    this.app.get('/', (req, res) => {
      const dashboardPath = path.join(__dirname, 'demo-dashboard.html');
      if (fs.existsSync(dashboardPath)) {
        res.sendFile(dashboardPath);
      } else {
        res.json({
          message: 'Aurigraph DLT Demo API',
          version: '1.0.0-dev4',
          endpoints: {
            status: '/channel/status',
            metrics: '/channel/metrics',
            nodes: '/channel/nodes',
            dashboard: '/dashboard'
          }
        });
      }
    });
    
    // Dashboard endpoint
    this.app.get('/dashboard', (req, res) => {
      const dashboardPath = path.join(__dirname, 'demo-dashboard.html');
      if (fs.existsSync(dashboardPath)) {
        res.sendFile(dashboardPath);
      } else {
        res.status(404).json({ error: 'Dashboard not found' });
      }
    });
    
    // Channel status endpoint
    this.app.get('/channel/status', (req, res) => {
      res.json({
        status: 'active',
        environment: this.config.environment,
        domain: this.config.domain,
        uptime: Math.floor((Date.now() - this.startTime) / 1000),
        metrics: this.metrics,
        leader: this.currentLeader,
        consensusTerm: this.consensusTerm,
        activeNodes: this.nodes.size,
        networkHealth: this.calculateNetworkHealth(),
        performance: {
          currentTPS: this.metrics.totalTPS,
          peakTPS: this.metrics.peakTPS,
          avgTPS: this.calculateAverageTPS()
        }
      });
    });
    
    // Real-time metrics
    this.app.get('/channel/metrics', (req, res) => {
      res.json({
        ...this.metrics,
        timestamp: Date.now(),
        uptime: Math.floor((Date.now() - this.startTime) / 1000),
        transactionPoolSize: this.transactionPool.size,
        networkUtilization: (this.metrics.networkLoad / 100),
        performance: {
          tpsHistory: this.tpsHistory.slice(-50),
          latencyHistory: this.latencyHistory.slice(-50)
        }
      });
    });
    
    // Node details
    this.app.get('/channel/nodes', (req, res) => {
      const nodeArray = Array.from(this.nodes.entries()).map(([id, node]) => ({
        id,
        ...node
      }));
      
      res.json({
        totalNodes: nodeArray.length,
        activeNodes: nodeArray.filter(n => n.status === 'active').length,
        validators: nodeArray.filter(n => n.type === 'validator').length,
        basicNodes: nodeArray.filter(n => n.type === 'basic').length,
        nodes: nodeArray
      });
    });
    
    // Submit transaction
    this.app.post('/channel/transaction', (req, res) => {
      const tx = this.createTransaction(req.body);
      this.transactionPool.set(tx.id, tx);
      this.metrics.totalTransactions++;
      this.processTransaction(tx);
      
      res.json({
        status: 'accepted',
        txId: tx.id,
        estimatedConfirmation: '1-3 seconds',
        networkStatus: 'optimal'
      });
    });
    
    // Bulk transactions
    this.app.post('/channel/transactions/bulk', (req, res) => {
      const count = Math.min(req.body.count || 1000, 10000);
      const transactions = [];
      
      for (let i = 0; i < count; i++) {
        const tx = this.createTransaction({
          from: `bulk_${Math.floor(Math.random() * 1000)}`,
          to: `bulk_${Math.floor(Math.random() * 1000)}`,
          amount: Math.floor(Math.random() * 100) + 1
        });
        
        this.transactionPool.set(tx.id, tx);
        transactions.push(tx);
        this.processTransaction(tx);
      }
      
      this.metrics.totalTransactions += count;
      
      res.json({
        status: 'bulk_accepted',
        count: count,
        transactions: transactions.slice(0, 5),
        estimatedProcessingTime: `${Math.ceil(count / 1000)} seconds`
      });
    });
    
    // Load test endpoint
    this.app.post('/channel/loadtest', (req, res) => {
      const intensity = req.body.intensity || 'medium';
      this.triggerLoadTest(intensity);
      
      res.json({
        status: 'load_test_started',
        intensity: intensity,
        message: 'Load test initiated - monitor /channel/metrics for results'
      });
    });
    
    // API documentation
    this.app.get('/api/docs', (req, res) => {
      res.json({
        name: 'Aurigraph DLT Demo API',
        version: '1.0.0-dev4',
        environment: this.config.environment,
        baseUrl: `https://${this.config.domain}`,
        endpoints: [
          {
            method: 'GET',
            path: '/health',
            description: 'Health check endpoint'
          },
          {
            method: 'GET',
            path: '/channel/status',
            description: 'Get network status and metrics'
          },
          {
            method: 'GET',
            path: '/channel/metrics',
            description: 'Get detailed performance metrics'
          },
          {
            method: 'GET',
            path: '/channel/nodes',
            description: 'Get node network details'
          },
          {
            method: 'POST',
            path: '/channel/transaction',
            description: 'Submit single transaction'
          },
          {
            method: 'POST',
            path: '/channel/transactions/bulk',
            description: 'Submit bulk transactions'
          },
          {
            method: 'POST',
            path: '/channel/loadtest',
            description: 'Trigger load test'
          }
        ]
      });
    });
  }
  
  setupWebSocket() {
    // WebSocket server for real-time updates
    const wss = new WebSocketServer({ 
      port: this.config.wsPort,
      perMessageDeflate: false
    });
    
    wss.on('connection', (ws) => {
      console.log('📡 WebSocket client connected');
      
      // Send initial status
      ws.send(JSON.stringify({
        type: 'welcome',
        data: {
          message: 'Connected to Aurigraph DLT Demo',
          metrics: this.metrics
        }
      }));
      
      // Send periodic updates
      const interval = setInterval(() => {
        if (ws.readyState === ws.OPEN) {
          ws.send(JSON.stringify({
            type: 'metrics',
            data: this.metrics
          }));
        }
      }, 2000);
      
      ws.on('close', () => {
        clearInterval(interval);
        console.log('📡 WebSocket client disconnected');
      });
    });
    
    this.wss = wss;
  }
  
  createTransaction(data = {}) {
    return {
      id: crypto.randomUUID(),
      from: data.from || `addr_${Math.floor(Math.random() * 10000)}`,
      to: data.to || `addr_${Math.floor(Math.random() * 10000)}`,
      amount: data.amount || Math.floor(Math.random() * 1000),
      timestamp: Date.now(),
      status: 'pending',
      confirmations: 0,
      processingNode: this.selectProcessingNode(),
      hash: crypto.randomBytes(32).toString('hex')
    };
  }
  
  selectProcessingNode() {
    const validators = Array.from(this.nodes.values()).filter(n => n.type === 'validator');
    return validators[Math.floor(Math.random() * validators.length)]?.id || 'validator-1';
  }
  
  processTransaction(tx) {
    setTimeout(() => {
      const transaction = this.transactionPool.get(tx.id);
      if (transaction) {
        transaction.status = 'confirmed';
        transaction.confirmations = 3;
        this.metrics.confirmedTransactions++;
        
        const node = this.nodes.get(transaction.processingNode);
        if (node) {
          node.transactionCount++;
          const elapsed = (Date.now() - this.startTime) / 1000;
          node.tps = node.transactionCount / elapsed;
        }
        
        // Clean up old transactions
        if (this.transactionPool.size > 10000) {
          const oldestKey = this.transactionPool.keys().next().value;
          this.transactionPool.delete(oldestKey);
        }
      }
    }, Math.random() * 2000 + 500);
  }
  
  calculateNetworkHealth() {
    const activeNodes = Array.from(this.nodes.values()).filter(
      n => Date.now() - n.lastHeartbeat < 5000
    ).length;
    
    const healthScore = (activeNodes / this.nodes.size) * 100;
    
    if (healthScore >= 95) return 'excellent';
    if (healthScore >= 80) return 'good';
    if (healthScore >= 60) return 'fair';
    return 'poor';
  }
  
  calculateAverageTPS() {
    if (this.tpsHistory.length === 0) return 0;
    const sum = this.tpsHistory.reduce((a, b) => a + b, 0);
    return Math.round(sum / this.tpsHistory.length);
  }
  
  startNodeSimulation() {
    console.log('🚀 Starting node activity simulation...');
    
    // Main simulation loop
    setInterval(() => {
      this.simulateNodeActivity();
      this.updateMetrics();
      this.performConsensus();
      this.updateTPSHistory();
    }, 1000);
    
    // Generate automatic transactions
    setInterval(() => {
      this.generateAutomaticTransactions();
    }, 200);
    
    // Periodic leader election
    setInterval(() => {
      if (Math.random() < 0.1) {
        this.electNewLeader();
      }
    }, 30000);
    
    // Cleanup old data
    setInterval(() => {
      this.cleanupOldData();
    }, 60000);
  }
  
  simulateNodeActivity() {
    this.nodes.forEach((node) => {
      // Simulate realistic performance
      if (node.type === 'validator') {
        node.tps = Math.floor(Math.random() * 8000) + 3000;
        node.latency = Math.random() * 30 + 5;
      } else {
        node.tps = Math.floor(Math.random() * 3000) + 1000;
        node.latency = Math.random() * 80 + 15;
      }
      
      node.lastHeartbeat = Date.now();
      node.status = 'active';
    });
  }
  
  updateMetrics() {
    let totalTPS = 0;
    let totalLatency = 0;
    let activeNodes = 0;
    
    this.nodes.forEach(node => {
      if (Date.now() - node.lastHeartbeat < 5000) {
        totalTPS += node.tps;
        totalLatency += node.latency;
        activeNodes++;
      }
    });
    
    this.metrics.totalTPS = totalTPS;
    this.metrics.avgLatency = activeNodes > 0 ? totalLatency / activeNodes : 0;
    this.metrics.activeNodes = activeNodes;
    this.metrics.networkLoad = (activeNodes / this.metrics.totalNodes) * 100;
    
    // Update peak TPS
    if (totalTPS > this.metrics.peakTPS) {
      this.metrics.peakTPS = totalTPS;
    }
    
    // Broadcast to WebSocket clients
    if (this.wss) {
      const message = JSON.stringify({
        type: 'metrics_update',
        data: this.metrics
      });
      
      this.wss.clients.forEach(client => {
        if (client.readyState === 1) {
          client.send(message);
        }
      });
    }
  }
  
  updateTPSHistory() {
    this.tpsHistory.push(this.metrics.totalTPS);
    this.latencyHistory.push(this.metrics.avgLatency);
    
    // Keep only last 100 points
    if (this.tpsHistory.length > 100) {
      this.tpsHistory.shift();
    }
    if (this.latencyHistory.length > 100) {
      this.latencyHistory.shift();
    }
    
    // Update average TPS
    this.metrics.avgTPS = this.calculateAverageTPS();
  }
  
  generateAutomaticTransactions() {
    const batchSize = Math.floor(Math.random() * 200) + 100;
    
    for (let i = 0; i < batchSize; i++) {
      const tx = this.createTransaction({
        from: `auto_${Math.floor(Math.random() * 5000)}`,
        to: `auto_${Math.floor(Math.random() * 5000)}`,
        amount: Math.floor(Math.random() * 500) + 1
      });
      
      this.transactionPool.set(tx.id, tx);
      this.processTransaction(tx);
    }
    
    this.metrics.totalTransactions += batchSize;
  }
  
  performConsensus() {
    this.metrics.consensusRounds++;
    this.metrics.blockHeight++;
    
    const pendingTxs = Array.from(this.transactionPool.values())
      .filter(tx => tx.status === 'pending').length;
    
    if (this.metrics.consensusRounds % 10 === 0) {
      console.log(`📦 Block ${this.metrics.blockHeight} created by ${this.currentLeader} | Pending: ${pendingTxs}`);
    }
  }
  
  electNewLeader() {
    const validators = Array.from(this.nodes.values()).filter(n => n.type === 'validator');
    const newLeader = validators[Math.floor(Math.random() * validators.length)];
    
    if (newLeader && newLeader.id !== this.currentLeader) {
      this.nodes.forEach(n => n.isLeader = false);
      newLeader.isLeader = true;
      this.currentLeader = newLeader.id;
      this.consensusTerm++;
      
      console.log(`👑 New leader elected: ${this.currentLeader} (Term ${this.consensusTerm})`);
    }
  }
  
  triggerLoadTest(intensity) {
    const testDuration = 60000;
    let transactionsPerSecond;
    
    switch (intensity) {
      case 'low':
        transactionsPerSecond = 1000;
        break;
      case 'medium':
        transactionsPerSecond = 5000;
        break;
      case 'high':
        transactionsPerSecond = 15000;
        break;
      case 'extreme':
        transactionsPerSecond = 50000;
        break;
      default:
        transactionsPerSecond = 5000;
    }
    
    console.log(`🚀 Load test started: ${transactionsPerSecond} TPS for ${testDuration/1000} seconds`);
    
    const interval = setInterval(() => {
      for (let i = 0; i < transactionsPerSecond / 10; i++) {
        const tx = this.createTransaction({
          from: `load_${Math.floor(Math.random() * 10000)}`,
          to: `load_${Math.floor(Math.random() * 10000)}`,
          amount: Math.floor(Math.random() * 1000)
        });
        
        this.transactionPool.set(tx.id, tx);
        this.processTransaction(tx);
        this.metrics.totalTransactions++;
      }
    }, 100);
    
    setTimeout(() => {
      clearInterval(interval);
      console.log(`✅ Load test completed: ${intensity} intensity`);
    }, testDuration);
  }
  
  cleanupOldData() {
    // Clean up old transactions
    const maxPoolSize = 50000;
    if (this.transactionPool.size > maxPoolSize) {
      const toDelete = this.transactionPool.size - maxPoolSize;
      const keys = Array.from(this.transactionPool.keys()).slice(0, toDelete);
      keys.forEach(key => this.transactionPool.delete(key));
      console.log(`🧹 Cleaned up ${toDelete} old transactions`);
    }
  }
  
  startMonitoring() {
    console.log('📊 Starting real-time monitoring...');
    
    setInterval(() => {
      this.displayStatus();
    }, 5000);
  }
  
  displayStatus() {
    const uptime = Math.floor((Date.now() - this.startTime) / 1000);
    const successRate = this.metrics.totalTransactions > 0 
      ? (this.metrics.confirmedTransactions / this.metrics.totalTransactions) * 100 
      : 0;
    
    console.log('\n🌐 ========== AURIGRAPH DEV4 STATUS ==========');
    console.log(`📍 Environment: ${this.config.environment}`);
    console.log(`🌍 Domain: ${this.config.domain}`);
    console.log(`⏱️  Uptime: ${Math.floor(uptime/60)}m ${uptime%60}s`);
    console.log(`🔗 Active Nodes: ${this.metrics.activeNodes}/${this.metrics.totalNodes}`);
    console.log(`👑 Leader: ${this.currentLeader} (Term ${this.consensusTerm})`);
    console.log(`⚡ Current TPS: ${this.metrics.totalTPS.toLocaleString()}`);
    console.log(`📈 Peak TPS: ${this.metrics.peakTPS.toLocaleString()}`);
    console.log(`📊 Avg TPS: ${this.metrics.avgTPS.toLocaleString()}`);
    console.log(`⏱️  Avg Latency: ${this.metrics.avgLatency.toFixed(1)}ms`);
    console.log(`📦 Block Height: ${this.metrics.blockHeight}`);
    console.log(`📤 Total Transactions: ${this.metrics.totalTransactions.toLocaleString()}`);
    console.log(`✅ Confirmed: ${this.metrics.confirmedTransactions.toLocaleString()}`);
    console.log(`💯 Success Rate: ${successRate.toFixed(1)}%`);
    console.log('=============================================\n');
  }
  
  async start() {
    console.log('\n🚀 Starting Aurigraph Dev4 Demo...');
    console.log(`📊 Configuration:`);
    console.log(`   • Environment: ${this.config.environment}`);
    console.log(`   • Domain: ${this.config.domain}`);
    console.log(`   • HTTP Port: ${this.config.port}`);
    console.log(`   • WebSocket Port: ${this.config.wsPort}`);
    console.log(`   • Total Nodes: ${this.metrics.totalNodes}`);
    console.log(`   • Target TPS: 100,000+\n`);
    
    this.isRunning = true;
    this.startTime = Date.now();
    
    // Start HTTP server
    this.server = this.app.listen(this.config.port, '0.0.0.0', () => {
      console.log(`🌐 HTTP API server: http://0.0.0.0:${this.config.port}`);
      console.log(`📊 Status endpoint: http://0.0.0.0:${this.config.port}/channel/status`);
      console.log(`📈 Metrics endpoint: http://0.0.0.0:${this.config.port}/channel/metrics`);
      console.log(`🔗 Nodes endpoint: http://0.0.0.0:${this.config.port}/channel/nodes`);
      console.log(`📡 WebSocket server: ws://0.0.0.0:${this.config.wsPort}`);
    });
    
    // Start simulations
    this.startNodeSimulation();
    this.startMonitoring();
    
    console.log('\n✅ Aurigraph Dev4 Demo RUNNING!');
    console.log(`🌍 Ready for deployment at: https://${this.config.domain}`);
    console.log('🔥 High-volume transaction processing ACTIVE');
    console.log('📊 Real-time monitoring enabled');
    
    // Auto-start medium intensity after 10 seconds
    setTimeout(() => {
      console.log('🚀 Auto-starting MEDIUM intensity load test...');
      this.triggerLoadTest('medium');
    }, 10000);
    
    // Auto-start high intensity after 2 minutes
    setTimeout(() => {
      console.log('🔥 Auto-starting HIGH intensity load test...');
      this.triggerLoadTest('high');
    }, 120000);
  }
  
  shutdown() {
    console.log('\n🛑 Shutting down Aurigraph Dev4 Demo...');
    this.isRunning = false;
    
    if (this.server) {
      this.server.close();
    }
    
    if (this.wss) {
      this.wss.close();
    }
    
    console.log('✅ Demo shutdown complete');
    process.exit(0);
  }
}

// Create and start demo
const demo = new AurigraphDev4Demo();

// Handle shutdown
process.on('SIGINT', () => demo.shutdown());
process.on('SIGTERM', () => demo.shutdown());

// Start demo
demo.start().catch(error => {
  console.error('❌ Fatal error:', error);
  process.exit(1);
});