# Quick Start: V11 Performance Testing Guide
**Date**: October 15, 2025
**Purpose**: Validate 2M+ TPS performance optimizations

---

## Prerequisites

```bash
# Navigate to V11 directory
cd /Users/subbujois/Documents/GitHub/Aurigraph-DLT/aurigraph-av10-7/aurigraph-v11-standalone

# Ensure Java 21+ is installed
java --version

# Compile optimized code
./mvnw clean compile -DskipTests
```

---

## Step 1: Start V11 in Dev Mode

```bash
# Start Quarkus in development mode
./mvnw quarkus:dev

# Wait for startup message:
# "Listening on: http://localhost:9003"
```

---

## Step 2: Run Quick Performance Tests

### Test 1: Basic Health Check
```bash
curl http://localhost:9003/api/v11/health | jq .
```

**Expected Output**:
```json
{
  "status": "HEALTHY",
  "version": "11.0.0-standalone",
  "uptimeSeconds": 45,
  "totalRequests": 1,
  "platform": "Java/Quarkus/GraalVM"
}
```

---

### Test 2: Transaction Statistics
```bash
curl http://localhost:9003/api/v11/stats | jq .
```

**Key Metrics to Check**:
- `totalProcessed`: Total transactions processed
- `currentThroughputMeasurement`: Current TPS
- `performanceGrade`: "EXCELLENT (2M+ TPS)" target
- `shardCount`: Should be 2048
- `maxVirtualThreads`: Should be 1000000

---

### Test 3: 500K Transaction Performance Test
```bash
curl -X POST http://localhost:9003/api/v11/performance/ultra-throughput \
  -H "Content-Type: application/json" \
  -d '{"iterations": 500000}' | jq .
```

**Expected Output**:
```json
{
  "iterations": 500000,
  "durationMs": 250.0,
  "transactionsPerSecond": 2000000,
  "performanceGrade": "OUTSTANDING (2M+ TPS)",
  "ultraHighTarget": true,
  "highTarget": true,
  "baseTarget": true,
  "optimizations": "Virtual Threads + Lock-Free + Cache-Optimized + Adaptive Batching"
}
```

**Success Criteria**:
- TPS >= 1,500,000 (good)
- TPS >= 2,000,000 (excellent)
- TPS >= 2,500,000 (exceptional)

---

### Test 4: Adaptive Batch Processing Test
```bash
curl -X POST http://localhost:9003/api/v11/performance/adaptive-batch \
  -H "Content-Type: application/json" \
  -d '{"requestCount": 1000000}' | jq .
```

**Expected Output**:
```json
{
  "requestCount": 1000000,
  "processedCount": 1000000,
  "transactionsPerSecond": 2100000,
  "performanceGrade": "EXCELLENT (2M+ TPS)",
  "optimalChunkSize": 25000,
  "batchMultiplier": 1.2,
  "ultraHighPerformanceAchieved": true
}
```

---

## Step 3: Benchmark Suite (Full Testing)

### Create benchmark script:
```bash
cat > test-performance.sh << 'EOF'
#!/bin/bash
# V11 Performance Benchmark Suite

echo "==================================="
echo "V11 Performance Benchmark Suite"
echo "==================================="
echo ""

BASE_URL="http://localhost:9003/api/v11"

# Test sizes
SIZES=(100000 250000 500000 750000 1000000)

echo "1. Health Check"
curl -s $BASE_URL/health | jq -r '"Status: " + .status + ", Uptime: " + (.uptimeSeconds | tostring) + "s"'
echo ""

echo "2. Initial Statistics"
curl -s $BASE_URL/stats | jq '{
  totalProcessed,
  currentThroughputMeasurement,
  performanceGrade: .getPerformanceGrade
}'
echo ""

echo "3. Progressive Load Testing"
for SIZE in "${SIZES[@]}"; do
  echo "Testing with $SIZE transactions..."

  RESULT=$(curl -s -X POST $BASE_URL/performance/adaptive-batch \
    -H "Content-Type: application/json" \
    -d "{\"requestCount\": $SIZE}")

  echo "$RESULT" | jq '{
    transactions: .requestCount,
    tps: (.transactionsPerSecond | floor),
    grade: .performanceGrade,
    duration_ms: (.durationMs | floor),
    target_achieved: .ultraHighPerformanceAchieved
  }'

  # Get TPS for summary
  TPS=$(echo "$RESULT" | jq -r '.transactionsPerSecond | floor')

  if [ "$TPS" -ge 2000000 ]; then
    echo "✅ EXCELLENT: $TPS TPS (Target achieved!)"
  elif [ "$TPS" -ge 1500000 ]; then
    echo "✓ GOOD: $TPS TPS (Close to target)"
  else
    echo "⚠ NEEDS TUNING: $TPS TPS"
  fi

  echo ""
  sleep 5
done

echo "4. Final Statistics"
curl -s $BASE_URL/stats | jq '{
  totalProcessed,
  currentThroughputMeasurement,
  performanceGrade: .getPerformanceGrade,
  throughputEfficiency: .getThroughputEfficiency
}'
echo ""

echo "==================================="
echo "Benchmark Complete"
echo "==================================="
EOF

chmod +x test-performance.sh
```

### Run benchmark:
```bash
./test-performance.sh
```

---

## Step 4: Interpreting Results

### Performance Grades

| TPS Range | Grade | Status |
|-----------|-------|--------|
| 3M+ | EXCELLENT (3M+ TPS) | Exceptional |
| 2M - 3M | OUTSTANDING (2M+ TPS) | Target achieved |
| 1M - 2M | VERY GOOD (1M+ TPS) | Good baseline |
| < 1M | NEEDS OPTIMIZATION | Requires tuning |

### Key Metrics to Monitor

1. **Throughput (TPS)**
   - Target: 2M+ TPS
   - Acceptable: 1.5M+ TPS
   - Needs Work: < 1.5M TPS

2. **Latency**
   - Excellent: < 50ms P99
   - Good: 50-100ms P99
   - Needs Work: > 100ms P99

3. **Memory Usage**
   - Optimal: < 1GB
   - Acceptable: 1-2GB
   - High: > 2GB

4. **CPU Utilization**
   - Target: 80-90%
   - Acceptable: 60-95%
   - Over-subscribed: > 95%

---

## Step 5: Optimization Configuration

### Current Optimized Settings

**Transaction Processing**:
- Shards: 2048 (16x increase from 128)
- Virtual Threads: 1M (10x increase from 100K)
- Batch Size: 100K (2x increase from 50K)
- Parallelism: 1024 threads (2x increase from 512)

**Network**:
- HTTP/2 Streams: 100K (2x increase from 50K)
- Window Size: 2MB (2x increase from 1MB)
- Worker Threads: 512

**Consensus**:
- Dev Batch: 50K (3.3x increase from 15K)
- Dev Threads: 512 (4x increase from 128)
- Target TPS: 2.5M (25% stretch goal)

---

## Step 6: Troubleshooting

### Issue: Low TPS (< 1M)

**Possible Causes**:
1. Insufficient CPU cores
2. Memory constraints
3. Thread pool exhaustion
4. Network bottlenecks

**Solutions**:
```bash
# Check CPU usage
top -pid $(pgrep -f quarkus)

# Check memory
jcmd $(pgrep -f quarkus) GC.heap_info

# Check threads
jcmd $(pgrep -f quarkus) Thread.print | grep "aurigraph" | wc -l
```

---

### Issue: High Memory Usage (> 2GB)

**Solutions**:
```bash
# Tune JVM heap
export MAVEN_OPTS="-Xmx2g -Xms2g -XX:+UseG1GC"

# Restart with tuned heap
./mvnw quarkus:dev
```

---

### Issue: Port Already in Use

```bash
# Kill existing process
lsof -ti :9003 | xargs kill -9

# Wait and restart
sleep 2
./mvnw quarkus:dev
```

---

## Step 7: Native Build Testing (Optional)

### Build native executable:
```bash
# Fast native build (development)
./mvnw package -Pnative-fast

# Run native
./target/*-runner
```

### Expected Performance:
- **Startup**: < 1 second
- **Memory**: < 256MB
- **TPS**: Same or better than JVM

---

## Summary Checklist

- [ ] V11 starts successfully on port 9003
- [ ] Health endpoint returns "HEALTHY"
- [ ] 500K transaction test achieves 1.5M+ TPS
- [ ] 1M transaction test achieves 2M+ TPS
- [ ] AI optimization service provides recommendations
- [ ] Memory usage stays below 2GB
- [ ] CPU utilization is 80-90%
- [ ] No errors in transaction processing
- [ ] Performance grade is "OUTSTANDING" or better

---

## Quick Commands Reference

```bash
# Start V11
./mvnw quarkus:dev

# Health check
curl http://localhost:9003/api/v11/health

# Quick 500K test
curl -X POST http://localhost:9003/api/v11/performance/ultra-throughput \
  -H "Content-Type: application/json" \
  -d '{"iterations": 500000}' | jq .

# Stats
curl http://localhost:9003/api/v11/stats | jq .

# Kill service
lsof -ti :9003 | xargs kill -9
```

---

## Next Steps

1. **If TPS >= 2M**: Congratulations! Document results and proceed to production testing
2. **If TPS 1.5-2M**: Minor tuning needed, adjust batch sizes incrementally
3. **If TPS < 1.5M**: Review system resources and configuration parameters

---

**For detailed analysis, see**:
- Full Report: `/Users/subbujois/Documents/GitHub/Aurigraph-DLT/aurigraph-av10-7/V11-PERFORMANCE-OPTIMIZATION-REPORT-OCT-15-2025.md`
- Configuration: `src/main/resources/application.properties`
- Code: `src/main/java/io/aurigraph/v11/TransactionService.java`
