# Aurigraph V11 - Environment Loading Guide

**Purpose**: This document defines the standard environment loading procedure for Claude Code sessions.

**Last Updated**: October 20, 2025

---

## 🎯 **MANDATORY LOADING SEQUENCE**

When resuming any Aurigraph V11 development session, Claude MUST load these documents in this specific order:

### **Phase 1: Current Status (CRITICAL)**

```bash
# Load in this exact order:
cat aurigraph-av10-7/aurigraph-v11-standalone/TODO.md
```

**Purpose**: Understand current work status, recent achievements, pending tasks

**Key Information**:
- V11 Migration Progress (~35%)
- Recent completions (Demo System V4.5.0, AI optimization, etc.)
- Current priorities
- Dashboard readiness (88.9%)

---

### **Phase 2: Sprint Planning**

```bash
cat aurigraph-av10-7/aurigraph-v11-standalone/SPRINT_PLAN.md
```

**Purpose**: Understand current sprint objectives and timeline

**Key Information**:
- Sprint allocation (10 sprints, 20 weeks)
- Story points (157 SP total)
- Current sprint focus
- Team composition

---

### **Phase 3: Testing Requirements**

```bash
cat aurigraph-av10-7/aurigraph-v11-standalone/COMPREHENSIVE-TEST-PLAN.md
```

**Purpose**: Understand testing requirements and coverage targets

**Key Information**:
- 95% coverage requirement
- Test strategy by component
- Integration test framework
- E2E testing approach

---

### **Phase 4: Parallel Execution**

```bash
cat aurigraph-av10-7/aurigraph-v11-standalone/PARALLEL-SPRINT-EXECUTION-PLAN.md
```

**Purpose**: Understand multi-team parallel development strategy

**Key Information**:
- 5 concurrent workstreams
- Agent coordination (BDA, FDA, SCA, ADA, IBA, QAA, DDA, DOA, PMA)
- Sprint 18-20 execution plan

---

### **Phase 5: Latest Progress Report**

```bash
# Find and read the most recent sprint report
ls -lt aurigraph-av10-7/aurigraph-v11-standalone/SPRINT*.md | head -1
cat <most_recent_sprint_report>
```

**Purpose**: Understand latest execution status and results

**Key Information**:
- Recently completed work
- Current blockers
- Performance metrics
- Next immediate steps

---

## 📂 **FILE LOCATIONS**

All critical environment files are located in:
```
/Users/subbujois/Documents/GitHub/Aurigraph-DLT/aurigraph-av10-7/aurigraph-v11-standalone/
```

### **Core Planning Documents**
- `TODO.md` - Current status (1,040 lines)
- `SPRINT_PLAN.md` - Sprint allocation
- `COMPREHENSIVE-TEST-PLAN.md` - Test strategy
- `PARALLEL-SPRINT-EXECUTION-PLAN.md` - Multi-team coordination

### **Progress Reports**
- `SPRINT_EXECUTION_REPORT.md` - Latest execution (Oct 18, 2025)
- `SPRINT-12-PROGRESS-REPORT-OCT11-2025.md` - Sprint 12 status
- `SPRINT-2-BDA-REPORT.md` - Backend development
- `SPRINT4_COMPLETION_SUMMARY.md` - Sprint 4 results

### **Agent Documentation**
- `AURIGRAPH-TEAM-AGENTS.md` - Multi-agent architecture (in parent directory)

---

## 🔄 **AUTOMATED LOADING SCRIPT**

Create this as `load-environment.sh`:

```bash
#!/bin/bash

echo "🔄 Loading Aurigraph V11 Environment..."
echo ""

BASE_DIR="/Users/subbujois/Documents/GitHub/Aurigraph-DLT/aurigraph-av10-7/aurigraph-v11-standalone"

echo "📋 Phase 1: Current Status"
echo "================================"
cat "$BASE_DIR/TODO.md" | head -150
echo ""

echo "📅 Phase 2: Sprint Plan"
echo "================================"
cat "$BASE_DIR/SPRINT_PLAN.md" | head -150
echo ""

echo "🧪 Phase 3: Test Plan"
echo "================================"
cat "$BASE_DIR/COMPREHENSIVE-TEST-PLAN.md" | head -150
echo ""

echo "⚡ Phase 4: Parallel Execution"
echo "================================"
cat "$BASE_DIR/PARALLEL-SPRINT-EXECUTION-PLAN.md" | head -100
echo ""

echo "📊 Phase 5: Latest Sprint Report"
echo "================================"
LATEST_SPRINT=$(ls -t "$BASE_DIR"/SPRINT*.md | head -1)
cat "$LATEST_SPRINT" | head -150
echo ""

echo "✅ Environment Loading Complete!"
```

**Usage**:
```bash
chmod +x load-environment.sh
./load-environment.sh
```

---

## 🎯 **QUICK REFERENCE CHECKLIST**

At session start, verify you have loaded:

- [ ] TODO.md - Current status understood
- [ ] SPRINT_PLAN.md - Sprint objectives clear
- [ ] COMPREHENSIVE-TEST-PLAN.md - Testing requirements known
- [ ] PARALLEL-SPRINT-EXECUTION-PLAN.md - Multi-team coordination understood
- [ ] Latest SPRINT report - Recent progress reviewed

---

## 📊 **KEY METRICS TO REMEMBER**

After loading environment, you should know:

**V11 Backend**:
- Migration Progress: ~35%
- Current TPS: 2.56M (with AI optimization)
- Test Coverage: ~15% (target: 95%)
- Total Tests: 897 (895 skipped)

**Enterprise Portal**:
- Version: V4.3.2
- Status: Production (https://dlt.aurigraph.io)
- Dashboard Readiness: 88.9%
- Test Coverage: 85%+

**Current Sprint**:
- Focus: Backend optimization + Testing
- Duration: Oct 20 - Nov 3, 2025 (2 weeks)
- Parallel Streams: 5 concurrent workstreams

**JIRA Status**:
- Open Tickets: 44 (from 126)
- Recently Closed: 76 tickets (Phase 1-3)
- Sprint 11 APIs: 100% complete

---

## 🚨 **CRITICAL REMINDERS**

1. **Always load TODO.md first** - This has the most current status
2. **Check git status** - Know what's committed vs uncommitted
3. **Verify remote service status** - Check if V11 is running on dlt.aurigraph.io
4. **Review recent commits** - Understand latest changes
5. **Check for blockers** - Identify any issues from previous session

---

## 📞 **EMERGENCY RECOVERY**

If environment files are missing or corrupted:

1. Check git history: `git log --all --full-history -- SPRINT_PLAN.md`
2. Restore from git: `git checkout HEAD~1 -- <file>`
3. Check remote: `ssh subbu@dlt.aurigraph.io "ls /opt/aurigraph-v11/docs/"`
4. Last resort: Rebuild from JIRA tickets and git history

---

## 📝 **VERSION HISTORY**

| Date | Version | Change |
|------|---------|--------|
| Oct 20, 2025 | 1.0.0 | Initial environment loading guide created |

---

**Maintained by**: Aurigraph Development Team
**Review Frequency**: Every sprint (2 weeks)
**Next Review**: Nov 3, 2025
