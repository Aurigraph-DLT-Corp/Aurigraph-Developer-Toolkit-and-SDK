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
