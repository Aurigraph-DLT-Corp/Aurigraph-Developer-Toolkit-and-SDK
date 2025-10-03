# Aurigraph Enterprise Portal - Production Deployment

**Deployment Date:** October 3, 2025
**Production URL:** https://dlt.aurigraph.io
**Status:** ✅ LIVE

## V11 Backend API Endpoints (Quarkus 3.26.2 / Java 21)

### Core Endpoints
- **Health Check:** `https://dlt.aurigraph.io/health`
  - V11 platform health status
  - gRPC, Redis, and Database connection status

- **System Info:** `https://dlt.aurigraph.io/api/v11/info`
  - Platform version, Java version, framework details
  - System statistics (CPU, memory, architecture)

### Quarkus Endpoints
- **Health:** `https://dlt.aurigraph.io/q/health`
- **Metrics:** `https://dlt.aurigraph.io/q/metrics` (Prometheus format)
- **Dev UI:** `https://dlt.aurigraph.io/q/dev` (development mode only)

## Enterprise Portal Endpoints (FastAPI 3.1.0)

### HTML Dashboard
- **Main Dashboard:** `https://dlt.aurigraph.io/portal/`
  - Interactive real-time dashboard
  - Live charts and network visualization
  - WebSocket-powered live updates

- **Validator Portal:** `https://dlt.aurigraph.io/validators`
  - Validator management interface (coming soon)

### API Endpoints
- **Portal Info:** `https://dlt.aurigraph.io/portal/info`
  ```json
  {
    "name": "Aurigraph Enterprise Portal",
    "version": "3.1.0",
    "framework": "FastAPI",
    "api_version": "v11",
    "status": "active"
  }
  ```

- **Network Stats:** `https://dlt.aurigraph.io/portal/stats`
  ```json
  {
    "total_transactions": 1870283,
    "active_contracts": 8534,
    "total_tokens": 12847,
    "network_tps": 686.0,
    "network_status": "healthy"
  }
  ```

- **Recent Transactions:** `https://dlt.aurigraph.io/portal/transactions/recent`
  - Returns last 20 transactions with full details
  - Includes transaction type, status, gas used, amounts

- **Network History:** `https://dlt.aurigraph.io/portal/network/history`
  - Last 50 data points of network performance
  - TPS, block time, active validator count

### WebSocket
- **Real-time Updates:** `wss://dlt.aurigraph.io/ws`
  - Live transaction stream
  - Network performance updates
  - Dashboard data synchronization

## Infrastructure

### V11 Backend
- **Port:** 9003 (internal)
- **Runtime:** Java 21.0.8 with Virtual Threads
- **Framework:** Quarkus 3.26.2 (native compilation)
- **Services:** gRPC active, Redis connected
- **Processors:** 16 cores available
- **Memory:** 8192 MB max

### Enterprise Portal
- **Port:** 3100 (internal)
- **Container:** aurigraph-enterprise-portal (Docker)
- **Image:** AMD64 platform
- **Framework:** FastAPI 3.1.0
- **Server:** Uvicorn with 4 workers
- **Features:** WebSocket support, real-time updates

### Nginx Reverse Proxy
- **SSL/TLS:** Let's Encrypt certificates
- **Protocols:** TLS 1.2, TLS 1.3
- **HTTP/2:** Enabled
- **Redirects:** HTTP → HTTPS (301)
- **Rate Limiting:**
  - API endpoints: 100 req/s (burst 100)
  - Portal endpoints: 50 req/s (burst 30)
- **Compression:** Gzip enabled (level 6)
- **Security Headers:**
  - Strict-Transport-Security (HSTS)
  - X-Frame-Options: SAMEORIGIN
  - X-Content-Type-Options: nosniff
  - X-XSS-Protection
  - Content-Security-Policy

## Deployment Architecture

```
Internet (HTTPS/443)
    ↓
Nginx Reverse Proxy
    ├─→ /api/v11/* ────→ V11 Backend (localhost:9003)
    ├─→ /q/* ──────────→ Quarkus Endpoints (localhost:9003)
    ├─→ /health ───────→ V11 Health Check (localhost:9003)
    ├─→ /portal/* ─────→ Enterprise Portal (localhost:3100)
    ├─→ /validators ───→ Enterprise Portal (localhost:3100)
    └─→ /ws ───────────→ WebSocket (localhost:3100)
```

## Performance Metrics (Current)

- **Total Transactions:** 1,870,283+
- **Active Contracts:** 8,534
- **Total Tokens:** 12,847
- **Network TPS:** ~686 (target: 2M+)
- **Active Validators:** 95-105
- **Average Block Time:** 2.8-3.2 seconds
- **Network Status:** HEALTHY

## Features Integrated

### V11 Backend Features
- ✅ RESTful API with Quarkus
- ✅ gRPC services
- ✅ Redis caching
- ✅ Health monitoring
- ✅ Prometheus metrics
- ✅ Native compilation (GraalVM)
- ✅ Virtual threads (Java 21)

### Enterprise Portal Features
- ✅ Real-time dashboard
- ✅ Live transaction monitoring
- ✅ Network analytics
- ✅ Smart contract registry
- ✅ Token registry
- ✅ NFT marketplace integration
- ✅ HMS integration support
- ✅ Quantum cryptography info
- ✅ Interactive charts (Chart.js)
- ✅ WebSocket live updates

## Deployment Files

- `Dockerfile.enterprise-portal` - Portal container definition
- `docker-compose.production.yml` - Docker compose config
- `nginx-production.conf` - Nginx configuration template
- `deploy-with-image.sh` - Deployment script (used)
- `deploy-production.sh` - Alternative deployment (Let's Encrypt)
- `deploy-production-simple.sh` - Simple deployment (self-signed SSL)
- `enterprise_portal_fastapi.py` - Portal backend application
- `aurigraph-v11-enterprise-portal.html` - Portal frontend

## Next Steps

1. **Performance Optimization:** Continue optimizing to reach 2M+ TPS target
2. **Database Integration:** Connect PostgreSQL for persistent storage
3. **Validator Portal:** Complete validator portal HTML and API
4. **Additional APIs:** Implement remaining V11 endpoints (stats, performance)
5. **Monitoring:** Set up comprehensive monitoring and alerting
6. **Documentation:** Generate API documentation (OpenAPI/Swagger)

## Support

- **Repository:** https://github.com/Aurigraph-DLT-Corp/Aurigraph-DLT
- **JIRA:** https://aurigraphdlt.atlassian.net/jira/software/projects/AV11
- **Production Server:** dlt.aurigraph.io (SSH port 22)

---

**Last Updated:** October 3, 2025
**Deployment Status:** ✅ Production Ready
