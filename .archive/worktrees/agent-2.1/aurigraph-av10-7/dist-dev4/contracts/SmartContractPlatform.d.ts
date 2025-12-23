import { QuantumCryptoManagerV2 } from '../crypto/QuantumCryptoManagerV2';
export interface RicardianContract {
    id: string;
    name: string;
    version: string;
    legalText: string;
    executableCode: string;
    jurisdiction: string;
    parties: ContractParty[];
    terms: ContractTerm[];
    triggers: ContractTrigger[];
    status: 'DRAFT' | 'ACTIVE' | 'EXECUTED' | 'TERMINATED' | 'DISPUTED';
    signatures: ContractSignature[];
    createdAt: Date;
    updatedAt: Date;
    metadata: ContractMetadata;
}
export interface ContractParty {
    id: string;
    name: string;
    role: 'OWNER' | 'COUNTERPARTY' | 'ESCROW' | 'WITNESS' | 'ARBITRATOR';
    address: string;
    publicKey: string;
    jurisdiction: string;
    kycVerified: boolean;
    signatureRequired: boolean;
}
export interface ContractTerm {
    id: string;
    description: string;
    type: 'PAYMENT' | 'DELIVERY' | 'CONDITION' | 'PENALTY' | 'GOVERNANCE';
    value: any;
    enforcement: 'AUTOMATIC' | 'MANUAL' | 'DISPUTE_RESOLUTION';
    executionConditions: string[];
}
export interface ContractTrigger {
    id: string;
    name: string;
    type: 'TIME_BASED' | 'EVENT_BASED' | 'ORACLE_BASED' | 'SIGNATURE_BASED';
    condition: string;
    action: string;
    priority: number;
    enabled: boolean;
}
export interface ContractSignature {
    partyId: string;
    signature: string;
    timestamp: Date;
    witnessedBy?: string[];
    legalAuthority?: string;
}
export interface ContractMetadata {
    templateId?: string;
    legalFramework: string;
    disputeResolution: string;
    governingLaw: string;
    enforceabilityScore: number;
    riskAssessment: string;
    auditTrail: string[];
}
export interface LegalTemplate {
    id: string;
    name: string;
    category: string;
    jurisdiction: string;
    template: string;
    variables: TemplateVariable[];
    validation: ValidationRule[];
}
export interface TemplateVariable {
    name: string;
    type: 'STRING' | 'NUMBER' | 'DATE' | 'ADDRESS' | 'AMOUNT';
    required: boolean;
    defaultValue?: any;
    validation?: string;
}
export interface ValidationRule {
    field: string;
    rule: string;
    message: string;
}
export interface ContractExecution {
    contractId: string;
    triggerId: string;
    executionId: string;
    timestamp: Date;
    status: 'PENDING' | 'SUCCESS' | 'FAILED' | 'DISPUTED';
    result: any;
    gasUsed: number;
    evidence: string[];
}
export declare class SmartContractPlatform {
    private logger;
    private contracts;
    private templates;
    private executions;
    private cryptoManager;
    private performanceMetrics;
    constructor(cryptoManager: QuantumCryptoManagerV2);
    initialize(): Promise<void>;
    createRicardianContract(contractData: Partial<RicardianContract>): Promise<RicardianContract>;
    signContract(contractId: string, partyId: string, privateKey: string): Promise<boolean>;
    executeContract(contractId: string, triggerId: string, executionData: any): Promise<ContractExecution>;
    createFromTemplate(templateId: string, variables: Record<string, any>): Promise<RicardianContract>;
    resolveDispute(contractId: string, disputeData: any): Promise<boolean>;
    private loadLegalTemplates;
    private initializeGovernanceFramework;
    private setupDisputeResolution;
    private initializeCrossChainCompatibility;
    private validateContract;
    private performLegalAnalysis;
    private assessContractRisk;
    private generateSignatureData;
    private hashLegalText;
    private hashExecutableCode;
    private isFullySigned;
    private deployContract;
    private executeContractLogic;
    private executeTimeBased;
    private executeEventBased;
    private executeOracleBased;
    private executeSignatureBased;
    private generateContractId;
    private generateExecutionId;
    private validateTemplateVariables;
    private validateRule;
    private populateTemplate;
    private generateExecutableCode;
    private generateExecutionEvidence;
    private performDisputeResolution;
    private startPerformanceMonitoring;
    getContract(contractId: string): RicardianContract | undefined;
    getAllContracts(): RicardianContract[];
    getContractsByStatus(status: RicardianContract['status']): RicardianContract[];
    getTemplate(templateId: string): LegalTemplate | undefined;
    getAllTemplates(): LegalTemplate[];
    getExecution(executionId: string): ContractExecution | undefined;
    getPerformanceMetrics(): any;
}
//# sourceMappingURL=SmartContractPlatform.d.ts.map