/**
 * K6 Load Testing Script - Bridge Transaction Load Testing
 *
 * Purpose: Comprehensive load testing for bridge transaction service with
 *          multi-signature validation, atomic swap scenarios, and transfer history
 *
 * Test Scenarios:
 * 1. Single Transfer Validation (50 VUs, 5 min)
 * 2. Concurrent Multi-Sig Validation (100 VUs, 10 min)
 * 3. Peak Load with Atomic Swaps (250 VUs, 15 min)
 * 4. Stress Test - System Breaking Point (500-1000 VUs, 20 min)
 *
 * Success Criteria:
 * - 99%+ success rate at 100 concurrent users
 * - <1% failure rate at 1000 concurrent users
 * - P95 Latency < 200ms for baseline (50 VUs)
 * - P99 Latency < 400ms for baseline
 * - Error rate < 0.01% for normal load
 * - Error rate < 5% for extreme stress load
 *
 * Run Commands:
 * - Baseline (50 VUs):    k6 run k6-bridge-load-test.js --stage baseline
 * - Standard (100 VUs):   k6 run k6-bridge-load-test.js --stage standard
 * - Peak (250 VUs):       k6 run k6-bridge-load-test.js --stage peak
 * - Stress (1000 VUs):    k6 run k6-bridge-load-test.js --stage stress
 */

import http from 'k6/http';
import { check, group, sleep } from 'k6';
import { Rate, Trend, Counter, Histogram } from 'k6/metrics';
import { randomString, randomIntBetween } from 'https://jslib.k6.io/k6-utils/1.2.0/index.js';

// ============================================================================
// Custom Metrics
// ============================================================================

export const errorRate = new Rate('bridge_error_rate');
export const successRate = new Rate('bridge_success_rate');
export const validationDuration = new Trend('bridge_validation_duration');
export const transferDuration = new Trend('bridge_transfer_duration');
export const swapDuration = new Trend('bridge_swap_duration');
export const requestCount = new Counter('bridge_request_count');
export const successCount = new Counter('bridge_success_count');
export const failureCount = new Counter('bridge_failure_count');
export const validationCount = new Counter('bridge_validation_count');
export const transferCount = new Counter('bridge_transfer_count');
export const swapCount = new Counter('bridge_swap_count');

// Histogram for detailed latency distribution
export const latencyDistribution = new Histogram('bridge_latency_distribution');

// ============================================================================
// Configuration
// ============================================================================

const BASE_URL = __ENV.BASE_URL || 'http://localhost:9003';
const STAGE = __ENV.STAGE || 'baseline';

// Define test stages with progressive load
const stages = {
    baseline: {
        name: 'Baseline Sanity Check',
        vus: 50,
        duration: '300s',
        rampUp: '30s',
        rampDown: '30s'
    },
    standard: {
        name: 'Standard Load Test',
        vus: 100,
        duration: '600s',
        rampUp: '60s',
        rampDown: '60s'
    },
    peak: {
        name: 'Peak Load Test',
        vus: 250,
        duration: '900s',
        rampUp: '120s',
        rampDown: '120s'
    },
    stress: {
        name: 'Stress Test',
        vus: 1000,
        duration: '1200s',
        rampUp: '300s',
        rampDown: '300s'
    }
};

const selectedStage = stages[STAGE] || stages.baseline;

export const options = {
    stages: [
        { duration: selectedStage.rampUp, target: selectedStage.vus },
        { duration: selectedStage.duration, target: selectedStage.vus },
        { duration: selectedStage.rampDown, target: 0 },
    ],
    thresholds: {
        'bridge_validation_duration': ['p(95)<200', 'p(99)<400'],
        'bridge_transfer_duration': ['p(95)<300', 'p(99)<500'],
        'bridge_swap_duration': ['p(95)<400', 'p(99)<800'],
        'bridge_error_rate': ['rate<0.01'],
        'bridge_success_rate': ['rate>0.99'],
    },
};

// ============================================================================
// Test Data Generators
// ============================================================================

/**
 * Generate realistic bridge transaction data
 */
function generateBridgeTransaction() {
    const chains = ['ethereum', 'solana', 'polygon', 'avalanche', 'arbitrum'];
    const sourceChain = chains[Math.floor(Math.random() * chains.length)];
    const targetChain = chains[Math.floor(Math.random() * chains.length)];

    return {
        transactionId: `BRIDGE-${Date.now()}-${randomIntBetween(1000, 9999)}`,
        sourceChain: sourceChain,
        targetChain: targetChain,
        sourceAddress: `0x${randomString(40)}`,
        targetAddress: `0x${randomString(40)}`,
        amount: String(randomIntBetween(1, 1000000) * 1e18), // Wei format
        bridgeFee: String(randomIntBetween(100000, 1000000) * 1e18),
        transactionType: Math.random() > 0.7 ? 'ATOMIC_SWAP' : 'STANDARD_TRANSFER',
    };
}

/**
 * Generate HTLC data for atomic swaps
 */
function generateHTLCData() {
    const secret = randomString(32);
    const hash = secret; // In real scenario, would compute SHA256

    return {
        htlcHash: `0x${hash}`,
        lockTime: Date.now(),
        timeoutAt: Date.now() + (24 * 60 * 60 * 1000), // 24 hours from now
    };
}

/**
 * Generate validator signatures
 */
function generateValidatorSignatures() {
    const validators = [];
    for (let i = 1; i <= 4; i++) {
        validators.push({
            validatorId: `validator-${i}`,
            validatorName: `Validator Node ${i}`,
            signature: `sig_${randomString(40)}`,
            reputationScore: randomIntBetween(80, 100),
        });
    }
    return validators;
}

// ============================================================================
// HTTP Request Helpers
// ============================================================================

/**
 * Common request parameters
 */
function getRequestParams() {
    return {
        headers: {
            'Content-Type': 'application/json',
            'User-Agent': 'k6-bridge-load-test/1.0',
            'X-Request-ID': `bridge-${Date.now()}-${randomIntBetween(1000, 9999)}`,
            'X-Load-Stage': STAGE,
        },
        timeout: '30s',
    };
}

/**
 * Track request metrics
 */
function trackRequestMetrics(res, type, duration) {
    requestCount.add(1);
    latencyDistribution.add(res.timings.duration);

    const isSuccess = res.status >= 200 && res.status < 300;
    const isError = res.status >= 400 || res.status < 200;

    successRate.add(isSuccess);
    errorRate.add(isError);

    if (isSuccess) {
        successCount.add(1);
    } else {
        failureCount.add(1);
    }

    // Track type-specific metrics
    switch (type) {
        case 'validation':
            validationDuration.add(res.timings.duration);
            validationCount.add(1);
            break;
        case 'transfer':
            transferDuration.add(res.timings.duration);
            transferCount.add(1);
            break;
        case 'swap':
            swapDuration.add(res.timings.duration);
            swapCount.add(1);
            break;
    }

    return isSuccess;
}

// ============================================================================
// Test Scenarios
// ============================================================================

/**
 * Scenario 1: Bridge Transaction Validation
 * Tests multi-signature validation with 4/7 quorum
 */
function testBridgeValidation() {
    group('Bridge Transaction Validation', () => {
        const transaction = generateBridgeTransaction();
        const htlcData = generateHTLCData();
        const signatures = generateValidatorSignatures();

        const payload = JSON.stringify({
            transaction: transaction,
            htlcData: htlcData,
            signatures: signatures,
            quorumRequired: 4,
        });

        // Test 1: Initiate validation
        let res = http.post(
            `${BASE_URL}/api/v11/bridge/validate/initiate`,
            payload,
            getRequestParams()
        );

        trackRequestMetrics(res, 'validation');
        const validationCheck = check(res, {
            'Validation initiated': (r) => r.status === 200 || r.status === 201,
            'Response has transaction ID': (r) => r.body && r.body.includes('transactionId'),
            'Validation timestamp present': (r) => r.body && r.body.includes('timestamp'),
        });

        if (!validationCheck) {
            console.error(`Validation initiation failed: ${res.status}`);
        }

        // Small delay between sub-requests
        sleep(0.1);

        // Test 2: Check validation status
        res = http.get(
            `${BASE_URL}/api/v11/bridge/validation/status/${transaction.transactionId}`,
            getRequestParams()
        );

        trackRequestMetrics(res, 'validation');
        check(res, {
            'Status check success': (r) => r.status === 200,
            'Status is one of valid values': (r) => {
                if (r.status !== 200) return true;
                return r.body && (
                    r.body.includes('PENDING') ||
                    r.body.includes('CONFIRMED') ||
                    r.body.includes('FAILED')
                );
            },
        });

        sleep(0.1);
    });
}

/**
 * Scenario 2: Bridge Transfer Execution
 * Tests complete transfer flow with state tracking
 */
function testBridgeTransfer() {
    group('Bridge Transfer Execution', () => {
        const transaction = generateBridgeTransaction();

        const transferPayload = JSON.stringify({
            transactionId: transaction.transactionId,
            sourceChain: transaction.sourceChain,
            targetChain: transaction.targetChain,
            sourceAddress: transaction.sourceAddress,
            targetAddress: transaction.targetAddress,
            amount: transaction.amount,
            bridgeFee: transaction.bridgeFee,
        });

        // Test 1: Submit transfer
        let res = http.post(
            `${BASE_URL}/api/v11/bridge/transfer/submit`,
            transferPayload,
            getRequestParams()
        );

        trackRequestMetrics(res, 'transfer');
        check(res, {
            'Transfer submitted': (r) => r.status === 200 || r.status === 202,
            'Response includes confirmation': (r) => r.body && r.body.includes('confirmation'),
        });

        sleep(0.1);

        // Test 2: Get transfer status
        res = http.get(
            `${BASE_URL}/api/v11/bridge/transfer/${transaction.transactionId}`,
            getRequestParams()
        );

        trackRequestMetrics(res, 'transfer');
        check(res, {
            'Transfer status retrieved': (r) => r.status === 200,
        });

        sleep(0.1);

        // Test 3: Get transfer history
        res = http.get(
            `${BASE_URL}/api/v11/bridge/transfer/history/${transaction.sourceAddress}`,
            getRequestParams()
        );

        trackRequestMetrics(res, 'transfer');
        check(res, {
            'Transfer history retrieved': (r) => r.status === 200,
        });

        sleep(0.1);
    });
}

/**
 * Scenario 3: Atomic Swap (HTLC) Testing
 * Tests Hash Time-Locked Contract lifecycle
 */
function testAtomicSwap() {
    group('Atomic Swap (HTLC) Testing', () => {
        const transaction = generateBridgeTransaction();
        transaction.transactionType = 'ATOMIC_SWAP';
        const htlcData = generateHTLCData();

        const swapPayload = JSON.stringify({
            transaction: transaction,
            htlcData: htlcData,
            initiatorAddress: transaction.sourceAddress,
            participantAddress: transaction.targetAddress,
        });

        // Test 1: Initiate atomic swap
        let res = http.post(
            `${BASE_URL}/api/v11/bridge/swap/initiate`,
            swapPayload,
            getRequestParams()
        );

        trackRequestMetrics(res, 'swap');
        check(res, {
            'Swap initiated': (r) => r.status === 200 || r.status === 201,
            'Swap ID returned': (r) => r.body && r.body.includes('swapId'),
        });

        sleep(0.1);

        // Test 2: Get swap status
        res = http.get(
            `${BASE_URL}/api/v11/bridge/swap/${transaction.transactionId}`,
            getRequestParams()
        );

        trackRequestMetrics(res, 'swap');
        check(res, {
            'Swap status retrieved': (r) => r.status === 200,
        });

        sleep(0.1);

        // Test 3: List active swaps
        res = http.get(
            `${BASE_URL}/api/v11/bridge/swaps/active`,
            getRequestParams()
        );

        trackRequestMetrics(res, 'swap');
        check(res, {
            'Active swaps listed': (r) => r.status === 200,
        });

        sleep(0.1);
    });
}

/**
 * Scenario 4: Validator Network Health
 * Tests validator status and network health endpoints
 */
function testValidatorNetwork() {
    group('Validator Network Health', () => {
        // Test 1: Get validator network stats
        let res = http.get(
            `${BASE_URL}/api/v11/bridge/validators/stats`,
            getRequestParams()
        );

        trackRequestMetrics(res, 'validation');
        check(res, {
            'Validator stats retrieved': (r) => r.status === 200,
            'Stats include active validators': (r) => r.body && r.body.includes('activeValidators'),
            'Stats include quorum': (r) => r.body && r.body.includes('quorum'),
        });

        sleep(0.1);

        // Test 2: Get validator status report
        res = http.get(
            `${BASE_URL}/api/v11/bridge/validators/status`,
            getRequestParams()
        );

        trackRequestMetrics(res, 'validation');
        check(res, {
            'Validator status retrieved': (r) => r.status === 200,
        });

        sleep(0.1);

        // Test 3: Health check
        res = http.get(
            `${BASE_URL}/api/v11/bridge/health`,
            getRequestParams()
        );

        trackRequestMetrics(res, 'validation');
        check(res, {
            'Bridge health check': (r) => r.status === 200,
            'Health is UP': (r) => r.body && r.body.includes('UP'),
        });

        sleep(0.1);
    });
}

// ============================================================================
// Main Test Function
// ============================================================================

export default function () {
    // Distribute load across different test scenarios
    const scenario = Math.random();

    if (scenario < 0.25) {
        testBridgeValidation();
    } else if (scenario < 0.50) {
        testBridgeTransfer();
    } else if (scenario < 0.75) {
        testAtomicSwap();
    } else {
        testValidatorNetwork();
    }

    // Variable think time (0-2 seconds) between iterations
    sleep(Math.random() * 2);
}

// ============================================================================
// Lifecycle Functions
// ============================================================================

export function setup() {
    console.log(`
╔════════════════════════════════════════════════════════════════╗
║        BRIDGE LOAD TEST - ${selectedStage.name}${' '.repeat(Math.max(0, 50 - selectedStage.name.length))}║
╚════════════════════════════════════════════════════════════════╝

Configuration:
  Base URL: ${BASE_URL}
  Stage: ${STAGE}
  VUs: ${selectedStage.vus}
  Duration: ${selectedStage.duration}
  Ramp-up: ${selectedStage.rampUp}
  Ramp-down: ${selectedStage.rampDown}

Expected Metrics:
  Validation P95: < 200ms
  Transfer P95: < 300ms
  Swap P95: < 400ms
  Error Rate: < 0.01% (baseline) or < 5% (stress)
  Success Rate: > 99% (baseline) or > 95% (stress)
    `);
}

export function teardown(data) {
    console.log(`
╔════════════════════════════════════════════════════════════════╗
║                     TEST COMPLETE
╚════════════════════════════════════════════════════════════════╝

Summary Statistics:
  Total Requests: ${requestCount.value}
  Successful: ${successCount.value}
  Failed: ${failureCount.value}
  Success Rate: ${((successCount.value / requestCount.value) * 100).toFixed(2)}%

Request Breakdown:
  Validations: ${validationCount.value}
  Transfers: ${transferCount.value}
  Swaps: ${swapCount.value}

Performance Summary:
  Validation Avg: ${validationDuration.value.toFixed(2)}ms
  Transfer Avg: ${transferDuration.value.toFixed(2)}ms
  Swap Avg: ${swapDuration.value.toFixed(2)}ms
  Error Rate: ${(errorRate.value * 100).toFixed(4)}%

Test Duration: ${selectedStage.rampUp} + ${selectedStage.duration} + ${selectedStage.rampDown}
    `);
}
