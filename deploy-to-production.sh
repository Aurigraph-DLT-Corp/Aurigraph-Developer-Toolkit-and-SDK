#!/bin/bash

# Aurigraph DLT V11 Production Deployment Script
# Target: dlt.aurigraph.io
# Version: 11.0.0

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Configuration
REMOTE_HOST="dlt.aurigraph.io"
REMOTE_USER="subbu"
REMOTE_PASSWORD="subbuFuture@2025"
DEPLOY_DIR="/opt/aurigraph/v11"
APP_PORT="9003"
GRPC_PORT="9004"

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}Aurigraph DLT V11 Production Deployment${NC}"
echo -e "${BLUE}Target: ${REMOTE_HOST}${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

# Pre-deployment checks
echo -e "${YELLOW}[1/8] Pre-deployment checks...${NC}"
cd aurigraph-av10-7/aurigraph-v11-standalone

# Build
echo -e "${YELLOW}[2/8] Building application...${NC}"
./mvnw clean package -DskipTests

# Package
echo -e "${YELLOW}[3/8] Creating deployment package...${NC}"
PACKAGE="aurigraph-v11-$(date +%Y%m%d-%H%M%S).tar.gz"
tar -czf "/tmp/${PACKAGE}" target/quarkus-app/

echo -e "${GREEN}✓ Build complete: ${PACKAGE}${NC}"
echo ""
echo -e "${BLUE}Deployment package ready at: /tmp/${PACKAGE}${NC}"
echo ""
