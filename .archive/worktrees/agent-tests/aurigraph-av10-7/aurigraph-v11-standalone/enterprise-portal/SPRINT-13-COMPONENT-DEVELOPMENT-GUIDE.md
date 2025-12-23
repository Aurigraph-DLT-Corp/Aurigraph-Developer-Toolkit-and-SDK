# SPRINT 13: COMPONENT DEVELOPMENT GUIDE
**For 8 Frontend Engineers (FDA-1 through FDA-8)**
**Created**: November 3, 2025
**Execution**: November 4-14, 2025

---

## 📋 QUICK START CHECKLIST

Before you start on November 4 at 11:00 AM:
- [ ] Java 21.0.8 installed: `java --version`
- [ ] Node.js 22.18.0 installed: `node --version`
- [ ] npm 10.9.3 installed: `npm --version`
- [ ] V11 backend running: `http://localhost:9003/api/v11/health` returns 200
- [ ] Your feature branch checked out: `git branch` shows your feature branch
- [ ] npm install completed: No errors
- [ ] Build succeeds: `npm run build` completes
- [ ] IDE ready: VS Code with TypeScript intellisense working

---

## 🎯 YOUR ASSIGNMENT

### FDA-1: Network Topology Component
**Branch**: `feature/sprint-13-network-topology`
**API Endpoint**: `/api/v11/blockchain/network/topology`
**Directory**: `src/pages/Components/NetworkTopology/`

**Responsibilities**:
1. Create React component to display network node topology
2. Show node types: Validator (3), Business (2), Slim (1) + target 72 nodes
3. Visualize node status: active, inactive, syncing
4. Display node connections
5. Auto-refresh every 5 seconds

**Component Structure**:
```typescript
export interface NetworkNode {
  id: string;
  name: string;
  type: 'validator' | 'business' | 'slim';
  status: 'active' | 'inactive' | 'syncing';
  tps?: number;
  uptime?: number;
}

export interface NetworkTopology {
  nodes: NetworkNode[];
  connections: Array<{ source: string; target: string }>;
  totalTps: number;
  timestamp: number;
}
```

---

### FDA-2: Block Search Component
**Branch**: `feature/sprint-13-block-search`
**API Endpoint**: `/api/v11/blockchain/blocks/search`
**Directory**: `src/pages/Components/BlockSearch/`

**Responsibilities**:
1. Create search interface for blockchain blocks
2. Search by block hash, height, timestamp, proposer
3. Display search results in table
4. Show block details: height, hash, transactions, proposer, timestamp
5. Pagination support (50 blocks per page)

**Component Structure**:
```typescript
export interface SearchQuery {
  query: string;
  type: 'hash' | 'height' | 'timestamp' | 'proposer';
  page: number;
  pageSize: number;
}

export interface BlockData {
  height: number;
  hash: string;
  transactions: number;
  proposer: string;
  timestamp: number;
  size: number;
}

export interface SearchResults {
  blocks: BlockData[];
  total: number;
  page: number;
  pageSize: number;
}
```

---

### FDA-3: Validator Performance Component
**Branch**: `feature/sprint-13-validator-performance`
**API Endpoint**: `/api/v11/validators/performance`
**Directory**: `src/pages/Components/ValidatorPerformance/`

**Responsibilities**:
1. Create dashboard for validator metrics
2. Show validator list with TPS, uptime, block proposals, latency
3. Performance charts: TPS over time, latency over time
4. Validator rankings by performance
5. Real-time updates every 10 seconds

**Component Structure**:
```typescript
export interface ValidatorMetrics {
  id: string;
  name: string;
  address: string;
  tps: number;
  uptime: number; // percentage
  blocksProposed: number;
  latency: number; // ms
  lastSeen: number; // timestamp
  rank: number;
}

export interface PerformanceData {
  validators: ValidatorMetrics[];
  timestamp: number;
  totalTps: number;
  averageLatency: number;
}
```

---

### FDA-4: AI Metrics Component
**Branch**: `feature/sprint-13-ai-metrics`
**API Endpoint**: `/api/v11/ai/metrics`
**Directory**: `src/pages/Components/AIMetrics/`

**Responsibilities**:
1. Display AI optimization metrics
2. Show transaction ordering accuracy
3. Anomaly detection results (target: 96.1% accuracy)
4. ML model performance over time
5. Top anomalies detected this period

**Component Structure**:
```typescript
export interface AIMetrics {
  transactionOrderingAccuracy: number; // percentage
  anomalyDetectionAccuracy: number;
  modelVersion: string;
  lastUpdated: number;
  predictedTpsImprovement: number; // percentage
}

export interface AnomalyDetected {
  id: string;
  type: string;
  severity: 'low' | 'medium' | 'high';
  timestamp: number;
  description: string;
  confidence: number;
}

export interface AIMetricsData {
  metrics: AIMetrics;
  recentAnomalies: AnomalyDetected[];
  accuracyHistory: Array<{ timestamp: number; accuracy: number }>;
}
```

---

### FDA-5: Audit Log Viewer Component
**Branch**: `feature/sprint-13-audit-log`
**API Endpoint**: `/api/v11/audit/logs`
**Directory**: `src/pages/Components/AuditLogViewer/`

**Responsibilities**:
1. Create audit log viewer with filtering
2. Show system events: transactions, stake changes, validator actions
3. Filter by event type, timestamp, user/validator
4. Display event details: action, actor, timestamp, result
5. Export audit logs to CSV

**Component Structure**:
```typescript
export interface AuditLogEntry {
  id: string;
  timestamp: number;
  eventType: string;
  actor: string;
  action: string;
  resource: string;
  result: 'success' | 'failure';
  details: Record<string, any>;
  ipAddress?: string;
}

export interface AuditLogFilter {
  eventType?: string;
  actor?: string;
  startTime?: number;
  endTime?: number;
  page: number;
  pageSize: number;
}

export interface AuditLogResponse {
  logs: AuditLogEntry[];
  total: number;
  page: number;
  pageSize: number;
}
```

---

### FDA-6: RWA Asset Manager Component
**Branch**: `feature/sprint-13-rwa-portfolio`
**API Endpoint**: `/api/v11/rwa/portfolio`
**Directory**: `src/pages/Components/RWAAssetManager/`

**Responsibilities**:
1. Create RWA (Real-World Asset) portfolio manager
2. Display tokenized assets: stocks, bonds, real estate, commodities
3. Show asset values and holdings
4. Display token details: mint address, total supply, holder count
5. Asset price history and performance

**Component Structure**:
```typescript
export interface RWAAsset {
  id: string;
  name: string;
  symbol: string;
  type: 'stock' | 'bond' | 'real-estate' | 'commodity';
  tokenAddress: string;
  totalSupply: number;
  holders: number;
  price: number;
  priceUsd: number;
  marketCap: number;
  volume24h: number;
}

export interface Portfolio {
  assets: RWAAsset[];
  totalValue: number;
  totalValueUsd: number;
  priceHistory: Array<{ timestamp: number; price: number }>;
  lastUpdated: number;
}
```

---

### FDA-7: Token Management Component
**Branch**: `feature/sprint-13-token-management`
**API Endpoint**: `/api/v11/tokens/manage`
**Directory**: `src/pages/Components/TokenManagement/`

**Responsibilities**:
1. Create token management interface
2. Show token balances: AUR, staking tokens, RWA tokens
3. Token transfer functionality
4. Staking interface: view stakes, claim rewards
5. Token history and transactions

**Component Structure**:
```typescript
export interface Token {
  symbol: string;
  address: string;
  balance: number;
  balanceUsd: number;
  price: number;
  decimals: number;
}

export interface StakingPosition {
  id: string;
  tokenSymbol: string;
  amount: number;
  startTime: number;
  apy: number;
  rewards: number;
  unclaimedRewards: number;
}

export interface TokenData {
  tokens: Token[];
  stakingPositions: StakingPosition[];
  totalValueUsd: number;
}
```

---

### FDA-8: Dashboard Layout Component
**Branch**: `feature/sprint-13-dashboard-layout`
**API Endpoint**: N/A (layout component)
**Directory**: `src/pages/Components/DashboardLayout/`

**Responsibilities**:
1. Create main dashboard layout using Material-UI Grid
2. Integrate all 7 above components
3. Responsive design: desktop, tablet, mobile
4. Widget sizing: 12 columns for full-width, 6 for half-width, 4 for third-width
5. Drag-and-drop widget reordering (future enhancement stub)

**Component Structure**:
```typescript
export interface DashboardWidget {
  id: string;
  name: string;
  component: React.ComponentType;
  width: number; // 4, 6, 12 (grid columns)
  height: number; // pixels
  position: { x: number; y: number };
}

export interface DashboardLayout {
  id: string;
  name: string;
  widgets: DashboardWidget[];
  theme: 'light' | 'dark';
  lastModified: number;
}
```

---

## 🛠️ DEVELOPMENT WORKFLOW

### Phase 1: Scaffolding (Day 1, 11:30 AM - 1:30 PM)

1. **Create component file**:
```bash
mkdir -p src/pages/Components/YourComponent
touch src/pages/Components/YourComponent/index.tsx
```

2. **Create component template**:
```typescript
import React, { useState, useEffect } from 'react';
import { Container, Paper, CircularProgress, Alert } from '@mui/material';

export interface YourComponentProps {
  // Define props here
}

export const YourComponent: React.FC<YourComponentProps> = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Fetch data on mount
  }, []);

  if (loading) return <CircularProgress />;
  if (error) return <Alert severity="error">{error}</Alert>;

  return (
    <Container maxWidth="lg">
      <Paper sx={{ p: 2 }}>
        {/* Your component content */}
      </Paper>
    </Container>
  );
};

export default YourComponent;
```

3. **Create service file**:
```bash
mkdir -p src/services
touch src/services/YourComponentService.ts
```

4. **Create service template**:
```typescript
export interface YourComponentData {
  // API response type
}

export const getYourComponentData = async (): Promise<YourComponentData> => {
  const response = await fetch('/api/v11/your/endpoint');
  if (!response.ok) throw new Error('Failed to fetch data');
  return response.json();
};
```

5. **Create test file**:
```bash
mkdir -p src/pages/Components/YourComponent/__tests__
touch src/pages/Components/YourComponent/__tests__/index.test.tsx
```

6. **Create test template**:
```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import YourComponent from '../index';

describe('YourComponent', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render component', () => {
    render(<YourComponent />);
    // Test stub
  });

  it('should display loading state', () => {
    // Test stub
  });

  it('should fetch and display data', () => {
    // Test stub
  });

  it('should handle errors', () => {
    // Test stub
  });
});
```

### Phase 2: Implementation (Days 2-3, 1:30 PM - 3:30 PM)

1. **Implement API service**:
```typescript
export const fetchYourData = async (params?: any) => {
  const query = new URLSearchParams(params).toString();
  const url = `/api/v11/your/endpoint${query ? '?' + query : ''}`;

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`API Error: ${response.statusText}`);
  }
  return response.json();
};
```

2. **Implement component logic**:
```typescript
useEffect(() => {
  const fetchData = async () => {
    try {
      setLoading(true);
      const data = await fetchYourData();
      setData(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  fetchData();
  const interval = setInterval(fetchData, 5000); // Auto-refresh
  return () => clearInterval(interval);
}, []);
```

3. **Add Material-UI components**:
```typescript
import {
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Card, CardContent, CardHeader,
  LineChart, BarChart, // from recharts
  TextField, Button, Select,
  Grid, Box, Chip, Rating
} from '@mui/material';
```

### Phase 3: Testing & Polish (Days 4-5, 3:30 PM onwards)

1. **Implement test cases**:
```typescript
it('should display data correctly', async () => {
  const mockData = { /* test data */ };
  vi.mocked(fetch).mockResolvedValueOnce({
    ok: true,
    json: async () => mockData
  } as Response);

  render(<YourComponent />);
  await waitFor(() => {
    expect(screen.getByText(/expected text/)).toBeInTheDocument();
  });
});
```

2. **Add error handling**:
```typescript
it('should show error message on API failure', async () => {
  vi.mocked(fetch).mockRejectedValueOnce(new Error('API Error'));

  render(<YourComponent />);
  await waitFor(() => {
    expect(screen.getByText(/API Error/)).toBeInTheDocument();
  });
});
```

3. **Run coverage**:
```bash
npm run test:coverage
# Target: 85%+ line and function coverage
```

---

## 🎨 DESIGN GUIDELINES

### Material-UI Components
```typescript
// Use theme for colors
import { useTheme } from '@mui/material/styles';

const theme = useTheme();
sx={{
  color: theme.palette.primary.main,
  backgroundColor: theme.palette.background.paper,
  borderRadius: theme.shape.borderRadius,
  padding: theme.spacing(2) // 16px
}}
```

### Responsive Design
```typescript
// Use breakpoints for responsive layout
sx={{
  display: 'grid',
  gridTemplateColumns: {
    xs: '1fr',           // mobile: 1 column
    sm: '1fr 1fr',       // tablet: 2 columns
    md: '1fr 1fr 1fr',   // desktop: 3 columns
  },
  gap: theme.spacing(2)
}}
```

### Color Scheme
```typescript
// Status colors
const statusColor = {
  active: 'success',      // green
  inactive: 'error',      // red
  syncing: 'warning',     // orange
  pending: 'info',        // blue
};
```

---

## 📊 TESTING REQUIREMENTS

### Unit Tests
```bash
npm test                    # Watch mode
npm run test:run           # Run once
npm run test:coverage      # Generate coverage report
```

### Coverage Targets
- **Line Coverage**: 85%+
- **Function Coverage**: 85%+
- **Branch Coverage**: 80%+
- **Statement Coverage**: 85%+

### Test Examples
```typescript
// 1. Test component renders
it('should render without crashing', () => {
  render(<YourComponent />);
  expect(screen.getByRole('main')).toBeInTheDocument();
});

// 2. Test state changes
it('should update state on button click', async () => {
  render(<YourComponent />);
  const button = screen.getByRole('button');
  fireEvent.click(button);
  await waitFor(() => {
    expect(screen.getByText(/updated/)).toBeInTheDocument();
  });
});

// 3. Test API integration
it('should fetch data on mount', async () => {
  const mockFetch = vi.spyOn(global, 'fetch');
  render(<YourComponent />);
  await waitFor(() => {
    expect(mockFetch).toHaveBeenCalledWith('/api/v11/endpoint');
  });
});

// 4. Test error handling
it('should display error message', async () => {
  vi.spyOn(global, 'fetch').mockRejectedValueOnce(new Error('API Error'));
  render(<YourComponent />);
  await waitFor(() => {
    expect(screen.getByText(/API Error/)).toBeInTheDocument();
  });
});
```

---

## 🚀 BUILD & DEPLOYMENT

### Local Build
```bash
npm run build              # Development build
npm run build:prod         # Production build
npm run build -- --verbose # Verbose output for debugging
```

### Preview Production Build
```bash
npm run preview            # Start local preview server
# Open http://localhost:4173
```

### Deployment
```bash
# Automatic via CI/CD on feature branch push
git push origin feature/sprint-13-YOUR-COMPONENT

# Manual deployment to staging
npm run deploy:staging

# Manual deployment to production
npm run deploy:prod
```

---

## 📝 CODE QUALITY CHECKLIST

Before committing, verify:
- [ ] Component renders without errors
- [ ] TypeScript: No errors or warnings
- [ ] Tests: All passing with 85%+ coverage
- [ ] Build: `npm run build` succeeds
- [ ] Linting: `npm run lint` passes
- [ ] Formatting: Code follows project style
- [ ] API: Service calls correct endpoint
- [ ] Error Handling: Graceful error display
- [ ] Performance: No console warnings
- [ ] Documentation: JSDoc comments added
- [ ] Accessibility: ARIA labels present

---

## 🐛 DEBUGGING TIPS

### TypeScript Errors
```bash
npm run typecheck --verbose
# Check for type mismatches in component props
```

### Runtime Errors
```bash
# Check browser console
# Use React DevTools extension
# Use Redux DevTools for state management
```

### API Connection Issues
```bash
# Test API endpoint
curl http://localhost:9003/api/v11/your/endpoint

# Check CORS headers
curl -i http://localhost:9003/api/v11/your/endpoint
```

### Build Issues
```bash
# Clear cache and rebuild
rm -rf dist/ node_modules/
npm install
npm run build
```

---

## 📚 USEFUL RESOURCES

### Documentation
- Material-UI: https://mui.com
- React: https://react.dev
- TypeScript: https://www.typescriptlang.org
- Vitest: https://vitest.dev
- React Testing Library: https://testing-library.com/react

### Project Files
- Component templates: `src/pages/Components/`
- Service examples: `src/services/`
- Test examples: `src/pages/Components/__tests__/`
- Type definitions: `src/types/`

---

## ⏰ TIMELINE SUMMARY

| Phase | Duration | Start | End | Deliverables |
|-------|----------|-------|-----|--------------|
| **Scaffolding** | 2 hrs | 11:30 AM | 1:30 PM | Component structure, service file, test stubs |
| **Implementation** | 2 hrs | 1:30 PM | 3:30 PM | Full API integration, UI implementation |
| **Testing** | 1.25 hrs | 3:30 PM | 4:45 PM | Unit tests (85%+ coverage), documentation |
| **Commit** | 0.25 hrs | 4:45 PM | 5:00 PM | Git commit, push to feature branch |

---

## ✅ DEFINITION OF DONE

Your component is complete when:
- ✅ Component renders correctly
- ✅ API service implemented and working
- ✅ All unit tests passing (85%+ coverage)
- ✅ No TypeScript errors
- ✅ Build succeeds
- ✅ Code reviewed and approved
- ✅ Merged to feature branch
- ✅ Ready for integration in Phase 2

---

## 🎯 SUCCESS METRICS

**Individual Component**:
- Build success rate: 100%
- Test pass rate: 100%
- Code coverage: 85%+
- TypeScript errors: 0
- Console errors: 0

**Team (Day 1)**:
- Components scaffolded: 8/8 (100%)
- API endpoints working: 8/8 (100%)
- Builds passing: 8/8 (100%)
- Commits successful: 8/8 (100%)

---

**Questions?** Contact:
- **Component Architecture**: FDA Lead
- **API Integration**: BDA (Backend Development Agent)
- **Testing**: QAA Lead
- **TypeScript/Build Issues**: DDA (DevOps & Deployment Agent)

**Let's build 3.0M TPS! 🚀**
