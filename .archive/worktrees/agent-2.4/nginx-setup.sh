#!/bin/bash

# Aurigraph V11 Nginx Setup Script
# Configures nginx reverse proxy with SSL for production

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Configuration
REMOTE_HOST="151.242.51.55"
REMOTE_USER="subbu"
REMOTE_PASSWORD="subbuFuture@2025"
DOMAIN="dlt.aurigraph.io"
EMAIL="subbu@aurigraph.io"

echo -e "${BLUE}================================================================${NC}"
echo -e "${BLUE}Aurigraph V11 Nginx + SSL Setup${NC}"
echo -e "${BLUE}Server: ${REMOTE_HOST}${NC}"
echo -e "${BLUE}Domain: ${DOMAIN}${NC}"
echo -e "${BLUE}================================================================${NC}"
echo ""

# SSH command
SSH_CMD="sshpass -p '${REMOTE_PASSWORD}' ssh -p 22 -o StrictHostKeyChecking=no ${REMOTE_USER}@${REMOTE_HOST}"

echo -e "${YELLOW}[1/6] Installing nginx...${NC}"

${SSH_CMD} << 'INSTALL_NGINX'
    set -e

    echo "Updating package list..."
    sudo apt-get update -qq

    echo "Installing nginx..."
    sudo apt-get install -y nginx

    echo "Starting nginx..."
    sudo systemctl start nginx
    sudo systemctl enable nginx

    echo "✓ Nginx installed and running"
INSTALL_NGINX

echo -e "${GREEN}✓ Nginx installed${NC}"
echo ""

echo -e "${YELLOW}[2/6] Configuring nginx reverse proxy...${NC}"

${SSH_CMD} << 'CONFIGURE_NGINX'
    set -e

    # Create nginx configuration
    sudo tee /etc/nginx/sites-available/aurigraph-v11 > /dev/null << 'NGINX_CONFIG'
# Aurigraph V11 Nginx Configuration
# HTTP to HTTPS redirect
server {
    listen 80;
    listen [::]:80;
    server_name dlt.aurigraph.io 151.242.51.55;

    # Redirect all HTTP to HTTPS
    location / {
        return 301 https://$server_name$request_uri;
    }

    # Let's Encrypt challenge
    location /.well-known/acme-challenge/ {
        root /var/www/html;
    }
}

# HTTPS server
server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name dlt.aurigraph.io 151.242.51.55;

    # SSL Configuration (will be updated by certbot)
    ssl_certificate /etc/ssl/certs/ssl-cert-snakeoil.pem;
    ssl_certificate_key /etc/ssl/private/ssl-cert-snakeoil.key;

    # SSL Security Settings
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 10m;

    # Security Headers
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;

    # Logging
    access_log /var/log/nginx/aurigraph-v11-access.log;
    error_log /var/log/nginx/aurigraph-v11-error.log;

    # Root location - API info
    location / {
        proxy_pass http://localhost:9003;
        proxy_http_version 1.1;

        # Proxy headers
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header X-Forwarded-Host $host;
        proxy_set_header X-Forwarded-Port $server_port;

        # WebSocket support
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";

        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    # API endpoints
    location /api/ {
        proxy_pass http://localhost:9003/api/;
        proxy_http_version 1.1;

        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        # CORS headers
        add_header Access-Control-Allow-Origin * always;
        add_header Access-Control-Allow-Methods "GET, POST, PUT, DELETE, OPTIONS" always;
        add_header Access-Control-Allow-Headers "Authorization, Content-Type" always;

        # Handle preflight
        if ($request_method = OPTIONS) {
            return 204;
        }

        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    # Quarkus endpoints
    location /q/ {
        proxy_pass http://localhost:9003/q/;
        proxy_http_version 1.1;

        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Health check endpoint
    location /health {
        proxy_pass http://localhost:9003/q/health;
        proxy_http_version 1.1;

        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;

        access_log off;
    }

    # Metrics endpoint (restrict access if needed)
    location /metrics {
        proxy_pass http://localhost:9003/q/metrics;
        proxy_http_version 1.1;

        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;

        # Uncomment to restrict access
        # allow 127.0.0.1;
        # deny all;
    }
}
NGINX_CONFIG

    # Enable the site
    sudo ln -sf /etc/nginx/sites-available/aurigraph-v11 /etc/nginx/sites-enabled/

    # Remove default site
    sudo rm -f /etc/nginx/sites-enabled/default

    # Test configuration
    sudo nginx -t

    # Reload nginx
    sudo systemctl reload nginx

    echo "✓ Nginx configured"
CONFIGURE_NGINX

echo -e "${GREEN}✓ Nginx configured${NC}"
echo ""

echo -e "${YELLOW}[3/6] Installing certbot for SSL...${NC}"

${SSH_CMD} << 'INSTALL_CERTBOT'
    set -e

    echo "Installing certbot..."
    sudo apt-get install -y certbot python3-certbot-nginx

    echo "✓ Certbot installed"
INSTALL_CERTBOT

echo -e "${GREEN}✓ Certbot installed${NC}"
echo ""

echo -e "${YELLOW}[4/6] Configuring firewall...${NC}"

${SSH_CMD} << 'CONFIGURE_FIREWALL'
    set -e

    echo "Configuring UFW firewall..."

    # Install UFW if not present
    sudo apt-get install -y ufw

    # Allow SSH
    sudo ufw allow 22/tcp

    # Allow HTTP and HTTPS
    sudo ufw allow 80/tcp
    sudo ufw allow 443/tcp

    # Enable firewall (non-interactive)
    echo "y" | sudo ufw enable || true

    # Show status
    sudo ufw status

    echo "✓ Firewall configured"
CONFIGURE_FIREWALL

echo -e "${GREEN}✓ Firewall configured${NC}"
echo ""

echo -e "${YELLOW}[5/6] Setting up SSL certificate...${NC}"
echo -e "${BLUE}Note: This requires DNS to be properly configured for ${DOMAIN}${NC}"
echo -e "${BLUE}If DNS is not ready, SSL setup will be skipped${NC}"
echo ""

${SSH_CMD} << SETUP_SSL
    set -e

    # Test if domain resolves to this server
    DOMAIN_IP=\$(dig +short ${DOMAIN} @8.8.8.8 | tail -1)
    SERVER_IP=\$(curl -s ifconfig.me)

    if [ "\$DOMAIN_IP" = "\$SERVER_IP" ]; then
        echo "DNS is configured correctly. Setting up SSL..."

        # Get SSL certificate
        sudo certbot --nginx \
            -d ${DOMAIN} \
            --non-interactive \
            --agree-tos \
            --email ${EMAIL} \
            --redirect

        echo "✓ SSL certificate obtained"
    else
        echo "⚠ DNS not configured yet (${DOMAIN} -> \$DOMAIN_IP, expected \$SERVER_IP)"
        echo "Skipping SSL setup. Run 'sudo certbot --nginx -d ${DOMAIN}' manually when DNS is ready"
    fi
SETUP_SSL

echo -e "${GREEN}✓ SSL setup complete (or skipped if DNS not ready)${NC}"
echo ""

echo -e "${YELLOW}[6/6] Validating nginx setup...${NC}"

${SSH_CMD} << 'VALIDATE'
    set -e

    # Check nginx status
    echo "=== Nginx Status ==="
    sudo systemctl status nginx --no-pager | head -10

    echo ""
    echo "=== Nginx Configuration Test ==="
    sudo nginx -t

    echo ""
    echo "=== Listening Ports ==="
    sudo netstat -tlnp | grep nginx || sudo ss -tlnp | grep nginx

    echo ""
    echo "=== Firewall Status ==="
    sudo ufw status

    echo ""
    echo "✓ Validation complete"
VALIDATE

echo -e "${GREEN}✓ Validation complete${NC}"
echo ""

echo -e "${BLUE}================================================================${NC}"
echo -e "${GREEN}✓✓✓ NGINX SETUP COMPLETE ✓✓✓${NC}"
echo -e "${BLUE}================================================================${NC}"
echo ""

echo -e "${GREEN}Access URLs:${NC}"
echo -e "  • HTTP: http://${DOMAIN} (redirects to HTTPS)"
echo -e "  • HTTP (IP): http://${REMOTE_HOST} (redirects to HTTPS)"
echo -e "  • HTTPS: https://${DOMAIN}"
echo -e "  • HTTPS (IP): https://${REMOTE_HOST}"
echo -e "  • Health: https://${DOMAIN}/health"
echo -e "  • API: https://${DOMAIN}/api/v11/"
echo ""

echo -e "${GREEN}Management Commands:${NC}"
echo -e "  • Check nginx: ssh -p 22 ${REMOTE_USER}@${REMOTE_HOST} 'sudo systemctl status nginx'"
echo -e "  • Reload nginx: ssh -p 22 ${REMOTE_USER}@${REMOTE_HOST} 'sudo systemctl reload nginx'"
echo -e "  • View logs: ssh -p 22 ${REMOTE_USER}@${REMOTE_HOST} 'sudo tail -f /var/log/nginx/aurigraph-v11-access.log'"
echo -e "  • SSL renew: ssh -p 22 ${REMOTE_USER}@${REMOTE_HOST} 'sudo certbot renew'"
echo ""

echo -e "${BLUE}================================================================${NC}"
echo -e "${GREEN}🚀 Nginx reverse proxy is now running!${NC}"
echo -e "${BLUE}================================================================${NC}"
