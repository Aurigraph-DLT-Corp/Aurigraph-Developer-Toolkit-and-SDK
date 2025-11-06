#!/bin/bash

###############################################################################
# Enterprise Portal Deployment Script
# Deploys Sprint 13 Enterprise Portal to Remote Server (dlt.aurigraph.io)
# Author: Claude Code
# Date: November 6, 2025
###############################################################################

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
REMOTE_USER="subbu"
REMOTE_HOST="dlt.aurigraph.io"
REMOTE_PORT="2235"
REMOTE_APP_DIR="/home/subbu/aurigraph/enterprise-portal"
GITHUB_REPO="https://github.com/Aurigraph-DLT-Corp/Aurigraph-DLT.git"
BRANCH="main"

# Functions
print_header() {
    echo -e "${BLUE}========================================${NC}"
    echo -e "${BLUE}$1${NC}"
    echo -e "${BLUE}========================================${NC}"
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

# Step 1: Check local environment
print_header "STEP 1: LOCAL ENVIRONMENT CHECK"

if ! command -v git &> /dev/null; then
    print_error "Git is not installed"
    exit 1
fi
print_success "Git is installed"

if ! command -v ssh &> /dev/null; then
    print_error "SSH is not installed"
    exit 1
fi
print_success "SSH is installed"

if ! command -v npm &> /dev/null; then
    print_error "npm is not installed"
    exit 1
fi
print_success "npm is installed"

# Step 2: Verify GitHub access
print_header "STEP 2: GITHUB REPOSITORY ACCESS"

git ls-remote "$GITHUB_REPO" > /dev/null 2>&1
if [ $? -eq 0 ]; then
    print_success "GitHub repository is accessible"
else
    print_error "Cannot access GitHub repository"
    exit 1
fi

# Step 3: Verify remote server access
print_header "STEP 3: REMOTE SERVER ACCESS"

print_info "Testing SSH connection to $REMOTE_USER@$REMOTE_HOST:$REMOTE_PORT..."
ssh -p "$REMOTE_PORT" "$REMOTE_USER@$REMOTE_HOST" "echo 'SSH connection successful'" > /dev/null 2>&1
if [ $? -eq 0 ]; then
    print_success "Remote server is accessible"
else
    print_error "Cannot connect to remote server"
    exit 1
fi

# Step 4: Clone/update repository on remote server
print_header "STEP 4: PREPARE REMOTE REPOSITORY"

ssh -p "$REMOTE_PORT" "$REMOTE_USER@$REMOTE_HOST" << 'REMOTE_SCRIPT'
    set -e

    # Create app directory if it doesn't exist
    if [ ! -d "/home/subbu/aurigraph/enterprise-portal" ]; then
        echo "Creating application directory..."
        mkdir -p /home/subbu/aurigraph/enterprise-portal
    fi

    cd /home/subbu/aurigraph/enterprise-portal

    # Initialize or update git repository
    if [ ! -d ".git" ]; then
        echo "Cloning repository..."
        git clone https://github.com/Aurigraph-DLT-Corp/Aurigraph-DLT.git .
    else
        echo "Updating existing repository..."
        git fetch origin
    fi

    # Checkout main branch
    git checkout main
    git pull origin main

    echo "Repository ready at $(pwd)"
REMOTE_SCRIPT

print_success "Remote repository prepared"

# Step 5: Build on remote server
print_header "STEP 5: BUILD ENTERPRISE PORTAL"

ssh -p "$REMOTE_PORT" "$REMOTE_USER@$REMOTE_HOST" << 'REMOTE_BUILD'
    set -e

    cd /home/subbu/aurigraph/enterprise-portal/aurigraph-av10-7/aurigraph-v11-standalone/enterprise-portal

    echo "Installing dependencies..."
    npm install --production

    echo "Building production bundle..."
    npm run build

    echo "Build output location:"
    ls -lh dist/ | head -10

    echo "Build completed successfully"
REMOTE_BUILD

print_success "Build completed on remote server"

# Step 6: Configure NGINX
print_header "STEP 6: CONFIGURE NGINX"

ssh -p "$REMOTE_PORT" "$REMOTE_USER@$REMOTE_HOST" << 'REMOTE_NGINX'
    set -e

    NGINX_CONF_DIR="/etc/nginx/sites-available"
    NGINX_ENABLED_DIR="/etc/nginx/sites-enabled"
    PORTAL_DIR="/home/subbu/aurigraph/enterprise-portal/aurigraph-av10-7/aurigraph-v11-standalone/enterprise-portal/dist"

    # Create NGINX configuration
    sudo tee "$NGINX_CONF_DIR/aurigraph-portal" > /dev/null << 'NGINX_CONFIG'
server {
    listen 80;
    listen [::]:80;
    server_name dlt.aurigraph.io;

    # Redirect HTTP to HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name dlt.aurigraph.io;

    # SSL Configuration
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
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;

    # Gzip Compression
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;
    gzip_min_length 1000;
    gzip_vary on;

    # Root directory
    root PORTAL_DIR;
    index index.html;

    # API Proxy
    location /api/ {
        proxy_pass http://localhost:9003;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_buffering off;
        proxy_request_buffering off;
    }

    # WebSocket Support
    location /api/v11/ws/ {
        proxy_pass http://localhost:9003;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "Upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_read_timeout 86400;
    }

    # Static files with caching
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
        try_files $uri =404;
    }

    # Single Page App routing
    location / {
        try_files $uri /index.html;
    }

    # Security: Deny access to hidden files
    location ~ /\. {
        deny all;
    }
}
NGINX_CONFIG

    # Enable the site
    sudo ln -sf "$NGINX_CONF_DIR/aurigraph-portal" "$NGINX_ENABLED_DIR/aurigraph-portal"

    # Test NGINX configuration
    sudo nginx -t

    # Reload NGINX
    sudo systemctl reload nginx

    echo "NGINX configured and reloaded"
REMOTE_NGINX

print_success "NGINX configured"

# Step 7: Verify deployment
print_header "STEP 7: VERIFY DEPLOYMENT"

print_info "Testing deployed application..."
DEPLOYMENT_URL="https://dlt.aurigraph.io"

# Wait for server to be ready
sleep 3

HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "$DEPLOYMENT_URL" --insecure)
if [ "$HTTP_CODE" = "200" ]; then
    print_success "Application is accessible at $DEPLOYMENT_URL"
else
    print_warning "HTTP status code: $HTTP_CODE (expected 200)"
fi

# Step 8: Summary
print_header "DEPLOYMENT SUMMARY"

print_success "Enterprise Portal deployed successfully!"
print_info "Application URL: https://dlt.aurigraph.io"
print_info "Backend API: https://dlt.aurigraph.io/api/v11/"
print_info "V11 Backend: http://localhost:9003/api/v11/"
print_info "NGINX Config: /etc/nginx/sites-available/aurigraph-portal"

echo ""
print_info "Next steps:"
echo "  1. Verify application at https://dlt.aurigraph.io"
echo "  2. Check browser console for any errors"
echo "  3. Test API endpoints: https://dlt.aurigraph.io/api/v11/health"
echo "  4. Monitor logs: ssh -p2235 subbu@dlt.aurigraph.io 'tail -f /var/log/nginx/error.log'"

print_header "DEPLOYMENT COMPLETE"
