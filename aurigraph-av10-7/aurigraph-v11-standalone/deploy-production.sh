#!/bin/bash
# Aurigraph V12 Production Deployment Script

set -e

# Configuration
REMOTE_HOST="dlt.aurigraph.io"
REMOTE_USER="subbu"
REMOTE_PASSWORD="subbuFuture@2025"
JAR_NAME="aurigraph-v12-standalone-12.0.0-runner.jar"

echo "========================================="
echo "Aurigraph V12 Production Deployment"
echo "========================================="

# Build if needed
if [ ! -f "target/$JAR_NAME" ]; then
    echo "Building JAR..."
    ./mvnw clean package -DskipTests -Dquarkus.package.jar.type=uber-jar
fi

echo "JAR Size: $(du -h target/$JAR_NAME | cut -f1)"

# Stop existing service
echo "Stopping existing service..."
sshpass -p "$REMOTE_PASSWORD" ssh "$REMOTE_USER@$REMOTE_HOST" "pkill -f aurigraph-v12 || true"
sleep 2

# Copy JAR
echo "Copying JAR to production..."
sshpass -p "$REMOTE_PASSWORD" scp "target/$JAR_NAME" "$REMOTE_USER@$REMOTE_HOST:/tmp/"

# Start service
echo "Starting service..."
sshpass -p "$REMOTE_PASSWORD" ssh "$REMOTE_USER@$REMOTE_HOST" << 'SSHEOF'
cd /tmp
nohup java -Xms512m -Xmx2g \
    -Dquarkus.http.port=9003 \
    -Dquarkus.flyway.migrate-at-start=false \
    -jar aurigraph-v12-standalone-12.0.0-runner.jar \
    > v12-production.log 2>&1 &
echo $! > aurigraph-v12.pid
echo "Service started with PID: $(cat aurigraph-v12.pid)"
SSHEOF

# Wait for service
echo "Waiting for service to be ready..."
sleep 10

# Verify
for i in {1..10}; do
    if curl -f http://$REMOTE_HOST:9003/q/health > /dev/null 2>&1; then
        echo "✅ Service is ready!"
        break
    fi
    echo "Attempt $i/10..."
    sleep 2
done

# Final check
curl -s http://$REMOTE_HOST:9003/q/health | jq '.'

echo ""
echo "========================================="
echo "✅ Deployment Complete!"
echo "========================================="
echo "Health: http://$REMOTE_HOST:9003/q/health"
echo "Info: http://$REMOTE_HOST:9003/api/v11/info"
