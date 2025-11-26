# J4C Multi-Session Integration with Git Worktrees

Welcome to the J4C Agent Framework v2.0 with integrated git worktrees support! This README will guide you through the new multi-session capabilities.

## What's New in v2.0

The J4C Agent Framework now supports **multiple concurrent Claude Code sessions** running in parallel, each with complete isolation and seamless git integration through git worktrees.

### Key Capabilities

✨ **Multi-Session Support**
- Run 10+ Claude Code sessions in parallel
- Each session has its own git worktree and isolated state
- No conflicts or cross-contamination

🔀 **Full Git Integration**
- Native git worktree support
- Multiple merge strategies (merge, rebase, squash)
- Branch management per session
- Snapshot and restore

📊 **Session Analytics**
- Track metrics across all sessions
- Per-session feedback and learning
- Session comparison tools
- Performance reporting

💻 **Easy-to-Use CLI**
- Simple commands for session management
- Status monitoring
- Checkpoint/restore functionality
- Export/import for archival

---

## Quick Start (5 Minutes)

### 1. Create a Session

```bash
ts-node j4c_session_cli.ts create feature/my-feature \
  --project myapp \
  --task "Implement new feature"
```

### 2. Do Your Work

```bash
cd .worktrees/session-<SESSION-ID>
# Edit files, commit changes, run tests
npm run test
git commit -am "Implement feature"
```

### 3. Merge Changes

```bash
ts-node j4c_session_cli.ts merge <SESSION-ID> --delete
```

That's it! Your changes are now in the main branch.

---

## Documentation

### For Quick Reference
→ **[WORKTREES_QUICK_START.md](WORKTREES_QUICK_START.md)**
- Common tasks and examples
- CLI command reference
- Tips and tricks
- 5-minute quick start

### For Complete Guide
→ **[GIT_WORKTREES_INTEGRATION.md](GIT_WORKTREES_INTEGRATION.md)**
- Architecture overview
- Complete API reference
- Advanced features
- Troubleshooting
- Best practices

### For Project Overview
→ **[GIT_WORKTREES_IMPLEMENTATION_SUMMARY.md](GIT_WORKTREES_IMPLEMENTATION_SUMMARY.md)**
- Implementation details
- Component descriptions
- Performance characteristics
- Deployment checklist

---

## Core Components

### 1. Worktree Manager
**File**: `j4c_worktree_manager.ts`

Manages git worktrees for each session:
- Create/destroy worktrees
- Git operations (merge, rebase, pull)
- Snapshots and recovery
- Worktree locking

### 2. Session State Manager
**File**: `j4c_session_state_manager.ts`

Manages isolated session state:
- Per-session feedback queue
- Per-session learning context
- Session checkpoints
- State consistency verification

### 3. Multi-Session Integration
**File**: `j4c_multi_session_integration.ts`

Orchestrates everything:
- Session lifecycle
- Execution coordination
- Analytics and reporting
- Framework integration

### 4. CLI Interface
**File**: `j4c_session_cli.ts`

User-friendly command line:
- 11 commands for full control
- Status monitoring
- Session management
- Analytics viewing

---

## CLI Commands

```
create               Create new session
list                 List all sessions
status               Show session status
merge                Merge session changes
pull                 Pull latest changes
checkpoint           Create checkpoint
restore              Restore from checkpoint
cleanup              Clean up session
analytics            Show analytics
export               Export session
compare              Compare sessions
help                 Show help
```

### Examples

```bash
# Create session
ts-node j4c_session_cli.ts create feature/auth \
  --project myapp \
  --task "Implement authentication" \
  --tags "security,feature"

# List sessions
ts-node j4c_session_cli.ts list

# Check status
ts-node j4c_session_cli.ts status <SESSION-ID>

# Create checkpoint
ts-node j4c_session_cli.ts checkpoint <SESSION-ID> "Stable version"

# Merge with strategy
ts-node j4c_session_cli.ts merge <SESSION-ID> --strategy squash --delete

# View analytics
ts-node j4c_session_cli.ts analytics
```

---

## Using in Code

### Simple Example

```typescript
import { J4CMultiSessionIntegration } from './j4c_multi_session_integration';

const integration = new J4CMultiSessionIntegration();
await integration.initialize();

// Create session
const { sessionId } = await integration.createAndStartSession({
  branchName: 'feature/my-feature',
  userId: 'dev-001',
  projectId: 'myapp',
  taskDescription: 'Implement feature'
});

// Do work
await integration.executeInSession(sessionId, async (ctx) => {
  // Your code here
  console.log(`Working in: ${ctx.getWorktreePath()}`);
  console.log(`Branch: ${ctx.getBranch()}`);

  // Record feedback
  ctx.recordFeedback({
    success: true,
    qualityScore: 95
  });
});

// Merge when done
await integration.mergeSession(sessionId, {
  deleteAfterMerge: true
});

await integration.shutdown();
```

### Parallel Sessions

```typescript
// Create multiple sessions
const sessions = await Promise.all([
  createAndStartSession({ branchName: 'feature/api' }),
  createAndStartSession({ branchName: 'feature/db' }),
  createAndStartSession({ branchName: 'feature/ui' })
]);

// Execute in parallel
await Promise.all(
  sessions.map(s =>
    executeInSession(s.sessionId, yourWorkFunction)
  )
);

// Merge all
for (const session of sessions) {
  await mergeSession(session.sessionId, { deleteAfterMerge: true });
}
```

---

## Use Cases

### 1. Feature Development
```bash
ts-node j4c_session_cli.ts create feature/new-api \
  --project backend --task "REST API v2"
# Work in isolation
ts-node j4c_session_cli.ts merge <ID> --delete
```

### 2. Parallel Team Development
Team members work on different features in parallel:
```bash
# Alice
ts-node j4c_session_cli.ts create feature/auth --user alice

# Bob
ts-node j4c_session_cli.ts create feature/database --user bob

# Charlie
ts-node j4c_session_cli.ts create feature/ui --user charlie

# Each works independently, then merge in order
```

### 3. Experimentation
```bash
# Try approach A
ts-node j4c_session_cli.ts create impl/approach-a
# Try approach B
ts-node j4c_session_cli.ts create impl/approach-b

# Compare results
ts-node j4c_session_cli.ts compare impl-a-id impl-b-id

# Merge the better one
```

### 4. Risk Management
```bash
# Create checkpoint before risky operation
ts-node j4c_session_cli.ts checkpoint <ID> "Before refactoring"

# Make risky changes
# ...

# Restore if needed
ts-node j4c_session_cli.ts restore <ID> <CHECKPOINT-ID>
```

---

## Key Features

### ✨ Complete Isolation

Each session has:
- Separate git worktree
- Isolated feedback queue
- Isolated learning context
- Session-scoped messages

No conflicts or interference between sessions.

### 🔄 Easy Merging

Multiple merge strategies:
- **Merge**: Preserves all commits
- **Rebase**: Linear history
- **Squash**: Single commit

### 📸 Checkpointing

Save and restore session state:
```bash
ts-node j4c_session_cli.ts checkpoint <ID> "Stable version"
ts-node j4c_session_cli.ts restore <ID> <CHECKPOINT-ID>
```

### 📊 Analytics

Track metrics across all sessions:
```bash
ts-node j4c_session_cli.ts analytics
# Shows: total sessions, success rates, duration, metrics
```

### 🔍 Comparison

Compare two sessions:
```bash
ts-node j4c_session_cli.ts compare <ID1> <ID2>
# Shows: differences in performance, learning, metrics
```

---

## File Structure

After creating sessions, your repository will have:

```
.worktrees/
├── session-sess-001/         # Session 1 worktree
├── session-sess-002/         # Session 2 worktree
└── session-sess-003/         # Session 3 worktree

.j4c/
├── state/
│   └── sessions.json         # Session states
├── sessions/
│   └── sessions.json         # Worktree metadata
├── logs/
│   └── session-*.log         # Session logs
└── checkpoints/
    └── session-<id>/         # Checkpoints per session
```

---

## Integration with J4C Framework

The multi-session system integrates seamlessly with existing J4C components:

### Learning Framework
- Per-session learning context
- Isolated pattern detection
- Session-specific insights

### Feedback System
- Per-session feedback queue
- Isolated processing
- Session-independent consolidation

### Agent Communication
- Session-scoped message routing
- Per-session message bus
- Isolated agent interactions

---

## System Requirements

- **Git**: 2.17.0+ (for worktree support)
- **Node.js**: 14+
- **Disk Space**: ~1x repo size per session
- **Memory**: ~10-20MB per session

---

## Performance

| Operation | Time | Notes |
|-----------|------|-------|
| Create session | 150-200ms | Git worktree |
| Execute | 10-50ms | Per-session |
| Merge | 1-5s | Depends on changes |
| List sessions | 10-20ms | In-memory |
| Cleanup | 100-300ms | I/O |

**Scalability**: 10-20 concurrent sessions recommended

---

## Common Tasks

### Create Session for Feature
```bash
ts-node j4c_session_cli.ts create feature/auth \
  --project myapp \
  --task "User authentication"
```

### Check What's Happening
```bash
ts-node j4c_session_cli.ts status <SESSION-ID>
```

### Before Risky Changes
```bash
ts-node j4c_session_cli.ts checkpoint <SESSION-ID> "Safe point"
```

### Merge and Cleanup
```bash
ts-node j4c_session_cli.ts merge <SESSION-ID> --delete
```

### View Progress
```bash
ts-node j4c_session_cli.ts list
ts-node j4c_session_cli.ts analytics
```

---

## Troubleshooting

### Session not found
Check the session ID:
```bash
ts-node j4c_session_cli.ts list
```

### Merge conflicts
Try a different strategy:
```bash
ts-node j4c_session_cli.ts merge <ID> --strategy rebase
```

### Stuck session
Force cleanup:
```bash
ts-node j4c_session_cli.ts cleanup <ID>
```

### Disk space issues
Clean up old sessions:
```bash
ts-node j4c_session_cli.ts cleanup <OLD-SESSION-ID>
```

For more troubleshooting, see the [Complete Guide](GIT_WORKTREES_INTEGRATION.md#troubleshooting).

---

## Next Steps

1. **Read the Quick Start**: [WORKTREES_QUICK_START.md](WORKTREES_QUICK_START.md)
2. **Try a Session**: `ts-node j4c_session_cli.ts create test --project test --task test`
3. **Check the Docs**: [GIT_WORKTREES_INTEGRATION.md](GIT_WORKTREES_INTEGRATION.md)
4. **Use in Your Project**: Import and use the classes in your code

---

## Support

- **Quick Reference**: [WORKTREES_QUICK_START.md](WORKTREES_QUICK_START.md)
- **Full Documentation**: [GIT_WORKTREES_INTEGRATION.md](GIT_WORKTREES_INTEGRATION.md)
- **Implementation Details**: [GIT_WORKTREES_IMPLEMENTATION_SUMMARY.md](GIT_WORKTREES_IMPLEMENTATION_SUMMARY.md)
- **Code Comments**: Check the implementation files

---

## Version Info

- **Framework Version**: J4C Agent Framework v2.0
- **Multi-Session Version**: 2.0.0
- **Status**: Production Ready
- **Last Updated**: November 12, 2025

---

## Summary

The J4C Agent Framework v2.0 with git worktrees integration enables:

✅ Multiple concurrent Claude Code sessions
✅ Complete session isolation
✅ Seamless git integration
✅ Easy session management
✅ Comprehensive analytics
✅ Full backward compatibility

**Get started now**: `ts-node j4c_session_cli.ts create feature/test --project test --task "Try it out"`

Happy coding! 🚀
