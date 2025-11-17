# Aurigraph HyperRAFT++ Consensus Architecture

**Version**: 11.1.0 | **Section**: Consensus | **Status**: 🟢 Production Ready
**Last Updated**: 2025-11-17 | **Related**: [ARCHITECTURE-MAIN.md](./ARCHITECTURE-MAIN.md)

---

## HyperRAFT++ Algorithm Overview

### Core Principles
- **Deterministic**: Guaranteed finality <500ms
- **Byzantine Tolerant**: Survives f < n/3 faulty nodes
- **AI-Optimized**: Machine learning for transaction ordering
- **Parallel Replication**: Enhanced log replication for higher throughput

### Key Improvements Over Standard RAFT
1. **Parallel Log Replication**: Batch processing instead of single entries
2. **AI-Driven Ordering**: ML models optimize transaction order
3. **Advanced Consensus**: Combines PBFT insights with RAFT simplicity
4. **Energy Efficient**: Reduced message complexity

---

## Transaction Processing Flow (8 Steps)

```
┌──────────────┐
│   Client     │
│ (Enterprise  │
│   Portal)    │
└──────┬───────┘
       │ 1. Submit Transaction
       │ POST /api/v11/transactions
       ▼
┌──────────────────┐
│   API Gateway    │
│  Rate Limiting   │
│  Authentication  │
└──────┬───────────┘
       │ 2. Route to V11
       ▼
┌──────────────────┐
│ TransactionService│ ────┐
│   Validation     │      │ 3. Validate
│   Signature      │      │
└──────┬───────────┘      │
       │                   │
       │ 4. Queue          │
       ▼                   │
┌──────────────────┐      │
│ Transaction Pool │      │
│   (Priority Q)   │      │
└──────┬───────────┘      │
       │                   │
       │ 5. Consensus      │
       ▼                   │
┌──────────────────┐      │
│  HyperRAFT++     │<─────┘
│  - Leader Elect  │
│  - Log Replicate │
└──────┬───────────┘
       │ 6. Commit
       ▼
┌──────────────────┐
│  State Machine   │
│   - Execute      │
│   - Update State │
└──────┬───────────┘
       │ 7. Persist
       ▼
┌──────────────────┐
│  Storage Layer   │
│  - Block DB      │
│  - State DB      │
└──────┬───────────┘
       │ 8. Confirm
       ▼
┌──────────────────┐
│    Response      │
│  (WebSocket +    │
│   REST API)      │
└──────────────────┘
```

---

## Consensus Flow (7-Step HyperRAFT++)

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Node 1    │     │   Node 2    │     │   Node 3    │
│  (Leader)   │     │ (Follower)  │     │ (Follower)  │
└──────┬──────┘     └──────┬──────┘     └──────┬──────┘
       │                   │                   │
       │ 1. Receive Tx     │                   │
       │◄──────────────────┘                   │
       │                                        │
       │ 2. Append Log Entry                   │
       │                                        │
       │ 3. Replicate (Batch)                  │
       ├──────────────────────────────────────>│
       ├──────────────────>│                   │
       │                   │                   │
       │ 4. ACK            │ 4. ACK            │
       │<──────────────────┤<──────────────────┤
       │                   │                   │
       │ 5. Commit (Quorum achieved)           │
       │                                        │
       │ 6. Notify Followers                   │
       ├──────────────────>│                   │
       ├──────────────────────────────────────>│
       │                   │                   │
       │ 7. Apply to State Machine             │
       ▼                   ▼                   ▼
  Finalized            Finalized           Finalized
  (<500ms)             (<500ms)             (<500ms)
```

---

## Leadership Election

**Timeout Range**: 150-300ms
**Heartbeat Interval**: 50ms
**Election Process**:
1. Follower timeout (no heartbeat)
2. Start new election term
3. Request votes from all nodes
4. Highest voted candidate becomes leader
5. Send heartbeat to confirm leadership

---

## Log Replication Strategy

### Batch Replication
```
Leader Log:
Entry 1 (term 1)
Entry 2 (term 1)
Entry 3 (term 2) ← Batch starts here
Entry 4 (term 2)
Entry 5 (term 2)
Entry 6 (term 2)  ← Batch ends

Send Batch { Entry 3-6, term: 2, prevIndex: 2 }
             ↓
Follower receives batch, appends if valid
             ↓
Follower acknowledges batch
             ↓
Leader commits batch on quorum ACK
```

### Quorum Calculation
- **3 nodes**: Need 2 ACKs (simple majority)
- **5 nodes**: Need 3 ACKs
- **7 nodes**: Need 4 ACKs
- **Formula**: f < n/3 (Byzantine tolerance)

---

## Byzantine Fault Tolerance

### Attack Scenarios Handled
1. **Crashed Node**: Continues with remaining nodes
2. **Malicious Node**: Requires 2f+1 total nodes (survives f faulty)
3. **Partition**: Minority partition halts (safety over liveness)
4. **Delayed Messages**: Handled by timeout and retransmission

### Safety Guarantees
- **No forking**: Only one leader per term
- **No double-spending**: Transaction finality guaranteed
- **Consistency**: All nodes see same committed entries
- **Durability**: Committed entries persist

---

## AI-Driven Optimization

### Predictive Transaction Ordering
```
ML Model Input:
- Transaction size
- Sender/receiver relationship
- Historical gas usage
- Current network congestion

ML Model Output:
- Optimal transaction order
- Estimated execution time
- Priority score

Benefit:
- Reduced execution time
- Lower transaction costs
- Better throughput
```

### Consensus Optimization
- Predict optimal batch size
- Adjust heartbeat frequency dynamically
- Detect anomalies in consensus flow
- Recommend parameter tuning

---

## Performance Metrics

| Metric | Current | Target |
|--------|---------|--------|
| **TPS** | 776K | 2M+ |
| **Finality** | <500ms | <100ms |
| **Block Time** | 1-2s | <1s |
| **Message Complexity** | O(n²) | O(n) with batching |
| **Recovery Time** | <5s | <2s |

---

## Configuration Parameters

```properties
# Consensus timeouts
consensus.election.timeout.min=150ms
consensus.election.timeout.max=300ms
consensus.heartbeat.interval=50ms

# Batch processing
consensus.batch.size=1000
consensus.batch.timeout=100ms

# Replication
consensus.replication.retries=3
consensus.replication.timeout=1000ms

# Quorum
consensus.quorum.min=3
consensus.quorum.max=1000

# AI optimization
consensus.ai.enabled=true
consensus.ai.model.path=/models/consensus-optimizer.model
```

---

## Consensus States

```
FOLLOWER
    ↓ (Election timeout)
CANDIDATE
    ├─ (Wins election)
    ↓
LEADER
    └─ (Loses election or detects higher term)
    ↓
FOLLOWER
```

---

## Network Communication

### Message Types
1. **RequestVote**: Candidate requests votes
2. **AppendEntries**: Leader replicates log entries
3. **Heartbeat**: Leader confirms leadership
4. **InstallSnapshot**: Fast state recovery
5. **ACK**: Follower acknowledges receipt

### Network Guarantees
- **Reliability**: TCP/QUIC for guaranteed delivery
- **Ordering**: Messages ordered per peer
- **Encryption**: TLS 1.3 for confidentiality
- **Authentication**: Digital signatures with CRYSTALS-Dilithium

---

## Failure Scenarios & Recovery

### Single Node Failure
- **Detection**: <5s (heartbeat timeout)
- **Recovery**: Automatic failover to other nodes
- **Data**: Replicated state ensures no loss

### Network Partition
- **Behavior**: Minority partition halts (blocks)
- **Majority**: Continues with leader election
- **Healing**: Automatic synchronization on reconnect

### Leader Failure
- **Detection**: Follower timeout (150-300ms)
- **Election**: New leader elected within 300ms
- **State**: No data loss due to replication

---

## Monitoring & Observability

### Key Metrics
- `consensus.term.current` - Current consensus term
- `consensus.leader.id` - Current leader node ID
- `consensus.log.applied` - Last applied index
- `consensus.log.committed` - Last committed index
- `consensus.election.duration` - Time to elect leader
- `consensus.replication.lag` - Follower replication delay

### Alerts
- P0: Leader unavailable >5 seconds
- P1: Replication lag >1 second
- P2: Consensus latency >200ms
- P3: Non-responsive follower

---

**Navigation**: [Main](./ARCHITECTURE-MAIN.md) | [Technology Stack](./ARCHITECTURE-TECHNOLOGY-STACK.md) | [Components](./ARCHITECTURE-V11-COMPONENTS.md) | [APIs](./ARCHITECTURE-API-ENDPOINTS.md) | [Consensus](./ARCHITECTURE-CONSENSUS.md) ← | [Security](./ARCHITECTURE-CRYPTOGRAPHY.md)

🤖 Phase 2 Documentation Chunking
