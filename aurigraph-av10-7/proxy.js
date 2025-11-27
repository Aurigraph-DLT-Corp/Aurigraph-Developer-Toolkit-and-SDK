
const express = require('express');
const https = require('https');
const http = require('http');
const httpProxy = require('http-proxy-middleware');
const fs = require('fs');
const path = require('path');
const WebSocket = require('ws');

// ==============================================================================
// Configuration
// ==============================================================================

const config = {
    DOMAIN: process.env.DOMAIN || 'dlt.aurigraph.io',
    TARGET_PORT: process.env.TARGET_PORT || 4004,
    PROXY_PORT_HTTP: process.env.PROXY_PORT_HTTP || 80,
    PROXY_PORT_HTTPS: process.env.PROXY_PORT_HTTPS || 443,
    WS_TARGET: process.env.WS_TARGET || 'ws://localhost:4444',
    SSL_CERT_PATH: process.env.SSL_CERT_PATH || '/etc/letsencrypt/live/aurcrt/fullchain.pem',
    SSL_KEY_PATH: process.env.SSL_KEY_PATH || '/etc/letsencrypt/live/aurcrt/privkey.pem',
    LOG_LEVEL: process.env.LOG_LEVEL || 'info',
};

// ==============================================================================
// SSL Options
// ==============================================================================

let sslOptions = null;
try {
    if (fs.existsSync(config.SSL_CERT_PATH) && fs.existsSync(config.SSL_KEY_PATH)) {
        sslOptions = {
            cert: fs.readFileSync(config.SSL_CERT_PATH),
            key: fs.readFileSync(config.SSL_KEY_PATH)
        };
        console.log('🔒 SSL certificates loaded successfully');
    } else {
        console.log('⚠️ SSL certificates not found, HTTPS will be disabled.');
    }
} catch (err) {
    console.error('Error loading SSL certificates:', err.message);
    console.log('HTTPS will be disabled.');
}

// ==============================================================================
// Express App & Middleware
// ==============================================================================

const app = express();

// Security Headers
app.use((req, res, next) => {
    res.setHeader('X-Powered-By', 'Aurigraph DLT');
    res.setHeader('X-Frame-Options', 'SAMEORIGIN');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    if (req.secure) {
        res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
    }
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
    next();
});

// Proxy Middleware
const proxyOptions = {
    target: `http://localhost:${config.TARGET_PORT}`,
    changeOrigin: true,
    ws: true,
    logLevel: config.LOG_LEVEL,
    onProxyReq: (proxyReq, req, res) => {
        console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
        proxyReq.removeHeader('Strict-Transport-Security');
    },
    onProxyRes: (proxyRes, req, res) => {
        delete proxyRes.headers['strict-transport-security'];
        proxyRes.headers['access-control-allow-origin'] = '*';
    },
    onError: (err, req, res) => {
        console.error('Proxy error:', err.message);
        if (!res.headersSent) {
            res.status(502).json({
                error: 'Proxy error',
                details: err.message,
                timestamp: new Date().toISOString()
            });
        }
    }
};

const apiProxy = httpProxy.createProxyMiddleware(proxyOptions);

// Health & Status Endpoints
app.get('/health', (req, res) => {
    res.json({
        status: 'healthy',
        service: 'Aurigraph DLT Proxy',
        ssl: sslOptions ? 'enabled' : 'disabled',
        timestamp: new Date().toISOString()
    });
});

app.get('/proxy-status', (req, res) => {
    res.json({
        proxy: {
            http_port: config.PROXY_PORT_HTTP,
            https_port: config.PROXY_PORT_HTTPS,
            target: `localhost:${config.TARGET_PORT}`,
            domain: config.DOMAIN,
            ssl_enabled: !!sslOptions,
        },
        aurigraph: {
            version: 'V10.7',
            platform: 'Classical CPU/GPU',
            consensus: 'HyperRAFT++',
            crypto: 'Post-Quantum (NIST Level 5)'
        },
        access_points: [
            `http://localhost:${config.PROXY_PORT_HTTP}`,
            `https://localhost:${config.PROXY_PORT_HTTPS}`,
            `http://${config.DOMAIN}`,
            `https://${config.DOMAIN}`
        ],
        timestamp: new Date().toISOString()
    });
});


// Apply Proxy
app.use('/', apiProxy);

// ==============================================================================
// Server Initialization
// ==============================================================================

let httpServer, httpsServer;

if (sslOptions) {
    // HTTPS Server
    httpsServer = https.createServer(sslOptions, app).listen(config.PROXY_PORT_HTTPS, () => {
        console.log(`🔒 HTTPS server running on port ${config.PROXY_PORT_HTTPS}`);
        console.log(`🌐 Access at: https://${config.DOMAIN}`);
    });

    // HTTP redirect server
    httpServer = http.createServer((req, res) => {
        const httpsUrl = `https://${req.headers.host}${req.url}`;
        res.writeHead(301, { Location: httpsUrl });
        res.end();
    }).listen(config.PROXY_PORT_HTTP, () => {
        console.log(`📡 HTTP redirect server running on port ${config.PROXY_PORT_HTTP}`);
    });

} else {
    // HTTP only server
    httpServer = http.createServer(app).listen(config.PROXY_PORT_HTTP, () => {
        console.log(`📡 HTTP server running on port ${config.PROXY_PORT_HTTP}`);
        console.log(`🌐 Access at: http://localhost:${config.PROXY_PORT_HTTP}`);
        console.log('⚠️ SSL not configured - using HTTP only');
    });
}

// WebSocket Proxy
if (sslOptions) {
    const wssServer = new WebSocket.Server({
        server: httpsServer,
        path: '/ws'
    });

    wssServer.on('connection', (ws) => {
        const targetWs = new WebSocket(config.WS_TARGET);

        ws.on('message', (msg) => targetWs.send(msg));
        targetWs.on('message', (msg) => ws.send(msg));

        ws.on('close', () => targetWs.close());
        targetWs.on('close', () => ws.close());
    });
    console.log('🔌 WebSocket proxy enabled on /ws');
}


console.log('═══════════════════════════════════════════════════════');
console.log('✅ Proxy server initialized');
console.log('═══════════════════════════════════════════════════════');


// ==============================================================================
// Graceful Shutdown
// ==============================================================================
const gracefulShutdown = (signal) => {
    console.log(`\n🛑 ${signal} received, shutting down...`);
    const servers = [httpServer, httpsServer].filter(s => s && s.listening);
    let closedCount = 0;

    if (servers.length === 0) {
        console.log('✅ All servers stopped.');
        process.exit(0);
    }

    servers.forEach(server => {
        server.close(() => {
            closedCount++;
            if (closedCount === servers.length) {
                console.log('✅ All servers stopped.');
                process.exit(0);
            }
        });
    });

    // Force close after 10s
    setTimeout(() => {
        console.error('Could not close connections in time, forcefully shutting down');
        process.exit(1);
    }, 10000);
};


process.on('SIGINT', () => gracefulShutdown('SIGINT'));
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
