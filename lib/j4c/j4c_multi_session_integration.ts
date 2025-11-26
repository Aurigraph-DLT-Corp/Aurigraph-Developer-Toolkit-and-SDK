/**
 * J4C Multi-Session Integration Layer
 *
 * Extends J4C Integration Layer with multi-session support via git worktrees.
 * Enables:
 * - Multiple concurrent Claude Code sessions
 * - Session-isolated learning and feedback
 * - Per-session consolidation and insights
 * - Session merging and synchronization
 * - Seamless integration with existing J4C framework
 *
 * Integration with:
 * - J4C Worktree Manager (git state)
 * - J4C Session State Manager (session state)
 * - J4C Integration Layer (feedback & learning)
 * - J4C Continuous Learning Framework (learning isolation)
 *
 * @author J4C Framework
 * @version 2.0.0
 */

import * as fs from 'fs';
import * as path from 'path';
import * as EventEmitter from 'events';
import { J4CWorktreeManager, WorktreeSession } from './j4c_worktree_manager';
import { J4CSessionStateManager, SessionState } from './j4c_session_state_manager';

/**
 * Multi-session integration context
 */
export interface MultiSessionContext {
  activeSessionId: string;
  sessionManager: J4CSessionStateManager;
  worktreeManager: J4CWorktreeManager;
  activeSessions: Map<string, SessionState>;
}

/**
 * Session execution options
 */
export interface SessionExecutionOptions {
  sessionId: string;
  createSnapshot?: boolean;
  snapshotDescription?: string;
  recordFeedback?: boolean;
  updateLearning?: boolean;
  isolateExecution?: boolean;
}

/**
 * Session merge result
 */
export interface MergeResult {
  success: boolean;
  sourceSessionId: string;
  targetSessionId: string;
  mergedChanges: number;
  conflicts: string[];
  message: string;
}

/**
 * Session analytics
 */
export interface SessionAnalytics {
  totalSessions: number;
  activeSessions: number;
  completedSessions: number;
  failedSessions: number;
  totalExecutions: number;
  totalFeedbackRecorded: number;
  averageSuccessRate: number;
  sessionDuration: {
    min: number;
    max: number;
    average: number;
  };
}

/**
 * J4C Multi-Session Integration Layer
 */
export class J4CMultiSessionIntegration extends EventEmitter {
  private worktreeManager: J4CWorktreeManager;
  private sessionStateManager: J4CSessionStateManager;
  private baseDir: string;
  private dataDir: string;

  private multiSessionDataFile: string;
  private analyticsFile: string;

  constructor(baseDir: string = process.cwd()) {
    super();
    this.baseDir = baseDir;
    this.dataDir = path.join(baseDir, '.j4c', 'multi-session');

    this.multiSessionDataFile = path.join(this.dataDir, 'multi_session_data.json');
    this.analyticsFile = path.join(this.dataDir, 'analytics.json');

    this.worktreeManager = new J4CWorktreeManager(baseDir);
    this.sessionStateManager = new J4CSessionStateManager(baseDir);

    this.ensureDirectories();
  }

  /**
   * Initialize multi-session integration
   */
  public async initialize(): Promise<void> {
    console.log('🔄 Initializing J4C Multi-Session Integration...');

    try {
      await this.worktreeManager.initialize();
      await this.sessionStateManager.initialize();

      // Load analytics
      await this.loadAnalytics();

      console.log('✓ Multi-session integration initialized');
      this.emit('initialized');
    } catch (error) {
      console.error('✗ Multi-session integration initialization failed:', error);
      throw error;
    }
  }

  /**
   * Create and start new session
   */
  public async createAndStartSession(options: {
    branchName: string;
    userId: string;
    projectId: string;
    taskDescription: string;
    parentBranch?: string;
    tags?: string[];
  }): Promise<{ sessionId: string; worktreeSession: WorktreeSession; stateSession: SessionState }> {
    console.log(`🚀 Creating new session for task: ${options.taskDescription}`);

    try {
      // Create worktree
      const worktreeSession = await this.worktreeManager.createSession(
        options.branchName,
        {
          parentBranch: options.parentBranch,
          userId: options.userId,
          projectId: options.projectId,
          taskDescription: options.taskDescription,
          tags: options.tags,
        }
      );

      // Create session state
      const stateSession = this.sessionStateManager.createSessionState({
        sessionId: worktreeSession.id,
        workerId: `worker-${Date.now()}`,
        projectId: options.projectId,
        userId: options.userId,
        taskDescription: options.taskDescription,
        workingDirectory: worktreeSession.worktreePath,
        branch: worktreeSession.branch,
        worktreePath: worktreeSession.worktreePath,
        tags: options.tags,
      });

      console.log(`✓ Session created and started: ${worktreeSession.id}`);

      this.emit('session:started', {
        sessionId: worktreeSession.id,
        worktreeSession,
        stateSession,
      });

      return {
        sessionId: worktreeSession.id,
        worktreeSession,
        stateSession,
      };
    } catch (error) {
      console.error(`✗ Failed to create session: ${error}`);
      throw error;
    }
  }

  /**
   * Execute task in session context
   */
  public async executeInSession<T>(
    sessionId: string,
    callback: (sessionContext: SessionExecutionContext) => Promise<T>,
    options: SessionExecutionOptions = { sessionId }
  ): Promise<T> {
    const worktreeSession = this.worktreeManager.getSession(sessionId);
    const stateSession = this.sessionStateManager.getSessionState(sessionId);

    if (!worktreeSession || !stateSession) {
      throw new Error(`Session not found: ${sessionId}`);
    }

    try {
      // Create snapshot if requested
      let snapshotId: string | undefined;
      if (options.createSnapshot) {
        snapshotId = await this.worktreeManager.createSnapshot(
          sessionId,
          options.snapshotDescription || 'Pre-execution snapshot'
        );
      }

      // Update activity
      this.sessionStateManager.updateSessionActivity(sessionId);

      // Create execution context
      const context: SessionExecutionContext = {
        sessionId,
        worktreeSession,
        stateSession,
        snapshotId,
        getWorktreePath: () => worktreeSession.worktreePath,
        getBranch: () => worktreeSession.branch,
        recordFeedback: (feedback) =>
          this.sessionStateManager.recordFeedbackInSession(sessionId, feedback),
        addLearningEvent: (event) => this.sessionStateManager.addLearningEvent(sessionId, event),
      };

      // Execute callback
      const result = await callback(context);

      console.log(`✓ Session execution completed: ${sessionId}`);
      return result;
    } catch (error) {
      console.error(`✗ Session execution failed: ${sessionId}`, error);
      throw error;
    }
  }

  /**
   * Execute git operation in session
   */
  public async executeGitInSession(
    sessionId: string,
    command: string,
    args: string[] = []
  ): Promise<string> {
    return this.worktreeManager.executeGitCommand(sessionId, command, args);
  }

  /**
   * Merge session changes to parent branch
   */
  public async mergeSession(
    sessionId: string,
    options: {
      strategy?: 'merge' | 'rebase' | 'squash';
      commitMessage?: string;
      deleteAfterMerge?: boolean;
    } = {}
  ): Promise<MergeResult> {
    const worktreeSession = this.worktreeManager.getSession(sessionId);
    if (!worktreeSession) {
      return {
        success: false,
        sourceSessionId: sessionId,
        targetSessionId: 'unknown',
        mergedChanges: 0,
        conflicts: [],
        message: `Session not found: ${sessionId}`,
      };
    }

    try {
      const result = await this.worktreeManager.mergeSessionChanges(sessionId, {
        strategy: options.strategy,
        commitMessage: options.commitMessage,
      });

      // Update session state
      const stateSession = this.sessionStateManager.getSessionState(sessionId);
      if (stateSession) {
        stateSession.status = 'completed';
        this.sessionStateManager.updateSessionActivity(sessionId);
      }

      // Cleanup if requested
      if (options.deleteAfterMerge) {
        await this.worktreeManager.cleanupSession(sessionId, { removeWorktree: true });
      }

      this.emit('session:merged', { sessionId });

      return {
        success: result.success,
        sourceSessionId: sessionId,
        targetSessionId: 'main',
        mergedChanges: worktreeSession.statistics.commitsCreated,
        conflicts: [],
        message: result.message,
      };
    } catch (error) {
      return {
        success: false,
        sourceSessionId: sessionId,
        targetSessionId: 'main',
        mergedChanges: 0,
        conflicts: [(error as Error).message],
        message: `Merge failed: ${(error as Error).message}`,
      };
    }
  }

  /**
   * Get all active sessions
   */
  public getActiveSessions(): SessionState[] {
    return this.sessionStateManager.listSessions({ status: 'active' });
  }

  /**
   * Get session status
   */
  public getSessionStatus(sessionId: string): {
    worktree: WorktreeSession | undefined;
    state: SessionState | undefined;
    summary: Record<string, any> | null;
  } {
    const worktree = this.worktreeManager.getSession(sessionId);
    const state = this.sessionStateManager.getSessionState(sessionId);
    const summary = this.sessionStateManager.getSessionSummary(sessionId);

    return { worktree, state, summary };
  }

  /**
   * List all sessions with status
   */
  public listSessionsWithStatus(): Array<{
    sessionId: string;
    status: string;
    branch: string;
    created: number;
    lastActivity: number;
    summary: Record<string, any> | null;
  }> {
    const sessions = this.sessionStateManager.listSessions();

    return sessions.map((state) => {
      const worktree = this.worktreeManager.getSession(state.sessionId);
      return {
        sessionId: state.sessionId,
        status: state.status,
        branch: state.environment.branch,
        created: state.createdAt,
        lastActivity: state.lastActivity,
        summary: this.sessionStateManager.getSessionSummary(state.sessionId),
      };
    });
  }

  /**
   * Pull latest changes into session
   */
  public async pullLatestChanges(sessionId: string): Promise<{ success: boolean; message: string }> {
    return this.worktreeManager.pullLatestChanges(sessionId);
  }

  /**
   * Create checkpoint for session
   */
  public async createCheckpoint(
    sessionId: string,
    description: string
  ): Promise<string> {
    return this.sessionStateManager.createCheckpoint(sessionId, description);
  }

  /**
   * Restore from checkpoint
   */
  public restoreFromCheckpoint(sessionId: string, checkpointId: string): void {
    this.sessionStateManager.restoreFromCheckpoint(sessionId, checkpointId);
  }

  /**
   * Compare two sessions
   */
  public compareSessions(
    sessionId1: string,
    sessionId2: string
  ): {
    session1: Record<string, any> | null;
    session2: Record<string, any> | null;
    differences: string[];
  } {
    const summary1 = this.sessionStateManager.getSessionSummary(sessionId1);
    const summary2 = this.sessionStateManager.getSessionSummary(sessionId2);

    const differences: string[] = [];

    if (summary1 && summary2) {
      if (summary1.feedback.successRate !== summary2.feedback.successRate) {
        differences.push(
          `Success rate: ${summary1.feedback.successRate} vs ${summary2.feedback.successRate}`
        );
      }

      if (summary1.learning.patternsDetected !== summary2.learning.patternsDetected) {
        differences.push(
          `Patterns detected: ${summary1.learning.patternsDetected} vs ${summary2.learning.patternsDetected}`
        );
      }
    }

    return { session1: summary1, session2: summary2, differences };
  }

  /**
   * Export session for archival
   */
  public async exportSession(
    sessionId: string,
    outputPath: string,
    includeWorktree: boolean = false
  ): Promise<void> {
    const stateExportPath = path.join(path.dirname(outputPath), `${sessionId}-state.json`);
    this.sessionStateManager.exportSession(sessionId, stateExportPath);

    if (includeWorktree) {
      const worktreeExportPath = path.join(path.dirname(outputPath), `${sessionId}-worktree.json`);
      await this.worktreeManager.exportSession(sessionId, worktreeExportPath);
    }

    console.log(`✓ Session exported: ${outputPath}`);
  }

  /**
   * Cleanup session
   */
  public async cleanupSession(
    sessionId: string,
    options: {
      removeWorktree?: boolean;
      archiveState?: boolean;
      deleteBranch?: boolean;
    } = {}
  ): Promise<void> {
    console.log(`🧹 Cleaning up session: ${sessionId}`);

    try {
      // Cleanup worktree
      if (options.removeWorktree !== false) {
        await this.worktreeManager.cleanupSession(sessionId, {
          removeWorktree: true,
          deleteBranch: options.deleteBranch !== false,
          saveLogs: true,
          archiveSession: true,
        });
      }

      // Cleanup state
      if (options.archiveState !== false) {
        await this.sessionStateManager.cleanupSession(sessionId, true);
      }

      this.emit('session:cleaned', { sessionId });
      console.log(`✓ Session cleaned: ${sessionId}`);
    } catch (error) {
      console.error(`✗ Cleanup failed for session ${sessionId}: ${error}`);
      throw error;
    }
  }

  /**
   * Get multi-session analytics
   */
  public getAnalytics(): SessionAnalytics {
    const sessions = this.sessionStateManager.listSessions();
    const activeSessions = sessions.filter((s) => s.status === 'active').length;
    const completedSessions = sessions.filter((s) => s.status === 'completed').length;
    const failedSessions = sessions.filter((s) => s.status === 'failed').length;

    let totalExecutions = 0;
    let totalFeedbackRecorded = 0;
    let totalSuccessRate = 0;
    const durations: number[] = [];

    for (const session of sessions) {
      totalExecutions += session.metadata.childSessions.length;
      totalFeedbackRecorded += session.feedback.processed;
      const rate = session.feedback.successCount + session.feedback.failureCount > 0
        ? session.feedback.successCount / (session.feedback.successCount + session.feedback.failureCount)
        : 0;
      totalSuccessRate += rate;

      const duration = Date.now() - session.createdAt;
      durations.push(duration);
    }

    const avgSuccessRate = sessions.length > 0 ? totalSuccessRate / sessions.length : 0;

    return {
      totalSessions: sessions.length,
      activeSessions,
      completedSessions,
      failedSessions,
      totalExecutions,
      totalFeedbackRecorded,
      averageSuccessRate: avgSuccessRate,
      sessionDuration: {
        min: Math.min(...durations, 0),
        max: Math.max(...durations, 0),
        average: durations.length > 0 ? durations.reduce((a, b) => a + b, 0) / durations.length : 0,
      },
    };
  }

  /**
   * Print session status report
   */
  public printSessionStatus(): void {
    const sessions = this.listSessionsWithStatus();

    console.log('\n📊 J4C Multi-Session Status Report');
    console.log('═══════════════════════════════════════════════════════════════');

    if (sessions.length === 0) {
      console.log('No active sessions');
      return;
    }

    for (const session of sessions) {
      const summary = session.summary;
      console.log(`\n🔵 Session: ${session.sessionId}`);
      console.log(`   Status: ${session.status}`);
      console.log(`   Branch: ${session.branch}`);
      console.log(`   Created: ${new Date(session.created).toISOString()}`);

      if (summary) {
        console.log(`   Duration: ${summary.uptimeFormatted}`);
        console.log(`   Feedback: ${summary.feedback.total} (${summary.feedback.successRate} success)`);
        console.log(`   Learning: ${summary.learning.eventsProcessed} events, ${summary.learning.patternsDetected} patterns`);
        console.log(`   Messages: ${summary.messages.sent} sent, ${summary.messages.received} received`);
      }
    }

    console.log('\n═══════════════════════════════════════════════════════════════');

    const analytics = this.getAnalytics();
    console.log('\n📈 Overall Analytics:');
    console.log(`   Total Sessions: ${analytics.totalSessions}`);
    console.log(`   Active: ${analytics.activeSessions} | Completed: ${analytics.completedSessions} | Failed: ${analytics.failedSessions}`);
    console.log(`   Total Executions: ${analytics.totalExecutions}`);
    console.log(`   Total Feedback: ${analytics.totalFeedbackRecorded}`);
    console.log(`   Avg Success Rate: ${(analytics.averageSuccessRate * 100).toFixed(2)}%`);
  }

  /**
   * Load analytics from disk
   */
  private async loadAnalytics(): Promise<void> {
    // Placeholder for analytics loading
    // Will be expanded in future versions
  }

  /**
   * Ensure required directories exist
   */
  private ensureDirectories(): void {
    if (!fs.existsSync(this.dataDir)) {
      fs.mkdirSync(this.dataDir, { recursive: true });
    }
  }

  /**
   * Shutdown gracefully
   */
  public async shutdown(): Promise<void> {
    console.log('🛑 Shutting down Multi-Session Integration...');

    await this.worktreeManager.shutdown();
    await this.sessionStateManager.shutdown();

    console.log('✓ Multi-session integration shutdown complete');
  }
}

/**
 * Session execution context provided to callbacks
 */
export interface SessionExecutionContext {
  sessionId: string;
  worktreeSession: WorktreeSession;
  stateSession: SessionState;
  snapshotId?: string;
  getWorktreePath: () => string;
  getBranch: () => string;
  recordFeedback: (feedback: any) => void;
  addLearningEvent: (event: any) => void;
}

/**
 * CLI interface for multi-session management
 */
if (require.main === module) {
  const integration = new J4CMultiSessionIntegration();

  (async () => {
    try {
      await integration.initialize();

      // Example: create and use session
      const { sessionId } = await integration.createAndStartSession({
        branchName: 'feature/multi-session-test',
        userId: 'dev-001',
        projectId: 'test-project',
        taskDescription: 'Testing multi-session integration',
      });

      console.log('\n✓ Session created:', sessionId);

      // Execute in session
      await integration.executeInSession(
        sessionId,
        async (ctx) => {
          console.log(`\nExecuting in session: ${ctx.sessionId}`);
          console.log(`Worktree: ${ctx.getWorktreePath()}`);
          console.log(`Branch: ${ctx.getBranch()}`);

          // Record some feedback
          ctx.recordFeedback({
            taskType: 'test',
            success: true,
            qualityScore: 95,
            complianceScore: 90,
          });

          return 'Execution complete';
        }
      );

      // Print status
      integration.printSessionStatus();

      // Cleanup
      await integration.cleanupSession(sessionId);
      await integration.shutdown();
    } catch (error) {
      console.error('❌ Error:', error);
      process.exit(1);
    }
  })();
}
