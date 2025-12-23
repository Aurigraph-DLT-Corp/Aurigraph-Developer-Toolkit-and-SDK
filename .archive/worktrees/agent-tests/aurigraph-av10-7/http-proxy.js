const express = require('express');
const httpProxy = require('http-proxy-middleware');
const app = express();

const DOMAIN = process.env.DOMAIN || 'dlt.aurigraph.io';
const TARGET_PORT = process.env.TARGET_PORT || '4004';
const PROXY_PORT = process.env.PROXY_PORT || '8080';

console.log('═══════════════════════════════════════════════════════');
console.log('🚀 Starting Aurigraph DLT HTTP Proxy');
console.log('═══════════════════════════════════════════════════════');
console.log(`📡 Proxy port: ${PROXY_PORT}`);
console.log(`🎯 Target port: ${TARGET_PORT}`);
console.log(`🌐 Domain: ${DOMAIN}`);

// Remove problematic headers
app.use((req, res, next) => {
    res.removeHeader('Strict-Transport-Security');
    res.setHeader('X-Powered-By', 'Aurigraph DLT V10');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
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
        // Add CORS headers to response
        proxyRes.headers['access-control-allow-origin'] = '*';
    },
    onError: (err, req, res) => {
        console.error('Proxy error:', err.message);
        res.status(502).json({ 
            error: 'Proxy error', 
            details: err.message,
            timestamp: new Date().toISOString()
        });
    }
});

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({
        status: 'healthy',
        service: 'Aurigraph DLT Dev4',
        version: '10.7',
        mode: 'http-proxy',
        target: `http://localhost:${TARGET_PORT}`,
        proxy: `http://localhost:${PROXY_PORT}`,
        timestamp: new Date().toISOString()
    });
});

// Status endpoint with more details
app.get('/proxy-status', (req, res) => {
    res.json({
        proxy: {
            port: PROXY_PORT,
            target: `localhost:${TARGET_PORT}`,
            domain: DOMAIN,
            mode: 'HTTP-only'
        },
        aurigraph: {
            version: 'V10.7',
            platform: 'Classical CPU/GPU',
            consensus: 'HyperRAFT++',
            crypto: 'Post-Quantum (NIST Level 5)'
        },
        access_points: [
            `http://localhost:${PROXY_PORT}`,
            `http://106.222.203.240:${PROXY_PORT}`,
            `http://${DOMAIN}` // if DNS is configured
        ],
        timestamp: new Date().toISOString()
    });
});

// Proxy all other requests
app.use('/', apiProxy);

const server = app.listen(PROXY_PORT, () => {
    console.log('═══════════════════════════════════════════════════════');
    console.log('✅ HTTP Proxy started successfully');
    console.log('═══════════════════════════════════════════════════════');
    console.log(`🔗 Access at: http://localhost:${PROXY_PORT}`);
    console.log(`🔗 Direct IP: http://106.222.203.240:${PROXY_PORT}`);
    console.log(`🔗 Domain: http://${DOMAIN} (if DNS configured)`);
    console.log('');
    console.log('📊 Available endpoints:');
    console.log('  • /health - Proxy health check');
    console.log('  • /proxy-status - Detailed status');
    console.log('  • /api/classical/* - Aurigraph API');
    console.log('═══════════════════════════════════════════════════════');
});

// Graceful shutdown
process.on('SIGINT', () => {
    console.log('\n🛑 Shutting down HTTP proxy...');
    server.close(() => {
        console.log('✅ HTTP proxy stopped');
        process.exit(0);
    });
});

process.on('SIGTERM', () => {
    console.log('\n🛑 SIGTERM received, shutting down...');
    server.close(() => {
        console.log('✅ HTTP proxy stopped');
        process.exit(0);
    });
});