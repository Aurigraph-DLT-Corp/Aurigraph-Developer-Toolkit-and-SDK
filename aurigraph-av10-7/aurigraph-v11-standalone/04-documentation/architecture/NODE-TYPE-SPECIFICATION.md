# Aurigraph V12 Node Type Specification

**Version:** 12.0.0
**Last Updated:** December 2025
**Status:** Production Ready

---

## Table of Contents

1. [Overview](#overview)
2. [Node Type Summary](#node-type-summary)
3. [Core Node Types](#core-node-types)
4. [Infrastructure Node Types](#infrastructure-node-types)
5. [Enterprise Node Types](#enterprise-node-types)
6. [LevelDB Storage Integration](#leveldb-storage-integration)
7. [Node Lifecycle Management](#node-lifecycle-management)
8. [API Reference](#api-reference)
9. [Performance Specifications](#performance-specifications)

---

## Overview

Aurigraph V12 implements a comprehensive multi-node architecture designed for enterprise-grade blockchain operations. The platform supports 11 distinct node types, each optimized for specific functions within the distributed ledger ecosystem.

### Design Principles

- **Separation of Concerns**: Each node type handles specific responsibilities
- **Horizontal Scalability**: Nodes can be scaled independently based on workload
- **Fault Tolerance**: HyperRAFT++ consensus with 67% quorum requirement
- **Data Isolation**: Per-node LevelDB storage with encryption
- **High Performance**: Target 2M+ TPS across the network

### Package Structure

```
io.aurigraph.v11.nodes/
├── NodeType.java              # Enum defining all 11 node types
├── NodeStatus.java            # Node status enumeration
├── NodeFactory.java           # Unified factory for node creation
├── GenericNodeService.java    # Abstract base service class
├── ValidatorNode.java         # Consensus validator implementation
├── ValidatorNodeService.java  # Validator service layer
├── BusinessNode.java          # Transaction/contract processor
├── BusinessNodeService.java   # Business service layer
├── EINode.java                # Enterprise infrastructure node
├── EINodeService.java         # EI service layer
├── NodeManagementResource.java # Unified REST API
└── NodeStorageService.java    # LevelDB persistence layer
```

---

## Node Type Summary

| # | Type | Purpose | Consensus | Stores Chain | Class |
|---|------|---------|-----------|--------------|-------|
| 1 | VALIDATOR | HyperRAFT++ consensus & validation | ✅ | ✅ | ValidatorNode |
| 2 | BUSINESS | Transaction execution & contracts | ❌ | ✅ | BusinessNode |
| 3 | CHANNEL | Multi-channel data flows | ❌ | ❌ | ChannelNode |
| 4 | API_INTEGRATION | External API integration | ❌ | ❌ | BusinessNode |
| 5 | FULL_NODE | Complete blockchain storage | ❌ | ✅ | BusinessNode |
| 6 | LIGHT_CLIENT | Minimal blockchain storage | ❌ | ❌ | BusinessNode |
| 7 | ARCHIVE | Complete historical data | ❌ | ✅ | BusinessNode |
| 8 | BOOT_NODE | Network discovery | ❌ | ❌ | ValidatorNode |
| 9 | RPC_NODE | JSON-RPC API access | ❌ | ✅ | BusinessNode |
| 10 | EI_NODE | Enterprise Infrastructure | ❌ | ❌ | EINode |
| 11 | BRIDGE_VALIDATOR | Cross-chain bridge validation | ✅ | ❌ | ValidatorNode |

---

## Core Node Types

### 1. VALIDATOR Node

**Purpose:** Participates in HyperRAFT++ consensus and validates transactions/blocks.

**Implementation:** `ValidatorNode.java`

#### Configuration Parameters

| Parameter | Value | Description |
|-----------|-------|-------------|
| QUORUM_PERCENTAGE | 67% | Required votes for consensus |
| BLOCK_TIME_MS | 500ms | Target block production interval |
| MAX_BLOCK_SIZE | 10,000 tx | Maximum transactions per block |
| MAX_MEMPOOL_SIZE | 1,000,000 tx | Maximum pending transactions |

#### Key Features

1. **Block Validation**
   - Transaction signature verification
   - State transition validation
   - Merkle root verification
   - Cross-reference with previous block

2. **Consensus Participation**
   - Leader election based on stake weight
   - Block proposal when elected leader
   - Vote casting on proposed blocks
   - Quorum verification (67%+)

3. **Mempool Management**
   - Transaction queuing (FIFO)
   - Duplicate detection
   - Priority ordering by gas price
   - Automatic pruning

4. **Staking Operations**
   - Token staking for consensus eligibility
   - Unstaking with cooldown period
   - Reward distribution
   - Slashing for misbehavior

#### State Variables

```java
AtomicLong currentBlockHeight      // Current block height
AtomicLong validatedTransactions   // Total validated transactions
AtomicLong proposedBlocks          // Blocks proposed by this node
AtomicInteger consensusRound       // Current consensus round
AtomicBoolean isLeader             // Leader status
BigDecimal stakedAmount            // Staked token amount
int reputationScore                // Node reputation (0-100)
```

#### Methods

| Method | Description |
|--------|-------------|
| `validateBlock(height, transactions)` | Validate a proposed block |
| `validateTransaction(txId)` | Validate single transaction |
| `proposeBlockIfLeader()` | Propose block when leader |
| `voteOnBlock(height, voterId, approve)` | Cast vote on block |
| `hasQuorum(height)` | Check if quorum reached |
| `becomeLeader()` | Accept leader role |
| `stepDown()` | Relinquish leader role |
| `stake(amount)` | Stake tokens |
| `unstake(amount)` | Unstake tokens |
| `addToMempool(txId)` | Add transaction to mempool |
| `connectPeer(peerId)` | Connect to peer node |

---

### 2. BUSINESS Node

**Purpose:** Executes business logic, smart contracts, and processes transactions.

**Implementation:** `BusinessNode.java`

#### Configuration Parameters

| Parameter | Value | Description |
|-----------|-------|-------------|
| MAX_CONCURRENT_TRANSACTIONS | 10,000 | Maximum parallel transactions |
| CONTRACT_EXECUTION_TIMEOUT_MS | 5,000ms | Contract execution timeout |
| MAX_GAS_LIMIT | 10,000,000 | Maximum gas per transaction |
| STATE_CACHE_SIZE_MB | 1,024 MB | State cache size |
| MAX_AUDIT_ENTRIES | 10,000 | Maximum audit log entries |

#### Key Features

1. **Transaction Processing**
   - Asynchronous execution with CompletableFuture
   - Transaction validation and routing
   - Gas metering and accounting
   - State updates with rollback support

2. **Smart Contract (Ricardian) Execution**
   - Contract registration and storage
   - Execution with gas tracking
   - State persistence
   - Event emission

3. **Workflow Orchestration**
   - Multi-step workflow support
   - Step completion tracking
   - Result aggregation
   - Workflow state management

4. **Audit Logging**
   - Transaction audit trail
   - Contract execution logs
   - Workflow step logging
   - Timestamp and entity tracking

#### State Variables

```java
AtomicLong executedTransactions    // Total executed transactions
AtomicLong executedContracts       // Total contract executions
AtomicLong failedTransactions      // Failed transaction count
AtomicLong totalGasUsed            // Cumulative gas consumption
AtomicInteger pendingTransactions  // Queue size
AtomicInteger activeExecutions     // Currently executing
Map<String, ContractState> contracts    // Contract registry
Map<String, WorkflowState> workflows    // Active workflows
Map<String, Object> stateCache          // State cache
List<AuditEntry> auditLog               // Audit trail
```

#### Inner Classes

```java
TransactionRequest {
    String transactionId
    String contractId
    Map<String, Object> payload
    Map<String, Object> stateUpdates
    long gasLimit
    CompletableFuture<TransactionResult> resultFuture
}

TransactionResult {
    String transactionId
    boolean success
    String message
    long gasUsed
}

ContractState {
    String contractId
    String code
    Map<String, Object> state
    int executionCount
    Instant lastExecuted
}

WorkflowState {
    String workflowId
    String workflowType
    Map<String, Object> params
    List<String> completedSteps
    Map<String, Object> results
    Instant startedAt
}

AuditEntry {
    Instant timestamp
    String action
    String entityId
    String details
}
```

---

### 3. CHANNEL Node

**Purpose:** Manages multi-channel data flows and participant coordination.

**Implementation:** `ChannelNode.java` (extends AbstractNode)

#### Key Features

1. **Channel Management**
   - Channel creation and deletion
   - Participant enrollment
   - Access control enforcement
   - Channel metadata management

2. **Data Flow Coordination**
   - Message routing between participants
   - Data transformation pipelines
   - Flow rate control
   - Buffering and batching

3. **Participant Coordination**
   - Member role management
   - Permission enforcement
   - Presence tracking
   - Heartbeat monitoring

---

## Infrastructure Node Types

### 4. API_INTEGRATION Node

**Purpose:** Integrates with external APIs and data sources.

**Base Implementation:** BusinessNode

#### Key Features

- External API connectivity
- Request/response transformation
- Rate limiting
- Caching
- Error handling and retry logic

---

### 5. FULL_NODE

**Purpose:** Stores complete blockchain data for querying and validation.

**Base Implementation:** BusinessNode

#### Storage Requirements

| Data Type | Retention | Indexing |
|-----------|-----------|----------|
| Blocks | All | Height, Hash |
| Transactions | All | ID, Block, Sender |
| State | Current | Key |
| Receipts | All | TX ID |

---

### 6. LIGHT_CLIENT

**Purpose:** Minimal storage for mobile/embedded applications.

**Base Implementation:** BusinessNode

#### Storage Requirements

| Data Type | Retention | Description |
|-----------|-----------|-------------|
| Block Headers | All | Only headers |
| Account State | Own only | User accounts |
| Proofs | On-demand | Merkle proofs |

---

### 7. ARCHIVE Node

**Purpose:** Complete historical data storage and analytics.

**Base Implementation:** BusinessNode

#### Additional Features

- Historical state reconstruction
- Time-travel queries
- Analytics support
- Data export capabilities

---

### 8. BOOT_NODE

**Purpose:** Network discovery and peer bootstrapping.

**Base Implementation:** ValidatorNode

#### Key Features

- Peer discovery protocol
- Network topology maintenance
- New node onboarding
- DNS seed functionality

---

### 9. RPC_NODE

**Purpose:** Provides JSON-RPC API access for external applications.

**Base Implementation:** BusinessNode

#### Supported Methods

| Method | Description |
|--------|-------------|
| `eth_blockNumber` | Get current block height |
| `eth_getBalance` | Query account balance |
| `eth_sendTransaction` | Submit transaction |
| `eth_call` | Execute read-only call |
| `eth_getLogs` | Query event logs |

---

## Enterprise Node Types

### 10. EI_NODE (Enterprise Infrastructure)

**Purpose:** Enterprise system integration with exchanges and data feeds.

**Implementation:** `EINode.java`

#### Configuration Parameters

| Parameter | Value | Description |
|-----------|-------|-------------|
| MAX_CONNECTIONS | 100 | Maximum exchange connections |
| MAX_FEEDS | 500 | Maximum data feed subscriptions |
| CONNECTION_TIMEOUT_MS | 30,000ms | Connection timeout |
| MAX_RETRIES | 3 | Request retry attempts |
| CIRCUIT_BREAKER_THRESHOLD | 5 | Failures before circuit opens |
| CIRCUIT_BREAKER_RESET_MS | 60,000ms | Circuit breaker reset time |

#### Key Features

1. **Exchange Connectivity**
   - Multi-exchange support (crypto, stock, commodity)
   - Connection pooling
   - Health monitoring
   - Automatic reconnection

2. **Data Feed Management**
   - Real-time market data
   - Configurable polling intervals
   - Data normalization
   - Event streaming

3. **API Gateway**
   - External API registration
   - Request routing
   - Load balancing
   - Response caching

4. **Circuit Breaker Pattern**
   - Failure detection
   - Automatic circuit opening
   - Half-open testing
   - Automatic recovery

5. **Event Pub/Sub**
   - Topic subscription
   - Event publishing
   - Cross-node routing
   - Subscriber management

#### State Variables

```java
Map<String, ExchangeConnection> exchanges     // Exchange connections
Map<String, DataFeed> dataFeeds               // Active data feeds
Map<String, APIEndpoint> apiEndpoints         // Registered endpoints
Map<String, CircuitBreakerState> circuitBreakers  // Circuit states
Map<String, Set<String>> eventSubscribers     // Event subscriptions
Map<String, Object> dataCache                 // Normalized data cache
AtomicLong messagesReceived                   // Inbound message count
AtomicLong messagesSent                       // Outbound message count
AtomicLong totalDataBytes                     // Total data processed
AtomicLong failedRequests                     // Failed request count
AtomicLong successfulRequests                 // Successful request count
```

#### Inner Classes

```java
ExchangeConnection {
    String exchangeId
    String url
    Map<String, String> credentials
    boolean connected
    Instant connectedAt
    Instant disconnectedAt
    Instant lastHealthCheck
}

DataFeed {
    String feedId
    String source
    String dataType
    long intervalMs
    boolean active
    long lastPolled
    Object lastData
    long messageCount
    long errorCount
}

APIEndpoint {
    String endpointId
    String url
    String method
    Map<String, String> headers
    boolean healthy
    Instant lastCalled
    long successCount
    long errorCount
}

CircuitState { CLOSED, OPEN, HALF_OPEN }
```

---

### 11. BRIDGE_VALIDATOR

**Purpose:** Validates cross-chain bridge transactions.

**Base Implementation:** ValidatorNode

#### Key Features

1. **Cross-Chain Validation**
   - Source chain verification
   - Target chain confirmation
   - Multi-signature validation
   - Proof verification

2. **Bridge Security**
   - Rate limiting
   - Amount thresholds
   - Fraud detection
   - Emergency pause

3. **Supported Chains**
   - Ethereum (L1)
   - Arbitrum (L2)
   - Optimism (L2)
   - Base (L2)
   - Polygon (L2)

---

## LevelDB Storage Integration

### NodeStorageService

Provides unified per-node LevelDB persistence with encryption and access control.

#### Key Prefixes

| Prefix Pattern | Purpose |
|----------------|---------|
| `node:{nodeId}:state:` | Node state data |
| `node:{nodeId}:tx:` | Transactions |
| `node:{nodeId}:block:` | Block data |
| `node:{nodeId}:contract:` | Contract states |
| `node:{nodeId}:audit:` | Audit logs |
| `node:{nodeId}:metrics:` | Metrics snapshots |
| `node:{nodeId}:config:` | Configuration |
| `node:{nodeId}:peer:` | Peer information |

#### Storage Operations

```java
// State Operations
saveNodeState(nodeId, key, value)      // Save state
getNodeState(nodeId, key)              // Get state
getAllNodeState(nodeId)                // Get all state
deleteNodeState(nodeId, key)           // Delete state

// Transaction Operations
storeTransaction(nodeId, txId, data)   // Store transaction
getTransaction(nodeId, txId)           // Get transaction
transactionExists(nodeId, txId)        // Check existence

// Block Operations
storeBlock(nodeId, height, data)       // Store block
getBlock(nodeId, height)               // Get block
getLatestBlockHeight(nodeId)           // Get latest height
getBlocksInRange(nodeId, from, to)     // Range query

// Contract Operations
storeContractState(nodeId, id, data)   // Store contract
getContractState(nodeId, id)           // Get contract
getAllContracts(nodeId)                // List contracts

// Audit Operations
storeAuditEntry(nodeId, id, data)      // Store audit entry
getAuditEntries(nodeId, limit)         // Get recent entries

// Replication
replicateNodeData(source, target, type)  // Cross-node replication
```

#### Security Features

1. **Encryption at Rest**
   - AES-256-GCM encryption
   - Per-node encryption keys
   - Key rotation support

2. **Access Control**
   - Read permission checks
   - Write permission checks
   - Key prefix restrictions

3. **Data Validation**
   - Key format validation
   - Value size limits
   - Character set enforcement

---

## Node Lifecycle Management

### Status Transitions

```
INITIALIZING → CONNECTING → SYNCING → RUNNING
                                         ↓
                                    MAINTENANCE
                                         ↓
STOPPED ← STOPPING ← RUNNING ← DEGRADED
                         ↓
                       ERROR
```

### Status Definitions

| Status | Description | Operational |
|--------|-------------|-------------|
| INITIALIZING | Starting up | No |
| CONNECTING | Connecting to peers | No |
| SYNCING | Synchronizing data | No |
| RUNNING | Fully operational | Yes |
| MAINTENANCE | Maintenance mode | No |
| STOPPING | Shutting down | No |
| STOPPED | Not running | No |
| ERROR | Error state | No |
| DEGRADED | Reduced capacity | Yes |
| UNREACHABLE | Not responding | No |

---

## API Reference

### REST Endpoints

Base path: `/api/v12/nodes`

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/types` | List all node types |
| GET | `/types/{type}` | Get node type details |
| POST | `/` | Create new node |
| GET | `/` | List all nodes |
| GET | `/{type}/{nodeId}` | Get node by ID |
| POST | `/{type}/{nodeId}/start` | Start node |
| POST | `/{type}/{nodeId}/stop` | Stop node |
| POST | `/{type}/{nodeId}/restart` | Restart node |
| DELETE | `/{type}/{nodeId}` | Delete node |
| GET | `/{type}/{nodeId}/health` | Get node health |
| GET | `/{type}/{nodeId}/metrics` | Get node metrics |
| GET | `/health` | All nodes health |
| GET | `/metrics` | All nodes metrics |
| POST | `/{type}/start-all` | Start all of type |
| POST | `/{type}/stop-all` | Stop all of type |

### Request/Response Examples

**Create Node:**
```json
POST /api/v12/nodes
{
  "type": "VALIDATOR",
  "nodeId": "val-prod-001",
  "config": {
    "stake": "1000000"
  }
}
```

**Response:**
```json
{
  "nodeId": "val-prod-001",
  "type": "VALIDATOR",
  "typeDisplayName": "Validator",
  "running": false,
  "healthy": false,
  "isLeader": false,
  "blockHeight": 0,
  "validatedTransactions": 0,
  "connectedPeers": 0,
  "stakedAmount": "0"
}
```

---

## Performance Specifications

### Target Metrics

| Node Type | TPS | Latency | Memory | CPU |
|-----------|-----|---------|--------|-----|
| VALIDATOR | 50K | <100ms | 4GB | 4 cores |
| BUSINESS | 100K | <50ms | 8GB | 8 cores |
| EI_NODE | 10K msg/s | <10ms | 2GB | 2 cores |
| RPC_NODE | 50K req/s | <20ms | 4GB | 4 cores |
| FULL_NODE | N/A | <100ms | 16GB | 4 cores |

### Network Configuration

| Parameter | Value |
|-----------|-------|
| Min Validators | 4 |
| Recommended Validators | 21 |
| Max Validators | 100 |
| Quorum | 67% |
| Block Time | 500ms |
| Finality | <1s |

---

## Appendix

### Node ID Prefixes

| Prefix | Node Type |
|--------|-----------|
| val- | VALIDATOR |
| biz- | BUSINESS |
| chn- | CHANNEL |
| api- | API_INTEGRATION |
| ful- | FULL_NODE |
| lgt- | LIGHT_CLIENT |
| arc- | ARCHIVE |
| bot- | BOOT_NODE |
| rpc- | RPC_NODE |
| ei- | EI_NODE |
| brv- | BRIDGE_VALIDATOR |

### Health Check Components

Each node type reports health based on specific components:

**ValidatorNode:**
- consensus (leader/follower)
- mempool (<90% full)
- peers (≥3 connected)
- staking (>0 staked)

**BusinessNode:**
- transactionQueue (<90% full)
- contracts (count)
- stateCache (size)
- activeExecutions (count)
- failureRate (<5%)

**EINode:**
- exchanges (all connected)
- dataFeeds (>0 active)
- circuitBreakers (none open)
- apiEndpoints (healthy)
- errorRate (<5%)

---

*Document maintained by Aurigraph V12 Platform Team*
