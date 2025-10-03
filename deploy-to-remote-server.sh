#!/bin/bash

# Aurigraph V11 Remote Deployment Script
# Target: dlt.aurigraph.io
# Date: October 3, 2025

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
REMOTE_HOST="dlt.aurigraph.io"
REMOTE_USER="subbu"
REMOTE_PORT="2235"
REMOTE_DIR="/home/subbu/aurigraph-v11-deployment"
LOCAL_PROJECT_DIR="aurigraph-av10-7/aurigraph-v11-standalone"
DEPLOYMENT_DATE=$(date +%Y%m%d-%H%M%S)

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}🚀 Aurigraph V11 Remote Deployment${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo -e "${BLUE}Target: ${REMOTE_HOST}:${REMOTE_PORT}${NC}"
echo -e "${BLUE}User: ${REMOTE_USER}${NC}"
echo -e "${BLUE}Deployment: ${DEPLOYMENT_DATE}${NC}"
echo ""

# Function to execute remote commands
remote_exec() {
    ssh -p ${REMOTE_PORT} ${REMOTE_USER}@${REMOTE_HOST} "$1"
}

# Function to copy files to remote
remote_copy() {
    scp -P ${REMOTE_PORT} "$1" ${REMOTE_USER}@${REMOTE_HOST}:"$2"
}

# Step 1: Test SSH connection
echo -e "${YELLOW}📡 Step 1: Testing SSH connection...${NC}"
if remote_exec "echo 'Connection successful'" > /dev/null 2>&1; then
    echo -e "${GREEN}✅ SSH connection working${NC}"
else
    echo -e "${RED}❌ SSH connection failed${NC}"
    echo -e "${YELLOW}Please fix SSH connection first (see REMOTE-DEPLOYMENT-GUIDE.md)${NC}"
    exit 1
fi

# Step 2: Check server environment
echo ""
echo -e "${YELLOW}🔍 Step 2: Checking server environment...${NC}"
remote_exec "
echo '--- System Info ---'
uname -a
echo ''
echo '--- Java Version ---'
java --version 2>&1 | head -1 || echo 'Java not installed!'
echo ''
echo '--- Disk Space ---'
df -h / | tail -1
echo ''
echo '--- Memory ---'
free -h | grep Mem
echo ''
echo '--- Current Deployment ---'
ls -lh ${REMOTE_DIR}/aurigraph-v11-standalone-*.jar 2>&1 || echo 'No current deployment'
"

# Step 3: Build locally
echo ""
echo -e "${YELLOW}🔨 Step 3: Building application locally...${NC}"
cd ${LOCAL_PROJECT_DIR}

echo -e "${BLUE}Running: ./mvnw clean package -Dmaven.test.skip=true -Dquarkus.package.jar.type=uber-jar${NC}"
./mvnw clean package -Dmaven.test.skip=true -Dquarkus.package.jar.type=uber-jar 2>&1 | tee /tmp/aurigraph-build.log

if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Build failed! Check /tmp/aurigraph-build.log for details${NC}"
    exit 1
fi

if [ ! -f "target/aurigraph-v11-standalone-11.0.0-runner.jar" ]; then
    echo -e "${RED}❌ JAR file not found after build${NC}"
    exit 1
fi

JAR_SIZE=$(ls -lh target/aurigraph-v11-standalone-11.0.0-runner.jar | awk '{print $5}')
echo -e "${GREEN}✅ Build successful! JAR size: ${JAR_SIZE}${NC}"

# Step 4: Create deployment package
echo ""
echo -e "${YELLOW}📦 Step 4: Creating deployment package...${NC}"
cd ../..
PACKAGE_DIR="/tmp/aurigraph-deployment-${DEPLOYMENT_DATE}"
mkdir -p ${PACKAGE_DIR}

# Copy artifacts
cp ${LOCAL_PROJECT_DIR}/target/aurigraph-v11-standalone-11.0.0-runner.jar ${PACKAGE_DIR}/
cp ${LOCAL_PROJECT_DIR}/src/main/resources/application.properties ${PACKAGE_DIR}/ 2>/dev/null || true

# Create start script
cat > ${PACKAGE_DIR}/start-aurigraph-v11.sh << 'EOF'
#!/bin/bash
echo "Starting Aurigraph V11..."
java -Xmx2g -Xms1g -XX:+UseG1GC -XX:MaxGCPauseMillis=200 \
  -Dquarkus.http.port=9003 \
  -Dquarkus.profile=production \
  -jar aurigraph-v11-standalone-11.0.0-runner.jar > aurigraph-v11.log 2>&1 &

echo $! > aurigraph-v11.pid
PID=$(cat aurigraph-v11.pid)
echo "✅ Aurigraph V11 started with PID: $PID"
echo "Log file: aurigraph-v11.log"
EOF

# Create stop script
cat > ${PACKAGE_DIR}/stop-aurigraph-v11.sh << 'EOF'
#!/bin/bash
echo "Stopping Aurigraph V11..."
if [ -f aurigraph-v11.pid ]; then
  PID=$(cat aurigraph-v11.pid)
  if kill $PID 2>/dev/null; then
    echo "✅ Stopped Aurigraph V11 (PID: $PID)"
    rm aurigraph-v11.pid
  else
    echo "⚠️  Process $PID not found (may have already stopped)"
    rm aurigraph-v11.pid
  fi
else
  # Try to find and kill by process name
  pkill -f "aurigraph-v11-standalone" && echo "✅ Stopped Aurigraph V11" || echo "⚠️  No running instance found"
fi
EOF

# Create health check script
cat > ${PACKAGE_DIR}/health-check.sh << 'EOF'
#!/bin/bash
echo "Checking Aurigraph V11 health..."
echo ""
echo "--- Process Status ---"
ps aux | grep aurigraph-v11-standalone | grep -v grep || echo "Not running"
echo ""
echo "--- Health Endpoint ---"
curl -s http://localhost:9003/q/health | jq . 2>/dev/null || curl -s http://localhost:9003/q/health
echo ""
echo "--- Info Endpoint ---"
curl -s http://localhost:9003/api/v11/info | jq . 2>/dev/null || curl -s http://localhost:9003/api/v11/info
echo ""
EOF

chmod +x ${PACKAGE_DIR}/*.sh

# Create tarball
cd ${PACKAGE_DIR}
tar -czf ../aurigraph-deployment-${DEPLOYMENT_DATE}.tar.gz .
cd ..
PACKAGE_FILE="aurigraph-deployment-${DEPLOYMENT_DATE}.tar.gz"
PACKAGE_SIZE=$(ls -lh ${PACKAGE_FILE} | awk '{print $5}')
echo -e "${GREEN}✅ Deployment package created: ${PACKAGE_FILE} (${PACKAGE_SIZE})${NC}"

# Step 5: Upload to server
echo ""
echo -e "${YELLOW}📤 Step 5: Uploading to server...${NC}"
echo -e "${BLUE}Uploading ${PACKAGE_FILE}...${NC}"
remote_copy ${PACKAGE_FILE} /home/subbu/

echo -e "${GREEN}✅ Upload complete${NC}"

# Step 6: Backup current deployment
echo ""
echo -e "${YELLOW}💾 Step 6: Backing up current deployment...${NC}"
remote_exec "
if [ -d ${REMOTE_DIR} ]; then
    echo 'Creating backup...'
    sudo systemctl stop aurigraph-v11 2>/dev/null || true
    pkill -f aurigraph-v11-standalone 2>/dev/null || true
    sleep 2
    mv ${REMOTE_DIR} ${REMOTE_DIR}-backup-${DEPLOYMENT_DATE}
    echo '✅ Backup created: ${REMOTE_DIR}-backup-${DEPLOYMENT_DATE}'
else
    echo 'No existing deployment to backup'
fi
"

# Step 7: Deploy new version
echo ""
echo -e "${YELLOW}🚀 Step 7: Deploying new version...${NC}"
remote_exec "
mkdir -p ${REMOTE_DIR}
cd ${REMOTE_DIR}
tar -xzf ~/aurigraph-deployment-${DEPLOYMENT_DATE}.tar.gz
chmod +x *.sh
echo '✅ Deployment extracted'
"

# Step 8: Start service
echo ""
echo -e "${YELLOW}▶️  Step 8: Starting Aurigraph V11 service...${NC}"
remote_exec "cd ${REMOTE_DIR} && ./start-aurigraph-v11.sh"

# Wait for startup
echo -e "${BLUE}Waiting 10 seconds for service to start...${NC}"
sleep 10

# Step 9: Verify deployment
echo ""
echo -e "${YELLOW}✓ Step 9: Verifying deployment...${NC}"
remote_exec "cd ${REMOTE_DIR} && ./health-check.sh"

# Step 10: Test endpoints externally
echo ""
echo -e "${YELLOW}🌐 Step 10: Testing external endpoints...${NC}"
echo -e "${BLUE}Testing http://${REMOTE_HOST}:9003/q/health${NC}"
curl -s http://${REMOTE_HOST}:9003/q/health && echo -e "${GREEN}✅ Health endpoint OK${NC}" || echo -e "${RED}❌ Health endpoint failed${NC}"

echo ""
echo -e "${BLUE}Testing http://${REMOTE_HOST}:9003/api/v11/info${NC}"
curl -s http://${REMOTE_HOST}:9003/api/v11/info && echo -e "${GREEN}✅ Info endpoint OK${NC}" || echo -e "${RED}❌ Info endpoint failed${NC}"

# Summary
echo ""
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}✅ Deployment Complete!${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo -e "${BLUE}Deployment Summary:${NC}"
echo -e "  Version: 11.0.0"
echo -e "  Timestamp: ${DEPLOYMENT_DATE}"
echo -e "  Package Size: ${PACKAGE_SIZE}"
echo -e "  Location: ${REMOTE_DIR}"
echo ""
echo -e "${BLUE}Endpoints:${NC}"
echo -e "  Health: http://${REMOTE_HOST}:9003/q/health"
echo -e "  Info: http://${REMOTE_HOST}:9003/api/v11/info"
echo -e "  Metrics: http://${REMOTE_HOST}:9003/q/metrics"
echo -e "  OpenAPI: http://${REMOTE_HOST}:9003/q/openapi"
echo ""
echo -e "${BLUE}Logs:${NC}"
echo -e "  SSH: ssh -p ${REMOTE_PORT} ${REMOTE_USER}@${REMOTE_HOST}"
echo -e "  View logs: tail -f ${REMOTE_DIR}/aurigraph-v11.log"
echo ""
echo -e "${YELLOW}Backup Location:${NC} ${REMOTE_DIR}-backup-${DEPLOYMENT_DATE}"
echo ""
echo -e "${GREEN}🎉 Aurigraph V11 successfully deployed to production!${NC}"
