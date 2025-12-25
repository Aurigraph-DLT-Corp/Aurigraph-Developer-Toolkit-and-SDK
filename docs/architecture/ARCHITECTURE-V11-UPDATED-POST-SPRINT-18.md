# Aurigraph V11 Architecture Documentation (Post-Sprint 18 Update)

**Version**: 4.0  
**Date**: November 2025  
**Status**: Production-ready (Sprint 18 complete)  
**Next Phase**: Sprint 19 Gateway Implementation

---

## 1. System Architecture Overview

### 1.1 High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        Client Layer                             │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │ REST Clients │  │ gRPC Clients │  │ WebSocket    │          │
│  │ (V10 compat) │  │ (Native V11)  │  │ Subscriptions│          │
│  └──────────────┘  └──────────────┘  └──────────────┘          │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│                     API Gateway Layer                           │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │ NGINX Load Balancer (TLS 1.3, mTLS)                       │ │
│  │ - REST-to-gRPC Gateway (Sprint 19)                        │ │
│  │ - Traffic Splitting (Canary deployments)                  │ │
│  │ - Rate Limiting & DDoS Protection                         │ │
│  │ - Request Tracing & Correlation IDs                       │ │
│  └────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│                   Aurigraph V11 Service Layer                   │
│  ┌──────────────────┐  ┌──────────────────┐  ┌─────────────┐  │
│  │ REST API         │  │ gRPC Services    │  │ WebSocket   │  │
│  │ (JAX-RS)         │  │ (Protocol Buffers)│ │ Server      │  │
│  └──────────────────┘  └──────────────────┘  └─────────────┘  │
│           ↓                     ↓                    ↓           │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │              Core Consensus & Processing                 │  │
│  │  ┌────────────────┐  ┌──────────────────────────────┐   │  │
│  │  │ HyperRAFT++    │  │ Transaction Processor        │   │  │
│  │  │ Consensus      │  │ - Validation & Execution     │   │  │
│  │  │ - Voting Round │  │ - Smart Contract Execution   │   │  │
│  │  │ - Log Rep.     │  │ - State Updates              │   │  │
│  │  │ - Leader Elec. │  └──────────────────────────────┘   │  │
│  │  └────────────────┘                                       │  │
│  │                                                             │  │
│  │  ┌────────────────┐  ┌──────────────────────────────┐   │  │
│  │  │ AI Optimization│  │ Cross-Chain Bridge           │   │  │
│  │  │ - ML Ordering  │  │ - Oracle Integration         │   │  │
│  │  │ - Online Learn.│  │ - Multi-chain State Sync     │   │  │
│  │  └────────────────┘  └──────────────────────────────┘   │  │
│  │                                                             │  │
│  │  ┌────────────────┐  ┌──────────────────────────────┐   │  │
│  │  │ RWA Registry   │  │ Crypto & Security            │   │  │
│  │  │ - Asset Token. │  │ - NIST Level 5 Crypto        │   │  │
│  │  │ - Fractional   │  │ - TLS/mTLS Management        │   │  │
│  │  │ - Oracles      │  │ - Key Rotation (Auto)        │   │  │
│  │  └────────────────┘  └──────────────────────────────┘   │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│                    Data & State Layer                           │
│  ┌──────────────────┐  ┌──────────────────┐  ┌─────────────┐  │
│  │ PostgreSQL       │  │ Redis Cache      │  │ Kafka       │  │
│  │ - Ledger & State │  │ - Session Data   │  │ - Events &  │  │
│  │ - Transactions   │  │ - Consensus Msgs │  │   Webhooks  │  │
│  │ - Blocks & Votes │  │ - Metrics Cache  │  │             │  │
│  └──────────────────┘  └──────────────────┘  └─────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│                   Observability Layer                           │
│  ┌────────────┐  ┌────────────┐  ┌────────────┐ ┌───────────┐ │
│  │ Prometheus │  │ Grafana    │  │ ELK Stack  │ │ OpenTelem │ │
│  │ - Metrics  │  │ - Dashbds  │  │ - Logs     │ │ - Tracing │ │
│  │ - Alerts   │  │ - Trending │  │ - Analysis │ │ - Spans   │ │
│  └────────────┘  └────────────┘  └────────────┘ └───────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

### 1.2 Deployment Architecture

```
┌─────────────────────────────────────────┐
│    Docker Container Orchestration       │
│  ┌──────────────────────────────────┐  │
│  │ 4-Node Aurigraph V11 Cluster     │  │
│  │  ┌──────────────────────────────┤  │
│  │  │ Node 1 (Validator) - Leader   │  │
│  │  │ Node 2 (Validator) - Follower │  │
│  │  │ Node 3 (Validator) - Follower │  │
│  │  │ Node 4 (Validator) - Follower │  │
│  │  └──────────────────────────────┤  │
│  │                                   │  │
│  │ Supporting Services:              │  │
│  │  • PostgreSQL 16 (Primary+Standby)│  │
│  │  • Redis 7 (with Sentinel HA)    │  │
│  │  • Consul (Service Discovery)    │  │
│  │  • NGINX (Load Balancer + TLS)   │  │
│  │  • Prometheus (Metrics)          │  │
│  │  • Grafana (Dashboards)          │  │
│  │  • Elasticsearch (Logs)          │  │
│  │  • Logstash (Log Processing)     │  │
│  │  • Kibana (Visualization)        │  │
│  │  • OTEL Collector (Tracing)      │  │
│  │  • Jaeger (Trace Storage)        │  │
│  └──────────────────────────────────┘  │
└─────────────────────────────────────────┘
```

---

## 2. Core Components

### 2.1 Consensus Layer: HyperRAFT++

**Component**: `HyperRAFTConsensusService`

```java
public class HyperRAFTConsensusService {
    // Leader election: 150-300ms timeout range
    public void startElection()
    
    // Log replication: Pipelined, batched, compressed
    public void appendEntries(List<LogEntry> entries)
    
    // Voting round: Parallel voting optimization
    public VotingResult conductVotingRound(VotingRound round)
    
    // Byzantine detection: Monitor voting behavior
    public void monitorByzantineActivity()
    
    // Snapshot management: For fast recovery
    public void createSnapshot(long index, byte[] state)
}
```

**Performance** (Current):
- Voting latency: p99 <50ms
- Finality: <500ms
- TPS: 776K baseline

**Performance** (Sprint 21 Target):
- Voting latency: p99 <10ms (80% improvement)
- Finality: <100ms (80% improvement)
- TPS: 2M+ (158% improvement)

### 2.2 Transaction Processing

**Component**: `TransactionService`

```java
public class TransactionService {
    // Receive and queue transaction
    public CompletableFuture<TransactionReceipt> submitTransaction(
        SubmitTransactionRequest request)
    
    // Validate transaction (signature, gas, nonce)
    public ValidationResult validateTransaction(Transaction tx)
    
    // Execute transaction (state changes)
    public ExecutionResult executeTransaction(Transaction tx)
    
    // Track transaction state (PENDING → CONFIRMED → FINALIZED)
    public TransactionStatus getStatus(String transactionId)
}
```

### 2.3 Data Synchronization (Sprint 19)

**Component**: `DataSyncService` (NEW)

```java
public class DataSyncService {
    // Bidirectional sync: V10 ↔ V11
    public void syncTransactions()  // V10 → V11
    public void syncConsensusVotes()  // V10 → V11
    public void syncAssetRegistry()  // Bidirectional
    
    // Conflict detection and resolution
    public ConflictResolution detectAndResolveConflicts()
    
    // Consistency validation
    public ConsistencyReport validateConsistency()
}
```

---

## 3. Security Architecture

### 3.1 Cryptography Stack

**Digital Signatures**: CRYSTALS-Dilithium (NIST Level 5)
- Key size: 2,592 bytes public, 4,896 bytes private
- Signature: 3,309 bytes
- Quantum-resistant guarantee

**Encryption**: CRYSTALS-Kyber (Module-LWE)
- Key size: 1,568 bytes public
- Perfect forward secrecy with ECDHE hybrid

**Transport**: TLS 1.3 + mTLS
- Cipher suites: AES-256-GCM, ChaCha20-Poly1305
- Client authentication via mTLS certificates
- Automatic certificate rotation (30-day pre-expiry)

### 3.2 Security Layers

```
Layer 1: Network (TLS 1.3 everywhere)
Layer 2: Authentication (mTLS + JWT)
Layer 3: Authorization (RBAC)
Layer 4: Encryption (AES-256 at rest)
Layer 5: Auditing (ELK logs + OpenTelemetry)
```

---

## 4. API Specifications

### 4.1 REST API (V10 Compatible)

**Base URL**: `https://dlt.aurigraph.io/api/v11`

**Endpoints**:
```
POST   /transactions              - Submit transaction
GET    /transactions/{id}         - Get transaction status
GET    /blockchain/transactions   - List transactions (paginated)
GET    /consensus/status          - Consensus state
GET    /nodes                     - List nodes
GET    /health                    - Health check
GET    /analytics/dashboard       - Dashboard data
```

### 4.2 gRPC Services (Native)

**Services**:
- `TransactionService`: Submit and query transactions
- `ConsensusService`: Consensus voting and election
- `BlockService`: Block queries
- `BridgeService`: Cross-chain communication
- `RWAService`: Asset tokenization

---

## 5. Data Model

### 5.1 Transaction State Machine

```
┌──────────┐
│ RECEIVED │
└─────┬────┘
      │
      ↓
┌──────────────┐
│ PENDING      │ (Awaiting consensus voting)
└─────┬────────┘
      │ (Voting round 1, 2, 3, ...)
      ↓
┌──────────────┐
│ CONFIRMED    │ (In consensus log, waiting for finality)
└─────┬────────┘
      │ (All followers applied)
      ↓
┌──────────────┐
│ FINALIZED    │ (Irreversible, safe from Byzantine forks)
└──────────────┘
```

### 5.2 Consensus Vote Structure

```proto
message VotingRound {
    string voting_round_id = 1;
    int64 term = 2;
    string leader_id = 3;
    repeated Vote votes = 4;
    int64 timestamp = 5;
    bytes commitment_hash = 6;
}

message Vote {
    string voter_id = 1;
    bool approved = 2;
    bytes signature = 3;
    int64 created_at = 4;
}
```

---

## 6. Performance Characteristics

### 6.1 Current Performance (Sprint 18)

| Metric | Value | Target |
|--------|-------|--------|
| **TPS** | 776K | 2M+ |
| **Voting Latency (p99)** | 40ms | <10ms |
| **Finality Latency (p99)** | <500ms | <100ms |
| **Memory per node** | ~500MB | <256MB |
| **CPU utilization** | 65% | <50% |

### 6.2 Optimization Roadmap (Sprints 19-21)

**Sprint 19**: +0% TPS (focus on compatibility)  
**Sprint 20**: +5% TPS (WebSocket overhead)  
**Sprint 21**: +158% TPS (parallel voting, ML, network)

---

## 7. Deployment Configuration

### 7.1 Docker Compose (Development)

```yaml
services:
  aurigraph-v11-node-1:
    image: aurigraph-v11:11.0.0
    environment:
      QUARKUS_PROFILE: tls
      AURIGRAPH_NODE_ID: validator-1
      CONSENSUS_CLUSTER_NODES: validator-1,node-2,node-3,node-4
    ports:
      - "9443:9443"  # HTTPS
      - "9444:9444"  # gRPC
      
  postgres:
    image: postgres:16-alpine
    environment:
      POSTGRES_DB: aurigraph_v11
      
  redis:
    image: redis:7-alpine
    command: redis-server --appendonly yes
```

### 7.2 Kubernetes (Production - Sprint 22)

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: aurigraph-v11-validator
spec:
  replicas: 4
  template:
    spec:
      containers:
      - name: aurigraph-v11
        image: aurigraph-v11:11.0.0-native
        resources:
          requests:
            memory: "256Mi"
            cpu: "1000m"
        livenessProbe:
          httpGet:
            path: /q/health
            port: 9003
          initialDelaySeconds: 10
          periodSeconds: 5
```

---

## 8. Monitoring & Observability

### 8.1 Key Metrics

**Consensus Metrics**:
- `aurigraph_consensus_node_state`: Node status (LEADER, FOLLOWER, CANDIDATE)
- `aurigraph_voting_latency_ms`: Voting round latency
- `aurigraph_consensus_finality_ms`: Time to finality
- `aurigraph_byzantine_nodes_detected`: Count of suspected Byzantine nodes

**Transaction Metrics**:
- `aurigraph_tps`: Transactions per second
- `aurigraph_transaction_latency_ms`: End-to-end latency
- `aurigraph_transaction_errors`: Error count by type

**System Metrics**:
- `jvm_memory_used_bytes`: JVM memory
- `jvm_gc_time_ms`: Garbage collection time
- `process_cpu_seconds_total`: CPU usage

### 8.2 Alerting Rules (25+ rules)

**Critical**:
- Consensus quorum lost (<3 nodes online)
- All nodes down
- Byzantine nodes detected (>1)
- Certificate expired

**High**:
- Node down (unavailable >30s)
- Voting latency SLA breach (p99 >50ms)
- Finality latency SLA breach (p99 >500ms)
- Transaction error rate >1%

---

## 9. Security Compliance

**Certifications Achieved**:
- ✅ SOC 2 Type II (Sprint 18)
- ✅ NIST Level 5 quantum cryptography
- ✅ TLS 1.3 everywhere
- ✅ mTLS service-to-service

**Compliance Targets**:
- ✅ HIPAA (health data protection)
- ✅ PCI-DSS (payment processing)
- ✅ GDPR (data protection)

---

## 10. Future Enhancements (Roadmap)

**Sprint 19** (Dec 2025):
- REST-to-gRPC gateway
- Traffic splitting & canary
- Data sync framework

**Sprint 20** (Dec 2025):
- WebSocket subscriptions
- Smart contract EVM
- RWA oracle integration

**Sprint 21** (Jan 2026):
- 2M+ TPS optimization
- ML transaction ordering
- Network optimization

**Sprint 22** (Jan 2026):
- Multi-cloud (AWS, Azure, GCP)
- Kubernetes orchestration
- Multi-region failover

**Sprint 23** (Feb 2026):
- V10 deprecation
- Production cutover
- V11 as primary

---

**Version**: 4.0  
**Status**: APPROVED  
**Last Updated**: November 2025  
**Next Review**: Post-Sprint 19 (Dec 21, 2025)
