/**
 * AV10-7 Dependency Injection Container
 * 
 * Configures dependency injection for all AV10-7 components including
 * the revolutionary Quantum Nexus functionality.
 * 
 * @version 10.0.0
 * @author Aurigraph Team
 * @license MIT
 */

import { Container } from 'inversify';
import 'reflect-metadata';

// Core components
import { Logger } from './Logger';
import { ConfigManager } from './ConfigManager';
import { AV10Node } from './AV10Node';
import { QuantumNexus } from './QuantumNexus';

// Consensus components
import { HyperRAFTPlusPlus } from '../consensus/HyperRAFTPlusPlus';
import { ValidatorNode } from '../consensus/ValidatorNode';
import { ValidatorOrchestrator } from '../consensus/ValidatorOrchestrator';

// Crypto components
import { QuantumCryptoManager } from '../crypto/QuantumCryptoManager';

// ZK components
import { ZKProofSystem } from '../zk/ZKProofSystem';

// Cross-chain components
import { CrossChainBridge } from '../crosschain/CrossChainBridge';

// AI components
import { AIOptimizer } from '../ai/AIOptimizer';

// Network components
import { NetworkOrchestrator } from '../network/NetworkOrchestrator';
import { ChannelManager } from '../network/ChannelManager';

// Monitoring components
import { MonitoringService } from '../monitoring/MonitoringService';
import { VizorDashboard, VizorMonitoringService } from '../monitoring/VizorDashboard';

// API components
import { QuantumNexusController } from '../api/QuantumNexusController';
import { VizorAPIEndpoints } from '../api/VizorAPIEndpoints';
import { MonitoringAPIServer } from '../api/MonitoringAPIServer';

// Create container instance
const container = new Container();

// Bind core components
container.bind<Logger>(Logger).toSelf().inSingletonScope();
container.bind<ConfigManager>(ConfigManager).toSelf().inSingletonScope();
container.bind<AV10Node>(AV10Node).toSelf().inSingletonScope();
container.bind<QuantumNexus>(QuantumNexus).toSelf().inSingletonScope();

// Bind consensus components
container.bind<HyperRAFTPlusPlus>(HyperRAFTPlusPlus).toSelf().inSingletonScope();
container.bind<ValidatorNode>(ValidatorNode).toSelf().inSingletonScope();
container.bind<ValidatorOrchestrator>(ValidatorOrchestrator).toSelf().inSingletonScope();

// Bind crypto components
container.bind<QuantumCryptoManager>(QuantumCryptoManager).toSelf().inSingletonScope();

// Bind ZK components
container.bind<ZKProofSystem>(ZKProofSystem).toSelf().inSingletonScope();

// Bind cross-chain components
container.bind<CrossChainBridge>(CrossChainBridge).toSelf().inSingletonScope();

// Bind AI components
container.bind<AIOptimizer>(AIOptimizer).toSelf().inSingletonScope();

// Bind network components
container.bind<NetworkOrchestrator>(NetworkOrchestrator).toSelf().inSingletonScope();
container.bind<ChannelManager>(ChannelManager).toSelf().inSingletonScope();

// Bind monitoring components
container.bind<MonitoringService>(MonitoringService).toSelf().inSingletonScope();
container.bind<VizorMonitoringService>(VizorMonitoringService).toSelf().inSingletonScope();

// Bind API components
container.bind<QuantumNexusController>(QuantumNexusController).toSelf().inSingletonScope();
container.bind<VizorAPIEndpoints>(VizorAPIEndpoints).toSelf().inSingletonScope();
container.bind<MonitoringAPIServer>(MonitoringAPIServer).toSelf().inSingletonScope();

// Container configuration for quantum nexus
container.bind('quantum.parallel_universes').toConstantValue('5');
container.bind('quantum.reality_collapse_threshold').toConstantValue('0.95');
container.bind('quantum.coherence_level').toConstantValue('maximum');
container.bind('quantum.consciousness_detection_threshold').toConstantValue('0.5');
container.bind('quantum.evolution_ethics_threshold').toConstantValue('0.999');
container.bind('quantum.community_consensus_threshold').toConstantValue('0.6');

// Export configured container
export { container };

/**
 * Container factory for creating configured instances
 */
export class ContainerFactory {
  /**
   * Create a fully configured AV10 Node with Quantum Nexus
   */
  static async createAV10Node(): Promise<AV10Node> {
    const node = container.get<AV10Node>(AV10Node);
    await node.start();
    return node;
  }

  /**
   * Create a standalone Quantum Nexus instance
   */
  static async createQuantumNexus(): Promise<QuantumNexus> {
    const nexus = container.get<QuantumNexus>(QuantumNexus);
    await nexus.initialize();
    return nexus;
  }

  /**
   * Create a monitoring API server with quantum endpoints
   */
  static createMonitoringAPIServer(): MonitoringAPIServer {
    return container.get<MonitoringAPIServer>(MonitoringAPIServer);
  }

  /**
   * Create a quantum nexus controller
   */
  static createQuantumNexusController(): QuantumNexusController {
    return container.get<QuantumNexusController>(QuantumNexusController);
  }

  /**
   * Get container instance for manual dependency resolution
   */
  static getContainer(): Container {
    return container;
  }
}

/**
 * Quantum Nexus Service Locator
 * Provides easy access to quantum-specific services
 */
export class QuantumServiceLocator {
  /**
   * Get the quantum nexus instance
   */
  static getQuantumNexus(): QuantumNexus {
    return container.get<QuantumNexus>(QuantumNexus);
  }

  /**
   * Get the AV10 node with quantum capabilities
   */
  static getAV10Node(): AV10Node {
    return container.get<AV10Node>(AV10Node);
  }

  /**
   * Get the quantum nexus controller
   */
  static getQuantumController(): QuantumNexusController {
    return container.get<QuantumNexusController>(QuantumNexusController);
  }

  /**
   * Get quantum configuration values
   */
  static getQuantumConfig(): any {
    return {
      parallelUniverses: container.get<string>('quantum.parallel_universes'),
      realityCollapseThreshold: container.get<string>('quantum.reality_collapse_threshold'),
      coherenceLevel: container.get<string>('quantum.coherence_level'),
      consciousnessThreshold: container.get<string>('quantum.consciousness_detection_threshold'),
      ethicsThreshold: container.get<string>('quantum.evolution_ethics_threshold'),
      consensusThreshold: container.get<string>('quantum.community_consensus_threshold')
    };
  }
}

/**
 * Initialize the container with quantum nexus capabilities
 */
export async function initializeQuantumContainer(): Promise<void> {
  try {
    // Initialize core services
    const configManager = container.get<ConfigManager>(ConfigManager);
    await configManager.initialize();

    // Initialize quantum nexus
    const quantumNexus = container.get<QuantumNexus>(QuantumNexus);
    await quantumNexus.initialize();

    // Initialize AV10 node
    const av10Node = container.get<AV10Node>(AV10Node);
    await av10Node.start();

    console.log('✅ Quantum Container initialized successfully');
    console.log('🌌 Parallel universes active');
    console.log('🧠 Consciousness interface ready');
    console.log('🔄 Autonomous evolution enabled');
    
  } catch (error) {
    console.error('❌ Failed to initialize Quantum Container:', error);
    throw error;
  }
}

// Default export
export default container;
