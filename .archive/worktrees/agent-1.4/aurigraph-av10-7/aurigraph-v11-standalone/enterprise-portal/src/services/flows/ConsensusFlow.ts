// Consensus Flow - HyperRAFT++ consensus workflow orchestration
import {
  FlowExecutor,
  FlowNode,
  FlowContext,
  FlowExecutionResult,
  FlowDefinition,
  FlowType,
  NodeType,
} from './FlowEngine';

export enum ConsensusPhase {
  LEADER_ELECTION = 'LEADER_ELECTION',
  LOG_REPLICATION = 'LOG_REPLICATION',
  COMMIT_LOG = 'COMMIT_LOG',
  APPLY_STATE = 'APPLY_STATE',
  COMPLETED = 'COMPLETED',
}

export enum NodeRole {
  LEADER = 'LEADER',
  FOLLOWER = 'FOLLOWER',
  CANDIDATE = 'CANDIDATE',
}

export interface ConsensusNode {
  id: string;
  role: NodeRole;
  term: number;
  votedFor?: string;
  log: LogEntry[];
  commitIndex: number;
  lastApplied: number;
}

export interface LogEntry {
  term: number;
  index: number;
  command: any;
  timestamp: Date;
}

/**
 * Leader Election Executor
 */
export class LeaderElectionExecutor implements FlowExecutor {
  async execute(node: FlowNode, context: FlowContext): Promise<FlowExecutionResult> {
    const currentTerm = context.getVariable('currentTerm') || 0;
    const nodeId = context.getVariable('nodeId') || 'node_1';

    context.log(`Starting leader election for term ${currentTerm + 1}`);

    try {
      // Increment term
      const newTerm = currentTerm + 1;
      context.setVariable('currentTerm', newTerm);

      // Request votes from other nodes
      const votes = await this.requestVotes(nodeId, newTerm);
      const votesReceived = votes.filter((v) => v.granted).length;
      const totalNodes = votes.length + 1; // +1 for self
      const majority = Math.floor(totalNodes / 2) + 1;

      const isLeader = votesReceived >= majority;

      if (isLeader) {
        context.setVariable('role', NodeRole.LEADER);
        context.setVariable('leaderId', nodeId);
        context.log(`✅ Elected as leader with ${votesReceived}/${totalNodes} votes`);
      } else {
        context.setVariable('role', NodeRole.FOLLOWER);
        context.log(`❌ Failed to become leader: ${votesReceived}/${majority} votes`);
      }

      return {
        success: true,
        output: {
          elected: isLeader,
          term: newTerm,
          votes: votesReceived,
          majority,
        },
        nextNodes: isLeader ? ['replicate_log'] : ['wait_for_leader'],
        logs: [
          `Leader election completed`,
          `Term: ${newTerm}`,
          `Votes received: ${votesReceived}/${totalNodes}`,
          `Result: ${isLeader ? 'LEADER' : 'FOLLOWER'}`,
        ],
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
        logs: [`Leader election failed: ${error.message}`],
      };
    }
  }

  private async requestVotes(nodeId: string, term: number): Promise<any[]> {
    // Simulate vote requests to other nodes
    await new Promise((resolve) => setTimeout(resolve, 100));

    const nodeCount = 5;
    const votes = [];

    for (let i = 1; i <= nodeCount; i++) {
      votes.push({
        nodeId: `node_${i}`,
        granted: Math.random() > 0.3, // 70% chance of granting vote
        term,
      });
    }

    return votes;
  }
}

/**
 * Log Replication Executor
 */
export class LogReplicationExecutor implements FlowExecutor {
  async execute(node: FlowNode, context: FlowContext): Promise<FlowExecutionResult> {
    const leaderId = context.getVariable('leaderId');
    const currentTerm = context.getVariable('currentTerm');
    const entries: LogEntry[] = context.getVariable('logEntries') || [];

    context.log(`Replicating ${entries.length} log entries`);

    try {
      // Append entries to followers
      const replicationResults = await this.appendEntriesToFollowers(leaderId, currentTerm, entries);

      const successCount = replicationResults.filter((r) => r.success).length;
      const totalFollowers = replicationResults.length;
      const majority = Math.floor(totalFollowers / 2) + 1;

      const replicated = successCount >= majority;

      if (replicated) {
        context.setVariable('replicationSuccess', true);
        context.log(`✅ Log replicated to ${successCount}/${totalFollowers} followers`);
      } else {
        throw new Error(
          `Failed to replicate to majority: ${successCount}/${majority} required`
        );
      }

      return {
        success: true,
        output: {
          replicated,
          successCount,
          totalFollowers,
        },
        logs: [
          `Log replication completed`,
          `Entries replicated: ${entries.length}`,
          `Success: ${successCount}/${totalFollowers}`,
        ],
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
        logs: [`Log replication failed: ${error.message}`],
      };
    }
  }

  private async appendEntriesToFollowers(
    leaderId: string,
    term: number,
    entries: LogEntry[]
  ): Promise<any[]> {
    // Simulate append entries RPC to followers
    await new Promise((resolve) => setTimeout(resolve, 150));

    const followerCount = 4;
    const results = [];

    for (let i = 1; i <= followerCount; i++) {
      results.push({
        nodeId: `follower_${i}`,
        success: Math.random() > 0.2, // 80% success rate
        matchIndex: entries.length,
      });
    }

    return results;
  }
}

/**
 * Commit Log Executor
 */
export class CommitLogExecutor implements FlowExecutor {
  async execute(node: FlowNode, context: FlowContext): Promise<FlowExecutionResult> {
    const entries: LogEntry[] = context.getVariable('logEntries') || [];
    const commitIndex = context.getVariable('commitIndex') || 0;

    context.log(`Committing ${entries.length} log entries`);

    try {
      // Update commit index
      const newCommitIndex = commitIndex + entries.length;
      context.setVariable('commitIndex', newCommitIndex);

      // Commit entries
      await this.commitLogEntries(entries);

      context.log(`✅ Committed ${entries.length} entries (commit index: ${newCommitIndex})`);

      return {
        success: true,
        output: {
          committed: entries.length,
          commitIndex: newCommitIndex,
        },
        logs: [
          `Log entries committed`,
          `Entries committed: ${entries.length}`,
          `New commit index: ${newCommitIndex}`,
        ],
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
        logs: [`Log commit failed: ${error.message}`],
      };
    }
  }

  private async commitLogEntries(entries: LogEntry[]): Promise<void> {
    // Simulate committing log entries
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
}

/**
 * Apply State Executor
 */
export class ApplyStateExecutor implements FlowExecutor {
  async execute(node: FlowNode, context: FlowContext): Promise<FlowExecutionResult> {
    const entries: LogEntry[] = context.getVariable('logEntries') || [];
    const lastApplied = context.getVariable('lastApplied') || 0;

    context.log(`Applying ${entries.length} committed entries to state machine`);

    try {
      // Apply entries to state machine
      const results = await this.applyToStateMachine(entries);

      const newLastApplied = lastApplied + entries.length;
      context.setVariable('lastApplied', newLastApplied);

      context.log(`✅ Applied ${entries.length} entries (last applied: ${newLastApplied})`);

      return {
        success: true,
        output: {
          applied: entries.length,
          lastApplied: newLastApplied,
          results,
        },
        logs: [
          `State machine updated`,
          `Entries applied: ${entries.length}`,
          `Last applied index: ${newLastApplied}`,
        ],
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
        logs: [`State application failed: ${error.message}`],
      };
    }
  }

  private async applyToStateMachine(entries: LogEntry[]): Promise<any[]> {
    // Simulate applying entries to state machine
    await new Promise((resolve) => setTimeout(resolve, 100));

    return entries.map((entry) => ({
      index: entry.index,
      term: entry.term,
      applied: true,
      result: `Applied command: ${entry.command}`,
    }));
  }
}

/**
 * Create HyperRAFT++ consensus flow
 */
export function createConsensusFlow(logEntries: LogEntry[]): FlowDefinition {
  return {
    id: `consensus_${Date.now()}`,
    name: 'HyperRAFT++ Consensus Flow',
    type: FlowType.CONSENSUS,
    description: 'Leader election, log replication, and state machine application',
    version: '1.0',
    nodes: [
      {
        id: 'start',
        type: NodeType.START,
        name: 'Start Consensus',
        config: {},
        position: { x: 100, y: 200 },
        inputs: [],
        outputs: ['elect_leader'],
      },
      {
        id: 'elect_leader',
        type: NodeType.TASK,
        name: 'Leader Election',
        config: {},
        position: { x: 300, y: 200 },
        inputs: ['start'],
        outputs: ['check_leader'],
      },
      {
        id: 'check_leader',
        type: NodeType.DECISION,
        name: 'Is Leader?',
        config: {
          condition: 'context.getVariable("role") === "LEADER"',
          branches: { true: 'replicate_log', false: 'wait_for_leader' },
        },
        position: { x: 500, y: 200 },
        inputs: ['elect_leader'],
        outputs: ['replicate_log', 'wait_for_leader'],
      },
      {
        id: 'replicate_log',
        type: NodeType.TASK,
        name: 'Replicate Log',
        config: {},
        position: { x: 700, y: 100 },
        inputs: ['check_leader'],
        outputs: ['commit_log'],
      },
      {
        id: 'commit_log',
        type: NodeType.TASK,
        name: 'Commit Log',
        config: {},
        position: { x: 900, y: 100 },
        inputs: ['replicate_log'],
        outputs: ['apply_state'],
      },
      {
        id: 'apply_state',
        type: NodeType.TASK,
        name: 'Apply to State Machine',
        config: {},
        position: { x: 1100, y: 100 },
        inputs: ['commit_log'],
        outputs: ['end_success'],
      },
      {
        id: 'wait_for_leader',
        type: NodeType.TASK,
        name: 'Wait for Leader',
        config: { waitTime: 1000 },
        position: { x: 700, y: 300 },
        inputs: ['check_leader'],
        outputs: ['end_follower'],
      },
      {
        id: 'end_success',
        type: NodeType.END,
        name: 'Consensus Complete',
        config: {},
        position: { x: 1300, y: 100 },
        inputs: ['apply_state'],
        outputs: [],
      },
      {
        id: 'end_follower',
        type: NodeType.END,
        name: 'Follower Mode',
        config: {},
        position: { x: 900, y: 300 },
        inputs: ['wait_for_leader'],
        outputs: [],
      },
    ],
    connections: [
      { id: 'c1', source: 'start', target: 'elect_leader' },
      { id: 'c2', source: 'elect_leader', target: 'check_leader' },
      { id: 'c3', source: 'check_leader', target: 'replicate_log', condition: 'is_leader' },
      { id: 'c4', source: 'check_leader', target: 'wait_for_leader', condition: 'is_follower' },
      { id: 'c5', source: 'replicate_log', target: 'commit_log' },
      { id: 'c6', source: 'commit_log', target: 'apply_state' },
      { id: 'c7', source: 'apply_state', target: 'end_success' },
      { id: 'c8', source: 'wait_for_leader', target: 'end_follower' },
    ],
    variables: { logEntries },
    metadata: { flowType: 'HyperRAFTPlusPlus', phase: ConsensusPhase.LEADER_ELECTION },
    createdAt: new Date(),
    updatedAt: new Date(),
    createdBy: 'system',
  };
}
