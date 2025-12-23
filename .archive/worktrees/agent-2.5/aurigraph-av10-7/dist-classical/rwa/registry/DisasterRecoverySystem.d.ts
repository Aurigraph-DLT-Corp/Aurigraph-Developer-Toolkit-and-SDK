/**
 * AV10-21 Disaster Recovery and Automated Backup System
 * Enterprise-Grade Business Continuity and Data Protection
 *
 * Features:
 * - Multi-tier backup strategy (Local, Regional, Global)
 * - Real-time data replication and synchronization
 * - Automated failover and recovery procedures
 * - Point-in-time recovery capabilities
 * - Business continuity planning and orchestration
 * - Compliance-driven retention policies
 * - Performance-optimized backup operations
 * - Cross-region disaster recovery coordination
 */
import { EventEmitter } from 'events';
import { QuantumCryptoManagerV2 } from '../../crypto/QuantumCryptoManagerV2';
import { HyperRAFTPlusPlusV2 } from '../../consensus/HyperRAFTPlusPlusV2';
export interface BackupTarget {
    id: string;
    name: string;
    type: BackupTargetType;
    tier: BackupTier;
    location: BackupLocation;
    configuration: BackupConfiguration;
    capacity: StorageCapacity;
    performance: PerformanceMetrics;
    security: SecurityConfiguration;
    compliance: ComplianceSettings;
    status: TargetStatus;
    healthScore: number;
    lastHealthCheck: Date;
}
export declare enum BackupTargetType {
    LOCAL_STORAGE = "LOCAL_STORAGE",
    NETWORK_STORAGE = "NETWORK_STORAGE",
    CLOUD_STORAGE = "CLOUD_STORAGE",
    TAPE_STORAGE = "TAPE_STORAGE",
    DISTRIBUTED_STORAGE = "DISTRIBUTED_STORAGE"
}
export declare enum BackupTier {
    PRIMARY = "PRIMARY",// Hot data, immediate access
    SECONDARY = "SECONDARY",// Warm data, fast access
    TERTIARY = "TERTIARY",// Cold data, slower access
    ARCHIVE = "ARCHIVE"
}
export interface BackupLocation {
    region: string;
    zone: string;
    datacenter?: string;
    coordinates?: GeographicCoordinates;
    regulations: string[];
    networkLatency: number;
}
export interface GeographicCoordinates {
    latitude: number;
    longitude: number;
}
export interface BackupConfiguration {
    endpoint: string;
    authentication: AuthenticationConfig;
    encryption: EncryptionConfig;
    compression: CompressionConfig;
    retention: RetentionPolicy;
    replication: ReplicationConfig;
    scheduling: ScheduleConfig;
}
export interface AuthenticationConfig {
    type: 'API_KEY' | 'OAUTH2' | 'CERTIFICATE' | 'IAM_ROLE';
    credentials: Record<string, string>;
    mfa?: boolean;
}
export interface EncryptionConfig {
    enabled: boolean;
    algorithm: string;
    keyRotation: boolean;
    rotationInterval: number;
    keyManagement: 'LOCAL' | 'HSM' | 'CLOUD_KMS';
}
export interface CompressionConfig {
    enabled: boolean;
    algorithm: 'gzip' | 'lz4' | 'zstd' | 'brotli';
    level: number;
    ratio: number;
}
export interface RetentionPolicy {
    daily: number;
    weekly: number;
    monthly: number;
    yearly: number;
    legal: boolean;
    compliance: string[];
}
export interface ReplicationConfig {
    enabled: boolean;
    targets: string[];
    consistency: 'EVENTUAL' | 'STRONG' | 'BOUNDED_STALENESS';
    syncInterval: number;
    conflictResolution: 'LAST_WRITE_WINS' | 'MANUAL' | 'CUSTOM';
}
export interface ScheduleConfig {
    full: CronSchedule;
    incremental: CronSchedule;
    differential: CronSchedule;
    continuous?: boolean;
    bandwidth: BandwidthConfig;
}
export interface CronSchedule {
    expression: string;
    timezone: string;
    enabled: boolean;
}
export interface BandwidthConfig {
    limit: number;
    throttling: boolean;
    priority: 'LOW' | 'MEDIUM' | 'HIGH';
    timeWindows: TimeWindow[];
}
export interface TimeWindow {
    start: string;
    end: string;
    bandwidth: number;
}
export interface StorageCapacity {
    total: number;
    used: number;
    available: number;
    reserved: number;
    growth: GrowthMetrics;
}
export interface GrowthMetrics {
    daily: number;
    weekly: number;
    monthly: number;
    projected: number;
}
export interface PerformanceMetrics {
    throughput: ThroughputMetrics;
    latency: LatencyMetrics;
    reliability: ReliabilityMetrics;
}
export interface ThroughputMetrics {
    read: number;
    write: number;
    peak: number;
    sustained: number;
}
export interface LatencyMetrics {
    read: number;
    write: number;
    network: number;
}
export interface ReliabilityMetrics {
    uptime: number;
    availability: number;
    mtbf: number;
    mttr: number;
    errorRate: number;
}
export interface SecurityConfiguration {
    encryption: EncryptionConfig;
    access: AccessControlConfig;
    audit: AuditConfig;
    network: NetworkSecurityConfig;
}
export interface AccessControlConfig {
    authentication: boolean;
    authorization: boolean;
    rbac: boolean;
    mfa: boolean;
    ipWhitelist: string[];
}
export interface AuditConfig {
    enabled: boolean;
    level: 'BASIC' | 'DETAILED' | 'COMPREHENSIVE';
    retention: number;
    encryption: boolean;
}
export interface NetworkSecurityConfig {
    tls: boolean;
    vpn: boolean;
    firewall: boolean;
    ids: boolean;
}
export interface ComplianceSettings {
    gdpr: boolean;
    hipaa: boolean;
    sox: boolean;
    pci: boolean;
    iso27001: boolean;
    customRequirements: string[];
}
export declare enum TargetStatus {
    ACTIVE = "ACTIVE",
    INACTIVE = "INACTIVE",
    MAINTENANCE = "MAINTENANCE",
    ERROR = "ERROR",
    FULL = "FULL"
}
export interface BackupJob {
    id: string;
    name: string;
    type: BackupType;
    source: BackupSource;
    targets: string[];
    schedule: BackupSchedule;
    retention: RetentionPolicy;
    status: BackupJobStatus;
    priority: JobPriority;
    configuration: JobConfiguration;
    statistics: BackupStatistics;
    created: Date;
    updated: Date;
    nextRun?: Date;
    lastRun?: Date;
}
export declare enum BackupType {
    FULL = "FULL",
    INCREMENTAL = "INCREMENTAL",
    DIFFERENTIAL = "DIFFERENTIAL",
    CONTINUOUS = "CONTINUOUS",
    SNAPSHOT = "SNAPSHOT"
}
export interface BackupSource {
    type: 'DATABASE' | 'FILESYSTEM' | 'APPLICATION' | 'VIRTUAL_MACHINE' | 'CONTAINER';
    identifier: string;
    includePaths?: string[];
    excludePaths?: string[];
    filters?: DataFilter[];
}
export interface DataFilter {
    type: 'EXTENSION' | 'SIZE' | 'DATE' | 'PATTERN';
    criteria: any;
    action: 'INCLUDE' | 'EXCLUDE';
}
export interface BackupSchedule {
    frequency: ScheduleFrequency;
    time: string;
    timezone: string;
    daysOfWeek?: number[];
    daysOfMonth?: number[];
    enabled: boolean;
}
export declare enum ScheduleFrequency {
    CONTINUOUS = "CONTINUOUS",
    HOURLY = "HOURLY",
    DAILY = "DAILY",
    WEEKLY = "WEEKLY",
    MONTHLY = "MONTHLY"
}
export declare enum BackupJobStatus {
    SCHEDULED = "SCHEDULED",
    RUNNING = "RUNNING",
    COMPLETED = "COMPLETED",
    FAILED = "FAILED",
    CANCELLED = "CANCELLED",
    PAUSED = "PAUSED"
}
export declare enum JobPriority {
    LOW = "LOW",
    MEDIUM = "MEDIUM",
    HIGH = "HIGH",
    CRITICAL = "CRITICAL"
}
export interface JobConfiguration {
    parallelism: number;
    timeout: number;
    retries: number;
    notifications: NotificationConfig[];
    verification: VerificationConfig;
}
export interface NotificationConfig {
    type: 'EMAIL' | 'SLACK' | 'SMS' | 'WEBHOOK';
    recipients: string[];
    events: BackupEvent[];
    configuration: Record<string, any>;
}
export declare enum BackupEvent {
    STARTED = "STARTED",
    COMPLETED = "COMPLETED",
    FAILED = "FAILED",
    WARNING = "WARNING",
    CRITICAL = "CRITICAL"
}
export interface VerificationConfig {
    enabled: boolean;
    type: 'CHECKSUM' | 'RESTORE_TEST' | 'INTEGRITY_CHECK';
    schedule: string;
    sampleSize: number;
}
export interface BackupStatistics {
    totalRuns: number;
    successfulRuns: number;
    failedRuns: number;
    averageDuration: number;
    averageSize: number;
    compressionRatio: number;
    transferRate: number;
    lastRunDetails?: RunDetails;
}
export interface RunDetails {
    id: string;
    startTime: Date;
    endTime: Date;
    duration: number;
    status: BackupJobStatus;
    filesProcessed: number;
    bytesProcessed: number;
    bytesTransferred: number;
    compressionRatio: number;
    transferRate: number;
    errors: BackupError[];
    warnings: string[];
}
export interface BackupError {
    code: string;
    message: string;
    file?: string;
    timestamp: Date;
    severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
}
export interface RestoreJob {
    id: string;
    name: string;
    backupId: string;
    restorePoint: Date;
    target: RestoreTarget;
    options: RestoreOptions;
    status: RestoreStatus;
    progress: RestoreProgress;
    created: Date;
    started?: Date;
    completed?: Date;
}
export interface RestoreTarget {
    type: 'ORIGINAL' | 'ALTERNATE' | 'TEMPORARY';
    location: string;
    overwrite: boolean;
    permissions: boolean;
}
export interface RestoreOptions {
    fileFilters?: string[];
    timeRange?: TimeRange;
    verification: boolean;
    notifications: NotificationConfig[];
}
export interface TimeRange {
    start: Date;
    end: Date;
}
export declare enum RestoreStatus {
    PENDING = "PENDING",
    RUNNING = "RUNNING",
    COMPLETED = "COMPLETED",
    FAILED = "FAILED",
    CANCELLED = "CANCELLED"
}
export interface RestoreProgress {
    percentage: number;
    filesRestored: number;
    totalFiles: number;
    bytesRestored: number;
    totalBytes: number;
    currentFile?: string;
    estimatedCompletion?: Date;
}
export interface DisasterRecoveryPlan {
    id: string;
    name: string;
    description: string;
    type: RecoveryType;
    scope: RecoveryScope;
    objectives: RecoveryObjectives;
    procedures: RecoveryProcedure[];
    dependencies: string[];
    contacts: EmergencyContact[];
    testing: TestingSchedule;
    status: PlanStatus;
    version: string;
    created: Date;
    updated: Date;
    approver: string;
}
export declare enum RecoveryType {
    FULL_SITE = "FULL_SITE",
    PARTIAL_SITE = "PARTIAL_SITE",
    APPLICATION = "APPLICATION",
    DATA_ONLY = "DATA_ONLY"
}
export interface RecoveryScope {
    systems: string[];
    applications: string[];
    data: string[];
    users: string[];
    locations: string[];
}
export interface RecoveryObjectives {
    rto: number;
    rpo: number;
    availability: number;
    dataLoss: number;
}
export interface RecoveryProcedure {
    id: string;
    name: string;
    description: string;
    order: number;
    type: 'MANUAL' | 'AUTOMATED' | 'SEMI_AUTOMATED';
    estimatedTime: number;
    dependencies: string[];
    steps: RecoveryStep[];
    rollback: RollbackProcedure;
}
export interface RecoveryStep {
    id: string;
    description: string;
    command?: string;
    verification: string;
    timeout: number;
    retries: number;
    onFailure: 'CONTINUE' | 'ABORT' | 'MANUAL';
}
export interface RollbackProcedure {
    enabled: boolean;
    steps: RecoveryStep[];
    triggers: string[];
}
export interface EmergencyContact {
    name: string;
    role: string;
    phone: string;
    email: string;
    alternateContact?: string;
    escalationLevel: number;
}
export interface TestingSchedule {
    frequency: 'MONTHLY' | 'QUARTERLY' | 'SEMI_ANNUAL' | 'ANNUAL';
    nextTest: Date;
    lastTest?: Date;
    results?: TestResult[];
}
export interface TestResult {
    date: Date;
    type: 'TABLETOP' | 'WALKTHROUGH' | 'SIMULATION' | 'FULL_TEST';
    success: boolean;
    duration: number;
    issues: TestIssue[];
    improvements: string[];
    approver: string;
}
export interface TestIssue {
    severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    description: string;
    resolution: string;
    status: 'OPEN' | 'IN_PROGRESS' | 'RESOLVED';
    assignee: string;
}
export declare enum PlanStatus {
    DRAFT = "DRAFT",
    APPROVED = "APPROVED",
    ACTIVE = "ACTIVE",
    DEPRECATED = "DEPRECATED"
}
export interface SystemMetrics {
    timestamp: Date;
    backupTargets: TargetMetrics[];
    jobs: JobMetrics;
    storage: StorageMetrics;
    performance: PerformanceOverview;
    reliability: ReliabilityOverview;
    compliance: ComplianceMetrics;
}
export interface TargetMetrics {
    targetId: string;
    status: TargetStatus;
    capacity: StorageCapacity;
    performance: PerformanceMetrics;
    errors: number;
    lastBackup: Date;
}
export interface JobMetrics {
    active: number;
    scheduled: number;
    completed: number;
    failed: number;
    averageDuration: number;
    successRate: number;
    dataProcessed: number;
}
export interface StorageMetrics {
    total: number;
    used: number;
    growth: number;
    dedupRatio: number;
    compressionRatio: number;
    costPerGB: number;
}
export interface PerformanceOverview {
    throughput: number;
    latency: number;
    iops: number;
    utilization: number;
}
export interface ReliabilityOverview {
    uptime: number;
    availability: number;
    mtbf: number;
    mttr: number;
    sla: number;
}
export interface ComplianceMetrics {
    retentionCompliance: number;
    encryptionCompliance: number;
    accessCompliance: number;
    auditCompliance: number;
    overallScore: number;
}
export declare class DisasterRecoverySystem extends EventEmitter {
    private backupTargets;
    private backupJobs;
    private restoreJobs;
    private recoveryPlans;
    private activeRuns;
    private cryptoManager;
    private consensus;
    private isRunning;
    private startTime;
    private metrics;
    private schedulerInterval;
    private monitoringInterval;
    private maintenanceInterval;
    constructor(cryptoManager: QuantumCryptoManagerV2, consensus: HyperRAFTPlusPlusV2);
    private initializeDefaultTargets;
    private initializeDefaultJobs;
    private initializeDefaultRecoveryPlans;
    start(): void;
    stop(): void;
    private runScheduler;
    private shouldRunJob;
    private calculateNextRun;
    private executeBackupJob;
    private performBackup;
    private estimateBackupSize;
    private estimateBackupDuration;
    private sendJobNotifications;
    private sendNotification;
    private collectMetrics;
    private calculateAverageJobDuration;
    private calculateJobSuccessRate;
    private calculateTotalDataProcessed;
    private calculateStorageGrowthRate;
    private calculateAverageThroughput;
    private calculateAverageLatency;
    private runMaintenance;
    private checkTargetHealth;
    private updateAverage;
    private generateRunId;
    addBackupTarget(target: BackupTarget): void;
    removeBackupTarget(targetId: string): boolean;
    addBackupJob(job: BackupJob): void;
    removeBackupJob(jobId: string): boolean;
    addRecoveryPlan(plan: DisasterRecoveryPlan): void;
    removeRecoveryPlan(planId: string): boolean;
    initiateRestore(restoreRequest: {
        backupId: string;
        restorePoint: Date;
        target: RestoreTarget;
        options: RestoreOptions;
    }): Promise<string>;
    private executeRestoreJob;
    executeRecoveryPlan(planId: string): Promise<string>;
    private executeProcedure;
    private executeRecoveryStep;
    private executeRollback;
    private generateRestoreId;
    private generateExecutionId;
    getBackupTargets(): Map<string, BackupTarget>;
    getBackupJobs(): Map<string, BackupJob>;
    getRestoreJobs(): Map<string, RestoreJob>;
    getRecoveryPlans(): Map<string, DisasterRecoveryPlan>;
    getSystemMetrics(limit?: number): SystemMetrics[];
    getActiveRuns(): Map<string, RunDetails>;
    shutdown(): Promise<void>;
}
//# sourceMappingURL=DisasterRecoverySystem.d.ts.map