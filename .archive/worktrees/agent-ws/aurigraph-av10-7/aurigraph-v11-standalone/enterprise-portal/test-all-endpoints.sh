#!/bin/bash

################################################################################
# Aurigraph Enterprise Portal - API Endpoints Test Script
# Version: 4.8.0
# Purpose: Test all 45 API endpoints for proper functionality
# Usage: ./test-all-endpoints.sh [--verbose] [--production] [--local]
################################################################################

set -e

# Configuration
BASE_URL="${1:-https://dlt.aurigraph.io}"
if [[ "$1" == "--production" ]]; then
    BASE_URL="https://dlt.aurigraph.io"
elif [[ "$1" == "--local" ]]; then
    BASE_URL="http://localhost:5173"
fi

VERBOSE=false
if [[ "$2" == "--verbose" ]]; then
    VERBOSE=true
fi

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Statistics
TOTAL=0
PASSED=0
FAILED=0
SKIPPED=0

# Functions
print_header() {
    echo -e "\n${BLUE}================================${NC}"
    echo -e "${BLUE}$1${NC}"
    echo -e "${BLUE}================================${NC}\n"
}

print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

print_error() {
    echo -e "${RED}✗ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠ $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ $1${NC}"
}

test_endpoint() {
    local method=$1
    local endpoint=$2
    local expected_status=${3:-200}
    local description=$4

    local url="${BASE_URL}${endpoint}"
    TOTAL=$((TOTAL + 1))

    if $VERBOSE; then
        echo -n "Testing $method $endpoint ... "
    fi

    # Use -k to skip SSL verification for self-signed certs
    local response=$(curl -s -w "\n%{http_code}" -X "$method" "$url" -k 2>/dev/null)
    local http_code=$(echo "$response" | tail -1)
    local body=$(echo "$response" | sed '$d')

    if [ "$http_code" == "$expected_status" ]; then
        print_success "$method $endpoint [$http_code] - $description"
        PASSED=$((PASSED + 1))

        if $VERBOSE && [ ! -z "$body" ]; then
            # Pretty print JSON if available
            if command -v jq &> /dev/null; then
                echo "$body" | jq '.' 2>/dev/null || echo "  Response: $body" | head -c 200
            else
                echo "  Response: $body" | head -c 200
            fi
            echo ""
        fi
    else
        print_error "$method $endpoint [$http_code] - Expected: $expected_status"
        FAILED=$((FAILED + 1))

        if $VERBOSE; then
            echo "  Response: $body" | head -c 200
            echo ""
        fi
    fi
}

# Main test suite
print_header "Testing Aurigraph Enterprise Portal API Endpoints"
print_info "Base URL: $BASE_URL"
print_info "Verbose: $VERBOSE"
echo ""

# ============================================================================
# CORE API (5 endpoints)
# ============================================================================
print_header "Testing Core API (5 endpoints)"

test_endpoint "GET" "/api/v11/health" 200 "Service health check"
test_endpoint "GET" "/api/v11/info" 200 "System information"
test_endpoint "GET" "/api/v11/performance" 200 "Overall performance metrics"
test_endpoint "GET" "/api/v11/blockchain/stats" 200 "Blockchain statistics"
test_endpoint "GET" "/api/v11/tokens/statistics" 200 "Token statistics"

# ============================================================================
# BLOCKCHAIN (5 endpoints)
# ============================================================================
print_header "Testing Blockchain Endpoints (5 endpoints)"

test_endpoint "GET" "/api/v11/blockchain/metrics" 200 "Blockchain metrics"
test_endpoint "GET" "/api/v11/blocks" 200 "List blockchain blocks"
test_endpoint "GET" "/api/v11/validators" 200 "List of validators"
test_endpoint "GET" "/api/v11/validators/validator-256" 200 "Specific validator details"
test_endpoint "POST" "/api/v11/transactions" 200 "Create new transaction"

# ============================================================================
# TRANSACTIONS (2 endpoints)
# ============================================================================
print_header "Testing Transaction Endpoints (2 endpoints)"

test_endpoint "GET" "/api/v11/transactions" 200 "Get all transactions"
test_endpoint "GET" "/api/v11/transactions/tx_0x1234" 200 "Get specific transaction"

# ============================================================================
# PERFORMANCE & ANALYTICS (6 endpoints)
# ============================================================================
print_header "Testing Performance & Analytics (6 endpoints)"

test_endpoint "GET" "/api/v11/analytics" 200 "Analytics data"
test_endpoint "GET" "/api/v11/analytics/performance" 200 "Analytics performance"
test_endpoint "GET" "/api/v11/ml/metrics" 200 "ML metrics"
test_endpoint "GET" "/api/v11/ml/performance" 200 "ML performance"
test_endpoint "GET" "/api/v11/ml/predictions" 200 "ML predictions"
test_endpoint "GET" "/api/v11/ml/confidence" 200 "ML confidence scores"

# ============================================================================
# NETWORK & HEALTH (4 endpoints)
# ============================================================================
print_header "Testing Network & Health (4 endpoints)"

test_endpoint "GET" "/api/v11/network/health" 200 "Network health"
test_endpoint "GET" "/api/v11/system/config" 200 "System configuration"
test_endpoint "GET" "/api/v11/system/status" 200 "System status"
test_endpoint "GET" "/api/v11/audit-trail" 200 "Audit logs"

# ============================================================================
# TOKENS & RWA (8 endpoints)
# ============================================================================
print_header "Testing Tokens & RWA (8 endpoints)"

test_endpoint "GET" "/api/v11/tokens" 200 "Get all tokens"
test_endpoint "GET" "/api/v11/rwa/tokens" 200 "Real-world asset tokens"
test_endpoint "POST" "/api/v11/rwa/fractionalize" 200 "Fractionalize asset"
test_endpoint "GET" "/api/v11/rwa/pools" 200 "RWA pools"
test_endpoint "POST" "/api/v11/rwa/pools" 200 "Create RWA pool"
test_endpoint "PUT" "/api/v11/rwa/pools/RWA-POOL-001" 200 "Update RWA pool"
test_endpoint "DELETE" "/api/v11/rwa/pools/RWA-POOL-001" 200 "Delete RWA pool"
test_endpoint "GET" "/api/v11/rwa/fractional" 200 "Fractional tokens"

# ============================================================================
# SMART CONTRACTS (6 endpoints)
# ============================================================================
print_header "Testing Smart Contracts (6 endpoints)"

test_endpoint "GET" "/api/v11/contracts/ricardian" 200 "Ricardian contracts"
test_endpoint "POST" "/api/v11/contracts/deploy" 200 "Deploy contract"
test_endpoint "POST" "/api/v11/contracts/execute" 200 "Execute contract"
test_endpoint "POST" "/api/v11/contracts/verify" 200 "Verify contract"
test_endpoint "GET" "/api/v11/contracts/templates" 200 "Contract templates"
test_endpoint "GET" "/api/v11/channels" 200 "Channels/Subscriptions"

# ============================================================================
# MERKLE TREE (4 endpoints)
# ============================================================================
print_header "Testing Merkle Tree & Verification (4 endpoints)"

test_endpoint "GET" "/api/v11/merkle/root" 200 "Get Merkle root hash"
test_endpoint "POST" "/api/v11/merkle/proof" 200 "Generate Merkle proof"
test_endpoint "POST" "/api/v11/merkle/verify" 200 "Verify Merkle proof"
test_endpoint "GET" "/api/v11/merkle/stats" 200 "Merkle tree statistics"

# ============================================================================
# STAKING & REWARDS (3 endpoints)
# ============================================================================
print_header "Testing Staking & Rewards (3 endpoints)"

test_endpoint "GET" "/api/v11/staking/info" 200 "Staking information"
test_endpoint "POST" "/api/v11/staking/claim" 200 "Claim rewards"
test_endpoint "GET" "/api/v11/distribution/pools" 200 "Distribution pools"

# ============================================================================
# ASSET MANAGEMENT (3 endpoints)
# ============================================================================
print_header "Testing Asset Management (3 endpoints)"

test_endpoint "POST" "/api/v11/distribution/execute" 200 "Execute distribution"
test_endpoint "PUT" "/api/v11/assets/revalue" 200 "Revaluate asset"
test_endpoint "POST" "/api/v11/pools/rebalance" 200 "Rebalance pool"

# ============================================================================
# AGGREGATION POOLS (3 endpoints)
# ============================================================================
print_header "Testing Aggregation Pools (3 endpoints)"

test_endpoint "GET" "/api/v11/aggregation/pools" 200 "Get aggregation pools"
test_endpoint "POST" "/api/v11/aggregation/pools" 200 "Create aggregation pool"
test_endpoint "DELETE" "/api/v11/aggregation/AGG-001" 200 "Delete aggregation pool"

# ============================================================================
# DEMO (1 endpoint)
# ============================================================================
print_header "Testing Demo Endpoint (1 endpoint)"

test_endpoint "GET" "/api/v11/demos" 200 "Demo data"

# ============================================================================
# SUMMARY
# ============================================================================
print_header "Test Results Summary"

echo -e "Total Endpoints Tested:  ${BLUE}$TOTAL${NC}"
echo -e "Passed:                  ${GREEN}$PASSED${NC}"
echo -e "Failed:                  ${RED}$FAILED${NC}"
echo -e "Skipped:                 ${YELLOW}$SKIPPED${NC}"
echo ""

# Calculate percentage
if [ $TOTAL -gt 0 ]; then
    PERCENTAGE=$((PASSED * 100 / TOTAL))
    echo -e "Success Rate:            ${BLUE}${PERCENTAGE}%${NC}"
fi

echo ""

# Exit code based on results
if [ $FAILED -eq 0 ]; then
    print_success "All endpoints are functioning correctly!"
    exit 0
else
    print_error "Some endpoints failed. Please review above."
    exit 1
fi
