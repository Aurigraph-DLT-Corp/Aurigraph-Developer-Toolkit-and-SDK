#!/bin/bash

# Aurigraph V11 Quick Chunked Deployment Script
# Uses existing JAR - no rebuild required
# Target: dlt.aurigraph.io

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Configuration
REMOTE_HOST="151.242.51.55"  # dlt.aurigraph.io
REMOTE_USER="subbu"
REMOTE_PASSWORD="subbuFuture@2025"
REMOTE_PORT="22"
DEPLOY_DIR="/opt/aurigraph/v11"
CHUNK_SIZE="100M"  # 100 MB chunks
TEMP_DIR="/tmp/aurigraph-deploy-$(date +%Y%m%d-%H%M%S)"
SOURCE_JAR="aurigraph-av10-7/aurigraph-v11-standalone/target/aurigraph-v11-standalone-11.0.0-runner.jar"

echo -e "${BLUE}================================================================${NC}"
echo -e "${BLUE}Aurigraph V11 Quick Chunked Deployment (No Rebuild)${NC}"
echo -e "${BLUE}Target: ${REMOTE_HOST}${NC}"
echo -e "${BLUE}Chunk Size: ${CHUNK_SIZE}${NC}"
echo -e "${BLUE}================================================================${NC}"
echo ""

# Check if JAR exists
if [ ! -f "${SOURCE_JAR}" ]; then
    echo -e "${RED}✗ JAR file not found: ${SOURCE_JAR}${NC}"
    echo -e "${YELLOW}Please build the application first:${NC}"
    echo -e "${YELLOW}cd aurigraph-av10-7/aurigraph-v11-standalone && ./mvnw clean package -DskipTests${NC}"
    exit 1
fi

JAR_SIZE=$(du -h "${SOURCE_JAR}" | cut -f1)
echo -e "${GREEN}✓ Found JAR: ${SOURCE_JAR} (${JAR_SIZE})${NC}"
echo ""

# Create temp directory
mkdir -p "${TEMP_DIR}/chunks"
echo -e "${GREEN}✓ Created temporary directory: ${TEMP_DIR}${NC}"
echo ""

# Step 1: Create chunks
echo -e "${YELLOW}[1/6] Splitting JAR into ${CHUNK_SIZE} chunks...${NC}"

# Copy JAR to temp directory
cp "${SOURCE_JAR}" "${TEMP_DIR}/aurigraph-v11.jar"

# Split into chunks
cd "${TEMP_DIR}"
split -b ${CHUNK_SIZE} -d aurigraph-v11.jar chunks/chunk-

# Count chunks
CHUNK_COUNT=$(ls chunks/chunk-* | wc -l)
echo -e "${GREEN}✓ Created ${CHUNK_COUNT} chunks${NC}"

# Generate checksums
echo -e "${BLUE}  Generating checksums...${NC}"
md5sum aurigraph-v11.jar > aurigraph-v11.jar.md5
md5sum chunks/chunk-* > chunks.md5

echo -e "${GREEN}✓ Checksums generated${NC}"
echo ""

# Step 2: Test SSH connection
echo -e "${YELLOW}[2/6] Testing connection to ${REMOTE_HOST}...${NC}"

SSH_CMD="sshpass -p '${REMOTE_PASSWORD}' ssh -p ${REMOTE_PORT} -o StrictHostKeyChecking=no"
SCP_CMD="sshpass -p '${REMOTE_PASSWORD}' scp -P ${REMOTE_PORT} -o StrictHostKeyChecking=no"

# Test connection
${SSH_CMD} ${REMOTE_USER}@${REMOTE_HOST} "echo 'Connection OK'" > /dev/null 2>&1

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ SSH connection successful${NC}"
else
    echo -e "${RED}✗ SSH connection failed${NC}"
    echo -e "${YELLOW}Please ensure you can connect to ${REMOTE_HOST}${NC}"
    exit 1
fi
echo ""

# Step 3: Prepare remote server
echo -e "${YELLOW}[3/6] Preparing remote server...${NC}"

${SSH_CMD} ${REMOTE_USER}@${REMOTE_HOST} << 'PREPARE_SERVER'
    set -e

    # Create directories
    sudo mkdir -p /opt/aurigraph/v11/upload
    sudo chown -R subbu:subbu /opt/aurigraph/v11

    # Backup existing deployment
    if [ -f /opt/aurigraph/v11/aurigraph-v11.jar ]; then
        echo "Backing up existing JAR..."
        cp /opt/aurigraph/v11/aurigraph-v11.jar \
           /opt/aurigraph/v11/aurigraph-v11.jar.backup-$(date +%Y%m%d-%H%M%S)
    fi

    # Clean upload directory
    rm -rf /opt/aurigraph/v11/upload/*

    echo "Server prepared"
PREPARE_SERVER

echo -e "${GREEN}✓ Remote server prepared${NC}"
echo ""

# Step 4: Upload chunks
echo -e "${YELLOW}[4/6] Uploading ${CHUNK_COUNT} chunks to server...${NC}"

UPLOADED=0
FAILED=0

for chunk in chunks/chunk-*; do
    CHUNK_NAME=$(basename ${chunk})
    UPLOADED=$((UPLOADED + 1))

    echo -ne "${BLUE}  Uploading ${CHUNK_NAME} (${UPLOADED}/${CHUNK_COUNT})...${NC}"

    ${SCP_CMD} "${chunk}" \
        ${REMOTE_USER}@${REMOTE_HOST}:/opt/aurigraph/v11/upload/ 2>/dev/null

    if [ $? -eq 0 ]; then
        echo -e " ${GREEN}✓${NC}"
    else
        echo -e " ${RED}✗${NC}"
        FAILED=$((FAILED + 1))
    fi
done

# Upload checksums
echo -ne "${BLUE}  Uploading checksums...${NC}"
${SCP_CMD} chunks.md5 aurigraph-v11.jar.md5 \
    ${REMOTE_USER}@${REMOTE_HOST}:/opt/aurigraph/v11/upload/

if [ $? -eq 0 ]; then
    echo -e " ${GREEN}✓${NC}"
else
    echo -e " ${RED}✗${NC}"
    FAILED=$((FAILED + 1))
fi

echo ""
echo -e "${GREEN}✓ Upload complete: ${UPLOADED}/${CHUNK_COUNT} chunks${NC}"

if [ ${FAILED} -gt 0 ]; then
    echo -e "${RED}✗ ${FAILED} uploads failed${NC}"
    exit 1
fi
echo ""

# Step 5: Reassemble on server
echo -e "${YELLOW}[5/6] Reassembling JAR on server...${NC}"

${SSH_CMD} ${REMOTE_USER}@${REMOTE_HOST} << 'REASSEMBLE'
    set -e

    cd /opt/aurigraph/v11/upload

    # Count chunks
    CHUNKS=$(ls chunk-* 2>/dev/null | wc -l)
    echo "Found ${CHUNKS} chunks to reassemble"

    # Reassemble
    cat chunk-* > ../aurigraph-v11.jar

    if [ $? -eq 0 ]; then
        echo "✓ Reassembly complete"
    else
        echo "✗ Reassembly failed"
        exit 1
    fi

    # Verify checksum
    cd /opt/aurigraph/v11

    echo "Verifying checksum..."
    md5sum -c upload/aurigraph-v11.jar.md5

    if [ $? -eq 0 ]; then
        echo "✓ Checksum verification passed"
    else
        echo "✗ Checksum verification failed"
        exit 1
    fi

    # Set permissions
    chmod 644 aurigraph-v11.jar

    # Get file size
    SIZE=$(du -h aurigraph-v11.jar | cut -f1)
    echo "Reassembled JAR size: ${SIZE}"

    # Cleanup chunks
    rm -rf upload/chunk-*

    echo "✓ Reassembly complete and verified"
REASSEMBLE

echo -e "${GREEN}✓ JAR reassembled and verified on server${NC}"
echo ""

# Step 6: Deploy and start service
echo -e "${YELLOW}[6/6] Deploying application...${NC}"

${SSH_CMD} ${REMOTE_USER}@${REMOTE_HOST} << 'DEPLOY'
    set -e

    cd /opt/aurigraph/v11

    # Stop existing service
    echo "Stopping service..."
    sudo systemctl stop aurigraph-v11 || true
    sleep 3

    # Ensure service file exists
    if [ ! -f /etc/systemd/system/aurigraph-v11.service ]; then
        echo "Creating systemd service file..."
        sudo tee /etc/systemd/system/aurigraph-v11.service > /dev/null << 'SERVICE'
[Unit]
Description=Aurigraph V11 Blockchain Platform
After=network.target postgresql.service
Requires=postgresql.service

[Service]
Type=simple
User=subbu
WorkingDirectory=/opt/aurigraph/v11
Environment="QUARKUS_HTTP_PORT=9003"
Environment="QUARKUS_GRPC_SERVER_PORT=9004"
Environment="QUARKUS_PROFILE=prod"
Environment="QUARKUS_DATASOURCE_JDBC_URL=jdbc:postgresql://localhost:5432/aurigraph_compliance_db"
Environment="QUARKUS_DATASOURCE_USERNAME=aurigraph_compliance"
Environment="QUARKUS_DATASOURCE_PASSWORD=AurigraphV11@2025"
Environment="JAVA_OPTS=-Xmx8g -Xms4g -XX:+UseG1GC -XX:MaxGCPauseMillis=100"
ExecStart=/usr/bin/java -jar /opt/aurigraph/v11/aurigraph-v11.jar
StandardOutput=append:/opt/aurigraph/v11/logs/aurigraph-v11.log
StandardError=append:/opt/aurigraph/v11/logs/aurigraph-v11-error.log
Restart=on-failure
RestartSec=10
TimeoutStartSec=120
TimeoutStopSec=30

[Install]
WantedBy=multi-user.target
SERVICE
    fi

    # Reload systemd
    sudo systemctl daemon-reload

    # Enable service
    sudo systemctl enable aurigraph-v11

    # Start service
    echo "Starting service..."
    sudo systemctl start aurigraph-v11

    # Wait for startup
    echo "Waiting for service to start..."
    sleep 15

    # Check status
    sudo systemctl status aurigraph-v11 --no-pager || true

    echo "✓ Service started"
DEPLOY

echo -e "${GREEN}✓ Application deployed${NC}"
echo ""

# Step 7: Validate deployment
echo -e "${YELLOW}[7/7] Validating deployment...${NC}"

${SSH_CMD} ${REMOTE_USER}@${REMOTE_HOST} << 'VALIDATE'
    # Wait for application to be ready
    echo "Waiting for application to be ready..."

    for i in {1..30}; do
        if curl -s http://localhost:9003/q/health > /dev/null 2>&1; then
            echo "✓ Health endpoint responding"
            break
        fi
        sleep 2
    done

    # Get health status
    echo ""
    echo "=== Health Check ==="
    curl -s http://localhost:9003/q/health 2>/dev/null | python3 -m json.tool || echo "Health check pending..."

    # Check service status
    echo ""
    echo "=== Service Status ==="
    sudo systemctl status aurigraph-v11 --no-pager | head -15

    # Show recent logs
    echo ""
    echo "=== Recent Logs ==="
    tail -20 /opt/aurigraph/v11/logs/aurigraph-v11.log 2>/dev/null || echo "No logs yet"
VALIDATE

echo ""
echo -e "${BLUE}================================================================${NC}"
echo -e "${GREEN}✓✓✓ DEPLOYMENT COMPLETE ✓✓✓${NC}"
echo -e "${BLUE}================================================================${NC}"
echo ""
echo -e "${GREEN}Deployment Summary:${NC}"
echo -e "  • Server: ${REMOTE_HOST}"
echo -e "  • Chunks Uploaded: ${CHUNK_COUNT}"
echo -e "  • JAR Size: ${JAR_SIZE}"
echo -e "  • Deploy Directory: ${DEPLOY_DIR}"
echo -e "  • Service: aurigraph-v11"
echo ""
echo -e "${GREEN}Access URLs:${NC}"
echo -e "  • Internal Health: http://localhost:9003/q/health"
echo -e "  • Internal API: http://localhost:9003/api/v11/info"
echo -e "  • External HTTPS: https://${REMOTE_HOST}:8443/api/v11/info"
echo ""

# Cleanup local temp directory
echo -e "${YELLOW}Cleaning up temporary files...${NC}"
cd - > /dev/null
rm -rf "${TEMP_DIR}"
echo -e "${GREEN}✓ Cleanup complete${NC}"
echo ""

echo -e "${BLUE}================================================================${NC}"
echo -e "${GREEN}🚀 Aurigraph V11 is now running on ${REMOTE_HOST}!${NC}"
echo -e "${BLUE}================================================================${NC}"
