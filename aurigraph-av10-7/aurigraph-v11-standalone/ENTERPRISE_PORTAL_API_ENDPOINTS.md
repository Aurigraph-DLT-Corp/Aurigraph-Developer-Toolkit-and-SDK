# Enterprise Portal API Endpoints Analysis
## Comprehensive Backend API Requirements for Aurigraph V11

**Analysis Date**: November 26, 2025  
**Portal Version**: v4.5.0  
**Frontend Framework**: React 18 + TypeScript  
**Backend Target**: Java/Quarkus V11  
**Base API URL**: `/api/v11`

---

## Executive Summary

The Enterprise Portal makes API calls across **12 functional areas** with **89 unique endpoints** grouped by feature domain. All endpoints expect JSON request/response bodies with Bearer token authentication. The portal implements graceful fallback mechanisms for offline scenarios and failed API calls.

---

## 1. AUTHENTICATION & AUTHORIZATION
**Purpose**: User session management and security  
**Components**: Auth middleware, JWT token handling  
**Portal Screens**: Login page, all authenticated screens

### Endpoints

| # | Method | Endpoint | Request | Response | Notes |
|---|--------|----------|---------|----------|-------|
| 1 | POST | `/auth/login` | `{username, password}` | `{token, user, permissions}` | Issue Bearer token, store in localStorage |
| 2 | POST | `/auth/logout` | N/A | `{success}` | Clear token from localStorage |

**Request/Response Format**:
```json
// POST /auth/login
{
  "username": "user@example.com",
  "password": "secure_password"
}

// Response
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "user-123",
    "email": "user@example.com",
    "roles": ["admin", "operator"]
  }
}
```

---

## 2. HEALTH & SYSTEM INFORMATION
**Purpose**: System status, readiness checks  
**Components**: Health check endpoints, system config  
**Portal Screens**: Dashboard, status indicators

### Endpoints

| # | Method | Endpoint | Request | Response | Notes |
|---|--------|----------|---------|----------|-------|
| 3 | GET | `/health` | N/A | `{status, timestamp}` | System health check |
| 4 | GET | `/info` | N/A | `{version, status, details}` | System information |
| 5 | GET | `/system/status` | N/A | `{uptime, version, capacity}` | Comprehensive status |
| 6 | GET | `/system/config` | N/A | `{settings, features}` | System configuration |

**Response Format**:
```json
{
  "status": "healthy",
  "timestamp": "2025-11-26T10:30:00Z",
  "services": {
    "blockchain": "operational",
    "database": "operational",
    "consensus": "operational"
  }
}
```

---

## 3. BLOCKCHAIN CORE METRICS & STATISTICS
**Purpose**: Real-time blockchain performance data  
**Components**: Stats service, metrics aggregation  
**Portal Screens**: Main Dashboard, Real-time Analytics, Performance Monitor

### Endpoints

| # | Method | Endpoint | Request | Response | Notes |
|---|--------|----------|---------|----------|-------|
| 7 | GET | `/blockchain/stats` | N/A | `{tps, blockHeight, transactions}` | Core blockchain metrics |
| 8 | GET | `/blockchain/health` | N/A | `{health%, mempool, finality}` | Blockchain health status |
| 9 | GET | `/blockchain/transactions/stats` | N/A | `{total, pending, failed, avgGas}` | Transaction statistics |
| 10 | GET | `/blockchain/blocks/stats` | N/A | `{total, avgSize, avgTime, density}` | Block statistics |

**Response Format**:
```json
{
  "tps": 776000,
  "blockHeight": 98765,
  "activeNodes": 25,
  "transactionVolume": 15234567,
  "networkStatus": "optimal",
  "finality": "250ms"
}
```

---

## 4. TRANSACTIONS
**Purpose**: Transaction queries and details  
**Components**: Transaction service, indexer  
**Portal Screens**: Transactions list, Transaction Details Viewer, Block Explorer

### Endpoints

| # | Method | Endpoint | Request | Response | Notes |
|---|--------|----------|---------|----------|-------|
| 11 | GET | `/blockchain/transactions` | `?limit=100&offset=0` | `{items[], total, hasMore}` | Paginated transaction list |
| 12 | GET | `/blockchain/transactions/{id}` | N/A | `{tx details, status, receipts}` | Single transaction details |

**Query Parameters**:
- `limit`: Number of items (default: 20, max: 100)
- `offset`: Pagination offset (default: 0)

**Response Format**:
```json
{
  "items": [
    {
      "id": "tx_abc123",
      "from": "0x1234...",
      "to": "0x5678...",
      "value": "1000000",
      "status": "confirmed",
      "blockHeight": 98765,
      "timestamp": "2025-11-26T10:30:00Z",
      "fee": "21000",
      "gasUsed": "21000"
    }
  ],
  "total": 15234567,
  "hasMore": true
}
```

---

## 5. BLOCKS & CHAIN DATA
**Purpose**: Block queries and chain exploration  
**Components**: Block service, chain explorer  
**Portal Screens**: Block Explorer, Chain Statistics

### Endpoints

| # | Method | Endpoint | Request | Response | Notes |
|---|--------|----------|---------|----------|-------|
| 13 | GET | `/blockchain/blocks` | `?limit=20&offset=0` | `{items[], total}` | Paginated block list |
| 14 | GET | `/blockchain/blocks/{height}` | N/A | `{block details}` | Block by height/hash |

**Response Format**:
```json
{
  "height": 98765,
  "hash": "0xabc123...",
  "parentHash": "0xdef456...",
  "timestamp": "2025-11-26T10:30:00Z",
  "miner": "0x1234...",
  "transactions": 250,
  "gasUsed": "15000000",
  "gasLimit": "30000000",
  "size": 65536
}
```

---

## 6. NODES & NETWORK
**Purpose**: Node information and network topology  
**Components**: Node service, peer discovery  
**Portal Screens**: Network Topology, Node Monitor, Network Health

### Endpoints

| # | Method | Endpoint | Request | Response | Notes |
|---|--------|----------|---------|----------|-------|
| 15 | GET | `/nodes` | N/A | `{nodes[]}` | List all nodes |
| 16 | GET | `/nodes/{id}` | N/A | `{node details}` | Node specific details |
| 17 | GET | `/blockchain/network/topology` | N/A | `{nodes[], edges[], summary}` | Network topology graph |
| 18 | GET | `/blockchain/network/nodes/{nodeId}` | N/A | `{node details, peers, stats}` | Detailed node info |
| 19 | GET | `/blockchain/network/latency` | `?source={id}&target={id}` | `{latency, jitter, loss}` | Latency between nodes |
| 20 | GET | `/blockchain/network/stats` | N/A | `{totalNodes, health, avgLatency}` | Network aggregate stats |

**Network Topology Response**:
```json
{
  "nodes": [
    {
      "id": "node-1",
      "type": "validator",
      "status": "active",
      "uptime": 99.8,
      "peersConnected": 24
    }
  ],
  "edges": [
    {
      "source": "node-1",
      "target": "node-2",
      "latency": 12,
      "bandwidth": 850
    }
  ],
  "summary": {
    "totalNodes": 25,
    "activeNodes": 25,
    "networkHealth": "excellent"
  }
}
```

---

## 7. CHANNELS (MULTI-CHANNEL MANAGEMENT)
**Purpose**: Channel configuration and monitoring  
**Components**: Channel service, multi-channel support  
**Portal Screens**: Channel Management, Channel Configuration

### Endpoints

| # | Method | Endpoint | Request | Response | Notes |
|---|--------|----------|---------|----------|-------|
| 21 | GET | `/channels` | N/A | `{channels[]}` | List all channels |
| 22 | GET | `/channels/{id}` | N/A | `{channel config, metrics}` | Channel details |
| 23 | POST | `/channels` | `{name, type, config}` | `{id, channel}` | Create new channel |
| 24 | PUT | `/channels/{id}/config` | `{config updates}` | `{updated channel}` | Update channel config |
| 25 | GET | `/channels/{id}/metrics` | N/A | `{tps, latency, throughput}` | Channel metrics |
| 26 | GET | `/channels/{id}/transactions` | `?limit=100&offset=0` | `{transactions[]}` | Channel transactions |

**Channel Response Format**:
```json
{
  "id": "main",
  "name": "Main Network",
  "type": "public",
  "status": "active",
  "config": {
    "consensusType": "hyperraft",
    "blockSize": 10000,
    "targetTps": 2000000
  },
  "metrics": {
    "tps": 776000,
    "blockHeight": 98765,
    "latency": 12,
    "throughput": 850000,
    "activeContracts": 42
  }
}
```

---

## 8. SMART CONTRACTS & ACTIVE CONTRACTS
**Purpose**: Contract deployment, execution, and management  
**Components**: Smart contract service, execution engine  
**Portal Screens**: Contract Manager, Contract Deployment, Contract Explorer

### Endpoints

| # | Method | Endpoint | Request | Response | Notes |
|---|--------|----------|---------|----------|-------|
| 27 | GET | `/contracts` | `?channelId=&status=` | `{contracts[]}` | List contracts |
| 28 | GET | `/contracts/{id}` | N/A | `{contract details}` | Contract by ID |
| 29 | GET | `/contracts/templates` | N/A | `{templates[]}` | Available templates |
| 30 | POST | `/contracts/deploy` | `{code, name, params}` | `{id, contract, txHash}` | Deploy contract |
| 31 | POST | `/contracts/{id}/verify` | N/A | `{verified, status}` | Verify contract |
| 32 | POST | `/contracts/{id}/audit` | `{auditData}` | `{auditReport}` | Audit contract |
| 33 | POST | `/contracts/{id}/execute` | `{function, params}` | `{result, gas}` | Execute contract function |
| 34 | GET | `/contracts/statistics` | N/A | `{total, deployed, failed}` | Contract statistics |
| 35 | GET | `/activecontracts/contracts` | N/A | `{contracts[]}` | Active contracts list |
| 36 | GET | `/activecontracts/contracts/{id}` | N/A | `{contract}` | Active contract details |
| 37 | POST | `/activecontracts/create` | `{name, code, params}` | `{contract}` | Create active contract |
| 38 | POST | `/activecontracts/{contractId}/execute/{actionId}` | `{parameters}` | `{result}` | Execute contract action |
| 39 | GET | `/activecontracts/templates` | N/A | `{templates[]}` | Available templates |
| 40 | POST | `/activecontracts/templates/{templateId}/instantiate` | `{params}` | `{contract}` | Create from template |

**Contract Deployment Request**:
```json
{
  "name": "MyContract",
  "code": "solidity_code_or_bytecode",
  "channelId": "main",
  "constructorParams": []
}

// Response
{
  "id": "contract-123",
  "address": "0x1234...",
  "txHash": "0xabc123...",
  "status": "deployed",
  "blockHeight": 98765
}
```

---

## 9. TOKENS & TOKENIZATION
**Purpose**: Token management and creation  
**Components**: Token service, token factory  
**Portal Screens**: Token Manager, Token Creation

### Endpoints

| # | Method | Endpoint | Request | Response | Notes |
|---|--------|----------|---------|----------|-------|
| 41 | GET | `/tokens` | `?type=&verified=true&limit=20` | `{tokens[]}` | List tokens |
| 42 | GET | `/tokens/{id}` | N/A | `{token details}` | Token by ID |
| 43 | GET | `/tokens/templates` | N/A | `{templates[]}` | Token templates |
| 44 | POST | `/tokens/create` | `{name, symbol, supply}` | `{token}` | Create token |
| 45 | POST | `/tokens/{id}/mint` | `{amount}` | `{txHash, balance}` | Mint tokens |
| 46 | POST | `/tokens/{id}/burn` | `{amount}` | `{txHash, balance}` | Burn tokens |
| 47 | POST | `/tokens/{id}/verify` | N/A | `{verified, status}` | Verify token |
| 48 | GET | `/tokens/statistics` | N/A | `{total, active, locked}` | Token statistics |
| 49 | GET | `/tokens/rwa` | N/A | `{tokens[]}` | RWA tokens |

---

## 10. REAL-WORLD ASSETS (RWA) TOKENIZATION
**Purpose**: Asset tokenization, fractional ownership, dividends  
**Components**: RWA service, valuation service, compliance  
**Portal Screens**: RWA Portfolio, Asset Manager, Tokenization Dashboard

### 10.1 RWA Tokenization

| # | Method | Endpoint | Request | Response | Notes |
|---|--------|----------|---------|----------|-------|
| 50 | POST | `/rwa/tokenize` | `{assetId, assetType, value}` | `{token, digitalTwin}` | Tokenize asset |
| 51 | GET | `/rwa/tokens/{tokenId}` | N/A | `{token, metadata}` | RWA token by ID |
| 52 | GET | `/rwa/tokens` | `?filter=&sort=&page=1&pageSize=20` | `{items[], total, hasMore}` | List RWA tokens |
| 53 | GET | `/rwa/tokens/owner/{address}` | N/A | `{tokens[]}` | Tokens by owner |
| 54 | GET | `/rwa/tokens/type/{assetType}` | N/A | `{tokens[]}` | Tokens by type |
| 55 | POST | `/rwa/transfer` | `{tokenId, fromAddr, toAddr, amount}` | `{txHash, success}` | Transfer token |
| 56 | POST | `/rwa/burn` | `{tokenId, ownerAddress}` | `{success}` | Burn token |
| 57 | GET | `/rwa/stats` | N/A | `{total, active, valuation}` | Tokenizer statistics |

**Tokenize Asset Request**:
```json
{
  "assetId": "ASSET-001",
  "assetType": "REAL_ESTATE",
  "assetValue": "1000000.00",
  "ownerAddress": "0x1234...",
  "metadata": {
    "name": "Downtown Office Building",
    "location": "New York"
  }
}

// Response
{
  "token": {
    "tokenId": "wAUR-ABC123",
    "assetValue": "1000000.00",
    "status": "ACTIVE"
  },
  "digitalTwin": {
    "twinId": "DT-001",
    "assetMetadata": {}
  }
}
```

### 10.2 Digital Twin Management

| # | Method | Endpoint | Request | Response | Notes |
|---|--------|----------|---------|----------|-------|
| 58 | GET | `/rwa/digitaltwin/{tokenId}` | N/A | `{twin details}` | Digital twin data |
| 59 | GET | `/rwa/digitaltwin/{twinId}/analytics` | N/A | `{analytics data}` | Twin analytics |
| 60 | POST | `/rwa/digitaltwin/{twinId}/iot` | `{sensorId, dataType, value}` | `{success}` | Add IoT data |

### 10.3 Fractional Ownership

| # | Method | Endpoint | Request | Response | Notes |
|---|--------|----------|---------|----------|-------|
| 61 | POST | `/rwa/fractional/split` | `{tokenId, numberOfShares, minPrice}` | `{shares}` | Split into fractions |
| 62 | POST | `/rwa/fractional/transfer` | `{tokenId, fromAddr, toAddr, count}` | `{success}` | Transfer shares |
| 63 | GET | `/rwa/fractional/{tokenId}/holder/{address}` | N/A | `{holder info}` | Shareholder details |
| 64 | GET | `/rwa/fractional/{tokenId}/stats` | N/A | `{ownership stats}` | Fractional stats |

### 10.4 Dividend Distribution

| # | Method | Endpoint | Request | Response | Notes |
|---|--------|----------|---------|----------|-------|
| 65 | POST | `/rwa/dividends/distribute` | `{tokenId, amount, source, type}` | `{distribution}` | Distribute dividends |
| 66 | POST | `/rwa/dividends/schedule` | `{tokenId, frequency, minAmount}` | `{schedule}` | Setup schedule |
| 67 | GET | `/rwa/dividends/{tokenId}/history` | `?fromDate=&toDate=` | `{history[]}` | Dividend history |
| 68 | GET | `/rwa/dividends/{tokenId}/projection` | `?months=12` | `{projections[]}` | Future projections |
| 69 | GET | `/rwa/dividends/pending/{address}` | N/A | `{pending[]}` | Pending dividends |

### 10.5 Compliance

| # | Method | Endpoint | Request | Response | Notes |
|---|--------|----------|---------|----------|-------|
| 70 | POST | `/rwa/compliance/validate` | `{userAddress, jurisdiction}` | `{compliant}` | Validate compliance |
| 71 | GET | `/rwa/compliance/profile/{address}` | N/A | `{profile}` | Compliance profile |
| 72 | POST | `/rwa/compliance/kyc` | FormData with documents | `{success}` | Submit KYC docs |
| 73 | GET | `/rwa/compliance/jurisdictions` | N/A | `{jurisdictions[]}` | Supported regions |

### 10.6 Asset Valuation & Oracle

| # | Method | Endpoint | Request | Response | Notes |
|---|--------|----------|---------|----------|-------|
| 74 | GET | `/rwa/valuation/{assetType}/{assetId}` | N/A | `{valuation}` | Current valuation |
| 75 | POST | `/rwa/valuation/update` | `{tokenId, newValue, source}` | `{updated}` | Update valuation |
| 76 | GET | `/rwa/oracle/price/{assetId}` | `?source=CHAINLINK` | `{price, timestamp}` | Oracle price |
| 77 | GET | `/rwa/oracle/consensus/{assetId}` | N/A | `{price, sources[]}` | Multi-source price |
| 78 | GET | `/rwa/oracle/history/{assetId}` | `?source=&limit=24` | `{prices[]}` | Price history |
| 79 | GET | `/rwa/oracle/health` | N/A | `{health by source}` | Oracle health status |

### 10.7 RWA Portfolio

| # | Method | Endpoint | Request | Response | Notes |
|---|--------|----------|---------|----------|-------|
| 80 | GET | `/rwa/portfolio/{address}` | N/A | `{portfolio}` | Portfolio details |
| 81 | GET | `/rwa/portfolio/{address}/summary` | N/A | `{summary stats}` | Portfolio summary |
| 82 | GET | `/rwa/portfolio/{address}/performance` | `?period=month` | `{performance}` | Portfolio performance |

**RWA Portfolio Response**:
```json
{
  "ownerAddress": "0x1234...",
  "totalValue": "5000000.00",
  "tokens": [
    {
      "tokenId": "wAUR-ABC123",
      "assetType": "REAL_ESTATE",
      "assetValue": "1000000.00",
      "status": "ACTIVE"
    }
  ],
  "totalDividendsReceived": "50000.00",
  "assetDistribution": {
    "REAL_ESTATE": 3,
    "COMMODITIES": 1
  }
}
```

---

## 11. VALIDATORS & STAKING
**Purpose**: Validator management and staking rewards  
**Components**: Validator service, staking engine  
**Portal Screens**: Staking Dashboard, Validator Performance

### Endpoints

| # | Method | Endpoint | Request | Response | Notes |
|---|--------|----------|---------|----------|-------|
| 83 | GET | `/blockchain/validators` | `?status=&limit=100` | `{validators[]}` | List validators |
| 84 | GET | `/blockchain/validators/{address}` | N/A | `{validator details}` | Validator by address |
| 85 | GET | `/staking/info` | N/A | `{staking details}` | Staking information |
| 86 | POST | `/staking/validators/{address}/claim-rewards` | N/A | `{success, rewards}` | Claim rewards |
| 87 | GET | `/validators/{id}/metrics` | N/A | `{performance metrics}` | Validator metrics |
| 88 | GET | `/validators/slashing` | N/A | `{slashing events}` | Slashing history |

**Validator Response**:
```json
{
  "address": "0x1234...",
  "status": "active",
  "staked": "1000000.00",
  "rewards": "50000.00",
  "uptime": 99.8,
  "commissionRate": 5.0
}
```

---

## 12. ANALYTICS & PERFORMANCE
**Purpose**: Historical data, trends, performance analysis  
**Components**: Analytics service, data aggregation  
**Portal Screens**: Analytics Dashboard, Real-time Analytics, Performance Monitor

### Endpoints

| # | Method | Endpoint | Request | Response | Notes |
|---|--------|----------|---------|----------|-------|
| 89 | GET | `/analytics/{period}` | N/A | `{metrics by period}` | Analytics by time period |
| 90 | GET | `/analytics/network-usage` | N/A | `{usage data}` | Network usage stats |
| 91 | GET | `/analytics/validator-earnings` | N/A | `{earnings data}` | Validator earnings |
| 92 | GET | `/performance` | N/A | `{perf metrics}` | System performance |
| 93 | GET | `/analytics/performance` | N/A | `{analytics perf}` | Analytics performance |
| 94 | GET | `/ai/metrics` | N/A | `{ai metrics}` | AI optimization metrics |
| 95 | GET | `/ai/predictions` | N/A | `{predictions}` | AI predictions |
| 96 | GET | `/ai/performance` | N/A | `{optimization %, efficiency}` | ML performance |
| 97 | GET | `/ai/confidence` | N/A | `{confidence scores}` | Prediction confidence |

**Analytics Period Response**:
```json
{
  "period": "24h",
  "metrics": {
    "totalTransactions": 15234567,
    "averageTps": 776000,
    "peakTps": 890000,
    "avgBlockTime": "1.2s",
    "totalFees": "1500.00"
  }
}
```

---

## 13. GOVERNANCE & PROPOSALS
**Purpose**: On-chain governance mechanisms  
**Components**: Governance service  
**Portal Screens**: Governance Dashboard

### Endpoints

| # | Method | Endpoint | Request | Response | Notes |
|---|--------|----------|---------|----------|-------|
| 98 | GET | `/governance/proposals` | `?status=&limit=20` | `{proposals[]}` | List proposals |
| 99 | POST | `/governance/proposals/{id}/vote` | `{vote: yes/no/abstain}` | `{success}` | Vote on proposal |

---

## 14. CONSENSUS & BRIDGE
**Purpose**: Consensus state and cross-chain bridge monitoring  
**Components**: Consensus service, bridge service  
**Portal Screens**: Bridge Monitor, Consensus State

### Endpoints

| # | Method | Endpoint | Request | Response | Notes |
|---|--------|----------|---------|----------|-------|
| 100 | GET | `/blockchain/network/health` | N/A | `{health details}` | Network health |
| 101 | GET | `/consensus/state` | N/A | `{consensus details}` | Consensus state |
| 102 | GET | `/bridge/statistics` | N/A | `{bridge stats}` | Bridge statistics |
| 103 | GET | `/bridge/health` | N/A | `{bridge health}` | Bridge health |
| 104 | GET | `/bridge/transfers` | `?limit=100&offset=0` | `{transfers[]}` | Bridge transfers |

---

## 15. ENTERPRISE & SECURITY
**Purpose**: Enterprise settings, audit logging, security  
**Components**: Enterprise service, audit logger  
**Portal Screens**: Settings, Audit Log, Security Panel

### Endpoints

| # | Method | Endpoint | Request | Response | Notes |
|---|--------|----------|---------|----------|-------|
| 105 | GET | `/enterprise/settings` | N/A | `{settings}` | Enterprise config |
| 106 | PUT | `/enterprise/settings` | `{settings}` | `{updated}` | Update settings |
| 107 | GET | `/security/audit-log` | `?limit=100&offset=0&severity=` | `{logs[]}` | Audit logs |
| 108 | GET | `/security/metrics` | N/A | `{security metrics}` | Security metrics |

---

## 16. RWA ADVANCED FEATURES
**Purpose**: RWA distribution, portfolio, valuation  
**Components**: RWA advanced service  
**Portal Screens**: RWA Dashboard

### Endpoints

| # | Method | Endpoint | Request | Response | Notes |
|---|--------|----------|---------|----------|-------|
| 109 | GET | `/rwa/portfolio` | `?userId=` | `{portfolio}` | RWA portfolio |
| 110 | GET | `/rwa/tokenization` | N/A | `{stats}` | Tokenization stats |
| 111 | GET | `/rwa/fractionalization` | N/A | `{fractionalization data}` | Fractionalization info |
| 112 | GET | `/rwa/distribution` | N/A | `{distribution data}` | Distribution info |
| 113 | GET | `/rwa/valuation` | N/A | `{valuation data}` | Valuation info |
| 114 | GET | `/rwa/pools` | N/A | `{pools[]}` | RWA pools |

---

## 17. GAS & CARBON TRACKING
**Purpose**: Gas fee analysis and carbon metrics  
**Components**: Gas analyzer, carbon tracker  
**Portal Screens**: Gas Fee Analyzer, Carbon Dashboard

### Endpoints

| # | Method | Endpoint | Request | Response | Notes |
|---|--------|----------|---------|----------|-------|
| 115 | GET | `/gas/trends` | `?period=1h/24h/7d` | `{trends}` | Gas trends |
| 116 | GET | `/gas/history` | `?limit=100&offset=0` | `{history[]}` | Historical gas data |
| 117 | GET | `/carbon/metrics` | N/A | `{carbon data}` | Carbon footprint metrics |
| 118 | GET | `/carbon/report` | `?startDate=&endDate=` | `{report}` | Carbon report |

---

## 18. MERKLE TREE REGISTRY
**Purpose**: RWA Merkle tree verification  
**Components**: Merkle registry service  
**Portal Screens**: Merkle Verification, Registry Integrity

### Endpoints

| # | Method | Endpoint | Request | Response | Notes |
|---|--------|----------|---------|----------|-------|
| 119 | GET | `/registry/rwat/merkle/root` | N/A | `{root hash}` | Merkle root |
| 120 | GET | `/registry/rwat/{rwatId}/merkle/proof` | N/A | `{proof}` | Merkle proof |
| 121 | POST | `/registry/rwat/merkle/verify` | `{proof data}` | `{verified}` | Verify proof |
| 122 | GET | `/registry/rwat/merkle/stats` | N/A | `{tree stats}` | Tree statistics |

---

## 19. DEMOS (DEVELOPMENT/TESTING)
**Purpose**: Demo environment management  
**Components**: Demo service  
**Portal Screens**: Demo Dashboard, Demo Registration

### Endpoints

| # | Method | Endpoint | Request | Response | Notes |
|---|--------|----------|---------|----------|-------|
| 123 | GET | `/demos` | `?limit=20&offset=0` | `{demos[]}` | List demos |
| 124 | GET | `/demos/{id}` | N/A | `{demo}` | Demo by ID |
| 125 | POST | `/demos` | `{demo config}` | `{demo}` | Create demo |
| 126 | POST | `/demos/{id}/start` | N/A | `{started}` | Start demo |
| 127 | POST | `/demos/{id}/stop` | N/A | `{stopped}` | Stop demo |
| 128 | POST | `/demos/{id}/extend` | `?minutes=30&isAdmin=true` | `{extended}` | Extend demo |
| 129 | POST | `/demos/{id}/transactions` | `?count=100&merkleRoot=` | `{updated}` | Add transactions |
| 130 | DELETE | `/demos/{id}` | N/A | `{deleted}` | Delete demo |
| 131 | GET | `/demos/active` | N/A | `{active demos}` | Active demos |

---

## 20. ORACLE & API INTEGRATION
**Purpose**: External API and oracle management  
**Components**: API integration service, oracle service  
**Portal Screens**: Oracle Management, API Integration

### Endpoints

| # | Method | Endpoint | Request | Response | Notes |
|---|--------|----------|---------|----------|-------|
| 132 | GET | `/rwa/oracle/sources` | N/A | `{sources[]}` | Oracle sources |
| 133 | POST | `/enterprise/api-keys` | `{key data}` | `{key}` | Create API key |
| 134 | POST | `/enterprise/api-keys/{id}/rotate` | N/A | `{new key}` | Rotate key |
| 135 | DELETE | `/enterprise/api-keys/{id}` | N/A | `{deleted}` | Revoke key |
| 136 | GET | `/enterprise/api-keys/{id}/rotation-logs` | N/A | `{logs[]}` | Rotation history |
| 137 | POST | `/enterprise/external-apis` | `{config}` | `{api}` | Create API config |
| 138 | PUT | `/enterprise/external-apis/{id}` | `{updates}` | `{updated}` | Update config |
| 139 | POST | `/enterprise/external-apis/{id}/test` | N/A | `{success, message}` | Test connection |
| 140 | POST | `/enterprise/contract-mappings` | `{mapping}` | `{mapping}` | Create mapping |
| 141 | POST | `/enterprise/contract-mappings/{id}/execute` | N/A | `{result}` | Execute mapping |
| 142 | GET | `/enterprise/contract-mappings/{id}/executions` | N/A | `{executions[]}` | Execution history |
| 143 | POST | `/enterprise/contract-bindings` | `{binding}` | `{binding}` | Create binding |

---

## 21. LIVE DATA STREAMING
**Purpose**: Real-time data updates via WebSocket  
**Components**: WebSocket service, live feed manager  
**Portal Screens**: All real-time dashboards

### WebSocket Endpoints

| # | Protocol | Endpoint | Message Type | Payload | Notes |
|---|----------|----------|--------------|---------|-------|
| 144 | WS | `/api/v11/live/stream` | Subscribe | `{type: "subscribe", channels: []}` | Main live stream |
| 145 | WS | `/api/v11/ws/network/topology` | Network updates | `{nodes, edges, summary}` | Network topology updates |

**WebSocket Message Format**:
```json
{
  "type": "metrics_update",
  "payload": {
    "tps": 776000,
    "blockHeight": 98765,
    "timestamp": "2025-11-26T10:30:00Z"
  }
}
```

---

## 22. SECURITY & QUANTUM READINESS
**Purpose**: Quantum-resistant crypto status  
**Components**: Crypto service  
**Portal Screens**: Security Status Panel

### Endpoints

| # | Method | Endpoint | Request | Response | Notes |
|---|--------|----------|---------|----------|-------|
| 146 | GET | `/crypto/status` | N/A | `{crypto status}` | Cryptography status |
| 147 | GET | `/security/quantum-readiness` | N/A | `{quantum ready %}` | Quantum readiness |

---

## 23. MISCELLANEOUS
**Purpose**: Various utility endpoints  
**Components**: Misc services  
**Portal Screens**: Various

### Endpoints

| # | Method | Endpoint | Request | Response | Notes |
|---|--------|----------|---------|----------|-------|
| 148 | GET | `/advanced/features` | N/A | `{features}` | Advanced features |
| 149 | GET | `/config/status` | N/A | `{status}` | Config status |
| 150 | GET | `/mobile/status` | N/A | `{status}` | Mobile API status |
| 151 | GET | `/mobile/metrics` | N/A | `{metrics}` | Mobile metrics |

---

## API INTEGRATION PATTERNS

### 1. Authentication Header
All requests must include Bearer token:
```
Authorization: Bearer {token}
X-API-Key: {apiKey} (optional)
```

### 2. Error Responses
```json
{
  "error": "Error message",
  "status": 400,
  "details": {
    "field": "Specific field error"
  }
}
```

### 3. Pagination
```json
{
  "items": [],
  "total": 1000,
  "page": 1,
  "pageSize": 20,
  "hasMore": true
}
```

### 4. Rate Limiting Headers
```
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 999
X-RateLimit-Reset: 1732610400
```

---

## COMPONENT TO API MAPPING

| Component | APIs Used | Purpose |
|-----------|-----------|---------|
| **Dashboard** | `/blockchain/stats`, `/performance`, `/analytics/` | Real-time metrics |
| **Transaction Viewer** | `/blockchain/transactions`, `/blockchain/transactions/{id}` | Transaction queries |
| **Block Explorer** | `/blockchain/blocks`, `/blockchain/blocks/{height}` | Block queries |
| **Network Topology** | `/blockchain/network/topology`, `/blockchain/network/nodes/{id}` | Network visualization |
| **Channel Management** | `/channels`, `/channels/{id}`, `/channels/{id}/metrics` | Channel config |
| **Contract Manager** | `/contracts`, `/activecontracts`, `/contracts/deploy` | Smart contract management |
| **RWA Portfolio** | `/rwa/portfolio`, `/rwa/tokens`, `/rwa/fractional` | Asset management |
| **Staking Dashboard** | `/blockchain/validators`, `/staking/info` | Validator info |
| **Analytics** | `/analytics/`, `/ai/metrics`, `/analytics/performance` | Historical analysis |
| **Merkle Registry** | `/registry/rwat/merkle/*` | Proof verification |
| **Gas Analyzer** | `/gas/trends`, `/gas/history` | Gas fee analysis |
| **Governance** | `/governance/proposals`, `/governance/proposals/{id}/vote` | Voting |
| **Oracle Management** | `/rwa/oracle/*`, `/enterprise/api-keys`, `/enterprise/external-apis` | Oracle integration |

---

## CRITICAL IMPLEMENTATION NOTES

### 1. Graceful Fallback Mechanism
The portal implements fallback strategies when backend is unavailable:
- Demo Service: Creates demos locally when `/demos` endpoint returns 500/404
- Channel Service: Uses local simulation mode when WebSocket unavailable
- All services: Return mock data with console warnings

### 2. Authentication Flow
```
1. User submits credentials to POST /auth/login
2. Backend returns JWT token
3. Frontend stores token in localStorage under "auth_token"
4. All subsequent requests include Authorization header
5. Failed 401 responses redirect to /login and clear token
```

### 3. Retry Logic
- Exponential backoff with max 3 retries
- Initial delay: 1 second, max delay: 10 seconds
- Backoff factor: 2
- Don't retry on 4xx errors (except 429)

### 4. Response Handling
- All 2xx responses are successful
- 401: Clear auth and redirect to login
- 403: Access forbidden
- 404: Resource not found
- 429: Rate limited (includes retry-after header)
- 5xx: Server error, retry with backoff

### 5. WebSocket Support
- URL: `wss://dlt.aurigraph.io/api/v11/live/stream` (production)
- URL: `ws://localhost:9003/api/v11/live/stream` (development)
- Auto-reconnect with exponential backoff (max 5 attempts)
- Message format: `{type, payload}`

---

## API ENDPOINT SUMMARY BY CATEGORY

| Category | Count | Key Endpoints |
|----------|-------|--------------|
| Authentication | 2 | /auth/login, /auth/logout |
| Health/System | 4 | /health, /info, /system/status |
| Blockchain Core | 4 | /blockchain/stats, /blockchain/health |
| Transactions | 2 | /blockchain/transactions, /blockchain/transactions/{id} |
| Blocks | 2 | /blockchain/blocks, /blockchain/blocks/{height} |
| Nodes/Network | 6 | /nodes, /blockchain/network/topology |
| Channels | 6 | /channels, /channels/{id} |
| Contracts | 14 | /contracts/*, /activecontracts/* |
| Tokens | 9 | /tokens/*, /tokens/rwa |
| RWA Core | 8 | /rwa/tokenize, /rwa/tokens |
| RWA Advanced | 47 | /rwa/*, /registry/rwat/* |
| Validators/Staking | 6 | /blockchain/validators, /staking/* |
| Analytics | 9 | /analytics/*, /performance, /ai/* |
| Governance | 2 | /governance/proposals |
| Consensus/Bridge | 5 | /consensus/state, /bridge/* |
| Enterprise/Security | 4 | /enterprise/settings, /security/* |
| Gas/Carbon | 4 | /gas/*, /carbon/* |
| Demos | 8 | /demos/* |
| Oracle/API Integration | 12 | /rwa/oracle/*, /enterprise/* |
| Live Streaming | 2 | WebSocket endpoints |
| Security/Crypto | 2 | /crypto/status, /security/quantum-readiness |
| Miscellaneous | 4 | /advanced/*, /config/*, /mobile/* |
| **TOTAL** | **~180** | |

---

## FRONTEND TO BACKEND CALL FLOW

### Example: RWA Portfolio Load
```
1. User navigates to /rwa/portfolio
2. React component mounts
3. Redux thunk dispatches fetchPortfolio("0x1234...")
4. RWAService.getPortfolio() calls apiClient.get("/rwa/portfolio/0x1234...")
5. Axios interceptor adds Authorization header + X-API-Key
6. Backend responds with portfolio data
7. Redux action updates state
8. Component re-renders with new data
9. Real-time updates via WebSocket for price changes
```

---

## MISSING/TODO BACKEND ENDPOINTS

Based on portal code analysis, these endpoints need implementation:

1. `/audit/trail` - Audit trail retrieval (referenced in AuditLogViewer)
2. `/tokens/ricardian` - Ricardian contract queries
3. `/demo/analytics` - Demo-specific analytics
4. `/marketplace/assets` - Asset marketplace (if planned)
5. `/notifications/subscribe` - Notification subscriptions
6. `/performance/profile` - Detailed performance profiling

---

## CONCLUSION

The Enterprise Portal requires **180+ API endpoints** across 23 functional areas. All endpoints must support:
- Bearer token authentication
- JSON request/response format
- Proper error handling with meaningful messages
- Rate limiting headers
- CORS headers for cross-origin requests
- WebSocket support for real-time updates

The backend Java/Quarkus service should implement these endpoints with proper:
- Database persistence
- Caching mechanisms
- Error handling and logging
- Rate limiting
- Input validation
- Authorization checks

All endpoints must follow REST conventions and return consistent JSON structures with proper HTTP status codes.

