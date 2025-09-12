#!/bin/bash

# Complete CORS Fix Deployment
echo "🚀 Deploying Complete CORS Fix"
echo "==============================="

GREEN='\033[0;32m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

# Stop current services
echo "🛑 Stopping current services..."
if [ -f demo-dev4.pid ]; then
    kill $(cat demo-dev4.pid) 2>/dev/null || true
    rm demo-dev4.pid
fi

# Create backup
echo "📋 Creating backups..."
cp aurigraph-demo-dev4.js aurigraph-demo-dev4.js.backup.$(date +%s) 2>/dev/null || true
sudo cp /etc/nginx/sites-available/dlt.aurigraph.io /etc/nginx/sites-available/dlt.aurigraph.io.backup.$(date +%s) 2>/dev/null || true

# Install new application
echo "📦 Installing bulletproof Node.js app..."
cp aurigraph-demo-final-cors.js aurigraph-demo-dev4.js
chmod +x aurigraph-demo-dev4.js

# Install new nginx config
echo "🔧 Installing bulletproof nginx config..."
sudo cp nginx-bulletproof-cors.conf /etc/nginx/sites-available/dlt.aurigraph.io

# Install new dashboard
echo "🎨 Installing CORS-compatible dashboard..."
sudo mkdir -p /var/www/aurigraph
sudo cp dashboard-cors-working.html /var/www/aurigraph/index.html
sudo chown -R www-data:www-data /var/www/aurigraph

# Test nginx
echo "🧪 Testing nginx configuration..."
sudo nginx -t

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Nginx configuration valid${NC}"
    
    # Reload nginx
    sudo systemctl reload nginx
    echo -e "${GREEN}✅ Nginx reloaded${NC}"
    
    # Start new application
    echo "🚀 Starting bulletproof application..."
    nohup node aurigraph-demo-dev4.js > demo-dev4.log 2>&1 &
    echo $! > demo-dev4.pid
    
    # Wait for startup
    sleep 5
    
    echo ""
    echo "🧪 Testing deployment..."
    echo "========================"
    
    # Test health endpoint
    HEALTH_STATUS=$(curl -s -o /dev/null -w "%{http_code}" https://dlt.aurigraph.io/health)
    if [ "$HEALTH_STATUS" = "200" ]; then
        echo -e "${GREEN}✅ Health endpoint: OK${NC}"
    else
        echo -e "${RED}❌ Health endpoint: $HEALTH_STATUS${NC}"
    fi
    
    # Test CORS headers
    CORS_HEADER=$(curl -s -I -H "Origin: https://dlt.aurigraph.io" https://dlt.aurigraph.io/channel/status | grep -i "access-control-allow-origin")
    if [ ! -z "$CORS_HEADER" ]; then
        echo -e "${GREEN}✅ CORS headers: Present${NC}"
        echo "   $CORS_HEADER"
    else
        echo -e "${RED}❌ CORS headers: Missing${NC}"
    fi
    
    # Test API endpoint
    API_STATUS=$(curl -s -o /dev/null -w "%{http_code}" https://dlt.aurigraph.io/channel/status)
    if [ "$API_STATUS" = "200" ]; then
        echo -e "${GREEN}✅ API endpoint: OK${NC}"
    else
        echo -e "${RED}❌ API endpoint: $API_STATUS${NC}"
    fi
    
    # Test dashboard
    DASHBOARD_STATUS=$(curl -s -o /dev/null -w "%{http_code}" https://dlt.aurigraph.io/)
    if [ "$DASHBOARD_STATUS" = "200" ]; then
        echo -e "${GREEN}✅ Dashboard: OK${NC}"
    else
        echo -e "${RED}❌ Dashboard: $DASHBOARD_STATUS${NC}"
    fi
    
    echo ""
    echo -e "${GREEN}🎉 COMPLETE CORS FIX DEPLOYED!${NC}"
    echo ""
    echo "✅ Visit: https://dlt.aurigraph.io"
    echo "✅ The dashboard now includes:"
    echo "   • Bulletproof CORS handling"
    echo "   • Debug information"
    echo "   • CORS test button"
    echo "   • Real-time error reporting"
    echo ""
    echo "📊 Check logs:"
    echo "   tail -f demo-dev4.log"
    
else
    echo -e "${RED}❌ Nginx configuration failed${NC}"
    exit 1
fi
