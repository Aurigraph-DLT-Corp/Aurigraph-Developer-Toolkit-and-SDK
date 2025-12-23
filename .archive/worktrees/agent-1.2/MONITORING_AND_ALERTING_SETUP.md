# Aurigraph V11: Monitoring & Alerting Setup Guide

**Date**: November 12, 2025
**Version**: 1.0
**Status**: Configuration Complete - Ready for Deployment

---

## Table of Contents

1. [Overview](#overview)
2. [Architecture](#architecture)
3. [Components](#components)
4. [Installation](#installation)
5. [Configuration](#configuration)
6. [Alerts & Rules](#alerts--rules)
7. [Dashboard Setup](#dashboard-setup)
8. [Notification Channels](#notification-channels)
9. [Troubleshooting](#troubleshooting)
10. [Operations Runbooks](#operations-runbooks)

---

## Overview

The Aurigraph V11 monitoring and alerting stack provides comprehensive observability for:
- **Backend Service**: V11 Quarkus API (port 9003)
- **Database**: PostgreSQL 16 (port 5432)
- **Cache**: Redis (port 6379)
- **Reverse Proxy**: NGINX (ports 80/443)
- **Blockchain**: Consensus, validators, transactions
- **System**: CPU, memory, disk, network
- **Containers**: Docker container health and performance

### Key Capabilities

✅ **Real-Time Metrics Collection**: 15-second scrape intervals for V11, 30-second for other services
✅ **40+ Alert Rules**: Covering all critical system components
✅ **Multi-Channel Notifications**: Slack, Email, PagerDuty
✅ **Custom Dashboards**: Pre-built Grafana dashboards for all services
✅ **30-Day Retention**: Historical data for trend analysis
✅ **Alert Grouping**: Smart grouping and inhibition to reduce noise

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         Metrics Collection Layer                        │
├─────────────────────────────────────────────────────────────────────────┤
│  V11 API          PostgreSQL        Redis           NGINX       System  │
│  (metrics)        (exporter)        (exporter)     (exporter)  (exporter)│
│   :9003            :9187            :9121          :9113       :9100   │
└───────────────┬─────────────┬──────────────┬───────────────┬──────────┘
                │             │              │               │
                └─────────────┴──────────────┴───────────────┘
                            ▼
            ┌──────────────────────────────────────────┐
            │       Prometheus (Metrics DB)            │
            │  • Collects time-series metrics          │
            │  • Evaluates alert rules every 30s       │
            │  • 30-day retention window               │
            │  • Port: 9090                            │
            └──────────────┬───────────────────────────┘
                          ▼
        ┌─────────────────────────────────────────┐
        │    Alert Evaluation & Routing           │
        │ • 40+ alert rules (alert-rules.yml)    │
        │ • Grouping & inhibition rules          │
        │ • Severity-based routing                │
        └────────────┬──────────────────────────┘
                    ▼
    ┌───────────────────────────────────────┐
    │      Alertmanager (Alert Router)      │
    │ • Routes alerts to notification       │
    │   channels based on severity and      │
    │   component                           │
    │ • Port: 9093                          │
    └───────┬──────────────┬──────────────┤
            │              │               │
    ┌───────▼──┐    ┌─────▼─────┐    ┌──▼─────┐
    │   Slack  │    │   Email   │    │ Pager  │
    │ #alerts  │    │  critical │    │ Duty   │
    └──────────┘    └───────────┘    └────────┘
```

---

## Components

### 1. **Prometheus** (Metrics Collection)
- **Role**: Core metrics database and alerting engine
- **Port**: 9090
- **Data Retention**: 30 days
- **Scrape Intervals**:
  - V11 Backend: 10 seconds (most critical)
  - Health Checks: 5 seconds
  - Other Services: 30 seconds
- **Configuration**: `/deployment/prometheus.yml`

### 2. **Grafana** (Visualization)
- **Role**: Create dashboards and view metrics
- **Port**: 3000
- **Admin**: admin/admin (change in production!)
- **Pre-built Dashboards**:
  - V11 Backend Overview
  - Database Performance
  - Blockchain Metrics
  - System Resources
  - Alert Status

### 3. **Alertmanager** (Alert Routing)
- **Role**: Routes alerts to notification channels
- **Port**: 9093
- **Features**:
  - Alert grouping (reduce notification spam)
  - Inhibition rules (suppress dependent alerts)
  - Multiple notification channels
  - Alert silencing capabilities
- **Configuration**: `/deployment/alertmanager.yml`

### 4. **Node Exporter** (System Metrics)
- **Role**: Collects OS-level metrics (CPU, memory, disk, network)
- **Port**: 9100
- **Metrics**: 100+ node/system metrics

### 5. **PostgreSQL Exporter** (Database Metrics)
- **Role**: Collects PostgreSQL performance and health metrics
- **Port**: 9187
- **Metrics**: Connections, queries, cache hit ratio, replication lag

### 6. **Redis Exporter** (Cache Metrics)
- **Role**: Collects Redis performance metrics
- **Port**: 6121
- **Metrics**: Memory usage, operations per second, eviction rate

### 7. **NGINX Exporter** (Reverse Proxy Metrics)
- **Role**: Collects NGINX traffic and performance metrics
- **Port**: 9113
- **Metrics**: Requests, connections, response times

### 8. **cAdvisor** (Container Metrics)
- **Role**: Collects Docker container metrics
- **Port**: 8080
- **Metrics**: CPU, memory, network per container

---

## Installation

### Prerequisites
- Docker and Docker Compose
- 8GB RAM minimum
- 50GB disk space (for Prometheus data)
- Network connectivity between containers

### Step 1: Copy Configuration Files

```bash
# From local development machine
cd /Users/subbujois/subbuworkingdir/Aurigraph-DLT/deployment

# Files needed on remote server:
# - prometheus.yml
# - alert-rules.yml
# - alertmanager.yml
# - docker-compose-monitoring.yml

# Copy to remote server
scp -P 22 prometheus.yml subbu@dlt.aurigraph.io:/opt/monitoring/
scp -P 22 alert-rules.yml subbu@dlt.aurigraph.io:/opt/monitoring/
scp -P 22 alertmanager.yml subbu@dlt.aurigraph.io:/opt/monitoring/
scp -P 22 docker-compose-monitoring.yml subbu@dlt.aurigraph.io:/opt/monitoring/docker-compose.yml
```

### Step 2: Set Environment Variables

```bash
ssh -p 22 subbu@dlt.aurigraph.io << 'EOF'
# Create .env file for Alertmanager
cat > /opt/monitoring/.env << 'ENVEOF'
# Slack
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/YOUR/WEBHOOK/URL

# PagerDuty
PAGERDUTY_SERVICE_KEY=your-pagerduty-service-key

# SMTP (Email notifications)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USERNAME=alerts@dlt.aurigraph.io
SMTP_PASSWORD=your-app-password
ENVEOF

chmod 600 /opt/monitoring/.env
EOF
```

### Step 3: Start Monitoring Stack

```bash
ssh -p 22 subbu@dlt.aurigraph.io << 'EOF'
cd /opt/monitoring

# Pull images
docker-compose pull

# Start services
docker-compose up -d

# Check status
docker-compose ps

# Verify all containers are healthy
sleep 10
docker-compose logs --tail=20
EOF
```

### Step 4: Verify Installation

```bash
# Check Prometheus
curl http://dlt.aurigraph.io:9090/-/healthy

# Check Grafana
curl http://dlt.aurigraph.io:3000/api/health

# Check Alertmanager
curl http://dlt.aurigraph.io:9093/-/healthy
```

---

## Configuration

### Prometheus Scrape Targets

The `prometheus.yml` file configures scrape targets for:

| Service | Port | Interval | Timeout | Purpose |
|---------|------|----------|---------|---------|
| V11 Backend | 9003 | 10s | 5s | API health & metrics |
| Health Check | 9003 | 5s | 3s | Health endpoint |
| PostgreSQL | 9187 | 30s | 10s | Database metrics |
| Node Exporter | 9100 | 30s | 10s | System metrics |
| Redis | 9121 | 30s | 10s | Cache metrics |
| NGINX | 9113 | 30s | 10s | Reverse proxy metrics |
| cAdvisor | 8080 | 30s | 10s | Container metrics |

### Alert Rules

The `alert-rules.yml` file defines 40+ alert rules across categories:

#### **Critical Alerts** (Immediate notification, 1-hour repeat)
- V11 Service Down
- PostgreSQL Down
- Blockchain Not Synced
- Insufficient Validators

#### **Warning Alerts** (5-minute repeat)
- High API Response Time
- High CPU/Memory Usage
- Low Disk Space
- Connection Pool Exhausted
- Consensus Round Stalled

#### **Info Alerts** (12-hour repeat)
- Low Cache Hit Ratio
- Memory Pool Size Warning
- Container Restart Rate

### Alertmanager Routing

Routes are defined in `alertmanager.yml`:

```
Critical Alerts (Severity=critical)
  → Slack #alerts-critical + PagerDuty + Email
  → Wait 0s, repeat every 1h

V11 Team Alerts (Service=v11-api)
  → Slack #v11-alerts + Email
  → Wait 5s, repeat every 4h

Database Alerts (Component=database)
  → Slack #database-alerts + Email
  → Wait 10s, repeat every 6h

System/Ops Alerts (Component=system)
  → Slack #ops-alerts + Email
  → Wait 1m, repeat every 12h
```

---

## Alerts & Rules

### Critical Alerts (Immediate Response Required)

#### 1. **V11ServiceDown**
```yaml
Condition: up{job="v11-backend"} == 0 for 1 minute
Severity: CRITICAL
Impact: API endpoint unavailable, blockchain operations halted
Action: SSH and check service: ps aux | grep java
```

#### 2. **PostgreSQLDown**
```yaml
Condition: up{job="postgres"} == 0 for 1 minute
Severity: CRITICAL
Impact: Database unavailable, V11 cannot operate
Action: Check database status: sudo systemctl status postgresql
```

#### 3. **BlockchainNotSynced**
```yaml
Condition: v11_blockchain_sync_status != 1 for 2 minutes
Severity: CRITICAL
Impact: Potential fork, incorrect blockchain state
Action: Check peer connections and consensus status
```

#### 4. **TooFewValidators**
```yaml
Condition: v11_validators_active < 10 for 2 minutes
Severity: WARNING
Impact: Consensus stability at risk
Action: Check validator status and restart any failed nodes
```

### Performance Alerts (Service Degradation)

#### 1. **HighAPIResponseTime**
```yaml
Condition: response_time_p95 > 1 second for 2 minutes
Severity: WARNING
Impact: Slow API responses
Action: Check database performance and endpoint latency
```

#### 2. **HighCPUUsage**
```yaml
Condition: CPU usage > 80% for 3 minutes
Severity: WARNING
Impact: System slowdown
Action: Check running processes: top -b -n 1
```

#### 3. **HighMemoryUsage**
```yaml
Condition: Memory usage > 80% for 3 minutes
Severity: WARNING
Impact: System slowdown, OOM risk
Action: Check memory usage: free -h
```

#### 4. **DiskSpaceLow**
```yaml
Condition: Free disk < 15% for 5 minutes
Severity: WARNING
Impact: Service failure risk
Action: Check disk usage: df -h
```

---

## Dashboard Setup

### Pre-configured Dashboards

Place dashboard JSON files in `/var/lib/grafana/dashboards/`:

#### **Dashboard 1: V11 Backend Overview**
- Chain Height (gauge)
- Active Validators (number)
- Peers Connected (gauge)
- Network Health Status (color-coded)
- API Response Time (gauge)
- TPS (throughput)
- Consensus Round (counter)
- Finalization Time (gauge)

#### **Dashboard 2: Database Performance**
- Connection Count (gauge)
- Query Response Time (graph)
- Cache Hit Ratio (gauge)
- Database Size (gauge)
- Replication Lag (if applicable)
- Slow Queries (table)

#### **Dashboard 3: System Resources**
- CPU Usage (gauge)
- Memory Usage (gauge)
- Disk Usage (gauge)
- Network I/O (graph)
- Load Average (graph)

#### **Dashboard 4: Alert Status**
- Firing Alerts (table)
- Alert History (graph)
- Alert by Severity (pie chart)
- Alert Response Times (bar chart)

### Creating Custom Dashboards

1. Open Grafana: http://dlt.aurigraph.io:3000
2. Login: admin/admin
3. Click "+" → Dashboard
4. Add panels with PromQL queries
5. Examples:
   ```promql
   # V11 blockchain height
   v11_blockchain_height

   # API response time 95th percentile
   histogram_quantile(0.95, v11_api_request_duration_seconds_bucket)

   # Database connections
   pg_stat_activity_count

   # CPU usage percentage
   100 - (avg by (instance) (irate(node_cpu_seconds_total{mode="idle"}[5m])) * 100)
   ```

---

## Notification Channels

### Slack Integration

#### Setup
```bash
1. Create Slack workspace: https://slack.com/
2. Create channels: #alerts-general, #alerts-critical, #v11-alerts, etc.
3. Create incoming webhook:
   Settings → Apps → Create New App → Incoming Webhooks
4. Copy webhook URL: https://hooks.slack.com/services/...
5. Add to alertmanager.yml: SLACK_WEBHOOK_URL
```

#### Message Format
```
Severity indicators: 🔴 Critical | 🟡 Warning | 🟢 Info
Example:
  🔴 CRITICAL: V11ServiceDown
  V11 backend service at localhost:9003 is not responding
  Impact: API endpoint unavailable, blockchain operations halted
  Action: SSH to dlt.aurigraph.io and check: ps aux | grep java
```

### Email Integration

#### Setup (Gmail)
```bash
1. Enable 2FA on Gmail account
2. Generate app password: https://myaccount.google.com/apppasswords
3. Use app password in alertmanager.yml
4. Set SMTP_HOST: smtp.gmail.com
5. Set SMTP_PORT: 587
```

#### Alert Distribution
- Critical: oncall@dlt.aurigraph.io, critical-alerts@dlt.aurigraph.io
- V11 Team: v11-team@dlt.aurigraph.io
- Database: database-team@dlt.aurigraph.io
- Ops: ops-team@dlt.aurigraph.io

### PagerDuty Integration

#### Setup
```bash
1. Create PagerDuty account and service
2. Get integration key from:
   Services → Select Service → Integrations
3. Add to alertmanager.yml: PAGERDUTY_SERVICE_KEY
4. Set escalation policy for on-call staff
```

#### Escalation Policy
- **Page 1** (Immediate): Primary on-call
- **Page 5 min** (If no ack): Escalate to backup
- **Page 30 min** (If no ack): Manager + Team Lead
- **Auto-resolve**: 1 hour after alert clears

---

## Troubleshooting

### Prometheus Not Collecting Metrics

```bash
# Check Prometheus logs
docker logs prometheus

# Verify scrape targets are healthy
curl http://localhost:9090/api/v1/targets

# Test specific exporter
curl http://localhost:9003/api/v11/metrics
```

### Alertmanager Not Sending Notifications

```bash
# Check Alertmanager logs
docker logs alertmanager

# Verify configuration syntax
curl -X POST http://localhost:9093/-/reload

# Test Slack webhook
curl -X POST -H 'Content-type: application/json' \
  --data '{"text":"Test"}' \
  https://hooks.slack.com/services/YOUR/WEBHOOK/URL
```

### High Disk Usage from Prometheus

```bash
# Check Prometheus data size
du -sh /var/lib/docker/volumes/prometheus-data/_data/

# Options:
# 1. Increase retention (edit prometheus.yml)
# 2. Reduce scrape frequency
# 3. Add external storage (S3, Google Cloud Storage)
# 4. Implement Prometheus downsampling
```

### Missing Metrics

```bash
# Check if V11 service is exporting metrics
curl http://localhost:9003/api/v11/metrics

# If 404: Metrics endpoint not implemented
# Add Quarkus Micrometer extension to V11 backend:
# <dependency>
#   <groupId>io.quarkus</groupId>
#   <artifactId>quarkus-micrometer-registry-prometheus</artifactId>
# </dependency>
```

---

## Operations Runbooks

### Runbook 1: V11 Service Down

**Alert**: V11ServiceDown
**Severity**: CRITICAL
**SLA**: 15 minutes to restore

**Immediate Actions** (0-5 min):
```bash
# 1. Check if service is running
ssh subbu@dlt.aurigraph.io
ps aux | grep "java.*aurigraph-v11"

# 2. Check service logs
tail -100 /home/subbu/v11-service.log

# 3. Check port 9003
netstat -tlnp | grep 9003
```

**Diagnosis** (5-10 min):
```bash
# Check database connectivity
export PGPASSWORD='secure_password_123'
psql -h 127.0.0.1 -p 5432 -U aurigraph -d aurigraph_v11 -c "SELECT 1;"

# Check disk space
df -h /

# Check memory available
free -h

# Check Java process
jps -l | grep Quarkus
```

**Resolution** (10-15 min):
```bash
# Option 1: Restart service
cd /home/subbu
java \
  -Dquarkus.datasource.jdbc.url='jdbc:postgresql://127.0.0.1:5432/aurigraph_v11' \
  -Dquarkus.datasource.username='aurigraph' \
  -Dquarkus.datasource.password='secure_password_123' \
  -Dquarkus.http.port=9003 \
  -Dquarkus.flyway.migrate-at-start=false \
  -jar aurigraph-v11.jar > v11-service.log 2>&1 &

# Option 2: If database is issue
sudo systemctl restart postgresql

# Option 3: Check free disk space
# If low, archive old logs
```

**Verification**:
```bash
# Wait 30 seconds for startup
sleep 30

# Check health endpoint
curl http://localhost:9003/api/v11/health | jq .

# Expected response: "status": "healthy"
```

**Post-Incident**:
- [ ] Document root cause in incident log
- [ ] Update runbook if process changed
- [ ] Schedule follow-up meeting if critical
- [ ] Add preventive monitoring if gap found

---

### Runbook 2: High API Response Time

**Alert**: HighAPIResponseTime
**Severity**: WARNING
**SLA**: 30 minutes to investigate

**Step 1: Verify Alert**
```bash
# Check current response time in Prometheus
curl 'http://localhost:9090/api/v1/query?query=histogram_quantile(0.95,v11_api_request_duration_seconds_bucket)'

# Expected: >1 second
```

**Step 2: Identify Bottleneck**
```bash
# Check database query performance
ssh subbu@dlt.aurigraph.io
export PGPASSWORD='secure_password_123'
psql -h 127.0.0.1 -p 5432 -U aurigraph -d aurigraph_v11 << SQL
-- Show slow queries
SELECT query, mean_time, calls
FROM pg_stat_statements
ORDER BY mean_time DESC
LIMIT 10;
SQL

# Check connection count
psql -h 127.0.0.1 -p 5432 -U aurigraph -d aurigraph_v11 -c "SELECT count(*) FROM pg_stat_activity;"

# Check table sizes
psql -h 127.0.0.1 -p 5432 -U aurigraph -d aurigraph_v11 -c "SELECT schemaname, tablename, pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) FROM pg_tables ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC LIMIT 10;"
```

**Step 3: Implement Quick Fix**
```bash
# Option 1: Add missing indices
psql -h 127.0.0.1 -p 5432 -U aurigraph -d aurigraph_v11 << SQL
-- Create index on frequently queried columns
CREATE INDEX IF NOT EXISTS idx_transactions_block_height
ON transactions(block_height);

CREATE INDEX IF NOT EXISTS idx_blocks_timestamp
ON blocks(timestamp);

-- Analyze tables for query planner
ANALYZE transactions;
ANALYZE blocks;
SQL

# Option 2: Optimize connection pooling
# Increase connection pool in V11 backend

# Option 3: Clear query cache/restart service
# (if other measures don't work)
```

**Step 4: Monitor Improvement**
```bash
# Watch response time for 5 minutes
watch -n 1 'curl -s http://localhost:9090/api/v1/query?query=histogram_quantile\(0.95,v11_api_request_duration_seconds_bucket\) | jq .data.result[0].value[1]'

# Should return to <0.5s
```

---

## Maintenance

### Daily Tasks
- Review overnight alerts in Slack
- Check alert count and trends in Grafana
- Verify backups are running

### Weekly Tasks
- Review alert rules for false positives
- Update runbooks based on incidents
- Test failover procedures
- Review dashboard metrics for anomalies

### Monthly Tasks
- Capacity planning review (disk usage trends)
- Update documentation
- Conduct training/review for on-call team
- Archive old alert data

### Quarterly Tasks
- Full monitoring stack health check
- Update alerting thresholds based on performance data
- Review and update all runbooks
- Disaster recovery drill

---

## References

- **Prometheus Docs**: https://prometheus.io/docs/
- **Grafana Docs**: https://grafana.com/docs/grafana/latest/
- **Alertmanager Docs**: https://prometheus.io/docs/alerting/latest/alertmanager/
- **PromQL Guide**: https://prometheus.io/docs/prometheus/latest/querying/basics/

---

**Document Version**: 1.0
**Last Updated**: 2025-11-12
**Maintenance Owner**: DevOps Team
**Contact**: ops-team@dlt.aurigraph.io

