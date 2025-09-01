import 'reflect-metadata';
import { Container } from 'inversify';
import { config } from 'dotenv';
import { AV10Node } from './core/AV10Node';
import { Logger } from './core/Logger';
import { ConfigManager } from './core/ConfigManager';
import { NetworkOrchestrator } from './network/NetworkOrchestrator';
import { MonitoringService } from './monitoring/MonitoringService';
import { QuantumCryptoManager } from './crypto/QuantumCryptoManager';
import { CrossChainBridge } from './crosschain/CrossChainBridge';
import { ZKProofSystem } from './zk/ZKProofSystem';
import { AIOptimizer } from './ai/AIOptimizer';

config();

const logger = new Logger('AV10-7-Main');
const container = new Container();

async function bootstrapAV10() {
  try {
    logger.info('🚀 Starting Aurigraph AV10-7 Quantum Nexus...');
    logger.info('Version: 10.7.0 | Codename: Quantum Nexus');
    
    // Initialize dependency injection container
    await setupDependencyInjection();
    
    // Load configuration
    const configManager = container.get<ConfigManager>(ConfigManager);
    await configManager.loadConfiguration();
    
    // Initialize quantum cryptography
    const quantumCrypto = container.get<QuantumCryptoManager>(QuantumCryptoManager);
    await quantumCrypto.initialize();
    logger.info('🔐 Quantum cryptography initialized');
    
    // Setup network orchestrator
    const networkOrchestrator = container.get<NetworkOrchestrator>(NetworkOrchestrator);
    await networkOrchestrator.initialize();
    logger.info('🌐 Network orchestrator initialized');
    
    // Initialize ZK proof system
    const zkProofSystem = container.get<ZKProofSystem>(ZKProofSystem);
    await zkProofSystem.initialize();
    logger.info('🎭 Zero-knowledge proof system initialized');
    
    // Start AI optimizer
    const aiOptimizer = container.get<AIOptimizer>(AIOptimizer);
    await aiOptimizer.start();
    logger.info('🤖 AI optimizer started');
    
    // Initialize cross-chain bridge
    const crossChainBridge = container.get<CrossChainBridge>(CrossChainBridge);
    await crossChainBridge.initialize();
    logger.info('🌉 Cross-chain bridge initialized');
    
    // Start monitoring service
    const monitoringService = container.get<MonitoringService>(MonitoringService);
    await monitoringService.start();
    logger.info('📊 Monitoring service started');
    
    // Start main node
    const node = container.get<AV10Node>(AV10Node);
    await node.start();
    
    logger.info('✅ Aurigraph AV10-7 started successfully');
    logger.info(`📈 Target TPS: 1,000,000+ | Finality: <500ms`);
    logger.info(`🔒 Security: Post-Quantum Level 5 | Privacy: ZK-Enabled`);
    logger.info(`🌍 Cross-chain: 50+ blockchains supported`);
    
    // Setup graceful shutdown
    setupGracefulShutdown(node);
    
  } catch (error) {
    logger.error('Failed to start AV10-7:', error);
    process.exit(1);
  }
}

async function setupDependencyInjection() {
  // Import consensus module
  const { HyperRAFTPlusPlus } = await import('./consensus/HyperRAFTPlusPlus');
  
  // Core services
  container.bind<ConfigManager>(ConfigManager).to(ConfigManager).inSingletonScope();
  container.bind<AV10Node>(AV10Node).to(AV10Node).inSingletonScope();
  
  // Network services
  container.bind<NetworkOrchestrator>(NetworkOrchestrator).to(NetworkOrchestrator).inSingletonScope();
  
  // Consensus services
  container.bind<HyperRAFTPlusPlus>('HyperRAFTPlusPlus').to(HyperRAFTPlusPlus).inSingletonScope();
  
  // Cryptography services
  container.bind<QuantumCryptoManager>(QuantumCryptoManager).to(QuantumCryptoManager).inSingletonScope();
  container.bind<ZKProofSystem>(ZKProofSystem).to(ZKProofSystem).inSingletonScope();
  
  // Cross-chain services
  container.bind<CrossChainBridge>(CrossChainBridge).to(CrossChainBridge).inSingletonScope();
  
  // AI services
  container.bind<AIOptimizer>(AIOptimizer).to(AIOptimizer).inSingletonScope();
  
  // Monitoring services
  container.bind<MonitoringService>(MonitoringService).to(MonitoringService).inSingletonScope();
}

function setupGracefulShutdown(node: AV10Node) {
  const shutdown = async (signal: string) => {
    logger.info(`\n⚠️  ${signal} received, initiating graceful shutdown...`);
    
    try {
      await node.stop();
      logger.info('👋 Aurigraph AV10-7 shutdown complete');
      process.exit(0);
    } catch (error) {
      logger.error('Error during shutdown:', error);
      process.exit(1);
    }
  };
  
  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGHUP', () => shutdown('SIGHUP'));
  
  process.on('uncaughtException', (error) => {
    logger.error('Uncaught exception:', error);
    shutdown('UNCAUGHT_EXCEPTION');
  });
  
  process.on('unhandledRejection', (reason, promise) => {
    logger.error('Unhandled rejection at:', promise, 'reason:', reason);
    shutdown('UNHANDLED_REJECTION');
  });
}

// Start the platform
bootstrapAV10().catch(console.error);