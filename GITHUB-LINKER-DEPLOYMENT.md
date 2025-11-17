# GitHub-JIRA Linker Deployment Guide

**Sub-Agent #2**: Bidirectional GitHub ↔ JIRA Integration

---

## 📋 Prerequisites

The GitHub-JIRA Linker requires a GitHub Personal Access Token with the following permissions:

- `repo` - Full control of private repositories
- `read:org` - Read access to organization
- `read:user` - Read access to user profile

---

## 🔑 Step 1: Generate GitHub Personal Access Token

### Via GitHub Web Interface

1. Go to: https://github.com/settings/tokens/new
2. Set token name: `AurigraphDLT-JIRA-Linker`
3. Set expiration: 90 days (or as needed)
4. Select scopes:
   - ✅ `repo` (Full control of private repositories)
   - ✅ `read:org` (Read access to organization data)
   - ✅ `read:user` (Read access to user profile data)
5. Click "Generate token"
6. **Copy the token immediately** (you won't be able to see it again)

### Token Format
Your token will look like: `ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`

---

## 🚀 Step 2: Deploy the Sub-Agent

### Option A: Interactive Deployment (Recommended)

```bash
cd /Users/subbujois/subbuworkingdir/Aurigraph-DLT

# Export required credentials
export JIRA_USER="subbu@aurigraph.io"
export JIRA_TOKEN="ATATT3xFfGF0sFjaXc9iiBQuv-1jvWEfLDA5APUBvJvhVSrtzDDfS4B9k3ut3gCAyHUNU0YImVJSjcjglkR_3dmHtvRUYiV32nQJqkQ_HwKqCbS6oNs99XdYu5j_SmQqMQX4a7WekwS-sYNbDFtNBTrRuemXmlVHrjWa6dhMdCBuk0vdQvd_OYA=F7D4339F"
export JIRA_BASE_URL="https://aurigraphdlt.atlassian.net"
export JIRA_PROJECT="AV11"

# Export GitHub token (replace with your actual token)
export GITHUB_TOKEN="ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"

# Start the sub-agent
./scripts/github-jira-linker-agent.sh

# Monitor the logs
tail -f /tmp/github-jira-linker.log
```

### Option B: Background Deployment

```bash
# Set environment variables
export JIRA_USER="subbu@aurigraph.io"
export JIRA_TOKEN="ATATT3xFfGF0sFjaXc9iiBQuv-1jvWEfLDA5APUBvJvhVSrtzDDfS4B9k3ut3gCAyHUNU0YImVJSjcjglkR_3dmHtvRUYiV32nQJqkQ_HwKqCbS6oNs99XdYu5j_SmQqMQX4a7WekwS-sYNbDFtNBTrRuemXmlVHrjWa6dhMdCBuk0vdQvd_OYA=F7D4339F"
export GITHUB_TOKEN="ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"

# Start as background process
cd /Users/subbujois/subbuworkingdir/Aurigraph-DLT
./scripts/github-jira-linker-agent.sh &

# Verify it's running
sleep 2
ps aux | grep github-jira-linker | grep -v grep
```

---

## ✅ Step 3: Verify Deployment

### Check Process Status
```bash
# View running process
ps aux | grep github-jira-linker | grep -v grep

# Expected output:
# /bin/bash ./scripts/github-jira-linker-agent.sh
```

### Review Logs
```bash
# Watch live logs
tail -f /tmp/github-jira-linker.log

# View recent activity
tail -50 /tmp/github-jira-linker.log

# Check for errors
tail -20 /tmp/github-jira-linker-errors.log
```

### Test Integration
```bash
# Create a test commit with JIRA reference
cd worktrees/agent-1.1
git checkout -b test/github-jira-link
echo "test content" > test.txt
git add test.txt
git commit -m "test: GitHub-JIRA linker test [AV11-101]"

# Push the branch
git push -u origin test/github-jira-link

# The linker should:
# 1. Detect the new PR within 5 minutes
# 2. Extract the JIRA ticket ID (AV11-101)
# 3. Create a comment in JIRA with the GitHub PR link
# 4. Create a reverse link from JIRA back to GitHub

# Monitor the logs to see the processing
tail -f /tmp/github-jira-linker.log | grep -E "(PR|JIRA|link)"
```

---

## 🔧 Configuration

The GitHub-JIRA Linker uses the following environment variables:

| Variable | Required | Value |
|----------|----------|-------|
| `GITHUB_TOKEN` | ✅ Yes | Personal Access Token from GitHub |
| `JIRA_USER` | ✅ Yes | subbu@aurigraph.io |
| `JIRA_TOKEN` | ✅ Yes | API token from Credentials.md |
| `JIRA_BASE_URL` | ✅ Yes | https://aurigraphdlt.atlassian.net |
| `JIRA_PROJECT` | ✅ Yes | AV11 |

---

## 📊 What the Linker Does

### Every 5 Minutes:
1. **Scans GitHub for Recent PRs**
   - Checks pull requests in the repository
   - Extracts JIRA ticket IDs from PR titles and descriptions
   - Format: `AV11-XXX`

2. **Creates JIRA Comments**
   - Posts PR link to corresponding JIRA ticket
   - Format: `GitHub PR #123: [description] (author)`
   - Includes PR URL for quick navigation

3. **Monitors PR Status**
   - Tracks PR status changes (open, merged, closed)
   - Updates JIRA comments with new status
   - Detects merges and closes

### Every 30 Minutes:
4. **Scans Commits for JIRA References**
   - Looks for commits with `AV11-XXX` pattern
   - Updates commit count in JIRA
   - Tracks commit velocity per ticket

### Reverse Linking:
5. **Creates JIRA Activity Feed**
   - JIRA issue shows GitHub PR activity
   - Links appear in ticket history
   - Enables cross-platform visibility

---

## 🚨 Troubleshooting

### Token Validation Error
```
ERROR: GitHub token not set. Set GITHUB_TOKEN environment variable
```

**Solution**: Ensure `GITHUB_TOKEN` is exported before running the script
```bash
export GITHUB_TOKEN="ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
./scripts/github-jira-linker-agent.sh
```

### JIRA Connection Error
```
ERROR: JIRA authentication failed
```

**Solution**: Verify JIRA credentials
```bash
# Test JIRA connection
curl -u "subbu@aurigraph.io:$JIRA_TOKEN" \
  https://aurigraphdlt.atlassian.net/rest/api/3/myself
```

### GitHub API Rate Limit
```
ERROR: GitHub API rate limit exceeded
```

**Solution**: GitHub allows 60 unauthenticated requests/hour per IP. With token, it's 5000/hour. If exceeded:
1. Wait 1 hour for limit reset
2. Use a token with higher permissions
3. Reduce scan frequency

### No PRs Being Linked
```
INFO: Scanning for PRs... (0 found)
```

**Possible causes**:
1. Repository has no recent PRs
2. PRs don't have JIRA ticket IDs
3. JIRA ticket IDs don't match `AV11-XXX` pattern

**Solution**: Create a test PR with proper naming
```bash
git checkout -b feature/AV11-101-test
echo "test" > file.txt
git add file.txt
git commit -m "feat: Test feature for AV11-101"
git push -u origin feature/AV11-101-test
```

---

## 🛑 Stopping the Sub-Agent

```bash
# Find the process
ps aux | grep github-jira-linker | grep -v grep

# Get the PID (second column)
# Kill the process
kill <PID>

# Example:
kill 12345

# Verify it stopped
ps aux | grep github-jira-linker | grep -v grep
# (should return no results)
```

---

## 📈 Monitoring Dashboard

Once deployed, you can monitor the linker's activity:

1. **GitHub**:
   - https://github.com/Aurigraph-DLT-Corp/Aurigraph-DLT/pulls
   - View recent PRs and their activity

2. **JIRA**:
   - https://aurigraphdlt.atlassian.net/software/c/projects/AV11/boards/1
   - View ticket comments with GitHub links

3. **Local Logs**:
   - `/tmp/github-jira-linker.log` - Main activity log
   - `/tmp/github-jira-linker-errors.log` - Error log

---

## 🔄 Integration with Other Sub-Agents

The GitHub-JIRA Linker works in conjunction with:

| Sub-Agent | Interaction |
|-----------|-------------|
| **JIRA Updater** | Both update JIRA; no conflicts (different data) |
| **Architecture Monitor** | Linked PRs are monitored for compliance |
| **Agents** | PR activity is automatically tracked and linked |

---

## 📞 Support

### Quick Diagnostics
```bash
# Check if running
ps aux | grep github-jira-linker

# View recent activity
tail -20 /tmp/github-jira-linker.log

# Check for errors
tail -20 /tmp/github-jira-linker-errors.log

# Verify credentials
echo "GitHub Token: ${GITHUB_TOKEN:0:10}..."
echo "JIRA User: $JIRA_USER"
```

### Restart the Sub-Agent
```bash
# Kill existing process
pkill -f github-jira-linker

# Wait a moment
sleep 2

# Restart with fresh credentials
export GITHUB_TOKEN="your-token-here"
export JIRA_USER="subbu@aurigraph.io"
export JIRA_TOKEN="your-jira-token"
./scripts/github-jira-linker-agent.sh &
```

---

## 📝 Next Steps

After deployment:

1. ✅ Monitor logs for successful initialization
2. ✅ Create test PR to verify linking works
3. ✅ Check JIRA ticket for GitHub PR comments
4. ✅ Review linked PR in GitHub for JIRA context
5. ✅ Notify agents to use proper commit messages

**Commit Message Format**:
```
feat(component): Brief description [AV11-XXX]

Extended description...

Agent: Agent-Name
Priority: P0/P1/P2
```

---

**Deployment Date**: November 17, 2025
**Sub-Agent Version**: 1.0
**Maintenance**: Monitor logs daily
