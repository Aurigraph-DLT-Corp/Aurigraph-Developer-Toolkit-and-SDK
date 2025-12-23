"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChannelManager = void 0;
const Logger_1 = require("../core/Logger");
const events_1 = require("events");
class ChannelManager extends events_1.EventEmitter {
    logger;
    userNodes = new Map();
    channels = new Map();
    channelKeys = new Map();
    messageQueue = new Map();
    quantumCrypto;
    vizorMonitoring;
    processingInterval = null;
    constructor(quantumCrypto, vizorMonitoring) {
        super();
        this.quantumCrypto = quantumCrypto;
        this.vizorMonitoring = vizorMonitoring;
        this.logger = new Logger_1.Logger('ChannelManager');
    }
    async initialize() {
        try {
            this.logger.info('🔐 Initializing encrypted channel management');
            // Setup default channels with quantum-safe encryption keys
            await this.createSecureChannel('channel-alpha', ['user-1', 'user-2', 'user-3']);
            await this.createSecureChannel('channel-beta', ['user-2', 'user-4', 'user-5']);
            await this.createSecureChannel('channel-gamma', ['user-3', 'user-5', 'user-6']);
            // Start message processing
            this.startMessageProcessing();
            // Start metrics collection
            this.startChannelMetrics();
            this.logger.info('✅ Channel manager initialized with encrypted communication');
        }
        catch (error) {
            this.logger.error('Failed to initialize channel manager:', error);
            throw error;
        }
    }
    async createSecureChannel(channelId, userNodeIds) {
        try {
            // Generate quantum-safe shared encryption key for channel
            const channelKey = await this.quantumCrypto.generateChannelKey();
            this.channelKeys.set(channelId, channelKey);
            this.messageQueue.set(channelId, []);
            // Register user nodes in the channel
            for (const userNodeId of userNodeIds) {
                await this.registerUserNode(userNodeId, channelId);
            }
            this.logger.info(`🔑 Created secure channel ${channelId} with ${userNodeIds.length} users`);
            // Record channel metrics
            await this.vizorMonitoring.recordChannelMetrics(channelId, {
                tps: 0,
                encryptionOps: 0,
                activeUsers: userNodeIds.length
            });
        }
        catch (error) {
            this.logger.error(`Failed to create secure channel ${channelId}:`, error);
            throw error;
        }
    }
    async registerUserNode(userNodeId, channelId) {
        try {
            let userNode = this.userNodes.get(userNodeId);
            if (!userNode) {
                // Generate quantum-safe key pair for new user
                const keyPair = await this.quantumCrypto.generateKyberKeyPair();
                userNode = {
                    nodeId: userNodeId,
                    publicKey: keyPair.publicKey,
                    channels: new Set([channelId]),
                    lastSeen: new Date(),
                    encryptionCapabilities: ['CRYSTALS-Kyber', 'AES-256-GCM', 'ChaCha20-Poly1305']
                };
                this.userNodes.set(userNodeId, userNode);
                this.logger.info(`👤 Registered new user node ${userNodeId}`);
            }
            else {
                userNode.channels.add(channelId);
                userNode.lastSeen = new Date();
            }
            // Record user metrics
            await this.vizorMonitoring.recordMetric({
                name: 'channel_user_registered',
                value: 1,
                timestamp: new Date(),
                tags: { channel_id: channelId, user_id: userNodeId },
                type: 'counter'
            });
        }
        catch (error) {
            this.logger.error(`Failed to register user node ${userNodeId}:`, error);
            throw error;
        }
    }
    async encryptAndRouteTransaction(fromNodeId, toNodeId, channelId, transactionData) {
        try {
            const fromNode = this.userNodes.get(fromNodeId);
            const toNode = this.userNodes.get(toNodeId);
            const channelKey = this.channelKeys.get(channelId);
            if (!fromNode || !toNode || !channelKey) {
                throw new Error('Invalid nodes or channel for transaction');
            }
            if (!fromNode.channels.has(channelId) || !toNode.channels.has(channelId)) {
                throw new Error('Nodes not authorized for this channel');
            }
            // Encrypt transaction payload using channel's quantum-safe key
            const serializedData = JSON.stringify(transactionData);
            const encryptedPayload = await this.quantumCrypto.encryptWithChannel(Buffer.from(serializedData, 'utf8'), channelKey);
            // Create quantum-safe signature
            const signature = await this.quantumCrypto.sign(encryptedPayload.toString('hex'), fromNodeId);
            const channelTransaction = {
                id: `tx-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                channelId,
                fromNode: fromNodeId,
                toNode: toNodeId,
                encryptedPayload,
                signature,
                timestamp: new Date(),
                nonce: Math.random().toString(36).substr(2, 16)
            };
            // Record encryption metrics
            await this.vizorMonitoring.recordChannelMetrics(channelId, {
                tps: 1,
                encryptionOps: 1,
                activeUsers: this.userNodes.size
            });
            this.logger.debug(`🔒 Encrypted transaction ${channelTransaction.id} for channel ${channelId}`);
            this.emit('encrypted-transaction', channelTransaction);
            return channelTransaction;
        }
        catch (error) {
            this.logger.error('Failed to encrypt and route transaction:', error);
            throw error;
        }
    }
    async decryptTransactionForValidator(transaction, validatorId) {
        try {
            const channelKey = this.channelKeys.get(transaction.channelId);
            if (!channelKey) {
                throw new Error(`Channel key not found for ${transaction.channelId}`);
            }
            // Decrypt using quantum-safe decryption
            const decryptedBuffer = await this.quantumCrypto.decryptWithChannel(transaction.encryptedPayload, channelKey);
            const transactionData = JSON.parse(decryptedBuffer.toString('utf8'));
            this.logger.debug(`🔓 Decrypted transaction ${transaction.id} for validator ${validatorId}`);
            return transactionData;
        }
        catch (error) {
            this.logger.error(`Failed to decrypt transaction ${transaction.id}:`, error);
            throw error;
        }
    }
    startMessageProcessing() {
        this.processingInterval = setInterval(async () => {
            for (const [channelId, messages] of this.messageQueue) {
                if (messages.length > 0) {
                    // Process messages in batches for efficiency
                    const batch = messages.splice(0, Math.min(100, messages.length));
                    for (const message of batch) {
                        try {
                            // Convert message to channel transaction
                            const transaction = await this.encryptAndRouteTransaction(message.fromNode, message.toNode, channelId, { messageContent: message.encryptedContent });
                            this.emit('message-to-transaction', { message, transaction });
                        }
                        catch (error) {
                            this.logger.error(`Failed to process message ${message.messageId}:`, error);
                        }
                    }
                }
            }
        }, 1000);
    }
    startChannelMetrics() {
        setInterval(async () => {
            for (const [channelId, channel] of this.channels) {
                const messageCount = this.messageQueue.get(channelId)?.length || 0;
                const channelData = this.channels.get(channelId);
                if (channelData) {
                    await this.vizorMonitoring.recordChannelMetrics(channelId, {
                        tps: Math.floor(Math.random() * 1000), // Simulated TPS
                        encryptionOps: Math.floor(Math.random() * 500),
                        activeUsers: channelData.userNodes.size
                    });
                }
            }
            // Record overall channel manager metrics
            await this.vizorMonitoring.recordMetric({
                name: 'total_active_channels',
                value: this.channels.size,
                timestamp: new Date(),
                tags: { manager: 'channel' },
                type: 'gauge'
            });
            await this.vizorMonitoring.recordMetric({
                name: 'total_user_nodes',
                value: this.userNodes.size,
                timestamp: new Date(),
                tags: { manager: 'channel' },
                type: 'gauge'
            });
        }, 5000);
    }
    getChannelStatus(channelId) {
        const channel = this.channels.get(channelId);
        if (!channel)
            return null;
        const messages = this.messageQueue.get(channelId) || [];
        return {
            id: channelId,
            name: channel.name,
            userCount: channel.userNodes.size,
            validatorCount: channel.validators.size,
            maxThroughput: channel.maxThroughput,
            queuedMessages: messages.length,
            created: channel.created,
            users: Array.from(channel.userNodes),
            validators: Array.from(channel.validators)
        };
    }
    getAllChannelStatuses() {
        return Array.from(this.channels.keys()).map(channelId => this.getChannelStatus(channelId));
    }
    async stop() {
        this.logger.info('🛑 Stopping channel manager');
        if (this.processingInterval) {
            clearInterval(this.processingInterval);
            this.processingInterval = null;
        }
        this.removeAllListeners();
    }
}
exports.ChannelManager = ChannelManager;
//# sourceMappingURL=ChannelManager.js.map