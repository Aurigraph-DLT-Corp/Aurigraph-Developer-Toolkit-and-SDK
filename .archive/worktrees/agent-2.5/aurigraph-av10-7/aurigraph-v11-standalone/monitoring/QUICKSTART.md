# Monitoring Stack Quick Start Guide

**Version**: 1.0.0
**Stack**: Prometheus + Grafana + Alertmanager + ELK
**Status**: Production Ready

---

## 🚀 Quick Start (5 minutes)

### 1. Start Monitoring Stack

```bash
cd aurigraph-av10-7/aurigraph-v11-standalone
docker-compose -f monitoring/docker-compose-monitoring.yml up -d
```

### 2. Verify Services

```bash
# Check all services are running
docker-compose -f monitoring/docker-compose-monitoring.yml ps

# Expected output: 11 containers running
```

### 3. Access Dashboards

| Service | URL | Credentials |
|---------|-----|-------------|
| **Grafana** | http://localhost:3000 | admin/admin |
| **Prometheus** | http://localhost:9090 | None |
| **Alertmanager** | http://localhost:9093 | None |
| **Kibana** | http://localhost:5601 | None |

### 4. View Metrics

**Grafana Dashboards**:
1. System Health: http://localhost:3000/d/aurigraph-v11-system
2. Application Metrics: http://localhost:3000/d/aurigraph-v11-application

**Prometheus Targets**:
- http://localhost:9090/targets

**Alerts**:
- http://localhost:9090/alerts

---

## 📊 Dashboard Overview

### System Health Dashboard

**Metrics Displayed**:
- Service status (UP/DOWN)
- CPU usage (gauge + timeline)
- Memory usage (gauge + timeline)
- Disk space available
- GC pauses
- Network traffic
- Active threads
- System load average

**Use Case**: Monitor infrastructure health in real-time

### Application Metrics Dashboard

**Metrics Displayed**:
- Current TPS (2M+ target)
- Request rate (req/sec)
- Error rate (errors/sec)
- Success rate (%)
- TPS over time
- Response time distribution (p50, p95, p99)
- HTTP status codes
- Database query performance

**Use Case**: Monitor application performance and SLAs

---

## 🔔 Alert Rules

**24 configured alert rules** across 3 priorities:

### Critical (P0) - Immediate Response
- V11ServiceDown (1m)
- TPSBelowTarget (5m)
- HighErrorRate (5m)
- ConsensusFailure (1m)
- DatabaseConnectionPoolExhausted (2m)

### High Priority (P1) - Urgent
- HighCPUUsage (10m)
- HighMemoryUsage (10m)
- SlowResponseTime (5m)
- And 7 more...

### Medium Priority (P2) - Monitor
- HighDiskUsage (15m)
- HighNetworkTraffic (10m)
- ValidatorNodeDown (5m)
- And 6 more...

**View Active Alerts**:
- Prometheus: http://localhost:9090/alerts
- Alertmanager: http://localhost:9093

---

## 📝 Log Analysis (ELK Stack)

### Kibana Dashboard
http://localhost:5601

### Common Searches

**Error Logs (Last 15 minutes)**:
```
level:ERROR AND timestamp:[now-15m TO now]
```

**Slow Transactions (>1s)**:
```
duration:>1000 AND service:aurigraph-v11
```

**Authentication Failures**:
```
event:auth_failure AND timestamp:[now-1h TO now]
```

---

## 🛠️ Configuration

### Prometheus Configuration
- **File**: `monitoring/prometheus/prometheus.yml`
- **Scrape Interval**: 15s
- **Retention**: 15 days
- **Storage**: 50GB limit

### Alert Rules
- **File**: `monitoring/prometheus/alerts/v11_alerts.yml`
- **Total Rules**: 24 alerts
- **Categories**: Critical (5), High (10), Medium (9)

### Grafana Dashboards
- **Directory**: `monitoring/grafana/dashboards/`
- **Provisioning**: Auto-imported on startup
- **Refresh Rate**: 5 seconds

### ELK Stack
- **Elasticsearch**: 2GB heap, 30-day retention
- **Logstash**: 1GB heap, JSON parsing
- **Kibana**: Full-text search + visualization

---

## 🔧 Common Tasks

### Start Services
```bash
docker-compose -f monitoring/docker-compose-monitoring.yml up -d
```

### Stop Services
```bash
docker-compose -f monitoring/docker-compose-monitoring.yml down
```

### Restart a Service
```bash
docker-compose -f monitoring/docker-compose-monitoring.yml restart prometheus
```

### View Logs
```bash
# All services
docker-compose -f monitoring/docker-compose-monitoring.yml logs -f

# Specific service
docker-compose -f monitoring/docker-compose-monitoring.yml logs -f grafana
```

### Check Resource Usage
```bash
docker stats
```

### Backup Prometheus Data
```bash
# Create backup
docker run --rm -v aurigraph-monitoring_prometheus-data:/data -v $(pwd):/backup alpine tar czf /backup/prometheus-backup-$(date +%Y%m%d).tar.gz /data

# Restore backup
docker run --rm -v aurigraph-monitoring_prometheus-data:/data -v $(pwd):/backup alpine tar xzf /backup/prometheus-backup-YYYYMMDD.tar.gz -C /
```

---

## 🚨 Troubleshooting

### Issue 1: Service Won't Start

**Check logs**:
```bash
docker-compose -f monitoring/docker-compose-monitoring.yml logs [service-name]
```

**Common causes**:
- Port already in use
- Insufficient memory
- Configuration error

### Issue 2: No Metrics in Grafana

**Verify Prometheus is scraping**:
1. Go to http://localhost:9090/targets
2. Check all targets are UP
3. If DOWN, check V11 service is running on port 9003

### Issue 3: High Resource Usage

**Check resource usage**:
```bash
docker stats

# Stop non-essential services
docker-compose -f monitoring/docker-compose-monitoring.yml stop kibana logstash
```

**Reduce Prometheus retention**:
```yaml
# Edit prometheus.yml
storage:
  tsdb:
    retention:
      time: 7d  # Changed from 15d
```

---

## 📈 Performance Metrics

### Expected Resource Usage

| Service | CPU | Memory | Disk |
|---------|-----|--------|------|
| Prometheus | 5-10% | 500MB | 10GB/day |
| Grafana | 2-5% | 200MB | 100MB |
| Elasticsearch | 10-20% | 2GB | 20GB/day |
| Logstash | 5-10% | 1GB | - |
| Other services | <5% | <100MB | - |

**Total**: ~20-40% CPU, ~4GB RAM, ~30GB disk/day

### Optimization Tips

1. **Reduce scrape frequency** (15s → 30s)
2. **Decrease retention** (15d → 7d)
3. **Disable unused exporters**
4. **Use metric relabeling** to reduce cardinality

---

## 🔐 Security

### Change Default Passwords

**Grafana**:
```bash
# After first login, change password
# Settings → Profile → Change Password
```

**Elasticsearch** (if enabling security):
```bash
# Set password
docker exec -it aurigraph-elasticsearch bin/elasticsearch-setup-passwords interactive
```

### Enable TLS

**NGINX Reverse Proxy** (Recommended):
```nginx
server {
    listen 443 ssl;
    server_name grafana.yourdomain.com;

    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;

    location / {
        proxy_pass http://localhost:3000;
    }
}
```

---

## 📚 Additional Resources

### Documentation
- Prometheus: https://prometheus.io/docs/
- Grafana: https://grafana.com/docs/
- Elasticsearch: https://www.elastic.co/guide/

### Runbooks
- Production Deployment: `docs/PRODUCTION-DEPLOYMENT-RUNBOOK.md`
- Sprint 7 Report: `SPRINT_7_EXECUTION_REPORT.md`

### Contact
- Email: ops@aurigraph.io
- Slack: #aurigraph-ops-alerts
- On-call: Available 24/7

---

## ✅ Health Check Checklist

After starting the monitoring stack, verify:

- [ ] Prometheus: http://localhost:9090/-/healthy returns OK
- [ ] Grafana: http://localhost:3000/api/health returns HTTP 200
- [ ] All Prometheus targets UP: http://localhost:9090/targets
- [ ] Grafana dashboards load correctly
- [ ] Elasticsearch: http://localhost:9200/_cluster/health returns green/yellow
- [ ] Kibana: http://localhost:5601/api/status returns HTTP 200
- [ ] Alertmanager: http://localhost:9093/-/healthy returns OK

---

**Setup complete! Your monitoring stack is ready.**

For production deployment, see: `docs/PRODUCTION-DEPLOYMENT-RUNBOOK.md`
