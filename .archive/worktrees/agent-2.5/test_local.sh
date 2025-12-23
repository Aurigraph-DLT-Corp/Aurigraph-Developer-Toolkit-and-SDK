#!/bin/bash

# Test Aurex V3 deployment locally

echo "======================================"
echo "Testing Aurex V3 Locally"
echo "======================================"

# Extract deployment package
rm -rf local_test
mkdir -p local_test
cd local_test
tar -xzf ../aurex-v3-deployment.tar.gz

echo "Starting services locally..."

# Start Portal on port 9300
echo "Starting Portal on http://localhost:9300..."
cd enterprise-portal
python3 -m http.server 9300 > /tmp/portal.log 2>&1 &
PORTAL_PID=$!
cd ..

# Start GNN API on port 9301
echo "Starting GNN API on http://localhost:9301..."
cd api
python3 -m uvicorn main:app --host 0.0.0.0 --port 9301 > /tmp/gnn.log 2>&1 &
GNN_PID=$!
cd ..

# Start Backend API on port 9302
echo "Starting Backend API on http://localhost:9302..."
cd enterprise-portal/backend
python3 server.py > /tmp/backend.log 2>&1 &
BACKEND_PID=$!
cd ../..

echo ""
echo "Services started with PIDs:"
echo "- Portal: $PORTAL_PID"
echo "- GNN API: $GNN_PID"
echo "- Backend: $BACKEND_PID"

# Wait for services to start
sleep 5

echo ""
echo "Testing endpoints..."
curl -s http://localhost:9300 > /dev/null && echo "✓ Portal is accessible" || echo "✗ Portal failed"
curl -s http://localhost:9301/api/gnn/health 2>/dev/null && echo "✓ GNN API is accessible" || echo "✗ GNN API failed"
curl -s http://localhost:9302/api/health 2>/dev/null && echo "✓ Backend API is accessible" || echo "✗ Backend API failed"

echo ""
echo "Services are running locally for testing."
echo "Access points:"
echo "- Portal: http://localhost:9300/standalone_portal.html"
echo "- GNN API: http://localhost:9301/docs"
echo "- Backend: http://localhost:9302/api/"
echo ""
echo "To stop services, run: kill $PORTAL_PID $GNN_PID $BACKEND_PID"
echo ""
echo "Logs are available at:"
echo "- Portal: /tmp/portal.log"
echo "- GNN: /tmp/gnn.log"
echo "- Backend: /tmp/backend.log"