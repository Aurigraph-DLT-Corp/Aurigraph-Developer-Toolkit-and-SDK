#!/bin/bash
#
# Aurigraph V12 Remote Server Deployment Script
# Deploys multi-node architecture (5 validators, 3 business, 3 EI nodes)
#
# Usage: ./deploy-to-remote.sh [deploy_mode]
#   deploy_mode: rolling | full-restart | validators-only | business-only | ei-only
#

set -e

# Configuration
REMOTE_HOST="dlt.aurigraph.io"
REMOTE_USER="subbu"
REMOTE_PORT="22"
REMOTE_DIR="/home/subbu/aurigraph-v12"
DOCKER_NETWORK="nodes_aurigraph-network"
DB_URL="jdbc:postgresql://172.28.0.1:5432/j4c_db"
DB_USER="j4c_user"
DB_PASS="j4c_password"

# Script location
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log_info() { echo -e "${BLUE}[INFO]${NC} $1"; }
log_success() { echo -e "${GREEN}[SUCCESS]${NC} $1"; }
log_warn() { echo -e "${YELLOW}[WARN]${NC} $1"; }
log_error() { echo -e "${RED}[ERROR]${NC} $1"; }

# Deployment mode (default: rolling)
DEPLOY_MODE="${1:-rolling}"

echo ""
echo "============================================="
echo "  Aurigraph V12 Remote Deployment"
echo "============================================="
echo "Target: $REMOTE_USER@$REMOTE_HOST"
echo "Deploy Mode: $DEPLOY_MODE"
echo "Timestamp: $(date)"
echo "============================================="
echo ""

# Step 1: Build JAR
log_info "Building application..."
cd "$PROJECT_ROOT"

if [ -f "./mvnw" ]; then
    ./mvnw clean package -DskipTests -q
else
    mvn clean package -DskipTests -q
fi

JAR_PATH="target/quarkus-app/quarkus-run.jar"
if [ ! -f "$JAR_PATH" ]; then
    log_error "JAR not found at $JAR_PATH"
    exit 1
fi
log_success "Build complete"

# Step 2: Create deployment package
log_info "Creating deployment package..."
cd target/quarkus-app
tar -czf ../aurigraph-v12-deploy.tar.gz .
cd "$PROJECT_ROOT"
log_success "Package created"

# Step 3: Upload to remote server
log_info "Uploading to remote server..."
scp -P "$REMOTE_PORT" -o StrictHostKeyChecking=no \
    target/aurigraph-v12-deploy.tar.gz \
    "$REMOTE_USER@$REMOTE_HOST:$REMOTE_DIR/"
log_success "Upload complete"

# Step 4: Deploy on remote server
log_info "Deploying on remote server..."
ssh -p "$REMOTE_PORT" -o StrictHostKeyChecking=no "$REMOTE_USER@$REMOTE_HOST" << DEPLOY_SCRIPT
set -e
echo "=== Remote Deployment Starting ==="

cd $REMOTE_DIR

# Backup current JAR
if [ -f "aurigraph-v12.jar" ]; then
    echo "Backing up current JAR..."
    cp aurigraph-v12.jar aurigraph-v12.jar.backup.\$(date +%Y%m%d_%H%M%S) || true
fi

# Extract new deployment
echo "Extracting deployment package..."
mkdir -p /tmp/quarkus-deploy
tar -xzf aurigraph-v12-deploy.tar.gz -C /tmp/quarkus-deploy/

# Copy files
cd /tmp/quarkus-deploy
cp quarkus-run.jar $REMOTE_DIR/aurigraph-v12.jar
cp -r lib $REMOTE_DIR/lib 2>/dev/null || true
cp -r quarkus $REMOTE_DIR/quarkus 2>/dev/null || true
cp -r app $REMOTE_DIR/app 2>/dev/null || true
rm -rf /tmp/quarkus-deploy
rm $REMOTE_DIR/aurigraph-v12-deploy.tar.gz

cd $REMOTE_DIR

# Function to deploy nodes
deploy_nodes() {
    local NODE_TYPE=\$1
    local COUNT=\$2
    local PORT_START=\$3
    local GRPC_START=\$4
    local MEM_XMS=\$5
    local MEM_XMX=\$6
    local MEM_LIMIT=\$7
    local METASPACE=\$8

    echo "Deploying \$COUNT \$NODE_TYPE nodes..."

    for i in \$(seq 1 \$COUNT); do
        local NAME="aurigraph-\${NODE_TYPE}-\$i"
        local PORT=\$((PORT_START + i - 1))
        local GRPC_PORT=\$((GRPC_START + i - 1))

        echo "  Deploying \$NAME on port \$PORT..."

        # Stop and remove existing container
        docker stop \$NAME 2>/dev/null || true
        docker rm \$NAME 2>/dev/null || true

        # Start new container
        docker run -d \\
            --name \$NAME \\
            --network $DOCKER_NETWORK \\
            --restart unless-stopped \\
            -p \$PORT:9003 \\
            -p \$GRPC_PORT:9004 \\
            -v $REMOTE_DIR/aurigraph-v12.jar:/app/aurigraph-v12.jar:ro \\
            -v $REMOTE_DIR/lib:/app/lib:ro \\
            -v $REMOTE_DIR/quarkus:/app/quarkus:ro \\
            -v $REMOTE_DIR/app:/app/app:ro \\
            -m \$MEM_LIMIT \\
            eclipse-temurin:21-jre-alpine \\
            java -Xms\$MEM_XMS -Xmx\$MEM_XMX -XX:+UseG1GC -XX:MaxMetaspaceSize=\$METASPACE \\
            -Dquarkus.http.port=9003 \\
            -Dquarkus.datasource.jdbc.url=$DB_URL \\
            -Dquarkus.datasource.username=$DB_USER \\
            -Dquarkus.datasource.password=$DB_PASS \\
            -Dquarkus.flyway.migrate-at-start=false \\
            -Dquarkus.flyway.enabled=false \\
            -Dquarkus.profile=\$NODE_TYPE \\
            -Dnode.type=\$NODE_TYPE \\
            -Dnode.id=\${NODE_TYPE}-\$i \\
            -jar /app/aurigraph-v12.jar

        echo "  \$NAME started"
    done
}

# Deploy based on mode
case "$DEPLOY_MODE" in
    "validators-only")
        deploy_nodes "validator" 5 19001 19101 "512m" "2g" "2500m" "256m"
        ;;
    "business-only")
        deploy_nodes "business" 3 19010 19110 "256m" "850m" "1200m" "192m"
        ;;
    "ei-only")
        deploy_nodes "ei" 3 19020 19120 "200m" "700m" "1024m" "180m"
        ;;
    "rolling"|"full-restart")
        deploy_nodes "validator" 5 19001 19101 "512m" "2g" "2500m" "256m"
        deploy_nodes "business" 3 19010 19110 "256m" "850m" "1200m" "192m"
        deploy_nodes "ei" 3 19020 19120 "200m" "700m" "1024m" "180m"
        ;;
esac

echo "Waiting for nodes to start (60s)..."
sleep 60

# Health check
echo "Running health checks..."
HEALTHY=0
TOTAL=0
for port in 19001 19002 19003 19004 19005 19010 19011 19012 19020 19021 19022; do
    TOTAL=\$((TOTAL + 1))
    STATUS=\$(curl -s -o /dev/null -w "%{http_code}" --max-time 10 http://localhost:\$port/q/health || echo "000")
    if [ "\$STATUS" = "200" ]; then
        echo "  Port \$port: OK"
        HEALTHY=\$((HEALTHY + 1))
    else
        echo "  Port \$port: FAILED (\$STATUS)"
    fi
done

echo ""
echo "=== Health Check Results ==="
echo "Healthy: \$HEALTHY/\$TOTAL"

# Cleanup old backups
ls -t aurigraph-v12.jar.backup.* 2>/dev/null | tail -n +4 | xargs rm -f 2>/dev/null || true

echo ""
echo "=== Container Status ==="
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}" | grep aurigraph | head -15

echo ""
echo "=== Deployment Complete ==="
DEPLOY_SCRIPT

# Step 5: Verify deployment
log_info "Verifying deployment..."
sleep 10

HEALTH_RESPONSE=$(curl -s --max-time 10 "https://$REMOTE_HOST/api/v12/info" 2>&1 || echo "TIMEOUT")

if echo "$HEALTH_RESPONSE" | grep -q "version"; then
    log_success "Deployment verified - API responding"
else
    log_warn "API verification needs attention"
fi

echo ""
echo "============================================="
echo "  Deployment Summary"
echo "============================================="
echo "Server: https://$REMOTE_HOST"
echo "Deploy Mode: $DEPLOY_MODE"
echo ""
echo "Endpoints:"
echo "  - Health: https://$REMOTE_HOST/q/health"
echo "  - Info: https://$REMOTE_HOST/api/v12/info"
echo "  - Composite Tokens: https://$REMOTE_HOST/api/v12/composite-tokens"
echo "  - Active Contracts: https://$REMOTE_HOST/api/v12/activecontracts"
echo ""
echo "Node Ports:"
echo "  - Validators: 19001-19005"
echo "  - Business: 19010-19012"
echo "  - EI (External Integration): 19020-19022"
echo "============================================="
log_success "Deployment complete!"
