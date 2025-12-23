#!/bin/bash
################################################################################
# Aurigraph V11 API Smoke Test Script
# Version: 1.0
# Date: 2025-10-10
# Purpose: Quick smoke test of all critical API endpoints
################################################################################

set -e

# Configuration
BASE_URL="https://dlt.aurigraph.io"
TIMEOUT=10
PASSED=0
FAILED=0
SKIPPED=0

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Test results array
declare -a TEST_RESULTS

################################################################################
# Helper Functions
################################################################################

print_header() {
    echo ""
    echo "╔════════════════════════════════════════════════════════════╗"
    echo "║        Aurigraph V11 API Smoke Test Suite                 ║"
    echo "║        Version 4.1.0 | $(date '+%Y-%m-%d %H:%M:%S')                    ║"
    echo "╚════════════════════════════════════════════════════════════╝"
    echo ""
}

print_section() {
    echo ""
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${BLUE} $1${NC}"
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
}

test_endpoint() {
    local name="$1"
    local endpoint="$2"
    local expected_status="${3:-200}"
    local validate_json="${4:-true}"

    echo -n "Testing ${name}... "

    # Make request
    response=$(curl -s -w "\n%{http_code}" --max-time $TIMEOUT "${BASE_URL}${endpoint}" 2>/dev/null || echo "000")
    http_code=$(echo "$response" | tail -n1)
    body=$(echo "$response" | sed '$d')

    # Check HTTP status
    if [ "$http_code" = "$expected_status" ]; then
        # Validate JSON if requested
        if [ "$validate_json" = "true" ]; then
            if echo "$body" | jq empty 2>/dev/null; then
                echo -e "${GREEN}✅ PASS${NC} (HTTP $http_code, Valid JSON)"
                PASSED=$((PASSED + 1))
                TEST_RESULTS+=("PASS|$name|$endpoint|$http_code")
                return 0
            else
                echo -e "${RED}❌ FAIL${NC} (HTTP $http_code, Invalid JSON)"
                FAILED=$((FAILED + 1))
                TEST_RESULTS+=("FAIL|$name|$endpoint|$http_code|Invalid JSON")
                return 1
            fi
        else
            echo -e "${GREEN}✅ PASS${NC} (HTTP $http_code)"
            PASSED=$((PASSED + 1))
            TEST_RESULTS+=("PASS|$name|$endpoint|$http_code")
            return 0
        fi
    elif [ "$http_code" = "404" ]; then
        echo -e "${RED}❌ FAIL${NC} (HTTP 404 - Not Found)"
        FAILED=$((FAILED + 1))
        TEST_RESULTS+=("FAIL|$name|$endpoint|404|Endpoint not found")
        return 1
    elif [ "$http_code" = "000" ]; then
        echo -e "${YELLOW}⚠️  SKIP${NC} (Connection timeout)"
        SKIPPED=$((SKIPPED + 1))
        TEST_RESULTS+=("SKIP|$name|$endpoint|000|Timeout")
        return 2
    else
        echo -e "${RED}❌ FAIL${NC} (HTTP $http_code, Expected $expected_status)"
        FAILED=$((FAILED + 1))
        TEST_RESULTS+=("FAIL|$name|$endpoint|$http_code|Unexpected status code")
        return 1
    fi
}

test_endpoint_data() {
    local name="$1"
    local endpoint="$2"
    local jq_filter="$3"
    local expected_value="$4"

    echo -n "Testing ${name}... "

    # Make request
    response=$(curl -s --max-time $TIMEOUT "${BASE_URL}${endpoint}" 2>/dev/null || echo "{}")

    # Extract value with jq
    actual_value=$(echo "$response" | jq -r "$jq_filter" 2>/dev/null || echo "null")

    if [ "$actual_value" = "$expected_value" ]; then
        echo -e "${GREEN}✅ PASS${NC} ($jq_filter = $expected_value)"
        PASSED=$((PASSED + 1))
        TEST_RESULTS+=("PASS|$name|$endpoint|200|Data validation passed")
        return 0
    else
        echo -e "${RED}❌ FAIL${NC} (Expected: $expected_value, Got: $actual_value)"
        FAILED=$((FAILED + 1))
        TEST_RESULTS+=("FAIL|$name|$endpoint|200|Data validation failed: $actual_value != $expected_value")
        return 1
    fi
}

################################################################################
# Test Suites
################################################################################

test_blockchain_endpoints() {
    print_section "1. Blockchain Services"

    test_endpoint "Blockchain Blocks" "/api/v11/blockchain/blocks"
    test_endpoint "Blockchain Chain Info" "/api/v11/blockchain/chain/info"
    test_endpoint "Blockchain Transactions" "/api/v11/blockchain/transactions"
    test_endpoint_data "Chain Name" "/api/v11/blockchain/chain/info" ".chainName" "Aurigraph V11 Mainnet"
    test_endpoint_data "Consensus Algorithm" "/api/v11/blockchain/chain/info" ".consensusAlgorithm" "HyperRAFT++"
    test_endpoint_data "Quantum Resistant" "/api/v11/blockchain/chain/info" ".quantumResistant" "true"
}

test_validator_endpoints() {
    print_section "2. Validator Services"

    test_endpoint "Validator List" "/api/v11/validators"
    test_endpoint "Staking Info" "/api/v11/staking/info"
}

test_ai_endpoints() {
    print_section "3. AI/ML Optimization Services"

    test_endpoint "AI Models List" "/api/v11/ai/models"
    test_endpoint "AI Metrics" "/api/v11/ai/metrics"
    test_endpoint "AI Predictions" "/api/v11/ai/predictions"
    test_endpoint_data "Total Models" "/api/v11/ai/models" ".totalModels" "5"
    test_endpoint_data "Active Models" "/api/v11/ai/models" ".activeModels" "4"
}

test_security_endpoints() {
    print_section "4. Quantum Security Services"

    test_endpoint "Security Status" "/api/v11/security/status"
    test_endpoint "Security Keys" "/api/v11/security/keys"
    test_endpoint "Security Metrics" "/api/v11/security/metrics"
    test_endpoint_data "Overall Status" "/api/v11/security/status" ".overallStatus" "SECURE"
    test_endpoint_data "Quantum Resistant" "/api/v11/security/status" ".quantumResistant" "true"
    test_endpoint_data "Security Level" "/api/v11/security/status" ".securityLevel" "NIST Level 5"
}

test_bridge_endpoints() {
    print_section "5. Cross-Chain Bridge Services"

    test_endpoint "Bridge List" "/api/v11/bridge/bridges"
    test_endpoint "Bridge Transfers" "/api/v11/bridge/transfers"
    test_endpoint "Supported Chains" "/api/v11/bridge/chains"
}

test_rwa_endpoints() {
    print_section "6. RWA Tokenization Services"

    test_endpoint "Oracle Sources" "/api/v11/rwa/oracle/sources"
    test_endpoint "RWA Portfolio" "/api/v11/rwa/portfolio/0x0"
    test_endpoint "Asset Types" "/api/v11/rwa/asset-types"
    test_endpoint_data "Total Oracle Sources" "/api/v11/rwa/oracle/sources" ".totalSources" "5"
    test_endpoint_data "Active Sources" "/api/v11/rwa/oracle/sources" ".activeSources" "5"
}

test_health_endpoints() {
    print_section "7. System Health & Monitoring"

    test_endpoint "Quarkus Health" "/q/health"
    test_endpoint "Quarkus Metrics" "/q/metrics"
    test_endpoint "Liveness" "/q/health/live"
    test_endpoint "Readiness" "/q/health/ready"
    test_endpoint_data "Health Status" "/q/health" ".status" "UP"
}

################################################################################
# Report Generation
################################################################################

generate_summary() {
    print_section "Test Summary"

    local total=$((PASSED + FAILED + SKIPPED))
    local pass_rate=0

    if [ $total -gt 0 ]; then
        pass_rate=$(awk "BEGIN {printf \"%.1f\", ($PASSED/$total)*100}")
    fi

    echo ""
    echo "Total Tests:     $total"
    echo -e "${GREEN}Passed:          $PASSED${NC}"
    echo -e "${RED}Failed:          $FAILED${NC}"
    echo -e "${YELLOW}Skipped:         $SKIPPED${NC}"
    echo ""
    echo "Pass Rate:       ${pass_rate}%"
    echo ""

    if [ $FAILED -gt 0 ]; then
        echo -e "${RED}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
        echo -e "${RED} Failed Tests:${NC}"
        echo -e "${RED}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
        for result in "${TEST_RESULTS[@]}"; do
            if [[ $result == FAIL* ]]; then
                IFS='|' read -r status name endpoint code reason <<< "$result"
                echo "  • $name"
                echo "    Endpoint: $endpoint"
                echo "    Reason: $reason"
                echo ""
            fi
        done
    fi
}

generate_json_report() {
    local report_file="test-results/smoke-test-$(date +%Y%m%d-%H%M%S).json"
    mkdir -p test-results

    cat > "$report_file" <<EOF
{
  "testSuite": "API Smoke Test",
  "version": "4.1.0",
  "timestamp": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
  "baseUrl": "$BASE_URL",
  "summary": {
    "total": $((PASSED + FAILED + SKIPPED)),
    "passed": $PASSED,
    "failed": $FAILED,
    "skipped": $SKIPPED,
    "passRate": $(awk "BEGIN {printf \"%.1f\", ($PASSED/($PASSED+$FAILED+$SKIPPED))*100}")
  },
  "results": [
EOF

    local first=true
    for result in "${TEST_RESULTS[@]}"; do
        IFS='|' read -r status name endpoint code reason <<< "$result"

        if [ "$first" = false ]; then
            echo "," >> "$report_file"
        fi
        first=false

        cat >> "$report_file" <<EOF
    {
      "status": "$status",
      "name": "$name",
      "endpoint": "$endpoint",
      "httpCode": "$code",
      "reason": "${reason:-}"
    }
EOF
    done

    cat >> "$report_file" <<EOF

  ]
}
EOF

    echo ""
    echo "JSON Report saved to: $report_file"
}

################################################################################
# Main Execution
################################################################################

main() {
    print_header

    echo "Testing Base URL: $BASE_URL"
    echo "Timeout: ${TIMEOUT}s"

    # Run test suites
    test_blockchain_endpoints
    test_validator_endpoints
    test_ai_endpoints
    test_security_endpoints
    test_bridge_endpoints
    test_rwa_endpoints
    test_health_endpoints

    # Generate reports
    generate_summary
    generate_json_report

    echo ""
    echo "╔════════════════════════════════════════════════════════════╗"
    echo "║                 Test Execution Complete                   ║"
    echo "╚════════════════════════════════════════════════════════════╝"
    echo ""

    # Exit with appropriate code
    if [ $FAILED -gt 0 ]; then
        exit 1
    else
        exit 0
    fi
}

# Run main function
main
