# Secondary Token Implementation Guide
**Complete Reference for AV11-601-03 Architecture & Integration**

**Version**: 1.0
**Date**: December 23, 2025
**Status**: Sprint 1 Story 3 (Complete)

---

## Table of Contents
1. [Overview](#overview)
2. [System Architecture](#system-architecture)
3. [Data Model](#data-model)
4. [Core Services](#core-services)
5. [API Reference](#api-reference)
6. [Integration Points](#integration-points)
7. [Common Operations](#common-operations)
8. [Troubleshooting](#troubleshooting)

---

## Overview

The Secondary Token System provides a hierarchical token infrastructure for Aurigraph V12, enabling three specialized token types that derive value from parent primary tokens:

- **Income Stream Tokens**: Distribute revenue on a schedule to multiple holders
- **Collateral Tokens**: Secure obligations with time-based expiration
- **Royalty Tokens**: Track and distribute ongoing revenue shares

### Architecture Principles
- **Hierarchical**: Secondary tokens maintain parent references for lineage verification
- **Transactional**: All state changes respect transaction boundaries with rollback support
- **Event-Driven**: Token lifecycle changes fire CDI events for revenue distribution integration
- **High-Performance**: Sub-5ms lookups, <50ms proof generation, <100ms bulk operations
- **Provable**: Merkle tree proof system enables cryptographic verification of token integrity

---

## System Architecture

### Layered Component Structure

```
┌─────────────────────────────────────────────────────────────┐
│                    REST API Layer                            │
│  SecondaryTokenResource: POST/GET endpoints for all ops      │
│  Base Path: /api/v12/secondary-tokens                        │
└──────────────────────┬──────────────────────────────────────┘
                       │
┌──────────────────────▼──────────────────────────────────────┐
│               Orchestration Layer                            │
│  SecondaryTokenService: Transaction boundaries, event fires  │
│  - Token creation (all 3 types)                              │
│  - Lifecycle transitions (activate, redeem, expire, transfer)│
│  - Bulk operations with partial failure tolerance            │
│  - Parent validation with cascade checking                   │
└──────────┬──────────────┬──────────────┬───────────────────┘
           │              │              │
    ┌──────▼──────┐  ┌────▼─────┐  ┌────▼──────────┐
    │  Factory    │  │ Registry  │  │ Merkle Service│
    │             │  │           │  │               │
    │ Create with │  │ 5 Indexes │  │ Proof chains  │
    │ builder     │  │ Parent Q  │  │ Verification  │
    └─────────────┘  │ Cascade V │  └───────────────┘
                     │ Metrics   │
                     └───────────┘
           │
    ┌──────▼────────────┐
    │ Persistent Layer   │
    │ SecondaryToken JPA │
    │ (via factory)      │
    └────────────────────┘
```

### Component Relationships

```
SecondaryToken (Data Model)
    ↓
SecondaryTokenFactory (Creation with Builder Pattern)
    ↓
SecondaryTokenRegistry (5-Index Lookup & Validation)
    ├─ tokenIndex (primary)
    ├─ parentIndex (parent-child relationships) ← NEW
    ├─ ownerIndex (ownership)
    ├─ typeIndex (filtering)
    └─ statusIndex (lifecycle)
    ↓
SecondaryTokenMerkleService (Proof Generation & Verification)
    ├─ Single token hashing (SHA-256)
    ├─ Merkle tree construction
    ├─ Hierarchical proof chaining
    └─ Composite proof verification
    ↓
SecondaryTokenService (Transaction Orchestration)
    ├─ Lifecycle management
    ├─ CDI Event publishing
    └─ Bulk operations
    ↓
SecondaryTokenResource (REST Endpoints)
    ├─ POST operations (create, activate, redeem, transfer, expire)
    ├─ GET operations (retrieve, list)
    └─ Bulk operations
```

---

## Data Model

### SecondaryToken Entity

```java
public class SecondaryToken {
    // Identity
    String tokenId;                    // UUID, unique identifier
    String parentTokenId;              // Reference to parent primary token

    // Token Properties
    SecondaryTokenType tokenType;      // INCOME_STREAM, COLLATERAL, ROYALTY
    SecondaryTokenStatus status;       // CREATED, ACTIVE, REDEEMED, EXPIRED
    BigDecimal faceValue;              // Token value

    // Ownership & Distribution
    String owner;                      // Current owner address
    DistributionFrequency frequency;   // Monthly, Quarterly, Annual (for income streams)
    BigDecimal revenueShare;           // Revenue percentage (for income/royalty)

    // Lifecycle
    Instant createdAt;                 // Creation timestamp
    Instant expiresAt;                 // Expiration (for collateral)

    // Type-Specific
    // Income Stream: frequency, revenueShare
    // Collateral: expiresAt
    // Royalty: revenueShare
}
```

### Token Types

#### 1. Income Stream Token
```java
SecondaryToken.SecondaryTokenType.INCOME_STREAM
// Characteristics:
// - Distributes revenue on a schedule
// - Multiple holders share revenue percentage
// - Fires TokenActivatedEvent when activated (revenue engine setup)
// - Properties: frequency (Monthly/Quarterly/Annual), revenueShare (%)
```

#### 2. Collateral Token
```java
SecondaryToken.SecondaryTokenType.COLLATERAL
// Characteristics:
// - Secures financial obligations
// - Has expiration date (auto-expire)
// - Time-bound validity
// - Properties: expiresAt (Instant)
```

#### 3. Royalty Token
```java
SecondaryToken.SecondaryTokenType.ROYALTY
// Characteristics:
// - Tracks ongoing revenue distribution
// - Typically for intellectual property, content, music
// - Permanent until redeemed or expired
// - Properties: revenueShare (%)
```

### Status Lifecycle

```
CREATED ──(activate)──→ ACTIVE ──(redeem)──→ REDEEMED
                         ├──(expire)──→ EXPIRED
                         └──(timeout)──→ EXPIRED
```

**Status Meanings**:
- **CREATED**: Newly created, not yet active
- **ACTIVE**: In effect, generating revenue/securing obligations
- **REDEEMED**: Fully redeemed, settled, no longer active
- **EXPIRED**: Time-expired or administratively closed

---

## Core Services

### 1. SecondaryTokenMerkleService

**Purpose**: Cryptographic proof system for token integrity verification

#### Key Methods

```java
// Hashing
String hashSecondaryToken(SecondaryToken token)
// Hash formula: SHA-256(tokenId|parentTokenId|tokenType|faceValue|owner|status)
// Returns: 64-character lowercase hex hash

// Tree Operations
MerkleTree buildSecondaryTokenTree(List<SecondaryToken> tokens)
// Constructs complete Merkle tree from token list
// Returns: Tree with root, levels, leaf count, creation timestamp

// Proof Generation
MerkleProof generateTokenProof(MerkleTree tree, int tokenIndex)
// Generates proof that token at index is in tree
// Returns: Proof with leaf hash, root, siblings, directions, timestamp

CompositeMerkleProof generateCompositeProof(MerkleProof secondaryProof,
                                           String secondaryTokenId,
                                           String parentTokenId,
                                           String primaryMerkleRoot)
// Creates hierarchical proof chain: secondary → primary → composite
// Returns: Proof with full lineage for verification

// Verification
boolean verifyProof(MerkleProof proof)
// Verifies proof is valid by recomputing hash chain
// Returns: true if proof is cryptographically valid

boolean verifyCompositeProof(CompositeMerkleProof compositeProof)
// Verifies entire hierarchical chain including parent
// Returns: true if full chain is valid
```

#### Performance Characteristics

```
Operation               | Target  | Optimizations
────────────────────────┼─────────┼──────────────────────
Hash generation         | <1ms    | Inline SHA-256, no allocations
Tree construction       | <100ms  | Parallel hashing (1,000 tokens)
Proof generation        | <50ms   | Index-based sibling lookup
Proof verification      | <10ms   | Hash chain traversal
Composite proof gen     | <100ms  | Includes parent lookup
Cache hits             | <1ms    | ConcurrentHashMap lookup
```

#### Caching Strategy

```java
ConcurrentHashMap<String, MerkleTree> treeCache
// Key: registryId
// Cache: Recently built trees for incremental updates

ConcurrentHashMap<String, MerkleProof> proofCache
// Key: root:tokenIndex
// Cache: Generated proofs for verification reuse

ConcurrentHashMap<String, CompositeMerkleProof> compositeProofCache
// Key: parentTokenId:secondaryTokenId
// Cache: Hierarchical proofs for lineage verification
```

### 2. SecondaryTokenRegistry

**Purpose**: High-performance multi-index lookup and parent-child relationship tracking

#### 5-Index Design

```
Index 1: tokenId → RegistryEntry
         Fast primary lookup by ID
         Performance: O(1) ~<1µs

Index 2: parentTokenId → Set<tokenId>    [NEW - STORY 3 INNOVATION]
         Parent-child relationship tracking
         Enables cascade validation
         Performance: O(1) to O(n) where n = children count

Index 3: owner → Set<tokenId>
         Track all tokens by owner
         Useful for transfer/ownership queries
         Performance: O(1) to O(n)

Index 4: tokenType → Set<tokenId>
         Filter tokens by type (INCOME_STREAM, COLLATERAL, ROYALTY)
         Group operations by token type
         Performance: O(1) to O(n)

Index 5: status → Set<tokenId>
         Filter by lifecycle status
         Find all ACTIVE, REDEEMED, EXPIRED tokens
         Performance: O(1) to O(n)
```

#### Key Methods

```java
// Registration
Uni<RegistryEntry> register(SecondaryToken token)
// Register new token in all 5 indexes
// Returns: RegistryEntry with metadata

// Lookups
Uni<RegistryEntry> lookup(String tokenId)                    // <5ms
Uni<List<RegistryEntry>> lookupByParent(String parentTokenId) // <5ms ⭐ NEW
Uni<List<RegistryEntry>> lookupByOwner(String owner)         // <5ms
Uni<List<RegistryEntry>> lookupByType(SecondaryTokenType)    // <5ms
Uni<List<RegistryEntry>> lookupByStatus(SecondaryTokenStatus)// <5ms

// Parent-Child Operations (NEW)
Uni<Long> countByParent(String parentTokenId)                // <5ms
Uni<Long> countActiveByParent(String parentTokenId)          // <5ms ⭐ CASCADE VALIDATION
Uni<List<RegistryEntry>> getChildrenByType(String parentId,
                                           SecondaryTokenType) // <5ms
Uni<Boolean> validateParentExists(String parentTokenId)      // <5ms

// Updates
Uni<RegistryEntry> updateStatus(String tokenId,
                               SecondaryTokenStatus newStatus) // <5ms
Uni<RegistryEntry> updateOwner(String tokenId, String newOwner) // <5ms

// Bulk Operations
Uni<List<RegistryEntry>> bulkRegister(List<SecondaryToken> tokens) // <100ms (1K)

// Validation
Uni<ConsistencyReport> validateConsistency()
// Rebuilds tree, compares root, counts inconsistencies
// Returns: Detailed report with issues

// Statistics
RegistryStats getStats()
// Returns: Total tokens, status breakdown, parent count, etc.

RegistryMetrics getMetrics()
// Returns: Registration/lookup counts, timing averages
```

#### Cascade Validation (NEW)

The most important new feature prevents orphaned token scenarios:

```java
// Example: Retiring a primary token
// PROBLEM: Can't retire primary if active secondary tokens exist
// SOLUTION: countActiveByParent() check

long activeCount = registry.countActiveByParent(primaryTokenId)
                          .await().indefinitely();
if (activeCount > 0) {
    throw new IllegalStateException(
        "Cannot retire primary with " + activeCount + " active secondary tokens"
    );
}
```

### 3. SecondaryTokenService

**Purpose**: Transaction orchestration, lifecycle management, event publishing

#### Token Creation

```java
Uni<SecondaryToken> createIncomeStreamToken(String parentTokenId,
                                           BigDecimal faceValue,
                                           String owner,
                                           BigDecimal revenueShare,
                                           DistributionFrequency frequency)
// Creates income stream token with revenue distribution schedule
// Fires: Nothing until activation

Uni<SecondaryToken> createCollateralToken(String parentTokenId,
                                         BigDecimal faceValue,
                                         String owner,
                                         Instant expiresAt)
// Creates collateral token with expiration
// Fires: Nothing until activation

Uni<SecondaryToken> createRoyaltyToken(String parentTokenId,
                                      BigDecimal faceValue,
                                      String owner,
                                      BigDecimal revenueShare)
// Creates royalty token with ongoing revenue share
// Fires: Nothing until activation
```

#### Lifecycle Operations

```java
// Activation: CREATED → ACTIVE
Uni<SecondaryToken> activateToken(String tokenId, String actor)
// Fires: TokenActivatedEvent(tokenId, parentTokenId, actor, timestamp)
// Purpose: Revenue system setup observers

// Redemption: ACTIVE → REDEEMED
Uni<SecondaryToken> redeemToken(String tokenId, String actor)
// Fires: TokenRedeemedEvent(tokenId, parentTokenId, actor, timestamp)
// Purpose: Settlement processing observers

// Expiration: ACTIVE → EXPIRED
Uni<SecondaryToken> expireToken(String tokenId, String reason)
// Fires: No event (administrative action)
// Purpose: Cleanup, timeout handling

// Transfer: Update owner
Uni<SecondaryToken> transferToken(String tokenId,
                                 String fromOwner,
                                 String toOwner)
// Fires: TokenTransferredEvent(tokenId, fromOwner, toOwner, timestamp)
// Purpose: Audit logging observers
```

#### CDI Events

```java
// Event 1: Token Activated
public static class TokenActivatedEvent {
    String tokenId;          // Token that activated
    String parentTokenId;    // Its parent
    String actor;            // Who performed activation
    Instant timestamp;       // When
}

// Event 2: Token Redeemed
public static class TokenRedeemedEvent {
    String tokenId;
    String parentTokenId;
    String actor;
    Instant timestamp;
}

// Event 3: Token Transferred
public static class TokenTransferredEvent {
    String tokenId;
    String fromOwner;        // Previous owner
    String toOwner;          // New owner
    Instant timestamp;
}

// Observer Example (in revenue distribution service):
public class RevenueDistributionService {
    void onTokenActivated(@Observes TokenActivatedEvent event) {
        // Setup revenue distribution schedule
        // Subscribe holder to revenue feeds
        // Initialize payout calendar
    }

    void onTokenRedeemed(@Observes TokenRedeemedEvent event) {
        // Settle outstanding balance
        // Close revenue distribution
        // Archive revenue records
    }

    void onTokenTransferred(@Observes TokenTransferredEvent event) {
        // Update holder registry
        // Adjust revenue distribution
        // Log transfer for audit
    }
}
```

#### Bulk Operations

```java
Uni<BulkOperationResult> bulkCreate(List<CreateTokenRequest> requests)
// Creates multiple tokens in single transaction
// Tolerates partial failures (continues on error)
// Returns: Result with success count, error list, created tokens
// Performance: <100ms for 100 tokens
```

---

## API Reference

### Base Path
```
/api/v12/secondary-tokens
```

### REST Endpoints

#### Creation Endpoints

**POST** `/api/v12/secondary-tokens/income-stream`
```json
{
  "parentTokenId": "uuid-of-parent",
  "faceValue": 1000.00,
  "owner": "owner-address",
  "revenueShare": 10.5,
  "frequency": "MONTHLY"
}
// Response: 201 Created
// Body: TokenResponse { tokenId, parentTokenId, owner, tokenType, status, faceValue, createdAt }
```

**POST** `/api/v12/secondary-tokens/collateral`
```json
{
  "parentTokenId": "uuid-of-parent",
  "faceValue": 5000.00,
  "owner": "owner-address",
  "expiresAt": "2025-12-31T23:59:59Z"
}
// Response: 201 Created
```

**POST** `/api/v12/secondary-tokens/royalty`
```json
{
  "parentTokenId": "uuid-of-parent",
  "faceValue": 500.00,
  "owner": "owner-address",
  "revenueShare": 5.0
}
// Response: 201 Created
```

#### Retrieval Endpoints

**GET** `/api/v12/secondary-tokens/{tokenId}`
```
Response: 200 OK
Body: TokenResponse
Error: 404 Not Found if token doesn't exist
```

**GET** `/api/v12/secondary-tokens/parent/{parentId}`
```
Response: 200 OK
Body: TokenListResponse { tokens: [TokenResponse...], count: int }
```

#### Lifecycle Endpoints

**POST** `/api/v12/secondary-tokens/{tokenId}/activate`
```json
{
  "actor": "admin-or-user-address"
}
// Response: 200 OK
// Fires: TokenActivatedEvent
```

**POST** `/api/v12/secondary-tokens/{tokenId}/redeem`
```json
{
  "actor": "owner-or-admin"
}
// Response: 200 OK
// Fires: TokenRedeemedEvent
```

**POST** `/api/v12/secondary-tokens/{tokenId}/transfer`
```json
{
  "fromOwner": "current-owner",
  "toOwner": "new-owner"
}
// Response: 200 OK
// Fires: TokenTransferredEvent
```

**POST** `/api/v12/secondary-tokens/{tokenId}/expire`
```json
{
  "reason": "expiration reason or comment"
}
// Response: 200 OK
// Fires: No event
```

#### Bulk Operations

**POST** `/api/v12/secondary-tokens/bulk-create`
```json
{
  "requests": [
    {
      "parentTokenId": "uuid",
      "tokenType": "INCOME_STREAM",
      "faceValue": 1000.00,
      "owner": "addr",
      "revenueShare": 10.5,
      "frequency": "MONTHLY"
    },
    ...
  ]
}
// Response: 201 Created
// Body: BulkOperationResponse {
//   successCount: int,
//   errorCount: int,
//   created: [TokenResponse...],
//   errors: [String...]
// }
```

### Response Models

```java
// Success Response
{
  "tokenId": "550e8400-e29b-41d4-a716-446655440000",
  "parentTokenId": "550e8400-e29b-41d4-a716-446655440001",
  "owner": "0x123abc...",
  "tokenType": "INCOME_STREAM",
  "status": "CREATED",
  "faceValue": 1000.00,
  "createdAt": "2025-12-23T10:30:00Z"
}

// Error Response
{
  "error": "Token not found: tokenId123",
  "status": 404,
  "timestamp": "2025-12-23T10:30:00Z"
}

// Bulk Response
{
  "successCount": 95,
  "errorCount": 5,
  "created": [TokenResponse...],
  "errors": ["Failed to create INCOME_STREAM: Invalid parent token", ...]
}
```

---

## Integration Points

### 1. Primary Token Registry Integration

```java
// Before creating secondary token, validate parent exists
PrimaryTokenRegistry.RegistryEntry parentEntry =
    primaryRegistry.lookup(parentTokenId).await().indefinitely();

if (parentEntry == null) {
    throw new IllegalArgumentException("Parent token not found");
}

if (parentEntry.status == PrimaryToken.PrimaryTokenStatus.RETIRED) {
    throw new IllegalArgumentException("Cannot create from retired primary");
}
```

### 2. Revenue Distribution System Integration

```java
// Listen for activation events
public class RevenueDistributionService {
    @Inject
    Event<SecondaryTokenService.TokenActivatedEvent> tokenActivated;

    void onActivation(@Observes TokenActivatedEvent event) {
        // Initialize revenue distribution
        // Set up scheduled payments
        // Register holder in distribution system
    }
}
```

### 3. Versioning System Integration (Story 4)

```java
// Secondary token supports versioning
// Query methods already prepared in registry:
Uni<List<SecondaryTokenVersion>> getVersionChain(String tokenId)
Uni<SecondaryTokenVersion> getActiveVersion(String tokenId)
Uni<List<SecondaryTokenVersion>> getVersionsByStatus(String tokenId, status)

// Versionable fields (per version):
// - Revenue share changes
// - Holder changes
// - Distribution frequency changes
// - Status transitions with reason
```

### 4. Audit Trail Integration

```java
// Transfer events fire for audit logging
@Observes TokenTransferredEvent event
// event contains: tokenId, fromOwner, toOwner, timestamp
// Use for: ownership audit, access control logs, compliance

// Activation/Redemption events for revenue audit
@Observes TokenActivatedEvent / TokenRedeemedEvent
// Use for: revenue lifecycle audit, settlement records
```

---

## Common Operations

### Creating Tokens in Bulk (100+ tokens)

```java
// Preparation
List<CreateTokenRequest> requests = new ArrayList<>();
for (int i = 0; i < 100; i++) {
    requests.add(new CreateTokenRequest(
        parentTokenId,
        "INCOME_STREAM",
        BigDecimal.valueOf(1000 * (i+1)),
        "owner-" + i,
        BigDecimal.valueOf(10.0),
        SecondaryToken.DistributionFrequency.MONTHLY
    ));
}

// Execution
BulkOperationResult result = service.bulkCreate(requests)
    .await().indefinitely();

// Results
System.out.println("Success: " + result.successCount);
System.out.println("Errors: " + result.errorCount);
for (String error : result.errors) {
    System.err.println(error);
}
```

### Querying Parent's Children by Type

```java
// Find all INCOME_STREAM tokens for a parent
List<RegistryEntry> incomeTokens =
    registry.getChildrenByType(parentTokenId,
                              SecondaryTokenType.INCOME_STREAM)
            .await().indefinitely();

System.out.println("Parent has " + incomeTokens.size() +
                   " income stream tokens");

// Calculate total face value
BigDecimal totalValue = incomeTokens.stream()
    .map(e -> e.faceValue)
    .reduce(BigDecimal.ZERO, BigDecimal::add);

System.out.println("Total value: " + totalValue);
```

### Validating Cascade Before Retiring Primary

```java
// Before retiring a primary token, check for active secondary
String primaryTokenId = "...";

long activeSecondaryCount = registry.countActiveByParent(primaryTokenId)
    .await().indefinitely();

if (activeSecondaryCount > 0) {
    System.err.println("ERROR: Cannot retire primary with " +
                      activeSecondaryCount + " active secondary tokens");
    // List them
    List<RegistryEntry> active = registry.lookupByParent(primaryTokenId)
        .await().indefinitely();
    for (RegistryEntry entry : active) {
        System.out.println("  - " + entry.tokenId + " (status: " +
                          entry.status + ")");
    }
    return;
}

// OK to retire primary
primaryService.retire(primaryTokenId);
```

### Generating and Verifying Merkle Proofs

```java
// Build tree
List<SecondaryToken> tokens = registry.lookupByParent(parentId)
    .map(entries -> entries.stream()
                           .map(e -> findTokenById(e.tokenId))
                           .collect(toList()))
    .await().indefinitely();

MerkleTree tree = merkleService.buildSecondaryTokenTree(tokens);

// Generate proof for specific token
MerkleProof proof = merkleService.generateTokenProof(tree, 5); // Token at index 5

// Verify proof
boolean valid = merkleService.verifyProof(proof);
System.out.println("Proof valid: " + valid);

// Composite proof (with parent chain)
CompositeMerkleProof composite =
    merkleService.generateCompositeProof(
        proof,
        tokenId,
        parentTokenId,
        primaryMerkleRoot
    );

boolean fullChainValid = merkleService.verifyCompositeProof(composite);
System.out.println("Full chain valid: " + fullChainValid);
```

---

## Troubleshooting

### Issue: Token not found when creating secondary

**Symptom**: `IllegalArgumentException: Parent token not found: <tokenId>`

**Cause**: Parent token doesn't exist in PrimaryTokenRegistry

**Solution**:
1. Verify parent token was created: `GET /api/v11/primary-tokens/{parentId}`
2. Confirm token ID format (should be UUID)
3. Check parent token status (must not be RETIRED)

```java
PrimaryTokenRegistry.RegistryEntry parent =
    primaryRegistry.lookup(parentTokenId).await().indefinitely();
if (parent == null) {
    System.err.println("Parent not found. Create it first.");
}
```

### Issue: Cannot retire primary token

**Symptom**: `IllegalStateException: Cannot retire primary with N active secondary tokens`

**Cause**: Parent has active secondary children that must be retired first

**Solution**:
```java
// Find and retire active secondary tokens first
List<RegistryEntry> children =
    registry.lookupByParent(parentTokenId).await().indefinitely();

for (RegistryEntry child : children) {
    if (child.status == SecondaryTokenStatus.ACTIVE) {
        service.redeemToken(child.tokenId, "system").await().indefinitely();
    }
}

// Now retire parent
primaryService.retire(parentTokenId);
```

### Issue: High latency on bulk create operations

**Symptom**: Bulk creation of 1000+ tokens takes >500ms

**Cause**: Synchronous registry updates, Merkle tree rebuilding for each token

**Solution** (Story 4 enhancement):
1. Batch index updates every 100 tokens
2. Defer Merkle tree rebuild until end
3. Use async processing for I/O operations

For now, recommend:
```java
// Chunk bulk creates
int chunkSize = 100;
for (int i = 0; i < requests.size(); i += chunkSize) {
    List<CreateTokenRequest> chunk =
        requests.subList(i, Math.min(i + chunkSize, requests.size()));

    BulkOperationResult result = service.bulkCreate(chunk)
        .await().indefinitely();

    System.out.println("Chunk " + (i/chunkSize) + ": " +
                      result.successCount + " created");
}
```

### Issue: Merkle proof verification failing

**Symptom**: `boolean valid = verifyProof(proof)` returns false

**Cause**: Token was modified after proof generation, tree changed

**Solution**:
```java
// Verify token hasn't changed
String tokenHash = merkleService.hashSecondaryToken(token);
if (!tokenHash.equals(proof.leafHash)) {
    System.err.println("Token modified after proof generation");
    return false;
}

// Verify tree hasn't changed
if (!proof.root.equals(merkleService.getCachedTokenTree("registry").root)) {
    System.err.println("Registry tree changed after proof generation");
    // Regenerate proof from current tree
    MerkleTree currentTree = merkleService.getCachedTokenTree("registry");
    MerkleProof newProof = merkleService.generateTokenProof(currentTree, index);
    return merkleService.verifyProof(newProof);
}
```

### Issue: Registry consistency check fails

**Symptom**: `validateConsistency()` reports inconsistencies

**Cause**: Index corruption or race condition in concurrent updates

**Solution**:
```java
ConsistencyReport report = registry.validateConsistency()
    .await().indefinitely();

if (!report.consistent) {
    System.err.println("Registry inconsistent! Issues:");
    for (String issue : report.issues) {
        System.err.println("  - " + issue);
    }

    // Clear and rebuild
    registry.clear();
    List<SecondaryToken> allTokens = loadAllTokens();
    registry.bulkRegister(allTokens).await().indefinitely();

    System.out.println("Registry rebuilt. Verify again:");
    ConsistencyReport newReport = registry.validateConsistency()
        .await().indefinitely();
    System.out.println("Now consistent: " + newReport.consistent);
}
```

---

## Performance Tuning Tips

### 1. Merkle Tree Caching
```java
// Cache frequently accessed trees
merkleService.cacheTokenTree("parent-" + parentTokenId, tree);

// Reuse cached tree for incremental updates
MerkleTree cachedTree = merkleService.getCachedTokenTree("parent-" + parentTokenId);
if (cachedTree != null) {
    MerkleTree updated = merkleService.addTokenToTree(cachedTree, newToken);
    merkleService.cacheTokenTree("parent-" + parentTokenId, updated);
}
```

### 2. Index Optimization
```java
// Warm up indexes on startup
List<SecondaryToken> allTokens = loadAllTokens();
registry.bulkRegister(allTokens).await().indefinitely();

// Monitor index sizes
RegistryStats stats = registry.getStats();
System.out.println("Registry size: " + stats.totalTokens);
System.out.println("Unique parents: " + stats.uniqueParents);
System.out.println("Unique owners: " + stats.uniqueOwners);
```

### 3. Query Optimization
```java
// Use most specific queries
// GOOD: lookupByParent() then filter by type
List<RegistryEntry> children = registry.lookupByParent(parentId)
    .await().indefinitely();
List<RegistryEntry> incomeChildren = children.stream()
    .filter(e -> e.tokenType == SecondaryTokenType.INCOME_STREAM)
    .collect(toList());

// BETTER: Use type filtering directly if index supports range queries
List<RegistryEntry> typeFiltered = registry.getChildrenByType(
    parentId, SecondaryTokenType.INCOME_STREAM)
    .await().indefinitely();
```

---

## Next Steps (Story 4)

The Secondary Token Implementation Guide prepares for Story 4 Versioning System integration:

1. **Version-Aware Registry Methods** already in code:
   - `getVersionChain(tokenId)`
   - `getActiveVersion(tokenId)`
   - `countVersionsByToken(tokenId)`
   - `getVersionsByStatus(tokenId, status)`
   - `getVersionHistory(tokenId)`

2. **Story 4 Will Implement**:
   - SecondaryTokenVersion entity with state machine
   - VVB approval workflow integration
   - Version change tracking and audit trail
   - Revenue distribution version hooks

3. **Integration Points Ready**:
   - Registry calls to versioningService already prepared
   - Event structure supports version context
   - Merkle service can hash version data

---

**Documentation Complete**
**Version**: 1.0
**Last Updated**: December 23, 2025
**Next Review**: After Story 4 implementation

