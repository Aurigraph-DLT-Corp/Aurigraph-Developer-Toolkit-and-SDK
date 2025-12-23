#!/bin/bash

################################################################################
# Monitoring Stack Health Check Script
# Sprint 16 Phase 2: Production Infrastructure Deployment
################################################################################

set -u  # Exit on undefined variable

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Configuration
REMOTE_HOST="${1:-dlt.aurigraph.io}"
REMOTE_USER="${2:-subbu}"
REMOTE_PORT="${3:-2235}"

# Health check results
TOTAL_CHECKS=0
PASSED_CHECKS=0
FAILED_CHECKS=0
WARNING_CHECKS=0

# Functions
print_header() {
    echo -e "${BLUE}================================${NC}"
    echo -e "${BLUE}$1${NC}"
    echo -e "${BLUE}================================${NC}"
}

check_pass() {
    echo -e "${GREEN}✓ $1${NC}"
    ((PASSED_CHECKS++))
    ((TOTAL_CHECKS++))
}

check_fail() {
    echo -e "${RED}✗ $1${NC}"
    ((FAILED_CHECKS++))
    ((TOTAL_CHECKS++))
}

check_warn() {
    echo -e "${YELLOW}⚠ $1${NC}"
    ((WARNING_CHECKS++))
    ((TOTAL_CHECKS++))
}

print_info() { echo -e "${BLUE}ℹ $1${NC}"; }

# Execute remote command
remote_exec() {
    ssh -p ${REMOTE_PORT} ${REMOTE_USER}@${REMOTE_HOST} "$1" 2>/dev/null
}

# Check SSH connectivity
check_ssh() {
    print_header "Connectivity Check"

    if remote_exec "echo 'OK'" | grep -q "OK"; then
        check_pass "SSH connectivity to ${REMOTE_HOST}"
    else
        check_fail "Cannot connect via SSH to ${REMOTE_HOST}"
        return 1
    fi
}

# Check Docker service
check_docker() {
    print_header "Docker Service Check"

    if remote_exec "systemctl is-active docker" | grep -q "active"; then
        check_pass "Docker service is running"
    else
        check_fail "Docker service is not running"
    fi

    # Check Docker version
    DOCKER_VERSION=$(remote_exec "docker --version" | awk '{print $3}' | tr -d ',')
    if [ -n "${DOCKER_VERSION}" ]; then
        check_pass "Docker version: ${DOCKER_VERSION}"
    else
        check_warn "Could not determine Docker version"
    fi
}

# Check container status
check_containers() {
    print_header "Container Status Check"

    CONTAINERS=("aurigraph-prometheus" "aurigraph-grafana" "aurigraph-alertmanager" "aurigraph-node-exporter")

    for CONTAINER in "${CONTAINERS[@]}"; do
        STATUS=$(remote_exec "docker inspect -f '{{.State.Status}}' ${CONTAINER} 2>/dev/null || echo 'not found'")

        if [ "${STATUS}" = "running" ]; then
            check_pass "${CONTAINER}: running"

            # Check restart count
            RESTARTS=$(remote_exec "docker inspect -f '{{.RestartCount}}' ${CONTAINER} 2>/dev/null || echo '0'")
            if [ "${RESTARTS}" -gt 5 ]; then
                check_warn "${CONTAINER}: ${RESTARTS} restarts (investigate if high)"
            fi
        elif [ "${STATUS}" = "not found" ]; then
            check_warn "${CONTAINER}: not deployed"
        else
            check_fail "${CONTAINER}: ${STATUS}"
        fi
    done
}

# Check Prometheus health
check_prometheus() {
    print_header "Prometheus Health Check"

    # Check if Prometheus is responding
    HTTP_CODE=$(remote_exec "curl -s -o /dev/null -w '%{http_code}' http://localhost:9090/-/healthy")

    if [ "${HTTP_CODE}" = "200" ]; then
        check_pass "Prometheus HTTP health endpoint: 200 OK"
    else
        check_fail "Prometheus HTTP health endpoint: ${HTTP_CODE}"
    fi

    # Check Prometheus ready state
    READY=$(remote_exec "curl -s http://localhost:9090/-/ready" | grep -o "Prometheus Server is Ready" || echo "")
    if [ -n "${READY}" ]; then
        check_pass "Prometheus is ready"
    else
        check_fail "Prometheus is not ready"
    fi

    # Check active targets
    TARGETS=$(remote_exec "curl -s http://localhost:9090/api/v1/targets 2>/dev/null | jq -r '.data.activeTargets | length' 2>/dev/null || echo '0'")
    if [ "${TARGETS}" -gt 0 ]; then
        check_pass "Prometheus active targets: ${TARGETS}"
    else
        check_warn "No active Prometheus targets found"
    fi

    # Check failed targets
    FAILED_TARGETS=$(remote_exec "curl -s http://localhost:9090/api/v1/targets 2>/dev/null | jq -r '[.data.activeTargets[] | select(.health != \"up\")] | length' 2>/dev/null || echo '0'")
    if [ "${FAILED_TARGETS}" -gt 0 ]; then
        check_warn "Failed Prometheus targets: ${FAILED_TARGETS}"
    fi

    # Check storage usage
    STORAGE_SIZE=$(remote_exec "du -sh /opt/aurigraph/monitoring/prometheus/data 2>/dev/null | awk '{print \$1}' || echo 'unknown'")
    check_pass "Prometheus storage size: ${STORAGE_SIZE}"
}

# Check Grafana health
check_grafana() {
    print_header "Grafana Health Check"

    # Check if Grafana is responding
    HTTP_CODE=$(remote_exec "curl -s -o /dev/null -w '%{http_code}' http://localhost:3000/api/health")

    if [ "${HTTP_CODE}" = "200" ]; then
        check_pass "Grafana HTTP health endpoint: 200 OK"
    else
        check_fail "Grafana HTTP health endpoint: ${HTTP_CODE}"
    fi

    # Check Grafana version
    GRAFANA_VERSION=$(remote_exec "curl -s http://localhost:3000/api/health 2>/dev/null | jq -r '.version' 2>/dev/null || echo 'unknown'")
    if [ "${GRAFANA_VERSION}" != "unknown" ] && [ "${GRAFANA_VERSION}" != "null" ]; then
        check_pass "Grafana version: ${GRAFANA_VERSION}"
    else
        check_warn "Could not determine Grafana version"
    fi

    # Check datasources
    DATASOURCES=$(remote_exec "curl -s -u admin:aurigraph_admin_2025 http://localhost:3000/api/datasources 2>/dev/null | jq '. | length' 2>/dev/null || echo '0'")
    if [ "${DATASOURCES}" -gt 0 ]; then
        check_pass "Grafana datasources configured: ${DATASOURCES}"
    else
        check_warn "No Grafana datasources configured"
    fi

    # Check dashboards
    DASHBOARDS=$(remote_exec "curl -s -u admin:aurigraph_admin_2025 http://localhost:3000/api/search 2>/dev/null | jq '. | length' 2>/dev/null || echo '0'")
    if [ "${DASHBOARDS}" -gt 0 ]; then
        check_pass "Grafana dashboards loaded: ${DASHBOARDS}"
    else
        check_warn "No Grafana dashboards found"
    fi
}

# Check NGINX configuration
check_nginx() {
    print_header "NGINX Configuration Check"

    # Check if NGINX is running
    if remote_exec "systemctl is-active nginx" | grep -q "active"; then
        check_pass "NGINX service is running"
    else
        check_fail "NGINX service is not running"
    fi

    # Check NGINX configuration syntax
    if remote_exec "nginx -t 2>&1" | grep -q "successful"; then
        check_pass "NGINX configuration syntax is valid"
    else
        check_fail "NGINX configuration has errors"
    fi

    # Check monitoring endpoint via NGINX
    HTTP_CODE=$(remote_exec "curl -s -o /dev/null -w '%{http_code}' http://localhost/monitoring/health 2>/dev/null")
    if [ "${HTTP_CODE}" = "200" ]; then
        check_pass "NGINX monitoring endpoint: 200 OK"
    else
        check_warn "NGINX monitoring endpoint: ${HTTP_CODE}"
    fi
}

# Check SSL certificates
check_ssl() {
    print_header "SSL Certificate Check"

    # Check if certificate exists
    if remote_exec "sudo test -f /etc/letsencrypt/live/dlt.aurigraph.io/fullchain.pem && echo 'exists'" | grep -q "exists"; then
        check_pass "SSL certificate file exists"

        # Check certificate expiration
        EXPIRY=$(remote_exec "sudo openssl x509 -enddate -noout -in /etc/letsencrypt/live/dlt.aurigraph.io/fullchain.pem 2>/dev/null | cut -d= -f2")
        if [ -n "${EXPIRY}" ]; then
            check_pass "SSL certificate expires: ${EXPIRY}"

            # Calculate days until expiry
            EXPIRY_EPOCH=$(date -d "${EXPIRY}" +%s 2>/dev/null || echo "0")
            NOW_EPOCH=$(date +%s)
            DAYS_LEFT=$(( (EXPIRY_EPOCH - NOW_EPOCH) / 86400 ))

            if [ "${DAYS_LEFT}" -lt 30 ]; then
                check_warn "SSL certificate expires in ${DAYS_LEFT} days (renewal recommended)"
            elif [ "${DAYS_LEFT}" -lt 7 ]; then
                check_fail "SSL certificate expires in ${DAYS_LEFT} days (renewal urgent)"
            fi
        fi
    else
        check_warn "SSL certificate not found (may not be configured yet)"
    fi
}

# Check disk space
check_disk_space() {
    print_header "Disk Space Check"

    # Check /opt partition
    OPT_USAGE=$(remote_exec "df -h /opt 2>/dev/null | tail -1 | awk '{print \$5}' | tr -d '%'")
    OPT_AVAIL=$(remote_exec "df -h /opt 2>/dev/null | tail -1 | awk '{print \$4}'")

    if [ "${OPT_USAGE}" -lt 80 ]; then
        check_pass "/opt partition: ${OPT_USAGE}% used, ${OPT_AVAIL} available"
    elif [ "${OPT_USAGE}" -lt 90 ]; then
        check_warn "/opt partition: ${OPT_USAGE}% used, ${OPT_AVAIL} available (consider cleanup)"
    else
        check_fail "/opt partition: ${OPT_USAGE}% used, ${OPT_AVAIL} available (cleanup required)"
    fi

    # Check root partition
    ROOT_USAGE=$(remote_exec "df -h / 2>/dev/null | tail -1 | awk '{print \$5}' | tr -d '%'")
    ROOT_AVAIL=$(remote_exec "df -h / 2>/dev/null | tail -1 | awk '{print \$4}'")

    if [ "${ROOT_USAGE}" -lt 80 ]; then
        check_pass "Root partition: ${ROOT_USAGE}% used, ${ROOT_AVAIL} available"
    elif [ "${ROOT_USAGE}" -lt 90 ]; then
        check_warn "Root partition: ${ROOT_USAGE}% used, ${ROOT_AVAIL} available"
    else
        check_fail "Root partition: ${ROOT_USAGE}% used, ${ROOT_AVAIL} available"
    fi
}

# Check system resources
check_system_resources() {
    print_header "System Resources Check"

    # Check memory
    MEM_TOTAL=$(remote_exec "free -h | grep Mem | awk '{print \$2}'")
    MEM_USED=$(remote_exec "free -h | grep Mem | awk '{print \$3}'")
    MEM_AVAIL=$(remote_exec "free -h | grep Mem | awk '{print \$7}'")
    MEM_PERCENT=$(remote_exec "free | grep Mem | awk '{print int(\$3/\$2*100)}'")

    if [ "${MEM_PERCENT}" -lt 80 ]; then
        check_pass "Memory: ${MEM_USED}/${MEM_TOTAL} used (${MEM_PERCENT}%), ${MEM_AVAIL} available"
    elif [ "${MEM_PERCENT}" -lt 90 ]; then
        check_warn "Memory: ${MEM_USED}/${MEM_TOTAL} used (${MEM_PERCENT}%), ${MEM_AVAIL} available"
    else
        check_fail "Memory: ${MEM_USED}/${MEM_TOTAL} used (${MEM_PERCENT}%), ${MEM_AVAIL} available"
    fi

    # Check CPU load
    LOAD_AVG=$(remote_exec "uptime | awk -F'load average:' '{print \$2}' | awk '{print \$1}' | tr -d ','")
    CPU_COUNT=$(remote_exec "nproc")
    check_pass "CPU load: ${LOAD_AVG} (${CPU_COUNT} cores)"
}

# Display summary
display_summary() {
    print_header "Health Check Summary"

    echo ""
    echo "Total Checks: ${TOTAL_CHECKS}"
    echo -e "${GREEN}Passed: ${PASSED_CHECKS}${NC}"
    echo -e "${YELLOW}Warnings: ${WARNING_CHECKS}${NC}"
    echo -e "${RED}Failed: ${FAILED_CHECKS}${NC}"
    echo ""

    # Calculate health score
    if [ ${TOTAL_CHECKS} -gt 0 ]; then
        HEALTH_SCORE=$(( (PASSED_CHECKS * 100) / TOTAL_CHECKS ))
        echo "Health Score: ${HEALTH_SCORE}%"

        if [ ${HEALTH_SCORE} -ge 90 ]; then
            echo -e "${GREEN}Status: HEALTHY ✓${NC}"
            exit 0
        elif [ ${HEALTH_SCORE} -ge 70 ]; then
            echo -e "${YELLOW}Status: DEGRADED ⚠${NC}"
            exit 1
        else
            echo -e "${RED}Status: CRITICAL ✗${NC}"
            exit 2
        fi
    fi
}

# Main execution
main() {
    print_header "Monitoring Stack Health Check - Sprint 16 Phase 2"
    echo "Target: ${REMOTE_HOST}"
    echo "Time: $(date)"
    echo ""

    check_ssh || exit 1
    check_docker
    check_containers
    check_prometheus
    check_grafana
    check_nginx
    check_ssl
    check_disk_space
    check_system_resources
    display_summary
}

# Run main
main "$@"
