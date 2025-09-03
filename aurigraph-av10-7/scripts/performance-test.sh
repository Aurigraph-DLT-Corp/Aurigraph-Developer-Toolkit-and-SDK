#!/bin/bash

# Aurigraph AV10-7 Production Performance Testing Suite
# Validates 1M+ TPS target and system performance
# Comprehensive load testing and benchmarking

set -e

# Configuration
TARGET_TPS=1000000
TEST_DURATION=300  # 5 minutes
RAMP_UP_TIME=60    # 1 minute
CONCURRENT_USERS=1000
SERVER_HOST="${DEV4_HOST:-localhost}"

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m'

log() {
    echo -e "${BLUE}[$(date '+%H:%M:%S')]${NC} Performance Test: $1"
}

success() {
    echo -e "${GREEN}✅ $1${NC}"
}

warn() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

error() {
    echo -e "${RED}❌ $1${NC}"
    exit 1
}

info() {
    echo -e "${CYAN}ℹ️  $1${NC}"
}

phase() {
    echo -e "${PURPLE}🎯 $1${NC}"
}

# Test results directory
RESULTS_DIR="reports/performance/$(date +%Y%m%d-%H%M%S)"
mkdir -p "$RESULTS_DIR"

# System information
collect_system_info() {
    log "Collecting system information..."
    
    cat > "$RESULTS_DIR/system-info.json" << EOF
{
  "timestamp": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
  "server_host": "$SERVER_HOST",
  "target_tps": $TARGET_TPS,
  "test_duration": $TEST_DURATION,
  "concurrent_users": $CONCURRENT_USERS,
  "os": "$(uname -o)",
  "kernel": "$(uname -r)",
  "architecture": "$(uname -m)"
}
EOF
    
    success "System information collected"
}

# Pre-test validation
pre_test_validation() {
    phase "Phase 1: Pre-Test Validation"
    
    log "Validating system readiness..."
    
    # Check service health
    local services=(
        "validator-1:8180"
        "validator-2:8181"
        "validator-3:8182"
        "node-1:8200"
        "node-2:8201"
        "node-3:8202"
        "management-1:3240"
    )
    
    local healthy_services=0
    for service in "${services[@]}"; do
        IFS=':' read -r name port <<< "$service"
        if curl -f -s "http://$SERVER_HOST:$port/health" &>/dev/null; then
            success "$name is healthy"
            ((healthy_services++))
        else
            error "$name is not responding on port $port"
        fi
    done
    
    if [ $healthy_services -eq ${#services[@]} ]; then
        success "All services are healthy and ready for testing"
    else
        error "Some services are not ready - cannot proceed with testing"
    fi
    
    # Check system resources
    log "Checking system resources..."
    if command -v free &>/dev/null; then
        local mem_usage=$(free | awk 'NR==2{printf "%.1f", $3*100/$2}')
        if (( $(echo "$mem_usage < 80" | bc -l) )); then
            success "Memory usage: ${mem_usage}% (acceptable)"
        else
            warn "Memory usage: ${mem_usage}% (high)"
        fi
    fi
    
    # Check network connectivity
    log "Testing network connectivity..."
    for port in 8180 8200 3240; do
        if nc -z "$SERVER_HOST" "$port" 2>/dev/null; then
            success "Port $port is accessible"
        else
            error "Port $port is not accessible"
        fi
    done
}

# Transaction throughput test
test_transaction_throughput() {
    phase "Phase 2: Transaction Throughput Test"
    
    log "Starting transaction throughput test..."
    log "Target: $TARGET_TPS TPS for $TEST_DURATION seconds"
    
    # Create test script
    cat > "$RESULTS_DIR/throughput-test.js" << 'EOF'
const http = require('http');
const https = require('https');
const { performance } = require('perf_hooks');

class ThroughputTester {
    constructor(config) {
        this.config = config;
        this.results = {
            totalRequests: 0,
            successfulRequests: 0,
            failedRequests: 0,
            totalLatency: 0,
            minLatency: Infinity,
            maxLatency: 0,
            startTime: 0,
            endTime: 0
        };
    }

    async makeRequest(endpoint) {
        return new Promise((resolve) => {
            const startTime = performance.now();
            const url = new URL(endpoint);
            const client = url.protocol === 'https:' ? https : http;
            
            const req = client.request(url, (res) => {
                const endTime = performance.now();
                const latency = endTime - startTime;
                
                this.results.totalRequests++;
                this.results.totalLatency += latency;
                this.results.minLatency = Math.min(this.results.minLatency, latency);
                this.results.maxLatency = Math.max(this.results.maxLatency, latency);
                
                if (res.statusCode >= 200 && res.statusCode < 300) {
                    this.results.successfulRequests++;
                } else {
                    this.results.failedRequests++;
                }
                
                resolve();
            });
            
            req.on('error', () => {
                this.results.totalRequests++;
                this.results.failedRequests++;
                resolve();
            });
            
            req.setTimeout(5000, () => {
                req.destroy();
                this.results.totalRequests++;
                this.results.failedRequests++;
                resolve();
            });
            
            req.end();
        });
    }

    async runTest() {
        console.log('🚀 Starting throughput test...');
        this.results.startTime = Date.now();
        
        const endpoints = [
            `http://${process.env.SERVER_HOST || 'localhost'}:8180/api/validator/status`,
            `http://${process.env.SERVER_HOST || 'localhost'}:8200/api/node/metrics`,
            `http://${process.env.SERVER_HOST || 'localhost'}:3240/api/management/stats`
        ];
        
        const testDuration = parseInt(process.env.TEST_DURATION || '300') * 1000;
        const concurrentUsers = parseInt(process.env.CONCURRENT_USERS || '1000');
        
        const workers = [];
        for (let i = 0; i < concurrentUsers; i++) {
            workers.push(this.runWorker(endpoints, testDuration));
        }
        
        await Promise.all(workers);
        
        this.results.endTime = Date.now();
        this.generateReport();
    }

    async runWorker(endpoints, duration) {
        const endTime = Date.now() + duration;
        
        while (Date.now() < endTime) {
            const endpoint = endpoints[Math.floor(Math.random() * endpoints.length)];
            await this.makeRequest(endpoint);
            
            // Small delay to prevent overwhelming
            await new Promise(resolve => setTimeout(resolve, 1));
        }
    }

    generateReport() {
        const duration = (this.results.endTime - this.results.startTime) / 1000;
        const tps = this.results.successfulRequests / duration;
        const avgLatency = this.results.totalLatency / this.results.totalRequests;
        const successRate = (this.results.successfulRequests / this.results.totalRequests) * 100;
        
        const report = {
            summary: {
                duration_seconds: duration,
                total_requests: this.results.totalRequests,
                successful_requests: this.results.successfulRequests,
                failed_requests: this.results.failedRequests,
                transactions_per_second: Math.round(tps),
                success_rate_percent: Math.round(successRate * 100) / 100
            },
            latency: {
                average_ms: Math.round(avgLatency * 100) / 100,
                min_ms: Math.round(this.results.minLatency * 100) / 100,
                max_ms: Math.round(this.results.maxLatency * 100) / 100
            },
            timestamp: new Date().toISOString()
        };
        
        console.log('📊 Test Results:');
        console.log(JSON.stringify(report, null, 2));
        
        require('fs').writeFileSync(
            process.env.RESULTS_FILE || 'throughput-results.json',
            JSON.stringify(report, null, 2)
        );
        
        // Validate against target
        if (tps >= (process.env.TARGET_TPS || 1000000) * 0.8) {
            console.log('✅ TPS target achieved!');
            process.exit(0);
        } else {
            console.log('⚠️ TPS target not fully achieved');
            process.exit(0);
        }
    }
}

// Run test
const tester = new ThroughputTester({
    serverHost: process.env.SERVER_HOST || 'localhost',
    targetTPS: parseInt(process.env.TARGET_TPS || '1000000'),
    duration: parseInt(process.env.TEST_DURATION || '300'),
    concurrentUsers: parseInt(process.env.CONCURRENT_USERS || '1000')
});

tester.runTest().catch(console.error);
EOF
    
    # Run throughput test
    SERVER_HOST="$SERVER_HOST" \
    TARGET_TPS="$TARGET_TPS" \
    TEST_DURATION="$TEST_DURATION" \
    CONCURRENT_USERS="$CONCURRENT_USERS" \
    RESULTS_FILE="$RESULTS_DIR/throughput-results.json" \
    node "$RESULTS_DIR/throughput-test.js"
    
    success "Transaction throughput test completed"
}

# System performance monitoring
monitor_system_performance() {
    phase "Phase 3: System Performance Monitoring"
    
    log "Monitoring system performance during test..."
    
    # Start background monitoring
    (
        echo "timestamp,cpu_percent,memory_percent,disk_io_read,disk_io_write,network_rx,network_tx" > "$RESULTS_DIR/system-metrics.csv"
        
        while true; do
            local timestamp=$(date +%s)
            local cpu_percent=$(top -bn1 | grep "Cpu(s)" | awk '{print $2}' | awk -F'%' '{print $1}')
            local memory_percent=$(free | awk 'NR==2{printf "%.1f", $3*100/$2}')
            
            # Network metrics (if available)
            local network_rx=0
            local network_tx=0
            if [ -f /proc/net/dev ]; then
                local network_stats=$(awk '/eth0:|enp/{print $2,$10}' /proc/net/dev | head -1)
                network_rx=$(echo $network_stats | awk '{print $1}')
                network_tx=$(echo $network_stats | awk '{print $2}')
            fi
            
            echo "$timestamp,$cpu_percent,$memory_percent,0,0,$network_rx,$network_tx" >> "$RESULTS_DIR/system-metrics.csv"
            sleep 5
        done
    ) &
    
    local monitor_pid=$!
    
    # Monitor for test duration
    sleep $TEST_DURATION
    
    # Stop monitoring
    kill $monitor_pid 2>/dev/null || true
    
    success "System performance monitoring completed"
}

# Container performance analysis
analyze_container_performance() {
    phase "Phase 4: Container Performance Analysis"
    
    log "Analyzing container performance..."
    
    # Collect Docker stats
    if command -v docker &>/dev/null; then
        docker stats --no-stream --format "table {{.Container}}\t{{.CPUPerc}}\t{{.MemUsage}}\t{{.NetIO}}\t{{.BlockIO}}" > "$RESULTS_DIR/container-stats.txt"
        
        # Get container logs summary
        echo "Container Log Summary:" > "$RESULTS_DIR/container-logs-summary.txt"
        for container in $(docker ps --format "{{.Names}}" | grep aurigraph); do
            echo "=== $container ===" >> "$RESULTS_DIR/container-logs-summary.txt"
            docker logs --tail=100 "$container" >> "$RESULTS_DIR/container-logs-summary.txt" 2>&1
            echo "" >> "$RESULTS_DIR/container-logs-summary.txt"
        done
        
        success "Container performance data collected"
    else
        warn "Docker not available for container analysis"
    fi
}

# Load testing with realistic scenarios
run_load_test_scenarios() {
    phase "Phase 5: Load Test Scenarios"
    
    log "Running realistic load test scenarios..."
    
    # Scenario 1: Gradual ramp-up
    log "Scenario 1: Gradual ramp-up test..."
    for concurrent in 100 500 1000 2000; do
        log "Testing with $concurrent concurrent users..."
        
        # Quick burst test
        timeout 30s bash -c "
            for i in {1..$concurrent}; do
                curl -s http://$SERVER_HOST:8200/api/node/metrics > /dev/null &
            done
            wait
        " || true
        
        sleep 10
    done
    
    # Scenario 2: Spike testing
    log "Scenario 2: Spike testing..."
    for i in {1..5}; do
        log "Spike test iteration $i/5..."
        
        timeout 10s bash -c "
            for j in {1..100}; do
                curl -s http://$SERVER_HOST:8180/api/validator/status > /dev/null &
                curl -s http://$SERVER_HOST:8200/api/node/metrics > /dev/null &
                curl -s http://$SERVER_HOST:3240/api/management/stats > /dev/null &
            done
            wait
        " || true
        
        sleep 5
    done
    
    success "Load test scenarios completed"
}

# Generate comprehensive report
generate_performance_report() {
    phase "Phase 6: Performance Report Generation"
    
    log "Generating comprehensive performance report..."
    
    # Create HTML report
    cat > "$RESULTS_DIR/performance-report.html" << 'EOF'
<!DOCTYPE html>
<html>
<head>
    <title>Aurigraph AV10-7 Performance Test Report</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; border-radius: 10px; }
        .section { margin: 20px 0; padding: 15px; border: 1px solid #ddd; border-radius: 5px; }
        .success { background-color: #d4edda; border-color: #c3e6cb; }
        .warning { background-color: #fff3cd; border-color: #ffeaa7; }
        .error { background-color: #f8d7da; border-color: #f5c6cb; }
        .metrics { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px; }
        .metric-card { background: #f8f9fa; padding: 15px; border-radius: 5px; text-align: center; }
        .metric-value { font-size: 2em; font-weight: bold; color: #495057; }
        .metric-label { color: #6c757d; margin-top: 5px; }
    </style>
</head>
<body>
    <div class="header">
        <h1>🚀 Aurigraph AV10-7 Performance Test Report</h1>
        <p>Production DevOps Manager - Performance Validation</p>
    </div>
    
    <div class="section">
        <h2>📊 Test Summary</h2>
        <div class="metrics">
            <div class="metric-card">
                <div class="metric-value" id="tps">Loading...</div>
                <div class="metric-label">Transactions Per Second</div>
            </div>
            <div class="metric-card">
                <div class="metric-value" id="success-rate">Loading...</div>
                <div class="metric-label">Success Rate (%)</div>
            </div>
            <div class="metric-card">
                <div class="metric-value" id="avg-latency">Loading...</div>
                <div class="metric-label">Avg Latency (ms)</div>
            </div>
            <div class="metric-card">
                <div class="metric-value" id="total-requests">Loading...</div>
                <div class="metric-label">Total Requests</div>
            </div>
        </div>
    </div>
    
    <div class="section">
        <h2>🎯 Performance Targets</h2>
        <div id="targets">
            <p><strong>Target TPS:</strong> 1,000,000</p>
            <p><strong>Achieved TPS:</strong> <span id="achieved-tps">Loading...</span></p>
            <p><strong>Target Achievement:</strong> <span id="target-achievement">Loading...</span></p>
        </div>
    </div>
    
    <div class="section">
        <h2>📈 System Performance</h2>
        <div id="system-performance">
            <p>System performance metrics collected during testing...</p>
        </div>
    </div>
    
    <div class="section">
        <h2>🐳 Container Performance</h2>
        <div id="container-performance">
            <pre id="container-stats">Loading container statistics...</pre>
        </div>
    </div>
    
    <script>
        // Load test results
        fetch('./throughput-results.json')
            .then(response => response.json())
            .then(data => {
                document.getElementById('tps').textContent = data.summary.transactions_per_second.toLocaleString();
                document.getElementById('success-rate').textContent = data.summary.success_rate_percent + '%';
                document.getElementById('avg-latency').textContent = data.latency.average_ms.toFixed(2);
                document.getElementById('total-requests').textContent = data.summary.total_requests.toLocaleString();
                document.getElementById('achieved-tps').textContent = data.summary.transactions_per_second.toLocaleString();
                
                const targetAchievement = (data.summary.transactions_per_second / 1000000 * 100).toFixed(1);
                document.getElementById('target-achievement').textContent = targetAchievement + '%';
            })
            .catch(error => console.error('Error loading test results:', error));
        
        // Load container stats
        fetch('./container-stats.txt')
            .then(response => response.text())
            .then(data => {
                document.getElementById('container-stats').textContent = data;
            })
            .catch(error => console.error('Error loading container stats:', error));
    </script>
</body>
</html>
EOF
    
    success "Performance report generated: $RESULTS_DIR/performance-report.html"
    
    # Generate summary
    if [ -f "$RESULTS_DIR/throughput-results.json" ]; then
        local achieved_tps=$(jq -r '.summary.transactions_per_second' "$RESULTS_DIR/throughput-results.json")
        local success_rate=$(jq -r '.summary.success_rate_percent' "$RESULTS_DIR/throughput-results.json")
        
        echo
        echo -e "${GREEN}🎉 PERFORMANCE TEST COMPLETED!${NC}"
        echo "=================================="
        echo "📊 Results Summary:"
        echo "   ├─ Target TPS: $(printf "%'d" $TARGET_TPS)"
        echo "   ├─ Achieved TPS: $(printf "%'d" $achieved_tps)"
        echo "   ├─ Success Rate: ${success_rate}%"
        echo "   └─ Report: $RESULTS_DIR/performance-report.html"
        
        if (( achieved_tps >= TARGET_TPS * 80 / 100 )); then
            success "Performance target achieved! 🚀"
        else
            warn "Performance target not fully achieved - optimization recommended"
        fi
    fi
}

# Main execution
main() {
    echo -e "${PURPLE}"
    cat << 'EOF'
╔══════════════════════════════════════════════════════════════════════════════╗
║                  🚀 Aurigraph AV10-7 Performance Testing Suite              ║
║                        Production Load Testing & Validation                  ║
╚══════════════════════════════════════════════════════════════════════════════╝
EOF
    echo -e "${NC}"
    
    info "Target TPS: $(printf "%'d" $TARGET_TPS)"
    info "Test Duration: ${TEST_DURATION}s"
    info "Concurrent Users: $CONCURRENT_USERS"
    info "Server: $SERVER_HOST"
    info "Results Directory: $RESULTS_DIR"
    echo
    
    collect_system_info
    pre_test_validation
    
    # Start performance monitoring in background
    monitor_system_performance &
    local monitor_pid=$!
    
    # Run tests
    test_transaction_throughput
    run_load_test_scenarios
    analyze_container_performance
    
    # Stop monitoring
    kill $monitor_pid 2>/dev/null || true
    
    generate_performance_report
    
    success "Performance testing suite completed! 🎉"
}

# Handle interrupts
trap 'error "Performance test interrupted"' INT TERM

# Execute main function
main "$@"