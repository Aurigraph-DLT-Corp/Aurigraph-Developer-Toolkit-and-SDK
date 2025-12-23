#!/bin/bash
# Aurigraph V4.4.4 Automated Deployment Script
# Remote Server: dlt.aurigraph.io
# Usage: ./deploy.sh [start|stop|restart|status|logs|clean]

set -e

DEPLOY_ENV="production"
DEPLOY_HOST="dlt"
DEPLOY_PATH="/opt/DLT"
DOCKER_COMPOSE_FILE="docker-compose.yml"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Helper functions
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[✓]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[✗]${NC} $1"
}

# Check if we're in the right directory
check_directory() {
    if [ ! -f "$DOCKER_COMPOSE_FILE" ]; then
        log_error "docker-compose.yml not found in current directory"
        exit 1
    fi
    log_success "Configuration files found"
}

# Build Docker images
build_images() {
    log_info "Building Docker images..."
    ssh "$DEPLOY_HOST" "cd $DEPLOY_PATH && docker-compose build --parallel" || {
        log_error "Image build failed"
        return 1
    }
    log_success "Docker images built successfully"
}

# Pull latest configuration
pull_configuration() {
    log_info "Pulling latest configuration from GitHub..."
    ssh "$DEPLOY_HOST" "cd $DEPLOY_PATH && git pull origin main" || {
        log_error "Git pull failed"
        return 1
    }
    log_success "Latest configuration pulled"
}

# Start services
start_services() {
    log_info "Starting Docker services..."
    ssh "$DEPLOY_HOST" "cd $DEPLOY_PATH && docker-compose up -d" || {
        log_error "Service startup failed"
        return 1
    }
    log_success "Docker services started"

    log_info "Waiting for services to be ready (30 seconds)..."
    sleep 30

    log_info "Checking service health..."
    verify_health
}

# Stop services
stop_services() {
    log_info "Stopping Docker services..."
    ssh "$DEPLOY_HOST" "cd $DEPLOY_PATH && docker-compose down" || {
        log_error "Service stop failed"
        return 1
    }
    log_success "Docker services stopped"
}

# Restart services
restart_services() {
    log_info "Restarting Docker services..."
    ssh "$DEPLOY_HOST" "cd $DEPLOY_PATH && docker-compose restart" || {
        log_error "Service restart failed"
        return 1
    }
    log_success "Docker services restarted"

    log_info "Waiting for services to be ready (20 seconds)..."
    sleep 20

    verify_health
}

# Check service status
check_status() {
    log_info "Service Status:"
    ssh "$DEPLOY_HOST" "cd $DEPLOY_PATH && docker-compose ps" || {
        log_error "Could not retrieve service status"
        return 1
    }
}

# Verify health checks
verify_health() {
    log_info "Verifying service health..."

    # Check V11 health endpoint
    log_info "Checking V11 service health (http://localhost:9003/q/health)..."
    if ssh "$DEPLOY_HOST" "curl -sf http://localhost:9003/q/health > /dev/null" 2>/dev/null; then
        log_success "V11 service is healthy"
    else
        log_warn "V11 service health check not yet responding"
    fi

    # Check NGINX health endpoint
    log_info "Checking NGINX health (http://localhost/health)..."
    if ssh "$DEPLOY_HOST" "curl -sf http://localhost/health > /dev/null" 2>/dev/null; then
        log_success "NGINX is healthy"
    else
        log_warn "NGINX health check not yet responding"
    fi

    # Check PostgreSQL
    log_info "Checking PostgreSQL connectivity..."
    if ssh "$DEPLOY_HOST" "docker-compose exec -T postgres pg_isready -U aurigraph" 2>/dev/null | grep -q "accepting"; then
        log_success "PostgreSQL is healthy"
    else
        log_warn "PostgreSQL health check not yet responding"
    fi

    # Check Redis
    log_info "Checking Redis connectivity..."
    if ssh "$DEPLOY_HOST" "docker-compose exec -T redis redis-cli ping" 2>/dev/null | grep -q "PONG"; then
        log_success "Redis is healthy"
    else
        log_warn "Redis health check not yet responding"
    fi
}

# View logs
view_logs() {
    local service=$1
    if [ -z "$service" ]; then
        log_info "Showing all service logs..."
        ssh "$DEPLOY_HOST" "cd $DEPLOY_PATH && docker-compose logs -f --tail=100"
    else
        log_info "Showing logs for service: $service"
        ssh "$DEPLOY_HOST" "cd $DEPLOY_PATH && docker-compose logs -f --tail=100 $service"
    fi
}

# Clean up old volumes and containers
cleanup() {
    log_warn "This will remove all Docker containers, volumes, and networks for this deployment"
    read -p "Are you sure? (yes/no): " -r
    if [[ $REPLY =~ ^[Yy][Ee][Ss]$ ]]; then
        log_info "Cleaning up Docker resources..."
        ssh "$DEPLOY_HOST" "cd $DEPLOY_PATH && docker-compose down -v" || {
            log_error "Cleanup failed"
            return 1
        }
        log_success "Docker resources cleaned up"
    else
        log_info "Cleanup cancelled"
    fi
}

# Database operations
backup_database() {
    log_info "Backing up PostgreSQL database..."
    local backup_file="/opt/DLT/backups/aurigraph_$(date +%Y%m%d_%H%M%S).sql"
    ssh "$DEPLOY_HOST" "mkdir -p /opt/DLT/backups && docker-compose exec -T postgres pg_dump -U aurigraph aurigraph_production > $backup_file" || {
        log_error "Database backup failed"
        return 1
    }
    log_success "Database backed up to $backup_file"
}

# Deploy with full validation
full_deployment() {
    log_info "Starting full deployment process..."

    check_directory

    log_info "Step 1: Pulling latest configuration..."
    pull_configuration

    log_info "Step 2: Building Docker images..."
    build_images

    log_info "Step 3: Starting services..."
    start_services

    log_info "Step 4: Verifying deployment..."
    check_status

    log_success "Deployment completed successfully!"
    log_info "Access the application at: https://dlt.aurigraph.io"
    log_info "Grafana dashboard: https://dlt.aurigraph.io/grafana"
    log_info "API documentation: https://dlt.aurigraph.io/swagger-ui/"
}

# Show usage
show_usage() {
    cat << EOF
Usage: ./deploy.sh [COMMAND] [OPTIONS]

Commands:
    deploy          Full deployment (pull, build, start)
    start           Start services
    stop            Stop services
    restart         Restart services
    status          Show service status
    logs [service]  View logs (optional: specific service)
    health          Verify service health
    backup          Backup PostgreSQL database
    clean           Clean up all Docker resources
    help            Show this help message

Examples:
    ./deploy.sh deploy              # Full deployment
    ./deploy.sh logs                # View all logs
    ./deploy.sh logs aurigraph-v11-service  # View V11 logs
    ./deploy.sh status              # Check service status
    ./deploy.sh backup              # Backup database

For more information, see: DEPLOYMENT-V4.4.4-PRODUCTION.md
EOF
}

# Main script
main() {
    local command=${1:-"help"}

    case "$command" in
        deploy)
            full_deployment
            ;;
        start)
            start_services
            ;;
        stop)
            stop_services
            ;;
        restart)
            restart_services
            ;;
        status)
            check_status
            ;;
        health)
            verify_health
            ;;
        logs)
            view_logs "$2"
            ;;
        backup)
            backup_database
            ;;
        clean)
            cleanup
            ;;
        help)
            show_usage
            ;;
        *)
            log_error "Unknown command: $command"
            show_usage
            exit 1
            ;;
    esac
}

# Run main function
main "$@"
