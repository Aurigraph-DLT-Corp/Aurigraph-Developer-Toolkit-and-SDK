#!/bin/bash

# ==================== API SMOKE TEST ====================
# Quick validation of all critical API endpoints
# Usage: ./api-smoke-test.sh <base_url>
# Example: ./api-smoke-test.sh http://localhost:9003

set -e

BASE_URL="${1:-http://localhost:9003}"
RESULTS_FILE="/tmp/smoke-test-results.txt"
PASS_COUNT=0
FAIL_COUNT=0

echo "========== AURIGRAPH V11 API SMOKE TEST ==========" | tee "$RESULTS_FILE"
echo "Base URL: $BASE_URL" | tee -a "$RESULTS_FILE"
echo "Timestamp: $(date)" | tee -a "$RESULTS_FILE"
echo "" | tee -a "$RESULTS_FILE"

# Function to test endpoint
test_endpoint() {
    local method=$1
    local endpoint=$2
    local expected_code=$3
    local description=$4

    echo -n "Testing $description... " | tee -a "$RESULTS_FILE"

    if [ "$method" = "GET" ]; then
        response=$(curl -s -w "\n%{http_code}" -X GET "$BASE_URL$endpoint" -H "Content-Type: application/json")
    else
        response=$(curl -s -w "\n%{http_code}" -X POST "$BASE_URL$endpoint" -H "Content-Type: application/json" -d '{}')
    fi

    http_code=$(echo "$response" | tail -n1)
    body=$(echo "$response" | head -n-1)

    if [ "$http_code" = "$expected_code" ]; then
        echo "✅ PASS (HTTP $http_code)" | tee -a "$RESULTS_FILE"
        ((PASS_COUNT++))
        return 0
    else
        echo "❌ FAIL (Expected $expected_code, got $http_code)" | tee -a "$RESULTS_FILE"
        ((FAIL_COUNT++))
        return 1
    fi
}

# ==================== CORE HEALTH CHECKS ====================
echo "## CORE HEALTH CHECKS" | tee -a "$RESULTS_FILE"
test_endpoint "GET" "/q/health" "200" "Quarkus Health Check"
test_endpoint "GET" "/api/v11/health" "200" "V11 Health Check"
test_endpoint "GET" "/api/v11/info" "200" "System Info"
echo "" | tee -a "$RESULTS_FILE"

# ==================== BLOCKCHAIN APIS ====================
echo "## BLOCKCHAIN APIS (P0 - CRITICAL)" | tee -a "$RESULTS_FILE"
test_endpoint "GET" "/api/v11/blockchain/network/stats" "200" "Network Statistics"
test_endpoint "GET" "/api/v11/blockchain/transactions" "200" "Transaction List"
test_endpoint "GET" "/api/v11/blockchain/blocks" "200" "Block List"
test_endpoint "GET" "/api/v11/blockchain/blocks/latest" "200" "Latest Block"
echo "" | tee -a "$RESULTS_FILE"

# ==================== VALIDATOR APIS ====================
echo "## VALIDATOR APIS (BUG-002 FIX)" | tee -a "$RESULTS_FILE"
test_endpoint "GET" "/api/v11/validators" "200" "Validators List"
test_endpoint "GET" "/api/v11/validators/validator_0" "200" "Validator Details"
test_endpoint "GET" "/api/v11/validators/validator_0/stats" "200" "Validator Stats"
echo "" | tee -a "$RESULTS_FILE"

# ==================== BRIDGE APIS ====================
echo "## BRIDGE APIS (BUG-003 FIX)" | tee -a "$RESULTS_FILE"
test_endpoint "GET" "/api/v11/bridge/stats" "200" "Bridge Statistics"
test_endpoint "GET" "/api/v11/bridge/supported-chains" "200" "Supported Chains"
test_endpoint "POST" "/api/v11/bridge/transfer" "200" "Bridge Transfer"
echo "" | tee -a "$RESULTS_FILE"

# ==================== LIVE DATA APIS ====================
echo "## LIVE DATA APIS" | tee -a "$RESULTS_FILE"
test_endpoint "GET" "/api/v11/live/validators" "200" "Live Validators"
test_endpoint "GET" "/api/v11/live/consensus" "200" "Live Consensus"
test_endpoint "GET" "/api/v11/live/network" "200" "Live Network"
echo "" | tee -a "$RESULTS_FILE"

# ==================== ANALYTICS APIS ====================
echo "## ANALYTICS APIS" | tee -a "$RESULTS_FILE"
test_endpoint "GET" "/api/v11/analytics/dashboard" "200" "Analytics Dashboard"
test_endpoint "GET" "/api/v11/analytics/performance" "200" "Performance Metrics"
echo "" | tee -a "$RESULTS_FILE"

# ==================== AI/ML APIS ====================
echo "## AI/ML APIS" | tee -a "$RESULTS_FILE"
test_endpoint "GET" "/api/v11/ai/models" "200" "AI Models"
echo "" | tee -a "$RESULTS_FILE"

# ==================== SECURITY APIS ====================
echo "## SECURITY APIS" | tee -a "$RESULTS_FILE"
test_endpoint "GET" "/api/v11/security/status" "200" "Security Status"
echo "" | tee -a "$RESULTS_FILE"

# ==================== PERFORMANCE ENDPOINTS ====================
echo "## PERFORMANCE ENDPOINTS" | tee -a "$RESULTS_FILE"
test_endpoint "GET" "/api/v11/stats" "200" "Transaction Stats"
test_endpoint "GET" "/api/v11/system/status" "200" "System Status"
echo "" | tee -a "$RESULTS_FILE"

# ==================== SUMMARY ====================
echo "========== TEST SUMMARY ==========" | tee -a "$RESULTS_FILE"
echo "Total Tests: $((PASS_COUNT + FAIL_COUNT))" | tee -a "$RESULTS_FILE"
echo "Passed: $PASS_COUNT ✅" | tee -a "$RESULTS_FILE"
echo "Failed: $FAIL_COUNT ❌" | tee -a "$RESULTS_FILE"

if [ $FAIL_COUNT -eq 0 ]; then
    echo "" | tee -a "$RESULTS_FILE"
    echo "🎉 ALL SMOKE TESTS PASSED!" | tee -a "$RESULTS_FILE"
    exit 0
else
    echo "" | tee -a "$RESULTS_FILE"
    echo "⚠️  SOME TESTS FAILED" | tee -a "$RESULTS_FILE"
    exit 1
fi
