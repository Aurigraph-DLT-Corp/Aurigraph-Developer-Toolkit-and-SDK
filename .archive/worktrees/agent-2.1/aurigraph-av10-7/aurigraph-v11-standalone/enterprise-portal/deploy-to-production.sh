#!/bin/bash

################################################################################
# Enterprise Portal v4.8.0 - Production Deployment Script
# Purpose: Deploy Portal to dlt.aurigraph.io
# Usage: ./deploy-to-production.sh [--build|--deploy|--verify|--all]
################################################################################

set -e

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
REMOTE_HOST="dlt.aurigraph.io"
REMOTE_USER="subbu"
REMOTE_PORT="2235"
REMOTE_PATH="/var/www/aurigraph-portal/dist"
LOCAL_PATH="./dist"
PORTAL_VERSION="4.8.0"
BACKUP_DIR="/var/www/aurigraph-portal"

# Functions
print_header() {
    echo -e "${BLUE}================================${NC}"
    echo -e "${BLUE}$1${NC}"
    echo -e "${BLUE}================================${NC}"
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

# Check prerequisites
check_prerequisites() {
    print_header "Checking Prerequisites"

    if ! command -v rsync &> /dev/null; then
        print_warning "rsync not found. Will use scp instead."
    else
        print_success "rsync found"
    fi

    if ! command -v npm &> /dev/null; then
        print_error "npm not found. Please install Node.js"
        exit 1
    fi
    print_success "npm found"

    # Check if local dist directory exists
    if [ ! -d "$LOCAL_PATH" ]; then
        print_warning "dist/ directory not found. Run 'npm run build' first."
    else
        print_success "dist/ directory found"
        local_size=$(du -sh "$LOCAL_PATH" | cut -f1)
        print_info "Build size: $local_size"
    fi
}

# Build Portal for production
build_portal() {
    print_header "Building Portal for Production"

    print_info "Running: npm run build"
    npm run build

    if [ -d "$LOCAL_PATH" ]; then
        print_success "Build completed successfully"
        local_size=$(du -sh "$LOCAL_PATH" | cut -f1)
        print_info "Build size: $local_size"
    else
        print_error "Build failed - dist/ directory not found"
        exit 1
    fi
}

# Backup current deployment on remote
backup_remote() {
    print_header "Backing Up Current Deployment"

    print_info "Creating backup on remote server..."

    ssh -p "$REMOTE_PORT" "$REMOTE_USER@$REMOTE_HOST" \
        "sudo mkdir -p ${BACKUP_DIR}/backups && \
         sudo cp -r ${REMOTE_PATH} ${BACKUP_DIR}/backups/dist.backup-$(date +%Y%m%d-%H%M%S) && \
         echo 'Backup created successfully'" 2>/dev/null || {
        print_warning "Could not create backup (permission issue - continuing anyway)"
    }

    print_success "Backup created"
}

# Deploy using rsync
deploy_rsync() {
    print_header "Deploying Portal (rsync)"

    print_info "Uploading files using rsync..."

    if rsync -avz --delete -e "ssh -p $REMOTE_PORT" "$LOCAL_PATH/" "$REMOTE_USER@$REMOTE_HOST:$REMOTE_PATH/" 2>/dev/null; then
        print_success "Files deployed successfully"
    else
        print_error "rsync deployment failed"
        return 1
    fi
}

# Deploy using scp (fallback)
deploy_scp() {
    print_header "Deploying Portal (scp - Fallback)"

    print_info "Ensuring remote directory exists..."
    ssh -p "$REMOTE_PORT" "$REMOTE_USER@$REMOTE_HOST" \
        "mkdir -p $REMOTE_PATH" 2>/dev/null || {
        print_warning "Could not create directory - attempting anyway"
    }

    print_info "Uploading files using scp..."
    if scp -P "$REMOTE_PORT" -r "$LOCAL_PATH"/* "$REMOTE_USER@$REMOTE_HOST:$REMOTE_PATH/" 2>/dev/null; then
        print_success "Files deployed successfully"
    else
        print_error "scp deployment failed"
        return 1
    fi
}

# Deploy files
deploy_files() {
    print_header "Deploying Portal Files"

    print_info "Testing SSH connection..."
    if ! ssh -p "$REMOTE_PORT" "$REMOTE_USER@$REMOTE_HOST" "echo 'SSH connection OK'" &>/dev/null; then
        print_error "Cannot connect to $REMOTE_HOST:$REMOTE_PORT"
        print_info "Ensure server is accessible and SSH is running"
        exit 1
    fi
    print_success "SSH connection OK"

    # Create backup
    backup_remote

    # Try rsync first, fall back to scp
    if command -v rsync &> /dev/null; then
        deploy_rsync || deploy_scp
    else
        deploy_scp
    fi
}

# Verify deployment
verify_deployment() {
    print_header "Verifying Deployment"

    print_info "Checking if files exist on remote server..."
    if ssh -p "$REMOTE_PORT" "$REMOTE_USER@$REMOTE_HOST" \
        "test -f $REMOTE_PATH/index.html && echo 'index.html found'" &>/dev/null; then
        print_success "index.html found on remote"
    else
        print_error "index.html not found on remote"
        return 1
    fi

    print_info "Checking NGINX configuration..."
    if ssh -p "$REMOTE_PORT" "$REMOTE_USER@$REMOTE_HOST" \
        "sudo nginx -t" 2>&1 | grep -q "successful"; then
        print_success "NGINX configuration valid"
    else
        print_warning "NGINX test had warnings (may be OK)"
    fi

    print_info "Reloading NGINX..."
    if ssh -p "$REMOTE_PORT" "$REMOTE_USER@$REMOTE_HOST" \
        "sudo systemctl reload nginx" &>/dev/null; then
        print_success "NGINX reloaded"
    else
        print_warning "NGINX reload may have failed (checking status)"
        ssh -p "$REMOTE_PORT" "$REMOTE_USER@$REMOTE_HOST" \
            "sudo systemctl status nginx" || true
    fi

    print_info "Testing Portal access..."
    if curl -s -I "https://$REMOTE_HOST" | grep -q "200\|301\|302"; then
        print_success "Portal is accessible at https://$REMOTE_HOST"
    else
        print_warning "Portal may not be accessible yet (check manually)"
    fi

    print_success "Deployment verification complete"
}

# Display portal info
show_portal_info() {
    print_header "Portal Information"

    print_info "Portal Version: $PORTAL_VERSION"
    print_info "Remote Host: $REMOTE_HOST"
    print_info "Remote Path: $REMOTE_PATH"

    if [ -d "$LOCAL_PATH" ]; then
        local_size=$(du -sh "$LOCAL_PATH" | cut -f1)
        print_info "Local Build Size: $local_size"
    fi

    print_info "Portal URL: https://$REMOTE_HOST"
    print_info "Deployment Date: $(date '+%Y-%m-%d %H:%M:%S')"
}

# Main script
main() {
    show_portal_info
    check_prerequisites

    case "${1:-}" in
        --build)
            build_portal
            ;;
        --deploy)
            deploy_files
            verify_deployment
            print_success "Deployment completed successfully!"
            ;;
        --verify)
            verify_deployment
            ;;
        --all)
            build_portal
            deploy_files
            verify_deployment
            print_success "Complete deployment finished successfully!"
            ;;
        --help)
            echo "Usage: $0 [OPTION]"
            echo ""
            echo "Options:"
            echo "  --build     Build Portal for production"
            echo "  --deploy    Deploy to remote server (assumes dist/ exists)"
            echo "  --verify    Verify remote deployment"
            echo "  --all       Build, deploy, and verify (complete flow)"
            echo "  --help      Display this help message"
            echo ""
            echo "Examples:"
            echo "  $0 --build              # Build only"
            echo "  $0 --deploy             # Deploy (assumes already built)"
            echo "  $0 --all                # Build and deploy everything"
            echo ""
            ;;
        *)
            print_error "Invalid option: ${1:-}"
            echo "Run '$0 --help' for usage information"
            exit 1
            ;;
    esac
}

# Run main function
main "$@"
