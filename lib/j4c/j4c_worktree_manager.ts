/**
 * J4C Git Worktree Manager
 *
 * Manages isolated git worktrees for each Claude Code session, enabling:
 * - Independent branch management per session
 * - Parallel development without conflicts
 * - Isolated state and context per session
 * - Clean session cleanup and recovery
 * - Integration with J4C learning framework
 *
 * Usage:
 * const manager = new J4CWorktreeManager('/path/to/repo');
 * const session = await manager.createSession('feature/new-feature');
 * await manager.executeInSession(session.id, () => { ... });
 * await manager.cleanupSession(session.id);
 *
 * @author J4C Framework
 * @version 2.0.0
 */

import * as fs from 'fs';
import * as path from 'path';
import { execSync, spawn } from 'child_process';
import * as EventEmitter from 'events';

/**
 * Git worktree session metadata
 */
export interface WorktreeSession {
  id: string;
  name: string;
  branch: string;
  worktreePath: string;
  basePath: string;
  createdAt: number;
  lastModified: number;
  status: 'active' | 'idle' | 'locked' | 'abandoned';
  parentSessionId?: string; // for nested sessions
  metadata: {
    claudeCodeVersion: string;
    userId: string;
    projectId: string;
    taskDescription: string;
    tags: string[];
  };
  statistics: {
    executionCount: number;
    filesChanged: number;
    commitsCreated: number;
    duration: number;
  };
}

/**
 * Worktree lock information
 */
interface WorktreeLock {
  sessionId: string;
  timestamp: number;
  processId: number;
  reason: string;
}

/**
 * Worktree cleanup options
 */
export interface CleanupOptions {
  removeWorktree: boolean;
  deleteBranch: boolean;
  keepChanges: boolean;
  saveLogs: boolean;
  archiveSession: boolean;
}

/**
 * Session execution context
 */
export interface SessionContext {
  sessionId: string;
  worktreePath: string;
  branch: string;
  environmentVariables: Record<string, string>;
  workingDirectory: string;
}

/**
 * J4C Worktree Manager - Main orchestration class
 */
export class J4CWorktreeManager extends EventEmitter {
  private sessions: Map<string, WorktreeSession> = new Map();
  private locks: Map<string, WorktreeLock> = new Map();
  private baseDir: string;
  private worktreesDir: string;
  private sessionsMetadataDir: string;
  private logDir: string;

  private sessionFile: string;
  private lockFile: string;

  constructor(baseDir: string) {
    super();
    this.baseDir = baseDir;
    this.worktreesDir = path.join(baseDir, '.worktrees');
    this.sessionsMetadataDir = path.join(baseDir, '.j4c', 'sessions');
    this.logDir = path.join(baseDir, '.j4c', 'logs');

    this.sessionFile = path.join(this.sessionsMetadataDir, 'sessions.json');
    this.lockFile = path.join(this.sessionsMetadataDir, 'locks.json');

    this.ensureDirectories();
    this.loadSessionsFromDisk();
    this.validateExistingWorktrees();
  }

  /**
   * Initialize worktree manager
   */
  public async initialize(): Promise<void> {
    console.log('🔄 Initializing J4C Worktree Manager...');

    try {
      // Verify git repository
      this.verifyGitRepository();

      // Check for stale worktrees
      await this.cleanupStaleWorktrees();

      // Validate all sessions
      await this.validateAllSessions();

      console.log('✓ Worktree manager initialized');
      this.emit('initialized');
    } catch (error) {
      console.error('✗ Worktree manager initialization failed:', error);
      throw error;
    }
  }

  /**
   * Create a new session with isolated worktree
   */
  public async createSession(
    branchName: string,
    options: {
      parentBranch?: string;
      userId?: string;
      projectId?: string;
      taskDescription?: string;
      tags?: string[];
    } = {}
  ): Promise<WorktreeSession> {
    const sessionId = this.generateSessionId();
    const worktreeName = `session-${sessionId}`;
    const worktreePath = path.join(this.worktreesDir, worktreeName);

    console.log(`🔨 Creating session: ${sessionId} (branch: ${branchName})`);

    try {
      // Ensure parent branch is checked out in main repo
      const parentBranch = options.parentBranch || 'main';
      this.checkoutBranch(this.baseDir, parentBranch);

      // Create worktree
      this.createWorktree(worktreePath, branchName);

      // Create session metadata
      const session: WorktreeSession = {
        id: sessionId,
        name: worktreeName,
        branch: branchName,
        worktreePath,
        basePath: this.baseDir,
        createdAt: Date.now(),
        lastModified: Date.now(),
        status: 'active',
        metadata: {
          claudeCodeVersion: process.env.CLAUDE_VERSION || '1.0.0',
          userId: options.userId || 'unknown',
          projectId: options.projectId || 'default',
          taskDescription: options.taskDescription || '',
          tags: options.tags || [],
        },
        statistics: {
          executionCount: 0,
          filesChanged: 0,
          commitsCreated: 0,
          duration: 0,
        },
      };

      // Store session
      this.sessions.set(sessionId, session);
      this.persistSessionsToDisk();

      console.log(`✓ Session created: ${sessionId}`);
      console.log(`  Worktree: ${worktreePath}`);
      console.log(`  Branch: ${branchName}`);

      this.emit('session:created', { sessionId, session });
      return session;
    } catch (error) {
      console.error(`✗ Failed to create session: ${error}`);
      throw error;
    }
  }

  /**
   * Get active session
   */
  public getSession(sessionId: string): WorktreeSession | undefined {
    return this.sessions.get(sessionId);
  }

  /**
   * List all sessions
   */
  public listSessions(filter?: { status?: WorktreeSession['status']; projectId?: string }): WorktreeSession[] {
    const sessions = Array.from(this.sessions.values());

    if (!filter) return sessions;

    return sessions.filter((s) => {
      if (filter.status && s.status !== filter.status) return false;
      if (filter.projectId && s.metadata.projectId !== filter.projectId) return false;
      return true;
    });
  }

  /**
   * Execute command in session context
   */
  public async executeInSession<T>(
    sessionId: string,
    callback: (context: SessionContext) => Promise<T>,
    options: { updateStatistics?: boolean } = {}
  ): Promise<T> {
    const session = this.getSession(sessionId);
    if (!session) throw new Error(`Session not found: ${sessionId}`);

    // Acquire lock
    await this.acquireLock(sessionId, 'command_execution');

    try {
      const context: SessionContext = {
        sessionId,
        worktreePath: session.worktreePath,
        branch: session.branch,
        environmentVariables: {
          J4C_SESSION_ID: sessionId,
          J4C_BRANCH: session.branch,
          J4C_WORKTREE: session.worktreePath,
        },
        workingDirectory: session.worktreePath,
      };

      const startTime = Date.now();

      // Execute callback
      const result = await callback(context);

      // Update statistics
      if (options.updateStatistics !== false) {
        session.statistics.executionCount++;
        session.statistics.duration += Date.now() - startTime;
        session.lastModified = Date.now();
        this.persistSessionsToDisk();
      }

      return result;
    } finally {
      // Release lock
      await this.releaseLock(sessionId);
    }
  }

  /**
   * Execute git command in session
   */
  public async executeGitCommand(
    sessionId: string,
    command: string,
    args: string[] = []
  ): Promise<string> {
    const session = this.getSession(sessionId);
    if (!session) throw new Error(`Session not found: ${sessionId}`);

    return this.executeInSession(sessionId, async (context) => {
      return this.runGitCommand(context.worktreePath, command, args);
    });
  }

  /**
   * Merge changes from session back to parent branch
   */
  public async mergeSessionChanges(
    sessionId: string,
    options: { strategy?: 'merge' | 'rebase' | 'squash'; commitMessage?: string } = {}
  ): Promise<{ success: boolean; message: string }> {
    const session = this.getSession(sessionId);
    if (!session) throw new Error(`Session not found: ${sessionId}`);

    console.log(`🔀 Merging session ${sessionId} changes...`);

    try {
      const strategy = options.strategy || 'merge';
      const commitMessage = options.commitMessage || `Merge ${session.branch} from session ${sessionId}`;

      return await this.executeInSession(sessionId, async (context) => {
        // Switch to parent branch in main repo
        const parentBranch = 'main'; // or detect from config
        this.checkoutBranch(this.baseDir, parentBranch);

        // Perform merge
        if (strategy === 'merge') {
          this.runGitCommand(this.baseDir, 'merge', [context.branch, '-m', commitMessage]);
        } else if (strategy === 'rebase') {
          this.runGitCommand(this.baseDir, 'rebase', [context.branch]);
        } else if (strategy === 'squash') {
          this.runGitCommand(this.baseDir, 'merge', ['--squash', context.branch]);
          this.runGitCommand(this.baseDir, 'commit', ['-m', commitMessage]);
        }

        session.statistics.commitsCreated++;
        return {
          success: true,
          message: `Successfully merged ${session.branch} using ${strategy} strategy`,
        };
      });
    } catch (error) {
      console.error(`✗ Merge failed: ${error}`);
      return {
        success: false,
        message: `Merge failed: ${(error as Error).message}`,
      };
    }
  }

  /**
   * Pull latest changes from parent branch
   */
  public async pullLatestChanges(sessionId: string): Promise<{ success: boolean; message: string }> {
    const session = this.getSession(sessionId);
    if (!session) throw new Error(`Session not found: ${sessionId}`);

    console.log(`⬇️  Pulling latest changes into session ${sessionId}...`);

    try {
      return await this.executeInSession(sessionId, async (context) => {
        // Fetch latest
        this.runGitCommand(context.worktreePath, 'fetch', ['origin']);

        // Rebase on parent
        this.runGitCommand(context.worktreePath, 'rebase', ['origin/main']);

        return {
          success: true,
          message: 'Successfully pulled latest changes',
        };
      });
    } catch (error) {
      console.error(`✗ Pull failed: ${error}`);
      return {
        success: false,
        message: `Pull failed: ${(error as Error).message}`,
      };
    }
  }

  /**
   * Record file changes in session
   */
  public async recordChanges(sessionId: string): Promise<{ filesChanged: number; diff: string }> {
    const session = this.getSession(sessionId);
    if (!session) throw new Error(`Session not found: ${sessionId}`);

    return await this.executeInSession(sessionId, async (context) => {
      const status = this.runGitCommand(context.worktreePath, 'status', ['--porcelain']);
      const fileCount = status.split('\n').filter((l) => l.length > 0).length;

      const diff = this.runGitCommand(context.worktreePath, 'diff');

      session.statistics.filesChanged = fileCount;
      return { filesChanged: fileCount, diff };
    });
  }

  /**
   * Create snapshot of session state
   */
  public async createSnapshot(sessionId: string, description: string): Promise<string> {
    const session = this.getSession(sessionId);
    if (!session) throw new Error(`Session not found: ${sessionId}`);

    const snapshotId = this.generateSnapshotId();
    const snapshotDir = path.join(this.sessionsMetadataDir, sessionId, 'snapshots', snapshotId);

    console.log(`📸 Creating snapshot ${snapshotId} for session ${sessionId}...`);

    try {
      fs.mkdirSync(snapshotDir, { recursive: true });

      // Save session state
      const snapshot = {
        snapshotId,
        sessionId,
        description,
        timestamp: Date.now(),
        session: JSON.parse(JSON.stringify(session)),
        gitStatus: await this.executeGitCommand(sessionId, 'status', ['--porcelain']),
        gitLog: await this.executeGitCommand(sessionId, 'log', ['--oneline', '-10']),
      };

      fs.writeFileSync(path.join(snapshotDir, 'snapshot.json'), JSON.stringify(snapshot, null, 2));

      console.log(`✓ Snapshot created: ${snapshotId}`);
      return snapshotId;
    } catch (error) {
      console.error(`✗ Snapshot creation failed: ${error}`);
      throw error;
    }
  }

  /**
   * Restore from snapshot
   */
  public async restoreFromSnapshot(sessionId: string, snapshotId: string): Promise<void> {
    const snapshotPath = path.join(this.sessionsMetadataDir, sessionId, 'snapshots', snapshotId, 'snapshot.json');

    if (!fs.existsSync(snapshotPath)) {
      throw new Error(`Snapshot not found: ${snapshotId}`);
    }

    console.log(`♻️  Restoring session from snapshot ${snapshotId}...`);

    const snapshot = JSON.parse(fs.readFileSync(snapshotPath, 'utf-8'));
    console.log(`✓ Session state restored from ${new Date(snapshot.timestamp).toISOString()}`);
  }

  /**
   * Cleanup session and worktree
   */
  public async cleanupSession(sessionId: string, options: Partial<CleanupOptions> = {}): Promise<void> {
    const session = this.getSession(sessionId);
    if (!session) throw new Error(`Session not found: ${sessionId}`);

    const cleanupOpts: CleanupOptions = {
      removeWorktree: true,
      deleteBranch: false,
      keepChanges: false,
      saveLogs: true,
      archiveSession: true,
      ...options,
    };

    console.log(`🧹 Cleaning up session ${sessionId}...`);

    try {
      // Save logs if requested
      if (cleanupOpts.saveLogs) {
        await this.saveSessionLogs(sessionId);
      }

      // Archive session if requested
      if (cleanupOpts.archiveSession) {
        await this.archiveSession(sessionId);
      }

      // Remove worktree
      if (cleanupOpts.removeWorktree) {
        try {
          this.runGitCommand(this.baseDir, 'worktree', ['remove', session.worktreePath]);
        } catch (error) {
          console.warn(`⚠️  Could not remove worktree, forcing...`);
          this.runGitCommand(this.baseDir, 'worktree', ['remove', '--force', session.worktreePath]);
        }
      }

      // Delete branch if requested
      if (cleanupOpts.deleteBranch) {
        try {
          this.runGitCommand(this.baseDir, 'branch', ['-D', session.branch]);
        } catch (error) {
          console.warn(`⚠️  Could not delete branch ${session.branch}`);
        }
      }

      // Remove session record
      this.sessions.delete(sessionId);
      this.persistSessionsToDisk();

      console.log(`✓ Session cleaned up: ${sessionId}`);
      this.emit('session:cleaned', { sessionId });
    } catch (error) {
      console.error(`✗ Cleanup failed: ${error}`);
      throw error;
    }
  }

  /**
   * Cleanup all abandoned sessions
   */
  public async cleanupAbandonedSessions(): Promise<number> {
    const abandoned = this.listSessions({ status: 'abandoned' });
    let count = 0;

    console.log(`🧹 Cleaning up ${abandoned.length} abandoned sessions...`);

    for (const session of abandoned) {
      try {
        await this.cleanupSession(session.id, {
          removeWorktree: true,
          saveLogs: true,
          archiveSession: true,
        });
        count++;
      } catch (error) {
        console.warn(`⚠️  Could not cleanup session ${session.id}: ${error}`);
      }
    }

    return count;
  }

  /**
   * Mark session as abandoned
   */
  public markSessionAbandoned(sessionId: string, reason: string = 'timeout'): void {
    const session = this.getSession(sessionId);
    if (session) {
      session.status = 'abandoned';
      console.log(`⚠️  Session marked as abandoned: ${sessionId} (reason: ${reason})`);
      this.persistSessionsToDisk();
    }
  }

  /**
   * Get session statistics
   */
  public getSessionStatistics(sessionId: string): WorktreeSession['statistics'] | null {
    const session = this.getSession(sessionId);
    return session ? session.statistics : null;
  }

  /**
   * Export session for archival
   */
  public async exportSession(sessionId: string, outputPath: string): Promise<void> {
    const session = this.getSession(sessionId);
    if (!session) throw new Error(`Session not found: ${sessionId}`);

    console.log(`📦 Exporting session ${sessionId} to ${outputPath}...`);

    try {
      const exportData = {
        session,
        exportedAt: Date.now(),
        gitLog: await this.executeGitCommand(sessionId, 'log', ['--oneline', '-20']),
        files: this.getWorktreeFiles(sessionId),
      };

      fs.mkdirSync(path.dirname(outputPath), { recursive: true });
      fs.writeFileSync(outputPath, JSON.stringify(exportData, null, 2));

      console.log(`✓ Session exported: ${outputPath}`);
    } catch (error) {
      console.error(`✗ Export failed: ${error}`);
      throw error;
    }
  }

  /**
   * Acquire lock on session
   */
  private async acquireLock(sessionId: string, reason: string): Promise<void> {
    const lock: WorktreeLock = {
      sessionId,
      timestamp: Date.now(),
      processId: process.pid,
      reason,
    };

    this.locks.set(sessionId, lock);
    this.persistLocksToDisk();

    console.log(`🔒 Acquired lock on session ${sessionId} (${reason})`);
  }

  /**
   * Release lock on session
   */
  private async releaseLock(sessionId: string): Promise<void> {
    this.locks.delete(sessionId);
    this.persistLocksToDisk();

    console.log(`🔓 Released lock on session ${sessionId}`);
  }

  /**
   * Create git worktree
   */
  private createWorktree(worktreePath: string, branchName: string): void {
    try {
      // Create new branch and worktree
      this.runGitCommand(this.baseDir, 'worktree', ['add', '-b', branchName, worktreePath]);
    } catch (error) {
      throw new Error(`Failed to create worktree at ${worktreePath}: ${error}`);
    }
  }

  /**
   * Checkout branch in repository
   */
  private checkoutBranch(repoPath: string, branchName: string): void {
    try {
      this.runGitCommand(repoPath, 'checkout', [branchName]);
    } catch (error) {
      throw new Error(`Failed to checkout branch ${branchName}: ${error}`);
    }
  }

  /**
   * Run git command
   */
  private runGitCommand(repoPath: string, command: string, args: string[] = []): string {
    try {
      const result = execSync(`git ${command} ${args.join(' ')}`, {
        cwd: repoPath,
        encoding: 'utf-8',
      });
      return result.trim();
    } catch (error) {
      throw new Error(`Git command failed: git ${command} ${args.join(' ')}\n${(error as Error).message}`);
    }
  }

  /**
   * Verify git repository
   */
  private verifyGitRepository(): void {
    try {
      execSync('git rev-parse --git-dir', { cwd: this.baseDir });
    } catch (error) {
      throw new Error(`${this.baseDir} is not a git repository`);
    }
  }

  /**
   * Validate existing worktrees
   */
  private validateExistingWorktrees(): void {
    if (!fs.existsSync(this.worktreesDir)) {
      return;
    }

    const worktrees = fs.readdirSync(this.worktreesDir);
    for (const worktree of worktrees) {
      const worktreePath = path.join(this.worktreesDir, worktree);
      if (!fs.existsSync(path.join(worktreePath, '.git'))) {
        console.warn(`⚠️  Invalid worktree found: ${worktreePath}`);
      }
    }
  }

  /**
   * Cleanup stale worktrees
   */
  private async cleanupStaleWorktrees(): Promise<void> {
    const staleThreshold = 7 * 24 * 60 * 60 * 1000; // 7 days
    const now = Date.now();

    for (const [sessionId, session] of this.sessions.entries()) {
      if (now - session.lastModified > staleThreshold && session.status !== 'abandoned') {
        this.markSessionAbandoned(sessionId, 'stale');
      }
    }
  }

  /**
   * Validate all sessions
   */
  private async validateAllSessions(): Promise<void> {
    for (const [sessionId, session] of this.sessions.entries()) {
      if (!fs.existsSync(session.worktreePath)) {
        console.warn(`⚠️  Worktree missing for session ${sessionId}`);
        session.status = 'abandoned';
      }
    }
    this.persistSessionsToDisk();
  }

  /**
   * Save session logs
   */
  private async saveSessionLogs(sessionId: string): Promise<void> {
    const logPath = path.join(this.logDir, `session-${sessionId}-${Date.now()}.log`);
    fs.mkdirSync(path.dirname(logPath), { recursive: true });

    const logs = {
      sessionId,
      savedAt: Date.now(),
      session: this.sessions.get(sessionId),
      content: `Session ${sessionId} logs archived at ${new Date().toISOString()}`,
    };

    fs.writeFileSync(logPath, JSON.stringify(logs, null, 2));
  }

  /**
   * Archive session metadata
   */
  private async archiveSession(sessionId: string): Promise<void> {
    const archiveDir = path.join(this.sessionsMetadataDir, 'archived', sessionId);
    const sessionMetadataDir = path.join(this.sessionsMetadataDir, sessionId);

    if (fs.existsSync(sessionMetadataDir)) {
      fs.mkdirSync(archiveDir, { recursive: true });
      // Copy session metadata to archive
      execSync(`cp -r ${sessionMetadataDir}/* ${archiveDir}/`, { stdio: 'pipe' });
    }
  }

  /**
   * Get worktree files
   */
  private getWorktreeFiles(sessionId: string): string[] {
    const session = this.getSession(sessionId);
    if (!session || !fs.existsSync(session.worktreePath)) return [];

    const files: string[] = [];
    const walkDir = (dir: string) => {
      const entries = fs.readdirSync(dir, { withFileTypes: true });
      for (const entry of entries) {
        if (entry.name === '.git') continue;
        const fullPath = path.join(dir, entry.name);
        if (entry.isDirectory()) {
          walkDir(fullPath);
        } else {
          files.push(path.relative(session.worktreePath, fullPath));
        }
      }
    };

    walkDir(session.worktreePath);
    return files;
  }

  /**
   * Ensure required directories exist
   */
  private ensureDirectories(): void {
    const dirs = [this.worktreesDir, this.sessionsMetadataDir, this.logDir];

    for (const dir of dirs) {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
    }
  }

  /**
   * Load sessions from disk
   */
  private loadSessionsFromDisk(): void {
    if (!fs.existsSync(this.sessionFile)) return;

    try {
      const data = JSON.parse(fs.readFileSync(this.sessionFile, 'utf-8'));
      for (const session of data) {
        this.sessions.set(session.id, session);
      }
      console.log(`✓ Loaded ${this.sessions.size} sessions from disk`);
    } catch (error) {
      console.warn(`⚠️  Could not load sessions from disk: ${error}`);
    }
  }

  /**
   * Persist sessions to disk
   */
  private persistSessionsToDisk(): void {
    fs.mkdirSync(this.sessionsMetadataDir, { recursive: true });
    const sessions = Array.from(this.sessions.values());
    fs.writeFileSync(this.sessionFile, JSON.stringify(sessions, null, 2));
  }

  /**
   * Persist locks to disk
   */
  private persistLocksToDisk(): void {
    fs.mkdirSync(this.sessionsMetadataDir, { recursive: true });
    const locks = Array.from(this.locks.values());
    fs.writeFileSync(this.lockFile, JSON.stringify(locks, null, 2));
  }

  /**
   * Generate unique session ID
   */
  private generateSessionId(): string {
    return `sess-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Generate unique snapshot ID
   */
  private generateSnapshotId(): string {
    return `snap-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Shutdown gracefully
   */
  public async shutdown(): Promise<void> {
    console.log('🛑 Shutting down Worktree Manager...');

    // Mark idle sessions
    for (const session of this.sessions.values()) {
      if (session.status === 'active') {
        session.status = 'idle';
      }
    }

    this.persistSessionsToDisk();
    console.log('✓ Worktree manager shutdown complete');
  }
}

/**
 * CLI interface for worktree management
 */
if (require.main === module) {
  const manager = new J4CWorktreeManager(process.cwd());

  (async () => {
    try {
      await manager.initialize();

      // Example: create session
      const session = await manager.createSession('feature/test', {
        userId: 'dev-001',
        projectId: 'test-project',
        taskDescription: 'Test worktree functionality',
      });

      console.log('\n📋 Session created:');
      console.log(`  ID: ${session.id}`);
      console.log(`  Branch: ${session.branch}`);
      console.log(`  Path: ${session.worktreePath}`);

      // Example: list sessions
      const sessions = manager.listSessions();
      console.log(`\n📊 Total sessions: ${sessions.length}`);

      // Cleanup
      await manager.shutdown();
    } catch (error) {
      console.error('❌ Error:', error);
      process.exit(1);
    }
  })();
}
