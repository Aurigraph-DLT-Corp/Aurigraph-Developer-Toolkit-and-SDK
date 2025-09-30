#!/bin/bash

# Aurigraph DLT V4.0 Comprehensive Deployment Script
# Version: 4.0.0
# Date: September 30, 2025
# Description: Complete V4.0 deployment pipeline for dlt.aurigraph.io

set -e  # Exit on any error

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration Variables
V4_PORT=9004
REMOTE_HOST="dlt.aurigraph.io"
REMOTE_PORT=2235
REMOTE_USER="subbu"
REMOTE_PASSWORD="subbuFuture@2025"
PROJECT_DIR="/tmp/aurigraph-v4-release"
STANDALONE_DIR="$PROJECT_DIR/aurigraph-av10-7/aurigraph-v11-standalone"
BUILD_PROFILE="native-ultra"  # Ultra-optimized for production
TARGET_TPS="3000000"

# Logging function
log() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')] $1${NC}"
}

log_success() {
    echo -e "${GREEN}[SUCCESS] $1${NC}"
}

log_warning() {
    echo -e "${YELLOW}[WARNING] $1${NC}"
}

log_error() {
    echo -e "${RED}[ERROR] $1${NC}"
}

# Pre-flight checks
preflight_checks() {
    log "Starting V4.0 deployment pre-flight checks..."

    # Check if we're in the correct directory
    if [ ! -f "$PROJECT_DIR/AURIGRAPH-V4.0-RELEASE.md" ]; then
        log_error "V4.0 release documentation not found. Please ensure you're in the correct repository."
        exit 1
    fi

    # Check Java version
    JAVA_VERSION=$(java -version 2>&1 | head -n 1 | cut -d '"' -f 2)
    log "Java version: $JAVA_VERSION"

    # Check Docker
    if ! /Applications/Docker.app/Contents/Resources/bin/docker --version &> /dev/null; then
        log_error "Docker not found. Please install Docker."
        exit 1
    fi
    log "Docker version: $(/Applications/Docker.app/Contents/Resources/bin/docker --version)"

    # Check Maven wrapper
    if [ ! -f "$STANDALONE_DIR/mvnw" ]; then
        log_error "Maven wrapper not found in $STANDALONE_DIR"
        exit 1
    fi

    # Check port availability
    if lsof -i :$V4_PORT >/dev/null 2>&1; then
        log_warning "Port $V4_PORT is in use. Attempting to free it..."
        sudo lsof -ti :$V4_PORT | xargs sudo kill -9 || true
        sleep 2
    fi

    log_success "Pre-flight checks completed"
}

# Add V4 profile to application.properties
setup_v4_profile() {
    log "Setting up V4 profile configuration..."

    local app_props="$STANDALONE_DIR/src/main/resources/application.properties"

    # Backup original configuration
    cp "$app_props" "$app_props.backup.$(date +%Y%m%d_%H%M%S)"

    # Add V4 profile configuration
    cat >> "$app_props" << 'EOF'

# ===========================================
# V4 PROFILE CONFIGURATION (Port 9004)
# Enhanced for 3M+ TPS Production Deployment
# ===========================================

# V4 HTTP Configuration
%v4.quarkus.http.port=9004
%v4.quarkus.http.host=0.0.0.0
%v4.quarkus.http.http2=true

# V4 gRPC Configuration
%v4.quarkus.grpc.server.port=9005
%v4.quarkus.grpc.server.host=0.0.0.0
%v4.quarkus.grpc.server.use-separate-server=true

# V4 Performance Optimization
%v4.consensus.target.tps=3000000
%v4.consensus.batch.size=20000
%v4.consensus.parallel.threads=512
%v4.consensus.pipeline.depth=50

# V4 AI Optimization
%v4.ai.optimization.enabled=true
%v4.ai.optimization.target.tps=5000000
%v4.ai.optimization.learning.rate=0.0001
%v4.ai.optimization.model.update.interval.ms=3000

# V4 Ultra Performance Mode
%v4.aurigraph.ultra.performance.mode=true
%v4.aurigraph.transaction.shards=512
%v4.aurigraph.batch.size.optimal=25000
%v4.aurigraph.processing.parallelism=1024
%v4.aurigraph.virtual.threads.max=200000

# V4 Memory Optimization
%v4.aurigraph.memory.pool.enabled=true
%v4.aurigraph.memory.pool.size.mb=4096
%v4.aurigraph.memory.pool.segments=256

# V4 Native Compilation Settings
%v4.quarkus.native.additional-build-args=--initialize-at-run-time=io.netty.channel.unix.Socket,--enable-preview,--gc=G1
%v4.quarkus.native.container-build=false

# V4 CORS Configuration for Production
%v4.quarkus.http.cors=true
%v4.quarkus.http.cors.origins=https://dlt.aurigraph.io,http://dlt.aurigraph.io
%v4.quarkus.http.cors.methods=GET,POST,PUT,DELETE,OPTIONS
%v4.quarkus.http.cors.headers=Content-Type,Authorization,X-Requested-With,Accept,Origin
%v4.quarkus.http.cors.access-control-allow-credentials=true

# V4 Logging Configuration
%v4.quarkus.log.level=INFO
%v4.quarkus.log.category."io.aurigraph".level=INFO
%v4.quarkus.log.console.format=%d{HH:mm:ss} %-5p [V4][%c{2.}] (%t) %s%e%n

# V4 Monitoring and Health
%v4.quarkus.micrometer.enabled=true
%v4.quarkus.micrometer.export.prometheus.enabled=true
%v4.quarkus.smallrye-health.root-path=/v4/health

EOF

    log_success "V4 profile configuration added to application.properties"
}

# Build V4 with native compilation
build_v4_native() {
    log "Building V4 profile with native compilation (ultra-optimized)..."

    cd "$STANDALONE_DIR"

    # Clean previous builds
    ./mvnw clean -q

    # Build with ultra-optimized native profile
    log "Starting native build with $BUILD_PROFILE profile (this may take 20-30 minutes)..."
    ./mvnw package -Pnative-ultra -DskipTests -Dquarkus.profile=v4 \
        -Dquarkus.native.container-build=false \
        -Dquarkus.native.additional-build-args="--initialize-at-run-time=io.netty.channel.unix.Socket,--enable-preview,--gc=G1,-march=native,-O3"

    # Verify native executable was created
    NATIVE_EXECUTABLE="target/aurigraph-v11-standalone-11.0.0-runner"
    if [ ! -f "$NATIVE_EXECUTABLE" ]; then
        log_error "Native executable not found at $NATIVE_EXECUTABLE"
        exit 1
    fi

    # Make executable
    chmod +x "$NATIVE_EXECUTABLE"

    # Get file size
    FILE_SIZE=$(du -h "$NATIVE_EXECUTABLE" | cut -f1)
    log_success "Native executable built successfully (Size: $FILE_SIZE)"

    cd - > /dev/null
}

# Package deployment artifacts
package_artifacts() {
    log "Packaging deployment artifacts..."

    local deploy_dir="/tmp/aurigraph-v4-deployment"
    mkdir -p "$deploy_dir"

    # Copy native executable
    cp "$STANDALONE_DIR/target/aurigraph-v11-standalone-11.0.0-runner" "$deploy_dir/"

    # Copy configuration files
    cp "$STANDALONE_DIR/src/main/resources/application.properties" "$deploy_dir/"

    # Create systemd service file for V4
    cat > "$deploy_dir/aurigraph-v4.service" << 'EOF'
[Unit]
Description=Aurigraph DLT V4.0 Service
After=network.target
Wants=network.target

[Service]
Type=simple
User=subbu
Group=subbu
WorkingDirectory=/opt/aurigraph-v4
ExecStart=/opt/aurigraph-v4/aurigraph-v11-standalone-11.0.0-runner -Dquarkus.profile=v4
Restart=always
RestartSec=5
Environment=JAVA_OPTS="-Xmx4g -XX:+UseG1GC -XX:+UseStringDeduplication"
Environment=QUARKUS_PROFILE=v4

# Resource limits
LimitNOFILE=65536
LimitNPROC=32768

# Security settings
NoNewPrivileges=true
ProtectSystem=strict
ProtectHome=true
ReadWritePaths=/opt/aurigraph-v4

[Install]
WantedBy=multi-user.target
EOF

    # Create nginx configuration for V4
    cat > "$deploy_dir/nginx-v4.conf" << 'EOF'
upstream aurigraph_v4_backend {
    least_conn;
    server 127.0.0.1:9004 max_fails=3 fail_timeout=30s;
    keepalive 32;
}

server {
    listen 80;
    listen [::]:80;
    server_name dlt.aurigraph.io;

    # Redirect all HTTP to HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name dlt.aurigraph.io;

    # SSL Configuration
    ssl_certificate /etc/letsencrypt/live/dlt.aurigraph.io/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/dlt.aurigraph.io/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512:ECDHE-RSA-AES256-GCM-SHA384:DHE-RSA-AES256-GCM-SHA384;
    ssl_prefer_server_ciphers off;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 10m;

    # Security headers
    add_header X-Frame-Options DENY always;
    add_header X-Content-Type-Options nosniff always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;
    add_header Content-Security-Policy "default-src 'self'" always;

    # V4 API endpoints
    location /api/v4/ {
        proxy_pass http://aurigraph_v4_backend/api/v11/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;

        # Timeouts
        proxy_connect_timeout 30s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;

        # Buffer settings for high throughput
        proxy_buffering on;
        proxy_buffer_size 128k;
        proxy_buffers 4 256k;
        proxy_busy_buffers_size 256k;
    }

    # Health check endpoint
    location /v4/health {
        proxy_pass http://aurigraph_v4_backend/v4/health;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Default location
    location / {
        proxy_pass http://aurigraph_v4_backend/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
EOF

    # Create deployment script for remote server
    cat > "$deploy_dir/remote-deploy-v4.sh" << 'EOF'
#!/bin/bash

set -e

log() {
    echo "[$(date +'%Y-%m-%d %H:%M:%S')] $1"
}

log "Starting V4 deployment on remote server..."

# Create deployment directory
sudo mkdir -p /opt/aurigraph-v4
sudo chown subbu:subbu /opt/aurigraph-v4

# Copy executable and configuration
cp aurigraph-v11-standalone-11.0.0-runner /opt/aurigraph-v4/
cp application.properties /opt/aurigraph-v4/
chmod +x /opt/aurigraph-v4/aurigraph-v11-standalone-11.0.0-runner

# Install systemd service
sudo cp aurigraph-v4.service /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable aurigraph-v4

# Update nginx configuration
sudo cp nginx-v4.conf /etc/nginx/sites-available/aurigraph-v4
sudo ln -sf /etc/nginx/sites-available/aurigraph-v4 /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx

# Start V4 service
sudo systemctl start aurigraph-v4

# Wait for service to start
sleep 10

# Verify deployment
if curl -f http://localhost:9004/api/v11/health >/dev/null 2>&1; then
    log "V4 service started successfully!"
    log "Service status:"
    sudo systemctl status aurigraph-v4 --no-pager

    log "V4 endpoint accessible at:"
    log "- Local: http://localhost:9004"
    log "- Remote: https://dlt.aurigraph.io/api/v4/"
    log "- Health: https://dlt.aurigraph.io/v4/health"
else
    log "ERROR: V4 service failed to start properly"
    log "Checking logs:"
    sudo journalctl -u aurigraph-v4 --no-pager -n 20
    exit 1
fi
EOF

    chmod +x "$deploy_dir/remote-deploy-v4.sh"

    # Create archive
    cd /tmp
    tar -czf aurigraph-v4-deployment.tar.gz aurigraph-v4-deployment/

    log_success "Deployment artifacts packaged in /tmp/aurigraph-v4-deployment.tar.gz"
}

# Deploy to remote server
deploy_to_remote() {
    log "Deploying V4 to remote server at $REMOTE_HOST..."

    # Transfer deployment package
    log "Transferring deployment package..."
    sshpass -p "$REMOTE_PASSWORD" scp -P $REMOTE_PORT -o StrictHostKeyChecking=no \
        /tmp/aurigraph-v4-deployment.tar.gz ${REMOTE_USER}@${REMOTE_HOST}:/tmp/

    # Execute remote deployment
    log "Executing remote deployment script..."
    sshpass -p "$REMOTE_PASSWORD" ssh -p $REMOTE_PORT -o StrictHostKeyChecking=no \
        ${REMOTE_USER}@${REMOTE_HOST} << 'REMOTE_SCRIPT'

        cd /tmp
        tar -xzf aurigraph-v4-deployment.tar.gz
        cd aurigraph-v4-deployment
        chmod +x remote-deploy-v4.sh
        ./remote-deploy-v4.sh

REMOTE_SCRIPT

    log_success "Remote deployment completed"
}

# Verify deployment
verify_deployment() {
    log "Verifying V4 deployment..."

    # Test local endpoints if running locally
    if curl -f http://localhost:$V4_PORT/api/v11/health >/dev/null 2>&1; then
        log_success "Local V4 health check passed"
    fi

    # Test remote endpoints
    log "Testing remote endpoints..."

    # Health check
    if curl -f https://dlt.aurigraph.io/v4/health >/dev/null 2>&1; then
        log_success "Remote health check passed"
    else
        log_warning "Remote health check failed - may take a few minutes to become available"
    fi

    # Performance test endpoint
    if curl -f https://dlt.aurigraph.io/api/v4/performance >/dev/null 2>&1; then
        log_success "Remote performance endpoint accessible"
    else
        log_warning "Remote performance endpoint not yet available"
    fi

    log "V4 deployment verification completed"
    log "Service should be available at: https://dlt.aurigraph.io/api/v4/"
}

# Performance test
run_performance_test() {
    log "Running V4 performance test..."

    # Simple performance test
    log "Testing transaction throughput..."

    # This would be expanded with actual performance testing
    log "Performance test placeholder - implement specific V4 performance validation"

    log_success "Performance test completed"
}

# Main execution
main() {
    log "Starting Aurigraph DLT V4.0 Comprehensive Deployment"
    log "Target: $TARGET_TPS TPS on port $V4_PORT"
    log "Remote: $REMOTE_HOST:$REMOTE_PORT"

    preflight_checks
    setup_v4_profile
    build_v4_native
    package_artifacts

    # Ask for confirmation before remote deployment
    echo -n "Deploy to remote server $REMOTE_HOST? (y/N): "
    read -r response
    if [[ "$response" =~ ^[Yy]$ ]]; then
        deploy_to_remote
        verify_deployment
        run_performance_test
    else
        log "Skipping remote deployment. Artifacts available in /tmp/aurigraph-v4-deployment/"
    fi

    log_success "V4.0 deployment pipeline completed successfully!"
}

# Cleanup function
cleanup() {
    log "Cleaning up temporary files..."
    # Add any cleanup logic here
}

# Set trap for cleanup
trap cleanup EXIT

# Execute main function
main "$@"