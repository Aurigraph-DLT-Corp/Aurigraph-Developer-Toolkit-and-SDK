#!/bin/bash
# Smoke Tests for Enterprise Portal
# Tests critical endpoints and functionality

BASE_URL=${1:-"http://localhost:3000"}

echo "🧪 Running Smoke Tests against: $BASE_URL"
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m'

PASSED=0
FAILED=0

# Test function
test_endpoint() {
    local name=$1
    local url=$2
    local expected_code=${3:-200}
    
    echo -n "Testing $name... "
    
    response=$(curl -s -o /dev/null -w "%{http_code}" "$url" 2>/dev/null)
    
    if [ "$response" == "$expected_code" ]; then
        echo -e "${GREEN}✅ PASS${NC} (HTTP $response)"
        ((PASSED++))
    else
        echo -e "${RED}❌ FAIL${NC} (Expected $expected_code, got $response)"
        ((FAILED++))
    fi
}

# Test API endpoints
test_endpoint "Health Check" "https://dlt.aurigraph.io/api/v11/health" 200
test_endpoint "System Info" "https://dlt.aurigraph.io/api/v11/info" 200
test_endpoint "Performance Endpoint" "https://dlt.aurigraph.io/api/v11/performance" 200

# Test frontend availability
test_endpoint "Frontend Home" "$BASE_URL" 200
test_endpoint "Dashboard" "$BASE_URL/dashboard" 200
test_endpoint "Transactions" "$BASE_URL/transactions" 200
test_endpoint "Analytics" "$BASE_URL/analytics" 200

# Test critical API integrations
echo ""
echo "Testing API Integration..."
response=$(curl -s "https://dlt.aurigraph.io/api/v11/health" | grep -o "UP\|HEALTHY" || echo "FAILED")
if [ "$response" != "FAILED" ]; then
    echo -e "${GREEN}✅ Backend API is healthy${NC}"
    ((PASSED++))
else
    echo -e "${RED}❌ Backend API health check failed${NC}"
    ((FAILED++))
fi

# Summary
echo ""
echo "========================================"
echo "Smoke Test Summary"
echo "========================================"
echo -e "Passed: ${GREEN}$PASSED${NC}"
echo -e "Failed: ${RED}$FAILED${NC}"
echo "========================================"

if [ $FAILED -eq 0 ]; then
    echo -e "${GREEN}✅ All smoke tests passed!${NC}"
    exit 0
else
    echo -e "${RED}❌ Some tests failed!${NC}"
    exit 1
fi
