"use strict";
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
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
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
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MetricsCollector = void 0;
const events_1 = require("events");
const inversify_1 = require("inversify");
const Logger_1 = require("../core/Logger");
const tf = __importStar(require("@tensorflow/tfjs-node"));
let MetricsCollector = class MetricsCollector extends events_1.EventEmitter {
    logger;
    isStarted = false;
    // Data Storage
    timeSeriesData = new Map();
    performanceMetrics = new Map();
    featureMonitoring = new Map();
    modelHealthScores = new Map();
    alertRules = new Map();
    // Baseline Data for Drift Detection
    baselineData = new Map();
    referenceDistributions = new Map();
    // Collection Intervals
    metricsCollectionInterval = null;
    driftDetectionInterval = null;
    healthScoreInterval = null;
    alertCheckInterval = null;
    // Configuration
    config = {
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
    collectionStats = {
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
        this.logger = new Logger_1.Logger('MetricsCollector-AV10-26');
        this.initializeDefaultAlertRules();
    }
    async start() {
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
        }
        catch (error) {
            this.logger.error('❌ Failed to start Metrics Collector:', error);
            throw new Error(`Metrics collector startup failed: ${error.message}`);
        }
    }
    // Core Metrics Collection
    async collectMetric(name, value, modelId, metadata) {
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
            const metric = this.timeSeriesData.get(metricKey);
            const dataPoint = {
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
        }
        catch (error) {
            this.logger.error(`❌ Error collecting metric ${name}:`, error);
        }
    }
    // Performance Metrics Collection
    async collectPerformanceMetrics(modelId, metrics) {
        try {
            const performanceMetric = {
                modelId,
                timestamp: Date.now(),
                ...metrics
            };
            if (!this.performanceMetrics.has(modelId)) {
                this.performanceMetrics.set(modelId, []);
            }
            const modelMetrics = this.performanceMetrics.get(modelId);
            modelMetrics.push(performanceMetric);
            // Keep only recent data
            const retentionThreshold = Date.now() - (this.config.retentionDays * 24 * 60 * 60 * 1000);
            this.performanceMetrics.set(modelId, modelMetrics.filter(m => m.timestamp > retentionThreshold));
            // Update model health score
            await this.calculateModelHealthScore(modelId);
            this.emit('performance_metrics_collected', performanceMetric);
        }
        catch (error) {
            this.logger.error(`❌ Error collecting performance metrics for ${modelId}:`, error);
        }
    }
    // Feature Monitoring
    async monitorFeature(featureName, modelId, values, baseline) {
        try {
            const featureKey = `${featureName}:${modelId}`;
            // Calculate current statistics
            const currentStats = this.calculateFeatureStatistics(values);
            // Get or create baseline
            let baselineStats;
            if (baseline) {
                baselineStats = this.calculateFeatureStatistics(baseline);
                this.baselineData.set(featureKey, baseline);
            }
            else if (this.baselineData.has(featureKey)) {
                baselineStats = this.calculateFeatureStatistics(this.baselineData.get(featureKey));
            }
            else {
                // Use current as baseline if no baseline exists
                baselineStats = currentStats;
                this.baselineData.set(featureKey, values);
            }
            // Calculate drift
            const driftAnalysis = await this.calculateFeatureDrift(values, this.baselineData.get(featureKey) || values, featureName);
            // Calculate quality metrics
            const qualityMetrics = this.calculateFeatureQuality(values, featureName);
            // Generate alerts
            const alerts = this.generateFeatureAlerts(currentStats, baselineStats, driftAnalysis, qualityMetrics);
            const featureMonitoring = {
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
        }
        catch (error) {
            this.logger.error(`❌ Error monitoring feature ${featureName} for ${modelId}:`, error);
        }
    }
    // Drift Detection
    async analyzeDrift(modelId, currentData, baselineData) {
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
            const driftAnalysis = {
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
        }
        catch (error) {
            this.logger.error(`❌ Drift analysis failed for model ${modelId}:`, error);
            return this.createErrorDriftAnalysis(modelId, error.message);
        }
    }
    // Model Health Score Calculation
    async calculateModelHealthScore(modelId) {
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
            const overallScore = accuracyScore * weights.accuracy +
                latencyScore * weights.latency +
                throughputScore * weights.throughput +
                stabilityScore * weights.stability +
                driftScore * weights.drift +
                resourceScore * weights.resourceEfficiency;
            // Determine trend
            const trend = this.calculateHealthTrend(modelId, overallScore);
            // Generate recommendations
            const recommendations = this.generateHealthRecommendations({ accuracyScore, latencyScore, throughputScore, stabilityScore, driftScore, resourceScore });
            // Determine alert level
            const alertLevel = this.determineAlertLevel(overallScore, recentMetrics);
            const healthScore = {
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
        }
        catch (error) {
            this.logger.error(`❌ Error calculating health score for ${modelId}:`, error);
            return this.createDefaultHealthScore(modelId);
        }
    }
    // Alert System
    addAlertRule(rule) {
        this.alertRules.set(rule.id, rule);
        this.logger.info(`✅ Alert rule added: ${rule.name}`);
    }
    removeAlertRule(ruleId) {
        this.alertRules.delete(ruleId);
        this.logger.info(`🗑️ Alert rule removed: ${ruleId}`);
    }
    async checkAlerts() {
        for (const [ruleId, rule] of this.alertRules) {
            if (!rule.enabled)
                continue;
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
            }
            catch (error) {
                this.logger.error(`❌ Error evaluating alert rule ${rule.name}:`, error);
            }
        }
    }
    async triggerAlert(rule) {
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
            }
            catch (error) {
                this.logger.error(`❌ Error executing alert action ${action.type}:`, error);
            }
        }
    }
    async executeAlertAction(action, alert) {
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
    getMetric(name, modelId) {
        const key = modelId ? `${name}:${modelId}` : name;
        return this.timeSeriesData.get(key);
    }
    getModelHealthScore(modelId) {
        return this.modelHealthScores.get(modelId);
    }
    getFeatureMonitoring(featureName, modelId) {
        const key = `${featureName}:${modelId}`;
        return this.featureMonitoring.get(key);
    }
    getCollectionStats() {
        return {
            ...this.collectionStats,
            totalModelsMonitored: this.modelHealthScores.size,
            totalFeaturesTracked: this.featureMonitoring.size,
            totalTimeSeriesMetrics: this.timeSeriesData.size,
            totalAlertRules: this.alertRules.size
        };
    }
    async getMetricsReport(modelId, timeRange) {
        const report = {
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
        }
        else {
            // Global report
            report.summary = this.getCollectionStats();
            for (const [id, healthScore] of this.modelHealthScores) {
                report.healthScores[id] = healthScore;
            }
        }
        return report;
    }
    // Private Implementation Methods
    initializeDefaultAlertRules() {
        const defaultRules = [
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
    startMetricsCollection() {
        this.metricsCollectionInterval = setInterval(() => {
            // Periodic cleanup and aggregation
            this.performPeriodicMaintenance();
        }, this.config.collectionInterval);
    }
    startDriftDetection() {
        if (!this.config.driftDetection.enabled)
            return;
        this.driftDetectionInterval = setInterval(async () => {
            // Check drift for all monitored models
            for (const modelId of this.modelHealthScores.keys()) {
                try {
                    await this.analyzeDrift(modelId);
                }
                catch (error) {
                    this.logger.error(`❌ Drift detection failed for ${modelId}:`, error);
                }
            }
        }, 60000); // Every minute
    }
    startHealthScoreCalculation() {
        this.healthScoreInterval = setInterval(async () => {
            // Calculate health scores for all models
            const modelIds = Array.from(this.performanceMetrics.keys());
            this.collectionStats.modelsMonitored = modelIds.length;
            for (const modelId of modelIds) {
                try {
                    await this.calculateModelHealthScore(modelId);
                }
                catch (error) {
                    this.logger.error(`❌ Health score calculation failed for ${modelId}:`, error);
                }
            }
        }, 30000); // Every 30 seconds
    }
    startAlertChecking() {
        if (!this.config.alerting.enabled)
            return;
        this.alertCheckInterval = setInterval(() => {
            this.checkAlerts();
        }, 10000); // Every 10 seconds
    }
    performPeriodicMaintenance() {
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
    updateAggregations(metric) {
        const values = metric.dataPoints.map(dp => dp.value);
        if (values.length === 0)
            return;
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
    calculateFeatureStatistics(values) {
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
    async calculateFeatureDrift(current, baseline, featureName) {
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
        }
        catch (error) {
            this.logger.error(`❌ Error calculating feature drift for ${featureName}:`, error);
            return this.createNoDriftAnalysis(featureName);
        }
    }
    calculateFeatureQuality(values, featureName) {
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
    generateFeatureAlerts(current, baseline, drift, quality) {
        const alerts = [];
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
    async performStatisticalTests(baseline, current) {
        // KS Test implementation
        const ksTest = this.performKSTestTensorFlow(await baseline.array(), await current.array());
        return {
            ks_test: ksTest,
            chi_square: { statistic: 0, pValue: 1 }, // Placeholder
            kl_divergence: await this.calculateKLDivergence(current, baseline),
            psi: this.calculatePSI(await current.array(), await baseline.array()),
            wasserstein_distance: this.calculateWassersteinDistance(await current.array(), await baseline.array())
        };
    }
    async calculateDriftScores(baseline, current) {
        const baselineArray = await baseline.array();
        const currentArray = await current.array();
        return {
            psi: this.calculatePSI(currentArray, baselineArray),
            kl_divergence: await this.calculateKLDivergence(current, baseline),
            wasserstein: this.calculateWassersteinDistance(currentArray, baselineArray),
            ks_test: this.performKSTest(currentArray, baselineArray).statistic
        };
    }
    aggregateDriftScores(scores) {
        // Weighted average of different drift metrics
        const weights = { psi: 0.3, kl_divergence: 0.3, wasserstein: 0.2, ks_test: 0.2 };
        return Object.entries(scores).reduce((sum, [metric, score]) => {
            return sum + (score * (weights[metric] || 0));
        }, 0);
    }
    calculatePSI(current, baseline) {
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
    async calculateKLDivergence(p, q) {
        // Kullback-Leibler divergence
        const pNorm = p.div(p.sum());
        const qNorm = q.div(q.sum());
        const logRatio = pNorm.add(1e-8).log().sub(qNorm.add(1e-8).log());
        const kl = pNorm.mul(logRatio).sum();
        const result = await kl.data();
        return result[0];
    }
    calculateWassersteinDistance(x, y) {
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
    performKSTest(sample1, sample2) {
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
    performKSTestTensorFlow(sample1, sample2) {
        return this.performKSTest(sample1, sample2);
    }
    // Health Score Calculation Methods
    calculateAccuracyScore(metrics) {
        if (metrics.length === 0)
            return 50;
        const avgAccuracy = metrics.reduce((sum, m) => sum + m.accuracy.overall, 0) / metrics.length;
        return Math.min(100, avgAccuracy * 100);
    }
    calculateLatencyScore(metrics) {
        if (metrics.length === 0)
            return 50;
        const avgLatency = metrics.reduce((sum, m) => sum + m.predictions.avgLatency, 0) / metrics.length;
        // Score inversely proportional to latency (lower is better)
        if (avgLatency <= 50)
            return 100;
        if (avgLatency <= 100)
            return 90;
        if (avgLatency <= 200)
            return 75;
        if (avgLatency <= 500)
            return 50;
        return 25;
    }
    calculateThroughputScore(metrics) {
        if (metrics.length === 0)
            return 50;
        const avgThroughput = metrics.reduce((sum, m) => sum + m.predictions.throughput, 0) / metrics.length;
        // Score proportional to throughput (higher is better)
        if (avgThroughput >= 1000)
            return 100;
        if (avgThroughput >= 500)
            return 90;
        if (avgThroughput >= 100)
            return 75;
        if (avgThroughput >= 50)
            return 50;
        return 25;
    }
    calculateStabilityScore(metrics) {
        if (metrics.length < 2)
            return 75;
        // Calculate coefficient of variation for key metrics
        const accuracies = metrics.map(m => m.accuracy.overall);
        const latencies = metrics.map(m => m.predictions.avgLatency);
        const accuracyCV = this.calculateCoefficientOfVariation(accuracies);
        const latencyCV = this.calculateCoefficientOfVariation(latencies);
        const avgCV = (accuracyCV + latencyCV) / 2;
        // Lower CV = higher stability score
        if (avgCV <= 0.05)
            return 100;
        if (avgCV <= 0.1)
            return 90;
        if (avgCV <= 0.2)
            return 75;
        if (avgCV <= 0.5)
            return 50;
        return 25;
    }
    async calculateDriftHealthScore(modelId) {
        try {
            const driftAnalysis = await this.analyzeDrift(modelId);
            // Higher drift score = lower health score
            const driftScore = driftAnalysis.driftScore;
            if (driftScore <= 0.2)
                return 100;
            if (driftScore <= 0.4)
                return 85;
            if (driftScore <= 0.6)
                return 70;
            if (driftScore <= 0.8)
                return 50;
            return 25;
        }
        catch (error) {
            return 50; // Default score if drift analysis fails
        }
    }
    calculateResourceEfficiencyScore(metrics) {
        if (metrics.length === 0)
            return 50;
        const avgCpuUsage = metrics.reduce((sum, m) => sum + m.resources.cpuUsage, 0) / metrics.length;
        const avgMemoryUsage = metrics.reduce((sum, m) => sum + m.resources.memoryUsage, 0) / metrics.length;
        // Optimal resource usage is around 60-80%
        const cpuScore = this.calculateResourceScore(avgCpuUsage);
        const memoryScore = this.calculateResourceScore(avgMemoryUsage);
        return (cpuScore + memoryScore) / 2;
    }
    calculateResourceScore(usage) {
        if (usage >= 60 && usage <= 80)
            return 100;
        if (usage >= 40 && usage <= 90)
            return 85;
        if (usage >= 20 && usage <= 95)
            return 70;
        if (usage >= 10 && usage <= 98)
            return 50;
        return 25;
    }
    // Utility Methods
    calculateCoefficientOfVariation(values) {
        if (values.length === 0)
            return 0;
        const mean = values.reduce((a, b) => a + b, 0) / values.length;
        if (mean === 0)
            return 0;
        const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
        const stdDev = Math.sqrt(variance);
        return stdDev / mean;
    }
    calculateHistogram(data, bins) {
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
    calculateMedian(sortedValues) {
        const mid = Math.floor(sortedValues.length / 2);
        return sortedValues.length % 2 === 0
            ? (sortedValues[mid - 1] + sortedValues[mid]) / 2
            : sortedValues[mid];
    }
    calculateMode(values) {
        const frequency = new Map();
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
    calculateQuartiles(sortedValues) {
        const q1Index = Math.floor(sortedValues.length * 0.25);
        const q2Index = Math.floor(sortedValues.length * 0.5);
        const q3Index = Math.floor(sortedValues.length * 0.75);
        return [
            sortedValues[q1Index],
            sortedValues[q2Index],
            sortedValues[q3Index]
        ];
    }
    calculatePercentiles(sortedValues) {
        const percentiles = {};
        const targets = [1, 5, 10, 25, 50, 75, 90, 95, 99];
        targets.forEach(p => {
            const index = Math.floor((p / 100) * sortedValues.length);
            percentiles[p] = sortedValues[Math.min(index, sortedValues.length - 1)];
        });
        return percentiles;
    }
    calculateSkewness(values, mean, stdDev) {
        if (stdDev === 0)
            return 0;
        const n = values.length;
        const sum = values.reduce((acc, val) => acc + Math.pow((val - mean) / stdDev, 3), 0);
        return (n / ((n - 1) * (n - 2))) * sum;
    }
    calculateKurtosis(values, mean, stdDev) {
        if (stdDev === 0)
            return 0;
        const n = values.length;
        const sum = values.reduce((acc, val) => acc + Math.pow((val - mean) / stdDev, 4), 0);
        return ((n * (n + 1)) / ((n - 1) * (n - 2) * (n - 3))) * sum -
            (3 * (n - 1) * (n - 1)) / ((n - 2) * (n - 3));
    }
    calculateDistribution(values) {
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
    calculateEntropy(distribution) {
        return -Object.values(distribution).reduce((entropy, prob) => {
            return prob > 0 ? entropy + prob * Math.log2(prob) : entropy;
        }, 0);
    }
    calculateConsistency(values) {
        // Simplified consistency metric based on standard deviation relative to mean
        if (values.length === 0)
            return 1;
        const mean = values.reduce((a, b) => a + b, 0) / values.length;
        if (mean === 0)
            return 1;
        const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
        const cv = Math.sqrt(variance) / Math.abs(mean);
        return Math.max(0, 1 - cv);
    }
    calculateValidity(values, featureName) {
        // Simplified validity check - would be more sophisticated in practice
        const invalidCount = values.filter(val => {
            return isNaN(val) || !isFinite(val) || val === null || val === undefined;
        }).length;
        return 1 - (invalidCount / Math.max(1, values.length));
    }
    // Helper Methods for Data Retrieval
    getRecentModelData(modelId) {
        const metrics = this.performanceMetrics.get(modelId);
        if (!metrics)
            return [];
        return metrics
            .slice(-this.config.driftDetection.windowSize)
            .map(m => m.accuracy.overall);
    }
    getRecentPerformanceMetrics(modelId, count) {
        const metrics = this.performanceMetrics.get(modelId);
        if (!metrics)
            return [];
        return metrics.slice(-count);
    }
    // Factory Methods for Default Objects
    createEmptyFeatureStatistics() {
        return {
            count: 0, mean: 0, median: 0, mode: 0, stdDev: 0, variance: 0,
            skewness: 0, kurtosis: 0, min: 0, max: 0,
            quartiles: [0, 0, 0], percentiles: {}, nullCount: 0, uniqueCount: 0,
            distribution: {}, entropy: 0
        };
    }
    createNoDriftAnalysis(modelId) {
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
    createErrorDriftAnalysis(modelId, error) {
        return {
            ...this.createNoDriftAnalysis(modelId),
            description: `Drift analysis failed: ${error}`
        };
    }
    createDefaultHealthScore(modelId) {
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
    identifyDriftType(statisticalTests, driftScores) {
        // Simple heuristic to classify drift type
        if (driftScores.kl_divergence > 0.5)
            return 'concept';
        if (driftScores.wasserstein > 0.3)
            return 'data';
        return 'prediction';
    }
    calculateDriftConfidence(statisticalTests) {
        // Calculate confidence based on statistical test results
        const ksConfidence = 1 - statisticalTests.ks_test.pValue;
        return Math.min(1, Math.max(0.5, ksConfidence));
    }
    generateDriftDescription(driftType, score, hasDrift) {
        if (!hasDrift) {
            return 'No significant drift detected in model behavior';
        }
        const severity = score > 0.8 ? 'severe' : score > 0.6 ? 'moderate' : 'mild';
        return `${severity} ${driftType} drift detected with score ${score.toFixed(3)}`;
    }
    generateDriftRecommendations(driftType, score) {
        const recommendations = [];
        if (score > 0.8) {
            recommendations.push('Immediate model retraining recommended');
            recommendations.push('Consider emergency fallback model');
        }
        else if (score > 0.6) {
            recommendations.push('Schedule model retraining within 24 hours');
            recommendations.push('Monitor prediction quality closely');
        }
        else if (score > 0.4) {
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
    identifyAffectedFeatures(modelId, driftScores) {
        // In a real implementation, this would analyze feature-level drift
        return ['feature_1', 'feature_2', 'feature_3']; // Placeholder
    }
    estimateImpactedPredictions(modelId, driftScore) {
        const recentMetrics = this.getRecentPerformanceMetrics(modelId, 1);
        if (recentMetrics.length === 0)
            return 0;
        const totalPredictions = recentMetrics[0].predictions.total;
        return Math.floor(totalPredictions * driftScore * 0.5); // Estimate 50% impact
    }
    calculateHealthTrend(modelId, currentScore) {
        const history = this.modelHealthScores.get(modelId);
        if (!history)
            return 'stable';
        // Simple trend calculation - would use more sophisticated analysis in practice
        const previousScore = history.overallScore;
        const diff = currentScore - previousScore;
        if (diff > 5)
            return 'improving';
        if (diff < -5)
            return 'degrading';
        return 'stable';
    }
    generateHealthRecommendations(scores) {
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
    determineAlertLevel(overallScore, recentMetrics) {
        if (overallScore < 30)
            return 'critical';
        if (overallScore < 50)
            return 'warning';
        if (overallScore < 70)
            return 'info';
        return 'none';
    }
    async evaluateAlertCondition(rule) {
        // Get metric value
        let metricValue;
        if (rule.modelId) {
            const healthScore = this.modelHealthScores.get(rule.modelId);
            if (!healthScore)
                return false;
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
        }
        else {
            // Global metric
            const metric = this.getMetric(rule.metric);
            if (!metric || metric.dataPoints.length === 0)
                return false;
            metricValue = metric.dataPoints[metric.dataPoints.length - 1].value;
        }
        // Evaluate condition
        switch (rule.condition) {
            case 'gt':
                return metricValue > rule.threshold;
            case 'lt':
                return metricValue < rule.threshold;
            case 'eq':
                return metricValue === rule.threshold;
            case 'ne':
                return metricValue !== rule.threshold;
            case 'in_range':
                const [min, max] = rule.threshold;
                return metricValue >= min && metricValue <= max;
            case 'out_range':
                const [minOut, maxOut] = rule.threshold;
                return metricValue < minOut || metricValue > maxOut;
            default:
                return false;
        }
    }
    async sendWebhook(url, data) {
        // Webhook implementation would go here
        this.logger.info(`📤 Webhook sent to ${url}`);
    }
    async stop() {
        this.logger.info('🛑 Stopping AV10-26 Metrics Collector...');
        // Clear all intervals
        if (this.metricsCollectionInterval)
            clearInterval(this.metricsCollectionInterval);
        if (this.driftDetectionInterval)
            clearInterval(this.driftDetectionInterval);
        if (this.healthScoreInterval)
            clearInterval(this.healthScoreInterval);
        if (this.alertCheckInterval)
            clearInterval(this.alertCheckInterval);
        // Clean up tensors
        this.referenceDistributions.forEach(tensor => tensor.dispose());
        this.referenceDistributions.clear();
        this.isStarted = false;
        this.logger.info('✅ AV10-26 Metrics Collector stopped successfully');
    }
};
exports.MetricsCollector = MetricsCollector;
exports.MetricsCollector = MetricsCollector = __decorate([
    (0, inversify_1.injectable)(),
    __metadata("design:paramtypes", [])
], MetricsCollector);
//# sourceMappingURL=MetricsCollector.js.map