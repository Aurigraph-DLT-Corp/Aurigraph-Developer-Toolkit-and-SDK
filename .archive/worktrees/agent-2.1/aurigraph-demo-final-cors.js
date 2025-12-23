#!/usr/bin/env node

const express = require('express');
const { WebSocketServer } = require('ws');
const crypto = require('crypto');
const path = require('path');
const fs = require('fs');

class AurigraphDemo {
  constructor() {
    this.app = express();
    this.nodes = new Map();
    this.transactionPool = new Map();
    this.isRunning = false;
    this.startTime = Date.now();
    this.currentLeader = 'validator-1';
    
    this.config = {
      port: process.env.PORT || 4004,
      wsPort: process.env.WS_PORT || 4005,
      environment: process.env.NODE_ENV || 'production',
      domain: process.env.DOMAIN || 'dlt.aurigraph.io'
    };
    
    this.metrics = {
      totalNodes: 57,
      activeNodes: 57,
      validators: 7,
      basicNodes: 50,
      totalTPS: 175000,
      avgLatency: 45,
      totalTransactions: 1650000,
      confirmedTransactions: 1643250,
      failedTransactions: 6750,
      networkLoad: 87,
      blockHeight: 16500,
      peakTPS: 198000
    };
    
    this.initializeNodes();
    this.setupMiddleware();
    this.setupRoutes();
    this.setupWebSocket();
  }
  
  initializeNodes() {
    console.log('🏗️ Initializing network...');
    
    // Initialize validator nodes
    for (let i = 1; i <= 7; i++) {
      this.nodes.set(`validator-${i}`, {
        id: `validator-${i}`,
        type: 'validator',
        isLeader: i === 1,
        tps: Math.floor(Math.random() * 5000) + 20000,
        latency: Math.random() * 30 + 25,
        transactionCount: Math.floor(Math.random() * 100000) + 200000,
        status: 'active'
      });
    }
    
    // Initialize basic nodes
    for (let i = 1; i <= 50; i++) {
      this.nodes.set(`basic-node-${i}`, {
        id: `basic-node-${i}`,
        type: 'basic',
        isLeader: false,
        tps: Math.floor(Math.random() * 3000) + 1000,
        latency: Math.random() * 50 + 20,
        transactionCount: Math.floor(Math.random() * 50000) + 100000,
        status: 'active'
      });
    }
  }
  
  setupMiddleware() {
    // Trust proxy
    this.app.set('trust proxy', true);
    
    // AGGRESSIVE CORS - Allow everything
    this.app.use((req, res, next) => {
      // Allow all origins
      res.header('Access-Control-Allow-Origin', '*');
      res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, HEAD, PATCH');
      res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization, Cache-Control, Pragma, Expires');
      res.header('Access-Control-Allow-Credentials', 'true');
      res.header('Access-Control-Max-Age', '86400');
      
      // Handle preflight immediately
      if (req.method === 'OPTIONS') {
        console.log(`CORS Preflight: ${req.method} ${req.path} from ${req.get('Origin')}`);
        return res.status(200).end();
      }
      
      next();
    });
    
    // JSON parser
    this.app.use(express.json());
    
    // Request logging
    this.app.use((req, res, next) => {
      console.log(`${new Date().toISOString()} ${req.method} ${req.path} - Origin: ${req.get('Origin')} - IP: ${req.ip}`);
      next();
    });
  }
  
  setupRoutes() {
    // Health check
    this.app.get('/health', (req, res) => {
      res.json({
        status: 'healthy',
        uptime: Math.floor((Date.now() - this.startTime) / 1000),
        cors: 'enabled',
        timestamp: Date.now()
      });
    });
    
    // Channel status endpoint
    this.app.get('/channel/status', (req, res) => {
      console.log('📊 Status request from:', req.get('Origin'));
      res.json({
        network: 'Aurigraph DLT',
        status: 'active',
        leader: this.currentLeader,
        uptime: Math.floor((Date.now() - this.startTime) / 1000),
        metrics: this.metrics,
        timestamp: Date.now()
      });
    });
    
    // Channel metrics
    this.app.get('/channel/metrics', (req, res) => {
      console.log('📈 Metrics request from:', req.get('Origin'));
      res.json({
        timestamp: Date.now(),
        metrics: this.metrics
      });
    });
    
    // Channel nodes
    this.app.get('/channel/nodes', (req, res) => {
      console.log('🖥️ Nodes request from:', req.get('Origin'));
      const nodeList = Array.from(this.nodes.values());
      res.json({
        total: nodeList.length,
        validators: nodeList.filter(n => n.type === 'validator').length,
        basic: nodeList.filter(n => n.type === 'basic').length,
        nodes: nodeList,
        timestamp: Date.now()
      });
    });
    
    // Submit transaction
    this.app.post('/channel/transaction', (req, res) => {
      const txId = crypto.randomBytes(16).toString('hex');
      console.log(`💳 Transaction ${txId} from:`, req.get('Origin'));
      
      res.json({
        success: true,
        txId: txId,
        status: 'submitted',
        timestamp: Date.now()
      });
    });
    
    // Bulk transactions
    this.app.post('/channel/transactions/bulk', (req, res) => {
      const count = Math.min(req.body.count || 1000, 10000);
      console.log(`💰 Bulk ${count} transactions from:`, req.get('Origin'));
      
      res.json({
        success: true,
        count: count,
        message: `${count} transactions submitted`,
        timestamp: Date.now()
      });
    });
    
    // Load test
    this.app.post('/channel/loadtest', (req, res) => {
      const intensity = req.body.intensity || 'medium';
      console.log(`🚀 Load test ${intensity} from:`, req.get('Origin'));
      
      res.json({
        success: true,
        intensity: intensity,
        message: `Load test started`,
        timestamp: Date.now()
      });
    });
    
    // API docs
    this.app.get('/api/docs', (req, res) => {
      res.json({
        name: 'Aurigraph DLT API',
        version: '1.0.0',
        cors: 'enabled',
        endpoints: {
          health: 'GET /health',
          status: 'GET /channel/status',
          metrics: 'GET /channel/metrics',
          nodes: 'GET /channel/nodes',
          transaction: 'POST /channel/transaction',
          bulk: 'POST /channel/transactions/bulk',
          loadtest: 'POST /channel/loadtest'
        }
      });
    });
    
    // Catch-all
    this.app.use((req, res) => {
      res.status(404).json({
        error: 'Not Found',
        message: `Endpoint ${req.path} not found`,
        cors: 'enabled'
      });
    });
  }
  
  setupWebSocket() {
    this.wss = new WebSocketServer({ 
      port: this.config.wsPort,
      perMessageDeflate: false
    });
    
    this.wss.on('connection', (ws, req) => {
      console.log('📡 WebSocket connection from:', req.headers.origin);
      
      ws.send(JSON.stringify({
        type: 'connected',
        metrics: this.metrics,
        timestamp: Date.now()
      }));
      
      const updateInterval = setInterval(() => {
        if (ws.readyState === ws.OPEN) {
          // Simulate live metrics
          this.metrics.totalTPS = 170000 + Math.floor(Math.random() * 30000);
          this.metrics.totalTransactions += Math.floor(Math.random() * 1000);
          this.metrics.avgLatency = 40 + Math.random() * 20;
          
          ws.send(JSON.stringify({
            type: 'metrics',
            metrics: this.metrics,
            timestamp: Date.now()
          }));
        } else {
          clearInterval(updateInterval);
        }
      }, 2000);
    });
  }
  
  start() {
    const server = this.app.listen(this.config.port, () => {
      console.log('🚀 Aurigraph Demo with Bulletproof CORS');
      console.log(`📡 API: http://localhost:${this.config.port}`);
      console.log(`🌐 WebSocket: ws://localhost:${this.config.wsPort}`);
      console.log(`🔓 CORS: FULLY ENABLED`);
      console.log('✅ Ready!');
    });
    
    // Graceful shutdown
    process.on('SIGTERM', () => {
      console.log('Shutting down...');
      server.close(() => {
        this.wss.close();
        process.exit(0);
      });
    });
  }
}

// Start
const demo = new AurigraphDemo();
demo.start();
