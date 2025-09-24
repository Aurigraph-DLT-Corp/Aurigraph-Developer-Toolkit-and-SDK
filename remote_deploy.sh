#!/bin/bash

# Remote deployment script for dev4.aurigraph.io
# This script copies and deploys the package to the remote server

set -e

REMOTE_HOST="dev4.aurigraph.io"
REMOTE_USER="subbu"
PACKAGE_FILE="aurex-v3-deployment.tar.gz"

echo "======================================"
echo "Deploying Aurex V3 to $REMOTE_HOST"
echo "======================================"

# Check if package exists
if [ ! -f "$PACKAGE_FILE" ]; then
    echo "Package not found. Running local build first..."
    ./local_deploy.sh
fi

echo "Attempting to deploy to $REMOTE_HOST..."
echo "If prompted for password, please enter it."

# Copy package to server
echo "Copying deployment package..."
scp -o StrictHostKeyChecking=no "$PACKAGE_FILE" "$REMOTE_USER@$REMOTE_HOST:/tmp/" || {
    echo "Failed to copy package. Please ensure you have SSH access to $REMOTE_HOST"
    echo "You can manually copy using: scp $PACKAGE_FILE $REMOTE_USER@$REMOTE_HOST:/tmp/"
    exit 1
}

# Deploy on remote server
echo "Deploying on remote server..."
ssh -o StrictHostKeyChecking=no "$REMOTE_USER@$REMOTE_HOST" << 'REMOTE_COMMANDS'
set -e

echo "Setting up Aurex V3..."

# Create directory structure
sudo mkdir -p /opt/aurex-v3
sudo chown $USER:$USER /opt/aurex-v3

# Extract deployment package
cd /opt/aurex-v3
tar -xzf /tmp/aurex-v3-deployment.tar.gz

# Ensure Docker is installed
if ! command -v docker &> /dev/null; then
    echo "Installing Docker..."
    curl -fsSL https://get.docker.com -o get-docker.sh
    sudo sh get-docker.sh
    sudo usermod -aG docker $USER
    rm get-docker.sh
fi

# Ensure Docker Compose is installed
if ! command -v docker-compose &> /dev/null; then
    echo "Installing Docker Compose..."
    sudo curl -L "https://github.com/docker/compose/releases/download/v2.20.0/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
    sudo chmod +x /usr/local/bin/docker-compose
fi

# Stop any existing services
docker-compose down 2>/dev/null || true

# Start services
echo "Starting services..."
docker-compose up -d

# Wait for services to start
sleep 10

# Check status
echo ""
echo "Checking service status..."
docker ps | grep aurex-v3

echo ""
echo "Testing endpoints..."
curl -s http://localhost:8300 > /dev/null && echo "✓ Portal running on 8300" || echo "✗ Portal failed"
curl -s http://localhost:8301/api/gnn/health 2>/dev/null && echo "✓ GNN API running on 8301" || echo "✗ GNN API failed"
curl -s http://localhost:8302/api/health 2>/dev/null && echo "✓ Backend API running on 8302" || echo "✗ Backend API failed"

# Configure firewall if ufw is available
if command -v ufw &> /dev/null; then
    echo "Configuring firewall..."
    sudo ufw allow 8300/tcp
    sudo ufw allow 8301/tcp
    sudo ufw allow 8302/tcp
fi

echo ""
echo "Deployment complete on $(hostname)!"
REMOTE_COMMANDS

echo ""
echo "======================================"
echo "Deployment Successful!"
echo "======================================"
echo ""
echo "Access the services at:"
echo "- Portal: http://$REMOTE_HOST:8300"
echo "- GNN API: http://$REMOTE_HOST:8301/api/gnn/"
echo "- Backend API: http://$REMOTE_HOST:8302/api/"
echo ""
echo "To check logs: ssh $REMOTE_USER@$REMOTE_HOST 'cd /opt/aurex-v3 && docker-compose logs'"