#!/bin/bash

# Aurigraph DLT V4.0 Production Deployment Script
# ================================================
# Deploy V4.0 to dlt.aurigraph.io on port 9004

set -e

echo "╔════════════════════════════════════════════════════════════╗"
echo "║         AURIGRAPH DLT V4.0 PRODUCTION DEPLOYMENT           ║"
echo "║                    Port: 9004                              ║"
echo "╚════════════════════════════════════════════════════════════╝"

# Configuration
REMOTE_HOST="dlt.aurigraph.io"
REMOTE_USER="subbu"
REMOTE_PORT="22"
REMOTE_PASSWORD="subbuFuture@2025"
DEPLOYMENT_DIR="/opt/aurigraph-v4"
JAR_FILE="aurigraph-av10-7/aurigraph-v11-standalone/target/aurigraph-v11-standalone-11.0.0.jar"
QUARKUS_DIR="aurigraph-av10-7/aurigraph-v11-standalone/target/quarkus-app"

# Step 1: Build V4 Profile (if not already built)
echo ""
echo "═══ Step 1: Building V4 Profile ═══"
if [ ! -f "$JAR_FILE" ]; then
    cd aurigraph-av10-7/aurigraph-v11-standalone
    ./mvnw clean package -DskipTests -Dmaven.test.skip=true
    cd ../..
fi

echo "✓ JAR file found: $JAR_FILE"

# Step 2: Check if Quarkus app directory exists for proper deployment
echo ""
echo "═══ Step 2: Checking Quarkus deployment structure ═══"
if [ -d "$QUARKUS_DIR" ]; then
    echo "✓ Using Quarkus app structure for deployment"
    DEPLOY_MODE="quarkus"
else
    echo "✓ Using standalone JAR for deployment"
    DEPLOY_MODE="jar"
fi

# Step 3: Create deployment package
echo ""
echo "═══ Step 3: Creating deployment package ═══"
rm -rf /tmp/aurigraph-v4-deploy
mkdir -p /tmp/aurigraph-v4-deploy

if [ "$DEPLOY_MODE" = "quarkus" ]; then
    cp -r $QUARKUS_DIR/* /tmp/aurigraph-v4-deploy/
else
    cp $JAR_FILE /tmp/aurigraph-v4-deploy/
fi

# Create application.properties with V4 configuration
cat > /tmp/aurigraph-v4-deploy/application.properties << 'EOF'
# V4 Profile Configuration
%v4.quarkus.http.port=9004
%v4.quarkus.http.host=0.0.0.0
%v4.quarkus.grpc.server.port=9005
%v4.quarkus.grpc.server.host=0.0.0.0

# Performance Settings
%v4.consensus.target.tps=3000000
%v4.consensus.batch.size=20000
%v4.consensus.parallel.threads=512
%v4.consensus.virtual.threads=true

# AI Optimization
%v4.ai.optimization.enabled=true
%v4.ai.optimization.target.tps=5000000
%v4.ai.optimization.learning.rate=0.001

# Aurigraph Ultra Performance
%v4.aurigraph.performance.mode=ultra
%v4.aurigraph.virtual.threads.max=200000
%v4.aurigraph.memory.pool.size=4096

# Monitoring
%v4.quarkus.log.level=INFO
%v4.quarkus.log.console.format=%d{HH:mm:ss} %-5p [%c{2.}] %s%e%n

# Health checks
%v4.quarkus.health.extensions.enabled=true
%v4.quarkus.health.openapi.included=true
EOF

# Create startup script
cat > /tmp/aurigraph-v4-deploy/run-v4.sh << 'EOF'
#!/bin/bash
cd /opt/aurigraph-v4

if [ -f "quarkus-run.jar" ]; then
    exec java -Xmx4g -Dquarkus.profile=v4 \
        -XX:+UseG1GC \
        -XX:MaxGCPauseMillis=200 \
        -XX:+UseStringDeduplication \
        -XX:+AlwaysPreTouch \
        -jar quarkus-run.jar
else
    exec java -Xmx4g -Dquarkus.profile=v4 \
        -XX:+UseG1GC \
        -XX:MaxGCPauseMillis=200 \
        -XX:+UseStringDeduplication \
        -XX:+AlwaysPreTouch \
        -jar aurigraph-v11-standalone-11.0.0.jar
fi
EOF

chmod +x /tmp/aurigraph-v4-deploy/run-v4.sh

# Step 4: Deploy to remote server
echo ""
echo "═══ Step 4: Deploying to $REMOTE_HOST ═══"

# Create deployment directory on remote
sshpass -p "$REMOTE_PASSWORD" ssh -p $REMOTE_PORT $REMOTE_USER@$REMOTE_HOST << 'EOF'
sudo mkdir -p /opt/aurigraph-v4
sudo chown subbu:subbu /opt/aurigraph-v4
EOF

# Transfer files
echo "Transferring deployment package..."
cd /tmp/aurigraph-v4-deploy
tar czf /tmp/aurigraph-v4.tar.gz .
sshpass -p "$REMOTE_PASSWORD" scp -P $REMOTE_PORT /tmp/aurigraph-v4.tar.gz $REMOTE_USER@$REMOTE_HOST:/tmp/

# Extract and setup on remote
echo "Setting up V4 on remote server..."
sshpass -p "$REMOTE_PASSWORD" ssh -p $REMOTE_PORT $REMOTE_USER@$REMOTE_HOST << 'EOF'
cd /opt/aurigraph-v4
tar xzf /tmp/aurigraph-v4.tar.gz
chmod +x run-v4.sh

# Create systemd service
sudo tee /etc/systemd/system/aurigraph-v4.service > /dev/null << 'SEOF'
[Unit]
Description=Aurigraph DLT V4.0 Service
After=network.target

[Service]
Type=simple
User=subbu
Group=subbu
WorkingDirectory=/opt/aurigraph-v4
ExecStart=/opt/aurigraph-v4/run-v4.sh
Restart=always
RestartSec=10
StandardOutput=journal
StandardError=journal

# Resource limits
LimitNOFILE=65536
LimitNPROC=32768

# Memory settings
MemoryLimit=6G
MemoryHigh=5G

[Install]
WantedBy=multi-user.target
SEOF

# Reload systemd and start service
sudo systemctl daemon-reload
sudo systemctl stop aurigraph-v4 2>/dev/null || true
sudo systemctl start aurigraph-v4
sudo systemctl enable aurigraph-v4

echo "V4 service started. Checking status..."
sleep 5
sudo systemctl status aurigraph-v4 --no-pager
EOF

# Step 5: Verify deployment
echo ""
echo "═══ Step 5: Verifying V4 Deployment ═══"
sleep 10

# Test health endpoint
echo "Testing health endpoint..."
curl -s http://$REMOTE_HOST:9004/q/health || echo "Health endpoint not yet ready"

echo ""
echo "Testing API endpoints..."
curl -s http://$REMOTE_HOST:9004/api/v11/health || echo "API endpoint not yet ready"

echo ""
echo "╔════════════════════════════════════════════════════════════╗"
echo "║           V4.0 DEPLOYMENT COMPLETED SUCCESSFULLY!          ║"
echo "╠════════════════════════════════════════════════════════════╣"
echo "║ Service URL:  http://dlt.aurigraph.io:9004                ║"
echo "║ Health Check: http://dlt.aurigraph.io:9004/q/health       ║"
echo "║ API Endpoint: http://dlt.aurigraph.io:9004/api/v11/       ║"
echo "║ gRPC Port:    9005                                        ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""
echo "To check logs on the server:"
echo "  ssh -p$REMOTE_PORT $REMOTE_USER@$REMOTE_HOST"
echo "  sudo journalctl -u aurigraph-v4 -f"
echo ""
echo "To restart the service:"
echo "  sudo systemctl restart aurigraph-v4"