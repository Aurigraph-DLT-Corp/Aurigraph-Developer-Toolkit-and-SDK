#!/bin/bash
################################################################################
# TIER 1 Infrastructure Fixes - Automated Execution Script
# Aurigraph DLT V12 - Critical Infrastructure Fixes
# Date: December 5, 2025
################################################################################

set -e  # Exit on error
set -u  # Exit on undefined variable

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
REMOTE_HOST="dlt.aurigraph.io"
REMOTE_PORT="2235"
REMOTE_USER="subbu"
LEVELDB_PATH="/var/lib/aurigraph/leveldb"

################################################################################
# Helper Functions
################################################################################

log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

separator() {
    echo "================================================================================"
}

################################################################################
# Fix 1: PostgreSQL Database
################################################################################

fix_postgresql() {
    separator
    log_info "FIX 1: Starting PostgreSQL Database"
    separator
    
    # Check if PostgreSQL is running
    log_info "Checking PostgreSQL status..."
    if ssh -p ${REMOTE_PORT} ${REMOTE_USER}@${REMOTE_HOST} "docker ps | grep -q dlt-postgres"; then
        log_success "PostgreSQL is already running"
    else
        log_warning "PostgreSQL is not running. Starting it now..."
        
        # Check if container exists but is stopped
        if ssh -p ${REMOTE_PORT} ${REMOTE_USER}@${REMOTE_HOST} "docker ps -a | grep -q dlt-postgres"; then
            log_info "Starting existing PostgreSQL container..."
            ssh -p ${REMOTE_PORT} ${REMOTE_USER}@${REMOTE_HOST} "cd /home/subbu/aurigraph && docker-compose start postgres"
        else
            log_info "Creating and starting PostgreSQL container..."
            ssh -p ${REMOTE_PORT} ${REMOTE_USER}@${REMOTE_HOST} "cd /home/subbu/aurigraph && docker-compose up -d postgres"
        fi
        
        # Wait for PostgreSQL to be ready
        log_info "Waiting for PostgreSQL to be ready..."
        sleep 10
        
        # Verify it's running
        if ssh -p ${REMOTE_PORT} ${REMOTE_USER}@${REMOTE_HOST} "docker ps | grep -q dlt-postgres"; then
            log_success "PostgreSQL started successfully"
        else
            log_error "Failed to start PostgreSQL"
            return 1
        fi
    fi
    
    # Test database connection
    log_info "Testing database connection..."
    if ssh -p ${REMOTE_PORT} ${REMOTE_USER}@${REMOTE_HOST} "docker exec dlt-postgres psql -U aurigraph -d aurigraph_production -c 'SELECT 1;' > /dev/null 2>&1"; then
        log_success "Database connection successful"
    else
        log_error "Database connection failed"
        log_info "Checking PostgreSQL logs..."
        ssh -p ${REMOTE_PORT} ${REMOTE_USER}@${REMOTE_HOST} "docker logs --tail 50 dlt-postgres"
        return 1
    fi
    
    log_success "Fix 1 completed: PostgreSQL is running and accessible"
}

################################################################################
# Fix 2: LevelDB Paths
################################################################################

fix_leveldb_paths() {
    separator
    log_info "FIX 2: Configuring LevelDB Paths"
    separator
    
    # Check if directory exists
    log_info "Checking LevelDB directory: ${LEVELDB_PATH}"
    if ssh -p ${REMOTE_PORT} ${REMOTE_USER}@${REMOTE_HOST} "test -d ${LEVELDB_PATH}"; then
        log_success "LevelDB directory exists"
    else
        log_warning "LevelDB directory does not exist. Creating it..."
        ssh -p ${REMOTE_PORT} ${REMOTE_USER}@${REMOTE_HOST} "sudo mkdir -p ${LEVELDB_PATH}"
    fi
    
    # Set proper permissions
    log_info "Setting proper permissions..."
    ssh -p ${REMOTE_PORT} ${REMOTE_USER}@${REMOTE_HOST} "sudo chown -R ${REMOTE_USER}:${REMOTE_USER} /var/lib/aurigraph"
    ssh -p ${REMOTE_PORT} ${REMOTE_USER}@${REMOTE_HOST} "sudo chmod -R 755 /var/lib/aurigraph"
    
    # Create node-specific directories
    log_info "Creating node-specific directories..."
    ssh -p ${REMOTE_PORT} ${REMOTE_USER}@${REMOTE_HOST} "mkdir -p ${LEVELDB_PATH}/node-1"
    ssh -p ${REMOTE_PORT} ${REMOTE_USER}@${REMOTE_HOST} "mkdir -p ${LEVELDB_PATH}/prod-node-1"
    ssh -p ${REMOTE_PORT} ${REMOTE_USER}@${REMOTE_HOST} "mkdir -p ${LEVELDB_PATH}/v11-standalone-1"
    
    # Test write permissions
    log_info "Testing write permissions..."
    if ssh -p ${REMOTE_PORT} ${REMOTE_USER}@${REMOTE_HOST} "touch ${LEVELDB_PATH}/test.txt && rm ${LEVELDB_PATH}/test.txt"; then
        log_success "Write permissions verified"
    else
        log_error "Write permission test failed"
        return 1
    fi
    
    # Show directory structure
    log_info "LevelDB directory structure:"
    ssh -p ${REMOTE_PORT} ${REMOTE_USER}@${REMOTE_HOST} "ls -la ${LEVELDB_PATH}"
    
    log_success "Fix 2 completed: LevelDB paths configured with proper permissions"
}

################################################################################
# Verification
################################################################################

verify_fixes() {
    separator
    log_info "VERIFICATION: Testing Critical Endpoints"
    separator
    
    # Test Login API
    log_info "Testing Login API..."
    LOGIN_RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" -X POST https://dlt.aurigraph.io/api/v11/auth/login \
        -H "Content-Type: application/json" \
        -d '{"username":"test","password":"test"}' || echo "000")
    
    if [ "$LOGIN_RESPONSE" == "200" ] || [ "$LOGIN_RESPONSE" == "401" ] || [ "$LOGIN_RESPONSE" == "403" ]; then
        log_success "Login API responding (HTTP $LOGIN_RESPONSE) - Database connection OK"
    else
        log_warning "Login API returned HTTP $LOGIN_RESPONSE (expected 200/401/403, not 500)"
    fi
    
    # Test Demo Registration API
    log_info "Testing Demo Registration API..."
    DEMO_RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" -X POST https://dlt.aurigraph.io/api/v11/auth/demo-register \
        -H "Content-Type: application/json" \
        -d '{"email":"test@example.com"}' || echo "000")
    
    if [ "$DEMO_RESPONSE" == "200" ] || [ "$DEMO_RESPONSE" == "400" ] || [ "$DEMO_RESPONSE" == "409" ]; then
        log_success "Demo Registration API responding (HTTP $DEMO_RESPONSE) - Database connection OK"
    else
        log_warning "Demo Registration API returned HTTP $DEMO_RESPONSE (expected 200/400/409, not 500)"
    fi
    
    # Check application logs for errors
    log_info "Checking application logs for errors..."
    ERROR_COUNT=$(ssh -p ${REMOTE_PORT} ${REMOTE_USER}@${REMOTE_HOST} \
        "docker logs --tail 100 dlt-aurigraph-v11 2>&1 | grep -i 'error\|exception' | wc -l" || echo "0")
    
    if [ "$ERROR_COUNT" -gt 0 ]; then
        log_warning "Found $ERROR_COUNT error/exception lines in recent logs"
        log_info "Recent errors:"
        ssh -p ${REMOTE_PORT} ${REMOTE_USER}@${REMOTE_HOST} \
            "docker logs --tail 100 dlt-aurigraph-v11 2>&1 | grep -i 'error\|exception' | tail -10"
    else
        log_success "No errors found in recent application logs"
    fi
}

################################################################################
# Main Execution
################################################################################

main() {
    echo ""
    separator
    log_info "TIER 1 INFRASTRUCTURE FIXES - AUTOMATED EXECUTION"
    log_info "Aurigraph DLT V12 - Critical Infrastructure Fixes"
    log_info "Date: $(date '+%Y-%m-%d %H:%M:%S')"
    separator
    echo ""
    
    # Check SSH connectivity
    log_info "Testing SSH connectivity to ${REMOTE_HOST}:${REMOTE_PORT}..."
    if ! ssh -p ${REMOTE_PORT} -o ConnectTimeout=10 ${REMOTE_USER}@${REMOTE_HOST} "echo 'Connected'" > /dev/null 2>&1; then
        log_error "Cannot connect to remote server ${REMOTE_HOST}:${REMOTE_PORT}"
        log_error "Please ensure:"
        log_error "  1. Server is running"
        log_error "  2. SSH port ${REMOTE_PORT} is open"
        log_error "  3. SSH keys are configured"
        exit 1
    fi
    log_success "SSH connection successful"
    echo ""
    
    # Execute fixes
    if fix_postgresql; then
        echo ""
    else
        log_error "PostgreSQL fix failed. Stopping execution."
        exit 1
    fi
    
    if fix_leveldb_paths; then
        echo ""
    else
        log_error "LevelDB fix failed. Stopping execution."
        exit 1
    fi
    
    # Verify fixes
    verify_fixes
    echo ""
    
    # Summary
    separator
    log_success "TIER 1 INFRASTRUCTURE FIXES COMPLETED"
    separator
    echo ""
    log_info "Next Steps:"
    log_info "  1. Update TokenDataService.java to re-enable TokenManagementService"
    log_info "  2. Rebuild and redeploy the application"
    log_info "  3. Test Token Creation API"
    log_info "  4. Proceed with TIER 2 configuration cleanup"
    echo ""
    log_info "See TIER1-FIXES-EXECUTION-PLAN.md for detailed instructions"
    separator
}

# Run main function
main "$@"
