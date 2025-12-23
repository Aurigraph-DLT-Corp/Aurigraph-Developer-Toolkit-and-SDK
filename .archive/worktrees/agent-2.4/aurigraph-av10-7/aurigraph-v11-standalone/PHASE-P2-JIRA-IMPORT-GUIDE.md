# Phase P2: JIRA Ticket Import Guide
**Status**: ✅ READY FOR MANUAL IMPORT
**Date**: November 4, 2025
**Instructions**: Step-by-step guide for importing 23 tickets into JIRA

---

## 📋 JIRA IMPORT SUMMARY

### Quick Stats
- **Total Tickets**: 23
- **Total Story Points**: 132 SP
- **Total Sprints**: 3 (S13, S14, S15)
- **Estimated Import Time**: 15-20 minutes
- **Verification Time**: 5 minutes

### Ticket Distribution
| Sprint | Count | Story Points | Status |
|--------|-------|--------------|--------|
| Sprint 13 | 8 | 40 SP | Ready ✅ |
| Sprint 14 | 11 | 69 SP | Ready ✅ |
| Sprint 15 | 4 | 23 SP | Ready ✅ |
| **TOTAL** | **23** | **132 SP** | **Ready ✅** |

---

## 🔗 JIRA ACCESS CREDENTIALS

### Connection Details
- **JIRA URL**: https://aurigraphdlt.atlassian.net
- **Project**: AV11 (Aurigraph V11)
- **Board**: 789 (Agile/Kanban)
- **Organization**: Aurigraph DLT

### Authentication
- **User Email**: sjoish12@gmail.com
- **API Token**: [From Credentials.md]
- **Access Type**: Full admin access

---

## ✅ PREREQUISITE VERIFICATION

Before importing tickets, verify the following are complete:

### JIRA Board Status
- [ ] JIRA connection is active and accessible
- [ ] Project AV11 is visible in board list
- [ ] Board 789 is available
- [ ] Current user has admin/project lead permissions

### Sprint Configuration
The following sprints must be created in JIRA **BEFORE** importing tickets:

```bash
Sprint 13: November 4-15, 2025
├─ Duration: 2 weeks (11 working days)
├─ Capacity: 40 Story Points
├─ Components: 8
└─ Lead: FDA (Frontend Development Agent)

Sprint 14: November 18-22, 2025
├─ Duration: 1 week (compressed, 5 days)
├─ Capacity: 69 Story Points
├─ Components: 11
├─ Lead: FDA + BDA (Backend Development Agent)
└─ Critical Path: S14-9 WebSocket Integration

Sprint 15: November 25-29, 2025
├─ Duration: 1 week (compressed, 5 days)
├─ Capacity: 23 Story Points
├─ Components: 4 (Testing/Release)
├─ Lead: QAA + Release Team
└─ Goal: Integration Testing + Release v4.6.0
```

### Verification Steps
```bash
# Step 1: Check JIRA access
curl -u "${JIRA_EMAIL}:${JIRA_API_TOKEN}" \
  https://aurigraphdlt.atlassian.net/rest/api/3/myself

# Step 2: Verify project exists
curl -u "${JIRA_EMAIL}:${JIRA_API_TOKEN}" \
  https://aurigraphdlt.atlassian.net/rest/api/3/project/AV11

# Step 3: List boards
curl -u "${JIRA_EMAIL}:${JIRA_API_TOKEN}" \
  https://aurigraphdlt.atlassian.net/rest/api/3/boards?name=AV11
```

---

## 📥 MANUAL JIRA IMPORT PROCEDURE

### Option A: JIRA UI Import (Recommended - ~20 min)

#### Step 1: Navigate to JIRA Board
1. Open https://aurigraphdlt.atlassian.net
2. Navigate to **Projects** → **AV11**
3. Click on **Board 789**
4. Verify you see the kanban board

#### Step 2: Create Epic
1. Click **Create Issue**
2. **Issue Type**: Epic
3. **Epic Name**: API & Page Integration (Sprints 13-15)
4. **Story Points**: 132
5. **Priority**: P0 - Critical
6. **Description**:
   ```
   Integration of 26 pending API endpoints with 15 React components
   across 3 sprints to deliver Enterprise Portal v4.6.0 with real-time
   updates, advanced features, and comprehensive testing.
   ```
7. Click **Create**
8. **Note Epic Key** (e.g., AV11-500)

#### Step 3: Create Sprint 13 (if not already created)
1. Click **Sprint** → **Create Sprint**
2. **Sprint Name**: Sprint 13
3. **Start Date**: November 4, 2025
4. **End Date**: November 15, 2025
5. **Goal**: Core API Integration Phase
6. Click **Create**

#### Step 4: Import Sprint 13 Tickets (8 tickets, 40 SP)
Repeat the following for each Sprint 13 ticket:

**S13-1: Network Topology Visualization Component**
- Issue Type: Story
- Summary: Network Topology Visualization Component
- Story Points: 8
- Epic Link: API & Page Integration
- Sprint: Sprint 13
- Assignee: FDA Lead 1
- Priority: High
- Description: [From SPRINT-13-15-JIRA-TICKETS.md - S13-1 section]
- Acceptance Criteria: [From JIRA tickets template]
- Labels: sprint-13, network-topology, react, visualization

**S13-2: Advanced Block Search Component**
- Story Points: 6
- Assignee: FDA Junior 1
- Labels: sprint-13, block-search, react, search

**S13-3: Validator Performance Dashboard**
- Story Points: 7
- Assignee: FDA Lead 2
- Labels: sprint-13, validator-performance, metrics

**S13-4: AI Model Metrics Component**
- Story Points: 6
- Assignee: FDA Junior 2
- Labels: sprint-13, ai-metrics, visualization

**S13-5: Audit Log Viewer**
- Story Points: 5
- Assignee: FDA Junior 3
- Labels: sprint-13, audit-log, security

**S13-6: RWA Asset Manager**
- Story Points: 4
- Assignee: FDA Dev 1
- Labels: sprint-13, rwa-assets

**S13-7: Token Management Interface**
- Story Points: 4
- Assignee: FDA Junior 4
- Labels: sprint-13, token-management

**S13-8: Dashboard Layout & Integration**
- Story Points: 0 (Epic/Subtask)
- Assignee: FDA Lead 3
- Labels: sprint-13, dashboard-layout

#### Step 5: Create Sprint 14 (if not already created)
1. Click **Sprint** → **Create Sprint**
2. **Sprint Name**: Sprint 14
3. **Start Date**: November 18, 2025
4. **End Date**: November 22, 2025
5. **Goal**: WebSocket & Infrastructure Integration Phase
6. Click **Create**

#### Step 6: Import Sprint 14 Tickets (11 tickets, 69 SP)
Repeat for all 11 Sprint 14 tickets from SPRINT-13-15-JIRA-TICKETS.md
- S14-1 through S14-11
- Assign to Sprint 14
- Link to same Epic

#### Step 7: Create Sprint 15 (if not already created)
1. Click **Sprint** → **Create Sprint**
2. **Sprint Name**: Sprint 15
3. **Start Date**: November 25, 2025
4. **End Date**: November 29, 2025
5. **Goal**: Integration Testing & Release Phase
6. Click **Create**

#### Step 8: Import Sprint 15 Tickets (4 tickets, 23 SP)
Repeat for all 4 Sprint 15 tickets from SPRINT-13-15-JIRA-TICKETS.md
- S15-1 through S15-4
- Assign to Sprint 15
- Link to same Epic

#### Step 9: Verify Import
1. Go to **Board** → **Sprint 13**
2. Verify all 8 tickets visible (40 SP total)
3. Check **Backlog** for Sprints 14-15
4. Confirm Epic links all 23 tickets
5. Verify all assignments correct

**✅ Import Complete!**

---

### Option B: JIRA API Import (Alternative - Automated)

If manual import is time-consuming, use the JIRA API script:

```bash
#!/bin/bash
# Import tickets via JIRA REST API

JIRA_BASE="https://aurigraphdlt.atlassian.net"
JIRA_EMAIL="${JIRA_EMAIL}"
JIRA_API_TOKEN="${JIRA_API_TOKEN}"
PROJECT_KEY="AV11"
EPIC_KEY="AV11-500"  # Replace with actual epic key from Step 2

# Function to create a ticket
create_ticket() {
    local issue_type=$1
    local summary=$2
    local sp=$3
    local sprint=$4
    local assignee=$5

    curl -X POST \
      "${JIRA_BASE}/rest/api/3/issues" \
      -u "${JIRA_EMAIL}:${JIRA_API_TOKEN}" \
      -H "Content-Type: application/json" \
      -d @- << EOF
{
  "fields": {
    "project": {"key": "${PROJECT_KEY}"},
    "issuetype": {"name": "${issue_type}"},
    "summary": "${summary}",
    "customfield_10000": ${sp},
    "sprint": ${sprint},
    "assignee": {"name": "${assignee}"},
    "epic": {"key": "${EPIC_KEY}"}
  }
}
EOF
}

# Example for S13-1
create_ticket "Story" \
  "Network Topology Visualization Component" \
  8 \
  13 \
  "fda-lead-1"
```

---

## 🔍 VERIFICATION CHECKLIST

After import, verify the following:

### Epic Verification
- [ ] Epic "API & Page Integration (Sprints 13-15)" created
- [ ] Epic has 132 SP total
- [ ] All 23 tickets linked to epic
- [ ] Epic marked as P0 - Critical

### Sprint 13 Verification (8 tickets, 40 SP)
- [ ] S13-1: Network Topology (8 SP) - FDA Lead 1
- [ ] S13-2: Block Search (6 SP) - FDA Junior 1
- [ ] S13-3: Validator Performance (7 SP) - FDA Lead 2
- [ ] S13-4: AI Model Metrics (6 SP) - FDA Junior 2
- [ ] S13-5: Audit Log Viewer (5 SP) - FDA Junior 3
- [ ] S13-6: RWA Asset Manager (4 SP) - FDA Dev 1
- [ ] S13-7: Token Management (4 SP) - FDA Junior 4
- [ ] S13-8: Dashboard Layout (0 SP) - FDA Lead 3
- [ ] Total: 40 SP ✅

### Sprint 14 Verification (11 tickets, 69 SP)
- [ ] S14-1 through S14-11 all created
- [ ] Total story points: 69 SP
- [ ] S14-9 (WebSocket) marked as critical path
- [ ] All assignees correct

### Sprint 15 Verification (4 tickets, 23 SP)
- [ ] S15-1 through S15-4 all created
- [ ] Total story points: 23 SP
- [ ] All testing/release tickets present

### Data Integrity Verification
```bash
# Run this after import to verify
curl -u "${JIRA_EMAIL}:${JIRA_API_TOKEN}" \
  "${JIRA_BASE}/rest/api/3/search?jql=project=AV11&maxResults=100" \
  | jq '.issues | length'  # Should return 23
```

---

## 📊 IMPORT STATUS TRACKING

### Pre-Import Checklist
- [ ] Credentials loaded from Credentials.md
- [ ] JIRA access verified (can login)
- [ ] Board AV11/789 accessible
- [ ] Admin permissions confirmed
- [ ] Project key confirmed as AV11

### Import Execution
- [ ] Epic created and key noted
- [ ] Sprint 13 created (Nov 4-15)
- [ ] Sprint 13 tickets imported (8/8)
- [ ] Sprint 14 created (Nov 18-22)
- [ ] Sprint 14 tickets imported (11/11)
- [ ] Sprint 15 created (Nov 25-29)
- [ ] Sprint 15 tickets imported (4/4)

### Post-Import Verification
- [ ] All 23 tickets visible in backlog
- [ ] Story points total: 132 SP ✅
- [ ] Epic links confirmed on all tickets
- [ ] Assignees correct for each ticket
- [ ] Sprint assignments correct
- [ ] Labels applied consistently

---

## ⏱️ TIMELINE FOR PHASE P2

| Task | Duration | Owner | Status |
|------|----------|-------|--------|
| Credential verification | 2 min | Manual | ⏳ |
| Epic creation | 2 min | Manual | ⏳ |
| Sprint creation (3×) | 3 min | Manual | ⏳ |
| S13 import (8 tickets) | 8 min | Manual | ⏳ |
| S14 import (11 tickets) | 11 min | Manual | ⏳ |
| S15 import (4 tickets) | 4 min | Manual | ⏳ |
| Verification | 5 min | Manual | ⏳ |
| **TOTAL** | **~35 min** | Manual | Ready ✅ |

---

## 🎯 SUCCESS CRITERIA FOR PHASE P2

**Phase P2 is complete when:**
- ✅ All 23 tickets created in JIRA
- ✅ All story points assigned correctly (132 total)
- ✅ All 3 sprints created and configured
- ✅ Epic "API & Page Integration" links all tickets
- ✅ All team assignments correct (FDA + BDA)
- ✅ Acceptance criteria visible for each ticket
- ✅ Backlog ready for Sprint 13 kickoff

---

## 🚀 NEXT STEPS AFTER P2 COMPLETION

Once all tickets are imported into JIRA:

1. **Confirm Sprint 13 is Active**
   - Move Sprint 13 to ACTIVE state in JIRA
   - Verify board shows Sprint 13 tickets in READY

2. **Team Assignment Verification**
   - Confirm all 8 developers see their assigned tickets
   - Verify story point estimates match task complexity

3. **Daily Standup Execution**
   - Begin daily 10:30 AM standups with all agents
   - Use imported tickets as reference for progress tracking

4. **GitHub-JIRA Synchronization**
   - Link GitHub commits to JIRA tickets (ticket key in commit message)
   - Example: `git commit -m "S13-1: Initial Network Topology component scaffold"`

5. **Week 1 Tracking**
   - Track daily progress against Week 1 targets
   - Update JIRA with completion percentages
   - Monitor towards 50% completion by Nov 6

---

## 📞 SUPPORT & TROUBLESHOOTING

### Common Issues

**Issue**: "Cannot create epic - permission denied"
- **Solution**: Verify user has Project Lead or Admin role in AV11

**Issue**: "Sprint dates conflict with existing sprints"
- **Solution**: Check JIRA Sprint calendar - adjust dates if overlap detected

**Issue**: "Story points field not visible"
- **Solution**: Verify Scrum board is configured (not Kanban only)

**Issue**: "Cannot link tickets to epic"
- **Solution**: Confirm epic was created before importing tickets

### Credentials Troubleshooting
```bash
# Test JIRA API access
export JIRA_EMAIL="sjoish12@gmail.com"
export JIRA_API_TOKEN="[from Credentials.md]"

curl -u "${JIRA_EMAIL}:${JIRA_API_TOKEN}" \
  https://aurigraphdlt.atlassian.net/rest/api/3/myself
```

---

## 📝 PHASE P2 COMPLETION SIGN-OFF

**Phase P2: JIRA Ticket Import**

| Requirement | Status | Notes |
|-------------|--------|-------|
| 23 JIRA tickets created | ⏳ Pending import | Ready in template |
| 132 story points assigned | ⏳ Pending import | 40+69+23 verified |
| 3 sprints configured | ⏳ Pending creation | S13, S14, S15 |
| Epic links all tickets | ⏳ Pending | Framework ready |
| Team assignments correct | ✅ Configured | In template |
| Acceptance criteria present | ✅ Documented | In SPRINT-13-15-JIRA-TICKETS.md |

**Ready for Manual Import**: ✅ YES

---

**Created**: November 4, 2025
**For**: Sprint 13-15 Multi-Agent Parallel Execution
**Status**: PHASE P2 - READY FOR MANUAL JIRA IMPORT
**Next Action**: Execute JIRA UI import procedure above

---

🚀 **Phase P2 is ready. Follow the JIRA UI Import Procedure (Option A) for fastest completion.**
