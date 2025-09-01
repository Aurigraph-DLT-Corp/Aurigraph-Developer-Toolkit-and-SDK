"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ValidatorNode = void 0;
const events_1 = require("events");
const RAFTConsensus_1 = require("../consensus/RAFTConsensus");
const ShardManager_1 = require("../consensus/ShardManager");
const TransactionProcessor_1 = require("../core/TransactionProcessor");
const BlockProducer_1 = require("../core/BlockProducer");
const StateManager_1 = require("../core/StateManager");
const Logger_1 = require("../utils/Logger");
const types_1 = require("./types");
class ValidatorNode extends events_1.EventEmitter {
    logger;
    configManager;
    networkManager;
    monitoringService;
    consensus;
    shardManager;
    transactionProcessor;
    blockProducer;
    stateManager;
    startTime;
    constructor(configManager, networkManager, monitoringService) {
        super();
        this.logger = new Logger_1.Logger('ValidatorNode');
        this.configManager = configManager;
        this.networkManager = networkManager;
        this.monitoringService = monitoringService;
        this.startTime = new Date();
        this.stateManager = new StateManager_1.StateManager(configManager);
        const consensusConfig = configManager.getConsensusConfig();
        this.consensus = new RAFTConsensus_1.RAFTConsensus(consensusConfig);
        const shardingConfig = configManager.getShardingConfig();
        this.shardManager = new ShardManager_1.ShardManager(shardingConfig);
        this.transactionProcessor = new TransactionProcessor_1.TransactionProcessor(this.shardManager, this.stateManager);
        this.blockProducer = new BlockProducer_1.BlockProducer(this.consensus, this.transactionProcessor, this.stateManager);
    }
    async initialize() {
        this.logger.info('Initializing Validator Node...');
        await this.stateManager.initialize();
        await this.shardManager.initialize();
        await this.consensus.initialize();
        this.setupConsensusHandlers();
        this.setupTransactionHandlers();
        this.setupBlockHandlers();
        this.logger.info('Validator Node initialized');
    }
    async start() {
        this.logger.info('Starting Validator Node...');
        await this.consensus.start();
        await this.shardManager.start();
        await this.blockProducer.start();
        await this.transactionProcessor.start();
        await this.joinValidatorSet();
        this.logger.info('Validator Node started');
        this.emit('started');
    }
    async stop() {
        this.logger.info('Stopping Validator Node...');
        await this.leaveValidatorSet();
        await this.blockProducer.stop();
        await this.transactionProcessor.stop();
        await this.shardManager.stop();
        await this.consensus.stop();
        this.logger.info('Validator Node stopped');
        this.emit('stopped');
    }
    async joinValidatorSet() {
        const validatorConfig = this.configManager.getValidatorConfig();
        if (!validatorConfig) {
            throw new Error('Validator configuration not found');
        }
        const joinRequest = {
            nodeId: this.configManager.getNodeConfig().nodeId,
            stake: validatorConfig.stake,
            rewardAddress: validatorConfig.rewardAddress,
            consensusKey: validatorConfig.consensusKey,
            timestamp: Date.now()
        };
        await this.consensus.requestJoinValidatorSet(joinRequest);
        this.logger.info('Joined validator set');
    }
    async leaveValidatorSet() {
        const nodeId = this.configManager.getNodeConfig().nodeId;
        await this.consensus.requestLeaveValidatorSet(nodeId);
        this.logger.info('Left validator set');
    }
    setupConsensusHandlers() {
        this.consensus.on('leader', () => {
            this.logger.info('Node elected as leader');
            this.blockProducer.enableBlockProduction();
            this.emit('leader');
        });
        this.consensus.on('follower', () => {
            this.logger.info('Node is follower');
            this.blockProducer.disableBlockProduction();
            this.emit('follower');
        });
        this.consensus.on('consensus-achieved', (result) => {
            this.emit('consensus', result);
            this.monitoringService.recordConsensusEvent({
                type: 'consensus-achieved',
                data: result
            });
        });
    }
    setupTransactionHandlers() {
        this.transactionProcessor.on('transaction-validated', (tx) => {
            this.emit('transaction', tx);
        });
        this.transactionProcessor.on('transaction-executed', (result) => {
            this.stateManager.applyStateTransition(result.stateTransition);
        });
        this.networkManager.on('transaction', async (tx) => {
            await this.transactionProcessor.processTransaction(tx);
        });
    }
    setupBlockHandlers() {
        this.blockProducer.on('block-produced', async (block) => {
            await this.consensus.proposeBlock(block);
            this.emit('block', block);
        });
        this.consensus.on('block-committed', async (block) => {
            await this.stateManager.commitBlock(block);
            await this.networkManager.broadcastBlock(block);
        });
    }
    async getHealth() {
        const nodeConfig = this.configManager.getNodeConfig();
        const consensusHealth = await this.consensus.getHealth();
        const stateHealth = await this.stateManager.getHealth();
        return {
            healthy: consensusHealth.healthy && stateHealth.healthy,
            uptime: Date.now() - this.startTime.getTime(),
            memoryUsage: process.memoryUsage().heapUsed / 1024 / 1024,
            cpuUsage: process.cpuUsage().user / 1000000,
            diskUsage: stateHealth.diskUsage,
            networkLatency: await this.networkManager.getAverageLatency(),
            consensusParticipation: consensusHealth.participation,
            lastBlockHeight: stateHealth.lastBlockHeight,
            peersConnected: await this.networkManager.getPeerCount(),
            transactionPoolSize: this.transactionProcessor.getPoolSize()
        };
    }
    async getNodeInfo() {
        const nodeConfig = this.configManager.getNodeConfig();
        const chainInfo = await this.stateManager.getChainInfo();
        const peers = await this.networkManager.getPeers();
        return {
            nodeId: nodeConfig.nodeId,
            nodeType: types_1.NodeType.VALIDATOR,
            version: '9.0.0',
            networkId: nodeConfig.networkId,
            chainId: chainInfo.chainId,
            genesisHash: chainInfo.genesisHash,
            currentBlockHeight: chainInfo.currentBlockHeight,
            currentBlockHash: chainInfo.currentBlockHash,
            peers: peers,
            capabilities: [
                'consensus',
                'block-production',
                'transaction-validation',
                'state-management',
                'sharding',
                'high-throughput'
            ]
        };
    }
}
exports.ValidatorNode = ValidatorNode;
//# sourceMappingURL=ValidatorNode.js.map