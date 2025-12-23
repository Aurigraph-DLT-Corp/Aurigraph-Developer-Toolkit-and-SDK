import { EventEmitter } from 'events';
import { QuantumCryptoManagerV2 } from '../crypto/QuantumCryptoManagerV2';
import { AuditTrailManager } from '../rwa/audit/AuditTrailManager';
export interface VerificationRequest {
    id: string;
    type: 'IDENTITY' | 'ASSET' | 'DOCUMENT' | 'TRANSACTION' | 'COMPLIANCE' | 'KYC' | 'AML';
    entityId: string;
    entityType: string;
    priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    jurisdiction: string;
    requestData: any;
    sources: VerificationSource[];
    requiredConfidence: number;
    timeout: number;
    created: Date;
    requesterId: string;
    metadata: {
        ipAddress?: string;
        userAgent?: string;
        sessionId?: string;
        riskScore?: number;
    };
}
export interface VerificationSource {
    id: string;
    name: string;
    type: 'DATABASE' | 'API' | 'BLOCKCHAIN' | 'ORACLE' | 'BIOMETRIC' | 'DOCUMENT' | 'ML_MODEL';
    endpoint?: string;
    credentialId?: string;
    weight: number;
    timeout: number;
    retries: number;
    enabled: boolean;
    costPerQuery: number;
    accuracy: number;
    jurisdiction: string[];
    specializations: string[];
}
export interface VerificationResult {
    id: string;
    requestId: string;
    status: 'VERIFIED' | 'REJECTED' | 'PARTIAL' | 'PENDING' | 'ERROR' | 'TIMEOUT';
    overallConfidence: number;
    requiredConfidence: number;
    passed: boolean;
    sources: SourceVerificationResult[];
    summary: VerificationSummary;
    riskAssessment: RiskAssessment;
    complianceStatus: ComplianceResult[];
    recommendations: string[];
    evidence: VerificationEvidence[];
    processingTime: number;
    cost: number;
    created: Date;
    completed?: Date;
    signature: string;
    hash: string;
}
export interface SourceVerificationResult {
    sourceId: string;
    sourceName: string;
    status: 'SUCCESS' | 'FAILED' | 'TIMEOUT' | 'ERROR' | 'SKIPPED';
    confidence: number;
    data: any;
    processingTime: number;
    cost: number;
    errors: string[];
    warnings: string[];
    metadata: {
        version: string;
        lastUpdated: Date;
        queryTime: Date;
        responseSize: number;
    };
}
export interface VerificationSummary {
    totalSources: number;
    successfulSources: number;
    failedSources: number;
    averageConfidence: number;
    weightedConfidence: number;
    criticalFailures: number;
    warnings: string[];
    flags: string[];
    categories: {
        identity: number;
        financial: number;
        legal: number;
        behavioral: number;
        technical: number;
    };
}
export interface RiskAssessment {
    overallRisk: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    riskScore: number;
    factors: RiskFactor[];
    mitigations: string[];
    escalationRequired: boolean;
    reviewDate: Date;
}
export interface RiskFactor {
    type: string;
    category: 'IDENTITY' | 'FINANCIAL' | 'REGULATORY' | 'TECHNICAL' | 'BEHAVIORAL';
    severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    score: number;
    description: string;
    evidence: string[];
    mitigation?: string;
}
export interface ComplianceResult {
    regulation: string;
    jurisdiction: string;
    status: 'COMPLIANT' | 'NON_COMPLIANT' | 'PARTIAL' | 'UNKNOWN';
    requirements: ComplianceRequirement[];
    violations: string[];
    recommendations: string[];
    lastChecked: Date;
}
export interface ComplianceRequirement {
    id: string;
    description: string;
    status: 'MET' | 'NOT_MET' | 'PARTIAL' | 'N/A';
    evidence: string[];
    source: string;
}
export interface VerificationEvidence {
    id: string;
    type: 'DOCUMENT' | 'SIGNATURE' | 'BIOMETRIC' | 'TRANSACTION' | 'REFERENCE' | 'AUDIT';
    source: string;
    data: any;
    hash: string;
    signature: string;
    timestamp: Date;
    authenticity: number;
    integrity: boolean;
}
export interface VerificationTemplate {
    id: string;
    name: string;
    type: string;
    description: string;
    jurisdiction: string[];
    requiredSources: string[];
    minimumConfidence: number;
    maxProcessingTime: number;
    cost: number;
    regulations: string[];
    active: boolean;
}
export interface VerificationPolicy {
    id: string;
    name: string;
    type: string;
    rules: VerificationRule[];
    jurisdiction: string;
    effective: Date;
    expires?: Date;
    priority: number;
}
export interface VerificationRule {
    id: string;
    condition: string;
    action: 'REQUIRE' | 'REJECT' | 'FLAG' | 'ESCALATE' | 'ENHANCE';
    parameters: any;
    weight: number;
    mandatory: boolean;
}
export interface VerificationMetrics {
    totalRequests: number;
    successRate: number;
    averageProcessingTime: number;
    averageConfidence: number;
    sourcesUsed: Map<string, number>;
    costTotal: number;
    jurisdictionBreakdown: Map<string, number>;
    typeBreakdown: Map<string, number>;
    errorRate: number;
    timeoutRate: number;
}
export declare class VerificationEngine extends EventEmitter {
    private logger;
    private cryptoManager;
    private auditTrail;
    private verificationSources;
    private pendingRequests;
    private results;
    private templates;
    private policies;
    private config;
    private metrics;
    private mlModels;
    private fraudDetectionModel;
    private riskScoringModel;
    private confidenceCalibrationModel;
    constructor(cryptoManager?: QuantumCryptoManagerV2, auditTrail?: AuditTrailManager);
    initialize(): Promise<void>;
    private initializeVerificationSources;
    private loadVerificationTemplates;
    private initializeCompliancePolicies;
    private initializeMachineLearning;
    verifyEntity(request: Partial<VerificationRequest>): Promise<string>;
    private processVerificationRequest;
    private executeVerificationSource;
    private createSourceResult;
    private queryDatabase;
    private queryAPI;
    private queryBlockchain;
    private performBiometricVerification;
    private analyzeDocument;
    private executeMLModel;
    private calculateOverallConfidence;
    private performRiskAssessment;
    private extractRiskFactors;
    private generateRiskMitigations;
    private getReviewPeriod;
    private checkCompliance;
    private evaluatePolicy;
    private evaluateRule;
    private evaluateCondition;
    private checkRuleCompliance;
    private generateComplianceRecommendations;
    private checkUSCompliance;
    private checkEUCompliance;
    private applyMLEnhancements;
    private applyFraudDetection;
    private calibrateConfidence;
    private calculateVariance;
    private generateRecommendations;
    private selectOptimalSources;
    private validateVerificationRequest;
    private updateMetrics;
    private startBackgroundProcesses;
    private checkPendingRequestTimeouts;
    private archiveOldResults;
    getVerificationResult(requestId: string): Promise<VerificationResult | null>;
    getVerificationStatus(requestId: string): Promise<{
        status: string;
        progress?: number;
    }>;
    getMetrics(): VerificationMetrics;
    getVerificationSources(): VerificationSource[];
    addVerificationSource(source: VerificationSource): void;
    addVerificationTemplate(template: VerificationTemplate): void;
    addVerificationPolicy(policy: VerificationPolicy): void;
    bulkVerify(requests: Partial<VerificationRequest>[]): Promise<string[]>;
    cancelVerification(requestId: string): Promise<boolean>;
    getSystemStatus(): {
        status: string;
        pendingRequests: number;
        completedToday: number;
        sources: number;
    };
    submitVerification(request: any): Promise<string>;
    getAllSources(): VerificationSource[];
    getPerformanceMetrics(): any;
    private getErrorCount;
    private calculateAverageProcessingTime;
    private startTime;
}
//# sourceMappingURL=VerificationEngine.d.ts.map