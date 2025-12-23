# Agent Framework + Git Worktrees Integration Plan

**Date**: November 12, 2025
**Status**: Proposed Integration
**Purpose**: Enable parallel agent development with isolated feature branches

---

## Current State

### Agent Framework (Existing)
- ✅ 10 specialized agents with 40+ subagents
- ✅ JIRA integration for task assignment
- ✅ Parallel execution framework
- ❌ Single working directory (no branch isolation)
- ❌ Manual branch switching between tasks

### Git Worktrees (Just Created)
- ✅ 4 parallel feature branches ready
- ✅ Independent directories per agent
- ✅ Shared Git object database
- ❌ Not yet integrated with agent framework

---

## Proposed Integration Architecture

### Phase 1: Agent-to-Worktree Mapping

```
Agent Framework          Git Worktrees          Feature Branches
─────────────────────────────────────────────────────────────────

CAA (Chief Architect)  → main                  (coordination branch)
BDA (Backend)         → Aurigraph-DLT-bda     → feature/backend-*
FDA (Frontend)        → Aurigraph-DLT-fda     → feature/frontend-*
SCA (Security)        → Aurigraph-DLT-sca     → feature/security-*
ADA (AI/ML)          → Aurigraph-DLT-ada     → feature/ai-*
IBA (Integration)    → Aurigraph-DLT-iba     → feature/bridge-*
QAA (Testing)        → Aurigraph-DLT-qaa     → feature/testing-*
DDA (DevOps)         → Aurigraph-DLT-dda     → feature/devops-*
DOA (Documentation) → Aurigraph-DLT-doa     → feature/docs-*
PMA (Coordination)   → main                  (shared orchestration)
```

### Phase 2: Automatic Worktree Provisioning

**System Workflow**:
```
1. JIRA Ticket Created
   ↓
2. PMA (Project Manager Agent) Triggers
   ↓
3. Auto-detect Agent Assignment (by keyword)
   ↓
4. Create/Checkout Worktree for Agent
   ↓
5. Create Feature Branch in Worktree
   ↓
6. Update JIRA: "Branch ready at ../Aurigraph-DLT-agent/"
   ↓
7. Agent Begins Work in Isolated Directory
   ↓
8. Agent Commits to Feature Branch
   ↓
9. Agent Creates PR from Feature Branch
   ↓
10. PMA Reviews + Merges to Main
```

---

## Implementation Details

### Feature Branch Naming Convention

Each agent gets dedicated feature branches:

```
BDA (Backend):
  feature/bda/grpc-services
  feature/bda/performance-optimization
  feature/bda/transaction-processing

FDA (Frontend):
  feature/fda/dashboard-enhancement
  feature/fda/real-time-updates
  feature/fda/mobile-optimization

SCA (Security):
  feature/sca/quantum-crypto-upgrade
  feature/sca/hsm-integration
  feature/sca/security-audit

QAA (Testing):
  feature/qaa/test-coverage-expansion
  feature/qaa/performance-benchmarks
  feature/qaa/e2e-testing

DDA (DevOps):
  feature/dda/ci-cd-pipeline
  feature/dda/kubernetes-deployment
  feature/dda/monitoring-stack
```

### Automated Worktree Management Script

Create `scripts/agent-worktree-manager.sh`:

```bash
#!/bin/bash
# Agent Worktree Management System

AGENT_NAME=$1
FEATURE_BRANCH=$2

case $AGENT_NAME in
  bda)
    WORKTREE_PATH="../Aurigraph-DLT-bda"
    AGENT_LABEL="Backend Development"
    ;;
  fda)
    WORKTREE_PATH="../Aurigraph-DLT-fda"
    AGENT_LABEL="Frontend Development"
    ;;
  sca)
    WORKTREE_PATH="../Aurigraph-DLT-sca"
    AGENT_LABEL="Security & Crypto"
    ;;
  dda)
    WORKTREE_PATH="../Aurigraph-DLT-dda"
    AGENT_LABEL="DevOps"
    ;;
  qaa)
    WORKTREE_PATH="../Aurigraph-DLT-qaa"
    AGENT_LABEL="Quality Assurance"
    ;;
  *)
    echo "Unknown agent: $AGENT_NAME"
    exit 1
    ;;
esac

# Create worktree if not exists
if [ ! -d "$WORKTREE_PATH" ]; then
  git worktree add -b "$FEATURE_BRANCH" "$WORKTREE_PATH" main
  echo "✅ Created worktree for $AGENT_LABEL at $WORKTREE_PATH"
else
  # Switch to feature branch if exists
  cd "$WORKTREE_PATH"
  git fetch origin
  git checkout "$FEATURE_BRANCH" || git checkout -b "$FEATURE_BRANCH"
  echo "✅ Ready for $AGENT_LABEL at $WORKTREE_PATH on $FEATURE_BRANCH"
fi
```

### Enhanced JIRA Integration

Modify `agent-executor.js` to:

1. **Auto-create worktrees** when assigning tasks
2. **Post worktree location** in JIRA comments
3. **Track branch/commit** in JIRA custom fields
4. **Validate branch status** before merging

---

## Benefits of Integration

### For Agent Framework
| Benefit | Impact |
|---------|--------|
| **Parallel Execution** | Agents work simultaneously without conflicts |
| **Isolation** | Changes in one agent don't affect others |
| **Atomic Commits** | Each agent's work is self-contained |
| **Easy Rollback** | Individual feature branches can be reverted |
| **Clear History** | Git history shows who did what |

### For Development Velocity
- ✅ Zero context-switching overhead
- ✅ Reduced merge conflicts
- ✅ Faster PR review cycles
- ✅ Cleaner CI/CD integration

### For Quality
- ✅ Per-agent code review
- ✅ Per-agent test runs
- ✅ Per-agent performance benchmarks
- ✅ Clear accountability

---

## Implementation Roadmap

### Sprint 1: Core Integration (Week 1)
- [ ] Update `agent-executor.js` with worktree provisioning
- [ ] Create worktree management script
- [ ] Map agents to worktree/branch patterns
- [ ] Update JIRA integration for branch tracking
- [ ] Documentation in agent framework

### Sprint 2: Automation (Week 2)
- [ ] Auto-create worktrees on ticket assignment
- [ ] Auto-checkout branch on agent start
- [ ] Auto-post worktree location to JIRA
- [ ] Auto-create PR when agent completes work
- [ ] Pre-merge validation checks

### Sprint 3: Optimization (Week 3)
- [ ] Performance metrics for per-agent commits
- [ ] Parallel agent execution with no conflicts
- [ ] Automated dependency resolution
- [ ] Smart merge sequencing
- [ ] Continuous integration with agent workflow

---

## Worktree Configuration Per Agent

### Backend Development Agent (BDA)
```
Path: ../Aurigraph-DLT-bda
Primary Branch: feature/grpc-services
Code Dirs: src/main/java/io/aurigraph/v11/*
Build: ./mvnw clean package -DskipTests
Test: ./mvnw test
Performance: ./mvnw test -Dtest=LoadTest
```

### Frontend Development Agent (FDA)
```
Path: ../Aurigraph-DLT-fda
Primary Branch: feature/portal-enhancement
Code Dirs: enterprise-portal/frontend/src/*
Build: npm run build
Test: npm run test
Performance: npm run test:performance
```

### Security & Crypto Agent (SCA)
```
Path: ../Aurigraph-DLT-sca
Primary Branch: feature/quantum-crypto
Code Dirs: src/main/java/io/aurigraph/v11/crypto/*
Build: ./mvnw clean package
Security Tests: ./mvnw verify -Pnative
Audit: sonarqube scan
```

### Quality Assurance Agent (QAA)
```
Path: ../Aurigraph-DLT-qaa
Primary Branch: feature/test-coverage
Code Dirs: tests/**/*
Test Command: ./mvnw clean verify
Coverage Target: 95%+
Report: target/site/jacoco/
```

### DevOps & Deployment Agent (DDA)
```
Path: ../Aurigraph-DLT-dda
Primary Branch: feature/ci-cd-pipeline
Code Dirs: .github/workflows/*, deployment/*, docker/*
Build: docker build -t aurigraph:latest .
Deploy: kubectl apply -f deployment/
Monitor: curl -s http://localhost:9003/q/health
```

---

## Git Workflow with Integration

### For Each Agent Task

**Step 1: Task Assignment (Automatic)**
```bash
# PMA receives JIRA ticket
# Auto-detects: Backend/gRPC
# Creates worktree
agent-worktree-manager.sh bda feature/bda/grpc-services
```

**Step 2: Agent Begins Work**
```bash
cd ../Aurigraph-DLT-bda
git status  # Already on feature/bda/grpc-services
# Make changes...
```

**Step 3: Commit Per Feature**
```bash
git add .
git commit -m "feat(grpc): Add transaction service proto definitions"
```

**Step 4: Push Feature Branch**
```bash
git push origin feature/bda/grpc-services
```

**Step 5: Auto-Create PR**
```bash
gh pr create --title "Backend: gRPC Protocol Buffers" \
  --body "Implements gRPC service definitions for V11 platform"
```

**Step 6: Review & Merge**
```bash
# CAA/PMA reviews PR
# Automatic tests run on feature branch
# Merge to main after approval
git merge --squash feature/bda/grpc-services
```

---

## Expected Outcomes

### Development Velocity
- **Before**: ~5 features/week (sequential agent work)
- **After**: ~15-20 features/week (true parallelism)
- **Improvement**: 3-4x faster development cycle

### Code Quality
- **Before**: ~1 merge conflict per day
- **After**: ~0-1 merge conflicts per week (feature isolation)
- **Improvement**: Cleaner history, fewer surprises

### Deployment Confidence
- **Before**: Complex multi-step integration testing
- **After**: Per-agent feature branches, atomic merging
- **Improvement**: Faster, safer deployments

---

## Compatibility

### With Existing Systems
✅ Fully compatible with:
- JIRA integration (enhanced)
- GitHub Actions CI/CD (per-branch)
- Kubernetes deployments (feature flags)
- Monitoring and alerting (per-agent)
- Documentation workflow (parallel)

### With Agent Framework
✅ Enhances:
- Agent autonomy (isolated environment)
- Parallel execution (true parallelism)
- Task completion tracking (per-branch commit tracking)
- Quality metrics (per-agent code review)
- Knowledge transfer (clear branch history)

---

## Migration Path

### Phase 1: Opt-in (2025-11-15 to 2025-11-30)
- Agents can optionally use worktrees
- Existing workflow continues to work
- Worktrees documented and available

### Phase 2: Default (2025-12-01 to 2025-12-15)
- New agents automatically provisioned with worktrees
- Existing agents migrate to worktree workflow
- JIRA integration fully automated

### Phase 3: Mandatory (2025-12-16+)
- All agent development happens via worktrees
- Single-branch workflow deprecated
- Agent framework defaults to worktree provisioning

---

## Success Metrics

### Adoption
- [ ] 100% of agents using worktrees by 2025-12-31
- [ ] <5 merge conflicts per week across all agents
- [ ] <1 hour average PR review time

### Performance
- [ ] 3x faster feature delivery
- [ ] 50% reduction in deployment time
- [ ] 95%+ test coverage maintained

### Quality
- [ ] Zero data loss due to branch conflicts
- [ ] All agents working in parallel
- [ ] Clear commit history for all features

---

## Files to Create/Modify

### New Files
1. `scripts/agent-worktree-manager.sh` - Worktree provisioning
2. `scripts/agent-worktree-config.json` - Agent-to-worktree mapping
3. `.github/workflows/agent-worktree-sync.yml` - Auto-sync workflow

### Modified Files
1. `agent-executor.js` - Add worktree provisioning
2. `execute-sprints-multi-agent.js` - Track worktrees
3. `AURIGRAPH-TEAM-AGENTS.md` - Document integration
4. `GIT-WORKTREES-GUIDE.md` - Extend with agent-specific details

---

## Conclusion

Integrating Git worktrees into the Agent Framework will transform Aurigraph development from sequential agent coordination to **true parallel autonomous execution**. Each agent gets its own workspace, feature branch, and development environment, enabling faster iteration and higher quality deliverables.

**Recommended Timeline**: Begin Phase 1 integration immediately (next sprint).

---

**Document**: Agent Framework + Git Worktrees Integration Plan
**Created**: 2025-11-12 15:45 UTC
**Status**: Ready for Implementation
**Next Step**: Create worktree provisioning scripts and update agent-executor.js
