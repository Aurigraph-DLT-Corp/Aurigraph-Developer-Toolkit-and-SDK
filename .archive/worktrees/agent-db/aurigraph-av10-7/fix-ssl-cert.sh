#!/bin/bash

# Fix SSL Certificate for dlt.aurigraph.io

echo "═══════════════════════════════════════════════════════"
echo "🔐 Fixing SSL Certificate Issues for dlt.aurigraph.io"
echo "═══════════════════════════════════════════════════════"
echo ""

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

print_status() {
    echo -e "${GREEN}✅${NC} $1"
}

print_error() {
    echo -e "${RED}❌${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}⚠️${NC} $1"
}

echo "Current SSL certificate issue:"
echo "The certificate at /etc/letsencrypt/live/aurcrt/ is not valid for dlt.aurigraph.io"
echo ""

# Option 1: Generate new certificate for dlt.aurigraph.io
echo "═══════════════════════════════════════════════════════"
echo "Option 1: Generate New Certificate (Recommended)"
echo "═══════════════════════════════════════════════════════"
echo ""
echo "Run these commands on your server with sudo access:"
echo ""
echo "# Stop any services using port 80"
echo "sudo systemctl stop nginx"
echo ""
echo "# Generate new certificate for dlt.aurigraph.io"
echo "sudo certbot certonly --standalone -d dlt.aurigraph.io --email admin@aurigraph.io --agree-tos --non-interactive"
echo ""
echo "# The new certificate will be at:"
echo "# /etc/letsencrypt/live/dlt.aurigraph.io/fullchain.pem"
echo "# /etc/letsencrypt/live/dlt.aurigraph.io/privkey.pem"
echo ""

# Option 2: Use HTTP only for now
echo "═══════════════════════════════════════════════════════"
echo "Option 2: Use HTTP Only (Immediate Solution)"
echo "═══════════════════════════════════════════════════════"
echo ""

# Create HTTP-only nginx config
cat > nginx-http-only.conf << 'EOF'
# HTTP-only configuration for dlt.aurigraph.io
# This avoids SSL certificate errors

server {
    listen 80;
    server_name dlt.aurigraph.io;

    # Security headers (without HSTS)
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    
    # Proxy to Aurigraph DLT
    location / {
        proxy_pass http://localhost:8080;
        proxy_http_version 1.1;
        
        # WebSocket support
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_cache_bypass $http_upgrade;
        
        # Headers
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 300s;
        proxy_read_timeout 300s;
        
        # Remove any HSTS headers
        proxy_hide_header Strict-Transport-Security;
    }
    
    # Health check
    location /health {
        proxy_pass http://localhost:8080/health;
        access_log off;
    }
}
EOF

print_status "Created HTTP-only nginx configuration"

# Option 3: Use self-signed certificate for testing
echo ""
echo "═══════════════════════════════════════════════════════"
echo "Option 3: Create Self-Signed Certificate (Testing Only)"
echo "═══════════════════════════════════════════════════════"
echo ""

cat > create-self-signed.sh << 'EOF'
#!/bin/bash
# Create self-signed certificate for testing

DOMAIN="dlt.aurigraph.io"
CERT_DIR="./ssl"

mkdir -p $CERT_DIR

# Generate private key
openssl genrsa -out $CERT_DIR/privkey.pem 2048

# Generate certificate signing request
openssl req -new -key $CERT_DIR/privkey.pem \
    -out $CERT_DIR/cert.csr \
    -subj "/C=US/ST=State/L=City/O=Aurigraph DLT/CN=$DOMAIN"

# Generate self-signed certificate
openssl x509 -req -days 365 \
    -in $CERT_DIR/cert.csr \
    -signkey $CERT_DIR/privkey.pem \
    -out $CERT_DIR/fullchain.pem

echo "Self-signed certificate created in $CERT_DIR/"
echo "Warning: Browsers will show security warning for self-signed certificates"
EOF

chmod +x create-self-signed.sh

echo ""
echo "═══════════════════════════════════════════════════════"
echo "📋 Current Workaround - Use HTTP"
echo "═══════════════════════════════════════════════════════"
echo ""
echo "Since the SSL certificate doesn't match the domain,"
echo "the platform is currently accessible via HTTP:"
echo ""
echo "✅ Working URLs:"
echo "  • http://dlt.aurigraph.io (if DNS is configured)"
echo "  • http://localhost:8080"
echo "  • http://106.222.203.240:8080"
echo ""
echo "Cloudflare Tunnel (HTTPS with valid cert):"
echo "  • https://british-revenues-computer-southwest.trycloudflare.com"
echo ""
echo "═══════════════════════════════════════════════════════"
echo "🔧 To Fix SSL Permanently:"
echo "═══════════════════════════════════════════════════════"
echo ""
echo "1. SSH to your server"
echo "2. Run: sudo certbot certonly --standalone -d dlt.aurigraph.io"
echo "3. Update nginx config with new certificate paths"
echo "4. Restart nginx"
echo ""
echo "Or use Cloudflare's SSL:"
echo "1. Add domain to Cloudflare"
echo "2. Enable 'Full SSL' mode"
echo "3. Use Cloudflare's proxy (orange cloud)"