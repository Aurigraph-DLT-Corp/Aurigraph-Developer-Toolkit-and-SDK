## Digital Twin Asset Tokenization (Composite Tokens)

### 5.1 Composite Token Framework

Composite Tokens extend the Aurigraph platform with a **hierarchical digital twin framework** for real-world assets, creating an immutable cryptographic chain linking physical assets to verified digital representations.

#### 5.1.1 Framework Overview

**Conceptual Architecture - 5-Layer Stack**:

```
┌──────────────────────────────────────────────────┐
│ EXECUTION LAYER (ActiveContract)                 │
│ - Contract terms, parties, states                │
│ - Bound to 1 Composite Token (1:1 binding)       │
│ - Status: PENDING → ACTIVE → EXECUTED            │
│ - Registry: ActiveContractMerkleRegistry         │
└──────────────┬───────────────────────────────────┘
               │ Bound To
               ▼
┌──────────────────────────────────────────────────┐
│ COMPOSITE TOKEN LAYER (Digital Twin Bundle)      │
│ - Created after 3rd-party oracle verification    │
│ - Contains: 1 Primary + N Secondary tokens       │
│ - Hash: Deterministic SHA-256 (digital twin)     │
│ - Merkle Root: 4-level tree structure            │
│ - Signature: CRYSTALS-Dilithium quantum key      │
│ - Registry: CompositeTokenMerkleRegistry         │
│ - Status: CREATED → VERIFIED → BOUND             │
└──────────────┬───────────────────────────────────┘
        ▲      │      ▲
        │      │      │
   Primary Secondary Binding
   Token  Tokens    Proof
        │      │      │
┌───────┴──────┴──────┴────────────────────────────┐
│ EVIDENCE LAYER                                   │
│ ┌────────────────────┐  ┌──────────────────────┐ │
│ │ PRIMARY TOKEN      │  │ SECONDARY TOKENS     │ │
│ ├────────────────────┤  ├──────────────────────┤ │
│ │ - Asset ID         │  │ - Tax receipts       │ │
│ │ - Owner KYC ID     │  │ - Government IDs     │ │
│ │ - Token Value      │  │ - Property photos    │ │
│ │ - Merkle Path      │  │ - Video verification │ │
│ │ - Status Enum      │  │ - 3rd-party certs    │ │
│ │ - Registry: TMR    │  │ - Registry: TMR      │ │
│ └────────────────────┘  └──────────────────────┘ │
│  All tokens linked in TokenMerkleRegistry        │
└──────────────┬────────────────────────────────────┘
               │ All Linked To
               ▼
┌──────────────────────────────────────────────────┐
│ ASSET LAYER (Real-World Asset)                   │
│ - Physical asset metadata                        │
│ - Type, location, condition, documentation       │
│ - Owner/custodian information                    │
│ - IoT sensor data (if applicable)                │
│ - Registry: AssetMerkleRegistry                  │
│ - Linked to Primary Token (1:1)                  │
└──────────────────────────────────────────────────┘
```

#### 5.1.2 Composite Token Lifecycle

**State Transition Machine**:

```
CREATION PHASE:
  PRIMARY TOKEN CREATED (asset → KYC-verified primary token)
    ↓
  SECONDARY TOKENS UPLOADED (documents, photos, videos, certs)
    ↓
  SECONDARY TOKENS VERIFIED (oracle verifies each document)
    ↓

VERIFICATION PHASE:
  COMPOSITE TOKEN CREATED (deterministic hash computed)
    ↓
  ORACLE VERIFIES COMPOSITE (validates merkle tree integrity)
    ↓
  COMPOSITE VERIFIED (oracle CRYSTALS-Dilithium signature added)
    ↓

BINDING PHASE:
  AWAITING CONTRACT SELECTION (verified composite ready)
    ↓
  BOUND TO CONTRACT (1:1 link with ActiveContract)
    ↓

EXECUTION PHASE:
  CONTRACT ACTIVE (parties execute against digital twin)
    ↓
  CONTRACT EXECUTED (immutable final record)
```

#### 5.1.3 Merkle Tree Architecture (Triple Registry)

**Registry 1: Asset Registry** (Enhanced)
```
Merkle Tree Structure:
├─ Root (SHA-256 of all assets)
├─ Branch 1 (Real Estate)
│  ├─ Leaf: Asset-001 (Property A) → Primary Token-001 → Composite-001
│  ├─ Leaf: Asset-002 (Property B) → Primary Token-002 → Composite-002
│  └─ Leaf: Asset-003 (Property C)
├─ Branch 2 (Carbon Credits)
│  └─ ... (similar structure)
└─ Branch 3 (Commodities)
   └─ ... (similar structure)
```

**Registry 2: Token Merkle Registry** (Enhanced)
```
Merkle Tree Structure:
├─ Root (SHA-256 of all tokens)
├─ Primary Tokens Subtree
│  ├─ Leaf: Token-001 (for Asset-001)
│  ├─ Leaf: Token-002 (for Asset-002)
│  └─ Leaf: Token-003 (for Asset-003)
├─ Secondary Tokens Subtree
│  ├─ Leaf: SecToken-001-001 (Tax receipt for Token-001)
│  ├─ Leaf: SecToken-001-002 (Gov ID for Token-001)
│  ├─ Leaf: SecToken-001-003 (Photo for Token-001)
│  ├─ Leaf: SecToken-002-001 (Certificate for Token-002)
│  └─ ... (all secondary tokens)
└─ Extensions:
   ├─ Primary token status tracking
   ├─ Secondary token verification status
   └─ Binding to composite tokens
```

**Registry 3: Composite Token Merkle Registry** (NEW)
```
Merkle Tree Structure (4-Level):
├─ Root (Master merkle root of all composites)
├─ Composite Token 1 (Digital Twin for Asset-001)
│  ├─ Level 1: Primary Token-001 hash
│  ├─ Level 2: Secondary Tokens Merkle Root
│  │  ├─ Tax Receipt hash
│  │  ├─ Gov ID hash
│  │  ├─ Photo hash
│  │  └─ Video hash
│  ├─ Level 3: Contract Binding hash (if bound)
│  └─ Level 4: Composite Root Hash
├─ Composite Token 2 (Digital Twin for Asset-002)
│  └─ ... (same 4-level structure)
└─ ... (all composite tokens)
```

**Registry 4: Contract Registry** (Enhanced for composites)
```
Merkle Tree Structure:
├─ Root (Hash of all contracts)
├─ Branch: Active Contracts (not yet bound)
│  └─ Leaf: Contract-001 (PENDING)
└─ Branch: Bound Contracts (linked to composites)
   ├─ Leaf: Contract-002 (BOUND to Composite-001)
   ├─ Leaf: Contract-003 (BOUND to Composite-002)
   └─ ... (all bound contracts)
```

#### 5.1.4 Cryptographic Proof Chain

**Digital Twin Hash Computation** (Deterministic):
```
digitalTwinHash = SHA-256(
    HASH(primaryToken) ||
    HASH(sortedSecondaryTokens[]) ||
    HASH(assetMetadata) ||
    TIMESTAMP
)
```

**Composite Merkle Root**:
```
compositeRoot = SHA-256(
    SHA-256(primaryTokenHash, secondaryTokensMerkleRoot) ||
    TIMESTAMP ||
    oraclePublicKey
)
```

**Oracle Signature** (CRYSTALS-Dilithium - NIST Level 5):
```
oracleSignature = SIGN(
    compositeTokenId +
    digitalTwinHash +
    compositeRoot +
    verificationTimestamp,
    oracleQuantumPrivateKey
)
```

**Binding Proof** (Links Composite to Contract):
```
bindingProof = {
    compositeTokenId,
    activeContractId,
    bindingTimestamp,
    merkleProofs: {
        assetMerkleProof,
        tokenMerkleProof,
        compositeMerkleProof,
        contractMerkleProof
    },
    bindingSignature: SIGN(
        compositeTokenId + activeContractId + bindingTimestamp,
        compositeVerifierQuantumKey
    )
}
```

**External Verification** (Decentralized, No Central Authority):
```
verifyComposite(compositeTokenId, proofs):
  1. Replay assetMerkleProof against assetMerkleRoot
  2. Replay tokenMerkleProof against tokenMerkleRoot
  3. Replay compositeMerkleProof against compositeMerkleRoot
  4. Recompute digitalTwinHash from primary + secondary tokens
  5. Verify oracle signature with oracle's public key
  6. If bound: Verify binding proof against contract registry
  7. Return: {verified: true/false, inconsistencies: []}
```

#### 5.1.5 Trusted Oracle Integration

**Oracle Role**:
- Independent 3rd party (certified auditor, notary, government entity)
- Verifies secondary token authenticity
- Signs composite token verification with quantum key
- Maintains immutable audit trail

**Oracle Verification Workflow**:
```
1. Oracle receives verification request for composite
   ↓
2. Oracle reviews:
   - Primary token (asset owner, KYC status)
   - Secondary tokens (documents, photos, videos)
   - Document hashes (SHA-256 verification)
   ↓
3. Oracle validates:
   - All documents authentic
   - Signatures and certifications valid
   - Digital twin accurately represents asset
   ↓
4. Oracle signs with CRYSTALS-Dilithium key:
   - Signs: compositeTokenId + digitalTwinHash + timestamp
   ↓
5. Oracle publishes verification immutably:
   - Signature stored in database
   - Event published: CompositeTokenVerifiedEvent
   - Status: VERIFIED
   ↓
6. System updates composite:
   - Status → VERIFIED
   - Oracle signature + verification timestamp stored
   - Ready for contract binding
```

#### 5.1.6 Data Persistence Strategy

**Primary Storage**:
- **PostgreSQL 16**: All entities (Assets, Tokens, Composites, Contracts)
- **LevelDB** (embedded): Merkle tree nodes and proofs
- **S3/Cloud Storage**: Encrypted document storage (immutable, AES-256)

**Merkle Tree Caching**:
- **Redis**: Cache merkle proofs (24-hour TTL)
- **Hazelcast**: Distributed cache for multi-node consistency

**Audit Trail**:
- **Immutable Tables**: oracle_verifications, composite_token_bindings
- **Event Log**: All state transitions logged with timestamp + actor

### 5.2 REST API Endpoints (Composite Token)

**25+ New Endpoints across 6 endpoint groups**:

```
PRIMARY TOKEN ENDPOINTS:
POST   /api/v11/rwa/tokens/primary/create
GET    /api/v11/rwa/tokens/primary/{tokenId}
GET    /api/v11/rwa/tokens/primary/asset/{assetId}
POST   /api/v11/rwa/tokens/primary/{tokenId}/verify
PUT    /api/v11/rwa/tokens/primary/{tokenId}/status

SECONDARY TOKEN ENDPOINTS:
POST   /api/v11/rwa/tokens/primary/{primaryTokenId}/secondary/upload
GET    /api/v11/rwa/tokens/secondary/{secondaryTokenId}
GET    /api/v11/rwa/tokens/primary/{primaryTokenId}/secondary
POST   /api/v11/rwa/tokens/secondary/{secondaryTokenId}/verify
DELETE /api/v11/rwa/tokens/secondary/{secondaryTokenId}

COMPOSITE TOKEN ENDPOINTS:
POST   /api/v11/rwa/tokens/composite/create
GET    /api/v11/rwa/tokens/composite/{compositeTokenId}
POST   /api/v11/rwa/tokens/composite/{compositeTokenId}/verify
GET    /api/v11/rwa/tokens/composite/{compositeTokenId}/merkle-proofs
GET    /api/v11/rwa/tokens/primary/{primaryTokenId}/composite

COMPOSITE-CONTRACT BINDING ENDPOINTS:
POST   /api/v11/rwa/composite-tokens/{compositeTokenId}/bind-to-contract
GET    /api/v11/rwa/composite-tokens/{compositeTokenId}/bound-contract
GET    /api/v11/rwa/contracts/{contractId}/composite-token
GET    /api/v11/rwa/composite-tokens/{compositeTokenId}/binding-proof
GET    /api/v11/rwa/registry/composite-token-contracts

MERKLE REGISTRY ENDPOINTS:
GET    /api/v11/rwa/registry/composite-tokens
GET    /api/v11/rwa/registry/composite-tokens/{tokenId}/proof
POST   /api/v11/rwa/registry/verify-composite-token
GET    /api/v11/rwa/registry/consistency-report

ORACLE MANAGEMENT ENDPOINTS:
GET    /api/v11/rwa/oracles
POST   /api/v11/rwa/oracles/register
GET    /api/v11/rwa/oracles/{oracleId}/verifications
POST   /api/v11/rwa/webhooks/oracle-verification
```
