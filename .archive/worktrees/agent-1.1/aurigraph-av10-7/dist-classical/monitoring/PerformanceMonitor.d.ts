/**
 * AV10-16 Performance Monitor - TypeScript Implementation
 * Monitors node performance metrics for AV10-17 compliance validation
 * Based on Java implementation: basicnode/src/main/java/io/aurigraph/basicnode/compliance/PerformanceMonitor.java
 */
import { EventEmitter } from 'events';
export declare enum ComplianceStatus {
    COMPLIANT = "COMPLIANT",
    NON_COMPLIANT = "NON_COMPLIANT",
    WARNING = "WARNING",
    UNKNOWN = "UNKNOWN"
}
export interface ComplianceMetric {
    name: string;
    status: ComplianceStatus;
    description: string;
    timestamp: Date;
    value?: number;
    threshold?: number;
}
export interface AV1017PerformanceReport {
    nodeId: string;
    reportTime: Date;
    startTime: Date;
    uptime: number;
    memoryUsageMB: number;
    cpuUsagePercent: number;
    currentTPS: number;
    totalTransactions: number;
    memoryCompliant: boolean;
    performanceCompliant: boolean;
    uptimeCompliant: boolean;
    av1017Compliant: boolean;
    nodeVersion: string;
    platform: string;
    architecture: string;
}
export interface PerformanceThresholds {
    maxMemoryMB: number;
    targetTPS: number;
    uptimeTargetPercent: number;
    cpuWarningThreshold: number;
    cpuCriticalThreshold: number;
}
export declare class PerformanceMonitor extends EventEmitter {
    private transactionCounter;
    private lastTpsCalculation;
    private lastTransactionCount;
    private readonly startTime;
    private metrics;
    private monitoringInterval?;
    private readonly thresholds;
    private nodeId;
    constructor(nodeId?: string, thresholds?: Partial<PerformanceThresholds>);
    private initializeMetrics;
    private collectMetrics;
    getCurrentMemoryUsageMB(): number;
    getCurrentCpuUsage(): number;
    getCurrentTPS(): number;
    getUptimeSeconds(): number;
    private calculateUptimePercent;
    recordTransaction(processingTimeMs?: number): void;
    generatePerformanceReport(): AV1017PerformanceReport;
    validateAV1017Compliance(): boolean;
    private recordComplianceMetric;
    getComplianceMetrics(): ComplianceMetric[];
    getComplianceMetric(name: string): ComplianceMetric | undefined;
    updateThresholds(newThresholds: Partial<PerformanceThresholds>): void;
    getThresholds(): PerformanceThresholds;
    startMonitoring(): void;
    stopMonitoring(): void;
    destroy(): void;
}
//# sourceMappingURL=PerformanceMonitor.d.ts.map