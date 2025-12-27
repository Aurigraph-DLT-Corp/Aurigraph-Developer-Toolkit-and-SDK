# Sub-Agent: GitHub ↔ JIRA Linker

**Purpose**: Link GitHub code/PRs to JIRA tickets for full traceability (V12 Baseline Ready)
**Status**: Active (Runs continuously during sprint)
**Agent Type**: J4C Background Agent
**Responsibility**: Maintain bidirectional links between GitHub and JIRA

---

## Overview

This sub-agent automatically creates and maintains links between GitHub repositories, pull requests, commits, and JIRA tickets, enabling developers to see the complete context of work.

### What It Does

1. **Links GitHub PRs to JIRA Tickets**
   - Detects `AV11-XXX` in PR title
   - Creates JIRA issue link
   - Updates both sides (GitHub sees JIRA, JIRA sees GitHub)

2. **Links GitHub Commits to JIRA**
   - Monitors commit messages with `AV11-XXX`
   - Posts commit details to JIRA
   - Shows commit hash, files changed, diff stats

3. **Links GitHub Code to JIRA**
   - Extracts changed files from commit/PR
   - Maps code to JIRA ticket
   - Shows which files/components are affected

4. **Links Test Results to JIRA**
   - GitHub Actions test results → JIRA comments
   - Coverage reports → JIRA metrics
   - Build artifacts → JIRA attachments

5. **Creates Reverse Links**
   - JIRA ticket links to GitHub PR
   - JIRA ticket links to GitHub branch
   - JIRA ticket links to code files

---

## Architecture

### Two-Way Linking System

```
GitHub PR #123                    JIRA Ticket AV11-101
    ↓                                    ↓
  Trigger: New PR created          Trigger: PR link mentioned
    ↓                                    ↓
Sub-agent detects AV11-101 ←→ Sub-agent creates link
    ↓                                    ↓
Creates link in JIRA ←→ Creates comment in GitHub
    ↓                                    ↓
Shows PR URL in AV11-101 ←→ Shows issue link in PR
    ↓                                    ↓
Syncs test results ←→ Syncs to JIRA
```

---

## Linking Types

### Type 1: PR to JIRA Ticket

**Trigger**: PR created with `AV11-XXX` in title

**What agent does**:
```bash
PR: "AV11-101: Fix DeFi module compilation errors"
     ↓
Agent detects AV11-101
     ↓
Creates JIRA issue link:
{
  "type": "relates to",
  "outwardIssue": "AV11-101",
  "inwardIssue": "PR #123"
}
     ↓
Posts to GitHub PR:
"✓ Linked to JIRA AV11-101
 https://aurigraphdlt.atlassian.net/browse/AV11-101"
     ↓
Posts to JIRA AV11-101:
"🔗 Pull Request #123: Fix DeFi module compilation errors
 https://github.com/Aurigraph-DLT-Corp/Aurigraph-DLT/pull/123"
```

### Type 2: Commit to JIRA Ticket

**Trigger**: Commit pushed with `AV11-XXX:` in message

**What agent does**:
```bash
Commit: "AV11-101: Added setAmountOut() method

- Fixed SwapResult getter
- All DeFi models compile
- Added unit tests"
     ↓
Agent detects AV11-101
     ↓
Gets commit details:
- Hash: abc123def
- Author: developer-name
- Files changed: 3
- Insertions: 25
- Deletions: 5
     ↓
Posts to JIRA AV11-101:
"✓ Commit abc123def pushed
 Author: developer-name
 Time: 2025-11-17 14:30 UTC

 Files:
 - SwapResult.java (+25, -5)
 - LendingRequest.java (+0, -0)
 - SwapRequest.java (+0, -0)

 Message: Added setAmountOut() method..."
```

### Type 3: Code File to JIRA Ticket

**Trigger**: Commit changes files related to JIRA ticket

**What agent does**:
```bash
PR/Commit modifies:
- src/main/java/io/aurigraph/v11/contracts/defi/models/SwapResult.java
- src/main/java/io/aurigraph/v11/contracts/defi/models/LendingRequest.java
     ↓
Agent recognizes: These files are for DeFi (Agent-1.1)
     ↓
Agent finds JIRA ticket: AV11-101 (Agent-1.1)
     ↓
Posts to AV11-101:
"📝 Code changes detected
 Affected files:
 - SwapResult.java: +25, -5
 - LendingRequest.java: +10, -2

 Location: src/main/java/io/aurigraph/v11/contracts/defi/models/"
```

### Type 4: Test Results to JIRA Ticket

**Trigger**: GitHub Actions tests complete

**What agent does**:
```bash
Test run completes:
- Compilation: ✓ PASSED
- Unit Tests: ✓ PASSED (45/45)
- Integration: ✓ PASSED (12/12)
- Coverage: 92%
     ↓
Agent extracts results
     ↓
Posts to JIRA AV11-101:
"✓ GitHub Actions Test Results (Run #456)

Compilation: ✓ PASSED
Unit Tests: ✓ PASSED (45/45)
Integration Tests: ✓ PASSED (12/12)
Code Coverage: 92% (+3% from baseline)

View Full Report: [GitHub Actions #456](link)
All checks passed!"
```

### Type 5: Branch to JIRA Ticket

**Trigger**: Feature branch created for ticket

**What agent does**:
```bash
Branch created: feature/1.1-rest-grpc-bridge
     ↓
Agent detects: Maps to Agent-1.1
     ↓
Agent finds: JIRA AV11-101
     ↓
Posts to AV11-101:
"🌿 Branch created: feature/1.1-rest-grpc-bridge

Status: Ready for development
Agent: Agent-1.1
URL: https://github.com/.../tree/feature/1.1-rest-grpc-bridge"
```

---

## Linking Patterns

### Pattern Recognition

Agent automatically recognizes:

1. **Ticket in PR Title**
   ```
   "AV11-101: Fix DeFi compilation" → Links to AV11-101
   "AV11-101 AV11-102: Multi-fix" → Links to both
   "[AV11-101] Feature description" → Links to AV11-101
   ```

2. **Ticket in Commit Message**
   ```
   "AV11-101: Detailed message" → Links to AV11-101
   "Fix AV11-101 issue" → Links to AV11-101
   "Resolves AV11-101" → Links + auto-closes AV11-101
   ```

3. **Ticket in Branch Name**
   ```
   "feature/1.1-rest-grpc-bridge" → Maps to Agent-1.1 → AV11-101
   "bugfix/AV11-102" → Links to AV11-102
   "work/av11-105-storage" → Links to AV11-105
   ```

4. **Code to Component**
   ```
   "src/main/java/io/aurigraph/v11/contracts/defi/*"
      → Agent-1.1 → AV11-101
   "src/main/java/io/aurigraph/v11/consensus/*"
      → Agent-1.2 → AV11-103
   ```

---

## Implementation Details

### Task 1: Monitor PR Creation
**Schedule**: Real-time (GitHub webhook)

```bash
# GitHub sends webhook when PR created
# Agent receives: PR number, title, branch, author
# Extracts ticket ID from PR title
# Creates bidirectional link
```

### Task 2: Monitor Commits
**Schedule**: Every 5 minutes

```bash
git log --oneline origin/main..HEAD | while read hash msg; do
  if [[ $msg =~ AV11-([0-9]+) ]]; then
    ticket_id="AV11-${BASH_REMATCH[1]}"
    # Link commit to JIRA
    # Post commit details to JIRA comment
  fi
done
```

### Task 3: Extract Code Changes
**Schedule**: On PR creation / Commit push

```bash
# For PR:
git diff --name-only origin/main...HEAD | while read file; do
  # Map file to component
  # Map component to agent
  # Map agent to JIRA ticket
  # Post to JIRA: "Files affected in component X"
done

# For Commit:
git show --name-status $commit_hash | while read status file; do
  # Track file changes
  # Post stats to JIRA
done
```

### Task 4: Link Test Results
**Schedule**: On GitHub Actions completion

```bash
# GitHub Actions posts workflow results
# Agent extracts:
# - Build status (pass/fail)
# - Test counts (pass/fail/skip)
# - Coverage percentage
# - Execution time
#
# Posts to JIRA with formatted comment
```

### Task 5: Maintain Reverse Links
**Schedule**: Continuous (on-demand)

```bash
# When JIRA ticket viewed:
# Show GitHub PR link
# Show GitHub commit link
# Show GitHub branch link
# Show file changes
# Show test results
```

---

## Configuration

### GitHub Configuration

**Webhook Setup**:
1. Go to GitHub repo settings
2. Webhooks → Add webhook
3. Payload URL: `https://your-server.com/webhooks/github-jira`
4. Content type: `application/json`
5. Events: `pull_requests`, `push`, `repository`
6. Secret: `your-webhook-secret`

**Events to Monitor**:
- `pull_request` (opened, synchronize)
- `push` (all branches)
- `issues` (opened, edited)

### JIRA Configuration

**Link Types**:
- `relates to` - Generic relationship
- `blocks` - PR blocks JIRA completion
- `is blocked by` - JIRA blocks PR merge

**Custom Fields** (optional):
- GitHub PR URL
- GitHub Branch
- GitHub Commit Hash
- Latest Test Results

---

## Reverse Linking (JIRA → GitHub)

### From JIRA Ticket, Show:

1. **Related PRs**
   ```
   🔗 Pull Requests:
   - PR #123: Fix DeFi compilation (Open)
   - PR #124: Fix composite modules (Merged)
   ```

2. **Related Commits**
   ```
   📝 Commits:
   - abc123def: Added setAmountOut() method (Nov 17, 14:30)
   - def456abc: Fixed getter methods (Nov 17, 14:00)
   ```

3. **Related Branches**
   ```
   🌿 Branch:
   - feature/1.1-rest-grpc-bridge
   ```

4. **Affected Code**
   ```
   📄 Code Changes:
   - src/main/java/io/aurigraph/v11/contracts/defi/models/
     SwapResult.java (+25, -5)
     LendingRequest.java (+10, -2)
   ```

5. **Latest Test Results**
   ```
   ✓ Tests (Latest Run):
   - Compilation: PASSED
   - Unit Tests: 45/45 PASSED
   - Coverage: 92%
   - Last Run: 2 hours ago
   ```

---

## Auto-Link Scenarios

### Scenario 1: New Feature Development
```
Developer creates branch: feature/1.1-rest-grpc-bridge
    ↓
Agent maps to: Agent-1.1 → AV11-101
    ↓
Agent creates JIRA link
    ↓
Developer pushes commits with "AV11-101: message"
    ↓
Agent links each commit to AV11-101
    ↓
Developer creates PR with "AV11-101: Fix DeFi..."
    ↓
Agent links PR to AV11-101
    ↓
GitHub Actions runs tests
    ↓
Agent posts test results to AV11-101
    ↓
AV11-101 in JIRA shows:
   - Branch: feature/1.1-rest-grpc-bridge
   - Commits: 5 linked
   - PR: #123 (open)
   - Tests: All passing
```

### Scenario 2: Multiple Tickets in One PR
```
PR Title: "AV11-101: AV11-102: Fix DeFi and composite modules"
    ↓
Agent detects: Both AV11-101 and AV11-102
    ↓
Creates links:
   - AV11-101 ↔ PR #123
   - AV11-102 ↔ PR #123
    ↓
Both tickets show:
   "🔗 Related to PR #123"
```

### Scenario 3: Dependent Tickets
```
AV11-101 blocks AV11-102
    ↓
PR for AV11-101 created
    ↓
Agent posts to AV11-102:
   "⚠️  Depends on AV11-101
    Blocking PR: #123
    Status: In Progress"
    ↓
When AV11-101 PR merged
    ↓
Agent updates AV11-102:
   "✓ Dependency AV11-101 complete!
    Your blockers are clear."
```

---

## Benefits

### For Developers
- **Context**: See all related GitHub code from JIRA
- **Traceability**: Track changes back to tickets
- **Status**: Real-time sync between systems
- **Notifications**: Changes in GitHub auto-update JIRA

### For Managers
- **Visibility**: See which code addresses which tickets
- **Progress**: GitHub activity = JIRA progress
- **Quality**: Test results linked to tickets
- **Compliance**: Full audit trail of changes

### For QA
- **Scope**: Know exactly what changed per ticket
- **Testing**: Link test cases to code changes
- **Results**: Automated test reporting to JIRA

---

## Monitoring & Metrics

### Agent Dashboard

**Updates every 5 minutes**:
```
GITHUB ↔ JIRA LINKER STATUS
Updated: 2025-11-17 14:35:00 UTC

Links Created Today:
- PR → JIRA: 8 links
- Commit → JIRA: 24 links
- Test → JIRA: 8 results

Active Links:
- Total: 156 links
- Valid: 155 (99.4%)
- Broken: 1 (needs review)

Processing:
- Queue: 3 pending
- Avg latency: 1.2 seconds
- Success rate: 99.8%
```

### Error Handling

**When link fails**:
1. Retry with exponential backoff (2s, 4s, 8s)
2. Log to error file with timestamp
3. Continue processing other links
4. Alert on 3+ consecutive failures

---

## Commands for Developers

### Link PR to JIRA
```bash
# Automatic on creation, but manual option:
git push origin feature/1.1-rest-grpc-bridge
# PR created → Agent auto-links
```

### Check Links
```bash
# View all links for a ticket
curl -s -u "$JIRA_USER:$JIRA_TOKEN" \
  "https://aurigraphdlt.atlassian.net/rest/api/3/issues/AV11-101/changelog" | \
  jq '.values[] | select(.items[] | .field == "links")'
```

### Manual Link (if needed)
```bash
# Direct JIRA API call
curl -X POST \
  -u "$JIRA_USER:$JIRA_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "type": {"name": "relates to"},
    "outwardIssue": {"key": "AV11-101"}
  }' \
  "https://aurigraphdlt.atlassian.net/rest/api/3/issues/123/links"
```

---

## Troubleshooting

### PR not linking to JIRA?
1. Check PR title format: `AV11-XXX: description`
2. Verify agent logs: `tail /tmp/github-jira-linker.log`
3. Check JIRA ticket exists: `curl https://.../ /browse/AV11-101`

### Commit not appearing in JIRA?
1. Check commit message: `git log -1 --format=%B`
2. Verify pattern: Must contain `AV11-XXX`
3. Check agent is running: `ps aux | grep linker`

### Test results not posting?
1. GitHub Actions must complete
2. Job must have `JIRA_TOKEN` secret set
3. Check Actions workflow file

---

## Roadmap

### V1 (Current)
- ✅ PR ↔ JIRA linking
- ✅ Commit → JIRA tracking
- ✅ Test results → JIRA posting
- ✅ Bidirectional linking
- ✅ Code change tracking

### V2 (Future)
- [ ] Automated code reviews based on JIRA acceptance criteria
- [ ] Performance metrics visualization
- [ ] Predictive burndown (ML-based)
- [ ] Slack notifications
- [ ] Custom link types per agent

---

## Running the Agent

### Start Agent
```bash
cd /Users/subbujois/subbuworkingdir/Aurigraph-DLT
export JIRA_USER=your-email@example.com
export JIRA_TOKEN=your-api-token
export GITHUB_TOKEN=your-github-token

./scripts/github-jira-linker-agent.sh &
```

### Verify Running
```bash
ps aux | grep github-jira-linker
tail -f /tmp/github-jira-linker.log
```

### Stop Agent
```bash
pkill -f github-jira-linker
```

---

**Agent Status**: Ready for deployment
**Last Updated**: November 17, 2025
**Integration**: #addtoJ4Cagents

