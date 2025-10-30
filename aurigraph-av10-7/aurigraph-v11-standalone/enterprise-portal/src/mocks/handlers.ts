import { http, HttpResponse } from 'msw';

const API_BASE_URL = 'https://dlt.aurigraph.io/api/v11';

// P0 Priority - Critical Endpoints (8)
// P1 Priority - Important Endpoints (12)
// P2 Priority - Nice-to-Have Endpoints (6)

export const handlers = [
  // ============================================
  // CORE INFRASTRUCTURE (4 endpoints - P0)
  // ============================================

  // P0: Health Check
  http.get(`${API_BASE_URL}/health`, () => {
    return HttpResponse.json({
      status: 'UP',
      timestamp: new Date().toISOString(),
      uptime: 123456,
      version: '11.0.0',
    });
  }),

  // P0: System Info
  http.get(`${API_BASE_URL}/info`, () => {
    return HttpResponse.json({
      version: '11.0.0',
      name: 'Aurigraph V11',
      environment: 'production',
      blockchain: {
        network: 'mainnet',
        consensusAlgorithm: 'HyperRAFT++',
        quantumResistant: true,
      },
    });
  }),

  // P0: Performance Stats
  http.get(`${API_BASE_URL}/stats`, () => {
    return HttpResponse.json({
      tps: 776000,
      latency: 45,
      blockHeight: 1234567,
      totalTransactions: 9876543210,
      activeNodes: 10,
    });
  }),

  // P0: System Health
  http.get(`${API_BASE_URL}/system/health`, () => {
    return HttpResponse.json({
      status: 'healthy',
      components: {
        database: 'healthy',
        cache: 'healthy',
        network: 'healthy',
        consensus: 'healthy',
      },
      timestamp: new Date().toISOString(),
    });
  }),

  // ============================================
  // BLOCKCHAIN CORE (8 endpoints - P0/P1)
  // ============================================

  // P0: Network Topology
  http.get(`${API_BASE_URL}/blockchain/network/topology`, () => {
    return HttpResponse.json({
      nodes: [
        { id: 'node-1', role: 'validator', stake: 1000000, status: 'active' },
        { id: 'node-2', role: 'validator', stake: 950000, status: 'active' },
        { id: 'node-3', role: 'archive', stake: 0, status: 'syncing' },
      ],
      totalNodes: 127,
      activeValidators: 100,
    });
  }),

  // P0: Block Search
  http.get(`${API_BASE_URL}/blockchain/blocks/search`, () => {
    return HttpResponse.json({
      blocks: [
        {
          height: 15234567,
          hash: '0xabc123...',
          timestamp: new Date().toISOString(),
          validator: 'node-1',
          transactions: 500,
          gasUsed: 45000000,
        },
      ],
      total: 15234567,
      page: 1,
    });
  }),

  // P1: Advanced Block Explorer
  http.get(`${API_BASE_URL}/blockchain/explorer/advanced`, () => {
    return HttpResponse.json({
      block: {
        height: 15234567,
        hash: '0xabc123...',
        timestamp: new Date().toISOString(),
        validator: 'node-1',
        transactions: 500,
        gasLimit: 50000000,
        gasUsed: 45000000,
        merkleRoot: '0xdef456...',
        parentHash: '0xghi789...',
      },
    });
  }),

  // P1: Network Event Log
  http.get(`${API_BASE_URL}/network/events`, () => {
    return HttpResponse.json({
      events: [
        {
          timestamp: new Date().toISOString(),
          type: 'node_join',
          nodeId: 'node-128',
          details: 'New validator joined',
        },
      ],
      total: 150,
    });
  }),

  // P0: Validator Performance
  http.get(`${API_BASE_URL}/validators/:id/performance`, () => {
    return HttpResponse.json({
      validatorId: 'node-1',
      uptime: 99.99,
      blocksProposed: 1000,
      attestationsReceived: 9800,
      rewards: 5000,
      penalties: 0,
      stake: 1000000,
    });
  }),

  // P1: Consensus Monitor
  http.get(`${API_BASE_URL}/consensus/detailed`, () => {
    return HttpResponse.json({
      round: 15234567,
      leader: 'node-1',
      status: 'active',
      votingPower: { 'node-1': 40, 'node-2': 35, 'node-3': 25 },
      finality: 3,
    });
  }),

  // P1: Real-Time Analytics
  http.get(`${API_BASE_URL}/analytics/realtime`, () => {
    return HttpResponse.json({
      tps: 776000,
      blockTime: 6.2,
      txPoolSize: 50000,
      networkLatency: { p50: 10, p95: 25, p99: 45 },
    });
  }),

  // P2: Performance Metrics
  http.get(`${API_BASE_URL}/performance/metrics`, () => {
    return HttpResponse.json({
      componentMetrics: [
        { component: 'consensus', renderTime: 120, memoryUsage: 15 },
        { component: 'validator', renderTime: 85, memoryUsage: 12 },
      ],
    });
  }),

  // ============================================
  // SECURITY & AUDIT (3 endpoints - P1)
  // ============================================

  // P1: Security Audit Logs
  http.get(`${API_BASE_URL}/security/audit-logs`, () => {
    return HttpResponse.json({
      logs: [
        {
          id: '1',
          timestamp: new Date().toISOString(),
          severity: 'info',
          event: 'Configuration change',
          user: 'admin@aurigraph.io',
        },
      ],
      total: 500,
    });
  }),

  // P1: Authentication
  http.post(`${API_BASE_URL}/auth/login`, async ({ request }) => {
    const body = await request.json() as any;
    if (body.email === 'admin@aurigraph.io' && body.password === 'AdminPass123!') {
      return HttpResponse.json({
        success: true,
        token: 'mock-jwt-token-12345',
        user: { email: 'admin@aurigraph.io', role: 'admin' },
      });
    }
    return HttpResponse.json({ success: false, error: 'Invalid credentials' }, { status: 401 });
  }),

  // P2: Security Dashboard
  http.get(`${API_BASE_URL}/security/dashboard`, () => {
    return HttpResponse.json({
      threatLevel: 'low',
      failedAuthAttempts: 2,
      suspiciousActivities: 0,
      lastSecurityAudit: new Date().toISOString(),
    });
  }),

  // ============================================
  // REAL-WORLD ASSETS & TOKENS (4 endpoints - P1)
  // ============================================

  // P1: RWA Portfolio
  http.get(`${API_BASE_URL}/rwa/portfolio`, () => {
    return HttpResponse.json({
      assets: [
        { type: 'real_estate', value: 5000000, quantity: 10 },
        { type: 'commodities', value: 2000000, quantity: 500 },
      ],
      totalValue: 7000000,
      allocation: { real_estate: 71, commodities: 29 },
    });
  }),

  // P1: Token Management
  http.get(`${API_BASE_URL}/tokens/:id/management`, () => {
    return HttpResponse.json({
      tokenId: 'AUR-001',
      name: 'Aurigraph Token',
      symbol: 'AUR',
      totalSupply: 1000000000,
      circulatingSupply: 500000000,
      holders: 50000,
    });
  }),

  // P2: Bridge Analytics
  http.get(`${API_BASE_URL}/bridge/analytics`, () => {
    return HttpResponse.json({
      chains: ['Ethereum', 'Solana', 'Polygon'],
      totalValueLocked: 50000000,
      dailyVolume: 5000000,
      successRate: 99.95,
    });
  }),

  // P2: Oracle Dashboard
  http.get(`${API_BASE_URL}/oracles/dashboard`, () => {
    return HttpResponse.json({
      priceFeeds: [
        { asset: 'AUR', price: 125.50, confidence: 0.98 },
        { asset: 'ETH', price: 2100.00, confidence: 0.99 },
      ],
      oracleNodes: 50,
      healthScore: 98,
    });
  }),

  // ============================================
  // CONFIGURATION & MANAGEMENT (4 endpoints - P1/P2)
  // ============================================

  // P1: System Configuration
  http.get(`${API_BASE_URL}/config/management`, () => {
    return HttpResponse.json({
      consensus: { targetTPS: 2000000, batchSize: 10000 },
      network: { maxPeers: 100, port: 9003 },
      security: { quantumLevel: 5, encryptionAlgorithm: 'CRYSTALS-Dilithium' },
    });
  }),

  // P1: Configuration Update
  http.post(`${API_BASE_URL}/config/management`, async ({ request }) => {
    const body = await request.json();
    return HttpResponse.json({
      success: true,
      message: 'Configuration updated',
      settings: body,
    });
  }),

  // P2: AI Model Metrics
  http.get(`${API_BASE_URL}/ai/models/:id/metrics`, () => {
    return HttpResponse.json({
      modelId: 'consensus-optimizer-v2',
      accuracy: 94.5,
      throughput: 850000,
      inferenceTime: 2.3,
      lastUpdated: new Date().toISOString(),
    });
  }),

  // P2: Error Simulation
  http.get(`${API_BASE_URL}/error/:code`, ({ params }) => {
    const { code } = params as { code: string };
    return HttpResponse.json(
      {
        error: code === '500' ? 'Internal Server Error' : 'Not Found',
        message: 'Test error endpoint',
      },
      { status: parseInt(code) || 500 }
    );
  }),

  // ============================================
  // WebSocket Support (Real-time updates)
  // ============================================
  // Note: WebSocket handlers would be configured separately
  // in a WebSocket mock server setup
];
