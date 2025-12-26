# Aurigraph V11 - TDD Framework Onboarding

**For**: Development Team  
**Duration**: 30-45 minutes  
**Status**: ✅ Ready to Use

This guide helps new team members get started with the Test-Driven Development (TDD) framework at Aurigraph.

---

## 🚀 Quick Start (5 minutes)

### 1. Clone & Setup
```bash
# Already cloned? Skip to step 2.

git clone https://github.com/Aurigraph-DLT-Corp/Aurigraph-DLT.git
cd aurigraph-av10-7
```

### 2. One-Command Setup
```bash
bash scripts/setup-dev-environment.sh
```

**What it does:**
- ✅ Checks Java 21 installed
- ✅ Installs Maven dependencies
- ✅ Compiles project
- ✅ Sets up pre-commit hook
- ✅ Validates Git configuration

### 3. Run Your First Tests
```bash
./mvnw test -Punit-tests-only
```

**Expected output:**
```
Tests run: 212, Failures: 0, Errors: 0, Skipped: 0
✅ BUILD SUCCESS
```

**That's it!** You're ready to start developing.

---

## 🎯 Core Concepts (10 minutes)

### What is TDD?

Test-Driven Development means:
1. **Write test FIRST** ✍️ (RED)
2. **Write minimal code to pass** 💚 (GREEN)
3. **Refactor & clean up** 🔵 (REFACTOR)

**Example Flow:**
```
RED: testCreateApproval_WithValidInput_ReturnsApproval() [FAILS - doesn't exist yet]
     ↓
GREEN: Simple implementation to make test pass
     ↓
REFACTOR: Clean up, optimize, add error handling
```

### Why TDD?

- ✅ **Better Design**: Tests first = cleaner APIs
- ✅ **Fewer Bugs**: 50-90% fewer bugs (industry data)
- ✅ **Faster Debugging**: Tests catch issues immediately
- ✅ **Documentation**: Tests show how to use code
- ✅ **Confidence**: Refactor without fear - tests verify

### Three Test Types at Aurigraph

| Type | Speed | Real Infrastructure | When | Command |
|------|-------|-------------------|------|---------|
| **Unit** | <30s | Mock/Fake | Every commit | `mvnw test -Punit-tests-only` |
| **Integration** | 2-5min | Real (Docker) | Before PR | `mvnw test -Pintegration-tests` |
| **Performance** | 180s | Real | Release prep | `mvnw test -Pperformance-tests` |

---

## 📝 Writing Your First Test (15 minutes)

### Step 1: Create Test Class

```java
package io.aurigraph.v11.token.secondary;

import io.quarkus.test.junit.QuarkusTest;
import jakarta.inject.Inject;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.DisplayName;

import static org.junit.jupiter.api.Assertions.*;

@QuarkusTest
@DisplayName("My New Feature")
class MyNewFeatureTest {
    
    @Inject
    MyNewService service;
    
    @Test
    @DisplayName("should do something when conditions are met")
    void testDoSomething() {
        // Your test here
    }
}
```

### Step 2: Write Test (RED)

```java
@Test
@DisplayName("Create approval returns new approval with PENDING status")
void testCreateApproval_WithValidInput_ReturnsPending() {
    // ARRANGE: Set up test data
    UUID tokenId = UUID.randomUUID();
    int totalValidators = 5;
    int approvalThreshold = 3;
    
    // ACT: Perform the action
    ApprovalRequest approval = service.createApproval(
        tokenId, totalValidators, approvalThreshold);
    
    // ASSERT: Verify the result
    assertNotNull(approval);
    assertEquals(tokenId, approval.tokenId);
    assertEquals(ApprovalStatus.PENDING, approval.status);
}
```

### Step 3: Run Test (RED ❌)
```bash
./mvnw test -Dtest=MyNewFeatureTest
```

**Output:** `FAILURE` - This is expected! Test should fail because code doesn't exist yet.

### Step 4: Write Minimal Implementation (GREEN)

```java
@ApplicationScoped
public class MyNewService {
    
    public ApprovalRequest createApproval(
        UUID tokenId, int total, int threshold) {
        
        ApprovalRequest approval = new ApprovalRequest();
        approval.tokenId = tokenId;
        approval.totalValidators = total;
        approval.approvalThreshold = threshold;
        approval.status = ApprovalStatus.PENDING;
        
        return approval;
    }
}
```

### Step 5: Run Test (GREEN ✅)
```bash
./mvnw test -Dtest=MyNewFeatureTest
```

**Output:** `SUCCESS`

### Step 6: Refactor (BLUE 🔵)

Now clean up the code, add error handling, documentation:

```java
@ApplicationScoped
public class MyNewService {
    
    /**
     * Create a new approval request for a secondary token version.
     * 
     * @param tokenId the token to approve
     * @param totalValidators total validators in the network
     * @param approvalThreshold votes required for consensus (>2/3)
     * @return new approval request with PENDING status
     * @throws IllegalArgumentException if threshold invalid
     */
    @Transactional
    public ApprovalRequest createApproval(
        UUID tokenId, int totalValidators, int approvalThreshold) {
        
        // Validate inputs
        if (tokenId == null) {
            throw new IllegalArgumentException("Token ID is required");
        }
        if (totalValidators <= 0) {
            throw new IllegalArgumentException(
                "Total validators must be > 0");
        }
        int required = calculateRequiredApprovals(totalValidators);
        if (approvalThreshold < required) {
            throw new IllegalArgumentException(
                String.format("Threshold must be >= %d for consensus",
                    required));
        }
        
        // Create approval
        ApprovalRequest approval = new ApprovalRequest();
        approval.tokenId = tokenId;
        approval.totalValidators = totalValidators;
        approval.approvalThreshold = approvalThreshold;
        approval.status = ApprovalStatus.PENDING;
        approval.createdAt = LocalDateTime.now();
        
        // Persist
        approvalRegistry.persist(approval);
        
        Log.infof("Created approval request: %s", approval.requestId);
        return approval;
    }
}
```

### Step 7: Run Test Again (Still GREEN ✅)

```bash
./mvnw test -Dtest=MyNewFeatureTest
```

**Key Point**: Refactoring shouldn't break tests. If it does, you have a regression.

---

## 🛠️ Using Test Data Builders (5 minutes)

Instead of manually creating complex objects, use builders:

### Without Builder ❌
```java
@Test
void testVoteSubmission() {
    ApprovalRequest approval = new ApprovalRequest();
    approval.requestId = UUID.randomUUID();
    approval.tokenId = UUID.randomUUID();
    approval.totalValidators = 5;
    approval.approvalThreshold = 3;
    approval.status = ApprovalStatus.PENDING;
    approval.createdAt = LocalDateTime.now();
    approval.votingWindowEnd = LocalDateTime.now().plusHours(1);
    // ... 10 more lines
    
    // Test code
}
```

### With Builder ✅
```java
@Test
void testVoteSubmission() {
    ApprovalRequest approval = new ApprovalRequestTestBuilder()
        .withTotalValidators(5)
        .withApprovalThreshold(3)
        .withVotingWindowMinutes(60)
        .build();
    
    // Test code (much cleaner!)
}
```

### Available Builders

```java
// Approval Request
new ApprovalRequestTestBuilder()
    .withTokenId(UUID.randomUUID())
    .withTotalValidators(5)
    .withApprovalThreshold(3)
    .withVotingWindowMinutes(30)
    .build();

// Validator Vote
new ValidatorVoteTestBuilder()
    .withValidatorId("validator-1")
    .withChoice(VoteChoice.YES)
    .withTimestamp(LocalDateTime.now())
    .build();

// Secondary Token Version
new SecondaryTokenVersionTestBuilder()
    .withTokenId(tokenId)
    .withContent("version 1.1.0")
    .withVVBRequired(true)
    .withPreviousVersionId(previousId)
    .build();
```

---

## ✅ Pre-Commit Hook (Automatic Testing)

The project includes an automatic pre-commit hook that runs unit tests before every commit.

### What Happens When You Commit

```bash
git add .
git commit -m "feat: add new feature"

# Automatically:
# 1. Runs all unit tests
# 2. Checks if all pass
# 3. Allows/blocks commit based on results
```

### If Tests Fail ❌
```
❌ COMMIT BLOCKED

Unit tests failed. Fix before committing.
```

**Solution:** Fix the failing test and commit again.

### Bypass (Not Recommended)
```bash
git commit --no-verify -m "message"
```

⚠️ Only use if absolutely necessary - the hook exists to protect code quality.

---

## 🔄 Daily Development Workflow

### Morning
```bash
# Pull latest changes
git pull origin main

# Run tests to ensure everything works
./mvnw test -Punit-tests-only  # <30s

# Start dev server
./mvnw quarkus:dev
```

### Development
```bash
# 1. Write test (RED) ❌
#    - Open test file
#    - Write test describing desired behavior
#    - ./mvnw test -Dtest=MyTest (should fail)

# 2. Write code (GREEN) ✅
#    - Minimal implementation to pass test
#    - ./mvnw test -Dtest=MyTest (should pass)

# 3. Refactor (BLUE) 🔵
#    - Clean up code
#    - Add documentation
#    - ./mvnw test -Dtest=MyTest (should still pass)

# 4. Add more tests for edge cases
#    - Repeat 1-3 for each scenario
```

### Before Committing
```bash
# Run all unit tests (pre-commit hook does this automatically)
./mvnw test -Punit-tests-only

# Fix any failures
# Then commit (hook will validate)
git add .
git commit -m "feat(approval): add new approval feature

- Implement approval creation with validation
- Add Byzantine consensus support
- Handle timeout scenarios

TDD: 5 new tests added"
```

### Before Creating PR
```bash
# Run integration tests
./mvnw test -Pintegration-tests

# Generate coverage report
./mvnw clean verify -Pfull-test-suite
open target/site/jacoco/index.html

# Check: Coverage >= 80% ✅
# Check: All tests pass ✅
# Then: Create PR
```

---

## 📚 Documentation & Resources

### Quick Reference
- **Testing Guide**: `docs/TESTING-GUIDE.md` (comprehensive)
- **Coverage Report**: `docs/COVERAGE-REPORT.md` (metrics & targets)
- **TDD Strategy**: `docs/TDD-STRATEGY.md` (philosophy & framework)

### File Locations
- **Test Directory**: `src/test/java/io/aurigraph/v11/`
- **Test Builders**: `src/test/java/io/aurigraph/v11/testing/builders/`
- **Maven Config**: `pom.xml` (lines 1265+)
- **Pre-commit Hook**: `.git/hooks/pre-commit`
- **CI/CD Workflow**: `.github/workflows/test-quality-gates.yml`

### Running Help
```bash
# See all available Maven profiles
./mvnw help:describe -Ddetail=true | grep -A 20 "Profiles"

# List all test classes
find src/test -name "*Test.java" | sort

# See test execution details
./mvnw test -Dtest=MyTest -X  # Very verbose
./mvnw test -Dtest=MyTest -q  # Quiet (summary only)
```

---

## ❓ Common Questions

### Q: Should I write test or code first?
**A**: Always test first! This is TDD. It ensures you're solving the right problem.

### Q: How long should a test take?
**A**: Unit tests <50ms. If slower, it might need refactoring or mocking.

### Q: Can I skip the pre-commit hook?
**A**: Only if absolutely necessary. Hook is there to protect code quality.

### Q: What if I don't know how to test something?
**A**: 
1. Look at similar tests in codebase
2. Read `TESTING-GUIDE.md` for patterns
3. Ask team in Slack/daily standup
4. Review test builders for test data creation

### Q: My test works locally but fails in CI/CD?
**A**:
- Docker issues? Run integration tests locally: `mvnw test -Pintegration-tests`
- ClassLoader issues? Clean & rebuild: `./mvnw clean test`
- Flaky test? Might need isolation improvements

### Q: How do I debug a failing test?
**A**:
```bash
# Run with full output
./mvnw test -Dtest=MyTest -X

# Or debug in IDE:
# - Right-click test in IDE
# - Select "Debug Test"
# - Set breakpoints
```

---

## 🎓 Learning Path

**Week 1**: Get comfortable
- [ ] Understand TDD philosophy (Red-Green-Refactor)
- [ ] Run test suite locally
- [ ] Write 3-5 simple unit tests
- [ ] Use test builders for test data
- [ ] Commit with pre-commit hook

**Week 2**: Build confidence
- [ ] Write tests for your assigned feature
- [ ] Review others' tests and learn patterns
- [ ] Check coverage for your code (target 80%+)
- [ ] Participate in test code reviews

**Week 3**: Master it
- [ ] Lead feature development with TDD
- [ ] Help other team members with test questions
- [ ] Refactor problematic tests
- [ ] Contribute to test framework improvements

**Week 4**: Excel
- [ ] Own test quality for your components
- [ ] Mentor junior team members
- [ ] Improve test builders or patterns
- [ ] Help refactor Phase 3-4 aspirational tests

---

## 🚨 Warning Signs

If you see these, stop and ask for help:

- ❌ Tests that pass/fail randomly (flaky tests)
- ❌ Tests that break unrelated to your changes
- ❌ >3 months without running full test suite
- ❌ Coverage dropping below 75%
- ❌ Tests that take >1 second each
- ❌ "We don't have time to test" attitude

---

## 📞 Support

### Need Help?
1. **Quick question?** → Ask in team Slack #engineering
2. **Stuck on test?** → Pair program with team member
3. **Framework issue?** → File issue on GitHub
4. **Want to learn more?** → Read TESTING-GUIDE.md fully

### Team Contacts
- **TDD Lead**: [Team Lead Name]
- **Test Infrastructure**: [DevOps Contact]
- **Architecture**: [Tech Lead Contact]

---

## 📊 Success Metrics

Track these for your team:
- ✅ **Test Coverage**: 80%+ overall (trending ↑)
- ✅ **Test Count**: Growing with features
- ✅ **Build Time**: <2 minutes for unit tests
- ✅ **Bug Escape Rate**: <5% to production (TDD reduces this)
- ✅ **Code Quality**: Zero high-severity defects from test-covered code

---

## 🎉 You're Ready!

You've learned the Aurigraph TDD framework. Now:

1. ✅ Set up your environment: `bash scripts/setup-dev-environment.sh`
2. ✅ Run your first tests: `./mvnw test -Punit-tests-only`
3. ✅ Read TESTING-GUIDE.md for details
4. ✅ Start writing tests for your features!

**Questions?** Ask the team - we're here to help! 🚀

---

**Generated**: December 26, 2025  
**Status**: ✅ Production Ready  
**Framework Phase**: 6 Complete

Welcome to Aurigraph Development! 🎯
