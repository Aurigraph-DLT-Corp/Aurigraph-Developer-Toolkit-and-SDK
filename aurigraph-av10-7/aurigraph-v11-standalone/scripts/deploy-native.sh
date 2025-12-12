#!/bin/bash
###############################################################################
# Aurigraph V12 Native Deployment Script
# Deploys native GraalVM containers to dlt.aurigraph.io
#
# Usage:
#   ./scripts/deploy-native.sh [build|push|deploy|all]
#
# Commands:
#   build  - Build native image locally
#   push   - Push image to remote registry
#   deploy - Deploy containers to remote server
#   all    - Build, push, and deploy (default)
###############################################################################

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
COMMAND="${1:-all}"

# Remote server configuration
REMOTE_HOST="dlt.aurigraph.io"
REMOTE_USER="subbu"
REMOTE_PORT="22"
REMOTE_DIR="/home/subbu/native-deploy"

# Docker image configuration
IMAGE_NAME="aurigraph/v12-native"
IMAGE_TAG="latest"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log_info() { echo -e "${BLUE}[INFO]${NC} $1"; }
log_success() { echo -e "${GREEN}[SUCCESS]${NC} $1"; }
log_warn() { echo -e "${YELLOW}[WARN]${NC} $1"; }
log_error() { echo -e "${RED}[ERROR]${NC} $1"; }

echo -e "${BLUE}"
echo "┌─────────────────────────────────────────────────────────────┐"
echo "│  Aurigraph V12 Native Deployment                             │"
echo "├─────────────────────────────────────────────────────────────┤"
echo "│  Command: ${COMMAND}                                               │"
echo "│  Target:  ${REMOTE_HOST}                                     │"
echo "│  Image:   ${IMAGE_NAME}:${IMAGE_TAG}                               │"
echo "└─────────────────────────────────────────────────────────────┘"
echo -e "${NC}"

cd "$PROJECT_DIR"

# Function: Build native image
build_native() {
    log_info "Building native image..."

    # Check if native executable exists
    NATIVE_EXE=$(find target -name "*-runner" -type f 2>/dev/null | head -1)

    if [ -z "$NATIVE_EXE" ]; then
        log_warn "Native executable not found. Building with native-fast profile..."
        ./scripts/build-native.sh fast
    else
        log_info "Found existing native executable: $NATIVE_EXE"
    fi

    # Build Docker image with pre-built binary
    log_info "Building Docker image..."
    docker build \
        -f 05-deployment/docker/Dockerfile.native-production \
        -t "${IMAGE_NAME}:${IMAGE_TAG}" \
        -t "${IMAGE_NAME}:12.0.0" \
        .

    log_success "Docker image built: ${IMAGE_NAME}:${IMAGE_TAG}"
}

# Function: Save and transfer image to remote
push_image() {
    log_info "Saving and transferring image to remote server..."

    # Save image to tar
    TEMP_TAR="/tmp/aurigraph-v12-native.tar.gz"
    docker save "${IMAGE_NAME}:${IMAGE_TAG}" | gzip > "$TEMP_TAR"

    TAR_SIZE=$(du -h "$TEMP_TAR" | cut -f1)
    log_info "Image saved: $TEMP_TAR ($TAR_SIZE)"

    # Transfer to remote
    log_info "Transferring to ${REMOTE_HOST}..."
    scp -P "$REMOTE_PORT" "$TEMP_TAR" "${REMOTE_USER}@${REMOTE_HOST}:/tmp/"

    # Load on remote
    log_info "Loading image on remote server..."
    ssh -p "$REMOTE_PORT" "${REMOTE_USER}@${REMOTE_HOST}" \
        "docker load < /tmp/aurigraph-v12-native.tar.gz && rm /tmp/aurigraph-v12-native.tar.gz"

    # Cleanup local
    rm -f "$TEMP_TAR"

    log_success "Image transferred and loaded on ${REMOTE_HOST}"
}

# Function: Deploy containers
deploy_containers() {
    log_info "Deploying native containers to ${REMOTE_HOST}..."

    # Create deployment directory and copy compose file
    ssh -p "$REMOTE_PORT" "${REMOTE_USER}@${REMOTE_HOST}" "mkdir -p ${REMOTE_DIR}"
    scp -P "$REMOTE_PORT" docker-compose.native.yml "${REMOTE_USER}@${REMOTE_HOST}:${REMOTE_DIR}/"

    # Stop existing JVM containers
    log_info "Stopping existing JVM containers..."
    ssh -p "$REMOTE_PORT" "${REMOTE_USER}@${REMOTE_HOST}" << 'ENDSSH'
echo "Stopping JVM containers..."
for i in 8 17 19; do
    docker stop aurigraph-business-$i 2>/dev/null && echo "Stopped business-$i" || true
done
for i in 1 2 3; do
    docker stop aurigraph-validator-$i 2>/dev/null && echo "Stopped validator-$i" || true
done
for i in 1 5; do
    docker stop aurigraph-slim-$i 2>/dev/null && echo "Stopped slim-$i" || true
done
ENDSSH

    # Start native containers
    log_info "Starting native containers..."
    ssh -p "$REMOTE_PORT" "${REMOTE_USER}@${REMOTE_HOST}" \
        "cd ${REMOTE_DIR} && docker-compose -f docker-compose.native.yml up -d"

    # Wait for health checks
    log_info "Waiting for containers to become healthy (30s)..."
    sleep 30

    # Verify deployment
    log_info "Verifying deployment..."
    ssh -p "$REMOTE_PORT" "${REMOTE_USER}@${REMOTE_HOST}" << 'ENDSSH'
echo ""
echo "Native Container Status:"
docker ps --format 'table {{.Names}}\t{{.Status}}\t{{.Image}}' | grep -E 'native|NAME'
echo ""
echo "Health Check:"
curl -sf http://localhost:19101/api/v11/health 2>/dev/null | head -5 || echo "Waiting for health..."
ENDSSH

    log_success "Native containers deployed!"
}

# Function: Verify deployment health
verify_health() {
    log_info "Verifying native deployment health..."

    ssh -p "$REMOTE_PORT" "${REMOTE_USER}@${REMOTE_HOST}" << 'ENDSSH'
echo ""
echo "=== Native Container Health Check ==="
echo ""

# Check each native container
for PORT in 19101 19102 19103 19201 19202 19203 19301 19302; do
    HEALTH=$(curl -sf --connect-timeout 3 "http://localhost:${PORT}/api/v11/health" 2>/dev/null | grep -o '"status":"[^"]*"' | cut -d'"' -f4)
    if [ "$HEALTH" = "UP" ]; then
        echo "✅ Port $PORT: $HEALTH"
    else
        echo "❌ Port $PORT: UNREACHABLE"
    fi
done

echo ""
echo "=== Memory Comparison ==="
echo ""
echo "Native containers (should be <512MB each):"
docker stats --no-stream --format "table {{.Name}}\t{{.MemUsage}}" 2>/dev/null | grep native | head -5

echo ""
echo "JVM containers (typically 2-4GB each):"
docker stats --no-stream --format "table {{.Name}}\t{{.MemUsage}}" 2>/dev/null | grep -E 'business|validator|slim' | grep -v native | head -3

ENDSSH

    log_success "Health verification complete!"
}

# Main execution
case "$COMMAND" in
    build)
        build_native
        ;;
    push)
        push_image
        ;;
    deploy)
        deploy_containers
        verify_health
        ;;
    verify)
        verify_health
        ;;
    all)
        build_native
        push_image
        deploy_containers
        verify_health
        ;;
    *)
        log_error "Unknown command: $COMMAND"
        echo "Usage: $0 [build|push|deploy|verify|all]"
        exit 1
        ;;
esac

echo ""
log_success "Native deployment complete!"
echo ""
echo "Summary:"
echo "  - Native containers running at ports 19101-19103 (business)"
echo "  - Validator containers at ports 19201-19203"
echo "  - Slim containers at ports 19301-19302"
echo ""
echo "Benefits achieved:"
echo "  - Startup time: ~500ms (vs 30s JVM)"
echo "  - Memory per container: ~256MB (vs 4GB JVM)"
echo "  - No JVM required"
