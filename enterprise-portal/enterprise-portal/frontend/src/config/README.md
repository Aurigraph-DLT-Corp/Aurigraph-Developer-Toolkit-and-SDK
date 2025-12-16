# Feature Flags V12 Configuration

## Overview

The Feature Flags V12 system provides comprehensive feature management for the Aurigraph Enterprise Portal frontend. It enables progressive feature rollout, environment-based configuration, and dependency tracking for backend API availability.

## Quick Start

### Basic Usage

```typescript
import { isFeatureEnabled } from './featureFlagsV12';

if (isFeatureEnabled('validatorDashboard')) {
  // Show validator dashboard
}
```

### Check if Feature is Ready

```typescript
import { isFeatureReady } from './featureFlagsV12';

if (isFeatureReady('stakingOperations')) {
  // All backend APIs are available
}
```

### Get Full Feature Configuration

```typescript
import { getFeatureConfig } from './featureFlagsV12';

const config = getFeatureConfig('validatorDashboard');
console.log(config.name);         // "Validator Dashboard"
console.log(config.enabled);      // true/false
console.log(config.ready);        // true if all APIs available
console.log(config.status);       // "production" | "planned"
```

## Files

### featureFlagsV12.ts
Enhanced feature flags system with:
- Environment-based configuration
- Backend API dependency tracking
- Feature metadata and categorization
- Dependency validation
- Missing dependency detection

### featureFlags.ts (Legacy)
Original V11 feature flags system. Still functional but deprecated in favor of V12.

## Environment Variables

Override feature flags using environment variables:

```bash
# Enable a feature
VITE_FEATURE_VALIDATOR_DASHBOARD=true

# Feature-specific configuration
VITE_VALIDATOR_REGISTRY_ENABLED=true
VITE_STAKING_ENABLED=true
```

See `.env.example` for full list of available variables.

## Feature Categories

1. **Blockchain & Consensus** - Block explorer, transactions, consensus metrics
2. **Validator & Staking** - Validator management, staking operations
3. **AI Optimization** - AI-powered optimization, ML models, analytics
4. **Security** - Quantum security, key rotation, audits, scanning
5. **Cross-Chain** - Bridge protocol, cross-chain transfers
6. **Smart Contracts** - Contract deployment, Ricardian contracts
7. **Tokenization** - Token creation, RWA registry, external APIs
8. **Real-time** - WebSocket updates, real-time data

## Feature Status

- **Production** - Fully implemented and tested
- **Beta** - Available for testing, may have issues
- **Alpha** - Early development, limited availability
- **Planned** - Not yet implemented

## Backend Dependencies

Each feature documents its required backend endpoints. See `FEATURE_FLAGS_GUIDE.md` for complete API reference.

Example:
```typescript
validatorDashboard: {
  endpoints: [
    { path: '/api/v11/validators', method: 'GET', implemented: false }
  ],
  requires: ['Validator Registry', 'Staking Module'],
  envVars: ['VITE_VALIDATOR_REGISTRY_ENABLED']
}
```

## API Reference

### isFeatureEnabled(feature)
Check if a feature is enabled (respects environment overrides).

**Parameters:**
- `feature`: Feature name (keyof FeatureFlags)

**Returns:** boolean

### isFeatureReady(feature)
Check if all dependencies are met for a feature.

**Parameters:**
- `feature`: Feature name (keyof FeatureFlags)

**Returns:** boolean

### getFeatureConfig(feature)
Get complete feature configuration including metadata.

**Parameters:**
- `feature`: Feature name (keyof FeatureFlags)

**Returns:** FeatureConfig object

### getAllFeatureFlags()
Get all feature flags with current values.

**Returns:** FeatureFlags object

### getAllFeatureConfigs()
Get all feature configurations with metadata.

**Returns:** Record<keyof FeatureFlags, FeatureConfig>

### getFeaturesByCategory(category)
Get features filtered by category.

**Parameters:**
- `category`: Feature category

**Returns:** FeatureConfig[]

### getFeaturesByStatus(status)
Get features filtered by status.

**Parameters:**
- `status`: 'production' | 'beta' | 'alpha' | 'planned'

**Returns:** FeatureConfig[]

### getMissingDependencies(feature)
Get missing dependencies for a feature.

**Parameters:**
- `feature`: Feature name (keyof FeatureFlags)

**Returns:** Object with missing endpoints, envVars, and requiredFeatures

## Usage Examples

See `/src/examples/FeatureFlagsUsage.tsx` for comprehensive examples including:
- Simple feature toggles
- Feature readiness checks
- Dependency status components
- Custom React hooks
- Progressive rollout
- Feature-gated navigation

## Migration from V11

### Update Imports
```typescript
// Old
import { isFeatureEnabled } from './featureFlags';

// New
import { isFeatureEnabled } from './featureFlagsV12';
```

### Enhanced Checks
```typescript
// V11 - Basic check
if (isFeatureEnabled('validatorDashboard')) { ... }

// V12 - Check readiness
import { isFeatureReady } from './featureFlagsV12';
if (isFeatureReady('validatorDashboard')) { ... }
```

## Documentation

- **FEATURE_FLAGS_GUIDE.md** - Complete feature flags documentation
- **BACKEND_API_REQUIREMENTS.md** - Backend API specifications for features
- **.env.example** - Environment variable reference
- **/src/examples/FeatureFlagsUsage.tsx** - Code examples

## Feature Enablement Process

When a backend API becomes available:

1. Update `implemented: true` in featureFlagsV12.ts
2. Update default flag value if production-ready
3. Add environment variables to .env.example
4. Test feature with real APIs
5. Update documentation
6. Deploy backend first, then frontend

See FEATURE_FLAGS_GUIDE.md for complete checklist.

## Support

For questions or issues:
- Frontend team: Review FEATURE_FLAGS_GUIDE.md
- Backend team: Review BACKEND_API_REQUIREMENTS.md
- DevOps: Review .env.example for environment configuration

---

**Version:** 12.0.0
**Last Updated:** 2025-12-16
