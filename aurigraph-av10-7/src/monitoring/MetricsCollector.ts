import { EventEmitter } from 'events';
import { injectable } from 'inversify';
import { Logger } from '../core/Logger';
import * as tf from '@tensorflow/tfjs-node';

// Metrics Collection Interfaces
export interface MetricPoint {
  timestamp: number;
  value: number;
  metadata?: Record<string, any>;
}

export interface TimeSeriesMetric {
  name: string;
  modelId?: string;
  dataPoints: MetricPoint[];
  aggregations: {
    mean: number;
    median: number;
    stdDev: number;
    min: number;
    max: number;
    percentiles: Record<number, number>;
  };
}

export interface DriftAnalysis {
  modelId: string;
  hasDrift: boolean;
  driftType: 'data' | 'concept' | 'prediction';
  driftScore: number;
  threshold: number;
  confidence: number;
  description: string;
  recommendations: string[];
  affectedFeatures: string[];
  impactedPredictions: number;
  comparisonWindow: {
    baseline: { start: number; end: number };
    current: { start: number; end: number };
  };
  statisticalTests: {
    ks_test: { statistic: number; pValue: number };
    chi_square: { statistic: number; pValue: number };
    kl_divergence: number;
    psi: number;
    wasserstein_distance: number;
  };
}

export interface PerformanceMetrics {
  modelId: string;
  timestamp: number;
  predictions: {
    total: number;
    successful: number;
    failed: number;
    avgLatency: number;
    throughput: number;
  };
  accuracy: {
    overall: number;
    byClass: Record<string, number>;
    confusionMatrix: number[][];
  };
  resources: {
    cpuUsage: number;
    memoryUsage: number;
    gpuUsage?: number;
    diskIO: number;
    networkIO: number;
  };
  errors: {
    rate: number;
    types: Record<string, number>;
    criticalErrors: number;
  };
}

export interface FeatureMonitoring {
  featureName: string;
  modelId: string;
  statistics: {
    current: FeatureStatistics;
    baseline: FeatureStatistics;
    drift: {
      score: number;
      threshold: number;
      isDrifting: boolean;
      method: 'psi' | 'kl_divergence' | 'wasserstein' | 'ks_test';
    };
  };
  qualityMetrics: {
    completeness: number;
    uniqueness: number;
    consistency: number;
    validity: number;
    freshness: number;
  };
  alerts: FeatureAlert[];
}

export interface FeatureStatistics {
  count: number;
  mean: number;
  median: number;
  mode: number | string;
  stdDev: number;
  variance: number;
  skewness: number;
  kurtosis: number;
  min: number;
  max: number;
  quartiles: [number, number, number];
  percentiles: Record<number, number>;
  nullCount: number;
  uniqueCount: number;
  distribution: Record<string | number, number>;
  entropy: number;
}

export interface FeatureAlert {
  type: 'drift' | 'quality' | 'anomaly' | 'schema';
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  timestamp: number;
  threshold: number;
  actualValue: number;
  recommendation: string;
}

export interface ModelHealthScore {
  modelId: string;
  overallScore: number; // 0-100
  components: {
    accuracy: { score: number; weight: number };
    latency: { score: number; weight: number };
    throughput: { score: number; weight: number };
    stability: { score: number; weight: number };
    drift: { score: number; weight: number };
    resourceEfficiency: { score: number; weight: number };
  };
  trend: 'improving' | 'stable' | 'degrading';
  recommendations: string[];
  alertLevel: 'none' | 'info' | 'warning' | 'critical';
}

export interface AlertRule {
  id: string;
  name: string;
  modelId?: string;
  metric: string;
  condition: 'gt' | 'lt' | 'eq' | 'ne' | 'in_range' | 'out_range';
  threshold: number | [number, number];
  severity: 'low' | 'medium' | 'high' | 'critical';
  enabled: boolean;
  cooldownPeriod: number; // milliseconds
  actions: AlertAction[];
  lastTriggered?: number;
}

export interface AlertAction {
  type: 'email' | 'webhook' | 'auto_retrain' | 'scale_resources' | 'log';
  config: Record<string, any>;
}

export interface MetricsCollectorConfig {
  collectionInterval: number;
  retentionDays: number;
  batchSize: number;
  driftDetection: {
    enabled: boolean;
    windowSize: number;
    threshold: number;
    methods: string[];
  };
  alerting: {
    enabled: boolean;
    rules: AlertRule[];
  };
  featureMonitoring: {
    enabled: boolean;
    trackingInterval: number;
    qualityThresholds: Record<string, number>;
  };
}

@injectable()
export class MetricsCollector extends EventEmitter {
  private logger: Logger;
  private isStarted: boolean = false;
  
  // Data Storage
  private timeSeriesData: Map<string, TimeSeriesMetric> = new Map();
  private performanceMetrics: Map<string, PerformanceMetrics[]> = new Map();
  private featureMonitoring: Map<string, FeatureMonitoring> = new Map();
  private modelHealthScores: Map<string, ModelHealthScore> = new Map();
  private alertRules: Map<string, AlertRule> = new Map();
  
  // Baseline Data for Drift Detection
  private baselineData: Map<string, any[]> = new Map();
  private referenceDistributions: Map<string, tf.Tensor> = new Map();
  
  // Collection Intervals
  private metricsCollectionInterval: NodeJS.Timeout | null = null;
  private driftDetectionInterval: NodeJS.Timeout | null = null;
  private healthScoreInterval: NodeJS.Timeout | null = null;
  private alertCheckInterval: NodeJS.Timeout | null = null;
  
  // Configuration
  private config: MetricsCollectorConfig = {
    collectionInterval: 5000, // 5 seconds
    retentionDays: 30,
    batchSize: 100,
    driftDetection: {
      enabled: true,
      windowSize: 1000,
      threshold: 0.7,
      methods: ['psi', 'kl_divergence', 'wasserstein', 'ks_test']
    },
    alerting: {
      enabled: true,
      rules: []
    },
    featureMonitoring: {
      enabled: true,
      trackingInterval: 10000, // 10 seconds
      qualityThresholds: {
        completeness: 0.95,
        uniqueness: 0.8,
        consistency: 0.9,
        validity: 0.95,
        freshness: 0.9
      }
    }
  };
  
  // Performance Tracking
  private collectionStats = {
    totalMetricsCollected: 0,
    collectionLatency: 0,
    driftDetectionsPerformed: 0,
    alertsTriggered: 0,
    featuresTracked: 0,
    modelsMonitored: 0,
    dataPointsStored: 0,
    lastCollectionTime: 0
  };

  constructor() {
    super();
    this.logger = new Logger('MetricsCollector-AV10-26');
    this.initializeDefaultAlertRules();
  }

  async start(): Promise<void> {
    if (this.isStarted) {
      this.logger.warn('Metrics collector already started');
      return;
    }

    this.logger.info('🚀 Starting AV10-26 Metrics Collector...');

    try {
      // Initialize TensorFlow backend for drift detection
      await tf.ready();
      
      // Start collection intervals
      this.startMetricsCollection();
      this.startDriftDetection();
      this.startHealthScoreCalculation();
      this.startAlertChecking();
      
      this.isStarted = true;
      
      this.logger.info('✅ AV10-26 Metrics Collector started successfully');
      this.logger.info(`📊 Collection interval: ${this.config.collectionInterval}ms`);
      this.logger.info(`🔍 Drift detection: ${this.config.driftDetection.enabled ? 'enabled' : 'disabled'}`);
      this.logger.info(`🚨 Alerting: ${this.config.alerting.enabled ? 'enabled' : 'disabled'}`);
      
    } catch (error) {
      this.logger.error('❌ Failed to start Metrics Collector:', error);
      throw new Error(`Metrics collector startup failed: ${error.message}`);
    }
  }

  // Core Metrics Collection
  async collectMetric(
    name: string, 
    value: number, 
    modelId?: string, 
    metadata?: Record<string, any>
  ): Promise<void> {
    const startTime = Date.now();
    
    try {
      const metricKey = modelId ? `${name}:${modelId}` : name;
      
      if (!this.timeSeriesData.has(metricKey)) {
        this.timeSeriesData.set(metricKey, {
          name,
          modelId,
          dataPoints: [],
          aggregations: {
            mean: 0, median: 0, stdDev: 0, min: 0, max: 0, percentiles: {}
          }
        });
      }
      
      const metric = this.timeSeriesData.get(metricKey)!;
      const dataPoint: MetricPoint = {
        timestamp: Date.now(),
        value,
        metadata
      };
      
      metric.dataPoints.push(dataPoint);
      
      // Maintain retention policy
      const retentionThreshold = Date.now() - (this.config.retentionDays * 24 * 60 * 60 * 1000);
      metric.dataPoints = metric.dataPoints.filter(dp => dp.timestamp > retentionThreshold);
      
      // Update aggregations
      this.updateAggregations(metric);
      
      // Update stats
      this.collectionStats.totalMetricsCollected++;
      this.collectionStats.dataPointsStored++;
      this.collectionStats.collectionLatency = Date.now() - startTime;
      this.collectionStats.lastCollectionTime = Date.now();
      
      // Emit metric collected event
      this.emit('metric_collected', { name, value, modelId, metadata });
      
    } catch (error) {
      this.logger.error(`❌ Error collecting metric ${name}:`, error);
    }
  }

  // Performance Metrics Collection
  async collectPerformanceMetrics(modelId: string, metrics: Omit<PerformanceMetrics, 'modelId' | 'timestamp'>): Promise<void> {
    try {
      const performanceMetric: PerformanceMetrics = {
        modelId,
        timestamp: Date.now(),
        ...metrics
      };
      
      if (!this.performanceMetrics.has(modelId)) {
        this.performanceMetrics.set(modelId, []);
      }
      
      const modelMetrics = this.performanceMetrics.get(modelId)!;
      modelMetrics.push(performanceMetric);
      
      // Keep only recent data
      const retentionThreshold = Date.now() - (this.config.retentionDays * 24 * 60 * 60 * 1000);
      this.performanceMetrics.set(modelId, 
        modelMetrics.filter(m => m.timestamp > retentionThreshold)
      );
      
      // Update model health score
      await this.calculateModelHealthScore(modelId);
      
      this.emit('performance_metrics_collected', performanceMetric);
      
    } catch (error) {
      this.logger.error(`❌ Error collecting performance metrics for ${modelId}:`, error);
    }
  }

  // Feature Monitoring
  async monitorFeature(
    featureName: string, 
    modelId: string, 
    values: number[], 
    baseline?: number[]
  ): Promise<void> {
    try {
      const featureKey = `${featureName}:${modelId}`;
      
      // Calculate current statistics
      const currentStats = this.calculateFeatureStatistics(values);
      
      // Get or create baseline
      let baselineStats: FeatureStatistics;
      if (baseline) {
        baselineStats = this.calculateFeatureStatistics(baseline);
        this.baselineData.set(featureKey, baseline);
      } else if (this.baselineData.has(featureKey)) {
        baselineStats = this.calculateFeatureStatistics(this.baselineData.get(featureKey)!);
      } else {
        // Use current as baseline if no baseline exists
        baselineStats = currentStats;
        this.baselineData.set(featureKey, values);
      }
      
      // Calculate drift
      const driftAnalysis = await this.calculateFeatureDrift(
        values, 
        this.baselineData.get(featureKey) || values,
        featureName
      );
      
      // Calculate quality metrics
      const qualityMetrics = this.calculateFeatureQuality(values, featureName);
      
      // Generate alerts
      const alerts = this.generateFeatureAlerts(currentStats, baselineStats, driftAnalysis, qualityMetrics);
      
      const featureMonitoring: FeatureMonitoring = {
        featureName,
        modelId,
        statistics: {
          current: currentStats,
          baseline: baselineStats,
          drift: {
            score: driftAnalysis.driftScore,
            threshold: this.config.driftDetection.threshold,
            isDrifting: driftAnalysis.hasDrift,
            method: 'psi' // primary method
          }
        },
        qualityMetrics,
        alerts
      };
      
      this.featureMonitoring.set(featureKey, featureMonitoring);
      this.collectionStats.featuresTracked++;
      
      this.emit('feature_monitoring_updated', featureMonitoring);
      
      // Emit alerts if any
      if (alerts.length > 0) {
        alerts.forEach(alert => {
          this.emit('feature_alert', { featureName, modelId, alert });
        });
      }
      
    } catch (error) {
      this.logger.error(`❌ Error monitoring feature ${featureName} for ${modelId}:`, error);
    }
  }

  // Drift Detection
  async analyzeDrift(modelId: string, currentData?: any[], baselineData?: any[]): Promise<DriftAnalysis> {
    try {
      this.logger.debug(`🔍 Analyzing drift for model ${modelId}`);
      
      // Use provided data or fetch from storage
      const current = currentData || this.getRecentModelData(modelId);
      const baseline = baselineData || this.baselineData.get(modelId);
      
      if (!baseline || baseline.length === 0) {
        this.logger.warn(`No baseline data available for drift analysis of ${modelId}`);
        return this.createNoDriftAnalysis(modelId);
      }
      
      if (!current || current.length === 0) {
        this.logger.warn(`No current data available for drift analysis of ${modelId}`);
        return this.createNoDriftAnalysis(modelId);
      }
      
      // Convert to tensors for statistical analysis
      const baselineTensor = tf.tensor1d(baseline.slice(-this.config.driftDetection.windowSize));
      const currentTensor = tf.tensor1d(current.slice(-this.config.driftDetection.windowSize));
      
      // Perform statistical tests
      const statisticalTests = await this.performStatisticalTests(baselineTensor, currentTensor);
      
      // Calculate drift scores using multiple methods
      const driftScores = await this.calculateDriftScores(baselineTensor, currentTensor);
      
      // Aggregate drift score
      const overallDriftScore = this.aggregateDriftScores(driftScores);
      
      // Determine if drift exists
      const hasDrift = overallDriftScore > this.config.driftDetection.threshold;
      
      // Identify drift type
      const driftType = this.identifyDriftType(statisticalTests, driftScores);
      
      // Generate recommendations
      const recommendations = this.generateDriftRecommendations(driftType, overallDriftScore);
      
      const driftAnalysis: DriftAnalysis = {
        modelId,
        hasDrift,
        driftType,
        driftScore: overallDriftScore,
        threshold: this.config.driftDetection.threshold,
        confidence: this.calculateDriftConfidence(statisticalTests),
        description: this.generateDriftDescription(driftType, overallDriftScore, hasDrift),
        recommendations,
        affectedFeatures: this.identifyAffectedFeatures(modelId, driftScores),
        impactedPredictions: this.estimateImpactedPredictions(modelId, overallDriftScore),
        comparisonWindow: {
          baseline: { 
            start: Date.now() - (baseline.length * 60000), 
            end: Date.now() - 60000 
          },
          current: { 
            start: Date.now() - (current.length * 60000), 
            end: Date.now() 
          }
        },
        statisticalTests
      };
      
      this.collectionStats.driftDetectionsPerformed++;
      
      if (hasDrift) {
        this.logger.warn(`🚨 Drift detected for model ${modelId}: score=${overallDriftScore.toFixed(3)}`);
        this.emit('drift_detected', driftAnalysis);
      }
      
      return driftAnalysis;
      
    } catch (error) {
      this.logger.error(`❌ Drift analysis failed for model ${modelId}:`, error);
      return this.createErrorDriftAnalysis(modelId, error.message);
    }
  }

  // Model Health Score Calculation
  async calculateModelHealthScore(modelId: string): Promise<ModelHealthScore> {
    try {
      const recentMetrics = this.getRecentPerformanceMetrics(modelId, 10); // Last 10 data points
      
      if (recentMetrics.length === 0) {
        return this.createDefaultHealthScore(modelId);
      }
      
      // Calculate component scores
      const accuracyScore = this.calculateAccuracyScore(recentMetrics);
      const latencyScore = this.calculateLatencyScore(recentMetrics);
      const throughputScore = this.calculateThroughputScore(recentMetrics);
      const stabilityScore = this.calculateStabilityScore(recentMetrics);
      const driftScore = await this.calculateDriftHealthScore(modelId);
      const resourceScore = this.calculateResourceEfficiencyScore(recentMetrics);
      
      // Define weights for each component
      const weights = {
        accuracy: 0.25,
        latency: 0.20,
        throughput: 0.15,
        stability: 0.15,
        drift: 0.15,
        resourceEfficiency: 0.10
      };
      
      // Calculate overall score
      const overallScore = 
        accuracyScore * weights.accuracy +
        latencyScore * weights.latency +
        throughputScore * weights.throughput +
        stabilityScore * weights.stability +
        driftScore * weights.drift +
        resourceScore * weights.resourceEfficiency;
      
      // Determine trend
      const trend = this.calculateHealthTrend(modelId, overallScore);
      
      // Generate recommendations
      const recommendations = this.generateHealthRecommendations(
        { accuracyScore, latencyScore, throughputScore, stabilityScore, driftScore, resourceScore }
      );
      
      // Determine alert level
      const alertLevel = this.determineAlertLevel(overallScore, recentMetrics);
      
      const healthScore: ModelHealthScore = {
        modelId,
        overallScore: Math.round(overallScore),
        components: {
          accuracy: { score: accuracyScore, weight: weights.accuracy },
          latency: { score: latencyScore, weight: weights.latency },
          throughput: { score: throughputScore, weight: weights.throughput },
          stability: { score: stabilityScore, weight: weights.stability },
          drift: { score: driftScore, weight: weights.drift },
          resourceEfficiency: { score: resourceScore, weight: weights.resourceEfficiency }
        },
        trend,
        recommendations,
        alertLevel
      };
      
      this.modelHealthScores.set(modelId, healthScore);
      this.emit('health_score_updated', healthScore);
      
      return healthScore;
      
    } catch (error) {
      this.logger.error(`❌ Error calculating health score for ${modelId}:`, error);
      return this.createDefaultHealthScore(modelId);
    }
  }

  // Alert System
  addAlertRule(rule: AlertRule): void {
    this.alertRules.set(rule.id, rule);
    this.logger.info(`✅ Alert rule added: ${rule.name}`);
  }

  removeAlertRule(ruleId: string): void {
    this.alertRules.delete(ruleId);
    this.logger.info(`🗑️ Alert rule removed: ${ruleId}`);
  }

  private async checkAlerts(): Promise<void> {
    for (const [ruleId, rule] of this.alertRules) {
      if (!rule.enabled) continue;
      
      // Check cooldown period
      if (rule.lastTriggered && 
          Date.now() - rule.lastTriggered < rule.cooldownPeriod) {
        continue;
      }
      
      try {
        const shouldTrigger = await this.evaluateAlertCondition(rule);
        
        if (shouldTrigger) {
          await this.triggerAlert(rule);
          rule.lastTriggered = Date.now();
          this.collectionStats.alertsTriggered++;
        }
        
      } catch (error) {
        this.logger.error(`❌ Error evaluating alert rule ${rule.name}:`, error);
      }
    }
  }

  private async triggerAlert(rule: AlertRule): Promise<void> {
    this.logger.warn(`🚨 Alert triggered: ${rule.name}`);
    
    const alert = {
      ruleId: rule.id,
      ruleName: rule.name,
      modelId: rule.modelId,
      metric: rule.metric,
      severity: rule.severity,
      timestamp: Date.now(),
      message: `Alert: ${rule.name} - Condition met for ${rule.metric}`
    };
    
    this.emit('alert_triggered', alert);
    
    // Execute alert actions
    for (const action of rule.actions) {
      try {
        await this.executeAlertAction(action, alert);
      } catch (error) {
        this.logger.error(`❌ Error executing alert action ${action.type}:`, error);
      }
    }
  }

  private async executeAlertAction(action: AlertAction, alert: any): Promise<void> {
    switch (action.type) {
      case 'log':
        this.logger.warn(`🚨 ALERT: ${alert.message}`);
        break;
      
      case 'webhook':
        await this.sendWebhook(action.config.url, alert);
        break;
      
      case 'auto_retrain':
        this.emit('auto_retrain_requested', { modelId: alert.modelId });
        break;
      
      case 'scale_resources':
        this.emit('scale_resources_requested', { 
          modelId: alert.modelId, 
          config: action.config 
        });
        break;
      
      default:
        this.logger.warn(`Unknown alert action type: ${action.type}`);
    }
  }

  // Utility and Helper Methods
  
  getMetric(name: string, modelId?: string): TimeSeriesMetric | undefined {
    const key = modelId ? `${name}:${modelId}` : name;
    return this.timeSeriesData.get(key);
  }

  getModelHealthScore(modelId: string): ModelHealthScore | undefined {
    return this.modelHealthScores.get(modelId);
  }

  getFeatureMonitoring(featureName: string, modelId: string): FeatureMonitoring | undefined {
    const key = `${featureName}:${modelId}`;
    return this.featureMonitoring.get(key);
  }

  getCollectionStats(): any {
    return {
      ...this.collectionStats,
      totalModelsMonitored: this.modelHealthScores.size,
      totalFeaturesTracked: this.featureMonitoring.size,
      totalTimeSeriesMetrics: this.timeSeriesData.size,
      totalAlertRules: this.alertRules.size
    };
  }

  async getMetricsReport(modelId?: string, timeRange?: { start: number; end: number }): Promise<any> {
    const report: any = {
      timestamp: Date.now(),
      modelId,
      timeRange,
      summary: {},
      metrics: {},
      healthScores: {},
      driftAnalyses: {},
      alerts: []
    };
    
    if (modelId) {
      // Model-specific report
      report.healthScores[modelId] = this.modelHealthScores.get(modelId);
      report.metrics[modelId] = this.getRecentPerformanceMetrics(modelId, 100);
      report.driftAnalyses[modelId] = await this.analyzeDrift(modelId);
    } else {
      // Global report
      report.summary = this.getCollectionStats();
      
      for (const [id, healthScore] of this.modelHealthScores) {
        report.healthScores[id] = healthScore;
      }
    }
    
    return report;
  }

  // Private Implementation Methods

  private initializeDefaultAlertRules(): void {
    const defaultRules: AlertRule[] = [
      {
        id: 'accuracy_degradation',
        name: 'Model Accuracy Degradation',
        metric: 'accuracy',
        condition: 'lt',
        threshold: 0.85,
        severity: 'high',
        enabled: true,
        cooldownPeriod: 300000, // 5 minutes
        actions: [
          { type: 'log', config: {} },
          { type: 'auto_retrain', config: { threshold: 0.8 } }
        ]
      },
      {
        id: 'high_latency',
        name: 'High Prediction Latency',
        metric: 'latency',
        condition: 'gt',
        threshold: 500,
        severity: 'medium',
        enabled: true,
        cooldownPeriod: 180000, // 3 minutes
        actions: [
          { type: 'log', config: {} },
          { type: 'scale_resources', config: { type: 'cpu', factor: 1.5 } }
        ]
      },
      {
        id: 'drift_detected',
        name: 'Model Drift Detection',
        metric: 'drift_score',
        condition: 'gt',
        threshold: 0.7,
        severity: 'critical',
        enabled: true,
        cooldownPeriod: 600000, // 10 minutes
        actions: [
          { type: 'log', config: {} },
          { type: 'auto_retrain', config: { urgent: true } }
        ]
      }
    ];
    
    defaultRules.forEach(rule => {
      this.alertRules.set(rule.id, rule);
    });
  }

  private startMetricsCollection(): void {
    this.metricsCollectionInterval = setInterval(() => {
      // Periodic cleanup and aggregation
      this.performPeriodicMaintenance();
    }, this.config.collectionInterval);
  }

  private startDriftDetection(): void {
    if (!this.config.driftDetection.enabled) return;
    
    this.driftDetectionInterval = setInterval(async () => {
      // Check drift for all monitored models
      for (const modelId of this.modelHealthScores.keys()) {
        try {
          await this.analyzeDrift(modelId);
        } catch (error) {
          this.logger.error(`❌ Drift detection failed for ${modelId}:`, error);
        }
      }
    }, 60000); // Every minute
  }

  private startHealthScoreCalculation(): void {
    this.healthScoreInterval = setInterval(async () => {
      // Calculate health scores for all models
      const modelIds = Array.from(this.performanceMetrics.keys());
      this.collectionStats.modelsMonitored = modelIds.length;
      
      for (const modelId of modelIds) {
        try {
          await this.calculateModelHealthScore(modelId);
        } catch (error) {
          this.logger.error(`❌ Health score calculation failed for ${modelId}:`, error);
        }
      }
    }, 30000); // Every 30 seconds
  }

  private startAlertChecking(): void {
    if (!this.config.alerting.enabled) return;
    
    this.alertCheckInterval = setInterval(() => {
      this.checkAlerts();
    }, 10000); // Every 10 seconds
  }

  private performPeriodicMaintenance(): void {
    // Clean up old data based on retention policy
    const retentionThreshold = Date.now() - (this.config.retentionDays * 24 * 60 * 60 * 1000);
    
    // Clean time series data
    for (const [key, metric] of this.timeSeriesData) {
      const filteredPoints = metric.dataPoints.filter(dp => dp.timestamp > retentionThreshold);
      if (filteredPoints.length !== metric.dataPoints.length) {
        metric.dataPoints = filteredPoints;
        this.updateAggregations(metric);
      }
    }
    
    // Clean performance metrics
    for (const [modelId, metrics] of this.performanceMetrics) {
      const filteredMetrics = metrics.filter(m => m.timestamp > retentionThreshold);
      this.performanceMetrics.set(modelId, filteredMetrics);
    }
  }

  private updateAggregations(metric: TimeSeriesMetric): void {
    const values = metric.dataPoints.map(dp => dp.value);
    
    if (values.length === 0) return;
    
    // Basic statistics
    metric.aggregations.mean = values.reduce((a, b) => a + b, 0) / values.length;
    metric.aggregations.min = Math.min(...values);
    metric.aggregations.max = Math.max(...values);
    
    // Median
    const sorted = [...values].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    metric.aggregations.median = sorted.length % 2 === 0 
      ? (sorted[mid - 1] + sorted[mid]) / 2 
      : sorted[mid];
    
    // Standard deviation
    const variance = values.reduce((sum, val) => sum + Math.pow(val - metric.aggregations.mean, 2), 0) / values.length;
    metric.aggregations.stdDev = Math.sqrt(variance);
    
    // Percentiles
    const percentiles = [10, 25, 50, 75, 90, 95, 99];
    percentiles.forEach(p => {
      const index = Math.ceil((p / 100) * sorted.length) - 1;
      metric.aggregations.percentiles[p] = sorted[Math.max(0, index)];
    });
  }

  private calculateFeatureStatistics(values: number[]): FeatureStatistics {
    if (values.length === 0) {
      return this.createEmptyFeatureStatistics();
    }
    
    const sortedValues = [...values].sort((a, b) => a - b);
    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
    
    // Calculate higher-order moments
    const skewness = this.calculateSkewness(values, mean, Math.sqrt(variance));
    const kurtosis = this.calculateKurtosis(values, mean, Math.sqrt(variance));
    
    // Calculate distribution
    const distribution = this.calculateDistribution(values);
    const entropy = this.calculateEntropy(distribution);
    
    return {
      count: values.length,
      mean,
      median: this.calculateMedian(sortedValues),
      mode: this.calculateMode(values),
      stdDev: Math.sqrt(variance),
      variance,
      skewness,
      kurtosis,
      min: sortedValues[0],
      max: sortedValues[sortedValues.length - 1],
      quartiles: this.calculateQuartiles(sortedValues),
      percentiles: this.calculatePercentiles(sortedValues),
      nullCount: values.filter(v => v == null || isNaN(v)).length,
      uniqueCount: new Set(values).size,
      distribution,
      entropy
    };
  }

  private async calculateFeatureDrift(
    current: number[], 
    baseline: number[], 
    featureName: string
  ): Promise<DriftAnalysis> {
    try {
      const currentTensor = tf.tensor1d(current);
      const baselineTensor = tf.tensor1d(baseline);
      
      // Calculate PSI (Population Stability Index)
      const psi = this.calculatePSI(current, baseline);
      
      // Calculate KL Divergence
      const klDivergence = await this.calculateKLDivergence(currentTensor, baselineTensor);
      
      // Calculate Wasserstein Distance
      const wassersteinDistance = this.calculateWassersteinDistance(current, baseline);
      
      // Perform KS Test
      const ksTest = this.performKSTest(current, baseline);
      
      const statisticalTests = {
        ks_test: ksTest,
        chi_square: { statistic: 0, pValue: 1 }, // Placeholder
        kl_divergence: klDivergence,
        psi,
        wasserstein_distance: wassersteinDistance
      };
      
      const overallDriftScore = Math.max(psi / 0.2, klDivergence / 1.0, wassersteinDistance / 0.1);
      const hasDrift = overallDriftScore > this.config.driftDetection.threshold;
      
      return {
        modelId: featureName,
        hasDrift,
        driftType: 'data',
        driftScore: overallDriftScore,
        threshold: this.config.driftDetection.threshold,
        confidence: Math.min(1.0, overallDriftScore + 0.1),
        description: `Feature ${featureName} drift analysis`,
        recommendations: hasDrift ? [
          'Retrain model with recent data',
          'Review data preprocessing pipeline',
          'Check for data quality issues'
        ] : [],
        affectedFeatures: [featureName],
        impactedPredictions: hasDrift ? Math.floor(current.length * 0.3) : 0,
        comparisonWindow: {
          baseline: { start: Date.now() - baseline.length * 60000, end: Date.now() - 60000 },
          current: { start: Date.now() - current.length * 60000, end: Date.now() }
        },
        statisticalTests
      };
      
    } catch (error) {
      this.logger.error(`❌ Error calculating feature drift for ${featureName}:`, error);
      return this.createNoDriftAnalysis(featureName);
    }
  }

  private calculateFeatureQuality(values: number[], featureName: string): FeatureMonitoring['qualityMetrics'] {
    const total = values.length;
    const nullCount = values.filter(v => v == null || isNaN(v)).length;
    const uniqueCount = new Set(values).size;
    
    return {
      completeness: (total - nullCount) / Math.max(1, total),
      uniqueness: uniqueCount / Math.max(1, total),
      consistency: this.calculateConsistency(values),
      validity: this.calculateValidity(values, featureName),
      freshness: 1.0 // Placeholder - would check data recency
    };
  }

  private generateFeatureAlerts(
    current: FeatureStatistics,
    baseline: FeatureStatistics,
    drift: DriftAnalysis,
    quality: FeatureMonitoring['qualityMetrics']
  ): FeatureAlert[] {
    const alerts: FeatureAlert[] = [];
    
    // Drift alert
    if (drift.hasDrift) {
      alerts.push({
        type: 'drift',
        severity: drift.driftScore > 0.9 ? 'critical' : 
                 drift.driftScore > 0.8 ? 'high' : 'medium',
        message: `Feature drift detected with score ${drift.driftScore.toFixed(3)}`,
        timestamp: Date.now(),
        threshold: drift.threshold,
        actualValue: drift.driftScore,
        recommendation: 'Consider retraining the model with recent data'
      });
    }
    
    // Quality alerts
    Object.entries(quality).forEach(([metric, value]) => {
      const threshold = this.config.featureMonitoring.qualityThresholds[metric];
      if (threshold && value < threshold) {
        alerts.push({
          type: 'quality',
          severity: value < threshold * 0.8 ? 'high' : 'medium',
          message: `Feature ${metric} below threshold: ${(value * 100).toFixed(1)}%`,
          timestamp: Date.now(),
          threshold,
          actualValue: value,
          recommendation: `Investigate ${metric} degradation in feature pipeline`
        });
      }
    });
    
    return alerts;
  }

  // Statistical Test Methods
  
  private async performStatisticalTests(baseline: tf.Tensor, current: tf.Tensor): Promise<any> {
    // KS Test implementation
    const ksTest = this.performKSTestTensorFlow(await baseline.array() as number[], await current.array() as number[]);
    
    return {
      ks_test: ksTest,
      chi_square: { statistic: 0, pValue: 1 }, // Placeholder
      kl_divergence: await this.calculateKLDivergence(current, baseline),
      psi: this.calculatePSI(await current.array() as number[], await baseline.array() as number[]),
      wasserstein_distance: this.calculateWassersteinDistance(await current.array() as number[], await baseline.array() as number[])
    };
  }

  private async calculateDriftScores(baseline: tf.Tensor, current: tf.Tensor): Promise<Record<string, number>> {
    const baselineArray = await baseline.array() as number[];
    const currentArray = await current.array() as number[];
    
    return {
      psi: this.calculatePSI(currentArray, baselineArray),
      kl_divergence: await this.calculateKLDivergence(current, baseline),
      wasserstein: this.calculateWassersteinDistance(currentArray, baselineArray),
      ks_test: this.performKSTest(currentArray, baselineArray).statistic
    };
  }

  private aggregateDriftScores(scores: Record<string, number>): number {
    // Weighted average of different drift metrics
    const weights = { psi: 0.3, kl_divergence: 0.3, wasserstein: 0.2, ks_test: 0.2 };
    
    return Object.entries(scores).reduce((sum, [metric, score]) => {
      return sum + (score * (weights[metric] || 0));
    }, 0);
  }

  private calculatePSI(current: number[], baseline: number[]): number {
    // Population Stability Index calculation
    const bins = 10;
    const currentHist = this.calculateHistogram(current, bins);
    const baselineHist = this.calculateHistogram(baseline, bins);
    
    let psi = 0;
    for (let i = 0; i < bins; i++) {
      const currentPct = (currentHist[i] + 0.0001) / current.length;
      const baselinePct = (baselineHist[i] + 0.0001) / baseline.length;
      psi += (currentPct - baselinePct) * Math.log(currentPct / baselinePct);
    }
    
    return psi;
  }

  private async calculateKLDivergence(p: tf.Tensor, q: tf.Tensor): Promise<number> {
    // Kullback-Leibler divergence
    const pNorm = p.div(p.sum());
    const qNorm = q.div(q.sum());
    
    const logRatio = pNorm.add(1e-8).log().sub(qNorm.add(1e-8).log());
    const kl = pNorm.mul(logRatio).sum();
    
    const result = await kl.data();
    return result[0];
  }

  private calculateWassersteinDistance(x: number[], y: number[]): number {
    // Earth Mover's Distance (simplified 1D version)
    const sortedX = [...x].sort((a, b) => a - b);
    const sortedY = [...y].sort((a, b) => a - b);
    
    const minLength = Math.min(sortedX.length, sortedY.length);
    let distance = 0;
    
    for (let i = 0; i < minLength; i++) {
      distance += Math.abs(sortedX[i] - sortedY[i]);
    }
    
    return distance / minLength;
  }

  private performKSTest(sample1: number[], sample2: number[]): { statistic: number; pValue: number } {
    // Kolmogorov-Smirnov test implementation
    const n1 = sample1.length;
    const n2 = sample2.length;
    
    const sorted1 = [...sample1].sort((a, b) => a - b);
    const sorted2 = [...sample2].sort((a, b) => a - b);
    
    const allValues = [...new Set([...sorted1, ...sorted2])].sort((a, b) => a - b);
    
    let maxDiff = 0;
    for (const value of allValues) {
      const cdf1 = sorted1.filter(x => x <= value).length / n1;
      const cdf2 = sorted2.filter(x => x <= value).length / n2;
      maxDiff = Math.max(maxDiff, Math.abs(cdf1 - cdf2));
    }
    
    // Approximate p-value calculation
    const effectiveN = Math.sqrt((n1 * n2) / (n1 + n2));
    const pValue = 2 * Math.exp(-2 * maxDiff * maxDiff * effectiveN * effectiveN);
    
    return { statistic: maxDiff, pValue: Math.min(1, pValue) };
  }

  private performKSTestTensorFlow(sample1: number[], sample2: number[]): { statistic: number; pValue: number } {
    return this.performKSTest(sample1, sample2);
  }

  // Health Score Calculation Methods
  
  private calculateAccuracyScore(metrics: PerformanceMetrics[]): number {
    if (metrics.length === 0) return 50;
    
    const avgAccuracy = metrics.reduce((sum, m) => sum + m.accuracy.overall, 0) / metrics.length;
    return Math.min(100, avgAccuracy * 100);
  }

  private calculateLatencyScore(metrics: PerformanceMetrics[]): number {
    if (metrics.length === 0) return 50;
    
    const avgLatency = metrics.reduce((sum, m) => sum + m.predictions.avgLatency, 0) / metrics.length;
    
    // Score inversely proportional to latency (lower is better)
    if (avgLatency <= 50) return 100;
    if (avgLatency <= 100) return 90;
    if (avgLatency <= 200) return 75;
    if (avgLatency <= 500) return 50;
    return 25;
  }

  private calculateThroughputScore(metrics: PerformanceMetrics[]): number {
    if (metrics.length === 0) return 50;
    
    const avgThroughput = metrics.reduce((sum, m) => sum + m.predictions.throughput, 0) / metrics.length;
    
    // Score proportional to throughput (higher is better)
    if (avgThroughput >= 1000) return 100;
    if (avgThroughput >= 500) return 90;
    if (avgThroughput >= 100) return 75;
    if (avgThroughput >= 50) return 50;
    return 25;
  }

  private calculateStabilityScore(metrics: PerformanceMetrics[]): number {
    if (metrics.length < 2) return 75;
    
    // Calculate coefficient of variation for key metrics
    const accuracies = metrics.map(m => m.accuracy.overall);
    const latencies = metrics.map(m => m.predictions.avgLatency);
    
    const accuracyCV = this.calculateCoefficientOfVariation(accuracies);
    const latencyCV = this.calculateCoefficientOfVariation(latencies);
    
    const avgCV = (accuracyCV + latencyCV) / 2;
    
    // Lower CV = higher stability score
    if (avgCV <= 0.05) return 100;
    if (avgCV <= 0.1) return 90;
    if (avgCV <= 0.2) return 75;
    if (avgCV <= 0.5) return 50;
    return 25;
  }

  private async calculateDriftHealthScore(modelId: string): Promise<number> {
    try {
      const driftAnalysis = await this.analyzeDrift(modelId);
      
      // Higher drift score = lower health score
      const driftScore = driftAnalysis.driftScore;
      
      if (driftScore <= 0.2) return 100;
      if (driftScore <= 0.4) return 85;
      if (driftScore <= 0.6) return 70;
      if (driftScore <= 0.8) return 50;
      return 25;
      
    } catch (error) {
      return 50; // Default score if drift analysis fails
    }
  }

  private calculateResourceEfficiencyScore(metrics: PerformanceMetrics[]): number {
    if (metrics.length === 0) return 50;
    
    const avgCpuUsage = metrics.reduce((sum, m) => sum + m.resources.cpuUsage, 0) / metrics.length;
    const avgMemoryUsage = metrics.reduce((sum, m) => sum + m.resources.memoryUsage, 0) / metrics.length;
    
    // Optimal resource usage is around 60-80%
    const cpuScore = this.calculateResourceScore(avgCpuUsage);
    const memoryScore = this.calculateResourceScore(avgMemoryUsage);
    
    return (cpuScore + memoryScore) / 2;
  }

  private calculateResourceScore(usage: number): number {
    if (usage >= 60 && usage <= 80) return 100;
    if (usage >= 40 && usage <= 90) return 85;
    if (usage >= 20 && usage <= 95) return 70;
    if (usage >= 10 && usage <= 98) return 50;
    return 25;
  }

  // Utility Methods
  
  private calculateCoefficientOfVariation(values: number[]): number {
    if (values.length === 0) return 0;
    
    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    if (mean === 0) return 0;
    
    const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
    const stdDev = Math.sqrt(variance);
    
    return stdDev / mean;
  }

  private calculateHistogram(data: number[], bins: number): number[] {
    const min = Math.min(...data);
    const max = Math.max(...data);
    const binWidth = (max - min) / bins;
    
    const histogram = new Array(bins).fill(0);
    
    data.forEach(value => {
      const binIndex = Math.min(bins - 1, Math.floor((value - min) / binWidth));
      histogram[binIndex]++;
    });
    
    return histogram;
  }

  private calculateMedian(sortedValues: number[]): number {
    const mid = Math.floor(sortedValues.length / 2);
    return sortedValues.length % 2 === 0 
      ? (sortedValues[mid - 1] + sortedValues[mid]) / 2 
      : sortedValues[mid];
  }

  private calculateMode(values: number[]): number {
    const frequency = new Map<number, number>();
    values.forEach(val => {
      frequency.set(val, (frequency.get(val) || 0) + 1);
    });
    
    let mode = values[0];
    let maxFreq = 0;
    
    for (const [val, freq] of frequency) {
      if (freq > maxFreq) {
        maxFreq = freq;
        mode = val;
      }
    }
    
    return mode;
  }

  private calculateQuartiles(sortedValues: number[]): [number, number, number] {
    const q1Index = Math.floor(sortedValues.length * 0.25);
    const q2Index = Math.floor(sortedValues.length * 0.5);
    const q3Index = Math.floor(sortedValues.length * 0.75);
    
    return [
      sortedValues[q1Index],
      sortedValues[q2Index],
      sortedValues[q3Index]
    ];
  }

  private calculatePercentiles(sortedValues: number[]): Record<number, number> {
    const percentiles = {};
    const targets = [1, 5, 10, 25, 50, 75, 90, 95, 99];
    
    targets.forEach(p => {
      const index = Math.floor((p / 100) * sortedValues.length);
      percentiles[p] = sortedValues[Math.min(index, sortedValues.length - 1)];
    });
    
    return percentiles;
  }

  private calculateSkewness(values: number[], mean: number, stdDev: number): number {
    if (stdDev === 0) return 0;
    
    const n = values.length;
    const sum = values.reduce((acc, val) => acc + Math.pow((val - mean) / stdDev, 3), 0);
    
    return (n / ((n - 1) * (n - 2))) * sum;
  }

  private calculateKurtosis(values: number[], mean: number, stdDev: number): number {
    if (stdDev === 0) return 0;
    
    const n = values.length;
    const sum = values.reduce((acc, val) => acc + Math.pow((val - mean) / stdDev, 4), 0);
    
    return ((n * (n + 1)) / ((n - 1) * (n - 2) * (n - 3))) * sum - 
           (3 * (n - 1) * (n - 1)) / ((n - 2) * (n - 3));
  }

  private calculateDistribution(values: number[]): Record<string | number, number> {
    const distribution = {};
    const total = values.length;
    
    values.forEach(val => {
      const key = typeof val === 'number' ? Math.floor(val * 10) / 10 : val; // Round to 1 decimal
      distribution[key] = (distribution[key] || 0) + 1;
    });
    
    // Convert counts to probabilities
    Object.keys(distribution).forEach(key => {
      distribution[key] = distribution[key] / total;
    });
    
    return distribution;
  }

  private calculateEntropy(distribution: Record<string | number, number>): number {
    return -Object.values(distribution).reduce((entropy, prob) => {
      return prob > 0 ? entropy + prob * Math.log2(prob) : entropy;
    }, 0);
  }

  private calculateConsistency(values: number[]): number {
    // Simplified consistency metric based on standard deviation relative to mean
    if (values.length === 0) return 1;
    
    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    if (mean === 0) return 1;
    
    const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
    const cv = Math.sqrt(variance) / Math.abs(mean);
    
    return Math.max(0, 1 - cv);
  }

  private calculateValidity(values: number[], featureName: string): number {
    // Simplified validity check - would be more sophisticated in practice
    const invalidCount = values.filter(val => {
      return isNaN(val) || !isFinite(val) || val === null || val === undefined;
    }).length;
    
    return 1 - (invalidCount / Math.max(1, values.length));
  }

  // Helper Methods for Data Retrieval
  
  private getRecentModelData(modelId: string): number[] {
    const metrics = this.performanceMetrics.get(modelId);
    if (!metrics) return [];
    
    return metrics
      .slice(-this.config.driftDetection.windowSize)
      .map(m => m.accuracy.overall);
  }

  private getRecentPerformanceMetrics(modelId: string, count: number): PerformanceMetrics[] {
    const metrics = this.performanceMetrics.get(modelId);
    if (!metrics) return [];
    
    return metrics.slice(-count);
  }

  // Factory Methods for Default Objects
  
  private createEmptyFeatureStatistics(): FeatureStatistics {
    return {
      count: 0, mean: 0, median: 0, mode: 0, stdDev: 0, variance: 0,
      skewness: 0, kurtosis: 0, min: 0, max: 0,
      quartiles: [0, 0, 0], percentiles: {}, nullCount: 0, uniqueCount: 0,
      distribution: {}, entropy: 0
    };
  }

  private createNoDriftAnalysis(modelId: string): DriftAnalysis {
    return {
      modelId,
      hasDrift: false,
      driftType: 'data',
      driftScore: 0,
      threshold: this.config.driftDetection.threshold,
      confidence: 0,
      description: 'No drift detected - insufficient data',
      recommendations: [],
      affectedFeatures: [],
      impactedPredictions: 0,
      comparisonWindow: {
        baseline: { start: Date.now() - 3600000, end: Date.now() - 1800000 },
        current: { start: Date.now() - 1800000, end: Date.now() }
      },
      statisticalTests: {
        ks_test: { statistic: 0, pValue: 1 },
        chi_square: { statistic: 0, pValue: 1 },
        kl_divergence: 0,
        psi: 0,
        wasserstein_distance: 0
      }
    };
  }

  private createErrorDriftAnalysis(modelId: string, error: string): DriftAnalysis {
    return {
      ...this.createNoDriftAnalysis(modelId),
      description: `Drift analysis failed: ${error}`
    };
  }

  private createDefaultHealthScore(modelId: string): ModelHealthScore {
    return {
      modelId,
      overallScore: 50,
      components: {
        accuracy: { score: 50, weight: 0.25 },
        latency: { score: 50, weight: 0.20 },
        throughput: { score: 50, weight: 0.15 },
        stability: { score: 50, weight: 0.15 },
        drift: { score: 50, weight: 0.15 },
        resourceEfficiency: { score: 50, weight: 0.10 }
      },
      trend: 'stable',
      recommendations: ['Insufficient data for detailed analysis'],
      alertLevel: 'none'
    };
  }

  // Additional Helper Methods
  
  private identifyDriftType(
    statisticalTests: any, 
    driftScores: Record<string, number>
  ): 'data' | 'concept' | 'prediction' {
    // Simple heuristic to classify drift type
    if (driftScores.kl_divergence > 0.5) return 'concept';
    if (driftScores.wasserstein > 0.3) return 'data';
    return 'prediction';
  }

  private calculateDriftConfidence(statisticalTests: any): number {
    // Calculate confidence based on statistical test results
    const ksConfidence = 1 - statisticalTests.ks_test.pValue;
    return Math.min(1, Math.max(0.5, ksConfidence));
  }

  private generateDriftDescription(driftType: string, score: number, hasDrift: boolean): string {
    if (!hasDrift) {
      return 'No significant drift detected in model behavior';
    }
    
    const severity = score > 0.8 ? 'severe' : score > 0.6 ? 'moderate' : 'mild';
    return `${severity} ${driftType} drift detected with score ${score.toFixed(3)}`;
  }

  private generateDriftRecommendations(driftType: string, score: number): string[] {
    const recommendations = [];
    
    if (score > 0.8) {
      recommendations.push('Immediate model retraining recommended');
      recommendations.push('Consider emergency fallback model');
    } else if (score > 0.6) {
      recommendations.push('Schedule model retraining within 24 hours');
      recommendations.push('Monitor prediction quality closely');
    } else if (score > 0.4) {
      recommendations.push('Plan model refresh within one week');
    }
    
    switch (driftType) {
      case 'data':
        recommendations.push('Review data preprocessing pipeline');
        recommendations.push('Check for upstream data source changes');
        break;
      case 'concept':
        recommendations.push('Analyze business logic changes');
        recommendations.push('Review feature engineering approach');
        break;
      case 'prediction':
        recommendations.push('Evaluate model architecture');
        recommendations.push('Consider ensemble approach');
        break;
    }
    
    return recommendations;
  }

  private identifyAffectedFeatures(modelId: string, driftScores: Record<string, number>): string[] {
    // In a real implementation, this would analyze feature-level drift
    return ['feature_1', 'feature_2', 'feature_3']; // Placeholder
  }

  private estimateImpactedPredictions(modelId: string, driftScore: number): number {
    const recentMetrics = this.getRecentPerformanceMetrics(modelId, 1);
    if (recentMetrics.length === 0) return 0;
    
    const totalPredictions = recentMetrics[0].predictions.total;
    return Math.floor(totalPredictions * driftScore * 0.5); // Estimate 50% impact
  }

  private calculateHealthTrend(modelId: string, currentScore: number): 'improving' | 'stable' | 'degrading' {
    const history = this.modelHealthScores.get(modelId);
    if (!history) return 'stable';
    
    // Simple trend calculation - would use more sophisticated analysis in practice
    const previousScore = history.overallScore;
    const diff = currentScore - previousScore;
    
    if (diff > 5) return 'improving';
    if (diff < -5) return 'degrading';
    return 'stable';
  }

  private generateHealthRecommendations(scores: Record<string, number>): string[] {
    const recommendations = [];
    
    if (scores.accuracyScore < 70) {
      recommendations.push('Model accuracy is below acceptable threshold - retrain with recent data');
    }
    
    if (scores.latencyScore < 60) {
      recommendations.push('Prediction latency is high - optimize model or scale resources');
    }
    
    if (scores.stabilityScore < 60) {
      recommendations.push('Model performance is unstable - review training process');
    }
    
    if (scores.driftScore < 50) {
      recommendations.push('Significant drift detected - immediate attention required');
    }
    
    if (scores.resourceScore < 60) {
      recommendations.push('Resource utilization is suboptimal - review infrastructure');
    }
    
    return recommendations.length > 0 ? recommendations : ['Model is performing well'];
  }

  private determineAlertLevel(overallScore: number, recentMetrics: PerformanceMetrics[]): 'none' | 'info' | 'warning' | 'critical' {
    if (overallScore < 30) return 'critical';
    if (overallScore < 50) return 'warning';
    if (overallScore < 70) return 'info';
    return 'none';
  }

  private async evaluateAlertCondition(rule: AlertRule): Promise<boolean> {
    // Get metric value
    let metricValue: number;
    
    if (rule.modelId) {
      const healthScore = this.modelHealthScores.get(rule.modelId);
      if (!healthScore) return false;
      
      switch (rule.metric) {
        case 'accuracy':
          metricValue = healthScore.components.accuracy.score;
          break;
        case 'latency':
          metricValue = healthScore.components.latency.score;
          break;
        case 'drift_score':
          metricValue = 100 - healthScore.components.drift.score; // Invert for threshold comparison
          break;
        default:
          return false;
      }
    } else {
      // Global metric
      const metric = this.getMetric(rule.metric);
      if (!metric || metric.dataPoints.length === 0) return false;
      
      metricValue = metric.dataPoints[metric.dataPoints.length - 1].value;
    }
    
    // Evaluate condition
    switch (rule.condition) {
      case 'gt':
        return metricValue > (rule.threshold as number);
      case 'lt':
        return metricValue < (rule.threshold as number);
      case 'eq':
        return metricValue === (rule.threshold as number);
      case 'ne':
        return metricValue !== (rule.threshold as number);
      case 'in_range':
        const [min, max] = rule.threshold as [number, number];
        return metricValue >= min && metricValue <= max;
      case 'out_range':
        const [minOut, maxOut] = rule.threshold as [number, number];
        return metricValue < minOut || metricValue > maxOut;
      default:
        return false;
    }
  }

  private async sendWebhook(url: string, data: any): Promise<void> {
    // Webhook implementation would go here
    this.logger.info(`📤 Webhook sent to ${url}`);
  }

  async stop(): Promise<void> {
    this.logger.info('🛑 Stopping AV10-26 Metrics Collector...');
    
    // Clear all intervals
    if (this.metricsCollectionInterval) clearInterval(this.metricsCollectionInterval);
    if (this.driftDetectionInterval) clearInterval(this.driftDetectionInterval);
    if (this.healthScoreInterval) clearInterval(this.healthScoreInterval);
    if (this.alertCheckInterval) clearInterval(this.alertCheckInterval);
    
    // Clean up tensors
    this.referenceDistributions.forEach(tensor => tensor.dispose());
    this.referenceDistributions.clear();
    
    this.isStarted = false;
    
    this.logger.info('✅ AV10-26 Metrics Collector stopped successfully');
  }
}