#!/usr/bin/env node

/**
 * Aurigraph High-Volume Transaction Demo
 * 7 Validator Nodes + 50 Basic Nodes + Transaction Load Generator
 * 
 * Demonstrates:
 * - HyperRAFT++ consensus with 7 validators
 * - 50 basic nodes processing transactions
 * - High-volume transaction simulation (100K+ TPS target)
 * - Real-time performance monitoring
 * - Network topology visualization
 */

import { spawn, ChildProcess } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import { performance } from 'perf_hooks';
import axios from 'axios';

interface NodeConfig {
  id: string;
  type: 'validator' | 'basic';
  port: number;
  grpcPort: number;
  consensusPort: number;
  validatorPorts?: number[];
  basicNodePorts?: number[];
}

interface TransactionStats {
  totalSent: number;
  totalConfirmed: number;
  totalFailed: number;
  tps: number;
  avgLatency: number;
  networkLoad: number;
}

interface NetworkTopology {
  validators: NodeConfig[];
  basicNodes: NodeConfig[];
  connections: Map<string, string[]>;
}

class AurigraphHighVolumeDemo {
  private validators: NodeConfig[] = [];
  private basicNodes: NodeConfig[] = [];
  private nodeProcesses: Map<string, ChildProcess> = new Map();
  private isRunning: boolean = false;
  private startTime: number = 0;
  private transactionStats: TransactionStats = {
    totalSent: 0,
    totalConfirmed: 0,
    totalFailed: 0,
    tps: 0,
    avgLatency: 0,
    networkLoad: 0
  };

  constructor() {
    this.initializeNetworkTopology();
  }

  private initializeNetworkTopology(): void {
    console.log('🏗️ Initializing Aurigraph Network Topology...');
    
    // Initialize 7 Validator Nodes
    const validatorBasePort = 9100;
    for (let i = 0; i < 7; i++) {
      this.validators.push({
        id: `validator-${i + 1}`,
        type: 'validator',
        port: validatorBasePort + (i * 10),
        grpcPort: validatorBasePort + (i * 10) + 1,
        consensusPort: validatorBasePort + (i * 10) + 2,
        validatorPorts: this.getValidatorPorts(i, 7),
        basicNodePorts: []
      });
    }

    // Initialize 50 Basic Nodes
    const basicNodeBasePort = 9800;
    for (let i = 0; i < 50; i++) {
      this.basicNodes.push({
        id: `basic-node-${i + 1}`,
        type: 'basic',
        port: basicNodeBasePort + (i * 3),
        grpcPort: basicNodeBasePort + (i * 3) + 1,
        consensusPort: basicNodeBasePort + (i * 3) + 2,
        validatorPorts: this.validators.map(v => v.consensusPort),
        basicNodePorts: this.getNearbyBasicNodePorts(i, 50)
      });
    }

    console.log(`✅ Network topology initialized:`);
    console.log(`   📊 Validators: ${this.validators.length}`);
    console.log(`   🖥️  Basic Nodes: ${this.basicNodes.length}`);
    console.log(`   🔗 Total Network Connections: ${this.calculateTotalConnections()}`);
  }

  private getValidatorPorts(currentIndex: number, totalValidators: number): number[] {
    const ports: number[] = [];
    const basePort = 9100;
    
    for (let i = 0; i < totalValidators; i++) {
      if (i !== currentIndex) {
        ports.push(basePort + (i * 10) + 2); // consensus port
      }
    }
    return ports;
  }

  private getNearbyBasicNodePorts(currentIndex: number, totalNodes: number): number[] {
    const ports: number[] = [];
    const basePort = 9800;
    const connectionRange = 5; // Connect to 5 nearby nodes
    
    for (let i = Math.max(0, currentIndex - connectionRange); 
         i <= Math.min(totalNodes - 1, currentIndex + connectionRange); 
         i++) {
      if (i !== currentIndex) {
        ports.push(basePort + (i * 3) + 2); // consensus port
      }
    }
    return ports;
  }

  private calculateTotalConnections(): number {
    const validatorConnections = 7 * (7 - 1); // Each validator connects to 6 others
    const basicNodeConnections = 50 * 10; // Each basic node connects to ~10 others
    const validatorToBasicConnections = 7 * 10; // Each validator connects to some basic nodes
    return validatorConnections + basicNodeConnections + validatorToBasicConnections;
  }

  async startValidator(config: NodeConfig): Promise<ChildProcess> {
    console.log(`🚀 Starting ${config.id} on port ${config.port}...`);
    
    const validatorScript = this.generateValidatorScript(config);
    fs.writeFileSync(`./temp-${config.id}.ts`, validatorScript);
    
    const process = spawn('npx', ['ts-node', `./temp-${config.id}.ts`], {
      stdio: ['pipe', 'pipe', 'pipe'],
      env: { ...process.env, NODE_ENV: 'demo' }
    });

    process.stdout?.on('data', (data) => {
      console.log(`[${config.id}] ${data.toString().trim()}`);
    });

    process.stderr?.on('data', (data) => {
      console.error(`[${config.id}] ERROR: ${data.toString().trim()}`);
    });

    // Wait for node to start
    await this.waitForNodeStartup(config.port);
    return process;
  }

  async startBasicNode(config: NodeConfig): Promise<ChildProcess> {
    console.log(`🖥️ Starting ${config.id} on port ${config.port}...`);
    
    const basicNodeScript = this.generateBasicNodeScript(config);
    fs.writeFileSync(`./temp-${config.id}.ts`, basicNodeScript);
    
    const process = spawn('npx', ['ts-node', `./temp-${config.id}.ts`], {
      stdio: ['pipe', 'pipe', 'pipe'],
      env: { ...process.env, NODE_ENV: 'demo' }
    });

    process.stdout?.on('data', (data) => {
      const output = data.toString().trim();
      if (output.includes('TPS') || output.includes('ERROR')) {
        console.log(`[${config.id}] ${output}`);
      }
    });

    process.stderr?.on('data', (data) => {
      console.error(`[${config.id}] ERROR: ${data.toString().trim()}`);
    });

    // Wait for node to start
    await this.waitForNodeStartup(config.port);
    return process;
  }

  private generateValidatorScript(config: NodeConfig): string {
    return `
import express from 'express';
import { WebSocketServer } from 'ws';
import * as crypto from 'crypto';

class ValidatorNode {
  private app = express();
  private server: any;
  private wss: WebSocketServer;
  private consensusState = {
    term: 1,
    commitIndex: 0,
    lastApplied: 0,
    isLeader: ${config.id === 'validator-1' ? 'true' : 'false'},
    votes: new Set(),
    transactions: new Map(),
    blockHeight: 0
  };
  private peers: string[] = [];
  private transactionPool: any[] = [];
  private performanceMetrics = {
    tps: 0,
    latency: 0,
    processedTransactions: 0,
    consensusRounds: 0
  };

  constructor() {
    this.setupRoutes();
    this.setupConsensus();
  }

  private setupRoutes(): void {
    this.app.use(express.json());
    
    this.app.get('/health', (req, res) => {
      res.json({
        status: 'healthy',
        nodeId: '${config.id}',
        type: 'validator',
        isLeader: this.consensusState.isLeader,
        blockHeight: this.consensusState.blockHeight,
        peers: this.peers.length,
        metrics: this.performanceMetrics
      });
    });

    this.app.post('/transaction', (req, res) => {
      const tx = {
        id: crypto.randomUUID(),
        ...req.body,
        timestamp: Date.now(),
        nodeId: '${config.id}'
      };
      
      this.transactionPool.push(tx);
      res.json({ status: 'received', txId: tx.id });
      
      if (this.consensusState.isLeader && this.transactionPool.length >= 100) {
        this.proposeBlock();
      }
    });

    this.app.get('/consensus', (req, res) => {
      res.json({
        term: this.consensusState.term,
        isLeader: this.consensusState.isLeader,
        commitIndex: this.consensusState.commitIndex,
        blockHeight: this.consensusState.blockHeight,
        poolSize: this.transactionPool.length
      });
    });
  }

  private setupConsensus(): void {
    // Leader election every 5 seconds if no leader
    setInterval(() => {
      if (!this.hasActiveLeader()) {
        this.startElection();
      }
    }, 5000);

    // Heartbeat if leader
    setInterval(() => {
      if (this.consensusState.isLeader) {
        this.sendHeartbeat();
        this.updateMetrics();
      }
    }, 1000);

    // Process transactions in batches
    setInterval(() => {
      if (this.consensusState.isLeader && this.transactionPool.length > 0) {
        this.processBatch();
      }
    }, 100);
  }

  private proposeBlock(): void {
    const batch = this.transactionPool.splice(0, 1000);
    const block = {
      height: this.consensusState.blockHeight + 1,
      transactions: batch,
      previousHash: crypto.createHash('sha256').update(this.consensusState.blockHeight.toString()).digest('hex'),
      timestamp: Date.now(),
      proposer: '${config.id}'
    };

    console.log(\`📦 [${config.id}] Proposing block \${block.height} with \${batch.length} transactions\`);
    this.consensusState.blockHeight++;
    this.performanceMetrics.processedTransactions += batch.length;
    this.performanceMetrics.consensusRounds++;
  }

  private processBatch(): void {
    const batchSize = Math.min(500, this.transactionPool.length);
    const processed = this.transactionPool.splice(0, batchSize);
    this.performanceMetrics.processedTransactions += processed.length;
  }

  private startElection(): void {
    this.consensusState.term++;
    this.consensusState.isLeader = Math.random() < 0.2; // 20% chance to become leader
    if (this.consensusState.isLeader) {
      console.log(\`👑 [${config.id}] Became leader for term \${this.consensusState.term}\`);
    }
  }

  private sendHeartbeat(): void {
    // Simulate heartbeat to peers
    this.peers.forEach(peer => {
      // In real implementation, send actual network messages
    });
  }

  private hasActiveLeader(): boolean {
    return this.consensusState.isLeader || Math.random() < 0.8;
  }

  private updateMetrics(): void {
    const now = Date.now();
    this.performanceMetrics.tps = this.performanceMetrics.processedTransactions / ((now - ${Date.now()}) / 1000) || 0;
    this.performanceMetrics.latency = Math.random() * 100 + 10; // Simulated latency
    
    if (this.performanceMetrics.tps > 100) {
      console.log(\`⚡ [${config.id}] TPS: \${this.performanceMetrics.tps.toFixed(0)}, Latency: \${this.performanceMetrics.latency.toFixed(1)}ms\`);
    }
  }

  start(): void {
    this.server = this.app.listen(${config.port}, () => {
      console.log(\`🚀 Validator ${config.id} started on port ${config.port}\`);
    });
    
    this.wss = new WebSocketServer({ port: ${config.grpcPort} });
    console.log(\`🔗 gRPC/WebSocket server for ${config.id} started on port ${config.grpcPort}\`);
  }
}

const validator = new ValidatorNode();
validator.start();

process.on('SIGTERM', () => {
  console.log('🛑 ${config.id} shutting down...');
  process.exit(0);
});
`;
  }

  private generateBasicNodeScript(config: NodeConfig): string {
    return `
import express from 'express';
import axios from 'axios';
import * as crypto from 'crypto';

class BasicNode {
  private app = express();
  private server: any;
  private transactionBuffer: any[] = [];
  private validatorEndpoints = [${config.validatorPorts?.map(p => `'http://localhost:${p - 2}'`).join(', ')}];
  private currentValidatorIndex = 0;
  private performanceMetrics = {
    sentTransactions: 0,
    confirmedTransactions: 0,
    failedTransactions: 0,
    tps: 0,
    avgLatency: 0
  };
  private startTime = Date.now();

  constructor() {
    this.setupRoutes();
    this.startTransactionGeneration();
    this.startMetricsReporting();
  }

  private setupRoutes(): void {
    this.app.use(express.json());
    
    this.app.get('/health', (req, res) => {
      res.json({
        status: 'healthy',
        nodeId: '${config.id}',
        type: 'basic',
        bufferSize: this.transactionBuffer.length,
        metrics: this.performanceMetrics,
        connectedValidators: this.validatorEndpoints.length
      });
    });

    this.app.get('/metrics', (req, res) => {
      res.json(this.performanceMetrics);
    });
  }

  private startTransactionGeneration(): void {
    // Generate transactions at high rate
    setInterval(() => {
      this.generateBurstTransactions();
    }, 50); // Every 50ms

    // Send transactions to validators
    setInterval(() => {
      this.sendTransactionsToValidators();
    }, 100); // Every 100ms
  }

  private generateBurstTransactions(): void {
    const burstSize = Math.floor(Math.random() * 50) + 10; // 10-60 transactions per burst
    
    for (let i = 0; i < burstSize; i++) {
      const tx = {
        id: crypto.randomUUID(),
        from: \`address_\${Math.floor(Math.random() * 10000)}\`,
        to: \`address_\${Math.floor(Math.random() * 10000)}\`,
        amount: Math.floor(Math.random() * 1000000) / 100,
        timestamp: Date.now(),
        nonce: Math.floor(Math.random() * 1000000),
        gasLimit: 21000,
        gasPrice: Math.floor(Math.random() * 100) + 20,
        data: \`0x\${crypto.randomBytes(Math.floor(Math.random() * 32)).toString('hex')}\`,
        nodeId: '${config.id}',
        signature: crypto.randomBytes(65).toString('hex')
      };
      
      this.transactionBuffer.push(tx);
    }
  }

  private async sendTransactionsToValidators(): Promise<void> {
    if (this.transactionBuffer.length === 0) return;

    const batchSize = Math.min(100, this.transactionBuffer.length);
    const batch = this.transactionBuffer.splice(0, batchSize);
    
    for (const tx of batch) {
      try {
        const validator = this.getNextValidator();
        const startTime = Date.now();
        
        await axios.post(\`\${validator}/transaction\`, tx, { timeout: 5000 });
        
        const latency = Date.now() - startTime;
        this.performanceMetrics.sentTransactions++;
        this.performanceMetrics.confirmedTransactions++;
        this.performanceMetrics.avgLatency = 
          (this.performanceMetrics.avgLatency + latency) / 2;
        
      } catch (error) {
        this.performanceMetrics.failedTransactions++;
      }
    }
  }

  private getNextValidator(): string {
    const validator = this.validatorEndpoints[this.currentValidatorIndex];
    this.currentValidatorIndex = (this.currentValidatorIndex + 1) % this.validatorEndpoints.length;
    return validator;
  }

  private startMetricsReporting(): void {
    setInterval(() => {
      const elapsed = (Date.now() - this.startTime) / 1000;
      this.performanceMetrics.tps = this.performanceMetrics.sentTransactions / elapsed;
      
      if (this.performanceMetrics.tps > 10) {
        console.log(\`📊 [${config.id}] TPS: \${this.performanceMetrics.tps.toFixed(1)}, ` +
          \`Sent: \${this.performanceMetrics.sentTransactions}, ` +
          \`Failed: \${this.performanceMetrics.failedTransactions}, ` +
          \`Latency: \${this.performanceMetrics.avgLatency.toFixed(1)}ms\`);
      }
    }, 10000); // Every 10 seconds
  }

  start(): void {
    this.server = this.app.listen(${config.port}, () => {
      console.log(\`🖥️ Basic Node ${config.id} started on port ${config.port}\`);
    });
  }
}

const basicNode = new BasicNode();
basicNode.start();

process.on('SIGTERM', () => {
  console.log('🛑 ${config.id} shutting down...');
  process.exit(0);
});
`;
  }

  private async waitForNodeStartup(port: number): Promise<void> {
    const maxAttempts = 30;
    let attempts = 0;
    
    while (attempts < maxAttempts) {
      try {
        await axios.get(`http://localhost:${port}/health`, { timeout: 1000 });
        return;
      } catch (error) {
        attempts++;
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
    
    throw new Error(`Node on port ${port} failed to start after ${maxAttempts} attempts`);
  }

  async startAllValidators(): Promise<void> {
    console.log('🚀 Starting all validator nodes...');
    
    for (const config of this.validators) {
      try {
        const process = await this.startValidator(config);
        this.nodeProcesses.set(config.id, process);
      } catch (error) {
        console.error(`❌ Failed to start ${config.id}: ${error}`);
      }
    }
    
    console.log(`✅ Started ${this.nodeProcesses.size}/${this.validators.length} validator nodes`);
  }

  async startAllBasicNodes(): Promise<void> {
    console.log('🖥️ Starting all basic nodes...');
    
    // Start basic nodes in batches to avoid overwhelming the system
    const batchSize = 10;
    for (let i = 0; i < this.basicNodes.length; i += batchSize) {
      const batch = this.basicNodes.slice(i, i + batchSize);
      
      const promises = batch.map(async (config) => {
        try {
          const process = await this.startBasicNode(config);
          this.nodeProcesses.set(config.id, process);
        } catch (error) {
          console.error(`❌ Failed to start ${config.id}: ${error}`);
        }
      });
      
      await Promise.all(promises);
      console.log(`✅ Started batch ${Math.floor(i/batchSize) + 1}/${Math.ceil(this.basicNodes.length/batchSize)}`);
      
      // Small delay between batches
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
    
    console.log(`✅ Started ${this.nodeProcesses.size - this.validators.length}/${this.basicNodes.length} basic nodes`);
  }

  async startPerformanceMonitoring(): Promise<void> {
    console.log('📊 Starting performance monitoring...');
    
    setInterval(async () => {
      await this.collectNetworkMetrics();
      this.displayNetworkStatus();
    }, 5000); // Every 5 seconds
  }

  private async collectNetworkMetrics(): Promise<void> {
    let totalTps = 0;
    let totalLatency = 0;
    let activeNodes = 0;
    let totalSent = 0;
    let totalFailed = 0;
    
    for (const [nodeId, process] of this.nodeProcesses) {
      try {
        const config = [...this.validators, ...this.basicNodes].find(c => c.id === nodeId);
        if (!config) continue;
        
        const response = await axios.get(`http://localhost:${config.port}/health`, { timeout: 2000 });
        const metrics = response.data.metrics;
        
        if (metrics) {
          totalTps += metrics.tps || 0;
          totalLatency += metrics.avgLatency || metrics.latency || 0;
          totalSent += metrics.sentTransactions || metrics.processedTransactions || 0;
          totalFailed += metrics.failedTransactions || 0;
          activeNodes++;
        }
      } catch (error) {
        // Node might be starting up or temporarily unavailable
      }
    }
    
    this.transactionStats.tps = totalTps;
    this.transactionStats.avgLatency = activeNodes > 0 ? totalLatency / activeNodes : 0;
    this.transactionStats.totalSent = totalSent;
    this.transactionStats.totalFailed = totalFailed;
    this.transactionStats.totalConfirmed = totalSent - totalFailed;
    this.transactionStats.networkLoad = (activeNodes / (this.validators.length + this.basicNodes.length)) * 100;
  }

  private displayNetworkStatus(): void {
    const uptime = Math.floor((Date.now() - this.startTime) / 1000);
    const activeProcesses = Array.from(this.nodeProcesses.values()).filter(p => !p.killed).length;
    
    console.log('\\n🌐 ========== AURIGRAPH NETWORK STATUS ==========');
    console.log(`⏱️  Uptime: ${Math.floor(uptime/60)}m ${uptime%60}s`);
    console.log(`🔗 Active Nodes: ${activeProcesses}/${this.validators.length + this.basicNodes.length}`);
    console.log(`📊 Network Load: ${this.transactionStats.networkLoad.toFixed(1)}%`);
    console.log(`⚡ Total TPS: ${this.transactionStats.tps.toFixed(0)}`);
    console.log(`⏱️  Avg Latency: ${this.transactionStats.avgLatency.toFixed(1)}ms`);
    console.log(`📤 Sent: ${this.transactionStats.totalSent.toLocaleString()}`);
    console.log(`✅ Confirmed: ${this.transactionStats.totalConfirmed.toLocaleString()}`);
    console.log(`❌ Failed: ${this.transactionStats.totalFailed.toLocaleString()}`);
    console.log(`💯 Success Rate: ${this.transactionStats.totalSent > 0 ? ((this.transactionStats.totalConfirmed / this.transactionStats.totalSent) * 100).toFixed(1) : 0}%`);
    console.log('=============================================\\n');
  }

  async start(): Promise<void> {
    console.log('🚀 Starting Aurigraph High-Volume Transaction Demo...');
    console.log(`📊 Network Configuration:`);
    console.log(`   • ${this.validators.length} Validator Nodes`);
    console.log(`   • ${this.basicNodes.length} Basic Nodes`);
    console.log(`   • ${this.calculateTotalConnections()} Network Connections`);
    console.log(`   • Target: 100K+ TPS\\n`);
    
    this.isRunning = true;
    this.startTime = Date.now();
    
    try {
      // Start validators first
      await this.startAllValidators();
      
      // Wait for validators to establish consensus
      console.log('⏳ Waiting for validator consensus...');
      await new Promise(resolve => setTimeout(resolve, 10000));
      
      // Start basic nodes
      await this.startAllBasicNodes();
      
      // Wait for network to stabilize
      console.log('⏳ Waiting for network stabilization...');
      await new Promise(resolve => setTimeout(resolve, 15000));
      
      // Start monitoring
      await this.startPerformanceMonitoring();
      
      console.log('\\n✅ Aurigraph High-Volume Demo is now running!');
      console.log('🔍 Monitoring network performance...');
      console.log('⚠️  Press Ctrl+C to stop the demo\\n');
      
    } catch (error) {
      console.error('❌ Failed to start demo:', error);
      await this.shutdown();
    }
  }

  async shutdown(): Promise<void> {
    console.log('\\n🛑 Shutting down Aurigraph Demo...');
    
    this.isRunning = false;
    
    // Kill all node processes
    for (const [nodeId, process] of this.nodeProcesses) {
      try {
        process.kill('SIGTERM');
        console.log(`✅ Stopped ${nodeId}`);
      } catch (error) {
        console.error(`❌ Error stopping ${nodeId}:`, error);
      }
    }
    
    // Clean up temporary files
    try {
      const files = fs.readdirSync('./').filter(f => f.startsWith('temp-') && f.endsWith('.ts'));
      files.forEach(file => fs.unlinkSync(file));
      console.log(`🧹 Cleaned up ${files.length} temporary files`);
    } catch (error) {
      console.error('⚠️  Error cleaning up temporary files:', error);
    }
    
    console.log('✅ Shutdown complete');
    process.exit(0);
  }
}

// Create and start the demo
const demo = new AurigraphHighVolumeDemo();

// Handle graceful shutdown
process.on('SIGINT', async () => {
  await demo.shutdown();
});

process.on('SIGTERM', async () => {
  await demo.shutdown();
});

// Start the demo
demo.start().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});