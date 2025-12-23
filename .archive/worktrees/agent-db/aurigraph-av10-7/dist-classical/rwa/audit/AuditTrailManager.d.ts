import { EventEmitter } from 'events';
export interface AuditEvent {
    id: string;
    timestamp: number;
    eventType: string;
    category: 'TOKENIZATION' | 'COMPLIANCE' | 'TRANSACTION' | 'ACCESS' | 'SYSTEM' | 'REGULATORY';
    severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    userId?: string;
    entityId: string;
    entityType: string;
    action: string;
    details: any;
    metadata: {
        nodeId: string;
        sessionId?: string;
        ipAddress?: string;
        userAgent?: string;
        jurisdiction?: string;
        regulatoryFramework?: string;
    };
    hash: string;
    previousHash?: string;
    digitalSignature: string;
    complianceFlags: string[];
    retentionUntil: number;
}
export interface AuditQuery {
    startTime?: number;
    endTime?: number;
    category?: string;
    severity?: string;
    userId?: string;
    entityType?: string;
    action?: string;
    limit?: number;
    offset?: number;
    includeSignatureVerification?: boolean;
}
export interface AuditReport {
    id: string;
    title: string;
    type: 'COMPLIANCE' | 'SECURITY' | 'OPERATIONAL' | 'REGULATORY' | 'FORENSIC';
    period: {
        start: number;
        end: number;
    };
    summary: {
        totalEvents: number;
        criticalEvents: number;
        complianceViolations: number;
        securityIncidents: number;
        jurisdictions: string[];
    };
    sections: AuditReportSection[];
    metadata: {
        generatedAt: number;
        generatedBy: string;
        jurisdiction: string;
        compliance: string[];
        hash: string;
        signature: string;
    };
}
export interface AuditReportSection {
    title: string;
    type: 'SUMMARY' | 'TABLE' | 'CHART' | 'TIMELINE' | 'COMPLIANCE' | 'RECOMMENDATIONS';
    content: any;
    priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
}
export declare class AuditTrailManager extends EventEmitter {
    private auditChain;
    private eventStorage;
    private complianceRules;
    private retentionPolicies;
    private digitalSignatureKeys;
    constructor();
    private initializeComplianceRules;
    private initializeRetentionPolicies;
    private setupDigitalSignatures;
    logEvent(eventType: string, category: AuditEvent['category'], severity: AuditEvent['severity'], entityId: string, entityType: string, action: string, details: any, metadata?: Partial<AuditEvent['metadata']>, userId?: string): Promise<string>;
    private determineComplianceFlags;
    private checkComplianceViolations;
    private detectSuspiciousActivity;
    private createComplianceAlert;
    private createSecurityAlert;
    private getComplianceSuggestedActions;
    queryAuditTrail(query: AuditQuery): Promise<AuditEvent[]>;
    private verifyEventSignature;
    generateReport(type: AuditReport['type'], startTime: number, endTime: number, jurisdiction?: string, additionalFilters?: Partial<AuditQuery>): Promise<AuditReport>;
    private calculateReportSummary;
    private generateReportSections;
    private generateExecutiveSummary;
    private generateEventTimeline;
    private generateComplianceAnalysis;
    private generateSecurityIncidentTable;
    private generateRegulatoryViolationTable;
    private generateRecommendations;
    private getApplicableComplianceFrameworks;
    private getReportTitle;
    exportReport(report: AuditReport, format: 'JSON' | 'PDF' | 'CSV' | 'XML'): Promise<Buffer>;
    private exportReportAsCSV;
    private exportReportAsXML;
    archiveOldEvents(): Promise<number>;
    private startRetentionCleanup;
    getAuditChainIntegrity(): Promise<{
        isValid: boolean;
        brokenLinks: string[];
        totalEvents: number;
        firstEvent: string;
        lastEvent: string;
    }>;
    submitRegulatoryReport(report: AuditReport, regulatoryAuthority: string, submissionMethod: 'API' | 'SFTP' | 'EMAIL' | 'PORTAL'): Promise<{
        submissionId: string;
        status: 'SUBMITTED' | 'PENDING' | 'FAILED';
        confirmationNumber?: string;
        error?: string;
    }>;
    getAuditMetrics(): {
        totalEvents: number;
        eventsLast24h: number;
        criticalEventsLast24h: number;
        complianceViolationsLast7d: number;
        chainIntegrityStatus: 'VALID' | 'COMPROMISED';
        storageUtilization: number;
    };
}
//# sourceMappingURL=AuditTrailManager.d.ts.map