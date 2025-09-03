import 'reflect-metadata';
import { config } from 'dotenv';
import { Logger } from './core/Logger';
import express from 'express';
import cors from 'cors';
import * as fs from 'fs';
import * as path from 'path';

// Load dev4 specific environment configuration
config({ path: '.env.dev4' });

const logger = new Logger('AV10-7-DEV4-Validator');

interface ValidationResult {
  service: string;
  status: 'PASS' | 'FAIL' | 'WARN';
  message: string;
  details?: any;
}

async function validatePortAvailability(): Promise<ValidationResult[]> {
  const results: ValidationResult[] = [];
  const requiredPorts = {
    'API': parseInt(process.env.API_PORT || '4004'),
    'GRPC': parseInt(process.env.GRPC_PORT || '50054'),
    'Network': parseInt(process.env.NETWORK_PORT || '30304'),
    'Metrics': parseInt(process.env.METRICS_PORT || '9094'),
    'Bridge': parseInt(process.env.BRIDGE_PORT || '8884'),
    'ZKProof': parseInt(process.env.ZK_PROOF_PORT || '8084'),
    'QuantumKMS': parseInt(process.env.QUANTUM_KMS_PORT || '9447'),
    'WebSocket': parseInt(process.env.MONITORING_WS_PORT || '4444')
  };

  for (const [service, port] of Object.entries(requiredPorts)) {
    try {
      const net = await import('net');
      const server = net.createServer();
      await new Promise((resolve, reject) => {
        server.listen(port, (err?: Error) => {
          server.close();
          if (err) reject(err);
          else resolve(void 0);
        });
      });
      
      results.push({
        service: `Port ${port} (${service})`,
        status: 'PASS',
        message: `Port ${port} available for ${service}`,
        details: { port, service }
      });
    } catch (error) {
      results.push({
        service: `Port ${port} (${service})`,
        status: 'FAIL',
        message: `Port ${port} already in use (${service})`,
        details: { port, service, error: (error as Error).message }
      });
    }
  }

  return results;
}

async function validateSystemResources(): Promise<ValidationResult[]> {
  const results: ValidationResult[] = [];
  const os = await import('os');
  
  const totalMemory = os.totalmem();
  const freeMemory = os.freemem();
  const cpuCount = os.cpus().length;
  const platform = os.platform();
  const architecture = os.arch();
  
  const totalMemoryGB = Math.round(totalMemory / (1024 * 1024 * 1024));
  const freeMemoryGB = Math.round(freeMemory / (1024 * 1024 * 1024));
  
  // Memory validation
  const requiredMemoryGB = parseInt(process.env.MAX_MEMORY_GB || '16');
  if (totalMemoryGB >= requiredMemoryGB) {
    results.push({
      service: 'System Memory',
      status: 'PASS',
      message: `Sufficient memory available`,
      details: { total: `${totalMemoryGB}GB`, required: `${requiredMemoryGB}GB` }
    });
  } else {
    results.push({
      service: 'System Memory',
      status: 'WARN',
      message: `Limited memory available`,
      details: { total: `${totalMemoryGB}GB`, required: `${requiredMemoryGB}GB` }
    });
  }
  
  // CPU validation
  const requiredCores = parseInt(process.env.MAX_CPU_CORES || '8');
  if (cpuCount >= requiredCores) {
    results.push({
      service: 'CPU Cores',
      status: 'PASS',
      message: `Sufficient CPU cores available`,
      details: { available: cpuCount, required: requiredCores }
    });
  } else {
    results.push({
      service: 'CPU Cores',
      status: 'WARN',
      message: `Limited CPU cores available`,
      details: { available: cpuCount, required: requiredCores }
    });
  }

  // Platform check
  results.push({
    service: 'Platform',
    status: 'PASS',
    message: `Running on ${platform} ${architecture}`,
    details: { platform, architecture, cpuModel: os.cpus()[0].model }
  });

  return results;
}

async function validateConfiguration(): Promise<ValidationResult[]> {
  const results: ValidationResult[] = [];

  // Check environment file
  const envFile = '.env.dev4';
  if (fs.existsSync(envFile)) {
    results.push({
      service: 'Environment Configuration',
      status: 'PASS',
      message: `Dev4 configuration file found: ${envFile}`,
      details: { file: envFile }
    });
  } else {
    results.push({
      service: 'Environment Configuration',
      status: 'FAIL',
      message: `Dev4 configuration file not found: ${envFile}`,
      details: { file: envFile }
    });
  }

  // Validate key configuration values
  const configs = [
    { key: 'NODE_ID', value: process.env.NODE_ID, required: true },
    { key: 'TARGET_TPS', value: process.env.TARGET_TPS, required: true },
    { key: 'PARALLEL_THREADS', value: process.env.PARALLEL_THREADS, required: true },
    { key: 'QUANTUM_LEVEL', value: process.env.QUANTUM_LEVEL, required: true },
    { key: 'AI_ENABLED', value: process.env.AI_ENABLED, required: true },
    { key: 'CROSS_CHAIN_ENABLED', value: process.env.CROSS_CHAIN_ENABLED, required: true }
  ];

  for (const config of configs) {
    if (config.required && !config.value) {
      results.push({
        service: `Config: ${config.key}`,
        status: 'FAIL',
        message: `Required configuration ${config.key} not set`,
        details: { key: config.key, required: config.required }
      });
    } else {
      results.push({
        service: `Config: ${config.key}`,
        status: 'PASS',
        message: `Configuration ${config.key} is set`,
        details: { key: config.key, value: config.value }
      });
    }
  }

  return results;
}

async function validateDirectories(): Promise<ValidationResult[]> {
  const results: ValidationResult[] = [];
  
  const directories = [
    './models',
    './trusted-setup',
    './data',
    './reports',
    './logs'
  ];

  for (const dir of directories) {
    try {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
        results.push({
          service: `Directory: ${dir}`,
          status: 'PASS',
          message: `Directory created: ${dir}`,
          details: { path: dir, action: 'created' }
        });
      } else {
        results.push({
          service: `Directory: ${dir}`,
          status: 'PASS',
          message: `Directory exists: ${dir}`,
          details: { path: dir, action: 'verified' }
        });
      }
    } catch (error) {
      results.push({
        service: `Directory: ${dir}`,
        status: 'FAIL',
        message: `Failed to create/verify directory: ${dir}`,
        details: { path: dir, error: (error as Error).message }
      });
    }
  }

  return results;
}

async function startValidationAPI(): Promise<void> {
  const app = express();
  app.use(cors());
  app.use(express.json());

  // Health check endpoint
  app.get('/health', (req, res) => {
    res.json({
      status: 'healthy',
      version: '10.7.0',
      platform: 'AV10-7 DLT Platform',
      environment: 'dev4',
      nodeId: process.env.NODE_ID,
      timestamp: new Date().toISOString()
    });
  });

  // Platform status endpoint
  app.get('/api/v10/status', (req, res) => {
    res.json({
      platform: 'AV10-7 DLT Platform',
      version: '10.7.0',
      environment: 'dev4',
      status: 'validation-mode',
      features: {
        quantumSecurity: process.env.QUANTUM_SECURE === 'true',
        zkProofs: process.env.ZK_PROOFS_ENABLED === 'true',
        crossChain: process.env.CROSS_CHAIN_ENABLED === 'true',
        aiOptimization: process.env.AI_ENABLED === 'true',
        homomorphicEncryption: process.env.HOMOMORPHIC_ENCRYPTION === 'true',
        wormholeIntegration: process.env.CROSS_CHAIN_ENABLED === 'true'
      },
      configuration: {
        targetTPS: parseInt(process.env.TARGET_TPS || '1000000'),
        parallelThreads: parseInt(process.env.PARALLEL_THREADS || '256'),
        quantumLevel: parseInt(process.env.QUANTUM_LEVEL || '5'),
        validators: (process.env.VALIDATORS || '').split(',').length
      },
      timestamp: new Date().toISOString()
    });
  });

  // Validation endpoint
  app.get('/api/v10/validation', async (req, res) => {
    try {
      const portValidation = await validatePortAvailability();
      const resourceValidation = await validateSystemResources();
      const configValidation = await validateConfiguration();
      const directoryValidation = await validateDirectories();

      const allResults = [
        ...portValidation,
        ...resourceValidation,
        ...configValidation,
        ...directoryValidation
      ];

      const summary = {
        total: allResults.length,
        passed: allResults.filter(r => r.status === 'PASS').length,
        warnings: allResults.filter(r => r.status === 'WARN').length,
        failed: allResults.filter(r => r.status === 'FAIL').length
      };

      res.json({
        summary,
        results: allResults,
        timestamp: new Date().toISOString(),
        environment: 'dev4'
      });
    } catch (error) {
      res.status(500).json({
        error: 'Validation failed',
        message: (error as Error).message
      });
    }
  });

  // Performance configuration endpoint
  app.get('/api/v10/performance', (req, res) => {
    res.json({
      target: {
        tps: parseInt(process.env.TARGET_TPS || '1000000'),
        latency: 500,
        throughput: '1M+ TPS'
      },
      configuration: {
        parallelThreads: parseInt(process.env.PARALLEL_THREADS || '256'),
        pipelineDepth: parseInt(process.env.PIPELINE_DEPTH || '5'),
        batchSize: parseInt(process.env.BATCH_SIZE || '10000'),
        maxBatchSize: parseInt(process.env.MAX_BATCH_SIZE || '50000')
      },
      resources: {
        memory: `${process.env.MAX_MEMORY_GB || '16'}GB`,
        cpu: `${process.env.MAX_CPU_CORES || '8'} cores`,
        networkBandwidth: `${process.env.NETWORK_BANDWIDTH_MBPS || '1000'}Mbps`
      },
      optimizations: {
        aiEnabled: process.env.AI_ENABLED === 'true',
        predictiveConsensus: process.env.PREDICTIVE_CONSENSUS === 'true',
        optimizationInterval: `${process.env.OPTIMIZATION_INTERVAL || '5000'}ms`
      }
    });
  });

  // Security configuration endpoint
  app.get('/api/v10/security', (req, res) => {
    res.json({
      quantum: {
        enabled: process.env.QUANTUM_SECURE === 'true',
        level: parseInt(process.env.QUANTUM_LEVEL || '5'),
        algorithms: ['CRYSTALS-Kyber', 'CRYSTALS-Dilithium', 'SPHINCS+']
      },
      zkProofs: {
        enabled: process.env.ZK_PROOFS_ENABLED === 'true',
        types: {
          snark: process.env.ZK_SNARK_ENABLED === 'true',
          stark: process.env.ZK_STARK_ENABLED === 'true',
          plonk: process.env.ZK_PLONK_ENABLED === 'true'
        },
        recursiveProofs: process.env.RECURSIVE_PROOFS === 'true'
      },
      encryption: {
        homomorphic: process.env.HOMOMORPHIC_ENCRYPTION === 'true',
        multiPartyComputation: process.env.MULTI_PARTY_COMPUTATION === 'true'
      }
    });
  });

  const port = parseInt(process.env.API_PORT || '4004');
  const server = app.listen(port, () => {
    logger.info(`🌐 AV10-7 Validation API started on port ${port}`);
    logger.info(`🔍 Validation endpoint: http://localhost:${port}/api/v10/validation`);
    logger.info(`📊 Status endpoint: http://localhost:${port}/api/v10/status`);
    logger.info(`⚡ Performance endpoint: http://localhost:${port}/api/v10/performance`);
    logger.info(`🔒 Security endpoint: http://localhost:${port}/api/v10/security`);
  });

  // Graceful shutdown
  process.on('SIGINT', () => {
    logger.info('\n⚠️  SIGINT received, shutting down validation API...');
    server.close(() => {
      logger.info('👋 AV10-7 Validation API shutdown complete');
      process.exit(0);
    });
  });
}

async function runValidation(): Promise<void> {
  try {
    logger.info('🔍 Starting Aurigraph AV10-7 DLT Platform - Dev4 Validation...');
    logger.info('🎯 Version: 10.7.0 | Environment: dev4');
    logger.info('');

    // Run all validations
    const portValidation = await validatePortAvailability();
    const resourceValidation = await validateSystemResources();
    const configValidation = await validateConfiguration();
    const directoryValidation = await validateDirectories();

    const allResults = [
      ...portValidation,
      ...resourceValidation,
      ...configValidation,
      ...directoryValidation
    ];

    // Generate summary
    const summary = {
      total: allResults.length,
      passed: allResults.filter(r => r.status === 'PASS').length,
      warnings: allResults.filter(r => r.status === 'WARN').length,
      failed: allResults.filter(r => r.status === 'FAIL').length
    };

    // Display results
    logger.info('═══════════════════════════════════════════════════════');
    logger.info('🎯 DEV4 DEPLOYMENT VALIDATION RESULTS');
    logger.info('═══════════════════════════════════════════════════════');
    logger.info(`📊 Total Checks: ${summary.total}`);
    logger.info(`✅ Passed: ${summary.passed}`);
    logger.info(`⚠️  Warnings: ${summary.warnings}`);
    logger.info(`❌ Failed: ${summary.failed}`);
    logger.info('');

    // Display detailed results
    const categories = {
      'Port Availability': allResults.filter(r => r.service.startsWith('Port')),
      'System Resources': allResults.filter(r => ['System Memory', 'CPU Cores', 'Platform'].includes(r.service)),
      'Configuration': allResults.filter(r => r.service.startsWith('Config') || r.service === 'Environment Configuration'),
      'Directories': allResults.filter(r => r.service.startsWith('Directory'))
    };

    for (const [category, results] of Object.entries(categories)) {
      if (results.length > 0) {
        logger.info(`📋 ${category}:`);
        for (const result of results) {
          const icon = result.status === 'PASS' ? '✅' : result.status === 'WARN' ? '⚠️' : '❌';
          logger.info(`   ${icon} ${result.message}`);
        }
        logger.info('');
      }
    }

    // Save validation report
    const reportData = {
      timestamp: new Date().toISOString(),
      environment: 'dev4',
      summary,
      results: allResults,
      portAssignments: {
        API: parseInt(process.env.API_PORT || '4004'),
        GRPC: parseInt(process.env.GRPC_PORT || '50054'),
        Network: parseInt(process.env.NETWORK_PORT || '30304'),
        Metrics: parseInt(process.env.METRICS_PORT || '9094'),
        Bridge: parseInt(process.env.BRIDGE_PORT || '8884'),
        ZKProof: parseInt(process.env.ZK_PROOF_PORT || '8084'),
        QuantumKMS: parseInt(process.env.QUANTUM_KMS_PORT || '9447'),
        WebSocket: parseInt(process.env.MONITORING_WS_PORT || '4444')
      },
      performanceTargets: {
        targetTPS: parseInt(process.env.TARGET_TPS || '1000000'),
        parallelThreads: parseInt(process.env.PARALLEL_THREADS || '256'),
        quantumLevel: parseInt(process.env.QUANTUM_LEVEL || '5')
      }
    };

    const reportsDir = path.join(process.cwd(), 'reports');
    const reportFile = path.join(reportsDir, `dev4-validation-${Date.now()}.json`);
    fs.writeFileSync(reportFile, JSON.stringify(reportData, null, 2));

    logger.info(`📋 Validation report saved: ${reportFile}`);
    logger.info('');

    // Start validation API
    if (summary.failed === 0) {
      logger.info('✅ All critical validations passed. Starting validation API...');
      await startValidationAPI();
    } else {
      logger.info('❌ Some critical validations failed. Please address these issues before deployment.');
      process.exit(1);
    }

  } catch (error) {
    logger.error('❌ Validation failed:', error);
    process.exit(1);
  }
}

runValidation().catch((error) => {
  console.error('Validation error:', error);
  process.exit(1);
});