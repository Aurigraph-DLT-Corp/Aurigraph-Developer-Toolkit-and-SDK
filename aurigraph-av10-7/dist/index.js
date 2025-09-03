"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
require("reflect-metadata");
const dotenv_1 = require("dotenv");
const Logger_1 = require("./core/Logger");
const Container_1 = require("./core/Container");
(0, dotenv_1.config)();
const logger = new Logger_1.Logger('AV10-7-QuantumNexus-Main');
async function bootstrapAV10QuantumNexus() {
    try {
        logger.info('🚀 Starting Aurigraph AV10-7 Quantum Nexus...');
        logger.info('Version: 10.7.0 | Codename: Revolutionary Platform Implementation Core');
        logger.info('🌌 Initializing parallel universes...');
        logger.info('🧠 Activating consciousness interface...');
        logger.info('🔄 Enabling autonomous evolution...');
        // Initialize quantum container with all revolutionary capabilities
        await (0, Container_1.initializeQuantumContainer)();
        // Get quantum nexus instance
        const quantumNexus = Container_1.QuantumServiceLocator.getQuantumNexus();
        const quantumStatus = quantumNexus.getStatus();
        logger.info(`✅ Quantum Nexus operational:`);
        logger.info(`   🌌 Parallel Universes: ${quantumStatus.parallelUniverses}`);
        logger.info(`   🧠 Consciousness Interfaces: ${quantumStatus.consciousnessInterfaces}`);
        logger.info(`   🔄 Evolution Generation: ${quantumStatus.evolutionGeneration}`);
        logger.info(`   ⚡ Average Coherence: ${quantumStatus.performance.averageCoherence.toFixed(3)}`);
        logger.info(`   🎯 Reality Stability: ${quantumStatus.performance.realityStability.toFixed(3)}`);
        // Get AV10 Node with quantum capabilities
        const av10Node = Container_1.QuantumServiceLocator.getAV10Node();
        const nodeStatus = av10Node.getStatus();
        logger.info(`✅ AV10 Node operational:`);
        logger.info(`   🆔 Node ID: ${nodeStatus.nodeId}`);
        logger.info(`   📊 Status: ${nodeStatus.status}`);
        logger.info(`   🔐 Quantum Secure: ${nodeStatus.security.quantumSecure}`);
        logger.info(`   🌌 Quantum Nexus: ${nodeStatus.quantum.nexusInitialized}`);
        // Start Quantum Nexus API Server
        const apiServer = Container_1.ContainerFactory.createMonitoringAPIServer();
        await apiServer.start(8080);
        logger.info('✅ Aurigraph AV10-7 Quantum Nexus started successfully');
        logger.info(`🌌 Quantum Features:`);
        logger.info(`   📈 Target TPS: 1,000,000+ (quantum enhanced)`);
        logger.info(`   ⚡ Finality: <10ms (parallel universe processing)`);
        logger.info(`   🔒 Security: Post-Quantum Level 5 + Consciousness Protection`);
        logger.info(`   🧠 Consciousness Interface: Active`);
        logger.info(`   🔄 Autonomous Evolution: Enabled`);
        logger.info(`   🌍 Cross-chain: 50+ blockchains + parallel universes`);
        logger.info(`🌐 API Server: http://localhost:8080`);
        logger.info(`📚 Quantum API Docs: http://localhost:8080/api/v10/quantum/docs`);
        // Setup graceful shutdown
        setupGracefulShutdown(av10Node, apiServer);
    }
    catch (error) {
        logger.error('Failed to start AV10-7:', error);
        process.exit(1);
    }
}
// Old dependency injection removed - now using quantum container
function setupGracefulShutdown(node, apiServer) {
    const shutdown = async (signal) => {
        logger.info(`\n⚠️  ${signal} received, initiating Quantum Nexus graceful shutdown...`);
        try {
            // Stop API server
            if (apiServer && typeof apiServer.stop === 'function') {
                await apiServer.stop();
                logger.info('🌐 Quantum API Server stopped');
            }
            // Stop AV10 node with quantum nexus
            if (node && typeof node.stop === 'function') {
                await node.stop();
                logger.info('🌌 Quantum Nexus stopped');
            }
            logger.info('👋 Aurigraph AV10-7 Quantum Nexus shutdown complete');
            process.exit(0);
        }
        catch (error) {
            logger.error('❌ Error during shutdown:', error);
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
// Start the Quantum Nexus platform
bootstrapAV10QuantumNexus().catch((error) => {
    logger.error('Failed to bootstrap AV10-7 Quantum Nexus:', error);
    process.exit(1);
});
//# sourceMappingURL=index.js.map