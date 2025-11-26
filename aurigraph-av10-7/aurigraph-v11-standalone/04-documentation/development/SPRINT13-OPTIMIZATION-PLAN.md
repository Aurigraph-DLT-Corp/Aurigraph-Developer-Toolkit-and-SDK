# Sprint 13 - Performance Optimization Plan
## Quick Reference Guide for 2M+ TPS Target

**Current Performance:** 776K TPS
**Target Performance:** 2M+ TPS
**Gap:** +158% improvement needed

---

## Top 3 Bottlenecks (from JFR Analysis)

### 1. Virtual Thread Overhead - 56% CPU Waste
**Impact:** Losing 45% potential throughput
**Fix:** Replace with 256 platform threads
**Expected Gain:** +350K TPS (776K → 1.13M)

### 2. Excessive Allocations - 9.4 MB/s
**Impact:** GC pauses losing 20% throughput
**Fix:** Object pooling + remove ScheduledThreadPoolExecutor
**Expected Gain:** +280K TPS (1.13M → 1.41M)

### 3. Thread Contention - 89 min cumulative wait
**Impact:** Serializing parallel queries
**Fix:** Cache Hibernate query plans + 200 DB connections
**Expected Gain:** +400K TPS (1.41M → 1.81M)

---

## Sprint 13 Weekly Plan

### Week 1: Platform Thread Migration (Priority 1)
**Goal:** 1.1M TPS | **Confidence:** High

**Tasks:**
```java
// Replace this in TransactionService.java
ExecutorService executor = Executors.newVirtualThreadPerTaskExecutor();

// With this:
ExecutorService executor = new ThreadPoolExecutor(
    256, 256,  // core and max threads
    0L, TimeUnit.MILLISECONDS,
    new ArrayBlockingQueue<>(10000),
    new ThreadPoolExecutor.CallerRunsPolicy()
);
```

**Validation:**
- [ ] JFR: Virtual thread samples drop from 56% → <5%
- [ ] TPS: 776K → 1.0M+ (30% gain)
- [ ] Latency: p99 remains <10ms

---

### Week 2: Lock-Free Ring Buffer (Priority 1)
**Goal:** 1.4M TPS | **Confidence:** Medium

**Tasks:**
```xml
<!-- Add to pom.xml -->
<dependency>
    <groupId>com.lmax</groupId>
    <artifactId>disruptor</artifactId>
    <version>4.0.0</version>
</dependency>
```

```java
// Replace ArrayBlockingQueue with Disruptor
Disruptor<TransactionEvent> disruptor = new Disruptor<>(
    TransactionEvent::new,
    1024 * 1024,  // ring buffer size
    DaemonThreadFactory.INSTANCE,
    ProducerType.MULTI,
    new BusySpinWaitStrategy()
);

disruptor.handleEventsWith((event, sequence, endOfBatch) -> {
    processTransaction(event.txId, event.amount);
});

disruptor.start();
```

**Validation:**
- [ ] JFR: Zero samples in ArrayBlockingQueue.poll()
- [ ] TPS: 1.1M → 1.4M+ (27% gain)
- [ ] Latency: p99 <8ms

---

### Week 3: Allocation Reduction (Priority 2)
**Goal:** 1.6M TPS | **Confidence:** High

**Tasks:**

#### 3.1 Remove ScheduledThreadPoolExecutor (Saves 5.6 GB/30min)
```java
// DELETE this code from TransactionService.java:855
scheduler.schedule(() -> {
    processTransaction(txId, amount);
}, 0, TimeUnit.MILLISECONDS);

// REPLACE with direct submission
executorService.submit(() -> processTransaction(txId, amount));
```

#### 3.2 Transaction Object Pool (Saves 970 MB/30min)
```java
public class TransactionPool {
    private static final ConcurrentLinkedQueue<Transaction> pool =
        new ConcurrentLinkedQueue<>();

    static {
        for (int i = 0; i < 10_000; i++) {
            pool.offer(new Transaction());
        }
    }

    public static Transaction acquire() {
        Transaction tx = pool.poll();
        return tx != null ? tx : new Transaction();
    }

    public static void release(Transaction tx) {
        tx.reset();
        pool.offer(tx);
    }
}

// Usage pattern
Transaction tx = TransactionPool.acquire();
try {
    processTransaction(tx);
} finally {
    TransactionPool.release(tx);
}
```

**Validation:**
- [ ] JFR: Allocation rate drops from 9.4 MB/s → <4 MB/s
- [ ] GC: Total pause time drops from 7.2s → <3.6s
- [ ] TPS: 1.4M → 1.6M+ (14% gain)

---

### Week 4: Database Optimization (Priority 2)
**Goal:** 2.0M+ TPS | **Confidence:** Medium

**Tasks:**

#### 4.1 Cache Hibernate Query Plans
```properties
# application.properties
quarkus.hibernate-orm.query.query-plan-cache-max-size=2048
quarkus.hibernate-orm.query.default-null-ordering=none
```

#### 4.2 Scale Database Connection Pool
```properties
# application.properties
quarkus.datasource.jdbc.min-size=50
quarkus.datasource.jdbc.max-size=200
quarkus.datasource.jdbc.acquisition-timeout=3
```

**PostgreSQL Configuration:**
```sql
-- Verify max_connections
SHOW max_connections;  -- Should be ≥250

-- If needed, increase:
ALTER SYSTEM SET max_connections = 300;
SELECT pg_reload_conf();
```

**Validation:**
- [ ] JFR: Zero JavaMonitorEnter events in HqlParseTreeBuilder
- [ ] JFR: Multiple agroal-* threads active (was 1, should be 50+)
- [ ] TPS: 1.6M → 2.0M+ (25% gain)
- [ ] Latency: p99 <10ms, p999 <50ms

---

## Performance Validation Checklist

### After Each Week:
```bash
# 1. Run performance benchmark
cd /Users/subbujois/subbuworkingdir/Aurigraph-DLT/aurigraph-av10-7/aurigraph-v11-standalone
./mvnw quarkus:dev

# 2. In another terminal, run load test
curl -X POST http://localhost:9003/api/v11/performance \
  -H "Content-Type: application/json" \
  -d '{"transactions": 100}' &

# Let run for 30 minutes

# 3. Capture JFR profile
jcmd <PID> JFR.start name=sprint13-week1 duration=30m filename=sprint13-week1-profile.jfr

# 4. Wait for completion, then analyze
jfr summary sprint13-week1-profile.jfr
jfr print --events jdk.ExecutionSample sprint13-week1-profile.jfr | grep "TransactionService"
```

### Success Criteria by Week:

| Week | TPS Target | Virtual Thread % | GC Pause (30min) | Contention Events |
|------|------------|------------------|------------------|-------------------|
| **Baseline** | 776K | 56.35% | 7.2s | 12 |
| **Week 1** | 1.0M+ | <5% | 7.2s | 12 |
| **Week 2** | 1.4M+ | <5% | 7.2s | 12 |
| **Week 3** | 1.6M+ | <5% | <3.6s | 12 |
| **Week 4** | 2.0M+ | <5% | <3.6s | 0 |

---

## Quick JFR Analysis Commands

```bash
# Summary
jfr summary <file>.jfr

# CPU hotspots (top methods)
jfr print --events jdk.ExecutionSample <file>.jfr | \
  grep -E "^\s+(io\.|java\.)" | sort | uniq -c | sort -rn | head -20

# GC analysis
jfr print --events jdk.GarbageCollection <file>.jfr | \
  grep -E "(duration|name|cause)"

# Allocations
jfr print --events jdk.ObjectAllocationSample <file>.jfr | \
  grep -E "(objectClass|weight)" | head -50

# Thread contention
jfr print --events jdk.JavaMonitorEnter,jdk.JavaMonitorWait <file>.jfr | \
  grep -E "(duration|monitorClass)" | head -30
```

---

## Risk Mitigation

### Risk: Platform Thread Pool Exhaustion
**Symptom:** TPS drops, threads blocked
**Fix:** Increase to 512 threads
```java
new ThreadPoolExecutor(512, 512, ...)
```

### Risk: Disruptor Ring Buffer Full
**Symptom:** ProducerBarrier.next() blocking
**Fix:** Increase ring buffer size
```java
new Disruptor<>(..., 1024 * 1024 * 2, ...)  // 2M instead of 1M
```

### Risk: Database Connection Pool Exhausted
**Symptom:** "Timeout acquiring connection" errors
**Fix:** Incremental scale-up
```properties
# Try 50 → 100 → 150 → 200 gradually
quarkus.datasource.jdbc.max-size=100
```

### Risk: Object Pool Memory Leak
**Symptom:** Pool size shrinking, OOM errors
**Fix:** Add pool monitoring
```java
@Scheduled(every = "10s")
public void monitorPool() {
    int size = TransactionPool.size();
    if (size < 5000) {
        log.warn("Pool leaking! Size: {}", size);
    }
}
```

---

## Rollback Plan

Each optimization is independent. If a week fails validation:

1. **Revert the change:**
   ```bash
   git revert <commit-hash>
   ./mvnw clean package
   ```

2. **Run baseline test** to confirm rollback successful

3. **Analyze failure:**
   - Compare JFR profiles (failed vs baseline)
   - Check error logs
   - Review thread dumps

4. **Adjust approach:**
   - Reduce scale (e.g., 128 threads instead of 256)
   - Add monitoring
   - Retry with modified parameters

---

## Key Metrics Dashboard (Week 4 Target)

| Metric | Sprint 12 | Sprint 13 Target | Formula |
|--------|-----------|------------------|---------|
| **TPS** | 776K | 2.0M+ | Throughput |
| **p99 Latency** | 15ms | <10ms | 99th percentile |
| **p999 Latency** | 80ms | <50ms | 99.9th percentile |
| **GC Pause (30min)** | 7.2s | <3.6s | Sum of pause durations |
| **Max GC Pause** | 262ms | <50ms | Longest single pause |
| **Allocation Rate** | 9.4 MB/s | <4 MB/s | Total allocated / time |
| **Virtual Thread CPU** | 56.35% | <5% | Samples in ForkJoinPool |
| **App CPU** | 43.65% | >80% | Samples in io.aurigraph |
| **Thread Contention** | 12 events | 0 events | JavaMonitorEnter count |
| **Error Rate** | 0% | <0.01% | Failed requests / total |

---

## Success Criteria (Final Acceptance)

### PASS Requirements (ALL must be met):
- [x] TPS ≥ 2,000,000 sustained for 30 minutes
- [x] p99 latency < 10ms
- [x] p999 latency < 50ms
- [x] Error rate < 0.01%
- [x] Max GC pause < 50ms
- [x] Total GC pause < 18s (1% of 30min)
- [x] Zero thread contention events >10ms
- [x] Zero OOM errors
- [x] CPU application efficiency > 80%
- [x] Memory allocation rate < 4 MB/s

### Automated Test:
```bash
#!/bin/bash
# Run this at end of Sprint 13

echo "Running Sprint 13 Acceptance Test..."

# Start application with JFR
./mvnw quarkus:dev &
APP_PID=$!

jcmd $APP_PID JFR.start name=acceptance duration=30m \
  filename=sprint13-acceptance-profile.jfr

# Wait for startup
sleep 30

# Run load test (2M TPS target)
./run-performance-tests.sh --duration 1800 --target-tps 2000000

# Wait for JFR completion
sleep 1800

# Analyze results
python3 analyze-jfr.py sprint13-acceptance-profile.jfr

# Generate report
./generate-sprint-report.sh sprint13-acceptance-profile.jfr

echo "Acceptance test complete. Check SPRINT13-ACCEPTANCE-REPORT.md"
```

---

## Quick Reference Card

**Copy this to your terminal for easy access:**

```bash
# Sprint 13 Quick Commands
alias s13-start="cd /Users/subbujois/subbuworkingdir/Aurigraph-DLT/aurigraph-av10-7/aurigraph-v11-standalone && ./mvnw quarkus:dev"
alias s13-test="curl -X POST http://localhost:9003/api/v11/performance -H 'Content-Type: application/json' -d '{\"transactions\": 100}'"
alias s13-jfr="jcmd \$(jps | grep aurigraph | cut -d' ' -f1) JFR.start duration=30m filename=sprint13-profile.jfr"
alias s13-analyze="jfr summary sprint13-profile.jfr"

# Usage:
# s13-start    # Start dev server
# s13-test     # Run perf test
# s13-jfr      # Start profiling
# s13-analyze  # View results
```

---

**Document Version:** 1.0
**Created:** October 24, 2025
**Sprint:** Sprint 13
**Owner:** Backend Development Team
**Reviewer:** Chief Architect
