/**
 * Aurigraph V11 Load Testing Script
 * Uses k6 for distributed load testing
 *
 * Run with: k6 run k6-load-test.js
 * Options: k6 run --vus 100 --duration 10m k6-load-test.js
 */

import http from 'k6/http';
import { check, group, sleep } from 'k6';
import { Rate, Trend, Counter, Gauge } from 'k6/metrics';

// Configuration
const API_BASE_URL = __ENV.API_BASE_URL || 'http://localhost:9003';
const VUSERS = parseInt(__ENV.VUSERS) || 10;
const DURATION = __ENV.DURATION || '5m';
const RAMP_UP = parseInt(__ENV.RAMP_UP) || 60;

// Custom metrics
const errorRate = new Rate('errors');
const apiDuration = new Trend('api_duration');
const healthCheckDuration = new Trend('health_check_duration');
const blockchainQueryDuration = new Trend('blockchain_query_duration');
const transactionCount = new Counter('transactions_sent');
const activeUsers = new Gauge('active_users');

// Test configuration
export const options = {
  stages: [
    { duration: `${RAMP_UP}s`, target: VUSERS },        // Ramp-up to target
    { duration: DURATION, target: VUSERS },              // Stay at target
    { duration: '30s', target: 0 },                      // Ramp-down
  ],
  thresholds: {
    'http_req_duration': ['p(95)<500'],                  // 95th percentile < 500ms
    'http_req_duration{staticAsset:yes}': ['p(99)<500'], // Static assets < 500ms
    'errors': ['rate<0.1'],                              // Error rate < 10%
  },
};

// Test credentials
const TEST_ADMIN = {
  username: 'admin',
  password: 'admin-secure-password'
};

let authToken = '';

/**
 * Setup: Authenticate once for all VUs
 */
export function setup() {
  const loginRes = http.post(`${API_BASE_URL}/api/v11/login/authenticate`, {
    username: TEST_ADMIN.username,
    password: TEST_ADMIN.password,
  }, {
    headers: { 'Content-Type': 'application/json' },
  });

  check(loginRes, {
    'login successful': (r) => r.status === 200,
    'got token': (r) => r.json('token') !== '',
  });

  return {
    token: loginRes.json('token'),
  };
}

/**
 * Main test function - runs for each VU
 */
export default function (data) {
  authToken = data.token;

  // Update active users metric
  activeUsers.add(1);

  // Group: Health Checks
  group('Health Checks', () => {
    const startTime = new Date();
    const res = http.get(`${API_BASE_URL}/api/v11/health`, {
      headers: { 'Authorization': `Bearer ${authToken}` },
    });
    const duration = new Date() - startTime;

    healthCheckDuration.add(duration);
    errorRate.add(res.status !== 200);
    check(res, {
      'health status 200': (r) => r.status === 200,
      'health status is healthy': (r) => r.json('data.status') === 'healthy',
      'has chain height': (r) => r.json('data.chain_height') > 0,
      'response time < 100ms': (r) => duration < 100,
    });
  });

  sleep(0.5);

  // Group: Blockchain Queries
  group('Blockchain Queries', () => {
    const queries = [
      '/api/v11/blockchain/latest?limit=10',
      '/api/v11/blockchain/stats',
      '/api/v11/blockchain/transactions?page=1&pageSize=20',
    ];

    queries.forEach((endpoint) => {
      const startTime = new Date();
      const res = http.get(`${API_BASE_URL}${endpoint}`, {
        headers: { 'Authorization': `Bearer ${authToken}` },
      });
      const duration = new Date() - startTime;

      blockchainQueryDuration.add(duration);
      errorRate.add(res.status !== 200);
      check(res, {
        [`${endpoint} status 200`]: (r) => r.status === 200,
        [`${endpoint} response time < 500ms`]: (r) => duration < 500,
      });
    });
  });

  sleep(0.5);

  // Group: Consensus & Network Info
  group('Consensus & Network', () => {
    const endpoints = [
      '/api/v11/consensus/status',
      '/api/v11/nodes',
    ];

    endpoints.forEach((endpoint) => {
      const startTime = new Date();
      const res = http.get(`${API_BASE_URL}${endpoint}`, {
        headers: { 'Authorization': `Bearer ${authToken}` },
      });
      const duration = new Date() - startTime;

      apiDuration.add(duration);
      errorRate.add(res.status !== 200);
      check(res, {
        [`${endpoint} status 200`]: (r) => r.status === 200,
        [`${endpoint} response time < 500ms`]: (r) => duration < 500,
      });
    });
  });

  sleep(0.5);

  // Group: Simulated Transactions (if endpoint exists)
  group('Transaction Simulation', () => {
    const res = http.post(`${API_BASE_URL}/api/v11/transactions/submit`, {
      from: 'user1',
      to: 'user2',
      amount: Math.floor(Math.random() * 1000) + 1,
      type: 'transfer',
    }, {
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json',
      },
    });

    if (res.status === 200 || res.status === 202) {
      transactionCount.add(1);
    }

    errorRate.add(res.status < 200 || res.status >= 400);
    check(res, {
      'transaction accepted': (r) => r.status === 200 || r.status === 202,
      'response time < 1s': (r) => r.timings.duration < 1000,
    });
  });

  sleep(1);

  // Reduce active users metric
  activeUsers.add(-1);
}

/**
 * Teardown: Generate summary report
 */
export function teardown(data) {
  console.log('=== Load Test Summary ===');
  console.log(`Total VUs: ${VUSERS}`);
  console.log(`Duration: ${DURATION}`);
  console.log(`Ramp-up: ${RAMP_UP}s`);
}
