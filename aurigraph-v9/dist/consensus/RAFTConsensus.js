"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RAFTConsensus = void 0;
const events_1 = require("events");
const Logger_1 = require("../utils/Logger");
const types_1 = require("./types");
class RAFTConsensus extends events_1.EventEmitter {
    logger;
    config;
    state;
    currentTerm = 0;
    votedFor = null;
    log = [];
    commitIndex = 0;
    lastApplied = 0;
    nextIndex = new Map();
    matchIndex = new Map();
    electionTimer;
    heartbeatTimer;
    batchBuffer = [];
    pipelineDepth = 3;
    constructor(config) {
        super();
        this.logger = new Logger_1.Logger('RAFTConsensus');
        this.config = config;
        this.state = types_1.ConsensusState.FOLLOWER;
    }
    async initialize() {
        this.logger.info('Initializing RAFT consensus...');
        this.startElectionTimer();
    }
    async start() {
        this.logger.info('Starting RAFT consensus...');
        this.state = types_1.ConsensusState.FOLLOWER;
        this.emit('follower');
    }
    async stop() {
        this.logger.info('Stopping RAFT consensus...');
        if (this.electionTimer)
            clearTimeout(this.electionTimer);
        if (this.heartbeatTimer)
            clearInterval(this.heartbeatTimer);
        this.state = types_1.ConsensusState.STOPPED;
    }
    startElectionTimer() {
        if (this.electionTimer)
            clearTimeout(this.electionTimer);
        const timeout = this.config.electionTimeout + Math.random() * this.config.electionTimeout;
        this.electionTimer = setTimeout(() => {
            if (this.state === types_1.ConsensusState.FOLLOWER || this.state === types_1.ConsensusState.CANDIDATE) {
                this.startElection();
            }
        }, timeout);
    }
    async startElection() {
        this.logger.info('Starting election...');
        this.state = types_1.ConsensusState.CANDIDATE;
        this.currentTerm++;
        this.votedFor = this.config.nodeId;
        const lastLogIndex = this.log.length - 1;
        const lastLogTerm = lastLogIndex >= 0 ? this.log[lastLogIndex].term : 0;
        const voteRequest = {
            term: this.currentTerm,
            candidateId: this.config.nodeId,
            lastLogIndex: lastLogIndex,
            lastLogTerm: lastLogTerm
        };
        const votes = await this.requestVotes(voteRequest);
        if (votes > Math.floor(this.config.validators.length / 2)) {
            this.becomeLeader();
        }
        else {
            this.startElectionTimer();
        }
    }
    async requestVotes(voteRequest) {
        let votes = 1;
        const votePromises = this.config.validators
            .filter(v => v !== this.config.nodeId)
            .map(async (validatorId) => {
            try {
                const response = await this.sendVoteRequest(validatorId, voteRequest);
                if (response.voteGranted)
                    votes++;
            }
            catch (error) {
                this.logger.warn(`Failed to get vote from ${validatorId}:`, error);
            }
        });
        await Promise.all(votePromises);
        return votes;
    }
    becomeLeader() {
        this.logger.info('Became leader');
        this.state = types_1.ConsensusState.LEADER;
        this.emit('leader');
        for (const validator of this.config.validators) {
            if (validator !== this.config.nodeId) {
                this.nextIndex.set(validator, this.log.length);
                this.matchIndex.set(validator, 0);
            }
        }
        this.startHeartbeat();
    }
    startHeartbeat() {
        if (this.heartbeatTimer)
            clearInterval(this.heartbeatTimer);
        this.heartbeatTimer = setInterval(() => {
            if (this.state === types_1.ConsensusState.LEADER) {
                this.sendHeartbeats();
            }
        }, this.config.heartbeatInterval);
    }
    async sendHeartbeats() {
        const heartbeatPromises = this.config.validators
            .filter(v => v !== this.config.nodeId)
            .map(async (validatorId) => {
            try {
                await this.sendAppendEntries(validatorId, []);
            }
            catch (error) {
                this.logger.warn(`Failed to send heartbeat to ${validatorId}:`, error);
            }
        });
        await Promise.all(heartbeatPromises);
    }
    async proposeBlock(block) {
        if (this.state !== types_1.ConsensusState.LEADER) {
            throw new Error('Only leader can propose blocks');
        }
        const entry = {
            term: this.currentTerm,
            index: this.log.length,
            data: block,
            timestamp: Date.now()
        };
        this.log.push(entry);
        const replicationResult = await this.replicateEntry(entry);
        if (replicationResult.success) {
            this.commitIndex = entry.index;
            await this.applyEntry(entry);
            this.emit('block-committed', block);
        }
        return replicationResult;
    }
    async replicateEntry(entry) {
        const replicationPromises = this.config.validators
            .filter(v => v !== this.config.nodeId)
            .map(async (validatorId) => {
            const nextIdx = this.nextIndex.get(validatorId) || 0;
            const prevLogIndex = nextIdx - 1;
            const prevLogTerm = prevLogIndex >= 0 ? this.log[prevLogIndex].term : 0;
            const appendRequest = {
                term: this.currentTerm,
                leaderId: this.config.nodeId,
                prevLogIndex: prevLogIndex,
                prevLogTerm: prevLogTerm,
                entries: [entry],
                leaderCommit: this.commitIndex
            };
            try {
                const response = await this.sendAppendEntries(validatorId, [entry]);
                if (response.success) {
                    this.nextIndex.set(validatorId, entry.index + 1);
                    this.matchIndex.set(validatorId, entry.index);
                }
                return response.success;
            }
            catch (error) {
                this.logger.warn(`Failed to replicate to ${validatorId}:`, error);
                return false;
            }
        });
        const results = await Promise.all(replicationPromises);
        const successCount = results.filter(r => r).length + 1;
        return {
            success: successCount > Math.floor(this.config.validators.length / 2),
            term: this.currentTerm,
            index: entry.index,
            timestamp: Date.now()
        };
    }
    async applyEntry(entry) {
        this.lastApplied = entry.index;
        this.emit('consensus-achieved', {
            type: 'entry-applied',
            data: entry
        });
    }
    async processBatch(transactions) {
        if (this.state !== types_1.ConsensusState.LEADER) {
            throw new Error('Only leader can process batches');
        }
        const batch = {
            transactions: transactions,
            batchId: this.generateBatchId(),
            timestamp: Date.now()
        };
        const entry = {
            term: this.currentTerm,
            index: this.log.length,
            data: batch,
            timestamp: Date.now()
        };
        this.log.push(entry);
        const replicationResult = await this.replicateEntry(entry);
        if (replicationResult.success) {
            this.commitIndex = entry.index;
            await this.applyEntry(entry);
            this.emit('batch-committed', batch);
        }
        return replicationResult;
    }
    generateBatchId() {
        return `batch-${this.currentTerm}-${this.log.length}-${Date.now()}`;
    }
    async requestJoinValidatorSet(request) {
        if (this.state === types_1.ConsensusState.LEADER) {
            this.config.validators.push(request.nodeId);
            await this.reconfigureCluster();
        }
        else {
            await this.forwardToLeader(request);
        }
    }
    async requestLeaveValidatorSet(nodeId) {
        if (this.state === types_1.ConsensusState.LEADER) {
            this.config.validators = this.config.validators.filter(v => v !== nodeId);
            await this.reconfigureCluster();
        }
        else {
            await this.forwardToLeader({ type: 'leave', nodeId });
        }
    }
    async reconfigureCluster() {
        const configChange = {
            type: 'config-change',
            validators: this.config.validators,
            timestamp: Date.now()
        };
        const entry = {
            term: this.currentTerm,
            index: this.log.length,
            data: configChange,
            timestamp: Date.now()
        };
        await this.replicateEntry(entry);
    }
    async sendVoteRequest(validatorId, request) {
        return { voteGranted: Math.random() > 0.3 };
    }
    async sendAppendEntries(validatorId, entries) {
        return { success: true, term: this.currentTerm };
    }
    async forwardToLeader(request) {
        this.logger.info('Forwarding request to leader');
    }
    async getHealth() {
        return {
            healthy: this.state !== types_1.ConsensusState.STOPPED,
            state: this.state,
            term: this.currentTerm,
            commitIndex: this.commitIndex,
            lastApplied: this.lastApplied,
            logLength: this.log.length,
            participation: this.state === types_1.ConsensusState.LEADER ? 1.0 : 0.8
        };
    }
}
exports.RAFTConsensus = RAFTConsensus;
//# sourceMappingURL=RAFTConsensus.js.map