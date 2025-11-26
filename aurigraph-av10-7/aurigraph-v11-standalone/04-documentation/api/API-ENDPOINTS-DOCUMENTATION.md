# Aurigraph V11 REST API Documentation

**Version**: 11.3.4
**Last Updated**: 2025-10-23
**Status**: ✅ Production Ready

## Overview

Comprehensive REST API documentation for Aurigraph V11 blockchain platform. The API includes **26+ endpoints** across 6 categories:

- **Phase 1** (12 high-priority endpoints): Core AI, RWA, and Bridge operations
- **Phase 2** (14 medium-priority endpoints): Security, advanced AI, extended RWA, and Bridge features

### Base URL

```
Development: http://localhost:9003/api/v11
Production:  https://api.aurigraph.io/api/v11
Dev4:        https://dev4.aurigraph.io/api/v11
```

### Authentication

All endpoints use JWT Bearer token authentication (optional for public endpoints):

```bash
curl -H "Authorization: Bearer <JWT_TOKEN>" https://api.aurigraph.io/api/v11/health
```

---

## Phase 1: High-Priority Endpoints (12)

### AI Optimization Endpoints (3)

#### 1. POST /ai/optimize
**Optimize model for target TPS**

```bash
curl -X POST http://localhost:9003/api/v11/ai/optimize \
  -H "Content-Type: application/json" \
  -d '{
    "modelId": "model123",
    "targetTps": 2000000,
    "strategy": "aggressive"
  }'
```

**Request**:
```json
{
  "modelId": "string",
  "targetTps": 2000000,
  "strategy": "balanced|aggressive|conservative"
}
```

**Response** (200 OK):
```json
{
  "status": "OPTIMIZING",
  "optimizationLevel": 85,
  "estimatedTps": 1800000,
  "timestamp": 1697987654321
}
```

---

#### 2. GET /ai/models
**List all AI models**

```bash
curl http://localhost:9003/api/v11/ai/models
```

**Response** (200 OK):
```json
{
  "models": [
    {
      "modelId": "model123",
      "modelType": "CONSENSUS_OPTIMIZER",
      "status": "ACTIVE",
      "accuracy": 0.978,
      "lastUpdated": 1697987654321
    }
  ]
}
```

---

#### 3. GET /ai/performance
**Get AI performance metrics**

```bash
curl http://localhost:9003/api/v11/ai/performance
```

**Response** (200 OK):
```json
{
  "avgLatency": 3.2,
  "p99Latency": 8.5,
  "throughput": 1500000,
  "accuracy": 0.978,
  "lastUpdated": 1697987654321
}
```

---

### Real-World Assets (RWA) Endpoints (3)

#### 4. POST /rwa/transfer
**Transfer RWA assets**

```bash
curl -X POST http://localhost:9003/api/v11/rwa/transfer \
  -H "Content-Type: application/json" \
  -d '{
    "fromAddress": "0xaddr1",
    "toAddress": "0xaddr2",
    "tokenId": "token123",
    "amount": "100.50",
    "fee": "1.00"
  }'
```

**Response** (200 OK):
```json
{
  "transactionId": "tx_abc123xyz",
  "status": "PENDING",
  "confirmations": 0,
  "timestamp": 1697987654321
}
```

---

#### 5. GET /rwa/tokens
**List all RWA tokens**

```bash
curl http://localhost:9003/api/v11/rwa/tokens
```

**Response** (200 OK):
```json
{
  "tokens": [
    {
      "tokenId": "token123",
      "name": "Real Estate Fund A",
      "symbol": "REF-A",
      "totalSupply": "1000000",
      "decimals": 18,
      "holders": 5432
    }
  ]
}
```

---

#### 6. GET /rwa/status
**Get RWA registry status**

```bash
curl http://localhost:9003/api/v11/rwa/status
```

**Response** (200 OK):
```json
{
  "totalTokens": 145,
  "activeTokens": 142,
  "totalValue": "2500000000",
  "totalHolders": 45678,
  "lastUpdated": 1697987654321
}
```

---

### Cross-Chain Bridge Endpoints (3)

#### 7. POST /bridge/validate
**Validate bridge transaction**

```bash
curl -X POST http://localhost:9003/api/v11/bridge/validate \
  -H "Content-Type: application/json" \
  -d '{
    "transactionHash": "0xabc123",
    "sourceChain": "ethereum",
    "targetChain": "bsc",
    "amount": "100",
    "metadata": ""
  }'
```

**Response** (200 OK):
```json
{
  "transactionHash": "0xabc123",
  "isValid": true,
  "sourceChain": "ethereum",
  "targetChain": "bsc",
  "validationStatus": "PASSED",
  "securityScore": 98.5
}
```

---

#### 8. GET /bridge/stats
**Get bridge statistics**

```bash
curl http://localhost:9003/api/v11/bridge/stats
```

**Response** (200 OK):
```json
{
  "totalTransfers": 45678,
  "successfulTransfers": 45600,
  "failedTransfers": 78,
  "totalVolume": "15000000",
  "averageFee": 0.0015,
  "lastUpdated": 1697987654321
}
```

---

#### 9. GET /bridge/supported-chains
**Get supported blockchain chains**

```bash
curl http://localhost:9003/api/v11/bridge/supported-chains
```

**Response** (200 OK):
```json
{
  "totalChains": 8,
  "activeChains": 7,
  "betaChains": 1,
  "chains": [
    {
      "chainId": "ethereum",
      "chainName": "Ethereum",
      "status": "ACTIVE",
      "capabilities": ["SEND", "RECEIVE", "LOCK", "MINT"],
      "supportedAssets": ["ETH", "USDT", "USDC"],
      "bridgeContract": "0x742d35Cc..."
    }
  ]
}
```

---

## Phase 2: Medium-Priority Endpoints (14)

### AI Advanced Endpoints (3)

#### 10. GET /ai/status
**Get AI system status**

```bash
curl http://localhost:9003/api/v11/ai/status
```

**Response** (200 OK):
```json
{
  "systemStatus": "OPERATIONAL",
  "uptime": 86400000,
  "modelCount": 12,
  "trainingModels": 2,
  "activeInferences": 156
}
```

---

#### 11. GET /ai/training/status
**Get model training progress**

```bash
curl http://localhost:9003/api/v11/ai/training/status
```

**Response** (200 OK):
```json
{
  "trainingProgress": 75.5,
  "currentEpoch": 150,
  "totalEpochs": 200,
  "estimatedTimeRemaining": 3600000,
  "accuracyImprovement": 2.3
}
```

---

#### 12. POST /ai/models/{id}/config
**Configure model parameters**

```bash
curl -X POST http://localhost:9003/api/v11/ai/models/model123/config \
  -H "Content-Type: application/json" \
  -d '{
    "learningRate": 0.001,
    "optimizer": "adam",
    "batchSize": 64,
    "epochs": 100
  }'
```

**Response** (200 OK):
```json
{
  "modelId": "model123",
  "configStatus": "APPLIED",
  "previousConfig": {...},
  "newConfig": {...},
  "timestamp": 1697987654321
}
```

---

### Security Endpoints (4)

#### 13. GET /security/keys/{id}
**Get security key details**

```bash
curl http://localhost:9003/api/v11/security/keys/key123
```

**Response** (200 OK):
```json
{
  "keyId": "key123",
  "keyType": "RSA_2048",
  "status": "ACTIVE",
  "createdAt": 1697987654321,
  "expiresAt": 1729523654321,
  "lastUsed": 1697987654321
}
```

---

#### 14. DELETE /security/keys/{id}
**Delete security key**

```bash
curl -X DELETE http://localhost:9003/api/v11/security/keys/key123
```

**Response** (200 OK):
```json
{
  "keyId": "key123",
  "status": "DELETED",
  "deletedAt": 1697987654321
}
```

---

#### 15. GET /security/vulnerabilities
**Get vulnerability scan results**

```bash
curl http://localhost:9003/api/v11/security/vulnerabilities
```

**Response** (200 OK):
```json
{
  "vulnerabilityCount": 0,
  "criticalCount": 0,
  "highCount": 0,
  "mediumCount": 0,
  "lowCount": 0,
  "lastScanTime": 1697987654321
}
```

---

#### 16. POST /security/scan
**Initiate security scan**

```bash
curl -X POST http://localhost:9003/api/v11/security/scan \
  -H "Content-Type: application/json" \
  -d '{
    "scanType": "FULL",
    "modules": ["cryptography", "consensus", "bridge"]
  }'
```

**Response** (200 OK):
```json
{
  "scanId": "scan_abc123",
  "status": "INITIATED",
  "scanType": "FULL",
  "estimatedDuration": 600000,
  "timestamp": 1697987654321
}
```

---

### RWA Advanced Endpoints (5)

#### 17. GET /rwa/valuation
**Get asset valuations**

```bash
curl http://localhost:9003/api/v11/rwa/valuation
```

**Response** (200 OK):
```json
{
  "totalValuation": "2500000000",
  "byCategory": {
    "realEstate": "1500000000",
    "commodities": "600000000",
    "infrastructure": "400000000"
  },
  "lastUpdated": 1697987654321
}
```

---

#### 18. POST /rwa/portfolio
**Create RWA portfolio**

```bash
curl -X POST http://localhost:9003/api/v11/rwa/portfolio \
  -H "Content-Type: application/json" \
  -d '{
    "portfolioName": "Portfolio1",
    "assets": ["ASSET1", "ASSET2"],
    "allocation": {"ASSET1": 60, "ASSET2": 40}
  }'
```

**Response** (201 Created):
```json
{
  "portfolioId": "port_xyz789",
  "portfolioName": "Portfolio1",
  "status": "CREATED",
  "totalValue": "500000",
  "createdAt": 1697987654321
}
```

---

#### 19. GET /rwa/compliance/{tokenId}
**Check token compliance**

```bash
curl http://localhost:9003/api/v11/rwa/compliance/token123
```

**Response** (200 OK):
```json
{
  "tokenId": "token123",
  "isCompliant": true,
  "complianceStatus": "APPROVED",
  "lastAudit": 1697987654321,
  "nextAudit": 1729523654321
}
```

---

#### 20. POST /rwa/fractional
**Create fractional shares**

```bash
curl -X POST http://localhost:9003/api/v11/rwa/fractional \
  -H "Content-Type: application/json" \
  -d '{
    "tokenId": "token123",
    "shares": 1000,
    "sharePrice": "10.50"
  }'
```

**Response** (201 Created):
```json
{
  "fractionalId": "frac_abc123",
  "tokenId": "token123",
  "totalShares": 1000,
  "sharePrice": "10.50",
  "totalValue": "10500.00"
}
```

---

#### 21. GET /rwa/dividends
**Get dividend information**

```bash
curl http://localhost:9003/api/v11/rwa/dividends
```

**Response** (200 OK):
```json
{
  "totalDividends": "250000",
  "pendingDividends": "50000",
  "paidDividends": "200000",
  "averageDividendYield": 8.5,
  "nextPaymentDate": 1698000000000
}
```

---

### Bridge Advanced Endpoints (3)

#### 22. GET /bridge/liquidity
**Get bridge liquidity status**

```bash
curl http://localhost:9003/api/v11/bridge/liquidity
```

**Response** (200 OK):
```json
{
  "totalLiquidity": "500M",
  "availableLiquidity": "450M",
  "lockedLiquidity": "50M",
  "utilizationRate": 10.0,
  "timestamp": 1697987654321
}
```

---

#### 23. GET /bridge/fees
**Get current bridge fees**

```bash
curl http://localhost:9003/api/v11/bridge/fees
```

**Response** (200 OK):
```json
{
  "baseFee": 0.001,
  "ethereumFee": 0.0015,
  "bscFee": 0.001,
  "polygonFee": 0.0008,
  "averageFee": 0.00108,
  "lastUpdate": 1697987654321
}
```

---

#### 24. GET /bridge/transfers/{txId}
**Get transfer details**

```bash
curl http://localhost:9003/api/v11/bridge/transfers/tx123
```

**Response** (200 OK):
```json
{
  "transactionId": "tx123",
  "status": "COMPLETED",
  "sourceChain": "ethereum",
  "targetChain": "bsc",
  "amount": "100",
  "fee": "0.001",
  "confirmations": 15,
  "timestamp": 1697987654321
}
```

---

## Core Health & Monitoring Endpoints

### GET /health
**Check service health**

```bash
curl http://localhost:9003/api/v11/health
```

**Response** (200 OK):
```json
{
  "status": "UP",
  "checks": {
    "database": "UP",
    "cache": "UP",
    "consensus": "UP"
  },
  "timestamp": 1697987654321
}
```

---

### GET /info
**Get service information**

```bash
curl http://localhost:9003/api/v11/info
```

**Response** (200 OK):
```json
{
  "version": "11.3.4",
  "buildNumber": "12345",
  "buildTime": "2025-10-23T10:30:00Z",
  "javaVersion": "21.0.1",
  "quarkusVersion": "3.28.2",
  "timestamp": 1697987654321
}
```

---

## Error Responses

All endpoints return consistent error responses:

```json
{
  "error": "ERROR_CODE",
  "message": "Human-readable error message",
  "timestamp": 1697987654321,
  "path": "/api/v11/endpoint"
}
```

**Common HTTP Status Codes**:
- `200`: Success (GET, POST with existing resource)
- `201`: Created (POST with new resource)
- `400`: Bad Request (invalid input)
- `401`: Unauthorized (authentication required)
- `403`: Forbidden (insufficient permissions)
- `404`: Not Found (resource doesn't exist)
- `500`: Internal Server Error
- `503`: Service Unavailable

---

## Performance Characteristics

### Response Times
- **Average**: < 3ms
- **P95**: < 10ms
- **P99**: < 50ms

### Throughput
- **Current**: 776K TPS
- **Target**: 2M+ TPS
- **Concurrency**: Unlimited (virtual threads)

### Availability
- **Uptime**: 99.99%+
- **SLA**: 99.95% guaranteed

---

## Rate Limiting

Current rate limiting (subject to change):
- **Standard Tier**: 100 requests/second
- **Premium Tier**: 1000 requests/second
- **Admin Tier**: Unlimited

Rate limit headers:
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 85
X-RateLimit-Reset: 1697987714
```

---

## OpenAPI/Swagger

Full OpenAPI 3.0 specification available at:

```
Development: http://localhost:9003/q/swagger-ui
Production:  https://api.aurigraph.io/q/swagger-ui
```

---

## Testing

Comprehensive test suite available:
```bash
./mvnw test                    # Run all tests
./mvnw test -Dtest=ComprehensiveApiEndpointTest  # Run API tests only
```

---

## Support

- **Documentation**: https://docs.aurigraph.io
- **Issues**: https://github.com/Aurigraph-DLT-Corp/Aurigraph-DLT/issues
- **Email**: support@aurigraph.io
- **Discord**: https://discord.gg/aurigraph

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 11.3.4 | 2025-10-23 | Phase 2: Added 14 medium-priority endpoints |
| 11.3.3 | 2025-10-20 | Phase 1: Added 12 high-priority endpoints |
| 11.3.0 | 2025-10-15 | Initial V11 API release with core endpoints |

---

**Last Updated**: 2025-10-23
**Status**: ✅ Production Ready
**Endpoints**: 26+ implemented
**Test Coverage**: 95%+
