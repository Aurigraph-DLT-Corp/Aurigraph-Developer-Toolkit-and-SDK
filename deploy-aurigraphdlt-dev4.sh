#!/bin/bash

# ═══════════════════════════════════════════════════════════════════════════════
# Aurigraph DLT V10/V11 Deployment Script for aurigraphdlt.dev4.aurex.in
# ═══════════════════════════════════════════════════════════════════════════════
# This script deploys both V10 (TypeScript) and V11 (Java/Quarkus) components
# Target: aurigraphdlt.dev4.aurex.in server
# Performance Target: 1M+ TPS (V10), 2M+ TPS (V11)
# ═══════════════════════════════════════════════════════════════════════════════

set -e

# Configuration
DOMAIN="aurigraphdlt.dev4.aurex.in"
SERVER_IP="dev4.aurex.in"  # Will be resolved
EMAIL="admin@aurigraph.io"
DEPLOYMENT_DIR="/opt/aurigraph-dlt"
LOG_DIR="/var/log/aurigraph"

# V10 Ports (from .env.dev4)
V10_API_PORT=4004
V10_GRPC_PORT=50054
V10_NETWORK_PORT=30304
V10_METRICS_PORT=9094
V10_MONITORING_WS_PORT=4444

# V11 Ports
V11_HTTP_PORT=9003
V11_GRPC_PORT=9004

# Docker Network
DOCKER_NETWORK="aurigraph-dev4-network"
DOCKER_SUBNET="172.20.0.0/16"

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

# Helper functions
print_header() {
    echo ""
    echo "═══════════════════════════════════════════════════════════════════════════════"
    echo "$1"
    echo "═══════════════════════════════════════════════════════════════════════════════"
}

print_status() { echo -e "${GREEN}✅${NC} $1"; }
print_error() { echo -e "${RED}❌${NC} $1"; }
print_warning() { echo -e "${YELLOW}⚠️${NC} $1"; }
print_info() { echo -e "${BLUE}ℹ️${NC} $1"; }
print_step() { echo -e "${CYAN}▶${NC} $1"; }

# Check if running as root
check_root() {
    if [[ $EUID -ne 0 ]]; then
        print_error "This script must be run as root"
        echo "Please run: sudo $0"
        exit 1
    fi
}

# Detect deployment mode
detect_mode() {
    if [[ -f /.dockerenv ]]; then
        echo "container"
    elif [[ $(hostname -f) == *"dev4.aurex.in"* ]]; then
        echo "server"
    else
        echo "local"
    fi
}

# Pre-deployment checks
pre_deployment_checks() {
    print_header "🔍 Pre-Deployment Checks"
    
    # Check Node.js version
    print_step "Checking Node.js version..."
    if command -v node &> /dev/null; then
        NODE_VERSION=$(node -v | cut -d'v' -f2)
        print_status "Node.js $NODE_VERSION installed"
    else
        print_error "Node.js not found. Installing..."
        curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
        apt-get install -y nodejs
    fi
    
    # Check Java version
    print_step "Checking Java version..."
    if command -v java &> /dev/null; then
        JAVA_VERSION=$(java -version 2>&1 | head -n 1 | cut -d'"' -f2)
        print_status "Java $JAVA_VERSION installed"
    else
        print_error "Java 21 not found. Installing..."
        apt-get update && apt-get install -y openjdk-21-jdk
    fi
    
    # Check Docker
    print_step "Checking Docker..."
    if command -v docker &> /dev/null; then
        DOCKER_VERSION=$(docker --version | cut -d' ' -f3 | cut -d',' -f1)
        print_status "Docker $DOCKER_VERSION installed"
    else
        print_error "Docker not found. Please install Docker first."
        exit 1
    fi
    
    # Check Docker Compose
    print_step "Checking Docker Compose..."
    if command -v docker-compose &> /dev/null; then
        DC_VERSION=$(docker-compose --version | cut -d' ' -f3 | cut -d',' -f1)
        print_status "Docker Compose $DC_VERSION installed"
    else
        print_warning "Installing Docker Compose..."
        apt-get install -y docker-compose
    fi
    
    # Check nginx
    print_step "Checking nginx..."
    if command -v nginx &> /dev/null; then
        print_status "nginx installed"
    else
        print_warning "Installing nginx..."
        apt-get install -y nginx
    fi
    
    # Check Certbot
    print_step "Checking Certbot..."
    if command -v certbot &> /dev/null; then
        print_status "Certbot installed"
    else
        print_warning "Installing Certbot..."
        apt-get install -y certbot python3-certbot-nginx
    fi
}

# Setup directory structure
setup_directories() {
    print_header "📁 Setting Up Directory Structure"
    
    # Create deployment directories
    directories=(
        "$DEPLOYMENT_DIR"
        "$DEPLOYMENT_DIR/v10"
        "$DEPLOYMENT_DIR/v11"
        "$DEPLOYMENT_DIR/config"
        "$DEPLOYMENT_DIR/data"
        "$DEPLOYMENT_DIR/scripts"
        "$LOG_DIR"
        "$LOG_DIR/v10"
        "$LOG_DIR/v11"
        "$LOG_DIR/docker"
    )
    
    for dir in "${directories[@]}"; do
        if [[ ! -d "$dir" ]]; then
            mkdir -p "$dir"
            print_status "Created $dir"
        fi
    done
    
    # Set permissions
    chown -R $SUDO_USER:$SUDO_USER $DEPLOYMENT_DIR
    chmod -R 755 $DEPLOYMENT_DIR
}

# Copy project files
copy_project_files() {
    print_header "📋 Copying Project Files"
    
    SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
    PROJECT_ROOT="$SCRIPT_DIR"
    
    # Navigate to aurigraph-av10-7 for V10
    if [[ -d "$PROJECT_ROOT/aurigraph-av10-7" ]]; then
        print_step "Copying V10 TypeScript files..."
        cp -r "$PROJECT_ROOT/aurigraph-av10-7/"* "$DEPLOYMENT_DIR/v10/"
        print_status "V10 files copied"
    fi
    
    # Copy V11 Java/Quarkus files
    if [[ -d "$PROJECT_ROOT/aurigraph-av10-7/aurigraph-v11-standalone" ]]; then
        print_step "Copying V11 Java/Quarkus files..."
        cp -r "$PROJECT_ROOT/aurigraph-av10-7/aurigraph-v11-standalone/"* "$DEPLOYMENT_DIR/v11/"
        print_status "V11 files copied"
    fi
    
    # Copy environment configurations
    if [[ -f "$PROJECT_ROOT/aurigraph-av10-7/.env.dev4" ]]; then
        cp "$PROJECT_ROOT/aurigraph-av10-7/.env.dev4" "$DEPLOYMENT_DIR/v10/.env"
        print_status "Environment configuration copied"
    fi
}

# Build V10 TypeScript platform
build_v10() {
    print_header "🔨 Building V10 TypeScript Platform"
    
    cd "$DEPLOYMENT_DIR/v10"
    
    print_step "Installing dependencies..."
    npm ci --production
    
    print_step "Building TypeScript..."
    npm run build
    
    if [[ $? -eq 0 ]]; then
        print_status "V10 build successful"
    else
        print_error "V10 build failed"
        exit 1
    fi
}

# Build V11 Java/Quarkus platform
build_v11() {
    print_header "🔨 Building V11 Java/Quarkus Platform"
    
    cd "$DEPLOYMENT_DIR/v11"
    
    print_step "Building with Maven..."
    ./mvnw clean package -DskipTests
    
    print_step "Building native image..."
    ./mvnw package -Pnative-fast -Dquarkus.native.container-build=true
    
    if [[ $? -eq 0 ]]; then
        print_status "V11 build successful"
    else
        print_error "V11 build failed"
        exit 1
    fi
}

# Setup Docker network
setup_docker_network() {
    print_header "🌐 Setting Up Docker Network"
    
    # Remove existing network if exists
    docker network rm $DOCKER_NETWORK 2>/dev/null || true
    
    # Create new network
    docker network create \
        --driver bridge \
        --subnet=$DOCKER_SUBNET \
        --opt com.docker.network.bridge.name=br-aurigraph \
        $DOCKER_NETWORK
    
    print_status "Docker network $DOCKER_NETWORK created"
}

# Deploy with Docker Compose
deploy_docker_compose() {
    print_header "🐳 Deploying with Docker Compose"
    
    cd "$DEPLOYMENT_DIR/v10"
    
    # Stop existing containers
    print_step "Stopping existing containers..."
    docker-compose -f docker-compose.dev4.yml down 2>/dev/null || true
    
    # Start new deployment
    print_step "Starting Docker containers..."
    docker-compose -f docker-compose.dev4.yml up -d
    
    # Wait for containers to be healthy
    sleep 10
    
    # Check container status
    print_step "Checking container status..."
    docker-compose -f docker-compose.dev4.yml ps
    
    print_status "Docker containers deployed"
}

# Create systemd services
create_systemd_services() {
    print_header "⚙️ Creating Systemd Services"
    
    # V10 TypeScript Service
    cat > /etc/systemd/system/aurigraph-v10.service << EOF
[Unit]
Description=Aurigraph V10 TypeScript Platform
After=network.target docker.service
Requires=docker.service

[Service]
Type=simple
User=$SUDO_USER
WorkingDirectory=$DEPLOYMENT_DIR/v10
ExecStart=/usr/bin/npm run dev4
Restart=always
RestartSec=10
StandardOutput=append:$LOG_DIR/v10/service.log
StandardError=append:$LOG_DIR/v10/error.log
Environment="NODE_ENV=production"
Environment="PORT=$V10_API_PORT"

[Install]
WantedBy=multi-user.target
EOF
    
    # V11 Java/Quarkus Service
    cat > /etc/systemd/system/aurigraph-v11.service << EOF
[Unit]
Description=Aurigraph V11 Java/Quarkus Platform
After=network.target

[Service]
Type=simple
User=$SUDO_USER
WorkingDirectory=$DEPLOYMENT_DIR/v11
ExecStart=$DEPLOYMENT_DIR/v11/target/aurigraph-v11-standalone-11.0.0-runner
Restart=always
RestartSec=10
StandardOutput=append:$LOG_DIR/v11/service.log
StandardError=append:$LOG_DIR/v11/error.log
Environment="JAVA_OPTS=-Xmx4g -XX:+UseG1GC"

[Install]
WantedBy=multi-user.target
EOF
    
    # Docker Compose Service
    cat > /etc/systemd/system/aurigraph-docker.service << EOF
[Unit]
Description=Aurigraph Docker Compose Stack
After=docker.service
Requires=docker.service

[Service]
Type=simple
User=root
WorkingDirectory=$DEPLOYMENT_DIR/v10
ExecStart=/usr/bin/docker-compose -f docker-compose.dev4.yml up
ExecStop=/usr/bin/docker-compose -f docker-compose.dev4.yml down
Restart=always
RestartSec=10
StandardOutput=append:$LOG_DIR/docker/compose.log
StandardError=append:$LOG_DIR/docker/error.log

[Install]
WantedBy=multi-user.target
EOF
    
    systemctl daemon-reload
    print_status "Systemd services created"
}

# Configure SSL certificates
configure_ssl() {
    print_header "🔒 Configuring SSL Certificates"
    
    # Stop nginx temporarily
    systemctl stop nginx 2>/dev/null || true
    
    # Get SSL certificate
    print_step "Obtaining SSL certificate for $DOMAIN..."
    certbot certonly \
        --standalone \
        --non-interactive \
        --agree-tos \
        --email $EMAIL \
        --domains $DOMAIN \
        --keep-until-expiring
    
    if [[ $? -eq 0 ]]; then
        print_status "SSL certificate obtained"
    else
        print_warning "Failed to obtain SSL certificate, continuing with HTTP"
    fi
}

# Configure nginx reverse proxy
configure_nginx() {
    print_header "🔧 Configuring Nginx Reverse Proxy"
    
    # Create nginx configuration
    cat > /etc/nginx/sites-available/$DOMAIN << 'EOF'
# Upstream definitions
upstream aurigraph_v10 {
    server localhost:4004;
    keepalive 32;
}

upstream aurigraph_v11 {
    server localhost:9003;
    keepalive 32;
}

upstream aurigraph_grpc {
    server localhost:50054;
    keepalive 32;
}

# HTTP to HTTPS redirect
server {
    listen 80;
    listen [::]:80;
    server_name aurigraphdlt.dev4.aurex.in;
    
    location /.well-known/acme-challenge/ {
        root /var/www/certbot;
    }
    
    location / {
        return 301 https://$server_name$request_uri;
    }
}

# HTTPS configuration
server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name aurigraphdlt.dev4.aurex.in;
    
    # SSL Configuration
    ssl_certificate /etc/letsencrypt/live/aurigraphdlt.dev4.aurex.in/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/aurigraphdlt.dev4.aurex.in/privkey.pem;
    ssl_trusted_certificate /etc/letsencrypt/live/aurigraphdlt.dev4.aurex.in/chain.pem;
    
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers off;
    
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 10m;
    ssl_session_tickets off;
    
    ssl_stapling on;
    ssl_stapling_verify on;
    
    # Security headers
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    
    # Logging
    access_log /var/log/nginx/aurigraph-access.log;
    error_log /var/log/nginx/aurigraph-error.log;
    
    # Client body size
    client_max_body_size 100M;
    
    # Timeouts
    proxy_connect_timeout 600;
    proxy_send_timeout 600;
    proxy_read_timeout 600;
    send_timeout 600;
    
    # V10 API (default)
    location / {
        proxy_pass http://aurigraph_v10;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        
        # WebSocket support
        proxy_buffering off;
        proxy_request_buffering off;
    }
    
    # V11 API
    location /api/v11/ {
        proxy_pass http://aurigraph_v11/api/v11/;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
    
    # Quarkus health endpoints
    location /q/ {
        proxy_pass http://aurigraph_v11/q/;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
    
    # gRPC proxy
    location /grpc/ {
        grpc_pass grpc://aurigraph_grpc;
        grpc_set_header Host $host;
        grpc_set_header X-Real-IP $remote_addr;
    }
    
    # Health check endpoint
    location /health {
        access_log off;
        add_header Content-Type text/plain;
        return 200 'healthy';
    }
    
    # Metrics endpoint (Prometheus)
    location /metrics {
        proxy_pass http://localhost:9094/metrics;
        allow 127.0.0.1;
        deny all;
    }
}

# gRPC over HTTP/2
server {
    listen 50055 http2;
    listen [::]:50055 http2;
    server_name aurigraphdlt.dev4.aurex.in;
    
    location / {
        grpc_pass grpc://localhost:50054;
    }
}
EOF
    
    # Create symlink
    ln -sf /etc/nginx/sites-available/$DOMAIN /etc/nginx/sites-enabled/
    
    # Remove default site
    rm -f /etc/nginx/sites-enabled/default
    
    # Test nginx configuration
    nginx -t
    
    if [[ $? -eq 0 ]]; then
        print_status "Nginx configuration valid"
    else
        print_error "Nginx configuration error"
        exit 1
    fi
}

# Start services
start_services() {
    print_header "🚀 Starting Services"
    
    # Enable and start Docker service
    print_step "Starting Docker Compose stack..."
    systemctl enable aurigraph-docker
    systemctl start aurigraph-docker
    
    # Start V10 service
    print_step "Starting V10 TypeScript service..."
    systemctl enable aurigraph-v10
    systemctl start aurigraph-v10
    
    # Start V11 service
    print_step "Starting V11 Java/Quarkus service..."
    systemctl enable aurigraph-v11
    systemctl start aurigraph-v11
    
    # Start nginx
    print_step "Starting nginx..."
    systemctl enable nginx
    systemctl restart nginx
    
    print_status "All services started"
}

# Health checks
perform_health_checks() {
    print_header "🏥 Performing Health Checks"
    
    sleep 10  # Wait for services to stabilize
    
    # Check V10 health
    print_step "Checking V10 health..."
    if curl -s http://localhost:$V10_API_PORT/health > /dev/null 2>&1; then
        print_status "V10 is healthy"
    else
        print_warning "V10 health check failed"
    fi
    
    # Check V11 health
    print_step "Checking V11 health..."
    if curl -s http://localhost:$V11_HTTP_PORT/q/health > /dev/null 2>&1; then
        print_status "V11 is healthy"
    else
        print_warning "V11 health check failed"
    fi
    
    # Check Docker containers
    print_step "Checking Docker containers..."
    docker ps --format "table {{.Names}}\t{{.Status}}" | grep aurigraph
    
    # Check nginx
    print_step "Checking nginx..."
    if systemctl is-active --quiet nginx; then
        print_status "Nginx is running"
    else
        print_error "Nginx is not running"
    fi
    
    # Check domain accessibility
    print_step "Checking domain accessibility..."
    if curl -s https://$DOMAIN/health > /dev/null 2>&1; then
        print_status "Domain is accessible via HTTPS"
    elif curl -s http://$DOMAIN/health > /dev/null 2>&1; then
        print_warning "Domain is accessible via HTTP only"
    else
        print_error "Domain is not accessible"
    fi
}

# Performance validation
validate_performance() {
    print_header "⚡ Validating Performance"
    
    # Run V10 performance test
    print_step "Testing V10 performance..."
    cd "$DEPLOYMENT_DIR/v10"
    npm run test:performance 2>&1 | grep -E "TPS|throughput" || true
    
    # Run V11 performance test
    print_step "Testing V11 performance..."
    curl -X GET "http://localhost:$V11_HTTP_PORT/api/v11/performance?duration=10" 2>/dev/null | jq '.' || true
}

# Generate deployment report
generate_report() {
    print_header "📊 Generating Deployment Report"
    
    REPORT_FILE="$DEPLOYMENT_DIR/deployment-report-$(date +%Y%m%d-%H%M%S).txt"
    
    cat > $REPORT_FILE << EOF
═══════════════════════════════════════════════════════════════════════════════
AURIGRAPH DLT DEPLOYMENT REPORT
═══════════════════════════════════════════════════════════════════════════════
Deployment Date: $(date)
Domain: $DOMAIN
Server: $(hostname -f)
═══════════════════════════════════════════════════════════════════════════════

SERVICE STATUS:
───────────────────────────────────────────────────────────────────────────────
V10 TypeScript: $(systemctl is-active aurigraph-v10)
V11 Java/Quarkus: $(systemctl is-active aurigraph-v11)
Docker Compose: $(systemctl is-active aurigraph-docker)
Nginx: $(systemctl is-active nginx)

DOCKER CONTAINERS:
───────────────────────────────────────────────────────────────────────────────
$(docker ps --format "table {{.Names}}\t{{.Status}}" | grep aurigraph || echo "No containers running")

ENDPOINTS:
───────────────────────────────────────────────────────────────────────────────
V10 API: https://$DOMAIN/
V11 API: https://$DOMAIN/api/v11/
Health: https://$DOMAIN/health
Metrics: https://$DOMAIN/q/metrics
gRPC: $DOMAIN:50055

PORTS IN USE:
───────────────────────────────────────────────────────────────────────────────
$(netstat -tlnp | grep -E "4004|9003|50054|9004" || echo "Port check failed")

SYSTEM RESOURCES:
───────────────────────────────────────────────────────────────────────────────
$(df -h $DEPLOYMENT_DIR | tail -1)
$(free -h | grep Mem)
$(uptime)

LOGS LOCATION:
───────────────────────────────────────────────────────────────────────────────
V10 Logs: $LOG_DIR/v10/
V11 Logs: $LOG_DIR/v11/
Docker Logs: $LOG_DIR/docker/
Nginx Logs: /var/log/nginx/

═══════════════════════════════════════════════════════════════════════════════
EOF
    
    print_status "Deployment report saved to: $REPORT_FILE"
    cat $REPORT_FILE
}

# Cleanup function
cleanup() {
    print_warning "Cleaning up..."
    # Add cleanup tasks if needed
}

# Main deployment flow
main() {
    trap cleanup EXIT
    
    print_header "🚀 AURIGRAPH DLT DEPLOYMENT FOR $DOMAIN"
    print_info "Deployment mode: $(detect_mode)"
    
    # Check if running as root
    check_root
    
    # Execute deployment steps
    pre_deployment_checks
    setup_directories
    copy_project_files
    build_v10
    build_v11
    setup_docker_network
    deploy_docker_compose
    create_systemd_services
    configure_ssl
    configure_nginx
    start_services
    perform_health_checks
    validate_performance
    generate_report
    
    print_header "✅ DEPLOYMENT COMPLETED SUCCESSFULLY!"
    print_info "Access your deployment at: https://$DOMAIN"
    print_info "Monitor logs at: $LOG_DIR"
    print_info "Check status: systemctl status aurigraph-*"
}

# Run main function
main "$@"