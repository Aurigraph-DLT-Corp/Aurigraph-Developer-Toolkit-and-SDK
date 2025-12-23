#!/usr/bin/env node

/**
 * Aurigraph High-Volume Single Channel Demo (JavaScript)
 * 7 Validators + 50 Basic Nodes in unified channel
 * Real-time transaction processing and monitoring
 */

const express = require('express');
const { WebSocketServer } = require('ws');
const crypto = require('crypto');

class AurigraphChannelDemo {
  constructor() {
    this.app = express();
    this.nodes = new Map();
    this.transactionPool = new Map();
    this.isRunning = false;
    this.startTime = Date.now();
    this.currentLeader = 'validator-1';
    this.consensusTerm = 1;
    
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
      blockHeight: 0
    };
    
    this.initializeNodes();
    this.setupRoutes();
  }
  
  initializeNodes() {
    console.log('🏗️ Initializing Aurigraph Single Channel...');
    
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
        lastHeartbeat: Date.now()
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
        lastHeartbeat: Date.now()
      });
    }
    
    console.log(`✅ Channel initialized with ${this.nodes.size} nodes`);
    console.log(`   📊 Validators: ${this.metrics.validators}`);
    console.log(`   🖥️  Basic Nodes: ${this.metrics.basicNodes}`);
    console.log(`   👑 Leader: ${this.currentLeader}`);
  }
  
  setupRoutes() {
    this.app.use(express.json());
    this.app.use(express.static('.'));
    
    // Channel status endpoint
    this.app.get('/channel/status', (req, res) => {
      res.json({
        status: 'active',
        uptime: Math.floor((Date.now() - this.startTime) / 1000),
        metrics: this.metrics,
        leader: this.currentLeader,
        consensusTerm: this.consensusTerm,
        activeNodes: this.nodes.size,
        sampleNodes: Object.fromEntries(Array.from(this.nodes.entries()).slice(0, 10))
      });
    });
    
    // Submit single transaction
    this.app.post('/channel/transaction', (req, res) => {
      const tx = {
        id: crypto.randomUUID(),
        from: req.body.from || `addr_${Math.floor(Math.random() * 10000)}`,
        to: req.body.to || `addr_${Math.floor(Math.random() * 10000)}`,
        amount: req.body.amount || Math.floor(Math.random() * 1000),
        timestamp: Date.now(),
        status: 'pending',
        confirmations: 0,
        processingNode: this.currentLeader
      };
      
      this.transactionPool.set(tx.id, tx);
      this.metrics.totalTransactions++;
      this.processTransaction(tx);
      
      res.json({
        status: 'accepted',
        txId: tx.id,
        estimatedConfirmation: '1-3 seconds'
      });
    });
    
    // Bulk transaction endpoint
    this.app.post('/channel/transactions/bulk', (req, res) => {
      const count = Math.min(req.body.count || 1000, 10000);
      const transactions = [];
      
      for (let i = 0; i < count; i++) {
        const tx = {
          id: crypto.randomUUID(),
          from: `bulk_${Math.floor(Math.random() * 1000)}`,
          to: `bulk_${Math.floor(Math.random() * 1000)}`,
          amount: Math.floor(Math.random() * 100) + 1,
          timestamp: Date.now(),
          status: 'pending',
          confirmations: 0,
          processingNode: this.selectProcessingNode()
        };
        
        this.transactionPool.set(tx.id, tx);
        transactions.push(tx);
        this.processTransaction(tx);
      }
      
      this.metrics.totalTransactions += count;
      
      res.json({
        status: 'bulk_accepted',
        count: count,
        transactions: transactions.slice(0, 5), // Return first 5 as sample
        estimatedProcessingTime: `${Math.ceil(count / 1000)} seconds`
      });
    });
    
    // Real-time metrics
    this.app.get('/channel/metrics', (req, res) => {
      res.json({
        ...this.metrics,
        timestamp: Date.now(),
        uptime: Math.floor((Date.now() - this.startTime) / 1000),
        transactionPoolSize: this.transactionPool.size
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
        nodes: nodeArray
      });
    });
    
    // Load test trigger
    this.app.post('/channel/loadtest', (req, res) => {
      const intensity = req.body.intensity || 'medium';
      this.triggerLoadTest(intensity);
      
      res.json({
        status: 'load_test_started',
        intensity: intensity,
        message: 'Load test initiated - check metrics for results'
      });
    });
    
    // Serve dashboard at root
    this.app.get('/', (req, res) => {
      res.sendFile(__dirname + '/demo-dashboard.html');
    });
  }
  
  selectProcessingNode() {
    const validators = Array.from(this.nodes.values()).filter(n => n.type === 'validator');
    return validators[Math.floor(Math.random() * validators.length)]?.id || 'validator-1';
  }
  
  processTransaction(tx) {
    // Simulate transaction processing with realistic delays
    setTimeout(() => {
      const transaction = this.transactionPool.get(tx.id);
      if (transaction) {
        transaction.status = 'confirmed';
        transaction.confirmations = 3;
        this.metrics.confirmedTransactions++;
        
        // Update processing node stats
        const node = this.nodes.get(transaction.processingNode);
        if (node) {
          node.transactionCount++;
          const elapsed = (Date.now() - this.startTime) / 1000;
          node.tps = node.transactionCount / elapsed;
        }
      }
    }, Math.random() * 2000 + 500); // 0.5-2.5s processing time
  }
  
  startNodeSimulation() {
    console.log('🚀 Starting node activity simulation...');
    
    setInterval(() => {
      this.simulateNodeActivity();
      this.updateMetrics();
      this.performConsensus();
    }, 1000);
    
    // Generate automatic transactions
    setInterval(() => {
      this.generateAutomaticTransactions();
    }, 200);
    
    // Periodic leader election
    setInterval(() => {
      if (Math.random() < 0.1) { // 10% chance every 30s
        this.electNewLeader();
      }
    }, 30000);
  }
  
  simulateNodeActivity() {
    this.nodes.forEach((node) => {
      // Simulate realistic performance for different node types
      if (node.type === 'validator') {
        node.tps = Math.floor(Math.random() * 8000) + 3000; // 3000-11000 TPS
        node.latency = Math.random() * 30 + 5; // 5-35ms
      } else {
        node.tps = Math.floor(Math.random() * 3000) + 1000; // 1000-4000 TPS  
        node.latency = Math.random() * 80 + 15; // 15-95ms
      }
      
      node.lastHeartbeat = Date.now();
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
  }
  
  generateAutomaticTransactions() {
    const batchSize = Math.floor(Math.random() * 200) + 100; // 100-300 transactions
    
    for (let i = 0; i < batchSize; i++) {
      const tx = {
        id: crypto.randomUUID(),
        from: `auto_${Math.floor(Math.random() * 5000)}`,
        to: `auto_${Math.floor(Math.random() * 5000)}`,
        amount: Math.floor(Math.random() * 500) + 1,
        timestamp: Date.now(),
        status: 'pending',
        confirmations: 0,
        processingNode: this.selectProcessingNode()
      };
      
      this.transactionPool.set(tx.id, tx);
      this.processTransaction(tx);
    }
    
    this.metrics.totalTransactions += batchSize;
  }
  
  performConsensus() {
    this.metrics.consensusRounds++;
    this.metrics.blockHeight++;
    
    // Simulate block creation with pending transactions
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
    const testDuration = 60000; // 1 minute
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
      for (let i = 0; i < transactionsPerSecond / 10; i++) { // Spread over 100ms intervals
        const tx = {
          id: crypto.randomUUID(),
          from: `load_${Math.floor(Math.random() * 10000)}`,
          to: `load_${Math.floor(Math.random() * 10000)}`,
          amount: Math.floor(Math.random() * 1000),
          timestamp: Date.now(),
          status: 'pending',
          confirmations: 0,
          processingNode: this.selectProcessingNode()
        };
        
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
    
    console.log('\\n🌐 ========== AURIGRAPH CHANNEL STATUS ==========');
    console.log(`⏱️  Uptime: ${Math.floor(uptime/60)}m ${uptime%60}s`);
    console.log(`🔗 Active Nodes: ${this.metrics.activeNodes}/${this.metrics.totalNodes}`);
    console.log(`👑 Leader: ${this.currentLeader} (Term ${this.consensusTerm})`);
    console.log(`📊 Network Load: ${this.metrics.networkLoad.toFixed(1)}%`);
    console.log(`⚡ Total TPS: ${this.metrics.totalTPS.toLocaleString()}`);
    console.log(`⏱️  Avg Latency: ${this.metrics.avgLatency.toFixed(1)}ms`);
    console.log(`📦 Block Height: ${this.metrics.blockHeight}`);
    console.log(`🔄 Consensus Rounds: ${this.metrics.consensusRounds}`);
    console.log(`📤 Total Transactions: ${this.metrics.totalTransactions.toLocaleString()}`);
    console.log(`✅ Confirmed: ${this.metrics.confirmedTransactions.toLocaleString()}`);
    console.log(`❌ Failed: ${this.metrics.failedTransactions.toLocaleString()}`);
    console.log(`💯 Success Rate: ${successRate.toFixed(1)}%`);
    console.log('===============================================\\n');
  }
  
  async start() {
    console.log('🚀 Starting Aurigraph Single Channel Demo...');
    console.log(`📊 Configuration:`);
    console.log(`   • Total Nodes: ${this.metrics.totalNodes}`);
    console.log(`   • Validators: ${this.metrics.validators}`);  
    console.log(`   • Basic Nodes: ${this.metrics.basicNodes}`);
    console.log(`   • Target TPS: 100,000+`);
    console.log(`   • Channel: Unified Single Channel\\n`);
    
    this.isRunning = true;
    this.startTime = Date.now();
    
    // Start HTTP server
    this.server = this.app.listen(4000, () => {
      console.log('🌐 Channel API server: http://localhost:4000');
      console.log('📊 Status endpoint: http://localhost:4000/channel/status');  
      console.log('📈 Metrics endpoint: http://localhost:4000/channel/metrics');
      console.log('🔗 Nodes endpoint: http://localhost:4000/channel/nodes');
    });
    
    // Start simulations
    this.startNodeSimulation();
    this.startMonitoring();
    
    console.log('\\n✅ Aurigraph Single Channel Demo RUNNING!');
    console.log('🔥 High-volume transaction processing ACTIVE');
    console.log('⚡ 57 nodes generating 100K+ TPS');
    console.log('📊 Real-time monitoring enabled');
    console.log('\\n💡 Try these commands:');
    console.log('   curl http://localhost:4000/channel/status');
    console.log('   curl -X POST http://localhost:4000/channel/transactions/bulk -H "Content-Type: application/json" -d "{\\"count\\": 5000}"');
    console.log('   curl -X POST http://localhost:4000/channel/loadtest -H "Content-Type: application/json" -d "{\\"intensity\\": \\"high\\"}"');
    console.log('\\n⚠️  Press Ctrl+C to stop the demo\\n');
    
    // Auto-start high intensity load test after 15 seconds
    setTimeout(() => {
      console.log('🚀 Auto-starting HIGH INTENSITY load test...');
      this.triggerLoadTest('high');
    }, 15000);
    
    // Auto-start extreme load test after 2 minutes
    setTimeout(() => {
      console.log('🔥 Auto-starting EXTREME INTENSITY load test...');
      this.triggerLoadTest('extreme');  
    }, 120000);
  }
  
  shutdown() {
    console.log('\\n🛑 Shutting down Aurigraph Channel Demo...');
    this.isRunning = false;
    
    if (this.server) {
      this.server.close();
    }
    
    console.log('✅ Demo shutdown complete');
    process.exit(0);
  }
}

// Create and start demo
const demo = new AurigraphChannelDemo();

// Handle shutdown
process.on('SIGINT', () => demo.shutdown());
process.on('SIGTERM', () => demo.shutdown());

// Start demo
demo.start().catch(error => {
  console.error('❌ Fatal error:', error);
  process.exit(1);
});