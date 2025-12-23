# Multi-Agent Setup Guide - Implementation of Options 1-3

**Date**: November 17, 2025
**Status**: Ready for Implementation
**Framework**: 15+ Claude agents with Git worktrees + GitHub Actions CI/CD

---

## Overview

This guide implements all three multi-agent coordination options for parallel V11 development:

1. **Option 1**: Agent Assignment Plan (Sprint-based task allocation)
2. **Option 2**: Initialization Scripts (Automated environment setup)
3. **Option 3**: CI/CD Pipeline (GitHub Actions for automated testing)

Together, these create a complete framework for coordinating 15+ agents working in parallel on V11 features.

---

## Option 1: Agent Assignment Plan ✅ IMPLEMENTED

### What It Does
Maps specific V11 features and components to individual agents with clear:
- Task descriptions and objectives
- Dependencies and blocking relationships
- Target completion dates
- Success criteria (Definition of Done)
- Priority levels (P0, P1, P2, P3)

### File Location
**`AGENT-ASSIGNMENT-PLAN-SPRINT-14.md`**

### Structure
```
Agent Assignment Plan (Sprint 14: Nov 17 - Dec 1, 2025)
├── Phase 1: Priority Task Allocation (Current)
│   ├── P0 CRITICAL (V11 Build Stability)
│   │   ├── Agent-1.1: Fix DeFi modules (2 days)
│   │   └── Agent-db: Fix composite/token modules (3 days)
│   ├── P1 HIGH (gRPC Infrastructure)
│   │   ├── Agent-1.2: Consensus gRPC (4 days)
│   │   ├── Agent-1.3: Contract gRPC (4 days)
│   │   ├── Agent-1.4: Crypto gRPC (3 days)
│   │   └── Agent-1.5: Storage gRPC (3 days)
│   ├── P2 MEDIUM (Advanced Features)
│   │   ├── Agent-2.1: Traceability (5 days)
│   │   ├── Agent-2.2: Tokens (4 days)
│   │   ├── Agent-2.3: Composite (4 days)
│   │   ├── Agent-2.4: Orchestration (5 days)
│   │   ├── Agent-2.5: Merkle Registry (3 days)
│   │   └── Agent-2.6: Portal Integration (4 days)
│   └── P3 INFRASTRUCTURE
│       ├── Agent-tests: Test Suite (6 days)
│       ├── Agent-frontend: Portal UI (5 days)
│       └── Agent-ws: WebSocket (3 days)
├── Phase 2: Dependencies & Critical Path
├── Phase 3: Success Metrics
└── Phase 4: Agent Coordination Rules
```

### How to Use

**For Sprint Planning**:
1. Read Phase 1 to see current agent assignments
2. Review critical path in Phase 2 to understand task dependencies
3. Assign agents based on their current availability
4. Update status daily in agent standups

**For New Agents**:
1. Find your agent name in Phase 1
2. Review your assigned tasks with "Action Items" sections
3. Check the "Definition of Done" for success criteria
4. Review dependencies to understand what you need from other agents

**For Sprint Lead**:
1. Track completion status (2-day/3-day/4-day cycles)
2. Monitor critical path for blockers
3. Use Phase 4 coordination rules for daily standups
4. Update success metrics in Phase 3 each day

### Key Metrics
- **Build Stability**: 2-3 days (P0 priority)
- **gRPC Infrastructure**: 3-4 days (P1 priority)
- **Advanced Features**: 4-5 days (P2 priority)
- **Total Sprint Duration**: 13 days (complete by Nov 30)

---

## Option 2: Initialization Scripts ✅ IMPLEMENTED

### What It Does
Automated scripts that:
- Set up development environment for each agent
- Create agent-specific context files
- Initialize git branches and sync with main
- Configure IDE and tooling
- Validate prerequisites (Java, Maven, Git)

### File Location
**`scripts/init-agent-environment.sh`**

### How to Use

**Initialize All Agents**:
```bash
cd /Users/subbujois/subbuworkingdir/Aurigraph-DLT
./scripts/init-agent-environment.sh all
```

**Initialize Single Agent**:
```bash
./scripts/init-agent-environment.sh agent-1.1
```

**Show Agent Status**:
```bash
./scripts/init-agent-environment.sh status
```

**Clean All Agent Workspaces**:
```bash
./scripts/init-agent-environment.sh clean
```

### What Gets Created

For each agent, the script:

1. **Creates `.claude-agent-context.md`** in each worktree with:
   - Agent identification (name, branch, worktree path)
   - Build commands (compile, package, test, dev mode)
   - Git commands (status, diff, commit, push, rebase)
   - Code review checklist
   - Important file references
   - Troubleshooting guide
   - Next steps and contact info

2. **Syncs Git Branches**:
   ```bash
   git fetch origin
   git checkout feature/X.X-description  # or create if doesn't exist
   git pull origin feature/X.X-description
   ```

3. **Validates Prerequisites**:
   - Java 21+ installed
   - Maven or Maven wrapper available
   - Git 2.0+ available

### Example Output

```
✓ Java openjdk version "21.0.1" found
✓ Maven 3.9.5 found
✓ Git 2.43.0 found

========================================
Initializing All Agent Environments
========================================

→ Initializing agent-1.1...
✓ agent-1.1 initialized
→ Initializing agent-1.2...
✓ agent-1.2 initialized
... (continues for all 15 agents)

========================================
Initialization Summary
========================================
Total Agents: 15
✓ Initialized: 15
✓ Failed: 0

========================================
Done!
========================================
Next steps:
1. cd worktrees/<agent-name>
2. Review .claude-agent-context.md
3. Check AGENT-ASSIGNMENT-PLAN-SPRINT-14.md for your task
4. Start development!
```

### Agent Context File Contents

Each `.claude-agent-context.md` file includes:

```markdown
# Claude Agent Context

## Agent Information
- **Name**: agent-1.1
- **Branch**: feature/1.1-rest-grpc-bridge
- **Worktree**: /Users/.../worktrees/agent-1.1
- **Status**: Active
- **Last Synced**: 2025-11-17 14:30:00 UTC

## Current Task
See AGENT-ASSIGNMENT-PLAN-SPRINT-14.md for current sprint assignment.

## Development Setup
### Build Commands
- `./mvnw clean compile` - Fast compile check
- `./mvnw clean package` - Full build
- `./mvnw test` - Run tests

### Dev Mode
- `./mvnw quarkus:dev` - Start dev server with hot reload

### Git Commands
- `git status` - View changes
- `git commit -m "feat: description"` - Commit changes
- `git push origin feature/X.X-description` - Push to remote

## Code Review Checklist
- [ ] Code compiles without errors
- [ ] All tests pass
- [ ] Test coverage ≥80% for new code
- [ ] Follow existing code style
- [ ] Update documentation if APIs changed
- [ ] Commit messages are descriptive

## Important Files
- AGENT-ASSIGNMENT-PLAN-SPRINT-14.md - Sprint assignments
- MULTI-AGENT-COORDINATION-GUIDE.md - Coordination rules
- aurigraph-av10-7/CLAUDE.md - V11 development guide
- ARCHITECTURE.md - System architecture

## Common Issues & Fixes
- Maven Build Issues
- Port Conflicts
- Git Conflicts
- Lombok annotation issues

## Next Steps
1. Review AGENT-ASSIGNMENT-PLAN-SPRINT-14.md for your task
2. Follow development setup instructions
3. Implement assigned feature
4. Run tests and ensure coverage
5. Create PR when complete
```

### Scheduling Agent Initialization

**Day 1 (Sprint Start)**:
```bash
# Initialize all agents at once
./scripts/init-agent-environment.sh all

# Show status
./scripts/init-agent-environment.sh status
```

**Daily (During Sprint)**:
```bash
# Quick status check
./scripts/init-agent-environment.sh status

# Sync a specific agent if needed
cd worktrees/agent-1.1
git fetch origin
git rebase origin/main
```

**When Adding New Agent**:
```bash
./scripts/init-agent-environment.sh agent-new-name
```

---

## Option 3: CI/CD Pipeline ✅ IMPLEMENTED

### What It Does
GitHub Actions workflow that automatically:
- Compiles Java code on every push to feature branches
- Runs unit tests and integration tests
- Validates Protocol Buffers
- Tests frontend code
- Builds Docker images
- Runs performance benchmarks
- Enforces code quality standards
- Creates merge gates
- Generates test reports

### File Location
**`.github/workflows/multi-agent-ci.yml`**

### How It Works

**Trigger Events**:
```yaml
on:
  push:
    branches:
      - feature/1.*  # All Agent 1.x branches
      - feature/2.*  # All Agent 2.x branches
  pull_request:
    branches:
      - main
      - develop
```

**10-Job Pipeline**:
1. **Determine Changes** - Detect which agents are affected
2. **Test V11 Java** - Compile and test Java code
3. **Validate Protobuf** - Check Protocol Buffer definitions
4. **Test Frontend** - Run React portal tests
5. **Build Docker** - Create Docker image (main branch only)
6. **Performance Tests** - Run throughput benchmarks
7. **Integration Tests Matrix** - Test agent combinations
8. **Code Quality** - SonarQube and static analysis
9. **Build Summary** - Generate reports
10. **Merge Gate** - Validate merge requirements

### How to Trigger

**Automatic Triggers**:
```bash
# Push to feature branch → Runs entire CI pipeline
git push origin feature/1.1-rest-grpc-bridge

# Create PR to main → Runs all tests before merge
# Push to main → Also builds Docker image
```

**Manual Trigger** (in GitHub UI):
1. Go to **Actions** tab
2. Select **Multi-Agent Parallel CI/CD Pipeline**
3. Click **Run workflow**
4. Select branch and click **Run**

### Pipeline Jobs

**Job 1: Determine Changes**
```yaml
Detects:
- Java code changes → triggers Java tests
- .proto file changes → triggers proto validation
- Frontend changes → triggers React tests
- All features together → runs integration tests
```

**Job 2: Test V11 Java** (runs if Java changes)
```bash
Steps:
1. Setup Java 21
2. Run: mvnw clean compile
3. Run: mvnw test (unit tests)
4. Run: mvnw verify (integration tests)
5. Generate: jacoco code coverage report
6. Upload: test results + coverage to artifacts
```

**Job 3: Validate Protobuf** (runs if .proto changes)
```bash
Steps:
1. Check proto file syntax
2. Generate Java stubs: mvnw protobuf:compile
3. Compile with stubs: mvnw clean compile
4. Validate no syntax errors
```

**Job 4: Test Frontend** (runs if portal changes)
```bash
Steps:
1. Setup Node 18.x and 20.x
2. Install: npm ci
3. Run: npm run lint
4. Build: npm run build
5. Test: npm test --coverage
6. Upload: coverage reports
```

**Job 5: Build Docker** (runs on main branch push)
```bash
Steps:
1. Setup Docker buildx with QEMU
2. Login to container registry (ghcr.io)
3. Extract version metadata
4. Build: docker build -f Dockerfile.v11
5. Push: ghcr.io/aurigraph/v11:latest
6. Cache: store for faster rebuilds
```

**Job 6: Performance Tests** (runs on PR)
```bash
Steps:
1. Run: mvnw test -Pperformance
2. Collect: TPS, latency, memory metrics
3. Report: results in PR comment
4. Compare: against baseline
```

**Job 7: Integration Tests Matrix** (parallel)
```bash
Runs for each:
- consensus
- contracts
- crypto
- storage
- defi

Each runs:
mvnw test -Pintegration -Dtest=*{agent}*IT
```

**Job 8: Code Quality**
```bash
Runs:
1. SonarQube analysis
2. PMD code smell detection
3. Checkstyle validation
4. SpotBugs security scan
```

**Job 9: Build Summary**
```bash
Generates:
- Status for all jobs
- Links to artifacts
- Test coverage percentages
- Performance metrics
```

**Job 10: Merge Gate Validation**
```yaml
Requires all of:
✓ Java tests passed
✓ Proto validation passed
✓ Frontend tests passed
✓ Integration tests passed

Then allows: Merge to main
```

### Understanding the Workflow Output

**In GitHub Actions Tab**:
```
Multi-Agent Parallel CI/CD Pipeline

✓ determine-changes
✓ test-v11-java (with coverage report)
✓ validate-protobuf
✓ test-frontend (Node 18.x and 20.x)
✓ build-docker (only on main)
✓ performance-tests (only on PR)
✓ integration-tests (5 matrix jobs: consensus, contracts, etc.)
✓ code-quality
✓ build-summary
✓ merge-gate
```

**PR Comments**:
```markdown
## ✅ V11 Java Test Results

- Compilation: ✅ Passed
- Unit Tests: ✅ Passed
- Integration Tests: ✅ Passed
- Test Coverage: 90%+ reported
- Performance: 776K+ TPS validated

## 🚀 Multi-Agent CI/CD Pipeline Complete

### Build Status
- ✅ Java Compilation
- ✅ Protocol Buffers
- ✅ Frontend Build
- ✅ All Tests Passed

### Test Coverage
- Java: 90%+
- Frontend: 85%+

### Next Steps
1. Review artifacts
2. Check code quality reports
3. Verify performance benchmarks
4. Approve and merge
```

**Artifacts Available**:
- `v11-java-test-results/` - JUnit reports + JaCoCo coverage
- `frontend-coverage-18.x/` - React test coverage
- `frontend-coverage-20.x/` - React test coverage (Node 20)
- `integration-tests-*` - Test reports per agent
- `performance-reports/` - TPS and latency metrics

### Configuration Requirements

**GitHub Secrets** (needed for features):
```yaml
SONAR_HOST_URL     # For code quality analysis
SONAR_TOKEN        # For SonarQube integration
GITHUB_TOKEN       # Auto-provided by GitHub
```

**Docker Registry** (optional):
- Pushes to `ghcr.io` (GitHub Container Registry)
- Auto-authenticated with GITHUB_TOKEN
- Alternative: Configure for Docker Hub or private registry

### Customization

**To add a new test type**:
1. Edit `.github/workflows/multi-agent-ci.yml`
2. Add new job under appropriate section
3. Reference test patterns:
   ```yaml
   - name: Run Custom Tests
     run: ./mvnw test -Dtest=*CustomTest
   ```

**To change trigger branches**:
```yaml
on:
  push:
    branches:
      - feature/**  # Match all feature branches
      - main
```

**To require specific reviews**:
```yaml
# In merge-gate job
if: github.event_name == 'pull_request' &&
    env.REQUIRED_REVIEWS >= 2
```

---

## Full Implementation Timeline

### Day 1 (Sprint Start - Nov 17)
```bash
# 1. Read all three plans
cat AGENT-ASSIGNMENT-PLAN-SPRINT-14.md
cat MULTI-AGENT-COORDINATION-GUIDE.md

# 2. Initialize all agents
./scripts/init-agent-environment.sh all

# 3. Show status
./scripts/init-agent-environment.sh status

# 4. Push to trigger CI/CD
git add .github/workflows/multi-agent-ci.yml
git commit -m "feat(ci): Add multi-agent CI/CD pipeline"
git push origin main
```

### Days 2-3 (Agents Begin Work)
```bash
# For each agent:
cd worktrees/agent-1.1
git checkout feature/1.1-rest-grpc-bridge

# Start development
./mvnw quarkus:dev

# When ready to commit
git add .
git commit -m "feat(1.1): <description>"
git push origin feature/1.1-rest-grpc-bridge

# GitHub Actions automatically runs CI/CD pipeline
```

### Days 4-13 (Sprint Progress)
```bash
# Daily standup
./scripts/init-agent-environment.sh status

# Track in AGENT-ASSIGNMENT-PLAN-SPRINT-14.md
# Update each agent's status section

# Create PRs as features complete
# CI/CD automatically validates
# Merge when all checks pass
```

### Day 14 (Sprint Review)
```bash
# Review all deliverables
cat AGENT-ASSIGNMENT-PLAN-SPRINT-14.md
# Check "Deliverables Checklist" section

# Generate final metrics
# Deploy to production (if applicable)
```

---

## Common Operations

### Check Agent Status
```bash
./scripts/init-agent-environment.sh status
```

### Initialize Single Agent
```bash
./scripts/init-agent-environment.sh agent-1.3
```

### View Specific Agent Context
```bash
cat worktrees/agent-1.1/.claude-agent-context.md
```

### Check CI/CD Pipeline Status
Go to **Actions** tab in GitHub repository

### View Test Artifacts
1. Go to **Actions** → **Multi-Agent Parallel CI/CD Pipeline**
2. Click on the workflow run
3. Scroll to **Artifacts** section
4. Download test reports and coverage data

### Force Re-run CI/CD
1. Go to **Actions** tab
2. Select failed workflow
3. Click **Re-run failed jobs** or **Re-run all jobs**

### Fix Compilation Errors Quickly
```bash
cd worktrees/agent-1.1
./mvnw clean compile -DskipTests  # Fast check
./mvnw test -Dtest=YourTest       # Single test
```

### Resolve Merge Conflicts
```bash
cd worktrees/agent-1.1
git fetch origin
git rebase origin/main
# ... resolve conflicts in files ...
git add <resolved-files>
git rebase --continue
git push origin feature/1.1-rest-grpc-bridge --force-with-lease
```

---

## Success Criteria

### Option 1 Implementation: ✅
- [ ] AGENT-ASSIGNMENT-PLAN-SPRINT-14.md created with all agent assignments
- [ ] All 15 agents have clear task descriptions
- [ ] Dependencies identified and documented
- [ ] Success criteria (DoD) defined for each task
- [ ] Critical path calculated (13 days)

### Option 2 Implementation: ✅
- [ ] `scripts/init-agent-environment.sh` created and executable
- [ ] Script handles `all`, `<agent-name>`, `clean`, and `status` modes
- [ ] Context files auto-generated for each agent
- [ ] Prerequisites validation working (Java, Maven, Git)
- [ ] Tested: `./scripts/init-agent-environment.sh all` runs without errors

### Option 3 Implementation: ✅
- [ ] `.github/workflows/multi-agent-ci.yml` created
- [ ] 10-job pipeline defined and documented
- [ ] Triggers: push to feature/* branches and PRs to main
- [ ] Tested: Code push triggers workflow execution
- [ ] PR comments with test results working
- [ ] Artifacts uploaded and accessible
- [ ] Merge gate validation enforced

---

## Troubleshooting

### Script Issues

**"Command not found: ./scripts/init-agent-environment.sh"**
```bash
# Make sure you're in repo root
cd /Users/subbujois/subbuworkingdir/Aurigraph-DLT
chmod +x scripts/init-agent-environment.sh
./scripts/init-agent-environment.sh all
```

**"Java is not installed or not in PATH"**
```bash
# Check Java
java --version

# Set JAVA_HOME if needed
export JAVA_HOME=/opt/homebrew/opt/openjdk@21
export PATH=$JAVA_HOME/bin:$PATH
```

**"Git worktree not found"**
```bash
# Verify worktrees exist
git worktree list

# Create if missing
git worktree add -b feature/1.1-rest-grpc-bridge worktrees/agent-1.1 origin/main
```

### CI/CD Issues

**"GitHub Actions workflow not triggering"**
- Check: Branch name matches `feature/1.*` or `feature/2.*`
- Check: File path is `.github/workflows/multi-agent-ci.yml`
- Check: YAML syntax is valid
- Solution: Commit and push again, or manually trigger in Actions tab

**"Test failures in CI/CD"**
- Check: Same tests pass locally (`./mvnw test`)
- Review: Full test output in GitHub Actions
- Download: Artifacts (test results, coverage reports)
- Compare: Local vs. CI environment
- Solution: Fix locally, commit, push again

**"Merge gate blocking merge"**
- Check: All required job status are "success"
- View: GitHub Actions logs for failed job
- Solution: Fix the failing test/check, push, and retry

---

## Next Steps

1. **Immediate (Day 1)**:
   - ✅ Run initialization script
   - ✅ Review agent assignments
   - ✅ Start CI/CD pipeline

2. **Sprint Start (Days 2-3)**:
   - Each agent reads their context file
   - Review task assignments in AGENT-ASSIGNMENT-PLAN-SPRINT-14.md
   - Begin feature development
   - First PR creation and CI/CD validation

3. **Ongoing (Days 4-13)**:
   - Daily status checks via script
   - Weekly sync meetings
   - Integration checkpoints
   - PR reviews and merges

4. **Sprint End (Day 14)**:
   - Review all deliverables
   - Measure success metrics
   - Plan next sprint

---

## Files Summary

| File | Purpose | Type |
|------|---------|------|
| AGENT-ASSIGNMENT-PLAN-SPRINT-14.md | Agent task allocation | Documentation |
| scripts/init-agent-environment.sh | Setup automation | Bash script |
| .github/workflows/multi-agent-ci.yml | Test automation | GitHub Actions |
| MULTI-AGENT-COORDINATION-GUIDE.md | Coordination rules | Documentation |
| MULTI-AGENT-SETUP-GUIDE.md | This file | Implementation guide |

---

**Status**: Ready for Sprint 14 Execution
**Last Updated**: November 17, 2025
**Sprint Lead**: @agent-coordinator

