# Aurigraph DLT Node Routing Configuration

## Overview

This document describes the NGINX reverse proxy configuration for routing requests to different node types in the Aurigraph DLT network.

## Node Architecture

The Aurigraph DLT platform uses a multi-tier node architecture:

### 1. Validator Nodes (Consensus Layer)
- **Container**: `dlt-validator-node-1` (and more when deployed)
- **Network**: `dlt-backend` (172.21.0.0/16)
- **IP Address**: 172.21.1.20
- **Port**: 9003 (HTTP/REST API)
- **Role**: Participate in HyperRAFT++ consensus and block production
- **Health Check**: `/q/health/ready`
- **Routing**: `/api/v11/validator/*` → `http://validator-nodes`

### 2. Business Nodes (Transaction Processing Layer)
- **Container**: `dlt-business-node-1` (and more when deployed)
- **Network**: `dlt-backend` (172.21.0.0/16)
- **IP Address**: 172.21.1.21
- **Port**: 9003 (HTTP/REST API)
- **Role**: Handle transaction validation and business logic without consensus
- **Health Check**: `/q/health/ready`
- **Routing**: `/api/v11/business/*` → `http://business-nodes`

### 3. Slim Nodes (Edge/Archive Layer)
- **Container**: `dlt-slim-node-1` (and more when deployed)
- **Network**: `dlt-backend` (172.21.0.0/16)
- **IP Address**: 172.21.1.30
- **Port**: 9003 (HTTP/REST API)
- **Role**: Provide RPC access and data availability with minimal resources
- **Storage**: LevelDB for lightweight data persistence
- **Health Check**: `/q/health`
- **Routing**: `/api/v11/slim/*` → `http://slim-nodes`

## Network Configuration

### Docker Networks

The deployment uses three isolated Docker networks:

```yaml
dlt-frontend:   172.20.0.0/16  # Public-facing services (NGINX, Portal)
dlt-backend:    172.21.0.0/16  # Node services (Validator, Business, Slim)
dlt-monitoring: 172.22.0.0/16  # Monitoring services (Prometheus, Grafana)
```

### NGINX Gateway Configuration

The NGINX gateway (`dlt-nginx-gateway`) is connected to both `dlt-frontend` and `dlt-backend` networks, allowing it to:
- Accept external HTTPS traffic on port 443
- Route requests to backend nodes on the `dlt-backend` network
- Proxy to the Enterprise Portal on the `dlt-frontend` network

## API Routing

### Validator Node Endpoints

**Base Route**: `/api/v11/validator/*`

**Examples**:
```bash
# Get validator info
curl https://dlt.aurigraph.io/api/v11/validator/info

# Get blockchain stats
curl https://dlt.aurigraph.io/api/v11/validator/stats

# Get consensus status
curl https://dlt.aurigraph.io/api/v11/validator/consensus/status

# Health check
curl https://dlt.aurigraph.io/api/v11/validator/health
```

**Configuration**:
- Load balancing: `least_conn` (sends to server with fewest connections)
- Max failures: 3 consecutive failures before marking unhealthy
- Fail timeout: 30 seconds
- Connection timeout: 15s
- Request timeout: 30s
- Keepalive: 64 connections, 60s timeout

### Business Node Endpoints

**Base Route**: `/api/v11/business/*`

**Examples**:
```bash
# Submit transaction
curl -X POST https://dlt.aurigraph.io/api/v11/business/transactions \
  -H "Content-Type: application/json" \
  -d '{"from":"address1","to":"address2","amount":100}'

# Get transaction history
curl https://dlt.aurigraph.io/api/v11/business/transactions?address=address1

# Deploy smart contract
curl -X POST https://dlt.aurigraph.io/api/v11/business/contracts/deploy \
  -H "Content-Type: application/json" \
  -d '{"code":"...", "params":"..."}'

# Health check
curl https://dlt.aurigraph.io/api/v11/business/health
```

**Configuration**:
- Load balancing: `least_conn`
- Max failures: 3 consecutive failures before marking unhealthy
- Fail timeout: 30 seconds
- Connection timeout: 30s
- Request timeout: 60s (higher for complex transactions)
- Keepalive: 64 connections, 60s timeout

### Slim Node Endpoints

**Base Route**: `/api/v11/slim/*`

**Examples**:
```bash
# Query blockchain data
curl https://dlt.aurigraph.io/api/v11/slim/blockchain/blocks?limit=10

# Get transaction by hash
curl https://dlt.aurigraph.io/api/v11/slim/blockchain/transactions/0x...

# Get account balance
curl https://dlt.aurigraph.io/api/v11/slim/accounts/address1/balance

# Archive query
curl https://dlt.aurigraph.io/api/v11/slim/archive/blocks/12345

# Health check
curl https://dlt.aurigraph.io/api/v11/slim/health
```

**Configuration**:
- Load balancing: `least_conn`
- Max failures: 3 consecutive failures before marking unhealthy
- Fail timeout: 30 seconds
- Connection timeout: 20s
- Request timeout: 45s (optimized for read-heavy workloads)
- Keepalive: 32 connections, 60s timeout

### Node Status Endpoint

**Route**: `/api/v11/nodes/status`

Returns aggregated status of all node types:

```bash
curl https://dlt.aurigraph.io/api/v11/nodes/status
```

**Response**:
```json
{
  "status": "operational",
  "node_types": {
    "validator": {
      "endpoint": "/api/v11/validator/*",
      "health_check": "/api/v11/validator/health",
      "description": "HyperRAFT++ consensus validators",
      "active_nodes": 1
    },
    "business": {
      "endpoint": "/api/v11/business/*",
      "health_check": "/api/v11/business/health",
      "description": "Transaction processing nodes",
      "active_nodes": 1
    },
    "slim": {
      "endpoint": "/api/v11/slim/*",
      "health_check": "/api/v11/slim/health",
      "description": "Lightweight edge nodes with LevelDB",
      "active_nodes": 1
    }
  },
  "routing": "NGINX reverse proxy with load balancing",
  "version": "v4.4.4"
}
```

## Load Balancing

### Algorithm

The configuration uses the `least_conn` load balancing algorithm, which:
- Tracks active connections to each backend server
- Routes new requests to the server with the fewest active connections
- Provides better distribution for long-lived connections (WebSockets, streaming)

### Failover Strategy

```nginx
proxy_next_upstream error timeout invalid_header http_500 http_502 http_503 http_504;
proxy_next_upstream_tries 3;
proxy_next_upstream_timeout 10s;
```

When a backend fails:
1. NGINX automatically tries the next available server
2. Up to 3 retry attempts
3. Total retry timeout of 10 seconds
4. Falls back to main V11 service if all nodes fail

### Health Checks

Each upstream includes health monitoring:
- **Validator nodes**: Check every 10s via `/q/health/ready`
- **Business nodes**: Check every 10s via `/q/health/ready`
- **Slim nodes**: Check every 10s via `/q/health`

Unhealthy servers are automatically removed from the pool.

## Performance Optimizations

### Connection Pooling

```nginx
keepalive 64;          # Maintain 64 idle connections
keepalive_timeout 60s; # Keep idle connections for 60 seconds
keepalive_requests 1000; # Reuse connections for up to 1000 requests
```

Benefits:
- Reduces TCP handshake overhead
- Improves latency for subsequent requests
- Optimizes resource usage

### Request Buffering

```nginx
proxy_buffering on;
proxy_buffer_size 4k;
proxy_buffers 24 4k;
proxy_busy_buffers_size 8k;
```

Benefits:
- Handles slow clients efficiently
- Prevents backend blocking
- Improves throughput for large responses

### WebSocket Support

```nginx
proxy_set_header Upgrade $http_upgrade;
proxy_set_header Connection $connection_upgrade;
```

Enables:
- Real-time transaction streaming
- Live consensus updates
- Bidirectional communication

## Security

### Rate Limiting

Applied at the NGINX level:
```nginx
limit_req zone=api_limit burst=50 nodelay;
limit_conn conn_limit 200;
```

- **API limit**: 100 requests/second with burst of 50
- **Connection limit**: 200 concurrent connections per IP

### TLS Termination

- All external traffic uses HTTPS (TLS 1.3)
- Certificates managed by Let's Encrypt
- Internal node communication uses HTTP (within Docker network)

### Request Headers

Custom headers added for tracking:
```
X-Node-Type: validator|business|slim
X-Upstream-Server: <backend-ip>:<port>
X-Response-Time: <seconds>
```

## Deployment

### Starting Node Services

Nodes use Docker Compose profiles for selective deployment:

```bash
# Start validator nodes
docker-compose --profile validators up -d validator-node-1

# Start business nodes
docker-compose --profile business-nodes up -d business-node-1

# Start slim nodes
docker-compose --profile slim-nodes up -d slim-node-1

# Start all node types
docker-compose --profile validators --profile business-nodes --profile slim-nodes up -d
```

### Scaling Nodes

To add more nodes, edit `docker-compose.yml` and uncomment additional node definitions in the upstream blocks.

Example for adding validator-2:

1. In `docker-compose.yml`, add `validator-node-2` service
2. In `config/nginx/conf.d/node-routing.conf`, uncomment:
   ```nginx
   server dlt-validator-node-2:9003 max_fails=3 fail_timeout=30s weight=10;
   ```
3. Reload NGINX configuration:
   ```bash
   docker exec dlt-nginx-gateway nginx -s reload
   ```

### Verifying Configuration

```bash
# Test NGINX configuration syntax
docker exec dlt-nginx-gateway nginx -t

# Reload NGINX (zero-downtime)
docker exec dlt-nginx-gateway nginx -s reload

# Check upstream status (if nginx-plus)
curl https://dlt.aurigraph.io/api/nginx/upstreams
```

## Monitoring

### Upstream Server Headers

Every response includes headers showing which backend handled the request:

```bash
curl -I https://dlt.aurigraph.io/api/v11/validator/info
```

Response headers:
```
X-Upstream-Server: 172.21.1.20:9003
X-Node-Type: validator
X-Response-Time: 0.023
```

### Logs

NGINX logs include upstream information:

```nginx
log_format detailed '$remote_addr - $remote_user [$time_local] '
                    '"$request" $status $body_bytes_sent '
                    '"$http_referer" "$http_user_agent" '
                    'rt=$request_time uct="$upstream_connect_time" '
                    'uht="$upstream_header_time" urt="$upstream_response_time"';
```

View logs:
```bash
docker-compose logs -f nginx-gateway
```

### Health Check Dashboard

Access aggregated health status:
```bash
curl https://dlt.aurigraph.io/api/v11/nodes/status | jq
```

## Troubleshooting

### Node Not Responding

**Symptom**: 502 Bad Gateway errors

**Diagnosis**:
```bash
# Check if node container is running
docker ps | grep dlt-validator-node-1

# Check node health
docker exec dlt-validator-node-1 wget -qO- http://localhost:9003/q/health

# Check NGINX can reach node
docker exec dlt-nginx-gateway wget -qO- http://dlt-validator-node-1:9003/q/health
```

**Solution**:
- Restart unhealthy node: `docker-compose restart validator-node-1`
- Check node logs: `docker-compose logs validator-node-1`

### DNS Resolution Issues

**Symptom**: "no resolver defined to resolve" in NGINX logs

**Diagnosis**:
```bash
# Check DNS resolver in nginx.conf
docker exec dlt-nginx-gateway cat /etc/nginx/nginx.conf | grep resolver

# Test DNS resolution
docker exec dlt-nginx-gateway nslookup dlt-validator-node-1
```

**Solution**:
- Ensure `resolver 127.0.0.11 valid=10s;` is in nginx.conf
- Restart NGINX: `docker-compose restart nginx-gateway`

### Connection Timeout

**Symptom**: 504 Gateway Timeout

**Diagnosis**:
```bash
# Check node response time
time curl http://localhost:19003/q/health

# Check if node is overloaded
docker stats dlt-validator-node-1
```

**Solution**:
- Increase timeout in node-routing.conf
- Scale horizontally by adding more nodes
- Optimize node performance

## Configuration Files

- **Main NGINX config**: `/Users/subbujois/subbuworkingdir/Aurigraph-DLT/config/nginx/nginx.conf`
- **Node routing config**: `/Users/subbujois/subbuworkingdir/Aurigraph-DLT/config/nginx/conf.d/node-routing.conf`
- **Docker Compose**: `/Users/subbujois/subbuworkingdir/Aurigraph-DLT/docker-compose.yml`

## References

- [NGINX Upstream Documentation](http://nginx.org/en/docs/http/ngx_http_upstream_module.html)
- [NGINX Load Balancing](http://nginx.org/en/docs/http/load_balancing.html)
- [Docker Networking](https://docs.docker.com/network/)
- [Aurigraph DLT Architecture](/ARCHITECTURE.md)
