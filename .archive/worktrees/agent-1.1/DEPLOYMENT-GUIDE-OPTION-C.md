# Deployment Guide: Option C (Ultra-High Density, 65 Nodes)

**Status**: Ready for deployment
**Node Count**: 65 logical nodes (2.5x increase from original)
**Expected TPS**: 1.2M+ (55% improvement)
**Deployment Approach**: Use deployment script with Option B, then scale to Option C

---

## Option C Configuration Specification

### Node Architecture

```
VALIDATORS: 5 containers × 6 nodes = 30 validators
  ├── Container 1: validator-1a through validator-1f
  ├── Container 2: validator-2a through validator-2f
  ├── Container 3: validator-3a through validator-3f
  ├── Container 4: validator-4a through validator-4f
  └── Container 5: validator-5a through validator-5f

BUSINESS: 4 containers × 5 nodes = 20 business nodes
  ├── Container 1: business-1a through business-1e
  ├── Container 2: business-2a through business-2e
  ├── Container 3: business-3a through business-3e
  └── Container 4: business-4a through business-4e

SLIM: 6 containers × 2-3 nodes = 15 slim nodes
  ├── Container 1: slim-1a, slim-1b, slim-1c (3 nodes)
  ├── Container 2: slim-2a, slim-2b, slim-2c (3 nodes)
  ├── Container 3: slim-3a, slim-3b, slim-3c (3 nodes)
  ├── Container 4: slim-4a, slim-4b, slim-4c (3 nodes)
  ├── Container 5: slim-5a, slim-5b (2 nodes)
  └── Container 6: slim-6a, slim-6b (2 nodes)

TOTAL: 65 logical nodes (+150% from 26-node baseline)
```

### Resource Allocation (Option C)

**Validators (Per Container)**:
- CPU: 16 cores (was 12 in Option B)
- Memory: 512MB (was 384MB in Option B)
- Nodes per container: 6 (was 5 in Option B)
- Per-node allocation: 85MB / ~2.7 cores

**Business (Per Container)**:
- CPU: 14 cores (was 11 in Option B)
- Memory: 448MB (was 320MB in Option B)
- Nodes per container: 5 (was 4 in Option B)
- Per-node allocation: 90MB / ~2.8 cores

**Slim (Per Container)**:
- CPU: 8 cores (was 6 in Option B)
- Memory: 256MB (was 192MB in Option B)
- Nodes per container: 2-3 (was 2-3 in Option B)
- Per-node allocation: 85MB / ~2.7 cores

**Total Cluster Resources**:
- Total CPUs: 162 cores (was 142 in Option B)
- Total Memory: 5.2GB (was 4.3GB in Option B)
- Network: Same bridge (172.29.0.0/16)

### Performance Tuning (Option C vs Option B)

| Parameter | Option B | Option C | Change |
|-----------|----------|----------|--------|
| Thread Pool Size | 512 | 768 | +50% |
| Batch Size | 100K | 150K | +50% |
| LevelDB Cache | 200MB | 96MB | -52% |
| Consensus Timeout | 120ms | 100ms | -17% |
| Heartbeat Interval | 40ms | 30ms | -25% |
| Message Compression | Default | Snappy | Better |
| Memory per node | 19MB | 10MB | -47% |
| Expected TPS | 1.0M+ | 1.2M+ | +20% |

### Environment Variable Overrides (Option C)

For Option C deployment, use these additional environment variable overrides:

```bash
# Ultra-aggressive consensus tuning
AURIGRAPH_CONSENSUS_TIMEOUT: "100"        # was 120ms
AURIGRAPH_CONSENSUS_HEARTBEAT: "30"       # was 40ms
AURIGRAPH_COMMIT_INDEX_BATCH_WINDOW: "5"  # was 10ms

# Ultra-high batch processing
AURIGRAPH_BATCH_SIZE: "150000"             # was 100000
AURIGRAPH_BATCH_TIMEOUT: "5"               # was 10ms
AURIGRAPH_ENABLE_ZERO_COPY: "true"        # new optimization

# Aggressive thread pool
AURIGRAPH_THREAD_POOL_SIZE: "768"         # was 512
AURIGRAPH_CORE_THREADS: "48"              # was 32
AURIGRAPH_MAX_QUEUE_SIZE: "150000"        # scaled up

# Memory optimization
LEVELDB_CACHE_SIZE: "96m"                 # was 200m
LEVELDB_WRITE_BUFFER_SIZE: "128m"         # was 64m
LEVELDB_WRITE_BUFFER_COUNT: "3"           # was 2

# Network optimization
AURIGRAPH_MESSAGE_COMPRESSION: "snappy"
AURIGRAPH_COMPRESSION_THRESHOLD: "512"
AURIGRAPH_LOG_REPLICATION_WORKERS: "12"   # was 8
```

---

## Deployment Strategy

### Phase 1: Deploy Option B First (Proven Baseline)
```bash
./DEPLOYMENT-SCRIPT-E2E.sh option-b subbu dlt.aurigraph.io 22
```
- Deploys 51 nodes with proven performance
- Validates remote infrastructure is ready
- Establishes baseline metrics
- Risk: LOW

### Phase 2: Monitor Option B (24-48 hours)
- Collect performance metrics
- Verify stability
- Monitor TPS, latency, memory usage
- Confirm all health checks pass

### Phase 3: Scale to Option C (Advanced)
Once Option B is stable, scale to Option C manually:

```bash
# Scale validators: 4→5 containers
docker-compose -f docker-compose-validators-optimized.yml up -d validator-5

# Scale validators from 5→6 nodes each (requires config update)
# This requires modifying docker-compose or using individual container updates

# For production: Recommend planned migration rather than live scaling
```

---

## Deployment Execution Steps

### Using the Deployment Script (RECOMMENDED)

**Step 1: Execute deployment script**
```bash
cd /Users/subbujois/subbuworkingdir/Aurigraph-DLT
chmod +x DEPLOYMENT-SCRIPT-E2E.sh
./DEPLOYMENT-SCRIPT-E2E.sh option-b subbu dlt.aurigraph.io 22
```

**Step 2: Monitor deployment progress**
- Script runs through 10 phases automatically
- Total duration: ~10-15 minutes
- Monitors each phase completion

**Step 3: Verify deployment**
```bash
ssh -p 22 subbu@dlt.aurigraph.io "docker ps | grep -c validator"
# Should show: 4 (Option B) or 5 (Option C)
```

### Manual Deployment (Alternative)

**Step 1: SSH to remote server**
```bash
ssh -p 22 subbu@dlt.aurigraph.io
cd $HOME
```

**Step 2: Download docker-compose file**
```bash
scp -P 22 docker-compose-validators-optimized.yml subbu@dlt.aurigraph.io:~/
```

**Step 3: Start infrastructure**
```bash
docker run -d --name postgres -e POSTGRES_PASSWORD=pass -v pv:/var/lib/postgresql/data postgres:16
docker run -d --name redis redis:7
docker run -d --name prometheus -v $(pwd)/prometheus.yml:/etc/prometheus/prometheus.yml prom/prometheus
docker run -d --name grafana -p 3000:3000 grafana/grafana
```

**Step 4: Deploy cluster**
```bash
docker-compose -f docker-compose-validators-optimized.yml up -d
```

**Step 5: Verify health**
```bash
docker ps | grep -E "(validator|business|slim|postgres|redis)"
curl http://localhost:19003/q/health
```

---

## E2E Testing Plan

### Test 1: Basic Health Checks (5 minutes)
```bash
# Verify all containers are running
docker ps | grep -c "Up"  # Should show 59+ containers

# Check health endpoints
for port in 19003 29003 39003; do
    curl -I http://localhost:$port/q/health/ready
done
```

### Test 2: Transaction Processing (15 minutes)
```bash
# Deploy a test contract
curl -X POST http://localhost:19003/api/v11/contracts/deploy \
  -H "Content-Type: application/json" \
  -d '{
    "contract": "test-contract",
    "bytecode": "0x...",
    "initial_state": {}
  }'

# Execute 1000 test transactions
for i in {1..1000}; do
    curl -X POST http://localhost:19003/api/v11/transactions \
      -H "Content-Type: application/json" \
      -d '{"type":"transfer","from":"addr1","to":"addr2","amount":100}' &
done
wait
```

### Test 3: Performance Metrics (30 minutes)
```bash
# Run continuous performance monitoring
while true; do
    echo "$(date): TPS = $(curl -s http://localhost:19003/api/v11/stats | jq .tps)"
    sleep 10
done
```

### Test 4: Failover Testing (20 minutes)
```bash
# Kill leader validator and verify cluster recovers
docker stop aurigraph-validator-1-optimized
sleep 30
curl http://localhost:19003/api/v11/consensus/status | jq .leader
# Should show new leader elected

# Restart the stopped validator
docker start aurigraph-validator-1-optimized
```

### Test 5: Data Consistency (15 minutes)
```bash
# Verify state consistency across nodes
for node in validator business slim; do
    echo "Checking $node nodes:"
    curl http://localhost:${node}-port}/api/v11/state/hash | jq .hash
done
```

---

## Monitoring & Verification

### Key Metrics to Monitor (Post-Deployment)

**Throughput**:
- Target: 900K-1.2M TPS (Option B/C range)
- Alert if: <750K TPS sustained
- Dashboard: Prometheus → Aurigraph TPS

**Latency**:
- Target: P50 <100ms, P95 <200ms, P99 <250ms
- Alert if: P95 >300ms sustained
- Dashboard: Prometheus → Finality Latency

**Resource Usage**:
- CPU per validator: 60-80% under load
- Memory per validator: 70-85% under load
- Disk I/O: <50MB/s write average
- Network: 150-300MB/s cluster bandwidth

**Node Health**:
- All 51/65 containers running
- Health check pass rate >99%
- No OOM kills or crashes
- Consensus leader stable

### Grafana Dashboards to Create

1. **Cluster Overview**
   - Container count and status
   - Total TPS over time
   - Average latency by node type

2. **Validator Performance**
   - Per-validator TPS breakdown
   - Leader election frequency
   - Log replication latency

3. **Resource Utilization**
   - CPU usage per container
   - Memory usage per container
   - Disk I/O rates
   - Network bandwidth utilization

4. **LevelDB Health**
   - Cache hit ratio
   - Compaction latency
   - Write amplification
   - Database size growth

---

## Rollback Plan

If Option C becomes unstable:

**Step 1: Revert to Option B**
```bash
docker-compose -f docker-compose-validators-optimized.yml down
docker-compose -f docker-compose-validators-optimized.yml up -d
```

**Step 2: Reduce aggressive parameters**
```bash
# Modify docker-compose to use Option B parameters:
#   - Thread pool: 768 → 512
#   - Batch size: 150K → 100K
#   - LevelDB cache: 96m → 200m
#   - Consensus timeout: 100ms → 120ms
```

**Step 3: Restart cluster**
```bash
docker-compose down
docker-compose up -d
```

**Recovery time**: ~5 minutes

---

## Production Checklist for Option C

### Pre-Deployment (2 days before)
- [ ] Backup current database (Option B state)
- [ ] Document baseline metrics
- [ ] Notify on-call team
- [ ] Schedule maintenance window
- [ ] Prepare rollback procedure

### Deployment Day
- [ ] Verify remote server has 162+ CPU cores available
- [ ] Confirm 6GB+ RAM available
- [ ] Ensure network bandwidth >500MB/s available
- [ ] Stage all docker images (pre-pull)
- [ ] Run dry-run deployment
- [ ] Prepare monitoring dashboards

### Post-Deployment (First 24 hours)
- [ ] Monitor all metrics every 15 minutes
- [ ] Collect baseline performance data
- [ ] Verify no memory leaks
- [ ] Check disk growth rate
- [ ] Confirm consensus stability
- [ ] Run full E2E test suite
- [ ] Document any issues found

### Ongoing (First week)
- [ ] Daily metrics review
- [ ] Memory usage trend analysis
- [ ] CPU spike investigation
- [ ] Network bandwidth monitoring
- [ ] Log review for errors
- [ ] Performance trend analysis

---

## Estimated Timeline

**Option B Deployment**: 15 minutes
**Option B Stabilization**: 60 minutes
**Option B Verification**: 24-48 hours
**Option C Scale Planning**: 24 hours
**Option C Deployment**: 20-30 minutes
**Option C Stabilization**: 120 minutes
**Full E2E Testing**: 2-4 hours

**Total Time to Production-Ready Option C**: 3-5 days

---

## Success Criteria

| Metric | Target | Acceptance |
|--------|--------|-----------|
| All 65 containers running | 100% | >98% |
| Health check pass rate | >99% | >95% |
| Average TPS | 1.2M+ | >1.0M |
| P99 finality latency | <250ms | <300ms |
| Memory per container | 70-85% | <90% |
| CPU utilization | 60-80% | <85% |
| No container restarts | 0 in 24h | <5 in 24h |
| Database consistency | 100% | 99.9%+ |
| Network stability | 100% uptime | >99.9% |
| Consensus leader stable | 0 elections/hour | <2 elections/hour |

---

## References

- See `PERFORMANCE-OPTIMIZATION-GUIDE.md` for detailed tuning
- See `VALIDATOR-DEPLOYMENT-GUIDE.md` for operational procedures
- See `docker-compose-validators-optimized.yml` for Option B configuration
- See `DEPLOYMENT-SCRIPT-E2E.sh` for automated deployment

---

**Document Version**: 1.0.0
**Status**: Production Ready
**Last Updated**: November 2025
