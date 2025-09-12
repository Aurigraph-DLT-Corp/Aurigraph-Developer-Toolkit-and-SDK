#!/bin/bash

# Deploy Aurigraph DLT to dev4 with SSL Support
# This script sets up the platform for access at dlt.aurigraph.io

echo "═══════════════════════════════════════════════════════"
echo "🚀 Deploying Aurigraph DLT to dev4 (dlt.aurigraph.io)"
echo "═══════════════════════════════════════════════════════"
echo ""

# Configuration
DOMAIN="dlt.aurigraph.io"
APP_PORT="4004"
SSL_CERT="/etc/letsencrypt/live/aurcrt/fullchain.pem"
SSL_KEY="/etc/letsencrypt/live/aurcrt/privkey.pem"

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

# Check if dev4 service is running
if lsof -i :$APP_PORT > /dev/null 2>&1; then
    print_status "Dev4 service is already running on port $APP_PORT"
else
    print_status "Starting dev4 deployment..."
    npm run deploy:dev4 > dev4-deploy.log 2>&1 &
    DEV4_PID=$!
    sleep 5
    
    if lsof -i :$APP_PORT > /dev/null 2>&1; then
        print_status "Dev4 service started successfully (PID: $DEV4_PID)"
    else
        print_error "Failed to start dev4 service"
        exit 1
    fi
fi

# Create HTTPS proxy with Node.js
print_status "Creating HTTPS proxy configuration..."

cat > https-proxy-server.js << 'EOF'
const express = require('express');
const https = require('https');
const http = require('http');
const httpProxy = require('http-proxy-middleware');
const fs = require('fs');
const path = require('path');

const app = express();
const DOMAIN = 'dlt.aurigraph.io';
const TARGET_PORT = 4004;

// Check if we can access SSL certificates
let sslOptions = null;
const certPath = '/etc/letsencrypt/live/aurcrt/fullchain.pem';
const keyPath = '/etc/letsencrypt/live/aurcrt/privkey.pem';

try {
    if (fs.existsSync(certPath) && fs.existsSync(keyPath)) {
        sslOptions = {
            cert: fs.readFileSync(certPath),
            key: fs.readFileSync(keyPath)
        };
        console.log('🔒 SSL certificates loaded successfully');
    }
} catch (err) {
    console.log('⚠️ SSL certificates not accessible, using HTTP only');
}

// Proxy middleware
const proxyOptions = {
    target: `http://localhost:${TARGET_PORT}`,
    changeOrigin: true,
    ws: true,
    logLevel: 'info',
    onProxyReq: (proxyReq, req, res) => {
        console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
    },
    onError: (err, req, res) => {
        console.error('[PROXY ERROR]', err);
        if (!res.headersSent) {
            res.status(502).json({ 
                error: 'Service temporarily unavailable',
                message: 'Please try again in a moment'
            });
        }
    }
};

const apiProxy = httpProxy.createProxyMiddleware(proxyOptions);

// Security headers middleware
app.use((req, res, next) => {
    res.setHeader('X-Powered-By', 'Aurigraph DLT');
    res.setHeader('X-Frame-Options', 'SAMEORIGIN');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    if (req.secure) {
        res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
    }
    next();
});

// Health check
app.get('/proxy-health', (req, res) => {
    res.json({
        status: 'healthy',
        domain: DOMAIN,
        ssl: sslOptions ? 'enabled' : 'disabled',
        target: `http://localhost:${TARGET_PORT}`,
        timestamp: new Date().toISOString()
    });
});

// Proxy all requests
app.use('/', apiProxy);

// Start servers
if (sslOptions) {
    // HTTPS Server
    https.createServer(sslOptions, app).listen(443, () => {
        console.log('🔒 HTTPS server running on port 443');
        console.log(`🌐 Access at: https://${DOMAIN}`);
    });
    
    // HTTP redirect server
    http.createServer((req, res) => {
        const httpsUrl = `https://${req.headers.host}${req.url}`;
        res.writeHead(301, { Location: httpsUrl });
        res.end();
    }).listen(80, () => {
        console.log('📡 HTTP redirect server running on port 80');
    });
} else {
    // HTTP only server
    const httpPort = process.env.HTTP_PORT || 8080;
    http.createServer(app).listen(httpPort, () => {
        console.log(`📡 HTTP server running on port ${httpPort}`);
        console.log(`🌐 Access at: http://localhost:${httpPort}`);
        console.log('⚠️ SSL not configured - using HTTP only');
    });
}

// WebSocket proxy for real-time updates
const WebSocket = require('ws');
const wsTarget = `ws://localhost:4444`;

if (sslOptions) {
    const wssServer = new WebSocket.Server({ 
        server: https.createServer(sslOptions),
        path: '/ws'
    });
    
    wssServer.on('connection', (ws) => {
        const targetWs = new WebSocket(wsTarget);
        
        ws.on('message', (msg) => targetWs.send(msg));
        targetWs.on('message', (msg) => ws.send(msg));
        
        ws.on('close', () => targetWs.close());
        targetWs.on('close', () => ws.close());
    });
}

console.log('');
console.log('═══════════════════════════════════════════════════════');
console.log('✅ Proxy server initialized');
console.log('═══════════════════════════════════════════════════════');
EOF

# Install dependencies if needed
if ! npm list http-proxy-middleware > /dev/null 2>&1; then
    print_status "Installing proxy dependencies..."
    npm install express http-proxy-middleware ws
fi

# Try to start HTTPS proxy (will fallback to HTTP if SSL not accessible)
print_status "Starting HTTPS/HTTP proxy server..."
node https-proxy-server.js > proxy.log 2>&1 &
PROXY_PID=$!

sleep 3

# Check if proxy is running
if ps -p $PROXY_PID > /dev/null; then
    print_status "Proxy server started (PID: $PROXY_PID)"
else
    print_warning "Proxy server may need elevated permissions for ports 80/443"
    print_status "Starting on alternate port 8080..."
    HTTP_PORT=8080 node https-proxy-server.js > proxy.log 2>&1 &
    PROXY_PID=$!
    sleep 2
fi

# Test local access
print_status "Testing local deployment..."
if curl -s http://localhost:$APP_PORT/health > /dev/null 2>&1; then
    print_status "Local dev4 service is healthy"
else
    print_error "Local dev4 service is not responding"
fi

# Display access information
echo ""
echo "═══════════════════════════════════════════════════════"
echo "🎉 Deployment Complete!"
echo "═══════════════════════════════════════════════════════"
echo ""
echo "📋 Service Status:"
echo "  • Dev4 Platform: Running on port $APP_PORT"
echo "  • Proxy Server: PID $PROXY_PID"
echo ""
echo "🔗 Access URLs:"
echo "  • Local API: http://localhost:$APP_PORT"
echo "  • Local Proxy: http://localhost:8080"
echo ""
echo "🌐 For public access at $DOMAIN:"
echo "  1. Configure DNS A record to point to your server IP"
echo "  2. Ensure ports 80/443 are accessible"
echo "  3. Run this script with sudo for ports 80/443:"
echo "     sudo node https-proxy-server.js"
echo ""
echo "📝 SSL Certificate Paths:"
echo "  • Certificate: $SSL_CERT"
echo "  • Private Key: $SSL_KEY"
echo ""
echo "🛑 To stop services:"
echo "  • kill $PROXY_PID  # Stop proxy"
echo "  • npm run stop:dev4  # Stop dev4"
echo ""
echo "📊 View logs:"
echo "  • tail -f dev4-deploy.log"
echo "  • tail -f proxy.log"