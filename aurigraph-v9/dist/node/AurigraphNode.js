"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AurigraphNode = void 0;
const events_1 = require("events");
const ValidatorNode_1 = require("./ValidatorNode");
const BasicNode_1 = require("./BasicNode");
const ASMNode_1 = require("./ASMNode");
const Logger_1 = require("../utils/Logger");
const types_1 = require("./types");
class AurigraphNode extends events_1.EventEmitter {
    logger;
    configManager;
    networkManager;
    monitoringService;
    nodeImplementation;
    status = types_1.NodeStatus.INITIALIZING;
    constructor(configManager, networkManager, monitoringService) {
        super();
        this.logger = new Logger_1.Logger('AurigraphNode');
        this.configManager = configManager;
        this.networkManager = networkManager;
        this.monitoringService = monitoringService;
    }
    async start() {
        this.logger.info('Starting Aurigraph Node...');
        const nodeConfig = this.configManager.getNodeConfig();
        switch (nodeConfig.nodeType) {
            case types_1.NodeType.VALIDATOR:
                this.nodeImplementation = new ValidatorNode_1.ValidatorNode(this.configManager, this.networkManager, this.monitoringService);
                break;
            case types_1.NodeType.BASIC:
                this.nodeImplementation = new BasicNode_1.BasicNode(this.configManager, this.networkManager, this.monitoringService);
                break;
            case types_1.NodeType.ASM:
                this.nodeImplementation = new ASMNode_1.ASMNode(this.configManager, this.networkManager, this.monitoringService);
                break;
            default:
                throw new Error(`Unknown node type: ${nodeConfig.nodeType}`);
        }
        await this.nodeImplementation.initialize();
        await this.nodeImplementation.start();
        this.status = types_1.NodeStatus.RUNNING;
        this.emit('started');
        this.setupEventHandlers();
        this.startHealthCheck();
    }
    async stop() {
        this.logger.info('Stopping Aurigraph Node...');
        this.status = types_1.NodeStatus.STOPPING;
        if (this.nodeImplementation) {
            await this.nodeImplementation.stop();
        }
        await this.networkManager.disconnect();
        await this.monitoringService.stop();
        this.status = types_1.NodeStatus.STOPPED;
        this.emit('stopped');
    }
    setupEventHandlers() {
        if (!this.nodeImplementation)
            return;
        this.nodeImplementation.on('transaction', (tx) => {
            this.monitoringService.recordTransaction(tx);
        });
        this.nodeImplementation.on('block', (block) => {
            this.monitoringService.recordBlock(block);
        });
        this.nodeImplementation.on('consensus', (event) => {
            this.monitoringService.recordConsensusEvent(event);
        });
        this.nodeImplementation.on('error', (error) => {
            this.logger.error('Node error:', error);
            this.monitoringService.recordError(error);
        });
    }
    startHealthCheck() {
        setInterval(async () => {
            if (this.nodeImplementation && this.status === types_1.NodeStatus.RUNNING) {
                const health = await this.nodeImplementation.getHealth();
                this.monitoringService.recordHealthCheck(health);
                if (!health.healthy) {
                    this.logger.warn('Node health check failed:', health);
                    this.emit('unhealthy', health);
                }
            }
        }, 10000);
    }
    getStatus() {
        return this.status;
    }
    async getNodeInfo() {
        if (!this.nodeImplementation) {
            throw new Error('Node not initialized');
        }
        return this.nodeImplementation.getNodeInfo();
    }
}
exports.AurigraphNode = AurigraphNode;
//# sourceMappingURL=AurigraphNode.js.map