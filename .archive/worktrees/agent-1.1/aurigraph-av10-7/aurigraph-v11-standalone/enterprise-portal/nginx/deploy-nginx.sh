#!/bin/bash

################################################################################
# Aurigraph Enterprise Portal - NGINX Deployment Script
# Version: 4.3.2
# Purpose: Deploy NGINX proxy configuration to production server
# Usage: ./deploy-nginx.sh [--test|--deploy|--rollback]
################################################################################

set -e  # Exit on error

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
REMOTE_HOST="dlt.aurigraph.io"
REMOTE_USER="subbu"
REMOTE_PORT="22"
NGINX_CONF_LOCAL="./aurigraph-portal.conf"
NGINX_CONF_REMOTE="/etc/nginx/sites-available/aurigraph-portal"
NGINX_CONF_ENABLED="/etc/nginx/sites-enabled/aurigraph-portal"
FRONTEND_DIST="../dist"
FRONTEND_REMOTE="/var/www/aurigraph-portal/dist"
BACKUP_DIR="/tmp/nginx-backup-$(date +%Y%m%d-%H%M%S)"

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

    # Check if sshpass is available (for password authentication)
    if ! command -v sshpass &> /dev/null; then
        print_warning "sshpass not found. SSH key authentication will be used."
        print_info "To install sshpass: brew install hudochenkov/sshpass/sshpass (macOS) or apt-get install sshpass (Linux)"
    else
        print_success "sshpass found"
    fi

    # Check if NGINX config file exists
    if [ ! -f "$NGINX_CONF_LOCAL" ]; then
        print_error "NGINX configuration file not found: $NGINX_CONF_LOCAL"
        exit 1
    fi
    print_success "NGINX configuration file found"

    # Check if frontend dist directory exists
    if [ ! -d "$FRONTEND_DIST" ]; then
        print_warning "Frontend dist directory not found: $FRONTEND_DIST"
        print_info "Run 'npm run build' to generate production build"
    else
        print_success "Frontend dist directory found"
    fi
}

# Test NGINX configuration syntax
test_nginx_config() {
    print_header "Testing NGINX Configuration"

    print_info "Uploading configuration to remote server..."

    # Use sshpass if password is set, otherwise use SSH keys
    if [ -n "${REMOTE_PASSWORD:-}" ]; then
        sshpass -p "$REMOTE_PASSWORD" scp -P "$REMOTE_PORT" "$NGINX_CONF_LOCAL" "$REMOTE_USER@$REMOTE_HOST:/tmp/aurigraph-portal.conf"
    else
        scp -P "$REMOTE_PORT" "$NGINX_CONF_LOCAL" "$REMOTE_USER@$REMOTE_HOST:/tmp/aurigraph-portal.conf"
    fi

    print_info "Testing NGINX syntax..."

    if [ -n "${REMOTE_PASSWORD:-}" ]; then
        sshpass -p "$REMOTE_PASSWORD" ssh -p "$REMOTE_PORT" "$REMOTE_USER@$REMOTE_HOST" \
            "sudo nginx -t -c /tmp/aurigraph-portal.conf"
    else
        ssh -p "$REMOTE_PORT" "$REMOTE_USER@$REMOTE_HOST" \
            "sudo nginx -t -c /tmp/aurigraph-portal.conf"
    fi

    if [ $? -eq 0 ]; then
        print_success "NGINX configuration syntax is valid"
        return 0
    else
        print_error "NGINX configuration syntax test failed"
        return 1
    fi
}

# Backup current configuration
backup_config() {
    print_header "Backing Up Current Configuration"

    print_info "Creating backup directory: $BACKUP_DIR"

    if [ -n "${REMOTE_PASSWORD:-}" ]; then
        sshpass -p "$REMOTE_PASSWORD" ssh -p "$REMOTE_PORT" "$REMOTE_USER@$REMOTE_HOST" \
            "sudo mkdir -p $BACKUP_DIR && \
             sudo cp -r $NGINX_CONF_REMOTE $BACKUP_DIR/ 2>/dev/null || true && \
             sudo cp -r /var/log/nginx/aurigraph-portal-*.log $BACKUP_DIR/ 2>/dev/null || true"
    else
        ssh -p "$REMOTE_PORT" "$REMOTE_USER@$REMOTE_HOST" \
            "sudo mkdir -p $BACKUP_DIR && \
             sudo cp -r $NGINX_CONF_REMOTE $BACKUP_DIR/ 2>/dev/null || true && \
             sudo cp -r /var/log/nginx/aurigraph-portal-*.log $BACKUP_DIR/ 2>/dev/null || true"
    fi

    print_success "Configuration backed up to $BACKUP_DIR"
}

# Deploy NGINX configuration
deploy_config() {
    print_header "Deploying NGINX Configuration"

    # Upload configuration
    print_info "Uploading NGINX configuration..."
    if [ -n "${REMOTE_PASSWORD:-}" ]; then
        sshpass -p "$REMOTE_PASSWORD" scp -P "$REMOTE_PORT" "$NGINX_CONF_LOCAL" \
            "$REMOTE_USER@$REMOTE_HOST:/tmp/aurigraph-portal.conf"

        sshpass -p "$REMOTE_PASSWORD" ssh -p "$REMOTE_PORT" "$REMOTE_USER@$REMOTE_HOST" \
            "sudo mv /tmp/aurigraph-portal.conf $NGINX_CONF_REMOTE && \
             sudo chown root:root $NGINX_CONF_REMOTE && \
             sudo chmod 644 $NGINX_CONF_REMOTE"
    else
        scp -P "$REMOTE_PORT" "$NGINX_CONF_LOCAL" \
            "$REMOTE_USER@$REMOTE_HOST:/tmp/aurigraph-portal.conf"

        ssh -p "$REMOTE_PORT" "$REMOTE_USER@$REMOTE_HOST" \
            "sudo mv /tmp/aurigraph-portal.conf $NGINX_CONF_REMOTE && \
             sudo chown root:root $NGINX_CONF_REMOTE && \
             sudo chmod 644 $NGINX_CONF_REMOTE"
    fi

    print_success "NGINX configuration uploaded"

    # Create symlink in sites-enabled
    print_info "Enabling site configuration..."
    if [ -n "${REMOTE_PASSWORD:-}" ]; then
        sshpass -p "$REMOTE_PASSWORD" ssh -p "$REMOTE_PORT" "$REMOTE_USER@$REMOTE_HOST" \
            "sudo ln -sf $NGINX_CONF_REMOTE $NGINX_CONF_ENABLED"
    else
        ssh -p "$REMOTE_PORT" "$REMOTE_USER@$REMOTE_HOST" \
            "sudo ln -sf $NGINX_CONF_REMOTE $NGINX_CONF_ENABLED"
    fi

    print_success "Site configuration enabled"

    # Test configuration before reloading
    print_info "Testing NGINX configuration..."
    if [ -n "${REMOTE_PASSWORD:-}" ]; then
        sshpass -p "$REMOTE_PASSWORD" ssh -p "$REMOTE_PORT" "$REMOTE_USER@$REMOTE_HOST" "sudo nginx -t"
    else
        ssh -p "$REMOTE_PORT" "$REMOTE_USER@$REMOTE_HOST" "sudo nginx -t"
    fi

    if [ $? -ne 0 ]; then
        print_error "NGINX configuration test failed. Deployment aborted."
        exit 1
    fi

    print_success "NGINX configuration test passed"

    # Reload NGINX
    print_info "Reloading NGINX..."
    if [ -n "${REMOTE_PASSWORD:-}" ]; then
        sshpass -p "$REMOTE_PASSWORD" ssh -p "$REMOTE_PORT" "$REMOTE_USER@$REMOTE_HOST" \
            "sudo systemctl reload nginx"
    else
        ssh -p "$REMOTE_PORT" "$REMOTE_USER@$REMOTE_HOST" \
            "sudo systemctl reload nginx"
    fi

    if [ $? -eq 0 ]; then
        print_success "NGINX reloaded successfully"
    else
        print_error "NGINX reload failed"
        exit 1
    fi
}

# Deploy frontend files
deploy_frontend() {
    print_header "Deploying Frontend Files"

    if [ ! -d "$FRONTEND_DIST" ]; then
        print_warning "Frontend dist directory not found. Skipping frontend deployment."
        return 0
    fi

    # Create remote directory
    print_info "Creating remote directory..."
    if [ -n "${REMOTE_PASSWORD:-}" ]; then
        sshpass -p "$REMOTE_PASSWORD" ssh -p "$REMOTE_PORT" "$REMOTE_USER@$REMOTE_HOST" \
            "sudo mkdir -p $FRONTEND_REMOTE && sudo chown -R $REMOTE_USER:$REMOTE_USER $FRONTEND_REMOTE"
    else
        ssh -p "$REMOTE_PORT" "$REMOTE_USER@$REMOTE_HOST" \
            "sudo mkdir -p $FRONTEND_REMOTE && sudo chown -R $REMOTE_USER:$REMOTE_USER $FRONTEND_REMOTE"
    fi

    # Upload frontend files
    print_info "Uploading frontend files..."
    if [ -n "${REMOTE_PASSWORD:-}" ]; then
        sshpass -p "$REMOTE_PASSWORD" rsync -avz --delete -e "ssh -p $REMOTE_PORT" \
            "$FRONTEND_DIST/" "$REMOTE_USER@$REMOTE_HOST:$FRONTEND_REMOTE/"
    else
        rsync -avz --delete -e "ssh -p $REMOTE_PORT" \
            "$FRONTEND_DIST/" "$REMOTE_USER@$REMOTE_HOST:$FRONTEND_REMOTE/"
    fi

    print_success "Frontend files deployed"
}

# Rollback to previous configuration
rollback_config() {
    print_header "Rolling Back Configuration"

    print_info "Enter backup directory path (e.g., /tmp/nginx-backup-20250119-120000):"
    read -r backup_path

    if [ -z "$backup_path" ]; then
        print_error "No backup path provided. Rollback aborted."
        exit 1
    fi

    print_info "Restoring configuration from $backup_path..."

    if [ -n "${REMOTE_PASSWORD:-}" ]; then
        sshpass -p "$REMOTE_PASSWORD" ssh -p "$REMOTE_PORT" "$REMOTE_USER@$REMOTE_HOST" \
            "sudo cp $backup_path/aurigraph-portal $NGINX_CONF_REMOTE && \
             sudo nginx -t && \
             sudo systemctl reload nginx"
    else
        ssh -p "$REMOTE_PORT" "$REMOTE_USER@$REMOTE_HOST" \
            "sudo cp $backup_path/aurigraph-portal $NGINX_CONF_REMOTE && \
             sudo nginx -t && \
             sudo systemctl reload nginx"
    fi

    if [ $? -eq 0 ]; then
        print_success "Configuration rolled back successfully"
    else
        print_error "Rollback failed"
        exit 1
    fi
}

# Check NGINX status
check_status() {
    print_header "Checking NGINX Status"

    if [ -n "${REMOTE_PASSWORD:-}" ]; then
        sshpass -p "$REMOTE_PASSWORD" ssh -p "$REMOTE_PORT" "$REMOTE_USER@$REMOTE_HOST" \
            "sudo systemctl status nginx --no-pager"
    else
        ssh -p "$REMOTE_PORT" "$REMOTE_USER@$REMOTE_HOST" \
            "sudo systemctl status nginx --no-pager"
    fi
}

# Setup SSL certificates with Let's Encrypt
setup_ssl() {
    print_header "Setting Up SSL Certificates"

    print_info "Installing certbot..."
    if [ -n "${REMOTE_PASSWORD:-}" ]; then
        sshpass -p "$REMOTE_PASSWORD" ssh -p "$REMOTE_PORT" "$REMOTE_USER@$REMOTE_HOST" \
            "sudo apt-get update && sudo apt-get install -y certbot python3-certbot-nginx"
    else
        ssh -p "$REMOTE_PORT" "$REMOTE_USER@$REMOTE_HOST" \
            "sudo apt-get update && sudo apt-get install -y certbot python3-certbot-nginx"
    fi

    print_info "Obtaining SSL certificate for dlt.aurigraph.io..."
    if [ -n "${REMOTE_PASSWORD:-}" ]; then
        sshpass -p "$REMOTE_PASSWORD" ssh -p "$REMOTE_PORT" "$REMOTE_USER@$REMOTE_HOST" \
            "sudo certbot --nginx -d dlt.aurigraph.io --non-interactive --agree-tos -m admin@aurigraph.io"
    else
        ssh -p "$REMOTE_PORT" "$REMOTE_USER@$REMOTE_HOST" \
            "sudo certbot --nginx -d dlt.aurigraph.io --non-interactive --agree-tos -m admin@aurigraph.io"
    fi

    print_success "SSL certificate installed"
}

# Main script
main() {
    print_header "Aurigraph Enterprise Portal - NGINX Deployment"

    # Parse command line arguments
    case "${1:-}" in
        --test)
            check_prerequisites
            test_nginx_config
            ;;
        --deploy)
            check_prerequisites
            backup_config
            deploy_config
            deploy_frontend
            check_status
            print_success "Deployment completed successfully!"
            print_info "Access the portal at: https://dlt.aurigraph.io"
            ;;
        --rollback)
            rollback_config
            check_status
            ;;
        --status)
            check_status
            ;;
        --setup-ssl)
            setup_ssl
            ;;
        --help)
            echo "Usage: $0 [OPTION]"
            echo ""
            echo "Options:"
            echo "  --test        Test NGINX configuration syntax"
            echo "  --deploy      Deploy NGINX configuration and frontend files"
            echo "  --rollback    Rollback to previous configuration"
            echo "  --status      Check NGINX service status"
            echo "  --setup-ssl   Setup SSL certificates with Let's Encrypt"
            echo "  --help        Display this help message"
            echo ""
            echo "Environment variables:"
            echo "  REMOTE_PASSWORD   Remote server password (optional, uses SSH keys if not set)"
            echo ""
            echo "Examples:"
            echo "  $0 --test                    # Test configuration"
            echo "  $0 --deploy                  # Deploy to production"
            echo "  REMOTE_PASSWORD='pass' $0 --deploy  # Deploy with password auth"
            ;;
        *)
            print_error "Invalid option: ${1:-}"
            echo ""
            echo "Run '$0 --help' for usage information"
            exit 1
            ;;
    esac
}

# Run main function
main "$@"
