# GitHub-JIRA Synchronization Setup Guide

## Overview

This guide explains how to set up bidirectional synchronization between GitHub and JIRA for the Aurigraph V11 project.

**Features**:
- ✅ Sync JIRA tickets to GitHub issues
- ✅ Create GitHub milestones from JIRA epics
- ✅ Automatic status updates
- ✅ Bidirectional linking
- ✅ Label mapping (type, priority, status)
- ✅ Automated workflow via GitHub Actions

---

## Prerequisites

### 1. GitHub Personal Access Token

**Required for GitHub sync to work**

#### Creating a Token

1. Go to GitHub Settings: https://github.com/settings/tokens
2. Click "Generate new token (classic)"
3. Set expiration to "No expiration" or "1 year"
4. Select the following scopes:
   - ✅ `repo` (Full control of private repositories)
   - ✅ `workflow` (Update GitHub Action workflows)
   - ✅ `admin:org` → `read:org` (Read org membership)
   - ✅ `project` (Full control of projects)
5. Click "Generate token"
6. **Copy the token immediately** (you won't see it again)

#### Setting the Token

**Local Development**:
```bash
export GITHUB_TOKEN="ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"

# Add to your shell profile for persistence
echo 'export GITHUB_TOKEN="ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"' >> ~/.zshrc
source ~/.zshrc
```

**GitHub Actions** (already configured):
- Token is automatically provided as `secrets.GITHUB_TOKEN`
- No additional setup needed

### 2. JIRA API Token

**Already configured** ✅

- **Email**: subbu@aurigraph.io
- **Token**: Stored in scripts
- **Project**: AV11
- **Board**: https://aurigraphdlt.atlassian.net/jira/software/projects/AV11/boards/789

---

## Quick Start

### Option 1: Manual Sync (Immediate)

```bash
cd /Users/subbujois/Documents/GitHub/Aurigraph-DLT/aurigraph-av10-7/aurigraph-v11-standalone

# Set GitHub token (required)
export GITHUB_TOKEN="ghp_your_token_here"

# Run sync
chmod +x sync-github-jira.sh
./sync-github-jira.sh
```

**What it does**:
1. Fetches all JIRA tickets from project AV11 (since Sept 1, 2025)
2. Creates or updates corresponding GitHub issues
3. Maps JIRA labels to GitHub labels
4. Links epics to child tasks
5. Syncs status (open/closed)

**Output**:
```
==========================================
GitHub-JIRA Synchronization Tool
==========================================

JIRA Project: AV11
GitHub Repo: Aurigraph-DLT-Corp/Aurigraph-DLT

✅ GitHub token configured

📥 Fetching JIRA issues...
   Fetched 50 of 160 issues
   Fetched 100 of 160 issues
   Fetched 160 of 160 issues

📊 Total JIRA issues: 160

   Epics: 34
   Tasks/Stories: 126

🔄 Syncing to GitHub...

[1/160] Syncing AV11-1: [EPIC] V11 Java/Quarkus/GraalVM Platform
   ✅ Created GitHub issue #1 for AV11-1
...
```

### Option 2: GitHub Actions (Automatic)

**Workflow is already set up** at `.github/workflows/github-jira-sync.yml`

#### Triggering the Workflow

1. **Automatic triggers**:
   - On push to `main`, `develop`, or `sprints-*` branches
   - On pull request events
   - On issue events (create, edit, close)

2. **Manual trigger**:
   - Go to: https://github.com/Aurigraph-DLT-Corp/Aurigraph-DLT/actions
   - Select "GitHub-JIRA Bidirectional Sync"
   - Click "Run workflow"
   - Choose sync type:
     - `full` - Complete bidirectional sync
     - `jira_to_github` - JIRA → GitHub only
     - `github_to_jira` - GitHub → JIRA only
     - `epics_only` - Create milestones from epics
     - `recent_only` - Sync recent changes only

---

## Sync Behavior

### JIRA to GitHub Mapping

| JIRA Field | GitHub Field | Example |
|------------|--------------|---------|
| Key | Label | `jira:AV11-163` |
| Summary | Title | `[AV11-163] V3.6 Multi-Node Architecture` |
| Description | Body | Full description + JIRA link |
| Status | State + Label | `open` + `status:in-progress` |
| Issue Type | Label | `type:epic`, `type:task`, `type:story` |
| Priority | Label | `priority:high`, `priority:critical` |
| Parent Epic | Milestone | Epic name as milestone |
| Labels | Labels | `jira-label:*` prefix |

### GitHub to JIRA Creation

When a new GitHub issue is created **without** a `jira:` label:
- Automatically creates corresponding JIRA task
- Adds `github-sync` label in JIRA
- Links back to GitHub issue in description

### Status Synchronization

| JIRA Status | GitHub State |
|-------------|--------------|
| To Do | Open |
| In Progress | Open |
| Done | Closed |
| Closed | Closed |
| Resolved | Closed |

---

## Configuration

### Environment Variables

```bash
# Required for GitHub sync
export GITHUB_TOKEN="ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"

# Optional overrides (defaults shown)
export JIRA_USER="subbu@aurigraph.io"
export JIRA_URL="https://aurigraphdlt.atlassian.net"
export PROJECT_KEY="AV11"
export GITHUB_REPO="Aurigraph-DLT-Corp/Aurigraph-DLT"
```

### GitHub Actions Secrets

Set these in repository settings → Secrets and variables → Actions:

| Secret Name | Value | Status |
|-------------|-------|--------|
| `JIRA_USER` | subbu@aurigraph.io | ✅ Set |
| `JIRA_TOKEN` | ATATT3xFfGF0c79X... | ✅ Set |
| `GITHUB_TOKEN` | Auto-provided | ✅ Default |

---

## Usage Examples

### Example 1: Full Sync

```bash
# Sync all JIRA tickets to GitHub
export GITHUB_TOKEN="ghp_your_token"
./sync-github-jira.sh
```

**Result**: Creates/updates ~160 GitHub issues from JIRA tickets

### Example 2: Check Sync Status

```bash
# View synced issues
gh issue list --label "jira:AV11-163"

# View all JIRA-synced issues
gh issue list --label "jira:"
```

### Example 3: Manual GitHub Issue Creation

```bash
# Create GitHub issue that will sync to JIRA
gh issue create \
  --title "New feature request" \
  --body "Description here" \
  --label "type:task"

# Workflow will automatically create JIRA ticket
```

### Example 4: Epic to Milestone Sync

Epics are automatically converted to GitHub milestones:

```bash
# View milestones
gh api repos/Aurigraph-DLT-Corp/Aurigraph-DLT/milestones

# Each JIRA epic becomes a milestone
# Example: [AV11-163] V3.6 Multi-Node Production Architecture Release
```

---

## Verification

### Verify GitHub Issues

```bash
# List all synced issues
gh issue list --label "jira:" --limit 50

# Check specific JIRA ticket
gh issue list --search "AV11-163"

# View issue details
gh issue view 1
```

### Verify JIRA Tickets

```bash
# List JIRA tickets with GitHub sync
curl -s -u "subbu@aurigraph.io:$JIRA_TOKEN" \
  -H "Content-Type: application/json" \
  -X POST "https://aurigraphdlt.atlassian.net/rest/api/3/search/jql" \
  -d '{"jql":"project=AV11 AND labels=github-sync"}' | jq '.issues[].key'
```

### Verify Milestones

```bash
# List all milestones
gh api repos/Aurigraph-DLT-Corp/Aurigraph-DLT/milestones \
  --jq '.[] | "\(.number): \(.title) (\(.state))"'
```

---

## Troubleshooting

### Issue: "GITHUB_TOKEN not set"

**Solution**:
```bash
# Generate token at https://github.com/settings/tokens
export GITHUB_TOKEN="ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
```

### Issue: "API rate limit exceeded"

**Solution**:
- GitHub API has rate limits (5,000 requests/hour for authenticated)
- Script includes 1-second delays between requests
- If syncing many issues, run in batches

### Issue: "401 Unauthorized" from JIRA

**Solution**:
- Verify JIRA token is correct
- Check JIRA email: should be `subbu@aurigraph.io`
- Token may have expired - generate new one

### Issue: GitHub issue not created

**Checklist**:
1. ✅ GITHUB_TOKEN is set and valid
2. ✅ Token has `repo` scope
3. ✅ Repository name is correct: `Aurigraph-DLT-Corp/Aurigraph-DLT`
4. ✅ No rate limiting (wait and retry)

---

## Advanced Usage

### Filter by Date

Edit `sync-github-jira.sh` line 122:
```javascript
const jql = `project=${PROJECT_KEY} AND created>="2025-09-01" ORDER BY created ASC`;
//                                              ^^^^^^^^^^^ Change this date
```

### Custom Label Mapping

Edit the `createGitHubIssue` function in `sync-github-jira.sh`:
```javascript
const labels = [
  `jira:${jiraKey}`,
  `type:${fields.issuetype.name.toLowerCase()}`,
  `status:${fields.status.name.toLowerCase().replace(/\s+/g, '-')}`,
  // Add custom labels here
  'aurigraph',
  'v11'
];
```

### Sync Specific Epic

```bash
# Modify JQL query to filter by epic
jql="project=AV11 AND parent=AV11-163 ORDER BY created ASC"
```

---

## Maintenance

### Regular Sync Schedule

**Recommended**: Run sync weekly or after major JIRA updates

```bash
# Add to crontab for weekly sync
0 0 * * 0 /path/to/sync-github-jira.sh >> /var/log/github-jira-sync.log 2>&1
```

**Or use GitHub Actions** (already configured):
- Workflow runs automatically on repository events
- Manual trigger available for on-demand sync

### Cleanup Old Issues

```bash
# Close GitHub issues for closed JIRA tickets
# (automatic via workflow)

# Remove orphaned labels
gh label delete "jira:OLD-123" --yes
```

---

## Summary

| Action | Command | Frequency |
|--------|---------|-----------|
| **Initial Setup** | Set GITHUB_TOKEN | Once |
| **Manual Sync** | `./sync-github-jira.sh` | As needed |
| **Auto Sync** | GitHub Actions workflow | Automatic |
| **Verify Sync** | `gh issue list --label "jira:"` | After sync |
| **Check Status** | View GitHub Issues page | Anytime |

---

## Support

- **JIRA Board**: https://aurigraphdlt.atlassian.net/jira/software/projects/AV11/boards/789
- **GitHub Issues**: https://github.com/Aurigraph-DLT-Corp/Aurigraph-DLT/issues
- **GitHub Actions**: https://github.com/Aurigraph-DLT-Corp/Aurigraph-DLT/actions

---

*Generated: October 2, 2025*
*Project: Aurigraph DLT V11*
