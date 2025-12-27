# Sub-Agent: JIRA Ticket Updater

**Purpose**: Keep all JIRA tickets updated with progress from GitHub (Platform-agnostic)
**Status**: Active (Runs continuously during sprint)
**Agent Type**: J4C Background Agent
**Responsibility**: Monitor GitHub activity and auto-update JIRA

---

## Overview

This sub-agent monitors the Aurigraph-DLT repository for Git activity and automatically updates corresponding JIRA tickets in real-time.

### What It Does

1. **Monitors Git Commits**
   - Watches for commits with pattern: `AV11-XXX: message`
   - Extracts ticket ID and updates JIRA automatically

2. **Tracks Pull Requests**
   - Links PR to JIRA ticket
   - Updates status (In Progress → In Review → Done)
   - Posts test results as JIRA comments

3. **Updates Issue Status**
   - PENDING → IN PROGRESS (when PR created)
   - IN PROGRESS → IN REVIEW (when PR merged)
   - IN REVIEW → DONE (when merge to main)

4. **Provides Real-Time Status**
   - Daily burndown updates
   - Sprint velocity tracking
   - Blocker identification

---

## Configuration

### Environment Variables Required
```bash
JIRA_BASE_URL=https://aurigraphdlt.atlassian.net
JIRA_PROJECT=AV11
JIRA_USER=your-email@example.com
JIRA_TOKEN=your-api-token
GITHUB_TOKEN=your-github-token
GITHUB_REPO=Aurigraph-DLT-Corp/Aurigraph-DLT
GITHUB_API_URL=https://api.github.com
```

### JIRA Board Configuration
- **Board**: AV11
- **Sprint**: Sprint 14
- **Project**: AV11
- **Filter**: `Sprint = 14 AND labels in (agent-system)`

---

## Agent Tasks (Daily)

### Task 1: Scan Recent Commits
**Schedule**: Every 30 minutes
**What it does**:
```bash
# Get last 50 commits
git log --oneline -50 | while read commit_hash commit_msg; do
  if [[ $commit_msg =~ AV11-([0-9]+) ]]; then
    ticket_id="AV11-${BASH_REMATCH[1]}"
    # Extract author
    author=$(git log --format='%an' -1 $commit_hash)
    # Update JIRA ticket
    curl -X POST \
      -u "$JIRA_USER:$JIRA_TOKEN" \
      -H "Content-Type: application/json" \
      -d "{
        \"body\": \"✓ Commit: $commit_hash\n\nMessage: $commit_msg\n\nAuthor: $author\n\nTimestamp: $(date -u +'%Y-%m-%d %H:%M:%S UTC')\"
      }" \
      "$JIRA_BASE_URL/rest/api/3/issues/$ticket_id/comments"
  fi
done
```

### Task 2: Monitor Pull Requests
**Schedule**: Every 15 minutes
**What it does**:
```bash
# Get all open PRs
curl -s -H "Authorization: token $GITHUB_TOKEN" \
  "$GITHUB_API_URL/repos/$GITHUB_REPO/pulls?state=open" | \
  jq -r '.[] | "\(.number) \(.title)"' | while read pr_number pr_title; do

  if [[ $pr_title =~ AV11-([0-9]+) ]]; then
    ticket_id="AV11-${BASH_REMATCH[1]}"

    # Get PR details
    pr_info=$(curl -s -H "Authorization: token $GITHUB_TOKEN" \
      "$GITHUB_API_URL/repos/$GITHUB_REPO/pulls/$pr_number")

    pr_url=$(echo $pr_info | jq -r '.html_url')
    pr_status=$(echo $pr_info | jq -r '.state')
    test_status=$(echo $pr_info | jq -r '.status' || echo "pending")

    # Update JIRA
    curl -X POST \
      -u "$JIRA_USER:$JIRA_TOKEN" \
      -H "Content-Type: application/json" \
      -d "{
        \"body\": \"🔗 PR #$pr_number: $pr_title\n\nURL: $pr_url\n\nStatus: $pr_status\n\nTests: $test_status\"
      }" \
      "$JIRA_BASE_URL/rest/api/3/issues/$ticket_id/comments"
  fi
done
```

### Task 3: Update Sprint Metrics
**Schedule**: Every 4 hours
**What it does**:
```bash
# Calculate sprint metrics
total_issues=$(curl -s -u "$JIRA_USER:$JIRA_TOKEN" \
  "$JIRA_BASE_URL/rest/api/3/search?jql=Sprint=14 AND labels in (agent-system)" | \
  jq '.total')

completed=$(curl -s -u "$JIRA_USER:$JIRA_TOKEN" \
  "$JIRA_BASE_URL/rest/api/3/search?jql=Sprint=14 AND status=Done AND labels in (agent-system)" | \
  jq '.total')

in_progress=$(curl -s -u "$JIRA_USER:$JIRA_TOKEN" \
  "$JIRA_BASE_URL/rest/api/3/search?jql=Sprint=14 AND status='In Progress' AND labels in (agent-system)" | \
  jq '.total')

# Calculate percentage
percent_complete=$((completed * 100 / total_issues))

# Log to file
echo "$(date -u +'%Y-%m-%d %H:%M:%S UTC') | Total: $total_issues | Done: $completed | In Progress: $in_progress | Progress: $percent_complete%" >> /tmp/sprint-metrics.log
```

### Task 4: Identify Blockers
**Schedule**: Every 2 hours
**What it does**:
```bash
# Find tickets not updated in 24 hours
curl -s -u "$JIRA_USER:$JIRA_TOKEN" \
  "$JIRA_BASE_URL/rest/api/3/search?jql=Sprint=14 AND status='In Progress' AND updated < -1d AND labels in (agent-system)" | \
  jq -r '.issues[] | "\(.key) | \(.fields.summary) | \(.fields.updated)"' | \
  while read ticket summary updated; do
    echo "⚠️  Potential Blocker: $ticket"
    echo "   Task: $summary"
    echo "   Last Updated: $updated"
    echo ""
  done
```

### Task 5: Generate Daily Report
**Schedule**: Every 24 hours (9:00 AM)
**What it does**:
```bash
# Fetch all Sprint 14 tickets
tickets=$(curl -s -u "$JIRA_USER:$JIRA_TOKEN" \
  "$JIRA_BASE_URL/rest/api/3/search?jql=Sprint=14 AND labels in (agent-system)" | \
  jq -r '.issues[] | "\(.key) | \(.fields.status.name) | \(.fields.assignee.displayName // "Unassigned")"')

echo "📊 SPRINT 14 DAILY REPORT - $(date -u +'%Y-%m-%d')"
echo ""
echo "Ticket Status Summary:"
echo "$tickets" | column -t -s '|'
echo ""

# Calculate burndown
echo "Burndown:"
echo "- Completed: $(echo "$tickets" | grep -c "Done") / 15"
echo "- In Progress: $(echo "$tickets" | grep -c "In Progress") / 15"
echo "- Not Started: $(echo "$tickets" | grep -c "To Do") / 15"

# Append to file
echo "Generated: $(date -u)" >> /tmp/sprint-14-daily-report.txt
echo "$tickets" >> /tmp/sprint-14-daily-report.txt
```

---

## Integration Points

### GitHub ↔ JIRA Workflow

```
Developer commits with AV11-101:
   ↓
Git commit hook detects pattern
   ↓
Sub-agent reads commit
   ↓
Updates JIRA AV11-101 with:
   - Commit hash
   - Commit message
   - Author name
   - Timestamp
   ↓
JIRA ticket comment shows activity
   ↓
Sprint lead sees progress in JIRA
```

### Example Workflow

**Developer does this**:
```bash
git commit -m "AV11-101: Fixed SwapResult getter methods

- Added setAmountOut() method
- Added setPriceImpact() method
- Added setExecutionPrice() method
- All DeFi models now compile without errors"
git push origin feature/1.1-rest-grpc-bridge
```

**Sub-agent automatically**:
1. Detects commit with `AV11-101`
2. Posts comment to JIRA ticket AV11-101
3. Shows commit hash, author, timestamp
4. When PR is created, links it to ticket
5. When PR is merged, marks ticket as done

---

## Status Transitions

### Automatic Status Updates

```
NOT STARTED (Initial state)
    ↓
IN PROGRESS (First commit with AV11-XXX)
    ↓
IN REVIEW (PR created to main)
    ↓
DONE (PR merged to main)
```

### Manual Overrides

Agent respects manual status changes. If developer sets status manually in JIRA, agent won't override it.

---

## Monitoring Dashboard

Sub-agent maintains real-time dashboard at:
- **File**: `/tmp/sprint-14-status.json`
- **Contents**:
  ```json
  {
    "sprint": "Sprint 14",
    "updated": "2025-11-17T14:30:00Z",
    "metrics": {
      "total_tickets": 15,
      "completed": 2,
      "in_progress": 5,
      "not_started": 8,
      "percent_complete": 13.3
    },
    "tickets": [
      {
        "id": "AV11-101",
        "status": "IN_PROGRESS",
        "agent": "Agent-1.1",
        "last_update": "2025-11-17T14:15:00Z",
        "commits": 3,
        "prs": 1
      }
    ],
    "blockers": [],
    "velocity": "112 pts",
    "remaining": "96 pts"
  }
  ```

---

## Error Handling

### What If JIRA is Unreachable?

```bash
# Retry logic (exponential backoff)
MAX_RETRIES=3
RETRY_DELAY=2

for attempt in {1..$MAX_RETRIES}; do
  if curl -s -f "$JIRA_BASE_URL/rest/api/3/..." > /dev/null; then
    # Success
    break
  else
    # Retry with delay
    sleep $((RETRY_DELAY * 2 ** attempt))
  fi
done

# Log failure
echo "JIRA unreachable - queued for next run" >> /tmp/jira-agent.log
```

### What If GitHub is Unreachable?

```bash
# Cache recent commits locally
git log --oneline -50 > /tmp/git-cache.log

# Retry next cycle
# Process cached commits when GitHub returns
```

---

## Logging & Debugging

### Agent Logs Location
- **Main Log**: `/tmp/jira-updater-agent.log`
- **Error Log**: `/tmp/jira-updater-agent-errors.log`
- **Metrics**: `/tmp/sprint-metrics.log`

### Enable Debug Mode
```bash
export JIRA_AGENT_DEBUG=true
# Now agent logs detailed output
```

### View Recent Activity
```bash
tail -50 /tmp/jira-updater-agent.log
tail -20 /tmp/jira-updater-agent-errors.log
```

---

## Performance Metrics

- **Commit detection**: <1 second
- **JIRA update**: 2-3 seconds per ticket
- **PR linking**: 1-2 seconds per PR
- **Full sprint update**: <30 seconds
- **Uptime target**: 99.9% (during business hours)

---

## Configuration Examples

### Example 1: Update on All Commits
```bash
# Watch all commits to feature/* branches
git log --oneline feature/1.1-rest-grpc-bridge..main | grep AV11
# Updates JIRA for each commit
```

### Example 2: Link PR to Multiple Tickets
```bash
# PR title: "AV11-101: AV11-102: Fix DeFi and composite modules"
# Agent links both AV11-101 and AV11-102 to PR
```

### Example 3: Custom Status Transitions
```bash
# Commit with [WIP] = stays IN PROGRESS
# Commit with [REVIEW] = moves to IN REVIEW
# Commit with [DONE] = moves to DONE
# Commit with [BLOCKED] = adds blocker comment
```

---

## Alerting

Sub-agent alerts (via log) when:

1. **Ticket not updated in 24+ hours**
   - Potential blocker
   - Agent pings sprint lead

2. **PR tests failing**
   - Test results posted to JIRA
   - PR blocked from merge until fixed

3. **Merge conflict detected**
   - Agent notes in JIRA
   - Suggests resolution approach

4. **Dependency blocked**
   - If AV11-101 (blocker) is not done
   - AV11-102 (dependent) shows as blocked

---

## Roadmap

### V1 (Current)
- ✅ Commit monitoring
- ✅ JIRA comment posting
- ✅ PR linking
- ✅ Status auto-update
- ✅ Daily reporting

### V2 (Future)
- [ ] Slack notifications
- [ ] Automated PR reviews
- [ ] Test result integration
- [ ] Performance trend analysis
- [ ] AI-powered blocker prediction

---

## Running the Agent

### Start Agent
```bash
cd /Users/subbujois/subbuworkingdir/Aurigraph-DLT
export JIRA_USER=your-email@example.com
export JIRA_TOKEN=your-api-token
export GITHUB_TOKEN=your-github-token

# Run in background
./scripts/jira-updater-agent.sh &

# Verify running
ps aux | grep jira-updater-agent
```

### Stop Agent
```bash
pkill -f jira-updater-agent
```

### Check Status
```bash
tail -f /tmp/jira-updater-agent.log
```

---

**Agent Status**: Ready for deployment
**Last Updated**: November 17, 2025
**Next Review**: November 20, 2025

