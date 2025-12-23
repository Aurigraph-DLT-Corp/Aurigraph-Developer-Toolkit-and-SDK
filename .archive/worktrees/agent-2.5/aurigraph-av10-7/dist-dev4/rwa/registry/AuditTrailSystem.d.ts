/**
 * AV10-21 Comprehensive Audit Trail and Logging System
 * Enterprise-Grade Compliance and Security Auditing
 *
 * Features:
 * - Immutable audit trail with blockchain integration
 * - Multi-level logging (System, Application, Security, Compliance)
 * - Real-time monitoring and alerting
 * - Comprehensive forensic analysis capabilities
 * - Regulatory compliance reporting (SOX, GDPR, HIPAA)
 * - Advanced search and query capabilities
 * - Automated log rotation and archiving
 * - Tamper-proof log integrity verification
 */
import { EventEmitter } from 'events';
import { QuantumCryptoManagerV2 } from '../../crypto/QuantumCryptoManagerV2';
import { HyperRAFTPlusPlusV2 } from '../../consensus/HyperRAFTPlusPlusV2';
export interface AuditEntry {
    id: string;
    timestamp: Date;
    level: LogLevel;
    category: AuditCategory;
    action: string;
    actor: ActorInfo;
    resource: ResourceInfo;
    outcome: AuditOutcome;
    details: AuditDetails;
    context: ContextInfo;
    integrity: IntegrityInfo;
    compliance: ComplianceInfo;
    metadata: Record<string, any>;
}
export declare enum LogLevel {
    TRACE = "TRACE",
    DEBUG = "DEBUG",
    INFO = "INFO",
    WARN = "WARN",
    ERROR = "ERROR",
    FATAL = "FATAL"
}
export declare enum AuditCategory {
    SYSTEM = "SYSTEM",
    APPLICATION = "APPLICATION",
    SECURITY = "SECURITY",
    COMPLIANCE = "COMPLIANCE",
    DATA_ACCESS = "DATA_ACCESS",
    AUTHENTICATION = "AUTHENTICATION",
    AUTHORIZATION = "AUTHORIZATION",
    CONFIGURATION = "CONFIGURATION",
    TRANSACTION = "TRANSACTION",
    NETWORK = "NETWORK",
    BACKUP = "BACKUP",
    RECOVERY = "RECOVERY"
}
export interface ActorInfo {
    type: ActorType;
    id: string;
    name?: string;
    role?: string;
    permissions?: string[];
    sessionId?: string;
    ipAddress?: string;
    userAgent?: string;
    location?: GeolocationInfo;
    authentication?: AuthenticationInfo;
}
export declare enum ActorType {
    USER = "USER",
    SERVICE = "SERVICE",
    SYSTEM = "SYSTEM",
    API = "API",
    BATCH_JOB = "BATCH_JOB",
    EXTERNAL_SYSTEM = "EXTERNAL_SYSTEM"
}
export interface ResourceInfo {
    type: ResourceType;
    id: string;
    name?: string;
    path?: string;
    attributes?: Record<string, any>;
    sensitivity?: DataSensitivity;
    owner?: string;
    classification?: string;
}
export declare enum ResourceType {
    ASSET = "ASSET",
    DOCUMENT = "DOCUMENT",
    USER_ACCOUNT = "USER_ACCOUNT",
    SYSTEM_CONFIGURATION = "SYSTEM_CONFIGURATION",
    DATABASE_RECORD = "DATABASE_RECORD",
    API_ENDPOINT = "API_ENDPOINT",
    FILE = "FILE",
    BACKUP = "BACKUP",
    CERTIFICATE = "CERTIFICATE",
    ENCRYPTION_KEY = "ENCRYPTION_KEY"
}
export declare enum DataSensitivity {
    PUBLIC = "PUBLIC",
    INTERNAL = "INTERNAL",
    CONFIDENTIAL = "CONFIDENTIAL",
    RESTRICTED = "RESTRICTED",
    TOP_SECRET = "TOP_SECRET"
}
export interface AuditOutcome {
    result: OutcomeResult;
    statusCode?: number;
    message?: string;
    duration?: number;
    affectedRows?: number;
    bytesProcessed?: number;
    errors?: AuditError[];
    warnings?: string[];
}
export declare enum OutcomeResult {
    SUCCESS = "SUCCESS",
    FAILURE = "FAILURE",
    PARTIAL = "PARTIAL",
    CANCELLED = "CANCELLED",
    TIMEOUT = "TIMEOUT"
}
export interface AuditError {
    code: string;
    message: string;
    severity: ErrorSeverity;
    stackTrace?: string;
    remediation?: string;
}
export declare enum ErrorSeverity {
    LOW = "LOW",
    MEDIUM = "MEDIUM",
    HIGH = "HIGH",
    CRITICAL = "CRITICAL"
}
export interface AuditDetails {
    operation: string;
    operationType: OperationType;
    parameters?: Record<string, any>;
    requestId?: string;
    traceId?: string;
    parentId?: string;
    correlationId?: string;
    changeSet?: ChangeInfo[];
    approvals?: ApprovalInfo[];
    risks?: RiskAssessment[];
}
export declare enum OperationType {
    CREATE = "CREATE",
    READ = "READ",
    UPDATE = "UPDATE",
    DELETE = "DELETE",
    EXECUTE = "EXECUTE",
    APPROVE = "APPROVE",
    REJECT = "REJECT",
    ESCALATE = "ESCALATE",
    EXPORT = "EXPORT",
    IMPORT = "IMPORT"
}
export interface ChangeInfo {
    field: string;
    oldValue?: any;
    newValue?: any;
    changeType: 'ADDED' | 'MODIFIED' | 'REMOVED';
    validator?: string;
    approved?: boolean;
}
export interface ApprovalInfo {
    approver: string;
    approved: boolean;
    timestamp: Date;
    reason?: string;
    level: number;
}
export interface RiskAssessment {
    category: RiskCategory;
    level: RiskLevel;
    score: number;
    factors: string[];
    mitigation: string[];
}
export declare enum RiskCategory {
    FINANCIAL = "FINANCIAL",
    OPERATIONAL = "OPERATIONAL",
    COMPLIANCE = "COMPLIANCE",
    SECURITY = "SECURITY",
    REPUTATION = "REPUTATION"
}
export declare enum RiskLevel {
    VERY_LOW = "VERY_LOW",
    LOW = "LOW",
    MEDIUM = "MEDIUM",
    HIGH = "HIGH",
    VERY_HIGH = "VERY_HIGH"
}
export interface ContextInfo {
    environment: string;
    version: string;
    buildId?: string;
    deploymentId?: string;
    instanceId?: string;
    nodeId?: string;
    processId?: number;
    threadId?: string;
    requestHeaders?: Record<string, string>;
    businessContext?: BusinessContext;
}
export interface BusinessContext {
    tenant?: string;
    department?: string;
    project?: string;
    costCenter?: string;
    businessUnit?: string;
    workflowId?: string;
    campaignId?: string;
}
export interface IntegrityInfo {
    hash: string;
    algorithm: string;
    signature?: string;
    signatureAlgorithm?: string;
    chainHash?: string;
    merkleRoot?: string;
    blockHeight?: number;
    nonce?: string;
}
export interface ComplianceInfo {
    regulations: ComplianceRegulation[];
    retentionPeriod: number;
    dataClassification: string;
    privacyLevel: PrivacyLevel;
    consentRequired: boolean;
    consentId?: string;
    legalBasis?: string;
    jurisdiction?: string;
    auditRequired: boolean;
}
export declare enum ComplianceRegulation {
    GDPR = "GDPR",
    CCPA = "CCPA",
    HIPAA = "HIPAA",
    SOX = "SOX",
    PCI_DSS = "PCI_DSS",
    ISO_27001 = "ISO_27001",
    NIST = "NIST",
    FERPA = "FERPA",
    GLBA = "GLBA",
    FISMA = "FISMA"
}
export declare enum PrivacyLevel {
    PUBLIC = "PUBLIC",
    INTERNAL = "INTERNAL",
    CONFIDENTIAL = "CONFIDENTIAL",
    RESTRICTED = "RESTRICTED",
    SECRET = "SECRET"
}
export interface GeolocationInfo {
    country: string;
    region: string;
    city: string;
    coordinates?: {
        latitude: number;
        longitude: number;
    };
    timezone: string;
}
export interface AuthenticationInfo {
    method: AuthMethod;
    provider: string;
    factors: string[];
    strength: AuthStrength;
    certificateId?: string;
    tokenId?: string;
}
export declare enum AuthMethod {
    PASSWORD = "PASSWORD",
    CERTIFICATE = "CERTIFICATE",
    TOKEN = "TOKEN",
    BIOMETRIC = "BIOMETRIC",
    MFA = "MFA",
    SSO = "SSO",
    API_KEY = "API_KEY"
}
export declare enum AuthStrength {
    WEAK = "WEAK",
    MEDIUM = "MEDIUM",
    STRONG = "STRONG",
    VERY_STRONG = "VERY_STRONG"
}
export interface AuditQuery {
    filters: AuditFilter[];
    timeRange?: TimeRange;
    sortBy?: SortCriteria[];
    groupBy?: string[];
    aggregations?: Aggregation[];
    limit?: number;
    offset?: number;
    includeDeleted?: boolean;
    includeSystem?: boolean;
}
export interface AuditFilter {
    field: string;
    operator: FilterOperator;
    value: any;
    caseSensitive?: boolean;
}
export declare enum FilterOperator {
    EQUALS = "EQUALS",
    NOT_EQUALS = "NOT_EQUALS",
    CONTAINS = "CONTAINS",
    NOT_CONTAINS = "NOT_CONTAINS",
    STARTS_WITH = "STARTS_WITH",
    ENDS_WITH = "ENDS_WITH",
    GREATER_THAN = "GREATER_THAN",
    LESS_THAN = "LESS_THAN",
    GREATER_EQUAL = "GREATER_EQUAL",
    LESS_EQUAL = "LESS_EQUAL",
    IN = "IN",
    NOT_IN = "NOT_IN",
    REGEX = "REGEX",
    IS_NULL = "IS_NULL",
    IS_NOT_NULL = "IS_NOT_NULL"
}
export interface TimeRange {
    start: Date;
    end: Date;
    timezone?: string;
}
export interface SortCriteria {
    field: string;
    direction: 'ASC' | 'DESC';
    nullsFirst?: boolean;
}
export interface Aggregation {
    type: AggregationType;
    field: string;
    alias?: string;
}
export declare enum AggregationType {
    COUNT = "COUNT",
    SUM = "SUM",
    AVG = "AVG",
    MIN = "MIN",
    MAX = "MAX",
    DISTINCT = "DISTINCT"
}
export interface AuditSearchResult {
    entries: AuditEntry[];
    totalCount: number;
    aggregations?: Record<string, number>;
    facets?: Facet[];
    executionTime: number;
    fromCache: boolean;
}
export interface Facet {
    field: string;
    values: FacetValue[];
}
export interface FacetValue {
    value: any;
    count: number;
    percentage: number;
}
export interface ComplianceReport {
    id: string;
    name: string;
    regulation: ComplianceRegulation;
    period: ReportPeriod;
    generatedAt: Date;
    generatedBy: string;
    status: ReportStatus;
    summary: ComplianceSummary;
    sections: ReportSection[];
    attachments: ReportAttachment[];
    metadata: Record<string, any>;
}
export interface ReportPeriod {
    start: Date;
    end: Date;
    type: 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'QUARTERLY' | 'YEARLY' | 'CUSTOM';
}
export declare enum ReportStatus {
    GENERATING = "GENERATING",
    COMPLETED = "COMPLETED",
    FAILED = "FAILED",
    EXPIRED = "EXPIRED"
}
export interface ComplianceSummary {
    totalEvents: number;
    complianceScore: number;
    violations: number;
    criticalIssues: number;
    recommendations: string[];
    riskLevel: RiskLevel;
}
export interface ReportSection {
    title: string;
    description: string;
    findings: Finding[];
    charts: Chart[];
    tables: Table[];
}
export interface Finding {
    severity: FindingSeverity;
    title: string;
    description: string;
    evidence: string[];
    recommendation: string;
    status: FindingStatus;
}
export declare enum FindingSeverity {
    INFO = "INFO",
    LOW = "LOW",
    MEDIUM = "MEDIUM",
    HIGH = "HIGH",
    CRITICAL = "CRITICAL"
}
export declare enum FindingStatus {
    OPEN = "OPEN",
    IN_PROGRESS = "IN_PROGRESS",
    RESOLVED = "RESOLVED",
    ACCEPTED = "ACCEPTED"
}
export interface Chart {
    type: ChartType;
    title: string;
    data: ChartData[];
    config: Record<string, any>;
}
export declare enum ChartType {
    LINE = "LINE",
    BAR = "BAR",
    PIE = "PIE",
    AREA = "AREA",
    SCATTER = "SCATTER",
    HEATMAP = "HEATMAP"
}
export interface ChartData {
    label: string;
    value: number;
    timestamp?: Date;
    metadata?: Record<string, any>;
}
export interface Table {
    title: string;
    headers: string[];
    rows: TableRow[];
    footer?: TableFooter;
}
export interface TableRow {
    cells: TableCell[];
    highlighted?: boolean;
    metadata?: Record<string, any>;
}
export interface TableCell {
    value: any;
    formatted?: string;
    type: 'TEXT' | 'NUMBER' | 'DATE' | 'LINK' | 'STATUS';
    alignment?: 'LEFT' | 'CENTER' | 'RIGHT';
}
export interface TableFooter {
    cells: TableCell[];
    summary?: string;
}
export interface ReportAttachment {
    id: string;
    name: string;
    type: AttachmentType;
    size: number;
    path: string;
    hash: string;
    encrypted: boolean;
}
export declare enum AttachmentType {
    PDF = "PDF",
    CSV = "CSV",
    EXCEL = "EXCEL",
    JSON = "JSON",
    XML = "XML",
    LOG = "LOG"
}
export interface LogRotationPolicy {
    enabled: boolean;
    maxSize: number;
    maxAge: number;
    maxFiles: number;
    compression: boolean;
    archiveLocation: string;
    deleteAfterArchive: boolean;
}
export interface SystemMetrics {
    timestamp: Date;
    totalEntries: number;
    entriesPerSecond: number;
    storageUsed: number;
    indexSize: number;
    queryPerformance: QueryPerformanceMetrics;
    complianceMetrics: ComplianceMetrics;
    integrityMetrics: IntegrityMetrics;
}
export interface QueryPerformanceMetrics {
    averageQueryTime: number;
    slowQueries: number;
    cacheHitRate: number;
    indexUtilization: number;
}
export interface ComplianceMetrics {
    totalRegulations: number;
    complianceScore: number;
    violations: number;
    retentionCompliance: number;
    privacyCompliance: number;
}
export interface IntegrityMetrics {
    totalHashes: number;
    verificationsPassed: number;
    verificationsFailed: number;
    chainIntegrity: number;
    tamperAttempts: number;
}
export declare class AuditTrailSystem extends EventEmitter {
    private entries;
    private chainHashes;
    private reports;
    private searchIndex;
    private metrics;
    private cryptoManager;
    private consensus;
    private config;
    private startTime;
    private lastChainHash;
    private entryCount;
    private indexingInterval;
    private integrityInterval;
    private metricsInterval;
    private rotationInterval;
    constructor(cryptoManager: QuantumCryptoManagerV2, consensus: HyperRAFTPlusPlusV2, config?: Partial<typeof AuditTrailSystem.prototype.config>);
    private initializeSystem;
    private startBackgroundProcesses;
    logEvent(category: AuditCategory, action: string, actor: ActorInfo, resource: ResourceInfo, outcome: AuditOutcome, details?: Partial<AuditDetails>, options?: {
        level?: LogLevel;
        correlationId?: string;
        requestId?: string;
        context?: Partial<ContextInfo>;
        compliance?: Partial<ComplianceInfo>;
    }): Promise<string>;
    private determineRegulations;
    private calculateRetentionPeriod;
    private classifyData;
    private determinePrivacyLevel;
    private requiresConsent;
    private sanitizeActor;
    private sanitizeResource;
    private sanitizeDetails;
    private mapActionToOperationType;
    private calculateEntryHash;
    private calculateChainHash;
    private submitToBlockchain;
    private checkForAlerts;
    private detectSuspiciousPatterns;
    private getRecentEntries;
    search(query: AuditQuery): Promise<AuditSearchResult>;
    private applyFilter;
    private getFieldValue;
    private evaluateFilter;
    private applySorting;
    private calculateAggregation;
    private generateFacets;
    generateComplianceReport(regulation: ComplianceRegulation, period: ReportPeriod, options?: {
        includeAttachments?: boolean;
        format?: 'JSON' | 'PDF' | 'EXCEL';
        template?: string;
    }): Promise<string>;
    private analyzeComplianceEntries;
    private generateReportSections;
    private generateTimeSeriesData;
    private generateComplianceIssuesTable;
    private generateAttachments;
    private generateCSVData;
    private indexEntry;
    private updateSearchIndex;
    private verifyChainIntegrity;
    private collectMetrics;
    private calculateEntriesPerSecond;
    private calculateStorageUsage;
    private calculateAverageQueryTime;
    private calculateIndexUtilization;
    private calculateOverallComplianceScore;
    private countComplianceViolations;
    private calculateRetentionCompliance;
    private calculatePrivacyCompliance;
    private performRotation;
    private archiveEntries;
    private generateEntryId;
    private generateReportId;
    private generateAttachmentId;
    private generateTraceId;
    getEntry(entryId: string): Promise<AuditEntry | null>;
    getReport(reportId: string): Promise<ComplianceReport | null>;
    getSystemMetrics(limit?: number): Promise<SystemMetrics[]>;
    exportEntries(query: AuditQuery, format?: 'JSON' | 'CSV' | 'XML'): Promise<string>;
    private generateXMLData;
    shutdown(): Promise<void>;
}
//# sourceMappingURL=AuditTrailSystem.d.ts.map