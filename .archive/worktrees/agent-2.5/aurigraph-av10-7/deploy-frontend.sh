#!/bin/bash

################################################################################
#
# Aurigraph V11 Enterprise Portal - Frontend Deployment Script
#
# This script deploys the fixed frontend to the production server
#
# Prerequisites:
# - SSH key configured for access to dlt.aurigraph.io
# - Sudo access on remote server
# - Frontend build already completed (dist/ directory exists)
#
# Usage:
#   chmod +x deploy-frontend.sh
#   ./deploy-frontend.sh
#
################################################################################

set -e  # Exit on any error

# Configuration
REMOTE_USER="subbu"
REMOTE_HOST="dlt.aurigraph.io"
REMOTE_PORT="22"
LOCAL_PROJECT_ROOT="/Users/subbujois/subbuworkingdir/Aurigraph-DLT/aurigraph-av10-7/aurigraph-v11-standalone/enterprise-portal"
LOCAL_DIST="${LOCAL_PROJECT_ROOT}/dist"
REMOTE_HTML="/usr/share/nginx/html"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Helper functions
print_header() {
    echo -e "${BLUE}════════════════════════════════════════════════════════════${NC}"
    echo -e "${BLUE}  $1${NC}"
    echo -e "${BLUE}════════════════════════════════════════════════════════════${NC}"
}

print_step() {
    echo -e "${YELLOW}$1${NC}"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Main deployment function
main() {
    print_header "Aurigraph V11 Frontend Deployment"
    echo ""

    # Validate local build
    print_step "Step 1: Validating local build..."
    if [ ! -d "$LOCAL_DIST" ]; then
        print_error "Build directory not found: $LOCAL_DIST"
        echo "Run 'npm run build' first"
        exit 1
    fi

    if [ ! -f "$LOCAL_DIST/index.html" ]; then
        print_error "index.html not found in dist directory"
        exit 1
    fi

    print_success "Local build validated"
    echo "  - index.html: $(ls -lh $LOCAL_DIST/index.html | awk '{print $5}')"
    echo "  - Total files: $(find $LOCAL_DIST -type f | wc -l)"
    echo ""

    # Test SSH connection
    print_step "Step 2: Testing SSH connection..."
    if ! ssh -p $REMOTE_PORT $REMOTE_USER@$REMOTE_HOST "echo '✅ SSH Connected'" > /dev/null 2>&1; then
        print_error "SSH connection failed to $REMOTE_USER@$REMOTE_HOST:$REMOTE_PORT"
        echo "Please check:"
        echo "  - SSH key configuration"
        echo "  - Network connectivity"
        echo "  - Firewall rules"
        exit 1
    fi
    print_success "SSH connection successful"
    echo ""

    # Create backup
    print_step "Step 3: Creating backup..."
    BACKUP_NAME="html.backup.$(date +%s)"
    BACKUP_PATH="/usr/share/nginx/$BACKUP_NAME"

    if ssh -p $REMOTE_PORT $REMOTE_USER@$REMOTE_HOST "sudo cp -r $REMOTE_HTML $BACKUP_PATH" > /dev/null 2>&1; then
        print_success "Backup created: $BACKUP_NAME"
    else
        print_error "Failed to create backup"
        exit 1
    fi
    echo ""

    # Deploy files
    print_step "Step 4: Deploying new frontend..."
    echo "Uploading files to $REMOTE_HOST:$REMOTE_HTML..."

    if scp -P $REMOTE_PORT -r "$LOCAL_DIST"/* $REMOTE_USER@$REMOTE_HOST:$REMOTE_HTML/ > /dev/null 2>&1; then
        print_success "Files uploaded successfully"
    else
        print_error "Failed to upload files"
        echo "Attempting to rollback backup..."
        ssh -p $REMOTE_PORT $REMOTE_USER@$REMOTE_HOST "sudo rm -rf $REMOTE_HTML && sudo cp -r $BACKUP_PATH $REMOTE_HTML" > /dev/null 2>&1
        exit 1
    fi
    echo ""

    # Reload NGINX
    print_step "Step 5: Reloading NGINX..."
    if ssh -p $REMOTE_PORT $REMOTE_USER@$REMOTE_HOST "sudo systemctl reload nginx" > /dev/null 2>&1; then
        print_success "NGINX reloaded successfully"
    else
        print_error "Failed to reload NGINX"
        echo "Attempting to rollback backup..."
        ssh -p $REMOTE_PORT $REMOTE_USER@$REMOTE_HOST "sudo rm -rf $REMOTE_HTML && sudo cp -r $BACKUP_PATH $REMOTE_HTML && sudo systemctl reload nginx" > /dev/null 2>&1
        exit 1
    fi
    echo ""

    # Verify deployment
    print_step "Step 6: Verifying deployment..."

    # Give NGINX a moment to settle
    sleep 2

    # Try HTTPS first, fall back to HTTP
    HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" -I https://dlt.aurigraph.io/ 2>/dev/null || \
                  curl -s -o /dev/null -w "%{http_code}" -I http://dlt.aurigraph.io/ 2>/dev/null || \
                  echo "000")

    if [[ "$HTTP_STATUS" == "200" || "$HTTP_STATUS" == "301" || "$HTTP_STATUS" == "302" ]]; then
        print_success "Portal is accessible (HTTP $HTTP_STATUS)"
    else
        print_error "Portal returned HTTP $HTTP_STATUS (expected 200/301/302)"
        echo "Portal may still be loading or have connectivity issues"
    fi
    echo ""

    # Success summary
    print_header "Deployment Complete!"
    echo ""
    echo "📝 Deployment Summary:"
    echo "  - Backup: $BACKUP_NAME"
    echo "  - Deploy Time: $(date)"
    echo "  - Portal: https://dlt.aurigraph.io/"
    echo ""
    echo "✅ Next Steps:"
    echo ""
    echo "1. Open https://dlt.aurigraph.io in your browser"
    echo ""
    echo "2. Press F12 to open Developer Tools"
    echo ""
    echo "3. Go to the Console tab and verify:"
    echo "   - NO '405 Method Not Allowed' errors"
    echo "   - NO 'WebSocket connection to wss://dlt.aurigraph.io failed' errors"
    echo "   - Message: '✅ Demo service initialized successfully'"
    echo "   - Message: '✅ Channel WebSocket connected'"
    echo ""
    echo "4. Test functionality:"
    echo "   - Navigate through dashboard pages"
    echo "   - Try registering a demo"
    echo "   - Check real-time metrics update"
    echo ""
    echo "⚠️  Important Notes:"
    echo "  - Users may need to do Ctrl+Shift+R (hard refresh) to clear browser cache"
    echo "  - Backend API must be running on port 9003 for full functionality"
    echo "  - Rollback available: $BACKUP_PATH"
    echo ""

    # Offer rollback option
    read -p "Would you like to see rollback instructions? (y/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        echo ""
        echo "📋 Rollback Instructions:"
        echo ""
        echo "To rollback to the previous version, run:"
        echo ""
        echo "ssh -p $REMOTE_PORT $REMOTE_USER@$REMOTE_HOST << 'ROLLBACK'"
        echo "sudo rm -rf $REMOTE_HTML"
        echo "sudo cp -r $BACKUP_PATH $REMOTE_HTML"
        echo "sudo systemctl reload nginx"
        echo "echo '✅ Rollback complete'"
        echo "ROLLBACK"
        echo ""
    fi
}

# Run main function
main

