# Aurigraph V11 API Quick Start Guide

**Version:** 11.3.2
**Last Updated:** October 17, 2025
**Base URL:** `https://dlt.aurigraph.io/api/v11`

## Table of Contents
1. [Getting Started](#getting-started)
2. [Authentication](#authentication)
3. [Core Endpoints](#core-endpoints)
4. [Code Examples](#code-examples)
5. [Error Handling](#error-handling)
6. [Rate Limiting](#rate-limiting)
7. [Support](#support)

---

## Getting Started

The Aurigraph V11 API provides programmatic access to the high-performance blockchain platform with 2M+ TPS capability, quantum-resistant cryptography, and cross-chain interoperability.

### Base URL
```
Production: https://dlt.aurigraph.io/api/v11
Sandbox:    https://sandbox.dlt.aurigraph.io/api/v11
```

### Requirements
- API Key (obtain from Enterprise Portal)
- HTTPS connection required
- JSON request/response format

---

## Authentication

All authenticated endpoints require a Bearer token in the Authorization header.

### Obtaining an API Key
1. Log in to the [Enterprise Portal](https://dlt.aurigraph.io)
2. Navigate to Settings > API Keys
3. Click "Generate New Key"
4. Store your API key securely

### Using Your API Key
```http
Authorization: Bearer YOUR_API_KEY_HERE
```

---

## Core Endpoints

### Health & Status

#### GET `/health`
Check system health status.

**Authentication:** Not required
**Response:**
```json
{
  "status": "healthy",
  "uptime": 86400,
  "version": "11.3.2"
}
```

#### GET `/info`
Get system information and capabilities.

**Authentication:** Not required
**Response:**
```json
{
  "version": "11.3.2",
  "consensus": "HyperRAFT++",
  "tps": 2000000,
  "features": ["quantum-resistant", "cross-chain", "rwa-tokenization"]
}
```

---

### Blockchain Operations

#### GET `/blockchain/stats`
Get blockchain statistics and metrics.

**Authentication:** Required
**Response:**
```json
{
  "blockHeight": 1234567,
  "tps": 1500000,
  "totalTransactions": 9876543210,
  "validators": 100
}
```

#### GET `/blockchain/latest`
Get the latest block.

**Authentication:** Required
**Response:**
```json
{
  "height": 1234567,
  "hash": "0x1234...abcd",
  "timestamp": "2025-10-17T12:00:00Z",
  "transactions": 10000,
  "validator": "0xabcd...1234"
}
```

#### GET `/blockchain/block/{id}`
Get a specific block by ID or hash.

**Authentication:** Required
**Parameters:**
- `id` (path): Block height or hash

---

### Transactions

#### POST `/transactions`
Submit a new transaction.

**Authentication:** Required
**Request Body:**
```json
{
  "from": "0x1234...abcd",
  "to": "0xabcd...1234",
  "amount": 100,
  "data": "optional_data"
}
```

**Response:**
```json
{
  "txId": "0xtx123...abc",
  "status": "pending",
  "timestamp": "2025-10-17T12:00:00Z"
}
```

#### GET `/transactions/{txId}`
Get transaction details.

**Authentication:** Required
**Parameters:**
- `txId` (path): Transaction ID

#### GET `/transactions/status/{txId}`
Get transaction status.

**Authentication:** Required
**Response:**
```json
{
  "txId": "0xtx123...abc",
  "status": "confirmed",
  "blockHeight": 1234567,
  "confirmations": 12
}
```

---

### Performance & Metrics

#### GET `/performance`
Get performance metrics.

**Authentication:** Required
**Query Parameters:**
- `iterations` (optional): Number of test iterations
- `threads` (optional): Number of parallel threads

**Response:**
```json
{
  "currentTPS": 1800000,
  "peakTPS": 2100000,
  "averageTPS": 1750000,
  "latency": 45.2
}
```

#### GET `/consensus/metrics`
Get consensus protocol metrics.

**Authentication:** Required
**Response:**
```json
{
  "consensusType": "HyperRAFT++",
  "leaderNode": "node-001",
  "consensusLatency": 12.5,
  "successRate": 99.99
}
```

---

### Cross-Chain Bridge

#### GET `/bridge/status`
Get bridge status and statistics.

**Authentication:** Required
**Response:**
```json
{
  "totalTransfers": 50000,
  "pendingTransfers": 120,
  "supportedChains": ["Ethereum", "BSC", "Polygon", "Avalanche"]
}
```

#### POST `/bridge/transfer`
Initiate a cross-chain transfer.

**Authentication:** Required
**Request Body:**
```json
{
  "sourceChain": "Ethereum",
  "targetChain": "Polygon",
  "amount": 1000,
  "token": "USDT",
  "recipient": "0xabcd...1234"
}
```

#### GET `/bridge/supported-chains`
Get list of supported blockchain networks.

**Authentication:** Not required
**Response:**
```json
{
  "chains": [
    {
      "name": "Ethereum",
      "chainId": 1,
      "status": "active"
    },
    {
      "name": "Binance Smart Chain",
      "chainId": 56,
      "status": "active"
    }
  ]
}
```

---

### Real-World Assets (RWA)

#### GET `/rwa/status`
Get RWA tokenization module status.

**Authentication:** Required
**Response:**
```json
{
  "totalAssets": 150,
  "totalValue": 50000000,
  "activeTokens": 145
}
```

#### POST `/rwa/tokenize`
Tokenize a real-world asset.

**Authentication:** Required
**Request Body:**
```json
{
  "assetType": "real_estate",
  "description": "Commercial Property",
  "value": 1000000,
  "shares": 1000
}
```

---

### Oracle Services

#### GET `/oracles/status`
Get oracle service status.

**Authentication:** Required
**Response:**
```json
{
  "totalOracles": 10,
  "activeOracles": 9,
  "healthScore": 97.07
}
```

---

## Code Examples

### JavaScript/TypeScript (axios)
```javascript
import axios from 'axios';

const client = axios.create({
  baseURL: 'https://dlt.aurigraph.io/api/v11',
  headers: {
    'Authorization': 'Bearer YOUR_API_KEY',
    'Content-Type': 'application/json'
  }
});

// Get blockchain stats
async function getBlockchainStats() {
  try {
    const response = await client.get('/blockchain/stats');
    console.log('Blockchain Stats:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error:', error.response?.data || error.message);
  }
}

// Submit transaction
async function submitTransaction(from, to, amount) {
  try {
    const response = await client.post('/transactions', {
      from,
      to,
      amount
    });
    console.log('Transaction ID:', response.data.txId);
    return response.data;
  } catch (error) {
    console.error('Error:', error.response?.data || error.message);
  }
}

// Usage
await getBlockchainStats();
await submitTransaction('0x123...', '0xabc...', 100);
```

### Python (requests)
```python
import requests

BASE_URL = 'https://dlt.aurigraph.io/api/v11'
API_KEY = 'YOUR_API_KEY'

headers = {
    'Authorization': f'Bearer {API_KEY}',
    'Content-Type': 'application/json'
}

# Get blockchain stats
def get_blockchain_stats():
    response = requests.get(f'{BASE_URL}/blockchain/stats', headers=headers)
    if response.status_code == 200:
        return response.json()
    else:
        print(f'Error: {response.status_code}')
        return None

# Submit transaction
def submit_transaction(from_addr, to_addr, amount):
    data = {
        'from': from_addr,
        'to': to_addr,
        'amount': amount
    }
    response = requests.post(f'{BASE_URL}/transactions',
                            json=data,
                            headers=headers)
    if response.status_code == 200:
        return response.json()
    else:
        print(f'Error: {response.status_code}')
        return None

# Usage
stats = get_blockchain_stats()
print(stats)

tx = submit_transaction('0x123...', '0xabc...', 100)
print(tx)
```

### cURL
```bash
# Get system health (no auth required)
curl -X GET https://dlt.aurigraph.io/api/v11/health

# Get blockchain stats (auth required)
curl -X GET https://dlt.aurigraph.io/api/v11/blockchain/stats \
  -H "Authorization: Bearer YOUR_API_KEY"

# Submit transaction
curl -X POST https://dlt.aurigraph.io/api/v11/transactions \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "from": "0x1234...abcd",
    "to": "0xabcd...1234",
    "amount": 100
  }'
```

---

## Error Handling

### Standard Error Response
```json
{
  "error": {
    "code": "INVALID_REQUEST",
    "message": "Invalid transaction format",
    "details": "Field 'amount' must be a positive number"
  }
}
```

### Common Error Codes

| Code | Description |
|------|-------------|
| `INVALID_REQUEST` | Request format or parameters are invalid |
| `UNAUTHORIZED` | Missing or invalid API key |
| `NOT_FOUND` | Requested resource not found |
| `RATE_LIMIT_EXCEEDED` | Too many requests |
| `INTERNAL_ERROR` | Server-side error |
| `INSUFFICIENT_BALANCE` | Insufficient funds for transaction |
| `NETWORK_ERROR` | Blockchain network error |

---

## Rate Limiting

**Default Limits:**
- **Free Tier:** 100 requests/minute
- **Standard Tier:** 1,000 requests/minute
- **Enterprise Tier:** 10,000 requests/minute

**Rate Limit Headers:**
```http
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 950
X-RateLimit-Reset: 1698412800
```

When rate limit is exceeded, you'll receive a `429 Too Many Requests` response.

---

## Support

### Documentation
- **Full API Documentation:** https://docs.aurigraph.io/api
- **Developer Portal:** https://dlt.aurigraph.io
- **Status Page:** https://status.aurigraph.io

### Contact
- **Technical Support:** support@aurigraph.io
- **Sales & Enterprise:** sales@aurigraph.io
- **GitHub Issues:** https://github.com/Aurigraph-DLT-Corp/Aurigraph-DLT/issues

### Community
- **Discord:** https://discord.gg/aurigraph
- **Telegram:** https://t.me/aurigraph
- **Twitter:** @AurigraphDLT

---

## Best Practices

1. **Always use HTTPS** - Never send API keys over HTTP
2. **Store API keys securely** - Use environment variables or secure vaults
3. **Implement retry logic** - Handle transient network errors
4. **Monitor rate limits** - Check response headers
5. **Validate responses** - Always check status codes and error messages
6. **Use sandbox for testing** - Test integrations before production
7. **Keep dependencies updated** - Use latest SDK versions

---

## Next Steps

1. **Generate your API key** in the [Enterprise Portal](https://dlt.aurigraph.io)
2. **Try the sandbox** environment at https://sandbox.dlt.aurigraph.io
3. **Explore the SDK** libraries for your programming language
4. **Join the community** on Discord for support and updates

---

**Version History:**
- v11.3.2 (Oct 2025): Rate limiting implementation
- v11.3.0 (Oct 2025): Security enhancements
- v11.0.0 (Sep 2025): Initial V11 release

**Need help?** Contact us at support@aurigraph.io
