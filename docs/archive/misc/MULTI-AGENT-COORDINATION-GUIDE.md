# Multi-Agent Coordination Guide with Git Worktrees

**Last Updated:** November 17, 2025
**Framework:** Git Worktrees + Claude Code Agents
**Status:** Ready for Parallel Development

---

## Overview

This guide explains how to coordinate multiple Claude Code agents working in parallel on different features using Git worktrees. The current setup supports 20+ concurrent agent workstreams.

---

## Current Worktree Structure

### Group 1: gRPC Service Implementation (agents 1.1-1.5)

```
agent-1.1: feature/1.1-rest-grpc-bridge
  └─ Focus: REST ↔ gRPC protocol bridge
  └─ Commit: 95e83435
  └─ Status: In progress
  └─ Files: src/main/java/io/aurigraph/v11/bridge/*

agent-1.2: feature/1.2-consensus-grpc
  └─ Focus: HyperRAFT++ consensus gRPC services
  └─ Commit: 4ebe353c
  └─ Status: In progress
  └─ Files: src/main/java/io/aurigraph/v11/consensus/*

agent-1.3: feature/1.3-contract-grpc
  └─ Focus: Smart contract gRPC interfaces
  └─ Commit: 412eb312
  └─ Status: In progress
  └─ Files: src/main/java/io/aurigraph/v11/contracts/*

agent-1.4: feature/1.4-crypto-grpc
  └─ Focus: Quantum crypto gRPC services
  └─ Commit: 412eb312
  └─ Status: In progress
  └─ Files: src/main/java/io/aurigraph/v11/crypto/*

agent-1.5: feature/1.5-storage-grpc
  └─ Focus: Storage and state management gRPC
  └─ Commit: 412eb312
  └─ Status: In progress
  └─ Files: src/main/java/io/aurigraph/v11/storage/*
```

### Group 2: Advanced Features (agents 2.1-2.6)

```
agent-2.1: feature/2.1-traceability-grpc
  └─ Focus: Supply chain traceability gRPC
  └─ Commit: 412eb312
  └─ Status: In progress

agent-2.2: feature/2.2-secondary-token
  └─ Focus: Secondary token standards (ERC-20, etc.)
  └─ Commit: 35007b11
  └─ Status: In progress

agent-2.3: feature/2.3-composite-creation
  └─ Focus: Composite asset creation
  └─ Commit: 35007b11
  └─ Status: In progress

agent-2.4: feature/2.4-contract-binding
  └─ Focus: Contract binding and orchestration
  └─ Commit: 35007b11
  └─ Status: In progress

agent-2.5: feature/2.5-merkle-registry
  └─ Focus: Merkle tree-based asset registry
  └─ Commit: 35007b11
  └─ Status: In progress

agent-2.6: feature/2.6-portal-integration
  └─ Focus: Enterprise portal integration
  └─ Commit: 35007b11
  └─ Status: In progress
```

### Specialized Workstreams

```
agent-db: Database & Persistence
  └─ Focus: PostgreSQL schema, migrations, Panache ORM
  └─ Status: Detached (834f63da)
  └─ Files: src/main/java/io/aurigraph/v11/persistence/*

agent-frontend: React Portal UI
  └─ Focus: Enterprise portal React components
  └─ Status: Detached (8ba82231)
  └─ Files: enterprise-portal/enterprise-portal/frontend/src/*

agent-tests: Test Suite & Coverage
  └─ Focus: Unit, integration, E2E tests
  └─ Status: Detached (f8ae3ed3)
  └─ Files: src/test/java/*, src/test/resources/*

agent-ws: WebSocket & Real-time
  └─ Focus: WebSocket support for live updates
  └─ Status: Detached (3420cee6)
  └─ Files: src/main/java/io/aurigraph/v11/websocket/*
```

### Temporary Build Agents

```
feature/blockchain-service-grpc (ca98055a)
  └─ Focus: Blockchain service gRPC stubs
  └─ Location: /private/tmp/agent-blockchain-service

feature/consensus-service-grpc (b4ca837a)
  └─ Focus: Consensus service implementation
  └─ Location: /private/tmp/agent-consensus-service

feature/network-service-grpc (b8aac8ad)
  └─ Focus: Network service gRPC
  └─ Location: /private/tmp/agent-network-service

feature/transaction-service-grpc (e10dc6ac)
  └─ Focus: Transaction service gRPC
  └─ Location: /private/tmp/agent-transaction-service
```

---

## Coordination Strategy

### 1. Task Allocation by Worktree

Each agent works in isolation within its worktree, preventing conflicts:

| Agent | Responsibility | Ownership |
|-------|----------------|-----------|
| 1.1 | REST ↔ gRPC bridge | @agent-protocol-bridge |
| 1.2 | Consensus gRPC | @agent-consensus |
| 1.3 | Contract interfaces | @agent-contracts |
| 1.4 | Crypto services | @agent-crypto |
| 1.5 | Storage gRPC | @agent-storage |
| 2.1 | Traceability | @agent-traceability |
| 2.2 | Secondary tokens | @agent-tokens |
| 2.3 | Composite assets | @agent-composite |
| 2.4 | Contract orchestration | @agent-orchestration |
| 2.5 | Merkle registry | @agent-merkle |
| 2.6 | Portal integration | @agent-portal-sync |
| db | Database layer | @agent-persistence |
| tests | Testing framework | @agent-qa |
| frontend | React UI | @agent-ui |
| ws | WebSocket transport | @agent-realtime |

### 2. Code Integration Strategy

**Branch Structure:**
```
main (production)
├── feature/1.1-rest-grpc-bridge
├── feature/1.2-consensus-grpc
├── feature/1.3-contract-grpc
├── feature/1.4-crypto-grpc
├── feature/1.5-storage-grpc
├── feature/2.1-traceability-grpc
├── feature/2.2-secondary-token
├── feature/2.3-composite-creation
├── feature/2.4-contract-binding
├── feature/2.5-merkle-registry
├── feature/2.6-portal-integration
├── feature/database-improvements
├── feature/test-coverage-expansion
├── feature/monitoring-dashboards
└── feature/performance-optimization
```

### 3. Communication & Synchronization

**Daily Standup Tasks (Recommended):**
```bash
# Get status of all agents
for agent in agent-{1.1,1.2,1.3,1.4,1.5,2.1,2.2,2.3,2.4,2.5,2.6,db,frontend,tests,ws}; do
  if [ -d "worktrees/$agent" ]; then
    echo "=== $agent ==="
    cd worktrees/$agent && git log --oneline -1 && cd ../..
  fi
done

# Check for conflicts
git diff main..feature/1.1-rest-grpc-bridge -- src/
git diff main..feature/1.2-consensus-grpc -- src/
# ... repeat for other branches
```

**Integration Checkpoint (Weekly):**
```bash
# Merge strategy - test integrations before merging
git checkout main
for branch in feature/{1.1,1.2,1.3,1.4,1.5}-*; do
  git merge --no-ff $branch -m "Integrate $branch"
done
```

### 4. Conflict Resolution

**Prevention:**
- Each agent owns specific package namespace (`io.aurigraph.v11.<service>`)
- No overlapping file modifications
- Use dependency injection for service coupling

**Resolution if conflicts occur:**
1. Identify conflicting agents
2. Compare commits: `git diff <agent-a-commit> <agent-b-commit>`
3. Create integration branch
4. Coordinate through pull requests

---

## Setting Up New Agent Tasks

### Option A: Using Existing Worktrees

```bash
# Switch to an agent's worktree
cd /Users/subbujois/subbuworkingdir/Aurigraph-DLT/worktrees/agent-1.1
git status
git log --oneline -5

# Start work
git checkout feature/1.1-rest-grpc-bridge
# ... make changes ...
git add .
git commit -m "feat(rest-grpc): <description>"
```

### Option B: Creating New Worktree

```bash
# Create for new feature
cd /Users/subbujois/subbuworkingdir/Aurigraph-DLT
git worktree add -b feature/ai-optimization worktrees/agent-ai
cd worktrees/agent-ai

# OR create from existing feature branch
git worktree add -b feature/v11-native-image worktrees/agent-native main
cd worktrees/agent-native
```

### Option C: For Multi-Session Continuation

**Save agent context between sessions:**
```bash
# In agent's worktree, create state file
cat > .claude-agent-context.md <<'EOF'
# Agent 1.1 Context

## Current Task
Implementing REST ↔ gRPC bridge

## In Progress
- [ ] Protocol buffer definitions for bridge service
- [ ] REST endpoint wrapper implementations
- [ ] gRPC client integration tests
- [ ] Error handling and timeout management

## Completed
- [x] Service interface design
- [x] Maven dependency setup

## Blockers
None

## Notes
- Coordinate with Agent 1.2 for consensus service stubs
- Test with Agent 1.3's contract interfaces
EOF

git add .claude-agent-context.md
git commit -m "docs(agent-1.1): Context checkpoint for next session"
```

---

## Parallel Execution Workflow

### Phase 1: Feature Development (Weeks 1-2)
All agents work in parallel:

```
Time    Agent 1.1    Agent 1.2    Agent 1.3    Agent 1.4    Agent 1.5
Day 1   [Design]     [Design]     [Design]     [Design]     [Design]
Day 2   [Impl]       [Impl]       [Impl]       [Impl]       [Impl]
Day 3   [Testing]    [Testing]    [Testing]    [Testing]    [Testing]
Day 4   [PR prep]    [PR prep]    [PR prep]    [PR prep]    [PR prep]
```

### Phase 2: Integration Testing (Week 3)
```
Integration CI/CD:
1. All features must have passing tests in isolation
2. Merge to integration branch one by one
3. Run full test suite at each integration point
4. Fix any compatibility issues
5. Create release candidate PR to main
```

### Phase 3: Performance Validation (Week 4)
```
Performance Testing:
- Run benchmarks with all features integrated
- Target metrics:
  * Throughput: 776K+ TPS (baseline) → 2M+ TPS (target)
  * Latency: <100ms p99 finality
  * Memory: <256MB (native) / <512MB (JVM)
```

---

## Merging Strategy

### PR Review Checklist for Each Agent

Before merging feature branch to main:

```markdown
## PR Checklist

- [ ] All tests passing (100% in feature, ≥95% overall)
- [ ] Code review completed by 2 team members
- [ ] No conflicts with main branch
- [ ] No conflicts with other active features
- [ ] Performance metrics acceptable
- [ ] Documentation updated
- [ ] Commit messages clear and descriptive
- [ ] Security review passed (if applicable)

## Integration Testing

- [ ] Feature tested in isolation
- [ ] Feature tested with Agent N integration (if dependencies)
- [ ] Regression tests passing
- [ ] Load tests passing (if performance-critical)
```

### Merge Commands

```bash
# From main branch
git pull origin main

# Option 1: Squash merge (cleaner history)
git merge --squash feature/1.1-rest-grpc-bridge
git commit -m "feat: REST ↔ gRPC bridge implementation"

# Option 2: No-fast-forward merge (preserves history)
git merge --no-ff feature/1.1-rest-grpc-bridge \
  -m "Merge feature/1.1-rest-grpc-bridge into main"

# Push to remote
git push origin main
```

---

## Agent Communication Protocol

### Status Format

Each agent should provide weekly status in format:

```markdown
## Agent 1.1 Status (Week of Nov 17)

**Branch:** feature/1.1-rest-grpc-bridge
**Commit:** 95e83435

### Completed
- ✅ Protocol buffer definitions for bridge service
- ✅ Maven module setup with protobuf compiler

### In Progress
- 🚧 REST endpoint wrapper implementations
- 🚧 Error handling layer

### Blockers
- ⚠️ Awaiting Agent 1.2 consensus service stubs (needed for integration)

### Next Week
- Complete endpoint implementations
- Write integration tests
- Prepare PR for main merge

### Dependencies
- Depends on: Agent 1.2, 1.3, 1.4
- Blocks: Agent 2.1, 2.2
```

---

## Troubleshooting

### Issue: Merge Conflicts

```bash
# In your worktree
git fetch origin
git rebase origin/main

# If conflicts:
git status  # See conflicted files
# Edit files to resolve conflicts
git add <resolved-files>
git rebase --continue
```

### Issue: Another Agent's Changes Needed

```bash
# Option 1: Cherry-pick specific commits
git cherry-pick <commit-hash-from-other-agent>

# Option 2: Merge their feature branch
git merge feature/1.2-consensus-grpc

# Option 3: Wait for them to merge to main, then rebase
git fetch origin
git rebase origin/main
```

### Issue: Stale Worktree

```bash
# Update to latest main
cd worktrees/agent-X
git fetch origin
git rebase origin/main

# If major changes, create new worktree
git worktree remove worktrees/agent-X
git worktree add -b feature/X worktrees/agent-X origin/main
```

---

## Performance Monitoring

### Track Agent Productivity

```bash
# Lines of code added per agent
for agent in agent-{1.1,1.2,1.3,1.4,1.5}; do
  echo "=== $agent ==="
  cd worktrees/$agent
  git diff main..HEAD --stat
  cd ../..
done

# Commit frequency
for agent in agent-{1.1,1.2,1.3,1.4,1.5}; do
  echo "=== $agent ==="
  cd worktrees/$agent
  git log main..HEAD --oneline | wc -l
  cd ../..
done
```

---

## Next Steps

1. **Assign agents to current priority tasks**
   - Agent 1.1: Complete REST ↔ gRPC bridge
   - Agent 1.2: Implement consensus gRPC
   - Agent db: Fix compilation errors in DeFi models

2. **Weekly sync meetings**
   - Monday: Sprint planning
   - Wednesday: Blocker resolution
   - Friday: Demo & integration testing

3. **Integration schedule**
   - Week 1: Individual feature completion
   - Week 2: Pairwise integration testing
   - Week 3: Full stack integration
   - Week 4: Performance validation & main merge

---

## Quick Reference Commands

```bash
# List all worktrees with status
git worktree list

# Add new agent worktree
git worktree add -b feature/name worktrees/agent-name

# Remove completed agent
git worktree remove worktrees/agent-old

# Check branch status
git branch -v

# Sync all agents with main
for agent in agent-{1.1,1.2,1.3,1.4,1.5}; do
  cd worktrees/$agent && git rebase origin/main && cd ../..
done

# Create integration branch for testing
git checkout -b integration-week3
git merge feature/1.1-rest-grpc-bridge
git merge feature/1.2-consensus-grpc
# ... continue with other branches

# Run tests on integration branch
mvn clean test -Pintegration
```

---

**Ready to coordinate multiple agents! Which workstreams would you like to prioritize?**
