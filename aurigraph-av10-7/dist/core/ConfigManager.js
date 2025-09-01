"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ConfigManager = void 0;
const inversify_1 = require("inversify");
const fs_1 = require("fs");
const Logger_1 = require("./Logger");
let ConfigManager = class ConfigManager {
    logger;
    config;
    constructor() {
        this.logger = new Logger_1.Logger('ConfigManager');
        this.config = this.getDefaultConfig();
    }
    async initialize() {
        await this.loadConfiguration();
    }
    async loadConfiguration() {
        this.logger.info('Loading AV10-7 configuration...');
        // Try to load from file
        const configPath = process.env.CONFIG_PATH || './config/av10-7.json';
        if ((0, fs_1.existsSync)(configPath)) {
            try {
                const fileContent = (0, fs_1.readFileSync)(configPath, 'utf-8');
                const fileConfig = JSON.parse(fileContent);
                this.config = { ...this.config, ...fileConfig };
                this.logger.info('Configuration loaded from file');
            }
            catch (error) {
                this.logger.warn('Failed to load config file, using defaults', error);
            }
        }
        // Override with environment variables
        this.loadEnvironmentOverrides();
        // Validate configuration
        this.validateConfiguration();
        this.logger.info('Configuration loaded successfully');
    }
    getDefaultConfig() {
        return {
            node: {
                nodeType: 'validator',
                dataDir: './data',
                apiPort: 3000,
                grpcPort: 50051
            },
            consensus: {
                algorithm: 'HyperRAFT++',
                validators: [],
                electionTimeout: 150,
                heartbeatInterval: 50,
                batchSize: 10000,
                pipelineDepth: 5,
                parallelThreads: 256,
                zkProofsEnabled: true,
                aiOptimizationEnabled: true,
                quantumSecure: true
            },
            network: {
                port: 30303,
                maxPeers: 1000,
                bootstrapNodes: [],
                enableDiscovery: true
            },
            security: {
                quantumLevel: 5,
                zkProofsRequired: true,
                homomorphicEncryption: true,
                multiPartyComputation: true
            },
            performance: {
                targetTPS: 1000000,
                maxBatchSize: 50000,
                parallelExecution: true,
                cacheSize: 10000
            },
            crosschain: {
                enabled: true,
                supportedChains: [
                    'ethereum', 'polygon', 'bsc', 'avalanche',
                    'solana', 'polkadot', 'cosmos', 'near', 'algorand'
                ],
                bridgeValidators: 21
            },
            ai: {
                enabled: true,
                modelPath: './models',
                optimizationInterval: 5000,
                predictiveConsensus: true
            }
        };
    }
    loadEnvironmentOverrides() {
        if (process.env.NODE_ID) {
            this.config.node.nodeId = process.env.NODE_ID;
        }
        if (process.env.NODE_TYPE) {
            this.config.node.nodeType = process.env.NODE_TYPE;
        }
        if (process.env.API_PORT) {
            this.config.node.apiPort = parseInt(process.env.API_PORT);
        }
        if (process.env.TARGET_TPS) {
            this.config.performance.targetTPS = parseInt(process.env.TARGET_TPS);
        }
        if (process.env.QUANTUM_LEVEL) {
            this.config.security.quantumLevel = parseInt(process.env.QUANTUM_LEVEL);
        }
        if (process.env.AI_ENABLED) {
            this.config.ai.enabled = process.env.AI_ENABLED === 'true';
        }
    }
    validateConfiguration() {
        if (this.config.performance.targetTPS < 1000) {
            this.logger.warn('Target TPS is below 1000, performance may be suboptimal');
        }
        if (this.config.security.quantumLevel < 3) {
            throw new Error('Quantum security level must be at least 3');
        }
        if (this.config.consensus.parallelThreads < 1) {
            throw new Error('Parallel threads must be at least 1');
        }
    }
    getConfig() {
        return this.config;
    }
    get(path, defaultValue) {
        const keys = path.split('.');
        let current = this.config;
        for (const key of keys) {
            if (current && typeof current === 'object' && key in current) {
                current = current[key];
            }
            else {
                return defaultValue;
            }
        }
        return current;
    }
    async getNodeConfig() {
        return this.config.node;
    }
    getConsensusConfig() {
        return this.config.consensus;
    }
    getNetworkConfig() {
        return this.config.network;
    }
    getSecurityConfig() {
        return this.config.security;
    }
    getPerformanceConfig() {
        return this.config.performance;
    }
    getCrossChainConfig() {
        return this.config.crosschain;
    }
    getAIConfig() {
        return this.config.ai;
    }
};
exports.ConfigManager = ConfigManager;
exports.ConfigManager = ConfigManager = __decorate([
    (0, inversify_1.injectable)(),
    __metadata("design:paramtypes", [])
], ConfigManager);
//# sourceMappingURL=ConfigManager.js.map