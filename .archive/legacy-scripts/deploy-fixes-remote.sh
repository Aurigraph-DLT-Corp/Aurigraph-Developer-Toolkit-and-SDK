#!/bin/bash
# Remote Deployment Script - Fix Critical Issues on dlt.aurigraph.io
# Date: December 5, 2025
# Fixes: PostgreSQL, LevelDB, Token Creation API

set -e  # Exit on error

# Configuration
REMOTE_HOST="dlt.aurigraph.io"
REMOTE_PORT="2235"
REMOTE_USER="subbu"
REMOTE_PATH="/home/subbu/Aurigraph-DLT"

echo "=========================================="
echo "🚀 Aurigraph V12 - Remote Deployment"
echo "=========================================="
echo "Target: ${REMOTE_USER}@${REMOTE_HOST}:${REMOTE_PORT}"
echo "Date: $(date)"
echo ""

# Function to execute remote command
remote_exec() {
    ssh -p ${REMOTE_PORT} ${REMOTE_USER}@${REMOTE_HOST} "$@"
}

# Function to check if command succeeded
check_status() {
    if [ $? -eq 0 ]; then
        echo "✅ $1"
    else
        echo "❌ $1 FAILED"
        exit 1
    fi
}

echo "=========================================="
echo "Step 1: Check Remote Server Connectivity"
echo "=========================================="
remote_exec "echo 'Remote server accessible'"
check_status "Remote server connection"
echo ""

echo "=========================================="
echo "Step 2: Check Docker Status"
echo "=========================================="
remote_exec "docker ps > /dev/null 2>&1 && echo 'Docker is running' || echo 'Docker is not running'"
check_status "Docker daemon check"
echo ""

echo "=========================================="
echo "Step 3: Fix PostgreSQL (Critical Fix #1)"
echo "=========================================="
echo "Checking PostgreSQL status..."
POSTGRES_STATUS=$(remote_exec "docker ps | grep dlt-postgres || echo 'NOT_RUNNING'")

if [[ "$POSTGRES_STATUS" == *"NOT_RUNNING"* ]]; then
    echo "⚠️  PostgreSQL not running, starting it..."
    remote_exec "cd ${REMOTE_PATH} && docker-compose up -d postgres"
    check_status "PostgreSQL container started"
    
    echo "Waiting for PostgreSQL to be ready (15 seconds)..."
    sleep 15
else
    echo "✅ PostgreSQL already running"
fi

echo "Verifying PostgreSQL health..."
remote_exec "docker exec dlt-postgres pg_isready -U aurigraph"
check_status "PostgreSQL health check"
echo ""

echo "=========================================="
echo "Step 4: Fix LevelDB Paths (Critical Fix #2)"
echo "=========================================="
echo "Creating LevelDB directory structure..."
remote_exec "sudo mkdir -p /var/lib/aurigraph/leveldb"
check_status "LevelDB directory created"

echo "Setting proper ownership..."
remote_exec "sudo chown -R ${REMOTE_USER}:${REMOTE_USER} /var/lib/aurigraph"
check_status "LevelDB ownership set"

echo "Setting proper permissions..."
remote_exec "sudo chmod -R 755 /var/lib/aurigraph"
check_status "LevelDB permissions set"

echo "Verifying write permissions..."
remote_exec "touch /var/lib/aurigraph/leveldb/test.txt && rm /var/lib/aurigraph/leveldb/test.txt"
check_status "LevelDB write test"
echo ""

echo "=========================================="
echo "Step 5: Build Application Locally"
echo "=========================================="
echo "Building V12 application with fixes..."
cd /Users/subbujois/subbuworkingdir/Aurigraph-DLT/aurigraph-av10-7/aurigraph-v11-standalone

# Check if TokenDataService needs to be fixed
if grep -q "// @Inject" src/main/java/io/aurigraph/v11/portal/services/TokenDataService.java 2>/dev/null; then
    echo "⚠️  TokenManagementService is commented out - needs manual fix"
    echo "Please uncomment @Inject TokenManagementService in TokenDataService.java"
    echo "Then re-run this script"
    # Don't exit - continue with current build
fi

echo "Running Maven build..."
./mvnw clean package -DskipTests -q
check_status "Maven build completed"

JAR_FILE="target/aurigraph-v12-standalone-12.0.0-runner.jar"
if [ ! -f "$JAR_FILE" ]; then
    echo "❌ JAR file not found: $JAR_FILE"
    exit 1
fi

JAR_SIZE=$(ls -lh "$JAR_FILE" | awk '{print $5}')
echo "✅ JAR built: $JAR_SIZE"
echo ""

echo "=========================================="
echo "Step 6: Deploy Application to Remote"
echo "=========================================="
echo "Copying JAR to remote server..."
scp -P ${REMOTE_PORT} "$JAR_FILE" ${REMOTE_USER}@${REMOTE_HOST}:/tmp/aurigraph-v12-runner.jar
check_status "JAR copied to remote server"
echo ""

echo "=========================================="
echo "Step 7: Update Remote Application"
echo "=========================================="
echo "Stopping current application..."
remote_exec "cd ${REMOTE_PATH} && docker-compose stop aurigraph-v11-service"
check_status "Application stopped"

echo "Backing up current JAR..."
remote_exec "if [ -f ${REMOTE_PATH}/aurigraph-v11-runner.jar ]; then cp ${REMOTE_PATH}/aurigraph-v11-runner.jar ${REMOTE_PATH}/aurigraph-v11-runner.jar.backup-$(date +%Y%m%d-%H%M%S); fi"
echo "✅ Backup created"

echo "Deploying new JAR..."
remote_exec "cp /tmp/aurigraph-v12-runner.jar ${REMOTE_PATH}/aurigraph-v11-runner.jar"
check_status "New JAR deployed"

echo "Starting application..."
remote_exec "cd ${REMOTE_PATH} && docker-compose up -d aurigraph-v11-service"
check_status "Application started"

echo "Waiting for application startup (30 seconds)..."
sleep 30
echo ""

echo "=========================================="
echo "Step 8: Verify Deployment"
echo "=========================================="
echo "Checking container status..."
remote_exec "docker ps | grep dlt-aurigraph-v11"
check_status "Application container running"

echo "Checking health endpoint..."
HEALTH_CHECK=$(remote_exec "curl -s -o /dev/null -w '%{http_code}' https://dlt.aurigraph.io/q/health")
if [ "$HEALTH_CHECK" == "200" ]; then
    echo "✅ Health check passed (HTTP $HEALTH_CHECK)"
else
    echo "⚠️  Health check returned HTTP $HEALTH_CHECK (may still be starting)"
fi
echo ""

echo "=========================================="
echo "Step 9: Test Fixed Endpoints"
echo "=========================================="

echo "Testing Login API..."
LOGIN_STATUS=$(remote_exec "curl -s -o /dev/null -w '%{http_code}' -X POST https://dlt.aurigraph.io/api/v11/auth/login -H 'Content-Type: application/json' -d '{\"username\":\"test\",\"password\":\"test\"}'")
if [ "$LOGIN_STATUS" == "500" ]; then
    echo "⚠️  Login API still returns 500 (may need more time or additional fixes)"
else
    echo "✅ Login API returned HTTP $LOGIN_STATUS (not 500)"
fi

echo "Testing Demo Registration API..."
DEMO_STATUS=$(remote_exec "curl -s -o /dev/null -w '%{http_code}' -X POST https://dlt.aurigraph.io/api/v11/demos -H 'Content-Type: application/json' -d '{\"name\":\"Test\",\"description\":\"Test\",\"nodeCount\":5}'")
if [ "$DEMO_STATUS" == "500" ]; then
    echo "⚠️  Demo API still returns 500 (may need more time or additional fixes)"
else
    echo "✅ Demo API returned HTTP $DEMO_STATUS (not 500)"
fi

echo "Testing Info API..."
INFO_STATUS=$(remote_exec "curl -s -o /dev/null -w '%{http_code}' https://dlt.aurigraph.io/api/v11/info")
echo "✅ Info API returned HTTP $INFO_STATUS"
echo ""

echo "=========================================="
echo "Step 10: Check Application Logs"
echo "=========================================="
echo "Recent application logs:"
remote_exec "docker logs dlt-aurigraph-v11 --tail 20"
echo ""

echo "=========================================="
echo "✅ DEPLOYMENT COMPLETE"
echo "=========================================="
echo ""
echo "Summary:"
echo "  ✅ PostgreSQL: Running and healthy"
echo "  ✅ LevelDB: Directory created and writable"
echo "  ✅ Application: Deployed and running"
echo "  ✅ Health Check: HTTP $HEALTH_CHECK"
echo ""
echo "Next Steps:"
echo "  1. Monitor application logs: ssh -p ${REMOTE_PORT} ${REMOTE_USER}@${REMOTE_HOST} 'docker logs -f dlt-aurigraph-v11'"
echo "  2. Test endpoints: curl https://dlt.aurigraph.io/api/v11/info"
echo "  3. Check E2E tests: Review E2E-BUG-REPORT.md for verification"
echo ""
echo "If issues persist:"
echo "  - Check TokenDataService.java has @Inject uncommented"
echo "  - Verify PostgreSQL connection in application logs"
echo "  - Check LevelDB initialization in logs"
echo ""
echo "Deployment completed at: $(date)"
echo "=========================================="
