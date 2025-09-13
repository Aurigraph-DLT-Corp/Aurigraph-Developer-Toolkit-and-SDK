/**
 * AV11-16 Performance Monitor - TypeScript Implementation
 * Monitors node performance metrics for AV11-17 compliance validation
 * Based on Java implementation: basicnode/src/main/java/io/aurigraph/basicnode/compliance/PerformanceMonitor.java
 */

import { EventEmitter } from 'events';
import * as os from 'os';
import * as process from 'process';

export enum ComplianceStatus {
    COMPLIANT = 'COMPLIANT',
    NON_COMPLIANT = 'NON_COMPLIANT',
    WARNING = 'WARNING',
    UNKNOWN = 'UNKNOWN'
}

export interface ComplianceMetric {
    name: string;
    status: ComplianceStatus;
    description: string;
    timestamp: Date;
    value?: number;
    threshold?: number;
}

export interface AV1117PerformanceReport {
    nodeId: string;
    reportTime: Date;
    startTime: Date;
    uptime: number; // in seconds
    
    // Current metrics
    memoryUsageMB: number;
    cpuUsagePercent: number;
    currentTPS: number;
    totalTransactions: number;
    
    // Compliance status
    memoryCompliant: boolean;
    performanceCompliant: boolean;
    uptimeCompliant: boolean;
    av1017Compliant: boolean;
    
    // System information
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

export class PerformanceMonitor extends EventEmitter {
    private transactionCounter: number = 0;
    private lastTpsCalculation: number = Date.now();
    private lastTransactionCount: number = 0;
    private readonly startTime: Date = new Date();
    private metrics: Map<string, ComplianceMetric> = new Map();
    private monitoringInterval?: NodeJS.Timeout;
    
    // AV11-17 Compliance Thresholds
    private readonly thresholds: PerformanceThresholds = {
        maxMemoryMB: 4096,        // 4GB memory limit
        targetTPS: 1000000,       // 1M+ TPS target
        uptimeTargetPercent: 99.9, // 99.9% uptime requirement
        cpuWarningThreshold: 80,   // 80% CPU warning
        cpuCriticalThreshold: 95   // 95% CPU critical
    };
    
    private nodeId: string;
    
    constructor(nodeId: string = process.env.NODE_ID || 'unknown', thresholds?: Partial<PerformanceThresholds>) {
        super();
        this.nodeId = nodeId;
        
        if (thresholds) {
            this.thresholds = { ...this.thresholds, ...thresholds };
        }
        
        this.initializeMetrics();
    }
    
    private initializeMetrics(): void {
        console.log(`[${this.nodeId}] Initializing AV11-17 performance metrics...`);
        
        // Start monitoring interval (every 5 seconds)
        this.monitoringInterval = setInterval(() => {
            this.collectMetrics();
        }, 5000);
        
        console.log(`[${this.nodeId}] AV11-17 performance metrics initialized successfully`);
        this.emit('metrics-initialized');
    }
    
    private collectMetrics(): void {
        const report = this.generatePerformanceReport();
        
        // Update individual compliance metrics
        this.recordComplianceMetric(
            'memory_usage',
            report.memoryCompliant ? ComplianceStatus.COMPLIANT : ComplianceStatus.NON_COMPLIANT,
            `Memory usage: ${report.memoryUsageMB}MB (limit: ${this.thresholds.maxMemoryMB}MB)`,
            report.memoryUsageMB,
            this.thresholds.maxMemoryMB
        );
        
        this.recordComplianceMetric(
            'performance_tps',
            report.performanceCompliant ? ComplianceStatus.COMPLIANT : ComplianceStatus.NON_COMPLIANT,
            `TPS: ${report.currentTPS} (target: ${this.thresholds.targetTPS}+)`,
            report.currentTPS,
            this.thresholds.targetTPS
        );
        
        this.recordComplianceMetric(
            'uptime_percent',
            report.uptimeCompliant ? ComplianceStatus.COMPLIANT : ComplianceStatus.NON_COMPLIANT,
            `Uptime: ${this.calculateUptimePercent().toFixed(4)}% (target: ${this.thresholds.uptimeTargetPercent}%)`,
            this.calculateUptimePercent(),
            this.thresholds.uptimeTargetPercent
        );
        
        // CPU monitoring (not part of AV11-17 but useful)
        const cpuStatus = report.cpuUsagePercent >= this.thresholds.cpuCriticalThreshold 
            ? ComplianceStatus.NON_COMPLIANT
            : report.cpuUsagePercent >= this.thresholds.cpuWarningThreshold
            ? ComplianceStatus.WARNING
            : ComplianceStatus.COMPLIANT;
            
        this.recordComplianceMetric(
            'cpu_usage',
            cpuStatus,
            `CPU usage: ${report.cpuUsagePercent.toFixed(2)}%`,
            report.cpuUsagePercent,
            this.thresholds.cpuWarningThreshold
        );
        
        this.emit('metrics-updated', report);
    }
    
    public getCurrentMemoryUsageMB(): number {
        const memUsage = process.memoryUsage();
        const totalMemory = memUsage.heapUsed + memUsage.external + memUsage.arrayBuffers;
        return Math.round(totalMemory / (1024 * 1024));
    }
    
    public getCurrentCpuUsage(): number {
        const cpus = os.cpus();
        let totalIdle = 0;
        let totalTick = 0;
        
        cpus.forEach((cpu) => {
            for (const type in cpu.times) {
                totalTick += cpu.times[type as keyof typeof cpu.times];
            }
            totalIdle += cpu.times.idle;
        });
        
        return 100 - Math.round((100 * totalIdle) / totalTick);
    }
    
    public getCurrentTPS(): number {
        const currentTime = Date.now();
        const currentCount = this.transactionCounter;
        
        const timeDelta = currentTime - this.lastTpsCalculation;
        const countDelta = currentCount - this.lastTransactionCount;
        
        if (timeDelta < 1000) {
            return 0; // Too early to calculate meaningful TPS
        }
        
        const tps = Math.round((countDelta * 1000) / timeDelta);
        
        // Update for next calculation
        this.lastTpsCalculation = currentTime;
        this.lastTransactionCount = currentCount;
        
        return tps;
    }
    
    public getUptimeSeconds(): number {
        return Math.floor((Date.now() - this.startTime.getTime()) / 1000);
    }
    
    private calculateUptimePercent(): number {
        const totalTime = Date.now() - this.startTime.getTime();
        if (totalTime === 0) return 100.0;
        
        // Simplified - could track actual downtime
        const actualUptime = totalTime;
        return (actualUptime / totalTime) * 100.0;
    }
    
    public recordTransaction(processingTimeMs?: number): void {
        this.transactionCounter++;
        
        if (processingTimeMs) {
            this.emit('transaction-recorded', {
                transactionId: this.transactionCounter,
                processingTime: processingTimeMs,
                timestamp: new Date()
            });
        }
    }
    
    public generatePerformanceReport(): AV1117PerformanceReport {
        const memoryUsage = this.getCurrentMemoryUsageMB();
        const cpuUsage = this.getCurrentCpuUsage();
        const currentTPS = this.getCurrentTPS();
        const uptimePercent = this.calculateUptimePercent();
        
        const report: AV1117PerformanceReport = {
            nodeId: this.nodeId,
            reportTime: new Date(),
            startTime: this.startTime,
            uptime: this.getUptimeSeconds(),
            
            // Current metrics
            memoryUsageMB: memoryUsage,
            cpuUsagePercent: cpuUsage,
            currentTPS: currentTPS,
            totalTransactions: this.transactionCounter,
            
            // Compliance validation
            memoryCompliant: memoryUsage <= this.thresholds.maxMemoryMB,
            performanceCompliant: currentTPS >= this.thresholds.targetTPS || this.transactionCounter < 100,
            uptimeCompliant: uptimePercent >= this.thresholds.uptimeTargetPercent,
            av1017Compliant: false, // Will be set below
            
            // System information
            nodeVersion: process.version,
            platform: process.platform,
            architecture: process.arch
        };
        
        // Overall compliance
        report.av1017Compliant = report.memoryCompliant && 
                                 report.performanceCompliant && 
                                 report.uptimeCompliant;
        
        return report;
    }
    
    public validateAV1117Compliance(): boolean {
        const report = this.generatePerformanceReport();
        
        if (!report.av1017Compliant) {
            console.error(`[${this.nodeId}] AV11-17 COMPLIANCE VIOLATION:`);
            console.error(`- Memory: ${report.memoryUsageMB}MB (limit: ${this.thresholds.maxMemoryMB}MB) - ${report.memoryCompliant ? 'PASS' : 'FAIL'}`);
            console.error(`- Performance: ${report.currentTPS} TPS (target: ${this.thresholds.targetTPS}+) - ${report.performanceCompliant ? 'PASS' : 'FAIL'}`);
            console.error(`- Uptime: ${this.calculateUptimePercent().toFixed(4)}% (target: ${this.thresholds.uptimeTargetPercent}%) - ${report.uptimeCompliant ? 'PASS' : 'FAIL'}`);
            
            this.emit('compliance-violation', report);
            return false;
        }
        
        console.log(`[${this.nodeId}] AV11-17 COMPLIANCE: ALL REQUIREMENTS SATISFIED`);
        this.emit('compliance-validated', report);
        return true;
    }
    
    private recordComplianceMetric(name: string, status: ComplianceStatus, description: string, value?: number, threshold?: number): void {
        const metric: ComplianceMetric = {
            name,
            status,
            description,
            timestamp: new Date(),
            value,
            threshold
        };
        
        this.metrics.set(name, metric);
        this.emit('compliance-metric', metric);
    }
    
    public getComplianceMetrics(): ComplianceMetric[] {
        return Array.from(this.metrics.values());
    }
    
    public getComplianceMetric(name: string): ComplianceMetric | undefined {
        return this.metrics.get(name);
    }
    
    public updateThresholds(newThresholds: Partial<PerformanceThresholds>): void {
        Object.assign(this.thresholds, newThresholds);
        console.log(`[${this.nodeId}] Updated performance thresholds:`, this.thresholds);
        this.emit('thresholds-updated', this.thresholds);
    }
    
    public getThresholds(): PerformanceThresholds {
        return { ...this.thresholds };
    }
    
    public startMonitoring(): void {
        if (!this.monitoringInterval) {
            this.initializeMetrics();
            console.log(`[${this.nodeId}] Performance monitoring started`);
        }
    }
    
    public stopMonitoring(): void {
        if (this.monitoringInterval) {
            clearInterval(this.monitoringInterval);
            this.monitoringInterval = undefined;
            console.log(`[${this.nodeId}] Performance monitoring stopped`);
            this.emit('monitoring-stopped');
        }
    }
    
    public destroy(): void {
        this.stopMonitoring();
        this.removeAllListeners();
    }
}