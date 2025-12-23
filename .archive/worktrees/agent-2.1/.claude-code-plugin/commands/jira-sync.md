# /jira-sync

Synchronize GitHub commits with JIRA tickets and update ticket status automatically.

## Usage

```bash
/jira-sync [options]
```

## Options

- `--commits <range>`: Git commit range to sync (default: last 10 commits)
- `--update-status`: Automatically update JIRA ticket status based on commit messages
- `--dry-run`: Show what would be synced without making changes
- `--project <key>`: JIRA project key (default: AV11)

## Examples

```bash
# Sync last 10 commits
/jira-sync

# Sync specific commit range
/jira-sync --commits HEAD~20..HEAD

# Dry run to preview changes
/jira-sync --dry-run

# Sync and update ticket status
/jira-sync --update-status
```

## Implementation

### 1. Load Configuration

```javascript
const JIRA_CONFIG = {
  email: process.env.JIRA_EMAIL || 'subbu@aurigraph.io',
  apiToken: process.env.JIRA_API_TOKEN,
  baseUrl: process.env.JIRA_BASE_URL || 'https://aurigraphdlt.atlassian.net',
  projectKey: process.env.JIRA_PROJECT_KEY || 'AV11'
};
```

### 2. Extract JIRA Ticket References from Commits

```bash
# Get commits with JIRA ticket references
git log --pretty=format:"%H|%s|%b|%an|%ae|%ad" $COMMIT_RANGE | \
  grep -E "(AV11-[0-9]+|#[0-9]+)" > commits_to_sync.txt
```

### 3. Parse Commit Messages

Extract ticket IDs and determine action:

```javascript
const PATTERNS = {
  ticketId: /AV11-\d+/g,
  fix: /fix(es|ed)?|resolve(s|d)?|close(s|d)?/i,
  wip: /wip|work in progress/i,
  review: /review|ready for review/i
};

function parseCommit(commit) {
  const [hash, subject, body, author, email, date] = commit.split('|');
  const ticketIds = (subject + ' ' + body).match(PATTERNS.ticketId) || [];

  return {
    hash,
    subject,
    body,
    author,
    email,
    date,
    ticketIds: [...new Set(ticketIds)],
    action: detectAction(subject + ' ' + body)
  };
}

function detectAction(message) {
  if (PATTERNS.fix.test(message)) return 'DONE';
  if (PATTERNS.wip.test(message)) return 'IN_PROGRESS';
  if (PATTERNS.review.test(message)) return 'IN_REVIEW';
  return 'IN_PROGRESS';
}
```

### 4. Add Comments to JIRA Tickets

For each commit referencing a JIRA ticket:

```javascript
async function addCommitComment(ticketId, commit) {
  const comment = {
    body: {
      type: 'doc',
      version: 1,
      content: [{
        type: 'paragraph',
        content: [
          { type: 'text', text: '🔗 ', marks: [{ type: 'strong' }] },
          { type: 'text', text: 'GitHub Commit: ', marks: [{ type: 'strong' }] },
          {
            type: 'text',
            text: commit.hash.substring(0, 8),
            marks: [{
              type: 'link',
              attrs: { href: `${GITHUB_REPO}/commit/${commit.hash}` }
            }]
          }
        ]
      }, {
        type: 'paragraph',
        content: [
          { type: 'text', text: commit.subject }
        ]
      }, {
        type: 'paragraph',
        content: [
          { type: 'text', text: `👤 ${commit.author} (${commit.date})` }
        ]
      }]
    }
  };

  await jiraRequest('POST', `/rest/api/3/issue/${ticketId}/comment`, comment);
  console.log(`✅ Added comment to ${ticketId}`);
}
```

### 5. Update Ticket Status

If `--update-status` flag is set:

```javascript
async function updateTicketStatus(ticketId, action) {
  // Get available transitions
  const transitions = await jiraRequest('GET', `/rest/api/3/issue/${ticketId}/transitions`);

  // Find matching transition
  const transition = transitions.transitions.find(t =>
    t.name.toUpperCase().includes(action)
  );

  if (transition) {
    await jiraRequest('POST', `/rest/api/3/issue/${ticketId}/transitions`, {
      transition: { id: transition.id }
    });
    console.log(`✅ Updated ${ticketId} status to ${action}`);
  }
}
```

### 6. Generate Sync Report

```markdown
# JIRA Sync Report
Generated: [timestamp]

## Summary
- Commits processed: [count]
- Tickets updated: [count]
- Comments added: [count]
- Status changes: [count]

## Details

### [AV11-375] Bridge Error Messages
- Commit: 1d6e9cf2
- Author: Claude Code
- Date: Oct 16, 2025
- Action: IN_PROGRESS
- Comment: ✅ Added

### [AV11-383] Ricardian Smart Contracts
- Commit: a6d4d366
- Author: Claude Code
- Date: Oct 16, 2025
- Action: IN_PROGRESS
- Comment: ✅ Added

## Errors
[List any errors encountered]

## Skipped
[List any commits skipped with reasons]
```

### 7. Dry Run Output

If `--dry-run` is specified, show what would happen:

```
🔍 DRY RUN - No changes will be made

Would sync 8 commits:

1. [1d6e9cf2] fix(bridge): Update error messages (AV11-375)
   → Would add comment to AV11-375
   → Would update status to IN_PROGRESS

2. [a6d4d366] fix: Resolve JIRA API bug (AV11-383)
   → Would add comment to AV11-383
   → Would update status to DONE

...

To apply these changes, run without --dry-run
```

## Commit Message Conventions

To enable automatic status updates, use these patterns:

### Mark as In Progress
```
wip: Implementing feature (AV11-123)
feat(wip): Add new component (AV11-123)
```

### Mark as Done/Closed
```
fix: Resolve issue (AV11-123)
fix(bridge): Close bug fixes AV11-123
```

### Mark as In Review
```
review: Ready for review (AV11-123)
feat: Complete feature - review ready (AV11-123)
```

## JIRA API Authentication

Uses Basic Auth with email and API token:

```javascript
const authHeader = 'Basic ' + Buffer.from(
  `${JIRA_CONFIG.email}:${JIRA_CONFIG.apiToken}`
).toString('base64');
```

## Error Handling

Handle common errors gracefully:

1. **Ticket not found**: Skip and log
2. **Permission denied**: Report and continue
3. **Network timeout**: Retry up to 3 times
4. **Invalid transition**: Log available transitions
5. **Rate limiting**: Wait and retry

## Integration with Git Hooks

Can be run automatically via Git hooks:

```bash
# .git/hooks/post-commit
#!/bin/bash
if [[ $BRANCH_NAME == "main" ]]; then
  /path/to/claude-code /jira-sync --commits HEAD~1..HEAD
fi
```

## Batch Processing

For bulk syncing:

```bash
# Sync all commits from last sprint
/jira-sync --commits $(git log --since="2 weeks ago" --format="%H" | head -1)..HEAD

# Sync entire branch
/jira-sync --commits main..feature/my-branch
```

## Success Criteria

- ✅ All commit-referenced tickets found in JIRA
- ✅ Comments added successfully
- ✅ Status transitions applied (if requested)
- ✅ No authentication errors
- ✅ Sync report generated

## Monitoring

Track sync statistics:
- Number of commits synced per day
- Success/failure rate
- Average time per sync
- Most referenced tickets

## Notes

- Sync runs asynchronously (non-blocking)
- Retries failed operations automatically
- Maintains sync history in `.jira-sync-history`
- Can be scheduled via cron for regular updates
- Respects JIRA API rate limits (10 requests/second)
