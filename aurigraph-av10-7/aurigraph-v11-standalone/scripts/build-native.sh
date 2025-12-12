#!/bin/bash
###############################################################################
# Aurigraph V12 Native Build Script
# Builds GraalVM native executable using Mandrel 24.2
#
# Requirements:
# - Docker (for container-based build)
# - 16GB+ RAM available for build process
# - ~30 minutes build time
#
# Usage:
#   ./scripts/build-native.sh [profile]
#
# Profiles:
#   fast  - Quick build with -O1 optimization (default, ~20 min)
#   full  - Full build with -O2 optimization (~30 min)
#   ultra - Ultra-optimized with -O3 (~45 min)
###############################################################################

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
BUILD_PROFILE="${1:-fast}"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}"
echo "┌─────────────────────────────────────────────────────────────┐"
echo "│  Aurigraph V12 Native Build                                  │"
echo "├─────────────────────────────────────────────────────────────┤"
echo "│  Profile: ${BUILD_PROFILE}                                            │"
echo "│  Builder: Mandrel 24.2 (GraalVM 25 for JDK 21)              │"
echo "│  Target:  Native executable (no JVM required)               │"
echo "└─────────────────────────────────────────────────────────────┘"
echo -e "${NC}"

cd "$PROJECT_DIR"

# Map profile to Maven profile
case "$BUILD_PROFILE" in
    fast)
        MAVEN_PROFILE="native-fast"
        echo -e "${YELLOW}Using native-fast profile (-O1 optimization)${NC}"
        ;;
    full)
        MAVEN_PROFILE="native"
        echo -e "${YELLOW}Using native profile (-O2 optimization)${NC}"
        ;;
    ultra)
        MAVEN_PROFILE="native-ultra"
        echo -e "${YELLOW}Using native-ultra profile (-O3 optimization)${NC}"
        ;;
    *)
        echo -e "${RED}Unknown profile: $BUILD_PROFILE${NC}"
        echo "Available profiles: fast, full, ultra"
        exit 1
        ;;
esac

# Check Docker availability
if ! docker info >/dev/null 2>&1; then
    echo -e "${RED}Docker is not running. Please start Docker and retry.${NC}"
    exit 1
fi

# Check available memory
AVAILABLE_MEM=$(docker info --format '{{.MemTotal}}' 2>/dev/null || echo "0")
AVAILABLE_GB=$((AVAILABLE_MEM / 1073741824))

if [ "$AVAILABLE_GB" -lt 12 ]; then
    echo -e "${YELLOW}WARNING: Docker has ${AVAILABLE_GB}GB memory allocated.${NC}"
    echo -e "${YELLOW}Native build requires 12GB+. Consider increasing Docker memory.${NC}"
fi

echo ""
echo -e "${BLUE}Step 1: Clean previous build artifacts${NC}"
./mvnw clean -q

echo ""
echo -e "${BLUE}Step 2: Building native executable with container build${NC}"
echo -e "${YELLOW}This will take 20-45 minutes depending on profile...${NC}"
echo ""

BUILD_START=$(date +%s)

# Build native executable using container build
./mvnw package -P"$MAVEN_PROFILE" -DskipTests=true \
    -Dquarkus.native.container-build=true \
    -Dquarkus.native.container-runtime=docker \
    -Dquarkus.native.builder-image=quay.io/quarkus/ubi-quarkus-mandrel-builder-image:jdk-21

BUILD_END=$(date +%s)
BUILD_DURATION=$((BUILD_END - BUILD_START))
BUILD_MINUTES=$((BUILD_DURATION / 60))
BUILD_SECONDS=$((BUILD_DURATION % 60))

echo ""
echo -e "${GREEN}Build completed in ${BUILD_MINUTES}m ${BUILD_SECONDS}s${NC}"

# Verify native executable
NATIVE_EXE=$(find target -name "*-runner" -type f 2>/dev/null | head -1)

if [ -z "$NATIVE_EXE" ]; then
    echo -e "${RED}Native executable not found!${NC}"
    exit 1
fi

EXE_SIZE=$(du -h "$NATIVE_EXE" | cut -f1)
echo ""
echo -e "${GREEN}Native executable created: $NATIVE_EXE${NC}"
echo -e "${GREEN}Size: $EXE_SIZE${NC}"

echo ""
echo -e "${BLUE}Step 3: Building Docker image${NC}"

docker build \
    -f 05-deployment/docker/Dockerfile.native-production \
    -t aurigraph/v12-native:latest \
    -t aurigraph/v12-native:12.0.0 \
    --build-arg SKIP_BUILD=true \
    .

echo ""
echo -e "${GREEN}Docker image built: aurigraph/v12-native:latest${NC}"

# Show image size
IMAGE_SIZE=$(docker images aurigraph/v12-native:latest --format "{{.Size}}")
echo -e "${GREEN}Image size: $IMAGE_SIZE${NC}"

echo ""
echo -e "${GREEN}┌─────────────────────────────────────────────────────────────┐${NC}"
echo -e "${GREEN}│  Native Build Complete!                                     │${NC}"
echo -e "${GREEN}├─────────────────────────────────────────────────────────────┤${NC}"
echo -e "${GREEN}│  Executable: $NATIVE_EXE${NC}"
echo -e "${GREEN}│  Size: $EXE_SIZE${NC}"
echo -e "${GREEN}│  Docker: aurigraph/v12-native:latest ($IMAGE_SIZE)${NC}"
echo -e "${GREEN}│  Build Time: ${BUILD_MINUTES}m ${BUILD_SECONDS}s${NC}"
echo -e "${GREEN}└─────────────────────────────────────────────────────────────┘${NC}"
echo ""
echo -e "${BLUE}Next steps:${NC}"
echo "  1. Test locally: docker run -p 9003:9003 aurigraph/v12-native:latest"
echo "  2. Deploy: docker-compose -f docker-compose.native.yml up -d"
echo "  3. Push to registry: docker push aurigraph/v12-native:latest"
