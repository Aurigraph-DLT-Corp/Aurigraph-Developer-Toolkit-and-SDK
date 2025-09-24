#!/bin/bash

# Quick deployment script for essential services
set -euo pipefail

echo "🚀 Starting Essential Aurex Platform Deployment to dev.aurigraph.io"

# Configuration
PROD_HOST="dev.aurigraph.io"
PROD_PORT="2224"
PROD_USER="yogesh"
PROD_PASSWORD="newlY@Tt%Trans2025"
PROD_PATH="/opt/aurex-platform"

# Step 1: Create minimal deployment package
echo "📦 Creating deployment package..."
tar -czf /tmp/aurex-deploy.tar.gz \
    docker-compose.production.yml \
    .env.production \
    nginx/ \
    monitoring/ \
    02_Applications/00_aurex-platform/frontend/dist \
    02_Applications/02_aurex-launchpad/frontend/dist \
    --exclude="node_modules" \
    --exclude=".git" \
    2>/dev/null || true

echo "📤 Transferring to server..."
sshpass -p "$PROD_PASSWORD" scp -P "$PROD_PORT" -o StrictHostKeyChecking=no \
    /tmp/aurex-deploy.tar.gz \
    "$PROD_USER@$PROD_HOST:/tmp/"

echo "🔧 Deploying on server..."
sshpass -p "$PROD_PASSWORD" ssh -p "$PROD_PORT" -o StrictHostKeyChecking=no \
    "$PROD_USER@$PROD_HOST" << 'EOF'
    
    # Extract deployment package
    cd /opt/aurex-platform
    tar -xzf /tmp/aurex-deploy.tar.gz 2>/dev/null || true
    
    # Start only essential services
    docker-compose -f docker-compose.production.yml up -d \
        nginx \
        postgres \
        redis \
        aurex-platform-frontend \
        aurex-platform-backend \
        aurex-launchpad-frontend \
        aurex-launchpad-backend
    
    # Check status
    docker-compose -f docker-compose.production.yml ps
    
    echo "✅ Essential services deployed!"
EOF

echo "🔍 Verifying deployment..."
sleep 10

# Test endpoints
echo "Testing services..."
curl -f -s --max-time 5 "http://$PROD_HOST:3000" > /dev/null && echo "✅ Platform Frontend: http://$PROD_HOST:3000" || echo "❌ Platform Frontend failed"
curl -f -s --max-time 5 "http://$PROD_HOST:3001" > /dev/null && echo "✅ Launchpad Frontend: http://$PROD_HOST:3001" || echo "❌ Launchpad Frontend failed"
curl -f -s --max-time 5 "http://$PROD_HOST:8000/health" > /dev/null && echo "✅ Platform API: http://$PROD_HOST:8000" || echo "❌ Platform API failed"
curl -f -s --max-time 5 "http://$PROD_HOST:8001/health" > /dev/null && echo "✅ Launchpad API: http://$PROD_HOST:8001" || echo "❌ Launchpad API failed"

echo "🎉 Deployment complete!"
echo "Access the platform at: http://$PROD_HOST:3000"