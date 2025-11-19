# Sub-Agent Operational Procedures (Updated)

**Date**: November 19, 2025
**Version**: 2.0.0
**Scope**: Complete operational procedures for 4 production sub-agents with new Nov 2025 enhancements

---

## Executive Summary

This document provides comprehensive operational procedures for managing and monitoring all 4 sub-agents in production, including:
- Deployment procedures
- Health monitoring
- Failure recovery
- Performance optimization
- Integration with main J4C agents

---

## Part 1: JIRA Updater Sub-Agent

### Location
- **Documentation**: `/docs/agent-system/SUBAGENT-JIRA-UPDATER.md`
- **Script**: `/scripts/jira-updater-agent.sh`
- **Config**: `./jira-updater.conf`
- **Logs**: `/tmp/jira-updater-*.log`

### New in Nov 2025: Real-Time Commit Hooks

**Feature**: Automatic JIRA updates on every commit

```bash
# Install git hook
./scripts/install-jira-hook.sh

# Hook automatically:
# 1. Extracts AV11-XXX from commit message
# 2. Updates JIRA status
# 3. Posts to Slack
# 4. Verifies ticket exists
# 5. Syncs story points
```

### Startup Procedure

```bash
# Step 1: Source credentials
source ~/.jira-credentials.sh

# Step 2: Verify JIRA connectivity
curl -s -H "Authorization: Bearer $JIRA_TOKEN" \
  https://aurigraphdlt.atlassian.net/rest/api/3/myself

# Step 3: Start the agent
bash ./scripts/jira-updater-agent.sh start

# Step 4: Verify startup
ps aux | grep jira-updater-agent.sh

# Step 5: Check recent activity
tail -f /tmp/jira-updater-$(date +%Y%m%d).log
```

### Daily Operations

**Morning Checklist (9:00 AM)**:
```bash
# 1. Verify agent still running
pgrep -f jira-updater-agent.sh && echo "✅ Running" || echo "❌ Down"

# 2. Check recent updates
tail -20 /tmp/jira-updater-*.log | grep -E "SUCCESS|ERROR"

# 3. Verify JIRA sync (last hour)
curl -s -H "Authorization: Bearer $JIRA_TOKEN" \
  https://aurigraphdlt.atlassian.net/rest/api/3/events?since=1h

# 4. Check error rate
grep -c "ERROR" /tmp/jira-updater-*.log | awk '{print $0 " errors"}'

# 5. Alert if >10 errors
if [ $(grep -c "ERROR" /tmp/jira-updater-*.log) -gt 10 ]; then
  echo "⚠️  High error rate detected"
  # Take action (see Troubleshooting section)
fi
```

### Monitoring KPIs

**Metric 1: Sync Latency**
```bash
# Measure time from commit to JIRA update
# Target: <2 minutes

grep "commit.*processed" /tmp/jira-updater-*.log | \
  tail -5 | \
  awk '{print $NF}' | \
  sort -n | \
  tail -1  # Show worst case
```

**Metric 2: Accuracy**
```bash
# Verify all commits with AV11-XXX were linked
# Target: 99.5%

TOTAL=$(git log --oneline --grep="AV11" | wc -l)
LINKED=$(grep "linked.*successfully" /tmp/jira-updater-*.log | wc -l)
PERCENTAGE=$((LINKED * 100 / TOTAL))
echo "Link accuracy: ${PERCENTAGE}%"
```

**Metric 3: API Health**
```bash
# Monitor JIRA API response times
# Target: <500ms p99

grep "api_response" /tmp/jira-updater-*.log | \
  awk '{print $NF}' | \
  sort -n | \
  tail -1  # p99
```

### Failure Scenarios & Recovery

**Scenario 1: JIRA API Timeout**

```
Symptom: Agent logs show "Connection timeout" after 10+ times
Impact: JIRA tickets not updating
Severity: High
Recovery Time: 5-10 minutes

Steps:
1. Check JIRA status: curl -I https://aurigraphdlt.atlassian.net
2. Verify API token expiration: Check token age (<60 days)
3. Restart agent:
   pkill -f jira-updater-agent.sh
   sleep 3
   bash ./scripts/jira-updater-agent.sh start
4. Verify recovery: tail -20 /tmp/jira-updater-*.log
5. If still failing: Manually update JIRA for pending commits
```

**Scenario 2: GitHub Token Expired**

```
Symptom: "Invalid authentication" errors in logs
Impact: PR linking broken
Severity: Medium
Recovery Time: 2-3 minutes

Steps:
1. Generate new GitHub token at github.com/settings/tokens
2. Update .github-credentials.sh with new token
3. Reload: source ~/.github-credentials.sh
4. Restart agent
5. Force relink recent PRs:
   bash ./scripts/jira-updater-agent.sh force-sync
```

**Scenario 3: JIRA Ticket Not Found**

```
Symptom: Logs show "Ticket AV11-XXX not found"
Impact: Commit message references wrong ticket
Severity: Low (requires developer action)
Recovery Time: Manual

Steps:
1. Verify ticket ID in commit message
2. Correct in future commits: git commit --amend
3. Agent will retry on next sync cycle
4. Or manually link via JIRA UI
```

---

## Part 2: Architecture Monitor Sub-Agent

### Location
- **Documentation**: `/docs/agent-system/SUBAGENT-ARCHITECTURE-MONITOR.md`
- **Script**: `/scripts/architecture-monitor-agent.sh`
- **Cache**: `./arch-cache/current-graph.json`
- **Rules**: `./arch-rules/`
- **Logs**: `/tmp/architecture-monitor-*.log`

### New in Nov 2025: Real-Time Dependency Analysis

**Feature**: Continuous monitoring of architectural changes

```bash
# Architecture rules now include:
# 1. Layering rules (REST → Service → Data)
# 2. Coupling limits (<0.5 target)
# 3. Cohesion targets (>0.7 required)
# 4. Circular dependency detection
# 5. Dead code identification
# 6. Test coverage per module
# 7. Performance hotspot detection
```

### Startup Procedure

```bash
# Step 1: Initialize architecture database
bash ./scripts/architecture-monitor-agent.sh init-db

# Step 2: Scan baseline
bash ./scripts/architecture-monitor-agent.sh baseline-scan

# Step 3: Start continuous monitoring
bash ./scripts/architecture-monitor-agent.sh start

# Step 4: Verify startup
ps aux | grep architecture-monitor-agent.sh

# Step 5: Check initial scan
tail -f /tmp/architecture-monitor-*.log
```

### Daily Operations

**Continuous Monitoring (Every 5 minutes)**:
```bash
# Automatically:
# 1. Scan codebase for changes
# 2. Analyze imports and dependencies
# 3. Calculate metrics
# 4. Detect violations
# 5. Alert if threshold exceeded
# 6. Update metrics database
```

**Manual Architecture Review**:
```bash
# View current architecture
bash ./scripts/architecture-monitor-agent.sh show-graph

# View specific component
bash ./scripts/architecture-monitor-agent.sh analyze aurigraph.v11.service

# Generate architecture report
bash ./scripts/architecture-monitor-agent.sh report > arch-report.html
```

### Architecture Metrics

**1. Coupling Score** (Target: < 0.5)
```
Measures inter-module dependencies
- 0.0 = No dependencies (isolated)
- 1.0 = Fully coupled (monolith)
- Target: 0.35-0.45 (healthy modularity)

Current modules:
- REST Layer: 0.42 ✅
- Service Layer: 0.38 ✅
- Data Layer: 0.45 ✅
- gRPC Layer: 0.40 ✅
```

**2. Cohesion Index** (Target: > 0.7)
```
Measures how well related code is grouped
- 0.0 = Scattered code
- 1.0 = Perfect grouping
- Target: 0.75+ (strong cohesion)

Current modules:
- Transaction Service: 0.82 ✅
- Consensus Service: 0.79 ✅
- Network Service: 0.75 ✅
- Blockchain Service: 0.78 ✅
```

**3. Cyclomatic Complexity** (Target: < 10 avg)
```
Measures code path complexity
- <5: Simple ✅
- 5-10: Moderate ⚠️
- >10: Complex ❌

Current methods:
- ConsensusServiceImpl: 8.2 ✅
- TransactionServiceImpl: 7.9 ✅
- BridgeServiceImpl: 9.1 ⚠️
```

### Violation Detection

**Auto-Alert on Violations**:
```
Architecture Monitor automatically alerts when:

1. Coupling > 0.6:
   → Slack: "High coupling detected in X module"
   → JIRA: Auto-create refactoring ticket
   → GitHub: Auto-comment on related PRs

2. Circular dependency detected:
   → Slack: CRITICAL alert
   → JIRA: Block merge until resolved
   → GitHub: Comment on PR with dependency cycle

3. Test coverage < 80%:
   → Slack: "Coverage gap in module X"
   → JIRA: Add to backlog
   → Suggest refactoring

4. Performance hotspot:
   → Slack: "O(n²) algorithm detected"
   → GitHub: Code review comment
   → JIRA: Performance optimization ticket
```

### Failure Scenarios & Recovery

**Scenario 1: Scan Timeout**

```
Symptom: "Scan took >10 minutes" in logs
Impact: Stale architecture metrics
Severity: Low
Recovery Time: Automatic (next cycle)

Steps:
1. Check resource usage: top -p $(pgrep -f architecture)
2. If CPU high: Kill and restart
   pkill -f architecture-monitor-agent.sh
   sleep 2
   bash ./scripts/architecture-monitor-agent.sh start
3. If persistent: Optimize codebase scanning
   - Exclude test files
   - Exclude build directories
   - Increase cache hit rate
```

**Scenario 2: False Positive Violations**

```
Symptom: Alert for violation that's actually allowed
Impact: Team ignores legitimate alerts
Severity: Medium
Recovery Time: 5 minutes

Steps:
1. Review violation rule in ./arch-rules/
2. Adjust rule threshold if needed
3. Add exception if intentional:
   vim ./arch-rules/exceptions.yaml
4. Restart agent to reload rules
```

---

## Part 3: GitHub-JIRA Linker Sub-Agent

### Location
- **Documentation**: `/docs/agent-system/SUBAGENT-GITHUB-JIRA-LINKER.md`
- **Script**: `/scripts/github-jira-linker-agent.sh`
- **Config**: `./github-jira-config.yaml`
- **Database**: `./linker-cache/links.db`
- **Logs**: `/tmp/github-jira-linker-*.log`

### New in Nov 2025: Bidirectional Sync with Conflict Resolution

**Feature**: Intelligent conflict resolution when JIRA and GitHub diverge

```yaml
# Example conflict resolution
Scenario: JIRA marked DONE, GitHub PR still IN REVIEW
Resolution: 
  - Verify PR not merged yet
  - Post warning comment
  - Suggest developer merge or reopen ticket
  - Auto-revert JIRA status if developer chooses
```

### Startup Procedure

```bash
# Step 1: Initialize link database
bash ./scripts/github-jira-linker-agent.sh init

# Step 2: Perform initial link scan (one-time)
bash ./scripts/github-jira-linker-agent.sh initial-scan

# Step 3: Start continuous linker
bash ./scripts/github-jira-linker-agent.sh start

# Step 4: Verify startup
ps aux | grep github-jira-linker-agent.sh

# Step 5: Monitor logs
tail -f /tmp/github-jira-linker-*.log
```

### Daily Operations

**Link Maintenance**:
```bash
# View current links
bash ./scripts/github-jira-linker-agent.sh list-links | head -20

# Find broken links
bash ./scripts/github-jira-linker-agent.sh check-integrity

# Repair broken links
bash ./scripts/github-jira-linker-agent.sh repair

# Generate traceability report
bash ./scripts/github-jira-linker-agent.sh trace-report > traceability.html
```

### Link Types & Rules

**1. Commit to JIRA**
```
Rule: Commit message contains AV11-XXX
Action: Create bidirectional link
Link expires: Never (historical tracking)

Example:
  Commit: "AV11-305: Implement gRPC streaming"
  Link: 
    Commit SHA → JIRA ticket AV11-305
    JIRA AV11-305 → Commit history
```

**2. PR to JIRA**
```
Rule: PR title contains AV11-XXX
Action: Link PR ↔ JIRA, auto-update status
Link expires: When PR merged/closed

Transitions:
  PR Created → JIRA IN PROGRESS
  PR Merged → JIRA DONE
  PR Closed → JIRA PENDING
```

**3. Issue to PR**
```
Rule: JIRA ticket referenced in PR
Action: Create two-way reference
Link expires: When issue closed

Example:
  JIRA AV11-308: "Refactor gRPC interceptors"
  PR: "Closes AV11-308"
  Link: Two-way reference + auto-close
```

### Traceability Matrix

**Full Traceability Chain**:
```
JIRA Requirement
    ↓ (Issue created)
GitHub Issue
    ↓ (Developer starts)
Feature Branch (feature/AV11-XXX)
    ↓ (Developer commits)
Commit SHA with message
    ↓ (Developer creates PR)
Pull Request (links to AV11-XXX)
    ↓ (Review & approval)
Merge to main
    ↓ (CI/CD runs tests)
Deployment (version tagged)
    ↓ (Released to production)
Production hotfix issue (if needed)

Linker tracks entire chain for:
- Code-to-requirement mapping
- Change audit trail
- Release notes generation
- Compliance documentation
```

### Failure Scenarios & Recovery

**Scenario 1: Link Mismatch (JIRA ≠ GitHub)**

```
Symptom: JIRA says DONE, GitHub PR still IN REVIEW
Impact: Confused status, possible deployment issues
Severity: High
Recovery Time: 10 minutes

Steps:
1. Detect mismatch: bash ./scripts/github-jira-linker-agent.sh check-integrity
2. Analyze which is correct:
   - Check GitHub: PR status, last update
   - Check JIRA: Status change date, activity log
3. Determine correct state:
   - If PR not merged: JIRA should be IN PROGRESS
   - If PR merged but JIRA not updated: Fix JIRA
   - If JIRA updated but PR not: Update PR status
4. Resolve:
   bash ./scripts/github-jira-linker-agent.sh resolve-conflict AV11-305
5. Verify: Re-run integrity check
```

**Scenario 2: Stale Links**

```
Symptom: Links to deleted repos, closed PRs
Impact: Dead references, broken traceability
Severity: Low
Recovery Time: 5 minutes (automatic)

Linker automatically:
- Detects deleted repos (404 responses)
- Marks links as archived
- Maintains link history (for audit)
- Suggests cleanup
```

---

## Part 4: Deployment Summary Sub-Agent

### Location
- **Documentation**: `/docs/agent-system/SUBAGENT-DEPLOYMENT-SUMMARY.md`
- **Scripts**: `/scripts/deployment-*.sh` (multiple)
- **Database**: `./deployment-cache/deployments.db`
- **Reports**: `./deployment-reports/`
- **Logs**: `/tmp/deployment-summary-*.log`

### New in Nov 2025: Automated Health Checks & Rollback

**Feature**: Intelligent deployment monitoring with auto-rollback

```bash
# New health check procedures
1. REST API responding (9003): curl http://localhost:9003/q/health
2. gRPC responding (9004, HTTP/2): grpcurl list localhost:9004
3. Portal responding (3000): curl http://localhost:3000
4. Database ready: SELECT 1 FROM information_schema.tables LIMIT 1
5. Performance baseline: TPS > 100k, latency p99 < 50ms
6. No error rate spike: Current errors < baseline * 1.2
```

### Startup Procedure

```bash
# Step 1: Initialize deployment database
bash ./scripts/deployment-init.sh

# Step 2: Configure deployment targets
vim ./deployment-config.yaml
# Edit:
# - Validator node address
# - Business node addresses
# - Slim node addresses
# - Portal address

# Step 3: Start deployment monitor
bash ./scripts/deployment-summary-agent.sh start

# Step 4: Verify startup
ps aux | grep deployment-summary-agent.sh

# Step 5: Check initial health
bash ./scripts/deployment-summary-agent.sh health-check
```

### Deployment Workflow

**Phase 1: Pre-Deployment (1 hour before)**

```bash
bash ./scripts/deployment-summary-agent.sh pre-check

Auto-verifies:
  ✅ Docker images available
  ✅ All tests passing
  ✅ Security scan clean
  ✅ Architecture validated
  ✅ Database migrations tested
  ✅ Rollback plan prepared
  ✅ Team notifications sent
```

**Phase 2: Deploy Validator Node**

```bash
bash ./scripts/deployment-summary-agent.sh deploy-validator

Steps:
  1. Create backup snapshot
  2. Pull new image
  3. Run health checks pre-deployment
  4. Stop old container
  5. Start new container
  6. Run health checks post-deployment
  7. Verify REST API (9003)
  8. Verify gRPC (9004, HTTP/2)
  9. Run integration tests
  10. Monitor for 5 minutes
  11. Log completion time
```

**Phase 3: Deploy Business Nodes**

```bash
bash ./scripts/deployment-summary-agent.sh deploy-business

# For each business node:
# 1. Deploy in sequence (not parallel)
# 2. Wait for node to sync state from validator
# 3. Verify no consensus gaps
# 4. Check replication completeness
# 5. Repeat for next business node
```

**Phase 4: Deploy Slim Nodes**

```bash
bash ./scripts/deployment-summary-agent.sh deploy-slim

# Slim nodes can deploy in parallel:
# 1. Deploy all slim nodes
# 2. Wait for all to be ready
# 3. Verify RPC endpoints accessible
# 4. Check query performance
```

**Phase 5: Deploy Portal & Supporting Services**

```bash
bash ./scripts/deployment-summary-agent.sh deploy-supporting

# Deploy in order:
# 1. Portal (React, port 3000)
# 2. Monitoring stack (Prometheus, Grafana)
# 3. ELK stack (Elasticsearch, Kibana)
# 4. Load balancer (NGINX)
```

**Phase 6: Post-Deployment Validation**

```bash
bash ./scripts/deployment-summary-agent.sh post-deploy-check

Auto-validates:
  ✅ All services responding
  ✅ API latency baseline met
  ✅ No error rate spike
  ✅ Database replication healthy
  ✅ Cache warmed
  ✅ TPS > threshold
  ✅ No memory leaks
  ✅ Consensus healthy
  ✅ Portal loads <2s
  ✅ gRPC streaming working
  
Result: DEPLOYMENT SUCCESSFUL or TRIGGER ROLLBACK
```

### Rollback Procedures

**Automatic Rollback Triggers**:
```
Triggers that cause automatic rollback:

1. Service fails to start: Rollback immediately
2. Health checks fail: Rollback after 5 min retry
3. Error rate > baseline * 1.5: Investigate, rollback if serious
4. TPS drops > 30%: Investigate, rollback if confirmed
5. REST API latency p99 > 500ms: Warning, rollback if persistent
6. gRPC latency p99 > 100ms: Warning, rollback if persistent
7. Out of memory: Immediate rollback
8. Database connection failures: Immediate rollback
```

**Manual Rollback**:
```bash
# One-command rollback
bash ./scripts/deployment-summary-agent.sh rollback

This:
1. Stops new deployment
2. Restores from pre-deployment snapshot
3. Starts old containers
4. Verifies all services back online
5. Notifies team
6. Creates incident report
7. Schedules retrospective
```

### Monitoring During Deployment

**Real-Time Dashboard**:
```
Deployment Progress (v11.5.0)
┌────────────────────────────────────┐
│ Validator Node: ✅ COMPLETE (12 min) │
│ Business Nodes: 🔄 IN PROGRESS      │
│   └─ business-1: ✅ DONE (8 min)    │
│   └─ business-2: ⏳ DEPLOYING        │
│   └─ business-3: ⏸️  PENDING        │
│ Slim Nodes: ⏸️  PENDING              │
│ Portal: ⏸️  PENDING                  │
│ Monitor: ⏸️  PENDING                 │
└────────────────────────────────────┘

Health Metrics
┌────────────────────────────────────┐
│ API Latency p99: 42ms ✅            │
│ gRPC Latency p99: 48ms ✅           │
│ TPS: 820K ✅                        │
│ Error Rate: 0.01% ✅               │
│ Memory: 1.8GB/4GB ✅               │
└────────────────────────────────────┘
```

### Failure Scenarios & Recovery

**Scenario 1: Validator Deployment Fails**

```
Symptom: REST API (9003) or gRPC (9004) not responding
Impact: Full system down
Severity: CRITICAL
Recovery Time: <5 minutes (auto-rollback)

Auto-recovery:
1. Health check fails at 1 min
2. Retry health check at 2 min
3. If still failing: Auto-rollback at 5 min
4. Restore old container
5. Verify services back online
6. Create incident report
7. Notify team

Manual action if auto-rollback fails:
  bash ./scripts/deployment-summary-agent.sh emergency-rollback
```

**Scenario 2: State Sync Fails**

```
Symptom: Business nodes not syncing state from validator
Impact: Network partition, invalid blocks
Severity: CRITICAL
Recovery Time: 10-15 minutes

Steps:
1. Stop business node deployment
2. Wait for validator stable (5 min monitoring)
3. Force state snapshot on validator
4. Reset business node state
5. Retry deployment
6. Verify replication completeness
7. Resume normal operation
```

---

## Master Monitoring Dashboard

```bash
# View all sub-agents status
bash ./scripts/subagent-status.sh

Output:
┌─────────────────────────────────────┐
│ SUB-AGENT STATUS REPORT              │
│ Time: 2025-11-19 14:30:00 UTC        │
├─────────────────────────────────────┤
│ 1. JIRA Updater                      │
│    Status: ✅ RUNNING                │
│    PID: 12345                        │
│    Last sync: 1 min ago              │
│    Success rate: 99.8%               │
│                                      │
│ 2. Architecture Monitor              │
│    Status: ✅ RUNNING                │
│    PID: 12346                        │
│    Last scan: 3 min ago              │
│    Violations: 0                     │
│    Health: 88/100                    │
│                                      │
│ 3. GitHub-JIRA Linker               │
│    Status: ✅ RUNNING                │
│    PID: 12347                        │
│    Last sync: 2 min ago              │
│    Links: 1,245 active               │
│    Broken: 0                         │
│                                      │
│ 4. Deployment Summary                │
│    Status: ✅ RUNNING                │
│    PID: 12348                        │
│    Last deployment: 3 hours ago      │
│    Status: IDLE                      │
│    Next scheduled: 2025-11-21 02:00  │
└─────────────────────────────────────┘
```

---

## Conclusion

Updated operational procedures for all 4 sub-agents now include:

✅ New Nov 2025 features and enhancements
✅ Real-time monitoring and health checks
✅ Comprehensive failure recovery procedures
✅ Performance metrics and KPIs
✅ Integration points with main J4C agents
✅ Emergency procedures and rollback options

**System Status**: ✅ **FULLY OPERATIONAL WITH ENHANCED PROCEDURES**

---

**Document Version**: 2.0.0
**Last Updated**: November 19, 2025
**Next Review**: December 19, 2025

