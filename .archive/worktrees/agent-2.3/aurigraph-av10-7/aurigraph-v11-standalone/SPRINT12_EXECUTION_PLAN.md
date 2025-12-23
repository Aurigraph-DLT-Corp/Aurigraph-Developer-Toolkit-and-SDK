# Sprint 12 Execution Plan - Incremental Optimization & Native Compilation

**Date**: October 21, 2025
**Sprint**: Sprint 12 - Incremental Performance Improvements
**Baseline**: 1,143,802 TPS (Phase 1 from Sprint 11)
**Target**: 1.4M - 1.5M TPS (+23-31% improvement)

---

## Executive Summary

Sprint 12 focuses on achieving incremental performance improvements through three validated approaches identified in Sprint 11. Unlike Sprint 11's aggressive multi-variable optimization, this sprint follows a conservative, one-change-at-a-time methodology to ensure measurable, reproducible results.

### Sprint Goals

1. **Resolve Native Compilation Blocker** (+20-30% expected, ~1.4M TPS)
2. **Test Phase 3C Conservative Tuning** (+5-10% expected, ~1.2M TPS)
3. **Establish Real-World Profiling Framework** (foundation for Sprint 13+)

### Success Criteria

- ✅ Native binary builds successfully
- ✅ At least one optimization yields measurable improvement
- ✅ No performance regressions vs Phase 1 baseline
- ✅ Profiling framework operational for 30+ minute sessions
- ✅ Comprehensive documentation of all findings

---

## Priority 1: Native Compilation Resolution (Days 1-2)

### Objective
Resolve GraalVM native-image configuration blocker to unlock expected 20-30% TPS improvement.

### Current Blocker (from Sprint 11)
```
Error: Using '--verbose' provided by 'META-INF/native-image/native-image.properties'
in 'file:///.../aurigraph-v11-standalone-11.3.4-runner.jar' is only allowed on command line.

Exit Code: 20
Build Time: 24.591s (failed before native image generation)
```

### Investigation Tasks

**Task 1.1: Locate --verbose Configuration**
- [ ] Read `pom.xml` native profiles (`-Pnative`, `-Pnative-fast`, `-Pnative-ultra`)
- [ ] Search for `--verbose` flag in Maven configuration
- [ ] Check `src/main/resources/META-INF/native-image/` directory
- [ ] Review Quarkus native build properties

**Task 1.2: Identify Root Cause**
- [ ] Determine if `--verbose` is added by Quarkus plugin
- [ ] Check if it's in custom native-image.properties
- [ ] Verify if it's a build-time vs runtime configuration issue
- [ ] Document exact location and reason for --verbose flag

**Task 1.3: Fix Configuration**
Options:
- **Option A**: Remove `--verbose` from properties file, add to command line if needed
- **Option B**: Configure Quarkus to not generate verbose flag in properties
- **Option C**: Use alternative native profile without verbose

**Task 1.4: Validate Fix**
```bash
# Test build with fix
./mvnw clean package -Pnative -DskipTests

# Expected: BUILD SUCCESS in ~15 minutes
# Expected output: Native binary in target/*-runner
```

**Task 1.5: Performance Testing**
```bash
# Deploy native binary to remote server
scp target/*-runner subbu@dlt.aurigraph.io:/opt/aurigraph-v11/

# Test performance
ssh subbu@dlt.aurigraph.io "cd /opt/aurigraph-v11 && ./*-runner &"
curl http://dlt.aurigraph.io:9003/api/v11/performance

# Expected: 1.37M - 1.48M TPS (+20-30% from 1.14M baseline)
```

### Deliverables
- ✅ Native binary successfully built
- ✅ Performance test results (5 iterations minimum)
- ✅ Comparison vs Phase 1 baseline
- ✅ Updated `NATIVE_BUILD_BLOCKER.md` with resolution

---

## Priority 2: Phase 3C Conservative Tuning (Days 2-3)

### Objective
Test single conservative JVM flag change for incremental improvement.

### Configuration
**Change**: `-XX:G1HeapRegionSize=16M` (reduced from 32M default)
**Rationale**: Better match for typical transaction object sizes (from Sprint 11 analysis)

**Full Command**:
```bash
java -XX:+UseG1GC -XX:G1HeapRegionSize=16M -jar aurigraph-v11-standalone-11.3.4-PHASE3C-runner.jar
```

### Testing Plan

**Task 2.1: Remote Deployment**
- [ ] Verify Phase 3C JAR is uploaded (already done: `/opt/aurigraph-v11/aurigraph-v11-standalone-11.3.4-PHASE3C-runner.jar`)
- [ ] SSH to remote server
- [ ] Stop any running instances
- [ ] Start Phase 3C with conservative JVM flag

**Task 2.2: Performance Validation**
```bash
# Run 5 performance tests
for i in {1..5}; do
  echo "Test $i:"
  curl http://dlt.aurigraph.io:9003/api/v11/performance
  sleep 10
done
```

**Task 2.3: Analysis**
- [ ] Calculate average TPS from 5 runs
- [ ] Compare to Phase 1 baseline (1,143,802 TPS)
- [ ] Check for variability/stability
- [ ] Document CPU, memory, GC metrics

**Expected Outcomes**:
- **Best case**: 1.2M - 1.25M TPS (+5-10% improvement)
- **Acceptable**: 1.14M - 1.19M TPS (stable, no regression)
- **Rejection criteria**: <1.1M TPS (regression)

### Deliverables
- ✅ Phase 3C test results (5 iterations)
- ✅ Decision: Keep or revert to Phase 1
- ✅ Updated `SPRINT12_EXECUTION_REPORT.md`

---

## Priority 3: Real-World Profiling Framework (Days 3-4)

### Objective
Establish production-like profiling capability for data-driven optimization in Sprint 13+.

### Tasks

**Task 3.1: JFR Setup**
```bash
# Enable Java Flight Recorder on remote server
java -XX:StartFlightRecording=duration=30m,filename=/tmp/aurigraph-profile.jfr \
     -jar aurigraph-v11-standalone-11.3.4-PHASE1-runner.jar
```

**Task 3.2: Profiling Session**
- [ ] Run 30-minute profiling session with realistic workload
- [ ] Download JFR file: `scp subbu@dlt.aurigraph.io:/tmp/aurigraph-profile.jfr .`
- [ ] Analyze with JDK Mission Control or async-profiler

**Task 3.3: Alternative: async-profiler**
```bash
# Install async-profiler on remote server
wget https://github.com/async-profiler/async-profiler/releases/download/v2.9/async-profiler-2.9-linux-x64.tar.gz
tar -xzf async-profiler-2.9-linux-x64.tar.gz

# Profile running Aurigraph instance
./profiler.sh -d 30 -f /tmp/flamegraph.html <PID>
```

**Task 3.4: Analysis Goals**
- [ ] Identify top 3 CPU hotspots
- [ ] Measure actual BlockingQueue poll impact
- [ ] Validate ConcurrentHashMap contention levels
- [ ] Document memory allocation patterns

### Deliverables
- ✅ JFR or async-profiler flame graph
- ✅ Top 3 optimization opportunities documented
- ✅ Profiling procedure documented for future sprints
- ✅ Baseline metrics for Sprint 13 planning

---

## Sprint 12 Timeline

### Week 1 (Days 1-2)
- **Day 1 Morning**: Investigate native compilation blocker
- **Day 1 Afternoon**: Fix pom.xml/native-image configuration
- **Day 2 Morning**: Build and deploy native binary
- **Day 2 Afternoon**: Test native performance (5 iterations)

### Week 1 (Days 2-3)
- **Day 2 Evening**: Deploy Phase 3C to remote server
- **Day 3 Morning**: Run Phase 3C performance tests
- **Day 3 Afternoon**: Analyze results, make keep/revert decision

### Week 1 (Days 3-4)
- **Day 3 Evening**: Set up JFR/async-profiler
- **Day 4 Morning**: Run 30-minute profiling session
- **Day 4 Afternoon**: Analyze profiles, identify top opportunities
- **Day 4 Evening**: Generate Sprint 12 final report

---

## Risk Mitigation

### Risk 1: Native Build Still Fails
**Mitigation**: Have 3 solution options (A/B/C) ready. If all fail, defer to Sprint 13 and focus on Phase 3C + profiling.

### Risk 2: Phase 3C Shows No Improvement
**Mitigation**: This is acceptable - validates Phase 1 baseline. Document findings and move to profiling-based optimization.

### Risk 3: Profiling Shows No Clear Bottlenecks
**Mitigation**: Adjust workload to be more realistic. Consider distributed load testing.

---

## Success Metrics

### Performance Goals
- **Minimum**: No regression vs 1.14M TPS baseline
- **Target**: 1.4M TPS with native compilation
- **Stretch**: 1.5M TPS with native + Phase 3C combined

### Quality Goals
- All changes validated with 5+ test iterations
- Variability < 10% across tests
- No GC thrashing (CPU < 30% in GC)
- Comprehensive documentation of all findings

### Knowledge Goals
- Native compilation process documented and repeatable
- Profiling framework operational
- Sprint 13 roadmap based on real profiling data
- Team learnings documented

---

## Sprint 12 Deliverables

### Code & Artifacts
- [ ] Native binary (if successful)
- [ ] Phase 3C test results
- [ ] JFR/flame graph files
- [ ] Updated pom.xml (native fix)

### Documentation
- [ ] `SPRINT12_EXECUTION_REPORT.md` (comprehensive)
- [ ] `NATIVE_BUILD_RESOLUTION.md` (if successful)
- [ ] `PROFILING_SETUP_GUIDE.md`
- [ ] Updated `TODO.md`

### Decision Log
- [ ] Native compilation: Success or defer to Sprint 13
- [ ] Phase 3C: Keep or revert to Phase 1
- [ ] Sprint 13 priorities based on profiling data

---

## Lessons from Sprint 11 (Applied to Sprint 12)

1. ✅ **One Change at a Time**: Each priority tests single variable
2. ✅ **Profile Before Optimizing**: Priority 3 establishes data-driven approach
3. ✅ **Validate Incrementally**: 5 test iterations minimum per change
4. ✅ **Conservative First**: Phase 3C tests smallest safe change
5. ✅ **Document Blockers**: Native blocker gets full investigation before retrying

---

**Plan Status**: Ready for Execution
**Expected Duration**: 4 days
**Next Review**: After Priority 1 completion
**Sprint 13 Planning**: Based on Sprint 12 profiling results
