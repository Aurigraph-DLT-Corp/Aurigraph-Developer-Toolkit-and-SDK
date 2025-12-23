# Story 5 Detailed Implementation Guide

**JIRA Ticket**: AV11-601-05
**Epic**: AV11-601 (Secondary Token Versioning)
**Sprint**: Sprint 1
**Story Points**: 8 SP
**Duration**: 5 days (Dec 24-29, 2025)
**Status**: 📋 Ready to Kickoff
**Dependencies**: Story 4 ✅ (Deployed)

---

## 📌 Executive Summary

**VVB Approval Workflow** implements multi-validator approval for secondary token version changes. When a token version is created and moves to `PENDING_VVB` state, it requires approval from a Virtual Validator Board (VVB) before becoming active.

**Key Innovation**: Byzantine Fault Tolerance (BFT) consensus — the system can tolerate up to 1/3 malicious or unresponsive validators while still reaching consensus.

---

## 🎯 Story Objectives

By end of Story 5, deliver:

1. ✅ **VVBApprovalService** - Core approval logic
2. ✅ **ValidatorVote System** - Track individual votes
3. ✅ **Consensus Algorithm** - Configurable majority voting
4. ✅ **REST API Endpoints** - Full CRUD + voting
5. ✅ **State Machine Integration** - Connect to version lifecycle
6. ✅ **CDI Events** - Approval workflow triggers
7. ✅ **120+ Tests** - Comprehensive coverage
8. ✅ **Full Documentation** - Architecture + API guides

---

## 🏗️ Architecture & Design

### System Architecture

```
┌─────────────────────────────────────────────────────┐
│  SecondaryTokenVersioningService                    │
│  (existing from Story 4)                            │
└──────────────────┬──────────────────────────────────┘
                   │ creates version
                   ▼
┌─────────────────────────────────────────────────────┐
│  SecondaryTokenVersion (CREATED state)              │
│  ├─ tokenId, versionNumber, changes                │
│  └─ status = CREATED (waiting for VVB submission)  │
└──────────────────┬──────────────────────────────────┘
                   │ submitForVVBApproval() called
                   ▼
┌─────────────────────────────────────────────────────┐
│  VVBApprovalService (NEW - Story 5)                │
│  ├─ createApprovalRequest()                        │
│  ├─ submitValidatorVote()                          │
│  ├─ calculateConsensus()                           │
│  ├─ executeApproval()                              │
│  └─ executeRejection()                             │
└──────────────────┬──────────────────────────────────┘
                   │
         ┌─────────┴──────────┐
         │ collect votes      │
         ▼                    ▼
    ┌─────────────┐     ┌──────────────┐
    │  Validator1 │     │  Validator2  │
    │  votes YES  │     │  votes YES   │
    └─────────────┘     └──────────────┘
              │                │
              └────────┬───────┘
                       ▼
            ┌───────────────────────┐
            │ Consensus Reached?    │
            │ (2/3 = 67% YES)      │
            │ Threshold: 2/3       │
            │ Current: 2/3 ✅      │
            └──────────┬────────────┘
                       │ YES
                       ▼
    ┌──────────────────────────────────┐
    │ executeApproval()                │
    │ ├─ Update version → ACTIVE       │
    │ ├─ Fire ApprovalEvent            │
    │ ├─ Create audit log              │
    │ └─ Send notification             │
    └──────────────────────────────────┘
                       │
                       ▼
    ┌──────────────────────────────────┐
    │ SecondaryTokenVersion            │
    │ status = ACTIVE (approved)       │
    │ approvalCount = 2                │
    │ approvedAt = timestamp           │
    └──────────────────────────────────┘
```

### Entity-Relationship Diagram

```
┌─────────────────────────────────────┐
│  secondary_token_versions          │
│  (from Story 4)                    │
├─────────────────────────────────────┤
│ version_id (PK)                    │
│ token_id (FK)                      │
│ status: CREATED → PENDING_VVB      │
│ → ACTIVE/ARCHIVED                  │
│ approval_request_id (FK) ← NEW     │
└──────────┬──────────────────────────┘
           │
           │ 1:1 (optional)
           │
           ▼
┌─────────────────────────────────────┐
│  vvb_approval_requests (NEW)       │
├─────────────────────────────────────┤
│ request_id (PK) - UUID             │
│ token_version_id (FK)              │
│ created_at: TIMESTAMP              │
│ voting_window: TIMESTAMP           │
│ status: PENDING/APPROVED/REJECTED  │
│ approval_threshold: INT (default 67)│
│ approval_count: INT                │
│ total_voters: INT                  │
│ merkle_proof: TEXT                 │
└──────────┬──────────────────────────┘
           │
           │ 1:N (one request, many votes)
           │
           ▼
┌─────────────────────────────────────┐
│  validator_votes (NEW)             │
├─────────────────────────────────────┤
│ vote_id (PK) - UUID                │
│ approval_request_id (FK)           │
│ validator_id: VARCHAR              │
│ vote: ENUM(YES, NO, ABSTAIN)      │
│ signature: VARCHAR (signed)        │
│ voted_at: TIMESTAMP                │
│ reason: TEXT (optional)            │
└─────────────────────────────────────┘
```

---

## 📝 Implementation Tasks - Day-by-Day

### Day 1: Entity Models & Database Schema

#### Task 1.1: Create VVBApprovalRequest Entity (2 hours)

**File**: `src/main/java/io/aurigraph/v11/token/secondary/VVBApprovalRequest.java`

```java
@Entity
@Table(name = "vvb_approval_requests")
public class VVBApprovalRequest {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID requestId;

    @Column(name = "token_version_id", nullable = false)
    private String tokenVersionId;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt;

    @Column(name = "voting_window", nullable = false)
    private Instant votingWindow;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private ApprovalStatus status; // PENDING, APPROVED, REJECTED, EXPIRED

    @Column(name = "approval_threshold", nullable = false)
    private Integer approvalThreshold; // e.g., 67 for 2/3

    @Column(name = "approval_count", nullable = false)
    private Integer approvalCount; // default 0

    @Column(name = "total_voters", nullable = false)
    private Integer totalVoters; // number of validators

    @Column(name = "merkle_proof", columnDefinition = "TEXT")
    private String merkleProof;

    @Column(name = "updated_at")
    private Instant updatedAt;

    // Getters, setters, equals, hashCode
    // 80 LOC total
}
```

**Enums** (create `ApprovalStatus.java`):
```java
public enum ApprovalStatus {
    PENDING,    // Waiting for votes
    APPROVED,   // Threshold reached
    REJECTED,   // Failed to reach threshold
    EXPIRED     // Voting window expired
}
```

**Acceptance Criteria**:
- ✅ Entity maps to `vvb_approval_requests` table
- ✅ UUID primary key
- ✅ Proper timestamps (createdAt, votingWindow, updatedAt)
- ✅ Status enumeration working
- ✅ Merkle proof field for cryptographic verification

---

#### Task 1.2: Create ValidatorVote Entity (1 hour)

**File**: `src/main/java/io/aurigraph/v11/token/secondary/ValidatorVote.java`

```java
@Entity
@Table(name = "validator_votes")
@UniqueConstraint(columnNames = {"approval_request_id", "validator_id"})
public class ValidatorVote {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID voteId;

    @Column(name = "approval_request_id", nullable = false)
    private UUID approvalRequestId;

    @Column(name = "validator_id", nullable = false)
    private String validatorId; // Validator address/ID

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private VoteChoice vote; // YES, NO, ABSTAIN

    @Column(name = "signature", columnDefinition = "VARCHAR(1024)")
    private String signature; // Ed25519 signature

    @Column(name = "voted_at", nullable = false)
    private Instant votedAt;

    @Column(name = "reason", columnDefinition = "TEXT")
    private String reason; // Optional reason for vote

    // Getters, setters, equals, hashCode
    // 60 LOC total
}
```

**Enum** (`VoteChoice.java`):
```java
public enum VoteChoice {
    YES,      // Approve version
    NO,       // Reject version
    ABSTAIN   // Neutral (counts as non-vote)
}
```

**Acceptance Criteria**:
- ✅ Entity maps to `validator_votes` table
- ✅ Unique constraint: one vote per validator per request
- ✅ Signature field for vote authentication
- ✅ Timestamp of vote
- ✅ Optional reason field

---

#### Task 1.3: Database Migration (1 hour)

**File**: `src/main/resources/db/migration/V31__create_vvb_approval_schema.sql`

```sql
-- VVB Approval Requests Table
CREATE TABLE vvb_approval_requests (
    request_id UUID PRIMARY KEY,
    token_version_id VARCHAR(255) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    voting_window TIMESTAMP NOT NULL,
    status VARCHAR(50) NOT NULL CHECK (status IN ('PENDING', 'APPROVED', 'REJECTED', 'EXPIRED')),
    approval_threshold INTEGER NOT NULL DEFAULT 67,
    approval_count INTEGER NOT NULL DEFAULT 0,
    total_voters INTEGER NOT NULL,
    merkle_proof TEXT,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (token_version_id) REFERENCES secondary_token_versions(version_id) ON DELETE CASCADE
);

-- Validator Votes Table
CREATE TABLE validator_votes (
    vote_id UUID PRIMARY KEY,
    approval_request_id UUID NOT NULL,
    validator_id VARCHAR(255) NOT NULL,
    vote VARCHAR(50) NOT NULL CHECK (vote IN ('YES', 'NO', 'ABSTAIN')),
    signature VARCHAR(1024),
    voted_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    reason TEXT,
    FOREIGN KEY (approval_request_id) REFERENCES vvb_approval_requests(request_id) ON DELETE CASCADE,
    UNIQUE (approval_request_id, validator_id)
);

-- Indexes for performance
CREATE INDEX idx_approval_token_version ON vvb_approval_requests(token_version_id);
CREATE INDEX idx_approval_status ON vvb_approval_requests(status);
CREATE INDEX idx_approval_created ON vvb_approval_requests(created_at);
CREATE INDEX idx_vote_request ON validator_votes(approval_request_id);
CREATE INDEX idx_vote_validator ON validator_votes(validator_id);
CREATE INDEX idx_vote_time ON validator_votes(voted_at);
```

**Acceptance Criteria**:
- ✅ Tables created successfully
- ✅ Foreign key constraints working
- ✅ Unique constraints enforced
- ✅ Indexes created for performance
- ✅ Check constraints validate enum values

---

### Day 2: Core Service Implementation

#### Task 2.1: VVBApprovalRegistry (3 hours)

**File**: `src/main/java/io/aurigraph/v11/token/secondary/VVBApprovalRegistry.java`

```java
@ApplicationScoped
public class VVBApprovalRegistry {

    private final ConcurrentHashMap<UUID, VVBApprovalRequest> requestsById;
    private final ConcurrentHashMap<String, List<UUID>> requestsByTokenVersion;
    private final ConcurrentHashMap<UUID, List<ValidatorVote>> votesByRequest;
    private final ConcurrentHashMap<String, ValidatorVote> votesByValidator;

    public VVBApprovalRegistry() {
        this.requestsById = new ConcurrentHashMap<>();
        this.requestsByTokenVersion = new ConcurrentHashMap<>();
        this.votesByRequest = new ConcurrentHashMap<>();
        this.votesByValidator = new ConcurrentHashMap<>();
    }

    // Core Methods
    public void registerRequest(VVBApprovalRequest request) { /* ... */ }
    public Optional<VVBApprovalRequest> lookupRequest(UUID requestId) { /* ... */ }
    public List<VVBApprovalRequest> lookupByTokenVersion(String tokenVersionId) { /* ... */ }
    public void registerVote(ValidatorVote vote) { /* ... */ }
    public int countApprovals(UUID requestId) { /* ... */ }
    public int countRejections(UUID requestId) { /* ... */ }
    public Optional<ValidatorVote> getValidatorVote(UUID requestId, String validatorId) { /* ... */ }
    public List<ValidatorVote> getVotes(UUID requestId) { /* ... */ }

    // Statistics
    public ApprovalStats getStats() { /* ... */ }

    // 180 LOC total
}
```

**Acceptance Criteria**:
- ✅ 4 concurrent index maps
- ✅ All lookups <5ms (performance target)
- ✅ Thread-safe operations
- ✅ Statistics calculation methods
- ✅ O(1) lookup by requestId, O(log n) by tokenVersionId

---

#### Task 2.2: VVBApprovalService (6 hours)

**File**: `src/main/java/io/aurigraph/v11/token/secondary/VVBApprovalService.java`

```java
@ApplicationScoped
public class VVBApprovalService {

    @Inject
    VVBApprovalRegistry registry;

    @Inject
    SecondaryTokenVersioningService versionService;

    @Inject
    Event<ApprovalRequestEvent> approvalRequestEvent;
    @Inject
    Event<ApprovalEvent> approvalEvent;
    @Inject
    Event<RejectionEvent> rejectionEvent;
    @Inject
    Event<ConsensusReachedEvent> consensusEvent;

    /**
     * Create new approval request for a token version
     * @param tokenVersionId The version to approve
     * @param validators List of validator addresses
     * @param votingWindowSeconds How long to accept votes
     * @return ApprovalRequestId
     */
    public UUID createApprovalRequest(
        String tokenVersionId,
        List<String> validators,
        int votingWindowSeconds
    ) {
        // Validation
        if (validators.size() < 3) {
            throw new ValidationException("Minimum 3 validators required");
        }

        if (votingWindowSeconds < 30 || votingWindowSeconds > 300) {
            throw new ValidationException("Voting window must be 30-300 seconds");
        }

        // Create request
        UUID requestId = UUID.randomUUID();
        VVBApprovalRequest request = new VVBApprovalRequest();
        request.setRequestId(requestId);
        request.setTokenVersionId(tokenVersionId);
        request.setCreatedAt(Instant.now());
        request.setVotingWindow(Instant.now().plusSeconds(votingWindowSeconds));
        request.setStatus(ApprovalStatus.PENDING);
        request.setApprovalThreshold(67); // 2/3 default
        request.setApprovalCount(0);
        request.setTotalVoters(validators.size());

        // Fire event
        registry.registerRequest(request);
        approvalRequestEvent.fire(new ApprovalRequestEvent(requestId, tokenVersionId));

        return requestId;
    }

    /**
     * Submit validator vote for approval request
     */
    public void submitValidatorVote(
        UUID requestId,
        String validatorId,
        VoteChoice vote,
        String signature
    ) throws InvalidSignatureException, VotingWindowExpiredException {
        // Validation
        VVBApprovalRequest request = registry.lookupRequest(requestId)
            .orElseThrow(() -> new NotFoundException("Approval request not found"));

        if (Instant.now().isAfter(request.getVotingWindow())) {
            throw new VotingWindowExpiredException("Voting window expired");
        }

        // Verify signature (Ed25519)
        if (!verifySignature(vote, validatorId, signature)) {
            throw new InvalidSignatureException("Vote signature invalid");
        }

        // Record vote (idempotent - updates previous vote)
        ValidatorVote validatorVote = new ValidatorVote();
        validatorVote.setVoteId(UUID.randomUUID());
        validatorVote.setApprovalRequestId(requestId);
        validatorVote.setValidatorId(validatorId);
        validatorVote.setVote(vote);
        validatorVote.setSignature(signature);
        validatorVote.setVotedAt(Instant.now());

        registry.registerVote(validatorVote);
    }

    /**
     * Calculate current consensus status
     */
    public ConsensusResult calculateConsensus(UUID requestId) {
        VVBApprovalRequest request = registry.lookupRequest(requestId)
            .orElseThrow(() -> new NotFoundException("Approval request not found"));

        int approvalCount = registry.countApprovals(requestId);
        int totalVoters = request.getTotalVoters();
        int threshold = request.getApprovalThreshold();

        // Calculate percentage
        int percentage = (approvalCount * 100) / totalVoters;
        boolean consensusReached = percentage >= threshold;

        // Check if impossible to reach
        int remainingVotes = totalVoters - approvalCount - registry.countRejections(requestId);
        int maxPossible = (approvalCount + remainingVotes) * 100 / totalVoters;
        boolean impossibleToReach = maxPossible < threshold;

        return new ConsensusResult(
            consensusReached,
            impossibleToReach,
            approvalCount,
            totalVoters,
            percentage
        );
    }

    /**
     * Execute approval (move version to ACTIVE)
     */
    public void executeApproval(UUID requestId) {
        VVBApprovalRequest request = registry.lookupRequest(requestId)
            .orElseThrow(() -> new NotFoundException("Approval request not found"));

        ConsensusResult consensus = calculateConsensus(requestId);

        if (!consensus.isConsensusReached()) {
            throw new ConsensusNotReachedException("Approval threshold not met");
        }

        // Update version status
        versionService.approveVersion(request.getTokenVersionId());

        // Update approval request
        request.setStatus(ApprovalStatus.APPROVED);
        request.setUpdatedAt(Instant.now());
        registry.registerRequest(request);

        // Fire approval event
        approvalEvent.fire(new ApprovalEvent(requestId, request.getTokenVersionId()));
    }

    /**
     * Execute rejection (archive version)
     */
    public void executeRejection(UUID requestId) {
        VVBApprovalRequest request = registry.lookupRequest(requestId)
            .orElseThrow(() -> new NotFoundException("Approval request not found"));

        // Archive version
        versionService.archiveVersion(request.getTokenVersionId());

        // Update approval request
        request.setStatus(ApprovalStatus.REJECTED);
        request.setUpdatedAt(Instant.now());
        registry.registerRequest(request);

        // Fire rejection event
        rejectionEvent.fire(new RejectionEvent(requestId, request.getTokenVersionId()));
    }

    private boolean verifySignature(VoteChoice vote, String validatorId, String signature) {
        // Ed25519 signature verification
        // Implementation details...
        return true; // Simplified
    }

    // 230 LOC total
}
```

**Acceptance Criteria**:
- ✅ Approval request creation with validation
- ✅ Vote submission with signature verification
- ✅ Consensus calculation (Byzantine FT logic)
- ✅ Approval execution (move to ACTIVE)
- ✅ Rejection execution (archive version)
- ✅ CDI events fired for all state changes
- ✅ Idempotent operations
- ✅ Proper error handling

---

#### Task 2.3: VVBApprovalResource (4 hours)

**File**: `src/main/java/io/aurigraph/v11/token/secondary/VVBApprovalResource.java`

```java
@Path("/api/v12/vvb")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
public class VVBApprovalResource {

    @Inject
    VVBApprovalService approvalService;

    @Inject
    VVBApprovalRegistry registry;

    /**
     * GET /api/v12/vvb/approvals/{requestId}
     */
    @GET
    @Path("/approvals/{requestId}")
    public ApprovalResponseDTO getApproval(@PathParam("requestId") UUID requestId) {
        VVBApprovalRequest request = registry.lookupRequest(requestId)
            .orElseThrow(() -> new NotFoundException("Approval request not found"));

        ConsensusResult consensus = approvalService.calculateConsensus(requestId);

        return new ApprovalResponseDTO(request, consensus);
    }

    /**
     * POST /api/v12/vvb/approvals/{requestId}/vote
     */
    @POST
    @Path("/approvals/{requestId}/vote")
    public VoteResponseDTO submitVote(
        @PathParam("requestId") UUID requestId,
        VoteRequestDTO voteRequest
    ) throws InvalidSignatureException {
        approvalService.submitValidatorVote(
            requestId,
            voteRequest.getValidatorId(),
            voteRequest.getVote(),
            voteRequest.getSignature()
        );

        ConsensusResult consensus = approvalService.calculateConsensus(requestId);

        return new VoteResponseDTO(
            "Vote recorded successfully",
            consensus
        );
    }

    /**
     * PUT /api/v12/vvb/approvals/{requestId}/execute
     */
    @PUT
    @Path("/approvals/{requestId}/execute")
    public ApprovalExecutionDTO executeApproval(@PathParam("requestId") UUID requestId) {
        ConsensusResult consensus = approvalService.calculateConsensus(requestId);

        if (!consensus.isConsensusReached()) {
            throw new BadRequestException("Consensus threshold not reached");
        }

        approvalService.executeApproval(requestId);

        return new ApprovalExecutionDTO("Approval executed successfully", requestId);
    }

    /**
     * GET /api/v12/vvb/approvals (list all)
     */
    @GET
    @Path("/approvals")
    public List<ApprovalResponseDTO> listApprovals(
        @QueryParam("status") ApprovalStatus status,
        @QueryParam("limit") @DefaultValue("100") int limit
    ) {
        return registry.getStats()
            .getApprovalsByStatus(status)
            .stream()
            .limit(limit)
            .map(req -> new ApprovalResponseDTO(req, approvalService.calculateConsensus(req.getRequestId())))
            .toList();
    }

    // 280 LOC total
}
```

**DTOs** (create separate files):
- `ApprovalResponseDTO` - Status + consensus info
- `VoteRequestDTO` - Vote submission
- `VoteResponseDTO` - Vote confirmation
- `ApprovalExecutionDTO` - Approval result

**Acceptance Criteria**:
- ✅ 5 REST endpoints (GET, POST, PUT)
- ✅ Proper HTTP status codes (200, 400, 404, etc.)
- ✅ Request/response validation
- ✅ OpenAPI/Swagger documentation
- ✅ Error responses with details
- ✅ Pagination support

---

### Day 3: Integration & Testing Prep

#### Task 3.1: CDI Event Classes (1 hour)

**Files**: Create 4 event classes

```java
// ApprovalRequestEvent.java
public class ApprovalRequestEvent {
    private UUID requestId;
    private String tokenVersionId;
    // Constructor, getters
}

// ApprovalEvent.java
public class ApprovalEvent {
    private UUID requestId;
    private String tokenVersionId;
    // Constructor, getters
}

// RejectionEvent.java
public class RejectionEvent {
    private UUID requestId;
    private String tokenVersionId;
    // Constructor, getters
}

// ConsensusReachedEvent.java
public class ConsensusReachedEvent {
    private UUID requestId;
    private int approvalCount;
    private int totalVoters;
    // Constructor, getters
}
```

**Acceptance Criteria**:
- ✅ Events are immutable data carriers
- ✅ Proper constructors and getters
- ✅ Can be fired via @Inject Event<T>

---

#### Task 3.2: State Machine Integration (2 hours)

**Modify**: `SecondaryTokenVersioningService.java`

Add method:
```java
public void submitForVVBApproval(
    String tokenVersionId,
    List<String> validators,
    int votingWindowSeconds
) {
    // Change version state
    SecondaryTokenVersion version = versionRepository.findById(tokenVersionId);
    version.setStatus(TokenVersionStatus.PENDING_VVB);
    versionRepository.update(version);

    // Create approval request
    UUID requestId = vvbApprovalService.createApprovalRequest(
        tokenVersionId,
        validators,
        votingWindowSeconds
    );

    // Store approval request ID in version
    version.setApprovalRequestId(requestId);
    versionRepository.update(version);
}
```

**Acceptance Criteria**:
- ✅ Version state transitions working
- ✅ Approval request linked to version
- ✅ Events fired at each step

---

#### Task 3.3: Test Infrastructure Setup (1 hour)

Create test utilities:
- `VVBTestData.java` - Test data generators
- `MockValidator.java` - Mock validator for testing
- `SignatureGenerator.java` - Generate test signatures

---

### Day 4-5: Comprehensive Testing

#### Test Suite (120+ tests across 4 classes)

**VVBApprovalServiceTest.java** (50 tests)
- Approval request creation (8 tests)
- Vote submission (15 tests)
- Consensus calculation (12 tests)
- Approval execution (10 tests)
- Rejection handling (5 tests)

**VVBApprovalRegistryTest.java** (35 tests)
- Index operations (20 tests)
- Statistics (10 tests)
- Data consistency (5 tests)

**VVBApprovalResourceTest.java** (25 tests)
- REST API endpoints (15 tests)
- DTO validation (10 tests)

**VVBApprovalStateMachineTest.java** (10 tests)
- State transitions (7 tests)
- Event firing (3 tests)

**Acceptance Criteria**:
- ✅ All 120+ tests passing
- ✅ >95% code coverage
- ✅ Zero flaky tests
- ✅ All edge cases covered

---

## 🎯 Key Implementation Details

### Consensus Algorithm

```java
// Simple 2/3 majority
int threshold = 67; // 67%
int percentage = (approvalCount * 100) / totalVoters;
boolean consensusReached = percentage >= threshold;

// Early termination
int rejectionCount = totalVoters - approvalCount - abstainCount;
int maxPossibleApprovals = approvalCount + (totalVoters - approvalCount - rejectionCount);
int maxPossiblePercentage = (maxPossibleApprovals * 100) / totalVoters;
boolean impossibleToReach = maxPossiblePercentage < threshold;

if (impossibleToReach) {
    executeRejection(); // Fail early
}
```

### Signature Verification

```java
// Ed25519 signature verification
public boolean verifySignature(VoteChoice vote, String validatorId, String signature) {
    String message = vote.name() + "|" + validatorId;
    byte[] messageBytes = message.getBytes(StandardCharsets.UTF_8);
    byte[] signatureBytes = Base64.getDecoder().decode(signature);
    byte[] validatorPubKey = getValidatorPublicKey(validatorId);

    // Verify using Ed25519
    SigningKey signingKey = new SigningKey(validatorPubKey);
    return signingKey.verify(messageBytes, signatureBytes);
}
```

### Timeout Handling

```java
// Scheduled job to check expired approvals
@Scheduled(every = "30s")
public void checkExpiredApprovals() {
    Instant now = Instant.now();

    registry.getAllPendingRequests()
        .stream()
        .filter(req -> now.isAfter(req.getVotingWindow()))
        .forEach(req -> {
            ConsensusResult consensus = calculateConsensus(req.getRequestId());

            if (consensus.isConsensusReached()) {
                executeApproval(req.getRequestId());
            } else {
                executeRejection(req.getRequestId());
            }
        });
}
```

---

## 📊 Performance Targets

| Metric | Target | How to Verify |
|--------|--------|---------------|
| Request Creation | <50ms | Benchmark test |
| Vote Submission | <100ms | Benchmark test |
| Consensus Calculation | <10ms | Benchmark test |
| Registry Lookup | <5ms | Performance test |
| Vote Throughput | >1,000 votes/sec | Load test |

---

## 🔐 Security Considerations

1. **Signature Verification**: All votes must be signed (Ed25519)
2. **Validator Whitelist**: Only listed validators can vote
3. **Vote Idempotency**: Same validator can't vote twice
4. **Timeout Enforcement**: Voting window strictly enforced
5. **Audit Trail**: All votes logged immutably
6. **Merkle Proof**: Full chain of custody tracked

---

## 📚 Documentation to Create

1. **VVB Architecture Guide** (1,500 words)
   - System design
   - State diagrams
   - Consensus algorithm
   - Security model

2. **API Reference** (800 words)
   - Endpoint documentation
   - Request/response examples
   - Error codes
   - Rate limiting

3. **Deployment Guide** (600 words)
   - Prerequisites
   - Configuration
   - Monitoring
   - Troubleshooting

4. **Developer Guide** (400 words)
   - Integration points
   - How to extend
   - Testing patterns
   - Local development setup

---

## ✅ Definition of Done

Story 5 is complete when:

- [ ] All 4 service files written (900+ LOC)
- [ ] All 2 database tables created + migrated
- [ ] All 120+ tests passing (100% pass rate)
- [ ] >95% code coverage
- [ ] All 5 REST endpoints working
- [ ] CDI events firing correctly
- [ ] State machine integration complete
- [ ] Performance targets met (<10ms consensus)
- [ ] Security review passed
- [ ] All documentation written (3,300+ words)
- [ ] JIRA ticket moved to "Done"
- [ ] Code merged to main branch

---

## 🚀 Launch Readiness Checklist

Before starting implementation:

- [ ] Story 4 deployed successfully ✅
- [ ] Team reviewed planning document
- [ ] Design decisions agreed upon
- [ ] Validator list finalized
- [ ] Signature algorithm confirmed (Ed25519)
- [ ] Voting window defaults set (30-60s)
- [ ] Approval threshold configured (2/3 default)
- [ ] Testing environment ready
- [ ] CI/CD pipeline verified
- [ ] Monitoring setup for new endpoints

---

**Next Step**: Kick off Sprint 1, Day 4 (Dec 24, 2025) ✅

**Estimated Completion**: December 29, 2025 ✅

**Story Points**: 8 SP ✅
