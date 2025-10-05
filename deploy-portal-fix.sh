#!/bin/bash
# Deploy the corrected Enterprise Portal to production server
# Fixes API_BASE_URL to use nginx proxy instead of localhost:9003

set -e

echo "=== Deploying Enterprise Portal Fix ==="
echo ""
echo "Fix: API_BASE_URL now uses absolute URL to prevent port 8443 certificate errors"
echo "     API_BASE_URL = \`https://\${window.location.hostname}\` (always uses port 443)"
echo "Target: dlt.aurigraph.io:/home/subbu/aurigraph-v11/portal/"
echo ""

# Deploy to both index.html and default nginx file
echo "Deploying to index.html..."
scp -P22 aurigraph-v11-interactive-portal.html \
    subbu@dlt.aurigraph.io:/home/subbu/aurigraph-v11/portal/index.html

echo ""
echo "Deploying to nginx default file (aurigraph-v11-full-enterprise-portal.html)..."
scp -P22 aurigraph-v11-interactive-portal.html \
    subbu@dlt.aurigraph.io:/home/subbu/aurigraph-v11/portal/aurigraph-v11-full-enterprise-portal.html

echo ""
echo "✓ Deployment complete!"
echo ""
echo "Verifying deployment..."
sleep 2
curl -sk "https://dlt.aurigraph.io/portal/" | grep -A2 "const API_BASE_URL"

echo ""
echo "Test the portal at: https://dlt.aurigraph.io/portal/"
