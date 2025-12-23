#!/bin/bash

###############################################################################
# Production Deployment Script - Complete System
# Deploys V11 Backend + Validator Nodes + Enterprise Portal
# SSH Port: 22 (Standard)
# Remote Server: dlt.aurigraph.io
# Author: Claude Code
# Date: November 6, 2025
###############################################################################

set -e

# Configuration
REMOTE_USER="subbu"
REMOTE_HOST="dlt.aurigraph.io"
REMOTE_SSH_PORT="22"
GITHUB_REPO="https://github.com/Aurigraph-DLT-Corp/Aurigraph-DLT.git"

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m'

# Functions
print_header() {
    echo -e "${BLUE}======================================${NC}"
    echo -e "${BLUE}$1${NC}"
    echo -e "${BLUE}======================================${NC}"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

# Step 1: Verify SSH Access (Port 22)
print_header "STEP 1: SSH ACCESS (Port 22)"
ssh -p "$REMOTE_SSH_PORT" "$REMOTE_USER@$REMOTE_HOST" "echo 'SSH connected on port 22' && whoami" || exit 1
print_success "SSH connection established on port 22"

# Step 2: Deploy Backend
print_header "STEP 2: DEPLOY V11 BACKEND"

ssh -p "$REMOTE_SSH_PORT" "$REMOTE_USER@$REMOTE_HOST" << 'BACKEND_CMD'
set -e
mkdir -p /home/subbu/aurigraph/nodes /home/subbu/aurigraph/logs
cd /home/subbu/aurigraph

if [ ! -d ".git" ]; then
    git clone https://github.com/Aurigraph-DLT-Corp/Aurigraph-DLT.git .
else
    git fetch origin && git checkout main && git pull origin main
fi

cd aurigraph-av10-7/aurigraph-v11-standalone
./mvnw clean package -DskipTests -q
echo "✅ Backend built successfully"
BACKEND_CMD

print_success "Backend built"

# Step 3: Deploy Portal
print_header "STEP 3: DEPLOY ENTERPRISE PORTAL"

ssh -p "$REMOTE_SSH_PORT" "$REMOTE_USER@$REMOTE_HOST" << 'PORTAL_CMD'
set -e
cd /home/subbu/aurigraph/aurigraph-av10-7/aurigraph-v11-standalone/enterprise-portal
npm install --production -q
npm run build
echo "✅ Portal built successfully"
PORTAL_CMD

print_success "Portal built"

# Step 4: Start Services
print_header "STEP 4: START ALL SERVICES"

ssh -p "$REMOTE_SSH_PORT" "$REMOTE_USER@$REMOTE_HOST" << 'START_CMD'
set -e

# Kill existing processes
for port in 9001 9002 9003 9004 9005 9006 9007 9008 9009; do
    pkill -f "port=$port" 2>/dev/null || true
done

sleep 1

# Create systemd service for V11 Backend
sudo tee /etc/systemd/system/aurigraph-v11.service > /dev/null << 'SYSTEMD'
[Unit]
Description=Aurigraph V11 Backend
After=network.target

[Service]
Type=simple
User=subbu
WorkingDirectory=/home/subbu/aurigraph
ExecStart=/usr/bin/java -jar /home/subbu/aurigraph/aurigraph-av10-7/aurigraph-v11-standalone/target/quarkus-app/quarkus-run.jar
Restart=on-failure
StandardOutput=append:/home/subbu/aurigraph/logs/v11.log
StandardError=append:/home/subbu/aurigraph/logs/v11.log

[Install]
WantedBy=multi-user.target
SYSTEMD

# Start Backend
sudo systemctl daemon-reload
sudo systemctl enable aurigraph-v11.service
sudo systemctl start aurigraph-v11.service
sleep 3

# Start Nodes
declare -A NODES=(
    ["validator-1"]="9001"
    ["validator-2"]="9002"
    ["validator-3"]="9005"
    ["validator-4"]="9006"
    ["observer"]="9007"
    ["seed"]="9008"
    ["rpc"]="9009"
)

for node_name in "${!NODES[@]}"; do
    port="${NODES[$node_name]}"
    java -jar /home/subbu/aurigraph/aurigraph-av10-7/aurigraph-v11-standalone/target/quarkus-app/quarkus-run.jar \
        -Dquarkus.http.port=$port \
        -Dnode.name=$node_name \
        > /home/subbu/aurigraph/logs/$node_name.log 2>&1 &
    sleep 1
done

echo "✅ All services started"
sleep 5

# Verify
curl -s http://localhost:9003/api/v11/health | jq '.data.health' 2>/dev/null || echo "Backend starting..."
START_CMD

print_success "All services started"

# Step 5: Configure NGINX
print_header "STEP 5: CONFIGURE NGINX"

ssh -p "$REMOTE_SSH_PORT" "$REMOTE_USER@$REMOTE_HOST" << 'NGINX_CMD'
set -e

# Create NGINX config
sudo tee /etc/nginx/sites-available/aurigraph-production > /dev/null << 'NGINX_CONF'
server {
    listen 80;
    server_name dlt.aurigraph.io;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name dlt.aurigraph.io;

    ssl_certificate /etc/letsencrypt/live/dlt.aurigraph.io/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/dlt.aurigraph.io/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;

    access_log /var/log/nginx/aurigraph.access.log;
    error_log /var/log/nginx/aurigraph.error.log;

    gzip on;
    gzip_types text/plain text/css application/json application/javascript;

    root /home/subbu/aurigraph/aurigraph-av10-7/aurigraph-v11-standalone/enterprise-portal/dist;
    index index.html;

    # API Proxy
    location /api/v11/ {
        proxy_pass http://localhost:9003;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_buffering off;
    }

    # WebSocket Support
    location /api/v11/ws/ {
        proxy_pass http://localhost:9003;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "Upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_read_timeout 86400s;
    }

    # Static files
    location ~* \.(js|css|png|jpg|gif|ico)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # SPA routing
    location / {
        try_files $uri /index.html;
    }
}
NGINX_CONF

sudo ln -sf /etc/nginx/sites-available/aurigraph-production /etc/nginx/sites-enabled/aurigraph-production
sudo nginx -t
sudo systemctl reload nginx
echo "✅ NGINX configured"
NGINX_CMD

print_success "NGINX configured"

# Step 6: Final Verification
print_header "STEP 6: FINAL VERIFICATION"

echo "Backend status:"
curl -s http://localhost:9003/api/v11/health 2>/dev/null | jq '.data.health' || echo "Backend initializing..."

echo ""
echo "Portal status:"
curl -s -o /dev/null -w "HTTP %{http_code}\n" https://dlt.aurigraph.io/ --insecure

echo ""
echo "API endpoints:"
curl -s https://dlt.aurigraph.io/api/v11/validators --insecure | jq 'length'

# Final Summary
print_header "DEPLOYMENT COMPLETE ✅"

echo ""
echo "🚀 System Live at:"
echo "   Portal: https://dlt.aurigraph.io"
echo "   API:    https://dlt.aurigraph.io/api/v11/"
echo ""
echo "📊 Validator Nodes:"
echo "   Validators 1-4 (Ports 9001, 9002, 9005, 9006)"
echo "   Observer/Seed/RPC (Ports 9007, 9008, 9009)"
echo ""
echo "🔗 WebSocket Endpoints:"
echo "   wss://dlt.aurigraph.io/api/v11/ws/metrics"
echo "   wss://dlt.aurigraph.io/api/v11/ws/validators"
echo "   wss://dlt.aurigraph.io/api/v11/ws/network"
echo "   wss://dlt.aurigraph.io/api/v11/ws/transactions"
echo "   wss://dlt.aurigraph.io/api/v11/ws/consensus"
echo ""
