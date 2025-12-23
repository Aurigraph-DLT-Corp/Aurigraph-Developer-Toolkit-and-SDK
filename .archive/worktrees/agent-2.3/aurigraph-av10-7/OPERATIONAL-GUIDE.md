# V11.4.4 Enhanced Backend - Operational Guide

**Version**: 11.4.4-Enhanced
**Date**: November 11, 2025
**Audience**: DevOps, SRE, Platform Engineers
**Status**: Production-Ready

---

## Table of Contents

1. [System Architecture](#system-architecture)
2. [Core Components](#core-components)
3. [Daily Operations](#daily-operations)
4. [Monitoring & Observability](#monitoring--observability)
5. [Maintenance Procedures](#maintenance-procedures)
6. [Disaster Recovery](#disaster-recovery)
7. [Performance Tuning](#performance-tuning)
8. [Security Operations](#security-operations)

---

## System Architecture

### High-Level Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    Client Applications                       │
│            (Mobile, Web, Enterprise Portal)                 │
└────────────────────┬────────────────────────────────────────┘
                     │
        ┌────────────┴────────────┐
        │                         │
        ▼                         ▼
    HTTPS/HTTP2              WSS (WebSocket)
        │                         │
┌───────▼─────────────────────────▼──────────┐
│         NGINX Reverse Proxy                 │
│  (TLS 1.3, Load Balancing, Rate Limiting)  │
└───────────┬──────────────────────┬──────────┘
            │                      │
      API Port 9003          WS Port 9003
            │                      │
┌───────────▼──────────────────────▼──────────────────────────┐
│  V11.4.4 Enhanced Backend (Quarkus + Java 21)              │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌─────────────────────────────────────────────────────┐   │
│  │         REST API Endpoints (7 Endpoints)            │   │
│  │  • GET  /api/v11/auth/tokens/active                │   │
│  │  • GET  /api/v11/auth/tokens/stats                 │   │
│  │  • GET  /api/v11/auth/tokens/{id}/details          │   │
│  │  • DELETE /api/v11/auth/tokens/{id}                │   │
│  │  • DELETE /api/v11/auth/tokens/all/{userId}        │   │
│  │  • GET  /api/v11/auth/tokens/audit/{userId}        │   │
│  │  • GET  /api/v11/auth/tokens/device/{ip}           │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                              │
│  ┌─────────────────────────────────────────────────────┐   │
│  │      WebSocket Endpoint (ws://localhost:9003/ws)    │   │
│  │  • Real-time token invalidation notifications       │   │
│  │  • Logout all devices broadcast                     │   │
│  │  • Token expiration alerts                          │   │
│  │  • Password change notifications                    │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                              │
│  ┌─────────────────────────────────────────────────────┐   │
│  │    Advanced Token Features Service                   │   │
│  │  • Token Scopes (10 permission levels)              │   │
│  │  • Blacklist Management (in-memory + persistent)    │   │
│  │  • Geo-Restrictions (country-based access)          │   │
│  │  • Device Fingerprinting (UA + IP validation)       │   │
│  │  • Rate Limiting (per-token request throttling)     │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                              │
│  ┌──────────────────────┐  ┌──────────────────────────┐    │
│  │  AuthTokenService    │  │  AuthTokenRepository     │    │
│  │  (Business Logic)    │  │  (Data Access)           │    │
│  └──────────────────────┘  └──────────────────────────┘    │
│           │                            │                    │
└───────────┼────────────────────────────┼──────────────────┘
            │                            │
            └────────────────┬───────────┘
                             │
                ┌────────────▼─────────────┐
                │   PostgreSQL Database    │
                │   (auth_tokens table)    │
                │   (auth_token_audit)     │
                │   (token_statistics)     │
                └──────────────────────────┘
```

### Technology Stack

| Component | Version | Role |
|-----------|---------|------|
| **Java** | 21+ | Runtime |
| **Quarkus** | 3.26.2 | Framework |
| **PostgreSQL** | 14+ | Database |
| **Jackson** | Latest | JSON Processing |
| **JUnit 5** | Latest | Testing |
| **Panache ORM** | 3.26.2 | Database Abstraction |

---

## Core Components

### 1. AuthToken Entity

**Purpose**: Represents stored JWT tokens in the database

**Key Fields**:
```java
String tokenId              // Unique identifier (UUID)
String userId               // User ID (foreign key)
String userEmail            // User email for audit
String tokenHash            // SHA-256 hash of token
TokenType tokenType         // ACCESS or REFRESH
TokenStatus status          // ACTIVE, EXPIRED, REVOKED
LocalDateTime expiresAt     // Expiration timestamp
LocalDateTime createdAt     // Creation timestamp
LocalDateTime lastUsedAt    // Last validated timestamp
String clientIp             // IP address that created token
String userAgent            // Browser/client identifier
boolean isRevoked           // Revocation flag
String revocationReason     // Why was token revoked
LocalDateTime revokedAt     // When token was revoked
String parentTokenId        // Refresh token parent (if applicable)
boolean isRefreshed         // Has token been refreshed
String refreshTokenId       // New token ID if refreshed
String metadata             // JSON metadata (scopes, geo, etc.)
```

**Database Constraints**:
- `token_hash` is UNIQUE and indexed
- `user_id` indexed with `status` for fast lookups
- `expires_at` indexed for cleanup operations
- Foreign key constraint on `user_id`

### 2. AuthTokenService

**Purpose**: Business logic for token lifecycle management

**Key Operations**:

| Operation | Method | Transactional | Async |
|-----------|--------|--------------|-------|
| Store token | `storeToken()` | Yes | Yes |
| Validate token | `validateToken()` | No | Yes |
| Get active tokens | `getActiveTokens()` | No | No |
| Revoke token | `revokeToken()` | Yes | No |
| Revoke all user tokens | `revokeAllTokensForUser()` | Yes | No |
| Cleanup expired | `cleanupExpiredTokens()` | Yes | No |

**Hashing Strategy**:
```java
MessageDigest.getInstance("SHA-256")
// 64-character hex string
// Never stores plaintext tokens
```

### 3. TokenManagementResource

**Purpose**: REST API endpoints for token management

**Endpoints** (7 total):

1. **GET /api/v11/auth/tokens/active**
   - List user's active tokens with pagination
   - Response: `ActiveTokensResponse` with pagination metadata

2. **GET /api/v11/auth/tokens/stats**
   - Token statistics (counts by type, status, device)
   - Response: `TokenStatisticsResponse`

3. **GET /api/v11/auth/tokens/{tokenId}/details**
   - Detailed information about specific token
   - Response: `TokenDetailResponse`

4. **DELETE /api/v11/auth/tokens/{tokenId}**
   - Revoke single token with optional reason
   - Response: `RevokeResponse`

5. **DELETE /api/v11/auth/tokens/all/{userId}**
   - Logout all devices (revoke all user tokens)
   - Response: `RevokeAllResponse` with count

6. **GET /api/v11/auth/tokens/audit/{userId}**
   - Audit trail of token operations
   - Response: `AuditTrailResponse` with paginated entries

7. **GET /api/v11/auth/tokens/device/{clientIp}**
   - Tokens created from specific IP address
   - Response: `DeviceTokensResponse`

### 4. TokenInvalidationWebSocket

**Purpose**: Real-time bidirectional communication for token events

**Connection**: `ws://localhost:9003/ws/tokens` or `wss://` for production

**Message Types**:

| Type | Direction | Payload | Use Case |
|------|-----------|---------|----------|
| SUBSCRIBE | Client→Server | userId, tokenId | Subscribe to notifications |
| SUBSCRIBED | Server→Client | Confirmation | Subscription confirmed |
| TOKEN_REVOKED | Server→Client | tokenId, userId, reason | Token was revoked |
| LOGOUT_ALL | Server→Client | userId, reason | All tokens revoked |
| TOKEN_EXPIRED | Server→Client | tokenId, userId | Token reached expiration |
| PASSWORD_CHANGED | Server→Client | userId | Password changed, re-auth required |
| PING | Client→Server | (empty) | Keep-alive |
| PONG | Server→Client | timestamp | Keep-alive response |
| ERROR | Server→Client | message | Error occurred |

### 5. AdvancedTokenFeatureService

**Purpose**: Advanced security features for token management

#### Token Scopes (10 Permission Levels)

```
READ_PROFILE        // Read user profile
READ_TOKENS         // List and view tokens
READ_TRANSACTIONS   // Read transactions
READ_ANALYTICS      // View analytics

WRITE_PROFILE       // Modify profile
WRITE_TRANSACTIONS  // Create transactions
WRITE_CONTRACTS     // Deploy contracts

ADMIN_TOKENS        // Manage all tokens
ADMIN_USERS         // Manage users
ADMIN_SYSTEM        // System administration
```

#### Blacklist (In-Memory + Optional Persistence)

```
Storage: ConcurrentHashMap<String, Instant>
Capacity: Unlimited (memory constrained)
Lookup: O(1) average case
Use: Immediate revocation without DB query
```

#### Rate Limiting

```
Window: 60 seconds (rolling)
Tracking: Per-token hash
Burst: Configurable per request type
Reset: Automatic after window expires
```

#### Geo-Restrictions

```
Allowed Regions: US, EU, ASIA, ALL
Format: Comma-separated country codes in metadata
Check: Performed before request processing
Bypass: Admin tokens (optional)
```

#### Device Fingerprinting

```
Components:
  - User-Agent string (strict match)
  - Client IP address (warning only)
  - Device fingerprint (hash of UA + UA length)

Behavior:
  - UA mismatch: BLOCK request
  - IP change: LOG warning (allow proxy changes)
  - Fingerprint: Optional enforcement
```

---

## Daily Operations

### Morning Startup Verification

```bash
#!/bin/bash
# /opt/aurigraph/v11/checks/startup-verification.sh

echo "=== V11 Backend Startup Verification ==="

# 1. Service status
echo "1. Checking service status..."
sudo systemctl is-active aurigraph-v11
if [ $? -ne 0 ]; then
    echo "ERROR: Service not running"
    exit 1
fi

# 2. Health endpoint
echo "2. Checking health endpoint..."
HEALTH=$(curl -s https://localhost:9003/api/v11/health -k)
echo "$HEALTH" | jq .
if ! echo "$HEALTH" | jq -e '.status == "UP"' > /dev/null; then
    echo "ERROR: Service health check failed"
    exit 1
fi

# 3. Database connectivity
echo "3. Checking database connectivity..."
psql -h localhost -U aurigraph -d aurigraph -c "SELECT COUNT(*) FROM auth_tokens;" > /dev/null
if [ $? -ne 0 ]; then
    echo "ERROR: Database connectivity failed"
    exit 1
fi

# 4. Error log check
echo "4. Checking error logs..."
ERROR_COUNT=$(sudo journalctl -u aurigraph-v11 --since "1 hour ago" | grep -c ERROR)
if [ $ERROR_COUNT -gt 10 ]; then
    echo "WARNING: Found $ERROR_COUNT errors in logs"
fi

echo "=== All checks passed ==="
```

### Hourly Metrics Snapshot

```bash
#!/bin/bash
# /opt/aurigraph/v11/checks/hourly-metrics.sh

# Capture metrics every hour
curl -s https://localhost:9003/q/metrics -k > /var/log/aurigraph/metrics_$(date +%Y%m%d_%H%M%S).json

# Key metrics to track
echo "=== Hourly Metrics Summary ==="
curl -s https://localhost:9003/q/metrics -k | grep -E "jvm_memory_used_bytes|http_requests_total" | head -10
```

### Shift Handover Report

```bash
#!/bin/bash
# Run at shift change (8 AM, 4 PM, 12 AM)

echo "=== V11 Backend Shift Handover Report ==="
echo "Time: $(date)"
echo ""

echo "1. Service Status:"
sudo systemctl status aurigraph-v11 | grep -E "Active|Uptime"

echo ""
echo "2. Recent Errors (last 8 hours):"
sudo journalctl -u aurigraph-v11 --since "8 hours ago" | grep ERROR | tail -5

echo ""
echo "3. Token Metrics:"
psql -h localhost -U aurigraph -d aurigraph -c "
SELECT
  COUNT(*) as total,
  SUM(CASE WHEN status = 'ACTIVE' THEN 1 ELSE 0 END) as active,
  SUM(CASE WHEN is_revoked THEN 1 ELSE 0 END) as revoked
FROM auth_tokens
WHERE created_at > NOW() - INTERVAL '8 hours';
"

echo ""
echo "4. Performance:"
tail -20 /var/log/aurigraph/performance.log

echo ""
echo "5. Action Items:"
# This should be populated by operations team
cat /var/log/aurigraph/handover-notes.txt 2>/dev/null || echo "None"

echo ""
echo "End of Handover Report"
```

---

## Monitoring & Observability

### Logging Strategy

**Log Levels**:
- **ERROR**: Service degradation, failures, exceptions
- **WARN**: Unusual conditions, rate limits exceeded
- **INFO**: Operational events, deployments, major operations
- **DEBUG**: Detailed flow information (dev/staging only)

**Log Destinations**:
```
/var/log/aurigraph/v11/
├── application.log          // Main application log
├── access.log              // HTTP access log
├── performance.log         // Performance metrics
├── security.log            // Security events
└── audit.log              // Audit trail
```

**Log Retention**:
- Daily rotation at midnight
- Gzip compression after 7 days
- Archive to S3 after 30 days
- Delete after 1 year

### Metrics Collection

**Prometheus Metrics** (exposed at `/q/metrics`):

```
# JVM Metrics
jvm_memory_used_bytes{area="heap"}
jvm_memory_committed_bytes
jvm_threads_live
jvm_gc_collection_seconds_count

# HTTP Metrics
http_requests_total{method, status}
http_request_duration_seconds{endpoint, method}
http_server_requests_seconds

# Application Metrics
auth_tokens_created_total
auth_tokens_revoked_total
auth_tokens_active_gauge
auth_blacklist_size_gauge
auth_rate_limit_hit_total
auth_websocket_connections_active
```

**Grafana Dashboards**:

1. **System Health**: Memory, CPU, Disk
2. **HTTP API**: Response times, error rates, throughput
3. **Token Management**: Active tokens, revocation rate, scope usage
4. **WebSocket**: Active connections, message rates
5. **Database**: Connection pool, query performance, size
6. **Security**: Rate limits, blacklist hits, anomalies

### Alert Rules

**Critical (Page immediately)**:
- Service down (5 min failure)
- Error rate > 5%
- Response time P99 > 5s
- Database connection pool exhausted

**High (Alert in 15 min)**:
- Error rate > 1%
- Response time P99 > 1s
- Memory usage > 80%
- Disk usage > 85%

**Medium (Alert in 1 hour)**:
- Blacklist size growing > 1000/hour
- Unused tokens accumulating
- Slow queries detected

---

## Maintenance Procedures

### Database Maintenance

#### Weekly: Analyze and Vacuum

```sql
-- Analyze query planner statistics
ANALYZE auth_tokens;
ANALYZE auth_token_audit;

-- Vacuum for cleanup
VACUUM ANALYZE auth_tokens;
VACUUM ANALYZE auth_token_audit;
```

#### Monthly: Reindex

```sql
-- Reindex all indexes on auth tables
REINDEX TABLE auth_tokens;
REINDEX TABLE auth_token_audit;
```

#### Quarterly: Full Maintenance

```sql
-- Full vacuum (requires exclusive lock)
VACUUM FULL auth_tokens;

-- Check table bloat
SELECT
  schemaname,
  tablename,
  ROUND(100 * (pg_total_relation_size(schemaname||'.'||tablename) - pg_relation_size(schemaname||'.'||tablename)) / pg_total_relation_size(schemaname||'.'||tablename)) AS percent_bloat
FROM pg_tables
WHERE tablename LIKE 'auth_%';
```

### Log Rotation

```bash
#!/bin/bash
# /etc/logrotate.d/aurigraph-v11

/var/log/aurigraph/v11/*.log {
  daily
  rotate 7
  compress
  delaycompress
  notifempty
  create 0640 aurigraph aurigraph
  sharedscripts
  postrotate
    systemctl reload aurigraph-v11 > /dev/null 2>&1 || true
  endscript
}
```

### Cache Cleanup

```bash
#!/bin/bash
# Clear token blacklist if it gets too large

BLACKLIST_SIZE=$(curl -s https://localhost:9003/api/v11/auth/tokens/blacklist/size \
  -H "Authorization: Bearer ${ADMIN_TOKEN}" \
  -k | jq .size)

if [ "$BLACKLIST_SIZE" -gt 100000 ]; then
  echo "Blacklist size: $BLACKLIST_SIZE - Cleaning up..."
  curl -s https://localhost:9003/api/v11/auth/tokens/blacklist/cleanup \
    -X POST \
    -H "Authorization: Bearer ${ADMIN_TOKEN}" \
    -k
fi
```

---

## Disaster Recovery

### Backup Strategy

**Frequency**:
- Continuous: Database transaction logs
- Hourly: Database full backup
- Daily: Application state snapshot
- Weekly: Full system backup

**Backup Commands**:

```bash
# Full database backup
pg_dump -h localhost -U aurigraph --format=plain aurigraph > backup_full_$(date +%Y%m%d_%H%M%S).sql

# Incremental backup (using WAL archiving)
pg_basebackup -h localhost -U aurigraph -D /backups/wal_archive -Ft -z

# Backup JAR and config
tar -czf aurigraph_v11_config_$(date +%Y%m%d).tar.gz /opt/aurigraph/v11/
```

**Backup Verification**:

```bash
# Test restore on staging
createdb test_aurigraph_restore
psql -d test_aurigraph_restore < backup.sql
psql -d test_aurigraph_restore -c "SELECT COUNT(*) FROM auth_tokens;"
dropdb test_aurigraph_restore
```

### Recovery Procedures

#### Scenario 1: Database Corruption

**Detection**:
```
ERROR: btree index is corrupted
ERROR: index is not valid
```

**Recovery**:
```bash
# 1. Stop service
sudo systemctl stop aurigraph-v11

# 2. Identify corrupted index
psql -d aurigraph -c "REINDEX INDEX idx_token_hash;"

# 3. If unsuccessful, drop and recreate
psql -d aurigraph -c "DROP INDEX IF EXISTS idx_token_hash;"
psql -d aurigraph -c "CREATE INDEX idx_token_hash ON auth_tokens(token_hash);"

# 4. Verify table integrity
psql -d aurigraph -c "SELECT count(*) FROM auth_tokens;"

# 5. Restart service
sudo systemctl start aurigraph-v11
```

#### Scenario 2: Accidental Token Deletion

**Recovery**:
```bash
# 1. Identify deletion time
SELECT * FROM auth_token_audit WHERE action = 'DELETE' ORDER BY timestamp DESC LIMIT 1;

# 2. Restore from WAL archive
pg_basebackup recovery with target time before deletion

# 3. Or from backup
psql -d aurigraph < backup_before_deletion.sql

# 4. Merge data
INSERT INTO auth_tokens SELECT * FROM recovered_tokens WHERE id NOT IN (SELECT id FROM auth_tokens);
```

#### Scenario 3: Service Complete Failure

**Recovery Steps**:

1. **Assess damage**:
   ```bash
   # Check logs
   sudo journalctl -u aurigraph-v11 --since "1 hour ago"

   # Check database
   psql -d aurigraph -c "SELECT COUNT(*) FROM auth_tokens;"

   # Check disk space
   df -h
   ```

2. **Attempt restart**:
   ```bash
   sudo systemctl restart aurigraph-v11
   sleep 10
   curl -s https://localhost:9003/api/v11/health -k | jq .
   ```

3. **If restart fails, rollback**:
   ```bash
   # Stop service
   sudo systemctl stop aurigraph-v11

   # Restore previous JAR
   mv /opt/aurigraph/v11/app.jar.backup /opt/aurigraph/v11/app.jar

   # Restore database from backup
   psql -d aurigraph < /backups/latest_backup.sql

   # Start service
   sudo systemctl start aurigraph-v11

   # Verify
   curl -s https://localhost:9003/api/v11/health -k | jq .
   ```

4. **Post-recovery**:
   - Document incident
   - Identify root cause
   - Implement preventive measures
   - Schedule post-mortem

---

## Performance Tuning

### JVM Tuning Parameters

```bash
# In systemd service file
ExecStart=/usr/bin/java \
  -Xms2g \                           # Initial heap size
  -Xmx4g \                           # Max heap size
  -XX:+UseG1GC \                     # G1 garbage collector
  -XX:MaxGCPauseMillis=100 \         # Target pause time
  -XX:+ParallelRefProcEnabled \      # Parallel GC references
  -XX:G1ReservePercent=10 \          # Reserve for mixed collections
  -XX:InitiatingHeapOccupancyPercent=35 \  # Start mixed collections
  /opt/aurigraph/v11/app.jar
```

### Database Tuning

```sql
-- Connection pooling (in application.properties)
quarkus.datasource.jdbc.max-size=20
quarkus.datasource.jdbc.min-size=5

-- Query optimization
CREATE INDEX idx_auth_tokens_compound ON auth_tokens(user_id, status, is_revoked);

-- Analyze regularly
ANALYZE auth_tokens;
```

### Nginx Tuning

```nginx
# /etc/nginx/nginx.conf

worker_processes auto;
worker_connections 2048;

keepalive_timeout 65;
client_max_body_size 10m;

# Gzip compression
gzip on;
gzip_min_length 1000;
gzip_types application/json application/javascript;
```

---

## Security Operations

### Credential Management

**Secret Rotation Schedule**:
- JWT secret: Every 90 days
- Database password: Every 180 days
- API keys: Quarterly
- SSL certificates: Auto-renewal via Let's Encrypt

**Secret Storage**:
```bash
# Use environment variables
export DB_PASSWORD=$(cat /etc/secrets/db-password)
export JWT_SECRET=$(cat /etc/secrets/jwt-secret)

# Or use secrets manager
vault kv get secret/aurigraph/v11/db-password
```

### Audit Trail Review

```bash
# Daily security audit
SELECT
  DATE_TRUNC('day', timestamp) as day,
  COUNT(*) as total_operations,
  COUNT(CASE WHEN action = 'REVOKE' THEN 1 END) as revocations,
  COUNT(CASE WHEN is_blacklisted THEN 1 END) as blacklisted
FROM auth_token_audit
WHERE timestamp > NOW() - INTERVAL '7 days'
GROUP BY DATE_TRUNC('day', timestamp)
ORDER BY day DESC;
```

### Threat Detection

```bash
# Detect brute force attempts
SELECT
  user_id,
  COUNT(*) as failed_attempts,
  MAX(timestamp) as latest_attempt
FROM auth_token_audit
WHERE
  action = 'VALIDATION_FAILED'
  AND timestamp > NOW() - INTERVAL '1 hour'
GROUP BY user_id
HAVING COUNT(*) > 10
ORDER BY failed_attempts DESC;

# Detect unusual token usage patterns
SELECT
  user_id,
  COUNT(DISTINCT client_ip) as unique_ips,
  COUNT(DISTINCT user_agent) as unique_agents,
  MAX(timestamp) as latest_activity
FROM auth_token_audit
WHERE timestamp > NOW() - INTERVAL '24 hours'
GROUP BY user_id
HAVING COUNT(DISTINCT client_ip) > 5  -- More than 5 different IPs in 24h
ORDER BY unique_ips DESC;
```

### Incident Response

**DDoS Attack Response**:
1. Check Nginx error rate
2. Enable rate limiting in NGINX
3. Block offending IPs
4. Escalate to ISP if needed

**Token Compromise Response**:
1. Immediately blacklist compromised token
2. Revoke all related tokens
3. Force password reset
4. Audit account activity
5. Notify user
6. Document incident

---

## Emergency Contacts

| Role | Contact | Hours |
|------|---------|-------|
| On-Call | PagerDuty | 24/7 |
| DevOps Lead | ops-team@aurigraph.io | 24/7 |
| Platform Lead | platform-team@aurigraph.io | Business |
| Database DBA | dba-team@aurigraph.io | Business |

---

**Document Version**: 1.0
**Last Updated**: November 11, 2025
**Next Review**: December 11, 2025

