# Sprint 15 Phase 1: JVM Optimization - Quick Reference

**Status**: ✅ DEPLOYED
**Date**: November 4, 2025
**Target**: +18% TPS (+540K TPS improvement)

---

## 🚀 Quick Start

### Deploy Optimizations (3 steps)
```bash
# 1. Build
./mvnw clean package -DskipTests

# 2. Start with optimizations
./start-optimized-jvm.sh

# 3. Validate deployment
./validate-phase1-optimization.sh
```

---

## 📊 Performance Targets

| Metric | Before | After | Improvement |
|--------|--------|-------|-------------|
| TPS | 3.0M | 3.54M | +18% |
| GC Pause | 50ms | 20ms | -60% |
| Memory | 2.5GB | 2.0GB | -20% |
| Threads | 2,137 | 32 | -98% |

---

## 🔍 Monitoring Commands

### Check TPS
```bash
curl -s http://localhost:9003/api/v11/performance | jq .tps
# Expected: ~3,540,000
```

### Watch GC Logs
```bash
tail -f logs/gc.log | grep Pause
# Expected: Pause ~20ms average
```

### Monitor JMX
```bash
jconsole localhost:9099
# Check: Memory tab (Heap: 1.6-1.8GB used)
# Check: Threads tab (~32 carrier threads)
```

### Verify JVM Flags
```bash
jps -v | grep quarkus-run
# Should contain:
#   -XX:+UseG1GC
#   -XX:MaxGCPauseMillis=100
#   -Xms2G -Xmx2G
#   -Djdk.virtualThreadScheduler.parallelism=32
```

---

## ✅ Validation Checklist

Run validation script:
```bash
./validate-phase1-optimization.sh
```

Expected output:
- ✅ G1GC enabled
- ✅ Heap: 2GB
- ✅ Virtual threads: 32
- ✅ JIT: Tiered compilation Level 4
- ✅ Compressed OOPs enabled
- ✅ JMX port 9099 open
- ✅ GC log created

---

## 🔄 Rollback Procedure

If issues occur:
```bash
# 1. Stop application
jps | grep quarkus-run | awk '{print $1}' | xargs kill -15

# 2. Revert changes
git checkout HEAD~1 -- src/main/resources/application.properties
rm -f start-optimized-jvm.sh

# 3. Rebuild and restart
./mvnw clean package -DskipTests
java -jar target/quarkus-app/quarkus-run.jar
```

Rollback time: ~10 minutes

---

## 📈 Success Criteria

**7-Day Validation** (Nov 4-10):
- [ ] Day 1: Stable startup, 3.0M+ TPS
- [ ] Day 2: 3.3M+ TPS achieved
- [ ] Day 3: 3.5M+ TPS sustained
- [ ] Day 4-5: Load testing passes
- [ ] Day 6-7: Production validation
- [ ] Day 7: **SIGN-OFF** (≥3.5M TPS sustained)

**Phase 1 Complete**: November 10, 2025
**Phase 2 Start**: November 11, 2025

---

## 🛠️ Configuration Summary

**G1GC**:
- MaxGCPauseMillis: 100ms
- ParallelRefProcEnabled: true
- G1HeapRegionSize: 16M

**Heap**:
- Initial: 2GB
- Maximum: 2GB
- MaxRAM: 2GB

**Virtual Threads**:
- Parallelism: 32
- MaxPoolSize: 32
- MinRunnable: 8

**JIT**:
- TieredCompilation: enabled
- StopAtLevel: 4 (C2)
- CompileThreshold: 1000

---

## 📞 Support

**Issues**: Check logs in `logs/` directory
**Performance**: Run `./performance-benchmark.sh`
**Documentation**: See `SPRINT-15-PHASE-1-DEPLOYMENT-REPORT.md`

---

**Last Updated**: November 4, 2025
**Next Review**: November 10, 2025 (Phase 1 sign-off)
