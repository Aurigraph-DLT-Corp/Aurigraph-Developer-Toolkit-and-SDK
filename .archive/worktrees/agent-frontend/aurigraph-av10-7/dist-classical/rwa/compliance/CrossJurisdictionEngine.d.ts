import { EventEmitter } from 'events';
import { KYCProfile } from './KYCManager';
import { Asset } from '../registry/AssetRegistry';
import { QuantumCryptoManagerV2 } from '../../crypto/QuantumCryptoManagerV2';
export interface JurisdictionRule {
    jurisdictionId: string;
    countryCode: string;
    jurisdictionName: string;
    regulations: RegulationFramework[];
    complianceRequirements: ComplianceRule[];
    restrictions: InvestmentRestriction[];
    reportingRequirements: ReportingRule[];
    taxImplications: TaxRule[];
    lastUpdated: Date;
    effectiveDate: Date;
}
export interface RegulationFramework {
    regulationId: string;
    name: string;
    authority: string;
    type: 'SECURITIES' | 'BANKING' | 'TAX' | 'AML' | 'DATA_PROTECTION' | 'ENVIRONMENTAL';
    applicability: string[];
    penalties: PenaltyStructure[];
    complianceDeadlines: ComplianceDeadline[];
}
export interface ComplianceRule {
    ruleId: string;
    name: string;
    description: string;
    category: string;
    mandatory: boolean;
    validationMethod: string;
    automation: AutomationConfig;
    exceptions: RuleException[];
}
export interface InvestmentRestriction {
    restrictionId: string;
    type: 'INVESTOR_TYPE' | 'AMOUNT_LIMIT' | 'ASSET_TYPE' | 'GEOGRAPHIC' | 'SECTORAL';
    description: string;
    threshold?: number;
    applicableAssets: string[];
    exemptions: string[];
}
export interface ReportingRule {
    reportId: string;
    reportType: string;
    frequency: 'REAL_TIME' | 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'QUARTERLY' | 'ANNUALLY';
    deadline: string;
    format: 'XML' | 'JSON' | 'CSV' | 'PDF';
    recipients: string[];
    automation: boolean;
}
export interface TaxRule {
    taxId: string;
    taxType: 'CAPITAL_GAINS' | 'INCOME' | 'WITHHOLDING' | 'TRANSACTION' | 'STAMP_DUTY';
    rate: number;
    calculation: string;
    applicability: TaxApplicability;
    exemptions: TaxExemption[];
}
export interface TaxApplicability {
    assetTypes: string[];
    transactionTypes: string[];
    investorTypes: string[];
    minimumHolding?: number;
    residencyRequirement?: boolean;
}
export interface TaxExemption {
    exemptionId: string;
    description: string;
    conditions: string[];
    documentationRequired: string[];
}
export interface PenaltyStructure {
    violationType: string;
    penaltyType: 'FINE' | 'SUSPENSION' | 'REVOCATION' | 'CRIMINAL';
    amount?: number;
    description: string;
    escalation: string[];
}
export interface ComplianceDeadline {
    requirement: string;
    deadline: string;
    grace_period?: number;
    consequences: string[];
}
export interface AutomationConfig {
    automated: boolean;
    aiModel?: string;
    confidence: number;
    humanReview: boolean;
    escalationRules: string[];
}
export interface RuleException {
    exceptionId: string;
    conditions: string[];
    validUntil?: Date;
    approvedBy: string;
}
export interface ComplianceAssessment {
    assessmentId: string;
    userId: string;
    assetId?: string;
    jurisdictions: string[];
    overallStatus: 'COMPLIANT' | 'NON_COMPLIANT' | 'CONDITIONAL' | 'PENDING_REVIEW';
    jurisdictionResults: Map<string, JurisdictionComplianceResult>;
    restrictions: string[];
    requiredActions: string[];
    assessmentDate: Date;
    validUntil: Date;
}
export interface JurisdictionComplianceResult {
    jurisdiction: string;
    compliant: boolean;
    score: number;
    passedRules: string[];
    failedRules: string[];
    warnings: string[];
    requiredDocuments: string[];
    estimatedResolution: Date;
}
export interface AutomatedReporting {
    reportId: string;
    jurisdiction: string;
    reportType: string;
    generationDate: Date;
    submissionDate?: Date;
    status: 'GENERATED' | 'SUBMITTED' | 'ACKNOWLEDGED' | 'REJECTED';
    data: any;
    acknowledgment?: string;
}
export declare class CrossJurisdictionEngine extends EventEmitter {
    private jurisdictionRules;
    private complianceAssessments;
    private automatedReports;
    private cryptoManager;
    constructor(cryptoManager: QuantumCryptoManagerV2);
    private initializeJurisdictions;
    assessMultiJurisdictionCompliance(user: KYCProfile, asset?: Asset, transactionType?: string): Promise<ComplianceAssessment>;
    private determineApplicableJurisdictions;
    private assessJurisdictionCompliance;
    private evaluateComplianceRule;
    private aiEvaluateRule;
    private evaluateInvestmentRestriction;
    private evaluateTaxCompliance;
    private doesTaxRuleApply;
    generateAutomatedReport(jurisdiction: string, reportType: string): Promise<string>;
    private generateReportData;
    private submitReport;
    private simulateRegulatorySubmission;
    private startAutomatedReporting;
    private processAutomatedReporting;
    private isReportDue;
    updateJurisdictionRules(jurisdiction: string, updates: Partial<JurisdictionRule>): Promise<boolean>;
    getComplianceGaps(assessmentId: string): Promise<{
        criticalGaps: ComplianceGap[];
        warnings: ComplianceGap[];
        recommendations: string[];
    }>;
    private generateComplianceRecommendations;
    private extractCountryFromLocation;
    getJurisdictionRules(jurisdiction: string): Promise<JurisdictionRule | null>;
    getSupportedJurisdictions(): Promise<string[]>;
    getComplianceReport(): Promise<{
        totalAssessments: number;
        complianceRate: number;
        jurisdictionBreakdown: Record<string, number>;
        commonGaps: string[];
        automatedReports: number;
    }>;
    private generateAssessmentId;
    private generateReportId;
}
interface ComplianceGap {
    jurisdiction: string;
    ruleType: string;
    severity: 'CRITICAL' | 'WARNING' | 'INFO';
    description: string;
    resolution: string;
    estimatedTime: number;
}
export {};
//# sourceMappingURL=CrossJurisdictionEngine.d.ts.map