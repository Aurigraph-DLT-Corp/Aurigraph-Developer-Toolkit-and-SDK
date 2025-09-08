export interface PerformanceMetrics {
  tps: number;
  latency: number;
  throughput: number;
  activeValidators: number;
  timestamp: string;
}

export interface SecurityStatus {
  quantumLevel: number;
  cryptoAlgorithms: string[];
  threatLevel: 'low' | 'medium' | 'high';
  lastAudit: string;
}

export interface CrossChainMetrics {
  supportedChains: number;
  bridgeTransactions: number;
  liquidityPoolValue: string;
  activeConnections: ChainConnection[];
}

export interface ChainConnection {
  chainId: string;
  name: string;
  status: 'connected' | 'disconnected' | 'syncing';
  blockHeight: number;
  lastSync: string;
}

export interface NodeInfo {
  nodeId: string;
  version: string;
  uptime: string;
  role: 'validator' | 'observer' | 'archive';
  status: 'online' | 'offline' | 'syncing';
}

export interface Transaction {
  hash: string;
  from: string;
  to: string;
  amount: string;
  timestamp: string;
  status: 'pending' | 'confirmed' | 'failed';
  zkPrivate: boolean;
  crossChain?: {
    sourceChain: string;
    targetChain: string;
  };
}

export interface AIOptimizerStatus {
  enabled: boolean;
  currentModel: string;
  optimizationLevel: number;
  suggestions: string[];
  learningRate: number;
}