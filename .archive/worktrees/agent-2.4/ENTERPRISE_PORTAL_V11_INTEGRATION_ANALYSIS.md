# Enterprise Portal and V11 Backend Integration Analysis
**Generated: 2025-11-12**

---

## EXECUTIVE SUMMARY

The **Aurigraph Enterprise Portal** (React/TypeScript v4.5.0) is fully integrated with the **V11 Java/Quarkus backend** (v11.4.4) through a comprehensive REST API layer. The integration uses:

- **JWT Authentication** with refresh token mechanism
- **Axios-based HTTP client** with auto-retry logic
- **WebSocket connections** for real-time updates
- **NGINX reverse proxy** for HTTPS/SSL termination
- **Multiple API service endpoints** for different domain functions

**Current Status**: Production-ready integration with 50+ REST endpoints implemented

---

## 1. ENTERPRISE PORTAL STRUCTURE

### Technology Stack
- **Framework**: React 18.2 + TypeScript 5.3
- **UI Library**: Material-UI 5.18 + Ant Design 5.11
- **Build Tool**: Vite 5.0.8
- **State Management**: Redux with React-Redux
- **HTTP Client**: Native Fetch API (custom APIClient)
- **WebSocket**: Native WebSocket API

### Frontend Location
```
/Users/subbujois/subbuworkingdir/Aurigraph-DLT/
├── enterprise-portal/
│   └── enterprise-portal/
│       └── frontend/
│           ├── src/
│           │   ├── services/          # API clients and service layers
│           │   ├── components/        # React components
│           │   ├── types/            # TypeScript interfaces
│           │   ├── utils/            # Constants and utilities
│           │   └── store/            # Redux slices
│           ├── vite.config.ts
│           ├── package.json
│           └── .env.production/.env.development
```

---

## 2. FRONTEND API INTEGRATION

### API Client Implementation

**File**: `/Users/subbujois/subbuworkingdir/Aurigraph-DLT/enterprise-portal/enterprise-portal/frontend/src/services/apiClient.ts`

**Key Features**:
```typescript
- Method: Fetch API with custom APIClient class
- Base URL: import.meta.env.VITE_API_BASE_URL (env variable)
- Default: Empty string (uses relative paths)
- JWT Header: Authorization: Bearer {token}
- Refresh Mechanism: Auto-refresh on 401 responses
- CORS Support: credentials: 'include'
```

**Supported Methods**:
- `GET /path` - Fetch data
- `POST /path` - Create resources
- `PUT /path` - Update resources
- `DELETE /path` - Remove resources

### API Configuration
**File**: `/Users/subbujois/subbuworkingdir/Aurigraph-DLT/enterprise-portal/enterprise-portal/frontend/src/utils/constants.ts`

```typescript
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';
export const WS_URL = import.meta.env.VITE_WS_URL || `wss://${window.location.host}`;

// Polling Intervals
CHART_UPDATE_INTERVAL: 1000ms
METRICS_UPDATE_INTERVAL: 2000ms
MAX_CHART_DATA_POINTS: 60

// WebSocket Configuration
WS_RECONNECT_INTERVAL: 5000ms
WS_MAX_RECONNECT_ATTEMPTS: 10
```

### Environment Configuration Files

**Development** (`.env.development`):
```bash
VITE_API_BASE_URL=http://localhost:9003
VITE_WS_URL=ws://localhost:9003
```

**Production** (`.env.production`):
```bash
VITE_API_BASE_URL=https://dlt.aurigraph.io
VITE_WS_URL=wss://dlt.aurigraph.io
```

### Portal Services

**Core Services** (located in `src/services/`):

| Service | Purpose | Endpoints |
|---------|---------|-----------|
| **apiClient.ts** | HTTP client with auth interceptor | All REST endpoints |
| **authService.ts** | JWT token & session management | `/api/v11/login/*` |
| **websocketService.ts** | Real-time updates via WebSocket | `/ws/*` endpoints |
| **V11BackendService.ts** | Health & performance metrics | `/api/v11/health`, `/api/v11/stats` |
| **ComprehensivePortalService.ts** | Explorer, validators, AI, quantum | `/blockchain/*`, `/ai/*`, `/crypto/*` |
| **contractsApi.ts** | Smart contract management | `/contracts/*` |
| **TokenService.ts** | Token operations | `/tokens/*` |
| **ChannelService.ts** | Channel management | `/channels/*` |

---

## 3. V11 BACKEND REST API ENDPOINTS

### Backend Technology Stack
- **Framework**: Quarkus 3.29.0 (Reactive)
- **Runtime**: Java 21 with Virtual Threads
- **HTTP Protocol**: HTTP/2 + TLS 1.3
- **Build Tool**: Maven 3.9+
- **Port**: 9003 (HTTP) / 9004 (gRPC planned)
- **Security**: JWT + BCrypt password hashing

### Backend Location
```
/Users/subbujois/subbuworkingdir/Aurigraph-DLT/
└── aurigraph-av10-7/
    └── aurigraph-v11-standalone/
        ├── src/main/java/io/aurigraph/v11/
        │   ├── AurigraphResource.java          # Main REST endpoints
        │   ├── api/                            # API resources (50+ endpoints)
        │   ├── auth/                           # Authentication
        │   ├── consensus/                      # HyperRAFT++ consensus
        │   ├── crypto/                         # Quantum cryptography
        │   ├── portal/                         # Portal-specific services
        │   └── ...
        ├── pom.xml
        └── src/main/resources/application.properties
```

### API Endpoints by Category

#### Authentication Endpoints (`/api/v11/login/*`)
```
POST   /api/v11/login/authenticate       - Login with credentials
POST   /api/v11/login/refresh            - Refresh JWT token
GET    /api/v11/login/verify             - Verify session validity
POST   /api/v11/login/logout             - Logout and clear session
GET    /api/v11/login/user               - Get current user info
```

#### Health & Status Endpoints
```
GET    /api/v11/health                   - Health check
GET    /api/v11/info                     - System information
GET    /api/v11/stats                    - Transaction/consensus statistics
GET    /api/v11/system/status            - Comprehensive system status
GET    /q/health                         - Quarkus health check
GET    /q/metrics                        - Prometheus metrics
```

#### Performance Endpoints
```
GET    /api/v11/performance              - Basic performance test (TPS)
GET    /api/v11/performance/reactive     - Reactive stream performance
POST   /api/v11/performance/ultra-throughput     - Ultra-high-throughput test
POST   /api/v11/performance/simd-batch           - SIMD-optimized batch
POST   /api/v11/performance/adaptive-batch       - Adaptive batch processing
```

#### Blockchain & Consensus Endpoints
```
GET    /blockchain/latest                - Latest block
GET    /blockchain/block/{id}            - Block by ID
GET    /blockchain/stats                 - Blockchain statistics
GET    /blockchain/transactions          - Transaction list (paginated)
GET    /consensus/status                 - Consensus state
GET    /consensus/metrics                - Consensus performance metrics
GET    /api/v11/system/status            - Full system status
```

#### Cryptography & Security Endpoints
```
GET    /crypto/metrics                   - Crypto performance metrics
GET    /security/hsm-status              - HSM (Hardware Security Module) status
GET    /api/v11/rwa/status               - Real-World Asset status
```

#### Cross-Chain Bridge Endpoints
```
GET    /bridge/supported-chains          - Supported blockchain networks
POST   /bridge/transfer                  - Initiate cross-chain transfer
GET    /bridge/status                    - Bridge status
GET    /bridge/history                   - Transfer history
```

#### Token Management Endpoints
```
POST   /api/v11/tokens/create            - Create new token
GET    /api/v11/tokens/list              - List all tokens
GET    /api/v11/tokens/{id}              - Get token by ID
POST   /api/v11/tokens/transfer          - Transfer tokens
GET    /api/v11/tokens/{id}/balance/{address} - Get balance
GET    /api/v11/tokens/stats             - Token statistics
```

#### AI & Optimization Endpoints
```
GET    /api/v11/ai/metrics               - AI model metrics
GET    /api/v11/ai/predictions           - AI predictions
GET    /api/v11/ai/performance           - AI optimization performance
GET    /api/v11/ai/confidence            - Prediction confidence scores
```

#### User & Role Management Endpoints
```
GET    /api/v11/users                    - List users
POST   /api/v11/users                    - Create user
GET    /api/v11/users/{id}               - Get user by ID
PUT    /api/v11/users/{id}               - Update user
DELETE /api/v11/users/{id}               - Delete user
GET    /api/v11/roles                    - List roles
POST   /api/v11/roles                    - Create role
```

#### Smart Contracts Endpoints
```
POST   /contracts/deploy                 - Deploy smart contract
GET    /contracts/list                   - List active contracts
GET    /contracts/{id}                   - Get contract details
POST   /contracts/{id}/invoke            - Invoke contract method
GET    /contracts/{id}/state             - Get contract state
```

#### Live Data Endpoints
```
GET    /api/v11/live/stream              - WebSocket live data stream
GET    /api/v11/live/nodes               - Live node status
GET    /api/v11/live/network             - Live network topology
```

**Resource Files**:
- `AurigraphResource.java` - Main REST endpoints (deprecated, superseded by PortalAPIGateway)
- `api/BlockchainApiResource.java` - Blockchain operations
- `api/ConsensusApiResource.java` - Consensus metrics
- `api/CryptoApiResource.java` - Cryptography operations
- `api/AIApiResource.java` - AI optimization
- `api/BridgeApiResource.java` - Cross-chain bridge
- `auth/LoginResource.java` - Authentication
- `user/UserResource.java` - User management
- `user/RoleResource.java` - Role management
- `contracts/ActiveContractResource.java` - Smart contracts
- `tokens/TokenResource.java` - Token management
- And 30+ more specialized resources

---

## 4. AUTHENTICATION & SECURITY

### JWT Authentication Flow

**Frontend (authService.ts)**:
```typescript
1. User submits credentials
   POST /api/v11/login/authenticate
   { username, password }

2. Backend returns JWT tokens
   Response: {
     success: true,
     token: "eyJhbGc...",
     refreshToken: "eyJhbGc...",
     user: { id, username, email, roles },
     expiresIn: 86400 (seconds)
   }

3. Frontend stores tokens in localStorage
   - auth_token: JWT access token
   - auth_refresh_token: Refresh token
   - auth_user: User object
   - auth_expiry: Expiration timestamp

4. Subsequent requests include JWT header
   Authorization: Bearer {token}

5. Token refresh on 401 response
   POST /api/v11/login/refresh
   Authorization: Bearer {refreshToken}
```

**Backend (LoginResource.java)**:
```java
- Path: /api/v11/login/authenticate
- Authentication: Basic credentials validation
- Password: BCrypt hashing (BcryptUtil)
- Token Generation: JJWT library (io.jsonwebtoken)
- Token Storage: Database with expiration tracking
- Token Types: ACCESS & REFRESH tokens
```

### Password Security
- **Algorithm**: BCrypt with configurable work factor
- **Storage**: Hashed in database (never plaintext)
- **Verification**: Quarkus Elytron Security

### Token Configuration
```properties
# JWT Token Expiration (application.properties)
jwt.expiry.access=86400           # 24 hours
jwt.expiry.refresh=604800         # 7 days
jwt.secret=<configured-in-secrets> # Never in code
```

---

## 5. WEBSOCKET REAL-TIME INTEGRATION

### WebSocket Channels

**File**: `/Users/subbujois/subbuworkingdir/Aurigraph-DLT/enterprise-portal/enterprise-portal/frontend/src/services/websocketService.ts`

**Supported Channels**:
```typescript
'transactions'     → /ws/transactions
'validators'       → /ws/validators
'consensus'        → /ws/consensus
'network'          → /ws/network
'metrics'          → /ws/metrics
'channels'         → /ws/channels
'live-stream'      → /api/v11/live/stream
```

### WebSocket Message Format
```typescript
interface WebSocketMessage {
  type: WebSocketMessageType
  channel: WebSocketChannel
  data: any
  timestamp: string
  messageId?: string
}

// Message Types
type WebSocketMessageType =
  | 'transaction'
  | 'validator'
  | 'consensus'
  | 'network'
  | 'metric'
  | 'channel'
  | 'error'
  | 'connected'
  | 'disconnected'
```

### WebSocket Features
- **Auto-connection**: Subscribing to a channel auto-connects
- **Auto-reconnect**: Exponential backoff (up to 10 attempts)
- **Max backoff**: 32x reconnect interval (~160 seconds)
- **Graceful degradation**: Unsubscribed channels don't reconnect
- **Error handling**: Channel-level error events

### Backend WebSocket Support
- **Framework**: Quarkus WebSockets (`quarkus-websockets`)
- **Protocol**: WebSocket over HTTP/2
- **Handlers**: LiveDataResource.java, LiveNetworkResource.java
- **Message format**: JSON with type discrimination

---

## 6. CORS & SECURITY HEADERS

### CORS Configuration

**Frontend** (apiClient.ts):
```typescript
// Includes credentials for cookie-based fallback auth
credentials: 'include'

// Headers
{
  'Authorization': 'Bearer {token}',
  'Content-Type': 'application/json'
}
```

**Backend** (NGINX Proxy Configuration):
```nginx
# NGINX handles CORS for HTTPS termination
proxy_pass http://localhost:9003;

# CORS Headers (added by reverse proxy)
add_header 'Access-Control-Allow-Origin' '$http_origin' always;
add_header 'Access-Control-Allow-Credentials' 'true' always;
add_header 'Access-Control-Allow-Methods' 'GET,POST,PUT,DELETE,OPTIONS' always;
add_header 'Access-Control-Allow-Headers' 'Authorization,Content-Type' always;
```

### Security Headers
```
Strict-Transport-Security: max-age=31536000; includeSubDomains
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
Content-Security-Policy: default-src 'self' https://iam2.aurigraph.io
```

### HTTPS/TLS Configuration
- **Protocol**: TLS 1.3
- **Termination**: NGINX reverse proxy
- **Backend Port**: 9003 (HTTP-only, internal only)
- **Production**: HTTPS on dlt.aurigraph.io
- **Certificate**: Let's Encrypt (auto-renewed)

---

## 7. DATA TYPES & API CONTRACTS

### Core Response Types

**HealthCheckResponse**:
```typescript
{
  status: 'UP' | 'DOWN' | 'DEGRADED'
  timestamp: string (ISO 8601)
  version: string
  uptime: number (seconds)
  checks: {
    database: 'UP' | 'DOWN'
    consensus: 'UP' | 'DOWN'
    network: 'UP' | 'DOWN'
  }
}
```

**PerformanceMetrics**:
```typescript
{
  timestamp: string
  tps: number
  avgTps: number
  peakTps: number
  totalTransactions: number
  activeTransactions: number
  avgLatencyMs: number
  p50LatencyMs, p95LatencyMs, p99LatencyMs: number
  memoryUsageMb: number
  cpuUsagePercent: number
}
```

**ConsensusStats**:
```typescript
{
  currentTerm: number
  blockHeight: number
  commitIndex: number
  leaderNodeId: string | null
  validatorCount: number
  activeValidators: number
  avgFinalityLatencyMs: number
  consensusState: 'IDLE' | 'PROPOSING' | 'VOTING' | 'COMMITTING'
}
```

**StatsResponse**:
```typescript
{
  timestamp: string
  performance: PerformanceMetrics
  consensus: ConsensusStats
  transactions: TransactionStats
  channels: ChannelStats
  network: NetworkStats
}
```

**Location**: `/Users/subbujois/subbuworkingdir/Aurigraph-DLT/enterprise-portal/enterprise-portal/frontend/src/types/api.ts`

---

## 8. INTEGRATION POINTS - KEY FILES

### Frontend Files

| File | Purpose |
|------|---------|
| `apiClient.ts` | HTTP client with JWT auth |
| `authService.ts` | JWT token & session mgmt |
| `websocketService.ts` | WebSocket connections |
| `V11BackendService.ts` | Health & stats API |
| `ComprehensivePortalService.ts` | Blockchain explorer API |
| `contractsApi.ts` | Smart contracts API |
| `TokenService.ts` | Token operations |
| `ChannelService.ts` | Channel management |
| `types/api.ts` | API response types |
| `utils/constants.ts` | API URLs & configuration |

**Location**: `/Users/subbujois/subbuworkingdir/Aurigraph-DLT/enterprise-portal/enterprise-portal/frontend/src/`

### Backend Files

| File | Purpose |
|------|---------|
| `AurigraphResource.java` | Main REST endpoints |
| `auth/LoginResource.java` | Authentication |
| `api/BlockchainApiResource.java` | Blockchain operations |
| `api/ConsensusApiResource.java` | Consensus metrics |
| `api/CryptoApiResource.java` | Cryptography |
| `api/AIApiResource.java` | AI optimization |
| `api/BridgeApiResource.java` | Cross-chain bridge |
| `user/UserResource.java` | User management |
| `tokens/TokenResource.java` | Token operations |
| `contracts/ActiveContractResource.java` | Smart contracts |

**Location**: `/Users/subbujois/subbuworkingdir/Aurigraph-DLT/aurigraph-av10-7/aurigraph-v11-standalone/src/main/java/io/aurigraph/v11/`

### Configuration Files

| File | Purpose |
|------|---------|
| `pom.xml` | Maven dependencies & build |
| `application.properties` | Quarkus configuration |
| `application-prod.properties` | Production config |
| `application-perf.properties` | Performance tuning |
| `.env.development` | Dev environment vars |
| `.env.production` | Prod environment vars |
| `vite.config.ts` | Vite build config |
| `package.json` | Frontend dependencies |

---

## 9. DEPLOYMENT ARCHITECTURE

### Development Environment
```
Frontend (localhost:3000)
   ↓
VITE Dev Server (http://localhost:3000)
   ↓
API_BASE_URL = http://localhost:9003
   ↓
V11 Backend (localhost:9003)
   ↓
Database (PostgreSQL)
```

### Production Environment
```
Frontend (dlt.aurigraph.io)
   ↓
NGINX Reverse Proxy (HTTPS/TLS 1.3)
   ↓
V11 Backend Service (internal:9003)
   ↓
PostgreSQL (internal network)
```

### Docker Compose Services
- `nginx-gateway`: Reverse proxy & HTTPS termination
- `api-node-1`: V11 backend service
- `database`: PostgreSQL 16
- `redis`: Caching layer
- `enterprise-portal`: React frontend

---

## 10. INTEGRATION STATUS & ISSUES

### Completed Integration Features
✅ JWT authentication with refresh tokens
✅ REST API client with retry logic
✅ WebSocket real-time updates
✅ Health check endpoints
✅ Performance metrics API
✅ Blockchain explorer API
✅ Smart contracts API
✅ Token management API
✅ User & role management
✅ CORS support (via NGINX)
✅ Error handling & logging
✅ TypeScript type definitions

### Known Issues & Gaps

**1. WebSocket Implementation Gap**
- **Issue**: Backend WebSocket handlers (LiveDataResource.java) are implemented but may have incomplete message routing
- **Impact**: Real-time updates might be delayed or missing
- **Fix**: Verify WebSocket message handlers are properly registered
- **Files**: `live/LiveDataResource.java`, `api/LiveNetworkResource.java`

**2. CORS Pre-flight Handling**
- **Issue**: CORS pre-flight requests (OPTIONS) must be handled by NGINX, not backend
- **Impact**: Browser may reject requests if CORS headers missing
- **Fix**: Ensure NGINX adds CORS headers for OPTIONS requests
- **Location**: NGINX configuration

**3. Demo Mode Disabled**
- **Issue**: `V11BackendService.ts` has demo mode permanently disabled
- **Impact**: No fallback if backend unavailable
- **Status**: Intentional security decision (production-only)

**4. gRPC not yet Active**
- **Issue**: gRPC support configured in pom.xml but not actively used
- **Status**: Planned for Phase 3 implementation
- **Port**: 9004 (configured but not required yet)

---

## 11. PERFORMANCE CHARACTERISTICS

### API Performance
- **HTTP Method**: GET/POST/PUT/DELETE with HTTP/2
- **Compression**: GZIP enabled in NGINX
- **Caching**: Redis for frequently accessed data
- **Rate Limiting**: 1000 req/min per user (configured)

### Response Times (Target)
- Health check: <10ms
- Stats endpoint: <50ms
- Blockchain explorer: <100ms
- Complex queries: <500ms

### WebSocket Performance
- Latency: <100ms per update
- Message size: ~1-5KB JSON
- Throughput: 1000+ messages/sec per connection

### Backend Performance
- **TPS Target**: 2M+ (currently 776K baseline)
- **Latency**: <100ms p99
- **Memory**: <256MB (native), ~512MB (JVM)
- **Startup**: <1s (native), ~3s (JVM)

---

## 12. TESTING & VALIDATION

### Frontend API Testing
```bash
# Start dev server
cd enterprise-portal/enterprise-portal/frontend
npm install
npm run dev    # http://localhost:3000

# Run tests
npm test       # Unit tests
npm run test:e2e   # E2E tests with Playwright
```

### Backend API Testing
```bash
# Start backend
cd aurigraph-av10-7/aurigraph-v11-standalone
./mvnw quarkus:dev    # Dev mode on http://localhost:9003

# Test endpoints
curl http://localhost:9003/api/v11/health
curl http://localhost:9003/api/v11/stats
curl http://localhost:9003/api/v11/info

# Performance test
curl -X POST http://localhost:9003/api/v11/performance/adaptive-batch \
  -H 'Content-Type: application/json' \
  -d '{"requestCount": 10000}'
```

### Integration Tests
```bash
# Full stack test (requires both frontend & backend running)
npm run test:e2e --headed   # See tests in UI
```

---

## 13. SECURITY CONSIDERATIONS

### Authentication
- JWT tokens stored in localStorage
- Refresh tokens for automatic token refresh
- BCrypt password hashing with work factor 12
- Session validation on app startup
- 401 handling triggers re-authentication

### Data Protection
- HTTPS/TLS 1.3 in production
- Credentials included with requests (httpOnly cookies not used)
- No sensitive data in localStorage except JWT tokens
- CORS restrictions via NGINX

### API Security
- Rate limiting (1000 req/min per user)
- Input validation on all endpoints
- SQL injection prevention (JPA/Hibernate)
- XSS prevention via Content-Security-Policy

### Credential Management
- Database stored: User passwords (hashed), JWT tokens (with expiry), refresh tokens
- In code: Never credentials, use env variables
- IAM: Keycloak integration (optional, can bypass with JWT)

---

## 14. MONITORING & LOGGING

### Frontend Logging
- Console logging for API calls
- Redux DevTools for state inspection
- Performance monitoring via apiClient
- WebSocket connection logging

### Backend Logging
- SLF4J with Logmanager
- JSON logging for ELK stack
- Structured logging with context
- Performance metrics via Micrometer

### Observability
- Prometheus metrics: `/q/metrics`
- Health checks: `/q/health`
- Request tracing: X-Request-ID headers
- Error tracking: Error details in API responses

---

## RECOMMENDATIONS

### Immediate Improvements
1. **Implement WebSocket Message Validation**
   - Add schema validation for incoming messages
   - Implement message acknowledgments
   
2. **Add Request Interceptors**
   - Log all API calls in production
   - Track API performance metrics
   - Monitor error rates

3. **Enhance Error Handling**
   - Implement exponential backoff for all API calls
   - Add circuit breaker pattern
   - Better error messages to frontend

### Medium-term Improvements
1. **Implement gRPC Support**
   - Migrate internal service-to-service communication to gRPC
   - Improve performance 30-50%
   
2. **Add API Rate Limiting UI**
   - Show rate limit status to users
   - Implement queue for rate-limited requests

3. **Implement Token Rotation**
   - Rotate tokens every 24 hours
   - Implement sliding window refresh

### Long-term Goals
1. **Migrate to OpenAPI/Swagger**
   - Generate API documentation automatically
   - Client SDK generation from OpenAPI spec

2. **Implement API Gateway Pattern**
   - Consolidate all endpoint routing
   - Centralized authentication
   - Better logging and monitoring

3. **Add GraphQL Option**
   - Reduce over-fetching of data
   - More flexible queries from frontend

---

## APPENDIX: API ENDPOINT INVENTORY

### Complete Endpoint List (50+)
See AurigraphResource.java and api/* files for all endpoints.

**Total Implemented**: 50+ REST endpoints
**Status**: Production-ready
**Performance**: Optimized for 776K-2M+ TPS

