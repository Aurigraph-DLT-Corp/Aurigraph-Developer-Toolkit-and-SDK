# Aurigraph Enterprise Portal - Quick Reference Guide

## Project Overview

**Frontend for Aurigraph DLT V11 blockchain platform**
- Version: 4.6.0
- Tech Stack: React 18 + TypeScript + Redux + Vite
- UI Frameworks: Ant Design (primary), Material-UI (secondary)
- Status: Production-ready with 30+ blockchain operation pages

---

## Quick Start

```bash
# Install dependencies
npm install

# Development (http://localhost:3000)
npm run dev

# Production build
npm run build

# Run tests
npm run test
npm run test:coverage

# Code quality
npm run lint
npm run lint:fix
npm run format
```

---

## Project Structure at a Glance

```
src/
├── components/          # React components by feature domain
│   ├── common/         # Reusable components (LoadingSkeleton, ErrorBoundary)
│   ├── layout/         # Navigation, Header, Footer
│   ├── comprehensive/  # 15+ feature components (Block Explorer, RWAT, etc)
│   ├── compliance/     # Compliance features
│   ├── registry/       # Registry components
│   ├── rwat/           # Real-world asset tokenization forms
│   └── demo/           # Demo components
│
├── routes/             # Route definitions with metadata
├── store/              # Redux slices & state management
├── services/           # API services & business logic (12 files)
├── hooks/              # Custom React hooks (5 hooks)
├── types/              # TypeScript definitions (10 modules)
├── context/            # React Context (NavigationContext)
├── utils/              # Utility functions
├── config/             # Configuration & feature flags
├── App.tsx             # Root component
└── main.tsx            # Entry point
```

---

## Key Technologies

| Layer | Technology | Purpose |
|-------|-----------|---------|
| **UI Framework** | React 18.2.0 | Component-based UI |
| **Type Safety** | TypeScript 5.3.3 | Type checking |
| **Build Tool** | Vite 5.0.8 | Fast bundling & HMR |
| **Routing** | React Router 6.20.0 | Client-side routing |
| **State Mgmt** | Redux Toolkit 1.9.7 | Global state |
| **Persistence** | Redux Persist 6.0.0 | Client-side caching |
| **UI Components** | Ant Design 5.11.5 | Component library |
| **Charts** | Recharts 2.10.3 | Data visualization |
| **HTTP** | Axios 1.6.2 | API requests |
| **Real-time** | WebSocket | Live updates |

---

## Core Concepts

### 1. Routing & Navigation

**Route Structure** (routes.tsx):
```typescript
{
  path: '/transactions',
  component: TransactionExplorer,
  label: 'Transactions',
  category: 'blockchain',
  description: 'View blockchain transactions'
}
```

**Navigation Categories**:
- blockchain, contracts, tokenization, compliance
- registries, ai, integration, admin

### 2. State Management

**Redux Slices**:
- `auth` - User & session (persisted)
- `settings` - Theme, notifications (persisted)
- `demoApp` - Demo selections (partially persisted)
- `comprehensivePortal` - Main app data
- `liveData` - Real-time updates (NOT persisted)

**Using Redux**:
```typescript
const dispatch = useAppDispatch();
const state = useAppSelector(selectState);
```

### 3. API Integration

**Service Layer Pattern**:
```typescript
// 1. Service makes API call
const { data } = await apiClient.get('/api/v11/blocks');

// 2. Component fetches data
useEffect(() => {
  blockService.getBlocks().then(setBlocks);
}, []);

// 3. Redux async thunks for complex operations
dispatch(fetchBlocksAsync(limit));
```

**Key Services**:
- `apiClient.ts` - HTTP client with JWT interceptor
- `authService.ts` - Authentication
- `V11BackendService.ts` - Blockchain API
- `websocketService.ts` - Real-time updates
- `contractsApi.ts` - Smart contracts
- `complianceApi.ts` - Compliance

### 4. Component Architecture

**Functional Components with Hooks**:
```typescript
const MyComponent: React.FC<Props> = () => {
  // Redux
  const dispatch = useAppDispatch();
  const data = useAppSelector(selectData);
  
  // Local state
  const [loading, setLoading] = useState(false);
  
  // Effects
  useEffect(() => {
    fetchData();
  }, []);
  
  return <div>{/* JSX */}</div>;
};
```

**Custom Hooks**:
- `useRedux()` - Redux hooks
- `useAuth()` - Authentication
- `useWebSocket()` - Real-time connection
- `useQueryParams()` - URL parameters

### 5. UI Framework Usage

**Ant Design** (primary - 51 files):
```typescript
import { Card, Table, Row, Col, Button, Modal } from 'antd';
import { BlockOutlined } from '@ant-design/icons';
```

**Material-UI** (secondary - for RWAT):
```typescript
import { Box, Card, TextField, Dialog } from '@mui/material';
import { Add } from '@mui/icons-material';
```

---

## Component Organization by Feature

### Blockchain Operations
- `BlockExplorer.tsx` - Block details & chain visualization
- `TransactionExplorer.tsx` - Transaction listing
- `ValidatorDashboard.tsx` - Validator metrics
- `Dashboard.tsx` - Main dashboard

### Smart Contracts
- `SmartContractRegistry.tsx` - Contract management
- `ActiveContracts.tsx` - Running contracts
- `RicardianContractUpload.tsx` - Legal contracts

### Real-World Asset Tokenization (RWAT)
- `RWATRegistry.tsx` - Asset tokenization (Material-UI)
- `Tokenization.tsx` - Token creation
- `TokenizationRegistry.tsx` - Token inventory

### Compliance & Security
- `ComplianceDashboard.tsx` - Compliance metrics
- `QuantumSecurityPanel.tsx` - Quantum crypto status
- `UserManagement.tsx` - User CRUD

### Registries & Traceability
- `AssetTraceability.tsx` - Supply chain tracking
- `TraceabilityManagement.tsx` - Trace operations
- `RegistryManagement.tsx` - Registry CRUD
- `MerkleTreeRegistry.tsx` - Merkle visualization

### Cross-Chain & AI
- `CrossChainBridge.tsx` - Inter-chain transfers
- `AIOptimizationControls.tsx` - ML tuning

---

## Development Workflows

### Adding a New Feature

1. **Create Route** (routes.tsx):
```typescript
const MyFeature = lazy(() => import('../components/comprehensive/MyFeature'));

// Add to routes array
{
  path: '/my-feature',
  component: MyFeature,
  label: 'My Feature',
  category: 'blockchain',
}
```

2. **Create Component** (components/comprehensive/MyFeature.tsx):
```typescript
import { useState, useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '../../hooks/useRedux';
import { Card } from 'antd';

const MyFeature: React.FC = () => {
  const [data, setData] = useState(null);
  const dispatch = useAppDispatch();
  
  useEffect(() => {
    // Fetch data
  }, []);
  
  return <Card>{/* JSX */}</Card>;
};

export default MyFeature;
```

3. **Add Redux State** (store/):
```typescript
const slice = createSlice({
  name: 'myFeature',
  initialState,
  reducers: { /* ... */ },
});

export const reducer = slice.reducer;
export const { action } = slice.actions;
```

4. **Create Service** (services/):
```typescript
export const myFeatureService = {
  async fetchData() {
    return apiClient.get('/api/v11/my-data');
  },
};
```

### Modifying Existing Components

1. Find component in `components/comprehensive/`
2. Update component logic/UI
3. If changing API endpoints, update services/
4. If changing data structure, update types/
5. Test with `npm run test`
6. Check styling with dev server

### Working with Redux State

```typescript
// Read state
const data = useAppSelector(selectData);

// Update state
dispatch(updateData(newData));

// Async operations
dispatch(fetchDataAsync());
```

### Adding Services

```typescript
// services/myService.ts
import { apiClient } from './apiClient';

export const myService = {
  async getItems() {
    return apiClient.get('/api/v11/items');
  },
  
  async createItem(data: ItemData) {
    return apiClient.post('/api/v11/items', data);
  },
};
```

---

## Common Tasks

### Debug Mode

Enable Redux DevTools:
```bash
npm run dev
# DevTools available in browser extension
```

### Check Code Quality

```bash
npm run lint          # Check linting
npm run type-check    # Check types
npm run format        # Format code
npm run test          # Run tests
```

### Update Dependencies

```bash
npm update            # Update packages
npm audit            # Check vulnerabilities
npm audit fix        # Fix vulnerabilities
```

### Build for Production

```bash
npm run build        # Creates dist/
npm run preview      # Preview production build
```

---

## API Integration

### Development

**Proxy Configuration** (vite.config.ts):
```
/api          -> http://localhost:9003
/ws           -> ws://localhost:9003
```

### Production

**Endpoints**:
- API: `https://dlt.aurigraph.io/api/v11`
- WebSocket: `wss://dlt.aurigraph.io`

### Authentication

**JWT Flow**:
1. Login -> Get JWT token
2. Store in localStorage
3. apiClient auto-injects in Authorization header
4. On 401 -> Auto-refresh with refresh token
5. Logout -> Clear tokens

**Using Auth Hook**:
```typescript
const { user, isAuthenticated, login, logout } = useAuth();
```

---

## Performance Tips

1. **Lazy Loading** - Use React.lazy() for routes
2. **Memoization** - Use useMemo, useCallback for expensive ops
3. **Redux Selectors** - Use Reselect for memoized selectors
4. **Code Splitting** - Vite automatically splits chunks
5. **Bundle Analysis** - Check build output size

---

## Testing

### Unit Tests

```bash
npm run test           # Run all tests
npm run test:ui       # Interactive UI
npm run test:coverage # Coverage report
```

### E2E Tests

```bash
npm run test:e2e      # Run Playwright tests
npm run test:e2e:ui   # Interactive mode
```

### Test Pattern

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import MyComponent from './MyComponent';

describe('MyComponent', () => {
  it('should render title', () => {
    render(<MyComponent />);
    expect(screen.getByText('Title')).toBeInTheDocument();
  });
});
```

---

## Troubleshooting

### Port Already in Use

```bash
# Kill process on port 3000
lsof -i :3000
kill -9 <PID>
```

### Build Failures

```bash
# Clean and rebuild
rm -rf node_modules package-lock.json
npm install
npm run build
```

### TypeScript Errors

```bash
npm run type-check     # Check for type errors
npm run format         # Format code
```

### WebSocket Connection Issues

Check:
1. WebSocket URL in config (vite.config.ts)
2. Backend service running on port 9003
3. CORS headers in backend

---

## File Locations Quick Reference

| Item | Location |
|------|----------|
| Routes | `src/routes/routes.tsx` |
| Redux Store | `src/store/index.ts` |
| Redux Slices | `src/store/*.Slice.ts` |
| Services | `src/services/*.ts` |
| Components | `src/components/comprehensive/*.tsx` |
| Custom Hooks | `src/hooks/*.ts` |
| Types | `src/types/*.ts` |
| Build Config | `vite.config.ts` |
| Type Config | `tsconfig.json` |
| Package Info | `package.json` |
| Global Styles | `src/index.css` |

---

## Resources

- **Codebase Architecture**: `CODEBASE_ARCHITECTURE.md` (1042 lines)
- **Architecture Summary**: `ARCHITECTURE_SUMMARY.txt` (300 lines)
- **React Documentation**: https://react.dev
- **Redux Documentation**: https://redux.js.org
- **Ant Design**: https://ant.design
- **React Router**: https://reactrouter.com
- **Vite Documentation**: https://vitejs.dev

---

## Support

For detailed architecture information, see `CODEBASE_ARCHITECTURE.md`.

For quick overviews, refer to `ARCHITECTURE_SUMMARY.txt`.

For specific component patterns, check examples in `components/comprehensive/`.

