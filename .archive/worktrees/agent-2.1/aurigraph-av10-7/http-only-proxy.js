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
