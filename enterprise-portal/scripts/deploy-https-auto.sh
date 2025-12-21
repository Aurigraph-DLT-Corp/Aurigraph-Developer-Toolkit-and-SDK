#!/bin/bash
set -e

# Automated deployment with sshpass
REMOTE_USER="subbu"
REMOTE_HOST="dlt.aurigraph.io"
REMOTE_PASS="subbuFuture@2025"
REMOTE_PATH="/var/www/aurigraph-portal"

echo "🚀 Deploying Aurigraph Enterprise Portal..."

# Create tar of dist
cd enterprise-portal/frontend
tar -czf ../../portal-deploy.tar.gz dist
cd ../..

# Upload
echo "📤 Uploading to server..."
sshpass -p "$REMOTE_PASS" scp portal-deploy.tar.gz ${REMOTE_USER}@${REMOTE_HOST}:/tmp/

# Deploy
echo "🔧 Deploying on server..."
sshpass -p "$REMOTE_PASS" ssh ${REMOTE_USER}@${REMOTE_HOST} << 'ENDSSH'
    set -e
    echo "Creating directory..."
    sudo mkdir -p /var/www/aurigraph-portal
    sudo chown -R $USER:$USER /var/www/aurigraph-portal
    
    echo "Extracting files..."
    cd /var/www/aurigraph-portal
    tar -xzf /tmp/portal-deploy.tar.gz
    rm /tmp/portal-deploy.tar.gz
    
    echo "✅ Files deployed successfully"
    ls -lh dist/
ENDSSH

# Cleanup
rm -f portal-deploy.tar.gz

echo "✅ Deployment complete!"
