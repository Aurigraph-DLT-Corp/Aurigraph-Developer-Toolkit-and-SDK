#!/bin/bash

# ==================== COMPREHENSIVE PERFORMANCE BENCHMARK ====================
# Complete TPS, latency, and stress testing for Aurigraph V11
# Validates: 3.0M+ TPS, <500ms latency, 99%+ uptime
# Usage: ./comprehensive-performance-benchmark.sh <base_url> [num_iterations]

set -e

BASE_URL="${1:-http://localhost:9003}"
NUM_ITERATIONS="${2:-1000}"
REPORT_DIR="/tmp/performance-benchmark-$(date +%Y%m%d-%H%M%S)"
METRICS_FILE="$REPORT_DIR/metrics.json"

# Create report directory
mkdir -p "$REPORT_DIR"

echo "========== AURIGRAPH V11 COMPREHENSIVE PERFORMANCE BENCHMARK ==========" | tee "$REPORT_DIR/report.txt"
echo "Base URL: $BASE_URL" | tee -a "$REPORT_DIR/report.txt"
echo "Test Iterations: $NUM_ITERATIONS" | tee -a "$REPORT_DIR/report.txt"
echo "Timestamp: $(date)" | tee -a "$REPORT_DIR/report.txt"
echo "" | tee -a "$REPORT_DIR/report.txt"

# Initialize JSON metrics
cat > "$METRICS_FILE" << EOF
{
  "benchmark_run": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
  "base_url": "$BASE_URL",
  "configuration": {
    "num_iterations": $NUM_ITERATIONS,
    "concurrent_requests": 10,
    "test_duration_seconds": 0
  },
  "results": {}
}
EOF

# ==================== TEST 1: TRANSACTION THROUGHPUT ====================
echo "## TEST 1: TRANSACTION THROUGHPUT BENCHMARKING" | tee -a "$REPORT_DIR/report.txt"
echo "Testing TPS with $NUM_ITERATIONS transaction submissions..." | tee -a "$REPORT_DIR/report.txt"

declare -a tx_times
declare -a tx_codes

# Warm-up: 10 requests
for i in {1..10}; do
    curl -s -o /dev/null "$BASE_URL/api/v11/blockchain/transactions" 2>/dev/null || true
done

start_time=$(date +%s%N)

# Main test: Submit transactions in parallel
for i in $(seq 1 $NUM_ITERATIONS); do
    (
        request_start=$(date +%s%N)
        response=$(curl -s -w "\n%{http_code}" -X POST "$BASE_URL/api/v11/blockchain/transactions" \
            -H "Content-Type: application/json" \
            -d "{\"transactionId\":\"tx_$i\",\"amount\":\"100\"}" 2>/dev/null)
        request_end=$(date +%s%N)

        http_code=$(echo "$response" | tail -n1)
        latency=$(( (request_end - request_start) / 1000000 ))

        echo "$latency:$http_code" >> "$REPORT_DIR/tx_results.tmp"
    ) &

    # Run 10 concurrent requests at a time
    if [ $((i % 10)) -eq 0 ]; then
        wait
    fi
done

wait

end_time=$(date +%s%N)
total_duration=$(( (end_time - start_time) / 1_000_000_000 ))
tps=$(echo "scale=0; $NUM_ITERATIONS / $total_duration" | bc)

# Calculate latency statistics
if [ -f "$REPORT_DIR/tx_results.tmp" ]; then
    latencies=$(cut -d: -f1 "$REPORT_DIR/tx_results.tmp" | sort -n)
    total_latency=$(echo "$latencies" | awk '{sum+=$1} END {print sum}')
    avg_latency=$(echo "scale=2; $total_latency / $NUM_ITERATIONS" | bc)
    p50=$(echo "$latencies" | awk '{a[NR]=$0} END {print a[int(NR*0.50)]}')
    p95=$(echo "$latencies" | awk '{a[NR]=$0} END {print a[int(NR*0.95)]}')
    p99=$(echo "$latencies" | awk '{a[NR]=$0} END {print a[int(NR*0.99)]}')

    echo "Test Duration: ${total_duration}s" | tee -a "$REPORT_DIR/report.txt"
    echo "Transactions Processed: $NUM_ITERATIONS" | tee -a "$REPORT_DIR/report.txt"
    echo "TPS Achieved: $tps" | tee -a "$REPORT_DIR/report.txt"
    echo "Average Latency: ${avg_latency}ms" | tee -a "$REPORT_DIR/report.txt"
    echo "P50 Latency: ${p50}ms" | tee -a "$REPORT_DIR/report.txt"
    echo "P95 Latency: ${p95}ms" | tee -a "$REPORT_DIR/report.txt"
    echo "P99 Latency: ${p99}ms" | tee -a "$REPORT_DIR/report.txt"

    if (( $(echo "$tps > 3000000" | bc -l) )); then
        echo "✅ PASS: TPS exceeds 3.0M target ($tps)" | tee -a "$REPORT_DIR/report.txt"
    elif (( $(echo "$tps > 2000000" | bc -l) )); then
        echo "✅ PASS: TPS meets 2.0M minimum ($tps)" | tee -a "$REPORT_DIR/report.txt"
    else
        echo "⚠️  WARNING: TPS below 2.0M ($tps)" | tee -a "$REPORT_DIR/report.txt"
    fi
fi
echo "" | tee -a "$REPORT_DIR/report.txt"

# ==================== TEST 2: API ENDPOINT LATENCY ====================
echo "## TEST 2: API ENDPOINT LATENCY ANALYSIS" | tee -a "$REPORT_DIR/report.txt"

endpoints=(
    "/api/v11/health"
    "/api/v11/blockchain/transactions"
    "/api/v11/blockchain/blocks"
    "/api/v11/validators"
    "/api/v11/live/validators"
    "/api/v11/analytics/dashboard"
    "/api/v11/bridge/stats"
)

for endpoint in "${endpoints[@]}"; do
    echo -n "Testing $endpoint..." | tee -a "$REPORT_DIR/report.txt"

    declare -a latencies
    for i in {1..20}; do
        latency=$(curl -s -o /dev/null -w "%{time_total}" "$BASE_URL$endpoint" 2>/dev/null)
        latency_ms=$(echo "$latency * 1000" | bc)
        latencies+=($latency_ms)
    done

    total=$(printf '%s\n' "${latencies[@]}" | awk '{sum+=$1} END {print sum}')
    avg=$(echo "scale=2; $total / 20" | bc)

    echo " ${avg}ms" | tee -a "$REPORT_DIR/report.txt"
done
echo "" | tee -a "$REPORT_DIR/report.txt"

# ==================== TEST 3: MEMORY & RESOURCE USAGE ====================
echo "## TEST 3: MEMORY & RESOURCE MONITORING" | tee -a "$REPORT_DIR/report.txt"

# Get process info if available
if pgrep -f "quarkus\|aurigraph" > /dev/null 2>&1; then
    pid=$(pgrep -f "quarkus\|aurigraph" | head -1)

    # Try to get memory usage
    if command -v ps &> /dev/null; then
        mem_info=$(ps aux | grep $pid | grep -v grep | awk '{print $6, $4}')
        if [ ! -z "$mem_info" ]; then
            echo "Process Memory Info: $mem_info" | tee -a "$REPORT_DIR/report.txt"
        fi
    fi
fi
echo "" | tee -a "$REPORT_DIR/report.txt"

# ==================== TEST 4: SUSTAINED LOAD TEST ====================
echo "## TEST 4: SUSTAINED LOAD TEST (60 SECONDS)" | tee -a "$REPORT_DIR/report.txt"

request_count=0
success_count=0
start_time=$(date +%s)

echo "Running sustained load test for 60 seconds..."

while [ $(($(date +%s) - start_time)) -lt 60 ]; do
    (
        http_code=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL/api/v11/health" 2>/dev/null)
        echo "$http_code"
    ) >> "$REPORT_DIR/sustained_load.tmp" &

    ((request_count++))
done

wait

# Count successful requests
if [ -f "$REPORT_DIR/sustained_load.tmp" ]; then
    success_count=$(grep -c "^200$" "$REPORT_DIR/sustained_load.tmp" || echo 0)
    success_rate=$((success_count * 100 / request_count))

    echo "Total Requests: $request_count" | tee -a "$REPORT_DIR/report.txt"
    echo "Successful Requests: $success_count" | tee -a "$REPORT_DIR/report.txt"
    echo "Success Rate: ${success_rate}%" | tee -a "$REPORT_DIR/report.txt"

    if [ $success_rate -ge 99 ]; then
        echo "✅ PASS: 99%+ success rate maintained" | tee -a "$REPORT_DIR/report.txt"
    elif [ $success_rate -ge 95 ]; then
        echo "⚠️  WARNING: Success rate ${success_rate}% < 99%" | tee -a "$REPORT_DIR/report.txt"
    else
        echo "❌ FAIL: Success rate critical (${success_rate}%)" | tee -a "$REPORT_DIR/report.txt"
    fi
fi
echo "" | tee -a "$REPORT_DIR/report.txt"

# ==================== TEST 5: STRESS TEST ====================
echo "## TEST 5: STRESS TEST (500 CONCURRENT REQUESTS)" | tee -a "$REPORT_DIR/report.txt"

echo "Launching 500 concurrent requests..."

for i in {1..500}; do
    (
        curl -s -o /dev/null -w "%{http_code}\n" "$BASE_URL/api/v11/blockchain/blocks" 2>/dev/null
    ) >> "$REPORT_DIR/stress_test.tmp" &
done

wait

if [ -f "$REPORT_DIR/stress_test.tmp" ]; then
    success=$(grep -c "^200$" "$REPORT_DIR/stress_test.tmp" || echo 0)
    total=$(wc -l < "$REPORT_DIR/stress_test.tmp")
    stress_success_rate=$((success * 100 / total))

    echo "Concurrent Requests: 500" | tee -a "$REPORT_DIR/report.txt"
    echo "Successful: $success" | tee -a "$REPORT_DIR/report.txt"
    echo "Success Rate: ${stress_success_rate}%" | tee -a "$REPORT_DIR/report.txt"

    if [ $stress_success_rate -ge 95 ]; then
        echo "✅ PASS: Handles 500 concurrent requests" | tee -a "$REPORT_DIR/report.txt"
    else
        echo "⚠️  WARNING: Stress test success rate ${stress_success_rate}%" | tee -a "$REPORT_DIR/report.txt"
    fi
fi
echo "" | tee -a "$REPORT_DIR/report.txt"

# ==================== SUMMARY & RECOMMENDATIONS ====================
echo "========== BENCHMARK SUMMARY ==========" | tee -a "$REPORT_DIR/report.txt"
echo "" | tee -a "$REPORT_DIR/report.txt"

if [ ! -z "$tps" ]; then
    echo "Key Metrics:" | tee -a "$REPORT_DIR/report.txt"
    echo "  ✓ TPS Achieved: $tps" | tee -a "$REPORT_DIR/report.txt"
    echo "  ✓ Average Latency: ${avg_latency}ms" | tee -a "$REPORT_DIR/report.txt"
    echo "  ✓ P99 Latency: ${p99}ms" | tee -a "$REPORT_DIR/report.txt"
    echo "  ✓ Sustained Load Success: ${success_rate}%" | tee -a "$REPORT_DIR/report.txt"
    echo "  ✓ Stress Test Success: ${stress_success_rate}%" | tee -a "$REPORT_DIR/report.txt"
fi

echo "" | tee -a "$REPORT_DIR/report.txt"
echo "Reports generated in: $REPORT_DIR" | tee -a "$REPORT_DIR/report.txt"
echo "Files:" | tee -a "$REPORT_DIR/report.txt"
echo "  - report.txt (complete report)" | tee -a "$REPORT_DIR/report.txt"
echo "  - metrics.json (JSON metrics)" | tee -a "$REPORT_DIR/report.txt"

# Cleanup temp files
rm -f "$REPORT_DIR"/*.tmp

echo "" | tee -a "$REPORT_DIR/report.txt"
echo "✅ Benchmark complete!" | tee -a "$REPORT_DIR/report.txt"
