# Comprehensive Deployment Strategy for Aurigraph DLT
## Target: aurigraphdlt.dev4.aurex.in

**Date**: 2025-09-10  
**Domain**: aurigraphdlt.dev4.aurex.in  
**Target Performance**: V10 (1M+ TPS), V11 (2M+ TPS)  
**Architecture**: Dual-platform deployment (TypeScript V10 + Java/Quarkus V11)

## 📋 DEPLOYMENT OVERVIEW

### Current Setup Analysis
Based on the codebase analysis, the deployment includes:

#### V10 TypeScript Platform (Operational)
- **Status**: ✅ **READY FOR DEPLOYMENT**
- **Architecture**: Node.js/TypeScript with HyperRAFT++ consensus
- **Performance**: 1M+ TPS target with 256 parallel threads
- **Port Configuration**: 4004 (API), 50054 (gRPC), 30304 (P2P), 9094 (metrics)
- **Features**: Quantum-resistant cryptography, AI orchestration, classical mode ready

#### V11 Java/Quarkus Platform (Under Development)
- **Status**: 🚧 **BUILD ISSUES (60 compilation errors remaining)**
- **Architecture**: Java 21/Quarkus/GraalVM with native compilation
- **Performance**: 2M+ TPS target with virtual threads
- **Port Configuration**: 9003 (HTTP/2), 9004 (gRPC)
- **Features**: Sub-second startup, quantum security level 5, HMS integration

### Infrastructure Requirements
- **Server**: dev4.aurex.in with Docker support
- **Network**: 172.20.0.0/16 subnet for container orchestration
- **SSL/TLS**: Let's Encrypt certificates with TLS 1.3
- **Reverse Proxy**: nginx with HTTP/2 and gRPC support
- **Monitoring**: Prometheus (9190), Vizor dashboard (3252), Management API (3240)

## 🎯 STEP-BY-STEP DEPLOYMENT CHECKLIST

### Phase 1: Pre-Flight Checks (15 minutes)

#### 1.1 System Requirements Validation
```bash
# Node.js 20+ verification
node -v  # Should be >= 20.0.0

# Java 21+ verification  
java -version  # Should be OpenJDK 21+

# Docker and Docker Compose
docker --version && docker-compose --version

# Available disk space (minimum 50GB)
df -h /opt  # Should have >50GB available

# Memory check (minimum 16GB recommended)
free -h  # Should show >16GB total
```

#### 1.2 Network and Port Availability
```bash
# Check if target ports are free
lsof -i :4004 :9003 :50054 :9004 :3240 :9190 :3252

# Test domain resolution
nslookup aurigraphdlt.dev4.aurex.in
ping -c 4 dev4.aurex.in

# Firewall configuration
ufw status  # Should allow HTTP/HTTPS and custom ports
```

#### 1.3 Dependencies Installation
```bash
# Install required system packages
sudo apt update && sudo apt install -y \
    curl wget git \
    nginx certbot python3-certbot-nginx \
    docker.io docker-compose \
    openjdk-21-jdk maven \
    nodejs npm \
    prometheus-node-exporter

# Verify installations
nginx -v && certbot --version && mvn -v
```

### Phase 2: Directory Structure and Project Setup (10 minutes)

#### 2.1 Create Deployment Directories
```bash
# Create directory structure
sudo mkdir -p /opt/aurigraph-dlt/{v10,v11,config,data,scripts,logs/{v10,v11,docker}}
sudo chown -R $USER:$USER /opt/aurigraph-dlt
chmod -R 755 /opt/aurigraph-dlt

# Create log directories
sudo mkdir -p /var/log/aurigraph/{v10,v11,nginx,docker}
sudo chown -R $USER:$USER /var/log/aurigraph
```

#### 2.2 Clone and Copy Project Files
```bash
# Navigate to project root
cd /Users/subbujois/Documents/GitHub/Aurigraph-DLT

# Copy V10 files to deployment directory
cp -r aurigraph-av10-7/* /opt/aurigraph-dlt/v10/

# Copy V11 files to deployment directory  
cp -r aurigraph-av10-7/aurigraph-v11-standalone/* /opt/aurigraph-dlt/v11/

# Copy environment configurations
cp aurigraph-av10-7/.env.dev4 /opt/aurigraph-dlt/v10/.env 2>/dev/null || true
```

### Phase 3: Build V10 TypeScript Platform (20 minutes)

#### 3.1 Install Dependencies and Build
```bash
cd /opt/aurigraph-dlt/v10

# Install production dependencies
npm ci --production

# Build TypeScript
npm run build

# Verify build success
ls -la dist/ && echo "✅ V10 build successful"
```

#### 3.2 Configure V10 Environment
```bash
# Create production environment file
cat > .env << EOF
NODE_ENV=production
API_PORT=4004
GRPC_PORT=50054
NETWORK_PORT=30304
METRICS_PORT=9094
MONITORING_WS_PORT=4444
QUANTUM_ENABLED=true
TARGET_TPS=1000000
CONSENSUS_ALGORITHM=HyperRAFT++
DOMAIN=aurigraphdlt.dev4.aurex.in
EOF
```

### Phase 4: Build V11 Java/Quarkus Platform (45 minutes)

⚠️ **IMPORTANT**: V11 currently has compilation errors and may fail to build.

#### 4.1 Attempt V11 Build (if compilation issues are resolved)
```bash
cd /opt/aurigraph-dlt/v11

# Standard JAR build
./mvnw clean package -DskipTests

# Native compilation (if build succeeds)
./mvnw package -Pnative-fast -Dquarkus.native.container-build=true

# Verify native binary
ls -la target/*-runner && echo "✅ V11 native build successful"
```

#### 4.2 V11 Fallback Strategy (if build fails)
```bash
# Create placeholder service for V11 endpoint
mkdir -p /opt/aurigraph-dlt/v11-placeholder
cat > /opt/aurigraph-dlt/v11-placeholder/app.js << 'EOF'
const express = require('express');
const app = express();

app.get('/q/health', (req, res) => {
  res.json({ status: 'V11 under development', timestamp: new Date().toISOString() });
});

app.get('/api/v11/info', (req, res) => {
  res.json({ 
    message: 'V11 Java/Quarkus platform under construction',
    version: '11.0.0-dev',
    status: 'compilation_in_progress'
  });
});

app.listen(9003, () => console.log('V11 placeholder running on port 9003'));
EOF

# Install express for placeholder
npm init -y && npm install express
```

### Phase 5: Docker Network and Container Setup (15 minutes)

#### 5.1 Setup Docker Network
```bash
# Remove existing network if exists
docker network rm aurigraph-dev4-network 2>/dev/null || true

# Create bridge network
docker network create \
  --driver bridge \
  --subnet=172.20.0.0/16 \
  --opt com.docker.network.bridge.name=br-aurigraph \
  aurigraph-dev4-network

# Verify network creation
docker network ls | grep aurigraph-dev4-network
```

#### 5.2 Deploy Docker Compose Stack
```bash
cd /opt/aurigraph-dlt/v10

# Stop any existing containers
docker-compose -f docker-compose.dev4.yml down 2>/dev/null || true

# Start the Docker stack
docker-compose -f docker-compose.dev4.yml up -d

# Wait for containers to stabilize
sleep 30

# Verify container status
docker-compose -f docker-compose.dev4.yml ps
docker ps --format "table {{.Names}}\t{{.Status}}" | grep aurigraph
```

### Phase 6: SSL Certificate Configuration (10 minutes)

#### 6.1 Obtain Let's Encrypt Certificate
```bash
# Stop nginx temporarily
sudo systemctl stop nginx 2>/dev/null || true

# Get SSL certificate
sudo certbot certonly \
  --standalone \
  --non-interactive \
  --agree-tos \
  --email admin@aurigraph.io \
  --domains aurigraphdlt.dev4.aurex.in \
  --keep-until-expiring

# Verify certificate
sudo ls -la /etc/letsencrypt/live/aurigraphdlt.dev4.aurex.in/
```

#### 6.2 Setup Certificate Auto-Renewal
```bash
# Test renewal
sudo certbot renew --dry-run

# Setup cron job
echo "0 12 * * * /usr/bin/certbot renew --quiet" | sudo crontab -
```

### Phase 7: Nginx Reverse Proxy Configuration (10 minutes)

#### 7.1 Create Nginx Configuration
```bash
# Use the existing deployment script's nginx configuration
sudo cp /Users/subbujois/Documents/GitHub/Aurigraph-DLT/deploy-aurigraphdlt-dev4.sh /opt/aurigraph-dlt/scripts/
sudo chmod +x /opt/aurigraph-dlt/scripts/deploy-aurigraphdlt-dev4.sh

# Run the nginx configuration part
# (The configuration in the existing script is comprehensive)
```

#### 7.2 Enable and Test Nginx
```bash
# Enable site
sudo ln -sf /etc/nginx/sites-available/aurigraphdlt.dev4.aurex.in /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default

# Test configuration
sudo nginx -t

# Start nginx
sudo systemctl enable nginx
sudo systemctl restart nginx
```

### Phase 8: Systemd Service Creation (10 minutes)

#### 8.1 Create V10 Service
```bash
sudo tee /etc/systemd/system/aurigraph-v10.service > /dev/null << EOF
[Unit]
Description=Aurigraph V10 TypeScript Platform
After=network.target docker.service
Requires=docker.service

[Service]
Type=simple
User=$USER
WorkingDirectory=/opt/aurigraph-dlt/v10
ExecStart=/usr/bin/npm run dev4
Restart=always
RestartSec=10
StandardOutput=append:/var/log/aurigraph/v10/service.log
StandardError=append:/var/log/aurigraph/v10/error.log
Environment="NODE_ENV=production"
Environment="PORT=4004"

[Install]
WantedBy=multi-user.target
EOF
```

#### 8.2 Create V11 Service (or placeholder)
```bash
# If V11 build succeeded, create native service
if [ -f "/opt/aurigraph-dlt/v11/target/aurigraph-v11-standalone-11.0.0-runner" ]; then
  sudo tee /etc/systemd/system/aurigraph-v11.service > /dev/null << EOF
[Unit]
Description=Aurigraph V11 Java/Quarkus Platform
After=network.target

[Service]
Type=simple
User=$USER
WorkingDirectory=/opt/aurigraph-dlt/v11
ExecStart=/opt/aurigraph-dlt/v11/target/aurigraph-v11-standalone-11.0.0-runner
Restart=always
RestartSec=10
StandardOutput=append:/var/log/aurigraph/v11/service.log
StandardError=append:/var/log/aurigraph/v11/error.log

[Install]
WantedBy=multi-user.target
EOF
else
  # Create placeholder service
  sudo tee /etc/systemd/system/aurigraph-v11-placeholder.service > /dev/null << EOF
[Unit]
Description=Aurigraph V11 Placeholder Service
After=network.target

[Service]
Type=simple
User=$USER
WorkingDirectory=/opt/aurigraph-dlt/v11-placeholder
ExecStart=/usr/bin/node app.js
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
EOF
fi
```

#### 8.3 Create Docker Compose Service
```bash
sudo tee /etc/systemd/system/aurigraph-docker.service > /dev/null << EOF
[Unit]
Description=Aurigraph Docker Compose Stack
After=docker.service
Requires=docker.service

[Service]
Type=simple
User=root
WorkingDirectory=/opt/aurigraph-dlt/v10
ExecStart=/usr/bin/docker-compose -f docker-compose.dev4.yml up
ExecStop=/usr/bin/docker-compose -f docker-compose.dev4.yml down
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
EOF
```

### Phase 9: Service Startup (10 minutes)

#### 9.1 Start All Services
```bash
# Reload systemd
sudo systemctl daemon-reload

# Enable and start services
sudo systemctl enable aurigraph-docker && sudo systemctl start aurigraph-docker
sudo systemctl enable aurigraph-v10 && sudo systemctl start aurigraph-v10

# Start V11 or placeholder
if [ -f "/opt/aurigraph-dlt/v11/target/aurigraph-v11-standalone-11.0.0-runner" ]; then
  sudo systemctl enable aurigraph-v11 && sudo systemctl start aurigraph-v11
else
  sudo systemctl enable aurigraph-v11-placeholder && sudo systemctl start aurigraph-v11-placeholder
fi

# Ensure nginx is running
sudo systemctl status nginx
```

#### 9.2 Verify Service Status
```bash
# Check all service statuses
sudo systemctl status aurigraph-docker aurigraph-v10 nginx
systemctl is-active aurigraph-* nginx

# Check logs
sudo journalctl -u aurigraph-v10 -n 20
sudo journalctl -u aurigraph-docker -n 20
```

## 🔧 CRITICAL CONFIGURATION PARAMETERS

### V10 TypeScript Configuration (.env)
```bash
# Core Performance Settings
NODE_ENV=production
API_PORT=4004
GRPC_PORT=50054
QUANTUM_ENABLED=true
TARGET_TPS=1000000
CONSENSUS_ALGORITHM=HyperRAFT++
PARALLEL_THREADS=256

# Network Configuration
NETWORK_ID=aurigraph-dev4
P2P_PORT=30304
METRICS_PORT=9094
MONITORING_WS_PORT=4444

# Security Settings
QUANTUM_SECURITY_LEVEL=5
NTRU_ENABLED=true
SSL_ENABLED=true

# Domain and SSL
DOMAIN=aurigraphdlt.dev4.aurex.in
CORS_ORIGIN=https://aurigraphdlt.dev4.aurex.in
```

### V11 Java/Quarkus Configuration (application.properties)
```bash
# HTTP/2 Configuration
quarkus.http.port=9003
quarkus.http.http2=true
quarkus.grpc.server.port=9004

# Performance Tuning
quarkus.virtual-threads.enabled=true
consensus.target.tps=2000000
consensus.parallel.threads=512

# Native Compilation
quarkus.native.container-build=true
quarkus.native.builder-image=quay.io/quarkus/ubi-quarkus-mandrel:24-java21

# AI Optimization
ai.optimization.enabled=true
ai.optimization.target.tps=3000000
```

### Nginx Upstream Configuration
```nginx
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
```

### Docker Compose Key Settings
```yaml
# Network configuration
networks:
  aurigraph-dev4-network:
    driver: bridge
    ipam:
      driver: default
      config:
        - subnet: 172.20.0.0/16

# Resource limits for containers
deploy:
  resources:
    limits:
      memory: 8192M
      cpus: '4'
    reservations:
      memory: 4096M
      cpus: '2'
```

## ⚠️ POTENTIAL ISSUES AND MITIGATION STRATEGIES

### Issue 1: V11 Compilation Errors (HIGH PROBABILITY)
**Problem**: V11 has 60+ remaining compilation errors
**Impact**: V11 deployment will fail
**Mitigation**:
1. Deploy V11 placeholder service on port 9003
2. Use nginx routing to serve V10 as primary platform
3. Continue V11 development in parallel
4. Hot-swap V11 when compilation is resolved

### Issue 2: Port Conflicts
**Problem**: Ports 4004, 9003, 50054 may be in use
**Impact**: Service startup failures
**Mitigation**:
```bash
# Kill existing processes
sudo lsof -ti:4004,9003,50054 | xargs -r sudo kill -9
# Modify port configuration if needed
```

### Issue 3: SSL Certificate Issues
**Problem**: Let's Encrypt rate limits or domain verification failures
**Impact**: HTTPS unavailable
**Mitigation**:
1. Use staging certificates during testing
2. Implement HTTP fallback in nginx
3. Manual certificate installation as backup

### Issue 4: Docker Container Resource Exhaustion  
**Problem**: High memory/CPU usage under load
**Impact**: Container crashes, performance degradation
**Mitigation**:
1. Implement container resource limits
2. Setup horizontal pod autoscaling
3. Monitor resource usage with Prometheus

### Issue 5: Network Connectivity Issues
**Problem**: Docker network conflicts or DNS resolution
**Impact**: Inter-service communication failures
**Mitigation**:
```bash
# Reset Docker networking
sudo systemctl restart docker
docker system prune -f
# Recreate networks
```

### Issue 6: Java/GraalVM Native Compilation Failures
**Problem**: Native image build failures on target platform
**Impact**: V11 deployment unavailable
**Mitigation**:
1. Use JVM mode as fallback
2. Build native image in container
3. Cross-compile on development machine

## ✅ POST-DEPLOYMENT VALIDATION STEPS

### Immediate Health Checks (First 5 minutes)
```bash
# 1. Service Status Validation
systemctl status aurigraph-v10 aurigraph-docker nginx
docker ps | grep aurigraph

# 2. Port Accessibility
curl -f http://localhost:4004/health
curl -f http://localhost:9003/q/health || curl -f http://localhost:9003/
curl -f https://aurigraphdlt.dev4.aurex.in/health

# 3. SSL Certificate Validation
openssl s_client -connect aurigraphdlt.dev4.aurex.in:443 -servername aurigraphdlt.dev4.aurex.in < /dev/null

# 4. Docker Container Health
docker-compose -f /opt/aurigraph-dlt/v10/docker-compose.dev4.yml ps
```

### Functional Testing (10-15 minutes)
```bash
# 1. V10 API Endpoints
curl -X GET "https://aurigraphdlt.dev4.aurex.in/api/classical/metrics"
curl -X GET "https://aurigraphdlt.dev4.aurex.in/api/classical/benchmark"

# 2. V11 API Endpoints (if available)
curl -X GET "https://aurigraphdlt.dev4.aurex.in/api/v11/info"
curl -X GET "https://aurigraphdlt.dev4.aurex.in/q/metrics"

# 3. gRPC Service Testing
grpcurl -plaintext localhost:50054 list || echo "gRPC not accessible"

# 4. Management Dashboard
curl -f https://aurigraphdlt.dev4.aurex.in:3240/health || echo "Management API not accessible"
```

### Performance Validation (15-20 minutes)
```bash
# 1. Basic Load Testing
cd /opt/aurigraph-dlt/v10
npm run test:performance 2>&1 | grep -E "TPS|throughput"

# 2. Connection Pool Testing
ab -n 1000 -c 50 https://aurigraphdlt.dev4.aurex.in/health

# 3. WebSocket Connection Testing
# (V10 supports WebSocket for real-time updates)

# 4. Memory and CPU Monitoring
docker stats --no-stream | grep aurigraph
top -p $(pgrep -d',' -f aurigraph)
```

### Monitoring Setup Validation (10 minutes)
```bash
# 1. Prometheus Metrics
curl -f http://localhost:9094/metrics | head -20
curl -f https://aurigraphdlt.dev4.aurex.in/q/metrics | head -20

# 2. Log Aggregation
tail -f /var/log/aurigraph/v10/service.log &
tail -f /var/log/nginx/aurigraph-access.log &

# 3. Container Monitoring
docker logs aurigraph-validator-dev4-01 2>&1 | tail -20
docker logs aurigraph-management-dev4 2>&1 | tail -20
```

## 🔄 ROLLBACK PROCEDURES

### Emergency Rollback (5 minutes)
```bash
# 1. Stop all new services
sudo systemctl stop aurigraph-v10 aurigraph-v11-placeholder aurigraph-docker

# 2. Restore previous nginx config
sudo cp /etc/nginx/sites-available/default.bak /etc/nginx/sites-enabled/default 2>/dev/null || true
sudo rm -f /etc/nginx/sites-enabled/aurigraphdlt.dev4.aurex.in
sudo systemctl reload nginx

# 3. Clean up Docker containers
docker-compose -f /opt/aurigraph-dlt/v10/docker-compose.dev4.yml down
docker container prune -f

# 4. Disable services
sudo systemctl disable aurigraph-v10 aurigraph-v11-placeholder aurigraph-docker
```

### Partial Rollback Scenarios

#### Rollback V11 Only (Keep V10 Running)
```bash
# Stop V11 services
sudo systemctl stop aurigraph-v11-placeholder
sudo systemctl disable aurigraph-v11-placeholder

# Update nginx to remove V11 routes
sudo sed -i '/location \/api\/v11\//,/}/d' /etc/nginx/sites-available/aurigraphdlt.dev4.aurex.in
sudo systemctl reload nginx
```

#### Rollback to HTTP Only (SSL Issues)
```bash
# Create HTTP-only nginx config
sudo tee /etc/nginx/sites-available/aurigraphdlt.dev4.aurex.in << 'EOF'
server {
    listen 80;
    server_name aurigraphdlt.dev4.aurex.in;
    
    location / {
        proxy_pass http://localhost:4004;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
EOF

sudo systemctl reload nginx
```

### Data Recovery Procedures
```bash
# 1. Backup current state
tar -czf /opt/aurigraph-dlt/backup-$(date +%Y%m%d-%H%M%S).tar.gz \
  /opt/aurigraph-dlt/data \
  /var/log/aurigraph \
  /etc/systemd/system/aurigraph-*

# 2. Database backup (if applicable)
# docker exec aurigraph-db-container pg_dump > backup.sql

# 3. Configuration backup
cp -r /opt/aurigraph-dlt/config /opt/aurigraph-dlt/config.backup
```

## 🚀 DEPLOYMENT EXECUTION SCRIPT

### Quick Deployment Command
```bash
# Make the deployment script executable
chmod +x /Users/subbujois/Documents/GitHub/Aurigraph-DLT/deploy-aurigraphdlt-dev4.sh

# Run the deployment (requires sudo)
sudo /Users/subbujois/Documents/GitHub/Aurigraph-DLT/deploy-aurigraphdlt-dev4.sh
```

### Manual Step-by-Step Execution
```bash
# Execute phases individually for better control
cd /Users/subbujois/Documents/GitHub/Aurigraph-DLT

# Phase 1: Pre-flight checks
./deploy-aurigraphdlt-dev4.sh check

# Phase 2: Build platforms
./deploy-aurigraphdlt-dev4.sh build

# Phase 3: Deploy services
./deploy-aurigraphdlt-dev4.sh deploy

# Phase 4: Validate deployment
./deploy-aurigraphdlt-dev4.sh validate
```

## 📊 EXPECTED DEPLOYMENT OUTCOMES

### Success Metrics
- **V10 Platform**: Running on port 4004 with 1M+ TPS capability
- **V11 Platform**: Either native binary or placeholder on port 9003
- **SSL/TLS**: Valid Let's Encrypt certificate with A+ rating
- **nginx**: Reverse proxy operational with gRPC support
- **Docker**: All containers healthy and monitored
- **Response Time**: <100ms for health endpoints
- **Uptime**: 99.9% availability post-deployment

### Monitoring Endpoints
- **V10 Health**: https://aurigraphdlt.dev4.aurex.in/health
- **V11 Health**: https://aurigraphdlt.dev4.aurex.in/q/health
- **Metrics**: https://aurigraphdlt.dev4.aurex.in/q/metrics
- **Management**: https://aurigraphdlt.dev4.aurex.in:3240
- **Prometheus**: https://aurigraphdlt.dev4.aurex.in:9190

### Performance Expectations
- **V10 TypeScript**: 100K-1M TPS depending on node configuration
- **V11 Java/Quarkus**: 2M+ TPS when compilation issues resolved
- **SSL Termination**: <5ms additional latency
- **Memory Usage**: <8GB total for all services
- **Startup Time**: V10 (~30s), V11 native (<1s), containers (~60s)

---

**Total Estimated Deployment Time**: 2.5-3 hours  
**Critical Path**: V11 compilation issues resolution  
**Fallback Strategy**: V10-only deployment with V11 placeholder  
**Next Steps**: Continue V11 development, performance optimization, monitoring setup

This deployment strategy provides a comprehensive, production-ready approach for deploying Aurigraph DLT on aurigraphdlt.dev4.aurex.in with high availability, performance monitoring, and robust rollback procedures.