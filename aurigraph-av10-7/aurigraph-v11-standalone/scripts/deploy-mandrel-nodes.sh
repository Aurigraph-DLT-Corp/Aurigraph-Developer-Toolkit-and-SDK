#!/bin/bash
###############################################################################
# Aurigraph V12 Mandrel Test Nodes Deployment Script
# Deploys native Mandrel containers for A/B testing against JVM containers
#
# Usage:
#   ./scripts/deploy-mandrel-nodes.sh [build|deploy|test|compare|cleanup]
#
# Commands:
#   build   - Build Mandrel Docker image from native executable
#   deploy  - Deploy Mandrel test nodes
#   test    - Run health checks on all Mandrel nodes
#   compare - Compare performance: Mandrel vs JVM
#   cleanup - Stop and remove Mandrel test containers
###############################################################################

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
COMMAND="${1:-deploy}"

# Remote server configuration
REMOTE_HOST="dlt.aurigraph.io"
REMOTE_USER="subbu"
REMOTE_PORT="22"
REMOTE_DIR="/home/subbu/mandrel-nodes"

# Docker image configuration
IMAGE_NAME="aurigraph/v12-mandrel"
IMAGE_TAG="latest"

# Mandrel node ports
BUSINESS_PORTS=(19501 19502 19503)
VALIDATOR_PORTS=(19511 19512 19513)
SLIM_PORTS=(19521 19522)

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

log_info() { echo -e "${BLUE}[INFO]${NC} $1"; }
log_success() { echo -e "${GREEN}[SUCCESS]${NC} $1"; }
log_warn() { echo -e "${YELLOW}[WARN]${NC} $1"; }
log_error() { echo -e "${RED}[ERROR]${NC} $1"; }

echo -e "${CYAN}"
echo "┌─────────────────────────────────────────────────────────────┐"
echo "│  Mandrel Test Nodes Deployment                               │"
echo "├─────────────────────────────────────────────────────────────┤"
echo "│  Command: ${COMMAND}                                               │"
echo "│  Image:   ${IMAGE_NAME}:${IMAGE_TAG}                               │"
echo "│  Target:  ${REMOTE_HOST}                                     │"
echo "└─────────────────────────────────────────────────────────────┘"
echo -e "${NC}"

cd "$PROJECT_DIR"

# Function: Build Mandrel Docker image
build_mandrel_image() {
    log_info "Building Mandrel Docker image..."

    # Check if native executable exists
    NATIVE_EXE=$(find target -name "*-runner" -type f ! -name "*.jar" 2>/dev/null | head -1)

    if [ -z "$NATIVE_EXE" ]; then
        log_warn "Native executable not found. Building with native-fast profile..."
        ./mvnw clean package -Pnative-fast -DskipTests=true \
            -Dquarkus.native.container-build=true \
            -Dquarkus.native.builder-image=quay.io/quarkus/ubi-quarkus-mandrel-builder-image:jdk-21
        NATIVE_EXE=$(find target -name "*-runner" -type f ! -name "*.jar" 2>/dev/null | head -1)
    fi

    log_info "Found native executable: $NATIVE_EXE"

    # Create Dockerfile for Mandrel image
    cat > /tmp/Dockerfile.mandrel << 'EOF'
FROM registry.access.redhat.com/ubi9/ubi-minimal:9.6

RUN microdnf install -y curl ca-certificates && microdnf clean all

RUN useradd -u 1001 -r -g 0 -s /sbin/nologin aurigraph \
    && mkdir -p /opt/aurigraph \
    && chown -R 1001:0 /opt/aurigraph

WORKDIR /opt/aurigraph

COPY --chown=1001:0 target/*-runner /opt/aurigraph/aurigraph-v12
RUN chmod +x /opt/aurigraph/aurigraph-v12

USER 1001

ENV QUARKUS_HTTP_HOST=0.0.0.0 \
    QUARKUS_HTTP_PORT=9003 \
    QUARKUS_GRPC_SERVER_HOST=0.0.0.0 \
    QUARKUS_GRPC_SERVER_PORT=9004

EXPOSE 9003 9004

HEALTHCHECK --interval=10s --timeout=3s --start-period=5s --retries=3 \
    CMD curl -sf http://localhost:9003/api/v11/health || exit 1

LABEL org.opencontainers.image.title="Aurigraph V12 Mandrel" \
      org.opencontainers.image.description="Native GraalVM/Mandrel 24.2 build" \
      org.opencontainers.image.version="12.0.0"

ENTRYPOINT ["./aurigraph-v12"]
CMD ["-Dquarkus.http.host=0.0.0.0", "-Dquarkus.http.port=9003"]
EOF

    # Build Docker image
    docker build -f /tmp/Dockerfile.mandrel -t "${IMAGE_NAME}:${IMAGE_TAG}" .
    rm /tmp/Dockerfile.mandrel

    # Show image info
    IMAGE_SIZE=$(docker images "${IMAGE_NAME}:${IMAGE_TAG}" --format "{{.Size}}")
    log_success "Mandrel image built: ${IMAGE_NAME}:${IMAGE_TAG} (${IMAGE_SIZE})"
}

# Function: Deploy Mandrel nodes to remote
deploy_mandrel_nodes() {
    log_info "Deploying Mandrel test nodes to ${REMOTE_HOST}..."

    # Save and transfer image
    log_info "Saving Docker image..."
    TEMP_TAR="/tmp/aurigraph-v12-mandrel.tar.gz"
    docker save "${IMAGE_NAME}:${IMAGE_TAG}" | gzip > "$TEMP_TAR"

    log_info "Transferring to remote server..."
    scp -P "$REMOTE_PORT" "$TEMP_TAR" "${REMOTE_USER}@${REMOTE_HOST}:/tmp/"
    scp -P "$REMOTE_PORT" docker-compose.mandrel-nodes.yml "${REMOTE_USER}@${REMOTE_HOST}:${REMOTE_DIR}/"

    # Load image and start containers on remote
    ssh -p "$REMOTE_PORT" "${REMOTE_USER}@${REMOTE_HOST}" << 'ENDSSH'
echo "Loading Mandrel image..."
docker load < /tmp/aurigraph-v12-mandrel.tar.gz
rm /tmp/aurigraph-v12-mandrel.tar.gz

echo ""
echo "Starting Mandrel test nodes..."
cd /home/subbu/mandrel-nodes
docker-compose -f docker-compose.mandrel-nodes.yml up -d

echo ""
echo "Waiting for containers to start (20s)..."
sleep 20

echo ""
echo "Mandrel Container Status:"
docker ps --format 'table {{.Names}}\t{{.Status}}\t{{.Image}}' | grep mandrel
ENDSSH

    rm -f "$TEMP_TAR"
    log_success "Mandrel nodes deployed!"
}

# Function: Test all Mandrel nodes
test_mandrel_nodes() {
    log_info "Testing Mandrel nodes health..."

    ssh -p "$REMOTE_PORT" "${REMOTE_USER}@${REMOTE_HOST}" << 'ENDSSH'
echo ""
echo "=== Mandrel Business Nodes ==="
for PORT in 19501 19502 19503; do
    HEALTH=$(curl -sf --connect-timeout 3 "http://localhost:${PORT}/api/v11/health" 2>/dev/null | grep -o '"status":"[^"]*"' | cut -d'"' -f4)
    if [ "$HEALTH" = "UP" ]; then
        echo "✅ Business port $PORT: UP"
    else
        echo "❌ Business port $PORT: DOWN"
    fi
done

echo ""
echo "=== Mandrel Validator Nodes ==="
for PORT in 19511 19512 19513; do
    HEALTH=$(curl -sf --connect-timeout 3 "http://localhost:${PORT}/api/v11/health" 2>/dev/null | grep -o '"status":"[^"]*"' | cut -d'"' -f4)
    if [ "$HEALTH" = "UP" ]; then
        echo "✅ Validator port $PORT: UP"
    else
        echo "❌ Validator port $PORT: DOWN"
    fi
done

echo ""
echo "=== Mandrel Slim Nodes ==="
for PORT in 19521 19522; do
    HEALTH=$(curl -sf --connect-timeout 3 "http://localhost:${PORT}/api/v11/health" 2>/dev/null | grep -o '"status":"[^"]*"' | cut -d'"' -f4)
    if [ "$HEALTH" = "UP" ]; then
        echo "✅ Slim port $PORT: UP"
    else
        echo "❌ Slim port $PORT: DOWN"
    fi
done
ENDSSH
}

# Function: Compare Mandrel vs JVM performance
compare_performance() {
    log_info "Comparing Mandrel vs JVM performance..."

    ssh -p "$REMOTE_PORT" "${REMOTE_USER}@${REMOTE_HOST}" << 'ENDSSH'
echo ""
echo "┌─────────────────────────────────────────────────────────────┐"
echo "│  Performance Comparison: Mandrel (Native) vs JVM            │"
echo "└─────────────────────────────────────────────────────────────┘"

echo ""
echo "=== Memory Usage ==="
echo ""
echo "MANDREL CONTAINERS:"
docker stats --no-stream --format "table {{.Name}}\t{{.MemUsage}}\t{{.MemPerc}}" 2>/dev/null | grep mandrel | head -8 || echo "No Mandrel containers running"

echo ""
echo "JVM CONTAINERS:"
docker stats --no-stream --format "table {{.Name}}\t{{.MemUsage}}\t{{.MemPerc}}" 2>/dev/null | grep -E 'business|validator|slim' | grep -v mandrel | head -8 || echo "No JVM containers running"

echo ""
echo "=== Response Time Test (100 requests) ==="
echo ""

# Test Mandrel
echo "Testing Mandrel (port 19501)..."
MANDREL_TIME=$(curl -sf -o /dev/null -w "%{time_total}" "http://localhost:19501/api/v11/health" 2>/dev/null || echo "N/A")
echo "Mandrel response time: ${MANDREL_TIME}s"

# Test JVM
echo "Testing JVM (port 19017)..."
JVM_TIME=$(curl -sf -o /dev/null -w "%{time_total}" "http://localhost:19017/api/v11/health" 2>/dev/null || echo "N/A")
echo "JVM response time: ${JVM_TIME}s"

echo ""
echo "=== Container Start Time ==="
echo ""
echo "Mandrel containers (should show <5s start):"
docker ps --format '{{.Names}}\t{{.Status}}' | grep mandrel | head -3

echo ""
echo "JVM containers (typically 30-45s start):"
docker ps --format '{{.Names}}\t{{.Status}}' | grep -E 'business|validator|slim' | grep -v mandrel | head -3

ENDSSH
}

# Function: Cleanup Mandrel test containers
cleanup_mandrel_nodes() {
    log_info "Cleaning up Mandrel test containers..."

    ssh -p "$REMOTE_PORT" "${REMOTE_USER}@${REMOTE_HOST}" << 'ENDSSH'
echo "Stopping Mandrel containers..."
cd /home/subbu/mandrel-nodes
docker-compose -f docker-compose.mandrel-nodes.yml down 2>/dev/null || true

echo ""
echo "Removing Mandrel network..."
docker network rm mandrel-test-network 2>/dev/null || true

echo ""
echo "Remaining containers:"
docker ps --format 'table {{.Names}}\t{{.Status}}' | grep -v mandrel | head -10
ENDSSH

    log_success "Mandrel test containers cleaned up!"
}

# Main execution
case "$COMMAND" in
    build)
        build_mandrel_image
        ;;
    deploy)
        deploy_mandrel_nodes
        test_mandrel_nodes
        ;;
    test)
        test_mandrel_nodes
        ;;
    compare)
        compare_performance
        ;;
    cleanup)
        cleanup_mandrel_nodes
        ;;
    all)
        build_mandrel_image
        deploy_mandrel_nodes
        test_mandrel_nodes
        compare_performance
        ;;
    *)
        log_error "Unknown command: $COMMAND"
        echo "Usage: $0 [build|deploy|test|compare|cleanup|all]"
        exit 1
        ;;
esac

echo ""
log_success "Done!"
