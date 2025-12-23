# Composite Token Feature - Complete WBS & Architecture

**Feature**: Digital Twin Asset Tokenization with Composite Tokens
**Status**: Awaiting Approval
**Framework**: J4C Multi-Agent Git Worktree Model (6 agents)
**Scope**: 2,580 person-hours over 16 weeks
**Target Release**: February 28, 2026 (Post-RWA Portal v4.6.0)

---

## 📋 Executive Summary

This feature delivers **Composite Token** functionality - a complete digital twin framework where:

1. **Primary Token** = Underlying asset ownership (KYC-verified, unique)
2. **Secondary Tokens** = Supporting documentation and verification (government records, tax receipts, photos, videos, 3rd-party verification)
3. **Composite Token** = Digital twin bundle created after 3rd-party verification
4. **ActiveContract Binding** = Contract execution against composite token
5. **Merkle Tree Registries** = Immutable tracking across all layers

**Key Innovation**: Hierarchical token binding with cryptographic proof chain and trusted 3rd-party verification gates.

---

## 🏗️ Architecture Overview

```
Digital Twin Asset Structure:

┌─────────────────────────────────────────────────────────────┐
│         COMPOSITE TOKEN (Digital Twin Bundle)               │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  ActiveContract Registry (Merkle Tree)                 │ │
│  │  - Contract ID: AVC-2024-001                           │ │
│  │  - Status: Active/Pending/Suspended                    │ │
│  │  - Parties: [KYC-verified identities]                  │ │
│  └────────────────────────────────────────────────────────┘ │
│                            ▲                                 │
│                            │ Bound To                        │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  Composite Token (Created after 3rd-party verification)│ │
│  │  - Status: COMPOSITE_VERIFIED                          │ │
│  │  - Merkle Root: Primary + All Secondary tokens         │ │
│  │  - Digital Twin Hash: SHA-256(all evidence)            │ │
│  │  - Verification Timestamp: Trusted oracle              │ │
│  └────────────────────────────────────────────────────────┘ │
│            ▲                             ▲                   │
│            │                             │                   │
│    Linked (Primary)          Linked (Secondary Bundle)       │
│            │                             │                   │
│  ┌─────────┴────────┐      ┌────────────┴──────────────┐   │
│  │  PRIMARY TOKEN   │      │  SECONDARY TOKENS         │   │
│  │  ────────────────│      │  ────────────────────────│   │
│  │  Asset ID: ...   │      │  • Tax Receipt (Token)    │   │
│  │  Owner: KYC-ID   │      │  • Gov Document (Token)   │   │
│  │  Status: ACTIVE  │      │  • Photo Evidence (Token) │   │
│  │  Value: X units  │      │  • Video Verification ... │   │
│  │  Registry: MTR   │      │  • 3rd-Party Cert (Token) │   │
│  └──────────────────┘      │  Registry: MTR (all)      │   │
│                            └───────────────────────────┘   │
│                                       ▲                     │
│                                       │                     │
│                            3rd-Party Verification          │
│                            (Trusted Oracle)                │
│                                                             │
└─────────────────────────────────────────────────────────────┘
         │
         │ Registered In
         ▼
    Asset Registry (Merkle Tree)
    Token Registry (Merkle Tree)
    Contract Registry (Merkle Tree)
```

---

## 📊 Work Breakdown Structure (WBS)

### **Module 2.0: Composite Token Framework** (2,580 hours, 16 weeks)

---

## **Module 2.1: Primary Token Enhancement** (285 hours, Weeks 1-3)
**Lead Agent**: Agent 2.1 | **Effort**: 95 hrs/week average

### 2.1.1 Primary Token Data Model (40 hours)
- [x] Create `PrimaryTokenEntity.java` with:
  - `tokenId`: UUID, unique per asset
  - `assetId`: Reference to underlying asset
  - `ownerKycId`: KYC-verified owner identity
  - `tokenValue`: Numeric asset value
  - `status`: CREATED → ACTIVE → COMPOSITE_PENDING → COMPOSITE_BOUND
  - `createdAt`: Timestamp
  - `merkleTreePath`: Position in token registry merkle tree
  - `quantumSignature`: CRYSTALS-Dilithium signature

- [x] Create database schema migration (Flyway):
  ```sql
  CREATE TABLE primary_tokens (
    id UUID PRIMARY KEY,
    asset_id UUID NOT NULL REFERENCES assets(id),
    owner_kyc_id VARCHAR(255) NOT NULL,
    token_value NUMERIC(38,18) NOT NULL,
    status VARCHAR(50) DEFAULT 'CREATED',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP,
    merkle_tree_path TEXT,
    quantum_signature BYTEA,
    composite_token_id UUID REFERENCES composite_tokens(id)
  );
  CREATE INDEX idx_primary_tokens_asset_id ON primary_tokens(asset_id);
  CREATE INDEX idx_primary_tokens_owner_kyc_id ON primary_tokens(owner_kyc_id);
  CREATE INDEX idx_primary_tokens_status ON primary_tokens(status);
  ```

- [x] Create JPA repository `PrimaryTokenRepository.java`
- [x] Unit tests: 15 tests (80%+ coverage)

**Deliverables**:
- `PrimaryTokenEntity.java` (100 lines)
- `PrimaryTokenRepository.java` (50 lines)
- Database migration script
- 15 unit tests

**Acceptance Criteria**:
- ✅ Entity persists correctly to PostgreSQL
- ✅ Merkle tree path field supports up to 256-character paths
- ✅ Status enum enforces valid state transitions
- ✅ Quantum signature field handles 3,309-byte CRYSTALS-Dilithium signatures

---

### 2.1.2 Primary Token REST API (50 hours)

**Create `PrimaryTokenResource.java` with endpoints**:

- `POST /api/v11/rwa/tokens/primary/create`
  - Input: `{assetId, ownerKycId, tokenValue}`
  - Output: `{tokenId, status, merkleProof}`
  - Logic: Create primary token, queue for merkle tree inclusion

- `GET /api/v11/rwa/tokens/primary/{tokenId}`
  - Output: Primary token data with current merkle path
  - Logic: Retrieve token with merkle tree verification

- `GET /api/v11/rwa/tokens/primary/asset/{assetId}`
  - Output: All primary tokens for asset
  - Logic: Query by asset with pagination

- `POST /api/v11/rwa/tokens/primary/{tokenId}/verify`
  - Input: `{merkleProof}`
  - Output: `{verified: boolean, proofHash}`
  - Logic: Verify token against merkle tree root

- `PUT /api/v11/rwa/tokens/primary/{tokenId}/status`
  - Input: `{newStatus}`
  - Output: Updated token with status
  - Logic: Update status with validation

**Create `PrimaryTokenService.java`**:
- `createPrimaryToken(assetId, ownerKycId, value)`: Creates token
- `verifyPrimaryToken(tokenId, merkleProof)`: Validates against merkle tree
- `transitionStatus(tokenId, newStatus)`: Manages state machine
- `getMerkleProof(tokenId)`: Generates merkle proof for verification
- `bindToCompositeToken(tokenId, compositeTokenId)`: Links to composite

**Deliverables**:
- `PrimaryTokenResource.java` (200 lines)
- `PrimaryTokenService.java` (300 lines)
- 20 integration tests (REST endpoints)
- API documentation (OpenAPI/Swagger)

**Acceptance Criteria**:
- ✅ All 5 endpoints working with JWT authentication
- ✅ Status transitions enforced (no invalid transitions)
- ✅ Merkle proof generation accurate
- ✅ Response times < 100ms for single token queries

---

### 2.1.3 Primary Token Merkle Tree Integration (60 hours)

**Enhance `MerkleTreeService.java`** to support primary tokens:

- `addPrimaryTokenToTree(tokenId, tokenData)`: Adds token as leaf node
  - Input: Token ID and data hash
  - Output: Merkle path, tree root hash
  - Storage: Update in `token_merkle_tree` table

- `verifyPrimaryTokenMembership(tokenId, merkleProof)`: Proves inclusion
  - Input: Token ID, merkle proof path
  - Output: Boolean (valid/invalid)
  - Logic: Replay hash path to root

- `getPrimaryTokenMerkleProof(tokenId)`: Gets full proof path
  - Output: Array of sibling hashes from token to root
  - Use case: Composite token creation verification

**Create `TokenMerkleTreeRegistry.java`**:
- Table: `token_merkle_trees`
  - Columns: `id, token_id, merkle_path, tree_root, created_at, updated_at`
- Methods:
  - `recordMerkleInclusion(tokenId, proof)`
  - `getMerkleRoot()`
  - `verifySingleTokenProof(tokenId, proof)`

**Deliverables**:
- `TokenMerkleTreeRegistry.java` (150 lines)
- Enhanced `MerkleTreeService.java` methods (200 lines)
- Database migration for `token_merkle_trees` table
- 18 unit tests (merkle tree operations)

**Acceptance Criteria**:
- ✅ O(log n) lookup time for merkle proofs
- ✅ Batch tree updates efficient (< 1s for 1000 tokens)
- ✅ Merkle root immutable once published
- ✅ Proof paths reproducible deterministically

---

### 2.1.4 Primary Token UI Components (60 hours)

**Create `src/components/2.1-primary-token/`**:

1. **`PrimaryTokenCreationForm.tsx`** (100 lines)
   - Form fields: Asset selector, KYC ID lookup, token value input
   - Validation: Asset exists, KYC ID valid, value > 0
   - Success: Display created token ID and merkle path
   - Integration: Calls `POST /api/v11/rwa/tokens/primary/create`

2. **`PrimaryTokenDetailsPage.tsx`** (120 lines)
   - Display: Token ID, asset info, owner KYC, value, status
   - Show merkle proof path in expandable section
   - Action buttons: Verify Token, Bind to Composite, View Asset
   - Integration: Real-time data from `GET /api/v11/rwa/tokens/primary/{id}`

3. **`PrimaryTokenMerkleVisualization.tsx`** (140 lines)
   - D3.js tree visualization showing:
     - Primary token position in merkle tree
     - Sibling node hashes
     - Path to root with visual highlighting
   - Interactive: Click nodes to verify proof

4. **`PrimaryTokenSearch.tsx`** (80 lines)
   - Search by: Token ID, Asset ID, Owner KYC ID
   - Filter by: Status, Date Range
   - Results: Paginated table with quick view

5. **Tests**: `__tests__/components/` (100 lines)
   - Unit tests for form validation
   - Integration tests for API calls
   - Snapshot tests for UI components

**Deliverables**:
- 4 React components with TypeScript
- Custom hooks: `usePrimaryToken()`, `useMerkleProof()`
- Service layer: `primaryTokenAPI.ts`
- 25 unit/integration tests

**Acceptance Criteria**:
- ✅ Form validates all required fields
- ✅ Merkle visualization renders correctly (10,000+ nodes)
- ✅ Search returns results < 500ms
- ✅ Token details auto-refresh every 30 seconds

---

**Module 2.1 Summary**:
- **Effort**: 285 hours (3 weeks, 1 agent)
- **Deliverables**: 6 backend classes, 4 React components, 2 DB migrations
- **Tests**: 60 unit/integration tests
- **Status**: Foundation for composite token primary layer

---

## **Module 2.2: Secondary Token Framework** (420 hours, Weeks 1-4)
**Lead Agent**: Agent 2.2 | **Effort**: 105 hrs/week average

### 2.2.1 Secondary Token Data Model (50 hours)

**Create `SecondaryTokenEntity.java`**:
```java
@Entity
@Table(name = "secondary_tokens")
public class SecondaryTokenEntity {
    @Id private UUID id;
    @Column private UUID primaryTokenId;
    @Column private String documentType; // TAX_RECEIPT, GOV_DOCUMENT, PHOTO, VIDEO, 3RD_PARTY_CERT
    @Column private String documentUrl; // S3 path
    @Column private Long documentSize;
    @Column private String mimeType;
    @Column(columnDefinition = "TEXT") private String documentHash; // SHA-256
    @Column private String verificationStatus; // PENDING, VERIFIED, REJECTED
    @Column private LocalDateTime uploadedAt;
    @Column private LocalDateTime verifiedAt;
    @Column private String verifiedBy; // Trusted oracle/KYC provider
    @Column(columnDefinition = "BYTEA") private byte[] quantumSignature;
    @Column private String merkleTreePath;
    @Column private UUID compositeTokenId;
}
```

**Database Schema**:
```sql
CREATE TABLE secondary_tokens (
    id UUID PRIMARY KEY,
    primary_token_id UUID NOT NULL REFERENCES primary_tokens(id),
    document_type VARCHAR(50) NOT NULL,
    document_url TEXT NOT NULL,
    document_size BIGINT,
    mime_type VARCHAR(100),
    document_hash VARCHAR(64) NOT NULL,
    verification_status VARCHAR(50) DEFAULT 'PENDING',
    uploaded_at TIMESTAMP DEFAULT NOW(),
    verified_at TIMESTAMP,
    verified_by VARCHAR(255),
    quantum_signature BYTEA,
    merkle_tree_path TEXT,
    composite_token_id UUID REFERENCES composite_tokens(id)
);
CREATE INDEX idx_secondary_tokens_primary_token_id ON secondary_tokens(primary_token_id);
CREATE INDEX idx_secondary_tokens_document_type ON secondary_tokens(document_type);
CREATE INDEX idx_secondary_tokens_verification_status ON secondary_tokens(verification_status);
```

**Deliverables**:
- `SecondaryTokenEntity.java`
- `SecondaryTokenRepository.java`
- Database migration (Flyway)
- 20 unit tests

**Acceptance Criteria**:
- ✅ Entity supports 5 document types (TAX_RECEIPT, GOV_DOCUMENT, PHOTO, VIDEO, 3RD_PARTY_CERT)
- ✅ Document hash validates SHA-256 format
- ✅ Verification status enforces workflow (PENDING → VERIFIED or REJECTED)
- ✅ Quantum signatures stored correctly

---

### 2.2.2 Secondary Token Upload & Storage (80 hours)

**Create `SecondaryTokenUploadService.java`**:
- `uploadSecondaryToken(primaryTokenId, documentType, file)`:
  - Save to S3 with encryption
  - Generate document hash (SHA-256)
  - Create secondary token record
  - Return token ID and upload status

- `getSecondaryToken(secondaryTokenId)`:
  - Retrieve from S3
  - Verify document hash integrity
  - Return encrypted download URL (10-minute expiry)

- `listSecondaryTokens(primaryTokenId, documentType)`:
  - Query by primary token with optional type filter
  - Return paginated list

**Create S3/Cloud Storage Integration**:
- Bucket: `aurigraph-secondary-tokens/{primaryTokenId}/{documentType}/`
- Encryption: Server-side AES-256
- Retention: Permanent (immutable after verification)
- Access: Only authenticated users with document ownership

**Create `DocumentVerificationService.java`**:
- `hashDocument(file)`: Generate SHA-256 hash
- `verifyDocumentIntegrity(file, expectedHash)`: Validate hash
- `extractMetadata(file)`: Get file size, MIME type, creation date
- `validateDocumentFormat(documentType, file)`: Type-specific validation

**Deliverables**:
- `SecondaryTokenUploadService.java` (200 lines)
- `DocumentVerificationService.java` (150 lines)
- S3 configuration and integration
- 25 integration tests (upload, retrieval, hash verification)

**Acceptance Criteria**:
- ✅ Upload < 100 MB files with progress tracking
- ✅ SHA-256 hash matches content after upload and download
- ✅ S3 access URLs expire after 10 minutes
- ✅ File encryption transparent to API users

---

### 2.2.3 Secondary Token REST API (80 hours)

**Create `SecondaryTokenResource.java`** with endpoints:

- `POST /api/v11/rwa/tokens/primary/{primaryTokenId}/secondary/upload`
  - Input: multipart form with file and documentType
  - Output: `{secondaryTokenId, documentHash, status}`
  - Authentication: JWT Bearer token

- `GET /api/v11/rwa/tokens/secondary/{secondaryTokenId}`
  - Output: Secondary token metadata (no file content)
  - Optional: Return signed S3 download URL

- `GET /api/v11/rwa/tokens/primary/{primaryTokenId}/secondary`
  - Query params: `?documentType=TAX_RECEIPT&limit=10&offset=0`
  - Output: Paginated list of secondary tokens

- `POST /api/v11/rwa/tokens/secondary/{secondaryTokenId}/verify`
  - Input: `{trustedOracleId, verificationProof}`
  - Output: `{verified: boolean, verifiedAt, verifiedBy}`
  - Logic: Mark as verified by trusted 3rd party

- `DELETE /api/v11/rwa/tokens/secondary/{secondaryTokenId}`
  - Logic: Soft delete (mark as archived, keep in DB)
  - Restriction: Only allowed if not in composite token

**Create `SecondaryTokenService.java`**:
- Service layer for REST endpoints
- Business logic for upload, verification, retrieval
- Integration with storage and verification services

**Deliverables**:
- `SecondaryTokenResource.java` (250 lines)
- `SecondaryTokenService.java` (300 lines)
- 30 integration tests
- API documentation

**Acceptance Criteria**:
- ✅ Multipart upload progress tracking
- ✅ Document hash verified on retrieval
- ✅ Pagination working correctly
- ✅ Authorization enforced (only owner can access)

---

### 2.2.4 Secondary Token UI Components (80 hours)

**Create `src/components/2.2-secondary-token/`**:

1. **`SecondaryTokenUploadForm.tsx`** (130 lines)
   - Multi-file upload with drag-and-drop
   - Document type selector (5 types)
   - Progress bar per file
   - Success/error notifications
   - Integration: Calls `POST .../secondary/upload`

2. **`SecondaryTokenList.tsx`** (100 lines)
   - Table showing all secondary tokens for primary token
   - Columns: Document Type, Upload Date, Verification Status, Actions
   - Filter by: Document Type, Verification Status
   - Delete action (with confirmation)

3. **`SecondaryTokenDetails.tsx`** (80 lines)
   - Modal showing full secondary token details
   - Display: Document type, hash, size, upload date, verified date
   - Download button (generates signed S3 URL)
   - Verification status badge

4. **`DocumentVerificationUI.tsx`** (90 lines)
   - For 3rd-party verifiers (trusted oracles)
   - Show document details
   - Verification action: Approve/Reject with notes
   - Audit trail of verification decisions

5. **Tests** (100 lines)
   - Unit tests for form validation
   - Integration tests for API calls

**Deliverables**:
- 4 React components with TypeScript
- Custom hooks: `useSecondaryTokenUpload()`, `useSecondaryTokenList()`
- Service layer: `secondaryTokenAPI.ts`
- 20 unit/integration tests

**Acceptance Criteria**:
- ✅ Multi-file upload supports up to 5 files simultaneously
- ✅ Progress bars update correctly
- ✅ Document type selector prevents invalid combinations
- ✅ List updates immediately after upload

---

### 2.2.5 Trusted Oracle Integration (60 hours)

**Create `TrustedOracleService.java`**:
- `registerTrustedOracle(oracleId, name, certifications)`: Register 3rd-party verifier
- `listTrustedOracles()`: Get list of approved verifiers
- `verifyDocumentWithOracle(secondaryTokenId, oracleId, proof)`: Route verification
- `recordOracleVerification(secondaryTokenId, oracleId, result)`: Store verification result

**Create `OracleVerificationRegistry.java`**:
- Table: `oracle_verifications`
  - Columns: `id, secondary_token_id, oracle_id, verified_at, verification_result, verification_notes`
- Immutable audit trail of all verifications
- Query methods for verification history

**Create `OracleWebhookHandler.java`**:
- Endpoint: `POST /api/v11/rwa/webhooks/oracle-verification`
- Receive verification results from external oracle APIs
- Update secondary token status
- Emit event: `SecondaryTokenVerifiedEvent`

**Deliverables**:
- `TrustedOracleService.java` (150 lines)
- `OracleVerificationRegistry.java` (100 lines)
- `OracleWebhookHandler.java` (100 lines)
- Database migration for oracle registry
- 20 unit tests

**Acceptance Criteria**:
- ✅ Oracle integration supports multiple 3rd parties
- ✅ Webhook verifies oracle signature (HMAC-SHA256)
- ✅ Audit trail immutable and queryable
- ✅ Event emission for async processing

---

**Module 2.2 Summary**:
- **Effort**: 420 hours (4 weeks, 1 agent)
- **Deliverables**: 8 backend classes, 4 React components, 3 DB migrations
- **Tests**: 75 unit/integration tests
- **Status**: Supports multi-document asset verification workflow

---

## **Module 2.3: Composite Token Creation & Verification** (480 hours, Weeks 2-5)
**Lead Agent**: Agent 2.3 | **Effort**: 120 hrs/week average

### 2.3.1 Composite Token Data Model (60 hours)

**Create `CompositeTokenEntity.java`**:
```java
@Entity
@Table(name = "composite_tokens")
public class CompositeTokenEntity {
    @Id private UUID id;
    @Column private UUID primaryTokenId;
    @ElementCollection
    @CollectionTable(name = "composite_token_secondary_tokens")
    private Set<UUID> secondaryTokenIds;

    @Column private String status; // CREATED → VERIFIED → ACTIVE → BOUND_TO_CONTRACT
    @Column private LocalDateTime createdAt;
    @Column private LocalDateTime verifiedAt;
    @Column private String digitalTwinHash; // SHA-256 of all components
    @Column private String merkleRoot; // Root of composite merkle tree
    @Column(columnDefinition = "BYTEA") private byte[] quantumSignature; // Verifier's signature
    @Column private String verifiedBy; // Trusted oracle that verified
    @Column(columnDefinition = "BYTEA") private byte[] oracleSignature; // Oracle's signature
    @Column private UUID boundActiveContractId;
    @Column private LocalDateTime boundAt;
}
```

**Database Schema**:
```sql
CREATE TABLE composite_tokens (
    id UUID PRIMARY KEY,
    primary_token_id UUID NOT NULL UNIQUE REFERENCES primary_tokens(id),
    status VARCHAR(50) DEFAULT 'CREATED',
    created_at TIMESTAMP DEFAULT NOW(),
    verified_at TIMESTAMP,
    digital_twin_hash VARCHAR(64),
    merkle_root VARCHAR(64),
    quantum_signature BYTEA,
    verified_by VARCHAR(255),
    oracle_signature BYTEA,
    bound_active_contract_id UUID REFERENCES active_contracts(id),
    bound_at TIMESTAMP
);

CREATE TABLE composite_token_secondary_tokens (
    composite_token_id UUID NOT NULL REFERENCES composite_tokens(id),
    secondary_token_id UUID NOT NULL REFERENCES secondary_tokens(id),
    PRIMARY KEY (composite_token_id, secondary_token_id)
);

CREATE INDEX idx_composite_tokens_status ON composite_tokens(status);
CREATE INDEX idx_composite_tokens_bound_contract ON composite_tokens(bound_active_contract_id);
```

**Deliverables**:
- `CompositeTokenEntity.java` with JPA mappings
- `CompositeTokenRepository.java`
- Database migrations
- 25 unit tests

**Acceptance Criteria**:
- ✅ Primary token uniquely bound (1:1 relationship)
- ✅ Multiple secondary tokens supported (1:many relationship)
- ✅ Status enum enforces valid transitions
- ✅ Digital twin hash computed deterministically

---

### 2.3.2 Composite Token Creation Service (100 hours)

**Create `CompositeTokenCreationService.java`**:

```java
public class CompositeTokenCreationService {

    public CompositeToken createCompositeToken(
        UUID primaryTokenId,
        List<UUID> secondaryTokenIds,
        String trustedOracleId
    ) throws CompositeTokenException {
        // Step 1: Validate primary token exists and status
        PrimaryToken primary = validatePrimaryToken(primaryTokenId);

        // Step 2: Validate all secondary tokens belong to primary
        List<SecondaryToken> secondaries = validateSecondaryTokens(
            primaryTokenId, secondaryTokenIds
        );

        // Step 3: Verify all secondary tokens are already verified
        boolean allVerified = secondaries.stream()
            .allMatch(st -> st.getStatus() == VERIFIED);
        if (!allVerified) {
            throw new CompositeTokenException(
                "All secondary tokens must be verified before composite creation"
            );
        }

        // Step 4: Generate digital twin hash
        String digitalTwinHash = generateDigitalTwinHash(primary, secondaries);

        // Step 5: Build merkle tree from all components
        MerkleTree compositeMerkleTree = buildCompositeMerkleTree(
            primary, secondaries
        );
        String merkleRoot = compositeMerkleTree.getRoot();

        // Step 6: Create composite token record
        CompositeToken composite = CompositeToken.builder()
            .id(UUID.randomUUID())
            .primaryTokenId(primaryTokenId)
            .secondaryTokenIds(new HashSet<>(secondaryTokenIds))
            .status(CREATED)
            .digitalTwinHash(digitalTwinHash)
            .merkleRoot(merkleRoot)
            .createdAt(LocalDateTime.now())
            .verifiedBy(trustedOracleId)
            .build();

        return compositeTokenRepository.save(composite);
    }
}
```

**Methods**:
- `createCompositeToken()`: Main creation workflow
- `validatePrimaryToken()`: Check token exists, status correct
- `validateSecondaryTokens()`: Verify all secondary tokens valid
- `generateDigitalTwinHash()`: Compute SHA-256 of all components
- `buildCompositeMerkleTree()`: Build merkle tree from all tokens
- `verifyCompositeTokenIntegrity()`: Verify all components present

**Create `DigitalTwinHashService.java`**:
- Deterministic hashing of primary + secondary tokens
- Order-independent (use sorted list internally)
- Input: Primary token + secondary token list
- Output: SHA-256 hash unique to this digital twin

**Create `CompositeMerkleTreeService.java`**:
- Build merkle tree with 3 layers:
  - Layer 1: Primary token hash
  - Layer 2: All secondary token hashes
  - Layer 3: Root combining layers 1 & 2
- Output: Root hash and proofs for verification

**Deliverables**:
- `CompositeTokenCreationService.java` (250 lines)
- `DigitalTwinHashService.java` (100 lines)
- `CompositeMerkleTreeService.java` (150 lines)
- 30 unit tests (creation logic, hash verification)

**Acceptance Criteria**:
- ✅ Digital twin hash deterministic (same components = same hash)
- ✅ Merkle tree verifiable by any party with components
- ✅ All secondary tokens must be VERIFIED status
- ✅ Primary token status transitions to COMPOSITE_PENDING

---

### 2.3.3 Oracle-Driven Verification (100 hours)

**Create `CompositeTokenVerificationService.java`**:

```java
public class CompositeTokenVerificationService {

    public void verifyCompositeToken(
        UUID compositeTokenId,
        String trustedOracleId,
        CompositeTokenVerificationProof proof
    ) throws VerificationException {
        // Step 1: Validate composite token exists
        CompositeToken composite = getCompositeToken(compositeTokenId);

        // Step 2: Verify oracle is trusted and authorized
        TrustedOracle oracle = verifyTrustedOracle(trustedOracleId);

        // Step 3: Verify merkle tree integrity
        boolean merkleValid = verifyMerkleTree(
            composite.getMerkleRoot(),
            proof.getMerkleProofs()
        );
        if (!merkleValid) {
            throw new VerificationException("Merkle tree verification failed");
        }

        // Step 4: Verify digital twin hash matches components
        String computedHash = recomputeDigitalTwinHash(
            composite.getPrimaryTokenId(),
            composite.getSecondaryTokenIds()
        );
        if (!computedHash.equals(composite.getDigitalTwinHash())) {
            throw new VerificationException("Digital twin hash mismatch");
        }

        // Step 5: Sign verification with oracle's quantum key
        byte[] oracleSignature = signVerification(
            compositeTokenId,
            oracle.getQuantumPrivateKey()
        );

        // Step 6: Update composite token status
        composite.setStatus(VERIFIED);
        composite.setVerifiedAt(LocalDateTime.now());
        composite.setVerifiedBy(trustedOracleId);
        composite.setOracleSignature(oracleSignature);

        compositeTokenRepository.save(composite);

        // Step 7: Emit event for downstream processing
        eventPublisher.publishEvent(
            new CompositeTokenVerifiedEvent(compositeTokenId)
        );
    }
}
```

**Create `OracleSignatureService.java`**:
- Use CRYSTALS-Dilithium for oracle signatures
- Sign: CompositeTokenId + DigitalTwinHash + Timestamp
- Verify: Replay signature with oracle's public key
- Store: Immutable audit trail in `oracle_verifications` table

**Create `VerificationProofValidator.java`**:
- Validate merkle proofs provided by oracle
- Check timestamp freshness (< 24 hours old)
- Verify oracle signature authenticity
- Record validation attempt in audit log

**Deliverables**:
- `CompositeTokenVerificationService.java` (200 lines)
- `OracleSignatureService.java` (120 lines)
- `VerificationProofValidator.java` (100 lines)
- `CompositeTokenVerifiedEvent.java` (40 lines)
- 25 unit tests (verification logic, signature validation)

**Acceptance Criteria**:
- ✅ Oracle signature uses CRYSTALS-Dilithium
- ✅ Verification atomic (all-or-nothing)
- ✅ Audit trail complete and immutable
- ✅ Event published for async contract binding

---

### 2.3.4 Composite Token REST API (80 hours)

**Create `CompositeTokenResource.java`** with endpoints:

- `POST /api/v11/rwa/tokens/composite/create`
  - Input: `{primaryTokenId, secondaryTokenIds}`
  - Output: `{compositeTokenId, status, digitalTwinHash, merkleRoot}`
  - Logic: Create composite token in CREATED state

- `GET /api/v11/rwa/tokens/composite/{compositeTokenId}`
  - Output: Complete composite token details with merkle proofs
  - Logic: Return token with all metadata

- `POST /api/v11/rwa/tokens/composite/{compositeTokenId}/verify`
  - Input: `{trustedOracleId, verificationProof, merkleProofs}`
  - Output: `{verified: boolean, verifiedAt, oracleSignature}`
  - Logic: Verify and sign composite token

- `GET /api/v11/rwa/tokens/composite/{compositeTokenId}/merkle-proofs`
  - Output: `{merkleRoot, merkleProofs: [...]}`
  - Logic: Return merkle proofs for external verification

- `GET /api/v11/rwa/tokens/primary/{primaryTokenId}/composite`
  - Output: Composite token for primary token (or null)
  - Logic: 1:1 relationship lookup

**Create `CompositeTokenService.java`**:
- Orchestrate creation, verification, and binding
- Handle state transitions
- Generate API responses

**Deliverables**:
- `CompositeTokenResource.java` (180 lines)
- `CompositeTokenService.java` (200 lines)
- 25 integration tests
- API documentation

**Acceptance Criteria**:
- ✅ API follows REST conventions
- ✅ All endpoints return consistent error responses
- ✅ Merkle proofs included in GET responses
- ✅ Status transitions enforced via API

---

### 2.3.5 Composite Token UI (70 hours)

**Create `src/components/2.3-composite-token/`**:

1. **`CompositeTokenCreationWizard.tsx`** (150 lines)
   - Step 1: Select primary token
   - Step 2: Review/select secondary tokens (with verification status)
   - Step 3: Confirm digital twin hash
   - Step 4: Create composite token
   - Integration: `POST /api/v11/rwa/tokens/composite/create`

2. **`CompositeTokenDetails.tsx`** (100 lines)
   - Display: Primary token, all secondary tokens
   - Show: Digital twin hash, merkle root
   - Display: Oracle verification status and signature
   - Actions: Verify (if oracle), Bind to Contract

3. **`CompositeTokenMerkleVerifier.tsx`** (120 lines)
   - Interactive merkle tree visualization
   - Show merkle proofs and verification path
   - Button to verify external proofs

4. **`CompositeTokenList.tsx`** (80 lines)
   - Table of all composite tokens
   - Filter by: Status, Primary Asset, Oracle
   - Pagination with search

5. **Tests** (100 lines)

**Deliverables**:
- 4 React components
- Custom hooks: `useCompositeToken()`, `useCompositeTokenVerification()`
- Service layer: `compositeTokenAPI.ts`
- 18 unit/integration tests

**Acceptance Criteria**:
- ✅ Wizard guides user through creation flow
- ✅ Details page shows all composite token information
- ✅ Merkle verification interactive and educational

---

**Module 2.3 Summary**:
- **Effort**: 480 hours (4 weeks, 1 agent)
- **Deliverables**: 10 backend classes, 4 React components, 2 DB migrations
- **Tests**: 95 unit/integration tests
- **Status**: Composite token creation and verification complete

---

## **Module 2.4: Composite Token ↔ ActiveContract Binding** (420 hours, Weeks 3-6)
**Lead Agent**: Agent 2.4 | **Effort**: 105 hrs/week average

### 2.4.1 Contract Binding Data Model (50 hours)

**Enhance `ActiveContractEntity.java`**:
- Add field: `compositeTokenId` (UUID, nullable)
- Add field: `compositeTokenBindingStatus` (PENDING, BOUND, EXECUTED, CANCELLED)
- Add field: `boundAt` (LocalDateTime)
- Add field: `compositeTokenBindingProof` (JSON with merkle proofs)

**Create `CompositeTokenBinding.java`**:
```java
@Entity
@Table(name = "composite_token_bindings")
public class CompositeTokenBinding {
    @Id private UUID id;
    @Column private UUID compositeTokenId;
    @Column private UUID activeContractId;
    @Column private LocalDateTime boundAt;
    @Column(columnDefinition = "JSONB") private String bindingProof; // Merkle proofs
    @Column(columnDefinition = "BYTEA") private byte[] bindingSignature; // CRYSTALS-Dilithium
    @Column private String bindingStatus; // CREATED, VERIFIED, ACTIVE, EXECUTED
}
```

**Database Schema**:
```sql
ALTER TABLE active_contracts ADD COLUMN composite_token_id UUID REFERENCES composite_tokens(id);
ALTER TABLE active_contracts ADD COLUMN composite_binding_status VARCHAR(50);
ALTER TABLE active_contracts ADD COLUMN composite_bound_at TIMESTAMP;

CREATE TABLE composite_token_bindings (
    id UUID PRIMARY KEY,
    composite_token_id UUID NOT NULL REFERENCES composite_tokens(id),
    active_contract_id UUID NOT NULL REFERENCES active_contracts(id),
    bound_at TIMESTAMP DEFAULT NOW(),
    binding_proof JSONB,
    binding_signature BYTEA,
    binding_status VARCHAR(50) DEFAULT 'CREATED'
);

CREATE INDEX idx_composite_token_bindings_composite ON composite_token_bindings(composite_token_id);
CREATE INDEX idx_composite_token_bindings_contract ON composite_token_bindings(active_contract_id);
CREATE UNIQUE INDEX idx_composite_token_one_contract ON composite_token_bindings(composite_token_id);
```

**Deliverables**:
- Enhanced `ActiveContractEntity.java`
- `CompositeTokenBinding.java` entity
- `CompositeTokenBindingRepository.java`
- Database migration
- 20 unit tests

---

### 2.4.2 Binding Service (80 hours)

**Create `CompositeTokenBindingService.java`**:

```java
public class CompositeTokenBindingService {

    public void bindCompositeTokenToContract(
        UUID compositeTokenId,
        UUID activeContractId
    ) throws BindingException {
        // Step 1: Validate composite token is VERIFIED
        CompositeToken composite = getCompositeToken(compositeTokenId);
        if (!composite.getStatus().equals(VERIFIED)) {
            throw new BindingException(
                "Composite token must be VERIFIED before binding"
            );
        }

        // Step 2: Validate active contract is PENDING (not yet executed)
        ActiveContract contract = getActiveContract(activeContractId);
        if (!contract.getStatus().equals(PENDING)) {
            throw new BindingException(
                "Contract must be PENDING to bind composite token"
            );
        }

        // Step 3: Verify no other composite token bound to this contract
        Optional<CompositeTokenBinding> existing =
            bindingRepository.findByActiveContractId(activeContractId);
        if (existing.isPresent()) {
            throw new BindingException(
                "Contract already has a composite token binding"
            );
        }

        // Step 4: Generate binding proof (merkle proofs + contract data)
        String bindingProof = generateBindingProof(
            composite, contract
        );

        // Step 5: Sign binding with composite token verifier's key
        byte[] bindingSignature = signBinding(
            compositeTokenId, activeContractId, composite.getVerifiedBy()
        );

        // Step 6: Create binding record
        CompositeTokenBinding binding = CompositeTokenBinding.builder()
            .id(UUID.randomUUID())
            .compositeTokenId(compositeTokenId)
            .activeContractId(activeContractId)
            .boundAt(LocalDateTime.now())
            .bindingProof(bindingProof)
            .bindingSignature(bindingSignature)
            .bindingStatus(CREATED)
            .build();

        bindingRepository.save(binding);

        // Step 7: Update composite token and contract status
        composite.setStatus(BOUND_TO_CONTRACT);
        composite.setBoundActiveContractId(activeContractId);
        composite.setBoundAt(LocalDateTime.now());
        compositeTokenRepository.save(composite);

        contract.setCompositeTokenId(compositeTokenId);
        contract.setCompositeBindingStatus(BOUND);
        contractRepository.save(contract);

        // Step 8: Emit event
        eventPublisher.publishEvent(
            new CompositeTokenBoundEvent(
                compositeTokenId, activeContractId
            )
        );
    }
}
```

**Methods**:
- `bindCompositeTokenToContract()`: Main binding workflow
- `generateBindingProof()`: Create cryptographic proof of binding
- `verifyBinding()`: Verify binding proof is valid
- `getBindingHistory()`: Audit trail of all bindings

**Deliverables**:
- `CompositeTokenBindingService.java` (250 lines)
- `CompositeTokenBindingProofGenerator.java` (120 lines)
- `CompositeTokenBoundEvent.java` (40 lines)
- 25 unit tests

**Acceptance Criteria**:
- ✅ Atomic binding operation (all-or-nothing)
- ✅ One composite token per contract (1:1)
- ✅ Binding proof cryptographically secure
- ✅ Status transitions enforced

---

### 2.4.3 Contract Binding Registry (60 hours)

**Create `CompositeTokenContractRegistry.java`**:
- Table: `composite_token_contract_registry` (merkle tree enabled)
- Track all composite token ↔ contract bindings
- Merkle tree proof of binding history
- Immutable audit trail

**Create `ContractCompositeTokenRegistry.java`**:
- Query methods:
  - `findCompositeTokenForContract(contractId)`: 1:1 lookup
  - `findContractForCompositeToken(compositeTokenId)`: 1:1 lookup
  - `listAllBindings(limit, offset)`: Paginated registry
  - `getBindingProof(binding)`: Merkle proof of binding

**Deliverables**:
- Registry implementations with merkle tree support
- Database migrations
- 20 unit tests

---

### 2.4.4 Binding REST API (80 hours)

**Create `CompositeTokenContractResource.java`**:

- `POST /api/v11/rwa/composite-tokens/{compositeTokenId}/bind-to-contract`
  - Input: `{activeContractId}`
  - Output: `{boundAt, bindingProof, bindingSignature}`
  - Logic: Bind composite token to contract

- `GET /api/v11/rwa/composite-tokens/{compositeTokenId}/bound-contract`
  - Output: Bound active contract details
  - Logic: 1:1 lookup

- `GET /api/v11/rwa/contracts/{contractId}/composite-token`
  - Output: Bound composite token details
  - Logic: 1:1 lookup

- `GET /api/v11/rwa/composite-tokens/{compositeTokenId}/binding-proof`
  - Output: `{bindingProof, merkleProofs[]}`
  - Logic: Cryptographic proof of binding

- `GET /api/v11/rwa/registry/composite-token-contracts`
  - Query params: `?limit=10&offset=0`
  - Output: Paginated list of all bindings
  - Logic: Merkle tree registry query

**Deliverables**:
- `CompositeTokenContractResource.java` (180 lines)
- Service layer for binding orchestration
- 25 integration tests
- API documentation

---

### 2.4.5 Binding UI Components (80 hours)

**Create `src/components/2.4-composite-binding/`**:

1. **`ContractBindingWizard.tsx`** (150 lines)
   - Step 1: Select composite token (must be VERIFIED)
   - Step 2: Select active contract (must be PENDING)
   - Step 3: Review binding details
   - Step 4: Confirm and create binding

2. **`CompositeTokenContractLink.tsx`** (100 lines)
   - Show composite token ↔ contract relationship
   - Display: Primary asset, secondary tokens, contract terms
   - Status indicator: BOUND, EXECUTING, EXECUTED

3. **`BindingProofViewer.tsx`** (100 lines)
   - Display binding proof in readable format
   - Show merkle proofs with visualization
   - Verify button for external validation

4. **`BindingRegistry.tsx`** (80 lines)
   - Table of all composite ↔ contract bindings
   - Filters: Status, Date Range
   - Search by: Composite Token ID, Contract ID

**Deliverables**:
- 4 React components
- Custom hooks: `useCompositeContractBinding()`, `useBindingProof()`
- Service layer: `compositeContractAPI.ts`
- 20 unit/integration tests

---

**Module 2.4 Summary**:
- **Effort**: 420 hours (4 weeks, 1 agent)
- **Deliverables**: 8 backend classes, 4 React components, 2 DB migrations
- **Tests**: 90 unit/integration tests
- **Status**: Binding complete and verified

---

## **Module 2.5: Merkle Tree Registry for Composite Tokens** (360 hours, Weeks 4-7)
**Lead Agent**: Agent 2.5 | **Effort**: 90 hrs/week average

### 2.5.1 Composite Token Merkle Tree (80 hours)

**Create `CompositeTokenMerkleTree.java`**:
- 4-level merkle tree:
  - Level 1: Primary token hash
  - Level 2: All secondary token hashes (set)
  - Level 3: Binding contract hash
  - Level 4: Root (covers all above)

**Create `CompositeTokenMerkleRegistry.java`**:
- Table: `composite_token_merkle_registry`
- Columns:
  - `composite_token_id` (UUID, PK)
  - `merkle_root` (VARCHAR 64)
  - `merkle_tree` (JSONB - stored for reproducibility)
  - `created_at` (TIMESTAMP)
  - `updated_at` (TIMESTAMP)

**Methods**:
- `createMerkleTree(compositeToken)`: Build 4-level tree
- `getMerkleProof(compositeTokenId)`: Full proof path
- `verifyMerkleProof(compositeTokenId, proof)`: Validate proof
- `publishMerkleRoot(compositeTokenId)`: Finalize and immutable

**Deliverables**:
- 3 classes (merkle tree, registry, service)
- Database migration
- 25 unit tests

---

### 2.5.2 Asset Registry Integration (80 hours)

**Enhance existing `AssetMerkleRegistry.java`**:
- Add composite token binding information
- Link: Asset → Primary Token → Composite Token
- Update merkle tree when composite created

**Create `AssetToCompositeTokenLink.java`**:
- Table: `asset_composite_token_links`
- Link asset → composite token for audit trail

**Deliverables**:
- Enhanced asset registry integration
- Linking table and repository
- 20 unit tests

---

### 2.5.3 Token Registry Integration (80 hours)

**Enhance existing `TokenMerkleRegistry.java`**:
- Track primary token → composite token links
- Update merkle trees across all 3 registries atomically
- Ensure consistency: Asset ↔ Primary ↔ Composite

**Create `TripleRegistryConsistencyService.java`**:
- Validates consistency across:
  - Asset Registry
  - Token Registry (Primary + Secondary)
  - Composite Token Registry
- Reconciliation method for repairs

**Deliverables**:
- Enhanced token registry
- Consistency service with atomic updates
- 25 unit tests

---

### 2.5.4 Contract Registry Integration (80 hours)

**Enhance existing `ActiveContractMerkleRegistry.java`**:
- Track composite token bindings
- Update merkle tree when composite bound

**Create `CompositeTokenContractMerkleLink.java`**:
- Binding proof includes merkle roots from all 3 registries
- Cryptographic evidence of consistency

**Deliverables**:
- Enhanced contract registry
- Merkle linking service
- 20 unit tests

---

### 2.5.5 Registry Query & Verification APIs (80 hours)

**Create `CompositeTokenRegistryResource.java`**:

- `GET /api/v11/rwa/registry/composite-tokens`
  - Query params: `?status=VERIFIED&limit=10&offset=0`
  - Output: Paginated registry with merkle roots

- `GET /api/v11/rwa/registry/composite-tokens/{tokenId}/proof`
  - Output: Complete merkle proof path

- `POST /api/v11/rwa/registry/verify-composite-token`
  - Input: `{compositeTokenId, merkleProof}`
  - Output: `{verified: boolean}`
  - Logic: Verify proof against published merkle root

- `GET /api/v11/rwa/registry/consistency-report`
  - Output: Consistency status across all 3 registries
  - Logic: Check for orphaned/inconsistent records

**Deliverables**:
- REST resource for registry queries
- 20 integration tests

---

**Module 2.5 Summary**:
- **Effort**: 360 hours (4 weeks, 1 agent)
- **Deliverables**: 6 backend classes, 1 REST resource, 4 DB migrations
- **Tests**: 90 unit/integration tests
- **Status**: Triple-registry integration complete

---

## **Module 2.6: Portal Integration & UI** (320 hours, Weeks 5-8)
**Lead Agent**: Agent 2.6 | **Effort**: 80 hrs/week average

### 2.6.1 Main Composite Token Dashboard (80 hours)

**Create `src/components/2.6-composite-dashboard/`**:

1. **`CompositeTokenDashboard.tsx`** (180 lines)
   - Summary cards:
     - Total composite tokens created
     - Verified vs pending
     - Bound to contracts vs pending
     - Digital twins verified via oracles
   - Charts:
     - Timeline of composite token creations
     - Status distribution pie chart
     - Oracle verification trends
   - Actions: Create new, Search, Filter

2. **`CompositeTokenWorkflow.tsx`** (120 lines)
   - Visual workflow diagram:
     - Primary token → Secondary tokens → Composite → Contract
   - Status badges at each stage
   - Links to view details at each stage

3. **`QuickActions.tsx`** (100 lines)
   - Buttons for common tasks:
     - "Create Composite Token"
     - "Upload Secondary Document"
     - "Verify Composite"
     - "Bind to Contract"

**Deliverables**:
- 3 dashboard components
- Custom hooks for dashboard data
- 15 unit/integration tests

---

### 2.6.2 Asset to Composite Tracking (80 hours)

**Create `src/components/2.6-asset-composite-tracking/`**:

1. **`AssetToCompositeNavigator.tsx`** (140 lines)
   - Start from asset
   - Show: Asset → Primary Token → Secondary Tokens → Composite Token → Contract
   - Breadcrumb navigation
   - Each step links to details view

2. **`CompositeTokenAuditTrail.tsx`** (100 lines)
   - Timeline of all events:
     - Primary token created
     - Secondary documents uploaded
     - Secondary documents verified
     - Composite token created
     - Composite token verified
     - Bound to contract
     - Contract executed (if applicable)
   - Timestamps and actors for each event

3. **`DigitalTwinProvenanceUI.tsx`** (90 lines)
   - Show complete provenance chain
   - Display: Asset → All components → Merkle proofs
   - Downloadable provenance report (PDF)

**Deliverables**:
- 3 UI components
- Custom hooks for tracking data
- Service layer: `assetCompositeTrackingAPI.ts`
- 15 unit/integration tests

---

### 2.6.3 Oracle Management Interface (80 hours)

**Create `src/components/2.6-oracle-management/`**:

1. **`TrustedOracleList.tsx`** (100 lines)
   - Table of all trusted oracles
   - Columns: Name, Certifications, Verifications Count, Last Verification
   - Actions: View details, Register new oracle, Disable oracle

2. **`OracleVerificationQueue.tsx`** (120 lines)
   - Queue of pending composite tokens waiting for oracle verification
   - Show: Composite token ID, Primary asset, Secondary count
   - Actions: Approve/Reject with verification proofs
   - Real-time updates via WebSocket

3. **`OracleVerificationHistory.tsx`** (100 lines)
   - Historical record of all verifications
   - Filters: Oracle, Date range, Composite token
   - Display: Verification results, timestamps, signatures

**Deliverables**:
- 3 oracle management components
- Custom hooks: `useOracleList()`, `useVerificationQueue()`
- Service layer: `oracleManagementAPI.ts`
- 15 unit/integration tests

---

### 2.6.4 Registry Visualization & Search (80 hours)

**Create `src/components/2.6-registry-explorer/`**:

1. **`CompositeTokenRegistryExplorer.tsx`** (140 lines)
   - Tree view of registry:
     - All composite tokens
     - Expandable to show components
     - Merkle tree visualization
   - Search/filter capabilities

2. **`MerkleProofValidator.tsx`** (120 lines)
   - For external parties to validate
   - Input: Composite token ID + claimed merkle proofs
   - Output: Verification result with detailed validation steps
   - Educational: Show how merkle validation works

3. **`RegistryStatistics.tsx`** (100 lines)
   - Dashboard showing:
     - Total composites created
     - Verification success rate
     - Average secondary tokens per composite
     - Oracle verification latency
     - Binding to contracts rate

**Deliverables**:
- 3 registry/visualization components
- Custom hooks for registry data
- Service layer: `registryExplorerAPI.ts`
- 15 unit/integration tests

---

### 2.6.5 Portal Navigation & Layout Integration (40 hours)

**Enhance `src/layouts/MainLayout.tsx`**:
- Add Composite Token module to sidebar navigation
- Create submenu:
  - Dashboard
  - My Composite Tokens
  - Create New
  - Oracle Verifications
  - Registry Explorer

**Update `src/pages/ModuleRouter.tsx`**:
- Route to composite token components
- Lazy loading for performance

**Deliverables**:
- Enhanced layouts and routing
- Navigation menu updates
- 5 unit tests

---

**Module 2.6 Summary**:
- **Effort**: 320 hours (4 weeks, 1 agent)
- **Deliverables**: 10+ React components, enhanced layouts
- **Tests**: 75 unit/integration tests
- **Status**: Complete portal integration

---

## 📈 Project Timeline

```
PHASE 1: Foundation (Weeks 1-2)
├─ Module 2.1: Primary Token Enhancement (Agent 2.1)
├─ Module 2.2: Secondary Token Framework (Agent 2.2 - starts)
└─ Module 2.3: Composite Creation (Agent 2.3 - starts)

PHASE 2: Core Features (Weeks 3-5)
├─ Module 2.1: Complete (Agent 2.1 finishes)
├─ Module 2.2: Complete (Agent 2.2)
├─ Module 2.3: Completion (Agent 2.3)
├─ Module 2.4: Contract Binding (Agent 2.4 - starts)
└─ Module 2.5: Merkle Registry (Agent 2.5 - starts)

PHASE 3: Integration (Weeks 6-8)
├─ Module 2.4: Complete (Agent 2.4)
├─ Module 2.5: Complete (Agent 2.5)
├─ Module 2.6: Portal Integration (Agent 2.6)
└─ System integration testing

PHASE 4: QA & Release (Weeks 9-16)
├─ E2E testing (all workflows)
├─ Performance testing
├─ Security audit
├─ Oracle integration testing
├─ Staging deployment
├─ QA approval
└─ Production release

RELEASE TARGET: February 28, 2026
```

---

## 📊 Resource Allocation

| Module | Lead Agent | Effort | Duration | Status |
|--------|-----------|--------|----------|--------|
| 2.1: Primary Token | Agent 2.1 | 285 hrs | 3 weeks | Ready |
| 2.2: Secondary Tokens | Agent 2.2 | 420 hrs | 4 weeks | Ready |
| 2.3: Composite Creation | Agent 2.3 | 480 hrs | 4 weeks | Ready |
| 2.4: Contract Binding | Agent 2.4 | 420 hrs | 4 weeks | Ready |
| 2.5: Merkle Registry | Agent 2.5 | 360 hrs | 4 weeks | Ready |
| 2.6: Portal Integration | Agent 2.6 | 320 hrs | 4 weeks | Ready |
| **Total** | **6 agents** | **2,580 hrs** | **16 weeks** | **Awaiting Approval** |

---

## 🎯 Quality Gates

**Code Quality**:
- ✅ 80%+ unit test coverage per module
- ✅ 60%+ integration test coverage
- ✅ 0 console errors/warnings
- ✅ TypeScript strict mode compliance

**Functional**:
- ✅ All workflows end-to-end testable
- ✅ Merkle tree proofs verifiable by external parties
- ✅ Oracle integration functional
- ✅ Registry consistency maintained

**Performance**:
- ✅ Composite creation < 5 seconds
- ✅ Verification < 10 seconds
- ✅ Registry queries < 1 second
- ✅ UI loads in < 3 seconds

**Security**:
- ✅ CRYSTALS-Dilithium signatures verified
- ✅ JWT authentication enforced
- ✅ Audit trail immutable
- ✅ Quantum-resistant cryptography throughout

---

## 🚀 Next Steps

1. **User Review & Approval**:
   - Review WBS structure
   - Validate module estimates
   - Approve resource allocation
   - Confirm timeline (Feb 28, 2026)

2. **Agent Assignment**:
   - Assign 6 agents to modules
   - Brief on responsibilities
   - Distribute this document
   - Establish daily standups

3. **Infrastructure Setup**:
   - Create 6 git worktrees (similar to RWA Portal v4.6.0)
   - Setup branches: `feature/2.1-primary-token` through `feature/2.6-portal-integration`
   - Create Slack channel: `#j4c-composite-tokens`
   - Schedule daily 9 AM UTC standups

4. **Kick-Off Meeting**:
   - Present architecture to team
   - Q&A on technical design
   - Establish communication protocols
   - Begin Week 1 development

---

## 📚 Dependencies

**Must Complete Before This Project**:
- ✅ RWA Portal v4.6.0 (Target: Dec 24, 2025)
- ✅ Asset Registry (Already complete)
- ✅ Primary Token Framework (Module 2.1 this project)

**External Dependencies**:
- Trusted Oracle APIs (for verification)
- S3/Cloud Storage (for document storage)
- KYC Provider APIs (for owner verification)

---

## ✅ Approval Checklist

- [ ] **Architecture approved**: Digital twin design with merkle trees
- [ ] **Module breakdown approved**: 6 modules, 2,580 hours, 16 weeks
- [ ] **Resource allocation approved**: 6 agents assigned
- [ ] **Timeline approved**: Target Feb 28, 2026 release
- [ ] **Scope approved**: Primary + Secondary + Composite + Binding + Registry + UI
- [ ] **Quality gates approved**: 80%+ coverage, E2E testing
- [ ] **Oracle integration approved**: Trusted 3rd-party verification model
- [ ] **Merkle tree approach approved**: Triple-registry consistency

---

**This WBS awaits your approval before J4C agent worktrees are created.**

**To proceed**: Confirm approval of architecture, scope, timeline, and resource allocation.

---

*Document Version: 1.0*
*Last Updated: November 13, 2025*
*Status: 🔴 AWAITING APPROVAL*
