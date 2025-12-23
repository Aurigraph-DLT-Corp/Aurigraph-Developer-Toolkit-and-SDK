"use strict";
/**
 * AV10-10: Cross-Dimensional Tokenizer Implementation
 * AGV9-712: Advanced multi-dimensional asset tokenization system
 *
 * This tokenizer enables tokenization of assets that exist across multiple
 * dimensions, reality layers, and conceptual spaces. It supports physical,
 * digital, conceptual, temporal, and quantum-probabilistic assets.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.CrossDimensionalTokenizer = exports.RealityLayer = exports.DimensionType = void 0;
const events_1 = require("events");
const Logger_1 = require("../../core/Logger");
const ZKProofSystem_1 = require("../../zk/ZKProofSystem");
var DimensionType;
(function (DimensionType) {
    DimensionType["PHYSICAL"] = "PHYSICAL";
    DimensionType["DIGITAL"] = "DIGITAL";
    DimensionType["CONCEPTUAL"] = "CONCEPTUAL";
    DimensionType["TEMPORAL"] = "TEMPORAL";
    DimensionType["QUANTUM"] = "QUANTUM";
    DimensionType["PROBABILISTIC"] = "PROBABILISTIC";
    DimensionType["HYBRID"] = "HYBRID"; // Multi-dimensional combinations
})(DimensionType || (exports.DimensionType = DimensionType = {}));
var RealityLayer;
(function (RealityLayer) {
    RealityLayer["BASE_REALITY"] = "BASE_REALITY";
    RealityLayer["AUGMENTED"] = "AUGMENTED";
    RealityLayer["VIRTUAL"] = "VIRTUAL";
    RealityLayer["DIGITAL_TWIN"] = "DIGITAL_TWIN";
    RealityLayer["CONCEPTUAL_SPACE"] = "CONCEPTUAL_SPACE";
    RealityLayer["QUANTUM_SPACE"] = "QUANTUM_SPACE"; // Quantum probability space
})(RealityLayer || (exports.RealityLayer = RealityLayer = {}));
class CrossDimensionalTokenizer extends events_1.EventEmitter {
    logger;
    quantumCrypto;
    assetRegistry;
    zkProofSystem;
    config;
    crossDimensionalAssets = new Map();
    crossDimensionalTokens = new Map();
    dimensionalTransactions = new Map();
    // Quantum state management
    quantumStates = new Map();
    entanglementRegistry = new Map();
    coherenceMonitor;
    // Dimensional physics engine
    dimensionalPhysics = {
        constants: new Map(),
        interactions: new Map(),
        transformationRules: new Map()
    };
    constructor(quantumCrypto, assetRegistry, config) {
        super();
        this.logger = new Logger_1.Logger('CrossDimensionalTokenizer');
        this.quantumCrypto = quantumCrypto;
        this.assetRegistry = assetRegistry;
        this.zkProofSystem = new ZKProofSystem_1.ZKProofSystem();
        this.config = {
            enableQuantumSuperposition: true,
            enableTemporalProjection: true,
            enableProbabilisticSplitting: true,
            maxDimensions: 6,
            decoherenceProtection: true,
            quantumErrorCorrection: true,
            ...config
        };
        this.initializeDimensionalPhysics();
        this.startCoherenceMonitoring();
    }
    initializeDimensionalPhysics() {
        this.dimensionalPhysics = {
            constants: new Map(),
            interactions: new Map(),
            transformationRules: new Map()
        };
        // Initialize dimensional constants
        for (const dimension of Object.values(DimensionType)) {
            const constants = new Map();
            constants.set(/* @ts-ignore */ 'stability', this.getDimensionalStability(dimension));
            constants.set(/* @ts-ignore */ 'coherenceDecay', this.getCoherenceDecayRate(dimension));
            constants.set(/* @ts-ignore */ 'entanglementStrength', this.getEntanglementCapacity(dimension));
            this.dimensionalPhysics.constants.set(/* @ts-ignore */ dimension, constants);
        }
        // Initialize interaction rules
        this.dimensionalPhysics.interactions.set(/* @ts-ignore */ 'quantum_entanglement', this.calculateQuantumEntanglement.bind(this));
        this.dimensionalPhysics.interactions.set(/* @ts-ignore */ 'dimensional_resonance', this.calculateDimensionalResonance.bind(this));
        this.dimensionalPhysics.interactions.set(/* @ts-ignore */ 'probability_interference', this.calculateProbabilityInterference.bind(this));
        // Initialize transformation rules
        this.dimensionalPhysics.transformationRules.set(/* @ts-ignore */ 'PHYSICAL_to_DIGITAL', this.transformPhysicalToDigital.bind(this));
        this.dimensionalPhysics.transformationRules.set(/* @ts-ignore */ 'DIGITAL_to_QUANTUM', this.transformDigitalToQuantum.bind(this));
        this.dimensionalPhysics.transformationRules.set(/* @ts-ignore */ 'QUANTUM_to_PROBABILISTIC', this.transformQuantumToProbabilistic.bind(this));
        this.logger.info('🌌 Dimensional physics engine initialized');
    }
    getDimensionalStability(dimension) {
        const stabilityMap = {
            [DimensionType.PHYSICAL]: 0.99,
            [DimensionType.DIGITAL]: 0.95,
            [DimensionType.CONCEPTUAL]: 0.85,
            [DimensionType.TEMPORAL]: 0.70,
            [DimensionType.QUANTUM]: 0.60,
            [DimensionType.PROBABILISTIC]: 0.50,
            [DimensionType.HYBRID]: 0.75
        };
        return stabilityMap[dimension] || 0.50;
    }
    getCoherenceDecayRate(dimension) {
        const decayMap = {
            [DimensionType.PHYSICAL]: 0.001,
            [DimensionType.DIGITAL]: 0.005,
            [DimensionType.CONCEPTUAL]: 0.02,
            [DimensionType.TEMPORAL]: 0.05,
            [DimensionType.QUANTUM]: 0.1,
            [DimensionType.PROBABILISTIC]: 0.15,
            [DimensionType.HYBRID]: 0.03
        };
        return decayMap[dimension] || 0.1;
    }
    getEntanglementCapacity(dimension) {
        const capacityMap = {
            [DimensionType.PHYSICAL]: 0.3,
            [DimensionType.DIGITAL]: 0.7,
            [DimensionType.CONCEPTUAL]: 0.9,
            [DimensionType.TEMPORAL]: 0.6,
            [DimensionType.QUANTUM]: 1.0,
            [DimensionType.PROBABILISTIC]: 0.95,
            [DimensionType.HYBRID]: 0.8
        };
        return capacityMap[dimension] || 0.5;
    }
    startCoherenceMonitoring() {
        if (this.coherenceMonitor) {
            clearInterval(this.coherenceMonitor);
        }
        this.coherenceMonitor = setInterval(() => {
            this.monitorQuantumCoherence();
        }, 5000); // Monitor every 5 seconds
        this.logger.info('🔬 Quantum coherence monitoring started');
    }
    monitorQuantumCoherence() {
        for (const [assetId, asset] of this.crossDimensionalAssets) {
            if (asset.quantumState && asset.quantumState.coherence > 0) {
                // Apply decoherence
                const primaryDecayRate = this.dimensionalPhysics.constants
                    .get(asset.primaryDimension)?.get('coherenceDecay') || 0.1;
                asset.quantumState.coherence *= (1 - primaryDecayRate);
                // Check if coherence has dropped below threshold
                if (asset.quantumState.coherence < 0.1) {
                    this.handleQuantumDecoherence(assetId, asset);
                }
            }
        }
    }
    handleQuantumDecoherence(assetId, asset) {
        this.logger.warn(`🌊 Quantum decoherence detected for asset ${assetId}`);
        if (asset.quantumState) {
            // Collapse to primary dimension
            asset.dimensions = asset.dimensions.filter(d => d.dimension === asset.primaryDimension);
            asset.quantumState.superposition = false;
            asset.quantumState.coherence = 0;
            this.emit('quantum-decoherence', { assetId, asset });
        }
    }
    async createCrossDimensionalAsset(name, description, creator, dimensions, properties) {
        const assetId = `xd-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        // Validate dimensional coordinates
        if (dimensions.length > this.config.maxDimensions) {
            throw new Error(`Asset cannot exist in more than ${this.config.maxDimensions} dimensions`);
        }
        // Determine primary dimension (highest confidence)
        const primaryCoordinate = dimensions.reduce((prev, curr) => curr.confidence > prev.confidence ? curr : prev);
        const asset = {
            id: assetId,
            name,
            description,
            dimensions,
            primaryDimension: primaryCoordinate.dimension,
            primaryLayer: primaryCoordinate.layer,
            properties,
            interactions: [],
            creator,
            creationDate: new Date(),
            lastModified: new Date(),
            version: '1.0.0',
            integrity: {
                hash: await this.calculateAssetHash(assetId, name, dimensions, properties)
            }
        };
        // Initialize quantum properties if enabled
        if (this.config.enableQuantumSuperposition && dimensions.length > 1) {
            asset.quantumState = {
                superposition: true,
                entangled: false,
                coherence: 1.0,
                measurementHistory: []
            };
        }
        // Initialize temporal properties if needed
        if (dimensions.some(d => d.dimension === DimensionType.TEMPORAL) && this.config.enableTemporalProjection) {
            asset.temporalProperties = {
                timeDependent: true,
                temporalAnchors: [{
                        timestamp: new Date(),
                        dimension: primaryCoordinate.dimension,
                        state: 'created'
                    }],
                futureProjections: []
            };
        }
        // Generate quantum signature
        asset.integrity.quantumSignature = await this.quantumCrypto.sign(/* @ts-ignore */ asset.integrity.hash);
        // Generate zero-knowledge proof of asset validity
        asset.integrity.zkProof = await this.zkProofSystem.generateProof('asset_creation', { assetId, dimensions: dimensions.length, creator });
        this.crossDimensionalAssets.set(/* @ts-ignore */ assetId, asset);
        this.logger.info(`🌟 Cross-dimensional asset created: ${assetId} in ${dimensions.length} dimensions`);
        this.emit('asset-created', asset);
        return asset;
    }
    async calculateAssetHash(assetId, name, dimensions, properties) {
        const hashData = {
            assetId,
            name,
            dimensions: dimensions.map(d => ({
                dimension: d.dimension,
                layer: d.layer,
                coordinates: d.coordinates,
                confidence: d.confidence
            })),
            propertiesHash: this.hashMapStructure(properties)
        };
        return this.quantumCrypto.hash(JSON.stringify(hashData));
    }
    hashMapStructure(map) {
        const obj = {};
        for (const [key, subMap] of map) {
            obj[key] = {};
            for (const [subKey, value] of subMap) {
                obj[key][subKey] = value;
            }
        }
        return JSON.stringify(obj, Object.keys(obj).sort());
    }
    async tokenizeCrossDimensionalAsset(assetId, totalSupply, tokenStandard = 'ERC-7777-XD') {
        const asset = this.crossDimensionalAssets.get(assetId);
        if (!asset) {
            throw new Error(`Cross-dimensional asset not found: ${assetId}`);
        }
        const tokenId = `xdt-${assetId}-${Date.now()}`;
        // Calculate dimensional values
        const dimensionalValue = new Map();
        for (const coord of asset.dimensions) {
            const baseValue = totalSupply / asset.dimensions.length;
            const stabilityFactor = this.dimensionalPhysics.constants.get(coord.dimension)?.get('stability') || 0.5;
            dimensionalValue.set(/* @ts-ignore */ coord.dimension, {
                value: baseValue * coord.confidence * stabilityFactor,
                currency: this.getDimensionalCurrency(coord.dimension),
                confidence: coord.confidence * stabilityFactor
            });
        }
        // Initialize ownership across dimensions
        const dimensionalOwnership = new Map();
        for (const coord of asset.dimensions) {
            dimensionalOwnership.set(/* @ts-ignore */ coord.dimension, {
                owner: asset.creator,
                shares: totalSupply,
                restrictions: []
            });
        }
        const token = {
            tokenId,
            assetId,
            dimensionalValue,
            dimensionalOwnership,
            behaviorRules: {
                crossDimensionalTransfer: true,
                quantumSuperposition: this.config.enableQuantumSuperposition && !!asset.quantumState,
                temporalStaking: this.config.enableTemporalProjection && !!asset.temporalProperties,
                probabilisticSplitting: this.config.enableProbabilisticSplitting,
                dimensionalCollapse: {
                    enabled: true,
                    triggerConditions: ['low_coherence', 'measurement_collapse'],
                    collapseTarget: asset.primaryDimension
                }
            },
            tokenStandard,
            mintDate: new Date(),
            totalSupply,
            currentSupply: totalSupply
        };
        // Initialize quantum properties if applicable
        if (asset.quantumState && token.behaviorRules.quantumSuperposition) {
            token.quantumProperties = {
                entangledTokens: [],
                coherenceTime: 300000, // 5 minutes default
                decoherenceRate: this.dimensionalPhysics.constants.get(asset.primaryDimension)?.get('coherenceDecay') || 0.1
            };
        }
        this.crossDimensionalTokens.set(/* @ts-ignore */ tokenId, token);
        this.logger.info(`💎 Cross-dimensional token minted: ${tokenId} with ${totalSupply} supply across ${asset.dimensions.length} dimensions`);
        this.emit('token-minted', token);
        return token;
    }
    getDimensionalCurrency(dimension) {
        const currencyMap = {
            [DimensionType.PHYSICAL]: 'USD',
            [DimensionType.DIGITAL]: 'ETH',
            [DimensionType.CONCEPTUAL]: 'IDEA',
            [DimensionType.TEMPORAL]: 'TIME',
            [DimensionType.QUANTUM]: 'QUBIT',
            [DimensionType.PROBABILISTIC]: 'PROB',
            [DimensionType.HYBRID]: 'HYBRID'
        };
        return currencyMap[dimension] || 'XDT';
    }
    async executeCrossDimensionalTransaction(request) {
        const transactionId = `xdtx-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        // Validate transaction
        const token = this.crossDimensionalTokens.get(request.tokenId);
        if (!token) {
            throw new Error(`Cross-dimensional token not found: ${request.tokenId}`);
        }
        const asset = this.crossDimensionalAssets.get(token.assetId);
        if (!asset) {
            throw new Error(`Associated asset not found for token: ${request.tokenId}`);
        }
        // Check if dimensions exist in the asset
        const hasSourceDim = asset.dimensions.some(d => d.dimension === request.sourceDimension);
        const hasTargetDim = asset.dimensions.some(d => d.dimension === request.targetDimension);
        if (!hasSourceDim || !hasTargetDim) {
            throw new Error('Transaction involves dimensions not present in the asset');
        }
        // Execute dimensional transformation if needed
        if (request.sourceDimension !== request.targetDimension) {
            await this.executeDimensionalTransformation(token, request);
        }
        // Handle quantum state preservation
        if (request.preserveQuantumState && asset.quantumState) {
            await this.preserveQuantumStateInTransaction(token, request);
        }
        // Handle probabilistic splitting
        if (request.probabilityDistribution && token.behaviorRules.probabilisticSplitting) {
            await this.executeProbabilisticTransaction(token, request);
        }
        // Record transaction
        this.dimensionalTransactions.set(/* @ts-ignore */ transactionId, request);
        // Update ownership
        const sourceOwnership = token.dimensionalOwnership.get(request.sourceDimension);
        const targetOwnership = token.dimensionalOwnership.get(request.targetDimension);
        if (sourceOwnership && targetOwnership) {
            sourceOwnership.shares -= request.amount;
            targetOwnership.shares += request.amount;
            if (request.from !== request.to) {
                targetOwnership.owner = request.to;
            }
        }
        this.logger.info(`🌊 Cross-dimensional transaction executed: ${transactionId} (${request.sourceDimension} → ${request.targetDimension})`);
        this.emit('cross-dimensional-transaction', { transactionId, request, token });
        return transactionId;
    }
    async executeDimensionalTransformation(token, request) {
        const transformationKey = `${request.sourceDimension}_to_${request.targetDimension}`;
        const transformationRule = this.dimensionalPhysics.transformationRules.get(transformationKey);
        if (transformationRule) {
            const asset = this.crossDimensionalAssets.get(token.assetId);
            const transformedAsset = transformationRule(asset, request.sourceDimension, request.targetDimension);
            // Update asset with transformation results
            this.crossDimensionalAssets.set(/* @ts-ignore */ token.assetId, transformedAsset);
            this.logger.debug(`🔄 Dimensional transformation applied: ${transformationKey}`);
        }
    }
    async preserveQuantumStateInTransaction(token, request) {
        if (!token.quantumProperties)
            return;
        // Apply quantum error correction if enabled
        if (this.config.quantumErrorCorrection) {
            // Simulate quantum error correction
            const errorRate = 0.01;
            if (Math.random() < errorRate) {
                this.logger.warn(`⚡ Quantum error detected and corrected in transaction`);
            }
        }
        // Preserve entanglement relationships
        for (const entangledTokenId of token.quantumProperties.entangledTokens) {
            const entangledToken = this.crossDimensionalTokens.get(entangledTokenId);
            if (entangledToken) {
                // Update entangled token's quantum state
                this.logger.debug(`🔗 Preserving quantum entanglement with token ${entangledTokenId}`);
            }
        }
    }
    async executeProbabilisticTransaction(token, request) {
        if (!request.probabilityDistribution)
            return;
        // Execute probabilistic splitting
        for (const outcome of request.probabilityDistribution.outcomes) {
            if (Math.random() < outcome.probability) {
                // Create probabilistic outcome
                const probabilisticAmount = outcome.amount * outcome.probability;
                this.logger.debug(`🎲 Probabilistic outcome: ${probabilisticAmount} tokens in ${outcome.dimension}`);
                // Update dimensional value for this outcome
                const dimensionalValue = token.dimensionalValue.get(outcome.dimension);
                if (dimensionalValue) {
                    dimensionalValue.value += probabilisticAmount;
                    dimensionalValue.confidence *= outcome.probability;
                }
            }
        }
    }
    // Physics engine methods
    calculateQuantumEntanglement(asset1, asset2) {
        if (!asset1.quantumState || !asset2.quantumState)
            return 0;
        // Calculate entanglement strength based on dimensional overlap
        const commonDimensions = asset1.dimensions.filter(d1 => asset2.dimensions.some(d2 => d1.dimension === d2.dimension)).length;
        const maxDimensions = Math.max(asset1.dimensions.length, asset2.dimensions.length);
        const dimensionalOverlap = commonDimensions / maxDimensions;
        return dimensionalOverlap * Math.min(asset1.quantumState.coherence, asset2.quantumState.coherence);
    }
    calculateDimensionalResonance(asset1, asset2) {
        // Calculate resonance based on similar dimensional coordinates
        let totalResonance = 0;
        let comparisons = 0;
        for (const d1 of asset1.dimensions) {
            for (const d2 of asset2.dimensions) {
                if (d1.dimension === d2.dimension && d1.layer === d2.layer) {
                    // Calculate coordinate similarity
                    const coordSimilarity = this.calculateCoordinateSimilarity(d1.coordinates, d2.coordinates);
                    totalResonance += coordSimilarity * d1.confidence * d2.confidence;
                    comparisons++;
                }
            }
        }
        return comparisons > 0 ? totalResonance / comparisons : 0;
    }
    calculateCoordinateSimilarity(coord1, coord2) {
        if (coord1.length !== coord2.length)
            return 0;
        let totalDistance = 0;
        for (let i = 0; i < coord1.length; i++) {
            totalDistance += Math.abs(coord1[i] - coord2[i]);
        }
        // Convert distance to similarity (closer = more similar)
        const maxDistance = coord1.length * 100; // Assuming coordinate range of 0-100
        return Math.max(0, 1 - (totalDistance / maxDistance));
    }
    calculateProbabilityInterference(asset1, asset2) {
        // Calculate quantum interference between probabilistic assets
        const prob1 = asset1.dimensions.reduce((sum, d) => sum + d.confidence, 0) / asset1.dimensions.length;
        const prob2 = asset2.dimensions.reduce((sum, d) => sum + d.confidence, 0) / asset2.dimensions.length;
        // Quantum interference formula: |ψ1 + ψ2|²
        const interference = Math.pow(Math.sqrt(prob1) + Math.sqrt(prob2), 2);
        return Math.min(1, interference);
    }
    // Transformation methods
    transformPhysicalToDigital(asset, fromDim, toDim) {
        // Add digital twin representation
        const digitalCoordinate = {
            dimension: DimensionType.DIGITAL,
            layer: RealityLayer.DIGITAL_TWIN,
            coordinates: [Math.random() * 1000, Math.random() * 1000], // Virtual space coordinates
            confidence: 0.95,
            entanglement: [asset.id] // Link to physical original
        };
        const updatedAsset = { ...asset };
        updatedAsset.dimensions.push(digitalCoordinate);
        updatedAsset.lastModified = new Date();
        return updatedAsset;
    }
    transformDigitalToQuantum(asset, fromDim, toDim) {
        // Transform digital asset to quantum superposition
        const quantumCoordinate = {
            dimension: DimensionType.QUANTUM,
            layer: RealityLayer.QUANTUM_SPACE,
            coordinates: [Math.random(), Math.random(), Math.random()], // Quantum state vector
            confidence: 0.8,
            entanglement: [asset.id]
        };
        const updatedAsset = { ...asset };
        updatedAsset.dimensions.push(quantumCoordinate);
        // Initialize quantum state
        if (!updatedAsset.quantumState) {
            updatedAsset.quantumState = {
                superposition: true,
                entangled: false,
                coherence: 1.0,
                measurementHistory: []
            };
        }
        updatedAsset.lastModified = new Date();
        return updatedAsset;
    }
    transformQuantumToProbabilistic(asset, fromDim, toDim) {
        // Transform quantum asset to probabilistic distribution
        const probabilisticCoordinate = {
            dimension: DimensionType.PROBABILISTIC,
            layer: RealityLayer.CONCEPTUAL_SPACE,
            coordinates: [Math.random(), Math.random()], // Probability space
            confidence: 0.7,
            entanglement: [asset.id]
        };
        const updatedAsset = { ...asset };
        updatedAsset.dimensions.push(probabilisticCoordinate);
        updatedAsset.lastModified = new Date();
        return updatedAsset;
    }
    // Public API methods
    getCrossDimensionalAsset(assetId) {
        return this.crossDimensionalAssets.get(assetId);
    }
    getCrossDimensionalToken(tokenId) {
        return this.crossDimensionalTokens.get(tokenId);
    }
    getAllCrossDimensionalAssets() {
        return Array.from(this.crossDimensionalAssets.values());
    }
    getAllCrossDimensionalTokens() {
        return Array.from(this.crossDimensionalTokens.values());
    }
    getAssetsByDimension(dimension) {
        return Array.from(this.crossDimensionalAssets.values()).filter(asset => asset.dimensions.some(d => d.dimension === dimension));
    }
    getTokensByDimension(dimension) {
        return Array.from(this.crossDimensionalTokens.values()).filter(token => {
            const asset = this.crossDimensionalAssets.get(token.assetId);
            return asset?.dimensions.some(d => d.dimension === dimension) || false;
        });
    }
    getQuantumEntanglements(assetId) {
        const entanglements = this.entanglementRegistry.get(assetId);
        return entanglements || [];
    }
    async measureQuantumAsset(assetId, observer) {
        const asset = this.crossDimensionalAssets.get(assetId);
        if (!asset || !asset.quantumState) {
            throw new Error('Asset not found or not in quantum state');
        }
        // Quantum measurement causes collapse
        const measurement = {
            dimension: asset.primaryDimension,
            timestamp: new Date(),
            result: Math.random(), // Simulated measurement result
            observer
        };
        asset.quantumState.measurementHistory.push(measurement);
        // Collapse superposition
        if (asset.quantumState.superposition) {
            asset.quantumState.superposition = false;
            asset.quantumState.coherence = 0;
            // Collapse to primary dimension
            asset.dimensions = asset.dimensions.filter(d => d.dimension === asset.primaryDimension);
            this.emit('quantum-measurement', { assetId, measurement, collapsed: true });
        }
        return measurement;
    }
    getDimensionalStatistics() {
        const stats = {
            totalAssets: this.crossDimensionalAssets.size,
            totalTokens: this.crossDimensionalTokens.size,
            dimensionDistribution: new Map(),
            layerDistribution: new Map(),
            quantumAssets: 0,
            entangledAssets: 0,
            averageCoherence: 0
        };
        let totalCoherence = 0;
        let quantumCount = 0;
        for (const asset of this.crossDimensionalAssets.values()) {
            // Count dimension distribution
            for (const dim of asset.dimensions) {
                const currentCount = stats.dimensionDistribution.get(dim.dimension) || 0;
                stats.dimensionDistribution.set(/* @ts-ignore */ dim.dimension, currentCount + 1);
                const layerCount = stats.layerDistribution.get(dim.layer) || 0;
                stats.layerDistribution.set(/* @ts-ignore */ dim.layer, layerCount + 1);
            }
            // Count quantum properties
            if (asset.quantumState) {
                stats.quantumAssets++;
                totalCoherence += asset.quantumState.coherence;
                quantumCount++;
                if (asset.quantumState.entangled) {
                    stats.entangledAssets++;
                }
            }
        }
        if (quantumCount > 0) {
            stats.averageCoherence = totalCoherence / quantumCount;
        }
        return stats;
    }
    updateConfig(config) {
        this.config = { ...this.config, ...config };
        this.logger.info('Cross-dimensional tokenizer configuration updated');
        this.emit('config-updated', this.config);
    }
    getConfig() {
        return { ...this.config };
    }
    async shutdown() {
        if (this.coherenceMonitor) {
            clearInterval(this.coherenceMonitor);
            this.coherenceMonitor = undefined;
        }
        this.logger.info('🌌 Cross-dimensional tokenizer shutdown complete');
        this.emit('shutdown');
    }
}
exports.CrossDimensionalTokenizer = CrossDimensionalTokenizer;
//# sourceMappingURL=CrossDimensionalTokenizer.js.map