#!/bin/bash
# Deploy Aurigraph V11 Backend to Production Server
# Deploys the uber JAR and restarts the backend service

set -e

echo "=== Deploying Aurigraph V11 Backend to Production ==="
echo ""
echo "Server: dlt.aurigraph.io"
echo "Backend Port: 9443 (proxied via nginx at port 443)"
echo "JAR Size: $(ls -lh target/aurigraph-v11-standalone-11.0.0-runner.jar | awk '{print $5}')"
echo ""

# Step 1: Deploy JAR to production
echo "Step 1: Copying JAR to production server..."
scp -P22 target/aurigraph-v11-standalone-11.0.0-runner.jar \
    subbu@dlt.aurigraph.io:/home/subbu/aurigraph-v11/backend/

echo ""
echo "✓ JAR deployed successfully"
echo ""

# Step 2: Stop old backend process
echo "Step 2: Stopping old backend service..."
ssh -p22 subbu@dlt.aurigraph.io "pkill -f 'aurigraph-v11-standalone.*jar' || echo 'No old process running'"

echo ""
echo "✓ Old service stopped"
echo ""

# Step 3: Start new backend service
echo "Step 3: Starting new backend service on port 9443..."
ssh -p22 subbu@dlt.aurigraph.io "cd /home/subbu/aurigraph-v11/backend && nohup java -jar aurigraph-v11-standalone-11.0.0-runner.jar -Dquarkus.http.port=9443 > backend.log 2>&1 &"

echo ""
echo "✓ Backend service started"
echo ""

# Step 4: Wait for backend to be ready
echo "Step 4: Waiting for backend to be ready..."
sleep 10

# Step 5: Test health endpoint
echo "Step 5: Testing health endpoint..."
ssh -p22 subbu@dlt.aurigraph.io "curl -s http://localhost:9443/api/v11/health | head -20"

echo ""
echo ""
echo "=== Deployment Complete ==="
echo ""
echo "Test the new endpoints:"
echo "  curl -sk https://dlt.aurigraph.io/api/v11/health"
echo "  curl -sk https://dlt.aurigraph.io/api/v11/info"
echo "  curl -sk https://dlt.aurigraph.io/api/v11/blocks"
echo "  curl -sk https://dlt.aurigraph.io/api/v11/validators"
echo ""
echo "View logs:"
echo "  ssh -p22 subbu@dlt.aurigraph.io 'tail -f /home/subbu/aurigraph-v11/backend/backend.log'"
echo ""
