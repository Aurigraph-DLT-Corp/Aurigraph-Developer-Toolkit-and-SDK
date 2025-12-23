#!/bin/bash

# Oracle Service Integration Verification Script
# Tests all backend API integrations for OracleService.tsx

set -e

echo "=================================================="
echo "Oracle Service Integration Verification"
echo "=================================================="
echo ""

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test counters
TESTS_PASSED=0
TESTS_FAILED=0

# Function to test API endpoint
test_api() {
    local name=$1
    local url=$2
    local expected_field=$3

    echo -n "Testing $name... "

    if response=$(curl -s -w "\n%{http_code}" "$url"); then
        http_code=$(echo "$response" | tail -n1)
        body=$(echo "$response" | sed '$d')

        if [ "$http_code" = "200" ]; then
            if echo "$body" | jq -e "$expected_field" > /dev/null 2>&1; then
                echo -e "${GREEN}✓ PASSED${NC}"
                TESTS_PASSED=$((TESTS_PASSED + 1))
                return 0
            else
                echo -e "${RED}✗ FAILED${NC} - Expected field '$expected_field' not found"
                TESTS_FAILED=$((TESTS_FAILED + 1))
                return 1
            fi
        else
            echo -e "${RED}✗ FAILED${NC} - HTTP $http_code"
            TESTS_FAILED=$((TESTS_FAILED + 1))
            return 1
        fi
    else
        echo -e "${RED}✗ FAILED${NC} - Connection error"
        TESTS_FAILED=$((TESTS_FAILED + 1))
        return 1
    fi
}

# Test 1: Oracle Status API
echo "1. Backend API Tests"
echo "-------------------"
test_api "Oracle Status API" \
    "http://localhost:9003/api/v11/oracles/status" \
    ".oracles"

test_api "Price Feeds API" \
    "http://localhost:9003/api/v11/datafeeds/prices" \
    ".prices"

echo ""

# Test 2: Data Structure Validation
echo "2. Data Structure Validation"
echo "----------------------------"

echo -n "Validating oracle status structure... "
if oracle_data=$(curl -s http://localhost:9003/api/v11/oracles/status); then
    required_fields=(".oracles" ".summary.total_oracles" ".summary.active_oracles" ".health_score")
    all_present=true

    for field in "${required_fields[@]}"; do
        if ! echo "$oracle_data" | jq -e "$field" > /dev/null 2>&1; then
            echo -e "${RED}✗ FAILED${NC} - Missing field: $field"
            all_present=false
            TESTS_FAILED=$((TESTS_FAILED + 1))
            break
        fi
    done

    if [ "$all_present" = true ]; then
        echo -e "${GREEN}✓ PASSED${NC}"
        TESTS_PASSED=$((TESTS_PASSED + 1))
    fi
else
    echo -e "${RED}✗ FAILED${NC} - Could not fetch data"
    TESTS_FAILED=$((TESTS_FAILED + 1))
fi

echo -n "Validating price feeds structure... "
if price_data=$(curl -s http://localhost:9003/api/v11/datafeeds/prices); then
    required_fields=(".prices" ".sources" ".prices[0].asset_symbol" ".prices[0].price_usd")
    all_present=true

    for field in "${required_fields[@]}"; do
        if ! echo "$price_data" | jq -e "$field" > /dev/null 2>&1; then
            echo -e "${RED}✗ FAILED${NC} - Missing field: $field"
            all_present=false
            TESTS_FAILED=$((TESTS_FAILED + 1))
            break
        fi
    done

    if [ "$all_present" = true ]; then
        echo -e "${GREEN}✓ PASSED${NC}"
        TESTS_PASSED=$((TESTS_PASSED + 1))
    fi
else
    echo -e "${RED}✗ FAILED${NC} - Could not fetch data"
    TESTS_FAILED=$((TESTS_FAILED + 1))
fi

echo ""

# Test 3: Code Quality Checks
echo "3. Code Quality Checks"
echo "---------------------"

echo -n "Checking for dummy data... "
if grep -q "Math.random\|dummy\|placeholder\|simulated" src/pages/dashboards/OracleService.tsx 2>/dev/null; then
    echo -e "${RED}✗ FAILED${NC} - Dummy data found in code"
    TESTS_FAILED=$((TESTS_FAILED + 1))
else
    echo -e "${GREEN}✓ PASSED${NC}"
    TESTS_PASSED=$((TESTS_PASSED + 1))
fi

echo -n "Checking API integrations... "
if grep -q "axios.get.*'/api/v11/oracles/status'" src/pages/dashboards/OracleService.tsx && \
   grep -q "axios.get.*'/api/v11/datafeeds/prices'" src/pages/dashboards/OracleService.tsx; then
    echo -e "${GREEN}✓ PASSED${NC}"
    TESTS_PASSED=$((TESTS_PASSED + 1))
else
    echo -e "${RED}✗ FAILED${NC} - API integrations not found"
    TESTS_FAILED=$((TESTS_FAILED + 1))
fi

echo -n "Checking real-time polling... "
if grep -q "setInterval.*5000\|setInterval.*10000" src/pages/dashboards/OracleService.tsx; then
    echo -e "${GREEN}✓ PASSED${NC}"
    TESTS_PASSED=$((TESTS_PASSED + 1))
else
    echo -e "${RED}✗ FAILED${NC} - Real-time polling not configured"
    TESTS_FAILED=$((TESTS_FAILED + 1))
fi

echo -n "Checking error handling... "
if grep -q "catch.*err" src/pages/dashboards/OracleService.tsx && \
   grep -q "setError" src/pages/dashboards/OracleService.tsx; then
    echo -e "${GREEN}✓ PASSED${NC}"
    TESTS_PASSED=$((TESTS_PASSED + 1))
else
    echo -e "${RED}✗ FAILED${NC} - Error handling not implemented"
    TESTS_FAILED=$((TESTS_FAILED + 1))
fi

echo ""

# Test 4: TypeScript Compilation
echo "4. TypeScript Compilation"
echo "------------------------"

echo -n "Building TypeScript code... "
if npm run build > /tmp/oracle-build.log 2>&1; then
    echo -e "${GREEN}✓ PASSED${NC}"
    TESTS_PASSED=$((TESTS_PASSED + 1))
else
    echo -e "${RED}✗ FAILED${NC}"
    echo "Build log:"
    tail -20 /tmp/oracle-build.log
    TESTS_FAILED=$((TESTS_FAILED + 1))
fi

echo ""

# Test 5: Real Data Samples
echo "5. Real Data Samples"
echo "-------------------"

echo "Oracle Status Sample:"
curl -s http://localhost:9003/api/v11/oracles/status | jq -c '{
    total_oracles: .summary.total_oracles,
    active: .summary.active_oracles,
    health_score: .health_score,
    first_oracle: .oracles[0].oracle_name
}'

echo ""
echo "Price Feeds Sample:"
curl -s http://localhost:9003/api/v11/datafeeds/prices | jq -c '{
    price_count: (.prices | length),
    source_count: (.sources | length),
    btc_price: .prices[0].price_usd,
    eth_price: .prices[1].price_usd
}'

echo ""
echo "=================================================="
echo "Test Results Summary"
echo "=================================================="
echo -e "Tests Passed: ${GREEN}$TESTS_PASSED${NC}"
echo -e "Tests Failed: ${RED}$TESTS_FAILED${NC}"
echo "Total Tests: $((TESTS_PASSED + TESTS_FAILED))"

if [ $TESTS_FAILED -eq 0 ]; then
    echo -e "${GREEN}All tests passed!${NC}"
    exit 0
else
    echo -e "${RED}Some tests failed!${NC}"
    exit 1
fi
