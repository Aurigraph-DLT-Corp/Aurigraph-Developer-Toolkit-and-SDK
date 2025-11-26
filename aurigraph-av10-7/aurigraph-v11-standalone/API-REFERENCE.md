# Aurigraph V12 API Reference

## Overview

The Aurigraph V12 platform provides comprehensive REST and gRPC APIs for blockchain operations, consensus management, quantum-resistant cryptography, cross-chain bridging, and real-world asset tokenization.

**Base URL (Production)**: `https://dlt.aurigraph.io/api/v11`
**Base URL (Development)**: `http://localhost:9004/api/v11`

**API Version**: 12.0.0
**Last Updated**: November 25, 2025

## Table of Contents

1. [Authentication](#authentication)
2. [Core Transaction API](#core-transaction-api)
3. [Blockchain API](#blockchain-api)
4. [Consensus API](#consensus-api)
5. [Oracle Verification API](#oracle-verification-api)
6. [Analytics API](#analytics-api)
7. [Bridge API](#bridge-api)
8. [Token Management API](#token-management-api)
9. [RWA (Real-World Assets) API](#rwa-api)
10. [Governance API](#governance-api)
11. [User & Authentication API](#user-authentication-api)
12. [WebSocket Streaming API](#websocket-streaming-api)
13. [Rate Limiting](#rate-limiting)
14. [Error Codes](#error-codes)

---

## Authentication

All API requests require authentication via JWT tokens obtained from the authentication endpoint.

### Authenticate User

**POST** `/api/v11/login/authenticate`

Authenticate a user and receive a JWT token for subsequent API calls.

**Request Body:**
```json
{
  "username": "user@example.com",
  "password": "your-secure-password"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Login successful",
  "sessionId": "550e8400-e29b-41d4-a716-446655440000",
  "accessToken": "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...",
  "expiresIn": 86400,
  "user": {
    "userId": "123",
    "email": "user@example.com",
    "role": "USER"
  }
}
```

**Headers for Authenticated Requests:**
```
Authorization: Bearer <access_token>
Content-Type: application/json
```

**Rate Limit**: 10 requests/minute per IP

---

## Core Transaction API

### Submit Single Transaction

**POST** `/api/v11/transactions/submit`

Submit a single transaction to the blockchain.

**Request Body:**
```json
{
  "tx_hash": "0x123abc...",
  "from": "0xabc123...",
  "to": "0xdef456...",
  "amount": "100.50",
  "gas_price": "20",
  "nonce": 1,
  "data": ""
}
```

**Response (200 OK):**
```json
{
  "tx_hash": "0x123abc...",
  "status": "QUEUED",
  "timestamp": "2025-11-25T10:30:00Z",
  "block_height": null,
  "confirmations": 0
}
```

**Transaction Status Values:**
- `QUEUED` - Transaction queued in mempool
- `PENDING` - Transaction processing started
- `CONFIRMED` - Transaction confirmed in block
- `FINALIZED` - Transaction finalized (irreversible)
- `FAILED` - Transaction failed validation or execution

### Get Transaction Status

**GET** `/api/v11/transactions/{hash}/status`

Retrieve the current status of a transaction by its hash.

**Path Parameters:**
- `hash` (string, required) - Transaction hash

**Response (200 OK):**
```json
{
  "tx_hash": "0x123abc...",
  "status": "CONFIRMED",
  "block_hash": "0xblock789...",
  "block_height": 12345,
  "confirmations": 15,
  "timestamp": "2025-11-25T10:30:00Z",
  "from": "0xabc123...",
  "to": "0xdef456...",
  "amount": "100.50",
  "gas_used": "21000"
}
```

### Get Transaction Receipt

**GET** `/api/v11/transactions/{hash}/receipt`

Get detailed receipt for a confirmed transaction.

**Response (200 OK):**
```json
{
  "transaction_hash": "0x123abc...",
  "block_hash": "0xblock789...",
  "block_height": 12345,
  "gas_used": 21000,
  "status": "CONFIRMED",
  "logs": [
    {
      "contract_address": "0xcontract...",
      "topics": ["0xtopic1", "0xtopic2"],
      "data": "0xdata...",
      "log_index": 0
    }
  ],
  "execution_time": "2025-11-25T10:30:05Z"
}
```

### Batch Submit Transactions

**POST** `/api/v11/transactions/batch`

Submit multiple transactions in a single request for optimal throughput.

**Request Body:**
```json
{
  "transactions": [
    {
      "tx_hash": "0x123...",
      "from": "0xabc...",
      "to": "0xdef...",
      "amount": "100.50"
    },
    {
      "tx_hash": "0x456...",
      "from": "0xghi...",
      "to": "0xjkl...",
      "amount": "200.75"
    }
  ]
}
```

**Response (200 OK):**
```json
{
  "acceptedCount": 2,
  "rejectedCount": 0,
  "batchId": "batch-550e8400",
  "durationMs": 45.2,
  "responses": [
    {
      "tx_hash": "0x123...",
      "status": "QUEUED"
    },
    {
      "tx_hash": "0x456...",
      "status": "QUEUED"
    }
  ]
}
```

### Estimate Gas Cost

**POST** `/api/v11/transactions/estimate-gas`

Estimate gas cost for a transaction before submission.

**Request Body:**
```json
{
  "fromAddress": "0xabc123...",
  "toAddress": "0xdef456...",
  "data": "0x",
  "amount": "100.0"
}
```

**Response (200 OK):**
```json
{
  "estimated_gas": 21000,
  "gas_price_wei": 20000000000,
  "total_cost": "0.00042 ETH",
  "buffer_percent": 10.0,
  "recommendation": "Sufficient gas for transfer",
  "timestamp": "2025-11-25T10:30:00Z"
}
```

### Get Pending Transactions

**GET** `/api/v11/transactions/pending?limit=100`

Retrieve pending transactions from the mempool.

**Query Parameters:**
- `limit` (integer, optional) - Maximum transactions to return (default: 100, max: 1000)

**Response (200 OK):**
```json
{
  "transactions": [
    {
      "tx_hash": "0x123...",
      "from": "0xabc...",
      "to": "0xdef...",
      "amount": "100.50",
      "gas_price": "20",
      "status": "PENDING"
    }
  ],
  "total_pending": 523,
  "average_gas_price": 25000000000
}
```

### Get Transaction Pool Statistics

**GET** `/api/v11/transactions/pool/stats`

Get mempool statistics and metrics.

**Response (200 OK):**
```json
{
  "total_pending": 523,
  "total_queued": 157,
  "average_gas_price": 25000000000,
  "min_gas_price": 10000000000,
  "max_gas_price": 50000000000,
  "total_pool_size_bytes": 2097152,
  "pool_utilization_percent": 42.5,
  "timestamp": "2025-11-25T10:30:00Z"
}
```

---

## Blockchain API

### Get Latest Block

**GET** `/api/v11/blockchain/latest`

Retrieve the most recent block on the chain.

**Response (200 OK):**
```json
{
  "block_hash": "0xblock789...",
  "block_height": 12345,
  "parent_hash": "0xblock788...",
  "state_root": "0xstate...",
  "transaction_root": "0xtxroot...",
  "transaction_count": 150,
  "validator_count": 5,
  "created_at": "2025-11-25T10:30:00Z",
  "finalized_at": "2025-11-25T10:30:02Z",
  "status": "FINALIZED",
  "processing_time_ms": 125,
  "gas_used": 3150000
}
```

### Get Block by ID

**GET** `/api/v11/blockchain/block/{id}`

Retrieve a specific block by block number or hash.

**Path Parameters:**
- `id` (string/number, required) - Block height (number) or block hash (0x...)

**Query Parameters:**
- `includeTransactions` (boolean, optional) - Include full transaction data (default: false)

**Response (200 OK):**
```json
{
  "block_hash": "0xblock789...",
  "block_height": 12345,
  "parent_hash": "0xblock788...",
  "transaction_hashes": [
    "0xtx1...",
    "0xtx2...",
    "0xtx3..."
  ],
  "validator_signatures": [
    "0xsig1...",
    "0xsig2..."
  ],
  "created_at": "2025-11-25T10:30:00Z",
  "status": "FINALIZED"
}
```

### Get Blockchain Statistics

**GET** `/api/v11/blockchain/stats`

Get comprehensive blockchain metrics and health indicators.

**Query Parameters:**
- `timeWindowMinutes` (integer, optional) - Time window for metrics (0 = all time, default: 60)

**Response (200 OK):**
```json
{
  "total_blocks": 12345,
  "total_transactions": 1523456,
  "average_block_time_ms": 125.5,
  "average_transaction_size_bytes": 512,
  "transactions_per_second": 2500000,
  "peak_tps": 3500000,
  "average_tps": 2100000,
  "active_validators": 5,
  "sync_status_percent": 100,
  "healthy_nodes": 10,
  "pending_transactions": 523,
  "confirmed_transactions": 1522933,
  "failed_transactions": 123,
  "network_health_status": "HEALTHY",
  "average_block_size_bytes": 76800,
  "measurement_start": "2025-11-25T09:30:00Z",
  "measurement_end": "2025-11-25T10:30:00Z"
}
```

### Get Transaction List

**GET** `/api/v11/blockchain/transactions?page=1&limit=50`

Retrieve paginated list of transactions.

**Query Parameters:**
- `page` (integer, optional) - Page number (default: 1)
- `limit` (integer, optional) - Items per page (default: 50, max: 100)
- `status` (string, optional) - Filter by status (QUEUED, PENDING, CONFIRMED, FINALIZED, FAILED)
- `address` (string, optional) - Filter by sender/receiver address

**Response (200 OK):**
```json
{
  "transactions": [
    {
      "tx_hash": "0x123...",
      "from": "0xabc...",
      "to": "0xdef...",
      "amount": "100.50",
      "status": "CONFIRMED",
      "block_height": 12345,
      "timestamp": "2025-11-25T10:30:00Z"
    }
  ],
  "pagination": {
    "current_page": 1,
    "total_pages": 30447,
    "total_items": 1523456,
    "items_per_page": 50
  }
}
```

### Get Node List

**GET** `/api/v11/nodes`

Retrieve list of active nodes in the network.

**Response (200 OK):**
```json
{
  "nodes": [
    {
      "node_id": "aurigraph-v11-xeon15-node-1",
      "type": "VALIDATOR",
      "status": "ACTIVE",
      "address": "192.168.1.101:9004",
      "version": "12.0.0",
      "uptime_seconds": 86400,
      "total_transactions": 523456,
      "peer_count": 9,
      "sync_progress": 100
    },
    {
      "node_id": "aurigraph-v11-xeon15-node-2",
      "type": "VALIDATOR",
      "status": "ACTIVE",
      "address": "192.168.1.102:9004",
      "version": "12.0.0",
      "uptime_seconds": 86400,
      "total_transactions": 498234,
      "peer_count": 9,
      "sync_progress": 100
    }
  ],
  "total_nodes": 10,
  "active_validators": 5,
  "healthy_nodes": 10
}
```

---

## Consensus API

### Get Consensus Status

**GET** `/api/v11/consensus/status`

Retrieve current consensus state and metrics.

**Response (200 OK):**
```json
{
  "node_state": "LEADER",
  "current_term": 1234,
  "commit_index": 12345,
  "last_applied": 12345,
  "votes_received": 3,
  "total_votes_needed": 3,
  "leader_node_id": "aurigraph-v11-xeon15-node-1",
  "average_consensus_latency_ms": 45.2,
  "consensus_rounds_completed": 12345,
  "success_rate": 0.9985,
  "algorithm": "HyperRAFT++",
  "timestamp": "2025-11-25T10:30:00Z"
}
```

### Get Consensus Metrics

**GET** `/api/v11/consensus/metrics`

Get detailed consensus performance metrics.

**Response (200 OK):**
```json
{
  "throughput_tps": 2500000,
  "latency_p50_ms": 35.2,
  "latency_p95_ms": 75.5,
  "latency_p99_ms": 125.0,
  "batch_size_average": 175000,
  "parallel_threads": 896,
  "pipeline_depth": 45,
  "election_timeouts": 2,
  "leader_changes": 1,
  "failed_rounds": 15,
  "total_rounds": 12345,
  "success_rate": 0.9988,
  "ml_optimization_enabled": true,
  "ml_scoring_accuracy": 0.92,
  "timestamp": "2025-11-25T10:30:00Z"
}
```

---

## Oracle Verification API

### Verify Asset Value

**POST** `/api/v11/oracle/verify`

Verify an asset value using multi-oracle consensus.

**Request Body:**
```json
{
  "assetId": "ASSET-001",
  "claimedValue": "1250.00"
}
```

**Response (200 OK):**
```json
{
  "verification_id": "550e8400-e29b-41d4-a716-446655440000",
  "asset_id": "ASSET-001",
  "claimed_value": 1250.00,
  "verified_value": 1248.50,
  "consensus_reached": true,
  "consensus_percentage": 0.67,
  "oracle_responses": [
    {
      "oracle_name": "Chainlink",
      "price": 1250.00,
      "confidence": 0.95,
      "timestamp": "2025-11-25T10:30:00Z"
    },
    {
      "oracle_name": "Pyth",
      "price": 1247.00,
      "confidence": 0.92,
      "timestamp": "2025-11-25T10:30:01Z"
    }
  ],
  "verification_status": "VERIFIED",
  "timestamp": "2025-11-25T10:30:02Z"
}
```

**Verification Status Values:**
- `VERIFIED` - Value verified within tolerance
- `FAILED` - Verification failed (consensus not reached)
- `INSUFFICIENT_ORACLES` - Not enough oracles responded
- `TIMEOUT` - Verification timeout exceeded

### Get Verification Result

**GET** `/api/v11/oracle/verify/{verificationId}`

Retrieve a previous verification result by ID.

**Path Parameters:**
- `verificationId` (string, required) - Verification UUID

**Response (200 OK):**
```json
{
  "verification_id": "550e8400-e29b-41d4-a716-446655440000",
  "asset_id": "ASSET-001",
  "verified_value": 1248.50,
  "consensus_reached": true,
  "verification_status": "VERIFIED",
  "timestamp": "2025-11-25T10:30:02Z"
}
```

### Get Verification History

**GET** `/api/v11/oracle/history/{assetId}?limit=10`

Get verification history for a specific asset.

**Path Parameters:**
- `assetId` (string, required) - Asset identifier

**Query Parameters:**
- `limit` (integer, optional) - Maximum results (1-100, default: 10)

**Response (200 OK):**
```json
{
  "asset_id": "ASSET-001",
  "verification_history": [
    {
      "verification_id": "550e8400...",
      "verified_value": 1248.50,
      "consensus_reached": true,
      "timestamp": "2025-11-25T10:30:02Z"
    },
    {
      "verification_id": "660e9411...",
      "verified_value": 1252.00,
      "consensus_reached": true,
      "timestamp": "2025-11-25T09:30:05Z"
    }
  ],
  "total_verifications": 523
}
```

### Oracle Health Check

**GET** `/api/v11/oracle/health`

Check oracle service health and availability.

**Response (200 OK):**
```json
{
  "status": "HEALTHY",
  "message": "Oracle verification service is operational",
  "active_oracles": 3,
  "average_response_time_ms": 125.5,
  "success_rate": 0.9985
}
```

---

## Analytics API

### Get Analytics Dashboard

**GET** `/api/v11/analytics/dashboard`

Retrieve comprehensive analytics for the dashboard.

**Response (200 OK):**
```json
{
  "totalTransactions": 1523456,
  "avgTPS": 2100000,
  "peakTPS": 3500000,
  "currentTPS": 2500000,
  "blockHeight": 12345,
  "activeValidators": 5,
  "networkHealth": "HEALTHY",
  "tpsOverTime": [
    {"timestamp": "2025-11-25T09:00:00Z", "tps": 2000000},
    {"timestamp": "2025-11-25T09:15:00Z", "tps": 2200000},
    {"timestamp": "2025-11-25T09:30:00Z", "tps": 2400000}
  ],
  "transactionBreakdown": {
    "TRANSFER": 1200000,
    "CONTRACT_CALL": 250000,
    "TOKEN_MINT": 50000,
    "NFT_TRANSFER": 23456
  },
  "topValidators": [
    {
      "validatorId": "node-1",
      "blocksProduced": 5432,
      "uptime": 99.98,
      "performance": "EXCELLENT"
    }
  ],
  "timestamp": "2025-11-25T10:30:00Z"
}
```

### Get Performance Metrics

**GET** `/api/v11/analytics/performance`

Get real-time system performance metrics.

**Response (200 OK):**
```json
{
  "memoryUsageMB": 1536,
  "memoryTotalMB": 4096,
  "memoryFreeMB": 2560,
  "cpuUtilization": 45.2,
  "diskIOReadMBps": 125.5,
  "diskIOWriteMBps": 85.2,
  "networkIORxMBps": 250.0,
  "networkIOTxMBps": 180.0,
  "responseTimeP50Ms": 35.2,
  "responseTimeP95Ms": 75.5,
  "responseTimeP99Ms": 125.0,
  "currentThroughputTPS": 2500000,
  "errorRate": 0.0015,
  "uptimeSeconds": 86400,
  "timestamp": "2025-11-25T10:30:00Z"
}
```

---

## Bridge API

### Get Supported Chains

**GET** `/api/v11/bridge/supported-chains`

List all supported blockchain networks for cross-chain transfers.

**Response (200 OK):**
```json
{
  "totalChains": 6,
  "chains": [
    {
      "chainId": "1",
      "name": "Ethereum Mainnet",
      "network": "mainnet",
      "active": true,
      "blockHeight": 18500000,
      "bridgeContract": "0xbridge123..."
    },
    {
      "chainId": "137",
      "name": "Polygon (Matic)",
      "network": "mainnet",
      "active": true,
      "blockHeight": 50000000,
      "bridgeContract": "0xbridge456..."
    }
  ],
  "bridgeVersion": "12.0.0",
  "timestamp": "2025-11-25T10:30:00Z"
}
```

### Initiate Bridge Transfer

**POST** `/api/v11/bridge/transfer`

Initiate a cross-chain asset transfer.

**Request Body:**
```json
{
  "sourceChain": "ethereum",
  "targetChain": "polygon",
  "sourceAddress": "0xsource...",
  "targetAddress": "0xtarget...",
  "amount": "100.0",
  "tokenAddress": "0xtoken..."
}
```

**Response (200 OK):**
```json
{
  "transferId": "550e8400-e29b-41d4-a716-446655440000",
  "status": "INITIATED",
  "sourceChain": "ethereum",
  "targetChain": "polygon",
  "amount": "100.0",
  "estimatedCompletionTime": "2025-11-25T10:35:00Z",
  "bridgeFee": "0.25",
  "timestamp": "2025-11-25T10:30:00Z"
}
```

### Get Bridge Transfer Status

**GET** `/api/v11/bridge/transfer/{transferId}`

Check the status of a cross-chain transfer.

**Path Parameters:**
- `transferId` (string, required) - Transfer UUID

**Response (200 OK):**
```json
{
  "transferId": "550e8400-e29b-41d4-a716-446655440000",
  "status": "COMPLETED",
  "sourceChain": "ethereum",
  "targetChain": "polygon",
  "sourceTxHash": "0xsourcetx...",
  "targetTxHash": "0xtargettx...",
  "amount": "100.0",
  "completedAt": "2025-11-25T10:34:52Z"
}
```

**Transfer Status Values:**
- `INITIATED` - Transfer initiated on source chain
- `LOCKED` - Assets locked on source chain
- `MINTING` - Minting assets on target chain
- `COMPLETED` - Transfer completed successfully
- `FAILED` - Transfer failed (with reason)
- `REFUNDED` - Transfer failed and refunded

---

## Token Management API

### Create Token

**POST** `/api/v11/tokens/create`

Create a new token on the blockchain.

**Request Body:**
```json
{
  "name": "My Token",
  "symbol": "MTK",
  "decimals": 18,
  "totalSupply": "1000000",
  "owner": "0xowner..."
}
```

**Response (201 Created):**
```json
{
  "tokenId": "550e8400-e29b-41d4-a716-446655440000",
  "name": "My Token",
  "symbol": "MTK",
  "decimals": 18,
  "totalSupply": "1000000",
  "contractAddress": "0xtoken...",
  "status": "DEPLOYED",
  "createdAt": "2025-11-25T10:30:00Z"
}
```

### List Tokens

**GET** `/api/v11/tokens/list?page=1&limit=50`

Get paginated list of all tokens.

**Query Parameters:**
- `page` (integer, optional) - Page number (default: 1)
- `limit` (integer, optional) - Items per page (default: 50, max: 100)

**Response (200 OK):**
```json
{
  "tokens": [
    {
      "tokenId": "550e8400...",
      "name": "My Token",
      "symbol": "MTK",
      "totalSupply": "1000000",
      "holderCount": 523,
      "status": "ACTIVE"
    }
  ],
  "pagination": {
    "current_page": 1,
    "total_pages": 42,
    "total_items": 2089
  }
}
```

### Get Token Details

**GET** `/api/v11/tokens/{id}`

Get detailed information about a specific token.

**Path Parameters:**
- `id` (string, required) - Token ID or contract address

**Response (200 OK):**
```json
{
  "tokenId": "550e8400-e29b-41d4-a716-446655440000",
  "name": "My Token",
  "symbol": "MTK",
  "decimals": 18,
  "totalSupply": "1000000",
  "circulatingSupply": "750000",
  "contractAddress": "0xtoken...",
  "owner": "0xowner...",
  "holderCount": 523,
  "transferCount": 15234,
  "status": "ACTIVE",
  "createdAt": "2025-11-25T10:30:00Z"
}
```

### Transfer Tokens

**POST** `/api/v11/tokens/transfer`

Transfer tokens from one address to another.

**Request Body:**
```json
{
  "tokenId": "550e8400-e29b-41d4-a716-446655440000",
  "from": "0xfrom...",
  "to": "0xto...",
  "amount": "100.0"
}
```

**Response (200 OK):**
```json
{
  "txHash": "0xtransfer...",
  "status": "QUEUED",
  "from": "0xfrom...",
  "to": "0xto...",
  "amount": "100.0",
  "timestamp": "2025-11-25T10:30:00Z"
}
```

---

## RWA API

### Get RWA Status

**GET** `/api/v11/rwa/status`

Get Real-World Asset tokenization module status.

**Response (200 OK):**
```json
{
  "enabled": true,
  "totalAssetsTokenized": 1234,
  "totalValueLocked": "5250000 USD",
  "activeAssetTypes": 6,
  "supportedAssetCategories": [
    "Real Estate",
    "Commodities",
    "Art & Collectibles",
    "Carbon Credits",
    "Bonds",
    "Equities"
  ],
  "complianceLevel": "HIGH",
  "status": "RWA Module Active",
  "timestamp": "2025-11-25T10:30:00Z"
}
```

### Tokenize Asset

**POST** `/api/v11/rwa/tokenize`

Tokenize a real-world asset on the blockchain.

**Request Body:**
```json
{
  "assetType": "REAL_ESTATE",
  "assetName": "Downtown Office Building",
  "assetValue": 5000000.00,
  "legalDocuments": ["0xdoc1...", "0xdoc2..."],
  "verificationRequired": true,
  "custodian": "Custodian Corp",
  "jurisdiction": "US-NY"
}
```

**Response (201 Created):**
```json
{
  "assetId": "ASSET-001",
  "tokenId": "550e8400-e29b-41d4-a716-446655440000",
  "assetType": "REAL_ESTATE",
  "assetValue": 5000000.00,
  "tokenizedShares": 5000,
  "pricePerShare": 1000.00,
  "status": "TOKENIZED",
  "verificationStatus": "PENDING_VERIFICATION",
  "contractAddress": "0xrwatoken...",
  "createdAt": "2025-11-25T10:30:00Z"
}
```

---

## Governance API

### List Proposals

**GET** `/api/v11/governance/proposals?status=ACTIVE`

Get list of governance proposals.

**Query Parameters:**
- `status` (string, optional) - Filter by status (DRAFT, ACTIVE, PASSED, REJECTED, EXECUTED)

**Response (200 OK):**
```json
{
  "proposals": [
    {
      "proposalId": "PROP-001",
      "title": "Increase Block Size to 200KB",
      "description": "Proposal to increase maximum block size...",
      "proposer": "0xproposer...",
      "status": "ACTIVE",
      "votesFor": 1500,
      "votesAgainst": 300,
      "votingEndsAt": "2025-12-01T00:00:00Z",
      "createdAt": "2025-11-20T10:00:00Z"
    }
  ],
  "totalProposals": 42
}
```

### Create Proposal

**POST** `/api/v11/governance/proposals`

Submit a new governance proposal.

**Request Body:**
```json
{
  "title": "Increase Block Size to 200KB",
  "description": "This proposal aims to increase the maximum block size from 150KB to 200KB to accommodate higher transaction throughput...",
  "proposer": "0xproposer...",
  "votingPeriodDays": 7,
  "executionDelay": 2
}
```

**Response (201 Created):**
```json
{
  "proposalId": "PROP-042",
  "title": "Increase Block Size to 200KB",
  "status": "ACTIVE",
  "votingEndsAt": "2025-12-02T10:30:00Z",
  "createdAt": "2025-11-25T10:30:00Z"
}
```

### Vote on Proposal

**POST** `/api/v11/governance/proposals/{id}/vote`

Cast a vote on a governance proposal.

**Path Parameters:**
- `id` (string, required) - Proposal ID

**Request Body:**
```json
{
  "voter": "0xvoter...",
  "vote": "FOR",
  "votingPower": 100
}
```

**Vote Values:**
- `FOR` - Vote in favor
- `AGAINST` - Vote against
- `ABSTAIN` - Abstain from voting

**Response (200 OK):**
```json
{
  "proposalId": "PROP-042",
  "voter": "0xvoter...",
  "vote": "FOR",
  "votingPower": 100,
  "timestamp": "2025-11-25T10:30:00Z"
}
```

---

## User & Authentication API

### Register User

**POST** `/api/v11/mobile/register`

Register a new user account.

**Request Body:**
```json
{
  "username": "johndoe",
  "email": "john@example.com",
  "password": "secure-password-123",
  "phoneNumber": "+1234567890"
}
```

**Response (201 Created):**
```json
{
  "userId": "550e8400-e29b-41d4-a716-446655440000",
  "username": "johndoe",
  "email": "john@example.com",
  "status": "ACTIVE",
  "createdAt": "2025-11-25T10:30:00Z"
}
```

### Get User Profile

**GET** `/api/v11/mobile/users/{userId}`

Retrieve user profile information.

**Path Parameters:**
- `userId` (string, required) - User ID

**Response (200 OK):**
```json
{
  "userId": "550e8400-e29b-41d4-a716-446655440000",
  "username": "johndoe",
  "email": "john@example.com",
  "phoneNumber": "+1234567890",
  "role": "USER",
  "kycStatus": "VERIFIED",
  "accountStatus": "ACTIVE",
  "createdAt": "2025-11-25T10:30:00Z",
  "lastLoginAt": "2025-11-25T09:15:00Z"
}
```

---

## WebSocket Streaming API

Real-time streaming endpoints for live data updates.

### Connect to WebSocket

**WebSocket URL**: `wss://dlt.aurigraph.io/ws/{endpoint}`

**Available Endpoints:**
- `/ws/metrics` - Real-time system metrics
- `/ws/transactions` - Live transaction stream
- `/ws/validators` - Validator status updates
- `/ws/consensus` - Consensus state changes
- `/ws/network` - Network topology changes

### Example: Metrics Stream

**Connection URL**: `wss://dlt.aurigraph.io/ws/metrics`

**Message Format (Server → Client):**
```json
{
  "type": "METRICS_UPDATE",
  "timestamp": "2025-11-25T10:30:00Z",
  "data": {
    "currentTPS": 2500000,
    "memoryUsageMB": 1536,
    "cpuUtilization": 45.2,
    "activeConnections": 523
  }
}
```

### Example: Transaction Stream

**Connection URL**: `wss://dlt.aurigraph.io/ws/transactions`

**Subscribe Message (Client → Server):**
```json
{
  "action": "SUBSCRIBE",
  "filters": {
    "address": "0xabc123...",
    "status": ["CONFIRMED", "FINALIZED"]
  }
}
```

**Transaction Event (Server → Client):**
```json
{
  "type": "TRANSACTION_EVENT",
  "timestamp": "2025-11-25T10:30:01Z",
  "data": {
    "tx_hash": "0x123abc...",
    "status": "CONFIRMED",
    "from": "0xabc123...",
    "to": "0xdef456...",
    "amount": "100.50",
    "block_height": 12345
  }
}
```

**Commands:**
- `SUBSCRIBE` - Subscribe to event stream
- `UNSUBSCRIBE` - Unsubscribe from stream
- `PING` - Keep-alive ping
- `PONG` - Response to server ping

---

## Rate Limiting

All API endpoints are rate-limited to ensure fair usage and prevent abuse.

### Rate Limits by Endpoint Type

| Endpoint Category | Rate Limit | Window |
|-------------------|------------|--------|
| Authentication | 10 req/min | Per IP |
| Transaction Submission | 100 req/min | Per API Key |
| Transaction Queries | 1000 req/min | Per API Key |
| Analytics & Stats | 100 req/min | Per API Key |
| WebSocket Connections | 10 connections | Per IP |

### Rate Limit Headers

All responses include rate limit information:

```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 87
X-RateLimit-Reset: 1700000000
```

### Rate Limit Exceeded (429 Too Many Requests)

```json
{
  "error": "RATE_LIMIT_EXCEEDED",
  "message": "Rate limit exceeded. Try again in 45 seconds.",
  "retryAfter": 45
}
```

---

## Error Codes

### HTTP Status Codes

| Status Code | Description |
|-------------|-------------|
| 200 | Success |
| 201 | Created |
| 400 | Bad Request (invalid parameters) |
| 401 | Unauthorized (invalid/missing token) |
| 403 | Forbidden (insufficient permissions) |
| 404 | Not Found |
| 409 | Conflict (duplicate resource) |
| 429 | Too Many Requests (rate limit exceeded) |
| 500 | Internal Server Error |
| 503 | Service Unavailable |
| 504 | Gateway Timeout |

### Error Response Format

```json
{
  "error": "ERROR_CODE",
  "message": "Human-readable error description",
  "timestamp": "2025-11-25T10:30:00Z",
  "path": "/api/v11/transactions/submit",
  "details": {
    "field": "amount",
    "issue": "Amount must be greater than 0"
  }
}
```

### Common Error Codes

| Error Code | Description |
|------------|-------------|
| `INVALID_REQUEST` | Request validation failed |
| `AUTHENTICATION_FAILED` | Invalid credentials |
| `UNAUTHORIZED` | Missing or invalid authentication token |
| `INSUFFICIENT_PERMISSIONS` | User lacks required permissions |
| `RESOURCE_NOT_FOUND` | Requested resource does not exist |
| `DUPLICATE_RESOURCE` | Resource already exists |
| `RATE_LIMIT_EXCEEDED` | Too many requests |
| `VALIDATION_ERROR` | Input validation failed |
| `TRANSACTION_FAILED` | Transaction execution failed |
| `CONSENSUS_TIMEOUT` | Consensus not reached within timeout |
| `ORACLE_UNAVAILABLE` | Oracle service unavailable |
| `INSUFFICIENT_FUNDS` | Insufficient balance for transaction |
| `INVALID_SIGNATURE` | Cryptographic signature validation failed |
| `INTERNAL_ERROR` | Internal server error |

---

## Pagination

All list endpoints support pagination with consistent parameters:

**Query Parameters:**
- `page` (integer, optional) - Page number (default: 1)
- `limit` (integer, optional) - Items per page (default: 50, max: 100)
- `sort` (string, optional) - Sort field (default: timestamp)
- `order` (string, optional) - Sort order (`asc` or `desc`, default: `desc`)

**Pagination Response:**
```json
{
  "data": [...],
  "pagination": {
    "current_page": 1,
    "total_pages": 42,
    "total_items": 2089,
    "items_per_page": 50,
    "has_next": true,
    "has_prev": false
  }
}
```

---

## Versioning

The API uses URL-based versioning. The current version is `v11` (V12 platform).

**Version Format**: `/api/v{version}/{endpoint}`

**Current Version**: `/api/v11/`

Older versions will be maintained for 12 months after a new version release.

---

## Support

For API support and questions:
- **Documentation**: https://docs.aurigraph.io
- **Status Page**: https://status.aurigraph.io
- **Support Email**: api-support@aurigraph.io
- **GitHub Issues**: https://github.com/Aurigraph-DLT-Corp/Aurigraph-DLT/issues

---

**Last Updated**: November 25, 2025
**API Version**: 12.0.0
**Document Version**: 1.0.0
