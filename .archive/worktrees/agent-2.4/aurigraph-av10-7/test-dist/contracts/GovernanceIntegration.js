"use strict";
var __esDecorate = (this && this.__esDecorate) || function (ctor, descriptorIn, decorators, contextIn, initializers, extraInitializers) {
    function accept(f) { if (f !== void 0 && typeof f !== "function") throw new TypeError("Function expected"); return f; }
    var kind = contextIn.kind, key = kind === "getter" ? "get" : kind === "setter" ? "set" : "value";
    var target = !descriptorIn && ctor ? contextIn["static"] ? ctor : ctor.prototype : null;
    var descriptor = descriptorIn || (target ? Object.getOwnPropertyDescriptor(target, contextIn.name) : {});
    var _, done = false;
    for (var i = decorators.length - 1; i >= 0; i--) {
        var context = {};
        for (var p in contextIn) context[p] = p === "access" ? {} : contextIn[p];
        for (var p in contextIn.access) context.access[p] = contextIn.access[p];
        context.addInitializer = function (f) { if (done) throw new TypeError("Cannot add initializers after decoration has completed"); extraInitializers.push(accept(f || null)); };
        var result = (0, decorators[i])(kind === "accessor" ? { get: descriptor.get, set: descriptor.set } : descriptor[key], context);
        if (kind === "accessor") {
            if (result === void 0) continue;
            if (result === null || typeof result !== "object") throw new TypeError("Object expected");
            if (_ = accept(result.get)) descriptor.get = _;
            if (_ = accept(result.set)) descriptor.set = _;
            if (_ = accept(result.init)) initializers.unshift(_);
        }
        else if (_ = accept(result)) {
            if (kind === "field") initializers.unshift(_);
            else descriptor[key] = _;
        }
    }
    if (target) Object.defineProperty(target, contextIn.name, descriptor);
    done = true;
};
var __runInitializers = (this && this.__runInitializers) || function (thisArg, initializers, value) {
    var useValue = arguments.length > 2;
    for (var i = 0; i < initializers.length; i++) {
        value = useValue ? initializers[i].call(thisArg, value) : initializers[i].call(thisArg);
    }
    return useValue ? value : void 0;
};
var __setFunctionName = (this && this.__setFunctionName) || function (f, name, prefix) {
    if (typeof name === "symbol") name = name.description ? "[".concat(name.description, "]") : "";
    return Object.defineProperty(f, "name", { configurable: true, value: prefix ? "".concat(prefix, " ", name) : name });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.GovernanceIntegration = void 0;
const inversify_1 = require("inversify");
const Logger_1 = require("../core/Logger");
let GovernanceIntegration = (() => {
    let _classDecorators = [(0, inversify_1.injectable)()];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    var GovernanceIntegration = _classThis = class {
        constructor() {
            this.proposals = new Map();
            this.tokens = new Map();
            this.logger = new Logger_1.Logger('GovernanceIntegration');
            this.daoConfig = {
                name: 'Aurigraph DAO',
                governanceTokenAddress: '0xAUR...',
                votingDelay: 86400, // 1 day
                votingPeriod: 604800, // 7 days
                proposalThreshold: 100000, // 100k tokens
                quorumThreshold: 10, // 10%
                timelock: 172800, // 2 days
                multiSigRequired: true
            };
        }
        async createProposal(proposalData) {
            try {
                const proposalId = this.generateProposalId();
                const proposal = {
                    id: proposalId,
                    title: proposalData.title || 'Untitled Proposal',
                    description: proposalData.description || '',
                    proposer: proposalData.proposer || '',
                    type: proposalData.type || 'PARAMETER_CHANGE',
                    targetContractId: proposalData.targetContractId,
                    proposedChanges: proposalData.proposedChanges || {},
                    votingPeriod: proposalData.votingPeriod || this.getDefaultVotingPeriod(),
                    votes: [],
                    status: 'PENDING',
                    createdAt: new Date()
                };
                // Validate proposer has enough tokens
                await this.validateProposer(proposal.proposer);
                // Start voting period after delay
                setTimeout(() => {
                    proposal.status = 'ACTIVE';
                    this.logger.info(`Voting started for proposal: ${proposalId}`);
                }, this.daoConfig.votingDelay * 1000);
                this.proposals.set(proposalId, proposal);
                this.logger.info(`Governance proposal created: ${proposalId}`);
                return proposal;
            }
            catch (error) {
                this.logger.error(`Proposal creation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
                throw error;
            }
        }
        async vote(proposalId, voterId, choice) {
            try {
                const proposal = this.proposals.get(proposalId);
                if (!proposal) {
                    throw new Error('Proposal not found');
                }
                if (proposal.status !== 'ACTIVE') {
                    throw new Error('Voting not active for this proposal');
                }
                if (new Date() > proposal.votingPeriod.endDate) {
                    proposal.status = 'REJECTED';
                    throw new Error('Voting period has ended');
                }
                const token = this.tokens.get(voterId);
                if (!token) {
                    throw new Error('Voter not found or no voting power');
                }
                // Check if already voted
                const existingVote = proposal.votes.find(v => v.voterId === voterId);
                if (existingVote) {
                    throw new Error('Already voted on this proposal');
                }
                const vote = {
                    voterId: voterId,
                    choice: choice,
                    weight: token.votingPower,
                    timestamp: new Date(),
                    signature: this.generateVoteSignature(proposalId, voterId, choice)
                };
                proposal.votes.push(vote);
                this.logger.info(`Vote cast: ${proposalId} by ${voterId} - ${choice}`);
                // Check if proposal can be finalized
                await this.checkProposalFinalization(proposal);
                return true;
            }
            catch (error) {
                this.logger.error(`Voting failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
                return false;
            }
        }
        async executeProposal(proposalId) {
            try {
                const proposal = this.proposals.get(proposalId);
                if (!proposal) {
                    throw new Error('Proposal not found');
                }
                if (proposal.status !== 'PASSED') {
                    throw new Error('Proposal has not passed voting');
                }
                // Execute timelock if required
                if (this.daoConfig.timelock > 0) {
                    const executionTime = new Date(Date.now() + this.daoConfig.timelock * 1000);
                    proposal.executionDate = executionTime;
                    this.logger.info(`Proposal execution scheduled for: ${executionTime.toISOString()}`);
                    setTimeout(() => {
                        this.performProposalExecution(proposal);
                    }, this.daoConfig.timelock * 1000);
                }
                else {
                    await this.performProposalExecution(proposal);
                }
                return true;
            }
            catch (error) {
                this.logger.error(`Proposal execution failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
                return false;
            }
        }
        async performProposalExecution(proposal) {
            try {
                switch (proposal.type) {
                    case 'CONTRACT_AMENDMENT':
                        await this.executeContractAmendment(proposal);
                        break;
                    case 'PARAMETER_CHANGE':
                        await this.executeParameterChange(proposal);
                        break;
                    case 'EMERGENCY_ACTION':
                        await this.executeEmergencyAction(proposal);
                        break;
                    case 'TEMPLATE_UPDATE':
                        await this.executeTemplateUpdate(proposal);
                        break;
                }
                proposal.status = 'EXECUTED';
                this.logger.info(`Proposal executed successfully: ${proposal.id}`);
            }
            catch (error) {
                this.logger.error(`Proposal execution failed: ${proposal.id}`);
                throw error;
            }
        }
        async executeContractAmendment(proposal) {
            this.logger.info(`Executing contract amendment: ${proposal.targetContractId}`);
        }
        async executeParameterChange(proposal) {
            this.logger.info('Executing parameter change');
        }
        async executeEmergencyAction(proposal) {
            this.logger.info('Executing emergency action');
        }
        async executeTemplateUpdate(proposal) {
            this.logger.info('Executing template update');
        }
        async validateProposer(proposer) {
            const token = this.tokens.get(proposer);
            if (!token || token.balance < this.daoConfig.proposalThreshold) {
                throw new Error('Insufficient tokens to create proposal');
            }
        }
        getDefaultVotingPeriod() {
            const now = new Date();
            return {
                startDate: new Date(now.getTime() + this.daoConfig.votingDelay * 1000),
                endDate: new Date(now.getTime() + (this.daoConfig.votingDelay + this.daoConfig.votingPeriod) * 1000),
                quorumRequired: this.daoConfig.quorumThreshold,
                passingThreshold: 51 // 51% majority
            };
        }
        async checkProposalFinalization(proposal) {
            const totalVotingPower = this.calculateTotalVotingPower();
            const totalVotes = proposal.votes.reduce((sum, vote) => sum + vote.weight, 0);
            const quorumMet = (totalVotes / totalVotingPower) * 100 >= proposal.votingPeriod.quorumRequired;
            if (quorumMet && new Date() >= proposal.votingPeriod.endDate) {
                const forVotes = proposal.votes.filter(v => v.choice === 'FOR').reduce((sum, v) => sum + v.weight, 0);
                const againstVotes = proposal.votes.filter(v => v.choice === 'AGAINST').reduce((sum, v) => sum + v.weight, 0);
                const passed = forVotes > againstVotes && (forVotes / totalVotes) * 100 >= proposal.votingPeriod.passingThreshold;
                proposal.status = passed ? 'PASSED' : 'REJECTED';
                this.logger.info(`Proposal ${proposal.id} voting completed: ${proposal.status}`);
            }
        }
        calculateTotalVotingPower() {
            return Array.from(this.tokens.values()).reduce((sum, token) => sum + token.votingPower, 0);
        }
        generateProposalId() {
            return 'PROP_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
        }
        generateVoteSignature(proposalId, voterId, choice) {
            const data = `${proposalId}:${voterId}:${choice}:${Date.now()}`;
            return require('crypto').createHash('sha256').update(data).digest('hex');
        }
        // Public API methods
        getProposal(proposalId) {
            return this.proposals.get(proposalId);
        }
        getAllProposals() {
            return Array.from(this.proposals.values());
        }
        getActiveProposals() {
            return Array.from(this.proposals.values()).filter(p => p.status === 'ACTIVE');
        }
        getVotingPower(address) {
            const token = this.tokens.get(address);
            return token ? token.votingPower : 0;
        }
        async delegateVoting(delegator, delegatee) {
            try {
                const token = this.tokens.get(delegator);
                if (!token) {
                    throw new Error('Token holder not found');
                }
                token.delegatedTo = delegatee;
                this.logger.info(`Voting power delegated: ${delegator} -> ${delegatee}`);
                return true;
            }
            catch (error) {
                this.logger.error(`Delegation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
                return false;
            }
        }
        getDAOConfig() {
            return { ...this.daoConfig };
        }
        getGovernanceMetrics() {
            return {
                totalProposals: this.proposals.size,
                activeProposals: this.getActiveProposals().length,
                totalTokenHolders: this.tokens.size,
                totalVotingPower: this.calculateTotalVotingPower(),
                daoConfig: this.daoConfig
            };
        }
    };
    __setFunctionName(_classThis, "GovernanceIntegration");
    (() => {
        const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
        __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
        GovernanceIntegration = _classThis = _classDescriptor.value;
        if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        __runInitializers(_classThis, _classExtraInitializers);
    })();
    return GovernanceIntegration = _classThis;
})();
exports.GovernanceIntegration = GovernanceIntegration;
