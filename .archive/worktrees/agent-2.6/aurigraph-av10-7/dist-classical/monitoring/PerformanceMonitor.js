"use strict";
/**
 * AV10-16 Performance Monitor - TypeScript Implementation
 * Monitors node performance metrics for AV10-17 compliance validation
 * Based on Java implementation: basicnode/src/main/java/io/aurigraph/basicnode/compliance/PerformanceMonitor.java
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.PerformanceMonitor = exports.ComplianceStatus = void 0;
const events_1 = require("events");
const os = __importStar(require("os"));
const process = __importStar(require("process"));
var ComplianceStatus;
(function (ComplianceStatus) {
    ComplianceStatus["COMPLIANT"] = "COMPLIANT";
    ComplianceStatus["NON_COMPLIANT"] = "NON_COMPLIANT";
    ComplianceStatus["WARNING"] = "WARNING";
    ComplianceStatus["UNKNOWN"] = "UNKNOWN";
})(ComplianceStatus || (exports.ComplianceStatus = ComplianceStatus = {}));
class PerformanceMonitor extends events_1.EventEmitter {
    transactionCounter = 0;
    lastTpsCalculation = Date.now();
    lastTransactionCount = 0;
    startTime = new Date();
    metrics = new Map();
    monitoringInterval;
    // AV10-17 Compliance Thresholds
    thresholds = {
        maxMemoryMB: 4096, // 4GB memory limit
        targetTPS: 1000000, // 1M+ TPS target
        uptimeTargetPercent: 99.9, // 99.9% uptime requirement
        cpuWarningThreshold: 80, // 80% CPU warning
        cpuCriticalThreshold: 95 // 95% CPU critical
    };
    nodeId;
    constructor(nodeId = process.env.NODE_ID || 'unknown', thresholds) {
        super();
        this.nodeId = nodeId;
        if (thresholds) {
            this.thresholds = { ...this.thresholds, ...thresholds };
        }
        this.initializeMetrics();
    }
    initializeMetrics() {
        console.log(`[${this.nodeId}] Initializing AV10-17 performance metrics...`);
        // Start monitoring interval (every 5 seconds)
        this.monitoringInterval = setInterval(() => {
            this.collectMetrics();
        }, 5000);
        console.log(`[${this.nodeId}] AV10-17 performance metrics initialized successfully`);
        this.emit('metrics-initialized');
    }
    collectMetrics() {
        const report = this.generatePerformanceReport();
        // Update individual compliance metrics
        this.recordComplianceMetric('memory_usage', report.memoryCompliant ? ComplianceStatus.COMPLIANT : ComplianceStatus.NON_COMPLIANT, `Memory usage: ${report.memoryUsageMB}MB (limit: ${this.thresholds.maxMemoryMB}MB)`, report.memoryUsageMB, this.thresholds.maxMemoryMB);
        this.recordComplianceMetric('performance_tps', report.performanceCompliant ? ComplianceStatus.COMPLIANT : ComplianceStatus.NON_COMPLIANT, `TPS: ${report.currentTPS} (target: ${this.thresholds.targetTPS}+)`, report.currentTPS, this.thresholds.targetTPS);
        this.recordComplianceMetric('uptime_percent', report.uptimeCompliant ? ComplianceStatus.COMPLIANT : ComplianceStatus.NON_COMPLIANT, `Uptime: ${this.calculateUptimePercent().toFixed(4)}% (target: ${this.thresholds.uptimeTargetPercent}%)`, this.calculateUptimePercent(), this.thresholds.uptimeTargetPercent);
        // CPU monitoring (not part of AV10-17 but useful)
        const cpuStatus = report.cpuUsagePercent >= this.thresholds.cpuCriticalThreshold
            ? ComplianceStatus.NON_COMPLIANT
            : report.cpuUsagePercent >= this.thresholds.cpuWarningThreshold
                ? ComplianceStatus.WARNING
                : ComplianceStatus.COMPLIANT;
        this.recordComplianceMetric('cpu_usage', cpuStatus, `CPU usage: ${report.cpuUsagePercent.toFixed(2)}%`, report.cpuUsagePercent, this.thresholds.cpuWarningThreshold);
        this.emit('metrics-updated', report);
    }
    getCurrentMemoryUsageMB() {
        const memUsage = process.memoryUsage();
        const totalMemory = memUsage.heapUsed + memUsage.external + memUsage.arrayBuffers;
        return Math.round(totalMemory / (1024 * 1024));
    }
    getCurrentCpuUsage() {
        const cpus = os.cpus();
        let totalIdle = 0;
        let totalTick = 0;
        cpus.forEach((cpu) => {
            for (const type in cpu.times) {
                totalTick += cpu.times[type];
            }
            totalIdle += cpu.times.idle;
        });
        return 100 - Math.round((100 * totalIdle) / totalTick);
    }
    getCurrentTPS() {
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
    getUptimeSeconds() {
        return Math.floor((Date.now() - this.startTime.getTime()) / 1000);
    }
    calculateUptimePercent() {
        const totalTime = Date.now() - this.startTime.getTime();
        if (totalTime === 0)
            return 100.0;
        // Simplified - could track actual downtime
        const actualUptime = totalTime;
        return (actualUptime / totalTime) * 100.0;
    }
    recordTransaction(processingTimeMs) {
        this.transactionCounter++;
        if (processingTimeMs) {
            this.emit('transaction-recorded', {
                transactionId: this.transactionCounter,
                processingTime: processingTimeMs,
                timestamp: new Date()
            });
        }
    }
    generatePerformanceReport() {
        const memoryUsage = this.getCurrentMemoryUsageMB();
        const cpuUsage = this.getCurrentCpuUsage();
        const currentTPS = this.getCurrentTPS();
        const uptimePercent = this.calculateUptimePercent();
        const report = {
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
    validateAV1017Compliance() {
        const report = this.generatePerformanceReport();
        if (!report.av1017Compliant) {
            console.error(`[${this.nodeId}] AV10-17 COMPLIANCE VIOLATION:`);
            console.error(`- Memory: ${report.memoryUsageMB}MB (limit: ${this.thresholds.maxMemoryMB}MB) - ${report.memoryCompliant ? 'PASS' : 'FAIL'}`);
            console.error(`- Performance: ${report.currentTPS} TPS (target: ${this.thresholds.targetTPS}+) - ${report.performanceCompliant ? 'PASS' : 'FAIL'}`);
            console.error(`- Uptime: ${this.calculateUptimePercent().toFixed(4)}% (target: ${this.thresholds.uptimeTargetPercent}%) - ${report.uptimeCompliant ? 'PASS' : 'FAIL'}`);
            this.emit('compliance-violation', report);
            return false;
        }
        console.log(`[${this.nodeId}] AV10-17 COMPLIANCE: ALL REQUIREMENTS SATISFIED`);
        this.emit('compliance-validated', report);
        return true;
    }
    recordComplianceMetric(name, status, description, value, threshold) {
        const metric = {
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
    getComplianceMetrics() {
        return Array.from(this.metrics.values());
    }
    getComplianceMetric(name) {
        return this.metrics.get(name);
    }
    updateThresholds(newThresholds) {
        Object.assign(this.thresholds, newThresholds);
        console.log(`[${this.nodeId}] Updated performance thresholds:`, this.thresholds);
        this.emit('thresholds-updated', this.thresholds);
    }
    getThresholds() {
        return { ...this.thresholds };
    }
    startMonitoring() {
        if (!this.monitoringInterval) {
            this.initializeMetrics();
            console.log(`[${this.nodeId}] Performance monitoring started`);
        }
    }
    stopMonitoring() {
        if (this.monitoringInterval) {
            clearInterval(this.monitoringInterval);
            this.monitoringInterval = undefined;
            console.log(`[${this.nodeId}] Performance monitoring stopped`);
            this.emit('monitoring-stopped');
        }
    }
    destroy() {
        this.stopMonitoring();
        this.removeAllListeners();
    }
}
exports.PerformanceMonitor = PerformanceMonitor;
//# sourceMappingURL=PerformanceMonitor.js.map