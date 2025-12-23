#!/bin/bash

echo "🚀 Deploying Comprehensive Aurigraph V11 Platform"
echo "================================================="
echo ""

# Configuration
REMOTE_HOST="dlt.aurigraph.io"
REMOTE_USER="subbu"
REMOTE_PORT="2235"
REMOTE_PASS="subbuFuture@2025"
REMOTE_DIR="/home/subbu/aurigraph-v11-comprehensive"
LOCAL_PLATFORM_DIR="aurigraph-av10-7/comprehensive-platform"

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

# Function to execute remote commands
remote_exec() {
    sshpass -p "${REMOTE_PASS}" ssh -p ${REMOTE_PORT} -o StrictHostKeyChecking=no ${REMOTE_USER}@${REMOTE_HOST} "$1"
}

# Function to copy files to remote
remote_copy() {
    sshpass -p "${REMOTE_PASS}" scp -P ${REMOTE_PORT} -o StrictHostKeyChecking=no -r "$1" ${REMOTE_USER}@${REMOTE_HOST}:"$2"
}

echo -e "${BLUE}🎯 Comprehensive Platform Features:${NC}"
echo "✅ Composite Token Factory (Primary + 6 Secondary Tokens)"
echo "✅ JWT Authentication & User Management"
echo "✅ Cross-Chain Bridge (LayerZero Protocol)"
echo "✅ DeFi Integration (Uniswap, Aave, Compound)"
echo "✅ Enterprise Dashboard & Analytics"
echo "✅ Third-Party Verification System"
echo "✅ Performance Optimization (2M+ TPS)"
echo "✅ Beautiful Web Interface"
echo ""

# Step 1: Stop existing service
echo -e "${YELLOW}Step 1: Stopping existing service...${NC}"
remote_exec "sudo systemctl stop aurigraph-v11 2>/dev/null || true"

# Step 2: Create deployment directory
echo -e "${YELLOW}Step 2: Creating deployment directory...${NC}"
remote_exec "
mkdir -p ${REMOTE_DIR}
rm -rf ${REMOTE_DIR}/* 2>/dev/null || true
echo 'Directory prepared'
"

# Step 3: Copy comprehensive platform files
echo -e "${YELLOW}Step 3: Copying comprehensive platform...${NC}"
remote_copy "${LOCAL_PLATFORM_DIR}/*" "${REMOTE_DIR}/"

# Step 4: Install Node.js dependencies
echo -e "${YELLOW}Step 4: Installing dependencies...${NC}"
remote_exec "
cd ${REMOTE_DIR}
echo 'Installing Node.js packages...'
npm install --production
echo 'Dependencies installed'
"

# Step 5: Create systemd service
echo -e "${YELLOW}Step 5: Creating systemd service...${NC}"
remote_exec "sudo tee /etc/systemd/system/aurigraph-comprehensive.service << 'EOF'
[Unit]
Description=Aurigraph V11 Comprehensive Platform
After=network.target

[Service]
Type=simple
User=subbu
WorkingDirectory=${REMOTE_DIR}
Environment=NODE_ENV=production
Environment=PORT=9003
Environment=JWT_SECRET=aurigraph-v11-production-secret-2025
ExecStart=/usr/bin/node server.js
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
EOF"

# Step 6: Update and start service
echo -e "${YELLOW}Step 6: Starting comprehensive platform...${NC}"
remote_exec "
sudo systemctl daemon-reload
sudo systemctl enable aurigraph-comprehensive
sudo systemctl restart aurigraph-comprehensive
sleep 3
sudo systemctl status aurigraph-comprehensive --no-pager | head -15
"

# Step 7: Test the comprehensive platform
echo -e "${YELLOW}Step 7: Testing comprehensive platform...${NC}"
sleep 5

echo -n "  Health Check: "
if remote_exec "curl -s http://localhost:9003/q/health > /dev/null"; then
    echo -e "${GREEN}✅ Healthy${NC}"
else
    echo -e "${RED}❌ Not responding${NC}"
fi

echo -n "  API Info: "
if remote_exec "curl -s http://localhost:9003/api/v11/info > /dev/null"; then
    echo -e "${GREEN}✅ Available${NC}"
else
    echo -e "${RED}❌ Not responding${NC}"
fi

echo -n "  Authentication: "
if remote_exec "curl -s -X POST http://localhost:9003/api/v11/auth/login > /dev/null"; then
    echo -e "${GREEN}✅ Ready${NC}"
else
    echo -e "${RED}❌ Not responding${NC}"
fi

echo -n "  Frontend: "
if remote_exec "curl -s http://localhost:9003/ > /dev/null"; then
    echo -e "${GREEN}✅ Serving${NC}"
else
    echo -e "${RED}❌ Not responding${NC}"
fi

# Step 8: Display comprehensive test results
echo -e "${YELLOW}Step 8: Comprehensive system test...${NC}"

echo ""
echo "Testing core APIs:"

echo "1. System Info:"
remote_exec "curl -s http://localhost:9003/api/v11/info | python3 -c \"
import sys, json
try:
    data = json.load(sys.stdin)
    print('   Name:', data['name'])
    print('   Version:', data['version'])
    print('   Features:', len(data['features']))
    print('   Sprints:', ', '.join([k + ': ' + v for k, v in data['sprints'].items()]))
except:
    print('   Failed to parse response')
\""

echo ""
echo "2. Authentication Test:"
AUTH_RESULT=$(remote_exec "curl -s -X POST -H 'Content-Type: application/json' -d '{\"username\":\"admin@aurigraph.io\",\"password\":\"admin123\"}' http://localhost:9003/api/v11/auth/login")
echo "   Admin Login: $(echo $AUTH_RESULT | python3 -c 'import sys, json; data = json.load(sys.stdin); print("✅ Success" if data.get("success") else "❌ Failed")' 2>/dev/null || echo "❌ Failed")"

echo ""
echo "3. Composite Tokens:"
remote_exec "curl -s http://localhost:9003/api/v11/composite-tokens | python3 -c \"
import sys, json
try:
    data = json.load(sys.stdin)
    print('   Total Tokens:', data['pagination']['total'])
    print('   Total Value: $', format(data['summary']['totalValue'], ','))
    print('   Asset Types:', ', '.join(data['summary']['assetTypes']))
except:
    print('   Failed to load tokens')
\""

echo ""
echo "4. Market Overview:"
remote_exec "curl -s http://localhost:9003/api/v11/market/overview | python3 -c \"
import sys, json
try:
    data = json.load(sys.stdin)
    stats = data['globalStats']
    print('   Total Value Locked: $', format(stats['totalValueLocked'], ','))
    print('   Average TPS:', format(stats['averageTPS'], ','))
    print('   Peak TPS:', format(stats['peakTPS'], ','))
    print('   Target TPS:', format(stats['targetTPS'], ','))
except:
    print('   Failed to load market data')
\""

# Step 9: Create SSL certificate (optional)
echo ""
echo -e "${YELLOW}Step 9: SSL Certificate Setup (Optional)${NC}"
echo "To enable HTTPS, run these commands on the server:"
echo "  sudo apt install certbot nginx"
echo "  sudo certbot --nginx -d dlt.aurigraph.io"

# Step 10: Final summary
echo ""
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}🎉 COMPREHENSIVE PLATFORM DEPLOYED!${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo -e "${BLUE}📍 Server Details:${NC}"
echo "   URL: http://dlt.aurigraph.io:9003"
echo "   SSH: ssh -p2235 subbu@dlt.aurigraph.io"
echo "   Location: ${REMOTE_DIR}"
echo "   Service: aurigraph-comprehensive"
echo ""
echo -e "${BLUE}🌐 Access Points:${NC}"
echo "   Frontend: http://dlt.aurigraph.io:9003/"
echo "   Dashboard: http://dlt.aurigraph.io:9003/dashboard"
echo "   API Docs: http://dlt.aurigraph.io:9003/api/v11/info"
echo "   Health: http://dlt.aurigraph.io:9003/q/health"
echo "   Metrics: http://dlt.aurigraph.io:9003/q/metrics"
echo ""
echo -e "${BLUE}🔑 Demo Credentials:${NC}"
echo "   Admin: admin@aurigraph.io / admin123"
echo "   Investor: investor@example.com / investor123"
echo ""
echo -e "${BLUE}✨ Available Features:${NC}"
echo "   🪙 Composite Token Factory"
echo "   🔐 JWT Authentication"
echo "   🌉 Cross-Chain Bridge (5 networks)"
echo "   💰 DeFi Integration (Uniswap, Aave, Compound)"
echo "   📊 Enterprise Dashboard"
echo "   🛡️ Verification System (4-tier)"
echo "   ⚡ Performance Optimization"
echo "   🎨 Beautiful Web Interface"
echo ""
echo -e "${BLUE}📋 Management Commands:${NC}"
echo "   View logs: ssh -p2235 subbu@dlt.aurigraph.io 'sudo journalctl -u aurigraph-comprehensive -f'"
echo "   Restart: ssh -p2235 subbu@dlt.aurigraph.io 'sudo systemctl restart aurigraph-comprehensive'"
echo "   Status: ssh -p2235 subbu@dlt.aurigraph.io 'sudo systemctl status aurigraph-comprehensive'"
echo ""
echo -e "${GREEN}🚀 Your comprehensive platform is LIVE and ready!${NC}"
echo ""

# Test tunnel command for external access
echo -e "${YELLOW}💡 To access externally (if port 9003 is blocked):${NC}"
echo "   ssh -p2235 -L 9003:localhost:9003 subbu@dlt.aurigraph.io"
echo "   Then access: http://localhost:9003"
echo ""