#!/bin/bash
# V11.3.0 Deployment Script
# Date: October 15, 2025
# Purpose: Deploy V11.3.0 with configuration fix

set -e  # Exit on error

echo "=== Aurigraph V11.3.0 Deployment Script ==="
echo "Timestamp: $(date)"
echo ""

# Configuration
REMOTE_USER="subbu"
REMOTE_HOST="dlt.aurigraph.io"
REMOTE_PORT="22"
DEPLOY_DIR="/opt/aurigraph/backend"
BUILD_DIR="/home/subbu/aurigraph-build/Aurigraph-DLT/aurigraph-av10-7/aurigraph-v11-standalone"
JAR_NAME="aurigraph-v11-standalone-11.3.0-runner.jar"
SERVICE_PORT="9003"

echo "Step 1: Finding current process..."
CURRENT_PID=$(sshpass -p 'subbuFuture@2025' ssh -o StrictHostKeyChecking=no -p ${REMOTE_PORT} ${REMOTE_USER}@${REMOTE_HOST} \
  "ps aux | grep 'aurigraph-v11-standalone.*runner.jar' | grep -v grep | awk '{print \$2}'" || echo "")

if [ -n "$CURRENT_PID" ]; then
  echo "Found running process: PID $CURRENT_PID"
  echo "Step 2: Stopping current process..."
  sshpass -p 'subbuFuture@2025' ssh -o StrictHostKeyChecking=no -p ${REMOTE_PORT} ${REMOTE_USER}@${REMOTE_HOST} \
    "kill -15 $CURRENT_PID && sleep 2"
  echo "Process stopped gracefully"
else
  echo "No running process found"
fi

echo "Step 3: Backing up current JAR..."
sshpass -p 'subbuFuture@2025' ssh -o StrictHostKeyChecking=no -p ${REMOTE_PORT} ${REMOTE_USER}@${REMOTE_HOST} \
  "if [ -f ${DEPLOY_DIR}/aurigraph-v11-standalone-*-runner.jar ]; then \
     mv ${DEPLOY_DIR}/aurigraph-v11-standalone-*-runner.jar ${DEPLOY_DIR}/aurigraph-v11-backup-\$(date +%Y%m%d-%H%M%S).jar; \
   fi"
echo "Backup completed"

echo "Step 4: Copying new V11.3.0 JAR..."
sshpass -p 'subbuFuture@2025' ssh -o StrictHostKeyChecking=no -p ${REMOTE_PORT} ${REMOTE_USER}@${REMOTE_HOST} \
  "cp ${BUILD_DIR}/target/${JAR_NAME} ${DEPLOY_DIR}/${JAR_NAME}"
echo "JAR copied successfully"

echo "Step 5: Setting permissions..."
sshpass -p 'subbuFuture@2025' ssh -o StrictHostKeyChecking=no -p ${REMOTE_PORT} ${REMOTE_USER}@${REMOTE_HOST} \
  "chmod +x ${DEPLOY_DIR}/${JAR_NAME}"
echo "Permissions set"

echo "Step 6: Starting V11.3.0..."
sshpass -p 'subbuFuture@2025' ssh -o StrictHostKeyChecking=no -p ${REMOTE_PORT} ${REMOTE_USER}@${REMOTE_HOST} \
  "cd /opt/aurigraph && \
   nohup java -Xms512m -Xmx2g -XX:+UseG1GC -XX:MaxGCPauseMillis=100 \
   -Dquarkus.http.port=${SERVICE_PORT} \
   -Dquarkus.http.ssl.certificate.key-store-password=password \
   -jar ${DEPLOY_DIR}/${JAR_NAME} > logs/aurigraph-v11.log 2>&1 &"
echo "V11.3.0 started"

echo "Step 7: Waiting for startup..."
sleep 5

echo "Step 8: Checking process status..."
NEW_PID=$(sshpass -p 'subbuFuture@2025' ssh -o StrictHostKeyChecking=no -p ${REMOTE_PORT} ${REMOTE_USER}@${REMOTE_HOST} \
  "ps aux | grep 'aurigraph-v11-standalone.*runner.jar' | grep -v grep | awk '{print \$2}'" || echo "")

if [ -n "$NEW_PID" ]; then
  echo "✅ V11.3.0 is running! PID: $NEW_PID"
else
  echo "❌ V11.3.0 failed to start"
  echo "Checking logs..."
  sshpass -p 'subbuFuture@2025' ssh -o StrictHostKeyChecking=no -p ${REMOTE_PORT} ${REMOTE_USER}@${REMOTE_HOST} \
    "tail -50 /opt/aurigraph/logs/aurigraph-v11.log"
  exit 1
fi

echo ""
echo "Step 9: Testing health endpoint..."
sleep 10
sshpass -p 'subbuFuture@2025' ssh -o StrictHostKeyChecking=no -p ${REMOTE_PORT} ${REMOTE_USER}@${REMOTE_HOST} \
  "curl -s http://localhost:${SERVICE_PORT}/api/v11/health | jq '.' || curl -s http://localhost:${SERVICE_PORT}/api/v11/health"

echo ""
echo "=== Deployment Complete ==="
echo "V11.3.0 is now running on https://dlt.aurigraph.io:8443"
echo "Health: https://dlt.aurigraph.io:8443/api/v11/health"
echo "PID: $NEW_PID"
echo ""
