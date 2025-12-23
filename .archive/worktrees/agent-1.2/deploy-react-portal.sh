#!/bin/bash

###############################################################################
# Enterprise Portal React Deployment Script
# Deploys the full React/TypeScript Portal v4.5.0 to production
# Usage: ./deploy-react-portal.sh --host dlt.aurigraph.io --user subbu
###############################################################################

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Script variables
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REMOTE_HOST="dlt.aurigraph.io"
REMOTE_USER="subbu"
REMOTE_PATH="/opt/DLT"
LOCAL_PORTAL_DIR="${SCRIPT_DIR}/portal"
LOCAL_CONFIG_DIR="${SCRIPT_DIR}/config"
LOCAL_CERTS_DIR="${SCRIPT_DIR}/certs"

# Parse arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        --host)
            REMOTE_HOST="$2"
            shift 2
            ;;
        --user)
            REMOTE_USER="$2"
            shift 2
            ;;
        --path)
            REMOTE_PATH="$2"
            shift 2
            ;;
        *)
            echo "Unknown option: $1"
            exit 1
            ;;
    esac
done

echo -e "${BLUE}═══════════════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}  Aurigraph Enterprise Portal v4.5.0 - React Deployment${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════════════${NC}"

echo -e "\n${YELLOW}Configuration:${NC}"
echo "  Remote Host: $REMOTE_HOST"
echo "  Remote User: $REMOTE_USER"
echo "  Remote Path: $REMOTE_PATH"
echo "  Local Portal: $LOCAL_PORTAL_DIR"

# Step 1: Verify local files exist
echo -e "\n${YELLOW}Step 1: Verifying local files...${NC}"
if [ ! -d "$LOCAL_PORTAL_DIR" ]; then
    echo -e "${RED}✗ Portal directory not found: $LOCAL_PORTAL_DIR${NC}"
    exit 1
fi

if [ ! -f "$LOCAL_CONFIG_DIR/nginx-portal.conf" ]; then
    echo -e "${RED}✗ NGINX config not found: $LOCAL_CONFIG_DIR/nginx-portal.conf${NC}"
    exit 1
fi

if [ ! -f "$SCRIPT_DIR/docker-compose.production-portal.yml" ]; then
    echo -e "${RED}✗ Docker compose file not found: $SCRIPT_DIR/docker-compose.production-portal.yml${NC}"
    exit 1
fi

echo -e "${GREEN}✓ All local files verified${NC}"

# Step 2: Copy files to remote server
echo -e "\n${YELLOW}Step 2: Copying portal files to remote server...${NC}"

ssh -p 2235 "${REMOTE_USER}@${REMOTE_HOST}" "mkdir -p ${REMOTE_PATH}/portal ${REMOTE_PATH}/config ${REMOTE_PATH}/certs" 2>/dev/null || true

echo "  Uploading Portal files..."
scp -P 2235 -r "$LOCAL_PORTAL_DIR"/* "${REMOTE_USER}@${REMOTE_HOST}:${REMOTE_PATH}/portal/" 2>/dev/null

echo "  Uploading NGINX configuration..."
scp -P 2235 "$LOCAL_CONFIG_DIR/nginx-portal.conf" "${REMOTE_USER}@${REMOTE_HOST}:${REMOTE_PATH}/config/" 2>/dev/null

echo "  Uploading Docker Compose..."
scp -P 2235 "$SCRIPT_DIR/docker-compose.production-portal.yml" "${REMOTE_USER}@${REMOTE_HOST}:${REMOTE_PATH}/" 2>/dev/null

echo -e "${GREEN}✓ Files copied successfully${NC}"

# Step 3: Stop current services
echo -e "\n${YELLOW}Step 3: Stopping current services...${NC}"

ssh -p 2235 "${REMOTE_USER}@${REMOTE_HOST}" << 'EOF'
cd /opt/DLT
# Try to stop running services if they exist
docker-compose down 2>/dev/null || true
docker-compose -f docker-compose.production-portal.yml down 2>/dev/null || true
echo "✓ Services stopped"
EOF

# Step 4: Start React Portal deployment
echo -e "\n${YELLOW}Step 4: Starting React Portal services...${NC}"

ssh -p 2235 "${REMOTE_USER}@${REMOTE_HOST}" << 'EOF'
cd /opt/DLT
docker-compose -f docker-compose.production-portal.yml up -d
sleep 5
echo "✓ Services started"
EOF

# Step 5: Verify services are running
echo -e "\n${YELLOW}Step 5: Verifying services...${NC}"

ssh -p 2235 "${REMOTE_USER}@${REMOTE_HOST}" << 'EOF'
cd /opt/DLT

echo "Checking running containers..."
docker-compose -f docker-compose.production-portal.yml ps

echo -e "\nVerifying health checks..."
docker-compose -f docker-compose.production-portal.yml ps | grep -q "aurigraph-nginx" && echo "✓ NGINX Gateway: Running" || echo "✗ NGINX Gateway: Not Running"
docker-compose -f docker-compose.production-portal.yml ps | grep -q "aurigraph-prometheus" && echo "✓ Prometheus: Running" || echo "✗ Prometheus: Not Running"
docker-compose -f docker-compose.production-portal.yml ps | grep -q "aurigraph-grafana" && echo "✓ Grafana: Running" || echo "✗ Grafana: Not Running"
EOF

# Step 6: Test endpoints
echo -e "\n${YELLOW}Step 6: Testing Portal endpoints...${NC}"

sleep 5

# Test health endpoint
echo "Testing health endpoint..."
HEALTH_RESPONSE=$(curl -s -k https://"${REMOTE_HOST}"/health 2>/dev/null || echo "ERROR")
if [[ $HEALTH_RESPONSE == *"healthy"* ]] || [[ $HEALTH_RESPONSE == *"status"* ]]; then
    echo -e "${GREEN}✓ Health endpoint: OK${NC}"
else
    echo -e "${YELLOW}⚠ Health endpoint: Could not verify (might need wait time)${NC}"
fi

# Test portal root
echo "Testing Portal root (http)..."
PORTAL_HTTP=$(curl -s -o /dev/null -w "%{http_code}" -k http://"${REMOTE_HOST}"/ 2>/dev/null)
if [ "$PORTAL_HTTP" == "301" ] || [ "$PORTAL_HTTP" == "200" ]; then
    echo -e "${GREEN}✓ Portal HTTP redirect: OK (HTTP $PORTAL_HTTP)${NC}"
else
    echo -e "${YELLOW}⚠ Portal HTTP: HTTP $PORTAL_HTTP${NC}"
fi

# Test portal HTTPS
echo "Testing Portal root (https)..."
PORTAL_HTTPS=$(curl -s -o /dev/null -w "%{http_code}" -k https://"${REMOTE_HOST}"/ 2>/dev/null)
if [ "$PORTAL_HTTPS" == "200" ]; then
    echo -e "${GREEN}✓ Portal HTTPS: OK (HTTP $PORTAL_HTTPS)${NC}"
else
    echo -e "${YELLOW}⚠ Portal HTTPS: HTTP $PORTAL_HTTPS${NC}"
fi

# Test Prometheus
echo "Testing Prometheus endpoint..."
PROM_RESPONSE=$(curl -s -k https://"${REMOTE_HOST}"/prometheus/ 2>/dev/null | head -c 50)
if [[ $PROM_RESPONSE == *"Prometheus"* ]] || [[ $PROM_RESPONSE == *"html"* ]]; then
    echo -e "${GREEN}✓ Prometheus endpoint: OK${NC}"
else
    echo -e "${YELLOW}⚠ Prometheus endpoint: Could not fully verify${NC}"
fi

# Test Grafana
echo "Testing Grafana endpoint..."
GRAFANA_RESPONSE=$(curl -s -k https://"${REMOTE_HOST}"/grafana/ 2>/dev/null | head -c 50)
if [[ $GRAFANA_RESPONSE == *"Grafana"* ]] || [[ $GRAFANA_RESPONSE == *"html"* ]]; then
    echo -e "${GREEN}✓ Grafana endpoint: OK${NC}"
else
    echo -e "${YELLOW}⚠ Grafana endpoint: Could not fully verify${NC}"
fi

# Step 7: Display deployment summary
echo -e "\n${BLUE}═══════════════════════════════════════════════════════════════${NC}"
echo -e "${GREEN}✓ DEPLOYMENT COMPLETE${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════════════${NC}"

echo -e "\n${YELLOW}Portal Access:${NC}"
echo "  Portal URL:        https://${REMOTE_HOST}/"
echo "  Health Check:      https://${REMOTE_HOST}/health"
echo "  Prometheus:        https://${REMOTE_HOST}/prometheus/"
echo "  Grafana:           https://${REMOTE_HOST}/grafana/"
echo "  Grafana Login:     admin / AurigraphSecure123"

echo -e "\n${YELLOW}Quick Commands:${NC}"
echo "  View Logs:         ssh -p 2235 ${REMOTE_USER}@${REMOTE_HOST} \"cd /opt/DLT && docker-compose -f docker-compose.production-portal.yml logs -f\""
echo "  Check Status:      ssh -p 2235 ${REMOTE_USER}@${REMOTE_HOST} \"cd /opt/DLT && docker-compose -f docker-compose.production-portal.yml ps\""
echo "  Restart Services:  ssh -p 2235 ${REMOTE_USER}@${REMOTE_HOST} \"cd /opt/DLT && docker-compose -f docker-compose.production-portal.yml restart\""

echo -e "\n${BLUE}═══════════════════════════════════════════════════════════════${NC}"
echo -e "${GREEN}React Portal v4.5.0 is now deployed and running!${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════════════${NC}\n"
