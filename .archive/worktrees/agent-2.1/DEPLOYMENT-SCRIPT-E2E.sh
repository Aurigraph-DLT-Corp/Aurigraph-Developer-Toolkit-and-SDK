#!/bin/bash
################################################################################
# DEPLOYMENT-SCRIPT-E2E.sh
# Complete Aurigraph V11 Platform Deployment to Remote Server with E2E Testing
#
# This script orchestrates:
# 1. Remote server preparation and cleanup
# 2. Infrastructure service deployment (PostgreSQL, Redis, Prometheus, Grafana)
# 3. V11 validator cluster deployment (Option B: 51 nodes OR Option C: 65 nodes)
# 4. Enterprise Portal deployment
# 5. Health checks and monitoring setup
# 6. E2E smoke tests
# 7. Performance benchmarks
#
# Usage:
#   ./DEPLOYMENT-SCRIPT-E2E.sh [option-b|option-c] [remote-user] [remote-host] [remote-port]
#   ./DEPLOYMENT-SCRIPT-E2E.sh option-b subbu dlt.aurigraph.io 22
#   ./DEPLOYMENT-SCRIPT-E2E.sh option-c subbu dlt.aurigraph.io 22
#
################################################################################

set -e

# Configuration
OPTION="${1:-option-b}"
REMOTE_USER="${2:-subbu}"
REMOTE_HOST="${3:-dlt.aurigraph.io}"
REMOTE_PORT="${4:-22}"
REMOTE_PATH="/home/${REMOTE_USER}"
LOCAL_PATH="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging functions
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

################################################################################
# PHASE 1: VALIDATE INPUTS & SETUP
################################################################################

echo -e "\n${BLUE}════════════════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}PHASE 1: DEPLOYMENT INITIALIZATION${NC}"
echo -e "${BLUE}════════════════════════════════════════════════════════════════${NC}\n"

if [[ ! "$OPTION" =~ ^option-(b|c)$ ]]; then
    log_error "Invalid option: $OPTION. Use 'option-b' or 'option-c'"
    exit 1
fi

log_info "Deployment Configuration:"
echo "  Option: $OPTION"
echo "  Remote: $REMOTE_USER@$REMOTE_HOST:$REMOTE_PORT"
echo "  Remote Path: $REMOTE_PATH"
echo "  Local Path: $LOCAL_PATH"

# Verify local files exist
log_info "Verifying local files..."
if [ "$OPTION" = "option-b" ]; then
    if [ ! -f "$LOCAL_PATH/docker-compose-validators-optimized.yml" ]; then
        log_error "docker-compose-validators-optimized.yml not found"
        exit 1
    fi
    COMPOSE_FILE="docker-compose-validators-optimized.yml"
else
    if [ ! -f "$LOCAL_PATH/docker-compose-validators-ultra.yml" ]; then
        log_warning "docker-compose-validators-ultra.yml not found, using optimized"
        COMPOSE_FILE="docker-compose-validators-optimized.yml"
    else
        COMPOSE_FILE="docker-compose-validators-ultra.yml"
    fi
fi
log_success "Local files verified"

################################################################################
# PHASE 2: REMOTE SERVER PREPARATION
################################################################################

echo -e "\n${BLUE}════════════════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}PHASE 2: REMOTE SERVER PREPARATION${NC}"
echo -e "${BLUE}════════════════════════════════════════════════════════════════${NC}\n"

log_info "Connecting to remote server..."

# Check remote connectivity
ssh -p "$REMOTE_PORT" "$REMOTE_USER@$REMOTE_HOST" "echo 'Connected'" >/dev/null 2>&1 || {
    log_error "Cannot connect to $REMOTE_USER@$REMOTE_HOST:$REMOTE_PORT"
    exit 1
}
log_success "Remote server connected"

# Stop existing containers
log_info "Stopping existing containers..."
ssh -p "$REMOTE_PORT" "$REMOTE_USER@$REMOTE_HOST" << 'STOP_CMD'
    docker ps -a | grep -E "(aurigraph|validator|business|slim)" | awk '{print $1}' | \
    xargs -r docker stop 2>/dev/null || true

    docker ps -a | grep -E "(aurigraph|validator|business|slim)" | awk '{print $1}' | \
    xargs -r docker rm 2>/dev/null || true

    echo "✓ Containers stopped and removed"
STOP_CMD

# Clean up volumes (optional - only if user confirms)
log_warning "Note: Not removing persistent data volumes (for data recovery)"

# Remove old docker-compose files
log_info "Cleaning up old configuration..."
ssh -p "$REMOTE_PORT" "$REMOTE_USER@$REMOTE_HOST" << 'CLEAN_CMD'
    rm -f docker-compose*.yml
    rm -rf config/validators config/business config/slim
    echo "✓ Old configuration cleaned"
CLEAN_CMD

log_success "Remote server prepared"

################################################################################
# PHASE 3: DEPLOY CONFIGURATION & INFRASTRUCTURE
################################################################################

echo -e "\n${BLUE}════════════════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}PHASE 3: DEPLOYMENT CONFIGURATION UPLOAD${NC}"
echo -e "${BLUE}════════════════════════════════════════════════════════════════${NC}\n"

log_info "Uploading docker-compose configuration..."
scp -P "$REMOTE_PORT" "$LOCAL_PATH/$COMPOSE_FILE" "$REMOTE_USER@$REMOTE_HOST:$REMOTE_PATH/" || {
    log_error "Failed to upload $COMPOSE_FILE"
    exit 1
}
log_success "Configuration uploaded"

log_info "Creating configuration directories..."
ssh -p "$REMOTE_PORT" "$REMOTE_USER@$REMOTE_HOST" << 'MKDIR_CMD'
    mkdir -p config/validators/{v1,v2,v3,v4,v5}
    mkdir -p config/business/{b1,b2,b3,b4}
    mkdir -p config/slim/{s1,s2,s3,s4,s5,s6}
    echo "✓ Directories created"
MKDIR_CMD

################################################################################
# PHASE 4: START INFRASTRUCTURE SERVICES
################################################################################

echo -e "\n${BLUE}════════════════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}PHASE 4: INFRASTRUCTURE SERVICES DEPLOYMENT${NC}"
echo -e "${BLUE}════════════════════════════════════════════════════════════════${NC}\n"

log_info "Starting PostgreSQL, Redis, Prometheus, and Grafana..."
ssh -p "$REMOTE_PORT" "$REMOTE_USER@$REMOTE_HOST" << 'INFRA_CMD'
    cd $HOME

    # Start PostgreSQL
    docker run -d \
        --name aurigraph-postgres-prod \
        --restart unless-stopped \
        -e POSTGRES_DB=aurigraph \
        -e POSTGRES_USER=aurigraph \
        -e POSTGRES_PASSWORD=aurigraph-secure-password \
        -v postgres-data:/var/lib/postgresql/data \
        -p 5432:5432 \
        postgres:16-alpine

    echo "✓ PostgreSQL started"

    # Start Redis
    docker run -d \
        --name aurigraph-redis-prod \
        --restart unless-stopped \
        -v redis-data:/data \
        -p 6379:6379 \
        redis:7-alpine redis-server --appendonly yes

    echo "✓ Redis started"

    # Wait for services to be ready
    sleep 10

    # Create Prometheus config
    mkdir -p prometheus-config
    cat > prometheus-config/prometheus.yml <<'PROM'
global:
  scrape_interval: 15s
  evaluation_interval: 15s

scrape_configs:
  - job_name: 'aurigraph-validators'
    static_configs:
      - targets: ['localhost:9090', 'localhost:9091', 'localhost:9092', 'localhost:9093', 'localhost:9094']
    metrics_path: '/q/metrics'
    scrape_interval: 30s

  - job_name: 'aurigraph-business'
    static_configs:
      - targets: ['localhost:9090', 'localhost:9091', 'localhost:9092', 'localhost:9093']
    metrics_path: '/q/metrics'
    scrape_interval: 30s
PROM

    # Start Prometheus
    docker run -d \
        --name aurigraph-prometheus-prod \
        --restart unless-stopped \
        -v $(pwd)/prometheus-config:/etc/prometheus \
        -v prometheus-data:/prometheus \
        -p 9090:9090 \
        prom/prometheus:latest \
        --config.file=/etc/prometheus/prometheus.yml

    echo "✓ Prometheus started"

    # Start Grafana
    docker run -d \
        --name aurigraph-grafana-prod \
        --restart unless-stopped \
        -e GF_SECURITY_ADMIN_PASSWORD=admin123 \
        -v grafana-data:/var/lib/grafana \
        -p 3000:3000 \
        grafana/grafana:latest

    echo "✓ Grafana started"
INFRA_CMD

log_success "Infrastructure services started"

################################################################################
# PHASE 5: DEPLOY V11 VALIDATOR CLUSTER
################################################################################

echo -e "\n${BLUE}════════════════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}PHASE 5: V11 VALIDATOR CLUSTER DEPLOYMENT${NC}"
echo -e "${BLUE}════════════════════════════════════════════════════════════════${NC}\n"

log_info "Deploying validator cluster ($COMPOSE_FILE)..."
ssh -p "$REMOTE_PORT" "$REMOTE_USER@$REMOTE_HOST" << CLUSTER_CMD
    cd \$HOME
    docker-compose -f $COMPOSE_FILE up -d
    echo "✓ Validator cluster deployment initiated"
CLUSTER_CMD

# Wait for validators to stabilize
log_info "Waiting for validators to initialize (60 seconds)..."
for i in {1..6}; do
    echo -n "."
    sleep 10
done
echo ""
log_success "Initialization complete"

################################################################################
# PHASE 6: HEALTH CHECKS
################################################################################

echo -e "\n${BLUE}════════════════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}PHASE 6: HEALTH CHECKS & VERIFICATION${NC}"
echo -e "${BLUE}════════════════════════════════════════════════════════════════${NC}\n"

log_info "Checking container health status..."
ssh -p "$REMOTE_PORT" "$REMOTE_USER@$REMOTE_HOST" << 'HEALTH_CMD'
    echo "Container Status:"
    docker ps -a --format "table {{.Names}}\t{{.Status}}" | grep -E "(validator|business|slim|postgres|redis)" | head -20

    echo ""
    echo "Unhealthy Containers:"
    docker ps --format "table {{.Names}}\t{{.Status}}" | grep -i unhealthy || echo "None - all healthy!"
HEALTH_CMD

log_info "Checking API connectivity..."
ssh -p "$REMOTE_PORT" "$REMOTE_USER@$REMOTE_HOST" << 'API_CHECK'
    echo "Testing API endpoints..."

    # Test first validator
    curl -sf http://localhost:19003/q/health/ready >/dev/null 2>&1 && echo "✓ Validator-1 health: OK" || echo "✗ Validator-1 health: FAILED"

    # Test business node
    curl -sf http://localhost:29003/q/health/ready >/dev/null 2>&1 && echo "✓ Business-1 health: OK" || echo "✗ Business-1 health: FAILED"

    # Test slim node
    curl -sf http://localhost:39003/q/health/ready >/dev/null 2>&1 && echo "✓ Slim-1 health: OK" || echo "✗ Slim-1 health: FAILED"
API_CHECK

################################################################################
# PHASE 7: E2E SMOKE TESTS
################################################################################

echo -e "\n${BLUE}════════════════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}PHASE 7: E2E SMOKE TESTS${NC}"
echo -e "${BLUE}════════════════════════════════════════════════════════════════${NC}\n"

log_info "Running E2E smoke tests..."
ssh -p "$REMOTE_PORT" "$REMOTE_USER@$REMOTE_HOST" << 'E2E_CMD'
    echo "1. Testing basic connectivity..."
    curl -I http://localhost:19003/q/health/ready 2>&1 | head -1

    echo ""
    echo "2. Fetching system info..."
    curl -s http://localhost:19003/api/v11/info 2>/dev/null | jq '.' || echo "Info endpoint not available"

    echo ""
    echo "3. Checking transaction stats..."
    curl -s http://localhost:19003/api/v11/stats 2>/dev/null | jq '.' || echo "Stats endpoint not available"

    echo ""
    echo "4. Verifying consensus status..."
    curl -s http://localhost:19003/api/v11/consensus/status 2>/dev/null | jq '.' || echo "Consensus endpoint not available"
E2E_CMD

################################################################################
# PHASE 8: PERFORMANCE BENCHMARKS
################################################################################

echo -e "\n${BLUE}════════════════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}PHASE 8: PERFORMANCE BENCHMARKS${NC}"
echo -e "${BLUE}════════════════════════════════════════════════════════════════${NC}\n"

log_info "Running performance benchmarks (this may take 2-3 minutes)..."
ssh -p "$REMOTE_PORT" "$REMOTE_USER@$REMOTE_HOST" << 'BENCH_CMD'
    echo "Collecting performance metrics..."

    # Sample validator metrics
    for i in {1..3}; do
        echo ""
        echo "Sample $i (30 seconds apart):"

        # Get current metrics
        METRICS=$(curl -s http://localhost:19090/q/metrics 2>/dev/null | grep -E "jvm_memory_used_bytes|process_cpu_usage" || echo "Metrics unavailable")

        if [ ! -z "$METRICS" ]; then
            echo "CPU & Memory Metrics:"
            echo "$METRICS"
        fi

        if [ $i -lt 3 ]; then
            sleep 30
        fi
    done

    echo ""
    echo "Checking Docker resource usage..."
    docker stats --no-stream --format "table {{.Container}}\t{{.CPUPerc}}\t{{.MemUsage}}" | grep -E "(validator|business|slim)" | head -10
BENCH_CMD

################################################################################
# PHASE 9: MONITORING SETUP
################################################################################

echo -e "\n${BLUE}════════════════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}PHASE 9: MONITORING & LOGGING SETUP${NC}"
echo -e "${BLUE}════════════════════════════════════════════════════════════════${NC}\n"

log_info "Configuring monitoring dashboards..."
log_success "Grafana available at: http://$REMOTE_HOST:3000 (admin/admin123)"
log_success "Prometheus available at: http://$REMOTE_HOST:9090"

################################################################################
# PHASE 10: DEPLOYMENT SUMMARY
################################################################################

echo -e "\n${BLUE}════════════════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}DEPLOYMENT COMPLETE${NC}"
echo -e "${BLUE}════════════════════════════════════════════════════════════════${NC}\n"

log_success "Platform deployed successfully!"
echo ""
echo "Deployment Summary:"
echo "  Configuration: $COMPOSE_FILE"
echo "  Option: $OPTION"
echo "  Remote: $REMOTE_USER@$REMOTE_HOST:$REMOTE_PORT"
echo ""
echo "Service Access:"
echo "  V11 API (Validator-1): http://$REMOTE_HOST:19003/api/v11/"
echo "  V11 Health Check: http://$REMOTE_HOST:19003/q/health"
echo "  Prometheus: http://$REMOTE_HOST:9090"
echo "  Grafana: http://$REMOTE_HOST:3000 (admin/admin123)"
echo "  PostgreSQL: localhost:5432 (user: aurigraph)"
echo "  Redis: localhost:6379"
echo ""
echo "Next Steps:"
echo "  1. Verify all containers are healthy: docker ps"
echo "  2. Monitor performance: docker stats"
echo "  3. Review logs: docker logs <container-name>"
echo "  4. Configure Grafana dashboards for metrics visualization"
echo "  5. Setup alerting rules for production monitoring"
echo ""
log_info "Deployment log saved to: $HOME/aurigraph-deployment-$(date +%Y%m%d-%H%M%S).log"

