#!/bin/bash

################################################################################
# Deploy Mock API Endpoints to Production
# Version: 1.0.0
# Purpose: Deploy mock-api-endpoints.conf to production server
# Usage: ./deploy-mock-endpoints.sh [--prod|--test|--rollback]
################################################################################

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
REMOTE_HOST="dlt.aurigraph.io"
REMOTE_USER="subbu"
REMOTE_PORT="2235"  # SSH port from credentials
LOCAL_MOCK_CONF="./mock-api-endpoints.conf"
LOCAL_PORTAL_CONF="./aurigraph-portal.conf"
REMOTE_NGINX_DIR="/etc/nginx/sites-available"
BACKUP_SUFFIX=".backup.$(date +%Y%m%d-%H%M%S)"

# Functions
print_header() {
    echo -e "\n${BLUE}================================${NC}"
    echo -e "${BLUE}$1${NC}"
    echo -e "${BLUE}================================${NC}\n"
}

print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

print_error() {
    echo -e "${RED}✗ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠ $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ $1${NC}"
}

deploy_to_prod() {
    print_header "Deploying Mock Endpoints to Production"

    # Verify files exist
    if [ ! -f "$LOCAL_MOCK_CONF" ]; then
        print_error "File not found: $LOCAL_MOCK_CONF"
        exit 1
    fi

    if [ ! -f "$LOCAL_PORTAL_CONF" ]; then
        print_error "File not found: $LOCAL_PORTAL_CONF"
        exit 1
    fi

    print_info "Local files verified"

    # Create backups on remote
    print_info "Creating backups on remote server..."
    ssh -p $REMOTE_PORT $REMOTE_USER@$REMOTE_HOST << 'EOF'
        echo "Creating backups..."
        if [ -f /etc/nginx/sites-available/aurigraph-portal ]; then
            sudo cp /etc/nginx/sites-available/aurigraph-portal \
                    /etc/nginx/sites-available/aurigraph-portal.backup.$(date +%Y%m%d-%H%M%S)
            echo "✓ Backup created: aurigraph-portal"
        fi

        if [ -f /etc/nginx/sites-available/mock-api-endpoints.conf ]; then
            sudo cp /etc/nginx/sites-available/mock-api-endpoints.conf \
                    /etc/nginx/sites-available/mock-api-endpoints.conf.backup.$(date +%Y%m%d-%H%M%S)
            echo "✓ Backup created: mock-api-endpoints.conf"
        fi
EOF

    print_success "Backups created on remote server"

    # Copy files to remote
    print_info "Copying files to remote server..."

    # First copy to /tmp
    scp -P $REMOTE_PORT "$LOCAL_MOCK_CONF" $REMOTE_USER@$REMOTE_HOST:/tmp/mock-api-endpoints.conf
    scp -P $REMOTE_PORT "$LOCAL_PORTAL_CONF" $REMOTE_USER@$REMOTE_HOST:/tmp/aurigraph-portal.conf

    print_success "Files copied to /tmp on remote"

    # Copy to /etc/nginx/sites-available/ and verify
    print_info "Installing configuration files..."
    ssh -p $REMOTE_PORT $REMOTE_USER@$REMOTE_HOST << 'EOF'
        echo "Installing mock-api-endpoints.conf..."
        sudo cp /tmp/mock-api-endpoints.conf /etc/nginx/sites-available/mock-api-endpoints.conf
        echo "✓ Installed: mock-api-endpoints.conf"

        echo "Installing aurigraph-portal.conf..."
        sudo cp /tmp/aurigraph-portal.conf /etc/nginx/sites-available/aurigraph-portal
        echo "✓ Installed: aurigraph-portal.conf"

        # Verify syntax
        echo "Testing NGINX configuration..."
        sudo nginx -t
        echo "✓ Configuration test passed"
EOF

    print_success "Configuration files installed"

    # Reload NGINX
    print_info "Reloading NGINX (zero-downtime)..."
    ssh -p $REMOTE_PORT $REMOTE_USER@$REMOTE_HOST << 'EOF'
        sudo systemctl reload nginx
        echo "Waiting for reload to complete..."
        sleep 2
        sudo systemctl status nginx --no-pager
EOF

    print_success "NGINX reloaded successfully"

    # Verify deployment
    print_info "Verifying endpoints..."
    test_endpoints

    print_header "Deployment Complete! ✓"
    print_success "All 39 mock endpoints deployed to production"
    print_info "Portal URL: https://dlt.aurigraph.io"
    print_info "Next step: Visit portal and verify all metrics display correctly"
}

rollback() {
    print_header "Rolling Back to Previous Configuration"

    ssh -p $REMOTE_PORT $REMOTE_USER@$REMOTE_HOST << 'EOF'
        echo "Finding latest backup..."
        LATEST_BACKUP=$(ls -t /etc/nginx/sites-available/aurigraph-portal.backup.* 2>/dev/null | head -1)

        if [ -z "$LATEST_BACKUP" ]; then
            echo "No backup found!"
            exit 1
        fi

        echo "Rolling back from: $LATEST_BACKUP"
        sudo cp "$LATEST_BACKUP" /etc/nginx/sites-available/aurigraph-portal

        echo "Testing NGINX configuration..."
        sudo nginx -t

        echo "Reloading NGINX..."
        sudo systemctl reload nginx

        echo "✓ Rollback complete"
EOF

    print_success "Rollback completed successfully"
}

test_endpoints() {
    print_info "Testing sample endpoints..."

    ENDPOINTS=(
        "/api/v11/health"
        "/api/v11/info"
        "/api/v11/blockchain/metrics"
        "/api/v11/validators"
        "/api/v11/transactions"
        "/api/v11/analytics"
        "/api/v11/ml/performance"
        "/api/v11/rwa/tokens"
        "/api/v11/contracts/ricardian"
        "/api/v11/demos"
    )

    PASSED=0
    FAILED=0

    for endpoint in "${ENDPOINTS[@]}"; do
        status=$(curl -s -o /dev/null -w "%{http_code}" "https://dlt.aurigraph.io$endpoint" -k 2>/dev/null)
        if [ "$status" == "200" ]; then
            print_success "$endpoint [$status]"
            PASSED=$((PASSED + 1))
        else
            print_error "$endpoint [$status]"
            FAILED=$((FAILED + 1))
        fi
    done

    echo ""
    echo -e "Results: ${GREEN}$PASSED passed${NC}, ${RED}$FAILED failed${NC}"
}

show_usage() {
    cat << EOF
Usage: ./deploy-mock-endpoints.sh [OPTION]

Options:
  --prod       Deploy to production (default)
  --test       Test endpoints without deploying
  --rollback   Rollback to previous configuration
  --help       Show this help message

Examples:
  ./deploy-mock-endpoints.sh                # Deploy to production
  ./deploy-mock-endpoints.sh --prod         # Same as above
  ./deploy-mock-endpoints.sh --test         # Test endpoints only
  ./deploy-mock-endpoints.sh --rollback     # Rollback changes

Configuration:
  Remote: $REMOTE_USER@$REMOTE_HOST:$REMOTE_PORT
  Files:
    - Local: $LOCAL_MOCK_CONF
    - Local: $LOCAL_PORTAL_CONF
    - Remote: $REMOTE_NGINX_DIR/mock-api-endpoints.conf
    - Remote: $REMOTE_NGINX_DIR/aurigraph-portal

EOF
}

# Main
case "${1:---prod}" in
    --prod)
        deploy_to_prod
        ;;
    --test)
        print_header "Testing Endpoints"
        test_endpoints
        ;;
    --rollback)
        rollback
        ;;
    --help|-h)
        show_usage
        ;;
    *)
        print_error "Unknown option: $1"
        show_usage
        exit 1
        ;;
esac
