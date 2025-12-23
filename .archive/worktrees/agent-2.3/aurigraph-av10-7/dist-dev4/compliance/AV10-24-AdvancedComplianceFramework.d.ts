/**
 * AV10-24: Advanced Compliance Framework
 * Comprehensive regulatory compliance with automated enforcement and multi-jurisdiction support
 */
import { EventEmitter } from 'events';
export interface ComplianceRule {
    id: string;
    name: string;
    jurisdiction: string;
    category: ComplianceCategory;
    requirements: ComplianceRequirement[];
    enforcement: EnforcementLevel;
    validFrom: Date;
    validTo?: Date;
    automatedChecks: AutomatedCheck[];
    remediationActions: RemediationAction[];
}
export interface ComplianceRequirement {
    id: string;
    description: string;
    checkType: CheckType;
    parameters: Record<string, any>;
    severity: Severity;
    evidence: EvidenceRequirement[];
}
export interface AutomatedCheck {
    id: string;
    name: string;
    frequency: CheckFrequency;
    script: string;
    expectedResult: any;
    tolerance?: number;
}
export interface RemediationAction {
    id: string;
    trigger: ViolationType;
    action: ActionType;
    parameters: Record<string, any>;
    notification: NotificationConfig;
}
export interface ComplianceReport {
    id: string;
    timestamp: Date;
    jurisdiction: string;
    status: ComplianceStatus;
    violations: ComplianceViolation[];
    evidence: ComplianceEvidence[];
    score: number;
    recommendations: string[];
    certifications: ComplianceCertification[];
}
export interface ComplianceViolation {
    ruleId: string;
    requirementId: string;
    severity: Severity;
    description: string;
    detectedAt: Date;
    evidence: any;
    remediation: RemediationStatus;
}
export interface ComplianceEvidence {
    id: string;
    type: EvidenceType;
    data: any;
    hash: string;
    timestamp: Date;
    source: string;
    verified: boolean;
}
export interface ComplianceCertification {
    standard: string;
    level: string;
    validFrom: Date;
    validTo: Date;
    certifier: string;
    certificate: string;
}
export declare enum ComplianceCategory {
    KYC = "KYC",
    AML = "AML",
    DATA_PRIVACY = "DATA_PRIVACY",
    SECURITIES = "SECURITIES",
    TAX = "TAX",
    ENVIRONMENTAL = "ENVIRONMENTAL",
    CONSUMER_PROTECTION = "CONSUMER_PROTECTION",
    CRYPTO_ASSETS = "CRYPTO_ASSETS"
}
export declare enum EnforcementLevel {
    ADVISORY = "ADVISORY",
    WARNING = "WARNING",
    MANDATORY = "MANDATORY",
    CRITICAL = "CRITICAL",
    BLOCKING = "BLOCKING"
}
export declare enum CheckType {
    IDENTITY_VERIFICATION = "IDENTITY_VERIFICATION",
    TRANSACTION_MONITORING = "TRANSACTION_MONITORING",
    RISK_ASSESSMENT = "RISK_ASSESSMENT",
    DATA_AUDIT = "DATA_AUDIT",
    REGULATORY_FILING = "REGULATORY_FILING",
    SMART_CONTRACT_AUDIT = "SMART_CONTRACT_AUDIT"
}
export declare enum Severity {
    LOW = "LOW",
    MEDIUM = "MEDIUM",
    HIGH = "HIGH",
    CRITICAL = "CRITICAL"
}
export declare enum CheckFrequency {
    REALTIME = "REALTIME",
    HOURLY = "HOURLY",
    DAILY = "DAILY",
    WEEKLY = "WEEKLY",
    MONTHLY = "MONTHLY",
    QUARTERLY = "QUARTERLY",
    ANNUALLY = "ANNUALLY"
}
export declare enum ViolationType {
    THRESHOLD_EXCEEDED = "THRESHOLD_EXCEEDED",
    MISSING_DATA = "MISSING_DATA",
    UNAUTHORIZED_ACCESS = "UNAUTHORIZED_ACCESS",
    POLICY_VIOLATION = "POLICY_VIOLATION",
    REGULATORY_BREACH = "REGULATORY_BREACH"
}
export declare enum ActionType {
    LOG = "LOG",
    ALERT = "ALERT",
    BLOCK = "BLOCK",
    FREEZE = "FREEZE",
    REPORT = "REPORT",
    ESCALATE = "ESCALATE",
    AUTO_REMEDIATE = "AUTO_REMEDIATE"
}
export declare enum ComplianceStatus {
    COMPLIANT = "COMPLIANT",
    PARTIALLY_COMPLIANT = "PARTIALLY_COMPLIANT",
    NON_COMPLIANT = "NON_COMPLIANT",
    UNDER_REVIEW = "UNDER_REVIEW",
    EXEMPTED = "EXEMPTED"
}
export declare enum EvidenceType {
    LOG = "LOG",
    DOCUMENT = "DOCUMENT",
    AUDIT_TRAIL = "AUDIT_TRAIL",
    ATTESTATION = "ATTESTATION",
    CRYPTOGRAPHIC_PROOF = "CRYPTOGRAPHIC_PROOF"
}
export declare enum RemediationStatus {
    PENDING = "PENDING",
    IN_PROGRESS = "IN_PROGRESS",
    COMPLETED = "COMPLETED",
    FAILED = "FAILED",
    ESCALATED = "ESCALATED"
}
export interface NotificationConfig {
    channels: string[];
    recipients: string[];
    template: string;
    priority: string;
}
export interface EvidenceRequirement {
    type: EvidenceType;
    description: string;
    retention: number;
    encryption: boolean;
}
/**
 * Advanced Compliance Framework
 * Manages multi-jurisdiction compliance with automated enforcement
 */
export declare class AdvancedComplianceFramework extends EventEmitter {
    private logger;
    private rules;
    private violations;
    private evidence;
    private reports;
    private checkScheduler;
    private jurisdictionRules;
    private certifications;
    private readonly JURISDICTIONS;
    private readonly THRESHOLDS;
    constructor();
    private initializeFramework;
    /**
     * Load jurisdiction-specific compliance rules
     */
    private loadJurisdictionRules;
    private loadUSRegulations;
    private loadEURegulations;
    private loadGlobalRegulations;
    /**
     * Add compliance rule to framework
     */
    addRule(rule: ComplianceRule): void;
    /**
     * Setup automated compliance checks
     */
    private setupAutomatedChecks;
    private setupTransactionMonitoring;
    private performTransactionCompliance;
    private getRecentTransactions;
    private checkTransaction;
    private isSuspiciousPattern;
    private handleViolations;
    private executeRemediation;
    private shouldTriggerAction;
    private performAction;
    private blockTransaction;
    private freezeAssets;
    private fileRegulatoryReport;
    private sendAlert;
    private autoRemediate;
    private setupIdentityVerification;
    private performKYCCompliance;
    private getKYCCompletionRate;
    private setupRiskAssessment;
    private performRiskAssessment;
    private calculateRiskScore;
    private setupDataAudits;
    private performDataPrivacyAudit;
    private detectUnauthorizedDataProcessing;
    private setupSmartContractAudits;
    private performSmartContractAudit;
    private auditSmartContracts;
    /**
     * Schedule automated checks for a rule
     */
    private scheduleAutomatedChecks;
    private getCheckInterval;
    private runAutomatedCheck;
    private executeCheckScript;
    /**
     * Setup reporting engine
     */
    private setupReportingEngine;
    private generateComplianceReport;
    private calculateOverallCompliance;
    private getRecentViolations;
    private getRecentEvidence;
    private calculateComplianceScore;
    private generateRecommendations;
    /**
     * Start compliance monitoring
     */
    private startComplianceMonitoring;
    private performUserCompliance;
    private checkSanctions;
    private auditSmartContract;
    /**
     * Public API methods
     */
    checkCompliance(jurisdiction: string, entity: any): Promise<ComplianceReport>;
    private checkEntityAgainstRule;
    private checkRequirement;
    getComplianceStatus(jurisdiction?: string): ComplianceReport | null;
    addCertification(certification: ComplianceCertification): void;
    generateAuditReport(startDate: Date, endDate: Date): Promise<any>;
    /**
     * Stop compliance monitoring
     */
    stop(): void;
}
export declare const complianceFramework: AdvancedComplianceFramework;
//# sourceMappingURL=AV10-24-AdvancedComplianceFramework.d.ts.map