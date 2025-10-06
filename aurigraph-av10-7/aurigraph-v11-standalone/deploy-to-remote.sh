#!/bin/bash

###############################################################################
# Aurigraph V11 Remote Deployment Script
# Uploads JAR chunks to remote server, reassembles, and deploys backend
###############################################################################

set -e  # Exit on error

# Configuration
REMOTE_HOST="dlt.aurigraph.io"
REMOTE_USER="subbu"
SSH_PORT="22"  # Using standard SSH port
REMOTE_DIR="/tmp/aurigraph-v11-deploy"
CHUNKS_DIR="target/chunks"
JAR_NAME="aurigraph-v11-standalone-11.0.0-runner.jar"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}╔════════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║  Aurigraph V11 - Remote Deployment Script                     ║${NC}"
echo -e "${BLUE}║  Target: ${REMOTE_USER}@${REMOTE_HOST}:${SSH_PORT}                            ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════════════╝${NC}"
echo ""

# Step 1: Verify local chunks exist
echo -e "${YELLOW}[1/7]${NC} Verifying local JAR chunks..."
if [ ! -d "$CHUNKS_DIR" ]; then
    echo -e "${RED}❌ Error: Chunks directory not found: $CHUNKS_DIR${NC}"
    exit 1
fi

CHUNK_COUNT=$(ls -1 "$CHUNKS_DIR"/jar.part.* 2>/dev/null | wc -l | tr -d ' ')
if [ "$CHUNK_COUNT" -eq 0 ]; then
    echo -e "${RED}❌ Error: No JAR chunks found in $CHUNKS_DIR${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Found $CHUNK_COUNT JAR chunks${NC}"
echo -e "   MD5: $(cat $CHUNKS_DIR/jar.md5)"
echo ""

# Step 2: Test SSH connection
echo -e "${YELLOW}[2/7]${NC} Testing SSH connection to remote server..."
if ! ssh -p${SSH_PORT} -o ConnectTimeout=10 -o BatchMode=yes ${REMOTE_USER}@${REMOTE_HOST} "echo 'SSH OK'" 2>/dev/null; then
    echo -e "${RED}❌ Error: Cannot connect to ${REMOTE_HOST}:${SSH_PORT}${NC}"
    echo -e "   Please ensure SSH keys are configured or enter password when prompted."
    exit 1
fi
echo -e "${GREEN}✅ SSH connection successful${NC}"
echo ""

# Step 3: Prepare remote directory
echo -e "${YELLOW}[3/7]${NC} Preparing remote directory..."
ssh -p${SSH_PORT} ${REMOTE_USER}@${REMOTE_HOST} <<EOF
    echo "Creating deployment directory: $REMOTE_DIR"
    rm -rf $REMOTE_DIR
    mkdir -p $REMOTE_DIR
    echo "Remote directory prepared"
EOF
echo -e "${GREEN}✅ Remote directory prepared: $REMOTE_DIR${NC}"
echo ""

# Step 4: Upload JAR chunks
echo -e "${YELLOW}[4/7]${NC} Uploading JAR chunks to remote server..."
echo -e "   This may take several minutes (uploading ~1.6GB)..."

# Upload with progress using rsync (faster than scp for multiple files)
if command -v rsync &> /dev/null; then
    echo -e "   Using rsync for optimized transfer..."
    rsync -avz --progress -e "ssh -p${SSH_PORT}" \
        $CHUNKS_DIR/jar.part.* \
        $CHUNKS_DIR/jar.md5 \
        $CHUNKS_DIR/reassemble.sh \
        $CHUNKS_DIR/deploy.sh \
        $CHUNKS_DIR/aurigraph-v11.service \
        ${REMOTE_USER}@${REMOTE_HOST}:${REMOTE_DIR}/
else
    echo -e "   Using scp for transfer..."
    scp -P${SSH_PORT} -r $CHUNKS_DIR/jar.part.* ${REMOTE_USER}@${REMOTE_HOST}:${REMOTE_DIR}/
    scp -P${SSH_PORT} $CHUNKS_DIR/jar.md5 ${REMOTE_USER}@${REMOTE_HOST}:${REMOTE_DIR}/
    scp -P${SSH_PORT} $CHUNKS_DIR/reassemble.sh ${REMOTE_USER}@${REMOTE_HOST}:${REMOTE_DIR}/
    scp -P${SSH_PORT} $CHUNKS_DIR/deploy.sh ${REMOTE_USER}@${REMOTE_HOST}:${REMOTE_DIR}/
    scp -P${SSH_PORT} $CHUNKS_DIR/aurigraph-v11.service ${REMOTE_USER}@${REMOTE_HOST}:${REMOTE_DIR}/
fi

echo -e "${GREEN}✅ Upload complete${NC}"
echo ""

# Step 5: Reassemble JAR on remote server
echo -e "${YELLOW}[5/7]${NC} Reassembling JAR on remote server..."
ssh -p${SSH_PORT} ${REMOTE_USER}@${REMOTE_HOST} <<EOF
    cd $REMOTE_DIR
    chmod +x reassemble.sh
    ./reassemble.sh

    if [ ! -f "$JAR_NAME" ]; then
        echo "ERROR: JAR reassembly failed"
        exit 1
    fi

    echo "JAR reassembly successful"
    ls -lh $JAR_NAME
EOF

if [ $? -ne 0 ]; then
    echo -e "${RED}❌ JAR reassembly failed${NC}"
    exit 1
fi

echo -e "${GREEN}✅ JAR reassembled successfully${NC}"
echo ""

# Step 6: Deploy backend service
echo -e "${YELLOW}[6/7]${NC} Deploying backend service..."
ssh -p${SSH_PORT} ${REMOTE_USER}@${REMOTE_HOST} <<'EOF'
    DEPLOY_DIR="/tmp/aurigraph-v11-deploy"
    SERVICE_DIR="/opt/aurigraph-v11"
    JAR_NAME="aurigraph-v11-standalone-11.0.0-runner.jar"

    echo "Creating service directory..."
    sudo mkdir -p $SERVICE_DIR

    echo "Copying JAR to service directory..."
    sudo cp $DEPLOY_DIR/$JAR_NAME $SERVICE_DIR/
    sudo chown root:root $SERVICE_DIR/$JAR_NAME
    sudo chmod 755 $SERVICE_DIR/$JAR_NAME

    echo "Installing systemd service..."
    sudo cp $DEPLOY_DIR/aurigraph-v11.service /etc/systemd/system/
    sudo systemctl daemon-reload

    echo "Stopping existing service (if running)..."
    sudo systemctl stop aurigraph-v11 || true

    echo "Starting Aurigraph V11 backend service..."
    sudo systemctl start aurigraph-v11
    sudo systemctl enable aurigraph-v11

    echo "Waiting for service to start..."
    sleep 5

    echo "Service status:"
    sudo systemctl status aurigraph-v11 --no-pager || true
EOF

echo -e "${GREEN}✅ Backend service deployed${NC}"
echo ""

# Step 7: Verify deployment
echo -e "${YELLOW}[7/7]${NC} Verifying deployment..."
ssh -p${SSH_PORT} ${REMOTE_USER}@${REMOTE_HOST} <<'EOF'
    echo "Checking if backend is responding on port 8443..."
    sleep 3

    if curl -k -s https://localhost:8443/api/v11/health > /dev/null 2>&1; then
        echo "✅ Backend is responding on HTTPS port 8443"
        curl -k https://localhost:8443/api/v11/info
    else
        echo "⚠️  Backend not yet responding (may still be starting)"
        echo "Check logs with: sudo journalctl -u aurigraph-v11 -f"
    fi

    echo ""
    echo "Service endpoints:"
    echo "  - Backend API: https://dlt.aurigraph.io:8443/api/v11/"
    echo "  - Health Check: https://dlt.aurigraph.io:8443/api/v11/health"
    echo "  - Metrics: https://dlt.aurigraph.io:8443/q/metrics"
EOF

echo ""
echo -e "${BLUE}╔════════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║  ✅ Deployment Complete!                                       ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "${GREEN}Backend API:${NC} https://dlt.aurigraph.io:8443/api/v11/"
echo -e "${GREEN}Health Check:${NC} curl -k https://dlt.aurigraph.io:8443/api/v11/health"
echo ""
echo -e "${YELLOW}Useful commands:${NC}"
echo -e "  View logs:    ssh -p${SSH_PORT} ${REMOTE_USER}@${REMOTE_HOST} 'sudo journalctl -u aurigraph-v11 -f'"
echo -e "  Restart:      ssh -p${SSH_PORT} ${REMOTE_USER}@${REMOTE_HOST} 'sudo systemctl restart aurigraph-v11'"
echo -e "  Stop:         ssh -p${SSH_PORT} ${REMOTE_USER}@${REMOTE_HOST} 'sudo systemctl stop aurigraph-v11'"
echo -e "  Status:       ssh -p${SSH_PORT} ${REMOTE_USER}@${REMOTE_HOST} 'sudo systemctl status aurigraph-v11'"
echo ""
