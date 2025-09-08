import { EventEmitter } from 'events';
import { QuantumCryptoManagerV2 } from '../crypto/QuantumCryptoManagerV2';
import { AuditTrailManager } from '../rwa/audit/AuditTrailManager';
export interface LegalFramework {
    id: string;
    name: string;
    jurisdiction: string;
    type: 'FEDERAL' | 'STATE' | 'INTERNATIONAL' | 'SECTORAL' | 'SELF_REGULATORY';
    category: 'KYC' | 'AML' | 'SANCTIONS' | 'DATA_PROTECTION' | 'SECURITIES' | 'BANKING' | 'CRYPTO' | 'TAX';
    version: string;
    effectiveDate: Date;
    superseded?: Date;
    authority: string;
    description: string;
    requirements: LegalRequirement[];
    penalties: Penalty[];
    reportingObligations: ReportingObligation[];
    active: boolean;
    riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    applicability: {
        entityTypes: string[];
        transactionTypes: string[];
        thresholds: Map<string, number>;
        geographies: string[];
    };
}
export interface LegalRequirement {
    id: string;
    title: string;
    description: string;
    type: 'MANDATORY' | 'CONDITIONAL' | 'OPTIONAL' | 'BEST_PRACTICE';
    category: string;
    implementation: {
        controls: string[];
        documentation: string[];
        monitoring: string[];
        reporting: string[];
    };
    verification: {
        method: 'AUTOMATED' | 'MANUAL' | 'HYBRID';
        frequency: 'REAL_TIME' | 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'QUARTERLY' | 'ANNUALLY';
        evidence: string[];
    };
    exemptions: string[];
    dependencies: string[];
}
export interface Penalty {
    type: 'FINE' | 'SUSPENSION' | 'REVOCATION' | 'CRIMINAL' | 'CIVIL' | 'ADMINISTRATIVE';
    severity: 'MINOR' | 'MODERATE' | 'SEVERE' | 'CRITICAL';
    minAmount?: number;
    maxAmount?: number;
    description: string;
    conditions: string[];
}
export interface ReportingObligation {
    id: string;
    name: string;
    authority: string;
    frequency: 'IMMEDIATE' | 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'QUARTERLY' | 'ANNUALLY';
    threshold?: number;
    format: 'XML' | 'JSON' | 'PDF' | 'CSV' | 'FORM';
    deadline: string;
    automated: boolean;
    template?: string;
}
export interface ComplianceAssessment {
    id: string;
    entityId: string;
    entityType: string;
    jurisdiction: string;
    assessmentDate: Date;
    frameworks: FrameworkAssessment[];
    overallStatus: 'COMPLIANT' | 'NON_COMPLIANT' | 'PARTIALLY_COMPLIANT' | 'UNDER_REVIEW';
    riskScore: number;
    criticalIssues: ComplianceIssue[];
    recommendations: ComplianceRecommendation[];
    nextReviewDate: Date;
    assessor: string;
    signature: string;
    hash: string;
}
export interface FrameworkAssessment {
    frameworkId: string;
    status: 'COMPLIANT' | 'NON_COMPLIANT' | 'PARTIALLY_COMPLIANT' | 'NOT_APPLICABLE';
    requirementResults: RequirementResult[];
    exemptionsApplied: string[];
    riskScore: number;
    lastAssessed: Date;
    evidence: ComplianceEvidence[];
}
export interface RequirementResult {
    requirementId: string;
    status: 'MET' | 'NOT_MET' | 'PARTIALLY_MET' | 'NOT_APPLICABLE';
    score: number;
    findings: string[];
    evidence: string[];
    gaps: string[];
    recommendations: string[];
}
export interface ComplianceIssue {
    id: string;
    frameworkId: string;
    requirementId: string;
    severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    type: 'GAP' | 'VIOLATION' | 'WEAKNESS' | 'DEFICIENCY';
    description: string;
    impact: string;
    remediation: string;
    deadline: Date;
    status: 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'DEFERRED';
    assignee?: string;
    created: Date;
    updated: Date;
}
export interface ComplianceRecommendation {
    id: string;
    priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
    category: 'POLICY' | 'PROCEDURE' | 'CONTROL' | 'TRAINING' | 'TECHNOLOGY';
    description: string;
    rationale: string;
    implementation: {
        steps: string[];
        timeline: string;
        resources: string[];
        cost: number;
    };
    benefits: string[];
    risks: string[];
}
export interface ComplianceEvidence {
    id: string;
    type: 'DOCUMENT' | 'SCREENSHOT' | 'LOG' | 'CERTIFICATE' | 'ATTESTATION' | 'AUDIT_REPORT';
    source: string;
    description: string;
    hash: string;
    signature: string;
    timestamp: Date;
    validity: Date;
    authentic: boolean;
}
export interface ComplianceMonitoring {
    id: string;
    framework: string;
    rules: MonitoringRule[];
    alerts: ComplianceAlert[];
    metrics: ComplianceMetric[];
    dashboards: string[];
    automated: boolean;
    frequency: string;
}
export interface MonitoringRule {
    id: string;
    name: string;
    condition: string;
    threshold: number;
    operator: 'GT' | 'LT' | 'EQ' | 'NEQ' | 'CONTAINS' | 'PATTERN';
    action: 'ALERT' | 'REPORT' | 'BLOCK' | 'ESCALATE' | 'LOG';
    severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    enabled: boolean;
}
export interface ComplianceAlert {
    id: string;
    ruleId: string;
    severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    title: string;
    description: string;
    entityId: string;
    triggered: Date;
    status: 'OPEN' | 'INVESTIGATING' | 'RESOLVED' | 'FALSE_POSITIVE';
    assignee?: string;
    evidence: string[];
    actions: string[];
}
export interface ComplianceMetric {
    name: string;
    value: number;
    unit: string;
    category: string;
    target?: number;
    status: 'ON_TARGET' | 'BELOW_TARGET' | 'ABOVE_TARGET';
    trend: 'IMPROVING' | 'STABLE' | 'DECLINING';
    lastUpdated: Date;
}
export interface RegulatoryUpdate {
    id: string;
    title: string;
    description: string;
    authority: string;
    jurisdiction: string;
    category: string;
    type: 'NEW_REGULATION' | 'AMENDMENT' | 'INTERPRETATION' | 'GUIDANCE' | 'ENFORCEMENT';
    publishDate: Date;
    effectiveDate: Date;
    impact: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    affectedFrameworks: string[];
    summary: string;
    fullText: string;
    analysisStatus: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED';
    implementationRequired: boolean;
    estimatedCost: number;
    deadline?: Date;
}
export declare class LegalComplianceModule extends EventEmitter {
    private logger;
    private cryptoManager;
    private auditTrail;
    private frameworks;
    private assessments;
    private monitoring;
    private alerts;
    private issues;
    private updates;
    private config;
    private authorities;
    private reportingEndpoints;
    constructor(cryptoManager: QuantumCryptoManagerV2, auditTrail: AuditTrailManager);
    initialize(): Promise<void>;
    private initializeLegalFrameworks;
    private initializeRegulatoryAuthorities;
    private initializeComplianceMonitoring;
    private setupAutomatedReporting;
    performComplianceAssessment(entityId: string, entityType: string, jurisdiction: string, scope?: string[]): Promise<string>;
    private getApplicableFrameworks;
    private assessFramework;
    private assessRequirement;
    private requirementApplies;
    private assessControls;
    private assessDocumentation;
    private assessMonitoring;
    private assessReporting;
    private identifyRequirementGaps;
    private generateRequirementRecommendations;
    private calculateOverallStatus;
    private calculateRiskScore;
    private calculateFrameworkRiskScore;
    private identifyCriticalIssues;
    private calculateIssueImpact;
    private generateRemediation;
    private getRemediationDeadline;
    private generateRecommendations;
    private generateComplianceEvidence;
    private startBackgroundProcesses;
    private performContinuousMonitoring;
    private evaluateMonitoringRule;
    private handleRuleViolation;
    private executeRuleAction;
    private checkRegulatoryUpdates;
    private generatePeriodicReports;
    private calculateComplianceMetrics;
    private getPatriotActRequirements;
    private getBSARequirements;
    private getPatriotActPenalties;
    private getPatriotActReporting;
    private getBSAPenalties;
    private getBSAReporting;
    private getGDPRRequirements;
    private getGDPRPenalties;
    private getGDPRReporting;
    private getMiCARequirements;
    private getMiCAPenalties;
    private getMiCAReporting;
    private getFCACryptoRequirements;
    private getFCACryptoPenalties;
    private getFCACryptoReporting;
    private getPSARequirements;
    private getPSAPenalties;
    private getPSAReporting;
    private submitComplianceReport;
    private escalateAlert;
    private blockActivity;
    private submitImmediateReport;
    getComplianceAssessment(assessmentId: string): Promise<ComplianceAssessment | null>;
    getLegalFrameworks(jurisdiction?: string, category?: string): Promise<LegalFramework[]>;
    getComplianceAlerts(status?: string, severity?: string): Promise<ComplianceAlert[]>;
    getComplianceMetrics(): Promise<any>;
    addLegalFramework(framework: LegalFramework): Promise<void>;
}
//# sourceMappingURL=LegalComplianceModule.d.ts.map