# Aurigraph V11 Production Deployment Guide

## Overview

This directory contains all necessary configurations and scripts for deploying Aurigraph V11 to production.

**Version**: 11.4.3
**Target Server**: dlt.aurigraph.io
**Deployment Date**: October 24, 2025

---

## Deployment Artifacts

### Configuration Files

| File | Description |
|------|-------------|
| `aurigraph-v11.service` | Systemd service configuration |
| `nginx-aurigraph-v11.conf` | Nginx reverse proxy configuration |
| `docker-compose-monitoring.yml` | Monitoring stack (Prometheus + Grafana) |
| `prometheus.yml` | Prometheus scrape configuration |
| `prometheus-alerts.yml` | Alerting rules for performance and health |
| `alertmanager.yml` | Alert routing and notification configuration |
| `grafana-datasources.yml` | Grafana datasource provisioning |
| `Dockerfile.native` | Docker image for native executable |

### Scripts

| Script | Purpose |
|--------|---------|
| `deploy-to-production.sh` | Automated deployment script |
| `performance-validation.sh` | Performance benchmarking and validation |

---

## Prerequisites

### Server Requirements

- **OS**: Linux (Ubuntu 24.04 LTS recommended)
- **CPU**: 16+ vCPU
- **RAM**: 48+ GB
- **Disk**: 200+ GB
- **Java**: OpenJDK 21 (for JAR mode)

### Network Requirements

- Ports 9003 (HTTP/REST API) and 9004 (gRPC) available
- SSL certificate for HTTPS (Let's Encrypt recommended)
- Domain: dlt.aurigraph.io

### Software Dependencies

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Java 21
sudo apt install -y openjdk-21-jdk

# Install Nginx (for reverse proxy)
sudo apt install -y nginx

# Install Docker (for monitoring stack)
sudo apt install -y docker.io docker-compose

# Install monitoring tools
sudo apt install -y htop iotop nethogs

# Verify installations
java --version
nginx -v
docker --version
```

---

## Quick Deployment

### Step 1: Build Application

```bash
# From aurigraph-v11-standalone directory
./mvnw clean package -DskipTests=true -Dquarkus.package.jar.type=uber-jar

# Verify build
ls -lh target/aurigraph-v11-standalone-11.4.3-runner.jar
```

**Expected Output**: JAR file (~174MB)

### Step 2: Deploy to Production

```bash
# Run automated deployment script
cd deployment
./deploy-to-production.sh

# The script will:
# 1. Check prerequisites
# 2. Create remote directories
# 3. Backup existing deployment
# 4. Upload artifacts
# 5. Configure systemd service
# 6. Configure Nginx
# 7. Start service
# 8. Verify deployment
```

### Step 3: Configure SSL

```bash
# SSH to production server
ssh subbu@dlt.aurigraph.io

# Install Certbot
sudo apt install -y certbot python3-certbot-nginx

# Obtain SSL certificate
sudo certbot --nginx -d dlt.aurigraph.io

# Certificate will auto-renew via cron
```

### Step 4: Start Monitoring Stack

```bash
# On production server
cd /opt/DLT/aurigraph-v11/deployment

# Start monitoring services
docker-compose -f docker-compose-monitoring.yml up -d

# Verify services
docker-compose -f docker-compose-monitoring.yml ps

# Access Grafana: http://dlt.aurigraph.io:3000
# Username: admin
# Password: aurigraph_admin_2025
```

---

## Manual Deployment Steps

If automated deployment fails, follow these manual steps:

### 1. Create Application User

```bash
sudo useradd -r -s /bin/bash -d /opt/DLT/aurigraph-v11 aurigraph
sudo mkdir -p /opt/DLT/aurigraph-v11/{11.4.3,logs,data,backups}
sudo chown -R aurigraph:aurigraph /opt/DLT/aurigraph-v11
```

### 2. Upload Application

```bash
# From local machine
scp target/aurigraph-v11-standalone-11.4.3-runner.jar \
    subbu@dlt.aurigraph.io:/tmp/

# On production server
sudo mv /tmp/aurigraph-v11-standalone-11.4.3-runner.jar \
    /opt/DLT/aurigraph-v11/11.4.3/
sudo chown aurigraph:aurigraph \
    /opt/DLT/aurigraph-v11/11.4.3/aurigraph-v11-standalone-11.4.3-runner.jar
```

### 3. Configure Systemd Service

```bash
# Upload service file
scp deployment/aurigraph-v11.service \
    subbu@dlt.aurigraph.io:/tmp/

# On production server
sudo mv /tmp/aurigraph-v11.service /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable aurigraph-v11
```

### 4. Configure Nginx

```bash
# Upload Nginx config
scp deployment/nginx-aurigraph-v11.conf \
    subbu@dlt.aurigraph.io:/tmp/

# On production server
sudo mv /tmp/nginx-aurigraph-v11.conf \
    /etc/nginx/sites-available/aurigraph-v11.conf
sudo ln -s /etc/nginx/sites-available/aurigraph-v11.conf \
    /etc/nginx/sites-enabled/

# Test configuration
sudo nginx -t

# Reload Nginx
sudo systemctl reload nginx
```

### 5. Start Service

```bash
sudo systemctl start aurigraph-v11
sudo systemctl status aurigraph-v11

# View logs
sudo journalctl -u aurigraph-v11 -f
```

---

## Service Management

### Systemd Commands

```bash
# Start service
sudo systemctl start aurigraph-v11

# Stop service
sudo systemctl stop aurigraph-v11

# Restart service
sudo systemctl restart aurigraph-v11

# Check status
sudo systemctl status aurigraph-v11

# View logs (follow mode)
sudo journalctl -u aurigraph-v11 -f

# View recent logs
sudo journalctl -u aurigraph-v11 -n 100 --no-pager

# View logs for specific time range
sudo journalctl -u aurigraph-v11 --since "2025-10-24 00:00:00"
```

### Health Checks

```bash
# Check service health
curl http://localhost:9003/api/v11/health

# Check system info
curl http://localhost:9003/api/v11/info | jq .

# Check Prometheus metrics
curl http://localhost:9003/q/metrics | head -50

# Check gRPC service (requires grpcurl)
grpcurl -plaintext localhost:9004 list
```

---

## Performance Validation

### Run Performance Tests

```bash
cd deployment
./performance-validation.sh

# This will:
# 1. Check service health
# 2. Run baseline benchmark (60 seconds)
# 3. Run progressive load test (100K - 3M TPS)
# 4. Run stress test (5 minutes sustained load)
# 5. Capture system metrics
# 6. Generate comprehensive report
```

### Expected Performance Metrics

| Metric | Target | Acceptable |
|--------|--------|------------|
| TPS | 2,000,000+ | 1,500,000+ |
| P99 Latency | <50ms | <100ms |
| Memory Usage | <256MB | <512MB |
| CPU Utilization | 80-95% | 70-100% |
| Startup Time | <5s (JAR) | <10s |
| Error Rate | <0.01% | <0.1% |

### Manual Performance Test

```bash
# Simple throughput test
curl -X POST http://localhost:9003/api/v11/performance/benchmark \
  -H "Content-Type: application/json" \
  -d '{
    "duration_seconds": 60,
    "concurrent_connections": 512,
    "transactions_per_second": 2000000,
    "transaction_type": "transfer"
  }'

# View statistics
curl http://localhost:9003/api/v11/stats | jq .
```

---

## Monitoring & Observability

### Prometheus Metrics

**URL**: http://dlt.aurigraph.io:9090

Key metrics to monitor:
- `http_server_requests_seconds` - Request latency
- `process_resident_memory_bytes` - Memory usage
- `process_cpu_seconds_total` - CPU usage
- `http_server_connections_active` - Active connections
- `jvm_gc_pause_seconds` - GC performance (JAR mode only)

### Grafana Dashboards

**URL**: http://dlt.aurigraph.io:3000
**Username**: admin
**Password**: aurigraph_admin_2025

Recommended dashboards:
1. Quarkus Metrics (standard template)
2. JVM Dashboard (for JAR mode)
3. System Metrics (node-exporter)
4. Container Metrics (cAdvisor)

### Alerting

Alerts configured in `prometheus-alerts.yml`:
- Service down (critical)
- Low TPS (<1M for 5 min)
- High latency (P99 >50ms for 5 min)
- High memory usage (>256MB for 5 min)
- High error rate (>10 req/s for 5 min)

---

## Rollback Procedure

### Automatic Rollback

```bash
# Set ROLLBACK=1 environment variable
ROLLBACK=1 ./deploy-to-production.sh

# This will:
# 1. Stop current service
# 2. Restore from most recent backup
# 3. Restart service
```

### Manual Rollback

```bash
# SSH to production server
ssh subbu@dlt.aurigraph.io

# Stop service
sudo systemctl stop aurigraph-v11

# List available backups
ls -lh /opt/DLT/aurigraph-v11/backups/

# Restore from backup
BACKUP_NAME="backup-20251024-120000"  # Replace with actual backup
sudo cp -r /opt/DLT/aurigraph-v11/backups/${BACKUP_NAME}/* \
    /opt/DLT/aurigraph-v11/11.4.3/

# Start service
sudo systemctl start aurigraph-v11

# Verify
sudo systemctl status aurigraph-v11
curl http://localhost:9003/api/v11/health
```

---

## Troubleshooting

### Common Issues

#### 1. Service Won't Start

```bash
# Check logs
sudo journalctl -u aurigraph-v11 -n 100 --no-pager

# Common causes:
# - Port already in use
# - Insufficient permissions
# - Missing dependencies
# - Configuration errors

# Check ports
sudo lsof -i :9003
sudo lsof -i :9004

# Check permissions
ls -la /opt/DLT/aurigraph-v11/11.4.3/
```

#### 2. Low Performance

```bash
# Check system resources
htop
free -h
df -h

# Check Java process
ps aux | grep java
jps -v  # Show JVM flags

# Increase memory if needed (edit systemd service)
Environment="JAVA_OPTS=-Xmx32g -Xms32g -XX:+UseG1GC"

# Reload and restart
sudo systemctl daemon-reload
sudo systemctl restart aurigraph-v11
```

#### 3. High Memory Usage

```bash
# Monitor memory
watch -n 1 'free -h'

# Check for memory leaks (JAR mode)
jmap -heap <PID>
jmap -histo <PID> | head -50

# Trigger GC (if needed)
jcmd <PID> GC.run
```

#### 4. Connection Issues

```bash
# Check Nginx status
sudo systemctl status nginx
sudo nginx -t

# Check firewall
sudo ufw status
sudo iptables -L -n

# Test local connectivity
curl http://localhost:9003/api/v11/health

# Test external connectivity
curl http://dlt.aurigraph.io/api/v11/health
```

---

## Security Considerations

### SSL/TLS Configuration

- Use TLS 1.2 minimum (TLS 1.3 recommended)
- Strong cipher suites only
- HSTS enabled
- Certificate auto-renewal configured

### Firewall Rules

```bash
# Allow SSH
sudo ufw allow 22/tcp

# Allow HTTP/HTTPS
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# Block direct access to application ports (use Nginx proxy)
sudo ufw deny 9003/tcp
sudo ufw deny 9004/tcp

# Enable firewall
sudo ufw enable
```

### Application Security

- Run as non-root user (`aurigraph`)
- Systemd security hardening enabled
- File permissions restricted
- Secrets management via environment variables
- Regular security audits enabled

---

## Maintenance

### Regular Tasks

#### Daily
- Monitor service health
- Check error logs
- Review Prometheus alerts

#### Weekly
- Review performance metrics
- Check disk space usage
- Rotate logs if needed

#### Monthly
- Review security audit reports
- Update dependencies
- Review and optimize performance

### Log Rotation

Logs are managed by systemd journal by default. Configure retention:

```bash
# Edit journald config
sudo nano /etc/systemd/journald.conf

# Set retention
SystemMaxUse=1G
MaxRetentionSec=30day

# Restart journald
sudo systemctl restart systemd-journald
```

### Backup Strategy

Automated backups created on each deployment:
- Location: `/opt/DLT/aurigraph-v11/backups/`
- Retention: Last 10 backups
- Format: `backup-YYYYMMDD-HHMMSS`

### Update Procedure

```bash
# 1. Build new version locally
./mvnw clean package -DskipTests=true

# 2. Test locally
java -jar target/*-runner.jar

# 3. Run deployment script
cd deployment
./deploy-to-production.sh

# 4. Deployment script automatically:
#    - Creates backup
#    - Uploads new version
#    - Restarts service
#    - Verifies health
```

---

## Support

### Logs Location

- **Application Logs**: `journalctl -u aurigraph-v11`
- **Nginx Access**: `/var/log/nginx/aurigraph-v11-access.log`
- **Nginx Error**: `/var/log/nginx/aurigraph-v11-error.log`
- **Prometheus**: Docker logs
- **Grafana**: Docker logs

### Diagnostic Commands

```bash
# Generate diagnostic report
cat > diagnostic-report.sh <<'EOF'
#!/bin/bash
echo "=== System Info ==="
uname -a
free -h
df -h

echo "=== Service Status ==="
sudo systemctl status aurigraph-v11 --no-pager

echo "=== Recent Logs ==="
sudo journalctl -u aurigraph-v11 -n 50 --no-pager

echo "=== Network ==="
sudo netstat -tuln | grep -E '9003|9004'

echo "=== Process Info ==="
ps aux | grep aurigraph
EOF

chmod +x diagnostic-report.sh
./diagnostic-report.sh > diagnostics.txt
```

---

## Performance Optimization Notes

### Current Status (v11.4.3)

- **Build Type**: Uber JAR (174MB)
- **Runtime**: JVM mode (Java 21)
- **Native Compilation**: In progress (GraalVM issues to resolve)

### Known Issues

1. **Native Build Failure**: GraalVM native compilation currently fails
   - **Impact**: Running in JVM mode (~3s startup vs <1s native target)
   - **Workaround**: Use uber JAR for deployment
   - **Resolution**: Requires dependency conflict resolution and native-image configuration tuning

2. **Directory Permissions**: LevelDB key management requires `/var/lib/aurigraph`
   - **Impact**: Service fails to start without proper permissions
   - **Workaround**: Create directory with correct permissions before starting service
   - **Command**: `sudo mkdir -p /var/lib/aurigraph && sudo chown aurigraph:aurigraph /var/lib/aurigraph`

### Optimization Recommendations

1. **Native Compilation** (High Priority)
   - Resolve dependency conflicts in BouncyCastle libraries
   - Configure native-image reflection and resource hints
   - Target: <1s startup, <200MB executable

2. **Performance Tuning**
   - Enable virtual threads (Java 21)
   - Optimize G1GC parameters
   - Fine-tune connection pool sizes
   - Enable HTTP/2 push for static resources

3. **Monitoring Enhancements**
   - Add custom business metrics
   - Configure distributed tracing (OpenTelemetry)
   - Set up log aggregation (ELK stack)

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 11.4.3 | 2025-10-24 | Phase 8 deployment preparation |
| 11.4.2 | 2025-10-23 | Security audit integration |
| 11.4.1 | 2025-10-22 | Enterprise portal features |
| 11.4.0 | 2025-10-20 | Initial production release |

---

## Contact & Escalation

For deployment issues or questions:
1. Check this README and troubleshooting section
2. Review logs and diagnostics
3. Consult project documentation in `/docs`
4. Contact DevOps team for infrastructure issues
5. Contact development team for application issues

**Project Repository**: https://github.com/Aurigraph-DLT-Corp/Aurigraph-DLT
**Documentation**: `/docs/project-av11/`
