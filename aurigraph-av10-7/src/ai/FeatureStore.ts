import { EventEmitter } from 'events';
import { injectable } from 'inversify';
import { Logger } from '../core/Logger';
import * as tf from '@tensorflow/tfjs-node';

// Core interfaces for AV10-26 Feature Store
export interface FeatureDefinition {
  name: string;
  type: 'numerical' | 'categorical' | 'text' | 'timestamp' | 'boolean';
  description: string;
  source: string;
  transformation?: FeatureTransformation;
  validation?: FeatureValidation;
  metadata: FeatureMetadata;
}

export interface FeatureTransformation {
  type: 'normalize' | 'standardize' | 'log' | 'sqrt' | 'polynomial' | 'one_hot' | 'embedding' | 'binning' | 'rolling' | 'diff' | 'lag';
  parameters: Record<string, any>;
  dependencies: string[];
  code?: string;
}

export interface FeatureValidation {
  required: boolean;
  minValue?: number;
  maxValue?: number;
  allowedValues?: any[];
  regex?: string;
  customValidation?: string;
}

export interface FeatureMetadata {
  createdAt: number;
  updatedAt: number;
  version: string;
  owner: string;
  tags: string[];
  dataQuality: {
    completeness: number;
    uniqueness: number;
    consistency: number;
    validity: number;
  };
  usage: {
    models: string[];
    lastUsed: number;
    usageCount: number;
  };
}

export interface FeatureGroup {
  name: string;
  description: string;
  features: string[];
  source: DataSource;
  refreshSchedule?: string;
  retentionDays: number;
  version: string;
  status: 'active' | 'deprecated' | 'archived';
}

export interface DataSource {
  type: 'database' | 'api' | 'file' | 'stream' | 'kafka' | 's3';
  connection: Record<string, any>;
  query?: string;
  schema: Record<string, string>;
  updateFrequency: 'real_time' | 'hourly' | 'daily' | 'weekly' | 'monthly';
}

export interface FeatureVector {
  entityId: string;
  timestamp: number;
  features: Record<string, any>;
  version: string;
  computedAt: number;
}

export interface FeatureStatistics {
  featureName: string;
  count: number;
  mean?: number;
  std?: number;
  min?: number;
  max?: number;
  percentiles?: Record<string, number>;
  nullCount: number;
  uniqueCount: number;
  distribution: Record<string, number>;
  correlations?: Record<string, number>;
  drift?: DriftMetrics;
}

export interface DriftMetrics {
  psiScore: number; // Population Stability Index
  klDivergence: number; // Kullback-Leibler Divergence
  wasserstein: number; // Wasserstein Distance
  drift: boolean;
  severity: 'low' | 'medium' | 'high';
  timestamp: number;
}

export interface FeatureLineage {
  featureName: string;
  upstream: string[];
  downstream: string[];
  transformations: FeatureTransformation[];
  dataflow: DataFlowNode[];
}

export interface DataFlowNode {
  id: string;
  type: 'source' | 'transformation' | 'aggregation' | 'join' | 'filter' | 'sink';
  operation: string;
  parameters: Record<string, any>;
  dependencies: string[];
}

export interface FeatureRequest {
  features: string[];
  entities: string[];
  timestamp?: number;
  pointInTime?: boolean;
  format: 'dataframe' | 'tensor' | 'json' | 'csv';
}

export interface FeatureResponse {
  data: any;
  metadata: {
    features: string[];
    entities: string[];
    timestamp: number;
    version: string;
    computationTime: number;
  };
}

export interface TechnicalIndicator {
  name: string;
  type: 'momentum' | 'trend' | 'volatility' | 'volume' | 'overlap';
  period: number;
  parameters: Record<string, any>;
  calculation: (data: number[], params: any) => number[];
}

@injectable()
export class FeatureStore extends EventEmitter {
  private logger: Logger;
  private isInitialized: boolean = false;
  
  // Feature definitions and metadata
  private featureDefinitions: Map<string, FeatureDefinition> = new Map();
  private featureGroups: Map<string, FeatureGroup> = new Map();
  private featureStatistics: Map<string, FeatureStatistics> = new Map();
  private featureLineage: Map<string, FeatureLineage> = new Map();
  
  // Data storage and caching
  private featureCache: Map<string, FeatureVector[]> = new Map();
  private dataCache: Map<string, any> = new Map();
  private computedFeatures: Map<string, tf.Tensor> = new Map();
  
  // Real-time processing
  private streamProcessors: Map<string, any> = new Map();
  private realTimeFeatures: Map<string, any> = new Map();
  private eventQueue: any[] = [];
  
  // Technical indicators
  private technicalIndicators: Map<string, TechnicalIndicator> = new Map();
  
  // Configuration
  private config = {
    cacheSize: 10000,
    cacheTTL: 3600000, // 1 hour
    maxFeatureAge: 86400000, // 24 hours
    batchSize: 1000,
    parallelism: 4,
    monitoringInterval: 300000, // 5 minutes
    driftThreshold: 0.1,
    qualityThreshold: 0.8,
    retentionDays: 90
  };
  
  // Performance metrics
  private metrics = {
    totalFeatures: 0,
    activeFeatures: 0,
    cacheHitRate: 0,
    avgComputationTime: 0,
    dataQualityScore: 0,
    driftDetections: 0,
    requestsPerSecond: 0,
    storageUsed: 0,
    featuresComputed: 0
  };

  constructor() {
    super();
    this.logger = new Logger('FeatureStore-AV10-26');
  }

  async initialize(): Promise<void> {
    if (this.isInitialized) {
      this.logger.warn('Feature Store already initialized');
      return;
    }

    this.logger.info('🏪 Initializing AV10-26 Feature Store...');
    
    try {
      // Initialize storage backend
      await this.initializeStorage();
      
      // Load existing feature definitions
      await this.loadFeatureDefinitions();
      
      // Initialize technical indicators
      this.initializeTechnicalIndicators();
      
      // Setup real-time processing
      await this.setupRealTimeProcessing();
      
      // Start monitoring and quality checks
      this.startMonitoring();
      
      // Initialize feature pipelines
      await this.initializeFeaturePipelines();
      
      this.isInitialized = true;
      
      this.logger.info('✅ AV10-26 Feature Store initialized successfully');
      this.logger.info(`📊 Loaded: ${this.featureDefinitions.size} features, ${this.featureGroups.size} groups`);
      
    } catch (error) {
      this.logger.error('❌ Failed to initialize Feature Store:', error);
      throw new Error(`Feature Store initialization failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  // Feature Definition Management
  async registerFeature(definition: Omit<FeatureDefinition, 'metadata'>): Promise<void> {
    try {
      const featureDefinition: FeatureDefinition = {
        ...definition,
        metadata: {
          createdAt: Date.now(),
          updatedAt: Date.now(),
          version: '1.0.0',
          owner: 'system',
          tags: [],
          dataQuality: {
            completeness: 0,
            uniqueness: 0,
            consistency: 0,
            validity: 0
          },
          usage: {
            models: [],
            lastUsed: 0,
            usageCount: 0
          }
        }
      };
      
      this.featureDefinitions.set(definition.name, featureDefinition);
      this.metrics.totalFeatures++;
      
      // Initialize feature statistics
      await this.initializeFeatureStatistics(definition.name);
      
      // Setup lineage tracking
      this.initializeFeatureLineage(definition.name, definition.transformation);
      
      this.logger.info(`✅ Feature registered: ${definition.name}`);
      this.emit('feature_registered', { feature: definition.name });
      
    } catch (error) {
      this.logger.error(`❌ Feature registration failed for ${definition.name}:`, error);
      throw error;
    }
  }

  async createFeatureGroup(
    name: string,
    description: string,
    features: string[],
    source: DataSource
  ): Promise<void> {
    try {
      // Validate features exist
      for (const feature of features) {
        if (!this.featureDefinitions.has(feature)) {
          throw new Error(`Feature ${feature} not found`);
        }
      }
      
      const featureGroup: FeatureGroup = {
        name,
        description,
        features,
        source,
        retentionDays: this.config.retentionDays,
        version: '1.0.0',
        status: 'active'
      };
      
      this.featureGroups.set(name, featureGroup);
      
      this.logger.info(`✅ Feature group created: ${name} with ${features.length} features`);
      
    } catch (error) {
      this.logger.error(`❌ Feature group creation failed for ${name}:`, error);
      throw error;
    }
  }

  // Feature Computation and Transformation
  async computeFeatures(
    featureNames: string[],
    entityId: string,
    timestamp: number = Date.now(),
    rawData?: Record<string, any>
  ): Promise<FeatureVector> {
    const startTime = Date.now();
    
    try {
      this.logger.debug(`🔄 Computing features for entity ${entityId}: ${featureNames.join(', ')}`);
      
      const features: Record<string, any> = {};
      
      for (const featureName of featureNames) {
        const definition = this.featureDefinitions.get(featureName);
        if (!definition) {
          throw new Error(`Feature definition not found: ${featureName}`);
        }
        
        // Check cache first
        const cacheKey = `${entityId}_${featureName}_${timestamp}`;
        const cachedValue = this.dataCache.get(cacheKey);
        
        if (cachedValue && Date.now() - cachedValue.timestamp < this.config.cacheTTL) {
          features[featureName] = cachedValue.value;
          continue;
        }
        
        // Compute feature
        const value = await this.computeSingleFeature(definition, entityId, timestamp, rawData);
        features[featureName] = value;
        
        // Cache result
        this.dataCache.set(cacheKey, { value, timestamp: Date.now() });
        
        // Update usage statistics
        definition.metadata.usage.lastUsed = Date.now();
        definition.metadata.usage.usageCount++;
      }
      
      const featureVector: FeatureVector = {
        entityId,
        timestamp,
        features,
        version: '1.0.0',
        computedAt: Date.now()
      };
      
      // Store feature vector
      this.storeFeatureVector(featureVector);
      
      const computationTime = Date.now() - startTime;
      this.updateMetrics(featureNames.length, computationTime);
      
      this.logger.debug(`✅ Features computed in ${computationTime}ms`);
      
      return featureVector;
      
    } catch (error) {
      this.logger.error(`❌ Feature computation failed for entity ${entityId}:`, error);
      throw error;
    }
  }

  async batchComputeFeatures(
    featureNames: string[],
    entityIds: string[],
    timestamp: number = Date.now()
  ): Promise<FeatureVector[]> {
    const startTime = Date.now();
    
    try {
      this.logger.info(`🔄 Batch computing features for ${entityIds.length} entities`);
      
      const results: FeatureVector[] = [];
      const batchSize = this.config.batchSize;
      
      // Process in batches
      for (let i = 0; i < entityIds.length; i += batchSize) {
        const batch = entityIds.slice(i, i + batchSize);
        
        const batchPromises = batch.map(entityId =>
          this.computeFeatures(featureNames, entityId, timestamp)
        );
        
        const batchResults = await Promise.all(batchPromises);
        results.push(...batchResults);
        
        // Emit progress
        this.emit('batch_progress', {
          completed: Math.min(i + batchSize, entityIds.length),
          total: entityIds.length
        });
      }
      
      const computationTime = Date.now() - startTime;
      
      this.logger.info(`✅ Batch computation completed in ${computationTime}ms: ${results.length} vectors`);
      
      return results;
      
    } catch (error) {
      this.logger.error('❌ Batch feature computation failed:', error);
      throw error;
    }
  }

  // Feature Serving
  async getFeatures(request: FeatureRequest): Promise<FeatureResponse> {
    const startTime = Date.now();
    
    try {
      this.logger.debug(`📤 Serving features: ${request.features.join(', ')}`);
      
      const results: FeatureVector[] = [];
      
      for (const entityId of request.entities) {
        const featureVector = await this.computeFeatures(
          request.features,
          entityId,
          request.timestamp || Date.now()
        );
        results.push(featureVector);
      }
      
      // Format response based on requested format
      const data = this.formatFeatureResponse(results, request.format);
      
      const response: FeatureResponse = {
        data,
        metadata: {
          features: request.features,
          entities: request.entities,
          timestamp: Date.now(),
          version: '1.0.0',
          computationTime: Date.now() - startTime
        }
      };
      
      this.logger.debug(`✅ Features served in ${response.metadata.computationTime}ms`);
      
      return response;
      
    } catch (error) {
      this.logger.error('❌ Feature serving failed:', error);
      throw error;
    }
  }

  // Real-time Feature Processing
  async processRealTimeEvent(event: Record<string, any>): Promise<void> {
    try {
      // Add to processing queue
      this.eventQueue.push({
        event,
        timestamp: Date.now(),
        processed: false
      });
      
      // Process immediately if critical
      if (event.priority === 'high') {
        await this.processEventQueue();
      }
      
    } catch (error) {
      this.logger.error('❌ Real-time event processing failed:', error);
    }
  }

  // Technical Indicators
  calculateRSI(prices: number[], period: number = 14): number[] {
    const rsi: number[] = [];
    const gains: number[] = [];
    const losses: number[] = [];
    
    // Calculate gains and losses
    for (let i = 1; i < prices.length; i++) {
      const change = prices[i] - prices[i - 1];
      gains.push(change > 0 ? change : 0);
      losses.push(change < 0 ? -change : 0);
    }
    
    // Calculate RSI
    for (let i = period - 1; i < gains.length; i++) {
      const avgGain = gains.slice(i - period + 1, i + 1).reduce((a, b) => a + b) / period;
      const avgLoss = losses.slice(i - period + 1, i + 1).reduce((a, b) => a + b) / period;
      
      if (avgLoss === 0) {
        rsi.push(100);
      } else {
        const rs = avgGain / avgLoss;
        rsi.push(100 - (100 / (1 + rs)));
      }
    }
    
    return rsi;
  }

  calculateMACD(prices: number[], fastPeriod: number = 12, slowPeriod: number = 26, signalPeriod: number = 9): {
    macd: number[];
    signal: number[];
    histogram: number[];
  } {
    const emaFast = this.calculateEMA(prices, fastPeriod);
    const emaSlow = this.calculateEMA(prices, slowPeriod);
    
    const macd: number[] = [];
    for (let i = 0; i < Math.min(emaFast.length, emaSlow.length); i++) {
      macd.push(emaFast[i] - emaSlow[i]);
    }
    
    const signal = this.calculateEMA(macd, signalPeriod);
    const histogram: number[] = [];
    
    for (let i = 0; i < Math.min(macd.length, signal.length); i++) {
      histogram.push(macd[i] - signal[i]);
    }
    
    return { macd, signal, histogram };
  }

  calculateBollingerBands(prices: number[], period: number = 20, stdDev: number = 2): {
    upper: number[];
    middle: number[];
    lower: number[];
  } {
    const middle = this.calculateSMA(prices, period);
    const upper: number[] = [];
    const lower: number[] = [];
    
    for (let i = period - 1; i < prices.length; i++) {
      const slice = prices.slice(i - period + 1, i + 1);
      const mean = slice.reduce((a, b) => a + b) / slice.length;
      const variance = slice.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / slice.length;
      const std = Math.sqrt(variance);
      
      upper.push(middle[i - period + 1] + (stdDev * std));
      lower.push(middle[i - period + 1] - (stdDev * std));
    }
    
    return { upper, middle: middle.slice(0, upper.length), lower };
  }

  // Feature Engineering Functions
  createPolynomialFeatures(values: number[], degree: number = 2): number[][] {
    const result: number[][] = [];
    
    for (const value of values) {
      const features: number[] = [];
      for (let d = 1; d <= degree; d++) {
        features.push(Math.pow(value, d));
      }
      result.push(features);
    }
    
    return result;
  }

  createInteractionFeatures(feature1: number[], feature2: number[]): number[] {
    if (feature1.length !== feature2.length) {
      throw new Error('Features must have the same length');
    }
    
    return feature1.map((val, idx) => val * feature2[idx]);
  }

  createRollingFeatures(values: number[], window: number, operation: 'mean' | 'std' | 'min' | 'max' | 'sum' = 'mean'): number[] {
    const result: number[] = [];
    
    for (let i = window - 1; i < values.length; i++) {
      const windowValues = values.slice(i - window + 1, i + 1);
      
      let value: number;
      switch (operation) {
        case 'mean':
          value = windowValues.reduce((a, b) => a + b) / windowValues.length;
          break;
        case 'std':
          const mean = windowValues.reduce((a, b) => a + b) / windowValues.length;
          value = Math.sqrt(windowValues.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / windowValues.length);
          break;
        case 'min':
          value = Math.min(...windowValues);
          break;
        case 'max':
          value = Math.max(...windowValues);
          break;
        case 'sum':
          value = windowValues.reduce((a, b) => a + b);
          break;
        default:
          value = 0;
      }
      
      result.push(value);
    }
    
    return result;
  }

  createLagFeatures(values: number[], lags: number[]): Record<string, number[]> {
    const result: Record<string, number[]> = {};
    
    for (const lag of lags) {
      const laggedValues: number[] = [];
      
      for (let i = 0; i < values.length; i++) {
        if (i >= lag) {
          laggedValues.push(values[i - lag]);
        } else {
          laggedValues.push(0); // Pad with zeros
        }
      }
      
      result[`lag_${lag}`] = laggedValues;
    }
    
    return result;
  }

  // Data Quality and Monitoring
  async calculateFeatureStatistics(featureName: string): Promise<FeatureStatistics> {
    try {
      const feature = this.featureDefinitions.get(featureName);
      if (!feature) {
        throw new Error(`Feature ${featureName} not found`);
      }
      
      // Get feature data
      const featureData = this.getFeatureData(featureName);
      
      const stats: FeatureStatistics = {
        featureName,
        count: featureData.length,
        nullCount: featureData.filter(v => v == null).length,
        uniqueCount: new Set(featureData.filter(v => v != null)).size,
        distribution: {},
        correlations: {}
      };
      
      const validData = featureData.filter(v => v != null && !isNaN(v));
      
      if (validData.length > 0 && feature.type === 'numerical') {
        stats.mean = validData.reduce((a, b) => a + b, 0) / validData.length;
        stats.min = Math.min(...validData);
        stats.max = Math.max(...validData);
        
        // Calculate standard deviation
        const variance = validData.reduce((a, b) => a + Math.pow(b - stats.mean!, 2), 0) / validData.length;
        stats.std = Math.sqrt(variance);
        
        // Calculate percentiles
        const sorted = [...validData].sort((a, b) => a - b);
        stats.percentiles = {
          '25': sorted[Math.floor(sorted.length * 0.25)],
          '50': sorted[Math.floor(sorted.length * 0.5)],
          '75': sorted[Math.floor(sorted.length * 0.75)],
          '95': sorted[Math.floor(sorted.length * 0.95)]
        };
      }
      
      // Calculate distribution
      const distribution = new Map();
      featureData.forEach(value => {
        const key = String(value);
        distribution.set(key, (distribution.get(key) || 0) + 1);
      });
      
      stats.distribution = Object.fromEntries(distribution);
      
      // Store statistics
      this.featureStatistics.set(featureName, stats);
      
      this.logger.debug(`📊 Statistics calculated for feature: ${featureName}`);
      
      return stats;
      
    } catch (error) {
      this.logger.error(`❌ Feature statistics calculation failed for ${featureName}:`, error);
      throw error;
    }
  }

  async detectDataDrift(
    featureName: string,
    referenceData: number[],
    currentData: number[]
  ): Promise<DriftMetrics> {
    try {
      // Population Stability Index (PSI)
      const psiScore = this.calculatePSI(referenceData, currentData);
      
      // Kullback-Leibler Divergence
      const klDivergence = this.calculateKLDivergence(referenceData, currentData);
      
      // Wasserstein Distance
      const wasserstein = this.calculateWassersteinDistance(referenceData, currentData);
      
      const driftScore = Math.max(psiScore, klDivergence, wasserstein / 10);
      const drift = driftScore > this.config.driftThreshold;
      
      let severity: 'low' | 'medium' | 'high' = 'low';
      if (driftScore > this.config.driftThreshold * 2) {
        severity = 'high';
      } else if (driftScore > this.config.driftThreshold * 1.5) {
        severity = 'medium';
      }
      
      const driftMetrics: DriftMetrics = {
        psiScore,
        klDivergence,
        wasserstein,
        drift,
        severity,
        timestamp: Date.now()
      };
      
      if (drift) {
        this.logger.warn(`🚨 Data drift detected for feature ${featureName}: ${severity} severity`);
        this.emit('drift_detected', { featureName, metrics: driftMetrics });
        this.metrics.driftDetections++;
      }
      
      return driftMetrics;
      
    } catch (error) {
      this.logger.error(`❌ Drift detection failed for ${featureName}:`, error);
      throw error;
    }
  }

  // Query and Retrieval Methods
  getFeatureDefinition(name: string): FeatureDefinition | undefined {
    return this.featureDefinitions.get(name);
  }

  getFeatureDefinitions(filter?: Partial<FeatureDefinition>): FeatureDefinition[] {
    const definitions = Array.from(this.featureDefinitions.values());
    
    if (!filter) {
      return definitions;
    }
    
    return definitions.filter(def => {
      return Object.entries(filter).every(([key, value]) =>
        (def as any)[key] === value
      );
    });
  }

  getFeatureGroup(name: string): FeatureGroup | undefined {
    return this.featureGroups.get(name);
  }

  getFeatureStatistics(name: string): FeatureStatistics | undefined {
    return this.featureStatistics.get(name);
  }

  getFeatureLineage(name: string): FeatureLineage | undefined {
    return this.featureLineage.get(name);
  }

  getMetrics(): typeof this.metrics {
    return { ...this.metrics };
  }

  // Private helper methods

  private async initializeStorage(): Promise<void> {
    this.logger.debug('🗄️ Initializing feature storage...');
    // Initialize storage backend (database, file system, etc.)
  }

  private async loadFeatureDefinitions(): Promise<void> {
    this.logger.debug('📂 Loading existing feature definitions...');
    // Load from persistent storage
  }

  private initializeTechnicalIndicators(): void {
    const indicators: TechnicalIndicator[] = [
      {
        name: 'RSI',
        type: 'momentum',
        period: 14,
        parameters: { period: 14 },
        calculation: (data, params) => this.calculateRSI(data, params.period)
      },
      {
        name: 'SMA',
        type: 'trend',
        period: 20,
        parameters: { period: 20 },
        calculation: (data, params) => this.calculateSMA(data, params.period)
      },
      {
        name: 'EMA',
        type: 'trend',
        period: 12,
        parameters: { period: 12 },
        calculation: (data, params) => this.calculateEMA(data, params.period)
      }
    ];
    
    indicators.forEach(indicator => {
      this.technicalIndicators.set(indicator.name, indicator);
    });
    
    this.logger.info(`📈 Technical indicators initialized: ${indicators.length} indicators`);
  }

  private async setupRealTimeProcessing(): Promise<void> {
    // Setup event processing queue
    setInterval(() => {
      this.processEventQueue();
    }, 1000); // Process every second
    
    this.logger.info('⚡ Real-time processing initialized');
  }

  private startMonitoring(): void {
    setInterval(() => {
      this.performQualityChecks();
      this.updatePerformanceMetrics();
      this.cleanupCache();
    }, this.config.monitoringInterval);
    
    this.logger.info('📊 Feature monitoring started');
  }

  private async initializeFeaturePipelines(): Promise<void> {
    // Initialize feature computation pipelines
    this.logger.debug('🔄 Initializing feature pipelines...');
  }

  private async computeSingleFeature(
    definition: FeatureDefinition,
    entityId: string,
    timestamp: number,
    rawData?: Record<string, any>
  ): Promise<any> {
    // Get raw data if not provided
    let data = rawData;
    if (!data) {
      data = await this.getRawData(definition.source, entityId, timestamp);
    }
    
    // Apply transformation if defined
    if (definition.transformation) {
      return await this.applyTransformation(data, definition.transformation);
    }
    
    // Return raw value
    return data[definition.name];
  }

  private async getRawData(source: string, entityId: string, timestamp: number): Promise<Record<string, any>> {
    // Placeholder for data retrieval from various sources
    return { entityId, timestamp };
  }

  private async applyTransformation(data: Record<string, any>, transformation: FeatureTransformation): Promise<any> {
    switch (transformation.type) {
      case 'normalize':
        return this.normalize(data, transformation.parameters);
      case 'standardize':
        return this.standardize(data, transformation.parameters);
      case 'log':
        return Math.log(data.value + 1);
      case 'sqrt':
        return Math.sqrt(Math.abs(data.value));
      case 'polynomial':
        return Math.pow(data.value, transformation.parameters.degree || 2);
      case 'rolling':
        return this.calculateRollingMean(data.values || [data.value], transformation.parameters.window || 5);
      default:
        return data.value;
    }
  }

  private normalize(data: Record<string, any>, params: any): number {
    const min = params.min || 0;
    const max = params.max || 1;
    return (data.value - min) / (max - min);
  }

  private standardize(data: Record<string, any>, params: any): number {
    const mean = params.mean || 0;
    const std = params.std || 1;
    return (data.value - mean) / std;
  }

  private calculateRollingMean(values: number[], window: number): number {
    if (values.length < window) return values[values.length - 1] || 0;
    const slice = values.slice(-window);
    return slice.reduce((a, b) => a + b) / slice.length;
  }

  private storeFeatureVector(featureVector: FeatureVector): void {
    const key = `${featureVector.entityId}_${featureVector.timestamp}`;
    const vectors = this.featureCache.get(key) || [];
    vectors.push(featureVector);
    this.featureCache.set(key, vectors);
    
    // Limit cache size
    if (vectors.length > this.config.cacheSize) {
      vectors.shift();
    }
  }

  private updateMetrics(featureCount: number, computationTime: number): void {
    this.metrics.featuresComputed += featureCount;
    this.metrics.avgComputationTime = (this.metrics.avgComputationTime + computationTime) / 2;
    
    // Calculate cache hit rate
    const totalRequests = this.metrics.featuresComputed;
    const cacheHits = Array.from(this.dataCache.values()).length;
    this.metrics.cacheHitRate = totalRequests > 0 ? cacheHits / totalRequests : 0;
  }

  private formatFeatureResponse(vectors: FeatureVector[], format: string): any {
    switch (format) {
      case 'tensor':
        return this.convertToTensor(vectors);
      case 'json':
        return vectors;
      case 'csv':
        return this.convertToCSV(vectors);
      default:
        return vectors;
    }
  }

  private convertToTensor(vectors: FeatureVector[]): tf.Tensor {
    if (vectors.length === 0) {
      return tf.zeros([0, 0]);
    }
    
    const features = vectors[0].features;
    const featureNames = Object.keys(features);
    const data = vectors.map(vector => 
      featureNames.map(name => vector.features[name] || 0)
    );
    
    return tf.tensor2d(data);
  }

  private convertToCSV(vectors: FeatureVector[]): string {
    if (vectors.length === 0) return '';
    
    const featureNames = Object.keys(vectors[0].features);
    const header = ['entityId', 'timestamp', ...featureNames].join(',');
    
    const rows = vectors.map(vector => [
      vector.entityId,
      vector.timestamp,
      ...featureNames.map(name => vector.features[name] || '')
    ].join(','));
    
    return [header, ...rows].join('\n');
  }

  private async processEventQueue(): Promise<void> {
    const events = this.eventQueue.splice(0, this.config.batchSize);
    
    for (const eventWrapper of events) {
      try {
        await this.processEvent(eventWrapper.event);
        eventWrapper.processed = true;
      } catch (error) {
        this.logger.error('Event processing failed:', error);
      }
    }
  }

  private async processEvent(event: Record<string, any>): Promise<void> {
    // Process real-time event and update features
    const entityId = event.entityId || event.id;
    const relevantFeatures = this.getRelevantFeatures(event);
    
    if (relevantFeatures.length > 0) {
      await this.computeFeatures(relevantFeatures, entityId, Date.now(), event);
    }
  }

  private getRelevantFeatures(event: Record<string, any>): string[] {
    // Determine which features need to be updated based on the event
    return Array.from(this.featureDefinitions.keys()).filter(featureName => {
      const definition = this.featureDefinitions.get(featureName);
      return definition && this.isFeatureRelevant(definition, event);
    });
  }

  private isFeatureRelevant(definition: FeatureDefinition, event: Record<string, any>): boolean {
    // Check if feature is relevant to the event
    return definition.source === event.source || 
           definition.name in event || 
           (definition.transformation?.dependencies || []).some(dep => dep in event);
  }

  private performQualityChecks(): void {
    // Perform data quality checks on features
    let totalQuality = 0;
    let featureCount = 0;
    
    this.featureDefinitions.forEach((definition, name) => {
      const stats = this.featureStatistics.get(name);
      if (stats) {
        const completeness = 1 - (stats.nullCount / stats.count);
        const quality = completeness; // Simplified quality score
        
        definition.metadata.dataQuality.completeness = completeness;
        definition.metadata.dataQuality.validity = quality;
        
        totalQuality += quality;
        featureCount++;
      }
    });
    
    this.metrics.dataQualityScore = featureCount > 0 ? totalQuality / featureCount : 0;
  }

  private updatePerformanceMetrics(): void {
    // Update various performance metrics
    this.metrics.activeFeatures = Array.from(this.featureDefinitions.values())
      .filter(def => def.metadata.usage.usageCount > 0).length;
    
    this.metrics.storageUsed = this.featureCache.size + this.dataCache.size;
    
    // Emit metrics
    this.emit('performance_metrics', this.metrics);
  }

  private cleanupCache(): void {
    const now = Date.now();
    
    // Cleanup expired cache entries
    for (const [key, entry] of this.dataCache.entries()) {
      if (now - entry.timestamp > this.config.cacheTTL) {
        this.dataCache.delete(key);
      }
    }
  }

  private initializeFeatureStatistics(featureName: string): void {
    const stats: FeatureStatistics = {
      featureName,
      count: 0,
      nullCount: 0,
      uniqueCount: 0,
      distribution: {},
      correlations: {}
    };
    
    this.featureStatistics.set(featureName, stats);
  }

  private initializeFeatureLineage(featureName: string, transformation?: FeatureTransformation): void {
    const lineage: FeatureLineage = {
      featureName,
      upstream: transformation?.dependencies || [],
      downstream: [],
      transformations: transformation ? [transformation] : [],
      dataflow: []
    };
    
    this.featureLineage.set(featureName, lineage);
  }

  private getFeatureData(featureName: string): any[] {
    // Get feature data from cache/storage
    const data: any[] = [];
    
    this.featureCache.forEach(vectors => {
      vectors.forEach(vector => {
        if (vector.features[featureName] !== undefined) {
          data.push(vector.features[featureName]);
        }
      });
    });
    
    return data;
  }

  // Statistical calculation methods
  private calculateSMA(values: number[], period: number): number[] {
    const sma: number[] = [];
    
    for (let i = period - 1; i < values.length; i++) {
      const slice = values.slice(i - period + 1, i + 1);
      sma.push(slice.reduce((a, b) => a + b) / slice.length);
    }
    
    return sma;
  }

  private calculateEMA(values: number[], period: number): number[] {
    const ema: number[] = [];
    const multiplier = 2 / (period + 1);
    
    // First EMA is SMA
    let prevEMA = values.slice(0, period).reduce((a, b) => a + b) / period;
    ema.push(prevEMA);
    
    for (let i = period; i < values.length; i++) {
      const currentEMA = (values[i] * multiplier) + (prevEMA * (1 - multiplier));
      ema.push(currentEMA);
      prevEMA = currentEMA;
    }
    
    return ema;
  }

  private calculatePSI(reference: number[], current: number[]): number {
    // Population Stability Index calculation
    const refBins = this.createBins(reference);
    const currBins = this.createBins(current, refBins.boundaries);
    
    let psi = 0;
    for (let i = 0; i < refBins.counts.length; i++) {
      const refPct = refBins.counts[i] / reference.length;
      const currPct = currBins.counts[i] / current.length;
      
      if (refPct > 0 && currPct > 0) {
        psi += (currPct - refPct) * Math.log(currPct / refPct);
      }
    }
    
    return psi;
  }

  private calculateKLDivergence(reference: number[], current: number[]): number {
    // Kullback-Leibler Divergence calculation
    const refHist = this.createHistogram(reference);
    const currHist = this.createHistogram(current, Object.keys(refHist));
    
    let kl = 0;
    for (const [key, refCount] of Object.entries(refHist)) {
      const refProb = refCount / reference.length;
      const currProb = (currHist[key] || 0) / current.length;
      
      if (refProb > 0 && currProb > 0) {
        kl += refProb * Math.log(refProb / currProb);
      }
    }
    
    return kl;
  }

  private calculateWassersteinDistance(reference: number[], current: number[]): number {
    // Simplified Wasserstein distance (1D)
    const refSorted = [...reference].sort((a, b) => a - b);
    const currSorted = [...current].sort((a, b) => a - b);
    
    const minLength = Math.min(refSorted.length, currSorted.length);
    let distance = 0;
    
    for (let i = 0; i < minLength; i++) {
      distance += Math.abs(refSorted[i] - currSorted[i]);
    }
    
    return distance / minLength;
  }

  private createBins(data: number[], boundaries?: number[]): { boundaries: number[]; counts: number[] } {
    if (!boundaries) {
      const min = Math.min(...data);
      const max = Math.max(...data);
      const numBins = 10;
      boundaries = [];
      
      for (let i = 0; i <= numBins; i++) {
        boundaries.push(min + (max - min) * i / numBins);
      }
    }
    
    const counts = new Array(boundaries.length - 1).fill(0);
    
    data.forEach(value => {
      for (let i = 0; i < boundaries!.length - 1; i++) {
        if (value >= boundaries![i] && value < boundaries![i + 1]) {
          counts[i]++;
          break;
        }
      }
    });
    
    return { boundaries, counts };
  }

  private createHistogram(data: number[], bins?: string[]): Record<string, number> {
    const histogram: Record<string, number> = {};
    
    if (bins) {
      bins.forEach(bin => histogram[bin] = 0);
    }
    
    data.forEach(value => {
      const key = String(value);
      histogram[key] = (histogram[key] || 0) + 1;
    });
    
    return histogram;
  }
}