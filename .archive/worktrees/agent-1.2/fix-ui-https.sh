#!/bin/bash

# Fix UI serving through HTTPS on dlt.aurigraph.io
# This script updates the dashboard HTML and fixes nginx configuration

echo "🔧 Fixing UI on HTTPS for dlt.aurigraph.io"
echo "=========================================="

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Server details
SERVER="dlt.aurigraph.io"
USER="ubuntu"

echo -e "${BLUE}ℹ️  Creating updated dashboard HTML...${NC}"

# Create updated dashboard HTML with proper API endpoints
cat > demo-dashboard-https.html << 'EOF'
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Aurigraph DLT Dashboard</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background: linear-gradient(135deg, #0f0f23 0%, #1a1a3a 50%, #2d1b69 100%);
            color: #ffffff;
            overflow-x: hidden;
            min-height: 100vh;
        }

        .container {
            max-width: 1400px;
            margin: 0 auto;
            padding: 20px;
        }

        .header {
            text-align: center;
            margin-bottom: 40px;
            padding: 30px 0;
            background: rgba(255, 255, 255, 0.05);
            border-radius: 20px;
            backdrop-filter: blur(10px);
            border: 1px solid rgba(255, 255, 255, 0.1);
        }

        .header h1 {
            font-size: 3em;
            margin-bottom: 10px;
            background: linear-gradient(45deg, #00d4ff, #ff6b6b, #4ecdc4);
            background-size: 300%;
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            animation: gradientShift 3s ease infinite;
        }

        @keyframes gradientShift {
            0%, 100% { background-position: 0% 50%; }
            50% { background-position: 100% 50%; }
        }

        .status-indicator {
            display: inline-flex;
            align-items: center;
            gap: 10px;
            padding: 10px 20px;
            background: rgba(0, 255, 0, 0.1);
            border: 1px solid #00ff00;
            border-radius: 25px;
            font-weight: bold;
        }

        .status-dot {
            width: 12px;
            height: 12px;
            background: #00ff00;
            border-radius: 50%;
            animation: pulse 2s infinite;
        }

        @keyframes pulse {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.5; }
        }

        .metrics-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
            gap: 20px;
            margin-bottom: 40px;
        }

        .metric-card {
            background: rgba(255, 255, 255, 0.08);
            border: 1px solid rgba(255, 255, 255, 0.12);
            border-radius: 16px;
            padding: 25px;
            text-align: center;
            backdrop-filter: blur(10px);
            transition: all 0.3s ease;
            position: relative;
            overflow: hidden;
        }

        .metric-card::before {
            content: '';
            position: absolute;
            top: 0;
            left: -100%;
            width: 100%;
            height: 2px;
            background: linear-gradient(90deg, transparent, #00d4ff, transparent);
            animation: shimmer 3s infinite;
        }

        @keyframes shimmer {
            0% { left: -100%; }
            100% { left: 100%; }
        }

        .metric-card:hover {
            transform: translateY(-5px);
            box-shadow: 0 20px 40px rgba(0, 212, 255, 0.2);
        }

        .metric-title {
            font-size: 0.9em;
            color: #a0a0a0;
            margin-bottom: 10px;
            text-transform: uppercase;
            letter-spacing: 1px;
        }

        .metric-value {
            font-size: 2.5em;
            font-weight: bold;
            margin-bottom: 5px;
            color: #00d4ff;
        }

        .controls-section {
            background: rgba(255, 255, 255, 0.05);
            border-radius: 16px;
            padding: 30px;
            margin-bottom: 40px;
            border: 1px solid rgba(255, 255, 255, 0.1);
        }

        .btn {
            padding: 12px 24px;
            border: none;
            border-radius: 8px;
            font-size: 1em;
            font-weight: bold;
            cursor: pointer;
            transition: all 0.3s ease;
            background: linear-gradient(45deg, #00d4ff, #0099cc);
            color: white;
            margin: 5px;
        }

        .btn:hover {
            transform: translateY(-2px);
            box-shadow: 0 10px 20px rgba(0, 153, 204, 0.3);
        }

        .footer {
            text-align: center;
            padding: 20px;
            color: #666;
            font-size: 0.9em;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🌐 Aurigraph DLT</h1>
            <p>High-Performance Blockchain Platform</p>
            <div class="status-indicator">
                <div class="status-dot"></div>
                <span id="statusText">ACTIVE</span>
            </div>
        </div>

        <div class="metrics-grid">
            <div class="metric-card">
                <div class="metric-title">Total TPS</div>
                <div class="metric-value" id="totalTPS">Loading...</div>
            </div>
            <div class="metric-card">
                <div class="metric-title">Total Transactions</div>
                <div class="metric-value" id="totalTransactions">Loading...</div>
            </div>
            <div class="metric-card">
                <div class="metric-title">Success Rate</div>
                <div class="metric-value" id="successRate">Loading...</div>
            </div>
            <div class="metric-card">
                <div class="metric-title">Block Height</div>
                <div class="metric-value" id="blockHeight">Loading...</div>
            </div>
        </div>

        <div class="controls-section">
            <h2 style="text-align: center; margin-bottom: 20px;">Quick Actions</h2>
            <div style="text-align: center;">
                <button class="btn" onclick="window.location.href='/channel/status'">View Status</button>
                <button class="btn" onclick="window.location.href='/channel/metrics'">View Metrics</button>
                <button class="btn" onclick="window.location.href='/channel/nodes'">View Nodes</button>
                <button class="btn" onclick="window.location.href='/vizro/'">Vizro Dashboard</button>
            </div>
        </div>

        <div class="footer">
            <p>🌟 Aurigraph DLT - Secured with HTTPS</p>
            <p>© 2025 Aurigraph DLT Corporation</p>
        </div>
    </div>

    <script>
        // Use relative URLs for HTTPS compatibility
        async function updateDashboard() {
            try {
                const response = await fetch('/channel/status');
                if (response.ok) {
                    const data = await response.json();
                    const metrics = data.metrics || {};
                    
                    document.getElementById('totalTPS').textContent = 
                        (metrics.totalTPS || 0).toLocaleString();
                    document.getElementById('totalTransactions').textContent = 
                        (metrics.totalTransactions || 0).toLocaleString();
                    document.getElementById('successRate').textContent = 
                        ((metrics.confirmedTransactions / metrics.totalTransactions * 100) || 0).toFixed(1) + '%';
                    document.getElementById('blockHeight').textContent = 
                        (metrics.blockHeight || 0).toLocaleString();
                }
            } catch (error) {
                console.error('Update error:', error);
            }
        }

        // Update every 2 seconds
        updateDashboard();
        setInterval(updateDashboard, 2000);
    </script>
</body>
</html>
EOF

echo -e "${GREEN}✅ Created updated dashboard HTML${NC}"

# Create nginx configuration update
echo -e "${BLUE}ℹ️  Creating nginx configuration update...${NC}"

cat > nginx-ui-fix.conf << 'EOF'
# Aurigraph DLT HTTPS Configuration with UI Fix
# Serves dashboard at root path

upstream aurigraph_api {
    server 127.0.0.1:4004;
    keepalive 64;
}

upstream aurigraph_ws {
    server 127.0.0.1:4005;
    keepalive 64;
}

upstream vizro_dashboard {
    server 127.0.0.1:8050;
    keepalive 32;
}

# HTTP server - redirect to HTTPS
server {
    listen 80;
    listen [::]:80;
    server_name dlt.aurigraph.io;
    
    location /.well-known/acme-challenge/ {
        root /var/www/html;
    }
    
    location / {
        return 301 https://$server_name$request_uri;
    }
}

# HTTPS server
server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name dlt.aurigraph.io;
    
    # SSL certificates (managed by certbot)
    ssl_certificate /etc/letsencrypt/live/dlt.aurigraph.io/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/dlt.aurigraph.io/privkey.pem;
    
    # SSL configuration
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers off;
    
    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    
    # Logging
    access_log /var/log/nginx/dlt.aurigraph.io.access.log;
    error_log /var/log/nginx/dlt.aurigraph.io.error.log;
    
    # Document root for static files
    root /var/www/aurigraph;
    index index.html;
    
    # Root location - serve dashboard HTML
    location = / {
        try_files /index.html @app;
    }
    
    # API endpoints
    location /channel/ {
        proxy_pass http://aurigraph_api;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_buffering off;
        
        # CORS headers
        add_header 'Access-Control-Allow-Origin' '*' always;
        add_header 'Access-Control-Allow-Methods' 'GET, POST, OPTIONS' always;
        add_header 'Access-Control-Allow-Headers' 'Content-Type, Authorization' always;
    }
    
    # Health check
    location /health {
        proxy_pass http://aurigraph_api;
        access_log off;
    }
    
    # API documentation
    location /api/ {
        proxy_pass http://aurigraph_api;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
    
    # WebSocket endpoint
    location /ws {
        proxy_pass http://aurigraph_ws;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
    
    # Vizro Dashboard
    location /vizro/ {
        proxy_pass http://vizro_dashboard/;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_buffering off;
    }
    
    # Dashboard assets
    location /_dash {
        proxy_pass http://vizro_dashboard;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
    
    # Fallback to app
    location @app {
        proxy_pass http://aurigraph_api;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
EOF

echo -e "${GREEN}✅ Created nginx configuration${NC}"

# Create deployment script
echo -e "${BLUE}ℹ️  Creating deployment script...${NC}"

cat > deploy-ui-fix.sh << 'EOF'
#!/bin/bash

# Deploy UI fix to dlt.aurigraph.io
echo "🚀 Deploying UI fix to dlt.aurigraph.io"
echo "========================================"

# Create directory for static files
sudo mkdir -p /var/www/aurigraph
sudo chown -R www-data:www-data /var/www/aurigraph

# Copy dashboard HTML
sudo cp demo-dashboard-https.html /var/www/aurigraph/index.html

# Backup current nginx config
sudo cp /etc/nginx/sites-available/dlt.aurigraph.io /etc/nginx/sites-available/dlt.aurigraph.io.backup

# Update nginx configuration
sudo cp nginx-ui-fix.conf /etc/nginx/sites-available/dlt.aurigraph.io

# Test nginx configuration
sudo nginx -t

if [ $? -eq 0 ]; then
    echo "✅ Nginx configuration valid"
    sudo systemctl reload nginx
    echo "✅ Nginx reloaded successfully"
    echo ""
    echo "🎉 UI fix deployed successfully!"
    echo "Visit: https://dlt.aurigraph.io"
else
    echo "❌ Nginx configuration error"
    echo "Restoring backup..."
    sudo cp /etc/nginx/sites-available/dlt.aurigraph.io.backup /etc/nginx/sites-available/dlt.aurigraph.io
    exit 1
fi
EOF

chmod +x deploy-ui-fix.sh

echo -e "${GREEN}✅ Created deployment script${NC}"
echo ""
echo "📋 Files created:"
echo "  1. demo-dashboard-https.html - Updated dashboard for HTTPS"
echo "  2. nginx-ui-fix.conf - Fixed nginx configuration"
echo "  3. deploy-ui-fix.sh - Deployment script"
echo ""
echo "🚀 To deploy the fix:"
echo ""
echo "  1. Upload files to server:"
echo "     scp demo-dashboard-https.html nginx-ui-fix.conf deploy-ui-fix.sh ${USER}@${SERVER}:~/"
echo ""
echo "  2. SSH to server and run:"
echo "     ssh ${USER}@${SERVER}"
echo "     sudo ./deploy-ui-fix.sh"
echo ""
echo "This will:"
echo "  ✓ Create /var/www/aurigraph directory for static files"
echo "  ✓ Copy dashboard HTML to be served at root path"
echo "  ✓ Update nginx to serve the UI properly"
echo "  ✓ Reload nginx with the new configuration"
echo ""
echo "✅ Fix ready for deployment!"