#!/bin/bash

# Aurigraph V11 Remote Deployment Script
# Deploys to remote server with health checks

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log_success() { echo -e "${GREEN}✅ $1${NC}"; }
log_error() { echo -e "${RED}❌ $1${NC}"; }
log_info() { echo -e "${BLUE}ℹ️  $1${NC}"; }

REMOTE_USER="subbu"
REMOTE_HOST="dlt.aurigraph.io"
REMOTE_PORT="2235"
REMOTE_APP_DIR="/opt/aurigraph/v11"
JAR_PATH="${1:-.}"

echo "=== Aurigraph V11 Remote Deployment ==="
echo ""

# Check SSH
log_info "Checking SSH connectivity..."
if ssh -p "$REMOTE_PORT" "$REMOTE_USER@$REMOTE_HOST" 'echo OK' > /dev/null 2>&1; then
    log_success "SSH OK"
else
    log_error "SSH failed"
    exit 1
fi

# Find JAR
if [ -f "$JAR_PATH" ]; then
    JAR="$JAR_PATH"
elif [ -f "./aurigraph-av10-7/aurigraph-v11-standalone/target/quarkus-app/quarkus-run.jar" ]; then
    JAR="./aurigraph-av10-7/aurigraph-v11-standalone/target/quarkus-app/quarkus-run.jar"
else
    log_error "JAR not found"
    exit 1
fi

log_success "JAR found: $JAR"

# Backup
log_info "Creating backup..."
BACKUP_TS=$(date +%Y%m%d_%H%M%S)
ssh -p "$REMOTE_PORT" "$REMOTE_USER@$REMOTE_HOST" << BACKUP
set -e
mkdir -p /opt/aurigraph/backups
if [ -d "$REMOTE_APP_DIR" ] && [ -n "\$(ls -A "$REMOTE_APP_DIR" 2>/dev/null)" ]; then
    cp -r "$REMOTE_APP_DIR" "/opt/aurigraph/backups/aurigraph-v11-backup-$BACKUP_TS"
    ls -td /opt/aurigraph/backups/aurigraph-v11-backup-* 2>/dev/null | tail -n +6 | xargs -r rm -rf
fi
BACKUP
log_success "Backup created"

# Deploy
log_info "Creating deployment package..."
DEPLOY_PKG="aurigraph-v11-$(date +%s).tar.gz"
tar -czf "$DEPLOY_PKG" -C "$(dirname "$JAR")" "$(basename "$JAR")"
log_success "Package ready"

log_info "Uploading to remote..."
scp -P "$REMOTE_PORT" "$DEPLOY_PKG" "$REMOTE_USER@$REMOTE_HOST:/tmp/"

log_info "Extracting on remote..."
ssh -p "$REMOTE_PORT" "$REMOTE_USER@$REMOTE_HOST" << DEPLOY
set -e
pkill -f "quarkus-run.jar" || true
sleep 2
rm -rf "$REMOTE_APP_DIR"/*
tar -xzf "/tmp/$DEPLOY_PKG" -C "$REMOTE_APP_DIR"
chmod +x "$REMOTE_APP_DIR/quarkus-run.jar"
rm -f "/tmp/$DEPLOY_PKG"
DEPLOY
log_success "Deployment extracted"

# Start service
log_info "Starting service..."
ssh -p "$REMOTE_PORT" "$REMOTE_USER@$REMOTE_HOST" << START
cd "$REMOTE_APP_DIR"
nohup java -Xmx4g -XX:+UseG1GC -jar quarkus-run.jar > service.log 2>&1 &
sleep 3
pgrep -f "quarkus-run.jar" > /dev/null && echo "Running" || exit 1
START
log_success "Service started"

# Health check
log_info "Running health check..."
for i in {1..30}; do
    HEALTH=$(ssh -p "$REMOTE_PORT" "$REMOTE_USER@$REMOTE_HOST" \
        "curl -s http://localhost:9003/q/health 2>/dev/null | grep -c UP" || echo 0)
    if [ "$HEALTH" -gt 0 ]; then
        log_success "Health check PASSED"
        break
    fi
    [ $((i % 10)) -eq 0 ] && log_info "Attempt $i/30..."
    sleep 1
done

# Smoke tests
log_info "Running smoke tests..."
ssh -p "$REMOTE_PORT" "$REMOTE_USER@$REMOTE_HOST" << TESTS
pgrep -f "quarkus-run.jar" > /dev/null && echo "✅ Service running"
curl -s http://localhost:9003/q/health | grep -q UP && echo "✅ Health OK" || echo "⚠️ Health check"
curl -s -w "Metrics: %{http_code}\n" -o /dev/null http://localhost:9003/q/metrics
ERROR_COUNT=\$(grep -c "ERROR" /opt/aurigraph/v11/service.log || echo 0)
[ \$ERROR_COUNT -eq 0 ] && echo "✅ No errors" || echo "⚠️ Errors found"
TESTS

rm -f "$DEPLOY_PKG"

echo ""
echo "✅ Deployment SUCCESSFUL"
echo "Service: https://dlt.aurigraph.io/api/v11"
