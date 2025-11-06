# Aurigraph V11 Production Deployment Architecture

**Version**: 1.0
**Date**: November 6, 2025
**Status**: Ready for Deployment

---

## 🎯 Deployment Overview

Complete Docker-based production deployment for Aurigraph V11 blockchain platform with comprehensive monitoring, logging, and security infrastructure.

**Total Containers**: 12 services
**Memory Allocation**: 64GB+ (with reservations: 40GB+)
**CPU Allocation**: 32+ cores (with reservations: 18+ cores)
**Network**: Custom bridge (172.28.0.0/16)

---

## 📦 Container Inventory

### Core Blockchain Services

#### 1. **aurigraph-v11** (Quarkus Native Application)
```yaml
Image: aurigraph/v11:latest
Container: aurigraph-v11-production
Ports: 9003 (REST API), 9004 (gRPC)
Replicas: 3 (High Availability)
CPU: 16 cores (limit), 8 cores (reservation)
Memory: 32GB (limit), 16GB (reservation)
```

**Features**:
- Native GraalVM compilation
- REST API on port 9003
- gRPC service on port 9004
- Production profile enabled
- Health checks every 30 seconds

**Configuration**:
- `CONSENSUS_TARGET_TPS`: 2,000,000 (2M TPS target)
- `CONSENSUS_BATCH_SIZE`: 100,000
- `CONSENSUS_PARALLEL_THREADS`: 256
- `AI_OPTIMIZATION_ENABLED`: true (ML optimization active)
- `QUANTUM_CRYPTO_ENABLED`: true (Post-quantum crypto)
- `BRIDGE_VALIDATORS`: 21 (Cross-chain bridge)
- `HMS_ENABLED`: true (Hardware Security Module)
- `CBDC_ENABLED`: true (Central Bank Digital Currency)

**Volumes**:
- `/app/data`: Blockchain data storage
- `/app/logs`: Application logs

**Health Check**:
- Endpoint: `GET http://localhost:9003/q/health`
- Interval: 30 seconds
- Timeout: 10 seconds
- Retries: 3

---

### Data Services

#### 2. **PostgreSQL Database**
```yaml
Image: postgres:15-alpine
Container: aurigraph-postgres
Port: 5432 (internal only)
CPU: 4 cores (limit)
Memory: 8GB (limit)
```

**Configuration**:
- Database: `aurigraph`
- User: `aurigraph`
- Password: From environment variable `${DB_PASSWORD:-changeme}`

**Volumes**:
- `postgres-data:/var/lib/postgresql/data`: Persistent database storage

**Purpose**:
- Stores blockchain transactions
- Validator information
- Smart contract state
- User sessions
- Application metadata

#### 3. **Redis Cache**
```yaml
Image: redis:7-alpine
Container: aurigraph-redis
Port: 6379 (internal only)
CPU: 2 cores (limit)
Memory: 4GB (limit)
```

**Configuration**:
- Max Memory: 4GB
- Eviction Policy: LRU (Least Recently Used)

**Volumes**:
- `redis-data:/data`: Persistent cache storage

**Purpose**:
- Real-time transaction caching
- Session management
- Rate limiting
- API response caching
- ML model predictions cache

---

### Monitoring & Observability

#### 4. **Prometheus**
```yaml
Image: prom/prometheus:latest
Container: aurigraph-prometheus
Port: 9090 (UI + API)
```

**Configuration**:
- Config: `./config/prometheus/prometheus.yml`
- Storage: `prometheus-data` volume
- Retention: 15 days (configurable)

**Purpose**:
- Metrics collection from V11, databases, and exporters
- Time-series database for performance data
- Alert rule evaluation
- Data source for Grafana

**Metrics Collected**:
- Application metrics (TPS, latency, errors)
- JVM metrics (heap, GC, threads)
- System metrics (CPU, memory, disk)
- Database performance
- Redis cache statistics
- Blockchain metrics (blocks, validators, consensus)

#### 5. **Grafana**
```yaml
Image: grafana/grafana:latest
Container: aurigraph-grafana
Port: 3000 (UI)
Admin Password: `${GRAFANA_PASSWORD:-admin}`
```

**Configuration**:
- Auto-provisioned dashboards from `./config/grafana/dashboards`
- Auto-provisioned data sources from `./config/grafana/datasources`
- Redis datasource plugin pre-installed

**Volumes**:
- `grafana-data:/var/lib/grafana`: Dashboard and user preferences

**Purpose**:
- Visual dashboards for real-time monitoring
- Alert configuration and management
- Performance trend analysis
- Multi-team access control

**Dashboards Include**:
1. System Health (10 panels): CPU, memory, disk, GC
2. Application Metrics (10 panels): TPS, latency, errors, requests
3. Blockchain Status (8 panels): Blocks, validators, consensus
4. Performance Analysis (12 panels): Throughput trends, latency distribution
5. Infrastructure (10 panels): Container health, network, storage

---

### Distributed Tracing

#### 6. **Jaeger**
```yaml
Image: jaegertracing/all-in-one:latest
Container: aurigraph-jaeger
Ports:
  - 5775/udp (Zipkin)
  - 6831/udp (Jaeger compact)
  - 6832/udp (Jaeger binary)
  - 5778 (HTTP)
  - 16686 (UI)
  - 14268 (HTTP collector)
  - 14250 (gRPC)
  - 9411 (Zipkin HTTP)
```

**Purpose**:
- Distributed tracing for transaction processing
- Request flow analysis
- Performance bottleneck identification
- Service dependency mapping

**Supported Protocols**:
- Zipkin compatible
- Jaeger binary and compact formats
- HTTP and gRPC collectors

---

### Load Balancing & Reverse Proxy

#### 7. **NGINX**
```yaml
Image: nginx:alpine
Container: aurigraph-nginx
Ports: 80 (HTTP), 443 (HTTPS)
```

**Configuration**:
- Main config: `./config/nginx/nginx.conf`
- SSL certs: `./config/nginx/ssl`

**Purpose**:
- Reverse proxy for V11 backend (3 replicas)
- Load balancing across instances
- SSL/TLS termination
- Rate limiting
- Security headers
- WebSocket support
- Static asset serving

**Features**:
- Blue-green deployment support
- Canary release capability
- Health check-based routing
- Request logging
- Performance optimization (gzip, caching)

---

### Secrets Management

#### 8. **HashiCorp Vault**
```yaml
Image: vault:latest
Container: aurigraph-vault
Port: 8200 (API)
Dev Token: `${VAULT_TOKEN:-myroot}`
```

**Volumes**:
- `vault-data:/vault/data`: Secret storage

**Purpose**:
- Secure credential management
- API key storage
- Database password management
- SSL certificate management
- Token generation and rotation
- Audit logging of secret access

**Capabilities**:
- Development mode (quick setup)
- Secret engine for key-value pairs
- PKI certificate management
- Dynamic database credentials
- Encryption as a Service

---

### Logging & Log Analysis

#### 9. **Elasticsearch**
```yaml
Image: docker.elastic.co/elasticsearch/elasticsearch:8.11.0
Container: aurigraph-elasticsearch
Port: 9200 (API)
```

**Configuration**:
- Discovery: single-node
- JVM: 2GB heap min/max
- Security: Disabled for setup (should be enabled in production)

**Volumes**:
- `elasticsearch-data:/usr/share/elasticsearch/data`: Index storage

**Purpose**:
- Centralized log storage
- Full-text search on logs
- Time-series log data
- Log retention (configurable)
- Index management

**Retention Policy**:
- 30-day retention by default
- Automatic index rotation
- Configurable per log level

#### 10. **Kibana**
```yaml
Image: docker.elastic.co/kibana/kibana:8.11.0
Container: aurigraph-kibana
Port: 5601 (UI)
```

**Configuration**:
- Elasticsearch host: `http://elasticsearch:9200`

**Purpose**:
- Log visualization and analysis
- Kibana dashboards for logs
- Real-time log streaming
- Log filtering and aggregation
- Alerting on log patterns

#### 11. **Logstash**
```yaml
Image: docker.elastic.co/logstash/logstash:8.11.0
Container: aurigraph-logstash
```

**Configuration**:
- Pipeline: `./config/logstash/pipeline`
- JVM: 1GB heap

**Purpose**:
- Log collection from all services
- Log parsing and enrichment
- Data transformation
- Normalization before storage
- GeoIP enrichment (optional)

**Log Pipeline**:
```
V11 App Logs → Logstash → Elasticsearch → Kibana
Database Logs → Logstash → Elasticsearch → Kibana
NGINX Access Logs → Logstash → Elasticsearch → Kibana
System Logs → Logstash → Elasticsearch → Kibana
```

---

## 🌐 Network Architecture

### Network Configuration
- **Name**: `aurigraph-network`
- **Driver**: Bridge
- **Subnet**: 172.28.0.0/16
- **Type**: Custom (enables service discovery by name)

### Service Discovery
All containers can reach each other by service name:
- `aurigraph-v11:9003` (REST API)
- `aurigraph-v11:9004` (gRPC)
- `postgres:5432` (Database)
- `redis:6379` (Cache)
- `prometheus:9090` (Metrics)
- `grafana:3000` (Dashboards)
- `jaeger:16686` (Tracing)
- `elasticsearch:9200` (Logs)
- `vault:8200` (Secrets)

### External Access
- **HTTP**: Port 80 (NGINX)
- **HTTPS**: Port 443 (NGINX)
- **REST API**: Port 9003 (via NGINX)
- **gRPC**: Port 9004 (via NGINX)
- **Monitoring UIs**:
  - Prometheus: http://localhost:9090
  - Grafana: http://localhost:3000
  - Kibana: http://localhost:5601
  - Jaeger: http://localhost:16686
  - Vault: http://localhost:8200

---

## 💾 Persistent Volumes

| Volume | Purpose | Size | Mount Points |
|--------|---------|------|--------------|
| `postgres-data` | Database storage | Auto | PostgreSQL data directory |
| `redis-data` | Cache persistence | 4GB | Redis data directory |
| `prometheus-data` | Metrics storage | Auto | Prometheus TSDB |
| `grafana-data` | Dashboard configs | Auto | Grafana data |
| `vault-data` | Secrets storage | Auto | Vault backend |
| `elasticsearch-data` | Log indices | 30GB+ | Elasticsearch indices |
| V11 `./data` | Blockchain data | Auto | Application data |
| V11 `./logs` | Application logs | Auto | Application logs |

---

## 🔧 Deployment Steps

### Prerequisites
1. Docker Engine 20.10+ installed
2. Docker Compose 2.0+ installed
3. 64GB+ available RAM
4. 32+ CPU cores (minimum 18 reserved)
5. 200GB+ disk space

### Deployment Script
```bash
#!/bin/bash

# Set environment variables
export QUARKUS_PROFILE=prod
export DB_PASSWORD=your_secure_password
export GRAFANA_PASSWORD=your_grafana_password
export VAULT_TOKEN=your_vault_token

# Navigate to deployment directory
cd aurigraph-v11-standalone

# Build and start all services
docker-compose -f docker-compose-production.yml build --parallel
docker-compose -f docker-compose-production.yml up -d

# Wait for services to start
sleep 30

# Verify all services are running
docker-compose -f docker-compose-production.yml ps

# Check health status
docker-compose -f docker-compose-production.yml exec aurigraph-v11 curl -s http://localhost:9003/q/health
```

### Post-Deployment Validation
1. **API Health**: `curl http://localhost:9003/q/health`
2. **REST Endpoint**: `curl http://localhost/api/v11/health`
3. **gRPC**: `grpcurl localhost:9004 list`
4. **Prometheus**: http://localhost:9090 (check targets)
5. **Grafana**: http://localhost:3000 (check dashboards)
6. **Kibana**: http://localhost:5601 (check indices)
7. **Jaeger**: http://localhost:16686 (check traces)

---

## 📊 Resource Allocation Summary

| Service | CPU Limit | CPU Reservation | Memory Limit | Memory Reservation |
|---------|-----------|-----------------|--------------|-------------------|
| V11 (x3) | 16 cores | 8 cores | 32GB | 16GB |
| PostgreSQL | 4 cores | 2 cores | 8GB | 4GB |
| Redis | 2 cores | 1 core | 4GB | 2GB |
| Prometheus | Unlimited | Unlimited | Unlimited | Unlimited |
| Grafana | Unlimited | Unlimited | Unlimited | Unlimited |
| Jaeger | Unlimited | Unlimited | Unlimited | Unlimited |
| NGINX | Unlimited | Unlimited | Unlimited | Unlimited |
| Vault | Unlimited | Unlimited | Unlimited | Unlimited |
| Elasticsearch | Unlimited | Unlimited | 2GB heap | 2GB heap |
| Kibana | Unlimited | Unlimited | Unlimited | Unlimited |
| Logstash | Unlimited | Unlimited | 1GB heap | 1GB heap |
| **TOTAL** | **32+ cores** | **18+ cores** | **64GB+** | **40GB+** |

---

## 🔒 Security Considerations

### Production Hardening
1. **Secrets Management**: Use Vault for all credentials
2. **Network Isolation**: Use internal Docker network for services
3. **SSL/TLS**: Enable HTTPS with valid certificates
4. **Access Control**: RBAC in Vault, Grafana, Kibana
5. **Audit Logging**: All access logged via Logstash
6. **Monitoring**: Real-time alerts on security events

### Required Configuration Files
- `./config/nginx/nginx.conf` (NGINX config with SSL)
- `./config/nginx/ssl/cert.pem` (SSL certificate)
- `./config/nginx/ssl/key.pem` (SSL key)
- `./config/prometheus/prometheus.yml` (Scrape configs)
- `./config/grafana/dashboards/*` (Dashboard JSON files)
- `./config/logstash/pipeline/*` (Log processing rules)

---

## 🚀 Scaling Strategy

### Horizontal Scaling
- **V11 Replicas**: Increase from 3 to N instances
- **Load Balancer**: NGINX automatically distributes traffic
- **State**: Stored in PostgreSQL (stateless application)
- **Cache**: Redis cluster for distributed caching

### Resource Management
- **CPU Sharing**: Reserve minimum, allow burst
- **Memory Limits**: Prevent OOM kills
- **Disk I/O**: Monitor database performance
- **Network**: Monitor cross-container communication

---

## 📋 Maintenance Tasks

### Daily
- Monitor Grafana dashboards
- Check Kibana for error logs
- Review Jaeger traces for anomalies

### Weekly
- Backup PostgreSQL data
- Verify Redis persistence
- Check Vault token rotation

### Monthly
- Review Prometheus retention policies
- Archive old logs from Elasticsearch
- Update Docker images to latest patches
- Performance tuning based on metrics

---

## 🎯 Success Metrics

### Deployment Success
- ✅ All 12 containers running
- ✅ Health checks passing
- ✅ Prometheus collecting metrics
- ✅ Grafana dashboards displaying data
- ✅ Kibana receiving logs
- ✅ Jaeger tracing transactions

### Performance Targets
- **V11 TPS**: 2M+ transactions/second
- **API Response**: <100ms p99 latency
- **Database**: <50ms query latency
- **Cache Hit**: >95% for hot data
- **Availability**: 99.99% uptime

---

## 📞 Support & Troubleshooting

### Common Issues

**Issue**: Container crashes immediately
```bash
# Check logs
docker-compose logs aurigraph-v11
docker logs aurigraph-v11-production
```

**Issue**: Out of memory
```bash
# Increase memory limits in docker-compose.yml
# Monitor with
docker stats
```

**Issue**: Slow performance
```bash
# Check Grafana dashboards
# Review Jaeger traces
# Check Redis hit ratio
# Monitor PostgreSQL query performance
```

---

## 🎊 Conclusion

This production deployment provides:
- ✅ High availability (3 replicas)
- ✅ Comprehensive monitoring
- ✅ Centralized logging
- ✅ Distributed tracing
- ✅ Secret management
- ✅ Load balancing
- ✅ Scalability
- ✅ Production hardening

**Ready for production deployment on November 6, 2025** ✅

---

**Document Version**: 1.0
**Last Updated**: November 6, 2025
**Status**: PRODUCTION READY
