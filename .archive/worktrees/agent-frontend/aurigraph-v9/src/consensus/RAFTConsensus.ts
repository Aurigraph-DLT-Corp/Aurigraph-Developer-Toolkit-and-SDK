import { EventEmitter } from 'events';
import { Logger } from '../utils/Logger';
import { ConsensusConfig, ConsensusState, LogEntry, ConsensusResult } from './types';

export class RAFTConsensus extends EventEmitter {
  private logger: Logger;
  private config: ConsensusConfig;
  private state: ConsensusState;
  private currentTerm: number = 0;
  private votedFor: string | null = null;
  private log: LogEntry[] = [];
  private commitIndex: number = 0;
  private lastApplied: number = 0;
  private nextIndex: Map<string, number> = new Map();
  private matchIndex: Map<string, number> = new Map();
  private electionTimer?: NodeJS.Timeout;
  private heartbeatTimer?: NodeJS.Timeout;
  private batchBuffer: any[] = [];
  private pipelineDepth: number = 3;

  constructor(config: ConsensusConfig) {
    super();
    this.logger = new Logger('RAFTConsensus');
    this.config = config;
    this.state = ConsensusState.FOLLOWER;
  }

  async initialize(): Promise<void> {
    this.logger.info('Initializing RAFT consensus...');
    this.startElectionTimer();
  }

  async start(): Promise<void> {
    this.logger.info('Starting RAFT consensus...');
    this.state = ConsensusState.FOLLOWER;
    this.emit('follower');
  }

  async stop(): Promise<void> {
    this.logger.info('Stopping RAFT consensus...');
    if (this.electionTimer) clearTimeout(this.electionTimer);
    if (this.heartbeatTimer) clearInterval(this.heartbeatTimer);
    this.state = ConsensusState.STOPPED;
  }

  private startElectionTimer(): void {
    if (this.electionTimer) clearTimeout(this.electionTimer);
    
    const timeout = this.config.electionTimeout + Math.random() * this.config.electionTimeout;
    this.electionTimer = setTimeout(() => {
      if (this.state === ConsensusState.FOLLOWER || this.state === ConsensusState.CANDIDATE) {
        this.startElection();
      }
    }, timeout);
  }

  private async startElection(): Promise<void> {
    this.logger.info('Starting election...');
    this.state = ConsensusState.CANDIDATE;
    this.currentTerm++;
    this.votedFor = this.config.nodeId;
    
    const lastLogIndex = this.log.length - 1;
    const lastLogTerm = lastLogIndex >= 0 ? this.log[lastLogIndex].term : 0;
    
    const voteRequest = {
      term: this.currentTerm,
      candidateId: this.config.nodeId,
      lastLogIndex: lastLogIndex,
      lastLogTerm: lastLogTerm
    };
    
    const votes = await this.requestVotes(voteRequest);
    
    if (votes > Math.floor(this.config.validators.length / 2)) {
      this.becomeLeader();
    } else {
      this.startElectionTimer();
    }
  }

  private async requestVotes(voteRequest: any): Promise<number> {
    let votes = 1;
    
    const votePromises = this.config.validators
      .filter(v => v !== this.config.nodeId)
      .map(async (validatorId) => {
        try {
          const response = await this.sendVoteRequest(validatorId, voteRequest);
          if (response.voteGranted) votes++;
        } catch (error) {
          this.logger.warn(`Failed to get vote from ${validatorId}:`, error);
        }
      });
    
    await Promise.all(votePromises);
    return votes;
  }

  private becomeLeader(): void {
    this.logger.info('Became leader');
    this.state = ConsensusState.LEADER;
    this.emit('leader');
    
    for (const validator of this.config.validators) {
      if (validator !== this.config.nodeId) {
        this.nextIndex.set(validator, this.log.length);
        this.matchIndex.set(validator, 0);
      }
    }
    
    this.startHeartbeat();
  }

  private startHeartbeat(): void {
    if (this.heartbeatTimer) clearInterval(this.heartbeatTimer);
    
    this.heartbeatTimer = setInterval(() => {
      if (this.state === ConsensusState.LEADER) {
        this.sendHeartbeats();
      }
    }, this.config.heartbeatInterval);
  }

  private async sendHeartbeats(): Promise<void> {
    const heartbeatPromises = this.config.validators
      .filter(v => v !== this.config.nodeId)
      .map(async (validatorId) => {
        try {
          await this.sendAppendEntries(validatorId, []);
        } catch (error) {
          this.logger.warn(`Failed to send heartbeat to ${validatorId}:`, error);
        }
      });
    
    await Promise.all(heartbeatPromises);
  }

  async proposeBlock(block: any): Promise<ConsensusResult> {
    if (this.state !== ConsensusState.LEADER) {
      throw new Error('Only leader can propose blocks');
    }
    
    const entry: LogEntry = {
      term: this.currentTerm,
      index: this.log.length,
      data: block,
      timestamp: Date.now()
    };
    
    this.log.push(entry);
    
    const replicationResult = await this.replicateEntry(entry);
    
    if (replicationResult.success) {
      this.commitIndex = entry.index;
      await this.applyEntry(entry);
      this.emit('block-committed', block);
    }
    
    return replicationResult;
  }

  private async replicateEntry(entry: LogEntry): Promise<ConsensusResult> {
    const replicationPromises = this.config.validators
      .filter(v => v !== this.config.nodeId)
      .map(async (validatorId) => {
        const nextIdx = this.nextIndex.get(validatorId) || 0;
        const prevLogIndex = nextIdx - 1;
        const prevLogTerm = prevLogIndex >= 0 ? this.log[prevLogIndex].term : 0;
        
        const appendRequest = {
          term: this.currentTerm,
          leaderId: this.config.nodeId,
          prevLogIndex: prevLogIndex,
          prevLogTerm: prevLogTerm,
          entries: [entry],
          leaderCommit: this.commitIndex
        };
        
        try {
          const response = await this.sendAppendEntries(validatorId, [entry]);
          if (response.success) {
            this.nextIndex.set(validatorId, entry.index + 1);
            this.matchIndex.set(validatorId, entry.index);
          }
          return response.success;
        } catch (error) {
          this.logger.warn(`Failed to replicate to ${validatorId}:`, error);
          return false;
        }
      });
    
    const results = await Promise.all(replicationPromises);
    const successCount = results.filter(r => r).length + 1;
    
    return {
      success: successCount > Math.floor(this.config.validators.length / 2),
      term: this.currentTerm,
      index: entry.index,
      timestamp: Date.now()
    };
  }

  private async applyEntry(entry: LogEntry): Promise<void> {
    this.lastApplied = entry.index;
    this.emit('consensus-achieved', {
      type: 'entry-applied',
      data: entry
    });
  }

  async processBatch(transactions: any[]): Promise<ConsensusResult> {
    if (this.state !== ConsensusState.LEADER) {
      throw new Error('Only leader can process batches');
    }
    
    const batch = {
      transactions: transactions,
      batchId: this.generateBatchId(),
      timestamp: Date.now()
    };
    
    const entry: LogEntry = {
      term: this.currentTerm,
      index: this.log.length,
      data: batch,
      timestamp: Date.now()
    };
    
    this.log.push(entry);
    
    const replicationResult = await this.replicateEntry(entry);
    
    if (replicationResult.success) {
      this.commitIndex = entry.index;
      await this.applyEntry(entry);
      this.emit('batch-committed', batch);
    }
    
    return replicationResult;
  }

  private generateBatchId(): string {
    return `batch-${this.currentTerm}-${this.log.length}-${Date.now()}`;
  }

  async requestJoinValidatorSet(request: any): Promise<void> {
    if (this.state === ConsensusState.LEADER) {
      this.config.validators.push(request.nodeId);
      await this.reconfigureCluster();
    } else {
      await this.forwardToLeader(request);
    }
  }

  async requestLeaveValidatorSet(nodeId: string): Promise<void> {
    if (this.state === ConsensusState.LEADER) {
      this.config.validators = this.config.validators.filter(v => v !== nodeId);
      await this.reconfigureCluster();
    } else {
      await this.forwardToLeader({ type: 'leave', nodeId });
    }
  }

  private async reconfigureCluster(): Promise<void> {
    const configChange = {
      type: 'config-change',
      validators: this.config.validators,
      timestamp: Date.now()
    };
    
    const entry: LogEntry = {
      term: this.currentTerm,
      index: this.log.length,
      data: configChange,
      timestamp: Date.now()
    };
    
    await this.replicateEntry(entry);
  }

  private async sendVoteRequest(validatorId: string, request: any): Promise<any> {
    return { voteGranted: Math.random() > 0.3 };
  }

  private async sendAppendEntries(validatorId: string, entries: any[]): Promise<any> {
    return { success: true, term: this.currentTerm };
  }

  private async forwardToLeader(request: any): Promise<void> {
    this.logger.info('Forwarding request to leader');
  }

  async getHealth(): Promise<any> {
    return {
      healthy: this.state !== ConsensusState.STOPPED,
      state: this.state,
      term: this.currentTerm,
      commitIndex: this.commitIndex,
      lastApplied: this.lastApplied,
      logLength: this.log.length,
      participation: this.state === ConsensusState.LEADER ? 1.0 : 0.8
    };
  }
}