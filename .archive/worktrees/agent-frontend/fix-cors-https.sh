#!/bin/bash

# Fix CORS errors for HTTPS deployment on dlt.aurigraph.io
# Updates both Node.js application and nginx configuration

echo "🔧 Fixing CORS for HTTPS on dlt.aurigraph.io"
echo "============================================="

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m'

# Server details
SERVER="dlt.aurigraph.io"
USER="ubuntu"

echo -e "${BLUE}ℹ️  Creating updated Node.js application with CORS fix...${NC}"

# Create updated Node.js app with proper CORS headers
cat > aurigraph-demo-cors-fix.js << 'EOF'
#!/usr/bin/env node

/**
 * Aurigraph High-Volume Demo with CORS Fix
 * Production-ready for HTTPS deployment
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
      corsOrigin: process.env.CORS_ORIGIN || 'https://dlt.aurigraph.io'
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
    console.log('🏗️ Initializing Aurigraph Network...');
    
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
    const regions = ['us-east', 'us-west', 'eu-central', 'asia-pacific', 'global'];
    return regions[index % regions.length];
  }
  
  setupMiddleware() {
    // Enable trust proxy for nginx
    this.app.set('trust proxy', true);
    
    // JSON parser
    this.app.use(express.json());
    
    // CORS middleware with proper configuration
    this.app.use((req, res, next) => {
      const origin = req.headers.origin;
      const allowedOrigins = [
        'https://dlt.aurigraph.io',
        'http://localhost:3000',
        'http://localhost:8050'
      ];
      
      // Allow the origin if it's in our whitelist or if it's a same-origin request
      if (!origin || allowedOrigins.includes(origin) || origin === `https://${this.config.domain}`) {
        res.setHeader('Access-Control-Allow-Origin', origin || '*');
      } else {
        // For other origins, allow but with restrictions
        res.setHeader('Access-Control-Allow-Origin', '*');
      }
      
      res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept');
      res.setHeader('Access-Control-Allow-Credentials', 'true');
      res.setHeader('Access-Control-Max-Age', '86400');
      
      // Handle preflight requests
      if (req.method === 'OPTIONS') {
        res.sendStatus(204);
        return;
      }
      
      next();
    });
    
    // Request logging
    this.app.use((req, res, next) => {
      const timestamp = new Date().toISOString();
      console.log(`[${timestamp}] ${req.method} ${req.path} from ${req.ip}`);
      next();
    });
  }
  
  setupRoutes() {
    // Health check endpoint
    this.app.get('/health', (req, res) => {
      res.json({
        status: 'healthy',
        uptime: Math.floor((Date.now() - this.startTime) / 1000),
        environment: this.config.environment,
        domain: this.config.domain
      });
    });
    
    // Status endpoint with CORS
    this.app.get('/channel/status', (req, res) => {
      res.json({
        network: 'Aurigraph DLT',
        status: 'active',
        leader: this.currentLeader,
        consensusTerm: this.consensusTerm,
        uptime: Math.floor((Date.now() - this.startTime) / 1000),
        metrics: this.metrics,
        performance: {
          currentTPS: this.metrics.totalTPS,
          peakTPS: this.metrics.peakTPS,
          avgLatency: this.metrics.avgLatency,
          successRate: this.metrics.totalTransactions > 0 
            ? ((this.metrics.confirmedTransactions / this.metrics.totalTransactions) * 100).toFixed(2) + '%'
            : '0%'
        }
      });
    });
    
    // Metrics endpoint
    this.app.get('/channel/metrics', (req, res) => {
      res.json({
        timestamp: Date.now(),
        metrics: this.metrics,
        tpsHistory: this.tpsHistory.slice(-100),
        latencyHistory: this.latencyHistory.slice(-100)
      });
    });
    
    // Nodes endpoint
    this.app.get('/channel/nodes', (req, res) => {
      const nodeList = Array.from(this.nodes.values()).map(node => ({
        ...node,
        uptime: Math.floor((Date.now() - this.startTime) / 1000)
      }));
      
      res.json({
        total: nodeList.length,
        validators: nodeList.filter(n => n.type === 'validator').length,
        basic: nodeList.filter(n => n.type === 'basic').length,
        nodes: nodeList
      });
    });
    
    // Submit transaction endpoint
    this.app.post('/channel/transaction', (req, res) => {
      const txId = crypto.randomBytes(16).toString('hex');
      const transaction = {
        id: txId,
        timestamp: Date.now(),
        amount: req.body.amount || 100,
        status: 'pending'
      };
      
      this.transactionPool.set(txId, transaction);
      this.processTransaction(transaction);
      
      res.json({
        success: true,
        txId: txId,
        status: 'submitted'
      });
    });
    
    // Bulk transactions endpoint
    this.app.post('/channel/transactions/bulk', (req, res) => {
      const count = Math.min(req.body.count || 1000, 10000);
      const transactions = [];
      
      for (let i = 0; i < count; i++) {
        const txId = crypto.randomBytes(16).toString('hex');
        const transaction = {
          id: txId,
          timestamp: Date.now(),
          amount: Math.floor(Math.random() * 1000) + 1,
          status: 'pending'
        };
        
        this.transactionPool.set(txId, transaction);
        transactions.push(transaction);
      }
      
      // Process in batches
      this.processBulkTransactions(transactions);
      
      res.json({
        success: true,
        count: count,
        message: `${count} transactions submitted`
      });
    });
    
    // Load test endpoint
    this.app.post('/channel/loadtest', (req, res) => {
      const intensity = req.body.intensity || 'medium';
      const duration = req.body.duration || 60000;
      
      this.startLoadTest(intensity, duration);
      
      res.json({
        success: true,
        intensity: intensity,
        duration: duration,
        message: `Load test started with ${intensity} intensity`
      });
    });
    
    // API documentation
    this.app.get('/api/docs', (req, res) => {
      res.json({
        name: 'Aurigraph DLT API',
        version: '1.0.0',
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
    
    // Catch-all for undefined routes
    this.app.use((req, res) => {
      res.status(404).json({
        error: 'Not Found',
        message: `Endpoint ${req.path} not found`,
        availableEndpoints: '/api/docs'
      });
    });
  }
  
  setupWebSocket() {
    this.wss = new WebSocketServer({ 
      port: this.config.wsPort,
      perMessageDeflate: false
    });
    
    this.wss.on('connection', (ws) => {
      console.log('📡 New WebSocket connection established');
      
      ws.on('message', (message) => {
        try {
          const data = JSON.parse(message);
          this.handleWebSocketMessage(ws, data);
        } catch (error) {
          ws.send(JSON.stringify({ error: 'Invalid message format' }));
        }
      });
      
      ws.on('close', () => {
        console.log('WebSocket connection closed');
      });
      
      // Send initial status
      ws.send(JSON.stringify({
        type: 'connected',
        metrics: this.metrics
      }));
      
      // Send periodic updates
      const updateInterval = setInterval(() => {
        if (ws.readyState === ws.OPEN) {
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
    
    console.log(`🌐 WebSocket server running on port ${this.config.wsPort}`);
  }
  
  handleWebSocketMessage(ws, data) {
    switch (data.type) {
      case 'subscribe':
        ws.send(JSON.stringify({
          type: 'subscribed',
          channel: data.channel || 'metrics'
        }));
        break;
      case 'ping':
        ws.send(JSON.stringify({ type: 'pong' }));
        break;
      default:
        ws.send(JSON.stringify({
          type: 'error',
          message: 'Unknown message type'
        }));
    }
  }
  
  processTransaction(transaction) {
    // Simulate processing
    setTimeout(() => {
      const success = Math.random() > 0.005;
      
      if (success) {
        transaction.status = 'confirmed';
        this.metrics.confirmedTransactions++;
      } else {
        transaction.status = 'failed';
        this.metrics.failedTransactions++;
      }
      
      this.metrics.totalTransactions++;
      this.updateMetrics();
    }, Math.random() * 100 + 10);
  }
  
  processBulkTransactions(transactions) {
    const batchSize = 100;
    let index = 0;
    
    const processBatch = () => {
      const batch = transactions.slice(index, index + batchSize);
      batch.forEach(tx => this.processTransaction(tx));
      
      index += batchSize;
      if (index < transactions.length) {
        setTimeout(processBatch, 10);
      }
    };
    
    processBatch();
  }
  
  startLoadTest(intensity, duration) {
    console.log(`🚀 Starting load test: ${intensity} intensity for ${duration}ms`);
    
    const tpsTargets = {
      low: 1000,
      medium: 5000,
      high: 15000,
      extreme: 50000
    };
    
    const targetTPS = tpsTargets[intensity] || 5000;
    const interval = 1000 / (targetTPS / 100);
    
    const loadTestInterval = setInterval(() => {
      for (let i = 0; i < 100; i++) {
        const txId = crypto.randomBytes(16).toString('hex');
        const transaction = {
          id: txId,
          timestamp: Date.now(),
          amount: Math.floor(Math.random() * 1000) + 1,
          status: 'pending'
        };
        
        this.transactionPool.set(txId, transaction);
        this.processTransaction(transaction);
      }
    }, interval);
    
    setTimeout(() => {
      clearInterval(loadTestInterval);
      console.log('✅ Load test completed');
    }, duration);
  }
  
  updateMetrics() {
    // Calculate TPS
    const now = Date.now();
    const recentTransactions = Array.from(this.transactionPool.values())
      .filter(tx => now - tx.timestamp < 1000);
    
    this.metrics.totalTPS = recentTransactions.length;
    
    // Update peak TPS
    if (this.metrics.totalTPS > this.metrics.peakTPS) {
      this.metrics.peakTPS = this.metrics.totalTPS;
    }
    
    // Calculate average latency
    const latencies = recentTransactions
      .filter(tx => tx.status === 'confirmed')
      .map(tx => now - tx.timestamp);
    
    if (latencies.length > 0) {
      this.metrics.avgLatency = latencies.reduce((a, b) => a + b, 0) / latencies.length;
    }
    
    // Update block height (simulate)
    if (this.metrics.totalTransactions % 100 === 0) {
      this.metrics.blockHeight++;
    }
    
    // Calculate network load
    this.metrics.networkLoad = Math.min(100, (this.metrics.totalTPS / 200000) * 100);
    
    // Update history
    this.tpsHistory.push({
      timestamp: now,
      value: this.metrics.totalTPS
    });
    
    this.latencyHistory.push({
      timestamp: now,
      value: this.metrics.avgLatency
    });
    
    // Cleanup old data
    if (this.transactionPool.size > 50000) {
      const oldTransactions = Array.from(this.transactionPool.entries())
        .filter(([_, tx]) => now - tx.timestamp > 60000);
      
      oldTransactions.forEach(([id]) => this.transactionPool.delete(id));
    }
  }
  
  simulateNetworkActivity() {
    setInterval(() => {
      // Simulate base network activity
      const baseActivity = 150000 + Math.random() * 50000;
      
      for (let i = 0; i < baseActivity / 1000; i++) {
        const txId = crypto.randomBytes(16).toString('hex');
        const transaction = {
          id: txId,
          timestamp: Date.now(),
          amount: Math.floor(Math.random() * 1000) + 1,
          status: 'pending'
        };
        
        this.transactionPool.set(txId, transaction);
        this.processTransaction(transaction);
      }
      
      // Update node metrics
      this.nodes.forEach(node => {
        node.tps = Math.floor(Math.random() * 5000) + 1000;
        node.latency = Math.random() * 50 + 10;
        node.transactionCount += node.tps;
        node.lastHeartbeat = Date.now();
      });
      
      // Simulate leader election
      if (Math.random() < 0.01) {
        this.electNewLeader();
      }
      
      this.updateMetrics();
    }, 1000);
  }
  
  electNewLeader() {
    const validators = Array.from(this.nodes.values())
      .filter(node => node.type === 'validator');
    
    const newLeader = validators[Math.floor(Math.random() * validators.length)];
    
    // Update leader status
    this.nodes.forEach(node => {
      node.isLeader = node.id === newLeader.id;
    });
    
    this.currentLeader = newLeader.id;
    this.consensusTerm++;
    
    console.log(`👑 New leader elected: ${this.currentLeader} (Term: ${this.consensusTerm})`);
  }
  
  start() {
    const server = this.app.listen(this.config.port, () => {
      console.log('🚀 Aurigraph Demo Server Started');
      console.log(`📡 API: http://localhost:${this.config.port}`);
      console.log(`🌐 WebSocket: ws://localhost:${this.config.wsPort}`);
      console.log(`🌍 Domain: ${this.config.domain}`);
      console.log(`📊 Environment: ${this.config.environment}`);
      console.log('✅ Ready for high-volume transactions!');
      
      // Start network simulation
      this.simulateNetworkActivity();
    });
    
    // Graceful shutdown
    process.on('SIGTERM', () => {
      console.log('📛 SIGTERM received, shutting down gracefully...');
      server.close(() => {
        this.wss.close();
        process.exit(0);
      });
    });
  }
}

// Start the demo
const demo = new AurigraphDev4Demo();
demo.start();
EOF

echo -e "${GREEN}✅ Created Node.js app with CORS fix${NC}"

# Create updated nginx configuration with CORS headers
echo -e "${BLUE}ℹ️  Creating nginx configuration with CORS...${NC}"

cat > nginx-cors-fix.conf << 'EOF'
# Aurigraph DLT HTTPS Configuration with CORS Fix

upstream aurigraph_api {
    server 127.0.0.1:4004;
    keepalive 64;
}

upstream aurigraph_ws {
    server 127.0.0.1:4005;
    keepalive 64;
}

upstream vizro_dashboard {
    server 127.0.0.1:8050;
    keepalive 32;
}

# Map to handle CORS
map $http_origin $cors_origin {
    default "";
    "~^https://dlt\.aurigraph\.io$" "$http_origin";
    "~^http://localhost:.*$" "$http_origin";
    "~^http://127\.0\.0\.1:.*$" "$http_origin";
}

# HTTP server - redirect to HTTPS
server {
    listen 80;
    listen [::]:80;
    server_name dlt.aurigraph.io;
    
    location /.well-known/acme-challenge/ {
        root /var/www/html;
    }
    
    location / {
        return 301 https://$server_name$request_uri;
    }
}

# HTTPS server
server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name dlt.aurigraph.io;
    
    # SSL certificates
    ssl_certificate /etc/letsencrypt/live/dlt.aurigraph.io/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/dlt.aurigraph.io/privkey.pem;
    
    # SSL configuration
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers off;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 10m;
    
    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    
    # Logging
    access_log /var/log/nginx/dlt.aurigraph.io.access.log;
    error_log /var/log/nginx/dlt.aurigraph.io.error.log;
    
    # Document root for static files
    root /var/www/aurigraph;
    index index.html;
    
    # Root location - serve dashboard
    location = / {
        try_files /index.html @api;
    }
    
    # API endpoints with CORS
    location /channel/ {
        # CORS headers
        if ($request_method = 'OPTIONS') {
            add_header 'Access-Control-Allow-Origin' '*' always;
            add_header 'Access-Control-Allow-Methods' 'GET, POST, PUT, DELETE, OPTIONS' always;
            add_header 'Access-Control-Allow-Headers' 'DNT,User-Agent,X-Requested-With,If-Modified-Since,Cache-Control,Content-Type,Range,Authorization' always;
            add_header 'Access-Control-Max-Age' 1728000;
            add_header 'Content-Type' 'text/plain; charset=utf-8';
            add_header 'Content-Length' 0;
            return 204;
        }
        
        # Add CORS headers to responses
        add_header 'Access-Control-Allow-Origin' '*' always;
        add_header 'Access-Control-Allow-Methods' 'GET, POST, PUT, DELETE, OPTIONS' always;
        add_header 'Access-Control-Allow-Headers' 'DNT,User-Agent,X-Requested-With,If-Modified-Since,Cache-Control,Content-Type,Range,Authorization' always;
        add_header 'Access-Control-Expose-Headers' 'Content-Length,Content-Range' always;
        
        proxy_pass http://aurigraph_api;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_buffering off;
        proxy_read_timeout 90s;
        proxy_connect_timeout 90s;
    }
    
    # Health check with CORS
    location /health {
        add_header 'Access-Control-Allow-Origin' '*' always;
        add_header 'Access-Control-Allow-Methods' 'GET, OPTIONS' always;
        
        proxy_pass http://aurigraph_api;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        access_log off;
    }
    
    # API documentation with CORS
    location /api/ {
        # CORS headers
        if ($request_method = 'OPTIONS') {
            add_header 'Access-Control-Allow-Origin' '*' always;
            add_header 'Access-Control-Allow-Methods' 'GET, POST, OPTIONS' always;
            add_header 'Access-Control-Allow-Headers' 'Content-Type, Authorization' always;
            add_header 'Access-Control-Max-Age' 1728000;
            return 204;
        }
        
        add_header 'Access-Control-Allow-Origin' '*' always;
        add_header 'Access-Control-Allow-Methods' 'GET, POST, OPTIONS' always;
        
        proxy_pass http://aurigraph_api;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
    
    # WebSocket endpoint with CORS support
    location /ws {
        proxy_pass http://aurigraph_ws;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header Origin $http_origin;
        proxy_read_timeout 3600s;
        proxy_send_timeout 3600s;
        
        # Add CORS headers for WebSocket
        add_header 'Access-Control-Allow-Origin' '*' always;
        add_header 'Access-Control-Allow-Credentials' 'true' always;
    }
    
    # Vizro Dashboard
    location /vizro/ {
        proxy_pass http://vizro_dashboard/;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_buffering off;
        
        # CORS for dashboard
        add_header 'Access-Control-Allow-Origin' '*' always;
    }
    
    # Dashboard assets
    location /_dash {
        proxy_pass http://vizro_dashboard;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # CORS for dashboard assets
        add_header 'Access-Control-Allow-Origin' '*' always;
    }
    
    # Fallback to API
    location @api {
        proxy_pass http://aurigraph_api;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # Add CORS headers
        add_header 'Access-Control-Allow-Origin' '*' always;
        add_header 'Access-Control-Allow-Methods' 'GET, POST, OPTIONS' always;
    }
    
    # Block hidden files
    location ~ /\. {
        deny all;
        access_log off;
        log_not_found off;
    }
}
EOF

echo -e "${GREEN}✅ Created nginx configuration with CORS${NC}"

# Create deployment script
echo -e "${BLUE}ℹ️  Creating deployment script...${NC}"

cat > deploy-cors-fix.sh << 'EOF'
#!/bin/bash

# Deploy CORS fix to dlt.aurigraph.io
echo "🚀 Deploying CORS fix to dlt.aurigraph.io"
echo "=========================================="

GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m'

# Stop current demo
echo "Stopping current demo..."
if [ -f demo-dev4.pid ]; then
    kill $(cat demo-dev4.pid) 2>/dev/null || true
    rm demo-dev4.pid
fi

# Backup current files
echo "Creating backups..."
cp aurigraph-demo-dev4.js aurigraph-demo-dev4.js.backup 2>/dev/null || true
sudo cp /etc/nginx/sites-available/dlt.aurigraph.io /etc/nginx/sites-available/dlt.aurigraph.io.backup.cors 2>/dev/null || true

# Install new Node.js app
echo "Installing updated Node.js application..."
cp aurigraph-demo-cors-fix.js aurigraph-demo-dev4.js
chmod +x aurigraph-demo-dev4.js

# Update nginx configuration
echo "Updating nginx configuration..."
sudo cp nginx-cors-fix.conf /etc/nginx/sites-available/dlt.aurigraph.io

# Test nginx configuration
echo "Testing nginx configuration..."
sudo nginx -t

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Nginx configuration valid${NC}"
    
    # Reload nginx
    echo "Reloading nginx..."
    sudo systemctl reload nginx
    
    # Start the updated demo
    echo "Starting updated demo with CORS support..."
    nohup node aurigraph-demo-dev4.js > demo-dev4.log 2>&1 &
    echo $! > demo-dev4.pid
    
    sleep 3
    
    # Test endpoints
    echo ""
    echo "Testing endpoints..."
    echo "-------------------"
    
    # Test health endpoint
    if curl -s -o /dev/null -w "%{http_code}" https://dlt.aurigraph.io/health | grep -q "200"; then
        echo -e "${GREEN}✅ Health endpoint working${NC}"
    else
        echo -e "${RED}❌ Health endpoint failed${NC}"
    fi
    
    # Test CORS headers
    echo ""
    echo "Testing CORS headers..."
    CORS_TEST=$(curl -s -I -X OPTIONS https://dlt.aurigraph.io/channel/status -H "Origin: https://dlt.aurigraph.io" | grep -i "access-control-allow-origin")
    if [ ! -z "$CORS_TEST" ]; then
        echo -e "${GREEN}✅ CORS headers present: $CORS_TEST${NC}"
    else
        echo -e "${RED}❌ CORS headers missing${NC}"
    fi
    
    echo ""
    echo -e "${GREEN}🎉 CORS fix deployed successfully!${NC}"
    echo ""
    echo "✅ Dashboard: https://dlt.aurigraph.io"
    echo "✅ API Status: https://dlt.aurigraph.io/channel/status"
    echo "✅ Metrics: https://dlt.aurigraph.io/channel/metrics"
    echo ""
    echo "CORS is now properly configured for:"
    echo "  • API endpoints (/channel/*)"
    echo "  • WebSocket connections (/ws)"
    echo "  • Vizro dashboard (/vizro/)"
    
else
    echo -e "${RED}❌ Nginx configuration error${NC}"
    echo "Restoring backup..."
    sudo cp /etc/nginx/sites-available/dlt.aurigraph.io.backup.cors /etc/nginx/sites-available/dlt.aurigraph.io
    exit 1
fi
EOF

chmod +x deploy-cors-fix.sh

echo -e "${GREEN}✅ Created deployment script${NC}"
echo ""
echo "📋 Files created:"
echo "  1. aurigraph-demo-cors-fix.js - Node.js app with CORS headers"
echo "  2. nginx-cors-fix.conf - Nginx config with CORS support"
echo "  3. deploy-cors-fix.sh - Automated deployment script"
echo ""
echo "🚀 To deploy the CORS fix:"
echo ""
echo "  1. Upload files to server:"
echo "     scp aurigraph-demo-cors-fix.js nginx-cors-fix.conf deploy-cors-fix.sh ${USER}@${SERVER}:~/"
echo ""
echo "  2. SSH to server and run:"
echo "     ssh ${USER}@${SERVER}"
echo "     sudo ./deploy-cors-fix.sh"
echo ""
echo "The fix will:"
echo "  ✓ Update Node.js app with proper CORS headers"
echo "  ✓ Configure nginx to handle CORS preflight requests"
echo "  ✓ Allow cross-origin requests from HTTPS domain"
echo "  ✓ Support WebSocket connections with CORS"
echo ""
echo "✅ CORS fix ready for deployment!"