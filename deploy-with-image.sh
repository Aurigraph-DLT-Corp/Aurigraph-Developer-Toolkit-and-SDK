#!/bin/bash

# Deploy pre-built Docker image to production

set -e

GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m'

REMOTE_HOST="dlt.aurigraph.io"
REMOTE_USER="subbu"

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}  Deploying Enterprise Portal${NC}"
echo -e "${BLUE}========================================${NC}"

# Copy image and configs
echo -e "${YELLOW}Transferring files...${NC}"
scp enterprise-portal-image.tar.gz ${REMOTE_USER}@${REMOTE_HOST}:/tmp/
scp docker-compose.production.yml ${REMOTE_USER}@${REMOTE_HOST}:/tmp/docker-compose.yml
scp nginx-production.conf ${REMOTE_USER}@${REMOTE_HOST}:/tmp/

# Deploy
ssh ${REMOTE_USER}@${REMOTE_HOST} << 'ENDSSH'
set -e

cd /home/subbu
mkdir -p aurigraph-enterprise-portal
cd aurigraph-enterprise-portal

# Copy configs
mv /tmp/docker-compose.yml .
mv /tmp/nginx-production.conf .

# Load Docker image
echo "Loading Docker image..."
docker load < /tmp/enterprise-portal-image.tar.gz

# Generate SSL cert
mkdir -p ssl
if [ ! -f "ssl/privkey.pem" ]; then
    openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
        -keyout ssl/privkey.pem \
        -out ssl/fullchain.pem \
        -subj "/C=US/ST=State/L=City/O=Aurigraph/CN=dlt.aurigraph.io" 2>/dev/null
fi

# Update docker-compose to use loaded image
cat > docker-compose.yml << 'EOF'
services:
  enterprise-portal:
    image: aurigraph-enterprise-portal:production
    container_name: aurigraph-enterprise-portal
    expose:
      - "3000"
    environment:
      - AURIGRAPH_API_URL=http://localhost:9003
      - PORT=3000
      - API_VERSION=v11
    networks:
      - aurigraph-network
    restart: unless-stopped

  nginx:
    image: nginx:alpine
    container_name: aurigraph-nginx
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx-production.conf:/etc/nginx/nginx.conf:ro
      - ./ssl:/etc/nginx/ssl:ro
    networks:
      - aurigraph-network
    restart: unless-stopped
    depends_on:
      - enterprise-portal

networks:
  aurigraph-network:
    driver: bridge
EOF

# Deploy
docker-compose down 2>/dev/null || true
docker-compose up -d

sleep 5
docker-compose ps

echo "✅ Deployment complete!"
ENDSSH

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}  ✅ Deployed!${NC}"
echo -e "${GREEN}  🌐 https://dlt.aurigraph.io${NC}"
echo -e "${GREEN}========================================${NC}"
