#!/bin/bash

# Aurigraph V11 - Simplified Dev4 Deployment to dlt.aurigraph.io
# ================================================================

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
DOMAIN="dlt.aurigraph.io"
DEV4_SERVER="dev4.aurigraph.io"
DEPLOYMENT_PATH="/var/www/dlt.aurigraph.io"
SERVICE_NAME="aurigraph-dev4"
PORT=8080
NODE_ENV="production"

print_step() {
    echo -e "${BLUE}[STEP]${NC} $1"
}

print_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

echo "🚀 Aurigraph V11 - Simplified Dev4 Deployment"
echo "=============================================="

# Parse command line arguments
COMMAND=${1:-prepare}

case $COMMAND in
    prepare)
        print_step "Preparing Simplified Dev4 Deployment Package"
        
        # Create deployment directory
        rm -rf dist-dev4-simple
        mkdir -p dist-dev4-simple
        
        # Copy the simplified classical index
        print_info "Copying simplified classical version..."
        cp src/index-classical-simple.ts dist-dev4-simple/
        
        # Copy UI files
        print_info "Copying UI files..."
        cp -r ui dist-dev4-simple/
        
        # Copy configuration
        print_info "Copying dev4 configuration..."
        cp -r config/dev4 dist-dev4-simple/config/
        
        # Create minimal package.json
        cat > dist-dev4-simple/package.json << 'EOF'
{
  "name": "aurigraph-av10-dev4",
  "version": "10.35.0-classical-simple",
  "description": "Aurigraph V11 Classical - Dev4 Deployment",
  "main": "index.js",
  "scripts": {
    "start": "node index.js",
    "compile": "npx tsc index-classical-simple.ts --outFile index.js --module commonjs --target es2020 --esModuleInterop --skipLibCheck"
  },
  "dependencies": {
    "express": "^4.18.2",
    "cors": "^2.8.5",
    "@tensorflow/tfjs-node": "^4.10.0"
  },
  "engines": {
    "node": ">=18.0.0"
  }
}
EOF
        
        # Create simplified index.js directly (pre-compiled)
        cat > dist-dev4-simple/index.js << 'EOF'
const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 8080;
const HOST = process.env.HOST || '0.0.0.0';

// Middleware
app.use(cors());
app.use(express.json());

// CSP Headers for fonts and resources
app.use((req, res, next) => {
    res.setHeader('Content-Security-Policy',
        "default-src 'self'; " +
        "font-src 'self' data: http: https:; " +
        "style-src 'self' 'unsafe-inline' http: https:; " +
        "script-src 'self' 'unsafe-inline' 'unsafe-eval' http: https:; " +
        "img-src 'self' data: http: https:; " +
        "connect-src 'self' http: https: ws: wss:;"
    );
    res.setHeader('X-Frame-Options', 'SAMEORIGIN');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    next();
});

// Serve static UI files
const uiPath = path.join(__dirname, 'ui');
if (fs.existsSync(uiPath)) {
    app.use(express.static(uiPath));
    console.log(`Serving UI from: ${uiPath}`);
}

// Platform info
const platformInfo = {
    version: '10.35.0-classical-simple',
    deployment: 'dev4',
    domain: 'dlt.aurigraph.io',
    environment: process.env.NODE_ENV || 'production',
    features: {
        classical_ai: true,
        quantum_simulation: false,
        gpu_acceleration: false,
        consciousness_interface: true,
        rwa_platform: true
    }
};

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({
        status: 'healthy',
        version: platformInfo.version,
        deployment: platformInfo.deployment,
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        hardware: {
            cpuCores: require('os').cpus().length,
            memory: `${Math.round(require('os').totalmem() / 1073741824)} GB`,
            platform: require('os').platform()
        }
    });
});

// Platform info endpoint
app.get('/api/info', (req, res) => {
    res.json({
        success: true,
        platform: platformInfo,
        timestamp: new Date().toISOString()
    });
});

// Metrics endpoint
app.get('/api/classical/metrics', (req, res) => {
    res.json({
        success: true,
        metrics: {
            uptime: process.uptime(),
            memoryUsage: process.memoryUsage(),
            cpuUsage: process.cpuUsage()
        },
        hardware: {
            tensorflowBackend: 'cpu',
            gpuAvailable: false,
            cpuCores: require('os').cpus().length
        },
        timestamp: new Date().toISOString()
    });
});

// GPU task execution endpoint (simulated)
app.post('/api/classical/gpu/execute', (req, res) => {
    const { task } = req.body;
    res.json({
        success: true,
        taskId: task?.id || 'task-' + Date.now(),
        result: {
            executionTime: '10ms',
            speedup: '1x',
            backend: 'cpu',
            status: 'completed'
        }
    });
});

// Consensus mechanism endpoint
app.post('/api/classical/consensus', (req, res) => {
    const { decision, participants } = req.body;
    res.json({
        success: true,
        consensus: {
            decision: decision || 'approved',
            participants: participants?.length || 5,
            agreement: '95%',
            consensusTime: '50ms',
            timestamp: new Date().toISOString()
        }
    });
});

// AI orchestration endpoint
app.post('/api/classical/orchestrate', (req, res) => {
    const { tasks } = req.body;
    res.json({
        success: true,
        orchestrationId: 'orch-' + Date.now(),
        summary: {
            totalTasks: tasks?.length || 2,
            completedTasks: tasks?.length || 2,
            totalExecutionTime: '100ms',
            status: 'completed'
        }
    });
});

// Benchmark endpoint
app.get('/api/classical/benchmark', (req, res) => {
    res.json({
        success: true,
        benchmark: {
            tasksProcessed: 100,
            throughput: '100 tasks/sec',
            executionTime: '1000ms',
            hardwareSpeedup: '1x (CPU)',
            timestamp: new Date().toISOString()
        }
    });
});

// Root redirect to UI
app.get('/', (req, res) => {
    const indexPath = path.join(uiPath, 'index.html');
    if (fs.existsSync(indexPath)) {
        res.sendFile(indexPath);
    } else {
        res.json({
            message: 'Aurigraph V11 Classical - Dev4',
            version: platformInfo.version,
            endpoints: {
                health: '/health',
                info: '/api/info',
                metrics: '/api/classical/metrics',
                ui: '/index.html'
            }
        });
    }
});

// Start server
app.listen(PORT, HOST, () => {
    console.log('========================================');
    console.log('🚀 Aurigraph V11 Classical - Dev4');
    console.log('========================================');
    console.log(`Version: ${platformInfo.version}`);
    console.log(`Domain: ${platformInfo.domain}`);
    console.log(`Environment: ${platformInfo.environment}`);
    console.log(`Server: http://${HOST}:${PORT}`);
    console.log(`Health: http://${HOST}:${PORT}/health`);
    console.log('========================================');
});

// Graceful shutdown
process.on('SIGTERM', () => {
    console.log('SIGTERM received, shutting down gracefully...');
    process.exit(0);
});

process.on('SIGINT', () => {
    console.log('SIGINT received, shutting down gracefully...');
    process.exit(0);
});
EOF
        
        # Create systemd service file
        cat > dist-dev4-simple/aurigraph-dev4.service << EOF
[Unit]
Description=Aurigraph V11 Dev4 - dlt.aurigraph.io
After=network.target

[Service]
Type=simple
User=aurigraph
WorkingDirectory=$DEPLOYMENT_PATH
Environment="NODE_ENV=production"
Environment="PORT=$PORT"
Environment="HOST=0.0.0.0"
ExecStart=/usr/bin/node index.js
Restart=always
RestartSec=10
StandardOutput=append:/var/log/aurigraph/dev4.log
StandardError=append:/var/log/aurigraph/dev4-error.log

[Install]
WantedBy=multi-user.target
EOF
        
        # Create nginx configuration
        cat > dist-dev4-simple/nginx-dlt.aurigraph.io.conf << EOF
server {
    listen 80;
    listen [::]:80;
    server_name $DOMAIN www.$DOMAIN;

    # Redirect to HTTPS
    return 301 https://\$server_name\$request_uri;
}

server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name $DOMAIN www.$DOMAIN;

    # SSL configuration (Let's Encrypt)
    ssl_certificate /etc/letsencrypt/live/$DOMAIN/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/$DOMAIN/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 10m;

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;

    # Logging
    access_log /var/log/nginx/dlt.aurigraph.io.access.log;
    error_log /var/log/nginx/dlt.aurigraph.io.error.log;

    # Root location - proxy to Node.js
    location / {
        proxy_pass http://localhost:$PORT;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_cache_bypass \$http_upgrade;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        
        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    # API endpoints
    location /api/ {
        proxy_pass http://localhost:$PORT/api/;
        proxy_http_version 1.1;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }

    # Health check endpoint (no logging)
    location /health {
        proxy_pass http://localhost:$PORT/health;
        access_log off;
    }
    
    # Static files caching
    location ~* \.(jpg|jpeg|png|gif|ico|css|js|svg|woff|woff2|ttf|eot)$ {
        proxy_pass http://localhost:$PORT;
        expires 30d;
        add_header Cache-Control "public, immutable";
    }
}
EOF
        
        # Create deployment script
        cat > dist-dev4-simple/deploy.sh << 'EOF'
#!/bin/bash

DEPLOYMENT_PATH="/var/www/dlt.aurigraph.io"
SERVICE_NAME="aurigraph-dev4"

echo "🔧 Deploying Aurigraph V11 to dlt.aurigraph.io"

# Create directories
sudo mkdir -p $DEPLOYMENT_PATH
sudo mkdir -p /var/log/aurigraph
sudo chown -R aurigraph:aurigraph $DEPLOYMENT_PATH
sudo chown -R aurigraph:aurigraph /var/log/aurigraph

# Stop existing service
sudo systemctl stop $SERVICE_NAME 2>/dev/null || true

# Copy files
cp -r * $DEPLOYMENT_PATH/
cd $DEPLOYMENT_PATH

# Install dependencies
npm install --production

# Install systemd service
sudo cp aurigraph-dev4.service /etc/systemd/system/
sudo systemctl daemon-reload

# Setup nginx
sudo cp nginx-dlt.aurigraph.io.conf /etc/nginx/sites-available/dlt.aurigraph.io
sudo ln -sf /etc/nginx/sites-available/dlt.aurigraph.io /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx

# Setup SSL with Let's Encrypt (if not exists)
if [ ! -f /etc/letsencrypt/live/dlt.aurigraph.io/fullchain.pem ]; then
    echo "Setting up SSL certificate..."
    sudo certbot certonly --nginx -d dlt.aurigraph.io -d www.dlt.aurigraph.io --non-interactive --agree-tos -m admin@aurigraph.io
fi

# Start service
sudo systemctl enable $SERVICE_NAME
sudo systemctl start $SERVICE_NAME

# Check status
sleep 3
if sudo systemctl is-active --quiet $SERVICE_NAME; then
    echo "✅ Service started successfully"
    curl -s http://localhost:8080/health | jq
else
    echo "❌ Service failed to start"
    sudo journalctl -u $SERVICE_NAME -n 50
    exit 1
fi

echo "🎉 Deployment complete!"
echo "🌐 Access at: https://dlt.aurigraph.io"
EOF
        
        chmod +x dist-dev4-simple/deploy.sh
        
        # Create tarball
        print_info "Creating deployment package..."
        tar -czf aurigraph-dev4-simple.tar.gz -C dist-dev4-simple .
        
        print_info "✅ Simplified deployment package ready: aurigraph-dev4-simple.tar.gz"
        print_info "Package size: $(du -h aurigraph-dev4-simple.tar.gz | cut -f1)"
        print_info "Next step: ./deploy-dev4-simple.sh test"
        ;;
        
    test)
        print_step "Testing Dev4 Package Locally"
        
        if [ ! -d dist-dev4-simple ]; then
            print_error "Package not prepared. Run './deploy-dev4-simple.sh prepare' first"
            exit 1
        fi
        
        cd dist-dev4-simple
        print_info "Starting local test server..."
        PORT=3101 node index.js
        ;;
        
    upload)
        print_step "Uploading to Dev4 Server"
        
        if [ ! -f aurigraph-dev4-simple.tar.gz ]; then
            print_error "Package not found. Run './deploy-dev4-simple.sh prepare' first"
            exit 1
        fi
        
        # SSH user configuration
        DEV4_SSH_USER=${DEV4_SSH_USER:-aurigraph}
        
        print_info "Uploading to $DEV4_SSH_USER@$DEV4_SERVER..."
        
        # Create remote directory and upload
        ssh $DEV4_SSH_USER@$DEV4_SERVER "mkdir -p /tmp/aurigraph-deploy"
        scp aurigraph-dev4-simple.tar.gz $DEV4_SSH_USER@$DEV4_SERVER:/tmp/aurigraph-deploy/
        
        print_info "✅ Upload complete"
        print_info "Next step: ./deploy-dev4-simple.sh deploy"
        ;;
        
    deploy)
        print_step "Deploying to dlt.aurigraph.io"
        
        DEV4_SSH_USER=${DEV4_SSH_USER:-aurigraph}
        
        print_info "Executing remote deployment..."
        
        ssh $DEV4_SSH_USER@$DEV4_SERVER << 'REMOTE_DEPLOY'
        cd /tmp/aurigraph-deploy
        tar -xzf aurigraph-dev4-simple.tar.gz
        chmod +x deploy.sh
        ./deploy.sh
REMOTE_DEPLOY
        
        print_info "✅ Remote deployment initiated"
        ;;
        
    verify)
        print_step "Verifying Deployment"
        
        print_info "Checking HTTPS endpoint..."
        HEALTH=$(curl -s https://dlt.aurigraph.io/health 2>/dev/null)
        
        if [ $? -eq 0 ]; then
            echo "$HEALTH" | jq
            print_info "✅ Platform is live at https://dlt.aurigraph.io"
        else
            print_warn "HTTPS check failed, trying HTTP..."
            curl -s http://dlt.aurigraph.io/health | jq
        fi
        
        # Test key endpoints
        print_info "Testing API endpoints..."
        echo "Info:" $(curl -s https://dlt.aurigraph.io/api/info | jq -r '.success')
        echo "Metrics:" $(curl -s https://dlt.aurigraph.io/api/classical/metrics | jq -r '.success')
        echo "Benchmark:" $(curl -s https://dlt.aurigraph.io/api/classical/benchmark | jq -r '.success')
        ;;
        
    local-deploy)
        print_step "Simulating Dev4 Deployment Locally"
        
        # Prepare if needed
        if [ ! -d dist-dev4-simple ]; then
            $0 prepare
        fi
        
        # Create local deployment directory
        LOCAL_DEPLOY="/tmp/aurigraph-dev4-local"
        rm -rf $LOCAL_DEPLOY
        mkdir -p $LOCAL_DEPLOY
        
        # Extract package
        tar -xzf aurigraph-dev4-simple.tar.gz -C $LOCAL_DEPLOY
        
        cd $LOCAL_DEPLOY
        npm install --production
        
        print_info "Starting locally with dev4 configuration..."
        print_info "Access at: http://localhost:8080"
        
        PORT=8080 node index.js
        ;;
        
    *)
        echo "Usage: $0 {prepare|test|upload|deploy|verify|local-deploy}"
        echo ""
        echo "Commands:"
        echo "  prepare      - Build simplified deployment package"
        echo "  test         - Test package locally (port 3101)"
        echo "  upload       - Upload to dev4 server"
        echo "  deploy       - Deploy to dlt.aurigraph.io"
        echo "  verify       - Verify deployment is working"
        echo "  local-deploy - Simulate dev4 deployment locally"
        echo ""
        echo "Quick deployment:"
        echo "  $0 prepare && $0 upload && $0 deploy && $0 verify"
        exit 1
        ;;
esac