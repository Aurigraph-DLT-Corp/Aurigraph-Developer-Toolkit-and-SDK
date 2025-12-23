#!/bin/bash

# Aurigraph V11 - Dev4 Deployment to dlt.aurigraph.io
# ====================================================

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
DOMAIN="dlt.aurigraph.io"
DEV4_SERVER="dev4.aurigraph.io"
DEPLOYMENT_PATH="/var/www/dlt.aurigraph.io"
SERVICE_NAME="aurigraph-dev4"
PORT=8080
NODE_ENV="production"

print_step() {
    echo -e "${BLUE}[STEP]${NC} $1"
}

print_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

echo "🚀 Aurigraph V11 - Dev4 Deployment to dlt.aurigraph.io"
echo "======================================================"

# Parse command line arguments
COMMAND=${1:-deploy}

case $COMMAND in
    prepare)
        print_step "Preparing for Dev4 Deployment"
        
        # Build the classical version (default)
        print_info "Building Aurigraph Classical version..."
        npm run build
        
        # Create deployment package
        print_info "Creating deployment package..."
        rm -rf dist-dev4
        mkdir -p dist-dev4
        
        # Copy necessary files
        cp -r dist/* dist-dev4/
        cp -r ui dist-dev4/
        cp -r config/dev4 dist-dev4/config/
        cp package.json dist-dev4/
        cp package-lock.json dist-dev4/
        cp src/index-classical-simple.ts dist-dev4/
        
        # Create deployment manifest
        cat > dist-dev4/deployment-manifest.json << EOF
{
  "version": "10.35.0-classical",
  "deployment": "dev4",
  "domain": "$DOMAIN",
  "timestamp": "$(date -u +"%Y-%m-%dT%H:%M:%SZ")",
  "features": {
    "classical_ai": true,
    "quantum_simulation": false,
    "gpu_acceleration": false,
    "consciousness_interface": true,
    "rwa_platform": true
  }
}
EOF
        
        # Create systemd service file
        cat > dist-dev4/aurigraph-dev4.service << EOF
[Unit]
Description=Aurigraph V11 Dev4 - dlt.aurigraph.io
After=network.target

[Service]
Type=simple
User=aurigraph
WorkingDirectory=$DEPLOYMENT_PATH
Environment="NODE_ENV=production"
Environment="PORT=$PORT"
Environment="HOST=0.0.0.0"
ExecStart=/usr/bin/node dist/index-classical-simple.js
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
EOF
        
        # Create nginx configuration
        cat > dist-dev4/nginx-dlt.aurigraph.io.conf << EOF
server {
    listen 80;
    listen [::]:80;
    server_name $DOMAIN;

    # Redirect to HTTPS
    return 301 https://\$server_name\$request_uri;
}

server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name $DOMAIN;

    # SSL configuration (Let's Encrypt)
    ssl_certificate /etc/letsencrypt/live/$DOMAIN/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/$DOMAIN/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Content-Security-Policy "default-src 'self'; font-src 'self' data: http: https:; style-src 'self' 'unsafe-inline' http: https:; script-src 'self' 'unsafe-inline' 'unsafe-eval' http: https:;" always;

    # Proxy to Node.js application
    location / {
        proxy_pass http://localhost:$PORT;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_cache_bypass \$http_upgrade;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }

    # Static files
    location /ui/ {
        alias $DEPLOYMENT_PATH/ui/;
        expires 1d;
        add_header Cache-Control "public";
    }

    # API endpoints
    location /api/ {
        proxy_pass http://localhost:$PORT/api/;
        proxy_http_version 1.1;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }

    # Health check endpoint
    location /health {
        proxy_pass http://localhost:$PORT/health;
        access_log off;
    }
}
EOF
        
        # Create deployment script for remote server
        cat > dist-dev4/remote-deploy.sh << 'REMOTE_EOF'
#!/bin/bash

DEPLOYMENT_PATH="/var/www/dlt.aurigraph.io"
SERVICE_NAME="aurigraph-dev4"

echo "🔧 Deploying Aurigraph V11 to dlt.aurigraph.io"

# Create deployment directory
sudo mkdir -p $DEPLOYMENT_PATH
sudo chown -R aurigraph:aurigraph $DEPLOYMENT_PATH

# Stop existing service
sudo systemctl stop $SERVICE_NAME 2>/dev/null || true

# Extract deployment package
cd $DEPLOYMENT_PATH
tar -xzf /tmp/aurigraph-dev4.tar.gz

# Install dependencies
npm ci --production

# Install systemd service
sudo cp aurigraph-dev4.service /etc/systemd/system/
sudo systemctl daemon-reload

# Install nginx configuration
sudo cp nginx-dlt.aurigraph.io.conf /etc/nginx/sites-available/dlt.aurigraph.io
sudo ln -sf /etc/nginx/sites-available/dlt.aurigraph.io /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx

# Start service
sudo systemctl enable $SERVICE_NAME
sudo systemctl start $SERVICE_NAME

# Check status
sleep 3
if sudo systemctl is-active --quiet $SERVICE_NAME; then
    echo "✅ Service started successfully"
    curl -s http://localhost:8080/health | jq
else
    echo "❌ Service failed to start"
    sudo journalctl -u $SERVICE_NAME -n 50
    exit 1
fi

echo "🎉 Deployment complete!"
echo "🌐 Access at: https://dlt.aurigraph.io"
REMOTE_EOF
        
        chmod +x dist-dev4/remote-deploy.sh
        
        # Create tarball
        print_info "Creating deployment package..."
        tar -czf aurigraph-dev4.tar.gz -C dist-dev4 .
        
        print_info "✅ Deployment package ready: aurigraph-dev4.tar.gz"
        print_info "Next step: ./deploy-dev4.sh upload"
        ;;
        
    upload)
        print_step "Uploading to Dev4 Server"
        
        if [ ! -f aurigraph-dev4.tar.gz ]; then
            print_error "Deployment package not found. Run './deploy-dev4.sh prepare' first"
            exit 1
        fi
        
        # Check if we have SSH access configured
        if [ -z "$DEV4_SSH_USER" ]; then
            print_warn "DEV4_SSH_USER not set. Using default 'aurigraph'"
            DEV4_SSH_USER="aurigraph"
        fi
        
        print_info "Uploading to $DEV4_SSH_USER@$DEV4_SERVER..."
        scp aurigraph-dev4.tar.gz $DEV4_SSH_USER@$DEV4_SERVER:/tmp/
        
        print_info "✅ Upload complete"
        print_info "Next step: ./deploy-dev4.sh deploy"
        ;;
        
    deploy)
        print_step "Deploying to dlt.aurigraph.io"
        
        if [ -z "$DEV4_SSH_USER" ]; then
            DEV4_SSH_USER="aurigraph"
        fi
        
        print_info "Executing remote deployment..."
        ssh $DEV4_SSH_USER@$DEV4_SERVER 'bash -s' < dist-dev4/remote-deploy.sh
        
        print_info "✅ Deployment complete"
        ;;
        
    local-test)
        print_step "Testing Dev4 Configuration Locally"
        
        # Use dev4 configuration
        export NODE_ENV=dev4
        export CONFIG_PATH=config/dev4/aurigraph-dev4-config.json
        
        print_info "Starting with Dev4 configuration..."
        npm run build
        node dist/index-classical-simple.js
        ;;
        
    verify)
        print_step "Verifying Deployment at dlt.aurigraph.io"
        
        print_info "Checking HTTPS endpoint..."
        HEALTH_CHECK=$(curl -s https://dlt.aurigraph.io/health)
        
        if [ $? -eq 0 ]; then
            echo "$HEALTH_CHECK" | jq
            print_info "✅ Platform is accessible at https://dlt.aurigraph.io"
        else
            print_error "Failed to reach https://dlt.aurigraph.io"
            
            # Try HTTP as fallback
            print_info "Trying HTTP..."
            curl -s http://dlt.aurigraph.io/health | jq
        fi
        
        # Check various endpoints
        print_info "Testing API endpoints..."
        curl -s https://dlt.aurigraph.io/api/classical/metrics | jq '.success'
        curl -s -X POST https://dlt.aurigraph.io/api/classical/consensus \
            -H "Content-Type: application/json" \
            -d '{"decision":"test","participants":["node1","node2","node3"]}' | jq '.success'
        ;;
        
    rollback)
        print_step "Rolling Back Deployment"
        
        if [ -z "$DEV4_SSH_USER" ]; then
            DEV4_SSH_USER="aurigraph"
        fi
        
        ssh $DEV4_SSH_USER@$DEV4_SERVER << 'ROLLBACK_EOF'
        sudo systemctl stop aurigraph-dev4
        cd /var/www/dlt.aurigraph.io
        if [ -d .backup ]; then
            rm -rf dist node_modules
            mv .backup/* .
            sudo systemctl start aurigraph-dev4
            echo "✅ Rollback complete"
        else
            echo "❌ No backup found"
        fi
ROLLBACK_EOF
        ;;
        
    status)
        print_step "Checking Dev4 Deployment Status"
        
        # Check local preparation
        if [ -f aurigraph-dev4.tar.gz ]; then
            print_info "✅ Deployment package exists ($(du -h aurigraph-dev4.tar.gz | cut -f1))"
        else
            print_warn "No deployment package found"
        fi
        
        # Check remote status
        print_info "Checking remote status at dlt.aurigraph.io..."
        curl -s https://dlt.aurigraph.io/health 2>/dev/null | jq
        
        if [ $? -eq 0 ]; then
            print_info "✅ Platform is live at https://dlt.aurigraph.io"
        else
            print_warn "Platform not accessible via HTTPS"
        fi
        ;;
        
    *)
        echo "Usage: $0 {prepare|upload|deploy|local-test|verify|rollback|status}"
        echo ""
        echo "Commands:"
        echo "  prepare    - Build and package for deployment"
        echo "  upload     - Upload package to dev4 server"
        echo "  deploy     - Deploy to dlt.aurigraph.io"
        echo "  local-test - Test dev4 configuration locally"
        echo "  verify     - Verify deployment is working"
        echo "  rollback   - Rollback to previous version"
        echo "  status     - Check deployment status"
        echo ""
        echo "Full deployment process:"
        echo "  1. ./deploy-dev4.sh prepare"
        echo "  2. ./deploy-dev4.sh upload"
        echo "  3. ./deploy-dev4.sh deploy"
        echo "  4. ./deploy-dev4.sh verify"
        exit 1
        ;;
esac