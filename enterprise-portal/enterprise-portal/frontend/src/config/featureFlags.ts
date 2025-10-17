/**
 * Feature Flags Configuration
 *
 * Centralized feature flag management for toggling incomplete features
 * Use this to hide/show features based on backend API availability
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

/**
 * Default feature flags - Set to false for features with missing backend APIs
 */
export const defaultFeatureFlags: FeatureFlags = {
  // Blockchain & Consensus - ENABLED (working endpoints)
  blockExplorer: true,
  transactionExplorer: true,
  consensusMetrics: true,

  // Validator & Staking - DISABLED (API endpoints not implemented yet)
  validatorDashboard: false,
  stakingOperations: false,

  // AI Optimization - DISABLED (API endpoints not fully implemented)
  aiOptimization: false,
  mlModels: false,
  predictiveAnalytics: false,

  // Security - DISABLED (API endpoints not implemented yet)
  quantumSecurity: false,
  keyRotation: false,
  securityAudits: false,
  vulnerabilityScanning: false,

  // Cross-Chain - DISABLED (API endpoints not implemented yet)
  crossChainBridge: false,
  bridgeTransfers: false,

  // Smart Contract - ENABLED (API endpoints available)
  smartContracts: true,
  ricardianContracts: true,

  // Tokenization - ENABLED (API endpoints available)
  tokenization: true,
  rwaRegistry: true,
  externalApiTokenization: true,

  // Real-time - DISABLED (WebSocket not implemented yet)
  realtimeUpdates: false,
  websocketConnection: false,
};

/**
 * Get feature flag value
 */
export const isFeatureEnabled = (feature: keyof FeatureFlags): boolean => {
  // Check environment variable override first
  const envKey = `REACT_APP_FEATURE_${feature.toUpperCase()}`;
  const envValue = import.meta.env[envKey] as string | undefined;

  if (envValue !== undefined) {
    return envValue === 'true';
  }

  // Fall back to default configuration
  return defaultFeatureFlags[feature];
};

/**
 * Get all feature flags
 */
export const getAllFeatureFlags = (): FeatureFlags => {
  return { ...defaultFeatureFlags };
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

export default {
  isFeatureEnabled,
  getAllFeatureFlags,
  defaultFeatureFlags,
  featureFlagLabels,
};
