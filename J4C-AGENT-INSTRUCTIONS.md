# J4C Agent Instructions (Claude Code)

**Last Updated**: November 1, 2025
**Agent Framework**: J4C (Intelligent Autonomous Code Agent)

---

## Memorized Agent Instructions

These instructions are hardcoded into the J4C agent for Aurigraph-DLT project.

### Core Instructions (#memorize tags)

1. **Release Tracking** (#memorize)
   - Show release number at start of every session
   - Compare versions for every build
   - Create release notes for every commit
   - Mark changes clearly in release notes

2. **Deployment Status** (#memorize)
   - Show docker deployment status at end of every 'build and deploy' command
   - Display all 10 containers and their health status
   - Report on PostgreSQL, validators, business nodes, slim node, NGINX, Grafana, Prometheus

3. **Version Management** (#memorize)
   - Aurigraph V11 format: v11.MAJOR.MINOR.PATCH (currently v11.4.4)
   - Enterprise Portal format: vMAJOR.MINOR.PATCH (currently v4.4.0)
   - Update version numbers when releasing
   - Track in RELEASE-TRACKING.md and RELEASE-NOTES.md

---

## Session Startup Protocol

At the beginning of every session, the J4C agent must:

```bash
# 1. Display Current Versions
🚀 RELEASE VERSION CHECK
========================
Aurigraph V11 Core: v11.4.4
Enterprise Portal:   v4.4.0
Last Release: November 1, 2025
Commit: 9bbe8f49

# 2. Check Git Status
git status
git log --oneline -5

# 3. Load Release Files
cat RELEASE-TRACKING.md | head -50
cat RELEASE-NOTES.md | head -50

# 4. Display Memorized Instructions
✅ Memorized Instructions Active:
  • Release tracking (versions at session start)
  • Version comparison (for every build)
  • Release notes (for every commit)
  • Change marking (clearly in release notes)
  • Docker deployment status (at end of builds)
```

---

## Build & Deploy Workflow

### Before Build
1. Display current version numbers
2. Note any pending version changes
3. Load RELEASE-TRACKING.md
4. Check git log for recent commits

### During Build
1. Perform all development tasks
2. Document changes incrementally
3. Update code and tests
4. Create git commits with version info

### After Build/Deploy
1. Update RELEASE-NOTES.md with new entry
2. Run docker-compose deployment
3. Display docker deployment status:
   ```
   📦 DOCKER DEPLOYMENT STATUS
   ==================================
   [docker-compose ps output]

   ✅ Container Status Summary
   - PostgreSQL primary: ✅ healthy
   - Validators (3x): ✅ running
   - Business nodes (2x): ✅ running
   - Slim node (1x): ✅ running
   - NGINX LB: ✅ active
   - Grafana: ✅ running
   - Prometheus: ✅ running
   ```
4. Mark docker status at end of deployment commands

---

## Release Notes Format (Template)

```markdown
## [vX.X.X] - YYYY-MM-DD

**Commit Hash**: [hash]
**Release Date**: [date]
**Previous Version**: vX.X.X

### Summary
[Brief description]

### Features Added
- ✅ Feature 1
- ✅ Feature 2

### Bug Fixes
- ✅ Fix 1

### Infrastructure Changes
- ✅ Change 1

### Performance Metrics
- Metric: Value

### Files Changed
**Added**: [files]
**Modified**: [files]

### Deployment Status
- ✅ 10/10 containers operational

### Next Steps
- [ ] Task 1
```

---

## Git Commit Message Format

Every commit must include version information:

```
[version-tag] Brief description

## Changes
- Change 1
- Change 2

## Files Modified
- file1.java
- file2.ts

## Version
- From: vX.X.X
- To: vX.X.X
```

Examples:
```
release: Aurigraph V11.4.4 & Enterprise Portal v4.4.0

## Version Bumps
• Aurigraph V11 Core: v11.3.0 → v11.4.4
• Enterprise Portal: v4.3.2 → v4.4.0
```

---

## File Management

### Primary Tracking Files
- **RELEASE-TRACKING.md** - Version history and templates
- **RELEASE-NOTES.md** - Detailed changelog by release

### Update Schedule
- **RELEASE-TRACKING.md**: Update at session start
- **RELEASE-NOTES.md**: Update with every commit
- **git log**: Commit with version info

---

## Performance Metrics to Track

Track these metrics in every release:

### Blockchain Performance
- TPS (Transactions Per Second): Target 3.0M+
- Latency (P99, P95, P50): Target P99 <100ms
- Memory usage: Target <256MB native
- Startup time: Target <1s

### ML Accuracy
- MLLoadBalancer: Target 96%+
- PredictiveOrdering: Target 95%+
- Overall: Track in RELEASE-NOTES

### Docker Infrastructure
- Total containers: 10
- Database health: PostgreSQL
- Validator nodes: 3x running
- Business nodes: 2x running
- Monitoring: Grafana + Prometheus

---

## Version Numbering Guide

### Aurigraph V11 Core (v11.X.X.X)
- **v11**: Core platform version (fixed)
- **4** (MAJOR): Breaking changes, major features
- **4** (MINOR): New features, optimizations
- **3** (PATCH): Bug fixes, small improvements

Current: **v11.4.4**

### Enterprise Portal (vX.X.X)
- **4** (MAJOR): UI overhaul, major features
- **4** (MINOR): New pages, features
- **0** (PATCH): Bug fixes, styling

Current: **v4.4.0**

---

## Agent Decision Rules

The J4C agent should:

1. **Always check versions first** - Load RELEASE-TRACKING.md at session start
2. **Document changes immediately** - Update RELEASE-NOTES.md after each commit
3. **Show deployment status** - Display docker-compose output after every deployment
4. **Mark version changes** - Include in commit messages and release notes
5. **Maintain consistency** - Use the same format for all releases

---

## Docker Deployment Checklist

After every 'build and deploy' command, verify:

- [ ] PostgreSQL primary database healthy
- [ ] 3x Validator nodes running (ports 9003, 9103, 9203)
- [ ] 2x Business nodes running (ports 9009, 9109)
- [ ] 1x Slim node running (port 9013)
- [ ] NGINX load balancer active (ports 80, 443, 9000)
- [ ] Grafana metrics dashboard running (port 3000)
- [ ] Prometheus metrics collection running (port 9090)
- [ ] All health checks passing or known issues documented
- [ ] Zero-downtime deployment achieved (if applicable)

---

## Critical Paths

### Session Start
```
1. Display versions from RELEASE-TRACKING.md
2. Load RELEASE-NOTES.md latest entry
3. Check git status
4. Display memorized instructions
```

### Build/Commit Workflow
```
1. Perform development work
2. Create git commit with version info
3. Update RELEASE-NOTES.md
4. Push to origin main
5. Show docker deployment status
```

### Deployment
```
1. Execute docker-compose up/restart
2. Wait for all services healthy
3. Display docker deployment status
4. Document in RELEASE-NOTES.md
5. Mark version change (if applicable)
```

---

## Instructions for Future Sessions

**Session N+1 Start**:
1. Read this file (J4C-AGENT-INSTRUCTIONS.md)
2. Load RELEASE-TRACKING.md
3. Display current version numbers (v11.4.4 & v4.4.0)
4. Compare with previous session's versions
5. Check git log for new commits
6. Load RELEASE-NOTES.md and read latest entry
7. Continue with assigned tasks

**Session N+2 Start**:
1. Same process as Session N+1
2. Note any version changes since Session N+1
3. Document in RELEASE-NOTES.md if versions changed

---

## Integration with J4C Framework

This instruction set works within the J4C (Claude Code) agent framework:

- **Agent Type**: General-purpose autonomous code agent
- **Task Model**: Multi-step task execution with progress tracking
- **File Operations**: Read, Write, Edit tools for version tracking
- **Bash Operations**: Git commands for version management
- **Output Style**: Display version numbers and docker status in standard format

The agent will:
1. Proactively display release information
2. Automatically update tracking files
3. Show docker status after deployments
4. Create comprehensive release notes
5. Maintain version consistency across sessions

---

## Success Criteria

The J4C agent successfully implements these instructions when:

✅ Version numbers displayed at session start
✅ RELEASE-TRACKING.md and RELEASE-NOTES.md maintained
✅ Docker status shown after every deployment command
✅ Changes marked clearly in release notes
✅ Git commits include version information
✅ Release versions tracked consistently
✅ Deployment checklist items verified

---

**Last Updated**: November 1, 2025
**Framework**: J4C (Claude Code Agent)
**Status**: Active & Memorized ✅

