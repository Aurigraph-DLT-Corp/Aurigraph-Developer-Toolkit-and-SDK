#!/bin/bash

# CURBy V12 Production Deployment Script
# Deploys Aurigraph V12 with CURBy Quantum Cryptography to remote server

set -e  # Exit on error

echo "=========================================="
echo "CURBy V12 Production Deployment"
echo "Date: $(date)"
echo "Target: dlt.aurigraph.io"
echo "=========================================="
echo ""

# Configuration
REMOTE_HOST="dlt.aurigraph.io"
REMOTE_USER="subbu"
REMOTE_PORT="22"
REMOTE_DIR="/tmp"
JAR_FILE="target/aurigraph-v12-standalone-12.0.0-runner.jar"
REMOTE_JAR="aurigraph-v12-curby-production.jar"

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Step 1: Verify local JAR exists
echo "Step 1: Verifying local build..."
if [ ! -f "$JAR_FILE" ]; then
    echo -e "${RED}ERROR: JAR file not found: $JAR_FILE${NC}"
    echo "Please run: ./mvnw package -DskipTests -Dquarkus.package.jar.type=uber-jar"
    exit 1
fi

JAR_SIZE=$(ls -lh "$JAR_FILE" | awk '{print $5}')
echo -e "${GREEN}✓ Local JAR found: $JAR_FILE ($JAR_SIZE)${NC}"
echo ""

# Step 2: Stop existing V12 process
echo "Step 2: Stopping existing V12 process..."
ssh -p "$REMOTE_PORT" "$REMOTE_USER@$REMOTE_HOST" <<'EOF'
    V12_PID=$(ps aux | grep "aurigraph-v12.*runner.jar" | grep -v grep | awk '{print $2}')
    if [ -n "$V12_PID" ]; then
        echo "Stopping V12 process (PID: $V12_PID)..."
        kill $V12_PID
        sleep 3

        # Force kill if still running
        if ps -p $V12_PID > /dev/null 2>&1; then
            echo "Force stopping..."
            kill -9 $V12_PID
        fi
        echo "✓ V12 process stopped"
    else
        echo "✓ No existing V12 process found"
    fi
EOF
echo ""

# Step 3: Upload JAR to remote server
echo "Step 3: Uploading V12 JAR to remote server..."
echo "Uploading $JAR_SIZE to $REMOTE_HOST..."
scp -P "$REMOTE_PORT" "$JAR_FILE" "$REMOTE_USER@$REMOTE_HOST:$REMOTE_DIR/$REMOTE_JAR"
echo -e "${GREEN}✓ JAR uploaded successfully${NC}"
echo ""

# Step 4: Verify remote file
echo "Step 4: Verifying remote file..."
REMOTE_SIZE=$(ssh -p "$REMOTE_PORT" "$REMOTE_USER@$REMOTE_HOST" "ls -lh $REMOTE_DIR/$REMOTE_JAR | awk '{print \$5}'")
echo -e "${GREEN}✓ Remote JAR verified: $REMOTE_SIZE${NC}"
echo ""

# Step 5: Start V12 with CURBy
echo "Step 5: Starting V12 with CURBy..."
ssh -p "$REMOTE_PORT" "$REMOTE_USER@$REMOTE_HOST" <<EOF
    cd $REMOTE_DIR
    nohup java -Xms512m -Xmx2g \
        -Dquarkus.http.port=9003 \
        -Dquarkus.http.host=0.0.0.0 \
        -Dquarkus.flyway.migrate-at-start=false \
        -Dcurby.quantum.enabled=true \
        -Dcurby.quantum.fallback=true \
        -jar $REMOTE_JAR > v12-curby.log 2>&1 &

    V12_PID=\$!
    echo "V12 started with PID: \$V12_PID"
    echo \$V12_PID > v12.pid
EOF
echo -e "${GREEN}✓ V12 started successfully${NC}"
echo ""

# Step 6: Wait for startup
echo "Step 6: Waiting for V12 to start (15 seconds)..."
sleep 15
echo ""

# Step 7: Health check
echo "Step 7: Performing health checks..."
echo ""

echo "Checking Quarkus health endpoint..."
HEALTH_RESPONSE=$(ssh -p "$REMOTE_PORT" "$REMOTE_USER@$REMOTE_HOST" "curl -s http://localhost:9003/q/health" || echo "FAILED")
if echo "$HEALTH_RESPONSE" | grep -q "UP"; then
    echo -e "${GREEN}✓ Quarkus health: UP${NC}"
else
    echo -e "${YELLOW}⚠ Quarkus health check: $HEALTH_RESPONSE${NC}"
fi
echo ""

echo "Checking V11 API health endpoint..."
API_HEALTH=$(ssh -p "$REMOTE_PORT" "$REMOTE_USER@$REMOTE_HOST" "curl -s http://localhost:9003/api/v11/health" || echo "FAILED")
if echo "$API_HEALTH" | grep -q "status"; then
    echo -e "${GREEN}✓ V11 API health: OK${NC}"
else
    echo -e "${YELLOW}⚠ V11 API health check: $API_HEALTH${NC}"
fi
echo ""

echo "Checking CURBy quantum service..."
CURBY_HEALTH=$(ssh -p "$REMOTE_PORT" "$REMOTE_USER@$REMOTE_HOST" "curl -s http://localhost:9003/api/v11/curby/health" || echo "FAILED")
if echo "$CURBY_HEALTH" | grep -q "enabled"; then
    echo -e "${GREEN}✓ CURBy quantum service: Available${NC}"
    echo "$CURBY_HEALTH" | head -20
else
    echo -e "${YELLOW}⚠ CURBy service check: $CURBY_HEALTH${NC}"
fi
echo ""

# Step 8: Display logs
echo "Step 8: Displaying recent logs..."
ssh -p "$REMOTE_PORT" "$REMOTE_USER@$REMOTE_HOST" "tail -30 $REMOTE_DIR/v12-curby.log"
echo ""

# Step 9: Display process info
echo "Step 9: Verifying V12 process..."
ssh -p "$REMOTE_PORT" "$REMOTE_USER@$REMOTE_HOST" <<'EOF'
    V12_PID=$(cat /tmp/v12.pid 2>/dev/null)
    if [ -n "$V12_PID" ] && ps -p $V12_PID > /dev/null 2>&1; then
        echo "✓ V12 process running (PID: $V12_PID)"
        ps aux | grep $V12_PID | grep -v grep
    else
        echo "⚠ V12 process not found"
    fi
EOF
echo ""

echo "=========================================="
echo "Deployment Summary"
echo "=========================================="
echo -e "${GREEN}✓ JAR uploaded: $REMOTE_SIZE${NC}"
echo -e "${GREEN}✓ V12 started with CURBy enabled${NC}"
echo -e "${GREEN}✓ Health checks completed${NC}"
echo ""
echo "Access URLs:"
echo "  - Health: http://dlt.aurigraph.io:9003/q/health"
echo "  - API: http://dlt.aurigraph.io:9003/api/v11/health"
echo "  - CURBy: http://dlt.aurigraph.io:9003/api/v11/curby/health"
echo "  - Metrics: http://dlt.aurigraph.io:9003/q/metrics"
echo "  - Dev UI: http://dlt.aurigraph.io:9003/q/dev/"
echo ""
echo "Useful Commands:"
echo "  - View logs: ssh subbu@dlt.aurigraph.io 'tail -f /tmp/v12-curby.log'"
echo "  - Check process: ssh subbu@dlt.aurigraph.io 'ps aux | grep v12'"
echo "  - Stop V12: ssh subbu@dlt.aurigraph.io 'kill \$(cat /tmp/v12.pid)'"
echo ""
echo "=========================================="
echo -e "${GREEN}✓ Deployment Complete!${NC}"
echo "=========================================="
