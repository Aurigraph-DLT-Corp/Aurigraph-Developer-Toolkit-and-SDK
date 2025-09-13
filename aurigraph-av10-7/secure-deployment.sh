#!/bin/bash

# Secure Deployment Script for Aurigraph DLT with SSL
# Uses existing Let's Encrypt certificates

echo "═══════════════════════════════════════════════════════"
echo "🔒 Aurigraph DLT - Secure HTTPS Deployment"
echo "═══════════════════════════════════════════════════════"
echo ""

# Configuration
SSL_CERT="/etc/letsencrypt/live/aurcrt/fullchain.pem"
SSL_KEY="/etc/letsencrypt/live/aurcrt/privkey.pem"
APP_PORT="4004"
HTTPS_PORT="443"

# Color codes
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

# Check if SSL certificates exist
if [ -f "$SSL_CERT" ] && [ -f "$SSL_KEY" ]; then
    print_status "SSL certificates found"
    echo "  Certificate: $SSL_CERT"
    echo "  Private Key: $SSL_KEY"
else
    print_error "SSL certificates not found at specified paths"
    echo "  Expected cert: $SSL_CERT"
    echo "  Expected key: $SSL_KEY"
    exit 1
fi

# Create HTTPS proxy configuration
print_status "Creating secure proxy configuration..."

cat > https-proxy.js << 'EOF'
const express = require('express');
const https = require('https');
const httpProxy = require('http-proxy-middleware');
const fs = require('fs');
const path = require('path');

const app = express();

// SSL Configuration
const sslOptions = {
    cert: fs.readFileSync('/etc/letsencrypt/live/aurcrt/fullchain.pem'),
    key: fs.readFileSync('/etc/letsencrypt/live/aurcrt/privkey.pem')
};

// Proxy configuration
const apiProxy = httpProxy.createProxyMiddleware({
    target: 'http://localhost:4004',
    changeOrigin: true,
    ws: true,
    logLevel: 'info',
    onProxyReq: (proxyReq, req, res) => {
        console.log(`[PROXY] ${req.method} ${req.url}`);
    },
    onError: (err, req, res) => {
        console.error('[PROXY ERROR]', err);
        res.status(500).json({ error: 'Proxy error', details: err.message });
    }
});

// Security headers
app.use((req, res, next) => {
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
    res.setHeader('X-Frame-Options', 'SAMEORIGIN');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    next();
});

// Health check endpoint
app.get('/https-health', (req, res) => {
    res.json({
        status: 'healthy',
        secure: true,
        timestamp: new Date().toISOString()
    });
});

// Proxy all other requests
app.use('/', apiProxy);

// Start HTTPS server
const httpsPort = process.env.HTTPS_PORT || 443;
https.createServer(sslOptions, app).listen(httpsPort, () => {
    console.log(`🔒 Secure HTTPS proxy running on port ${httpsPort}`);
    console.log(`🔗 Proxying to http://localhost:4004`);
    console.log(`✅ SSL/TLS enabled with Let's Encrypt certificates`);
});

// Redirect HTTP to HTTPS
const http = require('http');
http.createServer((req, res) => {
    res.writeHead(301, { Location: `https://${req.headers.host}${req.url}` });
    res.end();
}).listen(80, () => {
    console.log('📡 HTTP redirect server running on port 80');
});
EOF

# Install required packages if not present
if ! npm list http-proxy-middleware > /dev/null 2>&1; then
    print_status "Installing proxy dependencies..."
    npm install express http-proxy-middleware
fi

# Stop any existing proxy
pkill -f "https-proxy.js" 2>/dev/null

# Start the secure proxy
print_status "Starting secure HTTPS proxy..."
sudo node https-proxy.js &
PROXY_PID=$!

sleep 2

# Verify HTTPS is working
print_status "Verifying HTTPS setup..."
if curl -k https://localhost/health > /dev/null 2>&1; then
    print_status "HTTPS proxy is running successfully"
else
    print_error "HTTPS proxy failed to start"
fi

echo ""
echo "═══════════════════════════════════════════════════════"
echo "🎉 Secure Deployment Complete!"
echo "═══════════════════════════════════════════════════════"
echo ""
echo "Access URLs:"
echo "  🔒 HTTPS: https://dlt.aurigraph.io"
echo "  🔒 HTTPS: https://localhost:443"
echo "  📍 Local: http://localhost:4004"
echo ""
echo "SSL Certificate Info:"
echo "  Certificate: $SSL_CERT"
echo "  Private Key: $SSL_KEY"
echo "  Provider: Let's Encrypt"
echo ""
echo "Security Features:"
echo "  ✅ TLS 1.2/1.3 enabled"
echo "  ✅ HSTS header configured"
echo "  ✅ XSS protection enabled"
echo "  ✅ HTTP → HTTPS redirect"
echo ""
echo "Process PID: $PROXY_PID"
echo "To stop: sudo kill $PROXY_PID"