#!/bin/bash

# Complete deployment script for dev4 at dlt.aurigraph.io
# This handles both local preparation and server deployment

echo "═══════════════════════════════════════════════════════"
echo "🚀 Complete Dev4 Deployment for dlt.aurigraph.io"
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
SERVER_IP="106.222.203.240"
APP_PORT="4004"
PROXY_PORT="8080"
EMAIL="admin@aurigraph.io"

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

# Function to check if running locally or on server
check_environment() {
    if [ -f /etc/letsencrypt/live/aurcrt/fullchain.pem ]; then
        echo "Running on server with existing certificates"
        return 1
    else
        echo "Running locally"
        return 0
    fi
}

# LOCAL DEPLOYMENT SECTION
deploy_locally() {
    echo ""
    echo "═══════════════════════════════════════════════════════"
    echo "📦 Local Deployment Preparation"
    echo "═══════════════════════════════════════════════════════"
    echo ""
    
    # Kill existing processes
    print_info "Stopping existing services..."
    pkill -f "npm run dev4" 2>/dev/null
    pkill -f "node.*proxy" 2>/dev/null
    pkill -f "cloudflared" 2>/dev/null
    lsof -i :$APP_PORT | tail -n +2 | awk '{print $2}' | xargs kill -9 2>/dev/null
    lsof -i :$PROXY_PORT | tail -n +2 | awk '{print $2}' | xargs kill -9 2>/dev/null
    
    # Build the project
    print_info "Building Aurigraph V10..."
    npm run build
    
    if [ $? -ne 0 ]; then
        print_error "Build failed"
        exit 1
    fi
    print_status "Build completed"
    
    # Start dev4 deployment
    print_info "Starting dev4 deployment..."
    npm run dev4 > dev4.log 2>&1 &
    DEV4_PID=$!
    
    sleep 5
    
    # Check if dev4 started
    if curl -s http://localhost:$APP_PORT/health > /dev/null 2>&1; then
        print_status "Dev4 running on port $APP_PORT (PID: $DEV4_PID)"
    else
        print_error "Dev4 failed to start"
        cat dev4.log
        exit 1
    fi
    
    # Create and start HTTP proxy
    print_info "Creating HTTP proxy..."
    
    cat > http-proxy.js << 'EOF'
const express = require('express');
const httpProxy = require('http-proxy-middleware');
const app = express();

const DOMAIN = process.env.DOMAIN || 'dlt.aurigraph.io';
const TARGET_PORT = process.env.TARGET_PORT || '4004';
const PROXY_PORT = process.env.PROXY_PORT || '8080';

// Remove problematic headers
app.use((req, res, next) => {
    res.removeHeader('Strict-Transport-Security');
    res.setHeader('X-Powered-By', 'Aurigraph DLT V10');
    next();
});

// Proxy configuration
const apiProxy = httpProxy.createProxyMiddleware({
    target: `http://localhost:${TARGET_PORT}`,
    changeOrigin: true,
    ws: true,
    logLevel: 'info',
    onProxyReq: (proxyReq, req, res) => {
        console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
    },
    onProxyRes: (proxyRes, req, res) => {
        delete proxyRes.headers['strict-transport-security'];
    },
    onError: (err, req, res) => {
        console.error('Proxy error:', err);
        res.status(502).json({ error: 'Proxy error', details: err.message });
    }
});

// Health check
app.get('/health', (req, res) => {
    res.json({
        status: 'healthy',
        service: 'Aurigraph DLT Dev4',
        version: '10.7',
        mode: 'http-proxy',
        timestamp: new Date().toISOString()
    });
});

// Proxy all requests
app.use('/', apiProxy);

app.listen(PROXY_PORT, () => {
    console.log(`═══════════════════════════════════════════════════════`);
    console.log(`✅ HTTP Proxy started successfully`);
    console.log(`═══════════════════════════════════════════════════════`);
    console.log(`📡 Proxy port: ${PROXY_PORT}`);
    console.log(`🎯 Target port: ${TARGET_PORT}`);
    console.log(`🌐 Domain: ${DOMAIN}`);
    console.log(`🔗 Access at: http://localhost:${PROXY_PORT}`);
    console.log(`═══════════════════════════════════════════════════════`);
});
EOF
    
    # Start the proxy
    DOMAIN=$DOMAIN TARGET_PORT=$APP_PORT PROXY_PORT=$PROXY_PORT node http-proxy.js > proxy.log 2>&1 &
    PROXY_PID=$!
    
    sleep 2
    
    if curl -s http://localhost:$PROXY_PORT/health > /dev/null 2>&1; then
        print_status "HTTP proxy running on port $PROXY_PORT (PID: $PROXY_PID)"
    else
        print_error "Proxy failed to start"
        cat proxy.log
        exit 1
    fi
    
    # Create Cloudflare tunnel for temporary access
    print_info "Creating Cloudflare tunnel..."
    cloudflared tunnel --url http://localhost:$PROXY_PORT > cloudflare.log 2>&1 &
    CF_PID=$!
    
    sleep 5
    
    # Extract tunnel URL
    TUNNEL_URL=$(grep -o 'https://.*\.trycloudflare\.com' cloudflare.log | head -1)
    
    echo ""
    echo "═══════════════════════════════════════════════════════"
    echo "✨ Local Deployment Complete!"
    echo "═══════════════════════════════════════════════════════"
    echo ""
    echo "🔗 Access Points:"
    echo "  • Local: http://localhost:$PROXY_PORT"
    echo "  • Direct IP: http://$SERVER_IP:$PROXY_PORT"
    if [ ! -z "$TUNNEL_URL" ]; then
        echo "  • Cloudflare: $TUNNEL_URL"
    fi
    echo ""
    echo "📝 Process IDs:"
    echo "  • Dev4: $DEV4_PID"
    echo "  • Proxy: $PROXY_PID"
    echo "  • Cloudflare: $CF_PID"
    echo ""
    echo "To stop all: kill $DEV4_PID $PROXY_PID $CF_PID"
}

# SERVER DEPLOYMENT SECTION
deploy_on_server() {
    echo ""
    echo "═══════════════════════════════════════════════════════"
    echo "🖥️  Server Deployment with SSL"
    echo "═══════════════════════════════════════════════════════"
    echo ""
    
    # Check if we have sudo
    if [ "$EUID" -ne 0 ]; then 
        print_error "Server deployment requires sudo access"
        echo "Please run: sudo $0"
        exit 1
    fi
    
    # Stop existing services
    print_info "Stopping existing services..."
    systemctl stop nginx 2>/dev/null
    pkill -f "node.*aurigraph" 2>/dev/null
    
    # Check for existing certificate
    if [ -f /etc/letsencrypt/live/$DOMAIN/fullchain.pem ]; then
        print_status "SSL certificate exists for $DOMAIN"
    else
        print_warning "SSL certificate not found for $DOMAIN"
        print_info "Generating new certificate..."
        
        # Generate certificate
        certbot certonly \
            --standalone \
            -d $DOMAIN \
            --email $EMAIL \
            --agree-tos \
            --non-interactive
        
        if [ $? -eq 0 ]; then
            print_status "Certificate generated successfully"
        else
            print_error "Certificate generation failed"
            print_info "Falling back to HTTP-only mode"
        fi
    fi
    
    # Create systemd service for Aurigraph
    print_info "Creating systemd service..."
    
    cat > /etc/systemd/system/aurigraph-dev4.service << EOF
[Unit]
Description=Aurigraph DLT Dev4
After=network.target

[Service]
Type=simple
User=$USER
WorkingDirectory=/home/$USER/aurigraph-av10-7
ExecStart=/usr/bin/npm run dev4
Restart=always
RestartSec=10
Environment="NODE_ENV=production"
Environment="PORT=$APP_PORT"

[Install]
WantedBy=multi-user.target
EOF
    
    # Create nginx configuration
    print_info "Configuring nginx..."
    
    if [ -f /etc/letsencrypt/live/$DOMAIN/fullchain.pem ]; then
        # HTTPS configuration
        cat > /etc/nginx/sites-available/$DOMAIN << EOF
server {
    listen 80;
    server_name $DOMAIN;
    return 301 https://\$server_name\$request_uri;
}

server {
    listen 443 ssl http2;
    server_name $DOMAIN;
    
    ssl_certificate /etc/letsencrypt/live/$DOMAIN/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/$DOMAIN/privkey.pem;
    
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers 'ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES128-GCM-SHA256';
    ssl_prefer_server_ciphers off;
    
    location / {
        proxy_pass http://localhost:$APP_PORT;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_cache_bypass \$http_upgrade;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }
}
EOF
    else
        # HTTP-only configuration
        cat > /etc/nginx/sites-available/$DOMAIN << EOF
server {
    listen 80;
    server_name $DOMAIN;
    
    location / {
        proxy_pass http://localhost:$APP_PORT;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_cache_bypass \$http_upgrade;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto http;
    }
}
EOF
    fi
    
    # Enable site
    ln -sf /etc/nginx/sites-available/$DOMAIN /etc/nginx/sites-enabled/
    rm -f /etc/nginx/sites-enabled/default
    
    # Test and reload nginx
    nginx -t
    if [ $? -eq 0 ]; then
        systemctl start nginx
        systemctl enable nginx
        print_status "Nginx configured and started"
    else
        print_error "Nginx configuration error"
        exit 1
    fi
    
    # Start Aurigraph service
    systemctl daemon-reload
    systemctl start aurigraph-dev4
    systemctl enable aurigraph-dev4
    
    if systemctl is-active --quiet aurigraph-dev4; then
        print_status "Aurigraph Dev4 service started"
    else
        print_error "Failed to start Aurigraph service"
        journalctl -u aurigraph-dev4 -n 20
        exit 1
    fi
    
    echo ""
    echo "═══════════════════════════════════════════════════════"
    echo "✨ Server Deployment Complete!"
    echo "═══════════════════════════════════════════════════════"
    echo ""
    if [ -f /etc/letsencrypt/live/$DOMAIN/fullchain.pem ]; then
        echo "🔗 Access at: https://$DOMAIN"
    else
        echo "🔗 Access at: http://$DOMAIN"
    fi
    echo ""
    echo "📋 Service status:"
    systemctl status aurigraph-dev4 --no-pager
}

# MAIN EXECUTION
echo "Checking environment..."
check_environment

if [ $? -eq 0 ]; then
    # Running locally
    deploy_locally
else
    # Running on server
    deploy_on_server
fi

echo ""
echo "═══════════════════════════════════════════════════════"
echo "📋 DNS Configuration Required"
echo "═══════════════════════════════════════════════════════"
echo ""
echo "Ensure your DNS is configured:"
echo "  Type: A"
echo "  Name: dlt"
echo "  Value: $SERVER_IP"
echo "  TTL: 300"
echo ""
echo "DNS Provider Instructions:"
echo "  • GoDaddy: DNS → Manage Zones → Add Record"
echo "  • Cloudflare: DNS → Records → Add Record"
echo "  • Namecheap: Advanced DNS → Add New Record"
echo ""
echo "Test DNS propagation:"
echo "  nslookup $DOMAIN"
echo "  dig $DOMAIN"
echo ""