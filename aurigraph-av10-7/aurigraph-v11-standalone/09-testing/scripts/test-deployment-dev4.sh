#!/bin/bash

# Aurigraph DLT Dev4 Deployment Test Script
# Comprehensive testing for aurigraphdlt.dev4.aurex.in

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

DOMAIN="aurigraphdlt.dev4.aurex.in"
TEST_LOG="/tmp/aurigraph-test-$(date +%Y%m%d-%H%M%S).log"

# Test counters
TOTAL_TESTS=0
PASSED_TESTS=0
FAILED_TESTS=0

log() {
    echo -e "${BLUE}[$(date '+%H:%M:%S')]${NC} $1" | tee -a "$TEST_LOG"
}

log_success() {
    echo -e "${GREEN}[PASS]${NC} $1" | tee -a "$TEST_LOG"
    PASSED_TESTS=$((PASSED_TESTS + 1))
}

log_fail() {
    echo -e "${RED}[FAIL]${NC} $1" | tee -a "$TEST_LOG"
    FAILED_TESTS=$((FAILED_TESTS + 1))
}

log_info() {
    echo -e "${CYAN}[INFO]${NC} $1" | tee -a "$TEST_LOG"
}

test_endpoint() {
    local url=$1
    local description=$2
    local expected_status=${3:-200}
    local timeout=${4:-10}
    
    TOTAL_TESTS=$((TOTAL_TESTS + 1))
    
    log "Testing: $description"
    
    if response=$(curl -s -w "HTTPSTATUS:%{http_code}" --max-time "$timeout" "$url" 2>/dev/null); then
        http_code=$(echo "$response" | sed -n 's/.*HTTPSTATUS:\([0-9]*\)$/\1/p')
        body=$(echo "$response" | sed 's/HTTPSTATUS:[0-9]*$//')
        
        if [ "$http_code" = "$expected_status" ]; then
            log_success "$description (HTTP $http_code)"
            return 0
        else
            log_fail "$description (Expected $expected_status, got $http_code)"
            return 1
        fi
    else
        log_fail "$description (Connection failed)"
        return 1
    fi
}

test_json_endpoint() {
    local url=$1
    local description=$2
    local expected_field=$3
    local timeout=${4:-10}
    
    TOTAL_TESTS=$((TOTAL_TESTS + 1))
    
    log "Testing JSON: $description"
    
    if response=$(curl -s --max-time "$timeout" "$url" 2>/dev/null); then
        if echo "$response" | jq -e "$expected_field" >/dev/null 2>&1; then
            log_success "$description (JSON valid, field exists)"
            return 0
        else
            log_fail "$description (JSON invalid or field missing)"
            echo "$response" | head -200 >> "$TEST_LOG"
            return 1
        fi
    else
        log_fail "$description (Connection failed)"
        return 1
    fi
}

test_websocket() {
    local url=$1
    local description=$2
    
    TOTAL_TESTS=$((TOTAL_TESTS + 1))
    
    log "Testing WebSocket: $description"
    
    # Use a simple WebSocket test (would need websocat or similar for full test)
    # For now, just test if the port is open
    if nc -z localhost 4004 2>/dev/null; then
        log_success "$description (Port accessible)"
    else
        log_fail "$description (Port not accessible)"
    fi
}

print_header() {
    echo -e "${CYAN}"
    echo "╔══════════════════════════════════════════════════════════════════╗"
    echo "║                AURIGRAPH DLT DEV4 DEPLOYMENT TESTS              ║"
    echo "║                                                                  ║"
    echo "║  Domain: aurigraphdlt.dev4.aurex.in                            ║"
    echo "║  Time: $(date '+%Y-%m-%d %H:%M:%S')                                    ║"
    echo "╚══════════════════════════════════════════════════════════════════╝"
    echo -e "${NC}"
}

test_docker_services() {
    log_info "=== Testing Docker Services ==="
    
    local services=(
        "aurigraph-v10-production:V10 TypeScript Service"
        "aurigraph-v11-production:V11 Quarkus Service" 
        "aurigraph-mock:Mock Fallback Service"
        "aurigraph-nginx:Nginx Reverse Proxy"
        "aurigraph-prometheus:Prometheus Monitoring"
        "aurigraph-grafana:Grafana Dashboard"
        "aurigraph-management:Management Dashboard"
    )
    
    for service in "${services[@]}"; do
        local container=$(echo "$service" | cut -d: -f1)
        local description=$(echo "$service" | cut -d: -f2)
        
        TOTAL_TESTS=$((TOTAL_TESTS + 1))
        
        if docker ps --format "table {{.Names}}" | grep -q "$container"; then
            log_success "$description container is running"
        else
            log_fail "$description container is not running"
        fi
    done
}

test_health_endpoints() {
    log_info "=== Testing Health Endpoints ==="
    
    # Core health endpoints
    test_endpoint "http://localhost:4004/health" "V10 Service Health"
    test_endpoint "http://localhost:9003/q/health" "V11 Service Health"
    test_endpoint "http://localhost:8080/health" "Mock Service Health" 
    test_endpoint "http://localhost:3040/health" "Management Dashboard Health"
    test_endpoint "http://localhost:9090/-/healthy" "Prometheus Health"
    test_endpoint "http://localhost:3000/api/health" "Grafana Health"
    
    # Nginx proxy health (should route to a healthy service)
    test_endpoint "http://localhost:80/health" "Nginx Proxy Health"
}

test_api_endpoints() {
    log_info "=== Testing API Endpoints ==="
    
    # V10 API endpoints
    test_json_endpoint "http://localhost:4004/api/classical/metrics" "V10 Classical Metrics" ".success"
    
    # V11 API endpoints
    test_json_endpoint "http://localhost:9003/api/v11/info" "V11 Service Info" ".platform"
    test_json_endpoint "http://localhost:9003/api/v11/performance" "V11 Performance Metrics" ".tps_current"
    
    # Mock API endpoints (fallback)
    test_json_endpoint "http://localhost:8080/api/classical/metrics" "Mock V10 API" ".success"
    test_json_endpoint "http://localhost:8080/api/v11/info" "Mock V11 API" ".platform"
    
    # Management API
    test_json_endpoint "http://localhost:3040/status" "Management Status" ".overall_status"
    test_json_endpoint "http://localhost:3040/services" "Management Services" ".services"
}

test_monitoring_endpoints() {
    log_info "=== Testing Monitoring Endpoints ==="
    
    # Prometheus metrics
    test_endpoint "http://localhost:9090/api/v1/query?query=up" "Prometheus Query API"
    test_endpoint "http://localhost:4004/metrics" "V10 Metrics Endpoint"
    test_endpoint "http://localhost:9003/q/metrics" "V11 Metrics Endpoint"
    test_endpoint "http://localhost:8080/metrics" "Mock Metrics Endpoint"
    
    # Grafana
    test_endpoint "http://localhost:3000/login" "Grafana Login Page"
}

test_load_balancing() {
    log_info "=== Testing Load Balancing and Fallbacks ==="
    
    # Test nginx routing
    test_endpoint "http://localhost:80/" "Nginx Root Route"
    test_endpoint "http://localhost:80/api/classical/metrics" "Nginx API Routing"
    
    # Test fallback behavior by checking response headers or content
    TOTAL_TESTS=$((TOTAL_TESTS + 1))
    if response=$(curl -s -I http://localhost:80/health 2>/dev/null); then
        if echo "$response" | grep -q "X-Aurigraph-Mode: fallback"; then
            log_info "Fallback mode detected (expected if primary services are down)"
        else
            log_success "Primary service responding (fallback not active)"
        fi
    else
        log_fail "Nginx routing test failed"
    fi
}

test_performance() {
    log_info "=== Testing Performance ==="
    
    # Simple performance tests
    log "Testing response times..."
    
    local endpoints=(
        "http://localhost:4004/health"
        "http://localhost:9003/q/health"
        "http://localhost:8080/health"
        "http://localhost:3040/health"
    )
    
    for endpoint in "${endpoints[@]}"; do
        TOTAL_TESTS=$((TOTAL_TESTS + 1))
        
        local start_time=$(date +%s%N)
        if curl -s "$endpoint" >/dev/null 2>&1; then
            local end_time=$(date +%s%N)
            local response_time=$(( (end_time - start_time) / 1000000 )) # Convert to ms
            
            if [ "$response_time" -lt 1000 ]; then
                log_success "$(basename "$endpoint") response time: ${response_time}ms"
            else
                log_fail "$(basename "$endpoint") slow response: ${response_time}ms"
            fi
        else
            log_fail "$(basename "$endpoint") performance test failed"
        fi
    done
}

test_integration() {
    log_info "=== Testing Integration ==="
    
    # Test cross-service communication
    test_json_endpoint "http://localhost:3040/services" "Management Dashboard Service Discovery" ".services.\"aurigraph-v10\""
    
    # Test data flow
    TOTAL_TESTS=$((TOTAL_TESTS + 1))
    log "Testing data flow between services..."
    
    # Check if management dashboard can reach other services
    if response=$(curl -s "http://localhost:3040/status" 2>/dev/null); then
        if echo "$response" | jq -e '.services.v10.status' >/dev/null 2>&1; then
            log_success "Management dashboard is collecting V10 status"
        else
            log_fail "Management dashboard cannot reach V10 service"
        fi
    else
        log_fail "Management dashboard integration test failed"
    fi
}

test_security() {
    log_info "=== Testing Security ==="
    
    # Test security headers (through nginx)
    TOTAL_TESTS=$((TOTAL_TESTS + 1))
    log "Testing security headers..."
    
    if response=$(curl -s -I "http://localhost:80/" 2>/dev/null); then
        if echo "$response" | grep -q "X-Content-Type-Options: nosniff"; then
            log_success "Security headers present"
        else
            log_fail "Security headers missing"
        fi
    else
        log_fail "Security headers test failed"
    fi
    
    # Test that sensitive endpoints are not exposed
    test_endpoint "http://localhost:80/q/metrics" "Sensitive metrics endpoint protection" 404
}

run_comprehensive_test() {
    print_header
    
    log "Starting comprehensive deployment tests..."
    log "Test log: $TEST_LOG"
    
    # Run all test suites
    test_docker_services
    test_health_endpoints
    test_api_endpoints
    test_monitoring_endpoints
    test_load_balancing
    test_performance
    test_integration
    test_security
    
    # Generate summary
    echo -e "\n${CYAN}╔══════════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${CYAN}║                         TEST SUMMARY                            ║${NC}"
    echo -e "${CYAN}╚══════════════════════════════════════════════════════════════════╝${NC}"
    
    echo -e "\n${BLUE}📊 Results:${NC}"
    echo -e "   Total Tests:    ${YELLOW}$TOTAL_TESTS${NC}"
    echo -e "   Passed:         ${GREEN}$PASSED_TESTS${NC}"
    echo -e "   Failed:         ${RED}$FAILED_TESTS${NC}"
    
    local success_rate=$(( PASSED_TESTS * 100 / TOTAL_TESTS ))
    echo -e "   Success Rate:   ${CYAN}${success_rate}%${NC}"
    
    if [ $success_rate -ge 80 ]; then
        echo -e "\n${GREEN}✅ DEPLOYMENT VERIFICATION: PASSED${NC}"
        echo -e "   The deployment is functional and ready for use."
    elif [ $success_rate -ge 60 ]; then
        echo -e "\n${YELLOW}⚠️  DEPLOYMENT VERIFICATION: PARTIAL${NC}"
        echo -e "   The deployment has some issues but core functionality is available."
    else
        echo -e "\n${RED}❌ DEPLOYMENT VERIFICATION: FAILED${NC}"
        echo -e "   The deployment has significant issues that need to be addressed."
    fi
    
    echo -e "\n${BLUE}📁 Logs and Reports:${NC}"
    echo -e "   Detailed test log: ${YELLOW}$TEST_LOG${NC}"
    
    echo -e "\n${BLUE}🎯 Quick Access URLs:${NC}"
    echo -e "   Main Application:     ${YELLOW}http://localhost${NC}"
    echo -e "   Management Dashboard: ${YELLOW}http://localhost:3040${NC}"
    echo -e "   V10 Direct Access:    ${YELLOW}http://localhost:4004${NC}"
    echo -e "   V11 Direct Access:    ${YELLOW}http://localhost:9003${NC}"
    echo -e "   Mock Fallback:        ${YELLOW}http://localhost:8080${NC}"
    
    return $( [ $success_rate -ge 60 ] && echo 0 || echo 1 )
}

# Command line interface
case "${1:-test}" in
    "test")
        run_comprehensive_test
        ;;
    "health")
        test_health_endpoints
        ;;
    "api")
        test_api_endpoints
        ;;
    "performance")
        test_performance
        ;;
    "quick")
        test_docker_services
        test_health_endpoints
        ;;
    *)
        echo "Usage: $0 {test|health|api|performance|quick}"
        echo ""
        echo "Commands:"
        echo "  test        - Run comprehensive test suite (default)"
        echo "  health      - Test health endpoints only"
        echo "  api         - Test API endpoints only"
        echo "  performance - Test performance only"
        echo "  quick       - Quick smoke test"
        exit 1
        ;;
esac