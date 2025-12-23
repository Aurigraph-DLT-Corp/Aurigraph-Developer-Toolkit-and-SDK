# Comprehensive Portal Quick Start Guide

## Getting Started

### Installation
```bash
cd enterprise-portal/frontend
npm install
npm run dev
```

### View Components
Navigate to: http://localhost:5173

**Available Tabs:**
1. **Transactions** - Real-time transaction explorer
2. **Blocks** - Block explorer with consensus metrics
3. **Validators** - Validator dashboard and staking
4. **AI Optimization** - ML model controls and analytics
5. **Security** - Quantum crypto and key management
6. **Bridge** - Cross-chain transfer interface

---

## Component Overview

### 1. TransactionExplorer
**Location:** `/src/components/comprehensive/TransactionExplorer.tsx`

**Features:**
- Search transactions by hash or address
- Filter by type, status, date range
- Real-time TPS statistics
- Transaction detail drawer

**Usage:**
```tsx
import TransactionExplorer from '@/components/comprehensive/TransactionExplorer';

<TransactionExplorer />
```

### 2. BlockExplorer
**Location:** `/src/components/comprehensive/BlockExplorer.tsx`

**Features:**
- Recent blocks table
- HyperRAFT++ consensus monitoring
- Chain information dashboard
- Block detail view

**Usage:**
```tsx
import BlockExplorer from '@/components/comprehensive/BlockExplorer';

<BlockExplorer />
```

### 3. ValidatorDashboard
**Location:** `/src/components/comprehensive/ValidatorDashboard.tsx`

**Features:**
- Validator ranking leaderboard
- Staking interface with lock periods
- Performance metrics (uptime, voting power)
- Commission and APR tracking

**Usage:**
```tsx
import ValidatorDashboard from '@/components/comprehensive/ValidatorDashboard';

<ValidatorDashboard />
```

### 4. AIOptimizationControls
**Location:** `/src/components/comprehensive/AIOptimizationControls.tsx`

**Features:**
- AI model management
- Consensus optimization controls
- Anomaly detection dashboard
- Predictive analytics

**Usage:**
```tsx
import AIOptimizationControls from '@/components/comprehensive/AIOptimizationControls';

<AIOptimizationControls />
```

### 5. QuantumSecurityPanel
**Location:** `/src/components/comprehensive/QuantumSecurityPanel.tsx`

**Features:**
- Quantum crypto status (CRYSTALS-Dilithium/Kyber)
- Cryptographic key management
- Security metrics and audits
- Key rotation interface

**Usage:**
```tsx
import QuantumSecurityPanel from '@/components/comprehensive/QuantumSecurityPanel';

<QuantumSecurityPanel />
```

### 6. CrossChainBridge
**Location:** `/src/components/comprehensive/CrossChainBridge.tsx`

**Features:**
- Bridge status monitoring
- Cross-chain transfer creation
- Transfer tracking with progress steps
- Supported chains management

**Usage:**
```tsx
import CrossChainBridge from '@/components/comprehensive/CrossChainBridge';

<CrossChainBridge />
```

---

## Redux State Management

### Import Actions
```tsx
import { useAppDispatch, useAppSelector } from '@/hooks/useRedux';
import {
  setTransactions,
  setBlocks,
  setValidators,
  setAIModels,
  setSecurityStatus,
  setBridges,
} from '@/store/comprehensivePortalSlice';
```

### Use State
```tsx
const dispatch = useAppDispatch();

// Get transactions
const transactions = useAppSelector((state) => state.comprehensivePortal.transactions);
const loading = useAppSelector((state) => state.comprehensivePortal.transactionsLoading);

// Update state
dispatch(setTransactions(newTransactions));
```

---

## API Service

### Import Service
```tsx
import { comprehensivePortalService } from '@/services/ComprehensivePortalService';
```

### Enable/Disable Demo Mode
```tsx
// Development with mock data (default)
comprehensivePortalService.setDemoMode(true);

// Production with real backend
comprehensivePortalService.setDemoMode(false);
```

### Fetch Data
```tsx
// Get transactions
const transactions = await comprehensivePortalService.getTransactions(1, 20);

// Get blocks
const blocks = await comprehensivePortalService.getBlocks(20);

// Get validators
const validators = await comprehensivePortalService.getValidators();

// Get AI models
const models = await comprehensivePortalService.getAIModels();

// Get security status
const status = await comprehensivePortalService.getSecurityStatus();

// Get bridges
const bridges = await comprehensivePortalService.getBridges();
```

---

## Backend Integration

### Configure API Base URL
```tsx
// In src/services/ComprehensivePortalService.ts
const service = new ComprehensivePortalService(
  'http://localhost:9003', // Your backend URL
  false // Set to false for production
);
```

### Required Backend Endpoints

#### Blockchain
- `GET /api/v11/blockchain/transactions`
- `GET /api/v11/blockchain/blocks`
- `GET /api/v11/blockchain/chain/info`

#### Validators
- `GET /api/v11/validators`
- `POST /api/v11/validators/{id}/stake`

#### Consensus
- `GET /api/v11/consensus/metrics`

#### AI Optimization
- `GET /api/v11/ai/models`
- `GET /api/v11/ai/metrics`
- `POST /api/v11/ai/models/{id}/retrain`

#### Security
- `GET /api/v11/security/status`
- `GET /api/v11/security/keys`
- `POST /api/v11/security/keys/rotate`

#### Bridge
- `GET /api/v11/bridge/bridges`
- `GET /api/v11/bridge/transfers`
- `POST /api/v11/bridge/transfers`

---

## Customization

### Change Polling Intervals
```tsx
// In component useEffect
useEffect(() => {
  fetchData();

  const interval = setInterval(() => {
    fetchData();
  }, 5000); // Change to desired interval in ms

  return () => clearInterval(interval);
}, []);
```

### Customize Table Columns
```tsx
const columns: ColumnsType<DataType> = [
  {
    title: 'Custom Column',
    dataIndex: 'field',
    key: 'field',
    render: (value) => <CustomComponent value={value} />,
  },
  // Add more columns...
];
```

### Add New Filters
```tsx
const handleFilterChange = (key: string, value: any) => {
  setFilters({
    ...filters,
    [key]: value,
  });
};

<Select onChange={(value) => handleFilterChange('newFilter', value)}>
  <Select.Option value="option1">Option 1</Select.Option>
  <Select.Option value="option2">Option 2</Select.Option>
</Select>
```

---

## Testing

### Run Tests
```bash
npm test
```

### Test Individual Component
```bash
npm test TransactionExplorer
```

### Test with Coverage
```bash
npm test -- --coverage
```

---

## Common Issues

### Port Conflict
If port 5173 is in use:
```bash
npm run dev -- --port 3000
```

### Backend Connection Error
1. Check backend is running on port 9003
2. Verify CORS is enabled on backend
3. Check API base URL in service configuration

### Mock Data Not Showing
Ensure demo mode is enabled:
```tsx
comprehensivePortalService.setDemoMode(true);
```

---

## Development Workflow

### 1. Start Development Server
```bash
npm run dev
```

### 2. Make Changes
Edit components in `/src/components/comprehensive/`

### 3. Hot Reload
Changes automatically reload in browser

### 4. Test Changes
Navigate to component tab in browser

### 5. Build for Production
```bash
npm run build
```

---

## Production Deployment

### Build
```bash
npm run build
```

### Preview Build
```bash
npm run preview
```

### Deploy
```bash
# Copy dist/ folder to your web server
cp -r dist/ /var/www/html/
```

---

## Performance Optimization

### Enable Production Mode
```tsx
comprehensivePortalService.setDemoMode(false);
```

### Optimize Polling
- Increase intervals for less critical data
- Use WebSocket for real-time updates
- Implement data caching

### Optimize Rendering
```tsx
import { memo } from 'react';

const OptimizedComponent = memo(({ data }) => {
  // Component logic
});
```

---

## Support & Documentation

- **Full Report:** See `COMPREHENSIVE-PORTAL-IMPLEMENTATION.md`
- **Type Definitions:** `/src/types/comprehensive.ts`
- **Redux Slice:** `/src/store/comprehensivePortalSlice.ts`
- **API Service:** `/src/services/ComprehensivePortalService.ts`

---

## Quick Tips

1. **All components are independent** - Can be used individually
2. **Mock data included** - Test without backend
3. **TypeScript strict mode** - All types defined
4. **Responsive design** - Works on mobile
5. **Dark mode ready** - Follows app theme
6. **Copy-friendly** - Click to copy hashes/addresses
7. **Real-time ready** - Polling and WebSocket support

---

## Next Steps

1. ✅ Components created and integrated
2. ⏭️ Connect to backend APIs
3. ⏭️ Enable WebSocket for real-time updates
4. ⏭️ Add unit tests
5. ⏭️ Deploy to production

**You're ready to go! Start the dev server and explore the components.**
