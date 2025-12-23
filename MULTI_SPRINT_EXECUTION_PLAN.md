# MULTI-SPRINT EXECUTION PLAN
## Aurigraph V11 - Parallel Agent-Based Development
### 9 TODOs → 3 Concurrent Sprints → 6 J4C Agents

**Date**: November 28, 2025
**Duration**: 3 Sprints × 1 day each = 3 days total
**Team**: 6 J4C Agents + 1 Orchestrator
**Methodology**: Git worktree isolation + Daily standup + Nightly integration

---

## SPRINT ALLOCATION OVERVIEW

```
┌─────────────────────────────────────────────────────────────────────┐
│                    SPRINT 1 (Day 1 - 6 hours)                       │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  Agent 1A: Fix V11 Backend Port Conflict                           │
│  └─ Change 9003 → 9004, rebuild JAR, deploy                       │
│  └─ Branch: feature/1a-backend-port-fix                           │
│  └─ Time: 90 minutes                                               │
│                                                                     │
│  Agent 1B: Verify Database Schema & Auth Tables                    │
│  └─ Inspect users table, verify UUID types                         │
│  └─ Create V8 migration if needed                                  │
│  └─ Branch: feature/1b-database-schema-fix                         │
│  └─ Time: 60 minutes                                               │
│                                                                     │
│  Agent 1C: Backend API Connectivity Testing                        │
│  └─ Test health endpoints, stats endpoints                         │
│  └─ Write integration tests                                        │
│  └─ Branch: feature/1c-backend-api-tests                           │
│  └─ Time: 75 minutes                                               │
│                                                                     │
├─────────────────────────────────────────────────────────────────────┤
│  Nightly Integration (18:00-20:00 UTC): Merge all 3 branches       │
│  Success Criteria: Backend running on 9004, all APIs responding    │
└─────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────┐
│                   SPRINT 2 (Day 2 - 8 hours)                        │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  Agent 2A: Portal-Backend Integration Testing                      │
│  └─ Test API calls, WebSocket connections                          │
│  └─ Verify real-time data flow                                     │
│  └─ Fix integration bugs                                           │
│  └─ Branch: feature/2a-portal-backend-integration                  │
│  └─ Time: 150 minutes                                              │
│                                                                     │
│  Agent 2B: E2E Workflow Testing & Validation                       │
│  └─ Test 4 core workflows end-to-end                               │
│  └─ Node creation, scaling, tokenization                           │
│  └─ Write test suite & documentation                               │
│  └─ Branch: feature/2b-e2e-workflow-tests                          │
│  └─ Time: 150 minutes                                              │
│                                                                     │
│  Agent 2C: Configuration Cleanup & Build Optimization              │
│  └─ Fix ~20 unrecognized config warnings                           │
│  └─ Remove deprecated properties                                   │
│  └─ Rebuild JAR with clean warnings                                │
│  └─ Branch: feature/2c-config-cleanup                              │
│  └─ Time: 90 minutes                                               │
│                                                                     │
├─────────────────────────────────────────────────────────────────────┤
│  Nightly Integration (18:00-20:00 UTC): Merge all 3 branches       │
│  Success Criteria: Portal ↔ Backend integration verified, E2E OK   │
└─────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────┐
│                   SPRINT 3 (Day 3 - 8 hours)                        │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  Agent 3A: Maven Dependency Conflict Resolution                    │
│  └─ Fix BouncyCastle duplicates                                    │
│  └─ Resolve logging conflicts                                      │
│  └─ Update pom.xml exclusions                                      │
│  └─ Branch: feature/3a-dependency-conflicts                        │
│  └─ Time: 75 minutes                                               │
│                                                                     │
│  Agent 3B: Test Coverage Expansion (82.5% → 95%)                  │
│  └─ Add error scenario tests                                       │
│  └─ Add edge case tests                                            │
│  └─ Add concurrent operation tests                                 │
│  └─ Target 95%+ coverage                                           │
│  └─ Branch: feature/3b-test-coverage-expansion                     │
│  └─ Time: 180 minutes                                              │
│                                                                     │
│  Agent 3C: Complete Documentation Suite                            │
│  └─ API endpoint examples (curl commands)                          │
│  └─ Deployment guide                                               │
│  └─ Troubleshooting guide                                          │
│  └─ Performance tuning guide                                       │
│  └─ Branch: feature/3c-documentation-suite                         │
│  └─ Time: 165 minutes                                              │
│                                                                     │
├─────────────────────────────────────────────────────────────────────┤
│  Nightly Integration (18:00-20:00 UTC): Merge all 3 branches       │
│  Success Criteria: 95% coverage, 0 build warnings, docs complete   │
└─────────────────────────────────────────────────────────────────────┘
```

---

## DETAILED SPRINT 1: BACKEND FOUNDATION

### **Agent 1A: Backend Port Conflict Fix** 🔴
**Feature Branch**: `feature/1a-backend-port-fix`
**Worktree**: `worktrees/agent-1a`
**Duration**: 90 minutes

#### Tasks:
```
1. [15 min] Analyze current port configuration
   - Read application.properties
   - Check NGINX configuration
   - Document current state

2. [30 min] Update V11 configuration
   - Change quarkus.http.port from 9003 to 9004
   - Update any hardcoded port references
   - Create V8 migration note if needed
   - Commit: "config: Change V11 backend port from 9003 to 9004"

3. [30 min] Rebuild JAR and test locally
   - ./mvnw clean package -DskipTests
   - Verify JAR builds successfully
   - Test locally: java -jar target/aurigraph-v11-standalone-11.4.4-runner.jar
   - Commit: "build: Rebuild JAR with port 9004 configuration"

4. [15 min] Update NGINX routing (if needed)
   - Check NGINX upstream configuration
   - Update to route /api/v11 to localhost:9004
   - Test NGINX config syntax
   - Commit: "ops: Update NGINX to route port 9004"
```

**Acceptance Criteria**:
- ✅ JAR builds without errors
- ✅ Service starts on port 9004
- ✅ NGINX routes to correct port
- ✅ All 3 commits pushed to feature branch

**Blockers**: None (independent task)

---

### **Agent 1B: Database Schema Verification** 🟡
**Feature Branch**: `feature/1b-database-schema-fix`
**Worktree**: `worktrees/agent-1b`
**Duration**: 60 minutes

#### Tasks:
```
1. [15 min] Inspect current database schema
   - SSH to server
   - Connect to PostgreSQL
   - Check users table structure
   - Commit: "docs: Database schema inspection report"

2. [20 min] Verify UUID/VARCHAR compatibility
   - Query users.id column type
   - Check auth_tokens.user_id type
   - Verify foreign key constraints
   - Document findings

3. [15 min] Create V8 migration if needed
   - If type mismatch found, create V8__Fix_UUID_Types.sql
   - Add idempotent ALTER TYPE statements
   - Commit: "db: Add V8 migration for UUID type consistency"

4. [10 min] Test migration
   - Run Flyway on test database
   - Verify migration succeeds
   - Commit: "test: Verify V8 migration compatibility"
```

**Acceptance Criteria**:
- ✅ Schema inspection documented
- ✅ Type compatibility verified or fixed
- ✅ V8 migration (if needed) created and tested
- ✅ All commits pushed to feature branch

**Blockers**: Depends on database access (Agent 1A must complete first)

---

### **Agent 1C: Backend API Testing** 🟡
**Feature Branch**: `feature/1c-backend-api-tests`
**Worktree**: `worktrees/agent-1c`
**Duration**: 75 minutes

#### Tasks:
```
1. [20 min] Create comprehensive API test suite
   - Test GET /q/health (Quarkus health)
   - Test GET /q/health/live (liveness probe)
   - Test GET /q/health/ready (readiness probe)
   - Test GET /api/v11/stats (business endpoint)
   - Commit: "test: Add comprehensive API health tests"

2. [20 min] Test all 10 core endpoints
   - GET /api/v11/stats
   - GET /api/v11/stats/performance
   - GET /api/v11/stats/consensus
   - GET /api/v11/stats/transactions
   - POST /api/v11/nodes (with sample payload)
   - GET /api/v11/nodes/{id}
   - DELETE /api/v11/nodes/{id}
   - Test response codes, response times, data format
   - Commit: "test: Validate all 10 core API endpoints"

3. [20 min] Create integration test file
   - Add to src/test/java/io/aurigraph/v11/integration/
   - Use REST Assured or similar
   - Document expected responses
   - Commit: "test: Add integration test suite"

4. [15 min] Document test results
   - Create BACKEND_TEST_RESULTS.md
   - Record response times for each endpoint
   - Document any failures
   - Commit: "docs: Backend API test results"
```

**Acceptance Criteria**:
- ✅ All 10 endpoints tested
- ✅ Response times <100ms documented
- ✅ Test suite file created
- ✅ Test results documented
- ✅ All commits pushed to feature branch

**Blockers**: Depends on Agent 1A (backend must be running)

---

## DETAILED SPRINT 2: INTEGRATION & E2E

### **Agent 2A: Portal-Backend Integration** 🔴
**Feature Branch**: `feature/2a-portal-backend-integration`
**Worktree**: `worktrees/agent-2a`
**Duration**: 150 minutes

#### Tasks:
```
1. [30 min] Analyze current API integration
   - Check portal API client configuration
   - Verify base URL points to correct backend port
   - Identify which endpoints portal is calling
   - Document current integration state
   - Commit: "docs: Portal API integration analysis"

2. [40 min] Test API connectivity from portal
   - Verify portal can reach /api/v11/stats
   - Test /api/v11/stats/performance
   - Test /api/v11/nodes endpoint
   - Check response format matches expectations
   - Fix any CORS issues
   - Commit: "fix: Portal-to-backend API connectivity"

3. [40 min] Test WebSocket real-time connections
   - Verify WebSocket connection to /ws/metrics
   - Verify WebSocket connection to /ws/consensus
   - Verify WebSocket connection to /ws/transactions
   - Test message format and frequency
   - Commit: "test: WebSocket real-time connectivity"

4. [40 min] Integration testing & bug fixes
   - Test full data flow: Backend → Portal → UI
   - Fix any integration bugs found
   - Test error scenarios (network failures, timeouts)
   - Verify graceful degradation
   - Commit: "fix: Integration bug fixes and error handling"
```

**Acceptance Criteria**:
- ✅ Portal successfully calls all backend APIs
- ✅ Real-time WebSocket data flowing to portal
- ✅ Dashboard displays live data from backend
- ✅ Error handling verified
- ✅ Integration tests passing
- ✅ All commits pushed to feature branch

**Blockers**: Depends on Agent 1A, 1B, 1C (backend must be stable)

---

### **Agent 2B: E2E Workflow Testing** 🔴
**Feature Branch**: `feature/2b-e2e-workflow-tests`
**Worktree**: `worktrees/agent-2b`
**Duration**: 150 minutes

#### Tasks:
```
1. [40 min] Test Workflow A: Node Creation → Consensus → Finality
   Step 1a: Create node via POST /api/v11/nodes
     - POST body: {nodeId: "node-1", nodeType: "VALIDATOR", capacity: 1000}
     - Verify response code 201 (created)
     - Record node_id returned

   Step 1b: Verify node in system
     - GET /api/v11/nodes/{id}
     - Verify node appears with status INITIALIZING

   Step 1c: Monitor consensus state
     - GET /api/v11/stats/consensus
     - Verify node joins consensus group
     - Track state transitions (INITIALIZING → ACTIVE)

   Step 1d: Monitor finality
     - Watch consensus metrics
     - Measure time from creation to ACTIVE state
     - Target: <500ms

   - Commit: "test: E2E Workflow A - Node creation and consensus"

2. [40 min] Test Workflow B: Node Scaling (0 → 25 → 50 nodes)
   Step 2a: Create 25 validators/business/slim nodes
     - POST /api/v11/nodes multiple times
     - Verify all nodes created successfully

   Step 2b: Monitor system metrics
     - GET /api/v11/stats to track TPS
     - Verify 774K+ TPS at 25 nodes

   Step 2c: Scale to 50 nodes
     - Create additional 25 nodes
     - Monitor TPS and latency
     - Verify graceful scaling

   Step 2d: Delete nodes
     - DELETE /api/v11/nodes/{id} for excess nodes
     - Verify system returns to stable state

   - Commit: "test: E2E Workflow B - Node scaling 0→25→50"

3. [40 min] Test Workflow C: Data Tokenization Flow
   Step 3a: Create business nodes with external data
     - POST with dataSourceConfig containing external data

   Step 3b: Verify slim nodes receive tokenized data
     - Monitor /ws/transactions for tokenized messages

   Step 3c: Verify Merkle tree updates
     - GET /api/v11/merkle/tree
     - Verify nodes added to tree

   Step 3d: Validate transaction flow
     - Trace transaction through system
     - Verify finality and persistence

   - Commit: "test: E2E Workflow C - Data tokenization"

4. [30 min] Document E2E results
   - Create E2E_WORKFLOW_RESULTS.md
   - Document all 3 workflows
   - Record timing data
   - Document any issues found
   - Commit: "docs: E2E workflow test results"
```

**Acceptance Criteria**:
- ✅ Workflow A: Node creation to finality <500ms
- ✅ Workflow B: Scaling verified (25 & 50 nodes)
- ✅ Workflow C: Data tokenization working
- ✅ All workflows documented
- ✅ Timing metrics recorded
- ✅ All commits pushed to feature branch

**Blockers**: Depends on Agent 2A (integration must work)

---

### **Agent 2C: Configuration Cleanup** 🟡
**Feature Branch**: `feature/2c-config-cleanup`
**Worktree**: `worktrees/agent-2c`
**Duration**: 90 minutes

#### Tasks:
```
1. [20 min] Analyze Quarkus warnings
   - Build JAR and capture all warnings
   - Categorize warnings:
     - Unrecognized configuration keys (~20)
     - Deprecated properties (~2)
     - Missing extensions (~5)
   - Document each warning
   - Commit: "docs: Configuration warnings analysis"

2. [30 min] Remove unrecognized configuration keys
   - Remove all quarkus.cache.caffeine.* unused keys
   - Remove quarkus.grpc.server.enabled if not needed
   - Remove quarkus.websockets.* if not in use
   - Remove quarkus.http.cors if not needed
   - Edit src/main/resources/application.properties
   - Commit: "config: Remove unrecognized configuration keys"

3. [20 min] Update deprecated properties
   - Replace quarkus.hibernate-orm.database.generation
   - Replace quarkus.log.console.json
   - Use new recommended properties
   - Commit: "config: Update deprecated properties"

4. [20 min] Rebuild and verify
   - ./mvnw clean package -DskipTests
   - Capture build output
   - Verify warnings reduced to <5
   - Test service startup
   - Commit: "build: Clean JAR build with minimal warnings"
```

**Acceptance Criteria**:
- ✅ <5 warnings remaining (vs ~30 currently)
- ✅ No deprecated properties in config
- ✅ JAR builds cleanly
- ✅ Service starts without errors
- ✅ All commits pushed to feature branch

**Blockers**: None (independent task)

---

## DETAILED SPRINT 3: QUALITY & DOCUMENTATION

### **Agent 3A: Dependency Conflict Resolution** 🟡
**Feature Branch**: `feature/3a-dependency-conflicts`
**Worktree**: `worktrees/agent-3a`
**Duration**: 75 minutes

#### Tasks:
```
1. [20 min] Analyze Maven dependency conflicts
   - Build JAR and capture dependency warnings
   - Identify duplicate JARs:
     - BouncyCastle (bcprov vs bcprov-ext)
     - Logging (commons-logging vs SLF4J vs jboss-logging)
     - gRPC (vertx-grpc duplicates)
   - Document conflict sources
   - Commit: "docs: Maven dependency conflict analysis"

2. [30 min] Fix BouncyCastle conflicts
   - Edit pom.xml in aurigraph-v11-standalone/
   - Add exclusion for bcprov-jdk18on duplicate
   - Use explicit version for bcprov-ext-jdk18on only
   - Verify single version included
   - Commit: "build: Fix BouncyCastle JAR duplicates"

3. [15 min] Fix logging bridge conflicts
   - Exclude commons-logging in favor of SLF4J
   - Keep jboss-logging as primary
   - Add exclusion to conflicting dependencies
   - Commit: "build: Fix logging bridge conflicts"

4. [10 min] Rebuild and verify
   - ./mvnw clean package -DskipTests
   - Verify no more duplicate JAR warnings
   - Check final JAR size reasonable
   - Commit: "build: Verify dependency conflicts resolved"
```

**Acceptance Criteria**:
- ✅ No duplicate JAR warnings
- ✅ Single BouncyCastle version included
- ✅ Single logging implementation
- ✅ JAR builds cleanly
- ✅ All commits pushed to feature branch

**Blockers**: None (independent task)

---

### **Agent 3B: Test Coverage Expansion** 🟡
**Feature Branch**: `feature/3b-test-coverage-expansion`
**Worktree**: `worktrees/agent-3b`
**Duration**: 180 minutes

#### Tasks:
```
1. [50 min] Add error scenario tests
   - Test null input handling
   - Test invalid node configs
   - Test database connection failures
   - Test network timeouts
   - Test invalid authentication
   - Commit: "test: Add comprehensive error scenario tests"

2. [50 min] Add edge case tests
   - Test consensus with slow nodes
   - Test with maximum node count (50+)
   - Test with minimal resources
   - Test blockchain fork scenarios
   - Test transaction order edge cases
   - Commit: "test: Add edge case test coverage"

3. [50 min] Add concurrent operation tests
   - Test multiple simultaneous node creations
   - Test concurrent transaction processing
   - Test concurrent WebSocket connections
   - Test race conditions in consensus
   - Test state consistency under load
   - Commit: "test: Add concurrent operation tests"

4. [30 min] Run coverage analysis and document
   - ./mvnw verify (runs tests with coverage report)
   - Analyze coverage report
   - Verify coverage >95% for critical paths
   - Generate COVERAGE_REPORT.md
   - Commit: "docs: Test coverage analysis report (95%+)"
```

**Acceptance Criteria**:
- ✅ 50+ new tests added
- ✅ Overall coverage >90%
- ✅ Critical path coverage 95%+
- ✅ All new tests passing
- ✅ Coverage report generated
- ✅ All commits pushed to feature branch

**Blockers**: None (independent task)

---

### **Agent 3C: Documentation Suite** 🟡
**Feature Branch**: `feature/3c-documentation-suite`
**Worktree**: `worktrees/agent-3c`
**Duration**: 165 minutes

#### Tasks:
```
1. [40 min] Create API endpoint documentation
   File: API_REFERENCE.md

   For each of 10 endpoints:
   - Endpoint path & HTTP method
   - Description of what it does
   - Request body example (JSON)
   - Response example (JSON)
   - Example curl command
   - Expected response time
   - Error codes & meanings

   Example:
   ```
   ## POST /api/v11/nodes
   Create a new node in the blockchain network.

   ### Request
   POST https://dlt.aurigraph.io/api/v11/nodes
   Content-Type: application/json

   {
     "nodeId": "validator-1",
     "nodeType": "VALIDATOR",
     "capacity": 1000,
     "dataSourceUrl": "http://external-data.example.com"
   }

   ### Response (201 Created)
   {
     "id": "node-123456",
     "nodeId": "validator-1",
     "status": "INITIALIZING",
     "createdAt": "2025-11-28T15:45:00Z"
   }

   ### curl Example
   curl -X POST https://dlt.aurigraph.io/api/v11/nodes \
     -H "Content-Type: application/json" \
     -d '{...}'

   ### Timing
   Response time: <50ms
   ```

   - Commit: "docs: Complete API reference documentation"

2. [40 min] Create deployment guide
   File: DEPLOYMENT_GUIDE.md

   Sections:
   - Prerequisites (Java 21, Maven, Docker)
   - Building from source
   - Configuration for different environments (dev, staging, prod)
   - Database setup and migration
   - NGINX configuration
   - SSL/TLS certificate setup
   - Monitoring and logging setup
   - Health check verification
   - Startup procedure
   - Rolling deployment strategy

   - Commit: "docs: Complete deployment guide"

3. [40 min] Create troubleshooting guide
   File: TROUBLESHOOTING_GUIDE.md

   Common Issues:
   - Port already in use (with solutions)
   - Database connection errors (with solutions)
   - Out of memory errors (with solutions)
   - WebSocket connection failures (with solutions)
   - Consensus timeout issues (with solutions)
   - API endpoint timeouts (with solutions)
   - Performance degradation (with solutions)

   For each issue:
   - Symptoms (what user observes)
   - Root cause analysis
   - Solution steps
   - Preventive measures
   - Links to related documentation

   - Commit: "docs: Complete troubleshooting guide"

4. [45 min] Create performance tuning guide
   File: PERFORMANCE_TUNING_GUIDE.md

   Topics:
   - JVM tuning parameters
   - Database connection pooling
   - Redis cache configuration
   - NGINX buffer settings
   - WebSocket timeout settings
   - Consensus parameters
   - Node capacity planning
   - Load testing methodology

   For each parameter:
   - Current default value
   - What it affects (TPS, latency, memory)
   - Recommended range
   - How to configure
   - Expected impact of changes

   - Commit: "docs: Complete performance tuning guide"
```

**Acceptance Criteria**:
- ✅ API_REFERENCE.md complete with all 10 endpoints
- ✅ DEPLOYMENT_GUIDE.md with step-by-step instructions
- ✅ TROUBLESHOOTING_GUIDE.md with 7+ scenarios
- ✅ PERFORMANCE_TUNING_GUIDE.md with parameters
- ✅ All curl examples tested and working
- ✅ All commits pushed to feature branch

**Blockers**: None (can be done in parallel with others)

---

## DAILY STANDUP TEMPLATE

### **10:00 UTC Daily Standup**

**Format (5 min per agent × 6 agents = 30 min total)**:

Each agent reports:
1. **What I completed yesterday**
   - Number of commits
   - Tests passing
   - Blockers resolved

2. **What I'm working on today**
   - Current task
   - Expected completion time
   - Dependencies needed

3. **What's blocking me**
   - Any issues preventing progress
   - Help needed from other agents
   - Escalations to orchestrator

---

## NIGHTLY INTEGRATION PROCESS

### **18:00 UTC: Final commits**
All agents push final code to feature branches

### **18:30 UTC: Orchestrator merges**
```bash
git checkout integration
git pull origin main
git merge origin/feature/1a-backend-port-fix
git merge origin/feature/1b-database-schema-fix
# ... merge all 3 branches
git push origin integration
```

### **19:00 UTC: Build & test**
```bash
./mvnw clean package
./mvnw test
mvn verify (coverage check)
```

### **20:00 UTC: Status report**
Generate: `SPRINT_N_INTEGRATION_REPORT.md`

Format:
```markdown
# Sprint N Integration Report

## Build Status
- ✅ Build: PASSED (45.2 seconds)
- ✅ Tests: 117/117 PASSED (100%)
- ✅ Coverage: 95.2% (IMPROVED from 82.5%)

## Merged Branches
- feature/Na-...
- feature/Nb-...
- feature/Nc-...

## Issues Resolved
1. Port conflict (RESOLVED)
2. Database schema (RESOLVED)
...

## Remaining TODO
(For next sprint)

## Go/No-Go Decision
✅ GO TO NEXT SPRINT
```

---

## SUCCESS CRITERIA BY SPRINT

### **Sprint 1 Success** ✅
- [ ] Backend running on port 9004
- [ ] Database schema verified
- [ ] All 10 API endpoints responding
- [ ] <5 config warnings remaining

### **Sprint 2 Success** ✅
- [ ] Portal ↔ Backend integration working
- [ ] Real-time WebSocket data flowing
- [ ] All 3 E2E workflows passing
- [ ] E2E test results documented

### **Sprint 3 Success** ✅
- [ ] Zero duplicate JAR files
- [ ] Test coverage 95%+
- [ ] 50+ new tests added
- [ ] Complete documentation suite
- [ ] All guides tested and verified

---

## RISK MITIGATION

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|-----------|
| Port still in use after change | Low | High | Test thoroughly before deployment |
| Database migration fails | Low | High | Have rollback plan ready |
| Integration bugs discovered | Medium | Medium | Daily testing prevents cascading issues |
| Coverage increase takes longer | Medium | Low | Prioritize critical path coverage first |
| Documentation takes longer | Medium | Low | Parallelize writing across agents |

---

## GIT WORKTREE SETUP

```bash
# Create worktrees for Sprint 1
git worktree add worktrees/agent-1a feature/1a-backend-port-fix
git worktree add worktrees/agent-1b feature/1b-database-schema-fix
git worktree add worktrees/agent-1c feature/1c-backend-api-tests

# Each agent works independently
cd worktrees/agent-1a
# Do work
git add .
git commit -m "..."
git push origin feature/1a-backend-port-fix

# Orchestrator does final merge
cd /main/repo
git worktree prune
git checkout integration
git merge origin/feature/1a-backend-port-fix
```

---

## TIME ALLOCATION SUMMARY

```
Sprint 1 (6 hours total):
├─ Agent 1A: 90 min (port fix)
├─ Agent 1B: 60 min (database)
├─ Agent 1C: 75 min (API tests)
└─ Buffer: 15 min

Sprint 2 (8 hours total):
├─ Agent 2A: 150 min (integration)
├─ Agent 2B: 150 min (E2E workflows)
├─ Agent 2C: 90 min (config cleanup)
└─ Buffer: 30 min

Sprint 3 (8 hours total):
├─ Agent 3A: 75 min (dependencies)
├─ Agent 3B: 180 min (test coverage)
├─ Agent 3C: 165 min (documentation)
└─ Buffer: 60 min

Total: 22 hours parallel work = ~4.5 hours critical path
```

---

**EXECUTION STARTS**: Tomorrow 10:00 UTC
**SPRINT 1 BEGINS**: Agent 1A, 1B, 1C all working in parallel
**EXPECTED COMPLETION**: 3 days from start
**FINAL DELIVERY**: Production-ready application with 95%+ coverage

---

End of Multi-Sprint Execution Plan
