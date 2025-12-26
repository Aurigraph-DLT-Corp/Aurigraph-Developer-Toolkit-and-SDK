# Testing Documentation - Aurigraph DLT V11

**Complete testing documentation and guides for Aurigraph DLT V11**

Welcome to the comprehensive testing documentation for Aurigraph DLT V11. This directory contains all resources needed to understand, write, run, and maintain tests for the project.

---

## Quick Navigation

### For Developers Writing Tests

Start here:

1. **[TESTING-GUIDE.md](TESTING-GUIDE.md)** - How to run and write tests
   - Quick start commands
   - Test execution reference
   - Writing new tests step-by-step
   - Async/reactive testing patterns
   - Troubleshooting common issues

2. **[TEST-TEMPLATES.md](TEST-TEMPLATES.md)** - Copy-paste test examples
   - Unit test templates (GraphQL, services)
   - Integration test templates
   - Reactive testing patterns (Uni, Multi)
   - Test data builders (fluent API)
   - Performance test templates

3. **[TDD-STRATEGY.md](TDD-STRATEGY.md)** - Philosophy and approach
   - TDD principles adapted for Quarkus
   - Test pyramid (70/20/5/3/2 split)
   - Mocking strategy
   - Coverage goals and metrics
   - Quality gates and enforcement

### For Coverage & Metrics

4. **[COVERAGE-REPORT.md](COVERAGE-REPORT.md)** - Coverage metrics and goals
   - Current baseline coverage
   - Target coverage by component
   - Phase-by-phase roadmap
   - How to interpret coverage reports
   - Coverage trend tracking

---

## File Overview

### TDD-STRATEGY.md (Core Philosophy)

**What**: Comprehensive Test-Driven Development strategy  
**Why**: Establishes testing standards and practices  
**When**: Read at project start, reference before major features  
**Key Sections**:
- Red-Green-Refactor cycle
- Test pyramid (70% unit, 20% integration, 5% contract, 3% performance, 2% E2E)
- Reactive testing patterns for Quarkus/Mutiny
- Test data builders and mocking strategy
- Coverage goals: 95% line, 90% branch

**Read Time**: 30 minutes

### TEST-TEMPLATES.md (Copy-Paste Examples)

**What**: Ready-to-use test templates for all test types  
**Why**: Speeds up test writing, ensures consistency  
**When**: Use when creating new tests  
**Key Sections**:
- Unit test templates (GraphQL queries, mutations, subscriptions)
- Integration test templates with Testcontainers
- Reactive Uni<T> and Multi<T> testing patterns
- Test data builders (fluent API)
- Performance test benchmarks
- Contract test examples

**Read Time**: 20 minutes to scan, 1-2 hours to study deeply

### TESTING-GUIDE.md (How-To Guide)

**What**: Practical guide for running and writing tests  
**Why**: Day-to-day reference for developers  
**When**: Use every time you write/run tests  
**Key Sections**:
- Quick start (2 minutes)
- Test command reference (copy-paste ready)
- Step-by-step test writing guide
- Understanding coverage reports
- Troubleshooting common issues
- Advanced topics (mutation testing, property-based testing)

**Read Time**: 5 minutes quick start, 30 minutes full guide

### COVERAGE-REPORT.md (Metrics & Goals)

**What**: Test coverage metrics, goals, and roadmap  
**Why**: Track progress toward 95% coverage target  
**When**: Review weekly, especially end of phase  
**Key Sections**:
- Current baseline coverage (baseline after P1-4)
- Coverage by component (P1-6 priorities)
- Phase-by-phase roadmap (Week 1-3)
- How to generate and interpret reports
- Coverage quality gates and enforcement

**Read Time**: 10 minutes summary, 20 minutes detailed analysis

---

## Getting Started (5 Minutes)

### Step 1: Understand the Test Pyramid

Aurigraph V11 uses a 70/20/5/3/2 split:
- **70% Unit Tests** - Fast (<10ms), isolated, mocked dependencies
- **20% Integration Tests** - Slower (100ms-5s), real database/Kafka/Redis
- **5% Contract Tests** - Verify API schemas
- **3% Performance Tests** - Measure TPS, latency, throughput
- **2% E2E Tests** - Complete user workflows

### Step 2: Run Your First Test

```bash
cd aurigraph-av10-7/aurigraph-v11-standalone

# Run unit tests (30 seconds)
./mvnw test

# View coverage report
open target/site/jacoco/index.html
```

### Step 3: Copy a Template

Open `TEST-TEMPLATES.md` and find a template that matches your test type:
- Writing a GraphQL query test? → Use `GraphQL Query Test Template`
- Writing a database test? → Use `Database Integration Test Template`
- Testing async code? → Use `Reactive Uni/Multi Test Templates`

### Step 4: Run Your New Test

```bash
# Run your specific test
./mvnw test -Dtest=YourNewTestClass
```

---

## Common Tasks

### "I want to run tests"

See **TESTING-GUIDE.md → Test Commands Reference**

Quick commands:
```bash
./mvnw test                    # Unit tests only
./mvnw verify                  # All tests + coverage
./mvnw test -Dtest=*GraphQL*  # Pattern matching
```

### "I want to write a unit test"

See **TEST-TEMPLATES.md → Unit Test Templates** and follow:

1. Copy the appropriate template
2. Replace class/method names
3. Use test data builders for complex objects
4. Follow Arrange-Act-Assert pattern
5. Run: `./mvnw test -Dtest=YourTestClass`

### "I want to write an integration test"

See **TEST-TEMPLATES.md → Integration Test Templates**

1. Extend `AbstractIntegrationTest`
2. Use real database (Testcontainers PostgreSQL)
3. Use `given(spec).post(...)` for HTTP requests
4. Verify in database after operation
5. Run: `./mvnw verify -DskipUnitTests`

### "I want to understand coverage"

See **COVERAGE-REPORT.md**

1. Run: `./mvnw verify`
2. Open: `target/site/jacoco/index.html`
3. Look for red lines = not covered
4. Write tests for red lines

### "I'm stuck on a test"

See **TESTING-GUIDE.md → Troubleshooting**

Common issues and solutions:
- Test timeout? → Add `@Timeout(10)` annotation
- Mocking not working? → Return `Uni.createFrom().item(value)`
- Port already in use? → Kill process on port 9003
- Database connection failed? → Ensure Docker is running

### "I want to measure performance"

See **TEST-TEMPLATES.md → Performance Test Template**

```bash
./mvnw test -Dtest=*PerformanceTest
# Results in: target/benchmark-results.json
```

### "I want to improve test quality"

See **TDD-STRATEGY.md → Continuous Improvement**

Advanced techniques:
- Mutation testing: Detect weak tests
- Property-based testing: Generate random test data
- Contract testing: Verify API schemas

---

## Document Purpose & Audience

| Document | Purpose | Audience | Reading Time |
|----------|---------|----------|--------------|
| TDD-STRATEGY | Philosophy & principles | Team leads, architects | 30 min |
| TEST-TEMPLATES | Copy-paste examples | All developers | 20 min (scan), 1-2 hrs (study) |
| TESTING-GUIDE | Practical how-to | All developers | 5 min (quick), 30 min (full) |
| COVERAGE-REPORT | Metrics & roadmap | Team leads, QA | 10-20 min |
| README (this file) | Navigation & quick ref | All developers | 5 min |

---

## Key Metrics at a Glance

### Coverage Targets

| Component | Line | Branch | Status |
|-----------|------|--------|--------|
| Overall | 95% | 90% | Target |
| GraphQL APIs | 95% | 90% | 🚧 In Progress |
| VVB Approval | 95% | 90% | 🚧 In Progress |
| Consensus | 95% | 90% | 📋 Pending |
| Cryptography | 98% | 95% | 📋 Pending |
| Utilities | 80% | 75% | 🚧 In Progress |

### Test Execution Time

| Category | Count | Time | Notes |
|----------|-------|------|-------|
| Unit Tests | 130+ | ~1.3s | Fast, run often |
| Integration Tests | 40+ | ~80s | Slower, run before commit |
| Performance Tests | 8+ | ~4m | Very slow, run in CI |
| Full Suite | 180+ | ~5m | Comprehensive, CI only |

### Phase Timeline

| Phase | Timeline | Focus | Target Coverage |
|-------|----------|-------|---|
| Phase 1 | Week 1 | P1-2 (GraphQL, VVB) | 80% |
| Phase 2 | Week 2 | P3-5 (Consensus, Crypto, etc) | 90% |
| Phase 3 | Week 3 | Polish & hardening | 95% |

---

## Testing Best Practices

### DO ✅

- [ ] Use test data builders for complex objects
- [ ] Test both success and failure paths
- [ ] Use specific assertions (not generic)
- [ ] Mock external dependencies in unit tests
- [ ] Use real infrastructure in integration tests
- [ ] Name tests clearly: `testSubject_Condition_Result()`
- [ ] Follow Arrange-Act-Assert pattern
- [ ] Test edge cases and error conditions
- [ ] Run tests before committing
- [ ] Keep unit tests <10ms each

### DON'T ❌

- [ ] Don't create shared test state between tests
- [ ] Don't hardcode credentials or secrets
- [ ] Don't test internal implementation details
- [ ] Don't mix unit and integration tests
- [ ] Don't ignore test failures
- [ ] Don't write tests that are harder to understand than code
- [ ] Don't test the framework (Quarkus, JUnit)
- [ ] Don't create tests that pass/fail randomly
- [ ] Don't skip tests when they fail

---

## Quick Reference Commands

### Testing

```bash
# Run unit tests only
./mvnw test

# Run all tests with coverage
./mvnw verify

# Run specific test
./mvnw test -Dtest=ApprovalServiceTest

# Run tests matching pattern
./mvnw test -Dtest=*GraphQL*

# Run single test method
./mvnw test -Dtest=ApprovalServiceTest#testSubmitVote_ValidVote_UpdatesVotingRecord

# Run integration tests only
./mvnw verify -DskipUnitTests

# Run performance tests
./mvnw test -Dtest=*PerformanceTest

# Skip tests (build only)
./mvnw package -DskipTests

# Run with debug output
./mvnw test -X
```

### Coverage

```bash
# Generate coverage report
./mvnw verify

# View coverage in browser
open target/site/jacoco/index.html

# Export coverage as CSV
cat target/jacoco-report/jacoco.csv

# Run mutation testing (detect weak tests)
./mvnw org.pitest:pitest-maven:mutationCoverage
```

### Development

```bash
# Clean and rebuild
./mvnw clean test

# Fast build without tests
./mvnw compile -DskipTests

# Build native image
./mvnw package -Pnative-fast

# View logs for failed test
./mvnw test -Dtest=YourTest -e
```

---

## Common Questions

### Q: How long should tests take?
**A**: Unit tests <10ms each, integration tests <5s, full suite <5 minutes in CI

### Q: What coverage percentage is good?
**A**: Target 95% line coverage, 90% branch coverage. 100% is unrealistic.

### Q: Should I mock databases?
**A**: No - Unit tests mock, integration tests use real database (Testcontainers)

### Q: How do I test async code?
**A**: Use `.await().indefinitely()` for Uni<T>, CountDownLatch for Multi<T>

### Q: What if a test is flaky?
**A**: Check for shared state, timing issues, or external dependencies. Fix root cause, don't retry.

### Q: Can I skip tests to speed up build?
**A**: Yes with `-DskipTests`, but don't commit without running tests first

### Q: How do I debug a failing test?
**A**: Run with `./mvnw test -Dtest=YourTest -e`, add breakpoint in IDE, use System.out

---

## Integration with CI/CD

### GitHub Actions Pipeline

Tests are automatically run on:
- **Pre-commit hook**: Unit tests only (fast)
- **Pull Request**: All tests + coverage check (5m)
- **Merge to main**: Full suite including performance tests (10m)

Coverage gates enforce:
- Overall: ≥95% line, ≥90% branch
- Crypto: ≥98% line, ≥95% branch  
- Consensus: ≥95% line, ≥90% branch
- GraphQL: ≥95% line, ≥90% branch

### Pre-commit Hook

Install locally:
```bash
chmod +x .git/hooks/pre-commit
```

Runs fast unit tests before each commit:
```bash
./mvnw test -q -DskipITs
```

---

## Support & Resources

### Internal Resources

- **GitHub Issues**: Report test failures and coverage gaps
- **Slack**: #testing channel for questions
- **Wiki**: Testing troubleshooting guide

### External Resources

- **Quarkus Testing Guide**: https://quarkus.io/guides/getting-started-testing
- **JUnit 5 Documentation**: https://junit.org/junit5/docs/current/user-guide/
- **AssertJ Cheat Sheet**: https://assertj.github.io/assertj-core-features-highlight.html
- **Mockito Documentation**: https://javadoc.io/doc/org.mockito/mockito-core/latest/org/mockito/Mockito.html
- **Mutiny Reactive Guide**: https://smallrye.io/smallrye-mutiny/

---

## Document Maintenance

### Update Schedule

- **Weekly**: Update coverage metrics in COVERAGE-REPORT.md
- **Per Sprint**: Review and update timelines in phase roadmaps
- **Per Release**: Archive old coverage data, update baselines

### Contributing Changes

1. Make changes to appropriate document
2. Update the "Last Updated" date
3. Add to git commit message: "docs: Update testing guide for Phase X"
4. Get review from QA lead before merge

---

## Document Versions

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | 2025-12-26 | Initial Phase 6 documentation complete |
| - | - | Future updates will be tracked here |

---

## Status

**Phase 6 Deliverables**:
- ✅ TESTING-GUIDE.md - Comprehensive how-to guide
- ✅ COVERAGE-REPORT.md - Metrics and roadmap
- ✅ README.md - Navigation and quick reference
- ✅ All references to TDD-STRATEGY.md and TEST-TEMPLATES.md verified

**Overall Status**: ✅ Complete and ready for team use

---

**Last Updated**: December 26, 2025  
**Status**: Active and maintained  
**Audience**: Aurigraph DLT V11 development team  
**Related**: TDD-STRATEGY.md, TEST-TEMPLATES.md, pom.xml (test dependencies)
