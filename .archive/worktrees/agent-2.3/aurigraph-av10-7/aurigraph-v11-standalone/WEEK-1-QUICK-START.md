# Week 1 Quick Start Guide - Test Fixes & Bridge Async

**Generated**: October 29, 2025
**Duration**: November 1-7, 2025 (5 days)
**Objective**: Fix 56 test compilation errors + Implement bridge async executor

---

## TL;DR - What You Need to Do

### Developer A (Test Fixes) - 6-8 hours
1. **Day 1 (2 hours)**: Fix MerkleTreeBuilder + TestDataBuilder (6 errors)
2. **Day 2 (2 hours)**: Fix MerkleTreeServiceTest (16 errors)
3. **Day 2 (2 hours)**: Fix TokenizationTestBase (7 errors)
4. **Day 3 (2 hours)**: Fix AggregationPoolServiceTest (27 errors)

### Developer B (Bridge Async) - 2-3 hours
1. **Day 1 (1 hour)**: Analyze current implementation
2. **Day 2 (2 hours)**: Implement async executor + timeout detection
3. **Day 3 (30 min)**: Testing and validation

### Both Developers (Validation) - 2-3 hours
1. **Day 4 (2 hours)**: Full validation testing
2. **Day 5 (2 hours)**: Git commits, documentation, deployment

---

## Quick Commands

### Check Current Errors
```bash
cd /Users/subbujois/subbuworkingdir/Aurigraph-DLT/aurigraph-av10-7/aurigraph-v11-standalone

# Count compilation errors
./mvnw test-compile 2>&1 | grep -c "ERROR"
# Expected: 56 → 0 (by end of week)
```

### Run Final Validation
```bash
# At end of week, run comprehensive validation
./final-validation.sh

# Expected output:
# ✅ ALL VALIDATION TESTS PASSED
# - Test Compilation: 0 errors
# - Test Execution: All passing
# - Bridge Async: Working
# - Native Build: Success
```

### Test Bridge Async (After implementation)
```bash
# Start service
./mvnw quarkus:dev

# In another terminal, run test
./test-async-execution.sh

# Expected:
# ✅ Async execution confirmed (<3s for 10 transfers)
```

---

## Files You'll Edit

### Developer A (Test Fixes)
```
src/test/java/io/aurigraph/v11/tokenization/
├── MerkleTreeBuilder.java               ← 1 error (Day 1)
├── TestDataBuilder.java                 ← 5 errors (Day 1)
├── TokenizationTestBase.java            ← 7 errors (Day 2)
├── MerkleTreeBuilderTest.java           ← 2 errors (Day 3)
└── aggregation/
    ├── MerkleTreeServiceTest.java       ← 16 errors (Day 2)
    └── AggregationPoolServiceTest.java  ← 27 errors (Day 3)
```

### Developer B (Bridge Async)
```
src/main/java/io/aurigraph/v11/bridge/
├── CrossChainBridgeService.java         ← Modify (Day 2)
└── BridgeTransferMonitor.java           ← Create new (Day 2)
```

---

## Error Categories & Fixes

### Category 1: Variable Assignment (1 error) - 30 min
**File**: `MerkleTreeBuilder.java:46`
```java
// ❌ BEFORE:
digest = MessageDigest.getInstance("SHA-256");

// ✅ AFTER:
digest.reset();
```

### Category 2: Static Class (5 errors) - 1 hour
**File**: `TestDataBuilder.java:390,396,402,408,414`
```java
// ❌ BEFORE:
return strategyType.new RebalancingStrategy(params);

// ✅ AFTER:
return new RebalancingStrategy(params);
```
**Pattern**: Replace `strategyType.new ` with `new `

### Category 3: Type Mismatch (16 errors) - 2 hours
**File**: `MerkleTreeServiceTest.java:178,196,197,...`
```java
// ❌ BEFORE:
String proof = merkleTree.generateProof(assetIds);

// ✅ AFTER:
String proof = merkleTree.generateProof(assetIds.get(0));
```
**Pattern**: Replace `(assetIds)` with `(assetIds.get(0))`

### Category 4: Symbol Errors (7 errors) - 2 hours
**File**: `TokenizationTestBase.java`
```java
// Fix 1: assetClass() → assetType()
asset.assetType()

// Fix 2: getPoolToken() → getToken()
pool.getToken()

// Fix 3: Enum updates
RebalancingStrategy.MARKET_CAP_WEIGHT
VotingMechanism.WEIGHTED_VOTING
GovernanceType.SUPERMAJORITY
```

### Category 5: Method Names (27 errors) - 3 hours
**File**: `AggregationPoolServiceTest.java`
```java
// Pattern 1: assetClass() → assetType() (13 instances)
asset.assetType()

// Pattern 2: getPoolToken() → getToken() (8 instances)
pool.getToken()

// Pattern 3: Mock return type (2 instances)
when(validator.validate(any())).thenReturn(ValidationResult.success());
```

---

## Bridge Async Implementation

### Change 1: Add ExecutorService
```java
private static final ExecutorService BRIDGE_EXECUTOR =
    Executors.newFixedThreadPool(10, r -> {
        Thread t = new Thread(r, "bridge-worker");
        t.setDaemon(true);
        return t;
    });
```

### Change 2: Update processBridgeTransaction()
```java
CompletableFuture.runAsync(() -> {
    // processing logic
}, BRIDGE_EXECUTOR);  // ✅ Use dedicated executor instead of Runnable::run
```

### Change 3: Add Timeout Detection (New Service)
```java
@ApplicationScoped
public class BridgeTransferMonitor {
    @Scheduled(every = "5m")
    public void detectStuckTransfers() {
        // Find transfers pending >30 min
        // Mark as TIMEOUT
    }
}
```

---

## Success Criteria

### Test Compilation
- ✅ **Zero** compilation errors (was 56)
- ✅ **483+** test files compiling
- ✅ **BUILD SUCCESS** on `./mvnw test-compile`

### Bridge Async
- ✅ **<3 seconds** to submit 10 concurrent transfers (was ~50s)
- ✅ **Timeout detection** marks stuck transfers after 30 min
- ✅ **Proper error handling** with fallback

### Overall Build
- ✅ **All tests passing** (or same pass rate as before)
- ✅ **Native build** successful (`./mvnw package -Pnative-fast`)
- ✅ **95%+ test coverage** maintained

---

## Daily Targets

| Day | Developer A Target | Developer B Target | Total Errors |
|-----|--------------------|--------------------|--------------|
| **Day 1** | 6 errors fixed (MerkleTreeBuilder + TestDataBuilder) | Bridge analysis | 50 remaining |
| **Day 2** | 23 errors fixed (MerkleTreeService + TokenizationTestBase) | Async implementation | 27 remaining |
| **Day 3** | 27 errors fixed (AggregationPoolService) | Timeout detection | 0 remaining |
| **Day 4** | Validation testing | Validation testing | Validation |
| **Day 5** | Git commits, docs | Git commits, docs | Complete |

---

## Helpful Commands

### Development
```bash
# Start dev mode with hot reload
./mvnw quarkus:dev

# Compile tests only
./mvnw test-compile

# Run specific test
./mvnw test -Dtest=ClassName

# Check error count
./mvnw test-compile 2>&1 | grep -c "ERROR"
```

### Testing
```bash
# Run all tests
./mvnw test

# Generate coverage report
./mvnw test jacoco:report
open target/site/jacoco/index.html

# Test bridge async
./test-async-execution.sh
```

### Validation
```bash
# Run full validation suite
./final-validation.sh

# Quick native build
./mvnw package -Pnative-fast -DskipTests

# Health check
curl http://localhost:9003/q/health
```

---

## Documentation Reference

### Detailed Guides
1. **THIS-WEEK-EXECUTION-PLAN.md** - Complete day-by-day breakdown (50 pages)
2. **TEST-ERROR-FIX-CHECKLIST.md** - Error-by-error checklist (56 items)

### Test Scripts
1. **test-async-execution.sh** - Bridge async validation
2. **final-validation.sh** - Comprehensive validation

### Opening Documentation
```bash
# View execution plan
open THIS-WEEK-EXECUTION-PLAN.md

# View error checklist
open TEST-ERROR-FIX-CHECKLIST.md

# Or use terminal
less THIS-WEEK-EXECUTION-PLAN.md
```

---

## Git Workflow

### After Test Fixes (Developer A)
```bash
git add src/test/java/io/aurigraph/v11/tokenization/
git commit -m "fix: resolve 56 test compilation errors

- Fixed MerkleTreeBuilder digest reassignment
- Fixed TestDataBuilder static class instantiation (5 occurrences)
- Fixed MerkleTreeServiceTest type mismatches (16 errors)
- Fixed TokenizationTestBase symbol errors (7 errors)
- Fixed AggregationPoolServiceTest method names (27 errors)

All tests now compile successfully.

JIRA: AV11-XXX

Generated with Claude Code

Co-Authored-By: Claude <noreply@anthropic.com>"

git push origin main
```

### After Bridge Fixes (Developer B)
```bash
git add src/main/java/io/aurigraph/v11/bridge/
git commit -m "fix: implement proper async execution for bridge transfers

- Replaced Runnable::run with dedicated ExecutorService
- Implemented BridgeTransferMonitor for timeout detection
- Added TIMEOUT status for stuck transfers (>30min)
- Added proper error handling and retry logic

Bridge now processes transfers asynchronously with automatic
timeout recovery.

JIRA: AV11-XXX

Generated with Claude Code

Co-Authored-By: Claude <noreply@anthropic.com>"

git push origin main
```

---

## Troubleshooting

### Issue: Still seeing compilation errors after fix
**Solution**:
```bash
# Clean and rebuild
./mvnw clean test-compile

# If errors persist, check fix was applied correctly
grep -n "PATTERN" src/test/java/io/aurigraph/v11/tokenization/FILE.java
```

### Issue: Bridge async test failing
**Solution**:
```bash
# Check service is running
curl http://localhost:9003/q/health

# Check logs for errors
tail -f target/quarkus.log

# Verify executor implementation
grep -A 10 "BRIDGE_EXECUTOR" src/main/java/io/aurigraph/v11/bridge/CrossChainBridgeService.java
```

### Issue: Native build failing
**Solution**:
```bash
# Try cleaning first
./mvnw clean

# Rebuild
./mvnw package -Pnative-fast

# If still failing, check Docker
docker --version
docker ps
```

---

## Contact & Escalation

### If Blocked >2 Hours
1. Document the blocker (what, where, error message)
2. Check documentation for similar issues
3. Escalate to senior developer
4. Update daily standup with blocker status

### For Questions
1. Check THIS-WEEK-EXECUTION-PLAN.md first
2. Check TEST-ERROR-FIX-CHECKLIST.md for specific errors
3. Review existing test files for patterns
4. Ask for help if stuck

---

## Final Checklist

Before marking week complete, verify:

- [ ] Zero test compilation errors (`./mvnw test-compile`)
- [ ] All tests passing (or same pass rate as before)
- [ ] Bridge async test passes (`./test-async-execution.sh`)
- [ ] Native build successful (`./mvnw package -Pnative-fast`)
- [ ] Coverage report generated (`./mvnw test jacoco:report`)
- [ ] Git commits pushed to remote
- [ ] JIRA tickets updated
- [ ] Documentation updated

Run final validation:
```bash
./final-validation.sh
```

Expected output:
```
✅ ALL VALIDATION TESTS PASSED

THIS WEEK EXECUTION: COMPLETE

All tasks completed successfully:
  - 56 test compilation errors fixed
  - Bridge async executor implemented
  - Timeout detection operational
  - Native build working
```

---

**Ready to Start?**

```bash
# Navigate to project
cd /Users/subbujois/subbuworkingdir/Aurigraph-DLT/aurigraph-av10-7/aurigraph-v11-standalone

# Open documentation
open THIS-WEEK-EXECUTION-PLAN.md
open TEST-ERROR-FIX-CHECKLIST.md

# Start with Day 1 tasks
# Developer A: Fix MerkleTreeBuilder.java
# Developer B: Analyze CrossChainBridgeService.java
```

**Good luck! 🚀**
