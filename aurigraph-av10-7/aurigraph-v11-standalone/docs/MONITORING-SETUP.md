# Aurigraph V11 Monitoring Setup Guide

## Overview

This guide covers comprehensive monitoring setup for Aurigraph V11 production deployment including:
- Prometheus metrics collection
- Grafana dashboards
- Health check endpoints
- Performance monitoring
- Security audit logging
- Alert configuration

## Prerequisites

- Prometheus 2.40+
- Grafana 9.0+
- Aurigraph V11 service running on port 9003
- Metrics endpoint enabled: `/q/metrics`
- Health endpoint: `/q/health`

## 1. Prometheus Configuration

### 1.1 Prometheus Server Setup

Create `/etc/prometheus/prometheus.yml`:

```yaml
global:
  scrape_interval: 15s
  evaluation_interval: 15s
  external_labels:
    monitor: 'aurigraph-v11'
    environment: 'production'

scrape_configs:
  - job_name: 'aurigraph-v11'
    metrics_path: '/q/metrics'
    static_configs:
      - targets: ['localhost:9003']

    # Scrape every 10 seconds for detailed metrics
    scrape_interval: 10s
    scrape_timeout: 5s

    # Basic auth if needed
    # basic_auth:
    #   username: 'prometheus'
    #   password: 'secure_password'

  - job_name: 'aurigraph-health'
    metrics_path: '/q/health'
    static_configs:
      - targets: ['localhost:9003']
    scrape_interval: 30s

# Alerting configuration
alerting:
  alertmanagers:
    - static_configs:
        - targets: ['localhost:9093']

# Alert rules
rule_files:
  - '/etc/prometheus/rules/*.yml'
```

### 1.2 Start Prometheus

```bash
docker run -d \
  --name prometheus \
  -p 9090:9090 \
  -v /etc/prometheus:/etc/prometheus \
  -v prometheus_data:/prometheus \
  prom/prometheus:latest \
  --config.file=/etc/prometheus/prometheus.yml \
  --storage.tsdb.path=/prometheus \
  --storage.tsdb.retention.time=30d
```

## 2. Alert Rules Configuration

Create `/etc/prometheus/rules/aurigraph-alerts.yml`:

```yaml
groups:
  - name: aurigraph_alerts
    interval: 30s
    rules:
      # Service Health Alerts
      - alert: AurigraphServiceDown
        expr: up{job="aurigraph-v11"} == 0
        for: 2m
        labels:
          severity: critical
        annotations:
          summary: "Aurigraph V11 service is down"
          description: "Aurigraph service on {{ $labels.instance }} has been unreachable for 2 minutes"

      # High Error Rate
      - alert: HighErrorRate
        expr: rate(http_server_requests_seconds_count{status=~"5.."}[5m]) > 0.05
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "High error rate detected"
          description: "Error rate is {{ $value }} on {{ $labels.instance }}"

      # Database Connection Pool
      - alert: LowDatabaseConnections
        expr: db_connectionpool_size{} < 3
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "Low database connection pool"
          description: "Available connections: {{ $value }}"

      # Memory Usage
      - alert: HighMemoryUsage
        expr: jvm_memory_usage_bytes{area="heap"} / jvm_memory_max_bytes{area="heap"} > 0.85
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "High JVM heap memory usage"
          description: "Heap memory usage: {{ $value | humanizePercentage }}"

      # Redis Connection
      - alert: RedisConnectionLost
        expr: redis_connection_errors_total > 0
        for: 2m
        labels:
          severity: critical
        annotations:
          summary: "Redis connection lost"
          description: "Redis errors detected on {{ $labels.instance }}"

      # gRPC Service Health
      - alert: GrpcServiceUnhealthy
        expr: grpc_server_handled_total{grpc_code!="0"} > 100
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "gRPC service errors detected"
          description: "gRPC errors: {{ $value }}"

      # GraphQL Query Latency
      - alert: HighGraphQLLatency
        expr: histogram_quantile(0.95, rate(graphql_request_duration_ms[5m])) > 500
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "High GraphQL query latency"
          description: "P95 latency: {{ $value }}ms"

      # Certificate Expiry Warning
      - alert: CertificateExpiryWarning
        expr: ssl_certificate_expiry_seconds < 7 * 24 * 60 * 60
        for: 1h
        labels:
          severity: warning
        annotations:
          summary: "SSL certificate expiring soon"
          description: "Certificate expires in {{ $value | humanizeDuration }}"
```

## 3. Grafana Dashboard Setup

### 3.1 Grafana Installation

```bash
docker run -d \
  --name grafana \
  -p 3000:3000 \
  -e GF_SECURITY_ADMIN_PASSWORD=admin \
  -v grafana_storage:/var/lib/grafana \
  grafana/grafana:latest
```

### 3.2 Add Prometheus Data Source

1. Access Grafana: http://localhost:3000
2. Go to Configuration → Data Sources
3. Add Prometheus:
   - URL: http://prometheus:9090
   - Access: Server (default)

### 3.3 Import Aurigraph Dashboard

Create dashboard with panels:

#### Performance Metrics
- **Request Rate**: `rate(http_server_requests_seconds_count[5m])`
- **Response Time (P95)**: `histogram_quantile(0.95, rate(http_server_requests_seconds_bucket[5m]))`
- **Error Rate**: `rate(http_server_requests_seconds_count{status=~"5.."}[5m])`
- **Active Connections**: `http_server_connections_total`

#### Database Health
- **Connection Pool Size**: `db_connectionpool_size{}`
- **Query Latency**: `rate(db_query_duration_ms[5m])`
- **Failed Connections**: `increase(db_connectionpool_errors_total[5m])`
- **Database Size**: `postgres_size_bytes{}`

#### JVM Metrics
- **Heap Memory**: `jvm_memory_usage_bytes{area="heap"}`
- **GC Time**: `rate(jvm_gc_pause_seconds_sum[5m])`
- **Thread Count**: `jvm_threads_current`
- **GC Count**: `rate(jvm_gc_pause_seconds_count[5m])`

#### gRPC Services
- **RPC Calls**: `rate(grpc_server_handled_total[5m])`
- **RPC Latency**: `histogram_quantile(0.95, rate(grpc_server_handling_seconds_bucket[5m]))`
- **RPC Errors**: `rate(grpc_server_handled_total{grpc_code!="0"}[5m])`

#### Cache Performance
- **Cache Hit Rate**: `cache_hits_total / (cache_hits_total + cache_misses_total)`
- **Cache Size**: `redis_memory_used_bytes`
- **Cache Operations**: `rate(redis_commands_processed_total[5m])`

#### Security Metrics
- **Failed Authentication**: `rate(auth_failures_total[5m])`
- **Rate Limit Hits**: `rate(rate_limit_exceeded_total[5m])`
- **Suspicious Requests**: `rate(security_alerts_total[5m])`

## 4. Health Check Monitoring

### 4.1 Health Endpoint

Access health status: `http://localhost:9003/q/health`

**Response Structure:**
```json
{
  "status": "UP",
  "checks": [
    {
      "name": "Database connections health check",
      "status": "UP"
    },
    {
      "name": "Redis connection health check",
      "status": "UP"
    },
    {
      "name": "gRPC Server",
      "status": "UP"
    }
  ]
}
```

### 4.2 Health Check Endpoints

- **Liveness**: `GET /q/health/live` - Service is running
- **Readiness**: `GET /q/health/ready` - Service can accept requests
- **Startup**: `GET /q/health/started` - Startup completed

## 5. Performance Monitoring

### 5.1 Key Metrics to Track

**Transaction Processing:**
- Throughput: `rate(transactions_processed_total[5m])`
- Latency: `histogram_quantile(0.95, rate(transaction_latency_ms_bucket[5m]))`
- Success Rate: `rate(transactions_successful[5m]) / rate(transactions_total[5m])`

**Consensus Performance:**
- Block Production Rate: `rate(blocks_created_total[5m])`
- Consensus Time: `histogram_quantile(0.95, rate(consensus_time_ms_bucket[5m]))`
- Validator Participation: `active_validators / total_validators`

**GraphQL API:**
- Query Latency: `histogram_quantile(0.95, rate(graphql_request_duration_ms_bucket[5m]))`
- Subscription Count: `graphql_subscriptions_active`
- Schema Validation Time: `graphql_schema_validation_ms`

### 5.2 SLA Targets

- P99 Latency: < 100ms
- P95 Latency: < 50ms
- Error Rate: < 0.1%
- Availability: > 99.9%
- Cache Hit Rate: > 80%

## 6. Logging Aggregation

### 6.1 Log Levels Configuration

```properties
# Root logger
quarkus.log.level=INFO

# Component-specific logging
quarkus.log.category."io.aurigraph.v11.consensus".level=DEBUG
quarkus.log.category."io.aurigraph.v11.crypto".level=INFO
quarkus.log.category."io.aurigraph.v11.graphql".level=DEBUG
quarkus.log.category."io.aurigraph.v11.security".level=DEBUG

# Production settings
%prod.quarkus.log.level=INFO
%prod.quarkus.log.category."io.aurigraph.v11.consensus".level=INFO
```

### 6.2 Structured Logging

All logs include:
- Timestamp (ISO-8601)
- Log Level
- Logger Name
- Message
- Stack trace (for errors)
- Context IDs

### 6.3 Log Aggregation Tools

Recommended: ELK Stack or Grafana Loki

**Loki Configuration:**
```yaml
scrape_configs:
  - job_name: aurigraph-v11
    static_configs:
      - targets:
          - localhost
        labels:
          job: aurigraph-v11
          __path__: /var/log/aurigraph/*.log
```

## 7. Security Audit Logging

### 7.1 Audit Events

Logged automatically:
- Authentication attempts (success/failure)
- Authorization checks
- Configuration changes
- Key rotation events
- Certificate updates
- Suspicious activities

### 7.2 Audit Log Format

```json
{
  "timestamp": "2025-12-26T17:00:00Z",
  "event_type": "AUTH_SUCCESS",
  "user": "admin@aurigraph.io",
  "ip_address": "192.168.1.100",
  "resource": "/api/contracts",
  "action": "DEPLOY",
  "result": "SUCCESS",
  "duration_ms": 45,
  "audit_id": "aud-12345"
}
```

## 8. Alerting Best Practices

### 8.1 Alert Routing

- **Critical**: Immediate page (< 5 min response)
- **High**: Urgent notification (< 15 min response)
- **Medium**: Standard notification (< 1 hour response)
- **Low**: Log only

### 8.2 Alert Escalation

1. Slack notification to #aurigraph-alerts
2. PagerDuty escalation after 15 minutes
3. Management escalation after 1 hour

### 8.3 Alert Tuning

- Avoid alert fatigue (too many false positives)
- Use appropriate thresholds
- Include contextual information
- Link to runbooks

## 9. Monitoring Dashboard Checklist

- [ ] Service health status
- [ ] Request/response metrics
- [ ] Error rates and logs
- [ ] Database performance
- [ ] Cache efficiency
- [ ] Memory and CPU usage
- [ ] Network throughput
- [ ] Security alerts
- [ ] Certificate expiry
- [ ] Backup status

## 10. Recommended Tools Stack

| Component | Tool | Purpose |
|-----------|------|---------|
| Metrics | Prometheus | Time-series database |
| Visualization | Grafana | Dashboards & alerting |
| Logging | Loki or ELK | Log aggregation |
| Tracing | Jaeger | Distributed tracing |
| Alerting | Alertmanager | Alert management |
| Uptime | Pingdom | External monitoring |

## 11. Maintenance

### 11.1 Prometheus Maintenance

- Retention: 30 days (adjustable in config)
- Compaction: Automatic
- Backup: Daily snapshots

### 11.2 Grafana Maintenance

- Update dashboards monthly
- Review alert rules quarterly
- Archive old dashboards
- Clean up unused data sources

### 11.3 Regular Checks

- **Daily**: Review critical alerts
- **Weekly**: Review error logs
- **Monthly**: Analyze performance trends
- **Quarterly**: Capacity planning

## Support

For questions or issues with monitoring setup, refer to:
- Prometheus docs: https://prometheus.io/docs/
- Grafana docs: https://grafana.com/docs/
- Aurigraph project documentation
