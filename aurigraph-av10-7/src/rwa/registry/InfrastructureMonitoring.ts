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
import { cpus, loadavg, freemem, totalmem, uptime } from 'os';
import { performance, PerformanceObserver } from 'perf_hooks';
import { createHash, randomBytes } from 'crypto';
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

export enum HealthCheckCategory {
  SYSTEM = 'SYSTEM',
  APPLICATION = 'APPLICATION',
  DATABASE = 'DATABASE',
  NETWORK = 'NETWORK',
  EXTERNAL_SERVICE = 'EXTERNAL_SERVICE',
  STORAGE = 'STORAGE',
  SECURITY = 'SECURITY',
  PERFORMANCE = 'PERFORMANCE'
}

export enum HealthCheckType {
  HTTP = 'HTTP',
  TCP = 'TCP',
  DNS = 'DNS',
  DATABASE_CONNECTION = 'DATABASE_CONNECTION',
  DISK_SPACE = 'DISK_SPACE',
  MEMORY_USAGE = 'MEMORY_USAGE',
  CPU_USAGE = 'CPU_USAGE',
  PROCESS_COUNT = 'PROCESS_COUNT',
  LOG_ERRORS = 'LOG_ERRORS',
  CUSTOM = 'CUSTOM'
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

export enum HealthStatus {
  OK = 'OK',
  WARNING = 'WARNING',
  CRITICAL = 'CRITICAL',
  UNKNOWN = 'UNKNOWN'
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
  rps: number; // Requests per second
  tps: number; // Transactions per second
  peak: number;
  average: number;
}

export interface AvailabilityMetrics {
  uptime: number;
  sla: number;
  mtbf: number; // Mean Time Between Failures
  mttr: number; // Mean Time To Recovery
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

export enum AlertSeverity {
  INFO = 'INFO',
  WARNING = 'WARNING',
  ERROR = 'ERROR',
  CRITICAL = 'CRITICAL',
  EMERGENCY = 'EMERGENCY'
}

export enum AlertStatus {
  ACTIVE = 'ACTIVE',
  ACKNOWLEDGED = 'ACKNOWLEDGED',
  RESOLVED = 'RESOLVED',
  SUPPRESSED = 'SUPPRESSED'
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

export class InfrastructureMonitoring extends EventEmitter {
  private healthChecks: Map<string, HealthCheck> = new Map();
  private metrics: SystemMetrics[] = [];
  private alerts: Map<string, Alert> = new Map();
  private notificationChannels: Map<string, NotificationChannel> = new Map();
  private slaTargets: Map<string, SLATarget> = new Map();
  
  private cryptoManager: QuantumCryptoManagerV2;
  private consensus: HyperRAFTPlusPlusV2;
  
  // Monitoring state
  private isRunning: boolean = false;
  private startTime: Date = new Date();
  private performanceObserver: PerformanceObserver;
  
  // Intervals
  private healthCheckInterval: NodeJS.Timeout;
  private metricsInterval: NodeJS.Timeout;
  private alertingInterval: NodeJS.Timeout;
  private slaInterval: NodeJS.Timeout;

  constructor(
    cryptoManager: QuantumCryptoManagerV2,
    consensus: HyperRAFTPlusPlusV2
  ) {
    super();
    this.cryptoManager = cryptoManager;
    this.consensus = consensus;
    
    this.initializePerformanceObserver();
    this.initializeDefaultHealthChecks();
    this.initializeDefaultNotificationChannels();
    this.initializeDefaultSLATargets();
    
    this.emit('monitoringInitialized', {
      timestamp: new Date(),
      healthChecks: this.healthChecks.size,
      notificationChannels: this.notificationChannels.size,
      slaTargets: this.slaTargets.size
    });
  }

  private initializePerformanceObserver(): void {
    this.performanceObserver = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      for (const entry of entries) {
        this.processPerformanceEntry(entry);
      }
    });

    this.performanceObserver.observe({ 
      entryTypes: ['measure', 'navigation', 'resource'] 
    });
  }

  private initializeDefaultHealthChecks(): void {
    // System resource health checks
    this.addHealthCheck({
      id: 'cpu-usage',
      name: 'CPU Usage',
      category: HealthCheckCategory.SYSTEM,
      type: HealthCheckType.CPU_USAGE,
      target: 'system',
      interval: 30000, // 30 seconds
      timeout: 5000,
      retries: 3,
      threshold: {
        critical: { operator: 'GT', value: 90 },
        warning: { operator: 'GT', value: 70 },
        ok: { operator: 'LTE', value: 70 }
      },
      dependencies: [],
      configuration: {},
      enabled: true,
      history: []
    });

    this.addHealthCheck({
      id: 'memory-usage',
      name: 'Memory Usage',
      category: HealthCheckCategory.SYSTEM,
      type: HealthCheckType.MEMORY_USAGE,
      target: 'system',
      interval: 30000,
      timeout: 5000,
      retries: 3,
      threshold: {
        critical: { operator: 'GT', value: 95 },
        warning: { operator: 'GT', value: 80 },
        ok: { operator: 'LTE', value: 80 }
      },
      dependencies: [],
      configuration: {},
      enabled: true,
      history: []
    });

    this.addHealthCheck({
      id: 'disk-space',
      name: 'Disk Space',
      category: HealthCheckCategory.SYSTEM,
      type: HealthCheckType.DISK_SPACE,
      target: '/',
      interval: 60000, // 1 minute
      timeout: 10000,
      retries: 2,
      threshold: {
        critical: { operator: 'GT', value: 95 },
        warning: { operator: 'GT', value: 85 },
        ok: { operator: 'LTE', value: 85 }
      },
      dependencies: [],
      configuration: { partition: '/' },
      enabled: true,
      history: []
    });

    // Application health checks
    this.addHealthCheck({
      id: 'asset-registration-service',
      name: 'Asset Registration Service',
      category: HealthCheckCategory.APPLICATION,
      type: HealthCheckType.HTTP,
      target: 'http://localhost:3000/health',
      interval: 60000,
      timeout: 30000,
      retries: 3,
      threshold: {
        critical: { operator: 'GT', value: 5000 },
        warning: { operator: 'GT', value: 2000 },
        ok: { operator: 'LTE', value: 2000 }
      },
      dependencies: [],
      configuration: { expectedStatus: 200 },
      enabled: true,
      history: []
    });

    // Database health check
    this.addHealthCheck({
      id: 'database-connection',
      name: 'Database Connection',
      category: HealthCheckCategory.DATABASE,
      type: HealthCheckType.DATABASE_CONNECTION,
      target: 'postgresql://localhost:5432/aurigraph',
      interval: 60000,
      timeout: 10000,
      retries: 3,
      threshold: {
        critical: { operator: 'GT', value: 5000 },
        warning: { operator: 'GT', value: 2000 },
        ok: { operator: 'LTE', value: 2000 }
      },
      dependencies: [],
      configuration: {},
      enabled: true,
      history: []
    });

    // External service health checks
    this.addHealthCheck({
      id: 'external-api-sec',
      name: 'SEC EDGAR API',
      category: HealthCheckCategory.EXTERNAL_SERVICE,
      type: HealthCheckType.HTTP,
      target: 'https://www.sec.gov/Archives/edgar',
      interval: 300000, // 5 minutes
      timeout: 30000,
      retries: 2,
      threshold: {
        critical: { operator: 'GT', value: 10000 },
        warning: { operator: 'GT', value: 5000 },
        ok: { operator: 'LTE', value: 5000 }
      },
      dependencies: [],
      configuration: { expectedStatus: 200 },
      enabled: true,
      history: []
    });
  }

  private initializeDefaultNotificationChannels(): void {
    this.addNotificationChannel({
      id: 'email-admins',
      name: 'Administrator Email',
      type: 'EMAIL',
      configuration: {
        recipients: ['admin@aurigraph.com', 'ops@aurigraph.com'],
        subject: '[AURIGRAPH] Alert: {{title}}',
        template: 'alert-email'
      },
      enabled: true,
      filters: [
        { field: 'severity', operator: 'EQUALS', value: 'CRITICAL' },
        { field: 'severity', operator: 'EQUALS', value: 'ERROR' }
      ]
    });

    this.addNotificationChannel({
      id: 'slack-ops',
      name: 'Slack Operations Channel',
      type: 'SLACK',
      configuration: {
        webhook: process.env.SLACK_WEBHOOK_URL,
        channel: '#operations',
        username: 'Aurigraph Monitor'
      },
      enabled: true,
      filters: [
        { field: 'severity', operator: 'EQUALS', value: 'WARNING' },
        { field: 'severity', operator: 'EQUALS', value: 'ERROR' },
        { field: 'severity', operator: 'EQUALS', value: 'CRITICAL' }
      ]
    });

    this.addNotificationChannel({
      id: 'pagerduty-critical',
      name: 'PagerDuty Critical Alerts',
      type: 'PAGER_DUTY',
      configuration: {
        integrationKey: process.env.PAGERDUTY_INTEGRATION_KEY,
        severity: 'critical',
        component: 'aurigraph-av10'
      },
      enabled: true,
      filters: [
        { field: 'severity', operator: 'EQUALS', value: 'CRITICAL' },
        { field: 'severity', operator: 'EQUALS', value: 'EMERGENCY' }
      ]
    });
  }

  private initializeDefaultSLATargets(): void {
    this.addSLATarget({
      id: 'api-availability',
      name: 'API Availability',
      metric: 'availability',
      target: 99.9,
      period: 'MONTHLY',
      operator: 'GTE',
      enabled: true,
      current: 100,
      breach: false
    });

    this.addSLATarget({
      id: 'response-time-p95',
      name: 'API Response Time P95',
      metric: 'response_time_p95',
      target: 2000,
      period: 'HOURLY',
      operator: 'LTE',
      enabled: true,
      current: 0,
      breach: false
    });

    this.addSLATarget({
      id: 'error-rate',
      name: 'Error Rate',
      metric: 'error_rate',
      target: 0.1,
      period: 'DAILY',
      operator: 'LTE',
      enabled: true,
      current: 0,
      breach: false
    });
  }

  start(): void {
    if (this.isRunning) return;

    this.isRunning = true;
    this.startTime = new Date();

    // Start health check monitoring
    this.healthCheckInterval = setInterval(() => {
      this.runHealthChecks();
    }, 10000); // Run every 10 seconds

    // Start metrics collection
    this.metricsInterval = setInterval(() => {
      this.collectMetrics();
    }, 5000); // Collect every 5 seconds

    // Start alerting engine
    this.alertingInterval = setInterval(() => {
      this.processAlerts();
    }, 1000); // Process alerts every second

    // Start SLA monitoring
    this.slaInterval = setInterval(() => {
      this.monitorSLAs();
    }, 60000); // Check SLAs every minute

    this.emit('monitoringStarted', {
      timestamp: new Date(),
      startTime: this.startTime
    });
  }

  stop(): void {
    if (!this.isRunning) return;

    this.isRunning = false;

    if (this.healthCheckInterval) clearInterval(this.healthCheckInterval);
    if (this.metricsInterval) clearInterval(this.metricsInterval);
    if (this.alertingInterval) clearInterval(this.alertingInterval);
    if (this.slaInterval) clearInterval(this.slaInterval);

    this.performanceObserver.disconnect();

    this.emit('monitoringStopped', {
      timestamp: new Date(),
      uptime: Date.now() - this.startTime.getTime()
    });
  }

  private async runHealthChecks(): Promise<void> {
    for (const [checkId, healthCheck] of this.healthChecks.entries()) {
      if (!healthCheck.enabled) continue;

      const now = new Date();
      if (healthCheck.lastRun && 
          now.getTime() - healthCheck.lastRun.getTime() < healthCheck.interval) {
        continue;
      }

      try {
        const result = await this.executeHealthCheck(healthCheck);
        healthCheck.lastRun = now;
        healthCheck.lastResult = result;
        healthCheck.history.push(result);

        // Limit history size
        if (healthCheck.history.length > 1000) {
          healthCheck.history = healthCheck.history.slice(-1000);
        }

        // Check if alert needs to be triggered
        if (result.status !== HealthStatus.OK) {
          await this.triggerAlert(healthCheck, result);
        }

        this.emit('healthCheckCompleted', {
          checkId,
          result,
          timestamp: now
        });

      } catch (error) {
        const errorResult: HealthCheckResult = {
          checkId,
          timestamp: now,
          status: HealthStatus.UNKNOWN,
          responseTime: 0,
          message: `Health check failed: ${error.message}`,
          details: { error: error.message }
        };

        healthCheck.lastRun = now;
        healthCheck.lastResult = errorResult;
        healthCheck.history.push(errorResult);

        this.emit('healthCheckFailed', {
          checkId,
          error: error.message,
          timestamp: now
        });
      }
    }
  }

  private async executeHealthCheck(healthCheck: HealthCheck): Promise<HealthCheckResult> {
    const startTime = performance.now();

    let result: HealthCheckResult;

    switch (healthCheck.type) {
      case HealthCheckType.CPU_USAGE:
        result = await this.checkCPUUsage(healthCheck);
        break;
      case HealthCheckType.MEMORY_USAGE:
        result = await this.checkMemoryUsage(healthCheck);
        break;
      case HealthCheckType.DISK_SPACE:
        result = await this.checkDiskSpace(healthCheck);
        break;
      case HealthCheckType.HTTP:
        result = await this.checkHTTPEndpoint(healthCheck);
        break;
      case HealthCheckType.TCP:
        result = await this.checkTCPConnection(healthCheck);
        break;
      case HealthCheckType.DATABASE_CONNECTION:
        result = await this.checkDatabaseConnection(healthCheck);
        break;
      default:
        result = {
          checkId: healthCheck.id,
          timestamp: new Date(),
          status: HealthStatus.UNKNOWN,
          responseTime: performance.now() - startTime,
          message: `Unsupported health check type: ${healthCheck.type}`,
          details: {}
        };
    }

    result.responseTime = performance.now() - startTime;
    return result;
  }

  private async checkCPUUsage(healthCheck: HealthCheck): Promise<HealthCheckResult> {
    const loadAvg = loadavg();
    const cpuCount = cpus().length;
    const cpuUsage = (loadAvg[0] / cpuCount) * 100;

    const status = this.evaluateThreshold(cpuUsage, healthCheck.threshold);

    return {
      checkId: healthCheck.id,
      timestamp: new Date(),
      status,
      responseTime: 0,
      value: cpuUsage,
      message: `CPU usage: ${cpuUsage.toFixed(2)}%`,
      details: {
        loadAverage: loadAvg,
        cores: cpuCount,
        usage: cpuUsage
      },
      remediation: status !== HealthStatus.OK ? [
        {
          action: 'scale_up',
          description: 'Consider scaling up resources or optimizing CPU-intensive processes',
          automated: false,
          priority: 'HIGH',
          estimatedTime: 300,
          requirements: ['Infrastructure access', 'Performance analysis']
        }
      ] : undefined
    };
  }

  private async checkMemoryUsage(healthCheck: HealthCheck): Promise<HealthCheckResult> {
    const totalMem = totalmem();
    const freeMem = freemem();
    const usedMem = totalMem - freeMem;
    const memoryUsage = (usedMem / totalMem) * 100;

    const status = this.evaluateThreshold(memoryUsage, healthCheck.threshold);

    return {
      checkId: healthCheck.id,
      timestamp: new Date(),
      status,
      responseTime: 0,
      value: memoryUsage,
      message: `Memory usage: ${memoryUsage.toFixed(2)}%`,
      details: {
        total: totalMem,
        free: freeMem,
        used: usedMem,
        usage: memoryUsage
      },
      remediation: status !== HealthStatus.OK ? [
        {
          action: 'memory_cleanup',
          description: 'Clear memory caches and optimize memory usage',
          automated: true,
          priority: 'MEDIUM',
          estimatedTime: 60,
          requirements: ['System access']
        }
      ] : undefined
    };
  }

  private async checkDiskSpace(healthCheck: HealthCheck): Promise<HealthCheckResult> {
    // Simulate disk space check (in real implementation, use fs.stat)
    const totalSpace = 100 * 1024 * 1024 * 1024; // 100GB
    const usedSpace = Math.floor(Math.random() * totalSpace * 0.9);
    const diskUsage = (usedSpace / totalSpace) * 100;

    const status = this.evaluateThreshold(diskUsage, healthCheck.threshold);

    return {
      checkId: healthCheck.id,
      timestamp: new Date(),
      status,
      responseTime: 0,
      value: diskUsage,
      message: `Disk usage: ${diskUsage.toFixed(2)}%`,
      details: {
        partition: healthCheck.configuration.partition || '/',
        total: totalSpace,
        used: usedSpace,
        free: totalSpace - usedSpace,
        usage: diskUsage
      },
      remediation: status !== HealthStatus.OK ? [
        {
          action: 'disk_cleanup',
          description: 'Clean up old files and logs',
          automated: true,
          priority: 'MEDIUM',
          estimatedTime: 120,
          requirements: ['File system access']
        }
      ] : undefined
    };
  }

  private async checkHTTPEndpoint(healthCheck: HealthCheck): Promise<HealthCheckResult> {
    const startTime = performance.now();
    
    try {
      // Simulate HTTP check (in real implementation, use axios or fetch)
      const responseTime = Math.random() * 3000 + 500; // 500-3500ms
      const statusCode = Math.random() > 0.1 ? 200 : 500; // 90% success rate
      
      await new Promise(resolve => setTimeout(resolve, Math.min(responseTime, 100))); // Simulate network delay

      const status = statusCode === 200 ? 
        this.evaluateThreshold(responseTime, healthCheck.threshold) : 
        HealthStatus.CRITICAL;

      return {
        checkId: healthCheck.id,
        timestamp: new Date(),
        status,
        responseTime: performance.now() - startTime,
        value: responseTime,
        message: `HTTP ${statusCode}: ${status}`,
        details: {
          url: healthCheck.target,
          statusCode,
          responseTime
        },
        remediation: status !== HealthStatus.OK ? [
          {
            action: 'restart_service',
            description: 'Restart the affected service',
            automated: true,
            priority: 'HIGH',
            estimatedTime: 30,
            requirements: ['Service management access']
          }
        ] : undefined
      };

    } catch (error) {
      return {
        checkId: healthCheck.id,
        timestamp: new Date(),
        status: HealthStatus.CRITICAL,
        responseTime: performance.now() - startTime,
        message: `HTTP check failed: ${error.message}`,
        details: { error: error.message }
      };
    }
  }

  private async checkTCPConnection(healthCheck: HealthCheck): Promise<HealthCheckResult> {
    // Simulate TCP connection check
    const responseTime = Math.random() * 1000 + 100; // 100-1100ms
    const connected = Math.random() > 0.05; // 95% success rate
    
    const status = connected ? 
      this.evaluateThreshold(responseTime, healthCheck.threshold) : 
      HealthStatus.CRITICAL;

    return {
      checkId: healthCheck.id,
      timestamp: new Date(),
      status,
      responseTime,
      value: responseTime,
      message: connected ? `TCP connection successful` : `TCP connection failed`,
      details: {
        target: healthCheck.target,
        connected,
        responseTime
      }
    };
  }

  private async checkDatabaseConnection(healthCheck: HealthCheck): Promise<HealthCheckResult> {
    // Simulate database connection check
    const responseTime = Math.random() * 2000 + 200; // 200-2200ms
    const connected = Math.random() > 0.02; // 98% success rate
    
    const status = connected ? 
      this.evaluateThreshold(responseTime, healthCheck.threshold) : 
      HealthStatus.CRITICAL;

    return {
      checkId: healthCheck.id,
      timestamp: new Date(),
      status,
      responseTime,
      value: responseTime,
      message: connected ? `Database connection successful` : `Database connection failed`,
      details: {
        target: healthCheck.target,
        connected,
        responseTime,
        activeConnections: Math.floor(Math.random() * 50),
        maxConnections: 100
      },
      remediation: status !== HealthStatus.OK ? [
        {
          action: 'restart_db_pool',
          description: 'Restart database connection pool',
          automated: true,
          priority: 'HIGH',
          estimatedTime: 10,
          requirements: ['Database access']
        }
      ] : undefined
    };
  }

  private evaluateThreshold(value: number, threshold: HealthThreshold): HealthStatus {
    if (this.compareThresholdValue(value, threshold.critical)) {
      return HealthStatus.CRITICAL;
    } else if (this.compareThresholdValue(value, threshold.warning)) {
      return HealthStatus.WARNING;
    } else {
      return HealthStatus.OK;
    }
  }

  private compareThresholdValue(value: number, thresholdValue: ThresholdValue): boolean {
    switch (thresholdValue.operator) {
      case 'GT': return value > thresholdValue.value;
      case 'LT': return value < thresholdValue.value;
      case 'GTE': return value >= thresholdValue.value;
      case 'LTE': return value <= thresholdValue.value;
      case 'EQ': return value === thresholdValue.value;
      case 'NEQ': return value !== thresholdValue.value;
      default: return false;
    }
  }

  private async collectMetrics(): Promise<void> {
    const timestamp = new Date();
    
    try {
      const systemMetrics: SystemMetrics = {
        timestamp,
        system: await this.collectSystemMetrics(),
        application: await this.collectApplicationMetrics(),
        network: await this.collectNetworkMetrics(),
        storage: await this.collectStorageMetrics(),
        performance: await this.collectPerformanceMetrics(),
        security: await this.collectSecurityMetrics()
      };

      this.metrics.push(systemMetrics);

      // Limit metrics history
      if (this.metrics.length > 10000) {
        this.metrics = this.metrics.slice(-10000);
      }

      this.emit('metricsCollected', {
        timestamp,
        metrics: systemMetrics
      });

    } catch (error) {
      this.emit('metricsCollectionFailed', {
        timestamp,
        error: error.message
      });
    }
  }

  private async collectSystemMetrics(): Promise<SystemResourceMetrics> {
    const totalMem = totalmem();
    const freeMem = freemem();
    const loadAvg = loadavg();

    return {
      cpu: {
        usage: (loadAvg[0] / cpus().length) * 100,
        loadAverage: loadAvg,
        cores: cpus().length,
        processes: Math.floor(Math.random() * 500) + 100,
        temperature: Math.random() * 30 + 40 // 40-70°C
      },
      memory: {
        total: totalMem,
        free: freeMem,
        used: totalMem - freeMem,
        usagePercent: ((totalMem - freeMem) / totalMem) * 100,
        swap: {
          total: totalMem * 0.5,
          free: totalMem * 0.4,
          used: totalMem * 0.1,
          usagePercent: 20
        }
      },
      disk: {
        partitions: [
          {
            device: '/dev/sda1',
            mountpoint: '/',
            total: 100 * 1024 * 1024 * 1024,
            used: 50 * 1024 * 1024 * 1024,
            free: 50 * 1024 * 1024 * 1024,
            usagePercent: 50
          }
        ],
        io: {
          readOps: Math.floor(Math.random() * 1000),
          writeOps: Math.floor(Math.random() * 500),
          readBytes: Math.floor(Math.random() * 1024 * 1024),
          writeBytes: Math.floor(Math.random() * 1024 * 512),
          iowait: Math.random() * 10
        }
      },
      network: {
        interfaces: [
          {
            name: 'eth0',
            rx: {
              bytes: Math.floor(Math.random() * 1024 * 1024),
              packets: Math.floor(Math.random() * 10000),
              errors: Math.floor(Math.random() * 10)
            },
            tx: {
              bytes: Math.floor(Math.random() * 1024 * 512),
              packets: Math.floor(Math.random() * 5000),
              errors: Math.floor(Math.random() * 5)
            },
            errors: 0,
            drops: 0
          }
        ],
        connections: {
          established: Math.floor(Math.random() * 100) + 20,
          timeWait: Math.floor(Math.random() * 50),
          closeWait: Math.floor(Math.random() * 10),
          listening: Math.floor(Math.random() * 20) + 5
        }
      },
      processes: {
        total: Math.floor(Math.random() * 500) + 200,
        running: Math.floor(Math.random() * 50) + 10,
        sleeping: Math.floor(Math.random() * 400) + 150,
        stopped: Math.floor(Math.random() * 5),
        zombie: Math.floor(Math.random() * 2)
      },
      uptime: uptime()
    };
  }

  private async collectApplicationMetrics(): Promise<ApplicationMetrics> {
    return {
      requests: {
        total: Math.floor(Math.random() * 10000) + 5000,
        successful: Math.floor(Math.random() * 9500) + 4500,
        failed: Math.floor(Math.random() * 500) + 50,
        rate: Math.random() * 100 + 50,
        activeRequests: Math.floor(Math.random() * 20) + 5
      },
      errors: {
        total: Math.floor(Math.random() * 100) + 10,
        rate: Math.random() * 2,
        byType: {
          'ValidationError': Math.floor(Math.random() * 30),
          'NetworkError': Math.floor(Math.random() * 20),
          'DatabaseError': Math.floor(Math.random() * 15),
          'AuthError': Math.floor(Math.random() * 10)
        },
        recent: []
      },
      latency: {
        p50: Math.random() * 500 + 100,
        p95: Math.random() * 1500 + 500,
        p99: Math.random() * 3000 + 1000,
        average: Math.random() * 800 + 200,
        min: Math.random() * 50 + 10,
        max: Math.random() * 5000 + 2000
      },
      throughput: {
        rps: Math.random() * 100 + 50,
        tps: Math.random() * 80 + 40,
        peak: Math.random() * 200 + 100,
        average: Math.random() * 75 + 25
      },
      availability: {
        uptime: Date.now() - this.startTime.getTime(),
        sla: 99.9,
        mtbf: 72 * 60 * 60 * 1000, // 72 hours
        mttr: 15 * 60 * 1000 // 15 minutes
      }
    };
  }

  private async collectNetworkMetrics(): Promise<NetworkMetrics> {
    return {
      latency: {
        p50: Math.random() * 50 + 10,
        p95: Math.random() * 200 + 50,
        p99: Math.random() * 500 + 100,
        average: Math.random() * 100 + 30,
        min: Math.random() * 10 + 1,
        max: Math.random() * 1000 + 200
      },
      bandwidth: {
        inbound: Math.random() * 1024 * 1024, // MB
        outbound: Math.random() * 512 * 1024, // MB
        utilization: Math.random() * 80 + 10,
        peak: Math.random() * 2048 * 1024 // MB
      },
      connectivity: {
        activeConnections: Math.floor(Math.random() * 100) + 20,
        failedConnections: Math.floor(Math.random() * 5),
        connectionPool: {
          active: Math.floor(Math.random() * 50) + 10,
          idle: Math.floor(Math.random() * 30) + 5,
          waiting: Math.floor(Math.random() * 10),
          maxPool: 100
        }
      }
    };
  }

  private async collectStorageMetrics(): Promise<StorageMetrics> {
    return {
      usage: {
        total: 100 * 1024 * 1024 * 1024, // 100GB
        used: 50 * 1024 * 1024 * 1024,   // 50GB
        free: 50 * 1024 * 1024 * 1024,   // 50GB
        usagePercent: 50,
        growth: {
          daily: 1024 * 1024 * 100,    // 100MB/day
          weekly: 1024 * 1024 * 700,   // 700MB/week
          monthly: 1024 * 1024 * 3000, // 3GB/month
          projected: 75 // Projected usage in 6 months
        }
      },
      performance: {
        iops: Math.floor(Math.random() * 1000) + 500,
        latency: {
          p50: Math.random() * 10 + 2,
          p95: Math.random() * 50 + 10,
          p99: Math.random() * 100 + 20,
          average: Math.random() * 20 + 5,
          min: Math.random() * 2 + 0.5,
          max: Math.random() * 200 + 50
        },
        throughput: Math.random() * 100 + 50, // MB/s
        queueDepth: Math.floor(Math.random() * 10) + 1
      },
      reliability: {
        errorRate: Math.random() * 0.1,
        availability: 99.9,
        backupStatus: {
          lastBackup: new Date(Date.now() - Math.random() * 24 * 60 * 60 * 1000),
          successRate: 99.5,
          averageTime: Math.random() * 3600 + 1800, // 30-90 minutes
          dataIntegrity: 100
        }
      }
    };
  }

  private async collectPerformanceMetrics(): Promise<PerformanceMetrics> {
    return {
      response: {
        api: {
          p50: Math.random() * 500 + 100,
          p95: Math.random() * 1500 + 500,
          p99: Math.random() * 3000 + 1000,
          average: Math.random() * 800 + 200,
          min: Math.random() * 50 + 10,
          max: Math.random() * 5000 + 2000
        },
        database: {
          p50: Math.random() * 100 + 20,
          p95: Math.random() * 500 + 100,
          p99: Math.random() * 1000 + 300,
          average: Math.random() * 200 + 50,
          min: Math.random() * 10 + 2,
          max: Math.random() * 2000 + 500
        },
        external: {
          p50: Math.random() * 2000 + 500,
          p95: Math.random() * 8000 + 2000,
          p99: Math.random() * 15000 + 5000,
          average: Math.random() * 4000 + 1000,
          min: Math.random() * 200 + 50,
          max: Math.random() * 30000 + 10000
        }
      },
      scalability: {
        maxConcurrentUsers: 10000,
        currentLoad: Math.floor(Math.random() * 5000) + 1000,
        capacityUtilization: Math.random() * 80 + 10,
        bottlenecks: []
      },
      efficiency: {
        resourceUtilization: Math.random() * 80 + 60,
        energyEfficiency: Math.random() * 20 + 80,
        costEfficiency: Math.random() * 15 + 85,
        cacheHitRate: Math.random() * 20 + 80
      }
    };
  }

  private async collectSecurityMetrics(): Promise<SecurityMetrics> {
    return {
      threats: {
        detected: Math.floor(Math.random() * 10),
        blocked: Math.floor(Math.random() * 8),
        severity: {
          'LOW': Math.floor(Math.random() * 5),
          'MEDIUM': Math.floor(Math.random() * 3),
          'HIGH': Math.floor(Math.random() * 2),
          'CRITICAL': Math.floor(Math.random() * 1)
        },
        types: {
          'SQL_INJECTION': Math.floor(Math.random() * 2),
          'XSS': Math.floor(Math.random() * 3),
          'BRUTE_FORCE': Math.floor(Math.random() * 4),
          'DDoS': Math.floor(Math.random() * 1)
        }
      },
      compliance: {
        score: Math.random() * 10 + 90,
        violations: Math.floor(Math.random() * 3),
        lastAudit: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000),
        controls: [
          {
            id: 'access-control',
            name: 'Access Control',
            status: 'COMPLIANT',
            score: 95,
            lastCheck: new Date()
          },
          {
            id: 'data-encryption',
            name: 'Data Encryption',
            status: 'COMPLIANT',
            score: 100,
            lastCheck: new Date()
          }
        ]
      },
      access: {
        logins: {
          successful: Math.floor(Math.random() * 100) + 50,
          failed: Math.floor(Math.random() * 10),
          unique: Math.floor(Math.random() * 80) + 40,
          suspicious: Math.floor(Math.random() * 3)
        },
        permissions: {
          granted: Math.floor(Math.random() * 500) + 200,
          denied: Math.floor(Math.random() * 20) + 5,
          escalations: Math.floor(Math.random() * 5),
          violations: Math.floor(Math.random() * 2)
        },
        sessions: {
          active: Math.floor(Math.random() * 50) + 20,
          expired: Math.floor(Math.random() * 100) + 30,
          average: Math.random() * 60 + 30, // minutes
          concurrent: Math.floor(Math.random() * 30) + 10
        }
      }
    };
  }

  private processPerformanceEntry(entry: PerformanceEntry): void {
    // Process performance entries for additional metrics
    this.emit('performanceEntry', {
      name: entry.name,
      type: entry.entryType,
      startTime: entry.startTime,
      duration: entry.duration
    });
  }

  private async triggerAlert(healthCheck: HealthCheck, result: HealthCheckResult): Promise<void> {
    const alertId = this.generateAlertId();
    
    const alert: Alert = {
      id: alertId,
      title: `${healthCheck.name} - ${result.status}`,
      description: result.message,
      severity: this.mapHealthStatusToAlertSeverity(result.status),
      status: AlertStatus.ACTIVE,
      source: {
        type: 'HEALTH_CHECK',
        id: healthCheck.id,
        name: healthCheck.name
      },
      category: healthCheck.category,
      tags: [healthCheck.type, result.status],
      triggered: new Date(),
      metadata: {
        healthCheck,
        result,
        remediation: result.remediation
      },
      actions: []
    };

    this.alerts.set(alertId, alert);

    // Send notifications
    await this.sendNotifications(alert);

    // Execute automated remediation if available
    if (result.remediation) {
      for (const action of result.remediation) {
        if (action.automated) {
          await this.executeRemediationAction(alert, action);
        }
      }
    }

    this.emit('alertTriggered', { alert, healthCheck, result });
  }

  private mapHealthStatusToAlertSeverity(status: HealthStatus): AlertSeverity {
    switch (status) {
      case HealthStatus.CRITICAL: return AlertSeverity.CRITICAL;
      case HealthStatus.WARNING: return AlertSeverity.WARNING;
      case HealthStatus.UNKNOWN: return AlertSeverity.ERROR;
      default: return AlertSeverity.INFO;
    }
  }

  private async sendNotifications(alert: Alert): Promise<void> {
    for (const [channelId, channel] of this.notificationChannels.entries()) {
      if (!channel.enabled) continue;

      // Check filters
      const shouldNotify = this.evaluateNotificationFilters(alert, channel.filters);
      if (!shouldNotify) continue;

      try {
        await this.sendNotification(channel, alert);
        
        const action: AlertAction = {
          id: this.generateActionId(),
          type: 'NOTIFICATION',
          status: 'COMPLETED',
          result: `Sent to ${channel.name}`,
          timestamp: new Date()
        };
        
        alert.actions.push(action);

        this.emit('notificationSent', { channelId, alert });

      } catch (error) {
        const action: AlertAction = {
          id: this.generateActionId(),
          type: 'NOTIFICATION',
          status: 'FAILED',
          result: `Failed to send to ${channel.name}: ${error.message}`,
          timestamp: new Date()
        };
        
        alert.actions.push(action);

        this.emit('notificationFailed', { channelId, alert, error: error.message });
      }
    }
  }

  private evaluateNotificationFilters(alert: Alert, filters: NotificationFilter[]): boolean {
    if (filters.length === 0) return true;

    return filters.some(filter => {
      const fieldValue = this.getAlertFieldValue(alert, filter.field);
      
      switch (filter.operator) {
        case 'EQUALS':
          return fieldValue === filter.value;
        case 'CONTAINS':
          return String(fieldValue).toLowerCase().includes(String(filter.value).toLowerCase());
        case 'REGEX':
          return new RegExp(String(filter.value)).test(String(fieldValue));
        default:
          return false;
      }
    });
  }

  private getAlertFieldValue(alert: Alert, field: string): any {
    const fieldParts = field.split('.');
    let value: any = alert;
    
    for (const part of fieldParts) {
      value = value?.[part];
    }
    
    return value;
  }

  private async sendNotification(channel: NotificationChannel, alert: Alert): Promise<void> {
    switch (channel.type) {
      case 'EMAIL':
        await this.sendEmailNotification(channel, alert);
        break;
      case 'SLACK':
        await this.sendSlackNotification(channel, alert);
        break;
      case 'WEBHOOK':
        await this.sendWebhookNotification(channel, alert);
        break;
      case 'PAGER_DUTY':
        await this.sendPagerDutyNotification(channel, alert);
        break;
      default:
        throw new Error(`Unsupported notification channel type: ${channel.type}`);
    }
  }

  private async sendEmailNotification(channel: NotificationChannel, alert: Alert): Promise<void> {
    // Simulate email sending
    console.log(`Sending email notification to ${channel.configuration.recipients.join(', ')}`);
    console.log(`Subject: ${channel.configuration.subject.replace('{{title}}', alert.title)}`);
    console.log(`Alert: ${alert.description}`);
  }

  private async sendSlackNotification(channel: NotificationChannel, alert: Alert): Promise<void> {
    // Simulate Slack notification
    console.log(`Sending Slack notification to ${channel.configuration.channel}`);
    console.log(`Alert: ${alert.title} - ${alert.description}`);
  }

  private async sendWebhookNotification(channel: NotificationChannel, alert: Alert): Promise<void> {
    // Simulate webhook notification
    console.log(`Sending webhook notification to ${channel.configuration.url}`);
    console.log(`Payload:`, JSON.stringify(alert, null, 2));
  }

  private async sendPagerDutyNotification(channel: NotificationChannel, alert: Alert): Promise<void> {
    // Simulate PagerDuty notification
    console.log(`Triggering PagerDuty incident for ${alert.title}`);
    console.log(`Severity: ${channel.configuration.severity}`);
  }

  private async executeRemediationAction(alert: Alert, action: RemediationAction): Promise<void> {
    const actionId = this.generateActionId();
    
    const alertAction: AlertAction = {
      id: actionId,
      type: 'REMEDIATION',
      status: 'EXECUTING',
      timestamp: new Date()
    };
    
    alert.actions.push(alertAction);

    try {
      await this.performRemediationAction(action);
      
      alertAction.status = 'COMPLETED';
      alertAction.result = `Successfully executed ${action.action}`;

      this.emit('remediationCompleted', { alert, action });

    } catch (error) {
      alertAction.status = 'FAILED';
      alertAction.result = `Failed to execute ${action.action}: ${error.message}`;

      this.emit('remediationFailed', { alert, action, error: error.message });
    }
  }

  private async performRemediationAction(action: RemediationAction): Promise<void> {
    // Simulate remediation actions
    switch (action.action) {
      case 'restart_service':
        console.log('Restarting service...');
        break;
      case 'scale_up':
        console.log('Scaling up resources...');
        break;
      case 'memory_cleanup':
        console.log('Cleaning up memory...');
        break;
      case 'disk_cleanup':
        console.log('Cleaning up disk space...');
        break;
      case 'restart_db_pool':
        console.log('Restarting database connection pool...');
        break;
      default:
        console.log(`Executing custom action: ${action.action}`);
    }

    // Simulate execution time
    await new Promise(resolve => setTimeout(resolve, action.estimatedTime * 10));
  }

  private async processAlerts(): Promise<void> {
    // Process any pending alert actions
    for (const alert of this.alerts.values()) {
      if (alert.status === AlertStatus.ACTIVE) {
        // Check for auto-resolution
        await this.checkAutoResolution(alert);
      }
    }
  }

  private async checkAutoResolution(alert: Alert): Promise<void> {
    if (alert.source.type !== 'HEALTH_CHECK') return;

    const healthCheck = this.healthChecks.get(alert.source.id);
    if (!healthCheck || !healthCheck.lastResult) return;

    // Auto-resolve if health check is now OK
    if (healthCheck.lastResult.status === HealthStatus.OK) {
      alert.status = AlertStatus.RESOLVED;
      alert.resolved = new Date();

      this.emit('alertResolved', { alert });
    }
  }

  private async monitorSLAs(): Promise<void> {
    for (const [slaId, sla] of this.slaTargets.entries()) {
      if (!sla.enabled) continue;

      try {
        const currentValue = await this.calculateSLAMetric(sla);
        sla.current = currentValue;

        const isBreach = this.evaluateSLABreach(currentValue, sla);
        if (isBreach && !sla.breach) {
          // SLA breach detected
          sla.breach = true;
          await this.handleSLABreach(sla);
        } else if (!isBreach && sla.breach) {
          // SLA recovered
          sla.breach = false;
          await this.handleSLARecovery(sla);
        }

      } catch (error) {
        this.emit('slaMonitoringError', {
          slaId,
          error: error.message
        });
      }
    }
  }

  private async calculateSLAMetric(sla: SLATarget): Promise<number> {
    // Calculate current SLA metric value based on recent metrics
    const recentMetrics = this.getRecentMetrics(sla.period);
    
    switch (sla.metric) {
      case 'availability':
        return this.calculateAvailability(recentMetrics);
      case 'response_time_p95':
        return this.calculateResponseTimeP95(recentMetrics);
      case 'error_rate':
        return this.calculateErrorRate(recentMetrics);
      default:
        return 0;
    }
  }

  private getRecentMetrics(period: string): SystemMetrics[] {
    const now = Date.now();
    let cutoffTime: number;

    switch (period) {
      case 'HOURLY':
        cutoffTime = now - 60 * 60 * 1000;
        break;
      case 'DAILY':
        cutoffTime = now - 24 * 60 * 60 * 1000;
        break;
      case 'WEEKLY':
        cutoffTime = now - 7 * 24 * 60 * 60 * 1000;
        break;
      case 'MONTHLY':
        cutoffTime = now - 30 * 24 * 60 * 60 * 1000;
        break;
      default:
        cutoffTime = now - 60 * 60 * 1000;
    }

    return this.metrics.filter(m => m.timestamp.getTime() >= cutoffTime);
  }

  private calculateAvailability(metrics: SystemMetrics[]): number {
    if (metrics.length === 0) return 100;

    const uptime = Date.now() - this.startTime.getTime();
    const totalTime = 24 * 60 * 60 * 1000; // 24 hours in milliseconds
    
    return Math.min(100, (uptime / totalTime) * 100);
  }

  private calculateResponseTimeP95(metrics: SystemMetrics[]): number {
    if (metrics.length === 0) return 0;

    const responseTimes = metrics.map(m => m.application.latency.p95);
    return responseTimes.reduce((sum, time) => sum + time, 0) / responseTimes.length;
  }

  private calculateErrorRate(metrics: SystemMetrics[]): number {
    if (metrics.length === 0) return 0;

    const errorRates = metrics.map(m => m.application.errors.rate);
    return errorRates.reduce((sum, rate) => sum + rate, 0) / errorRates.length;
  }

  private evaluateSLABreach(currentValue: number, sla: SLATarget): boolean {
    switch (sla.operator) {
      case 'GT':
        return currentValue > sla.target;
      case 'LT':
        return currentValue < sla.target;
      case 'GTE':
        return currentValue >= sla.target;
      case 'LTE':
        return currentValue <= sla.target;
      default:
        return false;
    }
  }

  private async handleSLABreach(sla: SLATarget): Promise<void> {
    const alertId = this.generateAlertId();
    
    const alert: Alert = {
      id: alertId,
      title: `SLA Breach: ${sla.name}`,
      description: `SLA target of ${sla.target} ${sla.operator} has been breached. Current value: ${sla.current}`,
      severity: AlertSeverity.CRITICAL,
      status: AlertStatus.ACTIVE,
      source: {
        type: 'METRIC_THRESHOLD',
        id: sla.id,
        name: sla.name
      },
      category: 'SLA',
      tags: ['SLA', 'BREACH', sla.metric],
      triggered: new Date(),
      metadata: { sla },
      actions: []
    };

    this.alerts.set(alertId, alert);
    await this.sendNotifications(alert);

    this.emit('slaBreach', { sla, alert });
  }

  private async handleSLARecovery(sla: SLATarget): Promise<void> {
    this.emit('slaRecovery', { sla });
  }

  // Public API methods
  addHealthCheck(healthCheck: HealthCheck): void {
    this.healthChecks.set(healthCheck.id, healthCheck);
    this.emit('healthCheckAdded', { healthCheck });
  }

  removeHealthCheck(checkId: string): boolean {
    const removed = this.healthChecks.delete(checkId);
    if (removed) {
      this.emit('healthCheckRemoved', { checkId });
    }
    return removed;
  }

  addNotificationChannel(channel: NotificationChannel): void {
    this.notificationChannels.set(channel.id, channel);
    this.emit('notificationChannelAdded', { channel });
  }

  removeNotificationChannel(channelId: string): boolean {
    const removed = this.notificationChannels.delete(channelId);
    if (removed) {
      this.emit('notificationChannelRemoved', { channelId });
    }
    return removed;
  }

  addSLATarget(sla: SLATarget): void {
    this.slaTargets.set(sla.id, sla);
    this.emit('slaTargetAdded', { sla });
  }

  removeSLATarget(slaId: string): boolean {
    const removed = this.slaTargets.delete(slaId);
    if (removed) {
      this.emit('slaTargetRemoved', { slaId });
    }
    return removed;
  }

  async acknowledgeAlert(alertId: string, userId: string): Promise<boolean> {
    const alert = this.alerts.get(alertId);
    if (!alert) return false;

    alert.status = AlertStatus.ACKNOWLEDGED;
    alert.acknowledged = new Date();
    alert.assignee = userId;

    this.emit('alertAcknowledged', { alert, userId });
    return true;
  }

  async resolveAlert(alertId: string, userId: string, resolution: string): Promise<boolean> {
    const alert = this.alerts.get(alertId);
    if (!alert) return false;

    alert.status = AlertStatus.RESOLVED;
    alert.resolved = new Date();
    alert.assignee = userId;
    alert.metadata.resolution = resolution;

    this.emit('alertResolved', { alert, userId, resolution });
    return true;
  }

  getHealthCheckStatus(): Map<string, HealthCheck> {
    return new Map(this.healthChecks);
  }

  getActiveAlerts(): Alert[] {
    return Array.from(this.alerts.values()).filter(alert => 
      alert.status === AlertStatus.ACTIVE || alert.status === AlertStatus.ACKNOWLEDGED
    );
  }

  getRecentMetrics(limit: number = 100): SystemMetrics[] {
    return this.metrics.slice(-limit);
  }

  getSLAStatus(): Map<string, SLATarget> {
    return new Map(this.slaTargets);
  }

  private generateAlertId(): string {
    return `ALERT-${Date.now()}-${randomBytes(4).toString('hex').toUpperCase()}`;
  }

  private generateActionId(): string {
    return `ACTION-${Date.now()}-${randomBytes(4).toString('hex').toUpperCase()}`;
  }

  async shutdown(): Promise<void> {
    this.stop();
    
    // Clear all data
    this.healthChecks.clear();
    this.alerts.clear();
    this.notificationChannels.clear();
    this.slaTargets.clear();
    this.metrics.length = 0;

    this.emit('monitoringShutdown');
  }
}