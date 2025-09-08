import { AuditTrailManager, AuditReport } from '../audit/AuditTrailManager';
import { AssetRegistry } from '../registry/AssetRegistry';
import { MultiAssetClassManager } from '../registry/MultiAssetClassManager';
export interface DashboardMetrics {
    tokenization: {
        totalAssets: number;
        totalTokens: number;
        totalValue: number;
        assetsByClass: Record<string, number>;
        tokenizationsByModel: Record<string, number>;
        recentActivity: any[];
    };
    compliance: {
        status: 'COMPLIANT' | 'VIOLATIONS_DETECTED' | 'UNDER_REVIEW';
        violationsLast30d: number;
        complianceScore: number;
        jurisdictionStatus: Record<string, string>;
        pendingReviews: number;
    };
    performance: {
        tps: number;
        latency: number;
        uptime: number;
        nodeCount: number;
        channelActivity: Record<string, number>;
    };
    security: {
        incidentsLast24h: number;
        threatLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
        accessAttempts: number;
        failedLogins: number;
        securityScore: number;
    };
}
export interface ScheduledReport {
    id: string;
    name: string;
    type: AuditReport['type'];
    schedule: 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'QUARTERLY' | 'ANNUALLY';
    jurisdiction: string;
    recipients: string[];
    filters: any;
    nextRun: number;
    lastRun?: number;
    isActive: boolean;
    autoSubmit: boolean;
    regulatoryAuthority?: string;
}
export interface RegulatorySubmission {
    id: string;
    reportId: string;
    authority: string;
    jurisdiction: string;
    submissionDate: number;
    status: 'PENDING' | 'SUBMITTED' | 'ACKNOWLEDGED' | 'REJECTED';
    confirmationNumber?: string;
    deadline?: number;
    requirements: string[];
    documents: string[];
}
export declare class ReportingEngine {
    private auditManager;
    private assetRegistry;
    private multiAssetManager;
    private scheduledReports;
    private submissions;
    private reportCache;
    constructor(auditManager: AuditTrailManager, assetRegistry: AssetRegistry, multiAssetManager: MultiAssetClassManager);
    private initializeDefaultReports;
    getDashboardMetrics(): Promise<DashboardMetrics>;
    createScheduledReport(config: Omit<ScheduledReport, 'id' | 'nextRun'>): Promise<string>;
    private calculateNextRun;
    private startScheduledReporting;
    private executeScheduledReport;
    private getReportStartTime;
    private notifyReportRecipients;
    generateCustomReport(title: string, type: AuditReport['type'], startTime: number, endTime: number, filters?: any, jurisdiction?: string): Promise<AuditReport>;
    generateTokenizationReport(assetClass?: string, tokenizationModel?: string, timeframe?: 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'QUARTERLY'): Promise<AuditReport>;
    generateComplianceReport(jurisdiction: string, regulatoryFramework: string, timeframe?: 'MONTHLY' | 'QUARTERLY' | 'ANNUALLY'): Promise<AuditReport>;
    private analyzeComplianceEvents;
    private generateComplianceRecommendations;
    private getTimeframeStart;
    submitRegulatoryReport(reportId: string, authority: string, jurisdiction: string, deadline?: number): Promise<string>;
    private getRegulatoryRequirements;
    getForensicAnalysis(incidentId: string, investigationScope?: 'LIMITED' | 'COMPREHENSIVE' | 'DEEP_DIVE'): Promise<any>;
    private getAnalysisWindow;
    private buildForensicTimeline;
    private analyzeUserBehavior;
    private analyzeSessionPattern;
    private identifyUserRiskIndicators;
    private calculateBehaviorDeviation;
    private analyzeSystemState;
    private analyzeNetworkActivity;
    private analyzeNodeActivity;
    private analyzeGeographicDistribution;
    private calculateEventRelevance;
    private assessPotentialCause;
    private assessComplianceImpact;
    private calculateRegulatoryRisk;
    private identifyRequiredComplianceActions;
    private performRiskAssessment;
    private calculateOverallRisk;
    private identifyRiskFactors;
    private suggestMitigationStrategies;
    private assessBusinessImpact;
    private calculateOperationalImpact;
    private calculateFinancialImpact;
    private calculateReputationalImpact;
    private calculateCustomerImpact;
    private estimateIncidentCosts;
    private assessReputationalRisk;
    private generateForensicRecommendations;
    private verifyEvidenceIntegrity;
    getReportingMetrics(): Promise<any>;
}
//# sourceMappingURL=ReportingEngine.d.ts.map