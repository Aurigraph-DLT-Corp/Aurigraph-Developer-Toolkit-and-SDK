# JIRA Admin Quick Start - Sprint 13-15 Setup
**Date**: November 1, 2025
**Task**: Create Epic + 3 Sprints + 23 JIRA Tickets
**Timeline**: 2-3 hours
**Deadline**: End of Business Today (Nov 1)

---

## 🚀 Quick Summary

You need to create JIRA infrastructure for 3 development sprints. Everything is pre-specified - you just need to execute the steps below.

**Deliverables**:
- ✅ 1 Epic: "API & Page Integration (Sprints 13-15)"
- ✅ 3 Sprints: Sprint 13, 14, 15
- ✅ 23 JIRA Tickets with full specifications
- ✅ Team member assignments
- ✅ Team notifications

**Success Criteria**:
- All tickets visible in JIRA backlog ✅
- All team members assigned to their tickets ✅
- Team notified of assignment ✅

---

## 📋 Pre-Flight Checklist

Before you start, verify:
- [ ] You have JIRA Admin access to https://aurigraphdlt.atlassian.net
- [ ] Project AV11 is accessible
- [ ] You can create issues (Epic, Story types)
- [ ] You have the team member list (provided below)
- [ ] You have SPRINT-13-15-JIRA-SETUP-SCRIPT.md open in another tab

---

## ⏱️ Timeline Estimate

| Step | Duration | Time Remaining |
|------|----------|-----------------|
| Create Epic | 15 min | 2:45 |
| Create 3 Sprints | 15 min | 2:30 |
| Create 23 Tickets | 90 min | 1:00 |
| Assign Team Members | 20 min | 0:40 |
| Send Notifications | 10 min | 0:30 |
| **TOTAL** | **2.5 hours** | Done! |

---

## 👥 Team Members & Assignments

### Development Team (7 members)

| Role | Name | Email | Assignment |
|------|------|-------|------------|
| Frontend Lead (FDA) | [Name] | [Email] | Sprint 13-15 Architect |
| Junior Dev 1 (FDA Jr) | [Name] | [Email] | Sprint 13 (2-3 components) |
| Junior Dev 2 (FDA Jr) | [Name] | [Email] | Sprint 13 (2-3 components) |
| Developer 1 (FDA Dev) | [Name] | [Email] | Sprint 13-14 (3-4 components) |
| Developer 2 (FDA Dev) | [Name] | [Email] | Sprint 13-14 (3-4 components) |
| QA Lead (QAA) | [Name] | [Email] | Sprint 15 (Testing Lead) |
| DevOps Lead (DOA) | [Name] | [Email] | Sprint 15 (Documentation) |

**Action**: Update the names and emails above with actual team members before assigning tickets.

---

## 🎯 Step-by-Step Execution

### Step 1: Create Epic (15 min)

**Location**: https://aurigraphdlt.atlassian.net/jira/software/projects/AV11/boards

1. Click "Create Issue" button (top-left)
2. Select Issue Type: **Epic**
3. Fill in form:
   - **Summary**: `API & Page Integration (Sprints 13-15)`
   - **Description**: (Copy from SPRINT-13-15-JIRA-SETUP-SCRIPT.md, Step 1)
   - **Story Points**: 132
   - **Start Date**: 2025-11-04
   - **Target Date**: 2025-11-29
4. Click "Create" button
5. **SAVE THE EPIC KEY** (e.g., AV11-500) - You'll need it for all 23 tickets

✅ **Success**: Epic created and visible in backlog

---

### Step 2: Create 3 Sprints (15 min)

**Location**: https://aurigraphdlt.atlassian.net/jira/software/projects/AV11/backlog

1. Click "Create Sprint" button
2. **Sprint 13: Phase 1 High-Priority Components**
   - Start: 2025-11-04
   - End: 2025-11-15
   - Capacity: 40 story points
   - Click "Create"

3. Click "Create Sprint" button again
4. **Sprint 14: Phase 2 Extended Components + WebSocket**
   - Start: 2025-11-18
   - End: 2025-11-22
   - Capacity: 69 story points
   - Click "Create"

5. Click "Create Sprint" button again
6. **Sprint 15: Testing, Optimization & Release**
   - Start: 2025-11-25
   - End: 2025-11-29
   - Capacity: 23 story points
   - Click "Create"

✅ **Success**: All 3 sprints visible in backlog

---

### Step 3: Create 23 JIRA Tickets (90 min)

**Location**: Same as above (Backlog view)

Use the complete ticket specifications from **SPRINT-13-15-JIRA-SETUP-SCRIPT.md** (Step 3, lines 100-500)

**For each ticket**:
1. Click "Create Issue" button
2. Issue Type: **Story**
3. Fill in:
   - **Summary**: Ticket name (e.g., "Network Topology Page")
   - **Description**: Acceptance criteria (from script)
   - **Story Points**: Points value (from script)
   - **Epic Link**: Select the Epic you created above
   - **Sprint**: Select appropriate sprint (13, 14, or 15)
   - **Assignee**: Team member (from assignment list)
4. Click "Create" button

**Quick Reference - Ticket Count by Sprint**:
- Sprint 13: 8 tickets (lines 100-300 in script)
- Sprint 14: 11 tickets (lines 300-600 in script)
- Sprint 15: 4 tickets (lines 600-700 in script)

**Pro Tip**: Use browser's "Back" button after creating each ticket to return to backlog. Don't refresh - it keeps you in the right view.

✅ **Success**: All 23 tickets created and assigned to correct sprints

---

### Step 4: Assign Team Members (20 min)

**Location**: Backlog view (after creating all tickets)

For each ticket:
1. Click the ticket title to open details
2. Find **Assignee** field
3. Click and select team member from dropdown
4. Assign based on story points and team capacity:
   - **Sprint 13** (40 SP total):
     - Junior Dev 1: 6-8 SP
     - Junior Dev 2: 6-8 SP
     - Developer 1: 12-14 SP
     - Developer 2: 12-14 SP
   - **Sprint 14** (69 SP total):
     - Developer 1: 20-25 SP
     - Developer 2: 20-25 SP
     - Frontend Lead: 20-25 SP (oversight)
   - **Sprint 15** (23 SP total):
     - QA Lead: 15 SP (testing lead)
     - DevOps Lead: 8 SP (documentation)

5. Close each ticket (Escape key)

✅ **Success**: All team members assigned to their tickets

---

### Step 5: Send Team Notifications (10 min)

**Option A**: Via JIRA (Automated)
1. Go to each sprint view
2. Click "Start Sprint" (if ready)
3. JIRA auto-notifies assigned members

**Option B**: Via Email (Manual - Recommended)
Send email to team with:

```
Subject: JIRA Assignment - Sprint 13-15 Development (Nov 4-29)

Hi Team,

Your JIRA tickets for Sprint 13-15 have been created and assigned.

Access your assignments here:
https://aurigraphdlt.atlassian.net/jira/software/projects/AV11/boards

Sprint 13: Nov 4-15 (Phase 1 - High Priority Components)
Sprint 14: Nov 18-22 (Phase 2 - Extended + WebSocket)
Sprint 15: Nov 25-29 (Testing, Optimization & Release)

Next Steps:
1. Review your assigned tickets
2. Attend team training Nov 2, 10:00 AM
3. Final validation Nov 3, 9:00 AM
4. Kickoff meeting Nov 4, 9:00 AM

Questions? Reach out to [Frontend Lead]

Thanks!
```

✅ **Success**: Team notified and ready to proceed

---

## ✅ Completion Checklist

After completing all steps above, verify:

### Infrastructure
- [ ] Epic created: "API & Page Integration (Sprints 13-15)"
- [ ] Epic key saved (e.g., AV11-500)
- [ ] Sprint 13 created with dates Nov 4-15
- [ ] Sprint 14 created with dates Nov 18-22
- [ ] Sprint 15 created with dates Nov 25-29
- [ ] All 23 tickets created and visible in backlog
- [ ] All tickets linked to Epic

### Assignments
- [ ] All tickets assigned to team members
- [ ] Sprint 13 capacity balanced (40 SP distributed)
- [ ] Sprint 14 capacity balanced (69 SP distributed)
- [ ] Sprint 15 capacity assigned (23 SP distributed)
- [ ] No team member overloaded (max 25 SP per sprint)

### Notifications
- [ ] Team notified of JIRA assignments
- [ ] Team notified of training schedule (Nov 2)
- [ ] Team notified of validation schedule (Nov 3)
- [ ] Team notified of kickoff schedule (Nov 4)

---

## 🆘 Troubleshooting

### Problem: Can't find "Create Issue" button
**Solution**: You're in the wrong view. Go to: https://aurigraphdlt.atlassian.net/jira/software/projects/AV11/backlog

### Problem: Epic not showing in dropdown when creating ticket
**Solution**:
1. Make sure you created the Epic first
2. Wait 30 seconds for JIRA to sync
3. Refresh browser
4. Try again

### Problem: Sprints not showing when selecting sprint for ticket
**Solution**:
1. Make sure you created the sprint in Backlog view
2. Refresh the browser
3. Try creating the ticket again

### Problem: Can't assign team member
**Solution**:
1. Make sure they are added to the AV11 project
2. Check spelling of their email
3. Contact your JIRA administrator if they don't appear in dropdown

### Problem: Running behind schedule
**Solution**:
- You don't need to create descriptions - just the required fields
- Use copy-paste for similar tickets (saves time)
- Batch-create similar tickets before moving to next sprint
- You can add more details later

---

## 📞 Quick Help

**Need the detailed ticket specifications?**
→ See SPRINT-13-15-JIRA-SETUP-SCRIPT.md (Step 3)

**Need the sprint dates and configuration?**
→ See SPRINT-13-15-JIRA-SETUP-SCRIPT.md (Step 2)

**Need team member contact info?**
→ See SPRINT-13-15-TEAM-HANDOFF.md

**Need general execution overview?**
→ See SPRINT-13-15-FINAL-STATUS.md

**Need operational procedures?**
→ See SPRINT-13-15-OPERATIONAL-HANDBOOK.md

---

## 🎉 Success Criteria

You've completed your task when:

✅ All 23 tickets are created and visible in JIRA backlog
✅ All tickets are linked to the Epic
✅ All tickets are assigned to correct sprints
✅ All tickets are assigned to team members
✅ Team has been notified
✅ Development team can start training on Nov 2

---

## 📝 Final Notes

- **Save your work frequently** - JIRA auto-saves, but refresh occasionally to verify
- **Don't stress about perfect descriptions** - You can edit tickets later if needed
- **Focus on speed** - This is set-and-go infrastructure
- **You've got 2-3 hours** - Plenty of time if you stay focused
- **This enables the whole team** - Your work unblocks 7 developers for 4 weeks

---

## ✨ You're All Set!

Everything you need is provided above. Just follow the steps in order, and you'll have Sprint 13-15 JIRA infrastructure ready by EOD today.

**Questions?** Contact [Project Manager]

**Ready to start?** Open https://aurigraphdlt.atlassian.net/jira/software/projects/AV11/boards and begin!

🚀 **Target completion: 2-3 hours from now (EOD Nov 1)**

---

**Document**: JIRA-ADMIN-QUICK-START.md
**Date**: November 1, 2025
**Status**: Ready to execute
**Next Review**: After completion on Nov 1
