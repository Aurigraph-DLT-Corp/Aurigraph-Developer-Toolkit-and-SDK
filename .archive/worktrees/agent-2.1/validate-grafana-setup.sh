#!/bin/bash
################################################################################
# Grafana Setup Validation Script for Aurigraph V11
# Sprint 16 Phase 1: Validate all 49 panels and 24 alerts
################################################################################

set -e

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Counters
TOTAL_CHECKS=0
PASSED_CHECKS=0
FAILED_CHECKS=0

log_check() {
    TOTAL_CHECKS=$((TOTAL_CHECKS + 1))
    echo -e "${BLUE}[CHECK $TOTAL_CHECKS]${NC} $1"
}

log_pass() {
    PASSED_CHECKS=$((PASSED_CHECKS + 1))
    echo -e "${GREEN}  ✓ PASS${NC} $1"
}

log_fail() {
    FAILED_CHECKS=$((FAILED_CHECKS + 1))
    echo -e "${RED}  ✗ FAIL${NC} $1"
}

log_info() {
    echo -e "${BLUE}  ℹ INFO${NC} $1"
}

################################################################################
# Validation Functions
################################################################################

check_service() {
    local name=$1
    local url=$2

    log_check "Checking if $name is running..."

    if curl -s -f "$url" > /dev/null 2>&1; then
        log_pass "$name is accessible at $url"
        return 0
    else
        log_fail "$name is NOT accessible at $url"
        return 1
    fi
}

check_prometheus_metrics() {
    log_check "Checking Prometheus metrics collection..."

    local metrics_url="http://localhost:9090/api/v1/targets"
    local response=$(curl -s "$metrics_url")

    if echo "$response" | grep -q '"status":"success"'; then
        log_pass "Prometheus is collecting metrics"

        # Check if V11 backend is being scraped
        if echo "$response" | grep -q "aurigraph-v11\|blockchain-node"; then
            log_pass "Aurigraph V11 metrics are being scraped"
        else
            log_fail "Aurigraph V11 is NOT being scraped by Prometheus"
        fi
    else
        log_fail "Prometheus API returned error"
    fi
}

check_grafana_auth() {
    log_check "Checking Grafana authentication..."

    local auth_test=$(curl -s -u "${GRAFANA_USER:-admin}:${GRAFANA_PASSWORD:-admin}" \
        http://localhost:3000/api/org 2>/dev/null)

    if echo "$auth_test" | grep -q '"id"'; then
        log_pass "Grafana authentication successful"
        return 0
    else
        log_fail "Grafana authentication failed"
        log_info "Set GRAFANA_USER and GRAFANA_PASSWORD environment variables"
        return 1
    fi
}

check_data_source() {
    log_check "Checking Prometheus data source in Grafana..."

    local ds_test=$(curl -s -u "${GRAFANA_USER:-admin}:${GRAFANA_PASSWORD:-admin}" \
        http://localhost:3000/api/datasources/name/Prometheus 2>/dev/null)

    if echo "$ds_test" | grep -q '"id"'; then
        log_pass "Prometheus data source configured"
        local ds_id=$(echo "$ds_test" | python3 -c "import sys, json; print(json.load(sys.stdin).get('id', 'unknown'))")
        log_info "Data source ID: $ds_id"
        return 0
    else
        log_fail "Prometheus data source NOT configured"
        return 1
    fi
}

check_dashboards() {
    log_check "Checking imported dashboards..."

    local dashboards=$(curl -s -u "${GRAFANA_USER:-admin}:${GRAFANA_PASSWORD:-admin}" \
        http://localhost:3000/api/search?type=dash-db 2>/dev/null)

    local dashboard_count=$(echo "$dashboards" | python3 -c "import sys, json; print(len(json.load(sys.stdin)))" 2>/dev/null || echo "0")

    log_info "Found $dashboard_count dashboards"

    # Check for specific Aurigraph dashboards
    local expected_dashboards=(
        "Blockchain Network Overview"
        "Validator Performance"
        "AI & ML Optimization"
        "System & Infrastructure Health"
        "Real-World Assets & Tokenization"
    )

    local found=0
    for dashboard_name in "${expected_dashboards[@]}"; do
        if echo "$dashboards" | grep -q "$dashboard_name"; then
            log_pass "Dashboard found: $dashboard_name"
            found=$((found + 1))
        else
            log_fail "Dashboard NOT found: $dashboard_name"
        fi
    done

    log_info "Dashboards imported: $found/5"

    if [ $found -eq 5 ]; then
        return 0
    else
        return 1
    fi
}

check_v11_backend() {
    log_check "Checking Aurigraph V11 backend metrics endpoint..."

    if curl -s http://localhost:9003/q/metrics > /dev/null 2>&1; then
        log_pass "V11 backend metrics endpoint accessible"

        # Count available metrics
        local metric_count=$(curl -s http://localhost:9003/q/metrics | grep -c "^[a-z]" || echo "0")
        log_info "Available metrics: $metric_count"

        return 0
    else
        log_fail "V11 backend NOT accessible on port 9003"
        log_info "Start V11 backend: cd aurigraph-av10-7/aurigraph-v11-standalone && ./mvnw quarkus:dev"
        return 1
    fi
}

check_alert_rules() {
    log_check "Checking alert rule configuration..."

    local alert_file="grafana-alert-rules.yml"

    if [ -f "$alert_file" ]; then
        log_pass "Alert rules file exists: $alert_file"

        # Count alert rules
        local critical_alerts=$(grep -c 'severity: critical' "$alert_file" || echo "0")
        local warning_alerts=$(grep -c 'severity: warning' "$alert_file" || echo "0")
        local info_alerts=$(grep -c 'severity: info' "$alert_file" || echo "0")
        local total_alerts=$((critical_alerts + warning_alerts + info_alerts))

        log_info "Critical alerts: $critical_alerts"
        log_info "Warning alerts: $warning_alerts"
        log_info "Info alerts: $info_alerts"
        log_info "Total alerts: $total_alerts"

        if [ $total_alerts -ge 24 ]; then
            log_pass "All 24 alert rules defined"
            return 0
        else
            log_fail "Expected 24 alerts, found $total_alerts"
            return 1
        fi
    else
        log_fail "Alert rules file not found: $alert_file"
        return 1
    fi
}

check_dashboard_config() {
    log_check "Validating dashboard configuration file..."

    local config_file="SPRINT-16-GRAFANA-DASHBOARDS.json"

    if [ -f "$config_file" ]; then
        log_pass "Dashboard config file exists: $config_file"

        # Validate JSON syntax
        if python3 -m json.tool "$config_file" > /dev/null 2>&1; then
            log_pass "JSON syntax is valid"

            # Extract metadata
            local total_dashboards=$(python3 -c "import json; data=json.load(open('$config_file')); print(data['metadata']['totalDashboards'])")
            local total_panels=$(python3 -c "import json; data=json.load(open('$config_file')); print(data['metadata']['totalPanels'])")
            local total_alerts=$(python3 -c "import json; data=json.load(open('$config_file')); print(data['metadata']['totalAlerts'])")

            log_info "Total dashboards: $total_dashboards"
            log_info "Total panels: $total_panels"
            log_info "Total alerts: $total_alerts"

            if [ "$total_panels" -eq 49 ] && [ "$total_dashboards" -eq 5 ] && [ "$total_alerts" -eq 24 ]; then
                log_pass "Dashboard configuration is complete (5 dashboards, 49 panels, 24 alerts)"
                return 0
            else
                log_fail "Dashboard configuration incomplete"
                return 1
            fi
        else
            log_fail "Invalid JSON syntax in $config_file"
            return 1
        fi
    else
        log_fail "Dashboard config file not found: $config_file"
        return 1
    fi
}

################################################################################
# Main Validation
################################################################################

main() {
    echo ""
    echo -e "${BLUE}============================================${NC}"
    echo -e "${BLUE}  Grafana Setup Validation - Sprint 16     ${NC}"
    echo -e "${BLUE}  Aurigraph V11 Monitoring Infrastructure  ${NC}"
    echo -e "${BLUE}============================================${NC}"
    echo ""

    # Service checks
    check_service "Grafana" "http://localhost:3000/api/health"
    check_service "Prometheus" "http://localhost:9090/-/healthy"
    check_v11_backend

    echo ""

    # Configuration checks
    check_dashboard_config
    check_alert_rules

    echo ""

    # Integration checks
    check_grafana_auth && {
        check_data_source
        check_dashboards
    }
    check_prometheus_metrics

    echo ""
    echo -e "${BLUE}============================================${NC}"
    echo -e "${BLUE}  Validation Summary                       ${NC}"
    echo -e "${BLUE}============================================${NC}"
    echo -e "Total checks:  ${TOTAL_CHECKS}"
    echo -e "Passed:        ${GREEN}${PASSED_CHECKS}${NC}"
    echo -e "Failed:        ${RED}${FAILED_CHECKS}${NC}"

    if [ $FAILED_CHECKS -eq 0 ]; then
        echo ""
        echo -e "${GREEN}✓ ALL CHECKS PASSED!${NC}"
        echo -e "${GREEN}Grafana monitoring setup is complete and validated.${NC}"
        echo ""
        echo -e "Access dashboards at: ${BLUE}http://localhost:3000${NC}"
        echo ""
        return 0
    else
        echo ""
        echo -e "${YELLOW}⚠ SOME CHECKS FAILED${NC}"
        echo -e "${YELLOW}Review the failed checks above and take corrective action.${NC}"
        echo ""
        echo -e "Common fixes:"
        echo -e "  1. Start services: ${BLUE}brew services start grafana prometheus${NC}"
        echo -e "  2. Start V11 backend: ${BLUE}cd aurigraph-av10-7/aurigraph-v11-standalone && ./mvnw quarkus:dev${NC}"
        echo -e "  3. Import dashboards: ${BLUE}python3 import-grafana-dashboards.py${NC}"
        echo -e "  4. Set credentials: ${BLUE}export GRAFANA_PASSWORD=your-password${NC}"
        echo ""
        return 1
    fi
}

# Run validation
main "$@"
