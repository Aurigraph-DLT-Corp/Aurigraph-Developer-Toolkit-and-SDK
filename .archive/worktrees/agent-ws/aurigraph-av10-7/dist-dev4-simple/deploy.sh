#!/bin/bash

DEPLOYMENT_PATH="/var/www/dlt.aurigraph.io"
SERVICE_NAME="aurigraph-dev4"

echo "🔧 Deploying Aurigraph V10 to dlt.aurigraph.io"

# Create directories
sudo mkdir -p $DEPLOYMENT_PATH
sudo mkdir -p /var/log/aurigraph
sudo chown -R aurigraph:aurigraph $DEPLOYMENT_PATH
sudo chown -R aurigraph:aurigraph /var/log/aurigraph

# Stop existing service
sudo systemctl stop $SERVICE_NAME 2>/dev/null || true

# Copy files
cp -r * $DEPLOYMENT_PATH/
cd $DEPLOYMENT_PATH

# Install dependencies
npm install --production

# Install systemd service
sudo cp aurigraph-dev4.service /etc/systemd/system/
sudo systemctl daemon-reload

# Setup nginx
sudo cp nginx-dlt.aurigraph.io.conf /etc/nginx/sites-available/dlt.aurigraph.io
sudo ln -sf /etc/nginx/sites-available/dlt.aurigraph.io /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx

# Setup SSL with Let's Encrypt (if not exists)
if [ ! -f /etc/letsencrypt/live/dlt.aurigraph.io/fullchain.pem ]; then
    echo "Setting up SSL certificate..."
    sudo certbot certonly --nginx -d dlt.aurigraph.io -d www.dlt.aurigraph.io --non-interactive --agree-tos -m admin@aurigraph.io
fi

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
