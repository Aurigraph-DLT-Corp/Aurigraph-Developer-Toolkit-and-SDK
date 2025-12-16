/**
 * Feature Flags V12 Configuration
 *
 * Enhanced feature flag management with environment-based configuration
 * Supports progressive feature enablement as backend APIs become available
 *
 * Usage:
 * - Set environment variables to override defaults (e.g., VITE_FEATURE_VALIDATOR_DASHBOARD=true)
 * - Use getFeatureConfig() to get feature status and metadata
 * - Check isFeatureReady() to determine if all backend dependencies are available
 *
 * @version 12.0.0
 * @author Aurigraph DLT Frontend Team
 */

// ============================================================================
// Types & Interfaces
// ============================================================================

/**
 * Backend API endpoint metadata
 */
export interface APIEndpoint {
  /** Endpoint path (e.g., /api/v11/validators) */
  path: string;
  /** HTTP method */
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH' | 'WS';
  /** Whether this endpoint is currently implemented */
  implemented: boolean;
  /** Expected implementation version */
  targetVersion?: string;
}

/**
 * Feature dependency configuration
 */
export interface FeatureDependency {
  /** Required backend API endpoints */
  endpoints: APIEndpoint[];
  /** Required environment variables */
  envVars?: string[];
  /** Required feature flags that must be enabled */
  requiredFeatures?: (keyof FeatureFlags)[];
  /** Optional WebSocket connection requirement */
  requiresWebSocket?: boolean;
  /** Optional database or service requirements */
  requires?: string[];
}

/**
 * Feature configuration with metadata
 */
export interface FeatureConfig {
  /** Feature unique identifier */
  id: keyof FeatureFlags;
  /** Human-readable feature name */
  name: string;
  /** Feature description */
  description: string;
  /** Whether feature is enabled */
  enabled: boolean;
  /** Feature category */
  category: FeatureCategory;
  /** Backend dependencies */
  dependencies: FeatureDependency;
  /** Whether all dependencies are met */
  ready: boolean;
  /** Development status */
  status: 'production' | 'beta' | 'alpha' | 'planned';
}

/**
 * Feature categories for organization
 */
export type FeatureCategory =
  | 'blockchain'
  | 'validator'
  | 'ai'
  | 'security'
  | 'cross-chain'
  | 'smart-contracts'
  | 'tokenization'
  | 'real-time';

/**
 * Core feature flags interface
 */
export interface FeatureFlags {
  // Blockchain & Consensus Features
  blockExplorer: boolean;
  transactionExplorer: boolean;
  consensusMetrics: boolean;

  // Validator & Staking Features
  validatorDashboard: boolean;
  stakingOperations: boolean;

  // AI Optimization Features
  aiOptimization: boolean;
  mlModels: boolean;
  predictiveAnalytics: boolean;

  // Security Features
  quantumSecurity: boolean;
  keyRotation: boolean;
  securityAudits: boolean;
  vulnerabilityScanning: boolean;

  // Cross-Chain Features
  crossChainBridge: boolean;
  bridgeTransfers: boolean;

  // Smart Contract Features
  smartContracts: boolean;
  ricardianContracts: boolean;

  // Tokenization Features
  tokenization: boolean;
  rwaRegistry: boolean;
  externalApiTokenization: boolean;

  // Real-time Features
  realtimeUpdates: boolean;
  websocketConnection: boolean;
}

// ============================================================================
// Feature Dependency Mappings
// ============================================================================

/**
 * Comprehensive feature dependency map
 * Documents required backend endpoints and dependencies for each feature
 */
export const featureDependencies: Record<keyof FeatureFlags, FeatureDependency> = {
  // --------------------------------------------------------------------------
  // Blockchain & Consensus Features (PRODUCTION READY)
  // --------------------------------------------------------------------------
  blockExplorer: {
    endpoints: [
      { path: '/api/v11/blocks', method: 'GET', implemented: true },
      { path: '/api/v11/blocks/:id', method: 'GET', implemented: true },
      { path: '/api/v11/blocks/latest', method: 'GET', implemented: true },
      { path: '/api/v11/blocks/search', method: 'GET', implemented: true },
    ],
    requires: ['Database', 'Consensus Engine'],
  },

  transactionExplorer: {
    endpoints: [
      { path: '/api/v11/transactions', method: 'GET', implemented: true },
      { path: '/api/v11/transactions/:id', method: 'GET', implemented: true },
      { path: '/api/v11/transactions/search', method: 'GET', implemented: true },
      { path: '/api/v11/transactions/stats', method: 'GET', implemented: true },
    ],
    requires: ['Database', 'Transaction Pool'],
  },

  consensusMetrics: {
    endpoints: [
      { path: '/api/v11/consensus/stats', method: 'GET', implemented: true },
      { path: '/api/v11/consensus/state', method: 'GET', implemented: true },
      { path: '/api/v11/stats', method: 'GET', implemented: true },
    ],
    requires: ['Consensus Engine', 'Metrics Service'],
  },

  // --------------------------------------------------------------------------
  // Validator & Staking Features (PLANNED - V12.1)
  // --------------------------------------------------------------------------
  validatorDashboard: {
    endpoints: [
      { path: '/api/v11/validators', method: 'GET', implemented: false, targetVersion: 'v12.1' },
      { path: '/api/v11/validators/:id', method: 'GET', implemented: false, targetVersion: 'v12.1' },
      { path: '/api/v11/validators/:id/stats', method: 'GET', implemented: false, targetVersion: 'v12.1' },
      { path: '/api/v11/validators/:id/performance', method: 'GET', implemented: false, targetVersion: 'v12.1' },
      { path: '/api/v11/validators/:id/rewards', method: 'GET', implemented: false, targetVersion: 'v12.1' },
    ],
    requires: ['Validator Registry', 'Staking Module', 'Rewards Engine'],
    envVars: ['VITE_VALIDATOR_REGISTRY_ENABLED'],
  },

  stakingOperations: {
    endpoints: [
      { path: '/api/v11/staking/stake', method: 'POST', implemented: false, targetVersion: 'v12.1' },
      { path: '/api/v11/staking/unstake', method: 'POST', implemented: false, targetVersion: 'v12.1' },
      { path: '/api/v11/staking/delegate', method: 'POST', implemented: false, targetVersion: 'v12.1' },
      { path: '/api/v11/staking/undelegate', method: 'POST', implemented: false, targetVersion: 'v12.1' },
      { path: '/api/v11/staking/rewards', method: 'GET', implemented: false, targetVersion: 'v12.1' },
      { path: '/api/v11/staking/positions', method: 'GET', implemented: false, targetVersion: 'v12.1' },
    ],
    requires: ['Staking Module', 'Wallet Service', 'Transaction Builder'],
    requiredFeatures: ['validatorDashboard'],
    envVars: ['VITE_STAKING_ENABLED'],
  },

  // --------------------------------------------------------------------------
  // AI Optimization Features (PLANNED - V12.2)
  // --------------------------------------------------------------------------
  aiOptimization: {
    endpoints: [
      { path: '/api/v11/ai/optimize', method: 'POST', implemented: false, targetVersion: 'v12.2' },
      { path: '/api/v11/ai/recommendations', method: 'GET', implemented: false, targetVersion: 'v12.2' },
      { path: '/api/v11/ai/config', method: 'GET', implemented: false, targetVersion: 'v12.2' },
      { path: '/api/v11/ai/config', method: 'PUT', implemented: false, targetVersion: 'v12.2' },
    ],
    requires: ['AI Engine', 'ML Model Server', 'Training Pipeline'],
    envVars: ['VITE_AI_ENABLED', 'VITE_ML_MODEL_ENDPOINT'],
  },

  mlModels: {
    endpoints: [
      { path: '/api/v11/ml/models', method: 'GET', implemented: false, targetVersion: 'v12.2' },
      { path: '/api/v11/ml/models/:id', method: 'GET', implemented: false, targetVersion: 'v12.2' },
      { path: '/api/v11/ml/models/:id/train', method: 'POST', implemented: false, targetVersion: 'v12.2' },
      { path: '/api/v11/ml/models/:id/predict', method: 'POST', implemented: false, targetVersion: 'v12.2' },
      { path: '/api/v11/ml/models/:id/evaluate', method: 'GET', implemented: false, targetVersion: 'v12.2' },
    ],
    requires: ['ML Model Server', 'Model Registry', 'Feature Store'],
    requiredFeatures: ['aiOptimization'],
    envVars: ['VITE_ML_MODELS_ENABLED'],
  },

  predictiveAnalytics: {
    endpoints: [
      { path: '/api/v11/analytics/predict', method: 'POST', implemented: false, targetVersion: 'v12.2' },
      { path: '/api/v11/analytics/forecast', method: 'GET', implemented: false, targetVersion: 'v12.2' },
      { path: '/api/v11/analytics/trends', method: 'GET', implemented: false, targetVersion: 'v12.2' },
      { path: '/api/v11/analytics/anomalies', method: 'GET', implemented: false, targetVersion: 'v12.2' },
    ],
    requires: ['Analytics Engine', 'Time Series Database', 'Prediction Service'],
    requiredFeatures: ['aiOptimization', 'mlModels'],
    envVars: ['VITE_PREDICTIVE_ANALYTICS_ENABLED'],
  },

  // --------------------------------------------------------------------------
  // Security Features (PLANNED - V12.3)
  // --------------------------------------------------------------------------
  quantumSecurity: {
    endpoints: [
      { path: '/api/v11/security/quantum/status', method: 'GET', implemented: false, targetVersion: 'v12.3' },
      { path: '/api/v11/security/quantum/encrypt', method: 'POST', implemented: false, targetVersion: 'v12.3' },
      { path: '/api/v11/security/quantum/decrypt', method: 'POST', implemented: false, targetVersion: 'v12.3' },
      { path: '/api/v11/security/quantum/sign', method: 'POST', implemented: false, targetVersion: 'v12.3' },
      { path: '/api/v11/security/quantum/verify', method: 'POST', implemented: false, targetVersion: 'v12.3' },
    ],
    requires: ['Quantum Crypto Module', 'Post-Quantum Key Management', 'Quantum RNG'],
    envVars: ['VITE_QUANTUM_SECURITY_ENABLED'],
  },

  keyRotation: {
    endpoints: [
      { path: '/api/v11/security/keys/rotate', method: 'POST', implemented: false, targetVersion: 'v12.3' },
      { path: '/api/v11/security/keys/schedule', method: 'GET', implemented: false, targetVersion: 'v12.3' },
      { path: '/api/v11/security/keys/schedule', method: 'PUT', implemented: false, targetVersion: 'v12.3' },
      { path: '/api/v11/security/keys/history', method: 'GET', implemented: false, targetVersion: 'v12.3' },
    ],
    requires: ['Key Management Service', 'HSM Integration', 'Audit Logger'],
    envVars: ['VITE_KEY_ROTATION_ENABLED'],
  },

  securityAudits: {
    endpoints: [
      { path: '/api/v11/security/audits', method: 'GET', implemented: false, targetVersion: 'v12.3' },
      { path: '/api/v11/security/audits/:id', method: 'GET', implemented: false, targetVersion: 'v12.3' },
      { path: '/api/v11/security/audits/run', method: 'POST', implemented: false, targetVersion: 'v12.3' },
      { path: '/api/v11/security/audits/reports', method: 'GET', implemented: false, targetVersion: 'v12.3' },
    ],
    requires: ['Security Audit Engine', 'Compliance Module', 'Report Generator'],
    envVars: ['VITE_SECURITY_AUDITS_ENABLED'],
  },

  vulnerabilityScanning: {
    endpoints: [
      { path: '/api/v11/security/scan', method: 'POST', implemented: false, targetVersion: 'v12.3' },
      { path: '/api/v11/security/vulnerabilities', method: 'GET', implemented: false, targetVersion: 'v12.3' },
      { path: '/api/v11/security/vulnerabilities/:id', method: 'GET', implemented: false, targetVersion: 'v12.3' },
      { path: '/api/v11/security/remediate', method: 'POST', implemented: false, targetVersion: 'v12.3' },
    ],
    requires: ['Vulnerability Scanner', 'CVE Database', 'Remediation Engine'],
    envVars: ['VITE_VULNERABILITY_SCANNING_ENABLED'],
  },

  // --------------------------------------------------------------------------
  // Cross-Chain Features (PLANNED - V12.4)
  // --------------------------------------------------------------------------
  crossChainBridge: {
    endpoints: [
      { path: '/api/v11/bridge/status', method: 'GET', implemented: false, targetVersion: 'v12.4' },
      { path: '/api/v11/bridge/chains', method: 'GET', implemented: false, targetVersion: 'v12.4' },
      { path: '/api/v11/bridge/config', method: 'GET', implemented: false, targetVersion: 'v12.4' },
      { path: '/api/v11/bridge/fees', method: 'GET', implemented: false, targetVersion: 'v12.4' },
    ],
    requires: ['Bridge Protocol', 'Cross-Chain Validator', 'Relayer Network'],
    envVars: ['VITE_CROSS_CHAIN_ENABLED'],
  },

  bridgeTransfers: {
    endpoints: [
      { path: '/api/v11/bridge/transfer', method: 'POST', implemented: false, targetVersion: 'v12.4' },
      { path: '/api/v11/bridge/transfers/:id', method: 'GET', implemented: false, targetVersion: 'v12.4' },
      { path: '/api/v11/bridge/transfers', method: 'GET', implemented: false, targetVersion: 'v12.4' },
      { path: '/api/v11/bridge/estimate', method: 'POST', implemented: false, targetVersion: 'v12.4' },
    ],
    requires: ['Bridge Protocol', 'Asset Locker', 'Proof Verifier'],
    requiredFeatures: ['crossChainBridge'],
    envVars: ['VITE_BRIDGE_TRANSFERS_ENABLED'],
  },

  // --------------------------------------------------------------------------
  // Smart Contract Features (PRODUCTION READY)
  // --------------------------------------------------------------------------
  smartContracts: {
    endpoints: [
      { path: '/api/v11/contracts', method: 'GET', implemented: true },
      { path: '/api/v11/contracts/:id', method: 'GET', implemented: true },
      { path: '/api/v11/contracts/deploy', method: 'POST', implemented: true },
      { path: '/api/v11/contracts/execute', method: 'POST', implemented: true },
    ],
    requires: ['Smart Contract Engine', 'VM Runtime', 'State Manager'],
  },

  ricardianContracts: {
    endpoints: [
      { path: '/api/v11/contracts/ricardian', method: 'GET', implemented: true },
      { path: '/api/v11/contracts/ricardian/:id', method: 'GET', implemented: true },
      { path: '/api/v11/contracts/ricardian/create', method: 'POST', implemented: true },
      { path: '/api/v11/contracts/ricardian/sign', method: 'POST', implemented: true },
    ],
    requires: ['Ricardian Contract Module', 'Legal Template Engine', 'Signature Service'],
    requiredFeatures: ['smartContracts'],
  },

  // --------------------------------------------------------------------------
  // Tokenization Features (PRODUCTION READY)
  // --------------------------------------------------------------------------
  tokenization: {
    endpoints: [
      { path: '/api/v11/tokens', method: 'GET', implemented: true },
      { path: '/api/v11/tokens/:id', method: 'GET', implemented: true },
      { path: '/api/v11/tokens/create', method: 'POST', implemented: true },
      { path: '/api/v11/tokens/mint', method: 'POST', implemented: true },
      { path: '/api/v11/tokens/burn', method: 'POST', implemented: true },
    ],
    requires: ['Token Module', 'Asset Registry', 'Compliance Engine'],
  },

  rwaRegistry: {
    endpoints: [
      { path: '/api/v11/rwa', method: 'GET', implemented: true },
      { path: '/api/v11/rwa/:id', method: 'GET', implemented: true },
      { path: '/api/v11/rwa/register', method: 'POST', implemented: true },
      { path: '/api/v11/rwa/update', method: 'PUT', implemented: true },
    ],
    requires: ['RWA Registry', 'Asset Verification', 'Oracle Integration'],
    requiredFeatures: ['tokenization'],
  },

  externalApiTokenization: {
    endpoints: [
      { path: '/api/v11/external/tokenize', method: 'POST', implemented: true },
      { path: '/api/v11/external/verify', method: 'POST', implemented: true },
      { path: '/api/v11/external/webhooks', method: 'GET', implemented: true },
      { path: '/api/v11/external/webhooks', method: 'POST', implemented: true },
    ],
    requires: ['External API Gateway', 'Webhook Handler', 'API Rate Limiter'],
    requiredFeatures: ['tokenization'],
  },

  // --------------------------------------------------------------------------
  // Real-time Features (PLANNED - V12.5)
  // --------------------------------------------------------------------------
  realtimeUpdates: {
    endpoints: [
      { path: '/api/v11/realtime/subscribe', method: 'WS', implemented: false, targetVersion: 'v12.5' },
      { path: '/api/v11/realtime/topics', method: 'GET', implemented: false, targetVersion: 'v12.5' },
    ],
    requires: ['WebSocket Server', 'Event Bus', 'Pub/Sub System'],
    requiresWebSocket: true,
    requiredFeatures: ['websocketConnection'],
    envVars: ['VITE_REALTIME_ENABLED', 'VITE_WS_URL'],
  },

  websocketConnection: {
    endpoints: [
      { path: '/ws', method: 'WS', implemented: false, targetVersion: 'v12.5' },
      { path: '/api/v11/ws/status', method: 'GET', implemented: false, targetVersion: 'v12.5' },
    ],
    requires: ['WebSocket Server', 'Connection Pool', 'Heartbeat Service'],
    requiresWebSocket: true,
    envVars: ['VITE_WS_URL'],
  },
};

// ============================================================================
// Environment-Based Configuration
// ============================================================================

/**
 * Get environment variable for feature flag
 */
const getEnvFeatureFlag = (feature: keyof FeatureFlags): boolean | undefined => {
  const envKey = `VITE_FEATURE_${feature.toUpperCase()}`;
  const envValue = import.meta.env[envKey] as string | undefined;

  if (envValue !== undefined) {
    return envValue.toLowerCase() === 'true';
  }

  return undefined;
};

/**
 * Check if all environment variables for a feature are set
 */
const checkEnvVars = (envVars?: string[]): boolean => {
  if (!envVars || envVars.length === 0) return true;

  return envVars.every(envVar => {
    const value = import.meta.env[envVar];
    return value !== undefined && value !== '';
  });
};

/**
 * Check if all required features are enabled
 */
const checkRequiredFeatures = (
  currentFlags: FeatureFlags,
  requiredFeatures?: (keyof FeatureFlags)[]
): boolean => {
  if (!requiredFeatures || requiredFeatures.length === 0) return true;

  return requiredFeatures.every(feature => currentFlags[feature]);
};

/**
 * Check if all backend endpoints are implemented
 */
const checkEndpoints = (endpoints: APIEndpoint[]): boolean => {
  return endpoints.every(endpoint => endpoint.implemented);
};

/**
 * Default feature flags based on backend API availability
 */
export const defaultFeatureFlagsV12: FeatureFlags = {
  // Blockchain & Consensus - ENABLED (production ready)
  blockExplorer: true,
  transactionExplorer: true,
  consensusMetrics: true,

  // Validator & Staking - DISABLED (APIs not implemented)
  validatorDashboard: false,
  stakingOperations: false,

  // AI Optimization - DISABLED (APIs not implemented)
  aiOptimization: false,
  mlModels: false,
  predictiveAnalytics: false,

  // Security - DISABLED (APIs not implemented)
  quantumSecurity: false,
  keyRotation: false,
  securityAudits: false,
  vulnerabilityScanning: false,

  // Cross-Chain - DISABLED (APIs not implemented)
  crossChainBridge: false,
  bridgeTransfers: false,

  // Smart Contracts - ENABLED (production ready)
  smartContracts: true,
  ricardianContracts: true,

  // Tokenization - ENABLED (production ready)
  tokenization: true,
  rwaRegistry: true,
  externalApiTokenization: true,

  // Real-time - DISABLED (WebSocket not implemented)
  realtimeUpdates: false,
  websocketConnection: false,
};

// ============================================================================
// Feature Configuration Metadata
// ============================================================================

/**
 * Feature metadata for UI display and documentation
 */
export const featureMetadata: Record<keyof FeatureFlags, Omit<FeatureConfig, 'enabled' | 'ready'>> = {
  blockExplorer: {
    id: 'blockExplorer',
    name: 'Block Explorer',
    description: 'Browse and search blockchain blocks with detailed metadata',
    category: 'blockchain',
    dependencies: featureDependencies.blockExplorer,
    status: 'production',
  },
  transactionExplorer: {
    id: 'transactionExplorer',
    name: 'Transaction Explorer',
    description: 'View and analyze transaction history and details',
    category: 'blockchain',
    dependencies: featureDependencies.transactionExplorer,
    status: 'production',
  },
  consensusMetrics: {
    id: 'consensusMetrics',
    name: 'Consensus Metrics',
    description: 'Real-time consensus algorithm performance and statistics',
    category: 'blockchain',
    dependencies: featureDependencies.consensusMetrics,
    status: 'production',
  },
  validatorDashboard: {
    id: 'validatorDashboard',
    name: 'Validator Dashboard',
    description: 'Monitor validator nodes, performance, and rewards',
    category: 'validator',
    dependencies: featureDependencies.validatorDashboard,
    status: 'planned',
  },
  stakingOperations: {
    id: 'stakingOperations',
    name: 'Staking Operations',
    description: 'Stake, unstake, delegate tokens to validators',
    category: 'validator',
    dependencies: featureDependencies.stakingOperations,
    status: 'planned',
  },
  aiOptimization: {
    id: 'aiOptimization',
    name: 'AI Optimization',
    description: 'AI-powered network and consensus optimization',
    category: 'ai',
    dependencies: featureDependencies.aiOptimization,
    status: 'planned',
  },
  mlModels: {
    id: 'mlModels',
    name: 'ML Models',
    description: 'Machine learning model management and training',
    category: 'ai',
    dependencies: featureDependencies.mlModels,
    status: 'planned',
  },
  predictiveAnalytics: {
    id: 'predictiveAnalytics',
    name: 'Predictive Analytics',
    description: 'Forecasting and trend analysis using ML',
    category: 'ai',
    dependencies: featureDependencies.predictiveAnalytics,
    status: 'planned',
  },
  quantumSecurity: {
    id: 'quantumSecurity',
    name: 'Quantum Security',
    description: 'Post-quantum cryptography and security features',
    category: 'security',
    dependencies: featureDependencies.quantumSecurity,
    status: 'planned',
  },
  keyRotation: {
    id: 'keyRotation',
    name: 'Key Rotation',
    description: 'Automated cryptographic key rotation and management',
    category: 'security',
    dependencies: featureDependencies.keyRotation,
    status: 'planned',
  },
  securityAudits: {
    id: 'securityAudits',
    name: 'Security Audits',
    description: 'Comprehensive security auditing and compliance checks',
    category: 'security',
    dependencies: featureDependencies.securityAudits,
    status: 'planned',
  },
  vulnerabilityScanning: {
    id: 'vulnerabilityScanning',
    name: 'Vulnerability Scanning',
    description: 'Automated vulnerability detection and remediation',
    category: 'security',
    dependencies: featureDependencies.vulnerabilityScanning,
    status: 'planned',
  },
  crossChainBridge: {
    id: 'crossChainBridge',
    name: 'Cross-Chain Bridge',
    description: 'Bridge protocol for cross-chain asset transfers',
    category: 'cross-chain',
    dependencies: featureDependencies.crossChainBridge,
    status: 'planned',
  },
  bridgeTransfers: {
    id: 'bridgeTransfers',
    name: 'Bridge Transfers',
    description: 'Execute cross-chain asset transfers',
    category: 'cross-chain',
    dependencies: featureDependencies.bridgeTransfers,
    status: 'planned',
  },
  smartContracts: {
    id: 'smartContracts',
    name: 'Smart Contracts',
    description: 'Deploy and execute smart contracts',
    category: 'smart-contracts',
    dependencies: featureDependencies.smartContracts,
    status: 'production',
  },
  ricardianContracts: {
    id: 'ricardianContracts',
    name: 'Ricardian Contracts',
    description: 'Legal smart contracts with human-readable terms',
    category: 'smart-contracts',
    dependencies: featureDependencies.ricardianContracts,
    status: 'production',
  },
  tokenization: {
    id: 'tokenization',
    name: 'Tokenization',
    description: 'Create and manage digital tokens',
    category: 'tokenization',
    dependencies: featureDependencies.tokenization,
    status: 'production',
  },
  rwaRegistry: {
    id: 'rwaRegistry',
    name: 'RWA Registry',
    description: 'Real-world asset tokenization and registry',
    category: 'tokenization',
    dependencies: featureDependencies.rwaRegistry,
    status: 'production',
  },
  externalApiTokenization: {
    id: 'externalApiTokenization',
    name: 'External API Tokenization',
    description: 'Tokenize assets via external API integration',
    category: 'tokenization',
    dependencies: featureDependencies.externalApiTokenization,
    status: 'production',
  },
  realtimeUpdates: {
    id: 'realtimeUpdates',
    name: 'Real-time Updates',
    description: 'Live data updates via WebSocket',
    category: 'real-time',
    dependencies: featureDependencies.realtimeUpdates,
    status: 'planned',
  },
  websocketConnection: {
    id: 'websocketConnection',
    name: 'WebSocket Connection',
    description: 'Persistent WebSocket connection for real-time data',
    category: 'real-time',
    dependencies: featureDependencies.websocketConnection,
    status: 'planned',
  },
};

// ============================================================================
// Public API
// ============================================================================

/**
 * Get feature flag value with environment override support
 */
export const isFeatureEnabled = (feature: keyof FeatureFlags): boolean => {
  // 1. Check environment variable override
  const envOverride = getEnvFeatureFlag(feature);
  if (envOverride !== undefined) {
    return envOverride;
  }

  // 2. Fall back to default configuration
  return defaultFeatureFlagsV12[feature];
};

/**
 * Check if feature is ready (all dependencies met)
 */
export const isFeatureReady = (feature: keyof FeatureFlags): boolean => {
  const deps = featureDependencies[feature];
  const currentFlags = getAllFeatureFlags();

  // Check all dependency requirements
  const endpointsReady = checkEndpoints(deps.endpoints);
  const envVarsReady = checkEnvVars(deps.envVars);
  const requiredFeaturesReady = checkRequiredFeatures(currentFlags, deps.requiredFeatures);

  return endpointsReady && envVarsReady && requiredFeaturesReady;
};

/**
 * Get complete feature configuration including metadata
 */
export const getFeatureConfig = (feature: keyof FeatureFlags): FeatureConfig => {
  const metadata = featureMetadata[feature];
  const enabled = isFeatureEnabled(feature);
  const ready = isFeatureReady(feature);

  return {
    ...metadata,
    enabled,
    ready,
  };
};

/**
 * Get all feature flags with current values
 */
export const getAllFeatureFlags = (): FeatureFlags => {
  const flags = { ...defaultFeatureFlagsV12 };

  // Apply environment overrides
  (Object.keys(flags) as (keyof FeatureFlags)[]).forEach(feature => {
    const envOverride = getEnvFeatureFlag(feature);
    if (envOverride !== undefined) {
      flags[feature] = envOverride;
    }
  });

  return flags;
};

/**
 * Get all feature configurations
 */
export const getAllFeatureConfigs = (): Record<keyof FeatureFlags, FeatureConfig> => {
  const configs = {} as Record<keyof FeatureFlags, FeatureConfig>;

  (Object.keys(featureMetadata) as (keyof FeatureFlags)[]).forEach(feature => {
    configs[feature] = getFeatureConfig(feature);
  });

  return configs;
};

/**
 * Get features by category
 */
export const getFeaturesByCategory = (category: FeatureCategory): FeatureConfig[] => {
  return Object.values(getAllFeatureConfigs()).filter(
    config => config.category === category
  );
};

/**
 * Get features by status
 */
export const getFeaturesByStatus = (
  status: 'production' | 'beta' | 'alpha' | 'planned'
): FeatureConfig[] => {
  return Object.values(getAllFeatureConfigs()).filter(
    config => config.status === status
  );
};

/**
 * Get missing dependencies for a feature
 */
export const getMissingDependencies = (feature: keyof FeatureFlags): {
  endpoints: APIEndpoint[];
  envVars: string[];
  requiredFeatures: (keyof FeatureFlags)[];
} => {
  const deps = featureDependencies[feature];
  const currentFlags = getAllFeatureFlags();

  return {
    endpoints: deps.endpoints.filter(endpoint => !endpoint.implemented),
    envVars: deps.envVars?.filter(envVar => !import.meta.env[envVar]) || [],
    requiredFeatures: deps.requiredFeatures?.filter(f => !currentFlags[f]) || [],
  };
};

/**
 * Feature flag labels for UI display
 */
export const featureFlagLabels: Record<keyof FeatureFlags, string> = {
  blockExplorer: 'Block Explorer',
  transactionExplorer: 'Transaction Explorer',
  consensusMetrics: 'Consensus Metrics',
  validatorDashboard: 'Validator Dashboard',
  stakingOperations: 'Staking Operations',
  aiOptimization: 'AI Optimization',
  mlModels: 'ML Models',
  predictiveAnalytics: 'Predictive Analytics',
  quantumSecurity: 'Quantum Security',
  keyRotation: 'Key Rotation',
  securityAudits: 'Security Audits',
  vulnerabilityScanning: 'Vulnerability Scanning',
  crossChainBridge: 'Cross-Chain Bridge',
  bridgeTransfers: 'Bridge Transfers',
  smartContracts: 'Smart Contracts',
  ricardianContracts: 'Ricardian Contracts',
  tokenization: 'Tokenization',
  rwaRegistry: 'RWA Registry',
  externalApiTokenization: 'External API Tokenization',
  realtimeUpdates: 'Real-time Updates',
  websocketConnection: 'WebSocket Connection',
};

// ============================================================================
// Export Default
// ============================================================================

export default {
  isFeatureEnabled,
  isFeatureReady,
  getFeatureConfig,
  getAllFeatureFlags,
  getAllFeatureConfigs,
  getFeaturesByCategory,
  getFeaturesByStatus,
  getMissingDependencies,
  defaultFeatureFlags: defaultFeatureFlagsV12,
  featureFlagLabels,
  featureDependencies,
  featureMetadata,
};
