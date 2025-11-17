# Aurigraph V11 API Endpoints Architecture

**Version**: 11.1.0 | **Section**: API Endpoints | **Status**: 🟢 Production Ready
**Last Updated**: 2025-11-17 | **Related**: [ARCHITECTURE-MAIN.md](./ARCHITECTURE-MAIN.md)

---

## REST API Endpoints

**Base URL**: `https://dlt.aurigraph.io/api/v11`
**Total Endpoints**: 46+ REST, 25+ Composite Token APIs

### Core Endpoints
```
GET  /health                        # Health check
GET  /info                          # System information
GET  /performance                   # Performance test
GET  /stats                         # Transaction statistics
```

### Analytics
```
GET  /analytics/dashboard           # Dashboard analytics
GET  /analytics/performance         # Performance metrics
GET  /ai/predictions                # ML predictions
GET  /ai/performance                # AI performance metrics
```

### Blockchain
```
GET  /blockchain/transactions       # Transaction list (paginated)
GET  /blockchain/network/stats      # Network statistics
GET  /blockchain/operations         # Blockchain operations
```

### Nodes
```
GET  /nodes                         # Node list
GET  /nodes/{id}                    # Node details
PUT  /nodes/{id}/config             # Update node config
```

### Consensus
```
GET  /consensus/status              # Consensus state
GET  /live/consensus                # Real-time consensus data
GET  /consensus/metrics             # Consensus metrics
```

### Contracts
```
GET  /contracts                     # Smart contracts list
POST /contracts/deploy              # Deploy contract
GET  /contracts/statistics          # Contract statistics
```

### Security
```
GET  /security/audit                # Security audit log
GET  /security/threats              # Threat monitoring
GET  /security/metrics              # Security metrics
```

### Settings
```
GET  /settings/system               # System settings
PUT  /settings/system               # Update settings
GET  /settings/api-integrations     # API integration config
PUT  /settings/api-integrations     # Update API integrations
```

### Users
```
GET  /users                         # User list
POST /users                         # Create user
PUT  /users/{id}                    # Update user
DELETE /users/{id}                  # Delete user
```

### Backups
```
GET  /backups/history               # Backup history
POST /backups/create                # Trigger backup
```

### RWA (Real World Assets)
```
POST /rwa/tokenize                  # Tokenize asset
GET  /rwa/portfolio                 # Asset portfolio
GET  /rwa/valuation                 # Asset valuation
GET  /rwa/dividends                 # Dividend management
GET  /rwa/compliance                # Compliance tracking
```

### Oracle Service
```
GET  /oracle/status                 # Oracle service status
GET  /oracle/data-feeds             # Data feed list
GET  /oracle/verification           # Verification status
```

### External Integrations
```
GET  /integrations/alpaca           # Alpaca Markets status
GET  /integrations/twitter          # Twitter integration
GET  /integrations/weather          # Weather API status
```

---

## Composite Token APIs (25+ Endpoints)

### Primary Token Endpoints
```
POST   /api/v11/rwa/tokens/primary/create
GET    /api/v11/rwa/tokens/primary/{tokenId}
GET    /api/v11/rwa/tokens/primary/asset/{assetId}
POST   /api/v11/rwa/tokens/primary/{tokenId}/verify
PUT    /api/v11/rwa/tokens/primary/{tokenId}/status
```

### Secondary Token Endpoints
```
POST   /api/v11/rwa/tokens/primary/{primaryTokenId}/secondary/upload
GET    /api/v11/rwa/tokens/secondary/{secondaryTokenId}
GET    /api/v11/rwa/tokens/primary/{primaryTokenId}/secondary
POST   /api/v11/rwa/tokens/secondary/{secondaryTokenId}/verify
DELETE /api/v11/rwa/tokens/secondary/{secondaryTokenId}
```

### Composite Token Endpoints
```
POST   /api/v11/rwa/tokens/composite/create
GET    /api/v11/rwa/tokens/composite/{compositeTokenId}
POST   /api/v11/rwa/tokens/composite/{compositeTokenId}/verify
GET    /api/v11/rwa/tokens/composite/{compositeTokenId}/merkle-proofs
GET    /api/v11/rwa/tokens/primary/{primaryTokenId}/composite
```

### Binding Endpoints
```
POST   /api/v11/rwa/composite-tokens/{compositeTokenId}/bind-to-contract
GET    /api/v11/rwa/composite-tokens/{compositeTokenId}/bound-contract
GET    /api/v11/rwa/contracts/{contractId}/composite-token
GET    /api/v11/rwa/composite-tokens/{compositeTokenId}/binding-proof
GET    /api/v11/rwa/registry/composite-token-contracts
```

### Merkle Registry Endpoints
```
GET    /api/v11/rwa/registry/composite-tokens
GET    /api/v11/rwa/registry/composite-tokens/{tokenId}/proof
POST   /api/v11/rwa/registry/verify-composite-token
GET    /api/v11/rwa/registry/consistency-report
```

### Oracle Management Endpoints
```
GET    /api/v11/rwa/oracles
POST   /api/v11/rwa/oracles/register
GET    /api/v11/rwa/oracles/{oracleId}/verifications
POST   /api/v11/rwa/webhooks/oracle-verification
```

---

## gRPC Services (Planned - Port 9004)

**Protocol**: gRPC + Protocol Buffers

```protobuf
service AurigraphV11Service {
  rpc SubmitTransaction(Transaction) returns (TransactionReceipt);
  rpc GetBlockchainState(StateRequest) returns (BlockchainState);
  rpc StreamTransactions(StreamRequest) returns (stream Transaction);
  rpc GetConsensusStatus(Empty) returns (ConsensusStatus);
}
```

### Planned gRPC Services
- **TransactionService**: High-performance transaction submission
- **BlockchainService**: Blockchain state queries
- **ConsensusService**: Real-time consensus monitoring
- **NetworkService**: Peer-to-peer communication

---

## API Patterns & Conventions

### Request/Response Format
```json
{
  "requestId": "uuid",
  "timestamp": "ISO-8601",
  "data": { /* payload */ },
  "metadata": { /* optional */ }
}
```

### Error Handling
```json
{
  "error": {
    "code": "ERROR_CODE",
    "message": "Human readable message",
    "details": { /* optional */ }
  }
}
```

### Pagination
```json
{
  "data": [ /* items */ ],
  "pagination": {
    "page": 1,
    "pageSize": 50,
    "totalCount": 1000,
    "hasMore": true
  }
}
```

---

## Rate Limiting

- **Anonymous**: 100 req/min
- **Authenticated**: 1000 req/min
- **Premium**: 10,000 req/min
- **Burst**: 2x sustained rate for 10 seconds

---

## Authentication

**Method**: OAuth 2.0 + JWT
**Header**: `Authorization: Bearer {token}`
**Token Expiry**: 1 hour
**Refresh Token**: 7 days

---

## CORS Configuration

```
Access-Control-Allow-Origin: *
Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS
Access-Control-Allow-Headers: DNT,User-Agent,X-Requested-With,If-Modified-Since,Cache-Control,Content-Type,Range,Authorization
Access-Control-Max-Age: 86400
```

---

**Navigation**: [Main](./ARCHITECTURE-MAIN.md) | [Technology Stack](./ARCHITECTURE-TECHNOLOGY-STACK.md) | [Components](./ARCHITECTURE-V11-COMPONENTS.md) | [APIs](./ARCHITECTURE-API-ENDPOINTS.md) ← | [Consensus](./ARCHITECTURE-CONSENSUS.md) | [Security](./ARCHITECTURE-CRYPTOGRAPHY.md)

🤖 Phase 2 Documentation Chunking
