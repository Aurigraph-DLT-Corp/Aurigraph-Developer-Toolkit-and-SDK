# Operational Runbooks Master
**Version:** 1.0.0
**Last Updated:** November 12, 2025
**Status:** Production Ready
**Maintainer:** Aurigraph Operations Team

---

## Table of Contents

1. [Overview](#overview)
2. [Service Health Monitoring & Alerting](#service-health-monitoring--alerting)
3. [Database Performance Optimization](#database-performance-optimization)
4. [Log Analysis & Troubleshooting](#log-analysis--troubleshooting)
5. [Network Diagnosis](#network-diagnosis)
6. [Security Incident Response](#security-incident-response)
7. [Performance Tuning](#performance-tuning)
8. [Capacity Planning](#capacity-planning)
9. [Upgrade Procedures](#upgrade-procedures)
10. [Consensus System Operations](#consensus-system-operations)
11. [Cross-Chain Bridge Operations](#cross-chain-bridge-operations)
12. [AI/ML Service Management](#aiml-service-management)

---

## Overview

### Purpose
This master runbook provides detailed operational procedures for managing, troubleshooting, and maintaining the Aurigraph DLT platform (V11 Java/Quarkus architecture).

### Critical Services
- **V11 Platform Service** (Port 9003) - Core blockchain service
- **PostgreSQL Database** (Port 5432) - Metadata persistence
- **Redis Cache** (Port 6379) - High-performance caching
- **NGINX Gateway** (Ports 80/443) - API gateway and reverse proxy
- **Enterprise Portal** (Port 3000) - Management interface
- **Keycloak IAM** (Port 8180) - Identity management
- **Prometheus** (Port 9090) - Metrics collection
- **Grafana** (Port 3030) - Visualization
- **Consensus Service** - HyperRAFT++ consensus
- **Cross-Chain Bridge** - Multi-chain interoperability
- **AI Optimization Service** - ML-based performance tuning

### Service Dependencies
```
┌─────────────────────────────────────────┐
│         NGINX Gateway (443/80)          │
└─────────────┬───────────────────────────┘
              │
    ┌─────────┴─────────┬─────────────────┐
    │                   │                 │
    ▼                   ▼                 ▼
┌─────────┐      ┌───────────┐    ┌──────────┐
│   V11   │◄────►│PostgreSQL │    │  Portal  │
│Platform │      │    DB     │    │ (React)  │
│(9003)   │◄────►│  (5432)   │    │  (3000)  │
└────┬────┘      └───────────┘    └──────────┘
     │
     ├──────►┌──────────┐
     │       │  Redis   │
     │       │  (6379)  │
     │       └──────────┘
     │
     └──────►┌──────────┐
             │Keycloak  │
             │  (8180)  │
             └──────────┘
```

### Key Metrics & Thresholds
| Metric | Normal | Warning | Critical |
|--------|--------|---------|----------|
| TPS | 776K+ | <600K | <500K |
| API Latency (P99) | <150ms | 200-500ms | >500ms |
| CPU Usage | <70% | 70-85% | >85% |
| Memory Usage | <75% | 75-90% | >90% |
| Disk Usage | <70% | 70-85% | >85% |
| Error Rate | <0.1% | 0.1-1% | >1% |
| Database Connections | <80% | 80-90% | >90% |

---

## Service Health Monitoring & Alerting

### Runbook: Service Health Check Failure

#### Detection/Symptoms
- Health check endpoint returns non-200 status
- Liveness probe failures in Kubernetes
- PagerDuty alert: "Service Health Check Failed"
- Grafana dashboard shows service down

#### Root Cause Analysis Steps

**Step 1: Verify Service Status**
```bash
# Check V11 service health
curl -v https://dlt.aurigraph.io/api/v11/health
# Expected: HTTP 200 with JSON response

# Check detailed health
curl https://dlt.aurigraph.io/q/health/live
curl https://dlt.aurigraph.io/q/health/ready

# Check Kubernetes pod status
kubectl get pods -n aurigraph-production -l app=aurigraph-v11
# Expected: STATUS=Running, READY=1/1

# Check pod events
kubectl describe pod <pod-name> -n aurigraph-production
```

**Step 2: Check Service Logs**
```bash
# View recent logs
kubectl logs -n aurigraph-production deployment/aurigraph-v11 --tail=100

# Check for common errors
kubectl logs -n aurigraph-production deployment/aurigraph-v11 | grep -i "error\|exception\|fatal"

# Check startup logs
kubectl logs -n aurigraph-production <pod-name> --timestamps | head -50
```

**Step 3: Check Resource Constraints**
```bash
# Check CPU and memory usage
kubectl top pod -n aurigraph-production <pod-name>

# Check resource limits
kubectl describe pod -n aurigraph-production <pod-name> | grep -A5 "Limits\|Requests"

# Check disk usage
kubectl exec -n aurigraph-production <pod-name> -- df -h
```

**Step 4: Check Dependent Services**
```bash
# Check database connectivity
kubectl exec -n aurigraph-production <pod-name> -- nc -zv postgres-service 5432

# Check Redis connectivity
kubectl exec -n aurigraph-production <pod-name> -- nc -zv redis-service 6379

# Check Keycloak connectivity
kubectl exec -n aurigraph-production <pod-name> -- curl -s http://keycloak-service:8180/health
```

**Step 5: Check Network**
```bash
# Check service endpoints
kubectl get svc -n aurigraph-production

# Check ingress configuration
kubectl get ingress -n aurigraph-production

# Test internal connectivity
kubectl run -n aurigraph-production test-pod --image=busybox --restart=Never -- sleep 3600
kubectl exec -n aurigraph-production test-pod -- wget -O- http://aurigraph-v11-service:9003/q/health
```

#### Resolution Procedures

**Scenario 1: Service Not Starting**
```bash
# 1. Check application logs for startup errors
kubectl logs -n aurigraph-production <pod-name> | grep -i "failed to start\|exception"

# 2. Verify configuration
kubectl get configmap -n aurigraph-production aurigraph-v11-config -o yaml

# 3. Check secrets
kubectl get secret -n aurigraph-production aurigraph-v11-secret

# 4. Restart the pod
kubectl delete pod -n aurigraph-production <pod-name>
# Kubernetes will automatically recreate it

# 5. Monitor startup
kubectl logs -n aurigraph-production <new-pod-name> -f
```

**Scenario 2: Service OOMKilled (Out of Memory)**
```bash
# 1. Confirm OOM event
kubectl describe pod -n aurigraph-production <pod-name> | grep -i "oom\|killed"

# 2. Check memory usage trends in Grafana
# Navigate to: Grafana > Aurigraph Dashboard > Memory Usage

# 3. Increase memory limits temporarily
kubectl patch deployment -n aurigraph-production aurigraph-v11 \
  -p '{"spec":{"template":{"spec":{"containers":[{"name":"aurigraph-v11","resources":{"limits":{"memory":"1Gi"}}}]}}}}'

# 4. Restart deployment
kubectl rollout restart deployment/aurigraph-v11 -n aurigraph-production

# 5. Monitor memory consumption
kubectl top pod -n aurigraph-production -l app=aurigraph-v11 --watch
```

**Scenario 3: Database Connection Failure**
```bash
# 1. Verify database is running
kubectl get pods -n aurigraph-production -l app=postgres

# 2. Check database logs
kubectl logs -n aurigraph-production <postgres-pod-name> --tail=50

# 3. Test direct database connection
kubectl exec -n aurigraph-production <v11-pod-name> -- \
  psql -h postgres-service -U aurigraph -d aurigraph -c "SELECT 1;"

# 4. Check connection pool
# Access V11 metrics endpoint
curl https://dlt.aurigraph.io/q/metrics | grep "hikaricp_connections"

# 5. Restart V11 service if connection pool exhausted
kubectl rollout restart deployment/aurigraph-v11 -n aurigraph-production
```

**Scenario 4: High CPU Throttling**
```bash
# 1. Check CPU usage
kubectl top pod -n aurigraph-production <pod-name>

# 2. Check CPU throttling
kubectl exec -n aurigraph-production <pod-name> -- cat /sys/fs/cgroup/cpu/cpu.stat

# 3. Analyze thread dumps
kubectl exec -n aurigraph-production <pod-name> -- jcmd 1 Thread.print > thread_dump.txt

# 4. Increase CPU limits
kubectl patch deployment -n aurigraph-production aurigraph-v11 \
  -p '{"spec":{"template":{"spec":{"containers":[{"name":"aurigraph-v11","resources":{"limits":{"cpu":"4000m"}}}]}}}}'

# 5. Monitor CPU usage
kubectl top pod -n aurigraph-production -l app=aurigraph-v11 --watch
```

#### Verification/Testing
```bash
# 1. Verify health endpoints
curl -s https://dlt.aurigraph.io/q/health | jq '.status'
# Expected: "UP"

# 2. Test API functionality
curl -s https://dlt.aurigraph.io/api/v11/info | jq '.version'
# Expected: "11.x.x"

# 3. Check performance metrics
curl -s https://dlt.aurigraph.io/api/v11/stats | jq '.tps'
# Expected: >776000

# 4. Verify all pods are running
kubectl get pods -n aurigraph-production -l app=aurigraph-v11
# Expected: All pods Running with READY=1/1

# 5. Check error rate
kubectl logs -n aurigraph-production deployment/aurigraph-v11 --since=5m | grep -c "ERROR"
# Expected: 0 or very low
```

#### Rollback Procedures
```bash
# 1. Check deployment history
kubectl rollout history deployment/aurigraph-v11 -n aurigraph-production

# 2. Rollback to previous version
kubectl rollout undo deployment/aurigraph-v11 -n aurigraph-production

# 3. Rollback to specific revision
kubectl rollout undo deployment/aurigraph-v11 -n aurigraph-production --to-revision=<revision-number>

# 4. Monitor rollback progress
kubectl rollout status deployment/aurigraph-v11 -n aurigraph-production

# 5. Verify rollback
curl -s https://dlt.aurigraph.io/api/v11/info | jq '.version'
```

#### Post-Incident Actions
1. **Document the incident** in incident tracking system (e.g., JIRA)
2. **Update monitoring alerts** if false positive or threshold needs adjustment
3. **Schedule post-mortem** within 48 hours
4. **Create follow-up tasks** for root cause fixes
5. **Update this runbook** with new learnings
6. **Notify stakeholders** of resolution and preventive measures

---

## Database Performance Optimization

### Runbook: Database Slow Queries

#### Detection/Symptoms
- API response time > 500ms
- Database CPU usage > 80%
- Alert: "PostgreSQL slow query detected"
- Connection pool exhaustion
- Grafana dashboard shows query latency spike

#### Root Cause Analysis Steps

**Step 1: Identify Slow Queries**
```bash
# Connect to PostgreSQL
kubectl exec -it -n aurigraph-production <postgres-pod-name> -- psql -U aurigraph -d aurigraph

# List currently running queries
SELECT pid, now() - pg_stat_activity.query_start AS duration, query, state
FROM pg_stat_activity
WHERE (now() - pg_stat_activity.query_start) > interval '5 seconds'
  AND state != 'idle'
ORDER BY duration DESC;

# Check slow query log
kubectl exec -n aurigraph-production <postgres-pod-name> -- \
  tail -100 /var/lib/postgresql/data/log/postgresql-*.log | grep "duration"

# Get query statistics
SELECT query, calls, total_exec_time, mean_exec_time, max_exec_time
FROM pg_stat_statements
ORDER BY mean_exec_time DESC
LIMIT 20;
```

**Step 2: Analyze Query Plans**
```sql
-- Enable timing
\timing on

-- Analyze specific slow query
EXPLAIN (ANALYZE, BUFFERS, VERBOSE)
SELECT * FROM transactions WHERE block_height > 1000000;

-- Check index usage
SELECT schemaname, tablename, indexname, idx_scan, idx_tup_read, idx_tup_fetch
FROM pg_stat_user_indexes
WHERE idx_scan = 0
ORDER BY schemaname, tablename;

-- Check table statistics
SELECT schemaname, tablename, n_tup_ins, n_tup_upd, n_tup_del, n_live_tup, n_dead_tup, last_vacuum, last_autovacuum
FROM pg_stat_user_tables
ORDER BY n_live_tup DESC;
```

**Step 3: Check Database Resources**
```bash
# Check database connections
kubectl exec -n aurigraph-production <postgres-pod-name> -- psql -U aurigraph -c \
  "SELECT count(*) as connection_count, state FROM pg_stat_activity GROUP BY state;"

# Check cache hit ratio
kubectl exec -n aurigraph-production <postgres-pod-name> -- psql -U aurigraph -d aurigraph -c \
  "SELECT sum(heap_blks_read) as heap_read, sum(heap_blks_hit) as heap_hit,
   sum(heap_blks_hit) / (sum(heap_blks_hit) + sum(heap_blks_read)) as ratio
   FROM pg_statio_user_tables;"

# Check for lock contention
kubectl exec -n aurigraph-production <postgres-pod-name> -- psql -U aurigraph -d aurigraph -c \
  "SELECT relation::regclass, mode, granted, pid FROM pg_locks WHERE NOT granted;"

# Check table bloat
kubectl exec -n aurigraph-production <postgres-pod-name> -- psql -U aurigraph -d aurigraph -c \
  "SELECT tablename, pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
   FROM pg_tables WHERE schemaname = 'public' ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC LIMIT 10;"
```

**Step 4: Check System Resources**
```bash
# Check database pod resources
kubectl top pod -n aurigraph-production <postgres-pod-name>

# Check disk I/O
kubectl exec -n aurigraph-production <postgres-pod-name> -- iostat -x 2 5

# Check memory usage
kubectl exec -n aurigraph-production <postgres-pod-name> -- free -h

# Check disk usage
kubectl exec -n aurigraph-production <postgres-pod-name> -- df -h /var/lib/postgresql/data
```

#### Resolution Procedures

**Scenario 1: Missing Indexes**
```sql
-- Create missing indexes based on EXPLAIN ANALYZE
-- Example: Add index on frequently queried column
CREATE INDEX CONCURRENTLY idx_transactions_block_height
ON transactions(block_height);

-- Create composite index for multi-column queries
CREATE INDEX CONCURRENTLY idx_transactions_composite
ON transactions(block_height, timestamp);

-- Verify index creation
\d+ transactions

-- Analyze table to update statistics
ANALYZE transactions;
```

**Scenario 2: Lock Contention**
```sql
-- Identify blocking queries
SELECT blocked_locks.pid AS blocked_pid,
       blocked_activity.usename AS blocked_user,
       blocking_locks.pid AS blocking_pid,
       blocking_activity.usename AS blocking_user,
       blocked_activity.query AS blocked_statement,
       blocking_activity.query AS blocking_statement
FROM pg_catalog.pg_locks blocked_locks
JOIN pg_catalog.pg_stat_activity blocked_activity ON blocked_activity.pid = blocked_locks.pid
JOIN pg_catalog.pg_locks blocking_locks
    ON blocking_locks.locktype = blocked_locks.locktype
    AND blocking_locks.relation IS NOT DISTINCT FROM blocked_locks.relation
    AND blocking_locks.page IS NOT DISTINCT FROM blocked_locks.page
    AND blocking_locks.tuple IS NOT DISTINCT FROM blocked_locks.tuple
    AND blocking_locks.virtualxid IS NOT DISTINCT FROM blocked_locks.virtualxid
    AND blocking_locks.transactionid IS NOT DISTINCT FROM blocked_locks.transactionid
    AND blocking_locks.classid IS NOT DISTINCT FROM blocked_locks.classid
    AND blocking_locks.objid IS NOT DISTINCT FROM blocked_locks.objid
    AND blocking_locks.objsubid IS NOT DISTINCT FROM blocked_locks.objsubid
    AND blocking_locks.pid != blocked_locks.pid
JOIN pg_catalog.pg_stat_activity blocking_activity ON blocking_activity.pid = blocking_locks.pid
WHERE NOT blocked_locks.granted;

-- Terminate blocking query (use with caution)
SELECT pg_terminate_backend(<blocking_pid>);
```

**Scenario 3: Table Bloat / Dead Tuples**
```sql
-- Check dead tuples
SELECT schemaname, tablename, n_dead_tup, n_live_tup,
       round(n_dead_tup::numeric / NULLIF(n_live_tup, 0) * 100, 2) AS dead_pct
FROM pg_stat_user_tables
WHERE n_dead_tup > 1000
ORDER BY n_dead_tup DESC;

-- Manual vacuum (if autovacuum is not keeping up)
VACUUM ANALYZE transactions;

-- Full vacuum (locks table, use during maintenance window)
VACUUM FULL transactions;

-- Update autovacuum settings (requires restart)
ALTER TABLE transactions SET (autovacuum_vacuum_scale_factor = 0.05);
ALTER TABLE transactions SET (autovacuum_analyze_scale_factor = 0.02);
```

**Scenario 4: Connection Pool Exhaustion**
```bash
# Check current connections
kubectl exec -n aurigraph-production <postgres-pod-name> -- psql -U aurigraph -c \
  "SELECT count(*), state FROM pg_stat_activity GROUP BY state;"

# Kill idle connections
kubectl exec -n aurigraph-production <postgres-pod-name> -- psql -U aurigraph -c \
  "SELECT pg_terminate_backend(pid) FROM pg_stat_activity
   WHERE state = 'idle' AND query_start < now() - interval '10 minutes';"

# Increase max_connections (requires restart)
kubectl exec -n aurigraph-production <postgres-pod-name> -- \
  sed -i 's/max_connections = 100/max_connections = 200/' /var/lib/postgresql/data/postgresql.conf

# Restart PostgreSQL
kubectl rollout restart statefulset/postgres -n aurigraph-production
```

**Scenario 5: Query Optimization**
```sql
-- Rewrite inefficient query
-- BEFORE (sequential scan):
SELECT * FROM transactions WHERE amount > 1000 ORDER BY timestamp DESC LIMIT 100;

-- AFTER (index scan with covering index):
CREATE INDEX idx_transactions_amount_timestamp ON transactions(amount, timestamp DESC);
SELECT id, amount, timestamp FROM transactions WHERE amount > 1000 ORDER BY timestamp DESC LIMIT 100;

-- Use prepared statements to reduce parsing overhead
PREPARE get_recent_txs (bigint) AS
  SELECT * FROM transactions WHERE block_height > $1 ORDER BY timestamp DESC LIMIT 100;
EXECUTE get_recent_txs(1000000);
```

#### Verification/Testing
```bash
# 1. Verify query performance
kubectl exec -n aurigraph-production <postgres-pod-name> -- psql -U aurigraph -d aurigraph -c \
  "\timing on" -c "SELECT * FROM transactions WHERE block_height > 1000000 LIMIT 100;"
# Expected: Time < 100ms

# 2. Check connection count
kubectl exec -n aurigraph-production <postgres-pod-name> -- psql -U aurigraph -c \
  "SELECT count(*) FROM pg_stat_activity WHERE state = 'active';"
# Expected: < 80% of max_connections

# 3. Verify API response time
curl -w "\nTime: %{time_total}s\n" https://dlt.aurigraph.io/api/v11/blockchain/transactions?limit=10
# Expected: < 200ms

# 4. Check database CPU
kubectl top pod -n aurigraph-production <postgres-pod-name>
# Expected: CPU < 70%
```

#### Rollback Procedures
```sql
-- Rollback index creation
DROP INDEX CONCURRENTLY IF EXISTS idx_transactions_block_height;

-- Revert configuration changes
ALTER TABLE transactions RESET (autovacuum_vacuum_scale_factor);
ALTER TABLE transactions RESET (autovacuum_analyze_scale_factor);

-- Restore from backup if major issues
-- See "Backup & Recovery" section for restore procedures
```

#### Post-Incident Actions
1. **Analyze query patterns** in application code
2. **Update query optimization guidelines** for developers
3. **Schedule database maintenance window** for VACUUM FULL if needed
4. **Review connection pool configuration** in application
5. **Set up proactive monitoring** for slow queries
6. **Document query optimization patterns**

---

## Log Analysis & Troubleshooting

### Runbook: High Error Rate in Logs

#### Detection/Symptoms
- Alert: "Error rate > 1% for 5 minutes"
- Kibana dashboard shows spike in ERROR level logs
- Users reporting intermittent failures
- Increased 5xx HTTP responses

#### Root Cause Analysis Steps

**Step 1: Identify Error Patterns**
```bash
# Check recent errors in V11 service
kubectl logs -n aurigraph-production deployment/aurigraph-v11 --since=15m | grep ERROR

# Count error types
kubectl logs -n aurigraph-production deployment/aurigraph-v11 --since=1h | \
  grep ERROR | awk '{print $5}' | sort | uniq -c | sort -rn

# Check for specific exception types
kubectl logs -n aurigraph-production deployment/aurigraph-v11 --since=15m | \
  grep -i "NullPointerException\|OutOfMemoryError\|TimeoutException\|SQLException"

# View full stack traces
kubectl logs -n aurigraph-production deployment/aurigraph-v11 --since=15m | \
  grep -A 20 "Exception"
```

**Step 2: Analyze Error Context**
```bash
# Search for errors with context (5 lines before and after)
kubectl logs -n aurigraph-production deployment/aurigraph-v11 --since=30m | \
  grep -B 5 -A 5 "ERROR"

# Check correlation with specific API endpoints
kubectl logs -n aurigraph-production deployment/aurigraph-v11 --since=30m | \
  grep "ERROR" | grep -o "path=[^ ]*" | sort | uniq -c | sort -rn

# Check error rate over time
for i in {10..0}; do
  echo "$(date -d "$i minutes ago" '+%H:%M'): $(kubectl logs -n aurigraph-production deployment/aurigraph-v11 --since=$(($i+1))m --until=${i}m 2>/dev/null | grep -c ERROR) errors"
done

# Check if errors correlate with deployments
kubectl rollout history deployment/aurigraph-v11 -n aurigraph-production
```

**Step 3: Check Application Metrics**
```bash
# Check error metrics in Prometheus
curl -s 'http://prometheus:9090/api/v1/query?query=rate(http_server_requests_total{status=~"5.."}[5m])' | jq

# Check JVM metrics
curl https://dlt.aurigraph.io/q/metrics | grep -E "jvm_memory|jvm_threads|jvm_gc"

# Check application-specific metrics
curl https://dlt.aurigraph.io/q/metrics | grep "aurigraph" | grep "error"
```

**Step 4: Check System-Level Issues**
```bash
# Check for disk space issues
kubectl exec -n aurigraph-production <pod-name> -- df -h

# Check for file descriptor exhaustion
kubectl exec -n aurigraph-production <pod-name> -- ls -la /proc/self/fd | wc -l

# Check for network issues
kubectl exec -n aurigraph-production <pod-name> -- netstat -ant | grep TIME_WAIT | wc -l

# Check system logs
kubectl exec -n aurigraph-production <pod-name> -- dmesg | tail -50
```

#### Resolution Procedures

**Scenario 1: NullPointerException (NPE)**
```bash
# 1. Identify the exact location
kubectl logs -n aurigraph-production deployment/aurigraph-v11 --since=15m | \
  grep -A 10 "NullPointerException" | grep "at io.aurigraph"

# 2. Check if related to specific user input
kubectl logs -n aurigraph-production deployment/aurigraph-v11 --since=15m | \
  grep -B 5 "NullPointerException"

# 3. If critical, deploy hotfix with null checks
# See "Upgrade Procedures" section for deployment process

# 4. As temporary workaround, add input validation at gateway level
kubectl edit configmap -n aurigraph-production nginx-config
# Add validation rules in NGINX
```

**Scenario 2: Database Connection Timeout**
```bash
# 1. Check database availability
kubectl get pods -n aurigraph-production -l app=postgres

# 2. Check connection pool metrics
curl https://dlt.aurigraph.io/q/metrics | grep hikaricp

# 3. Increase connection timeout temporarily
kubectl set env deployment/aurigraph-v11 -n aurigraph-production \
  QUARKUS_DATASOURCE_JDBC_MAX_LIFETIME=30000

# 4. Scale database replicas if needed
kubectl scale statefulset postgres -n aurigraph-production --replicas=3

# 5. Restart application
kubectl rollout restart deployment/aurigraph-v11 -n aurigraph-production
```

**Scenario 3: Out of Memory (OOM)**
```bash
# 1. Verify OOM occurred
kubectl describe pod -n aurigraph-production <pod-name> | grep -i "oom"

# 2. Check heap dump (if configured)
kubectl exec -n aurigraph-production <pod-name> -- ls -lh /tmp/*.hprof

# 3. Copy heap dump for analysis
kubectl cp aurigraph-production/<pod-name>:/tmp/heap-dump.hprof ./heap-dump.hprof

# 4. Increase memory limits
kubectl patch deployment -n aurigraph-production aurigraph-v11 \
  -p '{"spec":{"template":{"spec":{"containers":[{"name":"aurigraph-v11","resources":{"limits":{"memory":"2Gi"}}}]}}}}'

# 5. Analyze memory leak with VisualVM or Eclipse MAT
# Open heap-dump.hprof in MAT to identify leak
```

**Scenario 4: API Rate Limit Exceeded**
```bash
# 1. Identify source of excessive requests
kubectl logs -n aurigraph-production deployment/aurigraph-v11 --since=15m | \
  grep "Rate limit exceeded" | awk '{print $10}' | sort | uniq -c | sort -rn

# 2. Check if legitimate traffic spike or attack
curl https://dlt.aurigraph.io/q/metrics | grep "http_server_requests_total" | grep "/api/v11"

# 3. Block abusive IPs at NGINX level
kubectl exec -n aurigraph-production nginx-gateway-pod -- \
  echo "deny <abusive-ip>;" >> /etc/nginx/conf.d/blacklist.conf
kubectl exec -n aurigraph-production nginx-gateway-pod -- nginx -s reload

# 4. Increase rate limits temporarily if legitimate spike
kubectl set env deployment/aurigraph-v11 -n aurigraph-production \
  RATE_LIMIT_PER_MINUTE=2000
```

**Scenario 5: Third-Party Service Failure**
```bash
# 1. Identify which external service is failing
kubectl logs -n aurigraph-production deployment/aurigraph-v11 --since=15m | \
  grep -i "connection refused\|timeout" | grep -o "https://[^ ]*" | sort | uniq -c

# 2. Check service availability
kubectl exec -n aurigraph-production <pod-name> -- curl -I <external-service-url>

# 3. Enable circuit breaker (if not already)
kubectl set env deployment/aurigraph-v11 -n aurigraph-production \
  CIRCUIT_BREAKER_ENABLED=true

# 4. Use fallback mechanisms
# Update application config to use cached data or secondary service

# 5. Contact external service provider if issue persists
```

#### Verification/Testing
```bash
# 1. Check error rate has decreased
kubectl logs -n aurigraph-production deployment/aurigraph-v11 --since=5m | grep -c ERROR
# Expected: < 10 errors per minute

# 2. Verify API health
for i in {1..10}; do curl -s -o /dev/null -w "%{http_code}\n" https://dlt.aurigraph.io/api/v11/health; sleep 1; done
# Expected: All 200 responses

# 3. Check Prometheus error rate metric
curl -s 'http://prometheus:9090/api/v1/query?query=rate(http_server_requests_total{status=~"5.."}[5m])' | \
  jq '.data.result[0].value[1]'
# Expected: < 0.001 (0.1%)

# 4. Verify no new errors in last 5 minutes
kubectl logs -n aurigraph-production deployment/aurigraph-v11 --since=5m | grep ERROR | wc -l
# Expected: 0
```

#### Rollback Procedures
```bash
# 1. If configuration change caused issue, revert
kubectl rollout undo deployment/aurigraph-v11 -n aurigraph-production

# 2. If environment variable change, reset
kubectl set env deployment/aurigraph-v11 -n aurigraph-production \
  <ENV_VAR>-  # Remove env var

# 3. Monitor rollback
kubectl rollout status deployment/aurigraph-v11 -n aurigraph-production

# 4. Verify error rate decreased
kubectl logs -n aurigraph-production deployment/aurigraph-v11 --since=5m | grep -c ERROR
```

#### Post-Incident Actions
1. **Create detailed error analysis report** with trends and patterns
2. **Update error handling** in application code
3. **Enhance logging** to capture more context for future debugging
4. **Set up alerts** for specific error patterns
5. **Create or update unit tests** to prevent regression
6. **Document workarounds** in knowledge base
7. **Schedule code review** for affected components

---

## Network Diagnosis

### Runbook: Network Connectivity Issues

#### Detection/Symptoms
- Services unable to communicate
- Increased timeout errors
- Alert: "Network latency > 100ms"
- Users reporting intermittent connection failures
- High packet loss or retransmissions

#### Root Cause Analysis Steps

**Step 1: Verify Service Connectivity**
```bash
# Test external connectivity from pod
kubectl exec -n aurigraph-production <pod-name> -- curl -I https://dlt.aurigraph.io
kubectl exec -n aurigraph-production <pod-name> -- curl -I https://google.com

# Test internal service connectivity
kubectl exec -n aurigraph-production <pod-name> -- nc -zv postgres-service 5432
kubectl exec -n aurigraph-production <pod-name> -- nc -zv redis-service 6379
kubectl exec -n aurigraph-production <pod-name> -- curl http://aurigraph-v11-service:9003/q/health

# Check DNS resolution
kubectl exec -n aurigraph-production <pod-name> -- nslookup postgres-service
kubectl exec -n aurigraph-production <pod-name> -- nslookup dlt.aurigraph.io

# Test latency
kubectl exec -n aurigraph-production <pod-name> -- ping -c 5 postgres-service
```

**Step 2: Check Network Configuration**
```bash
# Check service endpoints
kubectl get svc -n aurigraph-production
kubectl describe svc aurigraph-v11-service -n aurigraph-production

# Check ingress configuration
kubectl get ingress -n aurigraph-production
kubectl describe ingress aurigraph-ingress -n aurigraph-production

# Check network policies
kubectl get networkpolicy -n aurigraph-production
kubectl describe networkpolicy -n aurigraph-production

# Check pod IP addresses
kubectl get pods -n aurigraph-production -o wide
```

**Step 3: Analyze Network Traffic**
```bash
# Capture network traffic (requires tcpdump)
kubectl exec -n aurigraph-production <pod-name> -- tcpdump -i any -nn -c 100 port 9003

# Check connection states
kubectl exec -n aurigraph-production <pod-name> -- netstat -ant | grep ESTABLISHED | wc -l
kubectl exec -n aurigraph-production <pod-name> -- netstat -ant | grep TIME_WAIT | wc -l

# Check for packet drops
kubectl exec -n aurigraph-production <pod-name> -- netstat -s | grep -i drop

# Check network interface statistics
kubectl exec -n aurigraph-production <pod-name> -- ip -s link
```

**Step 4: Check Load Balancer & Ingress**
```bash
# Check NGINX gateway logs
kubectl logs -n aurigraph-production <nginx-pod-name> --tail=100

# Check NGINX configuration
kubectl exec -n aurigraph-production <nginx-pod-name> -- nginx -T

# Test load balancer health
curl -v https://dlt.aurigraph.io

# Check SSL/TLS certificate
echo | openssl s_client -connect dlt.aurigraph.io:443 -servername dlt.aurigraph.io 2>/dev/null | \
  openssl x509 -noout -dates
```

**Step 5: Check Cloud Network (if applicable)**
```bash
# AWS - Check security groups
aws ec2 describe-security-groups --group-ids <sg-id>

# AWS - Check network ACLs
aws ec2 describe-network-acls --network-acl-ids <acl-id>

# Check routing tables
kubectl get nodes -o wide
```

#### Resolution Procedures

**Scenario 1: DNS Resolution Failure**
```bash
# 1. Check CoreDNS/kube-dns
kubectl get pods -n kube-system -l k8s-app=kube-dns

# 2. Check CoreDNS logs
kubectl logs -n kube-system -l k8s-app=kube-dns --tail=50

# 3. Restart CoreDNS
kubectl rollout restart deployment/coredns -n kube-system

# 4. Verify DNS resolution
kubectl exec -n aurigraph-production <pod-name> -- nslookup kubernetes.default

# 5. Check DNS configuration in pod
kubectl exec -n aurigraph-production <pod-name> -- cat /etc/resolv.conf
```

**Scenario 2: Service Endpoint Not Found**
```bash
# 1. Verify service exists
kubectl get svc -n aurigraph-production aurigraph-v11-service

# 2. Check service selector matches pod labels
kubectl get svc -n aurigraph-production aurigraph-v11-service -o yaml | grep selector
kubectl get pods -n aurigraph-production -l app=aurigraph-v11 --show-labels

# 3. Check endpoints
kubectl get endpoints -n aurigraph-production aurigraph-v11-service

# 4. If endpoints are empty, check pod readiness
kubectl get pods -n aurigraph-production -l app=aurigraph-v11

# 5. Fix selector mismatch if found
kubectl patch svc aurigraph-v11-service -n aurigraph-production \
  -p '{"spec":{"selector":{"app":"aurigraph-v11"}}}'
```

**Scenario 3: Network Policy Blocking Traffic**
```bash
# 1. List network policies
kubectl get networkpolicy -n aurigraph-production

# 2. Temporarily remove network policies to test
kubectl delete networkpolicy <policy-name> -n aurigraph-production

# 3. Test connectivity
kubectl exec -n aurigraph-production <pod-name> -- curl http://postgres-service:5432

# 4. If connectivity restored, fix network policy
kubectl apply -f - <<EOF
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: allow-v11-to-postgres
  namespace: aurigraph-production
spec:
  podSelector:
    matchLabels:
      app: postgres
  ingress:
  - from:
    - podSelector:
        matchLabels:
          app: aurigraph-v11
    ports:
    - protocol: TCP
      port: 5432
EOF

# 5. Verify connectivity
kubectl exec -n aurigraph-production <pod-name> -- nc -zv postgres-service 5432
```

**Scenario 4: SSL/TLS Certificate Issues**
```bash
# 1. Check certificate expiration
kubectl get secret -n aurigraph-production tls-cert -o jsonpath='{.data.tls\.crt}' | \
  base64 -d | openssl x509 -noout -dates

# 2. Renew certificate if expired
# Using cert-manager
kubectl get certificate -n aurigraph-production
kubectl delete certificate tls-cert -n aurigraph-production
# cert-manager will auto-renew

# 3. Manually update certificate (if not using cert-manager)
kubectl create secret tls tls-cert -n aurigraph-production \
  --cert=path/to/tls.crt --key=path/to/tls.key --dry-run=client -o yaml | \
  kubectl apply -f -

# 4. Restart NGINX to pick up new certificate
kubectl rollout restart deployment/nginx-gateway -n aurigraph-production

# 5. Verify certificate
echo | openssl s_client -connect dlt.aurigraph.io:443 -servername dlt.aurigraph.io 2>/dev/null | \
  openssl x509 -noout -text | grep -A2 "Validity"
```

**Scenario 5: High Latency / Packet Loss**
```bash
# 1. Check network latency between nodes
kubectl get nodes -o wide
# SSH to nodes and run: mtr <other-node-ip>

# 2. Check for resource constraints
kubectl top nodes
kubectl top pods -n aurigraph-production

# 3. Check cloud provider network status
# AWS CloudWatch, Azure Monitor, or GCP Monitoring

# 4. Increase timeout values temporarily
kubectl set env deployment/aurigraph-v11 -n aurigraph-production \
  HTTP_CLIENT_TIMEOUT=30000 \
  DB_CONNECTION_TIMEOUT=10000

# 5. Enable network optimizations
kubectl set env deployment/aurigraph-v11 -n aurigraph-production \
  QUARKUS_HTTP_ENABLE_COMPRESSION=true
```

#### Verification/Testing
```bash
# 1. Test end-to-end connectivity
curl -w "\nDNS: %{time_namelookup}s\nConnect: %{time_connect}s\nTotal: %{time_total}s\n" \
  https://dlt.aurigraph.io/api/v11/health
# Expected: DNS < 0.1s, Connect < 0.2s, Total < 0.5s

# 2. Verify all services reachable
kubectl exec -n aurigraph-production <pod-name> -- sh -c '
  nc -zv postgres-service 5432 &&
  nc -zv redis-service 6379 &&
  curl -s http://keycloak-service:8180/health | grep UP
'

# 3. Check DNS resolution
kubectl exec -n aurigraph-production <pod-name> -- sh -c '
  nslookup postgres-service &&
  nslookup dlt.aurigraph.io
'

# 4. Verify no packet loss
kubectl exec -n aurigraph-production <pod-name> -- ping -c 20 postgres-service
# Expected: 0% packet loss

# 5. Check API response time from multiple regions
# Use external monitoring service (e.g., Pingdom, Datadog)
```

#### Rollback Procedures
```bash
# 1. Revert network policy changes
kubectl apply -f network-policy-backup.yaml

# 2. Revert service configuration
kubectl apply -f service-backup.yaml

# 3. Revert ingress configuration
kubectl apply -f ingress-backup.yaml

# 4. Restart affected services
kubectl rollout restart deployment/aurigraph-v11 -n aurigraph-production
kubectl rollout restart deployment/nginx-gateway -n aurigraph-production

# 5. Verify rollback
kubectl get pods -n aurigraph-production
curl https://dlt.aurigraph.io/api/v11/health
```

#### Post-Incident Actions
1. **Document network topology** and update diagrams
2. **Review network policies** for gaps or conflicts
3. **Set up network monitoring** (latency, packet loss)
4. **Create network test suite** for regression testing
5. **Review DNS caching** configuration
6. **Update firewall rules** documentation
7. **Schedule network audit** if repeated issues

---

## Security Incident Response

### Runbook: Security Threat Detected

#### Detection/Symptoms
- Alert: "Potential security threat detected"
- Unusual API access patterns
- Failed authentication attempts spike
- DDoS attack indicators
- Unauthorized access attempts
- Malicious payload detected

#### Root Cause Analysis Steps

**Step 1: Assess Threat Severity**
```bash
# Check recent security events
kubectl logs -n aurigraph-production deployment/aurigraph-v11 --since=30m | \
  grep -i "unauthorized\|forbidden\|security"

# Check authentication failures
kubectl logs -n aurigraph-production deployment/aurigraph-v11 --since=1h | \
  grep "401\|403" | wc -l

# Identify source IPs
kubectl logs -n aurigraph-production <nginx-pod-name> --since=30m | \
  awk '{print $1}' | sort | uniq -c | sort -rn | head -20

# Check for SQL injection attempts
kubectl logs -n aurigraph-production deployment/aurigraph-v11 --since=1h | \
  grep -i "select\|union\|drop table\|insert into"

# Check for XSS attempts
kubectl logs -n aurigraph-production deployment/aurigraph-v11 --since=1h | \
  grep -i "<script>\|javascript:\|onerror="
```

**Step 2: Identify Attack Vector**
```bash
# Analyze request patterns
kubectl logs -n aurigraph-production <nginx-pod-name> --since=30m | \
  awk '{print $7}' | sort | uniq -c | sort -rn

# Check user-agent strings for bots
kubectl logs -n aurigraph-production <nginx-pod-name> --since=30m | \
  grep -o '"Mozilla[^"]*"' | sort | uniq -c | sort -rn

# Check for brute force attempts
kubectl logs -n aurigraph-production deployment/aurigraph-v11 --since=1h | \
  grep "login failed" | awk '{print $10}' | sort | uniq -c | sort -rn

# Check API abuse patterns
kubectl logs -n aurigraph-production deployment/aurigraph-v11 --since=30m | \
  awk '{print $1, $7}' | sort | uniq -c | awk '$1 > 100' | sort -rn
```

**Step 3: Check System Integrity**
```bash
# Check for unauthorized processes
kubectl exec -n aurigraph-production <pod-name> -- ps aux

# Check file integrity
kubectl exec -n aurigraph-production <pod-name> -- \
  find /app -type f -mtime -1 -ls

# Check for suspicious network connections
kubectl exec -n aurigraph-production <pod-name> -- netstat -antp

# Check for privilege escalation
kubectl exec -n aurigraph-production <pod-name> -- cat /etc/passwd
kubectl exec -n aurigraph-production <pod-name> -- ls -la /root
```

**Step 4: Check Cryptographic Security**
```bash
# Verify quantum crypto service status
curl https://dlt.aurigraph.io/api/v11/crypto/status | jq

# Check for weak cipher usage
kubectl logs -n aurigraph-production <nginx-pod-name> --since=1h | \
  grep -i "TLS1.0\|TLS1.1\|RC4\|DES"

# Verify certificate validity
echo | openssl s_client -connect dlt.aurigraph.io:443 -servername dlt.aurigraph.io 2>/dev/null | \
  openssl x509 -noout -text | grep -E "Signature Algorithm|Public Key Algorithm"
```

#### Resolution Procedures

**Scenario 1: DDoS Attack**
```bash
# 1. Identify attack source
kubectl logs -n aurigraph-production <nginx-pod-name> --since=10m | \
  awk '{print $1}' | sort | uniq -c | sort -rn | head -10

# 2. Block malicious IPs at NGINX level
kubectl exec -n aurigraph-production <nginx-pod-name> -- sh -c '
cat >> /etc/nginx/conf.d/blacklist.conf <<EOF
deny <malicious-ip-1>;
deny <malicious-ip-2>;
deny <malicious-ip-3>;
EOF
nginx -s reload
'

# 3. Enable rate limiting
kubectl exec -n aurigraph-production <nginx-pod-name> -- sh -c '
cat >> /etc/nginx/conf.d/rate-limit.conf <<EOF
limit_req_zone \$binary_remote_addr zone=general:10m rate=10r/s;
limit_req zone=general burst=20 nodelay;
EOF
nginx -s reload
'

# 4. Enable DDoS protection at cloud provider level
# AWS: Enable AWS Shield, configure WAF rules
# Azure: Enable DDoS Protection Standard
# GCP: Configure Cloud Armor policies

# 5. Scale up infrastructure to absorb attack
kubectl scale deployment aurigraph-v11 -n aurigraph-production --replicas=10
kubectl scale deployment nginx-gateway -n aurigraph-production --replicas=5
```

**Scenario 2: Brute Force Authentication Attack**
```bash
# 1. Identify targeted accounts
kubectl logs -n aurigraph-production deployment/aurigraph-v11 --since=1h | \
  grep "authentication failed" | awk '{print $12}' | sort | uniq -c | sort -rn

# 2. Lock affected accounts temporarily
# Call Keycloak Admin API to disable accounts
kubectl exec -n aurigraph-production <keycloak-pod-name> -- /opt/keycloak/bin/kcadm.sh \
  update users/<user-id> -s enabled=false -r aurigraph

# 3. Enforce stricter rate limits on auth endpoints
kubectl set env deployment/aurigraph-v11 -n aurigraph-production \
  AUTH_RATE_LIMIT_PER_MINUTE=5 \
  AUTH_LOCKOUT_THRESHOLD=3

# 4. Enable CAPTCHA for login
# Update Enterprise Portal to include reCAPTCHA

# 5. Enable MFA for all admin accounts
# Configure Keycloak to require OTP for admin realm
```

**Scenario 3: SQL Injection Attempt**
```bash
# 1. Identify malicious queries
kubectl logs -n aurigraph-production deployment/aurigraph-v11 --since=1h | \
  grep -i "select.*from\|union.*select\|drop table" | head -10

# 2. Block malicious IPs
kubectl exec -n aurigraph-production <nginx-pod-name> -- sh -c '
echo "deny <malicious-ip>;" >> /etc/nginx/conf.d/blacklist.conf
nginx -s reload
'

# 3. Enable WAF rules to block SQL injection
kubectl exec -n aurigraph-production <nginx-pod-name> -- sh -c '
cat >> /etc/nginx/conf.d/waf.conf <<EOF
if (\$args ~* "(union|select|insert|drop|update|delete|script|alert)") {
  return 403;
}
EOF
nginx -s reload
'

# 4. Verify input sanitization in application
# Review code for SQL injection vulnerabilities
# Use prepared statements for all database queries

# 5. Run security scan
# Use OWASP ZAP or similar tool
kubectl run zap-scan --image=owasp/zap2docker-stable --rm -it -- \
  zap-baseline.py -t https://dlt.aurigraph.io
```

**Scenario 4: Unauthorized Access / Privilege Escalation**
```bash
# 1. Identify compromised accounts
kubectl logs -n aurigraph-production deployment/aurigraph-v11 --since=1h | \
  grep -i "privilege\|escalation\|unauthorized"

# 2. Revoke access tokens
# Invalidate JWT tokens for suspicious sessions
kubectl exec -n aurigraph-production <keycloak-pod-name> -- /opt/keycloak/bin/kcadm.sh \
  logout-all -r aurigraph

# 3. Rotate secrets and credentials
kubectl delete secret aurigraph-v11-secret -n aurigraph-production
kubectl create secret generic aurigraph-v11-secret -n aurigraph-production \
  --from-literal=jwt-secret=$(openssl rand -base64 32) \
  --from-literal=db-password=$(openssl rand -base64 24)

# 4. Audit RBAC permissions
kubectl get rolebindings -n aurigraph-production
kubectl get clusterrolebindings | grep aurigraph

# 5. Reset affected user passwords
# Force password reset via Keycloak Admin Console
```

**Scenario 5: Data Exfiltration Attempt**
```bash
# 1. Identify unusual data access patterns
kubectl logs -n aurigraph-production deployment/aurigraph-v11 --since=1h | \
  grep "SELECT\|transactions\|users" | awk '{print $1, $10}' | sort | uniq -c | sort -rn

# 2. Enable audit logging
kubectl set env deployment/aurigraph-v11 -n aurigraph-production \
  AUDIT_LOGGING_ENABLED=true \
  AUDIT_LOG_LEVEL=INFO

# 3. Block suspicious IPs
kubectl exec -n aurigraph-production <nginx-pod-name> -- sh -c '
echo "deny <suspicious-ip>;" >> /etc/nginx/conf.d/blacklist.conf
nginx -s reload
'

# 4. Restrict data export capabilities
kubectl set env deployment/aurigraph-v11 -n aurigraph-production \
  MAX_EXPORT_ROWS=1000 \
  EXPORT_RATE_LIMIT=10_PER_HOUR

# 5. Rotate encryption keys
# Implement key rotation for database encryption
```

#### Verification/Testing
```bash
# 1. Verify malicious IPs are blocked
curl -I --connect-timeout 5 https://dlt.aurigraph.io -x http://<malicious-ip>:8080
# Expected: Connection timeout or 403 Forbidden

# 2. Verify rate limiting is active
for i in {1..50}; do curl -s -o /dev/null -w "%{http_code}\n" https://dlt.aurigraph.io/api/v11/health; done
# Expected: Some 429 (Too Many Requests) responses

# 3. Verify authentication is working
curl -X POST https://dlt.aurigraph.io/api/v11/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"test","password":"wrong"}'
# Expected: 401 Unauthorized

# 4. Check security headers
curl -I https://dlt.aurigraph.io | grep -i "x-frame-options\|x-content-type-options\|strict-transport-security"
# Expected: All security headers present

# 5. Verify no security alerts in last 10 minutes
kubectl logs -n aurigraph-production deployment/aurigraph-v11 --since=10m | \
  grep -i "security\|unauthorized" | wc -l
# Expected: 0 or very low
```

#### Rollback Procedures
```bash
# 1. Remove overly restrictive firewall rules if blocking legitimate traffic
kubectl exec -n aurigraph-production <nginx-pod-name> -- sh -c '
  rm /etc/nginx/conf.d/blacklist.conf
  nginx -s reload
'

# 2. Restore rate limit to normal
kubectl exec -n aurigraph-production <nginx-pod-name> -- sh -c '
  sed -i "s/rate=10r/rate=100r/" /etc/nginx/conf.d/rate-limit.conf
  nginx -s reload
'

# 3. Restore authentication settings
kubectl set env deployment/aurigraph-v11 -n aurigraph-production \
  AUTH_RATE_LIMIT_PER_MINUTE=100 \
  AUTH_LOCKOUT_THRESHOLD=5

# 4. Re-enable affected user accounts
kubectl exec -n aurigraph-production <keycloak-pod-name> -- /opt/keycloak/bin/kcadm.sh \
  update users/<user-id> -s enabled=true -r aurigraph
```

#### Post-Incident Actions
1. **Conduct thorough security audit** of affected systems
2. **Generate security incident report** with timeline and impact
3. **Notify stakeholders** per data breach notification requirements
4. **Review and update security policies**
5. **Conduct security training** for development team
6. **Implement additional security controls** (WAF, IDS/IPS)
7. **Schedule penetration testing** to identify vulnerabilities
8. **Update incident response playbook** with lessons learned
9. **File incident report** with regulatory bodies if required
10. **Engage security forensics** team for detailed analysis

---

## Performance Tuning

### Runbook: Performance Degradation

#### Detection/Symptoms
- TPS drops below 600K (warning threshold)
- API latency P99 > 500ms
- Increased GC pause times
- High CPU or memory usage
- Slow transaction finality (>500ms)

#### Root Cause Analysis Steps

**Step 1: Identify Performance Bottleneck**
```bash
# Check current TPS
curl -s https://dlt.aurigraph.io/api/v11/stats | jq '.tps'

# Check API latency
curl -s https://dlt.aurigraph.io/q/metrics | grep "http_server_requests_seconds"

# Check JVM metrics
curl -s https://dlt.aurigraph.io/q/metrics | grep -E "jvm_gc|jvm_memory|jvm_threads"

# Check resource usage
kubectl top pod -n aurigraph-production -l app=aurigraph-v11

# Check application-specific metrics
curl -s https://dlt.aurigraph.io/q/metrics | grep "aurigraph_"
```

**Step 2: Analyze Thread Dump**
```bash
# Generate thread dump
kubectl exec -n aurigraph-production <pod-name> -- jcmd 1 Thread.print > thread_dump.txt

# Analyze blocked threads
grep "BLOCKED" thread_dump.txt | wc -l

# Find lock contention
grep -A 5 "waiting to lock" thread_dump.txt

# Identify hot threads
grep -o "java.lang.Thread.State: [A-Z]*" thread_dump.txt | sort | uniq -c | sort -rn
```

**Step 3: Analyze GC Behavior**
```bash
# Check GC metrics
curl -s https://dlt.aurigraph.io/q/metrics | grep "jvm_gc_pause"

# View GC logs (if configured)
kubectl logs -n aurigraph-production <pod-name> | grep "\[gc"

# Generate heap histogram
kubectl exec -n aurigraph-production <pod-name> -- jcmd 1 GC.class_histogram > heap_histogram.txt
head -20 heap_histogram.txt
```

**Step 4: Profile Application**
```bash
# Enable JVM profiling (requires async-profiler)
kubectl exec -n aurigraph-production <pod-name> -- \
  /opt/async-profiler/profiler.sh -d 60 -f /tmp/flamegraph.html 1

# Copy flamegraph for analysis
kubectl cp aurigraph-production/<pod-name>:/tmp/flamegraph.html ./flamegraph.html

# Check slow methods in metrics
curl -s https://dlt.aurigraph.io/q/metrics | grep "method_duration" | sort -t= -k2 -rn | head -10
```

#### Resolution Procedures

**Scenario 1: High GC Overhead**
```bash
# 1. Check heap usage
kubectl exec -n aurigraph-production <pod-name> -- jstat -gcutil 1 1000 5

# 2. Increase heap size
kubectl patch deployment -n aurigraph-production aurigraph-v11 \
  -p '{"spec":{"template":{"spec":{"containers":[{"name":"aurigraph-v11","env":[{"name":"JAVA_OPTS","value":"-Xmx2g -Xms2g"}]}]}}}}'

# 3. Tune GC settings for low latency
kubectl set env deployment/aurigraph-v11 -n aurigraph-production \
  JAVA_OPTS="-Xmx2g -Xms2g -XX:+UseG1GC -XX:MaxGCPauseMillis=50 -XX:G1ReservePercent=20"

# 4. Restart deployment
kubectl rollout restart deployment/aurigraph-v11 -n aurigraph-production

# 5. Monitor GC behavior
kubectl logs -n aurigraph-production <pod-name> -f | grep "\[gc"
```

**Scenario 2: Database Query Bottleneck**
```bash
# 1. Identify slow queries (see Database Performance Optimization section)
# 2. Add missing indexes
# 3. Optimize queries in application code

# 4. Enable query caching
kubectl set env deployment/aurigraph-v11 -n aurigraph-production \
  QUARKUS_HIBERNATE_ORM_CACHE_ENABLED=true

# 5. Scale database read replicas
kubectl scale statefulset postgres-replica -n aurigraph-production --replicas=3
```

**Scenario 3: Lock Contention**
```bash
# 1. Identify lock contention from thread dump
grep -B 10 "waiting to lock" thread_dump.txt

# 2. Enable lock-free data structures
# Update code to use ConcurrentHashMap, AtomicInteger, etc.

# 3. Reduce lock granularity
# Refactor code to use finer-grained locking

# 4. Enable optimistic locking where possible
# Use @Version annotation in JPA entities

# 5. Increase parallelism
kubectl set env deployment/aurigraph-v11 -n aurigraph-production \
  QUARKUS_THREAD_POOL_MAX_THREADS=200
```

**Scenario 4: Network Latency**
```bash
# 1. Check network latency
kubectl exec -n aurigraph-production <pod-name> -- ping -c 10 postgres-service

# 2. Enable HTTP/2 connection pooling
kubectl set env deployment/aurigraph-v11 -n aurigraph-production \
  QUARKUS_HTTP2_ENABLED=true

# 3. Enable compression
kubectl set env deployment/aurigraph-v11 -n aurigraph-production \
  QUARKUS_HTTP_ENABLE_COMPRESSION=true

# 4. Reduce timeout values for faster failure detection
kubectl set env deployment/aurigraph-v11 -n aurigraph-production \
  QUARKUS_HTTP_CLIENT_TIMEOUT=5000

# 5. Co-locate services in same availability zone
# Adjust pod affinity rules
```

**Scenario 5: Insufficient CPU Resources**
```bash
# 1. Check CPU throttling
kubectl exec -n aurigraph-production <pod-name> -- cat /sys/fs/cgroup/cpu/cpu.stat

# 2. Increase CPU limits
kubectl patch deployment -n aurigraph-production aurigraph-v11 \
  -p '{"spec":{"template":{"spec":{"containers":[{"name":"aurigraph-v11","resources":{"limits":{"cpu":"4000m"},"requests":{"cpu":"2000m"}}}]}}}}'

# 3. Enable CPU affinity for better cache locality
kubectl set env deployment/aurigraph-v11 -n aurigraph-production \
  QUARKUS_VERTX_PREFER_NATIVE_TRANSPORT=true

# 4. Scale horizontally
kubectl scale deployment aurigraph-v11 -n aurigraph-production --replicas=5

# 5. Enable HPA (Horizontal Pod Autoscaler)
kubectl autoscale deployment aurigraph-v11 -n aurigraph-production \
  --cpu-percent=70 --min=3 --max=10
```

#### Verification/Testing
```bash
# 1. Verify TPS is back to normal
curl -s https://dlt.aurigraph.io/api/v11/stats | jq '.tps'
# Expected: >776000

# 2. Check API latency
for i in {1..20}; do curl -w "Time: %{time_total}s\n" -o /dev/null -s https://dlt.aurigraph.io/api/v11/health; done
# Expected: <100ms average

# 3. Verify GC pause times are acceptable
kubectl logs -n aurigraph-production <pod-name> | grep "\[gc" | tail -10
# Expected: <50ms pause times

# 4. Check resource usage
kubectl top pod -n aurigraph-production -l app=aurigraph-v11
# Expected: CPU <70%, Memory <75%

# 5. Run load test
# Use JMeter or Gatling to generate load and verify performance
```

#### Rollback Procedures
```bash
# 1. Revert resource limits
kubectl patch deployment -n aurigraph-production aurigraph-v11 \
  -p '{"spec":{"template":{"spec":{"containers":[{"name":"aurigraph-v11","resources":{"limits":{"cpu":"2000m","memory":"1Gi"}}}]}}}}'

# 2. Revert environment variables
kubectl set env deployment/aurigraph-v11 -n aurigraph-production JAVA_OPTS-

# 3. Scale back to original replica count
kubectl scale deployment aurigraph-v11 -n aurigraph-production --replicas=3

# 4. Monitor for stability
kubectl logs -n aurigraph-production deployment/aurigraph-v11 -f
```

#### Post-Incident Actions
1. **Analyze performance trends** in Grafana
2. **Update performance baseline** if new normal
3. **Create JMeter test suite** for regression testing
4. **Schedule performance review** with engineering team
5. **Document performance tuning** best practices
6. **Create capacity plan** for future growth
7. **Update monitoring alerts** based on new thresholds

---

## Capacity Planning

### Runbook: Capacity Threshold Approaching

#### Detection/Symptoms
- Resource usage > 70% consistently
- Alert: "Capacity threshold approaching"
- Slow response during peak hours
- Auto-scaler frequently hitting max replicas

#### Root Cause Analysis Steps

**Step 1: Analyze Resource Trends**
```bash
# Check current resource usage
kubectl top nodes
kubectl top pods -n aurigraph-production

# Query Prometheus for historical data
# CPU usage trend (last 7 days)
curl -s 'http://prometheus:9090/api/v1/query?query=avg(rate(container_cpu_usage_seconds_total{namespace="aurigraph-production"}[1h]))' | jq

# Memory usage trend (last 7 days)
curl -s 'http://prometheus:9090/api/v1/query?query=avg(container_memory_usage_bytes{namespace="aurigraph-production"})' | jq

# Network bandwidth usage
curl -s 'http://prometheus:9090/api/v1/query?query=rate(container_network_transmit_bytes_total{namespace="aurigraph-production"}[1h])' | jq
```

**Step 2: Forecast Future Needs**
```bash
# Calculate growth rate
# Export metrics to CSV for analysis
curl -s 'http://prometheus:9090/api/v1/query_range?query=sum(rate(container_cpu_usage_seconds_total{namespace="aurigraph-production"}[1h]))&start=<7_days_ago>&end=<now>&step=1h' | \
  jq -r '.data.result[0].values[] | @csv' > cpu_usage.csv

# Analyze in spreadsheet or Python
# Linear regression to forecast usage

# Check transaction volume trends
curl -s https://dlt.aurigraph.io/api/v11/analytics/trends | jq '.transactionVolumeTrend'
```

**Step 3: Identify Bottlenecks**
```bash
# CPU bottleneck?
kubectl top pods -n aurigraph-production | awk '{if($2 ~ /%/) print $2}' | sed 's/[^0-9]//g' | awk '{if($1>70) count++} END{print count " pods above 70% CPU"}'

# Memory bottleneck?
kubectl top pods -n aurigraph-production | awk '{if($3 ~ /%/) print $3}' | sed 's/[^0-9]//g' | awk '{if($1>70) count++} END{print count " pods above 70% Memory"}'

# Storage bottleneck?
kubectl exec -n aurigraph-production <pod-name> -- df -h | grep -v "tmpfs\|overlay"

# Network bottleneck?
kubectl exec -n aurigraph-production <pod-name> -- iftop -t -s 10
```

**Step 4: Calculate Headroom**
```bash
# Check current capacity
CURRENT_TPS=$(curl -s https://dlt.aurigraph.io/api/v11/stats | jq '.tps')
TARGET_TPS=2000000
HEADROOM=$((TARGET_TPS - CURRENT_TPS))
echo "Headroom: $HEADROOM TPS"

# Check node capacity
kubectl describe nodes | grep -A 5 "Allocatable"

# Calculate pod capacity
CURRENT_PODS=$(kubectl get pods -n aurigraph-production -l app=aurigraph-v11 --no-headers | wc -l)
MAX_PODS=10
POD_HEADROOM=$((MAX_PODS - CURRENT_PODS))
echo "Pod headroom: $POD_HEADROOM"
```

#### Resolution Procedures

**Scenario 1: Scale Horizontally (More Pods)**
```bash
# 1. Increase replica count
kubectl scale deployment aurigraph-v11 -n aurigraph-production --replicas=7

# 2. Verify scaling
kubectl get pods -n aurigraph-production -l app=aurigraph-v11 -w

# 3. Update HPA max replicas
kubectl patch hpa aurigraph-v11 -n aurigraph-production -p '{"spec":{"maxReplicas":15}}'

# 4. Monitor resource distribution
kubectl top pods -n aurigraph-production -l app=aurigraph-v11

# 5. Verify TPS improvement
curl -s https://dlt.aurigraph.io/api/v11/stats | jq '.tps'
```

**Scenario 2: Scale Vertically (Larger Pods)**
```bash
# 1. Increase pod resources
kubectl patch deployment -n aurigraph-production aurigraph-v11 \
  -p '{"spec":{"template":{"spec":{"containers":[{"name":"aurigraph-v11","resources":{"limits":{"cpu":"4000m","memory":"2Gi"},"requests":{"cpu":"2000m","memory":"1Gi"}}}]}}}}'

# 2. Rolling restart to apply changes
kubectl rollout restart deployment/aurigraph-v11 -n aurigraph-production

# 3. Monitor rollout
kubectl rollout status deployment/aurigraph-v11 -n aurigraph-production

# 4. Verify new resource allocation
kubectl describe pod -n aurigraph-production <pod-name> | grep -A 5 "Limits"

# 5. Check performance improvement
kubectl top pod -n aurigraph-production <pod-name>
```

**Scenario 3: Add Nodes to Cluster**
```bash
# AWS EKS
eksctl scale nodegroup --cluster=aurigraph-cluster --name=ng-1 --nodes=5

# GKE
gcloud container clusters resize aurigraph-cluster --num-nodes=5 --zone=us-central1-a

# Azure AKS
az aks scale --resource-group aurigraph-rg --name aurigraph-cluster --node-count 5

# Verify nodes are ready
kubectl get nodes -w

# Check pod distribution across nodes
kubectl get pods -n aurigraph-production -o wide
```

**Scenario 4: Optimize Resource Utilization**
```bash
# 1. Enable VPA (Vertical Pod Autoscaler) for right-sizing
kubectl apply -f - <<EOF
apiVersion: autoscaling.k8s.io/v1
kind: VerticalPodAutoscaler
metadata:
  name: aurigraph-v11-vpa
  namespace: aurigraph-production
spec:
  targetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: aurigraph-v11
  updatePolicy:
    updateMode: "Auto"
EOF

# 2. Configure pod priority classes
kubectl apply -f - <<EOF
apiVersion: scheduling.k8s.io/v1
kind: PriorityClass
metadata:
  name: high-priority
value: 1000
globalDefault: false
description: "High priority for critical services"
EOF

# 3. Set priority on V11 pods
kubectl patch deployment aurigraph-v11 -n aurigraph-production \
  -p '{"spec":{"template":{"spec":{"priorityClassName":"high-priority"}}}}'

# 4. Enable resource quotas per namespace
kubectl apply -f - <<EOF
apiVersion: v1
kind: ResourceQuota
metadata:
  name: compute-resources
  namespace: aurigraph-production
spec:
  hard:
    requests.cpu: "50"
    requests.memory: 100Gi
    limits.cpu: "100"
    limits.memory: 200Gi
EOF
```

**Scenario 5: Database Capacity Planning**
```bash
# 1. Check database size growth
kubectl exec -n aurigraph-production <postgres-pod-name> -- psql -U aurigraph -d aurigraph -c \
  "SELECT pg_database.datname, pg_size_pretty(pg_database_size(pg_database.datname)) AS size
   FROM pg_database ORDER BY pg_database_size(pg_database.datname) DESC;"

# 2. Estimate future storage needs
# Current size: 100GB, Growth rate: 5GB/week
# Forecast: 100 + (5 * weeks) GB

# 3. Increase PVC (Persistent Volume Claim) size
kubectl patch pvc postgres-data -n aurigraph-production -p '{"spec":{"resources":{"requests":{"storage":"200Gi"}}}}'

# 4. Implement data retention policy
kubectl exec -n aurigraph-production <postgres-pod-name> -- psql -U aurigraph -d aurigraph -c \
  "DELETE FROM transactions WHERE timestamp < now() - interval '1 year';"

# 5. Set up archival strategy
# Export old data to S3 or similar cold storage
kubectl run pg-dump --image=postgres:16 --rm -it -- \
  pg_dump -h postgres-service -U aurigraph -d aurigraph -t transactions \
  --where="timestamp < now() - interval '6 months'" | gzip > archive.sql.gz
```

#### Verification/Testing
```bash
# 1. Verify resource availability
kubectl top nodes
# Expected: CPU <70%, Memory <75% on all nodes

# 2. Check pod health
kubectl get pods -n aurigraph-production -l app=aurigraph-v11
# Expected: All pods Running and Ready

# 3. Verify TPS capacity
curl -s https://dlt.aurigraph.io/api/v11/stats | jq '.tps'
# Expected: >1000000

# 4. Run capacity test
# Use load generator to test max TPS
kubectl run load-generator --image=aurigraph/load-gen --rm -it -- \
  --target=https://dlt.aurigraph.io --tps=1500000 --duration=300s

# 5. Check resource headroom
kubectl describe nodes | grep -A 5 "Allocated resources" | grep -o "[0-9]*%"
# Expected: <70% CPU and Memory allocated
```

#### Rollback Procedures
```bash
# 1. Scale back replicas if over-provisioned
kubectl scale deployment aurigraph-v11 -n aurigraph-production --replicas=3

# 2. Revert resource limits
kubectl patch deployment -n aurigraph-production aurigraph-v11 \
  -p '{"spec":{"template":{"spec":{"containers":[{"name":"aurigraph-v11","resources":{"limits":{"cpu":"2000m","memory":"1Gi"}}}]}}}}'

# 3. Remove nodes if not needed (costs)
eksctl scale nodegroup --cluster=aurigraph-cluster --name=ng-1 --nodes=3

# 4. Disable VPA if causing issues
kubectl delete vpa aurigraph-v11-vpa -n aurigraph-production
```

#### Post-Incident Actions
1. **Create capacity forecast model** (6-12 months)
2. **Update capacity planning spreadsheet** with new baselines
3. **Schedule quarterly capacity review**
4. **Document cost implications** of scaling
5. **Update budget projections** for infrastructure
6. **Set up predictive alerts** for capacity thresholds
7. **Create capacity runbook** for on-call team

---

## Upgrade Procedures

### Runbook: V11 Platform Upgrade

#### Detection/Symptoms
- New version available
- Security patch required
- Feature upgrade needed
- Performance improvement available

#### Root Cause Analysis Steps

**Step 1: Review Upgrade Requirements**
```bash
# Check current version
curl -s https://dlt.aurigraph.io/api/v11/info | jq '.version'

# Check release notes
curl -s https://api.github.com/repos/Aurigraph-DLT-Corp/Aurigraph-DLT/releases/latest | jq '.body'

# Check breaking changes
cat CHANGELOG.md | grep "BREAKING"

# Check dependency updates
cd aurigraph-av10-7/aurigraph-v11-standalone
./mvnw versions:display-dependency-updates
```

**Step 2: Prepare Upgrade Plan**
```bash
# 1. Create backup (see Backup & Recovery section)

# 2. Test upgrade in staging environment
kubectl config use-context staging

# 3. Check compatibility matrix
# Java version, Quarkus version, PostgreSQL version

# 4. Identify downtime requirements
# Zero-downtime (blue-green) or maintenance window required?
```

**Step 3: Build New Version**
```bash
# 1. Update version in pom.xml
cd aurigraph-av10-7/aurigraph-v11-standalone
vim pom.xml  # Update <version>11.5.0</version>

# 2. Build and test
./mvnw clean package -DskipTests
./mvnw test

# 3. Build native image
./mvnw package -Pnative -Dquarkus.native.container-build=true

# 4. Build Docker image
docker build -t aurigraph/v11:11.5.0 .

# 5. Push to registry
docker push aurigraph/v11:11.5.0
```

#### Resolution Procedures

**Scenario 1: Blue-Green Deployment (Zero Downtime)**
```bash
# 1. Deploy green environment (new version)
kubectl apply -f - <<EOF
apiVersion: apps/v1
kind: Deployment
metadata:
  name: aurigraph-v11-green
  namespace: aurigraph-production
spec:
  replicas: 3
  selector:
    matchLabels:
      app: aurigraph-v11
      version: green
  template:
    metadata:
      labels:
        app: aurigraph-v11
        version: green
    spec:
      containers:
      - name: aurigraph-v11
        image: aurigraph/v11:11.5.0
        ports:
        - containerPort: 9003
        resources:
          limits:
            cpu: "2000m"
            memory: "1Gi"
          requests:
            cpu: "1000m"
            memory: "512Mi"
EOF

# 2. Wait for green deployment to be ready
kubectl rollout status deployment/aurigraph-v11-green -n aurigraph-production

# 3. Verify green deployment health
kubectl run test-pod --image=curlimages/curl --rm -it -- \
  curl http://aurigraph-v11-green-service:9003/q/health

# 4. Gradually shift traffic to green
kubectl patch service aurigraph-v11-service -n aurigraph-production \
  -p '{"spec":{"selector":{"version":"green"}}}'

# 5. Monitor metrics for 10 minutes
watch -n 10 'curl -s https://dlt.aurigraph.io/api/v11/stats | jq ".tps, .errorRate"'

# 6. If successful, delete blue deployment
kubectl delete deployment aurigraph-v11-blue -n aurigraph-production

# 7. Rename green to blue for next upgrade
kubectl patch deployment aurigraph-v11-green -n aurigraph-production \
  -p '{"metadata":{"name":"aurigraph-v11-blue"}}'
```

**Scenario 2: Rolling Update**
```bash
# 1. Update deployment with new image
kubectl set image deployment/aurigraph-v11 -n aurigraph-production \
  aurigraph-v11=aurigraph/v11:11.5.0

# 2. Configure rolling update strategy
kubectl patch deployment aurigraph-v11 -n aurigraph-production \
  -p '{"spec":{"strategy":{"type":"RollingUpdate","rollingUpdate":{"maxSurge":1,"maxUnavailable":0}}}}'

# 3. Monitor rollout
kubectl rollout status deployment/aurigraph-v11 -n aurigraph-production --timeout=10m

# 4. Check pod versions
kubectl get pods -n aurigraph-production -l app=aurigraph-v11 \
  -o jsonpath='{range .items[*]}{.metadata.name}{"\t"}{.spec.containers[0].image}{"\n"}{end}'

# 5. Verify all pods are running new version
kubectl get pods -n aurigraph-production -l app=aurigraph-v11 --field-selector=status.phase=Running
```

**Scenario 3: Database Migration**
```bash
# 1. Backup database (CRITICAL)
kubectl exec -n aurigraph-production <postgres-pod-name> -- \
  pg_dump -U aurigraph -d aurigraph | gzip > backup-pre-upgrade.sql.gz

# 2. Apply Flyway migrations
kubectl exec -n aurigraph-production <v11-pod-name> -- \
  /app/flyway migrate -configFile=/app/flyway.conf

# 3. Verify migrations
kubectl exec -n aurigraph-production <postgres-pod-name> -- psql -U aurigraph -d aurigraph -c \
  "SELECT version, description, installed_on, success FROM flyway_schema_history ORDER BY installed_rank DESC LIMIT 5;"

# 4. Test backward compatibility
# Run queries using old application version against new schema

# 5. If migration fails, restore from backup
# See "Rollback Procedures" below
```

**Scenario 4: Configuration Update**
```bash
# 1. Update ConfigMap
kubectl create configmap aurigraph-v11-config -n aurigraph-production \
  --from-file=application.properties --dry-run=client -o yaml | kubectl apply -f -

# 2. Update Secrets
kubectl create secret generic aurigraph-v11-secret -n aurigraph-production \
  --from-literal=jwt-secret=<new-secret> --dry-run=client -o yaml | kubectl apply -f -

# 3. Restart deployment to pick up changes
kubectl rollout restart deployment/aurigraph-v11 -n aurigraph-production

# 4. Verify configuration
kubectl exec -n aurigraph-production <pod-name> -- \
  cat /app/config/application.properties | grep "quarkus.http.port"
```

**Scenario 5: Dependency Update**
```bash
# 1. Update dependencies in pom.xml
cd aurigraph-av10-7/aurigraph-v11-standalone
vim pom.xml
# Update <quarkus.platform.version>3.30.0</quarkus.platform.version>

# 2. Run dependency analysis
./mvnw dependency:analyze
./mvnw versions:display-dependency-updates

# 3. Build with updated dependencies
./mvnw clean package

# 4. Run security scan
./mvnw dependency:check

# 5. Deploy using blue-green or rolling update
# See Scenario 1 or Scenario 2
```

#### Verification/Testing
```bash
# 1. Verify version
curl -s https://dlt.aurigraph.io/api/v11/info | jq '.version'
# Expected: "11.5.0"

# 2. Run smoke tests
curl -s https://dlt.aurigraph.io/q/health | jq '.status'
curl -s https://dlt.aurigraph.io/api/v11/stats | jq '.tps'
curl -s https://dlt.aurigraph.io/api/v11/blockchain/transactions?limit=10

# 3. Run integration tests
kubectl run integration-test --image=aurigraph/integration-tests --rm -it -- \
  pytest /tests/integration/ -v

# 4. Check error rate
kubectl logs -n aurigraph-production deployment/aurigraph-v11 --since=10m | grep -c ERROR
# Expected: 0 or very low

# 5. Monitor metrics for 1 hour
# Check Grafana dashboard for anomalies
```

#### Rollback Procedures
```bash
# 1. Immediate rollback (Kubernetes)
kubectl rollout undo deployment/aurigraph-v11 -n aurigraph-production

# 2. Rollback to specific version
kubectl rollout undo deployment/aurigraph-v11 -n aurigraph-production --to-revision=<revision>

# 3. For blue-green, switch back to blue
kubectl patch service aurigraph-v11-service -n aurigraph-production \
  -p '{"spec":{"selector":{"version":"blue"}}}'

# 4. Rollback database migration
kubectl exec -n aurigraph-production <postgres-pod-name> -- psql -U aurigraph -d aurigraph < backup-pre-upgrade.sql.gz

# 5. Verify rollback
kubectl rollout status deployment/aurigraph-v11 -n aurigraph-production
curl -s https://dlt.aurigraph.io/api/v11/info | jq '.version'
```

#### Post-Incident Actions
1. **Document upgrade process** with actual timings
2. **Update runbook** with lessons learned
3. **Create upgrade checklist** for future upgrades
4. **Notify stakeholders** of successful upgrade
5. **Update monitoring dashboards** for new version
6. **Archive old Docker images** after 30 days
7. **Update version in documentation**
8. **Schedule post-upgrade review** meeting

---

## Consensus System Operations

### Runbook: Consensus Failure

#### Detection/Symptoms
- Transactions not finalizing
- High leader election frequency
- Split-brain condition
- Byzantine fault detected
- Consensus timeout

#### Root Cause Analysis Steps

**Step 1: Check Consensus Status**
```bash
# Check consensus health
curl -s https://dlt.aurigraph.io/api/v11/consensus/status | jq

# Check leader information
curl -s https://dlt.aurigraph.io/api/v11/consensus/leader | jq

# Check validator nodes
curl -s https://dlt.aurigraph.io/api/v11/nodes | jq '.[] | select(.role=="validator")'

# Check consensus metrics
curl -s https://dlt.aurigraph.io/q/metrics | grep "consensus_"
```

**Step 2: Analyze Consensus Logs**
```bash
# Check for leader election events
kubectl logs -n aurigraph-production deployment/aurigraph-v11 --since=30m | \
  grep -i "leader election\|term changed\|voted for"

# Check for consensus timeouts
kubectl logs -n aurigraph-production deployment/aurigraph-v11 --since=30m | \
  grep -i "timeout\|no quorum\|majority"

# Check for Byzantine behavior
kubectl logs -n aurigraph-production deployment/aurigraph-v11 --since=30m | \
  grep -i "byzantine\|malicious\|conflicting"
```

**Step 3: Check Node Connectivity**
```bash
# Check if all validator nodes are reachable
for pod in $(kubectl get pods -n aurigraph-production -l role=validator -o name); do
  kubectl exec -n aurigraph-production ${pod#pod/} -- nc -zv validator-0 9003
  kubectl exec -n aurigraph-production ${pod#pod/} -- nc -zv validator-1 9003
  kubectl exec -n aurigraph-production ${pod#pod/} -- nc -zv validator-2 9003
done

# Check network latency between validators
kubectl exec -n aurigraph-production validator-0 -- ping -c 5 validator-1
kubectl exec -n aurigraph-production validator-0 -- ping -c 5 validator-2
```

#### Resolution Procedures

**Scenario 1: No Quorum / Split Brain**
```bash
# 1. Check current quorum status
curl -s https://dlt.aurigraph.io/api/v11/consensus/quorum | jq

# 2. Identify which nodes are in which partition
kubectl get pods -n aurigraph-production -l role=validator -o wide

# 3. Resolve network partition (if any)
# Check network policies, security groups, firewalls

# 4. Force leader election if no progress
kubectl exec -n aurigraph-production validator-0 -- \
  curl -X POST http://localhost:9003/api/v11/consensus/force-election

# 5. Monitor consensus recovery
watch -n 5 'curl -s https://dlt.aurigraph.io/api/v11/consensus/status | jq ".state"'
```

**Scenario 2: Byzantine Validator Detected**
```bash
# 1. Identify Byzantine validator
kubectl logs -n aurigraph-production deployment/aurigraph-v11 --since=1h | \
  grep "Byzantine fault detected" | grep -o "node_id=[^ ]*"

# 2. Isolate the malicious validator
kubectl label pod <byzantine-pod-name> -n aurigraph-production quarantine=true

# 3. Update network policy to block Byzantine validator
kubectl apply -f - <<EOF
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: block-byzantine-validator
  namespace: aurigraph-production
spec:
  podSelector:
    matchLabels:
      role: validator
  policyTypes:
  - Ingress
  ingress:
  - from:
    - podSelector:
        matchLabels:
          role: validator
          quarantine: "false"
EOF

# 4. Remove Byzantine validator from validator set
curl -X DELETE https://dlt.aurigraph.io/api/v11/validators/<byzantine-node-id> \
  -H "Authorization: Bearer $ADMIN_TOKEN"

# 5. Add replacement validator
kubectl scale statefulset validator -n aurigraph-production --replicas=4
```

**Scenario 3: Leader Thrashing (Frequent Elections)**
```bash
# 1. Check leader election frequency
kubectl logs -n aurigraph-production deployment/aurigraph-v11 --since=10m | \
  grep "Leader elected" | wc -l
# If >5, thrashing is occurring

# 2. Identify unstable node(s)
kubectl logs -n aurigraph-production deployment/aurigraph-v11 --since=10m | \
  grep "Leader elected" | grep -o "term=[0-9]*" | sort | uniq -c

# 3. Increase election timeout
kubectl set env deployment/aurigraph-v11 -n aurigraph-production \
  CONSENSUS_ELECTION_TIMEOUT_MS=500

# 4. Check for resource constraints causing instability
kubectl top pod -n aurigraph-production -l role=validator

# 5. Restart unstable validator
kubectl delete pod <unstable-pod-name> -n aurigraph-production
```

**Scenario 4: Consensus Timeout**
```bash
# 1. Check current timeout settings
kubectl get configmap aurigraph-v11-config -n aurigraph-production -o yaml | grep timeout

# 2. Check network latency
kubectl exec -n aurigraph-production validator-0 -- ping -c 20 validator-1 | grep avg
# If avg > 50ms, consider increasing timeout

# 3. Increase consensus timeout temporarily
kubectl set env deployment/aurigraph-v11 -n aurigraph-production \
  CONSENSUS_HEARTBEAT_TIMEOUT_MS=100 \
  CONSENSUS_ELECTION_TIMEOUT_MS=500

# 4. Restart consensus service
kubectl rollout restart deployment/aurigraph-v11 -n aurigraph-production

# 5. Monitor consensus stability
watch -n 5 'curl -s https://dlt.aurigraph.io/api/v11/consensus/status | jq'
```

**Scenario 5: Log Replication Lag**
```bash
# 1. Check replication lag
curl -s https://dlt.aurigraph.io/api/v11/consensus/replication-lag | jq

# 2. Identify slow follower
kubectl logs -n aurigraph-production deployment/aurigraph-v11 --since=10m | \
  grep "replication lag" | sort -k5 -rn | head -5

# 3. Check if follower is resource-constrained
kubectl top pod -n aurigraph-production <slow-follower-pod>

# 4. Increase batch size for log replication
kubectl set env deployment/aurigraph-v11 -n aurigraph-production \
  CONSENSUS_LOG_BATCH_SIZE=1000

# 5. If lag persists, trigger snapshot and catch-up
kubectl exec -n aurigraph-production <slow-follower-pod> -- \
  curl -X POST http://localhost:9003/api/v11/consensus/snapshot
```

#### Verification/Testing
```bash
# 1. Verify consensus is operational
curl -s https://dlt.aurigraph.io/api/v11/consensus/status | jq '.state'
# Expected: "HEALTHY"

# 2. Check leader stability
for i in {1..10}; do
  curl -s https://dlt.aurigraph.io/api/v11/consensus/leader | jq '.nodeId'
  sleep 5
done
# Expected: Same leader for all checks

# 3. Test transaction finality
curl -X POST https://dlt.aurigraph.io/api/v11/blockchain/transactions \
  -H "Content-Type: application/json" \
  -d '{"from":"test","to":"test2","amount":100}'
# Check finality time < 500ms

# 4. Verify quorum
curl -s https://dlt.aurigraph.io/api/v11/consensus/quorum | jq
# Expected: majority_achieved=true

# 5. Check consensus metrics
curl -s https://dlt.aurigraph.io/q/metrics | grep "consensus_election_count"
# Expected: Low value (no thrashing)
```

#### Rollback Procedures
```bash
# 1. Revert timeout settings
kubectl set env deployment/aurigraph-v11 -n aurigraph-production \
  CONSENSUS_HEARTBEAT_TIMEOUT_MS=50 \
  CONSENSUS_ELECTION_TIMEOUT_MS=300

# 2. Remove quarantine label
kubectl label pod <pod-name> -n aurigraph-production quarantine-

# 3. Restore network policy
kubectl delete networkpolicy block-byzantine-validator -n aurigraph-production

# 4. Restart consensus
kubectl rollout restart deployment/aurigraph-v11 -n aurigraph-production
```

#### Post-Incident Actions
1. **Analyze consensus logs** for patterns
2. **Review validator node capacity**
3. **Update consensus parameters** based on findings
4. **Implement consensus monitoring dashboard**
5. **Document Byzantine behavior** for forensics
6. **Schedule consensus audit**

---

## Cross-Chain Bridge Operations

### Runbook: Bridge Transaction Failure

#### Detection/Symptoms
- Cross-chain transactions failing
- High bridge latency (>30s)
- Bridge balance mismatch
- Oracle data stale
- Validator disagreement on cross-chain state

#### Root Cause Analysis Steps

**Step 1: Check Bridge Status**
```bash
# Check bridge health
curl -s https://dlt.aurigraph.io/api/v11/bridge/status | jq

# Check supported chains
curl -s https://dlt.aurigraph.io/api/v11/bridge/chains | jq

# Check bridge balances
curl -s https://dlt.aurigraph.io/api/v11/bridge/balances | jq

# Check pending transactions
curl -s https://dlt.aurigraph.io/api/v11/bridge/pending | jq
```

**Step 2: Check External Chain Connectivity**
```bash
# Test Ethereum connectivity
kubectl exec -n aurigraph-production <pod-name> -- \
  curl -X POST -H "Content-Type: application/json" \
  --data '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}' \
  https://mainnet.infura.io/v3/<api-key>

# Test Polkadot connectivity
kubectl exec -n aurigraph-production <pod-name> -- \
  curl -X POST -H "Content-Type: application/json" \
  --data '{"jsonrpc":"2.0","method":"chain_getBlock","params":[],"id":1}' \
  https://polkadot.api.onfinality.io/public

# Check bridge contract balances on external chains
# Use chain-specific CLI or explorer API
```

**Step 3: Check Oracle Service**
```bash
# Check oracle status
curl -s https://dlt.aurigraph.io/api/v11/oracle/status | jq

# Check oracle data freshness
curl -s https://dlt.aurigraph.io/api/v11/oracle/feeds | jq '.[] | {feed: .name, age: .lastUpdate}'

# Check oracle logs
kubectl logs -n aurigraph-production deployment/aurigraph-v11 --since=30m | grep -i oracle
```

#### Resolution Procedures

**Scenario 1: Bridge Contract Balance Mismatch**
```bash
# 1. Audit bridge balances
curl -s https://dlt.aurigraph.io/api/v11/bridge/audit | jq

# 2. Compare with on-chain balances
# Ethereum example:
cast balance <bridge-contract-address> --rpc-url https://mainnet.infura.io/v3/<api-key>

# 3. If discrepancy found, reconcile
# Trigger manual reconciliation
curl -X POST https://dlt.aurigraph.io/api/v11/bridge/reconcile \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"chain":"ethereum","contract":"<address>"}'

# 4. Monitor reconciliation progress
watch -n 10 'curl -s https://dlt.aurigraph.io/api/v11/bridge/reconciliation-status | jq'

# 5. Verify balance match
curl -s https://dlt.aurigraph.io/api/v11/bridge/audit | jq '.discrepancies'
# Expected: []
```

**Scenario 2: Oracle Data Stale**
```bash
# 1. Identify stale feeds
curl -s https://dlt.aurigraph.io/api/v11/oracle/feeds | \
  jq '.[] | select(.lastUpdate < (now - 300))'  # Stale if >5 min old

# 2. Check oracle service logs
kubectl logs -n aurigraph-production <oracle-pod-name> --since=30m | grep ERROR

# 3. Restart oracle service
kubectl rollout restart deployment/oracle-service -n aurigraph-production

# 4. Force oracle update
curl -X POST https://dlt.aurigraph.io/api/v11/oracle/refresh \
  -H "Authorization: Bearer $ADMIN_TOKEN"

# 5. Verify data freshness
curl -s https://dlt.aurigraph.io/api/v11/oracle/feeds | jq '.[] | .lastUpdate'
# Expected: Recent timestamps
```

**Scenario 3: Cross-Chain Transaction Stuck**
```bash
# 1. Identify stuck transaction
curl -s https://dlt.aurigraph.io/api/v11/bridge/transactions/<tx-id> | jq

# 2. Check transaction status on source chain
# Ethereum example:
cast tx <tx-hash> --rpc-url https://mainnet.infura.io/v3/<api-key>

# 3. If confirmed on source but not destination, trigger retry
curl -X POST https://dlt.aurigraph.io/api/v11/bridge/retry \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"transactionId":"<tx-id>"}'

# 4. If retry fails, check destination chain gas/fees
# May need to increase gas limit or fee

# 5. Monitor retry progress
watch -n 10 'curl -s https://dlt.aurigraph.io/api/v11/bridge/transactions/<tx-id> | jq .status'
```

**Scenario 4: Bridge Validator Disagreement**
```bash
# 1. Check validator consensus on bridge state
curl -s https://dlt.aurigraph.io/api/v11/bridge/validator-states | jq

# 2. Identify outlier validators
curl -s https://dlt.aurigraph.io/api/v11/bridge/validator-states | \
  jq '[.[] | .stateRoot] | group_by(.) | map({root: .[0], count: length})'

# 3. If disagreement found, trigger state sync
curl -X POST https://dlt.aurigraph.io/api/v11/bridge/sync-state \
  -H "Authorization: Bearer $ADMIN_TOKEN"

# 4. Check logs for Byzantine behavior
kubectl logs -n aurigraph-production deployment/aurigraph-v11 --since=1h | \
  grep -i "bridge.*byzantine\|conflicting state"

# 5. If validator is malicious, remove from bridge validator set
curl -X DELETE https://dlt.aurigraph.io/api/v11/bridge/validators/<validator-id> \
  -H "Authorization: Bearer $ADMIN_TOKEN"
```

**Scenario 5: External Chain RPC Failure**
```bash
# 1. Test RPC endpoint
kubectl exec -n aurigraph-production <pod-name> -- \
  curl -I https://mainnet.infura.io/v3/<api-key>

# 2. Switch to backup RPC endpoint
kubectl set env deployment/aurigraph-v11 -n aurigraph-production \
  ETH_RPC_URL=https://eth-mainnet.alchemyapi.io/v2/<api-key>

# 3. Restart bridge service
kubectl rollout restart deployment/aurigraph-v11 -n aurigraph-production

# 4. Verify connectivity
curl -s https://dlt.aurigraph.io/api/v11/bridge/connectivity-test | jq

# 5. Update RPC endpoint in configuration for long-term
kubectl edit configmap aurigraph-v11-config -n aurigraph-production
# Update eth.rpc.url
```

#### Verification/Testing
```bash
# 1. Test bridge transaction end-to-end
curl -X POST https://dlt.aurigraph.io/api/v11/bridge/transfer \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "from": "aurigraph",
    "to": "ethereum",
    "amount": 0.01,
    "recipient": "<eth-address>"
  }'
# Monitor transaction to completion

# 2. Verify bridge balances match
curl -s https://dlt.aurigraph.io/api/v11/bridge/audit | jq '.discrepancies'
# Expected: []

# 3. Check oracle data freshness
curl -s https://dlt.aurigraph.io/api/v11/oracle/feeds | \
  jq '.[] | {feed: .name, age: (now - .lastUpdate)}'
# Expected: age < 300 seconds

# 4. Verify validator consensus
curl -s https://dlt.aurigraph.io/api/v11/bridge/validator-states | \
  jq '[.[] | .stateRoot] | unique | length'
# Expected: 1 (all validators agree)

# 5. Check bridge metrics
curl -s https://dlt.aurigraph.io/q/metrics | grep "bridge_"
```

#### Rollback Procedures
```bash
# 1. Revert RPC endpoint change
kubectl set env deployment/aurigraph-v11 -n aurigraph-production \
  ETH_RPC_URL=https://mainnet.infura.io/v3/<original-api-key>

# 2. Re-add removed validator
curl -X POST https://dlt.aurigraph.io/api/v11/bridge/validators \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"validatorId":"<validator-id>","publicKey":"<public-key>"}'

# 3. Restart bridge service
kubectl rollout restart deployment/aurigraph-v11 -n aurigraph-production
```

#### Post-Incident Actions
1. **Analyze bridge transaction logs** for patterns
2. **Review oracle service reliability**
3. **Update RPC failover configuration**
4. **Implement bridge balance monitoring alerts**
5. **Schedule bridge security audit**
6. **Document bridge failure scenarios**

---

## AI/ML Service Management

### Runbook: AI Optimization Service Failure

#### Detection/Symptoms
- AI service not responding
- ML model predictions stale
- Transaction ordering not optimized
- Model accuracy degraded
- Training pipeline failure

#### Root Cause Analysis Steps

**Step 1: Check AI Service Status**
```bash
# Check AI service health
curl -s https://dlt.aurigraph.io/api/v11/ai/health | jq

# Check model status
curl -s https://dlt.aurigraph.io/api/v11/ai/models | jq

# Check prediction latency
curl -s https://dlt.aurigraph.io/api/v11/ai/metrics | jq '.predictionLatency'

# Check model accuracy
curl -s https://dlt.aurigraph.io/api/v11/ai/accuracy | jq
```

**Step 2: Check ML Model Files**
```bash
# List model files
kubectl exec -n aurigraph-production <pod-name> -- ls -lh /app/models/

# Check model timestamps
kubectl exec -n aurigraph-production <pod-name> -- stat /app/models/transaction-ordering.model

# Verify model file integrity
kubectl exec -n aurigraph-production <pod-name> -- md5sum /app/models/*.model
```

**Step 3: Check Training Pipeline**
```bash
# Check training job status
kubectl get jobs -n aurigraph-production -l component=ml-training

# Check training logs
kubectl logs -n aurigraph-production job/ml-training-20251112 --tail=100

# Check training data availability
curl -s https://dlt.aurigraph.io/api/v11/ai/training-data-status | jq
```

#### Resolution Procedures

**Scenario 1: Model File Corrupted**
```bash
# 1. Verify corruption
kubectl exec -n aurigraph-production <pod-name> -- \
  python -c "import pickle; pickle.load(open('/app/models/transaction-ordering.model', 'rb'))"
# If error, file is corrupted

# 2. Restore from backup
kubectl cp backup/transaction-ordering.model aurigraph-production/<pod-name>:/app/models/

# 3. Restart AI service
kubectl rollout restart deployment/aurigraph-v11 -n aurigraph-production

# 4. Verify model loading
kubectl logs -n aurigraph-production <pod-name> | grep "Model loaded successfully"

# 5. Test predictions
curl -X POST https://dlt.aurigraph.io/api/v11/ai/predict \
  -H "Content-Type: application/json" \
  -d '{"transactions":[...]}'
```

**Scenario 2: Model Accuracy Degraded**
```bash
# 1. Check current accuracy
curl -s https://dlt.aurigraph.io/api/v11/ai/accuracy | jq

# 2. Compare with baseline
# If accuracy dropped >10%, retrain model

# 3. Trigger model retraining
kubectl create job ml-training-adhoc-$(date +%Y%m%d%H%M) -n aurigraph-production \
  --from=cronjob/ml-training

# 4. Monitor training progress
kubectl logs -n aurigraph-production job/ml-training-adhoc-$(date +%Y%m%d%H%M) -f

# 5. Deploy new model once training completes
kubectl cp ml-training-pod:/tmp/new-model.pkl aurigraph-production/<pod-name>:/app/models/transaction-ordering.model
kubectl rollout restart deployment/aurigraph-v11 -n aurigraph-production
```

**Scenario 3: Prediction Latency Spike**
```bash
# 1. Check prediction latency
curl -s https://dlt.aurigraph.io/api/v11/ai/metrics | jq '.predictionLatency'
# If >100ms, optimization needed

# 2. Check if model is too large
kubectl exec -n aurigraph-production <pod-name> -- ls -lh /app/models/
# If >100MB, consider model compression

# 3. Enable model caching
kubectl set env deployment/aurigraph-v11 -n aurigraph-production \
  AI_PREDICTION_CACHE_ENABLED=true \
  AI_PREDICTION_CACHE_SIZE=10000

# 4. Use quantized model for faster inference
# Replace full-precision model with INT8 quantized version
kubectl cp models/transaction-ordering-quantized.model \
  aurigraph-production/<pod-name>:/app/models/transaction-ordering.model

# 5. Scale AI service horizontally
kubectl scale deployment aurigraph-v11 -n aurigraph-production --replicas=5
```

**Scenario 4: Training Pipeline Failure**
```bash
# 1. Check training job logs
kubectl logs -n aurigraph-production job/ml-training-20251112 | grep ERROR

# 2. Check training data availability
kubectl exec -n aurigraph-production ml-training-pod -- ls -lh /data/training/

# 3. If data missing, restore from S3
kubectl run aws-cli --image=amazon/aws-cli --rm -it -- \
  s3 sync s3://aurigraph-ml-data/training/ /data/training/

# 4. Restart training job
kubectl delete job ml-training-20251112 -n aurigraph-production
kubectl create job ml-training-20251112-retry -n aurigraph-production \
  --from=cronjob/ml-training

# 5. Monitor training completion
kubectl logs -n aurigraph-production job/ml-training-20251112-retry -f
```

**Scenario 5: Feature Engineering Failure**
```bash
# 1. Check feature extraction logs
kubectl logs -n aurigraph-production deployment/aurigraph-v11 | grep "feature extraction"

# 2. Verify raw data availability
curl -s https://dlt.aurigraph.io/api/v11/analytics/raw-data-status | jq

# 3. Test feature extraction manually
kubectl exec -n aurigraph-production <pod-name> -- \
  python /app/ml/feature_extractor.py --test

# 4. If failure persists, check dependencies
kubectl exec -n aurigraph-production <pod-name> -- pip list | grep numpy

# 5. Restart with dependency fix
# Update Dockerfile to pin dependency versions
docker build -t aurigraph/v11:11.5.1 .
docker push aurigraph/v11:11.5.1
kubectl set image deployment/aurigraph-v11 -n aurigraph-production \
  aurigraph-v11=aurigraph/v11:11.5.1
```

#### Verification/Testing
```bash
# 1. Verify AI service health
curl -s https://dlt.aurigraph.io/api/v11/ai/health | jq '.status'
# Expected: "HEALTHY"

# 2. Test predictions
curl -X POST https://dlt.aurigraph.io/api/v11/ai/predict \
  -H "Content-Type: application/json" \
  -d '{"transactions":[{"id":1,"priority":5},{"id":2,"priority":3}]}' | jq
# Expected: Ordered transactions

# 3. Check prediction latency
curl -w "Time: %{time_total}s\n" -X POST https://dlt.aurigraph.io/api/v11/ai/predict \
  -H "Content-Type: application/json" \
  -d '{"transactions":[...]}'
# Expected: <100ms

# 4. Verify model accuracy
curl -s https://dlt.aurigraph.io/api/v11/ai/accuracy | jq '.accuracy'
# Expected: >0.85

# 5. Check TPS improvement from AI optimization
curl -s https://dlt.aurigraph.io/api/v11/stats | jq '.tps'
# Expected: >1000000 (with AI optimization)
```

#### Rollback Procedures
```bash
# 1. Restore previous model
kubectl cp backup/transaction-ordering-v1.0.model \
  aurigraph-production/<pod-name>:/app/models/transaction-ordering.model

# 2. Disable AI optimization temporarily
kubectl set env deployment/aurigraph-v11 -n aurigraph-production \
  AI_OPTIMIZATION_ENABLED=false

# 3. Restart service
kubectl rollout restart deployment/aurigraph-v11 -n aurigraph-production

# 4. Verify fallback to default transaction ordering
curl -s https://dlt.aurigraph.io/api/v11/ai/status | jq '.optimizationEnabled'
# Expected: false
```

#### Post-Incident Actions
1. **Analyze training data quality** and distribution
2. **Review model versioning** and rollback procedures
3. **Implement A/B testing** for new models
4. **Set up model performance monitoring** dashboard
5. **Document model training pipelines**
6. **Schedule ML system review**

---

## Conclusion

This master runbook provides comprehensive operational procedures for managing the Aurigraph DLT V11 platform. Each runbook follows a consistent structure:

1. **Detection/Symptoms** - How to identify the issue
2. **Root Cause Analysis** - Steps to diagnose the problem
3. **Resolution Procedures** - Detailed fix procedures for common scenarios
4. **Verification/Testing** - Steps to confirm the issue is resolved
5. **Rollback Procedures** - How to undo changes if needed
6. **Post-Incident Actions** - Follow-up tasks and learnings

### Best Practices
- Always backup before making changes
- Document every action taken during incidents
- Follow the principle of least privilege
- Test changes in staging before production
- Monitor metrics after making changes
- Update runbooks based on real incidents
- Schedule regular runbook reviews and drills

### Related Documentation
- [INCIDENT_RESPONSE_PLAYBOOK.md](./INCIDENT_RESPONSE_PLAYBOOK.md) - Detailed incident response procedures
- [ARCHITECTURE.md](./ARCHITECTURE.md) - System architecture overview
- [PRODUCTION-RUNBOOK.md](./aurigraph-av10-7/aurigraph-v11-standalone/PRODUCTION-RUNBOOK.md) - Quick reference production guide

---

**Document Version:** 1.0.0
**Last Updated:** November 12, 2025
**Next Review:** February 12, 2026
**Maintainer:** Aurigraph Operations Team
**Feedback:** ops@aurigraph.io
