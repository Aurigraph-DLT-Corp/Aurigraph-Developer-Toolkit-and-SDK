#!/bin/bash

# Generate proper SSL certificate for dlt.aurigraph.io
# This script should be run on the server with sudo access

echo "═══════════════════════════════════════════════════════"
echo "🔐 SSL Certificate Generation for dlt.aurigraph.io"
echo "═══════════════════════════════════════════════════════"
echo ""

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

# Configuration
DOMAIN="dlt.aurigraph.io"
EMAIL="admin@aurigraph.io"
CERT_PATH="/etc/letsencrypt/live/$DOMAIN"

print_status() {
    echo -e "${GREEN}✅${NC} $1"
}

print_error() {
    echo -e "${RED}❌${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}⚠️${NC} $1"
}

print_info() {
    echo -e "${BLUE}ℹ️${NC} $1"
}

# Check if running with sudo
if [ "$EUID" -ne 0 ]; then 
    print_error "This script must be run with sudo"
    echo "Please run: sudo $0"
    exit 1
fi

# Step 1: Install certbot if not present
echo ""
echo "Step 1: Checking for certbot..."
if ! command -v certbot &> /dev/null; then
    print_warning "Certbot not found. Installing..."
    if [ -f /etc/debian_version ]; then
        # Debian/Ubuntu
        apt-get update
        apt-get install -y certbot
    elif [ -f /etc/redhat-release ]; then
        # RHEL/CentOS/Fedora
        yum install -y certbot
    elif [ -f /etc/arch-release ]; then
        # Arch Linux
        pacman -S certbot
    else
        print_error "Unable to detect OS for certbot installation"
        exit 1
    fi
    print_status "Certbot installed"
else
    print_status "Certbot is already installed"
fi

# Step 2: Stop services using port 80
echo ""
echo "Step 2: Stopping services on port 80..."
if systemctl is-active --quiet nginx; then
    systemctl stop nginx
    print_status "Stopped nginx"
fi

# Kill any process on port 80
if lsof -i :80 > /dev/null 2>&1; then
    lsof -i :80 | tail -n +2 | awk '{print $2}' | xargs kill -9 2>/dev/null
    print_status "Killed processes on port 80"
fi

# Step 3: Generate certificate
echo ""
echo "Step 3: Generating SSL certificate..."
print_info "Domain: $DOMAIN"
print_info "Email: $EMAIL"

certbot certonly \
    --standalone \
    -d $DOMAIN \
    --email $EMAIL \
    --agree-tos \
    --non-interactive \
    --force-renewal

if [ $? -eq 0 ]; then
    print_status "SSL certificate generated successfully"
    echo ""
    print_info "Certificate location:"
    echo "  • Full chain: $CERT_PATH/fullchain.pem"
    echo "  • Private key: $CERT_PATH/privkey.pem"
else
    print_error "Failed to generate certificate"
    exit 1
fi

# Step 4: Create nginx configuration with new certificate
echo ""
echo "Step 4: Creating nginx configuration..."

cat > /etc/nginx/sites-available/dlt.aurigraph.io << EOF
# HTTP redirect to HTTPS
server {
    listen 80;
    server_name $DOMAIN;
    
    # Redirect all HTTP traffic to HTTPS
    return 301 https://\$server_name\$request_uri;
}

# HTTPS server
server {
    listen 443 ssl http2;
    server_name $DOMAIN;
    
    # SSL Certificate (correct path for dlt.aurigraph.io)
    ssl_certificate $CERT_PATH/fullchain.pem;
    ssl_certificate_key $CERT_PATH/privkey.pem;
    
    # SSL Configuration
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers 'ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES256-GCM-SHA384:ECDHE-ECDSA-AES256-GCM-SHA384';
    ssl_prefer_server_ciphers off;
    ssl_session_timeout 1d;
    ssl_session_cache shared:SSL:50m;
    ssl_stapling on;
    ssl_stapling_verify on;
    
    # Security Headers
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    
    # Proxy to Aurigraph DLT
    location / {
        proxy_pass http://localhost:4004;
        proxy_http_version 1.1;
        
        # WebSocket support
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_cache_bypass \$http_upgrade;
        
        # Headers
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        
        # Timeouts for high-performance operations
        proxy_connect_timeout 60s;
        proxy_send_timeout 300s;
        proxy_read_timeout 300s;
        
        # Buffer sizes for large transactions
        proxy_buffer_size 128k;
        proxy_buffers 4 256k;
        proxy_busy_buffers_size 256k;
    }
    
    # Health check endpoint
    location /health {
        proxy_pass http://localhost:4004/health;
        access_log off;
    }
    
    # Metrics endpoint
    location /metrics {
        proxy_pass http://localhost:4004/metrics;
        allow 127.0.0.1;
        deny all;
    }
}
EOF

print_status "Nginx configuration created"

# Step 5: Enable the site
echo ""
echo "Step 5: Enabling nginx site..."
ln -sf /etc/nginx/sites-available/dlt.aurigraph.io /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default 2>/dev/null

# Test nginx configuration
nginx -t
if [ $? -eq 0 ]; then
    print_status "Nginx configuration is valid"
else
    print_error "Nginx configuration has errors"
    exit 1
fi

# Step 6: Start nginx
echo ""
echo "Step 6: Starting nginx..."
systemctl start nginx
systemctl enable nginx

if systemctl is-active --quiet nginx; then
    print_status "Nginx started successfully"
else
    print_error "Failed to start nginx"
    exit 1
fi

# Step 7: Setup certificate auto-renewal
echo ""
echo "Step 7: Setting up auto-renewal..."

# Create renewal hook script
cat > /etc/letsencrypt/renewal-hooks/deploy/reload-nginx.sh << 'EOF'
#!/bin/bash
systemctl reload nginx
EOF

chmod +x /etc/letsencrypt/renewal-hooks/deploy/reload-nginx.sh

# Add cron job for renewal
(crontab -l 2>/dev/null; echo "0 0,12 * * * certbot renew --quiet") | crontab -

print_status "Auto-renewal configured"

# Step 8: Verify certificate
echo ""
echo "Step 8: Verifying certificate..."
if openssl x509 -in $CERT_PATH/fullchain.pem -noout -text | grep -q "CN=$DOMAIN"; then
    print_status "Certificate is valid for $DOMAIN"
    
    # Get certificate details
    echo ""
    print_info "Certificate details:"
    openssl x509 -in $CERT_PATH/fullchain.pem -noout -dates | sed 's/^/  /'
    echo ""
    openssl x509 -in $CERT_PATH/fullchain.pem -noout -subject | sed 's/^/  /'
else
    print_error "Certificate validation failed"
fi

# Final status
echo ""
echo "═══════════════════════════════════════════════════════"
echo "✨ SSL Certificate Setup Complete!"
echo "═══════════════════════════════════════════════════════"
echo ""
echo "🔗 Access your site at:"
echo "  • https://$DOMAIN"
echo ""
echo "📋 Certificate files:"
echo "  • $CERT_PATH/fullchain.pem"
echo "  • $CERT_PATH/privkey.pem"
echo ""
echo "🔄 Auto-renewal is configured via cron"
echo ""
echo "🚀 Next steps:"
echo "  1. Ensure DNS A record points to this server"
echo "  2. Test HTTPS access: curl -I https://$DOMAIN"
echo "  3. Check SSL rating: https://www.ssllabs.com/ssltest/"
echo ""