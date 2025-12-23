# Aurigraph V11 Production Runbook
**Version:** 11.0.0
**Last Updated:** October 12, 2025
**Status:** Production Ready

---

## Table of Contents
1. [System Overview](#system-overview)
2. [Emergency Contacts](#emergency-contacts)
3. [Quick Reference](#quick-reference)
4. [Common Operations](#common-operations)
5. [Troubleshooting](#troubleshooting)
6. [Incident Response](#incident-response)
7. [Deployment Procedures](#deployment-procedures)
8. [Monitoring & Alerts](#monitoring--alerts)
9. [Backup & Recovery](#backup--recovery)
10. [Security Procedures](#security-procedures)

---

## System Overview

### Architecture
- **Platform:** Aurigraph V11 - High-performance blockchain
- **Runtime:** Java 21 + GraalVM Native
- **Framework:** Quarkus 3.26.2
- **Protocol:** gRPC + HTTP/2 REST
- **Target Performance:** 2M+ TPS

### Core Components
1. **Transaction Service** - High-throughput transaction processing
2. **Consensus Service** - HyperRAFT++ consensus mechanism
3. **Bridge Service** - Cross-chain interoperability
4. **AI Optimization Service** - ML-based performance tuning
5. **Monitoring Service** - Real-time system observability

### Infrastructure
- **Deployment:** Kubernetes with blue-green strategy
- **Monitoring:** Prometheus + Grafana
- **Logging:** ELK Stack (Elasticsearch + Logstash + Kibana)
- **Alerting:** Alertmanager with PagerDuty integration

---

## Emergency Contacts

### On-Call Rotation
| Role | Primary | Secondary | Escalation |
|------|---------|-----------|------------|
| **Platform Engineer** | +1-XXX-XXX-XXXX | +1-XXX-XXX-XXXX | CTO |
| **DevOps Lead** | +1-XXX-XXX-XXXX | +1-XXX-XXX-XXXX | VP Engineering |
| **Security Lead** | +1-XXX-XXX-XXXX | +1-XXX-XXX-XXXX | CISO |
| **Database Admin** | +1-XXX-XXX-XXXX | +1-XXX-XXX-XXXX | Platform Engineer |

### Communication Channels
- **PagerDuty:** https://aurigraph.pagerduty.com
- **Slack:** #aurigraph-alerts (critical), #aurigraph-ops (general)
- **Zoom War Room:** https://zoom.us/j/aurigraph-incident
- **Status Page:** https://status.aurigraph.io

---

## Quick Reference

### Service Endpoints
```bash
# Production
https://api.aurigraph.io        # Main API
https://grpc.aurigraph.io:9004  # gRPC endpoint
https://ws.aurigraph.io/ws      # WebSocket endpoint
https://metrics.aurigraph.io    # Prometheus metrics
https://logs.aurigraph.io       # Kibana logs

# Health Checks
curl https://api.aurigraph.io/q/health
curl https://api.aurigraph.io/q/health/live
curl https://api.aurigraph.io/q/health/ready
```

### Quick Commands
```bash
# Check service status
kubectl get pods -n aurigraph-production

# View logs
kubectl logs -f deployment/aurigraph-v11-blue -n aurigraph-production

# Get performance metrics
curl https://api.aurigraph.io/q/metrics | grep aurigraph_transactions

# Check consensus status
grpcurl -plaintext grpc.aurigraph.io:9004 \
  io.aurigraph.v11.services.HyperRAFTPlusConsensusService/GetConsensusStats
```

### Performance Baselines
- **TPS:** 776K current, 2M+ target
- **Latency:** P50 < 100ms, P99 < 500ms
- **CPU:** < 75% sustained
- **Memory:** < 75% of 2GB limit
- **Error Rate:** < 1%

---

## Common Operations

### 1. Restarting Services

#### Graceful Restart (Zero Downtime)
```bash
# Rolling restart
kubectl rollout restart deployment/aurigraph-v11-blue -n aurigraph-production

# Monitor rollout
kubectl rollout status deployment/aurigraph-v11-blue -n aurigraph-production
```

#### Emergency Restart
```bash
# Force restart all pods
kubectl delete pods -l app=aurigraph-v11 -n aurigraph-production

# Wait for new pods
kubectl wait --for=condition=ready pod -l app=aurigraph-v11 -n aurigraph-production --timeout=300s
```

### 2. Scaling Services

#### Horizontal Scaling
```bash
# Scale up
kubectl scale deployment aurigraph-v11-blue --replicas=5 -n aurigraph-production

# Scale down
kubectl scale deployment aurigraph-v11-blue --replicas=3 -n aurigraph-production

# Auto-scaling (HPA)
kubectl autoscale deployment aurigraph-v11-blue \
  --min=3 --max=10 --cpu-percent=75 -n aurigraph-production
```

### 3. Checking System Health

#### Application Health
```bash
# Health check
curl -f https://api.aurigraph.io/q/health || echo "UNHEALTHY"

# Detailed health
curl https://api.aurigraph.io/q/health | jq '.'
```

#### Resource Health
```bash
# CPU and memory usage
kubectl top pods -n aurigraph-production

# Node status
kubectl get nodes
kubectl describe node <node-name>
```

#### Consensus Health
```bash
# Check leader status
grpcurl -plaintext grpc.aurigraph.io:9004 \
  io.aurigraph.v11.services.HyperRAFTPlusConsensusService/GetConsensusStats \
  | jq '.leader_id, .state, .throughput_tps'
```

### 4. Viewing Logs

#### Application Logs
```bash
# Tail logs
kubectl logs -f deployment/aurigraph-v11-blue -n aurigraph-production

# Last 100 lines
kubectl logs --tail=100 deployment/aurigraph-v11-blue -n aurigraph-production

# Specific container
kubectl logs -f pod/<pod-name> -c aurigraph-v11 -n aurigraph-production
```

#### Centralized Logs (Kibana)
```bash
# Access Kibana
open https://logs.aurigraph.io

# Query examples:
# - All errors: log_level: "ERROR"
# - Transaction failures: tags: "transactions" AND transaction_status: "FAILED"
# - Security events: tags: "security" AND severity: "CRITICAL"
```

### 5. Accessing Metrics

#### Prometheus Queries
```bash
# Current TPS
rate(aurigraph_transactions_processed_total[1m])

# P99 Latency
histogram_quantile(0.99, rate(aurigraph_transaction_duration_seconds_bucket[5m]))

# Error rate
(rate(aurigraph_transactions_failed_total[5m]) / rate(aurigraph_transactions_total[5m])) * 100
```

#### Grafana Dashboards
- **System Overview:** https://metrics.aurigraph.io/d/system-overview
- **Transaction Performance:** https://metrics.aurigraph.io/d/transactions
- **Consensus Health:** https://metrics.aurigraph.io/d/consensus
- **Security Monitoring:** https://metrics.aurigraph.io/d/security
- **Bridge Operations:** https://metrics.aurigraph.io/d/bridge

---

## Troubleshooting

### High CPU Usage

**Symptoms:**
- CPU > 90% sustained
- Increased latency
- Throttled transaction processing

**Diagnosis:**
```bash
# Check CPU usage
kubectl top pods -n aurigraph-production

# Get thread dump
kubectl exec -it <pod-name> -n aurigraph-production -- jcmd 1 Thread.print

# Check GC activity
kubectl logs <pod-name> -n aurigraph-production | grep -i "gc pause"
```

**Resolution:**
1. Check for infinite loops in recent deployments
2. Review AI optimization settings
3. Scale horizontally if needed
4. Adjust JVM heap settings if GC pressure is high

**Runbook:** https://docs.aurigraph.io/runbooks/high-cpu

---

### High Memory Usage

**Symptoms:**
- Memory > 90% of limit
- Frequent GC pauses
- Out of Memory errors

**Diagnosis:**
```bash
# Check memory usage
kubectl top pods -n aurigraph-production

# Get heap dump
kubectl exec -it <pod-name> -n aurigraph-production -- \
  jcmd 1 GC.heap_dump /tmp/heap.hprof
```

**Resolution:**
1. Check for memory leaks in transaction processing
2. Review cache sizes
3. Increase memory limits if justified
4. Restart affected pods

**Runbook:** https://docs.aurigraph.io/runbooks/high-memory

---

### Low TPS (< 100K)

**Symptoms:**
- TPS drops below 100K for > 10 minutes
- Transaction queue backing up
- Alert: "LowTransactionsPerSecond"

**Diagnosis:**
```bash
# Check current TPS
curl https://api.aurigraph.io/q/metrics | grep aurigraph_transactions_processed

# Check consensus health
grpcurl -plaintext grpc.aurigraph.io:9004 \
  io.aurigraph.v11.services.HyperRAFTPlusConsensusService/GetConsensusStats

# Check for network issues
kubectl exec -it <pod-name> -n aurigraph-production -- ping <peer-pod-ip>
```

**Resolution:**
1. Check consensus leader stability
2. Verify network connectivity between nodes
3. Check for resource constraints (CPU/memory)
4. Review recent configuration changes
5. Consider triggering AI optimization

**Runbook:** https://docs.aurigraph.io/runbooks/low-tps

---

### Consensus Failures

**Symptoms:**
- Consensus timeouts
- Frequent leader elections
- Alert: "ConsensusFailure"

**Diagnosis:**
```bash
# Check consensus stats
grpcurl -plaintext grpc.aurigraph.io:9004 \
  io.aurigraph.v11.services.HyperRAFTPlusConsensusService/GetConsensusStats

# Check logs for errors
kubectl logs deployment/aurigraph-v11-blue -n aurigraph-production | grep -i "consensus"

# Check network latency
kubectl exec -it <pod-name> -n aurigraph-production -- \
  ping -c 10 <peer-pod-ip>
```

**Resolution:**
1. Check if leader node is healthy
2. Verify quorum (need majority of nodes)
3. Check network latency between nodes (should be < 50ms)
4. Review recent configuration changes
5. Force leader election if stuck:
   ```bash
   grpcurl -plaintext grpc.aurigraph.io:9004 \
     io.aurigraph.v11.services.HyperRAFTPlusConsensusService/TransferLeadership \
     -d '{"target_node_id": "node-2", "timeout_ms": 5000}'
   ```

**Runbook:** https://docs.aurigraph.io/runbooks/consensus-failure

---

### High Error Rate (> 1%)

**Symptoms:**
- Error rate > 1%
- Failed transactions increasing
- Alert: "HighErrorRate"

**Diagnosis:**
```bash
# Check error metrics
curl https://api.aurigraph.io/q/metrics | grep aurigraph_transactions_failed

# Review error logs
kubectl logs deployment/aurigraph-v11-blue -n aurigraph-production | grep ERROR

# Check specific error types
curl https://logs.aurigraph.io/api/search?q=log_level:ERROR
```

**Resolution:**
1. Identify error patterns in logs
2. Check for invalid transactions (signature failures, etc.)
3. Verify database connectivity
4. Check for rate limiting issues
5. Review recent code deployments

**Runbook:** https://docs.aurigraph.io/runbooks/high-errors

---

### Bridge Transaction Stuck

**Symptoms:**
- Bridge transaction pending > 1 hour
- Alert: "BridgeTransactionStuck"

**Diagnosis:**
```bash
# Check bridge status
curl https://api.aurigraph.io/api/v11/bridge/status/<bridge-id>

# Check bridge logs
kubectl logs deployment/aurigraph-v11-blue -n aurigraph-production | grep "bridge"

# Check destination chain status
curl https://etherscan.io/api?module=proxy&action=eth_blockNumber
```

**Resolution:**
1. Verify destination chain is operational
2. Check gas prices on destination chain
3. Verify bridge validator signatures
4. Check for insufficient gas/funds
5. Manual intervention if needed:
   ```bash
   # Retry bridge operation
   curl -X POST https://api.aurigraph.io/api/v11/bridge/retry/<bridge-id>
   ```

**Runbook:** https://docs.aurigraph.io/runbooks/bridge-stuck

---

## Incident Response

### Severity Levels

#### P0 - Critical (Immediate Response)
- **Definition:** Complete service outage, data loss risk
- **Response Time:** < 5 minutes
- **Examples:** All services down, data corruption, security breach
- **Actions:**
  1. Page on-call engineer immediately
  2. Create incident channel: `#incident-<timestamp>`
  3. Notify leadership in #exec-alerts
  4. Update status page
  5. Begin incident response procedure

#### P1 - High (Urgent Response)
- **Definition:** Major feature unavailable, significant performance degradation
- **Response Time:** < 15 minutes
- **Examples:** TPS < 100K, consensus failures, bridge down
- **Actions:**
  1. Alert on-call engineer
  2. Create incident channel
  3. Update status page
  4. Begin troubleshooting

#### P2 - Medium (Normal Response)
- **Definition:** Minor feature degradation, isolated issues
- **Response Time:** < 1 hour
- **Examples:** Elevated latency, single node failure
- **Actions:**
  1. Notify team in #aurigraph-ops
  2. Create ticket for tracking
  3. Schedule fix during business hours

#### P3 - Low (Best Effort)
- **Definition:** Cosmetic issues, non-critical warnings
- **Response Time:** Next business day
- **Examples:** Documentation errors, minor UI issues
- **Actions:**
  1. Create ticket
  2. Add to backlog

### Incident Response Workflow

```
1. DETECT → Alert fires / User report
           ↓
2. ASSESS → Determine severity (P0-P3)
           ↓
3. RESPOND → Page appropriate personnel
           ↓
4. COMMUNICATE → Update status page, stakeholders
           ↓
5. MITIGATE → Apply immediate fix/workaround
           ↓
6. RESOLVE → Deploy permanent fix
           ↓
7. VERIFY → Confirm resolution, monitor
           ↓
8. POST-MORTEM → Document lessons learned
```

### Incident Communication Template

```
**INCIDENT REPORT**
**Severity:** P[0-3]
**Started:** YYYY-MM-DD HH:MM UTC
**Status:** [INVESTIGATING | IDENTIFIED | MONITORING | RESOLVED]

**Impact:**
- Affected systems: [list]
- User impact: [description]
- Estimated users affected: [number]

**Current Actions:**
- [Action 1]
- [Action 2]

**Next Update:** [time]

**Incident Commander:** [name]
**War Room:** https://zoom.us/j/aurigraph-incident
```

---

## Deployment Procedures

### Blue-Green Deployment

#### Prerequisites
```bash
# 1. Verify Docker image exists
docker image inspect aurigraph-v11:<version>

# 2. Run pre-deployment tests
./mvnw test
./mvnw verify

# 3. Backup current configuration
kubectl get configmap aurigraph-config -n aurigraph-production -o yaml > backup-config.yaml
```

#### Deployment Steps
```bash
# 1. Run blue-green deployment script
./blue-green-deploy.sh <version>

# 2. Monitor deployment progress
# Script will:
# - Deploy to green environment
# - Run health checks
# - Execute smoke tests
# - Gradually shift traffic (10% increments)
# - Monitor error rates and latency
# - Complete cutover or auto-rollback

# 3. Verify deployment
curl https://api.aurigraph.io/api/v11/info | jq '.version'
```

#### Manual Rollback
```bash
# If auto-rollback fails, manual rollback:
kubectl patch service aurigraph-v11 -n aurigraph-production --type='json' \
  -p='[{"op": "replace", "path": "/spec/selector/color", "value": "blue"}]'

# Delete green deployment
kubectl delete deployment aurigraph-v11-green -n aurigraph-production
```

### Configuration Changes

#### Updating Environment Variables
```bash
# 1. Edit configmap
kubectl edit configmap aurigraph-config -n aurigraph-production

# 2. Restart pods to apply changes
kubectl rollout restart deployment/aurigraph-v11-blue -n aurigraph-production

# 3. Verify changes
kubectl exec -it <pod-name> -n aurigraph-production -- env | grep QUARKUS
```

#### Updating Secrets
```bash
# 1. Update secret
kubectl create secret generic aurigraph-secrets \
  --from-literal=db-password=<new-password> \
  --dry-run=client -o yaml | kubectl apply -f -

# 2. Restart pods
kubectl rollout restart deployment/aurigraph-v11-blue -n aurigraph-production
```

---

## Monitoring & Alerts

### Alert Escalation Matrix

| Alert Name | Severity | Response Time | Escalation Path |
|------------|----------|---------------|-----------------|
| AurigraphServiceDown | Critical | Immediate | On-Call → Team Lead → VP Eng |
| ConsensusFailure | Critical | Immediate | On-Call → Team Lead |
| LowTransactionsPerSecond | High | 15 min | On-Call → Team Lead |
| HighErrorRate | High | 15 min | On-Call |
| BridgeTransactionStuck | High | 15 min | On-Call → Bridge Team |
| HighLatencyP99 | Medium | 1 hour | On-Call |
| ElevatedCPUUsage | Medium | 1 hour | On-Call |

### Alert Response Procedures

Each alert has a dedicated runbook at:
`https://docs.aurigraph.io/runbooks/<alert-name-lowercase>`

---

## Backup & Recovery

### Backup Schedule
- **Transaction Data:** Continuous replication + hourly snapshots
- **Consensus State:** Hourly snapshots
- **Configuration:** Daily backups
- **Logs:** 30-day retention in Elasticsearch

### Creating Manual Backup
```bash
# 1. Snapshot LevelDB data
kubectl exec -it <pod-name> -n aurigraph-production -- \
  tar czf /tmp/leveldb-backup.tar.gz /data/leveldb

# 2. Copy to backup location
kubectl cp aurigraph-production/<pod-name>:/tmp/leveldb-backup.tar.gz \
  ./backups/leveldb-$(date +%Y%m%d-%H%M%S).tar.gz

# 3. Upload to S3
aws s3 cp leveldb-*.tar.gz s3://aurigraph-backups/production/
```

### Disaster Recovery Procedure

#### Scenario: Complete Data Loss
```bash
# 1. Stop all services
kubectl scale deployment aurigraph-v11-blue --replicas=0 -n aurigraph-production

# 2. Restore from latest backup
aws s3 cp s3://aurigraph-backups/production/latest.tar.gz ./
kubectl cp latest.tar.gz aurigraph-production/<pod-name>:/data/

# 3. Extract backup
kubectl exec -it <pod-name> -n aurigraph-production -- \
  tar xzf /data/latest.tar.gz -C /data/

# 4. Restart services
kubectl scale deployment aurigraph-v11-blue --replicas=3 -n aurigraph-production

# 5. Verify data integrity
curl https://api.aurigraph.io/api/v11/stats
```

#### Recovery Time Objectives (RTO/RPO)
- **RTO (Recovery Time Objective):** < 1 hour
- **RPO (Recovery Point Objective):** < 5 minutes
- **Data Loss Tolerance:** Minimal (< 1 minute of transactions)

---

## Security Procedures

### Security Incident Response

#### Suspected Breach
1. **Isolate:** Immediately isolate affected systems
   ```bash
   kubectl scale deployment aurigraph-v11-blue --replicas=0 -n aurigraph-production
   ```
2. **Notify:** Contact Security Lead immediately
3. **Preserve:** Capture forensic data
   ```bash
   kubectl logs deployment/aurigraph-v11-blue -n aurigraph-production > forensic-logs.txt
   kubectl get events -n aurigraph-production > forensic-events.txt
   ```
4. **Investigate:** Security team begins investigation
5. **Remediate:** Apply security patches/fixes
6. **Verify:** Confirm threat is eliminated
7. **Restore:** Bring systems back online
8. **Post-Mortem:** Document and improve security

### Certificate Rotation
```bash
# 1. Generate new certificates
openssl req -new -x509 -days 365 -key aurigraph.key -out aurigraph.crt

# 2. Update Kubernetes secret
kubectl create secret tls aurigraph-tls \
  --cert=aurigraph.crt --key=aurigraph.key \
  --dry-run=client -o yaml | kubectl apply -f -

# 3. Restart pods
kubectl rollout restart deployment/aurigraph-v11-blue -n aurigraph-production
```

### Vulnerability Patching
```bash
# 1. Check for vulnerabilities
./mvnw dependency-check:check

# 2. Update dependencies
./mvnw versions:use-latest-versions

# 3. Test
./mvnw clean verify

# 4. Deploy via blue-green
./blue-green-deploy.sh v11.x.x
```

---

## Appendix

### Useful Commands Cheat Sheet
```bash
# Quick status check
kubectl get all -n aurigraph-production

# Describe pod for detailed info
kubectl describe pod <pod-name> -n aurigraph-production

# Execute command in pod
kubectl exec -it <pod-name> -n aurigraph-production -- /bin/bash

# Port forward for local testing
kubectl port-forward service/aurigraph-v11 9003:9003 -n aurigraph-production

# Watch pod status
watch kubectl get pods -n aurigraph-production

# Get pod metrics
kubectl top pod <pod-name> -n aurigraph-production

# View events
kubectl get events -n aurigraph-production --sort-by='.lastTimestamp'
```

### Links & Resources
- **Documentation:** https://docs.aurigraph.io
- **API Reference:** https://api.aurigraph.io/swagger-ui
- **Source Code:** https://github.com/Aurigraph-DLT-Corp/Aurigraph-DLT
- **JIRA Board:** https://aurigraphdlt.atlassian.net/jira/software/projects/AV11
- **Confluence:** https://aurigraphdlt.atlassian.net/wiki
- **Slack:** https://aurigraph.slack.com

---

**Document Version:** 1.0
**Last Reviewed:** October 12, 2025
**Next Review:** November 12, 2025
**Owner:** DevOps Team
**Approval:** VP Engineering
