#!/bin/bash

# Aurigraph Enterprise Portal - Production Deployment Script
# Target: dlt.aurigraph.io

set -e

GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

REMOTE_HOST="dlt.aurigraph.io"
REMOTE_PORT="22"
REMOTE_USER="subbu"
REMOTE_DIR="/home/subbu/aurigraph-enterprise-portal"

echo -e "${BLUE}================================================${NC}"
echo -e "${BLUE}  Aurigraph Enterprise Portal Deployment${NC}"
echo -e "${BLUE}  Target: https://${REMOTE_HOST}${NC}"
echo -e "${BLUE}================================================${NC}"

# Step 1: Create deployment package
echo -e "${YELLOW}Step 1: Creating deployment package...${NC}"
mkdir -p deploy-package
cp Dockerfile.enterprise-portal deploy-package/
cp docker-compose.production.yml deploy-package/docker-compose.yml
cp nginx-production.conf deploy-package/
cp enterprise_portal_fastapi.py deploy-package/
cp requirements.txt deploy-package/
cp aurigraph-av10-7/aurigraph-v11-standalone/aurigraph-v11-enterprise-portal.html deploy-package/index.html

# Step 2: Create deployment archive
echo -e "${YELLOW}Step 2: Creating archive...${NC}"
tar -czf enterprise-portal-deployment.tar.gz -C deploy-package .

# Step 3: Copy to remote server
echo -e "${YELLOW}Step 3: Copying to ${REMOTE_HOST}...${NC}"
scp -P ${REMOTE_PORT} enterprise-portal-deployment.tar.gz ${REMOTE_USER}@${REMOTE_HOST}:/tmp/

# Step 4: Deploy on remote server
echo -e "${YELLOW}Step 4: Deploying on production server...${NC}"
ssh -p ${REMOTE_PORT} ${REMOTE_USER}@${REMOTE_HOST} << 'ENDSSH'
set -e

# Create deployment directory
mkdir -p /home/subbu/aurigraph-enterprise-portal
cd /home/subbu/aurigraph-enterprise-portal

# Extract deployment package
tar -xzf /tmp/enterprise-portal-deployment.tar.gz

# Setup SSL certificates (using Let's Encrypt)
echo "Setting up SSL certificates..."
sudo mkdir -p ssl

# Check if certbot is installed
if ! command -v certbot &> /dev/null; then
    echo "Installing certbot..."
    sudo apt-get update
    sudo apt-get install -y certbot
fi

# Generate SSL certificate
if [ ! -f "ssl/fullchain.pem" ]; then
    echo "Generating SSL certificate for dlt.aurigraph.io..."
    sudo certbot certonly --standalone -d dlt.aurigraph.io --non-interactive --agree-tos --email sjoish12@gmail.com
    sudo cp /etc/letsencrypt/live/dlt.aurigraph.io/fullchain.pem ssl/
    sudo cp /etc/letsencrypt/live/dlt.aurigraph.io/privkey.pem ssl/
    sudo chown -R subbu:subbu ssl/
fi

# Stop existing containers
if [ -f "docker-compose.yml" ]; then
    echo "Stopping existing containers..."
    docker-compose down || true
fi

# Build and start containers
echo "Building and starting containers..."
docker-compose build --no-cache
docker-compose up -d

# Wait for services to start
echo "Waiting for services to start..."
sleep 10

# Check container status
docker-compose ps

echo "✅ Deployment complete!"
echo "🌐 Access at: https://dlt.aurigraph.io"
ENDSSH

# Cleanup
rm -rf deploy-package
rm enterprise-portal-deployment.tar.gz

echo -e "${GREEN}================================================${NC}"
echo -e "${GREEN}  ✅ Deployment Complete!${NC}"
echo -e "${GREEN}  🌐 Portal: https://${REMOTE_HOST}${NC}"
echo -e "${GREEN}  📊 API Docs: https://${REMOTE_HOST}/docs${NC}"
echo -e "${GREEN}================================================${NC}"
