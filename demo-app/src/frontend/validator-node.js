/**
 * Validator Node - HyperRAFT++ Consensus
 * Epic: AV11-192, Task: AV11-195
 */

class ValidatorNode {
    constructor(config) {
        this.id = config.id;
        this.name = config.name;
        this.type = 'validator';
        this.config = {
            stakeAmount: config.stakeAmount || 10000,
            votingPower: config.votingPower || 1,
            consensusTimeout: config.consensusTimeout || 5000,
            maxBlockSize: config.maxBlockSize || 1000000
        };

        this.consensusState = 'FOLLOWER';
        this.term = 0;
        this.votedFor = null;
        this.voteCount = 0;
        this.leaderId = null;

        this.metrics = {
            blocksValidated: 0,
            votesReceived: 0,
            votesCast: 0,
            consensusRounds: 0,
            leaderTerms: 0,
            participationRate: 100.0,
            avgBlockTime: 0
        };

        this.consensusHistory = [];
        this.blockTimes = [];
        this.startTime = Date.now();
        this.listeners = new Map();

        this._startConsensusEngine();
    }

    async initialize() {
        this.consensusState = 'FOLLOWER';
        this.emit('consensus-state-change', { state: this.consensusState, term: this.term });
        return true;
    }

    async start() {
        this.emit('started', { nodeId: this.id });
        this._startElectionTimer();
        return true;
    }

    _startElectionTimer() {
        if (this.electionTimer) clearTimeout(this.electionTimer);
        const timeout = 150 + Math.random() * 150;
        this.electionTimer = setTimeout(() => {
            if (this.consensusState !== 'LEADER') {
                this._startElection();
            }
        }, timeout);
    }

    _startElection() {
        this.term++;
        this.consensusState = 'CANDIDATE';
        this.votedFor = this.id;
        this.voteCount = 1;
        
        this.emit('consensus-state-change', { 
            state: this.consensusState, 
            term: this.term 
        });

        this.emit('request-votes', {
            candidateId: this.id,
            term: this.term,
            votingPower: this.config.votingPower
        });

        this._startElectionTimer();
    }

    receiveVoteRequest(candidateId, term) {
        if (term > this.term) {
            this.term = term;
            this.votedFor = null;
            this.consensusState = 'FOLLOWER';
        }

        if (term === this.term && (this.votedFor === null || this.votedFor === candidateId)) {
            this.votedFor = candidateId;
            this.metrics.votesCast++;
            
            this.emit('vote-granted', {
                voterId: this.id,
                candidateId: candidateId,
                term: term
            });

            return true;
        }

        return false;
    }

    receiveVote(voterId, term) {
        if (term === this.term && this.consensusState === 'CANDIDATE') {
            this.voteCount++;
            this.metrics.votesReceived++;

            this.emit('vote-received', {
                voterId: voterId,
                voteCount: this.voteCount
            });

            if (this.voteCount >= 3) {
                this._becomeLeader();
            }
        }
    }

    _becomeLeader() {
        this.consensusState = 'LEADER';
        this.leaderId = this.id;
        this.metrics.leaderTerms++;

        if (this.electionTimer) clearTimeout(this.electionTimer);

        this.emit('consensus-state-change', {
            state: this.consensusState,
            term: this.term
        });

        this._startHeartbeat();
    }

    _startHeartbeat() {
        if (this.heartbeatInterval) clearInterval(this.heartbeatInterval);

        this.heartbeatInterval = setInterval(() => {
            if (this.consensusState === 'LEADER') {
                this.emit('heartbeat', {
                    leaderId: this.id,
                    term: this.term
                });
            } else {
                clearInterval(this.heartbeatInterval);
            }
        }, 50);
    }

    receiveHeartbeat(leaderId, term) {
        if (term >= this.term) {
            this.term = term;
            this.leaderId = leaderId;
            
            if (this.consensusState !== 'FOLLOWER') {
                this.consensusState = 'FOLLOWER';
                this.emit('consensus-state-change', {
                    state: this.consensusState,
                    term: this.term
                });
            }

            this._startElectionTimer();
        }
    }

    async validateBlock(block) {
        const startTime = Date.now();
        const isValid = this._performBlockValidation(block);

        if (isValid) {
            this.metrics.blocksValidated++;
            const blockTime = Date.now() - startTime;
            this.blockTimes.push(blockTime);

            if (this.blockTimes.length > 100) {
                this.blockTimes.shift();
            }
            this.metrics.avgBlockTime = Math.round(
                this.blockTimes.reduce((a, b) => a + b, 0) / this.blockTimes.length
            );

            this.emit('block-validated', {
                blockHash: block.hash,
                blockNumber: block.number,
                validationTime: blockTime
            });

            return true;
        }

        this.emit('block-rejected', {
            blockHash: block.hash,
            reason: 'Validation failed'
        });

        return false;
    }

    _performBlockValidation(block) {
        if (!block || !block.hash || !block.transactions) return false;
        if (block.transactions.length > this.config.maxBlockSize) return false;
        return true;
    }

    _startConsensusEngine() {
        setInterval(() => {
            this.metrics.consensusRounds++;

            this.consensusHistory.push({
                timestamp: Date.now(),
                state: this.consensusState,
                term: this.term,
                blocksValidated: this.metrics.blocksValidated
            });

            if (this.consensusHistory.length > 60) {
                this.consensusHistory.shift();
            }

            const activeRounds = this.consensusHistory.filter(h => 
                h.state === 'LEADER' || h.state === 'CANDIDATE'
            ).length;
            this.metrics.participationRate = (activeRounds / this.consensusHistory.length * 100).toFixed(1);

            this.emit('metrics-update', { metrics: this.getMetrics() });
        }, 1000);
    }

    getMetrics() {
        return {
            ...this.metrics,
            currentTerm: this.term,
            voteCount: this.voteCount,
            uptime: Math.round((Date.now() - this.startTime) / 1000),
            consensusHistory: this.consensusHistory.slice(-60)
        };
    }

    getState() {
        return {
            id: this.id,
            name: this.name,
            type: this.type,
            consensusState: this.consensusState,
            term: this.term,
            leaderId: this.leaderId,
            config: this.config,
            metrics: this.getMetrics()
        };
    }

    async stop() {
        if (this.electionTimer) clearTimeout(this.electionTimer);
        if (this.heartbeatInterval) clearInterval(this.heartbeatInterval);
        
        this.consensusState = 'FOLLOWER';
        this.emit('stopped', { nodeId: this.id });
    }

    on(event, callback) {
        if (!this.listeners.has(event)) {
            this.listeners.set(event, []);
        }
        this.listeners.get(event).push(callback);
    }

    emit(event, data) {
        if (this.listeners.has(event)) {
            this.listeners.get(event).forEach(callback => callback(data));
        }
    }
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = ValidatorNode;
}
