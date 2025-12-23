# Aurigraph V11 REST API - Quick Reference

## Base URLs
- **Dev**: `http://localhost:9003/api/v11/`
- **Prod**: `https://dlt.aurigraph.io/api/v11/`

---

## Core Platform Endpoints (Root Level)

```
GET  /health              - Health status
GET  /info                - System info
GET  /performance         - Performance test
GET  /stats               - Transaction stats
GET  /system/status       - Full system status
GET  /rwa/status          - RWA module status
```

---

## Blockchain APIs (`/blockchain/`)

### Transactions
```
POST /transactions              - Process single transaction
GET  /transactions              - List recent transactions
POST /transactions/batch        - Batch transaction processing
GET  /transactions/stats        - Transaction statistics
```

### Blocks
```
GET  /blocks                    - List recent blocks
GET  /blocks/{height}           - Get block by height
GET  /block/{id}                - Get block by ID/hash
GET  /latest                    - Get latest block
GET  /stats                      - Blockchain statistics
```

### Network & Validators
```
GET  /validators                - List validators
GET  /chain/info                - Chain information
GET  /network                   - Network stats
GET  /network/stats             - Detailed network stats
```

---

## Consensus APIs (`/consensus/`)

```
GET  /status                    - Consensus status (HyperRAFT++)
GET  /nodes                     - Consensus nodes info
GET  /metrics                   - Consensus performance metrics
POST /propose                   - Submit consensus proposal
```

---

## AI/ML APIs (`/ai/`)

```
GET  /models                    - List AI models
GET  /models/{id}               - Get model details
POST /models/{id}/retrain       - Retrain model
GET  /status                    - AI system status
GET  /metrics                   - AI metrics
GET  /predictions               - AI predictions
POST /optimize                  - Submit optimization job
```

---

## Cryptography APIs (`/crypto/`)

```
GET  /status                    - Crypto system status
GET  /algorithms                - Supported algorithms
GET  /security/quantum-status   - Quantum security status
POST /keystore/generate         - Generate key pair
POST /encrypt                   - Encrypt data
POST /decrypt                   - Decrypt data
POST /sign                      - Create signature
POST /verify                    - Verify signature
GET  /metrics                   - Crypto metrics
```

---

## Cross-Chain Bridge APIs (`/bridge/`)

```
GET  /stats                     - Bridge statistics
GET  /supported-chains          - List supported chains
GET  /chains                    - Supported chains
GET  /transfers                 - Transfer history
GET  /transfers/{id}            - Get transfer details
GET  /bridges                   - Bridge status
GET  /metrics                   - Bridge metrics
POST /transfer                  - Initiate transfer
```

---

## Real-World Assets APIs (`/rwa/`)

```
GET  /status                    - RWA system status
GET  /assets                    - List tokenized assets
POST /assets                    - Tokenize new asset
GET  /assets/{id}               - Get asset details
POST /assets/{id}/verify        - Verify asset
GET  /categories                - Asset categories
GET  /portfolio                 - User portfolio
GET  /market-data               - Market data
GET  /compliance                - Compliance status
POST /valuations                - Asset valuation
```

---

## Smart Contracts APIs (`/contracts/`)

```
POST /contracts/deploy          - Deploy contract
GET  /contracts                 - List contracts
GET  /contracts/{id}            - Get contract details
POST /contracts/{id}/execute    - Execute function
GET  /contracts/{id}/state      - Get contract state
GET  /contracts/active          - Get active contracts
POST /ricardian/upload          - Upload Ricardian contract
GET  /ricardian                 - List Ricardian contracts
GET  /ricardian/{id}            - Get Ricardian contract
```

---

## Token APIs (`/tokens/`)

```
POST /tokens/create             - Create token
GET  /tokens/list               - List tokens
GET  /tokens/{id}               - Get token details
GET  /tokens/{id}/balance/{addr} - Get balance
GET  /tokens/stats              - Token statistics
POST /tokens/mint               - Mint tokens
POST /tokens/burn               - Burn tokens
POST /tokens/transfer           - Transfer tokens
```

---

## Tokenization APIs (`/tokenization/`)

```
GET  /tokenization/sources      - External API sources
POST /tokenization/sources      - Add source
GET  /tokenization/sources/{id}/status - Source status
GET  /tokenization/channels/stats      - Channel stats
GET  /tokenization/transactions        - Transactions
```

---

## Security APIs (`/security/`)

```
GET  /security/status           - Security status
GET  /security/keys             - Cryptographic keys
GET  /security/metrics          - Security metrics
GET  /security/audits           - Audit logs
POST /security/keys/rotate      - Rotate keys
POST /security/scan             - Vulnerability scan
```

---

## Data Feeds & Oracles APIs

```
GET  /feeds                     - List feeds
GET  /feeds/{id}                - Get feed details
GET  /feeds/{id}/data           - Get feed data
GET  /price-feeds               - Price feeds
GET  /price-feeds/{symbol}      - Get price
GET  /oracles                   - Oracle status
GET  /oracles/{id}/metrics      - Oracle metrics
```

---

## Analytics APIs (`/analytics/`)

```
GET  /analytics/transactions    - Transaction analytics
GET  /analytics/blocks          - Block analytics
GET  /analytics/validators      - Validator metrics
GET  /analytics/network         - Network analytics
GET  /analytics/performance     - Performance analytics
GET  /analytics/ai              - AI analytics
GET  /analytics/reports         - Generate reports
```

---

## Network Monitoring APIs (`/network/`)

```
GET  /network/peers             - Network peers
GET  /network/connections       - Active connections
GET  /network/bandwidth         - Bandwidth stats
GET  /network/latency           - Latency metrics
GET  /network/health            - Network health
GET  /network/topology          - Network topology
```

---

## Enterprise APIs (`/enterprise/`)

```
GET  /enterprise/config         - Configuration
PUT  /enterprise/config         - Update config
GET  /enterprise/users          - List users
GET  /enterprise/users/{id}     - Get user
GET  /enterprise/roles          - List roles
POST /enterprise/roles          - Create role
GET  /enterprise/permissions    - List permissions
GET  /enterprise/audit          - Audit logs
GET  /enterprise/compliance     - Compliance status
GET  /enterprise/health         - Service health
```

---

## Performance Testing Endpoints

```
GET  /performance              - Standard performance test
GET  /performance/reactive     - Reactive stream test
POST /performance/simd-batch   - SIMD-optimized batch
POST /performance/ultra-throughput - Ultra-high throughput
POST /performance/adaptive-batch   - Adaptive batch
```

### Query Parameters
```
?iterations=100000  - Number of transactions (max 500K)
?threads=1          - Number of threads (max 64)
```

---

## Authentication & Headers

```
Authorization: Bearer <jwt-token>
Content-Type: application/json
Accept: application/json
```

---

## Rate Limiting

```
Standard:     100 requests/second
Admin:        10 requests/second
Auth:         5 requests/minute
Performance:  60 requests/minute
```

**HTTP Status Code**: 429 (Too Many Requests)

---

## Common Response Codes

```
200 OK                   - Successful GET/POST/PUT
201 Created              - Resource created successfully
202 Accepted             - Request accepted for processing
400 Bad Request          - Invalid request format
401 Unauthorized         - Missing/invalid authentication
403 Forbidden            - Permission denied
404 Not Found            - Resource not found
429 Too Many Requests    - Rate limit exceeded
500 Internal Error       - Server error
503 Unavailable          - Service temporarily unavailable
```

---

## OpenAPI/Swagger

- **OpenAPI Version**: 3.0.3
- **Swagger UI**: http://localhost:9003/q/swagger-ui.html (dev)
- **OpenAPI Spec**: http://localhost:9003/q/openapi.json (dev)

---

## Frontend Integration

### Main Service Layer
- **File**: `ComprehensivePortalService.ts`
- **Location**: `/enterprise-portal/frontend/src/services/`
- **Features**: Retry logic, error handling, caching

### Key Components
- Dashboard: Health, stats, system monitoring
- BlockExplorer: Block and transaction queries
- ValidatorDashboard: Validator and consensus info
- AIOptimizationControls: AI models and predictions
- QuantumSecurityPanel: Crypto and security operations
- CrossChainBridge: Multi-chain transfers
- RWATRegistry: Real-world asset management
- SmartContractRegistry: Contract management

---

## Performance Targets

| Metric | Target | Current |
|--------|--------|---------|
| TPS | 2M+ | ~776K-1.8M |
| Finality | <100ms | Achieved |
| Latency (p99) | <150ms | <150ms |
| Startup (native) | <1s | <1s |
| Memory (native) | <256MB | <256MB |

---

## Key JIRA Tickets

| Ticket | Feature | Status |
|--------|---------|--------|
| AV11-267 | Network stats endpoint | ✅ Complete |
| AV11-368 | Consensus & crypto metrics | ✅ Complete |
| AV11-369 | Cross-chain bridge support | ✅ Complete |
| AV11-370 | RWA tokenization status | ✅ Complete |
| AV11-371 | Performance test timeout fix | ✅ Complete |

---

## Useful Commands

### Start V11 Dev Server
```bash
cd aurigraph-av10-7/aurigraph-v11-standalone
./mvnw quarkus:dev    # Port 9003
```

### Test Endpoint
```bash
curl -X GET http://localhost:9003/api/v11/health
```

### Run Performance Test
```bash
curl -X GET "http://localhost:9003/api/v11/performance?iterations=100000&threads=4"
```

### Build Native Image
```bash
./mvnw package -Pnative-fast
./target/aurigraph-v11-standalone-11.0.0-runner
```

---

## File Locations

| Item | Location |
|------|----------|
| API Resources | `src/main/java/io/aurigraph/v11/api/` |
| Tests | `src/test/java/io/aurigraph/v11/` |
| OpenAPI Spec | `docs/openapi.yaml` |
| Frontend | `enterprise-portal/frontend/src/` |
| Configuration | `src/main/resources/application.properties` |

---

## More Information

- Full documentation: `/ENDPOINT_ANALYSIS.md`
- OpenAPI spec: `docs/openapi.yaml`
- Project info: `CLAUDE.md`
- Recent changes: Latest git commits
