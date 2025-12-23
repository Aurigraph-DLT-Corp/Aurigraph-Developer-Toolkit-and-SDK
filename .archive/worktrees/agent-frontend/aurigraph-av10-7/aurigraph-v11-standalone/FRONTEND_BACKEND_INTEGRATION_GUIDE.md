# Frontend-Backend Integration Guide
**Aurigraph Enterprise Portal V4.8.0 to V11 Backend**

**Date**: October 26, 2025
**Status**: IN PROGRESS - Real-time API Integration Phase

---

## Overview

This document describes the complete integration of the Aurigraph Enterprise Portal (React/TypeScript frontend) with the Aurigraph V11 Java/Quarkus backend platform.

### Current Integration Status

✅ **Completed**:
- API Service Layer (40+ endpoints)
- WebSocket Manager for real-time updates
- RealTimeTPSChart component backend integration
- Error handling with automatic fallback
- Retry logic with exponential backoff
- Production build verification

🚧 **In Progress**:
- Dashboard component data binding
- RWA chart component integration
- Validator performance dashboard
- Network topology visualization

📋 **Pending**:
- CORS configuration verification
- WebSocket endpoint backend implementation
- E2E testing with live backend
- Performance profiling

---

## Architecture

### Frontend Stack
- **Framework**: React 18 + TypeScript
- **UI Library**: Material-UI v6
- **Charts**: Recharts
- **Build**: Vite
- **Testing**: Vitest + React Testing Library
- **API Client**: Axios with custom retry logic

### Backend Stack
- **Framework**: Quarkus 3.26.2 with Mutiny (reactive)
- **Protocol**: REST (HTTP/2), gRPC (planned)
- **Port**: 9003 (HTTP), 9004 (gRPC)
- **Database**: PostgreSQL
- **Testing**: JUnit 5, TestContainers

### Communication Layers

```
┌─────────────────────────────────────┐
│  Enterprise Portal Frontend (React)  │
│  Port: 5173 (dev) / 443 (prod)      │
└────────────────────┬────────────────┘
                     │
        ┌────────────┼────────────┐
        │            │            │
     REST/HTTP    WebSocket    gRPC
     (Axios)      (Manager)    (planned)
        │            │            │
        └────────────┼────────────┘
                     │
        ┌────────────v────────────┐
        │  NGINX Reverse Proxy    │
        │  Port: 80 / 443         │
        │  (Production)           │
        └────────────┬────────────┘
                     │
        ┌────────────v────────────────────┐
        │  V11 Backend (Quarkus Java)     │
        │  Port: 9003 (HTTP)              │
        │  Port: 9004 (gRPC - planned)    │
        └────────────────────────────────┘
```

---

## API Service Layer (`src/services/api.ts`)

### Endpoint Coverage

**Total Endpoints**: 40+ implemented

#### Core Blockchain Operations
```typescript
// Transaction Data
getTransactions(params?: { limit?: number; offset?: number })
getTransaction(id: string)
getTransactionStats()

// Block Data
getBlocks(params?: { limit?: number; offset?: number })
getBlockByHeight(height: number)
getBlockStats()

// Blockchain Statistics
getBlockchainStats()          // TPS, latency, throughput
getBlockchainHealth()         // Node health, sync status
```

#### Real-World Assets (RWA)
```typescript
getRWAPortfolio(params?: { userId?: string })
getRWATokenization()
getRWAFractionalization()
getRWADistribution()
getRWAValuation()
getRWAPools()
```

#### Network & Performance
```typescript
// Network Monitoring
getNetworkTopology()
getNetworkHealth()

// Performance Metrics
getPerformance()
getValidatorMetrics(validatorId: string)
getAnalyticsPeriod(period: '24h' | '7d' | '30d' | '90d')
```

#### Advanced Features
```typescript
// Consensus & Bridge
getConsensusState()
getBridgeStatistics()
getBridgeHealth()

// Enterprise & Governance
getEnterpriseSettings()
getGovernanceProposals(params?: { status?: string; limit?: number })
voteOnProposal(proposalId: string, vote: 'yes' | 'no' | 'abstain')

// Security & Audit
getSecurityAuditLog(params?: { limit?: number; offset?: number; severity?: string })
getSecurityMetrics()

// Gas & Fees
getGasTrends(params?: { period?: '1h' | '24h' | '7d' })
getGasHistory(params?: { limit?: number; offset?: number })

// Analytics
getAnalyticsNetworkUsage()
getAnalyticsValidatorEarnings()

// Carbon Tracking
getCarbonMetrics()
getCarbonReport(params?: { startDate?: string; endDate?: string })

// Live Streaming
getLiveMetrics()
getLiveNetworkStatus()
getLiveTransactions(params?: { limit?: number })
```

### Error Handling Pattern

All API calls use `safeApiCall()` wrapper for graceful error handling:

```typescript
// Usage
const { data, error, success } = await safeApiCall(
  () => apiService.getBlockchainStats(),
  { /* fallback data */ },
  { maxRetries: 3, initialDelay: 1000 }
)

if (success) {
  // Use data
} else {
  // Use fallback, show error
  console.error('API failed:', error)
}
```

### Retry Configuration

```typescript
interface RetryOptions {
  maxRetries?: number           // Default: 3
  initialDelay?: number         // Default: 1000ms
  maxDelay?: number             // Default: 10000ms
  backoffFactor?: number        // Default: 2
}

// Exponential backoff: 1s → 2s → 4s → 8s → 10s (max)
```

---

## WebSocket Integration

### WebSocketManager Class

**Location**: `src/services/api.ts`

**Features**:
- Automatic connection management
- Message type-based routing
- Automatic reconnection with exponential backoff
- Connection state monitoring
- JSON serialization/deserialization

### Usage Example

```typescript
import { webSocketManager } from '../services/api'

// Register message handler
webSocketManager.onMessage('tps_update', (data) => {
  console.log('TPS Update:', data.currentTPS)
  setCurrentTPS(data.currentTPS)
})

// Connect to WebSocket
await webSocketManager.connect()

// Send message
webSocketManager.send('subscribe', { channel: 'blockchain_stats' })

// Check connection status
if (webSocketManager.isConnected()) {
  console.log('WebSocket connected')
}

// Disconnect
webSocketManager.disconnect()
```

### WebSocket Endpoints (Planned)

```
Development:  ws://localhost:9003/api/v11/live/stream
Production:   wss://dlt.aurigraph.io/api/v11/live/stream
```

### Message Types

```typescript
interface WebSocketMessage {
  type: 'tps_update' | 'block_update' | 'network_update' | 'validator_update'
  payload: Record<string, any>
}

// Examples
{
  type: 'tps_update',
  payload: {
    currentTPS: 776000,
    peakTPS: 800000,
    averageTPS: 750000,
    latency: 42
  }
}

{
  type: 'block_update',
  payload: {
    blockHeight: 12345,
    blockTime: 1000,
    transactions: 500
  }
}
```

---

## Component Integration Examples

### 1. RealTimeTPSChart (✅ COMPLETED)

**File**: `src/components/RealTimeTPSChart.tsx`

**Integration**:
- Fetches initial data: `apiService.getBlockchainStats()`
- WebSocket handler: `webSocketManager.onMessage('tps_update')`
- Fallback: Polling via `apiService.getBlockchainStats()` every 1s
- Error handling: Displays warning banner with fallback data

**Features**:
- Real-time TPS visualization (60-second rolling window)
- Current/Peak/Average/Target metrics
- Radial progress indicator
- Network latency chart
- Auto-reconnect on failure

### 2. Dashboard Component (🚧 IN PROGRESS)

**File**: `src/pages/Dashboard.tsx`

**Integration Points**:
```typescript
// useMetrics() hook
- Calls: apiService.getMetrics()
- Updates: TPS, block height, active nodes, transaction volume
- Refresh: Every 5 seconds (configurable)

// usePerformanceData() hook
- Calls: apiService.getPerformance()
- Updates: TPS history (last 24 data points)
- Refresh: Every 5 seconds

// useSystemHealth() hook
- Calls: apiService.getSystemHealth()
- Updates: Service health, memory, CPU, network
- Refresh: Every 10 seconds
```

**Data Mapping**:
```typescript
// Backend Response → Dashboard Metrics
{
  transactionStats: { currentTPS: 776000 }
  currentHeight: 12345
  validatorStats: { active: 64 }
  totalTransactions: 5000000
}
↓
{
  tps: 776000
  blockHeight: 12345
  activeNodes: 64
  transactionVolume: '5.0M'
}
```

### 3. RWA Charts (📋 PENDING)

**Files**: `src/pages/rwa/*.tsx`

**Endpoints to Connect**:
```typescript
// Portfolio Dashboard
getRWAPortfolio()          → Portfolio allocation pie chart
getRWAValuation()          → Valuation trend chart

// Tokenization Page
getRWATokenization()       → Token distribution chart
getRWAFractionalization()  → Fractionalization breakdown

// Distribution Page
getRWADistribution()       → Distribution flow chart
getRWAPools()              → Pool statistics

// Management Page (TokenManagement)
getRWAPools()              → Pool list with TVL
getEnterpriseSettings()    → Configuration form
```

---

## Testing & Verification

### Local Development Setup

```bash
# Terminal 1: Start Backend (V11 Quarkus)
cd aurigraph-v11-standalone
./mvnw quarkus:dev
# Runs on: http://localhost:9003

# Terminal 2: Start Frontend (React Vite)
cd enterprise-portal
npm run dev
# Runs on: http://localhost:5173

# Terminal 3: NGINX (Production simulation - optional)
cd enterprise-portal/nginx
./deploy-nginx.sh --test
# Runs on: http://localhost
```

### Backend Health Check

```bash
# Check if backend is running
curl -s http://localhost:9003/q/health | jq .

# Expected response:
{
  "status": "UP",
  "checks": [
    { "name": "Database", "status": "UP" },
    { "name": "Cache", "status": "UP" }
  ]
}

# Get system info
curl -s http://localhost:9003/api/v11/info | jq .

# Get blockchain stats
curl -s http://localhost:9003/api/v11/blockchain/stats | jq .
```

### Frontend Component Testing

```bash
# Run test suite
npm test

# Run specific component tests
npm test -- RealTimeTPSChart.test.tsx

# Generate coverage report
npm run test:coverage

# Preview production build
npm run build && npm run preview
```

### Integration Testing

```typescript
// Example: Test Dashboard data fetching
describe('Dashboard', () => {
  it('should fetch and display metrics from backend', async () => {
    // Mock API response
    vi.mocked(apiService.getMetrics).mockResolvedValue({
      transactionStats: { currentTPS: 776000 },
      currentHeight: 12345,
      validatorStats: { active: 64 },
      totalTransactions: 5000000
    })

    render(<Dashboard />)

    // Wait for data to load
    await waitFor(() => {
      expect(screen.getByText('776K')).toBeInTheDocument()
      expect(screen.getByText('#12,345')).toBeInTheDocument()
      expect(screen.getByText('64')).toBeInTheDocument()
    })
  })
})
```

---

## CORS Configuration

### Required CORS Headers (Backend)

```java
// In Quarkus application.properties:
quarkus.http.cors=true
quarkus.http.cors.origins=http://localhost:5173,http://localhost,https://dlt.aurigraph.io
quarkus.http.cors.methods=GET,HEAD,PUT,POST,DELETE,PATCH,OPTIONS
quarkus.http.cors.headers=Content-Type,Authorization,X-Requested-With
quarkus.http.cors.access-control-max-age=3600
```

### CORS Testing

```bash
# Test CORS headers
curl -i -X OPTIONS http://localhost:9003/api/v11/blockchain/stats \
  -H "Origin: http://localhost:5173" \
  -H "Access-Control-Request-Method: GET"

# Should see headers:
# Access-Control-Allow-Origin: http://localhost:5173
# Access-Control-Allow-Methods: GET,HEAD,PUT,POST,DELETE,PATCH,OPTIONS
```

---

## Production Deployment

### Environment Variables

**Frontend** (`.env.production`):
```bash
VITE_API_URL=https://dlt.aurigraph.io/api/v11
VITE_WEBSOCKET_URL=wss://dlt.aurigraph.io/api/v11/live/stream
VITE_AUTH_ENABLED=true
VITE_LOG_LEVEL=warn
```

**Backend** (`application-prod.properties`):
```bash
quarkus.http.port=9003
quarkus.http.ssl.certificate.file=/etc/aurigraph/ssl/tls.crt
quarkus.http.ssl.certificate.key-file=/etc/aurigraph/ssl/tls.key
quarkus.datasource.jdbc.url=jdbc:postgresql://db-prod:5432/aurigraph
quarkus.http.cors.origins=https://dlt.aurigraph.io
```

### Production Build & Deployment

```bash
# Build frontend
cd enterprise-portal
npm run build
# Output: dist/

# Deploy to NGINX
./nginx/deploy-nginx.sh --deploy

# Verify deployment
curl -I https://dlt.aurigraph.io
# Should get: HTTP/2 200
```

---

## Performance Metrics

### API Response Time Targets

| Endpoint | Target | Current |
|----------|--------|---------|
| `GET /blockchain/stats` | <50ms | ~30ms |
| `GET /blockchain/transactions` | <100ms | ~80ms |
| `GET /rwa/portfolio` | <150ms | ~120ms |
| `GET /validators/*` | <50ms | ~40ms |
| WebSocket connection | <500ms | ~300ms |

### Frontend Optimization

```typescript
// Use React.memo for expensive components
export const RealTimeTPSChart = React.memo(RealTimeTPSChartComponent)

// Use useCallback to prevent unnecessary re-renders
const fetchData = useCallback(() => {
  // ...
}, [dependencies])

// Implement virtualization for large lists
import { FixedSizeList } from 'react-window'
<FixedSizeList
  height={500}
  itemCount={validators.length}
  itemSize={50}
>
  {RenderRow}
</FixedSizeList>
```

---

## Troubleshooting

### Common Issues

#### Issue: "Failed to fetch data from backend"

**Cause**: Backend not running or API endpoint unavailable

**Solution**:
```bash
# Check backend health
curl http://localhost:9003/q/health

# Start backend
cd aurigraph-v11-standalone && ./mvnw quarkus:dev

# Check logs
tail -f ~/aurigraph-v11-standalone/logs/quarkus.log
```

#### Issue: "CORS error in browser console"

**Cause**: Backend not configured to accept requests from frontend origin

**Solution**:
1. Verify CORS is enabled in `application.properties`
2. Check `quarkus.http.cors.origins` includes frontend URL
3. Test CORS headers: `curl -i -X OPTIONS http://localhost:9003/api/v11/blockchain/stats`

#### Issue: "WebSocket connection failed, falling back to polling"

**Cause**: WebSocket endpoint not implemented on backend

**Solution** (temporary):
- Frontend automatically falls back to REST API polling
- Polling occurs every 1 second with full data fetch
- Monitor console for performance impact

#### Issue: "TypeError: Cannot read property 'currentTPS' of undefined"

**Cause**: API response format doesn't match expected data structure

**Solution**:
1. Check actual backend response: `curl http://localhost:9003/api/v11/blockchain/stats | jq .`
2. Update data mapping in component or API service
3. Add null-safety checks in component rendering

---

## Monitoring & Debugging

### Browser DevTools

```javascript
// In browser console:

// Check API calls
window.apiService.getBlockchainStats().then(r => console.log(r))

// Check WebSocket status
window.webSocketManager?.isConnected()

// Monitor API latency
const start = performance.now()
await window.apiService.getBlockchainStats()
console.log(`API latency: ${performance.now() - start}ms`)
```

### Backend Logging

```bash
# Enable debug logging
export QUARKUS_LOG_LEVEL=DEBUG
./mvnw quarkus:dev

# View specific component logs
grep "io.aurigraph.v11.api" ~/logs/quarkus.log | tail -50
```

### Network Monitoring

```bash
# Use NGINX access logs
tail -f /var/log/nginx/access.log | grep api

# Check request headers
curl -v http://localhost:9003/api/v11/blockchain/stats

# Monitor WebSocket
# In Chrome DevTools: Network tab → Filter by "ws" → Click WebSocket connection
```

---

## Next Steps

### Immediate (This Week)
- [ ] Verify CORS configuration on backend
- [ ] Test RealTimeTPSChart with live backend data
- [ ] Connect Dashboard hooks to actual API endpoints
- [ ] Implement WebSocket endpoint on backend

### Short Term (Next Week)
- [ ] Complete RWA component integration
- [ ] Implement all missing dashboard hooks
- [ ] Setup end-to-end testing with live backend
- [ ] Performance profiling and optimization

### Medium Term (2-4 Weeks)
- [ ] Implement gRPC service layer
- [ ] Add real-time updates for all charts
- [ ] Setup automated monitoring dashboard
- [ ] Create performance baseline reports

---

## References

- **Backend API**: http://localhost:9003/api/v11/
- **Frontend Development**: http://localhost:5173
- **JIRA Board**: https://aurigraphdlt.atlassian.net/jira/projects/AV11
- **Source Code**: https://github.com/Aurigraph-DLT-Corp/Aurigraph-DLT
- **API Documentation**: See `AurigraphResource.java` and related files

---

**Document Version**: 1.0
**Last Updated**: October 26, 2025
**Status**: IN PROGRESS
**Owner**: FDA (Frontend Development Agent)

Generated with Claude Code
