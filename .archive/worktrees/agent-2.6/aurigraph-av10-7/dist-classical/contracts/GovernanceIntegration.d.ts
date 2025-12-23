export interface GovernanceProposal {
    id: string;
    title: string;
    description: string;
    proposer: string;
    type: 'CONTRACT_AMENDMENT' | 'PARAMETER_CHANGE' | 'EMERGENCY_ACTION' | 'TEMPLATE_UPDATE';
    targetContractId?: string;
    proposedChanges: any;
    votingPeriod: VotingPeriod;
    votes: Vote[];
    status: 'PENDING' | 'ACTIVE' | 'PASSED' | 'REJECTED' | 'EXECUTED';
    executionDate?: Date;
    createdAt: Date;
}
export interface VotingPeriod {
    startDate: Date;
    endDate: Date;
    quorumRequired: number;
    passingThreshold: number;
}
export interface Vote {
    voterId: string;
    choice: 'FOR' | 'AGAINST' | 'ABSTAIN';
    weight: number;
    timestamp: Date;
    signature: string;
}
export interface GovernanceToken {
    holder: string;
    balance: number;
    votingPower: number;
    delegatedTo?: string;
    lockPeriod?: Date;
}
export interface DAOConfiguration {
    name: string;
    governanceTokenAddress: string;
    votingDelay: number;
    votingPeriod: number;
    proposalThreshold: number;
    quorumThreshold: number;
    timelock: number;
    multiSigRequired: boolean;
}
export declare class GovernanceIntegration {
    private logger;
    private proposals;
    private tokens;
    private daoConfig;
    constructor();
    createProposal(proposalData: Partial<GovernanceProposal>): Promise<GovernanceProposal>;
    vote(proposalId: string, voterId: string, choice: Vote['choice']): Promise<boolean>;
    executeProposal(proposalId: string): Promise<boolean>;
    private performProposalExecution;
    private executeContractAmendment;
    private executeParameterChange;
    private executeEmergencyAction;
    private executeTemplateUpdate;
    private validateProposer;
    private getDefaultVotingPeriod;
    private checkProposalFinalization;
    private calculateTotalVotingPower;
    private generateProposalId;
    private generateVoteSignature;
    getProposal(proposalId: string): GovernanceProposal | undefined;
    getAllProposals(): GovernanceProposal[];
    getActiveProposals(): GovernanceProposal[];
    getVotingPower(address: string): number;
    delegateVoting(delegator: string, delegatee: string): Promise<boolean>;
    getDAOConfig(): DAOConfiguration;
    getGovernanceMetrics(): any;
}
//# sourceMappingURL=GovernanceIntegration.d.ts.map