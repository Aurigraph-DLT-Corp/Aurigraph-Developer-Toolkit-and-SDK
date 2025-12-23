const express = require('express');
const cors = require('cors');
const axios = require('axios');

const app = express();
const PORT = process.env.MANAGEMENT_PORT || 3040;
const V10_PORT = process.env.V10_PORT || 4004;
const V11_PORT = process.env.V11_PORT || 9003;
const DOMAIN = process.env.DOMAIN || 'localhost';

app.use(cors());
app.use(express.json());

// Serve static dashboard
app.get('/', (req, res) => {
    res.send(`
<!DOCTYPE html>
<html>
<head>
    <title>Aurigraph Management Dashboard</title>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #1a1a1a; color: #fff; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 2rem; text-align: center; }
        .header h1 { font-size: 2.5rem; margin-bottom: 0.5rem; }
        .header p { opacity: 0.9; font-size: 1.1rem; }
        .dashboard { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 2rem; padding: 2rem; max-width: 1200px; margin: 0 auto; }
        .card { background: #2d2d2d; border-radius: 12px; padding: 1.5rem; border-left: 4px solid #667eea; }
        .card h3 { color: #667eea; margin-bottom: 1rem; font-size: 1.3rem; }
        .status { display: flex; align-items: center; gap: 0.5rem; margin-bottom: 1rem; }
        .status-dot { width: 12px; height: 12px; border-radius: 50%; }
        .status-healthy { background: #4ade80; }
        .status-warning { background: #fbbf24; }
        .stat { display: flex; justify-content: space-between; margin-bottom: 0.5rem; }
        .stat-value { font-weight: bold; color: #4ade80; }
        .links { margin-top: 1rem; }
        .link { display: inline-block; background: #667eea; color: white; text-decoration: none; padding: 0.5rem 1rem; border-radius: 6px; margin-right: 0.5rem; margin-bottom: 0.5rem; font-size: 0.9rem; }
        .link:hover { background: #5a67d8; }
        .refresh { position: fixed; top: 20px; right: 20px; background: #667eea; color: white; border: none; padding: 0.75rem 1.5rem; border-radius: 6px; cursor: pointer; font-size: 1rem; }
        .refresh:hover { background: #5a67d8; }
        .footer { text-align: center; padding: 2rem; color: #666; }
        .deployment-info { background: #1f2937; border-radius: 12px; padding: 1.5rem; margin: 2rem auto; max-width: 800px; border-left: 4px solid #10b981; }
    </style>
    <script>
        let servicesData = {};
        
        async function loadServiceData() {
            try {
                const [v10Response, v11Response] = await Promise.allSettled([
                    fetch('http://localhost:' + '${V10_PORT}' + '/api/v10/stats').then(r => r.json()),
                    fetch('http://localhost:' + '${V11_PORT}' + '/api/v11/stats').then(r => r.json())
                ]);
                
                if (v10Response.status === 'fulfilled') servicesData.v10 = v10Response.value;
                if (v11Response.status === 'fulfilled') servicesData.v11 = v11Response.value;
                
                updateDashboard();
            } catch (error) {
                console.error('Error loading service data:', error);
            }
        }
        
        function updateDashboard() {
            // Update V10 stats
            if (servicesData.v10) {
                document.getElementById('v10-tps').textContent = servicesData.v10.transactions?.tps?.toLocaleString() || 'N/A';
                document.getElementById('v10-blocks').textContent = servicesData.v10.blocks?.height || 'N/A';
                document.getElementById('v10-nodes').textContent = servicesData.v10.network?.nodes || 'N/A';
                document.getElementById('v10-uptime').textContent = servicesData.v10.network?.uptime + 's' || 'N/A';
            }
            
            // Update V11 stats  
            if (servicesData.v11) {
                document.getElementById('v11-tps').textContent = servicesData.v11.transactions?.current_tps?.toLocaleString() || 'N/A';
                document.getElementById('v11-nodes').textContent = servicesData.v11.network?.active_nodes || 'N/A';
                document.getElementById('v11-threads').textContent = servicesData.v11.network?.virtual_threads || 'N/A';
                document.getElementById('v11-efficiency').textContent = servicesData.v11.ai_optimization?.consensus_efficiency || 'N/A';
            }
        }
        
        // Auto-refresh every 5 seconds
        setInterval(loadServiceData, 5000);
        
        // Load initial data
        document.addEventListener('DOMContentLoaded', loadServiceData);
    </script>
</head>
<body>
    <div class="header">
        <h1>🚀 Aurigraph Management Dashboard</h1>
        <p>Local Deployment - ${DOMAIN}</p>
    </div>
    
    <div class="deployment-info">
        <h3>📋 Deployment Information</h3>
        <div class="stat"><span>Domain:</span><span class="stat-value">${DOMAIN}</span></div>
        <div class="stat"><span>Environment:</span><span class="stat-value">Development</span></div>
        <div class="stat"><span>Deployment Type:</span><span class="stat-value">Local (No Docker)</span></div>
        <div class="stat"><span>V10 Port:</span><span class="stat-value">${V10_PORT}</span></div>
        <div class="stat"><span>V11 Port:</span><span class="stat-value">${V11_PORT}</span></div>
        <div class="stat"><span>Management Port:</span><span class="stat-value">${PORT}</span></div>
    </div>
    
    <div class="dashboard">
        <div class="card">
            <h3>🔵 V10 Platform Status</h3>
            <div class="status">
                <div class="status-dot status-healthy"></div>
                <span>Operational</span>
            </div>
            <div class="stat"><span>Current TPS:</span><span class="stat-value" id="v10-tps">Loading...</span></div>
            <div class="stat"><span>Block Height:</span><span class="stat-value" id="v10-blocks">Loading...</span></div>
            <div class="stat"><span>Network Nodes:</span><span class="stat-value" id="v10-nodes">Loading...</span></div>
            <div class="stat"><span>Uptime:</span><span class="stat-value" id="v10-uptime">Loading...</span></div>
            <div class="links">
                <a href="http://localhost:${V10_PORT}/health" class="link">Health</a>
                <a href="http://localhost:${V10_PORT}/api/v10/stats" class="link">Stats</a>
                <a href="http://localhost:${V10_PORT}/api/v10/info" class="link">Info</a>
            </div>
        </div>
        
        <div class="card">
            <h3>⚡ V11 Platform Status</h3>
            <div class="status">
                <div class="status-dot status-healthy"></div>
                <span>Operational (Mock)</span>
            </div>
            <div class="stat"><span>Current TPS:</span><span class="stat-value" id="v11-tps">Loading...</span></div>
            <div class="stat"><span>Active Nodes:</span><span class="stat-value" id="v11-nodes">Loading...</span></div>
            <div class="stat"><span>Virtual Threads:</span><span class="stat-value" id="v11-threads">Loading...</span></div>
            <div class="stat"><span>AI Efficiency:</span><span class="stat-value" id="v11-efficiency">Loading...</span></div>
            <div class="links">
                <a href="http://localhost:${V11_PORT}/api/v11/health" class="link">Health</a>
                <a href="http://localhost:${V11_PORT}/api/v11/performance" class="link">Performance</a>
                <a href="http://localhost:${V11_PORT}/api/v11/info" class="link">Info</a>
            </div>
        </div>
        
        <div class="card">
            <h3>🌐 Network Status</h3>
            <div class="status">
                <div class="status-dot status-healthy"></div>
                <span>All Services Online</span>
            </div>
            <div class="stat"><span>Cross-Chain Bridges:</span><span class="stat-value">3 Active</span></div>
            <div class="stat"><span>Total Locked Value:</span><span class="stat-value">$12.8M</span></div>
            <div class="stat"><span>HMS Integration:</span><span class="stat-value">Ready</span></div>
            <div class="stat"><span>gRPC Status:</span><span class="stat-value">Mock Ready</span></div>
        </div>
        
        <div class="card">
            <h3>📊 System Resources</h3>
            <div class="stat"><span>Node.js Version:</span><span class="stat-value">${process.version}</span></div>
            <div class="stat"><span>Platform:</span><span class="stat-value">${process.platform}</span></div>
            <div class="stat"><span>Memory Usage:</span><span class="stat-value">${(process.memoryUsage().heapUsed / 1024 / 1024).toFixed(1)} MB</span></div>
            <div class="stat"><span>Load Average:</span><span class="stat-value">${process.loadavg()[0].toFixed(2)}</span></div>
        </div>
    </div>
    
    <div class="footer">
        <p>Aurigraph DLT Platform - Local Development Deployment</p>
        <p>Last updated: <span id="last-updated">${new Date().toLocaleString()}</span></p>
    </div>
    
    <button class="refresh" onclick="loadServiceData()">🔄 Refresh</button>
</body>
</html>
    `);
});

// API endpoints for dashboard data
app.get('/api/status', async (req, res) => {
    const status = { services: {}, timestamp: new Date().toISOString() };
    
    try {
        // Check V10 service
        const v10Response = await axios.get('http://localhost:' + V10_PORT + '/health', { timeout: 2000 });
        status.services.v10 = { status: 'healthy', port: V10_PORT, data: v10Response.data };
    } catch (error) {
        status.services.v10 = { status: 'unhealthy', port: V10_PORT, error: error.message };
    }
    
    try {
        // Check V11 service
        const v11Response = await axios.get('http://localhost:' + V11_PORT + '/api/v11/health', { timeout: 2000 });
        status.services.v11 = { status: 'healthy', port: V11_PORT, data: v11Response.data };
    } catch (error) {
        status.services.v11 = { status: 'unhealthy', port: V11_PORT, error: error.message };
    }
    
    res.json(status);
});

app.get('/health', (req, res) => {
    res.json({
        status: 'healthy',
        service: 'management-dashboard',
        domain: DOMAIN,
        port: PORT,
        uptime: process.uptime()
    });
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
    console.log(`🟢 Management Dashboard running on port ${PORT}`);
    console.log(`📍 Domain: ${DOMAIN}`);
    console.log(`🌐 Dashboard: http://localhost:${PORT}`);
});
