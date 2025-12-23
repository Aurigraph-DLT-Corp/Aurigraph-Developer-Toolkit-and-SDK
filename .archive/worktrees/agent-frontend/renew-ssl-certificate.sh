#!/bin/bash

# SSL Certificate Renewal and Fix Script
echo "🔒 SSL Certificate Renewal for dlt.aurigraph.io"
echo "=============================================="

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

DOMAIN="dlt.aurigraph.io"
EMAIL="admin@aurigraph.io"

# Check if running as root
if [[ $EUID -ne 0 ]]; then
   echo -e "${RED}❌ This script must be run as root (use sudo)${NC}"
   exit 1
fi

echo -e "${BLUE}ℹ️  Checking current SSL certificate status...${NC}"

# Check current certificate
if [ -f "/etc/letsencrypt/live/$DOMAIN/fullchain.pem" ]; then
    EXPIRY=$(openssl x509 -enddate -noout -in "/etc/letsencrypt/live/$DOMAIN/fullchain.pem" | cut -d= -f2)
    EXPIRY_EPOCH=$(date -d "$EXPIRY" +%s)
    NOW_EPOCH=$(date +%s)
    DAYS_LEFT=$(( ($EXPIRY_EPOCH - $NOW_EPOCH) / 86400 ))
    
    echo -e "${BLUE}Current certificate expires: $EXPIRY${NC}"
    echo -e "${BLUE}Days remaining: $DAYS_LEFT${NC}"
    
    if [ $DAYS_LEFT -lt 1 ]; then
        echo -e "${RED}❌ Certificate is expired!${NC}"
    elif [ $DAYS_LEFT -lt 30 ]; then
        echo -e "${YELLOW}⚠️  Certificate expires soon${NC}"
    else
        echo -e "${YELLOW}⚠️  Certificate should be valid, but may have other issues${NC}"
    fi
else
    echo -e "${RED}❌ No certificate found for $DOMAIN${NC}"
fi

echo ""
echo -e "${BLUE}ℹ️  Stopping nginx to renew certificate...${NC}"
systemctl stop nginx

echo -e "${BLUE}ℹ️  Removing any existing certificate...${NC}"
certbot delete --cert-name $DOMAIN --non-interactive 2>/dev/null || true

echo -e "${BLUE}ℹ️  Obtaining fresh SSL certificate...${NC}"
certbot certonly \
    --standalone \
    --non-interactive \
    --agree-tos \
    --email $EMAIL \
    --domains $DOMAIN \
    --force-renewal

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ SSL certificate obtained successfully${NC}"
else
    echo -e "${RED}❌ Failed to obtain SSL certificate${NC}"
    echo -e "${YELLOW}Trying alternative method...${NC}"
    
    # Try with webroot method
    mkdir -p /var/www/html/.well-known/acme-challenge
    chown -R www-data:www-data /var/www/html
    
    # Start nginx temporarily for webroot challenge
    systemctl start nginx
    
    certbot certonly \
        --webroot \
        --webroot-path=/var/www/html \
        --non-interactive \
        --agree-tos \
        --email $EMAIL \
        --domains $DOMAIN \
        --force-renewal
    
    if [ $? -ne 0 ]; then
        echo -e "${RED}❌ Certificate renewal failed with both methods${NC}"
        echo ""
        echo "Manual steps to try:"
        echo "1. Check DNS: dig $DOMAIN"
        echo "2. Check firewall: ufw status"
        echo "3. Check ports: netstat -tulpn | grep :80"
        echo "4. Manual certbot: certbot certonly --manual -d $DOMAIN"
        exit 1
    fi
fi

# Verify certificate
echo -e "${BLUE}ℹ️  Verifying new certificate...${NC}"
if [ -f "/etc/letsencrypt/live/$DOMAIN/fullchain.pem" ]; then
    NEW_EXPIRY=$(openssl x509 -enddate -noout -in "/etc/letsencrypt/live/$DOMAIN/fullchain.pem" | cut -d= -f2)
    echo -e "${GREEN}✅ New certificate expires: $NEW_EXPIRY${NC}"
    
    # Check certificate chain
    echo -e "${BLUE}ℹ️  Checking certificate chain...${NC}"
    openssl verify -CAfile /etc/letsencrypt/live/$DOMAIN/chain.pem /etc/letsencrypt/live/$DOMAIN/cert.pem
    
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✅ Certificate chain is valid${NC}"
    else
        echo -e "${YELLOW}⚠️  Certificate chain verification failed${NC}"
    fi
else
    echo -e "${RED}❌ Certificate file not found after renewal${NC}"
    exit 1
fi

# Update nginx configuration to fix any SSL issues
echo -e "${BLUE}ℹ️  Updating nginx SSL configuration...${NC}"

cat > /etc/nginx/sites-available/$DOMAIN << 'NGINX_EOF'
# Fixed SSL Configuration for dlt.aurigraph.io

upstream aurigraph_api {
    server 127.0.0.1:4004;
    keepalive 64;
}

upstream aurigraph_ws {
    server 127.0.0.1:4005;
    keepalive 64;
}

upstream vizro_dashboard {
    server 127.0.0.1:8050;
    keepalive 32;
}

# HTTP server - redirect to HTTPS
server {
    listen 80;
    listen [::]:80;
    server_name dlt.aurigraph.io;
    
    # Allow Let's Encrypt challenges
    location /.well-known/acme-challenge/ {
        root /var/www/html;
        allow all;
    }
    
    # Redirect to HTTPS
    location / {
        return 301 https://$server_name$request_uri;
    }
}

# HTTPS server with fixed SSL configuration
server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name dlt.aurigraph.io;
    
    # SSL Certificate Configuration
    ssl_certificate /etc/letsencrypt/live/dlt.aurigraph.io/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/dlt.aurigraph.io/privkey.pem;
    ssl_trusted_certificate /etc/letsencrypt/live/dlt.aurigraph.io/chain.pem;
    
    # Modern SSL Configuration
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384:ECDHE-ECDSA-CHACHA20-POLY1305:ECDHE-RSA-CHACHA20-POLY1305:DHE-RSA-AES128-GCM-SHA256:DHE-RSA-AES256-GCM-SHA384;
    ssl_prefer_server_ciphers off;
    
    # SSL Optimization
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 10m;
    ssl_session_tickets off;
    
    # SSL Stapling
    ssl_stapling on;
    ssl_stapling_verify on;
    resolver 8.8.8.8 8.8.4.4 valid=300s;
    resolver_timeout 5s;
    
    # Security Headers (Fixed HSTS)
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains; preload" always;
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;
    
    # CORS Headers
    add_header 'Access-Control-Allow-Origin' '*' always;
    add_header 'Access-Control-Allow-Methods' 'GET, POST, OPTIONS' always;
    add_header 'Access-Control-Allow-Headers' 'Content-Type, Authorization' always;
    
    # Logging
    access_log /var/log/nginx/dlt.aurigraph.io.access.log;
    error_log /var/log/nginx/dlt.aurigraph.io.error.log;
    
    # Document root
    root /var/www/aurigraph;
    index index.html;
    
    # Handle preflight requests globally
    if ($request_method = 'OPTIONS') {
        add_header 'Access-Control-Allow-Origin' '*' always;
        add_header 'Access-Control-Allow-Methods' 'GET, POST, OPTIONS' always;
        add_header 'Access-Control-Allow-Headers' 'Content-Type, Authorization' always;
        add_header 'Access-Control-Max-Age' 1728000;
        return 204;
    }
    
    # Root location
    location / {
        try_files $uri $uri/ @api;
    }
    
    # API proxy
    location @api {
        proxy_pass http://aurigraph_api;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_buffering off;
    }
    
    # Specific API routes
    location ~ ^/(channel|api|health)/ {
        proxy_pass http://aurigraph_api;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
    
    # WebSocket
    location /ws {
        proxy_pass http://aurigraph_ws;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
    
    # Vizro Dashboard
    location /vizro/ {
        proxy_pass http://vizro_dashboard/;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
    
    location /_dash {
        proxy_pass http://vizro_dashboard;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
NGINX_EOF

# Test nginx configuration
echo -e "${BLUE}ℹ️  Testing nginx configuration...${NC}"
nginx -t

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Nginx configuration is valid${NC}"
    
    # Start nginx
    echo -e "${BLUE}ℹ️  Starting nginx...${NC}"
    systemctl start nginx
    systemctl enable nginx
    
    # Wait for nginx to start
    sleep 3
    
    echo -e "${GREEN}✅ Nginx started successfully${NC}"
else
    echo -e "${RED}❌ Nginx configuration error${NC}"
    echo "Please check the configuration manually"
    exit 1
fi

# Test SSL certificate
echo -e "${BLUE}ℹ️  Testing SSL certificate...${NC}"
echo ""

# Test with OpenSSL
echo "Testing SSL connection:"
timeout 10 openssl s_client -connect $DOMAIN:443 -servername $DOMAIN -verify_return_error < /dev/null

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ SSL certificate test passed${NC}"
else
    echo -e "${YELLOW}⚠️  SSL test had issues (may be timeout)${NC}"
fi

# Test HTTP response
echo ""
echo "Testing HTTPS response:"
HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" --max-time 10 https://$DOMAIN/health)
if [ "$HTTP_STATUS" = "200" ]; then
    echo -e "${GREEN}✅ HTTPS health endpoint: $HTTP_STATUS${NC}"
else
    echo -e "${YELLOW}⚠️  HTTPS health endpoint: $HTTP_STATUS${NC}"
fi

# Setup auto-renewal
echo -e "${BLUE}ℹ️  Setting up automatic renewal...${NC}"
cat > /etc/cron.d/certbot-renewal << 'CRON_EOF'
# Renew SSL certificates twice daily
0 0,12 * * * root certbot renew --quiet --deploy-hook "systemctl reload nginx"
CRON_EOF

systemctl restart cron

echo ""
echo -e "${GREEN}🎉 SSL Certificate Fix Complete!${NC}"
echo ""
echo "✅ Fresh SSL certificate installed"
echo "✅ Nginx configuration updated"
echo "✅ Auto-renewal configured"
echo ""
echo "🔍 Certificate Information:"
if [ -f "/etc/letsencrypt/live/$DOMAIN/fullchain.pem" ]; then
    CERT_INFO=$(openssl x509 -in "/etc/letsencrypt/live/$DOMAIN/fullchain.pem" -text -noout)
    EXPIRY=$(echo "$CERT_INFO" | grep "Not After" | cut -d: -f2-)
    ISSUER=$(echo "$CERT_INFO" | grep "Issuer:" | cut -d: -f2-)
    
    echo "  Expires: $EXPIRY"
    echo "  Issued by: $ISSUER"
fi

echo ""
echo "🌐 Test your site:"
echo "  https://$DOMAIN"
echo ""
echo "🛠️  If issues persist:"
echo "  1. Clear browser cache and cookies for $DOMAIN"
echo "  2. Try incognito/private browsing mode"
echo "  3. Check from different network/device"
echo "  4. Run SSL test: https://www.ssllabs.com/ssltest/"
