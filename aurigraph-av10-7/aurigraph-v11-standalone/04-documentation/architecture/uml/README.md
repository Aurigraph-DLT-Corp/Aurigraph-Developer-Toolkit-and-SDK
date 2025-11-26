# Aurigraph V11 UML Architecture Diagrams

**Version**: 1.0.0
**Date**: November 26, 2025
**Status**: Complete
**JIRA**: AV11-463

---

## Overview

This directory contains comprehensive UML diagrams documenting the Aurigraph V11 architecture. All diagrams are created using PlantUML syntax and can be rendered using:

- PlantUML CLI: `plantuml *.puml`
- PlantUML online editor: http://www.plantuml.com/plantuml/uml/
- VS Code extension: "PlantUML" by jebbs
- IntelliJ IDEA: Built-in PlantUML support

---

## Diagram Catalog

### 1. System Component Diagram
**File**: `01-system-component-diagram.puml`
**Type**: Component Diagram
**Purpose**: High-level overview of Aurigraph V11 system architecture

**Key Components**:
- External clients (Enterprise Portal, Wallets, Exchanges)
- API Gateway Layer (NGINX, TLS, Rate Limiting)
- REST API Layer (JAX-RS endpoints)
- gRPC Service Layer (HTTP/2 + Protobuf)
- Core Business Logic (Transaction processing, Consensus, AI, Crypto)
- Storage Layer (RocksDB, PostgreSQL, Redis, Merkle Trees)
- Infrastructure Services (Consul, Vault, Prometheus, Grafana, Keycloak)

**Highlights**:
- Clear separation between external REST APIs and internal gRPC services
- Shows 10x performance improvement with gRPC vs REST
- Illustrates quantum-resistant cryptography integration
- Documents HyperRAFT++ consensus architecture

---

### 2. Transaction Sequence Diagram
**File**: `02-transaction-sequence-diagram.puml`
**Type**: Sequence Diagram
**Purpose**: End-to-end transaction flow from submission to consensus finalization

**Flow**:
1. Client submits transaction via REST API (JSON)
2. REST layer converts to gRPC call (Protobuf)
3. Transaction validation with quantum crypto verification
4. HyperRAFT++ consensus with parallel log replication
5. State commitment to RocksDB
6. Transaction confirmation to client

**Performance Metrics**:
- REST → gRPC conversion: <1ms overhead
- gRPC serialization: ~0.5µs (vs 5µs for JSON)
- Message size: ~300 bytes (Protobuf) vs ~1.2KB (JSON)
- Total latency: <100ms target, <500ms current
- Throughput: 2M+ TPS target, 776K TPS baseline

---

### 3. Multi-Cloud Deployment Diagram
**File**: `03-multi-cloud-deployment-diagram.puml`
**Type**: Deployment Diagram (C4 Model)
**Purpose**: Multi-cloud deployment topology across AWS, Azure, and GCP

**Deployment Topology**:
- **AWS (us-east-1)**: 1 Validator + 1 Business + 4 Slim nodes
- **Azure (westeurope)**: 1 Validator + 1 Business + 4 Slim nodes
- **GCP (asia-northeast1)**: 1 Validator + 1 Business + 4 Slim nodes
- **On-Premise**: 1 Backup Validator + Dev/Test nodes

**Infrastructure**:
- Cloudflare Global CDN for traffic management
- WireGuard VPN mesh for cross-cloud connectivity
- Istio service mesh for mTLS and load balancing
- Consul WAN federation for service discovery
- Centralized monitoring (Prometheus + Grafana)

**Performance Targets**:
- Total TPS: 2M+ (distributed across clouds)
- Validator throughput: 750K TPS each
- Intra-cloud latency: <10ms
- Inter-cloud latency: <50ms
- Global API latency: <200ms

---

### 4. gRPC Service Class Diagram
**File**: `04-grpc-service-class-diagram.puml`
**Type**: Class Diagram
**Purpose**: Detailed class structure of gRPC services and implementations

**Services**:
1. **TransactionService**: TX submission, validation, mempool management
2. **ConsensusService**: HyperRAFT++ log replication, leader election
3. **CryptoService**: Quantum-resistant signing and verification
4. **ContractService**: Smart contract deployment and execution
5. **StorageService**: Key-value state storage with versioning
6. **NetworkService**: P2P message routing and broadcast
7. **TraceabilityService**: Contract-asset bidirectional linking

**Key Features**:
- Auto-generated base classes from Protocol Buffer definitions
- Inheritance from gRPC service stubs
- Dependency injection via CDI
- gRPC server configuration (port 9004, HTTP/2)
- Interceptors for logging, authentication, and metrics

---

### 5. Quantum Cryptography Class Diagram
**File**: `05-quantum-crypto-class-diagram.puml`
**Type**: Class Diagram
**Purpose**: Quantum-resistant cryptography implementation architecture

**Algorithms**:
- **CRYSTALS-Dilithium Level 5**: Digital signatures (NIST PQC standard)
- **CRYSTALS-Kyber Level 5**: Key encapsulation mechanism (NIST PQC standard)

**Key Sizes**:
- Dilithium: 2,592 bytes (public), 4,896 bytes (private), 3,309 bytes (signature)
- Kyber: 1,568 bytes (public), 3,168 bytes (private), 1,568 bytes (ciphertext)

**Features**:
- HSM integration for production key storage
- Automatic key rotation (90-day cycle)
- Key versioning and migration
- Metrics collection (signing/verification times)
- FIPS 140-3 compliance ready

**Performance**:
- Dilithium signing: ~100µs
- Dilithium verification: ~50µs
- Kyber encapsulation: ~80µs
- Kyber decapsulation: ~90µs

---

### 6. HyperRAFT++ Consensus Sequence
**File**: `06-hyperraft-consensus-sequence.puml`
**Type**: Sequence Diagram
**Purpose**: HyperRAFT++ consensus flow with AI optimization

**Phases**:
1. **Leader Election**: Randomized election timeout (150-300ms)
2. **Normal Operation**: AI-optimized batch processing
3. **Parallel Log Replication**: Async gRPC calls to all followers
4. **Quorum Commitment**: Majority of validators (f < n/3)
5. **State Application**: Atomic batch write to RocksDB
6. **Leader Failure**: Re-election with <500ms recovery

**AI Optimization**:
- Transaction dependency analysis
- Dynamic batch sizing (5K-20K TXs)
- Priority-based ordering (0-255 priority levels)
- Network latency prediction
- Validator load balancing
- Adaptive timeout tuning

**Impact**:
- 30% reduction in confirmation time
- 40% increase in effective TPS
- 50% reduction in network overhead

---

### 7. RWAT Asset Tokenization Activity
**File**: `07-rwat-asset-tokenization-activity.puml`
**Type**: Activity Diagram
**Purpose**: Real-world asset tokenization workflow

**Workflow Steps**:
1. Asset owner submits tokenization request
2. Compliance agent reviews documents
3. Oracle network verifies asset ownership
4. Smart contract deployment (ERC-20 compatible)
5. Token minting with metadata
6. Merkle proof generation
7. Traceability linking (contract ↔ asset)
8. RWAT registry registration
9. Secondary market listing (optional)
10. Periodic compliance audits

**Key Features**:
- Multi-oracle verification for accuracy
- Cryptographic Merkle proofs for asset linking
- Bidirectional traceability (O(1) lookups)
- Fractional ownership support
- Compliance freeze mechanism
- Immutable audit trail

**Performance**:
- Tokenization time: <5 minutes
- Oracle verification: <30 seconds
- Merkle proof generation: <1 second
- Token minting: <10 seconds

---

### 8. Cross-Chain Bridge Component
**File**: `08-cross-chain-bridge-component.puml`
**Type**: Component Diagram
**Purpose**: Cross-chain bridge architecture for interoperability

**Supported Chains**:
- Ethereum (Mainnet)
- Binance Smart Chain (BSC)
- Polygon (Matic)
- Avalanche
- Bitcoin (via HTLC)

**Bridge Mechanism**:
1. **Lock Phase**: User locks tokens on source chain
2. **Verify Phase**: Oracle network confirms lock
3. **Mint Phase**: Wrapped tokens minted on target chain
4. **Burn Phase**: User burns wrapped tokens
5. **Unlock Phase**: Original tokens unlocked on source chain

**Security**:
- Multi-signature wallet (3-of-5 validators)
- 24-hour challenge period for fraud proofs
- Oracle aggregation (Chainlink + Band Protocol)
- BLS signature aggregation
- Optimistic verification with dispute resolution

**Performance**:
- Bridge throughput: 1000 TPS per chain
- Average latency: 3-5 minutes (finality dependent)
- Success rate: 99.95%
- Supported chains: 5+ (extensible)

---

## Rendering Instructions

### Using PlantUML CLI

```bash
# Install PlantUML (requires Java)
brew install plantuml  # macOS
sudo apt-get install plantuml  # Ubuntu

# Render all diagrams to PNG
plantuml *.puml

# Render all diagrams to SVG
plantuml -tsvg *.puml

# Render specific diagram
plantuml 01-system-component-diagram.puml
```

### Using VS Code

1. Install "PlantUML" extension by jebbs
2. Open any `.puml` file
3. Press `Alt+D` (Windows/Linux) or `Option+D` (macOS) to preview
4. Right-click → "PlantUML: Export Current Diagram" for PNG/SVG

### Using Online Editor

1. Go to http://www.plantuml.com/plantuml/uml/
2. Copy the contents of any `.puml` file
3. Paste into the editor
4. View rendered diagram
5. Download as PNG/SVG

---

## Integration with Documentation

These UML diagrams are referenced in the following documents:

- `/04-documentation/architecture/GRPC_PROTOBUF_ARCHITECTURE.md`
- `/04-documentation/architecture/MULTI-CLOUD-NODE-ARCHITECTURE.md`
- `/04-documentation/architecture/ENCRYPTION_ARCHITECTURE_DESIGN.md`
- `/ARCHITECTURE.md` (root)
- `/DEVELOPMENT.md` (root)

---

## Maintenance

**Update Frequency**: Monthly or after major architecture changes

**Ownership**: Documentation & DevOps Agent (DDA)

**Review Process**:
1. Architect reviews diagram accuracy
2. Technical lead approves design
3. Update associated markdown documentation
4. Generate PNG/SVG exports
5. Commit to repository

---

## Related Documentation

- **J4C Epic Execution Plan**: `/J4C-EPIC-EXECUTION-PLAN.md`
- **JIRA Ticket**: AV11-463 (UML Documentation - Complete)
- **Architecture Docs**: `/04-documentation/architecture/`
- **Protocol Buffers**: `/src/main/proto/aurigraph_core.proto`
- **gRPC Services**: `/src/main/java/io/aurigraph/v11/grpc/`

---

**Last Updated**: November 26, 2025
**Status**: Complete (8/8 diagrams)
**Version**: 1.0.0
