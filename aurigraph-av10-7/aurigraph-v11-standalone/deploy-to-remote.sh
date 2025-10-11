#!/bin/bash

# Deployment script for Aurigraph V11 to remote server
# Server: dlt.aurigraph.io
# Port: 2235 (SSH), 9003 (HTTP)

set -e  # Exit on error

# Configuration
REMOTE_USER="subbu"
REMOTE_HOST="dlt.aurigraph.io"
REMOTE_PORT="22"
REMOTE_PASSWORD="subbuFuture@2025"
REMOTE_DIR="/home/subbu/aurigraph-v11"
LOCAL_JAR="target/aurigraph-v11-standalone-11.1.0-runner.jar"
SERVICE_NAME="aurigraph-v11"

echo "🚀 Aurigraph V11 Deployment Script"
echo "=================================="
echo "Target: ${REMOTE_USER}@${REMOTE_HOST}:${REMOTE_PORT}"
echo "Service: ${SERVICE_NAME}"
echo ""

# Check if JAR exists
if [ ! -f "$LOCAL_JAR" ]; then
    echo "❌ Error: JAR file not found at $LOCAL_JAR"
    echo "Please run: ./mvnw clean package -DskipTests -Dquarkus.package.jar.type=uber-jar"
    exit 1
fi

echo "✅ Found JAR: $LOCAL_JAR ($(ls -lh $LOCAL_JAR | awk '{print $5}'))"
echo ""

# Create deployment script for remote execution
cat > /tmp/deploy-v11.sh <<'DEPLOY_SCRIPT'
#!/bin/bash

# Remote deployment commands
REMOTE_DIR="/home/subbu/aurigraph-v11"
SERVICE_NAME="aurigraph-v11"

echo "📦 Setting up deployment directory..."
mkdir -p $REMOTE_DIR
cd $REMOTE_DIR

echo "🛑 Stopping existing service (if running)..."
pkill -f "aurigraph-v11-standalone.*runner.jar" || echo "No existing service found"
sleep 2

echo "🗑️  Removing old JAR..."
rm -f aurigraph-v11-standalone-*.jar

echo "✅ Deployment directory ready"
DEPLOY_SCRIPT

chmod +x /tmp/deploy-v11.sh

echo "🔧 Step 1: Preparing remote server..."

# Use sshpass to automate password authentication
if ! command -v sshpass &> /dev/null; then
    echo "⚠️  sshpass not found. Installing via homebrew..."
    brew install sshpass || {
        echo "❌ Failed to install sshpass. Please install it manually:"
        echo "   brew install sshpass"
        exit 1
    }
fi

# Execute remote preparation
sshpass -p "$REMOTE_PASSWORD" ssh -p $REMOTE_PORT -o StrictHostKeyChecking=no \
    ${REMOTE_USER}@${REMOTE_HOST} 'bash -s' < /tmp/deploy-v11.sh

echo "✅ Remote server prepared"
echo ""

echo "📤 Step 2: Uploading JAR to remote server..."
sshpass -p "$REMOTE_PASSWORD" scp -P $REMOTE_PORT -o StrictHostKeyChecking=no \
    $LOCAL_JAR ${REMOTE_USER}@${REMOTE_HOST}:${REMOTE_DIR}/

echo "✅ JAR uploaded successfully"
echo ""

echo "🚀 Step 3: Starting Aurigraph V11 service..."

# Create startup script
cat > /tmp/start-v11.sh <<'START_SCRIPT'
#!/bin/bash

cd /home/subbu/aurigraph-v11

# Find the JAR file
JAR_FILE=$(ls -1 aurigraph-v11-standalone-*.jar | head -1)

if [ -z "$JAR_FILE" ]; then
    echo "❌ Error: JAR file not found"
    exit 1
fi

echo "🚀 Starting Aurigraph V11..."
echo "JAR: $JAR_FILE"

# Start service in background with nohup
nohup java -Xms512m -Xmx2g \
    -Dquarkus.http.host=0.0.0.0 \
    -Dquarkus.http.port=9003 \
    -jar $JAR_FILE \
    > aurigraph-v11.log 2>&1 &

SERVICE_PID=$!
echo "✅ Service started with PID: $SERVICE_PID"

# Wait a few seconds for startup
sleep 5

# Check if service is running
if ps -p $SERVICE_PID > /dev/null; then
    echo "✅ Service is running"

    # Test health endpoint
    echo "🏥 Testing health endpoint..."
    sleep 3
    curl -s http://localhost:9003/q/health || echo "Health check pending..."
else
    echo "❌ Service failed to start"
    echo "Last 20 lines of log:"
    tail -20 aurigraph-v11.log
    exit 1
fi

echo ""
echo "📊 Service Status:"
echo "PID: $SERVICE_PID"
echo "Port: 9003"
echo "Log: ~/aurigraph-v11/aurigraph-v11.log"
START_SCRIPT

chmod +x /tmp/start-v11.sh

# Execute startup on remote
sshpass -p "$REMOTE_PASSWORD" ssh -p $REMOTE_PORT -o StrictHostKeyChecking=no \
    ${REMOTE_USER}@${REMOTE_HOST} 'bash -s' < /tmp/start-v11.sh

echo ""
echo "✅ Step 4: Verifying deployment..."

sleep 5

# Test remote endpoints
echo "🧪 Testing API endpoints..."
echo ""

echo "1. Health Check:"
sshpass -p "$REMOTE_PASSWORD" ssh -p $REMOTE_PORT -o StrictHostKeyChecking=no \
    ${REMOTE_USER}@${REMOTE_HOST} "curl -s http://localhost:9003/q/health" || echo "Pending..."

echo ""
echo "2. System Info:"
sshpass -p "$REMOTE_PASSWORD" ssh -p $REMOTE_PORT -o StrictHostKeyChecking=no \
    ${REMOTE_USER}@${REMOTE_HOST} "curl -s http://localhost:9003/api/v11/info | head -20" || echo "Pending..."

echo ""
echo "🎉 Deployment Complete!"
echo "====================="
echo ""
echo "📡 Access URLs:"
echo "   Health:        http://${REMOTE_HOST}:9003/q/health"
echo "   System Info:   http://${REMOTE_HOST}:9003/api/v11/info"
echo "   Swagger UI:    http://${REMOTE_HOST}:9003/q/swagger-ui"
echo "   Bridge Status: http://${REMOTE_HOST}:9003/api/v11/bridge/status"
echo "   Bridge History: http://${REMOTE_HOST}:9003/api/v11/bridge/history"
echo ""
echo "📝 View Logs:"
echo "   ssh -p ${REMOTE_PORT} ${REMOTE_USER}@${REMOTE_HOST}"
echo "   tail -f ~/aurigraph-v11/aurigraph-v11.log"
echo ""
echo "🛑 Stop Service:"
echo "   ssh -p ${REMOTE_PORT} ${REMOTE_USER}@${REMOTE_HOST}"
echo "   pkill -f 'aurigraph-v11-standalone.*runner.jar'"
echo ""
