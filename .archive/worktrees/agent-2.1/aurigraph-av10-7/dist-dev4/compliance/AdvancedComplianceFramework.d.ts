/**
 * AV10-24: Advanced Compliance and Regulatory Framework
 *
 * Comprehensive Security/Compliance Agent for regulatory compliance
 * system for DLT operations across multiple jurisdictions.
 *
 * Features:
 * - Multi-jurisdiction compliance (US, EU, UK, CA, AU, SG, JP)
 * - Automated regulatory reporting
 * - Real-time compliance monitoring
 * - Regulatory rule engine
 * - Compliance dashboards
 * - Automated KYC/AML checks
 * - Risk assessment and scoring
 * - Audit trail management
 */
import { EventEmitter } from 'events';
import { QuantumCryptoManagerV2 } from '../crypto/QuantumCryptoManagerV2';
import { VerificationEngine } from '../verification/VerificationEngine';
export interface ComplianceJurisdiction {
    code: string;
    name: string;
    regulations: string[];
    riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    reportingFrequency: 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'QUARTERLY' | 'ANNUALLY';
    contactInfo: {
        regulatorName: string;
        contactEmail?: string;
        reportingPortal?: string;
        apiEndpoint?: string;
    };
    complianceRequirements: ComplianceRequirement[];
}
export interface ComplianceRequirement {
    id: string;
    name: string;
    description: string;
    jurisdiction: string;
    regulation: string;
    type: 'KYC' | 'AML' | 'DATA_PROTECTION' | 'FINANCIAL_REPORTING' | 'TRANSACTION_MONITORING' | 'AUDIT_TRAIL';
    mandatory: boolean;
    riskWeight: number;
    checkFrequency: 'REAL_TIME' | 'HOURLY' | 'DAILY' | 'WEEKLY' | 'MONTHLY';
    automationLevel: 'FULLY_AUTOMATED' | 'SEMI_AUTOMATED' | 'MANUAL';
    validationRules: ValidationRule[];
    reportingTemplate?: string;
    penaltyLevel: 'WARNING' | 'MINOR' | 'MAJOR' | 'CRITICAL';
}
export interface ValidationRule {
    id: string;
    field: string;
    operator: 'EQUALS' | 'CONTAINS' | 'GREATER_THAN' | 'LESS_THAN' | 'MATCHES_REGEX' | 'IN_LIST' | 'NOT_NULL';
    value: any;
    errorMessage: string;
    severity: 'INFO' | 'WARNING' | 'ERROR' | 'CRITICAL';
}
export interface ComplianceCheck {
    id: string;
    timestamp: Date;
    entityId: string;
    entityType: 'INDIVIDUAL' | 'CORPORATE' | 'TRANSACTION' | 'ASSET' | 'SYSTEM';
    jurisdiction: string;
    requirements: string[];
    status: 'PENDING' | 'IN_PROGRESS' | 'PASSED' | 'FAILED' | 'REQUIRES_MANUAL_REVIEW';
    results: ComplianceResult[];
    overallScore: number;
    riskScore: number;
    violations: ComplianceViolation[];
    remediation: RemediationAction[];
    nextReviewDate?: Date;
    expiryDate?: Date;
    metadata: Record<string, any>;
}
export interface ComplianceResult {
    requirementId: string;
    status: 'PASSED' | 'FAILED' | 'WARNING' | 'MANUAL_REVIEW';
    score: number;
    details: string;
    evidence: Evidence[];
    timestamp: Date;
    reviewer?: string;
    automatedCheck: boolean;
}
export interface Evidence {
    type: 'DOCUMENT' | 'API_RESPONSE' | 'BLOCKCHAIN_TRANSACTION' | 'BIOMETRIC' | 'SYSTEM_LOG';
    source: string;
    hash: string;
    timestamp: Date;
    verified: boolean;
    retentionPeriod: number;
}
export interface ComplianceViolation {
    id: string;
    requirementId: string;
    severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    description: string;
    impact: string;
    detected: Date;
    status: 'OPEN' | 'ACKNOWLEDGED' | 'REMEDIATED' | 'CLOSED';
    assignedTo?: string;
    dueDate?: Date;
    resolution?: string;
    resolvedDate?: Date;
}
export interface RemediationAction {
    id: string;
    type: 'DOCUMENTATION' | 'ADDITIONAL_VERIFICATION' | 'RISK_MITIGATION' | 'PROCESS_IMPROVEMENT' | 'TRAINING';
    description: string;
    priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
    assignedTo?: string;
    dueDate?: Date;
    status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'OVERDUE';
    completedDate?: Date;
    notes?: string;
}
export interface RegulatoryReport {
    id: string;
    jurisdiction: string;
    reportType: string;
    reportingPeriod: {
        startDate: Date;
        endDate: Date;
    };
    generatedDate: Date;
    submittedDate?: Date;
    status: 'DRAFT' | 'READY' | 'SUBMITTED' | 'ACKNOWLEDGED' | 'REJECTED';
    format: 'XML' | 'JSON' | 'CSV' | 'PDF' | 'XLSX';
    data: any;
    submissionReference?: string;
    acknowledgmentReference?: string;
    errors?: string[];
    warnings?: string[];
    nextDueDate?: Date;
}
export interface ComplianceFrameworkConfig {
    enableRealTimeMonitoring: boolean;
    enableAutomaticReporting: boolean;
    enableRiskBasedApproach: boolean;
    enableMLEnhancedCompliance: boolean;
    defaultJurisdictions: string[];
    riskThresholds: {
        low: number;
        medium: number;
        high: number;
        critical: number;
    };
    reportingConfig: {
        retentionPeriodYears: number;
        encryptionEnabled: boolean;
        auditTrailEnabled: boolean;
        autoSubmissionEnabled: boolean;
    };
    notifications: {
        violationAlerts: boolean;
        reportDeadlines: boolean;
        regulatoryUpdates: boolean;
        emailRecipients: string[];
        slackWebhook?: string;
    };
    integration: {
        externalDataSources: boolean;
        blockchainVerification: boolean;
        biometricVerification: boolean;
        governmentAPIs: boolean;
    };
}
export declare class AdvancedComplianceFramework extends EventEmitter {
    private logger;
    private quantumCrypto;
    private verificationEngine?;
    private config;
    private jurisdictions;
    private requirements;
    private activeChecks;
    private violations;
    private reports;
    private monitoringInterval;
    private reportingScheduler;
    private complianceRules;
    constructor(quantumCrypto: QuantumCryptoManagerV2, verificationEngine?: VerificationEngine, config?: Partial<ComplianceFrameworkConfig>);
    initialize(): Promise<void>;
    performComplianceCheck(entityId: string, entityType: ComplianceCheck['entityType'], jurisdictions: string[], entityData: Record<string, any>): Promise<ComplianceCheck>;
    generateRegulatoryReport(jurisdiction: string, reportType: string, periodStart: Date, periodEnd: Date): Promise<RegulatoryReport>;
    submitReport(reportId: string): Promise<boolean>;
    performRiskAssessment(entityId: string, entityType: ComplianceCheck['entityType'], entityData: Record<string, any>): Promise<{
        riskScore: number;
        riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
        riskFactors: Array<{
            factor: string;
            weight: number;
            score: number;
            description: string;
        }>;
        recommendations: string[];
    }>;
    getSystemStatus(): any;
    getJurisdictions(): ComplianceJurisdiction[];
    getRequirements(jurisdiction?: string): ComplianceRequirement[];
    getActiveViolations(): ComplianceViolation[];
    getComplianceCheck(checkId: string): ComplianceCheck | undefined;
    getReport(reportId: string): RegulatoryReport | undefined;
    getPerformanceMetrics(): any;
    private initializeJurisdictions;
    private initializeComplianceRequirements;
    private initializeRegulatoryRules;
    private getApplicableRequirements;
    private performRequirementCheck;
    private validateRule;
    private performExternalVerification;
    private calculateComplianceScore;
    private calculateRiskScore;
    private createViolation;
    private generateRemediationActions;
    private calculateNextReviewDate;
    private calculateExpiryDate;
    private sendViolationNotifications;
    private gatherComplianceData;
    private formatRegulatoryData;
    private groupChecksByType;
    private groupViolationsByType;
    private calculateRiskMetrics;
    private validateReportData;
    private calculateNextReportDueDate;
    private submitToRegulatoryPortal;
    private assessGeographicRisk;
    private assessTransactionVolumeRisk;
    private assessEntityTypeRisk;
    private assessComplianceHistory;
    private assessExternalDataRisk;
    private isOnSanctionsList;
    private generateRiskRecommendations;
    private startRealTimeMonitoring;
    private startReportingScheduler;
    private getAllRemediationActions;
    private isReportDue;
    private calculateReportingPeriod;
    stop(): Promise<void>;
}
//# sourceMappingURL=AdvancedComplianceFramework.d.ts.map