"use strict";
var __esDecorate = (this && this.__esDecorate) || function (ctor, descriptorIn, decorators, contextIn, initializers, extraInitializers) {
    function accept(f) { if (f !== void 0 && typeof f !== "function") throw new TypeError("Function expected"); return f; }
    var kind = contextIn.kind, key = kind === "getter" ? "get" : kind === "setter" ? "set" : "value";
    var target = !descriptorIn && ctor ? contextIn["static"] ? ctor : ctor.prototype : null;
    var descriptor = descriptorIn || (target ? Object.getOwnPropertyDescriptor(target, contextIn.name) : {});
    var _, done = false;
    for (var i = decorators.length - 1; i >= 0; i--) {
        var context = {};
        for (var p in contextIn) context[p] = p === "access" ? {} : contextIn[p];
        for (var p in contextIn.access) context.access[p] = contextIn.access[p];
        context.addInitializer = function (f) { if (done) throw new TypeError("Cannot add initializers after decoration has completed"); extraInitializers.push(accept(f || null)); };
        var result = (0, decorators[i])(kind === "accessor" ? { get: descriptor.get, set: descriptor.set } : descriptor[key], context);
        if (kind === "accessor") {
            if (result === void 0) continue;
            if (result === null || typeof result !== "object") throw new TypeError("Object expected");
            if (_ = accept(result.get)) descriptor.get = _;
            if (_ = accept(result.set)) descriptor.set = _;
            if (_ = accept(result.init)) initializers.unshift(_);
        }
        else if (_ = accept(result)) {
            if (kind === "field") initializers.unshift(_);
            else descriptor[key] = _;
        }
    }
    if (target) Object.defineProperty(target, contextIn.name, descriptor);
    done = true;
};
var __runInitializers = (this && this.__runInitializers) || function (thisArg, initializers, value) {
    var useValue = arguments.length > 2;
    for (var i = 0; i < initializers.length; i++) {
        value = useValue ? initializers[i].call(thisArg, value) : initializers[i].call(thisArg);
    }
    return useValue ? value : void 0;
};
var __setFunctionName = (this && this.__setFunctionName) || function (f, name, prefix) {
    if (typeof name === "symbol") name = name.description ? "[".concat(name.description, "]") : "";
    return Object.defineProperty(f, "name", { configurable: true, value: prefix ? "".concat(prefix, " ", name) : name });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.FeatureStore = void 0;
const events_1 = require("events");
const inversify_1 = require("inversify");
const Logger_1 = require("../core/Logger");
const tf = require("@tensorflow/tfjs-node");
let FeatureStore = (() => {
    let _classDecorators = [(0, inversify_1.injectable)()];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    let _classSuper = events_1.EventEmitter;
    var FeatureStore = _classThis = class extends _classSuper {
        constructor() {
            super();
            this.isInitialized = false;
            // Feature definitions and metadata
            this.featureDefinitions = new Map();
            this.featureGroups = new Map();
            this.featureStatistics = new Map();
            this.featureLineage = new Map();
            // Data storage and caching
            this.featureCache = new Map();
            this.dataCache = new Map();
            this.computedFeatures = new Map();
            // Real-time processing
            this.streamProcessors = new Map();
            this.realTimeFeatures = new Map();
            this.eventQueue = [];
            // Technical indicators
            this.technicalIndicators = new Map();
            // Configuration
            this.config = {
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
            this.metrics = {
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
            this.logger = new Logger_1.Logger('FeatureStore-AV10-26');
        }
        async initialize() {
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
            }
            catch (error) {
                this.logger.error('❌ Failed to initialize Feature Store:', error);
                throw new Error(`Feature Store initialization failed: ${error.message}`);
            }
        }
        // Feature Definition Management
        async registerFeature(definition) {
            try {
                const featureDefinition = {
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
            }
            catch (error) {
                this.logger.error(`❌ Feature registration failed for ${definition.name}:`, error);
                throw error;
            }
        }
        async createFeatureGroup(name, description, features, source) {
            try {
                // Validate features exist
                for (const feature of features) {
                    if (!this.featureDefinitions.has(feature)) {
                        throw new Error(`Feature ${feature} not found`);
                    }
                }
                const featureGroup = {
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
            }
            catch (error) {
                this.logger.error(`❌ Feature group creation failed for ${name}:`, error);
                throw error;
            }
        }
        // Feature Computation and Transformation
        async computeFeatures(featureNames, entityId, timestamp = Date.now(), rawData) {
            const startTime = Date.now();
            try {
                this.logger.debug(`🔄 Computing features for entity ${entityId}: ${featureNames.join(', ')}`);
                const features = {};
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
                const featureVector = {
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
            }
            catch (error) {
                this.logger.error(`❌ Feature computation failed for entity ${entityId}:`, error);
                throw error;
            }
        }
        async batchComputeFeatures(featureNames, entityIds, timestamp = Date.now()) {
            const startTime = Date.now();
            try {
                this.logger.info(`🔄 Batch computing features for ${entityIds.length} entities`);
                const results = [];
                const batchSize = this.config.batchSize;
                // Process in batches
                for (let i = 0; i < entityIds.length; i += batchSize) {
                    const batch = entityIds.slice(i, i + batchSize);
                    const batchPromises = batch.map(entityId => this.computeFeatures(featureNames, entityId, timestamp));
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
            }
            catch (error) {
                this.logger.error('❌ Batch feature computation failed:', error);
                throw error;
            }
        }
        // Feature Serving
        async getFeatures(request) {
            const startTime = Date.now();
            try {
                this.logger.debug(`📤 Serving features: ${request.features.join(', ')}`);
                const results = [];
                for (const entityId of request.entities) {
                    const featureVector = await this.computeFeatures(request.features, entityId, request.timestamp || Date.now());
                    results.push(featureVector);
                }
                // Format response based on requested format
                const data = this.formatFeatureResponse(results, request.format);
                const response = {
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
            }
            catch (error) {
                this.logger.error('❌ Feature serving failed:', error);
                throw error;
            }
        }
        // Real-time Feature Processing
        async processRealTimeEvent(event) {
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
            }
            catch (error) {
                this.logger.error('❌ Real-time event processing failed:', error);
            }
        }
        // Technical Indicators
        calculateRSI(prices, period = 14) {
            const rsi = [];
            const gains = [];
            const losses = [];
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
                }
                else {
                    const rs = avgGain / avgLoss;
                    rsi.push(100 - (100 / (1 + rs)));
                }
            }
            return rsi;
        }
        calculateMACD(prices, fastPeriod = 12, slowPeriod = 26, signalPeriod = 9) {
            const emaFast = this.calculateEMA(prices, fastPeriod);
            const emaSlow = this.calculateEMA(prices, slowPeriod);
            const macd = [];
            for (let i = 0; i < Math.min(emaFast.length, emaSlow.length); i++) {
                macd.push(emaFast[i] - emaSlow[i]);
            }
            const signal = this.calculateEMA(macd, signalPeriod);
            const histogram = [];
            for (let i = 0; i < Math.min(macd.length, signal.length); i++) {
                histogram.push(macd[i] - signal[i]);
            }
            return { macd, signal, histogram };
        }
        calculateBollingerBands(prices, period = 20, stdDev = 2) {
            const middle = this.calculateSMA(prices, period);
            const upper = [];
            const lower = [];
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
        createPolynomialFeatures(values, degree = 2) {
            const result = [];
            for (const value of values) {
                const features = [];
                for (let d = 1; d <= degree; d++) {
                    features.push(Math.pow(value, d));
                }
                result.push(features);
            }
            return result;
        }
        createInteractionFeatures(feature1, feature2) {
            if (feature1.length !== feature2.length) {
                throw new Error('Features must have the same length');
            }
            return feature1.map((val, idx) => val * feature2[idx]);
        }
        createRollingFeatures(values, window, operation = 'mean') {
            const result = [];
            for (let i = window - 1; i < values.length; i++) {
                const windowValues = values.slice(i - window + 1, i + 1);
                let value;
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
        createLagFeatures(values, lags) {
            const result = {};
            for (const lag of lags) {
                const laggedValues = [];
                for (let i = 0; i < values.length; i++) {
                    if (i >= lag) {
                        laggedValues.push(values[i - lag]);
                    }
                    else {
                        laggedValues.push(0); // Pad with zeros
                    }
                }
                result[`lag_${lag}`] = laggedValues;
            }
            return result;
        }
        // Data Quality and Monitoring
        async calculateFeatureStatistics(featureName) {
            try {
                const feature = this.featureDefinitions.get(featureName);
                if (!feature) {
                    throw new Error(`Feature ${featureName} not found`);
                }
                // Get feature data
                const featureData = this.getFeatureData(featureName);
                const stats = {
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
                    const variance = validData.reduce((a, b) => a + Math.pow(b - stats.mean, 2), 0) / validData.length;
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
            }
            catch (error) {
                this.logger.error(`❌ Feature statistics calculation failed for ${featureName}:`, error);
                throw error;
            }
        }
        async detectDataDrift(featureName, referenceData, currentData) {
            try {
                // Population Stability Index (PSI)
                const psiScore = this.calculatePSI(referenceData, currentData);
                // Kullback-Leibler Divergence
                const klDivergence = this.calculateKLDivergence(referenceData, currentData);
                // Wasserstein Distance
                const wasserstein = this.calculateWassersteinDistance(referenceData, currentData);
                const driftScore = Math.max(psiScore, klDivergence, wasserstein / 10);
                const drift = driftScore > this.config.driftThreshold;
                let severity = 'low';
                if (driftScore > this.config.driftThreshold * 2) {
                    severity = 'high';
                }
                else if (driftScore > this.config.driftThreshold * 1.5) {
                    severity = 'medium';
                }
                const driftMetrics = {
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
            }
            catch (error) {
                this.logger.error(`❌ Drift detection failed for ${featureName}:`, error);
                throw error;
            }
        }
        // Query and Retrieval Methods
        getFeatureDefinition(name) {
            return this.featureDefinitions.get(name);
        }
        getFeatureDefinitions(filter) {
            const definitions = Array.from(this.featureDefinitions.values());
            if (!filter) {
                return definitions;
            }
            return definitions.filter(def => {
                return Object.entries(filter).every(([key, value]) => def[key] === value);
            });
        }
        getFeatureGroup(name) {
            return this.featureGroups.get(name);
        }
        getFeatureStatistics(name) {
            return this.featureStatistics.get(name);
        }
        getFeatureLineage(name) {
            return this.featureLineage.get(name);
        }
        getMetrics() {
            return { ...this.metrics };
        }
        // Private helper methods
        async initializeStorage() {
            this.logger.debug('🗄️ Initializing feature storage...');
            // Initialize storage backend (database, file system, etc.)
        }
        async loadFeatureDefinitions() {
            this.logger.debug('📂 Loading existing feature definitions...');
            // Load from persistent storage
        }
        initializeTechnicalIndicators() {
            const indicators = [
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
        async setupRealTimeProcessing() {
            // Setup event processing queue
            setInterval(() => {
                this.processEventQueue();
            }, 1000); // Process every second
            this.logger.info('⚡ Real-time processing initialized');
        }
        startMonitoring() {
            setInterval(() => {
                this.performQualityChecks();
                this.updatePerformanceMetrics();
                this.cleanupCache();
            }, this.config.monitoringInterval);
            this.logger.info('📊 Feature monitoring started');
        }
        async initializeFeaturePipelines() {
            // Initialize feature computation pipelines
            this.logger.debug('🔄 Initializing feature pipelines...');
        }
        async computeSingleFeature(definition, entityId, timestamp, rawData) {
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
        async getRawData(source, entityId, timestamp) {
            // Placeholder for data retrieval from various sources
            return { entityId, timestamp };
        }
        async applyTransformation(data, transformation) {
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
        normalize(data, params) {
            const min = params.min || 0;
            const max = params.max || 1;
            return (data.value - min) / (max - min);
        }
        standardize(data, params) {
            const mean = params.mean || 0;
            const std = params.std || 1;
            return (data.value - mean) / std;
        }
        calculateRollingMean(values, window) {
            if (values.length < window)
                return values[values.length - 1] || 0;
            const slice = values.slice(-window);
            return slice.reduce((a, b) => a + b) / slice.length;
        }
        storeFeatureVector(featureVector) {
            const key = `${featureVector.entityId}_${featureVector.timestamp}`;
            const vectors = this.featureCache.get(key) || [];
            vectors.push(featureVector);
            this.featureCache.set(key, vectors);
            // Limit cache size
            if (vectors.length > this.config.cacheSize) {
                vectors.shift();
            }
        }
        updateMetrics(featureCount, computationTime) {
            this.metrics.featuresComputed += featureCount;
            this.metrics.avgComputationTime = (this.metrics.avgComputationTime + computationTime) / 2;
            // Calculate cache hit rate
            const totalRequests = this.metrics.featuresComputed;
            const cacheHits = Array.from(this.dataCache.values()).length;
            this.metrics.cacheHitRate = totalRequests > 0 ? cacheHits / totalRequests : 0;
        }
        formatFeatureResponse(vectors, format) {
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
        convertToTensor(vectors) {
            if (vectors.length === 0) {
                return tf.zeros([0, 0]);
            }
            const features = vectors[0].features;
            const featureNames = Object.keys(features);
            const data = vectors.map(vector => featureNames.map(name => vector.features[name] || 0));
            return tf.tensor2d(data);
        }
        convertToCSV(vectors) {
            if (vectors.length === 0)
                return '';
            const featureNames = Object.keys(vectors[0].features);
            const header = ['entityId', 'timestamp', ...featureNames].join(',');
            const rows = vectors.map(vector => [
                vector.entityId,
                vector.timestamp,
                ...featureNames.map(name => vector.features[name] || '')
            ].join(','));
            return [header, ...rows].join('\n');
        }
        async processEventQueue() {
            const events = this.eventQueue.splice(0, this.config.batchSize);
            for (const eventWrapper of events) {
                try {
                    await this.processEvent(eventWrapper.event);
                    eventWrapper.processed = true;
                }
                catch (error) {
                    this.logger.error('Event processing failed:', error);
                }
            }
        }
        async processEvent(event) {
            // Process real-time event and update features
            const entityId = event.entityId || event.id;
            const relevantFeatures = this.getRelevantFeatures(event);
            if (relevantFeatures.length > 0) {
                await this.computeFeatures(relevantFeatures, entityId, Date.now(), event);
            }
        }
        getRelevantFeatures(event) {
            // Determine which features need to be updated based on the event
            return Array.from(this.featureDefinitions.keys()).filter(featureName => {
                const definition = this.featureDefinitions.get(featureName);
                return definition && this.isFeatureRelevant(definition, event);
            });
        }
        isFeatureRelevant(definition, event) {
            // Check if feature is relevant to the event
            return definition.source === event.source ||
                definition.name in event ||
                (definition.transformation?.dependencies || []).some(dep => dep in event);
        }
        performQualityChecks() {
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
        updatePerformanceMetrics() {
            // Update various performance metrics
            this.metrics.activeFeatures = Array.from(this.featureDefinitions.values())
                .filter(def => def.metadata.usage.usageCount > 0).length;
            this.metrics.storageUsed = this.featureCache.size + this.dataCache.size;
            // Emit metrics
            this.emit('performance_metrics', this.metrics);
        }
        cleanupCache() {
            const now = Date.now();
            // Cleanup expired cache entries
            for (const [key, entry] of this.dataCache.entries()) {
                if (now - entry.timestamp > this.config.cacheTTL) {
                    this.dataCache.delete(key);
                }
            }
        }
        initializeFeatureStatistics(featureName) {
            const stats = {
                featureName,
                count: 0,
                nullCount: 0,
                uniqueCount: 0,
                distribution: {},
                correlations: {}
            };
            this.featureStatistics.set(featureName, stats);
        }
        initializeFeatureLineage(featureName, transformation) {
            const lineage = {
                featureName,
                upstream: transformation?.dependencies || [],
                downstream: [],
                transformations: transformation ? [transformation] : [],
                dataflow: []
            };
            this.featureLineage.set(featureName, lineage);
        }
        getFeatureData(featureName) {
            // Get feature data from cache/storage
            const data = [];
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
        calculateSMA(values, period) {
            const sma = [];
            for (let i = period - 1; i < values.length; i++) {
                const slice = values.slice(i - period + 1, i + 1);
                sma.push(slice.reduce((a, b) => a + b) / slice.length);
            }
            return sma;
        }
        calculateEMA(values, period) {
            const ema = [];
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
        calculatePSI(reference, current) {
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
        calculateKLDivergence(reference, current) {
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
        calculateWassersteinDistance(reference, current) {
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
        createBins(data, boundaries) {
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
                for (let i = 0; i < boundaries.length - 1; i++) {
                    if (value >= boundaries[i] && value < boundaries[i + 1]) {
                        counts[i]++;
                        break;
                    }
                }
            });
            return { boundaries, counts };
        }
        createHistogram(data, bins) {
            const histogram = {};
            if (bins) {
                bins.forEach(bin => histogram[bin] = 0);
            }
            data.forEach(value => {
                const key = String(value);
                histogram[key] = (histogram[key] || 0) + 1;
            });
            return histogram;
        }
    };
    __setFunctionName(_classThis, "FeatureStore");
    (() => {
        const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(_classSuper[Symbol.metadata] ?? null) : void 0;
        __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
        FeatureStore = _classThis = _classDescriptor.value;
        if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        __runInitializers(_classThis, _classExtraInitializers);
    })();
    return FeatureStore = _classThis;
})();
exports.FeatureStore = FeatureStore;
