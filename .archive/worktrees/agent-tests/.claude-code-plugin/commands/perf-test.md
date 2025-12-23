# /perf-test

Run comprehensive performance benchmarks to measure TPS, latency, and resource usage.

## Usage

```bash
/perf-test [target-tps] [options]
```

## Parameters

- `target-tps` (optional): Target transactions per second (default: 2000000)
- `--duration <seconds>`: Test duration in seconds (default: 60)
- `--warmup <seconds>`: Warmup period before measuring (default: 10)
- `--threads <count>`: Number of parallel threads (default: 256)
- `--profile <name>`: Performance profile (`standard`, `native`, `optimized`)
- `--report`: Generate detailed performance report

## Examples

```bash
# Test with 2M TPS target
/perf-test 2000000

# Test with custom duration and threads
/perf-test 1500000 --duration 120 --threads 512

# Generate detailed report
/perf-test 2000000 --duration 60 --report
```

## Implementation

### 1. Build Optimized Binary

```bash
# Compile with performance optimizations
./mvnw clean package -DskipTests

# Or build native image for best performance
if [ "$PROFILE" == "native" ]; then
  ./mvnw package -Pnative-fast
fi
```

### 2. Configure JVM for Performance

```bash
# G1GC with optimized settings for 2M+ TPS
JVM_OPTS="-Xms16g -Xmx32g"
JVM_OPTS="$JVM_OPTS -XX:+UseG1GC"
JVM_OPTS="$JVM_OPTS -XX:MaxGCPauseMillis=20"
JVM_OPTS="$JVM_OPTS -XX:G1ReservePercent=15"
JVM_OPTS="$JVM_OPTS -XX:InitiatingHeapOccupancyPercent=30"
JVM_OPTS="$JVM_OPTS -XX:+UseCompressedOops"
JVM_OPTS="$JVM_OPTS -XX:+AlwaysPreTouch"
JVM_OPTS="$JVM_OPTS -XX:ParallelGCThreads=16"
JVM_OPTS="$JVM_OPTS -XX:ConcGCThreads=4"
JVM_OPTS="$JVM_OPTS -Xlog:gc*:file=logs/gc-perf.log"
```

### 3. Start Service with Monitoring

```bash
# Start service
java $JVM_OPTS -jar target/aurigraph-v11-standalone-*.jar &
SERVICE_PID=$!

# Wait for startup
sleep 10

# Verify service is ready
curl -f http://localhost:9003/q/health || exit 1
```

### 4. Run Warmup Phase

```javascript
async function warmup(duration) {
  console.log(`🔥 Warming up for ${duration} seconds...`);

  const warmupStart = Date.now();
  let warmupCount = 0;

  while ((Date.now() - warmupStart) / 1000 < duration) {
    await sendTransactionBatch(1000);
    warmupCount += 1000;
  }

  console.log(`✅ Warmup complete: ${warmupCount} transactions processed`);
}
```

### 5. Execute Performance Test

```javascript
async function runPerformanceTest(targetTPS, duration, threads) {
  console.log(`\n🚀 Starting performance test`);
  console.log(`   Target TPS: ${targetTPS.toLocaleString()}`);
  console.log(`   Duration: ${duration}s`);
  console.log(`   Threads: ${threads}\n`);

  const stats = {
    transactions: 0,
    successful: 0,
    failed: 0,
    latencies: [],
    startTime: Date.now(),
    endTime: null
  };

  // Create worker threads
  const workers = [];
  const txPerThread = Math.floor(targetTPS / threads);

  for (let i = 0; i < threads; i++) {
    workers.push(runWorkerThread(i, txPerThread, duration, stats));
  }

  // Monitor progress
  const monitor = setInterval(() => {
    const elapsed = (Date.now() - stats.startTime) / 1000;
    const currentTPS = Math.floor(stats.transactions / elapsed);
    const progress = (elapsed / duration * 100).toFixed(1);

    process.stdout.write(`\r📊 Progress: ${progress}% | TPS: ${currentTPS.toLocaleString()} | Tx: ${stats.transactions.toLocaleString()}`);
  }, 1000);

  // Wait for all workers to complete
  await Promise.all(workers);
  clearInterval(monitor);

  stats.endTime = Date.now();

  return calculateResults(stats);
}

async function runWorkerThread(id, txPerSecond, duration, stats) {
  const interval = 1000 / txPerSecond; // ms between transactions
  const endTime = Date.now() + (duration * 1000);

  while (Date.now() < endTime) {
    const start = Date.now();

    try {
      await sendTransaction();
      stats.transactions++;
      stats.successful++;
      stats.latencies.push(Date.now() - start);
    } catch (error) {
      stats.failed++;
    }

    // Throttle to maintain target rate
    const elapsed = Date.now() - start;
    if (elapsed < interval) {
      await sleep(interval - elapsed);
    }
  }
}
```

### 6. Collect System Metrics

```bash
# CPU usage
CPU_USAGE=$(top -bn1 | grep "Cpu(s)" | awk '{print $2}' | cut -d'%' -f1)

# Memory usage
MEMORY_USED=$(free -m | awk '/Mem:/ {print $3}')
MEMORY_TOTAL=$(free -m | awk '/Mem:/ {print $2}')
MEMORY_PERCENT=$(echo "scale=2; $MEMORY_USED / $MEMORY_TOTAL * 100" | bc)

# GC stats from logs
GC_COUNT=$(grep "GC" logs/gc-perf.log | wc -l)
GC_AVG_PAUSE=$(grep "Pause" logs/gc-perf.log | awk '{sum+=$NF; count++} END {print sum/count}')

# Network I/O
NETWORK_RX=$(cat /sys/class/net/eth0/statistics/rx_bytes)
NETWORK_TX=$(cat /sys/class/net/eth0/statistics/tx_bytes)
```

### 7. Calculate Performance Metrics

```javascript
function calculateResults(stats) {
  const duration = (stats.endTime - stats.startTime) / 1000;
  const actualTPS = Math.floor(stats.transactions / duration);

  // Calculate latency percentiles
  const sortedLatencies = stats.latencies.sort((a, b) => a - b);
  const p50 = sortedLatencies[Math.floor(sortedLatencies.length * 0.50)];
  const p95 = sortedLatencies[Math.floor(sortedLatencies.length * 0.95)];
  const p99 = sortedLatencies[Math.floor(sortedLatencies.length * 0.99)];
  const avg = stats.latencies.reduce((a, b) => a + b, 0) / stats.latencies.length;

  return {
    performance: {
      targetTPS,
      actualTPS,
      achievement: ((actualTPS / targetTPS) * 100).toFixed(1) + '%',
      duration
    },
    transactions: {
      total: stats.transactions,
      successful: stats.successful,
      failed: stats.failed,
      successRate: ((stats.successful / stats.transactions) * 100).toFixed(2) + '%'
    },
    latency: {
      avg: avg.toFixed(2) + 'ms',
      p50: p50 + 'ms',
      p95: p95 + 'ms',
      p99: p99 + 'ms'
    },
    system: {
      cpu: CPU_USAGE + '%',
      memory: MEMORY_PERCENT + '%',
      gcCount: GC_COUNT,
      gcAvgPause: GC_AVG_PAUSE + 'ms'
    }
  };
}
```

### 8. Generate Performance Report

```markdown
# Performance Test Report
Date: 2025-10-16 23:20:00
Profile: Optimized G1GC

## 🎯 Target vs Actual

| Metric | Target | Actual | Achievement |
|--------|--------|--------|-------------|
| TPS | 2,000,000 | 1,970,000 | 98.5% ✅ |
| Success Rate | 100% | 99.97% | ✅ |
| Avg Latency | <10ms | 8.3ms | ✅ |
| P99 Latency | <50ms | 42ms | ✅ |

## 📊 Transaction Statistics

- **Total Transactions**: 118,200,000
- **Successful**: 118,164,600 (99.97%)
- **Failed**: 35,400 (0.03%)
- **Duration**: 60.00 seconds
- **Throughput**: 1,970,000 TPS

## ⚡ Latency Distribution

```
Avg:  8.3ms
P50:  7.1ms  ████████████████████████████░░░░░░░░░░░░
P95:  18.5ms ██████████████████████████████████████░░
P99:  42.1ms ████████████████████████████████████████
Max:  127.8ms
```

## 💻 System Resources

### CPU
- Average Usage: 87.3%
- Peak Usage: 94.2%
- Cores Used: 16/16

### Memory
- Initial: 16 GB
- Peak: 28.4 GB (88.75%)
- GC Overhead: 1.2%

### Garbage Collection
- GC Count: 47
- Avg Pause: 18.2ms
- Max Pause: 23.8ms
- Total GC Time: 855ms (1.4% of runtime)

### Network
- RX: 4.2 GB
- TX: 3.8 GB
- Bandwidth: 140 MB/s avg

## 📈 Comparison with Previous Tests

| Date | TPS | Achievement | Notes |
|------|-----|-------------|-------|
| Oct 16 | 1,970,000 | 98.5% | Current test |
| Oct 15 | 1,850,000 | 92.5% | Before G1GC tuning |
| Oct 14 | 776,000 | 38.8% | Before optimizations |

**Improvement**: +154% since Oct 14

## ✅ Success Criteria

- ✅ Achieved 98.5% of 2M TPS target
- ✅ Success rate > 99.9%
- ✅ P99 latency < 50ms
- ✅ GC pause < 50ms
- ✅ Memory usage < 90%
- ✅ Zero crashes or OOM errors

## 🔍 Bottlenecks Identified

1. **CPU**: Near 100% utilization (expected at this load)
2. **GC**: Occasional pauses affecting P99 latency
3. **Network**: Within limits but approaching saturation

## 💡 Recommendations

1. **To reach 2M+ TPS**:
   - Consider native compilation (-Pnative)
   - Optimize transaction batching
   - Review consensus algorithm efficiency

2. **To improve P99 latency**:
   - Reduce GC pause time target to 15ms
   - Increase G1 heap region size
   - Consider ZGC for ultra-low latency

3. **For production**:
   - Monitor GC logs continuously
   - Set up alerting for TPS < 1.5M
   - Implement auto-scaling based on load

## 📋 Next Steps

- [ ] Run native compilation benchmark
- [ ] Test with larger heap (48GB)
- [ ] Profile hot code paths
- [ ] Implement suggested optimizations
- [ ] Re-test to validate 2M+ TPS

---
Generated by: Claude Code Performance Testing Plugin
