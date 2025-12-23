#!/bin/bash

##############################################################################
# Enterprise Portal - Automated Test Suite
# Version: 1.0
# Date: October 16, 2025
# Description: Comprehensive automated testing for landing page deployment
##############################################################################

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Test configuration
PROD_URL="http://dlt.aurigraph.io"
API_URL="http://dlt.aurigraph.io:9003/api/v11"
TEST_RESULTS_DIR="/tmp/test-results-$(date +%Y%m%d-%H%M%S)"

# Counters
TOTAL_TESTS=0
PASSED_TESTS=0
FAILED_TESTS=0

# Create test results directory
mkdir -p "$TEST_RESULTS_DIR"

##############################################################################
# Helper Functions
##############################################################################

test_header() {
    echo ""
    echo -e "${BLUE}═══════════════════════════════════════════════════════${NC}"
    echo -e "${BLUE}  $1${NC}"
    echo -e "${BLUE}═══════════════════════════════════════════════════════${NC}"
}

test_section() {
    echo ""
    echo -e "${YELLOW}→ $1${NC}"
}

test_pass() {
    ((TOTAL_TESTS++))
    ((PASSED_TESTS++))
    echo -e "${GREEN}✓ PASS${NC}: $1"
}

test_fail() {
    ((TOTAL_TESTS++))
    ((FAILED_TESTS++))
    echo -e "${RED}✗ FAIL${NC}: $1"
    echo "$1" >> "$TEST_RESULTS_DIR/failures.log"
}

test_info() {
    echo -e "${BLUE}ℹ INFO${NC}: $1"
}

##############################################################################
# Test Cases
##############################################################################

test_header "TC-001: Landing Page - HTML Loading"

test_section "Checking HTML response"
HTTP_STATUS=$(curl -s -o "$TEST_RESULTS_DIR/index.html" -w "%{http_code}" "$PROD_URL/")
if [ "$HTTP_STATUS" = "200" ]; then
    test_pass "HTML loads with HTTP 200"
else
    test_fail "HTML failed with HTTP $HTTP_STATUS"
fi

HTML_SIZE=$(wc -c < "$TEST_RESULTS_DIR/index.html")
if [ "$HTML_SIZE" -gt 500 ]; then
    test_pass "HTML size is valid ($HTML_SIZE bytes)"
else
    test_fail "HTML size too small ($HTML_SIZE bytes)"
fi

if grep -q '<div id="root">' "$TEST_RESULTS_DIR/index.html"; then
    test_pass "React root div present"
else
    test_fail "React root div missing"
fi

if grep -q 'Aurigraph Enterprise Portal' "$TEST_RESULTS_DIR/index.html"; then
    test_pass "Page title correct"
else
    test_fail "Page title incorrect"
fi

##############################################################################
test_header "TC-002: Asset Loading - JavaScript Bundles"

test_section "Checking JavaScript assets"

# Extract JS bundle names from HTML (macOS compatible)
JS_FILES=$(grep -o 'src="/assets/[^"]*\.js"' "$TEST_RESULTS_DIR/index.html" | sed 's/src="//g' | sed 's/"//g')

for js_file in $JS_FILES; do
    JS_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$PROD_URL$js_file")
    JS_SIZE=$(curl -s "$PROD_URL$js_file" | wc -c)

    if [ "$JS_STATUS" = "200" ]; then
        test_pass "JS bundle loads: $js_file (HTTP $JS_STATUS, ${JS_SIZE} bytes)"
    else
        test_fail "JS bundle failed: $js_file (HTTP $JS_STATUS)"
    fi
done

##############################################################################
test_header "TC-003: Asset Loading - CSS Stylesheets"

test_section "Checking CSS assets"

CSS_FILES=$(grep -o 'href="/assets/[^"]*\.css"' "$TEST_RESULTS_DIR/index.html" | sed 's/href="//g' | sed 's/"//g')

for css_file in $CSS_FILES; do
    CSS_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$PROD_URL$css_file")
    CSS_SIZE=$(curl -s "$PROD_URL$css_file" | wc -c)

    if [ "$CSS_STATUS" = "200" ]; then
        test_pass "CSS loads: $css_file (HTTP $CSS_STATUS, ${CSS_SIZE} bytes)"
    else
        test_fail "CSS failed: $css_file (HTTP $CSS_STATUS)"
    fi

    # Download CSS for content verification
    if [ "$CSS_STATUS" = "200" ]; then
        curl -s "$PROD_URL$css_file" > "$TEST_RESULTS_DIR/styles.css"
    fi
done

# Verify dropdown transparency fix in CSS (check for both rgba and hex formats)
if [ -f "$TEST_RESULTS_DIR/styles.css" ]; then
    if grep -E -q "rgba\(255, 255, 255, 0\.95\)|#fffffff2|rgba\(255,255,255,\.95\)" "$TEST_RESULTS_DIR/styles.css"; then
        test_pass "Dropdown transparency fix (95% opacity) present in CSS"
    else
        test_fail "Dropdown transparency fix missing"
    fi

    if grep -q "backdrop-filter" "$TEST_RESULTS_DIR/styles.css"; then
        test_pass "Backdrop blur effect present in CSS"
    else
        test_fail "Backdrop blur effect missing"
    fi
fi

##############################################################################
test_header "TC-004: Landing Page Content Verification"

test_section "Checking for landing page components in bundle"

MAIN_JS=$(grep -o 'src="/assets/index-[^"]*\.js"' "$TEST_RESULTS_DIR/index.html" | sed 's/src="//g' | sed 's/"//g' | head -1)
curl -s "$PROD_URL$MAIN_JS" > "$TEST_RESULTS_DIR/main-bundle.js"

# Check for landing page components (check if file was downloaded)
if [ -f "$TEST_RESULTS_DIR/main-bundle.js" ] && [ -s "$TEST_RESULTS_DIR/main-bundle.js" ]; then
    if grep -q "hero-section" "$TEST_RESULTS_DIR/main-bundle.js"; then
        test_pass "Hero section component found in bundle"
    else
        test_fail "Hero section component missing from bundle"
    fi

    if grep -E -q "performance-metrics|metric-card" "$TEST_RESULTS_DIR/main-bundle.js"; then
        test_pass "Performance metrics component found in bundle"
    else
        test_fail "Performance metrics component missing from bundle"
    fi

    if grep -q "blockchain-grid" "$TEST_RESULTS_DIR/main-bundle.js"; then
        test_pass "Animated blockchain grid found in bundle"
    else
        test_fail "Animated blockchain grid missing from bundle"
    fi
else
    test_fail "Main bundle JS file not downloaded or empty"
fi

##############################################################################
test_header "TC-005: Backend API Health Check"

test_section "Checking V11 backend endpoints"

# Health endpoint (follow redirects)
HEALTH_STATUS=$(curl -s -L -o "$TEST_RESULTS_DIR/health.json" -w "%{http_code}" "$API_URL/health")
if [ "$HEALTH_STATUS" = "200" ]; then
    test_pass "Health endpoint responds (HTTP $HEALTH_STATUS)"

    if grep -q '"status":"UP"' "$TEST_RESULTS_DIR/health.json"; then
        test_pass "Backend status is UP"
    else
        test_fail "Backend status is not UP"
    fi
else
    test_fail "Health endpoint failed (HTTP $HEALTH_STATUS)"
fi

# Info endpoint (follow redirects)
INFO_STATUS=$(curl -s -L -o "$TEST_RESULTS_DIR/info.json" -w "%{http_code}" "$API_URL/info")
if [ "$INFO_STATUS" = "200" ]; then
    test_pass "Info endpoint responds (HTTP $INFO_STATUS)"
else
    test_fail "Info endpoint failed (HTTP $INFO_STATUS)"
fi

# Stats endpoint (follow redirects)
STATS_STATUS=$(curl -s -L -o "$TEST_RESULTS_DIR/stats.json" -w "%{http_code}" "$API_URL/stats")
if [ "$STATS_STATUS" = "200" ]; then
    test_pass "Stats endpoint responds (HTTP $STATS_STATUS)"
else
    test_fail "Stats endpoint failed (HTTP $STATS_STATUS)"
fi

##############################################################################
test_header "TC-006: Performance Testing"

test_section "Measuring page load performance"

PERF_OUTPUT=$(curl -s -o /dev/null -w "DNS: %{time_namelookup}s\nConnect: %{time_connect}s\nTotal: %{time_total}s\nSize: %{size_download} bytes\n" "$PROD_URL/")
echo "$PERF_OUTPUT" > "$TEST_RESULTS_DIR/performance.log"

TOTAL_TIME=$(echo "$PERF_OUTPUT" | grep "Total:" | awk '{print $2}' | sed 's/s//g')
if (( $(echo "$TOTAL_TIME < 3" | bc -l) )); then
    test_pass "Page load time is acceptable (${TOTAL_TIME}s < 3s)"
else
    test_fail "Page load time too slow (${TOTAL_TIME}s >= 3s)"
fi

##############################################################################
test_header "TC-007: Security Headers Check"

test_section "Checking security headers"

HEADERS=$(curl -s -I "$PROD_URL/" > "$TEST_RESULTS_DIR/headers.txt")

if grep -iq "X-Frame-Options" "$TEST_RESULTS_DIR/headers.txt"; then
    test_pass "X-Frame-Options header present"
else
    test_fail "X-Frame-Options header missing"
fi

if grep -iq "X-Content-Type-Options" "$TEST_RESULTS_DIR/headers.txt"; then
    test_pass "X-Content-Type-Options header present"
else
    test_fail "X-Content-Type-Options header missing"
fi

if grep -iq "X-XSS-Protection" "$TEST_RESULTS_DIR/headers.txt"; then
    test_pass "X-XSS-Protection header present"
else
    test_fail "X-XSS-Protection header missing"
fi

##############################################################################
test_header "TC-008: RWAT Registry Component Check"

test_section "Verifying RWAT Registry in bundle"

if [ -f "$TEST_RESULTS_DIR/main-bundle.js" ] && [ -s "$TEST_RESULTS_DIR/main-bundle.js" ]; then
    if grep -E -q "rwat|RWAT|Real-World Asset" "$TEST_RESULTS_DIR/main-bundle.js"; then
        test_pass "RWAT Registry component found in bundle"
    else
        test_fail "RWAT Registry component missing from bundle"
    fi
else
    test_fail "Main bundle JS not available for RWAT check"
fi

##############################################################################
test_header "TC-009: Responsive Design Assets"

test_section "Checking CSS media queries"

if grep -q "@media" "$TEST_RESULTS_DIR/styles.css"; then
    test_pass "Responsive media queries present"

    MEDIA_COUNT=$(grep -c "@media" "$TEST_RESULTS_DIR/styles.css")
    test_info "Found $MEDIA_COUNT media query definitions"
else
    test_fail "No responsive media queries found"
fi

##############################################################################
test_header "TC-010: Animation Keyframes Check"

test_section "Verifying CSS animations"

if grep -q "@keyframes" "$TEST_RESULTS_DIR/styles.css"; then
    test_pass "CSS animations present"

    ANIMATION_COUNT=$(grep -c "@keyframes" "$TEST_RESULTS_DIR/styles.css")
    test_info "Found $ANIMATION_COUNT animation definitions"
else
    test_fail "CSS animations missing"
fi

if grep -E -q "gridMove|pulse|fadeIn" "$TEST_RESULTS_DIR/styles.css"; then
    test_pass "Landing page animations (gridMove, pulse, fadeIn) present"
else
    test_fail "Landing page animations missing"
fi

##############################################################################
# Test Summary
##############################################################################

test_header "TEST EXECUTION SUMMARY"

echo ""
echo -e "${BLUE}Test Results Directory:${NC} $TEST_RESULTS_DIR"
echo ""
echo -e "${BLUE}Total Tests:${NC}     $TOTAL_TESTS"
echo -e "${GREEN}Passed:${NC}          $PASSED_TESTS"
echo -e "${RED}Failed:${NC}          $FAILED_TESTS"
echo ""

if [ $FAILED_TESTS -eq 0 ]; then
    echo -e "${GREEN}═══════════════════════════════════════════════════════${NC}"
    echo -e "${GREEN}  ✓ ALL TESTS PASSED - DEPLOYMENT SUCCESSFUL${NC}"
    echo -e "${GREEN}═══════════════════════════════════════════════════════${NC}"
    exit 0
else
    echo -e "${RED}═══════════════════════════════════════════════════════${NC}"
    echo -e "${RED}  ✗ SOME TESTS FAILED - CHECK LOGS${NC}"
    echo -e "${RED}═══════════════════════════════════════════════════════${NC}"
    echo ""
    echo -e "${YELLOW}Failed tests:${NC}"
    cat "$TEST_RESULTS_DIR/failures.log"
    exit 1
fi
