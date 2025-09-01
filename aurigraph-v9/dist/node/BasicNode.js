"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BasicNode = void 0;
const events_1 = require("events");
const Logger_1 = require("../utils/Logger");
const types_1 = require("./types");
class BasicNode extends events_1.EventEmitter {
    logger;
    constructor(configManager, networkManager, monitoringService) {
        super();
        this.logger = new Logger_1.Logger('BasicNode');
    }
    async initialize() {
        this.logger.info('Initializing Basic Node...');
    }
    async start() {
        this.logger.info('Starting Basic Node...');
    }
    async stop() {
        this.logger.info('Stopping Basic Node...');
    }
    async getHealth() {
        return {
            healthy: true,
            uptime: 0,
            memoryUsage: 0,
            cpuUsage: 0,
            diskUsage: 0,
            networkLatency: 0,
            lastBlockHeight: 0,
            peersConnected: 0,
            transactionPoolSize: 0
        };
    }
    async getNodeInfo() {
        return {
            nodeId: 'basic-1',
            nodeType: types_1.NodeType.BASIC,
            version: '9.0.0',
            networkId: 'aurigraph-mainnet',
            chainId: 1,
            genesisHash: '',
            currentBlockHeight: 0,
            currentBlockHash: '',
            peers: [],
            capabilities: ['api-access', 'transaction-relay']
        };
    }
}
exports.BasicNode = BasicNode;
//# sourceMappingURL=BasicNode.js.map