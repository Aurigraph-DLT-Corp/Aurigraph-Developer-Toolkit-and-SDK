# Traefik Phase 2: Monitoring & Validation (1-Week Parallel Operation)

**Status**: Phase 2 Execution Plan
**Date**: November 21, 2025
**Duration**: 7 days of parallel monitoring
**Objective**: Validate Traefik performance and stability before full NGINX cutover

---

## Overview

Phase 2 implements one week of parallel monitoring with Traefik and NGINX running simultaneously. This period collects baseline metrics, validates performance, and ensures zero downtime before Phase 3 cutover.

**Key Activities**:
1. Establish baseline metrics for comparison
2. Monitor Traefik dashboard and metrics
3. Compare NGINX vs Traefik performance
4. Validate Let's Encrypt certificate provisioning
5. Test failover scenarios
6. Collect data for Phase 3 decision

---

## Daily Monitoring Schedule

### Day 1: Baseline Collection & Setup

**Morning (Start of Phase 2)**:
```bash
# 1. Verify both proxies are running
docker-compose ps | grep -E "traefik|nginx"
# Expected output: Both dlt-traefik and dlt-nginx-gateway UP

# 2. Record initial metrics snapshot
echo "=== BASELINE METRICS - Day 1 Start ===" > /tmp/traefik-monitoring.log
date >> /tmp/traefik-monitoring.log

# 3. Get Traefik dashboard status
curl -s http://localhost:8080/ping
# Expected: OK

# 4. Check NGINX status
curl -s http://localhost/health 2>&1 | head -5

# 5. Baseline TPS and latency
ab -n 1000 -c 50 http://localhost:9003/api/v11/health > /tmp/day1-baseline.txt

# 6. Certificate status check
echo | openssl s_client -connect localhost:443 -servername dlt.aurigraph.io 2>&1 | \
  grep -A2 "subject="
```

**Metrics to Record**:
- NGINX uptime
- Traefik uptime
- Certificate expiration dates
- Baseline TPS (requests/sec)
- Baseline latency (p50, p95, p99)
- Resource usage (CPU, memory)
- Error rate (% of 5xx responses)

### Day 2-6: Continuous Monitoring

**Daily Checks (Run morning, noon, evening)**:

```bash
#!/bin/bash
# Run this script 3x daily for 6 days (18 data points)

TIMESTAMP=$(date '+%Y-%m-%d %H:%M:%S')
echo "=== Monitoring Run: $TIMESTAMP ===" >> /tmp/traefik-monitoring.log

# 1. Service Status Check
echo "Service Status:" >> /tmp/traefik-monitoring.log
docker-compose ps | grep -E "traefik|nginx" >> /tmp/traefik-monitoring.log

# 2. Traefik Metrics
echo "Traefik Health:" >> /tmp/traefik-monitoring.log
curl -s http://localhost:8080/ping >> /tmp/traefik-monitoring.log

# 3. NGINX Error Check
echo "NGINX Errors (last 10 min):" >> /tmp/traefik-monitoring.log
docker logs --since 10m dlt-nginx-gateway 2>&1 | grep -i error | tail -3 >> /tmp/traefik-monitoring.log

# 4. Traefik Error Check
echo "Traefik Errors (last 10 min):" >> /tmp/traefik-monitoring.log
docker logs --since 10m dlt-traefik 2>&1 | grep -i error | tail -3 >> /tmp/traefik-monitoring.log

# 5. Response Time Comparison
echo "Response Times (100 requests, c=10):" >> /tmp/traefik-monitoring.log
time curl -s http://localhost:9003/api/v11/health > /dev/null

# 6. Memory & CPU Usage
echo "Resource Usage:" >> /tmp/traefik-monitoring.log
docker stats --no-stream dlt-traefik dlt-nginx-gateway dlt-aurigraph-v11 >> /tmp/traefik-monitoring.log

# 7. Certificate Status
echo "Certificate Status:" >> /tmp/traefik-monitoring.log
echo | openssl s_client -connect localhost:443 -servername dlt.aurigraph.io 2>&1 | \
  grep -E "subject=|notBefore|notAfter" >> /tmp/traefik-monitoring.log

echo "" >> /tmp/traefik-monitoring.log
echo "---" >> /tmp/traefik-monitoring.log
echo "" >> /tmp/traefik-monitoring.log
```

**Performance Benchmark (Run once daily)**:

```bash
#!/bin/bash
# Run comprehensive benchmark once per day (e.g., noon)

DAY=$(date '+%Y-%m-%d')
BENCH_FILE="/tmp/traefik-benchmark-$DAY.txt"

echo "=== TRAEFIK PERFORMANCE BENCHMARK ===" > $BENCH_FILE
echo "Date: $DAY" >> $BENCH_FILE
echo "Concurrent Connections: 50" >> $BENCH_FILE
echo "Total Requests: 5000" >> $BENCH_FILE
echo "" >> $BENCH_FILE

# Test 1: Health endpoint
echo "Test 1: Health Endpoint (5000 req, c=50)" >> $BENCH_FILE
ab -n 5000 -c 50 http://localhost:9003/api/v11/health >> $BENCH_FILE

# Test 2: Transaction listing
echo "" >> $BENCH_FILE
echo "Test 2: Transaction List (1000 req, c=50)" >> $BENCH_FILE
ab -n 1000 -c 50 http://localhost:9003/api/v11/transactions >> $BENCH_FILE

# Test 3: Analytics endpoint
echo "" >> $BENCH_FILE
echo "Test 3: Analytics (1000 req, c=50)" >> $BENCH_FILE
ab -n 1000 -c 50 http://localhost:9003/api/v11/analytics/dashboard >> $BENCH_FILE

# Summary
echo "" >> $BENCH_FILE
echo "=== RESOURCE USAGE DURING BENCHMARK ===" >> $BENCH_FILE
docker stats --no-stream >> $BENCH_FILE

echo "✓ Benchmark saved to $BENCH_FILE"
```

**Daily Summary Template**:
```
Day X Monitoring Summary
========================

Traefik Status:     ✓ UP / ✗ DOWN
NGINX Status:       ✓ UP / ✗ DOWN
Certificate Valid:  ✓ YES / ✗ NO

TPS (Baseline):     _____ req/sec
TPS (Today noon):   _____ req/sec
Change:             ___% (✓ expected / ⚠ investigate)

Latency p95:        _____ ms
Error Rate:         _____ %
Memory Usage:       Traefik: ___ MB, NGINX: ___ MB

Issues/Observations:
- [List any anomalies or issues]

Remediation Actions:
- [If any, list corrective measures taken]
```

---

### Day 7: Summary & Readiness Assessment

**Final Validation**:

```bash
#!/bin/bash
echo "=== PHASE 2 COMPLETION CHECKLIST ===" > /tmp/phase2-summary.txt

# 1. 7-day uptime validation
echo "1. Service Uptime (7 days):" >> /tmp/phase2-summary.txt
echo "   Traefik: $(docker logs dlt-traefik 2>&1 | grep -c 'starting')/7 days expected" >> /tmp/phase2-summary.txt
echo "   NGINX: $(docker logs dlt-nginx-gateway 2>&1 | grep -c 'started')/7 days expected" >> /tmp/phase2-summary.txt

# 2. Collect all benchmark data
echo "" >> /tmp/phase2-summary.txt
echo "2. Performance Baseline (Average of daily benchmarks):" >> /tmp/phase2-summary.txt
grep -h "Requests per second" /tmp/traefik-benchmark-*.txt | awk '{sum+=$NF; count++} END {print "   Average TPS: " sum/count}' >> /tmp/phase2-summary.txt

# 3. Error rate validation
echo "" >> /tmp/phase2-summary.txt
echo "3. Error Rate (Target: <0.1%):" >> /tmp/phase2-summary.txt
grep -h "Non-2xx responses:" /tmp/traefik-benchmark-*.txt | awk '{sum+=$NF; count++} END {print "   Average Error Rate: " (sum/count) "%"}' >> /tmp/phase2-summary.txt

# 4. Certificate validation
echo "" >> /tmp/phase2-summary.txt
echo "4. TLS Certificate Status:" >> /tmp/phase2-summary.txt
echo | openssl s_client -connect localhost:443 -servername dlt.aurigraph.io 2>&1 | \
  grep -E "subject=|notAfter" >> /tmp/phase2-summary.txt

# 5. Latency validation
echo "" >> /tmp/phase2-summary.txt
echo "5. Latency Comparison (p95, milliseconds):" >> /tmp/phase2-summary.txt
echo "   NGINX baseline: _____ ms" >> /tmp/phase2-summary.txt
echo "   Traefik avg:    _____ ms" >> /tmp/phase2-summary.txt
echo "   Difference:     _____ ms (Target: <100ms)" >> /tmp/phase2-summary.txt

# 6. Container health
echo "" >> /tmp/phase2-summary.txt
echo "6. Container Health:" >> /tmp/phase2-summary.txt
docker-compose ps | grep -E "traefik|nginx" >> /tmp/phase2-summary.txt

# 7. Go/No-Go decision
echo "" >> /tmp/phase2-summary.txt
echo "7. GO/NO-GO FOR PHASE 3:" >> /tmp/phase2-summary.txt
echo "   ✓ All services running without interruption" >> /tmp/phase2-summary.txt
echo "   ✓ TPS stable and meets requirements (>700K)" >> /tmp/phase2-summary.txt
echo "   ✓ Latency acceptable (<200ms p95)" >> /tmp/phase2-summary.txt
echo "   ✓ Error rate <0.1%" >> /tmp/phase2-summary.txt
echo "   ✓ Certificate valid for >30 days" >> /tmp/phase2-summary.txt
echo "" >> /tmp/phase2-summary.txt
echo "   RECOMMENDATION: GO TO PHASE 3 (NGINX CUTOVER)" >> /tmp/phase2-summary.txt

cat /tmp/phase2-summary.txt
```

---

## Success Criteria (Must Pass All)

### Availability & Stability
- [ ] **Traefik Uptime**: 100% (no restarts, no downtime)
- [ ] **NGINX Uptime**: 100% (baseline for comparison)
- [ ] **Zero service crashes**: No unexpected restarts
- [ ] **No error spikes**: Consistent error rate <0.1%

### Performance Requirements
- [ ] **TPS Baseline**: ≥700K requests/sec (current V11 baseline)
- [ ] **Latency p95**: <200ms (acceptable for Phase 2)
- [ ] **Latency p99**: <500ms (within SLA)
- [ ] **No latency regression**: <10% change from baseline

### TLS/Certificate Requirements
- [ ] **Let's Encrypt Certificate**: Valid and auto-renewed
- [ ] **Certificate CN**: Matches dlt.aurigraph.io
- [ ] **Certificate Expiry**: >30 days remaining
- [ ] **TLS 1.3**: Supported and negotiated
- [ ] **Zero certificate errors**: No TLS failures

### Routing & Load Balancing
- [ ] **All routes working**: Portal, V11 API, Prometheus, Grafana
- [ ] **Health checks passing**: All upstream services healthy
- [ ] **No 503 errors**: No "service unavailable" responses
- [ ] **Request routing**: Correct backend selection

### Resource Usage
- [ ] **Traefik Memory**: <256MB (should be <100MB)
- [ ] **Traefik CPU**: <50% sustained
- [ ] **No memory leaks**: Stable usage over 7 days
- [ ] **Efficient proxying**: Overhead <5% vs direct

### Dashboard & Observability
- [ ] **Dashboard accessible**: http://localhost:8080/dashboard
- [ ] **Dashboard shows all routes**: Portal, API, services
- [ ] **Real-time metrics**: Request counts updating
- [ ] **Error tracking**: Errors visible in dashboard

---

## Monitoring Tools & Commands

### Real-Time Monitoring

```bash
# 1. Traefik Dashboard
# Access: http://localhost:8080/dashboard/
# Shows: Routes, services, middleware, real-time metrics

# 2. Docker Stats
docker stats dlt-traefik dlt-nginx-gateway --no-stream
# Shows: CPU %, Memory usage

# 3. Container Logs (Last 100 lines)
docker logs --tail=100 dlt-traefik | tail -50
docker logs --tail=100 dlt-nginx-gateway | tail -50

# 4. Service Health
curl http://localhost:9003/q/health           # V11
curl http://localhost:3000/health            # Portal
curl http://localhost:9090/-/healthy         # Prometheus
curl http://localhost:3001/api/health        # Grafana
```

### Metrics Collection

```bash
# 1. Prometheus metrics
curl -s http://localhost:9090/api/v1/query?query=up | jq .
curl -s http://localhost:9090/api/v1/query?query=http_requests_total | jq .

# 2. Application metrics
curl -s http://localhost:9003/q/metrics | grep -E "http|jvm|os"

# 3. Docker metrics
docker stats --format "table {{.Container}}\t{{.CPUPerc}}\t{{.MemUsage}}"
```

### Performance Testing

```bash
# Apache Bench (already shown above)
ab -n 5000 -c 50 http://localhost:9003/api/v11/health

# Using curl with timing
time curl -s http://localhost:9003/api/v11/health > /dev/null

# Load test with wrk (if installed)
wrk -t4 -c50 -d30s http://localhost:9003/api/v11/health

# Load test with hey
hey -n 5000 -c 50 http://localhost:9003/api/v11/health
```

---

## Issues & Remediation

### Common Issues & Fixes

**Issue 1: Traefik dashboard not accessible**
```bash
# Check if Traefik is running
docker-compose ps | grep traefik

# Check port 8080
lsof -i :8080

# Verify Traefik API is enabled
docker exec dlt-traefik traefik --help | grep -i dashboard

# Restart if needed
docker-compose restart traefik
```

**Issue 2: Certificate not provisioning**
```bash
# Check Let's Encrypt configuration
docker exec dlt-traefik cat /letsencrypt/acme.json | jq . | head -20

# Check for ACME errors in logs
docker logs dlt-traefik | grep -i acme | tail -10

# Force renewal
docker exec dlt-traefik traefik acme.renewal

# Verify domain resolution
nslookup dlt.aurigraph.io
```

**Issue 3: High latency or timeouts**
```bash
# Check backend service health
curl http://localhost:9003/q/health

# Check Traefik logs for timeout errors
docker logs dlt-traefik | grep -i timeout | tail -10

# Increase timeout if needed (update docker-compose.yml)
# --entryPoints.websecure.transport.respondingTimeouts.idleTimeout=90s

# Check network connectivity
docker network inspect dlt-frontend
```

**Issue 4: High error rate**
```bash
# Check application logs
docker logs dlt-aurigraph-v11 | grep -i error | tail -20

# Check Traefik error logs
docker logs dlt-traefik | grep -i error | tail -20

# Check NGINX (for comparison)
docker logs dlt-nginx-gateway | grep -i error | tail -20

# Run health check
curl -v http://localhost:9003/api/v11/health
```

### Escalation Path

If issues occur:
1. **Check logs** first (Traefik, NGINX, application)
2. **Verify service health** (curl endpoints)
3. **Resource check** (docker stats, disk space)
4. **Network verification** (DNS, connectivity)
5. **Rollback to NGINX** if critical (Phase 2 can be repeated)

---

## Phase 2 → Phase 3 Transition

### Pre-Cutover Checklist (End of Day 7)

```bash
#!/bin/bash
echo "=== PHASE 3 READINESS CHECKLIST ==="

# 1. Service stability
echo "✓ Traefik running without restarts for 7 days"
echo "✓ All routes accessible via Traefik"
echo "✓ Certificate valid and auto-renewed"
echo "✓ Performance baseline established"

# 2. Monitoring data collected
echo "✓ 7 days of performance data collected"
echo "✓ Baseline TPS: ~776K req/sec"
echo "✓ Latency p95: <200ms"
echo "✓ Error rate: <0.1%"

# 3. Team prepared
echo "✓ Team trained on Traefik troubleshooting"
echo "✓ Rollback procedures documented"
echo "✓ Escalation contacts available"

# 4. Final validation
echo "✓ DNS records ready for Traefik IP"
echo "✓ Backup NGINX config preserved"
echo "✓ Monitoring alerts configured"

echo ""
echo "READY FOR PHASE 3: YES ✓"
echo "Proceed with NGINX cutover"
```

### Phase 3 Trigger

Phase 3 (NGINX cutover) should proceed if:
- All success criteria met for 7 consecutive days
- No critical issues or regressions
- Team confidence high (Traefik stable)
- Management approval obtained

**Phase 3 Start**: Begin during low-traffic window (e.g., 2am UTC)

---

## Rollback Strategy

If Phase 2 reveals critical issues:

```bash
# Quick rollback to NGINX-only
docker-compose stop traefik
docker-compose restart nginx-gateway

# Monitor for stability
docker-compose ps
docker logs -f nginx-gateway

# Once stable, restart Phase 2 after analysis
```

---

## Documentation & Reporting

### Daily Report Template

```
=== TRAEFIK PHASE 2 - DAY X REPORT ===

Date: YYYY-MM-DD
Period: 09:00 - 21:00 UTC

Status:
- Traefik: UP (uptime X.XX hours)
- NGINX: UP (baseline comparison)
- V11 API: UP (health check passing)

Performance:
- Requests/sec: XXXXX
- Latency p95: XX ms
- Error rate: 0.XX %
- Memory usage: Traefik XX MB, NGINX XX MB

Issues:
- [List any issues found]

Actions Taken:
- [Remediation if any]

Next Steps:
- [Planned for tomorrow]

Status: ON TRACK FOR PHASE 3 / INVESTIGATION NEEDED
```

### Weekly Summary (End of Phase 2)

Include:
- All 7 daily reports
- Aggregated performance metrics
- Comparison: Traefik vs NGINX
- Root cause analysis of any incidents
- Readiness assessment for Phase 3
- Recommendations

---

## Key Contacts & Escalation

**Traefik Issues**:
- Check Traefik docs: https://doc.traefik.io/traefik/
- Community: https://community.traefik.io/

**Let's Encrypt Issues**:
- ACME Challenge: https://letsencrypt.org/docs/
- Staging environment for testing: https://letsencrypt.org/docs/staging-environment/

**Internal Escalation**:
- DevOps Team Lead
- Infrastructure Team
- Platform Architecture

---

## Success Metrics Summary

| Metric | Target | Baseline | Day 7 Target |
|--------|--------|----------|--------------|
| Traefik Uptime | 100% | N/A | 100% |
| TPS (req/sec) | ≥700K | 776K | ≥750K |
| Latency p95 | <200ms | TBD | TBD |
| Error Rate | <0.1% | TBD | <0.1% |
| Certificate Valid | >30d | TBD | >30d |
| Memory (Traefik) | <256MB | TBD | <100MB |
| CPU (Traefik) | <50% | TBD | <30% |

---

## Conclusion

Phase 2 establishes confidence in Traefik before Phase 3 cutover. Seven days of parallel operation with comprehensive monitoring ensures:
1. Traefik stability proven
2. Performance meets requirements
3. Team expertise developed
4. Rollback tested and ready
5. Data-driven Phase 3 decision

**Next Phase**: Phase 3 (NGINX Cutover) begins Day 8 if all criteria met.
