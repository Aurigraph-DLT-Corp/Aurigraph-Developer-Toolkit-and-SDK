# Aurigraph V11 Production Deployment - Endpoint Access Guide

**Deployment Date**: November 21, 2025
**Domain**: https://dlt.aurigraph.io
**Server IP**: 151.242.51.55
**SSL/TLS**: Let's Encrypt (Valid)

---

## 🟢 Working Endpoints

### Public/Health Endpoints (No Authentication Required)

#### 1. **Main Portal** ✅
- **URL**: https://dlt.aurigraph.io/
- **Method**: GET
- **Status**: HTTP/2 200 OK
- **Response**: HTML page with React app
- **Description**: Enterprise Portal dashboard with real-time analytics
- **Access**: Open (no auth required)
- **Test**:
  ```bash
  curl -k https://dlt.aurigraph.io/
  ```

#### 2. **Quarkus Health Check** ✅
- **URL**: https://dlt.aurigraph.io/q/health
- **Method**: GET
- **Status**: HTTP 200 OK
- **Response**: JSON health status
- **Description**: Quarkus framework health endpoint - checks database, cache, monitoring
- **Access**: Open (public health endpoint)
- **Response Example**:
  ```json
  {
    "status": "UP",
    "checks": {
      "database": "UP",
      "cache": "UP",
      "monitoring": "UP"
    }
  }
  ```
- **Test**:
  ```bash
  curl -k https://dlt.aurigraph.io/q/health
  ```

#### 3. **V11 Health API** ✅
- **URL**: https://dlt.aurigraph.io/api/v11/health
- **Method**: GET
- **Status**: HTTP 200 OK
- **Response**: Platform health with component status
- **Description**: Aurigraph V11 platform health check
- **Access**: Open (public health endpoint)
- **Response Example**:
  ```json
  {
    "checks": {
      "consensus": "UP",
      "database": "UP",
      "network": "UP"
    },
    "version": "11.0.0",
    "status": "UP",
    "timestamp": "2025-11-21T06:12:31.359503827Z",
    "uptime": 0
  }
  ```
- **Test**:
  ```bash
  curl -k https://dlt.aurigraph.io/api/v11/health
  ```

#### 4. **V11 Info/Platform Information** ✅
- **URL**: https://dlt.aurigraph.io/api/v11/info
- **Method**: GET
- **Status**: HTTP 200 OK
- **Response**: Comprehensive platform information
- **Description**: System information, build details, features, network configuration
- **Access**: Open (public information endpoint)
- **Response Fields**:
  - `platform`: Name, version, description, environment
  - `runtime`: Java version, Quarkus version, runtime info
  - `features`: Consensus algorithm, cryptography, enabled modules
  - `network`: Node type, network ID, cluster size, API endpoints
  - `build`: Build version, timestamp, commit hash, branch
- **Test**:
  ```bash
  curl -k https://dlt.aurigraph.io/api/v11/info
  ```

### Monitoring & Metrics Endpoints

#### 5. **Prometheus Metrics** ⏳ (Proxied)
- **URL**: https://dlt.aurigraph.io/prometheus/ (via NGINX proxy)
- **Method**: GET
- **Status**: Should proxy to internal Prometheus (port 9090)
- **Description**: Prometheus monitoring metrics and API
- **Access**: Proxied through NGINX (internal)
- **Direct Internal Access**:
  ```bash
  ssh -p 22 subbu@dlt.aurigraph.io
  curl http://localhost:9090/
  ```

#### 6. **Grafana Dashboard** ⏳ (Proxied)
- **URL**: https://dlt.aurigraph.io/grafana/
- **Method**: GET
- **Status**: Should proxy to internal Grafana (port 3000)
- **Description**: Grafana dashboards for system monitoring
- **Access**: Proxied through NGINX (internal)
- **Default Login**: admin/admin123 (⚠️ Change in production!)
- **Direct Internal Access**:
  ```bash
  ssh -p 22 subbu@dlt.aurigraph.io
  curl http://localhost:3000/
  ```

---

## 🔴 Protected Endpoints (Require JWT Authentication)

### Blockchain Endpoints (JWT Required)

#### 1. **Get Nodes** ❌ (Requires Auth)
- **URL**: https://dlt.aurigraph.io/api/v11/nodes
- **Method**: GET
- **Status**: 401 Unauthorized - Missing Authorization header
- **Response**:
  ```json
  {"error":"Missing Authorization header","timestamp":1763705593550}
  ```
- **Required Header**:
  ```
  Authorization: Bearer <JWT_TOKEN>
  ```
- **Description**: List all nodes in the network (validators, business nodes, etc.)
- **Access**: Authenticated users only
- **Requires Role**: API_USER or ADMIN

#### 2. **Get Consensus Status** ❌ (Requires Auth)
- **URL**: https://dlt.aurigraph.io/api/v11/consensus/status
- **Method**: GET
- **Status**: 401 Unauthorized - Missing Authorization header
- **Response**: Same as above
- **Required Header**:
  ```
  Authorization: Bearer <JWT_TOKEN>
  ```
- **Description**: Current consensus algorithm status, leader info, round number
- **Access**: Authenticated users only

#### 3. **Get Analytics Dashboard** ❌ (Requires Auth)
- **URL**: https://dlt.aurigraph.io/api/v11/analytics/dashboard
- **Method**: GET
- **Status**: 401 Unauthorized - Missing Authorization header
- **Required Header**:
  ```
  Authorization: Bearer <JWT_TOKEN>
  ```
- **Description**: Dashboard analytics including TPS, transaction metrics
- **Access**: Authenticated users only

#### 4. **Get Blockchain Transactions** ❌ (Requires Auth)
- **URL**: https://dlt.aurigraph.io/api/v11/blockchain/transactions?page=0&size=10
- **Method**: GET
- **Status**: 401 Unauthorized - Missing Authorization header
- **Query Parameters**:
  - `page`: Page number (default: 0)
  - `size`: Items per page (default: 10)
- **Required Header**:
  ```
  Authorization: Bearer <JWT_TOKEN>
  ```
- **Description**: Paginated list of blockchain transactions
- **Access**: Authenticated users only

#### 5. **Get Overall Stats** ❌ (Requires Auth)
- **URL**: https://dlt.aurigraph.io/api/v11/stats
- **Method**: GET
- **Status**: 401 Unauthorized - Missing Authorization header
- **Response**:
  ```json
  {"error":"Missing Authorization header","timestamp":1763705675736}
  ```
- **Required Header**:
  ```
  Authorization: Bearer <JWT_TOKEN>
  ```
- **Description**: Overall system statistics including transactions, performance
- **Access**: Authenticated users only
- **Implementation**: `StatsApiResource.java` with `@Path("/api/v11/stats")`

#### 6. **Get Blockchain Stats** ❌ (Not Found)
- **URL**: https://dlt.aurigraph.io/api/v11/blockchain/stats
- **Method**: GET
- **Status**: 404 Not Found - Resource not found
- **Response**:
  ```html
  <html><body><h1>Resource not found</h1></body></html>
  ```
- **Available Alternatives**:
  - **Blockchain Transaction Stats**: https://dlt.aurigraph.io/api/v11/blockchain/transactions/stats (likely requires auth)
    - Implementation: `BlockchainApiResource.java`
  - **Network Stats**: https://dlt.aurigraph.io/api/v11/blockchain/network/stats (likely requires auth)
    - Implementation: `BlockchainApiResource.java`
  - **Overall Stats**: https://dlt.aurigraph.io/api/v11/stats (requires auth)
    - Implementation: `StatsApiResource.java`

---

## 📋 How to Get JWT Authentication Token

### Option 1: Using IAM Server (Keycloak)

The production environment uses Keycloak for OAuth 2.0/OpenID Connect authentication:

**IAM Server**: https://iam2.aurigraph.io/

**To obtain a JWT token:**

```bash
# 1. Login to Keycloak
curl -k -X POST https://iam2.aurigraph.io/realms/AWD/protocol/openid-connect/token \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "grant_type=password" \
  -d "client_id=aurigraph-client" \
  -d "username=YOUR_USERNAME" \
  -d "password=YOUR_PASSWORD" \
  -d "client_secret=YOUR_CLIENT_SECRET"

# 2. Extract the access_token from response
# 3. Use token in API calls:
curl -k https://dlt.aurigraph.io/api/v11/nodes \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

### Option 2: Create Local Test Token (Development Only)

For development/testing, you can create a test token:

```bash
# SSH into production server
ssh -p 22 subbu@dlt.aurigraph.io

# Generate a test JWT token (if token generation endpoint exists)
curl -X POST http://localhost:9003/api/v11/auth/token \
  -H "Content-Type: application/json" \
  -d '{"username":"test_user","password":"test_password"}'
```

---

## 🔧 Fixing Non-Working Endpoints

### Issue 1: Missing `/api/v11/blockchain/stats` Endpoint

**Problem**: Returns 404 Not Found

**Solution**:
1. Check if endpoint is implemented in `AurigraphResource.java`
2. Search for `@Path("/blockchain/stats")` or similar
3. If missing, implement or use alternative endpoint

**Temporary Workaround**:
Use `/api/v11/info` which includes some system information, or `/api/v11/health` for status

### Issue 2: Protected Endpoints Require JWT Authentication

**Problem**: All authenticated endpoints return "Missing Authorization header"

**Solution**:
1. Obtain JWT token from Keycloak (see "How to Get JWT Authentication Token" above)
2. Include token in all API calls:
   ```bash
   curl -k https://dlt.aurigraph.io/api/v11/nodes \
     -H "Authorization: Bearer <TOKEN>"
   ```

### Issue 3: Portal Assets Loading Correctly

**Status**: ✅ Working

The main portal (https://dlt.aurigraph.io) is loading correctly with:
- HTTP/2 support enabled
- Security headers configured
- React assets served properly
- NGINX proxy working

---

## 📊 Service Status Summary

| Service | Status | Port | Access |
|---------|--------|------|--------|
| NGINX Gateway | UP ✅ | 80/443 | Public (HTTP/2) |
| V11 API | UP ✅ (warmup) | 9003 | Public (health), Protected (data) |
| Enterprise Portal | UP ✅ | 3000 | Public |
| PostgreSQL | UP ✅ | 5432 | Internal only |
| Redis | UP ✅ | 6379 | Internal only |
| Prometheus | UP ✅ | 9090 | Proxied via NGINX |
| Grafana | UP ✅ | 3000 | Proxied via NGINX |

---

## 🚀 Quick Start Guide

### 1. Test Basic Health

```bash
# Check if service is responding
curl -k https://dlt.aurigraph.io/api/v11/health

# Check Quarkus framework
curl -k https://dlt.aurigraph.io/q/health

# Get platform info
curl -k https://dlt.aurigraph.io/api/v11/info
```

### 2. Test Portal Access

```bash
# Download portal HTML
curl -k https://dlt.aurigraph.io/ -o portal.html

# Check portal is being served via NGINX
curl -kI https://dlt.aurigraph.io/
```

### 3. Test Authenticated Endpoints (With Token)

```bash
# First get JWT token (see IAM section above)
TOKEN="your_jwt_token_here"

# Test nodes endpoint
curl -k https://dlt.aurigraph.io/api/v11/nodes \
  -H "Authorization: Bearer $TOKEN"

# Test consensus status
curl -k https://dlt.aurigraph.io/api/v11/consensus/status \
  -H "Authorization: Bearer $TOKEN"
```

### 4. Debugging Connectivity

```bash
# DNS Resolution
nslookup dlt.aurigraph.io

# SSL Certificate Check
openssl s_client -connect dlt.aurigraph.io:443 -showcerts

# NGINX Configuration
ssh -p 22 subbu@dlt.aurigraph.io
docker-compose exec nginx-gateway cat /etc/nginx/nginx.conf
```

---

## 📝 Configuration Notes

### SSL/TLS Certificate
- **Provider**: Let's Encrypt
- **Path on Server**: `/etc/letsencrypt/live/aurcrt/`
- **Certificate File**: `fullchain.pem`
- **Private Key**: `privkey.pem`
- **Protocol**: TLS 1.3
- **Status**: Valid and automatically renewed

### NGINX Configuration
- **Gateway**: nginx:1.25-alpine
- **Ports**: 80 (HTTP), 443 (HTTPS)
- **HTTP/2**: Enabled
- **Proxy Targets**:
  - / → Enterprise Portal (3000)
  - /api/v11 → V11 Service (9003)
  - /grafana/ → Grafana (3000, internal)
  - /prometheus/ → Prometheus (9090, internal)

### V11 Service Configuration
- **Port**: 9003 (HTTP/2)
- **gRPC Port**: 9004 (for gRPC services)
- **Database**: PostgreSQL on postgres:5432 (Docker DNS)
- **Cache**: Redis on redis:6379 (Docker DNS)
- **Runtime**: Java 21 with Quarkus 3.28.2
- **Memory**: 2GB heap size

---

## 🔗 Related Resources

- **Remote Server SSH**: `ssh -p 22 subbu@dlt.aurigraph.io`
- **Production Folder**: `/opt/DLT`
- **Docker Compose File**: `/opt/DLT/docker-compose.yml`
- **GitHub Repo**: https://github.com/Aurigraph-DLT-Corp/Aurigraph-DLT
- **IAM Server**: https://iam2.aurigraph.io/
- **JIRA Board**: https://aurigraphdlt.atlassian.net

---

## 📞 Support & Troubleshooting

### Common Issues

**Issue**: "Connection refused" on https://dlt.aurigraph.io
- **Solution**: Check DNS resolution and firewall rules
  ```bash
  nslookup dlt.aurigraph.io
  ping dlt.aurigraph.io  # May be blocked by server
  ```

**Issue**: "SSL certificate error"
- **Solution**: Use `-k` flag with curl or import certificate
  ```bash
  curl -k https://dlt.aurigraph.io/
  ```

**Issue**: "401 Unauthorized" on authenticated endpoints
- **Solution**: Obtain and include valid JWT token
  ```bash
  curl -H "Authorization: Bearer YOUR_TOKEN" https://dlt.aurigraph.io/api/v11/nodes
  ```

**Issue**: "404 Resource not found"
- **Solution**: Check endpoint path - may be implemented differently
- Try alternatives or check API documentation

### Server Access Commands

```bash
# SSH into production server
ssh -p 22 subbu@dlt.aurigraph.io

# Check service status
docker-compose -f docker-compose.yml ps

# View service logs
docker-compose -f docker-compose.yml logs -f dlt-aurigraph-v11

# Restart all services
docker-compose -f docker-compose.yml restart

# Check NGINX logs
docker-compose -f docker-compose.yml logs -f dlt-nginx-gateway
```

---

**Last Updated**: November 21, 2025
**Document Version**: 1.0
