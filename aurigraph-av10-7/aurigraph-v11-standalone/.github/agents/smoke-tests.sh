#!/bin/bash
#
# QA/QC J4C Agent - Post-Deployment Smoke Tests
# Run after every deployment to verify system health
#
# Usage: ./smoke-tests.sh [BASE_URL]
#   BASE_URL: Target URL (default: https://dlt.aurigraph.io)
#

set -e

BASE_URL="${1:-https://dlt.aurigraph.io}"
PASSED=0
FAILED=0
WARNINGS=0

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log_pass() { echo -e "${GREEN}✅ $1${NC}"; PASSED=$((PASSED + 1)); }
log_fail() { echo -e "${RED}❌ $1${NC}"; FAILED=$((FAILED + 1)); }
log_warn() { echo -e "${YELLOW}⚠️  $1${NC}"; WARNINGS=$((WARNINGS + 1)); }
log_info() { echo -e "${BLUE}ℹ️  $1${NC}"; }

test_endpoint() {
    local name="$1"
    local url="$2"
    local expected_status="${3:-200}"

    STATUS=$(curl -s -o /dev/null -w "%{http_code}" --max-time 10 "$url" 2>/dev/null || echo "000")

    if [ "$STATUS" = "$expected_status" ]; then
        log_pass "$name (HTTP $STATUS)"
        return 0
    elif [ "$STATUS" = "000" ]; then
        log_fail "$name (TIMEOUT)"
        return 1
    else
        log_fail "$name (HTTP $STATUS, expected $expected_status)"
        return 1
    fi
}

test_json_field() {
    local name="$1"
    local url="$2"
    local field="$3"

    RESPONSE=$(curl -sf --max-time 10 "$url" 2>/dev/null || echo "{}")

    if echo "$RESPONSE" | grep -q "$field"; then
        log_pass "$name (field '$field' found)"
        return 0
    else
        log_fail "$name (field '$field' not found)"
        return 1
    fi
}

echo ""
echo "╔══════════════════════════════════════════════════════════════╗"
echo "║        QA/QC J4C Agent - Post-Deployment Smoke Tests         ║"
echo "╠══════════════════════════════════════════════════════════════╣"
echo "║  Target: $BASE_URL"
echo "║  Time:   $(date)"
echo "║  Agent:  QAA (Quality Assurance Agent)"
echo "╚══════════════════════════════════════════════════════════════╝"
echo ""

# ============================================================
# SECTION 1: Health Endpoints (Critical)
# ============================================================
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "SECTION 1: Health Endpoints (Critical)"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

test_endpoint "Quarkus Health" "$BASE_URL/q/health"
test_endpoint "API v12 Info" "$BASE_URL/api/v12/info"
test_endpoint "API v11 Health" "$BASE_URL/api/v11/health" || true

# ============================================================
# SECTION 2: Core API Endpoints
# ============================================================
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "SECTION 2: Core API Endpoints"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

test_endpoint "Composite Tokens" "$BASE_URL/api/v12/composite-tokens"
test_endpoint "Active Contracts" "$BASE_URL/api/v12/activecontracts"
test_endpoint "Contract Library" "$BASE_URL/api/v12/contractlibrary"
test_endpoint "Node Topology" "$BASE_URL/api/v12/topology/nodes"

# ============================================================
# SECTION 3: Demo Management API (NEW - Dec 2025)
# ============================================================
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "SECTION 3: Demo Management API"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

test_endpoint "List Demos (v11)" "$BASE_URL/api/v11/demos"
test_endpoint "List Demos (v12)" "$BASE_URL/api/v12/demos"
test_endpoint "Active Demos" "$BASE_URL/api/v11/demos/active"

# ============================================================
# SECTION 4: EI Node Tests (Renamed from Slim - Dec 2025)
# ============================================================
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "SECTION 4: External Integration (EI) Node Tests"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Test topology stats for eiCount field
test_json_field "Topology Stats (eiCount)" "$BASE_URL/api/v12/topology/stats" "eiCount"

# Test EI node type query
test_endpoint "EI Node Query" "$BASE_URL/api/v12/topology/nodes?type=EI"

# Test backward compatibility with SLIM
test_endpoint "SLIM Backward Compat" "$BASE_URL/api/v12/topology/nodes?type=SLIM"

# ============================================================
# SECTION 5: Authentication Bypass (Public Endpoints)
# ============================================================
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "SECTION 5: Public Endpoint Access (No Auth)"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

test_endpoint "Demo Public Access (v11)" "$BASE_URL/api/v11/demos"
test_endpoint "Demo Public Access (v12)" "$BASE_URL/api/v12/demos"
test_endpoint "Channels Public Access" "$BASE_URL/api/v11/channels"

# ============================================================
# SECTION 6: Performance Validation
# ============================================================
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "SECTION 6: Performance Validation"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Measure response time
START=$(date +%s%N)
curl -sf "$BASE_URL/api/v12/info" > /dev/null 2>&1
END=$(date +%s%N)
RESPONSE_TIME=$(( (END - START) / 1000000 ))

if [ $RESPONSE_TIME -lt 100 ]; then
    log_pass "API Response Time: ${RESPONSE_TIME}ms (< 100ms)"
elif [ $RESPONSE_TIME -lt 500 ]; then
    log_warn "API Response Time: ${RESPONSE_TIME}ms (< 500ms)"
else
    log_fail "API Response Time: ${RESPONSE_TIME}ms (> 500ms)"
fi

# ============================================================
# SUMMARY
# ============================================================
echo ""
echo "╔══════════════════════════════════════════════════════════════╗"
echo "║                     SMOKE TEST SUMMARY                       ║"
echo "╠══════════════════════════════════════════════════════════════╣"
TOTAL=$((PASSED + FAILED))
SUCCESS_RATE=$(( (PASSED * 100) / TOTAL ))
echo "║  Passed:   $PASSED"
echo "║  Failed:   $FAILED"
echo "║  Warnings: $WARNINGS"
echo "║  Total:    $TOTAL"
echo "║  Success:  ${SUCCESS_RATE}%"
echo "╚══════════════════════════════════════════════════════════════╝"
echo ""

if [ $FAILED -eq 0 ]; then
    echo -e "${GREEN}🎉 All smoke tests passed!${NC}"
    exit 0
elif [ $SUCCESS_RATE -ge 80 ]; then
    echo -e "${YELLOW}⚠️  Some tests failed but success rate is acceptable (${SUCCESS_RATE}%)${NC}"
    exit 0
else
    echo -e "${RED}❌ Too many tests failed (${SUCCESS_RATE}% success rate)${NC}"
    exit 1
fi
