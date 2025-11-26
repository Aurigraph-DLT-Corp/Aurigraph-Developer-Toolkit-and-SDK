# Aurigraph V11 API Documentation

**Version**: 11.0.0
**Last Updated**: October 20, 2025
**Status**: Production-Ready

---

## Table of Contents

1. [Overview](#overview)
2. [Authentication](#authentication)
3. [Rate Limiting](#rate-limiting)
4. [API Endpoints](#api-endpoints)
   - [Core Platform](#core-platform)
   - [Blockchain](#blockchain)
   - [Consensus](#consensus)
   - [AI/ML](#aiml)
   - [Cryptography](#cryptography)
   - [Cross-Chain Bridge](#cross-chain-bridge)
   - [Real-World Assets](#real-world-assets)
   - [Security](#security)
   - [Smart Contracts](#smart-contracts)
5. [Response Formats](#response-formats)
6. [Error Handling](#error-handling)
7. [Code Examples](#code-examples)
8. [OpenAPI Specification](#openapi-specification)

---

## Overview

The Aurigraph V11 API provides programmatic access to a high-performance blockchain platform built on Java/Quarkus/GraalVM. The platform is designed to achieve 2M+ TPS with quantum-resistant cryptography and AI-driven optimization.

### Key Features

- **High Performance**: 2M+ TPS target with <100ms finality
- **Quantum-Resistant**: CRYSTALS-Dilithium/Kyber (NIST Level 5)
- **AI-Optimized**: Machine learning-driven consensus and performance tuning
- **Cross-Chain**: Interoperability with Ethereum, Solana, and other chains
- **Enterprise-Grade**: Real-world asset tokenization and compliance

### Base URLs

- **Production**: `https://dlt.aurigraph.io`
- **Development**: `http://localhost:9003`

All API endpoints use the `/api/v11` prefix.

---

## Authentication

Most endpoints are publicly accessible. Authenticated endpoints require a JWT Bearer token:

```http
Authorization: Bearer <your-jwt-token>
```

### Obtaining a Token

```bash
# Request token (authentication endpoint)
curl -X POST https://dlt.aurigraph.io/api/v11/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username": "your-username", "password": "your-password"}'
```

### Authenticated Endpoints

The following endpoints require authentication:
- `/api/v11/security/audit/logs` - Security audit logs
- `/api/v11/contracts` (POST) - Deploy smart contracts
- `/api/v11/admin/*` - Administrative operations

---

## Rate Limiting

Rate limits are enforced per IP address:

| Endpoint Category | Rate Limit | Window |
|------------------|------------|--------|
| Public API | 100 requests/second | 1 minute |
| Admin API | 10 requests/second | 1 minute |
| Auth API | 5 requests/minute | 1 minute |
| Performance Tests | 60 requests/minute | 1 minute |

### Rate Limit Headers

```http
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1729468800
```

### Rate Limit Exceeded Response

```json
{
  "error": "Rate limit exceeded",
  "message": "You have exceeded the rate limit of 100 requests per minute",
  "code": 429,
  "timestamp": 1729468745123,
  "retryAfter": 15
}
```

---

## API Endpoints

### Core Platform

#### Health Check

**Endpoint**: `GET /api/v11/health`
**Description**: Get platform health status and uptime metrics
**Authentication**: None
**Rate Limit**: 100/min

**Response** (200 OK):
```json
{
  "status": "HEALTHY",
  "version": "11.0.0-standalone",
  "uptimeSeconds": 3456789,
  "totalRequests": 125678543,
  "platform": "Java/Quarkus/GraalVM"
}
```

**Example**:
```bash
curl https://dlt.aurigraph.io/api/v11/health
```

---

#### System Information

**Endpoint**: `GET /api/v11/info`
**Description**: Get detailed system information
**Authentication**: None
**Rate Limit**: 100/min

**Response** (200 OK):
```json
{
  "name": "Aurigraph V11 Java Nexus",
  "version": "11.0.0",
  "javaVersion": "Java 21.0.1",
  "framework": "Quarkus Native Ready",
  "osName": "Linux",
  "osArch": "amd64"
}
```

---

#### Performance Test

**Endpoint**: `GET /api/v11/performance`
**Description**: Run performance benchmark test
**Authentication**: None
**Rate Limit**: 60/min (special limit for compute-intensive operations)

**Query Parameters**:
- `iterations` (integer, default: 100000, max: 500000) - Number of transactions
- `threads` (integer, default: 1, max: 64) - Parallel threads

**Response** (200 OK):
```json
{
  "iterations": 100000,
  "durationMs": 54.32,
  "transactionsPerSecond": 1840000.0,
  "nsPerTransaction": 543.2,
  "optimizations": "Java/Quarkus + Virtual Threads",
  "threadCount": 8,
  "targetTPS": 2000000,
  "targetAchieved": false
}
```

**Example**:
```bash
curl "https://dlt.aurigraph.io/api/v11/performance?iterations=50000&threads=4"
```

---

#### Transaction Statistics

**Endpoint**: `GET /api/v11/stats`
**Description**: Get current transaction processing statistics
**Authentication**: None

**Response** (200 OK):
```json
{
  "totalTransactions": 125678543210,
  "processedTransactions": 125678543200,
  "failedTransactions": 10,
  "currentThroughputMeasurement": 1850000.0,
  "adaptiveBatchSizeMultiplier": 1.5,
  "throughputEfficiency": 0.925
}
```

---

#### Comprehensive System Status

**Endpoint**: `GET /api/v11/system/status`
**Description**: Get comprehensive system status for all V11 services
**Authentication**: None

**Response** (200 OK):
```json
{
  "platformName": "Aurigraph V11 Platform",
  "version": "11.0.0",
  "uptimeMs": 86400000,
  "healthy": true,
  "transactionStats": {
    "totalTransactions": 125678543210,
    "processedTransactions": 125678543200,
    "currentThroughputMeasurement": 1850000.0
  },
  "consensusStatus": {
    "algorithm": "HyperRAFT++",
    "nodeState": "LEADER",
    "currentTerm": 12345,
    "consensusHealth": "OPTIMAL"
  },
  "cryptoStatus": {
    "enabled": true,
    "algorithm": "CRYSTALS-Dilithium",
    "securityLevel": 5
  },
  "bridgeStats": {
    "totalTransfers": 456789,
    "successfulTransfers": 456780,
    "activeChains": 5
  },
  "timestamp": 1729468745123
}
```

---

### Blockchain

#### Process Transaction

**Endpoint**: `POST /api/v11/blockchain/transactions`
**Description**: Submit a transaction for processing
**Authentication**: None
**Content-Type**: application/json

**Request Body**:
```json
{
  "transactionId": "tx_12345",
  "amount": 100.50
}
```

**Response** (201 Created):
```json
{
  "transactionId": "tx_12345",
  "status": "PROCESSED",
  "amount": 100.50,
  "timestamp": 1729468745123,
  "message": "Transaction processed successfully"
}
```

**Error Response** (400 Bad Request):
```json
{
  "error": "Invalid transaction data",
  "message": "Transaction ID is required",
  "code": 400,
  "timestamp": 1729468745123
}
```

**Example**:
```bash
curl -X POST https://dlt.aurigraph.io/api/v11/blockchain/transactions \
  -H "Content-Type: application/json" \
  -d '{"transactionId": "tx_12345", "amount": 100.50}'
```

---

#### Get Transactions

**Endpoint**: `GET /api/v11/blockchain/transactions`
**Description**: Retrieve list of recent transactions
**Authentication**: None

**Query Parameters**:
- `limit` (integer, default: 10, max: 100) - Maximum number of transactions
- `offset` (integer, default: 0) - Pagination offset

**Response** (200 OK):
```json
{
  "transactions": [
    {
      "hash": "0x7ab3f4e2tx1",
      "from": "0xsender1a2b3c4d",
      "to": "0xreceiver5e6f7g8h",
      "value": "100.50",
      "fee": "0.001",
      "status": "CONFIRMED",
      "timestamp": 1729468745123,
      "blockHeight": 1450789,
      "nonce": 1001,
      "gasUsed": 21100
    }
  ],
  "total": 125678000,
  "limit": 10,
  "offset": 0
}
```

**Example**:
```bash
curl "https://dlt.aurigraph.io/api/v11/blockchain/transactions?limit=20&offset=0"
```

---

#### Process Batch Transactions

**Endpoint**: `POST /api/v11/blockchain/transactions/batch`
**Description**: Submit multiple transactions for batch processing
**Authentication**: None
**Content-Type**: application/json

**Request Body**:
```json
{
  "transactions": [
    {"transactionId": "tx_1", "amount": 100.0},
    {"transactionId": "tx_2", "amount": 200.0},
    {"transactionId": "tx_3", "amount": 300.0}
  ]
}
```

**Response** (200 OK):
```json
{
  "requestedCount": 3,
  "processedCount": 3,
  "durationMs": 1.5,
  "transactionsPerSecond": 2000.0,
  "status": "COMPLETED",
  "timestamp": 1729468745123
}
```

**Example**:
```bash
curl -X POST https://dlt.aurigraph.io/api/v11/blockchain/transactions/batch \
  -H "Content-Type: application/json" \
  -d '{"transactions": [{"transactionId": "tx_1", "amount": 100.0}]}'
```

---

#### Get Blocks

**Endpoint**: `GET /api/v11/blockchain/blocks`
**Description**: Retrieve list of recent blocks
**Authentication**: None

**Query Parameters**:
- `limit` (integer, default: 10, max: 100)
- `offset` (integer, default: 0)

**Response** (200 OK):
```json
{
  "blocks": [
    {
      "height": 1450789,
      "hash": "0x7ab3f4e2block1",
      "timestamp": 1729468745123,
      "transactions": 1523,
      "validator": "validator_0",
      "size": 258432,
      "gasUsed": 8125000
    }
  ],
  "total": 1450789,
  "limit": 10,
  "offset": 0
}
```

---

#### Get Block by Height

**Endpoint**: `GET /api/v11/blockchain/blocks/{height}`
**Description**: Retrieve block details by block height
**Authentication**: None

**Path Parameters**:
- `height` (integer) - Block height number

**Response** (200 OK):
```json
{
  "height": 1450789,
  "hash": "0x7ab3f4e2block1",
  "parentHash": "0x6ab2e3d1parent",
  "timestamp": 1729468745123,
  "transactions": 1523,
  "validator": "validator_0",
  "size": 258432,
  "gasUsed": 8125000,
  "gasLimit": 15000000,
  "difficulty": "12345678",
  "totalDifficulty": "987654321000",
  "stateRoot": "0x8cd5g6h3state",
  "transactionsRoot": "0x9de7i8j4txroot",
  "receiptsRoot": "0x0ef9k1l5receipts"
}
```

**Example**:
```bash
curl https://dlt.aurigraph.io/api/v11/blockchain/blocks/1450789
```

---

#### Get Latest Block

**Endpoint**: `GET /api/v11/blockchain/latest`
**Description**: Retrieve the most recent block in the blockchain
**Authentication**: None

**Response** (200 OK):
```json
{
  "height": 1450789,
  "hash": "0x7ab3f4e2latest",
  "parentHash": "0x6ab2e3d1parent",
  "timestamp": 1729468745123,
  "transactions": 1523,
  "validator": "validator_0",
  "size": 258432,
  "gasUsed": 8125000,
  "gasLimit": 15000000
}
```

---

#### Get Blockchain Statistics

**Endpoint**: `GET /api/v11/blockchain/stats`
**Description**: Retrieve comprehensive blockchain metrics and statistics
**Authentication**: None

**Response** (200 OK):
```json
{
  "currentHeight": 1450789,
  "totalBlocks": 1450789,
  "totalTransactions": 125678543,
  "averageBlockTime": 2.05,
  "transactionStats": {
    "last24h": 156234789,
    "lastHour": 6509783,
    "lastMinute": 108496,
    "currentTPS": 1808267,
    "peakTPS": 2156789,
    "averageTPS": 1450234
  },
  "validatorStats": {
    "total": 127,
    "active": 121,
    "standby": 6,
    "totalStake": "25000000 AUR",
    "stakingRatio": 68.5
  },
  "performance": {
    "averageLatency": 42.3,
    "p50Latency": 38.5,
    "p95Latency": 95.2,
    "p99Latency": 145.7,
    "finalizationTime": 485
  },
  "networkHealth": {
    "status": "HEALTHY",
    "uptime": 99.97,
    "peers": 145,
    "activePeers": 132,
    "consensusHealth": "OPTIMAL"
  },
  "advancedFeatures": {
    "quantumResistant": true,
    "quantumAlgorithm": "CRYSTALS-Dilithium",
    "aiOptimizationEnabled": true,
    "mlConsensusOptimization": true
  },
  "timestamp": 1729468745123,
  "apiVersion": "11.0.0"
}
```

---

#### Get Validators

**Endpoint**: `GET /api/v11/blockchain/validators`
**Description**: Retrieve list of active validators
**Authentication**: None

**Response** (200 OK):
```json
{
  "validators": [
    {
      "address": "0xValidator7ab3f4e2",
      "name": "Validator Node 0",
      "stake": "1000000 AUR",
      "commission": "5.0%",
      "uptime": "98.0%",
      "blocksProduced": 45000,
      "status": "ACTIVE",
      "votingPower": 50000
    }
  ],
  "totalValidators": 20,
  "activeValidators": 15,
  "totalStake": "25000000 AUR"
}
```

---

#### Get Network Statistics

**Endpoint**: `GET /api/v11/blockchain/network/stats`
**Description**: Retrieve comprehensive network health and performance metrics
**Authentication**: None

**Response** (200 OK):
```json
{
  "totalNodes": 127,
  "activeValidators": 121,
  "currentTPS": 1850000,
  "peakTPS": 2156789,
  "averageBlockTime": 2.05,
  "networkLatency": 42.3,
  "networkStatus": "HEALTHY",
  "timestamp": 1729468745123
}
```

---

### Consensus

#### Get Consensus Status

**Endpoint**: `GET /api/v11/consensus/status`
**Description**: Returns HyperRAFT++ consensus algorithm status
**Authentication**: None

**Response** (200 OK):
```json
{
  "algorithm": "HyperRAFT++",
  "nodeState": "LEADER",
  "currentTerm": 12345,
  "commitIndex": 1450789,
  "lastApplied": 1450789,
  "leaderNode": "node-validator-01",
  "consensusHealth": "OPTIMAL"
}
```

---

#### Get Consensus Metrics

**Endpoint**: `GET /api/v11/consensus/metrics`
**Description**: Retrieve detailed HyperRAFT++ consensus performance metrics
**Authentication**: None

**Response** (200 OK):
```json
{
  "algorithm": "HyperRAFT++",
  "version": "11.0.0",
  "status": "ACTIVE",
  "throughput": {
    "currentProposalsPerSecond": 1850000,
    "peakProposalsPerSecond": 2156789,
    "totalProposalsProcessed": 125678543210
  },
  "latency": {
    "averageConsensusLatency": 42.3,
    "p50ConsensusLatency": 38.5,
    "p95ConsensusLatency": 95.2,
    "p99ConsensusLatency": 145.7
  },
  "voting": {
    "totalVotesCast": 45678234567,
    "quorumSuccessRate": 99.87,
    "votingRounds": 125678543
  },
  "leader": {
    "currentLeader": "node-validator-01",
    "leaderUptime": 99.95,
    "leaderElections": 23
  },
  "cluster": {
    "totalNodes": 127,
    "activeNodes": 121,
    "quorumSize": 85,
    "networkPartitions": 0
  },
  "aiOptimization": {
    "enabled": true,
    "mlModelVersion": "v2.4.1",
    "predictionAccuracy": 94.5,
    "optimizationGain": 18.3
  },
  "timestamp": 1729468745123
}
```

---

#### Get Consensus Nodes

**Endpoint**: `GET /api/v11/consensus/nodes`
**Description**: Retrieve real-time HyperRAFT++ consensus node information
**Authentication**: None

**Response** (200 OK):
```json
{
  "nodes": [
    {
      "nodeId": "node-validator-01",
      "role": "LEADER",
      "status": "ACTIVE",
      "currentTerm": 12345,
      "commitIndex": 1450789,
      "lastApplied": 1450789,
      "throughput": 1850000,
      "lastSeen": 1729468745123
    }
  ],
  "totalNodes": 127,
  "leaderNode": "node-validator-01",
  "consensusHealth": "OPTIMAL",
  "timestamp": 1729468745123
}
```

---

### AI/ML

#### Get AI System Status

**Endpoint**: `GET /api/v11/ai/status`
**Description**: Get comprehensive AI/ML system status
**Authentication**: None

**Response** (200 OK):
```json
{
  "systemStatus": "OPERATIONAL",
  "aiEnabled": true,
  "mlOptimizationEnabled": true,
  "version": "11.0.0",
  "totalModels": 5,
  "activeModels": 4,
  "modelsInTraining": 0,
  "averageModelAccuracy": 95.7,
  "performanceImpact": {
    "consensusLatencyReduction": 23.5,
    "throughputIncrease": 18.2,
    "energyEfficiencyGain": 12.5,
    "predictionAccuracy": 95.8,
    "anomalyDetectionRate": 99.2
  },
  "resourceUsage": {
    "cpuUtilization": 45.3,
    "memoryUtilization": 62.8,
    "gpuUtilization": 78.5,
    "inferenceLatency": 2.5
  },
  "healthIndicators": {
    "modelHealth": "EXCELLENT",
    "dataQuality": "HIGH",
    "inferenceSpeed": "OPTIMAL",
    "systemStability": "STABLE"
  },
  "timestamp": 1729468745123
}
```

---

#### List AI Models

**Endpoint**: `GET /api/v11/ai/models`
**Description**: Get list of all AI/ML models in the system
**Authentication**: None

**Response** (200 OK):
```json
{
  "totalModels": 5,
  "activeModels": 4,
  "models": [
    {
      "modelId": "consensus-optimizer-v3",
      "name": "HyperRAFT++ Consensus Optimizer",
      "type": "CONSENSUS_OPTIMIZATION",
      "status": "ACTIVE",
      "accuracy": 98.5,
      "version": "3.0.1",
      "lastTrainedAt": "2025-10-20T19:00:00Z",
      "trainingEpochs": 1000,
      "description": "ML model optimizing consensus latency and throughput"
    },
    {
      "modelId": "tx-predictor-v2",
      "name": "Transaction Volume Predictor",
      "type": "PREDICTION",
      "status": "ACTIVE",
      "accuracy": 95.8,
      "version": "2.5.0",
      "description": "Predicts transaction volume and network congestion"
    }
  ],
  "timestamp": 1729468745123
}
```

---

#### Get Model Details

**Endpoint**: `GET /api/v11/ai/models/{id}`
**Description**: Get detailed information about a specific AI model
**Authentication**: None

**Path Parameters**:
- `id` (string) - Model identifier

**Response** (200 OK):
```json
{
  "modelId": "consensus-optimizer-v3",
  "name": "HyperRAFT++ Consensus Optimizer",
  "type": "CONSENSUS_OPTIMIZATION",
  "status": "ACTIVE",
  "accuracy": 98.5,
  "version": "3.0.1",
  "lastTrainedAt": "2025-10-20T19:00:00Z",
  "nextTrainingAt": "2025-10-21T19:00:00Z",
  "trainingEpochs": 1000,
  "trainingDataSize": 1250000,
  "description": "ML model optimizing consensus latency and throughput",
  "performance": {
    "latencyReduction": 23.5,
    "throughputImprovement": 18.2,
    "energySavings": 12.5,
    "predictionAccuracy": 98.5,
    "falsePositiveRate": 0.8,
    "falseNegativeRate": 0.7
  },
  "trainingInfo": {
    "algorithm": "Deep Neural Network",
    "framework": "DeepLearning4J",
    "layers": 8,
    "neurons": 512,
    "learningRate": 0.001,
    "batchSize": 64,
    "lastTrainingDuration": 3600
  },
  "timestamp": 1729468745123
}
```

---

#### Retrain Model

**Endpoint**: `POST /api/v11/ai/models/{id}/retrain`
**Description**: Initiate retraining of an AI model
**Authentication**: Optional (recommended for production)
**Content-Type**: application/json

**Path Parameters**:
- `id` (string) - Model identifier

**Request Body**:
```json
{
  "epochs": 1000,
  "trainingDataSource": "historical_data"
}
```

**Response** (202 Accepted):
```json
{
  "status": "RETRAINING_INITIATED",
  "modelId": "consensus-optimizer-v3",
  "jobId": "retrain-job-abc123",
  "estimatedDuration": "3600 seconds",
  "estimatedCompletion": "2025-10-20T22:00:00Z",
  "epochs": 1000,
  "message": "Model retraining has been initiated. Check job status for progress.",
  "timestamp": 1729468745123
}
```

---

#### Get AI Predictions

**Endpoint**: `GET /api/v11/ai/predictions`
**Description**: Get current AI predictions for network behavior
**Authentication**: None

**Response** (200 OK):
```json
{
  "nextBlock": {
    "predictedBlockTime": "2025-10-20T21:02:00Z",
    "predictedTransactionCount": 1850,
    "predictedBlockSize": 256000,
    "predictedGasUsed": 8500000,
    "confidence": 94.5
  },
  "networkForecast": {
    "predictedTPS": 1850000,
    "predictedCongestion": "LOW",
    "predictedGasPrice": 1.2,
    "predictedLatency": 42.5,
    "confidence": 92.3,
    "forecastWindow": "1 hour"
  },
  "anomalyDetection": {
    "anomalyScore": 0.05,
    "riskLevel": "LOW",
    "suspiciousTransactions": 2,
    "confidence": 99.2
  },
  "consensusForecast": {
    "predictedConsensusLatency": 44.8,
    "predictedFinalizationTime": 490,
    "predictedParticipation": 98.8,
    "confidence": 96.5
  },
  "timestamp": 1729468745123
}
```

---

### Cryptography

#### Get Cryptography Status

**Endpoint**: `GET /api/v11/crypto/status`
**Description**: Returns quantum-resistant cryptography status
**Authentication**: None

**Response** (200 OK):
```json
{
  "enabled": true,
  "algorithm": "CRYSTALS-Dilithium",
  "securityLevel": 5,
  "operationsPerSecond": 125000,
  "quantumResistant": true,
  "nisStandard": "NIST Level 5"
}
```

---

#### Get Cryptography Metrics

**Endpoint**: `GET /api/v11/crypto/metrics`
**Description**: Retrieve detailed quantum cryptography performance metrics
**Authentication**: None

**Response** (200 OK):
```json
{
  "enabled": true,
  "algorithm": "CRYSTALS-Dilithium",
  "securityLevel": 5,
  "operationsPerSecond": 125000,
  "encryptionCount": 45678234567,
  "decryptionCount": 45678234560,
  "signatureCount": 125678543210,
  "verificationCount": 125678543205,
  "averageEncryptionTime": 0.8,
  "averageDecryptionTime": 1.2,
  "averageSignatureTime": 1.5,
  "averageVerificationTime": 0.9,
  "implementation": "BouncyCastle PQC",
  "timestamp": 1729468745123
}
```

---

### Cross-Chain Bridge

#### Get Supported Chains

**Endpoint**: `GET /api/v11/bridge/supported-chains`
**Description**: Retrieve list of supported blockchain chains for cross-chain bridge
**Authentication**: None

**Response** (200 OK):
```json
{
  "totalChains": 5,
  "chains": [
    {
      "chainId": "ethereum-mainnet",
      "name": "Ethereum",
      "network": "mainnet",
      "active": true,
      "blockHeight": 18456789,
      "bridgeContract": "0x1234567890abcdef"
    },
    {
      "chainId": "solana-mainnet",
      "name": "Solana",
      "network": "mainnet-beta",
      "active": true,
      "blockHeight": 234567890,
      "bridgeContract": "BridgeAddr123456789"
    }
  ],
  "bridgeVersion": "2.1.0",
  "timestamp": 1729468745123
}
```

---

#### Get Bridge Statistics

**Endpoint**: `GET /api/v11/bridge/stats`
**Description**: Retrieve cross-chain bridge statistics
**Authentication**: None

**Response** (200 OK):
```json
{
  "totalTransfers": 456789,
  "successfulTransfers": 456780,
  "failedTransfers": 9,
  "totalValueLocked": "125456789 AUR",
  "activeChains": 5,
  "averageTransferTime": 15.5,
  "transfersByChain": {
    "ethereum": 234567,
    "solana": 123456,
    "polygon": 56789,
    "binance": 34567,
    "avalanche": 7410
  },
  "timestamp": 1729468745123
}
```

---

### Real-World Assets

#### Get RWA Status

**Endpoint**: `GET /api/v11/rwa/status`
**Description**: Get Real-World Asset tokenization status
**Authentication**: None

**Response** (200 OK):
```json
{
  "enabled": true,
  "hmsIntegrationActive": true,
  "totalAssetsTokenized": 0,
  "totalValueLocked": "0 USD",
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
  "timestamp": 1729468745123
}
```

---

### Security

#### Get Audit Logs

**Endpoint**: `GET /api/v11/security/audit/logs`
**Description**: Retrieve security audit logs
**Authentication**: **Required** (Bearer token)
**Rate Limit**: 10/min

**Query Parameters**:
- `startTime` (integer, optional) - Start timestamp (Unix milliseconds)
- `endTime` (integer, optional) - End timestamp (Unix milliseconds)
- `limit` (integer, default: 50, max: 500) - Maximum number of logs

**Response** (200 OK):
```json
{
  "logs": [
    {
      "eventId": "evt_12345",
      "eventType": "USER_LOGIN",
      "severity": "INFO",
      "userId": "user_789",
      "action": "LOGIN_SUCCESS",
      "resource": "/api/v11/auth/login",
      "outcome": "SUCCESS",
      "ipAddress": "192.168.1.100",
      "timestamp": 1729468745123
    },
    {
      "eventId": "evt_12346",
      "eventType": "CONTRACT_DEPLOYMENT",
      "severity": "WARNING",
      "userId": "user_456",
      "action": "DEPLOY_CONTRACT",
      "resource": "/api/v11/contracts",
      "outcome": "FAILED",
      "reason": "Insufficient permissions",
      "timestamp": 1729468745000
    }
  ],
  "total": 125678,
  "limit": 50
}
```

**Example**:
```bash
curl -H "Authorization: Bearer <your-token>" \
  "https://dlt.aurigraph.io/api/v11/security/audit/logs?limit=100"
```

---

### Smart Contracts

#### List Smart Contracts

**Endpoint**: `GET /api/v11/contracts`
**Description**: Retrieve list of deployed smart contracts
**Authentication**: None

**Response** (200 OK):
```json
{
  "contracts": [
    {
      "contractId": "contract_123",
      "name": "Token Contract",
      "address": "0xcontract123456",
      "owner": "0xowner789012",
      "status": "ACTIVE",
      "deployedAt": 1729468745123
    }
  ],
  "total": 234
}
```

---

#### Deploy Smart Contract

**Endpoint**: `POST /api/v11/contracts`
**Description**: Deploy a new smart contract
**Authentication**: **Required** (Bearer token)
**Content-Type**: application/json

**Request Body**:
```json
{
  "contractCode": "contract MyContract { ... }",
  "contractName": "MyToken",
  "parameters": {
    "initialSupply": 1000000,
    "decimals": 18
  }
}
```

**Response** (201 Created):
```json
{
  "contractId": "contract_456",
  "address": "0xnewcontract789",
  "status": "DEPLOYED",
  "transactionHash": "0xtxhash123",
  "timestamp": 1729468745123
}
```

---

## Response Formats

All API responses use JSON format with consistent structure:

### Success Response
```json
{
  "data": { /* response data */ },
  "timestamp": 1729468745123
}
```

### Error Response
```json
{
  "error": "Error type",
  "message": "Detailed error message",
  "code": 400,
  "timestamp": 1729468745123,
  "requestId": "req_abc123"
}
```

---

## Error Handling

### HTTP Status Codes

| Code | Description |
|------|-------------|
| 200 | OK - Request successful |
| 201 | Created - Resource created successfully |
| 202 | Accepted - Request accepted for processing |
| 400 | Bad Request - Invalid request data |
| 401 | Unauthorized - Authentication required |
| 403 | Forbidden - Insufficient permissions |
| 404 | Not Found - Resource not found |
| 429 | Too Many Requests - Rate limit exceeded |
| 500 | Internal Server Error - Server error |
| 503 | Service Unavailable - Temporary unavailability |

### Common Error Types

#### Invalid Request (400)
```json
{
  "error": "INVALID_REQUEST",
  "message": "Transaction ID is required",
  "code": 400,
  "field": "transactionId",
  "timestamp": 1729468745123
}
```

#### Unauthorized (401)
```json
{
  "error": "UNAUTHORIZED",
  "message": "Authentication required. Please provide a valid Bearer token.",
  "code": 401,
  "timestamp": 1729468745123
}
```

#### Rate Limit Exceeded (429)
```json
{
  "error": "RATE_LIMIT_EXCEEDED",
  "message": "You have exceeded the rate limit of 100 requests per minute",
  "code": 429,
  "retryAfter": 15,
  "timestamp": 1729468745123
}
```

---

## Code Examples

### JavaScript/Node.js

```javascript
// Health check
const response = await fetch('https://dlt.aurigraph.io/api/v11/health');
const health = await response.json();
console.log(health);

// Process transaction
const tx = await fetch('https://dlt.aurigraph.io/api/v11/blockchain/transactions', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    transactionId: 'tx_12345',
    amount: 100.50
  })
});
const result = await tx.json();
console.log(result);

// Get blockchain stats
const stats = await fetch('https://dlt.aurigraph.io/api/v11/blockchain/stats');
const blockchainStats = await stats.json();
console.log(blockchainStats);
```

### Python

```python
import requests

# Health check
response = requests.get('https://dlt.aurigraph.io/api/v11/health')
health = response.json()
print(health)

# Process transaction
tx_data = {
    'transactionId': 'tx_12345',
    'amount': 100.50
}
response = requests.post(
    'https://dlt.aurigraph.io/api/v11/blockchain/transactions',
    json=tx_data
)
result = response.json()
print(result)

# Get AI predictions
response = requests.get('https://dlt.aurigraph.io/api/v11/ai/predictions')
predictions = response.json()
print(predictions)
```

### cURL

```bash
# Health check
curl https://dlt.aurigraph.io/api/v11/health

# Process transaction
curl -X POST https://dlt.aurigraph.io/api/v11/blockchain/transactions \
  -H "Content-Type: application/json" \
  -d '{"transactionId": "tx_12345", "amount": 100.50}'

# Get blockchain stats
curl https://dlt.aurigraph.io/api/v11/blockchain/stats

# Get AI models (with authentication)
curl -H "Authorization: Bearer <your-token>" \
  https://dlt.aurigraph.io/api/v11/ai/models

# Performance test
curl "https://dlt.aurigraph.io/api/v11/performance?iterations=50000&threads=4"
```

### Java

```java
// Using Java HTTP Client (Java 11+)
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.net.URI;

HttpClient client = HttpClient.newHttpClient();

// Health check
HttpRequest request = HttpRequest.newBuilder()
    .uri(URI.create("https://dlt.aurigraph.io/api/v11/health"))
    .build();

HttpResponse<String> response = client.send(request,
    HttpResponse.BodyHandlers.ofString());
System.out.println(response.body());

// Process transaction
String txJson = """
    {
        "transactionId": "tx_12345",
        "amount": 100.50
    }
    """;

HttpRequest txRequest = HttpRequest.newBuilder()
    .uri(URI.create("https://dlt.aurigraph.io/api/v11/blockchain/transactions"))
    .header("Content-Type", "application/json")
    .POST(HttpRequest.BodyPublishers.ofString(txJson))
    .build();

HttpResponse<String> txResponse = client.send(txRequest,
    HttpResponse.BodyHandlers.ofString());
System.out.println(txResponse.body());
```

---

## OpenAPI Specification

The complete OpenAPI 3.0 specification is available at:

**File**: `docs/openapi.yaml`
**URL**: https://dlt.aurigraph.io/api/v11/openapi.yaml

You can import this specification into tools like:
- **Swagger UI**: Interactive API documentation
- **Postman**: API testing and development
- **Insomnia**: REST client
- **OpenAPI Generator**: Generate client SDKs

### Viewing with Swagger UI

```bash
# Using Docker
docker run -p 8080:8080 \
  -e SWAGGER_JSON=/openapi.yaml \
  -v $(pwd)/docs:/app \
  swaggerapi/swagger-ui
```

Visit: http://localhost:8080

---

## Support & Resources

- **Documentation**: https://docs.aurigraph.io
- **API Status**: https://status.aurigraph.io
- **GitHub**: https://github.com/Aurigraph-DLT-Corp/Aurigraph-DLT
- **Support Email**: support@aurigraph.io
- **Developer Portal**: https://developer.aurigraph.io

---

**Last Updated**: October 20, 2025
**API Version**: 11.0.0
**Documentation Version**: 1.0.0
