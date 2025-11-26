#!/usr/bin/env node

/**
 * J4C Multi-Session CLI
 *
 * Command-line interface for managing Claude Code sessions with git worktrees.
 *
 * Usage:
 *   j4c-session create <branch> --project <id> --task <description>
 *   j4c-session list
 *   j4c-session status <session-id>
 *   j4c-session merge <session-id> [--delete]
 *   j4c-session pull <session-id>
 *   j4c-session checkpoint <session-id> <description>
 *   j4c-session restore <session-id> <checkpoint-id>
 *   j4c-session cleanup <session-id>
 *   j4c-session analytics
 *
 * @author J4C Framework
 * @version 2.0.0
 */

import * as fs from 'fs';
import * as path from 'path';
import { J4CMultiSessionIntegration } from './j4c_multi_session_integration';

/**
 * CLI Command Handler
 */
class J4CSessionCLI {
  private integration: J4CMultiSessionIntegration;

  constructor() {
    this.integration = new J4CMultiSessionIntegration(process.cwd());
  }

  /**
   * Run CLI
   */
  async run(args: string[]): Promise<void> {
    await this.integration.initialize();

    const command = args[0];

    try {
      switch (command) {
        case 'create':
          await this.handleCreate(args.slice(1));
          break;

        case 'list':
          await this.handleList(args.slice(1));
          break;

        case 'status':
          await this.handleStatus(args.slice(1));
          break;

        case 'merge':
          await this.handleMerge(args.slice(1));
          break;

        case 'pull':
          await this.handlePull(args.slice(1));
          break;

        case 'checkpoint':
          await this.handleCheckpoint(args.slice(1));
          break;

        case 'restore':
          await this.handleRestore(args.slice(1));
          break;

        case 'cleanup':
          await this.handleCleanup(args.slice(1));
          break;

        case 'analytics':
          await this.handleAnalytics(args.slice(1));
          break;

        case 'export':
          await this.handleExport(args.slice(1));
          break;

        case 'compare':
          await this.handleCompare(args.slice(1));
          break;

        case 'help':
        case '--help':
        case '-h':
          this.printHelp();
          break;

        default:
          console.error(`Unknown command: ${command}`);
          this.printHelp();
          process.exit(1);
      }
    } catch (error) {
      console.error('❌ Command failed:', (error as Error).message);
      process.exit(1);
    } finally {
      await this.integration.shutdown();
    }
  }

  /**
   * Handle create command
   */
  private async handleCreate(args: string[]): Promise<void> {
    if (args.length === 0) {
      console.error('Usage: j4c-session create <branch> [options]');
      console.error('Options:');
      console.error('  --project <id>        Project ID (required)');
      console.error('  --task <description>  Task description (required)');
      console.error('  --user <id>           User ID (optional)');
      console.error('  --tags <tags>         Comma-separated tags (optional)');
      process.exit(1);
    }

    const branch = args[0];
    const options = this.parseOptions(args.slice(1));

    if (!options.project) {
      console.error('Error: --project is required');
      process.exit(1);
    }

    if (!options.task) {
      console.error('Error: --task is required');
      process.exit(1);
    }

    const result = await this.integration.createAndStartSession({
      branchName: branch,
      userId: options.user || 'claude-code',
      projectId: options.project,
      taskDescription: options.task,
      tags: options.tags ? options.tags.split(',') : [],
    });

    console.log('\n✅ Session created successfully');
    console.log(`📝 Session ID: ${result.sessionId}`);
    console.log(`🔀 Branch: ${result.worktreeSession.branch}`);
    console.log(`📂 Worktree: ${result.worktreeSession.worktreePath}`);
    console.log(`⏰ Created: ${new Date(result.stateSession.createdAt).toISOString()}`);
  }

  /**
   * Handle list command
   */
  private async handleList(args: string[]): Promise<void> {
    const options = this.parseOptions(args);

    const sessions = this.integration.listSessionsWithStatus();

    if (sessions.length === 0) {
      console.log('No sessions found');
      return;
    }

    console.log('\n📋 J4C Sessions\n');

    if (options.json) {
      console.log(JSON.stringify(sessions, null, 2));
    } else {
      const table = this.formatTable([
        { width: 20, text: 'Session ID' },
        { width: 12, text: 'Status' },
        { width: 20, text: 'Branch' },
        { width: 30, text: 'Created' },
        { width: 20, text: 'Last Activity' },
      ]);

      console.log(table.header());
      console.log(table.separator());

      for (const session of sessions) {
        const created = new Date(session.created).toISOString().split('T')[0];
        const lastActivity = new Date(session.lastActivity).toISOString().split('T')[0];

        console.log(
          table.row([
            session.sessionId.substring(0, 18),
            session.status,
            session.branch.substring(0, 18),
            created,
            lastActivity,
          ])
        );
      }
    }

    console.log(`\nTotal: ${sessions.length} sessions`);
  }

  /**
   * Handle status command
   */
  private async handleStatus(args: string[]): Promise<void> {
    if (args.length === 0) {
      console.error('Usage: j4c-session status <session-id>');
      process.exit(1);
    }

    const sessionId = args[0];
    const status = this.integration.getSessionStatus(sessionId);

    if (!status.state) {
      console.error(`Session not found: ${sessionId}`);
      process.exit(1);
    }

    const summary = status.summary;

    console.log(`\n📊 Session Status: ${sessionId}\n`);
    console.log(`Status: ${status.state.status}`);
    console.log(`Branch: ${status.state.environment.branch}`);
    console.log(`Worktree: ${status.state.environment.worktreePath}`);
    console.log(`Created: ${new Date(status.state.createdAt).toISOString()}`);
    console.log(`Last Activity: ${new Date(status.state.lastActivity).toISOString()}`);

    if (summary) {
      console.log(`\n⏱️  Duration: ${summary.uptimeFormatted}`);

      console.log(`\n📝 Feedback:`);
      console.log(`   Total: ${summary.feedback.total}`);
      console.log(`   Success: ${summary.feedback.successCount}`);
      console.log(`   Failure: ${summary.feedback.failureCount}`);
      console.log(`   Success Rate: ${summary.feedback.successRate}`);

      console.log(`\n🧠 Learning:`);
      console.log(`   Events: ${summary.learning.eventsProcessed}`);
      console.log(`   Patterns: ${summary.learning.patternsDetected}`);
      console.log(`   Insights: ${summary.learning.insightsGenerated}`);

      console.log(`\n💬 Messages:`);
      console.log(`   Sent: ${summary.messages.sent}`);
      console.log(`   Received: ${summary.messages.received}`);
      console.log(`   Routes: ${summary.messages.routes}`);

      console.log(`\n🎯 Metadata:`);
      console.log(`   Checkpoints: ${summary.metadata.checkpoints}`);
      console.log(`   Child Sessions: ${summary.metadata.childSessions}`);
      console.log(`   Merged Sessions: ${summary.metadata.mergedSessions}`);
    }
  }

  /**
   * Handle merge command
   */
  private async handleMerge(args: string[]): Promise<void> {
    if (args.length === 0) {
      console.error('Usage: j4c-session merge <session-id> [options]');
      console.error('Options:');
      console.error('  --strategy <strategy>  merge|rebase|squash (default: merge)');
      console.error('  --delete               Delete session after merge');
      process.exit(1);
    }

    const sessionId = args[0];
    const options = this.parseOptions(args.slice(1));

    console.log(`\n🔀 Merging session ${sessionId}...`);

    const result = await this.integration.mergeSession(sessionId, {
      strategy: (options.strategy as 'merge' | 'rebase' | 'squash') || 'merge',
      deleteAfterMerge: !!options.delete,
    });

    if (result.success) {
      console.log('\n✅ Merge successful');
      console.log(`📊 Changes merged: ${result.mergedChanges}`);
      console.log(`📝 Message: ${result.message}`);

      if (options.delete) {
        console.log('🧹 Session deleted');
      }
    } else {
      console.error('\n❌ Merge failed');
      console.error(`📝 Message: ${result.message}`);
      if (result.conflicts.length > 0) {
        console.error('Conflicts:');
        for (const conflict of result.conflicts) {
          console.error(`  - ${conflict}`);
        }
      }
      process.exit(1);
    }
  }

  /**
   * Handle pull command
   */
  private async handlePull(args: string[]): Promise<void> {
    if (args.length === 0) {
      console.error('Usage: j4c-session pull <session-id>');
      process.exit(1);
    }

    const sessionId = args[0];

    console.log(`\n⬇️  Pulling latest changes into session ${sessionId}...`);

    const result = await this.integration.pullLatestChanges(sessionId);

    if (result.success) {
      console.log('\n✅ Pull successful');
      console.log(`📝 ${result.message}`);
    } else {
      console.error('\n❌ Pull failed');
      console.error(`📝 ${result.message}`);
      process.exit(1);
    }
  }

  /**
   * Handle checkpoint command
   */
  private async handleCheckpoint(args: string[]): Promise<void> {
    if (args.length < 2) {
      console.error('Usage: j4c-session checkpoint <session-id> <description>');
      process.exit(1);
    }

    const sessionId = args[0];
    const description = args.slice(1).join(' ');

    console.log(`\n📸 Creating checkpoint for session ${sessionId}...`);

    const checkpointId = await this.integration.createCheckpoint(sessionId, description);

    console.log('\n✅ Checkpoint created');
    console.log(`📝 Checkpoint ID: ${checkpointId}`);
    console.log(`📄 Description: ${description}`);
  }

  /**
   * Handle restore command
   */
  private async handleRestore(args: string[]): Promise<void> {
    if (args.length < 2) {
      console.error('Usage: j4c-session restore <session-id> <checkpoint-id>');
      process.exit(1);
    }

    const sessionId = args[0];
    const checkpointId = args[1];

    console.log(`\n♻️  Restoring session from checkpoint...`);

    this.integration.restoreFromCheckpoint(sessionId, checkpointId);

    console.log('\n✅ Restore successful');
    console.log(`📝 Session: ${sessionId}`);
    console.log(`📸 Checkpoint: ${checkpointId}`);
  }

  /**
   * Handle cleanup command
   */
  private async handleCleanup(args: string[]): Promise<void> {
    if (args.length === 0) {
      console.error('Usage: j4c-session cleanup <session-id> [options]');
      console.error('Options:');
      console.error('  --keep-worktree  Keep worktree directory');
      console.error('  --no-archive     Do not archive session');
      process.exit(1);
    }

    const sessionId = args[0];
    const options = this.parseOptions(args.slice(1));

    console.log(`\n🧹 Cleaning up session ${sessionId}...`);

    await this.integration.cleanupSession(sessionId, {
      removeWorktree: !options['keep-worktree'],
      archiveState: !options['no-archive'],
    });

    console.log('\n✅ Cleanup successful');
    console.log(`📝 Session: ${sessionId}`);
  }

  /**
   * Handle analytics command
   */
  private async handleAnalytics(args: string[]): Promise<void> {
    const options = this.parseOptions(args);

    const analytics = this.integration.getAnalytics();

    if (options.json) {
      console.log(JSON.stringify(analytics, null, 2));
    } else {
      console.log('\n📈 J4C Multi-Session Analytics\n');
      console.log(`Total Sessions: ${analytics.totalSessions}`);
      console.log(`  Active: ${analytics.activeSessions}`);
      console.log(`  Completed: ${analytics.completedSessions}`);
      console.log(`  Failed: ${analytics.failedSessions}`);

      console.log(`\nTotal Executions: ${analytics.totalExecutions}`);
      console.log(`Total Feedback: ${analytics.totalFeedbackRecorded}`);
      console.log(`Average Success Rate: ${(analytics.averageSuccessRate * 100).toFixed(2)}%`);

      console.log(`\nSession Duration:`);
      console.log(`  Minimum: ${this.formatMillis(analytics.sessionDuration.min)}`);
      console.log(`  Maximum: ${this.formatMillis(analytics.sessionDuration.max)}`);
      console.log(`  Average: ${this.formatMillis(analytics.sessionDuration.average)}`);

      this.integration.printSessionStatus();
    }
  }

  /**
   * Handle export command
   */
  private async handleExport(args: string[]): Promise<void> {
    if (args.length < 2) {
      console.error('Usage: j4c-session export <session-id> <output-path> [--worktree]');
      process.exit(1);
    }

    const sessionId = args[0];
    const outputPath = args[1];
    const options = this.parseOptions(args.slice(2));

    console.log(`\n📦 Exporting session ${sessionId}...`);

    await this.integration.exportSession(sessionId, outputPath, !!options.worktree);

    console.log('\n✅ Export successful');
    console.log(`📝 Output: ${outputPath}`);
  }

  /**
   * Handle compare command
   */
  private async handleCompare(args: string[]): Promise<void> {
    if (args.length < 2) {
      console.error('Usage: j4c-session compare <session-id-1> <session-id-2>');
      process.exit(1);
    }

    const sessionId1 = args[0];
    const sessionId2 = args[1];

    console.log(`\n🔍 Comparing sessions ${sessionId1} vs ${sessionId2}\n`);

    const comparison = this.integration.compareSessions(sessionId1, sessionId2);

    console.log('Session 1:');
    console.log(JSON.stringify(comparison.session1, null, 2));

    console.log('\nSession 2:');
    console.log(JSON.stringify(comparison.session2, null, 2));

    if (comparison.differences.length > 0) {
      console.log('\nDifferences:');
      for (const diff of comparison.differences) {
        console.log(`  - ${diff}`);
      }
    } else {
      console.log('\nNo significant differences found');
    }
  }

  /**
   * Parse command-line options
   */
  private parseOptions(args: string[]): Record<string, string | boolean> {
    const options: Record<string, string | boolean> = {};

    for (let i = 0; i < args.length; i++) {
      if (args[i].startsWith('--')) {
        const key = args[i].substring(2);
        if (i + 1 < args.length && !args[i + 1].startsWith('--')) {
          options[key] = args[i + 1];
          i++;
        } else {
          options[key] = true;
        }
      }
    }

    return options;
  }

  /**
   * Format table for output
   */
  private formatTable(columns: Array<{ width: number; text: string }>) {
    return {
      header: () => {
        return columns.map((col) => col.text.padEnd(col.width)).join(' ');
      },
      separator: () => {
        return columns.map((col) => '─'.repeat(col.width)).join('─');
      },
      row: (values: string[]) => {
        return values.map((val, i) => val.padEnd(columns[i].width)).join(' ');
      },
    };
  }

  /**
   * Format milliseconds
   */
  private formatMillis(ms: number): string {
    if (ms === 0) return '0ms';
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days}d ${hours % 24}h`;
    if (hours > 0) return `${hours}h ${minutes % 60}m`;
    if (minutes > 0) return `${minutes}m ${seconds % 60}s`;
    return `${seconds}s`;
  }

  /**
   * Print help
   */
  private printHelp(): void {
    console.log(`
J4C Multi-Session CLI
Version 2.0.0

USAGE:
  j4c-session <command> [options]

COMMANDS:
  create <branch>       Create new session
    Options:
      --project <id>    Project ID (required)
      --task <desc>     Task description (required)
      --user <id>       User ID
      --tags <tags>     Comma-separated tags

  list [options]        List all sessions
    Options:
      --json            Output as JSON

  status <session-id>   Show session status

  merge <session-id>    Merge session changes
    Options:
      --strategy        merge|rebase|squash
      --delete          Delete session after merge

  pull <session-id>     Pull latest changes

  checkpoint <id> <desc> Create checkpoint

  restore <id> <cp-id>  Restore from checkpoint

  cleanup <session-id>  Clean up session
    Options:
      --keep-worktree   Keep worktree directory
      --no-archive      Do not archive

  analytics [options]   Show analytics
    Options:
      --json            Output as JSON

  export <id> <path>    Export session
    Options:
      --worktree        Include worktree

  compare <id1> <id2>   Compare sessions

  help                  Show this help

EXAMPLES:
  j4c-session create feature/new-api \\
    --project myapp \\
    --task "Implement API endpoint" \\
    --tags "api,feature"

  j4c-session list
  j4c-session status sess-123
  j4c-session merge sess-123 --delete
  j4c-session analytics --json
`);
  }
}

// Run CLI
const args = process.argv.slice(2);
const cli = new J4CSessionCLI();
cli.run(args).catch((error) => {
  console.error('❌ Fatal error:', error);
  process.exit(1);
});
