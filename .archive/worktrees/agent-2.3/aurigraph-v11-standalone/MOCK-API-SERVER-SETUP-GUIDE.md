# Mock API Server Setup Guide for Sprint 13-15
**Date**: October 30, 2025
**Status**: Ready for Implementation (Nov 1, 2025)
**Purpose**: Enable development and testing of 15 components without production backend

---

## Overview

This guide enables the development team to build and test all 15 Sprint 13-15 React components without requiring the V12 backend to be operational. The mock API server simulates all 26 API endpoints with realistic data and proper response times.

**Setup Timeline**:
- Oct 30: This document prepared
- Nov 1: Deploy mock API servers
- Nov 2-3: Team validation and troubleshooting
- Nov 4: Sprint 13 development begins with mock APIs

---

## Prerequisites

### Required Software
```bash
# Node.js 18+ (for MSW and development)
node --version          # Should be v18.0.0 or higher

# npm 9+ (for package management)
npm --version           # Should be v9.0.0 or higher

# Git (for version control)
git --version           # Should be v2.30.0 or higher

# Optional: Docker (for containerized setup)
docker --version        # For docker-based deployment
```

### Required Access
- ✅ GitHub repository write access
- ✅ Development environment setup
- ✅ npm registry access
- ✅ localhost ports available (3000, 3001, 8080, 9000)

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────┐
│           React Development Environment              │
│  (Sprint 13-15 Components + Tests)                   │
└────────────────┬────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────┐
│     Mock Service Worker (MSW) Framework              │
│  (Browser-level request interception)                │
└────────────────┬────────────────────────────────────┘
                 │
         ┌───────┴────────┐
         ▼                ▼
    ┌─────────────┐  ┌──────────────┐
    │ Development │  │  Test Suite  │
    │   Server    │  │  (Vitest)    │
    │ (Vite:5173) │  │              │
    └─────────────┘  └──────────────┘

Alternative: Standalone Mock API Server (Optional)
┌─────────────────────────────────────────────────────┐
│      Node.js Express Mock API Server                 │
│  (For advanced scenarios or production testing)      │
└─────────────────────────────────────────────────────┘
```

---

## Setup Steps

### Step 1: Install Mock Service Worker (MSW)

MSW is the primary solution for mocking APIs at the browser level. It provides request interception without code changes.

```bash
cd aurigraph-av10-7/aurigraph-v11-standalone/enterprise-portal

# Install MSW
npm install msw --save-dev

# Verify installation
npm list msw
```

**Expected Output**:
```
enterprise-portal@4.6.0 /path/to/enterprise-portal
└── msw@2.0.11
```

### Step 2: Create MSW Handler Setup

Create the Mock Service Worker handlers for all 26 API endpoints.

**File**: `enterprise-portal/src/__mocks__/handlers.ts`

```typescript
import { http, HttpResponse } from 'msw';

const API_BASE = 'http://localhost:9003/api/v11';

// Mock data generators
const mockBlockchainStats = {
  currentTPS: 2100000,
  activeValidators: 127,
  blockHeight: 15234567,
  networkLatency: 42,
  totalTransactions: 8234567890,
};

const mockValidators = Array.from({ length: 100 }, (_, i) => ({
  id: `validator-${i + 1}`,
  address: `0x${Math.random().toString(16).slice(2)}`,
  votingPower: Math.floor(Math.random() * 1000000),
  uptime: 99.5 + Math.random() * 0.5,
  blocksProposed: Math.floor(Math.random() * 10000),
  status: Math.random() > 0.05 ? 'active' : 'offline',
}));

// Define all handlers
export const handlers = [
  // P0 Priority Endpoints
  http.get(`${API_BASE}/blockchain/network/stats`, () => {
    return HttpResponse.json(mockBlockchainStats);
  }),

  http.get(`${API_BASE}/blockchain/network/topology`, () => {
    return HttpResponse.json({
      nodes: Array.from({ length: 50 }, (_, i) => ({
        id: `node-${i}`,
        type: ['validator', 'archive', 'light'][Math.floor(Math.random() * 3)],
        region: ['US', 'EU', 'ASIA'][Math.floor(Math.random() * 3)],
        uptime: 99 + Math.random() * 1,
      })),
      edges: Array.from({ length: 200 }, (_, i) => ({
        source: `node-${Math.floor(Math.random() * 50)}`,
        target: `node-${Math.floor(Math.random() * 50)}`,
        latency: 10 + Math.random() * 100,
      })),
    });
  }),

  http.get(`${API_BASE}/validators`, () => {
    return HttpResponse.json({
      data: mockValidators,
      total: mockValidators.length,
      page: 1,
      pageSize: 100,
    });
  }),

  http.get(`${API_BASE}/validators/:id/performance`, () => {
    return HttpResponse.json({
      id: 'validator-1',
      uptime: 99.8,
      blocksProposed: 4523,
      avgBlockTime: 2.1,
      errorRate: 0.002,
      latency: {
        p50: 45,
        p95: 95,
        p99: 120,
      },
    });
  }),

  http.get(`${API_BASE}/blockchain/blocks/latest`, () => {
    return HttpResponse.json({
      data: Array.from({ length: 10 }, (_, i) => ({
        height: 15234567 - i,
        hash: `0x${Math.random().toString(16).slice(2)}`,
        timestamp: Date.now() - i * 12000,
        transactions: Math.floor(Math.random() * 500),
        miner: `validator-${Math.floor(Math.random() * 127)}`,
      })),
    });
  }),

  http.get(`${API_BASE}/blockchain/blocks/search`, () => {
    return HttpResponse.json({
      data: Array.from({ length: 20 }, (_, i) => ({
        height: 15234567 - i,
        hash: `0x${Math.random().toString(16).slice(2)}`,
        timestamp: Date.now() - i * 12000,
        transactions: Math.floor(Math.random() * 500),
      })),
      total: 1000,
      page: 1,
      pageSize: 20,
    });
  }),

  // P1 Priority Endpoints
  http.get(`${API_BASE}/ai/models/:id/metrics`, () => {
    return HttpResponse.json({
      modelId: 'ml-load-balancer-v1',
      accuracy: 0.961,
      f1Score: 0.958,
      precision: 0.965,
      recall: 0.952,
      trainingTime: 300,
      samples: 12500,
    });
  }),

  http.get(`${API_BASE}/ai/consensus/predictions`, () => {
    return HttpResponse.json({
      predictions: Array.from({ length: 10 }, (_, i) => ({
        timestamp: Date.now() - i * 60000,
        predictedTPS: 2100000 + Math.random() * 100000,
        confidence: 0.92 + Math.random() * 0.06,
      })),
    });
  }),

  http.get(`${API_BASE}/security/audit-logs`, () => {
    return HttpResponse.json({
      data: Array.from({ length: 50 }, (_, i) => ({
        id: `log-${i}`,
        timestamp: Date.now() - i * 3600000,
        action: ['create', 'update', 'delete', 'access'][Math.floor(Math.random() * 4)],
        user: `user-${Math.floor(Math.random() * 100)}`,
        resource: `resource-${Math.floor(Math.random() * 1000)}`,
        status: Math.random() > 0.02 ? 'success' : 'failed',
      })),
      total: 10000,
      page: 1,
      pageSize: 50,
    });
  }),

  http.get(`${API_BASE}/rwa/portfolio`, () => {
    return HttpResponse.json({
      assets: Array.from({ length: 50 }, (_, i) => ({
        id: `asset-${i}`,
        name: `Real World Asset #${i}`,
        type: ['property', 'commodity', 'artwork'][Math.floor(Math.random() * 3)],
        value: Math.random() * 10000000,
        tokenSupply: Math.floor(Math.random() * 1000000),
      })),
      totalValue: 250000000,
      lastUpdate: Date.now(),
    });
  }),

  http.get(`${API_BASE}/tokens/:id/management`, () => {
    return HttpResponse.json({
      tokenId: 'token-1',
      name: 'Token Name',
      symbol: 'TKN',
      totalSupply: 1000000,
      circulatingSupply: 750000,
      holders: 45000,
      transfers24h: 12000,
    });
  }),

  // P2 Priority Endpoints (simplified)
  http.get(`${API_BASE}/analytics/dashboard`, () => {
    return HttpResponse.json({
      tpsHistory: Array.from({ length: 24 }, (_, i) => ({
        timestamp: Date.now() - i * 3600000,
        tps: 2100000 + Math.random() * 200000,
      })),
      transactionBreakdown: {
        transfers: 45,
        contracts: 30,
        governance: 15,
        other: 10,
      },
    });
  }),

  http.get(`${API_BASE}/analytics/performance`, () => {
    return HttpResponse.json({
      cpu: 75 + Math.random() * 20,
      memory: 65 + Math.random() * 30,
      disk: 45 + Math.random() * 10,
      network: 500 + Math.random() * 500,
    });
  }),

  http.get(`${API_BASE}/system/health`, () => {
    return HttpResponse.json({
      status: 'healthy',
      timestamp: Date.now(),
      services: {
        database: 'healthy',
        cache: 'healthy',
        messageQueue: 'healthy',
        blockchain: 'healthy',
      },
    });
  }),

  // Add remaining endpoints...
  // (Would continue for all 26 endpoints)
];
```

### Step 3: Create MSW Server Setup

**File**: `enterprise-portal/src/__mocks__/server.ts`

```typescript
import { setupServer } from 'msw/node';
import { handlers } from './handlers';

// This configures a request mocking server with the given request handlers.
export const server = setupServer(...handlers);
```

### Step 4: Setup MSW in Test Files

**File**: `enterprise-portal/src/test/setup.ts`

```typescript
import { beforeAll, afterEach, afterAll } from 'vitest';
import { server } from '../__mocks__/server';

// Start server before all tests
beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));

// Reset handlers after each test
afterEach(() => server.resetHandlers());

// Clean up after the tests are finished
afterAll(() => server.close());
```

### Step 5: Update Vitest Configuration

**File**: `enterprise-portal/vitest.config.ts`

```typescript
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      lines: 85,
      functions: 85,
      branches: 80,
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
```

---

## Testing the Mock API Setup

### Verify MSW is Working

```bash
# Start development server
cd enterprise-portal
npm run dev

# In another terminal, test API call
curl http://localhost:5173/api/v11/blockchain/network/stats

# Should return mock data with:
# - currentTPS: 2100000
# - activeValidators: 127
# - blockHeight: 15234567
# - networkLatency: 42
```

### Run Component Tests with Mock APIs

```bash
# Run all tests
npm test

# Run specific test file
npm test -- NetworkTopology.test.tsx

# Run with coverage
npm run test:coverage

# Expected: All tests pass with >85% coverage
```

---

## Alternative: Standalone Mock API Server (Optional)

For more advanced scenarios, you can run a standalone mock API server:

**File**: `enterprise-portal/mock-server.js`

```javascript
const express = require('express');
const cors = require('cors');
const app = express();

app.use(cors());
app.use(express.json());

const API_PREFIX = '/api/v11';

// Blockchain endpoints
app.get(`${API_PREFIX}/blockchain/network/stats`, (req, res) => {
  res.json({
    currentTPS: 2100000,
    activeValidators: 127,
    blockHeight: 15234567,
    networkLatency: 42,
  });
});

// Add all 26 endpoint handlers...

app.listen(3000, () => {
  console.log('Mock API server running on http://localhost:3000');
});
```

**To run**:
```bash
node mock-server.js

# Update API_BASE in development to:
# const API_BASE = 'http://localhost:3000/api/v11';
```

---

## Configuration Options

### Environment Variables

**File**: `enterprise-portal/.env.development`

```bash
# API Configuration
VITE_API_BASE_URL=http://localhost:9003/api/v11
VITE_MOCK_API_ENABLED=true

# WebSocket Configuration (mock)
VITE_WS_URL=ws://localhost:8080
VITE_WS_MOCK_ENABLED=true

# Performance Testing
VITE_ENABLE_PERFORMANCE_MONITORING=true
VITE_BENCHMARK_ENABLED=true
```

### Enable/Disable Mock APIs Per Component

```typescript
// In component file
const useApi = () => {
  const useMock = process.env.VITE_MOCK_API_ENABLED === 'true';

  if (useMock) {
    return createMockApiClient();
  }
  return createRealApiClient();
};
```

---

## Performance Considerations

### Mock API Response Times

By default, MSW responds instantly. To simulate realistic latency:

```typescript
// In handlers.ts
http.get(`${API_BASE}/blockchain/network/stats`, async () => {
  // Simulate 50-100ms network latency
  await new Promise(resolve => setTimeout(resolve, 50 + Math.random() * 50));

  return HttpResponse.json(mockBlockchainStats);
}),
```

### Data Generation Performance

Generate realistic data efficiently:

```typescript
// Cache generated data instead of regenerating on each request
let cachedValidators: any[] | null = null;

const getValidators = () => {
  if (!cachedValidators) {
    cachedValidators = Array.from({ length: 100 }, (_, i) => ({
      id: `validator-${i + 1}`,
      // ... rest of validator data
    }));
  }
  return cachedValidators;
};
```

---

## Troubleshooting

### Issue: "Failed to fetch" errors in browser

**Solution**: Ensure MSW is properly initialized in your main test setup file:

```typescript
// vitest.config.ts
setupFiles: ['./src/test/setup.ts'],  // Must be in setupFiles
```

### Issue: MSW not intercepting requests

**Solution**: Check that request URL exactly matches the handler pattern:

```typescript
// CORRECT
http.get(`${API_BASE}/validators`, handler)

// INCORRECT (will not match)
http.get(`${API_BASE}/validators/`, handler)  // Extra trailing slash
http.get(`${API_BASE}/Validators`, handler)   // Wrong case
```

### Issue: Port already in use

**Solution**: Kill process using the port and restart:

```bash
# Find process using port 3000
lsof -i :3000

# Kill process
kill -9 <PID>

# Restart development server
npm run dev
```

---

## Deployment Checklist (Nov 1, 2025)

### Pre-Deployment
- [ ] All 26 API endpoints defined in handlers.ts
- [ ] Mock data generators working correctly
- [ ] Vitest configuration updated
- [ ] Test setup files created
- [ ] MSW installed and working
- [ ] All dependencies in package.json

### Deployment
- [ ] Code reviewed and committed
- [ ] Tests pass locally (npm test)
- [ ] Development server starts without errors (npm run dev)
- [ ] API calls return expected data
- [ ] Performance benchmarks show <50ms latency

### Post-Deployment
- [ ] Team notified of mock API availability
- [ ] Development environment validated by 2+ team members
- [ ] Backup documented for switching to real APIs
- [ ] Fallback procedure tested (switch to real backend)

---

## Switching to Real Backend

When the V12 backend is operational, switch from mock APIs to real APIs:

```typescript
// In handlers configuration
if (process.env.NODE_ENV === 'production') {
  // Use real backend
  // No MSW handlers - requests go to real API
} else {
  // Use mock APIs
  // MSW intercepts requests
}
```

Or update API base URL:
```bash
# .env.development
VITE_API_BASE_URL=http://localhost:9003/api/v11  # Real backend

# .env.test
VITE_API_BASE_URL=http://localhost:5173/api/v11  # Mock API (MSW)
```

---

## Support & Escalation

**For Setup Issues**:
1. Check MSW documentation: https://mswjs.io
2. Review handler patterns against actual API contracts
3. Ensure Node.js version is 18+
4. Clear node_modules and reinstall: `npm ci`

**For Performance Issues**:
1. Profile handlers with Chrome DevTools
2. Implement data caching
3. Reduce mock data size if needed
4. Use lazy loading for large datasets

---

## Next Steps

1. **Nov 1**: Deploy mock API servers
2. **Nov 2**: Team training on MSW and mock APIs
3. **Nov 3**: Validate mock APIs with sample requests
4. **Nov 4**: Sprint 13 development begins with mock APIs

---

**Document Version**: 1.0
**Last Updated**: October 30, 2025
**Status**: Ready for Deployment
**Deployment Date**: November 1, 2025
