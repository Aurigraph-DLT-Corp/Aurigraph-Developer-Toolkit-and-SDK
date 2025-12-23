import http from 'k6/http';
import { check, group, sleep } from 'k6';
import { Rate, Trend, Counter, Gauge } from 'k6/metrics';

/**
 * Aurigraph V12.0.0 - Comprehensive K6 Load Test Suite
 * Targets: dlt.aurigraph.io / https://dlt.aurigraph.io/api/v11
 * Metrics: TPS, latency, success rates, error tracking
 */

// Custom metrics
const errorCount = new Counter('errors');
const successRate = new Rate('success');
const apiLatency = new Trend('api_latency');
const healthCheckLatency = new Trend('health_check_latency');
const tpsGauge = new Gauge('tps');

// Configuration
const BASE_URL = __ENV.BASE_URL || 'https://dlt.aurigraph.io/api/v11';
const INSECURE = __ENV.INSECURE === 'true';

export const options = {
  stages: [
    // Scenario 1: Baseline sanity check (50 VUs for 5 minutes)
    { duration: '1m', target: 50, name: 'Baseline Ramp-Up' },
    { duration: '4m', target: 50, name: 'Baseline Sustained' },

    // Scenario 2: Ramp-up test (100 VUs over 10 minutes)
    { duration: '2m', target: 100, name: 'Ramp-Up Phase 1' },
    { duration: '4m', target: 250, name: 'Ramp-Up Phase 2' },
    { duration: '4m', target: 100, name: 'Ramp-Down' },

    // Scenario 3: Stress test (500 VUs sustained)
    { duration: '1m', target: 500, name: 'Stress Ramp-Up' },
    { duration: '3m', target: 500, name: 'Stress Sustained' },

    // Scenario 4: Spike test (sudden 1000 VUs)
    { duration: '30s', target: 1000, name: 'Spike' },
    { duration: '30s', target: 100, name: 'Recovery' },

    // Cool-down
    { duration: '1m', target: 0, name: 'Cool-down' },
  ],

  thresholds: {
    'http_req_duration': ['p(95)<500', 'p(99)<1000'], // 95% under 500ms, 99% under 1s
    'http_req_failed': ['rate<0.1'], // Less than 10% failure rate
    'success': ['rate>0.9'], // More than 90% success rate
  },
};

export default function () {
  group('Health Checks', () => {
    const healthRes = http.get(`${BASE_URL}/health`, {
      headers: { 'Content-Type': 'application/json' },
      tlsInsecureSkipVerify: INSECURE,
      timeout: '10s',
    });

    healthCheckLatency.add(healthRes.timings.duration);

    const healthCheck = check(healthRes, {
      'Health endpoint returns 200': (r) => r.status === 200,
      'Health response has status field': (r) => {
        const body = r.body;
        return body && body.includes('status');
      },
    });

    if (healthCheck) {
      successRate.add(true);
    } else {
      errorCount.add(1);
      successRate.add(false);
    }
  });

  group('API Endpoints', () => {
    const endpoints = [
      '/health',
      '/info',
      '/performance/metrics',
      '/transactions/stats',
    ];

    endpoints.forEach((endpoint) => {
      const res = http.get(`${BASE_URL}${endpoint}`, {
        headers: { 'Content-Type': 'application/json' },
        tlsInsecureSkipVerify: INSECURE,
        timeout: '10s',
      });

      apiLatency.add(res.timings.duration);

      const success = check(res, {
        [`${endpoint} returns 2xx`]: (r) => r.status >= 200 && r.status < 300,
        [`${endpoint} response time < 1s`]: (r) => r.timings.duration < 1000,
      });

      if (success) {
        successRate.add(true);
      } else {
        errorCount.add(1);
        successRate.add(false);
      }
    });
  });

  // Small delay between iterations
  sleep(0.1);
}

export function handleSummary(data) {
  return {
    '/tmp/k6-v12-summary.json': JSON.stringify(data, null, 2),
    stdout: textSummary(data, { indent: ' ', enableColors: true }),
  };
}

// Text summary helper
function textSummary(data, options) {
  const { indent = '', enableColors = false } = options;

  let summary = '\n=====================================\n';
  summary += 'K6 Load Test Results Summary\n';
  summary += '=====================================\n\n';

  if (data.metrics) {
    summary += 'Key Metrics:\n';
    summary += `${indent}Total Requests: ${data.metrics.http_reqs?.value || 0}\n`;
    summary += `${indent}Failed Requests: ${data.metrics.http_req_failed?.value || 0}\n`;
    summary += `${indent}Success Rate: ${((1 - (data.metrics.http_req_failed?.value || 0)) * 100).toFixed(2)}%\n`;
    summary += `${indent}P95 Latency: ${data.metrics['http_req_duration']?.values?.['p(95)'] || 'N/A'}ms\n`;
    summary += `${indent}P99 Latency: ${data.metrics['http_req_duration']?.values?.['p(99)'] || 'N/A'}ms\n`;
    summary += `${indent}P99.9 Latency: ${data.metrics['http_req_duration']?.values?.['p(99.9)'] || 'N/A'}ms\n`;
  }

  summary += '\n=====================================\n';
  return summary;
}
