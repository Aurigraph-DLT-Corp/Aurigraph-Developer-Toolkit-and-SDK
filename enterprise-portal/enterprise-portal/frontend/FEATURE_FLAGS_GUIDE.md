# Feature Flags V12 - Implementation Guide

## Overview

The Feature Flags V12 system provides a robust, environment-based configuration for enabling/disabling frontend features as backend APIs become available. This guide documents the feature flag architecture, backend dependencies, and enablement procedures.

## Table of Contents

- [Architecture](#architecture)
- [Feature Categories](#feature-categories)
- [Backend Dependencies](#backend-dependencies)
- [Environment Configuration](#environment-configuration)
- [Usage Examples](#usage-examples)
- [Feature Enablement Checklist](#feature-enablement-checklist)
- [API Endpoint Reference](#api-endpoint-reference)

---

## Architecture

### File Structure

```
src/config/
├── featureFlags.ts          # Legacy feature flags (V11)
├── featureFlagsV12.ts       # Enhanced V12 feature flags
└── api.ts                   # API base URL configuration
```

### Key Components

1. **Feature Flags Interface** - Defines all available features
2. **Feature Dependencies** - Maps features to required backend endpoints
3. **Environment Overrides** - Allows runtime feature toggling via env vars
4. **Feature Metadata** - Provides UI labels, descriptions, and categorization
5. **Dependency Checker** - Validates if all requirements are met

---

## Feature Categories

### 1. Blockchain & Consensus (PRODUCTION READY)
- **blockExplorer** - Browse and search blockchain blocks
- **transactionExplorer** - View transaction history and details
- **consensusMetrics** - Real-time consensus performance metrics

### 2. Validator & Staking (PLANNED - V12.1)
- **validatorDashboard** - Monitor validator nodes and performance
- **stakingOperations** - Stake, unstake, and delegate operations

### 3. AI Optimization (PLANNED - V12.2)
- **aiOptimization** - AI-powered network optimization
- **mlModels** - Machine learning model management
- **predictiveAnalytics** - Forecasting and trend analysis

### 4. Security (PLANNED - V12.3)
- **quantumSecurity** - Post-quantum cryptography
- **keyRotation** - Automated key rotation
- **securityAudits** - Security auditing and compliance
- **vulnerabilityScanning** - Automated vulnerability detection

### 5. Cross-Chain (PLANNED - V12.4)
- **crossChainBridge** - Bridge protocol infrastructure
- **bridgeTransfers** - Cross-chain asset transfers

### 6. Smart Contracts (PRODUCTION READY)
- **smartContracts** - Deploy and execute smart contracts
- **ricardianContracts** - Legal smart contracts

### 7. Tokenization (PRODUCTION READY)
- **tokenization** - Create and manage digital tokens
- **rwaRegistry** - Real-world asset tokenization
- **externalApiTokenization** - External API integration

### 8. Real-time (PLANNED - V12.5)
- **realtimeUpdates** - Live data updates via WebSocket
- **websocketConnection** - Persistent WebSocket connection

---

## Backend Dependencies

### Production Ready Features

#### Block Explorer
**Endpoints:**
- `GET /api/v11/blocks` - List all blocks
- `GET /api/v11/blocks/:id` - Get block details
- `GET /api/v11/blocks/latest` - Get latest block
- `GET /api/v11/blocks/search` - Search blocks

**Requirements:**
- Database
- Consensus Engine

#### Transaction Explorer
**Endpoints:**
- `GET /api/v11/transactions` - List transactions
- `GET /api/v11/transactions/:id` - Get transaction details
- `GET /api/v11/transactions/search` - Search transactions
- `GET /api/v11/transactions/stats` - Transaction statistics

**Requirements:**
- Database
- Transaction Pool

#### Consensus Metrics
**Endpoints:**
- `GET /api/v11/consensus/stats` - Consensus statistics
- `GET /api/v11/consensus/state` - Current consensus state
- `GET /api/v11/stats` - Overall system stats

**Requirements:**
- Consensus Engine
- Metrics Service

---

### Planned Features

#### Validator Dashboard (V12.1)
**Missing Endpoints:**
- `GET /api/v11/validators` - List all validators
- `GET /api/v11/validators/:id` - Get validator details
- `GET /api/v11/validators/:id/stats` - Validator statistics
- `GET /api/v11/validators/:id/performance` - Performance metrics
- `GET /api/v11/validators/:id/rewards` - Reward history

**Backend Requirements:**
- Validator Registry service
- Staking Module
- Rewards Engine

**Environment Variables:**
```bash
VITE_VALIDATOR_REGISTRY_ENABLED=true
```

#### Staking Operations (V12.1)
**Missing Endpoints:**
- `POST /api/v11/staking/stake` - Stake tokens
- `POST /api/v11/staking/unstake` - Unstake tokens
- `POST /api/v11/staking/delegate` - Delegate to validator
- `POST /api/v11/staking/undelegate` - Remove delegation
- `GET /api/v11/staking/rewards` - Get rewards
- `GET /api/v11/staking/positions` - Get staking positions

**Backend Requirements:**
- Staking Module
- Wallet Service
- Transaction Builder

**Feature Dependencies:**
- `validatorDashboard` must be enabled

**Environment Variables:**
```bash
VITE_STAKING_ENABLED=true
```

#### AI Optimization (V12.2)
**Missing Endpoints:**
- `POST /api/v11/ai/optimize` - Run optimization
- `GET /api/v11/ai/recommendations` - Get AI recommendations
- `GET /api/v11/ai/config` - Get AI configuration
- `PUT /api/v11/ai/config` - Update AI configuration

**Backend Requirements:**
- AI Engine
- ML Model Server
- Training Pipeline

**Environment Variables:**
```bash
VITE_AI_ENABLED=true
VITE_ML_MODEL_ENDPOINT=https://ml.aurigraph.io
```

#### ML Models (V12.2)
**Missing Endpoints:**
- `GET /api/v11/ml/models` - List ML models
- `GET /api/v11/ml/models/:id` - Get model details
- `POST /api/v11/ml/models/:id/train` - Train model
- `POST /api/v11/ml/models/:id/predict` - Make prediction
- `GET /api/v11/ml/models/:id/evaluate` - Evaluate model

**Backend Requirements:**
- ML Model Server
- Model Registry
- Feature Store

**Feature Dependencies:**
- `aiOptimization` must be enabled

**Environment Variables:**
```bash
VITE_ML_MODELS_ENABLED=true
```

#### Predictive Analytics (V12.2)
**Missing Endpoints:**
- `POST /api/v11/analytics/predict` - Make prediction
- `GET /api/v11/analytics/forecast` - Get forecast
- `GET /api/v11/analytics/trends` - Get trend analysis
- `GET /api/v11/analytics/anomalies` - Detect anomalies

**Backend Requirements:**
- Analytics Engine
- Time Series Database
- Prediction Service

**Feature Dependencies:**
- `aiOptimization` must be enabled
- `mlModels` must be enabled

**Environment Variables:**
```bash
VITE_PREDICTIVE_ANALYTICS_ENABLED=true
```

#### Quantum Security (V12.3)
**Missing Endpoints:**
- `GET /api/v11/security/quantum/status` - Get quantum security status
- `POST /api/v11/security/quantum/encrypt` - Quantum encrypt
- `POST /api/v11/security/quantum/decrypt` - Quantum decrypt
- `POST /api/v11/security/quantum/sign` - Quantum sign
- `POST /api/v11/security/quantum/verify` - Quantum verify

**Backend Requirements:**
- Quantum Crypto Module
- Post-Quantum Key Management
- Quantum RNG

**Environment Variables:**
```bash
VITE_QUANTUM_SECURITY_ENABLED=true
```

#### Key Rotation (V12.3)
**Missing Endpoints:**
- `POST /api/v11/security/keys/rotate` - Rotate keys
- `GET /api/v11/security/keys/schedule` - Get rotation schedule
- `PUT /api/v11/security/keys/schedule` - Update rotation schedule
- `GET /api/v11/security/keys/history` - Get rotation history

**Backend Requirements:**
- Key Management Service
- HSM Integration
- Audit Logger

**Environment Variables:**
```bash
VITE_KEY_ROTATION_ENABLED=true
```

#### Security Audits (V12.3)
**Missing Endpoints:**
- `GET /api/v11/security/audits` - List audits
- `GET /api/v11/security/audits/:id` - Get audit details
- `POST /api/v11/security/audits/run` - Run new audit
- `GET /api/v11/security/audits/reports` - Get audit reports

**Backend Requirements:**
- Security Audit Engine
- Compliance Module
- Report Generator

**Environment Variables:**
```bash
VITE_SECURITY_AUDITS_ENABLED=true
```

#### Vulnerability Scanning (V12.3)
**Missing Endpoints:**
- `POST /api/v11/security/scan` - Start vulnerability scan
- `GET /api/v11/security/vulnerabilities` - List vulnerabilities
- `GET /api/v11/security/vulnerabilities/:id` - Get vulnerability details
- `POST /api/v11/security/remediate` - Remediate vulnerability

**Backend Requirements:**
- Vulnerability Scanner
- CVE Database
- Remediation Engine

**Environment Variables:**
```bash
VITE_VULNERABILITY_SCANNING_ENABLED=true
```

#### Cross-Chain Bridge (V12.4)
**Missing Endpoints:**
- `GET /api/v11/bridge/status` - Get bridge status
- `GET /api/v11/bridge/chains` - List supported chains
- `GET /api/v11/bridge/config` - Get bridge configuration
- `GET /api/v11/bridge/fees` - Get bridge fees

**Backend Requirements:**
- Bridge Protocol
- Cross-Chain Validator
- Relayer Network

**Environment Variables:**
```bash
VITE_CROSS_CHAIN_ENABLED=true
```

#### Bridge Transfers (V12.4)
**Missing Endpoints:**
- `POST /api/v11/bridge/transfer` - Initiate bridge transfer
- `GET /api/v11/bridge/transfers/:id` - Get transfer status
- `GET /api/v11/bridge/transfers` - List transfers
- `POST /api/v11/bridge/estimate` - Estimate transfer cost

**Backend Requirements:**
- Bridge Protocol
- Asset Locker
- Proof Verifier

**Feature Dependencies:**
- `crossChainBridge` must be enabled

**Environment Variables:**
```bash
VITE_BRIDGE_TRANSFERS_ENABLED=true
```

#### Real-time Updates (V12.5)
**Missing Endpoints:**
- `WS /api/v11/realtime/subscribe` - Subscribe to real-time updates
- `GET /api/v11/realtime/topics` - List available topics

**Backend Requirements:**
- WebSocket Server
- Event Bus
- Pub/Sub System

**Feature Dependencies:**
- `websocketConnection` must be enabled

**Environment Variables:**
```bash
VITE_REALTIME_ENABLED=true
VITE_WS_URL=wss://dlt.aurigraph.io/ws
```

#### WebSocket Connection (V12.5)
**Missing Endpoints:**
- `WS /ws` - WebSocket connection endpoint
- `GET /api/v11/ws/status` - WebSocket server status

**Backend Requirements:**
- WebSocket Server
- Connection Pool
- Heartbeat Service

**Environment Variables:**
```bash
VITE_WS_URL=wss://dlt.aurigraph.io/ws
```

---

## Environment Configuration

### Setting Environment Variables

Create a `.env` file in the frontend root:

```bash
# API Configuration
VITE_API_URL=https://dlt.aurigraph.io/api/v11
VITE_WS_URL=wss://dlt.aurigraph.io/ws

# Feature Overrides (optional)
VITE_FEATURE_VALIDATOR_DASHBOARD=true
VITE_FEATURE_STAKING_OPERATIONS=true
VITE_FEATURE_AI_OPTIMIZATION=false

# Feature-specific Configuration
VITE_VALIDATOR_REGISTRY_ENABLED=true
VITE_STAKING_ENABLED=true
VITE_AI_ENABLED=false
VITE_ML_MODEL_ENDPOINT=https://ml.aurigraph.io
VITE_QUANTUM_SECURITY_ENABLED=false
VITE_CROSS_CHAIN_ENABLED=false
VITE_REALTIME_ENABLED=false
```

### Environment Variable Naming Convention

- **Feature Flags**: `VITE_FEATURE_<FEATURE_NAME>` (e.g., `VITE_FEATURE_VALIDATOR_DASHBOARD`)
- **Feature Config**: `VITE_<FEATURE>_ENABLED` (e.g., `VITE_STAKING_ENABLED`)
- **Service URLs**: `VITE_<SERVICE>_URL` (e.g., `VITE_WS_URL`)

---

## Usage Examples

### Basic Feature Check

```typescript
import { isFeatureEnabled } from '@/config/featureFlagsV12';

if (isFeatureEnabled('validatorDashboard')) {
  // Show validator dashboard
}
```

### Check Feature Readiness

```typescript
import { isFeatureReady } from '@/config/featureFlagsV12';

if (isFeatureReady('stakingOperations')) {
  // All backend APIs are available
  // Show staking UI
} else {
  // Show "Coming Soon" message
}
```

### Get Feature Configuration

```typescript
import { getFeatureConfig } from '@/config/featureFlagsV12';

const config = getFeatureConfig('validatorDashboard');

console.log(config.name);         // "Validator Dashboard"
console.log(config.enabled);      // true/false
console.log(config.ready);        // true if all APIs available
console.log(config.status);       // "production" | "beta" | "alpha" | "planned"
console.log(config.category);     // "validator"
```

### Check Missing Dependencies

```typescript
import { getMissingDependencies } from '@/config/featureFlagsV12';

const missing = getMissingDependencies('stakingOperations');

console.log(missing.endpoints);        // Unimplemented API endpoints
console.log(missing.envVars);          // Missing env variables
console.log(missing.requiredFeatures); // Disabled required features
```

### Get Features by Category

```typescript
import { getFeaturesByCategory } from '@/config/featureFlagsV12';

const validatorFeatures = getFeaturesByCategory('validator');
// Returns: [validatorDashboard, stakingOperations]
```

### Get Features by Status

```typescript
import { getFeaturesByStatus } from '@/config/featureFlagsV12';

const plannedFeatures = getFeaturesByStatus('planned');
// Returns all features with status: 'planned'
```

### React Component Example

```typescript
import React from 'react';
import { isFeatureEnabled, getFeatureConfig } from '@/config/featureFlagsV12';

const ValidatorDashboard: React.FC = () => {
  const config = getFeatureConfig('validatorDashboard');

  if (!config.enabled) {
    return <div>Feature disabled</div>;
  }

  if (!config.ready) {
    return (
      <div>
        <h2>Coming Soon</h2>
        <p>Validator Dashboard will be available in {config.dependencies.endpoints[0].targetVersion}</p>
      </div>
    );
  }

  return (
    <div>
      {/* Validator dashboard UI */}
    </div>
  );
};
```

---

## Feature Enablement Checklist

When a backend API becomes available, follow this checklist to enable the feature:

### 1. Backend Verification
- [ ] All required endpoints are implemented
- [ ] Endpoints return correct response format
- [ ] Authentication/authorization is working
- [ ] Rate limiting is configured
- [ ] Error handling is implemented

### 2. Update Feature Dependencies
- [ ] Update `implemented: true` in `featureFlagsV12.ts`
- [ ] Remove `targetVersion` if feature is production-ready
- [ ] Update `status` to reflect current state

### 3. Environment Configuration
- [ ] Add required environment variables to `.env.example`
- [ ] Document new environment variables in this guide
- [ ] Update deployment configurations

### 4. Update Default Flags
- [ ] Change feature flag default from `false` to `true` in `defaultFeatureFlagsV12`
- [ ] Verify dependent features are also enabled

### 5. Testing
- [ ] Test feature with real backend APIs
- [ ] Test feature with environment overrides
- [ ] Test dependency checking logic
- [ ] Test error handling when APIs fail

### 6. Documentation
- [ ] Update this guide with new feature details
- [ ] Add code examples for new feature usage
- [ ] Document any breaking changes
- [ ] Update API endpoint reference

### 7. Deployment
- [ ] Deploy backend changes first
- [ ] Verify backend health endpoints
- [ ] Deploy frontend with updated feature flags
- [ ] Monitor for errors in production

---

## API Endpoint Reference

### Base URLs

- **REST API**: `https://dlt.aurigraph.io/api/v11`
- **WebSocket**: `wss://dlt.aurigraph.io/ws`

### Authentication

All API endpoints require authentication via Bearer token:

```
Authorization: Bearer <token>
```

### Response Format

All endpoints return JSON with this structure:

```json
{
  "success": true,
  "data": { ... },
  "error": null,
  "timestamp": "2025-12-16T10:30:00Z"
}
```

### Error Response Format

```json
{
  "success": false,
  "data": null,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable error message",
    "details": { ... }
  },
  "timestamp": "2025-12-16T10:30:00Z"
}
```

---

## Migration Guide

### From V11 to V12

1. **Update Imports**
   ```typescript
   // Old
   import { isFeatureEnabled } from '@/config/featureFlags';

   // New
   import { isFeatureEnabled } from '@/config/featureFlagsV12';
   ```

2. **Use Enhanced API**
   ```typescript
   // Old - basic check
   if (isFeatureEnabled('validatorDashboard')) { ... }

   // New - check readiness
   import { isFeatureReady } from '@/config/featureFlagsV12';
   if (isFeatureReady('validatorDashboard')) { ... }
   ```

3. **Add Environment Variables**
   - Review `.env.example` for new variables
   - Add to deployment configurations
   - Test with overrides

---

## Support

For questions or issues:
- Backend API: Contact backend team
- Feature Flags: Contact frontend team
- Documentation: Update this guide via PR

---

**Last Updated**: 2025-12-16
**Version**: 12.0.0
**Author**: J4C Frontend Agent
