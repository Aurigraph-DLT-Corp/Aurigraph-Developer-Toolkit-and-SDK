#!/bin/bash

# Enterprise Portal V4.8.0 - Comprehensive API/UI Integration Test
# Tests all 22 API endpoints documented in Architecture.md

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Test configuration
BACKEND_URL="${BACKEND_URL:-http://localhost:9003}"
FRONTEND_URL="${FRONTEND_URL:-http://localhost:5173}"
REPORT_FILE="integration-test-report-$(date +%Y%m%d_%H%M%S).md"

# Counters
TOTAL_TESTS=0
PASSED_TESTS=0
FAILED_TESTS=0

# Results arrays
declare -a ENDPOINT_RESULTS
declare -a RESPONSE_TIMES

echo "======================================================================"
echo "  Enterprise Portal V4.8.0 - API/UI Integration Test Suite"
echo "======================================================================"
echo ""
echo "Backend URL: $BACKEND_URL"
echo "Frontend URL: $FRONTEND_URL"
echo "Report File: $REPORT_FILE"
echo ""

# Function to test endpoint
test_endpoint() {
    local method="$1"
    local endpoint="$2"
    local description="$3"
    local expected_status="${4:-200}"
    local data="$5"

    TOTAL_TESTS=$((TOTAL_TESTS + 1))

    echo -n "Testing [$method] $endpoint ... "

    # Prepare curl command
    local curl_cmd="curl -s -o /tmp/response.json -w '%{http_code}|%{time_total}' -X $method"

    if [ ! -z "$data" ]; then
        curl_cmd="$curl_cmd -H 'Content-Type: application/json' -d '$data'"
    fi

    curl_cmd="$curl_cmd '$BACKEND_URL$endpoint'"

    # Execute request
    local start_time=$(date +%s%N)
    local result=$(eval $curl_cmd 2>&1)
    local end_time=$(date +%s%N)

    # Parse result
    local status_code=$(echo $result | cut -d'|' -f1)
    local response_time=$(echo $result | cut -d'|' -f2)

    # Calculate response time in ms
    local response_time_ms=$(echo "scale=2; $response_time * 1000" | bc)

    # Check status code
    if [ "$status_code" = "$expected_status" ] || [ "$status_code" = "200" ] || [ "$status_code" = "201" ]; then
        echo -e "${GREEN}✓ PASS${NC} (${status_code}, ${response_time_ms}ms)"
        PASSED_TESTS=$((PASSED_TESTS + 1))
        ENDPOINT_RESULTS+=("✅|$method|$endpoint|$description|$status_code|${response_time_ms}ms|PASS")
        RESPONSE_TIMES+=($response_time_ms)
    elif [ "$status_code" = "404" ]; then
        echo -e "${YELLOW}⚠ MISSING${NC} (${status_code}, ${response_time_ms}ms)"
        FAILED_TESTS=$((FAILED_TESTS + 1))
        ENDPOINT_RESULTS+=("❌|$method|$endpoint|$description|$status_code|${response_time_ms}ms|MISSING ENDPOINT")
    elif [ "$status_code" = "000" ]; then
        echo -e "${RED}✗ FAIL${NC} (Connection refused)"
        FAILED_TESTS=$((FAILED_TESTS + 1))
        ENDPOINT_RESULTS+=("❌|$method|$endpoint|$description|ERROR|N/A|CONNECTION REFUSED")
    else
        echo -e "${RED}✗ FAIL${NC} (${status_code}, ${response_time_ms}ms)"
        FAILED_TESTS=$((FAILED_TESTS + 1))
        ENDPOINT_RESULTS+=("❌|$method|$endpoint|$description|$status_code|${response_time_ms}ms|UNEXPECTED STATUS")
    fi
}

# Function to check backend health
check_backend() {
    echo "Checking backend health..."
    local health_check=$(curl -s -o /dev/null -w "%{http_code}" "$BACKEND_URL/q/health" 2>&1)

    if [ "$health_check" = "200" ]; then
        echo -e "${GREEN}Backend is healthy${NC}"
        return 0
    else
        echo -e "${RED}Backend is not responding (status: $health_check)${NC}"
        return 1
    fi
}

# Function to check frontend
check_frontend() {
    echo "Checking frontend server..."
    local frontend_check=$(curl -s -o /dev/null -w "%{http_code}" "$FRONTEND_URL" 2>&1)

    if [ "$frontend_check" = "200" ]; then
        echo -e "${GREEN}Frontend is running${NC}"
        return 0
    else
        echo -e "${YELLOW}Frontend is not responding (status: $frontend_check)${NC}"
        echo "You may need to start it with: npm run dev"
        return 1
    fi
}

# Start report
cat > "$REPORT_FILE" << EOF
# Enterprise Portal V4.8.0 - Integration Test Report

**Date**: $(date '+%Y-%m-%d %H:%M:%S')
**Backend URL**: $BACKEND_URL
**Frontend URL**: $FRONTEND_URL

---

## Executive Summary

EOF

# Check backend and frontend
echo ""
echo "======================================================================"
echo "  Pre-Flight Checks"
echo "======================================================================"
echo ""

check_backend
BACKEND_STATUS=$?

check_frontend
FRONTEND_STATUS=$?

echo ""
echo "======================================================================"
echo "  Testing API Endpoints (22 endpoints)"
echo "======================================================================"
echo ""

# Category 1: Blockchain Endpoints (4 endpoints)
echo -e "${BLUE}[Blockchain Endpoints]${NC}"
test_endpoint "GET" "/api/v11/blockchain/stats" "Network statistics" "200"
test_endpoint "GET" "/api/v11/blockchain/transactions" "List transactions" "200"
test_endpoint "GET" "/api/v11/blockchain/transactions/test-hash-001" "Transaction details" "200"
test_endpoint "GET" "/api/v11/blockchain/blocks" "List blocks" "200"

# Category 2: Node Endpoints (5 endpoints)
echo ""
echo -e "${BLUE}[Node Management Endpoints]${NC}"
test_endpoint "GET" "/api/v11/nodes" "List nodes" "200"
test_endpoint "GET" "/api/v11/nodes/node-001" "Node details" "200"
test_endpoint "POST" "/api/v11/nodes" "Create node" "201" '{"name":"Test Node","type":"validator"}'
test_endpoint "PUT" "/api/v11/nodes/node-001" "Update node" "200" '{"status":"active"}'
test_endpoint "DELETE" "/api/v11/nodes/test-node" "Delete node" "204"

# Category 3: Channel Endpoints (3 endpoints)
echo ""
echo -e "${BLUE}[Channel Management Endpoints]${NC}"
test_endpoint "GET" "/api/v11/channels" "List channels" "200"
test_endpoint "POST" "/api/v11/channels" "Create channel" "201" '{"name":"Test Channel"}'
test_endpoint "GET" "/api/v11/channels/channel-001/stats" "Channel statistics" "200"

# Category 4: Contract Endpoints (4 endpoints)
echo ""
echo -e "${BLUE}[Ricardian Contract Endpoints]${NC}"
test_endpoint "GET" "/api/v11/contracts/ricardian" "List contracts" "200"
test_endpoint "POST" "/api/v11/contracts/ricardian/upload" "Upload contract" "201" '{"name":"Test Contract","content":"test"}'
test_endpoint "POST" "/api/v11/contracts/ricardian/contract-001/execute" "Execute contract" "200" '{}'
test_endpoint "GET" "/api/v11/contracts/statistics" "Contract statistics" "200"

# Category 5: Demo Endpoints (6 endpoints)
echo ""
echo -e "${BLUE}[Demo Management Endpoints]${NC}"
test_endpoint "GET" "/api/v11/demos" "List demos" "200"
test_endpoint "POST" "/api/v11/demos" "Create demo" "201" '{"name":"Test Demo","description":"Test"}'
test_endpoint "PUT" "/api/v11/demos/demo-001/start" "Start demo" "200"
test_endpoint "PUT" "/api/v11/demos/demo-001/stop" "Stop demo" "200"
test_endpoint "DELETE" "/api/v11/demos/demo-001" "Delete demo" "204"
test_endpoint "GET" "/api/v11/demos/demo-001/merkle" "Merkle proof" "200"

# Category 6: AI/ML Endpoints (4 endpoints - NEW)
echo ""
echo -e "${BLUE}[AI/ML Performance Endpoints]${NC}"
test_endpoint "GET" "/api/v11/ai/metrics" "AI metrics" "200"
test_endpoint "GET" "/api/v11/ai/predictions" "AI predictions" "200"
test_endpoint "GET" "/api/v11/ai/performance" "ML performance data" "200"
test_endpoint "GET" "/api/v11/ai/confidence" "Confidence scores" "200"

# Category 7: Token/RWAT Endpoints (5 endpoints - NEW)
echo ""
echo -e "${BLUE}[Token Management Endpoints]${NC}"
test_endpoint "GET" "/api/v11/tokens" "List tokens" "200"
test_endpoint "POST" "/api/v11/tokens" "Create token" "201" '{"symbol":"TEST","name":"Test Token"}'
test_endpoint "GET" "/api/v11/tokens/token-001" "Token details" "200"
test_endpoint "PUT" "/api/v11/tokens/token-001" "Update token" "200" '{"status":"active"}'
test_endpoint "GET" "/api/v11/tokens/statistics" "Token statistics" "200"

# Category 8: System Endpoints (3 endpoints)
echo ""
echo -e "${BLUE}[System Health Endpoints]${NC}"
test_endpoint "GET" "/api/v11/health" "Health check" "200"
test_endpoint "GET" "/api/v11/info" "System information" "200"
test_endpoint "GET" "/api/v11/metrics" "Prometheus metrics" "200"

# Calculate statistics
echo ""
echo "======================================================================"
echo "  Test Results Summary"
echo "======================================================================"
echo ""

PASS_RATE=$(echo "scale=2; $PASSED_TESTS * 100 / $TOTAL_TESTS" | bc)
FAIL_RATE=$(echo "scale=2; $FAILED_TESTS * 100 / $TOTAL_TESTS" | bc)

# Calculate average response time
TOTAL_TIME=0
COUNT=0
for time in "${RESPONSE_TIMES[@]}"; do
    TOTAL_TIME=$(echo "$TOTAL_TIME + $time" | bc)
    COUNT=$((COUNT + 1))
done

if [ $COUNT -gt 0 ]; then
    AVG_RESPONSE_TIME=$(echo "scale=2; $TOTAL_TIME / $COUNT" | bc)
else
    AVG_RESPONSE_TIME="N/A"
fi

echo "Total Tests: $TOTAL_TESTS"
echo -e "Passed: ${GREEN}$PASSED_TESTS${NC} (${PASS_RATE}%)"
echo -e "Failed: ${RED}$FAILED_TESTS${NC} (${FAIL_RATE}%)"
echo "Average Response Time: ${AVG_RESPONSE_TIME}ms"
echo ""

# Generate detailed report
cat >> "$REPORT_FILE" << EOF
| Metric | Value |
|--------|-------|
| **Total Endpoints** | $TOTAL_TESTS |
| **Passed** | $PASSED_TESTS (${PASS_RATE}%) |
| **Failed** | $FAILED_TESTS (${FAIL_RATE}%) |
| **Average Response Time** | ${AVG_RESPONSE_TIME}ms |
| **Backend Status** | $([ $BACKEND_STATUS -eq 0 ] && echo "✅ Healthy" || echo "❌ Unavailable") |
| **Frontend Status** | $([ $FRONTEND_STATUS -eq 0 ] && echo "✅ Running" || echo "⚠️ Not Running") |

---

## Detailed Test Results

| Status | Method | Endpoint | Description | HTTP Code | Response Time | Result |
|--------|--------|----------|-------------|-----------|---------------|--------|
EOF

# Add all endpoint results to report
for result in "${ENDPOINT_RESULTS[@]}"; do
    echo "$result" | tr '|' ' | ' | awk '{print "| " $0 " |"}' >> "$REPORT_FILE"
done

# Add recommendations section
cat >> "$REPORT_FILE" << EOF

---

## Recommendations

### Critical Missing Endpoints

EOF

# Identify missing endpoints
MISSING_COUNT=0
for result in "${ENDPOINT_RESULTS[@]}"; do
    if [[ $result == *"MISSING ENDPOINT"* ]]; then
        MISSING_COUNT=$((MISSING_COUNT + 1))
        endpoint=$(echo "$result" | cut -d'|' -f3)
        description=$(echo "$result" | cut -d'|' -f4)
        echo "- **$endpoint**: $description" >> "$REPORT_FILE"
    fi
done

if [ $MISSING_COUNT -eq 0 ]; then
    echo "✅ **All endpoints are implemented!**" >> "$REPORT_FILE"
fi

cat >> "$REPORT_FILE" << EOF

### Performance Recommendations

1. **Response Time**: Average response time is ${AVG_RESPONSE_TIME}ms
   - Target: <200ms for API endpoints
   - $([ $(echo "$AVG_RESPONSE_TIME < 200" | bc -l) -eq 1 ] && echo "✅ Meeting performance targets" || echo "⚠️ Consider optimization")

2. **Error Handling**: Review failed endpoints for proper error responses

3. **API Coverage**: $(echo "scale=0; $PASSED_TESTS * 100 / 29" | bc)% of documented endpoints are working

### Next Steps

1. Implement missing endpoints (if any)
2. Add comprehensive error handling for all endpoints
3. Implement API rate limiting and throttling
4. Add API versioning support
5. Enhance API documentation with OpenAPI/Swagger

---

## Component Integration Status

### UI Components Tested

| Component | File | Status | Notes |
|-----------|------|--------|-------|
| Dashboard | \`src/pages/Dashboard.tsx\` | $(grep -q "✅.*blockchain/stats" <<< "${ENDPOINT_RESULTS[*]}" && echo "✅ Working" || echo "❌ Failing") | Depends on blockchain stats API |
| Transactions | \`src/pages/Transactions.tsx\` | $(grep -q "✅.*blockchain/transactions" <<< "${ENDPOINT_RESULTS[*]}" && echo "✅ Working" || echo "❌ Failing") | Depends on transactions API |
| ML Performance | \`src/pages/dashboards/MLPerformanceDashboard.tsx\` | ⚠️ Partial | Missing /ai/performance and /ai/confidence endpoints |
| Token Management | \`src/pages/rwa/TokenManagement.tsx\` | $(grep -q "✅.*tokens" <<< "${ENDPOINT_RESULTS[*]}" && echo "✅ Working" || echo "❌ Failing") | Depends on tokens API |

---

## Test Environment

- **Backend Version**: Aurigraph V11.4.4
- **Frontend Version**: Enterprise Portal V4.8.0
- **Test Date**: $(date '+%Y-%m-%d %H:%M:%S')
- **Test Duration**: N/A
- **Platform**: $(uname -s) $(uname -m)

---

*Generated by Enterprise Portal Integration Test Suite*
EOF

echo ""
echo "======================================================================"
echo "  Report Generated: $REPORT_FILE"
echo "======================================================================"
echo ""

# Display summary
if [ $FAILED_TESTS -eq 0 ]; then
    echo -e "${GREEN}✓ All tests passed!${NC}"
    exit 0
else
    echo -e "${YELLOW}⚠ $FAILED_TESTS tests failed${NC}"
    echo "Review $REPORT_FILE for details"
    exit 1
fi
