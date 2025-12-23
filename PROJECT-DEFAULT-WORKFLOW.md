# Aurigraph-DLT Default Workflow

**Default Development Mode**: Multi-Agent J4C Execution with Git Worktrees

This document defines the standard operating procedure for all development on Aurigraph-DLT.

---

## 🎯 Default Setup

### On Project Open
The multi-agent framework **automatically initializes**:
1. Detects 15 agent worktrees
2. Generates context files
3. Syncs Git branches
4. Updates documentation
5. Ready for parallel development

### Configuration Location
- **Main Config**: `.agent/config.yml`
- **Auto-Init Script**: `.agent/auto-init.sh`
- **Documentation**: `.agent/README.md`

---

## 👥 Standard Agent Assignment

### Always Available Agents (15)

#### Series 1: gRPC Infrastructure
| Agent | Branch | Focus Area |
|-------|--------|-----------|
| agent-1.1 | feature/1.1-rest-grpc-bridge | REST-to-gRPC Bridge |
| agent-1.2 | feature/1.2-consensus-grpc | Consensus Services |
| agent-1.3 | feature/1.3-contract-grpc | Smart Contracts |
| agent-1.4 | feature/1.4-crypto-grpc | Cryptography |
| agent-1.5 | feature/1.5-storage-grpc | Storage Layer |

#### Series 2: Advanced Features
| Agent | Branch | Focus Area |
|-------|--------|-----------|
| agent-2.1 | feature/2.1-traceability-grpc | Traceability |
| agent-2.2 | feature/2.2-secondary-token | Token Features |
| agent-2.3 | feature/2.3-composite-creation | Composite Tokens |
| agent-2.4 | feature/2.4-contract-binding | Orchestration |
| agent-2.5 | feature/2.5-merkle-registry | Merkle Trees |
| agent-2.6 | feature/2.6-portal-integration | Portal Integration |

#### Infrastructure
| Agent | Branch | Focus Area |
|-------|--------|-----------|
| agent-db | detached | Database & Migrations |
| agent-frontend | detached | Enterprise Portal UI |
| agent-tests | detached | Test Suite |
| agent-ws | detached | WebSocket Services |

---

## 📋 Daily Workflow (Standard)

### Morning (Start of Work)
```bash
# Auto-sync happens on project open
# Or manually:
./.agent/auto-init.sh

# Check agent status
cat MULTI-AGENT-EXECUTION-STATUS.md
```

### During Development
```bash
# Work in any agent worktree
cd worktrees/agent-1.1

# Read your assignment
cat .claude-agent-context.md

# Develop, build, test
cd aurigraph-av10-7/aurigraph-v11-standalone
./mvnw clean package
./mvnw test

# Commit to feature branch
git add .
git commit -m "feat(1.1): description"
git push origin feature/1.1-rest-grpc-bridge
```

### End of Day
```bash
# Push all changes made
git push origin $(git branch --show-current)

# CI/CD automatically runs tests
```

---

## 🔄 Integration Process (Standard)

### Weekly Integration
1. All agents push to feature branches daily
2. Orchestrator merges to `integration` branch
3. Full test suite runs
4. If passing, merge to `main`
5. Deploy to production

### Commands
```bash
# Create integration branch (orchestrator)
git checkout -b integration/week-$(date +%U)

# Merge feature branches
git merge origin/feature/1.1-rest-grpc-bridge
# ... repeat for all agents

# Test
./mvnw verify

# If tests pass
git checkout main
git merge integration/week-$(date +%U)
git push origin main
```

---

## 🧪 Testing Standards (Default)

### Per-Agent Testing
```bash
# Before commit
./mvnw test

# Coverage required
./mvnw jacoco:report
# Minimum: 80% coverage
```

### Integration Testing
```bash
# Full suite
./mvnw verify

# Performance benchmarks
./mvnw test -Pperformance
```

### CI/CD Pipeline
- Triggers on all feature branch pushes
- Required checks: build, test, quality, security
- Merge blocked if any check fails

---

## 📊 Monitoring & Reporting (Default)

### Agent Status Dashboard
```bash
# Quick status
./run-multi-agents.sh

# Detailed status
cat MULTI-AGENT-EXECUTION-STATUS.md
```

### Progress Tracking
- Each agent updates their section in status doc
- Daily standup notes in `.claude-agent-context.md`
- Integration progress in AGENT-ASSIGNMENT-PLAN

---

## 🔧 Customization

### To Add New Agent
1. Create worktree: `git worktree add -b feature/new worktrees/agent-new`
2. Update `.agent/config.yml`
3. Run: `./run-multi-agents.sh`

### To Modify Agent Assignment
1. Edit `.agent/config.yml`
2. Update task assignments
3. Re-run initialization

---

## 📚 Documentation Standards (Default)

### Always Up-to-Date
- `MULTI-AGENT-EXECUTION-STATUS.md` - Auto-updated
- `AGENT-EXECUTION-DEMO.md` - Examples
- `.claude-agent-context.md` (per agent) - Quick reference

### Weekly Updates
- `AGENT-ASSIGNMENT-PLAN-SPRINT-14.md` - Sprint planning
- `MULTI-AGENT-COORDINATION-GUIDE.md` - Process docs

---

## ✅ Success Criteria (Default)

### Per Agent
- [ ] Context file exists
- [ ] Can build independently
- [ ] Tests pass locally
- [ ] No uncommitted changes at EOD
- [ ] Feature branch up-to-date

### Per Sprint
- [ ] All agents delivered assigned features
- [ ] Integration tests pass
- [ ] Code coverage ≥ 80%
- [ ] Performance benchmarks met
- [ ] Documentation updated

---

## �� Troubleshooting (Common)

### "Agent not initialized"
```bash
./run-multi-agents.sh
```

### "Merge conflict"
```bash
cd worktrees/agent-X.X
git fetch origin
git rebase origin/main
# Resolve conflicts
git push origin feature/X.X-description --force-with-lease
```

### "Build fails in agent"
```bash
cd worktrees/agent-X.X/aurigraph-av10-7/aurigraph-v11-standalone
./mvnw clean install -DskipTests
./mvnw test  # Run single test
```

---

## 📞 Support

### Quick Help
```bash
# View configuration
cat .agent/config.yml

# Read agent docs
cat .agent/README.md

# Check examples
cat AGENT-EXECUTION-DEMO.md
```

### Full Documentation
- Multi-Agent Setup Guide
- Agent Quickstart Guide
- Coordination Guide

---

**This is the standard, default workflow for all Aurigraph-DLT development.**

Last Updated: November 24, 2025

