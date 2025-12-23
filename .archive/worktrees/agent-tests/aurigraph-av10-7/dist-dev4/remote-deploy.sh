#!/bin/bash

DEPLOYMENT_PATH="/var/www/dlt.aurigraph.io"
SERVICE_NAME="aurigraph-dev4"

echo "🔧 Deploying Aurigraph V10 to dlt.aurigraph.io"

# Create deployment directory
sudo mkdir -p $DEPLOYMENT_PATH
sudo chown -R aurigraph:aurigraph $DEPLOYMENT_PATH

# Stop existing service
sudo systemctl stop $SERVICE_NAME 2>/dev/null || true

# Extract deployment package
cd $DEPLOYMENT_PATH
tar -xzf /tmp/aurigraph-dev4.tar.gz

# Install dependencies
npm ci --production

# Install systemd service
sudo cp aurigraph-dev4.service /etc/systemd/system/
sudo systemctl daemon-reload

# Install nginx configuration
sudo cp nginx-dlt.aurigraph.io.conf /etc/nginx/sites-available/dlt.aurigraph.io
sudo ln -sf /etc/nginx/sites-available/dlt.aurigraph.io /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx

# Start service
sudo systemctl enable $SERVICE_NAME
sudo systemctl start $SERVICE_NAME

# Check status
sleep 3
if sudo systemctl is-active --quiet $SERVICE_NAME; then
    echo "✅ Service started successfully"
    curl -s http://localhost:8080/health | jq
else
    echo "❌ Service failed to start"
    sudo journalctl -u $SERVICE_NAME -n 50
    exit 1
fi

echo "🎉 Deployment complete!"
echo "🌐 Access at: https://dlt.aurigraph.io"
