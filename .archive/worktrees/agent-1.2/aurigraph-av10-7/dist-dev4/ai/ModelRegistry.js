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
exports.ModelRegistry = void 0;
const events_1 = require("events");
const inversify_1 = require("inversify");
const Logger_1 = require("../core/Logger");
const tf = __importStar(require("@tensorflow/tfjs-node"));
let ModelRegistry = class ModelRegistry extends events_1.EventEmitter {
    logger;
    isInitialized = false;
    // Model storage and metadata
    models = new Map();
    versions = new Map();
    artifacts = new Map();
    configurations = new Map();
    loadedModels = new Map();
    // Experiment and testing
    experiments = new Map();
    abTests = new Map();
    abResults = new Map();
    // Deployment and monitoring
    deployments = new Map();
    monitoring = new Map();
    alerts = new Map();
    // Performance tracking
    metrics = {
        totalModels: 0,
        activeModels: 0,
        experimentsRun: 0,
        deploymentsActive: 0,
        alertsActive: 0,
        averageAccuracy: 0,
        averageLatency: 0,
        storageUsed: 0
    };
    // Configuration
    config = {
        maxModelVersions: 10,
        maxExperimentLogs: 1000,
        alertThresholds: {
            accuracy: 0.85,
            latency: 200, // ms
            errorRate: 0.05,
            drift: 0.1
        },
        autoArchiveDays: 90,
        backupInterval: 3600000, // 1 hour
        compressionEnabled: true,
        encryptionEnabled: true
    };
    constructor() {
        super();
        this.logger = new Logger_1.Logger('ModelRegistry-AV10-26');
    }
    async initialize() {
        if (this.isInitialized) {
            this.logger.warn('Model Registry already initialized');
            return;
        }
        this.logger.info('📚 Initializing AV10-26 Model Registry...');
        try {
            // Initialize storage systems
            await this.initializeStorage();
            // Load existing models
            await this.loadExistingModels();
            // Start monitoring services
            this.startMonitoring();
            // Setup automated cleanup
            this.setupCleanupTasks();
            // Initialize backup system
            this.setupBackupSystem();
            this.isInitialized = true;
            this.logger.info('✅ AV10-26 Model Registry initialized successfully');
            this.logger.info(`📊 Loaded: ${this.models.size} models, ${this.experiments.size} experiments`);
        }
        catch (error) {
            this.logger.error('❌ Failed to initialize Model Registry:', error);
            throw new Error(`Model Registry initialization failed: ${error instanceof Error ? error.message : String(error)}`);
        }
    }
    // Model Registration and Management
    async registerModel(metadata, model, configuration) {
        try {
            const modelId = this.generateModelId(metadata.name, metadata.type);
            const now = Date.now();
            const fullMetadata = {
                ...metadata,
                id: modelId,
                createdAt: now,
                updatedAt: now
            };
            // Store metadata
            this.models.set(modelId, fullMetadata);
            this.configurations.set(modelId, configuration);
            this.loadedModels.set(modelId, model);
            // Create initial version
            await this.createModelVersion(modelId, '1.0.0', configuration);
            // Save model artifact
            const artifactPath = await this.saveModelArtifact(modelId, '1.0.0', model);
            // Update metrics
            this.metrics.totalModels++;
            if (metadata.status === 'active') {
                this.metrics.activeModels++;
            }
            this.logger.info(`✅ Model registered: ${modelId} v1.0.0`);
            this.emit('model_registered', { modelId, metadata: fullMetadata });
            return modelId;
        }
        catch (error) {
            this.logger.error('❌ Model registration failed:', error);
            throw new Error(`Model registration failed: ${error instanceof Error ? error.message : String(error)}`);
        }
    }
    async updateModel(modelId, model, changes, configuration) {
        try {
            const existingModel = this.models.get(modelId);
            if (!existingModel) {
                throw new Error(`Model ${modelId} not found`);
            }
            // Get current version
            const versions = this.versions.get(modelId) || [];
            const currentVersion = versions[versions.length - 1];
            const newVersion = this.incrementVersion(currentVersion?.version || '1.0.0');
            // Update model
            this.loadedModels.set(modelId, model);
            existingModel.updatedAt = Date.now();
            if (configuration) {
                this.configurations.set(modelId, configuration);
            }
            // Create new version
            await this.createModelVersion(modelId, newVersion, configuration || this.configurations.get(modelId), changes, currentVersion?.version);
            // Save new artifact
            await this.saveModelArtifact(modelId, newVersion, model);
            // Cleanup old versions if needed
            await this.cleanupOldVersions(modelId);
            this.logger.info(`✅ Model updated: ${modelId} v${newVersion}`);
            this.emit('model_updated', { modelId, version: newVersion, changes });
            return newVersion;
        }
        catch (error) {
            this.logger.error(`❌ Model update failed for ${modelId}:`, error);
            throw error;
        }
    }
    async loadModel(modelId, version) {
        try {
            // Check if model is already loaded
            const cacheKey = version ? `${modelId}_${version}` : modelId;
            const cachedModel = this.loadedModels.get(cacheKey);
            if (cachedModel) {
                this.logger.debug(`📂 Model loaded from cache: ${cacheKey}`);
                return cachedModel;
            }
            // Load from artifact
            const artifact = await this.getModelArtifact(modelId, version);
            if (!artifact) {
                throw new Error(`Model artifact not found: ${modelId} v${version || 'latest'}`);
            }
            const model = await tf.loadLayersModel(`file://${artifact.filePath}`);
            // Cache the loaded model
            this.loadedModels.set(cacheKey, model);
            // Update download count
            artifact.downloadCount++;
            this.logger.info(`✅ Model loaded: ${modelId} v${version || 'latest'}`);
            return model;
        }
        catch (error) {
            this.logger.error(`❌ Model loading failed for ${modelId}:`, error);
            throw error;
        }
    }
    async deleteModel(modelId, force = false) {
        try {
            const model = this.models.get(modelId);
            if (!model) {
                throw new Error(`Model ${modelId} not found`);
            }
            // Check if model is deployed
            const activeDeployments = Array.from(this.deployments.values())
                .filter(d => d.modelId === modelId && d.status === 'active');
            if (activeDeployments.length > 0 && !force) {
                throw new Error(`Cannot delete model ${modelId}: ${activeDeployments.length} active deployments`);
            }
            // Mark as archived instead of hard delete
            model.status = 'archived';
            model.updatedAt = Date.now();
            // Remove from active models count
            this.metrics.activeModels--;
            this.logger.info(`✅ Model archived: ${modelId}`);
            this.emit('model_deleted', { modelId, force });
        }
        catch (error) {
            this.logger.error(`❌ Model deletion failed for ${modelId}:`, error);
            throw error;
        }
    }
    // Model Versioning
    async createModelVersion(modelId, version, configuration, changes = [], parentVersion) {
        const modelVersion = {
            version,
            modelId,
            parentVersion,
            changes,
            performance: {
                accuracy: 0,
                precision: 0,
                recall: 0,
                f1Score: 0,
                auc: 0,
                loss: 0,
                trainingTime: 0,
                inferenceTime: 0,
                modelSize: 0,
                parameterCount: 0,
                flops: 0,
                memoryUsage: 0
            }, // Will be updated after evaluation
            configuration,
            createdAt: Date.now(),
            isActive: true,
            rollbackEnabled: true
        };
        const versions = this.versions.get(modelId) || [];
        // Deactivate previous versions
        versions.forEach(v => v.isActive = false);
        versions.push(modelVersion);
        this.versions.set(modelId, versions);
        this.logger.info(`📝 Version created: ${modelId} v${version}`);
    }
    async rollbackModel(modelId, targetVersion) {
        try {
            const versions = this.versions.get(modelId);
            if (!versions) {
                throw new Error(`No versions found for model ${modelId}`);
            }
            const targetVersionObj = versions.find(v => v.version === targetVersion);
            if (!targetVersionObj) {
                throw new Error(`Version ${targetVersion} not found for model ${modelId}`);
            }
            if (!targetVersionObj.rollbackEnabled) {
                throw new Error(`Rollback not enabled for version ${targetVersion}`);
            }
            // Load the target version
            const model = await this.loadModel(modelId, targetVersion);
            this.loadedModels.set(modelId, model);
            // Update active version
            versions.forEach(v => v.isActive = false);
            targetVersionObj.isActive = true;
            // Update model metadata
            const modelMetadata = this.models.get(modelId);
            if (modelMetadata) {
                modelMetadata.updatedAt = Date.now();
            }
            this.logger.info(`🔄 Model rolled back: ${modelId} to v${targetVersion}`);
            this.emit('model_rollback', { modelId, targetVersion });
        }
        catch (error) {
            this.logger.error(`❌ Model rollback failed for ${modelId}:`, error);
            throw error;
        }
    }
    // Experiment Management
    async createExperiment(name, modelId, configuration) {
        const experimentId = this.generateExperimentId(name, modelId);
        const experiment = {
            id: experimentId,
            name,
            modelId,
            configuration,
            performance: {
                accuracy: 0,
                precision: 0,
                recall: 0,
                f1Score: 0,
                auc: 0,
                loss: 0,
                trainingTime: 0,
                inferenceTime: 0,
                modelSize: 0,
                parameterCount: 0,
                flops: 0,
                memoryUsage: 0
            },
            metrics: {},
            startTime: Date.now(),
            endTime: 0,
            duration: 0,
            status: 'running',
            logs: [],
            artifacts: []
        };
        this.experiments.set(experimentId, experiment);
        this.metrics.experimentsRun++;
        this.logger.info(`🧪 Experiment created: ${experimentId}`);
        this.emit('experiment_created', { experimentId, experiment });
        return experimentId;
    }
    async updateExperiment(experimentId, updates) {
        const experiment = this.experiments.get(experimentId);
        if (!experiment) {
            throw new Error(`Experiment ${experimentId} not found`);
        }
        Object.assign(experiment, updates);
        if (updates.status === 'completed' || updates.status === 'failed') {
            experiment.endTime = Date.now();
            experiment.duration = experiment.endTime - experiment.startTime;
        }
        this.emit('experiment_updated', { experimentId, updates });
    }
    async logExperiment(experimentId, level, message, data) {
        const experiment = this.experiments.get(experimentId);
        if (!experiment) {
            throw new Error(`Experiment ${experimentId} not found`);
        }
        const logEntry = {
            timestamp: Date.now(),
            level,
            message,
            data
        };
        experiment.logs.push(logEntry);
        // Limit log entries
        if (experiment.logs.length > this.config.maxExperimentLogs) {
            experiment.logs = experiment.logs.slice(-this.config.maxExperimentLogs);
        }
    }
    // A/B Testing
    async createABTest(name, modelA, modelB, trafficSplit = 0.5, metrics = ['accuracy', 'latency'], duration = 7 * 24 * 60 * 60 * 1000 // 7 days
    ) {
        const testId = this.generateABTestId(name);
        const abTest = {
            id: testId,
            name,
            modelA,
            modelB,
            trafficSplit,
            metrics,
            startTime: Date.now(),
            endTime: Date.now() + duration,
            status: 'draft',
            significanceLevel: 0.05,
            minimumSampleSize: 1000
        };
        this.abTests.set(testId, abTest);
        this.logger.info(`🔬 A/B Test created: ${testId}`);
        return testId;
    }
    async startABTest(testId) {
        const test = this.abTests.get(testId);
        if (!test) {
            throw new Error(`A/B Test ${testId} not found`);
        }
        // Validate models exist
        if (!this.models.has(test.modelA) || !this.models.has(test.modelB)) {
            throw new Error('One or both models in A/B test do not exist');
        }
        test.status = 'running';
        test.startTime = Date.now();
        this.logger.info(`▶️ A/B Test started: ${testId}`);
        this.emit('ab_test_started', { testId, test });
    }
    async completeABTest(testId, results) {
        const test = this.abTests.get(testId);
        if (!test) {
            throw new Error(`A/B Test ${testId} not found`);
        }
        const result = {
            ...results,
            testId,
            completedAt: Date.now()
        };
        this.abResults.set(testId, result);
        test.status = 'completed';
        this.logger.info(`🏁 A/B Test completed: ${testId}, Winner: ${result.winner}`);
        this.emit('ab_test_completed', { testId, result });
    }
    // Model Deployment
    async deployModel(modelId, version, environment, config = {}) {
        const deploymentId = this.generateDeploymentId(modelId, environment);
        const deployment = {
            id: deploymentId,
            modelId,
            version,
            environment,
            endpoint: config.endpoint || `/${environment}/${modelId}`,
            replicas: config.replicas || 1,
            resources: config.resources || {
                cpu: '500m',
                memory: '1Gi'
            },
            scaling: config.scaling || {
                minReplicas: 1,
                maxReplicas: 10,
                targetCPU: 70,
                targetMemory: 80
            },
            status: 'deploying',
            deployedAt: Date.now(),
            healthCheck: config.healthCheck || {
                endpoint: '/health',
                interval: 30,
                timeout: 5,
                retries: 3
            }
        };
        this.deployments.set(deploymentId, deployment);
        // Simulate deployment process
        setTimeout(() => {
            deployment.status = 'active';
            this.metrics.deploymentsActive++;
            this.logger.info(`🚀 Deployment active: ${deploymentId}`);
            this.emit('deployment_active', { deploymentId, deployment });
        }, 5000);
        this.logger.info(`📦 Deployment started: ${deploymentId}`);
        return deploymentId;
    }
    // Monitoring and Alerting
    async updateModelMetrics(modelId, version, environment, metrics) {
        const key = `${modelId}_${version}_${environment}`;
        let monitoring = this.monitoring.get(key);
        if (!monitoring) {
            monitoring = {
                modelId,
                version,
                environment,
                metrics: {
                    latency: [],
                    throughput: [],
                    errorRate: [],
                    accuracy: [],
                    drift: []
                },
                alerts: [],
                lastUpdated: 0
            };
            this.monitoring.set(key, monitoring);
        }
        // Update metrics with rolling window
        const maxMetrics = 1000;
        Object.entries(metrics).forEach(([metric, values]) => {
            if (Array.isArray(values)) {
                const currentMetrics = monitoring.metrics[metric] || [];
                const newMetrics = [...currentMetrics, ...values].slice(-maxMetrics);
                monitoring.metrics[metric] = newMetrics;
                // Check for alerts
                this.checkMetricAlerts(modelId, metric, values);
            }
        });
        monitoring.lastUpdated = Date.now();
        this.updateGlobalMetrics(monitoring);
    }
    checkMetricAlerts(modelId, metric, values) {
        const latestValue = values[values.length - 1];
        const threshold = this.config.alertThresholds[metric];
        if (threshold !== undefined) {
            let shouldAlert = false;
            let severity = 'low';
            switch (metric) {
                case 'accuracy':
                    shouldAlert = latestValue < threshold;
                    severity = latestValue < threshold * 0.9 ? 'high' : 'medium';
                    break;
                case 'latency':
                    shouldAlert = latestValue > threshold;
                    severity = latestValue > threshold * 2 ? 'high' : 'medium';
                    break;
                case 'errorRate':
                    shouldAlert = latestValue > threshold;
                    severity = latestValue > threshold * 2 ? 'high' : 'medium';
                    break;
                case 'drift':
                    shouldAlert = latestValue > threshold;
                    severity = latestValue > threshold * 1.5 ? 'critical' : 'medium';
                    break;
            }
            if (shouldAlert) {
                this.createAlert(modelId, metric, severity, latestValue, threshold);
            }
        }
    }
    createAlert(modelId, type, severity, actualValue, threshold) {
        const alertId = `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const alert = {
            id: alertId,
            modelId,
            type,
            severity,
            message: `${type} threshold exceeded for model ${modelId}`,
            threshold,
            actualValue,
            triggeredAt: Date.now(),
            actions: this.getAlertActions(type, severity)
        };
        const modelAlerts = this.alerts.get(modelId) || [];
        modelAlerts.push(alert);
        this.alerts.set(modelId, modelAlerts);
        this.metrics.alertsActive++;
        this.logger.warn(`🚨 Alert created: ${alertId} - ${alert.message}`);
        this.emit('alert_created', alert);
    }
    getAlertActions(type, severity) {
        const actions = [];
        if (severity === 'critical') {
            actions.push('Immediately notify on-call engineer');
            actions.push('Consider emergency rollback');
        }
        switch (type) {
            case 'performance_degradation':
                actions.push('Scale up deployment resources');
                actions.push('Review recent model changes');
                break;
            case 'data_drift':
                actions.push('Retrain model with recent data');
                actions.push('Review data sources');
                break;
            case 'concept_drift':
                actions.push('Update model architecture');
                actions.push('Gather domain expert feedback');
                break;
            case 'error_spike':
                actions.push('Check input data quality');
                actions.push('Review error logs');
                break;
            case 'resource_limit':
                actions.push('Increase resource allocation');
                actions.push('Optimize model inference');
                break;
        }
        return actions;
    }
    // Query and Search Methods
    getModel(modelId) {
        return this.models.get(modelId);
    }
    getModels(filter) {
        const models = Array.from(this.models.values());
        if (!filter) {
            return models;
        }
        return models.filter(model => {
            return Object.entries(filter).every(([key, value]) => model[key] === value);
        });
    }
    getModelVersions(modelId) {
        return this.versions.get(modelId) || [];
    }
    getActiveVersion(modelId) {
        const versions = this.versions.get(modelId) || [];
        return versions.find(v => v.isActive);
    }
    getExperiment(experimentId) {
        return this.experiments.get(experimentId);
    }
    getExperiments(modelId) {
        const experiments = Array.from(this.experiments.values());
        return modelId ? experiments.filter(e => e.modelId === modelId) : experiments;
    }
    getDeployments(environment) {
        const deployments = Array.from(this.deployments.values());
        return environment ? deployments.filter(d => d.environment === environment) : deployments;
    }
    getAlerts(modelId) {
        if (modelId) {
            return this.alerts.get(modelId) || [];
        }
        return Array.from(this.alerts.values()).flat();
    }
    getMetrics() {
        return { ...this.metrics };
    }
    // Private helper methods
    async initializeStorage() {
        // Initialize storage backends (file system, cloud storage, etc.)
        this.logger.debug('🗄️ Initializing storage systems...');
    }
    async loadExistingModels() {
        // Load models from persistent storage
        this.logger.debug('📂 Loading existing models...');
    }
    startMonitoring() {
        // Real-time monitoring of deployed models
        setInterval(() => {
            this.checkModelHealth();
            this.cleanupExpiredAlerts();
        }, 30000); // Every 30 seconds
        this.logger.info('📊 Model monitoring started');
    }
    setupCleanupTasks() {
        // Automated cleanup of old versions, experiments, logs
        setInterval(() => {
            this.performCleanup();
        }, 24 * 60 * 60 * 1000); // Daily
        this.logger.info('🧹 Cleanup tasks scheduled');
    }
    setupBackupSystem() {
        // Regular backups of model registry
        setInterval(() => {
            this.performBackup();
        }, this.config.backupInterval);
        this.logger.info('💾 Backup system initialized');
    }
    generateModelId(name, type) {
        const timestamp = Date.now();
        const random = Math.random().toString(36).substr(2, 9);
        return `${type}_${name}_${timestamp}_${random}`.replace(/[^a-zA-Z0-9_]/g, '_');
    }
    generateExperimentId(name, modelId) {
        const timestamp = Date.now();
        const random = Math.random().toString(36).substr(2, 6);
        return `exp_${modelId}_${name}_${timestamp}_${random}`.replace(/[^a-zA-Z0-9_]/g, '_');
    }
    generateABTestId(name) {
        const timestamp = Date.now();
        const random = Math.random().toString(36).substr(2, 6);
        return `ab_${name}_${timestamp}_${random}`.replace(/[^a-zA-Z0-9_]/g, '_');
    }
    generateDeploymentId(modelId, environment) {
        const timestamp = Date.now();
        const random = Math.random().toString(36).substr(2, 6);
        return `deploy_${modelId}_${environment}_${timestamp}_${random}`;
    }
    async saveModelArtifact(modelId, version, model) {
        const filename = `${modelId}_v${version}.json`;
        const filePath = `/models/${modelId}/${filename}`;
        // Save model
        await model.save(`file://${filePath}`);
        // Create artifact metadata
        const artifact = {
            id: `${modelId}_${version}`,
            modelId,
            version,
            filePath,
            fileSize: 0, // Would be calculated from actual file
            checksum: 'sha256_hash', // Would be calculated
            uploadedAt: Date.now(),
            downloadCount: 0,
            storageType: 'local',
            compressionType: this.config.compressionEnabled ? 'gzip' : 'none'
        };
        this.artifacts.set(artifact.id, artifact);
        return filePath;
    }
    async getModelArtifact(modelId, version) {
        if (version) {
            return this.artifacts.get(`${modelId}_${version}`);
        }
        // Get latest version
        const versions = this.versions.get(modelId) || [];
        const latestVersion = versions[versions.length - 1];
        return latestVersion ? this.artifacts.get(`${modelId}_${latestVersion.version}`) : undefined;
    }
    incrementVersion(currentVersion) {
        const parts = currentVersion.split('.').map(Number);
        parts[2]++; // Increment patch version
        return parts.join('.');
    }
    async cleanupOldVersions(modelId) {
        const versions = this.versions.get(modelId) || [];
        if (versions.length > this.config.maxModelVersions) {
            const toRemove = versions.slice(0, versions.length - this.config.maxModelVersions);
            for (const version of toRemove) {
                // Remove artifacts
                const artifactId = `${modelId}_${version.version}`;
                this.artifacts.delete(artifactId);
            }
            // Keep only recent versions
            this.versions.set(modelId, versions.slice(-this.config.maxModelVersions));
        }
    }
    checkModelHealth() {
        // Check health of deployed models
        this.deployments.forEach(deployment => {
            if (deployment.status === 'active') {
                // Simulate health check
                const isHealthy = Math.random() > 0.05; // 95% healthy
                if (!isHealthy) {
                    this.createAlert(deployment.modelId, 'resource_limit', 'medium', 0, 1);
                }
            }
        });
    }
    cleanupExpiredAlerts() {
        const now = Date.now();
        const alertExpiry = 24 * 60 * 60 * 1000; // 24 hours
        this.alerts.forEach((alerts, modelId) => {
            const activeAlerts = alerts.filter(alert => !alert.resolvedAt && (now - alert.triggeredAt) < alertExpiry);
            if (activeAlerts.length !== alerts.length) {
                this.alerts.set(modelId, activeAlerts);
            }
        });
    }
    performCleanup() {
        this.logger.info('🧹 Performing scheduled cleanup...');
        const now = Date.now();
        const archiveThreshold = now - (this.config.autoArchiveDays * 24 * 60 * 60 * 1000);
        // Archive old experiments
        this.experiments.forEach((experiment, id) => {
            if (experiment.endTime && experiment.endTime < archiveThreshold) {
                if (experiment.status === 'completed' || experiment.status === 'failed') {
                    // Move to archive storage
                    this.experiments.delete(id);
                }
            }
        });
        this.logger.info('✅ Cleanup completed');
    }
    performBackup() {
        this.logger.info('💾 Performing backup...');
        // Backup registry state
        const backupData = {
            models: Array.from(this.models.entries()),
            versions: Array.from(this.versions.entries()),
            artifacts: Array.from(this.artifacts.entries()),
            experiments: Array.from(this.experiments.entries()),
            timestamp: Date.now()
        };
        // Save backup (simplified)
        this.logger.debug(`Backup created: ${Object.keys(backupData).length} collections`);
    }
    updateGlobalMetrics(monitoring) {
        // Update global performance metrics
        const accuracyMetrics = monitoring.metrics.accuracy;
        const latencyMetrics = monitoring.metrics.latency;
        if (accuracyMetrics.length > 0) {
            const avgAccuracy = accuracyMetrics.reduce((a, b) => a + b) / accuracyMetrics.length;
            this.metrics.averageAccuracy = (this.metrics.averageAccuracy + avgAccuracy) / 2;
        }
        if (latencyMetrics.length > 0) {
            const avgLatency = latencyMetrics.reduce((a, b) => a + b) / latencyMetrics.length;
            this.metrics.averageLatency = (this.metrics.averageLatency + avgLatency) / 2;
        }
    }
};
exports.ModelRegistry = ModelRegistry;
exports.ModelRegistry = ModelRegistry = __decorate([
    (0, inversify_1.injectable)(),
    __metadata("design:paramtypes", [])
], ModelRegistry);
//# sourceMappingURL=ModelRegistry.js.map