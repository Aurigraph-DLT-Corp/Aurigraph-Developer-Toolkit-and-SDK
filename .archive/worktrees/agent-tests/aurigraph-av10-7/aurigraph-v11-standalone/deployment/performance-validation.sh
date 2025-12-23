#!/bin/bash

#####################################################################
# Aurigraph V11 Performance Validation Script
#
# Validates the 2M+ TPS target and captures comprehensive metrics
#####################################################################

set -euo pipefail

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

# Configuration
API_BASE="http://localhost:9003"
RESULTS_DIR="./performance-results"
TIMESTAMP=$(date +%Y%m%d-%H%M%S)
RESULTS_FILE="${RESULTS_DIR}/validation-${TIMESTAMP}.json"

# Performance targets
TARGET_TPS=2000000
TARGET_P99_LATENCY_MS=50
TARGET_MEMORY_MB=256
TARGET_STARTUP_TIME_S=1

log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

check_service_health() {
    log_info "Checking service health..."

    local health_response
    health_response=$(curl -sf "${API_BASE}/api/v11/health" || echo "FAILED")

    if [ "$health_response" = "FAILED" ]; then
        log_error "Service health check failed"
        log_error "Is the service running on ${API_BASE}?"
        exit 1
    fi

    log_info "Service is healthy"
}

get_system_info() {
    log_info "Gathering system information..."

    local info_response
    info_response=$(curl -sf "${API_BASE}/api/v11/info" || echo "{}")

    echo "$info_response" | jq . || echo "$info_response"
}

run_baseline_benchmark() {
    log_info "Running baseline performance benchmark..."
    log_info "Duration: 60 seconds, Warm-up: 10 seconds"

    local benchmark_payload
    benchmark_payload=$(cat <<EOF
{
  "duration_seconds": 60,
  "warm_up_seconds": 10,
  "concurrent_connections": 256,
  "transactions_per_second": 100000,
  "transaction_type": "transfer",
  "payload_size_bytes": 1024
}
EOF
)

    local benchmark_response
    benchmark_response=$(curl -sf -X POST "${API_BASE}/api/v11/performance/benchmark" \
        -H "Content-Type: application/json" \
        -d "$benchmark_payload" || echo "{}")

    echo "$benchmark_response"
}

run_load_test() {
    log_info "Running progressive load test..."

    local results=()
    local loads=(100000 500000 1000000 1500000 2000000 2500000 3000000)

    for load in "${loads[@]}"; do
        log_info "Testing at ${load} TPS target..."

        local test_payload
        test_payload=$(cat <<EOF
{
  "duration_seconds": 30,
  "warm_up_seconds": 5,
  "concurrent_connections": 512,
  "transactions_per_second": ${load},
  "transaction_type": "transfer",
  "payload_size_bytes": 1024
}
EOF
)

        local test_response
        test_response=$(curl -sf -X POST "${API_BASE}/api/v11/performance/benchmark" \
            -H "Content-Type: application/json" \
            -d "$test_payload" 2>/dev/null || echo '{"error": "test_failed"}')

        # Extract key metrics
        local actual_tps
        local p99_latency
        actual_tps=$(echo "$test_response" | jq -r '.tps // 0')
        p99_latency=$(echo "$test_response" | jq -r '.p99_latency_ms // 0')

        results+=("{\"target_tps\": ${load}, \"actual_tps\": ${actual_tps}, \"p99_latency_ms\": ${p99_latency}}")

        log_info "Result: ${actual_tps} TPS, P99: ${p99_latency}ms"

        # Stop if we're seeing degradation
        if (( $(echo "$p99_latency > 100" | bc -l 2>/dev/null || echo 0) )); then
            log_warn "P99 latency exceeding 100ms, stopping progressive test"
            break
        fi

        sleep 5
    done

    # Print results summary
    echo "${results[@]}" | jq -s .
}

measure_startup_time() {
    log_info "Measuring startup time..."

    # This requires service restart - skip if service is running
    log_warn "Startup time measurement requires service restart"
    log_warn "Please measure manually: time ./target/*-runner"
}

capture_metrics() {
    log_info "Capturing Prometheus metrics..."

    local metrics_response
    metrics_response=$(curl -sf "${API_BASE}/q/metrics" || echo "")

    # Extract key metrics
    local memory_used
    local cpu_usage
    local connections

    memory_used=$(echo "$metrics_response" | grep "process_resident_memory_bytes" | awk '{print $2}' | head -1)
    cpu_usage=$(echo "$metrics_response" | grep "process_cpu_seconds_total" | awk '{print $2}' | head -1)
    connections=$(echo "$metrics_response" | grep "http_server_connections_active" | awk '{print $2}' | head -1)

    cat <<EOF
{
  "memory_bytes": ${memory_used:-0},
  "memory_mb": $(echo "scale=2; ${memory_used:-0} / 1048576" | bc 2>/dev/null || echo 0),
  "cpu_seconds_total": ${cpu_usage:-0},
  "active_connections": ${connections:-0}
}
EOF
}

run_stress_test() {
    log_info "Running stress test (sustained load for 5 minutes)..."

    local stress_payload
    stress_payload=$(cat <<EOF
{
  "duration_seconds": 300,
  "warm_up_seconds": 30,
  "concurrent_connections": 1024,
  "transactions_per_second": 2000000,
  "transaction_type": "transfer",
  "payload_size_bytes": 1024
}
EOF
)

    local stress_response
    stress_response=$(curl -sf -X POST "${API_BASE}/api/v11/performance/benchmark" \
        -H "Content-Type: application/json" \
        -d "$stress_payload" || echo "{}")

    echo "$stress_response"
}

generate_report() {
    local baseline_result="$1"
    local load_test_results="$2"
    local stress_test_result="$3"
    local metrics="$4"

    log_info "Generating validation report..."

    mkdir -p "$RESULTS_DIR"

    # Extract key values for comparison
    local baseline_tps
    local max_tps
    local stress_tps

    baseline_tps=$(echo "$baseline_result" | jq -r '.tps // 0')
    max_tps=$(echo "$load_test_results" | jq -r 'map(.actual_tps) | max // 0')
    stress_tps=$(echo "$stress_test_result" | jq -r '.tps // 0')

    local memory_mb
    memory_mb=$(echo "$metrics" | jq -r '.memory_mb // 0')

    # Generate comprehensive report
    cat > "$RESULTS_FILE" <<EOF
{
  "timestamp": "${TIMESTAMP}",
  "version": "11.4.3",
  "environment": "local",
  "baseline_benchmark": ${baseline_result},
  "progressive_load_test": ${load_test_results},
  "stress_test": ${stress_test_result},
  "system_metrics": ${metrics},
  "validation_results": {
    "tps_target": ${TARGET_TPS},
    "tps_achieved": ${max_tps},
    "tps_met": $([ $(echo "$max_tps >= $TARGET_TPS" | bc -l 2>/dev/null || echo 0) -eq 1 ] && echo "true" || echo "false"),
    "memory_target_mb": ${TARGET_MEMORY_MB},
    "memory_actual_mb": ${memory_mb},
    "memory_met": $([ $(echo "$memory_mb <= $TARGET_MEMORY_MB" | bc -l 2>/dev/null || echo 0) -eq 1 ] && echo "true" || echo "false"),
    "overall_status": "$([ $(echo "$max_tps >= $TARGET_TPS" | bc -l 2>/dev/null || echo 0) -eq 1 ] && echo "PASS" || echo "FAIL")"
  }
}
EOF

    log_info "Report saved to: $RESULTS_FILE"
}

print_summary() {
    local results_file="$1"

    log_info "======================================"
    log_info "Performance Validation Summary"
    log_info "======================================"

    local tps_achieved
    local tps_met
    local memory_actual
    local memory_met
    local overall_status

    tps_achieved=$(jq -r '.validation_results.tps_achieved' "$results_file")
    tps_met=$(jq -r '.validation_results.tps_met' "$results_file")
    memory_actual=$(jq -r '.validation_results.memory_actual_mb' "$results_file")
    memory_met=$(jq -r '.validation_results.memory_met' "$results_file")
    overall_status=$(jq -r '.validation_results.overall_status' "$results_file")

    echo ""
    echo "TPS Performance:"
    echo "  Target:   ${TARGET_TPS} TPS"
    echo "  Achieved: ${tps_achieved} TPS"
    echo "  Status:   $([ "$tps_met" = "true" ] && echo -e "${GREEN}PASS${NC}" || echo -e "${RED}FAIL${NC}")"
    echo ""
    echo "Memory Usage:"
    echo "  Target:   ${TARGET_MEMORY_MB} MB"
    echo "  Actual:   ${memory_actual} MB"
    echo "  Status:   $([ "$memory_met" = "true" ] && echo -e "${GREEN}PASS${NC}" || echo -e "${RED}FAIL${NC}")"
    echo ""
    echo "Overall Status: $([ "$overall_status" = "PASS" ] && echo -e "${GREEN}PASS${NC}" || echo -e "${YELLOW}NEEDS OPTIMIZATION${NC}")"
    echo ""
    log_info "======================================"
    log_info "Full results: $results_file"
}

main() {
    log_info "Starting Aurigraph V11 Performance Validation"
    log_info "Target: 2M+ TPS, <50ms P99 latency, <256MB memory"
    log_info ""

    # Check service
    check_service_health

    # Get system info
    get_system_info

    # Run tests
    log_info "Running performance tests (this will take ~10 minutes)..."

    local baseline_result
    local load_test_results
    local stress_test_result
    local metrics

    baseline_result=$(run_baseline_benchmark)
    load_test_results=$(run_load_test)
    stress_test_result=$(run_stress_test)
    metrics=$(capture_metrics)

    # Generate report
    generate_report "$baseline_result" "$load_test_results" "$stress_test_result" "$metrics"

    # Print summary
    print_summary "$RESULTS_FILE"

    log_info "Performance validation completed"
}

main "$@"
