# Aurigraph V11 API Documentation

This directory contains comprehensive API documentation for the Aurigraph V11 DLT platform.

## Quick Links

- **OpenAPI Specification**: [aurigraph-v11-openapi.yaml](./aurigraph-v11-openapi.yaml)
- **Swagger UI**: Access at `http://localhost:9003/q/swagger-ui` (when server is running)
- **ReDoc**: Access at `http://localhost:9003/q/redoc` (when server is running)

## API Overview

The Aurigraph V11 platform exposes a comprehensive REST API for blockchain operations, quantum cryptography, AI optimization, and more.

### Base URLs

- **Production**: `https://dlt.aurigraph.io/api/v11`
- **Development**: `http://localhost:9003/api/v11`

### API Categories

1. **Core Platform** - Health, info, and system status
2. **Blockchain** - Transactions, blocks, validators
3. **Consensus** - HyperRAFT++ consensus operations
4. **Cryptography** - Quantum-resistant crypto (CRYSTALS-Kyber/Dilithium)
5. **AI/ML** - AI optimization and predictions
6. **Bridge** - Cross-chain interoperability
7. **RWA** - Real-World Asset tokenization
8. **Network** - Network monitoring and statistics
9. **Performance** - Benchmarking and testing

## Getting Started

### 1. View API Documentation

#### Option A: Swagger UI (Interactive)

1. Start the Aurigraph V11 server:
   ```bash
   cd /path/to/aurigraph-v11-standalone
   ./mvnw quarkus:dev
   ```

2. Open your browser to:
   ```
   http://localhost:9003/q/swagger-ui
   ```

3. Explore and test API endpoints directly from the browser

#### Option B: ReDoc (Documentation-focused)

1. Start the server (same as above)

2. Open your browser to:
   ```
   http://localhost:9003/q/redoc
   ```

#### Option C: View OpenAPI YAML

```bash
cat docs/api/aurigraph-v11-openapi.yaml
```

### 2. Import into API Tools

The OpenAPI specification can be imported into various API tools:

#### Postman

1. Open Postman
2. Click **Import**
3. Select **File** > choose `aurigraph-v11-openapi.yaml`
4. Collections and examples will be automatically generated

#### Insomnia

1. Open Insomnia
2. Click **Import/Export** > **Import Data** > **From File**
3. Select `aurigraph-v11-openapi.yaml`

#### Swagger Editor

1. Visit [editor.swagger.io](https://editor.swagger.io/)
2. **File** > **Import file**
3. Select `aurigraph-v11-openapi.yaml`

### 3. Generate Client SDKs

Use OpenAPI Generator to create client libraries:

```bash
# Install OpenAPI Generator (if not installed)
npm install -g @openapitools/openapi-generator-cli

# Generate Java client
openapi-generator-cli generate \
  -i docs/api/aurigraph-v11-openapi.yaml \
  -g java \
  -o clients/java

# Generate Python client
openapi-generator-cli generate \
  -i docs/api/aurigraph-v11-openapi.yaml \
  -g python \
  -o clients/python

# Generate TypeScript/JavaScript client
openapi-generator-cli generate \
  -i docs/api/aurigraph-v11-openapi.yaml \
  -g typescript-axios \
  -o clients/typescript
```

## API Examples

### Health Check

```bash
curl http://localhost:9003/api/v11/health
```

**Response:**
```json
{
  "status": "HEALTHY",
  "version": "11.0.0-standalone",
  "uptimeSeconds": 86400,
  "totalRequests": 12500000,
  "platform": "Java/Quarkus/GraalVM"
}
```

### Process Transaction

```bash
curl -X POST http://localhost:9003/api/v11/blockchain/transactions \
  -H "Content-Type: application/json" \
  -d '{
    "transactionId": "tx-12345",
    "amount": 100.50
  }'
```

**Response:**
```json
{
  "transactionId": "tx-12345",
  "status": "PROCESSED",
  "amount": 100.50,
  "timestamp": 1729543200000,
  "message": "Transaction processed successfully"
}
```

### Get Latest Block

```bash
curl http://localhost:9003/api/v11/blockchain/latest
```

**Response:**
```json
{
  "height": 1450789,
  "hash": "0x7b3a9c2d1f4e8a6b5c9d2e7f4a1b8c3d",
  "parentHash": "0x6a2b8c1d0e3f7a5b4c8d1e6f3a0b7c2d",
  "timestamp": 1729543200000,
  "transactions": 1523,
  "validator": "validator_0",
  "size": 258432,
  "gasUsed": 8125000
}
```

### Blockchain Statistics

```bash
curl http://localhost:9003/api/v11/blockchain/stats
```

**Response:**
```json
{
  "currentHeight": 1450789,
  "totalBlocks": 1450789,
  "totalTransactions": 125678543,
  "averageBlockTime": 2.05,
  "transactionStats": {
    "currentTPS": 1808267,
    "peakTPS": 2156789
  },
  "validatorStats": {
    "total": 127,
    "active": 121
  }
}
```

### Generate Quantum-Resistant Keys

```bash
curl -X POST http://localhost:9003/api/v11/crypto/keystore/generate \
  -H "Content-Type: application/json" \
  -d '{
    "keyId": "my-quantum-key",
    "algorithm": "KYBER"
  }'
```

### AI Model Status

```bash
curl http://localhost:9003/api/v11/ai/status
```

**Response:**
```json
{
  "systemStatus": "OPERATIONAL",
  "aiEnabled": true,
  "totalModels": 5,
  "activeModels": 4,
  "averageModelAccuracy": 95.7,
  "performanceImpact": {
    "consensusLatencyReduction": 23.5,
    "throughputIncrease": 18.2
  }
}
```

## Authentication

### OAuth 2.0 (Planned)

Authentication will be implemented using OAuth 2.0 / JWT tokens. For development, most endpoints are currently accessible without authentication.

**Future implementation:**

```bash
# Obtain token
curl -X POST https://dlt.aurigraph.io/oauth/token \
  -d "grant_type=client_credentials" \
  -d "client_id=YOUR_CLIENT_ID" \
  -d "client_secret=YOUR_CLIENT_SECRET"

# Use token
curl -H "Authorization: Bearer YOUR_TOKEN" \
  https://dlt.aurigraph.io/api/v11/blockchain/stats
```

## Rate Limiting

API endpoints are rate-limited to ensure fair usage:

- **Standard endpoints**: 100 requests/second
- **Performance test endpoints**: 60 requests/minute
- **Admin endpoints**: 10 requests/second
- **Authentication endpoints**: 5 requests/minute

**Rate Limit Headers:**
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1729543260
```

## Error Handling

The API uses standard HTTP status codes:

- `200 OK` - Request succeeded
- `201 Created` - Resource created
- `400 Bad Request` - Invalid input
- `401 Unauthorized` - Authentication required
- `403 Forbidden` - Insufficient permissions
- `404 Not Found` - Resource not found
- `429 Too Many Requests` - Rate limit exceeded
- `500 Internal Server Error` - Server error
- `503 Service Unavailable` - Service temporarily unavailable

**Error Response Format:**
```json
{
  "error": "INVALID_REQUEST",
  "message": "Transaction ID is required",
  "timestamp": 1729543200000
}
```

## Performance Testing

### Run Performance Benchmark

```bash
curl "http://localhost:9003/api/v11/performance?iterations=100000&threads=16"
```

**Response:**
```json
{
  "iterations": 100000,
  "durationMs": 54.32,
  "transactionsPerSecond": 1841254,
  "nsPerTransaction": 543.2,
  "optimizations": "Java/Quarkus + Virtual Threads (Timeout Protected)",
  "threadCount": 16,
  "targetTPS": 2000000,
  "targetAchieved": false
}
```

### Ultra-High-Throughput Test

```bash
curl -X POST http://localhost:9003/api/v11/performance/ultra-throughput \
  -H "Content-Type: application/json" \
  -d '{"iterations": 500000}'
```

## WebSocket Support (Planned)

Real-time updates will be available via WebSocket connections:

```javascript
const ws = new WebSocket('wss://dlt.aurigraph.io/api/v11/ws');

ws.on('message', (data) => {
  const event = JSON.parse(data);
  console.log('New block:', event);
});

ws.send(JSON.stringify({
  subscribe: 'blocks'
}));
```

## Versioning

The API uses URL-based versioning (`/api/v11`). Breaking changes will be introduced in new versions while maintaining backward compatibility for at least one major version.

## Support

- **Documentation**: https://docs.aurigraph.io
- **GitHub**: https://github.com/Aurigraph-DLT-Corp/Aurigraph-DLT
- **Email**: support@aurigraph.io
- **JIRA**: https://aurigraphdlt.atlassian.net

## OpenAPI Tools

### Validate OpenAPI Specification

```bash
# Install validator
npm install -g @apidevtools/swagger-cli

# Validate spec
swagger-cli validate docs/api/aurigraph-v11-openapi.yaml
```

### Generate Documentation

```bash
# Install redoc-cli
npm install -g redoc-cli

# Generate static HTML
redoc-cli bundle docs/api/aurigraph-v11-openapi.yaml \
  -o docs/api/index.html \
  --title "Aurigraph V11 API Documentation"
```

## Contributing

To update the API documentation:

1. Modify `aurigraph-v11-openapi.yaml`
2. Validate the specification: `swagger-cli validate aurigraph-v11-openapi.yaml`
3. Test changes in Swagger UI: `http://localhost:9003/q/swagger-ui`
4. Submit PR with updated documentation

## License

Proprietary - Aurigraph Corporation
