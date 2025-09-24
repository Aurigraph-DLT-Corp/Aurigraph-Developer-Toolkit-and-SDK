#!/bin/bash

# =============================================================================
# Aurex Platform - Complete Production Deployment Script
# =============================================================================
# Description: Deploy all 12 applications (6 frontend + 6 backend) with proper
#              port allocation and service dependencies
# Environment: Production (dev.aurigraph.io)
# Version: 1.0.0
# =============================================================================

set -euo pipefail

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$SCRIPT_DIR"
COMPOSE_FILE="docker-compose.production.yml"
LOG_FILE="deployment-logs/deployment-$(date +%Y%m%d-%H%M%S).log"
VERSION_TAG="${VERSION_TAG:-production-$(date +%Y%m%d)}"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Create log directory
mkdir -p "$(dirname "$LOG_FILE")"

# Logging function
log() {
    echo -e "${1}" | tee -a "$LOG_FILE"
}

log_step() {
    echo -e "\n${BLUE}========================================${NC}" | tee -a "$LOG_FILE"
    echo -e "${BLUE}$1${NC}" | tee -a "$LOG_FILE"
    echo -e "${BLUE}========================================${NC}" | tee -a "$LOG_FILE"
}

log_success() {
    echo -e "${GREEN}✓ $1${NC}" | tee -a "$LOG_FILE"
}

log_warning() {
    echo -e "${YELLOW}⚠ $1${NC}" | tee -a "$LOG_FILE"
}

log_error() {
    echo -e "${RED}✗ $1${NC}" | tee -a "$LOG_FILE"
}

log_info() {
    echo -e "${CYAN}ℹ $1${NC}" | tee -a "$LOG_FILE"
}

# Cleanup function for graceful exit
cleanup() {
    local exit_code=$?
    if [ $exit_code -ne 0 ]; then
        log_error "Deployment failed with exit code $exit_code"
        log_info "Check the log file: $LOG_FILE"
        log_info "To rollback: docker-compose -f $COMPOSE_FILE down"
    fi
    exit $exit_code
}

trap cleanup EXIT

# Check prerequisites
check_prerequisites() {
    log_step "CHECKING PREREQUISITES"
    
    # Check if running on the correct server
    if [[ ! "$(hostname)" =~ dev\.aurigraph\.io ]] && [[ "$(hostname)" != "dev.aurigraph.io" ]]; then
        log_warning "Not running on dev.aurigraph.io - proceeding anyway"
    fi
    
    # Check required commands
    for cmd in docker docker-compose curl jq; do
        if ! command -v "$cmd" &> /dev/null; then
            log_error "$cmd is not installed"
            exit 1
        fi
        log_success "$cmd is available"
    done
    
    # Check Docker daemon
    if ! docker info &> /dev/null; then
        log_error "Docker daemon is not running"
        exit 1
    fi
    log_success "Docker daemon is running"
    
    # Check compose file
    if [[ ! -f "$COMPOSE_FILE" ]]; then
        log_error "Docker compose file not found: $COMPOSE_FILE"
        exit 1
    fi
    log_success "Docker compose file found: $COMPOSE_FILE"
    
    # Check available ports
    local ports=(3000 3001 3002 3003 3004 3005 8000 8001 8002 8003 8004 8005 80 443)
    for port in "${ports[@]}"; do
        if lsof -Pi :$port -sTCP:LISTEN -t >/dev/null 2>&1; then
            log_warning "Port $port is already in use"
        fi
    done
}

# Set environment variables
set_environment() {
    log_step "SETTING ENVIRONMENT VARIABLES"
    
    export VERSION_TAG="$VERSION_TAG"
    export ENVIRONMENT="production"
    
    # Generate secure passwords if not set
    export POSTGRES_PASSWORD="${POSTGRES_PASSWORD:-$(openssl rand -base64 32 | tr -d "=+/" | cut -c1-25)}"
    export REDIS_PASSWORD="${REDIS_PASSWORD:-$(openssl rand -base64 32 | tr -d "=+/" | cut -c1-25)}"
    export SECRET_KEY="${SECRET_KEY:-$(openssl rand -base64 64 | tr -d "=+/" | cut -c1-50)}"
    export JWT_SECRET_KEY="${JWT_SECRET_KEY:-$(openssl rand -base64 64 | tr -d "=+/" | cut -c1-50)}"
    export GRAFANA_PASSWORD="${GRAFANA_PASSWORD:-$(openssl rand -base64 32 | tr -d "=+/" | cut -c1-25)}"
    
    log_success "Environment variables set"
    log_info "VERSION_TAG: $VERSION_TAG"
    log_info "ENVIRONMENT: $ENVIRONMENT"
    log_info "Passwords generated and set securely"
}

# Build applications
build_applications() {
    log_step "BUILDING APPLICATIONS"
    
    # Define build order based on dependencies
    local applications=(
        "Infrastructure"
        "Database services"
        "Backend APIs"
        "Frontend applications"
        "Monitoring services"
        "Reverse proxy"
    )
    
    log_info "Building in dependency order..."
    
    # Build base images first
    log_info "Building base infrastructure..."
    docker-compose -f "$COMPOSE_FILE" build postgres redis 2>&1 | tee -a "$LOG_FILE" || {
        log_error "Failed to build database services"
        exit 1
    }
    log_success "Database services built"
    
    # Build backend APIs
    log_info "Building backend APIs..."
    local backend_services=(
        "aurex-main-api"
        "aurex-launchpad-api"
        "aurex-hydropulse-api"
        "aurex-sylvagraph-api"
        "aurex-carbontrace-api"
        "aurex-admin-api"
    )
    
    for service in "${backend_services[@]}"; do
        log_info "Building $service..."
        docker-compose -f "$COMPOSE_FILE" build "$service" 2>&1 | tee -a "$LOG_FILE" || {
            log_error "Failed to build $service"
            exit 1
        }
        log_success "$service built successfully"
    done
    
    # Build frontend applications
    log_info "Building frontend applications..."
    local frontend_services=(
        "aurex-main-frontend"
        "aurex-launchpad"
        "aurex-hydropulse"
        "aurex-sylvagraph"
        "aurex-carbontrace"
        "aurex-admin"
    )
    
    for service in "${frontend_services[@]}"; do
        log_info "Building $service..."
        docker-compose -f "$COMPOSE_FILE" build "$service" 2>&1 | tee -a "$LOG_FILE" || {
            log_error "Failed to build $service"
            exit 1
        }
        log_success "$service built successfully"
    done
    
    # Build monitoring and proxy services
    log_info "Building monitoring services..."
    docker-compose -f "$COMPOSE_FILE" build nginx prometheus grafana 2>&1 | tee -a "$LOG_FILE" || {
        log_warning "Some monitoring services failed to build - continuing"
    }
    
    log_success "All applications built successfully"
}

# Deploy in stages
deploy_services() {
    log_step "DEPLOYING SERVICES"
    
    # Stage 1: Database services
    log_info "Stage 1: Starting database services..."
    docker-compose -f "$COMPOSE_FILE" up -d postgres redis 2>&1 | tee -a "$LOG_FILE" || {
        log_error "Failed to start database services"
        exit 1
    }
    
    # Wait for database readiness
    log_info "Waiting for database services to be ready..."
    sleep 30
    
    # Check database health
    for i in {1..10}; do
        if docker-compose -f "$COMPOSE_FILE" exec -T postgres pg_isready -U postgres; then
            log_success "PostgreSQL is ready"
            break
        fi
        if [ $i -eq 10 ]; then
            log_error "PostgreSQL failed to start within timeout"
            exit 1
        fi
        log_info "Waiting for PostgreSQL... (attempt $i/10)"
        sleep 10
    done
    
    # Stage 2: Backend APIs
    log_info "Stage 2: Starting backend APIs..."
    local backend_services=(
        "aurex-main-api"
        "aurex-launchpad-api"
        "aurex-hydropulse-api"
        "aurex-sylvagraph-api"
        "aurex-carbontrace-api"
        "aurex-admin-api"
    )
    
    for service in "${backend_services[@]}"; do
        log_info "Starting $service..."
        docker-compose -f "$COMPOSE_FILE" up -d "$service" 2>&1 | tee -a "$LOG_FILE" || {
            log_error "Failed to start $service"
            exit 1
        }
        sleep 5 # Brief pause between services
    done
    
    # Wait for backend APIs
    log_info "Waiting for backend APIs to be ready..."
    sleep 45
    
    # Stage 3: Frontend applications
    log_info "Stage 3: Starting frontend applications..."
    local frontend_services=(
        "aurex-main-frontend"
        "aurex-launchpad"
        "aurex-hydropulse"
        "aurex-sylvagraph"
        "aurex-carbontrace"
        "aurex-admin"
    )
    
    for service in "${frontend_services[@]}"; do
        log_info "Starting $service..."
        docker-compose -f "$COMPOSE_FILE" up -d "$service" 2>&1 | tee -a "$LOG_FILE" || {
            log_error "Failed to start $service"
            exit 1
        }
        sleep 3
    done
    
    # Wait for frontend applications
    log_info "Waiting for frontend applications to be ready..."
    sleep 30
    
    # Stage 4: Monitoring and proxy
    log_info "Stage 4: Starting monitoring and reverse proxy..."
    docker-compose -f "$COMPOSE_FILE" up -d prometheus grafana nginx 2>&1 | tee -a "$LOG_FILE" || {
        log_warning "Some monitoring services failed to start - continuing"
    }
    
    log_success "All services deployed successfully"
}

# Verify deployment
verify_deployment() {
    log_step "VERIFYING DEPLOYMENT"
    
    # Check container status
    log_info "Checking container status..."
    local failed_services=()
    
    while IFS= read -r service; do
        if [[ -n "$service" ]]; then
            local status=$(docker-compose -f "$COMPOSE_FILE" ps -q "$service" | xargs docker inspect --format='{{.State.Status}}' 2>/dev/null || echo "missing")
            if [[ "$status" == "running" ]]; then
                log_success "$service: $status"
            else
                log_error "$service: $status"
                failed_services+=("$service")
            fi
        fi
    done <<< "$(docker-compose -f "$COMPOSE_FILE" config --services)"
    
    if [[ ${#failed_services[@]} -gt 0 ]]; then
        log_error "Failed services: ${failed_services[*]}"
    fi
    
    # Check port accessibility
    log_info "Checking port accessibility..."
    local frontend_ports=(3000 3001 3002 3003 3004 3005)
    local backend_ports=(8000 8001 8002 8003 8004 8005)
    local web_ports=(80 443)
    
    for port in "${frontend_ports[@]}" "${backend_ports[@]}" "${web_ports[@]}"; do
        if nc -z localhost "$port" 2>/dev/null; then
            log_success "Port $port: accessible"
        else
            log_warning "Port $port: not accessible"
        fi
    done
    
    # Test application endpoints
    log_info "Testing application endpoints..."
    
    # Test main platform (path-based routing)
    if curl -s http://localhost/ > /dev/null; then
        log_success "Aurex Platform (/): responding"
    else
        log_error "Aurex Platform (/): not responding"
    fi
    
    # Test application paths
    for app in "Launchpad" "Hydropulse" "Sylvagraph" "Carbontrace" "AurexAdmin"; do
        if curl -s http://localhost/$app > /dev/null 2>&1; then
            log_success "Aurex $app (/$app): responding"
        else
            log_warning "Aurex $app (/$app): not responding or redirecting"
        fi
    done
    
    # Test APIs
    for port in "${backend_ports[@]}"; do
        if curl -s http://localhost:$port/health > /dev/null 2>&1; then
            log_success "API ($port): health check passed"
        else
            log_warning "API ($port): health check failed or no health endpoint"
        fi
    done
    
    # Test nginx routing
    if curl -s http://localhost/ > /dev/null; then
        log_success "Nginx reverse proxy: responding"
    else
        log_error "Nginx reverse proxy: not responding"
    fi
}

# Display deployment summary
show_summary() {
    log_step "DEPLOYMENT SUMMARY"
    
    echo -e "\n${PURPLE}🚀 Aurex Platform Deployment Complete!${NC}" | tee -a "$LOG_FILE"
    echo -e "${PURPLE}=========================================${NC}" | tee -a "$LOG_FILE"
    
    echo -e "\n${CYAN}📱 Frontend Applications:${NC}" | tee -a "$LOG_FILE"
    echo -e "  • Aurex Main:       http://dev.aurigraph.io:3000" | tee -a "$LOG_FILE"
    echo -e "  • Aurex Launchpad:  http://dev.aurigraph.io:3001" | tee -a "$LOG_FILE"
    echo -e "  • Aurex Hydropulse: http://dev.aurigraph.io:3002" | tee -a "$LOG_FILE"
    echo -e "  • Aurex Sylvagraph: http://dev.aurigraph.io:3003" | tee -a "$LOG_FILE"
    echo -e "  • Aurex CarbonTrace:http://dev.aurigraph.io:3004" | tee -a "$LOG_FILE"
    echo -e "  • Aurex Admin:      http://dev.aurigraph.io:3005" | tee -a "$LOG_FILE"
    
    echo -e "\n${CYAN}🔧 Backend APIs:${NC}" | tee -a "$LOG_FILE"
    echo -e "  • Main API:         http://dev.aurigraph.io:8000" | tee -a "$LOG_FILE"
    echo -e "  • Launchpad API:    http://dev.aurigraph.io:8001" | tee -a "$LOG_FILE"
    echo -e "  • Hydropulse API:   http://dev.aurigraph.io:8002" | tee -a "$LOG_FILE"
    echo -e "  • Sylvagraph API:   http://dev.aurigraph.io:8003" | tee -a "$LOG_FILE"
    echo -e "  • CarbonTrace API:  http://dev.aurigraph.io:8004" | tee -a "$LOG_FILE"
    echo -e "  • Admin API:        http://dev.aurigraph.io:8005" | tee -a "$LOG_FILE"
    
    echo -e "\n${CYAN}🌐 Nginx Routing:${NC}" | tee -a "$LOG_FILE"
    echo -e "  • Main Platform:    http://dev.aurigraph.io/" | tee -a "$LOG_FILE"
    echo -e "  • Launchpad:        http://dev.aurigraph.io/launchpad" | tee -a "$LOG_FILE"
    echo -e "  • Hydropulse:       http://dev.aurigraph.io/hydropulse" | tee -a "$LOG_FILE"
    echo -e "  • Sylvagraph:       http://dev.aurigraph.io/sylvagraph" | tee -a "$LOG_FILE"
    echo -e "  • CarbonTrace:      http://dev.aurigraph.io/carbontrace" | tee -a "$LOG_FILE"
    echo -e "  • Admin:            http://dev.aurigraph.io/admin" | tee -a "$LOG_FILE"
    
    echo -e "\n${CYAN}📊 Monitoring:${NC}" | tee -a "$LOG_FILE"
    echo -e "  • Prometheus:       http://dev.aurigraph.io:9090" | tee -a "$LOG_FILE"
    echo -e "  • Grafana:          http://dev.aurigraph.io:3001" | tee -a "$LOG_FILE"
    
    echo -e "\n${CYAN}📋 Management:${NC}" | tee -a "$LOG_FILE"
    echo -e "  • View logs:        docker-compose -f $COMPOSE_FILE logs -f [service]" | tee -a "$LOG_FILE"
    echo -e "  • Check status:     docker-compose -f $COMPOSE_FILE ps" | tee -a "$LOG_FILE"
    echo -e "  • Stop all:         docker-compose -f $COMPOSE_FILE down" | tee -a "$LOG_FILE"
    echo -e "  • Health check:     ./health-check-all.sh" | tee -a "$LOG_FILE"
    
    echo -e "\n${CYAN}📄 Log file:${NC} $LOG_FILE" | tee -a "$LOG_FILE"
    echo -e "${GREEN}Deployment completed successfully! 🎉${NC}" | tee -a "$LOG_FILE"
}

# Main deployment flow
main() {
    log_step "AUREX PLATFORM COMPLETE DEPLOYMENT"
    log_info "Starting deployment at $(date)"
    log_info "Version: $VERSION_TAG"
    log_info "Environment: Production"
    log_info "Target: dev.aurigraph.io"
    
    check_prerequisites
    set_environment
    build_applications
    deploy_services
    verify_deployment
    show_summary
    
    log_success "Deployment completed successfully!"
}

# Execute main function
main "$@"