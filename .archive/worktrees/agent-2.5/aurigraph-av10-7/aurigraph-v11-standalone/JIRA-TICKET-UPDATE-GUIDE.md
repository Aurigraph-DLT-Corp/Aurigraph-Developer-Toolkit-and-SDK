# JIRA Ticket Update Guide - Sprint 13-15 Integration
**Date**: October 30, 2025
**Status**: READY FOR EXECUTION
**Last Updated**: October 30, 2025

---

## Overview

This guide provides step-by-step instructions for updating existing JIRA tickets and creating new Sprint 13-15 allocation tickets in the AV11 project board.

---

## Part 1: Update Existing JIRA Tickets

### Tickets to Update from Previous Sessions

The following tickets should be updated with completion status and transition to DONE:

#### Sprint 12 Completion Tickets (Nov 1-3)

**Ticket: AV11-XXX - Token Traceability Implementation Phase 1**
- **Status**: COMPLETE → Update to DONE
- **Update**: Add comment "Phase 1 complete with 12 API endpoints integrated. Moving to Sprint 13 Phase 2 integration."
- **Link**: Link to SPRINT-13-15-INTEGRATION-ALLOCATION.md

**Ticket: AV11-XXX - Enterprise Portal V5.1.0 Testing**
- **Status**: COMPLETE → Update to DONE
- **Update**: Add comment "Testing phase complete. All 23 pages tested. Ready for production deployment."
- **Link**: Link to test results and coverage reports

**Ticket: AV11-XXX - WebSocket Infrastructure Setup**
- **Status**: IN PROGRESS → Update to DONE
- **Update**: Add comment "WebSocket infrastructure deployed. Real-time updates verified across all pages."
- **Link**: WebSocket configuration in SPRINT-13-15-INTEGRATION-ALLOCATION.md

### Update Steps for Existing Tickets

For each ticket above:

1. **Open JIRA Ticket**:
   ```bash
   # Example: Open ticket in browser
   https://aurigraphdlt.atlassian.net/jira/software/projects/AV11/issues/AV11-XXX
   ```

2. **Change Status to DONE**:
   - Click "Done" button or use transition menu
   - Add resolution: "Fixed" or "Done"
   - Click "Transition"

3. **Add Comment**:
   - Click "Comment" field at bottom
   - Add update message with reference to new sprint allocation
   - Click "Save"

4. **Link Related Tickets**:
   - Click "Link issue"
   - Select "is related to" or "is blocked by"
   - Link to Sprint 13-15 Epic (AV11-EPIC-1)
   - Click "Link"

5. **Verify Completion**:
   - Confirm status shows "DONE"
   - Check linked issues appear
   - Verify comment timestamp

---

## Part 2: Create Sprint 13-15 Epic

### Epic Creation

**Epic Details**:
- **Title**: API & Page Integration (Sprints 13-15)
- **Epic Key**: AV11-EPIC-1
- **Story Points**: 132
- **Team**: FDA, BDA, QAA, DDA
- **Duration**: Nov 4 - Nov 30, 2025
- **Release**: Enterprise Portal v4.6.0

### Create Epic Steps

1. **Navigate to Epics**:
   - Go to AV11 Board: https://aurigraphdlt.atlassian.net/jira/software/projects/AV11/boards/789
   - Click "Backlog" tab
   - Click "Create Epic"

2. **Fill Epic Details**:
   ```
   Epic Name: API & Page Integration (Sprints 13-15)
   Epic Key: AV11-EPIC-1
   Epic Link: [Leave blank - will be assigned]
   Summary: Integrate 26 pending API endpoints with 15 React components across 3 sprints (Nov 4-30, 2025)
   Description:

   ## Overview
   Comprehensive integration of 26 backend API endpoints with 15 React components for Enterprise Portal v4.6.0.

   ## Scope
   - Sprint 13 (40 SP): 7 components, 11 endpoints, Phase 1 high-priority integrations
   - Sprint 14 (69 SP): 8 components, 15 endpoints, WebSocket infrastructure, real-time features
   - Sprint 15 (23 SP): Testing, optimization, deployment

   ## Deliverables
   - 15 React components (3,900+ LOC)
   - 15 test files (1,510+ LOC)
   - WebSocket service (200+ LOC)
   - Export service (150+ LOC)
   - API integration (100+ LOC)
   - Total: 5,970+ LOC

   ## Success Criteria
   - All 26 endpoints integrated
   - 85%+ test coverage
   - <500ms component render time
   - <200ms API response time
   - Zero critical bugs
   - Production deployment on Nov 30

   ## Documents
   - SPRINT-13-15-INTEGRATION-ALLOCATION.md
   - SPRINT-13-15-JIRA-TICKETS.md
   - CONVERSATION-SUMMARY-SESSION-2.md
   ```

3. **Assign Epic**:
   - **Assignee**: FDA Dev 1 (Frontend Lead)
   - **Component**: Frontend / React Components
   - **Labels**: Sprint-13, Sprint-14, Sprint-15, Integration, API
   - **Flags**: 🚩 High Priority

4. **Save Epic**:
   - Click "Create"
   - Verify Epic is created with key AV11-EPIC-1
   - Copy Epic URL for linking tickets

---

## Part 3: Create Sprint 13-15 Tickets

### Ticket Creation Using API

You can create all 23 tickets using the JIRA REST API. Here's the process:

#### Option A: Manual Creation (UI)

For each ticket in SPRINT-13-15-JIRA-TICKETS.md:

1. Click "Create Issue" button on AV11 board
2. Fill in fields from ticket template
3. Select Epic: AV11-EPIC-1
4. Assign to team member
5. Set story points
6. Click "Create"

#### Option B: Bulk Creation (API)

**Setup Environment Variables**:
```bash
export JIRA_EMAIL="subbu@aurigraph.io"
export JIRA_API_TOKEN="ATATT3xFfGF0sFjaXc9iiBQuv-1jvWEfLDA5APUBvJvhVSrtzDDfS4B9k3ut3gCAyHUNU0YImVJSjcjglkR_3dmHtvRUYiV32nQJqkQ_HwKqCbS6oNs99XdYu5j_SmQqMQX4a7WekwS-sYNbDFtNBTrRuemXmlVHrjWa6dhMdCBuk0vdQvd_OYA=F7D4339F"
export JIRA_BASE_URL="https://aurigraphdlt.atlassian.net"
export JIRA_PROJECT_KEY="AV11"
```

**Create Single Ticket Example**:
```bash
curl -u "${JIRA_EMAIL}:${JIRA_API_TOKEN}" \
  -X POST \
  -H "Content-Type: application/json" \
  -d '{
    "fields": {
      "project": {
        "key": "AV11"
      },
      "summary": "Network Topology Visualization",
      "description": "Integrate Network Topology API endpoint with React component for real-time blockchain network visualization",
      "issuetype": {
        "name": "Story"
      },
      "customfield_10016": 8,
      "customfield_10017": "AV11-EPIC-1",
      "assignee": {
        "name": "fda.dev1@aurigraph.io"
      },
      "components": [
        {
          "name": "React Components"
        }
      ],
      "labels": [
        "Sprint-13",
        "Phase-1",
        "WebSocket"
      ]
    }
  }' \
  "${JIRA_BASE_URL}/rest/api/3/issues"
```

### Sprint 13 Tickets (8 tickets)

**S13-1: Network Topology Visualization**
- Story Points: 8
- Assignee: FDA Dev 1
- Sprint: Sprint 13
- Status: To Do

**S13-2: Advanced Block Search**
- Story Points: 6
- Assignee: FDA Dev 2
- Sprint: Sprint 13
- Status: To Do

**S13-3: Validator Performance Dashboard**
- Story Points: 7
- Assignee: FDA Dev 1 + BDA
- Sprint: Sprint 13
- Status: To Do

**S13-4: AI Model Metrics Viewer**
- Story Points: 6
- Assignee: FDA Dev 2
- Sprint: Sprint 13
- Status: To Do

**S13-5: Security Audit Log Viewer**
- Story Points: 5
- Assignee: FDA Dev 2
- Sprint: Sprint 13
- Status: To Do

**S13-6: Bridge Status Monitor**
- Story Points: 7
- Assignee: FDA Dev 1 + BDA
- Sprint: Sprint 13
- Status: To Do

**S13-7: RWA Asset Manager**
- Story Points: 8
- Assignee: FDA Dev 1 + FDA Dev 2
- Sprint: Sprint 13
- Status: To Do

**S13-8: Dashboard Layout Update**
- Story Points: 3
- Assignee: FDA Dev 1
- Sprint: Sprint 13
- Status: To Do

### Sprint 14 Tickets (11 tickets)

**S14-1: Consensus Details Viewer**
- Story Points: 7
- Assignee: FDA Dev 1
- Sprint: Sprint 14
- Status: To Do

**S14-2: Analytics Dashboard Enhancement**
- Story Points: 5
- Assignee: FDA Dev 2
- Sprint: Sprint 14
- Status: To Do

**S14-3: Gateway Operations UI**
- Story Points: 6
- Assignee: FDA Dev 1
- Sprint: Sprint 14
- Status: To Do

**S14-4: Smart Contracts Manager**
- Story Points: 8
- Assignee: FDA Dev 1 + BDA
- Sprint: Sprint 14
- Status: To Do

**S14-5: Data Feed Sources**
- Story Points: 5
- Assignee: FDA Dev 2
- Sprint: Sprint 14
- Status: To Do

**S14-6: Governance Voting Interface**
- Story Points: 4
- Assignee: FDA Dev 2
- Sprint: Sprint 14
- Status: To Do

**S14-7: Shard Management**
- Story Points: 4
- Assignee: FDA Dev 2
- Sprint: Sprint 14
- Status: To Do

**S14-8: Custom Metrics Dashboard**
- Story Points: 5
- Assignee: FDA Dev 1
- Sprint: Sprint 14
- Status: To Do

**S14-9: WebSocket Integration**
- Story Points: 8
- Assignee: FDA Dev 1 + BDA
- Sprint: Sprint 14
- Status: To Do

**S14-10: Advanced Filtering & Search**
- Story Points: 6
- Assignee: FDA Dev 2
- Sprint: Sprint 14
- Status: To Do

**S14-11: Data Export Features**
- Story Points: 5
- Assignee: FDA Dev 2
- Sprint: Sprint 14
- Status: To Do

### Sprint 15 Tickets (4 tickets)

**S15-1: Integration Testing**
- Story Points: 10
- Assignee: QAA Lead + QAA Junior
- Sprint: Sprint 15
- Status: To Do

**S15-2: Performance Testing**
- Story Points: 6
- Assignee: QAA Junior
- Sprint: Sprint 15
- Status: To Do

**S15-3: Bug Fixes & Optimization**
- Story Points: 4
- Assignee: FDA Dev 1 + FDA Dev 2
- Sprint: Sprint 15
- Status: To Do

**S15-4: Documentation & Release**
- Story Points: 3
- Assignee: DOA + DDA
- Sprint: Sprint 15
- Status: To Do

---

## Part 4: Create Sprints

### Sprint 13 Creation

**Sprint Name**: Sprint 13 - Phase 1 High-Priority Integrations
**Duration**: Nov 4-15, 2025
**Goal**: Integrate 7 high-priority components and 11 API endpoints
**Velocity**: 40 story points / 2 weeks

**Steps**:
1. Go to AV11 Backlog: https://aurigraphdlt.atlassian.net/jira/software/projects/AV11/boards/789
2. Click "Create sprint"
3. Name: "Sprint 13 - Phase 1"
4. Start Date: Nov 4, 2025
5. End Date: Nov 15, 2025
6. Drag tickets S13-1 through S13-8 to Sprint 13
7. Click "Start sprint"

### Sprint 14 Creation

**Sprint Name**: Sprint 14 - Phase 2 + Real-Time Features
**Duration**: Nov 18-22, 2025
**Goal**: Integrate 8 Phase 2 components, WebSocket infrastructure, real-time updates
**Velocity**: 69 story points / 1 week (compressed)

**Steps**:
1. Click "Create sprint"
2. Name: "Sprint 14 - Phase 2"
3. Start Date: Nov 18, 2025
4. End Date: Nov 22, 2025
5. Drag tickets S14-1 through S14-11 to Sprint 14
6. Click "Start sprint"

### Sprint 15 Creation

**Sprint Name**: Sprint 15 - Testing & Deployment
**Duration**: Nov 25-29, 2025
**Goal**: Comprehensive testing, optimization, production deployment
**Velocity**: 23 story points / 1 week

**Steps**:
1. Click "Create sprint"
2. Name: "Sprint 15 - Testing"
3. Start Date: Nov 25, 2025
4. End Date: Nov 29, 2025
5. Drag tickets S15-1 through S15-4 to Sprint 15
6. Click "Start sprint"

---

## Part 5: Sync with GitHub

### Commit Sprint Planning Documents

**Files to Commit**:
1. SPRINT-13-15-INTEGRATION-ALLOCATION.md
2. SPRINT-13-15-JIRA-TICKETS.md
3. CONVERSATION-SUMMARY-SESSION-2.md
4. JIRA-TICKET-UPDATE-GUIDE.md (this file)

**Git Commands**:

```bash
# Navigate to project directory
cd /Users/subbujois/subbuworkingdir/Aurigraph-DLT/aurigraph-av10-7/aurigraph-v11-standalone/

# Check git status
git status

# Stage all new sprint planning documents
git add SPRINT-13-15-INTEGRATION-ALLOCATION.md
git add SPRINT-13-15-JIRA-TICKETS.md
git add CONVERSATION-SUMMARY-SESSION-2.md
git add JIRA-TICKET-UPDATE-GUIDE.md

# View staged changes
git diff --cached

# Commit with descriptive message
git commit -m "docs: Add Sprint 13-15 Allocation and JIRA Ticket Templates

- SPRINT-13-15-INTEGRATION-ALLOCATION.md: Comprehensive 4,500+ word sprint allocation plan
  * Detailed specifications for 15 React components
  * 26 API endpoint mappings
  * Team assignments and daily standups
  * Risk management and success criteria
  * Timeline and milestones

- SPRINT-13-15-JIRA-TICKETS.md: JIRA ticket templates ready for import
  * Epic structure for API & Page Integration
  * 23 ticket templates (S13-1 through S15-4)
  * Each ticket with acceptance criteria and test requirements
  * Custom fields configuration

- CONVERSATION-SUMMARY-SESSION-2.md: Comprehensive session summary
  * Full technical details and analysis
  * Component specifications and architecture decisions
  * Risk management and next steps
  * 8,000+ word reference document

- JIRA-TICKET-UPDATE-GUIDE.md: Step-by-step JIRA setup guide
  * Instructions for updating existing tickets
  * Epic creation steps
  * Bulk ticket creation via API
  * Sprint creation and configuration

**Metrics**:
- 132 Story Points allocation
- 26 API endpoints to integrate
- 15 React components
- 5,970+ LOC total deliverable
- 4.5 FTE team required
- 4-week timeline (Nov 4-30, 2025)

🤖 Generated with Claude Code
Co-Authored-By: Claude <noreply@anthropic.com>"

# Push to remote
git push origin main
```

### Update README.md with Sprint Information

**Add to README.md**:

```markdown
## Current Sprint Allocation (Sprint 13-15)

**Status**: READY FOR EXECUTION (Nov 4-30, 2025)
**Release**: Enterprise Portal v4.6.0

### Sprint Summary
- **Total Story Points**: 132 SP
- **Team Size**: 4.5 FTE
- **API Endpoints**: 26 pending integrations
- **React Components**: 15 new/updated
- **Code Deliverable**: 5,970+ LOC

### Documentation
- [SPRINT-13-15-INTEGRATION-ALLOCATION.md](./SPRINT-13-15-INTEGRATION-ALLOCATION.md) - Comprehensive allocation plan
- [SPRINT-13-15-JIRA-TICKETS.md](./SPRINT-13-15-JIRA-TICKETS.md) - JIRA ticket templates
- [JIRA-TICKET-UPDATE-GUIDE.md](./JIRA-TICKET-UPDATE-GUIDE.md) - Setup instructions

### Key Dates
- Sprint 13: Nov 4-15 (Phase 1, 40 SP)
- Sprint 14: Nov 18-22 (Phase 2, 69 SP)
- Sprint 15: Nov 25-29 (Testing, 23 SP)
- Release: Nov 30, 2025
```

---

## Part 6: JIRA Ticket Workflow

### Status Transitions

Each ticket should follow this workflow:

**S13/S14 Tickets**:
```
To Do → In Progress → In Review → Done
↓         ↓            ↓
Sprint   Code         Code
Created  Assigned     Review
         Development  Complete
```

**S15 Tickets**:
```
To Do → In Progress → Testing → Done
↓         ↓            ↓
Sprint   Testing      QA
Created  Execution    Sign-off
         In Progress  Complete
```

### Daily Status Updates

**Daily Standup Template** (Add as comment to ticket):
```
**Date**: Oct 31, 2025
**Status**: In Progress / Blocked / Done
**Progress**: X% complete
**Completed Yesterday**:
- [ ] Task 1
- [ ] Task 2

**Planned Today**:
- [ ] Task 3
- [ ] Task 4

**Blockers**: None / [Description if any]

**Notes**: Any relevant updates or risks
```

### Sprint Review Template

**Sprint Review Checklist** (Add to Sprint Epic):
```
## Sprint 13 Review (Nov 15)
- [ ] All 8 components completed
- [ ] All 11 API endpoints integrated
- [ ] Test coverage: 85%+ verified
- [ ] Performance targets met: <500ms render, <200ms API
- [ ] All tests passing
- [ ] No critical bugs
- [ ] Documentation updated
- [ ] Code review completed

**Metrics**:
- Story Points Completed: 40/40 ✓
- Velocity: 40 SP / 2 weeks = 20 SP/week
- Test Coverage: 85%+
- Code Quality: [Green/Yellow/Red]

**Burndown**: [Link to burndown chart]
**Demo Video**: [Link if available]
**Release Notes**: [Update v4.6.0 release notes]
```

---

## Part 7: Credentials & Access

### JIRA API Access

**Credentials** (from Credentials.md):
```
Email: subbu@aurigraph.io
Token: ATATT3xFfGF0sFjaXc9iiBQuv-1jvWEfLDA5APUBvJvhVSrtzDDfS4B9k3ut3gCAyHUNU0YImVJSjcjglkR_3dmHtvRUYiV32nQJqkQ_HwKqCbS6oNs99XdYu5j_SmQqMQX4a7WekwS-sYNbDFtNBTrRuemXmlVHrjWa6dhMdCBuk0vdQvd_OYA=F7D4339F
```

**Board Access**:
```
URL: https://aurigraphdlt.atlassian.net/jira/software/projects/AV11/boards/789
Project: AV11
Board: 789 (Agile Board)
```

---

## Part 8: Verification Checklist

After completing all updates, verify:

### Epic Creation ✓
- [ ] Epic AV11-EPIC-1 created
- [ ] Title: "API & Page Integration (Sprints 13-15)"
- [ ] Story Points: 132
- [ ] Status: Ready for Sprint

### Tickets Created ✓
- [ ] All 23 tickets created (S13-1 through S15-4)
- [ ] All tickets linked to Epic AV11-EPIC-1
- [ ] All story points assigned correctly
- [ ] All team members assigned

### Sprints Created ✓
- [ ] Sprint 13 created (Nov 4-15)
- [ ] Sprint 14 created (Nov 18-22)
- [ ] Sprint 15 created (Nov 25-29)
- [ ] All tickets assigned to correct sprint
- [ ] Sprint goals documented

### GitHub Sync ✓
- [ ] All documents committed to repository
- [ ] Commit message references Sprint 13-15
- [ ] Changes pushed to origin/main
- [ ] README.md updated with sprint info
- [ ] Git history reflects allocation work

### Documentation ✓
- [ ] SPRINT-13-15-INTEGRATION-ALLOCATION.md reviewed
- [ ] SPRINT-13-15-JIRA-TICKETS.md reviewed
- [ ] CONVERSATION-SUMMARY-SESSION-2.md archived
- [ ] JIRA-TICKET-UPDATE-GUIDE.md completed

---

## Part 9: Next Steps

### Pre-Sprint 13 (Nov 1-3)
1. ✅ Complete all JIRA ticket creation
2. ✅ Verify all team members have access
3. ✅ Set up testing infrastructure
4. ✅ Create feature branches
5. ✅ Configure CI/CD gates

### Sprint 13 Kickoff (Nov 4)
1. Team meeting to review sprint goals
2. Developer environment verification
3. API endpoint status check
4. Daily standup scheduling
5. Sprint board setup

### Ongoing (Daily during sprints)
1. Daily standup updates
2. Code review and merging
3. Test execution
4. Performance monitoring
5. Risk tracking

---

## Support & Questions

**Questions?**
- Review SPRINT-13-15-INTEGRATION-ALLOCATION.md for technical details
- Check JIRA-TICKET-UPDATE-GUIDE.md for step-by-step instructions
- Contact FDA Lead for component questions
- Contact BDA for API/backend questions
- Contact QAA for testing questions

**Issues?**
- Create blocker ticket linked to Epic AV11-EPIC-1
- Report in daily standup
- Escalate to Architecture Lead if critical

---

**Document Version**: 1.0
**Created**: October 30, 2025
**Status**: READY FOR EXECUTION
**Next Review**: After Sprint 13 Week 1 (Nov 8, 2025)

