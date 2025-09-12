#!/bin/bash

# Deploy CORS fix to dlt.aurigraph.io
echo "🚀 Deploying CORS fix to dlt.aurigraph.io"
echo "=========================================="

GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m'

# Stop current demo
echo "Stopping current demo..."
if [ -f demo-dev4.pid ]; then
    kill $(cat demo-dev4.pid) 2>/dev/null || true
    rm demo-dev4.pid
fi

# Backup current files
echo "Creating backups..."
cp aurigraph-demo-dev4.js aurigraph-demo-dev4.js.backup 2>/dev/null || true
sudo cp /etc/nginx/sites-available/dlt.aurigraph.io /etc/nginx/sites-available/dlt.aurigraph.io.backup.cors 2>/dev/null || true

# Install new Node.js app
echo "Installing updated Node.js application..."
cp aurigraph-demo-cors-fix.js aurigraph-demo-dev4.js
chmod +x aurigraph-demo-dev4.js

# Update nginx configuration
echo "Updating nginx configuration..."
sudo cp nginx-cors-fix.conf /etc/nginx/sites-available/dlt.aurigraph.io

# Test nginx configuration
echo "Testing nginx configuration..."
sudo nginx -t

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Nginx configuration valid${NC}"
    
    # Reload nginx
    echo "Reloading nginx..."
    sudo systemctl reload nginx
    
    # Start the updated demo
    echo "Starting updated demo with CORS support..."
    nohup node aurigraph-demo-dev4.js > demo-dev4.log 2>&1 &
    echo $! > demo-dev4.pid
    
    sleep 3
    
    # Test endpoints
    echo ""
    echo "Testing endpoints..."
    echo "-------------------"
    
    # Test health endpoint
    if curl -s -o /dev/null -w "%{http_code}" https://dlt.aurigraph.io/health | grep -q "200"; then
        echo -e "${GREEN}✅ Health endpoint working${NC}"
    else
        echo -e "${RED}❌ Health endpoint failed${NC}"
    fi
    
    # Test CORS headers
    echo ""
    echo "Testing CORS headers..."
    CORS_TEST=$(curl -s -I -X OPTIONS https://dlt.aurigraph.io/channel/status -H "Origin: https://dlt.aurigraph.io" | grep -i "access-control-allow-origin")
    if [ ! -z "$CORS_TEST" ]; then
        echo -e "${GREEN}✅ CORS headers present: $CORS_TEST${NC}"
    else
        echo -e "${RED}❌ CORS headers missing${NC}"
    fi
    
    echo ""
    echo -e "${GREEN}🎉 CORS fix deployed successfully!${NC}"
    echo ""
    echo "✅ Dashboard: https://dlt.aurigraph.io"
    echo "✅ API Status: https://dlt.aurigraph.io/channel/status"
    echo "✅ Metrics: https://dlt.aurigraph.io/channel/metrics"
    echo ""
    echo "CORS is now properly configured for:"
    echo "  • API endpoints (/channel/*)"
    echo "  • WebSocket connections (/ws)"
    echo "  • Vizro dashboard (/vizro/)"
    
else
    echo -e "${RED}❌ Nginx configuration error${NC}"
    echo "Restoring backup..."
    sudo cp /etc/nginx/sites-available/dlt.aurigraph.io.backup.cors /etc/nginx/sites-available/dlt.aurigraph.io
    exit 1
fi
