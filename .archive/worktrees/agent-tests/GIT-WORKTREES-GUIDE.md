# Git Worktrees - Parallel Development Guide

**Created**: November 12, 2025
**Purpose**: Enable multiple Claude Code sessions to work in parallel on different features
**Repository**: Aurigraph-DLT

---

## Overview

Git worktrees allow you to work on multiple branches simultaneously in separate directories. This is perfect for running multiple Claude Code instances in parallel without context switching or merge conflicts.

## Worktree Structure

### Main Repository
```
/Users/subbujois/subbuworkingdir/Aurigraph-DLT
├── Branch: main
├── Status: Primary development branch
└── Use: Integration and production commits
```

### Feature Worktrees

| Worktree | Location | Branch | Purpose |
|----------|----------|--------|---------|
| **gRPC** | `../Aurigraph-DLT-grpc` | `feature/grpc-services` | Implement gRPC protocol buffers and services |
| **Performance** | `../Aurigraph-DLT-perf` | `feature/performance-optimization` | Optimize throughput and reduce latency |
| **Testing** | `../Aurigraph-DLT-tests` | `feature/test-coverage-expansion` | Expand test coverage to 95%+ |
| **Monitoring** | `../Aurigraph-DLT-monitoring` | `feature/monitoring-dashboards` | Build monitoring and observability dashboards |

## How Worktrees Work

### Complete Independence
Each worktree:
- Has its own working directory
- Can have uncommitted changes
- Can be on different branches
- **Shares the same Git object database** (.git folder)
- Changes committed in one worktree don't affect others

### Workflow
```
Main Repository (main branch)
        ↓
    ┌───┴─────┬──────────┬────────────┐
    ↓         ↓          ↓            ↓
  gRPC     Performance  Testing    Monitoring
  Branch   Branch       Branch     Branch
    ↓         ↓          ↓            ↓
worktree1 worktree2  worktree3  worktree4

Each runs independently with Claude Code!
```

## Quick Start

### 1. Navigate to a Worktree
```bash
# Open gRPC services worktree
cd ../Aurigraph-DLT-grpc

# Work on the feature
vim src/main/proto/transaction.proto
./mvnw clean package

# Commit changes
git commit -m "feat(grpc): Add transaction service proto definitions"
```

### 2. Push Feature Branch
```bash
# From the worktree directory
git push origin feature/grpc-services
```

### 3. Create Pull Request
```bash
# After pushing
gh pr create --title "Implement gRPC Protocol Buffers" \
  --body "Adds gRPC service definitions for transaction processing"
```

## Detailed Worktree Information

### Worktree 1: gRPC Services
**Path**: `/Users/subbujois/subbuworkingdir/Aurigraph-DLT-grpc`
**Branch**: `feature/grpc-services`
**Purpose**: Implement gRPC protocol layer

**Tasks**:
- [ ] Create `.proto` files for core services
  - TransactionService
  - ConsensusService
  - CryptoService
  - BridgeService
- [ ] Generate Java gRPC stubs
- [ ] Implement service handlers
- [ ] Add unit tests
- [ ] Performance benchmarks

**Key Files**:
```
src/main/proto/
├── transaction.proto
├── consensus.proto
├── crypto.proto
└── bridge.proto

src/main/java/io/aurigraph/v11/grpc/
├── TransactionServiceImpl.java
├── ConsensusServiceImpl.java
├── CryptoServiceImpl.java
└── BridgeServiceImpl.java
```

---

### Worktree 2: Performance Optimization
**Path**: `/Users/subbujois/subbuworkingdir/Aurigraph-DLT-perf`
**Branch**: `feature/performance-optimization`
**Purpose**: Achieve 1M+ TPS target

**Tasks**:
- [ ] Profile current bottlenecks
- [ ] Optimize database queries (index analysis)
- [ ] Tune JVM parameters
  - GC tuning (currently G1GC)
  - Heap sizing
  - Thread pool optimization
- [ ] Implement connection pooling
- [ ] Cache optimization (Redis)
- [ ] Network optimization
- [ ] Run load tests (target: 1M TPS)

**Key Metrics**:
```
Current:     ~50K TPS per node (baseline)
Target:      1M+ TPS (51-node cluster)
Latency P95: <200ms (target: <150ms)
Memory:      <512MB per node
```

**Key Files**:
```
src/main/java/io/aurigraph/v11/performance/
├── PerformanceOptimizer.java
├── QueryOptimizer.java
├── CacheManager.java
└── ThreadPoolTuner.java

tests/performance/
├── LoadTest.java
├── ThroughputBenchmark.java
└── LatencyProfile.java
```

---

### Worktree 3: Test Coverage Expansion
**Path**: `/Users/subbujois/subbuworkingdir/Aurigraph-DLT-tests`
**Branch**: `feature/test-coverage-expansion`
**Purpose**: Reach 95%+ test coverage

**Tasks**:
- [ ] Unit tests (target: 95% lines, 90% functions)
- [ ] Integration tests for all APIs
- [ ] E2E tests for user flows
- [ ] Security tests (authorization, authentication)
- [ ] Performance tests (1M TPS validation)
- [ ] Chaos engineering tests
- [ ] Contract tests (gRPC)

**Coverage Targets**:
```
Current:     ~15% (starting baseline)
Target:      95% lines, 90% functions
By Module:
- consensus:     95%
- crypto:        98%
- api:           90%
- database:      85%
- grpc:          90%
```

**Key Files**:
```
tests/unit/
├── consensus/
├── crypto/
├── api/
└── database/

tests/integration/
├── api/
├── database/
└── grpc/

tests/e2e/
├── transaction-flow/
├── consensus-flow/
└── cross-chain-flow/
```

---

### Worktree 4: Monitoring Dashboards
**Path**: `/Users/subbujois/subbuworkingdir/Aurigraph-DLT-monitoring`
**Branch**: `feature/monitoring-dashboards`
**Purpose**: Build comprehensive monitoring infrastructure

**Tasks**:
- [ ] Prometheus metrics integration
- [ ] Grafana dashboard templates
  - System Health Dashboard
  - Performance Metrics Dashboard
  - Transaction Analytics Dashboard
  - Consensus Metrics Dashboard
  - Security/Audit Dashboard
- [ ] ELK Stack integration (if applicable)
- [ ] Alerting rules (PagerDuty/Slack)
- [ ] Custom metrics
- [ ] Real-time WebSocket updates

**Dashboards**:
```
1. System Health
   - CPU, Memory, Disk usage
   - Database connectivity
   - Service uptime
   - Error rates

2. Performance Metrics
   - Transactions Per Second (TPS)
   - Latency (P50, P95, P99)
   - Throughput by endpoint
   - Request distribution

3. Transaction Analytics
   - Transaction volume by type
   - Success/failure rates
   - Cross-chain transactions
   - Smart contract executions

4. Consensus Metrics
   - Block production rate
   - Consensus latency
   - Node synchronization
   - Fork detection

5. Security & Audit
   - Authentication events
   - Authorization failures
   - Rate limiting violations
   - Audit trail
```

**Key Files**:
```
monitoring/
├── prometheus/
│   ├── prometheus.yml
│   └── rules.yml
├── grafana/
│   ├── dashboards/
│   │   ├── system-health.json
│   │   ├── performance-metrics.json
│   │   ├── transaction-analytics.json
│   │   ├── consensus-metrics.json
│   │   └── security-audit.json
│   └── datasources/
└── alerting/
    └── alert-rules.yml

src/main/java/io/aurigraph/v11/monitoring/
├── MetricsExporter.java
├── HealthCheckService.java
├── PerformanceMetrics.java
└── AuditLogger.java
```

## Common Operations

### View All Worktrees
```bash
git worktree list
```

**Output**:
```
/Users/subbujois/subbuworkingdir/Aurigraph-DLT             6fb29f09 [main]
/Users/subbujois/subbuworkingdir/Aurigraph-DLT-grpc        6fb29f09 [feature/grpc-services]
/Users/subbujois/subbuworkingdir/Aurigraph-DLT-perf        6fb29f09 [feature/performance-optimization]
/Users/subbujois/subbuworkingdir/Aurigraph-DLT-tests       6fb29f09 [feature/test-coverage-expansion]
/Users/subbujois/subbuworkingdir/Aurigraph-DLT-monitoring  6fb29f09 [feature/monitoring-dashboards]
```

### Get Worktree Status
```bash
# From any worktree
git worktree status
```

### Switch Between Worktrees
```bash
# Open terminal 1: gRPC development
cd ../Aurigraph-DLT-grpc
./mvnw quarkus:dev  # Hot reload for gRPC changes

# Open terminal 2: Performance testing
cd ../Aurigraph-DLT-perf
./mvnw test -Dtest=LoadTest  # Run performance tests

# Open terminal 3: Test coverage
cd ../Aurigraph-DLT-tests
./mvnw verify  # Run tests with coverage

# Open terminal 4: Monitoring setup
cd ../Aurigraph-DLT-monitoring
docker-compose up -d  # Start Prometheus/Grafana
```

### Create Additional Worktrees
```bash
# Create a new feature branch and worktree
cd /Users/subbujois/subbuworkingdir/Aurigraph-DLT
git worktree add -b feature/new-feature ../Aurigraph-DLT-new-feature

# Start working on it
cd ../Aurigraph-DLT-new-feature
git status
```

### Remove a Worktree
```bash
# From main directory
git worktree remove ../Aurigraph-DLT-feature-name

# Or prune worktree
git worktree prune
```

### Check Branch Status
```bash
# From the worktree
git log --oneline -5
git status
git diff main...HEAD
```

## Development Workflow

### Step 1: Start New Worktree Session
```bash
# Terminal 1: gRPC Services
cd ../Aurigraph-DLT-grpc

# Terminal 2: Performance
cd ../Aurigraph-DLT-perf

# Terminal 3: Tests
cd ../Aurigraph-DLT-tests

# Terminal 4: Monitoring
cd ../Aurigraph-DLT-monitoring
```

### Step 2: Make Changes in Each Worktree
```bash
# Each worktree works independently
cd ../Aurigraph-DLT-grpc
# Make proto changes, add tests, etc.

cd ../Aurigraph-DLT-perf
# Optimize performance, run benchmarks
```

### Step 3: Commit Changes Per Worktree
```bash
# From gRPC worktree
git add .
git commit -m "feat(grpc): Add proto definitions"

# From perf worktree
git add .
git commit -m "perf: Optimize database queries"
```

### Step 4: Push and Create PRs
```bash
# From each worktree
git push origin feature/grpc-services
gh pr create --title "gRPC Services"

git push origin feature/performance-optimization
gh pr create --title "Performance Optimization"
```

### Step 5: Merge to Main
Once reviewed and approved:
```bash
# From main branch
git pull origin
git merge feature/grpc-services
git merge feature/performance-optimization
```

## Best Practices

### 1. Keep Branches Focused
Each worktree should focus on a single feature area:
- ✅ `feature/grpc-services` - Only gRPC related
- ❌ `feature/everything` - Don't mix multiple features

### 2. Commit Frequently
```bash
# Good - atomic commits
git commit -m "feat(grpc): Add transaction proto"
git commit -m "test(grpc): Add TransactionService tests"

# Bad - large monolithic commits
git commit -m "Add gRPC, optimize performance, add tests..."
```

### 3. Keep Branches Up to Date
```bash
# From feature branch
git fetch origin
git rebase origin/main
# Resolve conflicts if any
```

### 4. Regular Integration
```bash
# From main
git pull origin
git merge feature/grpc-services
git merge feature/performance-optimization
# Test integration
./mvnw clean package
```

### 5. Use Pull Requests
Always use PRs for code review:
```bash
git push origin feature/grpc-services
gh pr create --title "Implement gRPC Protocol"
```

## Parallel Claude Sessions

### Running Multiple Claude Instances

You can now run Claude Code in multiple worktrees simultaneously:

```bash
# Terminal 1: Claude working on gRPC
cd ../Aurigraph-DLT-grpc
claude code

# Terminal 2: Claude working on Performance
cd ../Aurigraph-DLT-perf
claude code

# Terminal 3: Claude working on Tests
cd ../Aurigraph-DLT-tests
claude code

# Terminal 4: Claude working on Monitoring
cd ../Aurigraph-DLT-monitoring
claude code
```

### Coordination Tips

1. **Use feature branch names** in commit messages to identify work:
   ```bash
   git commit -m "feat(grpc/services): Add consensus service proto"
   ```

2. **Keep PR descriptions detailed**:
   ```markdown
   ## Description
   Adds gRPC protocol buffer definitions for transaction service

   ## Related Feature Branch
   feature/grpc-services

   ## Testing
   - [ ] Unit tests
   - [ ] Integration tests
   - [ ] Performance tests
   ```

3. **Tag commits with feature area**:
   ```bash
   # Good prefix usage
   feat(grpc/...)      # gRPC features
   perf(...)          # Performance optimizations
   test(...)          # Test coverage
   feat(monitoring/...) # Monitoring features
   ```

## Troubleshooting

### Issue: Conflicts When Merging Worktrees
**Solution**: Keep branches focused and frequently pull from origin
```bash
git fetch origin
git rebase origin/main
# Resolve conflicts
git add .
git rebase --continue
```

### Issue: Worktree Lock File Exists
**Solution**: Remove stale lock
```bash
git worktree prune
# Or manually
rm -f /Users/subbujois/subbuworkingdir/Aurigraph-DLT-grpc/.git/index.lock
```

### Issue: Changes Lost in Worktree
**Solution**: Check git reflog
```bash
cd ../Aurigraph-DLT-grpc
git reflog
git checkout <sha>  # Recover lost commit
```

## Status Summary

✅ **Worktrees Created**: 4 feature branches ready for parallel development
✅ **Shared Repository**: All worktrees share the same Git object database
✅ **Independent Development**: Each worktree can have uncommitted changes
✅ **PR Ready**: Each feature can be pushed and reviewed independently
✅ **Integration Path**: Features can be merged to main after review

## Next Steps

1. **Start Feature Work**:
   - Open 4 terminal windows
   - Navigate to each worktree
   - Launch Claude Code in each

2. **Parallel Development**:
   - Each session works independently
   - Commit to feature branch
   - Push when ready for review

3. **Integration**:
   - Create PRs from each feature branch
   - Review and test integration
   - Merge to main after approval

---

**Document**: Git Worktrees - Parallel Development Guide
**Created**: 2025-11-12
**Repository**: Aurigraph-DLT
**Status**: ✅ Ready for Parallel Development
