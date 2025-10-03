#!/bin/bash

# Aurigraph Enterprise Portal - Production Deployment (Self-Signed SSL)
# Target: dlt.aurigraph.io

set -e

GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m'

REMOTE_HOST="dlt.aurigraph.io"
REMOTE_PORT="22"
REMOTE_USER="subbu"

echo -e "${BLUE}================================================${NC}"
echo -e "${BLUE}  Aurigraph Enterprise Portal Deployment${NC}"
echo -e "${BLUE}  Target: https://${REMOTE_HOST}${NC}"
echo -e "${BLUE}================================================${NC}"

# Create deployment package
echo -e "${YELLOW}Creating deployment package...${NC}"
mkdir -p deploy-package
cp Dockerfile.enterprise-portal deploy-package/
cp docker-compose.production.yml deploy-package/docker-compose.yml
cp nginx-production.conf deploy-package/
cp enterprise_portal_fastapi.py deploy-package/
cp requirements.txt deploy-package/
cp aurigraph-av10-7/aurigraph-v11-standalone/aurigraph-v11-enterprise-portal.html deploy-package/index.html

tar -czf enterprise-portal-deployment.tar.gz -C deploy-package .

# Copy to server
echo -e "${YELLOW}Copying to server...${NC}"
scp -P ${REMOTE_PORT} enterprise-portal-deployment.tar.gz ${REMOTE_USER}@${REMOTE_HOST}:/tmp/

# Deploy
echo -e "${YELLOW}Deploying...${NC}"
ssh -p ${REMOTE_PORT} ${REMOTE_USER}@${REMOTE_HOST} << 'ENDSSH'
set -e

cd /home/subbu
mkdir -p aurigraph-enterprise-portal
cd aurigraph-enterprise-portal

# Extract
tar -xzf /tmp/enterprise-portal-deployment.tar.gz

# Generate self-signed SSL certificate
echo "Generating self-signed SSL certificate..."
mkdir -p ssl
if [ ! -f "ssl/privkey.pem" ]; then
    sudo openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
        -keyout ssl/privkey.pem \
        -out ssl/fullchain.pem \
        -subj "/C=US/ST=State/L=City/O=Aurigraph/CN=dlt.aurigraph.io"
    sudo chown -R subbu:subbu ssl/
fi

# Stop existing containers
docker-compose down 2>/dev/null || true

# Build and start
echo "Building containers..."
docker-compose build --no-cache

echo "Starting containers..."
docker-compose up -d

# Wait and check
sleep 10
docker-compose ps

echo "✅ Deployment complete!"
echo "🌐 HTTPS: https://dlt.aurigraph.io"
echo "📊 Docs: https://dlt.aurigraph.io/docs"
ENDSSH

# Cleanup
rm -rf deploy-package
rm enterprise-portal-deployment.tar.gz

echo -e "${GREEN}================================================${NC}"
echo -e "${GREEN}  ✅ Deployment Complete!${NC}"
echo -e "${GREEN}  🌐 Portal: https://${REMOTE_HOST}${NC}"
echo -e "${GREEN}  Note: Using self-signed SSL certificate${NC}"
echo -e "${GREEN}================================================${NC}"
