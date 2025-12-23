#!/bin/bash
#
# Simple Direct Deployment to dlt.aurigraph.io
# Bypasses git - copies files directly
#

set -e

echo "======================================================================"
echo "🚀 AURIGRAPH-DLT DIRECT DEPLOYMENT"
echo "   Deploying application files to remote server"
echo "======================================================================"
echo ""

# Configuration
REMOTE_HOST="dlt.aurigraph.io"
REMOTE_PORT="22"
REMOTE_USER="subbu"
REMOTE_DIR="~/aurigraph-deploy-$(date +%Y%m%d-%H%M%S)"

echo "📊 Configuration:"
echo "   Host: $REMOTE_HOST"
echo "   Port: $REMOTE_PORT"
echo "   User: $REMOTE_USER"
echo "   Deploy Dir: $REMOTE_DIR"
echo ""

# Step 1: Create deployment directory on remote
echo "🔍 Step 1: Creating deployment directory on remote..."
ssh -p $REMOTE_PORT $REMOTE_USER@$REMOTE_HOST "mkdir -p $REMOTE_DIR"
echo "   ✅ Directory created"
echo ""

# Step 2: Copy essential deployment files
echo "📦 Step 2: Copying deployment files..."
echo "   Copying docker-compose files..."
scp -P $REMOTE_PORT docker-compose*.yml $REMOTE_USER@$REMOTE_HOST:$REMOTE_DIR/
echo "   Copying Dockerfiles..."
scp -P $REMOTE_PORT Dockerfile* $REMOTE_USER@$REMOTE_HOST:$REMOTE_DIR/ 2>/dev/null || true
echo "   Copying environment files..."
scp -P $REMOTE_PORT .env.production $REMOTE_USER@$REMOTE_HOST:$REMOTE_DIR/.env 2>/dev/null || true
echo "   ✅ Files copied"
echo ""

# Step 3: Deploy on remote server
echo "🚀 Step 3: Deploying application..."
ssh -p $REMOTE_PORT $REMOTE_USER@$REMOTE_HOST << EOF
set -e
cd $REMOTE_DIR

echo "   📦 Pulling Docker images..."
docker-compose -f docker-compose.yml pull 2>&1 | head -20

echo "   🔄 Starting containers..."
docker-compose -f docker-compose.yml up -d

echo "   ⏳ Waiting for services to start..."
sleep 15

echo "   📊  Container status:"
docker ps --format 'table {{.Names}}\t{{.Status}}' | head -10

echo "   ✅ Deployment complete!"
EOF

echo ""
echo "======================================================================"
echo "✅  DEPLOYMENT SUCCESSFUL!"
echo "======================================================================"
echo ""
echo "📊 Deployment Details:"
echo "   Deployment Directory: $REMOTE_DIR"
echo ""
echo "📍 Next Steps:"
echo "   1. Check containers:"
echo "      ssh -p $REMOTE_PORT $REMOTE_USER@$REMOTE_HOST 'docker ps'"
echo ""
echo "   2. View logs:"
echo "      ssh -p $REMOTE_PORT $REMOTE_USER@$REMOTE_HOST 'cd $REMOTE_DIR && docker-compose logs -f'"
echo ""
echo "   3. Access application:"
echo "      https://$REMOTE_HOST"
echo ""
