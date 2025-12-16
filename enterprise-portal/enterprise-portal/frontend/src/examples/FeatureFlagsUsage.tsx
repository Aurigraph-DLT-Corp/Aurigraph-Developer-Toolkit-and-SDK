/**
 * Feature Flags V12 - Usage Examples
 *
 * This file demonstrates various ways to use the V12 feature flags system
 * in React components and services.
 */

import React, { useMemo } from 'react';
import {
  isFeatureEnabled,
  isFeatureReady,
  getFeatureConfig,
  getAllFeatureConfigs,
  getFeaturesByCategory,
  getFeaturesByStatus,
  getMissingDependencies,
  type FeatureConfig,
  type FeatureFlags,
} from '../config/featureFlagsV12';

// ============================================================================
// Example 1: Simple Feature Toggle
// ============================================================================

export const SimpleFeatureToggle: React.FC = () => {
  // Check if feature is enabled
  const validatorEnabled = isFeatureEnabled('validatorDashboard');

  return (
    <div>
      {validatorEnabled ? (
        <div>
          <h2>Validator Dashboard</h2>
          <p>Validator content goes here...</p>
        </div>
      ) : (
        <div>
          <p>Validator Dashboard is currently disabled</p>
        </div>
      )}
    </div>
  );
};

// ============================================================================
// Example 2: Feature Readiness Check
// ============================================================================

export const FeatureReadinessExample: React.FC = () => {
  const config = getFeatureConfig('stakingOperations');

  return (
    <div>
      {!config.enabled && (
        <div className="alert alert-info">
          Feature is disabled in configuration
        </div>
      )}

      {config.enabled && !config.ready && (
        <div className="alert alert-warning">
          <h3>Coming Soon: {config.name}</h3>
          <p>{config.description}</p>
          <p>This feature will be available in version {config.dependencies.endpoints[0]?.targetVersion}</p>

          {/* Show what's missing */}
          <FeatureDependencyStatus feature="stakingOperations" />
        </div>
      )}

      {config.enabled && config.ready && (
        <div>
          <h2>{config.name}</h2>
          <p>Feature is fully available!</p>
          {/* Render feature UI */}
        </div>
      )}
    </div>
  );
};

// ============================================================================
// Example 3: Feature Dependency Status Component
// ============================================================================

interface FeatureDependencyStatusProps {
  feature: keyof FeatureFlags;
}

export const FeatureDependencyStatus: React.FC<FeatureDependencyStatusProps> = ({ feature }) => {
  const missing = getMissingDependencies(feature);
  const hasMissing =
    missing.endpoints.length > 0 ||
    missing.envVars.length > 0 ||
    missing.requiredFeatures.length > 0;

  if (!hasMissing) {
    return (
      <div className="alert alert-success">
        All dependencies met!
      </div>
    );
  }

  return (
    <div className="dependency-status">
      {missing.endpoints.length > 0 && (
        <div>
          <h4>Missing Backend Endpoints:</h4>
          <ul>
            {missing.endpoints.map(endpoint => (
              <li key={endpoint.path}>
                <code>{endpoint.method} {endpoint.path}</code>
                {endpoint.targetVersion && (
                  <span className="badge">{endpoint.targetVersion}</span>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}

      {missing.envVars.length > 0 && (
        <div>
          <h4>Missing Environment Variables:</h4>
          <ul>
            {missing.envVars.map(envVar => (
              <li key={envVar}>
                <code>{envVar}</code>
              </li>
            ))}
          </ul>
        </div>
      )}

      {missing.requiredFeatures.length > 0 && (
        <div>
          <h4>Required Features Not Enabled:</h4>
          <ul>
            {missing.requiredFeatures.map(requiredFeature => (
              <li key={requiredFeature}>{requiredFeature}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

// ============================================================================
// Example 4: Feature Status Dashboard
// ============================================================================

export const FeatureStatusDashboard: React.FC = () => {
  const allFeatures = getAllFeatureConfigs();
  const productionFeatures = getFeaturesByStatus('production');
  const plannedFeatures = getFeaturesByStatus('planned');

  return (
    <div className="feature-dashboard">
      <h1>Feature Status Dashboard</h1>

      <div className="feature-stats">
        <div className="stat-card">
          <h3>Production Ready</h3>
          <p className="stat-number">{productionFeatures.length}</p>
        </div>
        <div className="stat-card">
          <h3>Planned</h3>
          <p className="stat-number">{plannedFeatures.length}</p>
        </div>
        <div className="stat-card">
          <h3>Total Features</h3>
          <p className="stat-number">{Object.keys(allFeatures).length}</p>
        </div>
      </div>

      <div className="feature-categories">
        <FeatureCategorySection category="blockchain" title="Blockchain & Consensus" />
        <FeatureCategorySection category="validator" title="Validator & Staking" />
        <FeatureCategorySection category="ai" title="AI & Machine Learning" />
        <FeatureCategorySection category="security" title="Security Features" />
        <FeatureCategorySection category="cross-chain" title="Cross-Chain" />
        <FeatureCategorySection category="smart-contracts" title="Smart Contracts" />
        <FeatureCategorySection category="tokenization" title="Tokenization" />
        <FeatureCategorySection category="real-time" title="Real-time Features" />
      </div>
    </div>
  );
};

// ============================================================================
// Example 5: Feature Category Section
// ============================================================================

interface FeatureCategorySectionProps {
  category: 'blockchain' | 'validator' | 'ai' | 'security' | 'cross-chain' | 'smart-contracts' | 'tokenization' | 'real-time';
  title: string;
}

const FeatureCategorySection: React.FC<FeatureCategorySectionProps> = ({ category, title }) => {
  const features = getFeaturesByCategory(category);

  return (
    <div className="category-section">
      <h2>{title}</h2>
      <div className="feature-grid">
        {features.map(feature => (
          <FeatureCard key={feature.id} feature={feature} />
        ))}
      </div>
    </div>
  );
};

// ============================================================================
// Example 6: Feature Card Component
// ============================================================================

interface FeatureCardProps {
  feature: FeatureConfig;
}

const FeatureCard: React.FC<FeatureCardProps> = ({ feature }) => {
  const statusClass = feature.ready ? 'ready' : feature.enabled ? 'enabled' : 'disabled';

  return (
    <div className={`feature-card ${statusClass}`}>
      <div className="feature-header">
        <h3>{feature.name}</h3>
        <span className={`status-badge ${feature.status}`}>{feature.status}</span>
      </div>

      <p className="feature-description">{feature.description}</p>

      <div className="feature-status">
        {feature.ready && (
          <div className="status-item success">
            <span className="icon">✓</span>
            <span>Ready to use</span>
          </div>
        )}

        {feature.enabled && !feature.ready && (
          <div className="status-item warning">
            <span className="icon">⚠</span>
            <span>Backend APIs pending</span>
          </div>
        )}

        {!feature.enabled && (
          <div className="status-item disabled">
            <span className="icon">✗</span>
            <span>Disabled</span>
          </div>
        )}
      </div>

      <div className="feature-details">
        <p className="detail-label">Required Endpoints:</p>
        <p className="detail-value">{feature.dependencies.endpoints.length}</p>

        {feature.dependencies.endpoints.some(e => !e.implemented) && (
          <p className="missing-count">
            {feature.dependencies.endpoints.filter(e => !e.implemented).length} pending
          </p>
        )}
      </div>
    </div>
  );
};

// ============================================================================
// Example 7: Custom Hook for Feature Flags
// ============================================================================

export const useFeature = (feature: keyof FeatureFlags) => {
  const config = useMemo(() => getFeatureConfig(feature), [feature]);
  const missing = useMemo(() => getMissingDependencies(feature), [feature]);

  return {
    enabled: config.enabled,
    ready: config.ready,
    config,
    missing,
    isAvailable: config.enabled && config.ready,
  };
};

// Usage example:
export const ValidatorDashboardWithHook: React.FC = () => {
  const validator = useFeature('validatorDashboard');

  if (!validator.enabled) {
    return <div>Feature disabled</div>;
  }

  if (!validator.ready) {
    return (
      <div>
        <h3>Coming Soon</h3>
        <p>{validator.config.description}</p>
        <p>Missing {validator.missing.endpoints.length} backend endpoints</p>
      </div>
    );
  }

  return (
    <div>
      <h2>{validator.config.name}</h2>
      {/* Render validator dashboard */}
    </div>
  );
};

// ============================================================================
// Example 8: Progressive Feature Rollout
// ============================================================================

export const ProgressiveFeatureRollout: React.FC = () => {
  const stakingReady = isFeatureReady('stakingOperations');
  const validatorReady = isFeatureReady('validatorDashboard');

  return (
    <div>
      {/* Phase 1: Show validator dashboard when ready */}
      {validatorReady && (
        <section>
          <h2>Validator Dashboard</h2>
          {/* Validator UI */}
        </section>
      )}

      {/* Phase 2: Show staking when both validator and staking are ready */}
      {validatorReady && stakingReady && (
        <section>
          <h2>Staking Operations</h2>
          {/* Staking UI */}
        </section>
      )}

      {/* Show roadmap for features not yet ready */}
      {!validatorReady && (
        <section>
          <h2>Coming Soon</h2>
          <ul>
            <li>Validator Dashboard (V12.1)</li>
            <li>Staking Operations (V12.1)</li>
          </ul>
        </section>
      )}
    </div>
  );
};

// ============================================================================
// Example 9: Feature-Gated Navigation
// ============================================================================

export const FeatureGatedNavigation: React.FC = () => {
  const validator = useFeature('validatorDashboard');
  const staking = useFeature('stakingOperations');
  const ai = useFeature('aiOptimization');
  const bridge = useFeature('crossChainBridge');

  return (
    <nav>
      <ul>
        {/* Always show blockchain features */}
        <li>
          <a href="/blocks">Block Explorer</a>
        </li>
        <li>
          <a href="/transactions">Transactions</a>
        </li>

        {/* Show validator only if ready */}
        {validator.isAvailable && (
          <li>
            <a href="/validators">Validators</a>
          </li>
        )}

        {/* Show staking only if ready */}
        {staking.isAvailable && (
          <li>
            <a href="/staking">Staking</a>
          </li>
        )}

        {/* Show with "Coming Soon" badge if enabled but not ready */}
        {ai.enabled && (
          <li>
            <a href="/ai">
              AI Optimization
              {!ai.ready && <span className="badge">Coming Soon</span>}
            </a>
          </li>
        )}

        {/* Don't show if disabled */}
        {bridge.enabled && (
          <li>
            <a href="/bridge">
              Bridge
              {!bridge.ready && <span className="badge">Beta</span>}
            </a>
          </li>
        )}
      </ul>
    </nav>
  );
};

// ============================================================================
// Example 10: Environment-Based Configuration
// ============================================================================

export const EnvironmentConfiguration: React.FC = () => {
  // In development, you can override features via environment variables
  // Example: VITE_FEATURE_VALIDATOR_DASHBOARD=true

  const isDev = import.meta.env.DEV;
  const validatorEnabled = isFeatureEnabled('validatorDashboard');

  return (
    <div>
      {isDev && (
        <div className="dev-info">
          <h3>Development Mode</h3>
          <p>Override features using environment variables:</p>
          <code>VITE_FEATURE_VALIDATOR_DASHBOARD=true</code>
          <p>Current status: {validatorEnabled ? 'Enabled' : 'Disabled'}</p>
        </div>
      )}

      {validatorEnabled && (
        <div>
          {/* Feature content */}
        </div>
      )}
    </div>
  );
};

// ============================================================================
// Export all examples
// ============================================================================

export default {
  SimpleFeatureToggle,
  FeatureReadinessExample,
  FeatureDependencyStatus,
  FeatureStatusDashboard,
  ValidatorDashboardWithHook,
  ProgressiveFeatureRollout,
  FeatureGatedNavigation,
  EnvironmentConfiguration,
  useFeature,
};
