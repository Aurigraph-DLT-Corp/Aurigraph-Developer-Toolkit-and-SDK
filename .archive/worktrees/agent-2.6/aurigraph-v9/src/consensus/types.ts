export interface ConsensusConfig {
  algorithm: string;
  nodeId: string;
  validators: string[];
  electionTimeout: number;
  heartbeatInterval: number;
  batchSize: number;
  pipelineDepth: number;
}

export interface ShardingConfig {
  enabled: boolean;
  shardCount: number;
  virtualNodes: number;
  autoRebalance: boolean;
  rebalanceInterval: number;
  maxLoadRatio: number;
}

export enum ConsensusState {
  FOLLOWER = 'follower',
  CANDIDATE = 'candidate',
  LEADER = 'leader',
  STOPPED = 'stopped'
}

export interface LogEntry {
  term: number;
  index: number;
  data: any;
  timestamp: number;
}

export interface ConsensusResult {
  success: boolean;
  term: number;
  index: number;
  timestamp: number;
}

export interface Transaction {
  txId: string;
  hash: string;
  sender: string;
  type: string;
  inputs?: TransactionInput[];
  outputs?: TransactionOutput[];
  data?: any;
  timestamp: number;
  signature?: string;
}

export interface TransactionInput {
  address: string;
  amount: bigint;
  assetId?: string;
}

export interface TransactionOutput {
  address: string;
  amount: bigint;
  assetId?: string;
}

export interface TransactionResult {
  txId: string;
  success: boolean;
  gasUsed: number;
  error?: string;
  stateTransition?: any;
  events?: any[];
}