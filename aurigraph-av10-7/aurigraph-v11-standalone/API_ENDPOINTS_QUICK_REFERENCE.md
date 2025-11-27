# Enterprise Portal API Endpoints - Quick Reference
## Grouped by Functional Area

**Document**: `ENTERPRISE_PORTAL_API_ENDPOINTS.md` (full details)  
**Date**: November 26, 2025  
**Total Endpoints**: ~151

---

## Category Breakdown

### 1. Authentication (2 endpoints)
- `POST /auth/login` - User login
- `POST /auth/logout` - User logout

### 2. Health & System (4 endpoints)
- `GET /health` - System health
- `GET /info` - System info
- `GET /system/status` - Full status
- `GET /system/config` - Configuration

### 3. Blockchain Core (4 endpoints)
- `GET /blockchain/stats` - Core metrics (TPS, block height)
- `GET /blockchain/health` - Health status
- `GET /blockchain/transactions/stats` - Transaction stats
- `GET /blockchain/blocks/stats` - Block stats

### 4. Transactions (2 endpoints)
- `GET /blockchain/transactions` - List (paginated)
- `GET /blockchain/transactions/{id}` - Details

### 5. Blocks (2 endpoints)
- `GET /blockchain/blocks` - List (paginated)
- `GET /blockchain/blocks/{height}` - By height

### 6. Nodes & Network (6 endpoints)
- `GET /nodes` - List all nodes
- `GET /nodes/{id}` - Node details
- `GET /blockchain/network/topology` - Network graph
- `GET /blockchain/network/nodes/{nodeId}` - Detailed node
- `GET /blockchain/network/latency?source=&target=` - Node latency
- `GET /blockchain/network/stats` - Network stats

### 7. Channels (6 endpoints)
- `GET /channels` - List channels
- `GET /channels/{id}` - Channel details
- `POST /channels` - Create channel
- `PUT /channels/{id}/config` - Update config
- `GET /channels/{id}/metrics` - Metrics
- `GET /channels/{id}/transactions` - Transactions

### 8. Smart Contracts (14 endpoints)
**Regular Contracts**:
- `GET /contracts` - List
- `GET /contracts/{id}` - Details
- `GET /contracts/templates` - Templates
- `POST /contracts/deploy` - Deploy
- `POST /contracts/{id}/verify` - Verify
- `POST /contracts/{id}/audit` - Audit
- `POST /contracts/{id}/execute` - Execute
- `GET /contracts/statistics` - Stats

**Active Contracts**:
- `GET /activecontracts/contracts` - List
- `GET /activecontracts/contracts/{id}` - Details
- `POST /activecontracts/create` - Create
- `POST /activecontracts/{contractId}/execute/{actionId}` - Execute action
- `GET /activecontracts/templates` - Templates
- `POST /activecontracts/templates/{templateId}/instantiate` - From template

### 9. Tokens (9 endpoints)
- `GET /tokens` - List
- `GET /tokens/{id}` - Details
- `GET /tokens/templates` - Templates
- `POST /tokens/create` - Create
- `POST /tokens/{id}/mint` - Mint
- `POST /tokens/{id}/burn` - Burn
- `POST /tokens/{id}/verify` - Verify
- `GET /tokens/statistics` - Stats
- `GET /tokens/rwa` - RWA tokens

### 10. RWA Tokenization (57 endpoints)

**Core Tokenization**:
- `POST /rwa/tokenize` - Tokenize asset
- `GET /rwa/tokens/{tokenId}` - Token details
- `GET /rwa/tokens` - List tokens (paginated)
- `GET /rwa/tokens/owner/{address}` - By owner
- `GET /rwa/tokens/type/{assetType}` - By type
- `POST /rwa/transfer` - Transfer token
- `POST /rwa/burn` - Burn token
- `GET /rwa/stats` - Stats

**Digital Twin**:
- `GET /rwa/digitaltwin/{tokenId}` - Twin data
- `GET /rwa/digitaltwin/{twinId}/analytics` - Analytics
- `POST /rwa/digitaltwin/{twinId}/iot` - Add IoT data

**Fractional Ownership**:
- `POST /rwa/fractional/split` - Split token
- `POST /rwa/fractional/transfer` - Transfer shares
- `GET /rwa/fractional/{tokenId}/holder/{address}` - Holder info
- `GET /rwa/fractional/{tokenId}/stats` - Ownership stats

**Dividends**:
- `POST /rwa/dividends/distribute` - Distribute
- `POST /rwa/dividends/schedule` - Setup schedule
- `GET /rwa/dividends/{tokenId}/history` - History
- `GET /rwa/dividends/{tokenId}/projection` - Projections
- `GET /rwa/dividends/pending/{address}` - Pending

**Compliance**:
- `POST /rwa/compliance/validate` - Validate
- `GET /rwa/compliance/profile/{address}` - Profile
- `POST /rwa/compliance/kyc` - Submit KYC
- `GET /rwa/compliance/jurisdictions` - Jurisdictions

**Valuation & Oracle**:
- `GET /rwa/valuation/{assetType}/{assetId}` - Valuation
- `POST /rwa/valuation/update` - Update
- `GET /rwa/oracle/price/{assetId}` - Price
- `GET /rwa/oracle/consensus/{assetId}` - Consensus price
- `GET /rwa/oracle/history/{assetId}` - Price history
- `GET /rwa/oracle/health` - Health status

**Portfolio**:
- `GET /rwa/portfolio/{address}` - Portfolio
- `GET /rwa/portfolio/{address}/summary` - Summary
- `GET /rwa/portfolio/{address}/performance` - Performance

### 11. Validators & Staking (6 endpoints)
- `GET /blockchain/validators` - List
- `GET /blockchain/validators/{address}` - Details
- `GET /staking/info` - Staking info
- `POST /staking/validators/{address}/claim-rewards` - Claim
- `GET /validators/{id}/metrics` - Metrics
- `GET /validators/slashing` - Slashing history

### 12. Analytics & Performance (9 endpoints)
- `GET /analytics/{period}` - By period (24h/7d/30d)
- `GET /analytics/network-usage` - Network usage
- `GET /analytics/validator-earnings` - Earnings
- `GET /performance` - Performance metrics
- `GET /analytics/performance` - Analytics performance
- `GET /ai/metrics` - AI metrics
- `GET /ai/predictions` - Predictions
- `GET /ai/performance` - ML performance
- `GET /ai/confidence` - Confidence scores

### 13. Governance (2 endpoints)
- `GET /governance/proposals` - List proposals
- `POST /governance/proposals/{id}/vote` - Vote

### 14. Consensus & Bridge (5 endpoints)
- `GET /blockchain/network/health` - Health
- `GET /consensus/state` - State
- `GET /bridge/statistics` - Stats
- `GET /bridge/health` - Health
- `GET /bridge/transfers` - Transfers

### 15. Enterprise & Security (4 endpoints)
- `GET /enterprise/settings` - Settings
- `PUT /enterprise/settings` - Update settings
- `GET /security/audit-log` - Audit logs
- `GET /security/metrics` - Security metrics

### 16. RWA Advanced (6 endpoints)
- `GET /rwa/portfolio` - Portfolio
- `GET /rwa/tokenization` - Stats
- `GET /rwa/fractionalization` - Info
- `GET /rwa/distribution` - Info
- `GET /rwa/valuation` - Info
- `GET /rwa/pools` - Pools

### 17. Gas & Carbon (4 endpoints)
- `GET /gas/trends?period=` - Trends
- `GET /gas/history` - History
- `GET /carbon/metrics` - Metrics
- `GET /carbon/report` - Report

### 18. Merkle Tree Registry (4 endpoints)
- `GET /registry/rwat/merkle/root` - Root hash
- `GET /registry/rwat/{rwatId}/merkle/proof` - Proof
- `POST /registry/rwat/merkle/verify` - Verify
- `GET /registry/rwat/merkle/stats` - Stats

### 19. Demos (9 endpoints)
- `GET /demos` - List
- `GET /demos/{id}` - Details
- `POST /demos` - Create
- `POST /demos/{id}/start` - Start
- `POST /demos/{id}/stop` - Stop
- `POST /demos/{id}/extend` - Extend
- `POST /demos/{id}/transactions` - Add transactions
- `DELETE /demos/{id}` - Delete
- `GET /demos/active` - Active demos

### 20. Oracle & API Integration (12 endpoints)
- `GET /rwa/oracle/sources` - Oracle sources
- `POST /enterprise/api-keys` - Create API key
- `POST /enterprise/api-keys/{id}/rotate` - Rotate
- `DELETE /enterprise/api-keys/{id}` - Delete
- `GET /enterprise/api-keys/{id}/rotation-logs` - Logs
- `POST /enterprise/external-apis` - Create config
- `PUT /enterprise/external-apis/{id}` - Update
- `POST /enterprise/external-apis/{id}/test` - Test
- `POST /enterprise/contract-mappings` - Create mapping
- `POST /enterprise/contract-mappings/{id}/execute` - Execute
- `GET /enterprise/contract-mappings/{id}/executions` - History
- `POST /enterprise/contract-bindings` - Create binding

### 21. Live Data Streaming (WebSocket)
- `WS /api/v11/live/stream` - Main live stream
- `WS /api/v11/ws/network/topology` - Network updates

### 22. Security & Quantum (2 endpoints)
- `GET /crypto/status` - Crypto status
- `GET /security/quantum-readiness` - Quantum readiness

### 23. Miscellaneous (4 endpoints)
- `GET /advanced/features` - Features
- `GET /config/status` - Config status
- `GET /mobile/status` - Mobile status
- `GET /mobile/metrics` - Mobile metrics

---

## Implementation Checklist

### Priority 1 (Essential)
- [ ] Authentication (`/auth/*`)
- [ ] Health endpoints (`/health`, `/info`)
- [ ] Blockchain stats (`/blockchain/stats`, `/blockchain/health`)
- [ ] Transactions (`/blockchain/transactions/*`)
- [ ] Blocks (`/blockchain/blocks/*`)
- [ ] Nodes (`/nodes/*`)

### Priority 2 (Dashboard Features)
- [ ] Channels (`/channels/*`)
- [ ] Validators (`/blockchain/validators/*`)
- [ ] Network topology (`/blockchain/network/*`)
- [ ] Analytics (`/analytics/*`)
- [ ] Performance (`/performance`, `/ai/*`)

### Priority 3 (Smart Contracts)
- [ ] Contracts (`/contracts/*`)
- [ ] Active Contracts (`/activecontracts/*`)
- [ ] Tokens (`/tokens/*`)

### Priority 4 (RWA - Phase 2)
- [ ] RWA Tokenization (`/rwa/tokenize*`)
- [ ] RWA Portfolio (`/rwa/portfolio/*`)
- [ ] Digital Twin (`/rwa/digitaltwin/*`)
- [ ] Fractional Ownership (`/rwa/fractional/*`)
- [ ] Dividends (`/rwa/dividends/*`)
- [ ] Compliance (`/rwa/compliance/*`)
- [ ] Valuation & Oracle (`/rwa/valuation/*`, `/rwa/oracle/*`)

### Priority 5 (Advanced)
- [ ] Governance (`/governance/*`)
- [ ] Bridge (`/bridge/*`)
- [ ] Consensus (`/consensus/*`)
- [ ] Merkle Registry (`/registry/rwat/merkle/*`)
- [ ] Gas & Carbon (`/gas/*`, `/carbon/*`)
- [ ] Enterprise Settings (`/enterprise/*`)
- [ ] Security (`/security/*`)
- [ ] API Integration (`/enterprise/api-keys*`, `/enterprise/external-apis*`)

### Priority 6 (Utilities)
- [ ] Demos (`/demos/*`)
- [ ] Advanced features (`/advanced/*`)
- [ ] Mobile APIs (`/mobile/*`)
- [ ] WebSocket streaming (`/api/v11/live/stream`)

---

## Key Response Patterns

### Paginated List Response
```json
{
  "items": [],
  "total": 1000,
  "page": 1,
  "pageSize": 20,
  "hasMore": true
}
```

### Single Item Response
```json
{
  "id": "...",
  "data": "..."
}
```

### Error Response
```json
{
  "error": "Error message",
  "status": 400,
  "details": {}
}
```

### Success Response
```json
{
  "success": true,
  "message": "Operation completed"
}
```

---

## Common Headers

**Request**:
```
Authorization: Bearer {token}
X-API-Key: {optional-api-key}
Content-Type: application/json
```

**Response**:
```
Content-Type: application/json
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 999
X-RateLimit-Reset: 1732610400
```

---

## Service Files Reference

**Frontend API Services**:
- `/src/services/api.ts` - Main axios client & endpoints
- `/src/services/DemoService.ts` - Demo management
- `/src/services/RWAService.ts` - RWA tokenization
- `/src/services/ChannelService.ts` - Channel management
- `/src/services/NetworkTopologyService.ts` - Network data
- `/src/services/APIIntegrationService.ts` - Oracle & API management

**Redux Slices**:
- `/src/store/authSlice.ts` - Authentication state
- `/src/store/dashboardSlice.ts` - Dashboard state
- `/src/store/transactionSlice.ts` - Transactions state
- `/src/store/rwaSlice.ts` - RWA state (with async thunks)
- `/src/store/performanceSlice.ts` - Performance metrics
- `/src/store/apiIntegrationSlice.ts` - API integration state

---

## Related Documentation
- Full Details: `ENTERPRISE_PORTAL_API_ENDPOINTS.md`
- Portal Code: `/src/` directory
- Backend Implementation: `aurigraph-v11-standalone` Java service
- Type Definitions: `/src/types/` directory

