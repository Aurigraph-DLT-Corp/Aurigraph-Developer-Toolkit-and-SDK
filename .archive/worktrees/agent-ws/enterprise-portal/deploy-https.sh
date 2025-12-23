#!/bin/bash
set -e

# Deployment script for Aurigraph Enterprise Portal with HTTPS
# Server: dlt.aurigraph.io
# User: subbu

echo "🚀 Aurigraph Enterprise Portal - HTTPS Deployment"
echo "=================================================="

# Configuration
REMOTE_USER="subbu"
REMOTE_HOST="dlt.aurigraph.io"
REMOTE_PORT="2235"
REMOTE_PATH="/var/www/aurigraph-portal"
DIST_PATH="./enterprise-portal/frontend/dist"
NGINX_CONF_PATH="./enterprise-portal/nginx-https.conf"

echo "📦 Step 1: Building frontend..."
cd enterprise-portal/frontend
npm run build
cd ../..

echo "📤 Step 2: Creating deployment package..."
tar -czf portal-deploy.tar.gz -C enterprise-portal/frontend dist

echo "🔐 Step 3: Connecting to remote server..."
ssh -p ${REMOTE_PORT} ${REMOTE_USER}@${REMOTE_HOST} << 'ENDSSH'
    echo "Creating deployment directory..."
    sudo mkdir -p /var/www/aurigraph-portal
    sudo chown -R $USER:$USER /var/www/aurigraph-portal
ENDSSH

echo "📤 Step 4: Uploading files..."
scp -P ${REMOTE_PORT} portal-deploy.tar.gz ${REMOTE_USER}@${REMOTE_HOST}:/tmp/

echo "🔧 Step 5: Extracting and configuring..."
ssh -p ${REMOTE_PORT} ${REMOTE_USER}@${REMOTE_HOST} << 'ENDSSH'
    cd /var/www/aurigraph-portal
    tar -xzf /tmp/portal-deploy.tar.gz
    rm /tmp/portal-deploy.tar.gz

    echo "Files extracted successfully"
    ls -la dist/
ENDSSH

echo "🌐 Step 6: Configuring nginx with HTTPS..."
cat > nginx-https.conf << 'EOF'
# Redirect HTTP to HTTPS
server {
    listen 80;
    server_name dlt.aurigraph.io;
    return 301 https://$server_name$request_uri;
}

# HTTPS server
server {
    listen 443 ssl http2;
    server_name dlt.aurigraph.io;

    # SSL Configuration
    ssl_certificate /etc/letsencrypt/live/dlt.aurigraph.io/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/dlt.aurigraph.io/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;

    # Root directory
    root /var/www/aurigraph-portal/dist;
    index index.html;

    # Logging
    access_log /var/log/nginx/aurigraph-portal-access.log;
    error_log /var/log/nginx/aurigraph-portal-error.log;

    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript application/javascript application/xml+rss application/json;

    # SPA routing
    location / {
        try_files $uri $uri/ /index.html;
    }

    # API proxy to V11 backend
    location /api/ {
        proxy_pass http://localhost:9003;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # WebSocket proxy
    location /ws/ {
        proxy_pass http://localhost:9003;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "Upgrade";
        proxy_set_header Host $host;
        proxy_read_timeout 86400;
    }

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;

    # Cache static assets
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
EOF

scp -P ${REMOTE_PORT} nginx-https.conf ${REMOTE_USER}@${REMOTE_HOST}:/tmp/

echo "🔧 Step 7: Installing nginx configuration..."
ssh -p ${REMOTE_PORT} ${REMOTE_USER}@${REMOTE_HOST} << 'ENDSSH'
    sudo cp /tmp/nginx-https.conf /etc/nginx/sites-available/aurigraph-portal
    sudo ln -sf /etc/nginx/sites-available/aurigraph-portal /etc/nginx/sites-enabled/
    sudo nginx -t
    sudo systemctl reload nginx
    rm /tmp/nginx-https.conf
ENDSSH

echo "✅ Deployment complete!"
echo ""
echo "🌐 Portal URL: https://dlt.aurigraph.io"
echo "📊 Status: Check https://dlt.aurigraph.io/health"
echo ""
echo "To obtain SSL certificate (if not already installed):"
echo "  ssh -p ${REMOTE_PORT} ${REMOTE_USER}@${REMOTE_HOST}"
echo "  sudo certbot --nginx -d dlt.aurigraph.io"

rm -f portal-deploy.tar.gz nginx-https.conf
