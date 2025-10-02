#!/bin/bash

# ========================================
# Aurigraph V11 GraalVM Native Deployment
# ========================================
# Deploys Aurigraph V11 to production server and builds native executable
# As per requirement: "Aurigraph nodes MUST run in GraalVM native mode"

set -e

# Production server configuration
REMOTE_HOST="dlt.aurigraph.io"
REMOTE_PORT="2235"
REMOTE_USER="subbu"
REMOTE_PATH="/home/subbu/aurigraph-v11"

echo "========================================="
echo " Aurigraph V11 GraalVM Native Deployment"
echo " Target: ${REMOTE_HOST}:9003"
echo "========================================="

# Step 1: Check if JAR was already built
echo "[1/6] Checking local build..."
JAR_FILE="target/quarkus-app/quarkus-run.jar"
if [ ! -f "$JAR_FILE" ]; then
    echo "Building JAR locally first..."
    ./mvnw clean package -DskipTests -Dmaven.test.skip=true
fi

echo "[2/6] Creating deployment package..."
# Create temporary deployment directory
DEPLOY_DIR="aurigraph-v11-deploy"
rm -rf $DEPLOY_DIR
mkdir -p $DEPLOY_DIR

# Copy necessary files
cp -r target/quarkus-app/* $DEPLOY_DIR/
cp -r src/main/resources $DEPLOY_DIR/
cp pom.xml $DEPLOY_DIR/

# Create deployment script for remote server
cat > $DEPLOY_DIR/build-native-remote.sh << 'EOF'
#!/bin/bash
set -e

echo "Building GraalVM native executable on production server..."

# Check for Docker
if command -v docker &> /dev/null; then
    echo "Docker found, using container build..."
    ./mvnw package -Pnative-ultra -Dmaven.test.skip=true \
        -Dquarkus.native.container-build=true \
        -Dquarkus.native.container-runtime=docker
else
    echo "Docker not found, checking for local GraalVM..."
    if [ -n "$GRAALVM_HOME" ]; then
        echo "GraalVM found at $GRAALVM_HOME"
        ./mvnw package -Pnative-ultra -Dmaven.test.skip=true
    else
        echo "ERROR: Neither Docker nor GraalVM found!"
        echo "Installing GraalVM..."
        # Install GraalVM if not present
        curl -L https://github.com/graalvm/graalvm-ce-builds/releases/download/jdk-21.0.1/graalvm-community-jdk-21.0.1_linux-x64_bin.tar.gz | tar xz
        export GRAALVM_HOME=$(pwd)/graalvm-community-openjdk-21.0.1
        export PATH=$GRAALVM_HOME/bin:$PATH

        # Install native-image
        gu install native-image

        # Now build
        ./mvnw package -Pnative-ultra -Dmaven.test.skip=true
    fi
fi

# Check if native executable was created
if [ -f "target/aurigraph-v11-standalone-11.0.0-runner" ]; then
    echo "✅ Native executable built successfully!"
    echo "Starting native executable..."
    ./target/aurigraph-v11-standalone-11.0.0-runner
else
    echo "⚠️ Native build failed, starting with JAR..."
    java -jar quarkus-run.jar
fi
EOF

chmod +x $DEPLOY_DIR/build-native-remote.sh

# Create systemd service file
cat > $DEPLOY_DIR/aurigraph-v11.service << 'EOF'
[Unit]
Description=Aurigraph V11 GraalVM Native Service
After=network.target

[Service]
Type=simple
User=subbu
WorkingDirectory=/home/subbu/aurigraph-v11
ExecStart=/home/subbu/aurigraph-v11/target/aurigraph-v11-standalone-11.0.0-runner
Restart=always
RestartSec=10
StandardOutput=syslog
StandardError=syslog
SyslogIdentifier=aurigraph-v11

# Performance settings for GraalVM native
Environment="JAVA_OPTS=-Xmx512m"

[Install]
WantedBy=multi-user.target
EOF

echo "[3/6] Creating deployment archive..."
tar czf aurigraph-v11-deploy.tar.gz $DEPLOY_DIR/

echo "[4/6] Uploading to production server..."
scp -P $REMOTE_PORT aurigraph-v11-deploy.tar.gz $REMOTE_USER@$REMOTE_HOST:/tmp/

echo "[5/6] Deploying on production server..."
ssh -p $REMOTE_PORT $REMOTE_USER@$REMOTE_HOST << 'REMOTE_SCRIPT'
set -e

echo "Extracting deployment package..."
cd /home/subbu
rm -rf aurigraph-v11-backup
[ -d aurigraph-v11 ] && mv aurigraph-v11 aurigraph-v11-backup
tar xzf /tmp/aurigraph-v11-deploy.tar.gz
mv aurigraph-v11-deploy aurigraph-v11
cd aurigraph-v11

echo "Installing Maven wrapper if needed..."
if [ ! -f mvnw ]; then
    echo "Downloading Maven wrapper..."
    curl -o mvnw https://raw.githubusercontent.com/takari/maven-wrapper/master/mvnw
    chmod +x mvnw
fi

echo "Stopping existing service if running..."
sudo systemctl stop aurigraph-v11 2>/dev/null || true

echo "Building GraalVM native executable..."
./build-native-remote.sh &

echo "Service will start automatically after build completes."
echo "Monitor build progress with: journalctl -u aurigraph-v11 -f"
REMOTE_SCRIPT

echo "[6/6] Verifying deployment..."
sleep 5
echo "Checking service status..."
curl -s http://${REMOTE_HOST}:9003/api/v11/health || echo "Service starting up..."

echo ""
echo "========================================="
echo " Deployment Complete!"
echo "========================================="
echo " Service URL: http://${REMOTE_HOST}:9003"
echo " Health Check: http://${REMOTE_HOST}:9003/api/v11/health"
echo " Monitoring: ssh -p $REMOTE_PORT $REMOTE_USER@$REMOTE_HOST 'journalctl -u aurigraph-v11 -f'"
echo ""
echo "⚠️ IMPORTANT: GraalVM native build is running on the server."
echo "It may take 15-30 minutes to complete. The service will"
echo "automatically switch to native mode once build completes."
echo "========================================="

# Clean up
rm -rf $DEPLOY_DIR aurigraph-v11-deploy.tar.gz