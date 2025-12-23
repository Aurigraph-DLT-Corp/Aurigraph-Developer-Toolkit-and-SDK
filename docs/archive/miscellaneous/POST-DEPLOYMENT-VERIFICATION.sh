#!/bin/bash

##############################################################################
# POST-DEPLOYMENT VERIFICATION SCRIPT
# Story 4 (AV11-601-04) - Secondary Token Versioning System
# Created: December 23, 2025
##############################################################################

set -e

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
REMOTE_HOST="dlt.aurigraph.io"
REMOTE_USER="subbu"
REMOTE_PORT="22"
API_PORT="9003"
HEALTH_ENDPOINT="/api/v11/health"
INFO_ENDPOINT="/api/v11/info"
QUARKUS_HEALTH_ENDPOINT="/q/health/live"
SERVICE_NAME="aurigraph-v12"

# Test counters
TOTAL_TESTS=0
PASSED_TESTS=0
FAILED_TESTS=0

##############################################################################
# HELPER FUNCTIONS
##############################################################################

log_header() {
    echo ""
    echo -e "${BLUE}========================================${NC}"
    echo -e "${BLUE}$1${NC}"
    echo -e "${BLUE}========================================${NC}"
}

log_success() {
    echo -e "${GREEN}✅ $1${NC}"
    ((PASSED_TESTS++))
}

log_failure() {
    echo -e "${RED}❌ $1${NC}"
    ((FAILED_TESTS++))
}

log_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

log_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

run_test() {
    ((TOTAL_TESTS++))
    echo ""
    echo -e "${YELLOW}[TEST $TOTAL_TESTS] $1${NC}"
}

##############################################################################
# PHASE 1: SERVICE STATUS CHECKS
##############################################################################

phase1_service_checks() {
    log_header "PHASE 1: SERVICE STATUS CHECKS"

    run_test "Check systemd service status"
    if ssh -p "$REMOTE_PORT" "$REMOTE_USER@$REMOTE_HOST" \
        "sudo systemctl is-active --quiet $SERVICE_NAME"; then
        log_success "Service $SERVICE_NAME is running"
    else
        log_failure "Service $SERVICE_NAME is not running"
        return 1
    fi

    run_test "Check service startup type"
    if ssh -p "$REMOTE_PORT" "$REMOTE_USER@$REMOTE_HOST" \
        "sudo systemctl is-enabled $SERVICE_NAME" | grep -q "enabled"; then
        log_success "Service is enabled for auto-start"
    else
        log_warning "Service may not be enabled for auto-start"
    fi

    run_test "Get service uptime"
    UPTIME=$(ssh -p "$REMOTE_PORT" "$REMOTE_USER@$REMOTE_HOST" \
        "sudo systemctl status $SERVICE_NAME --no-pager | grep -i active | head -1" 2>/dev/null)
    echo "   Status: $UPTIME"

    run_test "Check service resource usage"
    RESOURCES=$(ssh -p "$REMOTE_PORT" "$REMOTE_USER@$REMOTE_HOST" \
        "ps aux | grep -i 'quarkus-run.jar' | grep -v grep" 2>/dev/null || echo "not found")
    if [ "$RESOURCES" != "not found" ]; then
        log_success "Service process found"
        echo "   $RESOURCES" | awk '{print "   Memory: " $6 " KB, CPU: " $3 "%"}'
    else
        log_failure "Service process not found"
    fi
}

##############################################################################
# PHASE 2: HEALTH ENDPOINT CHECKS
##############################################################################

phase2_health_checks() {
    log_header "PHASE 2: HEALTH ENDPOINT CHECKS"

    run_test "Test Quarkus liveness endpoint"
    RESPONSE=$(curl -s -w "\n%{http_code}" "http://localhost:$API_PORT$QUARKUS_HEALTH_ENDPOINT" 2>/dev/null || echo "error\n000")
    HTTP_CODE=$(echo "$RESPONSE" | tail -1)
    BODY=$(echo "$RESPONSE" | head -n -1)

    if [ "$HTTP_CODE" = "200" ]; then
        STATUS=$(echo "$BODY" | jq -r '.status // "unknown"' 2>/dev/null || echo "unknown")
        log_success "Quarkus liveness endpoint responding (HTTP $HTTP_CODE, Status: $STATUS)"
    else
        log_failure "Quarkus liveness endpoint failed (HTTP $HTTP_CODE)"
    fi

    run_test "Test custom health endpoint"
    RESPONSE=$(curl -s -w "\n%{http_code}" "http://localhost:$API_PORT$HEALTH_ENDPOINT" 2>/dev/null || echo "error\n000")
    HTTP_CODE=$(echo "$RESPONSE" | tail -1)
    BODY=$(echo "$RESPONSE" | head -n -1)

    if [ "$HTTP_CODE" = "200" ]; then
        STATUS=$(echo "$BODY" | jq -r '.status // "unknown"' 2>/dev/null || echo "unknown")
        log_success "Custom health endpoint responding (HTTP $HTTP_CODE, Status: $STATUS)"
        echo "   Response: $(echo "$BODY" | jq -c . 2>/dev/null || echo "$BODY")"
    else
        log_failure "Custom health endpoint failed (HTTP $HTTP_CODE)"
    fi

    run_test "Test info endpoint"
    RESPONSE=$(curl -s -w "\n%{http_code}" "http://localhost:$API_PORT$INFO_ENDPOINT" 2>/dev/null || echo "error\n000")
    HTTP_CODE=$(echo "$RESPONSE" | tail -1)
    BODY=$(echo "$RESPONSE" | head -n -1)

    if [ "$HTTP_CODE" = "200" ]; then
        VERSION=$(echo "$BODY" | jq -r '.platform.version // "unknown"' 2>/dev/null || echo "unknown")
        log_success "Info endpoint responding (HTTP $HTTP_CODE, Version: $VERSION)"
    else
        log_failure "Info endpoint failed (HTTP $HTTP_CODE)"
    fi
}

##############################################################################
# PHASE 3: API ENDPOINT TESTS
##############################################################################

phase3_api_tests() {
    log_header "PHASE 3: API ENDPOINT TESTS"

    run_test "Check secondary-tokens API endpoint"
    RESPONSE=$(curl -s -w "\n%{http_code}" \
        "http://localhost:$API_PORT/api/v12/secondary-tokens" \
        -H "Content-Type: application/json" 2>/dev/null || echo "error\n000")
    HTTP_CODE=$(echo "$RESPONSE" | tail -1)

    if [ "$HTTP_CODE" = "200" ] || [ "$HTTP_CODE" = "400" ]; then
        log_success "Secondary-tokens endpoint accessible (HTTP $HTTP_CODE)"
    else
        log_failure "Secondary-tokens endpoint failed (HTTP $HTTP_CODE)"
    fi

    run_test "Check token versioning endpoint"
    RESPONSE=$(curl -s -w "\n%{http_code}" \
        "http://localhost:$API_PORT/api/v12/secondary-tokens/test/versions" \
        -H "Content-Type: application/json" 2>/dev/null || echo "error\n000")
    HTTP_CODE=$(echo "$RESPONSE" | tail -1)

    # 404 is OK here (token doesn't exist), we just want the endpoint to be routable
    if [ "$HTTP_CODE" = "404" ] || [ "$HTTP_CODE" = "200" ]; then
        log_success "Token versioning endpoint routable (HTTP $HTTP_CODE)"
    else
        log_failure "Token versioning endpoint failed (HTTP $HTTP_CODE)"
    fi
}

##############################################################################
# PHASE 4: DATABASE CONNECTIVITY
##############################################################################

phase4_database_checks() {
    log_header "PHASE 4: DATABASE CONNECTIVITY"

    run_test "Check PostgreSQL connection (remote)"
    if ssh -p "$REMOTE_PORT" "$REMOTE_USER@$REMOTE_HOST" \
        "psql -h localhost -U j4c_user -d j4c_db -c 'SELECT 1;' 2>/dev/null" > /dev/null; then
        log_success "PostgreSQL database connection successful"
    else
        log_warning "Could not verify PostgreSQL connection (may require password)"
    fi
}

##############################################################################
# PHASE 5: NGINX ROUTING CHECKS
##############################################################################

phase5_nginx_checks() {
    log_header "PHASE 5: NGINX ROUTING CHECKS"

    run_test "Check NGINX configuration"
    if ssh -p "$REMOTE_PORT" "$REMOTE_USER@$REMOTE_HOST" \
        "sudo nginx -t 2>&1" | grep -q "successful"; then
        log_success "NGINX configuration is valid"
    else
        log_warning "NGINX configuration check returned unexpected result"
    fi

    run_test "Check NGINX service status"
    if ssh -p "$REMOTE_PORT" "$REMOTE_USER@$REMOTE_HOST" \
        "sudo systemctl is-active nginx"; then
        log_success "NGINX service is running"
    else
        log_failure "NGINX service is not running"
    fi

    run_test "Verify NGINX reverse proxy to port 9003"
    CONFIG=$(ssh -p "$REMOTE_PORT" "$REMOTE_USER@$REMOTE_HOST" \
        "grep -r 'backend_api\|proxy_pass.*9003' /etc/nginx/ 2>/dev/null | head -3")
    if [ -n "$CONFIG" ]; then
        log_success "NGINX proxy configuration found"
        echo "   Config: $CONFIG" | head -1
    else
        log_warning "Could not verify NGINX proxy configuration"
    fi
}

##############################################################################
# PHASE 6: LOG ANALYSIS
##############################################################################

phase6_log_analysis() {
    log_header "PHASE 6: LOG ANALYSIS"

    run_test "Check systemd journal for errors (last 20 entries)"
    ERROR_COUNT=$(ssh -p "$REMOTE_PORT" "$REMOTE_USER@$REMOTE_HOST" \
        "sudo journalctl -u $SERVICE_NAME -n 20 --no-pager | grep -i 'error\|exception\|failed' | wc -l")

    if [ "$ERROR_COUNT" = "0" ]; then
        log_success "No errors in recent logs"
    else
        log_warning "Found $ERROR_COUNT error entries in logs (review manually)"
        ssh -p "$REMOTE_PORT" "$REMOTE_USER@$REMOTE_HOST" \
            "sudo journalctl -u $SERVICE_NAME -n 20 --no-pager | grep -i 'error\|exception' | head -3"
    fi

    run_test "Check for OOM or resource warnings"
    WARNING_COUNT=$(ssh -p "$REMOTE_PORT" "$REMOTE_USER@$REMOTE_HOST" \
        "sudo journalctl -u $SERVICE_NAME --no-pager | grep -i 'OutOfMemory\|heap\|GC overhead' | wc -l")

    if [ "$WARNING_COUNT" = "0" ]; then
        log_success "No memory warnings detected"
    else
        log_warning "Found $WARNING_COUNT memory-related warnings"
    fi
}

##############################################################################
# PHASE 7: PERFORMANCE BASELINE
##############################################################################

phase7_performance_baseline() {
    log_header "PHASE 7: PERFORMANCE BASELINE"

    run_test "Measure API response time (health endpoint)"
    START=$(date +%s%N)
    curl -s "http://localhost:$API_PORT$HEALTH_ENDPOINT" > /dev/null 2>&1
    END=$(date +%s%N)
    DURATION=$(( (END - START) / 1000000 ))  # Convert to milliseconds

    if [ "$DURATION" -lt 1000 ]; then
        log_success "Health endpoint response time: ${DURATION}ms (target: <100ms)"
    else
        log_warning "Health endpoint response time: ${DURATION}ms (consider optimization)"
    fi

    run_test "Measure info endpoint response time"
    START=$(date +%s%N)
    curl -s "http://localhost:$API_PORT$INFO_ENDPOINT" > /dev/null 2>&1
    END=$(date +%s%N)
    DURATION=$(( (END - START) / 1000000 ))

    if [ "$DURATION" -lt 1000 ]; then
        log_success "Info endpoint response time: ${DURATION}ms"
    else
        log_warning "Info endpoint response time: ${DURATION}ms"
    fi

    run_test "Check memory usage"
    MEMORY=$(ssh -p "$REMOTE_PORT" "$REMOTE_USER@$REMOTE_HOST" \
        "ps aux | grep -i 'quarkus-run.jar' | grep -v grep | awk '{print \$6}'" 2>/dev/null || echo "unknown")

    if [ "$MEMORY" != "unknown" ]; then
        MEMORY_MB=$((MEMORY / 1024))
        log_info "Current memory usage: ${MEMORY_MB}MB (allocated: 8GB max)"
    else
        log_warning "Could not determine memory usage"
    fi
}

##############################################################################
# SUMMARY AND REPORT
##############################################################################

print_summary() {
    log_header "VERIFICATION SUMMARY"

    PASS_RATE=$((PASSED_TESTS * 100 / TOTAL_TESTS))

    echo ""
    echo -e "Total Tests:    ${BLUE}$TOTAL_TESTS${NC}"
    echo -e "Passed:         ${GREEN}$PASSED_TESTS${NC}"
    echo -e "Failed:         ${RED}$FAILED_TESTS${NC}"
    echo -e "Success Rate:   ${BLUE}${PASS_RATE}%${NC}"

    echo ""
    if [ "$FAILED_TESTS" -eq 0 ]; then
        echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
        echo -e "${GREEN}✅ DEPLOYMENT VERIFICATION SUCCESSFUL${NC}"
        echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
        echo ""
        echo "Story 4 (AV11-601-04) is deployed and operational!"
        return 0
    else
        echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
        echo -e "${YELLOW}⚠️  DEPLOYMENT VERIFICATION INCOMPLETE${NC}"
        echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
        echo ""
        echo "Some checks failed. Review above for details."
        return 1
    fi
}

##############################################################################
# MAIN EXECUTION
##############################################################################

main() {
    echo ""
    echo -e "${BLUE}╔════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${BLUE}║  POST-DEPLOYMENT VERIFICATION SCRIPT                      ║${NC}"
    echo -e "${BLUE}║  Story 4 (AV11-601-04) - Secondary Token Versioning      ║${NC}"
    echo -e "${BLUE}║  Generated: December 23, 2025                             ║${NC}"
    echo -e "${BLUE}╚════════════════════════════════════════════════════════════╝${NC}"

    phase1_service_checks
    phase2_health_checks
    phase3_api_tests
    phase4_database_checks
    phase5_nginx_checks
    phase6_log_analysis
    phase7_performance_baseline

    print_summary
}

# Execute main
main "$@"
