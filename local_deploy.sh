#!/bin/bash

# Aurex V3 Enterprise Portal - Local Build and Package Script
# Creates deployment package for manual transfer to dev4.aurigraph.io

set -e

echo "======================================"
echo "Aurex V3 Enterprise Portal - Local Build"
echo "======================================"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${YELLOW}Step 1: Creating deployment package...${NC}"

# Clean previous deployment
rm -rf deployment aurex-v3-deployment.tar.gz

# Create deployment directory
mkdir -p deployment
cp -r enterprise-portal deployment/
cp -r api deployment/
cp -r docs deployment/

# Create simplified Docker Compose for dev4
cat > deployment/docker-compose.yml << 'EOF'
version: '3.8'

services:
  aurex-portal:
    container_name: aurex-v3-portal
    image: nginx:alpine
    ports:
      - "8300:80"
    volumes:
      - ./enterprise-portal/standalone_portal.html:/usr/share/nginx/html/index.html:ro
      - ./nginx-simple.conf:/etc/nginx/nginx.conf:ro
    restart: always

  gnn-api:
    container_name: aurex-v3-gnn
    image: python:3.11-slim
    ports:
      - "8301:8000"
    working_dir: /app
    volumes:
      - ./api:/app
    environment:
      - PYTHONUNBUFFERED=1
    command: |
      sh -c "pip install fastapi uvicorn python-multipart pydantic &&
             python -m uvicorn main:app --host 0.0.0.0 --port 8000 --reload"
    restart: always

  portal-backend:
    container_name: aurex-v3-backend
    image: python:3.11-slim
    ports:
      - "8302:8001"
    working_dir: /app
    volumes:
      - ./enterprise-portal/backend:/app
    environment:
      - PYTHONUNBUFFERED=1
    command: |
      sh -c "pip install fastapi uvicorn python-multipart pydantic &&
             python server.py"
    restart: always
EOF

# Create simple nginx config
cat > deployment/nginx-simple.conf << 'EOF'
events {
    worker_connections 1024;
}

http {
    include /etc/nginx/mime.types;
    default_type application/octet-stream;

    server {
        listen 80;
        server_name _;

        location / {
            root /usr/share/nginx/html;
            index index.html;
        }
    }
}
EOF

# Create deployment instructions
cat > deployment/DEPLOY_INSTRUCTIONS.md << 'EOF'
# Aurex V3 Deployment Instructions for dev4.aurigraph.io

## Manual Deployment Steps

1. **Copy the deployment package to server:**
   ```bash
   scp aurex-v3-deployment.tar.gz subbu@dev4.aurigraph.io:/tmp/
   ```

2. **SSH into the server:**
   ```bash
   ssh subbu@dev4.aurigraph.io
   ```

3. **Extract and setup:**
   ```bash
   # Create directory
   sudo mkdir -p /opt/aurex-v3
   sudo chown $USER:$USER /opt/aurex-v3

   # Extract files
   cd /opt/aurex-v3
   tar -xzf /tmp/aurex-v3-deployment.tar.gz

   # Start services
   docker-compose up -d
   ```

4. **Verify deployment:**
   ```bash
   # Check running containers
   docker ps

   # Test endpoints
   curl http://localhost:8300  # Portal
   curl http://localhost:8301/api/gnn/health  # GNN API
   curl http://localhost:8302/api/health  # Portal Backend
   ```

## Access Points

- **Portal**: http://dev4.aurigraph.io:8300
- **GNN API**: http://dev4.aurigraph.io:8301
- **Backend API**: http://dev4.aurigraph.io:8302

## Service Management

- **View logs**: `docker-compose logs -f`
- **Stop services**: `docker-compose down`
- **Restart services**: `docker-compose restart`
- **Update and restart**: `docker-compose pull && docker-compose up -d`
EOF

# Create quick start script for server
cat > deployment/start.sh << 'EOF'
#!/bin/bash

echo "Starting Aurex V3 Services..."

# Ensure Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "Docker is not running. Please start Docker first."
    exit 1
fi

# Stop any existing services
docker-compose down 2>/dev/null || true

# Start services
docker-compose up -d

# Wait for services
sleep 5

# Show status
echo ""
echo "Service Status:"
docker-compose ps

echo ""
echo "Testing endpoints..."
curl -s http://localhost:8300 > /dev/null && echo "✓ Portal is running on port 8300" || echo "✗ Portal failed"
curl -s http://localhost:8301/api/gnn/health && echo "✓ GNN API is running on port 8301" || echo "✗ GNN API failed"
curl -s http://localhost:8302/api/health && echo "✓ Backend API is running on port 8302" || echo "✗ Backend API failed"

echo ""
echo "Deployment complete!"
echo "Access the portal at: http://$(hostname -I | awk '{print $1}'):8300"
EOF

chmod +x deployment/start.sh

echo -e "${YELLOW}Step 2: Creating deployment package...${NC}"
tar -czf aurex-v3-deployment.tar.gz -C deployment .

echo -e "${GREEN}======================================"
echo "Build Complete!"
echo "======================================"
echo ""
echo "Package created: aurex-v3-deployment.tar.gz"
echo ""
echo "Next steps:"
echo "1. Copy to server: scp aurex-v3-deployment.tar.gz subbu@dev4.aurigraph.io:/tmp/"
echo "2. SSH to server: ssh subbu@dev4.aurigraph.io"
echo "3. Extract: cd /opt && sudo tar -xzf /tmp/aurex-v3-deployment.tar.gz"
echo "4. Start: cd /opt/aurex-v3 && ./start.sh"
echo ""
echo "For detailed instructions, see deployment/DEPLOY_INSTRUCTIONS.md"
echo -e "${NC}"