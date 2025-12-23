"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AV18Platform = void 0;
require("reflect-metadata");
const inversify_1 = require("inversify");
const Logger_1 = require("./core/Logger");
const ConfigManager_1 = require("./core/ConfigManager");
const AV18Node_1 = require("./core/AV18Node");
const QuantumCryptoManager_1 = require("./crypto/QuantumCryptoManager");
const ZKProofSystem_1 = require("./zk/ZKProofSystem");
const AIOptimizer_1 = require("./ai/AIOptimizer");
const CrossChainBridge_1 = require("./crosschain/CrossChainBridge");
const ChannelManager_1 = require("./network/ChannelManager");
const VizorDashboard_1 = require("./monitoring/VizorDashboard");
const MonitoringAPIServer_1 = require("./api/MonitoringAPIServer");
const AutonomousComplianceEngine_1 = require("./compliance/AutonomousComplianceEngine");
class AV18Platform {
    logger;
    container;
    av18Node;
    monitoringAPI;
    complianceEngine;
    isRunning = false;
    constructor() {
        this.logger = new Logger_1.Logger('AV18-Platform');
        this.container = new inversify_1.Container();
        this.setupDependencyInjection();
    }
    setupDependencyInjection() {
        this.logger.info('Setting up AV10-18 dependency injection container...');
        // Core services
        this.container.bind(Logger_1.Logger).toConstantValue(new Logger_1.Logger('AV18-Container'));
        this.container.bind(ConfigManager_1.ConfigManager).to(ConfigManager_1.ConfigManager).inSingletonScope();
        // Core components
        this.container.bind(QuantumCryptoManager_1.QuantumCryptoManager).to(QuantumCryptoManager_1.QuantumCryptoManager).inSingletonScope();
        this.container.bind(ZKProofSystem_1.ZKProofSystem).to(ZKProofSystem_1.ZKProofSystem).inSingletonScope();
        this.container.bind(AIOptimizer_1.AIOptimizer).to(AIOptimizer_1.AIOptimizer).inSingletonScope();
        this.container.bind(CrossChainBridge_1.CrossChainBridge).to(CrossChainBridge_1.CrossChainBridge).inSingletonScope();
        this.container.bind(ChannelManager_1.ChannelManager).to(ChannelManager_1.ChannelManager).inSingletonScope();
        this.container.bind(VizorDashboard_1.VizorMonitoringService).to(VizorDashboard_1.VizorMonitoringService).inSingletonScope();
        // AV10-18 enhanced services
        this.container.bind(AV18Node_1.AV18Node).to(AV18Node_1.AV18Node).inSingletonScope();
        this.container.bind(MonitoringAPIServer_1.MonitoringAPIServer).to(MonitoringAPIServer_1.MonitoringAPIServer).inSingletonScope();
        this.logger.info('AV10-18 dependency injection container configured');
    }
    async initialize() {
        this.logger.info('🚀 Initializing Aurigraph AV10-18 Platform...');
        try {
            // Initialize core services
            await this.initializeCoreServices();
            // Initialize AV10-18 node
            this.av18Node = this.container.get(AV18Node_1.AV18Node);
            // Initialize autonomous compliance engine
            await this.initializeComplianceEngine();
            // Initialize monitoring API
            this.monitoringAPI = this.container.get(MonitoringAPIServer_1.MonitoringAPIServer);
            this.logger.info('✅ AV10-18 Platform initialization complete');
        }
        catch (error) {
            this.logger.error('❌ Failed to initialize AV10-18 Platform:', error);
            throw error;
        }
    }
    async initializeCoreServices() {
        this.logger.info('Initializing AV10-18 core services...');
        // Initialize quantum crypto (original for compatibility)
        const quantumCrypto = new QuantumCryptoManager_1.QuantumCryptoManager();
        await quantumCrypto.initialize();
        // Initialize ZK proof system
        const zkProofSystem = this.container.get(ZKProofSystem_1.ZKProofSystem);
        await zkProofSystem.initialize();
        // Initialize AI optimizer
        const aiOptimizer = this.container.get(AIOptimizer_1.AIOptimizer);
        await aiOptimizer.initialize();
        // Initialize monitoring service
        const monitoring = this.container.get(VizorDashboard_1.VizorMonitoringService);
        // Initialize cross-chain bridge
        const crossChainBridge = this.container.get(CrossChainBridge_1.CrossChainBridge);
        await crossChainBridge.initialize();
        // Initialize channel manager with dependencies
        const channelManager = new ChannelManager_1.ChannelManager(quantumCrypto, monitoring);
        await channelManager.initialize();
        this.logger.info('Core services initialized');
    }
    async initializeComplianceEngine() {
        this.logger.info('Initializing Autonomous Compliance Engine...');
        const quantumCrypto = this.container.get(QuantumCryptoManager_1.QuantumCryptoManager);
        const aiOptimizer = this.container.get(AIOptimizer_1.AIOptimizer);
        this.complianceEngine = new AutonomousComplianceEngine_1.AutonomousComplianceEngine({
            jurisdictions: ['US', 'EU', 'UK', 'CA', 'AU', 'SG', 'JP'],
            kycLevel: 'institutional',
            amlThreshold: 0.7,
            reportingFrequency: 'realtime',
            sanctionListUpdate: 'automatic',
            auditTrailRetention: 2555, // 7 years
            riskTolerance: 'low',
            regulatoryFrameworks: ['MiCA', 'CBDC', 'DeFi-Regulation', 'AML6', 'GDPR']
        }, aiOptimizer, quantumCrypto);
        await this.complianceEngine.start();
        this.logger.info('Autonomous Compliance Engine initialized');
    }
    async start() {
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
        }
        catch (error) {
            this.logger.error('❌ Failed to start AV10-18 Platform:', error);
            await this.cleanup();
            throw error;
        }
    }
    displayStartupInfo() {
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
    startRealTimeMonitoring() {
        // Real-time platform monitoring every 10 seconds
        setInterval(() => {
            if (!this.isRunning)
                return;
            this.displayRealTimeMetrics();
        }, 10000);
    }
    displayRealTimeMetrics() {
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
    async stop() {
        if (!this.isRunning) {
            this.logger.warn('AV10-18 Platform is not running');
            return;
        }
        this.logger.info('🛑 Stopping AV10-18 Platform...');
        this.isRunning = false;
        await this.cleanup();
        this.logger.info('✅ AV10-18 Platform stopped successfully');
    }
    async cleanup() {
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
        }
        catch (error) {
            this.logger.error('Error during cleanup:', error);
        }
    }
    getStatus() {
        return {
            platform: 'AV10-18',
            version: '10.18.0',
            isRunning: this.isRunning,
            node: this.av18Node ? this.av18Node.getEnhancedStatus() : null,
            compliance: this.complianceEngine ? this.complianceEngine.getComplianceStatus() : null,
            timestamp: new Date()
        };
    }
    async generateStatusReport() {
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
exports.AV18Platform = AV18Platform;
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
    }
    catch (error) {
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
//# sourceMappingURL=index-av18.js.map