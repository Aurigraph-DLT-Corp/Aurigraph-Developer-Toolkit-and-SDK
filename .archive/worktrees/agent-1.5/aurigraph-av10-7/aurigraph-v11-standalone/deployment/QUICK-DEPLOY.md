# Sprint 16 Phase 2: Quick Deployment Reference Card

**Target**: dlt.aurigraph.io
**Time**: ~15 minutes total
**Status**: Production Ready

---

## Prerequisites (5 minutes)

```bash
# 1. Test SSH connectivity
ssh -p 2235 subbu@dlt.aurigraph.io "echo 'SSH OK'"

# 2. Check server resources
ssh -p 2235 subbu@dlt.aurigraph.io "free -h && df -h /opt && docker --version"

# 3. Navigate to deployment directory
cd /Users/subbujois/subbuworkingdir/Aurigraph-DLT/aurigraph-av10-7/aurigraph-v11-standalone/deployment
```

**Requirements Check**:
- [ ] SSH working (port 2235)
- [ ] Disk space: >= 50GB free in /opt
- [ ] Memory: >= 8GB available
- [ ] Docker: version 20.10+
- [ ] NGINX: installed and running

---

## Deployment Steps (10 minutes)

### Step 1: Deploy Prometheus (3-5 min)
```bash
./deploy-prometheus-production.sh
```
**Verify**: `curl -s http://localhost:9090/-/healthy` → "Prometheus Server is Healthy"

### Step 2: Deploy Grafana (2-4 min)
```bash
./deploy-grafana-production.sh
```
**Verify**: `curl -s http://localhost:3000/api/health | jq .` → `{"database":"ok"}`

### Step 3: Configure NGINX (1-2 min)
```bash
./configure-nginx-monitoring.sh
```
**Verify**: `curl -s http://localhost/monitoring/health` → `{"status":"ok"}`

### Step 4: Setup SSL/TLS (2-5 min)
```bash
./setup-ssl-certificates.sh
```
**Verify**: `curl -s -o /dev/null -w '%{http_code}' https://dlt.aurigraph.io/monitoring` → `200`

---

## Verification (2 minutes)

```bash
# Run comprehensive health check
./check-monitoring-health.sh

# Expected output:
# Health Score: >= 90%
# Status: HEALTHY ✓
```

**Manual checks**:
1. Open browser: https://dlt.aurigraph.io/monitoring
2. Login: admin / aurigraph_admin_2025
3. Verify: 5 dashboards visible in "Aurigraph" folder

---

## Quick Commands

### Health Check
```bash
# Full health check
./check-monitoring-health.sh

# Quick container check
ssh -p 2235 subbu@dlt.aurigraph.io "docker ps --format 'table {{.Names}}\t{{.Status}}'"
```

### View Logs
```bash
# Grafana logs
ssh -p 2235 subbu@dlt.aurigraph.io "docker logs -f aurigraph-grafana"

# Prometheus logs
ssh -p 2235 subbu@dlt.aurigraph.io "docker logs -f aurigraph-prometheus"

# NGINX logs
ssh -p 2235 subbu@dlt.aurigraph.io "sudo tail -f /var/log/nginx/*_error.log"
```

### Restart Services
```bash
# Restart Grafana
ssh -p 2235 subbu@dlt.aurigraph.io "docker restart aurigraph-grafana"

# Restart Prometheus
ssh -p 2235 subbu@dlt.aurigraph.io "docker restart aurigraph-prometheus"

# Reload NGINX
ssh -p 2235 subbu@dlt.aurigraph.io "sudo systemctl reload nginx"
```

### SSL Certificate
```bash
# Check certificate
ssh -p 2235 subbu@dlt.aurigraph.io "sudo certbot certificates"

# Test renewal
ssh -p 2235 subbu@dlt.aurigraph.io "sudo certbot renew --dry-run"

# Force renewal
ssh -p 2235 subbu@dlt.aurigraph.io "sudo certbot renew --force-renewal"
```

---

## Troubleshooting Quick Fixes

### Container Won't Start
```bash
# Check logs
ssh -p 2235 subbu@dlt.aurigraph.io "docker logs aurigraph-grafana"

# Fix permissions
ssh -p 2235 subbu@dlt.aurigraph.io << 'EOF'
  sudo chown -R 472:472 /opt/aurigraph/monitoring/grafana/data
  sudo chown -R 65534:65534 /opt/aurigraph/monitoring/prometheus/data
  docker restart aurigraph-grafana aurigraph-prometheus
EOF
```

### Grafana Not Loading
```bash
# Restart Grafana and NGINX
ssh -p 2235 subbu@dlt.aurigraph.io \
  "docker restart aurigraph-grafana && sleep 10 && sudo systemctl reload nginx"
```

### Prometheus Not Scraping
```bash
# Check targets
ssh -p 2235 subbu@dlt.aurigraph.io \
  "curl -s http://localhost:9090/api/v1/targets | jq '.data.activeTargets[] | {job: .labels.job, health: .health}'"

# Test V11 backend metrics
ssh -p 2235 subbu@dlt.aurigraph.io \
  "curl -s http://localhost:9003/q/metrics | head -20"
```

### NGINX 502 Error
```bash
# Check Grafana health
ssh -p 2235 subbu@dlt.aurigraph.io \
  "curl -s http://localhost:3000/api/health"

# If unhealthy, restart
ssh -p 2235 subbu@dlt.aurigraph.io \
  "docker restart aurigraph-grafana && sleep 30 && sudo systemctl reload nginx"
```

---

## Post-Deployment Checklist

**Security** (Do immediately):
- [ ] Change Grafana admin password (default: aurigraph_admin_2025)
- [ ] Configure alert notification channels (Slack, Email)
- [ ] Review and update IP whitelist for admin endpoints

**Operations** (Within 24 hours):
- [ ] Schedule automated backups (scripts in deployment guide)
- [ ] Test backup restore procedure
- [ ] Set up health check cron job (every 15 minutes)
- [ ] Document admin credentials in password manager

**Monitoring** (Within 1 week):
- [ ] Train operations team on dashboards
- [ ] Create incident response runbook
- [ ] Test alert routing and notification
- [ ] Schedule monthly security review

---

## URLs

**Production**:
- Monitoring: https://dlt.aurigraph.io/monitoring
- API: https://dlt.aurigraph.io/api/v11
- Health: https://dlt.aurigraph.io/monitoring/health

**Admin Only** (IP restricted):
- Prometheus: https://dlt.aurigraph.io/prometheus
- Alertmanager: https://dlt.aurigraph.io/alertmanager

---

## Support

**Documentation**:
- Full guide: `SPRINT-16-PHASE-2-DEPLOYMENT-GUIDE.md`
- Summary: `SPRINT-16-PHASE-2-SUMMARY.md`

**Escalation**:
- Create JIRA ticket with label: `monitoring-production`
- On-call: (Configure PagerDuty integration)

---

## Alternative: Docker Compose Deployment

If you prefer deploying the entire stack at once:

```bash
# Copy Docker Compose file to server
scp -P 2235 docker-compose-production.yml subbu@dlt.aurigraph.io:/tmp/

# Deploy stack
ssh -p 2235 subbu@dlt.aurigraph.io << 'EOF'
  cd /opt/aurigraph/monitoring
  sudo mv /tmp/docker-compose-production.yml .
  sudo docker compose -f docker-compose-production.yml up -d
EOF

# Then continue with NGINX and SSL configuration
./configure-nginx-monitoring.sh
./setup-ssl-certificates.sh

# Verify
./check-monitoring-health.sh
```

---

**Quick Deploy Complete!** 🎉

For detailed information, troubleshooting, and operations procedures, see:
`SPRINT-16-PHASE-2-DEPLOYMENT-GUIDE.md`
