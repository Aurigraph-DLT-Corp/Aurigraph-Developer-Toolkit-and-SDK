# Enterprise Portal + V11 Integration - Quick Reference

## Key Locations

### Frontend
- **Package.json**: `/Users/subbujois/subbuworkingdir/Aurigraph-DLT/enterprise-portal/enterprise-portal/frontend/package.json`
- **API Client**: `/Users/subbujois/subbuworkingdir/Aurigraph-DLT/enterprise-portal/enterprise-portal/frontend/src/services/apiClient.ts`
- **Auth Service**: `/Users/subbujois/subbuworkingdir/Aurigraph-DLT/enterprise-portal/enterprise-portal/frontend/src/services/authService.ts`
- **WebSocket Service**: `/Users/subbujois/subbuworkingdir/Aurigraph-DLT/enterprise-portal/enterprise-portal/frontend/src/services/websocketService.ts`
- **API Types**: `/Users/subbujois/subbuworkingdir/Aurigraph-DLT/enterprise-portal/enterprise-portal/frontend/src/types/api.ts`
- **Constants**: `/Users/subbujois/subbuworkingdir/Aurigraph-DLT/enterprise-portal/enterprise-portal/frontend/src/utils/constants.ts`

### Backend
- **POM.xml**: `/Users/subbujois/subbuworkingdir/Aurigraph-DLT/aurigraph-av10-7/aurigraph-v11-standalone/pom.xml`
- **Main Resource**: `/Users/subbujois/subbuworkingdir/Aurigraph-DLT/aurigraph-av10-7/aurigraph-v11-standalone/src/main/java/io/aurigraph/v11/AurigraphResource.java`
- **Auth Resource**: `/Users/subbujois/subbuworkingdir/Aurigraph-DLT/aurigraph-av10-7/aurigraph-v11-standalone/src/main/java/io/aurigraph/v11/auth/LoginResource.java`
- **API Resources**: `/Users/subbujois/subbuworkingdir/Aurigraph-DLT/aurigraph-av10-7/aurigraph-v11-standalone/src/main/java/io/aurigraph/v11/api/` (50+ files)
- **Config**: `/Users/subbujois/subbuworkingdir/Aurigraph-DLT/aurigraph-av10-7/aurigraph-v11-standalone/src/main/resources/application.properties`

## API Base URLs

| Environment | URL | Port |
|-------------|-----|------|
| Development | http://localhost:9003 | 9003 |
| Production | https://dlt.aurigraph.io | 443 |

## Frontend Environment Variables

```bash
# Development
VITE_API_BASE_URL=http://localhost:9003
VITE_WS_URL=ws://localhost:9003

# Production
VITE_API_BASE_URL=https://dlt.aurigraph.io
VITE_WS_URL=wss://dlt.aurigraph.io
```

## Core API Endpoints

| Category | Method | Endpoint | Purpose |
|----------|--------|----------|---------|
| Auth | POST | /api/v11/login/authenticate | Login |
| Auth | POST | /api/v11/login/refresh | Refresh token |
| Auth | POST | /api/v11/login/logout | Logout |
| Health | GET | /api/v11/health | Health check |
| Stats | GET | /api/v11/stats | System statistics |
| Performance | GET | /api/v11/performance | Performance metrics |
| Blockchain | GET | /blockchain/latest | Latest block |
| Blockchain | GET | /blockchain/stats | Blockchain stats |
| Consensus | GET | /consensus/metrics | Consensus metrics |
| Crypto | GET | /crypto/metrics | Crypto metrics |
| AI | GET | /api/v11/ai/metrics | AI metrics |
| Tokens | GET | /api/v11/tokens/list | List tokens |
| Contracts | GET | /contracts/list | List contracts |

## WebSocket Channels

```typescript
'transactions'     → /ws/transactions
'validators'       → /ws/validators
'consensus'        → /ws/consensus
'network'          → /ws/network
'metrics'          → /ws/metrics
'channels'         → /ws/channels
'live-stream'      → /api/v11/live/stream
```

## Start Commands

### Frontend
```bash
cd enterprise-portal/enterprise-portal/frontend
npm install
npm run dev          # Development mode (http://localhost:3000)
npm run build        # Production build
npm test             # Run tests
npm run test:e2e     # End-to-end tests
```

### Backend
```bash
cd aurigraph-av10-7/aurigraph-v11-standalone
./mvnw quarkus:dev   # Development mode (http://localhost:9003)
./mvnw test          # Run tests
./mvnw package       # Build JAR
```

## Authentication Flow

1. **Login**: `POST /api/v11/login/authenticate` with username/password
2. **Response**: JWT token + refresh token
3. **Storage**: localStorage (auth_token, auth_refresh_token, auth_user)
4. **Headers**: `Authorization: Bearer {token}`
5. **Refresh**: Auto-refresh on 401 response using refresh token

## Integration Points

### Frontend Services

- **apiClient.ts**: HTTP requests with JWT interceptor
- **authService.ts**: Token management and session handling
- **websocketService.ts**: Real-time updates (7 channels)
- **V11BackendService.ts**: Health/performance metrics
- **ComprehensivePortalService.ts**: Blockchain explorer
- **contractsApi.ts**: Smart contracts
- **TokenService.ts**: Token operations
- **ChannelService.ts**: Channel management

### Backend Resources

- **LoginResource.java**: Authentication endpoints
- **BlockchainApiResource.java**: Blockchain queries
- **ConsensusApiResource.java**: Consensus metrics
- **CryptoApiResource.java**: Cryptography operations
- **AIApiResource.java**: AI optimization
- **BridgeApiResource.java**: Cross-chain operations
- **UserResource.java**: User management
- **TokenResource.java**: Token operations
- **ActiveContractResource.java**: Smart contracts

## Response Status Codes

| Code | Meaning | Action |
|------|---------|--------|
| 200 | OK | Success |
| 201 | Created | Resource created |
| 400 | Bad Request | Invalid input |
| 401 | Unauthorized | Invalid/expired token - refresh or re-login |
| 403 | Forbidden | Insufficient permissions |
| 404 | Not Found | Resource not found |
| 429 | Too Many Requests | Rate limit exceeded |
| 500 | Server Error | Backend error |

## Common Curl Requests

```bash
# Health check
curl http://localhost:9003/api/v11/health

# Get stats
curl http://localhost:9003/api/v11/stats

# Login
curl -X POST http://localhost:9003/api/v11/login/authenticate \
  -H 'Content-Type: application/json' \
  -d '{"username":"admin","password":"password"}'

# Authenticated request
curl http://localhost:9003/api/v11/blockchain/latest \
  -H 'Authorization: Bearer {JWT_TOKEN}'
```

## Performance Targets

| Metric | Current | Target |
|--------|---------|--------|
| TPS | 776K | 2M+ |
| Latency (p99) | <500ms | <100ms |
| Finality | <500ms | <100ms |
| Memory (native) | <256MB | <256MB |
| Startup | <1s | <1s |
| Response time | <100ms | <50ms |

## Known Issues

1. **WebSocket Message Routing**: Backend handlers may not route all message types
2. **CORS Pre-flight**: Ensure NGINX handles OPTIONS requests with proper headers
3. **Demo Mode Disabled**: V11BackendService has no fallback data
4. **gRPC Not Active**: Configured but not used yet (Phase 3)

## Files Summary

| Type | Count | Location |
|------|-------|----------|
| Frontend Services | 8 | `/frontend/src/services/` |
| Frontend Components | 40+ | `/frontend/src/components/` |
| Backend Resources | 52 | `/v11-standalone/src/main/java/io/aurigraph/v11/api/` |
| Backend Services | 20+ | `/v11-standalone/src/main/java/io/aurigraph/v11/*/` |
| API Types (TS) | 10+ | `/frontend/src/types/` |
| Redux Slices | 4 | `/frontend/src/store/` |

## Full Documentation

See: `/Users/subbujois/subbuworkingdir/Aurigraph-DLT/ENTERPRISE_PORTAL_V11_INTEGRATION_ANALYSIS.md`

