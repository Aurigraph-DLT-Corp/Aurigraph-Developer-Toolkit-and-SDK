#!/bin/bash

# =============================================================================
# Aurex Launchpad - Network Fix Deployment Script
# =============================================================================
# Description: Deploy fixes for launchpad frontend-backend communication issues
# Environment: Production (dev.aurigraph.io)
# Issues Fixed:
#   1. Network isolation between frontend and backend containers
#   2. Nginx proxy configuration using wrong container names
#   3. Missing shared network connectivity
# =============================================================================

set -euo pipefail

# =============================================================================
# CONFIGURATION
# =============================================================================

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$SCRIPT_DIR"
LOG_FILE="$PROJECT_ROOT/logs/launchpad-fix-$(date +%Y%m%d-%H%M%S).log"

# Production server configuration
PROD_HOST="dev.aurigraph.io"
PROD_PORT="2224"
PROD_USER="yogesh"
PROD_PASSWORD="newlY@Tt%Trans2025"
PROD_PATH="/opt/aurex-platform"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# =============================================================================
# UTILITY FUNCTIONS
# =============================================================================

log() {
    local level=$1
    shift
    local message="$*"
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    
    case $level in
        "INFO")  echo -e "${GREEN}[INFO]${NC} $message" ;;
        "WARN")  echo -e "${YELLOW}[WARN]${NC} $message" ;;
        "ERROR") echo -e "${RED}[ERROR]${NC} $message" ;;
        "DEBUG") echo -e "${BLUE}[DEBUG]${NC} $message" ;;
    esac
    
    # Log to file
    mkdir -p "$(dirname "$LOG_FILE")"
    echo "[$timestamp] [$level] $message" >> "$LOG_FILE"
}

check_prerequisites() {
    log "INFO" "Checking prerequisites for launchpad networking fix..."
    
    # Check required tools
    for tool in docker sshpass rsync curl; do
        if ! command -v "$tool" &> /dev/null; then
            log "ERROR" "$tool is not installed or not in PATH"
            exit 1
        fi
    done
    
    # Test SSH connection
    log "INFO" "Testing SSH connection to production server..."
    if ! sshpass -p "$PROD_PASSWORD" ssh -p "$PROD_PORT" -o ConnectTimeout=10 -o StrictHostKeyChecking=no \
        "$PROD_USER@$PROD_HOST" "echo 'SSH connection successful'" &> /dev/null; then
        log "ERROR" "Cannot connect to production server"
        exit 1
    fi
    
    log "INFO" "Prerequisites check completed successfully"
}

backup_current_launchpad() {
    log "INFO" "Creating backup of current launchpad containers..."
    
    local backup_name="launchpad-backup-$(date +%Y%m%d-%H%M%S)"
    
    # Create backup on production server
    sshpass -p "$PROD_PASSWORD" ssh -p "$PROD_PORT" "$PROD_USER@$PROD_HOST" << EOF
        set -e
        mkdir -p "$PROD_PATH/backups"
        
        # Backup current launchpad configuration
        if [[ -f "$PROD_PATH/docker-compose.production.yml" ]]; then
            echo "Backing up current docker-compose configuration..."
            cp "$PROD_PATH/docker-compose.production.yml" "$PROD_PATH/backups/${backup_name}-docker-compose.yml"
        fi
        
        # Export current launchpad containers
        if docker ps | grep -q aurex-launchpad; then
            echo "Exporting current launchpad container images..."
            docker save \$(docker ps --format "table {{.Image}}" | grep launchpad | tail -n +2) -o "$PROD_PATH/backups/${backup_name}-images.tar" || true
        fi
        
        echo "Backup created: $backup_name"
EOF
    
    log "INFO" "Backup completed: $backup_name"
    echo "$backup_name" > /tmp/launchpad_backup_name
}

sync_fixed_configuration() {
    log "INFO" "Syncing fixed configuration files to production server..."
    
    # Sync fixed docker-compose.production.yml
    sshpass -p "$PROD_PASSWORD" scp -P "$PROD_PORT" \
        "$PROJECT_ROOT/docker-compose.production.yml" "$PROD_USER@$PROD_HOST:$PROD_PATH/"
    
    # Sync the standalone fix configuration
    sshpass -p "$PROD_PASSWORD" scp -P "$PROD_PORT" \
        "$PROJECT_ROOT/docker-compose.launchpad-fix.yml" "$PROD_USER@$PROD_HOST:$PROD_PATH/"
    
    # Sync updated nginx configuration
    sshpass -p "$PROD_PASSWORD" scp -P "$PROD_PORT" \
        "$PROJECT_ROOT/02_Applications/02_aurex-launchpad/nginx.conf" \
        "$PROD_USER@$PROD_HOST:$PROD_PATH/02_Applications/02_aurex-launchpad/"
    
    # Sync entire launchpad application for rebuilding
    sshpass -p "$PROD_PASSWORD" scp -P "$PROD_PORT" -r \
        "$PROJECT_ROOT/02_Applications/02_aurex-launchpad" \
        "$PROD_USER@$PROD_HOST:$PROD_PATH/02_Applications/"
    
    log "INFO" "Configuration sync completed"
}

stop_current_launchpad() {
    log "INFO" "Stopping current launchpad containers..."
    
    sshpass -p "$PROD_PASSWORD" ssh -p "$PROD_PORT" "$PROD_USER@$PROD_HOST" << 'EOF'
        set -e
        cd /opt/aurex-platform
        
        # Stop only launchpad containers to minimize disruption
        echo "Stopping aurex-launchpad containers..."
        docker stop aurex-launchpad-frontend-production aurex-launchpad-backend-production || true
        
        # Remove the containers
        echo "Removing aurex-launchpad containers..."
        docker rm aurex-launchpad-frontend-production aurex-launchpad-backend-production || true
        
        echo "Launchpad containers stopped and removed"
EOF
    
    log "INFO" "Current launchpad containers stopped"
}

deploy_fixed_launchpad() {
    log "INFO" "Deploying fixed launchpad containers..."
    
    sshpass -p "$PROD_PASSWORD" ssh -p "$PROD_PORT" "$PROD_USER@$PROD_HOST" << 'EOF'
        set -e
        cd /opt/aurex-platform
        
        # Set environment variables
        export VERSION_TAG="production-fix"
        export ENVIRONMENT="production"
        
        # Build new images with fixes
        echo "Building fixed launchpad images..."
        docker-compose -f docker-compose.launchpad-fix.yml build --no-cache || {
            echo "Failed to build fixed images"
            exit 1
        }
        
        # Start the fixed launchpad containers
        echo "Starting fixed launchpad containers..."
        docker-compose -f docker-compose.launchpad-fix.yml up -d || {
            echo "Failed to start fixed containers"
            exit 1
        }
        
        echo "Fixed launchpad containers deployed successfully"
EOF
    
    log "INFO" "Fixed launchpad deployment completed"
}

validate_launchpad_fix() {
    log "INFO" "Validating launchpad networking fix..."
    
    local max_attempts=60  # 5 minutes
    local attempt=0
    
    # Wait for containers to be healthy
    while [[ $attempt -lt $max_attempts ]]; do
        log "DEBUG" "Checking launchpad container health... (attempt $((attempt + 1))/$max_attempts)"
        
        local health_status=$(sshpass -p "$PROD_PASSWORD" ssh -p "$PROD_PORT" "$PROD_USER@$PROD_HOST" << 'EOF'
            cd /opt/aurex-platform
            
            backend_health="unknown"
            frontend_health="unknown"
            
            # Check backend container
            if docker ps | grep -q aurex-launchpad-backend-production; then
                backend_health=$(docker inspect --format='{{.State.Health.Status}}' aurex-launchpad-backend-production 2>/dev/null || echo "no-healthcheck")
            fi
            
            # Check frontend container
            if docker ps | grep -q aurex-launchpad-frontend-production; then
                frontend_health=$(docker inspect --format='{{.State.Health.Status}}' aurex-launchpad-frontend-production 2>/dev/null || echo "no-healthcheck")
            fi
            
            # If no healthcheck, just check if running
            if [[ "$backend_health" == "no-healthcheck" ]]; then
                if docker ps | grep -q "aurex-launchpad-backend-production.*Up"; then
                    backend_health="healthy"
                fi
            fi
            
            if [[ "$frontend_health" == "no-healthcheck" ]]; then
                if docker ps | grep -q "aurex-launchpad-frontend-production.*Up"; then
                    frontend_health="healthy"
                fi
            fi
            
            echo "backend:$backend_health,frontend:$frontend_health"
EOF
        )
        
        if [[ "$health_status" =~ backend:([^,]+),frontend:(.+) ]]; then
            local backend_health="${BASH_REMATCH[1]}"
            local frontend_health="${BASH_REMATCH[2]}"
            
            log "DEBUG" "Backend: $backend_health, Frontend: $frontend_health"
            
            if [[ "$backend_health" == "healthy" ]] && [[ "$frontend_health" == "healthy" ]]; then
                log "INFO" "Launchpad containers are healthy!"
                break
            fi
        fi
        
        attempt=$((attempt + 1))
        sleep 5
    done
    
    if [[ $attempt -ge $max_attempts ]]; then
        log "WARN" "Containers did not become healthy within timeout, but continuing with connectivity test..."
    fi
    
    # Test frontend-backend connectivity
    log "INFO" "Testing frontend-backend connectivity..."
    
    local connectivity_result=$(sshpass -p "$PROD_PASSWORD" ssh -p "$PROD_PORT" "$PROD_USER@$PROD_HOST" << 'EOF'
        # Test if frontend can resolve backend hostname
        if docker exec aurex-launchpad-frontend-production nslookup aurex-launchpad-backend-production &>/dev/null; then
            echo "DNS_RESOLUTION:SUCCESS"
        else
            echo "DNS_RESOLUTION:FAILED"
        fi
        
        # Test if frontend can reach backend API
        if docker exec aurex-launchpad-frontend-production curl -f http://aurex-launchpad-backend-production:8001/health &>/dev/null; then
            echo "API_CONNECTIVITY:SUCCESS"
        else
            echo "API_CONNECTIVITY:FAILED"
        fi
        
        # Test external access to frontend
        if curl -f http://localhost:3001/health &>/dev/null; then
            echo "FRONTEND_ACCESS:SUCCESS"
        else
            echo "FRONTEND_ACCESS:FAILED"
        fi
EOF
    )
    
    local dns_ok=false
    local api_ok=false
    local frontend_ok=false
    
    while IFS= read -r line; do
        case "$line" in
            "DNS_RESOLUTION:SUCCESS") 
                log "INFO" "✓ DNS resolution working - frontend can resolve backend hostname"
                dns_ok=true
                ;;
            "DNS_RESOLUTION:FAILED")
                log "ERROR" "✗ DNS resolution failed - frontend cannot resolve backend hostname"
                ;;
            "API_CONNECTIVITY:SUCCESS")
                log "INFO" "✓ API connectivity working - frontend can reach backend"
                api_ok=true
                ;;
            "API_CONNECTIVITY:FAILED")
                log "ERROR" "✗ API connectivity failed - frontend cannot reach backend"
                ;;
            "FRONTEND_ACCESS:SUCCESS")
                log "INFO" "✓ Frontend access working - can reach frontend from host"
                frontend_ok=true
                ;;
            "FRONTEND_ACCESS:FAILED")
                log "WARN" "✗ Frontend access failed - cannot reach frontend from host"
                ;;
        esac
    done <<< "$connectivity_result"
    
    if [[ "$dns_ok" == true ]] && [[ "$api_ok" == true ]]; then
        log "INFO" "🎉 Networking fix validation successful!"
        return 0
    else
        log "ERROR" "Networking fix validation failed"
        return 1
    fi
}

show_fix_summary() {
    log "INFO" "=== LAUNCHPAD NETWORKING FIX COMPLETED ==="
    echo
    echo -e "${GREEN}Aurex Launchpad Networking Fix Applied${NC}"
    echo -e "${BLUE}Environment:${NC} Production (dev.aurigraph.io)"
    echo
    echo -e "${YELLOW}Issues Fixed:${NC}"
    echo "  • ✓ Network isolation between frontend and backend resolved"
    echo "  • ✓ Nginx proxy configuration updated with correct container names"
    echo "  • ✓ Shared network connectivity established"
    echo "  • ✓ API communication between frontend and backend working"
    echo
    echo -e "${YELLOW}Verification Commands:${NC}"
    echo "  • Check containers:  ssh -p $PROD_PORT $PROD_USER@$PROD_HOST 'docker ps | grep launchpad'"
    echo "  • Check logs:        ssh -p $PROD_PORT $PROD_USER@$PROD_HOST 'docker logs aurex-launchpad-frontend-production'"
    echo "  • Test frontend:     curl -f https://$PROD_HOST/launchpad"
    echo "  • Test API:          curl -f https://$PROD_HOST/launchpad/api/health"
    echo
    echo -e "${BLUE}Log file:${NC} $LOG_FILE"
    echo
}

rollback_launchpad() {
    local backup_name="$1"
    log "WARN" "Rolling back launchpad to backup: $backup_name"
    
    sshpass -p "$PROD_PASSWORD" ssh -p "$PROD_PORT" "$PROD_USER@$PROD_HOST" << EOF
        set -e
        cd "$PROD_PATH"
        
        # Stop fixed containers
        docker-compose -f docker-compose.launchpad-fix.yml down || true
        
        # Restore configuration
        if [[ -f "$PROD_PATH/backups/${backup_name}-docker-compose.yml" ]]; then
            cp "$PROD_PATH/backups/${backup_name}-docker-compose.yml" docker-compose.production.yml
        fi
        
        # Restore images if available
        if [[ -f "$PROD_PATH/backups/${backup_name}-images.tar" ]]; then
            docker load -i "$PROD_PATH/backups/${backup_name}-images.tar"
        fi
        
        # Start original containers
        docker-compose -f docker-compose.production.yml up -d aurex-launchpad-frontend aurex-launchpad-backend || true
EOF
    
    log "INFO" "Rollback completed"
}

# =============================================================================
# MAIN EXECUTION
# =============================================================================

main() {
    log "INFO" "Starting Aurex Launchpad Networking Fix"
    log "INFO" "Target: $PROD_HOST"
    
    check_prerequisites
    
    # Create backup before making changes
    backup_current_launchpad
    local backup_name=$(cat /tmp/launchpad_backup_name 2>/dev/null || echo "unknown")
    
    sync_fixed_configuration
    stop_current_launchpad
    deploy_fixed_launchpad
    
    if validate_launchpad_fix; then
        show_fix_summary
        log "INFO" "Launchpad networking fix completed successfully"
        
        # Clean up backup reference
        rm -f /tmp/launchpad_backup_name
        exit 0
    else
        log "ERROR" "Launchpad networking fix failed - initiating rollback"
        if [[ -n "$backup_name" ]] && [[ "$backup_name" != "unknown" ]]; then
            rollback_launchpad "$backup_name"
        fi
        log "INFO" "Log file: $LOG_FILE"
        exit 1
    fi
}

# Handle script interruption
trap 'log "WARN" "Launchpad fix interrupted by user"; exit 130' INT TERM

# Execute main function
main "$@"