"use strict";
/**
 * AV10-26 Predictive Analytics Engine
 * Comprehensive ML-powered analytics for asset valuation, market forecasting, and risk assessment
 *
 * Features:
 * - Asset Valuation Predictor with real-time price forecasting
 * - Market Trend Analyzer with pattern recognition
 * - Risk Assessment Engine with portfolio optimization
 * - Performance Forecaster with system optimization
 * - Anomaly Detector with fraud and error detection
 * - ML Models: LSTM, ARIMA, Prophet, Random Forest, XGBoost, Neural Networks, Transformers, Ensemble
 * - Performance: <100ms prediction latency, >95% accuracy, 1000+ concurrent predictions
 *
 * Integration with AV10-20 RWA Tokenization Platform
 * TypeScript implementation with TensorFlow.js
 * Real-time model updates and feature store integration
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.PERFORMANCE_TARGETS = exports.SUPPORTED_MODELS = exports.AV10_26_VERSION = exports.QuantumInterferenceOptimizer = exports.NeuralNetworkEngine = exports.AIOptimizer = exports.AdvancedNeuralNetworkEngine = exports.AV1026PredictiveAnalyticsIntegration = exports.RealTimePredictionPipeline = exports.FeatureStore = exports.ModelRegistry = exports.PredictiveAnalyticsEngine = void 0;
// Core Predictive Analytics Engine
var PredictiveAnalyticsEngine_1 = require("./PredictiveAnalyticsEngine");
Object.defineProperty(exports, "PredictiveAnalyticsEngine", { enumerable: true, get: function () { return PredictiveAnalyticsEngine_1.PredictiveAnalyticsEngine; } });
// Model Registry and Management
var ModelRegistry_1 = require("./ModelRegistry");
Object.defineProperty(exports, "ModelRegistry", { enumerable: true, get: function () { return ModelRegistry_1.ModelRegistry; } });
// Feature Store and Engineering
var FeatureStore_1 = require("./FeatureStore");
Object.defineProperty(exports, "FeatureStore", { enumerable: true, get: function () { return FeatureStore_1.FeatureStore; } });
// Real-time Prediction Pipeline
var RealTimePredictionPipeline_1 = require("./RealTimePredictionPipeline");
Object.defineProperty(exports, "RealTimePredictionPipeline", { enumerable: true, get: function () { return RealTimePredictionPipeline_1.RealTimePredictionPipeline; } });
// Integration Layer
var AV10_26_PredictiveAnalyticsIntegration_1 = require("./AV10-26-PredictiveAnalyticsIntegration");
Object.defineProperty(exports, "AV1026PredictiveAnalyticsIntegration", { enumerable: true, get: function () { return AV10_26_PredictiveAnalyticsIntegration_1.AV1026PredictiveAnalyticsIntegration; } });
// Existing AI Infrastructure (re-exports for convenience)
var AdvancedNeuralNetworkEngine_1 = require("./AdvancedNeuralNetworkEngine");
Object.defineProperty(exports, "AdvancedNeuralNetworkEngine", { enumerable: true, get: function () { return AdvancedNeuralNetworkEngine_1.AdvancedNeuralNetworkEngine; } });
var AIOptimizer_1 = require("./AIOptimizer");
Object.defineProperty(exports, "AIOptimizer", { enumerable: true, get: function () { return AIOptimizer_1.AIOptimizer; } });
var NeuralNetworkEngine_1 = require("./NeuralNetworkEngine");
Object.defineProperty(exports, "NeuralNetworkEngine", { enumerable: true, get: function () { return NeuralNetworkEngine_1.NeuralNetworkEngine; } });
var QuantumInterferenceOptimizer_1 = require("./QuantumInterferenceOptimizer");
Object.defineProperty(exports, "QuantumInterferenceOptimizer", { enumerable: true, get: function () { return QuantumInterferenceOptimizer_1.QuantumInterferenceOptimizer; } });
// Constants
exports.AV10_26_VERSION = '1.0.0';
exports.SUPPORTED_MODELS = ['lstm', 'arima', 'prophet', 'random_forest', 'xgboost', 'neural_network', 'transformer', 'ensemble'];
exports.PERFORMANCE_TARGETS = {
    LATENCY: 100, // ms
    ACCURACY: 0.95, // 95%
    THROUGHPUT: 1000, // predictions/sec
    AVAILABILITY: 0.999 // 99.9%
};
//# sourceMappingURL=index-av10-26.js.map