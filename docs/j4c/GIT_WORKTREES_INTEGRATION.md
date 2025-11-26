# J4C Git Worktrees Integration Guide

## Overview

This document describes the new git worktrees integration in J4C Agent Framework v2.0, enabling multiple concurrent Claude Code sessions with complete isolation and seamless git workflow integration.

**Status**: Production Ready
**Version**: 2.0.0
**Author**: J4C Framework Team

---

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Core Components](#core-components)
3. [Key Features](#key-features)
4. [Getting Started](#getting-started)
5. [Usage Examples](#usage-examples)
6. [API Reference](#api-reference)
7. [CLI Commands](#cli-commands)
8. [Session Lifecycle](#session-lifecycle)
9. [Advanced Features](#advanced-features)
10. [Troubleshooting](#troubleshooting)

---

## Architecture Overview

### Design Principles

- **Isolation**: Each session has its own git worktree, state container, and learning context
- **Concurrency**: Multiple sessions can run in parallel without conflicts
- **Integration**: Seamless integration with existing J4C framework components
- **Scalability**: Supports any number of concurrent sessions (limited by system resources)
- **Observability**: Complete tracking and analytics for all sessions

### System Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                    J4C Multi-Session Integration                    │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  ┌──────────────────┐  ┌──────────────────┐  ┌────────────────┐   │
│  │  CLI Interface   │  │  REST API        │  │  Event System  │   │
│  │  (j4c_session_   │  │  (future)        │  │  (EventEmitter)│   │
│  │   cli.ts)        │  │                  │  │                │   │
│  └────────┬─────────┘  └────────┬─────────┘  └────────┬────────┘   │
│           │                     │                     │            │
│           └─────────────────────┼─────────────────────┘            │
│                                 ▼                                  │
│         ┌──────────────────────────────────────┐                  │
│         │ J4CMultiSessionIntegration           │                  │
│         │ - Session lifecycle management       │                  │
│         │ - Execution orchestration            │                  │
│         │ - Analytics & reporting              │                  │
│         └──────────────────────────────────────┘                  │
│                     │                     │                       │
│          ┌──────────▼──────────┐  ┌──────▼──────────┐             │
│          │ J4CWorktreeManager  │  │J4CSessionState   │             │
│          │                     │  │Manager           │             │
│          │ • Create worktrees  │  │                  │             │
│          │ • Manage branches   │  │ • Session state  │             │
│          │ • Git operations    │  │ • Checkpoints    │             │
│          │ • File isolation    │  │ • Feedback queue │             │
│          │ • Snapshots         │  │ • Learning state │             │
│          └────────┬────────────┘  └────────┬─────────┘             │
│                   │                        │                      │
│                   ▼                        ▼                      │
│    ┌──────────────────────────────────────────────┐               │
│    │  File System                                │               │
│    │  .worktrees/     - Isolated worktree dirs   │               │
│    │  .j4c/           - Session metadata         │               │
│    │  .git/           - Main repo                │               │
│    └──────────────────────────────────────────────┘               │
│                                                                   │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Core Components

### 1. J4CWorktreeManager (`j4c_worktree_manager.ts`)

**Purpose**: Manages git worktrees and session-specific git operations

**Key Responsibilities**:
- Create/destroy worktrees for each session
- Manage branches and checkouts
- Execute git operations in session context
- Handle worktree snapshots and recovery
- Track worktree locks

**Key Methods**:
```typescript
// Session creation
createSession(branchName, options): Promise<WorktreeSession>

// Git operations
executeGitCommand(sessionId, command, args): Promise<string>
mergeSessionChanges(sessionId, options): Promise<MergeResult>
pullLatestChanges(sessionId): Promise<Result>

// Snapshots
createSnapshot(sessionId, description): Promise<snapshotId>
restoreFromSnapshot(sessionId, snapshotId): Promise<void>

// Cleanup
cleanupSession(sessionId, options): Promise<void>
```

### 2. J4CSessionStateManager (`j4c_session_state_manager.ts`)

**Purpose**: Manages session-isolated state and learning context

**Key Responsibilities**:
- Maintain per-session state (feedback, learning, messages)
- Handle session checkpoints and restore
- Implement isolation rules
- Track session statistics
- Verify state consistency

**Key Methods**:
```typescript
// Session management
createSessionState(options): SessionState
getSessionState(sessionId): SessionState | undefined

// State operations
recordFeedbackInSession(sessionId, feedback): void
addLearningEvent(sessionId, event): void
recordMessageSent/Received(sessionId, message): void

// Checkpoints
createCheckpoint(sessionId, description): string
restoreFromCheckpoint(sessionId, checkpointId): void

// Analytics
getSessionSummary(sessionId): Record<string, any>
verifySessionConsistency(sessionId): ConsistencyReport
```

### 3. J4CMultiSessionIntegration (`j4c_multi_session_integration.ts`)

**Purpose**: Orchestrates multi-session functionality with existing J4C framework

**Key Responsibilities**:
- Coordinate worktree and state management
- Provide unified session execution interface
- Handle session merging and synchronization
- Generate multi-session analytics

**Key Methods**:
```typescript
// Session lifecycle
createAndStartSession(options): Promise<Session>
executeInSession<T>(sessionId, callback): Promise<T>
cleanupSession(sessionId, options): Promise<void>

// Git operations
mergeSession(sessionId, options): Promise<MergeResult>
pullLatestChanges(sessionId): Promise<Result>

// Analytics & reporting
getActiveSessions(): SessionState[]
getAnalytics(): SessionAnalytics
listSessionsWithStatus(): Array<SessionInfo>
printSessionStatus(): void
```

### 4. J4CSessionCLI (`j4c_session_cli.ts`)

**Purpose**: Command-line interface for session management

**Supported Commands**:
- `create` - Create new session
- `list` - List all sessions
- `status` - Show session status
- `merge` - Merge session changes
- `pull` - Pull latest changes
- `checkpoint` - Create checkpoint
- `restore` - Restore from checkpoint
- `cleanup` - Clean up session
- `analytics` - Show analytics
- `export` - Export session
- `compare` - Compare sessions

---

## Key Features

### 1. Complete Session Isolation

Each session operates in its own:
- **Git Worktree**: Separate working directory with isolated branch state
- **Session State Container**: Independent feedback queue, learning context, and statistics
- **Message Bus**: Session-scoped message routing and communication
- **Learning Framework**: Isolated event queue and pattern detection

```
Session A: feature/auth        Session B: feature/api
├── Worktree: .worktrees/sess-001    ├── Worktree: .worktrees/sess-002
├── Branch: feature/auth              ├── Branch: feature/api
├── State:                            ├── State:
│   ├── Feedback queue (isolated)     │   ├── Feedback queue (isolated)
│   ├── Learning events (isolated)    │   ├── Learning events (isolated)
│   └── Messages (session-scoped)     │   └── Messages (session-scoped)
```

### 2. Multi-Session Execution

```typescript
// Execute work in session context
await integration.executeInSession(sessionId, async (ctx) => {
  // Operations are isolated to this session
  ctx.recordFeedback({ ... });
  ctx.addLearningEvent({ ... });
  return result;
});
```

### 3. Session Checkpointing

Save and restore session state at any point:

```typescript
// Create checkpoint
const checkpointId = await integration.createCheckpoint(
  sessionId,
  "Stable version before refactoring"
);

// Restore from checkpoint
integration.restoreFromCheckpoint(sessionId, checkpointId);
```

### 4. Session Merging

Merge changes from one session back to parent branch:

```typescript
const result = await integration.mergeSession(sessionId, {
  strategy: 'squash',        // merge, rebase, or squash
  commitMessage: 'Feature complete',
  deleteAfterMerge: true     // Clean up session after merge
});
```

### 5. Session Analytics

Track performance and metrics across all sessions:

```typescript
const analytics = integration.getAnalytics();
// Returns:
// - Total sessions
// - Active/completed/failed counts
// - Success rates
// - Duration statistics
// - Feedback metrics
```

### 6. Session Snapshots

Create git-level snapshots for recovery:

```typescript
// Snapshot entire session state
const snapshotId = await worktreeManager.createSnapshot(
  sessionId,
  "Before major refactoring"
);

// Restore entire session state
await worktreeManager.restoreFromSnapshot(sessionId, snapshotId);
```

### 7. Cross-Session Comparison

Compare metrics between sessions:

```typescript
const comparison = integration.compareSessions(sessionId1, sessionId2);
// Shows differences in:
// - Success rates
// - Learning patterns
// - Execution metrics
// - Feedback statistics
```

---

## Getting Started

### Prerequisites

- Git 2.17.0+ (required for worktrees)
- Node.js 14+
- Existing J4C Agent Framework installation

### Installation

The components are already integrated into the J4C framework:

```bash
# The following files are available in your repository:
# - j4c_worktree_manager.ts
# - j4c_session_state_manager.ts
# - j4c_multi_session_integration.ts
# - j4c_session_cli.ts
```

### Quick Start

#### 1. Via CLI

```bash
# Create new session
ts-node j4c_session_cli.ts create feature/my-feature \
  --project myapp \
  --task "Implement new feature"

# List sessions
ts-node j4c_session_cli.ts list

# Check session status
ts-node j4c_session_cli.ts status <session-id>

# Merge and cleanup
ts-node j4c_session_cli.ts merge <session-id> --delete
```

#### 2. Via TypeScript API

```typescript
import { J4CMultiSessionIntegration } from './j4c_multi_session_integration';

const integration = new J4CMultiSessionIntegration();
await integration.initialize();

// Create session
const { sessionId, worktreeSession } = await integration.createAndStartSession({
  branchName: 'feature/new-api',
  userId: 'dev-001',
  projectId: 'myapp',
  taskDescription: 'Implement REST API'
});

console.log(`Session created: ${sessionId}`);
console.log(`Worktree: ${worktreeSession.worktreePath}`);
```

---

## Usage Examples

### Example 1: Simple Task Execution

```typescript
const integration = new J4CMultiSessionIntegration();
await integration.initialize();

// Create session
const { sessionId } = await integration.createAndStartSession({
  branchName: 'feature/auth-service',
  userId: 'alice',
  projectId: 'backend',
  taskDescription: 'Implement authentication service'
});

// Execute work
await integration.executeInSession(sessionId, async (ctx) => {
  // Run tests
  const testResult = await runTests(ctx.getWorktreePath());

  // Record feedback
  ctx.recordFeedback({
    taskType: 'feature_implementation',
    success: testResult.passed,
    qualityScore: 95,
    complianceScore: 88
  });

  // Add learning event
  ctx.addLearningEvent({
    pattern: 'test_driven_development',
    confidence: 0.92
  });
});

// Merge when done
const mergeResult = await integration.mergeSession(sessionId, {
  strategy: 'squash',
  deleteAfterMerge: true
});

console.log(`Merged: ${mergeResult.success ? '✓' : '✗'}`);

await integration.shutdown();
```

### Example 2: Parallel Sessions

```typescript
const integration = new J4CMultiSessionIntegration();
await integration.initialize();

// Create multiple sessions in parallel
const sessionPromises = [
  {
    branch: 'feature/api',
    task: 'Implement REST endpoints'
  },
  {
    branch: 'feature/database',
    task: 'Setup database schema'
  },
  {
    branch: 'feature/auth',
    task: 'Implement authentication'
  }
].map(task =>
  integration.createAndStartSession({
    branchName: task.branch,
    userId: 'dev-team',
    projectId: 'myapp',
    taskDescription: task.task
  })
);

const sessions = await Promise.all(sessionPromises);
console.log(`Created ${sessions.length} parallel sessions`);

// Execute in parallel
await Promise.all(
  sessions.map(session =>
    integration.executeInSession(session.sessionId, async (ctx) => {
      // Independent execution
      const result = await doWork(ctx.getWorktreePath());
      ctx.recordFeedback({ success: result.ok, qualityScore: result.score });
      return result;
    })
  )
);

// Print analytics
integration.printSessionStatus();

// Merge all sessions
for (const session of sessions) {
  await integration.mergeSession(session.sessionId, {
    deleteAfterMerge: true
  });
}

await integration.shutdown();
```

### Example 3: Checkpoint & Restore

```typescript
const integration = new J4CMultiSessionIntegration();
await integration.initialize();

const { sessionId } = await integration.createAndStartSession({
  branchName: 'feature/experimental',
  userId: 'dev-001',
  projectId: 'research',
  taskDescription: 'Experimental implementation'
});

// Do some work
await integration.executeInSession(sessionId, async (ctx) => {
  // ... work ...
});

// Create checkpoint before risky operation
const checkpoint1 = await integration.createCheckpoint(
  sessionId,
  'Stable version before optimization"
);

// Try optimization
await integration.executeInSession(sessionId, async (ctx) => {
  // ... optimizations ...
});

// If something breaks, restore
if (somethingBroke) {
  integration.restoreFromCheckpoint(sessionId, checkpoint1);
  console.log('Restored to previous state');
}

// Otherwise continue with more work
const checkpoint2 = await integration.createCheckpoint(
  sessionId,
  'After successful optimization'
);

await integration.cleanupSession(sessionId);
await integration.shutdown();
```

### Example 4: Session Comparison

```typescript
const integration = new J4CMultiSessionIntegration();
await integration.initialize();

// Create two implementations
const session1 = await integration.createAndStartSession({
  branchName: 'impl/approach-a',
  projectId: 'comparison',
  taskDescription: 'Implementation approach A'
});

const session2 = await integration.createAndStartSession({
  branchName: 'impl/approach-b',
  projectId: 'comparison',
  taskDescription: 'Implementation approach B'
});

// Execute both
for (const session of [session1, session2]) {
  await integration.executeInSession(session.sessionId, async (ctx) => {
    // Execute implementation
    const result = await executeImplementation(ctx.getWorktreePath());
    ctx.recordFeedback({
      success: true,
      qualityScore: result.quality,
      complianceScore: result.compliance
    });
  });
}

// Compare results
const comparison = integration.compareSessions(
  session1.sessionId,
  session2.sessionId
);

console.log('Session 1:', comparison.session1);
console.log('Session 2:', comparison.session2);
console.log('Differences:', comparison.differences);

// Choose better approach and merge
const better = comparison.session1.feedback.successRate >
               comparison.session2.feedback.successRate ?
               session1 : session2;

await integration.mergeSession(better.sessionId, {
  deleteAfterMerge: true
});

await integration.shutdown();
```

---

## API Reference

### J4CMultiSessionIntegration

#### createAndStartSession(options)

Creates and starts a new session.

**Parameters**:
```typescript
{
  branchName: string;              // Git branch name
  userId: string;                  // User identifier
  projectId: string;               // Project identifier
  taskDescription: string;         // Task description
  parentBranch?: string;          // Parent branch (default: main)
  tags?: string[];                // Optional tags
}
```

**Returns**: `Promise<{ sessionId, worktreeSession, stateSession }>`

#### executeInSession(sessionId, callback, options)

Executes work in session context.

**Parameters**:
- `sessionId`: Session identifier
- `callback`: Async function receiving SessionExecutionContext
- `options`:
  - `createSnapshot`: Create pre-execution snapshot
  - `recordFeedback`: Enable feedback recording
  - `updateLearning`: Enable learning updates
  - `isolateExecution`: Enforce isolation

**Returns**: `Promise<T>` (callback return value)

#### mergeSession(sessionId, options)

Merges session changes back to parent.

**Parameters**:
- `sessionId`: Session identifier
- `options`:
  - `strategy`: 'merge' | 'rebase' | 'squash'
  - `commitMessage`: Custom commit message
  - `deleteAfterMerge`: Delete session after merge

**Returns**: `Promise<MergeResult>`

#### getActiveSessions()

Returns all active sessions.

**Returns**: `SessionState[]`

#### getAnalytics()

Returns multi-session analytics.

**Returns**: `SessionAnalytics`

#### listSessionsWithStatus()

Lists all sessions with status.

**Returns**: `Array<SessionInfo>`

---

## CLI Commands

### create

Create new session.

```bash
ts-node j4c_session_cli.ts create <branch> --project <id> --task <desc> [options]

Options:
  --project <id>    Project ID (required)
  --task <desc>     Task description (required)
  --user <id>       User ID
  --tags <tags>     Comma-separated tags
```

### list

List all sessions.

```bash
ts-node j4c_session_cli.ts list [--json]
```

### status

Show session status.

```bash
ts-node j4c_session_cli.ts status <session-id>
```

### merge

Merge session changes.

```bash
ts-node j4c_session_cli.ts merge <session-id> [--strategy <s>] [--delete]

Options:
  --strategy     merge|rebase|squash
  --delete       Delete after merge
```

### pull

Pull latest changes.

```bash
ts-node j4c_session_cli.ts pull <session-id>
```

### checkpoint

Create checkpoint.

```bash
ts-node j4c_session_cli.ts checkpoint <session-id> <description>
```

### restore

Restore from checkpoint.

```bash
ts-node j4c_session_cli.ts restore <session-id> <checkpoint-id>
```

### cleanup

Clean up session.

```bash
ts-node j4c_session_cli.ts cleanup <session-id> [--keep-worktree] [--no-archive]
```

### analytics

Show analytics.

```bash
ts-node j4c_session_cli.ts analytics [--json]
```

---

## Session Lifecycle

### Creation Phase
1. Create worktree in `.worktrees/`
2. Create session state
3. Initialize feedback queue
4. Set up message routing
5. Create checkpoint for initial state

### Execution Phase
1. Acquire lock on session
2. Execute callback in session context
3. Record feedback
4. Track learning events
5. Update statistics
6. Release lock

### Merge Phase
1. Validate session state
2. Merge worktree branch to parent
3. Update session status to 'completed'
4. Optionally create final checkpoint

### Cleanup Phase
1. Save session logs
2. Archive session metadata
3. Remove worktree
4. Delete branch (optional)
5. Clean up state records

### Abandoned Phase
Sessions marked as abandoned after 7 days of inactivity can be cleaned up:
```bash
ts-node j4c_session_cli.ts cleanup <session-id>
```

---

## Advanced Features

### 1. Session Isolation Rules

Control what gets isolated per session:

```typescript
stateManager.setIsolationRules({
  isolateFeedback: true,        // Separate feedback per session
  isolateLearning: true,        // Separate learning context
  isolateMessages: true,        // Session-scoped messages
  isolateEnvironment: true,     // Separate env vars
  shareGlobalContext: true      // Share global insights
});
```

### 2. Custom Checkpointing

Create checkpoints with snapshots:

```typescript
const checkpointId = await stateManager.createCheckpoint(
  sessionId,
  'Pre-deployment checkpoint',
  {
    'package.json': fs.readFileSync('package.json', 'utf-8'),
    'config.yml': fs.readFileSync('config.yml', 'utf-8')
  }
);
```

### 3. Session Merging Strategy

Different merge strategies for different scenarios:

```typescript
// Merge: Preserves all commits
await integration.mergeSession(sessionId, { strategy: 'merge' });

// Rebase: Linear history
await integration.mergeSession(sessionId, { strategy: 'rebase' });

// Squash: Single commit
await integration.mergeSession(sessionId, { strategy: 'squash' });
```

### 4. State Verification

Verify session state consistency:

```typescript
const { valid, issues } = stateManager.verifySessionConsistency(sessionId);
if (!valid) {
  console.log('Consistency issues:', issues);
}
```

### 5. Session Export/Import

Export sessions for archival and sharing:

```typescript
// Export
await integration.exportSession(sessionId, 'session-backup.json', true);

// Import
const importedId = stateManager.importSession('session-backup.json');
```

---

## Troubleshooting

### Worktree Already Exists

**Problem**: "Worktree already exists at path"

**Solution**:
```bash
# List existing worktrees
git worktree list

# Remove stale worktree
git worktree remove /path/to/worktree --force
```

### Session Lock Timeout

**Problem**: Session appears stuck due to lock

**Solution**:
```typescript
// Manually release lock
locks.delete(sessionId);
persistLocksToDisk();
```

### Merge Conflicts

**Problem**: Merge fails due to conflicts

**Solution**:
```bash
# Try rebase strategy instead of merge
ts-node j4c_session_cli.ts merge <session-id> --strategy rebase

# Or resolve conflicts manually in worktree
cd .worktrees/session-<id>
# Resolve conflicts
git add .
git commit -m "Resolved conflicts"
```

### High Disk Usage

**Problem**: Too many worktrees consuming disk space

**Solution**:
```bash
# Cleanup abandoned sessions
ts-node j4c_session_cli.ts cleanup <session-id>

# Or cleanup all stale sessions
for session in $(ts-node j4c_session_cli.ts list | grep abandoned); do
  ts-node j4c_session_cli.ts cleanup $session
done
```

### Performance Degradation

**Problem**: Slowdowns with many concurrent sessions

**Solution**:
- Limit concurrent sessions to 5-10 per developer
- Use `--delete` flag in merge to clean up completed sessions
- Run periodic cleanup: `cleanupAbandonedSessions()`

---

## Integration with J4C Framework

### With J4C Continuous Learning

Sessions maintain separate learning context:

```typescript
// Learning is isolated per session
addLearningEvent(sessionId, {
  pattern: 'error_handling',
  confidence: 0.85
});

// Gets recorded in session-specific queue
const learning = getSessionLearning(sessionId);
```

### With J4C Integration Layer

Feedback flows to session-specific queues:

```typescript
// Feedback recorded in session context
recordFeedbackInSession(sessionId, {
  success: true,
  qualityScore: 92,
  complianceScore: 88
});

// Session can be consolidated independently
await consolidateSession(sessionId);
```

### With GitHub Agent HQ

Sessions integrate with GitHub workflows:

```typescript
// Session executes in isolated branch
// Feedback recorded separately
// Can trigger GitHub workflows per session
await executeWorkflow(sessionId, 'test-and-deploy');
```

---

## Performance Characteristics

| Operation | Time | Notes |
|-----------|------|-------|
| Create session | 100-200ms | Includes git worktree creation |
| Execute in session | 10-50ms | Lock/unlock overhead |
| Create checkpoint | 50-100ms | Depends on file count |
| Merge session | 500ms-5s | Depends on change size |
| Cleanup session | 100-300ms | Includes I/O and cleanup |
| List sessions | 10-50ms | In-memory operation |

---

## Best Practices

1. **Always cleanup**: Use `cleanupSession()` after completion
2. **Create checkpoints**: Before risky operations
3. **Monitor resource usage**: Watch disk and memory for many sessions
4. **Use meaningful branch names**: For easy identification
5. **Record feedback**: Enables learning and analytics
6. **Isolate concerns**: One session per major task
7. **Merge frequently**: Avoid large, complex merges
8. **Archive logs**: Keep historical data for analysis

---

## Future Enhancements

- [ ] REST API for remote session management
- [ ] Web dashboard for session monitoring
- [ ] Automatic session merging based on criteria
- [ ] Cross-session learning synthesis
- [ ] Session templates and presets
- [ ] Horizontal scaling across machines
- [ ] Real-time collaboration on sessions
- [ ] Session time-travel debugging

---

## Support

For issues or questions:
1. Check [Troubleshooting](#troubleshooting) section
2. Review session logs in `.j4c/logs/`
3. Verify git worktree status with `git worktree list`
4. Check session state consistency with verification tools

---

**Version**: 2.0.0
**Last Updated**: 2025-11-12
**Framework**: J4C Agent Framework
**Status**: Production Ready
