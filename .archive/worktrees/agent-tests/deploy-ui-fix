#!/bin/bash

# Deploy UI fix to dlt.aurigraph.io
echo "🚀 Deploying UI fix to dlt.aurigraph.io"
echo "========================================"

# Create directory for static files
sudo mkdir -p /var/www/aurigraph
sudo chown -R www-data:www-data /var/www/aurigraph

# Copy dashboard HTML
sudo cp demo-dashboard-https.html /var/www/aurigraph/index.html

# Backup current nginx config
sudo cp /etc/nginx/sites-available/dlt.aurigraph.io /etc/nginx/sites-available/dlt.aurigraph.io.backup

# Update nginx configuration
sudo cp nginx-ui-fix.conf /etc/nginx/sites-available/dlt.aurigraph.io

# Test nginx configuration
sudo nginx -t

if [ $? -eq 0 ]; then
    echo "✅ Nginx configuration valid"
    sudo systemctl reload nginx
    echo "✅ Nginx reloaded successfully"
    echo ""
    echo "🎉 UI fix deployed successfully!"
    echo "Visit: https://dlt.aurigraph.io"
else
    echo "❌ Nginx configuration error"
    echo "Restoring backup..."
    sudo cp /etc/nginx/sites-available/dlt.aurigraph.io.backup /etc/nginx/sites-available/dlt.aurigraph.io
    exit 1
fi
