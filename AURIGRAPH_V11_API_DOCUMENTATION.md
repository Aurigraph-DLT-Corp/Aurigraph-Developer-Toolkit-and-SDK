# Aurigraph V11 Java Backend - Comprehensive API & Architecture Documentation

**Version**: 11.4.4  
**Framework**: Quarkus 3.29.0 with Java 21  
**Runtime**: GraalVM Native Compilation  
**Base URL**: `https://dlt.aurigraph.io/api/v11` (Production) or `http://localhost:9003/api/v11` (Development)  
**Alternative Gateway**: `https://dlt.aurigraph.io/api/v11` (PortalAPIGateway - Recommended)

---

## Table of Contents
1. [Architecture Overview](#architecture-overview)
2. [Primary Gateway Endpoints](#primary-gateway-endpoints)
3. [REST API Endpoints by Category](#rest-api-endpoints-by-category)
4. [Request/Response DTOs](#requestresponse-dtos)
5. [Service Layer Implementation](#service-layer-implementation)
6. [Data Access & Business Logic](#data-access--business-logic)
7. [Configuration & Dependencies](#configuration--dependencies)
8. [Authentication & Security](#authentication--security)

---

## Architecture Overview

### System Architecture

The Aurigraph V11 system uses a **REST-to-gRPC gateway pattern**:

```
Enterprise Portal (React/TypeScript)
         |
         | HTTP/REST (JSON)
         v
REST API Endpoints (PortalAPIGateway, AurigraphResource, etc.)
         |
    DTOConverter
         |
    HTTP/2 gRPC Bridge
         |
    Core Services (via gRPC)
         |
    Business Logic Layer
         |
    Data Access (PostgreSQL, LevelDB)
```

### Key Features
- **REST API**: External-facing HTTP endpoints (port 9003)
- **gRPC Backend**: Internal service-to-service communication (port 9004)
- **Reactive Streams**: Mutiny for non-blocking I/O
- **Native Compilation**: GraalVM for <1s startup and <256MB memory
- **Virtual Threads**: Java 21 for lightweight concurrency (4M max threads)
- **Performance Target**: 2M+ TPS (currently 776K baseline)

---

## Primary Gateway Endpoints

### PortalAPIGateway (`/api/v11`)

**Status**: ACTIVE - Primary endpoint for Enterprise Portal v4.5.0  
**Path**: `io.aurigraph.v11.portal.PortalAPIGateway.java`  
**Port**: 9003 (HTTP)

This is the **recommended single entry point** for all Portal API requests. It routes to specialized data services:

#### Core System Endpoints

| Method | Path | Description | Service |
|--------|------|-------------|---------|
| `GET` | `/health` | Service health status | BlockchainDataService |
| `GET` | `/info` | System information & version | BlockchainDataService |
| `GET` | `/blockchain/metrics` | Real-time blockchain metrics | BlockchainDataService |
| `GET` | `/blockchain/stats` | Detailed blockchain statistics | BlockchainDataService |

#### Blockchain Endpoints

| Method | Path | Description | Service |
|--------|------|-------------|---------|
| `GET` | `/blocks?limit=20` | List recent blocks | BlockchainDataService |
| `GET` | `/blocks/{hash}` | Get specific block | BlockchainDataService |
| `GET` | `/validators` | List active validators | BlockchainDataService |
| `GET` | `/validators/{id}` | Validator details | BlockchainDataService |
| `GET` | `/transactions?limit=20` | Recent transactions | BlockchainDataService |
| `GET` | `/transactions/{hash}` | Transaction details | BlockchainDataService |

#### Consensus Endpoints

| Method | Path | Description | Service |
|--------|------|-------------|---------|
| `GET` | `/consensus/status` | HyperRAFT++ status | BlockchainDataService |
| `GET` | `/consensus/metrics` | Consensus performance | BlockchainDataService |
| `GET` | `/consensus/nodes` | Cluster node info | BlockchainDataService |

#### Token Endpoints

| Method | Path | Description | Service |
|--------|------|-------------|---------|
| `GET` | `/tokens` | List all tokens | TokenDataService |
| `GET` | `/tokens/{id}` | Token details | TokenDataService |
| `POST` | `/tokens` | Create token | TokenDataService |
| `GET` | `/tokens/{id}/balance/{address}` | Token balance | TokenDataService |

#### RWA (Real-World Assets) Endpoints

| Method | Path | Description | Service |
|--------|------|-------------|---------|
| `GET` | `/rwa/status` | RWA system status | RWADataService |
| `GET` | `/rwa/assets` | List tokenized assets | RWADataService |
| `POST` | `/rwa/tokenize` | Tokenize asset | RWADataService |
| `GET` | `/rwa/portfolio` | RWA portfolio | RWADataService |

#### Smart Contract Endpoints

| Method | Path | Description | Service |
|--------|------|-------------|---------|
| `GET` | `/contracts` | List contracts | ContractDataService |
| `POST` | `/contracts/deploy` | Deploy contract | ContractDataService |
| `GET` | `/contracts/{id}` | Contract details | ContractDataService |
| `POST` | `/contracts/{id}/execute` | Execute contract | ContractDataService |

#### Network Endpoints

| Method | Path | Description | Service |
|--------|------|-------------|---------|
| `GET` | `/network/health` | Network health | NetworkDataService |
| `GET` | `/network/nodes` | Network topology | NetworkDataService |
| `GET` | `/network/latency` | Network latency | NetworkDataService |

#### Analytics Endpoints

| Method | Path | Description | Service |
|--------|------|-------------|---------|
| `GET` | `/analytics/dashboard` | Dashboard data | AnalyticsDataService |
| `GET` | `/analytics/metrics` | Performance metrics | AnalyticsDataService |
| `GET` | `/analytics/trends` | Historical trends | AnalyticsDataService |

#### Staking Endpoints

| Method | Path | Description | Service |
|--------|------|-------------|---------|
| `GET` | `/staking/info` | Staking information | StakingDataService |
| `POST` | `/staking/stake` | Stake tokens | StakingDataService |
| `POST` | `/staking/unstake` | Unstake tokens | StakingDataService |
| `GET` | `/staking/rewards` | Staking rewards | StakingDataService |

---

## REST API Endpoints by Category

### 1. Transaction Management

**Resource**: `TransactionResource`  
**Path Base**: `/api/v11/transactions`  
**Communication**: REST ↔ gRPC Bridge

#### Single Transaction Operations

```
POST /api/v11/transactions/submit
Content-Type: application/json

Request:
{
  "tx_hash": "0x123...",
  "from": "0xabc...",
  "to": "0xdef...",
  "amount": "100.50",
  "gas_price": "20",
  "nonce": 1
}

Response:
{
  "tx_hash": "0x123...",
  "status": "QUEUED",
  "timestamp": "2025-11-13T10:30:00Z"
}
```

#### Batch Operations

```
POST /api/v11/transactions/batch
Content-Type: application/json

Request:
{
  "transactions": [
    { "tx_hash": "0x123...", "from": "0xabc...", ... },
    { "tx_hash": "0x456...", "from": "0xdef...", ... }
  ]
}

Response:
{
  "acceptedCount": 2,
  "rejectedCount": 0,
  "batchId": "batch-uuid",
  "durationMs": 1.23
}
```

#### Status & Receipt

```
GET /api/v11/transactions/{hash}/status
GET /api/v11/transactions/{hash}/receipt
GET /api/v11/transactions/pending?limit=100
GET /api/v11/transactions/pool/stats
```

#### Gas Estimation

```
POST /api/v11/transactions/estimate-gas
Content-Type: application/json

Request:
{
  "fromAddress": "0xabc...",
  "toAddress": "0xdef...",
  "data": "0x...",
  "amount": "100"
}

Response:
{
  "estimatedGas": 21000,
  "gasPrice": "20",
  "totalCost": "420000"
}
```

**Service Implementation**: `TransactionService.java`

---

### 2. Blockchain & Block Management

**Resource**: `BlockchainApiResource`  
**Path Base**: `/api/v11/deprecated/blockchain`  
**Status**: Deprecated (use PortalAPIGateway instead)

#### Block Operations

```
GET /api/v11/deprecated/blockchain/blocks?limit=10&offset=0
GET /api/v11/deprecated/blockchain/blocks/{hash}
POST /api/v11/deprecated/blockchain/blocks/validate
```

#### Transaction Queries

```
GET /api/v11/deprecated/blockchain/transactions?limit=10&offset=0
POST /api/v11/deprecated/blockchain/transactions
POST /api/v11/deprecated/blockchain/transactions/batch
```

#### Blockchain Statistics

```
GET /api/v11/deprecated/blockchain/stats
GET /api/v11/deprecated/blockchain/metrics
```

**Service Implementation**: `NetworkStatsService.java`, `BlockchainDataService.java`

---

### 3. Consensus Management

**Resource**: `ConsensusApiResource`  
**Path Base**: `/api/v11/consensus`

#### Consensus Status

```
GET /api/v11/consensus/status
Response: HyperRAFT++ consensus algorithm status

GET /api/v11/consensus/metrics
Response: Detailed performance metrics including:
  - Throughput (proposals/second)
  - Latency (P50, P95, P99)
  - Voting statistics
  - Leader information
  - Commit index and applied index
```

#### Consensus Proposals

```
POST /api/v11/consensus/propose
Content-Type: application/json

Request:
{
  "proposalId": "proposal-uuid",
  "data": { ... },
  "type": "TRANSACTION"
}

Response:
{
  "status": "PROPOSED",
  "proposalId": "proposal-uuid",
  "timestamp": 1699874400000
}
```

#### Cluster Information

```
GET /api/v11/consensus/nodes
Response:
{
  "nodes": [
    {
      "nodeId": "node-1",
      "role": "LEADER",
      "status": "HEALTHY",
      "currentTerm": 42,
      "commitIndex": 12345,
      "lastApplied": 12344,
      "throughput": 776000,
      "lastSeen": 1699874400123
    }
  ],
  "totalNodes": 5,
  "leaderNode": "node-1",
  "consensusHealth": "HEALTHY",
  "timestamp": 1699874400123
}
```

**Service Implementation**: `HyperRAFTConsensusService.java`, `LiveConsensusService.java`

---

### 4. Real-World Asset (RWA) Tokenization

**Resource**: `RWAApiResource`  
**Path Base**: `/api/v11/rwa`

#### RWA Status

```
GET /api/v11/rwa/status
Response:
{
  "systemStatus": "OPERATIONAL",
  "version": "11.0.0",
  "serviceHealth": "HEALTHY",
  "tokenization": {
    "totalAssetsTokenized": 1234,
    "activeTokens": 1156,
    "pendingVerification": 45,
    "totalMarketValue": "4.56B USD"
  },
  "assetCategories": {
    "realEstate": { "count": 456, "totalValue": "2.3B USD", "percentage": 50.4 },
    "commodities": { "count": 234, "totalValue": "890M USD", "percentage": 19.5 },
    "bonds": { "count": 189, "totalValue": "750M USD", "percentage": 16.4 },
    "artCollectibles": { "count": 156, "totalValue": "456M USD", "percentage": 10.0 }
  },
  "compliance": {
    "kycCompliantAssets": 1189,
    "accreditedInvestors": 4567,
    "regulatoryJurisdictions": 23
  }
}
```

#### Asset Tokenization

```
POST /api/v11/rwa/tokenize
Content-Type: application/json

Request:
{
  "assetType": "REAL_ESTATE",
  "assetDescription": "Commercial Property in NYC",
  "assetValue": 5000000,
  "currency": "USD",
  "fractionalization": {
    "totalTokens": 10000,
    "tokenValue": 500
  },
  "documentHashes": ["0xdoc1hash", "0xdoc2hash"]
}

Response:
{
  "tokenId": "rwa-token-uuid",
  "tokenSymbol": "PROP-NYC-2025",
  "status": "PENDING_VERIFICATION",
  "completionPercentage": 35,
  "timestamp": 1699874400000
}
```

**Service Implementation**: `RWADataService.java`, `RWATRegistryService.java`

---

### 5. Smart Contracts

**Resource**: `SmartContractResource`  
**Path Base**: `/api/v11/contracts`

#### Contract Deployment

```
POST /api/v11/contracts/deploy
Content-Type: application/json

Request:
{
  "contractName": "MyToken",
  "contractType": "ERC20",
  "sourceCode": "pragma solidity ^0.8.0; ...",
  "initialBalance": 1000000,
  "owner": "0xowner...",
  "parameters": {
    "decimals": 18,
    "symbol": "MTK"
  }
}

Response:
{
  "contractId": "contract-uuid",
  "contractAddress": "0xcontract...",
  "status": "DEPLOYED",
  "transactionHash": "0xtxhash...",
  "deploymentCost": "0.5 ETH"
}
```

#### Contract Interaction

```
GET /api/v11/contracts/{id}
GET /api/v11/contracts/{id}/balance
GET /api/v11/contracts/{id}/events
POST /api/v11/contracts/{id}/execute
GET /api/v11/contracts?type=ERC20&limit=20
```

**Service Implementation**: `SmartContractService.java`, `ActiveContractService.java`

---

### 6. Cryptography & Security

**Resource**: `CryptoApiResource`, `QuantumCryptoResource`  
**Path Base**: `/api/v11/crypto`

#### Quantum Cryptography Status

```
GET /api/v11/crypto/status
Response:
{
  "algorithm": "CRYSTALS-Dilithium",
  "securityLevel": 5,
  "enabled": true,
  "operationsPerSecond": 10000,
  "encryptionCount": 5234567,
  "verificationCount": 2345678,
  "implementation": "Hardware-optimized"
}
```

#### Key Operations

```
POST /api/v11/crypto/generate-keypair
POST /api/v11/crypto/sign
POST /api/v11/crypto/verify
GET /api/v11/crypto/metrics
```

**Supported Algorithms**:
- CRYSTALS-Kyber (Key Encapsulation)
- CRYSTALS-Dilithium (Signatures)
- SPHINCS+ (Hash-based Signatures)
- AES-256-GCM (Encryption)

**Service Implementation**: `QuantumCryptoService.java`, `DilithiumSignatureService.java`, `PostQuantumCryptoService.java`

---

### 7. Cross-Chain Bridge

**Resource**: `BridgeApiResource`, `CrossChainBridgeResource`  
**Path Base**: `/api/v11/bridge`

#### Supported Chains

```
GET /api/v11/bridge/supported-chains
Response:
{
  "totalChains": 3,
  "chains": [
    {
      "chainId": "1",
      "name": "Ethereum",
      "network": "mainnet",
      "active": true,
      "blockHeight": 18756234,
      "bridgeContract": "0xbridge..."
    },
    {
      "chainId": "137",
      "name": "Polygon",
      "network": "mainnet",
      "active": true,
      "blockHeight": 54237890,
      "bridgeContract": "0xpolygonbridge..."
    },
    {
      "chainId": "solana-mainnet",
      "name": "Solana",
      "network": "mainnet",
      "active": true,
      "blockHeight": 189234567,
      "bridgeContract": "Bridge2Program..."
    }
  ],
  "bridgeVersion": "2.1.0"
}
```

#### Token Transfer

```
POST /api/v11/bridge/transfer
Content-Type: application/json

Request:
{
  "tokenAddress": "0xtoken...",
  "fromChain": "ethereum",
  "toChain": "polygon",
  "amount": "1000000000000000000",
  "recipient": "0xrecipient...",
  "metadata": {
    "fee": "0.5%",
    "slippage": "2%"
  }
}

Response:
{
  "transferId": "transfer-uuid",
  "status": "INITIATED",
  "estimatedTime": "5 minutes",
  "fee": "5000000000000000",
  "sourceHash": "0xsourcehash...",
  "timestamp": 1699874400000
}
```

#### Bridge Status

```
GET /api/v11/bridge/status
GET /api/v11/bridge/transfers/{id}
GET /api/v11/bridge/history?limit=20
```

**Service Implementation**: `CrossChainBridgeService.java`, `BridgeTransferService.java`, `BridgeMonitoringService.java`

---

### 8. Performance & Analytics

**Resource**: `PerformanceApiResource`, `AIApiResource`  
**Path Base**: `/api/v11/performance`, `/api/v11/ai`

#### Performance Testing

```
GET /api/v11/performance?iterations=100000&threads=4
Response:
{
  "iterations": 100000,
  "durationMs": 125.45,
  "transactionsPerSecond": 796812,
  "nsPerTransaction": 1254,
  "optimizations": "Virtual Threads + Lock-Free",
  "threadCount": 4,
  "targetTPS": 2000000,
  "targetAchieved": false
}
```

#### Ultra-High-Throughput Test

```
POST /api/v11/performance/ultra-throughput
Content-Type: application/json

Request:
{
  "iterations": 1000000
}

Response:
{
  "iterations": 1000000,
  "durationMs": 432.1,
  "transactionsPerSecond": 2316000,
  "performanceGrade": "EXCELLENT (2M+ TPS)",
  "ultraHighTarget": false,
  "highTarget": true,
  "baseTarget": true,
  "optimizations": "Virtual Threads + Lock-Free + Cache-Optimized"
}
```

#### AI Optimization Metrics

```
GET /api/v11/ai/metrics
Response:
{
  "modelName": "TransactionOrdering",
  "accuracy": 0.98,
  "prediction_latency_ms": 2.1,
  "confidence": 0.95,
  "last_update": 1699874400000,
  "status": "ACTIVE"
}
```

**Service Implementation**: `AIOptimizationService.java`, `AdvancedMLOptimizationService.java`, `MLMetricsService.java`

---

### 9. Health & Monitoring

**Resource**: `HealthCheckResource`, `SystemInfoResource`  
**Path Base**: `/api/v11/health`, `/api/v11/system`

#### Health Checks

```
GET /api/v11/health
Response:
{
  "status": "UP",
  "timestamp": "2025-11-13T10:30:00Z",
  "version": "11.0.0",
  "uptime": 3600,
  "checks": {
    "database": "UP",
    "consensus": "UP",
    "network": "UP"
  }
}

GET /api/v11/health/live
GET /api/v11/health/ready
```

#### System Information

```
GET /api/v11/info
Response:
{
  "name": "Aurigraph V11 Java Nexus",
  "version": "11.4.4",
  "javaVersion": "21",
  "framework": "Quarkus 3.29.0",
  "osName": "Linux",
  "osArch": "amd64"
}

GET /api/v11/system/status
Response:
{
  "platformName": "Aurigraph V11 Platform",
  "version": "11.4.4",
  "uptimeMs": 3600000,
  "healthy": true,
  "transactionStats": { ... },
  "consensusStatus": { ... },
  "cryptoStatus": { ... },
  "bridgeStats": { ... },
  "timestamp": 1699874400000
}
```

**Service Implementation**: `HealthCheckResource.java`, `SystemInfoResource.java`

---

## Request/Response DTOs

### Portal Data Transfer Objects (DTOs)

All Portal DTOs are located in `/portal/models/` directory:

#### Core DTOs

| DTO | Purpose |
|-----|---------|
| `BlockchainMetricsDTO` | Real-time blockchain performance metrics |
| `BlockchainStatsDTO` | Detailed blockchain statistics |
| `BlockDTO` | Block information |
| `TransactionDTO` | Transaction data |
| `TransactionDetailDTO` | Detailed transaction info |
| `ValidatorDTO` | Validator summary |
| `ValidatorDetailDTO` | Detailed validator info |
| `HealthStatusDTO` | System health status |
| `SystemInfoDTO` | System information |
| `BlockchainStatsDTO` | Blockchain statistics |

#### Token DTOs

| DTO | Purpose |
|-----|---------|
| `TokenDTO` | Token information |
| `FractionalTokenDTO` | Fractional token data |
| `CompositeTokenDTO` | Composite token data |
| `RWATokenDTO` | RWA token information |

#### Smart Contract DTOs

| DTO | Purpose |
|-----|---------|
| `SmartContractDeploymentDTO` | Contract deployment info |
| `ContractTemplateDTO` | Contract template data |
| `RicardianContractDTO` | Ricardian contract data |

#### Analytics DTOs

| DTO | Purpose |
|-----|---------|
| `AnalyticsDTO` | General analytics data |
| `PerformanceAnalyticsDTO` | Performance metrics |
| `MLMetricsDTO` | ML model metrics |
| `MLConfidenceDTO` | ML confidence scores |
| `MLPredictionsDTO` | ML predictions |
| `MLPerformanceDTO` | ML performance stats |

#### Infrastructure DTOs

| DTO | Purpose |
|-----|---------|
| `NetworkHealthDTO` | Network health status |
| `StakingInfoDTO` | Staking information |
| `RWAPoolDTO` | RWA pool data |
| `RWATokenizationDTO` | RWA tokenization info |
| `AuditTrailDTO` | Audit trail entries |

---

## Service Layer Implementation

### Core Services

#### 1. BlockchainDataService
**Location**: `portal/services/BlockchainDataService.java`  
**Responsibilities**:
- Retrieve blockchain metrics and statistics
- Get block and transaction information
- Query validator information
- Consensus status queries
- Health check aggregation

**Key Methods**:
```java
public Uni<HealthStatusDTO> getHealthStatus()
public Uni<SystemInfoDTO> getSystemInfo()
public Uni<BlockchainMetricsDTO> getBlockchainMetrics()
public Uni<BlockchainStatsDTO> getBlockchainStats()
public Uni<List<BlockDTO>> getLatestBlocks(int limit)
public Uni<List<ValidatorDTO>> getValidators()
public Uni<ValidatorDetailDTO> getValidatorDetails(String validatorId)
```

#### 2. TokenDataService
**Location**: `portal/services/TokenDataService.java`  
**Responsibilities**:
- Token creation and management
- Token transfer operations
- Balance queries
- Token statistics

**Key Methods**:
```java
public Uni<TokenDTO> createToken(TokenCreationRequest request)
public Uni<List<TokenDTO>> listTokens()
public Uni<TokenDTO> getToken(String tokenId)
public Uni<BigDecimal> getBalance(String tokenId, String address)
public Uni<Response> transferToken(TokenTransferRequest request)
```

#### 3. RWADataService
**Location**: `portal/services/RWADataService.java`  
**Responsibilities**:
- RWA tokenization operations
- Asset portfolio management
- Compliance verification
- Market data aggregation

**Key Methods**:
```java
public Uni<RWAStatus> getRWAStatus()
public Uni<Response> tokenizeAsset(AssetTokenizationRequest request)
public Uni<List<RWATokenDTO>> getAssets()
public Uni<RWAPortfolioDTO> getPortfolio()
public Uni<Response> verifyAsset(String assetId)
```

#### 4. SmartContractDataService
**Location**: `portal/services/ContractDataService.java`  
**Responsibilities**:
- Contract deployment
- Contract execution
- Contract state queries
- Template management

**Key Methods**:
```java
public Uni<ContractDeploymentResponse> deployContract(ContractDeploymentRequest request)
public Uni<List<SmartContractDTO>> listContracts()
public Uni<ContractDetailsDTO> getContractDetails(String contractId)
public Uni<Response> executeContract(ContractExecutionRequest request)
```

#### 5. AnalyticsDataService
**Location**: `portal/services/AnalyticsDataService.java`  
**Responsibilities**:
- Dashboard data aggregation
- Performance analytics
- Trend analysis
- ML metrics

**Key Methods**:
```java
public Uni<AnalyticsDTO> getDashboardData()
public Uni<PerformanceAnalyticsDTO> getPerformanceMetrics()
public Uni<List<MLMetricsDTO>> getMLMetrics()
public Uni<List<TrendDataDTO>> getTrends(String metric, int days)
```

#### 6. NetworkDataService
**Location**: `portal/services/NetworkDataService.java`  
**Responsibilities**:
- Network topology queries
- Node information
- Latency measurement
- Network health monitoring

**Key Methods**:
```java
public Uni<NetworkHealthDTO> getNetworkHealth()
public Uni<List<NodeDTO>> getNetworkNodes()
public Uni<LatencyMetricsDTO> getLatencyMetrics()
public Uni<TopologyDTO> getNetworkTopology()
```

#### 7. StakingDataService
**Location**: `portal/services/StakingDataService.java`  
**Responsibilities**:
- Staking operations
- Reward distribution
- Staker information

**Key Methods**:
```java
public Uni<StakingInfoDTO> getStakingInfo()
public Uni<Response> stake(StakingRequest request)
public Uni<Response> unstake(UnstakingRequest request)
public Uni<RewardStatisticsDTO> getRewards(String stakerAddress)
```

---

### Business Logic Services

#### HyperRAFTConsensusService
**Location**: `consensus/HyperRAFTConsensusService.java`  
**Purpose**: HyperRAFT++ consensus algorithm implementation  
**Key Operations**:
- Leader election
- Log replication
- State commitment
- Proposal handling

#### QuantumCryptoService
**Location**: `crypto/QuantumCryptoService.java`  
**Purpose**: NIST Level 5 quantum-resistant cryptography  
**Algorithms**:
- CRYSTALS-Kyber (Key Encapsulation)
- CRYSTALS-Dilithium (Signatures)
- SPHINCS+ (Hash-based Signatures)

#### CrossChainBridgeService
**Location**: `bridge/CrossChainBridgeService.java`  
**Purpose**: Multi-chain interoperability  
**Supported Chains**:
- Ethereum (EVM)
- Polygon (EVM)
- Solana (Solana VM)

#### AIOptimizationService
**Location**: `ai/AIOptimizationService.java`  
**Purpose**: ML-based transaction ordering and consensus optimization  
**Features**:
- Online learning (Sprint 5)
- Predictive routing
- Anomaly detection
- Adaptive batching

#### TransactionService
**Location**: `TransactionService.java`  
**Purpose**: High-performance transaction processing  
**Features**:
- Batch processing (10K-500K transactions)
- Virtual thread execution
- Lock-free data structures
- Adaptive batching with SIMD

---

## Data Access & Business Logic

### Database Configuration

**Primary Database**: PostgreSQL 16  
**Development Connection**: `postgresql://localhost:5432/aurigraph_demos`  
**Embedded Storage**: LevelDB (per-node state)

### ORM Configuration

**Framework**: Quarkus Hibernate ORM (Panache)  
**Entity Packages**:
- `io.aurigraph.v11.models`
- `io.aurigraph.v11.contracts.rwa.compliance.entities`
- `io.aurigraph.v11.user`
- `io.aurigraph.v11.demo.model`

### Key Entity Models

| Entity | Purpose |
|--------|---------|
| `Block` | Blockchain blocks |
| `Transaction` | Transactions |
| `Validator` | Consensus validators |
| `SmartContract` | Deployed contracts |
| `Token` | Token definitions |
| `RWAAsset` | Tokenized real-world assets |

### Database Migrations

**Framework**: Flyway  
**Configuration**:
- Auto-migrate on startup (development)
- Baseline on migrate
- Repair on migrate (development)
- Validation disabled (compatibility)

---

## Configuration & Dependencies

### Maven Configuration

**Build Tool**: Maven 3.9+  
**Java Version**: OpenJDK 21  
**Quarkus Version**: 3.29.0

### Key Dependencies

```xml
<!-- REST API & HTTP/2 -->
<dependency>
    <groupId>io.quarkus</groupId>
    <artifactId>quarkus-rest-jackson</artifactId>
</dependency>

<!-- gRPC for internal service-to-service communication -->
<dependency>
    <groupId>io.quarkus</groupId>
    <artifactId>quarkus-grpc</artifactId>
</dependency>

<!-- Reactive Streams -->
<dependency>
    <groupId>io.smallrye.reactive</groupId>
    <artifactId>mutiny</artifactId>
</dependency>

<!-- Database -->
<dependency>
    <groupId>io.quarkus</groupId>
    <artifactId>quarkus-hibernate-orm</artifactId>
</dependency>
<dependency>
    <groupId>org.postgresql</groupId>
    <artifactId>postgresql</artifactId>
</dependency>

<!-- Metrics -->
<dependency>
    <groupId>io.quarkus</groupId>
    <artifactId>quarkus-micrometer-registry-prometheus</artifactId>
</dependency>

<!-- Health Checks -->
<dependency>
    <groupId>io.quarkus</groupId>
    <artifactId>quarkus-smallrye-health</artifactId>
</dependency>
```

### Application Properties

**Configuration File**: `src/main/resources/application.properties`

**Critical Settings**:
```properties
# HTTP/2 Configuration
quarkus.http.port=9003
quarkus.http.http2=true
quarkus.http.limits.max-concurrent-streams=100000

# gRPC Configuration
quarkus.grpc.server.enabled=true
quarkus.grpc.server.port=9004

# Database
quarkus.datasource.db-kind=postgresql
quarkus.datasource.jdbc.url=jdbc:postgresql://localhost:5432/aurigraph_demos

# Virtual Threads (Java 21)
quarkus.thread-pool.max-threads=4096
quarkus.thread-pool.queue-size=500000

# Performance Optimization
consensus.batch.size=175000
consensus.parallel.threads=896
ai.optimization.enabled=true
batch.processor.enabled=true
```

---

## Authentication & Security

### JWT Authentication

**Implementation**: `AuthTokenService.java`, `JwtSecretRotationService.java`  
**Key Rotation**: Every 90 days

### Quantum Cryptography

**NIST Level**: 5 (256-bit quantum security)  
**Algorithms**:
- CRYSTALS-Kyber-1024 (Key Encapsulation)
- CRYSTALS-Dilithium5 (Signatures)
- SHA2-256s SPHINCS+ (Hash-based Backup)

### CORS Configuration

**Allowed Origins**:
- `https://dlt.aurigraph.io:9443`
- `https://dev4.aurex.in`
- `http://localhost:3000` (Development)
- `https://localhost:5173` (Development)

**Allowed Methods**: `GET, POST, PUT, DELETE, OPTIONS`  
**Allowed Headers**: `Content-Type, Authorization, X-Requested-With, Accept, Origin`

### Rate Limiting

**Default**: 1000 req/min per authenticated user  
**Performance Tests**: 60 req/min (compute-intensive)

### Security Audit

**Enabled**: `true`  
**Service**: `SecurityAuditService.java`  
**Audit Trail**: Persistent storage with 365-day retention

---

## Development & Testing

### Quick Start

```bash
# Navigate to V11 directory
cd aurigraph-av10-7/aurigraph-v11-standalone

# Start in development mode (hot reload)
./mvnw quarkus:dev

# Run tests
./mvnw test

# Build JAR
./mvnw clean package

# Build native image
./mvnw package -Pnative -Dquarkus.native.container-build=true
```

### Testing Endpoints

```bash
# Health check
curl http://localhost:9003/api/v11/health

# System info
curl http://localhost:9003/api/v11/info

# Performance test
curl "http://localhost:9003/api/v11/performance?iterations=100000&threads=4"

# Metrics (Prometheus)
curl http://localhost:9003/q/metrics
```

---

## Performance Characteristics

### Current Performance (November 2025)

| Metric | Value |
|--------|-------|
| Baseline TPS | 776K |
| Target TPS | 2M+ |
| Latency (P50) | <2ms (gRPC) |
| Startup Time | <1s (native) |
| Memory Usage | <256MB (native) |
| Consensus Finality | <500ms |

### Optimization Techniques

1. **Virtual Threads** (Java 21): 4M max threads
2. **Lock-Free Data Structures**: ConcurrentHashMap, AtomicLong
3. **Batch Processing**: 10K-500K transactions per batch
4. **xxHash**: 10x faster than SHA-256
5. **Parallel Consensus**: 8-16x replication parallelism
6. **SIMD Optimization**: 512-bit vector processing
7. **AI-Driven Ordering**: ML-based transaction scoring

---

## Summary

The Aurigraph V11 backend provides a comprehensive REST API gateway for the Enterprise Portal, with high-performance gRPC internal communication. The architecture supports 2M+ TPS through advanced optimizations in transaction processing, consensus, and cryptography. All endpoints are documented with clear request/response formats, making integration straightforward for the Portal development team.

**Recommended Entry Point**: Use `PortalAPIGateway` (`/api/v11`) for all Portal API requests.  
**Technology Stack**: Java 21, Quarkus 3.29.0, PostgreSQL, gRPC, Quantum Cryptography  
**Deployment**: Docker containers or native GraalVM executables  
**Monitoring**: Prometheus metrics at `/q/metrics`, Health checks at `/api/v11/health`

