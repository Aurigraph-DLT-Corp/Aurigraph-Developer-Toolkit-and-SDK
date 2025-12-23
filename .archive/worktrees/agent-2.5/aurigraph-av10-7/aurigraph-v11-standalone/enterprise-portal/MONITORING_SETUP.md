# Enterprise Portal Monitoring & Alerting Setup

## Overview

Comprehensive monitoring and alerting solution for the Aurigraph Enterprise Portal V4.3.2 production deployment.

**Production URL**: https://dlt.aurigraph.io
**Created**: October 19, 2025
**Status**: Configuration Ready

---

## Monitoring Stack

### Components
1. **Prometheus** - Metrics collection
2. **Grafana** - Visualization dashboards
3. **Alertmanager** - Alert routing
4. **Node Exporter** - System metrics
5. **NGINX Exporter** - Web server metrics
6. **Uptime Kuma** - Uptime monitoring

---

## 1. Prometheus Setup

### Installation

```bash
# On dlt.aurigraph.io server
sudo apt update
sudo apt install -y prometheus prometheus-node-exporter

# Create Prometheus user and directories
sudo useradd --no-create-home --shell /bin/false prometheus
sudo mkdir -p /etc/prometheus /var/lib/prometheus
sudo chown prometheus:prometheus /etc/prometheus /var/lib/prometheus
```

### Configuration

Create `/etc/prometheus/prometheus.yml`:

```yaml
global:
  scrape_interval: 15s
  evaluation_interval: 15s
  external_labels:
    cluster: 'aurigraph-production'
    environment: 'production'

# Alertmanager configuration
alerting:
  alertmanagers:
    - static_configs:
        - targets: ['localhost:9093']

# Load alerting rules
rule_files:
  - '/etc/prometheus/rules/*.yml'

# Scrape configurations
scrape_configs:
  # Prometheus itself
  - job_name: 'prometheus'
    static_configs:
      - targets: ['localhost:9090']

  # Node Exporter (system metrics)
  - job_name: 'node'
    static_configs:
      - targets: ['localhost:9100']

  # NGINX Exporter
  - job_name: 'nginx'
    static_configs:
      - targets: ['localhost:9113']

  # Aurigraph V11 Backend
  - job_name: 'aurigraph-v11'
    metrics_path: '/q/metrics'
    static_configs:
      - targets: ['localhost:9003']

  # Enterprise Portal (custom metrics)
  - job_name: 'enterprise-portal'
    static_configs:
      - targets: ['localhost:9091']
```

### Alerting Rules

Create `/etc/prometheus/rules/alerts.yml`:

```yaml
groups:
  - name: aurigraph_alerts
    interval: 30s
    rules:
      # Service Down Alerts
      - alert: BackendDown
        expr: up{job="aurigraph-v11"} == 0
        for: 1m
        labels:
          severity: critical
        annotations:
          summary: "Aurigraph V11 backend is down"
          description: "The Aurigraph V11 backend service has been down for more than 1 minute"

      - alert: NginxDown
        expr: up{job="nginx"} == 0
        for: 1m
        labels:
          severity: critical
        annotations:
          summary: "NGINX is down"
          description: "NGINX web server has been down for more than 1 minute"

      # Performance Alerts
      - alert: HighCPUUsage
        expr: 100 - (avg by (instance) (rate(node_cpu_seconds_total{mode="idle"}[5m])) * 100) > 80
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "High CPU usage detected"
          description: "CPU usage is above 80% for more than 5 minutes"

      - alert: HighMemoryUsage
        expr: (1 - (node_memory_MemAvailable_bytes / node_memory_MemTotal_bytes)) * 100 > 85
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "High memory usage detected"
          description: "Memory usage is above 85% for more than 5 minutes"

      - alert: DiskSpaceLow
        expr: (1 - (node_filesystem_avail_bytes / node_filesystem_size_bytes)) * 100 > 85
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "Disk space running low"
          description: "Disk space usage is above 85%"

      # Application Alerts
      - alert: HighResponseTime
        expr: histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m])) > 1
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "High API response time"
          description: "95th percentile response time is above 1 second"

      - alert: HighErrorRate
        expr: rate(http_requests_total{status=~"5.."}[5m]) > 0.05
        for: 5m
        labels:
          severity: critical
        annotations:
          summary: "High error rate detected"
          description: "Error rate (5xx responses) is above 5%"

      # SSL Certificate Expiry
      - alert: SSLCertificateExpiringSoon
        expr: (ssl_certificate_expiry_seconds - time()) / 86400 < 30
        for: 1h
        labels:
          severity: warning
        annotations:
          summary: "SSL certificate expiring soon"
          description: "SSL certificate will expire in less than 30 days"
```

### Start Prometheus

```bash
sudo systemctl enable prometheus
sudo systemctl start prometheus
sudo systemctl status prometheus

# Verify Prometheus is running
curl http://localhost:9090/api/v1/status/config
```

---

## 2. Grafana Setup

### Installation

```bash
# Add Grafana repository
sudo apt install -y software-properties-common
sudo add-apt-repository "deb https://packages.grafana.com/oss/deb stable main"
wget -q -O - https://packages.grafana.com/gpg.key | sudo apt-key add -

# Install Grafana
sudo apt update
sudo apt install -y grafana

# Start Grafana
sudo systemctl enable grafana-server
sudo systemctl start grafana-server
```

### Configuration

Edit `/etc/grafana/grafana.ini`:

```ini
[server]
protocol = http
http_addr = 0.0.0.0
http_port = 3000
domain = dlt.aurigraph.io
root_url = https://dlt.aurigraph.io/grafana/

[security]
admin_user = admin
admin_password = <strong-password>
disable_gravatar = true

[auth]
disable_login_form = false
oauth_auto_login = false

[auth.anonymous]
enabled = false
```

### NGINX Proxy for Grafana

Add to `/etc/nginx/sites-available/aurigraph-portal`:

```nginx
# Grafana Dashboard
location /grafana/ {
    proxy_pass http://localhost:3000/;
    proxy_http_version 1.1;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto https;
    proxy_read_timeout 90;
}
```

Reload NGINX:
```bash
sudo nginx -t && sudo systemctl reload nginx
```

### Add Prometheus Data Source

1. Access Grafana: `https://dlt.aurigraph.io/grafana/`
2. Login with admin credentials
3. Navigate to: Configuration → Data Sources → Add data source
4. Select **Prometheus**
5. Configure:
   - **Name**: Prometheus
   - **URL**: http://localhost:9090
   - **Access**: Server (default)
6. Click **Save & Test**

---

## 3. Pre-built Dashboards

### Dashboard 1: System Overview

Import dashboard ID: **1860** (Node Exporter Full)

```bash
# Or import via API
curl -X POST https://dlt.aurigraph.io/grafana/api/dashboards/import \
  -H "Content-Type: application/json" \
  -u "admin:password" \
  -d '{
    "dashboard": {
      "id": null,
      "uid": "system-overview",
      "title": "Aurigraph System Overview",
      "panels": [...]
    },
    "overwrite": true,
    "inputs": [
      {
        "name": "DS_PROMETHEUS",
        "type": "datasource",
        "pluginId": "prometheus",
        "value": "Prometheus"
      }
    ]
  }'
```

### Dashboard 2: Enterprise Portal Metrics

Create custom dashboard with panels:
- **Portal Uptime**: `up{job="nginx"}`
- **Request Rate**: `rate(http_requests_total[5m])`
- **Error Rate**: `rate(http_requests_total{status=~"5.."}[5m])`
- **Response Time (P95)**: `histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m]))`
- **Active Users**: `http_active_connections`

### Dashboard 3: Aurigraph V11 Backend

Panels:
- **TPS (Transactions Per Second)**: `rate(transactions_total[1m])`
- **Backend Health**: `up{job="aurigraph-v11"}`
- **JVM Memory**: `jvm_memory_used_bytes`
- **GC Time**: `rate(jvm_gc_pause_seconds_sum[1m])`
- **Thread Count**: `jvm_threads_current`

---

## 4. Alertmanager Setup

### Installation

```bash
sudo apt install -y prometheus-alertmanager
```

### Configuration

Create `/etc/prometheus/alertmanager.yml`:

```yaml
global:
  resolve_timeout: 5m

# Define notification routes
route:
  receiver: 'email-notifications'
  group_by: ['alertname', 'cluster', 'service']
  group_wait: 10s
  group_interval: 10s
  repeat_interval: 12h
  routes:
    - match:
        severity: critical
      receiver: 'critical-notifications'
      continue: true
    - match:
        severity: warning
      receiver: 'warning-notifications'

# Notification receivers
receivers:
  - name: 'email-notifications'
    email_configs:
      - to: 'subbu@aurigraph.io'
        from: 'alerts@aurigraph.io'
        smarthost: 'smtp.gmail.com:587'
        auth_username: 'alerts@aurigraph.io'
        auth_password: '<app-password>'
        headers:
          Subject: '[Aurigraph] {{ .Status | toUpper }}: {{ .GroupLabels.alertname }}'

  - name: 'critical-notifications'
    email_configs:
      - to: 'subbu@aurigraph.io'
        from: 'alerts@aurigraph.io'
        smarthost: 'smtp.gmail.com:587'
        auth_username: 'alerts@aurigraph.io'
        auth_password: '<app-password>'
        headers:
          Subject: '[CRITICAL] {{ .GroupLabels.alertname }}'
    # Optional: Add Slack webhook
    slack_configs:
      - api_url: 'https://hooks.slack.com/services/YOUR/WEBHOOK/URL'
        channel: '#alerts'
        title: 'Critical Alert: {{ .GroupLabels.alertname }}'
        text: '{{ range .Alerts }}{{ .Annotations.description }}{{ end }}'

  - name: 'warning-notifications'
    email_configs:
      - to: 'subbu@aurigraph.io'
        from: 'alerts@aurigraph.io'
        smarthost: 'smtp.gmail.com:587'
        auth_username: 'alerts@aurigraph.io'
        auth_password: '<app-password>'

# Inhibition rules (prevent duplicate alerts)
inhibit_rules:
  - source_match:
      severity: 'critical'
    target_match:
      severity: 'warning'
    equal: ['alertname', 'instance']
```

### Start Alertmanager

```bash
sudo systemctl enable prometheus-alertmanager
sudo systemctl start prometheus-alertmanager
sudo systemctl status prometheus-alertmanager
```

---

## 5. Uptime Monitoring (Uptime Kuma)

### Installation

```bash
# Install Node.js (if not already installed)
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Install Uptime Kuma
cd /opt
sudo git clone https://github.com/louislam/uptime-kuma.git
cd uptime-kuma
sudo npm run setup

# Create systemd service
sudo tee /etc/systemd/system/uptime-kuma.service <<EOF
[Unit]
Description=Uptime Kuma
After=network.target

[Service]
Type=simple
User=subbu
WorkingDirectory=/opt/uptime-kuma
ExecStart=/usr/bin/node server/server.js
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
EOF

# Start service
sudo systemctl enable uptime-kuma
sudo systemctl start uptime-kuma
```

### Configure Monitoring

Access: `http://localhost:3001`

**Monitors to Add**:
1. **Enterprise Portal HTTPS**
   - Type: HTTPS
   - URL: https://dlt.aurigraph.io
   - Interval: 60 seconds
   - Retries: 3

2. **API Health Endpoint**
   - Type: HTTP(s) - Keyword
   - URL: https://dlt.aurigraph.io/api/v11/health
   - Keyword: "HEALTHY"
   - Interval: 30 seconds

3. **Backend Direct**
   - Type: HTTP - Keyword
   - URL: http://localhost:9003/api/v11/health
   - Keyword: "HEALTHY"
   - Interval: 30 seconds

4. **SSL Certificate Expiry**
   - Type: Certificate
   - URL: https://dlt.aurigraph.io
   - Days Remaining: 30

---

## 6. Log Aggregation (Optional)

### Loki + Promtail Setup

```bash
# Download Loki
cd /tmp
wget https://github.com/grafana/loki/releases/download/v2.9.0/loki-linux-amd64.zip
unzip loki-linux-amd64.zip
sudo mv loki-linux-amd64 /usr/local/bin/loki

# Download Promtail
wget https://github.com/grafana/loki/releases/download/v2.9.0/promtail-linux-amd64.zip
unzip promtail-linux-amd64.zip
sudo mv promtail-linux-amd64 /usr/local/bin/promtail

# Create configuration directories
sudo mkdir -p /etc/loki /etc/promtail
```

Create `/etc/loki/config.yml`:

```yaml
auth_enabled: false

server:
  http_listen_port: 3100

ingester:
  lifecycler:
    ring:
      kvstore:
        store: inmemory
      replication_factor: 1

schema_config:
  configs:
    - from: 2024-01-01
      store: boltdb-shipper
      object_store: filesystem
      schema: v11
      index:
        prefix: index_
        period: 24h

storage_config:
  boltdb_shipper:
    active_index_directory: /var/lib/loki/index
    cache_location: /var/lib/loki/cache
  filesystem:
    directory: /var/lib/loki/chunks
```

Create `/etc/promtail/config.yml`:

```yaml
server:
  http_listen_port: 9080

positions:
  filename: /var/lib/promtail/positions.yaml

clients:
  - url: http://localhost:3100/loki/api/v1/push

scrape_configs:
  - job_name: nginx
    static_configs:
      - targets:
          - localhost
        labels:
          job: nginx
          __path__: /var/log/nginx/*log

  - job_name: aurigraph
    static_configs:
      - targets:
          - localhost
        labels:
          job: aurigraph
          __path__: /opt/aurigraph-v11/logs/*.log
```

---

## 7. Health Check Scripts

### Create Monitoring Script

Create `/opt/monitoring/health-check.sh`:

```bash
#!/bin/bash
# Health check script for Aurigraph Enterprise Portal

LOG_FILE="/var/log/aurigraph-health-check.log"

log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOG_FILE"
}

check_portal() {
    HTTP_CODE=$(curl -k -s -o /dev/null -w "%{http_code}" https://dlt.aurigraph.io/)
    if [ "$HTTP_CODE" -eq 200 ]; then
        log "✅ Portal: HEALTHY (HTTP $HTTP_CODE)"
        return 0
    else
        log "❌ Portal: UNHEALTHY (HTTP $HTTP_CODE)"
        return 1
    fi
}

check_api() {
    RESPONSE=$(curl -k -s https://dlt.aurigraph.io/api/v11/health)
    if echo "$RESPONSE" | grep -q "HEALTHY"; then
        log "✅ API: HEALTHY"
        return 0
    else
        log "❌ API: UNHEALTHY - $RESPONSE"
        return 1
    fi
}

check_backend() {
    if pgrep -f "aurigraph-v11-standalone" > /dev/null; then
        log "✅ Backend Process: RUNNING"
        return 0
    else
        log "❌ Backend Process: NOT RUNNING"
        return 1
    fi
}

check_nginx() {
    if systemctl is-active --quiet nginx; then
        log "✅ NGINX: RUNNING"
        return 0
    else
        log "❌ NGINX: NOT RUNNING"
        return 1
    fi
}

check_disk_space() {
    USAGE=$(df -h / | tail -1 | awk '{print $5}' | sed 's/%//')
    if [ "$USAGE" -lt 85 ]; then
        log "✅ Disk Space: ${USAGE}% used"
        return 0
    else
        log "⚠️  Disk Space: ${USAGE}% used (WARNING)"
        return 1
    fi
}

check_ssl_expiry() {
    EXPIRY_DATE=$(echo | openssl s_client -connect dlt.aurigraph.io:443 2>/dev/null | openssl x509 -noout -enddate | cut -d= -f2)
    EXPIRY_EPOCH=$(date -d "$EXPIRY_DATE" +%s)
    NOW_EPOCH=$(date +%s)
    DAYS_LEFT=$(( ($EXPIRY_EPOCH - $NOW_EPOCH) / 86400 ))

    if [ "$DAYS_LEFT" -gt 30 ]; then
        log "✅ SSL Certificate: ${DAYS_LEFT} days remaining"
        return 0
    else
        log "⚠️  SSL Certificate: Only ${DAYS_LEFT} days remaining!"
        return 1
    fi
}

# Run all checks
log "========== Starting Health Checks =========="
check_portal
check_api
check_backend
check_nginx
check_disk_space
check_ssl_expiry
log "========== Health Checks Complete =========="
```

Make executable and add to cron:

```bash
sudo chmod +x /opt/monitoring/health-check.sh

# Add to crontab (run every 5 minutes)
(crontab -l 2>/dev/null; echo "*/5 * * * * /opt/monitoring/health-check.sh") | crontab -
```

---

## 8. Deployment Checklist

### Monitoring Infrastructure
- [ ] Install Prometheus and Node Exporter
- [ ] Configure Prometheus scrape targets
- [ ] Create alerting rules
- [ ] Install and configure Grafana
- [ ] Set up NGINX proxy for Grafana
- [ ] Import pre-built dashboards
- [ ] Install and configure Alertmanager
- [ ] Set up email/Slack notifications
- [ ] Install Uptime Kuma
- [ ] Configure uptime monitors
- [ ] Deploy health check script
- [ ] Set up cron jobs

### Access URLs
- **Prometheus**: http://localhost:9090 (internal only)
- **Grafana**: https://dlt.aurigraph.io/grafana/
- **Alertmanager**: http://localhost:9093 (internal only)
- **Uptime Kuma**: http://localhost:3001 (internal only)

---

## 9. Maintenance

### Daily Tasks
- Review Grafana dashboards
- Check alert notifications
- Review health check logs

### Weekly Tasks
- Review disk space trends
- Check for security updates
- Review error logs

### Monthly Tasks
- Review and update alert thresholds
- Test alert notification delivery
- Review SSL certificate expiry dates
- Backup Grafana dashboards and Prometheus data

---

**Document Version**: 1.0
**Created**: October 19, 2025
**Status**: Ready for Implementation

🤖 Generated with [Claude Code](https://claude.com/claude-code)
Co-Authored-By: Claude <noreply@anthropic.com>
