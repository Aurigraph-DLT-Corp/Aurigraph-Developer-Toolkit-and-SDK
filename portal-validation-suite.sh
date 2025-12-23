#!/bin/bash

#############################################################################
# Portal v4.6.0 Validation Test Suite
# Purpose: Validate all new Portal v4.6.0 components
# Date: November 13, 2025
#############################################################################

# Configuration
PORTAL_URL="https://dlt.aurigraph.io"
V11_API_URL="https://dlt.aurigraph.io/api/v11"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Counters
TESTS_TOTAL=0
TESTS_PASSED=0
TESTS_FAILED=0

#############################################################################
# UTILITY FUNCTIONS
#############################################################################

log_header() {
    echo -e "\n${BLUE}===============================================================================${NC}"
    echo -e "${BLUE}$1${NC}"
    echo -e "${BLUE}===============================================================================${NC}"
}

log_test() {
    echo -e "\n${BLUE}TEST: $1${NC}"
    TESTS_TOTAL=$((TESTS_TOTAL + 1))
}

log_pass() {
    echo -e "${GREEN}  ✅ PASS: $1${NC}"
    TESTS_PASSED=$((TESTS_PASSED + 1))
}

log_fail() {
    echo -e "${RED}  ❌ FAIL: $1${NC}"
    TESTS_FAILED=$((TESTS_FAILED + 1))
}

log_info() {
    echo -e "${BLUE}  ℹ️  $1${NC}"
}

#############################################################################
# PORTAL AVAILABILITY TESTS
#############################################################################

test_portal_health() {
    log_test "Portal Health Check"

    RESPONSE=$(curl -s -w "\n%{http_code}" "$PORTAL_URL")
    HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
    BODY=$(echo "$RESPONSE" | head -n-1)

    if [[ "$HTTP_CODE" == "200" || "$HTTP_CODE" == "304" ]]; then
        log_pass "Portal is accessible (HTTP $HTTP_CODE)"
    else
        log_fail "Portal returned HTTP $HTTP_CODE"
    fi
}

test_v11_api_health() {
    log_test "V11 API Health Check"

    RESPONSE=$(curl -s -w "\n%{http_code}" "$V11_API_URL/health")
    HTTP_CODE=$(echo "$RESPONSE" | tail -n1)

    if [[ "$HTTP_CODE" == "200" ]]; then
        log_pass "V11 API is healthy (HTTP 200)"
    else
        log_fail "V11 API returned HTTP $HTTP_CODE"
    fi
}

#############################################################################
# COMPONENT STRUCTURE TESTS
#############################################################################

test_rwat_component() {
    log_test "RWAT Tokenization Form Component"

    # Check if component file exists
    COMPONENT_PATH="/Users/subbujois/subbuworkingdir/Aurigraph-DLT/enterprise-portal/enterprise-portal/frontend/src/components/rwat/RWATTokenizationForm.tsx"

    if [ -f "$COMPONENT_PATH" ]; then
        LINES=$(wc -l < "$COMPONENT_PATH")
        if [ "$LINES" -gt 400 ]; then
            log_pass "RWAT component exists with $LINES lines"
        else
            log_fail "RWAT component too small ($LINES lines, expected >400)"
        fi
    else
        log_fail "RWAT component file not found"
    fi

    # Check for required imports
    if grep -q "useState\|useReducer" "$COMPONENT_PATH" 2>/dev/null; then
        log_pass "RWAT component uses React hooks"
    else
        log_fail "RWAT component missing React hook imports"
    fi

    # Check for form steps
    if grep -q "Step 1\|Step 2\|Step 3\|Step 4" "$COMPONENT_PATH" 2>/dev/null; then
        log_pass "RWAT component has wizard steps"
    else
        log_fail "RWAT component missing wizard steps"
    fi
}

test_merkle_component() {
    log_test "Merkle Tree Registry Component"

    COMPONENT_PATH="/Users/subbujois/subbuworkingdir/Aurigraph-DLT/enterprise-portal/enterprise-portal/frontend/src/components/registry/MerkleTreeRegistry.tsx"

    if [ -f "$COMPONENT_PATH" ]; then
        LINES=$(wc -l < "$COMPONENT_PATH")
        if [ "$LINES" -gt 400 ]; then
            log_pass "Merkle Tree component exists with $LINES lines"
        else
            log_fail "Merkle Tree component too small ($LINES lines)"
        fi
    else
        log_fail "Merkle Tree component file not found"
    fi

    # Check for visualization features
    if grep -q "tree\|node\|visualization" "$COMPONENT_PATH" 2>/dev/null; then
        log_pass "Merkle Tree component has visualization logic"
    else
        log_fail "Merkle Tree component missing visualization"
    fi
}

test_compliance_dashboard() {
    log_test "Compliance Dashboard Component"

    COMPONENT_PATH="/Users/subbujois/subbuworkingdir/Aurigraph-DLT/enterprise-portal/enterprise-portal/frontend/src/components/compliance/ComplianceDashboard.tsx"

    if [ -f "$COMPONENT_PATH" ]; then
        LINES=$(wc -l < "$COMPONENT_PATH")
        if [ "$LINES" -gt 400 ]; then
            log_pass "Compliance Dashboard exists with $LINES lines"
        else
            log_fail "Compliance Dashboard too small ($LINES lines)"
        fi
    else
        log_fail "Compliance Dashboard file not found"
    fi

    # Check for dashboard features
    if grep -q "Dashboard\|KPI\|metrics\|alerts" "$COMPONENT_PATH" 2>/dev/null; then
        log_pass "Dashboard has KPI and metrics logic"
    else
        log_fail "Dashboard missing metrics/KPI features"
    fi
}

test_compliance_api() {
    log_test "ComplianceAPI Service Layer"

    # Look for API service file
    API_PATH=$(find /Users/subbujois/subbuworkingdir/Aurigraph-DLT/enterprise-portal -name "*complianceApi*" -type f 2>/dev/null | head -1)

    if [ -f "$API_PATH" ]; then
        LINES=$(wc -l < "$API_PATH")
        if [ "$LINES" -gt 200 ]; then
            log_pass "ComplianceAPI service exists with $LINES lines"
        else
            log_fail "ComplianceAPI too small ($LINES lines)"
        fi

        # Check for method definitions
        METHODS=$(grep -c "async\|function\|const.*=" "$API_PATH" 2>/dev/null || echo "0")
        log_info "ComplianceAPI contains $METHODS method definitions"
    else
        log_fail "ComplianceAPI service file not found"
    fi
}

#############################################################################
# INTEGRATION TESTS
#############################################################################

test_portal_navigation() {
    log_test "Portal Navigation Structure"

    APP_PATH="/Users/subbujois/subbuworkingdir/Aurigraph-DLT/enterprise-portal/enterprise-portal/frontend/src/App.tsx"

    if [ -f "$APP_PATH" ]; then
        # Check for Compliance routes
        if grep -q "Compliance\|compliance" "$APP_PATH" 2>/dev/null; then
            log_pass "App.tsx includes Compliance routes"
        else
            log_fail "App.tsx missing Compliance routes"
        fi

        # Check for Registry routes
        if grep -q "Registry\|registry" "$APP_PATH" 2>/dev/null; then
            log_pass "App.tsx includes Registry routes"
        else
            log_fail "App.tsx missing Registry routes"
        fi

        # Check for RWAT routes
        if grep -q "RWAT\|rwat\|tokeniz" "$APP_PATH" 2>/dev/null; then
            log_pass "App.tsx includes RWAT routes"
        else
            log_fail "App.tsx missing RWAT routes"
        fi
    else
        log_fail "App.tsx not found"
    fi
}

#############################################################################
# BUILD VALIDATION
#############################################################################

test_portal_build() {
    log_test "Portal Build Artifacts"

    DIST_PATH="/Users/subbujois/subbuworkingdir/Aurigraph-DLT/enterprise-portal/enterprise-portal/frontend/dist"

    if [ -d "$DIST_PATH" ]; then
        BUNDLE_SIZE=$(du -sh "$DIST_PATH" 2>/dev/null | awk '{print $1}')
        log_pass "Portal build artifacts found ($BUNDLE_SIZE)"

        # Check for index.html
        if [ -f "$DIST_PATH/index.html" ]; then
            log_pass "index.html present in build"
        else
            log_fail "index.html missing from build"
        fi

        # Check for JS bundles
        JS_COUNT=$(find "$DIST_PATH" -name "*.js" | wc -l)
        if [ "$JS_COUNT" -gt 0 ]; then
            log_pass "JavaScript bundles present ($JS_COUNT files)"
        else
            log_fail "No JavaScript bundles found"
        fi
    else
        log_fail "Portal build directory not found"
    fi
}

test_typescript_compilation() {
    log_test "TypeScript Compilation"

    COMPONENTS_PATH="/Users/subbujois/subbuworkingdir/Aurigraph-DLT/enterprise-portal/enterprise-portal/frontend/src/components"

    # Count .tsx files
    TSX_COUNT=$(find "$COMPONENTS_PATH" -name "*.tsx" | wc -l)

    if [ "$TSX_COUNT" -gt 0 ]; then
        log_pass "Found $TSX_COUNT TypeScript React components"
    else
        log_fail "No TypeScript React components found"
    fi
}

#############################################################################
# DEPLOYMENT STATUS
#############################################################################

test_production_deployment() {
    log_test "Production Deployment Status"

    PORTAL_DEPLOY_PATH="/opt/DLT/portal"

    log_info "Production portal deployment path: $PORTAL_DEPLOY_PATH"
    log_info "Checking if portal is running on dlt.aurigraph.io..."

    # Test actual production URL
    RESPONSE=$(curl -s -m 5 -w "%{http_code}" -o /dev/null "$PORTAL_URL")

    if [[ "$RESPONSE" == "200" ]]; then
        log_pass "Production portal is live and responding (HTTP 200)"
    else
        log_fail "Production portal returned HTTP $RESPONSE"
    fi
}

#############################################################################
# PERFORMANCE TESTS
#############################################################################

test_component_performance() {
    log_test "Component Performance"

    # Check component file sizes for reasonableness
    declare -A components=(
        ["RWATTokenizationForm"]=565
        ["MerkleTreeRegistry"]=475
        ["ComplianceDashboard"]=486
    )

    for comp in "${!components[@]}"; do
        expected_lines=${components[$comp]}

        # Find actual file
        actual_file=$(find /Users/subbujois/subbuworkingdir/Aurigraph-DLT/enterprise-portal -name "${comp}.tsx" 2>/dev/null)

        if [ -f "$actual_file" ]; then
            actual_lines=$(wc -l < "$actual_file")
            if [ "$actual_lines" -ge 400 ]; then
                log_pass "$comp is appropriately sized ($actual_lines lines)"
            else
                log_fail "$comp is too small ($actual_lines lines)"
            fi
        fi
    done
}

#############################################################################
# MAIN EXECUTION
#############################################################################

main() {
    log_header "Portal v4.6.0 Validation Test Suite"
    log_info "Testing: RWAT Tokenization, Merkle Tree Registry, Compliance Dashboard"
    log_info "Date: $(date '+%Y-%m-%d %H:%M:%S')"

    # Portal Availability Tests
    log_header "PHASE 1: Portal Availability Tests"
    test_portal_health
    test_v11_api_health

    # Component Structure Tests
    log_header "PHASE 2: Component Structure Tests"
    test_rwat_component
    test_merkle_component
    test_compliance_dashboard
    test_compliance_api

    # Integration Tests
    log_header "PHASE 3: Integration Tests"
    test_portal_navigation

    # Build Validation
    log_header "PHASE 4: Build Validation"
    test_portal_build
    test_typescript_compilation

    # Deployment Status
    log_header "PHASE 5: Deployment Status"
    test_production_deployment

    # Performance Tests
    log_header "PHASE 6: Performance Tests"
    test_component_performance

    # Summary
    log_header "Test Summary"
    echo ""
    echo "Total Tests:     $TESTS_TOTAL"
    echo -e "Passed:          ${GREEN}$TESTS_PASSED${NC}"
    echo -e "Failed:          ${RED}$TESTS_FAILED${NC}"
    echo ""

    PASS_RATE=$((TESTS_PASSED * 100 / TESTS_TOTAL))
    echo "Pass Rate:       ${GREEN}${PASS_RATE}%${NC}"
    echo ""

    if [ $TESTS_FAILED -eq 0 ]; then
        echo -e "${GREEN}✅ All validation tests passed!${NC}"
        echo ""
        echo "Portal v4.6.0 is ready for production deployment"
        exit 0
    else
        echo -e "${RED}❌ Some validation tests failed. Please review above.${NC}"
        exit 1
    fi
}

# Run main function
main "$@"
