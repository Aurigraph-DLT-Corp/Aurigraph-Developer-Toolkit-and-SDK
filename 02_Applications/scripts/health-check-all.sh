#!/bin/bash

# =============================================================================
# Aurex Platform - Complete Health Check Script
# =============================================================================
# Description: Comprehensive health check for all 12 applications and services
# Environment: Production (dev.aurigraph.io)
# Version: 1.0.0
# =============================================================================

set -euo pipefail

# Configuration
COMPOSE_FILE="docker-compose.production.yml"
TIMEOUT=10

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Counters
TOTAL_CHECKS=0
PASSED_CHECKS=0
FAILED_CHECKS=0

# Logging functions
log_header() {
    echo -e "\n${BLUE}========================================${NC}"
    echo -e "${BLUE}$1${NC}"
    echo -e "${BLUE}========================================${NC}"
}

log_success() {
    echo -e "${GREEN}✓ $1${NC}"
    ((PASSED_CHECKS++))
}

log_failure() {
    echo -e "${RED}✗ $1${NC}"
    ((FAILED_CHECKS++))
}

log_warning() {
    echo -e "${YELLOW}⚠ $1${NC}"
}

log_info() {
    echo -e "${CYAN}ℹ $1${NC}"
}

# Check if URL is accessible
check_url() {
    local url=$1
    local description=$2
    local expected_status=${3:-200}
    
    ((TOTAL_CHECKS++))
    
    if curl -s -o /dev/null -w "%{http_code}" --connect-timeout $TIMEOUT --max-time $TIMEOUT "$url" | grep -q "$expected_status"; then
        log_success "$description: $url"
        return 0
    else
        log_failure "$description: $url"
        return 1
    fi
}

# Check container health
check_container() {
    local container_name=$1
    local description=$2
    
    ((TOTAL_CHECKS++))
    
    if docker inspect --format='{{.State.Status}}' "$container_name" 2>/dev/null | grep -q "running"; then
        # Check if container has health check
        local health_status=$(docker inspect --format='{{if .State.Health}}{{.State.Health.Status}}{{else}}no-healthcheck{{end}}' "$container_name" 2>/dev/null)
        
        if [[ "$health_status" == "healthy" ]]; then
            log_success "$description: running (healthy)"
            return 0
        elif [[ "$health_status" == "no-healthcheck" ]]; then
            log_success "$description: running (no health check)"
            return 0
        else
            log_warning "$description: running (health: $health_status)"
            return 1
        fi
    else
        log_failure "$description: not running"
        return 1
    fi
}

# Check port accessibility
check_port() {
    local host=$1
    local port=$2
    local description=$3
    
    ((TOTAL_CHECKS++))
    
    if nc -z -w $TIMEOUT "$host" "$port" 2>/dev/null; then
        log_success "$description: $host:$port accessible"
        return 0
    else
        log_failure "$description: $host:$port not accessible"
        return 1
    fi
}

# Main health check function
main() {
    echo -e "${PURPLE}🏥 Aurex Platform Health Check${NC}"
    echo -e "${PURPLE}===============================${NC}"
    echo -e "Timestamp: $(date)"
    echo -e "Environment: Production"
    echo -e "Target: dev.aurigraph.io\n"
    
    # 1. Container Health Checks
    log_header "1. CONTAINER HEALTH CHECKS"
    
    # Database services
    check_container "aurex-postgres-production" "PostgreSQL Database"
    check_container "aurex-redis-production" "Redis Cache"
    
    # Backend API services
    check_container "aurex-main-api-production" "Main API"
    check_container "aurex-launchpad-api-production" "Launchpad API"
    check_container "aurex-hydropulse-api-production" "Hydropulse API"
    check_container "aurex-sylvagraph-api-production" "Sylvagraph API"
    check_container "aurex-carbontrace-api-production" "CarbonTrace API"
    check_container "aurex-admin-api-production" "Admin API"
    
    # Frontend services
    check_container "aurex-main-frontend-production" "Main Frontend"
    check_container "aurex-launchpad-production" "Launchpad Frontend"
    check_container "aurex-hydropulse-production" "Hydropulse Frontend"
    check_container "aurex-sylvagraph-production" "Sylvagraph Frontend"
    check_container "aurex-carbontrace-production" "CarbonTrace Frontend"
    check_container "aurex-admin-production" "Admin Frontend"
    
    # Infrastructure services
    check_container "aurex-nginx-production" "Nginx Reverse Proxy"
    check_container "aurex-prometheus-production" "Prometheus Monitoring"
    check_container "aurex-grafana-production" "Grafana Dashboard"
    
    # 2. Port Accessibility Checks
    log_header "2. PORT ACCESSIBILITY CHECKS"
    
    # Frontend ports
    check_port "localhost" "3000" "Main Frontend Port"
    check_port "localhost" "3001" "Launchpad Frontend Port"
    check_port "localhost" "3002" "Hydropulse Frontend Port"
    check_port "localhost" "3003" "Sylvagraph Frontend Port"
    check_port "localhost" "3004" "CarbonTrace Frontend Port"
    check_port "localhost" "3005" "Admin Frontend Port"
    
    # Backend API ports
    check_port "localhost" "8000" "Main API Port"
    check_port "localhost" "8001" "Launchpad API Port"
    check_port "localhost" "8002" "Hydropulse API Port"
    check_port "localhost" "8003" "Sylvagraph API Port"
    check_port "localhost" "8004" "CarbonTrace API Port"
    check_port "localhost" "8005" "Admin API Port"
    
    # Web server ports
    check_port "localhost" "80" "HTTP Port"
    check_port "localhost" "443" "HTTPS Port"
    
    # Database ports (internal access)
    check_port "localhost" "5432" "PostgreSQL Port"
    check_port "localhost" "6379" "Redis Port"
    
    # Monitoring ports
    check_port "localhost" "9090" "Prometheus Port"
    
    # 3. HTTP Endpoint Checks
    log_header "3. HTTP ENDPOINT CHECKS"
    
    # Frontend applications
    check_url "http://localhost/" "Main Platform Frontend"
    check_url "http://localhost/Launchpad" "Launchpad Frontend"
    check_url "http://localhost/Hydropulse" "Hydropulse Frontend" 
    check_url "http://localhost/Sylvagraph" "Sylvagraph Frontend"
    check_url "http://localhost/Carbontrace" "CarbonTrace Frontend"
    check_url "http://localhost/AurexAdmin" "Admin Frontend"
    
    # Backend APIs (health endpoints)
    check_url "http://localhost:8000/health" "Main API Health"
    check_url "http://localhost:8001/health" "Launchpad API Health"
    check_url "http://localhost:8002/health" "Hydropulse API Health"
    check_url "http://localhost:8003/health" "Sylvagraph API Health"
    check_url "http://localhost:8004/health" "CarbonTrace API Health"
    check_url "http://localhost:8005/health" "Admin API Health"
    
    # Nginx routing
    check_url "http://localhost/" "Main Platform (Nginx)"
    check_url "http://localhost/launchpad" "Launchpad Route (Nginx)"
    check_url "http://localhost/hydropulse" "Hydropulse Route (Nginx)"
    check_url "http://localhost/sylvagraph" "Sylvagraph Route (Nginx)"
    check_url "http://localhost/carbontrace" "CarbonTrace Route (Nginx)"
    check_url "http://localhost/admin" "Admin Route (Nginx)"
    
    # API endpoints through Nginx
    check_url "http://localhost/api/main/health" "Main API via Nginx"
    check_url "http://localhost/api/launchpad/health" "Launchpad API via Nginx"
    check_url "http://localhost/api/hydropulse/health" "Hydropulse API via Nginx"
    check_url "http://localhost/api/sylvagraph/health" "Sylvagraph API via Nginx"
    check_url "http://localhost/api/carbontrace/health" "CarbonTrace API via Nginx"
    check_url "http://localhost/api/admin/health" "Admin API via Nginx"
    
    # Monitoring endpoints
    check_url "http://localhost:9090/-/healthy" "Prometheus Health"
    check_url "http://localhost:3006/api/health" "Grafana Health" "200"
    
    # 4. Database Connectivity Checks
    log_header "4. DATABASE CONNECTIVITY CHECKS"
    
    ((TOTAL_CHECKS++))
    if docker-compose -f "$COMPOSE_FILE" exec -T postgres pg_isready -U postgres >/dev/null 2>&1; then
        log_success "PostgreSQL: Connection successful"
        ((PASSED_CHECKS++))
    else
        log_failure "PostgreSQL: Connection failed"
        ((FAILED_CHECKS++))
    fi
    
    ((TOTAL_CHECKS++))
    if docker-compose -f "$COMPOSE_FILE" exec -T redis redis-cli ping | grep -q "PONG" 2>/dev/null; then
        log_success "Redis: Connection successful"
        ((PASSED_CHECKS++))
    else
        log_failure "Redis: Connection failed"
        ((FAILED_CHECKS++))
    fi
    
    # 5. External Domain Checks
    log_header "5. EXTERNAL DOMAIN CHECKS"
    
    if command -v dig >/dev/null 2>&1; then
        ((TOTAL_CHECKS++))
        if dig +short dev.aurigraph.io | grep -q ".*"; then
            log_success "DNS: dev.aurigraph.io resolves"
            ((PASSED_CHECKS++))
        else
            log_failure "DNS: dev.aurigraph.io does not resolve"
            ((FAILED_CHECKS++))
        fi
    else
        log_warning "DNS: dig command not available, skipping DNS check"
    fi
    
    # Summary
    log_header "6. HEALTH CHECK SUMMARY"
    
    echo -e "Total Checks: $TOTAL_CHECKS"
    echo -e "${GREEN}Passed: $PASSED_CHECKS${NC}"
    echo -e "${RED}Failed: $FAILED_CHECKS${NC}"
    
    local success_rate=$((PASSED_CHECKS * 100 / TOTAL_CHECKS))
    echo -e "Success Rate: $success_rate%"
    
    if [ $FAILED_CHECKS -eq 0 ]; then
        echo -e "\n${GREEN}🎉 All health checks passed! Platform is fully operational.${NC}"
        exit 0
    elif [ $success_rate -ge 80 ]; then
        echo -e "\n${YELLOW}⚠️  Platform is mostly operational with some issues.${NC}"
        exit 1
    else
        echo -e "\n${RED}🚨 Platform has significant issues. Immediate attention required.${NC}"
        exit 2
    fi
}

# Execute main function
main "$@"