#!/bin/bash

# Fix HSTS and SSL issues for dlt.aurigraph.io

echo "═══════════════════════════════════════════════════════"
echo "🔧 Fixing HSTS and SSL Configuration"
echo "═══════════════════════════════════════════════════════"
echo ""

# Kill existing processes
echo "🛑 Stopping existing services..."
pkill -f "https-proxy-server.js"
pkill -f "cloudflared"

# Create a simpler HTTP-only proxy first
cat > http-only-proxy.js << 'EOF'
const express = require('express');
const httpProxy = require('http-proxy-middleware');
const app = express();

// Remove HSTS and security headers that might cause issues
app.use((req, res, next) => {
    // Don't set HSTS for now
    res.removeHeader('Strict-Transport-Security');
    res.setHeader('X-Powered-By', 'Aurigraph DLT');
    next();
});

// Proxy configuration
const apiProxy = httpProxy.createProxyMiddleware({
    target: 'http://localhost:4004',
    changeOrigin: true,
    ws: true,
    logLevel: 'info',
    onProxyReq: (proxyReq, req, res) => {
        // Remove HSTS from proxied requests
        proxyReq.removeHeader('Strict-Transport-Security');
        console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
    },
    onProxyRes: (proxyRes, req, res) => {
        // Remove HSTS from responses
        delete proxyRes.headers['strict-transport-security'];
    }
});

// Health check
app.get('/health', (req, res) => {
    res.json({
        status: 'healthy',
        mode: 'http-only',
        hsts: 'disabled',
        timestamp: new Date().toISOString()
    });
});

// Proxy all other requests
app.use('/', apiProxy);

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
    console.log(`📡 HTTP proxy running on port ${PORT}`);
    console.log(`🔗 Access at: http://localhost:${PORT}`);
    console.log('⚠️  HSTS disabled to avoid conflicts');
});
EOF

echo "✅ Created HTTP-only proxy without HSTS"

# Start the HTTP proxy
echo "🚀 Starting HTTP proxy..."
PORT=8080 node http-only-proxy.js &
HTTP_PROXY_PID=$!

sleep 2

# Test the proxy
echo "🔍 Testing proxy..."
if curl -s http://localhost:8080/health > /dev/null 2>&1; then
    echo "✅ HTTP proxy is working"
else
    echo "❌ HTTP proxy failed to start"
fi

echo ""
echo "═══════════════════════════════════════════════════════"
echo "📋 HSTS Fix Instructions"
echo "═══════════════════════════════════════════════════════"
echo ""
echo "If you're still seeing HSTS errors in your browser:"
echo ""
echo "🌐 Chrome:"
echo "  1. Go to: chrome://net-internals/#hsts"
echo "  2. Under 'Delete domain security policies'"
echo "  3. Enter: dlt.aurigraph.io"
echo "  4. Click 'Delete'"
echo ""
echo "🦊 Firefox:"
echo "  1. Close all tabs with dlt.aurigraph.io"
echo "  2. Clear history for the domain"
echo "  3. Or use Private/Incognito mode"
echo ""
echo "🧭 Safari:"
echo "  1. Safari → Preferences → Privacy"
echo "  2. Manage Website Data"
echo "  3. Search for 'aurigraph' and Remove"
echo ""
echo "═══════════════════════════════════════════════════════"
echo "🔗 Access Points:"
echo "═══════════════════════════════════════════════════════"
echo ""
echo "✅ Use these URLs to access without HSTS issues:"
echo "  • Local HTTP: http://localhost:8080"
echo "  • Direct IP: http://106.222.203.240:8080"
echo ""
echo "Process PID: $HTTP_PROXY_PID"
echo "To stop: kill $HTTP_PROXY_PID"