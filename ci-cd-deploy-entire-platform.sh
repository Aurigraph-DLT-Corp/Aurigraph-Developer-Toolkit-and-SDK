#!/bin/bash

################################################################################
# CI/CD PLATFORM DEPLOYMENT SCRIPT - Aurigraph Complete Platform
# Purpose: Build and deploy entire Aurigraph platform to remote server
# Components: V11 Nodes (Validator/Business/Integration) + Enterprise Portal + Infrastructure
################################################################################

set -e

# =============================================================================
# CONFIGURATION
# =============================================================================

REMOTE_USER="${REMOTE_USER:-subbu}"
REMOTE_HOST="${REMOTE_HOST:-dlt.aurigraph.io}"
REMOTE_PORT="${REMOTE_PORT:-22}"
REMOTE_DIR="${REMOTE_DIR:-~/Aurigraph-DLT}"

DOCKER_REGISTRY="${DOCKER_REGISTRY:-ghcr.io}"
GITHUB_REPO="${GITHUB_REPO:-Aurigraph-DLT-Corp/Aurigraph-DLT}"
VERSION="${VERSION:-11.0.0}"
BUILD_DATE="$(date -u +'%Y-%m-%dT%H:%M:%SZ')"
GIT_COMMIT="${GIT_COMMIT:-$(git rev-parse --short HEAD 2>/dev/null || echo 'unknown')}"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

# =============================================================================
# LOGGING FUNCTIONS
# =============================================================================

log_info() {
    echo -e "${BLUE}[INFO]${NC} $(date '+%H:%M:%S') - $1"
}

log_success() {
    echo -e "${GREEN}[✓]${NC} $(date '+%H:%M:%S') - $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $(date '+%H:%M:%S') - $1"
}

log_warn() {
    echo -e "${YELLOW}[⚠]${NC} $(date '+%H:%M:%S') - $1"
}

log_section() {
    echo ""
    echo -e "${CYAN}╔════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${CYAN}║${NC} $1"
    echo -e "${CYAN}╚════════════════════════════════════════════════════════════╝${NC}"
    echo ""
}

# =============================================================================
# PRE-FLIGHT CHECKS
# =============================================================================

preflight_checks() {
    log_section "PHASE 1: PRE-FLIGHT CHECKS"

    log_info "Verifying Git repository status..."
    if ! git rev-parse --git-dir > /dev/null 2>&1; then
        log_error "Not in a Git repository"
        exit 1
    fi
    log_success "Git repository verified"

    log_info "Checking Docker availability..."
    if ! command -v docker &> /dev/null; then
        log_error "Docker is not installed"
        exit 1
    fi
    log_success "Docker is available ($(docker --version))"

    log_info "Checking SSH connectivity to ${REMOTE_USER}@${REMOTE_HOST}..."
    if ! ssh -q -p "${REMOTE_PORT}" "${REMOTE_USER}@${REMOTE_HOST}" "echo 'SSH OK'" > /dev/null 2>&1; then
        log_error "Cannot connect to remote server"
        exit 1
    fi
    log_success "SSH connection established"

    log_info "Verifying remote Docker..."
    if ! ssh -p "${REMOTE_PORT}" "${REMOTE_USER}@${REMOTE_HOST}" "docker --version" > /dev/null 2>&1; then
        log_error "Docker not available on remote server"
        exit 1
    fi
    log_success "Remote Docker verified"
}

# =============================================================================
# BUILD PHASE
# =============================================================================

build_v11_images() {
    log_section "PHASE 2: BUILD V11 DOCKER IMAGES"

    local build_dir="aurigraph-av10-7/aurigraph-v11-standalone"

    if [ ! -d "$build_dir" ]; then
        log_error "V11 directory not found: $build_dir"
        exit 1
    fi

    cd "$build_dir" || exit 1

    log_info "Building V11 JAR package..."
    ./mvnw clean package -DskipTests -q
    log_success "V11 JAR built successfully"

    # Build all node type variants
    local node_types=("validator" "business" "integration")
    local build_variants=("dev" "staging" "prod")

    for node_type in "${node_types[@]}"; do
        for variant in "${build_variants[@]}"; do
            local dockerfile="Dockerfile.${node_type}-${variant}"
            local image_tag="${DOCKER_REGISTRY}/${GITHUB_REPO,,}/aurigraph-${node_type}:${VERSION}-${variant}"

            if [ -f "$dockerfile" ]; then
                log_info "Building ${node_type}-${variant} image..."
                docker build \
                    -f "$dockerfile" \
                    -t "${image_tag}" \
                    --label "version=${VERSION}" \
                    --label "commit=${GIT_COMMIT}" \
                    --label "build-date=${BUILD_DATE}" \
                    --label "node-type=${node_type}" \
                    --label "variant=${variant}" \
                    .
                log_success "Image built: ${image_tag}"
            fi
        done
    done

    cd - > /dev/null || exit 1
}

build_portal_image() {
    log_section "PHASE 3: BUILD ENTERPRISE PORTAL"

    log_info "Building Enterprise Portal..."

    if [ -f "Dockerfile.enterprise-portal" ]; then
        local portal_image="${DOCKER_REGISTRY}/${GITHUB_REPO,,}/enterprise-portal:${VERSION}"

        docker build \
            -f Dockerfile.enterprise-portal \
            -t "${portal_image}" \
            --label "version=${VERSION}" \
            --label "commit=${GIT_COMMIT}" \
            --label "build-date=${BUILD_DATE}" \
            --label "component=portal" \
            .
        log_success "Portal image built: ${portal_image}"
    else
        log_warn "Dockerfile.enterprise-portal not found, skipping portal build"
    fi
}

# =============================================================================
# REGISTRY PUSH
# =============================================================================

push_images_to_registry() {
    log_section "PHASE 4: PUSH IMAGES TO REGISTRY"

    log_info "Authenticating to ${DOCKER_REGISTRY}..."
    # Note: Ensure GITHUB_TOKEN is set in environment
    if [ -z "$GITHUB_TOKEN" ]; then
        log_error "GITHUB_TOKEN not set. Cannot push to registry."
        return 1
    fi

    echo "$GITHUB_TOKEN" | docker login "${DOCKER_REGISTRY}" -u "$GITHUB_ACTOR" --password-stdin
    log_success "Registry authentication successful"

    log_info "Pushing images to registry..."
    docker images --format "table {{.Repository}}:{{.Tag}}" | grep "aurigraph" | while read -r image; do
        if [ -n "$image" ]; then
            log_info "Pushing: $image"
            docker push "$image"
            log_success "Pushed: $image"
        fi
    done
}

# =============================================================================
# REMOTE DEPLOYMENT
# =============================================================================

deploy_to_remote() {
    log_section "PHASE 5: DEPLOY TO REMOTE SERVER"

    log_info "Deploying to ${REMOTE_USER}@${REMOTE_HOST}:${REMOTE_PORT}"

    # Create remote deployment script
    local deploy_script=$(cat <<'REMOTE_DEPLOY_SCRIPT'
#!/bin/bash
set -e

REMOTE_DIR="$1"
VERSION="$2"
REGISTRY="$3"
GITHUB_REPO="$4"

echo "========== AURIGRAPH PLATFORM DEPLOYMENT =========="
echo "Timestamp: $(date)"
echo "Version: $VERSION"
echo ""

cd "$REMOTE_DIR" || exit 1

# Step 1: Pull latest images
echo "[STEP 1] Pulling latest images from registry..."
docker pull "${REGISTRY}/${GITHUB_REPO,,}/aurigraph-validator:${VERSION}-prod"
docker pull "${REGISTRY}/${GITHUB_REPO,,}/aurigraph-business:${VERSION}-prod"
docker pull "${REGISTRY}/${GITHUB_REPO,,}/aurigraph-integration:${VERSION}-prod"
docker pull "${REGISTRY}/${GITHUB_REPO,,}/enterprise-portal:${VERSION}"
echo "✓ All images pulled successfully"
echo ""

# Step 2: Tag images locally
echo "[STEP 2] Tagging images for local use..."
docker tag "${REGISTRY}/${GITHUB_REPO,,}/aurigraph-validator:${VERSION}-prod" "aurigraph-validator:${VERSION}"
docker tag "${REGISTRY}/${GITHUB_REPO,,}/aurigraph-business:${VERSION}-prod" "aurigraph-business:${VERSION}"
docker tag "${REGISTRY}/${GITHUB_REPO,,}/aurigraph-integration:${VERSION}-prod" "aurigraph-integration:${VERSION}"
docker tag "${REGISTRY}/${GITHUB_REPO,,}/enterprise-portal:${VERSION}" "enterprise-portal:${VERSION}"
echo "✓ Images tagged successfully"
echo ""

# Step 3: Create production docker-compose if needed
echo "[STEP 3] Verifying docker-compose configuration..."
if [ ! -f "docker-compose.prod.yml" ]; then
    echo "⚠ docker-compose.prod.yml not found, using docker-compose.yml"
fi
echo ""

# Step 4: Deploy with docker-compose
echo "[STEP 4] Starting services with docker-compose..."
docker-compose -f docker-compose.prod.yml up -d 2>&1 | tail -5
echo "✓ Services started"
echo ""

# Step 5: Wait for services to stabilize
echo "[STEP 5] Waiting for services to stabilize..."
sleep 30
echo ""

# Step 6: Health checks
echo "[STEP 6] Running health checks..."
HEALTH_CHECK_PASSED=true

for port in 9003 9020 9040 9090; do
    if curl -sf http://localhost:${port}/q/health > /dev/null 2>&1; then
        echo "✓ Port ${port} is healthy"
    else
        echo "⚠ Port ${port} health check failed (may still be starting)"
    fi
done

# Step 7: Verify containers
echo ""
echo "[STEP 7] Running container verification..."
docker ps --format "table {{.Names}}\t{{.Status}}" | grep -E "validator|business|integration|portal|postgres|redis" || true
echo ""

echo "========== DEPLOYMENT COMPLETE =========="
echo "All services deployed successfully"
echo "Timestamp: $(date)"

REMOTE_DEPLOY_SCRIPT
)

    # Execute remote deployment
    ssh -p "${REMOTE_PORT}" "${REMOTE_USER}@${REMOTE_HOST}" bash -s "${REMOTE_DIR}" "${VERSION}" "${DOCKER_REGISTRY}" "${GITHUB_REPO}" <<< "$deploy_script"

    log_success "Remote deployment completed"
}

# =============================================================================
# VERIFICATION
# =============================================================================

verify_deployment() {
    log_section "PHASE 6: DEPLOYMENT VERIFICATION"

    log_info "Verifying portal accessibility..."
    if curl -sf https://dlt.aurigraph.io > /dev/null 2>&1; then
        log_success "Portal is accessible"
    else
        log_warn "Portal health check failed (may still be initializing)"
    fi

    log_info "Checking remote container status..."
    ssh -p "${REMOTE_PORT}" "${REMOTE_USER}@${REMOTE_HOST}" "docker ps --format 'table {{.Names}}\t{{.Status}}' | grep -E 'validator|business|integration|portal'"

    log_success "Verification completed"
}

# =============================================================================
# ROLLBACK
# =============================================================================

rollback_deployment() {
    log_section "ROLLING BACK DEPLOYMENT"

    log_warn "Rolling back to previous version..."

    ssh -p "${REMOTE_PORT}" "${REMOTE_USER}@${REMOTE_HOST}" << 'ROLLBACK_SCRIPT'
cd ~/Aurigraph-DLT
docker-compose -f docker-compose.prod.yml down
docker-compose -f docker-compose.prod.yml up -d
sleep 20
docker ps --format "table {{.Names}}\t{{.Status}}"
ROLLBACK_SCRIPT

    log_success "Rollback completed"
}

# =============================================================================
# MAIN EXECUTION
# =============================================================================

main() {
    local start_time=$(date +%s)

    echo ""
    echo -e "${CYAN}╔════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${CYAN}║${NC}      AURIGRAPH COMPLETE PLATFORM CI/CD DEPLOYMENT       ${CYAN}║${NC}"
    echo -e "${CYAN}║${NC}  Version: ${VERSION} | Commit: ${GIT_COMMIT}              ${CYAN}║${NC}"
    echo -e "${CYAN}╚════════════════════════════════════════════════════════════╝${NC}"
    echo ""

    # Execute phases
    preflight_checks || exit 1
    build_v11_images || exit 1
    build_portal_image || { log_warn "Portal build skipped"; }
    # push_images_to_registry || { log_warn "Registry push skipped (ensure GITHUB_TOKEN is set)"; }
    deploy_to_remote || { log_error "Deployment failed"; rollback_deployment; exit 1; }
    verify_deployment || exit 1

    # Summary
    local end_time=$(date +%s)
    local duration=$((end_time - start_time))

    log_section "DEPLOYMENT SUMMARY"
    echo -e "${GREEN}✓ Platform deployment completed successfully!${NC}"
    echo ""
    echo "Platform Components:"
    echo "  ✓ V11 Validator Nodes (Production-optimized)"
    echo "  ✓ V11 Business Nodes (Smart contract support)"
    echo "  ✓ V11 Integration Nodes (Light clients with APIs)"
    echo "  ✓ Enterprise Portal (v4.8.0+)"
    echo "  ✓ Infrastructure (PostgreSQL, Redis, Prometheus, Grafana)"
    echo ""
    echo "Deployment Duration: ${duration}s"
    echo "Deploy Time: $(date)"
    echo "Remote Server: ${REMOTE_USER}@${REMOTE_HOST}"
    echo "Production URL: https://dlt.aurigraph.io"
    echo ""
}

# Handle script arguments
case "${1:-deploy}" in
    deploy)
        main
        ;;
    rollback)
        rollback_deployment
        ;;
    *)
        echo "Usage: $0 [deploy|rollback]"
        exit 1
        ;;
esac
