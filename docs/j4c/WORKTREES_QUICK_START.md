# J4C Git Worktrees - Quick Start Guide

## In 5 Minutes

### 1. Create a Session

```bash
# Using CLI
ts-node j4c_session_cli.ts create feature/my-feature \
  --project myapp \
  --task "Implement new feature" \
  --tags "feature,backend"

# Output:
# ✅ Session created successfully
# 📝 Session ID: sess-1731418800123-a1b2c3d4e
# 🔀 Branch: feature/my-feature
# 📂 Worktree: /path/to/repo/.worktrees/session-sess-1731418800123-a1b2c3d4e
```

### 2. Do Your Work

```bash
cd /path/to/repo/.worktrees/session-<SESSION-ID>

# Edit files, commit changes, etc.
# Your work is isolated in this worktree
echo "code" > newfile.ts
git add .
git commit -m "Implement feature"
```

### 3. Check Status

```bash
ts-node j4c_session_cli.ts status <SESSION-ID>

# Shows:
# - Files changed
# - Commits created
# - Success metrics
# - Learning patterns
```

### 4. Merge Changes

```bash
# Merge back to main branch
ts-node j4c_session_cli.ts merge <SESSION-ID> --delete

# Or merge with specific strategy
ts-node j4c_session_cli.ts merge <SESSION-ID> --strategy squash --delete
```

### 5. All Done!

Your changes are now in the main branch, session is cleaned up.

---

## Common Tasks

### List All Sessions
```bash
ts-node j4c_session_cli.ts list
```

### View Analytics
```bash
ts-node j4c_session_cli.ts analytics
ts-node j4c_session_cli.ts analytics --json
```

### Create Checkpoint Before Risky Operation
```bash
ts-node j4c_session_cli.ts checkpoint <SESSION-ID> "Before refactoring"
```

### Restore from Checkpoint
```bash
ts-node j4c_session_cli.ts restore <SESSION-ID> <CHECKPOINT-ID>
```

### Clean Up Without Merging
```bash
ts-node j4c_session_cli.ts cleanup <SESSION-ID>
```

### Pull Latest from Main
```bash
ts-node j4c_session_cli.ts pull <SESSION-ID>
```

### Compare Two Sessions
```bash
ts-node j4c_session_cli.ts compare <SESSION-ID-1> <SESSION-ID-2>
```

---

## In Code

### Simple Usage

```typescript
import { J4CMultiSessionIntegration } from './j4c_multi_session_integration';

const integration = new J4CMultiSessionIntegration();
await integration.initialize();

// Create session
const { sessionId } = await integration.createAndStartSession({
  branchName: 'feature/api',
  userId: 'dev-001',
  projectId: 'myapp',
  taskDescription: 'Implement REST API'
});

// Do work
await integration.executeInSession(sessionId, async (ctx) => {
  // Your code here
  ctx.recordFeedback({ success: true, qualityScore: 95 });
});

// Merge
await integration.mergeSession(sessionId, { deleteAfterMerge: true });

await integration.shutdown();
```

### With Error Handling

```typescript
try {
  const session = await integration.createAndStartSession({
    branchName: 'feature/test',
    projectId: 'myapp',
    taskDescription: 'Test'
  });

  // Create checkpoint before work
  const checkpoint = await integration.createCheckpoint(
    session.sessionId,
    'Initial state'
  );

  await integration.executeInSession(session.sessionId, async (ctx) => {
    try {
      // Your work
      ctx.recordFeedback({ success: true });
    } catch (error) {
      console.error('Work failed, restoring...');
      integration.restoreFromCheckpoint(session.sessionId, checkpoint);
      throw error;
    }
  });

  // Merge if successful
  const result = await integration.mergeSession(session.sessionId);
  if (!result.success) {
    console.error('Merge failed:', result.message);
  }
} finally {
  await integration.shutdown();
}
```

---

## Session Workflow Examples

### Example 1: Feature Branch

```bash
# Create
ts-node j4c_session_cli.ts create feature/auth \
  --project backend \
  --task "Implement authentication" \
  --tags "security,feature"

# Get session ID from output

# Work in the worktree directory
cd .worktrees/session-<ID>
npm run test
# ... make changes ...
git commit -am "Add auth module"

# Check status
ts-node j4c_session_cli.ts status <SESSION-ID>

# Merge when done
ts-node j4c_session_cli.ts merge <SESSION-ID> --delete
```

### Example 2: Parallel Work

```bash
# Team member 1
ts-node j4c_session_cli.ts create feature/api \
  --project backend --task "API endpoints" --user alice

# Team member 2
ts-node j4c_session_cli.ts create feature/db \
  --project backend --task "Database schema" --user bob

# Team member 3
ts-node j4c_session_cli.ts create feature/auth \
  --project backend --task "Authentication" --user charlie

# Each works independently in their worktree
# View combined progress
ts-node j4c_session_cli.ts list
ts-node j4c_session_cli.ts analytics

# Merge in order of dependencies
ts-node j4c_session_cli.ts merge <DB-SESSION-ID> --delete
ts-node j4c_session_cli.ts merge <AUTH-SESSION-ID> --delete
ts-node j4c_session_cli.ts merge <API-SESSION-ID> --delete
```

### Example 3: Experimental Development

```bash
# Create experimental session
ts-node j4c_session_cli.ts create feature/experimental \
  --project research \
  --task "Try new approach" \
  --tags "experimental"

# Make changes
cd .worktrees/session-<ID>
# ... make experimental changes ...

# Create checkpoint
ts-node j4c_session_cli.ts checkpoint <SESSION-ID> "Before optimization"

# Try optimization
# ... more changes ...

# Check if it worked
npm run test

# If good, continue; if bad, restore
ts-node j4c_session_cli.ts restore <SESSION-ID> <CHECKPOINT-ID>

# When done
ts-node j4c_session_cli.ts merge <SESSION-ID> --strategy squash --delete
```

---

## CLI Command Reference

```
COMMAND              DESCRIPTION                    USAGE
──────────────────────────────────────────────────────────────
create               Create new session             create <branch> --project <id> --task <desc>
list                 List all sessions              list [--json]
status               Show session status            status <session-id>
merge                Merge session changes          merge <session-id> [--strategy] [--delete]
pull                 Pull latest changes            pull <session-id>
checkpoint           Create checkpoint              checkpoint <session-id> <description>
restore              Restore from checkpoint        restore <session-id> <checkpoint-id>
cleanup              Clean up session               cleanup <session-id> [--options]
analytics            Show analytics                 analytics [--json]
export               Export session                 export <session-id> <path> [--worktree]
compare              Compare sessions               compare <id1> <id2>
help                 Show help                      help
```

---

## Tips & Tricks

### 1. Use Meaningful Branch Names
```bash
# Good
ts-node j4c_session_cli.ts create feature/user-auth \
  --project myapp --task "Implement user authentication"

# Less helpful
ts-node j4c_session_cli.ts create feature/work \
  --project myapp --task "Do some work"
```

### 2. Tag Sessions for Organization
```bash
ts-node j4c_session_cli.ts create feature/api \
  --project myapp \
  --task "REST API" \
  --tags "backend,api,v2,priority-high"
```

### 3. Create Checkpoints at Milestones
```bash
# After each working milestone
ts-node j4c_session_cli.ts checkpoint <SESSION-ID> "Basic structure done"
ts-node j4c_session_cli.ts checkpoint <SESSION-ID> "Tests passing"
ts-node j4c_session_cli.ts checkpoint <SESSION-ID> "Code review ready"
```

### 4. Use Appropriate Merge Strategies
```bash
# For clean history
ts-node j4c_session_cli.ts merge <SESSION-ID> --strategy squash

# For preserving commits
ts-node j4c_session_cli.ts merge <SESSION-ID> --strategy merge

# For linear history
ts-node j4c_session_cli.ts merge <SESSION-ID> --strategy rebase
```

### 5. Archive Important Sessions
```bash
ts-node j4c_session_cli.ts export <SESSION-ID> ./archives/important-work.json
```

---

## Troubleshooting

### Session not found
```bash
# Check session ID
ts-node j4c_session_cli.ts list

# Make sure you have the right session ID
```

### Merge conflicts
```bash
# Try rebase instead
ts-node j4c_session_cli.ts merge <SESSION-ID> --strategy rebase
```

### Stuck session
```bash
# Force cleanup
ts-node j4c_session_cli.ts cleanup <SESSION-ID>
```

### Disk space issues
```bash
# List and cleanup old sessions
ts-node j4c_session_cli.ts list

# Archive before deleting
ts-node j4c_session_cli.ts export <SESSION-ID> ./archives/
ts-node j4c_session_cli.ts cleanup <SESSION-ID>
```

---

## System Requirements

- Git 2.17.0+ (worktrees support)
- Node.js 14+
- Bash/Shell (for CLI)
- Free disk space (≈ repo size per session)

---

## Performance

| Operation | Time |
|-----------|------|
| Create session | ~200ms |
| List sessions | ~10ms |
| Merge session | 0.5-5s |
| Create checkpoint | ~100ms |
| Status check | ~20ms |

---

## Questions?

See full documentation: `GIT_WORKTREES_INTEGRATION.md`

Or check the code comments in:
- `j4c_worktree_manager.ts`
- `j4c_session_state_manager.ts`
- `j4c_multi_session_integration.ts`
- `j4c_session_cli.ts`

---

**Version**: 2.0.0 | **Framework**: J4C Agent Framework | **Status**: Production Ready
