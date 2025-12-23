#!/bin/bash

# Comprehensive CORS and NGINX Testing & Fix Script for Aurigraph DLT
# Tests and fixes all CORS, NGINX, and HTTPS-related issues

echo "🔧 Aurigraph DLT - CORS & NGINX Testing and Fix Script"
echo "======================================================"
echo "Date: $(date)"
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Configuration
DOMAIN="dlt.aurigraph.io"
LOCAL_API_PORT=4004
LOCAL_WS_PORT=4005
LOCAL_VIZRO_PORT=8050
RESULTS_FILE="cors-nginx-test-results.txt"

# Initialize results file
echo "CORS & NGINX Test Results - $(date)" > $RESULTS_FILE
echo "======================================" >> $RESULTS_FILE

# Function to print colored output
print_status() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

# Function to test CORS headers
test_cors() {
    local url=$1
    local method=${2:-GET}
    local origin=${3:-https://dlt.aurigraph.io}
    
    echo ""
    print_info "Testing CORS for $url (Method: $method, Origin: $origin)"
    
    # Test preflight request
    if [ "$method" != "GET" ]; then
        print_info "Testing preflight (OPTIONS) request..."
        response=$(curl -s -I -X OPTIONS "$url" \
            -H "Origin: $origin" \
            -H "Access-Control-Request-Method: $method" \
            -H "Access-Control-Request-Headers: Content-Type" 2>&1)
        
        if echo "$response" | grep -qi "Access-Control-Allow-Origin"; then
            print_status "Preflight request successful"
            echo "$response" | grep -i "access-control" >> $RESULTS_FILE
        else
            print_error "Preflight request failed - No CORS headers"
            echo "FAILED: Preflight for $url" >> $RESULTS_FILE
        fi
    fi
    
    # Test actual request
    print_info "Testing $method request..."
    response=$(curl -s -I -X "$method" "$url" \
        -H "Origin: $origin" \
        -H "Content-Type: application/json" 2>&1)
    
    # Check for CORS headers
    if echo "$response" | grep -qi "Access-Control-Allow-Origin"; then
        allow_origin=$(echo "$response" | grep -i "Access-Control-Allow-Origin" | head -1)
        print_status "CORS headers present: $allow_origin"
        echo "SUCCESS: $method $url - $allow_origin" >> $RESULTS_FILE
    else
        print_error "No CORS headers in response"
        echo "FAILED: $method $url - No CORS headers" >> $RESULTS_FILE
    fi
    
    # Check HTTP status
    http_status=$(echo "$response" | head -1 | grep -oE "[0-9]{3}")
    if [ -n "$http_status" ]; then
        if [ "$http_status" -ge 200 ] && [ "$http_status" -lt 300 ]; then
            print_status "HTTP Status: $http_status"
        else
            print_warning "HTTP Status: $http_status"
        fi
    fi
}

# Function to test WebSocket CORS
test_websocket_cors() {
    local ws_url=$1
    local origin=$2
    
    print_info "Testing WebSocket CORS for $ws_url"
    
    # Use Node.js to test WebSocket connection with CORS
    cat > test-ws-cors.js << 'EOF'
const WebSocket = require('ws');

const wsUrl = process.argv[2];
const origin = process.argv[3];

console.log(`Testing WebSocket: ${wsUrl} with Origin: ${origin}`);

const ws = new WebSocket(wsUrl, {
    headers: {
        'Origin': origin
    }
});

ws.on('open', () => {
    console.log('✅ WebSocket connection successful');
    ws.close();
    process.exit(0);
});

ws.on('error', (error) => {
    console.error('❌ WebSocket connection failed:', error.message);
    process.exit(1);
});

setTimeout(() => {
    console.error('❌ WebSocket connection timeout');
    process.exit(1);
}, 5000);
EOF

    if command -v node &> /dev/null && [ -f test-ws-cors.js ]; then
        node test-ws-cors.js "$ws_url" "$origin"
        rm -f test-ws-cors.js
    else
        print_warning "Node.js not available for WebSocket testing"
    fi
}

# Function to create fixed NGINX configuration
create_fixed_nginx_config() {
    print_info "Creating fixed NGINX configuration..."
    
    cat > nginx-cors-fixed.conf << 'EOF'
# Fixed NGINX Configuration for Aurigraph DLT with Complete CORS Support

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

# Map $http_origin to $cors_origin for dynamic CORS
map $http_origin $cors_origin {
    default "";
    "~^https?://dlt\.aurigraph\.io$" $http_origin;
    "~^https?://localhost(:[0-9]+)?$" $http_origin;
    "~^https?://127\.0\.0\.1(:[0-9]+)?$" $http_origin;
    "~^https?://[^/]+\.aurigraph\.io$" $http_origin;
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

# HTTPS server with comprehensive CORS
server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name dlt.aurigraph.io;
    
    # SSL certificates
    ssl_certificate /etc/letsencrypt/live/dlt.aurigraph.io/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/dlt.aurigraph.io/privkey.pem;
    
    # SSL configuration
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers off;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 10m;
    ssl_stapling on;
    ssl_stapling_verify on;
    
    # Security headers (without HSTS if it's causing issues)
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    # add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    
    # Logging
    access_log /var/log/nginx/dlt.aurigraph.io.access.log;
    error_log /var/log/nginx/dlt.aurigraph.io.error.log debug;
    
    # Document root for static files
    root /var/www/aurigraph;
    index index.html;
    
    # Global CORS configuration
    set $cors_methods 'GET, POST, PUT, DELETE, OPTIONS, HEAD, PATCH';
    set $cors_headers 'DNT,User-Agent,X-Requested-With,If-Modified-Since,Cache-Control,Content-Type,Range,Authorization,Accept,Origin';
    
    # Root location - serve dashboard
    location / {
        # Handle preflight
        if ($request_method = 'OPTIONS') {
            add_header 'Access-Control-Allow-Origin' $cors_origin always;
            add_header 'Access-Control-Allow-Methods' $cors_methods always;
            add_header 'Access-Control-Allow-Headers' $cors_headers always;
            add_header 'Access-Control-Allow-Credentials' 'true' always;
            add_header 'Access-Control-Max-Age' 86400 always;
            add_header 'Content-Type' 'text/plain charset=UTF-8' always;
            add_header 'Content-Length' 0 always;
            return 204;
        }
        
        # Add CORS headers to responses
        add_header 'Access-Control-Allow-Origin' $cors_origin always;
        add_header 'Access-Control-Allow-Methods' $cors_methods always;
        add_header 'Access-Control-Allow-Headers' $cors_headers always;
        add_header 'Access-Control-Allow-Credentials' 'true' always;
        
        try_files $uri $uri/ @api;
    }
    
    # API proxy location
    location @api {
        proxy_pass http://aurigraph_api;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_buffering off;
        
        # Ensure CORS headers
        add_header 'Access-Control-Allow-Origin' $cors_origin always;
        add_header 'Access-Control-Allow-Methods' $cors_methods always;
        add_header 'Access-Control-Allow-Headers' $cors_headers always;
        add_header 'Access-Control-Allow-Credentials' 'true' always;
    }
    
    # API endpoints with CORS
    location ~ ^/(channel|api|health) {
        # Handle preflight
        if ($request_method = 'OPTIONS') {
            add_header 'Access-Control-Allow-Origin' $cors_origin always;
            add_header 'Access-Control-Allow-Methods' $cors_methods always;
            add_header 'Access-Control-Allow-Headers' $cors_headers always;
            add_header 'Access-Control-Allow-Credentials' 'true' always;
            add_header 'Access-Control-Max-Age' 86400 always;
            return 204;
        }
        
        proxy_pass http://aurigraph_api;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header Origin $http_origin;
        proxy_buffering off;
        
        # Add CORS headers
        add_header 'Access-Control-Allow-Origin' $cors_origin always;
        add_header 'Access-Control-Allow-Methods' $cors_methods always;
        add_header 'Access-Control-Allow-Headers' $cors_headers always;
        add_header 'Access-Control-Allow-Credentials' 'true' always;
    }
    
    # WebSocket endpoint with CORS support
    location /ws {
        # Handle preflight
        if ($request_method = 'OPTIONS') {
            add_header 'Access-Control-Allow-Origin' $cors_origin always;
            add_header 'Access-Control-Allow-Methods' $cors_methods always;
            add_header 'Access-Control-Allow-Headers' $cors_headers always;
            add_header 'Access-Control-Allow-Credentials' 'true' always;
            add_header 'Access-Control-Max-Age' 86400 always;
            return 204;
        }
        
        proxy_pass http://aurigraph_ws;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header Origin $http_origin;
        proxy_read_timeout 3600s;
        proxy_send_timeout 3600s;
        
        # Add CORS headers
        add_header 'Access-Control-Allow-Origin' $cors_origin always;
        add_header 'Access-Control-Allow-Credentials' 'true' always;
    }
    
    # Vizro Dashboard
    location /vizro/ {
        # Handle preflight
        if ($request_method = 'OPTIONS') {
            add_header 'Access-Control-Allow-Origin' $cors_origin always;
            add_header 'Access-Control-Allow-Methods' $cors_methods always;
            add_header 'Access-Control-Allow-Headers' $cors_headers always;
            add_header 'Access-Control-Allow-Credentials' 'true' always;
            add_header 'Access-Control-Max-Age' 86400 always;
            return 204;
        }
        
        proxy_pass http://vizro_dashboard/;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_buffering off;
        
        # Add CORS headers
        add_header 'Access-Control-Allow-Origin' $cors_origin always;
        add_header 'Access-Control-Allow-Methods' $cors_methods always;
        add_header 'Access-Control-Allow-Headers' $cors_headers always;
        add_header 'Access-Control-Allow-Credentials' 'true' always;
    }
    
    # Dashboard assets
    location /_dash {
        proxy_pass http://vizro_dashboard;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # Add CORS headers
        add_header 'Access-Control-Allow-Origin' $cors_origin always;
        add_header 'Access-Control-Allow-Credentials' 'true' always;
    }
    
    # Block hidden files
    location ~ /\. {
        deny all;
        access_log off;
        log_not_found off;
    }
}
EOF
    
    print_status "Fixed NGINX configuration created: nginx-cors-fixed.conf"
}

# Function to create test HTML page
create_test_page() {
    print_info "Creating CORS test page..."
    
    cat > cors-test-page.html << 'EOF'
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Aurigraph DLT - CORS Test Page</title>
    <style>
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 20px;
            min-height: 100vh;
        }
        .container {
            max-width: 1200px;
            margin: 0 auto;
            background: rgba(255,255,255,0.1);
            border-radius: 20px;
            padding: 30px;
            backdrop-filter: blur(10px);
        }
        h1 {
            text-align: center;
            margin-bottom: 30px;
        }
        .test-section {
            background: rgba(255,255,255,0.1);
            border-radius: 10px;
            padding: 20px;
            margin-bottom: 20px;
        }
        .test-result {
            padding: 10px;
            margin: 10px 0;
            border-radius: 5px;
            font-family: monospace;
        }
        .success {
            background: rgba(76, 175, 80, 0.3);
            border: 1px solid #4CAF50;
        }
        .error {
            background: rgba(244, 67, 54, 0.3);
            border: 1px solid #f44336;
        }
        .warning {
            background: rgba(255, 152, 0, 0.3);
            border: 1px solid #FF9800;
        }
        button {
            background: linear-gradient(45deg, #667eea, #764ba2);
            color: white;
            border: none;
            padding: 12px 24px;
            border-radius: 25px;
            cursor: pointer;
            font-size: 16px;
            margin: 5px;
            transition: transform 0.3s;
        }
        button:hover {
            transform: translateY(-2px);
        }
        .spinner {
            border: 3px solid rgba(255,255,255,0.3);
            border-radius: 50%;
            border-top: 3px solid white;
            width: 20px;
            height: 20px;
            animation: spin 1s linear infinite;
            display: inline-block;
            margin-left: 10px;
        }
        @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>🔧 Aurigraph DLT - CORS Test Suite</h1>
        
        <div class="test-section">
            <h2>Configuration</h2>
            <label>API URL: <input type="text" id="apiUrl" value="https://dlt.aurigraph.io" style="width: 300px; padding: 5px;"></label>
        </div>
        
        <div class="test-section">
            <h2>API Tests</h2>
            <button onclick="testEndpoint('/health', 'GET')">Test Health (GET)</button>
            <button onclick="testEndpoint('/channel/status', 'GET')">Test Status (GET)</button>
            <button onclick="testEndpoint('/channel/metrics', 'GET')">Test Metrics (GET)</button>
            <button onclick="testEndpoint('/channel/transaction', 'POST')">Test Transaction (POST)</button>
            <button onclick="testEndpoint('/channel/nodes', 'GET')">Test Nodes (GET)</button>
            <button onclick="testWebSocket()">Test WebSocket</button>
            <button onclick="runAllTests()">Run All Tests</button>
        </div>
        
        <div class="test-section">
            <h2>Test Results</h2>
            <div id="results"></div>
        </div>
    </div>

    <script>
        let testCount = 0;
        let passCount = 0;
        let failCount = 0;

        function addResult(message, type = 'info') {
            const resultsDiv = document.getElementById('results');
            const resultDiv = document.createElement('div');
            resultDiv.className = `test-result ${type}`;
            resultDiv.innerHTML = `[${new Date().toLocaleTimeString()}] ${message}`;
            resultsDiv.insertBefore(resultDiv, resultsDiv.firstChild);
            
            if (type === 'success') passCount++;
            if (type === 'error') failCount++;
            testCount++;
            
            updateSummary();
        }

        function updateSummary() {
            const summary = `Tests: ${testCount} | ✅ Pass: ${passCount} | ❌ Fail: ${failCount}`;
            document.title = summary;
        }

        async function testEndpoint(endpoint, method = 'GET') {
            const apiUrl = document.getElementById('apiUrl').value;
            const url = apiUrl + endpoint;
            
            addResult(`Testing ${method} ${url}...`, 'warning');
            
            try {
                // Test preflight for non-GET requests
                if (method !== 'GET') {
                    const preflightResponse = await fetch(url, {
                        method: 'OPTIONS',
                        headers: {
                            'Access-Control-Request-Method': method,
                            'Access-Control-Request-Headers': 'Content-Type',
                            'Origin': window.location.origin
                        }
                    });
                    
                    if (preflightResponse.ok) {
                        addResult(`✅ Preflight successful for ${endpoint}`, 'success');
                    } else {
                        addResult(`❌ Preflight failed for ${endpoint}: ${preflightResponse.status}`, 'error');
                    }
                }
                
                // Test actual request
                const options = {
                    method: method,
                    headers: {
                        'Content-Type': 'application/json',
                        'Accept': 'application/json'
                    },
                    mode: 'cors',
                    credentials: 'include'
                };
                
                if (method === 'POST') {
                    options.body = JSON.stringify({ test: true, amount: 100 });
                }
                
                const response = await fetch(url, options);
                
                // Check CORS headers
                const corsHeaders = {
                    'Access-Control-Allow-Origin': response.headers.get('Access-Control-Allow-Origin'),
                    'Access-Control-Allow-Methods': response.headers.get('Access-Control-Allow-Methods'),
                    'Access-Control-Allow-Headers': response.headers.get('Access-Control-Allow-Headers')
                };
                
                if (response.ok) {
                    const data = await response.json();
                    addResult(`✅ ${method} ${endpoint}: Success (Status: ${response.status})`, 'success');
                    
                    // Log CORS headers
                    Object.entries(corsHeaders).forEach(([header, value]) => {
                        if (value) {
                            addResult(`  CORS: ${header}: ${value}`, 'success');
                        }
                    });
                } else {
                    addResult(`❌ ${method} ${endpoint}: Failed (Status: ${response.status})`, 'error');
                }
                
            } catch (error) {
                addResult(`❌ ${method} ${endpoint}: ${error.message}`, 'error');
                
                // Check if it's a CORS error
                if (error.message.includes('CORS') || error.message.includes('Failed to fetch')) {
                    addResult('  This appears to be a CORS error. Check server configuration.', 'error');
                }
            }
        }

        async function testWebSocket() {
            const apiUrl = document.getElementById('apiUrl').value;
            const wsUrl = apiUrl.replace('https://', 'wss://').replace('http://', 'ws://') + '/ws';
            
            addResult(`Testing WebSocket connection to ${wsUrl}...`, 'warning');
            
            try {
                const ws = new WebSocket(wsUrl);
                
                ws.onopen = () => {
                    addResult('✅ WebSocket connection established', 'success');
                    ws.send(JSON.stringify({ type: 'ping' }));
                };
                
                ws.onmessage = (event) => {
                    addResult(`✅ WebSocket message received: ${event.data}`, 'success');
                };
                
                ws.onerror = (error) => {
                    addResult(`❌ WebSocket error: ${error}`, 'error');
                };
                
                ws.onclose = () => {
                    addResult('WebSocket connection closed', 'warning');
                };
                
                // Close after 5 seconds
                setTimeout(() => {
                    if (ws.readyState === WebSocket.OPEN) {
                        ws.close();
                    }
                }, 5000);
                
            } catch (error) {
                addResult(`❌ WebSocket connection failed: ${error.message}`, 'error');
            }
        }

        async function runAllTests() {
            testCount = 0;
            passCount = 0;
            failCount = 0;
            
            addResult('🚀 Starting comprehensive CORS test suite...', 'warning');
            
            // Test all endpoints
            await testEndpoint('/health', 'GET');
            await new Promise(r => setTimeout(r, 500));
            
            await testEndpoint('/channel/status', 'GET');
            await new Promise(r => setTimeout(r, 500));
            
            await testEndpoint('/channel/metrics', 'GET');
            await new Promise(r => setTimeout(r, 500));
            
            await testEndpoint('/channel/nodes', 'GET');
            await new Promise(r => setTimeout(r, 500));
            
            await testEndpoint('/channel/transaction', 'POST');
            await new Promise(r => setTimeout(r, 500));
            
            await testWebSocket();
            
            addResult(`📊 Test Suite Complete: ${passCount}/${testCount} passed`, passCount === testCount ? 'success' : 'warning');
        }

        // Auto-run tests on load
        window.addEventListener('load', () => {
            setTimeout(runAllTests, 1000);
        });
    </script>
</body>
</html>
EOF
    
    print_status "Test page created: cors-test-page.html"
}

# Function to create deployment script
create_deployment_script() {
    print_info "Creating deployment script..."
    
    cat > deploy-cors-nginx-fix.sh << 'EOF'
#!/bin/bash

# Deploy CORS and NGINX fixes to dlt.aurigraph.io

echo "🚀 Deploying CORS & NGINX fixes to dlt.aurigraph.io"
echo "===================================================="

# Check if running as root
if [[ $EUID -ne 0 ]]; then
   echo "This script must be run as root (use sudo)"
   exit 1
fi

# Backup current configuration
echo "📋 Creating backups..."
cp /etc/nginx/sites-available/dlt.aurigraph.io /etc/nginx/sites-available/dlt.aurigraph.io.backup.$(date +%s) 2>/dev/null || true

# Copy new configuration
echo "📦 Installing new NGINX configuration..."
cp nginx-cors-fixed.conf /etc/nginx/sites-available/dlt.aurigraph.io

# Test NGINX configuration
echo "🧪 Testing NGINX configuration..."
nginx -t

if [ $? -eq 0 ]; then
    echo "✅ NGINX configuration valid"
    
    # Reload NGINX
    echo "🔄 Reloading NGINX..."
    systemctl reload nginx
    
    # Copy test page
    echo "📄 Installing test page..."
    mkdir -p /var/www/aurigraph
    cp cors-test-page.html /var/www/aurigraph/cors-test.html
    chown -R www-data:www-data /var/www/aurigraph
    
    echo ""
    echo "✅ Deployment complete!"
    echo ""
    echo "Test URLs:"
    echo "  • Test Page: https://dlt.aurigraph.io/cors-test.html"
    echo "  • Health: https://dlt.aurigraph.io/health"
    echo "  • Status: https://dlt.aurigraph.io/channel/status"
    echo ""
else
    echo "❌ NGINX configuration error"
    echo "Restoring backup..."
    cp /etc/nginx/sites-available/dlt.aurigraph.io.backup.* /etc/nginx/sites-available/dlt.aurigraph.io
    exit 1
fi

# Test endpoints
echo "🧪 Testing endpoints..."
curl -s -o /dev/null -w "Health endpoint: %{http_code}\n" https://dlt.aurigraph.io/health
curl -s -o /dev/null -w "Status endpoint: %{http_code}\n" https://dlt.aurigraph.io/channel/status

# Check CORS headers
echo ""
echo "🔍 Checking CORS headers..."
curl -s -I -H "Origin: https://dlt.aurigraph.io" https://dlt.aurigraph.io/health | grep -i "access-control"

echo ""
echo "✅ CORS & NGINX configuration deployed successfully!"
EOF
    
    chmod +x deploy-cors-nginx-fix.sh
    print_status "Deployment script created: deploy-cors-nginx-fix.sh"
}

# Main testing flow
echo ""
print_info "Starting comprehensive CORS & NGINX testing..."
echo ""

# Test 1: Check if services are running locally
print_info "Testing local services..."

# Check if Node.js app is running
if lsof -i :$LOCAL_API_PORT &> /dev/null; then
    print_status "API service running on port $LOCAL_API_PORT"
else
    print_warning "API service not running on port $LOCAL_API_PORT"
fi

# Check if WebSocket is running
if lsof -i :$LOCAL_WS_PORT &> /dev/null; then
    print_status "WebSocket service running on port $LOCAL_WS_PORT"
else
    print_warning "WebSocket service not running on port $LOCAL_WS_PORT"
fi

# Test 2: Test CORS on different endpoints
echo ""
print_info "Testing CORS on API endpoints..."

# Test health endpoint
test_cors "https://$DOMAIN/health" "GET"
test_cors "https://$DOMAIN/health" "OPTIONS"

# Test channel endpoints
test_cors "https://$DOMAIN/channel/status" "GET"
test_cors "https://$DOMAIN/channel/metrics" "GET"
test_cors "https://$DOMAIN/channel/nodes" "GET"
test_cors "https://$DOMAIN/channel/transaction" "POST"

# Test with different origins
echo ""
print_info "Testing CORS with different origins..."
test_cors "https://$DOMAIN/health" "GET" "http://localhost:3000"
test_cors "https://$DOMAIN/health" "GET" "https://app.aurigraph.io"

# Test WebSocket CORS
echo ""
test_websocket_cors "wss://$DOMAIN/ws" "https://$DOMAIN"

# Test 3: Create fixed configuration files
echo ""
create_fixed_nginx_config
create_test_page
create_deployment_script

# Test 4: Summary and recommendations
echo ""
echo "======================================"
print_info "Test Summary"
echo "======================================"

# Count successes and failures
success_count=$(grep -c "SUCCESS" $RESULTS_FILE 2>/dev/null || echo "0")
failure_count=$(grep -c "FAILED" $RESULTS_FILE 2>/dev/null || echo "0")

echo "✅ Successful tests: $success_count"
echo "❌ Failed tests: $failure_count"
echo ""

# Provide recommendations
if [ "$failure_count" -gt 0 ]; then
    print_warning "CORS issues detected. Recommendations:"
    echo ""
    echo "1. Deploy the fixed NGINX configuration:"
    echo "   scp nginx-cors-fixed.conf deploy-cors-nginx-fix.sh cors-test-page.html ubuntu@$DOMAIN:~/"
    echo "   ssh ubuntu@$DOMAIN"
    echo "   sudo ./deploy-cors-nginx-fix.sh"
    echo ""
    echo "2. Ensure the Node.js application has CORS middleware:"
    echo "   - Check that express CORS middleware is configured"
    echo "   - Verify allowed origins include https://$DOMAIN"
    echo ""
    echo "3. Test using the provided test page:"
    echo "   - Open https://$DOMAIN/cors-test.html after deployment"
    echo "   - Run the automated test suite"
    echo ""
else
    print_status "All CORS tests passed successfully!"
fi

echo ""
print_info "Detailed results saved to: $RESULTS_FILE"
echo ""
print_status "Testing complete!"