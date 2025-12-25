# JIRA Batch Update Execution Guide
**Sprint 19-23 Ticket Creation & Automation**

**Status**: ✅ Ready for execution  
**Timeline**: December 26, 2025, 10:00 AM EST  
**Total Tickets**: 110 (20 + 30 + 25 + 20 + 15)  
**Scope**: 5 sprints, 1 epic, comprehensive tracking  

---

## Overview

This guide explains how to execute the JIRA batch update that creates all 110 tickets for Sprints 19-23, organized across 5 concurrent sprints with comprehensive tracking and linking to PR #13.

### What Will Be Created

```
Epic: Sprint 19-23 Pre-Deployment Verification & Production Launch
├─ Sprint 19: Pre-Deployment Verification (20 tickets)
│  └─ Critical gate review, verification sections 1-9, team training
├─ Sprint 20: REST-gRPC Gateway & Performance (30 tickets)
│  └─ 10 Protocol Buffer definitions, 10 gRPC implementations, 10 performance optimizations
├─ Sprint 21: Enhanced Services (25 tickets)
│  └─ AI optimization (7), Cross-chain/Oracle (8), RWAT registry (10)
├─ Sprint 22: Multi-Cloud HA (20 tickets)
│  └─ AWS/Azure/GCP deployment (12), Production readiness (8)
└─ Sprint 23: Post-Launch Optimization (15 tickets)
   └─ Monitoring, optimization, migration, hardening, decommission planning
```

---

## Prerequisites

Before executing the JIRA batch update, ensure:

### 1. JIRA Access & Credentials
```bash
# Verify JIRA credentials are available
cat /Users/subbujois/Documents/GitHub/Aurigraph-DLT/doc/Credentials.md | grep -A5 "JIRA"

# You should see:
# - JIRA URL: https://aurigraphdlt.atlassian.net
# - Username: sjoish12@gmail.com
# - API Token: [token]
# - Project: AV11
```

**Load Credentials**:
```bash
# Option 1: Environment variable
export JIRA_API_TOKEN="<token from Credentials.md>"

# Option 2: Credential file (recommended for security)
cp /Users/subbujois/Documents/GitHub/Aurigraph-DLT/doc/Credentials.md ~/.jira/credentials
chmod 600 ~/.jira/credentials
```

### 2. API Rate Limiting
- JIRA Cloud allows 100 API calls/minute
- Script uses 0.5-second delays (120 calls/minute with buffer)
- 110 tickets will take ~1 minute to create

### 3. Project Board Access
- Ensure sjoish12@gmail.com has access to AV11 project
- Must have "Create Issue" permission
- Must have "Link Issues" permission

### 4. Team Availability
- Have Project Manager present for assignment decisions
- Have Tech Lead available for technical guidance
- Have Slack/email ready for team notifications

---

## Execution Steps

### Step 1: Prepare Environment (5 minutes)

```bash
# Navigate to Aurigraph repo
cd /Users/subbujois/subbuworkingdir/Aurigraph-DLT

# Verify script exists
ls -la scripts/ci-cd/jira-batch-update-sprint-19-23.sh

# Make script executable
chmod +x scripts/ci-cd/jira-batch-update-sprint-19-23.sh

# Load JIRA credentials
export JIRA_API_TOKEN="$(cat /Users/subbujois/Documents/GitHub/Aurigraph-DLT/doc/Credentials.md | grep 'API Token' | cut -d':' -f2 | xargs)"

# Verify credentials loaded
if [ -z "$JIRA_API_TOKEN" ]; then
  echo "❌ JIRA_API_TOKEN not set"
  exit 1
else
  echo "✅ JIRA_API_TOKEN loaded (length: ${#JIRA_API_TOKEN})"
fi
```

### Step 2: Dry Run (Testing Only) - 10 minutes

**CRITICAL**: Always run dry-run first to verify script works without making changes

```bash
# Run in dry-run mode (no actual JIRA changes)
./scripts/ci-cd/jira-batch-update-sprint-19-23.sh --dry-run

# Expected output:
# [INFO] Validating JIRA credentials...
# [SUCCESS] JIRA API authentication successful
# [INFO] Fetching project board...
# [SUCCESS] Board ID: 789
# [INFO] Creating Epic: Sprint 19-23 Pre-Deployment Verification & Production Launch
# [SUCCESS] Epic created: AV11-500
# [INFO] ====================================================
# [INFO] SPRINT 19: Pre-Deployment Verification (20 tickets)
# ... (20 tickets would be created)
# [INFO] Total tickets created: 110
# [WARN] Dry run completed - no actual changes made to JIRA

# Save output for review
./scripts/ci-cd/jira-batch-update-sprint-19-23.sh --dry-run > /tmp/jira-dry-run.log 2>&1
cat /tmp/jira-dry-run.log | head -50  # Review first 50 lines
```

**Verification Checklist**:
- [ ] Script runs without errors
- [ ] All 110 tickets are created (in dry-run)
- [ ] Epic is created with correct name
- [ ] All 5 sprints are represented
- [ ] No API errors in output

### Step 3: Debug Mode (Optional) - 5 minutes

If you want to see detailed API calls:

```bash
# Run with debug output
./scripts/ci-cd/jira-batch-update-sprint-19-23.sh --debug 2>&1 | tee /tmp/jira-debug.log

# Check for issues
grep -i "error\|fail" /tmp/jira-debug.log

# Review API payloads
grep "JIRA API:" /tmp/jira-debug.log | head -10
```

### Step 4: Actual Execution (10-15 minutes)

Once dry-run passes, execute for real:

```bash
# Final confirmation
read -p "Create 110 JIRA tickets for Sprints 19-23? (yes/no): " confirm
if [ "$confirm" != "yes" ]; then
  echo "Aborted."
  exit 1
fi

# Execute actual batch update
echo "Starting JIRA batch update at $(date)"
./scripts/ci-cd/jira-batch-update-sprint-19-23.sh 2>&1 | tee /tmp/jira-execution.log

# Monitor progress
tail -f /tmp/jira-execution.log
```

**Expected Output**:
```
[INFO] ======================================================
[INFO] JIRA Batch Update - Sprint 19-23
[INFO] ======================================================
[SUCCESS] JIRA API authentication successful
[SUCCESS] Board ID: 789
[SUCCESS] Epic created: AV11-500
[SUCCESS] Issue created: AV11-501
[SUCCESS] Issue created: AV11-502
... (110 tickets)
[INFO] ======================================================
[INFO] JIRA Batch Update Complete
[INFO] ======================================================
[SUCCESS] Total tickets created: 110
[SUCCESS] Epic: AV11-500
```

### Step 5: Post-Execution Verification (10 minutes)

```bash
# 1. Check JIRA for created tickets
curl -s -X GET "https://aurigraphdlt.atlassian.net/rest/api/3/search?jql=epic=AV11-500" \
  -H "Authorization: Basic $(echo -n "$API_USER:$JIRA_API_TOKEN" | base64)" | jq '.total'
# Should show: 111 (1 epic + 110 tickets)

# 2. Verify ticket count by sprint
for sprint in 19 20 21 22 23; do
  count=$(curl -s -X GET "https://aurigraphdlt.atlassian.net/rest/api/3/search?jql=sprint=\"Sprint $sprint\" AND project=AV11" \
    -H "Authorization: Basic $(echo -n "$API_USER:$JIRA_API_TOKEN" | base64)" | jq '.total')
  echo "Sprint $sprint: $count tickets"
done

# 3. Link PR #13 to infrastructure tickets
# PR: https://github.com/Aurigraph-DLT-Corp/Aurigraph-DLT/pull/13
# Tickets: AV11-501 to AV11-520 (Sprint 19 infrastructure)

for ticket_num in {501..520}; do
  curl -s -X POST "https://aurigraphdlt.atlassian.net/rest/api/3/issue/AV11-$ticket_num/remotelink" \
    -H "Authorization: Basic $(echo -n "$API_USER:$JIRA_API_TOKEN" | base64)" \
    -H "Content-Type: application/json" \
    -d '{
      "globalId": "github-pr-13",
      "application": {"type": "GitHub", "name": "GitHub"},
      "relationship": "relates to",
      "object": {
        "url": "https://github.com/Aurigraph-DLT-Corp/Aurigraph-DLT/pull/13",
        "title": "Sprint 19 Infrastructure Commit"
      }
    }' > /dev/null
  echo "Linked AV11-$ticket_num"
done
```

---

## Rollback Procedure

If something goes wrong, you can delete all created tickets:

```bash
# WARNING: This deletes all Sprint 19-23 tickets created today
# Make sure before running!

# Find all tickets linked to epic AV11-500
curl -s -X GET "https://aurigraphdlt.atlassian.net/rest/api/3/search?jql=epic=AV11-500&maxResults=200" \
  -H "Authorization: Basic $(echo -n "$API_USER:$JIRA_API_TOKEN" | base64)" | \
  jq '.issues[].key' | while read ticket; do
    echo "Deleting $ticket..."
    curl -s -X DELETE "https://aurigraphdlt.atlassian.net/rest/api/3/issue/$ticket" \
      -H "Authorization: Basic $(echo -n "$API_USER:$JIRA_API_TOKEN" | base64)"
    sleep 0.5
  done

# Delete the epic
curl -s -X DELETE "https://aurigraphdlt.atlassian.net/rest/api/3/issue/AV11-500" \
  -H "Authorization: Basic $(echo -n "$API_USER:$JIRA_API_TOKEN" | base64)"
```

---

## Ticket Assignment After Creation

After tickets are created, assign them to team members:

```bash
# Assignment matrix
# Sprint 19: Project Manager (PM)
# Sprint 20: Tech Lead (TL) + Backend engineers (3x)
# Sprint 21: Backend engineers (3x)
# Sprint 22: DevOps engineer + Backend (1x)
# Sprint 23: Tech Lead + Backend (2x)

# Example assignment (using JIRA API)
assign_ticket() {
  local ticket=$1
  local assignee=$2
  
  curl -s -X PUT "https://aurigraphdlt.atlassian.net/rest/api/3/issue/$ticket/assignee" \
    -H "Authorization: Basic $(echo -n "$API_USER:$JIRA_API_TOKEN" | base64)" \
    -H "Content-Type: application/json" \
    -d "{\"accountId\": \"$assignee\"}"
}

# Assign Sprint 19 tickets to PM
assign_ticket "AV11-501" "$PM_JIRA_ID"
assign_ticket "AV11-502" "$PM_JIRA_ID"
# ... etc

# Assign Sprint 20 tickets (protocol buffers) to Tech Lead
for i in {503..512}; do
  assign_ticket "AV11-$i" "$TL_JIRA_ID"
done
```

---

## Team Notification

Once tickets are created, notify the team:

```bash
# Use the provided email template from SPRINT-19-TEAM-COMMUNICATION-TEMPLATES.md
# Subject: "✅ JIRA Tickets Ready: Sprint 19-23 Assignments"

# Key points to include:
# - Epic AV11-500 created
# - 110 tickets across 5 sprints
# - Assignment will be done by PM
# - Start execution date: Jan 1, 2026 (after Sprint 19 gate)
# - Go-live date: Feb 15, 2026

# Send email
cat > /tmp/jira-notification.txt <<'EOF'
Subject: ✅ JIRA Tickets Ready: Sprint 19-23 Assignments

Team,

All 110 JIRA tickets have been created for Sprints 19-23:

Epic: AV11-500 - Sprint 19-23 Pre-Deployment Verification & Production Launch

Breakdown:
- Sprint 19: 20 tickets (Pre-deployment verification)
- Sprint 20: 30 tickets (REST-gRPC gateway)
- Sprint 21: 25 tickets (Enhanced services)
- Sprint 22: 20 tickets (Multi-cloud HA)
- Sprint 23: 15 tickets (Post-launch optimization)

Next steps:
1. Review your assigned tickets in JIRA
2. Start date: Jan 1, 2026 (after Sprint 19 critical gate)
3. Go-live date: Feb 15, 2026
4. All requirements documented in JIRA and confluence

Questions? Contact [PM Name]

Full timeline available at: docs/sprints/SPRINT-20-23-GOVERNANCE-AND-EXECUTION-FRAMEWORK.md
EOF

mail -s "✅ JIRA Tickets Ready: Sprint 19-23 Assignments" team@aurigraph.io < /tmp/jira-notification.txt
```

---

## Troubleshooting

### Issue 1: Authentication Failed
```bash
# Error: "JIRA API authentication failed (HTTP 401)"

# Check:
1. Token is valid and not expired
2. User has API access enabled
3. Credentials are correct

# Fix:
export JIRA_API_TOKEN="<fresh token from https://aurigraphdlt.atlassian.net/settings/tokens>"
```

### Issue 2: Project Not Found
```bash
# Error: "Failed to create issue" or "Invalid project key"

# Check:
1. AV11 project exists
2. User has access to AV11 project

# Verify:
curl -s -X GET "https://aurigraphdlt.atlassian.net/rest/api/3/project/AV11" \
  -H "Authorization: Basic $(echo -n "$API_USER:$JIRA_API_TOKEN" | base64)"
```

### Issue 3: Rate Limiting
```bash
# Error: "HTTP 429 - Too Many Requests"

# Fix: Script already has 0.5-second delays
# If still happening, increase delays:
# Find line "sleep 0.5" and change to "sleep 1.0"
```

### Issue 4: API Token Expired
```bash
# Error: "JIRA API authentication failed"

# Generate new token:
# 1. Go to: https://aurigraphdlt.atlassian.net/secure/ViewProfile.jspa
# 2. Click "API Tokens"
# 3. Create new token
# 4. Update in Credentials.md
# 5. Export new token: export JIRA_API_TOKEN="..."
```

---

## Success Criteria

✅ Execution is successful when:

1. All 110 tickets are created
2. Epic AV11-500 is created and linked
3. All tickets have correct sprint assignment
4. No authentication errors in logs
5. Tickets are visible in JIRA UI
6. Team receives notification
7. Rollback procedure is documented (in case needed)

---

## Execution Timeline

```
Dec 26, 2025 @ 10:00 AM EST
├─ 10:00-10:05 | Prepare environment & load credentials
├─ 10:05-10:15 | Dry-run execution & verification
├─ 10:15-10:20 | Debug mode (if needed) & fix issues
├─ 10:20-10:35 | Actual batch update execution
├─ 10:35-10:45 | Post-execution verification
└─ 10:45-11:00 | Team notification & assignment setup

TOTAL TIME: 45-60 minutes
```

---

## Documentation & References

- **Execution Guide**: This document
- **Governance Framework**: `docs/sprints/SPRINT-20-23-GOVERNANCE-AND-EXECUTION-FRAMEWORK.md`
- **Team Communication**: `docs/sprints/SPRINT-19-TEAM-COMMUNICATION-TEMPLATES.md`
- **Critical Fixes**: `docs/sprints/SPRINT-19-CRITICAL-FIXES-REQUIRED.md`
- **Script Source**: `scripts/ci-cd/jira-batch-update-sprint-19-23.sh`

---

**Prepared by**: Project Architect  
**Date**: December 25, 2025  
**Status**: ✅ Ready for Dec 26, 10:00 AM execution  
**Next Review**: Dec 26, 11:00 AM (post-execution verification)  
