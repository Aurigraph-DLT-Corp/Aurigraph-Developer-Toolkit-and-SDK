export enum NodeType {
  VALIDATOR = 'validator',
  BASIC = 'basic',
  ASM = 'asm'
}

export enum NodeStatus {
  INITIALIZING = 'initializing',
  RUNNING = 'running',
  SYNCING = 'syncing',
  STOPPING = 'stopping',
  STOPPED = 'stopped',
  ERROR = 'error'
}

export interface NodeConfig {
  nodeId: string;
  nodeType: NodeType;
  nodeName: string;
  nodePort: number;
  networkId: string;
  consensusEnabled: boolean;
  validatorConfig?: ValidatorConfig;
  basicNodeConfig?: BasicNodeConfig;
  asmConfig?: ASMConfig;
}

export interface ValidatorConfig {
  stake: bigint;
  rewardAddress: string;
  consensusKey: string;
  validatorSetSize: number;
  blockProductionEnabled: boolean;
  shardAssignments: string[];
}

export interface BasicNodeConfig {
  dockerized: boolean;
  apiEnabled: boolean;
  lightClient: boolean;
  maxConnections: number;
}

export interface ASMConfig {
  iamEnabled: boolean;
  caEnabled: boolean;
  registryEnabled: boolean;
  monitoringEnabled: boolean;
  adminPrivileges: boolean;
}

export interface NodeHealth {
  healthy: boolean;
  uptime: number;
  memoryUsage: number;
  cpuUsage: number;
  diskUsage: number;
  networkLatency: number;
  consensusParticipation?: number;
  lastBlockHeight: number;
  peersConnected: number;
  transactionPoolSize: number;
}

export interface NodeInfo {
  nodeId: string;
  nodeType: NodeType;
  version: string;
  networkId: string;
  chainId: number;
  genesisHash: string;
  currentBlockHeight: number;
  currentBlockHash: string;
  peers: PeerInfo[];
  capabilities: string[];
}

export interface PeerInfo {
  peerId: string;
  address: string;
  nodeType: NodeType;
  latency: number;
  connected: boolean;
  lastSeen: Date;
}