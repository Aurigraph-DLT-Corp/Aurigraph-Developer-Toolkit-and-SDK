/**
 * J4C Session State Manager
 *
 * Manages isolated state for each Claude Code session, including:
 * - Session context and environment
 * - Per-session learning state
 * - Feedback isolation per session
 * - Message bus routing per session
 * - Session-specific configurations
 *
 * Integration with:
 * - J4C Worktree Manager (for git state)
 * - J4C Continuous Learning Framework (for learning isolation)
 * - J4C Agent Communication (for message routing)
 * - J4C Integration Layer (for feedback recording)
 *
 * @author J4C Framework
 * @version 2.0.0
 */

import * as fs from 'fs';
import * as path from 'path';
import * as EventEmitter from 'events';

/**
 * Session context information
 */
export interface SessionState {
  sessionId: string;
  workerId: string;
  createdAt: number;
  lastActivity: number;
  status: 'active' | 'paused' | 'completed' | 'failed';
  environment: {
    workingDirectory: string;
    branch: string;
    worktreePath: string;
  };
  context: {
    projectId: string;
    userId: string;
    taskDescription: string;
    tags: string[];
  };
  learning: {
    eventQueue: any[];
    patterns: Map<string, number>;
    insights: string[];
    confidenceScores: Map<string, number>;
  };
  feedback: {
    queue: any[];
    processed: number;
    successCount: number;
    failureCount: number;
  };
  messages: {
    sent: number;
    received: number;
    routingTable: Map<string, string[]>;
  };
  metadata: {
    parentSessionId?: string;
    childSessions: string[];
    mergedSessions: string[];
    checkpoints: string[];
  };
}

/**
 * Session checkpoint for save/restore
 */
export interface SessionCheckpoint {
  checkpointId: string;
  sessionId: string;
  timestamp: number;
  description: string;
  state: Partial<SessionState>;
  filesSnapshot: Record<string, string>;
}

/**
 * Session isolation rules
 */
export interface IsolationRules {
  isolateFeedback: boolean;
  isolateLearning: boolean;
  isolateMessages: boolean;
  isolateEnvironment: boolean;
  shareGlobalContext: boolean;
}

/**
 * J4C Session State Manager
 */
export class J4CSessionStateManager extends EventEmitter {
  private sessions: Map<string, SessionState> = new Map();
  private checkpoints: Map<string, SessionCheckpoint> = new Map();
  private stateDir: string;
  private checkpointDir: string;

  private sessionFile: string;
  private checkpointFile: string;

  private isolationRules: IsolationRules = {
    isolateFeedback: true,
    isolateLearning: true,
    isolateMessages: true,
    isolateEnvironment: true,
    shareGlobalContext: true,
  };

  constructor(baseDir: string = process.cwd()) {
    super();
    this.stateDir = path.join(baseDir, '.j4c', 'state');
    this.checkpointDir = path.join(baseDir, '.j4c', 'checkpoints');

    this.sessionFile = path.join(this.stateDir, 'session_states.json');
    this.checkpointFile = path.join(this.stateDir, 'checkpoints.json');

    this.ensureDirectories();
    this.loadSessionsFromDisk();
  }

  /**
   * Initialize session state manager
   */
  public async initialize(): Promise<void> {
    console.log('🔄 Initializing J4C Session State Manager...');

    try {
      // Validate existing sessions
      await this.validateAllSessions();

      // Cleanup stale sessions
      await this.cleanupStaleSessions();

      console.log('✓ Session state manager initialized');
      this.emit('initialized');
    } catch (error) {
      console.error('✗ Session state manager initialization failed:', error);
      throw error;
    }
  }

  /**
   * Create new session state
   */
  public createSessionState(options: {
    sessionId: string;
    workerId: string;
    projectId: string;
    userId: string;
    taskDescription: string;
    workingDirectory: string;
    branch: string;
    worktreePath: string;
    tags?: string[];
    parentSessionId?: string;
  }): SessionState {
    const state: SessionState = {
      sessionId: options.sessionId,
      workerId: options.workerId,
      createdAt: Date.now(),
      lastActivity: Date.now(),
      status: 'active',
      environment: {
        workingDirectory: options.workingDirectory,
        branch: options.branch,
        worktreePath: options.worktreePath,
      },
      context: {
        projectId: options.projectId,
        userId: options.userId,
        taskDescription: options.taskDescription,
        tags: options.tags || [],
      },
      learning: {
        eventQueue: [],
        patterns: new Map(),
        insights: [],
        confidenceScores: new Map(),
      },
      feedback: {
        queue: [],
        processed: 0,
        successCount: 0,
        failureCount: 0,
      },
      messages: {
        sent: 0,
        received: 0,
        routingTable: new Map(),
      },
      metadata: {
        parentSessionId: options.parentSessionId,
        childSessions: [],
        mergedSessions: [],
        checkpoints: [],
      },
    };

    this.sessions.set(options.sessionId, state);
    this.persistSessionsToDisk();

    console.log(`✓ Session state created: ${options.sessionId}`);
    this.emit('session:created', { sessionId: options.sessionId, state });

    return state;
  }

  /**
   * Get session state
   */
  public getSessionState(sessionId: string): SessionState | undefined {
    return this.sessions.get(sessionId);
  }

  /**
   * List all sessions
   */
  public listSessions(filter?: { status?: SessionState['status']; projectId?: string }): SessionState[] {
    const sessions = Array.from(this.sessions.values());

    if (!filter) return sessions;

    return sessions.filter((s) => {
      if (filter.status && s.status !== filter.status) return false;
      if (filter.projectId && s.context.projectId !== filter.projectId) return false;
      return true;
    });
  }

  /**
   * Update session activity timestamp
   */
  public updateSessionActivity(sessionId: string): void {
    const state = this.getSessionState(sessionId);
    if (state) {
      state.lastActivity = Date.now();
      this.persistSessionsToDisk();
    }
  }

  /**
   * Record feedback in session context
   */
  public recordFeedbackInSession(sessionId: string, feedback: any): void {
    const state = this.getSessionState(sessionId);
    if (!state) throw new Error(`Session not found: ${sessionId}`);

    if (!this.isolationRules.isolateFeedback) {
      throw new Error('Feedback isolation is disabled');
    }

    state.feedback.queue.push({
      ...feedback,
      recordedAt: Date.now(),
      feedbackId: this.generateId(),
    });

    if (feedback.success) {
      state.feedback.successCount++;
    } else {
      state.feedback.failureCount++;
    }

    this.persistSessionsToDisk();
  }

  /**
   * Get session feedback queue
   */
  public getSessionFeedback(sessionId: string): any[] {
    const state = this.getSessionState(sessionId);
    return state ? state.feedback.queue : [];
  }

  /**
   * Clear session feedback queue
   */
  public clearSessionFeedback(sessionId: string, saveBackup: boolean = true): void {
    const state = this.getSessionState(sessionId);
    if (!state) return;

    if (saveBackup) {
      const backupDir = path.join(this.stateDir, sessionId, 'backups');
      fs.mkdirSync(backupDir, { recursive: true });
      fs.writeFileSync(
        path.join(backupDir, `feedback-${Date.now()}.json`),
        JSON.stringify(state.feedback.queue, null, 2)
      );
    }

    state.feedback.queue = [];
    this.persistSessionsToDisk();
  }

  /**
   * Add learning event to session
   */
  public addLearningEvent(sessionId: string, event: any): void {
    const state = this.getSessionState(sessionId);
    if (!state) throw new Error(`Session not found: ${sessionId}`);

    if (!this.isolationRules.isolateLearning) {
      throw new Error('Learning isolation is disabled');
    }

    state.learning.eventQueue.push({
      ...event,
      timestamp: Date.now(),
      eventId: this.generateId(),
    });

    // Update patterns
    if (event.pattern) {
      const count = state.learning.patterns.get(event.pattern) || 0;
      state.learning.patterns.set(event.pattern, count + 1);
    }

    this.persistSessionsToDisk();
  }

  /**
   * Get session learning state
   */
  public getSessionLearning(sessionId: string) {
    const state = this.getSessionState(sessionId);
    return state ? state.learning : null;
  }

  /**
   * Record learning insight
   */
  public recordLearningInsight(sessionId: string, insight: string, confidence: number): void {
    const state = this.getSessionState(sessionId);
    if (!state) throw new Error(`Session not found: ${sessionId}`);

    state.learning.insights.push(insight);
    state.learning.confidenceScores.set(insight, confidence);

    this.persistSessionsToDisk();
  }

  /**
   * Register message route for session
   */
  public registerMessageRoute(sessionId: string, messageType: string, targets: string[]): void {
    const state = this.getSessionState(sessionId);
    if (!state) throw new Error(`Session not found: ${sessionId}`);

    state.messages.routingTable.set(messageType, targets);
    this.persistSessionsToDisk();
  }

  /**
   * Get message routing table for session
   */
  public getMessageRouting(sessionId: string): Map<string, string[]> | null {
    const state = this.getSessionState(sessionId);
    return state ? state.messages.routingTable : null;
  }

  /**
   * Record message sent from session
   */
  public recordMessageSent(sessionId: string, message: any): void {
    const state = this.getSessionState(sessionId);
    if (!state) throw new Error(`Session not found: ${sessionId}`);

    state.messages.sent++;
    this.persistSessionsToDisk();
  }

  /**
   * Record message received in session
   */
  public recordMessageReceived(sessionId: string, message: any): void {
    const state = this.getSessionState(sessionId);
    if (!state) throw new Error(`Session not found: ${sessionId}`);

    state.messages.received++;
    this.persistSessionsToDisk();
  }

  /**
   * Create session checkpoint
   */
  public createCheckpoint(
    sessionId: string,
    description: string,
    filesSnapshot: Record<string, string> = {}
  ): string {
    const state = this.getSessionState(sessionId);
    if (!state) throw new Error(`Session not found: ${sessionId}`);

    const checkpointId = this.generateCheckpointId();

    const checkpoint: SessionCheckpoint = {
      checkpointId,
      sessionId,
      timestamp: Date.now(),
      description,
      state: JSON.parse(JSON.stringify(state)),
      filesSnapshot,
    };

    this.checkpoints.set(checkpointId, checkpoint);

    // Store checkpoint metadata in session
    state.metadata.checkpoints.push(checkpointId);

    // Save checkpoint to disk
    const checkpointPath = path.join(this.checkpointDir, sessionId, `${checkpointId}.json`);
    fs.mkdirSync(path.dirname(checkpointPath), { recursive: true });
    fs.writeFileSync(checkpointPath, JSON.stringify(checkpoint, null, 2));

    this.persistSessionsToDisk();

    console.log(`📸 Checkpoint created: ${checkpointId}`);
    this.emit('checkpoint:created', { sessionId, checkpointId });

    return checkpointId;
  }

  /**
   * Restore from checkpoint
   */
  public restoreFromCheckpoint(sessionId: string, checkpointId: string): void {
    const checkpoint = this.checkpoints.get(checkpointId);
    if (!checkpoint) throw new Error(`Checkpoint not found: ${checkpointId}`);

    const state = this.getSessionState(sessionId);
    if (!state) throw new Error(`Session not found: ${sessionId}`);

    // Merge checkpoint state back
    Object.assign(state, checkpoint.state);

    state.lastActivity = Date.now();
    this.persistSessionsToDisk();

    console.log(`♻️  Session restored from checkpoint ${checkpointId}`);
    this.emit('checkpoint:restored', { sessionId, checkpointId });
  }

  /**
   * List checkpoints for session
   */
  public listCheckpoints(sessionId: string): SessionCheckpoint[] {
    return Array.from(this.checkpoints.values()).filter((cp) => cp.sessionId === sessionId);
  }

  /**
   * Merge two sessions
   */
  public mergeSessions(sourceSessionId: string, targetSessionId: string, strategy: 'source' | 'target' | 'merge' = 'merge'): void {
    const source = this.getSessionState(sourceSessionId);
    const target = this.getSessionState(targetSessionId);

    if (!source || !target) throw new Error('One or both sessions not found');

    console.log(`🔀 Merging session ${sourceSessionId} into ${targetSessionId}`);

    if (strategy === 'source') {
      // Copy source feedback to target
      target.feedback.queue.push(...source.feedback.queue);
      target.feedback.successCount += source.feedback.successCount;
      target.feedback.failureCount += source.feedback.failureCount;
    } else if (strategy === 'target') {
      // Keep target as-is
    } else if (strategy === 'merge') {
      // Merge both
      target.feedback.queue.push(...source.feedback.queue);
      target.feedback.successCount += source.feedback.successCount;
      target.feedback.failureCount += source.feedback.failureCount;
      target.learning.eventQueue.push(...source.learning.eventQueue);
    }

    // Track merged sessions
    target.metadata.mergedSessions.push(sourceSessionId);
    source.status = 'completed';

    this.persistSessionsToDisk();
    this.emit('sessions:merged', { sourceSessionId, targetSessionId });
  }

  /**
   * Set isolation rules
   */
  public setIsolationRules(rules: Partial<IsolationRules>): void {
    this.isolationRules = { ...this.isolationRules, ...rules };
    console.log('🔐 Isolation rules updated:', this.isolationRules);
  }

  /**
   * Get isolation rules
   */
  public getIsolationRules(): IsolationRules {
    return { ...this.isolationRules };
  }

  /**
   * Verify session state consistency
   */
  public verifySessionConsistency(sessionId: string): { valid: boolean; issues: string[] } {
    const state = this.getSessionState(sessionId);
    if (!state) return { valid: false, issues: ['Session not found'] };

    const issues: string[] = [];

    // Check feedback counts
    const feedbackCount = state.feedback.queue.length;
    const reportedCount = state.feedback.successCount + state.feedback.failureCount;

    if (feedbackCount > reportedCount) {
      issues.push(`Feedback queue has ${feedbackCount} items but only ${reportedCount} are accounted for`);
    }

    // Check learning state
    if (state.learning.eventQueue.length === 0 && state.learning.insights.length > 0) {
      issues.push('Has insights but no learning events');
    }

    // Check message state
    if (state.messages.routingTable.size === 0 && (state.messages.sent > 0 || state.messages.received > 0)) {
      issues.push('Has message activity but no routing table entries');
    }

    return {
      valid: issues.length === 0,
      issues,
    };
  }

  /**
   * Export session state
   */
  public exportSession(sessionId: string, outputPath: string): void {
    const state = this.getSessionState(sessionId);
    if (!state) throw new Error(`Session not found: ${sessionId}`);

    const checkpoints = this.listCheckpoints(sessionId);

    const exportData = {
      state,
      checkpoints,
      exportedAt: Date.now(),
      verification: this.verifySessionConsistency(sessionId),
    };

    fs.mkdirSync(path.dirname(outputPath), { recursive: true });
    fs.writeFileSync(outputPath, JSON.stringify(exportData, null, 2));

    console.log(`✓ Session exported: ${outputPath}`);
  }

  /**
   * Import session state
   */
  public importSession(inputPath: string): string {
    if (!fs.existsSync(inputPath)) throw new Error(`Import file not found: ${inputPath}`);

    const data = JSON.parse(fs.readFileSync(inputPath, 'utf-8'));
    const sessionId = data.state.sessionId;

    this.sessions.set(sessionId, data.state);

    // Restore checkpoints
    for (const checkpoint of data.checkpoints) {
      this.checkpoints.set(checkpoint.checkpointId, checkpoint);
    }

    this.persistSessionsToDisk();

    console.log(`✓ Session imported: ${sessionId}`);
    return sessionId;
  }

  /**
   * Get session summary statistics
   */
  public getSessionSummary(sessionId: string): Record<string, any> | null {
    const state = this.getSessionState(sessionId);
    if (!state) return null;

    const uptime = Date.now() - state.createdAt;
    const feedbackTotal = state.feedback.successCount + state.feedback.failureCount;
    const successRate = feedbackTotal > 0 ? state.feedback.successCount / feedbackTotal : 0;

    return {
      sessionId,
      status: state.status,
      uptime,
      uptimeFormatted: this.formatDuration(uptime),
      createdAt: new Date(state.createdAt).toISOString(),
      lastActivity: new Date(state.lastActivity).toISOString(),
      feedback: {
        total: feedbackTotal,
        successCount: state.feedback.successCount,
        failureCount: state.feedback.failureCount,
        successRate: (successRate * 100).toFixed(2) + '%',
      },
      learning: {
        eventsProcessed: state.learning.eventQueue.length,
        patternsDetected: state.learning.patterns.size,
        insightsGenerated: state.learning.insights.length,
      },
      messages: {
        sent: state.messages.sent,
        received: state.messages.received,
        routes: state.messages.routingTable.size,
      },
      metadata: {
        checkpoints: state.metadata.checkpoints.length,
        childSessions: state.metadata.childSessions.length,
        mergedSessions: state.metadata.mergedSessions.length,
      },
    };
  }

  /**
   * Cleanup session state
   */
  public async cleanupSession(sessionId: string, archiveData: boolean = true): Promise<void> {
    const state = this.getSessionState(sessionId);
    if (!state) return;

    console.log(`🧹 Cleaning up session state: ${sessionId}`);

    // Archive if requested
    if (archiveData) {
      const archiveDir = path.join(this.stateDir, 'archived', sessionId);
      fs.mkdirSync(archiveDir, { recursive: true });

      const summary = this.getSessionSummary(sessionId);
      fs.writeFileSync(path.join(archiveDir, 'summary.json'), JSON.stringify(summary, null, 2));
    }

    // Remove session
    this.sessions.delete(sessionId);
    this.persistSessionsToDisk();

    console.log(`✓ Session state cleaned: ${sessionId}`);
  }

  /**
   * Cleanup stale sessions (older than 7 days)
   */
  private async cleanupStaleSessions(): Promise<void> {
    const staleThreshold = 7 * 24 * 60 * 60 * 1000; // 7 days
    const now = Date.now();
    let count = 0;

    for (const [sessionId, state] of this.sessions.entries()) {
      if (now - state.lastActivity > staleThreshold && state.status !== 'active') {
        await this.cleanupSession(sessionId);
        count++;
      }
    }

    if (count > 0) {
      console.log(`🧹 Cleaned up ${count} stale sessions`);
    }
  }

  /**
   * Validate all sessions
   */
  private async validateAllSessions(): Promise<void> {
    for (const [sessionId, state] of this.sessions.entries()) {
      const consistency = this.verifySessionConsistency(sessionId);
      if (!consistency.valid) {
        console.warn(`⚠️  Session ${sessionId} has consistency issues:`, consistency.issues);
      }
    }
  }

  /**
   * Ensure required directories exist
   */
  private ensureDirectories(): void {
    const dirs = [this.stateDir, this.checkpointDir];

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
        // Restore Map objects
        session.learning.patterns = new Map(Object.entries(session.learning.patterns || {}));
        session.learning.confidenceScores = new Map(Object.entries(session.learning.confidenceScores || {}));
        session.messages.routingTable = new Map(Object.entries(session.messages.routingTable || {}));
        this.sessions.set(session.sessionId, session);
      }
      console.log(`✓ Loaded ${this.sessions.size} session states from disk`);
    } catch (error) {
      console.warn(`⚠️  Could not load session states: ${error}`);
    }
  }

  /**
   * Persist sessions to disk
   */
  private persistSessionsToDisk(): void {
    fs.mkdirSync(this.stateDir, { recursive: true });
    const sessions = Array.from(this.sessions.values()).map((s) => ({
      ...s,
      learning: {
        ...s.learning,
        patterns: Object.fromEntries(s.learning.patterns),
        confidenceScores: Object.fromEntries(s.learning.confidenceScores),
      },
      messages: {
        ...s.messages,
        routingTable: Object.fromEntries(s.messages.routingTable),
      },
    }));

    fs.writeFileSync(this.sessionFile, JSON.stringify(sessions, null, 2));
  }

  /**
   * Generate unique ID
   */
  private generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Generate checkpoint ID
   */
  private generateCheckpointId(): string {
    return `cp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Format duration
   */
  private formatDuration(ms: number): string {
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
   * Shutdown gracefully
   */
  public async shutdown(): Promise<void> {
    console.log('🛑 Shutting down Session State Manager...');
    this.persistSessionsToDisk();
    console.log('✓ Session state manager shutdown complete');
  }
}

/**
 * CLI interface for session state management
 */
if (require.main === module) {
  const manager = new J4CSessionStateManager();

  (async () => {
    try {
      await manager.initialize();

      // Example: create session state
      const state = manager.createSessionState({
        sessionId: 'sess-001',
        workerId: 'worker-001',
        projectId: 'test-project',
        userId: 'dev-001',
        taskDescription: 'Test session state management',
        workingDirectory: '/tmp/test',
        branch: 'feature/test',
        worktreePath: '/tmp/worktree/test',
      });

      console.log('\n📋 Session state created:');
      console.log(`  ID: ${state.sessionId}`);
      console.log(`  Status: ${state.status}`);

      // Create checkpoint
      const checkpointId = manager.createCheckpoint(state.sessionId, 'Initial checkpoint');
      console.log(`  Checkpoint: ${checkpointId}`);

      // Get summary
      const summary = manager.getSessionSummary(state.sessionId);
      console.log('\n📊 Session Summary:');
      console.log(JSON.stringify(summary, null, 2));

      // Cleanup
      await manager.shutdown();
    } catch (error) {
      console.error('❌ Error:', error);
      process.exit(1);
    }
  })();
}
