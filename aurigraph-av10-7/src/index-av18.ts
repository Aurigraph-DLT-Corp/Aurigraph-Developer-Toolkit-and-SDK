import 'reflect-metadata';
import { Container } from 'inversify';
import { Logger } from './core/Logger';
import { ConfigManager } from './core/ConfigManager';
import { AV18Node } from './core/AV18Node';
import { HyperRAFTPlusPlusV2 } from './consensus/HyperRAFTPlusPlusV2';
import { QuantumCryptoManagerV2 } from './crypto/QuantumCryptoManagerV2';
import { QuantumCryptoManager } from './crypto/QuantumCryptoManager';
import { ZKProofSystem } from './zk/ZKProofSystem';
import { AIOptimizer } from './ai/AIOptimizer';
import { CrossChainBridge } from './crosschain/CrossChainBridge';
import { ChannelManager } from './network/ChannelManager';
import { VizorMonitoringService } from './monitoring/VizorDashboard';
import { MonitoringAPIServer } from './api/MonitoringAPIServer';
import { AutonomousComplianceEngine } from './compliance/AutonomousComplianceEngine';

class AV18Platform {
  private logger: Logger;
  private container: Container;
  private av18Node!: AV18Node;
  private monitoringAPI!: MonitoringAPIServer;
  private complianceEngine!: AutonomousComplianceEngine;
  private isRunning: boolean = false;
  
  constructor() {
    this.logger = new Logger('AV18-Platform');
    this.container = new Container();
    this.setupDependencyInjection();
  }
  
  private setupDependencyInjection(): void {
    this.logger.info('Setting up AV10-18 dependency injection container...');
    
    // Core services
    this.container.bind<Logger>(Logger).toConstantValue(new Logger('AV18-Container'));
    this.container.bind<ConfigManager>(ConfigManager).to(ConfigManager).inSingletonScope();
    
    // Core components
    this.container.bind<QuantumCryptoManager>(QuantumCryptoManager).to(QuantumCryptoManager).inSingletonScope();
    this.container.bind<ZKProofSystem>(ZKProofSystem).to(ZKProofSystem).inSingletonScope();
    this.container.bind<AIOptimizer>(AIOptimizer).to(AIOptimizer).inSingletonScope();
    this.container.bind<CrossChainBridge>(CrossChainBridge).to(CrossChainBridge).inSingletonScope();
    this.container.bind<ChannelManager>(ChannelManager).to(ChannelManager).inSingletonScope();
    this.container.bind<VizorMonitoringService>(VizorMonitoringService).to(VizorMonitoringService).inSingletonScope();
    
    // AV10-18 enhanced services
    this.container.bind<AV18Node>(AV18Node).to(AV18Node).inSingletonScope();
    this.container.bind<MonitoringAPIServer>(MonitoringAPIServer).to(MonitoringAPIServer).inSingletonScope();
    
    this.logger.info('AV10-18 dependency injection container configured');
  }
  
  async initialize(): Promise<void> {
    this.logger.info('🚀 Initializing Aurigraph AV10-18 Platform...');
    
    try {
      // Initialize core services
      await this.initializeCoreServices();
      
      // Initialize AV10-18 node
      this.av18Node = this.container.get<AV18Node>(AV18Node);
      
      // Initialize autonomous compliance engine
      await this.initializeComplianceEngine();
      
      // Initialize monitoring API
      this.monitoringAPI = this.container.get<MonitoringAPIServer>(MonitoringAPIServer);
      
      this.logger.info('✅ AV10-18 Platform initialization complete');
      
    } catch (error: unknown) {
      this.logger.error('❌ Failed to initialize AV10-18 Platform:', error);
      throw error;
    }
  }
  
  private async initializeCoreServices(): Promise<void> {
    this.logger.info('Initializing AV10-18 core services...');
    
    // Initialize quantum crypto (original for compatibility)
    const quantumCrypto = new QuantumCryptoManager();
    await quantumCrypto.initialize();
    
    // Initialize ZK proof system
    const zkProofSystem = this.container.get<ZKProofSystem>(ZKProofSystem);
    await zkProofSystem.initialize();
    
    // Initialize AI optimizer
    const aiOptimizer = this.container.get<AIOptimizer>(AIOptimizer);
    await aiOptimizer.initialize();
    
    // Initialize monitoring service
    const monitoring = this.container.get<VizorMonitoringService>(VizorMonitoringService);
    
    // Initialize cross-chain bridge
    const crossChainBridge = this.container.get<CrossChainBridge>(CrossChainBridge);
    await crossChainBridge.initialize();
    
    // Initialize channel manager with dependencies
    const channelManager = new ChannelManager(quantumCrypto, monitoring);
    await channelManager.initialize();
    
    this.logger.info('Core services initialized');
  }
  
  private async initializeComplianceEngine(): Promise<void> {
    this.logger.info('Initializing Autonomous Compliance Engine...');
    
    const quantumCrypto = this.container.get<QuantumCryptoManager>(QuantumCryptoManager);
    const aiOptimizer = this.container.get<AIOptimizer>(AIOptimizer);
    
    this.complianceEngine = new AutonomousComplianceEngine(
      {
        jurisdictions: ['US', 'EU', 'UK', 'CA', 'AU', 'SG', 'JP'],
        kycLevel: 'institutional',
        amlThreshold: 0.7,
        reportingFrequency: 'realtime',
        sanctionListUpdate: 'automatic',
        auditTrailRetention: 2555, // 7 years
        riskTolerance: 'low',
        regulatoryFrameworks: ['MiCA', 'CBDC', 'DeFi-Regulation', 'AML6', 'GDPR']
      },
      aiOptimizer,
      quantumCrypto
    );
    
    await this.complianceEngine.start();
    
    this.logger.info('Autonomous Compliance Engine initialized');
  }
  
  async start(): Promise<void> {
    if (this.isRunning) {
      this.logger.warn('AV10-18 Platform is already running');
      return;
    }
    
    this.logger.info('🌟 Starting Aurigraph AV10-18 Platform...');
    
    try {
      // Initialize platform
      await this.initialize();
      
      // Start AV10-18 node
      await this.av18Node.start();
      
      // Start monitoring API
      await this.monitoringAPI.start(3018); // AV10-18 uses port 3018
      
      this.isRunning = true;
      
      // Display startup information
      this.displayStartupInfo();
      
      // Start real-time monitoring
      this.startRealTimeMonitoring();
      
      this.logger.info('✅ AV10-18 Platform started successfully!');
      
    } catch (error: unknown) {
      this.logger.error('❌ Failed to start AV10-18 Platform:', error);
      await this.cleanup();
      throw error;
    }
  }
  
  private displayStartupInfo(): void {
    this.logger.info('═══════════════════════════════════════════════════════');
    this.logger.info('🌟 Aurigraph AV10-18 Platform - OPERATIONAL');
    this.logger.info('═══════════════════════════════════════════════════════');
    this.logger.info('📊 Performance Targets:');
    this.logger.info('   ⚡ Throughput: 5,000,000+ TPS');
    this.logger.info('   ⏱️ Latency: <100ms finality');
    this.logger.info('   🔮 Quantum Level: 6 (NIST+)');
    this.logger.info('   🤖 Autonomous: ✅ Operations');
    this.logger.info('   📋 Compliance: ✅ Real-time');
    this.logger.info('');
    this.logger.info('🌐 Services:');
    this.logger.info('   📡 Monitoring API: http://localhost:3018');
    this.logger.info('   📊 Dashboards: http://localhost:3018/api/v18/vizor/dashboards');
    this.logger.info('   📈 Real-time: http://localhost:3018/api/v18/realtime');
    this.logger.info('   🏛️ Compliance: http://localhost:3018/api/v18/compliance');
    this.logger.info('');
    this.logger.info('🔧 Features:');
    this.logger.info('   🏗️ Consensus: HyperRAFT++ V2.0');
    this.logger.info('   🔐 Crypto: Quantum-Native V2');
    this.logger.info('   🎭 ZK Proofs: Recursive Aggregation');
    this.logger.info('   🌉 Cross-chain: 100+ Blockchains');
    this.logger.info('   📋 Compliance: Autonomous Engine');
    this.logger.info('   🤖 AI: Autonomous Optimization');
    this.logger.info('═══════════════════════════════════════════════════════');
  }
  
  private startRealTimeMonitoring(): void {
    // Real-time platform monitoring every 10 seconds
    setInterval(() => {
      if (!this.isRunning) return;
      
      this.displayRealTimeMetrics();
    }, 10000);
  }
  
  private displayRealTimeMetrics(): void {
    const nodeStatus = this.av18Node.getEnhancedStatus();
    const complianceStatus = this.complianceEngine.getComplianceStatus();
    
    this.logger.info('═════════════════════════════════════════════════════════');
    this.logger.info('📊 AV10-18 Real-time Performance');
    this.logger.info(`⚡ TPS: ${nodeStatus.metrics.tps.toLocaleString()} | Latency: ${nodeStatus.metrics.latency.toFixed(0)}ms`);
    this.logger.info(`🔮 Quantum Ops: ${nodeStatus.metrics.quantumOps.toLocaleString()}/sec | 🎭 ZK Proofs: ${nodeStatus.metrics.zkProofs.toLocaleString()}/sec`);
    this.logger.info(`🌉 Cross-chain: ${nodeStatus.metrics.crossChainTxs}/sec | 🤖 Auto-Optimizations: ${nodeStatus.metrics.autonomousOptimizations}`);
    this.logger.info(`📋 Compliance Score: ${complianceStatus.score}% | Auto-Resolution: ${complianceStatus.autoResolutionRate}%`);
    this.logger.info(`🏛️ Consensus: ${nodeStatus.consensus.version} | 🎯 Shard Efficiency: ${nodeStatus.enhanced.shardEfficiency.toFixed(1)}%`);
    this.logger.info(`⏱️ Uptime: ${Math.floor(nodeStatus.uptime / 1000)}s | 🔗 Active Channels: ${nodeStatus.consensus.validators}`);
    this.logger.info('═════════════════════════════════════════════════════════');
  }
  
  async stop(): Promise<void> {
    if (!this.isRunning) {
      this.logger.warn('AV10-18 Platform is not running');
      return;
    }
    
    this.logger.info('🛑 Stopping AV10-18 Platform...');
    
    this.isRunning = false;
    
    await this.cleanup();
    
    this.logger.info('✅ AV10-18 Platform stopped successfully');
  }
  
  private async cleanup(): Promise<void> {
    try {
      // Stop all services gracefully
      if (this.av18Node) {
        await this.av18Node.stop();
      }
      
      if (this.monitoringAPI) {
        await this.monitoringAPI.stop();
      }
      
      if (this.complianceEngine) {
        await this.complianceEngine.stop();
      }
      
      this.logger.info('All services stopped gracefully');
      
    } catch (error: unknown) {
      this.logger.error('Error during cleanup:', error);
    }
  }
  
  getStatus(): any {
    return {
      platform: 'AV10-18',
      version: '10.18.0',
      isRunning: this.isRunning,
      node: this.av18Node ? this.av18Node.getEnhancedStatus() : null,
      compliance: this.complianceEngine ? this.complianceEngine.getComplianceStatus() : null,
      timestamp: new Date()
    };
  }
  
  async generateStatusReport(): Promise<any> {
    const status = this.getStatus();
    
    return {
      ...status,
      detailedMetrics: {
        node: this.av18Node ? this.av18Node.getMetrics() : null,
        compliance: this.complianceEngine ? this.complianceEngine.getComplianceMetrics() : null
      },
      generatedAt: new Date(),
      reportType: 'platform-status'
    };
  }
}

// Main execution
async function main() {
  const platform = new AV18Platform();
  
  try {
    await platform.start();
    
    // Keep platform running
    process.on('SIGINT', async () => {
      console.log('\\nReceived SIGINT, shutting down gracefully...');
      await platform.stop();
      process.exit(0);
    });
    
    process.on('SIGTERM', async () => {
      console.log('\\nReceived SIGTERM, shutting down gracefully...');
      await platform.stop();
      process.exit(0);
    });
    
    // Handle uncaught exceptions
    process.on('uncaughtException', async (error) => {
      console.error('Uncaught Exception:', error);
      await platform.stop();
      process.exit(1);
    });
    
    // Handle unhandled promise rejections
    process.on('unhandledRejection', async (reason, promise) => {
      console.error('Unhandled Rejection at:', promise, 'reason:', reason);
      await platform.stop();
      process.exit(1);
    });
    
  } catch (error: unknown) {
    console.error('Failed to start AV10-18 Platform:', error);
    process.exit(1);
  }
}

// Start platform if this file is executed directly
if (require.main === module) {
  main().catch(error => {
    console.error('Platform startup failed:', error);
    process.exit(1);
  });
}

export { AV18Platform };