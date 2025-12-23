# Aurigraph Enterprise Portal v4.5.0 - React Deployment Guide

**Date**: November 13, 2025
**Version**: 4.5.0
**Status**: ✅ Ready for Deployment
**Type**: Full React/TypeScript SPA with Material-UI & Ant Design

---

## Overview

This document provides complete guidance for deploying the full React/TypeScript Enterprise Portal v4.5.0 to the production server. This is the comprehensive version of the Portal, replacing the simplified Node.js/Express version previously deployed.

### What's Included

**Portal v4.5.0 Features:**
- ✅ React 18 + TypeScript SPA
- ✅ Material-UI & Ant Design components
- ✅ Redux state management with redux-persist
- ✅ Comprehensive dashboard widgets
- ✅ Real-time data visualization (Recharts)
- ✅ Responsive design for all devices
- ✅ 15,381 modules optimized for production
- ✅ ~820 KB gzipped total bundle size

---

## Build Information

### Build Results

```
Portal Build Completed Successfully - November 13, 2025

Vite Build Output:
├── dist/index.html                       1.61 kB (gzip: 0.74 kB)
├── dist/assets/index-DY7iqpEN.css       13.81 kB (gzip: 3.08 kB)
├── dist/assets/redux-vendor-*.js         64.27 kB (gzip: 21.62 kB)
├── dist/assets/react-vendor-*.js        314.71 kB (gzip: 96.88 kB)
├── dist/assets/chart-vendor-*.js        432.47 kB (gzip: 117.85 kB)
├── dist/assets/antd-vendor-*.js       1,278.25 kB (gzip: 402.33 kB)
└── dist/assets/index-D_SXj7PT.js     1,320.79 kB (gzip: 222.76 kB)

Total Size: 3,424.51 kB uncompressed
Total Size (gzip): 864.36 kB compressed
Build Time: 7.44 seconds
Modules Transformed: 15,381
```

### Build Configuration

```json
{
  "name": "aurigraph-enterprise-portal",
  "version": "4.5.0",
  "type": "module",
  "build_tool": "Vite 5.0.8",
  "framework": "React 18.2.0",
  "language": "TypeScript 5.3.3",
  "styling": ["Material-UI 5.18.0", "Ant Design 5.11.5"],
  "state_management": "Redux Toolkit 1.9.7",
  "charting": "Recharts 2.10.3",
  "http_client": "Axios 1.6.2"
}
```

---

## Deployment Architecture

### Services

```
┌─────────────────────────────────────────────────┐
│          NGINX Gateway (Port 80, 443)           │
│  - Serves React Portal SPA (static files)       │
│  - Reverse proxy to Prometheus & Grafana       │
│  - SSL/TLS termination (Let's Encrypt)         │
│  - CORS headers enabled                         │
│  - Gzip compression enabled                     │
└──────────────────────────────────────────────────┘
         ↓                    ↓                 ↓
    ┌────────────┐    ┌──────────────┐   ┌──────────────┐
    │  Portal    │    │ Prometheus   │   │   Grafana    │
    │ (Static    │    │   (9090)     │   │   (3001)     │
    │   Files)   │    │              │   │              │
    │  :3000     │    │              │   │              │
    └────────────┘    └──────────────┘   └──────────────┘
        React              Metrics           Dashboard
        SPA                Admin             Admin
```

### Network Configuration

```
Internet (HTTPS)
    ↓
Port 443 (NGINX)
    ↓
NGINX Reverse Proxy
    ├→ / → React Portal (static files)
    ├→ /prometheus → Prometheus (9090)
    ├→ /grafana → Grafana (3000)
    └→ /health → Health check endpoint

Internal Network: aurigraph-network (bridge)
Network Subnet: 172.20.0.0/16
```

---

## File Structure

### Local Files

```
Aurigraph-DLT/
├── portal/                          # Built React Portal (static files)
│   ├── index.html                   # Entry point
│   └── assets/                      # JS/CSS bundles
│
├── docker-compose.production-portal.yml  # Docker Compose config
│
├── config/
│   └── nginx-portal.conf            # NGINX configuration
│
├── certs/
│   ├── fullchain.pem                # SSL certificate
│   └── privkey.pem                  # SSL private key
│
└── deploy-react-portal.sh           # Deployment script
```

### Remote Files (/opt/DLT)

```
/opt/DLT/
├── docker-compose.production-portal.yml  # Service definitions
├── portal/                          # Deployed Portal files
├── config/
│   ├── nginx-portal.conf            # Active NGINX config
│   └── prometheus.yml               # Prometheus config
├── certs/
│   ├── fullchain.pem                # Active SSL cert
│   └── privkey.pem                  # Active private key
└── logs/
    ├── nginx/                       # NGINX logs
    ├── prometheus/                  # Prometheus logs
    └── grafana/                     # Grafana logs
```

---

## Deployment Steps

### Prerequisites

```bash
# Verify Node.js/npm (for building)
node --version  # v18+ required
npm --version   # v9+ required

# Verify Docker (for running)
docker --version
docker-compose --version

# Verify SSH access to remote server
ssh -p 2235 subbu@dlt.aurigraph.io "echo 'SSH OK'"
```

### Step 1: Build React Portal

```bash
cd enterprise-portal/enterprise-portal/frontend

# Install dependencies
npm install

# Build production bundle
npm run build

# Verify build output
ls -lah dist/
# Expected:
# - index.html (1.6 KB)
# - assets/ directory with bundles
```

**Expected Output:**
```
✓ 15381 modules transformed.
✓ built in 7.44s
```

### Step 2: Copy Built Files

```bash
# Copy built Portal to deployment directory
cp -r enterprise-portal/enterprise-portal/frontend/dist/* portal/

# Verify Portal files
ls -la portal/
# Should show: index.html and assets/ directory
```

### Step 3: Deploy to Remote Server

#### Option A: Use Deployment Script (Recommended)

```bash
# Make script executable
chmod +x deploy-react-portal.sh

# Run deployment
./deploy-react-portal.sh --host dlt.aurigraph.io --user subbu

# The script will:
# 1. Verify local files
# 2. Copy files to remote server
# 3. Stop current services
# 4. Start React Portal services
# 5. Verify all services are running
# 6. Test endpoints
```

#### Option B: Manual Deployment

```bash
# 1. Copy files to remote server
scp -P 2235 -r portal/* subbu@dlt.aurigraph.io:/opt/DLT/portal/
scp -P 2235 config/nginx-portal.conf subbu@dlt.aurigraph.io:/opt/DLT/config/
scp -P 2235 docker-compose.production-portal.yml subbu@dlt.aurigraph.io:/opt/DLT/

# 2. Connect to remote server
ssh -p 2235 subbu@dlt.aurigraph.io

# 3. Stop current services
cd /opt/DLT
docker-compose down 2>/dev/null || true

# 4. Start React Portal services
docker-compose -f docker-compose.production-portal.yml up -d

# 5. Verify services
docker-compose -f docker-compose.production-portal.yml ps

# 6. Check health
docker-compose -f docker-compose.production-portal.yml ps | grep "healthy"
```

### Step 4: Verify Deployment

```bash
# Check running containers
docker-compose -f docker-compose.production-portal.yml ps

# Test health endpoint
curl -k https://dlt.aurigraph.io/health

# Test Portal root
curl -k https://dlt.aurigraph.io/

# View logs
docker-compose -f docker-compose.production-portal.yml logs -f
```

---

## Endpoints

### Portal Endpoints

| Endpoint | Method | Response | Status | Purpose |
|----------|--------|----------|--------|---------|
| `https://dlt.aurigraph.io/` | GET | HTML (React SPA) | 200 | Portal main application |
| `https://dlt.aurigraph.io/health` | GET | JSON | 200 | Health check |
| `http://dlt.aurigraph.io/` | GET | Redirect | 301 | HTTP to HTTPS redirect |

### Integrated Monitoring Endpoints

| Endpoint | Service | Port | Status | Auth |
|----------|---------|------|--------|------|
| `https://dlt.aurigraph.io/prometheus/` | Prometheus | 9090 | 200 | None |
| `https://dlt.aurigraph.io/grafana/` | Grafana | 3000 | 200 | admin / AurigraphSecure123 |

---

## NGINX Configuration Details

### SSL/TLS Setup

**Certificate:**
- Type: Let's Encrypt (valid until Dec 3, 2025)
- Path: `/opt/DLT/certs/fullchain.pem`
- Key: `/opt/DLT/certs/privkey.pem`
- Protocols: TLS 1.2 & 1.3
- Ciphers: HIGH:!aNULL:!MD5

### CORS Configuration

```nginx
Access-Control-Allow-Origin: * (all origins)
Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS
Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With
Access-Control-Max-Age: 86400 (24 hours)
```

### Security Headers

```nginx
X-Content-Type-Options: nosniff
X-Frame-Options: SAMEORIGIN
X-XSS-Protection: 1; mode=block
Referrer-Policy: no-referrer-when-downgrade
```

### Caching Strategy

**Static Assets (.js, .css, .png, .jpg, etc.):**
- Cache Control: `public, max-age=31536000, immutable`
- Duration: 1 year (production-optimized build)

**HTML (index.html):**
- Cache Control: `public, max-age=3600`
- Duration: 1 hour (ensures SPA updates)

### SPA Routing

```nginx
# All non-file requests route to index.html
# This enables client-side routing in React
location / {
    try_files $uri $uri/ /index.html;
}
```

---

## Docker Compose Configuration

### Services

```yaml
services:
  nginx-gateway:
    image: nginx:alpine
    container_name: aurigraph-nginx
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./config/nginx-portal.conf:/etc/nginx/nginx.conf:ro
      - ./certs:/etc/nginx/certs:ro
      - ./portal:/usr/share/nginx/html:ro
    networks:
      - aurigraph-network
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "wget", "--quiet", "--tries=1", "--spider", "http://localhost/health"]
      interval: 10s
      timeout: 5s
      retries: 3

  prometheus:
    image: prom/prometheus:latest
    container_name: aurigraph-prometheus
    ports:
      - "9090:9090"
    volumes:
      - ./config/prometheus.yml:/etc/prometheus/prometheus.yml:ro
      - prometheus-data:/prometheus
    command:
      - '--config.file=/etc/prometheus/prometheus.yml'
      - '--storage.tsdb.path=/prometheus'
      - '--storage.tsdb.retention.time=90d'
    networks:
      - aurigraph-network
    restart: unless-stopped

  grafana:
    image: grafana/grafana:latest
    container_name: aurigraph-grafana
    ports:
      - "3001:3000"
    environment:
      - GF_SECURITY_ADMIN_USER=admin
      - GF_SECURITY_ADMIN_PASSWORD=AurigraphSecure123
      - GF_USERS_ALLOW_SIGN_UP=false
    volumes:
      - grafana-data:/var/lib/grafana
    networks:
      - aurigraph-network
    restart: unless-stopped
```

### Volumes

```yaml
volumes:
  prometheus-data:     # Time-series metrics storage (90-day retention)
  grafana-data:        # Grafana dashboards and configurations
  portal-data:         # Portal persistent storage (if needed)
```

### Networks

```yaml
networks:
  aurigraph-network:
    driver: bridge
    ipam:
      config:
        - subnet: 172.20.0.0/16
```

---

## Monitoring

### Portal Metrics (from Prometheus)

**Available Metrics:**
- HTTP request rate
- Response time distribution
- Error rates
- Container resource usage (CPU, memory)
- Network I/O

### Grafana Dashboards

**Included Dashboards:**
1. Node Exporter Full - System metrics
2. Prometheus Stats - Prometheus performance
3. Docker Container Stats - Container metrics

**Custom Dashboards:**
Can be added through Grafana UI:
1. Navigate to: https://dlt.aurigraph.io:3001/grafana/
2. Login: admin / AurigraphSecure123
3. Create → Dashboard

---

## Troubleshooting

### Services Won't Start

```bash
# Check logs
docker-compose -f docker-compose.production-portal.yml logs nginx-gateway
docker-compose -f docker-compose.production-portal.yml logs prometheus
docker-compose -f docker-compose.production-portal.yml logs grafana

# Verify port availability
lsof -i :80   # HTTP
lsof -i :443  # HTTPS
lsof -i :9090 # Prometheus
lsof -i :3001 # Grafana

# Kill process using port if needed
kill -9 <PID>
```

### HTTPS Not Working

```bash
# Verify certificate files
ls -la /opt/DLT/certs/
# Should show: fullchain.pem (2.9 KB) and privkey.pem (241 bytes)

# Check certificate validity
openssl x509 -in /opt/DLT/certs/fullchain.pem -text -noout

# Verify NGINX loaded configuration
docker exec aurigraph-nginx nginx -t
```

### Portal Not Loading

```bash
# Verify Portal files exist
ls -la /opt/DLT/portal/
# Should show: index.html and assets/ directory

# Check NGINX configuration
docker exec aurigraph-nginx nginx -t

# View NGINX access logs
docker logs aurigraph-nginx | tail -20

# Test directly
curl -v https://dlt.aurigraph.io/
```

### Prometheus/Grafana Not Accessible

```bash
# Verify containers are running
docker ps | grep aurigraph-

# Check service health
docker-compose -f docker-compose.production-portal.yml ps

# View container logs
docker logs aurigraph-prometheus
docker logs aurigraph-grafana

# Test direct access (without NGINX)
curl http://localhost:9090/-/healthy
curl http://localhost:3001/api/health
```

---

## Quick Commands

### Check Status
```bash
ssh -p 2235 subbu@dlt.aurigraph.io "cd /opt/DLT && docker-compose -f docker-compose.production-portal.yml ps"
```

### View Logs
```bash
ssh -p 2235 subbu@dlt.aurigraph.io "cd /opt/DLT && docker-compose -f docker-compose.production-portal.yml logs -f"
```

### Restart Services
```bash
ssh -p 2235 subbu@dlt.aurigraph.io "cd /opt/DLT && docker-compose -f docker-compose.production-portal.yml restart"
```

### Stop Services
```bash
ssh -p 2235 subbu@dlt.aurigraph.io "cd /opt/DLT && docker-compose -f docker-compose.production-portal.yml down"
```

### Start Services
```bash
ssh -p 2235 subbu@dlt.aurigraph.io "cd /opt/DLT && docker-compose -f docker-compose.production-portal.yml up -d"
```

### Test Health
```bash
curl -k https://dlt.aurigraph.io/health
curl -k https://dlt.aurigraph.io/
curl -k https://dlt.aurigraph.io/prometheus/
curl -k https://dlt.aurigraph.io/grafana/
```

---

## Rollback Procedure

If issues occur and you need to rollback:

```bash
# 1. Stop current services
ssh -p 2235 subbu@dlt.aurigraph.io "cd /opt/DLT && docker-compose -f docker-compose.production-portal.yml down"

# 2. Restore previous version (if backup exists)
ssh -p 2235 subbu@dlt.aurigraph.io "cd /opt/DLT && docker-compose down && docker-compose up -d"

# 3. Verify services
ssh -p 2235 subbu@dlt.aurigraph.io "cd /opt/DLT && docker-compose ps"
```

---

## Next Steps (Optional)

### 1. Configure Custom Dashboards

Access Grafana at `https://dlt.aurigraph.io/grafana/`:
- Login with: admin / AurigraphSecure123
- Add Prometheus data source
- Create custom dashboards for Portal metrics

### 2. Replace SSL Certificates

When using production Let's Encrypt certificates:

```bash
# Copy new certificates to server
scp -P 2235 /path/to/fullchain.pem subbu@dlt.aurigraph.io:/opt/DLT/certs/
scp -P 2235 /path/to/privkey.pem subbu@dlt.aurigraph.io:/opt/DLT/certs/

# Restart NGINX to load new certificates
ssh -p 2235 subbu@dlt.aurigraph.io "cd /opt/DLT && docker-compose -f docker-compose.production-portal.yml restart nginx-gateway"
```

### 3. Enable Authentication

For production deployments, consider adding:
- OAuth 2.0 / OpenID Connect via Keycloak
- Rate limiting per user
- Request logging and auditing

### 4. Set Up Log Aggregation

Deploy ELK Stack or Loki for centralized logging:
- Collect NGINX, Prometheus, and Grafana logs
- Enable log retention policies
- Set up log-based alerting

---

## Summary

| Item | Details |
|------|---------|
| **Version** | 4.5.0 |
| **Type** | React 18 SPA with TypeScript |
| **Build Size** | 3.4 MB uncompressed, 864 KB gzipped |
| **Build Time** | 7.44 seconds |
| **Deployment Method** | Static files via NGINX |
| **Services** | NGINX, Prometheus, Grafana |
| **SSL/TLS** | Let's Encrypt (valid until Dec 3, 2025) |
| **Status** | ✅ Production Ready |

---

**Deployment Date**: November 13, 2025
**Last Updated**: November 13, 2025
**Maintainer**: Claude Code

---
