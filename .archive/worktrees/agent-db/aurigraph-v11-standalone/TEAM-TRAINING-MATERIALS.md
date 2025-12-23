# Sprint 13-15 Team Training Materials
**Date**: October 30, 2025
**Training Schedule**: November 2 (Saturday) - 2 hours
**Audience**: All developers, QA, DevOps team members
**Status**: Ready for Delivery

---

## Training Agenda (2 Hours Total)

### Session 1: Git & GitHub Workflow (30 minutes)
**Trainer**: DevOps Lead
**Time**: 10:00 - 10:30 AM

### Session 2: Component Architecture & Code Patterns (30 minutes)
**Trainer**: Frontend Lead (FDA)
**Time**: 10:30 - 11:00 AM

### Session 3: Testing & Performance Benchmarking (30 minutes)
**Trainer**: QA Lead
**Time**: 11:00 - 11:30 AM

### Session 4: Q&A & Development Environment Setup (30 minutes)
**Trainer**: All leads + Tech Leads
**Time**: 11:30 AM - 12:00 PM

---

## Module 1: Git & GitHub Workflow (30 Minutes)

### Learning Objectives
- Understand feature branch strategy
- Know how to create and manage pull requests
- Understand JIRA-GitHub synchronization
- Know commit message conventions

### Sprint 13-15 Branch Strategy

```bash
# Base branch
main (protected)

# Feature branches (one per JIRA ticket)
feature/sprint-13-network-topology
feature/sprint-13-block-search
feature/sprint-13-validator-performance
feature/sprint-13-ai-metrics
feature/sprint-13-audit-log
feature/sprint-13-rwa-portfolio
feature/sprint-13-token-management
feature/sprint-14-advanced-explorer
...and 7 more for Sprint 14
```

### Creating a Feature Branch

```bash
# Step 1: Update main branch
git checkout main
git pull origin main

# Step 2: Create feature branch from JIRA ticket
git checkout -b feature/sprint-13-network-topology

# Step 3: Make changes (develop component)
# ... edit files ...

# Step 4: Commit changes
git add .
git commit -m "feat: Implement NetworkTopology component

- Create NetworkTopology.tsx (350+ LOC)
- Add visualization with D3.js/Vis.js
- Integrate network topology API
- Add 85%+ test coverage
- Support real-time WebSocket updates

JIRA: AV11-XXX"

# Step 5: Push to remote
git push origin feature/sprint-13-network-topology
```

### Commit Message Convention

```
[Type]: [Description]

[Detailed explanation of changes, 1-3 sentences]

Optional:
- Implementation details
- Design decisions
- Breaking changes
- Issue references: Fixes #123, Related to #456

JIRA: AV11-XXX
```

**Types**:
- `feat`: New feature
- `fix`: Bug fix
- `refactor`: Code restructuring
- `test`: Test additions/changes
- `docs`: Documentation
- `perf`: Performance improvements

### Pull Request Workflow

```bash
# Step 1: Create PR on GitHub
# Go to https://github.com/Aurigraph-DLT-Corp/Aurigraph-DLT
# Click "New Pull Request"
# Base: main
# Compare: feature/sprint-13-network-topology

# Step 2: Fill PR template
Title: "feat: Implement NetworkTopology component (AV11-XXX)"

Description:
## Changes
- NetworkTopology.tsx component
- Real-time WebSocket integration
- 85%+ test coverage

## Testing
- [x] Unit tests pass
- [x] Component tests pass
- [x] Coverage >= 85%
- [x] Performance benchmarks met

## Review
- [x] Code follows TypeScript strict mode
- [x] All tests passing
- [x] No console errors/warnings
- [x] Accessibility (WCAG 2.1 AA) compliant

# Step 3: Request reviewers (2+ required)
# Assign FDA Lead, Backend Support

# Step 4: Address review comments
git add .
git commit -m "refactor: Address review feedback

- Component refactoring per review
- Improved error handling
- Added edge case tests"
git push origin feature/sprint-13-network-topology

# Step 5: Merge when approved
# GitHub: Click "Squash and Merge"
# Delete remote branch
```

### JIRA-GitHub Synchronization

```
JIRA Ticket → GitHub Branch → Pull Request → Code Merge → Status Update

Example Flow:
1. Create ticket AV11-123 in JIRA: "Implement NetworkTopology"
2. Create branch: feature/sprint-13-network-topology
3. Create PR with JIRA reference: "Fixes AV11-123"
4. GitHub automatically updates JIRA ticket
5. When PR merges, JIRA status → Done
```

**Automatic Updates**:
```
PR Title: "feat: Implement NetworkTopology (Fixes AV11-123)"
   ↓
JIRA Webhook detects "Fixes AV11-123"
   ↓
JIRA ticket transitions to "In Progress"
   ↓
When PR merges
   ↓
JIRA ticket transitions to "Done"
```

---

## Module 2: Component Architecture & Code Patterns (30 Minutes)

### Learning Objectives
- Understand component structure for Sprint 13-15
- Know how to integrate APIs using RTK Query
- Understand how to add WebSocket support
- Know accessibility requirements

### Component Structure Template

```typescript
// File: src/components/NetworkTopology/NetworkTopology.tsx

import React, { useState, useEffect } from 'react';
import { Box, CircularProgress, Alert } from '@mui/material';
import { useGetNetworkTopologyQuery } from '@/api/blockchainApi';
import { useWebSocket } from '@/hooks/useWebSocket';
import NetworkVisualization from './NetworkVisualization';
import ErrorBoundary from '@/components/ErrorBoundary';

// 1. Define TypeScript interfaces
interface Node {
  id: string;
  type: 'validator' | 'archive' | 'light';
  region: string;
  uptime: number;
}

interface NetworkTopologyProps {
  autoRefresh?: boolean;
  refreshInterval?: number;
}

// 2. Main component
const NetworkTopology: React.FC<NetworkTopologyProps> = ({
  autoRefresh = true,
  refreshInterval = 5000,
}) => {
  // 3. State management
  const [error, setError] = useState<string | null>(null);

  // 4. API integration with RTK Query
  const { data, isLoading, error: apiError } = useGetNetworkTopologyQuery({
    enabled: true,
  });

  // 5. WebSocket integration (real-time updates)
  useWebSocket('network-topology-updates', (newData) => {
    // Handle real-time updates
  });

  // 6. Effects
  useEffect(() => {
    if (apiError) {
      setError('Failed to load network topology');
    }
  }, [apiError]);

  // 7. Error handling
  if (error) {
    return <Alert severity="error">{error}</Alert>;
  }

  // 8. Loading state
  if (isLoading) {
    return <CircularProgress />;
  }

  // 9. Render content
  return (
    <ErrorBoundary>
      <Box sx={{ p: 2 }}>
        <NetworkVisualization nodes={data?.nodes} edges={data?.edges} />
      </Box>
    </ErrorBoundary>
  );
};

export default NetworkTopology;
```

### API Integration with RTK Query

```typescript
// File: src/api/blockchainApi.ts

import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

const API_BASE = process.env.VITE_API_BASE_URL || 'http://localhost:9003/api/v11';

export const blockchainApi = createApi({
  reducerPath: 'blockchainApi',
  baseQuery: fetchBaseQuery({
    baseUrl: API_BASE,
    prepareHeaders: (headers) => {
      // Add authentication token if available
      const token = localStorage.getItem('authToken');
      if (token) {
        headers.set('Authorization', `Bearer ${token}`);
      }
      return headers;
    },
  }),
  endpoints: (builder) => ({
    // P0 Endpoints
    getNetworkTopology: builder.query({
      query: () => '/blockchain/network/topology',
      // Cache for 5 minutes
      keepUnusedDataFor: 300,
    }),

    getValidators: builder.query({
      query: ({ page = 1, limit = 100 } = {}) =>
        `/validators?page=${page}&limit=${limit}`,
    }),

    // P1 Endpoints
    getNetworkStats: builder.query({
      query: () => '/blockchain/network/stats',
      pollingInterval: 10000, // Refresh every 10 seconds
    }),

    // Add more endpoints...
  }),
});

export const {
  useGetNetworkTopologyQuery,
  useGetValidatorsQuery,
  useGetNetworkStatsQuery,
} = blockchainApi;
```

### WebSocket Integration Pattern

```typescript
// File: src/hooks/useWebSocket.ts

import { useEffect, useRef } from 'react';

export const useWebSocket = (channel: string, onMessage: (data: any) => void) => {
  const wsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    const WS_URL = process.env.VITE_WS_URL || 'ws://localhost:8080';

    // Create WebSocket connection
    wsRef.current = new WebSocket(`${WS_URL}?channel=${channel}`);

    // Handle incoming messages
    wsRef.current.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        onMessage(data);
      } catch (error) {
        console.error('Failed to parse WebSocket message:', error);
      }
    };

    // Error handling
    wsRef.current.onerror = (error) => {
      console.error('WebSocket error:', error);
      // Implement reconnection logic
    };

    // Cleanup
    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [channel, onMessage]);

  return wsRef.current;
};
```

### Testing Pattern

```typescript
// File: src/components/NetworkTopology/NetworkTopology.test.tsx

import { render, screen, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';
import { setupStore } from '@/store';
import NetworkTopology from './NetworkTopology';

describe('NetworkTopology Component', () => {
  it('should render network visualization with nodes', async () => {
    const store = setupStore();

    render(
      <Provider store={store}>
        <NetworkTopology />
      </Provider>
    );

    // Wait for component to load data
    await waitFor(() => {
      expect(screen.getByText(/network topology/i)).toBeInTheDocument();
    });

    // Assertions
    expect(screen.getByRole('canvas')).toBeInTheDocument();
  });

  it('should display error message on API failure', async () => {
    // Mock API error
    server.use(
      http.get(`${API_BASE}/blockchain/network/topology`, () => {
        return HttpResponse.error();
      })
    );

    const store = setupStore();

    render(
      <Provider store={store}>
        <NetworkTopology />
      </Provider>
    );

    // Wait for error message
    await waitFor(() => {
      expect(screen.getByText(/failed to load/i)).toBeInTheDocument();
    });
  });

  it('should update topology on WebSocket message', async () => {
    // Test WebSocket functionality
    // ...
  });

  // Performance test
  it('should render in less than 400ms', async () => {
    const start = performance.now();
    render(<NetworkTopology />);
    const end = performance.now();

    expect(end - start).toBeLessThan(400);
  });
});
```

### Accessibility Requirements (WCAG 2.1 AA)

```typescript
// Add accessibility attributes
<Box
  role="region"
  aria-label="Network Topology Visualization"
  aria-live="polite"
>
  {/* Content */}
</Box>

// Add keyboard navigation
<button
  onClick={handleExpandDetails}
  aria-expanded={isExpanded}
  aria-controls="node-details"
>
  View Details
</button>

// Alt text for images
<img
  src={networkImage}
  alt="Network topology showing 50 validator nodes connected in a peer-to-peer network"
/>

// Color contrast ratio >= 4.5:1 for normal text
// >= 3:1 for large text
// Use Material-UI themes for compliance
```

---

## Module 3: Testing & Performance Benchmarking (30 Minutes)

### Learning Objectives
- Run unit and integration tests
- Execute performance benchmarks
- Understand coverage requirements
- Profile components for performance

### Running Tests

```bash
# Run all tests
npm test

# Run specific test file
npm test -- NetworkTopology.test.tsx

# Run tests in watch mode (recommended for development)
npm test -- --watch

# Run tests with coverage report
npm run test:coverage

# Open coverage report in browser
open coverage/index.html
```

### Coverage Requirements

**Target Coverage**: 85% line coverage, 85% function coverage

```bash
# View coverage report
cat coverage/coverage-summary.json

# Example output:
{
  "lines": { "total": 1000, "covered": 850, "skipped": 0, "pct": 85.0 },
  "functions": { "total": 200, "covered": 170, "skipped": 0, "pct": 85.0 },
  "branches": { "total": 300, "covered": 240, "skipped": 0, "pct": 80.0 }
}
```

### Performance Benchmarking

```bash
# Run performance benchmarks (Jest)
npm run test:performance

# Run Lighthouse audit
npm run audit:lighthouse

# View performance metrics
npm run benchmark:components
```

### Profiling Components

```bash
# 1. Open Chrome DevTools (F12)
# 2. Go to Performance tab
# 3. Click Record
# 4. Perform actions in component
# 5. Stop recording
# 6. Analyze:
#    - Rendering time
#    - Paint time
#    - FCP (First Contentful Paint)
#    - LCP (Largest Contentful Paint)

# Expected targets:
# - Initial render: <400ms
# - Re-render: <100ms
# - FCP: <700ms
# - LCP: <2.5s
```

### Memory Profiling

```bash
# 1. Open Chrome DevTools (F12)
# 2. Go to Memory tab
# 3. Take heap snapshot (initial)
# 4. Perform actions (1000 updates)
# 5. Take heap snapshot (final)
# 6. Compare snapshots
#    - Memory growth should be < 5MB
#    - No detached DOM nodes
#    - No memory leaks

# Expected targets:
# - Per component: <25MB
# - Total for all 15 comps: <100MB
```

---

## Module 4: Q&A & Development Environment Setup (30 Minutes)

### Common Questions & Answers

**Q: How do I switch between mock and real APIs?**

A: Update the API_BASE_URL in environment variables:
```bash
# Development (mock APIs)
VITE_API_BASE_URL=http://localhost:9003/api/v11  # MSW intercepts

# Production (real backend)
VITE_API_BASE_URL=https://dlt.aurigraph.io/api/v11
```

**Q: How do I debug a failing component test?**

A: Use Vitest debug mode:
```bash
# Run with debugging
npm test -- --inspect-brk

# Or add breakpoints in test file
it('should render component', async () => {
  debugger; // Chrome DevTools will pause here
  render(<Component />);
});
```

**Q: What if the WebSocket mock doesn't work?**

A: Use polling as fallback:
```typescript
// Option 1: Use polling (slower)
useQuery({
  queryKey: ['data'],
  queryFn: fetchData,
  refetchInterval: 5000, // Poll every 5 seconds
});

// Option 2: Manual polling
useEffect(() => {
  const interval = setInterval(refreshData, 5000);
  return () => clearInterval(interval);
}, []);
```

**Q: How do I improve component render time?**

A: Use React optimization techniques:
```typescript
// 1. Memoize component
const MemoizedComponent = React.memo(Component);

// 2. Use useMemo for expensive calculations
const expensiveValue = useMemo(() => {
  return calculateComplexValue(data);
}, [data]);

// 3. Use useCallback for stable callbacks
const handleClick = useCallback(() => {
  // Handle click
}, [dependency]);

// 4. Code splitting
const HeavyComponent = React.lazy(() => import('./HeavyComponent'));
```

### Environment Setup Validation Checklist

Each developer should verify:

```bash
# ✅ Node.js version
node --version          # Should be v18.0.0+

# ✅ npm version
npm --version           # Should be v9.0.0+

# ✅ Git configuration
git config user.name
git config user.email

# ✅ Project setup
cd enterprise-portal
npm install            # Install dependencies
npm run dev            # Start dev server (should work without errors)

# ✅ Test setup
npm test -- --run     # Tests should pass

# ✅ API connectivity
curl http://localhost:5173/api/v11/blockchain/network/stats
# Should return mock JSON data

# ✅ Git access
git remote -v
# Should show GitHub repository URLs
```

### Setting Up Local Development Environment

```bash
# Step 1: Clone repository
git clone https://github.com/Aurigraph-DLT-Corp/Aurigraph-DLT.git
cd Aurigraph-DLT

# Step 2: Navigate to enterprise portal
cd aurigraph-av10-7/aurigraph-v11-standalone/enterprise-portal

# Step 3: Install dependencies
npm install

# Step 4: Create feature branch
git checkout -b feature/sprint-13-your-component

# Step 5: Start development
npm run dev                    # Start Vite dev server (port 5173)

# Step 6: Open in browser
# Navigate to http://localhost:5173

# Step 7: Verify mock APIs working
curl http://localhost:5173/api/v11/blockchain/network/stats
```

### IDE Setup Recommendations

**VS Code Extensions**:
```json
{
  "recommendations": [
    "dbaeumer.vscode-eslint",
    "esbenp.prettier-vscode",
    "ms-vscode.vscode-typescript-next",
    "redhat.vscode-yaml",
    "eamodio.gitlens",
    "vitest.explorer"
  ]
}
```

**VS Code Settings** (`settings.json`):
```json
{
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  },
  "typescript.enablePromptUseWorkspaceTsdk": true,
  "[typescript]": {
    "editor.defaultFormatter": "esbenp.prettier-vscode"
  }
}
```

---

## Troubleshooting Common Issues

### Issue: "npm install" fails

**Solution**:
```bash
# Clear npm cache
npm cache clean --force

# Remove node_modules and package-lock.json
rm -rf node_modules package-lock.json

# Reinstall
npm install
```

### Issue: "Cannot find module" errors

**Solution**:
```bash
# Check path aliases in tsconfig.json
# Common aliases: @, @components, @hooks, @api

# Verify import statement matches alias:
import Component from '@components/MyComponent'  // Correct
import Component from './../../components/MyComponent'  // Avoid
```

### Issue: Tests failing with "ReferenceError: document is not defined"

**Solution**:
```typescript
// Ensure vitest.config.ts has:
{
  test: {
    environment: 'jsdom',  // Provides document object
    setupFiles: ['./src/test/setup.ts'],  // MSW setup
  }
}
```

### Issue: WebSocket connection refused

**Solution**:
```typescript
// Check WebSocket URL
const WS_URL = process.env.VITE_WS_URL || 'ws://localhost:8080';

// During development, MSW mocks WebSocket
// No real WebSocket server needed for testing
```

---

## Post-Training Checklist

After training completion, verify each team member has:

```
Development Environment:
  ☐ Node.js 18+ installed
  ☐ Repository cloned locally
  ☐ Dependencies installed (npm install)
  ☐ Dev server runs successfully (npm run dev)
  ☐ Tests run successfully (npm test)

Git Setup:
  ☐ Git configured with name and email
  ☐ Feature branch created
  ☐ Can push to remote repository
  ☐ Can create pull requests

Component Development:
  ☐ Can create React components in TypeScript
  ☐ Understands RTK Query API integration
  ☐ Can write tests with >85% coverage
  ☐ Knows accessibility requirements

Performance:
  ☐ Can run performance benchmarks
  ☐ Understands component render targets
  ☐ Can profile components with DevTools
  ☐ Knows memory profiling techniques

Support:
  ☐ Has access to Slack/Teams channel
  ☐ Knows who to ask for help
  ☐ Has links to documentation
  ☐ Can access JIRA board
```

---

## Training Materials Package

**Files Needed for Training**:
1. TEAM-TRAINING-MATERIALS.md (this file)
2. SPRINT-13-15-COMPONENT-REVIEW.md (component specs)
3. SPRINT-13-15-PERFORMANCE-BENCHMARKS.md (performance targets)
4. MOCK-API-SERVER-SETUP-GUIDE.md (API setup)
5. Sample component template (reference implementation)

**Presentation Format**:
- Slides: PowerPoint/Google Slides
- Code Examples: Live coding in IDE
- Demonstrations: Show working component
- Q&A: 10 minutes for questions

---

## Training Success Metrics

**We know training was successful when**:
- ✅ 100% of team members attend
- ✅ All setup validation checklists passed
- ✅ Team can run tests successfully
- ✅ Team can create feature branches
- ✅ Team can develop basic components
- ✅ Q&A answers are clear and understood

---

**Document Version**: 1.0
**Training Date**: November 2, 2025
**Prepared by**: Frontend Lead + QA Lead + DevOps Lead
**Expected Duration**: 2 hours
**Location**: TBD (Zoom or in-person)
