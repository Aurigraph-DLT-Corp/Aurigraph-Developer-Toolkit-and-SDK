#!/usr/bin/env node

/**
 * Aurigraph Local Deployment Validation Suite
 * Tests all endpoints and functionality for the local deployment
 */

const axios = require('axios');
const fs = require('fs');
const path = require('path');

// Configuration
const CONFIG = {
    DOMAIN: process.env.DOMAIN || 'aurigraphdlt.dev4.aurex.in',
    V10_PORT: process.env.V10_PORT || '4004',
    V11_PORT: process.env.V11_PORT || '9003', 
    MANAGEMENT_PORT: process.env.MANAGEMENT_PORT || '3040',
    NGINX_PORT: process.env.NGINX_PORT || '8080',
    TIMEOUT: 10000,
    RETRY_COUNT: 3,
    RETRY_DELAY: 2000
};

// Test results
let results = {
    timestamp: new Date().toISOString(),
    config: CONFIG,
    tests: [],
    summary: {
        total: 0,
        passed: 0,
        failed: 0,
        warnings: 0
    }
};

// Logging utilities
const colors = {
    reset: '\x1b[0m',
    bright: '\x1b[1m',
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    magenta: '\x1b[35m',
    cyan: '\x1b[36m'
};

function log(message, color = colors.reset) {
    console.log(`${color}${message}${colors.reset}`);
}

function logSuccess(message) {
    log(`✅ ${message}`, colors.green);
}

function logError(message) {
    log(`❌ ${message}`, colors.red);
}

function logWarning(message) {
    log(`⚠️  ${message}`, colors.yellow);
}

function logInfo(message) {
    log(`ℹ️  ${message}`, colors.blue);
}

// HTTP client with retries
async function httpRequest(config, retryCount = CONFIG.RETRY_COUNT) {
    for (let attempt = 1; attempt <= retryCount; attempt++) {
        try {
            const response = await axios({
                ...config,
                timeout: CONFIG.TIMEOUT,
                validateStatus: () => true // Don't throw on HTTP error codes
            });
            return response;
        } catch (error) {
            if (attempt === retryCount) {
                throw error;
            }
            log(`   Attempt ${attempt} failed, retrying in ${CONFIG.RETRY_DELAY}ms...`, colors.yellow);
            await sleep(CONFIG.RETRY_DELAY);
        }
    }
}

// Utility functions
function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

function addTestResult(testName, passed, details, responseTime = null, warning = null) {
    const result = {
        name: testName,
        passed,
        details,
        responseTime,
        warning,
        timestamp: new Date().toISOString()
    };
    
    results.tests.push(result);
    results.summary.total++;
    
    if (passed) {
        results.summary.passed++;
        logSuccess(`${testName} - ${details} ${responseTime ? `(${responseTime}ms)` : ''}`);
    } else {
        results.summary.failed++;
        logError(`${testName} - ${details}`);
    }
    
    if (warning) {
        results.summary.warnings++;
        logWarning(`   Warning: ${warning}`);
    }
}

// Test categories
class ServiceTests {
    static async testV10Service() {
        log('\n🔵 Testing V10 Service...', colors.blue);
        
        // Health check
        try {
            const startTime = Date.now();
            const response = await httpRequest({
                method: 'GET',
                url: `http://localhost:${CONFIG.V10_PORT}/health`
            });
            const responseTime = Date.now() - startTime;
            
            if (response.status === 200 && response.data.status === 'healthy') {
                addTestResult('V10 Health Check', true, 'Service is healthy', responseTime);
            } else {
                addTestResult('V10 Health Check', false, `Unexpected response: ${response.status}`);
            }
        } catch (error) {
            addTestResult('V10 Health Check', false, `Connection failed: ${error.message}`);
        }
        
        // API Info
        try {
            const startTime = Date.now();
            const response = await httpRequest({
                method: 'GET',
                url: `http://localhost:${CONFIG.V10_PORT}/api/v10/info`
            });
            const responseTime = Date.now() - startTime;
            
            if (response.status === 200 && response.data.platform) {
                addTestResult('V10 API Info', true, `Platform: ${response.data.platform}`, responseTime);
            } else {
                addTestResult('V10 API Info', false, `Invalid response: ${response.status}`);
            }
        } catch (error) {
            addTestResult('V10 API Info', false, `Request failed: ${error.message}`);
        }
        
        // Stats endpoint
        try {
            const startTime = Date.now();
            const response = await httpRequest({
                method: 'GET',
                url: `http://localhost:${CONFIG.V10_PORT}/api/v10/stats`
            });
            const responseTime = Date.now() - startTime;
            
            if (response.status === 200 && response.data.transactions) {
                const tps = response.data.transactions.tps || 0;
                addTestResult('V10 Stats', true, `Current TPS: ${tps.toLocaleString()}`, responseTime);
            } else {
                addTestResult('V10 Stats', false, `Invalid stats response: ${response.status}`);
            }
        } catch (error) {
            addTestResult('V10 Stats', false, `Stats request failed: ${error.message}`);
        }
        
        // Consensus endpoint
        try {
            const response = await httpRequest({
                method: 'GET',
                url: `http://localhost:${CONFIG.V10_PORT}/api/v10/consensus`
            });
            
            if (response.status === 200 && response.data.algorithm) {
                addTestResult('V10 Consensus', true, `Algorithm: ${response.data.algorithm}`);
            } else {
                addTestResult('V10 Consensus', false, `Consensus check failed: ${response.status}`);
            }
        } catch (error) {
            addTestResult('V10 Consensus', false, `Consensus request failed: ${error.message}`);
        }
        
        // Bridge status
        try {
            const response = await httpRequest({
                method: 'GET',
                url: `http://localhost:${CONFIG.V10_PORT}/api/v10/bridge/status`
            });
            
            if (response.status === 200 && response.data.bridges) {
                const bridgeCount = response.data.bridges.length;
                addTestResult('V10 Bridge Status', true, `${bridgeCount} bridges active`);
            } else {
                addTestResult('V10 Bridge Status', false, `Bridge status failed: ${response.status}`);
            }
        } catch (error) {
            addTestResult('V10 Bridge Status', false, `Bridge request failed: ${error.message}`);
        }
        
        // Transaction submission test
        try {
            const response = await httpRequest({
                method: 'POST',
                url: `http://localhost:${CONFIG.V10_PORT}/api/v10/transactions`,
                data: {
                    from: 'test_from',
                    to: 'test_to',
                    amount: 100,
                    currency: 'AUR'
                }
            });
            
            if (response.status === 200 && response.data.transaction_id) {
                addTestResult('V10 Transaction Submit', true, `TX ID: ${response.data.transaction_id.substr(0, 20)}...`);
            } else {
                addTestResult('V10 Transaction Submit', false, `Transaction failed: ${response.status}`);
            }
        } catch (error) {
            addTestResult('V10 Transaction Submit', false, `Transaction request failed: ${error.message}`);
        }
    }
    
    static async testV11Service() {
        log('\n⚡ Testing V11 Service...', colors.cyan);
        
        // Health check
        try {
            const startTime = Date.now();
            const response = await httpRequest({
                method: 'GET',
                url: `http://localhost:${CONFIG.V11_PORT}/api/v11/health`
            });
            const responseTime = Date.now() - startTime;
            
            if (response.status === 200 && response.data.status === 'healthy') {
                addTestResult('V11 Health Check', true, 'Service is healthy', responseTime);
            } else {
                addTestResult('V11 Health Check', false, `Unexpected response: ${response.status}`);
            }
        } catch (error) {
            addTestResult('V11 Health Check', false, `Connection failed: ${error.message}`);
        }
        
        // API Info
        try {
            const response = await httpRequest({
                method: 'GET',
                url: `http://localhost:${CONFIG.V11_PORT}/api/v11/info`
            });
            
            if (response.status === 200 && response.data.platform) {
                const framework = response.data.framework || 'Unknown';
                addTestResult('V11 API Info', true, `Framework: ${framework}`);
            } else {
                addTestResult('V11 API Info', false, `Invalid response: ${response.status}`);
            }
        } catch (error) {
            addTestResult('V11 API Info', false, `Request failed: ${error.message}`);
        }
        
        // Performance endpoint
        try {
            const startTime = Date.now();
            const response = await httpRequest({
                method: 'GET',
                url: `http://localhost:${CONFIG.V11_PORT}/api/v11/performance`
            });
            const responseTime = Date.now() - startTime;
            
            if (response.status === 200 && response.data.current_tps) {
                const currentTPS = response.data.current_tps;
                const targetTPS = response.data.target_tps || 2000000;
                const progress = ((currentTPS / targetTPS) * 100).toFixed(1);
                addTestResult('V11 Performance', true, `${currentTPS.toLocaleString()} TPS (${progress}% of target)`, responseTime);
            } else {
                addTestResult('V11 Performance', false, `Performance check failed: ${response.status}`);
            }
        } catch (error) {
            addTestResult('V11 Performance', false, `Performance request failed: ${error.message}`);
        }
        
        // Stats endpoint
        try {
            const response = await httpRequest({
                method: 'GET',
                url: `http://localhost:${CONFIG.V11_PORT}/api/v11/stats`
            });
            
            if (response.status === 200 && response.data.transactions) {
                const virtualThreads = response.data.network?.virtual_threads || 'N/A';
                addTestResult('V11 Stats', true, `Virtual Threads: ${virtualThreads}`);
            } else {
                addTestResult('V11 Stats', false, `Stats check failed: ${response.status}`);
            }
        } catch (error) {
            addTestResult('V11 Stats', false, `Stats request failed: ${error.message}`);
        }
        
        // Quarkus health endpoint
        try {
            const response = await httpRequest({
                method: 'GET',
                url: `http://localhost:${CONFIG.V11_PORT}/q/health`
            });
            
            if (response.status === 200 && response.data.status === 'UP') {
                addTestResult('V11 Quarkus Health', true, 'Quarkus health checks passed');
            } else {
                addTestResult('V11 Quarkus Health', false, `Quarkus health failed: ${response.status}`);
            }
        } catch (error) {
            addTestResult('V11 Quarkus Health', false, `Quarkus health request failed: ${error.message}`);
        }
        
        // Metrics endpoint
        try {
            const response = await httpRequest({
                method: 'GET',
                url: `http://localhost:${CONFIG.V11_PORT}/q/metrics`
            });
            
            if (response.status === 200 && response.data.includes('aurigraph_tps')) {
                addTestResult('V11 Metrics', true, 'Prometheus metrics available');
            } else {
                addTestResult('V11 Metrics', false, `Metrics check failed: ${response.status}`);
            }
        } catch (error) {
            addTestResult('V11 Metrics', false, `Metrics request failed: ${error.message}`);
        }
    }
    
    static async testManagementDashboard() {
        log('\n📊 Testing Management Dashboard...', colors.magenta);
        
        // Health check
        try {
            const response = await httpRequest({
                method: 'GET',
                url: `http://localhost:${CONFIG.MANAGEMENT_PORT}/health`
            });
            
            if (response.status === 200 && response.data.status === 'healthy') {
                addTestResult('Management Health', true, 'Dashboard is healthy');
            } else {
                addTestResult('Management Health', false, `Unexpected response: ${response.status}`);
            }
        } catch (error) {
            addTestResult('Management Health', false, `Connection failed: ${error.message}`);
        }
        
        // Dashboard UI
        try {
            const response = await httpRequest({
                method: 'GET',
                url: `http://localhost:${CONFIG.MANAGEMENT_PORT}/`
            });
            
            if (response.status === 200 && response.data.includes('Management Dashboard')) {
                addTestResult('Management UI', true, 'Dashboard UI loads correctly');
            } else {
                addTestResult('Management UI', false, `UI check failed: ${response.status}`);
            }
        } catch (error) {
            addTestResult('Management UI', false, `UI request failed: ${error.message}`);
        }
        
        // Status API
        try {
            const response = await httpRequest({
                method: 'GET',
                url: `http://localhost:${CONFIG.MANAGEMENT_PORT}/api/status`
            });
            
            if (response.status === 200 && response.data.services) {
                const services = Object.keys(response.data.services).length;
                addTestResult('Management Status API', true, `Monitoring ${services} services`);
            } else {
                addTestResult('Management Status API', false, `Status API failed: ${response.status}`);
            }
        } catch (error) {
            addTestResult('Management Status API', false, `Status API request failed: ${error.message}`);
        }
    }
}

class PerformanceTests {
    static async testResponseTimes() {
        log('\n🚀 Testing Performance...', colors.yellow);
        
        // Test multiple concurrent requests
        const endpoints = [
            { name: 'V10 Health', url: `http://localhost:${CONFIG.V10_PORT}/health` },
            { name: 'V11 Health', url: `http://localhost:${CONFIG.V11_PORT}/api/v11/health` },
            { name: 'V10 Stats', url: `http://localhost:${CONFIG.V10_PORT}/api/v10/stats` },
            { name: 'V11 Performance', url: `http://localhost:${CONFIG.V11_PORT}/api/v11/performance` }
        ];
        
        for (const endpoint of endpoints) {
            try {
                const startTime = Date.now();
                const response = await httpRequest({
                    method: 'GET',
                    url: endpoint.url,
                    timeout: 5000
                });
                const responseTime = Date.now() - startTime;
                
                if (response.status === 200) {
                    const warning = responseTime > 1000 ? `Slow response time: ${responseTime}ms` : null;
                    addTestResult(`Performance ${endpoint.name}`, true, `${responseTime}ms response time`, responseTime, warning);
                } else {
                    addTestResult(`Performance ${endpoint.name}`, false, `HTTP ${response.status}`);
                }
            } catch (error) {
                addTestResult(`Performance ${endpoint.name}`, false, `Request failed: ${error.message}`);
            }
        }
        
        // Concurrent load test
        try {
            log('   Running concurrent load test (10 requests)...', colors.blue);
            const concurrentRequests = Array(10).fill().map(() => 
                httpRequest({
                    method: 'GET',
                    url: `http://localhost:${CONFIG.V10_PORT}/api/v10/stats`,
                    timeout: 10000
                })
            );
            
            const startTime = Date.now();
            const responses = await Promise.allSettled(concurrentRequests);
            const totalTime = Date.now() - startTime;
            
            const successful = responses.filter(r => r.status === 'fulfilled' && r.value.status === 200).length;
            addTestResult('Concurrent Load Test', successful >= 8, `${successful}/10 requests successful in ${totalTime}ms`, totalTime);
        } catch (error) {
            addTestResult('Concurrent Load Test', false, `Load test failed: ${error.message}`);
        }
    }
}

class IntegrationTests {
    static async testDomainConfiguration() {
        log('\n🌐 Testing Domain Configuration...', colors.green);
        
        // Test if nginx is available and configured
        if (CONFIG.NGINX_PORT !== '8080') {
            addTestResult('Domain Config Check', false, 'Nginx port not set to 8080', null, 'Check nginx configuration');
            return;
        }
        
        // Try to test nginx endpoints (these may fail if nginx is not running)
        const nginxEndpoints = [
            { path: '/dashboard/', description: 'Dashboard proxy' },
            { path: '/api/v10/info', description: 'V10 API proxy' },
            { path: '/api/v11/health', description: 'V11 API proxy' },
            { path: '/status', description: 'Status proxy' }
        ];
        
        for (const endpoint of nginxEndpoints) {
            try {
                const response = await httpRequest({
                    method: 'GET',
                    url: `http://localhost:${CONFIG.NGINX_PORT}${endpoint.path}`,
                    timeout: 5000
                });
                
                if (response.status === 200) {
                    addTestResult(`Nginx ${endpoint.description}`, true, 'Proxy working correctly');
                } else {
                    addTestResult(`Nginx ${endpoint.description}`, false, `Proxy returned ${response.status}`, null, 
                        'Nginx may not be running - direct service access still works');
                }
            } catch (error) {
                addTestResult(`Nginx ${endpoint.description}`, false, `Proxy test failed: ${error.message}`, null,
                    'Nginx proxy not available - services accessible directly');
            }
        }
    }
    
    static async testCrossServiceCommunication() {
        log('\n🔄 Testing Cross-Service Communication...', colors.cyan);
        
        // Test management dashboard's ability to fetch from other services
        try {
            const response = await httpRequest({
                method: 'GET',
                url: `http://localhost:${CONFIG.MANAGEMENT_PORT}/api/status`
            });
            
            if (response.status === 200 && response.data.services) {
                const v10Status = response.data.services.v10?.status;
                const v11Status = response.data.services.v11?.status;
                
                if (v10Status === 'healthy' && v11Status === 'healthy') {
                    addTestResult('Cross-Service Communication', true, 'All services communicating properly');
                } else {
                    addTestResult('Cross-Service Communication', false, 
                        `Service status: V10=${v10Status}, V11=${v11Status}`);
                }
            } else {
                addTestResult('Cross-Service Communication', false, `Status check failed: ${response.status}`);
            }
        } catch (error) {
            addTestResult('Cross-Service Communication', false, `Communication test failed: ${error.message}`);
        }
    }
}

// Report generation
function generateReport() {
    const reportPath = path.join(__dirname, 'logs', `validation-report-${Date.now()}.json`);
    const htmlReportPath = path.join(__dirname, 'logs', `validation-report-${Date.now()}.html`);
    
    // Ensure logs directory exists
    const logsDir = path.join(__dirname, 'logs');
    if (!fs.existsSync(logsDir)) {
        fs.mkdirSync(logsDir, { recursive: true });
    }
    
    // Save JSON report
    fs.writeFileSync(reportPath, JSON.stringify(results, null, 2));
    
    // Generate HTML report
    const htmlReport = generateHtmlReport();
    fs.writeFileSync(htmlReportPath, htmlReport);
    
    log(`\n📄 Reports generated:`, colors.bright);
    log(`   JSON: ${reportPath}`, colors.blue);
    log(`   HTML: ${htmlReportPath}`, colors.blue);
}

function generateHtmlReport() {
    const { total, passed, failed, warnings } = results.summary;
    const successRate = total > 0 ? ((passed / total) * 100).toFixed(1) : 0;
    
    return `
<!DOCTYPE html>
<html>
<head>
    <title>Aurigraph Local Deployment Validation Report</title>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #1a1a1a; color: #fff; line-height: 1.6; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 2rem; text-align: center; }
        .header h1 { font-size: 2.5rem; margin-bottom: 0.5rem; }
        .header p { opacity: 0.9; font-size: 1.1rem; }
        .summary { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem; padding: 2rem; max-width: 1000px; margin: 0 auto; }
        .summary-card { background: #2d2d2d; border-radius: 12px; padding: 1.5rem; text-align: center; }
        .summary-card h3 { font-size: 2rem; margin-bottom: 0.5rem; }
        .success-rate { color: ${successRate >= 90 ? '#4ade80' : successRate >= 70 ? '#fbbf24' : '#ef4444'}; }
        .tests { max-width: 1200px; margin: 0 auto; padding: 0 2rem 2rem; }
        .test-group { margin-bottom: 2rem; }
        .test-group h2 { color: #667eea; margin-bottom: 1rem; font-size: 1.5rem; }
        .test { background: #2d2d2d; border-radius: 8px; padding: 1rem; margin-bottom: 0.5rem; display: flex; justify-content: space-between; align-items: center; }
        .test-passed { border-left: 4px solid #4ade80; }
        .test-failed { border-left: 4px solid #ef4444; }
        .test-warning { border-left: 4px solid #fbbf24; }
        .test-name { font-weight: bold; }
        .test-details { color: #ccc; font-size: 0.9rem; }
        .test-time { color: #888; font-size: 0.8rem; }
        .config { background: #2d2d2d; border-radius: 12px; padding: 1.5rem; margin: 2rem auto; max-width: 800px; }
        .config h3 { color: #667eea; margin-bottom: 1rem; }
        .config-item { display: flex; justify-content: space-between; margin-bottom: 0.5rem; }
        .footer { text-align: center; padding: 2rem; color: #666; }
    </style>
</head>
<body>
    <div class="header">
        <h1>🧪 Validation Report</h1>
        <p>Aurigraph Local Deployment - ${results.timestamp}</p>
    </div>
    
    <div class="summary">
        <div class="summary-card">
            <h3 class="success-rate">${successRate}%</h3>
            <p>Success Rate</p>
        </div>
        <div class="summary-card">
            <h3 style="color: #4ade80;">${passed}</h3>
            <p>Passed</p>
        </div>
        <div class="summary-card">
            <h3 style="color: #ef4444;">${failed}</h3>
            <p>Failed</p>
        </div>
        <div class="summary-card">
            <h3 style="color: #fbbf24;">${warnings}</h3>
            <p>Warnings</p>
        </div>
    </div>
    
    <div class="config">
        <h3>📋 Configuration</h3>
        <div class="config-item"><span>Domain:</span><span>${results.config.DOMAIN}</span></div>
        <div class="config-item"><span>V10 Port:</span><span>${results.config.V10_PORT}</span></div>
        <div class="config-item"><span>V11 Port:</span><span>${results.config.V11_PORT}</span></div>
        <div class="config-item"><span>Management Port:</span><span>${results.config.MANAGEMENT_PORT}</span></div>
        <div class="config-item"><span>Nginx Port:</span><span>${results.config.NGINX_PORT}</span></div>
    </div>
    
    <div class="tests">
        ${generateTestGroupsHtml()}
    </div>
    
    <div class="footer">
        <p>Generated at ${new Date().toLocaleString()}</p>
        <p>Total test duration: ${calculateTotalDuration()}ms</p>
    </div>
</body>
</html>`;
}

function generateTestGroupsHtml() {
    const groups = {};
    
    // Group tests by category
    results.tests.forEach(test => {
        const category = test.name.split(' ')[0];
        if (!groups[category]) {
            groups[category] = [];
        }
        groups[category].push(test);
    });
    
    return Object.entries(groups).map(([category, tests]) => {
        const testHtml = tests.map(test => {
            const statusClass = test.passed ? 'test-passed' : 'test-failed';
            const warningClass = test.warning ? 'test-warning' : '';
            const icon = test.passed ? '✅' : '❌';
            const timeInfo = test.responseTime ? ` (${test.responseTime}ms)` : '';
            
            return `
                <div class="test ${statusClass} ${warningClass}">
                    <div>
                        <div class="test-name">${icon} ${test.name}</div>
                        <div class="test-details">${test.details}${timeInfo}</div>
                        ${test.warning ? `<div class="test-details" style="color: #fbbf24;">⚠️ ${test.warning}</div>` : ''}
                    </div>
                    <div class="test-time">${new Date(test.timestamp).toLocaleTimeString()}</div>
                </div>
            `;
        }).join('');
        
        return `
            <div class="test-group">
                <h2>${category} Tests</h2>
                ${testHtml}
            </div>
        `;
    }).join('');
}

function calculateTotalDuration() {
    if (results.tests.length < 2) return 0;
    const firstTest = new Date(results.tests[0].timestamp);
    const lastTest = new Date(results.tests[results.tests.length - 1].timestamp);
    return lastTest - firstTest;
}

// Main execution
async function runValidation() {
    log('🧪 Starting Aurigraph Local Deployment Validation', colors.bright);
    log(`📍 Domain: ${CONFIG.DOMAIN}`, colors.blue);
    log(`🔧 Configuration: V10:${CONFIG.V10_PORT}, V11:${CONFIG.V11_PORT}, Mgmt:${CONFIG.MANAGEMENT_PORT}`, colors.blue);
    log('', colors.reset);
    
    try {
        // Run all test categories
        await ServiceTests.testV10Service();
        await ServiceTests.testV11Service();
        await ServiceTests.testManagementDashboard();
        await PerformanceTests.testResponseTimes();
        await IntegrationTests.testDomainConfiguration();
        await IntegrationTests.testCrossServiceCommunication();
        
        // Generate summary
        log('\n📊 Validation Summary', colors.bright);
        log(`✅ Passed: ${results.summary.passed}`, colors.green);
        log(`❌ Failed: ${results.summary.failed}`, colors.red);
        log(`⚠️  Warnings: ${results.summary.warnings}`, colors.yellow);
        log(`📊 Total: ${results.summary.total}`, colors.blue);
        
        const successRate = (results.summary.passed / results.summary.total * 100).toFixed(1);
        log(`🎯 Success Rate: ${successRate}%`, successRate >= 90 ? colors.green : successRate >= 70 ? colors.yellow : colors.red);
        
        // Generate reports
        generateReport();
        
        // Exit with appropriate code
        process.exit(results.summary.failed > 0 ? 1 : 0);
        
    } catch (error) {
        logError(`Validation failed with error: ${error.message}`);
        process.exit(1);
    }
}

// Run if called directly
if (require.main === module) {
    runValidation().catch(error => {
        console.error('Validation script error:', error);
        process.exit(1);
    });
}

module.exports = { runValidation, CONFIG };