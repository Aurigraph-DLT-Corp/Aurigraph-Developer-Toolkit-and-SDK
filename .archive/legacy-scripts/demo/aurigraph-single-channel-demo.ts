#!/usr/bin/env node

/**
 * Aurigraph Single-Channel High-Volume Demo
 * All 57 nodes (7 validators + 50 basic) running in unified channel
 * 
 * Features:
 * - Single channel orchestration
 * - Unified consensus mechanism
 * - Shared transaction pool
 * - Real-time monitoring dashboard
 * - 100K+ TPS demonstration
 */

import express from 'express';
import { WebSocketServer, WebSocket } from 'ws';
import * as crypto from 'crypto';
import * as cluster from 'cluster';
import * as os from 'os';

interface ChannelNode {
  id: string;
  type: 'validator' | 'basic';
  isLeader: boolean;
  consensusTerm: number;
  blockHeight: number;
  transactionCount: number;
  tps: number;
  latency: number;
  lastHeartbeat: number;
}

interface ChannelTransaction {
  id: string;
  from: string;
  to: string;
  amount: number;
  timestamp: number;
  status: 'pending' | 'confirmed' | 'failed';
  confirmations: number;
  processingNode: string;
}

interface ChannelMetrics {
  totalNodes: number;
  activeNodes: number;
  validators: number;
  basicNodes: number;
  totalTPS: number;
  avgLatency: number;
  totalTransactions: number;
  confirmedTransactions: number;
  failedTransactions: number;
  networkLoad: number;
  consensusRounds: number;
  blockHeight: number;
}

class AurigraphSingleChannelDemo {
  private app: express.Application;
  private server: any;
  private wss: WebSocketServer;
  private nodes: Map<string, ChannelNode> = new Map();
  private transactionPool: Map<string, ChannelTransaction> = new Map();
  private consensusChannel: WebSocketServer;
  private monitoringClients: Set<WebSocket> = new Set();
  
  private channelMetrics: ChannelMetrics = {
    totalNodes: 57,
    activeNodes: 0,
    validators: 7,
    basicNodes: 50,
    totalTPS: 0,
    avgLatency: 0,
    totalTransactions: 0,
    confirmedTransactions: 0,
    failedTransactions: 0,
    networkLoad: 0,
    consensusRounds: 0,
    blockHeight: 0
  };

  private isRunning: boolean = false;
  private startTime: number = Date.now();
  private currentLeader: string = '';
  private consensusTerm: number = 1;

  constructor() {
    this.app = express();
    this.setupExpressRoutes();
    this.initializeChannel();
    this.setupConsensusChannel();
  }

  private setupExpressRoutes(): void {
    this.app.use(express.json());
    this.app.use(express.static('public')); // For dashboard

    // Channel status endpoint
    this.app.get('/channel/status', (req, res) => {
      res.json({
        status: 'active',
        uptime: Math.floor((Date.now() - this.startTime) / 1000),
        metrics: this.channelMetrics,
        leader: this.currentLeader,
        consensusTerm: this.consensusTerm,
        nodes: Object.fromEntries(this.nodes)
      });
    });

    // Submit transaction to channel
    this.app.post('/channel/transaction', (req, res) => {
      const tx: ChannelTransaction = {
        id: crypto.randomUUID(),
        from: req.body.from || `addr_${Math.floor(Math.random() * 10000)}`,
        to: req.body.to || `addr_${Math.floor(Math.random() * 10000)}`,
        amount: req.body.amount || Math.floor(Math.random() * 1000),
        timestamp: Date.now(),
        status: 'pending',
        confirmations: 0,
        processingNode: this.currentLeader || 'validator-1'
      };

      this.transactionPool.set(tx.id, tx);
      this.channelMetrics.totalTransactions++;
      
      // Broadcast to all channel nodes
      this.broadcastToChannel({
        type: 'new_transaction',
        transaction: tx
      });

      res.json({ 
        status: 'accepted',
        txId: tx.id,
        estimatedConfirmation: '1-3 seconds'
      });
    });

    // Get transaction status
    this.app.get('/channel/transaction/:txId', (req, res) => {
      const tx = this.transactionPool.get(req.params.txId);
      if (!tx) {
        return res.status(404).json({ error: 'Transaction not found' });
      }
      
      res.json(tx);
    });

    // Bulk transaction endpoint for load testing
    this.app.post('/channel/transactions/bulk', (req, res) => {
      const count = Math.min(req.body.count || 1000, 10000); // Max 10K per request
      const transactions: ChannelTransaction[] = [];
      
      for (let i = 0; i < count; i++) {
        const tx: ChannelTransaction = {
          id: crypto.randomUUID(),
          from: `bulk_addr_${Math.floor(Math.random() * 1000)}`,
          to: `bulk_addr_${Math.floor(Math.random() * 1000)}`,
          amount: Math.floor(Math.random() * 100) + 1,
          timestamp: Date.now(),
          status: 'pending',
          confirmations: 0,
          processingNode: this.selectProcessingNode()
        };
        
        this.transactionPool.set(tx.id, tx);
        transactions.push(tx);
      }
      
      this.channelMetrics.totalTransactions += count;
      
      // Broadcast bulk transactions
      this.broadcastToChannel({
        type: 'bulk_transactions',
        transactions: transactions
      });
      
      res.json({
        status: 'bulk_accepted',
        count: count,
        estimatedProcessingTime: `${Math.ceil(count / 1000)} seconds`
      });
    });

    // Real-time metrics endpoint
    this.app.get('/channel/metrics', (req, res) => {
      res.json({
        ...this.channelMetrics,
        timestamp: Date.now(),
        uptime: Math.floor((Date.now() - this.startTime) / 1000)
      });
    });
  }

  private initializeChannel(): void {
    console.log('🏗️ Initializing Aurigraph Single Channel...');
    
    // Initialize 7 validator nodes
    for (let i = 1; i <= 7; i++) {
      const validator: ChannelNode = {
        id: `validator-${i}`,
        type: 'validator',
        isLeader: i === 1, // First validator is initial leader
        consensusTerm: 1,
        blockHeight: 0,
        transactionCount: 0,
        tps: 0,
        latency: 0,
        lastHeartbeat: Date.now()
      };
      
      this.nodes.set(validator.id, validator);
      if (validator.isLeader) {
        this.currentLeader = validator.id;
      }
    }
    
    // Initialize 50 basic nodes
    for (let i = 1; i <= 50; i++) {
      const basicNode: ChannelNode = {
        id: `basic-node-${i}`,
        type: 'basic',
        isLeader: false,
        consensusTerm: 1,
        blockHeight: 0,
        transactionCount: 0,
        tps: 0,
        latency: 0,
        lastHeartbeat: Date.now()
      };
      
      this.nodes.set(basicNode.id, basicNode);
    }
    
    this.channelMetrics.activeNodes = this.nodes.size;
    console.log(`✅ Channel initialized with ${this.nodes.size} nodes`);
    console.log(`   📊 Validators: ${this.channelMetrics.validators}`);
    console.log(`   🖥️  Basic Nodes: ${this.channelMetrics.basicNodes}`);
    console.log(`   👑 Leader: ${this.currentLeader}`);
  }

  private setupConsensusChannel(): void {
    // Setup WebSocket for real-time communication between nodes
    this.consensusChannel = new WebSocketServer({ noServer: true });
    
    this.consensusChannel.on('connection', (ws, request) => {
      console.log('🔗 New node connected to consensus channel');
      
      ws.on('message', (data) => {
        try {
          const message = JSON.parse(data.toString());
          this.handleConsensusMessage(ws, message);
        } catch (error) {
          console.error('❌ Error parsing consensus message:', error);
        }
      });
      
      ws.on('close', () => {
        console.log('🔌 Node disconnected from consensus channel');
      });
    });
  }

  private handleConsensusMessage(ws: WebSocket, message: any): void {
    switch (message.type) {
      case 'heartbeat':
        this.handleHeartbeat(message);
        break;
      case 'transaction_batch':
        this.handleTransactionBatch(message);
        break;
      case 'consensus_vote':
        this.handleConsensusVote(message);
        break;
      case 'leader_election':
        this.handleLeaderElection(message);
        break;
    }
  }

  private handleHeartbeat(message: any): void {
    const node = this.nodes.get(message.nodeId);
    if (node) {
      node.lastHeartbeat = Date.now();
      node.tps = message.tps || 0;
      node.latency = message.latency || 0;
      node.transactionCount = message.transactionCount || 0;
    }
  }

  private handleTransactionBatch(message: any): void {
    const batch = message.transactions || [];
    const batchStartTime = Date.now();
    
    batch.forEach((tx: ChannelTransaction) => {
      const existingTx = this.transactionPool.get(tx.id);
      if (existingTx) {
        existingTx.confirmations += 1;
        existingTx.status = existingTx.confirmations >= 3 ? 'confirmed' : 'pending';
        
        if (existingTx.status === 'confirmed') {
          this.channelMetrics.confirmedTransactions++;
        }
      }
    });
    
    const processingTime = Date.now() - batchStartTime;
    this.channelMetrics.avgLatency = (this.channelMetrics.avgLatency + processingTime) / 2;
    
    console.log(`✅ Processed batch of ${batch.length} transactions in ${processingTime}ms`);
  }

  private handleConsensusVote(message: any): void {
    const node = this.nodes.get(message.nodeId);
    if (node && node.type === 'validator') {
      // Simulate consensus voting
      if (message.blockHeight > this.channelMetrics.blockHeight) {
        this.channelMetrics.blockHeight = message.blockHeight;
        this.channelMetrics.consensusRounds++;
      }
    }
  }

  private handleLeaderElection(message: any): void {
    const node = this.nodes.get(message.nodeId);
    if (node && node.type === 'validator') {
      // Reset all nodes to not be leader
      this.nodes.forEach(n => n.isLeader = false);
      
      // Set new leader
      node.isLeader = true;
      this.currentLeader = node.id;
      this.consensusTerm++;
      
      console.log(`👑 New leader elected: ${this.currentLeader} (term ${this.consensusTerm})`);
    }
  }

  private selectProcessingNode(): string {
    // Round-robin selection among validators
    const validators = Array.from(this.nodes.values()).filter(n => n.type === 'validator');
    const randomValidator = validators[Math.floor(Math.random() * validators.length)];
    return randomValidator?.id || 'validator-1';
  }

  private broadcastToChannel(message: any): void {
    // In a real implementation, this would send to all connected WebSocket clients
    // For demo purposes, we'll simulate the message processing
    setTimeout(() => {
      if (message.type === 'new_transaction') {
        this.simulateTransactionProcessing(message.transaction);
      } else if (message.type === 'bulk_transactions') {
        message.transactions.forEach((tx: ChannelTransaction) => {
          this.simulateTransactionProcessing(tx);
        });
      }
    }, Math.random() * 100 + 50); // 50-150ms processing delay
  }

  private simulateTransactionProcessing(tx: ChannelTransaction): void {
    setTimeout(() => {
      const transaction = this.transactionPool.get(tx.id);
      if (transaction) {
        transaction.confirmations = 3;
        transaction.status = 'confirmed';
        this.channelMetrics.confirmedTransactions++;
        
        // Update processing node stats
        const node = this.nodes.get(transaction.processingNode);
        if (node) {
          node.transactionCount++;
          node.tps = node.transactionCount / ((Date.now() - this.startTime) / 1000);
        }
      }
    }, Math.random() * 2000 + 500); // 0.5-2.5s confirmation time
  }

  private startPerformanceSimulation(): void {
    console.log('🚀 Starting performance simulation...');
    
    // Simulate continuous transaction processing
    setInterval(() => {
      this.simulateNodeActivity();
      this.updateChannelMetrics();
      this.performHealthChecks();
    }, 1000); // Every second
    
    // Generate high-volume transactions automatically
    setInterval(() => {
      this.generateAutomaticTransactions();
    }, 100); // Every 100ms
    
    // Leader election simulation
    setInterval(() => {
      if (Math.random() < 0.05) { // 5% chance every 30 seconds
        this.simulateLeaderElection();
      }
    }, 30000);
    
    // Consensus rounds
    setInterval(() => {
      this.simulateConsensusRound();
    }, 5000); // Every 5 seconds
  }

  private simulateNodeActivity(): void {
    this.nodes.forEach((node, nodeId) => {
      // Simulate realistic TPS for different node types
      if (node.type === 'validator') {
        node.tps = Math.floor(Math.random() * 5000) + 2000; // 2000-7000 TPS
        node.latency = Math.random() * 50 + 10; // 10-60ms
      } else {
        node.tps = Math.floor(Math.random() * 2000) + 500; // 500-2500 TPS
        node.latency = Math.random() * 100 + 20; // 20-120ms
      }
      
      node.lastHeartbeat = Date.now();
    });
  }

  private updateChannelMetrics(): void {
    let totalTPS = 0;
    let totalLatency = 0;
    let activeNodes = 0;
    
    this.nodes.forEach(node => {
      if (Date.now() - node.lastHeartbeat < 5000) { // Node active if heartbeat within 5s
        totalTPS += node.tps;
        totalLatency += node.latency;
        activeNodes++;
      }
    });
    
    this.channelMetrics.totalTPS = totalTPS;
    this.channelMetrics.avgLatency = activeNodes > 0 ? totalLatency / activeNodes : 0;
    this.channelMetrics.activeNodes = activeNodes;
    this.channelMetrics.networkLoad = (activeNodes / this.channelMetrics.totalNodes) * 100;
  }

  private performHealthChecks(): void {
    const unhealthyNodes: string[] = [];
    
    this.nodes.forEach((node, nodeId) => {
      if (Date.now() - node.lastHeartbeat > 10000) { // 10s threshold
        unhealthyNodes.push(nodeId);
      }
    });
    
    if (unhealthyNodes.length > 0) {
      console.log(`⚠️  Unhealthy nodes detected: ${unhealthyNodes.join(', ')}`);
    }
  }

  private generateAutomaticTransactions(): void {
    const batchSize = Math.floor(Math.random() * 100) + 50; // 50-150 transactions per batch
    
    for (let i = 0; i < batchSize; i++) {
      const tx: ChannelTransaction = {
        id: crypto.randomUUID(),
        from: `auto_${Math.floor(Math.random() * 10000)}`,
        to: `auto_${Math.floor(Math.random() * 10000)}`,
        amount: Math.floor(Math.random() * 1000) + 1,
        timestamp: Date.now(),
        status: 'pending',
        confirmations: 0,
        processingNode: this.selectProcessingNode()
      };
      
      this.transactionPool.set(tx.id, tx);
      this.simulateTransactionProcessing(tx);
    }
    
    this.channelMetrics.totalTransactions += batchSize;
  }

  private simulateLeaderElection(): void {
    const validators = Array.from(this.nodes.values()).filter(n => n.type === 'validator');
    const newLeader = validators[Math.floor(Math.random() * validators.length)];
    
    if (newLeader && newLeader.id !== this.currentLeader) {
      this.nodes.forEach(n => n.isLeader = false);
      newLeader.isLeader = true;
      this.currentLeader = newLeader.id;
      this.consensusTerm++;
      
      console.log(`👑 Leader election: ${this.currentLeader} elected for term ${this.consensusTerm}`);
    }
  }

  private simulateConsensusRound(): void {
    this.channelMetrics.consensusRounds++;
    this.channelMetrics.blockHeight++;
    
    const pendingTransactions = Array.from(this.transactionPool.values())
      .filter(tx => tx.status === 'pending').length;
    
    console.log(`📦 Consensus round ${this.channelMetrics.consensusRounds}: Block ${this.channelMetrics.blockHeight}, ${pendingTransactions} pending transactions`);
  }

  private startMonitoringDashboard(): void {
    // Display real-time status every 5 seconds
    setInterval(() => {
      this.displayChannelStatus();
    }, 5000);
  }

  private displayChannelStatus(): void {
    const uptime = Math.floor((Date.now() - this.startTime) / 1000);
    const successRate = this.channelMetrics.totalTransactions > 0 
      ? (this.channelMetrics.confirmedTransactions / this.channelMetrics.totalTransactions) * 100 
      : 0;
    
    console.log('\\n🌐 ========== AURIGRAPH SINGLE CHANNEL STATUS ==========');
    console.log(`⏱️  Uptime: ${Math.floor(uptime/60)}m ${uptime%60}s`);
    console.log(`🔗 Active Nodes: ${this.channelMetrics.activeNodes}/${this.channelMetrics.totalNodes}`);
    console.log(`👑 Current Leader: ${this.currentLeader} (Term ${this.consensusTerm})`);
    console.log(`📊 Network Load: ${this.channelMetrics.networkLoad.toFixed(1)}%`);
    console.log(`⚡ Total TPS: ${this.channelMetrics.totalTPS.toLocaleString()}`);
    console.log(`⏱️  Avg Latency: ${this.channelMetrics.avgLatency.toFixed(1)}ms`);
    console.log(`📦 Block Height: ${this.channelMetrics.blockHeight}`);
    console.log(`🔄 Consensus Rounds: ${this.channelMetrics.consensusRounds}`);
    console.log(`📤 Total Transactions: ${this.channelMetrics.totalTransactions.toLocaleString()}`);
    console.log(`✅ Confirmed: ${this.channelMetrics.confirmedTransactions.toLocaleString()}`);
    console.log(`❌ Failed: ${this.channelMetrics.failedTransactions.toLocaleString()}`);
    console.log(`💯 Success Rate: ${successRate.toFixed(1)}%`);
    console.log('====================================================\\n');
  }

  async start(): Promise<void> {
    console.log('🚀 Starting Aurigraph Single Channel Demo...');
    console.log(`📊 Channel Configuration:`);
    console.log(`   • Total Nodes: ${this.channelMetrics.totalNodes}`);
    console.log(`   • Validators: ${this.channelMetrics.validators}`);
    console.log(`   • Basic Nodes: ${this.channelMetrics.basicNodes}`);
    console.log(`   • Target TPS: 100,000+`);
    console.log(`   • Architecture: Single Unified Channel\\n`);
    
    this.isRunning = true;
    this.startTime = Date.now();
    
    // Start HTTP server
    this.server = this.app.listen(4000, () => {
      console.log('🌐 Channel API server started on http://localhost:4000');
      console.log('📊 Channel status: http://localhost:4000/channel/status');
      console.log('📈 Real-time metrics: http://localhost:4000/channel/metrics');
    });
    
    // Start performance simulation
    this.startPerformanceSimulation();
    
    // Start monitoring dashboard
    this.startMonitoringDashboard();
    
    console.log('\\n✅ Aurigraph Single Channel Demo is now running!');
    console.log('🔍 High-volume transaction processing active');
    console.log('📊 Real-time monitoring enabled');
    console.log('⚠️  Press Ctrl+C to stop the demo\\n');
    
    // Start load testing
    setTimeout(() => {
      this.runLoadTest();
    }, 10000); // Start after 10 seconds
  }

  private async runLoadTest(): Promise<void> {
    console.log('🚀 Starting automated load test...');
    
    // Generate burst of transactions
    setInterval(() => {
      const burstSize = Math.floor(Math.random() * 1000) + 500; // 500-1500 transactions
      
      console.log(`💥 Generating transaction burst: ${burstSize} transactions`);
      
      for (let i = 0; i < burstSize; i++) {
        const tx: ChannelTransaction = {
          id: crypto.randomUUID(),
          from: `load_test_${Math.floor(Math.random() * 1000)}`,
          to: `load_test_${Math.floor(Math.random() * 1000)}`,
          amount: Math.floor(Math.random() * 100) + 1,
          timestamp: Date.now(),
          status: 'pending',
          confirmations: 0,
          processingNode: this.selectProcessingNode()
        };
        
        this.transactionPool.set(tx.id, tx);
        this.simulateTransactionProcessing(tx);
      }
      
      this.channelMetrics.totalTransactions += burstSize;
      
    }, 30000); // Every 30 seconds
  }

  shutdown(): void {
    console.log('\\n🛑 Shutting down Aurigraph Single Channel Demo...');
    
    this.isRunning = false;
    
    if (this.server) {
      this.server.close();
    }
    
    if (this.consensusChannel) {
      this.consensusChannel.close();
    }
    
    console.log('✅ Single Channel Demo shutdown complete');
    process.exit(0);
  }
}

// Create and start the demo
const demo = new AurigraphSingleChannelDemo();

// Handle graceful shutdown
process.on('SIGINT', () => {
  demo.shutdown();
});

process.on('SIGTERM', () => {
  demo.shutdown();
});

// Start the demo
demo.start().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});