// Mock data for testing

export const mockHealthData = {
  status: 'UP',
  timestamp: '2025-10-19T10:30:00Z',
  uptime: 123456,
};

export const mockSystemInfo = {
  version: '11.0.0',
  name: 'Aurigraph V11',
  environment: 'production',
  blockchain: {
    network: 'mainnet',
    consensusAlgorithm: 'HyperRAFT++',
    quantumResistant: true,
  },
};

export const mockStats = {
  tps: 776000,
  latency: 45,
  blockHeight: 1234567,
  totalTransactions: 9876543210,
  activeNodes: 10,
};

export const mockConsensusData = {
  status: 'active',
  algorithm: 'HyperRAFT++',
  leader: 'node-1',
  currentTPS: 776000,
  targetTPS: 2000000,
  nodes: [
    { id: 'node-1', status: 'leader', health: 'healthy' },
    { id: 'node-2', status: 'follower', health: 'healthy' },
    { id: 'node-3', status: 'follower', health: 'healthy' },
  ],
  lastUpdated: '2025-10-19T10:30:00Z',
};

export const mockTransactions = [
  {
    hash: '0x1234567890abcdef',
    type: 'payment',
    amount: 1000,
    status: 'confirmed',
    timestamp: '2025-10-19T10:30:00Z',
    from: '0xabc123...',
    to: '0xdef456...',
  },
  {
    hash: '0xfedcba0987654321',
    type: 'contract',
    amount: 0,
    status: 'pending',
    timestamp: '2025-10-19T10:31:00Z',
    from: '0xghi789...',
    to: '0xjkl012...',
  },
];

export const mockNodes = [
  {
    id: 'node-1',
    name: 'Node 1',
    status: 'running',
    role: 'leader',
    health: 'healthy',
    consensusParticipation: 100,
    cpu: 45,
    memory: 60,
    uptime: 172800,
  },
  {
    id: 'node-2',
    name: 'Node 2',
    status: 'running',
    role: 'follower',
    health: 'healthy',
    consensusParticipation: 100,
    cpu: 42,
    memory: 58,
    uptime: 172800,
  },
];

export const mockAnalyticsMetrics = {
  avgTPS: 750000,
  peakTPS: 900000,
  avgLatency: 48,
  successRate: 99.98,
  errorRate: 0.02,
  timeRange: '24h',
  lastUpdated: '2025-10-19T10:30:00Z',
};

export const mockSecurityLogs = [
  {
    id: '1',
    timestamp: '2025-10-19T10:25:00Z',
    severity: 'info',
    event: 'User login',
    user: 'admin@aurigraph.io',
    ip: '192.168.1.100',
  },
  {
    id: '2',
    timestamp: '2025-10-19T10:20:00Z',
    severity: 'warning',
    event: 'Failed login attempt',
    user: 'unknown@test.com',
    ip: '10.0.0.50',
  },
];

export const mockSettings = {
  consensus: {
    targetTPS: 2000000,
    batchSize: 10000,
    parallelThreads: 256,
  },
  network: {
    maxPeers: 100,
    port: 9003,
    grpcPort: 9004,
  },
  security: {
    quantumLevel: 5,
    encryptionAlgorithm: 'CRYSTALS-Dilithium',
  },
};

export const mockUser = {
  email: 'admin@aurigraph.io',
  role: 'admin',
  name: 'Admin User',
};

export const mockAuthResponse = {
  success: true,
  token: 'mock-jwt-token-12345',
  user: mockUser,
};

// Helper to create mock transaction
export const createMockTransaction = (overrides = {}) => ({
  hash: '0x' + Math.random().toString(16).substring(2, 18),
  type: 'payment',
  amount: Math.floor(Math.random() * 10000),
  status: 'confirmed',
  timestamp: new Date().toISOString(),
  from: '0xabc' + Math.random().toString(16).substring(2, 8) + '...',
  to: '0xdef' + Math.random().toString(16).substring(2, 8) + '...',
  ...overrides,
});

// Helper to create mock node
export const createMockNode = (id: string, overrides = {}) => ({
  id,
  name: `Node ${id}`,
  status: 'running',
  role: id === 'node-1' ? 'leader' : 'follower',
  health: 'healthy',
  consensusParticipation: 100,
  cpu: Math.floor(Math.random() * 60) + 20,
  memory: Math.floor(Math.random() * 40) + 40,
  uptime: Math.floor(Math.random() * 200000) + 100000,
  ...overrides,
});
