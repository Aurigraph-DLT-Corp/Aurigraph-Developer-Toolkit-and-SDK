#!/bin/bash
# ============================================
# Aurigraph V12 gRPC-Web Proxy Startup Script
# ============================================
#
# This script starts the Envoy proxy for gRPC-Web transcoding.
# Browser clients can then consume gRPC streaming services.
#
# Usage:
#   ./scripts/start-grpc-web-proxy.sh [local|docker]
#
# Options:
#   local  - Start Envoy directly (requires envoy installed)
#   docker - Start Envoy in Docker container (default)
#
# Prerequisites:
#   Local:  brew install envoy (macOS) or apt install envoy (Linux)
#   Docker: Docker installed and running
#
# Endpoints after startup:
#   - gRPC-Web HTTP:  http://localhost:8080
#   - gRPC-Web HTTPS: https://localhost:8443
#   - Envoy Admin:    http://localhost:9901

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
ENVOY_CONFIG_DIR="$PROJECT_DIR/config/envoy"

MODE="${1:-docker}"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

log_header() {
    echo -e "\n${BLUE}========================================${NC}"
    echo -e "${BLUE}$1${NC}"
    echo -e "${BLUE}========================================${NC}\n"
}

check_grpc_server() {
    log_info "Checking if Quarkus gRPC server is running on port 9001..."

    if nc -z localhost 9001 2>/dev/null; then
        log_info "gRPC server is running on port 9001"
        return 0
    else
        log_warn "gRPC server not detected on port 9001"
        log_warn "Start Quarkus with: ./mvnw quarkus:dev"
        return 1
    fi
}

start_local() {
    log_header "Starting Envoy Proxy (Local Mode)"

    # Check if envoy is installed
    if ! command -v envoy &> /dev/null; then
        log_error "Envoy is not installed"
        log_info "Install with: brew install envoy (macOS) or apt install envoy (Linux)"
        exit 1
    fi

    # Check if gRPC server is running
    check_grpc_server || true

    # Check if port 8080 is already in use
    if nc -z localhost 8080 2>/dev/null; then
        log_error "Port 8080 is already in use"
        log_info "Stop the existing process or use a different port"
        exit 1
    fi

    log_info "Starting Envoy with local configuration..."
    log_info "Config: $ENVOY_CONFIG_DIR/envoy-local.yaml"

    cd "$PROJECT_DIR"
    envoy -c "$ENVOY_CONFIG_DIR/envoy-local.yaml" --log-level info
}

start_docker() {
    log_header "Starting Envoy Proxy (Docker Mode)"

    # Check if Docker is running
    if ! docker info &> /dev/null; then
        log_error "Docker is not running"
        log_info "Start Docker Desktop or docker service"
        exit 1
    fi

    # Check if gRPC server is running
    check_grpc_server || true

    # Stop existing container if running
    if docker ps -q -f name=aurigraph-envoy-grpc-web 2>/dev/null | grep -q .; then
        log_info "Stopping existing Envoy container..."
        docker stop aurigraph-envoy-grpc-web
        docker rm aurigraph-envoy-grpc-web
    fi

    log_info "Starting Envoy container..."

    # For local development, use host network to access localhost:9001
    docker run -d \
        --name aurigraph-envoy-grpc-web \
        --network host \
        -v "$ENVOY_CONFIG_DIR/envoy-local.yaml:/etc/envoy/envoy.yaml:ro" \
        envoyproxy/envoy:v1.29.1 \
        /usr/local/bin/envoy -c /etc/envoy/envoy.yaml --log-level info

    log_info "Envoy container started"

    # Wait for Envoy to be ready
    log_info "Waiting for Envoy to be ready..."
    sleep 3

    # Check health
    if curl -s http://localhost:9901/ready | grep -q "LIVE"; then
        log_info "Envoy is ready!"
    else
        log_warn "Envoy may not be fully ready yet"
    fi
}

show_status() {
    log_header "gRPC-Web Proxy Status"

    echo -e "gRPC-Web Endpoints:"
    echo -e "  ${GREEN}HTTP:${NC}  http://localhost:8080"
    echo -e "  ${GREEN}HTTPS:${NC} https://localhost:8443 (requires TLS certs)"
    echo ""
    echo -e "Envoy Admin:"
    echo -e "  ${GREEN}Admin:${NC} http://localhost:9901"
    echo ""
    echo -e "gRPC Streaming Services Available:"
    echo -e "  - io.aurigraph.v11.proto.MetricsStreamService"
    echo -e "  - io.aurigraph.v11.proto.ConsensusStreamService"
    echo -e "  - io.aurigraph.v11.proto.NetworkStreamService"
    echo -e "  - io.aurigraph.v11.proto.ValidatorStreamService"
    echo -e "  - io.aurigraph.v11.proto.ChannelStreamService"
    echo -e "  - io.aurigraph.v11.proto.AnalyticsStreamService"
    echo ""
    echo -e "Test with grpcurl:"
    echo -e "  ${YELLOW}grpcurl -plaintext localhost:9001 list${NC}"
    echo ""
    echo -e "Test gRPC-Web with curl:"
    echo -e "  ${YELLOW}curl -v http://localhost:8080/io.aurigraph.v11.proto.MetricsStreamService/GetCurrentMetrics${NC}"
}

# Main
case "$MODE" in
    local)
        start_local
        ;;
    docker)
        start_docker
        show_status
        ;;
    status)
        show_status
        ;;
    stop)
        log_info "Stopping Envoy container..."
        docker stop aurigraph-envoy-grpc-web 2>/dev/null || true
        docker rm aurigraph-envoy-grpc-web 2>/dev/null || true
        log_info "Envoy container stopped"
        ;;
    *)
        echo "Usage: $0 [local|docker|status|stop]"
        echo ""
        echo "Options:"
        echo "  local  - Start Envoy directly (requires envoy installed)"
        echo "  docker - Start Envoy in Docker container (default)"
        echo "  status - Show proxy status and endpoints"
        echo "  stop   - Stop Docker container"
        exit 1
        ;;
esac
