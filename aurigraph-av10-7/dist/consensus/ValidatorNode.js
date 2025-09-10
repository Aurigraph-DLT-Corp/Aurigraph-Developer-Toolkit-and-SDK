"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ValidatorNode = void 0;
const Logger_1 = require("../core/Logger");
const events_1 = require("events");
class ValidatorNode extends events_1.EventEmitter {
    logger;
    nodeId;
    config;
    quantumCrypto;
    vizorMonitoring;
    currentRound = null;
    stake;
    channels = new Map(); // channelId -> userNodeIds
    isLeader = false;
    consensusState = 'idle';
    transactionQueue = [];
    constructor(config, quantumCrypto, vizorMonitoring) {
        super();
        this.nodeId = config.nodeId;
        this.config = config;
        this.stake = config.stakingAmount;
        this.quantumCrypto = quantumCrypto;
        this.vizorMonitoring = vizorMonitoring;
        this.logger = new Logger_1.Logger(`Validator-${this.nodeId}`);
    }
    async initialize() {
        try {
            this.logger.info(`Initializing validator node ${this.nodeId}`);
            // Initialize quantum crypto for this validator
            await this.quantumCrypto.initialize();
            // Setup channels
            for (const channelId of this.config.channels) {
                this.channels.set(channelId, new Set());
            }
            // Start consensus participation
            this.startConsensusParticipation();
            // Begin monitoring
            this.startMetricsCollection();
            this.logger.info(`✅ Validator ${this.nodeId} initialized with stake: ${this.stake} AV11`);
        }
        catch (error) {
            this.logger.error('Failed to initialize validator node:', error);
            throw error;
        }
    }
    async processChannelTransaction(transaction) {
        try {
            // Verify transaction signature using quantum-safe cryptography
            const isValidSignature = await this.quantumCrypto.verify(transaction.encryptedPayload.toString('hex'), transaction.signature, transaction.fromNode);
            if (!isValidSignature) {
                this.logger.warn(`Invalid signature for transaction ${transaction.id}`);
                return false;
            }
            // Decrypt and validate transaction within channel
            const channelUsers = this.channels.get(transaction.channelId);
            if (!channelUsers || !channelUsers.has(transaction.fromNode) || !channelUsers.has(transaction.toNode)) {
                this.logger.warn(`Transaction ${transaction.id} involves unauthorized channel participants`);
                return false;
            }
            // Add to transaction queue for next consensus round
            this.transactionQueue.push(transaction);
            // Record metrics
            await this.vizorMonitoring.recordMetric({
                name: 'channel_transaction_processed',
                value: 1,
                timestamp: new Date(),
                tags: {
                    validator_id: this.nodeId,
                    channel_id: transaction.channelId,
                    transaction_type: 'encrypted_channel'
                },
                type: 'counter'
            });
            this.logger.debug(`Processed channel transaction ${transaction.id} in channel ${transaction.channelId}`);
            return true;
        }
        catch (error) {
            this.logger.error(`Failed to process channel transaction ${transaction.id}:`, error);
            return false;
        }
    }
    async proposeConsensusRound() {
        if (this.consensusState !== 'idle') {
            throw new Error('Cannot propose round while consensus is active');
        }
        const roundId = `round-${Date.now()}-${this.nodeId}`;
        const transactions = this.transactionQueue.splice(0, Math.min(1000, this.transactionQueue.length));
        this.currentRound = {
            roundId,
            leaderId: this.nodeId,
            transactions,
            startTime: new Date(),
            participants: [this.nodeId],
            status: 'proposing'
        };
        this.consensusState = 'proposing';
        this.isLeader = true;
        this.logger.info(`🗳️ Proposing consensus round ${roundId} with ${transactions.length} transactions`);
        // Record consensus metrics
        await this.vizorMonitoring.recordConsensusMetrics(this.nodeId, {
            roundsPerSecond: 1,
            latencyMs: 0, // Will be updated when round completes
            stakeAmount: this.stake,
            transactionsValidated: transactions.length
        });
        this.emit('consensus-proposal', this.currentRound);
        return this.currentRound;
    }
    async voteOnRound(round, approve) {
        if (!round || this.consensusState !== 'idle') {
            return;
        }
        this.consensusState = 'voting';
        // Validate all transactions in the round
        let validTransactions = 0;
        for (const tx of round.transactions) {
            const isValid = await this.processChannelTransaction(tx);
            if (isValid)
                validTransactions++;
        }
        const vote = {
            roundId: round.roundId,
            validatorId: this.nodeId,
            approve: approve && (validTransactions === round.transactions.length),
            stake: this.stake,
            timestamp: new Date()
        };
        this.logger.info(`🗳️ Voting ${vote.approve ? 'YES' : 'NO'} on round ${round.roundId}`);
        // Record vote metrics
        await this.vizorMonitoring.recordMetric({
            name: 'consensus_votes_cast',
            value: 1,
            timestamp: new Date(),
            tags: {
                validator_id: this.nodeId,
                round_id: round.roundId,
                vote: vote.approve ? 'approve' : 'reject'
            },
            type: 'counter'
        });
        this.emit('consensus-vote', vote);
        this.consensusState = 'idle';
    }
    async commitRound(round) {
        if (round.status !== 'voting') {
            throw new Error('Round must be in voting state to commit');
        }
        this.consensusState = 'committing';
        try {
            // Process all validated transactions
            for (const tx of round.transactions) {
                await this.finalizeChannelTransaction(tx);
            }
            const commitTime = new Date();
            const latency = commitTime.getTime() - round.startTime.getTime();
            // Record consensus completion metrics
            await this.vizorMonitoring.recordConsensusMetrics(this.nodeId, {
                roundsPerSecond: 1,
                latencyMs: latency,
                stakeAmount: this.stake,
                transactionsValidated: round.transactions.length
            });
            this.logger.info(`✅ Committed round ${round.roundId} with ${round.transactions.length} transactions (${latency}ms)`);
            this.currentRound = null;
            this.consensusState = 'idle';
            this.isLeader = false;
            this.emit('consensus-commit', { round, latency });
        }
        catch (error) {
            this.logger.error(`Failed to commit round ${round.roundId}:`, error);
            this.consensusState = 'idle';
            throw error;
        }
    }
    async finalizeChannelTransaction(transaction) {
        // In a real implementation, this would update the blockchain state
        // For now, we'll just log and emit events
        this.logger.debug(`Finalizing channel transaction ${transaction.id}`);
        // Record channel metrics
        await this.vizorMonitoring.recordChannelMetrics(transaction.channelId, {
            tps: 1,
            encryptionOps: 1,
            activeUsers: this.channels.get(transaction.channelId)?.size || 0
        });
        this.emit('transaction-finalized', transaction);
    }
    addUserToChannel(channelId, userNodeId) {
        if (!this.channels.has(channelId)) {
            this.channels.set(channelId, new Set());
        }
        this.channels.get(channelId).add(userNodeId);
        this.logger.info(`Added user ${userNodeId} to channel ${channelId}`);
    }
    removeUserFromChannel(channelId, userNodeId) {
        const channelUsers = this.channels.get(channelId);
        if (channelUsers) {
            channelUsers.delete(userNodeId);
            this.logger.info(`Removed user ${userNodeId} from channel ${channelId}`);
        }
    }
    startConsensusParticipation() {
        // Simulate HyperRAFT consensus rounds
        setInterval(async () => {
            if (this.consensusState === 'idle' && this.transactionQueue.length > 0) {
                // Randomly become leader (in real implementation, this would be AI-optimized)
                const shouldLead = Math.random() < 0.1; // 10% chance to lead
                if (shouldLead) {
                    try {
                        await this.proposeConsensusRound();
                        // Simulate voting phase
                        setTimeout(async () => {
                            if (this.currentRound) {
                                await this.commitRound(this.currentRound);
                            }
                        }, 200 + Math.random() * 300); // 200-500ms consensus time
                    }
                    catch (error) {
                        this.logger.error('Consensus round failed:', error);
                        this.consensusState = 'idle';
                    }
                }
            }
        }, 1000);
    }
    startMetricsCollection() {
        setInterval(async () => {
            // Collect validator performance metrics
            const metrics = {
                queueSize: this.transactionQueue.length,
                channelCount: this.channels.size,
                totalChannelUsers: Array.from(this.channels.values()).reduce((sum, users) => sum + users.size, 0),
                isLeader: this.isLeader,
                consensusState: this.consensusState
            };
            // Record to Vizor
            await this.vizorMonitoring.recordMetric({
                name: 'validator_queue_size',
                value: metrics.queueSize,
                timestamp: new Date(),
                tags: { validator_id: this.nodeId },
                type: 'gauge'
            });
            await this.vizorMonitoring.recordMetric({
                name: 'validator_channel_users',
                value: metrics.totalChannelUsers,
                timestamp: new Date(),
                tags: { validator_id: this.nodeId },
                type: 'gauge'
            });
        }, 5000);
    }
    getStatus() {
        return {
            nodeId: this.nodeId,
            stake: this.stake,
            channels: Array.from(this.channels.keys()),
            queueSize: this.transactionQueue.length,
            consensusState: this.consensusState,
            isLeader: this.isLeader,
            uptime: process.uptime()
        };
    }
    async stop() {
        this.logger.info(`Stopping validator node ${this.nodeId}`);
        this.removeAllListeners();
    }
}
exports.ValidatorNode = ValidatorNode;
//# sourceMappingURL=ValidatorNode.js.map