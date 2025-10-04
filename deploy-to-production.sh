#!/bin/bash
# Aurigraph V11 Enterprise Portal - Production Deployment Script
# Version: 1.0
# Date: October 4, 2025

set -e  # Exit on error

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
REMOTE_SERVER="dlt.aurigraph.io"
REMOTE_PORT="2235"
REMOTE_USER="subbu"
REMOTE_PASSWORD="subbuFuture@2025"
LOCAL_PORTAL_FILE="/Users/subbujois/Documents/GitHub/Aurigraph-DLT/aurigraph-av10-7/aurigraph-v11-standalone/aurigraph-v11-enterprise-portal.html"
REMOTE_PORTAL_DIR="/opt/aurigraph/portal"
DEPLOYMENT_ENV="green"  # Blue/Green deployment
BACKUP_DIR="/opt/aurigraph/backups"

# Functions
print_header() {
    echo -e "${BLUE}=================================================${NC}"
    echo -e "${BLUE}$1${NC}"
    echo -e "${BLUE}=================================================${NC}"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

# Check prerequisites
check_prerequisites() {
    print_header "Checking Prerequisites"

    # Check if portal file exists
    if [ ! -f "$LOCAL_PORTAL_FILE" ]; then
        print_error "Portal file not found: $LOCAL_PORTAL_FILE"
        exit 1
    fi
    print_success "Portal file found ($(wc -l < $LOCAL_PORTAL_FILE) lines)"

    # Check SSH connectivity
    print_info "Testing SSH connectivity to $REMOTE_SERVER:$REMOTE_PORT..."
    if ssh -p $REMOTE_PORT -o ConnectTimeout=10 ${REMOTE_USER}@${REMOTE_SERVER} "echo 'SSH connection successful'" 2>/dev/null; then
        print_success "SSH connection successful"
    else
        print_error "Cannot connect to $REMOTE_SERVER:$REMOTE_PORT"
        print_info "Please verify:"
        print_info "  - Server is accessible"
        print_info "  - SSH keys are configured"
        print_info "  - Port $REMOTE_PORT is open"
        exit 1
    fi

    # Check required commands
    for cmd in scp curl; do
        if ! command -v $cmd &> /dev/null; then
            print_error "$cmd is not installed"
            exit 1
        fi
    done
    print_success "All required commands available"

    echo ""
}

# Pre-deployment checks
pre_deployment_checks() {
    print_header "Pre-Deployment Checks on Remote Server"

    ssh -p $REMOTE_PORT ${REMOTE_USER}@${REMOTE_SERVER} << 'ENDSSH'
    # Check disk space
    DISK_USAGE=$(df -h /opt | tail -1 | awk '{print $5}' | sed 's/%//')
    if [ $DISK_USAGE -gt 90 ]; then
        echo "❌ Disk usage is ${DISK_USAGE}% (>90%)"
        exit 1
    fi
    echo "✅ Disk space: ${DISK_USAGE}% used"

    # Check memory
    FREE_MEM=$(free -m | grep Mem | awk '{print int($4/$2 * 100)}')
    echo "✅ Free memory: ${FREE_MEM}%"

    # Check Nginx status
    if systemctl is-active --quiet nginx; then
        echo "✅ Nginx is running"
    else
        echo "❌ Nginx is not running"
        exit 1
    fi

    # Check V11 backend
    if curl -s http://localhost:9003/api/v11/health | grep -q "UP\|healthy"; then
        echo "✅ V11 Backend is healthy"
    else
        echo "⚠️  V11 Backend health check failed (continuing anyway)"
    fi
ENDSSH

    if [ $? -eq 0 ]; then
        print_success "Pre-deployment checks passed"
    else
        print_error "Pre-deployment checks failed"
        exit 1
    fi

    echo ""
}

# Create backup
create_backup() {
    print_header "Creating Backup"

    BACKUP_DATE=$(date +%Y%m%d_%H%M%S)

    ssh -p $REMOTE_PORT ${REMOTE_USER}@${REMOTE_SERVER} << ENDSSH
    # Create backup directory if it doesn't exist
    mkdir -p ${BACKUP_DIR}/portal
    mkdir -p ${BACKUP_DIR}/config
    mkdir -p ${BACKUP_DIR}/database

    # Backup current portal (if exists)
    if [ -f ${REMOTE_PORTAL_DIR}/blue/aurigraph-v11-enterprise-portal.html ]; then
        tar -czf ${BACKUP_DIR}/portal/backup-${BACKUP_DATE}.tar.gz \
            ${REMOTE_PORTAL_DIR}/blue/ 2>/dev/null
        echo "✅ Portal backup created: backup-${BACKUP_DATE}.tar.gz"
    else
        echo "ℹ️  No existing portal to backup (first deployment)"
    fi

    # Backup Nginx config
    if [ -f /etc/nginx/sites-available/aurigraph-portal.conf ]; then
        cp /etc/nginx/sites-available/aurigraph-portal.conf \
           ${BACKUP_DIR}/config/nginx-${BACKUP_DATE}.conf
        echo "✅ Nginx config backed up"
    fi
ENDSSH

    print_success "Backup completed"
    echo ""
}

# Deploy portal
deploy_portal() {
    print_header "Deploying Portal to ${DEPLOYMENT_ENV} Environment"

    # Create deployment directory structure
    print_info "Creating deployment directories..."
    ssh -p $REMOTE_PORT ${REMOTE_USER}@${REMOTE_SERVER} << ENDSSH
    mkdir -p ${REMOTE_PORTAL_DIR}/{blue,green,static,scripts}
    mkdir -p /opt/aurigraph/logs/{nginx,portal,backend}
    mkdir -p /opt/aurigraph/nginx/{sites-available,sites-enabled,ssl}
    chown -R ${REMOTE_USER}:${REMOTE_USER} /opt/aurigraph/
    chmod 755 ${REMOTE_PORTAL_DIR}/scripts/
ENDSSH

    # Transfer portal file
    print_info "Transferring portal file to ${DEPLOYMENT_ENV} environment..."
    scp -P $REMOTE_PORT "$LOCAL_PORTAL_FILE" \
        ${REMOTE_USER}@${REMOTE_SERVER}:${REMOTE_PORTAL_DIR}/${DEPLOYMENT_ENV}/

    if [ $? -eq 0 ]; then
        print_success "Portal file transferred successfully"
    else
        print_error "Failed to transfer portal file"
        exit 1
    fi

    # Verify deployment
    print_info "Verifying deployment..."
    REMOTE_LINE_COUNT=$(ssh -p $REMOTE_PORT ${REMOTE_USER}@${REMOTE_SERVER} \
        "wc -l < ${REMOTE_PORTAL_DIR}/${DEPLOYMENT_ENV}/aurigraph-v11-enterprise-portal.html")
    LOCAL_LINE_COUNT=$(wc -l < "$LOCAL_PORTAL_FILE")

    if [ "$REMOTE_LINE_COUNT" = "$LOCAL_LINE_COUNT" ]; then
        print_success "File integrity verified ($REMOTE_LINE_COUNT lines)"
    else
        print_error "File integrity check failed (local: $LOCAL_LINE_COUNT, remote: $REMOTE_LINE_COUNT)"
        exit 1
    fi

    echo ""
}

# Configure Nginx
configure_nginx() {
    print_header "Configuring Nginx"

    ssh -p $REMOTE_PORT ${REMOTE_USER}@${REMOTE_SERVER} << 'ENDSSH'
    # Create Nginx configuration
    sudo tee /etc/nginx/sites-available/aurigraph-portal.conf > /dev/null << 'NGINX_EOF'
# Aurigraph V11 Enterprise Portal - Production Configuration
upstream portal_backend {
    server localhost:9003;
    keepalive 32;
}

# HTTP to HTTPS redirect
server {
    listen 80;
    server_name dlt.aurigraph.io;
    return 301 https://$server_name$request_uri;
}

# HTTPS Portal Server
server {
    listen 443 ssl http2;
    server_name dlt.aurigraph.io;

    # SSL Configuration (update paths as needed)
    ssl_certificate /etc/letsencrypt/live/dlt.aurigraph.io/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/dlt.aurigraph.io/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 10m;

    # Security Headers
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;

    # Root directory (blue/green switch point)
    root /opt/aurigraph/portal/green;
    index aurigraph-v11-enterprise-portal.html;

    # Portal location
    location /portal {
        alias /opt/aurigraph/portal/green;
        try_files $uri $uri/ /aurigraph-v11-enterprise-portal.html;
        expires -1;
        add_header Cache-Control "no-store, no-cache, must-revalidate, proxy-revalidate";
    }

    # Root redirect to portal
    location = / {
        return 301 /portal/aurigraph-v11-enterprise-portal.html;
    }

    # Static assets
    location /static {
        alias /opt/aurigraph/portal/static;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # API Proxy to V11 Backend
    location /api/v11 {
        proxy_pass http://portal_backend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    # Quarkus health endpoints
    location /q/ {
        proxy_pass http://portal_backend;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    # Health check endpoint
    location /health {
        access_log off;
        return 200 "healthy\n";
        add_header Content-Type text/plain;
    }

    # Logging
    access_log /opt/aurigraph/logs/nginx/portal-access.log;
    error_log /opt/aurigraph/logs/nginx/portal-error.log;

    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript application/javascript application/json application/xml+rss;
}
NGINX_EOF

    # Enable site
    sudo ln -sf /etc/nginx/sites-available/aurigraph-portal.conf \
                /etc/nginx/sites-enabled/aurigraph-portal.conf

    # Test configuration
    echo "Testing Nginx configuration..."
    if sudo nginx -t; then
        echo "✅ Nginx configuration is valid"
    else
        echo "❌ Nginx configuration has errors"
        exit 1
    fi
ENDSSH

    if [ $? -eq 0 ]; then
        print_success "Nginx configured successfully"
    else
        print_error "Nginx configuration failed"
        exit 1
    fi

    echo ""
}

# Reload Nginx
reload_nginx() {
    print_header "Reloading Nginx (Zero-Downtime)"

    ssh -p $REMOTE_PORT ${REMOTE_USER}@${REMOTE_SERVER} << 'ENDSSH'
    echo "Reloading Nginx..."
    sudo systemctl reload nginx

    # Verify Nginx is still running
    if systemctl is-active --quiet nginx; then
        echo "✅ Nginx reloaded successfully"
    else
        echo "❌ Nginx reload failed"
        exit 1
    fi
ENDSSH

    if [ $? -eq 0 ]; then
        print_success "Nginx reloaded successfully"
    else
        print_error "Nginx reload failed"
        exit 1
    fi

    echo ""
}

# Post-deployment validation
post_deployment_validation() {
    print_header "Post-Deployment Validation"

    # Wait for services to stabilize
    print_info "Waiting 5 seconds for services to stabilize..."
    sleep 5

    # Health checks on remote server
    ssh -p $REMOTE_PORT ${REMOTE_USER}@${REMOTE_SERVER} << 'ENDSSH'
    echo "Running health checks..."

    # Check Nginx
    if systemctl is-active --quiet nginx; then
        echo "✅ Nginx is running"
    else
        echo "❌ Nginx is not running"
    fi

    # Check V11 backend
    if curl -s http://localhost:9003/api/v11/health | grep -q "UP\|healthy"; then
        echo "✅ V11 Backend is healthy"
    else
        echo "⚠️  V11 Backend health check returned unexpected response"
    fi

    # Check portal file
    if [ -f /opt/aurigraph/portal/green/aurigraph-v11-enterprise-portal.html ]; then
        LINE_COUNT=$(wc -l < /opt/aurigraph/portal/green/aurigraph-v11-enterprise-portal.html)
        echo "✅ Portal file exists ($LINE_COUNT lines)"
    else
        echo "❌ Portal file not found"
    fi

    # Check disk space
    DISK_USAGE=$(df -h /opt | tail -1 | awk '{print $5}')
    echo "✅ Disk usage: $DISK_USAGE"

    # Check memory
    MEM_INFO=$(free -h | grep Mem | awk '{printf "%s used of %s", $3, $2}')
    echo "✅ Memory: $MEM_INFO"
ENDSSH

    echo ""

    # External validation from local machine
    print_info "Testing external access..."

    # Test HTTP redirect
    print_info "Testing HTTP to HTTPS redirect..."
    HTTP_REDIRECT=$(curl -s -o /dev/null -w "%{http_code}" http://${REMOTE_SERVER}/)
    if [ "$HTTP_REDIRECT" = "301" ] || [ "$HTTP_REDIRECT" = "302" ]; then
        print_success "HTTP redirect working (HTTP $HTTP_REDIRECT)"
    else
        print_warning "HTTP redirect returned HTTP $HTTP_REDIRECT"
    fi

    # Test HTTPS access
    print_info "Testing HTTPS access..."
    HTTPS_CODE=$(curl -s -o /dev/null -w "%{http_code}" -k https://${REMOTE_SERVER}/portal/)
    if [ "$HTTPS_CODE" = "200" ]; then
        print_success "HTTPS portal accessible (HTTP $HTTPS_CODE)"
    else
        print_warning "HTTPS portal returned HTTP $HTTPS_CODE"
    fi

    # Test API endpoint
    print_info "Testing API endpoint..."
    API_CODE=$(curl -s -o /dev/null -w "%{http_code}" -k https://${REMOTE_SERVER}/api/v11/health)
    if [ "$API_CODE" = "200" ]; then
        print_success "API endpoint accessible (HTTP $API_CODE)"
    else
        print_warning "API endpoint returned HTTP $API_CODE"
    fi

    echo ""
}

# Display summary
display_summary() {
    print_header "Deployment Summary"

    echo -e "${GREEN}🎉 Deployment completed successfully!${NC}"
    echo ""
    echo "Portal Details:"
    echo "  - Environment: ${DEPLOYMENT_ENV}"
    echo "  - Portal URL: https://${REMOTE_SERVER}/portal/"
    echo "  - API Base URL: https://${REMOTE_SERVER}/api/v11/"
    echo "  - Health Check: https://${REMOTE_SERVER}/health"
    echo ""
    echo "Next Steps:"
    echo "  1. Open https://${REMOTE_SERVER}/portal/ in browser"
    echo "  2. Test all 23 navigation tabs"
    echo "  3. Verify API integration"
    echo "  4. Monitor logs: ssh -p${REMOTE_PORT} ${REMOTE_USER}@${REMOTE_SERVER} 'tail -f /opt/aurigraph/logs/nginx/portal-access.log'"
    echo "  5. Check metrics: https://${REMOTE_SERVER}/q/metrics"
    echo ""
    echo "Support:"
    echo "  - Email: subbu@aurigraph.io"
    echo "  - Documentation: /Users/subbujois/Documents/GitHub/Aurigraph-DLT/PRODUCTION-DEPLOYMENT-PLAN.md"
    echo ""

    print_success "Production deployment complete! 🚀"
    echo ""
}

# Rollback function
rollback() {
    print_header "ROLLBACK INITIATED"

    print_warning "Rolling back to blue environment..."

    ssh -p $REMOTE_PORT ${REMOTE_USER}@${REMOTE_SERVER} << 'ENDSSH'
    # Update Nginx to point to blue
    sudo sed -i 's|/opt/aurigraph/portal/green|/opt/aurigraph/portal/blue|g' \
        /etc/nginx/sites-available/aurigraph-portal.conf

    # Test and reload
    if sudo nginx -t; then
        sudo systemctl reload nginx
        echo "✅ Rolled back to blue environment"
    else
        echo "❌ Rollback failed - Nginx config invalid"
        exit 1
    fi
ENDSSH

    if [ $? -eq 0 ]; then
        print_success "Rollback completed successfully"
    else
        print_error "Rollback failed"
        exit 1
    fi
}

# Main deployment flow
main() {
    clear
    print_header "Aurigraph V11 Enterprise Portal - Production Deployment"
    echo ""
    echo "Target Server: ${REMOTE_SERVER}:${REMOTE_PORT}"
    echo "Deployment Environment: ${DEPLOYMENT_ENV}"
    echo "Local Portal File: ${LOCAL_PORTAL_FILE}"
    echo ""

    # Confirmation prompt
    read -p "Continue with deployment? (yes/no): " CONFIRM
    if [ "$CONFIRM" != "yes" ]; then
        print_warning "Deployment cancelled by user"
        exit 0
    fi

    echo ""

    # Execute deployment steps
    check_prerequisites
    pre_deployment_checks
    create_backup
    deploy_portal
    configure_nginx
    reload_nginx
    post_deployment_validation
    display_summary
}

# Trap errors and offer rollback
trap 'echo ""; print_error "Deployment failed at step: $BASH_COMMAND"; read -p "Rollback to previous version? (yes/no): " ROLLBACK; if [ "$ROLLBACK" = "yes" ]; then rollback; fi; exit 1' ERR

# Run main deployment
main

exit 0
