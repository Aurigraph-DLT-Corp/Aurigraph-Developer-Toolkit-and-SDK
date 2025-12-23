#!/bin/bash

# =============================================================================
# Aurigraph V12 - Quick Deploy to Remote Server
# =============================================================================
# One-command deployment script for local builds
# Usage: ./deploy-to-remote.sh [--skip-build] [--skip-tests]
# =============================================================================

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Configuration
REMOTE_HOST="dlt.aurigraph.io"
REMOTE_USER="subbu"
REMOTE_PORT="22"
SERVICE_PORT="9003"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Parse arguments
SKIP_BUILD=false
SKIP_TESTS=false

for arg in "$@"; do
    case $arg in
        --skip-build)
            SKIP_BUILD=true
            shift
            ;;
        --skip-tests)
            SKIP_TESTS=true
            shift
            ;;
    esac
done

echo -e "${BLUE}============================================${NC}"
echo -e "${BLUE}  Aurigraph V12 Remote Deployment${NC}"
echo -e "${BLUE}============================================${NC}"
echo -e "  Target: ${REMOTE_USER}@${REMOTE_HOST}:${REMOTE_PORT}"
echo -e "  Time: $(date)"
echo ""

# Step 1: Build
if [ "$SKIP_BUILD" = false ]; then
    echo -e "${YELLOW}Step 1: Building application...${NC}"
    cd "$SCRIPT_DIR"

    if [ "$SKIP_TESTS" = true ]; then
        ./mvnw clean package -DskipTests
    else
        ./mvnw clean package
    fi

    echo -e "${GREEN}Build complete!${NC}"
else
    echo -e "${YELLOW}Step 1: Skipping build (--skip-build)${NC}"
fi
echo ""

# Step 2: Verify JAR exists
echo -e "${YELLOW}Step 2: Verifying build artifacts...${NC}"
JAR_PATH="$SCRIPT_DIR/target/quarkus-app/quarkus-run.jar"

if [ ! -f "$JAR_PATH" ]; then
    echo -e "${RED}ERROR: JAR not found at $JAR_PATH${NC}"
    echo "Please run: ./mvnw clean package"
    exit 1
fi

JAR_SIZE=$(du -h "$SCRIPT_DIR/target/quarkus-app/" | tail -1 | cut -f1)
echo -e "${GREEN}Build artifacts verified: ${JAR_SIZE}${NC}"
echo ""

# Step 3: Create deployment package
echo -e "${YELLOW}Step 3: Creating deployment package...${NC}"
cd "$SCRIPT_DIR/target"
tar -czf quarkus-app-deploy.tar.gz quarkus-app/
PACKAGE_SIZE=$(du -h quarkus-app-deploy.tar.gz | cut -f1)
echo -e "${GREEN}Package created: ${PACKAGE_SIZE}${NC}"
echo ""

# Step 4: Upload to remote server
echo -e "${YELLOW}Step 4: Uploading to remote server...${NC}"
scp -P ${REMOTE_PORT} quarkus-app-deploy.tar.gz ${REMOTE_USER}@${REMOTE_HOST}:/home/subbu/
echo -e "${GREEN}Upload complete!${NC}"
echo ""

# Step 5: Deploy on remote server
echo -e "${YELLOW}Step 5: Deploying on remote server...${NC}"
ssh -p ${REMOTE_PORT} ${REMOTE_USER}@${REMOTE_HOST} << 'DEPLOY_SCRIPT'
set -e
cd $HOME

echo "Backing up current deployment..."
if [ -d "quarkus-app" ]; then
    mv quarkus-app quarkus-app.backup.$(date +%Y%m%d_%H%M%S) 2>/dev/null || true
fi

echo "Extracting new deployment..."
tar -xzf quarkus-app-deploy.tar.gz
rm quarkus-app-deploy.tar.gz

echo "Stopping existing service..."
pkill -f 'quarkus-run.jar' 2>/dev/null || echo "No existing process"
sleep 3

echo "Starting new service..."
mkdir -p $HOME/aurigraph/logs

nohup java \
    -Xmx8g -Xms4g \
    -XX:+UseG1GC \
    -XX:MaxGCPauseMillis=200 \
    -Dquarkus.http.port=9003 \
    -Dquarkus.grpc.server.port=9001 \
    -Dquarkus.log.level=INFO \
    -Dcurby.quantum.api-key=placeholder \
    -Dquarkus.datasource.jdbc.url=jdbc:postgresql://localhost:5432/j4c_db \
    -Dquarkus.datasource.username=j4c_user \
    -Dquarkus.datasource.password=j4c_password \
    -Dquarkus.flyway.migrate-at-start=false \
    -jar $HOME/quarkus-app/quarkus-run.jar \
    > $HOME/aurigraph/logs/main-api.log 2>&1 &

echo "Service PID: $!"
echo "Waiting 20s for startup..."
sleep 20

# Health check
HEALTH=$(curl -s http://localhost:9003/api/v11/health 2>&1 || echo "TIMEOUT")
if echo "$HEALTH" | grep -q "status"; then
    echo "Health check: PASSED"
else
    echo "Health check: WARNING - Response: $HEALTH"
fi

# Cleanup old backups (keep last 3)
ls -dt quarkus-app.backup.* 2>/dev/null | tail -n +4 | xargs rm -rf 2>/dev/null || true

echo "Deployment complete!"
DEPLOY_SCRIPT

echo ""

# Step 6: Final verification
echo -e "${YELLOW}Step 6: Verifying deployment...${NC}"
sleep 5

HEALTH_RESPONSE=$(curl -s --max-time 10 https://${REMOTE_HOST}/api/v11/health 2>&1 || echo "TIMEOUT")
echo "Health endpoint: $HEALTH_RESPONSE"
echo ""

if echo "$HEALTH_RESPONSE" | grep -q "status"; then
    echo -e "${GREEN}============================================${NC}"
    echo -e "${GREEN}  Deployment Successful!${NC}"
    echo -e "${GREEN}============================================${NC}"
else
    echo -e "${YELLOW}============================================${NC}"
    echo -e "${YELLOW}  Deployment Complete (verify manually)${NC}"
    echo -e "${YELLOW}============================================${NC}"
fi

echo ""
echo "Endpoints:"
echo "  - Health: https://${REMOTE_HOST}/api/v11/health"
echo "  - Live Prices: https://${REMOTE_HOST}/api/v11/live/prices"
echo "  - Tokens: https://${REMOTE_HOST}/api/v11/tokens"
echo ""
echo "Useful commands:"
echo "  View logs: ssh -p ${REMOTE_PORT} ${REMOTE_USER}@${REMOTE_HOST} 'tail -f ~/aurigraph/logs/main-api.log'"
echo "  Stop service: ssh -p ${REMOTE_PORT} ${REMOTE_USER}@${REMOTE_HOST} 'pkill -f quarkus-run.jar'"
echo ""

# Cleanup local package
rm -f "$SCRIPT_DIR/target/quarkus-app-deploy.tar.gz"
