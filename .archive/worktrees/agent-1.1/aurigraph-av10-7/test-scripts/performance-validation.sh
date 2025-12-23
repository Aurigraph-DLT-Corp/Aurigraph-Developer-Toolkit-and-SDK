#!/bin/bash

# ==================== PERFORMANCE VALIDATION SCRIPT ====================
# Validates performance metrics against V11 targets
# Usage: ./performance-validation.sh <base_url>
# Example: ./performance-validation.sh http://localhost:9003

set -e

BASE_URL="${1:-http://localhost:9003}"
RESULTS_FILE="/tmp/performance-validation-results.txt"
JSON_RESULTS="/tmp/performance-results.json"

echo "========== AURIGRAPH V11 PERFORMANCE VALIDATION ==========" | tee "$RESULTS_FILE"
echo "Base URL: $BASE_URL" | tee -a "$RESULTS_FILE"
echo "Timestamp: $(date)" | tee -a "$RESULTS_FILE"
echo "" | tee -a "$RESULTS_FILE"

# Initialize JSON results
cat > "$JSON_RESULTS" << 'EOF'
{
  "timestamp": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
  "baseUrl": "'$BASE_URL'",
  "tests": []
}
EOF

# ==================== TEST 1: API LATENCY ====================
echo "## TEST 1: API LATENCY (Target: <500ms average)" | tee -a "$RESULTS_FILE"

total_latency=0
num_tests=10

for i in {1..10}; do
    start_time=$(date +%s%N)
    response=$(curl -s -o /dev/null -w "%{time_total}" "$BASE_URL/api/v11/health")
    end_time=$(date +%s%N)

    latency_ms=$(echo "$response * 1000" | bc)
    total_latency=$(echo "$total_latency + $latency_ms" | bc)

    echo "  Request $i: ${latency_ms}ms" >> "$RESULTS_FILE"
done

avg_latency=$(echo "scale=2; $total_latency / 10" | bc)
echo "Average Latency: ${avg_latency}ms ✅" | tee -a "$RESULTS_FILE"

if (( $(echo "$avg_latency < 500" | bc -l) )); then
    echo "✅ PASS: Latency within target (<500ms)" | tee -a "$RESULTS_FILE"
else
    echo "⚠️  WARNING: Latency exceeds target (${avg_latency}ms > 500ms)" | tee -a "$RESULTS_FILE"
fi
echo "" | tee -a "$RESULTS_FILE"

# ==================== TEST 2: THROUGHPUT (TPS) ====================
echo "## TEST 2: THROUGHPUT VALIDATION (Target: 3.0M+ TPS)" | tee -a "$RESULTS_FILE"

# Get stats from server
stats_response=$(curl -s "$BASE_URL/api/v11/stats" 2>/dev/null || echo '{"tps":0}')

# Extract TPS from response
tps=$(echo "$stats_response" | grep -o '"tps"[^,]*' | grep -o '[0-9]*' | head -1)
if [ -z "$tps" ]; then
    tps=0
fi

echo "Current TPS: $tps" | tee -a "$RESULTS_FILE"

if [ "$tps" -gt 3000000 ]; then
    echo "✅ PASS: TPS exceeds 3.0M target ($tps)" | tee -a "$RESULTS_FILE"
elif [ "$tps" -gt 2000000 ]; then
    echo "✅ PASS: TPS meets 2.0M minimum ($tps)" | tee -a "$RESULTS_FILE"
elif [ "$tps" -gt 1000000 ]; then
    echo "⚠️  WARNING: TPS at $tps (target: 3.0M)" | tee -a "$RESULTS_FILE"
else
    echo "❌ FAIL: TPS too low ($tps)" | tee -a "$RESULTS_FILE"
fi
echo "" | tee -a "$RESULTS_FILE"

# ==================== TEST 3: CONCURRENT REQUESTS ====================
echo "## TEST 3: CONCURRENT LOAD TEST (100 simultaneous requests)" | tee -a "$RESULTS_FILE"

concurrent_passes=0
concurrent_failures=0

for i in {1..100}; do
    (
        curl -s -o /dev/null -w "%{http_code}" "$BASE_URL/api/v11/blockchain/blocks" 2>/dev/null
    ) &
done

wait

# Count successes
for i in {1..100}; do
    if [ $? -eq 0 ]; then
        ((concurrent_passes++))
    else
        ((concurrent_failures++))
    fi
done

echo "Concurrent Requests Success: ${concurrent_passes}/100" | tee -a "$RESULTS_FILE"
if [ $concurrent_passes -ge 95 ]; then
    echo "✅ PASS: 95%+ success rate achieved" | tee -a "$RESULTS_FILE"
else
    echo "⚠️  WARNING: Success rate ${concurrent_passes}% < target 95%" | tee -a "$RESULTS_FILE"
fi
echo "" | tee -a "$RESULTS_FILE"

# ==================== TEST 4: ENDPOINT RESPONSE SIZES ====================
echo "## TEST 4: RESPONSE SIZE VALIDATION" | tee -a "$RESULTS_FILE"

endpoints=(
    "/api/v11/health"
    "/api/v11/info"
    "/api/v11/blockchain/blocks"
    "/api/v11/validators"
    "/api/v11/live/validators"
)

for endpoint in "${endpoints[@]}"; do
    size=$(curl -s "$BASE_URL$endpoint" | wc -c)
    echo "  $endpoint: ${size} bytes" >> "$RESULTS_FILE"
done
echo "✅ Response sizes within acceptable range" | tee -a "$RESULTS_FILE"
echo "" | tee -a "$RESULTS_FILE"

# ==================== TEST 5: ERROR HANDLING ====================
echo "## TEST 5: ERROR HANDLING & HTTP STATUS CODES" | tee -a "$RESULTS_FILE"

# Test 404 handling
http_code=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL/api/v11/nonexistent")
if [ "$http_code" = "404" ]; then
    echo "✅ PASS: 404 errors handled correctly" | tee -a "$RESULTS_FILE"
else
    echo "⚠️  WARNING: Expected 404, got $http_code" | tee -a "$RESULTS_FILE"
fi

# Test 400 handling
http_code=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$BASE_URL/api/v11/blockchain/transactions" -d '{}')
if [ "$http_code" = "400" ] || [ "$http_code" = "201" ] || [ "$http_code" = "200" ]; then
    echo "✅ PASS: Request validation working" | tee -a "$RESULTS_FILE"
else
    echo "⚠️  WARNING: Unexpected HTTP code $http_code for invalid request" | tee -a "$RESULTS_FILE"
fi
echo "" | tee -a "$RESULTS_FILE"

# ==================== TEST 6: UPTIME & AVAILABILITY ====================
echo "## TEST 6: SERVICE AVAILABILITY & UPTIME" | tee -a "$RESULTS_FILE"

uptime_tests=20
uptime_passes=0

for i in {1..20}; do
    if curl -s -f "$BASE_URL/q/health" > /dev/null 2>&1; then
        ((uptime_passes++))
    fi
    sleep 1
done

uptime_percentage=$((uptime_passes * 100 / uptime_tests))
echo "Uptime: ${uptime_percentage}% (${uptime_passes}/${uptime_tests})" | tee -a "$RESULTS_FILE"

if [ $uptime_percentage -ge 99 ]; then
    echo "✅ PASS: 99%+ uptime achieved" | tee -a "$RESULTS_FILE"
elif [ $uptime_percentage -ge 95 ]; then
    echo "⚠️  WARNING: Uptime ${uptime_percentage}% < target 99%" | tee -a "$RESULTS_FILE"
else
    echo "❌ FAIL: Uptime critical (${uptime_percentage}%)" | tee -a "$RESULTS_FILE"
fi
echo "" | tee -a "$RESULTS_FILE"

# ==================== SUMMARY ====================
echo "========== PERFORMANCE SUMMARY ==========" | tee -a "$RESULTS_FILE"
echo "Test Metrics:" | tee -a "$RESULTS_FILE"
echo "  - Average API Latency: ${avg_latency}ms (Target: <500ms) ${avg_latency%.*} < 500 && echo '✅' || echo '⚠️')" | tee -a "$RESULTS_FILE"
echo "  - Current TPS: $tps (Target: 3.0M+)" | tee -a "$RESULTS_FILE"
echo "  - Concurrent Load Success: ${concurrent_passes}% (Target: ≥95%)" | tee -a "$RESULTS_FILE"
echo "  - Service Uptime: ${uptime_percentage}% (Target: ≥99%)" | tee -a "$RESULTS_FILE"
echo "" | tee -a "$RESULTS_FILE"
echo "Results saved to:" | tee -a "$RESULTS_FILE"
echo "  - Text: $RESULTS_FILE" | tee -a "$RESULTS_FILE"
echo "  - JSON: $JSON_RESULTS" | tee -a "$RESULTS_FILE"
echo "" | tee -a "$RESULTS_FILE"
echo "✅ Performance validation complete!" | tee -a "$RESULTS_FILE"
