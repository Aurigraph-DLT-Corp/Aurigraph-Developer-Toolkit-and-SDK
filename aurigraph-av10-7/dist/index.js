"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
require("reflect-metadata");
const inversify_1 = require("inversify");
const dotenv_1 = require("dotenv");
const AV10Node_1 = require("./core/AV10Node");
const Logger_1 = require("./core/Logger");
const ConfigManager_1 = require("./core/ConfigManager");
const NetworkOrchestrator_1 = require("./network/NetworkOrchestrator");
const MonitoringService_1 = require("./monitoring/MonitoringService");
const QuantumCryptoManager_1 = require("./crypto/QuantumCryptoManager");
const CrossChainBridge_1 = require("./crosschain/CrossChainBridge");
const ZKProofSystem_1 = require("./zk/ZKProofSystem");
const AIOptimizer_1 = require("./ai/AIOptimizer");
(0, dotenv_1.config)();
const logger = new Logger_1.Logger('AV10-7-Main');
const container = new inversify_1.Container();
async function bootstrapAV10() {
    try {
        logger.info('🚀 Starting Aurigraph AV10-7 Quantum Nexus...');
        logger.info('Version: 10.7.0 | Codename: Quantum Nexus');
        // Initialize dependency injection container
        await setupDependencyInjection();
        // Load configuration
        const configManager = container.get(ConfigManager_1.ConfigManager);
        await configManager.loadConfiguration();
        // Initialize quantum cryptography
        const quantumCrypto = container.get(QuantumCryptoManager_1.QuantumCryptoManager);
        await quantumCrypto.initialize();
        logger.info('🔐 Quantum cryptography initialized');
        // Setup network orchestrator
        const networkOrchestrator = container.get(NetworkOrchestrator_1.NetworkOrchestrator);
        await networkOrchestrator.initialize();
        logger.info('🌐 Network orchestrator initialized');
        // Initialize ZK proof system
        const zkProofSystem = container.get(ZKProofSystem_1.ZKProofSystem);
        await zkProofSystem.initialize();
        logger.info('🎭 Zero-knowledge proof system initialized');
        // Start AI optimizer
        const aiOptimizer = container.get(AIOptimizer_1.AIOptimizer);
        await aiOptimizer.start();
        logger.info('🤖 AI optimizer started');
        // Initialize cross-chain bridge
        const crossChainBridge = container.get(CrossChainBridge_1.CrossChainBridge);
        await crossChainBridge.initialize();
        logger.info('🌉 Cross-chain bridge initialized');
        // Start monitoring service
        const monitoringService = container.get(MonitoringService_1.MonitoringService);
        await monitoringService.start();
        logger.info('📊 Monitoring service started');
        // Start main node
        const node = container.get(AV10Node_1.AV10Node);
        await node.start();
        logger.info('✅ Aurigraph AV10-7 started successfully');
        logger.info(`📈 Target TPS: 1,000,000+ | Finality: <500ms`);
        logger.info(`🔒 Security: Post-Quantum Level 5 | Privacy: ZK-Enabled`);
        logger.info(`🌍 Cross-chain: 50+ blockchains supported`);
        // Setup graceful shutdown
        setupGracefulShutdown(node);
    }
    catch (error) {
        logger.error('Failed to start AV10-7:', error);
        process.exit(1);
    }
}
async function setupDependencyInjection() {
    // Import consensus module
    const { HyperRAFTPlusPlus } = await Promise.resolve().then(() => __importStar(require('./consensus/HyperRAFTPlusPlus')));
    // Core services
    container.bind(ConfigManager_1.ConfigManager).to(ConfigManager_1.ConfigManager).inSingletonScope();
    container.bind(AV10Node_1.AV10Node).to(AV10Node_1.AV10Node).inSingletonScope();
    // Network services
    container.bind(NetworkOrchestrator_1.NetworkOrchestrator).to(NetworkOrchestrator_1.NetworkOrchestrator).inSingletonScope();
    // Consensus services
    container.bind('HyperRAFTPlusPlus').to(HyperRAFTPlusPlus).inSingletonScope();
    // Cryptography services
    container.bind(QuantumCryptoManager_1.QuantumCryptoManager).to(QuantumCryptoManager_1.QuantumCryptoManager).inSingletonScope();
    container.bind(ZKProofSystem_1.ZKProofSystem).to(ZKProofSystem_1.ZKProofSystem).inSingletonScope();
    // Cross-chain services
    container.bind(CrossChainBridge_1.CrossChainBridge).to(CrossChainBridge_1.CrossChainBridge).inSingletonScope();
    // AI services
    container.bind(AIOptimizer_1.AIOptimizer).to(AIOptimizer_1.AIOptimizer).inSingletonScope();
    // Monitoring services
    container.bind(MonitoringService_1.MonitoringService).to(MonitoringService_1.MonitoringService).inSingletonScope();
}
function setupGracefulShutdown(node) {
    const shutdown = async (signal) => {
        logger.info(`\n⚠️  ${signal} received, initiating graceful shutdown...`);
        try {
            await node.stop();
            logger.info('👋 Aurigraph AV10-7 shutdown complete');
            process.exit(0);
        }
        catch (error) {
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
//# sourceMappingURL=index.js.map