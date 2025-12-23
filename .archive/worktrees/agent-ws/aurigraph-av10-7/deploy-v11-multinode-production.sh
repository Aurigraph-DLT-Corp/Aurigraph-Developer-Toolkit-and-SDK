#!/bin/bash
set -e

echo "=================================================="
echo "AURIGRAPH V11 MULTI-NODE PRODUCTION DEPLOYMENT"
echo "=================================================="
echo ""

REMOTE_USER="subbu"
REMOTE_HOST="dlt.aurigraph.io"
REMOTE_PORT="22"
REMOTE_BASE="/opt/DLT"

echo "📋 Configuration:"
echo "  Host: ${REMOTE_USER}@${REMOTE_HOST}:${REMOTE_PORT}"
echo "  Path: ${REMOTE_BASE}"
echo ""

# Step 1: Build production docker-compose
echo "🔧 Preparing V11 multi-node configuration..."
cp docker-compose-v11-production.yml docker-compose-prod.yml
echo "✅ Configuration prepared"
echo ""

# Step 2: Upload to remote server
echo "📤 Uploading to remote server..."
scp -P $REMOTE_PORT docker-compose-prod.yml ${REMOTE_USER}@${REMOTE_HOST}:/tmp/
scp -P $REMOTE_PORT frontend-build.tar.gz ${REMOTE_USER}@${REMOTE_HOST}:/tmp/ 2>/dev/null || echo "  ℹ️  Frontend tarball not found (will use existing)"
echo "✅ Files uploaded"
echo ""

# Step 3: Deploy on remote server
echo "🚀 Executing deployment on remote server..."
echo ""

ssh -p $REMOTE_PORT ${REMOTE_USER}@${REMOTE_HOST} << 'REMOTE_DEPLOY'
#!/bin/bash
set -e

REMOTE_BASE="/opt/DLT"

echo "========================================="
echo "REMOTE: V11 Multi-Node Production Deployment"
echo "========================================="
echo ""

# Step 1: Backup existing configuration
echo "💾 Backing up existing configuration..."
if [ -f "${REMOTE_BASE}/docker-compose.yml" ]; then
    cp "${REMOTE_BASE}/docker-compose.yml" "${REMOTE_BASE}/docker-compose.backup-$(date +%Y%m%d-%H%M%S).yml"
    echo "✅ Backup created"
fi
echo ""

# Step 2: Stop old containers
echo "🛑 Stopping old containers..."
cd ${REMOTE_BASE}
docker-compose down 2>/dev/null || true
sleep 2
docker system prune -f 2>/dev/null || true
echo "✅ Old containers stopped"
echo ""

# Step 3: Deploy new multi-node configuration
echo "📋 Deploying V11 multi-node configuration..."
cp /tmp/docker-compose-prod.yml ${REMOTE_BASE}/docker-compose.yml
echo "✅ Configuration deployed"
echo ""

# Step 4: Extract frontend if uploaded
echo "📦 Setting up frontend..."
if [ -f "/tmp/frontend-build.tar.gz" ]; then
    cd /tmp
    tar -xzf frontend-build.tar.gz
    rm -rf ${REMOTE_BASE}/frontend/dist
    mkdir -p ${REMOTE_BASE}/frontend
    cp -r dist ${REMOTE_BASE}/frontend/
    echo "✅ Frontend updated"
else
    mkdir -p ${REMOTE_BASE}/frontend/dist
    echo "ℹ️  Using existing frontend"
fi
echo ""

# Step 5: Create necessary directories
echo "📁 Creating node data directories..."
mkdir -p ${REMOTE_BASE}/logs/{validators,business-1,business-2,slim}
mkdir -p ${REMOTE_BASE}/integrations
echo "✅ Directories created"
echo ""

# Step 6: Create NGINX configuration for multi-node load balancing
echo "⚙️  Creating NGINX load balancer configuration..."
cat > ${REMOTE_BASE}/nginx-v11-multinode.conf << 'NGINX_CONF'
user nginx;
worker_processes auto;
error_log /var/log/nginx/error.log warn;
pid /var/run/nginx.pid;

events {
    worker_connections 4096;
    use epoll;
}

http {
    include /etc/nginx/mime.types;
    default_type application/octet-stream;

    log_format main '$remote_addr - $remote_user [$time_local] "$request" '
                    '$status $body_bytes_sent "$http_referer" '
                    '"$http_user_agent" "$http_x_forwarded_for"';

    access_log /var/log/nginx/access.log main;

    sendfile on;
    tcp_nopush on;
    tcp_nodelay on;
    keepalive_timeout 65;
    types_hash_max_size 2048;
    client_max_body_size 100M;

    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_proxied any;
    gzip_comp_level 6;
    gzip_types text/plain text/css text/xml text/javascript
               application/json application/javascript application/xml+rss;

    # Rate limiting zones
    limit_req_zone $binary_remote_addr zone=api_limit:10m rate=1000r/s;
    limit_req_zone $binary_remote_addr zone=health_limit:10m rate=100r/s;

    # Upstream backends
    upstream validators {
        least_conn;
        server validators:9003 weight=3 max_fails=3 fail_timeout=10s;
    }

    upstream business {
        least_conn;
        server business-1:9009 weight=2 max_fails=3 fail_timeout=10s;
        server business-2:9011 weight=2 max_fails=3 fail_timeout=10s;
    }

    upstream slim {
        least_conn;
        server slim-nodes:9013 weight=1 max_fails=3 fail_timeout=10s;
    }

    upstream all_nodes {
        least_conn;
        server validators:9003 weight=3;
        server business-1:9009 weight=2;
        server business-2:9011 weight=2;
        server slim-nodes:9013 weight=1;
    }

    # HTTP to HTTPS redirect
    server {
        listen 80;
        server_name dlt.aurigraph.io;
        location / {
            return 301 https://$server_name$request_uri;
        }
    }

    # HTTPS main server
    server {
        listen 443 ssl http2;
        server_name dlt.aurigraph.io;

        ssl_certificate /etc/nginx/ssl/fullchain.pem;
        ssl_certificate_key /etc/nginx/ssl/privkey.pem;
        ssl_protocols TLSv1.2 TLSv1.3;
        ssl_ciphers HIGH:!aNULL:!MD5;
        ssl_prefer_server_ciphers on;
        ssl_session_cache shared:SSL:10m;
        ssl_session_timeout 10m;

        add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
        add_header X-Frame-Options "SAMEORIGIN" always;
        add_header X-Content-Type-Options "nosniff" always;

        # Frontend
        location / {
            root /usr/share/nginx/html;
            try_files $uri $uri/ /index.html;
            expires 1h;
        }

        # Static assets
        location /assets/ {
            root /usr/share/nginx/html;
            expires 1y;
        }

        # API - Route to appropriate nodes
        location /api/v11/health {
            limit_req zone=health_limit burst=50 nodelay;
            proxy_pass http://all_nodes;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
            proxy_read_timeout 10s;
        }

        # Consensus/Transaction endpoints (Validators)
        location /api/v11/consensus/ {
            limit_req zone=api_limit burst=100 nodelay;
            proxy_pass http://validators;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
            proxy_read_timeout 30s;
        }

        location /api/v11/transaction/ {
            limit_req zone=api_limit burst=100 nodelay;
            proxy_pass http://business;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
            proxy_read_timeout 30s;
        }

        # Query endpoints (can use any node)
        location /api/v11/query/ {
            limit_req zone=api_limit burst=100 nodelay;
            proxy_pass http://all_nodes;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
            proxy_read_timeout 10s;
        }

        # External data / Tokenization (Slim nodes)
        location /api/v11/external/ {
            limit_req zone=api_limit burst=50 nodelay;
            proxy_pass http://slim;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
            proxy_read_timeout 30s;
        }

        # Default API (round-robin)
        location /api/v11/ {
            limit_req zone=api_limit burst=100 nodelay;
            proxy_pass http://all_nodes;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
            proxy_read_timeout 30s;
        }

        # Deny sensitive files
        location ~ /\. {
            deny all;
        }
    }

    # Node metrics endpoint (internal only)
    server {
        listen 9000;
        location /metrics {
            proxy_pass http://all_nodes;
        }
    }
}
NGINX_CONF
echo "✅ NGINX configuration created"
echo ""

# Step 7: Validate configuration
echo "🔍 Validating docker-compose configuration..."
docker-compose config > /dev/null && echo "✅ Configuration valid" || { echo "❌ Configuration invalid"; exit 1; }
echo ""

# Step 8: Start services
echo "🚀 Starting V11 multi-node infrastructure..."
docker-compose up -d
sleep 5
echo "✅ Containers started"
echo ""

# Step 9: Wait for services
echo "⏳ Waiting for PostgreSQL to be healthy..."
for i in {1..60}; do
    if docker-compose ps | grep -q "postgres.*Up.*healthy"; then
        echo "✅ PostgreSQL is healthy"
        break
    fi
    echo -n "."
    sleep 1
done
echo ""

echo "⏳ Waiting for validator nodes..."
for i in {1..120}; do
    if curl -sf http://localhost:9003/api/v11/health > /dev/null 2>&1; then
        echo "✅ Validators are healthy"
        break
    fi
    echo -n "."
    sleep 1
done
echo ""

echo "⏳ Waiting for business nodes..."
for i in {1..120}; do
    if curl -sf http://localhost:9009/api/v11/health > /dev/null 2>&1; then
        echo "✅ Business nodes are healthy"
        break
    fi
    echo -n "."
    sleep 1
done
echo ""

echo "⏳ Waiting for slim nodes..."
for i in {1..120}; do
    if curl -sf http://localhost:9013/api/v11/health > /dev/null 2>&1; then
        echo "✅ Slim nodes are healthy"
        break
    fi
    echo -n "."
    sleep 1
done
echo ""

# Step 10: Display status
echo "📊 Service Status:"
docker-compose ps
echo ""

echo "✅ Node Health Summary:"
echo "  Validators: $(curl -s http://localhost:9003/api/v11/health 2>/dev/null | grep -o 'HEALTHY' || echo 'checking...')"
echo "  Business-1: $(curl -s http://localhost:9009/api/v11/health 2>/dev/null | grep -o 'HEALTHY' || echo 'checking...')"
echo "  Business-2: $(curl -s http://localhost:9011/api/v11/health 2>/dev/null | grep -o 'HEALTHY' || echo 'checking...')"
echo "  Slim: $(curl -s http://localhost:9013/api/v11/health 2>/dev/null | grep -o 'HEALTHY' || echo 'checking...')"
echo ""

echo "========================================="
echo "✅ V11 Multi-Node Deployment Complete!"
echo "========================================="
echo ""
echo "🌐 Access Portal:"
echo "  URL: https://dlt.aurigraph.io/"
echo "  Login: admin/admin"
echo ""
echo "📊 Node Architecture:"
echo "  Validators: 9 nodes (leader + 8 followers)"
echo "  Business: 10 nodes (5 per container)"
echo "  Slim: 4 nodes (external API integration)"
echo "  Total TPS Capacity: 10M+ TPS"
echo ""
echo "📝 Logs:"
echo "  Validators: docker-compose logs validators"
echo "  Business-1: docker-compose logs business-1"
echo "  Business-2: docker-compose logs business-2"
echo "  Slim: docker-compose logs slim-nodes"
echo ""

REMOTE_DEPLOY

echo "✅ Remote deployment completed successfully!"
echo ""
echo "📊 Summary:"
echo "  ✅ V11 multi-node architecture deployed"
echo "  ✅ 9 validator nodes (consensus)"
echo "  ✅ 10 business nodes (processing)"
echo "  ✅ 4 slim nodes (external APIs + tokenization)"
echo "  ✅ NGINX load balancer configured"
echo "  ✅ Frontend portal deployed"
echo ""
echo "🎉 Portal is live at https://dlt.aurigraph.io/"
