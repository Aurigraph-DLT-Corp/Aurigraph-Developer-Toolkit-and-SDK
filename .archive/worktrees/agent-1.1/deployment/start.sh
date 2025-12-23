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
