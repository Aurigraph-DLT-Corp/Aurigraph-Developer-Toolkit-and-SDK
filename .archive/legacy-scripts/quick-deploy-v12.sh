#!/bin/bash

##############################################################################
# Quick V12 Deployment - Direct Docker Compose
# Bypasses Git issues, deploys directly
##############################################################################

set -e

REMOTE_HOST="dlt.aurigraph.io"
REMOTE_PORT="22"
REMOTE_USER="subbu"
TIMESTAMP=$(date +%Y%m%d-%H%M%S)
DEPLOY_DIR="aurigraph-v12-$TIMESTAMP"

echo "🚀 Quick V12 Deployment"
echo "======================="
echo ""

# Create deployment directory on remote
echo "📁 Creating deployment directory..."
ssh -p $REMOTE_PORT $REMOTE_USER@$REMOTE_HOST "mkdir -p ~/$DEPLOY_DIR"

# Copy essential files
echo "📦 Transferring files..."
scp -P $REMOTE_PORT docker-compose.yml $REMOTE_USER@$REMOTE_HOST:~/$DEPLOY_DIR/

if [ -f ".env.production" ]; then
    scp -P $REMOTE_PORT .env.production $REMOTE_USER@$REMOTE_HOST:~/$DEPLOY_DIR/.env
fi

# Deploy
echo "🚀 Deploying containers..."
ssh -p $REMOTE_PORT $REMOTE_USER@$REMOTE_HOST << 'ENDSSH'
cd ~/aurigraph-v12-*
echo "Pulling images..."
docker-compose pull
echo "Starting services..."
docker-compose up -d
echo "Waiting for startup..."
sleep 10
echo "Checking status..."
docker ps --format 'table {{.Names}}\t{{.Status}}'
ENDSSH

echo ""
echo "✅ Deployment complete!"
echo ""
echo "📍 Access:"
echo "   Portal: https://$REMOTE_HOST"
echo "   API:    https://$REMOTE_HOST/api/v11/health"
echo ""
