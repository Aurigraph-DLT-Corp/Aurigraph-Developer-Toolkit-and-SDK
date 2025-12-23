/**
 * AV10-21 Infrastructure Monitoring and Health Checks
 * Enterprise-Grade System Monitoring and Alerting
 *
 * Features:
 * - Real-time system health monitoring
 * - Multi-tier alerting and notification system
 * - Performance metrics collection and analysis
 * - Predictive failure detection
 * - Automated remediation actions
 * - Comprehensive dashboard and reporting
 * - SLA monitoring and compliance tracking
 */
import { EventEmitter } from 'events';
import { QuantumCryptoManagerV2 } from '../../crypto/QuantumCryptoManagerV2';
import { HyperRAFTPlusPlusV2 } from '../../consensus/HyperRAFTPlusPlusV2';
export interface HealthCheck {
    id: string;
    name: string;
    category: HealthCheckCategory;
    type: HealthCheckType;
    target: string;
    interval: number;
    timeout: number;
    retries: number;
    threshold: HealthThreshold;
    dependencies: string[];
    configuration: Record<string, any>;
    enabled: boolean;
    lastRun?: Date;
    lastResult?: HealthCheckResult;
    history: HealthCheckResult[];
}
export declare enum HealthCheckCategory {
    SYSTEM = "SYSTEM",
    APPLICATION = "APPLICATION",
    DATABASE = "DATABASE",
    NETWORK = "NETWORK",
    EXTERNAL_SERVICE = "EXTERNAL_SERVICE",
    STORAGE = "STORAGE",
    SECURITY = "SECURITY",
    PERFORMANCE = "PERFORMANCE"
}
export declare enum HealthCheckType {
    HTTP = "HTTP",
    TCP = "TCP",
    DNS = "DNS",
    DATABASE_CONNECTION = "DATABASE_CONNECTION",
    DISK_SPACE = "DISK_SPACE",
    MEMORY_USAGE = "MEMORY_USAGE",
    CPU_USAGE = "CPU_USAGE",
    PROCESS_COUNT = "PROCESS_COUNT",
    LOG_ERRORS = "LOG_ERRORS",
    CUSTOM = "CUSTOM"
}
export interface HealthThreshold {
    critical: ThresholdValue;
    warning: ThresholdValue;
    ok: ThresholdValue;
}
export interface ThresholdValue {
    operator: 'GT' | 'LT' | 'EQ' | 'NEQ' | 'GTE' | 'LTE';
    value: number;
    unit?: string;
}
export interface HealthCheckResult {
    checkId: string;
    timestamp: Date;
    status: HealthStatus;
    responseTime: number;
    value?: number;
    message: string;
    details: Record<string, any>;
    remediation?: RemediationAction[];
}
export declare enum HealthStatus {
    OK = "OK",
    WARNING = "WARNING",
    CRITICAL = "CRITICAL",
    UNKNOWN = "UNKNOWN"
}
export interface RemediationAction {
    action: string;
    description: string;
    automated: boolean;
    priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    estimatedTime: number;
    requirements: string[];
}
export interface SystemMetrics {
    timestamp: Date;
    system: SystemResourceMetrics;
    application: ApplicationMetrics;
    network: NetworkMetrics;
    storage: StorageMetrics;
    performance: PerformanceMetrics;
    security: SecurityMetrics;
}
export interface SystemResourceMetrics {
    cpu: CPUMetrics;
    memory: MemoryMetrics;
    disk: DiskMetrics;
    network: NetworkResourceMetrics;
    processes: ProcessMetrics;
    uptime: number;
}
export interface CPUMetrics {
    usage: number;
    loadAverage: number[];
    cores: number;
    processes: number;
    temperature?: number;
}
export interface MemoryMetrics {
    total: number;
    free: number;
    used: number;
    usagePercent: number;
    swap: SwapMetrics;
}
export interface SwapMetrics {
    total: number;
    free: number;
    used: number;
    usagePercent: number;
}
export interface DiskMetrics {
    partitions: DiskPartition[];
    io: DiskIOMetrics;
}
export interface DiskPartition {
    device: string;
    mountpoint: string;
    total: number;
    free: number;
    used: number;
    usagePercent: number;
}
export interface DiskIOMetrics {
    readOps: number;
    writeOps: number;
    readBytes: number;
    writeBytes: number;
    iowait: number;
}
export interface NetworkResourceMetrics {
    interfaces: NetworkInterface[];
    connections: ConnectionMetrics;
}
export interface NetworkInterface {
    name: string;
    rx: NetworkTraffic;
    tx: NetworkTraffic;
    errors: number;
    drops: number;
}
export interface NetworkTraffic {
    bytes: number;
    packets: number;
    errors: number;
}
export interface ConnectionMetrics {
    established: number;
    timeWait: number;
    closeWait: number;
    listening: number;
}
export interface ProcessMetrics {
    total: number;
    running: number;
    sleeping: number;
    stopped: number;
    zombie: number;
}
export interface ApplicationMetrics {
    requests: RequestMetrics;
    errors: ErrorMetrics;
    latency: LatencyMetrics;
    throughput: ThroughputMetrics;
    availability: AvailabilityMetrics;
}
export interface RequestMetrics {
    total: number;
    successful: number;
    failed: number;
    rate: number;
    activeRequests: number;
}
export interface ErrorMetrics {
    total: number;
    rate: number;
    byType: Record<string, number>;
    recent: ErrorEntry[];
}
export interface ErrorEntry {
    timestamp: Date;
    type: string;
    message: string;
    stack?: string;
    context: Record<string, any>;
}
export interface LatencyMetrics {
    p50: number;
    p95: number;
    p99: number;
    average: number;
    min: number;
    max: number;
}
export interface ThroughputMetrics {
    rps: number;
    tps: number;
    peak: number;
    average: number;
}
export interface AvailabilityMetrics {
    uptime: number;
    sla: number;
    mtbf: number;
    mttr: number;
}
export interface NetworkMetrics {
    latency: LatencyMetrics;
    bandwidth: BandwidthMetrics;
    connectivity: ConnectivityMetrics;
}
export interface BandwidthMetrics {
    inbound: number;
    outbound: number;
    utilization: number;
    peak: number;
}
export interface ConnectivityMetrics {
    activeConnections: number;
    failedConnections: number;
    connectionPool: ConnectionPoolMetrics;
}
export interface ConnectionPoolMetrics {
    active: number;
    idle: number;
    waiting: number;
    maxPool: number;
}
export interface StorageMetrics {
    usage: StorageUsageMetrics;
    performance: StoragePerformanceMetrics;
    reliability: StorageReliabilityMetrics;
}
export interface StorageUsageMetrics {
    total: number;
    used: number;
    free: number;
    usagePercent: number;
    growth: StorageGrowthMetrics;
}
export interface StorageGrowthMetrics {
    daily: number;
    weekly: number;
    monthly: number;
    projected: number;
}
export interface StoragePerformanceMetrics {
    iops: number;
    latency: LatencyMetrics;
    throughput: number;
    queueDepth: number;
}
export interface StorageReliabilityMetrics {
    errorRate: number;
    availability: number;
    backupStatus: BackupStatusMetrics;
}
export interface BackupStatusMetrics {
    lastBackup: Date;
    successRate: number;
    averageTime: number;
    dataIntegrity: number;
}
export interface PerformanceMetrics {
    response: ResponseTimeMetrics;
    scalability: ScalabilityMetrics;
    efficiency: EfficiencyMetrics;
}
export interface ResponseTimeMetrics {
    api: LatencyMetrics;
    database: LatencyMetrics;
    external: LatencyMetrics;
}
export interface ScalabilityMetrics {
    maxConcurrentUsers: number;
    currentLoad: number;
    capacityUtilization: number;
    bottlenecks: string[];
}
export interface EfficiencyMetrics {
    resourceUtilization: number;
    energyEfficiency: number;
    costEfficiency: number;
    cacheHitRate: number;
}
export interface SecurityMetrics {
    threats: ThreatMetrics;
    compliance: ComplianceMetrics;
    access: AccessMetrics;
}
export interface ThreatMetrics {
    detected: number;
    blocked: number;
    severity: Record<string, number>;
    types: Record<string, number>;
}
export interface ComplianceMetrics {
    score: number;
    violations: number;
    lastAudit: Date;
    controls: ControlMetrics[];
}
export interface ControlMetrics {
    id: string;
    name: string;
    status: 'COMPLIANT' | 'NON_COMPLIANT' | 'PARTIAL';
    score: number;
    lastCheck: Date;
}
export interface AccessMetrics {
    logins: LoginMetrics;
    permissions: PermissionMetrics;
    sessions: SessionMetrics;
}
export interface LoginMetrics {
    successful: number;
    failed: number;
    unique: number;
    suspicious: number;
}
export interface PermissionMetrics {
    granted: number;
    denied: number;
    escalations: number;
    violations: number;
}
export interface SessionMetrics {
    active: number;
    expired: number;
    average: number;
    concurrent: number;
}
export interface Alert {
    id: string;
    title: string;
    description: string;
    severity: AlertSeverity;
    status: AlertStatus;
    source: AlertSource;
    category: string;
    tags: string[];
    triggered: Date;
    acknowledged?: Date;
    resolved?: Date;
    escalated?: Date;
    assignee?: string;
    metadata: Record<string, any>;
    actions: AlertAction[];
}
export declare enum AlertSeverity {
    INFO = "INFO",
    WARNING = "WARNING",
    ERROR = "ERROR",
    CRITICAL = "CRITICAL",
    EMERGENCY = "EMERGENCY"
}
export declare enum AlertStatus {
    ACTIVE = "ACTIVE",
    ACKNOWLEDGED = "ACKNOWLEDGED",
    RESOLVED = "RESOLVED",
    SUPPRESSED = "SUPPRESSED"
}
export interface AlertSource {
    type: 'HEALTH_CHECK' | 'METRIC_THRESHOLD' | 'LOG_PATTERN' | 'EXTERNAL' | 'MANUAL';
    id: string;
    name: string;
}
export interface AlertAction {
    id: string;
    type: 'NOTIFICATION' | 'REMEDIATION' | 'ESCALATION';
    status: 'PENDING' | 'EXECUTING' | 'COMPLETED' | 'FAILED';
    result?: string;
    timestamp: Date;
}
export interface NotificationChannel {
    id: string;
    name: string;
    type: 'EMAIL' | 'SMS' | 'SLACK' | 'WEBHOOK' | 'PAGER_DUTY';
    configuration: Record<string, any>;
    enabled: boolean;
    filters: NotificationFilter[];
}
export interface NotificationFilter {
    field: string;
    operator: 'EQUALS' | 'CONTAINS' | 'REGEX';
    value: any;
}
export interface SLATarget {
    id: string;
    name: string;
    metric: string;
    target: number;
    period: 'HOURLY' | 'DAILY' | 'WEEKLY' | 'MONTHLY';
    operator: 'GT' | 'LT' | 'GTE' | 'LTE';
    enabled: boolean;
    current: number;
    breach: boolean;
}
export declare class InfrastructureMonitoring extends EventEmitter {
    private healthChecks;
    private metrics;
    private alerts;
    private notificationChannels;
    private slaTargets;
    private cryptoManager;
    private consensus;
    private isRunning;
    private startTime;
    private performanceObserver;
    private healthCheckInterval;
    private metricsInterval;
    private alertingInterval;
    private slaInterval;
    constructor(cryptoManager: QuantumCryptoManagerV2, consensus: HyperRAFTPlusPlusV2);
    private initializePerformanceObserver;
    private initializeDefaultHealthChecks;
    private initializeDefaultNotificationChannels;
    private initializeDefaultSLATargets;
    start(): void;
    stop(): void;
    private runHealthChecks;
    private executeHealthCheck;
    private checkCPUUsage;
    private checkMemoryUsage;
    private checkDiskSpace;
    private checkHTTPEndpoint;
    private checkTCPConnection;
    private checkDatabaseConnection;
    private evaluateThreshold;
    private compareThresholdValue;
    private collectMetrics;
    private collectSystemMetrics;
    private collectApplicationMetrics;
    private collectNetworkMetrics;
    private collectStorageMetrics;
    private collectPerformanceMetrics;
    private collectSecurityMetrics;
    private processPerformanceEntry;
    private triggerAlert;
    private mapHealthStatusToAlertSeverity;
    private sendNotifications;
    private evaluateNotificationFilters;
    private getAlertFieldValue;
    private sendNotification;
    private sendEmailNotification;
    private sendSlackNotification;
    private sendWebhookNotification;
    private sendPagerDutyNotification;
    private executeRemediationAction;
    private performRemediationAction;
    private processAlerts;
    private checkAutoResolution;
    private monitorSLAs;
    private calculateSLAMetric;
    private calculateAvailability;
    private calculateResponseTimeP95;
    private calculateErrorRate;
    private evaluateSLABreach;
    private handleSLABreach;
    private handleSLARecovery;
    addHealthCheck(healthCheck: HealthCheck): void;
    removeHealthCheck(checkId: string): boolean;
    addNotificationChannel(channel: NotificationChannel): void;
    removeNotificationChannel(channelId: string): boolean;
    addSLATarget(sla: SLATarget): void;
    removeSLATarget(slaId: string): boolean;
    acknowledgeAlert(alertId: string, userId: string): Promise<boolean>;
    resolveAlert(alertId: string, userId: string, resolution: string): Promise<boolean>;
    getHealthCheckStatus(): Map<string, HealthCheck>;
    getActiveAlerts(): Alert[];
    getSLAStatus(): Map<string, SLATarget>;
    private generateAlertId;
    private generateActionId;
    shutdown(): Promise<void>;
}
//# sourceMappingURL=InfrastructureMonitoring.d.ts.map