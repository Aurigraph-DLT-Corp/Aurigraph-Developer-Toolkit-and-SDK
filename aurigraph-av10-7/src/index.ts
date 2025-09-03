import 'reflect-metadata';
import { config } from 'dotenv';
import { Logger } from './core/Logger';
import { ConfigManager } from './core/ConfigManager';
import { QuantumCryptoManager } from './crypto/QuantumCryptoManager';
import { ZKProofSystem } from './zk/ZKProofSystem';
import { CrossChainBridge } from './crosschain/CrossChainBridge';
import { AIOptimizer } from './ai/AIOptimizer';
import { HyperRAFTPlusPlus } from './consensus/HyperRAFTPlusPlus';
import { MonitoringService } from './monitoring/MonitoringService';
import { MonitoringAPIServer } from './api/MonitoringAPIServer';
import { VizorMonitoringService } from './monitoring/VizorDashboard';
import { ValidatorOrchestrator } from './consensus/ValidatorOrchestrator';
import { ChannelManager } from './network/ChannelManager';
import express from 'express';
import cors from 'cors';

config();

const logger = new Logger('AV10-7-DLT-Main');

async function startAV10DLTPlatform() {
  try {
    logger.info('🚀 Starting Aurigraph AV10-7 DLT Platform...');
    logger.info('Version: 10.7.0 | Focus: Distributed Ledger Technology');
    logger.info('🔗 Initializing blockchain services...');

    // Initialize core DLT services
    const configManager = new ConfigManager();
    await configManager.initialize();
    logger.info('⚙️ Configuration manager initialized');

    const quantumCrypto = new QuantumCryptoManager();
    await quantumCrypto.initialize();
    logger.info('🔐 Quantum cryptography initialized');

    const zkProofSystem = new ZKProofSystem();
    await zkProofSystem.initialize();
    logger.info('🎭 Zero-knowledge proof system initialized');

    const aiOptimizer = new AIOptimizer();
    await aiOptimizer.start();
    logger.info('🤖 AI optimizer started');

    const crossChainBridge = new CrossChainBridge();
    await crossChainBridge.initialize();
    logger.info('🌉 Cross-chain bridge initialized');

    const monitoringService = new MonitoringService();
    await monitoringService.start();
    logger.info('📊 Monitoring service started');

    const vizorMonitoring = new VizorMonitoringService();
    logger.info('📈 Vizor monitoring service initialized');

    // Initialize consensus components
    const validatorOrchestrator = new ValidatorOrchestrator(quantumCrypto, vizorMonitoring);
    await validatorOrchestrator.initialize();
    logger.info('🏛️ Validator orchestrator initialized');

    const channelManager = new ChannelManager(quantumCrypto, vizorMonitoring);
    await channelManager.initialize();
    logger.info('📡 Channel manager initialized');

    // Start API server
    const monitoringAPI = new MonitoringAPIServer(vizorMonitoring, validatorOrchestrator, channelManager);
    await monitoringAPI.start(3000);
    logger.info('🌐 DLT API server started on port 3000');

    // Create consensus engine
    const consensus = new HyperRAFTPlusPlus({
      nodeId: 'av10-primary',
      validators: ['av10-primary', 'av10-validator-2', 'av10-validator-3'],
      electionTimeout: 1000,
      heartbeatInterval: 1000,
      batchSize: 10000,
      pipelineDepth: 4,
      parallelThreads: 256,
      zkProofsEnabled: true,
      aiOptimizationEnabled: true,
      quantumSecure: true
    }, quantumCrypto, zkProofSystem, aiOptimizer);
    
    await consensus.initialize();
    await consensus.start();
    logger.info('🏗️ HyperRAFT++ consensus started');

    logger.info('✅ AV10-7 DLT Platform started successfully');
    logger.info('📈 Target TPS: 1,000,000+ | Finality: <500ms');
    logger.info('🔒 Security: Post-Quantum Level 5 | Privacy: ZK-Enabled');
    logger.info('🌍 Cross-chain: Wormhole + Native (30+ blockchains)');
    logger.info('🏛️ Consensus: HyperRAFT++ with AI optimization');
    
    // Start DLT performance monitoring
    setInterval(async () => {
      const consensusMetrics = consensus.getPerformanceMetrics();
      const bridgeMetrics = await crossChainBridge.getMetrics();
      const cryptoMetrics = quantumCrypto.getMetrics();
      
      logger.info('═══════════════════════════════════════════════════════');
      logger.info(`📊 AV10-7 DLT Performance`);
      logger.info(`⚡ TPS: ${consensusMetrics.tps.toLocaleString()} | Latency: ${consensusMetrics.avgLatency}ms`);
      logger.info(`🎭 ZK Proofs: Active | 🌉 Bridge TXs: ${bridgeMetrics.totalTransactions}`);
      logger.info(`🔐 Quantum Security: Level ${cryptoMetrics.securityLevel} ✅ | 🤖 AI Optimization: Active ✅`);
      logger.info(`🏛️ Validators: ${validatorOrchestrator.getNetworkStatus().validators.length} active`);
      logger.info(`📡 Channels: ${channelManager.getAllChannelStatuses().length} encrypted channels`);
      logger.info('═══════════════════════════════════════════════════════');
    }, 15000);
    
    // Graceful shutdown
    process.on('SIGINT', async () => {
      logger.info('\n⚠️  SIGINT received, shutting down AV10-7 DLT Platform...');
      await consensus.stop();
      await crossChainBridge.stop();
      await aiOptimizer.stop();
      await monitoringService.stop();
      await validatorOrchestrator.stop();
      await channelManager.stop();
      await monitoringAPI.stop();
      vizorMonitoring.stop();
      logger.info('👋 AV10-7 DLT Platform shutdown complete');
      process.exit(0);
    });
    
  } catch (error) {
    logger.error('Failed to start AV10-7 DLT Platform:', error);
    process.exit(1);
  }
}

startAV10DLTPlatform().catch(console.error);