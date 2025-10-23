import { http, HttpResponse } from 'msw';

const API_BASE_URL = 'https://dlt.aurigraph.io/api/v11';

export const handlers = [
  // Health Check
  http.get(`${API_BASE_URL}/health`, () => {
    return HttpResponse.json({
      status: 'UP',
      timestamp: new Date().toISOString(),
      uptime: 123456,
    });
  }),

  // System Info
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

  // Performance Stats
  http.get(`${API_BASE_URL}/stats`, () => {
    return HttpResponse.json({
      tps: 776000,
      latency: 45,
      blockHeight: 1234567,
      totalTransactions: 9876543210,
      activeNodes: 10,
    });
  }),

  // Live Consensus Data
  http.get(`${API_BASE_URL}/live/consensus`, () => {
    return HttpResponse.json({
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
      lastUpdated: new Date().toISOString(),
    });
  }),

  // Transactions List
  http.get(`${API_BASE_URL}/transactions`, () => {
    return HttpResponse.json({
      transactions: [
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
      ],
      total: 2,
      page: 1,
      pageSize: 10,
    });
  }),

  // Node List
  http.get(`${API_BASE_URL}/nodes`, () => {
    return HttpResponse.json({
      nodes: [
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
      ],
      total: 2,
    });
  }),

  // Analytics Metrics
  http.get(`${API_BASE_URL}/analytics/metrics`, () => {
    return HttpResponse.json({
      metrics: {
        avgTPS: 750000,
        peakTPS: 900000,
        avgLatency: 48,
        successRate: 99.98,
        errorRate: 0.02,
      },
      timeRange: '24h',
      lastUpdated: new Date().toISOString(),
    });
  }),

  // Security Audit Logs
  http.get(`${API_BASE_URL}/security/audit-logs`, () => {
    return HttpResponse.json({
      logs: [
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
      ],
      total: 2,
    });
  }),

  // Settings
  http.get(`${API_BASE_URL}/settings/system`, () => {
    return HttpResponse.json({
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
    });
  }),

  // Update Settings
  http.post(`${API_BASE_URL}/settings/system`, async ({ request }) => {
    const body = await request.json();
    return HttpResponse.json({
      success: true,
      message: 'Settings updated successfully',
      settings: body,
    });
  }),

  // Authentication (Mock)
  http.post(`${API_BASE_URL}/auth/login`, async ({ request }) => {
    const body = await request.json() as any;

    if (body.email === 'admin@aurigraph.io' && body.password === 'AdminPass123!') {
      return HttpResponse.json({
        success: true,
        token: 'mock-jwt-token-12345',
        user: {
          email: 'admin@aurigraph.io',
          role: 'admin',
          name: 'Admin User',
        },
      });
    }

    return HttpResponse.json(
      {
        success: false,
        error: 'Invalid credentials',
      },
      { status: 401 }
    );
  }),

  // Error scenario - Internal Server Error
  http.get(`${API_BASE_URL}/error/500`, () => {
    return HttpResponse.json(
      {
        error: 'Internal Server Error',
        message: 'Something went wrong',
      },
      { status: 500 }
    );
  }),

  // Error scenario - Not Found
  http.get(`${API_BASE_URL}/error/404`, () => {
    return HttpResponse.json(
      {
        error: 'Not Found',
        message: 'Resource not found',
      },
      { status: 404 }
    );
  }),
];
