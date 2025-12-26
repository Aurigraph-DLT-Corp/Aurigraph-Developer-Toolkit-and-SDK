# V11 Compilation Error Remediation Checklist

**Status**: READY FOR IMPLEMENTATION
**Total Tasks**: 35
**Estimated Duration**: 16-20 hours

---

## PHASE 1: INVESTIGATION & PLANNING (1-2 Hours)

### Data Model Discovery

- [ ] **Locate and read ValidatorVote entity**
  - File: `src/main/java/io/aurigraph/v11/token/secondary/ValidatorVote.java`
  - Key info needed: Field names, annotations
  - Questions: What field holds the vote choice? What are valid values?

- [ ] **Locate and read VoteChoice enum**
  - File: `src/main/java/io/aurigraph/v11/.../VoteChoice.java`
  - Key info needed: Enum constant names (APPROVE? YES? AFFIRM?)
  - Questions: What enum values are defined?

- [ ] **Locate and read ExecutionResult class**
  - File: `src/main/java/io/aurigraph/.../ExecutionResult.java`
  - Key info needed: Constructor parameters, field types
  - Questions: What 7 parameters does the constructor expect?

- [ ] **Locate and read ApprovalEvent class**
  - File: `src/main/java/io/aurigraph/.../ApprovalEvent.java`
  - Key info needed: Constructor parameters, field types
  - Questions: What 10 parameters does the constructor expect?

- [ ] **Check Mutiny BroadcastProcessor API**
  - Quarkus version: Check `pom.xml` for Mutiny version
  - Key info needed: Available methods on BroadcastProcessor<T>
  - Questions: Is method called `isTerminated()`? `hasDownstreamDemand()`?

- [ ] **Check VVBApprovalRegistry interface**
  - File: `src/main/java/io/aurigraph/.../VVBApprovalRegistry.java`
  - Key info needed: Currently defined methods
  - Questions: Is getApprovalById() already defined? getAllApprovals()?

### Decision Making

- [ ] **Decide on ID field types** (UUID vs String)
  - [ ] Option A: UUID fields in DTO (recommended)
  - [ ] Option B: String fields with .toString() conversion
  - [ ] Selected: ________

- [ ] **Decide on missing fields strategy**
  - [ ] Option A: Add to entity (recommended)
  - [ ] Option B: Query separately
  - [ ] Option C: Hybrid approach
  - [ ] Selected: ________

- [ ] **Create fix priority list** based on investigation
  - [ ] List errors by dependency order
  - [ ] Identify quick wins
  - [ ] Identify blockers

---

## PHASE 2: FIX IMPLEMENTATION (8-12 Hours)

### Fix Group 1: Type Conversions (1 Hour)

**File**: `src/main/java/io/aurigraph/v11/graphql/ApprovalDTO.java`

- [ ] **Error 1 & 2: UUID to String type mismatch (Lines 32, 34)**
  - [ ] Change field declaration: `public String id` → `public UUID id`
  - [ ] Change field declaration: `public String tokenVersionId` → `public UUID tokenVersionId`
  - [ ] Update constructor: Remove `.toString()` calls (if any)
  - [ ] Test compilation

**Before**:
```java
public String id;
public String tokenVersionId;

this.id = approval.requestId;           // ERROR
this.tokenVersionId = approval.tokenVersionId;  // ERROR
```

**After**:
```java
public UUID id;
public UUID tokenVersionId;

this.id = approval.requestId;
this.tokenVersionId = approval.tokenVersionId;
```

- [ ] Run `./mvnw clean compile` - 2 errors should be gone

### Fix Group 2: Missing Fields (2-3 Hours)

**File**: `src/main/java/io/aurigraph/v11/graphql/ApprovalDTO.java` (Lines 23-26, 37-40)

- [ ] **Remove or refactor missing fields**

  - [ ] **Option A - Remove fields from DTO**:
    ```java
    // Delete these lines:
    public List<ValidatorVote> votes;
    public LocalDateTime consensusReachedAt;
    public LocalDateTime executedAt;
    public LocalDateTime rejectedAt;

    // Delete these constructor lines:
    this.votes = approval.votes;
    this.consensusReachedAt = approval.consensusReachedAt;
    this.executedAt = approval.executedAt;
    this.rejectedAt = approval.rejectedAt;
    ```
    - [ ] Test compilation

  - [ ] **Option B - Query separately**:
    ```java
    // Keep field declarations but implement properly:
    this.votes = ValidatorVote.find("requestId = ?1", approval.requestId).list();

    // Calculate timestamps if needed:
    if (approval.status == ApprovalStatus.APPROVED) {
        this.consensusReachedAt = approval.updatedAt;
        this.executedAt = approval.updatedAt;
    }
    ```
    - [ ] Add necessary imports
    - [ ] Test compilation

  - [ ] **Option C - Add to entity**:
    - [ ] Open `VVBApprovalRequest.java`
    - [ ] Add fields:
      ```java
      @Column(name = "consensus_reached_at")
      public LocalDateTime consensusReachedAt;

      @Column(name = "executed_at")
      public LocalDateTime executedAt;

      @Column(name = "rejected_at")
      public LocalDateTime rejectedAt;

      @OneToMany(mappedBy = "approvalRequest")
      public List<ValidatorVote> votes;
      ```
    - [ ] Run database migrations if needed
    - [ ] Test compilation

- [ ] **Selected approach**: ________
- [ ] Run `./mvnw clean compile` - 4 errors should be gone

### Fix Group 3: Missing Registry Methods (1 Hour)

**File**: `src/main/java/io/aurigraph/v11/token/secondary/VVBApprovalRegistry.java`

- [ ] **Add missing methods to interface**:
  ```java
  public interface VVBApprovalRegistry {
      Optional<VVBApprovalRequest> getApprovalById(UUID id);
      List<VVBApprovalRequest> getAllApprovals();
      // ... existing methods ...
  }
  ```
  - [ ] Add method declarations
  - [ ] Save file

- [ ] **Implement methods in registry impl** (likely `VVBApprovalRegistryImpl.java`)
  ```java
  @Override
  public Optional<VVBApprovalRequest> getApprovalById(UUID id) {
      return VVBApprovalRequest.findByIdOptional(id);
  }

  @Override
  public List<VVBApprovalRequest> getAllApprovals() {
      return VVBApprovalRequest.listAll();
  }
  ```
  - [ ] Implement both methods
  - [ ] Add necessary imports
  - [ ] Save file

- [ ] **Alternative: Use Panache directly** (if registry not needed)
  - [ ] Open `ApprovalGraphQLAPI.java`
  - [ ] Replace `approvalRegistry.getApprovalById(id)` with:
    ```java
    VVBApprovalRequest.findByIdOptional(UUID.fromString(id))
        .map(ApprovalDTO::new)
        .orElseThrow(() -> new NotFoundException(...))
    ```
  - [ ] Replace `approvalRegistry.getAllApprovals()` with:
    ```java
    VVBApprovalRequest.listAll()
    ```

- [ ] Run `./mvnw clean compile` - 4 errors should be gone

### Fix Group 4: Constructor Mismatches (2 Hours)

**File**: `src/main/java/io/aurigraph/v11/graphql/ApprovalGraphQLAPI.java`

- [ ] **Error 18: ExecutionResult constructor (Line 159)**
  - [ ] Look at actual ExecutionResult constructor signature
  - [ ] Gather required parameters:
    - [ ] tokenId (UUID)
    - [ ] versionId (UUID)
    - [ ] contractAddress (String)
    - [ ] txHash (String)
    - [ ] beforeStatus (SecondaryTokenVersionStatus)
    - [ ] afterStatus (SecondaryTokenVersionStatus)
    - [ ] gasUsed (long)

  - [ ] Replace:
    ```java
    // OLD (ERROR)
    new ExecutionResult(approvalId, success, "Execution completed")

    // NEW
    new ExecutionResult(
        tokenId,
        versionId,
        contractAddress,
        txHash,
        SecondaryTokenVersionStatus.PENDING,
        SecondaryTokenVersionStatus.ACTIVE,
        gasUsed
    )
    ```
  - [ ] Save file

- [ ] **Error 19: ApprovalEvent constructor (Line 164)**
  - [ ] Look at actual ApprovalEvent constructor signature
  - [ ] Gather required parameters from ApprovalEvent class
  - [ ] Replace:
    ```java
    // OLD (ERROR)
    new ApprovalEvent(approvalId, "APPROVED", LocalDateTime.now())

    // NEW
    new ApprovalEvent(
        approval.requestId,
        approval.requestId,
        approval.tokenVersionId,
        approval.status.toString(),
        approval.approvalCount,
        approval.rejectionCount,
        approval.getApprovalPercentage(),
        Instant.now(),
        Collections.emptyList(),
        "Approval event"
    )
    ```
  - [ ] Save file

- [ ] Run `./mvnw clean compile` - 2 errors should be gone

### Fix Group 5: API & Field Name Mismatches (2-3 Hours)

**File**: `src/main/java/io/aurigraph/v11/graphql/ApprovalSubscriptionManager.java`

- [ ] **Errors 20, 21, 23, 24, 25: BroadcastProcessor.isClosed() not found**
  - [ ] Check Mutiny documentation for available methods
  - [ ] Replace `processor.isClosed()` with appropriate call:
    - [ ] Option 1: `processor.isTerminated()`
    - [ ] Option 2: `processor.getDownstreamCount() == 0`
    - [ ] Option 3: Remove check if not critical

  - [ ] Find all occurrences:
    ```bash
    grep -n "isClosed()" src/main/java/io/aurigraph/v11/graphql/ApprovalSubscriptionManager.java
    ```

  - [ ] Replace all (5 occurrences at lines 99, 111, 123, 135, 149):
    ```java
    // BEFORE
    if (processor.isClosed()) {

    // AFTER (choose one approach)
    if (processor.isTerminated()) {
    // OR
    if (processor.getDownstreamCount() == 0) {
    ```

  - [ ] Save file

- [ ] **Errors 12, 14, 16, 22: ValidatorVote field/enum mismatches**
  - [ ] Determine actual field name in ValidatorVote:
    - [ ] Is it `choice`, `voteChoice`, `decision`, `voteType`?
    - [ ] Check: `grep -A 5 "public.*vote" ValidatorVote.java`

  - [ ] Determine actual enum values:
    - [ ] Are they `APPROVE`, `REJECT`, `ABSTAIN`?
    - [ ] Or `AFFIRM`, `NEGATE`, `ABSTAIN`?
    - [ ] Check: `cat VoteChoice.java | grep "APPROVE\|AFFIRM"`

  - [ ] Replace all references (Lines 128-132, 112):
    ```java
    // BEFORE
    if (v.choice == VoteChoice.APPROVE)

    // AFTER (example - use actual names)
    if (v.voteChoice == VoteChoice.AFFIRM)
    ```

  - [ ] Save file

- [ ] Run `./mvnw clean compile` - 6 errors should be gone

### Fix Group 6: ApprovalGraphQLAPI field references (1 Hour)

**File**: `src/main/java/io/aurigraph/v11/graphql/ApprovalGraphQLAPI.java`

- [ ] **Errors 10, 11: Missing consensusReachedAt field (Lines 109, 111)**
  - [ ] These reference `approval.consensusReachedAt`
  - [ ] If field was removed or moved, update logic:
    ```java
    // BEFORE
    approval.consensusReachedAt

    // AFTER
    approval.updatedAt  // Use existing field
    // OR
    calculateConsensusTime(approval)  // Create helper method
    ```

  - [ ] Update all references
  - [ ] Save file

- [ ] Run `./mvnw clean compile` - should report fewer or no errors

### Final Verification

- [ ] **Check that all 25 errors are gone**:
  ```bash
  ./mvnw clean compile 2>&1 | grep "ERROR"
  ```
  - [ ] Output should be empty (0 compilation errors)

- [ ] **Check for any warnings**:
  ```bash
  ./mvnw clean compile 2>&1 | grep "WARNING"
  ```
  - [ ] Review and fix if any

---

## PHASE 3: VERIFICATION (1-2 Hours)

### Build Verification

- [ ] **Compile successfully**
  ```bash
  ./mvnw clean compile
  ```
  - [ ] No errors ✓
  - [ ] No critical warnings ✓

- [ ] **Package successfully** (skip tests for now)
  ```bash
  ./mvnw clean package -DskipTests
  ```
  - [ ] JAR created: `target/quarkus-app/quarkus-run.jar` ✓
  - [ ] No errors ✓

- [ ] **Check artifact size** (native image)
  ```bash
  ls -lh target/aurigraph-v11-standalone-*-runner
  ```
  - [ ] Size < 100MB (expected) ✓

### Test Execution Attempt

- [ ] **Run unit tests**
  ```bash
  ./mvnw test -q
  ```
  - [ ] All tests pass (or identify test failures)
  - [ ] Coverage report generated
  - [ ] Check: `target/site/jacoco/index.html`

- [ ] **If test failures occur**:
  - [ ] Document each failure
  - [ ] Root cause analysis
  - [ ] Fix test code (not source code)

---

## PHASE 4: DOCUMENTATION & CLOSURE (1 Hour)

### Document Changes

- [ ] **Create change summary** with:
  - [ ] List of 25 errors fixed
  - [ ] Files modified (3 main files)
  - [ ] Lines changed per file
  - [ ] Approach selected for each error group

- [ ] **Update README** with:
  - [ ] New compilation requirements
  - [ ] Any new entity fields added
  - [ ] Any registry method additions

- [ ] **Commit changes** (if using git):
  ```bash
  git add .
  git commit -m "fix(v11): Resolve 25 compilation errors in GraphQL layer"
  ```

### Success Checklist

- [ ] All 25 compilation errors fixed
- [ ] `./mvnw clean compile` succeeds
- [ ] `./mvnw clean package -DskipTests` succeeds
- [ ] JAR artifact created
- [ ] Initial unit tests run
- [ ] Coverage report generated
- [ ] Documentation updated

---

## ERROR REFERENCE QUICK MAP

| Error # | File | Line | Category | Fix Time | Status |
|---------|------|------|----------|----------|--------|
| CE-001 | ApprovalDTO.java | 32 | Type | 15 min | Phase 2.1 |
| CE-002 | ApprovalDTO.java | 34 | Type | 15 min | Phase 2.1 |
| CE-003 | ApprovalDTO.java | 37 | Field | 30 min | Phase 2.2 |
| CE-004 | ApprovalDTO.java | 38 | Field | 30 min | Phase 2.2 |
| CE-005 | ApprovalDTO.java | 39 | Field | 30 min | Phase 2.2 |
| CE-006 | ApprovalDTO.java | 40 | Field | 30 min | Phase 2.2 |
| CE-007 | ApprovalGraphQLAPI.java | 53 | Method | 20 min | Phase 2.3 |
| CE-008 | ApprovalGraphQLAPI.java | 74 | Method | 20 min | Phase 2.3 |
| CE-009 | ApprovalGraphQLAPI.java | 96 | Method | 20 min | Phase 2.3 |
| CE-010 | ApprovalGraphQLAPI.java | 109 | Field | 20 min | Phase 2.6 |
| CE-011 | ApprovalGraphQLAPI.java | 111 | Field | 20 min | Phase 2.6 |
| CE-012 | ApprovalGraphQLAPI.java | 128 | Field | 20 min | Phase 2.5 |
| CE-013 | ApprovalGraphQLAPI.java | 128 | Enum | 20 min | Phase 2.5 |
| CE-014 | ApprovalGraphQLAPI.java | 130 | Field | 20 min | Phase 2.5 |
| CE-015 | ApprovalGraphQLAPI.java | 130 | Enum | 20 min | Phase 2.5 |
| CE-016 | ApprovalGraphQLAPI.java | 132 | Field | 20 min | Phase 2.5 |
| CE-017 | ApprovalGraphQLAPI.java | 149 | Method | 20 min | Phase 2.3 |
| CE-018 | ApprovalGraphQLAPI.java | 159 | Constructor | 30 min | Phase 2.4 |
| CE-019 | ApprovalGraphQLAPI.java | 164 | Constructor | 30 min | Phase 2.4 |
| CE-020 | ApprovalSubscriptionManager.java | 99 | API | 20 min | Phase 2.5 |
| CE-021 | ApprovalSubscriptionManager.java | 111 | API | 20 min | Phase 2.5 |
| CE-022 | ApprovalSubscriptionManager.java | 112 | Field | 20 min | Phase 2.5 |
| CE-023 | ApprovalSubscriptionManager.java | 123 | API | 20 min | Phase 2.5 |
| CE-024 | ApprovalSubscriptionManager.java | 135 | API | 20 min | Phase 2.5 |
| CE-025 | ApprovalSubscriptionManager.java | 149 | API | 20 min | Phase 2.5 |

---

## TIME TRACKING

### Estimated vs Actual

| Phase | Task | Est. | Actual | Notes |
|-------|------|------|--------|-------|
| 1 | Investigation | 1-2h | _____ | |
| 2.1 | Type fixes | 1h | _____ | |
| 2.2 | Missing fields | 2-3h | _____ | |
| 2.3 | Registry methods | 1h | _____ | |
| 2.4 | Constructor fixes | 2h | _____ | |
| 2.5 | API/field fixes | 2-3h | _____ | |
| 2.6 | Final field refs | 1h | _____ | |
| 3 | Verification | 1-2h | _____ | |
| 4 | Documentation | 1h | _____ | |
| **Total** | | **16-20h** | **____h** | |

---

## HELP RESOURCES

### Commands for Debugging

```bash
# Check specific error count
./mvnw clean compile 2>&1 | grep -c "error"

# View specific file's compilation errors
./mvnw clean compile 2>&1 | grep "ApprovalDTO"

# Run compilation with full output
./mvnw clean compile -X | tail -100

# Find entity files
find src -name "ValidatorVote.java" -o -name "VoteChoice.java" -o -name "ExecutionResult.java"

# View entity definition
cat src/main/java/io/aurigraph/v11/token/secondary/ValidatorVote.java

# Check imports in broken files
grep -n "^import" src/main/java/io/aurigraph/v11/graphql/ApprovalDTO.java
```

### Documentation References

- Quarkus Docs: https://quarkus.io/guides/
- Mutiny Docs: https://smallrye.io/smallrye-mutiny/latest/
- Jakarta EE: https://jakarta.ee/
- JUnit 5: https://junit.org/junit5/docs/current/user-guide/

---

## SIGN-OFF

- [ ] Developer Name: __________________
- [ ] Start Date: __________________
- [ ] Target Completion: __________________
- [ ] QA Sign-Off: __________________
- [ ] All 25 Errors Fixed: [ ] YES [ ] NO
- [ ] Build Successful: [ ] YES [ ] NO
- [ ] Tests Passing: [ ] YES [ ] NO

---

**Status**: Ready for Implementation
**Last Updated**: December 25, 2025
**Next Review Date**: Upon Completion

