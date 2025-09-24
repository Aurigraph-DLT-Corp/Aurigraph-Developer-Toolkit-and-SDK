#!/bin/bash
# Aurex Platform - Container Health Check Script
# Comprehensive health monitoring for all containerized services

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

print_header() {
    echo -e "${PURPLE}================================${NC}"
    echo -e "${PURPLE}$1${NC}"
    echo -e "${PURPLE}================================${NC}"
}

print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

test_endpoint() {
    local name=$1
    local url=$2
    local expected_code=${3:-200}
    
    echo -n "Testing $name ($url)... "
    
    if response=$(curl -s -w "%{http_code}" -o /dev/null --max-time 10 "$url" 2>/dev/null); then
        if [ "$response" = "$expected_code" ]; then
            echo -e "${GREEN}✅ HEALTHY${NC}"
            return 0
        else
            echo -e "${YELLOW}⚠️  CODE: $response${NC}"
            return 1
        fi
    else
        echo -e "${RED}❌ FAILED${NC}"
        return 1
    fi
}

test_container_status() {
    local container=$1
    local status=$(docker inspect --format='{{.State.Status}}' "$container" 2>/dev/null || echo "not_found")
    
    case $status in
        "running")
            echo -e "${GREEN}✅ Running${NC}"
            return 0
            ;;
        "restarting")
            echo -e "${YELLOW}🔄 Restarting${NC}"
            return 1
            ;;
        "exited")
            echo -e "${RED}❌ Exited${NC}"
            return 1
            ;;
        "not_found")
            echo -e "${RED}❌ Not Found${NC}"
            return 1
            ;;
        *)
            echo -e "${YELLOW}⚠️  $status${NC}"
            return 1
            ;;
    esac
}

print_header "AUREX PLATFORM CONTAINER HEALTH CHECK"
echo -e "${CYAN}🎯 Monitoring containerized services${NC}"
echo -e "${CYAN}📅 Check Time: $(date)${NC}"
echo ""

# Container Status Check
print_status "Checking container statuses..."
echo ""

CONTAINERS=(
    "aurex-postgres-container:PostgreSQL Database"
    "aurex-redis-container:Redis Cache"
    "aurex-prometheus-container:Prometheus Metrics"
    "aurex-grafana-container:Grafana Dashboards"
    "aurex-registry-dev:Container Registry"
    "aurex-platform-backend-container:Platform Backend"
    "aurex-platform-frontend-container:Platform Frontend"
)

healthy_containers=0
total_containers=${#CONTAINERS[@]}

for container_info in "${CONTAINERS[@]}"; do
    IFS=':' read -r container_name display_name <<< "$container_info"
    echo -n "$display_name: "
    if test_container_status "$container_name"; then
        ((healthy_containers++))
    fi
done

echo ""
print_status "Container Status Summary: $healthy_containers/$total_containers healthy"
echo ""

# Service Endpoint Tests
print_status "Testing service endpoints..."
echo ""

healthy_endpoints=0
total_endpoints=0

# Infrastructure Services
if test_endpoint "PostgreSQL" "http://localhost:5432"; then ((healthy_endpoints++)); fi; ((total_endpoints++))
if test_endpoint "Redis" "http://localhost:6379"; then ((healthy_endpoints++)); fi; ((total_endpoints++))
if test_endpoint "Prometheus" "http://localhost:9090/-/healthy"; then ((healthy_endpoints++)); fi; ((total_endpoints++))
if test_endpoint "Grafana API" "http://localhost:3005/api/health"; then ((healthy_endpoints++)); fi; ((total_endpoints++))
if test_endpoint "Registry API" "http://localhost:5001/v2/"; then ((healthy_endpoints++)); fi; ((total_endpoints++))

# Application Services
if test_endpoint "Platform Backend" "http://localhost:8000/health" 503; then ((healthy_endpoints++)); fi; ((total_endpoints++))
if test_endpoint "Platform Frontend" "http://localhost:3000/" 503; then ((healthy_endpoints++)); fi; ((total_endpoints++))

echo ""
print_status "Endpoint Status Summary: $healthy_endpoints/$total_endpoints responding"
echo ""

# Resource Usage
print_status "Container resource usage:"
docker stats --no-stream --format "table {{.Name}}\t{{.CPUPerc}}\t{{.MemUsage}}\t{{.NetIO}}" \
    $(docker ps --format "{{.Names}}" | grep aurex) 2>/dev/null || print_warning "Unable to get resource stats"

echo ""

# Overall Health Score
container_score=$((healthy_containers * 100 / total_containers))
endpoint_score=$((healthy_endpoints * 100 / total_endpoints))
overall_score=$(((container_score + endpoint_score) / 2))

print_header "HEALTH SUMMARY"

if [ $overall_score -ge 80 ]; then
    print_success "Overall Health Score: ${overall_score}% - GOOD"
elif [ $overall_score -ge 60 ]; then
    print_warning "Overall Health Score: ${overall_score}% - FAIR"
else
    print_error "Overall Health Score: ${overall_score}% - POOR"
fi

echo ""
echo -e "${CYAN}📊 Detailed Scores:${NC}"
echo "Container Health: ${container_score}%"
echo "Endpoint Health: ${endpoint_score}%"

if [ $overall_score -lt 80 ]; then
    echo ""
    print_warning "Recommendations:"
    echo "1. Check container logs: docker logs <container-name>"
    echo "2. Restart unhealthy containers: docker-compose restart <service>"
    echo "3. Review resource allocation and dependencies"
fi

echo ""
print_header "HEALTH CHECK COMPLETE"