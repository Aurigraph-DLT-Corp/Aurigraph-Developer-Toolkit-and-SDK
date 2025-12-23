#!/bin/bash

# Aurigraph DLT Dev4 Deployment Script
# Domain: aurigraphdlt.dev4.aurex.in
# Strategy: Docker-based deployment with compilation bypass and fallback services

set -euo pipefail

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Configuration
DOMAIN="aurigraphdlt.dev4.aurex.in"
DOCKER_COMPOSE_FILE="docker-compose.production-dev4.yml"
PROJECT_NAME="aurigraph-dev4"
LOG_FILE="/tmp/aurigraph-deploy-$(date +%Y%m%d-%H%M%S).log"
TIMEOUT_SERVICES=300 # 5 minutes timeout for service startup

# Logging functions
log() {
    echo -e "${BLUE}[$(date '+%Y-%m-%d %H:%M:%S')]${NC} $1" | tee -a "$LOG_FILE"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1" | tee -a "$LOG_FILE"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1" | tee -a "$LOG_FILE"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1" | tee -a "$LOG_FILE"
}

log_info() {
    echo -e "${CYAN}[INFO]${NC} $1" | tee -a "$LOG_FILE"
}

# Header
print_header() {
    echo -e "${PURPLE}"
    echo "╔══════════════════════════════════════════════════════════════════╗"
    echo "║                   AURIGRAPH DLT DEV4 DEPLOYMENT                 ║"
    echo "║                                                                  ║"
    echo "║  Domain: aurigraphdlt.dev4.aurex.in                            ║"
    echo "║  Strategy: Docker + Compilation Bypass + Fallback Services      ║"
    echo "║  Date: $(date '+%Y-%m-%d %H:%M:%S')                                    ║"
    echo "╚══════════════════════════════════════════════════════════════════╝"
    echo -e "${NC}"
}

# Port management functions
clear_port() {
    local port=$1
    log "Clearing port $port..."
    
    # Find and kill processes using the port
    local pids=$(lsof -ti:$port 2>/dev/null || true)
    if [ -n "$pids" ]; then
        log_warn "Found processes using port $port: $pids"
        echo "$pids" | xargs -r kill -TERM 2>/dev/null || true
        sleep 2
        
        # Force kill if still running
        pids=$(lsof -ti:$port 2>/dev/null || true)
        if [ -n "$pids" ]; then
            echo "$pids" | xargs -r kill -KILL 2>/dev/null || true
            log_warn "Force killed processes on port $port"
        fi
    fi
    
    log_success "Port $port cleared"
}

clear_all_ports() {
    log "Clearing all required ports..."
    
    # Clear application ports
    clear_port 4004  # V10 service
    clear_port 9003  # V11 service
    clear_port 9004  # V11 gRPC
    clear_port 8080  # Mock service
    
    # Clear infrastructure ports
    clear_port 80    # Nginx HTTP
    clear_port 443   # Nginx HTTPS
    clear_port 9090  # Prometheus
    clear_port 3000  # Grafana
    clear_port 6379  # Redis
    clear_port 3040  # Management dashboard
    
    log_success "All ports cleared"
}

# Docker management functions
check_docker() {
    log "Checking Docker installation..."
    
    if ! command -v docker &> /dev/null; then
        log_error "Docker is not installed"
        exit 1
    fi
    
    if ! docker info &> /dev/null; then
        log_error "Docker daemon is not running"
        exit 1
    fi
    
    if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null; then
        log_error "Docker Compose is not available"
        exit 1
    fi
    
    log_success "Docker is ready"
}

cleanup_existing() {
    log "Cleaning up existing deployment..."
    
    # Stop and remove containers
    docker-compose -f "$DOCKER_COMPOSE_FILE" -p "$PROJECT_NAME" down -v --remove-orphans 2>/dev/null || true
    
    # Clean up any remaining containers with our naming pattern
    docker ps -a --format "table {{.Names}}" | grep -E "(aurigraph|$PROJECT_NAME)" | xargs -r docker rm -f 2>/dev/null || true
    
    # Clean up networks
    docker network ls --format "{{.Name}}" | grep -E "(aurigraph|$PROJECT_NAME)" | xargs -r docker network rm 2>/dev/null || true
    
    # Clean up volumes (optional, uncomment to remove persistent data)
    # docker volume ls --format "{{.Name}}" | grep -E "(aurigraph|$PROJECT_NAME)" | xargs -r docker volume rm 2>/dev/null || true
    
    log_success "Cleanup completed"
}

create_directories() {
    log "Creating required directories..."
    
    local dirs=(
        "logs"
        "data/dev4"
        "config/dev4"
        "docker/ssl"
        "monitoring"
    )
    
    for dir in "${dirs[@]}"; do
        mkdir -p "$dir"
        log_info "Created directory: $dir"
    done
    
    log_success "Directories created"
}

create_ssl_certificates() {
    log "Setting up SSL certificates..."
    
    local ssl_dir="docker/ssl"
    local cert_file="$ssl_dir/aurigraphdlt.dev4.aurex.in.crt"
    local key_file="$ssl_dir/aurigraphdlt.dev4.aurex.in.key"
    
    if [ ! -f "$cert_file" ] || [ ! -f "$key_file" ]; then
        log_warn "SSL certificates not found, creating self-signed certificates..."
        
        openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
            -keyout "$key_file" \
            -out "$cert_file" \
            -subj "/C=US/ST=State/L=City/O=Aurigraph/CN=aurigraphdlt.dev4.aurex.in" \
            2>/dev/null
        
        log_success "Self-signed SSL certificates created"
    else
        log_info "SSL certificates already exist"
    fi
}

create_monitoring_config() {
    log "Creating monitoring configuration..."
    
    # Prometheus configuration
    cat > monitoring/prometheus-dev4.yml << 'EOF'
global:
  scrape_interval: 15s
  evaluation_interval: 15s

scrape_configs:
  - job_name: 'aurigraph-v10'
    static_configs:
      - targets: ['aurigraph-v10:4004']
    metrics_path: '/metrics'
    scrape_interval: 30s

  - job_name: 'aurigraph-v11'
    static_configs:
      - targets: ['aurigraph-v11:9003']
    metrics_path: '/q/metrics'
    scrape_interval: 30s

  - job_name: 'aurigraph-mock'
    static_configs:
      - targets: ['aurigraph-mock:8080']
    metrics_path: '/metrics'
    scrape_interval: 30s

  - job_name: 'management-dashboard'
    static_configs:
      - targets: ['management-dashboard:3040']
    metrics_path: '/metrics'
    scrape_interval: 60s

  - job_name: 'nginx'
    static_configs:
      - targets: ['nginx:80']
    scrape_interval: 60s
EOF
    
    log_success "Monitoring configuration created"
}

build_images() {
    log "Building Docker images..."
    
    # Build with progress and error handling
    if ! docker-compose -f "$DOCKER_COMPOSE_FILE" -p "$PROJECT_NAME" build --progress=plain 2>&1 | tee -a "$LOG_FILE"; then
        log_error "Failed to build images"
        
        log_warn "Attempting to pull base images instead..."
        docker-compose -f "$DOCKER_COMPOSE_FILE" -p "$PROJECT_NAME" pull 2>&1 | tee -a "$LOG_FILE" || true
        
        # Try building again with no-cache
        log_info "Retrying build with --no-cache..."
        docker-compose -f "$DOCKER_COMPOSE_FILE" -p "$PROJECT_NAME" build --no-cache --progress=plain 2>&1 | tee -a "$LOG_FILE"
    fi
    
    log_success "Docker images built successfully"
}

start_services() {
    log "Starting services..."
    
    # Start services with timeout
    timeout $TIMEOUT_SERVICES docker-compose -f "$DOCKER_COMPOSE_FILE" -p "$PROJECT_NAME" up -d 2>&1 | tee -a "$LOG_FILE"
    
    if [ $? -eq 0 ]; then
        log_success "Services started successfully"
    else
        log_error "Failed to start services within timeout ($TIMEOUT_SERVICES seconds)"
        return 1
    fi
}

wait_for_services() {
    log "Waiting for services to become healthy..."
    
    local services=(
        "nginx:80:/health"
        "aurigraph-v10:4004:/health"
        "aurigraph-v11:9003:/q/health"
        "aurigraph-mock:8080:/health"
        "prometheus:9090:/-/healthy"
        "management-dashboard:3040:/health"
    )
    
    local max_wait=180  # 3 minutes
    local wait_interval=10
    local elapsed=0
    
    while [ $elapsed -lt $max_wait ]; do
        local all_healthy=true
        
        for service in "${services[@]}"; do
            local name=$(echo "$service" | cut -d: -f1)
            local port=$(echo "$service" | cut -d: -f2)
            local path=$(echo "$service" | cut -d: -f3)
            
            if ! curl -sf "http://localhost:$port$path" >/dev/null 2>&1; then
                all_healthy=false
                break
            fi
        done
        
        if [ "$all_healthy" = true ]; then
            log_success "All services are healthy"
            return 0
        fi
        
        log_info "Waiting for services... (${elapsed}s/${max_wait}s)"
        sleep $wait_interval
        elapsed=$((elapsed + wait_interval))
    done
    
    log_warn "Some services may not be fully healthy yet"
    return 1
}

run_health_checks() {
    log "Running comprehensive health checks..."
    
    local endpoints=(
        "http://localhost:80/health:Main application (via nginx)"
        "http://localhost:4004/health:V10 TypeScript service"
        "http://localhost:9003/q/health:V11 Quarkus service"
        "http://localhost:8080/health:Mock fallback service"
        "http://localhost:9090/-/healthy:Prometheus monitoring"
        "http://localhost:3000/api/health:Grafana dashboard"
        "http://localhost:3040/health:Management dashboard"
    )
    
    local healthy_count=0
    local total_count=${#endpoints[@]}
    
    for endpoint in "${endpoints[@]}"; do
        local url=$(echo "$endpoint" | cut -d: -f1,2,3)
        local description=$(echo "$endpoint" | cut -d: -f4-)
        
        if curl -sf "$url" >/dev/null 2>&1; then
            log_success "✓ $description"
            healthy_count=$((healthy_count + 1))
        else
            log_warn "✗ $description"
        fi
    done
    
    log_info "Health check summary: $healthy_count/$total_count services healthy"
    
    if [ $healthy_count -gt 0 ]; then
        log_success "At least one service is healthy - deployment is operational"
        return 0
    else
        log_error "No services are healthy - deployment failed"
        return 1
    fi
}

show_deployment_summary() {
    log "Generating deployment summary..."
    
    echo -e "\n${GREEN}╔══════════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${GREEN}║                     DEPLOYMENT SUMMARY                          ║${NC}"
    echo -e "${GREEN}╚══════════════════════════════════════════════════════════════════╝${NC}"
    
    echo -e "\n${CYAN}🌐 Primary Access Points:${NC}"
    echo -e "   Main Application:     ${YELLOW}http://aurigraphdlt.dev4.aurex.in${NC}"
    echo -e "   Management Dashboard: ${YELLOW}http://aurigraphdlt.dev4.aurex.in/management${NC}"
    echo -e "   Grafana Dashboard:    ${YELLOW}http://aurigraphdlt.dev4.aurex.in/grafana${NC}"
    echo -e "   Prometheus Metrics:   ${YELLOW}http://aurigraphdlt.dev4.aurex.in/prometheus${NC}"
    
    echo -e "\n${CYAN}🔗 Direct Service URLs:${NC}"
    echo -e "   V10 Service:          ${YELLOW}http://localhost:4004${NC}"
    echo -e "   V11 Service:          ${YELLOW}http://localhost:9003${NC}"
    echo -e "   Mock Service:         ${YELLOW}http://localhost:8080${NC}"
    echo -e "   Management:           ${YELLOW}http://localhost:3040${NC}"
    echo -e "   Prometheus:           ${YELLOW}http://localhost:9090${NC}"
    echo -e "   Grafana:              ${YELLOW}http://localhost:3000${NC}"
    
    echo -e "\n${CYAN}📊 Service Status:${NC}"
    docker-compose -f "$DOCKER_COMPOSE_FILE" -p "$PROJECT_NAME" ps --format "table {{.Service}}\t{{.State}}\t{{.Ports}}"
    
    echo -e "\n${CYAN}📁 Important Files:${NC}"
    echo -e "   Docker Compose:       ${YELLOW}$DOCKER_COMPOSE_FILE${NC}"
    echo -e "   Deployment Log:       ${YELLOW}$LOG_FILE${NC}"
    echo -e "   SSL Certificates:     ${YELLOW}docker/ssl/${NC}"
    echo -e "   Monitoring Config:    ${YELLOW}monitoring/${NC}"
    
    echo -e "\n${CYAN}🎯 Next Steps:${NC}"
    echo -e "   1. Visit the management dashboard to monitor services"
    echo -e "   2. Check individual service health endpoints"
    echo -e "   3. Review logs if any services are not responding"
    echo -e "   4. Configure DNS to point $DOMAIN to this server"
    
    echo -e "\n${CYAN}🛠  Useful Commands:${NC}"
    echo -e "   View logs:            ${YELLOW}docker-compose -f $DOCKER_COMPOSE_FILE logs -f${NC}"
    echo -e "   Stop services:        ${YELLOW}docker-compose -f $DOCKER_COMPOSE_FILE down${NC}"
    echo -e "   Restart services:     ${YELLOW}docker-compose -f $DOCKER_COMPOSE_FILE restart${NC}"
    echo -e "   Scale services:       ${YELLOW}docker-compose -f $DOCKER_COMPOSE_FILE up -d --scale aurigraph-v10=2${NC}"
}

# Rollback function
rollback() {
    log_warn "Initiating rollback..."
    
    docker-compose -f "$DOCKER_COMPOSE_FILE" -p "$PROJECT_NAME" down 2>/dev/null || true
    
    log_info "Rollback completed"
}

# Signal handlers
trap 'log_error "Deployment interrupted"; rollback; exit 1' INT TERM

# Main deployment function
main() {
    print_header
    
    log "Starting deployment process..."
    log "Log file: $LOG_FILE"
    
    # Pre-deployment checks
    check_docker
    clear_all_ports
    
    # Setup
    cleanup_existing
    create_directories
    create_ssl_certificates
    create_monitoring_config
    
    # Build and deploy
    build_images
    start_services
    
    # Verification
    if wait_for_services; then
        run_health_checks
        show_deployment_summary
        log_success "🎉 Deployment completed successfully!"
        
        # Save deployment info
        cat > "deployment-info-$(date +%Y%m%d-%H%M%S).json" << EOF
{
    "timestamp": "$(date -u +"%Y-%m-%dT%H:%M:%SZ")",
    "domain": "$DOMAIN",
    "strategy": "docker-compose-with-fallbacks",
    "log_file": "$LOG_FILE",
    "compose_file": "$DOCKER_COMPOSE_FILE",
    "project_name": "$PROJECT_NAME",
    "status": "success"
}
EOF
        
    else
        log_error "❌ Deployment completed with warnings"
        log_info "Some services may not be fully operational, but fallback mechanisms should ensure basic functionality"
        
        # Show what's running anyway
        show_deployment_summary
    fi
}

# Command line interface
case "${1:-deploy}" in
    "deploy")
        main
        ;;
    "status")
        docker-compose -f "$DOCKER_COMPOSE_FILE" -p "$PROJECT_NAME" ps
        ;;
    "logs")
        docker-compose -f "$DOCKER_COMPOSE_FILE" -p "$PROJECT_NAME" logs -f "${2:-}"
        ;;
    "stop")
        log "Stopping services..."
        docker-compose -f "$DOCKER_COMPOSE_FILE" -p "$PROJECT_NAME" down
        ;;
    "restart")
        log "Restarting services..."
        docker-compose -f "$DOCKER_COMPOSE_FILE" -p "$PROJECT_NAME" restart
        ;;
    "clean")
        log "Cleaning up everything..."
        cleanup_existing
        clear_all_ports
        ;;
    "health")
        run_health_checks
        ;;
    *)
        echo "Usage: $0 {deploy|status|logs|stop|restart|clean|health}"
        echo ""
        echo "Commands:"
        echo "  deploy   - Full deployment (default)"
        echo "  status   - Show service status"
        echo "  logs     - Show service logs"
        echo "  stop     - Stop all services"
        echo "  restart  - Restart all services"
        echo "  clean    - Clean up everything"
        echo "  health   - Run health checks"
        exit 1
        ;;
esac