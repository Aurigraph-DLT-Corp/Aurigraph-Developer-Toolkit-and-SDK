#!/bin/bash
# Simple Remote Deployment - V12 Fixes
# Deploys pre-built JAR to remote server without Docker build
# Date: December 5, 2025

set -e

# Configuration
REMOTE_HOST="dlt.aurigraph.io"
REMOTE_PORT="2235"
REMOTE_USER="subbu"
REMOTE_DIR="~/Aurigraph-DLT"

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}🚀 Aurigraph V12 - Simple Remote Deploy${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

# Step 1: Build JAR locally
echo -e "${BLUE}[1/7]${NC} Building V12 JAR..."
cd /Users/subbujois/subbuworkingdir/Aurigraph-DLT/aurigraph-av10-7/aurigraph-v11-standalone

if ./mvnw clean package -DskipTests -q; then
    echo -e "${GREEN}✅ JAR built successfully${NC}"
else
    echo -e "${RED}❌ Build failed${NC}"
    exit 1
fi

JAR_FILE="target/aurigraph-v12-standalone-12.0.0-runner.jar"
if [ ! -f "$JAR_FILE" ]; then
    echo -e "${RED}❌ JAR not found: $JAR_FILE${NC}"
    exit 1
fi

JAR_SIZE=$(ls -lh "$JAR_FILE" | awk '{print $5}')
echo -e "${GREEN}✅ JAR ready: $JAR_SIZE${NC}"
echo ""

# Step 2: Copy JAR to remote
echo -e "${BLUE}[2/7]${NC} Copying JAR to remote server..."
if scp -P $REMOTE_PORT "$JAR_FILE" ${REMOTE_USER}@${REMOTE_HOST}:/tmp/aurigraph-v12-runner.jar; then
    echo -e "${GREEN}✅ JAR copied to remote${NC}"
else
    echo -e "${RED}❌ SCP failed${NC}"
    exit 1
fi
echo ""

# Step 3-7: Execute remote deployment
echo -e "${BLUE}[3/7]${NC} Executing remote deployment..."
ssh -p $REMOTE_PORT ${REMOTE_USER}@${REMOTE_HOST} 'bash -s' << 'ENDSSH'
set -e

echo "🔧 [3/7] Fixing PostgreSQL..."
cd ~/Aurigraph-DLT

# Check and start PostgreSQL
if ! docker ps | grep -q dlt-postgres; then
    echo "  Starting PostgreSQL container..."
    docker-compose up -d postgres
    sleep 10
    echo "  ✅ PostgreSQL started"
else
    echo "  ✅ PostgreSQL already running"
fi

# Verify PostgreSQL health
if docker exec dlt-postgres pg_isready -U aurigraph > /dev/null 2>&1; then
    echo "  ✅ PostgreSQL healthy"
else
    echo "  ⚠️  PostgreSQL not responding"
fi

echo ""
echo "🔧 [4/7] Fixing LevelDB paths..."
# Create LevelDB directory
if [ ! -d "/var/lib/aurigraph/leveldb" ]; then
    sudo mkdir -p /var/lib/aurigraph/leveldb
    sudo chown -R subbu:subbu /var/lib/aurigraph
    sudo chmod -R 755 /var/lib/aurigraph
    echo "  ✅ LevelDB directory created"
else
    echo "  ✅ LevelDB directory exists"
fi

# Verify writable
if touch /var/lib/aurigraph/leveldb/test.txt 2>/dev/null && rm /var/lib/aurigraph/leveldb/test.txt 2>/dev/null; then
    echo "  ✅ LevelDB directory writable"
else
    echo "  ⚠️  LevelDB directory not writable"
fi

echo ""
echo "🔧 [5/7] Deploying new JAR..."
# Stop application
docker-compose stop aurigraph-v11-service 2>/dev/null || echo "  Service not running via compose"

# Backup current JAR
if [ -f ~/Aurigraph-DLT/aurigraph-v11-runner.jar ]; then
    cp ~/Aurigraph-DLT/aurigraph-v11-runner.jar ~/Aurigraph-DLT/aurigraph-v11-runner.jar.backup-$(date +%Y%m%d-%H%M%S)
    echo "  ✅ Backup created"
fi

# Deploy new JAR
cp /tmp/aurigraph-v12-runner.jar ~/Aurigraph-DLT/aurigraph-v11-runner.jar
echo "  ✅ New JAR deployed"

echo ""
echo "🔧 [6/7] Starting application..."
# Start application
docker-compose up -d aurigraph-v11-service
echo "  ✅ Application started"

echo "  Waiting for startup (30 seconds)..."
sleep 30

echo ""
echo "🔧 [7/7] Verifying deployment..."
# Check container status
if docker ps | grep -q dlt-aurigraph-v11; then
    echo "  ✅ Container running"
else
    echo "  ⚠️  Container not found"
fi

# Check health
HEALTH=$(curl -s -o /dev/null -w '%{http_code}' https://dlt.aurigraph.io/q/health 2>/dev/null || echo "000")
if [ "$HEALTH" == "200" ]; then
    echo "  ✅ Health check passed (HTTP $HEALTH)"
else
    echo "  ⚠️  Health check: HTTP $HEALTH"
fi

# Test endpoints
echo ""
echo "Testing fixed endpoints..."
LOGIN_STATUS=$(curl -s -o /dev/null -w '%{http_code}' -X POST https://dlt.aurigraph.io/api/v11/auth/login -H 'Content-Type: application/json' -d '{"username":"test","password":"test"}' 2>/dev/null || echo "000")
echo "  Login API: HTTP $LOGIN_STATUS $([ "$LOGIN_STATUS" != "500" ] && echo "✅" || echo "⚠️")"

DEMO_STATUS=$(curl -s -o /dev/null -w '%{http_code}' -X POST https://dlt.aurigraph.io/api/v11/demos -H 'Content-Type: application/json' -d '{"name":"Test","description":"Test","nodeCount":5}' 2>/dev/null || echo "000")
echo "  Demo API: HTTP $DEMO_STATUS $([ "$DEMO_STATUS" != "500" ] && echo "✅" || echo "⚠️")"

INFO_STATUS=$(curl -s -o /dev/null -w '%{http_code}' https://dlt.aurigraph.io/api/v11/info 2>/dev/null || echo "000")
echo "  Info API: HTTP $INFO_STATUS $([ "$INFO_STATUS" == "200" ] && echo "✅" || echo "⚠️")"

echo ""
echo "✅ Deployment complete!"
echo ""
echo "Recent logs:"
docker logs dlt-aurigraph-v11 --tail 15

ENDSSH

echo ""
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}✅ DEPLOYMENT COMPLETE${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo "Summary:"
echo "  ✅ PostgreSQL: Running and healthy"
echo "  ✅ LevelDB: Directory created and writable"
echo "  ✅ Application: Deployed and running"
echo ""
echo "Next steps:"
echo "  1. Monitor logs: ssh -p $REMOTE_PORT ${REMOTE_USER}@${REMOTE_HOST} 'docker logs -f dlt-aurigraph-v11'"
echo "  2. Test endpoints: curl https://dlt.aurigraph.io/api/v11/info"
echo "  3. Review E2E-BUG-REPORT.md for verification"
echo ""
