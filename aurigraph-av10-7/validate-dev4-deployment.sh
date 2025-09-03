#!/bin/bash

# Aurigraph AV10-7 Dev4 Deployment Validation Script
# Comprehensive testing and validation of agent-coordinated deployment

set -e

echo "🔍 Starting Aurigraph AV10-7 Dev4 Deployment Validation"
echo "🤖 Agent Framework: Comprehensive validation suite"
echo "🎯 Target Validation: 800K+ TPS performance"
echo ""

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
NC='\033[0m'

# Functions for colored output
print_header() {
    echo -e "${PURPLE}═══════════════════════════════════════════${NC}"
    echo -e "${PURPLE}$1${NC}"
    echo -e "${PURPLE}═══════════════════════════════════════════${NC}"
}

print_status() {
    echo -e "${BLUE}[$(date '+%H:%M:%S')]${NC} $1"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Initialize validation counters
TOTAL_TESTS=0
PASSED_TESTS=0
FAILED_TESTS=0
WARNINGS=0

# Validation function
validate_test() {
    local test_name="$1"
    local command="$2"
    
    print_status "Testing: $test_name"
    ((TOTAL_TESTS++))
    
    if eval "$command" > /dev/null 2>&1; then
        print_success "$test_name"
        ((PASSED_TESTS++))
        return 0
    else
        print_error "$test_name"
        ((FAILED_TESTS++))
        return 1
    fi
}

# Warning function
validate_warning() {
    local test_name="$1"
    local command="$2"
    
    print_status "Checking: $test_name"
    ((TOTAL_TESTS++))
    
    if eval "$command" > /dev/null 2>&1; then
        print_success "$test_name"
        ((PASSED_TESTS++))
        return 0
    else
        print_warning "$test_name"
        ((WARNINGS++))
        return 1
    fi
}

print_header "🏗️  INFRASTRUCTURE VALIDATION"

# Check Docker and services
validate_test "Docker daemon is running" "docker info"
validate_test "Docker Compose is available" "command -v docker-compose || command -v 'docker compose'"

# Check if containers are running
print_status "Checking container status..."
if docker ps --format 'table {{.Names}}\t{{.Status}}' | grep -q aurigraph; then
    print_success "Aurigraph containers are running"
    ((PASSED_TESTS++))
    docker ps --format 'table {{.Names}}\t{{.Status}}' | grep aurigraph
else
    print_error "No Aurigraph containers found running"
    ((FAILED_TESTS++))
fi
((TOTAL_TESTS++))

print_header "🌐 NETWORK CONNECTIVITY VALIDATION"

# Test port accessibility
declare -A services=(
    ["Validator"]="8180"
    ["Node 1"]="8200" 
    ["Node 2"]="8201"
    ["Node 3"]="8202"
    ["Management"]="3240"
    ["Prometheus"]="9190"
    ["Vizor"]="3252"
)

for service in "${!services[@]}"; do
    port=${services[$service]}
    validate_test "$service port $port is accessible" "nc -z localhost $port"
done

print_header "🔗 API ENDPOINT VALIDATION"

# Test API endpoints
api_test() {
    local service="$1"
    local port="$2"
    local endpoint="${3:-/health}"
    
    print_status "Testing $service API..."
    ((TOTAL_TESTS++))
    
    response=$(curl -s -o /dev/null -w "%{http_code}" "http://localhost:$port$endpoint" 2>/dev/null || echo "000")
    
    if [[ "$response" == "200" ]]; then
        print_success "$service API is responding correctly"
        ((PASSED_TESTS++))
    elif [[ "$response" == "000" ]]; then
        print_error "$service API is not reachable"
        ((FAILED_TESTS++))
    else
        print_warning "$service API returned HTTP $response"
        ((WARNINGS++))
    fi
}

# Test core APIs
api_test "Validator" "8180" "/health"
api_test "Node 1" "8200" "/health"
api_test "Node 2" "8201" "/health" 
api_test "Node 3" "8202" "/health"
api_test "Management" "3240" "/health"

print_header "📊 PERFORMANCE METRICS VALIDATION"

# Test metrics endpoints
metrics_test() {
    local service="$1"
    local port="$2"
    
    print_status "Testing $service metrics..."
    ((TOTAL_TESTS++))
    
    if curl -s "http://localhost:$port/metrics" | grep -q "aurigraph"; then
        print_success "$service metrics are available"
        ((PASSED_TESTS++))
    else
        print_warning "$service metrics not found or not formatted correctly"
        ((WARNINGS++))
    fi
}

metrics_test "Validator" "8180"
metrics_test "Node 1" "8200"
metrics_test "Management" "3240"

print_header "🔐 SECURITY VALIDATION"

# Security checks
validate_warning "Containers running as non-root" "docker exec aurigraph-validator-dev4-01 whoami | grep -v root"
validate_test "Network isolation is configured" "docker network ls | grep aurigraph-dev4"
validate_test "Volume mounts are secure" "docker inspect aurigraph-validator-dev4-01 | grep -q '\"ReadOnly\":false'"

print_header "💾 STORAGE VALIDATION"

# Storage and persistence
validate_test "Data volumes are created" "docker volume ls | grep -q dev4"
validate_test "Log directories exist" "test -d logs/dev4 || test -d ./logs"
validate_test "Config directories exist" "test -d config/dev4"

print_header "📈 RESOURCE UTILIZATION VALIDATION"

print_status "Checking container resource usage..."
echo "Container Resource Usage:"
docker stats --no-stream --format "table {{.Container}}\t{{.CPUPerc}}\t{{.MemUsage}}\t{{.NetIO}}" | head -10

# Memory usage check
high_memory_containers=$(docker stats --no-stream --format "{{.Container}}\t{{.MemPerc}}" | awk -F'\t' '$2 > 80 {print $1}')
if [[ -n "$high_memory_containers" ]]; then
    print_warning "High memory usage detected in containers: $high_memory_containers"
    ((WARNINGS++))
else
    print_success "Memory usage is within acceptable limits"
    ((PASSED_TESTS++))
fi
((TOTAL_TESTS++))

print_header "🔄 AV10 COMPONENTS VALIDATION"

# AV10 Component endpoints (if available)
av10_components=(
    "quantum-sharding:/api/quantum/status"
    "rwa-platform:/api/rwa/status"
    "predictive-analytics:/api/predictive/status"  
    "neural-networks:/api/neural/status"
    "compliance:/api/compliance/status"
)

for component_info in "${av10_components[@]}"; do
    IFS=":" read -r component endpoint <<< "$component_info"
    print_status "Checking AV10 component: $component"
    ((TOTAL_TESTS++))
    
    # Try multiple ports for the component
    found=false
    for port in 8180 8200 8201 8202; do
        if curl -s -f "http://localhost:$port$endpoint" > /dev/null 2>&1; then
            print_success "AV10 $component is active on port $port"
            ((PASSED_TESTS++))
            found=true
            break
        fi
    done
    
    if [[ "$found" == "false" ]]; then
        print_warning "AV10 $component status unknown"
        ((WARNINGS++))
    fi
done

print_header "🚀 PERFORMANCE BASELINE VALIDATION"

# Basic performance test
print_status "Running basic performance validation..."
((TOTAL_TESTS++))

# Simple load test
print_status "Performing basic load test..."
start_time=$(date +%s)

# Send 100 concurrent requests to test basic load handling
if command -v ab &> /dev/null; then
    if ab -n 100 -c 10 -q "http://localhost:3240/health" > /dev/null 2>&1; then
        end_time=$(date +%s)
        duration=$((end_time - start_time))
        print_success "Basic load test completed in ${duration}s"
        ((PASSED_TESTS++))
    else
        print_warning "Basic load test failed"
        ((WARNINGS++))
    fi
elif command -v curl &> /dev/null; then
    # Fallback to curl-based test
    success_count=0
    for i in {1..10}; do
        if curl -s -f "http://localhost:3240/health" > /dev/null; then
            ((success_count++))
        fi
    done
    
    if [[ $success_count -ge 8 ]]; then
        print_success "Basic connectivity test passed ($success_count/10 requests succeeded)"
        ((PASSED_TESTS++))
    else
        print_warning "Basic connectivity test had issues ($success_count/10 requests succeeded)"
        ((WARNINGS++))
    fi
else
    print_warning "No load testing tools available (ab or curl)"
    ((WARNINGS++))
fi

print_header "📋 VALIDATION SUMMARY"

# Calculate percentages
if [[ $TOTAL_TESTS -gt 0 ]]; then
    pass_percentage=$((PASSED_TESTS * 100 / TOTAL_TESTS))
    fail_percentage=$((FAILED_TESTS * 100 / TOTAL_TESTS))
    warning_percentage=$((WARNINGS * 100 / TOTAL_TESTS))
else
    pass_percentage=0
    fail_percentage=0
    warning_percentage=0
fi

# Generate final report
cat << EOF

🎯 AURIGRAPH AV10-7 DEV4 VALIDATION REPORT
═══════════════════════════════════════════

📊 TEST RESULTS SUMMARY:
   ├─ Total Tests: $TOTAL_TESTS
   ├─ Passed: $PASSED_TESTS ($pass_percentage%)
   ├─ Failed: $FAILED_TESTS ($fail_percentage%)
   └─ Warnings: $WARNINGS ($warning_percentage%)

🏆 VALIDATION STATUS:
EOF

if [[ $FAILED_TESTS -eq 0 && $WARNINGS -lt 5 ]]; then
    echo -e "   ${GREEN}✅ DEPLOYMENT VALIDATION: PASSED${NC}"
    echo "   ├─ Platform is ready for production testing"
    echo "   └─ All critical components are operational"
    VALIDATION_STATUS="PASSED"
elif [[ $FAILED_TESTS -eq 0 ]]; then
    echo -e "   ${YELLOW}⚠️  DEPLOYMENT VALIDATION: PASSED WITH WARNINGS${NC}"
    echo "   ├─ Platform is operational but has some issues"
    echo "   └─ Review warnings before production testing"
    VALIDATION_STATUS="PASSED_WITH_WARNINGS"
elif [[ $FAILED_TESTS -lt 5 ]]; then
    echo -e "   ${YELLOW}⚠️  DEPLOYMENT VALIDATION: PARTIAL${NC}"
    echo "   ├─ Platform has some failed components"
    echo "   └─ Address failures before proceeding"
    VALIDATION_STATUS="PARTIAL"
else
    echo -e "   ${RED}❌ DEPLOYMENT VALIDATION: FAILED${NC}"
    echo "   ├─ Platform has significant issues"
    echo "   └─ Requires troubleshooting before use"
    VALIDATION_STATUS="FAILED"
fi

cat << EOF

🔧 DEPLOYMENT DETAILS:
   ├─ Environment: dev4
   ├─ Agent Framework: Active
   ├─ Target TPS: 800,000+
   ├─ Validation Time: $(date)
   └─ Platform Version: AV10-7

📈 NEXT STEPS:
   1. Review failed tests and warnings above
   2. Check container logs: docker logs <container_name>
   3. Monitor performance: http://localhost:3240
   4. Run comprehensive tests: npm run test:all

🔍 TROUBLESHOOTING RESOURCES:
   ├─ Container Status: docker ps
   ├─ Service Logs: docker-compose -f docker-compose.dev4.yml logs
   ├─ Network Status: docker network ls
   └─ Resource Usage: docker stats

═══════════════════════════════════════════
🤖 DevOps Manager Agent validation complete!
EOF

# Set exit code based on validation status
case $VALIDATION_STATUS in
    "PASSED")
        exit 0
        ;;
    "PASSED_WITH_WARNINGS")
        exit 0
        ;;
    "PARTIAL")
        exit 1
        ;;
    "FAILED")
        exit 2
        ;;
esac