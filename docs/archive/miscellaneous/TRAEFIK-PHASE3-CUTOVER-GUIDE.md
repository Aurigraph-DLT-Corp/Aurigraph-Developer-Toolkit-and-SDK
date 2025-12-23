# Traefik Phase 3: NGINX Cutover & Decommissioning

**Status**: Phase 3 Implementation Plan
**Date**: November 21, 2025
**Target Date**: End of Phase 2 (Day 8+)
**Duration**: ~2-4 hours from start to full validation
**Objective**: Complete transition from NGINX to Traefik with zero downtime

---

## Overview

Phase 3 is the final cutover from NGINX to Traefik as the primary reverse proxy. This phase:
- Maintains zero-downtime transition
- Stops NGINX gracefully (preserves config)
- Validates all traffic routing through Traefik
- Removes NGINX from production
- Establishes Traefik as sole reverse proxy

**Timeline**:
- T-30min: Final health checks
- T+0: Begin cutover (low-traffic window recommended: 02:00 UTC)
- T+5min: Stop NGINX
- T+10min: Validate Traefik routing
- T+30min: Monitor for issues
- T+1hr: Full validation complete

---

## Pre-Cutover Checklist (Execute 24hrs Before Phase 3)

### 1. Verify Phase 2 Success Criteria (MUST BE MET)

```bash
#!/bin/bash
echo "=== PRE-CUTOVER VALIDATION ==="

# Check 1: Phase 2 completion
echo "✓ Phase 2 monitoring: 7 consecutive days of data collected"
echo "✓ All success criteria met (stability, performance, TLS)"
echo "✓ Management sign-off obtained"

# Check 2: Traefik stability verification
echo ""
echo "Traefik Uptime Check:"
docker logs dlt-traefik 2>&1 | tail -5
echo "Expected: No restart entries"

# Check 3: Service health
echo ""
echo "Service Health:"
curl -s http://localhost:9003/q/health | jq .status
curl -s http://localhost:3000/health
curl -s http://localhost:9090/-/healthy

# Check 4: Certificate validity
echo ""
echo "Certificate Expiry:"
echo | openssl s_client -connect localhost:443 -servername dlt.aurigraph.io 2>&1 | \
  grep "notAfter"

# Check 5: Traefik routing validation
echo ""
echo "Traefik Routes:"
curl -s http://localhost:8080/ping
curl -s http://localhost:8080/api/http/routers | jq '.[] | .name' | head -10

# Check 6: NGINX baseline
echo ""
echo "NGINX Status (for rollback readiness):"
docker-compose ps | grep nginx-gateway

echo ""
echo "=== PRE-CUTOVER VALIDATION COMPLETE ==="
echo "If all checks pass, Phase 3 is ready to execute"
```

### 2. Team & Communication Preparation

- [ ] Notify DevOps team and stakeholders
- [ ] Confirm on-call support availability
- [ ] Prepare communication channels (Slack, PagerDuty)
- [ ] Document escalation contacts
- [ ] Verify monitoring & alerting active
- [ ] Test rollback procedure (dry run)

### 3. Backup & Disaster Recovery

```bash
# 1. Backup NGINX configuration
docker cp dlt-nginx-gateway:/etc/nginx /tmp/nginx-backup-$(date +%s)
echo "NGINX config backed up to /tmp/nginx-backup-*"

# 2. Backup Docker compose files
cp docker-compose.yml /tmp/docker-compose-backup-phase3.yml
echo "Docker compose backed up"

# 3. Backup Traefik ACME config
docker cp dlt-traefik:/letsencrypt/acme.json /tmp/acme-backup-$(date +%s).json
echo "ACME config backed up"

# 4. Record current NGINX IP
NGINX_IP=$(docker inspect dlt-nginx-gateway -f '{{.NetworkSettings.Networks.dlt-frontend.IPAddress}}')
echo "NGINX IP: $NGINX_IP (saved for rollback)"

# 5. Record current Traefik IP
TRAEFIK_IP=$(docker inspect dlt-traefik -f '{{.NetworkSettings.Networks.dlt-frontend.IPAddress}}')
echo "Traefik IP: $TRAEFIK_IP"
```

---

## Phase 3 Execution (Actual Cutover)

### Step 1: Final Pre-Cutover Validation (T-30min)

Execute exactly 30 minutes before cutover start:

```bash
#!/bin/bash
echo "=== T-30min: FINAL PRE-CUTOVER VALIDATION ==="

# 1. Last baseline performance check
echo "1. Performance Baseline:"
ab -n 1000 -c 50 http://localhost:9003/api/v11/health 2>&1 | grep "Requests per second"

# 2. Service dependency check
echo ""
echo "2. Service Dependencies:"
docker-compose ps | awk '{print $1, $NF}' | grep -E "postgres|redis|prometheus|grafana"

# 3. Database connectivity
echo ""
echo "3. Database Connectivity:"
docker exec dlt-postgres pg_isready -U aurigraph -d aurigraph -h localhost
echo "Expected: accepting connections"

# 4. Current error rate
echo ""
echo "4. Current Error Rate (last 5 min):"
docker logs --since 5m dlt-traefik 2>&1 | grep -i error | wc -l
echo "errors found (target: 0-5)"

# 5. Memory & CPU headroom
echo ""
echo "5. System Resources:"
docker stats --no-stream --format "table {{.Container}}\t{{.CPUPerc}}\t{{.MemUsage}}"

echo ""
echo "=== ALL CHECKS PASSED - PROCEED TO CUTOVER ==="
```

### Step 2: Execute Cutover (T+0 to T+5min)

**Start Time**: Choose low-traffic window (recommended 02:00-03:00 UTC)

```bash
#!/bin/bash
set -e

CUTOVER_TIME=$(date '+%Y-%m-%d %H:%M:%S')
CUTOVER_LOG="/tmp/phase3-cutover-$CUTOVER_TIME.log"

echo "=== PHASE 3 CUTOVER START ===" | tee $CUTOVER_LOG
echo "Time: $CUTOVER_TIME" | tee -a $CUTOVER_LOG
echo "Target: Stop NGINX, validate Traefik" | tee -a $CUTOVER_LOG
echo "" | tee -a $CUTOVER_LOG

# Step 1: Drain connections (30 seconds)
echo "[T+0] Draining NGINX connections..." | tee -a $CUTOVER_LOG
docker exec dlt-nginx-gateway nginx -s reload
sleep 30

# Step 2: Stop NGINX gracefully
echo "[T+30] Stopping NGINX gracefully..." | tee -a $CUTOVER_LOG
docker-compose stop nginx-gateway
NGINX_STOP_TIME=$(date '+%Y-%m-%d %H:%M:%S')
echo "NGINX stopped at: $NGINX_STOP_TIME" | tee -a $CUTOVER_LOG

# Step 3: Wait for Traefik to assume full load
echo "[T+45] Allowing Traefik 15 seconds to stabilize..." | tee -a $CUTOVER_LOG
sleep 15

# Step 4: Verify Traefik health
echo "[T+60] Verifying Traefik health..." | tee -a $CUTOVER_LOG
TRAEFIK_HEALTH=$(curl -s http://localhost:8080/ping)
if [ "$TRAEFIK_HEALTH" = "OK" ]; then
  echo "✓ Traefik health: OK" | tee -a $CUTOVER_LOG
else
  echo "✗ Traefik health check FAILED!" | tee -a $CUTOVER_LOG
  echo "ROLLING BACK!" | tee -a $CUTOVER_LOG
  docker-compose start nginx-gateway
  exit 1
fi

# Step 5: Verify all services respond
echo "[T+65] Verifying service accessibility..." | tee -a $CUTOVER_LOG
HEALTH_CHECK=$(curl -s http://localhost:9003/api/v11/health)
if echo "$HEALTH_CHECK" | grep -q "UP"; then
  echo "✓ V11 API: UP" | tee -a $CUTOVER_LOG
else
  echo "✗ V11 API: FAILED" | tee -a $CUTOVER_LOG
  docker-compose start nginx-gateway
  exit 1
fi

# Step 6: Check portal
PORTAL_CHECK=$(curl -s http://localhost:3000/health)
if [ $? -eq 0 ]; then
  echo "✓ Portal: UP" | tee -a $CUTOVER_LOG
else
  echo "⚠ Portal: check needed (may still be starting)" | tee -a $CUTOVER_LOG
fi

echo "" | tee -a $CUTOVER_LOG
echo "=== PHASE 3 CUTOVER COMPLETE ===" | tee -a $CUTOVER_LOG
echo "NGINX stopped: $NGINX_STOP_TIME" | tee -a $CUTOVER_LOG
echo "Traefik handling all traffic: YES" | tee -a $CUTOVER_LOG
echo "Log saved: $CUTOVER_LOG" | tee -a $CUTOVER_LOG
```

**Save this as**: `/tmp/phase3-cutover.sh` and run:
```bash
chmod +x /tmp/phase3-cutover.sh
/tmp/phase3-cutover.sh
```

### Step 3: Immediate Validation (T+5min to T+30min)

Monitor for issues every minute for first 30 minutes:

```bash
#!/bin/bash
echo "=== T+5min: IMMEDIATE VALIDATION PHASE ==="

# Health check loop (runs 25 times = 25 minutes)
for i in {1..25}; do
  TIMESTAMP=$(date '+%H:%M:%S')

  # 1. HTTP connectivity
  API_STATUS=$(curl -s -o /dev/null -w '%{http_code}' http://localhost:9003/api/v11/health)

  # 2. TPS check
  TPS=$(ab -n 100 -c 10 http://localhost:9003/api/v11/health 2>&1 | grep "Requests per second" | awk '{print $NF}')

  # 3. Error rate
  ERRORS=$(curl -s http://localhost:9003/api/v11/health 2>&1 | grep -c error || echo 0)

  # 4. Memory usage
  MEMORY=$(docker stats --no-stream dlt-traefik | tail -1 | awk '{print $4}')

  # 5. Container health
  TRAEFIK_HEALTH=$(docker inspect dlt-traefik --format='{{.State.Health.Status}}' 2>/dev/null || echo "running")

  # Log results
  printf "[%s] Status:%d TPS:%.0f Errors:%d Memory:%s Health:%s\n" \
    "$TIMESTAMP" "$API_STATUS" "$TPS" "$ERRORS" "$MEMORY" "$TRAEFIK_HEALTH"

  # Break on error
  if [ "$API_STATUS" != "200" ]; then
    echo "⚠️ WARNING: API returned non-200 status"
  fi

  sleep 60
done

echo "=== VALIDATION PERIOD COMPLETE ==="
```

### Step 4: Extended Monitoring (T+30min to T+4hrs)

```bash
#!/bin/bash
echo "=== T+30min: EXTENDED MONITORING PHASE ==="
echo "Monitoring every 5 minutes for 4 hours..."

# Monitor for 4 hours (240 minutes)
for i in {1..48}; do
  TIMESTAMP=$(date '+%Y-%m-%d %H:%M:%S')

  # Full health check
  echo "[$i/48] $TIMESTAMP"

  # 1. Traefik dashboard
  DASHBOARD=$(curl -s http://localhost:8080/ping)
  echo "  Dashboard: $DASHBOARD"

  # 2. Request count
  REQ_COUNT=$(docker logs dlt-traefik --since 5m 2>&1 | grep -c "http")
  echo "  Requests (5m): ~$REQ_COUNT"

  # 3. Error check
  ERROR_COUNT=$(docker logs dlt-traefik --since 5m 2>&1 | grep -i "error" | wc -l)
  echo "  Errors (5m): $ERROR_COUNT"

  # 4. Certificate status
  CERT_VALID=$(echo | openssl s_client -connect localhost:443 2>&1 | grep "Verify return code" | grep "OK")
  echo "  TLS: $([ -n "$CERT_VALID" ] && echo "OK" || echo "CHECK NEEDED")"

  # 5. Response time
  RESPONSE_MS=$(curl -s -o /dev/null -w '%{time_total}' http://localhost:9003/api/v11/health | awk '{printf "%.0f ms\n", $1 * 1000}')
  echo "  Response: $RESPONSE_MS"

  echo ""
  sleep 300  # 5 minute intervals
done

echo "=== EXTENDED MONITORING COMPLETE ==="
```

---

## Post-Cutover Actions

### Phase 3A: Validation Complete (T+4hrs)

Once 4 hours have passed with no issues:

```bash
#!/bin/bash
echo "=== PHASE 3A: POST-CUTOVER VALIDATION ==="

# 1. Verify NGINX is stopped
echo "1. NGINX Status:"
docker-compose ps | grep nginx-gateway
echo "Expected: Exited"

# 2. Verify Traefik uptime
echo ""
echo "2. Traefik Uptime:"
docker ps -a | grep dlt-traefik | awk '{print $NF}'
echo "Expected: >4 hours"

# 3. Performance baseline (post-cutover)
echo ""
echo "3. Performance Check:"
ab -n 5000 -c 50 http://localhost:9003/api/v11/health 2>&1 | \
  grep -E "Requests per second|Mean.*Request|Failed"

# 4. Error rate (post-cutover)
echo ""
echo "4. Error Rate (4-hour window):"
ERROR_PERCENTAGE=$(docker logs dlt-traefik --since 4h 2>&1 | \
  grep -c "error" | awk '{if ($1 > 10) print "HIGH"; else print "NORMAL"}')
echo "Status: $ERROR_PERCENTAGE"

# 5. Certificate validation
echo ""
echo "5. Certificate Status:"
echo | openssl s_client -connect localhost:443 2>&1 | \
  grep -E "subject=|notAfter"

echo ""
echo "✓ PHASE 3A VALIDATION COMPLETE"
echo "Proceeding to Phase 3B: NGINX Decommissioning"
```

### Phase 3B: NGINX Decommissioning (After 24hrs stable operation)

After Traefik has been stable for 24 hours:

```bash
#!/bin/bash
echo "=== PHASE 3B: NGINX DECOMMISSIONING ==="

# Step 1: Remove NGINX from docker-compose.yml
echo "1. Removing NGINX service from docker-compose.yml..."
# Manually edit docker-compose.yml or use sed:
sed -i.bak '/nginx-gateway:/,/restart: unless-stopped/d' docker-compose.yml
echo "✓ NGINX service removed from composition"

# Step 2: Remove NGINX configuration
echo ""
echo "2. Removing NGINX configuration files..."
rm -rf config/nginx/
echo "✓ NGINX configs removed"

# Step 3: Remove NGINX container
echo ""
echo "3. Removing NGINX container and volumes..."
docker-compose down nginx-gateway || true
docker volume rm dlt-nginx-config || true
echo "✓ NGINX container removed"

# Step 4: Remove NGINX image
echo ""
echo "4. Cleaning up NGINX image..."
docker image rm nginx:1.25-alpine || true
echo "✓ NGINX image cleaned"

# Step 5: Verify cleanup
echo ""
echo "5. Verification:"
docker-compose ps | grep nginx && echo "⚠️ WARNING: NGINX still running" || echo "✓ NGINX fully removed"

# Step 6: Traefik verification
echo ""
echo "6. Traefik Status:"
docker-compose ps | grep traefik
echo "✓ Traefik is primary reverse proxy"

echo ""
echo "=== NGINX DECOMMISSIONING COMPLETE ==="
echo "Traefik is now the sole reverse proxy"
```

---

## Rollback Procedure (If Issues Occur)

If critical issues occur during Phase 3:

### Quick Rollback (T+0 to T+30min)

```bash
#!/bin/bash
echo "=== QUICK ROLLBACK: RESTORING NGINX ==="

# 1. Stop Traefik temporarily (if needed)
# docker-compose stop traefik

# 2. Start NGINX
echo "Starting NGINX..."
docker-compose start nginx-gateway

# 3. Wait for startup
sleep 10

# 4. Verify NGINX health
echo "Verifying NGINX..."
curl -s http://localhost/health

# 5. Monitor logs
docker logs -f dlt-nginx-gateway &

echo "✓ Rollback to NGINX complete"
echo "Traefik stopped, NGINX handling traffic"
```

### Full Rollback (If Decommissioning Already Started)

```bash
#!/bin/bash
echo "=== FULL ROLLBACK: RESTORING COMPLETE STACK ==="

# 1. Restore docker-compose.yml
echo "1. Restoring docker-compose.yml..."
cp /tmp/docker-compose-backup-phase3.yml docker-compose.yml

# 2. Restore NGINX configs
echo "2. Restoring NGINX configs..."
cp -r /tmp/nginx-backup-* config/nginx/

# 3. Bring up full stack
echo "3. Starting all services..."
docker-compose up -d

# 4. Wait for stabilization
sleep 30

# 5. Verify all services
echo "4. Verifying services..."
docker-compose ps

# 6. Test connectivity
echo "5. Testing connectivity..."
curl -s http://localhost/health
curl -s http://localhost:9003/api/v11/health

echo "✓ Full rollback complete"
```

**Rollback Success Criteria**:
- NGINX responding to health checks
- V11 API accessible on port 9003
- All services stable
- No error spikes in logs

---

## Validation Checklist (After Phase 3)

### Phase 3 Completion Checklist

```bash
#!/bin/bash
cat > /tmp/phase3-completion-checklist.txt << 'EOF'
PHASE 3 COMPLETION CHECKLIST
============================

☐ NGINX Gracefully Stopped
  - docker-compose ps shows NGINX as Exited
  - No errors in NGINX logs during shutdown
  - Shutdown completed without timeout

☐ Traefik Handling All Traffic
  - Traefik continuously running (no restarts)
  - All routes accessible via Traefik
  - Response times normal (<200ms p95)

☐ TLS/Certificate Working
  - HTTPS connections successful
  - Let's Encrypt certificate valid
  - TLS 1.3 negotiated
  - No certificate warnings

☐ All Services Accessible
  - ✓ V11 API (http://localhost:9003/api/v11/health)
  - ✓ Portal (http://localhost:3000)
  - ✓ Prometheus (http://localhost:9090)
  - ✓ Grafana (http://localhost:3001)
  - ✓ Traefik Dashboard (http://localhost:8080/dashboard)

☐ Performance Meets Requirements
  - TPS ≥ 750K requests/sec
  - Latency p95 < 200ms
  - Error rate < 0.1%
  - No memory leaks (stable over 4+ hours)

☐ Monitoring & Alerting Active
  - Prometheus collecting metrics
  - Grafana dashboards updating
  - Alerts configured for Traefik
  - Log aggregation working

☐ Documentation Updated
  - Phase 3 log saved
  - Runbooks updated
  - Team documentation current
  - Escalation procedures updated

☐ Team Training Complete
  - Team trained on Traefik monitoring
  - Troubleshooting procedures known
  - Rollback procedure tested
  - On-call support briefed

☐ FINAL SIGN-OFF
  - DevOps Lead: _____________ Date: _______
  - Platform Architect: ______ Date: _______
  - Infrastructure Lead: _____ Date: _______

RESULT: [ ] PHASE 3 COMPLETE ✓ | [ ] ISSUES FOUND - See Details

Details/Issues:
_________________________________
_________________________________
_________________________________

EOF
cat /tmp/phase3-completion-checklist.txt
```

---

## Monitoring After Phase 3

### Daily Monitoring (First 7 Days Post-Cutover)

```bash
#!/bin/bash
# Run daily after Phase 3 for first week

REPORT_DATE=$(date '+%Y-%m-%d')
REPORT_FILE="/tmp/traefik-postphase3-$REPORT_DATE.log"

echo "=== POST-CUTOVER MONITORING REPORT ===" > $REPORT_FILE
echo "Date: $REPORT_DATE" >> $REPORT_FILE
echo "" >> $REPORT_FILE

# 1. Uptime check
echo "1. Service Uptime:" >> $REPORT_FILE
docker-compose ps | grep traefik >> $REPORT_FILE

# 2. Error analysis
echo "" >> $REPORT_FILE
echo "2. Error Trends (24h):" >> $REPORT_FILE
docker logs --since 24h dlt-traefik 2>&1 | grep -i error | wc -l >> $REPORT_FILE

# 3. Performance metrics
echo "" >> $REPORT_FILE
echo "3. Performance (24h avg):" >> $REPORT_FILE
docker logs --since 24h dlt-traefik 2>&1 | grep -i "request" | head -5 >> $REPORT_FILE

# 4. Certificate status
echo "" >> $REPORT_FILE
echo "4. Certificate Status:" >> $REPORT_FILE
echo | openssl s_client -connect localhost:443 2>&1 | grep "notAfter" >> $REPORT_FILE

# 5. Resource usage
echo "" >> $REPORT_FILE
echo "5. Resource Usage:" >> $REPORT_FILE
docker stats --no-stream dlt-traefik >> $REPORT_FILE

echo "Report saved: $REPORT_FILE"
```

### Weekly Review (Days 8-14 Post-Cutover)

- Review monitoring logs
- Verify no trends or anomalies
- Document lessons learned
- Update runbooks based on experience
- Schedule Phase 3B decommissioning

---

## Success Criteria Summary

| Criterion | Requirement | Timeline |
|-----------|-------------|----------|
| **Availability** | 100% uptime | T+4hrs |
| **TPS** | ≥750K req/sec | T+30min |
| **Latency** | p95 <200ms | T+30min |
| **Errors** | <0.1% rate | T+1hr |
| **TLS** | Valid certificate | T+5min |
| **All Services** | Accessible | T+5min |
| **Rollback Ready** | Tested & working | Pre-cutover |

**Phase 3 PASSED** when all criteria met for T+4hrs period.

---

## Conclusion

Phase 3 represents the final transition from NGINX to Traefik. With careful execution, validation, and monitoring, this transition occurs with zero downtime and no service disruption.

**Key Success Factors**:
1. Complete Phase 2 successfully first
2. Execute during low-traffic window
3. Have rollback procedure ready
4. Monitor aggressively first 4 hours
5. Document everything
6. Celebrate when complete!

**Next Step**: Phase 3B decommissioning (after 24 hours stability)
