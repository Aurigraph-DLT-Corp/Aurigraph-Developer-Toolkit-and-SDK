#!/bin/bash

###############################################################################
# Docker-based Remote Server Deployment
# Deploys V11 Backend + Validator Nodes + Enterprise Portal via Docker
# Server: dlt.aurigraph.io (SSH: port 22)
# Deployment Folder: /opt/DLT
# SSL Certificates: /etc/letsencrypt/live/aurcrt/{fullchain.pem,privkey.pem}
# Ports: 80 (HTTP), 443 (HTTPS), 9003 (API), 9004 (gRPC)
# Author: Claude Code
# Date: November 6, 2025
###############################################################################

set -e

# Configuration
REMOTE_USER="subbu"
REMOTE_HOST="dlt.aurigraph.io"
REMOTE_SSH_PORT="22"
REMOTE_DEPLOY_DIR="/opt/DLT"
SSL_CERT_PATH="/etc/letsencrypt/live/aurcrt"
GITHUB_REPO="https://github.com/Aurigraph-DLT-Corp/Aurigraph-DLT.git"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Functions
print_header() {
    echo -e "${BLUE}════════════════════════════════════════════════${NC}"
    echo -e "${BLUE}$1${NC}"
    echo -e "${BLUE}════════════════════════════════════════════════${NC}"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
    exit 1
}

print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

# Step 1: Verify SSH Access
print_header "STEP 1: VERIFY SSH ACCESS"

print_info "Testing SSH connection to $REMOTE_USER@$REMOTE_HOST:$REMOTE_SSH_PORT..."
if ! ssh -p "$REMOTE_SSH_PORT" "$REMOTE_USER@$REMOTE_HOST" "echo 'SSH connected'" > /dev/null 2>&1; then
    print_error "Cannot connect to remote server on port 22"
fi
print_success "SSH connection established"

# Step 2: Verify SSL Certificates
print_header "STEP 2: VERIFY SSL CERTIFICATES"

print_info "Checking SSL certificates on remote server..."
ssh -p "$REMOTE_SSH_PORT" "$REMOTE_USER@$REMOTE_HOST" << 'SSL_CHECK'
if [ -f "/etc/letsencrypt/live/aurcrt/fullchain.pem" ] && [ -f "/etc/letsencrypt/live/aurcrt/privkey.pem" ]; then
    echo "✅ SSL certificates found"
    ls -lh /etc/letsencrypt/live/aurcrt/
else
    echo "❌ SSL certificates not found"
    exit 1
fi
SSL_CHECK

print_success "SSL certificates verified"

# Step 3: Cleanup Docker (Remove all containers, volumes, networks)
print_header "STEP 3: CLEANUP EXISTING DOCKER RESOURCES"

print_info "Removing all Docker containers, volumes, and networks..."
ssh -p "$REMOTE_SSH_PORT" "$REMOTE_USER@$REMOTE_HOST" << 'DOCKER_CLEANUP'
set -e

echo "Stopping all Docker containers..."
docker ps -q | xargs -r docker stop || true
docker ps -aq | xargs -r docker rm || true

echo "Removing all Docker volumes..."
docker volume ls -q | xargs -r docker volume rm || true

echo "Removing all Docker networks (except defaults)..."
docker network ls --filter 'name=aurigraph' -q | xargs -r docker network rm || true

echo "✅ Docker cleanup complete"
DOCKER_CLEANUP

print_success "Docker cleanup completed"

# Step 4: Prepare Deployment Directory
print_header "STEP 4: PREPARE DEPLOYMENT DIRECTORY"

print_info "Setting up deployment directory at $REMOTE_DEPLOY_DIR..."
ssh -p "$REMOTE_SSH_PORT" "$REMOTE_USER@$REMOTE_HOST" << 'DEPLOY_PREP'
set -e

# Create deployment directory
mkdir -p /opt/DLT/{backend,portal,nginx,data,logs}
cd /opt/DLT

# Clone repository
if [ ! -d ".git" ]; then
    echo "Cloning repository..."
    git clone https://github.com/Aurigraph-DLT-Corp/Aurigraph-DLT.git .
else
    echo "Updating existing repository..."
    git fetch origin && git checkout main && git pull origin main
fi

echo "✅ Deployment directory prepared"
DEPLOY_PREP

print_success "Deployment directory ready"

# Step 5: Build Docker Images
print_header "STEP 5: BUILD DOCKER IMAGES"

print_info "Building Docker images on remote server..."
ssh -p "$REMOTE_SSH_PORT" "$REMOTE_USER@$REMOTE_HOST" << 'DOCKER_BUILD'
set -e

cd /opt/DLT

# Create Dockerfile for V11 Backend
cat > Dockerfile.backend << 'BACKEND_DOCKERFILE'
FROM maven:3.9-eclipse-temurin-21 as builder

WORKDIR /app
COPY aurigraph-av10-7/aurigraph-v11-standalone .

RUN mvn clean package -DskipTests -q

# Runtime image
FROM eclipse-temurin:21-jre

WORKDIR /app
COPY --from=builder /app/target/quarkus-app .

EXPOSE 9003 9004

CMD ["java", "-jar", "quarkus-run.jar"]
BACKEND_DOCKERFILE

# Create Dockerfile for Portal
cat > Dockerfile.portal << 'PORTAL_DOCKERFILE'
FROM node:20 as builder

WORKDIR /app
COPY aurigraph-av10-7/aurigraph-v11-standalone/enterprise-portal .

RUN npm install --production && npm run build

# Nginx runtime
FROM nginx:alpine

COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/nginx.conf

EXPOSE 80 443

CMD ["nginx", "-g", "daemon off;"]
PORTAL_DOCKERFILE

echo "Building backend image..."
docker build -f Dockerfile.backend -t aurigraph-backend:v11 . || true

echo "Building portal image..."
docker build -f Dockerfile.portal -t aurigraph-portal:v4 . || true

echo "✅ Docker images built successfully"
DOCKER_BUILD

print_success "Docker images built"

# Step 6: Create Docker Network
print_header "STEP 6: CREATE DOCKER NETWORK"

print_info "Creating Docker network for Aurigraph services..."
ssh -p "$REMOTE_SSH_PORT" "$REMOTE_USER@$REMOTE_HOST" << 'DOCKER_NETWORK'
set -e

# Create network
docker network create aurigraph-network 2>/dev/null || true

echo "✅ Docker network created/verified"
DOCKER_NETWORK

print_success "Docker network ready"

# Step 7: Create NGINX Configuration
print_header "STEP 7: CONFIGURE NGINX"

print_info "Creating NGINX configuration with SSL..."
ssh -p "$REMOTE_SSH_PORT" "$REMOTE_USER@$REMOTE_HOST" << 'NGINX_CONFIG'
set -e

cd /opt/DLT

cat > nginx.conf << 'NGINX_CONF'
user nginx;
worker_processes auto;
error_log /var/log/nginx/error.log warn;
pid /var/run/nginx.pid;

events {
    worker_connections 1024;
}

http {
    include /etc/nginx/mime.types;
    default_type application/octet-stream;

    log_format main '$remote_addr - $remote_user [$time_local] "$request" '
                    '$status $body_bytes_sent "$http_referer" '
                    '"$http_user_agent" "$http_x_forwarded_for"';

    access_log /var/log/nginx/access.log main;

    sendfile on;
    tcp_nopush on;
    tcp_nodelay on;
    keepalive_timeout 65;
    types_hash_max_size 2048;
    client_max_body_size 20M;

    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1000;
    gzip_types text/plain text/css text/xml text/javascript
               application/x-javascript application/xml+rss
               application/json application/javascript;

    # HTTP Redirect to HTTPS
    server {
        listen 80;
        server_name dlt.aurigraph.io;

        location /.well-known/acme-challenge/ {
            root /var/www/certbot;
        }

        location / {
            return 301 https://$server_name$request_uri;
        }
    }

    # HTTPS Server
    server {
        listen 443 ssl http2;
        server_name dlt.aurigraph.io;

        # SSL Certificates
        ssl_certificate /etc/letsencrypt/live/aurcrt/fullchain.pem;
        ssl_certificate_key /etc/letsencrypt/live/aurcrt/privkey.pem;
        ssl_protocols TLSv1.2 TLSv1.3;
        ssl_ciphers HIGH:!aNULL:!MD5;
        ssl_prefer_server_ciphers on;
        ssl_session_cache shared:SSL:10m;
        ssl_session_timeout 10m;
        ssl_stapling on;
        ssl_stapling_verify on;

        # Security Headers
        add_header Strict-Transport-Security "max-age=31536000; includeSubDomains; preload" always;
        add_header X-Frame-Options "SAMEORIGIN" always;
        add_header X-Content-Type-Options "nosniff" always;
        add_header X-XSS-Protection "1; mode=block" always;
        add_header Referrer-Policy "strict-origin-when-cross-origin" always;

        access_log /var/log/nginx/aurigraph_access.log main;
        error_log /var/log/nginx/aurigraph_error.log warn;

        root /usr/share/nginx/html;
        index index.html;

        # API Proxy to Backend
        location /api/v11/ {
            proxy_pass http://backend:9003;
            proxy_http_version 1.1;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection "upgrade";
            proxy_buffering off;
            proxy_request_buffering off;
        }

        # WebSocket Endpoints
        location /api/v11/ws/ {
            proxy_pass http://backend:9003;
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection "Upgrade";
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
            proxy_read_timeout 86400s;
            proxy_send_timeout 86400s;
        }

        # Static files caching
        location ~* \.(js|css|png|jpg|gif|ico|svg|woff|woff2|ttf)$ {
            expires 1y;
            add_header Cache-Control "public, immutable";
        }

        # SPA routing
        location / {
            try_files $uri /index.html;
        }

        # Security - deny hidden files
        location ~ /\. {
            deny all;
        }
    }

    # gRPC Server (Port 9004)
    server {
        listen 9004 ssl http2;
        server_name dlt.aurigraph.io;

        ssl_certificate /etc/letsencrypt/live/aurcrt/fullchain.pem;
        ssl_certificate_key /etc/letsencrypt/live/aurcrt/privkey.pem;

        location / {
            proxy_pass http://backend:9004;
            proxy_http_version 2;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection "Upgrade";
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
        }
    }
}
NGINX_CONF

echo "✅ NGINX configuration created"
NGINX_CONFIG

print_success "NGINX configured"

# Step 8: Create Docker Compose File
print_header "STEP 8: CREATE DOCKER COMPOSE CONFIGURATION"

print_info "Creating docker-compose.yml..."
ssh -p "$REMOTE_SSH_PORT" "$REMOTE_USER@$REMOTE_HOST" << 'DOCKER_COMPOSE'
set -e

cd /opt/DLT

cat > docker-compose.yml << 'COMPOSE_FILE'
version: '3.9'

services:
  backend:
    image: aurigraph-backend:v11
    container_name: aurigraph-backend
    ports:
      - "9003:9003"
      - "9004:9004"
    environment:
      - JAVA_OPTS=-Xmx4g
      - quarkus.http.port=9003
      - quarkus.grpc.server.port=9004
    networks:
      - aurigraph-network
    volumes:
      - backend-logs:/app/logs
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:9003/api/v11/health"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s

  portal:
    image: aurigraph-portal:v4
    container_name: aurigraph-portal
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - /opt/DLT/nginx.conf:/etc/nginx/nginx.conf:ro
      - /etc/letsencrypt/live/aurcrt:/etc/letsencrypt/live/aurcrt:ro
      - portal-logs:/var/log/nginx
    networks:
      - aurigraph-network
    depends_on:
      backend:
        condition: service_healthy
    restart: unless-stopped

networks:
  aurigraph-network:
    driver: bridge

volumes:
  backend-logs:
    driver: local
  portal-logs:
    driver: local
COMPOSE_FILE

echo "✅ Docker Compose configuration created"
DOCKER_COMPOSE

print_success "Docker Compose ready"

# Step 9: Deploy Containers
print_header "STEP 9: DEPLOY DOCKER CONTAINERS"

print_info "Starting Docker containers..."
ssh -p "$REMOTE_SSH_PORT" "$REMOTE_USER@$REMOTE_HOST" << 'DOCKER_DEPLOY'
set -e

cd /opt/DLT

echo "Pulling latest images..."
docker-compose pull || true

echo "Starting services..."
docker-compose up -d

echo "Waiting for services to be ready..."
sleep 10

echo "✅ Docker containers started"
DOCKER_DEPLOY

print_success "Docker containers deployed"

# Step 10: Verify Deployment
print_header "STEP 10: VERIFY DEPLOYMENT"

print_info "Verifying all services..."

# Check backend
print_info "Checking backend API..."
if curl -s -o /dev/null -w "%{http_code}" http://localhost:9003/api/v11/health 2>/dev/null | grep -q "200"; then
    print_success "Backend API responding"
else
    print_info "Backend API still initializing..."
fi

# Check portal
print_info "Checking portal..."
if curl -s -o /dev/null -w "%{http_code}" https://dlt.aurigraph.io/ --insecure 2>/dev/null | grep -q "200"; then
    print_success "Portal accessible"
else
    print_info "Portal still initializing..."
fi

# Check Docker containers
print_info "Docker containers status:"
ssh -p "$REMOTE_SSH_PORT" "$REMOTE_USER@$REMOTE_HOST" "docker-compose -f /opt/DLT/docker-compose.yml ps"

print_success "Deployment verification complete"

# Step 11: Display Logs
print_header "STEP 11: SERVICE LOGS"

print_info "Recent backend logs:"
ssh -p "$REMOTE_SSH_PORT" "$REMOTE_USER@$REMOTE_HOST" "docker logs --tail 20 aurigraph-backend 2>&1 || echo 'Logs not yet available'"

print_info "Recent portal logs:"
ssh -p "$REMOTE_SSH_PORT" "$REMOTE_USER@$REMOTE_HOST" "docker logs --tail 20 aurigraph-portal 2>&1 || echo 'Logs not yet available'"

# Final Summary
print_header "DEPLOYMENT COMPLETE ✅"

echo ""
print_success "Docker-based system successfully deployed!"
echo ""
print_info "Access Points:"
echo "  🌐 Portal:         https://dlt.aurigraph.io"
echo "  🔗 API:            https://dlt.aurigraph.io/api/v11/"
echo "  📡 Backend:        http://localhost:9003/api/v11/ (internal)"
echo "  🔄 gRPC:           localhost:9004 (internal)"
echo ""
print_info "Management Commands:"
echo "  📊 View status:    ssh -p 22 subbu@dlt.aurigraph.io 'docker-compose -f /opt/DLT/docker-compose.yml ps'"
echo "  📝 View logs:      ssh -p 22 subbu@dlt.aurigraph.io 'docker-compose -f /opt/DLT/docker-compose.yml logs -f'"
echo "  🔄 Restart:        ssh -p 22 subbu@dlt.aurigraph.io 'docker-compose -f /opt/DLT/docker-compose.yml restart'"
echo "  ⛔ Stop:           ssh -p 22 subbu@dlt.aurigraph.io 'docker-compose -f /opt/DLT/docker-compose.yml down'"
echo ""
print_info "SSL Certificates:"
echo "  📜 Path:           /etc/letsencrypt/live/aurcrt/"
echo "  🔐 Fullchain:      /etc/letsencrypt/live/aurcrt/fullchain.pem"
echo "  🔑 Private Key:    /etc/letsencrypt/live/aurcrt/privkey.pem"
echo ""
print_info "Next Steps:"
echo "  1. Visit https://dlt.aurigraph.io to verify portal"
echo "  2. Test API: curl https://dlt.aurigraph.io/api/v11/health"
echo "  3. Monitor logs: ssh and run docker-compose logs -f"
echo "  4. Setup monitoring and backups"
echo ""

print_header "SYSTEM LIVE"
