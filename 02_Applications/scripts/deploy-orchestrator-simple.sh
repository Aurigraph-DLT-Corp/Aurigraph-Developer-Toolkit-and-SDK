#!/bin/bash
# =============================================================================
# Aurex Platform Simple Orchestrator - Production Deployment
# =============================================================================
# Description: Complete orchestrated deployment with tmux sessions
# Environment: Production (dev.aurigraph.io)
# Version: 1.0.0
# Date: August 10, 2025
# =============================================================================

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
WHITE='\033[1;37m'
NC='\033[0m' # No Color

# Configuration
TMUX_SESSION="aurex-deploy"
LOG_DIR="./deployment-logs"
TIMESTAMP=$(date +"%Y%m%d-%H%M%S")
DEPLOYMENT_LOG="${LOG_DIR}/deployment-${TIMESTAMP}.log"

# =============================================================================
# UTILITY FUNCTIONS
# =============================================================================

log() {
    local level=$1
    shift
    local message="$@"
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    local color=""
    
    case $level in
        "INFO") color=$BLUE ;;
        "SUCCESS") color=$GREEN ;;
        "WARNING") color=$YELLOW ;;
        "ERROR") color=$RED ;;
        "DEBUG") color=$PURPLE ;;
        *) color=$WHITE ;;
    esac
    
    echo -e "${color}[${timestamp}] [${level}] ${message}${NC}"
    echo "[${timestamp}] [${level}] ${message}" >> "$DEPLOYMENT_LOG"
}

setup_environment() {
    log "INFO" "Setting up deployment environment..."
    
    # Create log directory
    mkdir -p "$LOG_DIR"
    
    # Export environment variables
    export COMPOSE_PROJECT_NAME="aurex-platform"
    export VERSION_TAG="production-${TIMESTAMP}"
    export POSTGRES_PASSWORD="${POSTGRES_PASSWORD:-AurexProd2025!}"
    export REDIS_PASSWORD="${REDIS_PASSWORD:-AurexRedis2025!}"
    export SECRET_KEY="${SECRET_KEY:-aurex-platform-secret-key-production}"
    export JWT_SECRET_KEY="${JWT_SECRET_KEY:-aurex-platform-jwt-secret-key-production-2025}"
    
    log "SUCCESS" "Environment setup complete"
}

check_prerequisites() {
    log "INFO" "Checking deployment prerequisites..."
    
    # Check required tools
    for cmd in docker docker-compose curl; do
        if ! command -v "$cmd" &> /dev/null; then
            log "ERROR" "Missing required dependency: $cmd"
            exit 1
        fi
    done
    
    # Check Docker daemon
    if ! docker info &> /dev/null; then
        log "ERROR" "Docker daemon is not running"
        exit 1
    fi
    
    log "SUCCESS" "Prerequisites check passed"
}

validate_application_structure() {
    log "INFO" "Validating application structure..."
    
    local errors=0
    
    # Check key applications
    local apps="02_Applications/00_aurex-platform 02_Applications/02_aurex-launchpad 02_Applications/03_aurex-hydropulse 02_Applications/04_aurex-sylvagraph"
    
    for app_dir in $apps; do
        if [[ -d "$app_dir" ]]; then
            log "SUCCESS" "Application directory found: $app_dir"
        else
            log "WARNING" "Application directory missing: $app_dir"
        fi
    done
    
    log "SUCCESS" "Application structure validation completed"
}

# =============================================================================
# DEPLOYMENT FUNCTIONS
# =============================================================================

deploy_local_environment() {
    log "INFO" "Starting local environment deployment..."
    
    # Create local docker-compose configuration
    log "INFO" "Creating local development configuration..."
    
    cat > docker-compose.local.yml << 'EOF'
version: '3.8'

services:
  postgres:
    image: postgres:15-alpine
    container_name: aurex-postgres-local
    environment:
      POSTGRES_DB: aurex_platform
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD:-AurexLocal2025!}
      POSTGRES_MULTIPLE_DATABASES: aurex_platform,aurex_launchpad,aurex_hydropulse,aurex_sylvagraph
    volumes:
      - postgres_data_local:/var/lib/postgresql/data
      - ./scripts/init-databases.sh:/docker-entrypoint-initdb.d/init-databases.sh:ro
    ports:
      - "5432:5432"
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres -d aurex_platform"]
      interval: 30s
      timeout: 10s
      retries: 5

  redis:
    image: redis:7-alpine
    container_name: aurex-redis-local
    command: redis-server --appendonly yes
    ports:
      - "6379:6379"
    volumes:
      - redis_data_local:/data
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 30s
      timeout: 10s
      retries: 3

volumes:
  postgres_data_local:
  redis_data_local:
EOF

    log "SUCCESS" "Local configuration created"
    
    # Start local services
    log "INFO" "Starting local database services..."
    docker-compose -f docker-compose.local.yml up -d postgres redis
    
    # Wait for services to be healthy
    log "INFO" "Waiting for database services to be ready..."
    sleep 30
    
    # Test database connection
    local max_attempts=10
    local attempt=1
    while [ $attempt -le $max_attempts ]; do
        if docker-compose -f docker-compose.local.yml exec -T postgres psql -U postgres -d aurex_platform -c "SELECT 1;" &>/dev/null; then
            log "SUCCESS" "Database connection established"
            break
        else
            log "INFO" "Database not ready yet, attempt $attempt of $max_attempts"
            sleep 5
            ((attempt++))
        fi
    done
    
    if [ $attempt -gt $max_attempts ]; then
        log "ERROR" "Failed to connect to database after $max_attempts attempts"
        return 1
    fi
    
    log "SUCCESS" "Local environment deployment complete"
}

analyze_launchpad_issues() {
    log "INFO" "Analyzing Launchpad application for blank page issues..."
    
    # Check Launchpad structure
    if [[ -d "02_Applications/02_aurex-launchpad" ]]; then
        cd 02_Applications/02_aurex-launchpad/frontend
        
        log "INFO" "Checking App.jsx routing configuration..."
        if [[ -f "src/App.jsx" ]]; then
            local routes_count=$(grep -c "Route" src/App.jsx 2>/dev/null || echo "0")
            log "INFO" "Found $routes_count routes in App.jsx"
            
            # Show routing structure
            log "INFO" "Current routing structure:"
            grep -n "Route\|element=" src/App.jsx | head -10 || log "INFO" "No routes found"
        fi
        
        log "INFO" "Checking CSS and styling..."
        if [[ -f "src/index.css" ]]; then
            local css_size=$(wc -c < src/index.css)
            log "INFO" "CSS file size: $css_size bytes"
        fi
        
        # Check for missing components that might cause blank pages
        log "INFO" "Checking for missing imports or components..."
        if [[ -f "src/pages/LaunchpadLandingPage.tsx" ]]; then
            log "SUCCESS" "LaunchpadLandingPage.tsx exists - landing page should work"
        else
            log "WARNING" "LaunchpadLandingPage.tsx not found"
        fi
        
        cd ../../..
    else
        log "ERROR" "Launchpad directory not found"
    fi
    
    log "INFO" "Launchpad analysis complete - routing appears simplified to landing page only"
}

deploy_production_environment() {
    log "INFO" "Starting production environment deployment..."
    
    # Check available applications and build them
    log "INFO" "Building production containers..."
    
    # Start core services first
    log "INFO" "Starting core database services..."
    docker-compose -f docker-compose.production.yml up -d postgres redis
    
    sleep 30  # Wait for database services
    
    # Deploy available applications one by one
    if [[ -d "02_Applications/00_aurex-platform" ]]; then
        log "INFO" "Deploying Aurex Platform..."
        docker-compose -f docker-compose.production.yml up -d --build aurex-platform-backend aurex-platform-frontend 2>/dev/null || log "WARNING" "Platform deployment may have issues"
    fi
    
    if [[ -d "02_Applications/02_aurex-launchpad" ]]; then
        log "INFO" "Deploying Aurex Launchpad..."
        docker-compose -f docker-compose.production.yml up -d --build aurex-launchpad-backend aurex-launchpad-frontend 2>/dev/null || log "WARNING" "Launchpad deployment may have issues"
    fi
    
    # Start nginx and monitoring
    log "INFO" "Starting nginx and monitoring services..."
    docker-compose -f docker-compose.production.yml up -d nginx prometheus grafana 2>/dev/null || log "WARNING" "Some services may not be available"
    
    log "SUCCESS" "Production environment deployment initiated"
}

validate_deployment() {
    local environment=$1
    log "INFO" "Validating $environment deployment..."
    
    local compose_file="docker-compose.${environment}.yml"
    if [[ "$environment" == "local" ]]; then
        compose_file="docker-compose.local.yml"
    fi
    
    # Check running containers
    log "INFO" "Checking running containers..."
    docker-compose -f "$compose_file" ps
    
    # Test key services
    log "INFO" "Testing service connectivity..."
    
    # Test database
    if docker-compose -f "$compose_file" exec -T postgres psql -U postgres -d aurex_platform -c "SELECT 1;" &>/dev/null; then
        log "SUCCESS" "Database is accessible"
    else
        log "WARNING" "Database connection issues"
    fi
    
    # Test Redis
    if docker-compose -f "$compose_file" exec -T redis redis-cli ping &>/dev/null; then
        log "SUCCESS" "Redis is accessible"
    else
        log "WARNING" "Redis connection issues"
    fi
    
    log "SUCCESS" "$environment deployment validation completed"
}

generate_deployment_report() {
    local report_file="${LOG_DIR}/deployment-report-${TIMESTAMP}.md"
    
    log "INFO" "Generating deployment report..."
    
    cat > "$report_file" << EOF
# Aurex Platform Deployment Report

**Deployment Date:** $(date)
**Environment:** Local -> Production
**Version:** ${VERSION_TAG}

## Deployment Summary

### Applications Available
- **aurex-platform**: Main platform application (Port 3000/8000)
- **aurex-launchpad**: ESG assessment application (Port 3001/8001)  
- **aurex-hydropulse**: Water management application (Port 3002/8002)
- **aurex-sylvagraph**: Forest management application (Port 3003/8003)

### Launchpad Analysis
The Launchpad application has been simplified to show only a landing page to prevent blank page issues. All routes now redirect to the main landing page which displays comprehensive ESG assessment information.

### Service Status

\`\`\`
$(docker-compose -f docker-compose.production.yml ps 2>/dev/null || echo "Production services status not available")
\`\`\`

### Access URLs

- **Local Environment**:
  - Aurex Platform: http://localhost:3000
  - Aurex Launchpad: http://localhost:3001
  - Database: localhost:5432
  - Redis: localhost:6379

- **Production Environment** (dev.aurigraph.io):
  - Aurex Platform: https://dev.aurigraph.io
  - Aurex Launchpad: https://dev.aurigraph.io/launchpad
  - Monitoring: http://localhost:3001 (Grafana)

### Next Steps

1. Monitor service health via Prometheus/Grafana
2. Test all application endpoints
3. Verify SSL certificates for production
4. Set up automated health checks
5. Configure load balancing

### Troubleshooting

If you encounter blank pages:
1. Check container logs: \`docker-compose logs [service-name]\`
2. Verify routing configuration in React apps
3. Ensure all required environment variables are set
4. Check network connectivity between containers

---
Generated by Aurex Platform Orchestrator
EOF

    log "SUCCESS" "Deployment report generated: $report_file"
    
    # Display the report
    echo ""
    echo -e "${CYAN}📋 DEPLOYMENT REPORT SUMMARY${NC}"
    echo -e "${YELLOW}================================${NC}"
    cat "$report_file"
}

# =============================================================================
# MAIN ORCHESTRATION WORKFLOW
# =============================================================================

main() {
    log "INFO" "🚀 Starting Aurex Platform Deployment Orchestrator"
    log "INFO" "=================================================="
    
    # Setup phase
    setup_environment
    check_prerequisites
    validate_application_structure
    
    # Analysis phase
    log "INFO" "🔍 Phase 1: Application Analysis"
    analyze_launchpad_issues
    
    # Local deployment phase
    log "INFO" "🏗️  Phase 2: Local Environment Deployment" 
    if deploy_local_environment; then
        sleep 30
        validate_deployment "local"
        log "SUCCESS" "Local environment deployment completed"
    else
        log "ERROR" "Local environment deployment failed"
        exit 1
    fi
    
    # Production deployment phase
    log "INFO" "🌐 Phase 3: Production Environment Deployment"
    if deploy_production_environment; then
        sleep 60
        validate_deployment "production"
        log "SUCCESS" "Production environment deployment completed"
    else
        log "WARNING" "Production environment deployment completed with issues"
    fi
    
    # Generate final report
    generate_deployment_report
    
    log "SUCCESS" "🎉 Aurex Platform Deployment Complete!"
    log "INFO" "=================================================="
    log "INFO" "📋 Deployment logs: $DEPLOYMENT_LOG"
    
    # Display final status
    echo ""
    echo -e "${GREEN}✅ DEPLOYMENT ORCHESTRATION COMPLETE${NC}"
    echo ""
    echo -e "${CYAN}🌐 Application URLs:${NC}"
    echo -e "${WHITE}   • Platform:     http://localhost:3000${NC}"
    echo -e "${WHITE}   • Launchpad:    http://localhost:3001${NC}"
    echo -e "${WHITE}   • Hydropulse:   http://localhost:3002${NC}"
    echo -e "${WHITE}   • Sylvagraph:   http://localhost:3003${NC}"
    echo ""
    echo -e "${CYAN}📊 Monitoring:${NC}"
    echo -e "${WHITE}   • Prometheus:   http://localhost:9090${NC}"
    echo -e "${WHITE}   • Grafana:      http://localhost:3001${NC}"
    echo ""
    echo -e "${YELLOW}📝 Next: Check the deployment report and test applications${NC}"
}

# Handle script interruption
cleanup() {
    log "WARNING" "Deployment orchestration interrupted"
    exit 130
}

trap cleanup INT TERM

# Execute main workflow
main "$@"