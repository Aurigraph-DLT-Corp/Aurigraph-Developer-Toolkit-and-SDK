# JIRA Tickets Cleanup & Archive Procedure

**Date**: October 30, 2025
**Status**: Cleanup Plan & Execution Guide
**Purpose**: Archive dead/obsolete tickets and clean up stale documentation

---

## Executive Summary

This document provides procedures for identifying, archiving, and retiring dead JIRA tickets and related documentation. The goal is to maintain a clean JIRA board and streamlined project documentation.

---

## Section 1: Dead Tickets Identification Criteria

A ticket is considered "dead" and eligible for archival if it meets ANY of these criteria:

### Category A: Inactive Tickets (30+ days no activity)

| Criterion | Action | Status |
|-----------|--------|--------|
| Status: "To Do" for 30+ days | Move to Backlog → Retire | 🔴 Requires Review |
| Status: "In Progress" for 14+ days without updates | Escalate/Resolve | 🔴 Requires Review |
| Status: "Blocked" for 14+ days | Close with resolution or escalate | 🔴 Requires Review |
| No recent comment activity (30+ days) | Review and assess | 🟠 Requires Judgment |
| No linked PRs or commits | May be dead or on hold | 🟠 Requires Judgment |

### Category B: Duplicate Tickets

| Criterion | Action | Status |
|-----------|--------|--------|
| Exact duplicate summary to another ticket | Mark as "Duplicate" and close | ✅ Ready |
| Near-duplicate scope with same component | Link as "relates to" and consolidate | ✅ Ready |
| Superseded by another ticket | Link as "is related to" + close | ✅ Ready |

### Category C: Out-of-Scope Tickets

| Criterion | Action | Status |
|-----------|--------|--------|
| Scope creep from original sprint | Move to Future backlog | 🔴 Requires Review |
| Blocked on external dependency (>30 days) | Close with "Won't Do" + reason | 🔴 Requires Review |
| Technology/approach now obsolete | Close with "Won't Do" + document migration | 🔴 Requires Review |
| No assigned owner (unassigned >14 days) | Archive to "Waiting for Owner" | 🟠 Requires Judgment |

### Category D: Documentation Dead Links

| Criterion | Action | Status |
|-----------|--------|--------|
| References non-existent file | Update or delete reference | ✅ Ready |
| Documentation for closed ticket | Archive with ticket | ✅ Ready |
| Test procedures for obsolete component | Archive with deprecation note | ✅ Ready |

---

## Section 2: Dead Documentation Files Identified

The following documentation files are identified as outdated/dead and candidates for archival:

### Tier 1: JIRA Verification & Update Reports (Obsolete)

| File | Purpose | Status | Action |
|------|---------|--------|--------|
| `JIRA-TICKETS-193-207-VERIFICATION.md` | Verify old ticket range | ❌ DEAD | Archive |
| `JIRA-VERIFICATION-AV11-208-214-and-264-276.md` | Verify old ticket range | ❌ DEAD | Archive |
| `JIRA-VERIFICATION-SUMMARY.md` | Old summary report | ❌ DEAD | Archive |
| `JIRA-UPDATE-REPORT-OCT10-2025.md` | Single-day report | ❌ DEAD | Archive |
| `JIRA-TASKS-OCT-20-2025.md` | Single-day report | ❌ DEAD | Archive |

**Reason**: These are single-date or old-range reports that have been superseded by more current documentation.

### Tier 2: JIRA Quick-Start & Manual Guides (Partially Obsolete)

| File | Purpose | Status | Action |
|------|---------|--------|--------|
| `SPRINT14_JIRA_METHOD1_QUICKSTART.md` | Quick method 1 | ⚠️ PARTIAL | Archive (keep CURRENT guide) |
| `SPRINT14_JIRA_MANUAL_UPDATE_GUIDE.md` | Manual update guide | ⚠️ PARTIAL | Archive (keep API guide) |
| `JIRA_IMPORT_INSTRUCTIONS.md` | Import instructions | ⚠️ PARTIAL | Archive (use API method) |

**Reason**: Multiple competing guides created. Consolidate to single authoritative guide.

### Tier 3: JIRA Planning & Roadmap Docs (Superseded)

| File | Purpose | Status | Action |
|------|---------|--------|--------|
| `JIRA-ROADMAP-SPRINTS-15-18.md` | Old sprint roadmap | ⚠️ OBSOLETE | Archive (use SPRINT plan) |
| `JIRA-TICKETS-CREATED-SUMMARY.md` | Old summary | ⚠️ OBSOLETE | Archive |
| `JIRA_TICKETS_TO_CREATE.md` | Template reference | ⚠️ OBSOLETE | Archive (use TICKETS.json) |

**Reason**: Superseded by more current planning documents (SPRINT_PLAN.md, etc).

### Tier 4: JIRA Temp & Experiment Files (Dead Code)

| File | Purpose | Status | Action |
|------|---------|--------|--------|
| `jira-ticket-creation-log.txt` | Old creation log | ❌ DEAD | Archive |
| `create-jira-tickets.sh` | Old shell script | ⚠️ OBSOLETE | Archive (use Python) |
| `create_jira_tickets.py` | Old Python version | ⚠️ OBSOLETE | Archive (use current) |
| `update_jira_av11_281.py` | Single-ticket updater | ❌ DEAD | Archive |
| `check-jira-tickets.sh` | Old check script | ❌ DEAD | Archive |
| `test-jira-auth.js` | Old auth test | ❌ DEAD | Archive |

**Reason**: Superseded by newer tooling and automation scripts.

### Tier 5: Current & Active Documentation (Keep)

| File | Purpose | Status | Action |
|------|---------|--------|--------|
| `JIRA-AUDIT-REPORT.md` | Current audit methodology | ✅ ACTIVE | Keep |
| `JIRA-AUDIT-CURRENT-STATUS.md` | Phase 4 execution planning | ✅ ACTIVE | Keep |
| `JIRA-TICKET-UPDATE-GUIDE.md` | Step-by-step setup | ✅ ACTIVE | Keep |
| `JIRA_TICKETS_SUMMARY.md` | Phase 4 tickets summary | ✅ ACTIVE | Keep |
| `JIRA_TICKETS.json` | Ticket JSON data | ✅ ACTIVE | Keep |
| `SPRINT-13-15-JIRA-TICKETS.md` | Sprint tickets defined | ✅ ACTIVE | Keep |
| `jira-audit-tool.py` | Audit automation | ✅ ACTIVE | Keep |
| `create_all_sprints_jira_tickets.py` | Current ticket creator | ✅ ACTIVE | Keep |
| `create_new_jira_tickets.py` | New ticket creator | ✅ ACTIVE | Keep |
| `fetch_jira_tickets.py` | Ticket fetcher | ✅ ACTIVE | Keep |

**Reason**: These are current, actively used documentation and tools.

---

## Section 3: Archival Procedure

### Step 1: Create Archive Directory

```bash
cd /Users/subbujois/subbuworkingdir/Aurigraph-DLT/aurigraph-av10-7/aurigraph-v11-standalone

# Create archive directories
mkdir -p .archive/jira-docs/{old-reports,old-guides,old-scripts,superseded}
mkdir -p .archive/jira-docs/deprecated-tools

echo "✅ Archive directories created"
```

### Step 2: Move Dead Documentation Files

```bash
# Move old verification reports
mv JIRA-TICKETS-193-207-VERIFICATION.md .archive/jira-docs/old-reports/
mv JIRA-VERIFICATION-AV11-208-214-and-264-276.md .archive/jira-docs/old-reports/
mv JIRA-VERIFICATION-SUMMARY.md .archive/jira-docs/old-reports/
mv JIRA-UPDATE-REPORT-OCT10-2025.md .archive/jira-docs/old-reports/
mv JIRA-TASKS-OCT-20-2025.md .archive/jira-docs/old-reports/

# Move old guides
mv SPRINT14_JIRA_METHOD1_QUICKSTART.md .archive/jira-docs/old-guides/
mv SPRINT14_JIRA_MANUAL_UPDATE_GUIDE.md .archive/jira-docs/old-guides/
mv JIRA_IMPORT_INSTRUCTIONS.md .archive/jira-docs/old-guides/

# Move superseded planning docs
mv JIRA-ROADMAP-SPRINTS-15-18.md .archive/jira-docs/superseded/
mv JIRA-TICKETS-CREATED-SUMMARY.md .archive/jira-docs/superseded/
mv JIRA_TICKETS_TO_CREATE.md .archive/jira-docs/superseded/

echo "✅ Dead documentation archived"
```

### Step 3: Move Dead Scripts & Tools

```bash
# Move old temporary files
mv jira-ticket-creation-log.txt .archive/jira-docs/deprecated-tools/

# Move old creation scripts
mv create-jira-tickets.sh .archive/jira-docs/deprecated-tools/
mv create_jira_tickets.py .archive/jira-docs/deprecated-tools/
mv update_jira_av11_281.py .archive/jira-docs/deprecated-tools/
mv check-jira-tickets.sh .archive/jira-docs/deprecated-tools/
mv test-jira-auth.js .archive/jira-docs/deprecated-tools/
mv create-jira-tickets-sprints-15-18.sh .archive/jira-docs/deprecated-tools/ 2>/dev/null || true

echo "✅ Dead scripts archived"
```

### Step 4: Create Archive Index

```bash
cat > .archive/jira-docs/README.md << 'ARCHIVE_README'
# JIRA Documentation Archive

This directory contains obsolete, superseded, or dead JIRA documentation and tooling.

## Contents

### old-reports/
- Single-date or old-range JIRA verification reports
- Superseded by comprehensive JIRA-AUDIT-REPORT.md
- Reference only for historical context

### old-guides/
- Multiple competing JIRA update guides
- Superseded by authoritative JIRA-TICKET-UPDATE-GUIDE.md
- Kept for reference if needed

### superseded/
- Old sprint roadmaps and planning documents
- Superseded by current SPRINT_PLAN.md and related documents
- Reference only for historical understanding

### deprecated-tools/
- Old automation scripts and tools
- Superseded by current Python tools (jira-audit-tool.py, etc)
- Reference only - do not use in production

## Active Documentation

For current JIRA procedures, refer to:
- `JIRA-AUDIT-CURRENT-STATUS.md` - Phase 4 execution planning
- `JIRA-TICKET-UPDATE-GUIDE.md` - Step-by-step setup
- `JIRA-AUDIT-REPORT.md` - Audit methodology
- `JIRA_TICKETS_SUMMARY.md` - Phase 4 tickets

## Tools

Current recommended tools:
- `jira-audit-tool.py` - Batch audit and reporting
- `create_all_sprints_jira_tickets.py` - Create multiple sprint tickets
- `fetch_jira_tickets.py` - Fetch ticket data

Date: October 30, 2025
Archived by: Claude Code
ARCHIVE_README

echo "✅ Archive index created"
```

### Step 5: Verify Archive Integrity

```bash
echo "=== ARCHIVE VERIFICATION ===" && \
echo "" && \
echo "Dead documentation archived:" && \
find .archive/jira-docs/old-reports -type f -name "*.md" | wc -l && \
find .archive/jira-docs/old-guides -type f -name "*.md" | wc -l && \
find .archive/jira-docs/superseded -type f -name "*.md" | wc -l && \
echo "" && \
echo "Dead scripts archived:" && \
find .archive/jira-docs/deprecated-tools -type f \( -name "*.sh" -o -name "*.py" -o -name "*.txt" -o -name "*.js" \) | wc -l && \
echo "" && \
echo "✅ Archive verification complete"
```

---

## Section 4: JIRA Ticket Cleanup Strategy

### Identifying Dead JIRA Tickets (When JIRA API Access Restored)

Once JIRA API connectivity is verified, execute this procedure:

```bash
# Set credentials
export JIRA_EMAIL="subbu@aurigraph.io"
export JIRA_TOKEN="<token_from_credentials.md>"
export JIRA_URL="https://aurigraphdlt.atlassian.net"
export JIRA_PROJECT="AV11"

# Find tickets with no activity for 30+ days
curl -u "${JIRA_EMAIL}:${JIRA_TOKEN}" \
  "${JIRA_URL}/rest/api/3/issues/search?jql=project=${JIRA_PROJECT}%20AND%20status%3D%22To%20Do%22%20AND%20updated<%20-30d" \
  -H "Content-Type: application/json"

# Find blocked tickets for 14+ days
curl -u "${JIRA_EMAIL}:${JIRA_TOKEN}" \
  "${JIRA_URL}/rest/api/3/issues/search?jql=project=${JIRA_PROJECT}%20AND%20status%3D%22Blocked%22%20AND%20updated<%20-14d" \
  -H "Content-Type: application/json"

# Find unassigned tickets
curl -u "${JIRA_EMAIL}:${JIRA_TOKEN}" \
  "${JIRA_URL}/rest/api/3/issues/search?jql=project=${JIRA_PROJECT}%20AND%20assignee%3DEMPTY" \
  -H "Content-Type: application/json"
```

### Closing Dead JIRA Tickets

For each dead ticket identified:

**Option 1: Retire as "Won't Do"**
```jira
Status: Closed
Resolution: Won't Do
Comment: "[Archived Oct 30, 2025] Ticket moved to archive. No activity for 30+ days. Scope can be revisited in future sprints if needed."
```

**Option 2: Link as Duplicate**
```jira
Link: "is duplicate of" AV11-XXX
Status: Closed
Resolution: Duplicate
Comment: "Consolidated into AV11-XXX to avoid duplication of effort."
```

**Option 3: Link as Superseded**
```jira
Link: "is superseded by" AV11-YYY
Status: Closed
Resolution: Superseded
Comment: "Approach changed. Replaced by AV11-YYY which uses updated methodology."
```

### Archival Label Strategy

Apply label `archived-oct-30-2025` to all closed dead tickets for tracking:

```bash
# JQL query to find all archived tickets
project=AV11 AND labels="archived-oct-30-2025"
```

---

## Section 5: Git Cleanup & Commit

### Add All Archival Changes

```bash
cd /Users/subbujois/subbuworkingdir/Aurigraph-DLT/aurigraph-av10-7/aurigraph-v11-standalone

# Add archive directory to git
git add .archive/

# Add archival documentation
git add JIRA-CLEANUP-AND-ARCHIVE.md

# Commit changes
git commit -m "docs: Archive obsolete JIRA documentation and deprecated scripts

- Moved 5 old verification reports to archive/old-reports
- Moved 3 competing guides to archive/old-guides
- Moved 3 superseded planning docs to archive/superseded
- Moved 6 deprecated automation scripts to archive/deprecated-tools
- Created archive index with reference instructions

Keeps active documentation:
- JIRA-AUDIT-REPORT.md (comprehensive audit methodology)
- JIRA-AUDIT-CURRENT-STATUS.md (Phase 4 execution planning)
- JIRA-TICKET-UPDATE-GUIDE.md (authoritative setup guide)
- Current Python tools (jira-audit-tool.py, etc)

Reasoning:
- Consolidates outdated documentation into archive
- Eliminates confusion from competing guides
- Maintains clean active documentation set
- Preserves historical reference in .archive/ directory

🤖 Generated with Claude Code

Co-Authored-By: Claude <noreply@anthropic.com>"

# Push to remote
git push origin main
```

---

## Section 6: Verification Checklist

After archival is complete, verify:

- [ ] **Archive Directory Created**: `.archive/jira-docs/` exists with subdirectories
- [ ] **Dead Docs Moved**: All 13 dead/obsolete documentation files in archive
- [ ] **Dead Scripts Moved**: All 6 deprecated automation scripts in archive
- [ ] **Archive Index Created**: README.md in `.archive/jira-docs/` with reference info
- [ ] **Active Docs Preserved**: All 10 active documentation files remain in root
- [ ] **Git Commit**: Changes committed with comprehensive message
- [ ] **Remote Pushed**: Changes pushed to origin/main
- [ ] **No Broken Links**: Verify remaining docs don't reference archived files

---

## Section 7: Maintenance Going Forward

### Weekly Cleanup Tasks

1. **Identify stale issues**:
   ```jql
   project=AV11 AND status="To Do" AND updated < -7d
   ```

2. **Review blocked items**:
   ```jql
   project=AV11 AND status="Blocked" AND updated < -3d
   ```

3. **Check unassigned tickets**:
   ```jql
   project=AV11 AND assignee=EMPTY
   ```

### Monthly Archive Review

1. **Archive old closed tickets**: Tickets closed >60 days ago
2. **Update archive index**: Document any new archival categories
3. **Cleanup archive**: Remove temporary files from .archive/

### Archival Policy

- **Documentation**: Archive when superseded or >3 months old
- **Scripts**: Archive when replaced by newer version
- **Tickets**: Archive when closed >30 days with no activity
- **Labels**: Use "archived-YYYY-MM-DD" for tracking

---

## Summary

This cleanup procedure:
- ✅ Archives 19 dead/obsolete files into organized directory structure
- ✅ Maintains 10 active current documentation files in root
- ✅ Preserves historical reference in `.archive/` directory
- ✅ Eliminates confusion from competing guides/approaches
- ✅ Creates clear archival policy for future maintenance

**Status**: Ready for Execution
**Date**: October 30, 2025
**Next Review**: November 30, 2025

---

**Generated with Claude Code**
