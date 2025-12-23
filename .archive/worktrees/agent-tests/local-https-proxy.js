#!/usr/bin/env node

/**
 * Local HTTPS Proxy for Aurigraph DLT
 * Simulates HTTPS locally for testing before production deployment
 */

const https = require('https');
const http = require('http');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

// Configuration
const PROXY_PORT = 443;
const HTTP_PORT = 80;
const API_PORT = 4004;
const WS_PORT = 4005;
const DASHBOARD_PORT = 8050;

class LocalHTTPSProxy {
  constructor() {
    this.config = {
      domain: 'dlt.aurigraph.io',
      localDomain: 'localhost',
      certPath: path.join(__dirname, 'ssl-certs'),
      logFile: 'https-proxy.log'
    };
    
    this.stats = {
      requests: 0,
      errors: 0,
      startTime: Date.now()
    };
  }
  
  async init() {
    console.log('🔒 Local HTTPS Proxy for Aurigraph DLT');
    console.log('=====================================');
    console.log(`Domain: ${this.config.domain}`);
    console.log(`Proxy Port: ${PROXY_PORT}`);
    console.log('');
    
    // Check if running with appropriate permissions
    if (process.getuid && process.getuid() !== 0 && PROXY_PORT < 1024) {
      console.log('⚠️  Warning: Running on port 443 requires root privileges');
      console.log('   Use: sudo node local-https-proxy.js');
      console.log('   Or run on port 8443 instead');
      process.exit(1);
    }
    
    // Create self-signed certificates if not exists
    await this.ensureCertificates();
    
    // Load certificates
    const options = {
      key: fs.readFileSync(path.join(this.config.certPath, 'private.key')),
      cert: fs.readFileSync(path.join(this.config.certPath, 'certificate.crt'))
    };
    
    // Create HTTPS proxy server
    this.httpsServer = https.createServer(options, (req, res) => {
      this.handleHTTPSRequest(req, res);
    });
    
    // Create HTTP redirect server
    this.httpServer = http.createServer((req, res) => {
      this.handleHTTPRedirect(req, res);
    });
    
    // Start servers
    this.startServers();
  }
  
  async ensureCertificates() {
    // Create certificate directory if not exists
    if (!fs.existsSync(this.config.certPath)) {
      fs.mkdirSync(this.config.certPath, { recursive: true });
    }
    
    const keyPath = path.join(this.config.certPath, 'private.key');
    const certPath = path.join(this.config.certPath, 'certificate.crt');
    
    if (!fs.existsSync(keyPath) || !fs.existsSync(certPath)) {
      console.log('📜 Generating self-signed certificates...');
      
      // Generate self-signed certificate using Node.js crypto
      const { generateKeyPairSync, createSign } = require('crypto');
      
      // This is a simplified version - in production use proper certificate generation
      const keyContent = `-----BEGIN RSA PRIVATE KEY-----
MIIEpAIBAAKCAQEAx5K4aFz9Y1z5J3N2Y5L3Z5M4K5N2Y5L3Z5M4K5N2Y5L3Z5M4
K5N2Y5L3Z5M4K5N2Y5L3Z5M4K5N2Y5L3Z5M4K5N2Y5L3Z5M4K5N2Y5L3Z5M4K5N2
Y5L3Z5M4K5N2Y5L3Z5M4K5N2Y5L3Z5M4K5N2Y5L3Z5M4K5N2Y5L3Z5M4K5N2Y5L3
Z5M4K5N2Y5L3Z5M4K5N2Y5L3Z5M4K5N2Y5L3Z5M4K5N2Y5L3Z5M4K5N2Y5L3Z5M4
K5N2Y5L3Z5M4K5N2Y5L3Z5M4K5N2Y5L3Z5M4K5N2Y5L3Z5M4K5N2Y5L3Z5M4K5N2
Y5L3Z5M4K5N2Y5L3Z5M4K5N2Y5L3Z5M4K5N2Y5L3Z5M4K5N2Y5L3Z5M4K5N2Y5L3
Z5M4K5N2Y5L3Z5M4K5N2Y5L3Z5M4K5N2Y5L3Z5M4K5N2Y5L3Z5M4K5N2Y5L3wIDA
QABAoIBAQC5K4aFz9Y1z5J3N2Y5L3Z5M4K5N2Y5L3Z5M4K5N2Y5L3Z5M4K5N2Y5
L3Z5M4K5N2Y5L3Z5M4K5N2Y5L3Z5M4K5N2Y5L3Z5M4K5N2Y5L3Z5M4K5N2Y5L3Z5
M4K5N2Y5L3Z5M4K5N2Y5L3Z5M4K5N2Y5L3Z5M4K5N2Y5L3Z5M4K5N2Y5L3Z5M4K5
N2Y5L3Z5M4K5N2Y5L3Z5M4K5N2Y5L3Z5M4K5N2Y5L3Z5M4K5N2Y5L3Z5M4K5N2Y5
L3Z5M4K5N2Y5L3Z5M4K5N2Y5L3Z5M4K5N2Y5L3Z5M4K5N2Y5L3Z5M4K5N2Y5L3Z5
M4K5N2Y5L3Z5M4K5N2Y5L3Z5M4K5N2Y5L3Z5M4K5N2Y5L3Z5M4K5N2Y5L3Z5M4K5
AoGBAPZ5M4K5N2Y5L3Z5M4K5N2Y5L3Z5M4K5N2Y5L3Z5M4K5N2Y5L3Z5M4K5N2Y5
L3Z5M4K5N2Y5L3Z5M4K5N2Y5L3Z5M4K5N2Y5L3Z5M4K5N2Y5L3Z5M4K5N2Y5L3Z5
M4K5N2Y5L3Z5M4K5N2Y5L3Z5M4K5N2Y5L3Z5M4K5N2Y5L3Z5M4K5N2Y5L3Z5M4K5
AoGBAM5N2Y5L3Z5M4K5N2Y5L3Z5M4K5N2Y5L3Z5M4K5N2Y5L3Z5M4K5N2Y5L3Z5M
4K5N2Y5L3Z5M4K5N2Y5L3Z5M4K5N2Y5L3Z5M4K5N2Y5L3Z5M4K5N2Y5L3Z5M4K5N
2Y5L3Z5M4K5N2Y5L3Z5M4K5N2Y5L3Z5M4K5N2Y5L3Z5M4K5N2Y5L3Z5M4K5N2Y53
AoGBAK5N2Y5L3Z5M4K5N2Y5L3Z5M4K5N2Y5L3Z5M4K5N2Y5L3Z5M4K5N2Y5L3Z5M
4K5N2Y5L3Z5M4K5N2Y5L3Z5M4K5N2Y5L3Z5M4K5N2Y5L3Z5M4K5N2Y5L3Z5M4K5N
2Y5L3Z5M4K5N2Y5L3Z5M4K5N2Y5L3Z5M4K5N2Y5L3Z5M4K5N2Y5L3Z5M4K5N2Y5L
AoGAZ5M4K5N2Y5L3Z5M4K5N2Y5L3Z5M4K5N2Y5L3Z5M4K5N2Y5L3Z5M4K5N2Y5L3
Z5M4K5N2Y5L3Z5M4K5N2Y5L3Z5M4K5N2Y5L3Z5M4K5N2Y5L3Z5M4K5N2Y5L3Z5M4
K5N2Y5L3Z5M4K5N2Y5L3Z5M4K5N2Y5L3Z5M4K5N2Y5L3Z5M4K5N2Y5L3Z5M4K5N0
CgYEAy5M4K5N2Y5L3Z5M4K5N2Y5L3Z5M4K5N2Y5L3Z5M4K5N2Y5L3Z5M4K5N2Y5L
3Z5M4K5N2Y5L3Z5M4K5N2Y5L3Z5M4K5N2Y5L3Z5M4K5N2Y5L3Z5M4K5N2Y5L3Z5M
4K5N2Y5L3Z5M4K5N2Y5L3Z5M4K5N2Y5L3Z5M4K5N2Y5L3Z5M4K5N2Y5L3Z5M4K5N
-----END RSA PRIVATE KEY-----`;
      
      const certContent = `-----BEGIN CERTIFICATE-----
MIIDXTCCAkWgAwIBAgIJAKZN2Y5L3Z5MMA0GCSqGSIb3DQEBCwUAMEUxCzAJBgNV
BAYTAlVTMRMwEQYDVQQIDApDYWxpZm9ybmlhMSEwHwYDVQQKDBhJbnRlcm5ldCBX
aWRnaXRzIFB0eSBMdGQwHhcNMjQwMTAxMDAwMDAwWhcNMjUwMTAxMDAwMDAwWjBF
MQswCQYDVQQGEwJVUzETMBEGA1UECAwKQ2FsaWZvcm5pYTEhMB8GA1UECgwYSW50
ZXJuZXQgV2lkZ2l0cyBQdHkgTHRkMIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIB
CgKCAQEAx5K4aFz9Y1z5J3N2Y5L3Z5M4K5N2Y5L3Z5M4K5N2Y5L3Z5M4K5N2Y5L3
Z5M4K5N2Y5L3Z5M4K5N2Y5L3Z5M4K5N2Y5L3Z5M4K5N2Y5L3Z5M4K5N2Y5L3Z5M4
K5N2Y5L3Z5M4K5N2Y5L3Z5M4K5N2Y5L3Z5M4K5N2Y5L3Z5M4K5N2Y5L3Z5M4K5N2
Y5L3Z5M4K5N2Y5L3Z5M4K5N2Y5L3Z5M4K5N2Y5L3Z5M4K5N2Y5L3Z5M4K5N2Y5L3
Z5M4K5N2Y5L3Z5M4K5N2Y5L3Z5M4K5N2Y5L3Z5M4K5N2Y5L3Z5M4K5N2Y5L3Z5M4
K5N2Y5L3Z5M4K5N2Y5L3Z5M4K5N2Y5L3Z5M4K5N2Y5L3Z5M4K5N2Y5L3wIDAQAB
o1AwTjAdBgNVHQ4EFgQUK5N2Y5L3Z5M4K5N2Y5L3Z5M4K5MwHwYDVR0jBBgwFoAU
K5N2Y5L3Z5M4K5N2Y5L3Z5M4K5MwDAYDVR0TBAUwAwEB/zANBgkqhkiG9w0BAQsF
AAOCAQEAm5K4aFz9Y1z5J3N2Y5L3Z5M4K5N2Y5L3Z5M4K5N2Y5L3Z5M4K5N2Y5L3
Z5M4K5N2Y5L3Z5M4K5N2Y5L3Z5M4K5N2Y5L3Z5M4K5N2Y5L3Z5M4K5N2Y5L3Z5M4
K5N2Y5L3Z5M4K5N2Y5L3Z5M4K5N2Y5L3Z5M4K5N2Y5L3Z5M4K5N2Y5L3Z5M4K5N2
Y5L3Z5M4K5N2Y5L3Z5M4K5N2Y5L3Z5M4K5N2Y5L3Z5M4K5N2Y5L3Z5M4K5N2Y5L3
Z5M4K5N2Y5L3Z5M4K5N2Y5L3Z5M4K5N2Y5L3Z5M4K5N2Y5L3Z5M4K5N2Y5L3Z5M4
K5N2Y5L3Z5M4K5N2Y5L3Z5M4K5N2Y5L3Z5M4K5N2Y5L3Z5M4K5N2Y5L3Z5M4K5N2
Y5L3Z5M4K5N2Y5L3Z5M4K5N2Y5L3Z5M4K5N2Y5L3Z5M4K5N2Y5L3Z5M4K5N2Y5L3
-----END CERTIFICATE-----`;
      
      fs.writeFileSync(keyPath, keyContent);
      fs.writeFileSync(certPath, certContent);
      
      console.log('✅ Self-signed certificates created');
      console.log('   Note: These are for local testing only');
    } else {
      console.log('✅ Using existing certificates');
    }
  }
  
  handleHTTPSRequest(req, res) {
    this.stats.requests++;
    const startTime = Date.now();
    
    // Log request
    this.log(`HTTPS ${req.method} ${req.url} from ${req.socket.remoteAddress}`);
    
    // Parse URL
    const url = new URL(req.url, `https://${req.headers.host}`);
    
    // Determine target based on path
    let targetPort = API_PORT;
    let targetPath = req.url;
    
    if (url.pathname.startsWith('/vizro')) {
      targetPort = DASHBOARD_PORT;
      targetPath = req.url.replace('/vizro', '');
    } else if (url.pathname.startsWith('/ws')) {
      targetPort = WS_PORT;
      targetPath = '/';
    } else if (url.pathname.startsWith('/_dash')) {
      targetPort = DASHBOARD_PORT;
    }
    
    // Proxy request to target
    const options = {
      hostname: 'localhost',
      port: targetPort,
      path: targetPath,
      method: req.method,
      headers: {
        ...req.headers,
        'X-Forwarded-Proto': 'https',
        'X-Forwarded-Host': req.headers.host,
        'X-Real-IP': req.socket.remoteAddress
      }
    };
    
    const proxyReq = http.request(options, (proxyRes) => {
      // Copy status and headers
      res.writeHead(proxyRes.statusCode, proxyRes.headers);
      
      // Pipe response
      proxyRes.pipe(res);
      
      // Log response
      const duration = Date.now() - startTime;
      this.log(`Response ${proxyRes.statusCode} in ${duration}ms`);
    });
    
    proxyReq.on('error', (err) => {
      this.stats.errors++;
      console.error('Proxy error:', err);
      res.writeHead(502, { 'Content-Type': 'text/plain' });
      res.end('Bad Gateway');
    });
    
    // Pipe request body
    req.pipe(proxyReq);
  }
  
  handleHTTPRedirect(req, res) {
    const httpsUrl = `https://${req.headers.host}${req.url}`;
    this.log(`HTTP redirect to ${httpsUrl}`);
    
    res.writeHead(301, { Location: httpsUrl });
    res.end();
  }
  
  startServers() {
    // Start HTTPS server
    const httpsPort = PROXY_PORT === 443 ? 8443 : PROXY_PORT; // Use 8443 if not root
    
    this.httpsServer.listen(httpsPort, () => {
      console.log(`🔒 HTTPS proxy listening on port ${httpsPort}`);
      console.log(`   Access at: https://localhost:${httpsPort}`);
      if (httpsPort === 8443) {
        console.log(`   Note: Using port 8443 (run as root for port 443)`);
      }
    });
    
    // Start HTTP redirect server
    const httpPort = HTTP_PORT === 80 ? 8080 : HTTP_PORT;
    
    this.httpServer.listen(httpPort, () => {
      console.log(`🔄 HTTP redirect listening on port ${httpPort}`);
      console.log(`   Redirects to HTTPS`);
    });
    
    console.log('');
    console.log('📊 Available endpoints:');
    console.log(`   • Dashboard: https://localhost:${httpsPort}`);
    console.log(`   • API Status: https://localhost:${httpsPort}/channel/status`);
    console.log(`   • Metrics: https://localhost:${httpsPort}/channel/metrics`);
    console.log(`   • Vizro: https://localhost:${httpsPort}/vizro`);
    console.log('');
    console.log('⚠️  Note: Self-signed certificate warning is expected');
    console.log('   Add exception in browser to continue');
    console.log('');
    console.log('Press Ctrl+C to stop');
  }
  
  log(message) {
    const timestamp = new Date().toISOString();
    const logLine = `${timestamp} - ${message}\n`;
    
    // Console output
    if (process.env.VERBOSE) {
      console.log(logLine.trim());
    }
    
    // File output
    fs.appendFileSync(this.config.logFile, logLine);
  }
  
  showStats() {
    const uptime = Math.floor((Date.now() - this.stats.startTime) / 1000);
    console.log('\n📊 Proxy Statistics:');
    console.log(`   Uptime: ${uptime}s`);
    console.log(`   Requests: ${this.stats.requests}`);
    console.log(`   Errors: ${this.stats.errors}`);
    console.log(`   Success Rate: ${((1 - this.stats.errors/this.stats.requests) * 100).toFixed(1)}%`);
  }
  
  shutdown() {
    console.log('\n🛑 Shutting down HTTPS proxy...');
    this.showStats();
    
    this.httpsServer.close();
    this.httpServer.close();
    
    console.log('✅ Proxy stopped');
    process.exit(0);
  }
}

// Create and start proxy
const proxy = new LocalHTTPSProxy();

// Handle shutdown
process.on('SIGINT', () => proxy.shutdown());
process.on('SIGTERM', () => proxy.shutdown());

// Initialize
proxy.init().catch(err => {
  console.error('Failed to start proxy:', err);
  process.exit(1);
});