# Aurigraph V11 Node Architecture Design

**Document Version**: 1.0
**Date**: October 10, 2025
**JIRA**: AV11-193
**Status**: ✅ Complete
**Author**: Backend Development Agent (BDA)

---

## Executive Summary

This document defines the architecture for Aurigraph V11's multi-node system, supporting four distinct node types that work together to create a scalable, high-performance blockchain network capable of 2M+ TPS.

**Node Types**:
1. **Channel Nodes** - Multi-channel data flow coordination
2. **Validator Nodes** - HyperRAFT++ consensus participation
3. **Business Nodes** - Business logic and smart contract execution
4. **API Integration Nodes** - External data source integration

---

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Node Types Specification](#node-types-specification)
3. [Communication Protocols](#communication-protocols)
4. [State Management](#state-management)
5. [Configuration System](#configuration-system)
6. [Scalability Design](#scalability-design)
7. [Security Architecture](#security-architecture)
8. [Deployment Model](#deployment-model)

---

## 1. Architecture Overview

### 1.1 System Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                    Aurigraph V11 Network                     │
│                                                               │
│  ┌───────────────┐    ┌───────────────┐    ┌──────────────┐│
│  │ Channel Nodes │◄───┤Validator Nodes├───►│Business Nodes││
│  │  (Data Flow)  │    │  (Consensus)  │    │   (Logic)    ││
│  └───────┬───────┘    └───────┬───────┘    └──────┬───────┘│
│          │                    │                     │        │
│          └────────────────────┼─────────────────────┘        │
│                               │                              │
│                    ┌──────────▼──────────┐                  │
│                    │ API Integration     │                  │
│                    │ Nodes (External)    │                  │
│                    └─────────────────────┘                  │
│                               │                              │
└───────────────────────────────┼──────────────────────────────┘
                                │
                    ┌───────────▼───────────┐
                    │  External APIs        │
                    │  - Alpaca Markets     │
                    │  - Weather.com        │
                    │  - Oracles            │
                    └───────────────────────┘
```

### 1.2 Core Principles

1. **Separation of Concerns**: Each node type has a specific responsibility
2. **Horizontal Scalability**: Add more nodes to increase capacity
3. **Fault Tolerance**: System continues operating if nodes fail
4. **Performance**: Optimized for 2M+ TPS target
5. **Security**: Quantum-resistant cryptography throughout

### 1.3 Technology Stack

**Backend**:
- Quarkus 3.26.2 (Reactive programming with Mutiny)
- Java 21 (Virtual Threads for concurrency)
- gRPC (Inter-node communication)
- WebSocket (Real-time client updates)

**Data Layer**:
- LevelDB (Embedded per-node storage)
- Redis (Distributed caching)
- PostgreSQL (Shared state when needed)

**Communication**:
- gRPC (Node-to-node)
- WebSocket (Node-to-client)
- HTTP/2 + TLS 1.3 (External APIs)

---

## 2. Node Types Specification

### 2.1 Channel Nodes

**Purpose**: Coordinate multi-channel data flows and participant management

**Responsibilities**:
- Manage channel lifecycle (create, update, close)
- Track channel participants and permissions
- Route messages between channel members
- Maintain channel state consistency
- Handle off-chain data when appropriate

**Key Features**:
```java
public class ChannelNode {
    private String nodeId;
    private NodeType nodeType = NodeType.CHANNEL;
    private Map<String, Channel> activeChannels;
    private ChannelRouter router;
    private ParticipantRegistry participantRegistry;

    // Core operations
    public Uni<Channel> createChannel(ChannelConfig config);
    public Uni<Void> addParticipant(String channelId, String participantId);
    public Uni<Message> routeMessage(String channelId, Message message);
    public Uni<ChannelState> getChannelState(String channelId);
}
```

**Performance Targets**:
- Channel creation: <10ms
- Message routing: <5ms
- Support: 10,000+ concurrent channels per node
- Throughput: 500K messages/sec per node

**Configuration Schema**:
```json
{
  "nodeType": "CHANNEL",
  "nodeId": "channel-node-001",
  "maxChannels": 10000,
  "maxParticipantsPerChannel": 1000,
  "messageQueueSize": 100000,
  "enableOffChainData": true,
  "persistenceBackend": "leveldb",
  "cacheSize": "2GB"
}
```

---

### 2.2 Validator Nodes

**Purpose**: Participate in HyperRAFT++ consensus and validate transactions

**Responsibilities**:
- Participate in consensus rounds
- Validate transaction batches
- Propose and vote on blocks
- Maintain blockchain state
- Execute consensus algorithm (HyperRAFT++)

**Key Features**:
```java
public class ValidatorNode {
    private String nodeId;
    private NodeType nodeType = NodeType.VALIDATOR;
    private ConsensusRole currentRole; // LEADER, FOLLOWER, CANDIDATE
    private BlockchainState blockchainState;
    private HyperRAFTEngine consensusEngine;

    // Core operations
    public Uni<Block> proposeBlock(List<Transaction> transactions);
    public Uni<Vote> voteOnProposal(String proposalId);
    public Uni<ConsensusState> getConsensusState();
    public Uni<ValidatorMetrics> getMetrics();
}
```

**Performance Targets**:
- Block proposal time: <500ms
- Consensus finality: <1s
- TPS per validator: 200K+
- Total network TPS: 2M+ (with 10+ validators)

**Configuration Schema**:
```json
{
  "nodeType": "VALIDATOR",
  "nodeId": "validator-node-001",
  "consensusAlgorithm": "HyperRAFT++",
  "minValidators": 4,
  "quorumPercentage": 67,
  "blockTime": 500,
  "blockSize": 10000,
  "enableAIOptimization": true,
  "quantumResistant": true,
  "stakingAmount": "1000000"
}
```

---

### 2.3 Business Nodes

**Purpose**: Execute business logic and smart contract operations

**Responsibilities**:
- Process transaction requests
- Execute smart contracts (Ricardian contracts)
- Handle business logic workflows
- Integrate with enterprise systems
- Track business metrics

**Key Features**:
```java
public class BusinessNode {
    private String nodeId;
    private NodeType nodeType = NodeType.BUSINESS;
    private SmartContractExecutor contractExecutor;
    private WorkflowEngine workflowEngine;
    private MetricsCollector metricsCollector;

    // Core operations
    public Uni<TransactionResult> executeTransaction(Transaction tx);
    public Uni<ContractResult> executeContract(ContractRequest request);
    public Uni<WorkflowStatus> runWorkflow(WorkflowDefinition workflow);
    public Uni<BusinessMetrics> getMetrics();
}
```

**Performance Targets**:
- Transaction execution: <20ms
- Contract execution: <100ms
- Throughput: 100K transactions/sec per node
- Contract call throughput: 50K calls/sec per node

**Configuration Schema**:
```json
{
  "nodeType": "BUSINESS",
  "nodeId": "business-node-001",
  "maxConcurrentTransactions": 10000,
  "contractExecutionTimeout": 5000,
  "workflowEngine": "Camunda",
  "enableRicardianContracts": true,
  "complianceMode": "strict",
  "auditLogging": true
}
```

---

### 2.4 API Integration Nodes (External Integration (EI) Nodes)

**Purpose**: Integrate with external APIs and data sources for real-world asset tokenization

**Status**: ✅ Production Deployed - November 1, 2025

**Core Concept**: Slim nodes (also called API Integration Nodes) serve as specialized data ingestion and tokenization orchestrators that connect Aurigraph to external data sources and push processed data to the tokenization channel for asset registration and token creation.

**Responsibilities**:
- Connect to external APIs and data sources
- Fetch, validate, and transform external data
- Cache external data with TTL management
- Push validated data to tokenization channel
- Provide oracle services for smart contracts
- Handle API rate limiting and error recovery
- Monitor data quality and freshness

**External Data Source Integrations**:

1. **Financial Markets** (Alpaca API)
   - Stock prices, indices, commodities
   - Real-time and historical market data
   - Portfolio data for algorithmic trading

2. **Real Estate Data** (Property APIs)
   - Property valuations and appraisals
   - Market data and comparables
   - Title and ownership records

3. **Carbon Credits & ESG** (Carbon APIs)
   - Carbon offset prices
   - ESG ratings and certifications
   - Sustainability metrics

4. **Supply Chain** (IOT/Logistics APIs)
   - Product location and status
   - Temperature/humidity monitoring
   - Chain of custody verification

5. **Weather & Environmental** (Weather APIs)
   - Real-time weather conditions
   - Environmental impact data
   - Climate risk assessments

**Key Features**:
```java
public class SlimNode implements APIIntegrationNode {
    private String nodeId;
    private NodeType nodeType = NodeType.API_INTEGRATION;

    // External API clients
    private Map<String, APIClient> apiClients;

    // Data processing and caching
    private DataCache dataCache;
    private DataValidator dataValidator;
    private DataTransformer dataTransformer;

    // Tokenization integration
    private TokenizationChannel tokenizationChannel;
    private OracleService oracleService;

    // Core operations
    public Uni<MarketData> fetchMarketData(String symbol);
    public Uni<WeatherData> fetchWeather(String location);
    public Uni<PropertyData> fetchPropertyData(String propertyId);
    public Uni<CarbonData> fetchCarbonData(String assetId);

    // Data push to tokenization
    public Uni<Void> pushToTokenizationChannel(ExternalData data);
    public Uni<OracleData> provideOracleData(String dataType);
    public Uni<CacheStats> getCacheStatistics();

    // Data validation
    public Uni<Boolean> validateData(ExternalData data);
    public Uni<DataQualityScore> assessDataQuality(ExternalData data);
}
```

**Data Tokenization Pipeline**:

```
External API → External Integration (EI) Node → Validation → Transformation → Tokenization Channel
                    ↓
              Data Cache
              (TTL: 5min)
                    ↓
              Smart Contracts
              (Token Creation)
```

**Workflow Example - Real Estate Tokenization**:
```
1. Fetch property data from real estate API
2. Validate property information and ownership
3. Retrieve current market valuation
4. Assess carbon footprint impact
5. Push to tokenization channel with metadata:
   {
     "assetType": "REAL_ESTATE",
     "propertyId": "prop-12345",
     "address": "123 Main St, Boston, MA",
     "valuation": 500000,
     "currency": "USD",
     "lastUpdated": "2025-11-01T10:30:00Z",
     "source": "Zillow API",
     "confidence": 0.95,
     "carbonFootprint": "Medium"
   }
6. Smart contract creates fractional tokens
7. Tokens available for trading
```

**Performance Targets**:
- API call latency: <100ms (with caching)
- Cache hit rate: >90%
- Data freshness: <5s for critical data
- Data validation: <10ms per record
- Throughput: 10K external API calls/sec, 100K TPS data events
- Concurrent connections: 1000+ to external APIs

**Configuration Schema**:
```json
{
  "nodeType": "API_INTEGRATION",
  "nodeId": "slim-1",
  "description": "External API and tokenization orchestrator",
  "apiConfigs": {
    "alpaca": {
      "apiKey": "encrypted",
      "baseUrl": "https://api.alpaca.markets",
      "rateLimit": 200,
      "enabled": true,
      "dataTypes": ["STOCK_PRICES", "COMMODITIES", "INDICES"]
    },
    "realEstateProvider": {
      "apiKey": "encrypted",
      "baseUrl": "https://api.realtyprovider.com",
      "rateLimit": 100,
      "enabled": true,
      "dataTypes": ["PROPERTY_VALUES", "MARKET_DATA", "TITLES"]
    },
    "carbonOffsets": {
      "apiKey": "encrypted",
      "baseUrl": "https://api.carbonoffsets.com",
      "rateLimit": 50,
      "enabled": true,
      "dataTypes": ["CARBON_CREDITS", "ESG_RATINGS"]
    },
    "supplyChain": {
      "apiKey": "encrypted",
      "baseUrl": "https://api.supplychain.com",
      "rateLimit": 150,
      "enabled": true,
      "dataTypes": ["TRACKING_DATA", "CHAIN_OF_CUSTODY"]
    },
    "weatherAPI": {
      "apiKey": "encrypted",
      "baseUrl": "https://api.weather.com",
      "rateLimit": 75,
      "enabled": true,
      "dataTypes": ["WEATHER_CONDITIONS", "ENVIRONMENTAL_IMPACT"]
    }
  },
  "dataProcessing": {
    "cacheSize": "5GB",
    "cacheTTL": 300,
    "validationEnabled": true,
    "dataQualityThreshold": 0.8,
    "transformationRules": "transformers/standard-rules.json"
  },
  "tokenization": {
    "channelName": "TOKENIZATION_EVENTS",
    "batchSize": 1000,
    "batchTimeoutSeconds": 5,
    "enableAIValidation": true
  },
  "monitoring": {
    "metricsEnabled": true,
    "metricsPort": 9090,
    "healthCheckPort": 9091,
    "logLevel": "INFO",
    "dataQualityMonitoring": true,
    "apiHealthMonitoring": true
  }
}
```

**Caching Strategy**:
```
Cache Tiers:
├─ L1: In-Memory Cache (1GB, <1ms latency)
│  └─ Hot data (frequently accessed)
├─ L2: Distributed Cache/Redis (2GB, <10ms latency)
│  └─ Recent data
└─ L3: Persistent Storage (2GB, <100ms latency)
   └─ Historical data for analytics

Cache Invalidation:
- TTL-based: 5 minutes for market data, 1 hour for property data
- Event-based: Invalidate on data source updates
- Size-based: LRU eviction when capacity exceeded
```

**Data Quality Assurance**:
```java
public class DataQualityValidator {
    // Validation checks
    public boolean validateCompleteness(ExternalData data);  // All required fields
    public boolean validateFormat(ExternalData data);        // Correct data types
    public boolean validateRange(ExternalData data);         // Values within bounds
    public boolean validateConsistency(ExternalData data);   // Logical consistency
    public float calculateQualityScore(ExternalData data);   // 0.0 - 1.0 score
}
```

**Error Handling & Recovery**:
```
API Failure Scenarios:
├─ Rate Limited: Exponential backoff (1s, 2s, 4s, 8s, 16s)
├─ Connection Timeout: Retry with 30s pause
├─ Invalid Data: Log & skip, use cached version
├─ Authentication Error: Alert operator, retry with credentials
└─ Service Down: Use fallback data source, notify consumers

Circuit Breaker:
- Open: Stop calling failed API (5+ consecutive failures)
- Half-Open: Allow 1 test call to see if recovered
- Closed: Normal operation
- Timeout: 60 seconds
```

**Metrics & Monitoring**:
```
Key Metrics:
- api_call_latency_ms: Per-API call latency
- cache_hit_ratio: Percentage of cached vs fresh requests
- data_quality_score: Average quality of data returned
- api_availability: % uptime per API
- tokenization_events_pushed: Events sent to tokenization channel
- external_data_freshness_seconds: Time since last refresh
```

---

## 3. Communication Protocols

### 3.1 Inter-Node Communication (gRPC)

**Protocol**: gRPC with Protocol Buffers

**Message Types**:
```protobuf
// Node-to-Node Communication
service NodeCommunication {
  rpc SendMessage(NodeMessage) returns (MessageResponse);
  rpc SyncState(StateRequest) returns (StateResponse);
  rpc ProposeBlock(BlockProposal) returns (VoteResponse);
  rpc StreamEvents(EventFilter) returns (stream Event);
}

message NodeMessage {
  string from_node_id = 1;
  string to_node_id = 2;
  MessageType type = 3;
  bytes payload = 4;
  int64 timestamp = 5;
  string signature = 6;
}
```

**Performance Requirements**:
- Latency: <5ms (same data center)
- Throughput: 100K messages/sec per connection
- Reliability: At-least-once delivery
- Security: Mutual TLS authentication

### 3.2 Node-to-Client Communication (WebSocket)

**Protocol**: WebSocket over HTTP/2

**Event Types**:
```typescript
interface NodeEvent {
  eventType: 'CHANNEL_UPDATE' | 'CONSENSUS_STATE' | 'TRANSACTION' | 'METRIC';
  nodeId: string;
  timestamp: number;
  data: any;
}

// Real-time event streaming
ws.on('channel.update', (data: ChannelUpdate) => { ... });
ws.on('consensus.state', (data: ConsensusState) => { ... });
ws.on('transaction.confirmed', (data: Transaction) => { ... });
```

**Performance Requirements**:
- Connection establishment: <100ms
- Event latency: <50ms
- Concurrent connections: 10K per node
- Message throughput: 50K events/sec

### 3.3 External API Communication (HTTP/2)

**Protocol**: HTTPS with TLS 1.3

**Features**:
- Connection pooling
- Request retry with exponential backoff
- Circuit breaker pattern
- Rate limiting (per-API)
- Response caching

---

## 4. State Management

### 4.1 Per-Node State (LevelDB)

Each node maintains its own embedded LevelDB instance:

```java
public class NodeStateManager {
    private LevelDBService levelDB;

    // State operations
    public void saveState(String key, byte[] value);
    public byte[] loadState(String key);
    public void deleteState(String key);

    // Atomic batch operations
    public void batchUpdate(Map<String, byte[]> updates);
}
```

**State Categories**:
- Configuration state
- Runtime state (channels, connections)
- Cache state (recent data)
- Metrics state (performance data)

### 4.2 Shared State (Redis)

For state that needs to be shared across nodes:

```java
public class SharedStateManager {
    private RedisClient redis;

    // Shared state operations
    public void publishState(String channel, NodeState state);
    public Observable<NodeState> subscribeToState(String channel);

    // Distributed locks
    public Lock acquireLock(String resource);
}
```

**Use Cases**:
- Leader election coordination
- Distributed locks
- Pub/sub messaging
- Global configuration updates

### 4.3 Blockchain State (Validator Nodes)

Validators maintain the canonical blockchain state:

```java
public class BlockchainStateManager {
    private BlockTree blockTree;
    private StateTree stateTree; // Merkle tree

    // State operations
    public Block getBlock(String blockHash);
    public TransactionReceipt getTransaction(String txHash);
    public AccountState getAccount(String address);

    // State transitions
    public void applyBlock(Block block);
    public void revertBlock(Block block);
}
```

---

## 5. Configuration System

### 5.1 Configuration Hierarchy

```
Global Configuration (network-wide)
  ├── Node Type Defaults (per node type)
  │   ├── Channel Node Defaults
  │   ├── Validator Node Defaults
  │   ├── Business Node Defaults
  │   └── API Integration Node Defaults
  └── Node Instance Configuration (per node)
      ├── Node-specific overrides
      └── Runtime configuration
```

### 5.2 Configuration Schema

**Base Node Configuration**:
```json
{
  "nodeId": "unique-node-id",
  "nodeType": "CHANNEL|VALIDATOR|BUSINESS|API_INTEGRATION",
  "version": "11.0.0",
  "network": {
    "networkId": "aurigraph-mainnet",
    "bootstrapNodes": ["node1:9000", "node2:9000"],
    "maxPeers": 100,
    "enableDiscovery": true
  },
  "performance": {
    "threadPoolSize": 256,
    "queueSize": 100000,
    "batchSize": 1000
  },
  "security": {
    "enableTLS": true,
    "tlsCertPath": "/etc/aurigraph/tls/cert.pem",
    "tlsKeyPath": "/etc/aurigraph/tls/key.pem",
    "quantumResistant": true
  },
  "monitoring": {
    "metricsEnabled": true,
    "metricsPort": 9090,
    "healthCheckPort": 9091,
    "logLevel": "INFO"
  }
}
```

### 5.3 Configuration Management

**Dynamic Configuration Updates**:
```java
@ConfigurationProperties("node")
public class NodeConfiguration {
    private String nodeId;
    private NodeType nodeType;
    private NetworkConfig network;
    private PerformanceConfig performance;

    // Hot reload support
    @ConfigProperty(name = "node.performance.threadPoolSize", dynamic = true)
    int threadPoolSize;
}
```

**Configuration API**:
```
GET  /api/v11/config/node/{nodeId}      - Get node configuration
PUT  /api/v11/config/node/{nodeId}      - Update node configuration
POST /api/v11/config/validate           - Validate configuration
POST /api/v11/config/reload             - Reload configuration
```

---

## 6. Scalability Design

### 6.1 Horizontal Scaling Strategy

**Channel Nodes**: Scale by adding more nodes
```
1 Channel Node  = 500K msg/sec, 10K channels
10 Channel Nodes = 5M msg/sec, 100K channels
```

**Validator Nodes**: Optimal range 7-21 nodes
```
7 Validators  = 1.4M TPS (minimum for production)
10 Validators = 2.0M TPS (recommended)
21 Validators = 4.2M TPS (maximum throughput)
```

**Business Nodes**: Scale based on workload
```
1 Business Node = 100K tx/sec
20 Business Nodes = 2M tx/sec
```

**API Integration Nodes**: Scale per API
```
Alpaca API Node = 10K calls/sec
Weather API Node = 10K calls/sec
Oracle Nodes = 50K requests/sec
```

### 6.2 Auto-Scaling Policies

**Metrics-Based Scaling**:
```java
public class AutoScalingPolicy {
    // Scale up when
    - CPU usage > 80% for 5 minutes
    - Queue depth > 50K for 3 minutes
    - Response time > 100ms for 2 minutes

    // Scale down when
    - CPU usage < 20% for 10 minutes
    - Queue depth < 5K for 10 minutes
    - Excess capacity > 50% for 15 minutes
}
```

### 6.3 Load Balancing

**Node Selection Strategy**:
```java
public class NodeLoadBalancer {
    // Round-robin for equal distribution
    public Node selectNode_RoundRobin();

    // Least connections for optimal utilization
    public Node selectNode_LeastConnections();

    // Weighted round-robin based on capacity
    public Node selectNode_Weighted();

    // Consistent hashing for data locality
    public Node selectNode_ConsistentHash(String key);
}
```

---

## 7. Security Architecture

### 7.1 Node Authentication

**Mutual TLS (mTLS)**:
- All node-to-node communication requires mTLS
- X.509 certificates issued by Aurigraph CA
- Certificate rotation every 90 days

**Node Identity**:
```java
public class NodeIdentity {
    private String nodeId;           // UUID
    private PublicKey publicKey;     // CRYSTALS-Dilithium
    private X509Certificate certificate;
    private Instant certExpiry;

    public boolean verify(byte[] signature, byte[] data);
}
```

### 7.2 Message Security

**Message Signing**:
```java
public class SecureMessage {
    private NodeMessage message;
    private byte[] signature; // Dilithium signature
    private long timestamp;
    private String nonce;

    public boolean verifySignature();
    public boolean checkReplay(); // Prevent replay attacks
}
```

### 7.3 Access Control

**Role-Based Access Control (RBAC)**:
```
Roles:
- ADMIN: Full node control
- OPERATOR: Node operations (start/stop/configure)
- MONITOR: Read-only access to metrics
- CLIENT: Transaction submission only

Permissions Matrix:
┌──────────┬───────┬──────────┬─────────┬────────┐
│ Resource │ ADMIN │ OPERATOR │ MONITOR │ CLIENT │
├──────────┼───────┼──────────┼─────────┼────────┤
│ Config   │  RW   │    R     │    R    │   -    │
│ State    │  RW   │    R     │    R    │   -    │
│ Metrics  │  RW   │    RW    │    R    │   -    │
│ Tx       │  RW   │    RW    │    R    │   W    │
└──────────┴───────┴──────────┴─────────┴────────┘
```

---

## 8. Deployment Model

### 8.1 Container-Based Deployment (Docker)

**Node Container Image**:
```dockerfile
FROM eclipse-temurin:21-jre-alpine
COPY aurigraph-node.jar /app/node.jar
COPY config/ /app/config/
EXPOSE 9003 9004 9090 9091
ENTRYPOINT ["java", "-jar", "/app/node.jar"]
```

**Docker Compose Example**:
```yaml
services:
  channel-node-1:
    image: aurigraph/node:11.0.0
    environment:
      NODE_TYPE: CHANNEL
      NODE_ID: channel-node-001
    ports:
      - "9003:9003"
      - "9004:9004"
    volumes:
      - ./data/channel-1:/data

  validator-node-1:
    image: aurigraph/node:11.0.0
    environment:
      NODE_TYPE: VALIDATOR
      NODE_ID: validator-node-001
    ports:
      - "9013:9003"
      - "9014:9004"
    volumes:
      - ./data/validator-1:/data
```

### 8.2 Kubernetes Deployment

**Node Deployment Manifest**:
```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: channel-nodes
spec:
  replicas: 5
  selector:
    matchLabels:
      app: aurigraph-node
      type: channel
  template:
    metadata:
      labels:
        app: aurigraph-node
        type: channel
    spec:
      containers:
      - name: channel-node
        image: aurigraph/node:11.0.0
        env:
        - name: NODE_TYPE
          value: "CHANNEL"
        - name: NODE_ID
          valueFrom:
            fieldRef:
              fieldPath: metadata.name
        ports:
        - containerPort: 9003
        - containerPort: 9004
        resources:
          requests:
            memory: "2Gi"
            cpu: "2"
          limits:
            memory: "4Gi"
            cpu: "4"
        livenessProbe:
          httpGet:
            path: /q/health/live
            port: 9091
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /q/health/ready
            port: 9091
          initialDelaySeconds: 10
          periodSeconds: 5
```

### 8.3 Node Discovery

**Service Discovery via Kubernetes**:
```java
public class KubernetesNodeDiscovery implements NodeDiscovery {
    private KubernetesClient k8sClient;

    @Override
    public List<Node> discoverNodes(NodeType type) {
        // Query Kubernetes service endpoints
        EndpointsList endpoints = k8sClient.endpoints()
            .inNamespace("aurigraph")
            .withLabel("type", type.name().toLowerCase())
            .list();

        return endpoints.getItems().stream()
            .map(this::toNode)
            .collect(Collectors.toList());
    }
}
```

---

## 9. Implementation Roadmap

### Phase 1: Foundation (Weeks 1-2)
- ✅ Define node interfaces and base classes
- ✅ Implement configuration system
- ✅ Set up gRPC communication
- ✅ Create node state management

### Phase 2: Node Implementation (Weeks 3-5)
- ⏳ Implement Channel Node (Week 3)
- ⏳ Implement Validator Node (Week 4)
- ⏳ Implement Business Node (Week 4)
- ⏳ Implement API Integration Node (Week 5)

### Phase 3: Integration (Weeks 6-7)
- ⏳ Inter-node communication testing
- ⏳ WebSocket client integration
- ⏳ External API integrations (Alpaca, Weather)
- ⏳ End-to-end testing

### Phase 4: Production Readiness (Weeks 8-10)
- ⏳ Performance optimization
- ⏳ Security hardening
- ⏳ Monitoring and alerting setup
- ⏳ Production deployment

---

## 10. Acceptance Criteria

### Architecture Design (AV11-193)
- ✅ Complete architecture document (this document)
- ✅ Node type specifications defined
- ✅ Communication protocols specified
- ✅ Configuration schema designed
- ✅ Deployment model documented
- ✅ Security architecture defined

### Implementation Readiness
- ✅ Technology stack selected
- ✅ Performance targets defined
- ✅ Scalability strategy documented
- ✅ Security requirements specified
- ✅ Deployment approach finalized

---

## Appendix A: Node Interface Definitions

```java
public interface Node {
    String getNodeId();
    NodeType getNodeType();
    NodeStatus getStatus();
    Uni<Boolean> start();
    Uni<Boolean> stop();
    Uni<NodeHealth> healthCheck();
    Uni<NodeMetrics> getMetrics();
}

public enum NodeType {
    CHANNEL,
    VALIDATOR,
    BUSINESS,
    API_INTEGRATION
}

public enum NodeStatus {
    INITIALIZING,
    RUNNING,
    PAUSED,
    STOPPED,
    ERROR
}
```

---

## Appendix B: Performance Benchmarks

| Metric | Target | Current | Status |
|--------|--------|---------|--------|
| Network TPS | 2M+ | TBD | 🚧 In Progress |
| Channel Node Throughput | 500K msg/sec | TBD | 🚧 In Progress |
| Validator Block Time | <500ms | TBD | 🚧 In Progress |
| Business Node Tx/sec | 100K | TBD | 🚧 In Progress |
| API Call Latency | <100ms | TBD | 🚧 In Progress |

---

## Document Status

**Status**: ✅ **Complete and Approved**
**JIRA Ticket**: AV11-193
**Next Steps**: Begin Channel Node implementation (AV11-194)

---

**Last Updated**: October 10, 2025
**Review Date**: October 17, 2025
**Version**: 1.0

---

*End of Architecture Design Document*
