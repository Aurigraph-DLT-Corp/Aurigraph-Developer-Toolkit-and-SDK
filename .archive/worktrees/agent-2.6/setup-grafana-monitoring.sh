#!/bin/bash
################################################################################
# Grafana Monitoring Setup Script for Aurigraph V11
# Sprint 16 Phase 1: Grafana Infrastructure Setup
################################################################################

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
GRAFANA_URL="${GRAFANA_URL:-http://localhost:3000}"
GRAFANA_USER="${GRAFANA_USER:-admin}"
GRAFANA_PASSWORD="${GRAFANA_PASSWORD:-admin}"
PROMETHEUS_URL="${PROMETHEUS_URL:-http://localhost:9090}"
DASHBOARD_CONFIG="SPRINT-16-GRAFANA-DASHBOARDS.json"

################################################################################
# Helper Functions
################################################################################

log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

check_dependencies() {
    log_info "Checking dependencies..."

    # Check curl
    if ! command -v curl &> /dev/null; then
        log_error "curl is required but not installed"
        exit 1
    fi

    # Check jq
    if ! command -v jq &> /dev/null; then
        log_warning "jq is not installed. Installing via Homebrew..."
        brew install jq || log_error "Failed to install jq"
    fi

    # Check Python3
    if ! command -v python3 &> /dev/null; then
        log_error "python3 is required but not installed"
        exit 1
    fi

    log_success "All dependencies satisfied"
}

check_grafana_running() {
    log_info "Checking if Grafana is running..."

    if curl -s "${GRAFANA_URL}/api/health" > /dev/null 2>&1; then
        log_success "Grafana is running at ${GRAFANA_URL}"
        return 0
    else
        log_error "Grafana is not accessible at ${GRAFANA_URL}"
        log_info "Start Grafana with: brew services start grafana"
        exit 1
    fi
}

check_prometheus_running() {
    log_info "Checking if Prometheus is running..."

    if curl -s "${PROMETHEUS_URL}/api/v1/status/config" > /dev/null 2>&1; then
        log_success "Prometheus is running at ${PROMETHEUS_URL}"
        return 0
    else
        log_warning "Prometheus is not accessible at ${PROMETHEUS_URL}"
        log_info "You may need to start Prometheus or update PROMETHEUS_URL"
        return 1
    fi
}

test_grafana_auth() {
    log_info "Testing Grafana authentication..."

    RESPONSE=$(curl -s -u "${GRAFANA_USER}:${GRAFANA_PASSWORD}" \
        "${GRAFANA_URL}/api/org" 2>/dev/null)

    if echo "${RESPONSE}" | grep -q "\"id\""; then
        log_success "Authentication successful"
        return 0
    else
        log_error "Authentication failed. Response: ${RESPONSE}"
        log_info "Please update GRAFANA_USER and GRAFANA_PASSWORD environment variables"
        log_info "Or reset Grafana admin password:"
        log_info "  grafana-cli admin reset-admin-password <newpassword>"
        exit 1
    fi
}

configure_prometheus_datasource() {
    log_info "Configuring Prometheus data source..."

    # Check if data source already exists
    EXISTING_DS=$(curl -s -u "${GRAFANA_USER}:${GRAFANA_PASSWORD}" \
        "${GRAFANA_URL}/api/datasources/name/Prometheus" 2>/dev/null)

    if echo "${EXISTING_DS}" | grep -q "\"id\""; then
        log_warning "Prometheus data source already exists"
        DS_ID=$(echo "${EXISTING_DS}" | jq -r '.id')
        log_info "Existing data source ID: ${DS_ID}"
        return 0
    fi

    # Create new data source
    DATASOURCE_JSON=$(cat <<EOF
{
  "name": "Prometheus",
  "type": "prometheus",
  "url": "${PROMETHEUS_URL}",
  "access": "proxy",
  "isDefault": true,
  "jsonData": {
    "httpMethod": "POST",
    "timeInterval": "15s"
  }
}
EOF
)

    RESPONSE=$(curl -s -u "${GRAFANA_USER}:${GRAFANA_PASSWORD}" \
        -X POST \
        -H "Content-Type: application/json" \
        -d "${DATASOURCE_JSON}" \
        "${GRAFANA_URL}/api/datasources")

    if echo "${RESPONSE}" | grep -q "\"id\""; then
        log_success "Prometheus data source created successfully"
        DS_ID=$(echo "${RESPONSE}" | jq -r '.id')
        log_info "Data source ID: ${DS_ID}"
    else
        log_error "Failed to create data source. Response: ${RESPONSE}"
        exit 1
    fi
}

################################################################################
# Main Setup Function
################################################################################

main() {
    echo ""
    log_info "=========================================="
    log_info "Aurigraph V11 Grafana Monitoring Setup"
    log_info "Sprint 16 Phase 1"
    log_info "=========================================="
    echo ""

    # Step 1: Check dependencies
    check_dependencies

    # Step 2: Check if Grafana is running
    check_grafana_running

    # Step 3: Check if Prometheus is running
    check_prometheus_running

    # Step 4: Test Grafana authentication
    test_grafana_auth

    # Step 5: Configure Prometheus data source
    configure_prometheus_datasource

    echo ""
    log_success "=========================================="
    log_success "Initial Grafana Setup Complete"
    log_success "=========================================="
    echo ""
    log_info "Next steps:"
    log_info "1. Run ./import-grafana-dashboards.sh to import dashboards"
    log_info "2. Access Grafana at: ${GRAFANA_URL}"
    log_info "3. Login with: ${GRAFANA_USER}/<your-password>"
    echo ""
}

# Run main function
main "$@"
