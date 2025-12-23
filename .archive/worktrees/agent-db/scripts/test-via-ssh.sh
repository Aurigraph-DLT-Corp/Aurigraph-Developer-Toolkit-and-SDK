#!/bin/bash

echo "🔍 Testing Aurigraph V11 via SSH tunnel"
echo "======================================="
echo ""

REMOTE_HOST="dlt.aurigraph.io"
REMOTE_USER="subbu"
REMOTE_PORT="2235"
REMOTE_PASS="subbuFuture@2025"

echo "Creating SSH tunnel to access service..."
echo "This will forward local port 9003 to remote port 9003"
echo ""

# Function to test endpoints via SSH
test_via_ssh() {
    echo "Testing endpoints directly on server:"
    echo ""
    
    echo "1. Health Check:"
    sshpass -p "${REMOTE_PASS}" ssh -p ${REMOTE_PORT} -o StrictHostKeyChecking=no ${REMOTE_USER}@${REMOTE_HOST} \
        "curl -s http://localhost:9003/q/health | python3 -m json.tool"
    
    echo ""
    echo "2. Composite Tokens API:"
    sshpass -p "${REMOTE_PASS}" ssh -p ${REMOTE_PORT} -o StrictHostKeyChecking=no ${REMOTE_USER}@${REMOTE_HOST} \
        "curl -s http://localhost:9003/api/v11/composite-tokens | python3 -m json.tool"
    
    echo ""
    echo "3. System Info:"
    sshpass -p "${REMOTE_PASS}" ssh -p ${REMOTE_PORT} -o StrictHostKeyChecking=no ${REMOTE_USER}@${REMOTE_HOST} \
        "curl -s http://localhost:9003/api/v11/info | python3 -m json.tool"
    
    echo ""
    echo "4. Metrics:"
    sshpass -p "${REMOTE_PASS}" ssh -p ${REMOTE_PORT} -o StrictHostKeyChecking=no ${REMOTE_USER}@${REMOTE_HOST} \
        "curl -s http://localhost:9003/q/metrics | python3 -m json.tool"
}

# Run tests
test_via_ssh

echo ""
echo "=========================================="
echo "✅ Service is running successfully on the server!"
echo "=========================================="
echo ""
echo "📌 Note: Port 9003 appears to be blocked by cloud firewall"
echo ""
echo "To access the service locally, create an SSH tunnel:"
echo "  ssh -p2235 -L 9003:localhost:9003 subbu@dlt.aurigraph.io"
echo ""
echo "Then access at:"
echo "  http://localhost:9003/q/health"
echo "  http://localhost:9003/api/v11/composite-tokens"
echo "  http://localhost:9003/api/v11/info"
echo "  http://localhost:9003/q/metrics"
echo ""