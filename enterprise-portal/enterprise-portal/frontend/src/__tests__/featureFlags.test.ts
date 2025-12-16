/**
 * Feature Flags Tests
 *
 * Comprehensive tests for feature flag configuration and behavior
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  isFeatureEnabled,
  isFeatureReady,
  getFeatureConfig,
  getAllFeatureFlags,
  getAllFeatureConfigs,
  getFeaturesByCategory,
  getFeaturesByStatus,
  getMissingDependencies,
  defaultFeatureFlagsV12,
  featureDependencies,
  featureMetadata,
  type FeatureFlags,
  type FeatureCategory,
} from '../config/featureFlagsV12';

describe('Feature Flags - Core Functionality', () => {
  beforeEach(() => {
    // Reset environment mocks before each test
    vi.clearAllMocks();
  });

  describe('isFeatureEnabled', () => {
    it('should return true for enabled features', () => {
      expect(isFeatureEnabled('blockExplorer')).toBe(true);
      expect(isFeatureEnabled('transactionExplorer')).toBe(true);
      expect(isFeatureEnabled('consensusMetrics')).toBe(true);
      expect(isFeatureEnabled('smartContracts')).toBe(true);
      expect(isFeatureEnabled('tokenization')).toBe(true);
    });

    it('should return false for disabled features', () => {
      expect(isFeatureEnabled('validatorDashboard')).toBe(false);
      expect(isFeatureEnabled('stakingOperations')).toBe(false);
      expect(isFeatureEnabled('aiOptimization')).toBe(false);
      expect(isFeatureEnabled('quantumSecurity')).toBe(false);
      expect(isFeatureEnabled('crossChainBridge')).toBe(false);
    });

    it('should handle all 22 feature flags', () => {
      const allFlags = Object.keys(defaultFeatureFlagsV12) as (keyof FeatureFlags)[];
      expect(allFlags).toHaveLength(22);

      allFlags.forEach((flag) => {
        const result = isFeatureEnabled(flag);
        expect(typeof result).toBe('boolean');
      });
    });
  });

  describe('getAllFeatureFlags', () => {
    it('should return all feature flags with correct structure', () => {
      const flags = getAllFeatureFlags();

      expect(flags).toBeDefined();
      expect(Object.keys(flags)).toHaveLength(22);

      // Verify structure
      expect(flags).toHaveProperty('blockExplorer');
      expect(flags).toHaveProperty('transactionExplorer');
      expect(flags).toHaveProperty('validatorDashboard');
      expect(flags).toHaveProperty('websocketConnection');
    });

    it('should return boolean values for all flags', () => {
      const flags = getAllFeatureFlags();

      Object.values(flags).forEach((value) => {
        expect(typeof value).toBe('boolean');
      });
    });
  });
});

describe('Feature Flags - Dependencies', () => {
  describe('isFeatureReady', () => {
    it('should return true for production-ready features with implemented endpoints', () => {
      expect(isFeatureReady('blockExplorer')).toBe(true);
      expect(isFeatureReady('transactionExplorer')).toBe(true);
      expect(isFeatureReady('consensusMetrics')).toBe(true);
      expect(isFeatureReady('smartContracts')).toBe(true);
    });

    it('should return false for features with unimplemented endpoints', () => {
      expect(isFeatureReady('validatorDashboard')).toBe(false);
      expect(isFeatureReady('stakingOperations')).toBe(false);
      expect(isFeatureReady('aiOptimization')).toBe(false);
    });

    it('should check endpoint implementation status', () => {
      const blockExplorerDeps = featureDependencies.blockExplorer;
      expect(blockExplorerDeps.endpoints.every(e => e.implemented)).toBe(true);

      const validatorDeps = featureDependencies.validatorDashboard;
      expect(validatorDeps.endpoints.every(e => e.implemented)).toBe(false);
    });

    it('should handle features with required feature dependencies', () => {
      // stakingOperations requires validatorDashboard
      const stakingDeps = featureDependencies.stakingOperations;
      expect(stakingDeps.requiredFeatures).toContain('validatorDashboard');

      // Since validatorDashboard is disabled, stakingOperations should not be ready
      expect(isFeatureReady('stakingOperations')).toBe(false);
    });
  });

  describe('getMissingDependencies', () => {
    it('should return empty arrays for production-ready features', () => {
      const missing = getMissingDependencies('blockExplorer');

      expect(missing.endpoints).toHaveLength(0);
      expect(missing.envVars).toHaveLength(0);
      expect(missing.requiredFeatures).toHaveLength(0);
    });

    it('should identify missing endpoints', () => {
      const missing = getMissingDependencies('validatorDashboard');

      expect(missing.endpoints.length).toBeGreaterThan(0);
      missing.endpoints.forEach((endpoint) => {
        expect(endpoint.implemented).toBe(false);
        expect(endpoint.targetVersion).toBeDefined();
      });
    });

    it('should identify missing required features', () => {
      const missing = getMissingDependencies('stakingOperations');

      // stakingOperations requires validatorDashboard which is disabled
      expect(missing.requiredFeatures).toContain('validatorDashboard');
    });

    it('should check all dependency types', () => {
      const allFlags = Object.keys(featureDependencies) as (keyof FeatureFlags)[];

      allFlags.forEach((flag) => {
        const missing = getMissingDependencies(flag);

        expect(missing).toHaveProperty('endpoints');
        expect(missing).toHaveProperty('envVars');
        expect(missing).toHaveProperty('requiredFeatures');

        expect(Array.isArray(missing.endpoints)).toBe(true);
        expect(Array.isArray(missing.envVars)).toBe(true);
        expect(Array.isArray(missing.requiredFeatures)).toBe(true);
      });
    });
  });
});

describe('Feature Flags - Configuration Metadata', () => {
  describe('getFeatureConfig', () => {
    it('should return complete configuration for a feature', () => {
      const config = getFeatureConfig('blockExplorer');

      expect(config).toHaveProperty('id', 'blockExplorer');
      expect(config).toHaveProperty('name', 'Block Explorer');
      expect(config).toHaveProperty('description');
      expect(config).toHaveProperty('enabled');
      expect(config).toHaveProperty('category', 'blockchain');
      expect(config).toHaveProperty('dependencies');
      expect(config).toHaveProperty('ready');
      expect(config).toHaveProperty('status', 'production');
    });

    it('should include dependency information', () => {
      const config = getFeatureConfig('validatorDashboard');

      expect(config.dependencies).toBeDefined();
      expect(config.dependencies.endpoints).toBeDefined();
      expect(Array.isArray(config.dependencies.endpoints)).toBe(true);
      expect(config.dependencies.endpoints.length).toBeGreaterThan(0);
    });

    it('should reflect correct enabled/ready status', () => {
      const enabledConfig = getFeatureConfig('blockExplorer');
      expect(enabledConfig.enabled).toBe(true);
      expect(enabledConfig.ready).toBe(true);

      const disabledConfig = getFeatureConfig('validatorDashboard');
      expect(disabledConfig.enabled).toBe(false);
      expect(disabledConfig.ready).toBe(false);
    });
  });

  describe('getAllFeatureConfigs', () => {
    it('should return configurations for all 22 features', () => {
      const configs = getAllFeatureConfigs();

      expect(Object.keys(configs)).toHaveLength(22);
    });

    it('should have consistent structure across all configs', () => {
      const configs = getAllFeatureConfigs();

      Object.values(configs).forEach((config) => {
        expect(config).toHaveProperty('id');
        expect(config).toHaveProperty('name');
        expect(config).toHaveProperty('description');
        expect(config).toHaveProperty('enabled');
        expect(config).toHaveProperty('category');
        expect(config).toHaveProperty('dependencies');
        expect(config).toHaveProperty('ready');
        expect(config).toHaveProperty('status');
      });
    });
  });
});

describe('Feature Flags - Categories', () => {
  describe('getFeaturesByCategory', () => {
    it('should return blockchain features', () => {
      const features = getFeaturesByCategory('blockchain');

      expect(features.length).toBeGreaterThan(0);
      expect(features.every(f => f.category === 'blockchain')).toBe(true);

      const ids = features.map(f => f.id);
      expect(ids).toContain('blockExplorer');
      expect(ids).toContain('transactionExplorer');
      expect(ids).toContain('consensusMetrics');
    });

    it('should return validator features', () => {
      const features = getFeaturesByCategory('validator');

      expect(features.length).toBe(2);
      expect(features.some(f => f.id === 'validatorDashboard')).toBe(true);
      expect(features.some(f => f.id === 'stakingOperations')).toBe(true);
    });

    it('should return AI features', () => {
      const features = getFeaturesByCategory('ai');

      expect(features.length).toBe(3);
      expect(features.some(f => f.id === 'aiOptimization')).toBe(true);
      expect(features.some(f => f.id === 'mlModels')).toBe(true);
      expect(features.some(f => f.id === 'predictiveAnalytics')).toBe(true);
    });

    it('should return security features', () => {
      const features = getFeaturesByCategory('security');

      expect(features.length).toBe(4);
      expect(features.every(f => f.category === 'security')).toBe(true);
    });

    it('should return tokenization features', () => {
      const features = getFeaturesByCategory('tokenization');

      expect(features.length).toBe(3);
      expect(features.some(f => f.id === 'tokenization')).toBe(true);
      expect(features.some(f => f.id === 'rwaRegistry')).toBe(true);
    });

    it('should handle all categories', () => {
      const categories: FeatureCategory[] = [
        'blockchain',
        'validator',
        'ai',
        'security',
        'cross-chain',
        'smart-contracts',
        'tokenization',
        'real-time',
      ];

      categories.forEach((category) => {
        const features = getFeaturesByCategory(category);
        expect(Array.isArray(features)).toBe(true);
        expect(features.every(f => f.category === category)).toBe(true);
      });
    });
  });
});

describe('Feature Flags - Status', () => {
  describe('getFeaturesByStatus', () => {
    it('should return production features', () => {
      const features = getFeaturesByStatus('production');

      expect(features.length).toBeGreaterThan(0);
      expect(features.every(f => f.status === 'production')).toBe(true);

      // Production features should be enabled and ready
      features.forEach((feature) => {
        expect(feature.enabled).toBe(true);
        expect(feature.ready).toBe(true);
      });
    });

    it('should return planned features', () => {
      const features = getFeaturesByStatus('planned');

      expect(features.length).toBeGreaterThan(0);
      expect(features.every(f => f.status === 'planned')).toBe(true);

      // Planned features should be disabled and not ready
      features.forEach((feature) => {
        expect(feature.enabled).toBe(false);
      });
    });

    it('should correctly categorize all features by status', () => {
      const production = getFeaturesByStatus('production');
      const beta = getFeaturesByStatus('beta');
      const alpha = getFeaturesByStatus('alpha');
      const planned = getFeaturesByStatus('planned');

      const total = production.length + beta.length + alpha.length + planned.length;
      expect(total).toBe(22); // All 22 features accounted for
    });
  });
});

describe('Feature Flags - Endpoint Validation', () => {
  it('should have valid endpoint configurations', () => {
    Object.entries(featureDependencies).forEach(([featureId, deps]) => {
      expect(deps.endpoints).toBeDefined();
      expect(Array.isArray(deps.endpoints)).toBe(true);
      expect(deps.endpoints.length).toBeGreaterThan(0);

      deps.endpoints.forEach((endpoint) => {
        expect(endpoint).toHaveProperty('path');
        expect(endpoint).toHaveProperty('method');
        expect(endpoint).toHaveProperty('implemented');

        expect(typeof endpoint.path).toBe('string');
        expect(endpoint.path).toMatch(/^\//); // Should start with /

        expect(['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'WS']).toContain(endpoint.method);
        expect(typeof endpoint.implemented).toBe('boolean');

        if (!endpoint.implemented) {
          expect(endpoint.targetVersion).toBeDefined();
        }
      });
    });
  });

  it('should have consistent production endpoints', () => {
    const productionFeatures = ['blockExplorer', 'transactionExplorer', 'consensusMetrics',
                                'smartContracts', 'ricardianContracts', 'tokenization',
                                'rwaRegistry', 'externalApiTokenization'];

    productionFeatures.forEach((feature) => {
      const deps = featureDependencies[feature as keyof FeatureFlags];
      expect(deps.endpoints.every(e => e.implemented)).toBe(true);
    });
  });
});

describe('Feature Flags - Metadata Completeness', () => {
  it('should have metadata for all features', () => {
    const flagKeys = Object.keys(defaultFeatureFlagsV12);
    const metadataKeys = Object.keys(featureMetadata);

    expect(flagKeys.sort()).toEqual(metadataKeys.sort());
  });

  it('should have complete metadata structure', () => {
    Object.entries(featureMetadata).forEach(([key, metadata]) => {
      expect(metadata).toHaveProperty('id', key);
      expect(metadata).toHaveProperty('name');
      expect(metadata).toHaveProperty('description');
      expect(metadata).toHaveProperty('category');
      expect(metadata).toHaveProperty('dependencies');
      expect(metadata).toHaveProperty('status');

      expect(typeof metadata.name).toBe('string');
      expect(metadata.name.length).toBeGreaterThan(0);
      expect(typeof metadata.description).toBe('string');
      expect(metadata.description.length).toBeGreaterThan(0);
    });
  });
});

describe('Feature Flags - Dependency Chains', () => {
  it('should properly handle multi-level dependencies', () => {
    // predictiveAnalytics requires aiOptimization and mlModels
    const deps = featureDependencies.predictiveAnalytics;
    expect(deps.requiredFeatures).toContain('aiOptimization');
    expect(deps.requiredFeatures).toContain('mlModels');

    // Since both are disabled, predictiveAnalytics should not be ready
    expect(isFeatureReady('predictiveAnalytics')).toBe(false);
  });

  it('should validate Ricardian contracts dependency on smart contracts', () => {
    const deps = featureDependencies.ricardianContracts;
    expect(deps.requiredFeatures).toContain('smartContracts');

    // Since smartContracts is enabled, this dependency is satisfied
    expect(isFeatureEnabled('smartContracts')).toBe(true);
  });

  it('should validate RWA registry dependency on tokenization', () => {
    const deps = featureDependencies.rwaRegistry;
    expect(deps.requiredFeatures).toContain('tokenization');

    // Both should be enabled (production)
    expect(isFeatureEnabled('tokenization')).toBe(true);
    expect(isFeatureEnabled('rwaRegistry')).toBe(true);
  });
});

describe('Feature Flags - Count Validation', () => {
  it('should have exactly 22 feature flags', () => {
    const flags = getAllFeatureFlags();
    expect(Object.keys(flags)).toHaveLength(22);
  });

  it('should have correct distribution across categories', () => {
    const blockchain = getFeaturesByCategory('blockchain');
    const validator = getFeaturesByCategory('validator');
    const ai = getFeaturesByCategory('ai');
    const security = getFeaturesByCategory('security');
    const crossChain = getFeaturesByCategory('cross-chain');
    const smartContracts = getFeaturesByCategory('smart-contracts');
    const tokenization = getFeaturesByCategory('tokenization');
    const realTime = getFeaturesByCategory('real-time');

    expect(blockchain.length).toBe(3);
    expect(validator.length).toBe(2);
    expect(ai.length).toBe(3);
    expect(security.length).toBe(4);
    expect(crossChain.length).toBe(2);
    expect(smartContracts.length).toBe(2);
    expect(tokenization.length).toBe(3);
    expect(realTime.length).toBe(2);

    // Total should be 22
    const total = blockchain.length + validator.length + ai.length + security.length +
                  crossChain.length + smartContracts.length + tokenization.length + realTime.length;
    expect(total).toBe(22);
  });
});
