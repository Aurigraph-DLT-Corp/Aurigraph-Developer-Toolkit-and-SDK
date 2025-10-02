#!/bin/bash

# Aurex V3 Enterprise Portal - Dev4 Deployment Script
# Target: dev4.aurigraph.io

set -e

echo "======================================"
echo "Aurex V3 Enterprise Portal Deployment"
echo "Target: dev4.aurigraph.io"
echo "======================================"

# Configuration
REMOTE_HOST="dev4.aurigraph.io"
REMOTE_USER="subbu"
REMOTE_DIR="/opt/aurex-v3"
LOCAL_DIR="$(pwd)"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${YELLOW}Step 1: Creating deployment package...${NC}"

# Create deployment directory
mkdir -p deployment
cp -r enterprise-portal deployment/
cp -r api deployment/
cp -r docs deployment/
cp -r 06_AI-ML deployment/ 2>/dev/null || true

# Create Docker Compose file
cat > deployment/docker-compose.yml << 'EOF'
version: '3.8'

services:
  gnn-platform:
    container_name: aurex-gnn-platform
    build:
      context: .
      dockerfile: Dockerfile.gnn
    ports:
      - "8000:8000"
    environment:
      - PYTHONUNBUFFERED=1
      - ENV=production
    volumes:
      - ./api:/app/api
      - ./06_AI-ML:/app/06_AI-ML
    restart: always
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:8000/api/gnn/health"]
      interval: 30s
      timeout: 10s
      retries: 3

  portal-backend:
    container_name: aurex-portal-backend
    build:
      context: .
      dockerfile: Dockerfile.portal
    ports:
      - "8001:8001"
    environment:
      - PYTHONUNBUFFERED=1
      - ENV=production
    volumes:
      - ./enterprise-portal:/app
    restart: always
    depends_on:
      - gnn-platform

  nginx:
    container_name: aurex-nginx
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf:ro
      - ./enterprise-portal/standalone_portal.html:/usr/share/nginx/html/index.html:ro
      - ./enterprise-portal/enterprise-portal:/usr/share/nginx/html/portal:ro
    restart: always
    depends_on:
      - gnn-platform
      - portal-backend
EOF

# Create Dockerfile for GNN Platform
cat > deployment/Dockerfile.gnn << 'EOF'
FROM python:3.11-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    gcc \
    g++ \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements
COPY api/requirements.txt /tmp/requirements.txt

# Create requirements if not exists
RUN echo "fastapi==0.104.1" >> /tmp/req.txt && \
    echo "uvicorn[standard]==0.24.0" >> /tmp/req.txt && \
    echo "torch==2.0.1" >> /tmp/req.txt && \
    echo "torch-geometric==2.3.1" >> /tmp/req.txt && \
    echo "numpy==1.24.3" >> /tmp/req.txt && \
    echo "pandas==2.0.3" >> /tmp/req.txt && \
    echo "scikit-learn==1.3.0" >> /tmp/req.txt && \
    echo "python-multipart==0.0.6" >> /tmp/req.txt && \
    echo "pydantic==2.4.2" >> /tmp/req.txt

RUN pip install --no-cache-dir -r /tmp/req.txt || true

# Copy application
COPY api /app/api
COPY 06_AI-ML /app/06_AI-ML

# Run application
CMD ["python", "-m", "uvicorn", "api.main:app", "--host", "0.0.0.0", "--port", "8000"]
EOF

# Create Dockerfile for Portal Backend
cat > deployment/Dockerfile.portal << 'EOF'
FROM python:3.11-slim

WORKDIR /app

# Install dependencies
RUN pip install --no-cache-dir \
    fastapi==0.104.1 \
    uvicorn[standard]==0.24.0 \
    pydantic==2.4.2 \
    python-multipart==0.0.6

# Copy application
COPY enterprise-portal /app/enterprise-portal

WORKDIR /app/enterprise-portal/backend

# Run application
CMD ["python", "server.py"]
EOF

# Create nginx configuration
cat > deployment/nginx.conf << 'EOF'
events {
    worker_connections 1024;
}

http {
    include /etc/nginx/mime.types;
    default_type application/octet-stream;

    upstream gnn_backend {
        server gnn-platform:8000;
    }

    upstream portal_backend {
        server portal-backend:8001;
    }

    server {
        listen 80;
        server_name dev4.aurigraph.io;

        # Main portal
        location / {
            root /usr/share/nginx/html;
            index index.html;
            try_files $uri $uri/ /index.html;
        }

        # GNN API
        location /api/gnn/ {
            proxy_pass http://gnn_backend/api/gnn/;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }

        # Portal API
        location /api/ {
            proxy_pass http://portal_backend/api/;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }

        # Health check
        location /health {
            access_log off;
            return 200 "OK\n";
            add_header Content-Type text/plain;
        }
    }
}
EOF

# Create deployment script for remote server
cat > deployment/setup.sh << 'EOF'
#!/bin/bash

echo "Setting up Aurex V3 on server..."

# Install Docker if not present
if ! command -v docker &> /dev/null; then
    echo "Installing Docker..."
    curl -fsSL https://get.docker.com -o get-docker.sh
    sudo sh get-docker.sh
    sudo usermod -aG docker $USER
fi

# Install Docker Compose if not present
if ! command -v docker-compose &> /dev/null; then
    echo "Installing Docker Compose..."
    sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
    sudo chmod +x /usr/local/bin/docker-compose
fi

# Stop existing services
echo "Stopping existing services..."
docker-compose down 2>/dev/null || true

# Build and start services
echo "Building and starting services..."
docker-compose build
docker-compose up -d

# Wait for services to be ready
echo "Waiting for services to start..."
sleep 10

# Check service status
echo "Checking service status..."
docker-compose ps
echo ""
echo "Testing endpoints..."
curl -s http://localhost:8000/api/gnn/health && echo " - GNN Platform: OK" || echo " - GNN Platform: FAILED"
curl -s http://localhost:8001/api/health && echo " - Portal Backend: OK" || echo " - Portal Backend: FAILED"
curl -s http://localhost/health && echo " - Nginx: OK" || echo " - Nginx: FAILED"

echo ""
echo "Deployment complete!"
echo "Access the portal at: http://dev4.aurigraph.io"
EOF

chmod +x deployment/setup.sh

echo -e "${YELLOW}Step 2: Creating tarball...${NC}"
tar -czf aurex-v3-deployment.tar.gz -C deployment .

echo -e "${YELLOW}Step 3: Uploading to dev4.aurigraph.io...${NC}"
scp aurex-v3-deployment.tar.gz $REMOTE_USER@$REMOTE_HOST:/tmp/

echo -e "${YELLOW}Step 4: Deploying on remote server...${NC}"
ssh $REMOTE_USER@$REMOTE_HOST << 'REMOTE_SCRIPT'
set -e

# Create directory
sudo mkdir -p /opt/aurex-v3
sudo chown $USER:$USER /opt/aurex-v3

# Extract files
cd /opt/aurex-v3
tar -xzf /tmp/aurex-v3-deployment.tar.gz

# Run setup
chmod +x setup.sh
./setup.sh

# Setup systemd service
sudo tee /etc/systemd/system/aurex-v3.service > /dev/null << 'SERVICE'
[Unit]
Description=Aurex V3 Enterprise Portal
After=docker.service
Requires=docker.service

[Service]
Type=oneshot
RemainAfterExit=yes
WorkingDirectory=/opt/aurex-v3
ExecStart=/usr/local/bin/docker-compose up -d
ExecStop=/usr/local/bin/docker-compose down
TimeoutStartSec=0

[Install]
WantedBy=multi-user.target
SERVICE

sudo systemctl daemon-reload
sudo systemctl enable aurex-v3
sudo systemctl start aurex-v3

# Configure firewall
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw allow 8000/tcp
sudo ufw allow 8001/tcp

echo "Remote deployment complete!"
REMOTE_SCRIPT

echo -e "${GREEN}======================================"
echo "Deployment Complete!"
echo "======================================"
echo ""
echo "Services deployed:"
echo "- Main Portal: http://dev4.aurigraph.io"
echo "- GNN API: http://dev4.aurigraph.io:8000/api/gnn/"
echo "- Portal API: http://dev4.aurigraph.io:8001/api/"
echo ""
echo "To check status:"
echo "ssh $REMOTE_USER@$REMOTE_HOST 'cd /opt/aurex-v3 && docker-compose ps'"
echo -e "${NC}"