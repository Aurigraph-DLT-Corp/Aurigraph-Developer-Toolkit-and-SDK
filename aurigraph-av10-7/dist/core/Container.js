"use strict";
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.QuantumServiceLocator = exports.ContainerFactory = exports.container = void 0;
exports.initializeQuantumContainer = initializeQuantumContainer;
const inversify_1 = require("inversify");
require("reflect-metadata");
// Core components
const Logger_1 = require("./Logger");
const ConfigManager_1 = require("./ConfigManager");
const AV10Node_1 = require("./AV10Node");
const QuantumNexus_1 = require("./QuantumNexus");
// Consensus components
const HyperRAFTPlusPlus_1 = require("../consensus/HyperRAFTPlusPlus");
const ValidatorNode_1 = require("../consensus/ValidatorNode");
const ValidatorOrchestrator_1 = require("../consensus/ValidatorOrchestrator");
// Crypto components
const QuantumCryptoManager_1 = require("../crypto/QuantumCryptoManager");
// ZK components
const ZKProofSystem_1 = require("../zk/ZKProofSystem");
// Cross-chain components
const CrossChainBridge_1 = require("../crosschain/CrossChainBridge");
// AI components
const AIOptimizer_1 = require("../ai/AIOptimizer");
// Network components
const NetworkOrchestrator_1 = require("../network/NetworkOrchestrator");
const ChannelManager_1 = require("../network/ChannelManager");
// Monitoring components
const MonitoringService_1 = require("../monitoring/MonitoringService");
const VizorDashboard_1 = require("../monitoring/VizorDashboard");
// API components
const QuantumNexusController_1 = require("../api/QuantumNexusController");
const VizorAPIEndpoints_1 = require("../api/VizorAPIEndpoints");
const MonitoringAPIServer_1 = require("../api/MonitoringAPIServer");
// Create container instance
const container = new inversify_1.Container();
exports.container = container;
// Bind core components
container.bind(Logger_1.Logger).toSelf().inSingletonScope();
container.bind(ConfigManager_1.ConfigManager).toSelf().inSingletonScope();
container.bind(AV10Node_1.AV10Node).toSelf().inSingletonScope();
container.bind(QuantumNexus_1.QuantumNexus).toSelf().inSingletonScope();
// Bind consensus components
container.bind(HyperRAFTPlusPlus_1.HyperRAFTPlusPlus).toSelf().inSingletonScope();
container.bind(ValidatorNode_1.ValidatorNode).toSelf().inSingletonScope();
container.bind(ValidatorOrchestrator_1.ValidatorOrchestrator).toSelf().inSingletonScope();
// Bind crypto components
container.bind(QuantumCryptoManager_1.QuantumCryptoManager).toSelf().inSingletonScope();
// Bind ZK components
container.bind(ZKProofSystem_1.ZKProofSystem).toSelf().inSingletonScope();
// Bind cross-chain components
container.bind(CrossChainBridge_1.CrossChainBridge).toSelf().inSingletonScope();
// Bind AI components
container.bind(AIOptimizer_1.AIOptimizer).toSelf().inSingletonScope();
// Bind network components
container.bind(NetworkOrchestrator_1.NetworkOrchestrator).toSelf().inSingletonScope();
container.bind(ChannelManager_1.ChannelManager).toSelf().inSingletonScope();
// Bind monitoring components
container.bind(MonitoringService_1.MonitoringService).toSelf().inSingletonScope();
container.bind(VizorDashboard_1.VizorMonitoringService).toSelf().inSingletonScope();
// Bind API components
container.bind(QuantumNexusController_1.QuantumNexusController).toSelf().inSingletonScope();
container.bind(VizorAPIEndpoints_1.VizorAPIEndpoints).toSelf().inSingletonScope();
container.bind(MonitoringAPIServer_1.MonitoringAPIServer).toSelf().inSingletonScope();
// Container configuration for quantum nexus
container.bind('quantum.parallel_universes').toConstantValue('5');
container.bind('quantum.reality_collapse_threshold').toConstantValue('0.95');
container.bind('quantum.coherence_level').toConstantValue('maximum');
container.bind('quantum.consciousness_detection_threshold').toConstantValue('0.5');
container.bind('quantum.evolution_ethics_threshold').toConstantValue('0.999');
container.bind('quantum.community_consensus_threshold').toConstantValue('0.6');
/**
 * Container factory for creating configured instances
 */
class ContainerFactory {
    /**
     * Create a fully configured AV10 Node with Quantum Nexus
     */
    static async createAV10Node() {
        const node = container.get(AV10Node_1.AV10Node);
        await node.start();
        return node;
    }
    /**
     * Create a standalone Quantum Nexus instance
     */
    static async createQuantumNexus() {
        const nexus = container.get(QuantumNexus_1.QuantumNexus);
        await nexus.initialize();
        return nexus;
    }
    /**
     * Create a monitoring API server with quantum endpoints
     */
    static createMonitoringAPIServer() {
        return container.get(MonitoringAPIServer_1.MonitoringAPIServer);
    }
    /**
     * Create a quantum nexus controller
     */
    static createQuantumNexusController() {
        return container.get(QuantumNexusController_1.QuantumNexusController);
    }
    /**
     * Get container instance for manual dependency resolution
     */
    static getContainer() {
        return container;
    }
}
exports.ContainerFactory = ContainerFactory;
/**
 * Quantum Nexus Service Locator
 * Provides easy access to quantum-specific services
 */
class QuantumServiceLocator {
    /**
     * Get the quantum nexus instance
     */
    static getQuantumNexus() {
        return container.get(QuantumNexus_1.QuantumNexus);
    }
    /**
     * Get the AV10 node with quantum capabilities
     */
    static getAV10Node() {
        return container.get(AV10Node_1.AV10Node);
    }
    /**
     * Get the quantum nexus controller
     */
    static getQuantumController() {
        return container.get(QuantumNexusController_1.QuantumNexusController);
    }
    /**
     * Get quantum configuration values
     */
    static getQuantumConfig() {
        return {
            parallelUniverses: container.get('quantum.parallel_universes'),
            realityCollapseThreshold: container.get('quantum.reality_collapse_threshold'),
            coherenceLevel: container.get('quantum.coherence_level'),
            consciousnessThreshold: container.get('quantum.consciousness_detection_threshold'),
            ethicsThreshold: container.get('quantum.evolution_ethics_threshold'),
            consensusThreshold: container.get('quantum.community_consensus_threshold')
        };
    }
}
exports.QuantumServiceLocator = QuantumServiceLocator;
/**
 * Initialize the container with quantum nexus capabilities
 */
async function initializeQuantumContainer() {
    try {
        // Initialize core services
        const configManager = container.get(ConfigManager_1.ConfigManager);
        await configManager.initialize();
        // Initialize quantum nexus
        const quantumNexus = container.get(QuantumNexus_1.QuantumNexus);
        await quantumNexus.initialize();
        // Initialize AV10 node
        const av10Node = container.get(AV10Node_1.AV10Node);
        await av10Node.start();
        console.log('✅ Quantum Container initialized successfully');
        console.log('🌌 Parallel universes active');
        console.log('🧠 Consciousness interface ready');
        console.log('🔄 Autonomous evolution enabled');
    }
    catch (error) {
        console.error('❌ Failed to initialize Quantum Container:', error);
        throw error;
    }
}
// Default export
exports.default = container;
//# sourceMappingURL=Container.js.map