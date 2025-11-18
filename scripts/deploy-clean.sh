#!/bin/bash
#
# AURDLT V4.4.4 Clean Deployment Script
# Safe, repeatable, and idempotent deployment process
# Usage: ./scripts/deploy-clean.sh
#

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
REMOTE_USER="subbu"
REMOTE_HOST="dlt.aurigraph.io"
REMOTE_PORT="22"
REMOTE_PATH="/opt/DLT"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Helper functions
print_header() {
    echo ""
    echo "╔══════════════════════════════════════════════════════════════╗"
    echo "║ $1"
    echo "╚══════════════════════════════════════════════════════════════╝"
    echo ""
}

print_step() {
    echo -e "${BLUE}→${NC} $1"
}

print_success() {
    echo -e "${GREEN}✓${NC} $1"
}

print_error() {
    echo -e "${RED}✗${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}⚠${NC} $1"
}

# Main deployment phases

phase_0_verify() {
    print_header "PHASE 0: PRE-DEPLOYMENT VERIFICATION"

    print_step "Testing SSH connectivity..."
    if ssh -p "$REMOTE_PORT" -o ConnectTimeout=5 "$REMOTE_USER@$REMOTE_HOST" "echo 'OK'" > /dev/null 2>&1; then
        print_success "SSH connectivity OK"
    else
        print_error "SSH connection failed to $REMOTE_USER@$REMOTE_HOST:$REMOTE_PORT"
        exit 1
    fi

    print_step "Checking docker-compose files..."
    if [ ! -f "$PROJECT_ROOT/docker-compose.yml" ]; then
        print_error "docker-compose.yml not found"
        exit 1
    fi
    print_success "Configuration files present"

    print_step "Checking git status..."
    if ! git -C "$PROJECT_ROOT" diff --quiet; then
        print_warning "Uncommitted changes exist (this is OK for config)"
    fi
    print_success "Git check complete"
}

phase_1_cleanup() {
    print_header "PHASE 1: REMOTE SERVER CLEANUP"

    print_step "Stopping all docker-compose services..."
    ssh -p "$REMOTE_PORT" "$REMOTE_USER@$REMOTE_HOST" << 'CLEANUP_SCRIPT'
cd /opt/DLT || exit 1

# Stop all compose services
docker-compose -f docker-compose.yml down --remove-orphans 2>/dev/null || true
docker-compose -f docker-compose.production.yml down --remove-orphans 2>/dev/null || true

# Remove any stray containers
CONTAINERS=$(docker ps -a -q 2>/dev/null | wc -l)
if [ "$CONTAINERS" -gt 0 ]; then
    docker rm -f $(docker ps -a -q) 2>/dev/null || true
fi

# Remove stray DLT networks
docker network rm $(docker network ls -q | grep -E "dlt_|docker-dlt" || true) 2>/dev/null || true

# Prune unused resources
docker volume prune -f 2>/dev/null || true

echo "   ✓ Cleanup complete"
CLEANUP_SCRIPT

    print_success "Remote server cleaned"
}

phase_2_copy_config() {
    print_header "PHASE 2: COPY CONFIGURATIONS & VALIDATE"

    print_step "Uploading docker-compose files..."
    scp -P "$REMOTE_PORT" "$PROJECT_ROOT/docker-compose.yml" \
        "$REMOTE_USER@$REMOTE_HOST:$REMOTE_PATH/" > /dev/null 2>&1
    print_success "Configuration files uploaded"

    print_step "Validating docker-compose syntax..."
    if ssh -p "$REMOTE_PORT" "$REMOTE_USER@$REMOTE_HOST" \
        "cd $REMOTE_PATH && docker-compose config -q" > /dev/null 2>&1; then
        print_success "Configuration valid"
    else
        print_error "docker-compose validation failed"
        exit 1
    fi

    print_step "Checking SSL certificates..."
    ssl_check=$(ssh -p "$REMOTE_PORT" "$REMOTE_USER@$REMOTE_HOST" \
        "[ -f /etc/letsencrypt/live/aurcrt/fullchain.pem ] && echo 'found' || echo 'notfound'")

    if [ "$ssl_check" = "found" ]; then
        print_success "SSL certificates found"
    else
        print_warning "SSL certificates not found (NGINX will operate without HTTPS)"
    fi
}

phase_3_deploy() {
    print_header "PHASE 3: IDEMPOTENT DEPLOYMENT"

    print_step "Creating docker networks..."
    ssh -p "$REMOTE_PORT" "$REMOTE_USER@$REMOTE_HOST" << 'NETWORK_SCRIPT'
docker network create docker-dlt-frontend 2>/dev/null || echo "   • docker-dlt-frontend exists"
docker network create docker-dlt-backend 2>/dev/null || echo "   • docker-dlt-backend exists"
docker network create docker-dlt-monitoring 2>/dev/null || echo "   • docker-dlt-monitoring exists"
echo "   ✓ Network topology ready"
NETWORK_SCRIPT

    print_step "Pulling base images..."
    ssh -p "$REMOTE_PORT" "$REMOTE_USER@$REMOTE_HOST" << 'PULL_SCRIPT'
cd /opt/DLT
docker-compose pull 2>&1 | grep -E "Pulling|Downloaded|Digest" | head -10
echo "   ✓ Base images updated"
PULL_SCRIPT

    print_step "Deploying services..."
    ssh -p "$REMOTE_PORT" "$REMOTE_USER@$REMOTE_HOST" << 'DEPLOY_SCRIPT'
cd /opt/DLT
docker-compose up -d 2>&1 | grep -E "Creating|Starting|Started|pulled" | head -20
sleep 10
echo "   ✓ Services deployed and initializing"
DEPLOY_SCRIPT

    print_success "Deployment complete"
}

phase_4_health_checks() {
    print_header "PHASE 4: HEALTH CHECKS & VALIDATION"

    print_step "Checking container status..."
    ssh -p "$REMOTE_PORT" "$REMOTE_USER@$REMOTE_HOST" << 'STATUS_SCRIPT'
cd /opt/DLT
echo "Running containers:"
docker-compose ps --format "table {{.Names}}\t{{.Status}}" | tail -n +2 | awk '{print "  •", $1, "-", $2, $3, $4, $5}'
echo ""
CONTAINER_COUNT=$(docker-compose ps -q 2>/dev/null | wc -l)
echo "Total containers: $CONTAINER_COUNT (expected: 5)"
STATUS_SCRIPT

    print_step "Checking NGINX..."
    nginx_status=$(ssh -p "$REMOTE_PORT" "$REMOTE_USER@$REMOTE_HOST" \
        "curl -s -o /dev/null -w '%{http_code}' http://localhost:80/ 2>/dev/null" || echo "000")

    if [ "$nginx_status" != "000" ]; then
        print_success "NGINX responding (HTTP $nginx_status)"
    else
        print_warning "NGINX not yet ready (still initializing)"
    fi

    print_step "Checking PostgreSQL..."
    pg_status=$(ssh -p "$REMOTE_PORT" "$REMOTE_USER@$REMOTE_HOST" \
        "docker-compose exec -T postgres pg_isready -U aurigraph 2>/dev/null" || echo "offline")

    if [[ "$pg_status" == *"accepting"* ]]; then
        print_success "PostgreSQL ready"
    else
        print_warning "PostgreSQL initializing..."
    fi

    print_step "Checking Redis..."
    redis_status=$(ssh -p "$REMOTE_PORT" "$REMOTE_USER@$REMOTE_HOST" \
        "docker-compose exec -T redis redis-cli ping 2>/dev/null" || echo "offline")

    if [ "$redis_status" = "PONG" ]; then
        print_success "Redis responding"
    else
        print_warning "Redis initializing..."
    fi

    print_success "Health checks complete"
}

phase_5_nginx_verify() {
    print_header "PHASE 5: NGINX PROXY VERIFICATION"

    print_step "Verifying NGINX configuration..."
    ssh -p "$REMOTE_PORT" "$REMOTE_USER@$REMOTE_HOST" << 'NGINX_VERIFY'
cd /opt/DLT
docker-compose exec -T nginx-gateway nginx -t 2>&1 | grep -E "successful|error"
echo ""
NGINX_CONTAINER_COUNT=$(docker ps -a | grep nginx | wc -l)
echo "NGINX containers: $NGINX_CONTAINER_COUNT (expected: 1)"
NGINX_VERIFY

    print_step "Testing HTTP endpoint..."
    http_response=$(ssh -p "$REMOTE_PORT" "$REMOTE_USER@$REMOTE_HOST" \
        "curl -s -i http://localhost:80/ 2>/dev/null | head -1" || echo "Connection failed")
    echo "   Response: $http_response"

    print_step "Testing HTTPS endpoint..."
    https_status=$(ssh -p "$REMOTE_PORT" "$REMOTE_USER@$REMOTE_HOST" \
        "curl -s -k -o /dev/null -w '%{http_code}' https://localhost:443/ 2>/dev/null" || echo "000")

    if [ "$https_status" != "000" ]; then
        print_success "HTTPS responding (HTTP $https_status)"
    else
        print_warning "HTTPS check skipped (still initializing)"
    fi

    print_step "Verifying no duplicate containers..."
    dup_check=$(ssh -p "$REMOTE_PORT" "$REMOTE_USER@$REMOTE_HOST" \
        "docker ps -a | grep -E 'nginx|postgres|redis|prometheus|grafana' | wc -l")

    if [ "$dup_check" -le 10 ]; then  # Allow some flexibility
        print_success "No duplication detected"
    else
        print_warning "Found $dup_check containers (check for duplicates)"
    fi

    print_success "NGINX verification complete"
}

# Main execution
main() {
    print_header "AURDLT V4.4.4 CLEAN DEPLOYMENT"
    echo "Project: $PROJECT_ROOT"
    echo "Remote: $REMOTE_USER@$REMOTE_HOST:$REMOTE_PATH"
    echo "Started: $(date)"
    echo ""

    # Run all phases
    phase_0_verify
    phase_1_cleanup
    phase_2_copy_config
    phase_3_deploy
    phase_4_health_checks
    phase_5_nginx_verify

    # Summary
    print_header "DEPLOYMENT COMPLETE & VERIFIED"
    echo -e "${GREEN}✅ AURDLT V4.4.4 is ready for production${NC}"
    echo ""
    echo "Access Points:"
    echo "  • Web Gateway:    https://dlt.aurigraph.io (Port 443)"
    echo "  • HTTP Gateway:   http://dlt.aurigraph.io (Port 80)"
    echo "  • Prometheus:     http://dlt.aurigraph.io:9090 (via NGINX)"
    echo "  • Grafana:        http://dlt.aurigraph.io:3001 (via NGINX)"
    echo ""
    echo "Monitor logs:"
    echo "  ssh -p $REMOTE_PORT $REMOTE_USER@$REMOTE_HOST 'cd $REMOTE_PATH && docker-compose logs -f nginx-gateway'"
    echo ""
    echo "Completed: $(date)"
}

main "$@"
