# Agent Framework + Git Worktrees - DEFAULT EXECUTION MODEL

**Date**: November 12, 2025
**Status**: ✅ **ACTIVE - DEFAULT FOR ALL PROJECTS**
**Framework Version**: 2.0
**Last Updated**: 2025-11-12

---

## 🎯 Executive Summary

The **J4C Agent Framework with Git Worktrees Integration** is now the **DEFAULT execution model** for all Aurigraph DLT development projects. This document specifies:

1. **Automatic Framework Initialization** - Every new shell session
2. **Daily Reminder System** - Keeps developers engaged with the framework
3. **Persistent State Management** - Framework state across sessions
4. **Default Behavior** - All projects use this model by default
5. **Integration with All Projects** - Seamless across the Aurigraph DLT ecosystem

---

## 📋 Framework Overview

### What is the Agent Framework?

The **J4C Agent Framework** consists of 10 specialized autonomous agents that work in parallel:

| Agent | Code | Role | Primary Responsibility |
|-------|------|------|------------------------|
| **CAA** | Chief Architect | Architecture Lead | System design, technical decisions, oversight |
| **BDA** | Backend Developer | Java/Backend | gRPC services, performance optimization |
| **FDA** | Frontend Developer | React/UI | Portal components, dashboards |
| **SCA** | Security Lead | Crypto/Security | Quantum cryptography, security audit |
| **ADA** | AI Specialist | ML Optimization | Transaction ordering, anomaly detection |
| **IBA** | Integration Lead | Cross-chain | Bridge services, RWA tokenization |
| **QAA** | QA Lead | Testing | Test coverage, performance benchmarks |
| **DDA** | DevOps Lead | CI/CD/Deployment | Docker, Kubernetes, monitoring |
| **DOA** | Documentation Lead | Technical Docs | API docs, architecture docs |
| **PMA** | Project Manager | Coordination | JIRA integration, sprint tracking |

### What are Git Worktrees?

Git worktrees enable **parallel development** with **isolated feature branches**:

- **4 Parallel Worktrees**: Each agent has dedicated workspace
- **Shared Git Object Database**: Efficient storage, no duplication
- **Independent Branches**: No merge conflicts between agents
- **Full Isolation**: Changes in one worktree don't affect others

**Available Worktrees**:
```
Aurigraph-DLT (main branch - coordination)
├── Aurigraph-DLT-grpc (feature/grpc-services)
├── Aurigraph-DLT-perf (feature/performance-optimization)
├── Aurigraph-DLT-tests (feature/test-coverage-expansion)
└── Aurigraph-DLT-monitoring (feature/monitoring-dashboards)
```

---

## 🚀 How It Works

### 1. Automatic Session Initialization

**On every new shell session**, the framework automatically:

1. **Checks state** - Determines if framework is initialized
2. **Creates state files** - Persistent storage in `~/.aurigraph-framework/`
3. **Validates worktrees** - Ensures all 4 worktrees exist
4. **Initializes agents** - Registers all 10 agents
5. **Checks daily reminder** - Displays reminder if not shown today
6. **Exports variables** - Makes framework available to scripts

**Init Script**: `/scripts/agent-framework-session-init.sh`

### 2. Daily Reminder System

**Purpose**: Keep developers aware of the framework's availability and encourage its use.

**How It Works**:
- Tracks last reminder date in `~/.aurigraph-framework/daily-reminder-check`
- Displays banner reminder **once per day**
- Shows available worktrees, agents, and quick commands
- Only displays if framework is configured to show reminders

**Reminder Output**:
```
╔════════════════════════════════════════════════════════════════╗
║                  🚀 AGENT FRAMEWORK REMINDER 🚀               ║
╠════════════════════════════════════════════════════════════════╣
║                                                                ║
║  J4C Agent Framework + Git Worktrees is your default model     ║
║  for parallel development in Aurigraph DLT projects.           ║
║                                                                ║
║  📋 Available Worktrees:                                       ║
║     • Aurigraph-DLT-grpc (feature/grpc-services)               ║
║     • Aurigraph-DLT-perf (feature/performance-optimization)    ║
║     • Aurigraph-DLT-tests (feature/test-coverage-expansion)    ║
║     • Aurigraph-DLT-monitoring (feature/monitoring-dashboards) ║
║                                                                ║
║  🤖 Active Agents: 10 (CAA, BDA, FDA, SCA, ADA, IBA,          ║
║                        QAA, DDA, DOA, PMA)                    ║
║                                                                ║
║  💡 Quick Commands:                                            ║
║     cd ../Aurigraph-DLT-<worktree>   # Switch to worktree     ║
║     git worktree list                # View all worktrees      ║
║     source agent-framework-session-init.sh  # Reinit framework ║
║                                                                ║
║  📚 Documentation: GIT-WORKTREES-GUIDE.md                      ║
║  📚 Integration Plan: AGENT-FRAMEWORK-WORKTREES-INTEGRATION.md ║
║                                                                ║
╚════════════════════════════════════════════════════════════════╝
```

---

## 📁 Framework File Structure

### State Management

```
~/.aurigraph-framework/
├── session-state.json          # Current session state (JSON)
├── daily-reminder-check        # Last reminder date (YYYY-MM-DD)
└── framework.log               # Detailed framework logs
```

### Configuration

```
Aurigraph-DLT/
├── .env.agent-framework        # Framework configuration (KEY=VALUE)
├── scripts/
│   ├── agent-framework-session-init.sh       # Session initialization
│   ├── shell-profile-integration.sh          # Shell profile sourcing
│   └── init-all-projects.sh               # Project initialization
└── docs/
    ├── AGENT-FRAMEWORK-DEFAULT-MODEL.md     # This file
    ├── AGENT-FRAMEWORK-WORKTREES-INTEGRATION.md
    ├── GIT-WORKTREES-GUIDE.md
    └── AURIGRAPH-TEAM-AGENTS.md
```

---

## ⚙️ Installation & Setup

### Step 1: Add to Shell Profile

**For Bash** (`~/.bashrc`):
```bash
source /Users/subbujois/subbuworkingdir/Aurigraph-DLT/scripts/shell-profile-integration.sh
```

**For Zsh** (`~/.zshrc`):
```bash
source /Users/subbujois/subbuworkingdir/Aurigraph-DLT/scripts/shell-profile-integration.sh
```

**For Fish** (`~/.config/fish/config.fish`):
```fish
bash -c "source /Users/subbujois/subbuworkingdir/Aurigraph-DLT/scripts/shell-profile-integration.sh"
```

### Step 2: Reload Shell

```bash
# For Bash
source ~/.bashrc

# For Zsh
source ~/.zshrc

# For any shell
exec $SHELL
```

### Step 3: Verify Installation

```bash
# Check framework status
agent-framework-status

# View framework logs
agent-framework-logs

# List all worktrees
worktree-list
```

---

## 🎮 Quick Start Guide

### Initialize Framework Manually

```bash
# Re-initialize framework (useful if state files are deleted)
source scripts/agent-framework-session-init.sh
```

### Switch to Worktrees

```bash
# Using aliases (if shell integration is active)
worktree-gRPC          # Switch to gRPC services worktree
worktree-perf          # Switch to performance worktree
worktree-tests         # Switch to testing worktree
worktree-monitoring    # Switch to monitoring worktree

# Or manually
cd ../Aurigraph-DLT-grpc
cd ../Aurigraph-DLT-perf
cd ../Aurigraph-DLT-tests
cd ../Aurigraph-DLT-monitoring
```

### View Framework Status

```bash
# Display current session state
agent-framework-status

# View detailed logs
agent-framework-logs

# List all worktrees
worktree-list
```

### Make Changes in Worktree

```bash
# Navigate to worktree
cd ../Aurigraph-DLT-grpc

# Make changes
vim src/main/proto/transaction.proto

# Commit to feature branch
git add .
git commit -m "feat(grpc): Add transaction service proto"

# Push to remote
git push origin feature/grpc-services

# Create pull request
gh pr create --title "gRPC Protocol Buffers" \
  --body "Implements gRPC service definitions for V11 platform"
```

---

## 📊 Framework Configuration

### Configuration File: `.env.agent-framework`

Located in repository root. Key settings:

```properties
# Framework Status
FRAMEWORK_INITIALIZED=true
FRAMEWORK_VERSION=2.0
FRAMEWORK_MODE=default

# Worktrees
WORKTREES_ENABLED=true
WORKTREES_COUNT=4

# Agents
AGENTS_ENABLED=true
AGENTS_COUNT=10

# Daily Reminders
DAILY_REMINDER_ENABLED=true
DAILY_REMINDER_TIME=09:00

# Parallel Execution
PARALLEL_EXECUTION_ENABLED=true
MAX_CONCURRENT_AGENTS=10

# Integrations
JIRA_INTEGRATION_ENABLED=true
GITHUB_INTEGRATION_ENABLED=true

# Performance Targets
PERFORMANCE_TARGET_TPS=2000000
PERFORMANCE_TARGET_FINALITY_MS=100
```

### Customize Configuration

**Enable/Disable Daily Reminders**:
```bash
# Edit .env.agent-framework
sed -i 's/DAILY_REMINDER_ENABLED=.*/DAILY_REMINDER_ENABLED=false/' .env.agent-framework
```

**Change Reminder Time**:
```bash
# Set reminder to 10:00 UTC
sed -i 's/DAILY_REMINDER_TIME=.*/DAILY_REMINDER_TIME=10:00/' .env.agent-framework
```

---

## 🔍 Monitoring & Status

### Check Framework Status

```bash
# Display JSON state
cat ~/.aurigraph-framework/session-state.json

# Format with jq (if available)
cat ~/.aurigraph-framework/session-state.json | jq .
```

### View Framework Logs

```bash
# Last 20 lines
tail -20 ~/.aurigraph-framework/framework.log

# Follow logs in real-time
tail -f ~/.aurigraph-framework/framework.log

# Search logs for specific agent
grep "BDA" ~/.aurigraph-framework/framework.log
```

### Verify Worktrees

```bash
# List all worktrees with status
git worktree list

# Check worktree directory contents
ls -la ../Aurigraph-DLT-grpc
ls -la ../Aurigraph-DLT-perf
```

---

## 🌍 Multi-Project Integration

### Applying Framework to Other Projects

The framework can be applied to any Aurigraph DLT sub-project:

```bash
# Initialize framework for current project
/Users/subbujois/subbuworkingdir/Aurigraph-DLT/scripts/init-all-projects.sh

# Or individually for a project
cd /path/to/other/aurigraph/project
source /Users/subbujois/subbuworkingdir/Aurigraph-DLT/scripts/shell-profile-integration.sh
```

### Projects Using This Model

- ✅ `Aurigraph-DLT` (main repository)
- ✅ `aurigraph-av10-7/aurigraph-v11-standalone` (V11 platform)
- ✅ `enterprise-portal` (React portal)
- 🔄 All new projects (default inclusion)

---

## 🛠️ Troubleshooting

### Issue: Framework Not Initializing on Session Start

**Symptom**: Daily reminder doesn't show, framework state not created

**Solution**:
```bash
# Check if shell integration is sourced
grep "agent-framework" ~/.bashrc

# If missing, add to ~/.bashrc manually:
source /Users/subbujois/subbuworkingdir/Aurigraph-DLT/scripts/shell-profile-integration.sh

# Reload shell
source ~/.bashrc
```

### Issue: Worktrees Not Found

**Symptom**: "Worktree missing" messages

**Solution**:
```bash
# Manually reinitialize framework
source scripts/agent-framework-session-init.sh

# Or manually create missing worktrees
cd /Users/subbujois/subbuworkingdir/Aurigraph-DLT
git worktree add -b feature/grpc-services ../Aurigraph-DLT-grpc
git worktree add -b feature/performance-optimization ../Aurigraph-DLT-perf
git worktree add -b feature/test-coverage-expansion ../Aurigraph-DLT-tests
git worktree add -b feature/monitoring-dashboards ../Aurigraph-DLT-monitoring
```

### Issue: Daily Reminder Shows Every Session

**Symptom**: Reminder banner displays every time despite already seeing it today

**Solution**:
```bash
# Check if daily-reminder-check file exists and has today's date
cat ~/.aurigraph-framework/daily-reminder-check

# If missing or stale, update it
date +%Y-%m-%d > ~/.aurigraph-framework/daily-reminder-check

# Or disable reminders temporarily
sed -i 's/DAILY_REMINDER_ENABLED=.*/DAILY_REMINDER_ENABLED=false/' .env.agent-framework
```

### Issue: State Files Growing Too Large

**Symptom**: `framework.log` becomes very large (>100MB)

**Solution**:
```bash
# Archive old logs
gzip ~/.aurigraph-framework/framework.log

# Create new log file
touch ~/.aurigraph-framework/framework.log

# Or remove all logs and reinitialize
rm ~/.aurigraph-framework/*
source scripts/agent-framework-session-init.sh
```

---

## 📚 Related Documentation

### Framework Documentation
- **GIT-WORKTREES-GUIDE.md** - Detailed worktree usage guide
- **AGENT-FRAMEWORK-WORKTREES-INTEGRATION.md** - Integration architecture
- **AURIGRAPH-TEAM-AGENTS.md** - Comprehensive agent documentation
- **ARCHITECTURE.md** - System architecture overview

### Quick Reference
- **DEVELOPMENT.md** - Development setup guide
- **CLAUDE.md** - Claude Code configuration (root)
- **aurigraph-av10-7/CLAUDE.md** - V11-specific guidance

---

## 🎓 Learning Path

### For New Developers

1. **Read**: AGENT-FRAMEWORK-DEFAULT-MODEL.md (this file)
2. **Read**: GIT-WORKTREES-GUIDE.md
3. **Initialize**: `source scripts/agent-framework-session-init.sh`
4. **Practice**: Navigate to a worktree and make a small commit
5. **Reference**: AGENT-FRAMEWORK-WORKTREES-INTEGRATION.md for advanced usage

### For Team Leads

1. **Review**: AURIGRAPH-TEAM-AGENTS.md for agent responsibilities
2. **Configure**: Adjust `.env.agent-framework` settings for your team
3. **Monitor**: Use `agent-framework-logs` to track agent activity
4. **Optimize**: Review performance metrics in session-state.json

### For DevOps/Infrastructure

1. **Configure**: `.env.agent-framework` deployment settings
2. **Automate**: Set up remote framework initialization
3. **Monitor**: Create Prometheus/Grafana dashboards for framework metrics
4. **Backup**: Archive `~/.aurigraph-framework/` state files

---

## 📈 Performance & Metrics

### Expected Benefits

| Metric | Before | After | Improvement |
|--------|--------|-------|-------------|
| **Parallel Development** | Sequential | 4 concurrent | 4x |
| **Merge Conflicts** | ~1/day | ~1/week | 7x reduction |
| **Feature Delivery** | 5/week | 15-20/week | 3-4x faster |
| **Code Review Time** | 2-4 hours | <1 hour | 2-4x faster |
| **Context Switching** | High | Zero | ∞ |

### Framework Overhead

- **Initialization Time**: ~2-3 seconds per session
- **Memory Usage**: ~50MB for framework state and logs
- **Disk Usage**: ~100MB for logs (over time)
- **CPU Impact**: Negligible (<1% idle)

---

## 🔒 Security Considerations

### State File Permissions

```bash
# Secure framework state directory
chmod 700 ~/.aurigraph-framework

# View permissions
ls -la ~/.aurigraph-framework/

# Should show: drwx------  (user read/write/execute only)
```

### Sensitive Data

**DO NOT** commit sensitive data to worktrees:
- API keys, tokens, credentials
- Private SSH keys
- Database passwords

Use environment variables or `.env` files (added to `.gitignore`)

### Audit Trail

Framework logs all agent activity:
```bash
# View audit trail
grep "Agent initialized" ~/.aurigraph-framework/framework.log
grep "Worktree" ~/.aurigraph-framework/framework.log
```

---

## 🚀 Advanced Features

### Custom Agents

To add a new agent to the framework:

1. **Update** `.env.agent-framework` with agent configuration
2. **Register** in `scripts/agent-framework-session-init.sh`
3. **Document** in `AURIGRAPH-TEAM-AGENTS.md`

### Custom Worktrees

To add additional worktrees:

```bash
# Create new worktree for feature
git worktree add -b feature/my-feature ../Aurigraph-DLT-my-feature

# Update .env.agent-framework
WORKTREE_MYFEATURE_PATH=../Aurigraph-DLT-my-feature
WORKTREE_MYFEATURE_BRANCH=feature/my-feature
```

### Integration Hooks

Extend framework behavior:

```bash
# Create custom initialization hook
~/.aurigraph-framework/init.hook.sh

# Framework will source it automatically on session init
```

---

## 📞 Support & Maintenance

### Reporting Issues

If you encounter issues with the framework:

1. **Check logs**: `agent-framework-logs`
2. **Verify state**: `agent-framework-status`
3. **Reinitialize**: `source scripts/agent-framework-session-init.sh`
4. **Report**: Create issue in GitHub with logs and state dump

### Framework Updates

Framework is automatically updated with each git pull. To get latest:

```bash
git pull origin main
source scripts/agent-framework-session-init.sh
```

### Maintenance Schedule

- **Daily**: Framework auto-initialization and reminder
- **Weekly**: Log rotation and archive
- **Monthly**: Framework version check and compatibility audit

---

## ✅ Verification Checklist

- [ ] Shell profile integration added to `~/.bashrc` or `~/.zshrc`
- [ ] Shell reloaded (`source ~/.bashrc` or equivalent)
- [ ] Framework initializes automatically on new shell session
- [ ] Daily reminder displays (if enabled)
- [ ] All 4 worktrees accessible via aliases
- [ ] `git worktree list` shows 5 total (main + 4 features)
- [ ] Framework logs show no errors
- [ ] State file created at `~/.aurigraph-framework/session-state.json`

---

## 📝 Summary

**The J4C Agent Framework + Git Worktrees is now your default development model.**

### Key Points

✅ **Automatic** - Framework initializes on every new session
✅ **Daily Reminders** - Keeps team engaged and aware
✅ **Parallel Development** - 4 concurrent workstreams
✅ **Persistent State** - Framework state survives shell restarts
✅ **Zero Configuration** - Works out of the box
✅ **Fully Integrated** - With JIRA, GitHub, and all tools

### Quick Links

- **Initialize**: `source scripts/agent-framework-session-init.sh`
- **Check Status**: `agent-framework-status`
- **View Logs**: `agent-framework-logs`
- **List Worktrees**: `worktree-list`
- **Switch Worktree**: `worktree-gRPC`, `worktree-perf`, etc.

---

**Document**: Agent Framework + Git Worktrees - DEFAULT EXECUTION MODEL
**Version**: 2.0
**Date**: 2025-11-12
**Status**: ✅ **ACTIVE - ALL PROJECTS**
**Memorization**: 🧠 **MANDATORY FOR ALL DEVELOPERS**

---

## 📞 Quick Reference

```bash
# One-time setup
source ~/.bashrc

# Daily operations
worktree-list              # View all worktrees
worktree-gRPC              # Switch to gRPC worktree
agent-framework-status     # Check framework state
agent-framework-logs       # View framework activity

# For questions
cat GIT-WORKTREES-GUIDE.md
cat AGENT-FRAMEWORK-WORKTREES-INTEGRATION.md
```

---

*This document is the definitive guide for the Agent Framework DEFAULT EXECUTION MODEL. All developers working on Aurigraph DLT projects should be familiar with its contents.*
