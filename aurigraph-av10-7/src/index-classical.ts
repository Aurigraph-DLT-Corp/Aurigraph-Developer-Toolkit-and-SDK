/**
 * Aurigraph V10 - Classical CPU/GPU Version
 * Main entry point for high-performance blockchain platform without quantum computing
 */

import { AV10_35_ClassicalAIOrchestrator } from './orchestration/AV10-35-ClassicalAIOrchestrator';
import { QuantumCryptoManagerV2 } from './crypto/QuantumCryptoManagerV2';
import { HyperRAFTPlusPlusV2 } from './consensus/HyperRAFTPlusPlusV2';
import { Logger } from './core/Logger';
import express from 'express';
import * as dotenv from 'dotenv';
import * as os from 'os';

// Load environment configuration
dotenv.config();

const logger = new Logger('AurigraphClassical');
const app = express();
app.use(express.json());

// Global classical orchestrator instance
let classicalOrchestrator: AV10_35_ClassicalAIOrchestrator;
let cryptoManager: QuantumCryptoManagerV2;
let consensus: HyperRAFTPlusPlusV2;

/**
 * Check GPU availability
 */
function checkGPUAvailability(): { available: boolean; count: number; type: string } {
  try {
    // Check for NVIDIA GPUs
    const exec = require('child_process').execSync;
    const result = exec('nvidia-smi --query-gpu=name --format=csv,noheader', { encoding: 'utf8' });
    const gpus = result.trim().split('\n').filter((line: string) => line.length > 0);
    
    if (gpus.length > 0) {
      return {
        available: true,
        count: gpus.length,
        type: gpus[0]
      };
    }
  } catch (error) {
    // nvidia-smi not available, check for other GPUs
  }

  return {
    available: false,
    count: 0,
    type: 'CPU only'
  };
}

/**
 * Initialize Classical Platform
 */
async function initializeClassicalPlatform(): Promise<void> {
  logger.info('🚀 Initializing Aurigraph V10 Classical Platform...');
  
  try {
    // Check hardware capabilities
    const cpuCores = os.cpus().length;
    const totalMemory = os.totalmem() / (1024 * 1024 * 1024); // GB
    const gpuInfo = checkGPUAvailability();
    
    logger.info(`💻 Hardware detected:`);
    logger.info(`  CPU: ${cpuCores} cores`);
    logger.info(`  RAM: ${totalMemory.toFixed(2)} GB`);
    logger.info(`  GPU: ${gpuInfo.available ? `${gpuInfo.count}x ${gpuInfo.type}` : 'Not available'}`);

    // Initialize post-quantum cryptography (classical-safe)
    logger.info('Initializing post-quantum cryptography...');
    cryptoManager = new QuantumCryptoManagerV2();
    await cryptoManager.initialize();

    // Initialize consensus
    logger.info('Initializing HyperRAFT++ consensus...');
    const consensusConfig = {
      nodeId: process.env.NODE_ID || 'classical-node-1',
      nodes: [],
      electionTimeout: 150,
      heartbeatInterval: 50
    };
    
    // Initialize classical AI orchestrator
    logger.info('Initializing classical AI orchestrator...');
    classicalOrchestrator = new AV10_35_ClassicalAIOrchestrator({
      maxAgents: 100,
      gpuCount: gpuInfo.count || 0,
      cpuCores: cpuCores,
      optimizationThreshold: 0.90,
      consensusRequired: 0.60,
      emergencyResponseTime: 10000
    });

    await classicalOrchestrator.initialize();

    logger.info('✅ Classical platform initialized successfully');
    logger.info(`📊 Resources: ${cpuCores} CPU cores, ${gpuInfo.count} GPUs`);
    
  } catch (error) {
    logger.error('Failed to initialize classical platform:', error);
    throw error;
  }
}

/**
 * API Routes - Classical Version
 */

// Health check
app.get('/health', (req, res) => {
  const gpuInfo = checkGPUAvailability();
  res.json({
    status: 'healthy',
    version: '10.35.0-classical',
    type: 'classical',
    hardware: {
      cpuCores: os.cpus().length,
      memory: `${(os.totalmem() / (1024 * 1024 * 1024)).toFixed(2)} GB`,
      gpu: gpuInfo
    }
  });
});

// Get classical metrics
app.get('/api/classical/metrics', async (req, res) => {
  try {
    const metrics = classicalOrchestrator.getMetrics();
    const gpuInfo = checkGPUAvailability();
    
    res.json({
      success: true,
      metrics,
      hardware: {
        cpuCores: os.cpus().length,
        gpuCount: gpuInfo.count,
        gpuType: gpuInfo.type,
        tensorflowBackend: metrics.tensorflowBackend
      }
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Execute GPU task
app.post('/api/classical/gpu/execute', async (req, res) => {
  try {
    const { task } = req.body;
    
    if (!task) {
      return res.status(400).json({ success: false, error: 'Task required' });
    }

    task.gpuRequired = true;
    const result = await classicalOrchestrator.executeGPUTask(task);
    
    res.json({
      success: true,
      result,
      hardware: {
        backend: 'GPU',
        speedup: result.gpuSpeedup || 'N/A'
      }
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Classical consensus
app.post('/api/classical/consensus', async (req, res) => {
  try {
    const { decision, participants } = req.body;
    
    if (!decision || !participants) {
      return res.status(400).json({ 
        success: false, 
        error: 'Decision and participants required' 
      });
    }

    const consensus = await classicalOrchestrator.achieveConsensus(
      decision,
      participants
    );
    
    res.json({
      success: true,
      consensus,
      method: 'classical-voting'
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Classical orchestration
app.post('/api/classical/orchestrate', async (req, res) => {
  try {
    const { tasks, constraints } = req.body;
    
    if (!tasks || !Array.isArray(tasks)) {
      return res.status(400).json({ 
        success: false, 
        error: 'Task array required' 
      });
    }

    const results = await classicalOrchestrator.orchestrateAICollaboration(
      tasks,
      constraints
    );
    
    res.json({
      success: true,
      results: Array.from(results.entries()),
      hardware: {
        tasksProcessed: tasks.length,
        gpuTasks: tasks.filter((t: any) => t.gpuRequired).length,
        cpuTasks: tasks.filter((t: any) => !t.gpuRequired).length
      }
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Benchmark endpoint
app.get('/api/classical/benchmark', async (req, res) => {
  try {
    const startTime = Date.now();
    
    // Create benchmark tasks
    const benchmarkTasks = Array(100).fill(null).map((_, i) => ({
      id: `benchmark-${i}`,
      type: i % 2 === 0 ? 'OPTIMIZATION' : 'PREDICTION',
      priority: Math.random() * 100,
      requiredCapabilities: [],
      gpuRequired: i % 3 === 0
    }));

    const results = await classicalOrchestrator.orchestrateAICollaboration(benchmarkTasks);
    const executionTime = Date.now() - startTime;
    
    res.json({
      success: true,
      benchmark: {
        tasksProcessed: benchmarkTasks.length,
        executionTime: `${executionTime}ms`,
        throughput: `${(benchmarkTasks.length / (executionTime / 1000)).toFixed(2)} tasks/sec`,
        gpuTasks: benchmarkTasks.filter(t => t.gpuRequired).length,
        cpuTasks: benchmarkTasks.filter(t => !t.gpuRequired).length
      }
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * Start Classical Server
 */
async function startClassicalServer(): Promise<void> {
  const PORT = process.env.PORT || 3100;
  
  try {
    await initializeClassicalPlatform();
    
    app.listen(PORT, () => {
      logger.info(`🖥️ Aurigraph Classical Platform running on port ${PORT}`);
      logger.info(`🔗 Health check: http://localhost:${PORT}/health`);
      logger.info(`📊 Classical API: http://localhost:${PORT}/api/classical/*`);
      
      // Display classical capabilities
      const gpuInfo = checkGPUAvailability();
      console.log('\n' + '='.repeat(60));
      console.log('AURIGRAPH V10 - CLASSICAL CPU/GPU VERSION');
      console.log('='.repeat(60));
      console.log('Hardware Capabilities:');
      console.log(`  • CPU: ${os.cpus().length} cores`);
      console.log(`  • RAM: ${(os.totalmem() / (1024 * 1024 * 1024)).toFixed(2)} GB`);
      console.log(`  • GPU: ${gpuInfo.available ? `${gpuInfo.count}x ${gpuInfo.type}` : 'Not available'}`);
      console.log('Performance Targets:');
      console.log('  • 100x GPU Speedup');
      console.log('  • <100ms Decision Latency');
      console.log('  • 85%+ Resource Efficiency');
      console.log('='.repeat(60) + '\n');
    });
    
  } catch (error) {
    logger.error('Failed to start classical server:', error);
    process.exit(1);
  }
}

// Handle shutdown
process.on('SIGINT', async () => {
  logger.info('Shutting down classical platform...');
  
  if (classicalOrchestrator) {
    await classicalOrchestrator.shutdown();
  }
  
  process.exit(0);
});

// Start the server
startClassicalServer();