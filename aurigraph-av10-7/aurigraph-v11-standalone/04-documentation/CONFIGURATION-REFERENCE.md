# Aurigraph V11 Configuration Reference

## Overview

This document provides a comprehensive reference for all configuration properties in Aurigraph V11. All properties can be set via environment variables, system properties, or configuration files.

---

## Table of Contents

1. [Server Configuration](#server-configuration)
2. [Security Configuration](#security-configuration)
3. [Database Configuration](#database-configuration)
4. [Consensus Configuration](#consensus-configuration)
5. [Oracle Verification](#oracle-verification)
6. [WebSocket Configuration](#websocket-configuration)
7. [AI Optimization](#ai-optimization)
8. [Monitoring & Observability](#monitoring--observability)
9. [Performance Tuning](#performance-tuning)
10. [Cryptography & HSM](#cryptography--hsm)

---

## Server Configuration

### HTTP Configuration

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `quarkus.http.port` | int | 9003 | HTTP server port |
| `quarkus.http.host` | string | 0.0.0.0 | HTTP server bind address |
| `quarkus.http.http2` | boolean | true | Enable HTTP/2 support |
| `quarkus.http.limits.max-connections` | int | 10000 | Maximum concurrent connections |
| `quarkus.http.limits.max-concurrent-streams` | int | 100000 | HTTP/2 max concurrent streams |
| `quarkus.http.limits.max-header-size` | int | 65536 | Maximum HTTP header size (bytes) |
| `quarkus.http.proxy.proxy-address-forwarding` | boolean | true | Trust X-Forwarded headers from proxy |

**Environment Variables:**
```bash
HTTP_PORT=9003
HTTP_HOST=0.0.0.0
MAX_CONNECTIONS=10000
```

**Production Recommendations:**
- Use reverse proxy (NGINX) for TLS termination
- Set `max-connections` based on expected load (10K-50K)
- Enable HTTP/2 for better performance
- Configure proper timeouts (idle: 300s, read: 60s)

---

## Security Configuration

### CORS Configuration

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `quarkus.http.cors` | boolean | true | Enable CORS |
| `quarkus.http.cors.origins` | string | - | Allowed origins (comma-separated) |
| `quarkus.http.cors.methods` | string | GET,POST,PUT,DELETE,OPTIONS | Allowed HTTP methods |
| `quarkus.http.cors.access-control-allow-credentials` | boolean | false | Allow credentials in CORS requests |

**Environment Variables:**
```bash
CORS_ORIGINS=https://dlt.aurigraph.io,https://api.aurigraph.io
```

**Production Recommendations:**
- Explicitly list allowed origins (no wildcards)
- Disable credentials unless required
- Use HTTPS-only origins

### JWT Configuration

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `mp.jwt.verify.publickey.location` | string | - | URL to fetch JWT public keys (JWKS) |
| `mp.jwt.verify.issuer` | string | - | Expected JWT issuer |

**Environment Variables:**
```bash
JWT_PUBLIC_KEY_URL=https://iam.aurigraph.io/realms/aurigraph/protocol/openid-connect/certs
JWT_ISSUER=https://iam.aurigraph.io/realms/aurigraph
```

### Security Headers

Default security headers are automatically applied:
- `X-Frame-Options: DENY`
- `X-Content-Type-Options: nosniff`
- `X-XSS-Protection: 1; mode=block`
- `Strict-Transport-Security: max-age=31536000; includeSubDomains`

---

## Database Configuration

### PostgreSQL Connection

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `quarkus.datasource.db-kind` | string | postgresql | Database type |
| `quarkus.datasource.username` | string | aurigraph | Database username |
| `quarkus.datasource.password` | string | - | Database password (EXTERNALIZE!) |
| `quarkus.datasource.jdbc.url` | string | - | JDBC connection URL |
| `quarkus.datasource.jdbc.max-size` | int | 100 | Connection pool max size |
| `quarkus.datasource.jdbc.min-size` | int | 10 | Connection pool min size |
| `quarkus.datasource.jdbc.acquisition-timeout` | int | 10 | Connection acquisition timeout (seconds) |

**Environment Variables:**
```bash
DB_USERNAME=aurigraph_prod
DB_PASSWORD=${VAULT:secret/database/aurigraph/password}
DB_URL=jdbc:postgresql://postgres-primary:5432/aurigraph_production
DB_POOL_MAX=100
DB_POOL_MIN=10
```

**Production Recommendations:**
- Use connection pooling (HikariCP automatically configured)
- Set pool size based on concurrent load: `max-size = (core_count * 2) + effective_spindle_count`
- Use read replicas for read-heavy workloads
- Enable SSL: `?sslmode=require&sslrootcert=/path/to/ca.crt`

### Flyway Migration

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `quarkus.flyway.migrate-at-start` | boolean | true | Run migrations on startup |
| `quarkus.flyway.baseline-on-migrate` | boolean | false | Baseline existing database |
| `quarkus.flyway.clean-disabled` | boolean | true | Disable flyway clean (PRODUCTION) |

---

## Consensus Configuration

### HyperRAFT++ Settings

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `consensus.node.id` | string | prod-node-1 | Unique identifier for this node |
| `consensus.validators` | string | - | Comma-separated list of validator node IDs |
| `consensus.election.timeout.ms` | int | 250 | Leader election timeout (milliseconds) |
| `consensus.heartbeat.interval.ms` | int | 25 | Heartbeat interval (milliseconds) |
| `consensus.batch.size` | int | 200000 | Transaction batch size |
| `consensus.pipeline.depth` | int | 100 | Consensus pipeline depth |
| `consensus.parallel.threads` | int | 1024 | Parallel processing threads |
| `consensus.target.tps` | int | 5000000 | Target transactions per second |

**Environment Variables:**
```bash
CONSENSUS_NODE_ID=prod-node-1
CONSENSUS_VALIDATORS=prod-node-1,prod-node-2,prod-node-3,prod-node-4,prod-node-5
CONSENSUS_BATCH_SIZE=200000
CONSENSUS_TARGET_TPS=5000000
```

**Tuning Guidelines:**
- **3-5 validators**: Optimal for production (f < n/3 fault tolerance)
- **Batch size**: Larger batches = higher throughput, higher latency
  - Development: 50K-100K
  - Production: 200K-500K
- **Heartbeat interval**: Lower = faster detection, higher network overhead
  - Development: 50ms
  - Production: 25ms
- **Pipeline depth**: Higher = more parallelism, more memory
  - Development: 50
  - Production: 100

---

## Oracle Verification

### Multi-Oracle Consensus

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `oracle.verification.min.consensus` | double | 0.67 | Minimum consensus threshold (0.0-1.0) |
| `oracle.verification.price.tolerance` | double | 0.05 | Price tolerance (5% = 0.05) |
| `oracle.verification.min.required` | int | 3 | Minimum oracles required for verification |
| `oracle.verification.timeout.seconds` | int | 7 | Oracle query timeout (seconds) |

**Environment Variables:**
```bash
ORACLE_MIN_CONSENSUS=0.67    # 67% consensus required
ORACLE_PRICE_TOLERANCE=0.05   # 5% price tolerance
ORACLE_MIN_REQUIRED=3         # 3-of-5 oracles minimum
ORACLE_TIMEOUT=7              # 7 second timeout
```

**Consensus Calculation:**
```
consensus = (agreeing_oracles / total_valid_oracles)
```

**Example:**
- 5 oracles queried
- 4 respond successfully
- 3 agree within 5% tolerance
- Consensus: 3/4 = 75% ✅ (exceeds 67% threshold)

---

## WebSocket Configuration

### Connection Management

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `websocket.queue.max.size` | int | 1000 | Max message queue size per connection |
| `websocket.processing.timeout.ms` | long | 5000 | Message processing timeout (ms) |
| `websocket.max.connections.per.endpoint` | int | 10000 | Max connections per WebSocket endpoint |
| `websocket.compression.enabled` | boolean | true | Enable message compression |
| `websocket.heartbeat.interval.seconds` | int | 30 | Heartbeat interval (seconds) |
| `websocket.target.latency.ms` | long | 100 | Target broadcast latency (ms) |

**Environment Variables:**
```bash
WEBSOCKET_QUEUE_SIZE=1000
WEBSOCKET_MAX_CONNECTIONS=10000
WEBSOCKET_TARGET_LATENCY=100
```

**Performance Recommendations:**
- Monitor broadcast latency (should stay <100ms P99)
- Scale horizontally if connection count >80% of max
- Use compression for bandwidth optimization
- Implement client-side reconnection logic

---

## AI Optimization

### Machine Learning Configuration

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `ai.optimization.enabled` | boolean | true | Enable AI optimization |
| `ai.optimization.learning.rate` | double | 0.00005 | ML learning rate |
| `ai.optimization.target.tps` | int | 10000000 | Target TPS for optimization |
| `ai.optimization.min.confidence` | double | 0.90 | Minimum confidence threshold |

**Environment Variables:**
```bash
AI_OPTIMIZATION_ENABLED=true
AI_LEARNING_RATE=0.00005
AI_TARGET_TPS=10000000
AI_MIN_CONFIDENCE=0.90
```

**Tuning Guidelines:**
- Lower learning rate = more stable, slower adaptation
- Higher learning rate = faster adaptation, potential instability
- Recommended: 0.00001 - 0.0001 range
- Monitor model performance metrics via `/q/metrics`

---

## Monitoring & Observability

### Logging Configuration

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `quarkus.log.level` | string | INFO | Global log level |
| `quarkus.log.category."io.aurigraph".level` | string | INFO | Aurigraph package log level |
| `quarkus.log.console.json` | boolean | true | JSON-formatted logs |
| `quarkus.log.file.enable` | boolean | false | Enable file logging |
| `quarkus.log.file.path` | string | - | Log file path |

**Environment Variables:**
```bash
LOG_FILE_ENABLED=false
LOG_FILE_PATH=/var/log/aurigraph/application.log
```

**Production Recommendations:**
- Use JSON logging for structured logs
- Send logs to centralized system (ELK, Splunk)
- Set appropriate log levels:
  - Production: INFO
  - Debug: DEBUG (temporarily for troubleshooting)
- Implement log rotation (external to application)

### Metrics (Prometheus)

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `quarkus.micrometer.enabled` | boolean | true | Enable Micrometer metrics |
| `quarkus.micrometer.export.prometheus.enabled` | boolean | true | Export Prometheus metrics |
| `quarkus.micrometer.export.prometheus.path` | string | /q/metrics | Metrics endpoint path |

**Key Business Metrics:**
- `oracle_verifications_total` - Total oracle verification requests
- `oracle_verifications_success` - Successful verifications
- `oracle_verification_duration` - Verification duration histogram
- `websocket_connections_total` - Total WebSocket connections
- `transactions_processed_total` - Total transactions processed

### Health Checks

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `quarkus.smallrye-health.root-path` | string | /q/health | Health check root path |
| `oracle.health.check.enabled` | boolean | true | Enable oracle health check |
| `websocket.health.check.enabled` | boolean | true | Enable WebSocket health check |

**Health Check Endpoints:**
- `/q/health` - Overall health status
- `/q/health/live` - Liveness probe (restart if unhealthy)
- `/q/health/ready` - Readiness probe (remove from load balancer if unhealthy)
- `/q/health/started` - Startup probe (wait for initialization)

---

## Performance Tuning

### Thread Configuration

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `quarkus.virtual-threads.enabled` | boolean | true | Enable Java 21 virtual threads |
| `quarkus.thread-pool.core-threads` | int | 1024 | Core thread pool size |
| `quarkus.thread-pool.max-threads` | int | 4096 | Maximum thread pool size |
| `quarkus.thread-pool.queue-size` | int | 500000 | Thread pool queue size |

**JVM System Properties (set via JAVA_OPTS):**
```bash
-Djdk.virtualThreadScheduler.parallelism=32
-Djdk.virtualThreadScheduler.maxPoolSize=32
```

### Memory Configuration

**JVM Heap (set via JAVA_OPTS):**
```bash
-Xms2G                  # Initial heap size
-Xmx2G                  # Maximum heap size
-XX:MaxRAM=2G           # Maximum RAM
```

**GC Configuration (G1GC):**
```bash
-XX:+UseG1GC
-XX:MaxGCPauseMillis=100
-XX:+ParallelRefProcEnabled
-XX:G1HeapRegionSize=16M
-XX:InitiatingHeapOccupancyPercent=45
```

---

## Cryptography & HSM

### Quantum Cryptography

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `aurigraph.crypto.kyber.security-level` | int | 5 | CRYSTALS-Kyber security level (3 or 5) |
| `aurigraph.crypto.dilithium.security-level` | int | 5 | CRYSTALS-Dilithium security level (3 or 5) |
| `aurigraph.crypto.quantum.enabled` | boolean | true | Enable quantum cryptography |

### HSM Integration

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `aurigraph.crypto.hsm.enabled` | boolean | true | Enable HSM integration |
| `aurigraph.crypto.hsm.provider` | string | PKCS11 | HSM provider type |
| `aurigraph.crypto.hsm.library.path` | string | - | Path to HSM library (.so file) |
| `aurigraph.crypto.hsm.slot` | int | 0 | HSM slot number |
| `aurigraph.crypto.hsm.pin` | string | - | HSM PIN (EXTERNALIZE!) |

**Environment Variables:**
```bash
HSM_ENABLED=true
HSM_LIBRARY_PATH=/usr/lib/softhsm/libsofthsm2.so
HSM_SLOT=0
HSM_PIN=${VAULT:secret/hsm/aurigraph/pin}
```

### Key Rotation

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `aurigraph.crypto.key.rotation.enabled` | boolean | true | Enable automatic key rotation |
| `aurigraph.crypto.key.rotation.interval.days` | int | 90 | Key rotation interval (days) |

**Production Recommendations:**
- Rotate keys every 90 days
- Use HSM for key storage in production
- Implement key backup procedures
- Test key rotation in staging first

---

## Configuration File Examples

### Development (`application-dev.properties`)

```properties
quarkus.http.port=9003
quarkus.log.level=DEBUG
quarkus.log.console.json=false

consensus.batch.size=50000
consensus.target.tps=1000000

oracle.verification.min.required=2
oracle.verification.timeout.seconds=3

ai.optimization.enabled=true
ai.optimization.target.tps=1000000
```

### Staging (`application-staging.properties`)

```properties
quarkus.http.port=9003
quarkus.log.level=INFO
quarkus.log.console.json=true

consensus.batch.size=100000
consensus.target.tps=3000000

oracle.verification.min.required=3
oracle.verification.timeout.seconds=5

ai.optimization.enabled=true
ai.optimization.target.tps=5000000
```

### Production (`application-prod.properties`)

```properties
quarkus.http.port=9003
quarkus.log.level=INFO
quarkus.log.console.json=true

consensus.batch.size=200000
consensus.target.tps=5000000

oracle.verification.min.required=3
oracle.verification.min.consensus=0.67
oracle.verification.timeout.seconds=7

ai.optimization.enabled=true
ai.optimization.target.tps=10000000

# All sensitive values via environment variables
quarkus.datasource.password=${DB_PASSWORD}
quarkus.redis.password=${REDIS_PASSWORD}
aurigraph.crypto.hsm.pin=${HSM_PIN}
```

---

## Best Practices

### 1. Secrets Management
- ✅ Use environment variables or secrets management (Vault, AWS Secrets Manager)
- ✅ Never commit credentials to version control
- ✅ Rotate credentials regularly (90-day policy)
- ❌ Don't hardcode passwords in configuration files

### 2. Environment-Specific Configuration
- ✅ Separate configuration files per environment
- ✅ Use profiles: `-Dquarkus.profile=prod`
- ✅ Override via environment variables in production
- ❌ Don't use development config in production

### 3. Performance Tuning
- ✅ Start with defaults, measure, then tune
- ✅ Load test before changing production settings
- ✅ Monitor metrics after every change
- ❌ Don't blindly increase all limits

### 4. Security
- ✅ Enable TLS in production (via reverse proxy)
- ✅ Use HSM for cryptographic keys
- ✅ Implement rate limiting and DDoS protection
- ✅ Regular security audits
- ❌ Don't expose internal endpoints publicly

---

## Related Documentation

- [Production Deployment Guide](PRODUCTION-DEPLOYMENT-GUIDE.md)
- [Monitoring Guide](MONITORING-GUIDE.md)
- [Troubleshooting Guide](TROUBLESHOOTING-GUIDE.md)
- [Security Best Practices](SECURITY-BEST-PRACTICES.md)

---

**Version:** 1.0
**Last Updated:** 2025-11-25
**Maintained by:** Aurigraph DevOps Team
