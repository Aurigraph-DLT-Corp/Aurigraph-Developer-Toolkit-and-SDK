import { EventEmitter } from 'events';
import { injectable } from 'inversify';
import { Logger } from '../core/Logger';
import * as tf from '@tensorflow/tfjs-node';
import { ModelPerformance } from './AdvancedNeuralNetworkEngine';

// Core interfaces for AV11-26 Model Registry
export interface ModelMetadata {
  id: string;
  name: string;
  version: string;
  type: 'asset_valuation' | 'market_trend' | 'risk_assessment' | 'performance_forecast' | 'anomaly_detection';
  algorithm: 'lstm' | 'arima' | 'prophet' | 'random_forest' | 'xgboost' | 'neural_network' | 'transformer' | 'ensemble';
  createdAt: number;
  updatedAt: number;
  author: string;
  description: string;
  tags: string[];
  status: 'active' | 'deprecated' | 'archived' | 'training' | 'testing' | 'failed';
  environment: 'development' | 'staging' | 'production';
}

export interface ModelArtifact {
  id: string;
  modelId: string;
  version: string;
  filePath: string;
  fileSize: number;
  checksum: string;
  uploadedAt: number;
  downloadCount: number;
  storageType: 'local' | 's3' | 'gcs' | 'azure';
  compressionType: 'none' | 'gzip' | 'brotli';
}

export interface ModelConfiguration {
  hyperparameters: Record<string, any>;
  architecture: {
    layers: number;
    units: number[];
    activations: string[];
    dropoutRates: number[];
  };
  training: {
    epochs: number;
    batchSize: number;
    learningRate: number;
    optimizer: string;
    lossFunction: string;
    metrics: string[];
    earlyStopping: boolean;
    patience: number;
  };
  preprocessing: {
    normalization: string;
    featureSelection: string[];
    windowSize?: number;
    targetEncoding?: string;
  };
  validation: {
    splitRatio: number;
    crossValidation: boolean;
    folds: number;
    stratified: boolean;
  };
}

export interface ModelExperiment {
  id: string;
  name: string;
  modelId: string;
  configuration: ModelConfiguration;
  performance: ModelPerformance;
  metrics: Record<string, number>;
  startTime: number;
  endTime: number;
  duration: number;
  status: 'running' | 'completed' | 'failed' | 'cancelled';
  logs: ExperimentLog[];
  artifacts: string[];
}

export interface ExperimentLog {
  timestamp: number;
  level: 'info' | 'warn' | 'error' | 'debug';
  message: string;
  data?: Record<string, any>;
}

export interface ModelVersion {
  version: string;
  modelId: string;
  parentVersion?: string;
  changes: string[];
  performance: ModelPerformance;
  configuration: ModelConfiguration;
  createdAt: number;
  isActive: boolean;
  rollbackEnabled: boolean;
}

export interface ABTestConfiguration {
  id: string;
  name: string;
  modelA: string;
  modelB: string;
  trafficSplit: number; // 0-1, percentage to model B
  metrics: string[];
  startTime: number;
  endTime: number;
  status: 'draft' | 'running' | 'completed' | 'paused';
  significanceLevel: number;
  minimumSampleSize: number;
}

export interface ABTestResult {
  testId: string;
  modelA: {
    modelId: string;
    version: string;
    metrics: Record<string, number>;
    sampleSize: number;
  };
  modelB: {
    modelId: string;
    version: string;
    metrics: Record<string, number>;
    sampleSize: number;
  };
  winner: 'A' | 'B' | 'tie' | 'inconclusive';
  pValue: number;
  confidenceInterval: { lower: number; upper: number };
  effect: number;
  recommendation: string;
  completedAt: number;
}

export interface ModelDeployment {
  id: string;
  modelId: string;
  version: string;
  environment: 'development' | 'staging' | 'production';
  endpoint: string;
  replicas: number;
  resources: {
    cpu: string;
    memory: string;
    gpu?: string;
  };
  scaling: {
    minReplicas: number;
    maxReplicas: number;
    targetCPU: number;
    targetMemory: number;
  };
  status: 'pending' | 'deploying' | 'active' | 'failed' | 'terminating';
  deployedAt: number;
  healthCheck: {
    endpoint: string;
    interval: number;
    timeout: number;
    retries: number;
  };
}

export interface ModelMonitoring {
  modelId: string;
  version: string;
  environment: string;
  metrics: {
    latency: number[];
    throughput: number[];
    errorRate: number[];
    accuracy: number[];
    drift: number[];
  };
  alerts: ModelAlert[];
  lastUpdated: number;
}

export interface ModelAlert {
  id: string;
  modelId: string;
  type: 'performance_degradation' | 'data_drift' | 'concept_drift' | 'error_spike' | 'resource_limit';
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  threshold: number;
  actualValue: number;
  triggeredAt: number;
  resolvedAt?: number;
  actions: string[];
}

@injectable()
export class ModelRegistry extends EventEmitter {
  private logger: Logger;
  private isInitialized: boolean = false;
  
  // Model storage and metadata
  private models: Map<string, ModelMetadata> = new Map();
  private versions: Map<string, ModelVersion[]> = new Map();
  private artifacts: Map<string, ModelArtifact> = new Map();
  private configurations: Map<string, ModelConfiguration> = new Map();
  private loadedModels: Map<string, tf.LayersModel> = new Map();
  
  // Experiment and testing
  private experiments: Map<string, ModelExperiment> = new Map();
  private abTests: Map<string, ABTestConfiguration> = new Map();
  private abResults: Map<string, ABTestResult> = new Map();
  
  // Deployment and monitoring
  private deployments: Map<string, ModelDeployment> = new Map();
  private monitoring: Map<string, ModelMonitoring> = new Map();
  private alerts: Map<string, ModelAlert[]> = new Map();
  
  // Performance tracking
  private metrics = {
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
  private config = {
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
    this.logger = new Logger('ModelRegistry-AV11-26');
  }

  async initialize(): Promise<void> {
    if (this.isInitialized) {
      this.logger.warn('Model Registry already initialized');
      return;
    }

    this.logger.info('📚 Initializing AV11-26 Model Registry...');
    
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
      
      this.logger.info('✅ AV11-26 Model Registry initialized successfully');
      this.logger.info(`📊 Loaded: ${this.models.size} models, ${this.experiments.size} experiments`);
      
    } catch (error: unknown) {
      this.logger.error('❌ Failed to initialize Model Registry:', error);
      throw new Error(`Model Registry initialization failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  // Model Registration and Management
  async registerModel(
    metadata: Omit<ModelMetadata, 'id' | 'createdAt' | 'updatedAt'>,
    model: tf.LayersModel,
    configuration: ModelConfiguration
  ): Promise<string> {
    try {
      const modelId = this.generateModelId(metadata.name, metadata.type);
      const now = Date.now();
      
      const fullMetadata: ModelMetadata = {
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
      
    } catch (error: unknown) {
      this.logger.error('❌ Model registration failed:', error);
      throw new Error(`Model registration failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  async updateModel(
    modelId: string,
    model: tf.LayersModel,
    changes: string[],
    configuration?: ModelConfiguration
  ): Promise<string> {
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
      await this.createModelVersion(
        modelId, 
        newVersion, 
        configuration || this.configurations.get(modelId)!,
        changes,
        currentVersion?.version
      );
      
      // Save new artifact
      await this.saveModelArtifact(modelId, newVersion, model);
      
      // Cleanup old versions if needed
      await this.cleanupOldVersions(modelId);
      
      this.logger.info(`✅ Model updated: ${modelId} v${newVersion}`);
      this.emit('model_updated', { modelId, version: newVersion, changes });
      
      return newVersion;
      
    } catch (error: unknown) {
      this.logger.error(`❌ Model update failed for ${modelId}:`, error);
      throw error;
    }
  }

  async loadModel(modelId: string, version?: string): Promise<tf.LayersModel> {
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
      
    } catch (error: unknown) {
      this.logger.error(`❌ Model loading failed for ${modelId}:`, error);
      throw error;
    }
  }

  async deleteModel(modelId: string, force: boolean = false): Promise<void> {
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
      
    } catch (error: unknown) {
      this.logger.error(`❌ Model deletion failed for ${modelId}:`, error);
      throw error;
    }
  }

  // Model Versioning
  async createModelVersion(
    modelId: string,
    version: string,
    configuration: ModelConfiguration,
    changes: string[] = [],
    parentVersion?: string
  ): Promise<void> {
    const modelVersion: ModelVersion = {
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

  async rollbackModel(modelId: string, targetVersion: string): Promise<void> {
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
      
    } catch (error: unknown) {
      this.logger.error(`❌ Model rollback failed for ${modelId}:`, error);
      throw error;
    }
  }

  // Experiment Management
  async createExperiment(
    name: string,
    modelId: string,
    configuration: ModelConfiguration
  ): Promise<string> {
    const experimentId = this.generateExperimentId(name, modelId);
    
    const experiment: ModelExperiment = {
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

  async updateExperiment(
    experimentId: string,
    updates: Partial<ModelExperiment>
  ): Promise<void> {
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

  async logExperiment(
    experimentId: string,
    level: ExperimentLog['level'],
    message: string,
    data?: Record<string, any>
  ): Promise<void> {
    const experiment = this.experiments.get(experimentId);
    if (!experiment) {
      throw new Error(`Experiment ${experimentId} not found`);
    }
    
    const logEntry: ExperimentLog = {
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
  async createABTest(
    name: string,
    modelA: string,
    modelB: string,
    trafficSplit: number = 0.5,
    metrics: string[] = ['accuracy', 'latency'],
    duration: number = 7 * 24 * 60 * 60 * 1000 // 7 days
  ): Promise<string> {
    const testId = this.generateABTestId(name);
    
    const abTest: ABTestConfiguration = {
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

  async startABTest(testId: string): Promise<void> {
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

  async completeABTest(testId: string, results: Omit<ABTestResult, 'testId' | 'completedAt'>): Promise<void> {
    const test = this.abTests.get(testId);
    if (!test) {
      throw new Error(`A/B Test ${testId} not found`);
    }
    
    const result: ABTestResult = {
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
  async deployModel(
    modelId: string,
    version: string,
    environment: ModelDeployment['environment'],
    config: Partial<ModelDeployment> = {}
  ): Promise<string> {
    const deploymentId = this.generateDeploymentId(modelId, environment);
    
    const deployment: ModelDeployment = {
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
  async updateModelMetrics(
    modelId: string,
    version: string,
    environment: string,
    metrics: Partial<ModelMonitoring['metrics']>
  ): Promise<void> {
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
        const currentMetrics = (monitoring!.metrics as any)[metric] || [];
        const newMetrics = [...currentMetrics, ...values].slice(-maxMetrics);
        (monitoring!.metrics as any)[metric] = newMetrics;
        
        // Check for alerts
        this.checkMetricAlerts(modelId, metric, values);
      }
    });
    
    monitoring.lastUpdated = Date.now();
    this.updateGlobalMetrics(monitoring);
  }

  private checkMetricAlerts(modelId: string, metric: string, values: number[]): void {
    const latestValue = values[values.length - 1];
    const threshold = this.config.alertThresholds[metric as keyof typeof this.config.alertThresholds];
    
    if (threshold !== undefined) {
      let shouldAlert = false;
      let severity: ModelAlert['severity'] = 'low';
      
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
        this.createAlert(modelId, metric as any, severity, latestValue, threshold);
      }
    }
  }

  private createAlert(
    modelId: string,
    type: ModelAlert['type'],
    severity: ModelAlert['severity'],
    actualValue: number,
    threshold: number
  ): void {
    const alertId = `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const alert: ModelAlert = {
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

  private getAlertActions(type: ModelAlert['type'], severity: ModelAlert['severity']): string[] {
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
  getModel(modelId: string): ModelMetadata | undefined {
    return this.models.get(modelId);
  }

  getModels(filter?: Partial<ModelMetadata>): ModelMetadata[] {
    const models = Array.from(this.models.values());
    
    if (!filter) {
      return models;
    }
    
    return models.filter(model => {
      return Object.entries(filter).every(([key, value]) => 
        (model as any)[key] === value
      );
    });
  }

  getModelVersions(modelId: string): ModelVersion[] {
    return this.versions.get(modelId) || [];
  }

  getActiveVersion(modelId: string): ModelVersion | undefined {
    const versions = this.versions.get(modelId) || [];
    return versions.find(v => v.isActive);
  }

  getExperiment(experimentId: string): ModelExperiment | undefined {
    return this.experiments.get(experimentId);
  }

  getExperiments(modelId?: string): ModelExperiment[] {
    const experiments = Array.from(this.experiments.values());
    return modelId ? experiments.filter(e => e.modelId === modelId) : experiments;
  }

  getDeployments(environment?: string): ModelDeployment[] {
    const deployments = Array.from(this.deployments.values());
    return environment ? deployments.filter(d => d.environment === environment) : deployments;
  }

  getAlerts(modelId?: string): ModelAlert[] {
    if (modelId) {
      return this.alerts.get(modelId) || [];
    }
    
    return Array.from(this.alerts.values()).flat();
  }

  getMetrics(): typeof this.metrics {
    return { ...this.metrics };
  }

  // Private helper methods
  private async initializeStorage(): Promise<void> {
    // Initialize storage backends (file system, cloud storage, etc.)
    this.logger.debug('🗄️ Initializing storage systems...');
  }

  private async loadExistingModels(): Promise<void> {
    // Load models from persistent storage
    this.logger.debug('📂 Loading existing models...');
  }

  private startMonitoring(): void {
    // Real-time monitoring of deployed models
    setInterval(() => {
      this.checkModelHealth();
      this.cleanupExpiredAlerts();
    }, 30000); // Every 30 seconds
    
    this.logger.info('📊 Model monitoring started');
  }

  private setupCleanupTasks(): void {
    // Automated cleanup of old versions, experiments, logs
    setInterval(() => {
      this.performCleanup();
    }, 24 * 60 * 60 * 1000); // Daily
    
    this.logger.info('🧹 Cleanup tasks scheduled');
  }

  private setupBackupSystem(): void {
    // Regular backups of model registry
    setInterval(() => {
      this.performBackup();
    }, this.config.backupInterval);
    
    this.logger.info('💾 Backup system initialized');
  }

  private generateModelId(name: string, type: string): string {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substr(2, 9);
    return `${type}_${name}_${timestamp}_${random}`.replace(/[^a-zA-Z0-9_]/g, '_');
  }

  private generateExperimentId(name: string, modelId: string): string {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substr(2, 6);
    return `exp_${modelId}_${name}_${timestamp}_${random}`.replace(/[^a-zA-Z0-9_]/g, '_');
  }

  private generateABTestId(name: string): string {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substr(2, 6);
    return `ab_${name}_${timestamp}_${random}`.replace(/[^a-zA-Z0-9_]/g, '_');
  }

  private generateDeploymentId(modelId: string, environment: string): string {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substr(2, 6);
    return `deploy_${modelId}_${environment}_${timestamp}_${random}`;
  }

  private async saveModelArtifact(modelId: string, version: string, model: tf.LayersModel): Promise<string> {
    const filename = `${modelId}_v${version}.json`;
    const filePath = `/models/${modelId}/${filename}`;
    
    // Save model
    await model.save(`file://${filePath}`);
    
    // Create artifact metadata
    const artifact: ModelArtifact = {
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

  private async getModelArtifact(modelId: string, version?: string): Promise<ModelArtifact | undefined> {
    if (version) {
      return this.artifacts.get(`${modelId}_${version}`);
    }
    
    // Get latest version
    const versions = this.versions.get(modelId) || [];
    const latestVersion = versions[versions.length - 1];
    
    return latestVersion ? this.artifacts.get(`${modelId}_${latestVersion.version}`) : undefined;
  }

  private incrementVersion(currentVersion: string): string {
    const parts = currentVersion.split('.').map(Number);
    parts[2]++; // Increment patch version
    return parts.join('.');
  }

  private async cleanupOldVersions(modelId: string): Promise<void> {
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

  private checkModelHealth(): void {
    // Check health of deployed models
    this.deployments.forEach(deployment => {
      if (deployment.status === 'active') {
        // Simulate health check
        const isHealthy = Math.random() > 0.05; // 95% healthy
        
        if (!isHealthy) {
          this.createAlert(
            deployment.modelId,
            'resource_limit',
            'medium',
            0,
            1
          );
        }
      }
    });
  }

  private cleanupExpiredAlerts(): void {
    const now = Date.now();
    const alertExpiry = 24 * 60 * 60 * 1000; // 24 hours
    
    this.alerts.forEach((alerts, modelId) => {
      const activeAlerts = alerts.filter(alert => 
        !alert.resolvedAt && (now - alert.triggeredAt) < alertExpiry
      );
      
      if (activeAlerts.length !== alerts.length) {
        this.alerts.set(modelId, activeAlerts);
      }
    });
  }

  private performCleanup(): void {
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

  private performBackup(): void {
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

  private updateGlobalMetrics(monitoring: ModelMonitoring): void {
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
}