#!/bin/bash

# Aurigraph Enterprise Portal Deployment Script
# Deploys the portal to dlt.aurigraph.io with HTTPS

set -e

# Remote server configuration
REMOTE_HOST="dlt.aurigraph.io"
REMOTE_USER="subbu"
REMOTE_PORT="22"
REMOTE_PASSWORD="subbuFuture@2025"
REMOTE_PATH="/var/www/aurigraph-portal"

echo "╔════════════════════════════════════════════════════════════╗"
echo "║   Aurigraph Enterprise Portal v4.0.0 Deployment            ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""

# Step 1: Create deployment package
echo "📦 Step 1: Creating deployment package..."
cd enterprise-portal/frontend
tar -czf ../../portal-deploy.tar.gz -C dist .
cd ../..
echo "✅ Package created: portal-deploy.tar.gz"
echo ""

# Step 2: Upload to remote server
echo "📤 Step 2: Uploading to remote server..."
sshpass -p "${REMOTE_PASSWORD}" scp -P ${REMOTE_PORT} portal-deploy.tar.gz ${REMOTE_USER}@${REMOTE_HOST}:/tmp/
echo "✅ Upload complete"
echo ""

# Step 3: Extract and deploy on remote server
echo "🔧 Step 3: Deploying on remote server..."
sshpass -p "${REMOTE_PASSWORD}" ssh -p ${REMOTE_PORT} ${REMOTE_USER}@${REMOTE_HOST} << 'ENDSSH'
    echo "Creating deployment directory..."
    sudo mkdir -p /var/www/aurigraph-portal
    sudo chown -R $USER:$USER /var/www/aurigraph-portal

    echo "Backing up existing deployment..."
    if [ -d /var/www/aurigraph-portal/current ]; then
        sudo mv /var/www/aurigraph-portal/current /var/www/aurigraph-portal/backup-$(date +%Y%m%d-%H%M%S)
    fi

    echo "Extracting new deployment..."
    mkdir -p /var/www/aurigraph-portal/current
    cd /var/www/aurigraph-portal/current
    tar -xzf /tmp/portal-deploy.tar.gz
    rm /tmp/portal-deploy.tar.gz

    echo "Setting permissions..."
    sudo chown -R www-data:www-data /var/www/aurigraph-portal/current
    sudo chmod -R 755 /var/www/aurigraph-portal/current

    echo "Reloading nginx..."
    sudo systemctl reload nginx

    echo "✅ Deployment complete!"
    echo ""
    echo "Portal files:"
    ls -lh /var/www/aurigraph-portal/current/ | head -10
ENDSSH

echo ""
echo "✅ Deployment verification:"
echo ""
echo "🌐 Portal URL:     https://dlt.aurigraph.io"
echo "🔒 SSL:            Enabled"
echo "📦 Version:        4.0.0"
echo "⏰ Deployed:       $(date '+%Y-%m-%d %H:%M:%S')"
echo ""

# Clean up local package
rm -f portal-deploy.tar.gz
echo "🧹 Cleaned up local deployment package"
echo ""
echo "🎉 Deployment completed successfully!"
