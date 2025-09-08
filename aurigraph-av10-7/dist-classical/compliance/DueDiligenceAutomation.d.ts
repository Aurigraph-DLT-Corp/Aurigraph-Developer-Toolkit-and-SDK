import { EventEmitter } from 'events';
import { QuantumCryptoManagerV2 } from '../crypto/QuantumCryptoManagerV2';
import { AuditTrailManager } from '../rwa/audit/AuditTrailManager';
import { VerificationEngine } from '../verification/VerificationEngine';
import { LegalComplianceModule } from './LegalComplianceModule';
export interface DueDiligenceProfile {
    id: string;
    entityId: string;
    entityType: 'INDIVIDUAL' | 'CORPORATION' | 'PARTNERSHIP' | 'TRUST' | 'GOVERNMENT' | 'NON_PROFIT';
    tier: 'SIMPLIFIED' | 'STANDARD' | 'ENHANCED' | 'SUPREME';
    jurisdiction: string;
    riskRating: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' | 'PROHIBITED';
    status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'REJECTED' | 'EXPIRED' | 'SUSPENDED';
    created: Date;
    lastUpdated: Date;
    expiryDate: Date;
    assignedAnalyst?: string;
    supervisorApproval?: string;
    components: DueDiligenceComponent[];
    riskFactors: RiskFactor[];
    mitigationMeasures: MitigationMeasure[];
    approvalHistory: ApprovalRecord[];
    documentCollections: DocumentCollection[];
    ongoingMonitoring: MonitoringConfiguration;
    complianceChecks: ComplianceCheck[];
    escalationLevel: number;
    metadata: {
        source: string;
        version: string;
        quantumSignature: string;
        blockchainAnchor?: string;
    };
}
export interface DueDiligenceComponent {
    id: string;
    type: 'KYC' | 'KYB' | 'SOURCE_OF_FUNDS' | 'SOURCE_OF_WEALTH' | 'BENEFICIAL_OWNERSHIP' | 'PEP_SCREENING' | 'SANCTIONS_SCREENING' | 'ADVERSE_MEDIA' | 'CREDIT_CHECK' | 'REGULATORY_HISTORY' | 'BUSINESS_MODEL' | 'TRANSACTION_PATTERN_ANALYSIS';
    name: string;
    description: string;
    required: boolean;
    priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    status: 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED' | 'FAILED' | 'WAIVED' | 'DEFERRED';
    startDate?: Date;
    completionDate?: Date;
    deadline: Date;
    assignee?: string;
    findings: Finding[];
    evidence: Evidence[];
    score: number;
    confidence: number;
    automated: boolean;
    dependencies: string[];
    costEstimate: number;
    actualCost: number;
}
export interface Finding {
    id: string;
    type: 'POSITIVE' | 'NEGATIVE' | 'NEUTRAL' | 'INCONCLUSIVE';
    severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    category: string;
    title: string;
    description: string;
    source: string;
    confidence: number;
    impact: 'MINIMAL' | 'MODERATE' | 'SIGNIFICANT' | 'SEVERE';
    recommendations: string[];
    followUpRequired: boolean;
    escalationNeeded: boolean;
    discovered: Date;
    verified: boolean;
    verificationMethod?: string;
    linkedFindings: string[];
}
export interface Evidence {
    id: string;
    type: 'DOCUMENT' | 'BIOMETRIC' | 'DATABASE_RECORD' | 'API_RESPONSE' | 'BLOCKCHAIN_RECORD' | 'VERIFICATION_CERTIFICATE' | 'THIRD_PARTY_REPORT' | 'MANUAL_REVIEW' | 'INTERVIEW_NOTES';
    source: string;
    description: string;
    hash: string;
    signature: string;
    timestamp: Date;
    authenticity: 'VERIFIED' | 'UNVERIFIED' | 'SUSPICIOUS' | 'INVALID';
    retention: Date;
    accessLevel: 'PUBLIC' | 'INTERNAL' | 'CONFIDENTIAL' | 'RESTRICTED';
    size: number;
    format: string;
    checksum: string;
}
export interface RiskFactor {
    id: string;
    category: 'GEOGRAPHIC' | 'INDUSTRY' | 'PRODUCT' | 'TRANSACTION' | 'CUSTOMER' | 'COUNTERPARTY' | 'REGULATORY';
    type: string;
    description: string;
    severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    likelihood: 'VERY_LOW' | 'LOW' | 'MEDIUM' | 'HIGH' | 'VERY_HIGH';
    impact: 'MINIMAL' | 'MINOR' | 'MODERATE' | 'MAJOR' | 'CATASTROPHIC';
    riskScore: number;
    inherentRisk: number;
    residualRisk: number;
    source: string;
    dateIdentified: Date;
    lastReviewed: Date;
    status: 'ACTIVE' | 'MITIGATED' | 'ACCEPTED' | 'TRANSFERRED' | 'AVOIDED';
    mitigationRequired: boolean;
    regulatoryImplication: boolean;
}
export interface MitigationMeasure {
    id: string;
    riskFactorId: string;
    type: 'PREVENTIVE' | 'DETECTIVE' | 'CORRECTIVE' | 'COMPENSATING';
    description: string;
    implementation: 'POLICY' | 'PROCEDURE' | 'TECHNOLOGY' | 'TRAINING' | 'MONITORING';
    effectiveness: 'LOW' | 'MEDIUM' | 'HIGH' | 'VERY_HIGH';
    cost: number;
    implementationDate?: Date;
    reviewDate: Date;
    responsible: string;
    status: 'PLANNED' | 'IN_PROGRESS' | 'IMPLEMENTED' | 'TESTED' | 'DEFERRED' | 'CANCELLED';
    testResults?: TestResult[];
    monitoringMetrics: string[];
}
export interface TestResult {
    date: Date;
    testType: 'FUNCTIONAL' | 'EFFECTIVENESS' | 'STRESS' | 'COMPLIANCE';
    result: 'PASSED' | 'FAILED' | 'PARTIAL';
    findings: string[];
    recommendations: string[];
    nextTestDate: Date;
}
export interface ApprovalRecord {
    id: string;
    approver: string;
    role: string;
    decision: 'APPROVED' | 'REJECTED' | 'DEFERRED' | 'ESCALATED' | 'CONDITIONAL';
    level: number;
    timestamp: Date;
    rationale: string;
    conditions?: string[];
    validUntil?: Date;
    signature: string;
    delegatedFrom?: string;
}
export interface DocumentCollection {
    id: string;
    name: string;
    type: 'IDENTITY' | 'ADDRESS' | 'FINANCIAL' | 'CORPORATE' | 'REGULATORY' | 'LEGAL' | 'OPERATIONAL';
    required: boolean;
    status: 'PENDING' | 'PARTIAL' | 'COMPLETE' | 'EXPIRED' | 'REJECTED';
    documents: CollectedDocument[];
    completionPercentage: number;
    lastUpdated: Date;
    reviewDate: Date;
    expiryTracking: boolean;
}
export interface CollectedDocument {
    id: string;
    name: string;
    type: string;
    received: Date;
    expiry?: Date;
    status: 'PENDING_REVIEW' | 'APPROVED' | 'REJECTED' | 'EXPIRED' | 'REQUIRES_UPDATE';
    reviewComments?: string[];
    hash: string;
    encrypted: boolean;
    accessLog: AccessRecord[];
}
export interface AccessRecord {
    user: string;
    action: 'VIEW' | 'DOWNLOAD' | 'PRINT' | 'COPY' | 'EDIT' | 'DELETE';
    timestamp: Date;
    ipAddress: string;
    reason?: string;
}
export interface MonitoringConfiguration {
    enabled: boolean;
    frequency: 'CONTINUOUS' | 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'QUARTERLY' | 'ANNUALLY';
    triggers: MonitoringTrigger[];
    alertThresholds: Map<string, number>;
    reviewSchedule: ReviewSchedule[];
    automatedActions: AutomatedAction[];
    escalationMatrix: EscalationRule[];
}
export interface MonitoringTrigger {
    id: string;
    name: string;
    type: 'TRANSACTION' | 'BEHAVIORAL' | 'NEWS' | 'REGULATORY' | 'TEMPORAL' | 'THRESHOLD';
    condition: string;
    severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    action: 'LOG' | 'ALERT' | 'REVIEW' | 'ESCALATE' | 'SUSPEND' | 'BLOCK';
    enabled: boolean;
    lastTriggered?: Date;
    triggerCount: number;
}
export interface ReviewSchedule {
    type: 'PERIODIC' | 'RISK_BASED' | 'EVENT_DRIVEN' | 'REGULATORY';
    frequency: string;
    nextReview: Date;
    scope: string[];
    assignee?: string;
    automated: boolean;
}
export interface AutomatedAction {
    trigger: string;
    action: 'REFRESH_SCREENING' | 'UPDATE_RISK_SCORE' | 'GENERATE_REPORT' | 'NOTIFY_ANALYST' | 'SUSPEND_ACCOUNT';
    parameters: Map<string, any>;
    enabled: boolean;
    lastExecuted?: Date;
}
export interface EscalationRule {
    condition: string;
    level: number;
    recipient: string;
    timeframe: number;
    action: 'NOTIFY' | 'APPROVE' | 'REJECT' | 'DEFER';
    mandatory: boolean;
}
export interface ComplianceCheck {
    id: string;
    regulation: string;
    requirement: string;
    status: 'COMPLIANT' | 'NON_COMPLIANT' | 'PARTIAL' | 'PENDING' | 'NOT_APPLICABLE';
    lastChecked: Date;
    nextCheck: Date;
    automated: boolean;
    findings: string[];
    evidence: string[];
    remediation?: string;
    deadline?: Date;
}
export interface DueDiligenceRequest {
    entityId: string;
    entityType: string;
    tier?: 'SIMPLIFIED' | 'STANDARD' | 'ENHANCED' | 'SUPREME';
    jurisdiction: string;
    purpose: string;
    requesterId: string;
    priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
    deadline?: Date;
    specialRequirements?: string[];
    budgetLimit?: number;
    riskTolerance?: 'LOW' | 'MEDIUM' | 'HIGH';
    regulatoryDrivers?: string[];
    businessJustification: string;
}
export interface DueDiligenceTemplate {
    id: string;
    name: string;
    description: string;
    entityType: string;
    jurisdiction: string;
    tier: string;
    components: ComponentTemplate[];
    estimatedDuration: number;
    estimatedCost: number;
    requiredApprovals: number;
    complianceFrameworks: string[];
    lastUpdated: Date;
    version: string;
    active: boolean;
}
export interface ComponentTemplate {
    type: string;
    required: boolean;
    priority: string;
    estimatedDuration: number;
    estimatedCost: number;
    automated: boolean;
    dependencies: string[];
    documentRequirements: string[];
    thresholds: Map<string, number>;
}
export interface DueDiligenceMetrics {
    totalProfiles: number;
    activeProfiles: number;
    completionRate: number;
    averageProcessingTime: number;
    costEfficiency: number;
    riskDetectionRate: number;
    complianceRate: number;
    escalationRate: number;
    automationRate: number;
    qualityScore: number;
    timeliness: number;
    resourceUtilization: number;
}
export declare class DueDiligenceAutomation extends EventEmitter {
    private logger;
    private cryptoManager;
    private auditTrail;
    private verificationEngine;
    private complianceModule;
    private profiles;
    private templates;
    private activeRequests;
    private workQueue;
    private config;
    private riskModels;
    private mlModels;
    private metrics;
    constructor(cryptoManager: QuantumCryptoManagerV2, auditTrail: AuditTrailManager, verificationEngine: VerificationEngine, complianceModule: LegalComplianceModule);
    initialize(): Promise<void>;
    private initializeTemplates;
    private initializeRiskModels;
    private initializeMachineLearning;
    initiateDueDiligence(request: DueDiligenceRequest): Promise<string>;
    private validateDueDiligenceRequest;
    private selectTemplate;
    private createDueDiligenceProfile;
    private calculateInitialRiskRating;
    private assessGeographicRisk;
    private assessEntityTypeRisk;
    private applyMLRiskPrediction;
    private determineTierFromRisk;
    private createComponentsFromTemplate;
    private getComponentName;
    private getComponentDescription;
    private createMonitoringConfiguration;
    private getMonitoringFrequency;
    private createMonitoringTriggers;
    private createReviewSchedule;
    private getReviewInterval;
    private createAutomatedActions;
    private createEscalationMatrix;
    private processDueDiligenceProfile;
    private determineDependencyOrder;
    private processComponent;
    private processAutomatedComponent;
    private processKYCComponent;
    private processPEPScreening;
    private processSanctionsScreening;
    private processAdverseMediaScreening;
    private processGenericAutomatedComponent;
    private getComponentSuccessRate;
    private processManualComponent;
    private assignAnalyst;
    private getManualReviewTime;
    private waitForVerificationResult;
    private convertVerificationResultToFindings;
    private calculateComponentScore;
    private calculateComponentConfidence;
    private finalizeProfile;
    private calculateFinalRiskRating;
    private determineApprovalRequirements;
    private calculateExpiryDate;
    private generateApprovalSignature;
    private updateQuantumSignature;
    private startBackgroundProcesses;
    private performPeriodicMonitoring;
    private evaluateMonitoringTriggers;
    private evaluateTriggerCondition;
    private handleTriggeredMonitoring;
    private scheduleProfileReview;
    private escalateProfile;
    private updateMetrics;
    private calculateAverageProcessingTime;
    private calculateCostEfficiency;
    private calculateRiskDetectionRate;
    private calculateComplianceRate;
    private calculateEscalationRate;
    private calculateAutomationRate;
    private calculateQualityScore;
    private calculateTimeliness;
    private calculateResourceUtilization;
    private checkProfileExpiry;
    getDueDiligenceProfile(profileId: string): Promise<DueDiligenceProfile | null>;
    getProfilesByEntity(entityId: string): Promise<DueDiligenceProfile[]>;
    getMetrics(): Promise<DueDiligenceMetrics>;
    addTemplate(template: DueDiligenceTemplate): Promise<void>;
    approveProfile(profileId: string, approver: string, decision: 'APPROVED' | 'REJECTED' | 'DEFERRED'): Promise<boolean>;
}
//# sourceMappingURL=DueDiligenceAutomation.d.ts.map