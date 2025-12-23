# Grafana Monitoring Quick Reference Card

**Aurigraph V11 - Sprint 16 Phase 1**

---

## Files Location

All files in: `/Users/subbujois/subbuworkingdir/Aurigraph-DLT/`

---

## Quick Deploy (3 Commands)

```bash
# 1. Setup Grafana and Prometheus connection
./setup-grafana-monitoring.sh

# 2. Import all 5 dashboards (49 panels)
python3 import-grafana-dashboards.py

# 3. Validate everything works
./validate-grafana-setup.sh
```

---

## Environment Variables

```bash
export GRAFANA_URL="http://localhost:3000"
export GRAFANA_USER="admin"
export GRAFANA_PASSWORD="your-password"
export PROMETHEUS_URL="http://localhost:9090"
```

---

## Key Files

| File | Purpose |
|------|---------|
| `SPRINT-16-GRAFANA-DASHBOARDS.json` | Dashboard config (5 dashboards, 49 panels) |
| `import-grafana-dashboards.py` | Automated import script |
| `setup-grafana-monitoring.sh` | Initial Grafana setup |
| `validate-grafana-setup.sh` | Validation and testing |
| `grafana-alert-rules.yml` | 24 alert rules (8 critical, 12 warning, 4 info) |
| `SPRINT-16-GRAFANA-DEPLOYMENT-GUIDE.md` | Complete deployment guide (800+ lines) |
| `SPRINT-16-PHASE-1-EXECUTION-REPORT.md` | Execution report and status |

---

## Dashboards

1. **Blockchain Network Overview** (8 panels) - Network health, TPS, latency
2. **Validator Performance** (10 panels) - Validators, stake, rewards
3. **AI & ML Optimization** (9 panels) - Model accuracy, predictions
4. **System & Infrastructure** (12 panels) - CPU, memory, JVM, disk
5. **RWA & Tokenization** (10 panels) - Assets, tokens, compliance

**Total: 49 panels**

---

## Alert Rules

- **8 Critical**: Network health, nodes, latency, consensus, memory, disk, API, slashing
- **12 Warning**: Performance, resources, AI accuracy, compliance
- **4 Info**: Events, milestones, new validators, high TPS

**Total: 24 alerts**

---

## Service URLs

- **Grafana**: http://localhost:3000
- **Prometheus**: http://localhost:9090
- **V11 Backend**: http://localhost:9003
- **V11 Metrics**: http://localhost:9003/q/metrics

---

## Common Commands

```bash
# Start services
brew services start grafana
brew services start prometheus

# Check service status
curl http://localhost:3000/api/health
curl http://localhost:9090/-/healthy

# Start V11 backend
cd aurigraph-av10-7/aurigraph-v11-standalone
./mvnw quarkus:dev

# Reset Grafana password
grafana-cli admin reset-admin-password newpassword

# View Grafana logs
tail -f /opt/homebrew/var/log/grafana/grafana.log
```

---

## Troubleshooting

**Problem**: Authentication failed
**Solution**: `export GRAFANA_PASSWORD="your-password"` or reset password

**Problem**: No data in panels
**Solution**: Start V11 backend and configure Prometheus to scrape it

**Problem**: Dashboards not importing
**Solution**: Check Grafana logs, validate JSON syntax

**Problem**: Prometheus not scraping V11
**Solution**: Add V11 target to Prometheus config

---

## Production Deployment

1. SSH to server: `ssh -p2235 subbu@dlt.aurigraph.io`
2. Install Grafana and Prometheus
3. Copy files to server
4. Run import scripts
5. Configure NGINX proxy
6. Setup SSL with Let's Encrypt

**Full details**: See `SPRINT-16-GRAFANA-DEPLOYMENT-GUIDE.md` Section 9

---

## Next Phase (Sprint 16 Phase 2)

Implement 37 Prometheus metrics in V11 backend:
- 8 Blockchain metrics
- 10 Validator metrics
- 9 AI/ML metrics
- 10 RWA metrics

---

## Support

- **Execution Report**: `SPRINT-16-PHASE-1-EXECUTION-REPORT.md`
- **Deployment Guide**: `SPRINT-16-GRAFANA-DEPLOYMENT-GUIDE.md`
- **JIRA**: https://aurigraphdlt.atlassian.net/jira/software/projects/AV11

---

**Status**: Ready for Deployment
**Date**: November 4, 2025
**Phase**: Sprint 16 Phase 1 Complete
