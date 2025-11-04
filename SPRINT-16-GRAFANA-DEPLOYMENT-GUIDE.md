# Sprint 16 Phase 1: Grafana Monitoring Deployment Guide

**Aurigraph V11 Blockchain Platform**
**Date**: November 4, 2025
**Status**: Ready for Deployment

---

## Table of Contents

1. [Overview](#overview)
2. [Prerequisites](#prerequisites)
3. [Quick Start](#quick-start)
4. [Detailed Setup](#detailed-setup)
5. [Dashboard Specifications](#dashboard-specifications)
6. [Alert Rules Configuration](#alert-rules-configuration)
7. [Validation Checklist](#validation-checklist)
8. [Troubleshooting](#troubleshooting)
9. [Production Deployment](#production-deployment)

---

## Overview

### Deliverables

**5 Grafana Dashboards with 49 Total Panels:**

1. **Blockchain Network Overview** (8 panels)
   - Network health, active nodes, latency, TPS, consensus metrics

2. **Validator Performance** (10 panels)
   - Validator stats, stake, uptime, rewards, slashing events

3. **AI & ML Optimization** (9 panels)
   - Model accuracy, predictions, training, anomaly detection

4. **System & Infrastructure Health** (12 panels)
   - CPU, memory, JVM, disk, network, HTTP metrics

5. **Real-World Assets & Tokenization** (10 panels)
   - RWA portfolio, token supply, mint/burn, compliance

**24 Alert Rules:**
- 8 Critical alerts (network, consensus, infrastructure)
- 12 Warning alerts (performance, resources)
- 4 Info alerts (events, milestones)

### Architecture

```
┌─────────────────────────────────────────────────────────┐
│                   Grafana Dashboards                    │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │  Network     │  │  Validator   │  │    AI/ML     │  │
│  │  Overview    │  │  Performance │  │ Optimization │  │
│  └──────────────┘  └──────────────┘  └──────────────┘  │
│  ┌──────────────┐  ┌──────────────┐                    │
│  │   System &   │  │  RWA & Token │                    │
│  │Infrastructure│  │  Management  │                    │
│  └──────────────┘  └──────────────┘                    │
└─────────────────────────────────────────────────────────┘
                         ↓ (Query)
┌─────────────────────────────────────────────────────────┐
│                   Prometheus Server                     │
│              Scrape Interval: 15s                       │
│              Retention: 30 days                         │
└─────────────────────────────────────────────────────────┘
                         ↓ (Scrape)
┌─────────────────────────────────────────────────────────┐
│              Aurigraph V11 Backend (Port 9003)          │
│              /q/metrics (Prometheus format)             │
└─────────────────────────────────────────────────────────┘
```

---

## Prerequisites

### Required Software

- **Grafana**: v8.0+ (tested on v12.1.0-pre)
- **Prometheus**: v2.0+ (running on localhost:9090)
- **Python 3**: v3.8+ (for import scripts)
- **curl**: For API calls
- **jq**: For JSON processing

### Environment Setup

```bash
# Install dependencies (macOS)
brew install grafana prometheus jq

# Start services
brew services start grafana
brew services start prometheus

# Verify services are running
curl http://localhost:3000/api/health  # Grafana
curl http://localhost:9090/-/healthy   # Prometheus
```

### Aurigraph V11 Backend

Ensure the V11 backend is running and exposing Prometheus metrics:

```bash
cd aurigraph-av10-7/aurigraph-v11-standalone
./mvnw quarkus:dev

# Verify metrics endpoint
curl http://localhost:9003/q/metrics
```

---

## Quick Start

### Option 1: Automated Setup (Recommended)

```bash
# 1. Navigate to project directory
cd /Users/subbujois/subbuworkingdir/Aurigraph-DLT

# 2. Set Grafana credentials (if not default)
export GRAFANA_USER="admin"
export GRAFANA_PASSWORD="your-password"

# 3. Run setup script
./setup-grafana-monitoring.sh

# 4. Import dashboards
python3 import-grafana-dashboards.py

# 5. Access Grafana
open http://localhost:3000
```

### Option 2: Manual Setup

See [Detailed Setup](#detailed-setup) section below.

---

## Detailed Setup

### Step 1: Configure Grafana Authentication

If you haven't set a Grafana password or forgot it:

```bash
# Reset admin password
grafana-cli admin reset-admin-password newpassword

# Or edit grafana.ini
nano /opt/homebrew/etc/grafana/grafana.ini

# Set admin password
[security]
admin_user = admin
admin_password = your-secure-password
```

Restart Grafana:

```bash
brew services restart grafana
```

### Step 2: Configure Prometheus Data Source

**Via API:**

```bash
curl -X POST http://localhost:3000/api/datasources \
  -u admin:admin \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Prometheus",
    "type": "prometheus",
    "url": "http://localhost:9090",
    "access": "proxy",
    "isDefault": true,
    "jsonData": {
      "httpMethod": "POST",
      "timeInterval": "15s"
    }
  }'
```

**Via UI:**

1. Navigate to: **Configuration** → **Data Sources** → **Add data source**
2. Select **Prometheus**
3. Configure:
   - **Name**: Prometheus
   - **URL**: `http://localhost:9090`
   - **Access**: Server (default)
   - **Scrape interval**: 15s
4. Click **Save & Test**

### Step 3: Import Dashboards

#### Using Python Import Script (Recommended)

```bash
# Install required Python package
pip3 install requests

# Run import script
python3 import-grafana-dashboards.py

# Monitor output for success/failure
```

#### Manual Import via UI

For each dashboard in `SPRINT-16-GRAFANA-DASHBOARDS.json`:

1. Navigate to: **Dashboards** → **Import**
2. Use the Python script to generate Grafana JSON:

```bash
python3 << 'EOF'
import json

# This will be done by the import script
# See import-grafana-dashboards.py for details
EOF
```

3. Paste the generated JSON into the import dialog
4. Select **Prometheus** as the data source
5. Click **Import**

### Step 4: Configure Alert Rules

#### Via Provisioning (Recommended for Production)

```bash
# Copy alert rules to Grafana provisioning directory
sudo mkdir -p /opt/homebrew/etc/grafana/provisioning/alerting
sudo cp grafana-alert-rules.yml /opt/homebrew/etc/grafana/provisioning/alerting/

# Restart Grafana to load alerts
brew services restart grafana
```

#### Manual Configuration via UI

1. Navigate to: **Alerting** → **Alert rules** → **New alert rule**
2. For each alert in `grafana-alert-rules.yml`:
   - Set rule name and folder
   - Configure query condition
   - Set evaluation behavior (interval and duration)
   - Add labels and annotations
   - Configure notification policy

---

## Dashboard Specifications

### Dashboard 1: Blockchain Network Overview

**Purpose**: Real-time blockchain network health and performance metrics
**Refresh Rate**: 5 seconds
**Time Range**: Last 1 hour

**Panels (8 total):**

| Panel | Type | Metric | Thresholds |
|-------|------|--------|------------|
| Network Health Score | Gauge | `blockchain_network_health_score` | 0, 50, 80, 95, 100 |
| Active Nodes | Stat | `count(blockchain_node_status{status="active"})` | - |
| Average Network Latency | Gauge | `avg(blockchain_network_latency_ms)` | - |
| Transactions Per Second | Graph | `rate(blockchain_transactions_total[1m])` | - |
| Node Status Distribution | Pie Chart | `count by(status) (blockchain_node_status)` | - |
| Block Production Rate | Graph | `rate(blockchain_blocks_created_total[5m])` | - |
| Network Connections | Stat | `sum(blockchain_network_connections)` | - |
| Consensus Round Time | Graph | `avg(blockchain_consensus_round_duration_ms)` | - |

### Dashboard 2: Validator Performance

**Purpose**: Validator-specific metrics and rewards tracking
**Refresh Rate**: 30 seconds
**Time Range**: Last 24 hours

**Panels (10 total):**

| Panel | Type | Metric |
|-------|------|--------|
| Active Validators | Stat | `count(validator_status{status="active"})` |
| Total Validator Stake | Stat | `sum(validator_stake_amount) / 1e18` |
| Average Commission Rate | Gauge | `avg(validator_commission_rate) * 100` |
| Average Uptime | Gauge | `avg(validator_uptime_percent)` |
| Slashing Events | Bar Chart | `rate(validator_slashing_events_total[1h])` |
| Validator Earnings | Graph | `sum by(validator_id)(rate(validator_rewards_total[1h]))` |
| Reward Distribution | Pie Chart | `sum by(validator_id)(validator_rewards_total)` |
| Validator APY | Table | `(sum(validator_rewards_total) / sum(validator_stake_amount)) * 365 * 100` |
| Jailing Status | Status | `count by(validator_id)(validator_status{status="jailed"})` |
| Top 10 Validators by Voting Power | Bar Chart | `topk(10, validator_voting_power)` |

### Dashboard 3: AI & ML Optimization

**Purpose**: AI model performance and prediction accuracy metrics
**Refresh Rate**: 10 seconds
**Time Range**: Last 6 hours

**Panels (9 total):**

| Panel | Type | Metric | Thresholds |
|-------|------|--------|------------|
| Active Models | Stat | `count(ai_model_status{status="active"})` | - |
| Average Model Accuracy | Gauge | `avg(ai_model_accuracy_percent)` | 0, 80, 90, 95, 99 |
| Predictions Per Second | Graph | `rate(ai_predictions_total[1m])` | - |
| Model Training Progress | Gauge | `ai_model_training_progress_percent` | - |
| Prediction Latency Distribution | Heatmap | `histogram_quantile(0.99, ai_prediction_latency_ms)` | - |
| Model Confidence Scores | Graph | `avg(ai_prediction_confidence_score)` | - |
| Anomalies Detected | Counter | `rate(ai_anomalies_detected_total[1h])` | - |
| Model Versions | Table | `ai_model_info` | - |
| Inference Queue Depth | Gauge | `ai_inference_queue_depth` | - |

### Dashboard 4: System & Infrastructure Health

**Purpose**: JVM, memory, CPU, disk and application health metrics
**Refresh Rate**: 5 seconds
**Time Range**: Last 4 hours

**Panels (12 total):**

| Panel | Type | Metric | Alert Level |
|-------|------|--------|-------------|
| CPU Usage | Graph | `100 - (avg(rate(node_cpu_seconds_total{mode="idle"}[5m])) * 100)` | warning:80, critical:90 |
| Memory Heap Usage | Graph | `jvm_memory_used_bytes{area="heap"} / 1024 / 1024 / 1024` | - |
| Garbage Collection Time | Graph | `rate(jvm_gc_duration_seconds_sum[5m])` | - |
| Active Threads | Stat | `jvm_threads_current` | - |
| File Descriptor Usage | Gauge | `process_open_fds / process_max_fds * 100` | - |
| Disk Space Usage | Bar Chart | `(node_filesystem_size_bytes - node_filesystem_avail_bytes) / node_filesystem_size_bytes * 100` | - |
| Network I/O | Graph | `rate(node_network_transmit_bytes_total[1m]) + rate(node_network_receive_bytes_total[1m])` | - |
| JVM Uptime | Stat | `jvm_uptime_seconds / 86400` | - |
| HTTP Error Rate | Graph | `rate(http_requests_total{status=~"5.."}[5m]) / rate(http_requests_total[5m]) * 100` | - |
| Exception Count | Counter | `increase(application_exceptions_total[1h])` | - |
| HTTP Response Time Distribution | Heatmap | `histogram_quantile(0.99, http_request_duration_seconds_bucket)` | - |
| HTTP Requests Per Second | Graph | `rate(http_requests_total[1m])` | - |

### Dashboard 5: Real-World Assets & Tokenization

**Purpose**: RWA portfolio and token metrics
**Refresh Rate**: 30 seconds
**Time Range**: Last 7 days

**Panels (10 total):**

| Panel | Type | Metric |
|-------|------|--------|
| Total RWA Portfolio Value | Stat | `sum(rwa_asset_value_usd) / 1e6` |
| Asset Count by Type | Pie Chart | `count by(asset_type) (rwa_asset_info)` |
| Asset Status Distribution | Bar Chart | `count by(status) (rwa_asset_status)` |
| Token Total Supply | Graph | `sum(rwa_token_supply)` |
| Token Circulation Rate | Gauge | `sum(rwa_token_circulating_supply) / sum(rwa_token_supply) * 100` |
| Mint/Burn Events | Graph | `rate(rwa_token_mint_events_total[1h])` / `rate(rwa_token_burn_events_total[1h])` |
| Asset Freeze Status | Status | `count by(asset_id)(rwa_asset_frozen)` |
| Asset Valuation Trends | Graph | `avg(rwa_asset_value_usd) by (asset_type)` |
| Compliance Status | Table | `rwa_asset_compliance_status` |
| Owner Distribution | Pie Chart | `count by(owner_type) (rwa_asset_owner)` |

---

## Alert Rules Configuration

### Critical Alerts (8)

**Response Time**: Immediate action required within 5 minutes

| Alert | Condition | Duration | Description |
|-------|-----------|----------|-------------|
| NetworkHealthCritical | `blockchain_network_health_score < 95` | 2m | Network health below 95% |
| NodeOffline | `up{job="blockchain-node"} == 0` | 5m | Blockchain node is offline |
| HighLatency | `avg(blockchain_network_latency_ms) > 500` | 5m | Network latency exceeds 500ms |
| ConsensusFailure | `blockchain_consensus_round_duration_ms > 60000` | 3m | Consensus round time >60s |
| HighMemoryUsage | `jvm_memory_used_bytes{area="heap"} / jvm_memory_max_bytes{area="heap"} > 0.95` | 2m | Heap memory >95% |
| DiskSpaceCritical | `(1 - node_filesystem_avail_bytes / node_filesystem_size_bytes) > 0.90` | 5m | Disk space >90% |
| APIErrorRateHigh | `rate(http_requests_total{status=~"5.."}[5m]) / rate(http_requests_total[5m]) > 0.05` | 3m | API error rate >5% |
| ValidatorSlashing | `increase(validator_slashing_events_total[1h]) > 3` | 1m | >3 validators slashed in 1h |

### Warning Alerts (12)

**Response Time**: Investigation required within 30 minutes

| Alert | Condition | Duration |
|-------|-----------|----------|
| NetworkHealthWarning | `blockchain_network_health_score < 98` | 10m |
| HighCPU | `100 - (avg(rate(node_cpu_seconds_total{mode="idle"}[5m])) * 100) > 80` | 10m |
| ElevatedLatency | `avg(blockchain_network_latency_ms) > 200` | 10m |
| LowValidatorUptime | `avg(validator_uptime_percent) < 99.9` | 1h |
| MemoryWarning | `jvm_memory_used_bytes{area="heap"} / jvm_memory_max_bytes{area="heap"} > 0.85` | 10m |
| HighGC | `rate(jvm_gc_duration_seconds_sum[5m]) > 0.1` | 10m |
| DiskWarning | `(1 - node_filesystem_avail_bytes / node_filesystem_size_bytes) > 0.80` | 10m |
| LowModelAccuracy | `avg(ai_model_accuracy_percent) < 90` | 30m |
| HighPredictionLatency | `histogram_quantile(0.99, ai_prediction_latency_ms) > 100` | 10m |
| HighResponseTime | `histogram_quantile(0.99, http_request_duration_seconds_bucket) > 1` | 10m |
| TxPoolCongestion | `blockchain_transaction_pool_size > 10000` | 10m |
| RWACompliance | `count(rwa_asset_compliance_status{status="non_compliant"}) > 0` | 1h |

### Info Alerts (4)

**Response Time**: No immediate action required

| Alert | Condition | Description |
|-------|-----------|-------------|
| NewValidator | `increase(validator_status_total[15m]) > 0` | New validator joined network |
| HighTPSAchieved | `rate(blockchain_transactions_total[1m]) > 1000000` | TPS exceeded 1M |
| NewRWAAsset | `increase(rwa_asset_info[15m]) > 0` | New RWA asset tokenized |
| ModelRetrained | `changes(ai_model_info[15m]) > 0` | AI model retrained/updated |

### Notification Channels

Configure notification channels for alerts:

```bash
# Slack notification channel (example)
curl -X POST http://localhost:3000/api/alert-notifications \
  -u admin:admin \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Slack - Critical Alerts",
    "type": "slack",
    "isDefault": false,
    "sendReminder": true,
    "settings": {
      "url": "https://hooks.slack.com/services/YOUR/WEBHOOK/URL",
      "recipient": "#aurigraph-alerts",
      "mentionChannel": "here"
    }
  }'
```

---

## Validation Checklist

### Pre-Deployment Validation

- [ ] Grafana running and accessible at `http://localhost:3000`
- [ ] Prometheus running and accessible at `http://localhost:9090`
- [ ] Aurigraph V11 backend running on port 9003
- [ ] Metrics endpoint responding: `curl http://localhost:9003/q/metrics`
- [ ] Grafana authentication working
- [ ] Python 3 and `requests` library installed
- [ ] All required scripts present and executable

### Post-Import Validation

**Dashboard Import Status:**

- [ ] Dashboard 1: Blockchain Network Overview imported ✓
- [ ] Dashboard 2: Validator Performance imported ✓
- [ ] Dashboard 3: AI & ML Optimization imported ✓
- [ ] Dashboard 4: System & Infrastructure Health imported ✓
- [ ] Dashboard 5: Real-World Assets & Tokenization imported ✓

**Panel Count Verification:**

```bash
# Total panels should be 49
Dashboard 1: 8 panels
Dashboard 2: 10 panels
Dashboard 3: 9 panels
Dashboard 4: 12 panels
Dashboard 5: 10 panels
Total: 49 panels ✓
```

**Data Source Configuration:**

- [ ] Prometheus data source configured
- [ ] Data source set as default
- [ ] Connection test passed
- [ ] Scrape interval: 15s

**Panel Functionality:**

For each dashboard, verify:

- [ ] All panels loading without errors
- [ ] Queries returning data (or appropriate "No Data" message)
- [ ] Visualizations rendering correctly
- [ ] Thresholds configured properly
- [ ] Units displayed correctly (%, ms, TPS, GB, etc.)
- [ ] Time ranges appropriate for panel type
- [ ] Refresh rates functioning

**Alert Rules:**

- [ ] 8 Critical alerts configured
- [ ] 12 Warning alerts configured
- [ ] 4 Info alerts configured
- [ ] Total: 24 alert rules ✓
- [ ] Alert notification channels configured
- [ ] Test alerts firing correctly

### Performance Validation

```bash
# Generate test metrics from V11 backend
curl -X POST http://localhost:9003/api/v11/performance

# Verify Prometheus is scraping
curl http://localhost:9090/api/v1/targets | jq '.data.activeTargets[] | select(.job=="blockchain-node")'

# Check dashboard query performance
# All queries should complete in <1s
```

---

## Troubleshooting

### Common Issues

#### 1. Authentication Failed

**Error**: `Invalid username or password`

**Solutions**:
```bash
# Reset Grafana admin password
grafana-cli admin reset-admin-password newpassword

# Or update environment variables
export GRAFANA_USER="admin"
export GRAFANA_PASSWORD="your-password"
```

#### 2. Data Source Connection Failed

**Error**: `HTTP Error Bad Gateway` or `Connection refused`

**Solutions**:
```bash
# Verify Prometheus is running
curl http://localhost:9090/-/healthy

# Check Prometheus targets
curl http://localhost:9090/api/v1/targets

# Restart Prometheus
brew services restart prometheus
```

#### 3. No Data in Panels

**Error**: Panels show "No Data"

**Solutions**:
```bash
# Verify V11 backend is running and exposing metrics
curl http://localhost:9003/q/metrics

# Check if Prometheus is scraping V11
curl http://localhost:9090/api/v1/query?query=up{job="blockchain-node"}

# Verify time range in dashboard is appropriate
# Some metrics may need time to accumulate
```

#### 4. Dashboard Import Failed

**Error**: Dashboard import returns error

**Solutions**:
```bash
# Check Grafana logs
tail -f /opt/homebrew/var/log/grafana/grafana.log

# Validate JSON syntax
python3 -m json.tool SPRINT-16-GRAFANA-DASHBOARDS.json

# Try manual import via UI
# Copy dashboard JSON and import through UI
```

#### 5. Alert Rules Not Firing

**Error**: Alerts not triggering as expected

**Solutions**:
```bash
# Verify alert rule syntax
# Check Grafana alerting logs

# Test query directly in Prometheus
curl 'http://localhost:9090/api/v1/query?query=blockchain_network_health_score'

# Ensure evaluation interval is appropriate
# Check alert state in Grafana UI
```

### Logs and Debugging

```bash
# Grafana logs
tail -f /opt/homebrew/var/log/grafana/grafana.log

# Prometheus logs
tail -f /opt/homebrew/var/log/prometheus.log

# V11 backend logs
cd aurigraph-av10-7/aurigraph-v11-standalone
./mvnw quarkus:dev  # Check console output

# Enable debug logging in Grafana
# Edit /opt/homebrew/etc/grafana/grafana.ini
[log]
level = debug
```

---

## Production Deployment

### Deployment to Remote Server (dlt.aurigraph.io)

#### Step 1: Prepare Remote Environment

```bash
# SSH to production server
ssh -p2235 subbu@dlt.aurigraph.io

# Install Grafana
sudo apt-get update
sudo apt-get install -y software-properties-common
sudo add-apt-repository "deb https://packages.grafana.com/oss/deb stable main"
wget -q -O - https://packages.grafana.com/gpg.key | sudo apt-key add -
sudo apt-get update
sudo apt-get install grafana

# Start Grafana service
sudo systemctl start grafana-server
sudo systemctl enable grafana-server
```

#### Step 2: Configure Prometheus (if not already running)

```bash
# Install Prometheus
sudo apt-get install prometheus

# Configure Prometheus to scrape V11 backend
sudo nano /etc/prometheus/prometheus.yml
```

Add scrape config:

```yaml
scrape_configs:
  - job_name: 'aurigraph-v11'
    static_configs:
      - targets: ['localhost:9003']
    metrics_path: '/q/metrics'
    scrape_interval: 15s
```

```bash
# Restart Prometheus
sudo systemctl restart prometheus
```

#### Step 3: Deploy Dashboards and Alerts

```bash
# Copy files to production server
scp -P2235 SPRINT-16-GRAFANA-DASHBOARDS.json subbu@dlt.aurigraph.io:/tmp/
scp -P2235 import-grafana-dashboards.py subbu@dlt.aurigraph.io:/tmp/
scp -P2235 grafana-alert-rules.yml subbu@dlt.aurigraph.io:/tmp/

# On remote server, import dashboards
cd /tmp
export GRAFANA_URL="http://localhost:3000"
export GRAFANA_USER="admin"
export GRAFANA_PASSWORD="your-secure-password"
python3 import-grafana-dashboards.py

# Copy alert rules to provisioning directory
sudo cp grafana-alert-rules.yml /etc/grafana/provisioning/alerting/
sudo systemctl restart grafana-server
```

#### Step 4: Configure NGINX Reverse Proxy

```bash
# Edit NGINX config
sudo nano /etc/nginx/sites-available/default
```

Add Grafana proxy:

```nginx
location /grafana/ {
    proxy_pass http://localhost:3000/;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;

    # WebSocket support for live updates
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection "upgrade";
}
```

```bash
# Test and reload NGINX
sudo nginx -t
sudo systemctl reload nginx
```

#### Step 5: Configure SSL/TLS

```bash
# Let's Encrypt SSL certificate (if not already configured)
sudo certbot --nginx -d dlt.aurigraph.io
```

#### Step 6: Configure Grafana for Reverse Proxy

```bash
sudo nano /etc/grafana/grafana.ini
```

Update configuration:

```ini
[server]
domain = dlt.aurigraph.io
root_url = %(protocol)s://%(domain)s/grafana/
serve_from_sub_path = true

[security]
admin_user = admin
admin_password = <your-secure-password>
secret_key = <generate-random-key>

[auth.anonymous]
enabled = false
```

```bash
# Restart Grafana
sudo systemctl restart grafana-server
```

### Access Production Dashboards

**URL**: `https://dlt.aurigraph.io/grafana/`

### Production Monitoring Checklist

- [ ] Grafana accessible via HTTPS
- [ ] SSL certificate valid
- [ ] All 5 dashboards imported
- [ ] All 49 panels displaying data
- [ ] 24 alert rules active
- [ ] Notification channels configured
- [ ] Prometheus retention set to 30 days
- [ ] Grafana database backed up
- [ ] Access controls configured
- [ ] Monitoring documented

### Backup and Disaster Recovery

```bash
# Backup Grafana database (SQLite)
sudo cp /var/lib/grafana/grafana.db /backup/grafana-$(date +%Y%m%d).db

# Backup Grafana configuration
sudo tar -czf /backup/grafana-config-$(date +%Y%m%d).tar.gz \
  /etc/grafana/ \
  /var/lib/grafana/dashboards/

# Backup Prometheus data
sudo tar -czf /backup/prometheus-data-$(date +%Y%m%d).tar.gz \
  /var/lib/prometheus/

# Restore Grafana
sudo systemctl stop grafana-server
sudo cp /backup/grafana-YYYYMMDD.db /var/lib/grafana/grafana.db
sudo systemctl start grafana-server
```

---

## Next Steps

After successful deployment:

1. **Sprint 16 Phase 2**: Implement missing Prometheus metrics in V11 backend
2. **Sprint 16 Phase 3**: Configure advanced alerting with PagerDuty/OpsGenie
3. **Sprint 16 Phase 4**: Create custom Grafana plugins for blockchain-specific visualizations
4. **Sprint 17**: Implement distributed tracing with Jaeger/Tempo
5. **Sprint 18**: Add log aggregation with Loki

---

## References

- **Grafana Documentation**: https://grafana.com/docs/
- **Prometheus Documentation**: https://prometheus.io/docs/
- **Aurigraph V11 Metrics**: `/aurigraph-av10-7/aurigraph-v11-standalone/README.md`
- **Sprint 16 Plan**: `/aurigraph-av10-7/aurigraph-v11-standalone/SPRINT_PLAN.md`

---

## Support

For issues or questions:

- **Project Lead**: Subbu Jois (sjoish12@gmail.com)
- **JIRA Board**: https://aurigraphdlt.atlassian.net/jira/software/projects/AV11/boards/789
- **GitHub Issues**: https://github.com/Aurigraph-DLT-Corp/Aurigraph-DLT/issues

---

**Document Version**: 1.0
**Last Updated**: November 4, 2025
**Status**: Ready for Production Deployment ✓
