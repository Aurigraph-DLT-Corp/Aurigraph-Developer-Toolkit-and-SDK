"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RWAWebInterface = void 0;
const express_1 = require("express");
const cors_1 = require("cors");
const Logger_1 = require("../../core/Logger");
class RWAWebInterface {
    constructor(assetRegistry, mcpInterface) {
        this.app = (0, express_1.default)();
        this.logger = new Logger_1.Logger('RWAWebInterface');
        this.assetRegistry = assetRegistry;
        this.mcpInterface = mcpInterface;
        this.setupMiddleware();
        this.setupRoutes();
    }
    setupMiddleware() {
        this.app.use((0, cors_1.default)());
        this.app.use(express_1.default.json());
        this.app.use(express_1.default.static('public'));
    }
    setupRoutes() {
        // Main dashboard
        this.app.get('/', (req, res) => {
            res.send(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>Aurigraph RWA Tokenization Platform</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; background: #f5f5f5; }
            .container { max-width: 1200px; margin: 0 auto; background: white; padding: 20px; border-radius: 8px; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; border-radius: 8px; margin-bottom: 20px; }
            .nav { display: flex; gap: 20px; margin: 20px 0; }
            .nav a { padding: 10px 20px; background: #667eea; color: white; text-decoration: none; border-radius: 4px; }
            .nav a:hover { background: #764ba2; }
            .metrics { display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 20px; margin: 20px 0; }
            .metric-card { background: #f8f9fa; padding: 20px; border-radius: 8px; border-left: 4px solid #667eea; }
            .metric-value { font-size: 2em; font-weight: bold; color: #667eea; }
            .metric-label { color: #666; margin-top: 5px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🏛️ Aurigraph RWA Tokenization Platform</h1>
              <p>Real-World Asset Tokenization with Digital Twins, Cross-Jurisdiction Compliance & MCP Integration</p>
            </div>
            
            <div class="nav">
              <a href="/assets">📋 Asset Registry</a>
              <a href="/tokenization">🔄 Tokenization</a>
              <a href="/portfolio">💼 Portfolio</a>
              <a href="/compliance">⚖️ Compliance</a>
              <a href="/analytics">📊 Analytics</a>
              <a href="/api/health">🔧 API Health</a>
            </div>

            <div class="metrics" id="metrics">
              <div class="metric-card">
                <div class="metric-value" id="total-assets">Loading...</div>
                <div class="metric-label">Total Assets</div>
              </div>
              <div class="metric-card">
                <div class="metric-value" id="total-tokens">Loading...</div>
                <div class="metric-label">Tokenized Assets</div>
              </div>
              <div class="metric-card">
                <div class="metric-value" id="total-value">Loading...</div>
                <div class="metric-label">Total Value (USD)</div>
              </div>
              <div class="metric-card">
                <div class="metric-value" id="compliance-rate">Loading...</div>
                <div class="metric-label">Compliance Rate</div>
              </div>
            </div>

            <div style="margin-top: 30px;">
              <h2>🚀 Platform Features</h2>
              <ul style="line-height: 1.8;">
                <li><strong>6 Asset Classes:</strong> Real Estate, Carbon Credits, Commodities, IP, Art, Infrastructure</li>
                <li><strong>4 Tokenization Models:</strong> Fractional, Digital Twins, Compound, Yield-bearing</li>
                <li><strong>Cross-Jurisdiction Compliance:</strong> US, EU, Singapore regulatory frameworks</li>
                <li><strong>Digital Twin Integration:</strong> Real-time IoT monitoring and analytics</li>
                <li><strong>MCP Interface:</strong> 3rd party integrations via Model Context Protocol</li>
                <li><strong>Advanced Security:</strong> Post-quantum cryptography with NTRU encryption</li>
              </ul>
            </div>

            <div style="margin-top: 30px;">
              <h2>🔗 API Endpoints</h2>
              <div style="background: #f8f9fa; padding: 15px; border-radius: 8px; font-family: monospace;">
                <div>GET /api/assets - List all assets</div>
                <div>POST /api/assets - Create new asset</div>
                <div>POST /api/tokenization - Tokenize asset</div>
                <div>GET /api/portfolio/:address - Get portfolio</div>
                <div>GET /api/compliance/status - Compliance status</div>
                <div>GET /api/analytics/dashboard - Analytics dashboard</div>
              </div>
            </div>
          </div>

          <script>
            async function updateMetrics() {
              try {
                const response = await fetch('/api/analytics/dashboard');
                const data = await response.json();
                
                document.getElementById('total-assets').textContent = data.totalAssets || '0';
                document.getElementById('total-tokens').textContent = data.totalTokenizedAssets || '0';
                document.getElementById('total-value').textContent = '$' + (data.totalValue || 0).toLocaleString();
                document.getElementById('compliance-rate').textContent = (data.complianceRate || 0).toFixed(1) + '%';
              } catch (error) {
                console.error('Failed to update metrics:', error);
              }
            }

            updateMetrics();
            setInterval(updateMetrics, 30000); // Update every 30 seconds
          </script>
        </body>
        </html>
      `);
        });
        // Asset management interface
        this.app.get('/assets', (req, res) => {
            res.send(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>Asset Registry - Aurigraph RWA</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; background: #f5f5f5; }
            .container { max-width: 1200px; margin: 0 auto; background: white; padding: 20px; border-radius: 8px; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; border-radius: 8px; margin-bottom: 20px; }
            .nav { margin: 20px 0; }
            .nav a { margin-right: 15px; color: #667eea; text-decoration: none; }
            .asset-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 20px; margin: 20px 0; }
            .asset-card { background: #f8f9fa; padding: 20px; border-radius: 8px; border-left: 4px solid #28a745; }
            .asset-type { color: #667eea; font-weight: bold; }
            .asset-value { font-size: 1.2em; color: #28a745; margin: 10px 0; }
            .form-group { margin: 15px 0; }
            .form-group label { display: block; margin-bottom: 5px; font-weight: bold; }
            .form-group input, .form-group select { width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px; }
            .btn { background: #667eea; color: white; padding: 10px 20px; border: none; border-radius: 4px; cursor: pointer; }
            .btn:hover { background: #764ba2; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>📋 Asset Registry</h1>
              <p>Manage and register real-world assets for tokenization</p>
            </div>
            
            <div class="nav">
              <a href="/">← Back to Dashboard</a>
              <a href="/tokenization">Tokenization</a>
              <a href="/portfolio">Portfolio</a>
            </div>

            <div id="asset-list" class="asset-grid">
              <!-- Assets will be loaded here -->
            </div>

            <div style="margin-top: 30px; padding: 20px; background: #f8f9fa; border-radius: 8px;">
              <h2>Register New Asset</h2>
              <form id="asset-form">
                <div class="form-group">
                  <label>Asset Type:</label>
                  <select id="asset-type" required>
                    <option value="">Select asset type...</option>
                    <option value="REAL_ESTATE">Real Estate</option>
                    <option value="CARBON_CREDITS">Carbon Credits</option>
                    <option value="COMMODITIES">Commodities</option>
                    <option value="INTELLECTUAL_PROPERTY">Intellectual Property</option>
                    <option value="ART">Art & Collectibles</option>
                    <option value="INFRASTRUCTURE">Infrastructure</option>
                  </select>
                </div>
                <div class="form-group">
                  <label>Asset Name:</label>
                  <input type="text" id="asset-name" required placeholder="Enter asset name">
                </div>
                <div class="form-group">
                  <label>Description:</label>
                  <input type="text" id="asset-description" required placeholder="Asset description">
                </div>
                <div class="form-group">
                  <label>Valuation (USD):</label>
                  <input type="number" id="asset-value" required placeholder="1000000">
                </div>
                <div class="form-group">
                  <label>Location:</label>
                  <input type="text" id="asset-location" required placeholder="City, Country">
                </div>
                <button type="submit" class="btn">Register Asset</button>
              </form>
            </div>
          </div>

          <script>
            async function loadAssets() {
              try {
                const response = await fetch('/api/assets');
                const assets = await response.json();
                
                const assetList = document.getElementById('asset-list');
                assetList.innerHTML = assets.map(asset => \`
                  <div class="asset-card">
                    <div class="asset-type">\${asset.type}</div>
                    <h3>\${asset.name}</h3>
                    <div class="asset-value">$\${asset.valuation.currentValue.toLocaleString()}</div>
                    <p>\${asset.description}</p>
                    <small>📍 \${asset.location}</small>
                  </div>
                \`).join('');
              } catch (error) {
                console.error('Failed to load assets:', error);
              }
            }

            document.getElementById('asset-form').addEventListener('submit', async (e) => {
              e.preventDefault();
              
              const formData = {
                type: document.getElementById('asset-type').value,
                name: document.getElementById('asset-name').value,
                description: document.getElementById('asset-description').value,
                valuation: {
                  currentValue: parseFloat(document.getElementById('asset-value').value),
                  currency: 'USD'
                },
                location: document.getElementById('asset-location').value
              };

              try {
                const response = await fetch('/api/assets', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify(formData)
                });

                if (response.ok) {
                  alert('Asset registered successfully!');
                  document.getElementById('asset-form').reset();
                  loadAssets();
                } else {
                  alert('Failed to register asset');
                }
              } catch (error) {
                alert('Error: ' + error.message);
              }
            });

            loadAssets();
          </script>
        </body>
        </html>
      `);
        });
        // Tokenization interface
        this.app.get('/tokenization', (req, res) => {
            res.send(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>Tokenization - Aurigraph RWA</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; background: #f5f5f5; }
            .container { max-width: 1200px; margin: 0 auto; background: white; padding: 20px; border-radius: 8px; }
            .header { background: linear-gradient(135deg, #28a745 0%, #20c997 100%); color: white; padding: 20px; border-radius: 8px; margin-bottom: 20px; }
            .model-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 20px; margin: 20px 0; }
            .model-card { background: #f8f9fa; padding: 20px; border-radius: 8px; border-left: 4px solid #28a745; cursor: pointer; transition: transform 0.2s; }
            .model-card:hover { transform: translateY(-2px); box-shadow: 0 4px 8px rgba(0,0,0,0.1); }
            .model-title { color: #28a745; font-weight: bold; font-size: 1.2em; margin-bottom: 10px; }
            .form-section { background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0; }
            .form-group { margin: 15px 0; }
            .form-group label { display: block; margin-bottom: 5px; font-weight: bold; }
            .form-group input, .form-group select { width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px; }
            .btn { background: #28a745; color: white; padding: 10px 20px; border: none; border-radius: 4px; cursor: pointer; }
            .btn:hover { background: #20c997; }
            .nav a { margin-right: 15px; color: #28a745; text-decoration: none; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🔄 Asset Tokenization</h1>
              <p>Choose your tokenization model and create digital representations of real-world assets</p>
            </div>
            
            <div class="nav">
              <a href="/">← Back to Dashboard</a>
              <a href="/assets">Asset Registry</a>
              <a href="/portfolio">Portfolio</a>
            </div>

            <h2>Tokenization Models</h2>
            <div class="model-grid">
              <div class="model-card" onclick="selectModel('FRACTIONAL')">
                <div class="model-title">🧩 Fractional Tokenization</div>
                <p>Split ownership of high-value assets into smaller, tradeable tokens representing fractional ownership stakes.</p>
                <ul>
                  <li>Minimum investment amounts</li>
                  <li>Proportional voting rights</li>
                  <li>Revenue distribution</li>
                </ul>
              </div>
              
              <div class="model-card" onclick="selectModel('DIGITAL_TWIN')">
                <div class="model-title">🔗 Digital Twin</div>
                <p>Create digital representations with real-time IoT data integration and automated performance monitoring.</p>
                <ul>
                  <li>Real-time sensor data</li>
                  <li>Performance analytics</li>
                  <li>Predictive maintenance</li>
                </ul>
              </div>
              
              <div class="model-card" onclick="selectModel('COMPOUND')">
                <div class="model-title">📦 Compound Assets</div>
                <p>Bundle multiple related assets into composite tokens with shared governance and pooled returns.</p>
                <ul>
                  <li>Asset bundling</li>
                  <li>Risk diversification</li>
                  <li>Pooled governance</li>
                </ul>
              </div>
              
              <div class="model-card" onclick="selectModel('YIELD_BEARING')">
                <div class="model-title">💰 Yield-Bearing</div>
                <p>Tokens that automatically generate and distribute yields from underlying asset performance.</p>
                <ul>
                  <li>Automatic yield distribution</li>
                  <li>Compound interest</li>
                  <li>Performance tracking</li>
                </ul>
              </div>
            </div>

            <div class="form-section" id="tokenization-form" style="display: none;">
              <h2>Create Tokenization</h2>
              <form id="create-tokenization">
                <div class="form-group">
                  <label>Selected Model:</label>
                  <input type="text" id="selected-model" readonly>
                </div>
                <div class="form-group">
                  <label>Asset ID:</label>
                  <input type="text" id="asset-id" required placeholder="Enter asset ID">
                </div>
                <div class="form-group">
                  <label>Total Token Supply:</label>
                  <input type="number" id="token-supply" required placeholder="1000000">
                </div>
                <div class="form-group">
                  <label>Token Symbol:</label>
                  <input type="text" id="token-symbol" required placeholder="e.g., PROP001">
                </div>
                <div class="form-group">
                  <label>Token Name:</label>
                  <input type="text" id="token-name" required placeholder="e.g., Manhattan Property Token">
                </div>
                <button type="submit" class="btn">Create Tokenization</button>
              </form>
            </div>
          </div>

          <script>
            function selectModel(model) {
              document.getElementById('selected-model').value = model;
              document.getElementById('tokenization-form').style.display = 'block';
              document.getElementById('tokenization-form').scrollIntoView({ behavior: 'smooth' });
            }

            document.getElementById('create-tokenization').addEventListener('submit', async (e) => {
              e.preventDefault();
              
              const formData = {
                assetId: document.getElementById('asset-id').value,
                model: document.getElementById('selected-model').value,
                totalSupply: parseInt(document.getElementById('token-supply').value),
                tokenSymbol: document.getElementById('token-symbol').value,
                tokenName: document.getElementById('token-name').value
              };

              try {
                const response = await fetch('/api/tokenization', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify(formData)
                });

                const result = await response.json();
                if (response.ok) {
                  alert('Tokenization created successfully!\\nToken ID: ' + result.tokenId);
                  document.getElementById('create-tokenization').reset();
                  document.getElementById('tokenization-form').style.display = 'none';
                } else {
                  alert('Failed to create tokenization: ' + result.error);
                }
              } catch (error) {
                alert('Error: ' + error.message);
              }
            });
          </script>
        </body>
        </html>
      `);
        });
        // Portfolio interface
        this.app.get('/portfolio', (req, res) => {
            res.send(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>Portfolio - Aurigraph RWA</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; background: #f5f5f5; }
            .container { max-width: 1200px; margin: 0 auto; background: white; padding: 20px; border-radius: 8px; }
            .header { background: linear-gradient(135deg, #6f42c1 0%, #e83e8c 100%); color: white; padding: 20px; border-radius: 8px; margin-bottom: 20px; }
            .portfolio-summary { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin: 20px 0; }
            .summary-card { background: #f8f9fa; padding: 20px; border-radius: 8px; text-align: center; }
            .summary-value { font-size: 2em; font-weight: bold; color: #6f42c1; }
            .holdings-table { width: 100%; border-collapse: collapse; margin: 20px 0; }
            .holdings-table th, .holdings-table td { padding: 12px; text-align: left; border-bottom: 1px solid #ddd; }
            .holdings-table th { background: #f8f9fa; font-weight: bold; }
            .nav a { margin-right: 15px; color: #6f42c1; text-decoration: none; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>💼 Portfolio Management</h1>
              <p>Track your tokenized asset holdings and performance</p>
            </div>
            
            <div class="nav">
              <a href="/">← Back to Dashboard</a>
              <a href="/assets">Asset Registry</a>
              <a href="/tokenization">Tokenization</a>
            </div>

            <div style="margin: 20px 0;">
              <label>Portfolio Address:</label>
              <input type="text" id="portfolio-address" placeholder="Enter wallet address" style="width: 300px; padding: 8px; margin: 0 10px;">
              <button onclick="loadPortfolio()" class="btn">Load Portfolio</button>
            </div>

            <div class="portfolio-summary" id="portfolio-summary" style="display: none;">
              <div class="summary-card">
                <div class="summary-value" id="total-holdings">$0</div>
                <div>Total Holdings</div>
              </div>
              <div class="summary-card">
                <div class="summary-value" id="asset-count">0</div>
                <div>Assets</div>
              </div>
              <div class="summary-card">
                <div class="summary-value" id="yield-earned">$0</div>
                <div>Yield Earned</div>
              </div>
              <div class="summary-card">
                <div class="summary-value" id="performance">0%</div>
                <div>Performance</div>
              </div>
            </div>

            <table class="holdings-table" id="holdings-table" style="display: none;">
              <thead>
                <tr>
                  <th>Asset</th>
                  <th>Type</th>
                  <th>Tokens</th>
                  <th>Value</th>
                  <th>Yield</th>
                  <th>Performance</th>
                </tr>
              </thead>
              <tbody id="holdings-body">
              </tbody>
            </table>
          </div>

          <script>
            async function loadPortfolio() {
              const address = document.getElementById('portfolio-address').value;
              if (!address) {
                alert('Please enter a portfolio address');
                return;
              }

              try {
                const response = await fetch(\`/api/portfolio/\${address}\`);
                const portfolio = await response.json();
                
                if (response.ok) {
                  displayPortfolio(portfolio);
                } else {
                  alert('Failed to load portfolio: ' + portfolio.error);
                }
              } catch (error) {
                alert('Error loading portfolio: ' + error.message);
              }
            }

            function displayPortfolio(portfolio) {
              document.getElementById('portfolio-summary').style.display = 'grid';
              document.getElementById('holdings-table').style.display = 'table';
              
              document.getElementById('total-holdings').textContent = '$' + portfolio.totalValue.toLocaleString();
              document.getElementById('asset-count').textContent = portfolio.holdings.length;
              document.getElementById('yield-earned').textContent = '$' + portfolio.totalYield.toLocaleString();
              document.getElementById('performance').textContent = portfolio.performance.toFixed(2) + '%';
              
              const holdingsBody = document.getElementById('holdings-body');
              holdingsBody.innerHTML = portfolio.holdings.map(holding => \`
                <tr>
                  <td>\${holding.assetName}</td>
                  <td>\${holding.assetType}</td>
                  <td>\${holding.tokenBalance.toLocaleString()}</td>
                  <td>$\${holding.currentValue.toLocaleString()}</td>
                  <td>$\${holding.yieldEarned.toLocaleString()}</td>
                  <td style="color: \${holding.performance >= 0 ? '#28a745' : '#dc3545'}">\${holding.performance.toFixed(2)}%</td>
                </tr>
              \`).join('');
            }
          </script>
        </body>
        </html>
      `);
        });
        // Compliance dashboard
        this.app.get('/compliance', (req, res) => {
            res.send(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>Compliance - Aurigraph RWA</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; background: #f5f5f5; }
            .container { max-width: 1200px; margin: 0 auto; background: white; padding: 20px; border-radius: 8px; }
            .header { background: linear-gradient(135deg, #fd7e14 0%, #e83e8c 100%); color: white; padding: 20px; border-radius: 8px; margin-bottom: 20px; }
            .compliance-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 20px; margin: 20px 0; }
            .compliance-card { background: #f8f9fa; padding: 20px; border-radius: 8px; }
            .status-ok { border-left: 4px solid #28a745; }
            .status-warning { border-left: 4px solid #ffc107; }
            .status-error { border-left: 4px solid #dc3545; }
            .nav a { margin-right: 15px; color: #fd7e14; text-decoration: none; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>⚖️ Compliance Dashboard</h1>
              <p>Monitor regulatory compliance across jurisdictions</p>
            </div>
            
            <div class="nav">
              <a href="/">← Back to Dashboard</a>
              <a href="/assets">Asset Registry</a>
              <a href="/tokenization">Tokenization</a>
            </div>

            <div class="compliance-grid" id="compliance-status">
              <!-- Compliance status will be loaded here -->
            </div>
          </div>

          <script>
            async function loadComplianceStatus() {
              try {
                const response = await fetch('/api/compliance/status');
                const status = await response.json();
                
                const statusContainer = document.getElementById('compliance-status');
                statusContainer.innerHTML = Object.entries(status.jurisdictions).map(([jurisdiction, data]) => \`
                  <div class="compliance-card \${data.status === 'COMPLIANT' ? 'status-ok' : 'status-warning'}">
                    <h3>\${jurisdiction}</h3>
                    <p><strong>Status:</strong> \${data.status}</p>
                    <p><strong>Framework:</strong> \${data.framework}</p>
                    <p><strong>Compliance Rate:</strong> \${data.complianceRate}%</p>
                    <p><strong>Last Check:</strong> \${new Date(data.lastCheck).toLocaleDateString()}</p>
                  </div>
                \`).join('');
              } catch (error) {
                console.error('Failed to load compliance status:', error);
              }
            }

            loadComplianceStatus();
            setInterval(loadComplianceStatus, 60000); // Update every minute
          </script>
        </body>
        </html>
      `);
        });
        // Analytics dashboard
        this.app.get('/analytics', (req, res) => {
            res.send(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>Analytics - Aurigraph RWA</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; background: #f5f5f5; }
            .container { max-width: 1200px; margin: 0 auto; background: white; padding: 20px; border-radius: 8px; }
            .header { background: linear-gradient(135deg, #17a2b8 0%, #6610f2 100%); color: white; padding: 20px; border-radius: 8px; margin-bottom: 20px; }
            .analytics-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(350px, 1fr)); gap: 20px; margin: 20px 0; }
            .analytics-card { background: #f8f9fa; padding: 20px; border-radius: 8px; border-left: 4px solid #17a2b8; }
            .chart-placeholder { height: 200px; background: #e9ecef; border-radius: 4px; display: flex; align-items: center; justify-content: center; color: #6c757d; margin: 10px 0; }
            .nav a { margin-right: 15px; color: #17a2b8; text-decoration: none; }
            .metric-row { display: flex; justify-content: space-between; margin: 10px 0; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>📊 Analytics Dashboard</h1>
              <p>Real-time analytics and performance metrics for the RWA platform</p>
            </div>
            
            <div class="nav">
              <a href="/">← Back to Dashboard</a>
              <a href="/assets">Asset Registry</a>
              <a href="/tokenization">Tokenization</a>
            </div>

            <div class="analytics-grid" id="analytics-content">
              <!-- Analytics will be loaded here -->
            </div>
          </div>

          <script>
            async function loadAnalytics() {
              try {
                const response = await fetch('/api/analytics/dashboard');
                const analytics = await response.json();
                
                const analyticsContainer = document.getElementById('analytics-content');
                analyticsContainer.innerHTML = \`
                  <div class="analytics-card">
                    <h3>📈 Platform Performance</h3>
                    <div class="metric-row">
                      <span>Total Assets:</span>
                      <span>\${analytics.totalAssets}</span>
                    </div>
                    <div class="metric-row">
                      <span>Tokenized Assets:</span>
                      <span>\${analytics.totalTokenizedAssets}</span>
                    </div>
                    <div class="metric-row">
                      <span>Total Value:</span>
                      <span>$\${analytics.totalValue.toLocaleString()}</span>
                    </div>
                    <div class="metric-row">
                      <span>24h Volume:</span>
                      <span>$\${analytics.volume24h.toLocaleString()}</span>
                    </div>
                  </div>
                  
                  <div class="analytics-card">
                    <h3>🏢 Asset Classes</h3>
                    <div class="chart-placeholder">Asset Distribution Chart</div>
                    \${Object.entries(analytics.assetDistribution).map(([type, count]) => \`
                      <div class="metric-row">
                        <span>\${type}:</span>
                        <span>\${count}</span>
                      </div>
                    \`).join('')}
                  </div>
                  
                  <div class="analytics-card">
                    <h3>⚖️ Compliance Status</h3>
                    <div class="metric-row">
                      <span>Overall Rate:</span>
                      <span>\${analytics.complianceRate.toFixed(1)}%</span>
                    </div>
                    <div class="metric-row">
                      <span>Active Frameworks:</span>
                      <span>\${analytics.activeFrameworks}</span>
                    </div>
                    <div class="metric-row">
                      <span>Pending Reviews:</span>
                      <span>\${analytics.pendingReviews}</span>
                    </div>
                  </div>
                  
                  <div class="analytics-card">
                    <h3>🔗 Digital Twins</h3>
                    <div class="metric-row">
                      <span>Active Twins:</span>
                      <span>\${analytics.digitalTwins.active}</span>
                    </div>
                    <div class="metric-row">
                      <span>IoT Sensors:</span>
                      <span>\${analytics.digitalTwins.sensors}</span>
                    </div>
                    <div class="metric-row">
                      <span>Data Points/day:</span>
                      <span>\${analytics.digitalTwins.dataPoints.toLocaleString()}</span>
                    </div>
                  </div>
                \`;
              } catch (error) {
                console.error('Failed to load analytics:', error);
              }
            }

            loadAnalytics();
            setInterval(loadAnalytics, 30000); // Update every 30 seconds
          </script>
        </body>
        </html>
      `);
        });
    }
    async start(port = 3021) {
        return new Promise((resolve) => {
            this.app.listen(port, () => {
                this.logger.info(`🌐 RWA Web Interface started on http://localhost:${port}`);
                resolve();
            });
        });
    }
    getApp() {
        return this.app;
    }
}
exports.RWAWebInterface = RWAWebInterface;
