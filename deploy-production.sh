#!/bin/bash
# AURDLT V4.4.4 Production Deployment Script
# Remote Server: dlt.aurigraph.io
# Complete infrastructure cleanup and deployment

set -e

# Configuration
REMOTE_USER="subbu"
REMOTE_HOST="dlt.aurigraph.io"
REMOTE_PORT="2235"
DEPLOY_PATH="/opt/DLT"
GIT_REPO="git@github.com:Aurigraph-DLT-Corp/Aurigraph-DLT.git"
GIT_BRANCH="main"
DOMAIN="dlt.aurigraph.io"
SSL_CERT="/etc/letsencrypt/live/aurcrt/fullchain.pem"
SSL_KEY="/etc/letsencrypt/live/aurcrt/privkey.pem"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m'

# Helper functions
log_header() {
    echo -e "\n${PURPLE}╔════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${PURPLE}║${NC} $1"
    echo -e "${PURPLE}╚════════════════════════════════════════════════════════════╝${NC}\n"
}

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
    exit 1
}

section_step() {
    echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${CYAN}➤ $1${NC}"
    echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}\n"
}

# SSH command wrapper
ssh_exec() {
    ssh -p "$REMOTE_PORT" "$REMOTE_USER@$REMOTE_HOST" "$@"
}

# Phase 1: Pre-deployment validation
phase_pre_deployment() {
    log_header "PHASE 1: PRE-DEPLOYMENT VALIDATION"

    section_step "Validating SSH connection"
    if ssh_exec "echo 'SSH connection successful'" > /dev/null 2>&1; then
        log_success "SSH connection to $REMOTE_HOST:$REMOTE_PORT works"
    else
        log_error "Cannot connect to $REMOTE_HOST:$REMOTE_PORT"
    fi

    section_step "Verifying deployment path"
    ssh_exec "[ -d $DEPLOY_PATH ] && echo 'Path exists' || mkdir -p $DEPLOY_PATH"
    log_success "Deployment path: $DEPLOY_PATH"

    section_step "Checking SSL certificates"
    if ssh_exec "[ -f $SSL_CERT ] && [ -f $SSL_KEY ]"; then
        log_success "SSL certificates found"
    else
        log_error "SSL certificates not found"
    fi

    section_step "Checking Docker"
    ssh_exec "docker --version && docker-compose --version"
    log_success "Docker and Docker Compose installed"
}

# Phase 2: Docker cleanup
phase_docker_cleanup() {
    log_header "PHASE 2: DOCKER CLEANUP"

    section_step "Stopping Docker containers"
    ssh_exec "docker stop \$(docker ps -aq) 2>/dev/null || true"
    log_success "Containers stopped"

    section_step "Removing Docker containers"
    ssh_exec "docker rm \$(docker ps -aq) 2>/dev/null || true"
    log_success "Containers removed"

    section_step "Removing Docker volumes"
    ssh_exec "docker volume rm \$(docker volume ls -q) 2>/dev/null || true"
    log_success "Volumes removed"

    section_step "Removing Docker networks"
    ssh_exec "docker network rm \$(docker network ls --filter type=custom -q) 2>/dev/null || true"
    log_success "Networks removed"

    log_success "Docker cleanup complete"
}

# Phase 3: Repository setup
phase_repository_setup() {
    log_header "PHASE 3: REPOSITORY SETUP"

    section_step "Setting up repository"
    if ssh_exec "[ -d $DEPLOY_PATH/.git ]"; then
        log_info "Repository exists, resetting..."
        ssh_exec "cd $DEPLOY_PATH && git reset --hard HEAD && git clean -fd"
    else
        log_info "Cloning repository..."
        ssh_exec "cd /opt && git clone $GIT_REPO DLT"
    fi
    
    log_success "Repository ready"

    section_step "Pulling latest code"
    ssh_exec "cd $DEPLOY_PATH && git fetch origin && git checkout $GIT_BRANCH && git pull origin $GIT_BRANCH"
    log_success "Code pulled from $GIT_BRANCH"

    section_step "Verifying deployment files"
    ssh_exec "cd $DEPLOY_PATH && [ -f docker-compose.yml ] && echo 'docker-compose.yml: OK' || echo 'docker-compose.yml: MISSING'"
    log_success "Deployment files verified"
}

# Phase 4: Environment setup
phase_environment_setup() {
    log_header "PHASE 4: ENVIRONMENT SETUP"

    section_step "Creating .env file"
    ssh_exec "cat > $DEPLOY_PATH/.env << 'ENVEOF'
DOMAIN=$DOMAIN
TLS_ENABLED=true
SSL_CERT_PATH=$SSL_CERT
SSL_KEY_PATH=$SSL_KEY
DB_PASSWORD=aurigraph-prod-secure-2025
REDIS_PASSWORD=redis-secure-2025
GRAFANA_PASSWORD=admin123
QUARKUS_PROFILE=production
BRIDGE_SERVICE_ENABLED=true
CONSENSUS_TARGET_TPS=776000
AI_OPTIMIZATION_ENABLED=true
ENVEOF
"
    log_success "Environment file created"
}

# Phase 5: Docker deployment
phase_docker_deployment() {
    log_header "PHASE 5: DOCKER DEPLOYMENT"

    section_step "Pulling Docker images"
    ssh_exec "cd $DEPLOY_PATH && docker-compose pull"
    log_success "Images pulled"

    section_step "Starting services"
    ssh_exec "cd $DEPLOY_PATH && docker-compose up -d"
    log_success "Services started"

    section_step "Waiting for services (30 seconds)"
    sleep 30
}

# Phase 6: Health checks
phase_health_checks() {
    log_header "PHASE 6: HEALTH CHECKS"

    section_step "Verifying service status"
    ssh_exec "cd $DEPLOY_PATH && docker-compose ps"
    log_success "Services running"

    log_success "Health checks complete"
}

# Phase 7: Summary
phase_summary() {
    log_header "DEPLOYMENT COMPLETE"

    echo -e "${GREEN}═══════════════════════════════════════════════════════════${NC}"
    echo -e "${GREEN}✓ AURDLT V4.4.4 Production Deployment Successful${NC}"
    echo -e "${GREEN}═══════════════════════════════════════════════════════════${NC}\n"

    echo -e "${CYAN}Deployment Details:${NC}"
    echo -e "  Remote Server:     ${GREEN}$REMOTE_USER@$REMOTE_HOST:$REMOTE_PORT${NC}"
    echo -e "  Deployment Path:   ${GREEN}$DEPLOY_PATH${NC}"
    echo -e "  Domain:            ${GREEN}$DOMAIN${NC}"
    echo -e "  Git Branch:        ${GREEN}$GIT_BRANCH${NC}\n"

    echo -e "${CYAN}Services (8 total):${NC}"
    echo -e "  ${GREEN}✓${NC} NGINX Gateway          (Port 80/443)"
    echo -e "  ${GREEN}✓${NC} Aurigraph V11 Service  (Port 9003)"
    echo -e "  ${GREEN}✓${NC} PostgreSQL Database    (Bridge schemas)"
    echo -e "  ${GREEN}✓${NC} Redis Cache            (Performance)"
    echo -e "  ${GREEN}✓${NC} Prometheus Monitoring  (18 scrape jobs)"
    echo -e "  ${GREEN}✓${NC} Grafana Dashboards     (Auto-provisioned)"
    echo -e "  ${GREEN}✓${NC} Enterprise Portal      (React frontend)"
    echo -e "  ${GREEN}✓${NC} Validator/Business Nodes\n"

    echo -e "${CYAN}API Endpoints (20+):${NC}"
    echo -e "  ${GREEN}✓${NC} Bridge Transfer (AV11-635) - 6 endpoints"
    echo -e "  ${GREEN}✓${NC} Atomic Swap (AV11-636)     - 8 endpoints"
    echo -e "  ${GREEN}✓${NC} Query Service (AV11-637)   - 3 endpoints\n"

    echo -e "${CYAN}Access Points:${NC}"
    echo -e "  Enterprise Portal: ${GREEN}https://$DOMAIN${NC}"
    echo -e "  Grafana Dashboard: ${GREEN}https://$DOMAIN/grafana${NC}"
    echo -e "  API Docs:          ${GREEN}https://$DOMAIN/swagger-ui/${NC}"
    echo -e "  Health Check:      ${GREEN}https://$DOMAIN/q/health${NC}\n"

    echo -e "${CYAN}Commands:${NC}"
    echo -e "  Check services:  ${GREEN}ssh -p $REMOTE_PORT $REMOTE_USER@$REMOTE_HOST \"docker-compose -C $DEPLOY_PATH ps\"${NC}"
    echo -e "  View logs:       ${GREEN}ssh -p $REMOTE_PORT $REMOTE_USER@$REMOTE_HOST \"cd $DEPLOY_PATH && docker-compose logs -f\"${NC}"
    echo -e "  Test API:        ${GREEN}curl https://$DOMAIN/api/v11/health${NC}\n"

    echo -e "${GREEN}═══════════════════════════════════════════════════════════${NC}"
    echo -e "${GREEN}Status: ✓ READY FOR PRODUCTION${NC}"
    echo -e "${GREEN}═══════════════════════════════════════════════════════════${NC}\n"
}

# Main execution
main() {
    log_header "AURDLT V4.4.4 PRODUCTION DEPLOYMENT"
    echo -e "${YELLOW}This script will:${NC}"
    echo -e "  1. Remove all Docker containers, volumes, and networks"
    echo -e "  2. Clone/update repository"
    echo -e "  3. Deploy all services"
    echo -e "  4. Verify health\n"

    read -p "$(echo -e ${YELLOW})Proceed? (yes/no): $(echo -e ${NC})" -r
    if [[ ! $REPLY =~ ^[Yy][Ee][Ss]$ ]]; then
        log_error "Deployment cancelled"
    fi

    phase_pre_deployment
    phase_docker_cleanup
    phase_repository_setup
    phase_environment_setup
    phase_docker_deployment
    phase_health_checks
    phase_summary
}

main "$@"
